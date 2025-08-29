import env from "env-var";
import { getLoggerFor } from "./lib/logger";

const logger = getLoggerFor("config");

export const LDES_ENDPOINT_VIEW = env.get("LDES_ENDPOINT_VIEW").required().asString();
export const LDES_POLLING_INTERVAL = env.get("LDES_POLLING_INTERVAL").default(60000).asIntPositive();
export const LDES_REQUESTS_PER_MINUTE = env.get("LDES_REQUESTS_PER_MINUTE").default(0).asIntPositive();
export const LDES_ENDPOINT_HEADERS_STRING = env.get("LDES_ENDPOINT_HEADERS").default("{}").asString();
export const LDES_VERSION_OF_PATH = env.get("LDES_VERSION_OF_PATH").asString();
export const LDES_TIMESTAMP_PATH = env.get("LDES_TIMESTAMP_PATH").asString();
export let LDES_ENDPOINT_HEADERS = {};

try {
  LDES_ENDPOINT_HEADERS = JSON.parse(LDES_ENDPOINT_HEADERS_STRING);
} catch (e: any) {
  logger.error(`Failed to parse contents of LDES_ENDPOINT_HEADERS. Faulty content: ${LDES_ENDPOINT_HEADERS_STRING}`);
  logger.error(e);
  throw e;
}


export const INGEST_MODE = env.get("INGEST_MODE").default("ALL").asEnum(["ALL", "MATERIALIZE"]);
export const REPLACE_VERSIONS = env.get("REPLACE_VERSIONS").default("true").asBool();
export const PERSIST_STATE = env.get("PERSIST_STATE").default("false").asBool()

export const SPARQL_ENDPOINT_HEADER_PREFIX = "SPARQL_ENDPOINT_HEADER_";

export const SPARQL_BATCH_SIZE = env.get("SPARQL_BATCH_SIZE").default(0).asIntPositive();
export const ENABLE_SPARQL_BATCHING = SPARQL_BATCH_SIZE > 0;

export const SPARQL_AUTH_USER = env.get("SPARQL_AUTH_USER").asString();
export const SPARQL_AUTH_PASSWORD = env.get("SPARQL_AUTH_PASSWORD").asString();

export const BLANK_NODE_NAMESPACE = env.get("BLANK_NODE_NAMESPACE").default("http://mu.semte.ch/blank#").asString();

const RUN_ONCE_VAR = env.get("RUN_ONCE").default("false").asBool();
const RUNONCE_VAR = env.get("RUNONCE").default("false").asBool();
export const RUN_ONCE = RUN_ONCE_VAR || RUNONCE_VAR;

export const MU_APPLICATION_GRAPH = env.get("MU_APPLICATION_GRAPH").required().asString(); // Provided by template
export const MU_SPARQL_ENDPOINT = env.get("MU_SPARQL_ENDPOINT").required().asString(); // Provided by template
export const DEBUG_AUTH_HEADERS = env.get("DEBUG_AUTH_HEADERS").default("false").asBool();

export const NODE_ENV = env.get("NODE_ENV").default("production").asEnum(["development", "production"]);

export function logConfig() {
  // Should this use the logger instead?
  console.log("Config", {
    INGEST_MODE,
    REPLACE_VERSIONS,
    PERSIST_STATE,
    LDES_ENDPOINT_VIEW,
    LDES_POLLING_INTERVAL,
    LDES_REQUESTS_PER_MINUTE,
    SPARQL_BATCH_SIZE,
    SPARQL_AUTH_USER,
    SPARQL_AUTH_PASSWORD,
    BLANK_NODE_NAMESPACE,
    RUN_ONCE,
    MU_APPLICATION_GRAPH,
    MU_SPARQL_ENDPOINT,
    DEBUG_AUTH_HEADERS,
    LDES_VERSION_OF_PATH,
    LDES_TIMESTAMP_PATH,
  });
}
