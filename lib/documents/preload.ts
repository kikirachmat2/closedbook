// CLOSEDBOOK PRODUCTION OS — IDLE PRELOADER FOR DOCUMENT GENERATORS
/**
 * Preloads heavy document generator chunks (exceljs / docx) in the background
 * during browser idle periods (requestIdleCallback) without impacting initial FCP/LCP.
 * Ensures zero lag for mobile 3G users on film locations.
 */
export function preloadDocumentGenerators(): void {
  if (typeof window === "undefined") return;

  const performPreload = () => {
    try {
      // Background idle preload of dynamic generator modules
      import("./generators/ledger-generator").catch(() => {});
      import("./generators/call-sheet-generator").catch(() => {});
    } catch {
      // Non-blocking silent fallback
    }
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(performPreload, { timeout: 4000 });
  } else {
    setTimeout(performPreload, 2500);
  }
}
