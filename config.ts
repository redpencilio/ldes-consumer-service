import { PROV, DCTERMS } from "./namespaces";
import { DataFactory } from "n3";
const { namedNode } = DataFactory;
<<<<<<< HEAD
=======
export const RUNONCE = process.env.RUNONCE || "false";
>>>>>>> 33381bfd4596b24da83f1b788bc29af4cf8be63f
export const CRON_PATTERN = process.env.CRON_PATTERN || "0 * * * * *";
export const LDES_ENDPOINT_HEADER_PREFIX = "LDES_ENDPOINT_HEADER_";
export const LDES_ENDPOINT_VIEW = process.env.LDES_ENDPOINT_VIEW;
export const LDES_STREAM = process.env.LDES_STREAM || "http://example.org/example-stream";
<<<<<<< HEAD
export const LDES_TIMESTAMP_PATH = process.env.LDES_VERSION_OF_PATH ? namedNode(process.env.LDES_VERSION_OF_PATH) : PROV("generatedAtTime");
=======
export const LDES_TIMESTAMP_PATH = process.env.LDES_TIMESTAMP_PATH ? namedNode(process.env.LDES_TIMESTAMP_PATH) : PROV("generatedAtTime");
>>>>>>> 33381bfd4596b24da83f1b788bc29af4cf8be63f
export const LDES_VERSION_OF_PATH = process.env.LDES_VERSION_OF_PATH ? namedNode(process.env.LDES_VERSION_OF_PATH) : DCTERMS("isVersionOf");
export const MU_APPLICATION_GRAPH = process.env.MU_APPLICATION_GRAPH;
export const REPLACE_VERSIONS = process.env.REPLACE_VERSIONS !== "false";
export const SPARQL_AUTH_PASSWORD = process.env.SPARQL_AUTH_PASSWORD;
export const SPARQL_AUTH_USER = process.env.SPARQL_AUTH_USER;
export const SPARQL_ENDPOINT_HEADER_PREFIX = "SPARQL_ENDPOINT_HEADER_";
