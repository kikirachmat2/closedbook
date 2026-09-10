import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROJECT_DIR = "/Users/kiki/Documents/Web Develop/ClosedBook";
const PUBLIC_DIR = path.join(PROJECT_DIR, "public");
const ARTIFACT_DIR = "/Users/kiki/.gemini/antigravity-ide/brain/719a9140-ac35-4792-999a-47ab7d056879";

const svgContent = fs.readFileSync(path.join(PUBLIC_DIR, "icon.svg"), "utf8");

async function exportIcons() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "icon-192x192.png", size: 192 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon.png", size: 512 },
  ];

  for (const item of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: item.size, height: item.size, deviceScaleFactor: 1 });
    
    // HTML container with exact sizing and SVG embedded
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: ${item.size}px; height: ${item.size}px; overflow: hidden; background: transparent; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>${svgContent}</body>
    </html>`;

    await page.setContent(html);
    const dest = path.join(PUBLIC_DIR, item.name);
    await page.screenshot({ path: dest, omitBackground: true });
    console.log(`✓ Exported ${item.name} (${item.size}x${item.size})`);
    await page.close();
  }

  // Generate multi-size favicon.ico using macOS sips tool from the crisp 32x32 / 64x64 export
  try {
    const tempIcoSrc = path.join(PUBLIC_DIR, "favicon-32x32.png");
    const icoDest = path.join(PUBLIC_DIR, "favicon.ico");
    execSync(`sips -s format ico "${tempIcoSrc}" --out "${icoDest}"`);
    console.log(`✓ Generated multi-size favicon.ico`);
  } catch (err) {
    console.error("Failed to generate favicon.ico with sips:", err.message);
  }

  // Create a visual verification sheet showing the icon rendered at real sizes
  const verifyPage = await browser.newPage();
  await verifyPage.setViewport({ width: 1000, height: 700 });
  const verifyHtml = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0; padding: 40px;
          background: #0a0a0a;
          color: #fdfdfd;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #fdfdfd; }
        .grid { display: flex; align-items: flex-end; gap: 32px; margin-bottom: 40px; }
        .item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .label { font-size: 11px; font-family: monospace; color: #888; }
        .mock-tab {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1e1e1e; padding: 8px 16px; border-radius: 8px;
          border: 1px solid #333; font-size: 12px; color: #e5e5e5;
        }
      </style>
    </head>
    <body>
      <h1>ClosedBook Brand Mark — Opsi A: Geometric Quill Legibility Audit</h1>
      <div class="grid">
        <div class="item">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "icon.png")).toString("base64")}" width="256" height="256" />
          <span class="label">256px (App Icon / Store)</span>
        </div>
        <div class="item">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "apple-touch-icon.png")).toString("base64")}" width="180" height="180" />
          <span class="label">180px (Apple Touch)</span>
        </div>
        <div class="item">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "favicon-32x32.png")).toString("base64")}" width="64" height="64" />
          <span class="label">64px (Retina Favicon)</span>
        </div>
        <div class="item">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "favicon-32x32.png")).toString("base64")}" width="32" height="32" />
          <span class="label">32px (Desktop Tab)</span>
        </div>
        <div class="item">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "favicon-16x16.png")).toString("base64")}" width="16" height="16" />
          <span class="label">16px (Browser Tab)</span>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <span class="label" style="display:block; margin-bottom: 8px;">SIMULATION: Browser Tab Context (16px)</span>
        <div class="mock-tab">
          <img src="data:image/png;base64,${fs.readFileSync(path.join(PUBLIC_DIR, "favicon-16x16.png")).toString("base64")}" width="16" height="16" />
          <span>ClosedBook — Modern Production &amp; Project OS</span>
        </div>
      </div>
    </body>
  </html>`;

  await verifyPage.setContent(verifyHtml);
  const verifyScreenshotPath = path.join(ARTIFACT_DIR, "icon_legibility_audit.png");
  await verifyPage.screenshot({ path: verifyScreenshotPath, fullPage: true });
  console.log(`✓ Generated legibility audit screenshot at ${verifyScreenshotPath}`);
  await verifyPage.close();

  await browser.close();
}

exportIcons().catch(console.error);
