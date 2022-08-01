import { Term } from "rdf-js";
import { Member } from "./consumer";
import * as RDF from "rdf-js";

export function toString(term: Term): string {
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
		case "BlankNode":
			return "[]";
		default:
			return term.value;
	}
}

export function extractTimeStamp(member: Member): Date {
	const timeStamp: RDF.Quad = member.quads.find(
		(quadObj) =>
			quadObj.predicate.value === process.env.LDES_RELATION_PATH ||
			"http://www.w3.org/ns/prov#generatedAtTime"
	)!;
	return toDate(timeStamp.object as RDF.NamedNode);
}

export function toDate(node: RDF.NamedNode): Date {
	const timeString = node.value.split("^^")[0];
	return new Date(timeString);
}
