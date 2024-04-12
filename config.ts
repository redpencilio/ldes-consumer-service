import { PROV, DCTERMS } from "./namespaces";
import { DataFactory } from "n3";
import env from "env-var";

const { namedNode } = DataFactory;
export const CRON_PATTERN = env.get("CRON_PATTERN").default("0 * * * * *").asString();
export const LDES_DEREFERENCE_MEMBERS = env.get("LDES_DEREFERENCE_MEMBERS").asBool();
export const LDES_ENDPOINT_HEADER_PREFIX = "LDES_ENDPOINT_HEADER_";
export const LDES_ENDPOINT_VIEW = env.get("LDES_ENDPOINT_VIEW").required().asString();
export const LDES_POLLING_INTERVAL = env.get("LDES_POLLING_INTERVAL").default(60000).asIntPositive();
export const LDES_REQUESTS_PER_MINUTE = env.get("LDES_REQUESTS_PER_MINUTE").default(0).asIntPositive();
export const LDES_STREAM = env.get("LDES_STREAM").default("http://example.org/example-stream").asString();
export const LDES_TIMESTAMP_PATH = process.env.LDES_TIMESTAMP_PATH ? namedNode(process.env.LDES_TIMESTAMP_PATH) : PROV("generatedAtTime");
export const LDES_VERSION_OF_PATH = process.env.LDES_VERSION_OF_PATH ? namedNode(process.env.LDES_VERSION_OF_PATH) : DCTERMS("isVersionOf");
export const LDES_LOGGING_LEVEL = env.get("LDES_LOGGING_LEVEL").default("info").asString();
export const MU_APPLICATION_GRAPH = env.get("MU_APPLICATION_GRAPH").required().asString();
export const REPLACE_VERSIONS = env.get("REPLACE_VERSIONS").asBool();
export const SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA = env.get("SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA").default("false").asBool();
//TODO LPDC-1103: verify that SAVE_ALL_VERSIONS_IGNORING_TIMESTAMP_DATA = true can only be combined with REPLACE_VERSIONS = false => otherwise stop process
export const RUNONCE = env.get("RUNONCE").asBool();
export const SPARQL_AUTH_PASSWORD = env.get("SPARQL_AUTH_PASSWORD").asString();
export const SPARQL_AUTH_USER = env.get("SPARQL_AUTH_USER").asString();
export const SPARQL_BATCH_SIZE = env.get("SPARQL_BATCH_SIZE").default(0).asInt();
export const ENABLE_SPARQL_BATCHING = SPARQL_BATCH_SIZE > 0;
export const SPARQL_ENDPOINT_HEADER_PREFIX = "SPARQL_ENDPOINT_HEADER_";
export const SKIP_ERRORS = env.get("SKIP_ERRORS").asBool();
export const PERSIST_STATE = env.get("PERSIST_STATE").asBool();
//TODO LPDC-1103: print more variables to config export log
