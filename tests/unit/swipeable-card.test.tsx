// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SwipeableCard from "@/components/mobile/SwipeableCard";
import { PreferencesProvider } from "@/lib/preferences";

describe("SwipeableCard (G.5 Gesture & A11y Specification)", () => {
  it("renders card with title and action elements", () => {
    render(
      <PreferencesProvider>
        <SwipeableCard
          cardProps={{
            title: "Beli Makan Siang Kru",
            amount: "$85.00",
          }}
          leftAction={{
            label: "Hapus",
            onTrigger: vi.fn(),
          }}
          rightAction={{
            label: "Rekonsiliasi",
            onTrigger: vi.fn(),
          }}
        />
      </PreferencesProvider>
    );

    expect(screen.getByTestId("swipeable-card-container")).toBeInTheDocument();
    expect(screen.getByText("Beli Makan Siang Kru")).toBeInTheDocument();
    expect(screen.getByText("$85.00")).toBeInTheDocument();
    // Three-dot menu button is visible as WCAG 2.5.7 a11y alternative
    expect(screen.getByTestId("card-three-dot-menu")).toBeInTheDocument();
  });

  it("opens A11y BottomSheet when three-dot menu is tapped", () => {
    const handleReconcile = vi.fn();
    const handleDelete = vi.fn();

    render(
      <PreferencesProvider>
        <SwipeableCard
          cardProps={{
            title: "Sewa Kamera FX3",
            amount: "$350.00",
          }}
          rightAction={{
            id: "reconcile",
            label: "Tandai Selesai",
            onTrigger: handleReconcile,
          }}
          leftAction={{
            id: "delete",
            label: "Hapus Transaksi",
            onTrigger: handleDelete,
          }}
        />
      </PreferencesProvider>
    );

    const threeDotBtn = screen.getByTestId("card-three-dot-menu");
    fireEvent.click(threeDotBtn);

    // Verify Bottom Sheet dialog opened
    expect(screen.getByTestId("bottom-sheet-dialog")).toBeInTheDocument();
    const actionList = screen.getByTestId("swipe-a11y-action-list");
    expect(within(actionList).getByText("Tandai Selesai")).toBeInTheDocument();
    expect(within(actionList).getByText("Hapus Transaksi")).toBeInTheDocument();

    // Tap action in bottom sheet -> executes rightAction
    fireEvent.click(within(actionList).getByText("Tandai Selesai"));
    expect(handleReconcile).toHaveBeenCalledTimes(1);
  });

  it("executes destructive action via three-dot fallback menu", () => {
    const handleDelete = vi.fn();

    render(
      <PreferencesProvider>
        <SwipeableCard
          cardProps={{
            title: "Overdue Equipment Item",
            amount: "$120.00",
          }}
          leftAction={{
            id: "delete",
            label: "Hapus Item",
            onTrigger: handleDelete,
          }}
        />
      </PreferencesProvider>
    );

    const threeDotBtn = screen.getByTestId("card-three-dot-menu");
    fireEvent.click(threeDotBtn);

    const actionList = screen.getByTestId("swipe-a11y-action-list");
    const deleteBtn = within(actionList).getByText("Hapus Item");
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
