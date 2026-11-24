/* ================================================================
   v308 ILLUSION: THE AMES WINDOW (2026-11-24)
   On a navy pole on the west lawn turns a window that is not a rectangle: a trapezoid, painted with shading and
   perspective so it looks like an ordinary window seen at an angle. It turns steadily all the way round, and your eye
   will not believe it: it seems to swing back and forth instead, and a bar pushed through it seems to pass through
   the frame. Adelbert Ames worked this out in 1947; this one is in MLow's colours. ?ames=0 off.
   ================================================================ */
const AMES = {};
window.__AMES = AMES;
(function amesWindow() {
  if (!LOOK.on || /ames=0/.test(location.search)) return;
  const X = -63, Z = 31, g = ground(X, Z);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); if (!c || !c.beginPath || !c.fill) return;
  c.clearRect(0, 0, 1024, 512);
  // the trapezoid: tall side on the left, short on the right, with mullions converging as if in perspective
  const L = 0, R = 1024, tl = 20, bl = 492, tr = 140, br = 372; const lerp = (a, b, t) => a + (b - a) * t;
  const P = (u, v) => [lerp(L, R, u), lerp(lerp(tl, tr, u), lerp(bl, br, u), v)];
  const quad = (u0, v0, u1, v1, col) => { c.fillStyle = col; c.beginPath(); const a = P(u0, v0), b = P(u1, v0), d = P(u1, v1), e = P(u0, v1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fill(); };
  quad(0, 0, 1, 1, '#16233f'); const us = [0, 0.3, 0.52, 0.69, 0.82, 1]; // panes narrowing toward the short side
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const u0 = us[i] + 0.025, u1 = us[i + 1] - 0.025, v0 = j / 3 + 0.05, v1 = (j + 1) / 3 - 0.05; quad(u0, v0, u1, v1, j === 1 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)'); c.save(); c.globalCompositeOperation = 'destination-out'; quad(u0, v0, u1, v1, '#000'); c.restore(); quad(u0, v0, u0 + (u1 - u0) * 0.12, v1, '#2962FF'); quad(u0, v1 - 0.03, u1, v1, '#08DEFF'); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const geo = new THREE.PlaneGeometry(2.6, 1.3); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5 }));
  const piv = new THREE.Group(); piv.position.set(X, g + 2.6, Z); piv.add(m); scene.add(piv); AMES.piv = piv;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.4 })); bar.rotation.x = PI / 2; bar.position.set(0.55, 0.08, 0); piv.add(bar);
  facPut('iron', X, g + 1.15, Z, 0.08, 2.3, 0.08, 0); facPut('iron', X, g + 0.05, Z, 0.6, 0.1, 0.6, 0); facFlush(); post(X, Z, 0.3, -5, 2.5);
  AMES.ok = true; AMES.P = [X, g, Z];
})();
window.__FRAMES.push(dt => { try { if (AMES.piv && Math.hypot(camera.position.x - AMES.P[0], camera.position.z - AMES.P[2]) < 90) AMES.piv.rotation.y += dt * 0.45; } catch (e) { } });
