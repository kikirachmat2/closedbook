"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";

interface EmptyStateProps {
  icon: React.ElementType;
  headline: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionId?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionId?: string;
  className?: string;
}

/**
 * EmptyState — Peak-End Rule & Aesthetic-Usability Mobile Empty State.
 * - Icon: 48×48px hero icon (--cb-icon-hero / --cb-icon-2xl)
 * - Headline: Display L 30px Instrument Serif (font-serif)
 * - Body: Body M 16px Inter (action-oriented, encouraging tone)
 * - Primary CTA: Electric Crimson button with tactile haptic tap
 */
export default function EmptyState({
  icon: Icon,
  headline,
  body,
  actionLabel,
  onAction,
  actionId,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionId,
  className = "",
}: EmptyStateProps) {
  const { triggerHaptic } = useHaptic();

  const handleAction = () => {
    triggerHaptic("medium");
    onAction?.();
  };

  const handleSecondaryAction = () => {
    triggerHaptic("light");
    onSecondaryAction?.();
  };

  return (
    <div
      data-testid="empty-state-container"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 surface-card border border-white/[0.06] rounded-[24px] max-w-lg mx-auto ${className}`}
    >
      {/* 48px Hero Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary,#ff1e42)]/10 text-[var(--color-primary,#ff1e42)] border border-[var(--color-primary,#ff1e42)]/20 flex items-center justify-center mb-5 shadow-[0_0_24px_rgba(255,30,66,0.15)] shrink-0">
        <Icon className="w-12 h-12 stroke-[1.75]" aria-hidden="true" />
      </div>

      {/* Display L 30px Instrument Serif Headline */}
      <h2 className="font-serif text-[30px] font-normal text-[var(--color-paper,#fdfdfd)] tracking-tight leading-tight mb-2.5">
        {headline}
      </h2>

      {/* Body M 16px Inter Actionable Copy */}
      <p className="text-base text-[var(--color-pearl,#d4d4d4)] leading-relaxed max-w-sm mb-6">
        {body}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {actionLabel && onAction && (
          <button
            type="button"
            id={actionId}
            data-testid="empty-state-primary-cta"
            onClick={handleAction}
            className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-full bg-[var(--color-primary,#ff1e42)] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,30,66,0.35)] hover:shadow-[0_6px_20px_rgba(255,30,66,0.5)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            id={secondaryActionId}
            data-testid="empty-state-secondary-cta"
            onClick={handleSecondaryAction}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-full border border-white/[0.12] text-[var(--color-paper,#fdfdfd)] text-xs font-medium hover:border-white/30 transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
