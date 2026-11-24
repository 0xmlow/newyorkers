/* ================================================================
   v458 THE DRONE SHOW FLIES 6529 (2026-11-24)
   The show draws the eye, N3W YORKERS, gm, a slice and an Open Eye Flower. It now also writes 6529 in gold across
   the harbour (after N3W YORKERS) and closes on a red heart before the eye comes back and they land.
   ================================================================ */
(function drone6529() {
  if (!window.__DRONES || typeof droneForm !== 'function') return;
  DRONES.extra = () => { const a = droneForm((c, W, H) => { c.fillStyle = '#ffc23a'; let fs = 150; c.font = `900 ${fs}px "Archivo", "Arial Black", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('6529', W / 2, H / 2 + 6); });
    const h = droneForm((c, W, H) => { c.fillStyle = '#ff2a3a'; c.beginPath(); for (let i = 0; i <= 64; i++) { const t = i / 64 * PI * 2, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); c.lineTo(W / 2 + x * 5.4, H / 2 - y * 5.4 - 6); } c.closePath(); c.fill(); });
    return { a, h }; };
})();
window.__FRAMES.push(() => { try { if (!DRONES.extra || DRONES.v458 || !DRONES.forms || DRONES.forms.length < 2) return; DRONES.v458 = true; const { a, h } = DRONES.extra(); if (a) DRONES.forms.splice(2, 0, a); if (h) DRONES.forms.push(h); } catch (e) { } });
