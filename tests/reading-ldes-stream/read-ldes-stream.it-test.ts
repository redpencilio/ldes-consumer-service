import { SparqlQuerying } from "../test-helpers/sparql-querying";
import { Statement } from "rdflib";

describe("can read several pages from ldes, and create correct (nested) triples ", () => {
  const sparqlQuerying = new SparqlQuerying();

  describe("first page", () => {
    test("Verify the first member read from the first page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126";
      const quadsToTurtle = (await queryQuadsFor(sparqlQuerying, s)).map((q) => q.toNQ());

      expect(quadsToTurtle).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-02-18T06:32:10.377Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/c0d6bf9a-fcc4-4d46-beb6-3f4d80f03bf3> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://schema.org/dateCreated> \"2024-02-14T13:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://schema.org/dateModified> \"2024-02-14T13:59:25.236Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://purl.org/dc/terms/title> \"Minimalistische instantie\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Beschrijving van de minimalistische instantie</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5126> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });

    test("Verify the updated first member read from the first page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09";
      const quadsToTurtle = (await queryQuadsFor(sparqlQuerying, s)).map((q) => q.toNQ());

      expect(quadsToTurtle).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-02-20T07:32:10.377Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/c0d6bf9a-fcc4-4d46-beb6-3f4d80f03bf3> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://schema.org/dateCreated> \"2024-02-14T13:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://schema.org/dateModified> \"2024-02-15T14:59:30.236Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://purl.org/dc/terms/title> \"Minimalistische instantie updatet\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Beschrijving van de minimalistische instantie updatet</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/84d1e739-d20c-4986-84d8-331bd58feb09> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });
  });

  describe("second page", () => {
    test("Verify first member read from the second page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127";
      let quadsToTurtle = await queryQuadsFor(sparqlQuerying, s);

      const requirements = quadsToTurtle.filter(q => q.predicate.value === "http://vocab.belgif.be/ns/publicservice#hasRequirement");
      expect(requirements.length).toEqual(2);
      console.log(requirements);

      let requirement1Quads = await queryQuadsFor(sparqlQuerying, requirements[0].object.value);
      const evidenceRequirement1 = requirement1Quads.filter(q => q.predicate.value === "http://data.europa.eu/m8g/hasSupportingEvidence");
      expect(evidenceRequirement1.length).toEqual(1);

      const requirement1evidenceQuads = await queryQuadsFor(sparqlQuerying, evidenceRequirement1[0].object.value);

      expect(requirement1evidenceQuads.map(q => q.toNQ())).toEqual([
        "<BLANK_ID> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.europa.eu/m8g/Evidence> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Bewijs - 1\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Evidence - 1\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">If you collect the document yourself:<ul><li>your own identity card.</li></ul>If you are requesting the document for someone else:<ul><li>a power of attorney from that person and a copy of their identity card</li></ul><ul><li>as well as your own identity card.</li></ul> - 1</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Als u het document zelf ophaalt:<ul><li>uw eigen identiteitskaart.</li></ul>Als u het document voor iemand anders aanvraagt:<ul><li>een volmacht van de betrokkene en een kopie van zijn of haar identiteitskaart</li><li>uw eigen identiteitskaart.</li></ul> - nl - 1</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ].map(l => l.replace("BLANK_ID", evidenceRequirement1[0].object.value)));

      requirement1Quads = requirement1Quads.filter(q => q.predicate.value !== "http://data.europa.eu/m8g/hasSupportingEvidence");
      expect(requirement1Quads.map(q => q.toNQ())).toEqual([
        "<BLANK_ID> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.europa.eu/m8g/Requirement> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Requirements - 1\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Voorwaarden - 1\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">De akte vermeldt:<ul><li>de naam, de voornamen, de geboortedatum en de geboorteplaats van de persoon op wie de akte betrekking heeft</li><li>de wettelijke basis van de verklaring op basis waarvan de akte werd opgesteld</li><li>in geval van nationaliteitstoekenning op basis van de artikelen 8, § 1, 2°, b), 9, 2°, b), en 11, § 2, van het Wetboek van de Belgische nationaliteit: de naam, de voornamen, de geboortedatum en de geboorteplaats van de verklaarder of verklaarders.</li></ul>Onder bepaalde voorwaarden kunt u een afschrift of een uittreksel van de akte van Belgische nationaliteit aanvragen:<ul><li>Een afschrift vermeldt de oorspronkelijke gegevens van de akte en de historiek van de staat van de persoon op wie de akte betrekking heeft.</li><li>Een uittreksel vermeldt daarentegen enkel de actuele gegevens van de akte, zonder vermelding van de historiek van de staat van de persoon op wie de akte betrekking heeft. Op een uittreksel is dus enkel de huidige toestand van de gegevens zichtbaar.</li></ul><h3>Wie kan een afschrift of uittreksel aanvragen?</h3>Voor akten van Belgische nationaliteit wordt het recht op een afschrift of uittreksel beperkt tot:<ul><li>uzelf</li><li>de echtgeno(o)te, overlevende echtgeno(o)te of wettelijk samenwonende</li><li>uw wettelijke vertegenwoordiger (bv. ouder, voogd, bewindvoerder)</li><li>bloedverwanten in opgaande of neerdalende lijn (geen aanverwanten en zijtakken)</li><li>uw erfgenamen</li><li>bijzondere gemachtigden zoals een notaris of advocaat.</li></ul>Als de akte meer dan 100 jaar oud is, heeft iedereen recht op een afschrift of uittreksel. - nl - 1</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">The right to receive a copy of or an extract from certificates of Belgian nationality is limited to:<ul><li>yourself</li><li>your spouse, surviving spouse, or legal cohabitant</li><li>your legal representative (e.g. a parent, guardian, conservator)</li><li>blood relatives in the ascending or descending line (no relatives by affinity and side branches)</li><li>your heirs</li><li>special agents, such as notaries or lawyers.</li></ul>If the certificate is more than 100 years old, anyone is entitled to request a copy or an extract. - 1</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://www.w3.org/ns/shacl#order> \"0\"^^<http://www.w3.org/2001/XMLSchema#integer> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ].map(l => l.replace("BLANK_ID", requirements[0].object.value)));

      let requirement2Quads = await queryQuadsFor(sparqlQuerying, requirements[1].object.value);
      const evidenceRequirement2 = requirement2Quads.filter(q => q.predicate.value === "http://data.europa.eu/m8g/hasSupportingEvidence");
      expect(evidenceRequirement2.length).toEqual(1);

      const requirement2evidenceQuads = await queryQuadsFor(sparqlQuerying, evidenceRequirement2[0].object.value);

      expect(requirement2evidenceQuads.map(q => q.toNQ())).toEqual([
        "<BLANK_ID> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.europa.eu/m8g/Evidence> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Bewijs - 2\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Evidence - 2\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Als u het document zelf ophaalt:<ul><li>uw eigen identiteitskaart.</li></ul>Als u het document voor iemand anders aanvraagt:<ul><li>een volmacht van de betrokkene en een kopie van zijn of haar identiteitskaart</li><li>uw eigen identiteitskaart.</li></ul> - nl - 2</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">If you collect the document yourself:<ul><li>your own identity card.</li></ul>If you are requesting the document for someone else:<ul><li>a power of attorney from that person and a copy of their identity card</li></ul><ul><li>as well as your own identity card.</li></ul> - 2</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ].map(l => l.replace("BLANK_ID", evidenceRequirement2[0].object.value)));

      requirement2Quads = requirement2Quads.filter(q => q.predicate.value !== "http://data.europa.eu/m8g/hasSupportingEvidence");
      expect(requirement2Quads.map(q => q.toNQ())).toEqual([
        "<BLANK_ID> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.europa.eu/m8g/Requirement> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Requirements - 2\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/title> \"Voorwaarden - 2\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">The right to receive a copy of or an extract from certificates of Belgian nationality is limited to:<ul><li>yourself</li><li>your spouse, surviving spouse, or legal cohabitant</li><li>your legal representative (e.g. a parent, guardian, conservator)</li><li>blood relatives in the ascending or descending line (no relatives by affinity and side branches)</li><li>your heirs</li><li>special agents, such as notaries or lawyers.</li></ul>If the certificate is more than 100 years old, anyone is entitled to request a copy or an extract. - 2</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">De akte vermeldt:<ul><li>de naam, de voornamen, de geboortedatum en de geboorteplaats van de persoon op wie de akte betrekking heeft</li><li>de wettelijke basis van de verklaring op basis waarvan de akte werd opgesteld</li><li>in geval van nationaliteitstoekenning op basis van de artikelen 8, § 1, 2°, b), 9, 2°, b), en 11, § 2, van het Wetboek van de Belgische nationaliteit: de naam, de voornamen, de geboortedatum en de geboorteplaats van de verklaarder of verklaarders.</li></ul>Onder bepaalde voorwaarden kunt u een afschrift of een uittreksel van de akte van Belgische nationaliteit aanvragen:<ul><li>Een afschrift vermeldt de oorspronkelijke gegevens van de akte en de historiek van de staat van de persoon op wie de akte betrekking heeft.</li><li>Een uittreksel vermeldt daarentegen enkel de actuele gegevens van de akte, zonder vermelding van de historiek van de staat van de persoon op wie de akte betrekking heeft. Op een uittreksel is dus enkel de huidige toestand van de gegevens zichtbaar.</li></ul><h3>Wie kan een afschrift of uittreksel aanvragen?</h3>Voor akten van Belgische nationaliteit wordt het recht op een afschrift of uittreksel beperkt tot:<ul><li>uzelf</li><li>de echtgeno(o)te, overlevende echtgeno(o)te of wettelijk samenwonende</li><li>uw wettelijke vertegenwoordiger (bv. ouder, voogd, bewindvoerder)</li><li>bloedverwanten in opgaande of neerdalende lijn (geen aanverwanten en zijtakken)</li><li>uw erfgenamen</li><li>bijzondere gemachtigden zoals een notaris of advocaat.</li></ul>Als de akte meer dan 100 jaar oud is, heeft iedereen recht op een afschrift of uittreksel. - nl - 2</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<BLANK_ID> <http://www.w3.org/ns/shacl#order> \"1\"^^<http://www.w3.org/2001/XMLSchema#integer> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ].map(l => l.replace("BLANK_ID", requirements[1].object.value)));

      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://vocab.belgif.be/ns/publicservice#hasRequirement");

      const rules = quadsToTurtle.filter(q => q.predicate.value === "http://purl.org/vocab/cpsv#follows");
      expect(rules.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://purl.org/vocab/cpsv#follows");

      const websites = quadsToTurtle.filter(q => q.predicate.value === "http://www.w3.org/2000/01/rdf-schema#seeAlso");
      expect(websites.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://www.w3.org/2000/01/rdf-schema#seeAlso");

      const costs = quadsToTurtle.filter(q => q.predicate.value === "http://data.europa.eu/m8g/hasCost");
      expect(costs.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://data.europa.eu/m8g/hasCost");

      const financialAdvantages = quadsToTurtle.filter(q => q.predicate.value === "http://purl.org/vocab/cpsv#produces");
      expect(financialAdvantages.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://purl.org/vocab/cpsv#produces");

      const legalResources = quadsToTurtle.filter(q => q.predicate.value === "http://data.europa.eu/m8g/hasLegalResource");
      expect(legalResources.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://data.europa.eu/m8g/hasLegalResource");

      const contactPoints = quadsToTurtle.filter(q => q.predicate.value === "http://data.europa.eu/m8g/hasContactPoint");
      expect(contactPoints.length).toEqual(2);
      quadsToTurtle = quadsToTurtle.filter(q => q.predicate.value !== "http://data.europa.eu/m8g/hasContactPoint");

      expect(quadsToTurtle.map(q => q.toNQ())).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-02-28T02:16:39.134Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/c31c343e-836c-4674-8efa-991cc2078493> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://schema.org/dateCreated> \"2024-02-14T13:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://schema.org/dateModified> \"2024-02-14T13:59:25.237Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/title> \"Akte van Belgische nationaliteit\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/title> \"Certificate of Belgian nationality\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">The certificate of Belgian nationality is granted to citizens who have acquired Belgian nationality through the procedure of nationality declaration or naturalisation.</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">De akte van Belgische nationaliteit wordt toegekend aan burgers die de Belgische nationaliteit hebben verkregen via de procedure van nationaliteitsverklaring of van naturalisatie. Onder bepaalde voorwaarden kunt u een afschrift of een uittreksel van de akte van Belgische nationaliteit aanvragen.</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/c5623baf3970c5efa9746dff01afd43092c1321a47316dbe81ed79604b56e8ea> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44000> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/source> <https://ipdc.tni-vlaanderen.be/id/concept/705d401c-1a41-4802-a863-b22499f71b84> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://schema.org/startDate> \"2020-08-26T11:40:20.026205Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://schema.org/endDate> \"2025-07-12T11:40:20.026205Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#additionalDescription> \"<p data-indentation-level=\\\"0\\\">Verdere beschrijving</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#additionalDescription> \"<p data-indentation-level=\\\"0\\\">The certificate states:<ul><li>the last name, first names, date and place of birth of the person to whom the certificate relates</li><li>the legal foundation of the declaration on the basis of which the certificate was drawn up</li><li>in the case nationality is granted on the basis of Articles 8, § 1, 2°, b), 9, 2°, b), and 11, § 2, of the Belgian Nationality Code: the last name, first names, date and place of birth of the declarant or declarants.</li></ul>Under certain conditions, you can request a copy of or an extract from the certificate of Belgian nationality:<ul><li>A copy contains the original data of the certificate and the history of the status of the person to whom the certificate relates.</li></ul><ul><li>An extract, on the contrary, only states the current details of the certificate, without stating the history of the status of the person to whom the certificate relates. Therefore, an extract only shows the current status of the data.</li></ul></p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#exception> \"<p data-indentation-level=\\\"0\\\">Exceptions</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#exception> \"<p data-indentation-level=\\\"0\\\">uitzonderingen</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#regulation> \"<p data-indentation-level=\\\"0\\\">Regelgeving</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#regulation> \"<p data-indentation-level=\\\"0\\\">Regulation</p>\"@en <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/type> <https://productencatalogus.data.vlaanderen.be/id/concept/Type/FinancieelVoordeel> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#targetAudience> <https://productencatalogus.data.vlaanderen.be/id/concept/Doelgroep/Burger> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#targetAudience> <https://productencatalogus.data.vlaanderen.be/id/concept/Doelgroep/Onderneming> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://data.europa.eu/m8g/thematicArea> <https://productencatalogus.data.vlaanderen.be/id/concept/Thema/BurgerOverheid> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://data.europa.eu/m8g/thematicArea> <https://productencatalogus.data.vlaanderen.be/id/concept/Thema/CultuurSportVrijeTijd> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/language> <http://publications.europa.eu/resource/authority/language/NLD> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://purl.org/dc/terms/language> <http://publications.europa.eu/resource/authority/language/ENG> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#competentAuthorityLevel> <https://productencatalogus.data.vlaanderen.be/id/concept/BevoegdBestuursniveau/Federaal> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#competentAuthorityLevel> <https://productencatalogus.data.vlaanderen.be/id/concept/BevoegdBestuursniveau/Europees> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#executingAuthorityLevel> <https://productencatalogus.data.vlaanderen.be/id/concept/UitvoerendBestuursniveau/Lokaal> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#executingAuthorityLevel> <https://productencatalogus.data.vlaanderen.be/id/concept/UitvoerendBestuursniveau/Derden> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://www.w3.org/ns/dcat#keyword> \"Akte\"@nl <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <http://www.w3.org/ns/dcat#keyword> \"Nationaliteit\"@nl <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#publicationMedium> <https://productencatalogus.data.vlaanderen.be/id/concept/PublicatieKanaal/YourEurope> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#yourEuropeCategory> <https://productencatalogus.data.vlaanderen.be/id/concept/YourEuropeCategorie/VerblijfNaturalisatie> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/6e9334cb-272c-443d-8b0a-1b02149a5127> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#yourEuropeCategory> <https://productencatalogus.data.vlaanderen.be/id/concept/YourEuropeCategorie/VoertuigenVerkeersregels> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });

    test("Verify the second member read from the second page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72";
      const quadsToTurtle = (await queryQuadsFor(sparqlQuerying, s)).map((q) => q.toNQ());

      expect(quadsToTurtle).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-03-01T06:32:10.377Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/2e018424-7af6-4798-8026-0e627a8694d8> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://schema.org/dateCreated> \"2024-02-24T11:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://schema.org/dateModified> \"2024-02-25T13:59:25.236Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://purl.org/dc/terms/title> \"Instantie die gearchiveerd zal worden\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Beschrijving van de instantie die gearchiveerd zal worden</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/a62cee64-9086-4864-9be9-1f72798a8c72> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#isArchived> \"0\"^^<http://www.w3.org/2001/XMLSchema#boolean> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });

    test("Verify the third member read from the second page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a";
      const quadsToTurtle = (await queryQuadsFor(sparqlQuerying, s)).map((q) => q.toNQ());

      expect(quadsToTurtle).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-03-02T06:32:10.377Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/2e018424-7af6-4798-8026-0e627a8694d8> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://schema.org/dateCreated> \"2024-02-24T11:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://schema.org/dateModified> \"2024-02-27T13:59:25.236Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://purl.org/dc/terms/title> \"Instantie die gearchiveerd is\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Beschrijving van de instantie die gearchiveerd is</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/f9aceb0a-5225-4b0c-be55-e14a2954347a> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#isArchived> \"1\"^^<http://www.w3.org/2001/XMLSchema#boolean> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });
  });

  describe("third page", () => {
    test("Verify the first member read from the third page of the ldes stream", async () => {
      const s = "http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3";
      const quadsToTurtle = (await queryQuadsFor(sparqlQuerying, s)).map((q) => q.toNQ());
      expect(quadsToTurtle).toEqual([
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#InstancePublicServiceSnapshot> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://www.w3.org/ns/prov#generatedAtTime> \"2024-02-29T14:32:10.377Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://purl.org/dc/terms/isVersionOf> <http://data.lblod.info/id/public-service/ad3abd4f-d4aa-4e92-99e4-ef2dc2376bf6> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://purl.org/pav/createdBy> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://schema.org/dateCreated> \"2024-02-29T08:42:12.357Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://schema.org/dateModified> \"2024-02-29T13:25:25.236Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://purl.org/dc/terms/title> \"Toelating voor losse standplaats op een openbare markt\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://purl.org/dc/terms/description> \"<p data-indentation-level=\\\"0\\\">Een losse standplaats op een openbare markt is een standplaats voor de marktdag zelf en onderscheidt zich van een standplaats per abonnement. De gemeente bepaalt autonoom de werkwijze voor de toewijzing van de losse standplaatsen en legt de bepalingen vast in haar gemeentelijk reglement.</p>\"@nl-be-x-informal <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://data.europa.eu/m8g/hasCompetentAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <http://purl.org/dc/terms/spatial> <http://vocab.belgif.be/auth/refnis2019/44021> <http://mu.semte.ch/graphs/ldes/example-ldes-data> .",
        "<http://data.lblod.info/id/public-service-snapshot/1e9d08b6-c298-4884-a201-bf5f17f30bb3> <https://productencatalogus.data.vlaanderen.be/ns/ipdc-lpdc#hasExecutingAuthority> <http://data.lblod.info/id/bestuurseenheden/353234a365664e581db5c2f7cc07add2534b47b8e1ab87c821fc6e6365e6bef5> <http://mu.semte.ch/graphs/ldes/example-ldes-data> ."
      ]);
    });
  });
});

async function queryQuadsFor (sparqlQuerying: SparqlQuerying, s: string): Promise<Statement[]> {
  const rawResults = await sparqlQuerying.list(
        `select ?s ?p ?o where { BIND(<${s}> as ?s) ?s ?p ?o }`);
  return sparqlQuerying.asQuads(rawResults, "http://mu.semte.ch/graphs/ldes/example-ldes-data");
}
