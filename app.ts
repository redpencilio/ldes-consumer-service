import {
  executeDeleteInsertQuery,
  fetchState,
  updateState,
  getLatestTimestamp
} from "./sparql-queries";

import { DataFactory } from "n3";
import * as RDF from "@rdfjs/types";
import Consumer, { Member } from "ldes-consumer";
import { TreeProperties, convertBlankNodes, extractBaseResourceUri, extractVersionTimestamp, extractEndpointHeadersFromEnv } from "./utils";
import { CronJob } from "cron";
import {
  CRON_PATTERN,
  LDES_DEREFERENCE_MEMBERS,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW,
  LDES_POLLING_INTERVAL,
  LDES_REQUESTS_PER_MINUTE,
  LDES_STREAM,
  LDES_TIMESTAMP_PATH,
  LDES_VERSION_OF_PATH,
  REPLACE_VERSIONS,
  RUNONCE
} from "./config";
const { quad, variable, namedNode } = DataFactory;

const latestVersionMap : Map<RDF.NamedNode, Date> = new Map();

async function latestVersionTimestamp (resource: RDF.NamedNode, treeProperties: TreeProperties): Promise<Date | null> {
  if (latestVersionMap.has(resource)) {
    return latestVersionMap.get(resource)!;
  } else {
    const timestampStr = await getLatestTimestamp(resource, treeProperties);
    if (timestampStr) {
      const timestamp : Date = new Date(timestampStr);
      latestVersionMap.set(resource, timestamp);
      return timestamp;
    }
    return null;
  }
}

async function processMember (member: Member, treeProperties: TreeProperties) {
  let quadsToAdd: RDF.Quad[] = [];
  const quadsToRemove: RDF.Quad[] = [];
  const baseResourceUri = extractBaseResourceUri(member, treeProperties);
  if (baseResourceUri && REPLACE_VERSIONS) {
    const latestTimestamp = await latestVersionTimestamp(baseResourceUri, treeProperties);
    const versionTimestamp = extractVersionTimestamp(member, treeProperties);
    if (latestTimestamp === null) {
      quadsToAdd = member.quads;
      if (versionTimestamp) {
        latestVersionMap.set(baseResourceUri, versionTimestamp);
      }
    } else if (latestTimestamp && versionTimestamp && versionTimestamp > latestTimestamp) {
      quadsToRemove.push(
        quad(variable("s"), treeProperties.versionOfPath, baseResourceUri)
      );
      quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
      if (versionTimestamp) {
        latestVersionMap.set(baseResourceUri, versionTimestamp);
      }
      quadsToAdd = member.quads;
    }
  } else {
    quadsToAdd = member.quads;
  }
  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
}

let taskIsRunning = false;

const consumerJob = new CronJob(CRON_PATTERN, async () => {
  try {
    if (taskIsRunning) {
      console.log("Another task is still running");
      return;
    }
    taskIsRunning = true;
    const stream = namedNode(LDES_STREAM);
    const initialState = await fetchState(stream);
    const endpoint = LDES_ENDPOINT_VIEW;
    console.log("RUN CONSUMER");
    const ldesOptions = {
      dereferenceMembers: LDES_DEREFERENCE_MEMBERS,
      disablePolling: RUNONCE,
      pollingInterval: LDES_POLLING_INTERVAL
    };
    if (LDES_REQUESTS_PER_MINUTE) {
      ldesOptions.requestsPerMinute = LDES_REQUESTS_PER_MINUTE;
    }
    if (endpoint) {
      const consumer = new Consumer({
        endpoint,
        initialState,
        requestHeaders: extractEndpointHeadersFromEnv(LDES_ENDPOINT_HEADER_PREFIX),
        ldesOptions
      });
      // TODO: treeproperties are loaded from config for now, but we should also check the LDES metadata
      const treeProperties = {
        versionOfPath: LDES_VERSION_OF_PATH,
        timestampPath: LDES_TIMESTAMP_PATH
      };
      consumer.listen(
        async (member) => {
          try {
            member.quads = convertBlankNodes(member.quads);
            await processMember(member, treeProperties);
          } catch (e) {
            console.error(
              `Something went wrong when processing the member: ${e}`
            );
            // @ts-ignore
            console.error(e.stack);
          }
        },
        async (state) => {
          console.log("CONSUMER DONE");
          await updateState(stream, state);
          taskIsRunning = false;
          // Shutdown process when running as a Job.
          if (RUNONCE) {
            console.log("Job is complete.");
            process.exit();
          }
        }
      );
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
  REPLACE_VERSIONS,
  RUNONCE
});

consumerJob.start();
