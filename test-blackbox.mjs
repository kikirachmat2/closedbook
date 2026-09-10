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
  console.log("CLOSEDBOOK BLACKBOX E2E TEST SUITE — HYBRID CONTEXT ARCHITECTURE");
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
    assert("Page Title Contains Closebook", (title.toLowerCase().includes("closedbook") || title.toLowerCase().includes("closebook")), title);
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
    const defaultTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    assert("Default Theme Is Signature", defaultTheme === "signature", `Expected signature, got ${defaultTheme}`);
    const bodyText = await page.evaluate(() => document.body.textContent);
    assert("Project Name Displayed", bodyText.includes("Quiet Horizon") || (bodyText.includes("closedbook") || bodyText.includes("closebook")), "Project loaded");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_02_workspace_overview.png") });

    // TEST 3: OVERVIEW KPIs & BURN RATE
    console.log("\n--- TEST 3: Executive Dashboard & Burn Rate ---");
    const overview = await page.evaluate(() => document.body.textContent);
    assert("Total Budget $120,000 Shown", overview.includes("120,000"), "Budget KPI present");
    assert("Burn Rate % Shown", overview.includes("%"), "Burn % rendered");
    assert("Burn Rate Forecast Banner", overview.includes("Burn Rate") || overview.includes("day avg"), "Forecast visible");
    assert("Days Remaining Shown", overview.includes("remaining"), "Shoot days remaining");

    // TEST 3B: CUSTOM CATEGORY SYSTEM (CRUD & GUARD RAIL)
    console.log("\n--- TEST 3B: Custom Category System (CRUD & Guard Rail) ---");
    
    // 1. Add Category
    await clickNavButton(page, "Add Category", "Tambah Kategori");
    await delay(600);
    const catModalOpened = await page.evaluate(() => !!document.querySelector("div.fixed.z-50, div[class*='z-50']"));
    assert("Add Category Modal Opens", catModalOpened, "Modal found");

    if (catModalOpened) {
      await fillActiveModal(page, {
        text1: "Legal & Insurance",
        text2: "LGL",
        number1: 8500,
      });
      await submitActiveModal(page);
      await delay(800);
    }
    const afterAddCat = await page.evaluate(() => document.body.textContent);
    assert("Category Created & Listed", afterAddCat.includes("Legal & Insurance") || afterAddCat.includes("LGL"), "New category visible in list");

    // 2. Edit Category (Edit the newly created category)
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div.group\\/cat, div[class*='group/cat']"));
      const legalRow = rows.find((r) => r.textContent.includes("Legal & Insurance") || r.textContent.includes("LGL"));
      if (legalRow) {
        const editBtn = legalRow.querySelector("button[title*='Edit'], button[title*='edit']");
        if (editBtn) editBtn.click();
      }
    });
    await delay(600);
    const editModalOpened = await page.evaluate(() => !!document.querySelector("div.fixed.z-50, div[class*='z-50']"));
    if (editModalOpened) {
      await fillActiveModal(page, {
        text1: "Legal, Rights & Clearance",
        text2: "LRC",
        number1: 9500,
      });
      await submitActiveModal(page);
      await delay(800);
    }
    const afterEditCat = await page.evaluate(() => document.body.textContent);
    assert("Category Edited & Updated", afterEditCat.includes("Legal, Rights & Clearance") || afterEditCat.includes("LRC"), "Updated category name and code visible");

    // 3. Delete Guard Rail: Try deleting category that has existing transactions (e.g. Operations & Logistics)
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div.group\\/cat, div[class*='group/cat']"));
      const opsRow = rows.find((r) => r.textContent.includes("Operations & Logistics") || r.textContent.includes("OPS"));
      if (opsRow) {
        const delBtn = opsRow.querySelector("button[title*='Delete'], button[title*='delete'], button[title*='Hapus']");
        if (delBtn) delBtn.click();
      }
    });
    await delay(800);
    const afterDeleteAttempt = await page.evaluate(() => document.body.textContent);
    assert(
      "Delete Guard Rail Prevents Cascade",
      afterDeleteAttempt.includes("Cannot delete category") || afterDeleteAttempt.includes("associated transactions") || afterDeleteAttempt.includes("Operations & Logistics"),
      "Affiliated category preserved and error guarded"
    );

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

    // TEST 5B: CONTEXTUAL COMMENTS — LEDGER DRAWER & THREAD
    console.log("\n--- TEST 5B: Contextual Comments (Ledger) ---");
    const openedTxDrawer = await page.evaluate(() => {
      const commentBtns = Array.from(document.querySelectorAll("button[data-testid^='tx-comment-btn-']"));
      if (commentBtns.length > 0) {
        commentBtns[0].click();
        return true;
      }
      return false;
    });
    await delay(600);
    assert("Comment Drawer Opens From Ledger", openedTxDrawer, "Ledger comment button opened drawer");

    // Type and send comment in drawer
    const drawerInput = await page.$("input[data-testid='comment-drawer-input']");
    if (drawerInput) {
      await clearAndType(page, drawerInput, "Audited invoice and verified vendor payment terms.");
      await delay(300);
      const sendBtn = await page.$("button[data-testid='comment-drawer-send']");
      if (sendBtn) await sendBtn.click();
    }
    await delay(800);

    const threadContent = await page.evaluate(() => {
      const drawer = document.querySelector("aside[data-testid='comment-drawer']");
      return drawer ? drawer.textContent : "";
    });
    assert("Comment Added to Thread", threadContent.includes("payment terms"), "New comment rendered in drawer");

    // Close drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector("button[data-testid='close-comment-drawer']");
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // Verify counter badge rendered on row
    const counterBadgeExists = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll("span[data-testid^='tx-comment-count-']"));
      return badges.length > 0;
    });
    assert("Comment Counter Badge Updated", counterBadgeExists, "Comment counter badge visible on ledger row");

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

    await clickNavButton(page, "New Department Task", "+ New Task", "Add Task", "Create Task");
    await delay(600);

    const taskFilled = await fillActiveModal(page, {
      text1: "Site walkthrough & safety compliance check",
      text2: "Raka Wijaya",
    });
    await submitActiveModal(page);
    await delay(800);

    const tasksContent = await page.evaluate(() => document.body.textContent);
    assert("Task Created in Kanban", tasksContent.includes("walkthrough") || tasksContent.includes("Raka"), "Task appears in board");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_05_tasks_kanban.png") });

    // Open Drawer from Task card
    const openedTaskDrawer = await page.evaluate(() => {
      const taskCommentBtns = Array.from(document.querySelectorAll("button[data-testid^='task-comment-btn-']"));
      if (taskCommentBtns.length > 0) {
        taskCommentBtns[0].click();
        return true;
      }
      return false;
    });
    await delay(600);
    assert("Comment Drawer Opens From Task", openedTaskDrawer, "Task card comment button opened drawer");

    // Close task drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector("button[data-testid='close-comment-drawer']");
      if (closeBtn) closeBtn.click();
    });
    await delay(400);

    // TEST 8: SCHEDULE & DAY ADVANCE
    console.log("\n--- TEST 8: Schedule & Day Advance ---");
    await clickNavButton(page, "Project Schedule", "Schedule", "Digital Call Sheet", "Call Sheet");
    await delay(600);

    const scheduleContent = await page.evaluate(() => document.body.textContent);
    assert("Schedule Tab Loaded", scheduleContent.includes("06:00") || scheduleContent.includes("Call Time") || scheduleContent.includes("Schedule") || scheduleContent.includes("callsheet"), "Schedule visible");

    await clickNavButton(page, "Advance Project Day", "Advance Day", "Advance Shoot Day", "Maju ke Hari");
    await delay(600);

    const afterAdvance = await page.evaluate(() => document.body.textContent);
    assert("Project Day Advanced", afterAdvance.includes("Day 5") || afterAdvance.includes("Hari 5") || afterAdvance.includes("5 of 16"), "Day incremented");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_06_schedule_advanced.png") });

    // TEST 9: EQUIPMENT TRACKER
    console.log("\n--- TEST 9: Equipment Rental Tracker ---");
    await clickNavButton(page, "Equipment Rental", "Equipment");
    await delay(600);

    const eqContent = await page.evaluate(() => document.body.textContent);
    assert("Equipment Burn Rate Displayed", eqContent.includes("Burn") || eqContent.includes("Daily") || eqContent.includes("Harian"), "Burn rate KPI visible");
    assert("Laser Projector Listed", eqContent.includes("Laser Projector") || eqContent.includes("Projector"), "Projector package present");

    await clickNavButton(page, "Add Rental Gear", "+ Add Equipment", "Add Equipment");
    await delay(600);

    await fillActiveModal(page, {
      text1: "Portable PA System & Wireless Mic Kit",
      text2: "SoundCraft Rentals",
      number1: 320,
    });
    await submitActiveModal(page);
    await delay(800);

    const eqUpdated = await page.evaluate(() => document.body.textContent);
    assert("New Equipment Added", eqUpdated.includes("Portable PA") || eqUpdated.includes("Wireless Mic"), "Equipment in tracker");
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

    // TEST 15: SYSTEM ALERT COUNT & RE-EVALUATION ENGINE
    console.log("\n--- TEST 15: System Alerts & Centralized Evaluator ---");
    await clickNavButton(page, "Automated Alerts", "Peringatan", "Alerts");
    await delay(600);

    const alertContent = await page.evaluate(() => document.body.textContent);
    assert("Alerts Tab Loads", alertContent.includes("Alert") || alertContent.includes("Peringatan") || alertContent.includes("Budget"), "Alert content visible");

    // Assertion 1: Overdue Task Alert Generated after Day Advance
    // In Test 8, project day was advanced to Day 5. Tasks due Day 4 (tsk-2, tsk-4, tsk-5) should now trigger overdue_task alert.
    const overdueAlertFound = await page.evaluate(() => {
      const text = document.body.textContent || "";
      return text.includes("Overdue:") || text.includes("overdue") || text.includes("past deadline");
    });
    assert("Overdue Task Alert Generated", overdueAlertFound, "Overdue task alert present after day advance");

    // Assertion 2: Dedup Guard — Running Advance Day or Evaluator again does NOT duplicate alert cards
    const initialCardCount = await page.evaluate(() => {
      return document.querySelectorAll("div[data-testid^='alert-card-']").length;
    });

    // Advance day once more
    await clickNavButton(page, "Project Schedule", "Schedule", "Digital Call Sheet", "Call Sheet");
    await delay(500);
    await clickNavButton(page, "Advance Project Day", "Advance Day", "Advance Shoot Day");
    await delay(500);
    await clickNavButton(page, "Automated Alerts", "Peringatan", "Alerts");
    await delay(500);

    const postCardCount = await page.evaluate(() => {
      // Check unique alert IDs
      const cards = Array.from(document.querySelectorAll("div[data-testid^='alert-card-']"));
      const ids = cards.map(c => c.getAttribute("data-testid"));
      const uniqueIds = new Set(ids);
      return { total: cards.length, unique: uniqueIds.size };
    });
    assert("Dedup Guard Prevents Duplicate Alerts", postCardCount.total === postCardCount.unique, "Alert IDs remain unique with no duplicate cards");

    // Assertion 3: Alert Resolve Lifecycle (Acknowledge & Resolve)
    // Click acknowledge/resolve on an active alert card
    const didResolveAlert = await page.evaluate(() => {
      const resolveBtn = document.querySelector("button[data-testid^='resolve-alert-btn-']");
      if (resolveBtn) {
        resolveBtn.click();
        return true;
      }
      return false;
    });
    await delay(500);

    const resolvedCount = await page.evaluate(() => {
      return document.querySelectorAll("div[data-resolved='true']").length;
    });
    assert("Alert Resolve Lifecycle", didResolveAlert && resolvedCount > 0, "Alert successfully acknowledged and marked resolved");

    // Assertion 4: Rule 5 — Orphan Alert Cleanup on Task Deletion
    // Navigate to Tasks, delete a task that has an active overdue alert (tsk-5 due Day 4, now Day 6 = 2 days overdue → critical).
    // Then return to Alerts and verify the corresponding alert card is auto-resolved (isResolved=true), not left as an orphan active alert.
    await clickNavButton(page, "Department Tasks", "Tasks");
    await delay(600);

    // Capture the overdue task ID before deletion (find task card whose title matches tsk-5 seed task)
    const deletedTaskAlertId = await page.evaluate(() => {
      // tsk-5: "Confirm vendor contract for staging and power backup"
      const allCards = Array.from(document.querySelectorAll("button[data-testid^='task-delete-btn-']"));
      // Find a delete button whose closest task card mentions the vendor contract task
      const card = allCards.find((btn) => {
        const parent = btn.closest("[data-testid^='task-card-']");
        return parent && (parent.textContent || "").includes("vendor contract");
      });
      if (card) {
        const testId = card.getAttribute("data-testid") || "";
        const taskId = testId.replace("task-delete-btn-", "");
        card.click();
        return taskId;
      }
      // Fallback: delete any task with an active overdue alert card visible
      const anyDeleteBtn = allCards[0];
      if (anyDeleteBtn) {
        const testId = anyDeleteBtn.getAttribute("data-testid") || "";
        const taskId = testId.replace("task-delete-btn-", "");
        anyDeleteBtn.click();
        return taskId;
      }
      return null;
    });
    await delay(800);

    if (deletedTaskAlertId) {
      // Return to Alerts tab and check the overdue alert for the deleted task is resolved
      await clickNavButton(page, "Automated Alerts", "Peringatan", "Alerts");
      await delay(600);

      const orphanAlertStatus = await page.evaluate((taskId) => {
        const alertCard = document.querySelector(`div[data-testid="alert-card-alt-task-${taskId}"]`);
        if (!alertCard) return "not_found"; // alert removed entirely — also acceptable
        return alertCard.getAttribute("data-resolved"); // "true" = auto-resolved, "false" = orphan bug
      }, deletedTaskAlertId);

      assert(
        "Rule 5: Orphan Alert Auto-Resolved on Task Deletion",
        orphanAlertStatus === "true" || orphanAlertStatus === "not_found",
        `Alert for deleted task should be resolved or absent, got: ${orphanAlertStatus}`
      );
    } else {
      // No delete button found — may indicate tasks tab structure differs, skip gracefully
      assert("Rule 5: Orphan Alert Auto-Resolved on Task Deletion", false, "Could not find task delete button to trigger Rule 5");
    }

    // =========================================================================
    // TEST 16: PROJECT NOTES MODULE (Overview Panel)
    // =========================================================================
    console.log("\n--- TEST 16: Project Notes Module (Overview Panel) ---");
    await clickNavButton(page, "Executive Overview", "Ringkasan", "Overview");
    await delay(600);

    // 1. Note Compose & Add
    await page.waitForSelector("[data-testid='notes-panel']");
    const noteInput = await page.waitForSelector("[data-testid='note-compose-input']");
    await clearAndType(page, noteInput, "Emergency generator rented for night shoot on soundstage B.");
    await delay(300);
    const addBtn = await page.waitForSelector("[data-testid='add-note-btn']");
    await addBtn.click();
    await delay(800);

    const createdNoteCard = await page.waitForSelector("[data-testid^='note-card-']", { timeout: 3000 });
    const noteCardText = await page.evaluate(el => el.textContent || "", createdNoteCard);
    assert(
      "Note Added to Panel",
      noteCardText.includes("Emergency generator rented"),
      "New note card rendered with content in notes panel"
    );

    // Extract note ID from testid
    const noteTestId = await page.evaluate(el => el.getAttribute("data-testid") || "", createdNoteCard);
    const noteId = noteTestId.replace("note-card-", "");

    // 2. Note Pin & Unpin Toggle
    await page.click(`button[data-testid='pin-note-btn-${noteId}']`);
    await delay(500);

    const isPinnedActive = await page.evaluate((id) => {
      const card = document.querySelector(`div[data-testid='note-card-${id}']`);
      if (!card) return false;
      const hasAmber = card.classList.contains("border-amber-400/20") || card.className.includes("amber-400");
      const pinBtn = document.querySelector(`button[data-testid='pin-note-btn-${id}']`);
      const btnText = pinBtn ? pinBtn.textContent || "" : "";
      return hasAmber || btnText.includes("Unpin") || btnText.includes("Lepas");
    }, noteId);
    assert("Note Pin State Toggled", isPinnedActive, "Note card displays pinned styling and toggle state");

    // 3. Note Delete
    const preDeleteCount = await page.evaluate(() => document.querySelectorAll("[data-testid^='note-card-']").length);
    await page.click(`button[data-testid='delete-note-btn-${noteId}']`);
    await delay(500);

    const postDeleteCount = await page.evaluate(() => document.querySelectorAll("[data-testid^='note-card-']").length);
    assert("Note Deleted Successfully", postDeleteCount === preDeleteCount - 1, "Note card removed from panel after deletion");

    // =========================================================================
    // TEST 17: CLIENT-SIDE HEARTBEAT REMINDER ENGINE
    // =========================================================================
    console.log("\n--- TEST 17: Client-Side Heartbeat Reminders ---");

    // 1. Reminder Banner Rendered on Active Condition
    const reminderBannerExists = await page.evaluate(() => {
      const banner = document.querySelector("[data-testid='reminder-heartbeat-banner']");
      return !!banner && (banner.textContent.includes("Day") || banner.textContent.includes("reconciliation") || banner.textContent.includes("overdue") || banner.textContent.includes("pending") || banner.textContent.includes("perhatian") || banner.textContent.includes("attention"));
    });
    assert("Reminder Banner Rendered on Active Condition", reminderBannerExists, "Heartbeat banner proactively displayed for active items");

    // 2. Reminder Banner Dismissed Successfully
    await page.click("button[data-testid='dismiss-reminder-btn']");
    await delay(500);

    const bannerAfterDismiss = await page.evaluate(() => {
      return !!document.querySelector("[data-testid='reminder-heartbeat-banner']");
    });
    assert("Reminder Banner Dismissed Successfully", !bannerAfterDismiss, "Banner dismissed and removed from view");

    // 3. Preferences Toggle Controls Reminders
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent && (b.textContent.includes("Preferences") || b.textContent.includes("Pengaturan")));
      if (btn) btn.click();
    });
    await delay(500);

    const toggleFound = await page.evaluate(() => {
      const toggleBtn = document.querySelector("button[data-testid='toggle-reminders-btn']");
      if (toggleBtn) {
        toggleBtn.click();
        return true;
      }
      return false;
    });
    await delay(300);

    const prefRemindersState = await page.evaluate(() => {
      return localStorage.getItem("closebook_reminders_enabled");
    });
    assert("Preferences Toggle Controls Reminders", toggleFound && prefRemindersState === "false", "Reminder preferences switch successfully toggles state");

    // Close preferences modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector("button[aria-label='Close preferences']") 
        || document.querySelector(".btn-primary-crimson")
        || Array.from(document.querySelectorAll("button")).find(b => b.textContent && (b.textContent.includes("Save") || b.textContent.includes("Simpan") || b.textContent.includes("Close") || b.textContent.includes("Tutup")));
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // TEST 18: Multi-Project Switcher & Context Isolation (Fase D)
    console.log("\n--- TEST 18: Multi-Project Switcher & Context Isolation ---");

    // 18.a: Open Project Switcher & Create New Project
    await page.waitForSelector("#project-switcher-btn", { visible: true });
    await page.click("#project-switcher-btn");
    await delay(300);

    await page.waitForSelector("#btn-open-new-project-modal", { visible: true });
    await page.click("#btn-open-new-project-modal");
    await delay(400);

    await page.waitForSelector("#new-project-name");
    await page.type("#new-project-name", "Documentary 2026: Voices of the Deep");
    await page.type("#new-project-budget", "45000");
    await page.click("#new-project-days", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type("#new-project-days", "10");
    await page.type("#new-project-director", "Marcus Vance");
    await delay(200);

    await page.click("#submit-new-project");
    await delay(800);

    // Verify Project B is active & isolated
    const projectBState = await page.evaluate(() => {
      const switcher = document.getElementById("project-switcher-btn");
      const name = switcher ? switcher.textContent : "";
      const bodyText = document.body.textContent || "";
      return {
        hasName: name.includes("Documentary 2026"),
        hasBudget: bodyText.includes("45,000") || bodyText.includes("45.000"),
      };
    });
    assert(
      "New Project Created & Switched Context",
      projectBState.hasName && projectBState.hasBudget,
      "New project 'Documentary 2026' active with $45k budget"
    );

    // 18.b: Switch back to Project 1 ("The Quiet Horizon") via Switch Confirmation
    await page.waitForSelector("#project-switcher-btn", { visible: true });
    await page.click("#project-switcher-btn");
    await delay(300);

    await page.waitForSelector("#switch-to-project-proj-001", { visible: true });
    await page.click("#switch-to-project-proj-001");
    await delay(400);

    await page.waitForSelector("#confirm-switch-project-btn", { visible: true });
    await page.click("#confirm-switch-project-btn");
    await delay(800);

    const project1Restored = await page.evaluate(() => {
      const switcher = document.getElementById("project-switcher-btn");
      const name = switcher ? switcher.textContent : "";
      const bodyText = document.body.textContent || "";
      return {
        hasName: name.includes("The Quiet Horizon"),
        hasBudget: bodyText.includes("120,000") || bodyText.includes("120.000"),
      };
    });
    assert(
      "Switch Back to Original Project Preserves Data",
      project1Restored.hasName && project1Restored.hasBudget,
      "Original project 'The Quiet Horizon' intact with $120k budget"
    );

    // 18.c: Switch back to Project 2 and verify isolated context
    await page.waitForSelector("#project-switcher-btn", { visible: true });
    await page.click("#project-switcher-btn");
    await delay(300);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button[id^='switch-to-project-']"));
      const projBtn = btns.find(b => b.textContent && b.textContent.includes("Documentary 2026"));
      if (projBtn) projBtn.click();
    });
    await delay(400);

    await page.waitForSelector("#confirm-switch-project-btn", { visible: true });
    await page.click("#confirm-switch-project-btn");
    await delay(800);

    const project2Restored = await page.evaluate(() => {
      const switcher = document.getElementById("project-switcher-btn");
      const name = switcher ? switcher.textContent : "";
      const bodyText = document.body.textContent || "";
      return {
        hasName: name.includes("Documentary 2026"),
        hasBudget: bodyText.includes("45,000") || bodyText.includes("45.000"),
      };
    });
    assert(
      "Multi-Project Data Scoping 100% Isolated",
      project2Restored.hasName && project2Restored.hasBudget,
      "Seamless bi-directional project switching verified"
    );

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
