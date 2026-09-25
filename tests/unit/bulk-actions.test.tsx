// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BulkActionBar from "@/components/mobile/BulkActionBar";
import TopAppBar from "@/components/mobile/TopAppBar";

describe("Multi-Select and Bulk Actions (G.5)", () => {
  it("renders selection mode in TopAppBar with selected count and actions", () => {
    const handleCancel = vi.fn();
    const handleSelectAll = vi.fn();

    render(
      <TopAppBar
        title="Ledger"
        selectionMode={{
          isActive: true,
          selectedCount: 4,
          onCancel: handleCancel,
          onSelectAll: handleSelectAll,
        }}
      />
    );

    expect(screen.getByTestId("selection-count-label")).toHaveTextContent("4 dipilih");
    
    // Tap cancel
    fireEvent.click(screen.getByTestId("selection-cancel-btn"));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    // Tap select all
    fireEvent.click(screen.getByTestId("selection-select-all-btn"));
    expect(handleSelectAll).toHaveBeenCalledTimes(1);
  });

  it("renders BulkActionBar and opens confirmation sheet on delete", () => {
    const handleBulkDelete = vi.fn();
    const handleBulkArchive = vi.fn();

    render(
      <BulkActionBar
        selectedCount={3}
        onBulkDelete={handleBulkDelete}
        onBulkArchive={handleBulkArchive}
      />
    );

    expect(screen.getByTestId("bulk-action-bar")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-selected-count")).toHaveTextContent("3");

    // Tap delete button -> opens confirmation dialog
    fireEvent.click(screen.getByTestId("btn-bulk-delete"));
    expect(screen.getByTestId("bulk-delete-confirm-sheet")).toBeInTheDocument();

    // Confirm deletion
    fireEvent.click(screen.getByTestId("btn-confirm-bulk-delete"));
    expect(handleBulkDelete).toHaveBeenCalledTimes(1);
  });

  it("shows progress bar when more than 10 items selected", () => {
    render(
      <BulkActionBar
        selectedCount={15}
        onBulkDelete={vi.fn()}
        progress={65}
      />
    );

    const progressBar = screen.getByTestId("bulk-progress-bar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: "65%" });
  });
});
