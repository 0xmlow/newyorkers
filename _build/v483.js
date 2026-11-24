/* ================================================================
   v483 THE SKY POINTS AT THE WALK (2026-11-24)
   While the drone show holds the card of the hour over the harbour, that card's plaque on the Memes Walk blazes:
   its ring of light (v400) doubles in size and brightness, so anyone on the island can look up, then down, and
   find the card in the river.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__MWALK || !MWALK.glow || !window.__DRONES) return; const on = DRONES.t > 0 && DRONES.cardIdx != null && Math.floor((DRONES.t - 4) / 9) === DRONES.cardIdx;
  const s = on ? 2.0 : 1.0; MWALK.glow.scale.lerp(_cdS.set(s, s, s), 0.08); if (on) MWALK.glow.material.opacity = 1.0; } catch (e) { } });
const _cdS = new V3();
