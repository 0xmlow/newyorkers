/* MoMLOW people: visitors with eye flowers for heads on every floor, walking the rings and the rooms, stopping in front
   of works; the guard by the desk.
   2026-10-28: every visitor is a whole New Yorker from the cast we generated (the ON LOCATION Tripo characters, their eye
   flower heads modelled in), cut to 2,500 tris and a 512 px texture by _build/crowd_pass.py. One mesh and one material
   per character, shared by every copy. The old cylinder visitor is still built and hidden only when the model lands, so a
   failed load leaves the museum as it was. ?crowd=old keeps the cylinders.
   2026-10-28, later: the cast is rigged (UPGRADE ALL ROOMS 2026-10-28/rig, copied into assets/glb/rig). The nearest
   visitors are skinned figures from rigcrowd.js: they play `walk` at the speed the rig recorded for them while they move
   (they move at that speed, so the planted foot stays put) and `idle` while they stand, crossfading in 0.3 s from a random
   start time. Standing visitors and the guard turn the `head` bone toward you (60 degrees at most, 25 for the Bartender
   and Susan, whose hand or bow rides the head past that), the body only beyond. At most 20 skinned figures (8 on a
   phone), the nearest 8 (4) at 3,000 tris and the rest at 800; beyond the cap a visitor is the static whole cast with
   the coded bob. The Blind Woman is rigged idle only (her cane is planted), so she stands; the Assistant was not rigged
   and walks as the Gown. ?rig=off brings back the static whole cast everywhere. */
(function (M) {
  "use strict";
  const { world, MAT, rnd, FLOORS: F } = M;
  const flowerTex = M.img("assets/flower.png");
  const flowerMat = new THREE.MeshBasicMaterial({ map: flowerTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.2 });
  const npcs = M.npcs = [];
  // museumgoers from the cast (no real person's likeness: every head is an eye flower), only models with legs to the feet
  // (usher, agent, auggie, bookseller, broker, dad, hijacker, jeweler, sonny and tracksuit stop above the knee); the guard is the Bartender
  const CAST = ["annieh", "assistant", "editor", "rosemary", "blindwoman", "gown", "hustler", "workgirl", "oscar", "wiseguy", "susan", "cabbie"];
  const NEW = M.Q.get("crowd") !== "old";
  // the rig table (rig/out/rig_manifest.json): walk speed in m/s at 1.88 m, or 0 for idle only; the look-at clamp in degrees
  const RIG = { annieh: [0.457, 60], editor: [0.457, 60], rosemary: [0.457, 60], gown: [0.55, 60], hustler: [0.666, 60], workgirl: [0.778, 60],
    oscar: [0.869, 60], wiseguy: [0.756, 60], susan: [0.756, 25], cabbie: [0.711, 60], bartender: [0.778, 25], blindwoman: [0, 60] };
  const RIGGED = NEW && M.Q.get("rig") !== "off" && !!window.RigCrowd;
  // files that do not face +Z (2026-10-28, UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing): the yaw goes inside the figure's root.
  // The rig files of the Blind Woman and the Hustler face 90 degrees off; the static crowd_hustler_full faces the same way
  // as its rig file, so it takes the same turn and the switch between the static and skinned tiers does not spin him.
  // Susan (2026-10-28, MLow: "doll face forward"): her rig file was re-rigged facing +Z; crowd_susan_full was baked with the
  // eye flower, the back of her head, to the front, so the static tier turns half way to match.
  const RIG_FACE = { blindwoman: -Math.PI / 2, hustler: -Math.PI / 2 }, STATIC_FACE = { hustler: -Math.PI / 2, susan: Math.PI };
  const SUB = { assistant: "gown" };   // not rigged: walks as another cast member
  const LOD = RIGGED ? new RigCrowd.Lod({ cap: M.lo() ? 8 : 20, full: M.lo() ? 4 : 8 }) : null;
  const bodies = {};
  function body(name) {
    if (!bodies[name]) bodies[name] = new Promise((res) => {
      const L = M.gltf || new THREE.GLTFLoader();
      L.load(`assets/glb/crowd_${name}_full.glb`, (r) => {
        let mesh = null; r.scene.traverse((m) => { if (!mesh && m.isMesh) mesh = m; });
        if (!mesh) return res(null);
        mesh.geometry.computeBoundingBox();
        const mat = mesh.material; mat.envMapIntensity = 0.5; if (mat.map) mat.map.anisotropy = Math.min(4, M.ANISO || 1);
        res({ geo: mesh.geometry, mat, h: mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y });
      }, undefined, () => { (window.__propFail = window.__propFail || []).push("crowd_" + name + "_full"); res(null); });
    });
    return bodies[name];
  }
  const rigMat = (m) => { m.envMapIntensity = 0.5; if (m.map) m.map.anisotropy = Math.min(4, M.ANISO || 1); return m; };
  function rigFile(name, lite) { return RigCrowd.load(M.gltf || new THREE.GLTFLoader(), `assets/glb/rig/${name}${lite ? "_lite" : ""}.glb`); }
  M.crowdStats = () => ({ on: NEW, rigged: RIGGED, cast: npcs.filter((n) => n.rig).length, of: npcs.length, lod: LOD ? Object.assign({}, LOD.stats) : null });
  // a visitor's tier: 0 the full rig, 1 the lite rig, 2 the static whole cast
  function setTier(n, t) {
    const show = (fig) => { for (const k of [0, 1]) if (n.figs[k]) n.figs[k].root.visible = n.figs[k] === fig; if (n.rig) n.rig.visible = !fig; n.fig = fig; };
    if (t === 2) { show(null); return; }
    if (n.figs[t]) { show(n.figs[t]); n.fig.setMoving(n.moving, 0); return; }
    if (n.loading[t]) return; n.loading[t] = true;
    const rg = RIG[n.cast];
    rigFile(n.cast, t === 1 && rg[0] > 0).then((a) => {
      if (!a) { n.rigOK = false; n.item.rig = false; return; }
      const fig = new RigCrowd.Figure(a, { scale: n.tall / 1.88, speed: rg[0] || 0.7, walks: rg[0] > 0, lookMax: rg[1] * Math.PI / 180, yaw: RIG_FACE[n.cast] || 0, shadow: M.hi() && t === 0, material: rigMat, moving: n.moving });
      fig.root.visible = false; n.g.add(fig.root); n.figs[t] = fig;
      for (const o of n.old) o.visible = false;
      if (n.item.tier === t) show(fig);
    });
  }
  M.visitor = function (path, y, speed, cast) {
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
    const n = { g, path, i: (start + 1) % path.length, y, speed: speed || rnd(0.7, 1.05), pause: rnd(0, 2), legs, head, phase: Math.random() * 6, yaw: 0, moving: false };
    npcs.push(n);
    if (NEW) {
      const k = npcs.length - 1, tall = 1.72 + ((k * 37) % 11 - 5) * 0.012;
      let name = cast || CAST[(k * 7 + 3) % CAST.length];
      if (RIGGED && SUB[name]) name = SUB[name];
      n.cast = name; n.tall = tall; n.old = g.children.slice();
      if (RIGGED && RIG[name]) {
        const rg = RIG[name];
        if (rg[0] > 0) { if (!speed || speed > 0) n.speed = rg[0] * (tall / 1.88) * rnd(0.94, 1.06); }
        else { n.still = true; n.yaw = n.idleYaw = Math.random() * Math.PI * 2; g.rotation.y = n.yaw; }   // idle only: stands where it was put
        n.figs = [null, null]; n.loading = [false, false]; n.fig = null;
        n.item = { rig: true, pos: () => n.g.position, setTier: (t) => setTier(n, t), n, get fig() { return n.fig; } }; LOD.add(n.item);
      }
      body(name).then((b) => {
        if (!b) return;
        const rig = new THREE.Group(), m = new THREE.Mesh(b.geo, b.mat);
        m.scale.setScalar(tall / b.h); m.rotation.y = STATIC_FACE[name] || 0; m.castShadow = M.hi(); m.receiveShadow = true; rig.add(m); g.add(rig);
        for (const o of n.old) o.visible = false;
        n.rig = rig; if (n.fig) rig.visible = false;
      });
    }
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
    // the guard: by the desk, still. The Bartender (waistcoat, bow tie). Rigged, his head follows you and his body turns
    // only past the 25 degrees his shaker hand allows; static, his whole body turns
    { const g = M.visitor([[11.6, 3]], 0, 0, "bartender"); g.rotation.y = -Math.PI / 2; const gd = npcs[npcs.length - 1]; gd.still = true; gd.guard = true; gd.yaw = gd.idleYaw = -Math.PI / 2; }
  };
  const LOOK = 7;   // metres: a standing visitor this close, on your floor, looks at you
  // turn the body toward yaw `want` by what the head clamp left over, eased
  function bodyTurn(n, over, dt, k) { if (Math.abs(over) < 1e-3) return; n.yaw += over * Math.min(1, dt * k); n.g.rotation.y = n.yaw; }
  M.tickPeople = function (dt, t, P) {
    for (const n of npcs) {
      const r = n.rig, f = n.fig;
      if (n.still) {
        const dx = P.x - n.g.position.x, dz = P.z - n.g.position.z, want = Math.atan2(dx, dz);
        if (f) {
          n.moving = false; f.setMoving(false, 0.3);
          const near = Math.hypot(dx, dz) < (n.guard ? 14 : LOOK) && Math.abs(P.y - 1.6 - n.y) < 2.5;
          if (near) bodyTurn(n, f.lookToward(want - n.yaw), dt, 1.5); else f.lookToward(null);
        } else if (r) { let d = want - n.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (n.guard || Math.hypot(dx, dz) < LOOK) { n.yaw += d * Math.min(1, dt * 1.5); n.g.rotation.y = n.yaw; } r.position.y = Math.sin(t * 1.3 + n.phase) * 0.004; }
        else n.head.rotation.y = want - n.g.rotation.y;
        continue;
      }
      if (n.pause > 0) {
        n.pause -= dt; n.moving = false;
        if (f) {
          f.setMoving(false, 0.3);
          const dx = P.x - n.g.position.x, dz = P.z - n.g.position.z;
          if (Math.hypot(dx, dz) < LOOK && Math.abs(P.y - 1.6 - n.y) < 2.5) bodyTurn(n, f.lookToward(Math.atan2(dx, dz) - n.yaw), dt, 1.2); else f.lookToward(null);
        } else if (r) { r.rotation.y = Math.sin(t * 0.7 + n.phase) * 0.3; r.position.y *= 0.85; r.rotation.z *= 0.85; r.rotation.x *= 0.85; }
        else n.head.rotation.y = Math.sin(t * 0.7 + n.phase) * 0.4;
      }
      else {
        const tgt = n.path[n.i], dx = tgt[0] - n.g.position.x, dz = tgt[1] - n.g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.25) { n.i = (n.i + 1) % n.path.length; n.pause = rnd(1.5, 5); }
        else {
          const want = Math.atan2(dx, dz); let dy = want - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          // a rigged walker turns on the spot first when the corner is sharp, so it never walks sideways
          const go = f ? Math.max(0, Math.cos(dy)) : 1;
          n.yaw += dy * Math.min(1, dt * 4); n.g.rotation.y = n.yaw; n.g.position.x += Math.sin(n.yaw) * n.speed * go * dt; n.g.position.z += Math.cos(n.yaw) * n.speed * go * dt;
          n.phase += dt * 7 * n.speed; n.moving = true; n.go = go;
          if (f) { f.setMoving(true, 0.3); f.lookToward(null); }
          else if (r) {
            // a step: up on each footfall, a roll from foot to foot, a little lean into the walk, the turn into the corner
            const s = Math.sin(n.phase);
            r.position.y = Math.abs(s) * 0.035; r.rotation.z = s * 0.04 - dy * 0.08; r.rotation.x = 0.05; r.rotation.y *= 0.85;
          } else { n.legs[0].rotation.x = Math.sin(n.phase) * 0.5; n.legs[1].rotation.x = -Math.sin(n.phase) * 0.5; n.head.rotation.y = 0; }
        }
      }
      n.g.position.y = n.y;
    }
    // the skinned figures: rank by distance every 0.3 s, then run their mixers (timed for the budget)
    if (LOD) LOD.tick(dt, M.camera, (it) => { const n = it.n; if (n.fig) n.fig.update(dt, n.moving ? n.speed * Math.max(0.35, n.go || 1) : 0); });
  };
})(window.M);
