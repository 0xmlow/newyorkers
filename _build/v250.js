/* ================================================================
   v250 WHEATPASTE: THE MEMES ON THE STREET (2026-11-23)
   MLow's wheatpaste technique, the way he pasted Marks across fifteen New York walls: real 6529 Memes cards
   printed as posters and pasted up in layers on the bodega's east wall and the laundromat's back wall. Two staggered
   rows, each sheet a little crooked, torn edges, glue sheen, a few ripped half off so older paper shows under them,
   corners lifting. The cards are the island's own (cropped from its card atlas), different on each wall, and each
   set is pasted again when the atlas has loaded. ?wheatpaste=0 turns it off.
   ================================================================ */
const PASTE = { walls: [], done: 0 };
window.__PASTE = PASTE;
(function wheatpaste() {
  if (!LOOK.on || /wheatpaste=0/.test(location.search)) return;
  const mk = (x, z, ry, w, h, seed) => { const cv = document.createElement('canvas'); cv.width = 2048; cv.height = Math.round(2048 * h / w); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, roughness: 0.62, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.position.set(x, ground(x, z) + 0.35 + h / 2, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); PASTE.walls.push({ cv, t, seed, done: false }); };
  try { const g = ground(17, 66); mk(22.22, 66, PI / 2, 11, 2.9, 7); } catch (e) { }
  try { if (window.__LAUND) mk(-88.52, -4, -PI / 2, 7.2, 2.7, 41); } catch (e) { }
})();
function pasteDraw(W) {
  const c = W.cv.getContext('2d'); if (!c || !c.drawImage || !c.beginPath || !c.clip) return true; const Wd = W.cv.width, Hd = W.cv.height; let s = W.seed * 9301 + 49297; const R = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pool = CARDS.filter(cd => cd.uv && cd.uv[5] > 0.55 && cd.uv[5] < 1.5); c.clearRect(0, 0, Wd, Hd);
  const sheet = (cx, cy, hh, rot, n, torn) => { const cc = cropCanvas('meme', n, 420); if (cc.width < 16) return false; const ww = hh * cc.width / cc.height;
    c.save(); c.translate(cx, cy); c.rotate(rot); c.beginPath(); const jag = (x0, y0, x1, y1, k) => { const steps = 14; for (let i = 0; i <= steps; i++) { const u = i / steps; c.lineTo(x0 + (x1 - x0) * u + (R() - 0.5) * k, y0 + (y1 - y0) * u + (R() - 0.5) * k); } };
    const hw = ww / 2 + 10, hh2 = hh / 2 + 10; c.moveTo(-hw, -hh2); jag(-hw, -hh2, hw, -hh2, 6); jag(hw, -hh2, hw, hh2 * (torn ? 0.2 : 1), 6); if (torn) jag(hw, hh2 * 0.2, -hw * 0.3, hh2, 40); else jag(hw, hh2, -hw, hh2, 6); jag(-hw * (torn ? 0.3 : 1), hh2, -hw, -hh2, 6); c.closePath(); c.clip();
    c.fillStyle = '#f2eee4'; c.fillRect(-hw, -hh2, hw * 2, hh2 * 2); c.drawImage(cc, -ww / 2, -hh / 2, ww, hh);
    // wrinkles and glue sheen
    for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(255,255,255,${0.05 + R() * 0.08})`; c.lineWidth = 2 + R() * 3; c.beginPath(); const y = -hh2 + R() * hh2 * 2; c.moveTo(-hw, y); c.bezierCurveTo(-hw / 3, y + (R() - 0.5) * 30, hw / 3, y + (R() - 0.5) * 30, hw, y + (R() - 0.5) * 20); c.stroke(); }
    const g = c.createLinearGradient(-hw, -hh2, hw, hh2); g.addColorStop(0, 'rgba(255,255,240,0.10)'); g.addColorStop(0.5, 'rgba(255,255,240,0)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = g; c.fillRect(-hw, -hh2, hw * 2, hh2 * 2);
    c.restore(); return true; };
  let ok = true; const rowH = Hd * 0.5, per = Math.ceil(Wd / (rowH * 0.62));
  for (let row = 0; row < 2; row++) for (let i = 0; i < per + 1; i++) { const n = pool[Math.floor(R() * pool.length)].n; const x = (i + (row ? 0.5 : 0)) * (Wd / per), y = rowH * (row + 0.5) + (R() - 0.5) * 20;
    ok = sheet(x, y, rowH * (0.86 + R() * 0.12), (R() - 0.5) * 0.07, n, R() < 0.18) && ok; }
  // a few ripped scraps of older paper on top
  for (let i = 0; i < 8; i++) { c.fillStyle = `rgba(236,230,214,${0.7 + R() * 0.3})`; c.beginPath(); const x = R() * Wd, y = R() * Hd; c.moveTo(x, y); for (let k = 0; k < 7; k++) c.lineTo(x + (R() - 0.3) * 90, y + (R() - 0.3) * 70); c.closePath(); c.fill(); }
  W.t.needsUpdate = true; return ok;
}
window.__FRAMES.push(dt => { try { if (!PASTE.walls.length) return; PASTE.t = (PASTE.t || 0) + dt; if (PASTE.t < 3 || PASTE.walls.every(w => w.done)) return; if ((PASTE.k = (PASTE.k || 0) + dt) < 1.5) return; PASTE.k = 0;
  PASTE.walls.forEach(w => { if (!w.done) { w.done = pasteDraw(w); if (w.done) PASTE.done++; } }); } catch (e) { if (!PASTE.err) { PASTE.err = e; console.warn('v250 wheatpaste', e); } } });
