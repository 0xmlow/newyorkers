/* ================================================================
   v195 THE LOOK: FLAGS AT THE BANK (2026-11-23)
   A bank on a New York street flies flags. Two twelve metre poles stand either side of the First National Bank
   of JPGs' steps, gilt balls on top: the Stars and Stripes, and the N3W flag, the Open Eye on Evil Eye Blue. Both
   ripple in the island's wind, harder when it blows. ?flags=0 off.
   ================================================================ */
const FLAGS = { u: { uFT: { value: 0 }, uFW: { value: 0.5 } } };
window.__FLAGS = FLAGS;
(function flags() {
  if (!LOOK.on || /flags=0/.test(location.search)) return; const g = ground(-66, 0) + 0.32;
  const us = document.createElement('canvas'); us.width = 760; us.height = 400; let c = us.getContext('2d');
  if (c && c.fillRect) { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f4f1ea' : '#b22234'; c.fillRect(0, i * 400 / 13, 760, 400 / 13 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, 304, 400 * 7 / 13);
    if (c.arc) { c.fillStyle = '#f4f1ea'; for (let r = 0; r < 9; r++) for (let k = 0; k < (r % 2 ? 5 : 6); k++) { c.beginPath(); c.arc(25 + k * 50 + (r % 2 ? 25 : 0), 18 + r * 23.5, 6, 0, PI * 2); c.fill(); } } }
  const nw = document.createElement('canvas'); nw.width = 760; nw.height = 400; c = nw.getContext('2d');
  const tUS = new THREE.CanvasTexture(us), tN = new THREE.CanvasTexture(nw); [tUS, tN].forEach(t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; });
  const drawN = img => { if (!c || !c.fillRect) return; c.fillStyle = '#2962FF'; c.fillRect(0, 0, 760, 400); if (img && c.drawImage) c.drawImage(img, 380 - 150, 200 - 150, 300, 300); else if (c.arc) { c.fillStyle = '#F0F4F8'; c.beginPath(); c.arc(380, 200, 120, 0, PI * 2); c.fill(); c.fillStyle = '#0D0D0D'; c.beginPath(); c.arc(380, 200, 50, 0, PI * 2); c.fill(); } tN.needsUpdate = true; };
  drawN(null); const im = new Image(); im.onload = () => drawN(im); im.src = 'assets/eye.png';
  const mk = tex => { const geo = new THREE.PlaneGeometry(2.6, 1.37, 26, 8); geo.translate(1.3, 0, 0); const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => { Object.assign(sh.uniforms, FLAGS.u); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFT, uFW;').replace('#include <begin_vertex>', `#include <begin_vertex>
      float fx = position.x / 2.6; transformed.z += fx * (0.16 + 0.22 * uFW) * sin(position.x * 2.4 - uFT * (3.0 + 2.0 * uFW) + position.y * 0.6); transformed.y -= fx * fx * 0.25 * (1.0 - uFW);`); };
    m.customProgramCacheKey = () => 'mi-flag-v195'; const f = new THREE.Mesh(geo, m); f.castShadow = true; return f; };
  [[tUS, -10.6], [tN, 10.6]].forEach(([t, z]) => { const x = -50.6; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 12, 10), FACM.steel || MAT.steel); pole.position.set(x, g + 6, z); pole.castShadow = true; scene.add(pole);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), MAT.gold || FACM.bronze); ball.position.set(x, g + 12.1, z); scene.add(ball);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.5, 14), FACM.lime || FACM.stone); base.position.set(x, g + 0.25, z); scene.add(base); if (typeof post === 'function') post(x, z, 0.36);
    const f = mk(t); f.position.set(x, g + 11.2, z); scene.add(f); (FLAGS.list = FLAGS.list || []).push(f); });
})();
window.__FRAMES.push(dt => { try { if (!FLAGS.list) return; FLAGS.u.uFT.value += dt; const w = 0.35 + 0.4 * Math.sin(LIFE.t * 0.05) + (WX.wet || 0) * 0.4; FLAGS.u.uFW.value += (Math.min(1, Math.max(0, w)) - FLAGS.u.uFW.value) * Math.min(1, dt);
  const a = Math.atan2(0.8, 0.45); FLAGS.list.forEach(f => f.rotation.y = -a + Math.sin(LIFE.t * 0.03) * 0.3); } catch (e) { } });
