// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DRIVE APPEND-ONLY DELTA ADAPTER (ADR-002, ADR-004)
// =========================================================================

import * as Y from "yjs";
import { driveRateLimiter } from "@/lib/drive/rate-limiter";

export interface RemoteDeltaFile {
  id: string;
  name: string;
  createdTime: string;
}

export interface UploadDeltaOptions {
  syncFolderId: string;
  slice: "financial" | "operations" | "metadata";
  updateData: Uint8Array;
  clientId: string;
  accessToken: string;
}

/**
 * Uploads a discrete Yjs binary delta to the project's .sync/deltas/ folder on Google Drive.
 */
export async function uploadDeltaFile({
  syncFolderId,
  slice,
  updateData,
  clientId,
  accessToken,
}: UploadDeltaOptions): Promise<{ fileId: string; fileName: string }> {
  await driveRateLimiter.acquire(1);

  const timestamp = Date.now();
  const uuid = crypto.randomUUID().slice(0, 8);
  const fileName = `${timestamp}_${clientId}_${slice}_${uuid}.delta`;

  const metadata = {
    name: fileName,
    parents: [syncFolderId],
    mimeType: "application/octet-stream",
  };

  const boundary = "-------cb_boundary_" + crypto.randomUUID();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  // Encode binary update to base64
  let binary = "";
  for (let i = 0; i < updateData.byteLength; i++) {
    binary += String.fromCharCode(updateData[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody =
    `--${boundary}\r\n${metaPart}` + mediaHeader + base64Data + closeDelimiter;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Drive Delta Upload Failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return { fileId: result.id, fileName };
}

/**
 * Lists remote delta files in the .sync/ folder that have been created since a given timestamp.
 */
export async function listRemoteDeltas({
  syncFolderId,
  accessToken,
  sinceTimestamp = 0,
}: {
  syncFolderId: string;
  accessToken: string;
  sinceTimestamp?: number;
}): Promise<RemoteDeltaFile[]> {
  await driveRateLimiter.acquire(1);

  const isoTime = new Date(sinceTimestamp).toISOString();
  const query = `'${syncFolderId}' in parents and name contains '.delta' and trashed = false and createdTime > '${isoTime}'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,createdTime)&orderBy=createdTime asc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Drive Delta List Failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.files || []) as RemoteDeltaFile[];
}

/**
 * Downloads a raw binary delta from Google Drive.
 */
export async function downloadDeltaBuffer({
  fileId,
  accessToken,
}: {
  fileId: string;
  accessToken: string;
}): Promise<Uint8Array> {
  await driveRateLimiter.acquire(1);

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download delta file ${fileId}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Applies an array of binary delta updates into a Yjs document deterministically.
 */
export function applyDeltasToDoc(doc: Y.Doc, deltaBuffers: Uint8Array[]): void {
  for (const delta of deltaBuffers) {
    Y.applyUpdate(doc, delta, "drive_sync");
  }
}

/**
 * Searches for a file by name inside a parent folder in Google Drive.
 */
export async function findFileByName({
  parentId,
  name,
  accessToken,
}: {
  parentId: string;
  name: string;
  accessToken: string;
}): Promise<{ id: string; name: string; etag?: string } | null> {
  await driveRateLimiter.acquire(1);

  const query = `'${parentId}' in parents and name = '${name}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,etag)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to find file '${name}': ${response.status}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Uploads a consolidated full snapshot to Drive.
 */
export async function uploadSnapshotFile({
  syncFolderId,
  generation,
  snapshotData,
  accessToken,
}: {
  syncFolderId: string;
  generation: number;
  snapshotData: Uint8Array;
  accessToken: string;
}): Promise<{ fileId: string; fileName: string }> {
  await driveRateLimiter.acquire(1);

  const fileName = `snap_gen${generation}_${Date.now()}.bin`;
  const metadata = {
    name: fileName,
    parents: [syncFolderId],
    mimeType: "application/octet-stream",
  };

  const boundary = "-------cb_boundary_" + crypto.randomUUID();
  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  let binary = "";
  for (let i = 0; i < snapshotData.byteLength; i++) {
    binary += String.fromCharCode(snapshotData[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody =
    `--${boundary}\r\n${metaPart}` + mediaHeader + base64Data + `\r\n--${boundary}--`;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Drive Snapshot Upload Failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return { fileId: result.id, fileName };
}
