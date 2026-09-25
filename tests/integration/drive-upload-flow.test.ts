// =========================================================================
// CLOSEDBOOK PRODUCTION OS — DRIVE UPLOAD FLOW INTEGRATION TESTS (MSW)
// =========================================================================

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";
import { generateDocument } from "@/lib/documents";

const server = setupServer(...handlers);

describe("Drive Upload Flow Integration (MSW Future-Ready)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("completes full flow: generate ledger document -> mock upload to Drive -> verify webViewLink", async () => {
    // 1. Generate document client-side
    const doc = await generateDocument("ledger", {
      projectId: "proj-shadow",
      data: {
        projectName: "Shadow Protocol",
        entries: [
          {
            date: "2026-09-26",
            description: "Anamorphic Lens Kit",
            category: "Camera",
            amount: 2500,
          },
        ],
      },
    });

    expect(doc.buffer).toBeInstanceOf(Uint8Array);
    expect(doc.metadata.templateType).toBe("ledger");

    // 2. Perform mock upload to Google Drive API
    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: "Bearer mock_access_token_abc123",
        "Content-Type": doc.mimeType,
      },
      body: doc.buffer as unknown as BodyInit,
    });

    expect(uploadRes.status).toBe(200);
    const uploadData = await uploadRes.json();

    // 3. Verify returned file metadata and webViewLink
    expect(uploadData.id).toBe("mock-file-id-12345");
    expect(uploadData.webViewLink).toBe(
      "https://docs.google.com/spreadsheets/d/mock-file-id-12345/edit"
    );

    // 4. Fetch metadata by fileId
    const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}`, {
      headers: {
        Authorization: "Bearer mock_access_token_abc123",
      },
    });

    expect(getRes.status).toBe(200);
    const fileMeta = await getRes.json();
    expect(fileMeta.id).toBe("mock-file-id-12345");
    expect(fileMeta.webViewLink).toContain("mock-file-id-12345");
  });

  it("rejects unauthorized upload without valid Bearer token", async () => {
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  });
});
