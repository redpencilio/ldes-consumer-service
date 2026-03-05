import { Member } from "ldes-client/dist/lib/fetcher";
import { DataFactory } from "n3";
import { convertBlankNodes } from "../lib/utils";
import { Quad, Term } from "@rdfjs/types";
import { INGEST_MODE, REPLACE_VERSIONS } from "../cfg";
import { executeDeleteInsertQuery } from "../lib/sparql-queries";
const { namedNode, quad, variable } = DataFactory;

export async function processMember(
  member: Member,
  info: { versionOfPath?: Term; timestampPath?: Term },
) {
  let baseResourceUri;
  if (member.isVersionOf) {
    baseResourceUri = namedNode(member.isVersionOf);
  } else {
    throw new Error(
      `Member ${JSON.stringify(member)} does not contain isVersionOf information, cannot proceed`,
    );
  }

  member.quads = convertBlankNodes(member.quads);
  const quadsToAdd: Quad[] = member.quads;
  const quadsToRemove: Quad[] = [];
  if (REPLACE_VERSIONS) {
    const { versionOfPath } = info;
    if (versionOfPath === undefined) {
      throw new Error(
        `Consumer is configured to replace versions, but LDES feed did not contain versioning metadata (ldes:versionOfPath).`,
      );
    }

    if (INGEST_MODE === "MATERIALIZE") {
      quadsToRemove.push(quad(baseResourceUri, variable("p"), variable("o")));
    } else {
      quadsToRemove.push(
        quad(variable("s"), namedNode(versionOfPath?.value), baseResourceUri),
      );
      quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
    }
  }
  await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
}
