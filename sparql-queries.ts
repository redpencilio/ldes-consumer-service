import * as RDF from "@rdfjs/types";
import { TreeProperties, extractEndpointHeadersFromEnv, toString, getSameAsForObject, getSameAsForSubject } from "./utils";
import { querySudo, updateSudo, ConnectionOptions } from "@lblod/mu-auth-sudo";
import { DataFactory } from "n3";
import { EXT } from "./namespaces";
import {
  MU_APPLICATION_GRAPH,
  SPARQL_AUTH_USER,
  SPARQL_AUTH_PASSWORD,
  SPARQL_ENDPOINT_HEADER_PREFIX
} from "./config";
import { State } from "@treecg/actor-init-ldes-client";
const { quad, namedNode, variable, literal } = DataFactory;

const SPARQL_ENDPOINT_HEADERS = extractEndpointHeadersFromEnv(SPARQL_ENDPOINT_HEADER_PREFIX);
const BATCH_SIZE = 100;

function constructTriplesString (quads: RDF.Quad[]) {
  const triplesString = quads.map(toString)
    .filter((item, index, array) => array.indexOf(item) === index)
    .join("\n        ");
  return triplesString;
}

export function constructInsertQuery (quads: RDF.Quad[]) {
  const triplesString = constructTriplesString(quads);
  const sparql_query = `INSERT DATA {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparql_query;
}

export function constructDeleteQuery (quads: RDF.Quad[]) {
  const triplesString = constructTriplesString(quads);
  const sparql_query = `DELETE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
          ${triplesString}
    }
} WHERE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparql_query;
}

export function constructSelectQuery (
  variables: RDF.Variable[],
  quads: RDF.Quad[]
) {
  const triplesString = constructTriplesString(quads);
  const variablesString = variables.map(toString).join(" ");
  const sparql_query = `SELECT ${variablesString} WHERE {
    GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
    }
}`;
  return sparql_query;
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

export async function executeInsertQuery(quads: RDF.Quad[]) {
  if (quads.length === 0)
    return;
  for (let i = 0; i < quads.length; i += BATCH_SIZE) {
    const batch = quads.slice(i, i + BATCH_SIZE);
    let queryStr = constructInsertQuery(batch);
    try {
      await update(queryStr);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function executeDeleteQuery(quads: RDF.Quad[]) {
  if (quads.length === 0)
    return;
  for (let i = 0; i < quads.length; i += BATCH_SIZE) {
    console.log(`batch ${i}`)
      const batch = quads.slice(i, i + BATCH_SIZE);
    let queryStr = constructDeleteQuery(batch);
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

  console.log("delete " + quadsToDelete.length);
  console.log("add " + quadsToInsert.length);
  await executeDeleteQuery(quadsToDelete);
  await executeInsertQuery(quadsToInsert);
}

export async function fetchState (stream: RDF.NamedNode): Promise<State | undefined> {
  const quads = [
    quad(stream, EXT("state"), variable("state"))
  ];
  const variables = [variable("state")];
  const sparql_query = constructSelectQuery(variables, quads);
  try {
    const response = await query(sparql_query);
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
