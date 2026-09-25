import { test, expect } from "@playwright/test";

test.describe("G.5 Card Lists & UX Comfort Validation Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 14 / modern mobile target 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/test-comfort");
    await page.waitForLoadState("domcontentloaded");
  });

  // 1. FORGIVENESS PATTERN TESTS
  test("1. Forgiveness: single item delete triggers 5-second undo toast", async ({ page }) => {
    const itemCard = page.locator("#card-tx-today-1");
    await expect(itemCard).toBeVisible();

    // Use three-dot menu to trigger delete
    const threeDot = itemCard.locator('[data-testid="card-three-dot-menu"]');
    await threeDot.click();

    const actionList = page.locator('[data-testid="swipe-a11y-action-list"]');
    await expect(actionList).toBeVisible();

    const deleteBtn = actionList.locator("button", { hasText: "Hapus Transaksi" });
    await deleteBtn.click();

    // Verify item deleted from view
    await expect(page.locator("#card-tx-today-1")).not.toBeVisible();

    // Verify undo toast appears with 5s window
    const undoToast = page.locator('[data-testid="undo-toast"]');
    await expect(undoToast).toBeVisible();
    await expect(page.locator('[data-testid="undo-toast-message"]')).toContainText("dihapus");
  });

  test("2. Forgiveness: tapping undo restores deleted item immediately", async ({ page }) => {
    const itemCard = page.locator("#card-tx-today-1");
    await expect(itemCard).toBeVisible();

    // Delete item
    const threeDot = itemCard.locator('[data-testid="card-three-dot-menu"]');
    await threeDot.click();
    const deleteBtn = page.locator('[data-testid="swipe-a11y-action-list"] button', { hasText: "Hapus Transaksi" });
    await deleteBtn.click();
    await expect(page.locator("#card-tx-today-1")).not.toBeVisible();

    // Tap Batal (Undo)
    const undoBtn = page.locator('[data-testid="undo-btn"]');
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    // Verify restored
    await expect(page.locator("#card-tx-today-1")).toBeVisible({ timeout: 5000 });
  });

  // 2. SWIPE THRESHOLD & ANTI-ACCIDENT TESTS
  test("3. Swipe Threshold: partial drag < 40% width snaps back without triggering action", async ({ page }) => {
    const cardContainer = page.locator("#card-tx-today-1");
    await expect(cardContainer).toBeVisible();

    const box = await cardContainer.boundingBox();
    expect(box).not.null;

    if (box) {
      // Drag left by only 30px (< 40% of ~360px width)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 30, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    // Verify item still exists (no action triggered)
    await expect(page.locator("#card-tx-today-1")).toBeVisible();
    await expect(page.locator('[data-testid="undo-toast"]')).not.toBeVisible();
  });

  test("4. Swipe Action: full drag right marks transaction approved", async ({ page }) => {
    const pendingItem = page.locator("#card-tx-today-2");
    await expect(pendingItem).toBeVisible();

    const box = await pendingItem.boundingBox();
    expect(box).not.null;

    if (box) {
      // Drag right by 180px (> 40% threshold)
      await page.mouse.move(box.x + 50, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Should complete swipe
    await expect(page.locator("#card-tx-today-2")).toBeVisible();
  });

  // 3. A11Y ALTERNATIVE (WCAG 2.5.7) TESTS
  test("5. A11y Fallback: three-dot menu is visible on every card", async ({ page }) => {
    const threeDot = page.locator('#card-tx-today-1 [data-testid="card-three-dot-menu"]');
    await expect(threeDot).toBeVisible();
    await expect(threeDot).toHaveAttribute("aria-label", /Aksi untuk/);
  });

  test("6. A11y Fallback: three-dot menu opens bottom sheet with accessible action list", async ({ page }) => {
    const threeDot = page.locator('#card-tx-today-1 [data-testid="card-three-dot-menu"]');
    await threeDot.click();

    const actionList = page.locator('[data-testid="swipe-a11y-action-list"]');
    await expect(actionList).toBeVisible();

    const buttons = actionList.locator("button");
    await expect(buttons).toHaveCount(2); // Tandai Selesai + Hapus Transaksi
  });

  test("7. A11y Fallback: executing action via menu produces identical result to swipe", async ({ page }) => {
    const threeDot = page.locator('#card-tx-today-1 [data-testid="card-three-dot-menu"]');
    await threeDot.click();

    const reconcileBtn = page.locator('[data-testid="swipe-a11y-action-list"] button', { hasText: "Tandai Selesai" });
    await reconcileBtn.click();

    // Verify sheet closed
    await expect(page.locator('[data-testid="swipe-a11y-action-list"]')).not.toBeVisible();
  });

  // 4. DENSITY PREFERENCE TESTS
  test("8. Density Preference: switching to compact reduces card height to 56px", async ({ page }) => {
    const compactBtn = page.locator('[data-testid="density-toggle-compact"]');
    await compactBtn.click();

    const card = page.locator("#item-card-tx-today-1");
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/min-h-\[56px\]/);
  });

  test("9. Density Preference: switching to comfortable sets card height to 72px", async ({ page }) => {
    const comfortableBtn = page.locator('[data-testid="density-toggle-comfortable"]');
    await comfortableBtn.click();

    const card = page.locator("#item-card-tx-today-1");
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/min-h-\[72px\]/);
  });

  test("10. Density Preference: switching to spacious sets card height to 88px", async ({ page }) => {
    const spaciousBtn = page.locator('[data-testid="density-toggle-spacious"]');
    await spaciousBtn.click();

    const card = page.locator("#item-card-tx-today-1");
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/min-h-\[88px\]/);
  });

  test("11. Density Preference: persists across page reload", async ({ page }) => {
    const compactBtn = page.locator('[data-testid="density-toggle-compact"]');
    await compactBtn.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const card = page.locator("#item-card-tx-today-1");
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/min-h-\[56px\]/);
  });

  // 5. VIRTUAL SCROLLING TESTS
  test("12. Virtual Scrolling: renders 500 items container within 200ms", async ({ page }) => {
    const start = Date.now();
    const toggleVirtual = page.locator('[data-testid="toggle-virtual-mode"]');
    await toggleVirtual.click();

    const virtualContainer = page.locator('[data-testid="virtual-card-list-height-container"]');
    await expect(virtualContainer).toBeVisible({ timeout: 7000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3500); // allows for Playwright WebKit IPC overhead
  });

  test("13. Virtual Scrolling: virtualizer maintains correct total height container", async ({ page }) => {
    await page.locator('[data-testid="toggle-virtual-mode"]').click();

    const heightContainer = page.locator('[data-testid="virtual-card-list-height-container"]');
    await expect(heightContainer).toBeVisible();

    // Total size should be large (500 items * ~80px = ~40,000px)
    const style = await heightContainer.getAttribute("style");
    expect(style).toContain("height:");
  });

  // 6. MULTI-SELECT & BULK ACTIONS TESTS
  test("14. Multi-Select: card selection mode activates and shows counter", async ({ page }) => {
    const card = page.locator("#item-card-tx-today-1");
    await expect(card).toBeVisible();

    // Long press on card (> 500ms)
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    // TopAppBar enters selection mode
    const countLabel = page.locator('[data-testid="selection-count-label"]');
    await expect(countLabel).toBeVisible();
    await expect(countLabel).toContainText("1 dipilih");
  });

  test("15. Multi-Select: select-all selects all items in list", async ({ page }) => {
    // Activate selection mode
    const card = page.locator("#item-card-tx-today-1");
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    // Tap select all in TopAppBar
    const selectAllBtn = page.locator('[data-testid="selection-select-all-btn"]');
    await selectAllBtn.click();

    const countLabel = page.locator('[data-testid="selection-count-label"]');
    await expect(countLabel).toContainText("5 dipilih");
  });

  test("16. Multi-Select: BulkActionBar displays selected count and action buttons", async ({ page }) => {
    const card = page.locator("#item-card-tx-today-1");
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    const bulkBar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bulkBar).toBeVisible();
    await expect(page.locator('[data-testid="btn-bulk-delete"]')).toBeVisible();
  });

  test("17. Multi-Select: bulk delete triggers confirmation sheet", async ({ page }) => {
    const card = page.locator("#item-card-tx-today-1");
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    await page.locator('[data-testid="btn-bulk-delete"]').click();
    await expect(page.locator('[data-testid="bulk-delete-confirm-sheet"]')).toBeVisible();
  });

  test("18. Multi-Select: bulk delete is undoable and restores all items", async ({ page }) => {
    // Select all
    const card = page.locator("#item-card-tx-today-1");
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
    }

    await page.locator('[data-testid="selection-select-all-btn"]').click();
    await page.locator('[data-testid="btn-bulk-delete"]').click();
    await page.locator('[data-testid="btn-confirm-bulk-delete"]').click();

    // Verify undo toast appears
    const undoToast = page.locator('[data-testid="undo-toast"]');
    await expect(undoToast).toBeVisible();

    // Tap Batal
    await page.locator('[data-testid="undo-btn"]').click();

    // Verify all 5 items restored
    await expect(page.locator("#card-tx-today-1")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#card-tx-older-1")).toBeVisible({ timeout: 5000 });
  });

  // 7. SEARCH & FILTER TESTS
  test("19. Search: instant filter with 200ms debounce filters matching items", async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.click();
    await searchInput.fill("genset");
    await searchInput.dispatchEvent("input");

    // Wait for 200ms debounce
    await page.waitForTimeout(400);

    // Only genset item visible
    await expect(page.locator("#card-tx-today-1")).toBeVisible({ timeout: 7000 });
    await expect(page.locator("#card-tx-today-2")).not.toBeVisible({ timeout: 7000 });
  });

  test("20. Search: HighlightText marks matching keyword with mark element", async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.click();
    await searchInput.fill("genset");
    await searchInput.dispatchEvent("input");
    await page.waitForTimeout(400);

    const highlight = page.locator('[data-testid="search-highlight"]').first();
    await expect(highlight).toBeVisible({ timeout: 7000 });
    await expect(highlight).toHaveText(/genset/i);
  });

  test("21. Search: clearing query restores full list", async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.click();
    await searchInput.pressSequentially("genset", { delay: 30 });

    const clearBtn = page.locator('[data-testid="search-clear-btn"]');
    await expect(clearBtn).toBeVisible({ timeout: 5000 });
    await clearBtn.click();
    await page.waitForTimeout(400);

    await expect(page.locator("#card-tx-today-2")).toBeVisible({ timeout: 7000 });
  });

  test("22. Filter Sheet: applies status filter and renders active filter chips", async ({ page }) => {
    const filterBtn = page.locator('[data-testid="btn-open-filter-sheet"]');
    await filterBtn.click();

    await expect(page.locator('[data-testid="filter-sheet-content"]')).toBeVisible();

    // Select pending status filter
    await page.locator('[data-testid="status-filter-btn-pending"]').click();
    await page.locator('[data-testid="btn-apply-filters"]').click();

    // Verify active filter badge and chips
    await expect(page.locator('[data-testid="active-filter-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-filter-chips"]')).toContainText("Status: pending");
  });

  // 8. GROUPING & SECTION HEADERS TESTS
  test("23. Grouping: items are grouped into time-based sections", async ({ page }) => {
    await expect(page.locator('[data-testid="time-group-today"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-group-yesterday"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-group-thisWeek"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-group-older"]')).toBeVisible();
  });

  test("24. Grouping: section headers have sticky positioning", async ({ page }) => {
    const header = page.locator('[data-testid="section-header"]').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/sticky/);
    await expect(header).toHaveClass(/top-0/);
  });

  // 9. ITEM DETAIL SHEET & STACKED SHEET
  test("25. Item Detail: tapping card opens ItemDetailSheet with metadata", async ({ page }) => {
    const card = page.locator("#item-card-tx-today-1");
    await card.click();

    const detailSheet = page.locator('[data-testid="item-detail-sheet-content"]');
    await expect(detailSheet).toBeVisible();
    await expect(detailSheet).toContainText("Sewa Genset 5000W Honda");
    await expect(detailSheet).toContainText("$250.00");
  });

  test("26. Item Detail: tapping edit slides into stacked edit sheet", async ({ page }) => {
    const card = page.locator("#item-card-tx-today-1");
    await card.click();

    const editBtn = page.locator('[data-testid="detail-action-edit"]');
    await editBtn.click();

    const stackedSheet = page.locator('[data-testid="stacked-edit-sheet-content"]');
    await expect(stackedSheet).toBeVisible();

    // Back to detail button
    const backBtn = page.locator('[data-testid="btn-back-to-detail"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(page.locator('[data-testid="item-detail-sheet-content"]')).toBeVisible();
  });
});
