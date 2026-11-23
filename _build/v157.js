/* ================================================================
   v157 WASH DAY (2026-11-23)
   Two pulley clotheslines run from the walk up's back windows across to a pole, sagging under shirts, towels,
   a sheet, a dress, and socks pegged in pairs, everything moving in the wind (each piece is cloth: it billows and
   flaps along its free edge, harder when it blows). When it rains somebody has taken it all in. Now and then a
   sock lets go and drifts down to the street; get to it before it settles and it counts.
   ================================================================ */
const WASH = { items: [], sock: null };
window.__WASH = WASH;
(function washDay() {
  const g0 = BROWN.g0, ax = BROWN_AT.x + 3.5 + 0.02, px = -53, pz = -60, pg = ground(px, pz); WASH.g0 = g0;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 9, 8), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.85 })); pole.position.set(px, pg + 4.5, pz); pole.castShadow = true; scene.add(pole); post(px, pz, 0.15, -5, pg + 9);
  const lineM = new THREE.LineBasicMaterial({ color: 0xd8d4c8 }); const cols = [0xf2f0ea, 0x2962FF, 0xc8202a, 0xe8c43a, 0x7fc8c0, 0xff8fc8, 0x3a5a3a, 0xe8e2d4, 0x1a1a1a, 0x8a8f99];
  const shape = (kind) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'); if (!c || !c.fillRect || !c.beginPath) return null; c.fillStyle = "#fff";
    if (kind === 'shirt') { c.beginPath(); c.moveTo(14, 0); c.lineTo(50, 0); c.lineTo(64, 14); c.lineTo(54, 24); c.lineTo(50, 18); c.lineTo(50, 64); c.lineTo(14, 64); c.lineTo(14, 18); c.lineTo(10, 24); c.lineTo(0, 14); c.closePath(); c.fill(); }
    else if (kind === 'dress') { c.beginPath(); c.moveTo(22, 0); c.lineTo(42, 0); c.lineTo(46, 20); c.lineTo(60, 64); c.lineTo(4, 64); c.lineTo(18, 20); c.closePath(); c.fill(); }
    else if (kind === 'sock') { c.fillRect(20, 0, 18, 44); c.beginPath(); c.ellipse(34, 52, 16, 10, 0, 0, PI * 2); c.fill(); }
    else { c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 52, 64, 5); }
    const t = new THREE.CanvasTexture(cv); return t; };
  const tex2 = { shirt: shape('shirt'), dress: shape('dress'), sock: shape('sock'), towel: shape('towel') };
  [[g0 + 5.2, BROWN_AT.z - 1.5, pg + 7.2], [g0 + 8.3, BROWN_AT.z + 1.5, pg + 8.6]].forEach(([ay, az, py], li) => { const A = new V3(ax, ay, az), Bp = new V3(px, py, pz); const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20, p = A.clone().lerp(Bp, u); p.y -= Math.sin(PI * u) * 0.45; pts.push(p); } scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineM));
    const kinds = li ? ['towel', 'shirt', 'sock', 'sock', 'dress', 'towel', 'shirt'] : ['shirt', 'shirt', 'towel', 'sock', 'sock', 'towel', 'dress', 'shirt'];
    kinds.forEach((k, i) => { const u = 0.08 + i / kinds.length * 0.85, p = A.clone().lerp(Bp, u); p.y -= Math.sin(PI * u) * 0.45; const w = k === 'sock' ? 0.18 : k === 'towel' ? 0.75 : k === 'dress' ? 0.6 : 0.62, h = k === 'sock' ? 0.36 : k === 'towel' ? 0.9 : k === 'dress' ? 1.05 : 0.7;
      const geo = new THREE.PlaneGeometry(w, h, 6, 6); geo.translate(0, -h / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[(i * 3 + li * 5) % cols.length], map: tex2[k], alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 })); m.position.copy(p); m.rotation.y = Math.atan2(Bp.x - A.x, Bp.z - A.z) + PI / 2; m.castShadow = true; scene.add(m);
      WASH.items.push({ m, base: geo.attributes.position.array.slice(), h, ph: Math.random() * 6, kind: k, home: p.clone(), ry: m.rotation.y }); }); });
})();
const washSecret = secret('sock', () => { toast('YOU CAUGHT THE SOCK BEFORE IT HIT THE GROUND. SOMEWHERE A LAUNDROMAT IS ONE SOCK SHORT OF A MYSTERY.', 'blue'); });
function washFrame(dt) {
  const W = WX.override || WX.cur, rain = W === 'RAIN' || W === 'SNOW'; const d = Math.hypot(P.x - (BROWN_AT.x + 8), P.z - BROWN_AT.z); WASH.items.forEach(q => q.m.visible = !rain && q !== (WASH.sock && WASH.sock.q)); if (rain || d > 90) return;
  const wind = 0.6 + 0.4 * Math.sin(LIFE.t * 0.13) + (WXX && WXX.storm ? WXX.storm : 0);
  WASH.items.forEach(q => { if (WASH.sock && WASH.sock.q === q) return; const a = q.m.geometry.attributes.position, b = q.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], hang = -y / q.h; a.setZ(i, Math.sin(LIFE.t * 3.1 + x * 4 + y * 3 + q.ph) * 0.12 * hang * wind + hang * hang * 0.25 * wind); } a.needsUpdate = true; });
  if (!WASH.sock && Math.random() < dt / 150) { const socks = WASH.items.filter(q => q.kind === 'sock'); const q = socks[(Math.random() * socks.length) | 0]; if (q) WASH.sock = { q, m: q.m.clone(), t: 0, x: q.home.x, y: q.home.y, z: q.home.z, vx: 0.9, vz: -0.6 }; if (WASH.sock) scene.add(WASH.sock.m); }
  if (WASH.sock) { const s = WASH.sock; s.t += dt; const f = floorAt(s.x, s.z, s.y + 0.5), fy = (f.f === null ? 0 : f.f) + 0.05; if (s.y > fy) { s.x += (s.vx + Math.sin(s.t * 2) * 0.6) * dt; s.z += s.vz * dt; s.y -= 0.7 * dt; s.m.rotation.set(Math.sin(s.t * 3) * 0.8, s.t * 1.5, Math.cos(s.t * 2.3) * 0.6); }
    else if (!s.landed) { s.landed = s.t; s.m.rotation.set(-PI / 2, s.t, 0); s.y = fy; }
    s.m.position.set(s.x, s.y, s.z); const near = Math.hypot(P.x - s.x, P.z - s.z) < 1.2;
    if (near && !s.landed) { washSecret(); scene.remove(s.m); WASH.sock = null; } else if (s.landed && s.t - s.landed > 25) { scene.remove(s.m); WASH.sock = null; } }
}
window.__FRAMES.push(dt => { try { washFrame(dt); } catch (e) { if (!WASH.err) { WASH.err = e; console.warn('v157 wash day', e); } } });
