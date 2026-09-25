// =========================================================================
// CLOSEDBOOK PRODUCTION OS — REACTIVE SYNC STATUS HOOK (DEXIE)
// =========================================================================

import { useLiveQuery } from "dexie-react-hooks";
import { db, SyncStateRecord } from "@/lib/db/schema";

export function useSyncStatus(projectId: string): SyncStateRecord | undefined {
  return useLiveQuery(() => {
    if (!projectId) return undefined;
    return db.sync_state.get(projectId);
  }, [projectId]);
}

export async function updateSyncStatus(
  projectId: string,
  updates: Partial<SyncStateRecord>
): Promise<void> {
  const existing = await db.sync_state.get(projectId);
  if (existing) {
    await db.sync_state.update(projectId, {
      ...updates,
      lastSyncedAt: Date.now(),
    });
  } else {
    await db.sync_state.put({
      projectId,
      lastSyncedAt: Date.now(),
      pendingDeltaCount: 0,
      ...updates,
    });
  }
}
