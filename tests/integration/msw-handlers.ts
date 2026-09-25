// =========================================================================
// CLOSEDBOOK PRODUCTION OS — MSW GOOGLE OAUTH & DRIVE HANDLERS
// =========================================================================

import { http, HttpResponse } from "msw";
import {
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_REVOKE_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
} from "@/lib/auth/constants";

export const handlers = [
  // 1. Google Token Endpoint (Code Exchange & Token Refresh)
  http.post(GOOGLE_TOKEN_ENDPOINT, async ({ request }) => {
    const formData = await request.formData();
    const grantType = formData.get("grant_type");
    const code = formData.get("code");
    const refreshToken = formData.get("refresh_token");

    if (grantType === "authorization_code") {
      if (code === "valid_auth_code") {
        return HttpResponse.json({
          access_token: "mock_access_token_abc123",
          expires_in: 3600,
          refresh_token: "mock_refresh_token_xyz789",
          scope: "https://www.googleapis.com/auth/drive.file openid email profile",
          token_type: "Bearer",
        });
      }

      return new HttpResponse(
        JSON.stringify({ error: "invalid_grant", error_description: "Bad code" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (grantType === "refresh_token") {
      if (refreshToken === "revoked_token") {
        return new HttpResponse(
          JSON.stringify({ error: "invalid_grant", error_description: "Token has been expired or revoked." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return HttpResponse.json({
        access_token: "mock_refreshed_access_token_new456",
        expires_in: 3600,
        scope: "https://www.googleapis.com/auth/drive.file openid email profile",
        token_type: "Bearer",
      });
    }

    return new HttpResponse("Unsupported grant_type", { status: 400 });
  }),

  // 2. Google UserInfo Endpoint
  http.get(GOOGLE_USERINFO_ENDPOINT, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    return HttpResponse.json({
      sub: "google-sub-mock-12345",
      email: "director@closedbook.app",
      name: "Director Lead",
      picture: "https://lh3.googleusercontent.com/a/mock-photo",
    });
  }),

  // 3. Google Revocation Endpoint
  http.post(GOOGLE_REVOKE_ENDPOINT, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // 4. Mock Google Drive upload (for G.6 when BLOCKER-001 cleared)
  http.post("https://www.googleapis.com/upload/drive/v3/files", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    return HttpResponse.json({
      id: "mock-file-id-12345",
      name: "Master Ledger.xlsx",
      mimeType: "application/vnd.google-apps.spreadsheet",
      webViewLink: "https://docs.google.com/spreadsheets/d/mock-file-id-12345/edit",
    });
  }),

  // 5. Mock Google Drive get file metadata
  http.get("https://www.googleapis.com/drive/v3/files/:fileId", ({ params, request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    return HttpResponse.json({
      id: params.fileId,
      webViewLink: `https://docs.google.com/document/d/${params.fileId}/edit`,
    });
  }),
];
