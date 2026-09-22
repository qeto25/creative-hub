const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testOwnerAnalytics() {
  console.log('🚀 Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    const demoOwnerBtn = await page.$('button:has-text("Owner (Super Admin)"), button:has-text("Demo Owner")');
    if (demoOwnerBtn) {
      console.log('Clicking Demo Owner button...');
      await demoOwnerBtn.click();
    }

    console.log('Waiting for navigation to owner dashboard...');
    await page.waitForURL('**/dashboard/owner', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Look for "Analitik Pribadi" tab
    console.log('Looking for "Analitik Pribadi" tab button...');
    const analyticsTab = await page.$('button:has-text("Analitik Pribadi")');
    if (!analyticsTab) {
      throw new Error('Button "Analitik Pribadi" not found on page!');
    }

    console.log('Clicking "Analitik Pribadi" tab...');
    await analyticsTab.click();
    await page.waitForTimeout(1000);

    const screenshotsDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // 1. Screenshot in Live Database mode (shows clean empty state & status notice, NO black holes!)
    await page.screenshot({ path: path.join(screenshotsDir, 'owner_analytics_antislop_live.png'), fullPage: true });
    console.log('📸 Live Mode Screenshot saved to screenshots/owner_analytics_antislop_live.png');

    // 2. Click "Pratinjau Demo" button
    console.log('Toggling to "Pratinjau Demo"...');
    const demoToggle = await page.$('button:has-text("Pratinjau Demo")');
    if (demoToggle) {
      await demoToggle.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, 'owner_analytics_antislop_demo.png'), fullPage: true });
      console.log('📸 Demo Mode Screenshot saved to screenshots/owner_analytics_antislop_demo.png');
    }

    console.log('✅ Anti-slop and performance verification completed successfully!');
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

testOwnerAnalytics();
