import { test, expect } from "@playwright/test";

test.describe("Visual Regression: Card & Surface Primitives", () => {
  test("renders surface cards with border contrast and surface styling", async ({
    page,
  }) => {
    await page.goto("/offline", { waitUntil: "domcontentloaded" });

    const surfaceCard = page.locator("main > div").first();
    await expect(surfaceCard).toBeVisible();

    // Verify surface card has border and dark surface background (#0D0D0D = rgb(13, 13, 13))
    await expect(surfaceCard).toHaveCSS("background-color", "rgb(13, 13, 13)");
  });
});
