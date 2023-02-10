import namespace from "@rdfjs/namespace";

const BLANK_NODE_NAMESPACE = process.env.BLANK_NODE_NAMESPACE || "http://mu.semte.ch/blank#";

export const PROV = namespace("http://www.w3.org/ns/prov#");
export const DCTERMS = namespace("http://purl.org/dc/terms/");
export const TREE = namespace("https://w3id.org/tree#");
export const XSD = namespace("http://www.w3.org/2001/XMLSchema#");
export const BLANK = namespace(BLANK_NODE_NAMESPACE);
export const LDES = namespace("https://w3id.org/ldes#");
export const EXT = namespace("http://mu.semte.ch/vocabularies/ext/");
