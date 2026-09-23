// =========================================================================
// CLOSEDBOOK PRODUCTION OS — 4-LAYER ERROR HANDLERS (ADR-006)
// =========================================================================

import { logLocalError } from "@/lib/db/error-log";

export type SystemSubsystem = "ai" | "queue" | "drive" | "sw" | "general";

export interface GracefulDegradationAction {
  subsystem: SystemSubsystem;
  fallbackMode: string;
  userMessage: string;
  retryAllowed: boolean;
}

/**
 * Resolves 4-layer graceful degradation response based on the failing subsystem.
 */
export async function handleSystemDegradation(
  subsystem: SystemSubsystem,
  error: unknown
): Promise<GracefulDegradationAction> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // 1. Log error locally to Dexie (zero-server-retention)
  await logLocalError({
    level: "warn",
    message: `[${subsystem.toUpperCase()} Degradation]: ${errorMessage}`,
    stack: errorStack,
    context: { subsystem },
  });

  // 2. Resolve graceful degradation strategy
  switch (subsystem) {
    case "ai":
      return {
        subsystem: "ai",
        fallbackMode: "manual_form_entry",
        userMessage: "Asisten AI sementara offline. Mengalihkan ke formulir manual.",
        retryAllowed: true,
      };

    case "queue":
      return {
        subsystem: "queue",
        fallbackMode: "direct_synchronous_execution",
        userMessage: "Antrean cloud dialihkan ke eksekusi langsung.",
        retryAllowed: true,
      };

    case "drive":
      return {
        subsystem: "drive",
        fallbackMode: "offline_dexie_buffer",
        userMessage: "Sinkronisasi Google Drive tertunda. Data disimpan aman di perangkat lokal.",
        retryAllowed: true,
      };

    case "sw":
      return {
        subsystem: "sw",
        fallbackMode: "standard_web_runtime",
        userMessage: "PWA Service Worker tidak aktif. Berjalan dalam mode web standar.",
        retryAllowed: false,
      };

    default:
      return {
        subsystem: "general",
        fallbackMode: "safe_mode",
        userMessage: "Terjadi kendala sistem. Silakan muat ulang halaman.",
        retryAllowed: true,
      };
  }
}
