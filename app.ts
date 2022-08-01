import { purl } from "./namespaces";
import {
  executeDeleteInsertQuery,
  getEndTime,
  replaceEndTime,
} from "./sparql-queries";


import { DataFactory } from "n3";
import PromiseQueue from "./promise-queue";
import * as RDF from "rdf-js";
import Consumer, { Member } from "./consumer";
const { quad, variable } = DataFactory;

const UPDATE_QUEUE: PromiseQueue<void> = new PromiseQueue<void>();

function extractTimeStamp(member: Member) {
  const timeStamp: RDF.Quad = member.quads.find(
    (quadObj) => quadObj.predicate.value === process.env.LDES_RELATION_PATH
  );
  return timeStamp.object;
}

function extractBaseResourceUri(member: Member): RDF.NamedNode | undefined {
  const baseResourceMatches = member.quads.filter((quadObj) =>
    quadObj.predicate.equals(purl("isVersionOf"))
  );
  if (baseResourceMatches && baseResourceMatches.length) {
    return baseResourceMatches[0].object as RDF.NamedNode;
  }
  return;
}

async function processMember(member: Member) {
  console.log("process start");
  const quadsToAdd: RDF.Quad[] = member.quads.filter(
    (quadObj) => quadObj.subject.value === member.id.value
  );
  const quadsToRemove: RDF.Quad[] = [];
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
    const endpoint = process.env.LDES_ENDPOINT_VIEW || "https://ipdc.ipdc.tni-vlaanderen.be/api/conceptsnapshots/ldes/0";
    if(endpoint){
      const endTime = await getEndTime();
      const consumer = new Consumer({ endpoint })
      const stream = consumer.listen(endTime);
      stream.on("data", (member: Member) => {
        const baseResourceUri = extractBaseResourceUri(member);
        if (baseResourceUri) {
          UPDATE_QUEUE.push(() => processMember(member));
        }
      });

    } else {
      throw new Error('No endpoint provided');
    }
    
  } catch (e) {
    console.error(e);
  }
}

main();
