# ADR-001: Google OAuth 2.0 PKCE Flow and Single-Key Encrypted Session

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
ClosedBook requires Google authentication to manage production documents in the user's personal Google Drive (BYOS / Bring Your Own Storage architecture). Over-scoping permissions triggers Google CASA Tier 2/3 security assessments (4–8 weeks review) and violates least-privilege principles. Furthermore, running on Vercel serverless functions requires a stateless, secure session mechanism without external database dependencies.

## Decision Drivers
* Least-privilege authorization to expedite Google OAuth verification.
* Zero external session database infrastructure.
* Transparent and honest cryptographic security posture (no security theater).

## Considered Options
* Option 1: Broad scopes (`drive`, `spreadsheets`, `documents`) with server-side database session.
* Option 2: Restricted scope (`drive.file`, `openid`, `email`, `profile`) with envelope encryption via cloud KMS.
* Option 3: Restricted scope (`drive.file`, `openid`, `email`, `profile`) with single-key AES-256-GCM encrypted HTTP-only cookie.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Scope is strictly limited to `https://www.googleapis.com/auth/drive.file` and basic OpenID identity (`openid`, `email`, `profile`).
* Refresh tokens and session state are encrypted using AES-256-GCM with a 12-byte random IV and sealed into an HTTP-only, Secure, SameSite=Lax cookie using `iron-session`.
* Master key is stored in platform environment variables (`SESSION_SECRET`). Risks are mitigated via platform-level encryption-at-rest, audit logs, dual-key rotation support (`SESSION_SECRET_CURRENT`, `SESSION_SECRET_PREVIOUS`), and 180-day sliding expiry aligned with Google's idle token revocation policy.

### Negative Consequences & Acknowledged Risks
* If platform environment variables are compromised, active session cookies could be decrypted. External cloud KMS was evaluated and deferred for enterprise tier to avoid network latency and extra recurring costs for personal/freelance users.
