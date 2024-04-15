import { pipeline, finished } from "stream/promises";
import { newEngine, LDESClient, State } from "@treecg/actor-init-ldes-client";
import * as RDF from '@rdfjs/types';
import { NamedNode } from '@rdfjs/types';
import { extractEndpointHeadersFromEnv } from "./rdf-utils";
import { LDES_ENDPOINT_HEADER_PREFIX, PERSIST_STATE } from "./config";
import { fetchState, updateState } from "./sparql-queries";
import MemberProcessor from "./member-processor";

export interface ConfigurableLDESOptions {
  pollingInterval?: number;
  mimeType?: string;
  dereferenceMembers?: boolean;
  requestsPerMinute?: number;
  loggingLevel: string;
}

interface LDESOptions {
  representation: string
  mimeType: string
  requestHeaders: { [key: string]: number | string | string[] }
  emitMemberOnce: boolean,
  disableSynchronization: boolean,
  pollingInterval?: number;
  dereferenceMembers?: boolean;
  requestsPerMinute?: number;
  loggingLevel: string;
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
      disableSynchronization: true,
      loggingLevel: "info",
    };
    this.ldesOptions = { ...defaultOptions, ...ldesOptions };
    this.datasetIri = datasetIri;
  }

  async consumeStream () {
    const lastState = PERSIST_STATE ? await fetchState(this.datasetIri) : undefined;
    try {
      const ldesStream = this.client.createReadStream(
        this.endpoint,
        // @ts-ignore
        this.ldesOptions,
        lastState as State | undefined
      );
      const memberProcessor = new MemberProcessor();

      finished(ldesStream)
          .then(() => console.log('Stream has finished.'))
          .catch(error => {
            console.log("processing stream failed");
            console.error(error);
          });
      await pipeline(
        ldesStream,
        memberProcessor
      );
      if (PERSIST_STATE) { await updateState(this.datasetIri, ldesStream.exportState()); }
      console.log("finished processing stream");
    } catch (e) {
      console.log("processing stream failed");
      console.error(e);
    }
  }
}
