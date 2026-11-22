/* ================================================================
   v23 THE SKY (2026-11-21)
   N3W AIR TOURS: a helipad in the western clearing with a helicopter on it; E and it lifts off with you for
   a forty second flight round the island, the Colossus and the harbour, then sets you back down. Kites fly
   over GM Beach on the wind, and two hot air balloons in N3W stripes drift over the harbour.
   ================================================================ */
const AIR = { x: -72, z: -39, flying: false };
window.__AIR = AIR;
(function helipad() {
  const { x, z } = AIR, g0 = ground(x, z) + 0.05;
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
  if (c && c.arc) { c.fillStyle = '#2c2f33'; c.beginPath(); c.arc(256, 256, 254, 0, PI * 2); c.fill(); c.strokeStyle = '#f2b705'; c.lineWidth = 14; c.beginPath(); c.arc(256, 256, 220, 0, PI * 2); c.stroke();
    c.fillStyle = '#f2f2ee'; c.font = '400 300px Anton,Impact,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 256, 270);
    c.font = '800 26px "Archivo Expanded",Arial'; c.fillText('N3W AIR TOURS', 256, 80); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.12, 48), [MAT.conc, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), MAT.conc]); pad.position.set(x, g0, z); pad.receiveShadow = true; scene.add(pad); padRect(x - 4.2, x + 4.2, z - 4.2, z + 4.2, g0 + 0.07);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x5af07a, toneMapped: false })); l.position.set(x + Math.cos(a) * 6.1, g0 + 0.12, z + Math.sin(a) * 6.1); scene.add(l); }
  // the helicopter
  const g = new THREE.Group(), hm = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35, metalness: 0.4 }), glass = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.05, metalness: 0.6 });
  const cab = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), hm); cab.scale.set(1, 0.9, 1.6); cab.position.y = 1.4; g.add(cab);
  const win = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 10, 0, PI * 2, 0, PI * 0.45), glass); win.scale.set(0.95, 0.85, 1.5); win.rotation.x = 0.9; win.position.set(0, 1.5, 0.6); g.add(win);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 4.6, 8), hm); boom.rotation.x = PI / 2; boom.position.set(0, 1.6, -3.2); g.add(boom);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 2.2), new THREE.MeshBasicMaterial({ color: 0x2962ff })); [-1.2, 1.2].forEach(sx => { const s2 = stripe.clone(); s2.position.set(sx * 0.99, 1.35, 0); g.add(s2); });
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.7), hm); fin.position.set(0, 2.0, -5.3); g.add(fin);
  const rotor = new THREE.Group(); [0, 1].forEach(i => { const b = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 0.28), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); b.rotation.y = i * PI / 2; rotor.add(b); }); rotor.position.y = 2.6; g.add(rotor);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 0.12), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); tr.position.set(0.12, 2.0, -5.4); g.add(tr);
  [-0.75, 0.75].forEach(sx => { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8 })); sk.rotation.x = PI / 2; sk.position.set(sx, 0.08, 0); g.add(sk); });
  const lab = signTex([{ t: 'N3W AIR', s: 0.6 }], 512, 128, null, '#FFFFFF'); [-1, 1].forEach(sx => { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: lab, transparent: true })); l.position.set(sx * 1.21, 1.05, -0.3); l.rotation.y = sx * PI / 2; g.add(l); });
  g.position.set(x, g0, z); g.rotation.y = 0.6; scene.add(g); AIR.g = g; AIR.rotor = rotor; AIR.tr = tr; AIR.g0 = g0;
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 2.2, y0: -5, y1: 5, on: true });
})();
const airSecret = secret('heli', () => { });
function flyTour() {
  if (AIR.flying || RAIL.on) return; AIR.flying = true; airSecret(); toast('N3W AIR TOURS. SEATBELT ON. THE PILOT IS A PIGEON. JUST KIDDING. MOSTLY.');
  const { x, z } = AIR, h = AIR.g0;
  const pos = [[x, h + 2.4, z], [x, h + 14, z], [-50, 45, 20], [-10, 60, 90], [40, 55, 170], [62, 48, 228], [40, 42, 290], [-20, 55, 300], [-90, 65, 180], [-120, 70, 40], [-60, 80, -100], [30, 70, -150], [90, 60, -60], [80, 50, 40], [0, 70, 20], [-60, 30, -30], [x, h + 8, z], [x, h + 2.4, z]];
  const look = [[x, h + 2.4, z + 8], [-30, 20, 10], [0, 10, 60], [20, 10, 150], [58, 25, 262], [58, 30, 262], [58, 25, 262], [0, 10, 160], [0, 10, 60], [0, 10, 0], [0, 20, -126], [0, 30, -126], [62, 16, 0], [0, 8, 60], [0, 0, 0], [x, h, z], [x, h, z + 10], [x, h + 2, z + 10]];
  AIR.startT = LIFE.t; playRail({ pos, look, dur: 42, ease: false, fov: [70, 70], done: () => { AIR.flying = false; teleport(x + 5, z + 6, 0.6); toast('BACK ON THE GROUND. TIPS IN TDH.', 'blue'); } });
}
interact(AIR.x, AIR.z, 6, 'E · FLY WITH N3W AIR TOURS', flyTour);

/* kites over GM Beach */
const KITES = [];
(function kites() {
  const cols = [['#2962FF', '#FFFFFF'], ['#FF6B00', '#0D0D0D'], ['#ff4fa0', '#ffd400'], ['#0D0D0D', '#08DEFF']];
  [[-18, 128], [-6, 133], [10, 131], [22, 127]].forEach(([ax, az], i) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    if (c && c.beginPath) { c.fillStyle = cols[i][0]; c.beginPath(); c.moveTo(64, 0); c.lineTo(128, 50); c.lineTo(64, 128); c.lineTo(0, 50); c.closePath(); c.fill(); c.fillStyle = cols[i][1]; c.beginPath(); c.moveTo(64, 0); c.lineTo(128, 50); c.lineTo(64, 50); c.closePath(); c.fill(); c.beginPath(); c.moveTo(64, 50); c.lineTo(0, 50); c.lineTo(64, 128); c.closePath(); c.fill(); }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
    const k = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 })); scene.add(k);
    const lineG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(lineG, new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.6 })); line.frustumCulled = false; scene.add(line);
    const tailG = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 8 }, () => new THREE.Vector3())); const tail = new THREE.Line(tailG, new THREE.LineBasicMaterial({ color: new THREE.Color(cols[i][0]) })); tail.frustumCulled = false; scene.add(tail);
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), MAT.wood); peg.position.set(ax, ground(ax, az) + 0.25, az); scene.add(peg);
    KITES.push({ k, line, tail, ax, az, ph: i * 1.7, L: 22 + i * 4 });
  });
})();

/* hot air balloons */
const BALLOONS = [];
(function balloons() {
  [[0x2962ff, 0xffffff, -120, 240, 70], [0xff6b00, 0x0d0d0d, 140, 210, 85]].forEach(([c1, c2, x, z, y], i) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); if (c) for (let k = 0; k < 16; k++) { c.fillStyle = '#' + (k % 2 ? new THREE.Color(c1) : new THREE.Color(c2)).getHexString(); c.fillRect(k * 16, 0, 16, 64); }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
    const pts = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * PI; pts.push(new THREE.Vector2(Math.sin(a) * 6 * (k > 12 ? 1 - (k - 12) * 0.16 : 1), -Math.cos(a) * 7.5 + (k > 12 ? -(k - 12) * 0.6 : 0))); }
    const env = new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), 32), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, side: THREE.DoubleSide }));
    const g = new THREE.Group(); g.add(env); const basket = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.9 })); basket.position.y = -12; g.add(basket);
    for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + PI / 4; const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.4, 4), new THREE.MeshBasicMaterial({ color: 0x333333 })); r.position.set(Math.cos(a) * 1.2, -9.6, Math.sin(a) * 1.2); r.rotation.z = Math.cos(a) * 0.12; r.rotation.x = -Math.sin(a) * 0.12; g.add(r); }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 10), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, toneMapped: false })); flame.position.y = -9.4; g.add(flame);
    g.position.set(x, y, z); scene.add(g); BALLOONS.push({ g, flame, x, z, y, ph: i * 3 });
  });
})();

function skyFrame2(dt) {
  const t = LIFE.t;
  AIR.rotor.rotation.y += dt * (AIR.flying ? 42 : 0); AIR.tr.rotation.x += dt * (AIR.flying ? 50 : 0);
  if (AIR.flying && RAIL.on) { const f = new THREE.Vector3(); camera.getWorldDirection(f); AIR.g.position.copy(camera.position).addScaledVector(f, -2.2); AIR.g.position.y -= 1.9; AIR.g.rotation.set(-0.08, Math.atan2(f.x, f.z), 0); AIR.g.visible = (LIFE.t - AIR.startT) > 2 ? false : true; }
  else if (!AIR.flying) { AIR.g.visible = true; AIR.g.position.set(AIR.x, AIR.g0, AIR.z); AIR.g.rotation.set(0, 0.6, 0); }
  const w = 0.5 + Math.min(1.5, Math.abs((typeof NAT !== 'undefined' && NAT.wind && +NAT.wind.value) || 0.6));
  KITES.forEach((K, i) => { const a = 0.6 + Math.sin(t * 0.3 + K.ph) * 0.2, el = 0.75 + Math.sin(t * 0.5 + K.ph) * 0.12 * w;
    const kx = K.ax + Math.sin(a) * Math.cos(el) * K.L * 0.5, kz = K.az + Math.cos(a) * Math.cos(el) * K.L, ky = ground(K.ax, K.az) + Math.sin(el) * K.L + Math.sin(t * 2.1 + K.ph) * 0.6;
    K.k.position.set(kx, ky, kz); K.k.lookAt(K.ax, ground(K.ax, K.az), K.az); K.k.rotateZ(PI / 4 + Math.sin(t * 1.7 + K.ph) * 0.25);
    const lp = K.line.geometry.attributes.position; lp.setXYZ(0, K.ax, ground(K.ax, K.az) + 0.5, K.az); lp.setXYZ(1, kx, ky - 0.6, kz); lp.needsUpdate = true;
    const tp = K.tail.geometry.attributes.position; for (let k = 0; k < 8; k++) tp.setXYZ(k, kx + Math.sin(t * 4 + k * 0.7 + K.ph) * 0.25 * k / 8, ky - 0.7 - k * 0.35, kz + k * 0.3); tp.needsUpdate = true; });
  BALLOONS.forEach(B => { const d = t * 0.6 + B.ph * 40; B.g.position.set(B.x + Math.sin(d * 0.01) * 30, B.y + Math.sin(t * 0.2 + B.ph) * 3, B.z + Math.cos(d * 0.008) * 20); B.g.rotation.y = t * 0.02;
    const burn = (Math.sin(t * 0.7 + B.ph) > 0.6); B.flame.visible = burn; B.flame.scale.setScalar(0.8 + Math.random() * 0.4); });
}
window.__FRAMES.push(dt => { try { skyFrame2(dt); } catch (e) { if (!AIR.err) { AIR.err = e; console.warn('v23 sky', e); } } });
