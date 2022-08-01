import  * as RDF  from 'rdf-js';
import { toString } from "./utils";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";
import { DataFactory } from "n3";
import { prov, purl } from "./namespaces";
const { quad, namedNode, variable } = DataFactory;

const stream = namedNode(process.env.LDES_STREAM);

function constructTriplesString(quads: RDF.Quad[]) {
  let triplesString = quads.map(toString).join("\n");
  return triplesString;
}

export function constructInsertQuery(quads: RDF.Quad[]) {
  let triplesString = constructTriplesString(quads);
  const sparql_query = `
    INSERT DATA {
        GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
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
      GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
      }
    } WHERE {
        GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
  return sparql_query;
}

export function constructDeleteInsertQuery(
  quadsToDelete: RDF.Quad[],
  quadsToInsert: RDF.Quad[]
) {
  let deleteQuery = constructDeleteQuery(quadsToDelete);
  let insertQuery = constructInsertQuery(quadsToInsert);
  return deleteQuery + "\n" + insertQuery;
}

export function constructSelectQuery(variables: RDF.Variable[], quads: RDF.Quad[]) {
  let triplesString = constructTriplesString(quads);
  let variablesString = variables.map(toString).join(" ");
  const sparql_query = `
    SELECT ${variablesString} where {
      GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
        ${triplesString}
      }
    }
  `;
  return sparql_query;
}

export async function executeInsertQuery(quads: RDF.Quad[]) {
  let queryStr = constructInsertQuery(quads);
  try {
    await update(queryStr);
  } catch (e) {
    console.error(e);
  }
}

export async function executeDeleteQuery(quads: RDF.Quad[]) {
  let queryStr = constructDeleteQuery(quads);
  try {
    await update(queryStr);
  } catch (e) {
    console.error(e);
  }
}

export async function executeDeleteInsertQuery(
  quadsToDelete: RDF.Quad[],
  quadsToInsert: RDF.Quad[]
) {
  let query = constructDeleteInsertQuery(quadsToDelete, quadsToInsert);
  try {
    await update(query);
  } catch (e) {
    console.error(e);
  }
}

export async function getEndTime() {
  let quads = [quad(stream, prov("endedAtTime"), variable("t"))];
  let variables = [variable("t")];
  const sparql_query = constructSelectQuery(variables, quads);

  try {
    const response = await query(sparql_query);
    const timeStrings = extractVariableFromResponse(response, "t");
    if (timeStrings) {
      const timeString = timeStrings[0].split("^^")[0];
      let time: Date = new Date(timeString);
      // time.setMilliseconds(time.getMilliseconds());
      return time;
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

function extractVariableFromResponse(response, variable: string): string[] {
  const bindings = response.results.bindings;
  if (bindings && bindings.length) {
    return bindings.map((binding) => binding[variable].value);
  }
  return;
}

export async function getVersion(resource: RDF.NamedNode) {
  let quads = [quad(variable("v"), purl("isVersionOf"), resource)];
  let variables = [variable("v")];
  const sparql_query = constructSelectQuery(variables, quads);

  try {
    const response = await query(sparql_query);
    const versionUris = extractVariableFromResponse(response, "v");
    if (versionUris) {
      return namedNode(versionUris[0]);
    }
    return;
  } catch (e) {
    console.error(e);
  }
}

export async function replaceEndTime(timeStamp: RDF.Quad_Object) {
  const genericTimeQuad: RDF.Quad = quad(
    stream,
    prov("endedAtTime"),
    variable("t")
  );
  const newTimeQuad: RDF.Quad = quad(stream, prov("endedAtTime"), timeStamp);
  await executeDeleteInsertQuery([genericTimeQuad], [newTimeQuad]);
}
