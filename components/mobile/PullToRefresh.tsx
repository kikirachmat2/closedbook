"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { m } from "@/components/MotionProvider";
import { useHaptic } from "@/lib/hooks/use-haptic";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 60; // 60px threshold
const MAX_PULL = 110;

/**
 * PullToRefresh — Mobile pull-to-refresh interaction conforming to Jakob's Law:
 * - Threshold: 60px pull triggers sync
 * - Resistance: rubber-band damping (0.5× resistance past 60px)
 * - Spinner: rotates dynamically with pull distance (0 - 360deg)
 * - Motion: 220ms spring return (--cb-motion-slide)
 * - Haptic: light tactile bump upon threshold cross
 */
export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const { triggerHaptic } = useHaptic();
  const shouldReduceMotion = useReducedMotion();
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 2) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      // Calculate rubber-band resistance
      let calculatedPull = 0;
      if (deltaY <= THRESHOLD) {
        calculatedPull = deltaY;
      } else {
        calculatedPull = THRESHOLD + (deltaY - THRESHOLD) * 0.5;
      }

      calculatedPull = Math.min(calculatedPull, MAX_PULL);
      setPullY(calculatedPull);

      // Trigger haptic bump once upon crossing threshold
      if (calculatedPull >= THRESHOLD && !hasTriggeredHaptic.current) {
        triggerHaptic("light");
        hasTriggeredHaptic.current = true;
      } else if (calculatedPull < THRESHOLD && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullY >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(48); // Hold at indicator position
      triggerHaptic("medium");

      try {
        await Promise.resolve(onRefresh());
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 350);
      }
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, disabled, onRefresh, triggerHaptic]);

  // Handle pull release if touch canceled
  useEffect(() => {
    const handleTouchCancel = () => {
      isPulling.current = false;
      setPullY(0);
    };
    window.addEventListener("touchcancel", handleTouchCancel);
    return () => window.removeEventListener("touchcancel", handleTouchCancel);
  }, []);

  const rotation = Math.min((pullY / THRESHOLD) * 360, 360);
  const indicatorOpacity = Math.min(pullY / 30, 1);

  return (
    <div
      ref={containerRef}
      data-testid="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* Pull Indicator Area */}
      <div
        data-testid="pull-indicator"
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-20"
        style={{
          height: `${pullY}px`,
          opacity: indicatorOpacity,
          transform: `translateY(${Math.max(pullY - 48, 0)}px)`,
          transition: isPulling.current ? "none" : "all 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-9 h-9 rounded-full bg-[#181818] border border-white/[0.12] shadow-lg flex items-center justify-center text-[var(--color-primary,#ff1e42)]">
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isPulling.current ? "none" : "transform 220ms ease-out",
            }}
          />
        </div>
      </div>

      {/* Content wrapper with elastic translation */}
      <m.div
        animate={{ y: pullY > 0 ? pullY * 0.4 : 0 }}
        transition={
          isPulling.current
            ? { duration: 0 }
            : shouldReduceMotion
            ? { duration: 0.001 }
            : { type: "spring", damping: 25, stiffness: 300 }
        }
      >
        {children}
      </m.div>
    </div>
  );
}
