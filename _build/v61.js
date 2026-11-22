/* ================================================================
   v61 THE DOG WALKER (2026-11-22)
   A professional dog walker makes slow laps of the ring path round THE FLOOR with six dogs on six leashes: a greyhound, a corgi, a
   doodle, a pug, a husky and a little black mutt that will not stop sniffing. The leashes sag and tighten, tails go,
   somebody always stops to sniff. Walk up and E: she stops, the dogs pile round you, someone barks.
   ================================================================ */
const DOGW = { dogs: [], t: 0, stop: 0, pets: 0 };
window.__DOGW = DOGW;
const DOGW_AT = { x: 0, z: 0, r: 41 };
(function dogWalker() {
  const kinds = [ // body len, height, colour, ear, tail, name
    [0.75, 0.62, 0x9a8b78, 'fold', 'thin', 'THE GREYHOUND'], [0.5, 0.28, 0xd18a3c, 'up', 'stub', 'THE CORGI'], [0.62, 0.48, 0xd9c3a0, 'flop', 'fluff', 'THE DOODLE'],
    [0.36, 0.26, 0xcbb08a, 'fold', 'curl', 'THE PUG'], [0.66, 0.52, 0x8d9299, 'up', 'fluff', 'THE HUSKY'], [0.4, 0.3, 0x1c1a19, 'flop', 'thin', 'THE MUTT']];
  kinds.forEach(([len, h, col, ear, tail, name], i) => {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.32, h * 0.3, len, 10), m); body.rotation.z = PI / 2; body.position.y = h * 0.78; g.add(body);
    const head = new THREE.Group(); head.position.set(len * 0.55, h * 1.02, 0); g.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(h * 0.27, 12, 10), m); head.add(skull);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(h * (i === 3 ? 0.12 : 0.34), h * 0.18, h * 0.22), m); snout.position.set(h * 0.28, -h * 0.06, 0); head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(h * 0.055, 8, 6), dark); nose.position.set(h * (i === 3 ? 0.36 : 0.46), -h * 0.03, 0); head.add(nose);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(h * 0.08, h * (ear === 'up' ? 0.26 : 0.22), h * 0.14), m); e.position.set(-h * 0.04, ear === 'up' ? h * 0.27 : h * 0.06, s * h * 0.2); e.rotation.x = ear === 'up' ? s * -0.25 : s * 1.2; head.add(e);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(h * 0.035, 6, 5), dark); eye.position.set(h * 0.2, h * 0.08, s * h * 0.12); head.add(eye); });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(h * 0.22, h * 0.03, 6, 14), new THREE.MeshStandardMaterial({ color: [0x2962FF, 0xff3fa4, 0x08deff, 0xe2581c, 0x2962FF, 0xff3fa4][i], roughness: 0.5 })); collar.rotation.y = PI / 2; collar.position.set(len * 0.42, h * 0.9, 0); g.add(collar);
    const legs = [[0.35, 1], [0.35, -1], [-0.35, 1], [-0.35, -1]].map(([x, s]) => { const p = new THREE.Group(); p.position.set(x * len, h * 0.62, s * h * 0.17); const l = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.06, h * 0.05, h * 0.62, 6), m); l.position.y = -h * 0.31; p.add(l); g.add(p); return p; });
    const tl = new THREE.Group(); tl.position.set(-len * 0.5, h * 0.92, 0); g.add(tl);
    const tm = new THREE.Mesh(tail === 'stub' ? new THREE.SphereGeometry(h * 0.08, 6, 5) : new THREE.CylinderGeometry(h * (tail === 'fluff' ? 0.09 : 0.035), h * 0.02, h * (tail === 'curl' ? 0.25 : 0.55), 6), m); tm.position.y = h * 0.22; tm.rotation.z = tail === 'curl' ? 0.9 : 0; tl.add(tm); tl.rotation.z = -0.7;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
    DOGW.dogs.push({ g, head, legs, tl, h, len, name, ox: 0.9 + (i % 3) * 0.55, oz: (i - 2.5) * 0.55, x: DOGW_AT.x, z: DOGW_AT.z + DOGW_AT.r, yaw: 0, ph: Math.random() * 6, sniff: 0, wag: 1, stride: 0 });
  });
  const w = person(0x3f5c3a, 0x2a2f45, SKIN[2], 'workgirl'); DOGW.w = w;
  // the leashes: one line per dog with a sag
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(6 * 10 * 2 * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x1a1a1a })); lines.frustumCulled = false; scene.add(lines); DOGW.lines = lines;
  if (window.__MAP) MAP.places.push(['DOG WALKER', -29, 29, -28, 31]);
})();
const dogSecret = secret('dogwalker', () => { toast('SIX DOGS. TWELVE EARS. ONE OF THEM IS SITTING ON YOUR FOOT. SHE SAYS THEY LIKE YOU, WHICH THEY SAY ABOUT EVERYONE.', 'blue'); });
function dogBark(x, z) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const d = Math.hypot(x - P.x, z - P.z); if (d > 30) return;
  try { [0, 0.22].forEach(w => { const t0 = AC.currentTime + w, o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t0); o.frequency.exponentialRampToValueAtTime(260, t0 + 0.12);
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.min(0.08, 1.5 / (d + 3)), t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15); o.connect(f); f.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 0.16); }); } catch (e) { } }
function dogPet() { DOGW.stop = 9; DOGW.pets++; dogSecret(); const d = DOGW.dogs[Math.floor(Math.random() * 6)]; dogBark(d.x, d.z); if (DOGW.pets > 1) toast(d.name + ' WOULD LIKE A WORD.'); }
// the walker moves, so the E prompt is re-placed every frame
const dogInter = { x: DOGW_AT.x, z: DOGW_AT.z, r: 2.6, label: 'E · SAY HI TO THE DOGS', fn: () => dogPet() }; INTER.push(dogInter);
const _dl = new THREE.Vector3();
function dogFrame(dt) {
  const near = Math.hypot(P.x - DOGW.w.g.position.x, P.z - DOGW.w.g.position.z) < 90; DOGW.lines.visible = near; if (!near) return;
  const W = DOGW.w.g, wx = W.position.x, wz = W.position.z; const pd = Math.hypot(P.x - wx, P.z - wz);
  if (DOGW.stop > 0) DOGW.stop -= dt; else DOGW.t += dt * 1.05 / DOGW_AT.r * (pd < 1.6 ? 0.2 : 1);   // she slows when you are in her way
  const a = DOGW.t, nx = DOGW_AT.x + Math.sin(a) * DOGW_AT.r, nz = DOGW_AT.z + Math.cos(a) * DOGW_AT.r, gy = ground(nx, nz);
  const hx = Math.cos(a), hz = -Math.sin(a);   // her heading along the circle
  W.position.set(nx, gy - 0.35, nz); W.rotation.y = Math.atan2(hx, hz); dogInter.x = nx; dogInter.z = nz;
  const hand = _dl.set(nx + hx * 0.35 - hz * 0.25, gy + 0.95, nz + hz * 0.35 + hx * 0.25);
  const pos = DOGW.lines.geometry.attributes.position.array; let k = 0;
  DOGW.dogs.forEach((d, i) => {
    let tx, tz; if (DOGW.stop > 0 && pd < 6) { const aa = i / 6 * PI * 2 + LIFE.t * 0.1; tx = P.x + Math.cos(aa) * 0.8; tz = P.z + Math.sin(aa) * 0.8; } else { tx = nx + hx * d.ox - hz * d.oz; tz = nz + hz * d.ox + hx * d.oz; }
    // sniffing: stop for a moment, nose down
    d.ph += dt; if (d.sniff <= 0 && Math.random() < dt * 0.06) d.sniff = 1.5 + Math.random() * 2; if (d.sniff > 0) d.sniff -= dt;
    const want = d.sniff > 0 && DOGW.stop <= 0 ? 0.3 : 4.5; const dx = tx - d.x, dz = tz - d.z, dd = Math.hypot(dx, dz);
    const lim = 2.4, sp = Math.min(dd, dt * want * (dd > lim ? 3 : 1)); if (dd > 0.02) { d.x += dx / dd * sp; d.z += dz / dd * sp; const ty = Math.atan2(-dz, dx); let dy = Math.atan2(Math.sin(ty - d.yaw), Math.cos(ty - d.yaw)); d.yaw += dy * Math.min(1, dt * 6); }
    if (DOGW.stop > 0 && pd < 6) { const ty = Math.atan2(-(P.z - d.z), P.x - d.x); let dy = Math.atan2(Math.sin(ty - d.yaw), Math.cos(ty - d.yaw)); d.yaw += dy * Math.min(1, dt * 5); }
    const g = ground(d.x, d.z); d.stride += sp * 9 / Math.max(0.3, d.h); d.g.position.set(d.x, g, d.z); d.g.rotation.y = d.yaw;
    const sw = Math.sin(d.stride) * Math.min(1, sp / dt / 1.2) * 0.6; d.legs[0].rotation.z = sw; d.legs[3].rotation.z = sw; d.legs[1].rotation.z = -sw; d.legs[2].rotation.z = -sw;
    d.head.rotation.z = d.sniff > 0 ? -0.6 : Math.sin(d.ph * 0.7) * 0.08; d.head.rotation.y = Math.sin(d.ph * 0.4 + i) * 0.25;
    const wag = DOGW.stop > 0 ? 16 : 8; d.tl.rotation.x = Math.sin(d.ph * wag) * (DOGW.stop > 0 ? 0.7 : 0.35);
    // the leash: hand to collar, sagging when slack
    const cx = d.x + Math.cos(d.yaw) * d.len * 0.42, cz = d.z - Math.sin(d.yaw) * d.len * 0.42, cy = g + d.h * 0.9; const span = Math.hypot(cx - hand.x, cz - hand.z), sag = Math.max(0, 2.6 - span) * 0.22;
    let px = hand.x, py = hand.y, pz = hand.z; for (let s = 1; s <= 10; s++) { const u = s / 10, x = hand.x + (cx - hand.x) * u, y = hand.y + (cy - hand.y) * u - Math.sin(u * PI) * sag, z = hand.z + (cz - hand.z) * u;
      pos[k++] = px; pos[k++] = py; pos[k++] = pz; pos[k++] = x; pos[k++] = y; pos[k++] = z; px = x; py = y; pz = z; } });
  DOGW.lines.geometry.attributes.position.needsUpdate = true;
  if (DOGW.stop <= 0 && Math.random() < dt * 0.02) { const d = DOGW.dogs[Math.floor(Math.random() * 6)]; dogBark(d.x, d.z); }
}
window.__FRAMES.push(dt => { try { dogFrame(dt); } catch (e) { if (!DOGW.err) { DOGW.err = e; console.warn('v61 dogs', e); } } });
