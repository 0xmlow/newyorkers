/* ================================================================
   v66 THE WATER TOWER (2026-11-22)
   The shape on every New York roofline: a squat brick building at (-64, -72) with a wooden water tank on steel legs
   on its roof, cedar staves held by black hoops, a witch hat roof, N3W stencilled on the side. E at the ladder
   takes you up; the roof is yours, with the whole island laid out. WATERTOWER puts you there.
   Also here: memeMesh(n, h), one Meme card cut out of the atlas as a plain mesh, for the pieces that follow.
   ================================================================ */
function memeMesh(n, h, opts) {
  const I = byN[n]; if (!I) return null; const u = I.uv, w = h * u[5], g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u[1] + (u[3] - u[1]) * uv.getX(i), (1 - u[4]) + (u[4] - u[2]) * uv.getY(i));
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial(Object.assign({ map: ATL[u[0]], roughness: 0.8 }, opts || {})));
}
const MEME_NS = Object.keys(byN).map(Number).filter(n => byN[n] && byN[n].uv);
const WT = {};
window.__WT = WT;
const WT_AT = { x: -64, z: -72 };
(function waterTower() {
  const x0 = WT_AT.x, z0 = WT_AT.z, g0 = ground(x0, z0), H = 7, S = 7; WT.top = g0 + H;
  const bt = tex('assets/brick_c.webp', [2.2, 2.2]); const brick = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.9, color: 0xb59a8a });
  const bld = new THREE.Mesh(new THREE.BoxGeometry(S, H, S), brick); bld.position.set(x0, g0 + H / 2, z0); bld.castShadow = bld.receiveShadow = true; scene.add(bld);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(S + 0.3, 0.25, S + 0.3), new THREE.MeshStandardMaterial({ color: 0x8c8780, roughness: 0.8 })); cap.position.set(x0, g0 + H + 0.12, z0); scene.add(cap);
  const roofM = new THREE.MeshStandardMaterial({ color: 0x3b3936, roughness: 0.95 }); const roof = new THREE.Mesh(new THREE.BoxGeometry(S - 0.2, 0.05, S - 0.2), roofM); roof.position.set(x0, g0 + H + 0.26, z0); scene.add(roof);
  // parapet
  [[0, S / 2], [0, -S / 2], [S / 2, 0], [-S / 2, 0]].forEach(([dx, dz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(dx ? 0.3 : S + 0.3, 0.7, dx ? S + 0.3 : 0.3), brick); m.position.set(x0 + dx, g0 + H + 0.35, z0 + dz); scene.add(m); });
  boxWalls(x0, z0, S, S, 0, -5, g0 + H - 0.4); padRect(x0 - S / 2 + 0.3, x0 + S / 2 - 0.3, z0 - S / 2 + 0.3, z0 + S / 2 - 0.3, g0 + H + 0.28, g0 + H - 0.2);
  // windows (dark, lit at night) on the street side
  const winM = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.2, metalness: 0.4, emissive: 0xffc77a, emissiveIntensity: 0 }); WT.win = winM;
  for (let fl = 0; fl < 2; fl++) for (let k = -1; k <= 1; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), winM); w.position.set(x0 + k * 2, g0 + 2 + fl * 3, z0 + S / 2 + 0.01); scene.add(w); }
  // the tank: cedar staves, hoops, a witch hat roof, legs
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256; const c = tc.getContext('2d');
  if (c && c.fillRect) { for (let i = 0; i < 32; i++) { const v = 95 + Math.random() * 35 | 0; c.fillStyle = `rgb(${v + 30},${v},${v - 30})`; c.fillRect(i * 16, 0, 15, 256); c.fillStyle = 'rgba(20,12,6,.5)'; c.fillRect(i * 16 + 15, 0, 1, 256); }
    for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(50,40,30,.25)'; c.fillRect(Math.random() * 512, Math.random() * 256, 2, 30 + Math.random() * 80); }
    if (c.fillText) { c.fillStyle = 'rgba(239,232,218,.85)'; c.font = '700 70px "Archivo Black", Impact, sans-serif'; c.textAlign = 'center'; c.fillText('N3W', 128, 150); } }
  const tt = new THREE.CanvasTexture(tc); tt.encoding = THREE.sRGBEncoding; tt.anisotropy = ANISO;
  const tank = new THREE.Group(); tank.position.set(x0 + 0.6, WT.top + 3.2, z0 - 0.4); scene.add(tank); WT.tank = tank;
  const steel = new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.6, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 4.2, 32, 1, true), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.85, side: THREE.DoubleSide })); body.position.y = 2.1; body.castShadow = true; tank.add(body);
  for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.TorusGeometry(2.17 + i * 0.012, 0.03, 6, 40), steel); h.rotation.x = PI / 2; h.position.y = 0.3 + i * 0.7; tank.add(h); }
  const hat = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.5, 32), new THREE.MeshStandardMaterial({ color: 0x5b4836, roughness: 0.9 })); hat.position.y = 4.95; hat.castShadow = true; tank.add(hat);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), steel); fin.position.y = 5.75; tank.add(fin);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.15, 32), steel); floor.position.y = -0.05; tank.add(floor);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.2, 8), steel); l.position.set(Math.cos(a) * 1.6, -1.6, Math.sin(a) * 1.6); tank.add(l);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6), steel); br.position.set(Math.cos(a + PI / 4) * 1.13, -1.6, Math.sin(a + PI / 4) * 1.13); br.rotation.set(0, -(a + PI / 4), 0.78); tank.add(br); }
  post(x0 + 0.6, z0 - 0.4, 2.0, WT.top - 1, WT.top + 9);
  // the ladders: up the street wall, and a little one up the tank
  const rail = (x, y, z, h, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); [-0.22, 0.22].forEach(s => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 6), steel); r.position.set(s, h / 2, 0); g.add(r); });
    for (let y2 = 0.3; y2 < h; y2 += 0.35) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6), steel); r.rotation.z = PI / 2; r.position.set(0, y2, 0); g.add(r); } };
  rail(x0 + 2.2, g0, z0 + S / 2 + 0.12, H + 1.2, 0); rail(x0 + 0.6, WT.top, z0 - 0.4 + 2.3, 7.6, 0);
  interact(x0 + 2.2, z0 + S / 2 + 0.9, 1.6, 'E · CLIMB TO THE ROOF', () => wtUp());
  interact(x0 + 2.2, z0 + S / 2 - 0.9, 1.4, 'E · CLIMB DOWN', () => { teleport(x0 + 2.2, z0 + S / 2 + 1.6, 0, g0 + 1); }, WT.top);
  if (window.__MAP) MAP.places.push(['WATER TOWER', x0, z0, x0 + 2.2, z0 + S / 2 + 1.6]);
})();
const wtSecret = secret('watertower', () => { }, []);
function wtUp() { teleport(WT_AT.x + 2.2, WT_AT.z + 2.4, PI, WT.top + 1); wtSecret(); toast('EVERY ROOF IN NEW YORK HAS ONE OF THESE. NOW YOU KNOW WHY. THE VIEW.', 'blue'); }
EGGS.watertower = EGGS.roof = () => wtUp(); EGGS.watertower.__s = true;
window.__FRAMES.push(dt => { try { WT.win.emissiveIntensity = Math.min(1, (L.lamps || 0) * 1.6) * 0.9; } catch (e) { } });
