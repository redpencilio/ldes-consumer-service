import { newEngine } from "@treecg/actor-init-ldes-client";
import { Quad } from "n3";
import { purl } from "./namespaces";
import {
	executeDeleteInsertQuery,
	executeDeleteQuery,
	executeInsertQuery,
	getEndTime,
	replaceEndTime,
} from "./sparql-queries";

import { DataFactory } from "n3";
import PromiseQueue from "./promise-queue";
const { quad, namedNode, variable } = DataFactory;

let lastInsertedMember: any;

let PROMISE_QUEUE: PromiseQueue<void> = new PromiseQueue<void>();

function extractTimeStamp(member) {
	const timeStamp: Quad = member.quads.find(
		(quadObj) => quadObj.predicate.value === process.env.LDES_RELATION_PATH
	);
	return timeStamp.object;
}

async function processMember(member) {
	console.log("process start");
	const quadsToAdd: Quad[] = member.quads.filter(
		(quadObj) => quadObj.subject.value === member.id.value
	);
	const quadsToRemove: Quad[] = [];
	const baseResourceMatches = quadsToAdd.filter((quadObj) =>
		quadObj.predicate.equals(purl("isVersionOf"))
	);
	if (baseResourceMatches && baseResourceMatches.length) {
		const baseResourceUri = baseResourceMatches[0];
		quadsToRemove.push(
			quad(variable("s"), purl("isVersionOf"), baseResourceUri.object)
		);
		quadsToAdd.forEach((quadObj, i) => {
			quadsToRemove.push(
				quad(variable("s"), quadObj.predicate, variable(`o${i}`))
			);
		});

		// the old versions should be removed from the virtuoso triplestore
	}

	await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
	await processTimeStamp(member);
	console.log("process end");
}

async function processTimeStamp(member) {
	try {
		let timestamp = extractTimeStamp(member);
		if (timestamp) {
			await replaceEndTime(timestamp);
		}
	} catch (e) {
		throw e;
	}
}

async function main() {
	try {
		const endTime = await getEndTime();
		console.log("Start time: ", endTime);
		let url = process.env.LDES_ENDPOINT_VIEW;
		let options = {
			pollingInterval: parseInt(process.env.LDES_POLLING_INTERVAL), // millis
			representation: "Quads", //Object or Quads
			fromTime: undefined,
			mimeType: "application/ld+json",
			emitMemberOnce: true,
		};
		let LDESClient = new newEngine();

		let eventstreamSync = LDESClient.createReadStream(url, options);
		eventstreamSync.on("data", (member) => {
			lastInsertedMember = member;
			PROMISE_QUEUE.push(() => processMember(member));
		});
		eventstreamSync.on("end", () => {
			console.log("No more data!");
		});
	} catch (e) {
		throw e;
	}
}

main();
