# ADR-011: Gemini BYOK (Bring Your Own Key) & Privacy-First Mobile Assistant Architecture

## Status
Accepted (Director-Approved Hybrid Strategy, Free Tier Default)

## Date
2026-09-26

## Context
ClosedBook is an offline-capable, Zero-Server-Retention (ADR-006) production operating system for film and episodic television physical production accounting. In Sub-Fase G.7, ClosedBook integrates Google Gemini 2.0 Flash as an autonomous assistant to help production accountants, UPMs, and line producers summarize burn rates, draft crew notices, inspect equipment rentals, and coordinate set logistics.

Prior approaches for AI copilots rely on centralized servers that proxy requests with a developer-owned key. This introduces several critical risks:
1. **Confidentiality & Privacy**: Film production budgets, actor compensation, NDA shoot locations, and proprietary script pages would pass through a centralized server.
2. **Operational Cost**: High monthly API billing for the ClosedBook team.
3. **Dependency on Director Credentials**: Centralized keys block autonomous local testing and community adoption.

## Decision
ClosedBook implements a **Hybrid Model** where the default is **BYOK (Bring Your Own Key)**:

1. **Client-Direct Streaming**:
   - The browser connects directly to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key={apiKey}` using HTTP fetch Server-Sent Events (SSE).
   - Zero ClosedBook servers are involved in proxying or logging prompts (Zero-Server-Retention).

2. **Hardware-Derived Key Encryption**:
   - The user's Gemini API key is encrypted using AES-GCM (256-bit) via the Web Crypto API (`window.crypto.subtle`).
   - The encryption key is derived using WebAuthn PRF (ADR-005) or localized device-bound salt, stored in `localStorage` under `cb_gemini_api_key_enc`.
   - Fallback: when crypto APIs are unavailable, ephemeral `sessionStorage` with a 30-minute TTL is utilized.

3. **Privacy-First Context Injection**:
   - Context injection is strictly opt-in and tiered:
     - **Tier 1 (Operational Context, Default ON)**: Project Title, Project Format, Active Tab, User Role.
     - **Tier 2 (Financial Context, Strict Opt-In, Default OFF)**: Overall budget numbers, total disbursed cash, uncommitted float, and recent transaction values.
   - Financial numbers are NEVER sent to Google without explicit toggling by the user.

4. **Tier 1 & Tier 2 Voice Inputs**:
   - **Tier 1 (Dictation)**: Web Speech API for low-latency voice dictation (<10 seconds). Fallback message for unsupported browsers (iOS Safari).
   - **Tier 2 (Multimodal Audio)**: `MediaRecorder` audio capture (<60s, <10MB) sent directly via Gemini's native `inline_data` base64 audio parts.

5. **Cost Transparency, Runaway Prevention, and Circuit Breaker**:
   - Local Dexie database table `gemini_usage` tracks calls, estimated tokens, and timestamps.
   - Hard rate limit: 20 calls/hour for BYOK users with proactive warning toasts at 16 calls.
   - Circuit Breaker: 5 consecutive upstream API errors temporarily pause AI features for 5 minutes.
   - Monthly usage counter displayed in Settings.

## Consequences
### Positive
- **Zero Ongoing Cost**: ClosedBook incurs zero server or API billing.
- **Zero-Server-Retention**: No corporate film budgets or crew conversations are retained on ClosedBook infrastructure.
- **Independent Autonomy**: Users can obtain their own free API key from Google AI Studio.
- **Sub-Second Streaming**: Direct client fetch minimizes latency compared to multi-hop server proxies.

### Negative / Trade-offs
- Users must create a Google AI Studio account to obtain their free API key.
- Web Speech API is not supported in iOS Safari (mitigated by clear fallback UI directing users to Chrome or Android).
