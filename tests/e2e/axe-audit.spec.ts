import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Axe-Core Comprehensive Accessibility Audit (A4 Verification)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cb_ios_install_dismiss_count", "10");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible({ timeout: 10000 });
  });

  async function openRadialMenu(page: any) {
    const fabBtn = page.locator("#context-fab-btn");
    await expect(fabBtn).toBeVisible({ timeout: 5000 });
    await fabBtn.dispatchEvent("touchstart");
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("touchend");
    await fabBtn.dispatchEvent("mouseup");
    await expect(page.locator("#fab-radial-menu")).toBeVisible({ timeout: 5000 });
  }

  test("1. Baseline /workspace mobile viewport has zero WCAG violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("2. FAB radial menu state has zero WCAG violations and valid focusable targets", async ({ page }) => {
    await openRadialMenu(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("3. Template Selector bottom sheet has zero WCAG violations", async ({ page }) => {
    await openRadialMenu(page);

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();

    const templateSheet = page.locator('[data-testid="template-selector-sheet"]');
    await expect(templateSheet).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("4. Document Preview Sheet and modal have zero WCAG violations", async ({ page }) => {
    await openRadialMenu(page);

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();

    const selectLedgerBtn = page.locator('[data-testid="select-template-ledger"]');
    await expect(selectLedgerBtn).toBeVisible({ timeout: 5000 });
    await selectLedgerBtn.click();

    const previewSheet = page.locator('[data-testid="document-preview-sheet"]');
    await expect(previewSheet).toBeVisible({ timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
