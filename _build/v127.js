/* ================================================================
   v127 NEW YORK'S STRONGEST (2026-11-23)
   From seven in the evening black bags pile up at the curb all round the ring road. At five in the morning the
   sanitation truck comes for them, slowly, in the outer lane: two crew on the back steps hop down at every
   pile, sling the bags into the hopper one by one, the packer blade groans, and they ride on to the next. It is
   a real car in the traffic, so everything behind it queues, exactly as it does on every street in the city.
   It works until eight. Be there for a pickup and it counts. Type GARBAGE to send it round now.
   ================================================================ */
const GARB = { piles: [], entry: null, cur: -1, st: 0, force: 0, crew: [] };
window.__GARB = GARB;
(function sanitation() {
  const g = new THREE.Group(); g.visible = false; scene.add(g); GARB.g = g;
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.45, metalness: 0.15 }), green = new THREE.MeshStandardMaterial({ color: 0x1f5a36, roughness: 0.5 }), steel = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.35, metalness: 0.8 }), dark = new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.1, metalness: 0.5 }), tyre = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  B(2.4, 2.1, 2.2, white, 0, 1.85, 3.3); B(2.2, 0.9, 0.04, dark, 0, 2.3, 4.41); [-1, 1].forEach(s => B(0.04, 0.8, 1.2, dark, s * 1.21, 2.3, 3.5));
  B(2.45, 2.6, 5.4, white, 0, 2.05, -0.6); B(2.47, 0.35, 5.42, green, 0, 1.0, -0.6); B(2.42, 1.9, 1.5, steel, 0, 1.55, -4.0);
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 })); mouth.position.set(0, 1.25, -4.76); mouth.rotation.y = PI; g.add(mouth);
  B(2.6, 0.08, 0.45, steel, 0, 0.55, -4.95); B(2.6, 0.25, 0.25, steel, 0, 0.75, 4.4);
  [[3.0], [-2.4], [-3.4]].forEach(([z]) => [-1.08, 1.08].forEach(x => { const w = new THREE.Group(); w.position.set(x, 0.5, z); g.add(w); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), tyre); t.rotation.z = PI / 2; w.add(t); (GARB.wheels = GARB.wheels || []).push(w); }));
  [-0.75, 0.75].forEach(x => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.13, 12), new THREE.MeshBasicMaterial({ color: 0xfff1d0, toneMapped: false })); h.position.set(x, 1.0, 4.42); g.add(h); });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffa21a, toneMapped: false }); GARB.amber = amber; [-0.8, 0.8].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), amber); l.position.set(x, 3.42, -0.2); g.add(l); });
  const st = signTex([{ t: "NEW YORK'S STRONGEST", s: 0.3 }], 1024, 160, null, '#1f5a36');
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.72), new THREE.MeshBasicMaterial({ map: st, transparent: true })); p.position.set(s * 1.235, 2.55, -0.6); p.rotation.y = s * PI / 2; g.add(p); });
  [-1, 1].forEach((s, i) => { const p = person(0x2f6a3a, 0x1f2a22, SKIN[i ? 1 : 5], i ? 'cabbie' : 'wiseguy'); scene.remove(p.g); p.g.scale.setScalar(0.95); g.add(p.g); const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.245, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xd8f02a, roughness: 0.6, emissive: 0x2a3000 })); vest.position.y = 1.3; p.g.add(vest); GARB.crew.push({ P: p, s, ride: new THREE.Vector3(s * 0.95, 0.55 - 0.35, -5.0) }); });
  GARB.entry = { h: { root: g }, inner: false, b: 2.2, dir: -1, sp: 0, max: 3.2, R: 101.7, garb: true };
  // the piles: black bags and the odd white one, on the outer sidewalk
  const bagG = new THREE.SphereGeometry(0.32, 10, 8), bagM = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.25, metalness: 0.1 }), bagW = new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: 0.5 });
  for (let k = 0; k < 9; k++) { const b = k / 9 * PI * 2 + 0.35, R = 105.1, x = Math.sin(b) * R, z = Math.cos(b) * R; const f = floorAt(x, z, 3); if (f.f === null || f.f < 0.2) continue; const gy = ground(x, z);
    const bags = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(bagG, i === 3 ? bagW : bagM); const tx = (Math.random() - 0.5) * 1.6, tz = (Math.random() - 0.5) * 0.7, rx = x + Math.cos(b) * tx + Math.sin(b) * tz, rz = z - Math.sin(b) * tx + Math.cos(b) * tz;
      m.scale.set(1 + Math.random() * 0.25, 0.85 + Math.random() * 0.3, 1); m.position.set(rx, gy + 0.27 + (i > 4 ? 0.35 : 0), rz); m.rotation.set(Math.random(), Math.random() * 6, Math.random() * 0.4); m.castShadow = true; scene.add(m); bags.push({ m, home: m.position.clone() }); }
    GARB.piles.push({ b, x, z, bags, full: true, done: false }); }
})();
const garbSecret = secret('garbage', () => { toast('FIVE IN THE MORNING. THE TRUCK WOKE THE WHOLE BLOCK, YOU INCLUDED. THE CREW WAVES. YOU WAVE BACK, FURIOUS AND GRATEFUL.', 'blue'); });
EGGS.GARBAGE = () => { GARB.force = 240; GARB.piles.forEach(p => { p.full = true; p.done = false; }); GARB.entry.b = Math.atan2(P.x, P.z) + 0.35; toast('YOU HEAR A PACKER BLADE GROAN SOMEWHERE ON THE RING ROAD.'); };
function garbPacker(d) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0 || d > 60) return; try { const len = 1.6, n = AC.sampleRate * len, buf = AC.createBuffer(1, n, AC.sampleRate), a = buf.getChannelData(0); for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.sin(PI * i / n);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), o = AC.createOscillator(), og = AC.createGain(), t0 = AC.currentTime; s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 260; g.gain.value = Math.min(0.25, 6 / (d + 6)); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t0);
  o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t0); o.frequency.linearRampToValueAtTime(110, t0 + 1.4); og.gain.setValueAtTime(Math.min(0.03, 0.8 / (d + 6)), t0); og.gain.linearRampToValueAtTime(0.0001, t0 + 1.6); o.connect(og); og.connect(AC.destination); o.start(t0); o.stop(t0 + 1.6); } catch (e) { } }
const _gbw = new THREE.Vector3();
function garbFrame(dt) {
  const t = nycTime(TIME.utc), h = t.hours; GARB.force = Math.max(0, GARB.force - dt);
  if (h >= 19 || h < 4.9) GARB.piles.forEach(p => { if (p.done) { p.done = false; p.full = true; p.bags.forEach(q => { q.m.visible = true; q.m.position.copy(q.home); }); } });
  if (h >= 8 && h < 19 && !GARB.force) GARB.piles.forEach(p => { if (p.full) { p.full = false; p.done = true; p.bags.forEach(q => q.m.visible = false); } });
  const active = GARB.force > 0 || (h >= 5 && h < 8); const inList = TRAF.c.indexOf(GARB.entry) >= 0;
  if (active && !inList) { TRAF.c.push(GARB.entry); GARB.g.visible = true; } if (!active && inList) { TRAF.c.splice(TRAF.c.indexOf(GARB.entry), 1); GARB.g.visible = false; GARB.cur = -1; GARB.entry.max = 3.2; }
  if (!active) return; const e = GARB.entry; GARB.wheels.forEach(w => w.rotation.x += e.sp / 0.5 * dt); GARB.amber.color.setHex(Math.sin(LIFE.t * 6) > 0 ? 0xffa21a : 0x3a2000);
  if (GARB.cur < 0) { GARB.piles.forEach((p, i) => { if (!p.full || GARB.cur >= 0) return; const ahead = angAhead(e.b, p.b, -1) * e.R; if (ahead > 0 && ahead < 3) { GARB.cur = i; GARB.st = 0; e.max = 0; } }); }
  const p = GARB.cur >= 0 ? GARB.piles[GARB.cur] : null;
  GARB.crew.forEach((c, k) => { const pg = c.P.g; if (!p || GARB.st < 1) { pg.position.copy(c.ride); pg.rotation.y = c.s * PI / 2 + PI; animLegs(c.P, LIFE.t, false); return; }
    const local = GARB.g.worldToLocal(_gbw.set(p.x, 0, p.z)); const tx = Math.max(-2.2, Math.min(2.2, local.x)) * 0.6 + c.s * 0.7, tz = -5.6; pg.position.set(tx, -0.35, tz); pg.rotation.y = Math.atan2(local.x - tx, local.z - tz); animLegs(c.P, LIFE.t + k, true); c.P.arms[1].rotation.x = -1.2 - Math.sin(LIFE.t * 6 + k) * 0.8; });
  if (!p) return; GARB.st += dt; const hop = GARB.g.localToWorld(_gbw.set(0, 1.6, -4.6)).clone();
  p.bags.forEach((q, i) => { const t0 = 1.2 + i * 0.55, u = (GARB.st - t0) / 0.6; if (u <= 0) return; if (u >= 1) { q.m.visible = false; return; } q.m.position.lerpVectors(q.home, hop, u); q.m.position.y += Math.sin(u * PI) * 1.4; q.m.rotation.x += dt * 8; });
  const endT = 1.2 + p.bags.length * 0.55 + 0.8; if (Math.hypot(P.x - p.x, P.z - p.z) < 12 && GARB.st > 2) garbSecret();
  if (GARB.st > endT && !p.packed) { p.packed = true; garbPacker(Math.hypot(P.x - p.x, P.z - p.z)); }
  if (GARB.st > endT + 1.8) { p.full = false; p.done = true; p.packed = false; GARB.cur = -1; e.max = 3.2; }
}
window.__FRAMES.push(dt => { try { garbFrame(dt); } catch (e) { if (!GARB.err) { GARB.err = e; console.warn('v127 garbage', e); } } });
