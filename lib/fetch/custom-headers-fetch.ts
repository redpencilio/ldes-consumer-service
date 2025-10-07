import { JWT_CONFIG, JWT_USE_JWT_AUTH, LDES_ENDPOINT_HEADERS } from "../../cfg";
import { getLoggerFor } from "../logger";
import { setJwtAuthHeader } from "./jwt-auth";

type FetchArgs = Parameters<typeof fetch>;
const logger = getLoggerFor("custom-headers-fetch");

export async function customHeadersFetch (
  input: FetchArgs[0],
  init?: FetchArgs[1],
  fetchF: typeof fetch = fetch
): Promise<Response> {
  const reqInit = init || {};

  const headers = new Headers(reqInit.headers);

  for (const [header, value] of Object.entries(LDES_ENDPOINT_HEADERS)) {
    headers.append(header, value as string);
  }

  if (JWT_USE_JWT_AUTH && JWT_CONFIG) {
    reqInit.headers = await setJwtAuthHeader(headers, JWT_CONFIG);
  } else {
    reqInit.headers = headers;
  }

  logger.debug(`Fetching ${input}`);
  return fetchF(input, reqInit);
}
