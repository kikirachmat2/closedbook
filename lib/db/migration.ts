// =========================================================================
// CLOSEDBOOK PRODUCTION OS — IDEMPOTENT STORAGE MIGRATION (ADR-002)
// =========================================================================

import { db } from "./schema";
import { logLocalError } from "./error-log";
import { Project, ProjectShell } from "@/lib/types";

export const DEXIE_MIGRATION_FLAG = "closebook_dexie_migrated_v1";

export interface MigrationResult {
  migrated: boolean;
  alreadyMigrated?: boolean;
  projectCount: number;
  itemCount: number;
  error?: string;
}

export async function migrateLocalStorageToDexie(): Promise<MigrationResult> {
  if (typeof window === "undefined" || !window.localStorage) {
    return { migrated: false, projectCount: 0, itemCount: 0 };
  }

  // 1. Idempotency Guard
  if (localStorage.getItem(DEXIE_MIGRATION_FLAG) === "true") {
    return { migrated: false, alreadyMigrated: true, projectCount: 0, itemCount: 0 };
  }

  let totalProjects = 0;
  let totalItems = 0;

  try {
    const rawProjects = localStorage.getItem("closebook_projects");
    const projects: ProjectShell[] = rawProjects ? JSON.parse(rawProjects) : [];

    // Fallback if no projects array, at least seed proj-001 if existing in localStorage
    const projectIds = projects.map((p) => p.id);
    if (!projectIds.includes("proj-001")) {
      projectIds.unshift("proj-001");
    }

    await db.transaction("rw", [
      db.projects,
      db.transactions,
      db.tasks,
      db.pockets,
      db.departments,
      db.equipment,
      db.alerts,
      db.transfers,
      db.notes,
    ], async () => {
      for (const projectId of projectIds) {
        // Project metadata
        const projectRaw = localStorage.getItem(`closebook_project_${projectId}`);
        if (projectRaw) {
          try {
            const projectObj: Project = JSON.parse(projectRaw);
            await db.projects.put(projectObj);
            totalProjects++;
          } catch (e) {
            // Ignore corrupted individual items
          }
        }

        // Transactions
        const txRaw = localStorage.getItem(`closebook_${projectId}_transactions`);
        if (txRaw) {
          try {
            const items = JSON.parse(txRaw);
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.transactions.put({ ...item, projectId });
                totalItems++;
              }
            }
          } catch (e) {}
        }

        // Tasks
        const tasksRaw = localStorage.getItem(`closebook_${projectId}_tasks`);
        if (tasksRaw) {
          try {
            const items = JSON.parse(tasksRaw);
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.tasks.put({ ...item, projectId });
                totalItems++;
              }
            }
          } catch (e) {}
        }

        // Pockets
        const pocketsRaw = localStorage.getItem(`closebook_${projectId}_pockets`);
        if (pocketsRaw) {
          try {
            const items = JSON.parse(pocketsRaw);
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.pockets.put({ ...item, projectId });
                totalItems++;
              }
            }
          } catch (e) {}
        }

        // Departments
        const deptsRaw = localStorage.getItem(`closebook_${projectId}_departments`);
        if (deptsRaw) {
          try {
            const items = JSON.parse(deptsRaw);
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.departments.put({ ...item, projectId });
                totalItems++;
              }
            }
          } catch (e) {}
        }

        // Equipment
        const eqRaw = localStorage.getItem(`closebook_${projectId}_equipment`);
        if (eqRaw) {
          try {
            const items = JSON.parse(eqRaw);
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.equipment.put({ ...item, projectId });
                totalItems++;
              }
            }
          } catch (e) {}
        }
      }
    });

    // Mark as migrated
    localStorage.setItem(DEXIE_MIGRATION_FLAG, "true");

    return {
      migrated: true,
      projectCount: totalProjects,
      itemCount: totalItems,
    };
  } catch (err: any) {
    await logLocalError({
      level: "error",
      message: `Failed localStorage to Dexie migration: ${err?.message}`,
      stack: err?.stack,
    });

    return {
      migrated: false,
      projectCount: totalProjects,
      itemCount: totalItems,
      error: err?.message || "Migration failed",
    };
  }
}
