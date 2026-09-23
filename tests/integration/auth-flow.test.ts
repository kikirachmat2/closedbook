import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";
import {
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
  refreshGoogleAccessToken,
  revokeGoogleToken,
} from "@/lib/auth/google-oauth";

const server = setupServer(...handlers);

describe("Google OAuth Protocol Integration Tests (MSW Mocks)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("exchanges valid authorization code for tokens successfully", async () => {
    const tokens = await exchangeCodeForTokens({
      code: "valid_auth_code",
      codeVerifier: "mock_pkce_verifier_string",
      redirectUri: "http://localhost:3000/api/auth/google/callback",
      clientId: "mock_client_id.apps.googleusercontent.com",
    });

    expect(tokens.access_token).toBe("mock_access_token_abc123");
    expect(tokens.refresh_token).toBe("mock_refresh_token_xyz789");
    expect(tokens.expires_in).toBe(3600);
  });

  it("throws descriptive error when exchanging invalid authorization code", async () => {
    await expect(
      exchangeCodeForTokens({
        code: "invalid_expired_code",
        codeVerifier: "mock_pkce_verifier_string",
        redirectUri: "http://localhost:3000/api/auth/google/callback",
        clientId: "mock_client_id.apps.googleusercontent.com",
      })
    ).rejects.toThrow(/invalid_grant/);
  });

  it("fetches user profile using access token", async () => {
    const profile = await fetchGoogleUserProfile("mock_access_token_abc123");
    expect(profile.id).toBe("google-sub-mock-12345");
    expect(profile.email).toBe("director@closedbook.app");
    expect(profile.name).toBe("Director Lead");
  });

  it("refreshes access token successfully when valid refresh token provided", async () => {
    const newTokens = await refreshGoogleAccessToken({
      refreshToken: "valid_refresh_token",
      clientId: "mock_client_id",
    });

    expect(newTokens.accessToken).toBe("mock_refreshed_access_token_new456");
    expect(newTokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("handles revoked token error gracefully when Google returns invalid_grant", async () => {
    await expect(
      refreshGoogleAccessToken({
        refreshToken: "revoked_token",
        clientId: "mock_client_id",
      })
    ).rejects.toThrow(/invalid_grant/);
  });

  it("calls revocation endpoint successfully", async () => {
    const success = await revokeGoogleToken("mock_access_token_abc123");
    expect(success).toBe(true);
  });
});
