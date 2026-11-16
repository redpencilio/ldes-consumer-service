import { LDES_REQUESTS_PER_MINUTE } from "../../cfg.ts";
import { createHeadersFetch } from "./custom-headers-fetch.ts";
import ThrottledFetch from "./throttled-fetch.ts";
import { StringReplaceTransformStream } from "string-replace-transform-stream";
import type { FeedSanitizeConfig } from "../ldes-config-repository.ts";
import type { JwtAuthArgs } from "./jwt-auth.ts";

type FetchArgs = Parameters<typeof fetch>;

export interface CustomFetchOptions {
  sanitize: FeedSanitizeConfig | undefined;
  jwt: (JwtAuthArgs & { useJwtAuth: boolean }) | undefined;
  endpointHeaders: Record<string, string | undefined>;
}

export function createCustomFetch (options: CustomFetchOptions): typeof fetch {
  const customFetch = createHeadersFetch(options);
  const sanitize = options.sanitize;

  const sanitizedFetch: typeof fetch = !sanitize
    ? customFetch
    : async (...args: FetchArgs) => {
        const res = await customFetch(...args);

        // Sanitized body streams need "highWaterMark" values larger than 0 with respect to the response size
        let match: string | RegExp;
        if (sanitize.isRegex) {
          match = new RegExp(sanitize.match, "g");
        } else {
          match = sanitize.match;
        }
        const sanitizedBody = res.body?.pipeThrough(
          new StringReplaceTransformStream(
            match,
            sanitize.replacement
          )
        );
        // @ts-expect-error fix this by piping sanitizedbody to a textencoder
        return new Response(sanitizedBody, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      };

  let fetchF: typeof fetch;
  if (LDES_REQUESTS_PER_MINUTE > 0) {
    const throttledFetch = new ThrottledFetch(LDES_REQUESTS_PER_MINUTE);
    fetchF = (...args: FetchArgs) =>
      throttledFetch.throttled_fetch(args[0], args[1], sanitizedFetch);
  } else {
    fetchF = sanitizedFetch;
  }

  return (...args: FetchArgs) => fetchF(...args);
}
