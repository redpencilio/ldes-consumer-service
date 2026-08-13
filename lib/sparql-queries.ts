import type * as RDF from "@rdfjs/types";
import { extractEndpointHeadersFromEnv, toString } from "./utils.ts";
import {
  MU_APPLICATION_GRAPH,
  SPARQL_AUTH_USER,
  SPARQL_AUTH_PASSWORD,
  SPARQL_ENDPOINT_HEADER_PREFIX,
  SPARQL_BATCH_SIZE,
  ENABLE_SPARQL_BATCHING
} from "../cfg.ts";

 
// eslint-disable-next-line n/no-missing-import
import { update as muUpdate, query as muQuery } from './utils/sparql.js'

const SPARQL_ENDPOINT_HEADERS = extractEndpointHeadersFromEnv(SPARQL_ENDPOINT_HEADER_PREFIX);

function constructTriplesString (quads: RDF.Quad[]) {
  const triplesString = quads.map(toString)
    .filter((item, index, array) => array.indexOf(item) === index)
    .join("\n        ");
  return triplesString;
}

export function constructInsertQuery (quads: RDF.Quad[]) {
  const triplesString = constructTriplesString(quads);
  const sparqlQuery = `INSERT DATA {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparqlQuery;
}

export function constructDeleteQuery (quads: RDF.Quad[]) {
  const triplesString = constructTriplesString(quads);
  const sparqlQuery = `DELETE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
          ${triplesString}
    }
} WHERE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparqlQuery;
}

export function constructSelectQuery (
  variables: RDF.Variable[],
  quads: RDF.Quad[],
  orderBy?: string
) {
  const triplesString = constructTriplesString(quads);
  const variablesString = variables.map(toString).join(" ");
  const sparqlQuery = `
    SELECT DISTINCT ${variablesString} WHERE {
      GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
      }
    }
    ${orderBy ? orderBy : ''}`;
  return sparqlQuery;
}

export async function update (queryStr: string) {
  const headers : Record<string, number | string | string[]> = SPARQL_ENDPOINT_HEADERS ?? {};
  if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
    headers['Authorization'] = btoa(SPARQL_AUTH_USER + ':' + SPARQL_AUTH_PASSWORD); 
  }
  return await muUpdate(queryStr, { extraHeaders: headers, sudo: true })
}

 
export async function query (queryStr: string) {
  const headers : Record<string, number | string | string[]> = SPARQL_ENDPOINT_HEADERS ?? {};
  if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
    headers['Authorization'] = btoa(SPARQL_AUTH_USER + ':' + SPARQL_AUTH_PASSWORD); 
  }
  return await muQuery(queryStr, { extraHeaders: headers, sudo: true });
}

export async function executeInsertQuery (quads: RDF.Quad[]) {
  let nBatches;
  let batchSize;
  if (ENABLE_SPARQL_BATCHING) {
    nBatches = Math.floor(quads.length / SPARQL_BATCH_SIZE) + ((quads.length % SPARQL_BATCH_SIZE) ? 1 : 0);
    batchSize = SPARQL_BATCH_SIZE;
  } else {
    nBatches = quads.length ? 1 : 0;
    batchSize = quads.length;
  }

  for (let index = 0; index < nBatches; index++) {
    const iQuads = index * batchSize;
    const quadsBatch = quads.slice(iQuads, iQuads + batchSize);
    const queryStr = constructInsertQuery(quadsBatch);
    await update(queryStr);
  }
}

export async function executeDeleteQuery (quads: RDF.Quad[]) {
  let nBatches;
  let batchSize;
  if (ENABLE_SPARQL_BATCHING) {
    nBatches = Math.floor(quads.length / SPARQL_BATCH_SIZE) + ((quads.length % SPARQL_BATCH_SIZE) ? 1 : 0);
    batchSize = SPARQL_BATCH_SIZE;
  } else {
    nBatches = quads.length ? 1 : 0;
    batchSize = quads.length;
  }
  for (let index = 0; index < nBatches; index++) {
    const iQuads = index * batchSize;
    const quadsBatch = quads.slice(iQuads, iQuads + batchSize);
    const queryStr = constructDeleteQuery(quadsBatch);
    await update(queryStr);
  }
}

export async function executeDeleteInsertQuery (
  quadsToDelete: RDF.Quad[],
  quadsToInsert: RDF.Quad[]
) {
  await executeDeleteQuery(quadsToDelete);
  await executeInsertQuery(quadsToInsert);
}