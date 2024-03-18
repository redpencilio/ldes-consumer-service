import express from "express";
import fs from "fs";
import { instanceSnapshot } from "./extra-instancesnapshots.js";
import * as http from "http";

const app = express();

const HOSTNAME = process.env.HOSTNAME || "localhost";

app.use(express.json({type: ["application/json", "application/ld+json"]}));

// possible values: 'connection_end', 'connection_destroy', 'http_500', 'http_404', 'invalid_json', undefined
let mimicFailureLdesPages = undefined;
// possible values: 'connection_end', 'connection_destroy', 'http_500', 'http_404', 'invalid_json', undefined
let mimicFailureJsonLdContext = undefined;

const extraInstanceSnapshots = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, _) {
    if (err) {
        console.log(err);
        res.status(404).send();
    }
}

app.post("/instancesnapshot/:instanceId", (req, res, next) => {
    try {
        const instanceId = req.params.instanceId;
        console.log(`creating new instancesnapshot for instance [${instanceId}]]`);

        const instanceSnapshotToAdd = instanceSnapshot(instanceId);
        if (instanceSnapshotToAdd) {
            extraInstanceSnapshots.push(instanceSnapshotToAdd);
            return res.status(200).json({
                id: instanceSnapshotToAdd["@id"],
                isVersionOf: instanceSnapshotToAdd.isVersionOf,
                title: instanceSnapshotToAdd.titel["nl-BE-x-informal"],
                description: instanceSnapshotToAdd.beschrijving["nl-BE-x-informal"].replace("<p data-indentation-level=\"0\">", "").replace("</p>", "")
            });
        } else {
            return res.sendStatus(400);
        }
    } catch (e) {
        next(e);
    }
});

app.post("/config", (req, res, next) => {
    try {
        console.log('received new config');
        const failLdesPages = req.query.failLdesPages;
        console.log(`failLdesPages [${failLdesPages}]]`);
        mimicFailureLdesPages = failLdesPages;

        const failJsonLdContext = req.query.failJsonLdContext;
        console.log(`failJsonLdContext [${failJsonLdContext}]]`);
        mimicFailureJsonLdContext = failJsonLdContext;

        res.status(200).send("ok");
    } catch (e) {
        next(e);
    }
});

app.get("/doc/instancesnapshot", (req, res, next) => {
    const pageNumber = Number(req.query.pageNumber) || 0;

    if (mimicFailureLdesPages === 'connection_end') {
        console.log(`page ${pageNumber} requested, but [${mimicFailureLdesPages}]`);
        res.socket.end();
        return;
    }
    if (mimicFailureLdesPages === 'connection_destroy') {
        console.log(`page ${pageNumber} requested, but [${mimicFailureLdesPages}]`);
        res.socket.destroy();
        return;
    }
    if(mimicFailureLdesPages === 'invalid_json') {
        console.log(`page ${pageNumber} requested, but [${mimicFailureLdesPages}]`);
        res.status(200).type("application/ld+json").json('Some invalid json for a ldes page');
        return;
    }
    try {
        const httpStatus = mimicFailureLdesPages === 'http_500' ? 500 : (mimicFailureLdesPages === 'http_404' ? 404 : 200);
        console.log(`page ${pageNumber} requested [status=${httpStatus}]`);
        const page = fs.readFileSync(`./ldes-pages/page-${pageNumber}.json`, "utf8").replaceAll("hostname", HOSTNAME);
        const jsonLd = JSON.parse(page);
        jsonLd.member = jsonLd.member.concat(extraInstanceSnapshots);
        res.status(httpStatus).type("application/ld+json").json(jsonLd);
    } catch (e) {
        next(e);
    }
});

app.get("/InstanceJsonLdContext.jsonld", (req, res, next) => {
    if (mimicFailureJsonLdContext === 'connection_end') {
        console.log(`InstanceJsonLdContext.jsonld requested, but [${mimicFailureJsonLdContext}]`);
        res.socket.end();
        return;
    }
    if (mimicFailureJsonLdContext === 'connection_destroy') {
        console.log(`InstanceJsonLdContext.jsonld requested, but [${mimicFailureJsonLdContext}]`);
        res.socket.destroy();
        return;
    }
    if(mimicFailureJsonLdContext === 'invalid_json') {
        console.log(`InstanceJsonLdContext.jsonld requested, but [${mimicFailureJsonLdContext}]`);
        res.status(200).type("application/ld+json").json('Some invalid json for a ld context');
        return;
    }

    try {
        const httpStatus = mimicFailureJsonLdContext === 'http_500' ? 500 : (mimicFailureJsonLdContext === 'http_404' ? 404 : 200);
        console.log(`InstanceJsonLdContext.jsonld requested [status=${mimicFailureJsonLdContext}]`);
        const page = fs.readFileSync("./ldes-pages/InstanceJsonLdContext.jsonld", "utf8");
        const jsonLd = JSON.parse(page);
        res.status(httpStatus).type("application/ld+json").json(jsonLd);
    } catch (e) {
        next(e);
    }
});

app.use(errorHandler);

app.listen(80, () => {
    console.log("Instance stub listening on port 80");
});
