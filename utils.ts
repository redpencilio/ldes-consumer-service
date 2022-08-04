import { Term } from "rdf-js";
import { Member } from "./consumer";
import * as RDF from "rdf-js";
import { DataFactory } from "n3";
import { BLANK, PURL, XSD } from "./namespaces";
const { literal, namedNode } = DataFactory;
import { v4 as uuidv4 } from "uuid";
import { LDES_RELATION_PATH } from "./config";
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';

export function toString(term: Term): string {
  switch (term.termType) {
    case "NamedNode":
      return sparqlEscapeUri(term.value);
    case "Literal":
      let result = sparqlEscapeString(term.value);
      
      if(term.language)
        result += `@${term.language}`;
      if(term.datatype)
        result += `^^${sparqlEscapeUri(term.datatype.value)}`
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

export function extractTimeStamp(member: Member): Date {
  const timeStamp: RDF.Quad = member.quads.find(
    (quadObj) => quadObj.predicate.value === LDES_RELATION_PATH
  )!;
  return toDate(timeStamp.object as RDF.Literal);
}

export function toDate(node: RDF.Literal): Date {
  const timeString = node.value.split("^^")[0];
  return new Date(timeString);
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
