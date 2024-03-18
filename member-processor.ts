import { Writable } from "stream";
import * as RDF from "rdf-js";
import { TreeProperties, extractVersionTimestamp, extractBaseResourceUri, convertBlankNodes } from "./rdf-utils";
import { LDES_VERSION_OF_PATH, LDES_TIMESTAMP_PATH, REPLACE_VERSIONS } from "./config";
import { executeDeleteInsertQuery, getLatestTimestamp } from "./sparql-queries";
import { DataFactory } from "n3";
const { quad, variable } = DataFactory;

export type Member = {
  id: RDF.Term;
  quads: RDF.Quad[];
};

type MemberWithCallBack = {
  member: Member;
  callback: (e?: Error) => void;
}

function timeout (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export default class MemberProcessor extends Writable {
  private treeProperties: TreeProperties;
  private latestVersionMap : Map<string, Date> = new Map();
  membersToProcess: MemberWithCallBack[] = [];

  constructor () {
    super({ objectMode: true, highWaterMark: 1000 });
    this.treeProperties = {
      versionOfPath: LDES_VERSION_OF_PATH,
      timestampPath: LDES_TIMESTAMP_PATH
    };
    this.processingLoop();
  }

  _write (member: Member, _encoding : string, callback: () => void) {
    this.membersToProcess.push({ member, callback });
    return true;
  }

  async processingLoop () {
    do {
      const next = this.membersToProcess.shift();
      if (next) {
        try {
          await this.processMember(next.member);
          next.callback();
        } catch (e) {
          console.error(e);
          // @ts-ignore
          next.callback(e);
          // @ts-ignore
          this.destroy(e);
        }
      }
      await timeout(10);
    } while (!this.closed);
  }

  async processMember (member: Member) {
    let quadsToAdd: RDF.Quad[] = [];
    const quadsToRemove: RDF.Quad[] = [];
    member.quads = convertBlankNodes(member.quads);
    const baseResourceUri = extractBaseResourceUri(member, this.treeProperties);
    if (baseResourceUri) {
      const latestTimestamp = await this.latestVersionTimestamp(baseResourceUri, this.treeProperties);
      const versionTimestamp = extractVersionTimestamp(member, this.treeProperties);

      // Case: the first time we ingest a version for this resource.
      if (latestTimestamp === null) {
        quadsToAdd = member.quads;
        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri.value, versionTimestamp);
        }
        // eslint-disable-next-line brace-style
      }
      // Case: the retrieved version is newer then the last version found in the store.
      else if (latestTimestamp && versionTimestamp && versionTimestamp > latestTimestamp) {
        // Here, we only want the latest version of the resource in the store.
        if (REPLACE_VERSIONS) {
          quadsToRemove.push(
            quad(variable("s"), this.treeProperties.versionOfPath, baseResourceUri)
          );
          quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
        }

        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri.value, versionTimestamp);
        }
        quadsToAdd = member.quads;
      }
    } else {
      console.warn(`
        No baseResourceUri found for the member. This might potentialy be an odd LDES-feed.
        If this member contained blank nodes, multiple instances of the same blank nodes will be created.
      `);
      quadsToAdd = member.quads;
    }
    await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  }

  async latestVersionTimestamp (resource: RDF.NamedNode, treeProperties: TreeProperties): Promise<Date | null> {
    if (this.latestVersionMap.has(resource.value)) {
      return this.latestVersionMap.get(resource.value)!;
    } else {
      const timestampStr = await getLatestTimestamp(resource, treeProperties);
      if (timestampStr) {
        const timestamp : Date = new Date(timestampStr);
        this.latestVersionMap.set(resource.value, timestamp);
        return timestamp;
      }
      return null;
    }
  }
}
