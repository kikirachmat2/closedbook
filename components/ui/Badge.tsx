"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "crimson" | "success" | "warning" | "error" | "outline";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center px-2.5 py-0.5 rounded-[var(--cb-radius-pill)] text-[11px] font-semibold leading-[14px] tracking-[0.02em] select-none font-body";

    const variantStyles = {
      default: "bg-white/[0.08] text-[var(--cb-text-secondary)] border border-white/[0.06]",
      crimson: "bg-[var(--cb-crimson)]/15 text-[var(--cb-crimson)] border border-[var(--cb-crimson)]/30",
      success: "bg-[var(--cb-success)]/15 text-[var(--cb-success)] border border-[var(--cb-success)]/30",
      warning: "bg-[var(--cb-warning)]/15 text-[var(--cb-warning)] border border-[var(--cb-warning)]/30",
      error: "bg-[var(--cb-error)]/15 text-[var(--cb-error)] border border-[var(--cb-error)]/30",
      outline: "bg-transparent text-[var(--cb-text-tertiary)] border border-[var(--cb-border)]",
    };

    return (
      <span
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
