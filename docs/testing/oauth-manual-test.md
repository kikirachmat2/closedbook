# Google OAuth 2.0 PKCE Manual Verification Playbook

This document details the step-by-step procedure for verifying the Google OAuth 2.0 PKCE flow in desktop and mobile browsers.

## 1. Prerequisites
- Google Cloud Console Project configured with OAuth 2.0 Client ID (Web Application type).
- Authorized Redirect URI: `http://localhost:3000/api/auth/google/callback` and production domain URI.
- Environment variables configured in `.env.local`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET` (if web server client)
  - `NEXT_PUBLIC_APP_URL` (`http://localhost:3000`)
  - `SESSION_SECRET` (32+ characters hex or passphrase)

## 2. Test Cases

### TC-01: Login Initiation with PKCE
1. Navigate to `/api/auth/google/login`.
2. Verify browser redirects to `https://accounts.google.com/o/oauth2/v2/auth`.
3. Inspect query parameters in the URL:
   - `client_id`: Matches `GOOGLE_CLIENT_ID`.
   - `redirect_uri`: `http://localhost:3000/api/auth/google/callback`.
   - `response_type`: `code`.
   - `scope`: Contains `https://www.googleapis.com/auth/drive.file openid email profile`.
   - `code_challenge`: 43-character base64url string.
   - `code_challenge_method`: `S256`.
   - `state`: 32-character random hex string.
4. Verify HTTP-only cookie `cb_pkce_verifier` and `cb_oauth_state` are set in Application storage.

### TC-02: User Consent & Callback Handling
1. Log in with a valid Google account on the consent screen.
2. Grant permissions requested (only personal Drive file creation/management).
3. Verify Google redirects back to `/api/auth/google/callback?code=...&state=...`.
4. Verify response sets encrypted HTTP-only session cookie `cb_session`.
5. Verify temporary PKCE cookies (`cb_pkce_verifier`, `cb_oauth_state`) are cleared.
6. Verify browser redirects to `/workspace`.

### TC-03: Silent Refresh Handler
1. Make a request to `/api/auth/google/refresh` with an active session cookie.
2. Verify response status is 200 with JSON `{ "ok": true, "refreshed": boolean }`.
3. Verify session cookie expiration is refreshed if within 5-minute threshold.

### TC-04: Revocation & Clean Disconnect
1. Navigate to or dispatch POST to `/api/auth/google/revoke`.
2. Verify Google token revocation endpoint is called.
3. Verify session cookie `cb_session` is cleared from browser cookies.
4. Verify user is redirected to landing screen.

## 3. Mobile Device Testing
- **iOS Safari**: Verify cookie handling in private and standard tabs; ensure `SameSite=Lax` cookie persists upon Google redirect.
- **Android Chrome**: Verify seamless account switcher modal and deep redirect back to PWA shell.
