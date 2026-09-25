// =========================================================================
// CLOSEDBOOK PRODUCTION OS — BACKGROUND SYNC REGISTRATION (G.2)
// =========================================================================

import { syncOrchestrator } from "./engine";

export const BACKGROUND_SYNC_TAG = "closedbook-flush-mutations";

/**
 * Registers a Background Sync event with the Service Worker when offline mutations are queued.
 * Falls back gracefully to visibilitychange / online events when the SyncManager API is unsupported (e.g. iOS Safari).
 */
export async function requestBackgroundSync(
  tag: string = BACKGROUND_SYNC_TAG
): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration && typeof (registration as any).sync.register === "function") {
      await (registration as any).sync.register(tag);
      return true;
    }
  } catch (err) {
    console.warn("[BackgroundSync] Registration error:", err);
  }

  return false;
}

/**
 * Initializes client-side listener for Service Worker background sync triggers.
 */
export function initBackgroundSyncListener(): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === "TRIGGER_BACKGROUND_FLUSH") {
      syncOrchestrator.triggerAutoFlush();
    }
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}
