/* ================================================================
   v79 NUTS 4 N3W (2026-11-22)
   The candied nut cart, on the east side at (86, -12): a steel cart under a striped umbrella, a copper kettle with
   sugar steam coming off it, paper cones in a rack, and the smell you can almost see. E buys a cone for half a TDH.
   ================================================================ */
const NUTS = {};
window.__NUTS = NUTS;
const NUTS_AT = { x: 86, z: -12 };
(function nutsCart() {
  const x0 = NUTS_AT.x, z0 = NUTS_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); NUTS.ry = ry;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g);
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.3, metalness: 0.85 }), copper = new THREE.MeshStandardMaterial({ color: 0xb06a3a, roughness: 0.3, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), steel); body.position.y = 0.75; g.add(body);
  const sg = signTex([{ t: 'NUTS 4 N3W', s: 0.42 }, { t: 'HONEY ROASTED · HOT', s: 0.16 }], 1024, 300, '#7a1f2a', '#efe8da'); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.44), new THREE.MeshBasicMaterial({ map: sg })); s.position.set(0, 0.75, 0.405); g.add(s);
  [[-0.65, 0.3], [0.65, 0.3]].forEach(([x]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 18), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })); w.rotation.x = PI / 2; w.position.set(x, 0.22, 0.42); g.add(w); });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 10, 0, PI * 2, PI / 2, PI / 2), copper); kettle.position.set(-0.3, 1.45, 0); g.add(kettle);
  const nuts = new THREE.Mesh(new THREE.CircleGeometry(0.26, 18), new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.4 })); nuts.rotation.x = -PI / 2; nuts.position.set(-0.3, 1.43, 0); g.add(nuts);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.9, side: THREE.DoubleSide })); c.rotation.x = PI; c.position.set(0.25 + (i % 3) * 0.13, 1.3 + Math.floor(i / 3) * 0.05, -0.1 + Math.floor(i / 3) * 0.2); g.add(c); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2, 6), steel); pole.position.set(0.6, 1.2, -0.3); g.add(pole);
  const um = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const c = cv.getContext('2d'); if (c && c.fillRect) for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#efe8da' : '#2962FF'; c.fillRect(i * 32, 0, 32, 32); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })();
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 16, 1, true), new THREE.MeshStandardMaterial({ map: um, roughness: 0.8, side: THREE.DoubleSide })); can.position.set(0.6, 2.25, -0.3); g.add(can);
  const v = person(0x2a2d33, 0x2a2f45, SKIN[6], 'cabbie'); v.g.position.set(x0 - Math.sin(ry) * 0.8, g0 - 0.35, z0 - Math.cos(ry) * 0.8); v.g.rotation.y = ry;
  boxWalls(x0, z0, 1.6, 0.8, ry, -5, g0 + 1.3);
  // sugar steam off the kettle, through the v56 plume system
  const kx = x0 + Math.cos(ry) * -0.3, kz = z0 - Math.sin(ry) * -0.3; if (window.__STEAM) STEAM.em.push({ x: kx, z: kz, y: g0 + 1.5, rate: 7, r: 0.15, v: 0.5, big: 0.35, stack: true });
  interact(x0 + Math.sin(ry) * 1.2, z0 + Math.cos(ry) * 1.2, 1.6, 'E · BUY A CONE (0.5 TDH)', () => { state.tdh = Math.max(0, state.tdh - 0.5); try { hud(); } catch (e) { } nutsSecret(); toast(['WARM HONEY ROASTED NUTS IN A PAPER CONE. YOUR HANDS ARE STICKY FOR THE REST OF THE DAY.', 'ANOTHER CONE. HE GIVES YOU THE ONES FROM THE BOTTOM, THE GOOD ONES.'][Math.min(1, (NUTS.n = (NUTS.n || 0) + 1) - 1)]); });
  if (window.__MAP) MAP.places.push(['NUTS 4 N3W', x0, z0, x0 + Math.sin(ry) * 2, z0 + Math.cos(ry) * 2]);
})();
const nutsSecret = secret('nuts', () => { }, []);
