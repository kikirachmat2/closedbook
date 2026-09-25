// =========================================================================
// CLOSEDBOOK PRODUCTION OS — CENTRAL FEATURE FLAGS
// =========================================================================

export interface FeatureFlags {
  USE_YJS_CRDT: boolean;
  USE_DEXIE_STORAGE: boolean;
  USE_DEXIE_READ: boolean;
  USE_WEBAUTHN_CONFIRMATION: boolean;
  USE_INNGEST_QUEUE: boolean;
  USE_HYBRID_CSP: boolean;
  ENABLE_ANONYMOUS_TELEMETRY: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  USE_YJS_CRDT: true,
  USE_DEXIE_STORAGE: true,
  USE_DEXIE_READ: true,
  USE_WEBAUTHN_CONFIRMATION: false, // Activated in G.8
  USE_INNGEST_QUEUE: false, // Activated in G.1/G.6
  USE_HYBRID_CSP: true,
  ENABLE_ANONYMOUS_TELEMETRY: false, // Default OFF per ADR-006
};

/**
 * Checks whether a feature flag is enabled, supporting query parameter overrides
 * in browser environments (e.g. ?flag_yjs=false) for testing and staged rollout.
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  if (typeof window !== "undefined") {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryKey = `flag_${flag.toLowerCase()}`;
      if (searchParams.has(queryKey)) {
        return searchParams.get(queryKey) === "true";
      }

      // Local storage override
      const localOverride = localStorage.getItem(`cb_flag_${flag}`);
      if (localOverride !== null) {
        return localOverride === "true";
      }
    } catch {
      // Fallback to default on parsing error
    }
  }

  // Environment variable override
  const envKey = `NEXT_PUBLIC_FLAG_${flag}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === "true";
  }

  return DEFAULT_FLAGS[flag];
}
