const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runDetailedAudit() {
  console.log('🚀 Membuka Browser Playwright Live (Headed mode dengan slowMo 500ms)...');
  
  // Headless: false & slowMo: 500 sesuai permintaan agar user bisa melihat langsung di layar
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ [Console Error]:', msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. PUBLIC LANDING PAGE
    // -------------------------------------------------------------
    console.log('\n=== 1. AUDITING BERANDA UTAMA (LANDING PAGE) ===');
    await page.goto('https://creative-hub-sandy.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing_full.png'), fullPage: true });

    // -------------------------------------------------------------
    // 2. FREELANCER DIRECTORY & DETAIL
    // -------------------------------------------------------------
    console.log('\n=== 2. AUDITING DIREKTORI & PROFIL TALENT ===');
    await page.goto('https://creative-hub-sandy.vercel.app/freelancers', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const talentCard = await page.$('a[href^="/freelancers/"]');
    if (talentCard) {
      await talentCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => !document.body.innerText.includes('Memuat profil kreator...'), { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_talent_profile.png'), fullPage: true });

      // Cek tombol Hire / Booking
      const hireBtn = await page.$('button:has-text("Hire"), button:has-text("Booking Project")');
      if (hireBtn) {
        console.log('Membuka modal Hire / Booking Project...');
        await hireBtn.click();
        await page.waitForTimeout(1500);

        // Simulasi scroll modal agar user melihat seluruh rincian
        await page.evaluate(() => {
          const modal = document.querySelector('.max-h-\\[90vh\\]');
          if (modal) modal.scrollTop = modal.scrollHeight / 2;
        });
        await page.waitForTimeout(1000);
        await page.evaluate(() => {
          const modal = document.querySelector('.max-h-\\[90vh\\]');
          if (modal) modal.scrollTop = modal.scrollHeight;
        });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_hire_modal_detail.png') });

        // Tutup modal
        const closeBtn = await page.$('button:has-text("Batal"), button:has(svg.lucide-x)');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // -------------------------------------------------------------
    // 3. SECURE PROJECT TRACKER
    // -------------------------------------------------------------
    console.log('\n=== 3. AUDITING PROJECT TRACKER ===');
    await page.goto('https://creative-hub-sandy.vercel.app/track', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const ticketInput = await page.$('input[placeholder*="CH-"]');
    const waInput = await page.$('input[maxlength="4"]');
    if (ticketInput && waInput) {
      console.log('Menguji lacak tiket #CH-2609-5871 dengan 4 digit WA 7890...');
      await ticketInput.fill('#CH-2609-5871');
      await waInput.fill('7890');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_track_verified.png'), fullPage: true });
    }

    // -------------------------------------------------------------
    // 4. OWNER LOGIN & DASHBOARD AUDIT
    // -------------------------------------------------------------
    console.log('\n=== 4. AUDITING OWNER DASHBOARD (grown / 153712) ===');
    await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle' });
    
    const ownerUser = await page.$('input[type="text"], input[name="username"], input[name="email"]');
    const ownerPass = await page.$('input[type="password"]');
    if (ownerUser && ownerPass) {
      await ownerUser.fill('grown');
      await ownerPass.fill('153712');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_owner_overview.png'), fullPage: true });

    // Klik tab 'Daftar Pesanan'
    const ordersTab = await page.$('button:has-text("Daftar Pesanan")');
    if (ordersTab) {
      console.log('Membuka Tab: Daftar Pesanan...');
      await ordersTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_owner_tab_pesanan.png'), fullPage: true });
    }

    // Klik tab 'Keuangan & Bagi Hasil'
    const financeTab = await page.$('button:has-text("Keuangan")');
    if (financeTab) {
      console.log('Membuka Tab: Keuangan & Bagi Hasil...');
      await financeTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_owner_tab_keuangan.png'), fullPage: true });
    }

    // Logout Owner
    console.log('Keluar dari akun Owner...');
    const ownerLogoutBtn = await page.$('header button:has-text("Keluar")');
    if (ownerLogoutBtn) {
      await ownerLogoutBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await context.clearCookies();
    }

    // -------------------------------------------------------------
    // 5. MEMBER LOGIN & WORKSPACE AUDIT
    // -------------------------------------------------------------
    console.log('\n=== 5. AUDITING MEMBER DASHBOARD (petonaibana@gmail.com / petoCreative) ===');
    await page.goto('https://creative-hub-sandy.vercel.app/login', { waitUntil: 'networkidle' });
    
    const memUser = await page.$('input[type="text"], input[name="username"], input[name="email"]');
    const memPass = await page.$('input[type="password"]');
    if (memUser && memPass) {
      await memUser.fill('petonaibana@gmail.com');
      await memPass.fill('petoCreative');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_member_orders.png'), fullPage: true });

    // Tab Profil & Tarif Pelajar
    const profileTab = await page.$('button:has-text("Profil & Tarif Pelajar")');
    if (profileTab) {
      console.log('Membuka Tab: Profil & Tarif Pelajar...');
      await profileTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_member_tab_profile.png'), fullPage: true });
    }

    // Tab Portofolio Karya
    const portfolioTab = await page.$('button:has-text("Portofolio Karya")');
    if (portfolioTab) {
      console.log('Membuka Tab: Portofolio Karya...');
      await portfolioTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_member_tab_portfolio.png'), fullPage: true });
    }

    console.log('\n🎉 Pengujian Live Playwright selesai dengan sukses!');
    await page.waitForTimeout(3000);

  } catch (err) {
    console.error('💥 Error selama audit:', err);
  } finally {
    await browser.close();
  }
}

runDetailedAudit();
