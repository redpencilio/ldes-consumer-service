import { Term } from "rdf-js";

export function toString(term: Term) {
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
