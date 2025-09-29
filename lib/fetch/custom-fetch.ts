import {
  LDES_REQUESTS_PER_MINUTE,
  LDES_SANITIZE_CONTENTS_REGEX,
  LDES_SANITIZE_CONTENTS_REPLACEMENT,
  LDES_SANITIZE_CONTENTS_STRING
} from "../../cfg";
import { custom_headers_fetch } from "./custom-headers-fetch";
import ThrottledFetch from "./throttled-fetch";
import { StringReplaceTransformStream } from "string-replace-transform-stream";

type FetchArgs = Parameters<typeof fetch>;

const sanitizeMatch = LDES_SANITIZE_CONTENTS_STRING ?? LDES_SANITIZE_CONTENTS_REGEX;
const sanitizedFetch = !sanitizeMatch
  ? fetch
  : async (...args: FetchArgs) => {
    const res = await fetch(...args);
    const sanitizedBody = res.body?.pipeThrough(
      new StringReplaceTransformStream(sanitizeMatch, LDES_SANITIZE_CONTENTS_REPLACEMENT ?? "")
    );

    return new Response(sanitizedBody, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });
  };

let fetchF: typeof fetch;
if (LDES_REQUESTS_PER_MINUTE > 0) {
  const throttledFetch = new ThrottledFetch(LDES_REQUESTS_PER_MINUTE);
  fetchF = (...args: FetchArgs) => throttledFetch.throttled_fetch(args[0], args[1], sanitizedFetch);
} else {
  fetchF = sanitizedFetch;
}

export async function custom_fetch (
  input: FetchArgs[0],
  init?: FetchArgs[1]
): Promise<Response> {
  return custom_headers_fetch(
    input,
    init,
    fetchF
  );
}
