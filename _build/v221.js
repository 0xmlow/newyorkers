/* ================================================================
   v221 THE LOOK: THE DOG RUN (2026-11-23)
   The dog run gets what the ones in Tompkins Square and Washington Square have: a parks drinking fountain by the
   gate with a dog bowl at its foot, a pea gravel border round the fence, a bench inside along the back, a tyre
   jump and a little A frame in the corners, a bag dispenser on a post, tennis balls nobody will ever pick up, and
   the green parks sign with the rules.
   ?dogrun2=0 turns it off.
   ================================================================ */
const DR2 = {};
window.__DR2 = DR2;
(function dogRunDress() {
  if (!FAC_ON || /dogrun2=0/.test(location.search) || !window.__DRUN || DRUN.g0 == null) return;
  const x0 = DRUN_AT.x, z0 = DRUN_AT.z, hx = DRUN_AT.w / 2, hz = DRUN_AT.l / 2, g0 = DRUN.g0;
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  FACM.benchW = FACM.benchW || new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.75 });
  FACM.gravel = FACM.gravel || new THREE.MeshStandardMaterial({ color: 0x6a645b, roughness: 1 });
  FACM.tyre = FACM.tyre || new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  FACM.agil = FACM.agil || new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.6 });
  // ---- pea gravel border
  const b = 0.6; [[0, -hz - b / 2, DRUN_AT.w + 2 * b, b], [0, hz + b / 2, DRUN_AT.w + 2 * b, b], [-hx - b / 2, 0, b, DRUN_AT.l], [hx + b / 2, -hz / 2 - 0.4, b, hz - 0.8], [hx + b / 2, hz / 2 + 0.4, b, hz - 0.8]]
    .forEach(([u, v, w, d]) => facPut('gravel', x0 + u, g0 + 0.02, z0 + v, w, 0.04, d, 0));
  // ---- the bench inside along the back fence
  { const x = x0 - hx + 0.4; for (let k = 0; k < 3; k++) facPut('benchW', x + (k - 1) * 0.12, g0 + 0.45, z0, 0.1, 0.04, 2.2, 0); for (let k = 0; k < 2; k++) facPut('benchW', x - 0.2, g0 + 0.62 + k * 0.14, z0, 0.04, 0.1, 2.2, 0);
    [-0.9, 0.9].forEach(d => facPut('iron', x, g0 + 0.22, z0 + d, 0.4, 0.44, 0.06, 0)); }
  // ---- a tyre jump in one corner, an A frame in the other
  { const x = x0 + hx - 1.3, z = z0 - hz + 1.2, t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 8, 18), FACM.tyre); t.position.set(x, g0 + 0.62, z); t.rotation.y = PI / 2; t.castShadow = true; scene.add(t);
    [-0.5, 0.5].forEach(d => facPut('agil', x, g0 + 0.5, z + d, 0.05, 1.0, 0.05, 0)); facPut('agil', x, g0 + 1.0, z, 0.05, 0.05, 1.05, 0);
    [-0.25, 0.25].forEach(d => facPut('galv', x, g0 + 0.95 - 0.0, z + d, 0.01, 0.1, 0.01, 0)); }
  { const x = x0 + hx - 1.4, z = z0 + hz - 1.4, L2 = 1.3, h = 0.75, a = Math.atan2(h, L2);
    [-1, 1].forEach(s => { const m = new THREE.Mesh(FAC_BOX, FACM.agil); m.scale.set(Math.hypot(L2, h), 0.04, 0.8); m.position.set(x + s * L2 / 2, g0 + h / 2, z); m.rotation.z = -s * a; m.castShadow = true; scene.add(m);
      for (let i = 1; i < 4; i++) { const sx = x + s * (L2 * i / 4); facPut('white', sx, g0 + h * (1 - i / 4) + 0.03, z, 0.03, 0.01, 0.8, 0); } }); }
  // ---- the fountain outside the gate, with a dog bowl at its foot
  { const x = x0 + hx + 1.3, z = z0 + 2.4; const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.85, 12), FACM.iron); ped.position.set(x, g0 + 0.43, z); ped.castShadow = true; scene.add(ped);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.13, 0.13, 16), FACM.iron); bowl.position.set(x, g0 + 0.91, z); scene.add(bowl);
    const db = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 16), FACM.iron); db.position.set(x + 0.32, g0 + 0.05, z); scene.add(db);
    const wat = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), new THREE.MeshStandardMaterial({ color: 0x3a5866, roughness: 0.04, metalness: 0.3 })); wat.rotation.x = -PI / 2; wat.position.set(x + 0.32, g0 + 0.085, z); scene.add(wat);
    post(x, z, 0.3, -5, g0 + 1); }
  // ---- bag dispenser on a post, the parks sign
  { const x = x0 + hx + 1.1, z = z0 - 1.6; facPut('iron', x, g0 + 0.7, z, 0.06, 1.4, 0.06, 0); facPut('agil', x + 0.06, g0 + 1.2, z, 0.12, 0.3, 0.2, 0); facPut('white', x + 0.13, g0 + 1.08, z, 0.01, 0.05, 0.08, 0); post(x, z, 0.1, -5, g0 + 1.4);
    const sg = signTex([{ t: 'N3W PARKS · DOG RUN', s: 0.2 }, { t: 'DOGS OFF LEASH INSIDE ONLY', s: 0.11 }, { t: 'CLEAN UP AFTER YOUR DOG', s: 0.11 }, { t: 'CLOSE BOTH GATES', s: 0.11 }], 768, 512, '#2b4a32', '#efe8da');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshStandardMaterial({ map: sg, roughness: 0.6, side: THREE.DoubleSide })); m.position.set(x, g0 + 1.75, z); m.rotation.y = PI / 2; scene.add(m);
    facPut('iron', x - 0.01, g0 + 1.5, z, 0.02, 0.9, 0.04, 0); }
  // ---- tennis balls nobody will pick up
  { const bm = new THREE.MeshStandardMaterial({ color: 0xd8f03a, roughness: 0.75 }), bg = new THREE.SphereGeometry(0.034, 10, 8), im = new THREE.InstancedMesh(bg, bm, 7), o = new THREE.Object3D();
    [[-3.6, -3.7], [-3.9, 3.5], [3.5, 0.6], [-1.2, -3.9], [2.0, 3.9], [-3.95, 1.0], [3.8, -3.2]].forEach(([u, v], i) => { o.position.set(x0 + u, g0 + 0.035, z0 + v); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = true; scene.add(im); }
  facFlush();
  DR2.ok = true;
})();
