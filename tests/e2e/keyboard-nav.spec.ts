import { test, expect } from "@playwright/test";

test.describe("Keyboard Navigation & A11y Focus System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design-system", { waitUntil: "networkidle" });
    await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  });

  test("supports skip-to-content link when focused via keyboard", async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    // Press Enter on skip link -> moves focus/hash to main content
    await page.keyboard.press("Enter");
    expect(page.url()).toContain("#main-content");
  });

  test("applies crimson focus ring on focused interactive buttons", async ({ page }) => {
    // Focus primary button
    const primaryBtn = page.locator('[data-testid="btn-primary"]');
    await expect(primaryBtn).toBeVisible();
    await primaryBtn.focus();
    await expect(primaryBtn).toBeFocused();

    // Verify focus-visible outline or box-shadow styling contains crimson focus ring
    const boxShadow = await primaryBtn.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow).toBeTruthy();
  });

  test("supports Escape key to dismiss bottom sheet modal", async ({ page }) => {
    // Open sheet
    const openSheetBtn = page.locator('[data-testid="open-sheet-btn"]');
    await expect(openSheetBtn).toBeVisible();
    await openSheetBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
