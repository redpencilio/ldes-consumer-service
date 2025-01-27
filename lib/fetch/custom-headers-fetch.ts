import { LDES_ENDPOINT_HEADERS } from "../../cfg";

export async function custom_headers_fetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetch_f: typeof fetch = fetch,
): Promise<Response> {
  const reqInit = init || {};

  const headers = new Headers(reqInit.headers);
  
  for (const [header, value] of Object.entries(LDES_ENDPOINT_HEADERS)) {
    headers.append(header, value as string);
  }

  reqInit.headers = headers;

  return fetch_f(input, reqInit);
}