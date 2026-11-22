/* ================================================================
   v24 ANIMALS (2026-11-21)
   A beach dog by the festoon lights who plays fetch (E throws the stick, he brings it back and wags), two more
   dogs trotting the island who chase the pigeons, squirrels that dart across the grass and freeze, and a
   stray orange cat that follows you around for a minute if you type PSPSPS (or KITTY).
   ================================================================ */
const ZOO = { dogs: [], squirrels: [], fetches: 0 };
window.__ZOO = ZOO;
function dogModel(coat, size) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.85 }), dark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), m); body.scale.set(1, 0.9, 2.0); body.position.y = 0.42; g.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.7, 0.46); g.add(head); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8), m); neck.position.set(0, 0.6, 0.36); neck.rotation.x = 0.6; g.add(neck);
  const sk = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), m); head.add(sk); const sn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.2), m); sn.position.set(0, -0.04, 0.17); head.add(sn);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), dark); nose.position.set(0, -0.0, 0.24); head.add(nose);
  [-0.07, 0.07].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), dark); e.position.set(x, 0.04, 0.12); head.add(e); const ear = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.03), dark); ear.position.set(x * 1.4, 0.06, -0.02); ear.rotation.z = x > 0 ? -0.5 : 0.5; head.add(ear); });
  const legs = []; [[-0.11, 0.25], [0.11, 0.25], [-0.11, -0.25], [0.11, -0.25]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.36, z); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.36, 6), m); l.position.y = -0.18; p.add(l); g.add(p); legs.push(p); });
  const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.38); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6), m); tl.position.y = 0.13; tail.add(tl); tail.rotation.x = -0.6; g.add(tail);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 14), new THREE.MeshStandardMaterial({ color: 0x2962ff })); collar.position.set(0, 0.55, 0.34); collar.rotation.x = 1.2; g.add(collar);
  g.scale.setScalar(size || 1); scene.add(g); return { g, legs, tail, head };
}
function trot(d, t, speed) { const s = Math.sin(t * 12) * 0.6 * Math.min(1, speed); d.legs[0].rotation.x = s; d.legs[3].rotation.x = s; d.legs[1].rotation.x = -s; d.legs[2].rotation.x = -s; d.head.rotation.x = Math.sin(t * 12) * 0.04; }

/* the fetch dog */
const FETCH = { d: null, home: [-4, 117], x: -4, z: 117, st: 'sit', stick: null, sx: 0, sz: 0, sy: 0, vx: 0, vz: 0, vy: 0 };
(function fetchDog() {
  FETCH.d = dogModel(0x8b5a2b, 1.35); FETCH.d.g.position.set(FETCH.x, ground(FETCH.x, FETCH.z), FETCH.z);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 6), MAT.wood); st.rotation.z = PI / 2; scene.add(st); FETCH.stick = st; st.position.set(FETCH.x + 0.6, ground(FETCH.x, FETCH.z) + 0.03, FETCH.z + 0.3);
})();
const fetchSecret = secret('fetch', () => { });
function throwStick() {
  if (FETCH.st !== 'sit') return; const f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize();
  FETCH.sx = P.x + f.x * 0.6; FETCH.sz = P.z + f.z * 0.6; FETCH.sy = P.y + 1.6; FETCH.vx = f.x * 9; FETCH.vz = f.z * 9; FETCH.vy = 5; FETCH.st = 'fly'; fetchSecret(); toast('YOU THREW THE STICK. HE HAS NEVER BEEN HAPPIER.'); beep(900, 0.06, 'sine', 0.04); beep(1100, 0.06, 'sine', 0.04, 0.08);
}
interact(0, 0, 0, '', () => { }); const fetchInter = INTER[INTER.length - 1];
function fetchFrame(dt) {
  const F = FETCH, D = F.d, t = LIFE.t; let speed = 0, tx = null, tz = null;
  fetchInter.x = F.x; fetchInter.z = F.z; fetchInter.r = 3.2; fetchInter.label = F.st === 'sit' ? 'E · THROW THE STICK' : ''; fetchInter.fn = throwStick;
  if (F.st === 'fly') { F.vy -= 14 * dt; F.sx += F.vx * dt; F.sz += F.vz * dt; F.sy += F.vy * dt; const gy = ground(F.sx, F.sz) + 0.03; if (Math.hypot(F.sx, F.sz) > SHORE - 1) { const r = Math.hypot(F.sx, F.sz); F.sx *= (SHORE - 1) / r; F.sz *= (SHORE - 1) / r; } if (F.sy <= gy) { F.sy = gy; F.st = 'chase'; } F.stick.position.set(F.sx, F.sy, F.sz); F.stick.rotation.y += dt * 10; tx = F.sx; tz = F.sz; }
  if (F.st === 'chase') { tx = F.sx; tz = F.sz; if (Math.hypot(F.x - tx, F.z - tz) < 0.5) F.st = 'back'; }
  if (F.st === 'back') { tx = P.x; tz = P.z; if (Math.hypot(F.x - tx, F.z - tz) < 1.3) { F.st = 'sit'; ZOO.fetches++; toast(ZOO.fetches === 1 ? 'GOOD BOY. HE BROUGHT IT BACK.' : `GOOD BOY. FETCH ${ZOO.fetches}.`); beep(600, 0.08, 'square', 0.03); beep(600, 0.08, 'square', 0.03, 0.14); } }
  if (tx !== null) { const dx = tx - F.x, dz = tz - F.z, d = Math.hypot(dx, dz); if (d > 0.05) { speed = Math.min(7.5, d * 3 + 2); F.x += dx / d * speed * dt; F.z += dz / d * speed * dt; D.g.rotation.y = Math.atan2(dx, dz); } }
  else if (Math.hypot(P.x - F.x, P.z - F.z) < 12) { const a = Math.atan2(P.x - F.x, P.z - F.z); let dd = a - D.g.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); D.g.rotation.y += dd * Math.min(1, dt * 3); }
  D.g.position.set(F.x, ground(F.x, F.z) + (speed > 0 ? Math.abs(Math.sin(t * 12)) * 0.05 : 0), F.z); trot(D, t, speed / 4);
  D.tail.rotation.z = Math.sin(t * (F.st === 'sit' ? 14 : 20)) * 0.6;
  if (F.st === 'back' || F.st === 'sit') { const h = D.head.getWorldPosition(new THREE.Vector3()); const fw = new THREE.Vector3(Math.sin(D.g.rotation.y), 0, Math.cos(D.g.rotation.y)); F.stick.position.set(h.x + fw.x * 0.28, h.y - 0.12, h.z + fw.z * 0.28); F.stick.rotation.set(0, D.g.rotation.y, PI / 2); }
}

/* two dogs out on their own, who chase pigeons */
(function wanderers() {
  [[0x2a2a2a, 0.9, 24, 84], [0xf2efe8, 1.1, -26, 60]].forEach(([c, s, x, z], i) => { const d = dogModel(c, s); d.g.position.set(x, ground(x, z), z); ZOO.dogs.push({ d, x, z, tx: x, tz: z, t: 0, ph: i * 2 }); });
})();
function wanderFrame(dt) {
  ZOO.dogs.forEach(o => { o.t -= dt; if (o.t <= 0) { o.t = 4 + Math.random() * 6; const B = LIFE.pigeons, target = B && Math.random() < 0.4 ? B[(Math.random() * B.length) | 0] : null;
      if (target && target.st === 0) { o.tx = target.x; o.tz = target.z; o.chase = true; } else { const a = Math.random() * PI * 2, r = 50 + Math.random() * 40; o.tx = Math.cos(a) * r; o.tz = Math.sin(a) * r; o.chase = false; } }
    const dx = o.tx - o.x, dz = o.tz - o.z, d = Math.hypot(dx, dz); let sp = 0; if (d > 0.4) { sp = o.chase ? 6 : 2.2; o.x += dx / d * sp * dt; o.z += dz / d * sp * dt; o.d.g.rotation.y = Math.atan2(dx, dz); }
    if (o.chase && d < 2.5 && LIFE.scare) LIFE.scare(o.x, o.z, 4);
    o.d.g.position.set(o.x, ground(o.x, o.z), o.z); trot(o.d, LIFE.t + o.ph, sp / 3); o.d.tail.rotation.z = Math.sin(LIFE.t * 10 + o.ph) * 0.5; });
}

/* squirrels */
(function squirrels() {
  const fur = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 });
  for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), fur); b.scale.set(1, 1.2, 1.5); b.position.y = 0.09; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), fur); h.position.set(0, 0.16, 0.1); g.add(h);
    const tl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), fur); tl.scale.set(0.8, 2.0, 0.8); tl.position.set(0, 0.2, -0.13); tl.rotation.x = -0.4; g.add(tl);
    const a = Math.random() * PI * 2, r = 50 + Math.random() * 40, x = Math.cos(a) * r, z = Math.sin(a) * r; g.position.set(x, ground(x, z), z); scene.add(g);
    ZOO.squirrels.push({ g, x, z, tx: x, tz: z, t: Math.random() * 3 }); }
})();
function squirrelFrame(dt) {
  ZOO.squirrels.forEach(s => { s.t -= dt; if (s.t <= 0) { s.t = 1 + Math.random() * 3; if (Math.random() < 0.5) { const a = Math.random() * PI * 2; s.tx = s.x + Math.cos(a) * (3 + Math.random() * 6); s.tz = s.z + Math.sin(a) * (3 + Math.random() * 6); const r = Math.hypot(s.tx, s.tz); if (r > 92 || r < 20) { s.tx = s.x; s.tz = s.z; } } }
    if (Math.hypot(P.x - s.x, P.z - s.z) < 3 && !s.flee) { s.flee = 1; const a = Math.atan2(s.z - P.z, s.x - P.x); s.tx = s.x + Math.cos(a) * 8; s.tz = s.z + Math.sin(a) * 8; } if (s.flee) s.flee -= dt * 0.5;
    const dx = s.tx - s.x, dz = s.tz - s.z, d = Math.hypot(dx, dz); if (d > 0.1) { const sp = s.flee > 0 ? 7 : 4; s.x += dx / d * sp * dt; s.z += dz / d * sp * dt; s.g.rotation.y = Math.atan2(dx, dz); s.g.position.y = ground(s.x, s.z) + Math.abs(Math.sin(LIFE.t * 18)) * 0.08; }
    else { s.g.position.y = ground(s.x, s.z); s.g.rotation.x = Math.sin(LIFE.t * 3 + s.t) > 0.8 ? -0.5 : 0; }
    s.g.position.x = s.x; s.g.position.z = s.z; });
}

/* PSPSPS: an orange stray who follows you for a minute */
const STRAY = { g: null, t: 0, x: 0, z: 0 };
(function stray() {
  const g = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ color: 0xe08a3a, roughness: 0.9 }), w = new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.9 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), fur); b.scale.set(0.9, 0.9, 1.9); b.position.y = 0.26; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), fur); h.position.set(0, 0.38, 0.27); g.add(h);
  [-0.05, 0.05].forEach(x => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), fur); e.position.set(x, 0.48, 0.25); g.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshBasicMaterial({ color: 0x66cc33 })); ey.position.set(x * 0.8, 0.4, 0.36); g.add(ey); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), w); m.position.set(0, 0.35, 0.34); m.scale.set(1, 0.7, 0.6); g.add(m);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 6), fur); tail.position.set(0, 0.45, -0.32); tail.rotation.x = -0.5; g.add(tail); STRAY.tail = tail;
  STRAY.legs = []; [[-0.06, 0.15], [0.06, 0.15], [-0.06, -0.15], [0.06, -0.15]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.2, z); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.2, 5), fur); l.position.y = -0.1; p.add(l); g.add(p); STRAY.legs.push(p); });
  g.visible = false; scene.add(g); STRAY.g = g;
})();
secret('pspsps', () => { const a = Math.random() * PI * 2; STRAY.x = P.x + Math.cos(a) * 9; STRAY.z = P.z + Math.sin(a) * 9; STRAY.t = 60; STRAY.g.visible = true; toast('AN ORANGE CAT APPEARS FROM NOWHERE. HE IS YOURS FOR A MINUTE. HE DID NOT AGREE TO THIS.'); }, ['pspsps', 'pspspsps', 'kitty', 'heykitty']);
function strayFrame(dt) {
  if (STRAY.t <= 0) return; STRAY.t -= dt; if (STRAY.t <= 0) { STRAY.g.visible = false; toast('THE ORANGE CAT HAS SOMEWHERE ELSE TO BE.'); return; }
  const f = new THREE.Vector3(); camera.getWorldDirection(f); const tx = P.x - f.x * 1.6 + f.z * 0.9, tz = P.z - f.z * 1.6 - f.x * 0.9; const dx = tx - STRAY.x, dz = tz - STRAY.z, d = Math.hypot(dx, dz); let sp = 0;
  if (d > 0.4) { sp = Math.min(6, d * 2); STRAY.x += dx / d * sp * dt; STRAY.z += dz / d * sp * dt; STRAY.g.rotation.y = Math.atan2(dx, dz); }
  const fl = floorAt(STRAY.x, STRAY.z, P.y + 1); STRAY.g.position.set(STRAY.x, (fl.f !== null ? fl.f : ground(STRAY.x, STRAY.z)), STRAY.z);
  const s = Math.sin(LIFE.t * 14) * 0.6 * Math.min(1, sp / 3); STRAY.legs[0].rotation.x = STRAY.legs[3].rotation.x = s; STRAY.legs[1].rotation.x = STRAY.legs[2].rotation.x = -s; STRAY.tail.rotation.z = Math.sin(LIFE.t * 2) * 0.4;
}
window.__FRAMES.push(dt => { try { fetchFrame(dt); wanderFrame(dt); squirrelFrame(dt); strayFrame(dt); } catch (e) { if (!ZOO.err) { ZOO.err = e; console.warn('v24 animals', e); } } });
