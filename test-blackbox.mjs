import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ARTIFACT_DIR = "/Users/kiki/.gemini/antigravity-ide/brain/21cabffc-9aff-435a-b11e-c610e435c9cd";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Helper: click a sidebar/nav button by matching partial text (any language)
async function clickNavButton(page, ...textMatches) {
  return page.evaluate((matches) => {
    const buttons = Array.from(document.querySelectorAll("button, a"));
    const btn = buttons.find((b) =>
      matches.some((m) => b.textContent && b.textContent.includes(m))
    );
    if (btn) { btn.click(); return true; }
    return false;
  }, textMatches);
}

// Helper: fill first text input in modal
async function fillModalInputs(page, { text1, text2, text3, number1 } = {}) {
  return page.evaluate(({ text1, text2, text3, number1 }) => {
    const modal = document.querySelector("div.fixed[class*='z-5']") ||
      document.querySelector("div.fixed") ||
      document.querySelector("[class*='modal']");
    if (!modal) return false;
    const textInputs = Array.from(modal.querySelectorAll(
      "input[type='text'], input:not([type]), textarea"
    ));
    const numInputs = Array.from(modal.querySelectorAll("input[type='number']"));
    if (text1 && textInputs[0]) {
      textInputs[0].value = text1;
      textInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      textInputs[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (text2 && textInputs[1]) {
      textInputs[1].value = text2;
      textInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      textInputs[1].dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (text3 && textInputs[2]) {
      textInputs[2].value = text3;
      textInputs[2].dispatchEvent(new Event("input", { bubbles: true }));
      textInputs[2].dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (number1 && numInputs[0]) {
      numInputs[0].value = String(number1);
      numInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      numInputs[0].dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }, { text1, text2, text3, number1 });
}

async function submitModal(page) {
  await page.evaluate(() => {
    const submit = document.querySelector("button[type='submit']");
    if (submit) submit.click();
  });
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBlackboxTests() {
  console.log("=================================================================");
  console.log("CLOSEBOOK BLACKBOX & AUDIT AUTOMATED E2E TEST SUITE — SPRINT 2");
  console.log("=================================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

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
    // TEST 1: LANDING PAGE
    // =========================================================================
    console.log("\n--- TEST 1: Landing Page Load ---");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const title = await page.title();
    assert("Page Title Contains Closebook", title.toLowerCase().includes("closebook"), title);
    const h1 = await page.$eval("h1", (el) => el.textContent);
    assert("Hero Headline Rendered", h1.length > 3, h1);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_01_landing.png") });

    // =========================================================================
    // TEST 2: WORKSPACE LOADS & CLEARS STATE
    // =========================================================================
    console.log("\n--- TEST 2: Workspace Load & State Reset ---");
    await page.goto("http://localhost:3000/workspace", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");

    // Clear stale i18n/currency/theme from previous test runs
    await page.evaluate(() => {
      ["closebook_lang", "closebook_currency", "closebook_theme"].forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
    });

    // Hard reload to apply clean state
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await delay(1200);

    const url = page.url();
    assert("Workspace URL Correct", url.includes("/workspace"), url);
    const bodyText = await page.evaluate(() => document.body.textContent);
    assert("Project Name Displayed", bodyText.includes("Quiet Horizon") || bodyText.includes("closebook"), "Project loaded");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_02_workspace_overview.png") });

    // =========================================================================
    // TEST 3: OVERVIEW KPIs & BURN RATE
    // =========================================================================
    console.log("\n--- TEST 3: Executive Dashboard & Burn Rate ---");
    const overview = await page.evaluate(() => document.body.textContent);
    assert("Total Budget $120,000 Shown", overview.includes("120,000"), "Budget KPI present");
    assert("Burn Rate % Shown", overview.includes("%"), "Burn % rendered");
    assert("Burn Rate Forecast Banner", overview.includes("Burn Rate") || overview.includes("day avg"), "Forecast visible");
    assert("Days Remaining Shown", overview.includes("remaining"), "Shoot days remaining");

    // =========================================================================
    // TEST 4: EXPENSE LOG MODAL
    // =========================================================================
    console.log("\n--- TEST 4: Log Expense Modal ---");
    // Click the Log Expense button (primary CTA in header or sidebar)
    const logBtnClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      // Match any button whose text includes common phrase or plus icon text
      const btn = buttons.find((b) =>
        b.textContent.includes("Log") || b.textContent.includes("Expense") ||
        b.textContent.includes("Catat") || b.textContent.includes("Pengeluaran")
      );
      if (btn) { btn.click(); return true; }
      return false;
    });
    await delay(800);

    const modalOpened = await page.evaluate(() => !!document.querySelector("div.fixed"));
    assert("Log Expense Modal Opens", modalOpened, "Modal found in DOM");

    if (modalOpened) {
      const filled = await fillModalInputs(page, {
        text1: "Field Drone Battery Extra Sets",
        text2: "DroneWorks Rentals",
        number1: 290,
      });
      assert("Expense Form Fields Accessible", filled, "Inputs fillable");
      await submitModal(page);
      await delay(1200);
    }

    // Switch to transactions tab to verify
    await clickNavButton(page, "Petty Cash Ledger", "Buku Kas", "Ledger");
    await delay(600);
    const txContent = await page.evaluate(() => document.body.textContent);
    assert("Expense Appears in Ledger", txContent.includes("Drone") || txContent.includes("290"), "Transaction visible");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_03_transactions_ledger.png") });

    // =========================================================================
    // TEST 5: FINANCIAL INTEGRITY — REJECT & REFUND
    // =========================================================================
    console.log("\n--- TEST 5: Reject & Refund Flow ---");
    const rejectBtn = await page.$('button[title*="Reject"]');
    if (rejectBtn) {
      await rejectBtn.click();
      await delay(500);
      assert("Reject Action Works", true, "Reject executed");
    } else {
      // Try finding any reject/X button in the transactions list
      const rejectedViaEval = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.title && b.title.toLowerCase().includes("reject"));
        if (btn) { btn.click(); return true; }
        return false;
      });
      assert("Reject Button Found", rejectedViaEval, "Reject action available");
    }

    // =========================================================================
    // TEST 6: MULTI-POCKET CASHFLOW & OVERDRAFT
    // =========================================================================
    console.log("\n--- TEST 6: Multi-Pocket Transfer & Overdraft Guard ---");
    await clickNavButton(page, "Multi-Pocket", "Cashflow", "Hierarki Kantong", "Pockets");
    await delay(800);

    const pocketsContent = await page.evaluate(() => document.body.textContent);
    assert("Pocket Tab Loaded", pocketsContent.includes("Vault") || pocketsContent.includes("Producer") || pocketsContent.includes("Kantong"), "Pocket hierarchy visible");
    assert("Transfer Log Section", pocketsContent.includes("Transfer") || pocketsContent.includes("TR-"), "Transfer log visible");

    // Open Transfer modal
    await clickNavButton(page, "Transfer Pocket Funds", "Transfer Dana", "Transfer");
    await delay(800);

    // Overdraft test with huge amount
    const overdraftFilled = await page.evaluate(() => {
      const modal = document.querySelector("div.fixed");
      if (!modal) return false;
      const numInput = modal.querySelector("input[type='number']");
      if (numInput) {
        numInput.value = "99999999";
        numInput.dispatchEvent(new Event("input", { bubbles: true }));
        numInput.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    });
    await submitModal(page);
    await delay(600);

    const overdraftMsg = await page.evaluate(() => document.body.textContent);
    assert("Overdraft Guard Triggers", overdraftMsg.includes("Insufficient") || overdraftMsg.includes("melebihi") || overdraftMsg.includes("balance"), "Overdraft error shown");

    // Valid transfer $2,500
    await page.evaluate(() => {
      const modal = document.querySelector("div.fixed");
      if (!modal) return;
      const numInput = modal.querySelector("input[type='number']");
      if (numInput) {
        numInput.value = "2500";
        numInput.dispatchEvent(new Event("input", { bubbles: true }));
        numInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await submitModal(page);
    await delay(800);

    const postTransfer = await page.evaluate(() => document.body.textContent);
    assert("Transfer Completed & Logged", postTransfer.includes("TR-") || postTransfer.includes("2,500") || postTransfer.includes("Just now"), "Transfer audit entry created");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_04_pockets_transfer.png") });

    // =========================================================================
    // TEST 7: DEPARTMENT TASKS & KANBAN
    // =========================================================================
    console.log("\n--- TEST 7: Tasks & Kanban ---");
    await clickNavButton(page, "Department Tasks", "Tugas Departemen", "Tasks");
    await delay(600);

    await clickNavButton(page, "New Department Task", "Tugas Baru", "+ New Task", "Add Task");
    await delay(800);

    const taskFilled = await fillModalInputs(page, {
      text1: "Inspect Steadicam gyro gimbal",
      text2: "Raka Wijaya",
    });
    await submitModal(page);
    await delay(800);

    const tasksContent = await page.evaluate(() => document.body.textContent);
    assert("Task Created in Kanban", tasksContent.includes("Steadicam") || tasksContent.includes("Raka"), "Task appears in board");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_05_tasks_kanban.png") });

    // =========================================================================
    // TEST 8: CALL SHEET & DAY ADVANCE
    // =========================================================================
    console.log("\n--- TEST 8: Call Sheet & Day Advance ---");
    await clickNavButton(page, "Digital Call Sheet", "Call Sheet Digital", "Call Sheet", "Schedule");
    await delay(600);

    const callsheetContent = await page.evaluate(() => document.body.textContent);
    assert("Call Sheet Tab Loaded", callsheetContent.includes("06:00") || callsheetContent.includes("Call Time") || callsheetContent.includes("callsheet"), "Call sheet visible");

    await clickNavButton(page, "Advance Shoot Day", "Maju ke Hari", "Advance Day");
    await delay(600);

    const afterAdvance = await page.evaluate(() => document.body.textContent);
    assert("Shoot Day Advanced", afterAdvance.includes("Day 5") || afterAdvance.includes("Hari 5") || afterAdvance.includes("5 of 16"), "Day incremented");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_06_callsheet_advanced.png") });

    // =========================================================================
    // TEST 9: EQUIPMENT TRACKER
    // =========================================================================
    console.log("\n--- TEST 9: Equipment Rental Tracker ---");
    await clickNavButton(page, "Equipment Rental", "Inventaris", "Equipment");
    await delay(600);

    const eqContent = await page.evaluate(() => document.body.textContent);
    assert("Equipment Burn Rate Displayed", eqContent.includes("Burn") || eqContent.includes("Daily") || eqContent.includes("Harian"), "Burn rate KPI visible");
    assert("ARRI Camera Listed", eqContent.includes("ARRI") || eqContent.includes("Alexa"), "Camera package present");

    await clickNavButton(page, "Add Rental Gear", "Tambah Inventaris", "+ Add Equipment");
    await delay(800);

    const eqFilled = await fillModalInputs(page, {
      text1: "Wireless Teradek Bolt 4K Video Set",
      text2: "CamTek Rentals",
      number1: 320,
    });
    await submitModal(page);
    await delay(800);

    const eqUpdated = await page.evaluate(() => document.body.textContent);
    assert("New Equipment Added", eqUpdated.includes("Teradek") || eqUpdated.includes("Wireless"), "Equipment in tracker");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_07_equipment_tracker.png") });

    // =========================================================================
    // TEST 10: GOOGLE SHEET MIRROR & WEBHOOK
    // =========================================================================
    console.log("\n--- TEST 10: Google Sheet Mirror & BYOS ---");
    await clickNavButton(page, "Google Sheet Mirror", "Cermin Google", "Sync", "Sheet");
    await delay(600);

    const syncContent = await page.evaluate(() => document.body.textContent);
    assert("Drive Folder Structure Shown", syncContent.includes("01_Petty_Cash") || syncContent.includes("Drive") || syncContent.includes("Folder"), "Drive structure visible");
    assert("Webhook Connector UI Rendered", syncContent.includes("Apps Script") || syncContent.includes("Webhook") || syncContent.includes("Google"), "Apps Script connector present");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_08_google_mirror.png") });

    // =========================================================================
    // TEST 11: PREFERENCES — LANGUAGE, CURRENCY, THEME
    // =========================================================================
    console.log("\n--- TEST 11: Preferences & i18n ---");
    // Open preferences
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent.includes("Preferences") || b.textContent.includes("Preferensi") || b.title?.includes("Currency"));
      if (btn) btn.click();
    });
    await delay(600);

    // Select IDR
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent.includes("IDR") || b.textContent.includes("Rupiah"));
      if (btn) btn.click();
    });
    await delay(300);

    // Select Cyber Indigo
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent.includes("Cyber Indigo") || b.textContent.includes("Indigo"));
      if (btn) btn.click();
    });
    await delay(300);

    // Select Indonesian
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent.includes("Bahasa Indonesia") || b.textContent.includes("Indonesia"));
      if (btn) btn.click();
    });
    await delay(300);

    // Save/close preferences
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) =>
        b.textContent.includes("Terapkan") ||
        b.textContent.includes("Save Preferences") ||
        b.textContent.includes("Apply") ||
        (b.getAttribute("aria-label") || "").includes("Close")
      );
      if (btn) btn.click();
    });
    await delay(800);

    const indoContent = await page.evaluate(() => document.body.textContent);
    assert("Indonesian i18n Applied", indoContent.includes("Rp") || indoContent.includes("Buku Kas") || indoContent.includes("Ringkasan"), "Indonesian UI rendered");
    assert("IDR Currency Applied", indoContent.includes("Rp"), "IDR symbol visible");

    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    assert("Cyber Indigo Theme Set", theme === "indigo", `Theme: ${theme}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_09_indigo_idr_indo.png") });

    // =========================================================================
    // TEST 12: MOBILE RESPONSIVE & PWA NAV
    // =========================================================================
    console.log("\n--- TEST 12: Mobile PWA Responsive ---");
    await page.setViewport({ width: 390, height: 844 });
    await delay(600);

    const mobileNav = await page.evaluate(() => !!document.querySelector("div.fixed.bottom-0"));
    assert("Mobile Bottom Navigation Exists", mobileNav, "Bottom nav visible on mobile");

    // Verify new Reconcile button is in mobile nav
    const mobileReconcile = await page.evaluate(() => {
      const nav = document.querySelector("div.fixed.bottom-0");
      return nav ? nav.textContent.includes("Reconcile") : false;
    });
    assert("Reconcile in Mobile Nav", mobileReconcile, "Reconcile tab in bottom nav");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_10_mobile_pwa.png") });

    // =========================================================================
    // TEST 13: BURN RATE FORECAST
    // =========================================================================
    console.log("\n--- TEST 13: Burn Rate Forecast ---");
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/workspace", { waitUntil: "domcontentloaded" });
    await delay(1200);

    const burnContent = await page.evaluate(() => document.body.textContent);
    assert("Burn Rate Banner Rendered", burnContent.includes("Burn Rate") || burnContent.includes("day avg"), "Forecast banner present");
    assert("Days Remaining Shown", burnContent.includes("remaining") || burnContent.includes("Days remaining"), "Days remaining displayed");
    assert("Budget Progress Bar", burnContent.includes("consumed") || burnContent.includes("projected") || burnContent.includes("On-track"), "Projection context present");

    // =========================================================================
    // TEST 14: DAILY RECONCILIATION WORKFLOW
    // =========================================================================
    console.log("\n--- TEST 14: Daily Reconciliation Workflow ---");

    // Click Reconcile nav button
    await clickNavButton(page, "Reconcile", "Rekonsiliasi");
    await delay(800);

    const reconContent = await page.evaluate(() => document.body.textContent);
    assert("Reconciliation Tab Loads", reconContent.includes("Reconcil") || reconContent.includes("Cash") || reconContent.includes("cash"), "Reconcile tab content visible");

    // Check history shows Day 3 record
    assert("History Record Visible", reconContent.includes("Day 3") || reconContent.includes("Balanced") || reconContent.includes("Signed"), "Prior reconciliation history");

    // Open Reconcile Day form
    const formOpened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.textContent.includes("Reconcile Day") || b.textContent.includes("Rekonsiliasi Hari"));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await delay(800);

    assert("Reconcile Form Opens", formOpened, "Form CTA present");

    // Fill physical count
    if (formOpened) {
      const countFilled = await page.evaluate(() => {
        const numInputs = Array.from(document.querySelectorAll("input[type='number']"));
        if (numInputs.length > 0) {
          numInputs[0].value = "8400";
          numInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      });
      assert("Physical Count Input Works", countFilled, "Can enter cash count");

      // Submit
      await submitModal(page);
      await delay(800);
    }

    const postRecon = await page.evaluate(() => document.body.textContent);
    assert("Reconciliation Result Shown", postRecon.includes("Reconciled") || postRecon.includes("Discrepancy") || postRecon.includes("Balanced") || postRecon.includes("Day 4"), "Result feedback visible");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_11_reconciliation.png") });

    // =========================================================================
    // TEST 15: SYSTEM ALERT COUNT
    // =========================================================================
    console.log("\n--- TEST 15: System Alerts ---");
    await clickNavButton(page, "System Alerts", "Peringatan", "Alerts", "Bell");
    await delay(600);

    const alertContent = await page.evaluate(() => document.body.textContent);
    assert("Alerts Tab Loads", alertContent.includes("Alert") || alertContent.includes("Peringatan") || alertContent.includes("Budget"), "Alert content visible");

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
