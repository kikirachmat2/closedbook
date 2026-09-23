import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import * as Y from "yjs";
import {
  uploadDeltaFile,
  listRemoteDeltas,
  downloadDeltaBuffer,
  applyDeltasToDoc,
} from "@/lib/sync/drive-adapter";

// In-memory mock storage for Drive files
const mockFiles: Array<{ id: string; name: string; createdTime: string; content: Uint8Array }> = [];

const driveHandlers = [
  // 1. Multipart Upload
  http.post("https://www.googleapis.com/upload/drive/v3/files", async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("uploadType") !== "multipart") {
      return new HttpResponse("Bad uploadType", { status: 400 });
    }

    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    const bodyText = await request.text();
    // Parse metadata part to get name
    const match = bodyText.match(/\{[\s\S]*?\}/);
    const metadata = match ? JSON.parse(match[0]) : { name: "test.delta" };
    const fileId = "drive_file_" + Math.random().toString(36).slice(2, 9);
    
    // Extract base64 payload if present
    const base64Match = bodyText.split("\r\n\r\n").pop()?.split("\r\n")[0] || "";
    let content = new Uint8Array(0);
    try {
      if (base64Match) {
        const binStr = atob(base64Match);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        content = bytes;
      }
    } catch {
      // fallback empty
    }

    mockFiles.push({
      id: fileId,
      name: metadata.name,
      createdTime: new Date().toISOString(),
      content,
    });

    return HttpResponse.json({
      id: fileId,
      name: metadata.name,
      mimeType: "application/octet-stream",
    });
  }),

  // 2. Files List (with query)
  http.get("https://www.googleapis.com/drive/v3/files", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    // Return filtered files
    const resultFiles = mockFiles.map((f) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
    }));

    return HttpResponse.json({
      kind: "drive#fileList",
      files: resultFiles,
    });
  }),

  // 3. Download Media
  http.get("https://www.googleapis.com/drive/v3/files/:fileId", ({ request, params }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return new HttpResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    if (url.searchParams.get("alt") !== "media") {
      return new HttpResponse("Expected alt=media", { status: 400 });
    }

    const file = mockFiles.find((f) => f.id === params.fileId);
    if (!file) {
      return new HttpResponse("Not found", { status: 404 });
    }

    return new HttpResponse(file.content.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  }),
];

const server = setupServer(...driveHandlers);

describe("Drive Append-Only Delta Adapter (Unit / MSW)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    mockFiles.length = 0;
  });
  afterAll(() => server.close());

  it("uploads a Yjs binary delta file via multipart request", async () => {
    const doc = new Y.Doc();
    const map = doc.getMap("tasks");
    map.set("task-1", { id: "task-1", title: "Scene 1 Prep" });
    const updateData = Y.encodeStateAsUpdate(doc);

    const result = await uploadDeltaFile({
      syncFolderId: "folder_sync_123",
      slice: "operations",
      updateData,
      clientId: "client_macbook_01",
      accessToken: "mock_drive_token",
    });

    expect(result.fileId).toBeDefined();
    expect(result.fileId).toContain("drive_file_");
    expect(result.fileName).toContain("_operations_");
    expect(result.fileName.endsWith(".delta")).toBe(true);
    expect(mockFiles).toHaveLength(1);
    expect(mockFiles[0].name).toBe(result.fileName);
  });

  it("lists remote delta files filtered from Drive", async () => {
    mockFiles.push({
      id: "file_1",
      name: "1000_c1_operations_a1b2.delta",
      createdTime: new Date(Date.now() - 5000).toISOString(),
      content: new Uint8Array([1, 2, 3]),
    });
    mockFiles.push({
      id: "file_2",
      name: "2000_c2_financial_c3d4.delta",
      createdTime: new Date().toISOString(),
      content: new Uint8Array([4, 5, 6]),
    });

    const deltas = await listRemoteDeltas({
      syncFolderId: "folder_sync_123",
      accessToken: "mock_drive_token",
      sinceTimestamp: 0,
    });

    expect(deltas).toHaveLength(2);
    expect(deltas[0].id).toBe("file_1");
    expect(deltas[1].id).toBe("file_2");
  });

  it("downloads binary delta content from Drive", async () => {
    const testBytes = new Uint8Array([10, 20, 30, 40]);
    mockFiles.push({
      id: "file_download_test",
      name: "test.delta",
      createdTime: new Date().toISOString(),
      content: testBytes,
    });

    const downloaded = await downloadDeltaBuffer({
      fileId: "file_download_test",
      accessToken: "mock_drive_token",
    });

    expect(downloaded).toBeInstanceOf(Uint8Array);
    expect(Array.from(downloaded)).toEqual([10, 20, 30, 40]);
  });

  it("applies downloaded binary deltas into a target Yjs document", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const tasksMapA = docA.getMap("tasks");
    tasksMapA.set("t1", { title: "Draft Call Sheet", status: "todo" });
    const delta1 = Y.encodeStateAsUpdate(docA);

    tasksMapA.set("t2", { title: "Location Permit", status: "in-progress" });
    const delta2 = Y.encodeStateAsUpdate(docA);

    applyDeltasToDoc(docB, [delta1, delta2]);

    const tasksMapB = docB.getMap("tasks");
    expect(tasksMapB.get("t1")).toEqual({ title: "Draft Call Sheet", status: "todo" });
    expect(tasksMapB.get("t2")).toEqual({ title: "Location Permit", status: "in-progress" });
  });
});
