/* ================================================================
   v13 THINGS TO PLAY WITH (2026-11-21)
   A yellow cab with an N3W YORKERS topper that circles the ring road and takes you for a lap (type TAXI, then E),
   the Pizza Rat (PIZZA), a whale that breaches by the pier (WHALE), a mirror ball over the Floor (DISCO),
   moon gravity (MOON), pigeon height (SHRINK), kaiju height (GROW), fireworks (FIREWORKS, N3W),
   the sidewalk clock that reads New York time and goes off at 4:20 (420), a pay phone that rings,
   a hot dog cart that feeds the pigeons, and the bodega cat you can pet.
   Every secret found is counted: SECRETS n OF N.
   ================================================================ */
const PLAY = { found: new Set(), total: 0, timers: {} };
window.__PLAY = PLAY;
function beep(f = 440, d = 0.15, type = 'square', vol = 0.06, when = 0) {
  if (!AC || AC.state !== 'running') return; try { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = 0;
    const t0 = AC.currentTime + when; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.05); } catch (e) { }
}
function talk(t) { try { if (window.speechSynthesis && window.SpeechSynthesisUtterance) { const u = new SpeechSynthesisUtterance(t); u.rate = 1.02; u.pitch = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) { } }
/* register a secret: its words go into EGGS (typed or in chat) and the first find is counted */
function secret(key, fn, words) {
  PLAY.total++; const run = (...a) => { if (!PLAY.found.has(key)) { PLAY.found.add(key); setTimeout(() => toast(`SECRET ${PLAY.found.size} OF ${PLAY.total} FOUND`, 'blue'), 1600); try { localStorage.setItem('meme-island-secrets', JSON.stringify([...PLAY.found])); } catch (e) { } } return fn(...a); };
  run.__s = true; (words || []).forEach(w => { EGGS[w] = run; }); return run;
}
try { (JSON.parse(localStorage.getItem('meme-island-secrets') || '[]') || []).forEach(k => PLAY.found.add(k)); } catch (e) { }
/* a timed body change that undoes itself (the room only undoes what it did) */
function bodyMode(name, set, secs, msg, endMsg) {
  if (PLAY.timers.body) { clearTimeout(PLAY.timers.body); window.__GRAV = window.__EYE = window.__SPD = 1; }
  set(); toast(msg); PLAY.timers.body = setTimeout(() => { window.__GRAV = window.__EYE = window.__SPD = 1; PLAY.timers.body = null; toast(endMsg, 'blue'); }, secs * 1000);
}

/* ---------- the cab ---------- */
const CAB = { g: null, a: 1.2, r: 101.6, sp: 9, hail: false, stopA: 0, ride: false, wait: 0 };
(function cab() {
  const g = new THREE.Group(), yel = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.35, metalness: 0.15 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.25, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.7), yel); body.position.y = 0.72; g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2.5), dark); top.position.set(0, 1.38, -0.2); g.add(top);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.06, 2.3), yel); roof.position.set(0, 1.71, -0.2); g.add(roof);
  const chk = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 16; const c = cv.getContext('2d'); if (c) for (let i = 0; i < 32; i++) { c.fillStyle = (i % 2) ? '#111' : '#f2b705'; c.fillRect(i * 8, 0, 8, 8); c.fillStyle = (i % 2) ? '#f2b705' : '#111'; c.fillRect(i * 8, 8, 8, 8); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })();
  [-0.951, 0.951].forEach(x => { const s = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.16), new THREE.MeshBasicMaterial({ map: chk })); s.position.set(x, 0.8, 0); s.rotation.y = x > 0 ? PI / 2 : -PI / 2; g.add(s); });
  const topper = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })); topper.position.set(0, 1.92, -0.2); g.add(topper);
  const tt = signTex([{ t: 'N3W YORKERS', s: 0.58 }], 512, 160, '#0D0D0D', '#FFFFFF');
  [0.085, -0.085].forEach(z => { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.3), new THREE.MeshBasicMaterial({ map: tt, toneMapped: false })); f.position.set(0, 1.92, -0.2 + z); if (z < 0) f.rotation.y = PI; g.add(f); });
  const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16); wg.rotateZ(PI / 2);
  CAB.wheels = [[-0.88, 1.5], [0.88, 1.5], [-0.88, -1.5], [0.88, -1.5]].map(([x, z]) => { const w = new THREE.Mesh(wg, dark); w.position.set(x, 0.36, z); g.add(w); return w; });
  [-0.6, 0.6].forEach(x => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8, toneMapped: false })); h.position.set(x, 0.78, 2.36); g.add(h);
    const r = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false })); r.position.set(x, 0.8, -2.36); r.rotation.y = PI; g.add(r); });
  scene.add(g); CAB.g = g;
})();
CAB.hailNow = secret('taxi', () => {
  if (CAB.ride) return; const a = Math.atan2(P.z, P.x); CAB.hail = true; CAB.stopA = a - 0.04; toast('TAXI! A CAB WITH AN N3W YORKERS TOPPER IS COMING ROUND THE RING ROAD.');
  beep(520, 0.12, 'square', 0.05); beep(520, 0.12, 'square', 0.05, 0.18);
}, ['taxi', 'cab', 'nyc']);
function cabRide() {
  if (CAB.ride) return; CAB.ride = true; CAB.hail = false; toast('IN THE CAB. METER: $0.00. THIS ISLAND HAS NO GAS FEES.'); beep(660, 0.1); beep(880, 0.1, 'square', 0.05, 0.12);
  const pos = [], look = [], a0 = CAB.a; for (let i = 0; i <= 28; i++) { const a = a0 + i / 28 * PI * 2; pos.push([Math.cos(a) * CAB.r, 1.75, Math.sin(a) * CAB.r]); const b = a + 0.12; look.push([Math.cos(b) * CAB.r, 1.6, Math.sin(b) * CAB.r]); }
  playRail({ pos, look, dur: 34, ease: false, done: () => { CAB.ride = false; CAB.wait = 4; const a = CAB.a + 0.06; teleport(Math.cos(a) * 96.5, Math.sin(a) * 96.5, 0); toast('THAT\'LL BE ZERO. TIPS ARE TDH.', 'blue'); } });
}
interact(0, 0, 0, '', () => { }); const cabInter = INTER[INTER.length - 1];
function cabFrame(dt) {
  if (!CAB.g) return;
  if (CAB.ride && RAIL.on) { const p = camera.position; const a = Math.atan2(p.z, p.x); CAB.a = a; }
  else if (CAB.wait > 0) CAB.wait -= dt;
  else { let sp = CAB.sp; if (CAB.hail) { let d = CAB.stopA - CAB.a; d = ((d % (2 * PI)) + 2 * PI) % (2 * PI); if (d < 0.25) sp = CAB.sp * Math.max(0, d / 0.25 - 0.05); if (d < 0.01 || sp <= 0) sp = 0; } CAB.a += sp / CAB.r * dt; }
  const x = Math.cos(CAB.a) * CAB.r, z = Math.sin(CAB.a) * CAB.r; CAB.g.position.set(x, ground(x, z) + 0.02, z); CAB.g.rotation.y = -CAB.a; // tangent, counter clockwise
  CAB.wheels.forEach(w => w.rotation.x += dt * (CAB.ride ? 25 : CAB.hail && CAB.wait <= 0 ? 0 : 25));
  const near = Math.hypot(P.x - x, P.z - z) < 4.5 && !CAB.ride; cabInter.x = x; cabInter.z = z; cabInter.r = 4.5; cabInter.label = near ? 'E · GET IN THE CAB' : ''; cabInter.fn = cabRide;
  if (!CAB.hail && !CAB.ride && near && Math.random() < dt * 0.4) beep(500, 0.1, 'square', 0.03);
}

/* ---------- the Pizza Rat ---------- */
const RAT = { g: null, t: -1, path: null };
(function rat() {
  const g = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ color: 0x4a4542, roughness: 0.9 }), pink = new THREE.MeshStandardMaterial({ color: 0xd9908f, roughness: 0.7 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), fur); b.scale.set(1, 0.8, 1.9); b.position.y = 0.15; g.add(b);
  const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 10), fur); h.rotation.x = PI / 2; h.position.set(0, 0.17, 0.38); g.add(h);
  [-0.07, 0.07].forEach(x => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), pink); e.position.set(x, 0.27, 0.3); g.add(e); });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.025, 0.5, 6), pink); tail.rotation.x = PI / 2 - 0.3; tail.position.set(0, 0.1, -0.5); g.add(tail);
  const sl = new THREE.Shape(); sl.moveTo(0, 0); sl.lineTo(-0.22, 0.55); sl.quadraticCurveTo(0, 0.62, 0.22, 0.55); sl.lineTo(0, 0);
  const slice = new THREE.Mesh(new THREE.ExtrudeGeometry(sl, { depth: 0.03, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.6 }));
  slice.rotation.x = -PI / 2 + 0.25; slice.position.set(0, 0.2, 0.46); g.add(slice);
  [[-0.06, 0.62], [0.08, 0.66], [0, 0.78]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), new THREE.MeshStandardMaterial({ color: 0xa8321e })); p.rotation.x = -PI / 2 + 0.25; p.position.set(x, 0.235 + (z - 0.6) * 0.25, z); g.add(p); });
  g.visible = false; scene.add(g); RAT.g = g;
})();
const ratRun = secret('pizza', () => {
  const a = Math.atan2(P.z, P.x) + 0.5, x0 = P.x + Math.cos(a) * 9, z0 = P.z + Math.sin(a) * 9, x1 = P.x - Math.cos(a) * 9, z1 = P.z - Math.sin(a) * 9;
  RAT.path = [x0, z0, x1, z1]; RAT.t = 0; RAT.g.visible = true; toast('THE PIZZA RAT. HE HAS PLACES TO BE.'); [1200, 1500, 1300].forEach((f, i) => beep(f, 0.05, 'sine', 0.04, i * 0.09));
}, ['pizza', 'rat', 'pizzarat']);
function ratFrame(dt) {
  if (RAT.t < 0) return; RAT.t += dt; const k = RAT.t / 4.2, [x0, z0, x1, z1] = RAT.path; if (k >= 1) { RAT.t = -1; RAT.g.visible = false; return; }
  const x = x0 + (x1 - x0) * k + Math.sin(k * 30) * 0.15, z = z0 + (z1 - z0) * k; RAT.g.position.set(x, Math.max(ground(x, z), (floorAt(x, z, P.y + 1).f || 0)) + Math.abs(Math.sin(RAT.t * 22)) * 0.04, z);
  RAT.g.rotation.y = Math.atan2(x1 - x0, z1 - z0);
}

/* ---------- a whale breaches off the pier ---------- */
const BREACH = { g: null, t: -1, splash: null };
(function whale() {
  const g = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0x2c3a4a, roughness: 0.55 }), belly = new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.6 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), skin); b.scale.set(1, 0.9, 4.2); g.add(b);
  const bl = new THREE.Mesh(new THREE.SphereGeometry(1.5, 18, 10, 0, PI * 2, PI * 0.55, PI * 0.45), belly); bl.scale.set(0.95, 0.85, 4.0); g.add(bl);
  const fl = new THREE.Shape(); fl.moveTo(0, 0); fl.quadraticCurveTo(1.8, 0.6, 2.6, -0.4); fl.quadraticCurveTo(1.2, 0.1, 0, -0.6); fl.quadraticCurveTo(-1.2, 0.1, -2.6, -0.4); fl.quadraticCurveTo(-1.8, 0.6, 0, 0);
  const fluke = new THREE.Mesh(new THREE.ShapeGeometry(fl), new THREE.MeshStandardMaterial({ color: 0x2c3a4a, roughness: 0.55, side: THREE.DoubleSide })); fluke.rotation.x = -PI / 2; fluke.position.z = -6.9; g.add(fluke);
  [-1, 1].forEach(s => { const fin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.8), skin); fin.position.set(s * 1.9, -0.6, 2.2); fin.rotation.z = s * -0.5; g.add(fin); });
  g.scale.setScalar(1.7); g.visible = false; scene.add(g); BREACH.g = g;
  const N = 260, gg = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-999); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ size: 0.9, map: LIFE.soft, color: 0xeef8ff, transparent: true, depthWrite: false, opacity: 0.9 }); const pts = new THREE.Points(gg, pm); pts.frustumCulled = false; scene.add(pts);
  BREACH.splash = { pts, pos, v: Array.from({ length: N }, () => [0, 0, 0, 0]) };
})();
function splashAt(x, z, n) { const S = BREACH.splash; for (let i = 0; i < S.v.length && n > 0; i++) { if (S.v[i][3] > 0) continue; n--; const a = Math.random() * 6.283, s = 3 + Math.random() * 6; S.v[i] = [Math.cos(a) * s * 0.5, 6 + Math.random() * 9, Math.sin(a) * s * 0.5, 2.2]; S.pos[i * 3] = x + Math.cos(a) * 2; S.pos[i * 3 + 1] = 0; S.pos[i * 3 + 2] = z + Math.sin(a) * 2; } }
const whaleGo = secret('whale', () => {
  BREACH.t = 0; BREACH.x = 22 + Math.random() * 10; BREACH.z = 188 + Math.random() * 10; BREACH.g.visible = true; toast('WHALE ALERT. A REAL ONE THIS TIME.');
  try { WHALE.on = true; WHALE.draw && WHALE.draw('ONE WHALE'); } catch (e) { }
}, ['whale', 'whales']);
function whaleFrame(dt) {
  const S = BREACH.splash; let any = false;
  for (let i = 0; i < S.v.length; i++) { const v = S.v[i]; if (v[3] <= 0) continue; any = true; v[3] -= dt; v[1] -= 14 * dt; S.pos[i * 3] += v[0] * dt; S.pos[i * 3 + 1] += v[1] * dt; S.pos[i * 3 + 2] += v[2] * dt; if (S.pos[i * 3 + 1] < -0.5 || v[3] <= 0) { v[3] = 0; S.pos[i * 3 + 1] = -999; } }
  S.pts.visible = any; if (any) S.pts.geometry.attributes.position.needsUpdate = true;
  if (BREACH.t < 0) return; BREACH.t += dt; const t = BREACH.t, D = 3.4;
  if (t > D + 1) { BREACH.t = -1; BREACH.g.visible = false; return; }
  const k = Math.min(1, t / D), y = -14 + Math.sin(k * PI) * 25, pitch = -PI / 2 + k * PI * 0.95;
  BREACH.g.position.set(BREACH.x, y, BREACH.z + (k - 0.5) * 10); BREACH.g.rotation.set(pitch, 0.4, Math.sin(k * PI) * 0.9);
  if (!BREACH.s1 && y > -1.5 && k < 0.5) { BREACH.s1 = true; splashAt(BREACH.x, BREACH.z - 4, 90); beep(90, 0.6, 'sawtooth', 0.05); }
  if (!BREACH.s2 && k > 0.8) { BREACH.s2 = true; splashAt(BREACH.x, BREACH.z + 4, 160); beep(70, 0.9, 'sawtooth', 0.06); }
  if (BREACH.t < 0.05) BREACH.s1 = BREACH.s2 = false;
}

/* ---------- a mirror ball over the Floor ---------- */
const DISCO = { on: 0, g: null, beams: [] };
(function disco() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d');
  if (c) for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { const v = 150 + Math.random() * 105 | 0; c.fillStyle = `rgb(${v},${v},${v + 10})`; c.fillRect(x * 8 + 1, y * 8 + 1, 6, 6); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshStandardMaterial({ map: t, metalness: 1, roughness: 0.12, envMapIntensity: 2.2 }));
  const g = new THREE.Group(); g.add(ball); const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 30, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); wire.position.y = 16; g.add(wire);
  const cols = [0x2962ff, 0xff6b00, 0xff4fa0, 0x08deff, 0xffd400, 0xffffff];
  for (let i = 0; i < 10; i++) { const geo = new THREE.ConeGeometry(2.6, 30, 16, 1, true); geo.translate(0, -15, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    g.add(m); DISCO.beams.push(m); }
  g.position.set(0, 26, 0); g.visible = false; scene.add(g); DISCO.g = g; DISCO.ball = ball;
})();
const discoGo = secret('disco', () => { DISCO.on = 24; DISCO.g.visible = true; DISCO.beat = 0; toast('THE FLOOR IS NOW A DANCE FLOOR. FLOOR PRICE: ONE MOVE.'); }, ['disco', 'party', 'dance', 'rave']);
function discoFrame(dt) {
  if (DISCO.on <= 0) return; DISCO.on -= dt; if (DISCO.on <= 0) { DISCO.g.visible = false; return; }
  DISCO.ball.rotation.y += dt * 1.2; DISCO.beams.forEach((b, i) => { const a = LIFE.t * (0.6 + i * 0.07) + i * 0.63; b.rotation.set(0.5 + Math.sin(LIFE.t * 0.9 + i) * 0.35, 0, 0); b.rotation.y = a; b.rotation.order = 'YXZ'; b.material.opacity = 0.1 + 0.12 * (Math.sin(LIFE.t * 8 + i) > 0 ? 1 : 0.3); });
  DISCO.beat -= dt; if (DISCO.beat <= 0) { DISCO.beat = 0.5; beep(55, 0.18, 'sine', 0.22); beep(7000, 0.03, 'square', 0.015, 0.25); }
  try { residents.forEach((r, i) => { if (r.P && r.P.g && Math.hypot(r.P.g.position.x, r.P.g.position.z) < 40) r.P.g.position.y += Math.sin(LIFE.t * 12.566 + i) * 0.01; }); } catch (e) { }
}

/* ---------- bodies ---------- */
secret('moon', () => bodyMode('moon', () => { window.__GRAV = 0.22; }, 30, 'MOON GRAVITY FOR 30 SECONDS. JUMP.', 'BACK ON EARTH. STILL EARLY.'), ['moon', 'gravity']);
secret('shrink', () => bodyMode('shrink', () => { window.__EYE = 0.16; window.__SPD = 0.7; }, 30, 'PIGEON HEIGHT. THE PIGEONS SEE YOU AS AN EQUAL.', 'FULL SIZE AGAIN.'), ['shrink', 'pigeon', 'tiny']);
secret('grow', () => bodyMode('grow', () => { window.__EYE = 7; window.__SPD = 2.4; window.__GRAV = 1.4; }, 20, 'KAIJU MODE. PLEASE MIND THE FERRY.', 'BACK TO HUMAN SCALE.'), ['grow', 'kaiju', 'giant']);
secret('fireworks', () => { LIFE.fireworks(9); toast('FIREWORKS OVER THE HARBOUR. LOOK SOUTH.'); }, ['fireworks', 'boom', 'celebrate']);
secret('n3w', () => { LIFE.fireworks(14); flash('#2962FF'); toast('N3W YORKERS. THE E IS A 3. THE O IS AN EYE. THE CITY IS THE ART.', 'blue'); }, ['n3w', 'n3wyorkers', 'newyorkers']);
secret('snow', () => { WX.override = 'SNOW'; toast('SNOW DAY. THE ISLAND IS CLOSED. THE ISLAND IS ALSO OPEN.'); }, ['snow', 'snowday']);
secret('sus', () => { try { residents.forEach(r => say(r, '...')); } catch (e) { } toast('EVERYONE ON THE ISLAND TURNS AROUND AT ONCE.'); }, ['sus']);
secret('bodega', () => { toast('THE BODEGA CAT HEARD THAT. THE BODEGA CAT DOES NOT CARE.'); beep(700, 0.25, 'triangle', 0.05); beep(520, 0.4, 'triangle', 0.05, 0.25); }, ['bodega', 'cat', 'meow']);

/* ---------- the sidewalk clock: New York time, and 4:20 ---------- */
const SWC = { faces: [], hands: [] };
(function sidewalkClock() {
  const x = -6.5, z = 126, g0 = ground(x, z), iron = new THREE.MeshStandardMaterial({ color: 0x173d2c, roughness: 0.45, metalness: 0.6 }), gold = MAT.gold || new THREE.MeshStandardMaterial({ color: 0xc9a23a, metalness: 0.9, roughness: 0.3 });
  const g = new THREE.Group(); g.position.set(x, g0, z); scene.add(g);
  const prof = []; [[0.42, 0], [0.42, 0.2], [0.3, 0.32], [0.22, 0.6], [0.16, 0.8], [0.13, 2.6], [0.2, 2.75], [0.26, 3.0]].forEach(([r, y]) => prof.push(new THREE.Vector2(r, y)));
  const post = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), iron); g.add(post);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.34, 32), iron); head.rotation.x = PI / 2; head.position.y = 3.72; g.add(head);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), gold); crown.position.y = 4.55; g.add(crown);
  const faceCv = document.createElement('canvas'); faceCv.width = faceCv.height = 256; const c = faceCv.getContext('2d');
  if (c && c.arc) { c.fillStyle = '#f6f1e3'; c.beginPath(); c.arc(128, 128, 124, 0, PI * 2); c.fill(); c.fillStyle = '#111'; c.font = '400 30px Anton,Impact,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * PI * 2; c.fillText(String(i), 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); }
    c.font = '800 13px "Archivo Expanded",Arial,sans-serif'; c.fillText('N3W YORK TIME', 128, 82); c.fillStyle = '#1E77E3'; c.beginPath(); c.arc(128, 172, 10, 0, PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(128, 172, 5.7, 0, PI * 2); c.fill(); }
  const ft = new THREE.CanvasTexture(faceCv); ft.encoding = THREE.sRGBEncoding;
  [1, -1].forEach(s => { const f = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.5, emissive: 0xfff2c8, emissiveIntensity: 0, emissiveMap: ft }));
    f.position.set(0, 3.72, 0.175 * s); if (s < 0) f.rotation.y = PI; g.add(f); SWC.faces.push(f);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 40), gold); ring.position.copy(f.position); g.add(ring);
    const mk = (w, h, z) => { const geo = new THREE.BoxGeometry(w, h, 0.02); geo.translate(0, h / 2 - 0.05, 0); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x111111 })); m.position.set(0, 3.72, (0.175 + z) * s); g.add(m); return m; };
    SWC.hands.push({ s, h: mk(0.05, 0.36, 0.015), m: mk(0.035, 0.52, 0.025) }); });
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.45, y0: g0 - 1, y1: g0 + 5, on: true });
  interact(x, z, 2.4, 'E · ASK THE CLOCK MAN THE TIME', () => { const t = SKY.t; toast(`IT IS ${pad2(t.h)}:${pad2(t.m)} IN NEW YORK. THE CLOCK MAN ALWAYS READS 4:20 ANYWAY.`); });
})();
const four20 = secret('420', () => { const t = SKY.t; let d = (16 * 60 + 20) - (t.h * 60 + t.m); if (d < -60) d += 1440; shiftTime(d * 60); SWC.force = 6; toast('THE CLOCK MAN READS 4:20.'); LIFE.fireworks(5); }, ['420', 'clockman']);
function clockFrame() {
  const t = SKY.t; if (!t) return; let h = t.h % 12, m = t.m + (t.sec % 60) / 60;
  if (SWC.force > 0) { h = 4; m = 20; }
  SWC.hands.forEach(H => { H.h.rotation.z = -H.s * (h + m / 60) / 12 * PI * 2; H.m.rotation.z = -H.s * m / 60 * PI * 2; });
  SWC.faces.forEach(f => { f.material.emissiveIntensity = (L.lamps || 0) * 0.9; });
  if ((t.h === 16 || t.h === 4) && t.m === 20 && SWC.lastFire !== t.h) { SWC.lastFire = t.h; LIFE.fireworks(8); toast('4:20 IN NEW YORK. THE CLOCK MAN SAYS GM.', 'blue'); }
}

/* ---------- a pay phone that rings ---------- */
const PHONE = { ring: 0, next: 40, lines: [
  'gm. this is the island. you left your seed phrase at home, which is correct.',
  'hello, is this the person standing by the pier? the Colossus would like a word about your paper hands.',
  'this is a recorded message from the bodega. the cat is not for sale. the cat was never for sale.',
  'congratulations. you have been selected for a free airdrop of nothing. it is already in your wallet.',
  'you have reached the 6529 museum district hotline. press one for memes. press two for more memes.',
  'it is always summer dot jpeg somewhere. right now it is here.',
  'wen? soon. click.'] };
(function phone() {
  const x = 6.5, z = 126.5, g0 = ground(x, z), steel = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.35, metalness: 0.8 }), blk = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 });
  const g = new THREE.Group(); g.position.set(x, g0, z); g.rotation.y = PI; scene.add(g);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), steel); pole.position.y = 0.6; g.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.32), steel); box.position.y = 1.65; g.add(box);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.62), blk); hood.position.set(0, 2.42, 0.1); g.add(hood);
  const hs = signTex([{ t: 'PHONE', s: 0.62 }], 256, 96, '#1E77E3', '#FFFFFF'); const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: hs, toneMapped: false })); lab.position.set(0, 2.3, 0.415); g.add(lab);
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), blk); keys.position.set(0.08, 1.6, 0.17); g.add(keys);
  const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), blk); rec.position.set(-0.2, 1.7, 0.2); g.add(rec); PHONE.rec = rec;
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.45, y0: g0 - 1, y1: g0 + 3, on: true });
  interact(x, z, 2.2, '', () => { }); PHONE.inter = INTER[INTER.length - 1];
})();
const answer = secret('phone', () => { const l = PHONE.lines[(Math.random() * PHONE.lines.length) | 0]; PHONE.ring = 0; PHONE.next = 50 + Math.random() * 60; toast('"' + l.toUpperCase() + '"'); talk(l); });
function phoneFrame(dt) {
  PHONE.next -= dt; if (PHONE.next <= 0 && PHONE.ring <= 0) { PHONE.ring = 12; PHONE.next = 999; }
  if (PHONE.ring > 0) { PHONE.ring -= dt; const ph = (12 - PHONE.ring) % 3; if (ph < 1.2 && Math.hypot(P.x - 6.5, P.z - 126.5) < 40 && (ph % 0.1) < dt * 1.2) beep(ph % 0.2 < 0.1 ? 880 : 960, 0.05, 'square', 0.03);
    PHONE.rec.position.x = -0.2 + Math.sin(LIFE.t * 60) * 0.01 * (ph < 1.2 ? 1 : 0); if (PHONE.ring <= 0) PHONE.next = 40 + Math.random() * 50; }
  PHONE.inter.label = PHONE.ring > 0 ? 'E · ANSWER THE RINGING PHONE' : 'E · PICK UP THE PHONE'; PHONE.inter.fn = () => PHONE.ring > 0 ? answer() : (toast('A DIAL TONE. IT SOUNDS LIKE 2014.'), beep(350, 1.2, 'sine', 0.04), beep(440, 1.2, 'sine', 0.04));
}

/* ---------- the hot dog cart: buy a dog, feed the pigeons ---------- */
(function cart() {
  const x = 15, z = 116, g0 = ground(x, z), steel = new THREE.MeshStandardMaterial({ color: 0xc4cad1, roughness: 0.25, metalness: 0.9 });
  const g = new THREE.Group(); g.position.set(x, g0, z); g.rotation.y = -0.6; scene.add(g);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 1.05), steel); box.position.y = 0.9; g.add(box);
  const fs = signTex([{ t: 'N3W DOGS', s: 0.5 }, { t: 'NO GAS · NO RUGS · ONE DOLLAR', s: 0.16 }], 512, 220, '#1E77E3', '#FFFFFF');
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.88), new THREE.MeshBasicMaterial({ map: fs, toneMapped: false })); front.position.set(0, 0.9, 0.53); g.add(front);
  const wg = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16); wg.rotateZ(PI / 2); [-0.6, 0.6].forEach(zz => { const w = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x222222 })); w.position.set(-1.12, 0.3, zz); g.add(w); });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), steel); pole.position.set(0, 2.2, 0); g.add(pole);
  const uc = document.createElement('canvas'); uc.width = 256; uc.height = 32; const c = uc.getContext('2d'); if (c) for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#1E77E3'; c.fillRect(i * 16, 0, 16, 32); }
  const ut = new THREE.CanvasTexture(uc); ut.encoding = THREE.sRGBEncoding;
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.6, 16, 1, true), new THREE.MeshStandardMaterial({ map: ut, side: THREE.DoubleSide, roughness: 0.8 })); umb.position.set(0, 3.2, 0); g.add(umb);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 1.25, y0: g0 - 1, y1: g0 + 3, on: true });
  const buy = secret('hotdog', () => { toast('ONE DIRTY WATER DOG. THE PIGEONS SAW THAT.'); LIFE.feed && LIFE.feed(x + 2, z + 1.5); state.tdh += 1; beep(600, 0.08, 'triangle', 0.05); beep(900, 0.12, 'triangle', 0.05, 0.1); }, ['hotdog']);
  interact(x, z, 2.8, 'E · BUY A HOT DOG ($1, NO GAS)', buy);
})();

/* ---------- pet the bodega cat ---------- */
(function petCat() {
  if (!CAT || !CAT.g) return; const hearts = [];
  const pet = secret('petcat', () => { toast('THE BODEGA CAT ALLOWS IT. +6.529 TDH.'); state.tdh += 6.529; try { hud(); } catch (e) { }
    for (let i = 0; i < 6; i++) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex([{ t: '♥', s: 0.9 }], 64, 64, null, '#ff4fa0'), transparent: true, depthWrite: false })); h.scale.setScalar(0.25); const p = CAT.g.position; h.position.set(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.4, p.z + (Math.random() - 0.5) * 0.4); scene.add(h); hearts.push({ h, t: 0, d: i * 0.15 }); }
    for (let i = 0; i < 10; i++) beep(26 + (i % 2) * 3, 0.18, 'sawtooth', 0.04, i * 0.17); });
  interact(CAT.x, CAT.z, 2.2, 'E · PET THE BODEGA CAT', pet);
  PLAY.heartFrame = dt => { for (let i = hearts.length - 1; i >= 0; i--) { const q = hearts[i]; q.t += dt; if (q.t < q.d) continue; q.h.position.y += dt * 0.6; q.h.material.opacity = Math.max(0, 1 - (q.t - q.d) / 1.6); if (q.t - q.d > 1.6) { scene.remove(q.h); hearts.splice(i, 1); } } };
})();

function playFrame(dt) {
  try { cabFrame(dt); ratFrame(dt); whaleFrame(dt); discoFrame(dt); clockFrame(); phoneFrame(dt); PLAY.heartFrame && PLAY.heartFrame(dt); if (SWC.force > 0) SWC.force -= dt; } catch (e) { if (!PLAY.err) { PLAY.err = e; console.warn('v13 play', e); } }
}
