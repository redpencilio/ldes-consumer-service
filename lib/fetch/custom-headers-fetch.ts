import type { JwtAuthArgs } from "./jwt-auth.ts";
import { getLoggerFor } from "../logger.ts";
import { setJwtAuthHeader } from "./jwt-auth.ts";

type FetchArgs = Parameters<typeof fetch>;
const logger = getLoggerFor("custom-headers-fetch");

export interface HeadersFetchOptions {
  endpointHeaders: Record<string, string | undefined>;
  jwt: (JwtAuthArgs & { useJwtAuth: boolean }) | undefined;
}

export function createHeadersFetch (options: HeadersFetchOptions, fetchF: typeof fetch = fetch): typeof fetch {
  return async (input: FetchArgs[0], init?: FetchArgs[1]): Promise<Response> => {
    const reqInit = init || {};

    const headers = new Headers(reqInit.headers);

    for (const [header, value] of Object.entries(options.endpointHeaders)) {
      if (value !== undefined) {
        headers.append(header, value);
      }
    }

    if (options.jwt?.useJwtAuth) {
      reqInit.headers = await setJwtAuthHeader(headers, options.jwt);
    } else {
      reqInit.headers = headers;
    }

    logger.debug(`Fetching ${input}`);
    return fetchF(input, reqInit);
  };
}
