/* ================================================================
   v77 THE IMPERMANENT WALL (2026-11-22), apply-mlow-impermanent-vision, Melt
   A ten metre mural wall at (58, -80) that paints itself over the day, in New York time, and is whitewashed at six
   every morning. At dawn it is primer. Through the morning a navy ground spreads and the first contour lines
   arrive; by noon an Open Eye Flower has opened in the middle and the lines crowd toward it; through the
   afternoon cyan and hot pink build and drips start to run; by night it is finished and the lines glow. The
   strokes come from the date, so everyone on the island sees the same painting on the same day, and tomorrow's
   is different. Stand in front of it finished, after dark, and the island counts it.
   ================================================================ */
const IWALL = { n: 0, key: '', k: 0 };
window.__IWALL = IWALL;
const IWALL_AT = { x: 58, z: -80 };
(function impermanentWall() {
  const x0 = IWALL_AT.x, z0 = IWALL_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); IWALL.ry = ry;
  const W = 10, H = 4;
  const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 614; IWALL.cv = cv; IWALL.c = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; IWALL.tex = t;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0 }); IWALL.m = m;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, H + 0.4, 0.4), new THREE.MeshStandardMaterial({ map: tex('assets/conc_c.webp', [3, 1.2]), roughness: 0.9 })); wall.position.set(0, (H + 0.4) / 2, -0.21); wall.castShadow = true; g.add(wall);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m); face.position.set(0, H / 2 + 0.2, 0.001); g.add(face);
  const lab = signTex([{ t: 'THE IMPERMANENT WALL', s: 0.3 }, { t: 'PAINTS ITSELF EVERY DAY · WHITEWASHED AT SIX', s: 0.12 }], 1024, 200, '#efe8da', '#0D0D0D');
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.31), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); pl.position.set(W / 2 - 0.9, 0.45, 0.01); g.add(pl);
  boxWalls(x0 - Math.sin(ry) * 0.21, z0 - Math.cos(ry) * 0.21, W + 0.4, 0.4, ry, -5, g0 + H + 0.4);
  IWALL.flower = new Image(); IWALL.flower.src = 'assets/iv_flower.webp';
  if (window.__MAP) MAP.places.push(['THE IMPERMANENT WALL', x0, z0, x0 + Math.sin(ry) * 6, z0 + Math.cos(ry) * 6]);
})();
const iwSecret = secret('impermanentwall', () => { toast('FINISHED, FOR TONIGHT. AT SIX IT GOES WHITE AND STARTS AGAIN. THAT IS THE WHOLE IDEA.', 'blue'); });
// a seeded stroke list for the day, drawn in order; how many are drawn depends on the time since six
function iwRand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function iwStrokes(day) {
  const r = iwRand(day * 7919 + 13), S = [], cx = 768 + (r() - 0.5) * 500, cy = 300 + (r() - 0.5) * 120;
  S.push({ k: 'ground' });
  for (let i = 0; i < 40; i++) S.push({ k: 'line', i, cx, cy, ph: r() * 6, pink: i % 5 === 4, w: 2 + r() * 2.2 });
  S.push({ k: 'flower', cx, cy, s: 230 + r() * 80 });
  for (let i = 0; i < 26; i++) S.push({ k: 'drip', x: r() * 1536, y: 40 + r() * 300, L: 60 + r() * 260, w: 5 + r() * 9, col: r() < 0.25 ? '#ff3fa4' : (r() < 0.5 ? '#08deff' : '#efe8da') });
  for (let i = 0; i < 18; i++) S.push({ k: 'pour', x: r() * 1536, y: r() * 614, rr: 40 + r() * 130, col: ['#2962FF', '#6a4cff', '#08deff', '#ff3fa4'][Math.floor(r() * 4)] });
  return S;
}
function iwDraw(s) { const c = IWALL.c; if (!c || !c.fillRect || !c.beginPath) return;
  if (s.k === 'ground') { const g = c.createRadialGradient ? c.createRadialGradient(768, 307, 40, 768, 307, 900) : null; if (g) { g.addColorStop(0, '#1d2f66'); g.addColorStop(1, '#060a1c'); c.fillStyle = g; } else c.fillStyle = '#0b1430'; c.fillRect(0, 0, 1536, 614); }
  else if (s.k === 'line') { const R = 40 + s.i * 26; c.beginPath(); for (let a = 0; a <= 1.001; a += 1 / 160) { const t = a * PI * 2, w = Math.sin(t * 3 + s.ph) * (8 + s.i * 0.8) + Math.sin(t * 7 - s.i * 0.3) * 5, px = s.cx + Math.cos(t) * (R + w) * 1.35, py = s.cy + Math.sin(t) * (R + w) * 0.8; a ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.lineWidth = s.pink ? s.w + 1.5 : s.w; c.strokeStyle = s.pink ? 'rgba(255,63,164,.9)' : 'rgba(8,222,255,.8)'; c.stroke(); }
  else if (s.k === 'flower') { if (IWALL.flower.complete && IWALL.flower.naturalWidth) c.drawImage(IWALL.flower, s.cx - s.s / 2, s.cy - s.s / 2, s.s, s.s); else IWALL.redo = true; }
  else if (s.k === 'drip') { c.fillStyle = s.col; c.globalAlpha = 0.85; c.fillRect(s.x - s.w / 2, s.y, s.w, s.L); c.beginPath(); c.arc(s.x, s.y + s.L, s.w * 0.85, 0, PI * 2); c.fill(); c.globalAlpha = 1; }
  else if (s.k === 'pour') { c.globalAlpha = 0.28; c.fillStyle = s.col; c.beginPath(); c.ellipse ? c.ellipse(s.x, s.y, s.rr, s.rr * 0.55, 0, 0, PI * 2) : c.arc(s.x, s.y, s.rr, 0, PI * 2); c.fill(); c.globalAlpha = 1; } }
function iwFrame(dt) {
  const d = Math.hypot(P.x - IWALL_AT.x, P.z - IWALL_AT.z); if (d > 130 || !SKY.t) return;
  const T = SKY.t, hrs = T.hours, day = T.days - (hrs < 6 ? 1 : 0), since = (hrs - 6 + 24) % 24, frac = Math.min(1, since / 15);   // six in the morning to nine at night
  const key = String(day); if (key !== IWALL.key) { IWALL.key = key; IWALL.S = iwStrokes(day); IWALL.n = 0; const c = IWALL.c; if (c && c.fillRect) { c.fillStyle = '#ece8df'; c.fillRect(0, 0, 1536, 614); } IWALL.tex.needsUpdate = true; }
  const want = Math.floor(frac * IWALL.S.length); if (want < IWALL.n || IWALL.redo && IWALL.flower.complete) { IWALL.redo = false; IWALL.n = 0; const c = IWALL.c; if (c && c.fillRect) { c.fillStyle = '#ece8df'; c.fillRect(0, 0, 1536, 614); } }
  let k = 0; while (IWALL.n < want && k < 6) { iwDraw(IWALL.S[IWALL.n++]); k++; } if (k) IWALL.tex.needsUpdate = true;
  const night = Math.min(1, (L.lamps || 0) * 1.4); IWALL.m.emissiveIntensity = night * 0.45 * frac;
  if (frac >= 1 && night > 0.5 && d < 14) { IWALL.k += dt; if (IWALL.k > 2) iwSecret(); }
}
window.__FRAMES.push(dt => { try { iwFrame(dt); } catch (e) { if (!IWALL.err) { IWALL.err = e; console.warn('v77 wall', e); } } });
