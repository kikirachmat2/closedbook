import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Gemini Assistant Bottom Sheet (Tasks 4, 5, 6)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cb_ios_install_dismiss_count", "10");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible({ timeout: 10000 });
  });

  test("opens Gemini Assistant from FAB radial menu, verifies context toggle & chat interface", async ({ page }) => {
    // 1. Long press FAB to open radial menu
    const fabButton = page.locator("#context-fab-btn");
    await expect(fabButton).toBeVisible();

    // Trigger long-press (> 450ms)
    await fabButton.dispatchEvent("mousedown", { button: 0 });
    await page.waitForTimeout(650);
    await fabButton.dispatchEvent("mouseup", { button: 0 });

    // 2. Click AI Assistant in radial menu
    const aiAssistantAction = page.locator('[data-testid="radial-action-ai-assistant"]');
    await expect(aiAssistantAction).toBeVisible({ timeout: 5000 });
    await aiAssistantAction.click();

    // 3. Verify BottomSheet header & model badge
    const sheetHeader = page.getByRole("heading", { name: "Gemini Assistant" });
    await expect(sheetHeader).toBeVisible({ timeout: 5000 });

    const modelBadge = page.locator("text=gemini-2.0-flash");
    await expect(modelBadge.first()).toBeVisible();

    // 4. Verify Context Checkboxes & Privacy Toggles
    const contextToggle = page.getByRole("checkbox", { name: "Konteks Proyek" });
    await expect(contextToggle).toBeVisible();
    await expect(contextToggle).toBeChecked();

    const financialToggle = page.getByRole("checkbox", { name: "Finansial (Opt-In)" });
    await expect(financialToggle).toBeVisible();
    // Privacy default: financial data is unchecked
    await expect(financialToggle).not.toBeChecked();

    // 5. Verify Input Bar (16px text font to prevent iOS Safari auto-zoom)
    const promptInput = page.getByPlaceholder("Tanyakan jadwal syuting, analisis anggaran...");
    await expect(promptInput).toBeVisible();
    await promptInput.fill("Berapa sisa anggaran untuk departemen Camera?");

    // 6. Verify Send button becomes enabled
    const sendBtn = page.getByRole("button", { name: "Kirim Pesan" });
    await expect(sendBtn).toBeEnabled();

    // 7. Verify Initial assistant welcome message is displayed with markdown
    const welcomeMsg = page.locator("text=ClosedBook AI Assistant");
    await expect(welcomeMsg.first()).toBeVisible();

    // 8. Capture verified screenshot of the open assistant sheet
    await page.screenshot({ path: "./docs/gemini_assistant_sheet.png" });

    // 9. Axe accessibility audit on open sheet
    const axeResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(axeResults.violations).toEqual([]);

    // 10. Close assistant sheet
    const closeBtn = page.getByRole("button", { name: "Tutup sheet" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
  });
});
