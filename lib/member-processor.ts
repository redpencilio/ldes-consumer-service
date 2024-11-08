import { Quad } from "@rdfjs/types";
import { Member } from "@greyoda/ldes-client";
import { executeDeleteInsertQuery } from "./sparql-queries";
import { convertBlankNodes } from './utils';
import { INGEST_MODE, REPLACE_VERSIONS } from '../cfg';
import { DCTERMS } from './namespaces';
import { getLoggerFor } from "./logger";
// @ts-ignore
import { DataFactory } from "n3";

const { quad, variable, namedNode } = DataFactory;

export function memberProcessor(): WritableStream<Member> {
  const logger = getLoggerFor("member-processor");

  const processMember = async (member: Member) => {
    let baseResourceUri;
    if (member.isVersionOf) {
      baseResourceUri = namedNode(member.isVersionOf);
    } else {
      throw new Error(`Member ${member} does not contain isVersionOf information, cannot proceed`);
    }

    member.quads = convertBlankNodes(member.quads);
    const quadsToAdd: Quad[] = member.quads;
    const quadsToRemove: Quad[] = [];
    if (REPLACE_VERSIONS) {
      if (INGEST_MODE === "MATERIALIZE") {
        quadsToRemove.push(quad(baseResourceUri, variable("p"), variable("o")));
      } else {
        quadsToRemove.push(
          /* TODO: hardcoding the predicate is not a good idea,
           * either the LDES client should inform us about this metadata
           * or we should make this configurable and bypass the client's
           * built-in versioning support. */
          quad(variable("s"), DCTERMS.versionOf, baseResourceUri)
        );
        quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
      }
    }
    await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  };

  const sink: UnderlyingSink = {
    async write(member: Member, controller) {
      try {
        await processMember(member);
      } catch (e: any) {
        logger.error(e);
        controller.error(e);
      }
    },
  };

  return new WritableStream(sink, { highWaterMark: 1000 });
}