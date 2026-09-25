"use client";

import React, { forwardRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info";
  message: string;
  description?: string;
  onClose?: () => void;
  duration?: number;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = "info",
      message,
      description,
      onClose,
      duration = 4000,
      ...props
    },
    ref
  ) => {
    useEffect(() => {
      if (duration && onClose) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    const icons = {
      success: <CheckCircle2 className="w-4 h-4 text-[var(--cb-success)] shrink-0" />,
      error: <AlertCircle className="w-4 h-4 text-[var(--cb-error)] shrink-0" />,
      warning: <AlertTriangle className="w-4 h-4 text-[var(--cb-warning)] shrink-0" />,
      info: <Info className="w-4 h-4 text-[var(--cb-crimson)] shrink-0" />,
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={twMerge(
          clsx(
            "flex items-start gap-3 p-3.5 rounded-[var(--cb-radius-surface)] bg-[var(--cb-surface-elevated)] border border-[var(--cb-border)] max-w-sm w-full animate-in fade-in slide-in-from-bottom-2 duration-quick",
            className
          )
        )}
        {...props}
      >
        <div className="mt-0.5">{icons[variant]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium leading-[18px] text-[var(--cb-text-primary)]">
            {message}
          </div>
          {description && (
            <div className="text-[12px] leading-[16px] text-[var(--cb-text-secondary)] mt-0.5">
              {description}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="text-[var(--cb-text-tertiary)] hover:text-[var(--cb-text-primary)] transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = "Toast";
