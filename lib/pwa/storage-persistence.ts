// =========================================================================
// CLOSEDBOOK PRODUCTION OS — STORAGE PERSISTENCE & COLD-START RESTORE (G.2)
// =========================================================================

import * as Y from "yjs";
import { db } from "@/lib/db/schema";
import { hydrateDocFromManifest } from "@/lib/sync/manifest-sync";

export interface StoragePersistenceResult {
  persisted: boolean;
  usageBytes?: number;
  quotaBytes?: number;
}

/**
 * Requests persistent storage from the browser to prevent eviction under storage pressure.
 */
export async function requestStoragePersistence(): Promise<StoragePersistenceResult> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return { persisted: false };
  }

  try {
    const isPersisted = await navigator.storage.persist();

    let usageBytes: number | undefined;
    let quotaBytes: number | undefined;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage;
      quotaBytes = estimate.quota;
    }

    return {
      persisted: isPersisted,
      usageBytes,
      quotaBytes,
    };
  } catch (err) {
    console.warn("[PWA] Storage persistence request failed:", err);
    return { persisted: false };
  }
}

/**
 * Detects if the local IndexedDB database is empty while a valid Drive sync backup exists,
 * and automatically triggers a 3-Phase Progressive Cold-Start Hydration:
 * - Phase 1: Project Metadata & Settings (Immediate app shell access)
 * - Phase 2: Financial Slice (Pockets & Expenses / Transactions)
 * - Phase 3: Operations Slice (Tasks, Departments, Team assignments)
 */
export async function detectAndRestoreColdStart({
  accessToken,
  syncFolderId,
  doc,
  onProgress,
}: {
  accessToken: string;
  syncFolderId: string;
  doc: Y.Doc;
  onProgress?: (step: string, percentage: number) => void;
}): Promise<{ restored: boolean; deltaCount: number }> {
  const projectCount = await db.projects.count();

  // If local IndexedDB already has project data, no cold-start restore is required
  if (projectCount > 0) {
    return { restored: false, deltaCount: 0 };
  }

  onProgress?.("Menghubungkan ke Google Drive...", 10);

  // Hydrate Y.Doc from remote Drive manifest + snapshot + deltas
  const remote = await hydrateDocFromManifest({
    syncFolderId,
    accessToken,
    doc,
  });

  if (!remote) {
    return { restored: false, deltaCount: 0 };
  }

  const tasksMap = doc.getMap("tasks");
  const expensesMap = doc.getMap("expenses");
  const settingsMap = doc.getMap("settings");

  const projectId = (settingsMap.get("projectId") as string) || "restored_project";
  const projectName = (settingsMap.get("projectName") as string) || "Restored Production";

  // -----------------------------------------------------------------------
  // PHASE 1: Project Metadata (Immediate shell hydration)
  // -----------------------------------------------------------------------
  onProgress?.("Fase 1: Memulihkan Metadata Proyek...", 30);
  await db.projects.put({
    id: projectId,
    name: projectName,
    slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    currency: "IDR",
    totalBudget: (settingsMap.get("totalBudget") as number) || 0,
    currentDisbursed: 0,
    driveFolderId: syncFolderId,
    sheetId: "",
    shootDays: 1,
    startDate: new Date().toISOString(),
    director: "Lead Director",
    createdAt: new Date().toISOString(),
  });

  // -----------------------------------------------------------------------
  // PHASE 2: Financial Slice (Pockets & Transactions / Expenses)
  // -----------------------------------------------------------------------
  onProgress?.("Fase 2: Memulihkan Rekening & Transaksi...", 65);
  const now = new Date().toISOString();
  await db.transaction("rw", [db.transactions], async () => {
    for (const [expId, rawExp] of expensesMap.entries()) {
      const expObj = rawExp as any;
      await db.transactions.put({
        id: expId,
        projectId,
        pocketId: expObj.pocketId || "general",
        pocketName: expObj.pocketName || "General Vault",
        departmentId: expObj.departmentId || "production",
        departmentName: expObj.departmentName || "Production",
        amount: expObj.amount || 0,
        description: expObj.description || "Restored Expense",
        vendor: expObj.vendor || "On-Set Vendor",
        status: expObj.status || "approved",
        loggedBy: expObj.loggedBy || "Lead",
        loggedAt: expObj.loggedAt || now,
        createdAt: now,
      });
    }
  });

  // -----------------------------------------------------------------------
  // PHASE 3: Operations Slice (Tasks & Departments)
  // -----------------------------------------------------------------------
  onProgress?.("Fase 3: Memulihkan Tugas & Operasional...", 90);
  await db.transaction("rw", [db.tasks], async () => {
    for (const [taskId, rawTask] of tasksMap.entries()) {
      const taskObj = rawTask as any;
      await db.tasks.put({
        id: taskId,
        projectId,
        title: taskObj.title || "Restored Task",
        departmentId: taskObj.departmentId || "production",
        departmentName: taskObj.departmentName || "Production",
        assignee: taskObj.assignee || "Lead",
        priority: taskObj.priority || "medium",
        status: taskObj.status || "todo",
        dueDate: taskObj.dueDate || new Date().toISOString(),
      });
    }
  });

  onProgress?.("Pemulihan selesai!", 100);

  return {
    restored: true,
    deltaCount: remote.manifest.activeDeltas.length,
  };
}
