const { chromium } = require('playwright');
const path = require('path');

async function testMobileAnalytics() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();

  console.log('Mobile navigation to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  const demoOwnerBtn = await page.$('button:has-text("Owner (Super Admin)"), button:has-text("Demo Owner")');
  if (demoOwnerBtn) {
    await demoOwnerBtn.click();
  }

  await page.waitForURL('**/dashboard/owner', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const analyticsTab = await page.$('button:has-text("Analitik Pribadi")');
  if (analyticsTab) {
    await analyticsTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(__dirname, '../screenshots/owner_analytics_mobile.png'), fullPage: true });
  console.log('Mobile screenshot saved to screenshots/owner_analytics_mobile.png');

  await browser.close();
}

testMobileAnalytics();
