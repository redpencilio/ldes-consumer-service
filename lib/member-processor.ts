import type { Client } from "ldes-client";
import type { Term } from "@rdfjs/types";
import { RdfStore } from "rdf-stores";
import { getLoggerFor } from "./logger.ts";
import { processMember } from "../config/process-member.ts";
import type { UnderlyingSink } from "node:stream/web";

// ldes-client doesn't expose the `Member` type directly...
type Member =
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  ReturnType<Client["stream"]> extends ReadableStream<infer M> ? M : never;

export function memberProcessor(
  versionOfPath: Term,
  timestampPath: Term
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
    } catch (e) {
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
      } catch (e) {
        logger.error(e);
        controller.error(e);
      }
    },
  };

  return new WritableStream(sink, { highWaterMark: 1000 });
}
