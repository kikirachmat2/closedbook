// =========================================================================
// CLOSEDBOOK PRODUCTION OS — MANIFEST-POINTER PROTOCOL (ADR-004)
// =========================================================================

export interface SyncManifest {
  version: number;
  generation: number;
  activeSnapshot: string;
  snapshotETag?: string;
  activeDeltas: string[];
  lastCompactedAt: number;
  updatedAt: number;
}

export const MANIFEST_FILENAME = "manifest.json";
export const COMPACTION_DELTA_THRESHOLD = 50;

/**
 * Creates an empty, initial manifest for a newly initialized project.
 */
export function createInitialManifest(): SyncManifest {
  const now = Date.now();
  return {
    version: 1,
    generation: 1,
    activeSnapshot: "snapshots/snap_gen1.bin",
    activeDeltas: [],
    lastCompactedAt: now,
    updatedAt: now,
  };
}

/**
 * Appends a new delta file path to the active delta list.
 */
export function registerDeltaInManifest(
  manifest: SyncManifest,
  deltaFilename: string
): SyncManifest {
  if (manifest.activeDeltas.includes(deltaFilename)) {
    return manifest;
  }

  return {
    ...manifest,
    activeDeltas: [...manifest.activeDeltas, deltaFilename],
    updatedAt: Date.now(),
  };
}

/**
 * Evaluates whether compaction threshold has been reached.
 */
export function shouldTriggerCompaction(
  manifest: SyncManifest,
  threshold: number = COMPACTION_DELTA_THRESHOLD
): boolean {
  return manifest.activeDeltas.length >= threshold;
}

/**
 * Creates the compacted manifest pointer pointing to the newly compiled snapshot.
 */
export function compileCompactedManifest({
  currentManifest,
  newSnapshotPath,
  snapshotETag,
}: {
  currentManifest: SyncManifest;
  newSnapshotPath: string;
  snapshotETag?: string;
}): SyncManifest {
  const now = Date.now();
  return {
    version: currentManifest.version,
    generation: currentManifest.generation + 1,
    activeSnapshot: newSnapshotPath,
    snapshotETag,
    activeDeltas: [], // Deltas are folded into the new snapshot
    lastCompactedAt: now,
    updatedAt: now,
  };
}
