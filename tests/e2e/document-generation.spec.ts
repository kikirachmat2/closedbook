import { test, expect } from "@playwright/test";

test.describe("Document Generation Flow (G.6 Unblocked Parts)", () => {
  test.beforeEach(async ({ page }) => {
    // Disable iOS PWA prompt from overlaying mobile test interactions
    await page.addInitScript(() => {
      localStorage.setItem("cb_ios_install_dismiss_count", "10");
    });
    // High-fidelity mobile context (iPhone 15 standard / 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workspace");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#mobile-bottom-nav")).toBeVisible({ timeout: 10000 });
  });

  test("1. FAB long-press reveals 'Generate Document' radial action within Hick's Law constraint", async ({ page }) => {
    const fabBtn = page.locator("#context-fab-btn");
    await expect(fabBtn).toBeVisible();

    // Trigger long-press (> 450ms)
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("mouseup");

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });

    // Verify radial menu opens with max 3 actions
    const radialMenu = page.locator("#fab-radial-menu");
    await expect(radialMenu).toBeVisible();
    const radialItems = page.locator('#fab-radial-menu [role="menuitem"]');
    expect(await radialItems.count()).toBeLessThanOrEqual(3);

  });

  test("2. Tap 'Generate Document' opens Template Selector Sheet with 3 production options", async ({ page }) => {
    const fabBtn = page.locator("#context-fab-btn");
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("mouseup");

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();

    // Template Selector BottomSheet should be visible
    const templateSheet = page.locator('[data-testid="template-selector-sheet"]');
    await expect(templateSheet).toBeVisible();

    // Verify all 3 templates
    await expect(page.locator('[data-testid="select-template-ledger"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-template-call-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-template-wrap-report"]')).toBeVisible();
  });

  test("3. Select Master Ledger template compiles binary client-side and opens DocumentPreviewSheet", async ({ page }) => {
    const fabBtn = page.locator("#context-fab-btn");
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("mouseup");

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();

    // Select Master Ledger
    const ledgerOption = page.locator('[data-testid="select-template-ledger"]');
    await expect(ledgerOption).toBeVisible();
    await ledgerOption.click();

    // Document Preview Sheet should open
    const previewSheet = page.locator('[data-testid="document-preview-sheet"]');
    await expect(previewSheet).toBeVisible({ timeout: 10000 });

    // Verify table preview is rendered with headers
    const tablePreview = page.locator('[aria-label="Document table preview"]');
    await expect(tablePreview).toBeVisible();
    await expect(page.locator('text=Pratinjau (10 Baris Pertama)')).toBeVisible();
  });

  test("4. DocumentPreviewSheet renders metadata and functional download action", async ({ page }) => {
    const fabBtn = page.locator("#context-fab-btn");
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("mouseup");

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();
    await page.locator('[data-testid="select-template-ledger"]').click();

    const previewSheet = page.locator('[data-testid="document-preview-sheet"]');
    await expect(previewSheet).toBeVisible({ timeout: 10000 });

    // Metadata checks (Indonesian-first copy)
    await expect(page.locator('[data-testid="doc-preview-title"]')).toContainText("Buku Kas Produksi");
    await expect(page.locator('[data-testid="doc-preview-filename"]')).toContainText(".xlsx");

    // Download button check
    const downloadBtn = page.locator('[data-testid="btn-download-doc"]');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();
  });

  test("5. Simpan ke Drive button is enabled and triggers Google Drive onboarding modal without blocker jargon", async ({ page }) => {
    const fabBtn = page.locator("#context-fab-btn");
    await fabBtn.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await fabBtn.dispatchEvent("mouseup");

    const genDocBtn = page.locator('[data-testid="radial-action-generate-doc"]');
    await expect(genDocBtn).toBeVisible({ timeout: 5000 });
    await genDocBtn.click();
    await page.locator('[data-testid="select-template-call-sheet"]').click();

    const previewSheet = page.locator('[data-testid="document-preview-sheet"]');
    await expect(previewSheet).toBeVisible({ timeout: 10000 });

    // Simpan ke Drive should be enabled
    const saveDriveBtn = page.locator('[data-testid="btn-save-drive"]');
    await expect(saveDriveBtn).toBeVisible();
    await expect(saveDriveBtn).toBeEnabled();
    await expect(saveDriveBtn).toContainText("Simpan ke Drive");

    // Verify NO internal blocker jargon appears in UI
    expect(await page.locator('text=BLOCKER-001').count()).toBe(0);

    // Tap opens onboarding modal
    await saveDriveBtn.click();
    const driveModal = page.locator('[data-testid="drive-onboarding-modal"]');
    await expect(driveModal).toBeVisible();
    await expect(page.locator('text=Hubungkan Google Drive')).toBeVisible();
    await expect(page.locator('[data-testid="btn-connect-google-drive"]')).toBeVisible();

    // Dismiss modal
    await page.locator('[data-testid="btn-dismiss-drive-modal"]').click();
    await expect(driveModal).not.toBeVisible();
  });
});
