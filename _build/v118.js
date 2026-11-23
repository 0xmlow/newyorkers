/* ================================================================
   v118 THE HOLIDAY WINDOWS (2026-11-23)
   The walk up's two ground floor windows become holiday displays, the kind people queue on Fifth Avenue to see: deep
   glass vitrines lit warm from inside, a snowfield floor, a navy backdrop of contour lines with an Open Eye Flower
   moon, and in each one a little troupe of real rigged pigeons in red party hats doing a dance on a loop while
   flakes drift down. Stand and watch a whole dance and it counts.
   ================================================================ */
const HWIN = { p: [], flakes: null, k: 0 };
window.__HWIN = HWIN;
(function holidayWindows() {
  const fx = BROWN.fx, g0 = BROWN.g0, z0 = BROWN_AT.z;
  const back = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 384; const c = cv.getContext('2d'); if (c && c.createLinearGradient && c.beginPath) { const g = c.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#0b1430'); g.addColorStop(1, '#1d2f66'); c.fillStyle = g; c.fillRect(0, 0, 256, 384);
    for (let i = 0; i < 14; i++) { c.beginPath(); for (let x = 0; x <= 256; x += 8) { const y = 120 + i * 18 + Math.sin(x * 0.03 + i) * 8; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = i % 5 === 4 ? 2.4 : 1.2; c.strokeStyle = i % 5 === 4 ? 'rgba(255,63,164,.8)' : 'rgba(8,222,255,.7)'; c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * 256, Math.random() * 384, 2, 2); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })();
  const ft = tex('assets/iv_flower.webp'), frame = new THREE.MeshStandardMaterial({ color: 0x1f3326, roughness: 0.4, metalness: 0.4 });
  [z0, z0 + 2.4].forEach((z, i) => { const g = new THREE.Group(); g.position.set(fx - 0.45, g0, z); scene.add(g);
    const W = 1.5, H = 2.1, D = 0.85; const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: 0xcfe0ea, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.1, depthWrite: false })); glass.position.set(-D / 2, 0.55 + H / 2, 0); glass.rotation.y = -PI / 2; g.add(glass);
    [[0, 0.5, 0, D + 0.1, 0.1, W + 0.1], [0, 0.6 + H, 0, D + 0.1, 0.12, W + 0.1], [0, 0.55 + H / 2, -W / 2, D + 0.1, H, 0.06], [0, 0.55 + H / 2, W / 2, D + 0.1, H, 0.06]].forEach(([x, y, zz, w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frame); m.position.set(x, y, zz); g.add(m); });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: back })); bg.position.set(D / 2 - 0.02, 0.55 + H / 2, 0); bg.rotation.y = -PI / 2; g.add(bg);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: ft, transparent: true, alphaTest: 0.4 })); moon.position.set(D / 2 - 0.04, 0.55 + H - 0.4, 0.3 * (i ? -1 : 1)); moon.rotation.y = -PI / 2; g.add(moon);
    const snow = new THREE.Mesh(new THREE.BoxGeometry(D, 0.12, W), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.9 })); snow.position.set(0, 0.62, 0); g.add(snow);
    const light = new THREE.Mesh(new THREE.BoxGeometry(D - 0.05, 0.02, W - 0.1), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false })); light.position.set(0, 0.55 + H - 0.02, 0); g.add(light);
    for (let k = 0; k < 3; k++) { const h = CC0.make('pigeon', { h: 0.36, parent: g, far: 40, tint: [0xffffff, 0xd8d8e0, 0xe8e0d0][k] }); h.root.position.set(0.05, 0.68, -0.45 + k * 0.45); h.root.rotation.y = -PI / 2; h.force = 'dance';
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 10), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.7 })); hat.position.set(0, 0.36, 0); h.root.add(hat); HWIN.p.push(h); }
    boxWalls(fx - 0.45, z, D + 0.1, W + 0.1, 0, -5, g0 + 2.8); });
  const fg = new THREE.BufferGeometry(), fp = new Float32Array(160 * 3); for (let i = 0; i < 160; i++) { const w = i % 2; fp[i * 3] = fx - 0.45 + (Math.random() - 0.5) * 0.75; fp[i * 3 + 1] = g0 + 0.7 + Math.random() * 1.9; fp[i * 3 + 2] = z0 + w * 2.4 + (Math.random() - 0.5) * 1.4; }
  fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); HWIN.flakes = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.9 })); scene.add(HWIN.flakes); HWIN.g0 = g0;
})();
const hwinSecret = secret('windows', () => { toast('YOU WATCHED THE WHOLE DANCE. THE PIGEONS IN THE WINDOW BOW. NOBODY ELSE ON THE SIDEWALK NOTICES. THEIR LOSS.', 'blue'); });
function hwinFrame(dt) {
  const d = Math.hypot(P.x - (BROWN.fx - 2), P.z - (BROWN_AT.z + 1.2)); if (d > 60) return; const a = HWIN.flakes.geometry.attributes.position.array;
  for (let i = 0; i < a.length; i += 3) { a[i + 1] -= dt * 0.25; if (a[i + 1] < HWIN.g0 + 0.68) a[i + 1] = HWIN.g0 + 2.6; } HWIN.flakes.geometry.attributes.position.needsUpdate = true;
  if (d < 4.5) { HWIN.k += dt; if (HWIN.k > 8) hwinSecret(); } else HWIN.k = 0;
}
window.__FRAMES.push(dt => { try { hwinFrame(dt); } catch (e) { if (!HWIN.err) { HWIN.err = e; console.warn('v118 windows', e); } } });
