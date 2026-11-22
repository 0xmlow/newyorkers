/* ================================================================
   v20 THE FINALE (2026-11-21)
   A firework show that writes N3W YORKERS in the sky over the Colossus, in the house type, struck and slit, with
   the evil eye as the O: four rockets go up, burst, and every spark flies to its place in the letters, holds,
   shimmers and falls. It plays at midnight New York time, when the ninth golden slice is found, and when anyone
   types FINALE (or SHOW). Then a toast that counts how many secrets you have found.
   ================================================================ */
const FIN = { t: -1, pts: null, targets: [], N: 0 };
window.__FIN = FIN;
function finTargets() {
  const W = 640, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); if (!c || !c.getImageData) return [];
  c.clearRect(0, 0, W, H); n3wCap(c); let capH = 70, L = n3wLayout(c, 'N3W YORKERS', capH); if (L.width > W * 0.94) { capH *= W * 0.94 / L.width; L = n3wLayout(c, 'N3W YORKERS', capH); }
  n3wDraw(c, L, capH, W / 2, H / 2, '#ffffff');
  let d; try { d = c.getImageData(0, 0, W, H).data; } catch (e) { return []; }
  const out = []; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (d[i + 3] > 140) out.push([x / W - 0.5, 0.5 - y / H, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]); }
  return out;
}
(function build() {
  const N = 5200, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-999), col = new Float32Array(N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.1, map: LIFE.soft, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  pts.frustumCulled = false; pts.visible = false; scene.add(pts); FIN.pts = pts; FIN.N = N; FIN.sp = Array.from({ length: N }, () => ({ x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, r: 1, g: 1, b: 1, d: 0 }));
})();
const finaleSecret = secret('finale', () => { });
function finaleGo(why) {
  if (FIN.t >= 0) return; if (!FIN.targets.length) FIN.targets = finTargets(); const T = FIN.targets; if (!T.length) return;
  finaleSecret(); FIN.t = 0; FIN.pts.visible = true; const C = new THREE.Vector3(0, 128, 300), Wd = 210, Hd = 42;
  const rockets = [[-50, 0], [-17, 0], [17, 0], [50, 0]];
  FIN.sp.forEach((s, i) => { const t = T[Math.floor(i / FIN.N * T.length)], k = (i / FIN.N * 4) | 0, rk = rockets[k];
    s.x = C.x + rk[0] * 0.5; s.y = 2; s.z = C.z; s.bx = C.x + rk[0]; s.by = C.y - 10 + Math.random() * 4; s.bz = C.z + (Math.random() - 0.5) * 6;
    s.tx = C.x - t[0] * Wd + (Math.random() - 0.5) * 0.4; s.ty = C.y + t[1] * Hd * 2 + (Math.random() - 0.5) * 0.4; s.tz = C.z + (Math.random() - 0.5) * 1.5;
    const blue = t[2] < 0.5 && t[3] > 0.3; s.r = blue ? t[2] : 1; s.g = blue ? t[3] : 0.96; s.b = blue ? t[4] : 0.9; s.d = k * 0.35 + Math.random() * 0.15; s.ph = Math.random() * 9; s.vy = 0; });
  [0, 0.35, 0.7, 1.05].forEach(o => setTimeout(() => beep(180, 0.5, 'sawtooth', 0.03), o * 1000));
  setTimeout(() => { [130, 160, 190, 150].forEach((f, i) => beep(f, 0.8, 'sawtooth', 0.06, i * 0.35)); }, 1400);
  setTimeout(() => toast('N3W YORKERS. ' + (why || 'THE CITY IS THE ART.'), 'blue'), 3500);
  setTimeout(() => toast(`SECRETS FOUND: ${PLAY.found.size} OF ${PLAY.total}. GOLDEN SLICES: ${HUNT.got.size} OF 9.`), 7200);
}
secret('show', () => finaleGo('A SHOW FOR YOU.'), ['finale', 'show', 'n3wshow']);
function finaleFrame(dt) {
  try {
    const t = SKY.t; if (t && t.h === 0 && t.m === 0 && FIN.midnight !== t.d) { FIN.midnight = t.d; finaleGo('MIDNIGHT IN NEW YORK.'); }
    if (HUNT.done && !FIN.hunt) { FIN.hunt = true; setTimeout(() => finaleGo('SLICE KING OF MEME ISLAND.'), 4000); }
    if (FIN.t < 0) return; FIN.t += dt; const pos = FIN.pts.geometry.attributes.position.array, col = FIN.pts.geometry.attributes.color.array;
    const RISE = 1.3, FORM = 1.6, HOLD = 4.0, FALL = 3.0, END = 1.6 + RISE + FORM + HOLD + FALL;
    FIN.sp.forEach((s, i) => { const lt = FIN.t - s.d; let x, y, z, a;
      if (lt < 0) { pos[i * 3 + 1] = -999; return; }
      if (lt < RISE) { const k = lt / RISE; x = s.x + (s.bx - s.x) * k; y = s.y + (s.by - s.y) * (1 - (1 - k) * (1 - k)); z = s.z + (s.bz - s.z) * k; a = i % 14 === 0 ? 1 : 0; }
      else if (lt < RISE + FORM) { const k = (lt - RISE) / FORM, e = 1 - Math.pow(1 - k, 3), j = Math.sin(k * PI) * 9; x = s.bx + (s.tx - s.bx) * e + Math.sin(s.ph) * j; y = s.by + (s.ty - s.by) * e + Math.cos(s.ph) * j; z = s.bz + (s.tz - s.bz) * e; a = 1; }
      else if (lt < RISE + FORM + HOLD) { x = s.tx; y = s.ty + Math.sin(FIN.t * 3 + s.ph) * 0.05; z = s.tz; a = 0.75 + 0.25 * Math.sin(FIN.t * 9 + s.ph * 3); }
      else { const k = (lt - RISE - FORM - HOLD) / FALL; s.vy += dt * 6; x = s.tx + Math.sin(s.ph) * k * 2; y = s.ty - k * k * 22 - Math.sin(s.ph * 2) * k; z = s.tz; a = Math.max(0, 1 - k); }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; col[i * 3] = s.r * a * 1.8; col[i * 3 + 1] = s.g * a * 1.8; col[i * 3 + 2] = s.b * a * 1.8; });
    FIN.pts.geometry.attributes.position.needsUpdate = FIN.pts.geometry.attributes.color.needsUpdate = true;
    if (FIN.t > END + 0.4) { FIN.t = -1; FIN.pts.visible = false; }
  } catch (e) { if (!FIN.err) { FIN.err = e; console.warn('v20 finale', e); } }
}
