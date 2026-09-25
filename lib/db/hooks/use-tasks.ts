// =========================================================================
// CLOSEDBOOK PRODUCTION OS — REACTIVE TASK HOOKS (DEXIE)
// =========================================================================

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { Task, TaskStatus } from "@/lib/types";

export function useTasks(projectId: string, status?: TaskStatus): Task[] | undefined {
  return useLiveQuery(() => {
    if (!projectId) return [];
    if (status) {
      return db.tasks.where("[projectId+status]").equals([projectId, status]).toArray();
    }
    return db.tasks.where("projectId").equals(projectId).toArray();
  }, [projectId, status]);
}

export async function createTask(task: Task & { projectId: string }): Promise<string> {
  await db.tasks.put(task);
  return task.id;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await db.tasks.update(taskId, { status });
}

export async function deleteTask(taskId: string): Promise<void> {
  await db.tasks.delete(taskId);
}
