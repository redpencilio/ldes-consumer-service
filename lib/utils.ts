import * as RDF from "@rdfjs/types";
import { BLANK } from "./namespaces";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import { sparqlEscapeString, sparqlEscapeUri } from "mu";
// @ts-ignore
import { DataFactory } from "n3";

export function toString(term: RDF.Term): string {
  switch (term.termType) {
    case "NamedNode":
      return sparqlEscapeUri(term.value);
    case "Literal":
      {
        let result = sparqlEscapeString(term.value);

        if (term.language) result += `@${term.language}`;
        else if (term.datatype) { result += `^^${sparqlEscapeUri(term.datatype.value)}`; }
        return result;
      }
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

export function convertBlankNodes(quads: RDF.Quad[]) {
  const blankNodesMap = new Map<RDF.Term, RDF.NamedNode>();
  return quads.map((quad) => {
    if (quad.subject.termType === "BlankNode") {
      if (!blankNodesMap.has(quad.subject)) {
        blankNodesMap.set(quad.subject, BLANK(uuidv4()));
      }
    }
    if (quad.object.termType === "BlankNode") {
      if (!blankNodesMap.has(quad.object)) {
        blankNodesMap.set(quad.object, BLANK(uuidv4()));
      }
    }
    if (quad.subject.termType === "BlankNode" || quad.object.termType === "BlankNode") {
      const newSubject = blankNodesMap.get(quad.subject) || quad.subject;
      const newObject = blankNodesMap.get(quad.object) || quad.object;
      return DataFactory.quad(newSubject, quad.predicate, newObject, quad.graph);
    } else {
      return quad;
    }
  });
}

export function extractEndpointHeadersFromEnv(prefix: string) {
  const headers: Record<string, number | string | string[]> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix)) {
      const headerKey = key.split(prefix).pop();
      if (headerKey && value) {
        headers[headerKey.toLowerCase()] = value;
      }
    }
  }
  return headers;
}
