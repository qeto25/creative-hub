const { chromium } = require('playwright');
const path = require('path');

async function testBookingSubmit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));

  await page.goto('https://creative-hub-sandy.vercel.app/freelancers/7f1ecb51-c24f-4287-b44c-f54b41528bba', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.body.innerText.includes('Memuat profil kreator...'), { timeout: 15000 });

  const hireBtn = await page.$('button:has-text("Hire peto / Booking Project")');
  if (hireBtn) {
    await hireBtn.click();
    await page.waitForTimeout(800);

    // Fill form
    console.log('Filling booking form...');
    const nameInput = await page.$('input[placeholder*="Budi" i], input[placeholder*="Nama" i]');
    if (nameInput) await nameInput.fill('Budi Testing Playwright');

    const waInput = await page.$('input[placeholder*="081" i], input[placeholder*="WhatsApp" i]');
    if (waInput) await waInput.fill('081234567890');

    const briefInput = await page.$('textarea');
    if (briefInput) await briefInput.fill('Kebutuhan desain presentasi tugas akhir kuliah 10 slide format elegan.');

    // Scroll modal down
    await page.evaluate(() => {
      const modal = document.querySelector('.max-h-\\[90vh\\]');
      if (modal) modal.scrollTop = modal.scrollHeight;
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(__dirname, '../screenshots/03_peto_booking_scrolled.png') });

    // Look for submit button
    const submitBtn = await page.$('button:has-text("Buat Tiket"), button:has-text("Kirim ke WA")');
    if (submitBtn) {
      console.log('Found submit button:', await submitBtn.innerText());
      // Let's test clicking it, handle alert or popup
      page.on('dialog', async dialog => {
        console.log('DIALOG DETECTED:', dialog.type(), dialog.message());
        await dialog.dismiss();
      });

      // Intercept window.open
      await page.evaluate(() => {
        window._openedUrls = [];
        window.open = (url) => { window._openedUrls.push(url); return null; };
      });

      await submitBtn.click();
      await page.waitForTimeout(3000);

      const openedUrls = await page.evaluate(() => window._openedUrls);
      console.log('Opened WhatsApp URLs:', openedUrls);

      await page.screenshot({ path: path.join(__dirname, '../screenshots/03_peto_booking_success.png'), fullPage: true });

      const successText = await page.evaluate(() => {
        const modal = document.querySelector('.max-h-\\[90vh\\]');
        return modal ? modal.innerText : 'NO MODAL';
      });
      console.log('Modal after submit:\n', successText);
    }
  }

  await browser.close();
}

testBookingSubmit();
