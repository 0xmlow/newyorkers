/* ================================================================
   v449 THE TRIANGLE THAT IS NOT THERE (2026-11-24)
   Three black discs, each with a wedge cut out, stand on thin white posts at three different distances (six,
   nine and thirteen metres) against a white wall at the back. From anywhere else they are three bitten discs at
   random. From the gold footprints their sizes and their bites line up, and a bright white triangle appears
   between them, whiter than the wall behind it, with edges you can see. There are no edges. Gaetano Kanizsa,
   1955, here built in depth so it only exists from one spot. ?eastbeach=0 off.
   ================================================================ */
(function kanizsa() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const V = eastAt(70, 111.5), E = new V3(V.x, V.g + 1.65, V.z), out = new V3(-V.nx, 0, -V.nz), right = new V3(-V.tx, 0, -V.tz), up = new V3(0, 1, 0);
  eastFeet(V.x, V.z, V.ry + PI); eastLabel(67.5, 112.2, 'THE WHITEST TRIANGLE ON THE BEACH', 'STAND ON THE FEET. IT IS NOT THERE.');
  const D0 = 9, C = E.clone().addScaledVector(out, D0).addScaledVector(up, 0.55), R = 1.05, rD = 0.48;
  const white = new THREE.MeshBasicMaterial({ color: 0xf4f1ea }), black = new THREE.MeshBasicMaterial({ color: 0x0b0b0c, side: THREE.DoubleSide });
  const wallD = 17, wc = E.clone().addScaledVector(out, wallD).addScaledVector(up, 0.4); const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5), white); wall.position.copy(wc); wall.position.y = Math.max(wall.position.y, ground(wc.x, wc.z) + 3.25); wall.lookAt(E.x, wall.position.y, E.z); scene.add(wall);
  const wb = new THREE.Mesh(new THREE.BoxGeometry(9.1, 6.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.6 })); wb.position.copy(wall.position).addScaledVector(out, 0.08); wb.quaternion.copy(wall.quaternion); scene.add(wb);
  [[-4.4], [4.4]].forEach(([u]) => { const p = wall.position.clone().addScaledVector(right, u); post(p.x, p.z, 0.3, -5, 8); });
  const Ds = [6, 9, 13], angs = [90, 210, 330].map(d => d * PI / 180), postM = new THREE.MeshBasicMaterial({ color: 0xf0ede6 });
  Ds.forEach((D, i) => { const Pv = C.clone().addScaledVector(right, Math.cos(angs[i]) * R).addScaledVector(up, Math.sin(angs[i]) * R), k = D / D0, Pw = Pv.clone().sub(E).multiplyScalar(k).add(E);
    const m = new THREE.Object3D(); m.position.copy(Pw); m.lookAt(E); m.updateMatrixWorld(true); const X = new V3().setFromMatrixColumn(m.matrixWorld, 0), Y = new V3().setFromMatrixColumn(m.matrixWorld, 1);
    const toC = C.clone().sub(Pv), th = Math.atan2(toC.dot(Y), toC.dot(X)), gap = PI / 3;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(rD * k, 64, th + gap / 2, PI * 2 - gap), black); disc.position.copy(Pw); disc.quaternion.copy(m.quaternion); scene.add(disc);
    const gy = ground(Pw.x, Pw.z), ph = Pw.y - rD * k - gy; if (ph > 0.05) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * k, 0.025 * k, ph, 6), postM); st.position.set(Pw.x, gy + ph / 2, Pw.z); scene.add(st); }
    post(Pw.x, Pw.z, 0.3, -5, 6); });
  EASTB.kanizsa = true;
})();
