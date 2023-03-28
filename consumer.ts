import { newEngine, LDESClient, EventStream, State } from "@treecg/actor-init-ldes-client";
import * as RDF from "rdf-js";
import { NamedNode } from "rdf-js";
import { TreeProperties, extractEndpointHeadersFromEnv, extractVersionTimestamp, extractBaseResourceUri, convertBlankNodes } from "./utils";
import { LDES_ENDPOINT_HEADER_PREFIX, LDES_VERSION_OF_PATH, LDES_TIMESTAMP_PATH, REPLACE_VERSIONS, SKIP_ERRORS } from "./config";
import { fetchState, updateState, executeDeleteInsertQuery, getLatestTimestamp } from "./sparql-queries";
import { DataFactory } from "n3";
const { quad, variable } = DataFactory;

export interface ConfigurableLDESOptions {
  pollingInterval?: number;
  mimeType?: string;
  dereferenceMembers?: boolean;
  requestsPerMinute?: number;
};

interface LDESOptions {
  representation: string
  mimeType: string
  requestHeaders: { [key: string]: number | string | string[] }
  emitMemberOnce: boolean,
  disableSynchronization: boolean,
  pollingInterval?: number;
  dereferenceMembers?: boolean;
  requestsPerMinute?: number;
}

export type ConsumerArgs = {
  datasetIri: NamedNode
  endpoint: string
  ldesOptions?: ConfigurableLDESOptions;
};

export type Member = {
  id: RDF.Term;
  quads: RDF.Quad[];
};

enum PAUSE_REASONS {
  NONE,
  UPDATE_STATE
}
const MEMBERS_PROCESSED_TRIGGER = 20;

export default class Consumer {
  private client: LDESClient;
  private endpoint: string;
  private datasetIri: NamedNode;
  private ldesOptions : LDESOptions;
  private treeProperties: TreeProperties;
  private latestVersionMap : Map<RDF.NamedNode, Date> = new Map();
  private isRunning: boolean = false;
  private pauseReason = PAUSE_REASONS.NONE;

  constructor ({ endpoint, datasetIri, ldesOptions }: ConsumerArgs) {
    this.endpoint = endpoint;
    this.client = newEngine();
    const defaultOptions = {
      representation: "Quads",
      mimeType: "application/ld+json",
      requestHeaders: extractEndpointHeadersFromEnv(LDES_ENDPOINT_HEADER_PREFIX),
      emitMemberOnce: true,
      disableSynchronization: true
    };
    this.ldesOptions = { ...defaultOptions, ...ldesOptions };
    this.datasetIri = datasetIri;
    this.treeProperties = {
      versionOfPath: LDES_VERSION_OF_PATH,
      timestampPath: LDES_TIMESTAMP_PATH
    };
  }

  consumeStream (): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (this.isRunning) reject(new Error("already running"));
      this.isRunning = true;
      try {
        const lastState = await fetchState(this.datasetIri).catch((e) => reject(e));
        let membersProcessed = 0;
        const stream = this.client.createReadStream(
          this.endpoint,
          this.ldesOptions,
        lastState as State | undefined
        );
        stream.on("data", async (member: Member) => {
          try {
            await this.processMember(member);
            membersProcessed++;
            if (membersProcessed % MEMBERS_PROCESSED_TRIGGER === 0) {
              this.pauseReason = PAUSE_REASONS.UPDATE_STATE;
              stream.pause();
            }
          } catch (e: unknown) {
            this.onError(stream, e as Error, reject);
          }
        });
        stream.on("error", (error) => {
          this.onError(stream, error, reject);
        });
        stream.on("pause", () => {
          this.onPause(stream);
        });
        stream.on("end", async () => {
          await updateState(this.datasetIri, stream.exportState());
          this.isRunning = false;
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async onPause (stream: EventStream) {
    if (this.pauseReason === PAUSE_REASONS.UPDATE_STATE) {
      await updateState(this.datasetIri, stream.exportState());
      this.pauseReason = PAUSE_REASONS.NONE;
      stream.resume();
    }
  }

  async onError (stream: EventStream, error: Error, reject: (reason?: unknown) => void) {
    console.error(error);
    if (!SKIP_ERRORS) {
      stream.destroy();
      this.isRunning = false;
      reject(new Error("failed to process member, stopping stream"));
    }
  }

  async processMember (member: Member) {
    let quadsToAdd: RDF.Quad[] = [];
    const quadsToRemove: RDF.Quad[] = [];
    member.quads = convertBlankNodes(member.quads);
    const baseResourceUri = extractBaseResourceUri(member, this.treeProperties);
    if (baseResourceUri && REPLACE_VERSIONS) {
      const latestTimestamp = await this.latestVersionTimestamp(baseResourceUri, this.treeProperties);
      const versionTimestamp = extractVersionTimestamp(member, this.treeProperties);
      if (latestTimestamp === null) {
        quadsToAdd = member.quads;
        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri, versionTimestamp);
        }
      } else if (latestTimestamp && versionTimestamp && versionTimestamp > latestTimestamp) {
        quadsToRemove.push(
          quad(variable("s"), this.treeProperties.versionOfPath, baseResourceUri)
        );
        quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri, versionTimestamp);
        }
        quadsToAdd = member.quads;
      }
    } else {
      quadsToAdd = member.quads;
    }
    await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  }

  async latestVersionTimestamp (resource: RDF.NamedNode, treeProperties: TreeProperties): Promise<Date | null> {
    if (this.latestVersionMap.has(resource)) {
      return this.latestVersionMap.get(resource)!;
    } else {
      const timestampStr = await getLatestTimestamp(resource, treeProperties);
      if (timestampStr) {
        const timestamp : Date = new Date(timestampStr);
        this.latestVersionMap.set(resource, timestamp);
        return timestamp;
      }
      return null;
    }
  }
}
