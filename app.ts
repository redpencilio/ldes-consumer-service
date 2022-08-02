import { PURL } from "./namespaces";
import {
  executeDeleteInsertQuery,
  fetchState,
  replaceEndTime,
} from "./sparql-queries";


import { DataFactory } from "n3";
import * as RDF from "rdf-js";
import Consumer, {  Member } from "./consumer";
const { quad, variable, namedNode } = DataFactory;

function extractBaseResourceUri(member: Member): RDF.NamedNode | undefined {
  const baseResourceMatches = member.quads.filter((quadObj) =>
    quadObj.predicate.equals(PURL("isVersionOf"))
  );
  if (baseResourceMatches && baseResourceMatches.length) {
    return baseResourceMatches[0].object as RDF.NamedNode;
  }
  return;
}

async function processMember(member: Member) {
  const quadsToAdd: RDF.Quad[] = member.quads.filter(
    (quadObj) => quadObj.subject.value === member.id.value
  );
  const quadsToRemove: RDF.Quad[] = [];
  const baseResourceUri = extractBaseResourceUri(member);
  if (baseResourceUri && process.env.REPLACE_VERSIONS) {
    quadsToRemove.push(
      quad(variable("s"), PURL("isVersionOf"), baseResourceUri)
    );
    quadsToAdd.forEach((quadObj, i) => {
      quadsToRemove.push(
        quad(variable("s"), quadObj.predicate, variable(`o${i}`))
      );
    });
  }
  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
}

async function main() {
  try {
    const initialState = await fetchState();
    const endpoint = process.env.LDES_ENDPOINT_VIEW;
    if(endpoint){
      const consumer = new Consumer({ endpoint, initialState })
      consumer.listen(async (member, state) => {
        await processMember(member);
        if(state.timestamp){
          await replaceEndTime(namedNode(state.timestamp.toString()));
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
