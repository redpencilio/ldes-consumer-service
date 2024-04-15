import { CronJob } from "cron";
import {
  CRON_PATTERN, ENABLE_SPARQL_BATCHING,
  LDES_DEREFERENCE_MEMBERS,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW, LDES_LOGGING_LEVEL,
  LDES_POLLING_INTERVAL,
  LDES_REQUESTS_PER_MINUTE,
  LDES_STREAM,
  LDES_TIMESTAMP_PATH,
  LDES_VERSION_OF_PATH,
  MU_APPLICATION_GRAPH,
  PERSIST_STATE,
  REPLACE_VERSIONS,
  RUNONCE,
  SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA,
  SPARQL_BATCH_SIZE,
  validateConfig
} from "./config";
import LdesPipeline, { ConfigurableLDESOptions } from "./ldes-pipeline";
import { NamedNode } from "n3";
let taskIsRunning = false;

const consumerJob = new CronJob(CRON_PATTERN, async () => {
  if (taskIsRunning) {
    console.log("Another task is still running");
    return;
  }
  try {
    taskIsRunning = true;
    const endpoint = LDES_ENDPOINT_VIEW;
    if (endpoint) {
      const ldesOptions: ConfigurableLDESOptions = {
        dereferenceMembers: LDES_DEREFERENCE_MEMBERS,
        pollingInterval: LDES_POLLING_INTERVAL,
        loggingLevel: LDES_LOGGING_LEVEL,
      };
      if (LDES_REQUESTS_PER_MINUTE) {
        ldesOptions.requestsPerMinute = LDES_REQUESTS_PER_MINUTE;
      }
      const datasetIri = new NamedNode(LDES_STREAM);
      const consumer = new LdesPipeline({ datasetIri, endpoint, ldesOptions });
      console.log("Started processing " + endpoint);
      await consumer.consumeStream();
      console.log("Finished processing " + endpoint);
      if (RUNONCE) {
        console.log("Job is complete.");
        process.exit();
      }
    } else {
      throw new Error("No endpoint provided");
    }
  } catch (e) {
    console.error(e);
  } finally {
    taskIsRunning = false;
  }
});

console.log("config", {
  CRON_PATTERN,
  LDES_DEREFERENCE_MEMBERS,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW,
  LDES_POLLING_INTERVAL,
  LDES_REQUESTS_PER_MINUTE,
  LDES_STREAM,
  LDES_TIMESTAMP_PATH,
  LDES_VERSION_OF_PATH,
  LDES_LOGGING_LEVEL,
  MU_APPLICATION_GRAPH,
  REPLACE_VERSIONS,
  SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA,
  RUNONCE,
  SPARQL_BATCH_SIZE,
  ENABLE_SPARQL_BATCHING,
  PERSIST_STATE
});

validateConfig();

consumerJob.start();
