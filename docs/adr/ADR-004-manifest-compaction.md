# ADR-004: Manifest-Pointer Compaction Protocol for Yjs Over Google Drive

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
In an append-only sync model, cumulative delta files grow indefinitely over months of production. Compacting deltas into a single base snapshot introduces a classic *read-during-compaction race condition*: readers querying delta listings while deletion is in progress could read partial updates, leading to state corruption.

## Decision Drivers
* Zero data loss during concurrent read and compaction operations.
* Atomic pointer updates without intermediate coordinator servers.
* Full compatibility with Google Drive API v3 ETag conditional headers.

## Considered Options
* Option 1: In-place snapshot overwrite with immediate delta directory wipe (High race condition risk).
* Option 2: Generation-based folder naming without central manifest.
* Option 3: Atomic `manifest.json` pointer protocol with 24-hour grace period garbage collection.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Readers always read `.sync/manifest.json` first to obtain the active snapshot path and valid delta array.
* The compactor writes a new snapshot (`snapshots/snap_genX.bin`), then updates `manifest.json` using `If-Match: {etag}`.
* If another client updated the manifest concurrently, the compactor receives `412 Precondition Failed` and retries.
* Superceded deltas and older snapshots are retained for a 24-hour grace period before scheduled deletion, ensuring in-flight readers never experience broken downloads.
