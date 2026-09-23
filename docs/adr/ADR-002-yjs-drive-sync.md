# ADR-002: Offline-First Synchronization Engine via Yjs and Google Drive Append-Only Deltas

* Status: accepted
* Date: 2026-09-23
* Deciders: Director, Lead System Architect

## Context and Problem Statement
Film and creative crews frequently operate in remote, off-grid locations. Data mutations to financial ledgers and operational tasks must synchronize to Google Drive without lost updates caused by concurrent edits when multiple devices re-establish internet connection simultaneously.

## Decision Drivers
* Zero data loss under concurrent offline edits.
* Serverless zero-infrastructure architecture (no centralized live WebSocket server).
* Resilience against iOS Safari aggressive storage eviction.

## Considered Options
* Option 1: Last-Write-Wins (LWW) overwriting a single file on Google Drive (High risk of data loss).
* Option 2: Live WebSocket signaling server with central CRDT relay (Violates zero-server BYOS model).
* Option 3: Local Yjs CRDT in Dexie.js + Append-Only Delta Files in Google Drive `.sync/` folder + Atomic Manifest Compaction.

## Decision Outcome
Chosen option: **Option 3**.

### Implementation Details
* Local state is stored in IndexedDB (Dexie) as binary Yjs documents (`Uint8Array`).
* Concurrent changes are uploaded as discrete delta files: `.sync/deltas/{timestamp}_{clientId}_{uuid}.delta`.
* Because every client writes to a unique delta file, write-write races are impossible on Google Drive.
* Multi-tab concurrency on the same device is handled via a `BroadcastChannel` relay and Web Locks API.
* Drive acts as an L2 hard backup capable of restoring state if IndexedDB is evicted by iOS ITP.
