/* ================================================================
   v126 LADDER 420 (2026-11-23)
   Every five minutes or so a red ladder truck comes round the ring road with its siren going and its lights
   turning: eleven metres of truck, an aerial ladder laid along the top, chrome bumper, six wheels. Every car,
   the cab included, pulls to the curb and stops until it has gone by, and the siren bends as it passes you
   (a real Doppler shift from its speed toward you). Stand at the roadside as it passes and the driver gives you
   the air horn. Type SIREN to call it.
   ================================================================ */
const LADDER = { on: false, b: 0, sp: 0, run: 0, next: 70, R: 101.0, osc: null, wheels: [], lights: [], lastD: 0 };
window.__LADDER = LADDER;
(function ladderTruck() {
  const g = new THREE.Group(); g.visible = false; scene.add(g); LADDER.g = g;
  const red = new THREE.MeshStandardMaterial({ color: 0x8c0a12, roughness: 0.45, metalness: 0.05 }), chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.12, metalness: 1 }), dark = new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.08, metalness: 0.6 }), tyre = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), white = new THREE.MeshStandardMaterial({ color: 0xf0eee8, roughness: 0.5 });
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  B(2.5, 2.1, 3.0, red, 0, 1.95, 3.9); B(2.3, 0.95, 0.04, dark, 0, 2.35, 5.41); [-1, 1].forEach(s => B(0.04, 0.85, 1.7, dark, s * 1.26, 2.35, 4.2));
  B(2.5, 1.6, 8.0, red, 0, 1.65, -1.6); B(2.52, 0.14, 8.02, white, 0, 2.0, -1.6); B(2.52, 0.08, 3.02, white, 0, 1.35, 3.9);
  B(2.7, 0.28, 0.3, chrome, 0, 0.78, 5.52); B(1.9, 0.55, 0.05, chrome, 0, 1.3, 5.42); B(2.4, 0.1, 7.6, chrome, 0, 0.9, -1.6);
  [-0.55, 0.55].forEach(x => B(0.08, 0.14, 10.6, chrome, x, 2.68, -1.0)); B(1.3, 0.35, 1.3, chrome, 0, 2.6, -5.0);
  const rung = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), chrome, 30), o = new THREE.Object3D();
  for (let i = 0; i < 30; i++) { o.position.set(0, 2.68, -6.1 + i * 0.35); o.rotation.set(0, 0, PI / 2); o.updateMatrix(); rung.setMatrixAt(i, o.matrix); } g.add(rung);
  [-0.85, -0.29, 0.29, 0.85].forEach((x, i) => { const m = new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffffff : 0xff1a1a, toneMapped: false }); const l = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.26), m); l.position.set(x, 3.08, 4.6); g.add(l); LADDER.lights.push({ m, c: m.color.clone(), i }); });
  [[-1.27, -5.4], [1.27, -5.4], [-1.27, 5.2], [1.27, 5.2]].forEach(([x, z], i) => { const m = new THREE.MeshBasicMaterial({ color: 0xff1a1a, toneMapped: false }); const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.22), m); l.position.set(x, 1.3, z); g.add(l); LADDER.lights.push({ m, c: m.color.clone(), i: i + 4 }); });
  [-0.8, 0.8].forEach(x => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.16, 14), new THREE.MeshBasicMaterial({ color: 0xfff4dd, toneMapped: false })); h.position.set(x, 1.05, 5.43); g.add(h); });
  [[4.0, 1], [-3.2, 1], [-4.4, 1]].forEach(([z]) => [-1.12, 1.12].forEach(x => { const w = new THREE.Group(); w.position.set(x, 0.55, z); g.add(w); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.42, 18), tyre); t.rotation.z = PI / 2; t.castShadow = true; w.add(t); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.44, 10), chrome); hub.rotation.z = PI / 2; w.add(hub); LADDER.wheels.push(w); }));
  const st = signTex([{ t: 'LADDER 420', s: 0.56, f: 'Georgia, serif' }], 1024, 200, null, '#e8c45a');
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.78), new THREE.MeshBasicMaterial({ map: st, transparent: true })); p.position.set(s * 1.262, 1.42, -1.5); p.rotation.y = s * PI / 2; g.add(p); });
})();
const ladderSecret = secret('ladder', () => { toast('THE DRIVER LEANS ON THE AIR HORN FOR YOU. EVERY DOG ON THE ISLAND STARTS HOWLING.', 'blue'); });
function ladderStart(b) { if (LADDER.on) return; LADDER.on = true; LADDER.b = b === undefined ? Math.random() * PI * 2 : b; LADDER.run = 0; LADDER.sp = 4; LADDER.g.visible = true; LADDER.honked = false; }
EGGS.SIREN = () => { ladderStart(Math.atan2(P.x, P.z) + 0.75); toast('SOMEWHERE ON THE RING ROAD A SIREN STARTS UP.'); };
function ladderAudio(on, d, vr) {
  const can = AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0;
  if (on && can && !LADDER.osc) { try { const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o2.type = 'triangle'; f.type = 'lowpass'; f.frequency.value = 2400; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o.start(); o2.start(); LADDER.osc = { o, o2, g }; } catch (e) { } }
  if ((!on || !can) && LADDER.osc) { const s = LADDER.osc; LADDER.osc = null; try { s.g.gain.setTargetAtTime(0, AC.currentTime, 0.15); s.o.stop(AC.currentTime + 1); s.o2.stop(AC.currentTime + 1); } catch (e) { } return; }
  if (!LADDER.osc) return; const t = AC.currentTime, wail = 620 + 680 * (0.5 - 0.5 * Math.cos(LIFE.t * 2 * PI / 3.8)), dop = 343 / (343 + vr);
  LADDER.osc.o.frequency.setTargetAtTime(wail * dop, t, 0.03); LADDER.osc.o2.frequency.setTargetAtTime(wail * dop * 1.498, t, 0.03); LADDER.osc.g.gain.setTargetAtTime(Math.min(0.05, 2.6 / (d + 12)), t, 0.05);
}
function ladderHorn() { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; try { [174, 220, 261].forEach(f => { const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime; o.type = 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.04); g.gain.setValueAtTime(0.04, t0 + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 1.35); }); } catch (e) { } }
function ladderFrame(dt) {
  if (!LADDER.on) { LADDER.next -= dt; if (LADDER.next <= 0) { LADDER.next = 260 + Math.random() * 140; ladderStart(); } }
  // everybody pulls over within 45 m of the truck, and comes back out once it has passed
  const near = c => LADDER.on && Math.abs(Math.atan2(Math.sin(c - LADDER.b), Math.cos(c - LADDER.b))) * LADDER.R < 45;
  try { TRAF.c.forEach(c => { if (c.garb) return; if (c.max0 === undefined) { c.max0 = c.max; c.R0 = c.R; } const k = near(c.b) ? 1 : 0; c.pull = (c.pull || 0) + (k - (c.pull || 0)) * Math.min(1, dt * 1.5); c.R = c.R0 + c.pull * (c.inner ? -0.9 : 1.3); c.max = c.pull > 0.15 ? 0 : c.max0; }); } catch (e) { }
  try { if (!CAB.ride) { const k = near(Math.atan2(CAB.g.position.x, CAB.g.position.z)) ? 1 : 0; LADDER.cabPull = (LADDER.cabPull || 0) + (k - (LADDER.cabPull || 0)) * Math.min(1, dt * 1.5); CAB.r = 101.6 + LADDER.cabPull * 1.4; } } catch (e) { }
  if (!LADDER.on) { ladderAudio(false); return; }
  LADDER.sp += (15 - LADDER.sp) * Math.min(1, dt * 0.6); const db = LADDER.sp / LADDER.R * dt; LADDER.b -= db; LADDER.run += db;
  const b = LADDER.b, x = Math.sin(b) * LADDER.R, z = Math.cos(b) * LADDER.R; LADDER.g.position.set(x, ground(x, z) + 0.02, z); LADDER.g.rotation.y = Math.atan2(-Math.cos(b), Math.sin(b));
  LADDER.wheels.forEach(w => w.rotation.x += LADDER.sp / 0.55 * dt);
  const ph = LIFE.t * 5; LADDER.lights.forEach(l => { const on = Math.sin(ph + l.i * 1.7) > 0.1; l.m.color.copy(l.c).multiplyScalar(on ? 3.2 : 0.12); });
  const d = Math.hypot(P.x - x, P.z - z), vr = dt > 0 ? (d - (LADDER.lastD || d)) / dt : 0; LADDER.lastD = d; ladderAudio(true, d, Math.max(-60, Math.min(60, vr)));
  if (d < 8 && !LADDER.honked) { LADDER.honked = true; ladderHorn(); ladderSecret(); }
  if (LADDER.run > PI * 2 + 0.3) { LADDER.on = false; LADDER.g.visible = false; LADDER.lastD = 0; }
}
window.__FRAMES.push(dt => { try { ladderFrame(dt); } catch (e) { if (!LADDER.err) { LADDER.err = e; console.warn('v126 ladder', e); } } });
