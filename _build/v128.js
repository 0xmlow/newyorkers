/* ================================================================
   v128 THE POND (2026-11-23)
   A small pond on the east lawn at (18.5, -1), the sky in it: a stone rim, reeds and cattails, lily pads going
   yellow for the season. Mallards paddle in loops trailing rings, and one mother leads five ducklings in a line;
   walk the rim and she brings them over to follow you along the edge. A grey heron stands in the shallows on
   one leg, strikes, and sometimes comes up with a fish; get too close and it lifts off on slow wings, circles,
   and comes back to the same spot. E at the rim scatters peas (not bread, the sign is very clear).
   ================================================================ */
const POND = { x: 18.5, z: -1, rx: 5.4, rz: 7.0, ducks: [], kids: [], rings: [], feed: 0, fx: 0, fz: 0, her: { st: 'stand', t: 0, a: 2.4, strike: 0 } };
window.__POND = POND;
(function pond() {
  const X = POND.x, Z = POND.z, g0 = ground(X, Z); POND.y = g0 + 0.05;
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 56), new THREE.MeshStandardMaterial({ color: 0x24403e, roughness: 0.04, metalness: 0.85, envMapIntensity: 1.3 })); water.scale.set(POND.rx, POND.rz, 1); water.rotation.x = -PI / 2; water.position.set(X, POND.y, Z); water.receiveShadow = true; scene.add(water); POND.water = water;
  const bed = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 56), new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false })); bed.scale.set(POND.rx, POND.rz, 1); bed.rotation.x = -PI / 2; bed.position.set(X, POND.y + 0.005, Z); scene.add(bed);
  const rim = (a, k) => [X + Math.cos(a) * POND.rx * k, Z + Math.sin(a) * POND.rz * k]; POND.rim = rim;
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.32, 0), new THREE.MeshStandardMaterial({ color: 0x7c7a72, roughness: 0.95 }), 90), o = new THREE.Object3D(); let n = 0;
  for (let i = 0; i < 90; i++) { const a = i / 90 * PI * 2, [x, z] = rim(a, 1.04 + (i % 3) * 0.02); o.position.set(x, g0 + 0.05, z); o.rotation.set(i * 1.3, i * 2.1, i * 0.7); const s = 0.7 + ((i * 37) % 10) / 18; o.scale.set(s, s * 0.6, s); o.updateMatrix(); rocks.setMatrixAt(n++, o.matrix); }
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
  for (let i = 0; i < 28; i++) { const a0 = i / 28 * PI * 2, a1 = (i + 1) / 28 * PI * 2, [ax, az] = rim(a0, 1.0), [bx, bz] = rim(a1, 1.0); wall(ax, az, bx, bz, -5, g0 + 0.5); }
  const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.012, 1.3, 4), new THREE.MeshStandardMaterial({ color: 0x8a8a4a, roughness: 0.9 }), 160), cat = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 }), 40); let r = 0, c = 0;
  [[0.4, 0.9], [3.3, 3.9], [5.0, 5.4]].forEach(([a0, a1]) => { for (let i = 0; i < 53; i++) { const a = a0 + Math.random() * (a1 - a0), k = 0.86 + Math.random() * 0.12, [x, z] = rim(a, k), h = 0.7 + Math.random() * 0.7; o.position.set(x, POND.y + h * 0.5, z); o.rotation.set((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25); o.scale.set(1, h / 1.3, 1); o.updateMatrix(); reed.setMatrixAt(r++, o.matrix);
    if (c < 40 && i % 4 === 0) { o.position.y = POND.y + h * 0.95; o.scale.set(1, 1, 1); o.updateMatrix(); cat.setMatrixAt(c++, o.matrix); } } });
  reed.count = r; cat.count = c; scene.add(reed); scene.add(cat); POND.reed = reed;
  const pad = new THREE.InstancedMesh(new THREE.CircleGeometry(0.26, 14, 0.35, PI * 2 - 0.7), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }), 22); const col = new THREE.Color();
  for (let i = 0; i < 22; i++) { const a = 1.2 + (i % 6) * 0.35 + Math.floor(i / 6) * 2.1, k = 0.35 + ((i * 13) % 9) / 16, [x, z] = rim(a, k); o.position.set(x, POND.y + 0.012, z); o.rotation.set(-PI / 2, 0, i * 1.7); const s = 0.7 + (i % 4) * 0.2; o.scale.set(s, s, 1); o.updateMatrix(); pad.setMatrixAt(i, o.matrix); pad.setColorAt(i, col.setHex([0x3f6a2a, 0x5a7a2a, 0x8a8a3a, 0xa08a3a][i % 4])); }
  scene.add(pad);
  // ducks
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  const duck = (male, s) => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 9), M(male ? 0x9a9488 : 0x7a5a3a)); body.scale.set(1, 0.72, 1.55); body.position.y = 0.06; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), M(male ? 0x2a2a2a : 0x6a4a2e)); tail.rotation.x = -PI / 2 - 0.5; tail.position.set(0, 0.12, -0.27); g.add(tail);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6), M(male ? 0x6a5a4a : 0x5a4028)); wing.scale.set(1.08, 0.55, 1.3); wing.position.set(0, 0.11, -0.04); g.add(wing);
    if (male) { const breast = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M(0x6a3a2a)); breast.position.set(0, 0.08, 0.17); g.add(breast); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 14), M(0xf0f0ea)); ring.rotation.x = PI / 2 - 0.4; ring.position.set(0, 0.19, 0.2); g.add(ring); }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), M(male ? 0x1a5a32 : 0x7a5a3a)); head.position.set(0, 0.26, 0.23); g.add(head);
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.09), M(male ? 0xd8b030 : 0xc87a2a)); bill.position.set(0, 0.245, 0.32); g.add(bill);
    g.scale.setScalar(s); g.traverse(q => { if (q.isMesh) q.castShadow = true; }); scene.add(g); return g; };
  for (let i = 0; i < 5; i++) { const [x, z] = rim(i * 1.3, 0.5); POND.ducks.push({ g: duck(i < 3, 1), x, z, yaw: 0, tx: x, tz: z, sp: 0.3, ph: i * 1.7, mom: i === 4 }); }
  for (let i = 0; i < 5; i++) { const d = duck(false, 0.45); d.children.forEach(q => { if (q.material) q.material = M(0xa08a4a); }); POND.kids.push({ g: d, x: POND.ducks[4].x, z: POND.ducks[4].z, yaw: 0, ph: i }); }
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 28), new THREE.MeshBasicMaterial({ color: 0xdfeef0, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -PI / 2; m.visible = false; scene.add(m); POND.rings.push({ m, t: 9 }); }
  // the heron
  const her = new THREE.Group(), grey = M(0x8e979f), pale = M(0xd8dbd6), yel = M(0xc8a43a), blk = M(0x1a1a1a); scene.add(her); POND.her.g = her;
  const hb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), grey); hb.scale.set(0.8, 0.85, 1.7); hb.position.set(0, 0.95, 0); hb.rotation.x = 0.35; her.add(hb);
  const neck = new THREE.Group(); neck.position.set(0, 1.08, 0.24); her.add(neck); POND.her.neck = neck;
  const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 8), pale); n1.position.set(0, 0.18, 0.05); n1.rotation.x = 0.35; neck.add(n1);
  const hd = new THREE.Group(); hd.position.set(0, 0.4, 0.12); neck.add(hd); hd.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), pale)); const crest = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.16, 5), blk); crest.rotation.x = -PI / 2 - 0.3; crest.position.set(0, 0.03, -0.1); hd.add(crest);
  const bl = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.2, 6), yel); bl.rotation.x = PI / 2; bl.position.set(0, -0.01, 0.14); hd.add(bl); POND.her.head = hd;
  const fish = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc8d0d8, metalness: 0.9, roughness: 0.2 })); fish.scale.set(0.6, 0.6, 2.2); fish.rotation.y = PI / 2; fish.position.set(0, -0.02, 0.2); fish.visible = false; hd.add(fish); POND.her.fish = fish;
  [-0.06, 0.06].forEach((x, i) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 5), yel); l.position.set(x, 0.42 + (i ? 0.12 : 0), 0); if (i) l.rotation.x = -0.9; her.add(l); });
  POND.her.wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.12, 1.02, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.4), grey); m.position.x = s * 0.42; w.add(m); const tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.36), blk); tip.position.x = s * 0.95; w.add(tip); w.visible = false; her.add(w); return w; });
  her.traverse(q => { if (q.isMesh) q.castShadow = true; });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'PLEASE DO NOT', s: 0.17 }, { t: 'FEED THE DUCKS BREAD', s: 0.17 }, { t: 'PEAS ARE FINE', s: 0.13 }], 512, 256, '#2f4a33', '#efe8da'), side: THREE.DoubleSide }));
  const [sx, sz] = rim(0, 1.22); sign.position.set(sx + 0.3, g0 + 1.1, sz); sign.rotation.y = PI / 2; scene.add(sign); post(sx + 0.3, sz, 0.08, -5, g0 + 1.4);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), M(0x3a3a3a)); pl.position.set(sx + 0.3, g0 + 0.5, sz); scene.add(pl);
  interact(sx + 1.2, sz, 1.8, 'E · SCATTER SOME PEAS', () => pondFeed());
  if (window.__MAP) MAP.places.push(['THE POND', X, Z, sx + 2, sz]);
})();
const duckSecret = secret('ducks', () => { toast('EVERY DUCK IN THE POND ARRIVES AT ONCE AND THEY ALL HAVE OPINIONS ABOUT PEAS. THE DUCKLINGS GET NONE AND DO NOT CARE.', 'blue'); });
const heronSecret = secret('heron', () => { toast('THE HERON STOOD STILL FOR FOUR MINUTES AND THEN TOOK A FISH IN A TENTH OF A SECOND. YOU HAVE NEVER BEEN THAT PATIENT OR THAT FAST.', 'blue'); });
function quack(d) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0 || d > 30) return; try { for (let k = 0; k < 2; k++) { const t0 = AC.currentTime + k * 0.16, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(420, t0); o.frequency.exponentialRampToValueAtTime(240, t0 + 0.12); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.min(0.06, 1 / (d + 4)), t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13); o.connect(f); f.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 0.14); } } catch (e) { } }
function pondFeed() { const a = Math.atan2((P.z - POND.z) / POND.rz, (P.x - POND.x) / POND.rx); [POND.fx, POND.fz] = POND.rim(a, 0.78); POND.feed = 14; quack(3); duckSecret(); toast('YOU SCATTER A HANDFUL OF PEAS. THE POND NOTICES.'); }
function pondRing(x, z) { const r = POND.rings.find(q => q.t > 2.5); if (!r) return; r.t = 0; r.m.position.set(x, POND.y + 0.01, z); r.m.visible = true; }
function pondInside(x, z, k) { const u = (x - POND.x) / POND.rx, v = (z - POND.z) / POND.rz, d = Math.hypot(u, v); if (d <= k) return [x, z]; return [POND.x + u / d * k * POND.rx, POND.z + v / d * k * POND.rz]; }
function pondFrame(dt) {
  const dP = Math.hypot(P.x - POND.x, P.z - POND.z); if (dP > 90) return; POND.feed = Math.max(0, POND.feed - dt);
  const pu = (P.x - POND.x) / POND.rx, pv = (P.z - POND.z) / POND.rz, pe = Math.hypot(pu, pv), onRim = pe > 0.95 && pe < 1.45;
  POND.ducks.forEach((d, i) => { let tx = d.tx, tz = d.tz, sp = 0.28;
    if (POND.feed > 0) { tx = POND.fx + Math.sin(i * 2.1) * 0.5; tz = POND.fz + Math.cos(i * 2.1) * 0.5; sp = 0.75; }
    else if (d.mom && onRim) { [tx, tz] = pondInside(P.x, P.z, 0.8); sp = 0.6; }
    else if (Math.hypot(tx - d.x, tz - d.z) < 0.3) { const a = Math.random() * PI * 2, k = Math.random() * 0.75; [d.tx, d.tz] = POND.rim(a, k); }
    const dx = tx - d.x, dz = tz - d.z, dd = Math.hypot(dx, dz); if (dd > 0.2) { const ty = Math.atan2(dx, dz); d.yaw += Math.atan2(Math.sin(ty - d.yaw), Math.cos(ty - d.yaw)) * Math.min(1, dt * 2.5); const st = Math.min(dd, sp * dt); d.x += Math.sin(d.yaw) * st; d.z += Math.cos(d.yaw) * st; }
    [d.x, d.z] = pondInside(d.x, d.z, 0.86); d.g.position.set(d.x, POND.y - 0.02 + Math.sin(LIFE.t * 2 + d.ph) * 0.008, d.z); d.g.rotation.set(0, d.yaw, Math.sin(LIFE.t * 1.3 + d.ph) * 0.04);
    if (dd > 0.2 && Math.random() < dt * (POND.feed > 0 ? 3 : 0.8)) pondRing(d.x, d.z);
    if (POND.feed > 0 && Math.random() < dt * 0.6) quack(dP); });
  let lead = POND.ducks[4]; POND.kids.forEach((k, i) => { const bx = lead.x - Math.sin(lead.yaw) * (i ? 0.2 : 0.32), bz = lead.z - Math.cos(lead.yaw) * (i ? 0.2 : 0.32), dx = bx - k.x, dz = bz - k.z, dd = Math.hypot(dx, dz);
    if (dd > 0.02) { k.yaw = Math.atan2(dx, dz); const st = Math.min(dd, Math.max(0.2, dd * 2.5) * dt); k.x += dx / dd * st; k.z += dz / dd * st; } k.g.position.set(k.x, POND.y - 0.01 + Math.sin(LIFE.t * 3 + i) * 0.006, k.z); k.g.rotation.y = k.yaw; lead = k; });
  POND.rings.forEach(r => { if (r.t > 2.5) { r.m.visible = false; return; } r.t += dt; const s = 0.15 + r.t * 0.35; r.m.scale.set(s, s, 1); r.m.material.opacity = 0.35 * (1 - r.t / 2.5); });
  // the heron
  const H = POND.her, [hx, hz] = POND.rim(H.a, 0.93), dH = Math.hypot(P.x - hx, P.z - hz); H.t += dt;
  if (H.st === 'stand') { H.g.position.set(hx, POND.y - 0.12, hz); H.g.rotation.set(0, H.a + PI, 0); H.wings.forEach(w => w.visible = false);
    H.strike -= dt; const lunge = H.strike > 0 ? Math.sin((0.6 - H.strike) / 0.6 * PI) : 0; H.neck.rotation.x = 0.2 + lunge * 1.1; H.head.rotation.x = lunge * 0.6;
    if (H.strike <= 0 && H.t > 18 + Math.random() * 12) { H.t = 0; H.strike = 0.6; H.caught = Math.random() < 0.5; pondRing(hx + Math.sin(H.a + PI) * 0.5, hz + Math.cos(H.a + PI) * 0.5); }
    H.fish.visible = H.caught && H.strike < 0.3 && H.strike > -2.2; if (H.caught && H.strike < 0 && H.strike > -dt * 1.5 && dH < 16) heronSecret();
    if (dH < 4 && !(window.__TOUR_ON)) { H.st = 'fly'; H.t = 0; } }
  else { const u = Math.min(1, H.t / 3), back = Math.max(0, (H.t - 16) / 4), ca = H.t * 0.45 + H.a, cx = POND.x + Math.cos(ca) * 12, cz = POND.z + Math.sin(ca) * 12, cy = POND.y + 8;
    const x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(hx, cx, u), hx, Math.min(1, back)), z = THREE.MathUtils.lerp(THREE.MathUtils.lerp(hz, cz, u), hz, Math.min(1, back)), y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(POND.y - 0.12, cy, u), POND.y - 0.12, Math.min(1, back));
    const vx = x - H.g.position.x, vz = z - H.g.position.z; if (Math.abs(vx) + Math.abs(vz) > 1e-4) H.g.rotation.set(0.15, Math.atan2(vx, vz), 0); H.g.position.set(x, y, z);
    H.wings.forEach((w, k) => { w.visible = true; w.rotation.z = (k ? -1 : 1) * Math.sin(H.t * 3.2) * 0.55; }); H.neck.rotation.x = -0.6;
    if (back >= 1) { if (dH > 6) { H.st = 'stand'; H.t = 0; } else H.t = 15; } }
}
window.__FRAMES.push(dt => { try { pondFrame(dt); } catch (e) { if (!POND.err) { POND.err = e; console.warn('v128 pond', e); } } });
