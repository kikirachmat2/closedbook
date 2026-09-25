// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchBar from "@/components/mobile/SearchBar";
import HighlightText from "@/components/mobile/HighlightText";
import FilterSheet, { INITIAL_FILTER_STATE } from "@/components/mobile/FilterSheet";
import { PreferencesProvider } from "@/lib/preferences";

describe("Search, Filter, and Sort (G.5)", () => {
  it("highlights matching text in HighlightText component", () => {
    render(<HighlightText text="Sewa Genset 5000W Honda" query="genset" />);
    const highlight = screen.getByTestId("search-highlight");
    expect(highlight).toBeInTheDocument();
    expect(highlight).toHaveTextContent("Genset");
  });

  it("debounces user input in SearchBar", async () => {
    const handleQueryChange = vi.fn();
    render(
      <SearchBar
        query=""
        onQueryChange={handleQueryChange}
        placeholder="Cari..."
      />
    );

    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "genset" } });

    // Should not trigger immediately
    expect(handleQueryChange).not.toHaveBeenCalled();

    // After 250ms debounce
    await waitFor(
      () => {
        expect(handleQueryChange).toHaveBeenCalledWith("genset");
      },
      { timeout: 500 }
    );
  });

  it("applies filters and sorts in FilterSheet", () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <PreferencesProvider>
        <FilterSheet
          isOpen={true}
          onClose={handleClose}
          filters={INITIAL_FILTER_STATE}
          onApply={handleApply}
          statuses={[
            { id: "approved", label: "Approved" },
            { id: "pending", label: "Pending" },
          ]}
        />
      </PreferencesProvider>
    );

    // Click sort option: nominal tertinggi (amount_desc)
    fireEvent.click(screen.getByTestId("sort-btn-amount_desc"));
    // Click date filter: today
    fireEvent.click(screen.getByTestId("date-filter-btn-today"));
    // Click apply
    fireEvent.click(screen.getByTestId("btn-apply-filters"));

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: "amount_desc",
        dateRange: "today",
      })
    );
    expect(handleClose).toHaveBeenCalled();
  });
});
