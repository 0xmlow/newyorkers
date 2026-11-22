/* ================================================================
   v12 THE ISLAND MOVES (2026-11-21)
   Pigeons that scatter when you walk at them and come back, gulls over the harbour, Con Ed steam stacks,
   a jet with a contrail, a harbour helicopter, fireflies after dark, newspapers on the wind, and fireworks
   over the harbour at night. LIFE.fireworks(n, colours) is the hook the eggs use.
   Everything is instanced or one Points cloud per system: about a dozen draw calls in all.
   ================================================================ */
const LIFE = { t: 0, bursts: [], nextBurst: 4, show: 0 };
window.__LIFE = LIFE;
function lifeSoftTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const t = new THREE.CanvasTexture(cv); return t;
}
LIFE.soft = lifeSoftTex();
function lifePoints(n, size, opts) {
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos[i * 3 + 1] = -999;
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial(Object.assign({ size, map: LIFE.soft, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }, opts || {}));
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return p;
}

function lifeMerge(list) { const pa = [], na = []; list.forEach(g => { g = g.index ? g.toNonIndexed() : g; pa.push(...g.attributes.position.array); na.push(...g.attributes.normal.array); });
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(na, 3)); return o; }
/* ---------- pigeons: on the Floor plaza, the Census Walk and GM Beach ---------- */
(function pigeons() {
  const body = new THREE.SphereGeometry(0.13, 8, 6); body.scale(1, 0.85, 1.6);
  const head = new THREE.SphereGeometry(0.075, 8, 6); head.translate(0, 0.09, 0.17);
  const tail = new THREE.BoxGeometry(0.1, 0.02, 0.14); tail.translate(0, 0.01, -0.22);
  const geo = lifeMerge([body, head, tail]);
  const wingG = new THREE.PlaneGeometry(0.34, 0.16); wingG.translate(0.17, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.8 });
  const wmat = new THREE.MeshStandardMaterial({ color: 0x6f7480, roughness: 0.85, side: THREE.DoubleSide });
  const spots = [[0, 124, 8], [-9, 64, 4], [-24, 84, 6], [24, 84, 6], [-12, 140, 5]];
  const N = 44, im = new THREE.InstancedMesh(geo, mat, N), wl = new THREE.InstancedMesh(wingG, wmat, N), wr = new THREE.InstancedMesh(wingG, wmat, N);
  [im, wl, wr].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = false; scene.add(m); });
  const B = []; for (let i = 0; i < N; i++) { const s = spots[i % spots.length]; const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * s[2];
    const x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r; B.push({ x, z, y: ground(x, z), home: s, yaw: Math.random() * 6.3, st: 0, t: Math.random() * 3, vx: 0, vz: 0, vy: 0, ph: Math.random() * 9 }); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), Pp = new THREE.Vector3();
  LIFE.pigeons = B;
  LIFE.scare = (x, z, r) => B.forEach(b => { if (b.st === 0 && Math.hypot(b.x - x, b.z - z) < r) { b.st = 1; b.t = 0; const a = Math.atan2(b.z - z, b.x - x) + (Math.random() - 0.5); b.vx = Math.cos(a) * 5; b.vz = Math.sin(a) * 5; b.vy = 4 + Math.random() * 2; } });
  LIFE.feed = (x, z) => B.forEach((b, i) => { if (i % 2 === 0) { b.st = 3; b.tx = x + (Math.random() - 0.5) * 2.4; b.tz = z + (Math.random() - 0.5) * 2.4; b.t = 0; } });
  LIFE.pigeonFrame = dt => {
    const px = P.x, pz = P.z;
    B.forEach((b, i) => {
      b.t += dt; let flap = 0, bob = 0;
      if (b.st === 0) { // pecking about
        if (Math.hypot(b.x - px, b.z - pz) < 3.2) LIFE.scare(px, pz, 5);
        if (b.t > 2 + (i % 5)) { b.t = 0; b.yaw += (Math.random() - 0.5) * 2; }
        const walk = (b.t % 3) < 1.2 ? 0.35 : 0; b.x += Math.sin(b.yaw) * walk * dt; b.z += Math.cos(b.yaw) * walk * dt;
        if (Math.hypot(b.x - b.home[0], b.z - b.home[1]) > b.home[2]) b.yaw = Math.atan2(b.home[0] - b.x, b.home[1] - b.z);
        bob = Math.max(0, Math.sin(LIFE.t * 7 + b.ph)) * 0.05; b.y = ground(b.x, b.z);
      } else if (b.st === 1) { // up and away
        flap = 1; b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; b.vy *= 0.985; b.yaw = Math.atan2(b.vx, b.vz);
        const a = Math.atan2(b.vz, b.vx) + dt * 0.6; const sp = Math.hypot(b.vx, b.vz); b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp;
        if (b.t > 4 + (i % 4)) { b.st = 2; b.t = 0; const a2 = Math.random() * 6.283, r2 = Math.sqrt(Math.random()) * b.home[2]; b.tx = b.home[0] + Math.cos(a2) * r2; b.tz = b.home[1] + Math.sin(a2) * r2; }
      } else { // gliding back in (2) or coming for crumbs (3)
        flap = 0.6; const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz), gy = ground(b.tx, b.tz);
        const sp = Math.min(6, d * 0.9 + 1); if (d > 0.05) { b.x += dx / d * sp * dt; b.z += dz / d * sp * dt; b.yaw = Math.atan2(dx, dz); }
        b.y += (gy + Math.min(d * 0.35, 8) - b.y) * Math.min(1, dt * 2.5);
        if (d < 0.2) { if (b.st === 3) b.home = [b.tx, b.tz, 2.4]; b.st = 0; b.t = 0; b.y = gy; }
      }
      E.set(b.st === 0 ? -bob * 4 : 0, b.yaw, 0); Q.setFromEuler(E); Pp.set(b.x, b.y + 0.11 + (b.st === 0 ? 0 : 0), b.z);
      M.compose(Pp, Q, S); im.setMatrixAt(i, M);
      const fl = flap ? Math.sin(LIFE.t * 26 + b.ph) * 0.9 * flap : -1.35;
      [wl, wr].forEach((w, k) => { const sgn = k ? -1 : 1; const e2 = new THREE.Euler(0, b.yaw, 0); const q2 = new THREE.Quaternion().setFromEuler(e2);
        const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), sgn * fl); q2.multiply(q3); if (k) q2.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
        M.compose(new THREE.Vector3(b.x, b.y + 0.15, b.z), q2, S); w.setMatrixAt(i, M); });
    });
    im.instanceMatrix.needsUpdate = wl.instanceMatrix.needsUpdate = wr.instanceMatrix.needsUpdate = true;
  };
})();

/* ---------- gulls over the harbour and the pier ---------- */
(function gulls() {
  const g = new THREE.BufferGeometry(); // a shallow W of four triangles, wingtip to wingtip
  const v = [0, 0, 0.25, -0.55, 0.05, 0, 0, 0, -0.2, 0, 0, 0.25, 0.55, 0.05, 0, 0, 0, -0.2, -0.55, 0.05, 0, -1.0, -0.08, -0.1, -0.5, 0.05, -0.12, 0.55, 0.05, 0, 1.0, -0.08, -0.1, 0.5, 0.05, -0.12];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  const N = 14, im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.7, side: THREE.DoubleSide }), N);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; scene.add(im);
  const G = []; for (let i = 0; i < N; i++) G.push({ cx: (i % 3 - 1) * 60 + 10, cz: 170 + (i % 4) * 30, r: 14 + (i * 7) % 20, h: 14 + (i * 5) % 16, sp: (0.18 + (i % 5) * 0.03) * (i % 2 ? 1 : -1), ph: i * 1.7 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1.3, 1.3, 1.3), Pp = new THREE.Vector3();
  LIFE.gullFrame = () => G.forEach((q, i) => {
    const a = LIFE.t * q.sp + q.ph; Pp.set(q.cx + Math.cos(a) * q.r, q.h + Math.sin(LIFE.t * 0.4 + q.ph) * 2, q.cz + Math.sin(a) * q.r);
    const yaw = Math.atan2(-Math.sin(a) * Math.sign(q.sp), Math.cos(a) * Math.sign(q.sp));
    E.set(0, yaw, -0.35 * Math.sign(q.sp)); Q.setFromEuler(E); const f = 1 + Math.sin(LIFE.t * 5 + q.ph) * 0.35 * (Math.sin(LIFE.t * 0.7 + q.ph) > 0.3 ? 1 : 0.15);
    S.set(1.3, 1.3 * f, 1.3); M.compose(Pp, Q, S); im.setMatrixAt(i, M);
  });
  LIFE.gullMesh = im;
})();

/* ---------- Con Ed steam: orange and white stacks on the streets, and the plume ---------- */
(function steam() {
  const vents = [30, 75, 140, 215, 320].map(a => [Math.cos(a * Math.PI / 180) * 100.5, Math.sin(a * Math.PI / 180) * 100.5]);
  const stripe = (() => { const cv = document.createElement('canvas'); cv.width = 16; cv.height = 64; const c = cv.getContext('2d'); if (c) for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f4f2ee' : '#f26b1d'; c.fillRect(0, i * 8, 16, 8); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; return t; })();
  const smat = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 }), cap = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
  vents.forEach(([x, z]) => { const y = ground(x, z); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.9, 16, 1, true), smat); st.position.set(x, y + 0.95, z); scene.add(st);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 6, 16), cap); lip.rotation.x = Math.PI / 2; lip.position.set(x, y + 1.9, z); scene.add(lip);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 18), cap); base.position.set(x, y + 0.03, z); scene.add(base);
    if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.42, y0: y - 1, y1: y + 2, on: true }); });
  const PER = 40, N = vents.length * PER, pts = lifePoints(N, 3.4, { opacity: 0.8 });
  const pos = pts.geometry.attributes.position.array, col = pts.geometry.attributes.color.array, A = [];
  for (let i = 0; i < N; i++) A.push({ v: (i / PER) | 0, age: Math.random() * 4, life: 3.5 + Math.random() * 1.5 });
  LIFE.steamFrame = dt => {
    const w = 0.5 + Math.min(1.5, Math.abs((typeof NAT !== 'undefined' && NAT.wind && +NAT.wind.value) || 0.6));
    A.forEach((a, i) => { a.age += dt; if (a.age > a.life) a.age = 0; const [x, z] = vents[a.v], k = a.age / a.life, y = ground(x, z) + 1.95;
      pos[i * 3] = x + k * k * 3.2 * w + Math.sin(i + LIFE.t) * 0.15 * k; pos[i * 3 + 1] = y + k * 4.2; pos[i * 3 + 2] = z + k * 1.2 * w;
      const c = (1 - k) * 0.95 * (0.55 + 0.45 * Math.min(1, k * 8)); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c; });
    pts.geometry.attributes.position.needsUpdate = pts.geometry.attributes.color.needsUpdate = true;
    pts.material.size = 3.2 + 0.5 * Math.sin(LIFE.t);
  };
})();

/* ---------- a jet with a contrail, and the harbour helicopter ---------- */
(function sky() {
  const jet = new THREE.Group(); const jm = new THREE.MeshStandardMaterial({ color: 0xe9ecf0, roughness: 0.4, metalness: 0.3 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 9, 10), jm); fus.rotation.x = Math.PI / 2; jet.add(fus);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 1.6), jm); jet.add(wing); const tl = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.9), jm); tl.position.z = -4; jet.add(tl);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.2), jm); fin.position.set(0, 0.9, -4); jet.add(fin); scene.add(jet);
  const trail = lifePoints(160, 9, { opacity: 0.6, sizeAttenuation: true, fog: false }); const tp = trail.geometry.attributes.position.array, tc = trail.geometry.attributes.color.array; let ti = 0, tt = 0;
  const heli = new THREE.Group(); const hm = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, roughness: 0.45, metalness: 0.2 });
  const cab = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), hm); cab.scale.set(1, 0.9, 1.5); heli.add(cab);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 4.2, 8), hm); boom.rotation.x = Math.PI / 2; boom.position.z = -2.8; heli.add(boom);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.04, 0.25), new THREE.MeshStandardMaterial({ color: 0x222222 })); rotor.position.y = 1.05; heli.add(rotor);
  const rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; heli.add(rotor2);
  const blink = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); blink.position.set(0, -0.9, 0); heli.add(blink);
  [-0.6, 0.6].forEach(x => { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.6), new THREE.MeshStandardMaterial({ color: 0x333333 })); sk.position.set(x, -1.05, 0); heli.add(sk); });
  scene.add(heli);
  LIFE.skyFrame = dt => {
    const per = 70, k = (LIFE.t % per) / per, x = -700 + k * 1400, z = -120 + k * 300, y = 210;
    jet.position.set(x, y, z); jet.lookAt(x + 1400, y, z + 300); jet.visible = k < 0.98;
    tt += dt; if (tt > 0.12) { tt = 0; tp[ti * 3] = x - 3; tp[ti * 3 + 1] = y; tp[ti * 3 + 2] = z; ti = (ti + 1) % 160; }
    for (let i = 0; i < 160; i++) { const age = ((ti - i + 160) % 160) / 160; const c = (1 - age) * 0.9; tc[i * 3] = tc[i * 3 + 1] = tc[i * 3 + 2] = c; }
    trail.geometry.attributes.position.needsUpdate = trail.geometry.attributes.color.needsUpdate = true;
    const a = LIFE.t * 0.05; heli.position.set(Math.cos(a) * 170, 55 + Math.sin(LIFE.t * 0.3) * 4, 120 + Math.sin(a) * 170);
    heli.rotation.set(0.08, -a + Math.PI, 0.12); rotor.rotation.y += dt * 40; rotor2.rotation.y = rotor.rotation.y + Math.PI / 2; blink.visible = (LIFE.t % 1.2) < 0.15;
  };
})();

/* ---------- fireflies at night in the gardens ---------- */
(function fireflies() {
  const N = 90, pts = lifePoints(N, 0.55, { blending: THREE.AdditiveBlending, opacity: 1, toneMapped: false });
  const pos = pts.geometry.attributes.position.array, col = pts.geometry.attributes.color.array, F = [];
  const beds = [[-44, 43, 14], [-30, 152, 10], [44, 30, 14], [-9, 64, 8], [30, -60, 12]];
  for (let i = 0; i < N; i++) { const b = beds[i % beds.length]; F.push({ b, a: Math.random() * 6.3, r: Math.random() * b[2], h: 0.4 + Math.random() * 1.8, ph: Math.random() * 9, s: 0.2 + Math.random() * 0.3 }); }
  LIFE.flyFrame = () => { const night = L.lamps || 0; pts.visible = night > 0.2;
    if (!pts.visible) return;
    F.forEach((f, i) => { f.a += 0.003 + f.s * 0.004; const x = f.b[0] + Math.cos(f.a) * f.r + Math.sin(LIFE.t * f.s + f.ph) * 0.8, z = f.b[1] + Math.sin(f.a * 1.3) * f.r;
      pos[i * 3] = x; pos[i * 3 + 1] = ground(x, z) + f.h + Math.sin(LIFE.t * 1.1 + f.ph) * 0.3; pos[i * 3 + 2] = z;
      const on = Math.max(0, Math.sin(LIFE.t * (1.4 + f.s) + f.ph)) ** 3 * night; col[i * 3] = 0.9 * on; col[i * 3 + 1] = 1.0 * on; col[i * 3 + 2] = 0.35 * on; });
    pts.geometry.attributes.position.needsUpdate = pts.geometry.attributes.color.needsUpdate = true; };
})();

/* ---------- newspapers on the wind across the Floor ---------- */
(function papers() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const c = cv.getContext('2d');
  if (c && c.fillText) { c.fillStyle = '#ece6d8'; c.fillRect(0, 0, 128, 96); c.fillStyle = '#1a1a1a'; c.font = '400 15px Anton,Impact,sans-serif'; c.fillText('N3W YORK POST', 8, 18); c.fillRect(8, 24, 112, 2);
    c.font = '400 22px Anton,Impact,sans-serif'; c.fillText('FLOOR UP 3%', 8, 50); c.fillStyle = '#777'; for (let i = 0; i < 5; i++) c.fillRect(8, 60 + i * 6, 50 + (i * 13) % 50, 3); c.fillRect(70, 58, 50, 30); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const N = 7, geo = new THREE.PlaneGeometry(0.62, 0.46, 3, 1), m = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 });
  const im = new THREE.InstancedMesh(geo, m, N); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; scene.add(im);
  const Pp = []; for (let i = 0; i < N; i++) Pp.push({ a: i * 0.9, r: 99 + (i % 3) * 1.4, s: 1.4 + (i % 3) * 0.5, ph: i * 2.1 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
  LIFE.paperFrame = dt => { const w = 0.5 + Math.min(1.5, Math.abs((typeof NAT !== 'undefined' && NAT.wind && +NAT.wind.value) || 0.6));
    Pp.forEach((p, i) => { const gust = 0.5 + Math.max(0, Math.sin(LIFE.t * 0.5 + p.ph)) * 1.6; p.a += p.s * w * gust * dt / p.r; const rr = p.r + Math.sin(LIFE.t * 0.3 + p.ph) * 1.2;
      p.x = Math.cos(p.a) * rr; p.z = Math.sin(p.a) * rr;
      const lift = Math.max(0, Math.sin(LIFE.t * 1.3 + p.ph)) * 1.2 * gust; V.set(p.x, ground(p.x, p.z) + 0.05 + lift, p.z);
      E.set(-Math.PI / 2 + Math.sin(LIFE.t * 4 + p.ph) * lift * 1.2, LIFE.t * 0.7 + p.ph, Math.sin(LIFE.t * 3 + p.ph) * lift); Q.setFromEuler(E); M.compose(V, Q, S); im.setMatrixAt(i, M); });
    im.instanceMatrix.needsUpdate = true; };
})();

/* ---------- fireworks: the island's own FW system (vault, holidays) now also fires after dark every so often ---------- */
LIFE.fireworks = n => { if (typeof FW !== 'undefined') FW.show = Math.max(FW.show, n || 8); };
if (typeof FW !== 'undefined') { FW.pts.material.map = LIFE.soft; FW.pts.material.size = 4.6; FW.pts.material.toneMapped = false; FW.pts.material.needsUpdate = true; }
LIFE.fwFrame = dt => { if (typeof FW === 'undefined') return; LIFE.nextBurst -= dt;
  if (LIFE.nextBurst <= 0) { LIFE.nextBurst = 7 + Math.random() * 10; if ((L.lamps || 0) > 0.6) FW.show = Math.max(FW.show, 0.9 + Math.random() * 1.4); } };

function lifeFrame(dt) {
  LIFE.t += dt;
  try { LIFE.pigeonFrame(dt); LIFE.gullFrame(); LIFE.gullMesh.instanceMatrix.needsUpdate = true; LIFE.steamFrame(dt); LIFE.skyFrame(dt); LIFE.flyFrame(); LIFE.paperFrame(dt); LIFE.fwFrame(dt); } catch (e) { if (!LIFE.err) { LIFE.err = e; console.warn('v12 life', e); } }
}
