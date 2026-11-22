/* ================================================================
   v25 THE PARADE (2026-11-21)
   Every November, and whenever anyone types PARADE, a giant parade balloon floats round the ring road: a New
   Yorker in a blue suit with an eye flower for a head (the MLow cast), arms out, waving, held down by eight
   handlers on ropes who walk with it. PARADE also throws confetti. On Thanksgiving Day in New York the balloon
   gets a toast and fireworks at dusk.
   ================================================================ */
const PARADE = { on: false, a: 0.6, force: 0, g: null, handlers: [], ropes: null, conf: null };
window.__PARADE = PARADE;
(function balloon() {
  const g = new THREE.Group(), suit = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.35, metalness: 0.05 }), skin = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.4 }), white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 18), suit); body.scale.set(1, 1.35, 0.85); g.add(body);
  const shirt = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), white); shirt.scale.set(0.8, 1.6, 0.4); shirt.position.set(0, 1.2, 2.45); g.add(shirt);
  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0xff6b00, roughness: 0.4 })); tie.rotation.x = PI; tie.position.set(0, 0.9, 2.95); g.add(tie);
  const arms = [];
  [-1, 1].forEach(s => { const sh = new THREE.Group(); sh.position.set(s * 2.9, 2.2, 0); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 4.4, 14), suit); arm.position.x = s * 2.2; arm.rotation.z = PI / 2; sh.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), skin); hand.position.x = s * 4.6; sh.add(hand); sh.rotation.z = s * 0.35; g.add(sh); arms.push(sh); });
  [-1, 1].forEach(s => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 3.6, 14), new THREE.MeshStandardMaterial({ color: 0x1d2233, roughness: 0.4 })); leg.position.set(s * 1.2, -5.2, 0); g.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })); shoe.scale.set(1, 0.6, 1.6); shoe.position.set(s * 1.2, -7.1, 0.5); g.add(shoe); });
  // the eye flower head
  const head = new THREE.Group(); head.position.y = 6.2; g.add(head);
  const petalCols = [0xff4fa0, 0xffd400, 0xff6b00, 0x08deff, 0xf2f2ee];
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; const p = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 10), new THREE.MeshStandardMaterial({ color: petalCols[i % petalCols.length], roughness: 0.4 })); p.scale.set(0.75, 1.5, 0.45); p.position.set(Math.cos(a) * 2.5, Math.sin(a) * 2.5, -0.2); p.rotation.z = a - PI / 2; head.add(p); }
  const face = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16), white); face.scale.z = 0.7; head.add(face);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40), new THREE.MeshBasicMaterial({ map: tex('assets/eye.png'), transparent: true })); eye.position.z = 1.42; head.add(eye);
  const eyeB = eye.clone(); eyeB.position.z = -1.42; eyeB.rotation.y = PI; head.add(eyeB);
  const sash = signTex([{ t: 'N3W YORKERS', s: 0.6 }], 1024, 160, '#FFFFFF', '#0D0D0D'); const sm = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 1.0, 32, 1, true), new THREE.MeshStandardMaterial({ map: sash, roughness: 0.5, side: THREE.DoubleSide })); sm.position.y = -1.6; sm.scale.set(1, 1, 0.86); sash.wrapS = THREE.RepeatWrapping; sash.repeat.x = 2; g.add(sm);
  g.visible = false; scene.add(g); PARADE.g = g; PARADE.arms = arms; PARADE.head = head;
  // handlers and ropes
  const shirts = [0xd93a2a, 0xd93a2a, 0xf0efea, 0xf0efea, 0xd93a2a, 0xd93a2a, 0xf0efea, 0xf0efea];
  for (let i = 0; i < 8; i++) { const h = person(shirts[i], 0x2a2f45, SKIN[i % SKIN.length]); h.g.visible = false; PARADE.handlers.push(h); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8 * 2 * 3), 3));
  const ropes = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xeeeeee })); ropes.frustumCulled = false; ropes.visible = false; scene.add(ropes); PARADE.ropes = ropes;
  const N = 600, cg = new THREE.BufferGeometry(), cp = new Float32Array(N * 3).fill(-999), cc = new Float32Array(N * 3); const pal = [[1, 0.31, 0.63], [1, 0.83, 0], [0.16, 0.38, 1], [1, 0.42, 0], [1, 1, 1], [0.03, 0.87, 1]];
  for (let i = 0; i < N; i++) { const c = pal[i % pal.length]; cc[i * 3] = c[0]; cc[i * 3 + 1] = c[1]; cc[i * 3 + 2] = c[2]; }
  cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  const conf = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.22, vertexColors: true })); conf.frustumCulled = false; conf.visible = false; scene.add(conf);
  PARADE.conf = { pts: conf, pos: cp, v: Array.from({ length: N }, () => [0, 0, 0, 0]) };
})();
function confetti(x, y, z, n) { const C = PARADE.conf; let k = 0; for (let i = 0; i < C.v.length && k < n; i++) { if (C.v[i][3] > 0) continue; k++; C.pos[i * 3] = x + (Math.random() - 0.5) * 6; C.pos[i * 3 + 1] = y + Math.random() * 3; C.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 6; C.v[i] = [(Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 6 + Math.random() * 3]; } C.pts.visible = true; }
secret('parade', () => { PARADE.force = 240; PARADE.a = Math.atan2(P.z, P.x) + 0.25; toast('THE N3W YORKERS PARADE IS ON THE RING ROAD. THE BALLOON IS FOUR STOREYS TALL AND HAS ONE EYE.'); confetti(P.x, P.y + 12, P.z, 400); }, ['parade', 'thanksgiving', 'balloon']);
function paradeFrame(dt) {
  const t = SKY.t, nov = t && t.mo === 11; PARADE.on = nov || PARADE.force > 0; if (PARADE.force > 0) PARADE.force -= dt;
  const vis = PARADE.on; PARADE.g.visible = vis; PARADE.ropes.visible = vis; PARADE.handlers.forEach(h => h.g.visible = vis);
  const C = PARADE.conf; let any = false; for (let i = 0; i < C.v.length; i++) { const v = C.v[i]; if (v[3] <= 0) continue; any = true; v[3] -= dt; v[1] = Math.max(-1.6, v[1] - 3 * dt); C.pos[i * 3] += (v[0] + Math.sin(LIFE.t * 3 + i) * 0.8) * dt; C.pos[i * 3 + 1] += v[1] * dt; C.pos[i * 3 + 2] += v[2] * dt; if (v[3] <= 0 || C.pos[i * 3 + 1] < 0.1) { v[3] = 0; C.pos[i * 3 + 1] = -999; } }
  C.pts.visible = any; if (any) C.pts.geometry.attributes.position.needsUpdate = true;
  if (!vis) return;
  if (t && t.mo === 11 && t.wd === 4 && t.d >= 22 && t.d <= 28 && PARADE.tday !== t.d) { PARADE.tday = t.d; toast('HAPPY THANKSGIVING FROM MEME ISLAND. THE BALLOON IS OUT ALL DAY.', 'blue'); }
  PARADE.a += dt * 0.9 / 100; const r = 100, x = Math.cos(PARADE.a) * r, z = Math.sin(PARADE.a) * r, y = 18 + Math.sin(LIFE.t * 0.4) * 1.2;
  PARADE.g.position.set(x, y, z); PARADE.g.rotation.set(Math.sin(LIFE.t * 0.5) * 0.05, -PARADE.a, Math.sin(LIFE.t * 0.33) * 0.06);
  PARADE.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.35 + Math.sin(LIFE.t * 1.3 + i) * 0.15) * (i ? 1 : -1) * -1 + (i ? 0.35 : -0.35); });
  PARADE.arms[1].rotation.z = 0.35 + Math.sin(LIFE.t * 2.2) * 0.45; PARADE.head.rotation.z = Math.sin(LIFE.t * 0.7) * 0.08;
  const rp = PARADE.ropes.geometry.attributes.position, fx = -Math.sin(PARADE.a), fz = Math.cos(PARADE.a), nx = Math.cos(PARADE.a), nz = Math.sin(PARADE.a);
  PARADE.handlers.forEach((h, i) => { const side = i % 2 ? 1 : -1, row = (i >> 1) - 1.5; const hx = x + nx * side * 5.5 + fx * row * 3.2, hz = z + nz * side * 5.5 + fz * row * 3.2;
    h.g.position.set(hx, ground(hx, hz), hz); h.g.rotation.y = Math.atan2(fx, fz); animLegs(h, LIFE.t * 0.6 + i, true);
    const ax = x + nx * side * 2.6 + fx * row * 1.2, az = z + nz * side * 2.6 + fz * row * 1.2; rp.setXYZ(i * 2, hx, ground(hx, hz) + 1.4, hz); rp.setXYZ(i * 2 + 1, ax, y - 2.5, az); });
  rp.needsUpdate = true;
}
window.__FRAMES.push(dt => { try { paradeFrame(dt); } catch (e) { if (!PARADE.err) { PARADE.err = e; console.warn('v25 parade', e); } } });
