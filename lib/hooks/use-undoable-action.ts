"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { db } from "@/lib/db/schema";
import { useHaptic } from "@/lib/hooks/use-haptic";

export interface UndoableAction<T = any> {
  id: string;
  description: string;
  entityType: "transaction" | "task" | "pocket" | "generic";
  actionType: "delete" | "archive" | "reconcile" | "status";
  snapshot: T;
  onCommit?: () => Promise<void> | void;
  onRevert?: (snapshot: T) => Promise<void> | void;
  timestamp: number;
}

interface PendingItem<T = any> {
  action: UndoableAction<T>;
  timerId: NodeJS.Timeout;
}

const UNDO_WINDOW_MS = 5000; // 5-second forgiveness window
const MAX_UNDO_STACK = 3; // Miller's Law: max 3 undo items in stack

/**
 * useUndoableAction — Forgiveness Principle interaction hook.
 * Allows destructive or status-altering operations to be performed optimistically
 * while preserving a 5-second atomic rollback window.
 */
export function useUndoableAction() {
  const { triggerHaptic } = useHaptic();
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const pendingMapRef = useRef<Map<string, PendingItem>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      pendingMapRef.current.forEach((item) => {
        clearTimeout(item.timerId);
      });
      pendingMapRef.current.clear();
    };
  }, []);

  /**
   * Execute an action with undo capability.
   */
  const executeUndoable = useCallback(
    async <T>(actionConfig: Omit<UndoableAction<T>, "timestamp">) => {
      const actionId = actionConfig.id || `undo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const action: UndoableAction<T> = {
        ...actionConfig,
        id: actionId,
        timestamp: Date.now(),
      };

      // Set 5-second commit timer
      const timerId = setTimeout(async () => {
        // Permanent commit
        if (action.onCommit) {
          try {
            await action.onCommit();
          } catch (err) {
            console.error("Failed to commit undoable action:", err);
          }
        }
        // Remove from map and stack
        pendingMapRef.current.delete(actionId);
        setUndoStack((prev) => prev.filter((item) => item.id !== actionId));
      }, UNDO_WINDOW_MS);

      // Enforce max 3 items in stack (Miller's Law)
      if (pendingMapRef.current.size >= MAX_UNDO_STACK) {
        // Find oldest item and commit it immediately
        const oldestKey = pendingMapRef.current.keys().next().value;
        if (oldestKey) {
          const oldestItem = pendingMapRef.current.get(oldestKey);
          if (oldestItem) {
            clearTimeout(oldestItem.timerId);
            if (oldestItem.action.onCommit) {
              try {
                await oldestItem.action.onCommit();
              } catch {}
            }
            pendingMapRef.current.delete(oldestKey);
          }
        }
      }

      pendingMapRef.current.set(actionId, { action, timerId });
      setUndoStack((prev) => [action, ...prev.slice(0, MAX_UNDO_STACK - 1)]);

      triggerHaptic("light");
      return actionId;
    },
    [triggerHaptic]
  );

  /**
   * Revert the specified action (or the latest one if no id given).
   */
  const undo = useCallback(
    async (id?: string) => {
      const targetId = id || (undoStack[0] ? undoStack[0].id : null);
      if (!targetId) return false;

      const pendingItem = pendingMapRef.current.get(targetId);
      if (!pendingItem) return false;

      clearTimeout(pendingItem.timerId);
      pendingMapRef.current.delete(targetId);
      setUndoStack((prev) => prev.filter((item) => item.id !== targetId));

      const { action } = pendingItem;

      try {
        // Automatic Dexie restore based on entity type if no custom revert
        if (action.onRevert) {
          await action.onRevert(action.snapshot);
        } else if (action.entityType === "transaction") {
          await db.transactions.put(action.snapshot);
        } else if (action.entityType === "task") {
          await db.tasks.put(action.snapshot);
        } else if (action.entityType === "pocket") {
          await db.pockets.put(action.snapshot);
        }

        triggerHaptic("light");
        return true;
      } catch (err) {
        console.error("Failed to revert action:", err);
        return false;
      }
    },
    [undoStack, triggerHaptic]
  );

  /**
   * Dismiss/commit early without waiting for the 5s timer.
   */
  const dismiss = useCallback(
    async (id: string) => {
      const pendingItem = pendingMapRef.current.get(id);
      if (!pendingItem) return;

      clearTimeout(pendingItem.timerId);
      pendingMapRef.current.delete(id);
      setUndoStack((prev) => prev.filter((item) => item.id !== id));

      if (pendingItem.action.onCommit) {
        try {
          await pendingItem.action.onCommit();
        } catch (err) {
          console.error("Failed to commit dismissed action:", err);
        }
      }
      triggerHaptic("medium");
    },
    [triggerHaptic]
  );

  return {
    undoStack,
    latestUndo: undoStack[0] || null,
    executeUndoable,
    undo,
    dismiss,
    hasPendingUndo: undoStack.length > 0,
  };
}
