import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import * as Y from "yjs";
import { db } from "@/lib/db/schema";
import {
  requestStoragePersistence,
  detectAndRestoreColdStart,
} from "@/lib/pwa/storage-persistence";
import { requestBackgroundSync } from "@/lib/sync/background-sync";
import * as manifestSync from "@/lib/sync/manifest-sync";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("PWA Features: Storage Persistence & Cold-Start Restore (Unit)", () => {
  beforeEach(async () => {
    await db.projects.clear();
    await db.tasks.clear();
    await db.transactions.clear();
  });

  it("handles storage persistence gracefully in environment", async () => {
    const result = await requestStoragePersistence();
    expect(result).toHaveProperty("persisted");
  });

  it("handles background sync registration fallback when SyncManager is absent", async () => {
    const registered = await requestBackgroundSync("test-tag");
    expect(registered).toBe(false); // Graceful fallback
  });

  it("restores empty local database via 3-Phase Progressive Restore with simulated Drive latency", async () => {
    // 1. Prepare simulated remote Y.Doc with backup data
    const remoteDoc = new Y.Doc();
    remoteDoc.getMap("settings").set("projectId", "proj_restored_001");
    remoteDoc.getMap("settings").set("projectName", "Documentary Film");

    remoteDoc.getMap("tasks").set("task_1", {
      title: "Audio Gear Prep",
      department: "sound",
      status: "in-progress",
      priority: "high",
    });

    remoteDoc.getMap("expenses").set("exp_1", {
      description: "Lav Mic Batteries",
      amount: 45,
      departmentId: "sound",
    });

    // 2. Mock manifest hydration with simulated 250ms Google Drive network latency
    const manifestSpy = vi
      .spyOn(manifestSync, "hydrateDocFromManifest")
      .mockImplementation(async () => {
        await delay(250); // Simulated realistic 4G network delay
        return {
          manifest: {
            version: 1,
            generation: 1,
            activeSnapshot: "",
            activeDeltas: ["delta1.delta"],
            lastCompactedAt: Date.now(),
            updatedAt: Date.now(),
          },
          fileId: "f_manifest_1",
          etag: "etag_1",
        };
      });

    const progressSteps: string[] = [];
    const progressPercentages: number[] = [];

    const result = await detectAndRestoreColdStart({
      accessToken: "mock_token",
      syncFolderId: "folder_backup",
      doc: remoteDoc,
      onProgress: (step, pct) => {
        progressSteps.push(step);
        progressPercentages.push(pct);
      },
    });

    expect(result.restored).toBe(true);
    expect(result.deltaCount).toBe(1);
    expect(manifestSpy).toHaveBeenCalled();

    // Verify 3-phase progressive callback triggers
    expect(progressSteps.some((s) => s.includes("Fase 1: Memulihkan Metadata"))).toBe(true);
    expect(progressSteps.some((s) => s.includes("Fase 2: Memulihkan Rekening"))).toBe(true);
    expect(progressSteps.some((s) => s.includes("Fase 3: Memulihkan Tugas"))).toBe(true);
    expect(progressPercentages).toContain(100);

    // Verify local IndexedDB was progressively populated
    const projects = await db.projects.toArray();
    const tasks = await db.tasks.toArray();
    const expenses = await db.transactions.toArray();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Documentary Film");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Audio Gear Prep");
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(45);
  });

  it("bypasses cold start restore when local database already contains projects", async () => {
    await db.projects.put({
      id: "existing_p1",
      name: "Existing Project",
      slug: "existing-project",
      currency: "IDR",
      totalBudget: 10000000,
      currentDisbursed: 0,
      driveFolderId: "f_dummy",
      sheetId: "",
      shootDays: 1,
      startDate: new Date().toISOString(),
      director: "Lead",
      createdAt: new Date().toISOString(),
    });

    const doc = new Y.Doc();
    const result = await detectAndRestoreColdStart({
      accessToken: "mock_token",
      syncFolderId: "folder_backup",
      doc,
    });

    expect(result.restored).toBe(false);
  });
});
