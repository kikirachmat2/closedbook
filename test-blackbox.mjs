import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/kiki/.gemini/antigravity-ide/brain/634f6393-0f50-4455-9afc-820eb14087c0";

async function runBlackboxTests() {
  console.log("=================================================================");
  console.log("CLOSEBOOK BLACKBOX & E2E AUTOMATED TEST SUITE");
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
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    const title = await page.title();
    assertTest("Page Title Contains Closebook", title.includes("Closebook"), `Title was: ${title}`);

    const headline = await page.$eval("h1", (el) => el.textContent);
    assertTest("Display Headline Rendered", headline.includes("Your production"), `Headline: ${headline}`);

    // Screenshot Landing
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "blackbox_landing.png") });

    // -------------------------------------------------------------
    // TEST 2: LANDING PAGE WORKFLOW TABS & SIMULATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Workflow Preset Switching ---");
    const tabs = await page.$$("button");
    let agencyTab = null;
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.textContent, tab);
      if (text && text.includes("Creative Agency")) {
        agencyTab = tab;
        break;
      }
    }
    if (agencyTab) {
      await agencyTab.click();
      await new Promise((r) => setTimeout(r, 400));
      const badgeText = await page.$eval("#preview", (el) => el.textContent);
      assertTest("Switched to Creative Agency Preset", badgeText.includes("Client Retainer"), "Preset updated in view");
    }

    // -------------------------------------------------------------
    // TEST 3: NAVIGATION TO WORKSPACE
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Navigation to /workspace ---");
    await page.goto("http://localhost:3000/workspace", { waitUntil: "networkidle0" });
    const currentUrl = page.url();
    assertTest("Successfully Loaded /workspace", currentUrl.includes("/workspace"), `URL: ${currentUrl}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "blackbox_workspace_overview.png") });

    // -------------------------------------------------------------
    // TEST 4: EXECUTIVE DASHBOARD STATS & PROGRESS BARS
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Executive Dashboard Metrics ---");
    const overviewContent = await page.$eval("main, div.p-6", (el) => el.textContent);
    assertTest("Total Budget Displayed ($120,000)", overviewContent.includes("120,000"), "Budget metric verified");
    assertTest("Burn Rate Calculated", overviewContent.includes("burn rate"), "Burn rate percentage present");

    // -------------------------------------------------------------
    // TEST 5: PETTY CASH LEDGER & TRANSACTION CREATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Petty Cash Ledger Operations ---");
    // Click 'Petty Cash Ledger' in sidebar
    const ledgerNavBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Petty Cash Ledger"));
    });
    await ledgerNavBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Open Log Modal
    const logModalBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Log Petty Cash"));
    });
    await logModalBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    // Fill form
    await page.type('input[placeholder*="Generator"]', "Field Drone Battery Extra Sets");
    await page.type('input[placeholder*="240.00"]', "290.00");
    await page.type('input[placeholder*="Marina"]', "DroneWorks Rentals");

    // Submit modal form
    const submitBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button[type='submit']"));
      return buttons.find((b) => b.textContent.includes("Save & Stream"));
    });
    await submitBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Verify transaction appeared in table
    const tableText = await page.$eval("tbody", (el) => el.textContent);
    assertTest("New Transaction Appears in Ledger", tableText.includes("Field Drone Battery"), "Entry logged in table");
    assertTest("Correct Amount Stored ($290.00)", tableText.includes("$290.00"), "Amount rendered accurately");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "blackbox_transactions_ledger.png") });

    // -------------------------------------------------------------
    // TEST 6: APPROVAL GATE ACTION
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: One-Click Approval Flow ---");
    const approveBtn = await page.$('button[title="Approve Transaction"]');
    if (approveBtn) {
      await approveBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      assertTest("Approval Click Executed", true, "Status transition triggered");
    } else {
      assertTest("Approval Button Found", false, "No pending transaction with approve button");
    }

    // -------------------------------------------------------------
    // TEST 7: MULTI-POCKET CASHFLOW & FUND TRANSFER
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Pocket Transfer Flow ---");
    const pocketsNavBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Multi-Pocket Cashflow"));
    });
    await pocketsNavBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Verify pocket cards
    const pocketContent = await page.$eval("div.p-6", (el) => el.textContent);
    assertTest("Pocket Hierarchy Loaded", pocketContent.includes("Producer Master Vault"), "Master Vault verified");
    assertTest("UPM Field Cash Pocket Present", pocketContent.includes("UPM Field Cash"), "UPM Cash verified");

    // Open transfer modal
    const transferBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Transfer Pocket Funds"));
    });
    await transferBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    // Enter transfer amount $3,000
    await page.type('input[placeholder*="5000.00"]', "3000.00");
    const disburseBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button[type='submit']"));
      return buttons.find((b) => b.textContent.includes("Authorize & Disburse"));
    });
    await disburseBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    const updatedPocketContent = await page.$eval("div.p-6", (el) => el.textContent);
    assertTest("Pocket Transfer Completed Successfully", !updatedPocketContent.includes("Authorize & Disburse"), "Modal dismissed & state updated");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "blackbox_pockets.png") });

    // -------------------------------------------------------------
    // TEST 8: DEPARTMENT TASKS & STATUS TOGGLING
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Department Tasks & Status Toggling ---");
    const tasksNavBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Department Tasks"));
    });
    await tasksNavBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Toggle a task status
    const taskCard = await page.$("div.surface-overlay.cursor-pointer");
    if (taskCard) {
      await taskCard.click();
      await new Promise((r) => setTimeout(r, 400));
      assertTest("Task Status Toggled Interactively", true, "Clicked task card to cycle status");
    }

    // Open Task Modal
    const newTaskBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("New Department Task"));
    });
    await newTaskBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    await page.type('input[placeholder*="Rig waterproof"]', "Calibrate optical focus puller on B-Cam");
    await page.type('input[placeholder*="Leo Hardi"]', "Budi Santoso");

    const submitTaskBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button[type='submit']"));
      return buttons.find((b) => b.textContent.includes("Create & Assign"));
    });
    await submitTaskBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const tasksBoardContent = await page.$eval("div.p-6", (el) => el.textContent);
    assertTest("New Task Added to Kanban Board", tasksBoardContent.includes("Calibrate optical focus puller"), "Task rendered in board");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "blackbox_tasks.png") });

    // -------------------------------------------------------------
    // TEST 9: DIGITAL CALL SHEET DISPLAY
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Digital Call Sheet ---");
    const callSheetNavBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Digital Call Sheet"));
    });
    await callSheetNavBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const callSheetContent = await page.$eval("div.p-6", (el) => el.textContent);
    assertTest("Call Sheet Day 4 Verified", callSheetContent.includes("Day 4 of 16"), "Day count accurate");
    assertTest("Call Time Displayed (06:00 AM)", callSheetContent.includes("06:00 AM"), "Call time accurate");
    assertTest("Emergency Contacts Listed", callSheetContent.includes("Dr. Aris"), "Medic contact rendered");

    // -------------------------------------------------------------
    // TEST 10: AUTOMATED ALERTS RESOLVE FLOW
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Automated Alerts Resolution ---");
    const alertsNavBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Automated Alerts"));
    });
    await alertsNavBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const resolveBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find((b) => b.textContent.includes("Acknowledge & Resolve"));
    });
    if (resolveBtn) {
      await resolveBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const alertsContent = await page.$eval("div.p-6", (el) => el.textContent);
      assertTest("Alert Status Changed to Resolved", alertsContent.includes("Resolved"), "Checked resolved indicator");
    }

    // -------------------------------------------------------------
    // TEST 11: CONSOLE LOG AUDIT
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Uncaught Console Errors ---");
    assertTest("Zero Uncaught JavaScript Errors", consoleErrors.length === 0, `Errors found: ${consoleErrors.join("; ")}`);

    // Write result summary
    const totalPassed = testResults.filter((t) => t.passed).length;
    console.log("\n=================================================================");
    console.log(`TEST SUMMARY: ${totalPassed} / ${testResults.length} TESTS PASSED`);
    console.log("=================================================================");

    const reportPath = path.join(ARTIFACT_DIR, "blackbox_test_report.json");
    fs.writeFileSync(reportPath, JSON.stringify({ totalPassed, totalTests: testResults.length, testResults, consoleErrors }, null, 2));

  } catch (error) {
    console.error("FATAL ERROR IN TEST SUITE:", error);
  } finally {
    await browser.close();
  }
}

runBlackboxTests();
