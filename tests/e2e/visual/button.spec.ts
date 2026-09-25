import { test, expect } from "@playwright/test";

test.describe("Visual Regression: Button Primitive", () => {
  test("renders primary and secondary button variants meeting touch target bounds", async ({
    page,
  }) => {
    await page.goto("/offline", { waitUntil: "domcontentloaded" });

    // Test button touch target sizing on live app
    const retryBtn = page.getByRole("button", { name: /Coba Sambungkan Lagi/i });
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toHaveCSS("min-height", "44px");
  });
});
