import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  base64UrlEncode,
} from "@/lib/auth/pkce";

describe("PKCE Engine (RFC 7636)", () => {
  it("generates a code_verifier with valid length and RFC 7636 character set", () => {
    const verifier = generateCodeVerifier(64);
    expect(verifier).toHaveLength(64);
    // Unreserved characters: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it("throws error if code_verifier length is invalid", () => {
    expect(() => generateCodeVerifier(42)).toThrow();
    expect(() => generateCodeVerifier(129)).toThrow();
  });

  it("produces exact RFC 7636 Appendix B test vector challenge", async () => {
    // RFC 7636 Appendix B Example
    const testVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expectedChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    const challenge = await generateCodeChallenge(testVerifier);
    expect(challenge).toBe(expectedChallenge);
  });

  it("generates unique CSRF state strings", () => {
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();
    expect(state1).not.toBe(state2);
    expect(state1.length).toBeGreaterThanOrEqual(32);
  });

  it("properly base64url encodes without +, /, or = characters", () => {
    const buffer = new Uint8Array([251, 255, 254]); // In standard base64 this would have '+' and '/'
    const encoded = base64UrlEncode(buffer);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });
});
