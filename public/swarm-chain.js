/*
 * swarm-chain.js: Multi-Page Continuous Clean Swarm Builder
 */
(async () => {
  sessionStorage.setItem("__swarm_auto_chain", JSON.stringify({ active: true, idx: 0 }));
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  } else {
    window.location.reload();
  }
})();
