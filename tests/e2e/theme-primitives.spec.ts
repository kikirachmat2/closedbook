import { test, expect } from "@playwright/test";

const THEMES = ["obsidian", "signature", "indigo", "emerald", "amber", "paper"] as const;

test.describe("Theme System & Light/Dark Mode Primitive Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/design-system", { waitUntil: "networkidle" });
    await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  });

  for (const theme of THEMES) {
    test(`correctly applies theme tokens for "${theme}"`, async ({ page }, testInfo) => {
      // Click theme radio button
      const themeBtn = page.getByRole("radio", {
        name: new RegExp(theme, "i"),
      });
      await expect(themeBtn).toBeVisible();
      await themeBtn.click();

      // Verify html data-theme attribute
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      // Verify button rendered and clickable
      const primaryBtn = page.locator('[data-testid="btn-primary"]');
      await expect(primaryBtn).toBeVisible();
      await primaryBtn.click();

      // Capture screenshot only on Desktop Chrome to avoid multi-worker collision
      if ((theme === "paper" || theme === "obsidian") && testInfo.project.name === "Desktop Chrome") {
        await page.screenshot({
          path: `docs/design/screenshots/theme-${theme}-primitive-audit.png`,
          animations: "disabled",
          fullPage: false,
        });
      }
    });
  }

  test("verifies Paper theme contrast and readable text on light surface", async ({ page }) => {
    // Switch to paper theme
    const paperRadio = page.getByRole("radio", { name: /paper/i });
    await expect(paperRadio).toBeVisible();
    await paperRadio.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");

    // Verify paper surface background is light (rgb(255, 255, 255))
    const surfaceCard = page.locator('[data-testid="stress-card"]');
    await expect(surfaceCard).toHaveCSS("background-color", "rgb(255, 255, 255)");

    // Verify primary button in paper theme has white text
    const primaryBtn = page.locator('[data-testid="btn-primary"]');
    await expect(primaryBtn).toHaveCSS("color", "rgb(255, 255, 255)");
  });
});
