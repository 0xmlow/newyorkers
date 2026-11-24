/* ================================================================
   v417 ILLUSION: THE STEPPING FEET (2026-11-24)
   A fifth sideshow board: black and bone stripes, and across them two bars, one cobalt and one bone, gliding side by
   side at exactly the same steady speed. Watch them and they walk: one steps forward while the other waits, then
   the other. Their contrast with the stripes under them keeps changing, and your eye reads contrast as speed
   (the footsteps illusion, Stuart Anstis, 2001). ?sideshow=0 off.
   ================================================================ */
(function steppingFeet() {
  if (!LOOK.on || /sideshow=0/.test(location.search) || typeof sideBooth !== 'function') return;
  const B = sideBooth(253, 'THE STEPPING FEET', 'BOTH BARS MOVE AT ONE STEADY SPEED. WATCH THEM WALK.');
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 64; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  if (c && c.fillRect) { for (let i = 0; i < 32; i++) { c.fillStyle = i % 2 ? '#0a0a0a' : '#f1ece1'; c.fillRect(i * 32, 0, 32, 64); } }
  const [x, z] = B.at(0, 0.06), bg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); bg.position.set(x, B.g + 1.75, z); bg.rotation.y = B.ry; scene.add(bg);
  const bars = [[0x2962ff, 0.35], [0xf1d36a, -0.35]].map(([col, dy]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); scene.add(m); return { m, dy }; });
  SIDE.feet = { B, bars, t: 0 }; if (SIDE.panels) SIDE.panels.push(bg.material); if (window.__MAP) MAP.places.push(['THE STEPPING FEET', B.x, B.z, ...B.at(0, 3)]);
})();
window.__FRAMES.push(dt => { try { const F = SIDE.feet; if (!F) return; F.t += dt; const u = ((F.t * 0.22) % 1.9) - 0.95, B = F.B;
  F.bars.forEach(b => { const [x, z] = B.at(u, 0.075); b.m.position.set(x, B.g + 1.75 + b.dy, z); b.m.rotation.y = B.ry; }); } catch (e) { } });
