const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://creative-hub-sandy.vercel.app/track', { waitUntil: 'networkidle' });
  
  const ticketInput = await page.$('input[placeholder*="CH-"]');
  const waInput = await page.$('input[maxlength="4"]');
  
  console.log('Inputs found:', !!ticketInput, !!waInput);
  await ticketInput.fill('#CH-2609-5871');
  await waInput.fill('7890');
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(__dirname, '../screenshots/13_track_with_hash.png'), fullPage: true });
  console.log('Result text:\n', (await page.innerText('body')).slice(0, 800));
  await browser.close();
})();
