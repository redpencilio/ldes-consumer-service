import { LDES_REQUESTS_PER_MINUTE } from "../../cfg";
import { custom_headers_fetch } from "./custom-headers-fetch";
import ThrottledFetch from "./throttled-fetch";


let fetch_f: typeof fetch;
if (LDES_REQUESTS_PER_MINUTE > 0) {
  const throttledFetch = new ThrottledFetch(LDES_REQUESTS_PER_MINUTE);
  fetch_f = throttledFetch.throttled_fetch.bind(throttledFetch);
} else {
  fetch_f = fetch;
}

export async function custom_fetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return custom_headers_fetch(
    input,
    init,
    fetch_f,
  )
}