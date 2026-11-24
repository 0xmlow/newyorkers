/* ================================================================
   v182 THE LOOK: LAMP POSTS AND STREET SIGNS (2026-11-23)
   The thirty six lamps on the inner kerb were plain poles with a ball on top. Each now stands on a fluted cast
   iron base with collars up the shaft and a lantern cap over the globe, and every third one carries a pair of
   green New York street blades at the corner: MEME ST, 6529 WAY, GM AVE, HODL PL, SEIZE ST, WAGMI BLVD and
   friends, white letters, rounded ends, the cross street turned square to the first. ?lamps=0 off.
   ================================================================ */
const POSTS2 = {};
window.__POSTS2 = POSTS2;
(function lampPosts() {
  if (!LOOK.on || /lamps=0/.test(location.search)) return;
  const iron = new THREE.MeshStandardMaterial({ color: 0x1e2124, roughness: 0.45, metalness: 0.6 }), N = 36; POSTS2.iron = iron;
  const parts = [[new THREE.CylinderGeometry(0.17, 0.24, 1.1, 12), 0.55], [new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12), 1.12], [new THREE.CylinderGeometry(0.13, 0.13, 0.07, 10), 2.2], [new THREE.CylinderGeometry(0.12, 0.12, 0.07, 10), 4.6], [new THREE.CylinderGeometry(0.14, 0.1, 0.2, 10), 5.72], [new THREE.ConeGeometry(0.42, 0.34, 12), 6.62], [new THREE.SphereGeometry(0.06, 8, 6), 6.86]];
  const fl = new THREE.CylinderGeometry(0.03, 0.03, 0.95, 4); const m4 = new THREE.Matrix4();
  parts.forEach(([geo, y]) => { const im = new THREE.InstancedMesh(geo, iron, N); for (let i = 0; i < N; i++) { const [x, z] = P2((i + 0.5) / N * 360, 94.5); m4.makeTranslation(x, ground(x, z) + y, z); im.setMatrixAt(i, m4); } im.castShadow = true; scene.add(im); });
  const fi = new THREE.InstancedMesh(fl, iron, N * 8); let k = 0; for (let i = 0; i < N; i++) { const [x, z] = P2((i + 0.5) / N * 360, 94.5), g = ground(x, z); for (let j = 0; j < 8; j++) { const a = j / 8 * PI * 2; m4.makeTranslation(x + Math.cos(a) * 0.2, g + 0.55, z + Math.sin(a) * 0.2); fi.setMatrixAt(k++, m4); } } fi.castShadow = true; scene.add(fi);
  // street blades
  const names = ['MEME ST', '6529 WAY', 'GM AVE', 'HODL PL', 'SEIZE ST', 'WAGMI BLVD', 'SUMMER ST', 'BODEGA AVE', 'CENSUS WALK', 'PUNK PL', 'N3W AVE', 'FLOOR ST', 'KEYS WAY', 'BRAIN ST', 'PIER AVE', 'BELL ST', 'MLOW WAY', 'GALLERY ST', 'EYE PL', 'CYCLE AVE', 'LOTTO ST', 'TIDE ST', 'JPG BLVD', 'LIBERTY AVE'];
  const tx = {}; const bladeTex = nm => { if (tx[nm]) return tx[nm]; const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const c = cv.getContext('2d');
    if (c && c.fillRect) { c.fillStyle = '#0f6b3a'; c.fillRect(0, 0, 512, 96); c.strokeStyle = '#f4f4ee'; c.lineWidth = 4; c.strokeRect(8, 8, 496, 80); if (c.fillText) { c.fillStyle = '#f7f7f2'; c.font = '600 56px "Helvetica Neue", Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm, 256, 52); } }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return tx[nm] = t; };
  const edge = new THREE.MeshStandardMaterial({ color: 0x0f6b3a, roughness: 0.5 }); let ni = 0; POSTS2.blades = 0;
  for (let i = 0; i < N; i += 3) { const a = (i + 0.5) / N * 360, [x, z] = P2(a, 94.5), g = ground(x, z), tang = -(a * PI / 180);
    [[tang, g + 3.55], [tang + PI / 2, g + 3.3]].forEach(([ry, y]) => { const nm = names[ni++ % names.length], ft = new THREE.MeshStandardMaterial({ map: bladeTex(nm), roughness: 0.45 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 0.025), [edge, edge, edge, edge, ft, ft]); b.position.set(x + Math.cos(ry) * 0.55, y, z - Math.sin(ry) * 0.55); b.rotation.y = ry; b.castShadow = true; scene.add(b); POSTS2.blades++; });
    const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 8), iron); cl.position.set(x, g + 3.42, z); scene.add(cl); }
})();
