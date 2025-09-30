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
  const now = Date.now() / 1000;
  return !lastTokenRefresh || (now - lastTokenRefresh) > (token.expires_in * 0.95);
}

export interface JwtAuthArgs {
  clientId: string;
  keyPath: string;
  keyAlgorithm: string;
  tokenUrl: string;
  tokenAudience: string;
  tokenExpiry: string;
  tokenScope: string;
  clientAssertionType: string;
}

async function refreshAccessToken ({
  clientId,
  keyPath,
  keyAlgorithm,
  tokenUrl,
  tokenAudience,
  tokenExpiry,
  tokenScope,
  clientAssertionType
}: JwtAuthArgs) {
  logger.info("Refreshing access token");
  let tokenReq: Response;
  try {
    lastTokenRefresh = Date.now() / 1000;
    const secret = await importJWK(await getKey(keyPath));
    const jwt = await new SignJWT({
      iss: clientId,
      sub: clientId,
      aud: tokenAudience,
      jti: uuidv4()
    })
      .setProtectedHeader({ alg: keyAlgorithm, typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(tokenExpiry)
      .sign(secret);

    tokenReq = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_assertion: jwt,
        client_assertion_type: clientAssertionType,
        scope: tokenScope
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
