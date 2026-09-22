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

    // Look for Demo Owner button or fill form
    const demoOwnerBtn = await page.$('button:has-text("Owner (Super Admin)"), button:has-text("Demo Owner"), button:has-text("Grown")');
    if (demoOwnerBtn) {
      console.log('Clicking Demo Owner button...');
      await demoOwnerBtn.click();
    } else {
      console.log('Filling login form as grown...');
      await page.fill('input[type="text"], input[name="username"]', 'grown');
      await page.fill('input[type="password"]', 'Creative2026!');
      await page.click('button[type="submit"]');
    }

    console.log('Waiting for navigation to owner dashboard...');
    await page.waitForURL('**/dashboard/owner', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log('Page title:', title);

    // Take screenshot of default dashboard
    const screenshotsDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'owner_dashboard_initial.png'), fullPage: true });

    // Look for "Analitik Pribadi" tab
    console.log('Looking for "Analitik Pribadi" tab button...');
    const analyticsTab = await page.$('button:has-text("Analitik Pribadi")');
    if (!analyticsTab) {
      throw new Error('Button "Analitik Pribadi" not found on page!');
    }

    console.log('Clicking "Analitik Pribadi" tab...');
    await analyticsTab.click();
    await page.waitForTimeout(1500);

    // Verify presence of key sections
    const pageText = await page.innerText('body');
    const checks = [
      { name: 'Owner Executive Intelligence Header', match: pageText.includes('Owner Executive Intelligence') || pageText.includes('Analitik & Performa Bisnis') },
      { name: 'Total Omset KPI', match: pageText.includes('Total Omset (Gross)') || pageText.includes('Total Omset') },
      { name: 'Kas Agensi KPI', match: pageText.includes('Kas Agensi (Net Hub)') || pageText.includes('Kas Agensi') },
      { name: 'Avg Order Value KPI', match: pageText.includes('Avg Order Value') || pageText.includes('AOV') },
      { name: 'Tren Omset Chart', match: pageText.includes('Tren Omset & Alokasi Kas') },
      { name: 'Status Funnel', match: pageText.includes('Status Funnel Pesanan') },
      { name: 'Talent Leaderboard', match: pageText.includes('Talent Performance Leaderboard') },
      { name: 'Monetisasi Fitur Tambahan', match: pageText.includes('Monetisasi Fitur Tambahan') },
      { name: 'Ekspor CSV Button', match: pageText.includes('Ekspor CSV') },
    ];

    console.log('\n📊 Verification Results:');
    let allPassed = true;
    for (const c of checks) {
      console.log(`- ${c.name}: ${c.match ? '✅ PASSED' : '❌ FAILED'}`);
      if (!c.match) allPassed = false;
    }

    // Capture screenshot of Analytics View
    await page.screenshot({ path: path.join(screenshotsDir, 'owner_analytics_tab.png'), fullPage: true });
    console.log('\n📸 Screenshot saved to screenshots/owner_analytics_tab.png');

    // Test clicking 30 Hari timeframe
    const btn30d = await page.$('button:has-text("30 Hari")');
    if (btn30d) {
      console.log('Clicking "30 Hari" filter...');
      await btn30d.click();
      await page.waitForTimeout(500);
    }

    // Test CSV Export click
    const exportBtn = await page.$('button:has-text("Ekspor CSV")');
    if (exportBtn) {
      console.log('Clicking "Ekspor CSV" button...');
      await exportBtn.click();
      await page.waitForTimeout(500);
      const afterExportText = await page.innerText('body');
      console.log('- CSV Export Feedback:', afterExportText.includes('File Terunduh') ? '✅ File Terunduh!' : 'Triggered');
    }

    if (allPassed) {
      console.log('\n🎉 ALL OWNER ANALYTICS VERIFICATIONS PASSED SUCCESSFULLY!');
    } else {
      console.error('\n⚠️ Some verifications failed, check the log above.');
    }

  } catch (err) {
    console.error('Test execution error:', err.message);
  } finally {
    await browser.close();
  }
}

testOwnerAnalytics();
