'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SwarmAutopilot() {
  const pathname = usePathname();

  useEffect(() => {
    // Global controller untuk console
    (window as any).__startSwarmChain = () => {
      sessionStorage.setItem("__swarm_auto_chain", JSON.stringify({ active: true, idx: 0 }));
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      } else {
        window.location.reload();
      }
    };

    (window as any).__stopSwarmChain = () => {
      sessionStorage.removeItem("__swarm_auto_chain");
      document.documentElement.style.visibility = "visible";
      const swarm = (window as any).__swarmRebuild;
      if (swarm && swarm.stop) swarm.stop(true);
    };

    let state: { active: boolean; idx: number } | null = null;
    try {
      const raw = sessionStorage.getItem("__swarm_auto_chain");
      if (raw) state = JSON.parse(raw);
    } catch {}

    if (!state || !state.active) return;

    const ROUTES = ["/", "/freelancers", "/projects"];
    const idx = state.idx || 0;

    if (idx >= ROUTES.length) {
      sessionStorage.removeItem("__swarm_auto_chain");
      document.documentElement.style.visibility = "visible";
      return;
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const until = (test: () => any, ms: number) =>
      new Promise((resolve, reject) => {
        const t0 = Date.now();
        (function poll() {
          const v = test();
          if (v) return resolve(v);
          if (Date.now() - t0 > ms) return reject(new Error("timeout"));
          setTimeout(poll, 80);
        })();
      });

    (async () => {
      try {
        const SRC = "/swarm.js";

        // Pre-scroll DOM di background saat layar masih tersembunyi
        const root = document.documentElement;
        const h = Math.max(root.scrollHeight, document.body.scrollHeight);
        const step = Math.max(300, window.innerHeight * 0.6);
        for (let y = 0; y < h; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await sleep(50);
        }
        window.scrollTo({ top: h, behavior: "instant" });
        await sleep(150);
        window.scrollTo({ top: 0, behavior: "instant" });
        await sleep(400);

        // Fetch engine jika belum ada
        if (!(window as any).__swarmRebuild) {
          const code = await (await fetch(SRC)).text();
          (0, eval)(code);
        } else {
          (window as any).__swarmRebuild.start();
        }

        const swarm = () => (window as any).__swarmRebuild;
        const app = (await until(
          () => swarm() && swarm().app && swarm().app.engine && swarm().app.engine.ready && swarm().app,
          60000
        )) as any;

        // Pulihkan visibilitas elemen karena Swarm sudah memasang kanvas hitamnya sendiri
        document.documentElement.style.visibility = "visible";

        // Sembunyikan kontrol HUD
        if (app.view && app.view.hud) {
          app.view.hud.style.setProperty("display", "none", "important");
        }

        // Aktifkan auto-tour scroll ke bawah
        const tourBtn = app.view.root.querySelector('[data-a="tour"]');
        if (tourBtn) tourBtn.click();

        // DETEKSI SELESAI ANTI-DEADLOCK:
        // Selesai jika waitCount == 0, atau app.complete == true, atau flocking == true
        await until(
          () =>
            (app.engine && app.engine.started && app.engine.waitCount === 0) ||
            app.complete ||
            (app.engine && app.engine.flocking),
          10 * 60 * 1000
        );

        // Biarkan kursor terbang selebrasi selama 1.5 detik
        await sleep(1500);

        // Reveal halaman asli yang sesungguhnya
        swarm().stop(true);
        await sleep(1000);
        window.scrollTo({ top: 0, behavior: "smooth" });
        await sleep(1200);

        // Navigasi ke halaman berikutnya
        const nextIdx = idx + 1;
        if (nextIdx < ROUTES.length) {
          sessionStorage.setItem("__swarm_auto_chain", JSON.stringify({ active: true, idx: nextIdx }));
          // Hard navigation agar halaman baru mulai dari nol mutlak
          window.location.href = ROUTES[nextIdx];
        } else {
          sessionStorage.removeItem("__swarm_auto_chain");
        }
      } catch (err) {
        console.error("[swarm-autopilot]", err);
        document.documentElement.style.visibility = "visible";
        sessionStorage.removeItem("__swarm_auto_chain");
      }
    })();
  }, [pathname]);

  return null;
}
