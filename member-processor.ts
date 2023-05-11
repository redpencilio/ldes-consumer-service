import { Writable } from 'stream';
import * as RDF from "rdf-js";
import { TreeProperties, extractVersionTimestamp, extractBaseResourceUri, convertBlankNodes } from "./utils";
import { LDES_VERSION_OF_PATH, LDES_TIMESTAMP_PATH, REPLACE_VERSIONS } from "./config";
import { executeDeleteInsertQuery, getLatestTimestamp } from "./sparql-queries";
import { DataFactory } from "n3";
const { quad, variable } = DataFactory;


export type Member = {
  id: RDF.Term;
  quads: RDF.Quad[];
};

type  MemberWithCallBack = {
  member: Member;
  callback: () => void;
}

function timeout (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export default class MemberProcessor extends Writable {
  private treeProperties: TreeProperties;
  private latestVersionMap : Map<RDF.NamedNode, Date> = new Map();
  private shouldDrain = false;
  membersToProcess: MemberWithCallBack[] = [];

  constructor() {
    super({ objectMode: true, highWaterMark: 1000 });
    this.treeProperties = {
      versionOfPath: LDES_VERSION_OF_PATH,
      timestampPath: LDES_TIMESTAMP_PATH
    };
    this.processingLoop();
  }

  _write(member: Member, _encoding : string , callback: () => void) {
    this.membersToProcess.push({member, callback});
    if (this.membersToProcess.length > 50) {
      console.log('more than 50 members remaining to be processed, pausing pipeline');
      this.shouldDrain = true;
      return false;
    }
    else {
      return true;
    }
  }

  async processingLoop () {
    try {
      do {
        const next = this.membersToProcess.shift();
        if (next) {
          await this.processMember(next.member);
          next.callback();
          if (this.membersToProcess.length < 50 && this.shouldDrain) {
            this.shouldDrain = false;
            this.emit('drain');
          }
        }
        await timeout(500);
      } while (! this.closed);
    } catch (e) {
      this.destroy(e);
    }
  }

  async processMember (member: Member) {
    let quadsToAdd: RDF.Quad[] = [];
    const quadsToRemove: RDF.Quad[] = [];
    member.quads = convertBlankNodes(member.quads);
    const baseResourceUri = extractBaseResourceUri(member, this.treeProperties);
    if (baseResourceUri && REPLACE_VERSIONS) {
      const latestTimestamp = await this.latestVersionTimestamp(baseResourceUri, this.treeProperties);
      const versionTimestamp = extractVersionTimestamp(member, this.treeProperties);
      if (latestTimestamp === null) {
        quadsToAdd = member.quads;
        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri, versionTimestamp);
        }
      } else if (latestTimestamp && versionTimestamp && versionTimestamp > latestTimestamp) {
        quadsToRemove.push(
          quad(variable("s"), this.treeProperties.versionOfPath, baseResourceUri)
        );
        quadsToRemove.push(quad(variable("s"), variable("p"), variable("o")));
        if (versionTimestamp) {
          this.latestVersionMap.set(baseResourceUri, versionTimestamp);
          }
        quadsToAdd = member.quads;
      }
    } else {
      quadsToAdd = member.quads;
    }
    await executeDeleteInsertQuery(quadsToRemove, quadsToAdd);
  }

  async latestVersionTimestamp (resource: RDF.NamedNode, treeProperties: TreeProperties): Promise<Date | null> {
    if (this.latestVersionMap.has(resource)) {
      return this.latestVersionMap.get(resource)!;
    } else {
      const timestampStr = await getLatestTimestamp(resource, treeProperties);
      if (timestampStr) {
        const timestamp : Date = new Date(timestampStr);
        this.latestVersionMap.set(resource, timestamp);
        return timestamp;
      }
      return null;
    }
  }
}
