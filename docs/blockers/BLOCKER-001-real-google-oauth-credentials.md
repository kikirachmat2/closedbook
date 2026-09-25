# BLOCKER-001: External Google Cloud OAuth 2.0 Credentials Dependency

- **Status**: BLOCKED (External Infrastructure Dependency)
- **Date Logged**: 2026-09-23
- **Priority**: P0 (Hard Gate before Sub-Fase G.6 Document Generation)
- **Affected Components**: Real Google Drive sync validation, live Google Docs/Sheets binary auto-conversion, real Google OAuth consent & refresh flow.

---

## 1. Description & Context

ClosedBook utilizes zero-server-retention OAuth 2.0 PKCE with Google Drive API v3. 

While the protocol logic, token refresh engine, rate limiters, session encryption, append-only delta uploads, manifest compaction, and OpenXML template seeding are **100% verified via MSW mocks** (51 passing unit/integration tests), **live validation against Google production servers** requires external credentials from Google Cloud Console that cannot be fabricated by local automation.

---

## 2. Technical Validation Status

| Layer | Mock / Synthetic Status | Live Google Production Status |
|---|---|---|
| **OAuth 2.0 PKCE Handshake** | ✅ 6/6 MSW tests pass (`tests/integration/auth-flow.test.ts`) | ⏳ Awaiting live test credentials |
| **Silent Token Refresh** | ✅ MSW test pass with expiry calculation | ⏳ Awaiting live test credentials |
| **Token Revocation** | ✅ MSW test pass (Google revoke endpoint) | ⏳ Awaiting live test credentials |
| **Drive Append-Only Delta Sync** | ✅ 4/4 MSW tests pass (`tests/unit/drive-adapter.test.ts`) | ⏳ Awaiting live test credentials |
| **Manifest Concurrency & Compaction** | ✅ 3/3 MSW tests pass with ETag 412 conflict resolution | ⏳ Awaiting live test credentials |
| **OpenXML Binary Auto-Convert** | ✅ 3/3 MSW tests pass (`tests/unit/template-seeder.test.ts`) | ⏳ Awaiting live Drive upload verification |

---

## 3. Resolution Protocol (P0 Gate Before G.6)

Before Sub-Fase G.6 (Document Generation) begins, the project owner or human operator must execute the following sequence:

1. **Google Cloud Console Setup**:
   - Create a Google Cloud Project (or use existing).
   - Configure OAuth Consent Screen in **Testing mode** with test user emails.
   - Add scope: `https://www.googleapis.com/auth/drive.file`.
   - Create OAuth 2.0 Client ID (Web Application) with redirect URI: `http://localhost:3000/api/auth/google/callback`.
2. **Environment Configuration**:
   - Create `.env.local` containing:
     ```env
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
     SESSION_PASSWORD=at-least-32-chars-strong-random-key-here
     ```
3. **Execution & Evidence**:
   - Run the manual OAuth flow following `docs/testing/oauth-manual-test.md`.
   - Run live template seeder against test account to verify Google Drive native conversion:
     - Verify `/ClosedBook/{ProjectName}/` folder structure.
     - Verify `=SUM(E2:E9)` renders as a living formula in Google Sheets (not string literal).
     - Verify `.docx` converts to native editable Google Docs.
   - Save screenshots/video proof to `docs/testing/evidence/`.

---

## 4. Hard Gate Reminder & PLAN B Fallback Protocol

> [!IMPORTANT]
> **G.6 HARD GATE**: Sub-Fase G.6 (Document Generation) **TIDAK BOLEH START** tanpa BLOCKER-001 dinyatakan CLEARED.

Jika Director/Project Owner belum dapat menyediakan Google Cloud OAuth credentials dalam 2 sub-fase ke depan (G.2 & G.3):
- **PLAN B Trigger**: Pada permulaan G.4 / G.5, tim akan mengaktifkan **Fallback ADR-004 Option 1**:
  - Mengembangkan generator template programmatik via Google Sheets API batchUpdate AST (`spreadsheets.batchUpdate` request payload JSON).
  - Me-render sel, formula, formatting, dan borders langsung ke Google Sheets API tanpa bergantung pada binary multipart auto-conversion.
  - Dokumentasi dan unit test AST generator sudah disiapkan sebagai fallback cadangan.
