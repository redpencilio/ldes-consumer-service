import * as RDF from "@rdfjs/types";
import { DataFactory } from "n3";
import { BLANK, XSD } from "./namespaces";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import { sparqlEscapeString, sparqlEscapeUri } from "mu";
import { Member } from "./consumer";
const { literal } = DataFactory;

export interface TreeProperties {
  versionOfPath: RDF.NamedNode,
  timestampPath: RDF.NamedNode
}

export function toString (term: RDF.Term): string {
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

export function fromDate (date: Date): RDF.Literal {
  return literal(date.toISOString(), XSD("dateTime"));
}

export function convertBlankNodes (quads: RDF.Quad[]) {
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
}

export function extractEndpointHeadersFromEnv (prefix: string) {
  const headers: {
    [key: string]: number | string | string[];
  } = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix)) {
      const environmentKey = key.split(prefix).pop();
      if (environmentKey && value) {
        let headerKey = environmentKey;
        let headerValue = value;

        const valueSplitted = value.split(';');
        if(valueSplitted.length > 1) {
          headerKey = valueSplitted[0];
          headerValue = valueSplitted[1];
        }

        headers[headerKey.toLowerCase()] = headerValue;
      }
    }
  }
  return headers;
}
