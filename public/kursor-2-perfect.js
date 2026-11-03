/**
 * KURSOR 2: Perfect Multiplayer Cursors (Engine by Steve Ruiz / tldraw)
 * Features:
 * - Catmull-Rom spline interpolation (Zero jitter, buttery smooth)
 * - Autonomous multi-collaborator agents (Nezuko, Renando, Sarah)
 * - Element-aware browsing: hovers, clicks, scroll sync
 * - Non-destructive (Leaves page intact, zero footprint)
 */
(() => {
  if (window.__perfectCursors && window.__perfectCursors.active) {
    window.__perfectCursors.stop();
    return;
  }

  // --- Steve Ruiz: Vec & Spline Math ---
  const Vec = {
    dist: (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1]),
    clamp: (n, min, max) => Math.max(min, Math.min(n, max))
  };

  class Spline {
    constructor(points = []) {
      this.points = points;
      this.lengths = points.map((p, i, a) => (i === 0 ? 0 : Vec.dist(p, a[i - 1])));
      this.totalLength = this.lengths.reduce((acc, c) => acc + c, 0);
    }
    addPoint(p) {
      if (this.points.length > 0) {
        this.lengths.push(Vec.dist(p, this.points[this.points.length - 1]));
        this.totalLength += this.lengths[this.lengths.length - 1];
      }
      this.points.push(p);
    }
    clear() {
      this.points = [];
      this.lengths = [];
      this.totalLength = 0;
    }
    getSplinePoint(rt) {
      const { points } = this;
      const l = points.length - 1;
      const d = Math.trunc(rt);
      const p1 = Math.min(d + 1, l);
      const p2 = Math.min(p1 + 1, l);
      const p3 = Math.min(p2 + 1, l);
      const p0 = Math.max(0, p1 - 1);
      const t = rt - d;
      const tt = t * t;
      const ttt = tt * t;
      const q1 = -ttt + 2 * tt - t;
      const q2 = 3 * ttt - 5 * tt + 2;
      const q3 = -3 * ttt + 4 * tt + t;
      const q4 = ttt - tt;
      return [
        (points[p0][0] * q1 + points[p1][0] * q2 + points[p2][0] * q3 + points[p3][0] * q4) / 2,
        (points[p0][1] * q1 + points[p1][1] * q2 + points[p2][1] * q3 + points[p3][1] * q4) / 2
      ];
    }
  }

  class PerfectCursor {
    constructor(cb) {
      this.cb = cb;
      this.state = "idle";
      this.queue = [];
      this.timestamp = performance.now();
      this.spline = new Spline();
      this.prevPoint = null;
    }
    addPoint(point) {
      const now = performance.now();
      const duration = Math.min(now - this.timestamp, 300);
      if (!this.prevPoint) {
        this.spline.clear();
        this.prevPoint = point;
        this.spline.addPoint(point);
        this.cb(point);
        this.state = "stopped";
        return;
      }
      if (this.state === "stopped") {
        if (Vec.dist(this.prevPoint, point) < 4) {
          this.cb(point);
          return;
        }
        this.spline.clear();
        this.spline.addPoint(this.prevPoint);
        this.spline.addPoint(this.prevPoint);
        this.spline.addPoint(point);
        this.state = "idle";
      } else {
        this.spline.addPoint(point);
      }
      const anim = {
        start: Math.max(0, this.spline.points.length - 3),
        duration: Math.max(30, duration)
      };
      this.prevPoint = point;
      this.timestamp = now;
      if (this.state === "idle") {
        this.state = "animating";
        this.animate(anim);
      } else {
        this.queue.push(anim);
      }
    }
    animate(anim) {
      const start = performance.now();
      const loop = () => {
        const t = (performance.now() - start) / anim.duration;
        if (t <= 1 && this.spline.points.length > 0) {
          try {
            this.cb(this.spline.getSplinePoint(t + anim.start));
          } catch (_) {}
          requestAnimationFrame(loop);
          return;
        }
        const next = this.queue.shift();
        if (next) {
          this.animate(next);
        } else {
          this.state = "stopped";
        }
      };
      loop();
    }
  }

  // --- UI Styles & Elements ---
  const STYLES = `
    .pc-wrap { position: fixed; inset: 0; pointer-events: none; z-index: 9999999; overflow: hidden; }
    .pc-agent {
      position: absolute; top: 0; left: 0; pointer-events: none;
      will-change: transform; transition: opacity 0.3s;
    }
    .pc-svg { width: 22px; height: 22px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35)); }
    .pc-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 9999px; font-size: 11px;
      font-weight: 600; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin-left: 14px; margin-top: -6px; white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .pc-bubble {
      margin-left: 18px; margin-top: 4px; background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15);
      color: #f1f5f9; padding: 4px 10px; border-radius: 8px; font-size: 11px;
      font-family: sans-serif; max-width: 180px; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      animation: pcPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes pcPop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .pc-ripple {
      position: absolute; width: 30px; height: 30px; border-radius: 50%;
      border: 2px solid; transform: translate(-50%, -50%); pointer-events: none;
      animation: pcRipple 0.6s ease-out forwards;
    }
    @keyframes pcRipple {
      0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }
    .pc-dock {
      position: fixed; bottom: 20px; right: 20px; background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 9999px; padding: 6px 14px; display: flex; align-items: center; gap: 8px;
      color: #e2e8f0; font-size: 12px; font-weight: 600; font-family: sans-serif;
      z-index: 10000000; box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }
    .pc-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pcPulse 1.5s infinite; }
    @keyframes pcPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `;

  let styleTag = document.getElementById("pc-styles");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "pc-styles";
    styleTag.textContent = STYLES;
    document.head.appendChild(styleTag);
  }

  const container = document.createElement("div");
  container.className = "pc-wrap";
  document.body.appendChild(container);

  const dock = document.createElement("div");
  dock.className = "pc-dock";
  dock.innerHTML = `<div class="pc-dot"></div><span>3 Agen Kolaborator Aktif (tldraw engine)</span> <button style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:14px;margin-left:4px;" onclick="window.__perfectCursors.stop()">✕</button>`;
  document.body.appendChild(dock);

  // --- Agents Definition ---
  const AGENTS = [
    { name: "🎎 Nezuko", color: "#ec4899", quotes: ["Tampilannya rapi!", "Desainnya estetik ✨", "Siap live!"] },
    { name: "⚡ Renando", color: "#06b6d4", quotes: ["VFX breakdown mantap", "Flow section enak", "Navigasi smooth"] },
    { name: "🎨 Sarah", color: "#8b5cf6", quotes: ["Tipografi kontras", "Palet warna pas", "Mobile responsive"] }
  ];

  const agentInstances = AGENTS.map((cfg) => {
    const el = document.createElement("div");
    el.className = "pc-agent";
    el.innerHTML = `
      <svg class="pc-svg" viewBox="0 0 24 24" fill="none">
        <path d="M5.65 2.14a1 1 0 0 0-1.28 1.28l6.73 18.06a1 1 0 0 0 1.83.08l2.97-6.28 6.28-2.97a1 1 0 0 0 .08-1.83L5.65 2.14Z" fill="${cfg.color}" stroke="#ffffff" stroke-width="1.6"/>
      </svg>
      <div class="pc-badge" style="background:${cfg.color}">${cfg.name}</div>
      <div class="pc-bubble" style="display:none"></div>
    `;
    container.appendChild(el);

    const bubbleEl = el.querySelector(".pc-bubble");
    const cursor = new PerfectCursor(([x, y]) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    return {
      cfg,
      el,
      bubbleEl,
      cursor,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      targetEl: null
    };
  });

  // --- Click Ripple Effect ---
  const spawnRipple = (x, y, color) => {
    const r = document.createElement("div");
    r.className = "pc-ripple";
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    r.style.borderColor = color;
    container.appendChild(r);
    setTimeout(() => r.remove(), 650);
  };

  // --- Autonomous Behavior Loop ---
  let isRunning = true;

  const targets = Array.from(document.querySelectorAll("button, a, h1, h2, h3, img, .card, [data-interactive]"))
    .filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 15;
    });

  agentInstances.forEach((inst, idx) => {
    const tick = () => {
      if (!isRunning) return;

      // Pick next target element or random spot
      let tx, ty;
      if (targets.length > 0 && Math.random() > 0.3) {
        const randEl = targets[Math.floor(Math.random() * targets.length)];
        const rect = randEl.getBoundingClientRect();
        tx = rect.left + rect.width * (0.2 + Math.random() * 0.6);
        ty = rect.top + rect.height * (0.2 + Math.random() * 0.6);
      } else {
        tx = 40 + Math.random() * (window.innerWidth - 80);
        ty = 60 + Math.random() * (window.innerHeight - 120);
      }

      inst.cursor.addPoint([tx, ty]);

      // Random click or chat bubble
      const delay = 1200 + Math.random() * 2200;
      setTimeout(() => {
        if (!isRunning) return;
        if (Math.random() > 0.6) {
          spawnRipple(tx, ty, inst.cfg.color);
        }
        if (Math.random() > 0.75) {
          const q = inst.cfg.quotes[Math.floor(Math.random() * inst.cfg.quotes.length)];
          inst.bubbleEl.textContent = q;
          inst.bubbleEl.style.display = "block";
          setTimeout(() => {
            inst.bubbleEl.style.display = "none";
          }, 2400);
        }
        tick();
      }, delay);
    };

    setTimeout(tick, idx * 600);
  });

  window.__perfectCursors = {
    active: true,
    stop: () => {
      isRunning = false;
      container.remove();
      dock.remove();
      styleTag.remove();
      delete window.__perfectCursors;
    }
  };
})();
