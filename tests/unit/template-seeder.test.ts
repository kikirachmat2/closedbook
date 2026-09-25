import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  findOrCreateFolder,
  uploadConvertedDocument,
  seedTemplates,
  GOOGLE_MIME_SHEET,
  OPENXML_MIME_XLSX,
} from "@/lib/workspace/template-seeder";

interface MockFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

let mockDriveFiles: MockFile[] = [];

const server = setupServer(
  // 1. Search Files
  http.get("https://www.googleapis.com/drive/v3/files", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    const nameMatch = q.match(/name\s*=\s*'([^']+)'/);
    const targetName = nameMatch ? nameMatch[1] : null;

    const matched = mockDriveFiles.filter((f) => {
      if (targetName && f.name !== targetName) return false;
      return true;
    });

    return HttpResponse.json({
      kind: "drive#fileList",
      files: matched.map((f) => ({ id: f.id, name: f.name })),
    });
  }),

  // 2. Create Folder / Metadata POST
  http.post("https://www.googleapis.com/drive/v3/files", async ({ request }) => {
    const body = (await request.json()) as any;
    const newFile: MockFile = {
      id: "folder_" + Math.random().toString(36).slice(2, 8),
      name: body.name,
      mimeType: body.mimeType,
      parents: body.parents,
    };
    mockDriveFiles.push(newFile);
    return HttpResponse.json({ id: newFile.id, name: newFile.name });
  }),

  // 3. Multipart Upload
  http.post("https://www.googleapis.com/upload/drive/v3/files", async ({ request }) => {
    const bodyText = await request.text();
    const metaMatch = bodyText.match(/\{[\s\S]*?\}/);
    const metadata = metaMatch ? JSON.parse(metaMatch[0]) : { name: "untitled" };

    const fileId = "doc_" + Math.random().toString(36).slice(2, 8);
    mockDriveFiles.push({
      id: fileId,
      name: metadata.name,
      mimeType: metadata.mimeType,
      parents: metadata.parents,
    });

    return HttpResponse.json({ id: fileId, name: metadata.name });
  })
);

describe("Template Seeding Engine (Unit / MSW)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    mockDriveFiles = [];
  });
  afterAll(() => server.close());

  it("finds existing folder or creates a new one", async () => {
    // 1. Create new folder
    const folderId1 = await findOrCreateFolder({
      name: "ClosedBook",
      accessToken: "mock_token",
    });
    expect(folderId1).toBeDefined();
    expect(mockDriveFiles).toHaveLength(1);

    // 2. Finding same folder returns existing id
    const folderId2 = await findOrCreateFolder({
      name: "ClosedBook",
      accessToken: "mock_token",
    });
    expect(folderId2).toBe(folderId1);
    expect(mockDriveFiles).toHaveLength(1); // No duplicate created
  });

  it("uploads and converts document to Google Sheet format", async () => {
    const dummyBuffer = Buffer.from("mock_excel_bytes");
    const result = await uploadConvertedDocument({
      name: "Test Project — Ledger",
      parentFolderId: "folder_123",
      binaryBuffer: dummyBuffer,
      targetGoogleMime: GOOGLE_MIME_SHEET,
      sourceMime: OPENXML_MIME_XLSX,
      accessToken: "mock_token",
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Project — Ledger");

    const created = mockDriveFiles.find((f) => f.id === result.id);
    expect(created?.mimeType).toBe(GOOGLE_MIME_SHEET);
  });

  it("seeds complete project workspace with 4 converted master templates", async () => {
    const workspace = await seedTemplates({
      projectId: "proj_feature_film",
      projectName: "The Silent Take",
      accessToken: "mock_token",
    });

    expect(workspace.rootFolderId).toBeDefined();
    expect(workspace.projectFolderId).toBeDefined();
    expect(workspace.syncFolderId).toBeDefined();

    expect(workspace.files.ledger.id).toBeDefined();
    expect(workspace.files.ledger.name).toContain("Master Ledger");

    expect(workspace.files.budget.id).toBeDefined();
    expect(workspace.files.budget.name).toContain("Budget Plan");

    expect(workspace.files.shotList.id).toBeDefined();
    expect(workspace.files.shotList.name).toContain("Shot List");

    expect(workspace.files.callSheet.id).toBeDefined();
    expect(workspace.files.callSheet.name).toContain("Call Sheet");

    // Total files in mock Drive: 3 folders + 4 documents = 7 files
    expect(mockDriveFiles).toHaveLength(7);
  });
});
