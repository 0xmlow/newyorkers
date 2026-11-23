/* ================================================================
   v16 STREET LIFE (2026-11-21)
   A saxophone busker on the path to the toll (walk up and the tune gets louder; E tips him), a breakdance
   circle on GM Beach with a boombox and a crowd (one of them does a headspin), a silver living statue on the
   path that freezes when you look at it and moves when you don't, and the sound of the city: traffic on the
   ring road, a horn now and then, gulls at the waterline. All sound goes through one gain that follows the
   island's own mute.
   ================================================================ */
const STREET = { t: 0, ac: null };
window.__STREET = STREET;
function streetAudio() {
  if (STREET.ready || !AC || AC.state !== 'running') return STREET.ready;
  try {
    const out = AC.createGain(); out.gain.value = 0; out.connect(AC.destination); STREET.out = out;
    // traffic: brown noise through a low pass, louder near the ring road
    const len = AC.sampleRate * 3, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const tg = AC.createGain(); tg.gain.value = 0; src.connect(lp); lp.connect(tg); tg.connect(out); src.start(); STREET.traffic = tg;
    // the sax and the boombox each get a gain set by distance
    STREET.sax = AC.createGain(); STREET.sax.gain.value = 0; const sf = AC.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 2200; STREET.sax.connect(sf); sf.connect(out);
    STREET.box = AC.createGain(); STREET.box.gain.value = 0; STREET.box.connect(out);
    STREET.ready = true;
  } catch (e) { STREET.ready = false; }
  return STREET.ready;
}
function sNote(dest, f, t0, d, type, vol, vib) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
  if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + d + 0.1); }
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.06, d * 0.3)); g.gain.setValueAtTime(vol * 0.8, t0 + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + d + 0.05);
}
/* a slow blues in F for the sax: the busker plays it on a loop, a bar ahead of the clock */
const SAX = [[0, 349, 0.5], [0.5, 415, 0.5], [1, 466, 0.25], [1.25, 494, 0.25], [1.5, 523, 1], [3, 622, 0.5], [3.5, 523, 0.5], [4, 466, 1.5], [6, 415, 0.5], [6.5, 349, 1],
  [8, 523, 0.5], [8.5, 622, 0.5], [9, 698, 1], [10.5, 622, 0.25], [10.75, 523, 0.25], [11, 466, 1], [12.5, 415, 0.5], [13, 349, 2]];
function streetMusic() {
  if (!STREET.ready) return; const now = AC.currentTime;
  if (!STREET.saxNext || STREET.saxNext < now) STREET.saxNext = now + 0.1;
  while (STREET.saxNext < now + 1.5) { const t0 = STREET.saxNext, bpm = 84, beat = 60 / bpm; SAX.forEach(([b, f, d]) => sNote(STREET.sax, f, t0 + b * beat, d * beat * 0.95, 'sawtooth', 0.11, true)); STREET.saxNext = t0 + 16 * beat; }
  if (!STREET.boxNext || STREET.boxNext < now) STREET.boxNext = now + 0.1;
  while (STREET.boxNext < now + 1.0) { const t0 = STREET.boxNext, beat = 60 / 96;
    for (let k = 0; k < 4; k++) { const tk = t0 + k * beat; sNote(STREET.box, k % 2 ? 180 : 60, tk, 0.16, 'sine', k % 2 ? 0.12 : 0.5, false); sNote(STREET.box, 7200, tk + beat / 2, 0.03, 'square', 0.03, false);
      if (k === 3) sNote(STREET.box, 98, tk + beat * 0.75, 0.12, 'sine', 0.35, false); }
    [0, 2].forEach(k => sNote(STREET.box, k ? 233 : 175, t0 + k * beat, beat * 1.6, 'triangle', 0.05, false));
    STREET.boxNext = t0 + 4 * beat; }
}

/* ---------- the busker ---------- */
(function busker() {
  const x = -4.2, z = 78, P0 = person(0x2b2b2b, 0x1d1d22, SKIN[5], 'writer'); P0.g.position.set(x, ground(x, z), z); P0.g.rotation.y = PI / 2;
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a536, metalness: 1, roughness: 0.25 });
  const sax = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.62, 12), brass); sax.add(body);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.06, 0.16, 16, 1, true), brass); bell.position.set(0.05, -0.34, 0.06); bell.rotation.z = -0.9; sax.add(bell);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 8), brass); neck.position.set(-0.03, 0.38, 0.05); neck.rotation.x = 0.8; sax.add(neck);
  sax.position.set(0.12, 1.35, 0.32); sax.rotation.set(0.25, 0, 0.2); P0.g.add(sax);
  const caseM = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.6 })); caseM.position.set(x + 1, ground(x + 1, z) + 0.05, z + 0.3); scene.add(caseM);
  const lining = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.28), new THREE.MeshStandardMaterial({ color: 0xa8263a, roughness: 0.9 })); lining.rotation.x = -PI / 2; lining.position.set(x + 1, ground(x + 1, z) + 0.105, z + 0.3); scene.add(lining);
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 10), MAT.gold || brass, 40); coins.count = 3; scene.add(coins);
  const m = new THREE.Matrix4(); for (let i = 0; i < 40; i++) { m.makeTranslation(x + 0.7 + Math.random() * 0.6, ground(x + 1, z) + 0.11, z + 0.2 + Math.random() * 0.2); coins.setMatrixAt(i, m); }
  const card = signTex([{ t: 'SAX FOR JPGs', s: 0.4 }, { t: 'TIPS IN TDH ACCEPTED', s: 0.17 }], 512, 256, '#f2ead8', '#0D0D0D');
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: card, roughness: 0.9 })); cs.position.set(x + 1, ground(x + 1, z) + 0.28, z + 0.48); cs.rotation.x = -0.4; scene.add(cs);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.45, y0: -5, y1: 5, on: true });
  STREET.busker = { P: P0, sax, x, z, coins };
  const tip = secret('busker', () => { coins.count = Math.min(40, coins.count + 3); coins.instanceMatrix.needsUpdate = true; state.tdh = Math.max(0, state.tdh - 1); toast('YOU TIPPED THE SAX PLAYER 1 TDH. HE PLAYS A LITTLE LOUDER.'); STREET.tipped = 8; try { hud(); } catch (e) { } });
  interact(x + 1, z, 2.4, 'E · TIP THE SAX PLAYER', tip);
})();

/* ---------- the breakdance circle on GM Beach ---------- */
(function breakers() {
  STREET.breakers = null; return;   // retired 2026-11-23: v70 SHOWTIME replaces the beach circle
  const cx = -30, cz = 124, g0 = ground(cx, cz);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.85 })); mat.position.set(cx, g0 + 0.02, cz); scene.add(mat);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'); if (c) { c.fillStyle = '#c9a77a'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#8a6a44'; c.lineWidth = 3; for (let i = 0; i < 256; i += 32) { c.beginPath && (c.beginPath(), c.moveTo(i, 0), c.lineTo(i, 256), c.stroke()); } }
  const ct = new THREE.CanvasTexture(cv); ct.encoding = THREE.sRGBEncoding; mat.material.map = ct; mat.material.color.set(0xffffff);
  const box = new THREE.Group(); const bb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.48, 0.3), new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.4, metalness: 0.4 })); box.add(bb);
  const sp = []; [-0.25, 0.25].forEach(x => { const s = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.6 })); s.position.set(x, 0, 0.152); box.add(s); sp.push(s); });
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16, PI), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })); h.position.y = 0.24; box.add(h);
  box.position.set(cx + 2.8, g0 + 0.24, cz - 1.2); box.rotation.y = -0.9; scene.add(box);
  const dancer = person(0xff6b00, 0x1d2233, SKIN[1], 'cabbie'); dancer.g.position.set(cx, g0, cz);
  const crowd = []; const shirts = [0x2962ff, 0xf0efea, 0xd04a8a, 0x44aa66, 0xffd400, 0x111111, 0x7b3f32];
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + 0.3, r = 3.5 + (i % 2) * 0.4; const p = person(shirts[i], 0x2a2f45, SKIN[(i + 2) % SKIN.length]); p.g.position.set(cx + Math.cos(a) * r, g0, cz + Math.sin(a) * r); p.g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); crowd.push({ p, ph: i * 0.7 }); }
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x: cx, z: cz, r: 3.2, y0: -5, y1: 5, on: true });
  STREET.breakers = { cx, cz, g0, dancer, crowd, sp, box };
  interact(cx, cz, 6.5, 'E · CHEER', secret('cheer', () => { toast('THE CIRCLE GOES UP A LEVEL. HE TRIES A WINDMILL.'); STREET.hype = 6; }));
})();
function breakFrame(dt) {
  const B = STREET.breakers; if (!B) return; const t = STREET.t, cyc = t % 12, g = B.dancer.g, hype = (STREET.hype || 0) > 0 ? 1.8 : 1;
  if (cyc < 4) { g.rotation.set(0, t * 2 * hype, 0); g.position.y = B.g0 + Math.abs(Math.sin(t * 6)) * 0.12; animLegs(B.dancer, t * 1.4, true); }       // toprock
  else if (cyc < 8) { g.rotation.set(PI, t * 9 * hype, 0); g.position.y = B.g0 + 1.92; }                                                             // headspin
  else { g.rotation.set(0, t * 5 * hype, Math.sin(t * 10) * 0.9); g.position.y = B.g0 + 0.25 + Math.abs(Math.sin(t * 5)) * 0.2; }                   // windmill-ish
  B.crowd.forEach((c, i) => { c.p.g.position.y = B.g0 + Math.max(0, Math.sin(t * 6.3 + c.ph)) * 0.06 * hype; animLegs(c.p, 0, false); c.p.arms[0].rotation.x = c.p.arms[1].rotation.x = -(1.2 + Math.sin(t * 6.3 + c.ph) * 0.4) * (hype > 1 || i % 3 === 0 ? 1 : 0.2); });
  B.sp.forEach(s => s.scale.setScalar(1 + Math.max(0, Math.sin(t * 20)) * 0.08));
  if (STREET.hype > 0) STREET.hype -= dt;
}

/* ---------- the living statue: moves only when you are not looking ---------- */
(function statue() {
  return;   // retired 2026-11-23: v96 THE LIVING STATUE stands here now and carries the 'statue' secret
  const x = 4.8, z = 30, P0 = person(0xb8bcc2, 0xb8bcc2, 0xb8bcc2, 'wiseguy'); P0.g.position.set(x, ground(x, z) + 0.45, z); P0.g.rotation.y = -PI / 2;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.35 })); box.position.set(x, ground(x, z) + 0.225, z); scene.add(box);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.55, y0: -5, y1: 5, on: true });
  STREET.statue = { P: P0, x, z, pose: 0, silver: false, moved: 0 };
})();
const statueCaught = secret('statue', () => { toast('YOU SAW IT MOVE. THE STATUE SAYS NOTHING. THE STATUE SAYS GM.'); });
function statueFrame(dt) {
  const S = STREET.statue; if (!S) return;
  if (!S.silver && S.P.g.userData.slot && S.P.g.userData.slot.children.length) { S.silver = true; const sm = new THREE.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 0.95, roughness: 0.3 }); S.P.g.userData.slot.traverse(o => { if (o.isMesh) o.material = sm; }); }
  const v = new THREE.Vector3(S.x - camera.position.x, 0, S.z - camera.position.z), d = v.length(); v.normalize();
  const f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const looking = f.dot(v) > 0.55 && d < 30;
  if (!looking && d < 25) { S.moved += dt; if (S.moved > 1.2) { S.moved = 0; S.pose = (S.pose + 1) % 4; S.P.g.rotation.y = -PI / 2 + [0, 0.8, -0.7, 0.3][S.pose]; S.P.arms[0].rotation.x = [-0, -2.6, -1.4, -0.4][S.pose]; S.P.arms[1].rotation.x = [0, 0.2, -2.8, -1.6][S.pose]; S.changed = true; } }
  if (looking && S.changed && d < 12) { S.changed = false; statueCaught(); }
}

function streetFrame(dt) {
  STREET.t += dt;
  try {
    breakFrame(dt); statueFrame(dt);
    const B = STREET.busker; if (B) { B.sax.rotation.z = 0.2 + Math.sin(STREET.t * 2.2) * 0.08; B.P.g.position.y = ground(B.x, B.z) + Math.abs(Math.sin(STREET.t * 1.4)) * 0.03; }
    if (streetAudio()) {
      const muted = !oceanGain || oceanGain.gain.value === 0; STREET.out.gain.value = muted ? 0 : 1; streetMusic();
      const r = Math.hypot(P.x, P.z); STREET.traffic.gain.value = 0.22 * Math.max(0, 1 - Math.abs(r - 100) / 40);
      const dS = Math.hypot(P.x - B.x, P.z - B.z); STREET.sax.gain.value = Math.max(0, 1 - dS / 28) ** 2 * ((STREET.tipped || 0) > 0 ? 1.4 : 1);
      const BR = STREET.breakers, dB = BR ? Math.hypot(P.x - BR.cx, P.z - BR.cz) : 999; STREET.box.gain.value = BR ? Math.max(0, 1 - dB / 30) ** 2 * 0.9 : 0;
      if (STREET.tipped > 0) STREET.tipped -= dt;
      if (Math.random() < dt * 0.05 && Math.abs(r - 100) < 30) { const t0 = AC.currentTime; sNote(STREET.out, 392, t0, 0.35, 'square', 0.02, false); sNote(STREET.out, 494, t0, 0.35, 'square', 0.02, false); }
      if (Math.random() < dt * 0.08 && r > 105) { const t0 = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1800, t0); o.frequency.exponentialRampToValueAtTime(900, t0 + 0.35); g.gain.setValueAtTime(0.025, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4); o.connect(g); g.connect(STREET.out); o.start(t0); o.stop(t0 + 0.45); }
    }
  } catch (e) { if (!STREET.err) { STREET.err = e; console.warn('v16 street', e); } }
}
