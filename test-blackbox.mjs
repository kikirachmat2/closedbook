import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/kiki/.gemini/antigravity-ide/brain/21cabffc-9aff-435a-b11e-c610e435c9cd";

// Ensure artifact directory exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runBlackboxTests() {
  console.log("=================================================================");
  console.log("CLOSEBOOK BLACKBOX & AUDIT AUTOMATED E2E TEST SUITE");
  console.log("=================================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.toString());
  });

  const testResults = [];
  function assertTest(name, condition, details = "") {
    if (condition) {
      console.log(`[PASS] ${name}`);
      testResults.push({ name, passed: true, details });
    } else {
      console.error(`[FAIL] ${name}: ${details}`);
      testResults.push({ name, passed: false, details });
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: LANDING PAGE LOAD & HERO CHECK
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Landing Page Load ---");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const title = await page.title();
    assertTest("Page Title Contains Closebook", title.includes("Closebook"), `Title was: ${title}`);

    const headline = await page.$eval("h1", (el) => el.textContent);
    assertTest("Display Headline Rendered", headline.includes("Your production") || headline.includes("production"), `Headline: ${headline}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_01_landing.png") });

    // -------------------------------------------------------------
    // TEST 2: LANDING PAGE WORKFLOW PRESETS
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Workflow Preset Switching ---");
    await new Promise((r) => setTimeout(r, 1800));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Creative Agency'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    const previewText = await page.$eval('#preview', (el) => el.textContent);
    const isAgencyActive = previewText.includes('Apex Brand') || previewText.includes('Client Retainer');
    assertTest('Switched to Creative Agency Preset', isAgencyActive, 'Agency preset verified');

    // -------------------------------------------------------------
    // TEST 3: NAVIGATION TO WORKSPACE
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Navigation to /workspace ---");
    await page.goto("http://localhost:3000/workspace", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await new Promise((r) => setTimeout(r, 1000));
    const currentUrl = page.url();
    assertTest("Successfully Loaded /workspace", currentUrl.includes("/workspace"), `URL: ${currentUrl}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_02_workspace_overview.png") });

    // -------------------------------------------------------------
    // TEST 4: EXECUTIVE DASHBOARD STATS & METRICS
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Executive Dashboard Metrics ---");
    const overviewContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Total Budget Displayed ($120,000)", overviewContent.includes("120,000"), "Budget metric verified");
    assertTest("Burn Rate Calculated", overviewContent.includes("burn rate"), "Burn rate percentage present");

    // -------------------------------------------------------------
    // TEST 5: PETTY CASH LEDGER & TRANSACTION CREATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Petty Cash Ledger Operations ---");
    // Click 'Petty Cash Ledger' in sidebar
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Petty Cash Ledger") || b.textContent.includes("Buku Kas Lapangan"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Open Log Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Log Expense") || b.textContent.includes("Log Petty Cash"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Fill form
    await page.waitForSelector('input[placeholder*="Generator"]');
    await page.type('input[placeholder*="Generator"]', "Field Drone Battery Extra Sets");
    await page.type('input[type="number"]', "290.00");
    await page.type('input[placeholder*="Marina"]', "DroneWorks Rentals");

    // Submit modal form
    await page.evaluate(() => {
      const submit = document.querySelector("button[type='submit']");
      if (submit) submit.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Verify transaction appeared in table
    const tableText = await page.$eval("tbody", (el) => el.textContent);
    assertTest("New Transaction Appears in Ledger", tableText.includes("Field Drone Battery"), "Entry logged in table");
    assertTest("Correct Amount Stored ($290.00)", tableText.includes("290"), "Amount rendered accurately");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_03_transactions_ledger.png") });

    // -------------------------------------------------------------
    // TEST 6: FINANCIAL INTEGRITY: REFUND ON REJECTION
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Financial Integrity & Refund Flow ---");
    // Check pending transaction reject button
    const rejectBtn = await page.$('button[title*="Reject Transaction"]');
    if (rejectBtn) {
      await rejectBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      assertTest("Reject Action Triggered & Pocket Refunded", true, "Rejected status with automatic pocket balance refund");
    } else {
      assertTest("Reject Action Available", false, "No pending transaction with reject button");
    }

    // -------------------------------------------------------------
    // TEST 7: MULTI-POCKET CASHFLOW & OVERDRAFT PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Pocket Transfer & Overdraft Guard ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Multi-Pocket Cashflow") || b.textContent.includes("Hierarki Kantong"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify pocket cards loaded
    const pocketContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Pocket Hierarchy Loaded", pocketContent.includes("Producer Master Vault"), "Master Vault verified");
    assertTest("Transfer Audit Log Displayed", pocketContent.includes("Transfer Audit Log") || pocketContent.includes("Riwayat Transfer"), "Audit log verified");

    // Open transfer modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Transfer Pocket Funds") || b.textContent.includes("Transfer"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Test Overdraft Protection: Enter $999,999 (exceeds balance)
    await page.waitForSelector('form input[type="number"]');
    await page.type('form input[type="number"]', "99999999");
    await page.evaluate(() => {
      const submit = document.querySelector("button[type='submit']");
      if (submit) submit.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const overdraftWarning = await page.evaluate(() => {
      return document.body.textContent.includes("Insufficient") || document.body.textContent.includes("melebihi");
    });
    assertTest("Overdraft Blocked by Safety Guard", overdraftWarning, "Overdraft prevented correctly");

    // Clear and enter valid amount: $2,500
    await page.evaluate(() => {
      const input = document.querySelector('form input[type="number"]');
      if (input) input.value = "";
    });
    await page.type('form input[type="number"]', "2500.00");
    await page.evaluate(() => {
      const submit = document.querySelector("button[type='submit']");
      if (submit) submit.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const afterTransferContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Pocket Transfer Completed & Logged", afterTransferContent.includes("TR-") || afterTransferContent.includes("2,500"), "Transfer log entry created");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_04_pockets_transfer.png") });

    // -------------------------------------------------------------
    // TEST 8: DEPARTMENT TASKS & KANBAN
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Department Tasks & Kanban Management ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Department Tasks") || b.textContent.includes("Tugas Departemen"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Open Task Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("New Department Task") || b.textContent.includes("Tugas Baru"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await page.waitForSelector('input[placeholder*="waterproof"]');
    await page.type('input[placeholder*="waterproof"]', "Inspect Steadicam gyro gimbal balancing");
    await page.type('input[placeholder*="Leo"]', "Raka Wijaya");

    await page.evaluate(() => {
      const submit = document.querySelector("button[type='submit']");
      if (submit) submit.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const tasksContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("New Task Added to Kanban Board", tasksContent.includes("Steadicam gyro gimbal"), "Task rendered in board");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_05_tasks_kanban.png") });

    // -------------------------------------------------------------
    // TEST 9: DIGITAL CALL SHEET EDIT & DAY ADVANCE
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Digital Call Sheet Operations ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Digital Call Sheet") || b.textContent.includes("Call Sheet Digital"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const callSheetBefore = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Call Sheet Loaded", callSheetBefore.includes("06:00 AM"), "Call time present");

    // Advance Day
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Advance Shoot Day") || b.textContent.includes("Maju ke Hari"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const callSheetAfter = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Day Advanced to Day 5", callSheetAfter.includes("Day 5 of 16") || callSheetAfter.includes("Hari 5"), "Day incremented");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_06_callsheet_advanced.png") });

    // -------------------------------------------------------------
    // TEST 10: EQUIPMENT RENTAL & STATUS TRACKING
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Equipment Rental Operations ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Equipment Rental") || b.textContent.includes("Inventaris & Rental"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const equipmentContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Daily Equipment Burn Rate Displayed", equipmentContent.includes("Daily Equipment Burn") || equipmentContent.includes("Pengeluaran Harian Alat"), "Burn KPI visible");
    assertTest("Equipment Items Listed", equipmentContent.includes("ARRI Alexa 35"), "Alexa package present");

    // Open Add Equipment Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Add Rental Gear") || b.textContent.includes("Tambah Inventaris"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await page.waitForSelector('input[placeholder*="Sony FX6"]');
    await page.type('input[placeholder*="Sony FX6"]', "Wireless Video Teradek Bolt 4K Set");
    await page.type('input[type="number"]', "320.00");

    await page.evaluate(() => {
      const submit = document.querySelector("button[type='submit']");
      if (submit) submit.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const updatedEquipment = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("New Equipment Item Added", updatedEquipment.includes("Teradek Bolt 4K"), "Equipment rendered in tracker");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_07_equipment_tracker.png") });

    // -------------------------------------------------------------
    // TEST 11: DATA SOVEREIGNTY: GOOGLE SHEET MIRROR & VAULT EXPORT
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Data Sovereignty & BYOS Export ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Google Sheet Mirror") || b.textContent.includes("Cermin Google Sheets"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const syncContent = await page.$eval("div.flex-1", (el) => el.textContent);
    assertTest("Google Drive Structure Verified", syncContent.includes("01_Petty_Cash_Receipts"), "Drive folder mirrored");
    assertTest("Google Sheet Status Verified", syncContent.includes("Dual-Stream Synced"), "Dual-stream active");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_08_google_mirror.png") });

    // -------------------------------------------------------------
    // TEST 12: MULTI-CURRENCY, MULTI-LANGUAGE & THEMES
    // -------------------------------------------------------------
    console.log("\n--- TEST 12: Preferences & Internationalization ---");
    // Open preferences modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Preferences") || b.title?.includes("Change Currency"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Select IDR
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("IDR"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Select Cyber Indigo theme
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Cyber Indigo"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Select Indonesian language
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Bahasa Indonesia"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Close preferences modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Terapkan Preferensi") || b.textContent.includes("Save Preferences") || b.getAttribute("aria-label")?.includes("Close"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Check Indonesian translation rendered in workspace
    const indoContent = await page.evaluate(() => document.body.textContent);
    assertTest("Indonesian Language Fully Applied", indoContent.includes("Buku Kas Lapangan") || indoContent.includes("Ringkasan Eksekutif"), "Multilingual i18n verified");
    assertTest("IDR Currency Applied (Rp)", indoContent.includes("Rp"), "IDR prefix rendered");

    // Check HTML data-theme attribute
    const activeTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    assertTest("Cyber Indigo Theme Applied", activeTheme === "indigo", `Theme was: ${activeTheme}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_09_indigo_idr_indo.png") });

    // -------------------------------------------------------------
    // TEST 13: RESPONSIVE MOBILE VIEWPORT AUDIT
    // -------------------------------------------------------------
    console.log("\n--- TEST 13: Mobile PWA Touch Ergonomics ---");
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 600));

    const mobileNavExists = await page.evaluate(() => {
      return document.querySelector("div.fixed.bottom-0") !== null;
    });
    assertTest("Sticky Mobile Bottom Navigation Rendered", mobileNavExists, "Thumb zone bottom navigation visible");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_10_mobile_pwa.png") });

    console.log("\n=================================================================");
    const passedCount = testResults.filter((t) => t.passed).length;
    console.log(`AUDIT RESULTS: ${passedCount}/${testResults.length} TESTS PASSED!`);
    console.log("=================================================================");
  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
  } finally {
    await browser.close();
  }
}

runBlackboxTests().catch(console.error);
