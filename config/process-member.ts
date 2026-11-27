import type { Client } from "ldes-client";
import { DataFactory } from "n3";
import { convertBlankNodes } from "../lib/utils.ts";
// eslint-disable-next-line n/no-missing-import
import { Quad, Term } from "@rdfjs/types";
import { INGEST_MODE, REPLACE_VERSIONS } from "../cfg.ts";
import type { LdesFeedConfig } from "../lib/ldes-config-repository.ts";
import { PROV } from "../lib/namespaces.ts";
import { executeDeleteInsertQuery } from "../lib/sparql-queries.ts";
const { namedNode, quad, variable } = DataFactory;

// ldes-client doesn't expose the `Member` type directly...
type Member =
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  ReturnType<Client["stream"]> extends ReadableStream<infer M> ? M : never;

export interface ProcessMemberOptions {
  replaceVersions?: boolean;
  feedConfig: LdesFeedConfig;
}

export async function processMember(
  member: Member,
  info: { versionOfPath?: Term; timestampPath?: Term },
  { replaceVersions = REPLACE_VERSIONS, feedConfig }: ProcessMemberOptions,
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
  const feedUri = namedNode(feedConfig.view);
  for (const subject of new Set(member.quads.map((q) => q.subject))) {
    quadsToAdd.push(quad(subject, PROV("wasGeneratedBy"), feedUri));
  }
  if (replaceVersions) {
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
