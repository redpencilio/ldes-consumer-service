import {
  executeDeleteInsertQuery,
  fetchState,
  updateState,
  getLatestTimestamp
} from "./sparql-queries";
import { DataFactory } from "n3";
import * as RDF from "@rdfjs/types";
import Consumer, { Member } from "ldes-consumer";
import { TreeProperties, convertBlankNodes, extractBaseResourceUri, extractVersionTimestamp, extractEndpointHeadersFromEnv, getSameAsForObject, getSameAsForSubject } from "./utils";
import { CronJob } from "cron";
import {
  RUNONCE,
  CRON_PATTERN,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
  LDES_ENDPOINT_HEADER_PREFIX,
  LDES_ENDPOINT_VIEW,
  REPLACE_VERSIONS,
  LDES_STREAM,
  REPLACE_BLANK_NODES,
  BLANK_NODE_DATA_TYPE,
  ENABLE_SPARQL_BATCHING,
  SPARQL_BATCH_SIZE
} from "./config";
const { quad, namedNode, variable } = DataFactory;

const latestVersionMap: Map<RDF.NamedNode, Date> = new Map();

let taskIsRunning = false;

async function latestVersionTimestamp(resource: RDF.NamedNode, treeProperties: TreeProperties): Promise<Date | null> {
  if (latestVersionMap.has(resource)) {
    return latestVersionMap.get(resource)!;
  } else {
    const timestampStr = await getLatestTimestamp(resource, treeProperties);
    if (timestampStr) {
      const timestamp: Date = new Date(timestampStr);
      latestVersionMap.set(resource, timestamp);
      return timestamp;
    }
    return null;
  }
}

async function processMember(member: Member, sameAsMap: Map<RDF.NamedNode, RDF.NamedNode>, treeProperties: TreeProperties) {
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

  if (REPLACE_BLANK_NODES) {
    const sameAsQuadsToAdd: RDF.Quad[] = [];
    const sameAsQuadsToRemove: RDF.Quad[] = [];
    sameAsMap.forEach((value, key) => {
      const sameAsForObject = getSameAsForObject(member, key);
      sameAsForObject.forEach((q) => {
        sameAsQuadsToRemove.push(quad(q.subject, q.predicate, q.object));
        sameAsQuadsToAdd.push(quad(q.subject, q.predicate, value));
      });

      const sameAsForSubject = getSameAsForSubject(member, key);
      sameAsForSubject.forEach((q) => {
        sameAsQuadsToRemove.push(quad(q.subject, q.predicate, q.object));
        sameAsQuadsToAdd.push(quad(value, q.predicate, q.object));
      });
    });

    await executeDeleteInsertQuery(sameAsQuadsToRemove, sameAsQuadsToAdd);
  } 
}

async function run(callback: Function) {
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
          const conversionResult = convertBlankNodes(member.quads);
          member.quads = conversionResult.quads;
          await processMember(member, conversionResult.sameAsMap, treeProperties);
        } catch (e) {
          console.error(
            `Something went wrong when processing the member: ${e}`
          );
          console.error(e.stack);
        }
      },
      async (state) => {
        console.log('CONSUMER DONE');
        await updateState(stream, state);
        callback();
      }
    );
  } else {
    throw new Error("No endpoint provided");
  }
};

const consumerJob = new CronJob(CRON_PATTERN, async () => {
  await startJob();
});

async function startJob() {
  try {
    if (taskIsRunning) {
      console.log("Another task is still running");
      return;
    } else {
      taskIsRunning = true;
      run(function () {
        taskIsRunning = false;
        if (RUNONCE) {
          process.exit();
        }
      });
    }
  } catch (e) {
    taskIsRunning = false;
    console.error(e);
  }
}

async function init() {
  if (RUNONCE) {
    console.log("Start job once");
    startJob();
  } else {
    console.log("Start cronjob");
    consumerJob.start();
  }

}

init();

console.log("config", {
  RUNONCE,
  CRON_PATTERN,
  LDES_VERSION_OF_PATH,
  LDES_TIMESTAMP_PATH,
  LDES_ENDPOINT_VIEW,
  REPLACE_VERSIONS,
  REPLACE_BLANK_NODES,
  BLANK_NODE_DATA_TYPE,
  ENABLE_SPARQL_BATCHING,
  SPARQL_BATCH_SIZE
});
