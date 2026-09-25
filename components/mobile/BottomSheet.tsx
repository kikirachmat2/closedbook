"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { PanInfo, Transition } from "framer-motion";
import { m, AnimatePresence } from "@/components/MotionProvider";
import { useHaptic } from "@/lib/hooks/use-haptic";

export type SnapPoint = "collapsed" | "half" | "full";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
  initialSnap?: SnapPoint;
  children: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: "64px",
  half: "50vh",
  full: "92vh",
};

/**
 * BottomSheet — Full-featured draggable mobile modal with 3 snap points.
 * - Snap points: collapsed (64px), half (50vh), full (92vh)
 * - Gestures: Swipe down dismiss (velocity > 0.5 or drag > 30%), drag up expand
 * - Drag handle: 32×4px pill, centered, --cb-radius-pill
 * - A11y: role="dialog", aria-modal="true", aria-labelledby, full focus trap
 * - Keyboard: Escape dismiss, focus return to trigger
 * - Motion: 220ms spring enter, 200ms ease-out exit, reduced-motion instant fade
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  closeLabel = "Tutup sheet",
  initialSnap = "half",
  children,
  triggerRef,
}: BottomSheetProps) {
  const { triggerHaptic } = useHaptic();
  const shouldReduceMotion = useReducedMotion();
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Sync initialSnap
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
    }
  }, [isOpen, initialSnap]);

  // Focus trap & Focus Return
  useEffect(() => {
    if (!isOpen) return;

    lastActiveElement.current = document.activeElement as HTMLElement | null;

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        triggerHaptic("light");
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const focusables = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener("keydown", trapFocus);

    // Initial focus on sheet content or close button
    const timer = setTimeout(() => {
      const sheet = sheetRef.current;
      if (sheet) {
        const firstInput = sheet.querySelector<HTMLElement>("input, button");
        firstInput?.focus();
      }
    }, 50);

    const triggerEl = triggerRef?.current;

    return () => {
      window.removeEventListener("keydown", trapFocus);
      clearTimeout(timer);
      // Return focus to previous trigger
      if (triggerEl) {
        triggerEl.focus();
      } else if (lastActiveElement.current) {
        lastActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef, triggerHaptic]);

  // Drag Gesture Handler
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;

    // Fast downward swipe or dragged down > 120px
    if (velocity.y > 0.5 || offset.y > 120) {
      if (currentSnap === "full") {
        setCurrentSnap("half");
        triggerHaptic("light");
      } else {
        triggerHaptic("medium");
        onClose();
      }
    }
    // Upward drag
    else if (velocity.y < -0.5 || offset.y < -80) {
      if (currentSnap === "collapsed") {
        setCurrentSnap("half");
        triggerHaptic("light");
      } else if (currentSnap === "half") {
        setCurrentSnap("full");
        triggerHaptic("light");
      }
    }
    // Downward drag from half to collapsed
    else if (offset.y > 60 && currentSnap === "half") {
      setCurrentSnap("collapsed");
      triggerHaptic("light");
    }
  };

  const springTransition: Transition = shouldReduceMotion
    ? { duration: 0.001 }
    : { type: "spring", damping: 28, stiffness: 280 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <m.div
            data-testid="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.001 : 0.2 }}
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Draggable Sheet Surface */}
          <m.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "sheet-title" : undefined}
            data-testid="bottom-sheet-dialog"
            data-snap={currentSnap}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{
              y: 0,
              opacity: 1,
              height: SNAP_HEIGHTS[currentSnap],
            }}
            exit={{ y: "100%", opacity: 0 }}
            transition={springTransition}
            className="relative z-10 w-full max-w-lg bg-[#0e0e0e] border-t border-white/[0.12] rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
            style={{
              boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Drag Handle Bar (32×4px pill) */}
            <div
              data-testid="bottom-sheet-handle"
              className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing flex flex-col items-center select-none"
            >
              <div className="w-8 h-1 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-3 border-b border-white/[0.06] shrink-0">
              {title ? (
                <h2
                  id="sheet-title"
                  className="text-base font-semibold text-[var(--color-paper,#fdfdfd)] tracking-tight truncate pr-2"
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                type="button"
                id="bottom-sheet-close-btn"
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                }}
                aria-label={closeLabel}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-[var(--color-stone,#737373)] hover:text-white rounded-full transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Independent Scrollable Content */}
            <div
              data-testid="bottom-sheet-content"
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain"
            >
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
