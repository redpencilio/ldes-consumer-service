import { Member } from "ldes-consumer";
import * as RDF from "@rdfjs/types";
import { DataFactory } from "n3";
import { BLANK, XSD } from "./namespaces";
import { v4 as uuidv4 } from "uuid";
import { sparqlEscapeString, sparqlEscapeUri } from "mu";
const { literal } = DataFactory;
import namespace from "@rdfjs/namespace";
import { REPLACE_BLANK_NODES, BLANK_NODE_DATA_TYPE } from "./config";

export interface TreeProperties {
  versionOfPath: RDF.NamedNode,
  timestampPath: RDF.NamedNode
}

export function toString (term: RDF.Term): string {
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
  const sameAsMap = new Map<RDF.NamedNode, RDF.NamedNode>();
  const convertedQuads = quads.map((quad) => {
    if (quad.subject.termType === "BlankNode") {
      let namedNode;
      if (REPLACE_BLANK_NODES && quad.object.datatype && quad.object.datatype.value.startsWith(BLANK_NODE_DATA_TYPE)) {
        // generate uri based on object datatype and value
        namedNode = namespace(quad.object.datatype.value + "/")(quad.object.value);
      }

      if (!blankNodesMap.has(quad.subject)) {
        blankNodesMap.set(quad.subject, (namedNode? namedNode : BLANK(uuidv4())));
      } else if (namedNode) {
        sameAsMap.set(blankNodesMap.get(quad.subject)!, namedNode);
        blankNodesMap.set(quad.subject, namedNode);
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

  return {
    'sameAsMap': sameAsMap,
    'quads': convertedQuads
  }
}

export function getSameAsForObject(member: Member, sameAs: RDF.NamedNode) : RDF.Quad[]  {
  return member.quads.filter((quad) => quad.object.equals(sameAs));
}

export function getSameAsForSubject(member: Member, sameAs: RDF.NamedNode) : RDF.Quad[]  {
  return member.quads.filter((quad) =>quad.subject.equals(sameAs));
}

export function extractVersionTimestamp (member: Member, treeProperties: TreeProperties) : Date | null {
  const timestampMatches = member.quads.filter((quad) =>
    quad.predicate.equals(treeProperties.timestampPath)
  );
  if (timestampMatches && timestampMatches.length) {
    return new Date(timestampMatches[0].object.value);
  }
  return null;
}

export function extractBaseResourceUri (
  member: Member,
  treeProperties: TreeProperties
): RDF.NamedNode | undefined {
  const baseResourceMatches = member.quads.filter((quadObj) =>
    quadObj.predicate.equals(treeProperties.versionOfPath)
  );
  if (baseResourceMatches && baseResourceMatches.length) {
    return baseResourceMatches[0].object as RDF.NamedNode;
  }
  return;
}

export function extractEndpointHeadersFromEnv(prefix: string) {
  const headers: {
    [key: string]: number | string | string[];
  } = {};
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
