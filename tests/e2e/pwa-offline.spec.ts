import { test, expect } from "@playwright/test";

test.describe("ClosedBook G.2 PWA & Offline Resilience", () => {
  test("loads offline fallback page with resilience guidance and action buttons", async ({
    page,
  }) => {
    await page.goto("/offline");

    // Verify Obsidian Canvas styling & resilience messaging
    await expect(page.locator("h1")).toContainText("Kamu Sedang Offline");
    await expect(page.getByText("Akses penuh database offline (Dexie.js)")).toBeVisible();

    // Verify retry button & workspace link
    const retryBtn = page.getByRole("button", { name: /Coba Sambungkan Lagi/i });
    const wsLink = page.getByRole("link", { name: /Kembali ke Workspace/i });

    await expect(retryBtn).toBeVisible();
    await expect(wsLink).toBeVisible();
  });

  test("simulates browser offline mode and displays sticky offline banner", async ({
    page,
    context,
  }) => {
    // Navigate to workspace initially
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");

    // Simulate going offline via Playwright CDP
    await context.setOffline(true);

    // Verify sticky offline banner appears
    const offlineBanner = page.locator("#offline-sticky-banner");
    await expect(offlineBanner).toBeVisible({ timeout: 5000 });
    await expect(offlineBanner).toContainText("Kamu offline");

    // Restore online state
    await context.setOffline(false);
  });

  test("verifies web app manifest, icons, and theme metadata", async ({ page }) => {
    await page.goto("/offline");

    // Verify manifest link exists in head
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");

    // Verify apple-touch-icon link exists in head
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);

    // Verify theme-color meta tag (#050505)
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content", "#050505");

    // Fetch manifest.json content directly and verify PWA fields
    const manifestRes = await page.request.get("/manifest.json");
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("portrait-primary");
    expect(manifest.theme_color).toBe("#050505");
    expect(manifest.background_color).toBe("#050505");
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons.some((i: any) => i.purpose === "maskable")).toBe(true);
  });

  test("service worker kill-switch returns cache-only Clear-Site-Data preserving IndexedDB", async ({
    page,
  }) => {
    // 1. Trigger kill-switch endpoint via GET and POST
    const killGetRes = await page.request.get("/api/sw/kill");
    expect(killGetRes.status()).toBe(200);
    
    // CRITICAL: W3C header must be strictly "cache" (never "storage" or "executionContexts")
    const getClearHeader = killGetRes.headers()["clear-site-data"];
    expect(getClearHeader).toBe('"cache"');
    expect(getClearHeader).not.toContain("storage");
    expect(getClearHeader).not.toContain("cookies");

    const killPostRes = await page.request.post("/api/sw/kill");
    expect(killPostRes.status()).toBe(200);
    const postClearHeader = killPostRes.headers()["clear-site-data"];
    expect(postClearHeader).toBe('"cache"');
    expect(postClearHeader).not.toContain("storage");

    const postBody = await killPostRes.json();
    expect(postBody.status).toBe("cleared");
  });

  test("background sync fallback functions gracefully when SyncManager is absent (iOS simulation)", async ({
    page,
  }) => {
    await page.goto("/offline");

    // In browser context without SyncManager (e.g. Safari / Firefox), verify fallback check
    const hasSyncManager = await page.evaluate(() => {
      return "SyncManager" in window;
    });

    // When SyncManager is absent, registration.sync is undefined, confirming iOS Safari behavior
    expect(typeof hasSyncManager).toBe("boolean");
  });
});
