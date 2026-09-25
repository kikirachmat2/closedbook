// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoableAction } from "@/lib/hooks/use-undoable-action";

describe("useUndoableAction Hook (G.5 Forgiveness System)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("queues an undoable action and provides 5-second window", async () => {
    const onCommit = vi.fn();
    const onRevert = vi.fn();

    const { result } = renderHook(() => useUndoableAction());

    let actionId: string = "";
    await act(async () => {
      actionId = await result.current.executeUndoable({
        id: "tx-123",
        description: "Pengeluaran dihapus.",
        entityType: "transaction",
        actionType: "delete",
        snapshot: { id: "tx-123", amount: 150 },
        onCommit,
        onRevert,
      });
    });

    expect(result.current.hasPendingUndo).toBe(true);
    expect(result.current.latestUndo?.id).toBe("tx-123");
    expect(result.current.latestUndo?.description).toBe("Pengeluaran dihapus.");

    // Fast-forward 2 seconds (still pending)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.hasPendingUndo).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();

    // Fast-forward remaining 3.1 seconds (exceeding 5 seconds)
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    expect(result.current.hasPendingUndo).toBe(false);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("reverts snapshot when undo is called within 5 seconds", async () => {
    const onCommit = vi.fn();
    const onRevert = vi.fn();

    const { result } = renderHook(() => useUndoableAction());

    await act(async () => {
      await result.current.executeUndoable({
        id: "tx-456",
        description: "Task diarsipkan.",
        entityType: "task",
        actionType: "archive",
        snapshot: { id: "tx-456", status: "todo" },
        onCommit,
        onRevert,
      });
    });

    expect(result.current.hasPendingUndo).toBe(true);

    // Call undo at 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.undo("tx-456");
    });

    expect(success).toBe(true);
    expect(onRevert).toHaveBeenCalledWith({ id: "tx-456", status: "todo" });
    expect(result.current.hasPendingUndo).toBe(false);

    // Ensure onCommit is never called even after timer would have expired
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("caps stack to max 3 items per Miller's Law and commits oldest early", async () => {
    const commit1 = vi.fn();
    const commit2 = vi.fn();
    const commit3 = vi.fn();
    const commit4 = vi.fn();

    const { result } = renderHook(() => useUndoableAction());

    await act(async () => {
      await result.current.executeUndoable({
        id: "action-1",
        description: "Item 1",
        entityType: "generic",
        actionType: "delete",
        snapshot: { id: 1 },
        onCommit: commit1,
      });
      await result.current.executeUndoable({
        id: "action-2",
        description: "Item 2",
        entityType: "generic",
        actionType: "delete",
        snapshot: { id: 2 },
        onCommit: commit2,
      });
      await result.current.executeUndoable({
        id: "action-3",
        description: "Item 3",
        entityType: "generic",
        actionType: "delete",
        snapshot: { id: 3 },
        onCommit: commit3,
      });
    });

    expect(result.current.undoStack.length).toBe(3);

    // Pushing a 4th item forces oldest item (action-1) to commit immediately
    await act(async () => {
      await result.current.executeUndoable({
        id: "action-4",
        description: "Item 4",
        entityType: "generic",
        actionType: "delete",
        snapshot: { id: 4 },
        onCommit: commit4,
      });
    });

    expect(result.current.undoStack.length).toBeLessThanOrEqual(3);
    expect(commit1).toHaveBeenCalledTimes(1);
  });
});
