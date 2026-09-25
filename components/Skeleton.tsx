"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface SkeletonProps {
  className?: string;
  shape?: "rectangle" | "circle" | "pill";
}

/**
 * Skeleton — Obsidian Canvas shimmer loading placeholder conforming to Doherty Threshold (< 400ms instant feeling).
 * Shimmer gradient: canvas -> surface-elevated -> canvas (1.5s ease-in-out infinite).
 * Reduced-motion: static block, no animation.
 */
export function Skeleton({ className = "", shape = "rectangle" }: SkeletonProps) {
  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "pill"
      ? "rounded-full"
      : "rounded-lg";

  return (
    <div
      data-testid="skeleton-element"
      className={`cb-skeleton-shimmer ${shapeClass} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * DohertySpinner — Appears only when operation duration exceeds 400ms (Doherty lag threshold).
 */
export function DohertySpinner({
  delayMs = 400,
  label = "Loading...",
  className = "",
}: {
  delayMs?: number;
  label?: string;
  className?: string;
}) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShouldShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!shouldShow) return null;

  return (
    <div
      data-testid="doherty-spinner"
      className={`inline-flex items-center gap-2 text-xs text-[var(--color-stone,#737373)] animate-in fade-in duration-150 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 text-[var(--color-primary,#ff1e42)] animate-spin" />
      <span>{label}</span>
    </div>
  );
}

/**
 * WorkspaceSkeleton — Progressive 2-phase skeleton:
 * Phase 1: Metadata & KPI metrics (< 200ms)
 * Phase 2: Transaction & task items
 */
export function WorkspaceSkeleton() {
  return (
    <div
      data-testid="workspace-skeleton"
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
    >
      {/* Phase 1: Metadata & 4-KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-panel p-5 space-y-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Burn Rate Forecast Skeleton */}
      <div className="rounded-2xl border border-white/[0.06] p-5 surface-panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-3 w-24 ml-auto" />
            <Skeleton className="h-8 w-16 ml-auto" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Phase 2: List / Table Skeleton */}
      <div className="surface-panel p-5 sm:p-6 space-y-4">
        <div className="flex justify-between pb-4 border-b border-white/[0.06]">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
