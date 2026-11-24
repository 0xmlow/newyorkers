/* ================================================================
   v358 ILLUSION: ROUND FROM HERE, SQUARE FROM THERE (2026-11-24)
   A cobalt ribbon wall about two metres across stands on a plinth by the river's west spoke. From the footprints on
   one side its rim is a perfect circle. Walk round to the footprints opposite and the same rim is a perfect square.
   It is one shape (Kokichi Sugihara's ambiguous cylinder): its plan and its height are solved so that seen from 45
   degrees above on one side the top edge projects to a circle and from the other side to a square. ?ambiguous=0 off.
   ================================================================ */
const AMB = {};
window.__AMB = AMB;
(function ambiguous() {
  if (!LOOK.on || /ambiguous=0/.test(location.search)) return; const X = 11, Z = 45, g = ground(X, Z), R = 0.95, base = g + 0.9; AMB.P = [X, g, Z];
  const n = 160, P = [], I = [];
  for (let i = 0; i <= n; i++) { const th = i / n * PI * 2, x = Math.cos(th), sA = Math.sin(th), sB = Math.sin(th) >= 0 ? 1 : -1;
    // view A from -z looking +z down 45 degrees sees y_s = h - z; view B from +z sees y_s = h + z (unit units, times R)
    const h = (sA + sB) / 2, z = (sB - sA) / 2; P.push(X + x * R, base + (h + 1.2) * R * 0.7071, Z + z * R, X + x * R, base, Z + z * R); if (i) I.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.35, metalness: 0.15, side: THREE.DoubleSide })); m.castShadow = true; scene.add(m);
  const rim = [], rp = []; for (let i = 0; i <= n; i++) rp.push(new THREE.Vector3(P[i * 6], P[i * 6 + 1], P[i * 6 + 2])); const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true), 240, 0.035, 8, true), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.4 })); scene.add(tube);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.9, 32), new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.7 })); pl.position.set(X, g + 0.45, Z); pl.castShadow = pl.receiveShadow = true; scene.add(pl); post(X, Z, 1.5, -5, g + 3);
  // footprints for the two views: 45 degrees above the rim means standing about 2.4 m away at eye height
  const fc = document.createElement('canvas'); fc.width = fc.height = 128; const f = fc.getContext('2d'); if (f && f.ellipse) { f.fillStyle = '#08DEFF'; [[48, 66], [80, 62]].forEach(([x, y]) => { f.beginPath(); f.ellipse(x, y, 13, 26, 0, 0, PI * 2); f.fill(); }); }
  const ft = new THREE.CanvasTexture(fc); [[-1, 0], [1, PI]].forEach(([s, r]) => { const fm = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshStandardMaterial({ map: ft, transparent: true, polygonOffset: true, polygonOffsetFactor: -6 })); fm.rotation.x = -PI / 2; fm.rotation.z = r; fm.position.set(X, ground(X, Z + s * 2.6) + 0.03, Z + s * 2.6); scene.add(fm); });
  AMB.V = [[X, g + 1.62, Z - 2.6], [X, g + 1.62, Z + 2.6]]; AMB.ok = true;
})();
