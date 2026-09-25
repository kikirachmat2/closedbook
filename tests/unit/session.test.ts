import { describe, it, expect } from "vitest";
import {
  sealSessionPayload,
  unsealSessionPayload,
  SessionData,
} from "@/lib/auth/session";

describe("Encrypted Session Engine (ADR-001)", () => {
  const secretA = "test-secret-key-primary-32-characters-long-aaa";
  const secretB = "test-secret-key-secondary-32-characters-long-bbb";

  const sampleSession: SessionData = {
    isLoggedIn: true,
    createdAt: Date.now(),
    user: {
      id: "google-sub-12345",
      email: "filmmaker@closedbook.app",
      name: "Alex Mercer",
    },
    tokens: {
      accessToken: "ya29.sample_access_token",
      refreshToken: "1//sample_refresh_token",
      expiresAt: Date.now() + 3600 * 1000,
      scope: "https://www.googleapis.com/auth/drive.file openid email profile",
    },
  };

  it("seals and unseals session data accurately with AES-GCM", async () => {
    const keys = { "1": secretA };
    const sealed = await sealSessionPayload(sampleSession, keys);
    expect(typeof sealed).toBe("string");
    expect(sealed).not.toContain("filmmaker@closedbook.app"); // Must be encrypted ciphertext

    const unsealed = await unsealSessionPayload(sealed, keys);
    expect(unsealed.isLoggedIn).toBe(true);
    expect(unsealed.user?.email).toBe("filmmaker@closedbook.app");
    expect(unsealed.tokens?.refreshToken).toBe("1//sample_refresh_token");
  });

  it("supports dual-key rotation (unseals old key when new key is primary)", async () => {
    // 1. Seal with initial key (ID 1)
    const initialKeys = { "1": secretA };
    const sealedWithOldKey = await sealSessionPayload(sampleSession, initialKeys);

    // 2. Rotate keys: old key stays at ID 1, new key is ID 2 (becomes primary for sealing)
    const rotatedKeys = {
      "1": secretA,
      "2": secretB,
    };

    // 3. Unseal using rotated key dictionary
    const unsealed = await unsealSessionPayload(sealedWithOldKey, rotatedKeys);
    expect(unsealed.isLoggedIn).toBe(true);
    expect(unsealed.user?.id).toBe("google-sub-12345");
  });
});
