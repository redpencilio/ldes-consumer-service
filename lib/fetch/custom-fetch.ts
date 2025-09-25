import { LDES_REQUESTS_PER_MINUTE } from "../../cfg";
import { custom_headers_fetch } from "./custom-headers-fetch";
import ThrottledFetch from "./throttled-fetch";
import { StringReplaceTransformStream } from "string-replace-transform-stream";

type FetchArgs = Parameters<typeof fetch>;

// TODO add an env var for what to sanitise and whether to do it in the first place
const sanitisedFetch = async (...args: FetchArgs) => {
  const res = await fetch(...args);
  const sanitisedBody = res.body?.pipeThrough(new StringReplaceTransformStream("\\u0020", ""));

  return new Response(sanitisedBody, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers
  });
};

let fetchF: typeof fetch;
if (LDES_REQUESTS_PER_MINUTE > 0) {
  const throttledFetch = new ThrottledFetch(LDES_REQUESTS_PER_MINUTE);
  fetchF = (...args: FetchArgs) => throttledFetch.throttled_fetch(args[0], args[1], sanitisedFetch);
} else {
  fetchF = sanitisedFetch;
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
