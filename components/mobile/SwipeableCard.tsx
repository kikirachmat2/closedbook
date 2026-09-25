"use client";

import React, { useState, useRef } from "react";
import { Check, Trash2, Archive, MoreVertical } from "lucide-react";
import { m, AnimatePresence } from "@/components/MotionProvider";
import { useReducedMotion } from "framer-motion";
import { useHaptic } from "@/lib/hooks/use-haptic";
import ListItemCard, { ListItemCardProps, ListItemAction } from "@/components/mobile/ListItemCard";
import BottomSheet from "@/components/mobile/BottomSheet";

export interface SwipeActionConfig {
  id?: string;
  label: string;
  icon?: React.ElementType;
  colorClass?: string;
  onTrigger: () => Promise<void> | void;
}

export interface SwipeableCardProps {
  id?: string;
  cardProps: Omit<ListItemCardProps, "actions" | "onOpenActions">;
  leftAction?: SwipeActionConfig; // Revealed on swipe left (e.g., Delete/Archive)
  rightAction?: SwipeActionConfig; // Revealed on swipe right (e.g., Reconcile/Complete)
  customActions?: ListItemAction[]; // Additional actions for three-dot menu
  disabled?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD_RATIO = 0.35; // 35-40% card width threshold

/**
 * SwipeableCard — Mobile swipe gesture card with:
 * - Anti-Accident Spring Return: Snaps back to 0 (no accidental complete fling deletes)
 * - Visual Icon & Color Reveal: Dynamic feedback during swipe
 * - Haptic bump when crossing threshold
 * - WCAG 2.5.7 Alternative: Three-Dot Menu A11y Fallback to BottomSheet
 */
export default function SwipeableCard({
  id,
  cardProps,
  leftAction,
  rightAction,
  customActions,
  disabled = false,
  className = "",
}: SwipeableCardProps) {
  const { triggerHaptic } = useHaptic();
  const shouldReduceMotion = useReducedMotion();
  const [dragX, setDragX] = useState(0);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredThresholdHaptic = useRef(false);

  // Synthesize menu actions from swipe actions + custom actions for A11y fallback
  const allActions: ListItemAction[] = [];

  if (rightAction) {
    allActions.push({
      id: rightAction.id || "action-right",
      label: rightAction.label,
      icon: rightAction.icon || Check,
      destructive: false,
      onClick: () => {
        setIsActionsSheetOpen(false);
        rightAction.onTrigger();
      },
    });
  }

  if (leftAction) {
    allActions.push({
      id: leftAction.id || "action-left",
      label: leftAction.label,
      icon: leftAction.icon || Trash2,
      destructive: true,
      onClick: () => {
        setIsActionsSheetOpen(false);
        leftAction.onTrigger();
      },
    });
  }

  if (customActions) {
    allActions.push(...customActions);
  }

  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    setDragX(currentX);

    const width = containerRef.current?.offsetWidth || 350;
    const threshold = width * SWIPE_THRESHOLD_RATIO;

    if (Math.abs(currentX) >= threshold && !hasTriggeredThresholdHaptic.current) {
      triggerHaptic("light");
      hasTriggeredThresholdHaptic.current = true;
    } else if (Math.abs(currentX) < threshold) {
      hasTriggeredThresholdHaptic.current = false;
    }
  };

  const handleDragEnd = async (_: any, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    const width = containerRef.current?.offsetWidth || 350;
    const threshold = width * SWIPE_THRESHOLD_RATIO;

    // Reset drag position state
    setDragX(0);
    hasTriggeredThresholdHaptic.current = false;

    // Trigger right action (Swipe Right)
    if (currentX >= threshold && rightAction) {
      triggerHaptic("medium");
      await rightAction.onTrigger();
    }
    // Trigger left action (Swipe Left)
    else if (currentX <= -threshold && leftAction) {
      triggerHaptic("medium");
      await leftAction.onTrigger();
    }
  };

  const LeftIcon = leftAction?.icon || Trash2;
  const RightIcon = rightAction?.icon || Check;

  return (
    <>
      <div
        id={id}
        ref={containerRef}
        data-testid="swipeable-card-container"
        className={`relative overflow-hidden rounded-[var(--cb-radius-surface,14px)] select-none ${className}`}
      >
        {/* Background Action Reveal Layers */}
        {/* 1. Left Action (Swipe Left to reveal right-aligned destructive background) */}
        {leftAction && (
          <div
            data-testid="swipe-reveal-left"
            className={`absolute inset-0 flex items-center justify-end px-5 rounded-[var(--cb-radius-surface,14px)] text-white transition-opacity ${
              leftAction.colorClass || "bg-rose-600"
            } ${dragX < -15 ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center gap-2 font-medium text-xs">
              <span>{leftAction.label}</span>
              <LeftIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        )}

        {/* 2. Right Action (Swipe Right to reveal left-aligned positive background) */}
        {rightAction && (
          <div
            data-testid="swipe-reveal-right"
            className={`absolute inset-0 flex items-center justify-start px-5 rounded-[var(--cb-radius-surface,14px)] text-white transition-opacity ${
              rightAction.colorClass || "bg-emerald-600"
            } ${dragX > 15 ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center gap-2 font-medium text-xs">
              <RightIcon className="w-5 h-5 stroke-[2.5]" />
              <span>{rightAction.label}</span>
            </div>
          </div>
        )}

        {/* Draggable Surface */}
        <m.div
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={{ x: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", damping: 25, stiffness: 350 }
          }
          className="relative z-10 w-full"
        >
          <ListItemCard
            {...cardProps}
            actions={allActions.length > 0 ? allActions : undefined}
            onOpenActions={allActions.length > 0 ? () => setIsActionsSheetOpen(true) : undefined}
          />
        </m.div>
      </div>

      {/* A11y Fallback Action Bottom Sheet (WCAG 2.5.7 non-dragging alternative) */}
      <BottomSheet
        isOpen={isActionsSheetOpen}
        onClose={() => setIsActionsSheetOpen(false)}
        title={typeof cardProps.title === "string" ? cardProps.title : "Pilihan Aksi"}
      >
        <div data-testid="swipe-a11y-action-list" className="p-4 space-y-2">
          {allActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                id={`a11y-action-${action.id}`}
                type="button"
                onClick={action.onClick}
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all active:scale-[0.98] ${
                  action.destructive
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                    : "bg-[#181818] border-white/[0.08] text-[var(--color-paper,#fdfdfd)] hover:bg-white/10"
                }`}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4 shrink-0" />}
                <span className="flex-1 text-left">{action.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
