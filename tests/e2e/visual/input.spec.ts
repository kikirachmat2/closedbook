import { test, expect } from "@playwright/test";

test.describe("Visual Regression: Input Primitive", () => {
  test("verifies input font size is minimum 16px to prevent iOS auto-zoom", async ({
    page,
  }) => {
    await page.goto("/");

    // Locate the simulated amount input
    const amountInput = page.locator("#simulated-amount");
    await expect(amountInput).toBeVisible();

    const fontSize = await amountInput.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Minimum 16px font to prevent iOS Safari auto-zoom
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});
