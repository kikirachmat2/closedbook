import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import * as Y from "yjs";
import { db } from "@/lib/db/schema";
import {
  useSyncEngine,
  queueMutationDelta,
  flushPendingDeltas,
} from "@/lib/sync/engine";
import * as manifestSync from "@/lib/sync/manifest-sync";

describe("Sync Engine Orchestrator (Unit)", () => {
  beforeEach(async () => {
    await db.deltas.clear();
    await db.sync_state.clear();
    useSyncEngine.setState({
      status: "idle",
      lastSyncedAt: null,
      pendingCount: 0,
      errorMessage: null,
      activeProjectId: null,
      isOnline: true,
    });
    vi.restoreAllMocks();
  });

  it("manages Zustand sync state transitions accurately", () => {
    const { setStatus, setError, setOnlineStatus } = useSyncEngine.getState();

    setStatus("syncing");
    expect(useSyncEngine.getState().status).toBe("syncing");

    setError("Network timeout");
    expect(useSyncEngine.getState().status).toBe("error");
    expect(useSyncEngine.getState().errorMessage).toBe("Network timeout");

    setOnlineStatus(false);
    expect(useSyncEngine.getState().isOnline).toBe(false);
    expect(useSyncEngine.getState().status).toBe("offline");
  });

  it("queues local mutations as pending deltas in Dexie and updates pendingCount", async () => {
    const doc = new Y.Doc();
    doc.getMap("tasks").set("t1", { title: "Location Scout" });
    const updateData = Y.encodeStateAsUpdate(doc);

    const deltaId = await queueMutationDelta({
      projectId: "proj_999",
      slice: "operations",
      updateData,
      clientId: "client_test_device",
    });

    expect(deltaId).toBeDefined();

    const stored = await db.deltas.get(deltaId);
    expect(stored).toBeDefined();
    expect(stored?.applied).toBe(0);
    expect(stored?.slice).toBe("operations");
    expect(useSyncEngine.getState().pendingCount).toBe(1);
  });

  it("flushes pending deltas and marks them as applied in Dexie", async () => {
    const doc = new Y.Doc();
    doc.getMap("expenses").set("e1", { amount: 500 });
    const updateData = Y.encodeStateAsUpdate(doc);

    const deltaId = await queueMutationDelta({
      projectId: "proj_999",
      slice: "financial",
      updateData,
      clientId: "client_test_device",
    });

    // Mock pushDeltaWithManifest to succeed
    const pushSpy = vi
      .spyOn(manifestSync, "pushDeltaWithManifest")
      .mockResolvedValue({
        deltaFileId: "mock_delta_file_id",
        manifestETag: "mock_etag_123",
      });

    const result = await flushPendingDeltas({
      projectId: "proj_999",
      syncFolderId: "folder_123",
      accessToken: "mock_token",
      doc,
    });

    expect(result.syncedCount).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    // Verify Dexie delta marked as applied: 1
    const stored = await db.deltas.get(deltaId);
    expect(stored?.applied).toBe(1);

    // Verify Zustand store
    expect(useSyncEngine.getState().pendingCount).toBe(0);
    expect(useSyncEngine.getState().status).toBe("idle");
    expect(useSyncEngine.getState().lastSyncedAt).toBeGreaterThan(0);
  });

  it("pauses flush when offline without losing pending deltas", async () => {
    useSyncEngine.getState().setOnlineStatus(false);

    const doc = new Y.Doc();
    const updateData = Y.encodeStateAsUpdate(doc);

    await queueMutationDelta({
      projectId: "proj_offline",
      slice: "operations",
      updateData,
      clientId: "client_device",
    });

    const result = await flushPendingDeltas({
      projectId: "proj_offline",
      syncFolderId: "folder_123",
      accessToken: "mock_token",
      doc,
    });

    expect(result.syncedCount).toBe(0);
    expect(useSyncEngine.getState().status).toBe("offline");
    expect(useSyncEngine.getState().pendingCount).toBe(1);
  });
});
