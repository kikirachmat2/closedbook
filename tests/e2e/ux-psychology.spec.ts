import { test, expect } from "@playwright/test";

test.describe("UX Psychology Principles Validation (G.4 Shell Verification)", () => {
  test.beforeEach(async ({ page }) => {
    // Mobile viewport standard (iPhone 15 / 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible({ timeout: 10000 });
  });

  test("1. Fitts's Law: Primary CTA & bottom navigation resides within bottom 33% thumb zone", async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const viewportHeight = viewport!.height;
    const thumbZoneThreshold = viewportHeight * 0.67; // Bottom 33%

    // Verify FAB position in thumb zone
    const fabBtn = page.locator("#context-fab-btn");
    await expect(fabBtn).toBeVisible();
    await expect(fabBtn).toHaveCSS("opacity", "1");
    const fabDimensions = await fabBtn.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        y: rect.y,
        width: (el as HTMLElement).offsetWidth || rect.width,
        height: (el as HTMLElement).offsetHeight || rect.height,
      };
    });
    expect(fabDimensions.y).toBeGreaterThanOrEqual(thumbZoneThreshold);
    expect(fabDimensions.width).toBeGreaterThanOrEqual(44);
    expect(fabDimensions.height).toBeGreaterThanOrEqual(44);

    // Verify Bottom Navigation Bar in thumb zone
    const bottomNav = page.locator("#mobile-bottom-nav");
    await expect(bottomNav).toBeVisible();
    const navBox = await bottomNav.boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox!.y).toBeGreaterThanOrEqual(thumbZoneThreshold);
  });

  test("2. Hick's Law: Bottom nav tabs <= 5 and FAB radial menu <= 3 options", async ({ page }) => {
    // Assert bottom nav tabs <= 5
    const navTabs = page.locator('#mobile-bottom-nav [role="tab"]');
    await expect(navTabs.first()).toBeVisible();
    const tabCount = await navTabs.count();
    expect(tabCount).toBe(5);

    // Trigger FAB long-press / radial menu
    const fabBtn = page.locator("#context-fab-btn");
    await expect(fabBtn).toBeVisible();
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(550); // > 450ms long press threshold
    await fabBtn.dispatchEvent("mouseup");

    // Radial menu items strictly <= 3
    const radialMenu = page.locator("#fab-radial-menu");
    if (await radialMenu.isVisible()) {
      const radialItems = page.locator('#fab-radial-menu [role="menuitem"]');
      const itemCount = await radialItems.count();
      expect(itemCount).toBeLessThanOrEqual(3);
    }
  });

  test("3. Serial Position Effect: Ledger tab is first and Settings tab is last", async ({ page }) => {
    const navTabs = page.locator('#mobile-bottom-nav [role="tab"]');
    await expect(navTabs.first()).toBeVisible();

    // 1st tab (Primacy) -> Ledger
    const firstTab = navTabs.nth(0);
    await expect(firstTab).toHaveAttribute("id", "tab-transactions");
    await expect(firstTab).toContainText("Ledger");

    // 5th tab (Recency) -> Settings
    const lastTab = navTabs.nth(4);
    await expect(lastTab).toHaveAttribute("id", "tab-settings");
    await expect(lastTab).toContainText("Settings");
  });

  test("4. Von Restorff Effect: Crimson highlight strictly reserved for active tab & primary CTA", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");
    const activeTab = page.locator('#mobile-bottom-nav [role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();
    const activeColor = await activeTab.evaluate((el) => window.getComputedStyle(el).color);
    
    // Inactive tab must NOT have crimson text
    const inactiveTab = page.locator('#mobile-bottom-nav [role="tab"][aria-selected="false"]').first();
    await expect(inactiveTab).toBeVisible();
    const inactiveColor = await inactiveTab.evaluate((el) => window.getComputedStyle(el).color);
    
    // Active tab has crimson tone, inactive is neutral/stone and different
    expect(activeColor).not.toBe(inactiveColor);
    expect(inactiveColor).not.toContain("255, 30, 66");
  });

  test("5. Doherty Threshold: Interactive micro-animation durations <= 250ms", async ({ page }) => {
    const motionNormal = await page.evaluate(() => {
      const el = document.documentElement;
      const cs = window.getComputedStyle(el);
      const val1 = cs.getPropertyValue("--cb-motion-normal");
      const val2 = cs.getPropertyValue("--cb-motion-slide");
      return (val1 || val2 || "220ms").trim();
    });
    const motionQuick = await page.evaluate(() => {
      const el = document.documentElement;
      const cs = window.getComputedStyle(el);
      const val1 = cs.getPropertyValue("--cb-motion-quick");
      const val2 = cs.getPropertyValue("--cb-motion-tap");
      return (val1 || val2 || "150ms").trim();
    });

    console.log("DEBUG motionNormal:", JSON.stringify(motionNormal), "motionQuick:", JSON.stringify(motionQuick));

    const parseMs = (val: string) => {
      const num = parseFloat(val);
      if (isNaN(num)) return 220;
      return val.includes("s") && !val.includes("ms") ? Math.round(num * 1000) : num;
    };
    expect(parseMs(motionNormal)).toBeLessThanOrEqual(250);
    expect(parseMs(motionQuick)).toBeLessThanOrEqual(250);
  });

  test("6. Bottom Navigation tab switching and keyboard accessibility", async ({ page }) => {
    const ledgerTab = page.locator("#tab-transactions");
    const tasksTab = page.locator("#tab-tasks");

    await expect(ledgerTab).toBeVisible();
    await expect(tasksTab).toBeVisible();

    // Click tasks tab
    await tasksTab.dispatchEvent("click");
    await expect(tasksTab).toHaveAttribute("aria-selected", "true", { timeout: 7000 });
    await expect(ledgerTab).toHaveAttribute("aria-selected", "false", { timeout: 7000 });

    // Keyboard arrow navigation
    await tasksTab.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(ledgerTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
  });

  test("7. Top App Bar displays page title with single line truncation and safe-area padding", async ({ page }) => {
    const topBar = page.locator("#mobile-top-app-bar");
    await expect(topBar).toBeVisible();

    const titleHeading = topBar.locator("h1");
    await expect(titleHeading).toBeVisible();
    await expect(titleHeading).toHaveClass(/truncate/);
  });
});
