"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "rounded-[var(--cb-radius-surface)] border border-[var(--cb-border)] p-4 sm:p-6 transition-all duration-quick ease-default";

    const variantStyles = {
      default: "bg-[var(--cb-surface)]",
      elevated: "bg-[var(--cb-surface-elevated)] border-[var(--cb-border)]",
      interactive:
        "bg-[var(--cb-surface)] hover:border-white/20 hover:bg-[var(--cb-surface-elevated)] cursor-pointer active:scale-[0.99]",
    };

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
