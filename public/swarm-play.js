/*
 * swarm-play.js: plays "Swarm Rebuild" ONCE on the page that is open, then fades back to the real page.
 *
 * Use it after you have built and served a site on localhost: open the page, then run this file in the
 * page (a script tag, the devtools console, or your agent's "run JavaScript in the page" tool).
 * Nothing is written to disk and nothing is left behind: when it ends, the script tag, the engine and
 * every flag it set are removed, and the site's Motion switch is put back the way it was.
 *
 * The animation engine is NOT in this file. It is Swarm Rebuild by DhvanilPatel
 * (https://github.com/DhvanilPatel/swarm-cursors), a tribute to Swarm by Joel Califa
 * (https://joelcalifa.com). It is fetched from that repo at a pinned commit. This file only starts it,
 * turns on Tour (auto-scroll, so the whole page is built and not just the first screen) and exits.
 */
(async () => {
  const COMMIT = "18fd2614ebea68e64f05a8d269d27de022d50cc9";
  const SRC = `https://raw.githubusercontent.com/DhvanilPatel/swarm-cursors/${COMMIT}/swarm-rebuild/swarm.js`;
  const MAX_MS = 10 * 60 * 1000;

  const me = document.currentScript;
  if (me) me.remove(); // the tag is not needed once the code is running

  if (window.__swarmPlay) return;
  window.__swarmPlay = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = (test, ms) =>
    new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function poll() {
        const v = test();
        if (v) return resolve(v);
        if (Date.now() - t0 > ms) return reject(new Error("swarm-play: timed out"));
        setTimeout(poll, 100);
      })();
    });

  // The portfolio hides blocks that are off screen while its Motion is on ("reveal on scroll"). The swarm
  // photographs the page before it scrolls there, so those blocks would be rebuilt blank. Motion off shows
  // everything; it goes back on at the end.
  const root = document.documentElement;
  const motionBtn = document.querySelector(".motion-toggle");
  const motionWasOn = !!motionBtn && root.dataset.motion === "on";
  const swarm = () => window.__swarmRebuild;

  try {
    if (motionWasOn) {
      motionBtn.click();
      await sleep(900);
    }
    // Blocks below the fold only turn visible once they have been scrolled past, and some fade in after a
    // short delay. Sweep the page once, instantly, and wait for those delays, so the swarm sees everything.
    const h = Math.max(root.scrollHeight, document.body.scrollHeight);
    const step = Math.max(300, innerHeight * 0.6);
    for (let y = 0; y < h; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await sleep(90);
    }
    window.scrollTo({ top: h, behavior: "instant" });
    await sleep(300);
    window.scrollTo({ top: 0, behavior: "instant" });
    await sleep(1500);
    const code = await (await fetch(SRC)).text();
    (0, eval)(code); // starts the rebuild by itself
    const app = await until(() => swarm() && swarm().app && swarm().app.engine && swarm().app.engine.ready && swarm().app, 60000);
    app.view.hud.style.setProperty("display", "none", "important"); // hide the control bar; only the cursors and the page show
    app.view.root.querySelector('[data-a="tour"]').click(); // Tour = auto-scroll down the page
    await until(() => app.complete, MAX_MS);
    await sleep(1500);
    swarm().stop(true); // fade back to the real page
    await sleep(1300);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    const live = document.querySelector(".motion-toggle");
    if (motionWasOn && live && root.dataset.motion === "off") live.click(); // Motion back on
    await sleep(1500);
    try { if (swarm() && swarm().app) swarm().stop(false); } catch (_) {}
    delete window.__swarmRebuild;
    delete window.__swarmPlay; // no trace left; it can be played again
  }
})();
