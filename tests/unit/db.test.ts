import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ClosedBookDB } from "@/lib/db/schema";
import { logLocalError, getRecentErrorLogs } from "@/lib/db/error-log";

describe("Dexie.js ClosedBookDB v1 Schema & Local Error Logger (ADR-002, ADR-006)", () => {
  let testDb: ClosedBookDB;

  beforeEach(async () => {
    testDb = new ClosedBookDB("TestDB_" + Math.random().toString(36).substring(2));
  });

  it("initializes tables with proper indexes", () => {
    expect(testDb.projects).toBeDefined();
    expect(testDb.transactions).toBeDefined();
    expect(testDb.tasks).toBeDefined();
    expect(testDb.pockets).toBeDefined();
    expect(testDb.deltas).toBeDefined();
    expect(testDb.error_logs).toBeDefined();
  });

  it("stores and queries projects and tasks cleanly", async () => {
    await testDb.projects.put({
      id: "proj-test",
      name: "Short Film Test",
      slug: "short-film-test",
      currency: "USD",
      totalBudget: 50000,
      currentDisbursed: 10000,
      driveFolderId: "fld_123",
      sheetId: "sht_123",
      shootDays: 3,
      startDate: "2026-10-01",
      director: "Jane Doe",
      createdAt: new Date().toISOString(),
    });

    const project = await testDb.projects.get("proj-test");
    expect(project?.name).toBe("Short Film Test");

    await testDb.tasks.put({
      id: "task-1",
      projectId: "proj-test",
      title: "Scout mountain location",
      departmentId: "cat-ops",
      departmentName: "Operations",
      status: "todo",
      priority: "high",
      assignee: "Alex M",
      dueDate: "2026-10-15",
    });

    const tasks = await testDb.tasks.where("[projectId+status]").equals(["proj-test", "todo"]).toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Scout mountain location");
  });

  it("logs errors locally in error_logs table per ADR-006", async () => {
    const id = await logLocalError({
      level: "warn",
      message: "Test warning message",
      context: { slice: "financial" },
    });

    expect(id).toBeDefined();
    const logs = await getRecentErrorLogs(5);
    expect(logs.some((l) => l.message === "Test warning message")).toBe(true);
  });
});
