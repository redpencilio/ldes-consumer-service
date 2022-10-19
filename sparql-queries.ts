import * as RDF from "rdf-js";
import { extractEndpointHeadersFromEnv, fromDate, toString } from "./utils";
import { querySudo, updateSudo, ConnectionOptions } from "@lblod/mu-auth-sudo";
import { DataFactory } from "n3";
import { LDES, PROV, PURL, TREE } from "./namespaces";
import {
    LDES_STREAM,
    MU_APPLICATION_GRAPH,
    SPARQL_AUTH_USER,
    SPARQL_AUTH_PASSWORD,
    SPARQL_ENDPOINT_HEADER_PREFIX
} from "./config";
import { State } from "@treecg/actor-init-ldes-client";
const { quad, namedNode, variable, literal } = DataFactory;

const stream = namedNode(LDES_STREAM);

const SPARQL_ENDPOINT_HEADERS = extractEndpointHeadersFromEnv(SPARQL_ENDPOINT_HEADER_PREFIX);

function constructTriplesString(quads: RDF.Quad[]) {
  let triplesString = quads.map(toString).join("\n");
  return triplesString;
}

export function constructInsertQuery(quads: RDF.Quad[]) {
  let triplesString = constructTriplesString(quads);
  const sparql_query = `
    INSERT DATA {
        GRAPH <${MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
  return sparql_query;
}

export function constructDeleteQuery(quads: RDF.Quad[]) {
  let triplesString = constructTriplesString(quads);
  const sparql_query = `
    DELETE {
      GRAPH <${MU_APPLICATION_GRAPH}> {
            ${triplesString}
      }
    } WHERE {
        GRAPH <${MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
  return sparql_query;
}

export function constructSelectQuery(
  variables: RDF.Variable[],
  quads: RDF.Quad[]
) {
  let triplesString = constructTriplesString(quads);
  let variablesString = variables.map(toString).join(" ");
  const sparql_query = `
    SELECT ${variablesString} where {
      GRAPH <${MU_APPLICATION_GRAPH}> {
        ${triplesString}
      }
    }
  `;
  return sparql_query;
}

async function update(queryStr: string) {
    const headers : Record<string,string> = {}
    const connectionOptions : ConnectionOptions = {};
    if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
        connectionOptions.authUser = SPARQL_AUTH_USER;
        connectionOptions.authPassword = SPARQL_AUTH_PASSWORD;
    }
    return await updateSudo(queryStr, headers, connectionOptions);
}

async function query(queryStr: string) {
    const headers : Record<string,string> = {}
    const connectionOptions : ConnectionOptions = {};
    if (SPARQL_AUTH_USER && SPARQL_AUTH_PASSWORD) {
        connectionOptions.authUser = SPARQL_AUTH_USER;
        connectionOptions.authPassword = SPARQL_AUTH_PASSWORD;
    }
    return await querySudo(queryStr, headers, connectionOptions);
}

export async function executeInsertQuery(quads: RDF.Quad[]) {
  let queryStr = constructInsertQuery(quads);
  try {
    await update(queryStr, SPARQL_ENDPOINT_HEADERS);
  } catch (e) {
    console.error(e);
  }
}

export async function executeDeleteQuery(quads: RDF.Quad[]) {
  let queryStr = constructDeleteQuery(quads);
  try {
    await update(queryStr, SPARQL_ENDPOINT_HEADERS);
  } catch (e) {
    console.error(e);
  }
}

export async function executeDeleteInsertQuery(
  quadsToDelete: RDF.Quad[],
  quadsToInsert: RDF.Quad[]
) {
  await executeDeleteQuery(quadsToDelete);
  await executeInsertQuery(quadsToInsert);
}

export async function fetchState(): Promise<State | undefined> {
  let quads = [
    quad(stream, LDES("state"), variable("state")),
  ];
  let variables = [variable("state")];
  const sparql_query = constructSelectQuery(variables, quads);
  try {
    const response = await query(sparql_query, SPARQL_ENDPOINT_HEADERS);
    const stateString = extractVariableFromResponse(response, "state")?.shift();
    if (stateString) {
      return JSON.parse(stateString);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

function extractVariableFromResponse(
  response: any,
  variable: string
): string[] | undefined {
  const bindings = response.results.bindings;
  if (bindings && bindings.length) {
    return bindings.map((binding: any) => binding[variable].value);
  }
  return;
}

export async function getVersion(resource: RDF.NamedNode) {
  let quads = [quad(variable("v"), PURL("isVersionOf"), resource)];
  let variables = [variable("v")];
  const sparql_query = constructSelectQuery(variables, quads);

  try {
    const response = await query(sparql_query, SPARQL_ENDPOINT_HEADERS);
    const versionUris = extractVariableFromResponse(response, "v");
    if (versionUris) {
      return namedNode(versionUris[0]);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

export async function updateState(state: State) {
  const stateString = JSON.stringify(state);
  const genericStateQuads = [
    quad(stream, LDES("state"), variable("state")),
  ];
  const newStateQuads = [
    quad(stream, LDES("state"), literal(stateString))
  ];
  await executeDeleteInsertQuery(genericStateQuads, newStateQuads);
}
