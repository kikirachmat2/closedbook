"use client";

import React, { forwardRef, useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  ({ isOpen, onClose, title, children, className, ...props }, ref) => {
    // ESC key dismissal
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title || "Bottom Sheet"}
          onClick={(e) => e.stopPropagation()}
          className={twMerge(
            clsx(
              "w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--cb-surface-elevated)] border-t border-[var(--cb-border)] rounded-t-[20px] p-6 pb-[max(var(--cb-safe-bottom),24px)] flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 ease-default shadow-none",
              className
            )
          )}
          {...props}
        >
          {/* Top Grab Handle */}
          <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto -mt-2 mb-2" />

          {/* Header */}
          <div className="flex items-center justify-between">
            {title && (
              <h2 className="text-[1.25rem] font-semibold text-[var(--cb-text-primary)] font-body">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup sheet"
              className="cb-btn-icon ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  }
);

Sheet.displayName = "Sheet";
