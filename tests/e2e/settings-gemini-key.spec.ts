import { test, expect } from "@playwright/test";

test.describe("Settings: Gemini API Key Management UI (Task 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cb_ios_install_dismiss_count", "10");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible({ timeout: 10000 });
  });

  test("opens Settings modal and interacts with Gemini API Key UI", async ({ page }) => {
    // 1. Open settings via BottomNav tab-settings
    const settingsTab = page.locator("#tab-settings");
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();

    // 2. Verify AI Assistant section is visible
    const aiSection = page.locator('[data-testid="settings-ai-section"]');
    await expect(aiSection).toBeVisible();

    // 3. Verify external link to Google AI Studio
    const aiStudioLink = aiSection.locator('a[href*="aistudio.google.com"]');
    await expect(aiStudioLink).toBeVisible();
    await expect(aiStudioLink).toContainText("Cara dapat API key gratis");

    // 4. Verify initial status indicator shows 'No key set'
    const statusIndicator = page.locator("#gemini-key-status-indicator");
    await expect(statusIndicator).toBeVisible();
    await expect(statusIndicator).toContainText("No key set");

    // 5. Input an API Key
    const keyInput = page.locator("#gemini-api-key-input");
    await keyInput.fill("AIzaSyD-MOCK-TEST-KEY-12345");
    expect(await keyInput.inputValue()).toBe("AIzaSyD-MOCK-TEST-KEY-12345");

    // 6. Test connection button exists
    const testBtn = page.locator("#btn-test-gemini-key");
    await expect(testBtn).toBeVisible();
    await expect(testBtn).toBeEnabled();

    // 7. Remove key button clears input and sets status back to 'No key set'
    const removeBtn = page.locator("#btn-remove-gemini-key");
    await expect(removeBtn).toBeVisible();

    // 8. Capture verified screenshot of the Settings AI Assistant section
    await page.screenshot({ path: "./docs/settings_ai_section.png" });

    await removeBtn.click();
    expect(await keyInput.inputValue()).toBe("");
    await expect(statusIndicator).toContainText("No key set");
  });
});
