/* ================================================================
   v42 THE DRONE SHOW (2026-11-22)
   Six hundred drones rise off the Colossus rock and fly through formations over the harbour, steady points of light
   that glide from one picture to the next: the evil eye, N3W YORKERS in the house type, a hand lettered gm, a slice
   of pizza with pepperoni, an Open Eye Flower, and back to the eye before they land. At the top of every hour after
   dark (New York time), and on DRONES.
   ================================================================ */
const DRONES = { N: 600, t: -1, forms: [], pts: null, d: [] };
window.__DRONES = DRONES;
function droneForm(draw, colorFn) {
  const W = 400, H = 220, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); if (!c || !c.getImageData || !c.beginPath) return null;
  c.clearRect(0, 0, W, H); draw(c, W, H); let d; try { d = c.getImageData(0, 0, W, H).data; } catch (e) { return null; }
  const all = []; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (d[i + 3] > 128) all.push([x / W - 0.5, 0.5 - y / H, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]); }
  if (!all.length) return null; const out = []; for (let k = 0; k < DRONES.N; k++) out.push(all[Math.floor((k + 0.5) / DRONES.N * all.length)]); return out;
}
function droneForms() {
  const F = [];
  F.push(droneForm((c, W, H) => { [[100, '#1E77E3'], [57, '#ffffff'], [40, '#08DEFF'], [26, '#111111']].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(W / 2, H / 2, r, 0, PI * 2); c.fill(); }); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(W / 2, H / 2, 18, 0, PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#9fb8ff'; c.beginPath(); c.arc(W / 2, H / 2, 6, 0, PI * 2); c.fill(); }));
  F.push(droneForm((c, W, H) => { n3wCap(c); let capH = 64, L = n3wLayout(c, 'N3W YORKERS', capH); if (L.width > W * 0.95) { capH *= W * 0.95 / L.width; L = n3wLayout(c, 'N3W YORKERS', capH); } n3wDraw(c, L, capH, W / 2, H / 2, '#ffffff'); }));
  F.push(droneForm((c, W, H) => { c.fillStyle = '#ff4fa0'; c.font = '400 150px "Permanent Marker",cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('gm', W / 2, H / 2); }));
  F.push(droneForm((c, W, H) => { c.fillStyle = '#f2b44e'; c.beginPath(); c.moveTo(W / 2, H - 10); c.lineTo(W / 2 - 80, 40); c.quadraticCurveTo(W / 2, 10, W / 2 + 80, 40); c.closePath(); c.fill(); c.fillStyle = '#c8501e'; c.fillRect(W / 2 - 84, 28, 168, 16);
    c.fillStyle = '#d8231a'; [[-30, 70], [25, 85], [-5, 120], [20, 150], [-20, 170]].forEach(([x, y]) => { c.beginPath(); c.arc(W / 2 + x, y, 12, 0, PI * 2); c.fill(); }); }));
  F.push(droneForm((c, W, H) => { c.fillStyle = '#efe8da'; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; c.save(); c.translate(W / 2 + Math.cos(a) * 52, H / 2 + Math.sin(a) * 52); c.rotate(a + PI / 2); c.beginPath(); c.ellipse(0, 0, 30, 48, 0, 0, PI * 2); c.fill(); c.restore(); }
    [[36, '#1E3a8a'], [26, '#2f6fe0'], [11, '#050505']].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(W / 2, H / 2, r, 0, PI * 2); c.fill(); }); }));
  return F.filter(Boolean);
}
(function build() {
  const N = DRONES.N, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-999), col = new Float32Array(N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.3, map: LIFE.soft, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  pts.frustumCulled = false; pts.visible = false; scene.add(pts); DRONES.pts = pts;
  for (let i = 0; i < N; i++) DRONES.d.push({ x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, ph: Math.random() * 9 });
})();
const droneSecret = secret('drones', () => { });
function droneGo(why) {
  if (DRONES.t >= 0) return; if (!DRONES.forms.length) DRONES.forms = droneForms(); if (DRONES.forms.length < 2) return; droneSecret(); DRONES.t = 0; DRONES.pts.visible = true;
  DRONES.home = new THREE.Vector3(58, 22, 262); DRONES.d.forEach((d, i) => { const a = (i / DRONES.N) * PI * 2 * 7; d.x = DRONES.home.x + Math.cos(a) * 6; d.y = DRONES.home.y + (i % 12) * 0.2; d.z = DRONES.home.z + Math.sin(a) * 6; d.r = d.g = d.b = 0.8; });
  toast(why || 'THE DRONES ARE UP OVER THE HARBOUR. LOOK SOUTH.', 'blue');
}
secret('droneshow', () => droneGo('A DRONE SHOW, JUST FOR YOU. LOOK SOUTH OVER THE HARBOUR.'), ['drones', 'droneshow', 'lightshow']);
function droneFrame(dt) {
  const t = SKY.t; if (t && t.m === 0 && (L.lamps || 0) > 0.6 && DRONES.hour !== t.h) { DRONES.hour = t.h; droneGo('THE TOP OF THE HOUR: THE DRONES ARE UP OVER THE HARBOUR.'); }
  if (DRONES.t < 0) return; DRONES.t += dt; const F = DRONES.forms, SEG = 9, HOLD = 5.5, total = 4 + F.length * SEG + SEG + 6;
  const C = new THREE.Vector3(10, 82, 236), Wd = 150, Hd = 82; const pos = DRONES.pts.geometry.attributes.position.array, col = DRONES.pts.geometry.attributes.color.array;
  let target = null, prev = null, k = 1; const tt = DRONES.t - 4;
  if (tt >= 0) { const idx = Math.floor(tt / SEG), local = tt - idx * SEG; const seq = F.concat([F[0]]); if (idx < seq.length) { target = seq[idx]; prev = idx > 0 ? seq[idx - 1] : null; k = Math.min(1, local / (SEG - HOLD)); } }
  const landing = tt >= F.length * SEG + SEG;
  DRONES.d.forEach((d, i) => { let tx, ty, tz, r = 0.9, g = 0.9, b = 1;
    if (landing || !target) { const a = (i / DRONES.N) * PI * 2 * 7; tx = DRONES.home.x + Math.cos(a) * 6; ty = DRONES.home.y + 2 + (i % 12) * 0.3 + (landing ? 0 : Math.min(1, DRONES.t / 4) * 30); tz = DRONES.home.z + Math.sin(a) * 6; }
    else { const p = target[i], q = prev ? prev[i] : null; const e = k * k * (3 - 2 * k);
      const ax = q ? C.x - q[0] * Wd : d.x, ay = q ? C.y + q[1] * Hd : d.y; tx = q ? ax + (C.x - p[0] * Wd - ax) * e : C.x - p[0] * Wd; ty = q ? ay + (C.y + p[1] * Hd - ay) * e + Math.sin(e * PI) * 6 : C.y + p[1] * Hd; tz = C.z + Math.sin(e * PI) * (i % 7 - 3);
      r = p[2]; g = p[3]; b = p[4]; if (r + g + b < 0.3) { r = 0.25; g = 0.3; b = 0.5; } }
    const sp = Math.min(1, dt * 2.2); d.x += (tx - d.x) * sp; d.y += (ty - d.y) * sp; d.z += (tz - d.z) * sp; d.r += (r - d.r) * sp; d.g += (g - d.g) * sp; d.b += (b - d.b) * sp;
    pos[i * 3] = d.x; pos[i * 3 + 1] = d.y + Math.sin(LIFE.t * 1.3 + d.ph) * 0.08; pos[i * 3 + 2] = d.z; const tw = window.__CALM ? 1.4 : 1.4 + 0.2 * Math.sin(LIFE.t * 3 + d.ph); col[i * 3] = d.r * tw; col[i * 3 + 1] = d.g * tw; col[i * 3 + 2] = d.b * tw; });
  DRONES.pts.geometry.attributes.position.needsUpdate = DRONES.pts.geometry.attributes.color.needsUpdate = true;
  if (DRONES.t > total) { DRONES.t = -1; DRONES.pts.visible = false; }
}
window.__FRAMES.push(dt => { try { droneFrame(dt); } catch (e) { if (!DRONES.err) { DRONES.err = e; console.warn('v42 drones', e); } } });
