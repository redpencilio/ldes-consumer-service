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
  RUNONCE,
  CRON_PATTERN,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW,
  REPLACE_VERSIONS,
  LDES_STREAM
} from "./config";
const { quad, variable } = DataFactory;

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
    }
    else if (latestTimestamp && versionTimestamp && versionTimestamp > latestTimestamp) {
      quadsToRemove.push(
        quad(variable("s"), treeProperties.versionOfPath, baseResourceUri)
      );
      quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
      if (versionTimestamp) {
        latestVersionMap.set(baseResourceUri, versionTimestamp);
      }
      quadsToAdd = member.quads;
    }
  }
  else {
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
    console.log('RUN CONSUMER');
    if (endpoint) {
      const consumer = new Consumer({
        endpoint,
        initialState,
        requestHeaders: extractEndpointHeadersFromEnv(LDES_ENDPOINT_HEADER_PREFIX)
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
            console.error(e.stack);
          }
        },
        async (state) =>  {
          console.log('CONSUMER DONE');
          await updateState(stream, state);
          taskIsRunning = false;
          // Shutdown process when running as a Job.
          if (RUNONCE) {
            console.log('Job is complete.');
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

console.log("config", {   RUNONCE,
                          CRON_PATTERN,
                          LDES_VERSION_OF_PATH,
                          LDES_TIMESTAMP_PATH,
                          LDES_ENDPOINT_VIEW,
                          REPLACE_VERSIONS,
                      });


consumerJob.start();
