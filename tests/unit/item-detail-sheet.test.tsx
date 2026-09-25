// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ItemDetailSheet from "@/components/mobile/ItemDetailSheet";

describe("ItemDetailSheet (G.5 Stacked Bottom Sheet)", () => {
  const mockItem = {
    id: "tx-123",
    title: "Sewa Generator 10kVA",
    subtitle: "Vendor Sumber Listrik Abadi",
    amount: "$450.00",
    status: "approved",
    category: "Lighting & Power",
    metadata: [
      { label: "Tanggal", value: "24 Sep 2026" },
      { label: "Dibuat oleh", value: "Kiki Rachmat" },
    ],
    relatedItems: [
      { id: "task-01", title: "Setup Lighting Day 1", type: "Task" },
    ],
    history: [
      { action: "Transaksi disetujui", user: "Line Producer", timestamp: "1 jam yang lalu" },
      { action: "Transaksi dicatat", user: "Kiki Rachmat", timestamp: "3 jam yang lalu" },
    ],
  };

  it("renders detail sheet with metadata, actions, related items, and history", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <ItemDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    expect(screen.getAllByText("Sewa Generator 10kVA").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("$450.00")).toBeInTheDocument();
    expect(screen.getByText("Informasi Lengkap")).toBeInTheDocument();
    expect(screen.getByText("Setup Lighting Day 1")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Aktivitas")).toBeInTheDocument();

    // Test actions
    fireEvent.click(screen.getByTestId("detail-action-edit"));
    expect(handleEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("detail-action-delete"));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it("renders stacked edit sheet when isStackedEditOpen is true", () => {
    const handleBack = vi.fn();

    render(
      <ItemDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        isStackedEditOpen={true}
        onCloseStackedEdit={handleBack}
        renderStackedContent={() => (
          <div data-testid="custom-edit-form">Edit Form Content</div>
        )}
      />
    );

    expect(screen.getByTestId("stacked-edit-sheet-content")).toBeInTheDocument();
    expect(screen.getByTestId("custom-edit-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-back-to-detail"));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
