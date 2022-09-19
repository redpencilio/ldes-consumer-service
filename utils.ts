import { Term } from "rdf-js";
import { Member } from "ldes-consumer";
import * as RDF from "rdf-js";
import { DataFactory } from "n3";
import { BLANK, PURL, XSD } from "./namespaces";
const { literal, namedNode } = DataFactory;
import { v4 as uuidv4 } from "uuid";
import { LDES_ENDPOINT_HEADER_PREFIX, LDES_RELATION_PATH } from "./config";
import { sparqlEscapeString, sparqlEscapeUri } from "mu";

export function toString(term: Term): string {
  switch (term.termType) {
    case "NamedNode":
      return sparqlEscapeUri(term.value);
    case "Literal":
      let result = sparqlEscapeString(term.value);

      if (term.language) result += `@${term.language}`;
      else if (term.datatype)
        result += `^^${sparqlEscapeUri(term.datatype.value)}`;
      return result;
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

export function fromDate(date: Date): RDF.Literal {
  return literal(date.toISOString(), XSD("dateTime"));
}

export function convertBlankNodes(quads: RDF.Quad[]) {
  const blankNodesMap = new Map<RDF.BlankNode, RDF.NamedNode>();
  quads.forEach((quad) => {
    if (quad.subject.termType === "BlankNode") {
      if (!blankNodesMap.has(quad.subject)) {
        blankNodesMap.set(quad.subject, BLANK(uuidv4()));
      }
      quad.subject = blankNodesMap.get(quad.subject)!;
    }
    if (quad.object.termType === "BlankNode") {
      if (!blankNodesMap.has(quad.object)) {
        blankNodesMap.set(quad.object, BLANK(uuidv4()));
      }
      quad.object = blankNodesMap.get(quad.object)!;
    }
  });
  return quads;
}

export function extractBaseResourceUri(
  member: Member
): RDF.NamedNode | undefined {
  const baseResourceMatches = member.quads.filter((quadObj) =>
    quadObj.predicate.equals(PURL("isVersionOf"))
  );
  if (baseResourceMatches && baseResourceMatches.length) {
    return baseResourceMatches[0].object as RDF.NamedNode;
  }
  return;
}

export function extractLDESEndpointHeadersFromEnv() {
  const headers: {
    [key: string]: number | string | string[];
  } = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(LDES_ENDPOINT_HEADER_PREFIX)) {
      const headerKey = key.split(LDES_ENDPOINT_HEADER_PREFIX).pop();
      if (headerKey && value) {
        headers[headerKey.toLowerCase()] = value;
      }
    }
  }
  return headers;
}
