/* ================================================================
   v49 THE OPEN HYDRANT (2026-11-22)
   A red fire hydrant at (75, 30) with a spray cap. E (or HYDRANT) opens it: a fan of water arcs over the sidewalk,
   a puddle spreads, two kids run through it screaming, and when the sun is behind you a small rainbow stands in the
   mist. Walk through it and you are soaked. After forty five seconds a firefighter caps it.
   ================================================================ */
const HYD = { on: 0, puddle: 0, N: isMobile ? 220 : 520, d: [], kids: [], soak: 0 };
window.__HYD = HYD;
const HYD_AT = { x: 75, z: 30 };
(function hydrant() {
  const x = HYD_AT.x, z = HYD_AT.z, g0 = ground(x, z); HYD.g0 = g0; HYD.ry = Math.atan2(-x, -z);
  const red = new THREE.MeshStandardMaterial({ color: 0x8e1812, roughness: 0.5, metalness: 0.25 }), cap = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.4, metalness: 0.5 });
  const G = new THREE.Group(); G.position.set(x, g0, z); G.rotation.y = HYD.ry; scene.add(G);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 14), red); base.position.y = 0.04; G.add(base);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.62, 14), red); body.position.y = 0.39; G.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, PI * 2, 0, PI / 2), red); top.position.y = 0.7; G.add(top);
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 5), cap); nut.position.y = 0.86; G.add(nut);
  [-1, 1].forEach(s => { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 10), red); n.rotation.z = PI / 2; n.position.set(s * 0.18, 0.5, 0); G.add(n); });
  const out = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), cap); out.rotation.x = PI / 2; out.position.set(0, 0.45, 0.17); G.add(out);   // the spray cap faces the street
  post(x, z, 0.25, -5, 1);
  // the puddle: a dark wet disc that grows (no new reflections, just wet paving)
  const pm = new THREE.MeshStandardMaterial({ color: 0x1b2730, roughness: 0.06, metalness: 0.4, transparent: true, opacity: 0, depthWrite: false });
  const pd = new THREE.Mesh(new THREE.CircleGeometry(1, 40), pm); pd.rotation.x = -PI / 2; pd.position.set(x + Math.sin(HYD.ry) * 3.4, g0 + 0.03, z + Math.cos(HYD.ry) * 3.4); pd.scale.setScalar(0.01); scene.add(pd); HYD.pd = pd;
  // the water: one Points cloud, each drop a ballistic arc out of the cap
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(HYD.N * 3).fill(-999); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdcecf5, size: 0.16, map: LIFE.soft, transparent: true, opacity: 0.85, depthWrite: false })); pts.frustumCulled = false; pts.visible = false; scene.add(pts); HYD.pts = pts;
  for (let i = 0; i < HYD.N; i++) HYD.d.push({ t: Math.random() * 1.4, vx: 0, vy: 0, vz: 0 });
  // a small rainbow in the mist (a canvas arc), shown only with the sun behind you
  const rc = document.createElement('canvas'); rc.width = 256; rc.height = 128; const c = rc.getContext('2d');
  if (c && c.beginPath && c.arc) { ['#ff3030', '#ff9a2a', '#ffe94a', '#5fe36a', '#3aa0ff', '#6a4cff', '#b04cff'].forEach((col, i) => { c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 6; c.filter = 'blur(3px)'; c.beginPath(); c.arc(128, 128, 110 - i * 5, PI, 0); c.stroke(); }); }
  const rt = new THREE.CanvasTexture(rc); const rb = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }));
  rb.position.set(x + Math.sin(HYD.ry) * 3.0, g0 + 0.2, z + Math.cos(HYD.ry) * 3.0); scene.add(rb); HYD.rb = rb;
  // two kids in swimsuits who wait on the stoop
  [[0x2a9dd8, -2.2], [0xe8559a, -2.8]].forEach(([shirt, o], i) => { const k = person(shirt, shirt, SKIN[(i * 4 + 1) % SKIN.length], i ? 'actress' : 'cabbie'); k.g.scale.setScalar(0.62); const bx = x + Math.cos(HYD.ry) * o, bz = z - Math.sin(HYD.ry) * o; k.g.position.set(bx, g0 - 0.22, bz); HYD.kids.push({ P: k, bx, bz, ph: i * 1.7 }); });
  interact(x + Math.cos(HYD.ry) * 0.9, z - Math.sin(HYD.ry) * 0.9, 1.5, 'E · OPEN THE HYDRANT', () => hydOpen());
})();
const hydSecret = secret('hydrant', () => { }), soakSecret = secret('soaked', () => { toast('YOU ARE SOAKED. THIS IS THE MOST NEW YORK THING THAT HAS HAPPENED TO YOU TODAY.', 'blue'); });
EGGS.hydrant = () => hydOpen(); EGGS.hydrant.__s = true;
let hydHiss = null;
function hydOpen() {
  if (HYD.on > 0) { toast('IT IS ALREADY OPEN. THE KIDS SAY THANK YOU.'); return; } hydSecret(); HYD.on = 45; HYD.pts.visible = true; toast('A WRENCH, A QUARTER TURN, AND SUMMER COMES OUT OF THE SIDEWALK.');
  if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { const n = AC.sampleRate, buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.6; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); hydHiss = { s, g }; } catch (e) { }
}
const _hf = new THREE.Vector3();
function hydFrame(dt) {
  const T = HYD, x = HYD_AT.x, z = HYD_AT.z, fx = Math.sin(T.ry), fz = Math.cos(T.ry), rx = Math.cos(T.ry), rz = -Math.sin(T.ry);
  const was = T.on; T.on = Math.max(0, T.on - dt); if (was > 0 && T.on === 0) { toast('A FIREFIGHTER CAPS THE HYDRANT. HE SAYS HAVE A GOOD SUMMER. IT IS NOVEMBER.'); }
  const open = T.on > 0; T.puddle += ((open ? 1 : 0) - T.puddle) * dt * (open ? 0.08 : 0.02);
  T.pd.scale.setScalar(0.01 + T.puddle * 3.2); T.pd.material.opacity = Math.min(0.85, T.puddle * 1.4);
  const dist = Math.hypot(P.x - x, P.z - z); if (hydHiss) { hydHiss.g.gain.value = open ? Math.max(0, 0.08 - dist * 0.003) : 0; if (!open) { try { hydHiss.s.stop(); } catch (e) { } hydHiss = null; } }
  if (!open && !T.pts.visible) { T.rb.material.opacity = 0; T.kids.forEach(k => { k.P.g.position.set(k.bx, T.g0 - 0.22, k.bz); }); return; }
  const pos = T.pts.geometry.attributes.position.array; let alive = 0; const ox = x + fx * 0.25, oy = T.g0 + 0.45, oz = z + fz * 0.25;
  for (let i = 0; i < T.N; i++) { const d = T.d[i]; d.t += dt;
    if (d.t > 1.4) { if (!open) { pos[i * 3 + 1] = -999; continue; } d.t = Math.random() * 0.05; const sp = 6.5 + Math.random() * 1.8, fan = (Math.random() - 0.5) * 0.55, up = 0.28 + Math.random() * 0.22;
      d.vx = (fx * Math.cos(fan) + rx * Math.sin(fan)) * sp; d.vz = (fz * Math.cos(fan) + rz * Math.sin(fan)) * sp; d.vy = up * sp; }
    let px = ox + d.vx * d.t, py = oy + d.vy * d.t - 4.9 * d.t * d.t, pz = oz + d.vz * d.t; if (py < T.g0 + 0.03) { py = T.g0 + 0.03 + Math.random() * 0.15; }
    pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz; alive++; }
  T.pts.geometry.attributes.position.needsUpdate = true; if (!open && alive === 0) T.pts.visible = false;
  // the rainbow: in the mist when the sun is low enough and behind the viewer
  let rbk = 0; if (open && SKY.sunDir && SKY.el > 6) { camera.getWorldDirection(_hf); const back = -_hf.dot(_hf.clone().copy(SKY.sunDir).normalize()); rbk = Math.max(0, Math.min(1, (back - 0.2) * 2)) * Math.min(1, (SKY.el - 6) / 10) * (1 - (WX.wet || 0)); T.rb.lookAt(camera.position.x, T.rb.position.y, camera.position.z); }
  T.rb.material.opacity += (rbk * 0.28 - T.rb.material.opacity) * Math.min(1, dt * 2);
  // kids run back and forth through the spray
  T.kids.forEach((k, i) => { if (!open) { k.P.g.position.set(k.bx, T.g0 - 0.22, k.bz); return; } const s = Math.sin(LIFE.t * 0.9 + k.ph); const along = 1.6 + 1.4 * Math.abs(Math.sin(LIFE.t * 0.35 + k.ph)), across = s * 2.6;
    k.P.g.position.set(x + fx * along + rx * across, T.g0 - 0.22 + Math.abs(Math.sin(LIFE.t * 9 + k.ph)) * 0.08, z + fz * along + rz * across); k.P.g.rotation.y = T.ry + (Math.cos(LIFE.t * 0.9 + k.ph) > 0 ? PI / 2 : -PI / 2); });
  // soaked: standing in the arc
  if (open) { const lx = P.x - ox, lz = P.z - oz, a = lx * fx + lz * fz, b = lx * rx + lz * rz; if (a > 0.8 && a < 5.5 && Math.abs(b) < 0.6 + a * 0.3) { T.soak += dt; if (T.soak > 0.8) soakSecret(); } }
}
window.__FRAMES.push(dt => { try { hydFrame(dt); } catch (e) { if (!HYD.err) { HYD.err = e; console.warn('v49 hydrant', e); } } });
