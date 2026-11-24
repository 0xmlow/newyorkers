/* ================================================================
   v434 SMOOTH: THE BOARDWALK SLEEPS WHEN YOU ARE FAR (2026-11-24)
   The small, numerous things built this round (marquee bulbs, string lights, the stepping feet, the zoetrope, the
   flag, the barber pole and its halo, the OPEN sign, the spill of light) stop drawing and stop animating once you
   are more than 140 metres away, where they would be under a pixel.
   ================================================================ */
(function boardwalkSleep() {
  const list = () => [window.__SIDE && SIDE.bulbs, window.__BWALK && BWALK.fest, window.__BWALK && BWALK.glow, window.__ZOE && ZOE.drum, window.__CUTS && CUTS.flag && CUTS.flag.f, window.__CUTS && CUTS.pole, window.__CUTS && CUTS.halo, window.__CUTS && CUTS.neon, window.__CUTS && CUTS.spill].concat(window.__SIDE && SIDE.feet ? SIDE.feet.bars.map(b => b.m) : []).filter(Boolean);
  const c = Math.sin(240 * PI / 180) * 107, z = Math.cos(240 * PI / 180) * 107; let t = 0, far = false;
  window.__FRAMES.push(dt => { try { t -= dt; if (t > 0) return; t = 0.5; const f = Math.hypot(camera.position.x - c, camera.position.z - z) > 140 && camera.position.y < 60; if (f === far) return; far = f; list().forEach(o => { if (far) { o.userData.__wasVis = o.visible; o.visible = false; } else o.visible = o.userData.__wasVis !== undefined ? o.userData.__wasVis : true; }); } catch (e) { } });
})();
