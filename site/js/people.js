/* MoMLOW people: visitors with eye flowers for heads on every floor, walking the rings and the rooms, stopping in front
   of works; the guard who never moves. */
(function (M) {
  "use strict";
  const { world, MAT, rnd, FLOORS: F } = M;
  const flowerTex = M.img("assets/flower.png");
  const flowerMat = new THREE.MeshBasicMaterial({ map: flowerTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.2 });
  const npcs = M.npcs = [];
  M.visitor = function (path, y, speed) {
    const g = new THREE.Group(); const coat = MAT.coats[Math.floor(Math.random() * MAT.coats.length)], skin = MAT.skin[Math.floor(Math.random() * MAT.skin.length)];
    const cm = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.9 }), sm = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 }), pm = new THREE.MeshStandardMaterial({ color: [0x1b1d21, 0x24394a, 0x3a3a3a][Math.floor(Math.random() * 3)], roughness: 0.9 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 10), cm); torso.position.y = 1.05; g.add(torso);
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.3, 10), pm); hips.position.y = 0.6; g.add(hips);
    const legs = [];
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8), pm); l.position.set(s * 0.09, 0.25, 0); g.add(l); legs.push(l); const sh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), MAT.ink); sh.position.set(s * 0.09, 0.03, 0.04); g.add(sh); }
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.55, 8), cm); a.position.set(s * 0.26, 1.02, 0); a.rotation.z = s * 0.12; g.add(a); const h = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), sm); h.position.set(s * 0.29, 0.72, 0); g.add(h); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8), sm); neck.position.y = 1.4; g.add(neck);
    const head = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), flowerMat); head.position.y = 1.78; g.add(head);
    g.traverse(m => { if (m.isMesh) m.castShadow = M.hi(); });
    const start = Math.floor(Math.random() * path.length);
    g.position.set(path[start][0], y, path[start][1]); world.add(g);
    npcs.push({ g, path, i: (start + 1) % path.length, y, speed: speed || rnd(0.7, 1.05), pause: rnd(0, 2), legs, head, phase: Math.random() * 6, yaw: 0 });
    return g;
  };
  // paths: the lobby, the store, the cafe, each floor's ring and one room per floor, the garden, both streets
  const ring = (y) => [[-12.5, 3], [12.5, 3], [12.5, 8], [12.5, 32], [-12.5, 32], [-12.5, 8]].map(p => p);
  const roomPath = (r) => [[r.x0 + 2.5, r.z0 + 2.5], [r.x1 - 2.5, r.z0 + 2.5], [r.x1 - 2.5, r.z1 - 2.5], [r.x0 + 2.5, r.z1 - 2.5]];
  M.buildPeople = function () {
    const n = M.lo() ? 0.5 : 1;
    const add = (k, f) => { for (let i = 0; i < Math.round(k * n); i++) f(); };
    add(5, () => M.visitor([[-6, 6], [6, 6], [6, 18], [6, 34], [-6, 34], [-6, 18]], 0));
    add(2, () => M.visitor([[-22, 5], [-32, 5], [-32, 18], [-22, 18]], 0));
    add(2, () => M.visitor([[18, 3], [34, 3], [34, 17], [18, 17]], 0));
    for (let k = 1; k < F.length; k++) {
      add(3, () => M.visitor(ring(F[k]), F[k]));
      const keys = Object.keys(M.ROOMS).filter(key => Math.abs(M.ROOMS[key].y - F[k]) < 0.1 && M.ROOMS[key].walls.length);
      for (const key of keys) if (Math.random() < 0.7) add(1, () => M.visitor(roomPath(M.ROOMS[key]), F[k]));
    }
    add(4, () => M.visitor([[-4, 43], [16, 43], [34, 46], [36, 54], [28, 63], [8, 64], [-10, 62], [-16, 52]], 0));
    add(3, () => M.visitor([[-40, -4], [-14, -4], [-3, -6], [8, -5], [40, -4], [8, -7], [-14, -7]], 0, rnd(1.0, 1.3)));
    add(2, () => M.visitor([[-30, 70], [30, 70]], 0, rnd(1.0, 1.3)));
    add(1, () => M.visitor([[-3, 8.5], [3, 8.5]], F[1]));
    // the guard: by the desk, still
    { const g = M.visitor([[11.6, 3]], 0); g.rotation.y = -Math.PI / 2; npcs[npcs.length - 1].still = true; }
  };
  M.tickPeople = function (dt, t, P) {
    for (const n of npcs) {
      if (n.still) { n.head.rotation.y = Math.atan2(P.x - n.g.position.x, P.z - n.g.position.z) - n.g.rotation.y; continue; }
      if (n.pause > 0) { n.pause -= dt; n.head.rotation.y = Math.sin(t * 0.7 + n.phase) * 0.4; }
      else {
        const tgt = n.path[n.i], dx = tgt[0] - n.g.position.x, dz = tgt[1] - n.g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.25) { n.i = (n.i + 1) % n.path.length; n.pause = rnd(1.5, 5); }
        else { const want = Math.atan2(dx, dz); let dy = want - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * Math.min(1, dt * 4); n.g.rotation.y = n.yaw; n.g.position.x += Math.sin(n.yaw) * n.speed * dt; n.g.position.z += Math.cos(n.yaw) * n.speed * dt; n.phase += dt * 7; n.legs[0].rotation.x = Math.sin(n.phase) * 0.5; n.legs[1].rotation.x = -Math.sin(n.phase) * 0.5; n.head.rotation.y = 0; }
      }
      n.g.position.y = n.y;
    }
  };
})(window.M);
