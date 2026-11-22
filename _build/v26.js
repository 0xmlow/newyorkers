/* ================================================================
   v26 THE N3W EL (2026-11-22)
   An elevated train on a steel viaduct that rings the whole harbour 12 m up, crossing over the pier: riveted
   girders on lattice pillars, a four car silver train with an Evil Eye Blue stripe and lit windows, a rumble
   and a horn as it passes. A station stair on the pier: E to ride a full lap at the window.
   ================================================================ */
const EL = { R: 165, H: 12, a: 0, sp: 11, cars: [] };
window.__EL = EL;
(function viaduct() {
  const steel = new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: 0.55, metalness: 0.7 }), rust = new THREE.MeshStandardMaterial({ color: 0x5a4436, roughness: 0.8, metalness: 0.4 });
  const NP = 60, NS = 180, m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  // lattice pillars (two legs and a cross brace)
  const leg = new THREE.BoxGeometry(0.5, EL.H + 2, 0.5), brace = new THREE.BoxGeometry(0.18, 5.2, 0.18), cap = new THREE.BoxGeometry(5.2, 0.6, 0.8);
  const legs = new THREE.InstancedMesh(leg, steel, NP * 2), braces = new THREE.InstancedMesh(brace, rust, NP * 2), caps = new THREE.InstancedMesh(cap, steel, NP);
  for (let i = 0; i < NP; i++) { const a = i / NP * PI * 2, x = Math.cos(a) * EL.R, z = Math.sin(a) * EL.R; q.setFromAxisAngle(up, -a);
    [-1.9, 1.9].forEach((o, k) => { m.compose(new THREE.Vector3(x + Math.cos(a) * o, EL.H / 2 - 1, z + Math.sin(a) * o), q, new THREE.Vector3(1, 1, 1)); legs.setMatrixAt(i * 2 + k, m);
      const qb = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), k ? 0.62 : -0.62)); m.compose(new THREE.Vector3(x, EL.H * 0.45 + k * 2.6 - 1.2, z), qb, new THREE.Vector3(1, 1, 1)); braces.setMatrixAt(i * 2 + k, m); });
    m.compose(new THREE.Vector3(x, EL.H - 0.3, z), q, new THREE.Vector3(1, 1, 1)); caps.setMatrixAt(i, m); }
  [legs, braces, caps].forEach(o => { o.castShadow = true; o.frustumCulled = false; scene.add(o); });
  // deck girders: segments of a box, with the rails on top
  const seg = 2 * PI * EL.R / NS + 0.05, deck = new THREE.InstancedMesh(new THREE.BoxGeometry(4.6, 1.1, seg), steel, NS), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.16, seg), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3 }), NS * 2);
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.12, 0.25), MAT.wood || rust, NS * 3);
  for (let i = 0; i < NS; i++) { const a = (i + 0.5) / NS * PI * 2, x = Math.cos(a) * EL.R, z = Math.sin(a) * EL.R; q.setFromAxisAngle(up, -a); m.compose(new THREE.Vector3(x, EL.H + 0.55, z), q, new THREE.Vector3(1, 1, 1)); deck.setMatrixAt(i, m);
    [-0.72, 0.72].forEach((o, k) => { m.compose(new THREE.Vector3(x + Math.cos(a) * o, EL.H + 1.25, z + Math.sin(a) * o), q, new THREE.Vector3(1, 1, 1)); rail.setMatrixAt(i * 2 + k, m); });
    for (let k = 0; k < 3; k++) { const b = (i + k / 3) / NS * PI * 2; q.setFromAxisAngle(up, -b); m.compose(new THREE.Vector3(Math.cos(b) * EL.R, EL.H + 1.13, Math.sin(b) * EL.R), q, new THREE.Vector3(1, 1, 1)); ties.setMatrixAt(i * 3 + k, m); } }
  [deck, rail, ties].forEach(o => { o.receiveShadow = true; o.frustumCulled = false; scene.add(o); });
  // the train
  const body = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.28, metalness: 0.85 }), blue = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.4 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4 });
  const winM = new THREE.MeshBasicMaterial({ color: 0x1b2028, toneMapped: false }); EL.winM = winM;
  const sign = signTex([{ t: 'N3W', s: 0.7 }], 256, 128, '#0D0D0D', '#FFFFFF');
  for (let c = 0; c < 4; c++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.0, 14.4), body); b.position.y = 1.5; g.add(b);
    const st = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.32, 14.42), blue); st.position.y = 0.85; g.add(st);
    [-1.37, 1.37].forEach(sx => { for (let w = 0; w < 6; w++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), winM); wn.position.set(sx, 2.0, -5.6 + w * 2.24); wn.rotation.y = sx > 0 ? PI / 2 : -PI / 2; g.add(wn); } });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 14.4, 12, 1, false, 0, PI), body); roof.rotation.set(PI / 2, 0, PI / 2); roof.rotation.order = 'YXZ'; roof.scale.set(1, 1, 0.25); roof.position.y = 3.0; g.add(roof);
    [-5, 5].forEach(z => { const tr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.4), dark); tr.position.set(0, -0.1, z); g.add(tr); });
    if (c === 0) { const fr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false })); fr.position.set(0, 2.6, 7.21); g.add(fr);
      [-0.8, 0.8].forEach(x => { const hl = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8, toneMapped: false })); hl.position.set(x, 1.2, 7.21); g.add(hl); }); }
    scene.add(g); EL.cars.push(g); }
  // station stair on the pier
  const sx = 2.4, sz = 168, sg = ground(sx, sz) + 0.6, stair = new THREE.Group(); stair.position.set(sx, sg, sz); scene.add(stair);
  for (let k = 0; k < 10; k++) { const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.6), steel); s2.position.set(0, k * 1.15, -k * 0.65); stair.add(s2); }
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.5), steel); rl.position.set(0.7, 6.2, -2.9); rl.rotation.x = 0.98; stair.add(rl);
  const lab = signTex([{ t: 'N3W EL', s: 0.45 }, { t: 'UPTOWN AND DOWNTOWN ARE THE SAME TRAIN', s: 0.13 }], 1024, 384, '#0D0D0D', '#FFFFFF');
  const ls = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.82), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false, side: THREE.DoubleSide })); ls.position.set(0, 2.3, 0.4); stair.add(ls);
  const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), steel); post2.position.set(0, 1.2, 0.4); stair.add(post2);
})();
const elSecret = secret('el', () => { });
function rideEl() {
  if (RAIL.on) return; elSecret(); toast('ON THE N3W EL. ONE LAP OF THE HARBOUR. NEXT STOP: THIS STOP.'); const a0 = Math.atan2(168, 2.4), pos = [], look = [];
  for (let i = 0; i <= 36; i++) { const a = a0 + i / 36 * PI * 2, r = EL.R - 0.6; pos.push([Math.cos(a) * r, EL.H + 3.2, Math.sin(a) * r]); const b = a + 0.25; look.push([Math.cos(b) * (EL.R + 30) - Math.cos(a) * 0, EL.H + 1, Math.sin(b) * (EL.R + 30)]); }
  for (let i = 0; i < look.length; i++) { const a = a0 + i / 36 * PI * 2 + 0.1; look[i] = [Math.cos(a) * 60, 10, Math.sin(a) * 60]; }
  EL.riding = true; playRail({ pos, look, dur: 48, ease: false, done: () => { EL.riding = false; teleport(2.4, 170.5, PI); toast('THIS IS THE PIER. TRANSFER IS AVAILABLE TO THE JET SKI.', 'blue'); } });
}
interact(2.4, 169, 2.6, 'E · RIDE THE N3W EL', rideEl);
function elFrame(dt) {
  if (EL.riding && RAIL.on) { const p = camera.position; EL.a = Math.atan2(p.z, p.x) - 0.045; } else EL.a += EL.sp / EL.R * dt;
  EL.cars.forEach((g, i) => { const a = EL.a - i * 15.2 / EL.R, x = Math.cos(a) * EL.R, z = Math.sin(a) * EL.R; g.position.set(x, EL.H + 1.55, z); g.rotation.y = -a; });
  EL.winM.color.setScalar(0.12 + 1.3 * Math.min(1, (L.lamps || 0) * 1.2)); EL.winM.color.multiply(new THREE.Color(1, 0.92, 0.75));
  const lead = EL.cars[0].position, d = Math.hypot(lead.x - P.x, lead.z - P.z); EL.hornT = (EL.hornT || 0) - dt;
  if (d < 70 && EL.hornT <= 0 && !EL.riding) { EL.hornT = 25; if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { const t0 = AC.currentTime; [0, 0.5].forEach(o => { sNote(AC.destination, 311, t0 + o, 0.42, 'sawtooth', 0.03, false); sNote(AC.destination, 370, t0 + o, 0.42, 'sawtooth', 0.025, false); }); } }
}
window.__FRAMES.push(dt => { try { elFrame(dt); } catch (e) { if (!EL.err) { EL.err = e; console.warn('v26 el', e); } } });
