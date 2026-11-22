/* ================================================================
   v56 THE STEAM (2026-11-22)
   The most New York thing a street does: two orange and white striped stacks at (-20, 30) pour steam from the mains
   below, and two manhole covers beside them breathe a puff every few seconds. Real soft plumes, each puff growing,
   rising, leaning with the breeze and thinning out; grey in the day, lit warm by the street lamps at night. Walk
   through the plume and you have been steamed. STEAM or CONEDISON finds them.
   ================================================================ */
const STEAM = { N: isMobile ? 170 : 420, p: [], em: [], k: 0 };
window.__STEAM = STEAM;
const STEAM_AT = { x: -20, z: 30 };
(function steam() {
  const x0 = STEAM_AT.x, z0 = STEAM_AT.z, g0 = ground(x0, z0); STEAM.g0 = g0;
  // the stacks: a striped sleeve (canvas bands, a stencilled N3W on one band), open top, dark inside
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const c = cv.getContext('2d');
  if (c && c.fillRect) { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e9e4da' : '#e2581c'; c.fillRect(0, i * 64, 256, 64); }
    if (c.fillText) { c.fillStyle = '#e2581c'; c.font = '700 34px "Archivo Black", Impact, sans-serif'; c.textAlign = 'center'; c.fillText('N3W', 128, 3 * 64 + 44); c.fillText('EDISON', 128, 5 * 64 + 44); }
    c.fillStyle = 'rgba(40,30,20,.18)'; for (let i = 0; i < 40; i++) c.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 10 + Math.random() * 40); }
  const st = new THREE.CanvasTexture(cv); st.encoding = THREE.sRGBEncoding; st.anisotropy = ANISO;
  const sleeve = new THREE.MeshStandardMaterial({ map: st, roughness: 0.55, side: THREE.DoubleSide }), inner = new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 1, side: THREE.BackSide });
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.55, metalness: 0.6 });
  [[0, 0, 2.7], [2.2, 0.9, 2.2]].forEach(([dx, dz, h]) => { const x = x0 + dx, z = z0 + dz, gy = ground(x, z);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, h, 24, 1, true), sleeve); s.position.set(x, gy + h / 2, z); s.castShadow = true; scene.add(s);
    const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.39, h, 24, 1, true), inner); s2.position.copy(s.position); scene.add(s2);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 24), iron); lip.rotation.x = PI / 2; lip.position.set(x, gy + h, z); scene.add(lip);
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 24), iron); cover.position.set(x, gy + 0.015, z); scene.add(cover);
    post(x, z, 0.45, -5, h + 0.2); STEAM.em.push({ x, z, y: gy + h, rate: 40, r: 0.22, v: 1.25, big: 1, stack: true }); });
  // two manholes that breathe
  const mt = (() => { const m = document.createElement('canvas'); m.width = m.height = 256; const q = m.getContext('2d'); if (q && q.arc) { q.fillStyle = '#2b2927'; q.beginPath(); q.arc(128, 128, 126, 0, PI * 2); q.fill(); q.strokeStyle = '#1a1917'; q.lineWidth = 7; for (let r = 30; r < 120; r += 22) { q.beginPath(); q.arc(128, 128, r, 0, PI * 2); q.stroke(); } for (let a = 0; a < 12; a++) { q.save(); q.translate(128, 128); q.rotate(a * PI / 6); q.fillRect(-3, 30, 6, 90); q.restore(); } if (q.fillText) { q.fillStyle = '#3b3835'; q.font = '700 22px "Archivo Black", Impact, sans-serif'; q.textAlign = 'center'; q.fillText('N3W YORK', 128, 136); } } const t = new THREE.CanvasTexture(m); t.encoding = THREE.sRGBEncoding; return t; })();
  [[-3.2, 2.4], [4.6, -2.8]].forEach(([dx, dz], i) => { const x = x0 + dx, z = z0 + dz, gy = ground(x, z);
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.4, metalness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 })); m.rotation.x = -PI / 2; m.position.set(x, gy + 0.02, z); scene.add(m);
    STEAM.em.push({ x, z, y: gy + 0.05, rate: 0, r: 0.3, v: 0.9, big: 0.8, puff: 0, next: 2 + i * 3 }); });
  // a sawhorse with a blinking amber lamp
  const saw = new THREE.Group(), stripe = (() => { const m = document.createElement('canvas'); m.width = 256; m.height = 32; const q = m.getContext('2d'); if (q && q.fillRect && q.moveTo && q.beginPath) { q.fillStyle = '#efe9dd'; q.fillRect(0, 0, 256, 32); q.fillStyle = '#e2581c'; for (let i = -2; i < 12; i++) { q.beginPath(); q.moveTo(i * 28, 32); q.lineTo(i * 28 + 14, 32); q.lineTo(i * 28 + 30, 0); q.lineTo(i * 28 + 16, 0); q.fill(); } } const t = new THREE.CanvasTexture(m); t.encoding = THREE.sRGBEncoding; return t; })();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.04), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 })); bar.position.y = 0.85; saw.add(bar);
  [-0.75, 0.75].forEach(dx => [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.05), iron); l.position.set(dx, 0.45, s * 0.14); l.rotation.x = s * 0.28; saw.add(l); }));
  const amber = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa020, toneMapped: false })); amber.position.set(0.75, 1.02, 0); saw.add(amber); STEAM.amber = amber;
  saw.position.set(x0 - 1.6, ground(x0 - 1.6, z0 - 1.8), z0 - 1.8); saw.rotation.y = 0.5; scene.add(saw);
  // the plume: one Points cloud with its own size and alpha per puff
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(STEAM.N * 3).fill(-999), sz = new Float32Array(STEAM.N), al = new Float32Array(STEAM.N);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: LIFE.soft }, uCol: { value: new THREE.Color(0xdde2e6) }, uScale: { value: innerHeight * 0.55 } }, transparent: true, depthWrite: false,
    vertexShader: 'attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = aAlpha; gl_PointSize = min(512.0, aSize * uScale / max(0.5, -mv.z)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 uCol; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA; if (a < 0.004) discard; gl_FragColor = vec4(uCol, a); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts); STEAM.pts = pts; STEAM.mat = mat;
  for (let i = 0; i < STEAM.N; i++) STEAM.p.push({ t: 99, life: 1, e: null, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 0.5 });
  STEAM.cur = 0;
  if (window.__MAP) MAP.places.push(['THE STEAM', x0, z0, x0 + 3, z0 + 5]);
})();
const steamSecret = secret('steam', () => { toast('YOU WALKED THROUGH THE STEAM. YOU ARE NOW A NEW YORKER. ALSO DAMP.', 'blue'); });
EGGS.conedison = EGGS.manhole = () => { teleport(STEAM_AT.x + 4, STEAM_AT.z + 7, Math.atan2(4, 7)); toast('FOLLOW THE ORANGE STRIPES. THE CITY IS EXHALING.'); }; EGGS.conedison.__s = true;
function steamEmit(e, n) { for (let k = 0; k < n; k++) { const s = STEAM.p[STEAM.cur]; STEAM.cur = (STEAM.cur + 1) % STEAM.N; const a = Math.random() * PI * 2, r = Math.random() * e.r;
  s.e = e; s.t = 0; s.life = (4 + Math.random() * 2.5) * (e.stack ? 1 : 0.7); s.x = e.x + Math.cos(a) * r; s.z = e.z + Math.sin(a) * r; s.y = e.y; s.vx = (Math.random() - 0.5) * 0.3; s.vz = (Math.random() - 0.5) * 0.3; s.vy = e.v * (0.8 + Math.random() * 0.4); s.s0 = (0.35 + Math.random() * 0.3) * e.big; } }
function steamFrame(dt) {
  const d = Math.hypot(P.x - STEAM_AT.x, P.z - STEAM_AT.z), near = d < 160; STEAM.pts.visible = near; if (!near) return;
  const night = Math.min(1, (L.lamps || 0) * 1.4), day = Math.max(0, Math.min(1, ((SKY.el || 0) + 4) / 18));
  const lit = 0.18 + 0.72 * day; STEAM.mat.uniforms.uCol.value.setRGB(0.87 * lit + 0.22 * night, 0.89 * lit + 0.17 * night, 0.91 * lit + 0.12 * night);
  STEAM.mat.uniforms.uScale.value = innerHeight * 0.55 * (camera.fov ? 55 / camera.fov : 1);
  STEAM.amber.visible = Math.sin(LIFE.t * 5) > 0; const wx = 0.45 + Math.sin(LIFE.t * 0.13) * 0.3, wz = 0.18 + Math.cos(LIFE.t * 0.09) * 0.2;
  STEAM.em.forEach(e => { if (e.stack) { e.acc = (e.acc || 0) + dt * e.rate * (isMobile ? 0.45 : 1); const n = Math.floor(e.acc); e.acc -= n; if (n) steamEmit(e, n); }
    else { e.next -= dt; if (e.next <= 0) { e.puff = 1.2 + Math.random() * 0.8; e.next = 4 + Math.random() * 5; } if (e.puff > 0) { e.puff -= dt; e.acc = (e.acc || 0) + dt * 22 * (isMobile ? 0.45 : 1); const n = Math.floor(e.acc); e.acc -= n; if (n) steamEmit(e, n); } } });
  const pos = STEAM.pts.geometry.attributes.position.array, sz = STEAM.pts.geometry.attributes.aSize.array, al = STEAM.pts.geometry.attributes.aAlpha.array;
  let inPlume = false;
  for (let i = 0; i < STEAM.N; i++) { const s = STEAM.p[i]; if (s.t >= s.life) { if (al[i] !== 0) { al[i] = 0; pos[i * 3 + 1] = -999; } continue; }
    s.t += dt; const k = s.t / s.life; s.vy *= 1 - dt * 0.35; s.vx += (wx - s.vx) * dt * 0.5 * k; s.vz += (wz - s.vz) * dt * 0.5 * k;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; pos[i * 3] = s.x; pos[i * 3 + 1] = s.y; pos[i * 3 + 2] = s.z;
    sz[i] = s.s0 * (1.4 + k * 6); al[i] = Math.min(1, s.t * 3) * Math.pow(1 - k, 1.4) * (0.5 - 0.22 * Math.min(1, (L.lamps || 0) * 1.4));
    if (!inPlume && k < 0.6 && Math.abs(s.x - P.x) < 0.5 && Math.abs(s.z - P.z) < 0.5 && Math.abs(s.y - P.y - 1.4) < 0.9) inPlume = true; }
  const g = STEAM.pts.geometry.attributes; g.position.needsUpdate = g.aSize.needsUpdate = g.aAlpha.needsUpdate = true;
  if (inPlume) { STEAM.k += dt; if (STEAM.k > 0.6) steamSecret(); }
}
window.__FRAMES.push(dt => { try { steamFrame(dt); } catch (e) { if (!STEAM.err) { STEAM.err = e; console.warn('v56 steam', e); } } });
