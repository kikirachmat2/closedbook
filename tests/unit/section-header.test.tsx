// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionHeader from "@/components/mobile/SectionHeader";
import { groupItemsByTime } from "@/lib/utils/time-grouping";

describe("SectionHeader & Time Grouping (G.5 Chunking)", () => {
  it("renders SectionHeader with title, count and sticky styling", () => {
    const handleToggle = vi.fn();

    render(
      <SectionHeader
        title="Hari Ini"
        count={5}
        isCollapsed={false}
        onToggleCollapse={handleToggle}
      />
    );

    const header = screen.getByTestId("section-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky");
    expect(screen.getByText("Hari Ini")).toBeInTheDocument();
    expect(screen.getByTestId("section-header-count")).toHaveTextContent("5");

    // Click triggers toggle
    fireEvent.click(header.querySelector("button")!);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("groups items correctly into today, yesterday, thisWeek, older", () => {
    const now = new Date();
    const today = now.toISOString();
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();

    const items = [
      { id: "1", date: today },
      { id: "2", date: yesterday },
      { id: "3", date: threeDaysAgo },
      { id: "4", date: tenDaysAgo },
    ];

    const groups = groupItemsByTime(items, (item) => item.date, "id");
    expect(groups.length).toBe(4);
    expect(groups[0].key).toBe("today");
    expect(groups[0].label).toBe("Hari Ini");
    expect(groups[1].key).toBe("yesterday");
    expect(groups[1].label).toBe("Kemarin");
    expect(groups[2].key).toBe("thisWeek");
    expect(groups[2].label).toBe("Minggu Ini");
    expect(groups[3].key).toBe("older");
    expect(groups[3].label).toBe("Lebih Lama");
  });
});
