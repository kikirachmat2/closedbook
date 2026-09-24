"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium font-body select-none cursor-pointer transition-all duration-quick ease-default active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cb-focus-ring";

    const variantStyles = {
      primary: "bg-[var(--cb-crimson)] text-white hover:bg-[var(--cb-crimson-hover)] rounded-[var(--cb-radius-pill)] border border-transparent",
      secondary: "bg-[var(--cb-surface)] text-[var(--cb-text-primary)] hover:bg-[var(--cb-surface-elevated)] hover:border-white/20 rounded-[var(--cb-radius-pill)] border border-[var(--cb-border)]",
      ghost: "bg-transparent text-[var(--cb-text-primary)] hover:bg-white/[0.06] rounded-[var(--cb-radius-pill)] border border-transparent",
      icon: "min-h-[44px] min-w-[44px] p-0 rounded-[var(--cb-radius-inner)] bg-transparent text-[var(--cb-text-secondary)] hover:text-[var(--cb-text-primary)] hover:bg-white/[0.06] border border-transparent",
    };

    const sizeStyles = {
      sm: "min-h-[44px] px-4 text-[15px]",
      default: "min-h-[44px] px-6 text-[16px]", // 16px iOS anti-zoom
      lg: "min-h-[48px] px-8 text-[17px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            baseStyles,
            variantStyles[variant],
            variant !== "icon" ? sizeStyles[size] : "w-[44px] h-[44px]",
            className
          )
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
