import { querySudo, updateSudo } from "@lblod/mu-auth-sudo";
import { literal, Literal, NamedNode, namedNode, quad } from "rdflib";

export class SparqlQuerying {
  private readonly endpoint: string;

  constructor (endpoint: string = "http://localhost:8996/sparql") {
    this.endpoint = endpoint;
  }

  public async insert (query: string): Promise<void> {
    const result = await updateSudo(query, {}, { sparqlEndpoint: this.endpoint });
    this.verifyResultToMatch(query, result, /(Insert into <.*>, \d+ \(or less\) (triples|quads) -- done)|(Insert into <.*>, 0 quads -- nothing to do)|(Insert into \d+ \(or more\) graphs, total \d+ \(or less\) quads -- done)/);
  }

  public async delete (query: string): Promise<void> {
    const result = await updateSudo(query, {}, { sparqlEndpoint: this.endpoint });
    this.verifyResultToMatch(query, result, /Delete from <.*>, \d+ \(or less\) (triples|quads) -- done/);
  }

  public async deleteInsert (query: string, resultVerification?: (deleteInsertResults: string[]) => void): Promise<void> {
    const result = await updateSudo(query, {}, { sparqlEndpoint: this.endpoint });
    this.verifyResultToMatch(query, result, /(Modify <.*>, delete \d+ \(or less\) and insert \d+ \(or less\) triples -- done|(Delete \d+ \(or less\) quads -- done)|(Delete from <.*>, 0 quads -- nothing to do)\n(Insert into <.*>, \d+ \(or less\) quads -- done)|(Insert into <.*>, 0 quads -- nothing to do))/);
    if (resultVerification) {
      const results = result.results.bindings.map((b: { [x: string]: { value: any; }; }) => b["callret-0"].value);
      resultVerification(results);
    }
  }

  public async singleRow (query: string): Promise<unknown | undefined> {
    const result = await querySudo(query, {}, { sparqlEndpoint: this.endpoint });
    const bindings = result?.results?.bindings;
    if (bindings) {
      if (bindings.length > 1) {
        throw new Error(`Expecting a single row from query (${query}), got ${bindings.length} results.`);
      }
    }
    return bindings[0];
  }

  public async list (query: string): Promise<unknown[]> {
    const result = await querySudo(query, {}, { sparqlEndpoint: this.endpoint });
    return result?.results?.bindings || [];
  }

  public async ask (query: string): Promise<boolean> {
    const result = await querySudo(query, {}, { sparqlEndpoint: this.endpoint });
    return result?.boolean;
  }

  public asQuads (queryResults: unknown[], graph: string) {
    return queryResults.map(r => {
      // @ts-ignore
      const s = this.asNamedNode(r.s);
      // @ts-ignore
      const p = this.asNamedNode(r.p);
      // @ts-ignore
      const o = this.asNamedNodeOrLiteral(r.o);
      const g = namedNode(graph);
      return quad(s, p, o, g);
    });
  }

  private asNamedNodeOrLiteral (term: any): NamedNode | Literal {
    if (term.type === "uri") {
      return this.asNamedNode(term);
    }
    if (term.type === "literal" ||
            term.type === "typed-literal") {
      return this.asLiteral(term);
    }
    throw new Error(`Could not parse ${JSON.stringify(term)} as Named Node Or Literal`);
  }

  private asLiteral (term: any): Literal {
    if (term.type !== "literal" &&
            term.type !== "typed-literal") {
      throw new Error(`Expecting a literal for ${term.value}`);
    }

    const lang: string | undefined = term["xml:lang"];
    const datatype: string | undefined = term.datatype;
    return literal(term.value, lang || datatype);
  }

  private asNamedNode (term: any): NamedNode {
    if (term.type !== "uri") {
      throw new Error(`Expecting an IRI for ${term.value}`);
    }

    return namedNode(term.value);
  }

  private verifyResultToMatch (query: string, result: any, expectedPattern: RegExp) {
    const results = result.results.bindings.map((b: { [x: string]: { value: any; }; }) => b["callret-0"].value);
    if (!results
      .every((ir: string) => expectedPattern.test(ir))) {
      const msg = `[${query}] gave incorrect result [${results.join(";")}]`;
      console.log(msg);
      throw new Error(msg);
    }
  }
}
