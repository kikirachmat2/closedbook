// =========================================================================
// CLOSEDBOOK PRODUCTION OS — PKCE ENGINE (RFC 7636)
// =========================================================================

/**
 * Encodes an ArrayBuffer or Uint8Array into a Base64URL string (RFC 4648 §5).
 */
export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generates a cryptographically random code_verifier (43-128 chars, RFC 7636).
 */
export function generateCodeVerifier(length: number = 64): string {
  if (length < 43 || length > 128) {
    throw new Error("code_verifier length must be between 43 and 128 characters.");
  }
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let verifier = "";
  for (let i = 0; i < length; i++) {
    verifier += charset[randomBytes[i] % charset.length];
  }
  return verifier;
}

/**
 * Generates a SHA-256 code_challenge from a code_verifier (RFC 7636 §4.2).
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

/**
 * Generates a random cryptographic state string for CSRF mitigation.
 */
export function generateOAuthState(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
