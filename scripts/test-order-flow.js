const { chromium } = require('playwright');
const path = require('path');

const TICKET_CODE = 'CH-2609-5871';
const WA_LAST4 = '7890';

async function testOrderLifecycle() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('\n--- 1. Testing Track Page with Ticket & Last 4 WA ---');
  await page.goto('https://creative-hub-sandy.vercel.app/track', { waitUntil: 'networkidle' });
  
  const ticketInput = await page.$('input[placeholder*="CH-" i], input[placeholder*="Tiket" i]');
  const waInput = await page.$('input[placeholder*="4 digit" i], input[placeholder*="WA" i], input[type="text"]:nth-of-type(2), input[maxlength="4"]');

  if (ticketInput) await ticketInput.fill(TICKET_CODE);
  if (waInput) await waInput.fill(WA_LAST4);

  console.log('Ticket & WA fields filled, clicking Lacak Proyek...');
  const submitBtn = await page.$('button[type="submit"], button:has-text("Lacak Proyek")');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, '../screenshots/10_track_result_real.png'), fullPage: true });
    console.log('Track page text snippet:\n', (await page.innerText('body')).slice(0, 700));
  }

  console.log('\n--- 2. Testing Member Dashboard for Incoming Order ---');
  await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle' });
  const memInputs = await page.$$('input[type="text"], input[name="username"], input[name="email"]');
  const memPass = await page.$('input[type="password"]');
  if (memInputs.length > 0 && memPass) {
    await memInputs[0].fill('petonaibana@gmail.com');
    await memPass.fill('petoCreative');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(__dirname, '../screenshots/11_member_with_order.png'), fullPage: true });
    console.log('Member dashboard text:\n', (await page.innerText('body')).slice(0, 600));
  }

  console.log('\n--- 3. Testing Owner Dashboard for Incoming Order & Actions ---');
  await context.clearCookies();
  await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle' });
  const ownerInputs = await page.$$('input[type="text"], input[name="username"], input[name="email"]');
  const ownerPass = await page.$('input[type="password"]');
  if (ownerInputs.length > 0 && ownerPass) {
    await ownerInputs[0].fill('grown');
    await ownerPass.fill('153712');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look specifically for the tab button "Daftar Pesanan"
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = (await t.innerText()).trim();
      if (text.includes('Daftar Pesanan')) {
        console.log('Clicking tab:', text);
        await t.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    await page.screenshot({ path: path.join(__dirname, '../screenshots/12_owner_orders_tab.png'), fullPage: true });
    console.log('Owner Orders Tab text:\n', (await page.innerText('body')).slice(0, 800));
  }

  await browser.close();
}

testOrderLifecycle();
