/**
 * Swarm Chain Autopilot (Multi-Page Continuous Builder)
 * Automatically chains Swarm Rebuild across multiple pages from 0% to 100%.
 */
(() => {
  const CHAIN = [
    { path: "/", name: "Beranda" },
    { path: "/freelancers", name: "Direktori Talenta" },
    { path: "/projects", name: "Showcase Portofolio" }
  ];

  const STORAGE_KEY = "__swarm_chain_state";

  function getState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { active: false, index: 0 };
    } catch {
      return { active: false, index: 0 };
    }
  }

  function saveState(state) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function clearState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function ensureSwarmScript(cb) {
    if (window.__swarmRebuild) {
      cb();
      return;
    }
    const s = document.createElement("script");
    s.src = "/swarm.js";
    s.onload = () => cb();
    document.head.appendChild(s);
  }

  function createChainHUD(currentStep, totalSteps, name) {
    let hud = document.getElementById("swarm-chain-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "swarm-chain-hud";
      hud.style.cssText = `
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        z-index: 10000002; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px;
        padding: 8px 20px; display: flex; align-items: center; gap: 12px;
        color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.45);
        transition: all 0.3s ease;
      `;
      document.body.appendChild(hud);
    }
    hud.innerHTML = `
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0D99FF;box-shadow:0 0 10px #0D99FF;animation:pulse 1.5s infinite"></span>
      <span>Halaman [${currentStep}/${totalSteps}]: <b style="color:#38bdf8">${name}</b></span>
      <span style="color:#64748b">|</span>
      <span id="swarm-chain-status" style="color:#94a3b8;font-size:12px;">Merakit dari nol...</span>
      <button id="swarm-chain-stop" style="background:#ef4444;border:none;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;cursor:pointer;margin-left:6px;">Berhenti</button>
    `;

    document.getElementById("swarm-chain-stop").onclick = () => {
      clearState();
      if (window.__swarmRebuild) window.__swarmRebuild.stop(true);
      hud.remove();
    };
  }

  function startChain(forceIndex = 0) {
    saveState({ active: true, index: forceIndex });
    runStep(forceIndex);
  }

  function runStep(idx) {
    if (idx >= CHAIN.length) {
      const hud = document.getElementById("swarm-chain-hud");
      if (hud) {
        hud.innerHTML = `
          <span style="color:#22c55e;font-size:16px;">🎉</span>
          <span><b>Semua Halaman Selesai Dirakit 100%!</b></span>
          <button style="background:transparent;border:1px solid #475569;color:#fff;font-size:11px;padding:3px 10px;border-radius:9999px;cursor:pointer;margin-left:8px;" onclick="this.parentElement.remove()">Tutup</button>
        `;
      }
      clearState();
      return;
    }

    const item = CHAIN[idx];
    createChainHUD(idx + 1, CHAIN.length, item.name);

    ensureSwarmScript(() => {
      if (window.__swarmRebuild) {
        // Start rebuild
        window.__swarmRebuild.start();
      }
    });

    // One-time listener for completion
    const onComplete = (e) => {
      window.removeEventListener("swarm:complete", onComplete);
      const statusEl = document.getElementById("swarm-chain-status");
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#22c55e">Selesai 100%! Pindah halaman dalam 2s...</span>`;
      }

      setTimeout(() => {
        const nextIdx = idx + 1;
        if (nextIdx < CHAIN.length) {
          saveState({ active: true, index: nextIdx });
          const nextTarget = CHAIN[nextIdx];
          
          // Next.js client-side navigation or fallback
          const navLink = document.querySelector(`a[href="${nextTarget.path}"]`);
          if (navLink) {
            navLink.click();
          } else {
            window.location.href = nextTarget.path;
          }
        } else {
          runStep(nextIdx);
        }
      }, 2400);
    };

    window.addEventListener("swarm:complete", onComplete);
  }

  // Auto-resume if in active state
  const state = getState();
  if (state.active) {
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => runStep(state.index), 600);
    });
  }

  window.__swarmChain = {
    start: () => startChain(0),
    stop: () => {
      clearState();
      const hud = document.getElementById("swarm-chain-hud");
      if (hud) hud.remove();
      if (window.__swarmRebuild) window.__swarmRebuild.stop(true);
    }
  };

  // If user injects manually, start immediately:
  if (!state.active) {
    startChain(0);
  }
})();
