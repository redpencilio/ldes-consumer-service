import fetch from "node-fetch";
import {wait} from "../test-helpers/test-utils";
import {v4 as uuid} from "uuid";
import {SparqlQuerying} from "../test-helpers/sparql-querying";
import {Statement} from "rdflib";
import {toIncludeAllMembers} from 'jest-extended';

expect.extend({toIncludeAllMembers});

describe("can (re)read / recover from a (temporarily) unserviceable ldes stream ", () => {

    describe("failing ldes pages ", () => {

        test("connection end while reading ldes page propagates the error and retries on next cron tick", async () => {
            //mimic the ldes page read connection end
            let response = await fetch(`http://localhost:35000/config?failLdesPages=connection_end`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection end problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("connection destroyed while reading ldes page propagates the error and retries on next cron tick", async () => {
            //mimic the ldes page read connection destroy
            let response = await fetch(`http://localhost:35000/config?failLdesPages=connection_destroy`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection destroy problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("http-500 while reading ldes page leaves is ignored", async () => {
            //mimic the ldes page read http-500
            let response = await fetch(`http://localhost:35000/config?failLdesPages=http_500`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 500 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("http-404 while reading ldes page leaves is ignored", async () => {
            //mimic the ldes page read http-404
            let response = await fetch(`http://localhost:35000/config?failLdesPages=http_404`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 404 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("invalid json while reading ldes page propagates the error and retries on next cron tick", async () => {
            //mimic the ldes page read invalid json
            let response = await fetch(`http://localhost:35000/config?failLdesPages=invalid_json`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the invalid json problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);
    });

    describe("failing json ld context ", () => {

        //note all these test fail, out of the box, only succeed if 1/ either you auto restart the ldes-consumer in docker config 2/ you manually restart the ldes consumer while running the tests

        test("connection end while reading json ld context propagates the error and retries on next cron tick", async () => {
            //mimic the json ld context read connection end
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=connection_end`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection end problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();

        }, 60000);

        test("connection destroyed while reading json ld context propagates the error and retries on next cron tick", async () => {
            //mimic the json ld context read connection destroy
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=connection_destroy`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection destroy problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("http-500 while reading json ld context propagates the error and retries on next cron tick", async () => {
            //mimic the json ld context read http-500
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=http_500`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 500 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("http-404 while reading json ld context propagates the error and retries on next cron tick", async () => {
            //mimic the json ld context read http-404
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=http_404`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 404 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);

        test("invalid json while reading json ld context propagates the error and retries on next cron tick", async () => {
            //mimic the json ld context read invalid json
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=invalid_json`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the invalid json problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult();
        }, 60000);
    });

});

const sparqlQuerying = new SparqlQuerying();

async function queryQuadsFor(s: string): Promise<Statement[]> {
    const rawResults = await sparqlQuerying.list(
        `select ?s ?p ?o where { graph <http://mu.semte.ch/graphs/ldes/example-ldes-data-no-persist-state> { BIND(<${s}> as ?s) ?s ?p ?o } }`);
    return sparqlQuerying.asQuads(rawResults, "http://mu.semte.ch/graphs/ldes/example-ldes-data-no-persist-state");
}

async function setUpNewInstanceInLdesStubWaitTillProcessedAndVerifyResult() {
    const response = await fetch(`http://localhost:35000/instancesnapshot/${uuid()}`, {method: "POST"});
    expect(response.ok).toBeTruthy();
    const createdSnapshot = await response.json();

    await wait(20000); //wait till processed

    console.log(createdSnapshot);

    //verify result
    const result = (await queryQuadsFor(createdSnapshot.id)).map((q) => q.toNQ());
    expect(result).toIncludeAllMembers([
        `<${createdSnapshot.id}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data-no-persist-state> .`,
        `<${createdSnapshot.id}> <http://purl.org/dc/terms/isVersionOf> <${createdSnapshot.isVersionOf}> <http://mu.semte.ch/graphs/ldes/example-ldes-data-no-persist-state> .`,
    ]);
}

