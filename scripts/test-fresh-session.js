const { chromium } = require('playwright');
const path = require('path');

async function testVercelScenario() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  // Clear all localStorage to simulate pure fresh live session
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => localStorage.clear());

  // Click demo owner
  const demoBtn = await page.$('button:has-text("Owner (Super Admin)"), button:has-text("Demo Owner")');
  if (demoBtn) await demoBtn.click();
  await page.waitForURL('**/dashboard/owner');
  await page.waitForTimeout(1500);

  // In live Supabase there are 0 bookings, let's simulate that by overriding bookings in page state or mocking
  // In our component, we already have `dataSourceMode` switch: "Live Database" vs "Pratinjau Demo"
  const analyticsTab = await page.$('button:has-text("Analitik Pribadi")');
  if (analyticsTab) await analyticsTab.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(__dirname, '../screenshots/owner_analytics_antislop_verified.png'), fullPage: true });
  console.log('Screenshot saved to screenshots/owner_analytics_antislop_verified.png');
  await browser.close();
}

testVercelScenario();
