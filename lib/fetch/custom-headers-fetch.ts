import { LDES_ENDPOINT_HEADERS } from "../../cfg";
import { getLoggerFor } from "../logger";
import { setJwtAuthHeader } from "./jwt-auth";
const JWT_CLIENT_ID = "d9718ad9-b093-4f64-80dc-a0f677ae15e5";
const JWK_KEY_PATH = "/data/awv.json";
const JWT_TOKEN_URL = "https://authenticatie.vlaanderen.be/op/v1/token";

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

  if (JWT_CLIENT_ID && JWK_KEY_PATH && JWT_TOKEN_URL) {
    reqInit.headers = await setJwtAuthHeader(headers, {
      clientId: JWT_CLIENT_ID,
      keyPath: JWK_KEY_PATH,
      tokenUrl: JWT_TOKEN_URL
    });
  } else {
    reqInit.headers = headers;
  }

  logger.debug(`Fetching ${input}`);
  return fetchF(input, reqInit);
}
