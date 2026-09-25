"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Menu, X, CheckSquare } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface SelectionModeConfig {
  isActive: boolean;
  selectedCount: number;
  onCancel: () => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

export interface TopAppBarProps {
  title: string;
  isRoot?: boolean;
  onBack?: () => void;
  onMenuToggle?: () => void;
  actions?: React.ReactNode; // Max 2 action buttons (Hick's Law)
  selectionMode?: SelectionModeConfig;
}

/**
 * TopAppBar — Mobile Header with Scroll-Hide Behavior (Jakob's Law & Progressive Disclosure).
 * - Height: 48px + safe-area-inset-top
 * - Left: Back navigation (non-root) or Menu / Brand context (root)
 * - Center: H1 20px title with single-line ellipsis
 * - Right: Max 2 action icons (Hick's Law constraint)
 * - Scroll behavior:
 *   - Scroll down > 100px hides (translateY -100%)
 *   - Scroll up > 50px reveals (translateY 0)
 *   - At top: fully visible with shadow-free border
 *   - Motion: 220ms slide (--cb-motion-slide / --cb-motion-normal)
 */
export default function TopAppBar({
  title,
  isRoot = true,
  onBack,
  onMenuToggle,
  actions,
  selectionMode,
}: TopAppBarProps) {
  const { triggerHaptic } = useHaptic();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const delta = currentScrollY - lastScrollY.current;

      setIsScrolled(currentScrollY > 10);

      // At top of page: always visible
      if (currentScrollY <= 20) {
        setIsVisible(true);
        accumulatedDelta.current = 0;
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling Down
      if (delta > 0) {
        if (accumulatedDelta.current < 0) accumulatedDelta.current = 0;
        accumulatedDelta.current += delta;

        // Hide threshold: scrolled down > 100px
        if (currentScrollY > 100 && accumulatedDelta.current > 40) {
          setIsVisible(false);
        }
      }
      // Scrolling Up
      else {
        if (accumulatedDelta.current > 0) accumulatedDelta.current = 0;
        accumulatedDelta.current += delta;

        // Reveal threshold: scrolled up > 50px
        if (Math.abs(accumulatedDelta.current) > 50) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackClick = () => {
    triggerHaptic("light");
    if (onBack) onBack();
  };

  const handleMenuClick = () => {
    triggerHaptic("light");
    if (onMenuToggle) onMenuToggle();
  };

  // Selection mode view
  if (selectionMode?.isActive) {
    return (
      <header
        id="mobile-top-app-bar"
        role="banner"
        aria-label="Selection Mode App Bar"
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[var(--color-primary,#ff1e42)]/30 pt-[env(safe-area-inset-top,0px)]"
      >
        <div className="flex items-center justify-between h-12 px-3 max-w-lg mx-auto">
          <button
            type="button"
            id="selection-cancel-btn"
            data-testid="selection-cancel-btn"
            onClick={() => {
              triggerHaptic("light");
              selectionMode.onCancel();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#a3a3a3] hover:text-white rounded-full transition-colors active:scale-95"
            aria-label="Batalkan pilihan"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center px-2">
            <span
              data-testid="selection-count-label"
              className="text-sm font-semibold text-[var(--color-paper,#fdfdfd)]"
            >
              {selectionMode.selectedCount} dipilih
            </span>
          </div>

          <button
            type="button"
            id="selection-select-all-btn"
            data-testid="selection-select-all-btn"
            onClick={() => {
              triggerHaptic("light");
              selectionMode.onSelectAll?.();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-primary,#ff1e42)] hover:text-white rounded-full transition-colors active:scale-95"
            aria-label="Pilih semua"
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      id="mobile-top-app-bar"
      role="banner"
      aria-label="Top Mobile App Bar"
      className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-[#070707]/90 backdrop-blur-xl border-b border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-transform duration-[220ms] ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${isScrolled ? "shadow-lg shadow-black/50" : ""}`}
    >
      <div className="flex items-center justify-between h-12 px-3 max-w-lg mx-auto">
        {/* Left: Contextual Action */}
        <div className="flex items-center min-w-[44px]">
          {!isRoot ? (
            <button
              type="button"
              id="top-bar-back-btn"
              onClick={handleBackClick}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-stone,#737373)] hover:text-white rounded-full transition-colors active:scale-95"
              aria-label="Navigate back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              id="top-bar-menu-btn"
              onClick={handleMenuClick}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-stone,#737373)] hover:text-white rounded-full transition-colors active:scale-95"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center: Title (20px H1, single-line ellipsis) */}
        <div className="flex-1 text-center px-2 overflow-hidden">
          <h1 className="text-base font-semibold text-[var(--color-paper,#fdfdfd)] truncate leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right: Actions (Max 2 per Hick's Law) */}
        <div className="flex items-center justify-end gap-1 min-w-[44px]">
          {actions}
        </div>
      </div>
    </header>
  );
}
