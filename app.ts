import { newEngine } from "@treecg/actor-init-ldes-client";
import * as RDFJS from "rdf-js";
import { Quad, DataFactory } from "n3";
import { prov } from "./namespaces";
import SC2 from "sparql-client-2";

const { SparqlClient } = SC2;

const SPARQL_CLIENT = new SparqlClient(process.env.MU_SPARQL_ENDPOINT, {
	requestDefaults: { headers: { "mu-auth-sudo": true } },
});

const { quad, namedNode, variable } = DataFactory;

const stream = namedNode(process.env.LDES_STREAM);

let lastInsertedMember: any;

function toString(term: RDFJS.Term) {
	switch (term.termType) {
		case "NamedNode":
			return `<${term.value}>`;
		case "Literal":
			return `"${term.value}"`;
		case "Quad":
			return `${toString(term.subject)} ${toString(
				term.predicate
			)} ${toString(term.object)}.`;
		case "Variable":
			return `?${term.value}`;
		default:
			return term.value;
	}
}

async function executeInsertQuery(quads: RDFJS.Quad[]) {
	let triplesString = "";
	quads.forEach((quadObj) => {
		triplesString += toString(quadObj) + "\n";
	});
	const sparql_query = `
    INSERT DATA {
        GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
	try {
		const response = await SPARQL_CLIENT.query(sparql_query).execute();
		console.log(response);
	} catch (e) {
		console.error(e);
	}
}

async function executeDeleteQuery(quads: RDFJS.Quad[]) {
	let triplesString = "";
	quads.forEach((quadObj) => {
		triplesString += toString(quadObj) + "\n";
	});
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
	console.log(sparql_query);
	try {
		await SPARQL_CLIENT.query(sparql_query).execute();
	} catch (e) {
		console.error(e);
	}
}

async function getEndTime() {
	const sparql_query = `
    SELECT ?t where {
      GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
        ${toString(stream)} ${toString(prov("endedAtTime"))} ?t.
      }
    }
  `;

	try {
		const response = await SPARQL_CLIENT.query(sparql_query).execute();
		console.log(response);
		if (response.bindings && response.bindings.length) {
			const timeString = response.bindings[0].t.value.split("^^")[0];
			let time: Date = new Date(timeString);
			time.setMilliseconds(time.getMilliseconds() + 1);

			return time;
		}
		return;
	} catch (e) {
		console.error(e);
	}
}

async function main() {
	try {
		const endTime = await getEndTime();
		console.log(endTime);
		let url = process.env.LDES_ENDPOINT_VIEW;
		let options = {
			pollingInterval: 500, // millis
			representation: "Quads", //Object or Quads
			fromTime: endTime,
			mimeType: "application/ld+json",
			emitMemberOnce: true,
			// jsonLdContext: {
			// 	//Only necessary for Object representation
			// 	"@context": [
			// 		{
			// 			"@base": BASEURI,
			// 			prov: prov().value,
			// 		},
			// 	],
			// },
		};
		let LDESClient = new newEngine();
		let eventstreamSync = LDESClient.createReadStream(url, options);

		// const timeoutms = 2000; // amount of milliseconds before timeout
		// const timeout = setTimeout(() => eventstreamSync.pause(), timeoutms);
		eventstreamSync.on("data", (member) => {
			if (options.representation && options.representation === "Quads") {
				lastInsertedMember = member;
				const memberURI = member.id.value;
				console.log("Member:", memberURI);
				const quads = member.quads.filter(
					(quadObj) => quadObj.subject.value === member.id.value
				);
				executeInsertQuery(quads);
			}

			// Want to pause event stream?
			// eventstreamSync.pause();
		});

		eventstreamSync.on("pause", async () => {
			console.log("PAUSE");
			if (lastInsertedMember) {
				console.log(lastInsertedMember.quads[1].object);
				const timeStamp = lastInsertedMember.quads.find(
					(quadObj) =>
						quadObj.predicate.value ===
						process.env.LDES_RELATION_PATH
				);
				if (timeStamp) {
					const genericTimeQuad: Quad = quad(
						stream,
						prov("endedAtTime"),
						variable("t")
					);
					await executeDeleteQuery([genericTimeQuad]);
					const newTimeQuad: Quad = quad(
						stream,
						prov("endedAtTime"),
						timeStamp.object
					);
					await executeInsertQuery([newTimeQuad]);
				}
			}
		});
		eventstreamSync.on("end", () => {
			console.log("No more data!");
		});
	} catch (e) {
		throw e;
	}
}

main();
