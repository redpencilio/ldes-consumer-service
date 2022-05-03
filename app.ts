import { newEngine } from "@treecg/actor-init-ldes-client";
import { Quad } from "n3";
import { purl } from "./namespaces";
import {
	executeInsertQuery,
	getEndTime,
	replaceEndTime,
} from "./sparql-queries";

let lastInsertedMember: any;

async function main() {
	try {
		const endTime = await getEndTime();
		console.log("Start time: ", endTime);
		let url = process.env.LDES_ENDPOINT_VIEW;
		let options = {
			pollingInterval: parseInt(process.env.LDES_POLLING_INTERVAL), // millis
			representation: "Quads", //Object or Quads
			fromTime: endTime,
			mimeType: "application/ld+json",
			emitMemberOnce: true,
		};
		let LDESClient = new newEngine();

		let eventstreamSync = LDESClient.createReadStream(url, options);
		eventstreamSync.on("data", (member) => {
			if (options.representation && options.representation === "Quads") {
				lastInsertedMember = member;
				const quads: Quad[] = member.quads.filter(
					(quadObj) => quadObj.subject.value === member.id.value
				);
				const baseResourceUri = quads.filter((quadObj) =>
					quadObj.predicate.equals(purl("isVersionOf"))
				);
				if (baseResourceUri && baseResourceUri[0]) {
					console.log(baseResourceUri[0].object);
				}
				executeInsertQuery(quads);
			}
		});

		eventstreamSync.on("pause", async () => {
			console.log("PAUSE");
			if (lastInsertedMember) {
				const timeStamp: Quad = lastInsertedMember.quads.find(
					(quadObj) =>
						quadObj.predicate.value ===
						process.env.LDES_RELATION_PATH
				);
				if (timeStamp) {
					await replaceEndTime(timeStamp.object);
				}
			}
		});
		eventstreamSync.on("end", () => {
			console.log("No more data!");
		});
	} catch (e) {
		throw e;
	}
}

main();
