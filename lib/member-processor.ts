import { Quad, Term } from "@rdfjs/types";
import { Member } from "ldes-client";
import { RdfStore } from "rdf-stores";
import { executeDeleteInsertQuery } from "./sparql-queries";
import { convertBlankNodes } from './utils';
import { INGEST_MODE, REPLACE_VERSIONS } from '../cfg';
import { getLoggerFor } from "./logger";
// @ts-ignore
import { DataFactory } from "n3";

const { quad, variable, namedNode } = DataFactory;

export function memberProcessor(
  versionOfPath: Term,
  timestampPath: Term,
): WritableStream<Member> {
  const logger = getLoggerFor("member-processor");

  const enrichMember = (member: Member) => {
    if (member.isVersionOf && member.timestamp)
      return member; // The member already contains the necessary metadata, no enrichment needed

    const memberStore = RdfStore.createDefault();
    member.quads.forEach((q) => memberStore.addQuad(q));

    try {
      if (!member.isVersionOf) {
        const isVersionOf = memberStore.getQuads(member.id, versionOfPath, null, null).map((quad) => quad.object)[0];
        member.isVersionOf = isVersionOf.value;
      }

      if (!member.timestamp) {
        const timestamp = memberStore.getQuads(member.id, timestampPath, null, null).map((quad) => quad.object)[0];
        member.timestamp = timestamp.value;
      }
      return member;
    } catch (e: any) {
      logger.error(`Failed to enrich member with isVersionOf and timestamp metadata: ${e}`);
      throw e;
    }
  }

  const processMember = async (member: Member) => {
    let baseResourceUri;
    if (member.isVersionOf) {
      baseResourceUri = namedNode(member.isVersionOf);
    } else {
      throw new Error(`Member ${JSON.stringify(member)} does not contain isVersionOf information, cannot proceed`);
    }

    member.quads = convertBlankNodes(member.quads);
    const quadsToAdd: Quad[] = member.quads;
    const quadsToRemove: Quad[] = [];
    if (REPLACE_VERSIONS) {
      if (versionOfPath === undefined) {
        throw new Error(`Consumer is configured to replacace versions, but LDES feed did not contain versioning metadata (ldes:versionOfPath).`);
      }

      if (INGEST_MODE === "MATERIALIZE") {
        quadsToRemove.push(quad(baseResourceUri, variable("p"), variable("o")));
      } else {
        quadsToRemove.push(
          quad(variable("s"), namedNode(versionOfPath?.value), baseResourceUri)
        );
        quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
      }
    }
    await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  };

  const sink: UnderlyingSink = {
    async write(member: Member, controller) {
      try {
        member = enrichMember(member);
        await processMember(member);
      } catch (e: any) {
        logger.error(e);
        controller.error(e);
      }
    },
  };

  return new WritableStream(sink, { highWaterMark: 1000 });
}