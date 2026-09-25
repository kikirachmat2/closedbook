"use client";

import React, { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { m } from "@/components/MotionProvider";
import { Check, Trash2, Undo2 } from "lucide-react";
import { useHaptic } from "@/lib/hooks/use-haptic";
import BottomSheet from "@/components/mobile/BottomSheet";

/**
 * 1. InteractiveButton — Scale 0.98 + tactile haptic + touch feedback.
 */
export function InteractiveButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const { triggerHaptic } = useHaptic();

  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all select-none min-h-[44px] px-5 py-2.5 text-xs active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-[var(--color-primary,#ff1e42)] text-white hover:brightness-110 shadow-lg shadow-[var(--color-primary,#ff1e42)]/20",
    secondary:
      "bg-[#181818] border border-white/[0.1] text-[var(--color-paper,#fdfdfd)] hover:border-white/20",
    danger:
      "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25",
    ghost: "bg-transparent text-[var(--color-stone,#737373)] hover:text-white",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={(e) => {
        triggerHaptic("light");
        onClick?.(e);
      }}
      className={`${baseStyle} ${variantStyles[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * 2. ToggleSwitch — 150ms slide + haptic light.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  id?: string;
}) {
  const { triggerHaptic } = useHaptic();
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = () => {
    triggerHaptic("light");
    onChange(!checked);
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={handleToggle}
      className={`w-12 h-6 rounded-full transition-colors duration-150 relative shrink-0 p-0.5 ${
        checked ? "bg-[var(--color-primary,#ff1e42)]" : "bg-white/10"
      }`}
    >
      <m.span
        animate={{ x: checked ? 24 : 0 }}
        transition={{ duration: shouldReduceMotion ? 0.001 : 0.15, ease: "easeOut" }}
        className="block w-5 h-5 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

/**
 * 3. SuccessCheckmark — SVG path draw animation (400ms).
 */
export function SuccessCheckmark({
  size = 40,
  strokeWidth = 3,
  className = "",
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      data-testid="success-checkmark"
      className={`inline-flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 p-2 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <m.path
          d="M20 6L9 17l-5-5"
          initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.001 : 0.4, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/**
 * 4. ShakeContainer — Error shake animation (translateX ±8px × 3, 300ms).
 */
export function ShakeContainer({
  shake = false,
  children,
  className = "",
}: {
  shake?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      data-testid="shake-container"
      animate={
        shake && !shouldReduceMotion
          ? { x: [0, -8, 8, -8, 8, -4, 4, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * 5. CopyConfirmToast — Bottom toast with 10s undo window.
 */
export function CopyConfirmToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
}) {
  const { triggerHaptic } = useHaptic();

  return (
    <div
      data-testid="copy-confirm-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 p-3.5 rounded-2xl bg-[#181818] border border-white/[0.12] shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom duration-200"
    >
      <div className="flex items-center gap-2 text-[var(--color-paper,#fdfdfd)]">
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-2">
        {onUndo && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("medium");
              onUndo();
              onDismiss();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-paper,#fdfdfd)] font-medium text-[11px] transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            <span>Urungkan</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onDismiss();
          }}
          className="text-[var(--color-stone,#737373)] hover:text-white text-xs px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * 6. DeleteConfirmSheet — Destructive action bottom sheet confirmation.
 */
export function DeleteConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  title = "Yakin ingin menghapus item ini?",
  description = "Tindakan ini tidak dapat dibatalkan. Catatan transaksi akan diarsipkan.",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  const { triggerHaptic } = useHaptic();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} initialSnap="half">
      <div data-testid="delete-confirm-sheet" className="p-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[var(--color-paper,#fdfdfd)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--color-stone,#737373)] leading-relaxed mt-1.5 max-w-xs mx-auto">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            id="cancel-delete-btn"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="flex-1 min-h-[44px] rounded-xl border border-white/[0.1] text-xs font-medium text-[var(--color-stone,#737373)] hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            id="confirm-delete-btn"
            onClick={() => {
              triggerHaptic("heavy");
              onConfirm();
              onClose();
            }}
            className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
          >
            Hapus
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
