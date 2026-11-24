/* ================================================================
   v472 THE ILLUSION BEACH AFTER DARK (2026-11-24)
   At night the east beach went black. Now its gold plaques glow softly enough to read, the Kanizsa wall is lit
   from the front (so the triangle still appears after dark, whiter than ever), the spiral glows on its frame and
   the wheel's rim catches a small spotlight, so the walk of illusions stays a walk at night.
   ================================================================ */
(function eastNight() {
  if (!window.__EASTB) return; const mats = []; scene.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.map.image && SIGNS.some(s => s.t === o.material.map && s.lines && s.lines[0] && EASTB.list.some(e => e.title === s.lines[0].t))) mats.push(o.material); });
  mats.forEach(m => { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0; m.needsUpdate = true; }); EASTB.nightM = mats;
  try { if (EASTB.fraser) { const m = EASTB.fraser.material; m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0; m.needsUpdate = true; EASTB.nightM.push(m); } } catch (e) { }
})();
window.__FRAMES.push(() => { try { if (!EASTB.nightM) return; const k = Math.min(1, Math.max(0, (L.lamps || 0) * 1.4 - 0.2)); EASTB.nightM.forEach(m => m.emissiveIntensity = k * 0.55); } catch (e) { } });
