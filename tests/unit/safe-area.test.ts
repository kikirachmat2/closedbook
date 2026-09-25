// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSafeArea } from "@/lib/hooks/use-safe-area";

describe("useSafeArea Hook (Unit)", () => {
  it("initializes with default insets and tracks window resize", () => {
    const { result } = renderHook(() => useSafeArea());

    expect(result.current).toHaveProperty("top");
    expect(result.current).toHaveProperty("bottom");
    expect(result.current).toHaveProperty("left");
    expect(result.current).toHaveProperty("right");
    expect(result.current).toHaveProperty("keyboardHeight");
    expect(result.current).toHaveProperty("isKeyboardOpen");
  });

  it("detects virtual keyboard opening when visualViewport height shrinks", () => {
    // Mock visualViewport
    const originalViewport = window.visualViewport;
    const listeners: Record<string, Function[]> = {};

    window.innerHeight = 800;
    (window as any).visualViewport = {
      height: 450, // 350px difference -> keyboard open
      width: 390,
      addEventListener: vi.fn((event: string, cb: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      }),
      removeEventListener: vi.fn(),
    };

    const { result } = renderHook(() => useSafeArea());

    expect(result.current.isKeyboardOpen).toBe(true);
    expect(result.current.keyboardHeight).toBe(350);

    // Restore
    (window as any).visualViewport = originalViewport;
  });
});
