import { newEngine, State, LDESClient, EventStream } from "@treecg/actor-init-ldes-client";
import * as RDF from "rdf-js";

export type ConsumerArgs = {
	endpoint: string;
	interval?: number;
};

export type Member = {
  id: RDF.Term,
  quads: RDF.Quad[]
}

export default class Consumer {
	private client: LDESClient;
	private endpoint: string;
	private interval: number;
	constructor({ endpoint, interval = 500 }: ConsumerArgs) {
		this.endpoint = endpoint;
		this.interval = interval;
		this.client = newEngine();
	}

	listen(startTimeStamp?: Date, initialState?: State): EventStream {
		const stream = this.client.createReadStream(
			this.endpoint,
			{ pollingInterval: this.interval,
        representation: "Quads",
        mimeType: "application/ld+json",
        emitMemberOnce: true,
        fromTime: startTimeStamp
      },
			initialState
		);
    return stream;
	}
}
