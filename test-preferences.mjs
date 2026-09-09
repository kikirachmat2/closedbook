import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/kiki/.gemini/antigravity-ide/brain/634f6393-0f50-4455-9afc-820eb14087c0';

async function runPreferencesTest() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Open Workspace
  await page.goto('http://localhost:3000/workspace', { waitUntil: 'networkidle2' });
  await page.waitForSelector('header');

  // 2. Open Preferences Modal
  console.log('Opening preferences modal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Preferences') || b.title?.includes('Change Currency')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preferences_modal_open.png') });
  console.log('Captured preferences modal screenshot.');

  // 3. Select Indonesian Rupiah (IDR)
  console.log('Selecting IDR currency...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('IDR'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 4. Select Cyber Indigo Theme
  console.log('Selecting Cyber Indigo theme...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Cyber Indigo'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 5. Select Indonesian Language
  console.log('Selecting Bahasa Indonesia...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Bahasa Indonesia'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 6. Close Modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Terapkan Preferensi') || b.textContent.includes('Save Preferences') || b.getAttribute('aria-label') === 'Close preferences'
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Screenshot: Workspace with IDR currency + Cyber Indigo theme + Indonesian language
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'workspace_idr_indigo_id.png') });
  console.log('Captured workspace with IDR + Indigo theme screenshot.');

  // Mobile Viewport test with Solar Amber theme & Japanese language
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    localStorage.setItem('closebook_theme', 'amber');
    localStorage.setItem('closebook_currency', 'JPY');
    localStorage.setItem('closebook_language', 'ja');
    document.documentElement.setAttribute('data-theme', 'amber');
    location.reload();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'workspace_mobile_amber_jpy.png') });
  console.log('Captured mobile with Amber + JPY theme screenshot.');

  await browser.close();
  console.log('Preferences audit finished successfully!');
}

runPreferencesTest().catch(console.error);
