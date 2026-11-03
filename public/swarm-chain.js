/*
 * swarm-chain.js: Multi-Page Continuous Clean Swarm Builder
 * 100% Clean: Tanpa HUD kustom, Auto-Scroll Tour aktif, dan Auto-Pindah Halaman.
 */
(async () => {
  const ROUTES = ["/", "/freelancers", "/projects"];
  const STORAGE_KEY = "__swarm_auto_chain";
  const COMMIT = "18fd2614ebea68e64f05a8d269d27de022d50cc9";
  const SRC = "https://raw.githubusercontent.com/DhvanilPatel/swarm-cursors/" + COMMIT + "/swarm-rebuild/swarm.js";
  const MAX_MS = 10 * 60 * 1000;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = (test, ms) =>
    new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function poll() {
        const v = test();
        if (v) return resolve(v);
        if (Date.now() - t0 > ms) return reject(new Error("swarm-chain: timed out"));
        setTimeout(poll, 100);
      })();
    });

  function getChainIndex() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return typeof data.idx === "number" ? data.idx : 0;
    } catch {
      return 0;
    }
  }

  function setChainIndex(idx) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ idx }));
    } catch (_) {}
  }

  function clearChain() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  const currentIdx = getChainIndex();
  if (currentIdx >= ROUTES.length) {
    clearChain();
    return;
  }

  const swarm = () => window.__swarmRebuild;

  try {
    const root = document.documentElement;
    const h = Math.max(root.scrollHeight, document.body.scrollHeight);
    const step = Math.max(300, window.innerHeight * 0.6);

    // Sapu cepat DOM dari atas ke bawah agar seluruh aset/gambar ter-load
    for (let y = 0; y < h; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await sleep(80);
    }
    window.scrollTo({ top: h, behavior: "instant" });
    await sleep(250);
    window.scrollTo({ top: 0, behavior: "instant" });
    await sleep(1000);

    // Jalankan engine asli Dhvanil
    if (!window.__swarmRebuild) {
      const code = await (await fetch(SRC)).text();
      (0, eval)(code);
    } else {
      window.__swarmRebuild.start();
    }

    const app = await until(
      () => swarm() && swarm().app && swarm().app.engine && swarm().app.engine.ready && swarm().app,
      60000
    );

    // 100% CLEAN: sembunyikan semua bar HUD pengontrol
    if (app.view && app.view.hud) {
      app.view.hud.style.setProperty("display", "none", "important");
    }

    // AUTO-SCROLL TOUR: klik tour agar otomatis scroll ke bawah mengikuti rakitan elemen
    const tourBtn = app.view.root.querySelector('[data-a="tour"]');
    if (tourBtn) {
      tourBtn.click();
    }

    // Tunggu perakitan halaman ini 100% selesai
    await until(() => app.complete, MAX_MS);
    await sleep(1600);

    // Fade kembali ke tampilan asli
    swarm().stop(true);
    await sleep(1200);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await sleep(1000);

    // Otomatis pindah ke halaman berikutnya
    const nextIdx = currentIdx + 1;
    if (nextIdx < ROUTES.length) {
      setChainIndex(nextIdx);
      const nextRoute = ROUTES[nextIdx];

      const link = document.querySelector('a[href="' + nextRoute + '"]');
      if (link) {
        link.click();
      } else {
        window.location.href = nextRoute;
      }

      // Tunggu halaman baru lalu panggil engine lagi
      await sleep(2200);
      const s = document.createElement("script");
      s.src = "/swarm-chain.js";
      document.head.appendChild(s);
    } else {
      // Seluruh halaman selesai dirakit
      clearChain();
    }
  } catch (err) {
    console.error("[swarm-chain]", err);
    clearChain();
    try {
      if (swarm() && swarm().app) swarm().stop(false);
    } catch (_) {}
  }
})();
