import namespace from "@rdfjs/namespace";
import { BLANK_NODE_NAMESPACE } from "../cfg.ts";

export const PROV = namespace("http://www.w3.org/ns/prov#");
export const DCTERMS = namespace("http://purl.org/dc/terms/");
export const TREE = namespace("https://w3id.org/tree#");
export const XSD = namespace("http://www.w3.org/2001/XMLSchema#");
export const BLANK = namespace(BLANK_NODE_NAMESPACE);
export const LDES = namespace("https://w3id.org/ldes#");
export const LDES_CONSUMER = namespace("http://redpencil.data.gift/ldes-consumer/");
export const UCO_OBSERVABLE = namespace("https://ontology.unifiedcyberontology.org/observable#");
export const UCO_TYPES = namespace("https://ontology.unifiedcyberontology.org/co/1.0/uco/types/");