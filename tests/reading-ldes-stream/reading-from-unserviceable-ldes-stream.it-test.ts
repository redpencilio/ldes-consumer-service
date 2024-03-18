import fetch from "node-fetch";
import {wait} from "../test-helpers/test-utils";

//Note: most of these tests fail, and mess up the ldes consumer. Run them one by one to solve / investigate problems.
describe("can (re)read / recover from a (temporarily) unserviceable ldes stream ", () => {

    describe("failing ldes pages ", () => {

        test("connection end while reading ldes page leaves the ldes consumer hanging", async () => {
            //mimic the ldes page read connection end
            let response = await fetch(`http://localhost:35000/config?failLdesPages=connection_end`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection end problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-998: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("connection destroyed while reading ldes page leaves the ldes consumer hanging", async () => {
            //mimic the ldes page read connection destroy
            let response = await fetch(`http://localhost:35000/config?failLdesPages=connection_destroy`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection destroy problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-998: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("http-500 while reading ldes page leaves is ignored", async () => {
            //mimic the ldes page read http-500
            let response = await fetch(`http://localhost:35000/config?failLdesPages=http_500`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 500 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("http-404 while reading ldes page leaves is ignored", async () => {
            //mimic the ldes page read http-404
            let response = await fetch(`http://localhost:35000/config?failLdesPages=http_404`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 404 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("invalid json while reading ldes page leaves is ignored, but recoverable", async () => {
            //mimic the ldes page read invalid json
            let response = await fetch(`http://localhost:35000/config?failLdesPages=invalid_json`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the invalid json problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);
    });

    describe("failing json ld context ", () => {

        test("connection end while reading json ld context crashes the ldes consumer", async () => {
            //mimic the json ld context read connection end
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=connection_end`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection end problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO-LPDC-998: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("connection destroyed while reading json ld context crashes the ldes consumer", async () => {
            //mimic the json ld context read connection destroy
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=connection_destroy`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the connection destroy problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO-LPDC-998: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("http-500 while reading json ld context crashes the ldes consumer", async () => {
            //mimic the json ld context read http-500
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=http_500`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 500 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("http-404 while reading json ld context crashes the ldes consumer", async () => {
            //mimic the json ld context read http-404
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=http_404`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the http 404 problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);

        test("invalid json while reading json ld context crashes the ldes consumer", async () => {
            //mimic the json ld context read invalid json
            let response = await fetch(`http://localhost:35000/config?failJsonLdContext=invalid_json`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            await wait(20000); //wait till failure occurs in ldes consumer

            // fix the invalid json problem
            response = await fetch(`http://localhost:35000/config`, {method: "POST"});
            expect(response.ok).toBeTruthy();

            //TODO LPDC-968: add a new instance in stub, and wait till last page loads it, and verify in a loop the contents...
        }, 30000);
    });

});