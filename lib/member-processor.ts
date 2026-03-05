import {  Term } from "@rdfjs/types";
import type { Member } from "ldes-client/dist/lib/fetcher";
import { RdfStore } from "rdf-stores";
import { getLoggerFor } from "./logger";
// @ts-ignore
import { DataFactory } from "n3";
import { processMember } from "../config/process-member";

const { quad, variable, namedNode } = DataFactory;

export function memberProcessor(
  versionOfPath: Term,
  timestampPath: Term,
): WritableStream<Member> {
  const logger = getLoggerFor("member-processor");

  const enrichMember = (member: Member) => {
    if (member.isVersionOf && member.timestamp) return member; // The member already contains the necessary metadata, no enrichment needed

    const memberStore = RdfStore.createDefault();
    member.quads.forEach((q) => memberStore.addQuad(q));

    try {
      if (!member.isVersionOf) {
        const isVersionOf = memberStore
          .getQuads(member.id, versionOfPath, null, null)
          .map((quad) => quad.object)[0];
        if (!isVersionOf)
          throw new Error(
            `Member did not contain a versionOf property (path: ${versionOfPath.value})`,
          );
        member.isVersionOf = isVersionOf.value;
      }

      if (!member.timestamp) {
        const timestamp = memberStore
          .getQuads(member.id, timestampPath, null, null)
          .map((quad) => quad.object)[0];
        if (!timestamp)
          throw new Error(
            `Member did not contain a timestamp property (path: ${timestampPath.value})`,
          );
        member.timestamp = timestamp.value;
      }
      return member;
    } catch (e: any) {
      logger.error(
        `Failed to enrich member with isVersionOf and timestamp metadata: ${e}`,
      );
      throw e;
    }
  };

  const sink: UnderlyingSink = {
    async write(member: Member, controller) {
      try {
        member = enrichMember(member);
        await processMember(member, { versionOfPath, timestampPath });
      } catch (e: any) {
        logger.error(e);
        controller.error(e);
      }
    },
  };

  return new WritableStream(sink, { highWaterMark: 1000 });
}
