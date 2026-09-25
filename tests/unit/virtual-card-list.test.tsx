// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VirtualCardList from "@/components/mobile/VirtualCardList";
import { PreferencesProvider } from "@/lib/preferences";

describe("VirtualCardList (G.5 Virtual Scrolling)", () => {
  it("renders virtual list items and height container correctly", () => {
    const mockItems = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
    }));

    render(
      <PreferencesProvider>
        <VirtualCardList
          items={mockItems}
          getItemKey={(item) => item.id}
          renderItem={(item) => (
            <div data-testid={`card-${item.id}`}>{item.title}</div>
          )}
        />
      </PreferencesProvider>
    );

    expect(screen.getByTestId("virtual-card-list-scroll-parent")).toBeInTheDocument();
    expect(screen.getByTestId("virtual-card-list-height-container")).toBeInTheDocument();
  });

  it("renders emptyComponent when items are empty", () => {
    render(
      <PreferencesProvider>
        <VirtualCardList
          items={[]}
          renderItem={() => <div />}
          emptyComponent={<div data-testid="empty-test">No Items</div>}
        />
      </PreferencesProvider>
    );

    expect(screen.getByTestId("empty-test")).toBeInTheDocument();
  });
});
