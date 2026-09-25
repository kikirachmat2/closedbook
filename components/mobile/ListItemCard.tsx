"use client";

import React, { useRef } from "react";
import { Check, MoreVertical } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";
import { usePreferences, ListDensity } from "@/lib/preferences";

export type ListItemVariant = "default" | "compact" | "urgent" | "selected" | "disabled";

export interface ListItemAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  destructive?: boolean;
  onClick: () => void;
}

export interface ListItemCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  id?: string;
  variant?: ListItemVariant;
  density?: ListDensity;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  metadata?: React.ReactNode;
  amount?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  selected?: boolean;
  onSelectToggle?: () => void;
  onCardClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLongPress?: () => void;
  actions?: ListItemAction[];
  onOpenActions?: () => void;
  children?: React.ReactNode;
}

/**
 * ListItemCard — High-comfort mobile card component adhering to:
 * - Fitts's Law: full 100% card surface tap target
 * - Doherty Threshold: 80ms active feedback (scale 0.99, bg highlight)
 * - Von Restorff Effect: amber border accent for urgent items
 * - WCAG 2.5.7: three-dot menu as non-dragging a11y alternative
 * - Information Density: 3 configurable tiers (compact 56px, comfortable 72px, spacious 88px)
 */
export default function ListItemCard({
  id,
  variant = "default",
  density: propDensity,
  title,
  subtitle,
  metadata,
  amount,
  icon,
  badge,
  selected = false,
  onSelectToggle,
  onCardClick,
  onLongPress,
  actions,
  onOpenActions,
  className = "",
  children,
  ...props
}: ListItemCardProps) {
  const { triggerHaptic } = useHaptic();
  const { listDensity: globalDensity } = usePreferences();
  const density = propDensity || globalDensity;

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const startLongPress = () => {
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      triggerHaptic("medium");
      onLongPress?.();
    }, 500); // 500ms long press activation
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    if (variant === "disabled") return;

    triggerHaptic("light");
    if (onSelectToggle && (variant === "selected" || selected)) {
      onSelectToggle();
    } else if (onCardClick) {
      onCardClick(e);
    }
  };

  // Density configurations
  const densityClasses = {
    compact: "min-h-[56px] px-3.5 py-2 text-xs",
    comfortable: "min-h-[72px] px-4 py-3 text-sm",
    spacious: "min-h-[88px] px-5 py-4 text-base",
  }[density];

  // Variant styles
  const isCardSelected = variant === "selected" || selected;
  const isCardUrgent = variant === "urgent";
  const isCardDisabled = variant === "disabled";

  return (
    <div
      id={id}
      data-testid="list-item-card"
      data-variant={variant}
      data-density={density}
      data-selected={isCardSelected ? "true" : "false"}
      role={onCardClick || onSelectToggle ? "button" : "article"}
      tabIndex={isCardDisabled ? -1 : 0}
      aria-disabled={isCardDisabled}
      aria-selected={isCardSelected}
      onMouseDown={startLongPress}
      onMouseUp={endLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={endLongPress}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      className={`
        relative w-full rounded-[var(--cb-radius-surface,14px)] border select-none
        transition-all duration-[80ms] ease-out outline-none flex items-center justify-between gap-3
        ${densityClasses}
        ${
          isCardSelected
            ? "bg-[var(--cb-surface-elevated,#181818)] border-[var(--color-primary,#ff1e42)]/60 text-[var(--color-paper,#fdfdfd)]"
            : "bg-[var(--cb-surface,#111111)] border-[var(--cb-border,#222222)] text-[var(--color-paper,#fdfdfd)]"
        }
        ${
          isCardUrgent
            ? "border-l-[3px] border-l-amber-500"
            : ""
        }
        ${
          isCardDisabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "cursor-pointer hover:border-white/20 hover:bg-[var(--cb-surface-elevated,#181818)] active:scale-[0.99] active:bg-[var(--cb-surface-elevated,#1e1e1e)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary,#ff1e42)]"
        }
        ${className}
      `}
      {...props}
    >
      {/* Left Column: Selection Checkbox or Item Icon */}
      <div className="flex items-center gap-3 shrink-0">
        {isCardSelected && (
          <div
            data-testid="card-selected-indicator"
            className="w-5 h-5 rounded-full bg-[var(--color-primary,#ff1e42)] text-white flex items-center justify-center shrink-0 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}

        {!isCardSelected && icon && (
          <div
            data-testid="card-icon"
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--color-paper,#fdfdfd)] flex items-center justify-center shrink-0"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Center Column: Title, Subtitle, and Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            data-testid="card-title"
            className={`font-medium tracking-tight text-[var(--color-paper,#fdfdfd)] truncate ${
              density === "compact" ? "text-xs" : density === "spacious" ? "text-base" : "text-sm"
            }`}
          >
            {title}
          </span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>

        {(subtitle || metadata) && (
          <div className="flex items-center gap-2 mt-0.5 text-[var(--color-stone,#737373)] text-xs truncate">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {subtitle && metadata && <span>•</span>}
            {metadata && <span className="shrink-0 text-[11px] font-mono">{metadata}</span>}
          </div>
        )}

        {children}
      </div>

      {/* Right Column: Amount & Three-Dot Fallback Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {amount && (
          <span
            data-testid="card-amount"
            className={`font-semibold font-mono text-right ${
              density === "compact" ? "text-xs" : density === "spacious" ? "text-base" : "text-sm"
            }`}
          >
            {amount}
          </span>
        )}

        {(actions || onOpenActions) && (
          <button
            type="button"
            data-testid="card-three-dot-menu"
            aria-label={`Aksi untuk ${typeof title === "string" ? title : "item"}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic("light");
              onOpenActions?.();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-stone,#737373)] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
