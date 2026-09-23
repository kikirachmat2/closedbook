// =========================================================================
// CLOSEDBOOK PRODUCTION OS — MANIFEST PROTOCOL SYNC INTEGRATION (ADR-004)
// =========================================================================

import * as Y from "yjs";
import {
  SyncManifest,
  MANIFEST_FILENAME,
  createInitialManifest,
  registerDeltaInManifest,
  shouldTriggerCompaction,
  compileCompactedManifest,
  COMPACTION_DELTA_THRESHOLD,
} from "./manifest";
import {
  uploadDeltaFile,
  downloadDeltaBuffer,
  applyDeltasToDoc,
  findFileByName,
  uploadSnapshotFile,
} from "./drive-adapter";
import { driveRateLimiter } from "@/lib/drive/rate-limiter";

export class ManifestConflictError extends Error {
  constructor(message: string = "Manifest ETag mismatch (412 Precondition Failed)") {
    super(message);
    this.name = "ManifestConflictError";
  }
}

export interface RemoteManifestResult {
  manifest: SyncManifest;
  fileId: string;
  etag: string;
}

/**
 * Reads manifest.json from the Drive sync folder.
 * Returns null if manifest.json does not yet exist.
 */
export async function readRemoteManifest({
  syncFolderId,
  accessToken,
}: {
  syncFolderId: string;
  accessToken: string;
}): Promise<RemoteManifestResult | null> {
  const fileMeta = await findFileByName({
    parentId: syncFolderId,
    name: MANIFEST_FILENAME,
    accessToken,
  });

  if (!fileMeta) {
    return null;
  }

  await driveRateLimiter.acquire(1);

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileMeta.id}?alt=media`;
  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download manifest.json: ${response.status}`);
  }

  const manifest = (await response.json()) as SyncManifest;
  const etag = response.headers.get("ETag") || fileMeta.etag || `etag_${manifest.updatedAt}`;

  return {
    manifest,
    fileId: fileMeta.id,
    etag,
  };
}

/**
 * Writes or updates manifest.json with conditional ETag check.
 */
export async function writeRemoteManifest({
  syncFolderId,
  manifest,
  accessToken,
  existingFileId,
  ifMatchETag,
}: {
  syncFolderId: string;
  manifest: SyncManifest;
  accessToken: string;
  existingFileId?: string;
  ifMatchETag?: string;
}): Promise<{ fileId: string; etag: string }> {
  await driveRateLimiter.acquire(1);

  const jsonBody = JSON.stringify(manifest, null, 2);

  if (existingFileId) {
    // Update existing manifest
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    if (ifMatchETag) {
      headers["If-Match"] = ifMatchETag;
    }

    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers,
      body: jsonBody,
    });

    if (response.status === 412) {
      throw new ManifestConflictError();
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to update manifest.json (${response.status}): ${err}`);
    }

    const newETag = response.headers.get("ETag") || `etag_${Date.now()}`;
    return { fileId: existingFileId, etag: newETag };
  } else {
    // Create new manifest
    const boundary = "-------cb_manifest_" + crypto.randomUUID();
    const metadata = {
      name: MANIFEST_FILENAME,
      parents: [syncFolderId],
      mimeType: "application/json",
    };

    const multipartRequestBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${jsonBody}\r\n` +
      `--${boundary}--`;

    const createUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create manifest.json (${response.status}): ${err}`);
    }

    const result = await response.json();
    const newETag = response.headers.get("ETag") || `etag_${manifest.updatedAt}`;
    return { fileId: result.id, etag: newETag };
  }
}

/**
 * Hydrates a local Y.Doc by reading remote manifest, downloading snapshot + active deltas.
 */
export async function hydrateDocFromManifest({
  syncFolderId,
  accessToken,
  doc,
}: {
  syncFolderId: string;
  accessToken: string;
  doc: Y.Doc;
}): Promise<RemoteManifestResult | null> {
  const remote = await readRemoteManifest({ syncFolderId, accessToken });
  if (!remote) {
    return null;
  }

  const { manifest } = remote;

  // 1. Download and apply active snapshot if one exists and isn't fresh dummy
  if (manifest.activeSnapshot) {
    const snapshotMeta = await findFileByName({
      parentId: syncFolderId,
      name: manifest.activeSnapshot,
      accessToken,
    });
    if (snapshotMeta) {
      const snapshotBuffer = await downloadDeltaBuffer({
        fileId: snapshotMeta.id,
        accessToken,
      });
      applyDeltasToDoc(doc, [snapshotBuffer]);
    }
  }

  // 2. Download and apply active deltas in chronological order
  for (const deltaName of manifest.activeDeltas) {
    const deltaMeta = await findFileByName({
      parentId: syncFolderId,
      name: deltaName,
      accessToken,
    });
    if (deltaMeta) {
      const deltaBuffer = await downloadDeltaBuffer({
        fileId: deltaMeta.id,
        accessToken,
      });
      applyDeltasToDoc(doc, [deltaBuffer]);
    }
  }

  return remote;
}

/**
 * Writes a delta to Drive and registers it in the manifest using ETag concurrency control.
 * Automatically runs compaction if delta threshold is crossed.
 */
export async function pushDeltaWithManifest({
  syncFolderId,
  slice,
  updateData,
  clientId,
  accessToken,
  doc,
  maxRetries = 3,
}: {
  syncFolderId: string;
  slice: "financial" | "operations" | "metadata";
  updateData: Uint8Array;
  clientId: string;
  accessToken: string;
  doc: Y.Doc;
  maxRetries?: number;
}): Promise<{ deltaFileId: string; manifestETag: string }> {
  // 1. Upload immutable delta file
  const { fileId: deltaFileId, fileName: deltaFileName } = await uploadDeltaFile({
    syncFolderId,
    slice,
    updateData,
    clientId,
    accessToken,
  });

  // 2. Append delta to manifest with optimistic concurrency retry loop
  let attempt = 0;
  let finalETag = "";

  while (attempt < maxRetries) {
    attempt++;
    const current = await readRemoteManifest({ syncFolderId, accessToken });

    let updatedManifest: SyncManifest;
    let existingFileId: string | undefined;
    let ifMatchETag: string | undefined;

    if (!current) {
      // First time initialization
      const initial = createInitialManifest();
      updatedManifest = registerDeltaInManifest(initial, deltaFileName);
    } else {
      updatedManifest = registerDeltaInManifest(current.manifest, deltaFileName);
      existingFileId = current.fileId;
      ifMatchETag = current.etag;
    }

    try {
      const writeResult = await writeRemoteManifest({
        syncFolderId,
        manifest: updatedManifest,
        accessToken,
        existingFileId,
        ifMatchETag,
      });

      finalETag = writeResult.etag;

      // 3. Compactor check: If deltas reach threshold, compact
      if (shouldTriggerCompaction(updatedManifest, COMPACTION_DELTA_THRESHOLD)) {
        await compactManifestAndSnapshot({
          syncFolderId,
          currentManifest: updatedManifest,
          manifestFileId: writeResult.fileId,
          etag: writeResult.etag,
          doc,
          accessToken,
        });
      }

      return { deltaFileId, manifestETag: finalETag };
    } catch (err) {
      if (err instanceof ManifestConflictError && attempt < maxRetries) {
        // ETag conflict, retry with fresh read
        continue;
      }
      throw err;
    }
  }

  throw new Error("Exceeded max retries registering delta in manifest");
}

/**
 * Compacts accumulated deltas into a single snapshot file and rewrites manifest.
 */
export async function compactManifestAndSnapshot({
  syncFolderId,
  currentManifest,
  manifestFileId,
  etag,
  doc,
  accessToken,
}: {
  syncFolderId: string;
  currentManifest: SyncManifest;
  manifestFileId: string;
  etag: string;
  doc: Y.Doc;
  accessToken: string;
}): Promise<SyncManifest> {
  const snapshotData = Y.encodeStateAsUpdate(doc);

  const { fileName: snapshotFileName } = await uploadSnapshotFile({
    syncFolderId,
    generation: currentManifest.generation,
    snapshotData,
    accessToken,
  });

  const compacted = compileCompactedManifest({
    currentManifest,
    newSnapshotPath: snapshotFileName,
  });

  await writeRemoteManifest({
    syncFolderId,
    manifest: compacted,
    accessToken,
    existingFileId: manifestFileId,
    ifMatchETag: etag,
  });

  return compacted;
}
