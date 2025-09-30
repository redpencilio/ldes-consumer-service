import { readFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { importJWK, JWK, SignJWT } from "jose";
import { getLoggerFor } from "../logger";

const logger = getLoggerFor("jwt-auth");

type AccessToken = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
};
let accessToken: AccessToken | undefined;
let lastTokenRefresh: number | undefined;

let jwk: JWK | undefined;
async function getKey (keyPath: string) {
  if (!jwk) {
    const keyFile = await readFile(keyPath, { encoding: "utf8" });
    jwk = JSON.parse(keyFile);
  }
  return jwk;
}

function isCloseToExpiry (token: AccessToken) {
  const now = Date.now();
  return !lastTokenRefresh || lastTokenRefresh + token.expires_in * 0.95 > now;
}

export interface JwtAuthArgs {
  clientId: string;
  keyPath: string;
  tokenUrl: string;
}

async function refreshAccessToken ({ clientId, keyPath, tokenUrl }: JwtAuthArgs) {
  logger.info("Refreshing access token");
  lastTokenRefresh = Date.now() / 1000;
  const secret = await importJWK(await getKey(keyPath));
  const jwt = await new SignJWT({
    iss: clientId,
    sub: clientId,
    aud: "https://authenticatie.vlaanderen.be/op",
    jti: uuidv4()
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("10minutes")
    .sign(secret);

  let tokenReq: Response;
  try {
    tokenReq = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_assertion: jwt,
        client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        scope: "awv_toep_services" // alternatief: "vo_info" voor een key op de PUB omgeving
      })
    });
  } catch (err) {
    logger.error("Error while attempting to refresh access token");
    logger.error(err);
    process.exit(1);
  }
  if (!tokenReq.ok) {
    logger.error(new Error(`Unexpected response refreshing access token: ${tokenReq.statusText}`));
    process.exit(1);
  }
  return tokenReq.json();
}

export async function setJwtAuthHeader (
  headers: Headers,
  jwtAuthArgs: JwtAuthArgs
): Promise<Headers> {
  if (!accessToken || isCloseToExpiry(accessToken)) {
    accessToken = await refreshAccessToken(jwtAuthArgs);
  }
  if (!accessToken) {
    throw new Error("no access token when making request");
  }
  if (headers.has("Authorization")) {
    logger.warn("Cannot pass custom Authorization headers if using JWT auth, overwriting");
    headers.delete("Authorization");
  }
  headers.append("Authorization", `${accessToken.token_type} ${accessToken.access_token}`);
  return headers;
}
