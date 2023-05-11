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

function timeout (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class MemberProcessor {
  membersToProcess: Member[] = [];
  processMember: (member: Member) => Promise<void>;
  errorCallback: (error: Error) => void;
  emptyQueueCallback: () => void;
  afterMemberProcessedCallback: (member?: Member) => Promise<void>;

  running = false;

  constructor (
    processMember: (member: Member) => Promise<void>,
    onError: (error: Error,) => void,
    onEmptyQueue: () => void,
    onProcessedMember: (member?: Member) => Promise<void>
  ) {
    this.errorCallback = onError;
    this.processMember = processMember;
    this.emptyQueueCallback = onEmptyQueue;
    this.afterMemberProcessedCallback = onProcessedMember;
  }

  get queueLength () {
    return this.membersToProcess.length;
  }

  addMemberToQueue (member: Member) {
    this.membersToProcess.push(member);
  }

  startProcessing () {
    if (!this.running) {
      this.running = true;
      this.processNextMember();
    } else {
      throw new Error("already running");
    }
  }

  stopProcessing () {
    this.running = false;
  }

  async processNextMember () {
    try {
      do {
        if (this.queueLength > 150) {
          console.log("queue length is growing ", this.queueLength);
        }
        const next = this.membersToProcess.shift();
        if (next) {
          await this.processMember(next);
          await timeout(10);
        }
      } while (this.running === true);
    } catch (e) {
      this.running = false;
      this.errorCallback(e);
    }
  }
}
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
    return new Promise((resolve, reject) => {
      if (this.isRunning) reject(new Error("already running"));
      this.isRunning = true;
      fetchState(this.datasetIri)
        .then((state: State | undefined) => this.processStream(state))
        .then(() => resolve())
        .catch((e) => reject(e));
    });
  }

  processStream (lastState: State | undefined) : Promise<void> {
    console.log(lastState);
    return new Promise((resolve, reject) => {
      const stream = this.client.createReadStream(
        this.endpoint,
        this.ldesOptions,
        lastState as State | undefined
      );
      const memberProcessor = new MemberProcessor(
        (member) => this.processMember(member),
        (error) => this.onError(stream, error, reject),
        () => this.maybeFinishProcessing(stream, resolve),
        (member?: Member) => this.memberProcessed(member)
      );
      console.log('starting processor');
      memberProcessor.startProcessing();

      stream.on("data", (member: Member) => {
        console.log("received member");
        memberProcessor.addMemberToQueue(member);
      });

      stream.on("error", (error) => {
        this.onError(stream, error, reject);
      });
      stream.on("pause", () => {
        this.onPause(stream);
      });
      stream.on("end", async () => {
        if (memberProcessor.queueLength === 0) {
          this.isRunning = false;
          updateState(this.datasetIri, stream.exportState()).then();
          console.log("stream fully processed!");
          resolve();
        }
      });
    });
  }

  async memberProcessed (member?: Member) {
    console.log(member);
  }

  maybeFinishProcessing (stream: EventStream, resolve: () => void) {
    if (stream.closed) {
      resolve();
    }
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
