import { PURL } from "./namespaces";
import {
  executeDeleteInsertQuery,
  fetchState,
  updateState,
} from "./sparql-queries";

import { DataFactory } from "n3";
import * as RDF from "rdf-js";
import Consumer, { Member } from "ldes-consumer";
import { convertBlankNodes, extractBaseResourceUri, extractEndpointHeadersFromEnv } from "./utils";
import { CronJob } from "cron";
import ping from "ping";
import {
  CRON_PATTERN,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW,
  REPLACE_VERSIONS,
} from "./config";
const { quad, variable } = DataFactory;

async function processMember(member: Member) {
  const quadsToAdd: RDF.Quad[] = member.quads;
  const quadsToRemove: RDF.Quad[] = [];
  const baseResourceUri = extractBaseResourceUri(member);
  if (baseResourceUri && REPLACE_VERSIONS) {
    quadsToRemove.push(
      quad(variable("s"), PURL("isVersionOf"), baseResourceUri)
    );
    quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
  }
  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
}

const endpoint = LDES_ENDPOINT_VIEW;
let taskIsRunning = false;

const consumerJob = new CronJob(CRON_PATTERN, async () => {
  try {
    if (taskIsRunning) {
      console.log("Another task is still running");
      return;
    }
    taskIsRunning = true;
    const initialState = await fetchState();
    console.log('RUN CONSUMER');
    if (endpoint) {
      const consumer = new Consumer({
        endpoint,
        initialState,
        requestHeaders: extractEndpointHeadersFromEnv(LDES_ENDPOINT_HEADER_PREFIX)
      });
      consumer.listen(
        async (member) => {
          try {
            convertBlankNodes(member.quads);
            await processMember(member);

          } catch (e) {
            console.error(
              `Something went wrong when processing the member: ${e}`
            );
          }
        },
        async (state) =>  {
          console.log('CONSUMER DONE');
          await updateState(state);
          taskIsRunning = false;
        }
      );
    } else {
      throw new Error("No endpoint provided");
    }
  } catch (e) {
    console.error(e);
  }
});

let restartAttemptsDone = 0
const RESTART_ATTEMPTS_THRESHOLD = 5

const endpointWatchJob = new CronJob(CRON_PATTERN, async () => {
  const endpointHost = new URL(endpoint!).host;

  const result = await ping.promise.probe(endpointHost, {
    timeout: 10
  });

  if (!result.alive) {
    if (restartAttemptsDone > RESTART_ATTEMPTS_THRESHOLD) {
      console.log('Reached restart attempt threshold, terminating consumer')
      process.kill(process.pid, 'SIGINT');
      return
    }

    console.error(`Endpoint host ${endpointHost} is not responding, attempting to restart consumer job`);
    restartAttemptsDone += 1
    consumerJob.stop()
    taskIsRunning = false
    consumerJob.start()
  }
})

if (!endpoint) {
  throw new Error('No endpoint provided')
} else {
  consumerJob.start();
  endpointWatchJob.start()
}
