import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import * as Y from "yjs";
import {
  readRemoteManifest,
  writeRemoteManifest,
  hydrateDocFromManifest,
  pushDeltaWithManifest,
  compactManifestAndSnapshot,
} from "@/lib/sync/manifest-sync";
import { createInitialManifest, SyncManifest } from "@/lib/sync/manifest";

interface MockDriveFile {
  id: string;
  name: string;
  parents: string[];
  content: Uint8Array | string;
  etag: string;
  mimeType: string;
  createdTime: string;
}

let mockDriveStorage: MockDriveFile[] = [];

const server = setupServer(
  // 1. Multipart Upload (for deltas, snapshots, or new manifest)
  http.post("https://www.googleapis.com/upload/drive/v3/files", async ({ request }) => {
    const bodyText = await request.text();
    const metaMatch = bodyText.match(/\{[\s\S]*?\}/);
    const metadata = metaMatch ? JSON.parse(metaMatch[0]) : { name: "untitled" };

    const fileId = "drive_f_" + Math.random().toString(36).slice(2, 9);
    const etag = `etag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let content: Uint8Array | string = "";
    if (metadata.mimeType === "application/json") {
      const parts = bodyText.split("\r\n\r\n");
      content = parts[2] ? parts[2].split("\r\n--")[0] : "{}";
    } else {
      const parts = bodyText.split("\r\n\r\n");
      const base64Data = parts[2] ? parts[2].split("\r\n--")[0] : "";
      try {
        const binStr = atob(base64Data);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        content = bytes;
      } catch {
        content = new Uint8Array(0);
      }
    }

    const newFile: MockDriveFile = {
      id: fileId,
      name: metadata.name,
      parents: metadata.parents || ["default_folder"],
      content,
      etag,
      mimeType: metadata.mimeType,
      createdTime: new Date().toISOString(),
    };
    mockDriveStorage.push(newFile);

    return HttpResponse.json(
      { id: fileId, name: metadata.name },
      { headers: { ETag: etag } }
    );
  }),

  // 2. PATCH File (Conditional update for manifest.json with If-Match)
  http.patch("https://www.googleapis.com/upload/drive/v3/files/:fileId", async ({ request, params }) => {
    const fileId = params.fileId as string;
    const fileIndex = mockDriveStorage.findIndex((f) => f.id === fileId);

    if (fileIndex === -1) {
      return new HttpResponse("File not found", { status: 404 });
    }

    const currentFile = mockDriveStorage[fileIndex];
    const ifMatch = request.headers.get("If-Match");

    if (ifMatch && ifMatch !== currentFile.etag) {
      return new HttpResponse("Precondition Failed", { status: 412 });
    }

    const newContent = await request.text();
    const newEtag = `etag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    mockDriveStorage[fileIndex] = {
      ...currentFile,
      content: newContent,
      etag: newEtag,
    };

    return HttpResponse.json(
      { id: fileId, name: currentFile.name },
      { headers: { ETag: newEtag } }
    );
  }),

  // 3. Search Files
  http.get("https://www.googleapis.com/drive/v3/files", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    const nameMatch = q.match(/name\s*=\s*'([^']+)'/);
    const targetName = nameMatch ? nameMatch[1] : null;

    const matchedFiles = mockDriveStorage.filter((f) => {
      if (targetName && f.name !== targetName) return false;
      return true;
    });

    return HttpResponse.json({
      kind: "drive#fileList",
      files: matchedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        etag: f.etag,
        createdTime: f.createdTime,
      })),
    });
  }),

  // 4. Download File Media
  http.get("https://www.googleapis.com/drive/v3/files/:fileId", ({ request, params }) => {
    const file = mockDriveStorage.find((f) => f.id === params.fileId);
    if (!file) {
      return new HttpResponse("Not found", { status: 404 });
    }

    if (typeof file.content === "string") {
      return new HttpResponse(file.content, {
        headers: {
          "Content-Type": "application/json",
          ETag: file.etag,
        },
      });
    }

    return new HttpResponse(file.content.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        ETag: file.etag,
      },
    });
  })
);

describe("Manifest-Pointer Protocol Integration Tests (Concurrent Clients & Compaction)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    mockDriveStorage = [];
  });
  afterAll(() => server.close());

  it("initializes and reads remote manifest on Drive", async () => {
    const initial = createInitialManifest();
    const writeResult = await writeRemoteManifest({
      syncFolderId: "proj_folder_1",
      manifest: initial,
      accessToken: "mock_token",
    });

    expect(writeResult.fileId).toBeDefined();

    const readResult = await readRemoteManifest({
      syncFolderId: "proj_folder_1",
      accessToken: "mock_token",
    });

    expect(readResult).not.toBeNull();
    expect(readResult?.manifest.generation).toBe(1);
    expect(readResult?.manifest.activeDeltas).toHaveLength(0);
    expect(readResult?.etag).toBeDefined();
  });

  it("handles concurrent writes from 2 offline clients, resolving ETag conflicts automatically", async () => {
    const syncFolderId = "proj_folder_concurrent";
    const token = "mock_token";

    // Setup initial manifest
    const initManifest = createInitialManifest();
    await writeRemoteManifest({
      syncFolderId,
      manifest: initManifest,
      accessToken: token,
    });

    // Client A and Client B start with same baseline
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Client A makes local mutation offline: Add scene task
    const tasksA = docA.getMap("tasks");
    tasksA.set("task-101", { title: "Shoot Scene 1 (Morning)", dept: "camera" });
    const updateA = Y.encodeStateAsUpdate(docA);

    // Client B makes local mutation offline: Add budget expense
    const expensesB = docB.getMap("expenses");
    expensesB.set("exp-201", { description: "Grip Truck Fuel", amount: 150 });
    const updateB = Y.encodeStateAsUpdate(docB);

    // Both come online and push deltas. Client A finishes first
    const pushA = await pushDeltaWithManifest({
      syncFolderId,
      slice: "operations",
      updateData: updateA,
      clientId: "client_laptop_A",
      accessToken: token,
      doc: docA,
    });
    expect(pushA.deltaFileId).toBeDefined();

    // Client B attempts push — its manifest write will trigger conflict retry and succeed
    const pushB = await pushDeltaWithManifest({
      syncFolderId,
      slice: "financial",
      updateData: updateB,
      clientId: "client_phone_B",
      accessToken: token,
      doc: docB,
    });
    expect(pushB.deltaFileId).toBeDefined();

    // Now verify the remote manifest contains both deltas
    const finalManifest = await readRemoteManifest({
      syncFolderId,
      accessToken: token,
    });
    expect(finalManifest?.manifest.activeDeltas).toHaveLength(2);

    // Client A and Client B hydrate from remote manifest
    const freshDocClientA = new Y.Doc();
    const freshDocClientB = new Y.Doc();

    await hydrateDocFromManifest({ syncFolderId, accessToken: token, doc: freshDocClientA });
    await hydrateDocFromManifest({ syncFolderId, accessToken: token, doc: freshDocClientB });

    // Deterministic state convergence verification
    const tasksFinalA = freshDocClientA.getMap("tasks").get("task-101");
    const expFinalA = freshDocClientA.getMap("expenses").get("exp-201");
    const tasksFinalB = freshDocClientB.getMap("tasks").get("task-101");
    const expFinalB = freshDocClientB.getMap("expenses").get("exp-201");

    expect(tasksFinalA).toEqual({ title: "Shoot Scene 1 (Morning)", dept: "camera" });
    expect(expFinalA).toEqual({ description: "Grip Truck Fuel", amount: 150 });
    expect(tasksFinalB).toEqual(tasksFinalA);
    expect(expFinalB).toEqual(expFinalA);
  });

  it("compacts deltas into a new generation snapshot and resets activeDeltas", async () => {
    const syncFolderId = "proj_compaction_test";
    const token = "mock_token";

    const initManifest = createInitialManifest();
    initManifest.activeDeltas = [
      "100_c1_operations_a.delta",
      "200_c2_financial_b.delta",
    ];
    const writeResult = await writeRemoteManifest({
      syncFolderId,
      manifest: initManifest,
      accessToken: token,
    });

    const doc = new Y.Doc();
    doc.getMap("settings").set("projectName", "ClosedBook Feature Film");

    const compacted = await compactManifestAndSnapshot({
      syncFolderId,
      currentManifest: initManifest,
      manifestFileId: writeResult.fileId,
      etag: writeResult.etag,
      doc,
      accessToken: token,
    });

    expect(compacted.generation).toBe(2);
    expect(compacted.activeDeltas).toHaveLength(0);
    expect(compacted.activeSnapshot).toContain("snap_gen1_");

    // Verify remote manifest on Drive was updated
    const remoteManifest = await readRemoteManifest({ syncFolderId, accessToken: token });
    expect(remoteManifest?.manifest.generation).toBe(2);
    expect(remoteManifest?.manifest.activeDeltas).toHaveLength(0);
  });
});
