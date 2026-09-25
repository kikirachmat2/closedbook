// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  LedgerEmptyState,
  LedgerLoadingSkeleton,
  TasksEmptyState,
  SearchNoResultState,
  FilterNoResultState,
} from "@/components/mobile/ListStatePresets";
import { PreferencesProvider } from "@/lib/preferences";

describe("List-Specific Empty and Loading States (G.5)", () => {
  it("renders LedgerEmptyState with required text and triggers action", () => {
    const handleLog = vi.fn();
    render(<LedgerEmptyState onLogExpense={handleLog} />);

    expect(screen.getByText("Belum ada transaksi. Tap + untuk catat.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("empty-state-primary-cta"));
    expect(handleLog).toHaveBeenCalledTimes(1);
  });

  it("renders LedgerLoadingSkeleton with 5 rows", () => {
    render(
      <PreferencesProvider>
        <LedgerLoadingSkeleton count={5} />
      </PreferencesProvider>
    );

    const skeletonContainer = screen.getByTestId("ledger-loading-skeleton");
    expect(skeletonContainer).toBeInTheDocument();
    expect(skeletonContainer.children.length).toBe(5);
  });

  it("renders TasksEmptyState with 'Semua beres! 🎬'", () => {
    render(<TasksEmptyState onNewTask={vi.fn()} />);
    expect(screen.getByText("Semua beres! 🎬")).toBeInTheDocument();
  });

  it("renders SearchNoResultState with query text", () => {
    render(<SearchNoResultState query="genset honda" onClear={vi.fn()} />);
    expect(
      screen.getByText("Tidak ditemukan 'genset honda'. Coba kata kunci lain.")
    ).toBeInTheDocument();
  });

  it("renders FilterNoResultState with reset button", () => {
    const handleReset = vi.fn();
    render(<FilterNoResultState onReset={handleReset} />);

    expect(screen.getByText("Tidak ada yang cocok dengan filter.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("empty-state-primary-cta"));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
