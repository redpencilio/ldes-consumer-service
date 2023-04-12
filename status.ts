import { COGS, DCTERMS, EXT, MU, PROV, RDF } from "./namespaces";
import { LDES_STREAM } from "./config";
import { sparqlEscapeDateTime, sparqlEscapeString, update, uuid } from "mu";

const JOB_STATUS_GRAPH = "http://mu.semte.ch/graphs/public";

export enum JobStatus {
  FAILED,
  SUCCESS
}

export async function updateStatus (jobURL: String | undefined, status: JobStatus) {
  if (jobURL) {
    let statusURL;
    switch (status) {
      case JobStatus.FAILED: {
        statusURL = COGS("Fail");
        break;
      }
      case JobStatus.SUCCESS: {
        statusURL = COGS("Success");
        break;
      }
    }
    if (statusURL) {
      const deleteQuery = `
DELETE {
    GRAPH <${JOB_STATUS_GRAPH}> {
        <${jobURL}> <${EXT("status").value}> ?status.
    }
} WHERE {
    GRAPH <${JOB_STATUS_GRAPH}> {
        <${jobURL}> <${EXT("status").value}> ?status.
    }
};`
      await update(deleteQuery);
      const insertQuery = `
INSERT DATA {
    GRAPH <${JOB_STATUS_GRAPH}> {
        <${jobURL}> <${PROV("endedAtTime").value}> ${sparqlEscapeDateTime(new Date())} ;
                    <${EXT("status").value}> <${statusURL.value}> .
    }
}
      `;
      await update(insertQuery);
    }
  }
}

export async function addStartedJob () {
  if (LDES_STREAM) {
    const _uuid = uuid();
    const jobURL = `https://my-application.com/vocab-download-jobs/${_uuid}`;
    const insertQuery = `
INSERT DATA {
    GRAPH <${JOB_STATUS_GRAPH}> {
        <${jobURL}> <${RDF("type").value}> <${COGS("Job").value}>;
                     <${RDF("type").value}> <${EXT("VocabDownloadJob").value}>;
                     <${MU("uuid").value}> ${sparqlEscapeString(_uuid)};
                     <${PROV("used").value}> <${LDES_STREAM}>;
                     <${DCTERMS("created").value}> ${sparqlEscapeDateTime(new Date())} ;
                     <${EXT("status").value}> <${COGS("Running").value}>;
                     <${PROV("startedAtTime").value}> ${sparqlEscapeDateTime(new Date())} ;
                     <${EXT("status").value}> <${COGS("Running").value}> .
    }
}
      `;
    await update(insertQuery);

    return jobURL;
  }
}
