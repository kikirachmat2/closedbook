// =========================================================================
// CLOSEDBOOK PRODUCTION OS — REACTIVE PROJECT HOOKS (DEXIE)
// =========================================================================

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { Project } from "@/lib/types";

export function useProjects(): Project[] | undefined {
  return useLiveQuery(() => db.projects.orderBy("createdAt").reverse().toArray(), []);
}

export function useProject(projectId: string): Project | undefined {
  return useLiveQuery(() => db.projects.get(projectId), [projectId]);
}

export async function createProject(project: Project): Promise<string> {
  await db.projects.put(project);
  return project.id;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  await db.projects.update(projectId, updates);
}

export async function deleteProject(projectId: string): Promise<void> {
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
    await db.projects.delete(projectId);
    await db.transactions.where("projectId").equals(projectId).delete();
    await db.tasks.where("projectId").equals(projectId).delete();
    await db.pockets.where("projectId").equals(projectId).delete();
    await db.departments.where("projectId").equals(projectId).delete();
    await db.equipment.where("projectId").equals(projectId).delete();
    await db.alerts.where("projectId").equals(projectId).delete();
    await db.transfers.where("projectId").equals(projectId).delete();
    await db.notes.where("projectId").equals(projectId).delete();
  });
}
