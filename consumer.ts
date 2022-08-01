import {
	newEngine,
	LDESClient,
} from "@treecg/actor-init-ldes-client";
import * as RDF from "rdf-js";
import { extractTimeStamp } from "./utils";
export type ConsumerArgs = {
	endpoint: string;
	interval?: number;
  initialState?: State;
};

export type Member = {
	id: RDF.Term;
	quads: RDF.Quad[];
};
export interface State {
  timestamp?: Date;
  page: string;
}

export default class Consumer {
	private client: LDESClient;
	private startPage: string;
  private startTimeStamp?: Date;
  private currentPage: string;
	private interval: number;
	constructor({ endpoint, interval = 500, initialState = { page: endpoint } }: ConsumerArgs) {
    this.startTimeStamp = initialState.timestamp;
    this.startPage = initialState.page;
    this.currentPage = initialState.page;
		this.interval = interval;
		this.client = newEngine();
	}

	listen(callback: (m: Member, state: State) => void): void {
    
		const stream = this.client.createReadStream(
			this.startPage,
			{
				pollingInterval: this.interval,
				representation: "Quads",
				mimeType: "application/ld+json",
				emitMemberOnce: true,
				fromTime: this.startTimeStamp
			},
		);
		stream.on("metadata", (metadata) => {
      this.currentPage = metadata.url;
    })
    stream.on("data", (member: Member) => {
      callback(member, { timestamp: extractTimeStamp(member), page: this.currentPage})
    })
    stream.on("error", (error) => {
      console.error(error);
    })
	}
}
