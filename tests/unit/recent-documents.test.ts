import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveRecentDocument,
  getRecentDocuments,
  deleteRecentDocument,
} from "@/lib/documents/recent";
import { db } from "@/lib/db/schema";

describe("Recent Documents Dexie Store (T3.4)", () => {
  beforeEach(async () => {
    await db.documents_generated.clear();
  });

  it("saves a new generated document record and retrieves it sorted by date", async () => {
    const doc1 = {
      id: "doc-ledger-1.xlsx",
      projectId: "proj-quiet-horizon",
      type: "ledger" as const,
      title: "Buku Kas Produksi",
      filename: "Buku_Kas_proj-quiet-horizon_2026-09-26.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 24500,
      generatedAt: "2026-09-26T08:00:00.000Z",
    };

    const doc2 = {
      id: "doc-call-sheet-2.docx",
      projectId: "proj-quiet-horizon",
      type: "call-sheet" as const,
      title: "Call Sheet Harian",
      filename: "Call_Sheet_proj-quiet-horizon_2026-09-26.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 18200,
      generatedAt: "2026-09-26T09:30:00.000Z",
    };

    await saveRecentDocument(doc1);
    await saveRecentDocument(doc2);

    const recents = await getRecentDocuments("proj-quiet-horizon");
    expect(recents).toHaveLength(2);
    // doc2 should be first because it was generated at 09:30 vs 08:00
    expect(recents[0].id).toBe("doc-call-sheet-2.docx");
    expect(recents[0].title).toBe("Call Sheet Harian");
    expect(recents[1].id).toBe("doc-ledger-1.xlsx");
  });

  it("supports deleting a recent document by id", async () => {
    const doc = {
      id: "doc-delete-me.xlsx",
      projectId: "proj-test",
      type: "wrap-report" as const,
      title: "Laporan Wrap Harian",
      filename: "Wrap_Report.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 15400,
      generatedAt: new Date().toISOString(),
    };

    await saveRecentDocument(doc);
    let list = await getRecentDocuments("proj-test");
    expect(list).toHaveLength(1);

    await deleteRecentDocument("doc-delete-me.xlsx");
    list = await getRecentDocuments("proj-test");
    expect(list).toHaveLength(0);
  });
});
