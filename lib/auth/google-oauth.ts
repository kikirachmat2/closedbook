// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GOOGLE OAUTH 2.0 PROTOCOL ENGINE (ADR-001)
// =========================================================================

import {
  GOOGLE_AUTH_ENDPOINT,
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_REVOKE_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
  GOOGLE_OAUTH_SCOPES,
} from "./constants";
import { UserIdentity, OAuthTokens } from "./session";

export interface ExchangeCodeOptions {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Builds the Google authorization URL containing PKCE challenge and scopes.
 */
export function buildGoogleAuthUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state,
  prompt = "consent",
}: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  prompt?: string;
}): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt,
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges the authorization code + PKCE verifier for OAuth access & refresh tokens.
 */
export async function exchangeCodeForTokens({
  code,
  codeVerifier,
  redirectUri,
  clientId,
  clientSecret,
}: ExchangeCodeOptions): Promise<GoogleTokenResponse> {
  const bodyParams: Record<string, string> = {
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };

  if (clientSecret) {
    bodyParams.client_secret = clientSecret;
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange authorization code: ${response.status} ${errorBody}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

/**
 * Fetches basic user profile from Google UserInfo endpoint.
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<UserIdentity> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user profile: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
export async function refreshGoogleAccessToken({
  refreshToken,
  clientId,
  clientSecret,
}: {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
}): Promise<Partial<OAuthTokens>> {
  const bodyParams: Record<string, string> = {
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };

  if (clientSecret) {
    bodyParams.client_secret = clientSecret;
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh Google access token: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
    refreshToken: data.refresh_token || refreshToken, // Retain existing if not rotated
  };
}

/**
 * Revokes Google access or refresh token.
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  const response = await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.ok;
}
