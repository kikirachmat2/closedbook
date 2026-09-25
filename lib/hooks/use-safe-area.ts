"use client";

import { useState, useEffect } from "react";

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

/**
 * useSafeArea: Hook to measure iOS notch/island safe areas and handle virtual keyboard adjustments
 * via window.visualViewport API.
 */
export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Helper to extract computed pixel value from CSS environment variable or test element
    const updateInsets = () => {
      // 1. Safe Area Insets computation
      const testEl = document.createElement("div");
      testEl.style.position = "fixed";
      testEl.style.top = "env(safe-area-inset-top, 0px)";
      testEl.style.bottom = "env(safe-area-inset-bottom, 0px)";
      testEl.style.left = "env(safe-area-inset-left, 0px)";
      testEl.style.right = "env(safe-area-inset-right, 0px)";
      testEl.style.visibility = "hidden";
      testEl.style.pointerEvents = "none";
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const top = parseFloat(computed.top) || 0;
      const bottom = parseFloat(computed.bottom) || 0;
      const left = parseFloat(computed.left) || 0;
      const right = parseFloat(computed.right) || 0;

      document.body.removeChild(testEl);

      // 2. iOS Visual Viewport Keyboard Adjustment
      let keyboardHeight = 0;
      let isKeyboardOpen = false;

      if (window.visualViewport) {
        const layoutHeight = window.innerHeight;
        const visualHeight = window.visualViewport.height;
        const diff = layoutHeight - visualHeight;

        // If viewport height shrink exceeds 140px, virtual keyboard is active
        if (diff > 140) {
          keyboardHeight = diff;
          isKeyboardOpen = true;
        }
      }

      setInsets({
        top,
        bottom,
        left,
        right,
        keyboardHeight,
        isKeyboardOpen,
      });
    };

    updateInsets();

    // Listen to resize and visualViewport changes
    window.addEventListener("resize", updateInsets);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateInsets);
      window.visualViewport.addEventListener("scroll", updateInsets);
    }

    return () => {
      window.removeEventListener("resize", updateInsets);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateInsets);
        window.visualViewport.removeEventListener("scroll", updateInsets);
      }
    };
  }, []);

  return insets;
}
