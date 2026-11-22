/* ================================================================
   v58 THE SKATE SPOT (2026-11-22)
   A concrete pad at (-74, 86) with a granite ledge, a kicker and a flat rail, and three skaters who never go home.
   Each one pushes off, rolls the line and throws a trick at the kicker: ollie, kickflip, heelflip, shove it, tre flip,
   a boardslide down the ledge, and now and then a bail where the board shoots off on its own. Pop and land clack
   when you are close. KICKFLIP (or E at the pad) calls a tre flip from the nearest one.
   ================================================================ */
const SK = { s: [], call: 0 };
window.__SK = SK;
const SK_AT = { x: -74, z: 86 };
(function skateSpot() {
  const x0 = SK_AT.x, z0 = SK_AT.z, g0 = ground(x0, z0), ry = 0.35; SK.g0 = g0; SK.ry = ry;
  const ax = Math.cos(ry), az = -Math.sin(ry), bx = Math.sin(ry), bz = Math.cos(ry); SK.ax = ax; SK.az = az; SK.bx = bx; SK.bz = bz;
  const L2W = (u, v) => [x0 + ax * u + bx * v, z0 + az * u + bz * v]; SK.L2W = L2W;
  // the pad: smooth grey concrete with saw cut joints and old wax marks
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640; const c = cv.getContext('2d');
  if (c && c.fillRect) { c.fillStyle = '#8f8c86'; c.fillRect(0, 0, 1024, 640); for (let i = 0; i < 2600; i++) { const v = 120 + Math.random() * 40 | 0; c.fillStyle = `rgba(${v},${v - 3},${v - 8},.25)`; c.fillRect(Math.random() * 1024, Math.random() * 640, 2, 2); }
    c.fillStyle = 'rgba(40,38,34,.55)'; for (let i = 1; i < 4; i++) c.fillRect(i * 256, 0, 3, 640); c.fillRect(0, 320, 1024, 3);
    c.fillStyle = 'rgba(20,18,16,.18)'; for (let i = 0; i < 30; i++) c.fillRect(380 + Math.random() * 300, 230 + Math.random() * 40, 30 + Math.random() * 90, 2); }
  const pt = new THREE.CanvasTexture(cv); pt.encoding = THREE.sRGBEncoding; pt.anisotropy = ANISO;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 10), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.78 })); pad.position.set(x0, g0 + 0.0, z0); pad.rotation.y = ry; pad.receiveShadow = true; scene.add(pad);
  const granite = new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 0.35 }), steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.85 });
  // the ledge along v = -2.6, the kicker at u = 0, the rail along v = 2.8
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(5, 0.45, 0.6), granite); const [lx, lz] = L2W(1.5, -2.6); ledge.position.set(lx, g0 + 0.28, lz); ledge.rotation.y = ry; ledge.castShadow = true; scene.add(ledge);
  const cop = new THREE.Mesh(new THREE.BoxGeometry(5, 0.03, 0.06), steel); cop.position.set(lx + bx * 0.27, g0 + 0.51, lz + bz * 0.27); cop.rotation.y = ry; scene.add(cop);
  boxWalls(lx, lz, 5, 0.6, ry, -1, 0.5);
  const kick = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6 })); const kp = kick.geometry.attributes.position;
  for (let i = 0; i < kp.count; i++) { if (kp.getY(i) > 0 && kp.getX(i) < 0) kp.setY(i, -0.2); } kp.needsUpdate = true; kick.geometry.computeVertexNormals();
  const [kx, kz] = L2W(-0.6, 0); kick.position.set(kx, g0 + 0.26, kz); kick.rotation.y = ry; kick.castShadow = true; scene.add(kick);
  const [rx0, rz0] = L2W(1, 2.8); const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.4, 10), steel); rail.rotation.z = PI / 2; const rg = new THREE.Group(); rg.add(rail); rg.position.set(rx0, g0 + 0.42, rz0); rg.rotation.y = ry; scene.add(rg);
  [-2, 2].forEach(u => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8), steel); leg.position.set(u, -0.2, 0); rg.add(leg); });
  // a sticker bombed bench of a sign
  const sg = signTex([{ t: 'N3W SKATE', s: 0.36 }, { t: 'NO SKATING (WE SKATE)', s: 0.12 }], 1024, 256, '#efe8da', '#0D0D0D'); const [sx, sz] = L2W(-7.4, -4.6);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: sg, toneMapped: false, side: THREE.DoubleSide })); sm.position.set(sx, ground(sx, sz) + 1.8, sz); sm.rotation.y = ry; scene.add(sm);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 8), steel); sp.position.set(sx, ground(sx, sz) + 0.95, sz); scene.add(sp); post(sx, sz, 0.12, -5, 3);
  // three skaters, each with a board
  const deckTex = (() => { const m = document.createElement('canvas'); m.width = 256; m.height = 64; const q = m.getContext('2d'); if (q && q.fillRect) { q.fillStyle = '#e9e4da'; q.fillRect(0, 0, 256, 64); q.fillStyle = '#2962FF'; q.fillRect(20, 0, 60, 64); q.fillStyle = '#ff3fa4'; q.fillRect(176, 0, 30, 64); if (q.fillText) { q.fillStyle = '#0D0D0D'; q.font = '700 30px "Archivo Black", Impact, sans-serif'; q.fillText('MLOW', 92, 44); } } const t = new THREE.CanvasTexture(m); t.encoding = THREE.sRGBEncoding; return t; })();
  const grip = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.95 }), under = new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.6 }), wheelM = new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.5 });
  const mkBoard = () => { const b = new THREE.Group(), d = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.025, 0.21), [under, under, grip, under, under, under]); d.position.y = 0.075; b.add(d);
    [-0.27, 0.27].forEach(x => [-0.08, 0.08].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 10), wheelM); w.rotation.x = PI / 2; w.position.set(x, 0.03, z); b.add(w); })); b.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(b); return b; };
  [[0x2a2d33, 0x3b4a5c, 'writer', -2.6, 0], [0xb33b2e, 0x1d1f24, 'cabbie', 0, 2.3], [0x2962FF, 0x6b5b45, 'editor', 1.7, 4.6]].forEach(([sh, pa, cast, v, ph], i) => {
    const p = person(sh, pa, SKIN[(i * 2 + 3) % SKIN.length], cast); SK.s.push({ P: p, b: mkBoard(), v: i === 0 ? -1.2 : (i === 1 ? 0.3 : 1.8), t: ph, dur: 7 + i * 0.6, trick: null, bail: 0, dir: i % 2 ? -1 : 1, popped: false }); });
  interact(x0, z0, 7.5, 'E · CALL A TRICK', () => skCall());
  if (window.__MAP) MAP.places.push(['SKATE SPOT', x0, z0, x0 + bx * 7, z0 + bz * 7]);
})();
const skSecret = secret('kickflip', () => skCall(true), ['kickflip', 'skate', 'treflip']);
function skCall(fromWord) {
  let best = SK.s[0], bd = 1e9; SK.s.forEach(s => { const d = Math.hypot(s.P.g.position.x - P.x, s.P.g.position.z - P.z); if (d < bd) { bd = d; best = s; } });
  best.forced = 'tre'; if (!fromWord) skSecret(); toast(bd > 30 ? 'SOMEONE AT THE SKATE SPOT HEARD YOU. TRE FLIP INCOMING. GO WATCH.' : 'TRE FLIP. HE SAYS FILM IT NEXT TIME.', 'blue');
}
function skClack(x, z, loud) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const d = Math.hypot(x - P.x, z - P.z); if (d > 26) return;
  try { const n = Math.floor(AC.sampleRate * 0.06), buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = loud ? 900 : 1900; f.Q.value = 1.2; const g = AC.createGain(); g.gain.value = Math.min(0.12, 2.2 / (d + 2)) * (loud ? 1.3 : 0.8); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); } catch (e) { } }
const SK_TRICKS = ['ollie', 'kickflip', 'heelflip', 'shove', 'tre', 'slide', 'ollie', 'kickflip', 'bail'];
function skFrame(dt) {
  const near = Math.hypot(P.x - SK_AT.x, P.z - SK_AT.z) < 120; if (!near) return;
  SK.s.forEach((s, i) => {
    s.t += dt; if (s.t > s.dur) { s.t = 0; s.dir = -s.dir; s.trick = s.forced || SK_TRICKS[Math.floor(Math.random() * SK_TRICKS.length)]; s.forced = null; s.popped = s.landed = false; }
    const k = s.t / s.dur, travel = 13; // ride the line from one end of the pad to the other, slowing at the ends to turn
    const e = k < 0.12 ? 0 : (k > 0.9 ? 1 : (k - 0.12) / 0.78); const ue = (e - 0.5) * travel * s.dir;
    let v = s.v, hy = 0, roll = 0, spin = 0, by = 0, bailing = false;
    const trick = s.trick, tkr = (ue * s.dir + 1.1) / 2.2, tk = (e > 0 && e < 1) ? tkr : -1; // 0..1 across the kicker
    if (trick === 'slide') { v = -2.48; const sk = (ue + 1) / 5, pre = s.dir > 0 ? -sk : sk - 1, post = s.dir > 0 ? sk - 1 : -sk; if (sk > 0 && sk < 1) { hy = 0.53; spin = PI / 2; if (!s.popped) { s.popped = true; const w = SK.L2W(ue, v); skClack(w[0], w[1], false); } } else if (pre >= 0 && pre < 0.07) hy = 0.53 * Math.sin((1 - pre / 0.07) * PI / 2); else if (post >= 0 && post < 0.07) { hy = 0.53 * (1 - post / 0.07) * (1 - post / 0.07); if (!s.landed && post > 0.05) { s.landed = true; const w = SK.L2W(ue, v); skClack(w[0], w[1], true); } } }
    else if (tk >= 0 && tk <= 1 && trick) { const a = Math.sin(tk * PI); hy = a * (trick === 'ollie' ? 0.55 : 0.75); by = hy;
      if (trick === 'kickflip') roll = tk * PI * 2; if (trick === 'heelflip') roll = -tk * PI * 2; if (trick === 'shove') spin = tk * PI; if (trick === 'tre') { roll = tk * PI * 2; spin = tk * PI * 2; }
      if (!s.popped) { s.popped = true; const w = SK.L2W(ue, v); skClack(w[0], w[1], false); }
      if (trick === 'bail' && tk > 0.55) { bailing = true; } }
    if (trick !== 'slide' && tkr > 1 && s.popped && !s.landed) { s.landed = true; const w = SK.L2W(ue, v); skClack(w[0], w[1], true); if (trick === 'bail') s.bail = 2.6; }
    const [x, z] = SK.L2W(ue, v), gy = SK.g0 + 0.06, head = SK.ry + (s.dir > 0 ? 0 : PI);
    // the board
    if (s.bail > 0) { s.bail -= dt; const bk = 1 - s.bail / 2.6; const [bxw, bzw] = SK.L2W(ue + s.dir * bk * 5, v + 0.6); s.b.position.set(bxw, gy, bzw); s.b.rotation.set(0, head + bk * 3, 0);
      s.P.g.position.set(x, gy - 0.35, z); s.P.g.rotation.set(0, head + PI / 2, Math.min(0.5, bk * 2) * (bk < 0.4 ? 1 : (1 - bk) * 1.6)); s.t = Math.min(s.t, s.dur * 0.9); return; }
    s.b.position.set(x, gy + (trick === 'slide' ? hy : by * 0.92), z); s.b.rotation.set(0, head + spin, 0); s.b.rotateX(roll);
    const push = (k < 0.12 || k > 0.9) ? 0 : Math.max(0, Math.sin(LIFE.t * 4 + i)) * 0.04 * (e < 0.3 ? 1 : 0);
    s.P.g.position.set(x, gy - 0.35 + 0.1 + hy + push, z); s.P.g.rotation.set(0, head + PI / 2 + (trick === 'slide' && hy > 0.4 ? 0.2 : 0), bailing ? 0.25 : 0);
  });
}
window.__FRAMES.push(dt => { try { skFrame(dt); } catch (e) { if (!SK.err) { SK.err = e; console.warn('v58 skate', e); } } });
