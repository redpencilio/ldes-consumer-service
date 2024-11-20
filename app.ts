import { enhanced_fetch, intoConfig, LDESInfo, replicateLDES } from 'ldes-client';
import {
  INGEST_MODE,
  REPLACE_VERSIONS,
  PERSIST_STATE,
  LDES_ENDPOINT_VIEW,
  LDES_POLLING_INTERVAL,
  RUN_ONCE,
  NODE_ENV,
  logConfig,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
} from "./cfg";
import { memberProcessor } from './lib/member-processor';
import { custom_fetch } from './lib/fetch/custom-fetch';
import { getLoggerFor } from './lib/logger';
import { DataFactory } from "n3";

const { namedNode } = DataFactory;

logConfig();

if (NODE_ENV === "production") {
  main();
} else {
  const timeout = 10_000; // Make this configurable?
  console.log(`Starting LDES consumer in ${timeout}ms, connect to your debugger now :)`);
  setTimeout(main, timeout);
}

async function main() {
  let stateFilePath;
  try {
    const url = new URL(LDES_ENDPOINT_VIEW);
    stateFilePath = `/data/${url.host}-state.json`;
  } catch (e: any) {
    throw new Error("Provided endpoint couldn't be parsed as URL, double check your settings.");
  }

  const client = replicateLDES(
    intoConfig({
      url: LDES_ENDPOINT_VIEW,
      urlIsView: true,
      polling: !RUN_ONCE,
      pollInterval: LDES_POLLING_INTERVAL,
      stateFile: PERSIST_STATE ? stateFilePath : undefined,
      materialize: INGEST_MODE === 'MATERIALIZE',
      lastVersionOnly: REPLACE_VERSIONS, // Won't emit members if they're known to be older than what is already in the state file
      loose: true, // Make this configurable? IPDC needs this to be true
      fetch: enhanced_fetch({
        /* In comment are the default values, perhaps we want to make these configurable
        concurrent: 10, // Amount of concurrent requests to a single domain
        retry: {
          codes: [408, 425, 429, 500, 502, 503, 504], // Which faulty HTTP status codes will trigger retry
          base: 500, // Seems to be unused in the client code
          maxRetries: 5,
        }*/
      }, custom_fetch),

    }),
    "none",
  );

  const getLDESInfo = async (): Promise<LDESInfo> => {
    return new Promise(
      (resolve, reject) => {
        try {
          client.on('description', (info: LDESInfo) => {
            resolve(info);
          });
        } catch (e) {
          reject(e);
        }
      }
    )
  };

  const logger = getLoggerFor('main');
  try {
    logger.info('Starting stream...');

    const ldesStream = client.stream({ highWaterMark: 10 });

    logger.info('Waiting for LDES info...');
    const { isVersionOfPath: versionOfPath, timestampPath } = await getLDESInfo();
    if (versionOfPath !== undefined && timestampPath !== undefined) {
      logger.info(`Received LDES info: ${JSON.stringify({ versionOfPath, timestampPath })}`);
    } else if (LDES_VERSION_OF_PATH !== undefined && LDES_TIMESTAMP_PATH !== undefined) {
      logger.info(`LDES feed info contained no versionOfPath & timestampPath, using provided values: ${JSON.stringify({ LDES_VERSION_OF_PATH, LDES_TIMESTAMP_PATH })}`);
    } else {
      ldesStream.cancel();
      throw new Error('LDES feed info contained no versionOfPath & timestampPath and no LDES_VERSION_OF_PATH & LDES_TIMESTAMP_PATH were provided to service, exiting.');
    }

    await ldesStream.pipeTo(
      memberProcessor(
        versionOfPath ?? namedNode(LDES_VERSION_OF_PATH as string),
        timestampPath ?? namedNode(LDES_TIMESTAMP_PATH as string),
      )
    );

    logger.info('Finished processing stream');
  } catch (e) {
    logger.error('Processing stream failed');
    logger.error(e);
  }
}