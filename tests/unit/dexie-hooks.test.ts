import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/lib/db/schema";
import { createProject, deleteProject } from "@/lib/db/hooks/use-projects";
import { createTask, updateTaskStatus } from "@/lib/db/hooks/use-tasks";
import { createExpense } from "@/lib/db/hooks/use-expenses";
import { updateSyncStatus } from "@/lib/db/hooks/use-sync-status";

describe("Dexie Reactive Data Hooks Layer (G.1 Task 2)", () => {
  beforeEach(async () => {
    await db.projects.clear();
    await db.tasks.clear();
    await db.transactions.clear();
    await db.pockets.clear();
    await db.sync_state.clear();
  });

  it("creates, updates, and cascade deletes projects", async () => {
    await createProject({
      id: "proj-indie-01",
      name: "Indie Documentary",
      slug: "indie-doc",
      currency: "IDR",
      totalBudget: 75000000,
      currentDisbursed: 15000000,
      driveFolderId: "fld_doc_01",
      sheetId: "sht_doc_01",
      shootDays: 5,
      startDate: "2026-11-01",
      director: "Rizky P",
      createdAt: new Date().toISOString(),
    });

    const project = await db.projects.get("proj-indie-01");
    expect(project?.name).toBe("Indie Documentary");

    // Add task and verify cascade delete
    await createTask({
      id: "task-01",
      projectId: "proj-indie-01",
      departmentId: "cat-ops",
      departmentName: "Operations",
      title: "Confirm interview permits",
      assignee: "Siti",
      priority: "high",
      status: "todo",
      dueDate: "2026-10-30",
    });

    await deleteProject("proj-indie-01");
    expect(await db.projects.get("proj-indie-01")).toBeUndefined();
    expect(await db.tasks.get("task-01")).toBeUndefined();
  });

  it("updates task statuses reliably", async () => {
    await createTask({
      id: "task-kanban-01",
      projectId: "proj-001",
      departmentId: "cat-ops",
      departmentName: "Operations",
      title: "Audio Gear Rental",
      assignee: "Budi",
      priority: "medium",
      status: "todo",
      dueDate: "2026-10-20",
    });

    await updateTaskStatus("task-kanban-01", "completed");
    const updated = await db.tasks.get("task-kanban-01");
    expect(updated?.status).toBe("completed");
  });

  it("creates expense and decrements pocket balance atomically", async () => {
    await db.pockets.put({
      id: "pkt-field-01",
      projectId: "proj-001",
      name: "Field Cash",
      type: "field_cash",
      custodian: "Treasurer",
      balance: 5000000,
      allocated: 5000000,
    });

    await createExpense({
      id: "tx-coffee-01",
      projectId: "proj-001",
      pocketId: "pkt-field-01",
      pocketName: "Field Cash",
      departmentId: "cat-ops",
      departmentName: "Operations",
      amount: 150000,
      description: "Crew Coffee & Snacks",
      vendor: "Kedai Kopi Set",
      status: "approved",
      loggedBy: "UPM",
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const tx = await db.transactions.get("tx-coffee-01");
    expect(tx?.amount).toBe(150000);

    const pocket = await db.pockets.get("pkt-field-01");
    expect(pocket?.balance).toBe(4850000); // 5,000,000 - 150,000
  });

  it("updates and retrieves sync state records", async () => {
    await updateSyncStatus("proj-001", {
      snapshotETag: '"etag-snapshot-123"',
      pendingDeltaCount: 3,
    });

    const state = await db.sync_state.get("proj-001");
    expect(state?.snapshotETag).toBe('"etag-snapshot-123"');
    expect(state?.pendingDeltaCount).toBe(3);
  });
});
