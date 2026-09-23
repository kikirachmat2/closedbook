# ADR-003: Hybrid Content Security Policy (CSP) for Next.js App Router

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
Web PWAs require strict defenses against Cross-Site Scripting (XSS). However, generating dynamic nonces in Next.js 15 root middleware forces every route into dynamic server-side rendering, disabling static generation on Edge CDNs, inducing serverless cold starts, and impairing mobile performance targets (Lighthouse $\ge 90$).

## Decision Drivers
* Defense-in-depth against modern XSS attacks (zero `'unsafe-eval'` and zero `'unsafe-inline'` in production).
* Mobile performance score $\ge 90$ via edge-cached static app shell delivery.
* Reliable execution of official Google OAuth / API scripts.

## Considered Options
* Option 1: Dynamic nonce-based CSP on all routes (Forces all routes to dynamic rendering).
* Option 2: Permissive legacy CSP with `'unsafe-inline'` and `'unsafe-eval'`.
* Option 3: Hybrid CSP: Hash-based CSP for static App Shell + Nonce-isolated CSP for dynamic auth callback routes.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* App shell pages (`/`, `/workspace`, `/privacy`, `/terms`) are served using strict hash-based CSP or strict origin policies without nonces, allowing edge caching with sub-50ms TTFB.
* Dynamic OAuth callback endpoints (`/api/auth/*`) utilize isolated cryptographic nonces.
* All inline scripts are forbidden; scripts are bundled with content hashes.
* CSP violation reports are received by `/api/csp-report`.
