import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/lib/db/schema";
import { migrateLocalStorageToDexie, DEXIE_MIGRATION_FLAG } from "@/lib/db/migration";

class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe("Idempotent Storage Migration (G.1 Task 3)", () => {
  const mockStorage = new MockLocalStorage();

  beforeEach(async () => {
    mockStorage.clear();
    // Attach to global window
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockStorage;

    await db.projects.clear();
    await db.transactions.clear();
    await db.tasks.clear();
    await db.pockets.clear();
  });

  it("migrates existing localStorage state into Dexie tables cleanly", async () => {
    // 1. Seed legacy data into mock localStorage
    const sampleProject = {
      id: "proj-legacy",
      name: "Legacy Commercial",
      slug: "legacy-commercial",
      currency: "USD",
      totalBudget: 80000,
      currentDisbursed: 20000,
      driveFolderId: "fld_legacy",
      sheetId: "sht_legacy",
      shootDays: 2,
      startDate: "2026-12-01",
      director: "Marcus V",
      createdAt: new Date().toISOString(),
    };

    mockStorage.setItem(
      "closebook_projects",
      JSON.stringify([{ id: "proj-legacy", name: "Legacy Commercial", slug: "legacy-commercial", totalBudget: 80000, shootDays: 2, startDate: "2026-12-01", director: "Marcus V", createdAt: new Date().toISOString(), isActive: true }])
    );
    mockStorage.setItem("closebook_project_proj-legacy", JSON.stringify(sampleProject));
    mockStorage.setItem(
      "closebook_proj-legacy_transactions",
      JSON.stringify([
        {
          id: "tx-leg-1",
          pocketId: "pkt-1",
          pocketName: "Cash",
          departmentId: "cat-ops",
          departmentName: "Ops",
          amount: 500,
          description: "Location deposit",
          vendor: "Studio A",
          status: "approved",
          loggedBy: "UPM",
          loggedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ])
    );

    // 2. Execute migration
    const result = await migrateLocalStorageToDexie();
    expect(result.migrated).toBe(true);
    expect(result.projectCount).toBeGreaterThanOrEqual(1);

    // 3. Verify data in Dexie
    const projectInDb = await db.projects.get("proj-legacy");
    expect(projectInDb?.name).toBe("Legacy Commercial");

    const txInDb = await db.transactions.get("tx-leg-1");
    expect(txInDb?.amount).toBe(500);

    // 4. Verify safety net: localStorage keys are NOT deleted
    expect(mockStorage.getItem("closebook_projects")).not.toBeNull();
    expect(mockStorage.getItem(DEXIE_MIGRATION_FLAG)).toBe("true");

    // 5. Test idempotency: second call does not re-execute
    const secondResult = await migrateLocalStorageToDexie();
    expect(secondResult.migrated).toBe(false);
    expect(secondResult.alreadyMigrated).toBe(true);
  });
});
