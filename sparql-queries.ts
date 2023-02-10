import * as RDF from "@rdfjs/types";
import { TreeProperties, extractEndpointHeadersFromEnv, toString } from "./utils";
import { DataFactory } from "n3";
import { EXT } from "./namespaces";
import {
  MU_APPLICATION_GRAPH,
  SPARQL_AUTH_USER,
  SPARQL_AUTH_PASSWORD,
  SPARQL_ENDPOINT_HEADER_PREFIX,
  SPARQL_BATCH_SIZE,
  ENABLE_SPARQL_BATCHING
} from "./config";
import { State } from "@treecg/actor-init-ldes-client";
// @ts-ignore
import { querySudo, updateSudo, ConnectionOptions } from "@lblod/mu-auth-sudo";
const { quad, namedNode, variable, literal } = DataFactory;

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
  quads: RDF.Quad[]
) {
  const triplesString = constructTriplesString(quads);
  const variablesString = variables.map(toString).join(" ");
  const sparqlQuery = `SELECT ${variablesString} WHERE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparqlQuery;
}

async function update (queryStr: string) {
  const headers : Record<string, number | string | string[]> = SPARQL_ENDPOINT_HEADERS ?? {};
  const connectionOptions : ConnectionOptions = {};
  if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
    connectionOptions.authUser = SPARQL_AUTH_USER;
    connectionOptions.authPassword = SPARQL_AUTH_PASSWORD;
  }
  return await updateSudo(queryStr, headers, connectionOptions);
}

async function query (queryStr: string) {
  const headers : Record<string, number | string | string[]> = SPARQL_ENDPOINT_HEADERS ?? {};
  const connectionOptions : ConnectionOptions = {};
  if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
    connectionOptions.authUser = SPARQL_AUTH_USER;
    connectionOptions.authPassword = SPARQL_AUTH_PASSWORD;
  }
  return await querySudo(queryStr, headers, connectionOptions);
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
    try {
      await update(queryStr);
    } catch (e) {
      console.error(e);
    }
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
    try {
      await update(queryStr);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function getLatestTimestamp (baseResource: RDF.NamedNode, treeProperties: TreeProperties) {
  const quads = [
    quad(variable("version"), treeProperties.versionOfPath, baseResource),
    quad(variable("version"), treeProperties.timestampPath, variable("timestamp"))
  ];
  const variables = [variable("timestamp")];
  const sparqlQuery = constructSelectQuery(variables, quads);
  try {
    const response = await query(sparqlQuery);
    const timestamp = extractVariableFromResponse(response, "timestamp")?.shift();
    if (timestamp) {
      return timestamp;
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

export async function executeDeleteInsertQuery (
  quadsToDelete: RDF.Quad[],
  quadsToInsert: RDF.Quad[]
) {
  await executeDeleteQuery(quadsToDelete);
  await executeInsertQuery(quadsToInsert);
}

export async function fetchState (stream: RDF.NamedNode): Promise<State | undefined> {
  const quads = [
    quad(stream, EXT("state"), variable("state"))
  ];
  const variables = [variable("state")];
  const sparqlQuery = constructSelectQuery(variables, quads);
  try {
    const response = await query(sparqlQuery);
    const stateString = extractVariableFromResponse(response, "state")?.shift();
    if (stateString) {
      return JSON.parse(stateString);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

function extractVariableFromResponse (
  response: any,
  variable: string
): string[] | undefined {
  const bindings = response.results.bindings;
  if (bindings && bindings.length) {
    return bindings.map((binding: any) => binding[variable].value);
  }
}

export async function getVersion (resource: RDF.NamedNode, treeProperties: TreeProperties) {
  const quads = [quad(variable("v"), treeProperties.versionOfPath, resource)];
  const variables = [variable("v")];
  const sparqlQuery = constructSelectQuery(variables, quads);

  try {
    const response = await query(sparqlQuery);
    const versionUris = extractVariableFromResponse(response, "v");
    if (versionUris) {
      return namedNode(versionUris[0]);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

export async function updateState (stream: RDF.NamedNode, state: State) {
  const stateString = JSON.stringify(state);
  const genericStateQuads = [
    quad(stream, EXT("state"), variable("state"))
  ];
  const newStateQuads = [
    quad(stream, EXT("state"), literal(stateString))
  ];
  await executeDeleteInsertQuery(genericStateQuads, newStateQuads);
}
