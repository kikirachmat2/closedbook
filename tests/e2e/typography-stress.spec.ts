import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "iPhone-SE-375", width: 375, height: 667 },
  { name: "iPhone-15-390", width: 390, height: 844 },
  { name: "iPhone-Plus-414", width: 414, height: 896 },
  { name: "iPhone-ProMax-430", width: 430, height: 932 },
];

test.describe("Typography Stress Testing Across Mobile Breakpoints", () => {

  for (const vp of VIEWPORTS) {
    test(`renders typography without horizontal overflow on ${vp.name} (${vp.width}px)`, async (
      { page },
      testInfo
    ) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/design-system", { waitUntil: "networkidle" });
      await expect(page.locator('[data-hydrated="true"]')).toBeVisible();

      // 1. Verify long project name (60 chars) does not cause viewport horizontal scroll
      const displayXl = page.locator('[data-testid="stress-display-xl"]');
      await expect(displayXl).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Zero horizontal overflow

      // 2. Verify Indonesian long title renders properly
      const displayL = page.locator('[data-testid="stress-display-l"]');
      await expect(displayL).toBeVisible();
      await expect(displayL).toContainText("Pengeluaran Operasional Departemen Produksi");

      // 3. Verify large currency Rp 999.999.999.999 in tabular mono font
      const currency = page.locator('[data-testid="stress-currency"]');
      await expect(currency).toBeVisible();
      await expect(currency).toContainText("Rp 999.999.999.999");
      await expect(currency).toHaveCSS("font-family", /mono|jetbrains/i);

      // 4. Verify CJK + Emoji fallback
      const cjk = page.locator('[data-testid="stress-cjk"]');
      await expect(cjk).toBeVisible();
      await expect(cjk).toContainText("東京プロダクション");
      await expect(cjk).toContainText("🎬");

      // 5. Capture screenshot on Desktop Chrome for review (avoids multi-worker screenshot deadlock)
      if (testInfo.project.name === "Desktop Chrome") {
        await page.screenshot({
          path: `docs/design/screenshots/typography-stress-${vp.name}.png`,
          animations: "disabled",
          fullPage: false,
        });
      }
    });
  }
});
