# ADR-006: Zero-Server-Retention Observability and Local Error Logging

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
Application reliability requires error visibility and crash diagnosis. However, transmitting error breadcrumbs to third-party telemetry clouds (e.g., cloud Sentry) conflicts with the core "Zero-Server-Retention" promise on `/privacy` and risks sending unscrubbed variables, complicating Google OAuth user data compliance.

## Decision Drivers
* Total adherence to the zero-server-retention privacy promise.
* Clean network telemetry audit (zero unexpected third-party tracking calls).
* Frictionless developer debugging when users explicitly share diagnostic logs.

## Considered Options
* Option 1: Cloud Sentry SDK with automatic PII scrubbing enabled by default.
* Option 2: External self-hosted collector.
* Option 3: Vercel Native Server Logs + Client-Side IndexedDB Error Log Table + Explicit Consent-Gated Opt-In.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Serverless route handlers log errors to Vercel native runtime logs without external data dispersion.
* Client catches unhandled errors and saves them locally in Dexie table `db.error_logs`.
* Third-party error telemetry is dropped from G.0 default configuration.
* If telemetry is added in the future, it must be consent-gated with explicit opt-in in Settings (default OFF).
