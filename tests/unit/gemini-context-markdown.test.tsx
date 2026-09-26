/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MarkdownRenderer from "../../components/mobile/MarkdownRenderer";
import {
  buildProductionContext,
  AppContextState,
  ContextOptions,
} from "../../lib/ai/context-builder";

describe("MarkdownRenderer Component (Task 6)", () => {
  it("renders simple text and bold formatting correctly", () => {
    const { container } = render(
      <MarkdownRenderer content="Halo ini **anggaran penting** produksi." />
    );
    expect(container.textContent).toContain("Halo ini anggaran penting produksi.");
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("anggaran penting");
  });

  it("renders code blocks with code language and copy button", () => {
    const codeSnippet = "```json\n{\n  \"status\": \"approved\"\n}\n```";
    const { container } = render(<MarkdownRenderer content={codeSnippet} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(container.textContent).toContain("approved");
    const copyBtn = screen.getByRole("button", { name: /copy code block/i });
    expect(copyBtn).toBeDefined();
  });

  it("renders ordered and unordered list items", () => {
    const markdown = "- Item 1\n- Item 2\n1. First\n2. Second";
    const { container } = render(<MarkdownRenderer content={markdown} />);
    const lis = container.querySelectorAll("li");
    expect(lis.length).toBe(4);
  });

  it("collapses long response if collapsible is enabled", () => {
    const longContent = Array(20)
      .fill("Line of text detailing production expenses and coordination notes.")
      .join("\n\n");
    render(<MarkdownRenderer content={longContent} collapsible={true} maxCollapsedLength={200} />);
    const expandBtn = screen.getByRole("button", { name: /lihat selengkapnya/i });
    expect(expandBtn).toBeDefined();

    // Click to expand
    fireEvent.click(expandBtn);
    expect(screen.getByRole("button", { name: /tampilkan lebih sedikit/i })).toBeDefined();
  });
});

describe("Context Injection with Privacy Controls (Task 5)", () => {
  const mockAppState: AppContextState = {
    projectName: "The Quiet Horizon",
    projectType: "Feature Film",
    activeTab: "ledger",
    userRole: "UPM",
    totalBudget: 750000,
    totalSpent: 420000,
    activeAlertsCount: 2,
    recentTransactions: [
      {
        date: "2026-09-26",
        description: "Camera Package Rental",
        amount: 3500,
        department: "Camera",
        status: "verified",
      },
    ],
  };

  it("returns empty string when includeAppContext is false", () => {
    const options: ContextOptions = {
      includeAppContext: false,
      includeFinancialData: false,
    };
    const context = buildProductionContext(mockAppState, options);
    expect(context).toBe("");
  });

  it("includes operational context but EXCLUDES financial amounts when includeFinancialData is false (default privacy)", () => {
    const options: ContextOptions = {
      includeAppContext: true,
      includeFinancialData: false,
    };
    const context = buildProductionContext(mockAppState, options);
    expect(context).toContain("The Quiet Horizon");
    expect(context).toContain("LEDGER");
    expect(context).toContain("UPM");

    // Strictly privacy guarded: no financial values or amounts
    expect(context).not.toContain("750,000");
    expect(context).not.toContain("420,000");
    expect(context).not.toContain("Camera Package Rental");
    expect(context).not.toContain("3500");
  });

  it("includes financial data when explicitly opted in by user", () => {
    const options: ContextOptions = {
      includeAppContext: true,
      includeFinancialData: true,
      currencySymbol: "$",
    };
    const context = buildProductionContext(mockAppState, options);
    expect(context).toContain("[FINANCIAL CONTEXT - USER CONSENTED]");
    expect(context).toContain("Total Budget: $750,000");
    expect(context).toContain("Total Spent: $420,000");
    expect(context).toContain("Camera Package Rental");
    expect(context).toContain("$3,500");
  });
});
