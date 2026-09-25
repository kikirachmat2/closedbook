import { test, expect } from "@playwright/test";

test.describe("ClosedBook G.0 Smoke & Legal Pages", () => {
  test("loads privacy policy page with zero-retention declarations", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Kebijakan Privasi ClosedBook");
    await expect(page.getByText("Zero-Server-Retention").first()).toBeVisible();
    await expect(page.getByText("drive.file").first()).toBeVisible();
  });

  test("loads terms of service page", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Syarat & Ketentuan Layanan");
    await expect(page.getByText("Kedaulatan & Kepemilikan Data Pengguna")).toBeVisible();
  });
});
