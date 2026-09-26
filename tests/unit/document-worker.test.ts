import { describe, it, expect, vi } from "vitest";
import { generateDocumentWithProgress } from "@/lib/documents/worker/worker-client";
import { preloadDocumentGenerators } from "@/lib/documents/preload";
import type { DocumentGenerationProgress } from "@/lib/documents/types";

describe("Document Worker & Progress Engine (A2 UX Mitigation)", () => {
  it("generates document and notifies progress stages sequentially", async () => {
    const progressUpdates: DocumentGenerationProgress[] = [];

    const result = await generateDocumentWithProgress(
      "ledger",
      {
        projectId: "proj-progress-test",
        data: {
          projectName: "Progress Verification Film",
          entries: [
            {
              date: "2026-09-26",
              description: "Camera Package Rental",
              category: "Camera",
              amount: 1500,
            },
          ],
        },
      },
      {
        onProgress: (p) => progressUpdates.push(p),
      }
    );

    expect(result).toBeDefined();
    expect(result.filename).toContain("Buku_Kas_proj-progress-test");
    expect(result.buffer.byteLength).toBeGreaterThan(0);

    // Verify sequential progress reporting
    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect(progressUpdates[0].stage).toBe("downloading");
    expect(progressUpdates[progressUpdates.length - 1].stage).toBe("finalizing");
    expect(progressUpdates[progressUpdates.length - 1].percent).toBe(100);
  });

  it("handles preloadDocumentGenerators gracefully without throwing", () => {
    expect(() => preloadDocumentGenerators()).not.toThrow();
  });
});
