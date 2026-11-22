/* ================================================================
   v17 NEON NIGHT (2026-11-21)
   Neon tubes that light with the island's lamps and bloom after dark: N3W YORKERS in the house type over the
   toll, a big hand lettered gm on GM Beach, OPEN and COLD JPGs in the bodega windows (OPEN flickers), MEME ISLAND
   at the end of the pier. Festoon lights strung across GM Beach, and two premiere searchlights from the Floor.
   No new lights: every glow is an additive, untonemapped material, so the bloom pass does the work.
   ================================================================ */
const NEON = { signs: [], bulbs: null, beams: [] };
window.__NEON = NEON;
/* draw a neon panel: text (or N3W type) with a soft tube glow on a transparent ground */
function neonCanvas(text, w, h, color, style) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); if (!c || !c.fillText || !c.save) return cv;
  c.clearRect(0, 0, w, h);
  const draw = (blur, col, alpha) => { c.save(); c.globalAlpha = alpha; c.shadowColor = color; c.shadowBlur = blur;
    if (style === 'n3w') { n3wCap(c); let capH = h * 0.5, L = n3wLayout(c, text, capH); if (L.width > w * 0.86) { capH *= w * 0.86 / L.width; L = n3wLayout(c, text, capH); } n3wDraw(c, L, capH, w / 2, h / 2, col); }
    else { const fam = style === 'hand' ? TYPE.hand : TYPE.n3w; let sz = h * (style === 'hand' ? 0.62 : 0.52); c.font = `400 ${sz}px ${fam}`; while (c.measureText(text).width > w * 0.86 && sz > 8) { sz *= 0.94; c.font = `400 ${sz}px ${fam}`; }
      c.textAlign = 'center'; c.textBaseline = 'middle'; if (style === 'hand') { c.lineWidth = sz * 0.07; c.strokeStyle = col; c.lineJoin = 'round'; c.strokeText(text, w / 2, h / 2); } else { c.fillStyle = col; c.fillText(text, w / 2, h / 2); } }
    c.restore(); };
  draw(h * 0.12, color, 0.9); draw(h * 0.04, color, 1); draw(0, '#ffffff', 0.55);
  return cv;
}
function neonSign(text, x, y, z, ry, W, H, color, style, opts) {
  opts = opts || {}; const cv = neonCanvas(text, 1024, Math.round(1024 * H / W), color, style), t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 3; scene.add(m);
  if (opts.back) { const b = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.04, H * 1.1), new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.6, metalness: 0.3 })); b.position.set(x - Math.sin(ry) * 0.04, y, z - Math.cos(ry) * 0.04); b.rotation.y = ry; scene.add(b); }
  const s = { m, cv, t, text, color, style, flick: !!opts.flicker, base: opts.base || 1 }; NEON.signs.push(s); return s;
}
(function signs() {
  const tg = ground(0, 100);
  neonSign('N3W YORKERS', 0, tg + 7.75, 94.7, PI, 8, 1.6, '#3b7bff', 'n3w', { back: true });
  // gm on GM Beach, on a black steel frame
  const gx = 15, gz = 121, gg = ground(gx, gz), steel = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5, metalness: 0.6 });
  [-2.1, 2.1].forEach(dx => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.2, 8), steel); p.position.set(gx + dx * Math.cos(-0.44), gg + 2.6, gz - dx * Math.sin(-0.44)); scene.add(p); });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.08), steel); bar.position.set(gx, gg + 3.4, gz); bar.rotation.y = -0.44; scene.add(bar);
  neonSign('gm', gx, gg + 4.3, gz, -0.44, 4, 2, '#ff4fa0', 'hand');
  if (typeof CIRCS !== 'undefined') [-2.1, 2.1].forEach(dx => CIRCS.push({ x: gx + dx * Math.cos(-0.44), z: gz - dx * Math.sin(-0.44), r: 0.15, y0: -5, y1: 8, on: true }));
  // the bodega windows (the door is the west wall at x = 12)
  const bg = ground(17, 66);
  neonSign('OPEN', 11.72, bg + 2.0, 69.6, -PI / 2, 1.8, 0.7, '#ff3a2a', 'hand', { flicker: true, back: true });
  neonSign('COLD JPGs', 11.72, bg + 2.0, 62.4, -PI / 2, 2.2, 0.62, '#2f8bff', 'n3w', { back: true });
  // the end of the pier
  neonSign('MEME ISLAND', 0, 5.6, 179.5, PI, 6, 1.2, '#ff8a1a', 'n3w');
})();

/* festoon lights across GM Beach */
(function festoon() {
  const strands = [[-24, 113, 24, 113], [-24, 121, 24, 121], [-24, 129, 24, 129], [-24, 113, -24, 129], [24, 113, 24, 129]];
  const wood = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.9 }), pts = [], poles = new Set();
  const per = 28, top = 4.4, sag = 0.7;
  strands.forEach(([x0, z0, x1, z1]) => {
    [[x0, z0], [x1, z1]].forEach(([x, z]) => { const k = x + ',' + z; if (poles.has(k)) return; poles.add(k); const g = ground(x, z); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, top + 0.3, 8), wood); p.position.set(x, g + (top + 0.3) / 2, z); scene.add(p); if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.18, y0: -5, y1: 8, on: true }); });
    const wire = []; for (let i = 0; i <= per; i++) { const t = i / per, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = ground(x, z) + top - sag * (1 - (2 * t - 1) ** 2); wire.push(new THREE.Vector3(x, y, z)); if (i % 2 === 0 && i > 0 && i < per) pts.push([x, y - 0.12, z]); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire), new THREE.LineBasicMaterial({ color: 0x222222 })); scene.add(line);
  });
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), bulbM, pts.length); const m = new THREE.Matrix4();
  pts.forEach((p, i) => { m.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m); }); im.frustumCulled = false; scene.add(im); NEON.bulbs = im;
  // a soft halo sprite cloud so the bulbs glow at a distance
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  const halo = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: LIFE.soft, color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.frustumCulled = false; scene.add(halo); NEON.halo = halo;
})();

/* two premiere searchlights from behind the Floor */
(function searchlights() {
  [[-14, -20], [14, -20]].forEach(([x, z], i) => {
    const g = ground(x, z), base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.7, roughness: 0.4 })); base.position.set(x, g + 0.45, z); scene.add(base);
    const geo = new THREE.CylinderGeometry(3.2, 0.5, 160, 20, 1, true); geo.translate(0, 80, 0);
    const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    beam.position.set(x, g + 0.9, z); scene.add(beam); NEON.beams.push({ beam, ph: i * 2.1 });
  });
})();

function neonFrame(dt) {
  try {
    const n = Math.max(0, Math.min(1, (L.lamps || 0) * 1.3)), t = LIFE.t;
    NEON.signs.forEach(s => { let k = 0.18 + 1.5 * n; if (s.flick && n > 0.2) { const f = Math.sin(t * 13.1) + Math.sin(t * 7.7 + 1) + Math.sin(t * 2.3); if (f > 2.35) k *= 0.15; } s.m.material.color.setScalar(k * s.base); s.m.material.opacity = 0.35 + 0.65 * n; });
    if (NEON.bulbs) { NEON.bulbs.material.color.setRGB(0.35 + 2.2 * n, 0.25 + 1.5 * n, 0.12 + 0.7 * n); NEON.halo.visible = n > 0.15; NEON.halo.material.opacity = n * 0.8; }
    NEON.beams.forEach(b => { b.beam.visible = n > 0.3; b.beam.material.opacity = 0.05 * n; b.beam.rotation.set(0.35 * Math.sin(t * 0.21 + b.ph), 0, 0.35 * Math.cos(t * 0.17 + b.ph)); });
  } catch (e) { if (!NEON.err) { NEON.err = e; console.warn('v17 neon', e); } }
}
/* the neon was drawn before the web fonts arrived: redraw it once they are in */
addEventListener('n3wfonts', () => NEON.signs.forEach(s => { const cv = neonCanvas(s.text, s.cv.width, s.cv.height, s.color, s.style); s.cv.getContext('2d').clearRect(0, 0, s.cv.width, s.cv.height); s.cv.getContext('2d').drawImage(cv, 0, 0); s.t.needsUpdate = true; }));
