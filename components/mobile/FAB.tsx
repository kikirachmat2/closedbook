"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Receipt,
  CheckSquare,
  ArrowLeftRight,
  FileSpreadsheet,
  Plus,
  Camera,
  Download,
  AlertTriangle,
  Calendar,
  Printer,
  X,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { m, AnimatePresence } from "@/components/MotionProvider";
import { useHaptic } from "@/lib/hooks/use-haptic";
import { usePreferences } from "@/lib/preferences";

export interface RadialAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface FABProps {
  activeTab: string;
  onPrimaryAction: () => void;
  customActions?: RadialAction[];
  onScanReceipt?: () => void;
  onAddTask?: () => void;
  onTransfer?: () => void;
  onExportCsv?: () => void;
  onEditSchedule?: () => void;
  onPrintWrap?: () => void;
}

/**
 * FAB — Context-Aware Floating Action Button with Radial Menu (Fitts's Law + Hick's Law).
 * - Size: 56×56px (Material standard)
 * - Ergonomics: bottom-right (default) or bottom-left (configurable in Settings for left-handed users)
 * - Safe Area: 56px bottom nav + safe-area-inset-bottom + 16px margin
 * - Context-Aware Icons:
 *   - Ledger: Receipt icon
 *   - Tasks: CheckSquare icon
 *   - Cash Drawer: ArrowLeftRight icon
 *   - Docs: FileSpreadsheet icon
 * - Long-Press: Triggers radial/speed-dial menu with max 3 actions (Hick's Law constraint)
 * - Doherty Threshold: 150ms motion duration
 */
export default function FAB({
  activeTab,
  onPrimaryAction,
  customActions,
  onScanReceipt,
  onAddTask,
  onTransfer,
  onExportCsv,
  onEditSchedule,
  onPrintWrap,
}: FABProps) {
  const { triggerHaptic } = useHaptic();
  const { fabPosition } = usePreferences();
  const shouldReduceMotion = useReducedMotion();
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Close radial menu on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRadialOpen) {
        setIsRadialOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRadialOpen]);

  // Context-aware icon & default actions (Max 3 actions per Hick's Law)
  let ContextIcon = Plus;
  let defaultActions: RadialAction[] = [];

  switch (activeTab) {
    case "transactions":
      ContextIcon = Receipt;
      defaultActions = [
        {
          id: "scan-receipt",
          label: "Scan Receipt",
          icon: Camera,
          onClick: () => onScanReceipt?.(),
        },
        {
          id: "add-expense",
          label: "Add Expense",
          icon: Receipt,
          onClick: () => onPrimaryAction(),
        },
        {
          id: "export-csv",
          label: "Export CSV",
          icon: Download,
          onClick: () => onExportCsv?.(),
        },
      ];
      break;

    case "tasks":
      ContextIcon = CheckSquare;
      defaultActions = [
        {
          id: "add-task-urgent",
          label: "Urgent Task",
          icon: AlertTriangle,
          onClick: () => onAddTask?.(),
        },
        {
          id: "add-task",
          label: "New Task",
          icon: CheckSquare,
          onClick: () => onPrimaryAction(),
        },
        {
          id: "export-tasks",
          label: "Export Log",
          icon: Download,
          onClick: () => onExportCsv?.(),
        },
      ];
      break;

    case "pockets":
      ContextIcon = ArrowLeftRight;
      defaultActions = [
        {
          id: "transfer-funds",
          label: "Transfer Cash",
          icon: ArrowLeftRight,
          onClick: () => onPrimaryAction(),
        },
        {
          id: "log-cash",
          label: "Log Expense",
          icon: Receipt,
          onClick: () => onTransfer?.(),
        },
        {
          id: "export-audit",
          label: "Audit Sheet",
          icon: FileSpreadsheet,
          onClick: () => onExportCsv?.(),
        },
      ];
      break;

    case "callsheet":
      ContextIcon = FileSpreadsheet;
      defaultActions = [
        {
          id: "edit-schedule",
          label: "Edit Brief",
          icon: Calendar,
          onClick: () => onEditSchedule?.(),
        },
        {
          id: "print-summary",
          label: "Print Summary",
          icon: Printer,
          onClick: () => onPrintWrap?.(),
        },
        {
          id: "add-task-docs",
          label: "Create Task",
          icon: CheckSquare,
          onClick: () => onAddTask?.(),
        },
      ];
      break;

    default:
      ContextIcon = Plus;
      defaultActions = [
        {
          id: "quick-expense",
          label: "Expense",
          icon: Receipt,
          onClick: () => onPrimaryAction(),
        },
        {
          id: "quick-task",
          label: "Task",
          icon: CheckSquare,
          onClick: () => onAddTask?.(),
        },
        {
          id: "quick-transfer",
          label: "Transfer",
          icon: ArrowLeftRight,
          onClick: () => onTransfer?.(),
        },
      ];
      break;
  }

  // Enforce Hick's Law: Strictly max 3 actions
  const radialActions = (customActions || defaultActions).slice(0, 3);

  const startLongPress = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerHaptic("medium");
      setIsRadialOpen(true);
    }, 450);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    triggerHaptic("medium");
    if (isRadialOpen) {
      setIsRadialOpen(false);
    } else {
      onPrimaryAction();
    }
  };

  const positionClass =
    fabPosition === "left"
      ? "left-4 md:left-6"
      : "right-4 md:right-6";

  return (
    <div
      data-testid="fab-container"
      data-position={fabPosition}
      className={`md:hidden fixed ${positionClass} z-40`}
      style={{
        bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      {/* Radial Menu Backdrop */}
      <AnimatePresence>
        {isRadialOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRadialOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Radial Actions Stack (Hick's Law max 3) */}
      <AnimatePresence>
        {isRadialOpen && (
          <div
            id="fab-radial-menu"
            role="menu"
            aria-label="Quick Actions Menu"
            className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5 mb-2 z-40"
          >
            {radialActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <m.div
                  key={action.id}
                  role="menuitem"
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.15,
                    delay: idx * 0.04,
                  }}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-[11px] font-medium text-[var(--color-paper,#fdfdfd)] bg-[#121212]/90 border border-white/[0.1] px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap">
                    {action.label}
                  </span>
                  <button
                    type="button"
                    id={`radial-action-${action.id}`}
                    onClick={() => {
                      triggerHaptic("medium");
                      setIsRadialOpen(false);
                      action.onClick();
                    }}
                    className="w-11 h-11 rounded-full bg-[#181818] border border-white/[0.15] text-[var(--color-paper,#fdfdfd)] hover:text-[var(--color-primary,#ff1e42)] hover:border-[var(--color-primary,#ff1e42)]/40 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    aria-label={action.label}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </button>
                </m.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Primary 56×56px FAB Button */}
      <m.button
        id="context-fab-btn"
        type="button"
        onMouseDown={startLongPress}
        onMouseUp={endLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={endLongPress}
        onClick={handleClick}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-full bg-[var(--color-primary,#ff1e42)] text-white flex items-center justify-center shadow-[0_6px_24px_rgba(255,30,66,0.45)] hover:shadow-[0_8px_30px_rgba(255,30,66,0.6)] hover:brightness-105 active:scale-95 transition-shadow select-none relative z-40"
        aria-label={isRadialOpen ? "Close Quick Actions" : "Primary Action"}
        aria-haspopup="menu"
        aria-expanded={isRadialOpen}
      >
        {isRadialOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <ContextIcon className="w-6 h-6 stroke-[2.2]" />
        )}
      </m.button>
    </div>
  );
}
