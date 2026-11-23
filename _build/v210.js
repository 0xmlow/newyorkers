/* ================================================================
   v210 THE LOOK: NEON IN THE WINDOWS (2026-11-23)
   The bodega's windows get the neon every corner store has: OPEN in red with a blue border, ATM, LOTTO and
   COLD JPGs; the laundromat gets a blue WASH DRY FOLD. Glass tubes that buzz on at dusk and flicker now and then,
   left on all night. ?neon2=0 off.
   ================================================================ */
const NEON2 = { list: [] };
window.__NEON2 = NEON2;
(function windowNeon() {
  if (!LOOK.on || /neon2=0/.test(location.search)) return;
  const mk = (lines, w, h) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * h / w); const c = cv.getContext('2d'); if (!c || !c.fillText || !c.strokeText || !c.strokeRect) return null; c.clearRect(0, 0, cv.width, cv.height);
    c.lineJoin = 'round'; c.textAlign = 'center'; c.textBaseline = 'middle'; const H = cv.height;
    lines.forEach(([t, col, y, s, box]) => { c.font = `700 ${s}px "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif`; c.shadowColor = col; c.shadowBlur = 18; c.strokeStyle = col; c.lineWidth = 7; c.strokeText(t, 256, y * H); c.shadowBlur = 0; c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeText(t, 256, y * H);
      if (box) { c.shadowColor = box; c.shadowBlur = 16; c.strokeStyle = box; c.lineWidth = 6; c.strokeRect(14, 14, 484, H - 28); c.shadowBlur = 0; } });
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const add = (tex, w, h, x, y, z, ry) => { if (!tex) return; const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.renderOrder = 5; scene.add(p); NEON2.list.push({ m, f: Math.random() * 20 }); };
  const bg = ground(17, 66) + 0.02, fx = 17 - 5 - 0.24;
  add(mk([['OPEN', '#ff2a3a', 0.5, 130, '#2a7bff']], 1.1, 0.55), 1.1, 0.55, fx, bg + 2.2, 63.2, -PI / 2);
  add(mk([['ATM', '#36ff7a', 0.5, 150]], 0.7, 0.35), 0.7, 0.35, fx, bg + 1.75, 61.8, -PI / 2);
  add(mk([['LOTTO', '#ffd400', 0.5, 120]], 0.9, 0.35), 0.9, 0.35, fx, bg + 2.2, 69.0, -PI / 2);
  add(mk([['COLD', '#2fd0ff', 0.32, 110], ['JPGs', '#ff4fd8', 0.72, 110]], 0.9, 0.7), 0.9, 0.7, fx, bg + 1.8, 70.4, -PI / 2);
  try { if (window.__LAUND && LAUND.g0 != null) add(mk([['WASH · DRY · FOLD', '#3aa8ff', 0.5, 64, '#ff4fa3']], 1.8, 0.45), 1.8, 0.45, LAUND.fx + 0.02, LAUND.g0 + 2.35, LAUND.z0 + 2.2, PI / 2); } catch (e) { }
})();
window.__FRAMES.push(dt => { try { if (!NEON2.list.length) return; const k = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.05) * 2)); NEON2.list.forEach(n => { n.f -= dt; let fl = 1; if (n.f < 0) { fl = Math.random() < 0.5 ? 0.15 : 1; if (n.f < -0.25) n.f = 8 + Math.random() * 25; } n.m.opacity = k * fl * 0.95; }); } catch (e) { } });
