// CLOSEDBOOK PRODUCTION OS — DOCUMENT GENERATION WEB WORKER
// Offloads heavy binary compilation (exceljs/docx) from main UI thread

import { generateDocument } from "../index";
import type { DocumentGeneratorInput, DocumentTemplateType } from "../types";

/* eslint-disable no-restricted-globals */
self.addEventListener("message", async (event: MessageEvent) => {
  const { id, templateType, input } = event.data;

  try {
    self.postMessage({
      type: "progress",
      id,
      stage: "downloading",
      percent: 30,
      message: "Mengunduh modul biner...",
    });

    self.postMessage({
      type: "progress",
      id,
      stage: "compiling",
      percent: 75,
      message: "Menyusun lembar kerja & formula...",
    });

    const result = await generateDocument(
      templateType as DocumentTemplateType,
      input as DocumentGeneratorInput
    );

    self.postMessage({
      type: "progress",
      id,
      stage: "finalizing",
      percent: 98,
      message: "Memfinalisasi berkas biner...",
    });

    (self as any).postMessage(
      {
        type: "success",
        id,
        result: {
          filename: result.filename,
          mimeType: result.mimeType,
          buffer: result.buffer,
          metadata: result.metadata,
        },
      },
      [result.buffer.buffer] // Transfer buffer memory ownership
    );
  } catch (err: any) {
    self.postMessage({
      type: "error",
      id,
      error: err?.message || String(err),
    });
  }
});
