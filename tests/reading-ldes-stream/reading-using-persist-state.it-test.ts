import {SparqlQuerying} from "../test-helpers/sparql-querying";
import {Statement} from "rdflib";
import {v4 as uuid} from "uuid";
import {wait} from "../test-helpers/test-utils";
import {toIncludeAllMembers} from 'jest-extended';

expect.extend({toIncludeAllMembers});

describe("can read several pages from ldes, and persist the state, rereading if no caching headers were set", () => {

    test("can initially read entire stream", async () => {
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126")).length).toEqual(11);
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09")).length).toEqual(11);
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127")).length).toEqual(54);
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72")).length).toEqual(12);
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a")).length).toEqual(12);
        expect((await queryQuadsFor("http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3")).length).toEqual(11);
    });

    test("Adding a new instance in last page will be read", async() => {
        const response = await fetch(`http://localhost:35000/instancesnapshot/${uuid()}`, {method: "POST"});
        expect(response.ok).toBeTruthy();
        const createdSnapshot = await response.json();

        await wait(40000); //wait till processed

        console.log(createdSnapshot);

        //verify result
        const result = (await queryQuadsFor(createdSnapshot.id)).map((q) => q.toNQ());
        expect(result).toIncludeAllMembers([
            `<${createdSnapshot.id}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data-with-persist-state> .`,
            `<${createdSnapshot.id}> <http://purl.org/dc/terms/isVersionOf> <${createdSnapshot.isVersionOf}> <http://mu.semte.ch/graphs/ldes/example-ldes-data-with-persist-state> .`,
        ]);
    }, 60000)

});

const sparqlQuerying = new SparqlQuerying();

async function queryQuadsFor(s: string): Promise<Statement[]> {
    const rawResults = await sparqlQuerying.list(
        `select ?s ?p ?o where { graph <http://mu.semte.ch/graphs/ldes/example-ldes-data-with-persist-state> { BIND(<${s}> as ?s) ?s ?p ?o } }`);
    return sparqlQuerying.asQuads(rawResults, "http://mu.semte.ch/graphs/ldes/example-ldes-data-with-persist-state");
}

