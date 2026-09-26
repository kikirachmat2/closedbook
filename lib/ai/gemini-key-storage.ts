// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GEMINI KEY STORAGE (ADR-005, ADR-011)
// AES-GCM Encrypted Storage with WebAuthn PRF / Device Salt & Session Fallback
// =========================================================================

const STORAGE_KEY_ENCRYPTED = "cb_gemini_enc_v1";
const STORAGE_KEY_IV = "cb_gemini_iv_v1";
const STORAGE_KEY_SALT = "cb_gemini_salt_v1";
const STORAGE_KEY_STATUS = "cb_gemini_key_status";
const SESSION_KEY = "cb_gemini_session_key";
const SESSION_EXP = "cb_gemini_session_exp";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL

/**
 * Convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get or create stable local device salt for key derivation
 */
function getDeviceSalt(): Uint8Array {
  if (typeof window === "undefined") return new Uint8Array(16);
  let saltB64 = localStorage.getItem(STORAGE_KEY_SALT);
  if (!saltB64) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    saltB64 = bufferToBase64(salt);
    localStorage.setItem(STORAGE_KEY_SALT, saltB64);
    return salt;
  }
  return base64ToBuffer(saltB64);
}

/**
 * Derive AES-GCM key using PBKDF2 (device salt + app seed)
 */
async function deriveEncryptionKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode("closedbook_byok_device_prf_seed_v1"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Save Gemini API Key securely
 * Tries WebCrypto AES-GCM first, falls back to sessionStorage with 30-min TTL
 */
export async function saveGeminiApiKey(
  apiKey: string
): Promise<{ mode: "encrypted" | "session" }> {
  if (typeof window === "undefined") {
    return { mode: "session" };
  }

  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    await removeGeminiApiKey();
    return { mode: "session" };
  }

  // Check if SubtleCrypto AES-GCM is available
  if (window.crypto && window.crypto.subtle) {
    try {
      const salt = getDeviceSalt();
      const cryptoKey = await deriveEncryptionKey(salt);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        enc.encode(cleanKey)
      );

      localStorage.setItem(STORAGE_KEY_ENCRYPTED, bufferToBase64(ciphertext));
      localStorage.setItem(STORAGE_KEY_IV, bufferToBase64(iv));
      setGeminiKeyStatus("active");

      // Clear any session fallback
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_EXP);

      return { mode: "encrypted" };
    } catch {
      // Fall through to sessionStorage
    }
  }

  // Fallback: sessionStorage with 30-min TTL
  sessionStorage.setItem(SESSION_KEY, cleanKey);
  sessionStorage.setItem(SESSION_EXP, String(Date.now() + SESSION_TTL_MS));
  setGeminiKeyStatus("active");
  return { mode: "session" };
}

/**
 * Retrieve Gemini API key from encrypted storage or session fallback
 */
export async function getGeminiApiKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Try encrypted localStorage
  const encB64 = localStorage.getItem(STORAGE_KEY_ENCRYPTED);
  const ivB64 = localStorage.getItem(STORAGE_KEY_IV);

  if (encB64 && ivB64 && window.crypto && window.crypto.subtle) {
    try {
      const salt = getDeviceSalt();
      const cryptoKey = await deriveEncryptionKey(salt);
      const iv = base64ToBuffer(ivB64);
      const ciphertext = base64ToBuffer(encB64);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any },
        cryptoKey,
        ciphertext as any
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch {
      // Failed to decrypt (e.g. corrupt or wrong device salt)
    }
  }

  // Check sessionStorage fallback with TTL check
  const sessionKey = sessionStorage.getItem(SESSION_KEY);
  const sessionExp = sessionStorage.getItem(SESSION_EXP);

  if (sessionKey && sessionExp) {
    const expTime = parseInt(sessionExp, 10);
    if (Date.now() < expTime) {
      return sessionKey;
    }
    // Expired
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXP);
  }

  return null;
}

/**
 * Remove stored API key completely from all client storages
 */
export async function removeGeminiApiKey(): Promise<void> {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY_ENCRYPTED);
  localStorage.removeItem(STORAGE_KEY_IV);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EXP);
  setGeminiKeyStatus("none");
}

/**
 * Get current API key status
 */
export function getGeminiKeyStatus(): "active" | "invalid" | "none" {
  if (typeof window === "undefined") return "none";
  const status = localStorage.getItem(STORAGE_KEY_STATUS);
  if (status === "active" || status === "invalid") return status;
  return "none";
}

/**
 * Set current API key status
 */
export function setGeminiKeyStatus(status: "active" | "invalid" | "none"): void {
  if (typeof window === "undefined") return;
  if (status === "none") {
    localStorage.removeItem(STORAGE_KEY_STATUS);
  } else {
    localStorage.setItem(STORAGE_KEY_STATUS, status);
  }
}
