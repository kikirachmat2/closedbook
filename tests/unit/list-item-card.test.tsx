// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ListItemCard from "@/components/mobile/ListItemCard";
import { PreferencesProvider } from "@/lib/preferences";

describe("ListItemCard (G.5 Component Specification)", () => {
  it("renders default variant with comfortable density", () => {
    render(
      <PreferencesProvider>
        <ListItemCard
          title="Sewa Genset 50kVA"
          subtitle="Equipment Rental"
          amount="$450.00"
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-variant", "default");
    expect(card).toHaveAttribute("data-density", "comfortable");
    expect(screen.getByText("Sewa Genset 50kVA")).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument();
  });

  it("renders compact variant with compact density class", () => {
    render(
      <PreferencesProvider>
        <ListItemCard
          variant="compact"
          density="compact"
          title="Katering Kru 25 Pax"
          amount="$125.00"
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toHaveAttribute("data-variant", "compact");
    expect(card).toHaveAttribute("data-density", "compact");
    expect(card.className).toContain("min-h-[56px]");
  });

  it("renders urgent variant with amber accent border (Von Restorff Effect)", () => {
    render(
      <PreferencesProvider>
        <ListItemCard
          variant="urgent"
          title="Overdue Payment: Vendor Lighting"
          amount="$1,200.00"
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toHaveAttribute("data-variant", "urgent");
    expect(card.className).toContain("border-l-[3px]");
    expect(card.className).toContain("border-l-amber-500");
  });

  it("renders selected variant with check icon and surface-elevated styling", () => {
    render(
      <PreferencesProvider>
        <ListItemCard
          variant="selected"
          title="Pembelian Hard Drive 4TB"
          amount="$180.00"
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toHaveAttribute("data-variant", "selected");
    expect(card).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("card-selected-indicator")).toBeInTheDocument();
  });

  it("renders disabled variant with reduced opacity and aria-disabled", () => {
    const handleClick = vi.fn();
    render(
      <PreferencesProvider>
        <ListItemCard
          variant="disabled"
          title="Archived Project Expense"
          amount="$50.00"
          onCardClick={handleClick}
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(card.className).toContain("opacity-50");
    expect(card.className).toContain("pointer-events-none");

    fireEvent.click(card);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports spacious density for accessibility ergonomics", () => {
    render(
      <PreferencesProvider>
        <ListItemCard
          density="spacious"
          title="Honor Sutradara"
          amount="$5,000.00"
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    expect(card).toHaveAttribute("data-density", "spacious");
    expect(card.className).toContain("min-h-[88px]");
  });

  it("renders three-dot menu button for WCAG 2.5.7 a11y non-dragging alternative", () => {
    const handleOpenActions = vi.fn();
    render(
      <PreferencesProvider>
        <ListItemCard
          title="Honor Kru Sound"
          amount="$300.00"
          onOpenActions={handleOpenActions}
        />
      </PreferencesProvider>
    );

    const menuBtn = screen.getByTestId("card-three-dot-menu");
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute("aria-label", "Aksi untuk Honor Kru Sound");

    fireEvent.click(menuBtn);
    expect(handleOpenActions).toHaveBeenCalledTimes(1);
  });

  it("handles long-press interaction after 500ms threshold", () => {
    vi.useFakeTimers();
    const handleLongPress = vi.fn();

    render(
      <PreferencesProvider>
        <ListItemCard
          title="Long Press Test Item"
          onLongPress={handleLongPress}
        />
      </PreferencesProvider>
    );

    const card = screen.getByTestId("list-item-card");
    fireEvent.mouseDown(card);

    // Fast-forward 550ms
    act(() => {
      vi.advanceTimersByTime(550);
    });

    fireEvent.mouseUp(card);
    expect(handleLongPress).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
