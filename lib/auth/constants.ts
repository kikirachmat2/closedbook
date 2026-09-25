// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GOOGLE OAUTH 2.0 CONSTANTS (ADR-001)
// =========================================================================

/**
 * Strict Least-Privilege Scopes:
 * - drive.file: Per-file access to files created or opened by ClosedBook (allows full Sheets & Docs manipulation)
 * - openid, email, profile: Identity verification
 */
export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
  "profile",
] as const;

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
export const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export const COOKIE_SESSION_NAME = "cb_session";
export const COOKIE_PKCE_VERIFIER = "cb_pkce_verifier";
export const COOKIE_OAUTH_STATE = "cb_oauth_state";

/**
 * 180-day sliding expiry (in seconds) matching Google's idle refresh token revocation policy
 */
export const SESSION_TTL_SECONDS = 180 * 24 * 60 * 60; // 15,552,000 seconds
export const PKCE_TTL_SECONDS = 10 * 60; // 10 minutes
