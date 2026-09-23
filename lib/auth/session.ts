// =========================================================================
// CLOSEDBOOK PRODUCTION OS — ENCRYPTED SESSION ENGINE (ADR-001)
// =========================================================================

import { getIronSession, SessionOptions, sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import { COOKIE_SESSION_NAME, SESSION_TTL_SECONDS } from "./constants";

export interface UserIdentity {
  id: string; // Google sub
  email: string;
  name?: string;
  picture?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  scope: string;
}

export interface SessionData {
  user?: UserIdentity;
  tokens?: OAuthTokens;
  isLoggedIn: boolean;
  createdAt: number;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  createdAt: 0,
};

/**
 * Resolves session encryption passwords supporting dual-key rotation.
 * In iron-session, object-based passwords { 1: previous, 2: current } automatically
 * seal with the highest id (2) and unseal using all defined passwords (1 and 2).
 */
export function getSessionPasswords(): Record<string, string> {
  const currentKey =
    process.env.SESSION_SECRET_CURRENT ||
    process.env.SESSION_SECRET ||
    "closedbook-default-development-secret-minimum-32-chars-long";
  const previousKey = process.env.SESSION_SECRET_PREVIOUS;

  if (previousKey && previousKey !== currentKey) {
    return {
      "1": previousKey,
      "2": currentKey,
    };
  }

  return {
    "1": currentKey,
  };
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPasswords(),
    cookieName: COOKIE_SESSION_NAME,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    },
  };
}

/**
 * Retrieves the encrypted session from Next.js server context.
 */
export async function getSession(): Promise<SessionData & { save: () => Promise<void>; destroy: () => void }> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.createdAt = defaultSession.createdAt;
  }

  return session;
}

/**
 * Direct seal/unseal utilities for testing or custom payload sealing.
 */
export async function sealSessionPayload(data: SessionData, password?: string | Record<string, string>): Promise<string> {
  const pass = password || getSessionPasswords();
  return sealData(data, {
    password: pass,
    ttl: SESSION_TTL_SECONDS,
  });
}

export async function unsealSessionPayload(sealedData: string, password?: string | Record<string, string>): Promise<SessionData> {
  const pass = password || getSessionPasswords();
  return unsealData<SessionData>(sealedData, {
    password: pass,
    ttl: SESSION_TTL_SECONDS,
  });
}
