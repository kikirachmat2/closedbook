"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", isError = false, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        aria-invalid={isError ? "true" : undefined}
        className={twMerge(
          clsx(
            "w-full min-h-[44px] px-3.5 py-2.5 rounded-[var(--cb-radius-inner)] bg-[var(--cb-surface)] text-[var(--cb-text-primary)] placeholder-[var(--cb-text-tertiary)] border border-[var(--cb-border)] text-[16px] leading-[1.375rem] transition-colors duration-quick ease-default cb-focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
            isError && "border-[var(--cb-error)] focus-visible:ring-[var(--cb-error)]",
            className
          )
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
