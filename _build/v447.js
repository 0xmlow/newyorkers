/* ================================================================
   v447 THE EAST BEACH ILLUSIONS, AND THE HOLLOW FACE (2026-11-24)
   The sideshow row filled the west boardwalk; the east beach was bare sand. It now holds a second walk of
   illusions, the ones that need real space and real depth, each with a navy lectern and a gold plaque.
   The first: a marble head (Poly Haven's bust, CC0) turns slowly on a column. Only its face is there: a shell,
   hollow behind. When the face turns away you are looking into the inside of a mask, and your brain refuses it:
   the hollow pops out into a second face that turns the wrong way and seems to follow you (Richard Gregory's
   hollow mask; we have seen convex faces all our lives and never a concave one). eastLabel() and eastFeet() are
   shared by v448 to v453. ?eastbeach=0 off.
   ================================================================ */
const EASTB = { list: [] };
window.__EASTB = EASTB;
function eastAt(deg, r) { const a = deg * PI / 180, x = Math.sin(a) * r, z = Math.cos(a) * r, nx = -Math.sin(a), nz = -Math.cos(a); return { x, z, g: ground(x, z), nx, nz, tx: nz, tz: -nx, ry: Math.atan2(nx, nz), a }; }
function eastLabel(deg, r, title, line) {
  const P = eastAt(deg, r); EASTB.navy = EASTB.navy || new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.55, metalness: 0.2 });
  const t = signTex([{ t: title, s: 0.3 }, { t: line, s: 0.12 }], 1024, 384, '#16233f', '#c9a24a');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.0, 8), EASTB.navy); pole.position.set(P.x, P.g + 0.5, P.z); scene.add(pole);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.35 })); pl.rotation.order = 'YXZ'; pl.rotation.set(-0.7, P.ry + PI, 0); pl.position.set(P.x, P.g + 1.05, P.z); scene.add(pl);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.4, 0.03), EASTB.navy); bk.rotation.order = 'YXZ'; bk.rotation.set(-0.7, P.ry + PI, 0); bk.position.set(P.x - P.nx * 0.02, P.g + 1.04, P.z - P.nz * 0.02); scene.add(bk);
  post(P.x, P.z, 0.25, -5, 1.3); EASTB.list.push({ deg, title }); return P;
}
function eastFeet(x, z, ry) {
  if (!EASTB.feetT) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const c = cv.getContext('2d'); if (c && c.ellipse) { c.fillStyle = '#c9a24a'; [[44, 1], [84, -1]].forEach(([fx, s]) => { c.beginPath(); c.ellipse(fx, 70, 15, 30, s * 0.08, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(fx + s * 2, 30, 11, 12, 0, 0, PI * 2); c.fill(); }); } EASTB.feetT = new THREE.CanvasTexture(cv); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: EASTB.feetT, transparent: true, roughness: 0.6, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, ry, 0); m.position.set(x, ground(x, z) + 0.04, z); scene.add(m); return m;
}
(function hollowFace() {
  if (!LOOK.on || /eastbeach=0/.test(location.search) || !window.__PH || !PH.on) return;
  const P = eastAt(40, 120); eastLabel(43, 115.5, 'WHICH WAY IS SHE LOOKING?', 'ONLY THE FRONT OF THIS FACE EXISTS. WATCH THE BACK COME ROUND.');
  const stone = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.7 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.25, 24), stone); col.position.set(P.x, P.g + 0.625, P.z); col.castShadow = col.receiveShadow = true; scene.add(col); post(P.x, P.z, 0.5, -5, 3);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), stone); cap.position.set(P.x, P.g + 1.29, P.z); scene.add(cap);
  phLoad('isl_bust').then(A => {
    // keep only the front half: the face shell, hollow behind
    const box = new THREE.Box3(); A.parts.forEach(pt => { const g = pt.geo.clone(); g.applyMatrix4(pt.m4); g.computeBoundingBox(); box.union(g.boundingBox); });
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), cut = c.z + sz.z * 0.05;
    const G = new THREE.Group(), s = 1.25 / sz.y;
    A.parts.forEach(pt => { const g = pt.geo.clone(); g.applyMatrix4(pt.m4); const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position, keep = [];
      for (let i = 0; i < p.count; i += 3) { const zc = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3; if (zc > cut) keep.push(i); }
      const out = new THREE.BufferGeometry(); Object.keys(ng.attributes).forEach(k => { const a = ng.attributes[k], n = a.itemSize, arr = new Float32Array(keep.length * 3 * n); keep.forEach((i, j) => { for (let v = 0; v < 3; v++) for (let q = 0; q < n; q++) arr[(j * 3 + v) * n + q] = a.array[(i + v) * n + q]; }); out.setAttribute(k, new THREE.BufferAttribute(arr, n)); });
      out.translate(-c.x, -box.min.y, -c.z); const m = pt.mat.clone(); m.side = THREE.DoubleSide; const mesh = new THREE.Mesh(out, m); mesh.castShadow = true; G.add(mesh); });
    G.scale.setScalar(s); G.position.set(P.x, P.g + 1.33, P.z); G.rotation.y = P.ry + PI; scene.add(G); EASTB.face = G; EASTB.faceRy = P.ry + PI;
  }).catch(e => { EASTB.err = e; console.warn('v447', e); });
})();
window.__FRAMES.push(dt => { try { if (EASTB.face && camera.position.distanceTo(EASTB.face.position) < 60) EASTB.face.rotation.y += dt * 0.32; } catch (e) { } });
