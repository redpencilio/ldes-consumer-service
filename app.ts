import { newEngine } from "@treecg/actor-init-ldes-client";
import { Quad } from "n3";
import { purl } from "./namespaces";
import {
  executeDeleteInsertQuery,
  getEndTime,
  replaceEndTime,
} from "./sparql-queries";

import { DataFactory } from "n3";
import PromiseQueue from "./promise-queue";
import { NamedNode } from "rdf-js";
const { quad, namedNode, variable } = DataFactory;

const QUEUE_MAP: Map<string, PromiseQueue<void>> = new Map();
const UPDATE_QUEUE: PromiseQueue<void> = new PromiseQueue<void>();
let TIMESTAMP_QUEUE: PromiseQueue<void> = new PromiseQueue<void>();

function extractTimeStamp(member) {
  const timeStamp: Quad = member.quads.find(
    (quadObj) => quadObj.predicate.value === process.env.LDES_RELATION_PATH
  );
  return timeStamp.object;
}

function extractBaseResourceUri(member): NamedNode {
  const baseResourceMatches = member.quads.filter((quadObj) =>
    quadObj.predicate.equals(purl("isVersionOf"))
  );
  if (baseResourceMatches && baseResourceMatches.length) {
    return baseResourceMatches[0].object;
  }
  return;
}

async function processMember(member) {
  console.log("process start");
  const quadsToAdd: Quad[] = member.quads.filter(
    (quadObj) => quadObj.subject.value === member.id.value
  );
  const quadsToRemove: Quad[] = [];
  const baseResourceUri = extractBaseResourceUri(member);
  if (baseResourceUri && process.env.REPLACE_VERSIONS) {
    quadsToRemove.push(
      quad(variable("s"), purl("isVersionOf"), baseResourceUri)
    );
    quadsToAdd.forEach((quadObj, i) => {
      quadsToRemove.push(
        quad(variable("s"), quadObj.predicate, variable(`o${i}`))
      );
    });
  }

  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  await processTimeStamp(member);
  console.log("process end");
}

async function processTimeStamp(member) {
  try {
    let timestamp = extractTimeStamp(member);
    if (timestamp) {
      await replaceEndTime(timestamp);
    }
  } catch (e) {
    throw e;
  }
}

async function main() {
  try {
    const endTime = await getEndTime();
    console.log("Start time: ", endTime);
    let url = process.env.LDES_ENDPOINT_VIEW;
    let options = {
      pollingInterval: parseInt(process.env.LDES_POLLING_INTERVAL), // millis
      representation: "Quads", //Object or Quads
      fromTime: endTime,
      mimeType: "application/ld+json",
      emitMemberOnce: true,
    };
    let LDESClient = new newEngine();

    let eventstreamSync = LDESClient.createReadStream(url, options);
    eventstreamSync.on("data", (member) => {
      const baseResourceUri = extractBaseResourceUri(member);
      if (baseResourceUri) {
        UPDATE_QUEUE.push(() => processMember(member));
      }
    });
  } catch (e) {
    console.error(e);
  }
}

main();
