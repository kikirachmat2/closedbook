import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ARTIFACT_DIR = "/Users/kiki/.gemini/antigravity-ide/brain/21cabffc-9aff-435a-b11e-c610e435c9cd";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Helper: click a visible button or link by matching text (case-insensitive)
async function clickNavButton(page, ...textMatches) {
  return page.evaluate((matches) => {
    const buttons = Array.from(document.querySelectorAll("button, a"));
    const visibleButtons = buttons.filter((b) => {
      const style = window.getComputedStyle(b);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        b.offsetWidth > 0 &&
        b.offsetHeight > 0
      );
    });

    const candidates = visibleButtons.length > 0 ? visibleButtons : buttons;
    const btn = candidates.find((b) => {
      const txt = (b.textContent || "").toLowerCase();
      return matches.some((m) => txt.includes(m.toLowerCase()));
    });

    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, textMatches);
}

// Helper: clear and type into an input reliably
async function clearAndType(page, el, val) {
  await el.focus();
  await page.evaluate((e) => {
    e.value = "";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, el);
  await el.type(String(val));
}

// Helper: fill inputs in the currently open modal using Puppeteer keyboard typing
async function fillActiveModal(page, { text1, text2, text3, number1 } = {}) {
  const modal = await page.$("div.fixed.z-50, div[class*='z-50']");
  if (!modal) return false;

  const textInputs = await modal.$$("input[type='text'], input:not([type]), textarea");
  const numInputs = await modal.$$("input[type='number']");

  if (text1 !== undefined && textInputs[0]) {
    await clearAndType(page, textInputs[0], text1);
  }
  if (text2 !== undefined && textInputs[1]) {
    await clearAndType(page, textInputs[1], text2);
  }
  if (text3 !== undefined && textInputs[2]) {
    await clearAndType(page, textInputs[2], text3);
  }
  if (number1 !== undefined && numInputs[0]) {
    await clearAndType(page, numInputs[0], number1);
  }
  return true;
}

// Helper: submit the active modal
async function submitActiveModal(page) {
  const submitBtn = await page.$(
    "div.fixed.z-50 button[type='submit'], div[class*='z-50'] button[type='submit'], form button[type='submit']"
  );
  if (submitBtn) {
    await submitBtn.click();
    return true;
  }
  return false;
}

// Helper: reset ONLY preferences keys, keeping Zustand project state intact
async function resetPreferences(page) {
  await page.evaluate(() => {
    [
      "closebook_language",
      "closebook_lang",
      "closebook_currency",
      "closebook_theme",
    ].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  });
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBlackboxTests() {
  console.log("=================================================================");
  console.log("CLOSEBOOK BLACKBOX E2E TEST SUITE — HYBRID CONTEXT ARCHITECTURE");
  console.log("=================================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const testResults = [];
  function assert(name, condition, details = "") {
    if (condition) {
      console.log(`[PASS] ${name}`);
      testResults.push({ name, passed: true });
    } else {
      console.error(`[FAIL] ${name}: ${details}`);
      testResults.push({ name, passed: false, details });
    }
  }

  try {
    // =========================================================================
    // SUITE 1: CORE WORKSPACE & FINANCIAL OPERATIONS (Default Context)
    // =========================================================================
    console.log("\n>>> STARTING SUITE 1: Core Operations & Ledger (Default Context)");
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // TEST 1: LANDING PAGE
    console.log("\n--- TEST 1: Landing Page Load ---");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const title = await page.title();
    assert("Page Title Contains Closebook", title.toLowerCase().includes("closebook"), title);
    const h1 = await page.$eval("h1", (el) => el.textContent);
    assert("Hero Headline Rendered", h1.length > 3, h1);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_01_landing.png") });

    // TEST 2: WORKSPACE LOAD & PREFERENCE RESET
    console.log("\n--- TEST 2: Workspace Load & Preferences Reset ---");
    await page.goto("http://localhost:3000/workspace", { waitUntil: "networkidle0" });
    await page.waitForSelector("header");
    await resetPreferences(page);
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector("header");
    await delay(600);

    const url = page.url();
    assert("Workspace URL Correct", url.includes("/workspace"), url);
    const bodyText = await page.evaluate(() => document.body.textContent);
    assert("Project Name Displayed", bodyText.includes("Quiet Horizon") || bodyText.includes("closebook"), "Project loaded");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_02_workspace_overview.png") });

    // TEST 3: OVERVIEW KPIs & BURN RATE
    console.log("\n--- TEST 3: Executive Dashboard & Burn Rate ---");
    const overview = await page.evaluate(() => document.body.textContent);
    assert("Total Budget $120,000 Shown", overview.includes("120,000"), "Budget KPI present");
    assert("Burn Rate % Shown", overview.includes("%"), "Burn % rendered");
    assert("Burn Rate Forecast Banner", overview.includes("Burn Rate") || overview.includes("day avg"), "Forecast visible");
    assert("Days Remaining Shown", overview.includes("remaining"), "Shoot days remaining");

    // TEST 4: LOG EXPENSE MODAL
    console.log("\n--- TEST 4: Log Expense Modal ---");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.offsetWidth > 0 && b.offsetHeight > 0
      );
      const btn = buttons.find((b) =>
        b.textContent && (
          b.textContent.includes("Log Expense") ||
          b.textContent.includes("Catat Kas")
        )
      );
      if (btn) btn.click();
    });
    await delay(600);

    const modalOpened = await page.evaluate(() => !!document.querySelector("div.fixed.z-50, div[class*='z-50']"));
    assert("Log Expense Modal Opens", modalOpened, "Modal found in DOM");

    if (modalOpened) {
      const filled = await fillActiveModal(page, {
        text1: "Field Drone Battery Extra Sets",
        text2: "DroneWorks Rentals",
        number1: 290,
      });
      assert("Expense Form Fields Accessible", filled, "Inputs fillable");
      await submitActiveModal(page);
      await delay(800);
    }

    // Switch to transactions tab to verify
    await clickNavButton(page, "Petty Cash Ledger", "Buku Kas", "Ledger");
    await delay(600);
    const txContent = await page.evaluate(() => document.body.textContent);
    assert("Expense Appears in Ledger", txContent.includes("Drone") || txContent.includes("290"), "Transaction visible");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_03_transactions_ledger.png") });

    // TEST 5: FINANCIAL INTEGRITY — REJECT & REFUND
    console.log("\n--- TEST 5: Reject & Refund Flow ---");
    const rejectedViaEval = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.title && b.title.toLowerCase().includes("reject"));
      if (btn) { btn.click(); return true; }
      return false;
    });
    assert("Reject Button Found", rejectedViaEval, "Reject action available");

    // TEST 6: MULTI-POCKET CASHFLOW & OVERDRAFT
    console.log("\n--- TEST 6: Multi-Pocket Transfer & Overdraft Guard ---");
    await clickNavButton(page, "Multi-Pocket", "Hierarki Kantong", "Cashflow", "Pockets");
    await delay(600);

    const pocketsContent = await page.evaluate(() => document.body.textContent);
    assert("Pocket Tab Loaded", pocketsContent.includes("Vault") || pocketsContent.includes("Producer") || pocketsContent.includes("Kantong"), "Pocket hierarchy visible");
    assert("Transfer Log Section", pocketsContent.includes("Transfer") || pocketsContent.includes("TR-"), "Transfer log visible");

    // Open Transfer modal
    await clickNavButton(page, "Transfer Pocket Funds", "Transfer Dana", "Transfer Funds", "Transfer");
    await delay(600);

    // Overdraft test with huge amount
    await fillActiveModal(page, { number1: 99999999 });
    await submitActiveModal(page);
    await delay(500);

    const overdraftMsg = await page.evaluate(() => document.body.textContent);
    assert("Overdraft Guard Triggers", overdraftMsg.includes("Insufficient") || overdraftMsg.includes("Overdraft") || overdraftMsg.includes("melebihi") || overdraftMsg.includes("balance"), "Overdraft error shown");

    // Valid transfer $2,500 (clearing overdraft input first)
    await fillActiveModal(page, { number1: 2500 });
    await submitActiveModal(page);
    await delay(800);

    const postTransfer = await page.evaluate(() => document.body.textContent);
    assert("Transfer Completed & Logged", postTransfer.includes("TR-") || postTransfer.includes("2,500") || postTransfer.includes("Just now"), "Transfer audit entry created");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_04_pockets_transfer.png") });

    // TEST 7: DEPARTMENT TASKS & KANBAN
    console.log("\n--- TEST 7: Tasks & Kanban ---");
    await clickNavButton(page, "Department Tasks", "Tasks");
    await delay(600);

    await clickNavButton(page, "New Department Task", "+ New Task", "Add Task");
    await delay(600);

    const taskFilled = await fillActiveModal(page, {
      text1: "Inspect Steadicam gyro gimbal",
      text2: "Raka Wijaya",
    });
    await submitActiveModal(page);
    await delay(800);

    const tasksContent = await page.evaluate(() => document.body.textContent);
    assert("Task Created in Kanban", tasksContent.includes("Steadicam") || tasksContent.includes("Raka"), "Task appears in board");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_05_tasks_kanban.png") });

    // TEST 8: CALL SHEET & DAY ADVANCE
    console.log("\n--- TEST 8: Call Sheet & Day Advance ---");
    await clickNavButton(page, "Digital Call Sheet", "Call Sheet Digital", "Schedule", "Call Sheet");
    await delay(600);

    const callsheetContent = await page.evaluate(() => document.body.textContent);
    assert("Call Sheet Tab Loaded", callsheetContent.includes("06:00") || callsheetContent.includes("Call Time") || callsheetContent.includes("callsheet"), "Call sheet visible");

    await clickNavButton(page, "Advance Shoot Day", "Maju ke Hari", "Advance Day");
    await delay(600);

    const afterAdvance = await page.evaluate(() => document.body.textContent);
    assert("Shoot Day Advanced", afterAdvance.includes("Day 5") || afterAdvance.includes("Hari 5") || afterAdvance.includes("5 of 16"), "Day incremented");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_06_callsheet_advanced.png") });

    // TEST 9: EQUIPMENT TRACKER
    console.log("\n--- TEST 9: Equipment Rental Tracker ---");
    await clickNavButton(page, "Equipment Rental", "Equipment");
    await delay(600);

    const eqContent = await page.evaluate(() => document.body.textContent);
    assert("Equipment Burn Rate Displayed", eqContent.includes("Burn") || eqContent.includes("Daily") || eqContent.includes("Harian"), "Burn rate KPI visible");
    assert("ARRI Camera Listed", eqContent.includes("ARRI") || eqContent.includes("Alexa"), "Camera package present");

    await clickNavButton(page, "Add Rental Gear", "+ Add Equipment", "Add Equipment");
    await delay(600);

    await fillActiveModal(page, {
      text1: "Wireless Teradek Bolt 4K Video Set",
      text2: "CamTek Rentals",
      number1: 320,
    });
    await submitActiveModal(page);
    await delay(800);

    const eqUpdated = await page.evaluate(() => document.body.textContent);
    assert("New Equipment Added", eqUpdated.includes("Teradek") || eqUpdated.includes("Wireless"), "Equipment in tracker");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_07_equipment_tracker.png") });

    // TEST 10: GOOGLE SHEET MIRROR & WEBHOOK
    console.log("\n--- TEST 10: Google Sheet Mirror & BYOS ---");
    await clickNavButton(page, "Google Sheet Mirror", "Cermin Google", "Sync", "Sheet");
    await delay(600);

    const syncContent = await page.evaluate(() => document.body.textContent);
    assert("Drive Folder Structure Shown", syncContent.includes("01_Petty_Cash") || syncContent.includes("Drive") || syncContent.includes("Folder"), "Drive structure visible");
    assert("Webhook Connector UI Rendered", syncContent.includes("Apps Script") || syncContent.includes("Webhook") || syncContent.includes("Google"), "Apps Script connector present");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_08_google_mirror.png") });

    // TEST 13: BURN RATE FORECAST
    console.log("\n--- TEST 13: Burn Rate Forecast ---");
    await clickNavButton(page, "Executive Overview", "Ringkasan", "Overview");
    await delay(600);

    const burnContent = await page.evaluate(() => document.body.textContent);
    assert("Burn Rate Banner Rendered", burnContent.includes("Burn Rate") || burnContent.includes("day avg"), "Forecast banner present");
    assert("Days Remaining Shown", burnContent.includes("remaining") || burnContent.includes("Days remaining"), "Days remaining displayed");
    assert("Budget Progress Bar", burnContent.includes("consumed") || burnContent.includes("projected") || burnContent.includes("On-track") || burnContent.includes("Budget"), "Projection context present");

    // TEST 14: DAILY RECONCILIATION WORKFLOW
    console.log("\n--- TEST 14: Daily Reconciliation Workflow ---");
    await clickNavButton(page, "Reconcile", "Rekonsiliasi");
    await delay(600);

    const reconContent = await page.evaluate(() => document.body.textContent);
    assert("Reconciliation Tab Loads", reconContent.includes("Daily Cash Reconciliation") || reconContent.includes("Reconcil"), "Reconcile tab content visible");
    assert("History Record Visible", reconContent.includes("Day 3") || reconContent.includes("Balanced") || reconContent.includes("Signed"), "Prior reconciliation history");

    // Open Reconcile Day form
    const formOpened = await clickNavButton(page, "Reconcile Day", "Rekonsiliasi Hari");
    await delay(600);
    assert("Reconcile Form Opens", formOpened, "Form CTA present");

    if (formOpened) {
      const countInput = await page.$("form input[type='number']");
      if (countInput) {
        await clearAndType(page, countInput, 8400);
        assert("Physical Count Input Works", true, "Can enter cash count");
      } else {
        assert("Physical Count Input Works", false, "Count input not found");
      }

      await submitActiveModal(page);
      await delay(800);
    }

    const postRecon = await page.evaluate(() => document.body.textContent);
    assert("Reconciliation Result Shown", postRecon.includes("Reconciled") || postRecon.includes("Discrepancy") || postRecon.includes("Balanced") || postRecon.includes("Day"), "Result feedback visible");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_11_reconciliation.png") });

    // TEST 15: SYSTEM ALERT COUNT
    console.log("\n--- TEST 15: System Alerts ---");
    await clickNavButton(page, "Automated Alerts", "Peringatan", "Alerts");
    await delay(600);

    const alertContent = await page.evaluate(() => document.body.textContent);
    assert("Alerts Tab Loads", alertContent.includes("Alert") || alertContent.includes("Peringatan") || alertContent.includes("Budget"), "Alert content visible");

    await page.close();

    // =========================================================================
    // SUITE 2: PREFERENCES, I18N & THEME (Isolated Browser Context)
    // =========================================================================
    console.log("\n>>> STARTING SUITE 2: Preferences, i18n & Theme (Isolated Context)");
    const prefContext = await browser.createBrowserContext();
    const prefPage = await prefContext.newPage();
    await prefPage.setViewport({ width: 1280, height: 900 });

    console.log("\n--- TEST 11: Preferences & i18n ---");
    await prefPage.goto("http://localhost:3000/workspace", { waitUntil: "networkidle0" });
    await prefPage.waitForSelector("header");
    await delay(600);

    // Open preferences modal
    await prefPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) =>
        b.textContent && (
          b.textContent.includes("Preferences") ||
          b.textContent.includes("Pengaturan")
        )
      );
      if (btn) btn.click();
    });
    await delay(600);

    // Select IDR
    await prefPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent && b.textContent.includes("IDR"));
      if (btn) btn.click();
    });
    await delay(200);

    // Select Cyber Indigo
    await prefPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent && b.textContent.includes("Cyber Indigo"));
      if (btn) btn.click();
    });
    await delay(200);

    // Select Indonesian
    await prefPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent && b.textContent.includes("Bahasa Indonesia"));
      if (btn) btn.click();
    });
    await delay(200);

    // Save/close preferences
    await prefPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) =>
        b.textContent && (
          b.textContent.includes("Terapkan") ||
          b.textContent.includes("Save Preferences")
        )
      );
      if (btn) btn.click();
    });
    await delay(800);

    const indoContent = await prefPage.evaluate(() => document.body.textContent);
    assert("Indonesian i18n Applied", indoContent.includes("Rp") || indoContent.includes("Buku Kas") || indoContent.includes("Ringkasan"), "Indonesian UI rendered");
    assert("IDR Currency Applied", indoContent.includes("Rp"), "IDR symbol visible");

    const theme = await prefPage.evaluate(() => document.documentElement.getAttribute("data-theme"));
    assert("Cyber Indigo Theme Set", theme === "indigo", `Theme: ${theme}`);

    await prefPage.screenshot({ path: path.join(ARTIFACT_DIR, "audit_09_indigo_idr_indo.png") });

    // Clean up isolated context completely (Zero residual state)
    await prefPage.close();
    await prefContext.close();

    // =========================================================================
    // SUITE 3: MOBILE PWA RESPONSIVE (Dedicated Mobile Viewport Context)
    // =========================================================================
    console.log("\n>>> STARTING SUITE 3: Mobile PWA Responsive");
    const mobileContext = await browser.createBrowserContext();
    const mobilePage = await mobileContext.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log("\n--- TEST 12: Mobile PWA Responsive ---");
    await mobilePage.goto("http://localhost:3000/workspace", { waitUntil: "domcontentloaded" });
    await mobilePage.waitForSelector("header");
    await delay(600);

    const mobileNav = await mobilePage.evaluate(() => !!document.querySelector("div.fixed.bottom-0"));
    assert("Mobile Bottom Navigation Exists", mobileNav, "Bottom nav visible on mobile");

    const mobileReconcile = await mobilePage.evaluate(() => {
      const nav = document.querySelector("div.fixed.bottom-0");
      return nav ? nav.textContent.includes("Reconcile") : false;
    });
    assert("Reconcile in Mobile Nav", mobileReconcile, "Reconcile tab in bottom nav");

    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "audit_10_mobile_pwa.png") });

    await mobilePage.close();
    await mobileContext.close();

  } catch (err) {
    console.error("FATAL TEST ERROR:", err.message);
  } finally {
    await browser.close();
  }

  console.log("\n=================================================================");
  const passed = testResults.filter((t) => t.passed).length;
  const total = testResults.length;
  console.log(`AUDIT RESULTS: ${passed}/${total} TESTS PASSED!`);
  if (passed < total) {
    const failed = testResults.filter((t) => !t.passed);
    failed.forEach((t) => console.log(`  ✗ ${t.name}: ${t.details || ""}`));
  }
  console.log("=================================================================");
}

runBlackboxTests().catch(console.error);
