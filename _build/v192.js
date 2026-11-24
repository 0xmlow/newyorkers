/* ================================================================
   v192 THE LOOK: A SECOND WATER TOWER (2026-11-23)
   No New York roofline has just one. The walk up now carries its own small cedar tank on a steel stand, a ladder
   up its side, hoops and a conical roof, beside the condensers. Seen from the plaza the two tanks make the skyline
   of the west side. ?roofs=0 off with v185.
   ================================================================ */
(function tank2() {
  if (!FAC_ON || /roofs=0/.test(location.search) || !window.__BROWN || !BROWN.H) return;
  const x = BROWN_AT.x - 1.0, z = BROWN_AT.z, y0 = BROWN.g0 + BROWN.H + 0.05, legH = 2.2, R = 1.05, Ht = 2.4;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
  if (c && c.fillRect) for (let i = 0; i < 24; i++) { const v = 80 + Math.random() * 40 | 0; c.fillStyle = `rgb(${v + 28},${v},${v - 26})`; c.fillRect(i * 11, 0, 10, 128); c.fillStyle = 'rgba(15,10,5,.55)'; c.fillRect(i * 11 + 10, 0, 1, 128); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1);
  const steel = FACM.steel, wood = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), roof = new THREE.MeshStandardMaterial({ color: 0x4b3d30, roughness: 0.9 });
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => facPut('steel', x + a * 0.72, y0 + legH / 2, z + b * 0.72, 0.1, legH, 0.1));
  [0.7, 1.5].forEach(h => { facPut('steel', x, y0 + h, z - 0.72, 1.5, 0.05, 0.05); facPut('steel', x, y0 + h, z + 0.72, 1.5, 0.05, 0.05); facPut('steel', x - 0.72, y0 + h, z, 0.05, 0.05, 1.5); facPut('steel', x + 0.72, y0 + h, z, 0.05, 0.05, 1.5); });
  facPut('steel', x, y0 + legH + 0.04, z, 1.7, 0.08, 1.7);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.04, Ht, 28, 1, true), wood); body.position.set(x, y0 + legH + 0.08 + Ht / 2, z); body.castShadow = true; scene.add(body); window.__TANK2 = body;
  const lid = new THREE.Mesh(new THREE.CircleGeometry(R, 28), roof); lid.rotation.x = -PI / 2; lid.position.set(x, y0 + legH + 0.08 + Ht - 0.02, z); scene.add(lid);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(R * 1.12, 0.8, 28), roof); hat.position.set(x, y0 + legH + 0.08 + Ht + 0.4, z); hat.castShadow = true; scene.add(hat);
  for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02 + i * 0.008, 0.02, 5, 28), steel); h.rotation.x = PI / 2; h.position.set(x, y0 + legH + 0.4 + i * 0.6, z); scene.add(h); }
  facPut('steel', x + R + 0.06, y0 + (legH + Ht) / 2 + 0.1, z - 0.22, 0.04, legH + Ht, 0.04); facPut('steel', x + R + 0.06, y0 + (legH + Ht) / 2 + 0.1, z + 0.22, 0.04, legH + Ht, 0.04);
  for (let r = 0.3; r < legH + Ht; r += 0.3) facPut('steel', x + R + 0.06, y0 + r, z, 0.03, 0.03, 0.44);
  facFlush();
})();
