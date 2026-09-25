// =========================================================================
// CLOSEDBOOK PRODUCTION OS — SYNC ENGINE ORCHESTRATOR (ADR-002, ADR-004)
// =========================================================================

import { create } from "zustand";
import * as Y from "yjs";
import { db, DeltaRecord } from "@/lib/db/schema";
import { pushDeltaWithManifest, hydrateDocFromManifest } from "./manifest-sync";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface SyncEngineState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  errorMessage: string | null;
  activeProjectId: string | null;
  isOnline: boolean;

  // Actions
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (count: number) => void;
  setError: (error: string | null) => void;
  setActiveProjectId: (projectId: string | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setLastSyncedAt: (timestamp: number) => void;
}

export const useSyncEngine = create<SyncEngineState>((set) => ({
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
  errorMessage: null,
  activeProjectId: null,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,

  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setError: (errorMessage) => set({ errorMessage, status: errorMessage ? "error" : "idle" }),
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
  setOnlineStatus: (isOnline) =>
    set({ isOnline, status: isOnline ? "idle" : "offline" }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));

export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface QueueDeltaOptions {
  projectId: string;
  slice: "financial" | "operations" | "metadata";
  updateData: Uint8Array;
  clientId: string;
}

/**
 * Queues a local mutation as a pending Delta in Dexie.
 */
export async function queueMutationDelta({
  projectId,
  slice,
  updateData,
  clientId,
}: QueueDeltaOptions): Promise<string> {
  const deltaId = crypto.randomUUID();
  const record: DeltaRecord = {
    id: deltaId,
    projectId,
    slice,
    timestamp: Date.now(),
    clientId,
    updateData,
    applied: 0, // Pending
  };

  await db.deltas.put(record);

  // Update pending count in Zustand store
  const pending = await db.deltas
    .where("applied")
    .equals(0)
    .and((d) => d.projectId === projectId)
    .count();

  useSyncEngine.getState().setPendingCount(pending);

  // Attempt to register Background Sync with Service Worker for offline resilience
  try {
    const { requestBackgroundSync } = await import("./background-sync");
    requestBackgroundSync().catch(() => {});
  } catch {
    // Non-blocking in non-browser/test environments
  }

  return deltaId;
}

/**
 * Flushes all pending mutations for a project to Google Drive.
 */
export async function flushPendingDeltas({
  projectId,
  syncFolderId,
  accessToken,
  doc,
}: {
  projectId: string;
  syncFolderId: string;
  accessToken: string;
  doc: Y.Doc;
}): Promise<{ syncedCount: number; errors: Error[] }> {
  const engine = useSyncEngine.getState();

  if (!engine.isOnline) {
    engine.setStatus("offline");
    return { syncedCount: 0, errors: [] };
  }

  engine.setStatus("syncing");
  engine.setError(null);

  const pendingDeltas = await db.deltas
    .where("applied")
    .equals(0)
    .and((d) => d.projectId === projectId)
    .sortBy("timestamp");

  if (pendingDeltas.length === 0) {
    engine.setStatus("idle");
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: Error[] = [];

  for (const delta of pendingDeltas) {
    try {
      await pushDeltaWithManifest({
        syncFolderId,
        slice: delta.slice,
        updateData: delta.updateData,
        clientId: delta.clientId,
        accessToken,
        doc,
      });

      // Mark as applied in Dexie
      await db.deltas.update(delta.id, { applied: 1 });
      syncedCount++;
    } catch (err: any) {
      errors.push(err);
      engine.setError(err.message || "Failed to push delta");
      // Halt sequential flush on fatal error to preserve order
      break;
    }
  }

  const remainingPending = await db.deltas
    .where("applied")
    .equals(0)
    .and((d) => d.projectId === projectId)
    .count();

  engine.setPendingCount(remainingPending);

  if (errors.length === 0) {
    const now = Date.now();
    engine.setStatus("idle");
    engine.setLastSyncedAt(now);

    await db.sync_state.put({
      projectId,
      lastSyncedAt: now,
      pendingDeltaCount: remainingPending,
    });
  } else {
    engine.setStatus("error");
  }

  return { syncedCount, errors };
}

/**
 * Global Orchestrator Manager for visibilitychange, network events, and heartbeats.
 */
class SyncOrchestrator {
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private syncContextGetter: (() => {
    projectId: string;
    syncFolderId: string;
    accessToken: string;
    doc: Y.Doc;
  } | null) | null = null;

  public registerContextGetter(
    getter: () => {
      projectId: string;
      syncFolderId: string;
      accessToken: string;
      doc: Y.Doc;
    } | null
  ) {
    this.syncContextGetter = getter;
  }

  public init() {
    if (typeof window === "undefined") return;

    // Listen for visibility change
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Listen for online/offline
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Heartbeat every 5 minutes
    this.heartbeatTimer = setInterval(() => {
      this.triggerAutoFlush();
    }, HEARTBEAT_INTERVAL_MS);
  }

  public destroy() {
    if (typeof window === "undefined") return;

    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.triggerAutoFlush();
    }
  };

  private handleOnline = () => {
    useSyncEngine.getState().setOnlineStatus(true);
    this.triggerAutoFlush();
  };

  private handleOffline = () => {
    useSyncEngine.getState().setOnlineStatus(false);
  };

  public async triggerAutoFlush() {
    if (!this.syncContextGetter) return;
    const ctx = this.syncContextGetter();
    if (!ctx) return;

    await flushPendingDeltas({
      projectId: ctx.projectId,
      syncFolderId: ctx.syncFolderId,
      accessToken: ctx.accessToken,
      doc: ctx.doc,
    });
  }
}

export const syncOrchestrator = new SyncOrchestrator();
