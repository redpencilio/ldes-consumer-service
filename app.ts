import fs from 'fs';
import { enhanced_fetch, LDESInfo, replicateLDES } from 'ldes-client';
import {
  INGEST_MODE,
  REPLACE_VERSIONS,
  PERSIST_STATE,
  LDES_ENDPOINT_VIEW,
  LDES_POLLING_INTERVAL,
  LDES_INFO_REQUEST_TIMEOUT,
  RUN_ONCE,
  NODE_ENV,
  logConfig,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
} from './cfg';
import { waitForDatabase } from './lib/database-helpers';
import { memberProcessor } from './lib/member-processor';
import { customFetch } from './lib/fetch/custom-fetch';
import { getLoggerFor } from './lib/logger';
import { DataFactory } from 'n3';
import { beforeExit } from 'mu';

const { namedNode } = DataFactory;
let ldesClient;

logConfig();

beforeExit( async () => {
  console.log("Cancel LDES stream and persist state...");
  if (ldesClient) {
    await ldesClient.stateFactory.write();
  }
  console.log("Finished cancelling LDES stream.");
});

waitForDatabase(() => {
  if (NODE_ENV === "production") {
    main();
  } else {
    const timeout = 10_000; // Make this configurable?
    console.log(`Starting LDES consumer in ${timeout}ms, connect to your debugger now :)`);
    setTimeout(main, timeout);
  }
});

async function main() {
  let stateFilePath;
  try {
    const url = new URL(LDES_ENDPOINT_VIEW);
    stateFilePath = `/data/${url.host}-state.json`;
  } catch (e: any) {
    throw new Error("Provided endpoint couldn't be parsed as URL, double check your settings.");
  }

  let shapeFile;
  if (fs.existsSync('/config/shape.ttl')) {
    shapeFile = '/config/shape.ttl';
  }
  ldesClient = replicateLDES(
    {
      url: LDES_ENDPOINT_VIEW,
      urlIsView: true,
      polling: !RUN_ONCE,
      pollInterval: LDES_POLLING_INTERVAL,
      stateFile: PERSIST_STATE ? stateFilePath : undefined,
      materialize: INGEST_MODE === 'MATERIALIZE',
      lastVersionOnly: REPLACE_VERSIONS, // Won't emit members if they're known to be older than what is already in the state file
      loose: true, // Make this configurable? IPDC needs this to be true
      shapeFile,
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
    }
  );

  ldesClient.on("error", (error: any) => {
    logger.info("Received an error from the LDES client!");
    logger.error(error);
    logger.error(error.stack);
    process.exit(1);
  })

  // Wrap 'description' event of ldes-client lib in a Promise
  const getLDESInfo = async (): Promise<LDESInfo> => {
    return new Promise(
      (resolve, reject) => {
        // Avoid waiting forever on the 'description' event
        const timer = setTimeout(() => {
          reject(new Error(`Didn't receive LDES feed info in ${LDES_INFO_REQUEST_TIMEOUT}ms. We will stop waiting.`));
        }, LDES_INFO_REQUEST_TIMEOUT);
        ldesClient.on('description', (info: LDESInfo) => {
          clearTimeout(timer);
          resolve(info);
        });
      }
    )
  };

  const logger = getLoggerFor('main');
  logger.info('Starting stream...');
  const ldesStream = ldesClient.stream({ highWaterMark: 10 });
  try {
    logger.info('Waiting for LDES info...');
    const { versionOfPath, timestampPath } = await getLDESInfo();
    if (versionOfPath !== undefined && timestampPath !== undefined) {
      logger.info(`Received LDES info: ${JSON.stringify({ versionOfPath, timestampPath })}`);
    } else if (LDES_VERSION_OF_PATH !== undefined && LDES_TIMESTAMP_PATH !== undefined) {
      logger.info(`LDES feed info contained no versionOfPath & timestampPath, using provided values: ${JSON.stringify({ LDES_VERSION_OF_PATH, LDES_TIMESTAMP_PATH })}`);
    } else {
      throw new Error('LDES feed info contained no versionOfPath & timestampPath and no LDES_VERSION_OF_PATH & LDES_TIMESTAMP_PATH were provided to service, exiting.');
    }

    await ldesStream.pipeTo(
      memberProcessor(
        versionOfPath ?? namedNode(LDES_VERSION_OF_PATH as string),
        timestampPath ?? namedNode(LDES_TIMESTAMP_PATH as string),
      )
    );

    logger.info('Finished processing stream');
    await ldesStream.cancel();
  } catch (e) {
    logger.error('Processing stream failed');
    logger.error(e);
    await ldesStream.cancel();
    process.exit(1);
  }
}
