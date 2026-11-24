/* ================================================================
   v279 THE BANNERS AT NIGHT (2026-11-23)
   The card banners at the river crossings (v273) are backlit after dusk like the lightbox banners on Fifth Avenue,
   so the card at each crossing still reads at midnight.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__CBAN || !CBAN.list.length) return; const k = Math.min(1, (L.lamps || 0) * 1.3);
  CBAN.list.forEach(b => { const m = b.m.material; if (!m.emissiveMap) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0xffffff); m.needsUpdate = true; } m.emissiveIntensity = 0.02 + 0.75 * k; }); } catch (e) { } });
