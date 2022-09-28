import * as RDF from "rdf-js";
import { extractEndpointHeadersFromEnv, fromDate, toString } from "./utils";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";
import { DataFactory } from "n3";
import { PROV, PURL, TREE } from "./namespaces";
import { State } from "ldes-consumer";
import { LDES_STREAM, MU_APPLICATION_GRAPH } from "./config";
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
    quad(stream, PROV("endedAtTime"), variable("t")),
    quad(stream, TREE("node"), variable("p")),
  ];
  let variables = [variable("t"), variable("p")];
  const sparql_query = constructSelectQuery(variables, quads);
  try {
    const response = await query(sparql_query, SPARQL_ENDPOINT_HEADERS);
    const timeString = extractVariableFromResponse(response, "t")?.shift();
    const node = extractVariableFromResponse(response, "p")?.shift();
    if (node && timeString) {
      return {
        timestamp: new Date(timeString),
        page: node
      }
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
  const genericStateQuads = [
    quad(stream, PROV("endedAtTime"), variable("t")),
    quad(stream, TREE("node"), variable("p")),
  ];
  const newStateQuads = [
    ...(state.timestamp
      ? [quad(stream, PROV("endedAtTime"), fromDate(state.timestamp))]
      : []),
    ...(state.page
      ? [quad(stream, TREE("node"), namedNode(state.page))]
      : []),
  ];
  await executeDeleteInsertQuery(genericStateQuads, newStateQuads);
}
