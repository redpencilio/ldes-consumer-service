import { pipeline } from 'stream/promises';
import { newEngine, LDESClient, State } from "@treecg/actor-init-ldes-client";
import * as RDF from "rdf-js";
import { NamedNode } from "rdf-js";
import { extractEndpointHeadersFromEnv } from "./utils";
import { LDES_ENDPOINT_HEADER_PREFIX, PERSIST_STATE } from "./config";
import { fetchState, updateState } from "./sparql-queries";
import { DataFactory } from "n3";
const { quad, variable } = DataFactory;
import MemberProcessor from './member-processor';

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

export default class LdesPipeline {
  private client: LDESClient;
  private endpoint: string;
  private datasetIri: NamedNode;
  private ldesOptions : LDESOptions;
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
  }

  async consumeStream(jobURL: string) {
    const lastState = PERSIST_STATE ? await fetchState(this.datasetIri) : undefined;
    try {
      const ldesStream = this.client.createReadStream(
        this.endpoint,
        this.ldesOptions,
        lastState as State | undefined
      );
      const memberProcessor = new MemberProcessor(jobURL);
      await pipeline(
        ldesStream,
        memberProcessor
      )
      if (PERSIST_STATE)
        await updateState(this.datasetIri, ldesStream.exportState());
      console.log('finished processing stream');
    }
    catch (e) {
      console.log('processing stream failed');
      console.error(e);
    }
  }


}
