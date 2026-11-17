import fs from "fs";
import {
  Client,
  ClientEvents,
  enhanced_fetch,
  replicateLDES,
} from "ldes-client";

import {
  INGEST_MODE,
  PERSIST_STATE,
  LDES_POLLING_INTERVAL,
  RUN_ONCE,
  NODE_ENV,
  logConfig,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
} from "./cfg.js";
import { waitForDatabase } from "./lib/database-helpers.js";
import { memberProcessor } from "./lib/member-processor.js";
import { createCustomFetch } from "./lib/fetch/custom-fetch.js";
import { getLoggerFor } from "./lib/logger.js";
import { fetchLdesFeedConfigs } from "./lib/ldes-config-repository.js";
import type { LdesFeedConfig } from "./lib/ldes-config-repository.js";
import { DataFactory } from "n3";

// @ts-expect-error no type-declarations for beforeExit
import { beforeExit } from "mu";

const { namedNode } = DataFactory;
const ldesClients: Client[] = [];

logConfig();

beforeExit(async () => {
  console.log("Finished cancelling LDES stream.");
});

waitForDatabase(() => {
  if (NODE_ENV === "production") {
    main();
  } else {
    const timeout = 10_000; // Make this configurable?
    console.log(
      `Starting LDES consumer in ${timeout}ms, connect to your debugger now :)`,
    );
    setTimeout(main, timeout);
  }
});

async function main() {
  const logger = getLoggerFor("main");

  const feedConfigs = await fetchLdesFeedConfigs();
  if (feedConfigs.length === 0) {
    logger.warn("No LDES feed configurations found in the database, nothing to do.");
    return;
  }
  logger.info(`Found ${feedConfigs.length} LDES feed(s): ${feedConfigs.map((c) => c.view).join(", ")}`);

  let shapeFile: string | undefined;
  if (fs.existsSync("/config/shape.ttl")) {
    shapeFile = "/config/shape.ttl";
  }

  // Feeds are consumed sequentially: the next feed is only started
  // once the initial (back)ingest of the previous feed has finished.
  // From that moment on, each feed continues to process in the background.
  for (const feedConfig of feedConfigs) {
    await consumeFeed(feedConfig, shapeFile);
  }
}

async function consumeFeed(
  feedConfig: LdesFeedConfig,
  shapeFile: string | undefined,
): Promise<void> {
  const logger = getLoggerFor(`main(${feedConfig.view})`);

  let statePath;
  try {
    const url = new URL(feedConfig.view);
    statePath = `/data/${url.host}-state/`;
  } catch (_e) {
    throw new Error(`Provided endpoint couldn't be parsed as URL (${feedConfig.view}), double check your settings.`);
  }

  const customFetch = createCustomFetch({
    sanitize: feedConfig.sanitize,
    jwt: feedConfig.jwt,
    endpointHeaders: feedConfig.endpointHeaders,
  });

  const ldesClient = replicateLDES(
    {
      url: feedConfig.view,
      urlIsView: true,
      polling: !RUN_ONCE,
      pollInterval: LDES_POLLING_INTERVAL,
      statePath: PERSIST_STATE ? statePath : undefined,
      materialize: INGEST_MODE === "MATERIALIZE",
      loose: true, // Make this configurable? IPDC needs this to be true
      shapeFile,
      lastVersionOnly: feedConfig.emitLastVersionOnly,
      fetch: enhanced_fetch({
        safe: true, // In case of an exception being thrown by fetch, this will just retry the call in a while (true) loop until it stops throwing? Not great.
        /* In comment are the default values, perhaps we want to make these configurable
      concurrent: 10, // Amount of concurrent requests to a single domain
      retry: {
        codes: [408, 425, 429, 500, 502, 503, 504], // Which faulty HTTP status codes will trigger retry
        base: 500, // Seems to be unused in the client code
        maxRetries: 5,
      }*/
      }, customFetch)
    }, feedConfig.orderingStrategy
  );
  ldesClients.push(ldesClient);

  // @ts-expect-error we should check if we can refine the types of the `on` function
  ldesClient.on("error", (error: Error) => {
    logger.info("Received an error from the LDES client!");
    logger.error(error);
    logger.error(error.stack);
    process.exit(1);
  });

  // Wrap 'description' event of ldes-client lib in a Promise
  const getLDESInfo = async (): Promise<ClientEvents["description"]> => {
    return new Promise((resolve, reject) => {
      // Avoid waiting forever on the 'description' event
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Didn't receive LDES feed info from ${feedConfig.view} in ${feedConfig.infoRequestTimeout}ms. We will stop waiting.`,
          ),
        );
      }, feedConfig.infoRequestTimeout);
      ldesClient.on("description", (info) => {
        clearTimeout(timer);
        resolve(info);
      });
    });
  };

  const ldesStream = ldesClient.stream({ highWaterMark: 10 });
  try {
    logger.info("Waiting for LDES info...");
    const { versionOfPath, timestampPath } = await getLDESInfo();

    const versionOfPathFallback = feedConfig.versionOfPath ?? LDES_VERSION_OF_PATH;
    const timestampPathFallback = feedConfig.timestampPath ?? LDES_TIMESTAMP_PATH;
    if ((versionOfPath === undefined && versionOfPathFallback === undefined) || (timestampPath === undefined && timestampPathFallback === undefined)) {
      throw new Error(
        `LDES feed info of ${feedConfig.view} contained no versionOfPath & timestampPath, and no versionOfPath & timestampPath were configured for the feed (or via deprecated LDES_VERSION_OF_PATH & LDES_TIMESTAMP_PATH environment variables), exiting.`,
      );
    }
    const versionOf = versionOfPath ?? namedNode(versionOfPathFallback as string);
    const timestamp = timestampPath ?? namedNode(timestampPathFallback as string);
    logger.info(
      `Received LDES info from ${feedConfig.view}: ${JSON.stringify({ versionOfPath, timestampPath })}`,
    );

    logger.info("Starting ingest...");
    const processor = memberProcessor(
      versionOf,
      timestamp,
      { replaceVersions: feedConfig.replaceVersions }
    );
    const processed = ldesStream.pipeTo(processor);
    // Fail fast when the member processing pipeline goes wrong in the background
    processed.catch(async (e: unknown) => {
      logger.error("Processing stream failed");
      logger.error(e);
      await ldesStream.cancel();
      process.exit(1);
    });

    // The 'poll' event fires when an entire fetch cycle has drained, i.e.
    // the initial (back)ingest of this feed is complete. When polling is
    // disabled, the stream finishes and the pipeline completes instead.
    await Promise.race([
      new Promise<void>((resolve) => {
        // Note: 'poll' also fires before each subsequent polling cycle
        ldesClient.on("poll", () => resolve());
      }),
      processed,
    ]);

    // await ldesClient.close();

    logger.info(`Finished initial ingest of ${feedConfig.view}`);
    // debugger;
  } catch (e) {
    logger.error("Processing stream failed");
    logger.error(e);
    await ldesStream.cancel();
    process.exit(1);
  }
}
