import { newEngine, LDESClient } from "@treecg/actor-init-ldes-client";
import * as RDF from "rdf-js";
import PromiseQueue from "./promise-queue";
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
	timestamp: Date;
	page: string;
}

const UPDATE_QUEUE: PromiseQueue<void> = new PromiseQueue<void>();

export default class Consumer {
	private client: LDESClient;
	private startPage: string;
	private startTimeStamp?: Date;
	private currentPage: string;
	private currentTimeStamp?: Date;
	private interval: number;
	constructor({ endpoint, interval = 500, initialState }: ConsumerArgs) {
		this.startTimeStamp = initialState?.timestamp;
		this.currentTimeStamp = initialState?.timestamp;
		this.startPage = initialState?.page ?? endpoint;
		this.currentPage = initialState?.page ?? endpoint; 
		this.interval = interval;
		this.client = newEngine();
	}

	async listen(callback: (m: Member, state: State) => void | Promise<void>) {
		const stream = this.client.createReadStream(this.startPage, {
			pollingInterval: this.interval,
			representation: "Quads",
			mimeType: "application/ld+json",
			emitMemberOnce: true,
			fromTime: this.startTimeStamp,
			disableSynchronization: true, 
		});
		stream.on("metadata", (metadata: any) => {
			this.currentPage = metadata.url;
		}); 
		stream.on("data", async (member: Member) => {
			const timestamp = extractTimeStamp(member);
			if (!this.currentTimeStamp || timestamp > this.currentTimeStamp) {
				this.currentTimeStamp = timestamp;
			}
			await UPDATE_QUEUE.push(async () =>
				callback(member, {
					timestamp: this.currentTimeStamp!,
					page: this.currentPage, 
				})
			);
		});
	}
}
