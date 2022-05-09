import { Quad, Quad_Object, Term, Variable } from "rdf-js";
import { toString } from "./utils";
// import { query, update } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";
import { DataFactory, NamedNode } from "n3";
import { prov, purl } from "./namespaces";
const { quad, namedNode, variable } = DataFactory;

const stream = namedNode(process.env.LDES_STREAM);

function constructTriplesString(quads: Quad[]) {
	let triplesString = "";
	quads.forEach((quadObj) => {
		triplesString += toString(quadObj) + "\n";
	});
	return triplesString;
}

export function constructInsertQuery(quads: Quad[]) {
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

export function constructDeleteQuery(quads: Quad[]) {
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
	quadsToDelete: Quad[],
	quadsToInsert: Quad[]
) {
	let deleteQuery = constructDeleteQuery(quadsToDelete);
	let insertQuery = constructInsertQuery(quadsToInsert);
	return deleteQuery + "\n" + insertQuery;
}

export function constructSelectQuery(variables: Variable[], quads: Quad[]) {
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

export async function executeInsertQuery(quads: Quad[]) {
	let queryStr = constructInsertQuery(quads);
	// console.log(queryStr);
	try {
		await update(queryStr);
	} catch (e) {
		console.error(e);
	}
}

export async function executeDeleteQuery(quads: Quad[]) {
	let queryStr = constructDeleteQuery(quads);
	try {
		await update(queryStr);
	} catch (e) {
		console.error(e);
	}
}

export async function executeDeleteInsertQuery(
	quadsToDelete: Quad[],
	quadsToInsert: Quad[]
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
			time.setMilliseconds(time.getMilliseconds() + 1);
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

export async function getVersion(resource: NamedNode) {
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

export async function replaceEndTime(timeStamp: Quad_Object) {
	const genericTimeQuad: Quad = quad(
		stream,
		prov("endedAtTime"),
		variable("t")
	);
	const newTimeQuad: Quad = quad(stream, prov("endedAtTime"), timeStamp);
	await executeDeleteInsertQuery([genericTimeQuad], [newTimeQuad]);
}
