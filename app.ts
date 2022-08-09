import { PURL } from "./namespaces";
import {
  executeDeleteInsertQuery,
  fetchState,
  updateState,
} from "./sparql-queries";

import { DataFactory } from "n3";
import * as RDF from "rdf-js";
import Consumer, { Member } from "ldes-consumer";
import { convertBlankNodes, extractBaseResourceUri } from "./utils";
import { CronJob } from 'cron';
import { CRON_PATTERN, LDES_ENDPOINT_VIEW, REPLACE_VERSIONS } from "./config";
const { quad, variable } = DataFactory;

async function processMember(member: Member) {
  const quadsToAdd: RDF.Quad[] = member.quads;
  const quadsToRemove: RDF.Quad[] = [];
  const baseResourceUri = extractBaseResourceUri(member);
  if (baseResourceUri && REPLACE_VERSIONS) {
    quadsToRemove.push(
      quad(variable("s"), PURL("isVersionOf"), baseResourceUri)
    );
    quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")))
  }
  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
}

let taskIsRunning = false;

const consumerJob = new CronJob(CRON_PATTERN, async () => {
  try {
    if(taskIsRunning) {
      console.log("Another task is still running");
      return;
    }
    taskIsRunning = true;
    const initialState = await fetchState();
    const endpoint = LDES_ENDPOINT_VIEW;
    if (endpoint) {
      const consumer = new Consumer({
        endpoint,
        initialState,
      });
      consumer.listen(async (member, state) => {
        try{
          convertBlankNodes(member.quads); 
          await processMember(member);
          await updateState(state);
        } catch (e) {
          console.error(`Something went wrong when processing the member: ${e}`);
        }
      }, () => taskIsRunning = false);
    } else {
      throw new Error("No endpoint provided");
    }
  } catch (e) {
    console.error(e); 
  }
})

consumerJob.start();
