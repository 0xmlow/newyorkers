/* ================================================================
   v448 THE CHAIR THAT IS NOT THERE (2026-11-24)
   A Beuchet chair. Stand on the gold footprints and there is one wooden chair on a plinth in front of you. Take
   one step to the side and it comes apart: the legs are the chair you thought, but the seat and the back are a
   second, giant piece three times the size and seven metres further down the beach, held up in the air on a
   steel post. From the footprints the two line up exactly (the far piece is the near chair scaled about your
   eye), so your brain glues them into one ordinary chair. Poly Haven's dining chair, CC0. ?eastbeach=0 off.
   ================================================================ */
(function beuchetChair() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search) || !window.__PH || !PH.on) return;
  const V = eastAt(55, 112), E = new V3(V.x, V.g + 1.65, V.z), out = new V3(-V.nx, 0, -V.nz), side = new V3(V.tx, 0, V.tz);
  eastFeet(V.x, V.z, V.ry + PI); eastLabel(52.5, 112.5, 'STAND ON THE FEET. THEN STEP ASIDE.', 'ONE CHAIR, UNTIL YOU MOVE.');
  const d1 = 5, k = 2.6, near = E.clone().addScaledVector(out, d1); near.y = 0; const ng = ground(near.x, near.z);
  const stone = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.7 }), PLH = 1.12;
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.9, PLH, 0.9), stone); pl.position.set(near.x, ng + PLH / 2, near.z); pl.rotation.y = V.ry; pl.castShadow = pl.receiveShadow = true; scene.add(pl); post(near.x, near.z, 0.6, -5, 3);
  phLoad('isl_bchair').then(A => {
    const box = new THREE.Box3(); const geos = A.parts.map(pt => { const g = pt.geo.clone(); g.applyMatrix4(pt.m4); g.computeBoundingBox(); box.union(g.boundingBox); return [g, pt.mat]; });
    const c = box.getCenter(new V3()), sz = box.getSize(new V3()), s = 0.95 / sz.y, seatY = box.min.y + sz.y * 0.47;
    const legs = new THREE.Group(), top = new THREE.Group();
    geos.forEach(([g, m]) => { const ng2 = g.index ? g.toNonIndexed() : g, p = ng2.attributes.position, lo = [], hi = [];
      for (let i = 0; i < p.count; i += 3) { const yc = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3; (yc < seatY ? lo : hi).push(i); }
      [[lo, legs], [hi, top]].forEach(([list, grp]) => { if (!list.length) return; const o = new THREE.BufferGeometry(); Object.keys(ng2.attributes).forEach(kk => { const a = ng2.attributes[kk], n = a.itemSize, arr = new Float32Array(list.length * 3 * n); list.forEach((i, j) => { for (let v = 0; v < 3; v++) for (let q = 0; q < n; q++) arr[(j * 3 + v) * n + q] = a.array[(i + v) * n + q]; }); o.setAttribute(kk, new THREE.BufferAttribute(arr, n)); });
        o.translate(-c.x, -box.min.y, -c.z); const mesh = new THREE.Mesh(o, m); mesh.castShadow = true; grp.add(mesh); }); });
    // the near chair (legs only) on the plinth, facing the footprints
    legs.scale.setScalar(s); legs.position.set(near.x, ng + PLH, near.z); legs.rotation.y = V.ry; scene.add(legs);
    // the far piece: the same chair top, scaled by k about the eye
    const pos = new V3(near.x, ng + PLH, near.z).sub(E).multiplyScalar(k).add(E); top.scale.setScalar(s * k); top.position.copy(pos); top.rotation.y = V.ry; scene.add(top);
    const sy = pos.y + seatY * 0 , postH = pos.y + (seatY - box.min.y) * s * k - ground(pos.x, pos.z);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, postH, 8), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.4, metalness: 0.8 })); st.position.set(pos.x, ground(pos.x, pos.z) + postH / 2, pos.z); st.castShadow = true; scene.add(st); post(pos.x, pos.z, 0.3, -5, 8);
    EASTB.chair = { legs, top, pos };
  }).catch(e => console.warn('v448', e));
})();
