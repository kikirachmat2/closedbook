// CLOSEDBOOK PRODUCTION OS — DOCUMENT GENERATION WORKER CLIENT
import { generateDocument } from "../index";
import type {
  DocumentGeneratorInput,
  DocumentTemplateType,
  GeneratedDocument,
  DocumentGenerationProgress,
} from "../types";

export interface GenerateAsyncOptions {
  onProgress?: (progress: DocumentGenerationProgress) => void;
  timeoutMs?: number;
}

/**
 * Compiles a document asynchronously with progress tracking and timeout protection.
 * Automatically delegates heavy binary work to a dedicated Web Worker when supported,
 * and falls back to main-thread async execution with simulated progress in unsupported
 * environments (e.g. SSR, test environments).
 */
export async function generateDocumentWithProgress(
  templateType: DocumentTemplateType,
  input: DocumentGeneratorInput,
  options: GenerateAsyncOptions = {}
): Promise<GeneratedDocument> {
  const { onProgress, timeoutMs = 20000 } = options;
  const requestId = Math.random().toString(36).substring(2);

  // Initial stage notification
  onProgress?.({
    stage: "downloading",
    percent: 15,
    message: "Menyiapkan modul penyusun...",
  });

  // Check if Web Worker is available in the current browser runtime
  const isVitest = typeof process !== "undefined" && Boolean(process.env?.VITEST);
  const hasWorkerSupport =
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    !isVitest;

  if (!hasWorkerSupport) {
    return runMainThreadFallback(templateType, input, onProgress);
  }

  return new Promise<GeneratedDocument>((resolve, reject) => {
    let worker: Worker | null = null;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Batas waktu pembuatan dokumen terlampaui (${Math.round(
            timeoutMs / 1000
          )} detik). Silakan coba lagi.`
        )
      );
    }, timeoutMs);

    try {
      worker = new Worker(new URL("./document.worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (data.id !== requestId) return;

        if (data.type === "progress") {
          onProgress?.({
            stage: data.stage,
            percent: data.percent,
            message: data.message,
          });
        } else if (data.type === "success") {
          cleanup();
          resolve(data.result);
        } else if (data.type === "error") {
          cleanup();
          reject(new Error(data.error));
        }
      };

      worker.onerror = (err) => {
        console.warn("Web Worker error encountered, falling back to main thread:", err);
        cleanup();
        runMainThreadFallback(templateType, input, onProgress).then(resolve).catch(reject);
      };

      worker.postMessage({
        id: requestId,
        templateType,
        input,
      });
    } catch (workerErr) {
      console.warn("Failed to initialize Web Worker, falling back to main thread:", workerErr);
      cleanup();
      runMainThreadFallback(templateType, input, onProgress).then(resolve).catch(reject);
    }
  });
}

async function runMainThreadFallback(
  templateType: DocumentTemplateType,
  input: DocumentGeneratorInput,
  onProgress?: (progress: DocumentGenerationProgress) => void
): Promise<GeneratedDocument> {
  onProgress?.({
    stage: "downloading",
    percent: 30,
    message: "Mengunduh modul biner...",
  });

  await new Promise((r) => setTimeout(r, 60));

  onProgress?.({
    stage: "compiling",
    percent: 75,
    message: "Menyusun lembar kerja & formula...",
  });

  const doc = await generateDocument(templateType, input);

  onProgress?.({
    stage: "finalizing",
    percent: 100,
    message: "Memfinalisasi berkas biner...",
  });

  return doc;
}
