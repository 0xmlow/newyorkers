/* ================================================================
   v199 THE LOOK: THE TOWER CRANE (2026-11-23)
   The crane over BUIDL was an orange post with an orange beam. It is now a lattice tower crane: a square mast of
   four chords laced with diagonals, a slewing cab at the top, a triangular lattice jib running out to the hook
   and a counter jib with its concrete blocks, all turning together as before. ?crane=0 off.
   ================================================================ */
(function towerCrane() {
  if (!FAC_ON || /crane=0/.test(location.search) || typeof crane === 'undefined' || !crane) return;
  const cxr = -34, czr = -58, cg = ground(cxr, czr), H = 26, M = MAT.orange, a = 0.55;
  scene.traverse(o => { const p = o.isMesh && o.geometry && o.geometry.parameters; if (p && p.width === 1.2 && p.height === 26 && Math.abs(o.position.x - cxr) < 0.1) o.visible = false; });
  crane.children.forEach(ch => { const p = ch.geometry && ch.geometry.parameters; if (p && p.width === 30) ch.visible = false; });
  const bars = [], localBars = [];
  const bar = (list, A, B, t) => list.push([A, B, t]);
  [[-a, -a], [a, -a], [a, a], [-a, a]].forEach(([x, z]) => bar(bars, new V3(cxr + x, cg, czr + z), new V3(cxr + x, cg + H, czr + z), 0.12));
  for (let y = 0; y < H - 0.1; y += 1.6) { const y1 = Math.min(H, y + 1.6); [[[-a, -a], [a, -a]], [[a, -a], [a, a]], [[a, a], [-a, a]], [[-a, a], [-a, -a]]].forEach(([[ax, az], [bx, bz]], k) => {
    bar(bars, new V3(cxr + ax, cg + y, czr + az), new V3(cxr + bx, cg + y, czr + bz), 0.06); bar(bars, new V3(cxr + ax, cg + (k % 2 ? y : y1), czr + az), new V3(cxr + bx, cg + (k % 2 ? y1 : y), czr + bz), 0.05); }); }
  // jib: triangular truss along local +x from -9 (counter jib) to 24, apex up
  const top = (x) => new V3(x, 1.4, 0), bl = (x) => new V3(x, 0, -0.5), br = (x) => new V3(x, 0, 0.5);
  bar(localBars, bl(-1), bl(24), 0.08); bar(localBars, br(-1), br(24), 0.08); bar(localBars, top(-1), top(22), 0.08);
  for (let x = -1; x < 24 - 0.1; x += 1.5) { const x1 = x + 1.5; bar(localBars, bl(x), br(x), 0.05); bar(localBars, bl(x), top(x1 > 22 ? 22 : x1), 0.045); bar(localBars, br(x), top(x1 > 22 ? 22 : x1), 0.045); }
  bar(localBars, new V3(-9, 0, -0.5), new V3(-1, 0, -0.5), 0.1); bar(localBars, new V3(-9, 0, 0.5), new V3(-1, 0, 0.5), 0.1); bar(localBars, new V3(0, 3.5, 0), new V3(-8.5, 0.1, 0), 0.04); bar(localBars, new V3(0, 3.5, 0), new V3(22, 1.45, 0), 0.04);
  bar(localBars, new V3(0, 0, 0), new V3(0, 3.5, 0), 0.14);
  const mk = (list, parent) => { const im = new THREE.InstancedMesh(FAC_BOX, M, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), X = new V3(1, 0, 0);
    list.forEach(([A, B, t], i) => { const v = new V3().subVectors(B, A); q.setFromUnitVectors(X, v.clone().normalize()); m4.compose(A.clone().addScaledVector(v, 0.5), q, new V3(v.length(), t, t)); im.setMatrixAt(i, m4); }); im.castShadow = true; parent.add(im); return im; };
  mk(bars, scene); mk(localBars, crane);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.3), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.5 })); cab.position.set(1.0, -0.6, 1.0); crane.add(cab);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x1a2a33, roughness: 0.1, metalness: 0.6 })); win.position.set(1.71, -0.4, 1.0); win.rotation.y = PI / 2; crane.add(win);
})();
