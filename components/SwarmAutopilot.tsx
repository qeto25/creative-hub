'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SwarmAutopilot() {
  const pathname = usePathname();

  useEffect(() => {
    // Expose global controller
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
      const swarm = (window as any).__swarmRebuild;
      if (swarm && swarm.stop) swarm.stop(true);
      const v = document.getElementById("__swarm_veil");
      if (v) v.remove();
    };

    let state: { active: boolean; idx: number } | null = null;
    try {
      const raw = sessionStorage.getItem("__swarm_auto_chain");
      if (raw) state = JSON.parse(raw);
    } catch {}

    if (!state || !state.active) return;

    const ROUTES = ["/", "/freelancers", "/projects", "/track"];
    const idx = state.idx || 0;

    if (idx >= ROUTES.length) {
      sessionStorage.removeItem("__swarm_auto_chain");
      return;
    }

    // Instant black veil: layar langsung kosong dari detik 0
    const veil = document.createElement("div");
    veil.id = "__swarm_veil";
    veil.style.cssText = "position:fixed;inset:0;z-index:9999999;background:#09090b;";
    document.body.appendChild(veil);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const until = (test: () => any, ms: number) =>
      new Promise((resolve, reject) => {
        const t0 = Date.now();
        (function poll() {
          const v = test();
          if (v) return resolve(v);
          if (Date.now() - t0 > ms) return reject(new Error("timeout"));
          setTimeout(poll, 100);
        })();
      });

    (async () => {
      try {
        const COMMIT = "18fd2614ebea68e64f05a8d269d27de022d50cc9";
        const SRC = "https://raw.githubusercontent.com/DhvanilPatel/swarm-cursors/" + COMMIT + "/swarm-rebuild/swarm.js";

        // Pre-scroll DOM
        const root = document.documentElement;
        const h = Math.max(root.scrollHeight, document.body.scrollHeight);
        const step = Math.max(300, window.innerHeight * 0.6);
        for (let y = 0; y < h; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await sleep(60);
        }
        window.scrollTo({ top: h, behavior: "instant" });
        await sleep(200);
        window.scrollTo({ top: 0, behavior: "instant" });
        await sleep(600);

        // Evaluasi swarm engine
        const code = await (await fetch(SRC)).text();
        (0, eval)(code);

        const swarm = () => (window as any).__swarmRebuild;
        const app = (await until(
          () => swarm() && swarm().app && swarm().app.engine && swarm().app.engine.ready && swarm().app,
          60000
        )) as any;

        // Lepas veil saat swarm sudah siap
        if (veil && veil.parentNode) veil.remove();

        // 100% Clean HUD
        if (app.view && app.view.hud) {
          app.view.hud.style.setProperty("display", "none", "important");
        }

        // Auto-tour scroll ke bawah
        const tourBtn = app.view.root.querySelector('[data-a="tour"]');
        if (tourBtn) tourBtn.click();

        // Tunggu 100% complete
        await until(() => app.complete, 10 * 60 * 1000);
        await sleep(1500);

        // Reveal
        swarm().stop(true);
        await sleep(1000);
        window.scrollTo({ top: 0, behavior: "smooth" });
        await sleep(1000);

        // Pindah ke rute berikutnya dengan fresh navigation
        const nextIdx = idx + 1;
        if (nextIdx < ROUTES.length) {
          sessionStorage.setItem("__swarm_auto_chain", JSON.stringify({ active: true, idx: nextIdx }));
          window.location.href = ROUTES[nextIdx];
        } else {
          sessionStorage.removeItem("__swarm_auto_chain");
        }
      } catch (err) {
        console.error("[swarm-autopilot]", err);
        if (veil && veil.parentNode) veil.remove();
        sessionStorage.removeItem("__swarm_auto_chain");
      }
    })();
  }, [pathname]);

  return null;
}
