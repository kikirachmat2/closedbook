"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "pill";
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangle", ...props }, ref) => {
    const variantStyles = {
      rectangle: "rounded-[var(--cb-radius-inner)]",
      circle: "rounded-full",
      pill: "rounded-[var(--cb-radius-pill)]",
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={twMerge(
          clsx(
            "animate-pulse bg-white/[0.05] border border-white/[0.03]",
            variantStyles[variant],
            className
          )
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
