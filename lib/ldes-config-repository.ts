import {
  EMIT_LAST_VERSION_ONLY,
  LDES_CONFIG_SCOPE,
  LDES_ENDPOINT_HEADERS,
  LDES_INFO_REQUEST_TIMEOUT,
  LDES_SANITIZE_CONTENTS_REGEX,
  LDES_SANITIZE_CONTENTS_REPLACEMENT,
  LDES_SANITIZE_CONTENTS_STRING,
  ORDERING_STRATEGY,
  REPLACE_VERSIONS,
  resolveJwtArgs,
} from "../cfg.ts";
import type { JwtAuthArgs } from "./fetch/jwt-auth.ts";
type JwtArgs = JwtAuthArgs & { useJwtAuth: boolean };
type OrderedStrategy = "ascending" | "descending" | "none";
import { DataFactory } from "n3";
import type * as RDF from "@rdfjs/types";
import { RDF_TYPE, buildStore, buildTypeMap } from "./rdf-store.ts";
import type { Bindings, RdfStore } from "./rdf-store.ts";
import { HandleMap, applyHandlers, makeAssignHandler, readBoolean, readPositiveInt, readString, readURI } from "./rdf-store-handler.ts";
import type { Handler } from "./rdf-store-handler.ts";
import { getLoggerFor } from "./logger.ts";
import { LDES_CONSUMER, UCO_OBSERVABLE, UCO_TYPES } from "./namespaces.ts";
import { query } from "mu";

const { namedNode } = DataFactory;

const logger = getLoggerFor("ldes-config-repository");

const FEED_CONFIG_QUERY = `PREFIX ldesConsumer: <http://redpencil.data.gift/ldes-consumer/>
PREFIX ucoObservable: <https://ontology.unifiedcyberontology.org/observable#>
PREFIX ucoTypes: <https://ontology.unifiedcyberontology.org/co/1.0/uco/types/>
CONSTRUCT {
  ?view a ldesConsumer:LdesFeed ;
        ldesConsumer:infoRequestTimeout ?infoRequestTimeout ;
        ldesConsumer:sanitizeString ?sanitizeString ;
        ldesConsumer:sanitizeRegex ?sanitizeRegex ;
        ldesConsumer:sanitizeReplacement ?sanitizeReplacement ;
        ldesConsumer:replaceVersions ?replaceVersions ;
        ldesConsumer:orderingStrategy ?orderingStrategy ;
        ldesConsumer:emitLastVersionOnly ?emitLastVersionOnly ;
        ldesConsumer:versionOfPath ?versionOfPath ;
        ldesConsumer:timestampPath ?timestampPath ;
        ldesConsumer:jwtUseJwtAuth ?jwtUseJwtAuth ;
        ldesConsumer:jwtClientId ?jwtClientId ;
        ldesConsumer:jwtKeyPath ?jwtKeyPath ;
        ldesConsumer:jwtKeyAlgorithm ?jwtKeyAlgorithm ;
        ldesConsumer:jwtTokenUrl ?jwtTokenUrl ;
        ldesConsumer:jwtTokenAudience ?jwtTokenAudience ;
        ldesConsumer:jwtTokenExpiry ?jwtTokenExpiry ;
        ldesConsumer:jwtTokenScope ?jwtTokenScope ;
        ldesConsumer:jwtClientAssertionType ?jwtClientAssertionType ;
        ucoObservable:httpRequestHeader ?headerDictionary .
  ?headerDictionary a ucoTypes:Dictionary ;
        ucoTypes:entry ?headerEntry .
  ?headerEntry a ucoTypes:DictionaryEntry ;
        ucoTypes:key ?headerKey ;
        ucoTypes:value ?headerValue .
} WHERE {
  GRAPH ?g {
    ?view a ldesConsumer:LdesFeed .
    OPTIONAL { ?view ldesConsumer:infoRequestTimeout ?infoRequestTimeout }
    OPTIONAL { ?view ldesConsumer:sanitizeString ?sanitizeString }
    OPTIONAL { ?view ldesConsumer:sanitizeRegex ?sanitizeRegex }
    OPTIONAL { ?view ldesConsumer:sanitizeReplacement ?sanitizeReplacement }
    OPTIONAL { ?view ldesConsumer:replaceVersions ?replaceVersions }
    OPTIONAL { ?view ldesConsumer:orderingStrategy ?orderingStrategy }
    OPTIONAL { ?view ldesConsumer:emitLastVersionOnly ?emitLastVersionOnly }
    OPTIONAL { ?view ldesConsumer:versionOfPath ?versionOfPath }
    OPTIONAL { ?view ldesConsumer:timestampPath ?timestampPath }
    OPTIONAL { ?view ldesConsumer:jwtUseJwtAuth ?jwtUseJwtAuth }
    OPTIONAL { ?view ldesConsumer:jwtClientId ?jwtClientId }
    OPTIONAL { ?view ldesConsumer:jwtKeyPath ?jwtKeyPath }
    OPTIONAL { ?view ldesConsumer:jwtKeyAlgorithm ?jwtKeyAlgorithm }
    OPTIONAL { ?view ldesConsumer:jwtTokenUrl ?jwtTokenUrl }
    OPTIONAL { ?view ldesConsumer:jwtTokenAudience ?jwtTokenAudience }
    OPTIONAL { ?view ldesConsumer:jwtTokenExpiry ?jwtTokenExpiry }
    OPTIONAL { ?view ldesConsumer:jwtTokenScope ?jwtTokenScope }
    OPTIONAL { ?view ldesConsumer:jwtClientAssertionType ?jwtClientAssertionType }
    OPTIONAL {
      ?view ucoObservable:httpRequestHeader ?headerDictionary .
      ?headerDictionary ucoTypes:entry ?headerEntry .
      ?headerEntry ucoTypes:key ?headerKey ;
                   ucoTypes:value ?headerValue .
    }
  }
}`;

export interface FeedSanitizeConfig {
  match: string;
  replacement: string;
  isRegex: boolean;
}

export interface LdesFeedConfig {
  view: string;
  infoRequestTimeout: number;
  sanitize: FeedSanitizeConfig | undefined;
  replaceVersions: boolean;
  orderingStrategy: OrderedStrategy;
  emitLastVersionOnly: boolean;
  versionOfPath: string | undefined;
  timestampPath: string | undefined;
  endpointHeaders: Record<string, string | undefined>;
  jwt: JwtArgs;
}

type FeedTarget = Partial<{
  infoRequestTimeout: number;
  sanitizeString: string;
  sanitizeRegex: string;
  sanitizeReplacement: string;
  replaceVersions: boolean;
  orderingStrategy: OrderedStrategy;
  emitLastVersionOnly: boolean;
  versionOfPath: string;
  timestampPath: string;
}> & { jwt?: Partial<JwtAuthArgs> & { useJwtAuth?: boolean } };

type HeaderTarget = { key?: string; value?: string };

/**
 * Asserts that a term is declared to be of the expected type.
 */
function assertType(
  term: RDF.Term,
  typeMap: Map<string, RDF.Term>,
  expected: RDF.NamedNode,
  description: string
): void {
  const actual = typeMap.get(term.value);
  if (!actual || actual.value !== expected.value) {
    throw new Error(`Received ${description} ${term.value} that is not asserted to be of type ${expected.value}`);
  }
}

const ORDERING_STRATEGIES = ["ascending", "descending", "none"];

/**
 * Builds a handler that assigns the parsed value to the given field of the feed's jwt configuration.
 */
function makeJwtAssignHandler<K extends keyof JwtAuthArgs | "useJwtAuth">(
  key: K,
  read: (value: RDF.Term) => (Partial<JwtAuthArgs> & { useJwtAuth?: boolean })[K]
): Handler<FeedTarget> {
  return (target, value) => {
    target.jwt ??= {};
    target.jwt[key] = read(value);
  };
}

const FEED_HANDLERS: HandleMap<FeedTarget> = {
  [LDES_CONSUMER("infoRequestTimeout").value]: makeAssignHandler("infoRequestTimeout", readPositiveInt),
  [LDES_CONSUMER("sanitizeString").value]: makeAssignHandler("sanitizeString", readString),
  [LDES_CONSUMER("sanitizeRegex").value]: (target, value) => {
    try {
      new RegExp(value.value, "g");
    } catch (_e) {
      throw new Error("expected a valid regular expression");
    }
    target.sanitizeRegex = value.value;
  },
  [LDES_CONSUMER("sanitizeReplacement").value]: makeAssignHandler("sanitizeReplacement", readString),
  [LDES_CONSUMER("replaceVersions").value]: makeAssignHandler("replaceVersions", readBoolean),
  [LDES_CONSUMER("orderingStrategy").value]: (target, value) => {
    if (!ORDERING_STRATEGIES.includes(value.value)) {
      throw new Error(`expected one of ${ORDERING_STRATEGIES.join(", ")}`);
    }
    target.orderingStrategy = value.value as OrderedStrategy;
  },
  [LDES_CONSUMER("emitLastVersionOnly").value]: makeAssignHandler("emitLastVersionOnly", readBoolean),
  [LDES_CONSUMER("versionOfPath").value]: makeAssignHandler("versionOfPath", readURI),
  [LDES_CONSUMER("timestampPath").value]: makeAssignHandler("timestampPath", readURI),
  [LDES_CONSUMER("jwtUseJwtAuth").value]: makeJwtAssignHandler("useJwtAuth", readBoolean),
  [LDES_CONSUMER("jwtClientId").value]: makeJwtAssignHandler("clientId", readString),
  [LDES_CONSUMER("jwtKeyPath").value]: makeJwtAssignHandler("keyPath", readString),
  [LDES_CONSUMER("jwtKeyAlgorithm").value]: makeJwtAssignHandler("keyAlgorithm", readString),
  [LDES_CONSUMER("jwtTokenUrl").value]: makeJwtAssignHandler("tokenUrl", readString),
  [LDES_CONSUMER("jwtTokenAudience").value]: makeJwtAssignHandler("tokenAudience", readString),
  [LDES_CONSUMER("jwtTokenExpiry").value]: makeJwtAssignHandler("tokenExpiry", readString),
  [LDES_CONSUMER("jwtTokenScope").value]: makeJwtAssignHandler("tokenScope", readString),
  [LDES_CONSUMER("jwtClientAssertionType").value]: makeJwtAssignHandler("clientAssertionType", readString),
};

const HEADER_ENTRY_HANDLERS: HandleMap<HeaderTarget> = {
  [UCO_TYPES("key").value]: makeAssignHandler("key", readString),
  [UCO_TYPES("value").value]: makeAssignHandler("value", readString),
};

async function fetchLdesFeedBindings(): Promise<Bindings[]> {
  logger.info("Fetching LDES feed configurations from the database");
  // @ts-expect-error mu-types does not declare the scope option on query
  const result = await query(FEED_CONFIG_QUERY, { scope: LDES_CONFIG_SCOPE });
  return result.results.bindings as Bindings[];
}

/**
 * Computes the sanitize configuration that must be used for a feed:
 * database-provided values win over the environment defaults.
 */
function readSanitize(target: FeedTarget): FeedSanitizeConfig | undefined {
  const sanitizeReplacement = target.sanitizeReplacement ?? LDES_SANITIZE_CONTENTS_REPLACEMENT ?? "";
  if (target.sanitizeString !== undefined) {
    return {
      match: target.sanitizeString,
      replacement: sanitizeReplacement,
      isRegex: false
    };
  }
  if (target.sanitizeRegex !== undefined) {
    return {
      match: target.sanitizeRegex,
      replacement: sanitizeReplacement,
      isRegex: true
    };
  }
  if (LDES_SANITIZE_CONTENTS_STRING) {
    return {
      match: LDES_SANITIZE_CONTENTS_STRING,
      replacement: LDES_SANITIZE_CONTENTS_REPLACEMENT ?? "",
      isRegex: false
    };
  }
  if (LDES_SANITIZE_CONTENTS_REGEX) {
    return {
      match: LDES_SANITIZE_CONTENTS_REGEX.source,
      replacement: LDES_SANITIZE_CONTENTS_REPLACEMENT ?? "",
      isRegex: true
    };
  }
  return undefined;
}

function buildLdesFeedConfig(view: string, target: FeedTarget, headers: Record<string, string | undefined>): LdesFeedConfig {
  return {
    view,
    infoRequestTimeout: target.infoRequestTimeout ?? LDES_INFO_REQUEST_TIMEOUT,
    sanitize: readSanitize(target),
    replaceVersions: target.replaceVersions ?? REPLACE_VERSIONS,
    orderingStrategy: target.orderingStrategy ?? ORDERING_STRATEGY,
    emitLastVersionOnly: target.emitLastVersionOnly ?? EMIT_LAST_VERSION_ONLY,
    versionOfPath: target.versionOfPath,
    timestampPath: target.timestampPath,
    endpointHeaders: { ...LDES_ENDPOINT_HEADERS, ...headers },
    jwt: resolveJwtArgs(target.jwt, view)
  } satisfies LdesFeedConfig;
}

function readFeedHeaders(
  view: RDF.Term,
  store: RdfStore,
  typeMap: Map<string, RDF.Term>
): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  const httpRequestHeader = UCO_OBSERVABLE("httpRequestHeader").value;
  for (const dictionaryQuad of store.getQuads(view, namedNode(httpRequestHeader), undefined, undefined)) {
    assertType(
      dictionaryQuad.object,
      typeMap,
      UCO_TYPES("Dictionary"),
      `http request header dictionary of LDES feed ${view.value}`
    );
    for (const entryQuad of store.getQuads(dictionaryQuad.object, UCO_TYPES("entry"), undefined, undefined)) {
      assertType(
        entryQuad.object,
        typeMap,
        UCO_TYPES("DictionaryEntry"),
        `http request header entry of LDES feed ${view.value}`
      );
      const entry = applyHandlers<HeaderTarget>(
        entryQuad.object,
        HEADER_ENTRY_HANDLERS,
        store,
        { duplicates: "last", label: `header entry ${entryQuad.object.value} of LDES feed ${view.value}`, warned: new Set() }
      );
      if (entry.key === undefined || entry.value === undefined) {
        throw new Error(`Received an http request header ${entryQuad.object.value} of LDES feed ${view.value} without a key or value`);
      }
      if (entry.key in headers) {
        logger.warn(`Duplicate header key ${entry.key} for LDES feed ${view.value}, using the last value`);
      }
      headers[entry.key] = entry.value;
    }
  }
  return headers;
}

export async function fetchLdesFeedConfigs(): Promise<LdesFeedConfig[]> {
  const store = buildStore(await fetchLdesFeedBindings());
  const typeMap = buildTypeMap(store);
  const views = store.getQuads(undefined, RDF_TYPE, LDES_CONSUMER("LdesFeed"), undefined);
  const warned = new Set<string>();

  const configs: LdesFeedConfig[] = [];
  for (const viewQuad of views) {
    const view = viewQuad.subject;
    const target = applyHandlers<FeedTarget>(view, FEED_HANDLERS, store, {
      duplicates: "first",
      label: `LDES feed configuration ${view.value}`,
      warned
    });
    const headers = readFeedHeaders(view, store, typeMap);
    configs.push(buildLdesFeedConfig(view.value, target, headers));
  }
  return configs;
}
