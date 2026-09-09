"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white/[0.04] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent ${className}`}
    />
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 4-KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-panel p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
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

      {/* Department Breakdown Skeleton */}
      <div className="surface-panel p-5 sm:p-6 space-y-4">
        <div className="flex justify-between pb-4 border-b border-white/[0.06]">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
