/* ================================================================
   v76 THE STREET SWEEPER (2026-11-22)
   After ten at night a sweeper truck crawls the ring road: a boxy white cab, an orange beacon turning on the roof,
   two round brushes spinning under the front, a mist of water ahead of them, and a dark wet stripe left behind on
   the asphalt that dries over a couple of minutes. It hums and hisses as it passes. In the day it sits parked on
   the shoulder. SWEEPER sends it round now.
   ================================================================ */
const SWEEP = { a: -0.9, on: false, trail: [], ti: 0, until: 0, t: 0 };
window.__SWEEP = SWEEP;
(function sweeper() {
  const g = new THREE.Group(); scene.add(g); SWEEP.g = g;
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.45, metalness: 0.2 }), dark = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.7 }), orange = new THREE.MeshStandardMaterial({ color: 0xe2581c, roughness: 0.5 });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 1.9), white); cab.position.set(1.4, 1.35, 0); g.add(cab);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 1.7), new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.1, metalness: 0.5, emissive: 0xffd28a, emissiveIntensity: 0 })); glass.position.set(2.21, 1.6, 0); g.add(glass); SWEEP.glass = glass;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 2.0), white); body.position.set(-0.8, 1.45, 0); g.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.18, 2.03), orange); stripe.position.set(0.25, 0.85, 0); g.add(stripe);
  const sg = signTex([{ t: 'N3W SANITATION', s: 0.3 }], 1024, 160, '#e8e6e0', '#0D0D0D'); [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.36), new THREE.MeshBasicMaterial({ map: sg })); m.position.set(-0.8, 1.6, s * 1.01); if (s < 0) m.rotation.y = PI; g.add(m); });
  [[1.4, 1], [1.4, -1], [-1.4, 1], [-1.4, -1]].forEach(([x, s]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), dark); w.rotation.x = PI / 2; w.position.set(x, 0.42, s * 0.95); g.add(w); });
  SWEEP.brushes = [-1, 1].map(s => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x2b2a28, roughness: 1 })); b.position.set(2.3, 0.08, s * 0.85); g.add(b);
    for (let k = 0; k < 10; k++) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x5a3f28 })); br.rotation.y = k * PI / 5; br.position.y = -0.06; b.add(br); } return b; });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), new THREE.MeshBasicMaterial({ color: 0xffa020, toneMapped: false })); beacon.position.set(1.4, 2.3, 0); g.add(beacon); SWEEP.beacon = beacon;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); [-0.7, 0.7].forEach(z => { const h = head.clone(); h.position.set(2.22, 0.8, z); g.add(h); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // the mist ahead of the brushes
  const mg = new THREE.BufferGeometry(), mp = new Float32Array(160 * 3).fill(-999); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  SWEEP.mist = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xdfe8ee, size: 0.08, transparent: true, opacity: 0.6, depthWrite: false })); SWEEP.mist.frustumCulled = false; scene.add(SWEEP.mist); SWEEP.md = []; for (let i = 0; i < 160; i++) SWEEP.md.push({ t: 9 });
  // the wet stripe: a ring of dark tiles laid where it has been
  const wm = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.2), wm.clone()); m.rotation.order = 'YXZ'; m.visible = false; scene.add(m); SWEEP.trail.push({ m, t: 999 }); }
})();
EGGS.sweeper = EGGS.streetsweeper = () => { SWEEP.until = SWEEP.t + 240; toast('THE SWEEPER IS COMING ROUND. MOVE YOUR CAR. ALTERNATE SIDE PARKING IS IN EFFECT.'); }; EGGS.sweeper.__s = true;
let sweepHum = null;
function sweepFrame(dt) {
  SWEEP.t += dt; const h = (SKY.t && SKY.t.h) || 12; const on = h >= 22 || h < 5 || SWEEP.until > SWEEP.t; SWEEP.on = on;
  const R = ROAD_R + 2.0; if (on) SWEEP.a += 2.2 / R * dt; const a = on ? SWEEP.a : -0.9, x = Math.sin(a) * R, z = Math.cos(a) * R, gy = ground(x, z);
  const tx = Math.cos(a), tz = -Math.sin(a); SWEEP.g.position.set(x, gy, z); SWEEP.g.rotation.set(0, Math.atan2(-tz, tx), 0);
  SWEEP.brushes.forEach((b, i) => b.rotation.y += (on ? 9 : 0) * dt * (i ? 1 : -1)); SWEEP.beacon.visible = on && Math.sin(SWEEP.t * 8) > 0; const night = Math.min(1, (L.lamps || 0) * 1.4); SWEEP.glass.material.emissiveIntensity = on ? 0.4 * night : 0;
  const d = Math.hypot(P.x - x, P.z - z);
  if (on && d < 50 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { if (!sweepHum) try { const n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; ch[i] = l * 3 + Math.sin(i / AC.sampleRate * PI * 2 * 55) * 0.15 + (Math.random() * 2 - 1) * 0.05; }
      const s = AC.createBufferSource(); s.buffer = b; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const gg = AC.createGain(); gg.gain.value = 0; s.connect(f); f.connect(gg); gg.connect(AC.destination); s.start(); sweepHum = { s, g: gg }; } catch (e) { }
    if (sweepHum) sweepHum.g.gain.value = Math.max(0, 0.07 - d * 0.0014); }
  else if (sweepHum) { try { sweepHum.s.stop(); } catch (e) { } sweepHum = null; }
  // mist and the wet trail
  const mp = SWEEP.mist.geometry.attributes.position.array; SWEEP.md.forEach((m, i) => { if (on && m.t > 0.8 && Math.random() < dt * 12) { m.t = 0; const s = (Math.random() - 0.5) * 2; m.x = x + tx * 2.6 + tz * s; m.z = z + tz * 2.6 - tx * s; m.y = gy + 0.2; m.vy = 0.5 + Math.random() * 0.6; }
    if (m.t > 0.8) { mp[i * 3 + 1] = -999; return; } m.t += dt; m.y += m.vy * dt; m.vy -= 1.5 * dt; mp[i * 3] = m.x; mp[i * 3 + 1] = m.y; mp[i * 3 + 2] = m.z; });
  SWEEP.mist.geometry.attributes.position.needsUpdate = true; SWEEP.mist.visible = on;
  if (on) { SWEEP.lay = (SWEEP.lay || 0) + dt; if (SWEEP.lay > 0.7) { SWEEP.lay = 0; const T = SWEEP.trail[SWEEP.ti]; SWEEP.ti = (SWEEP.ti + 1) % SWEEP.trail.length; T.t = 0; T.m.position.set(x - tx * 2.6, gy + 0.045, z - tz * 2.6); T.m.rotation.set(-PI / 2, Math.atan2(-tz, tx), 0); T.m.visible = true; } }
  SWEEP.trail.forEach(T => { if (T.t > 150) { T.m.visible = false; return; } T.t += dt; T.m.material.opacity = 0.55 * Math.max(0, 1 - T.t / 150); });
}
window.__FRAMES.push(dt => { try { sweepFrame(dt); } catch (e) { if (!SWEEP.err) { SWEEP.err = e; console.warn('v76 sweeper', e); } } });
