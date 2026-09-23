// =========================================================================
// CLOSEDBOOK PRODUCTION OS — TEMPLATE SEEDING ENGINE (ADR-002, G.1)
// =========================================================================

import fs from "fs";
import path from "path";
import { driveRateLimiter } from "@/lib/drive/rate-limiter";

export const GOOGLE_MIME_SHEET = "application/vnd.google-apps.spreadsheet";
export const GOOGLE_MIME_DOC = "application/vnd.google-apps.document";
export const GOOGLE_MIME_FOLDER = "application/vnd.google-apps.folder";

export const OPENXML_MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const OPENXML_MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface SeededProjectWorkspace {
  rootFolderId: string;
  projectFolderId: string;
  syncFolderId: string;
  files: {
    ledger: { id: string; name: string };
    budget: { id: string; name: string };
    shotList: { id: string; name: string };
    callSheet: { id: string; name: string };
  };
}

/**
 * Finds an existing folder by name or creates it in Google Drive.
 */
export async function findOrCreateFolder({
  name,
  parentId,
  accessToken,
}: {
  name: string;
  parentId?: string;
  accessToken: string;
}): Promise<string> {
  await driveRateLimiter.acquire(1);

  const parentQuery = parentId ? `'${parentId}' in parents` : "'root' in parents";
  const query = `${parentQuery} and name = '${name}' and mimeType = '${GOOGLE_MIME_FOLDER}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name)`;

  const searchRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder
  await driveRateLimiter.acquire(1);
  const metadata: Record<string, any> = {
    name,
    mimeType: GOOGLE_MIME_FOLDER,
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create folder '${name}': ${err}`);
  }

  const result = await createRes.json();
  return result.id;
}

/**
 * Uploads a binary OpenXML document to Google Drive with automatic conversion to native Docs/Sheets.
 */
export async function uploadConvertedDocument({
  name,
  parentFolderId,
  binaryBuffer,
  targetGoogleMime,
  sourceMime,
  accessToken,
}: {
  name: string;
  parentFolderId: string;
  binaryBuffer: Buffer | Uint8Array;
  targetGoogleMime: string;
  sourceMime: string;
  accessToken: string;
}): Promise<{ id: string; name: string }> {
  await driveRateLimiter.acquire(1);

  const metadata = {
    name,
    mimeType: targetGoogleMime, // Drive converts to Google Docs/Sheets when target mimeType is set
    parents: [parentFolderId],
  };

  const boundary = "-------cb_tmpl_" + crypto.randomUUID();
  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `\r\n--${boundary}\r\nContent-Type: ${sourceMime}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  let binary = "";
  const len = binaryBuffer.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(binaryBuffer[i]);
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
    const err = await response.text();
    throw new Error(`Failed to upload & convert template '${name}': ${err}`);
  }

  const result = await response.json();
  return { id: result.id, name };
}

/**
 * Seeds all master production templates into the user's Google Drive workspace for a new project.
 */
export async function seedTemplates({
  projectId,
  projectName,
  accessToken,
  templatesDir,
}: {
  projectId: string;
  projectName: string;
  accessToken: string;
  templatesDir?: string;
}): Promise<SeededProjectWorkspace> {
  const baseDir =
    templatesDir || path.join(process.cwd(), "assets", "templates");

  // Read master binaries
  const ledgerBuffer = fs.readFileSync(path.join(baseDir, "ledger-master.xlsx"));
  const budgetBuffer = fs.readFileSync(path.join(baseDir, "budget-master.xlsx"));
  const shotListBuffer = fs.readFileSync(path.join(baseDir, "shot-list-master.xlsx"));
  const callSheetBuffer = fs.readFileSync(path.join(baseDir, "call-sheet-master.docx"));

  // 1. Root /ClosedBook/ folder
  const rootFolderId = await findOrCreateFolder({
    name: "ClosedBook",
    accessToken,
  });

  // 2. Project folder /ClosedBook/{ProjectName}/
  const projectFolderId = await findOrCreateFolder({
    name: projectName,
    parentId: rootFolderId,
    accessToken,
  });

  // 3. Sync folder /ClosedBook/{ProjectName}/.sync/
  const syncFolderId = await findOrCreateFolder({
    name: ".sync",
    parentId: projectFolderId,
    accessToken,
  });

  // 4. Seed documents with native conversion
  const [ledger, budget, shotList, callSheet] = await Promise.all([
    uploadConvertedDocument({
      name: `${projectName} — Master Ledger`,
      parentFolderId: projectFolderId,
      binaryBuffer: ledgerBuffer,
      targetGoogleMime: GOOGLE_MIME_SHEET,
      sourceMime: OPENXML_MIME_XLSX,
      accessToken,
    }),
    uploadConvertedDocument({
      name: `${projectName} — Budget Plan`,
      parentFolderId: projectFolderId,
      binaryBuffer: budgetBuffer,
      targetGoogleMime: GOOGLE_MIME_SHEET,
      sourceMime: OPENXML_MIME_XLSX,
      accessToken,
    }),
    uploadConvertedDocument({
      name: `${projectName} — Shot List`,
      parentFolderId: projectFolderId,
      binaryBuffer: shotListBuffer,
      targetGoogleMime: GOOGLE_MIME_SHEET,
      sourceMime: OPENXML_MIME_XLSX,
      accessToken,
    }),
    uploadConvertedDocument({
      name: `${projectName} — Call Sheet`,
      parentFolderId: projectFolderId,
      binaryBuffer: callSheetBuffer,
      targetGoogleMime: GOOGLE_MIME_DOC,
      sourceMime: OPENXML_MIME_DOCX,
      accessToken,
    }),
  ]);

  return {
    rootFolderId,
    projectFolderId,
    syncFolderId,
    files: {
      ledger,
      budget,
      shotList,
      callSheet,
    },
  };
}
