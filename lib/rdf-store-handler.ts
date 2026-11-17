import type * as RDF from "@rdfjs/types";
import { DataFactory } from "n3";
import type { RdfStore } from "./rdf-store.ts";
import { getLoggerFor } from "./logger.ts";

const { namedNode } = DataFactory;

const logger = getLoggerFor("rdf-store-handler");

export type Handler<T> = (target: T, value: RDF.Term) => void;

export type HandleMap<T> = Record<string, Handler<T>>;

export const readString = (value: RDF.Term): string => value.value;

export function readPositiveInt(value: RDF.Term): number {
  const number = Number(value.value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error("expected a positive integer");
  }
  return number;
}

export function readBoolean(value: RDF.Term): boolean {
  if (value.value !== "true" && value.value !== "false") {
    throw new Error("expected \"true\" or \"false\"");
  }
  return value.value === "true";
}

export function readURI(value: RDF.Term): string {
  try {
    new URL(value.value);
  } catch (_e) {
    throw new Error("expected a (valid) URI");
  }
  return value.value;
}

/**
 * Builds a handler that assigns the parsed value to the given field of the target.
 */
export function makeAssignHandler<T extends object, K extends keyof T>(key: K, read: (value: RDF.Term) => T[K]): Handler<T> {
  return (target, value) => {
    target[key] = read(value);
  };
}

/**
 * Renders an RDF/JS term as its mu connection type, for consistent error messages.
 */
function muTermType(term: RDF.Term): string {
  switch (term.termType) {
    case "NamedNode":
      return "uri";
    case "BlankNode":
      return "bnode";
    default:
      return term.termType.toLowerCase();
  }
}

function predicateValueError(label: string, predicate: string, term: RDF.Term, reason: string): Error {
  return new Error(`Invalid value "${term.value}" (${muTermType(term)}) for predicate ${predicate} of ${label}: ${reason}`);
}

export interface ApplyHandlersOptions {
  duplicates: "first" | "last";
  label: string;
  warned: Set<string>;
}

/**
 * Fills a pojo by applying a handler per configured predicate to the values
 * of that predicate in the store.
 */
export function applyHandlers<T extends object>(
  subject: RDF.Term,
  handlers: HandleMap<T>,
  store: RdfStore,
  { duplicates, label, warned }: ApplyHandlersOptions
): T {
  const target = {} as T;
  for (const [predicate, handler] of Object.entries(handlers)) {
    const quads = store.getQuads(subject as RDF.Quad_Subject, namedNode(predicate), undefined, undefined);
    if (quads.length > 1) {
      if (duplicates === "first" && !warned.has(label)) {
        warned.add(label);
        logger.warn(`Multiple configuration values exist for ${label}, using the first ones`);
      }
    }
    const applicable = duplicates === "first" ? quads.slice(0, 1) : quads;
    for (const q of applicable) {
      try {
        handler(target, q.object);
      } catch (e) {
        throw predicateValueError(label, predicate, q.object, (e as Error).message);
      }
    }
  }
  return target;
}
