const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Playwright Live Audit on https://creative-hub-sandy.vercel.app/ ...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  const logs = {
    consoleErrors: [],
    failedRequests: [],
    navigationSteps: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.consoleErrors.push(`[Console Error] ${msg.text()}`);
      console.log('❌ Console error:', msg.text());
    }
  });

  page.on('requestfailed', req => {
    logs.failedRequests.push(`[Request Failed] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    console.log('⚠️ Request failed:', req.url(), req.failure()?.errorText);
  });

  try {
    // 1. Landing Page
    console.log('\n--- 1. Testing Landing Page ---');
    await page.goto('https://creative-hub-sandy.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing_desktop.png'), fullPage: true });
    console.log('📸 Captured 01_landing_desktop.png');

    // Check broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    console.log('Broken images on landing:', brokenImages);

    // Check navigation links
    const navLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('header a, nav a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      }));
    });
    console.log('Nav links found:', navLinks);

    // 2. Owner Login
    console.log('\n--- 2. Testing Owner Login (grown / 153712) ---');
    // Try to find login button or navigate directly to /login or /auth
    let loginBtn = await page.$('text=/Masuk|Login|Sign In|Owner/i');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForTimeout(1500);
    } else {
      await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle', timeout: 20000 });
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_page.png') });
    console.log('📸 Captured 02_login_page.png');

    // Fill login
    const usernameInput = await page.$('input[type="text"], input[name="username"], input[name="email"], input[placeholder*="user" i], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"]');

    if (usernameInput && passwordInput) {
      await usernameInput.fill('grown');
      await passwordInput.fill('153712');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_owner_login_filled.png') });
      
      const submitBtn = await page.$('button[type="submit"], form button:has-text("Masuk"), form button:has-text("Login"), form button:has-text("Sign In")') || await page.$('button:has-text("Masuk"), button:has-text("Login")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_owner_post_login.png'), fullPage: true });
    console.log('Current URL after owner login:', page.url());

    // Check dashboard features
    const ownerNavLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(a => a.text.length > 0 && a.text.length < 30);
    });
    console.log('Post-login Links/Buttons:', ownerNavLinks.slice(0, 15));

    // Logout
    const logoutBtn = await page.$('text=/Keluar|Logout|Sign Out/i');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log('Logged out owner successfully');
    } else {
      console.log('No direct logout button found, clearing cookies');
      await context.clearCookies();
    }

    // 3. Member Login & Hire Flow
    console.log('\n--- 3. Testing Member Login (petonaibana@gmail.com / petoCreative) ---');
    await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle', timeout: 20000 });
    
    const memUserInput = await page.$('input[type="text"], input[name="username"], input[name="email"], input[placeholder*="user" i], input[placeholder*="email" i]');
    const memPassInput = await page.$('input[type="password"]');

    if (memUserInput && memPassInput) {
      await memUserInput.fill('petonaibana@gmail.com');
      await memPassInput.fill('petoCreative');
      const submitBtn = await page.$('button[type="submit"], form button:has-text("Masuk"), form button:has-text("Login")') || await page.$('button:has-text("Masuk"), button:has-text("Login")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_member_post_login.png'), fullPage: true });
    console.log('Current URL after member login:', page.url());

    // 4. Test Talents & Hire Flow
    console.log('\n--- 4. Testing Talent & Hire Flow ---');
    // Look for Talents / Creatives / Services link
    const talentLink = await page.$('a[href*="talent"], a[href*="creative"], a[href*="service"], a[href*="explore"], text=/Talent|Kreator|Cari|Explore/i');
    if (talentLink) {
      await talentLink.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto('https://creative-hub-sandy.vercel.app/#talents', { waitUntil: 'networkidle', timeout: 20000 });
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_talents_page.png'), fullPage: true });
    console.log('📸 Captured 06_talents_page.png');

    // Click on a "Hire" or "Book" or "Lihat Profil" / "Detail" button
    const hireButtons = await page.$$('button:has-text("Hire"), a:has-text("Hire"), button:has-text("Sewa"), a:has-text("Sewa"), button:has-text("Booking"), button:has-text("Pesan"), text=/Hire Now|Book Now/i');
    console.log(`Found ${hireButtons.length} hire/book buttons`);
    
    if (hireButtons.length > 0) {
      console.log('Clicking first Hire button...');
      await hireButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_hire_modal_or_page.png'), fullPage: true });
      console.log('📸 Captured 07_hire_modal_or_page.png');
      console.log('URL after hire click:', page.url());

      // Inspect hire form elements
      const formFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.map(el => ({
          tag: el.tagName,
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          required: el.required
        }));
      });
      console.log('Hire Form Fields:', formFields);
    }

    // Check dashboard orders / history
    console.log('\n--- 5. Testing Member Orders / History ---');
    const ordersLink = await page.$('a[href*="order"], a[href*="pesanan"], a[href*="history"], text=/Pesanan|Order|Riwayat/i');
    if (ordersLink) {
      await ordersLink.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_member_orders.png'), fullPage: true });
      console.log('📸 Captured 08_member_orders.png');
    }

    // Save summary report
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'audit_log.json'), JSON.stringify(logs, null, 2));
    console.log('\n✅ Audit run completed successfully!');

  } catch (err) {
    console.error('💥 Error during audit:', err);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

runAudit();
