import rdfStores from "rdf-stores";
import { DataFactory } from "n3";
import type * as RDF from "@rdfjs/types";

const { namedNode, literal, blankNode, quad } = DataFactory;

export type RdfStore = rdfStores.RdfStore;

export type MuTerm = { type: string; value: string };

export type Bindings = Record<string, MuTerm | undefined>;

export const RDF_TYPE = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");

/**
 * Converts a term from a mu query binding into an RDF/JS term.
 */
export function toRdfTerm(term: MuTerm): RDF.Term {
  switch (term.type) {
    case "uri":
      return namedNode(term.value);
    case "literal":
      return literal(term.value);
    case "bnode":
      return blankNode(term.value);
    default:
      throw new Error(`Unsupported term type "${term.type}" with value "${term.value}" in an LDES feed configuration`);
  }
}

/**
 * Builds an in-memory store of the CONSTRUCT results of a query.
 */
export function buildStore(bindings: Bindings[]): RdfStore {
  const store = rdfStores.RdfStore.createDefault();
  for (const binding of bindings) {
    const { s, p, o } = binding;
    if (!s || !p || !o) {
      throw new Error("Received a triple binding without a subject, predicate or object");
    }
    store.addQuad(quad(toRdfTerm(s) as RDF.Quad_Subject, toRdfTerm(p) as RDF.Quad_Predicate, toRdfTerm(o) as RDF.Quad_Object));
  }
  return store;
}

/**
 * Maps the subject of each `rdf:type` triple in the store onto its asserted type.
 */
export function buildTypeMap(store: RdfStore): Map<string, RDF.Term> {
  const typeMap = new Map<string, RDF.Term>();
  for (const q of store.getQuads(undefined, RDF_TYPE, undefined, undefined)) {
    typeMap.set(q.subject.value, q.object);
  }
  return typeMap;
}
