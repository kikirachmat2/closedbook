# ADR-005: Client-Side Secret Storage via WebAuthn PRF and AES-GCM

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
The Bring Your Own Key (BYOK) model for Gemini AI requires storing the user's API key locally on their client device. Storing API keys in plaintext in `localStorage` or `IndexedDB` exposes users to XSS exploitation or device physical forensic extraction.

## Decision Drivers
* Zero-Server-Retention (the server must never receive or hold user AI credentials).
* Hardware-backed protection (Secure Enclave) for client encryption keys.
* Safe fallback for legacy mobile browsers lacking modern passkey extensions.

## Considered Options
* Option 1: Plaintext in `localStorage` or `Dexie` (High XSS exposure).
* Option 2: Cookie `HttpOnly` forwarded through server proxy (Violates zero-server-retention).
* Option 3: AES-256-GCM encryption with key derived via WebAuthn PRF extension, with `sessionStorage` auto-purge fallback.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Hardware-backed encryption key derivation using WebAuthn PRF extension (`navigator.credentials.get({ publicKey: { extensions: { prf: ... } } })`).
* Ciphertext is stored in Dexie. Decryption only occurs in-memory upon successful biometric gesture.
* On devices lacking WebAuthn PRF support, the key is temporarily held in `sessionStorage` and automatically cleared after 30 minutes of background inactivity (`visibilitychange`).
