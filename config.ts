export const LDES_ENDPOINT_VIEW = process.env.LDES_ENDPOINT_VIEW;
export const LDES_STREAM = process.env.LDES_STREAM || "http://example.org/example-stream"
export const REPLACE_VERSIONS = process.env.REPLACE_VERSIONS === "false" ? false : true;
export const LDES_RELATION_PATH = "http://www.w3.org/ns/prov#generatedAtTime";
export const MU_APPLICATION_GRAPH = process.env.MU_APPLICATION_GRAPH;
export const CRON_PATTERN = process.env.CRON_PATTERN || "0 * * * * *";
export const SPARQL_AUTH_USER = process.env.SPARQL_AUTH_USER;
export const SPARQL_AUTH_PASSWORD = process.env.SPARQL_AUTH_PASSWORD;
export const LDES_ENDPOINT_HEADER_PREFIX = 'LDES_ENDPOINT_HEADER_';
export const SPARQL_ENDPOINT_HEADER_PREFIX = 'SPARQL_ENDPOINT_HEADER_';
export const BLANK_NODE_NAMESPACE = process.env.BLANK_NODE_NAMESPACE || 'http://mu.semte.ch/blank#';
