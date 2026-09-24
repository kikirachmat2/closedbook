"use client";

import { useContext, useCallback } from "react";
import { PreferencesContext } from "@/lib/preferences";

export type HapticPattern = "light" | "medium" | "heavy" | "success";

const HAPTIC_VIBRATIONS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
};

/**
 * useHaptic - Cross-platform tactile haptic feedback hook.
 * Conforms to Fitts & Doherty interaction ergonomics.
 *
 * Patterns:
 * - light (10ms): button tap, tab switch
 * - medium (20ms): FAB tap, confirm action
 * - heavy (30ms): error state, delete confirmation
 * - success ([10, 50, 10]ms): transaction successfully recorded
 *
 * Gracefully no-ops when:
 * 1. navigator.vibrate is unsupported (e.g. WebKit / iOS Safari)
 * 2. User has toggled haptics OFF in Preferences
 */
export function useHaptic() {
  const preferences = useContext(PreferencesContext);
  const isHapticsEnabled = preferences ? preferences.isHapticsEnabled : true;

  const triggerHaptic = useCallback(
    (pattern: HapticPattern = "light") => {
      if (!isHapticsEnabled) return;
      if (typeof window === "undefined" || typeof navigator === "undefined") return;

      try {
        if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
          navigator.vibrate(HAPTIC_VIBRATIONS[pattern]);
        }
      } catch {
        // Fallback: silent execution for restricted or unsupported browser sandboxes
      }
    },
    [isHapticsEnabled]
  );

  return { triggerHaptic };
}
