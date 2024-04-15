import { CronJob } from "cron";
import {
  CRON_PATTERN,
  LDES_DEREFERENCE_MEMBERS,
  LDES_ENDPOINT_VIEW, LDES_LOGGING_LEVEL,
  LDES_POLLING_INTERVAL,
  LDES_REQUESTS_PER_MINUTE,
  LDES_STREAM,
  logConfig,
  RUNONCE,
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

logConfig()
validateConfig();

consumerJob.start();
