const { chromium } = require('playwright');
const path = require('path');

async function testFreelancerPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));

  console.log('Navigating to Peto freelancer page...');
  await page.goto('https://creative-hub-sandy.vercel.app/freelancers/7f1ecb51-c24f-4287-b44c-f54b41528bba', { waitUntil: 'networkidle' });

  // Wait for loading to disappear
  console.log('Waiting for content to load...');
  await page.waitForFunction(() => !document.body.innerText.includes('Memuat profil kreator...'), { timeout: 15000 }).catch(e => console.log('Timeout waiting for spinner:', e.message));

  await page.screenshot({ path: path.join(__dirname, '../screenshots/03_peto_loaded.png'), fullPage: true });

  const pageText = await page.innerText('body');
  console.log('Page body snippet:', pageText.slice(0, 500));

  // Look for hire or booking button
  const buttons = (await page.locator('button').allInnerTexts()).map(b => b.trim()).filter(Boolean);
  console.log('Buttons on profile page:', buttons);

  // If there is a hire button, click it
  const hireBtn = await page.$('button:has-text("Hire"), button:has-text("Booking Project"), button:has-text("Booking")');
  if (hireBtn) {
    console.log('Clicking hire button:', await hireBtn.innerText());
    await hireBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '../screenshots/03_peto_booking_modal.png'), fullPage: true });
    
    // Check elements in modal
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('dialog, [role="dialog"], .fixed.inset-0.z-50');
      return modal ? modal.innerText : 'NO MODAL DETECTED';
    });
    console.log('Modal Content:\n', modalContent);
  } else {
    console.log('Hire button not found!');
  }

  await browser.close();
}

testFreelancerPage();
