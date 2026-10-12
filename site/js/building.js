/* MoMLOW building: the block after MoMA, 11 West 53rd, through to 54th.
   Ground: the 53rd Street lobby running through to the Garden Lobby, the store west, the cafe east, escalators, the elevator.
   Floor 2: the Marron Atrium, open to the skylight, galleries around it. Floors 3 to 6: rings of galleries around the void.
   Floor 6: the special exhibition and the terrace. The sculpture garden to the north, 54th Street beyond its wall. */
(function (M) {
  "use strict";
  const { box, wall, floor, ceiling, slab, plate, addSolid, glassPane, sign, signTex, bench, rail, laylight, strip, point, surf, MAT, hPlane, keepOuts, FLOORS } = M;
  const F = FLOORS, FH = 5.7, ROOF = M.ROOF;
  const VOID = M.VOID = { x0: -11, x1: 11, z0: 10, z1: 30 };
  const STAIR = M.STAIR = { x0: -28, x1: -14, z0: 24, z1: 38 };          // the escalator well (cut from every floor plate)
  const LIFT = M.LIFT = { x0: 14, x1: 18, z0: 34, z1: 38 };
  M.ROOMS = {};                                                          // key -> {x0,x1,z0,z1,y,walls:[{ax,az,bx,bz,nx,nz,len}], name}
  M.escalators = []; M.laylights = [];

  /* ---------- a room: four walls with door gaps, a ceiling with laylights, hang segments ---------- */
  function room(key, x0, x1, z0, z1, y, opt) {
    opt = opt || {}; const h = opt.h || 5.0, doors = opt.doors || [], glass = opt.glass || [];
    const segs = [];
    const sides = [["s", x0, z0, x1, z0, 0, 1], ["n", x0, z1, x1, z1, 0, -1], ["w", x0, z0, x0, z1, 1, 0], ["e", x1, z0, x1, z1, -1, 0]];
    for (const [side, ax, az, bx, bz, nx, nz] of sides) {
      if (opt.skip && opt.skip.includes(side)) continue;
      const alongX = side === "s" || side === "n", a = alongX ? ax : az, b = alongX ? bx : bz;
      // split the wall at the doors, build the solid parts, keep each part as a hang segment
      const cuts = doors.filter(d => d.side === side).map(d => [d.a, d.b]).sort((p, q) => p[0] - q[0]);
      let at = a;
      const parts = [];
      for (const [da, db] of cuts) { if (da > at) parts.push([at, da]); at = db; }
      if (at < b) parts.push([at, b]);
      const isGlass = glass.includes(side);
      for (const [pa, pb] of parts) {
        if (isGlass) { glassPane(alongX ? (pa + pb) / 2 : ax, y + h / 2, alongX ? az : (pa + pb) / 2, pb - pa, h, alongX ? "z" : "x", true); continue; }
        if (alongX) wall(pa, az, pb, az, h, y, opt.mat); else wall(ax, pa, ax, pb, h, y, opt.mat);
        segs.push(alongX ? { ax: pa, az: az, bx: pb, bz: az, nx, nz, len: pb - pa, side } : { ax, az: pa, bx: ax, bz: pb, nx, nz, len: pb - pa, side });
      }
      // headers over the doors
      for (const [da, db] of cuts) { if (alongX) wall(da, az, db, az, h - 3.2, y + 3.2, opt.mat); else wall(ax, da, ax, db, h - 3.2, y + 3.2, opt.mat); }
    }
    ceiling(x0, z0, x1, z1, y + h);
    // laylights: a grid of soft panels, like the museum's ceilings
    const w = x1 - x0, d = z1 - z0, nx = Math.max(1, Math.round(w / 8)), nz = Math.max(1, Math.round(d / 8));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) M.laylights.push(laylight(x0 + (i + 0.5) * w / nx, y + h, z0 + (j + 0.5) * d / nz, Math.min(4.5, w / nx - 1.5), Math.min(4.5, d / nz - 1.5), opt.light || 0.9));
    point((x0 + x1) / 2, y + h - 0.7, (z0 + z1) / 2, opt.light || 0.9, Math.max(w, d) * 1.6);
    if (Math.max(w, d) > 18) { point(x0 + w * 0.25, y + h - 0.7, (z0 + z1) / 2, 0.6, w); point(x1 - w * 0.25, y + h - 0.7, (z0 + z1) / 2, 0.6, w); }
    const r = M.ROOMS[key] = { key, x0, x1, z0, z1, y, h, walls: segs, name: opt.name || key, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
    if (opt.bench !== false && Math.min(w, d) > 9) bench(r.cx, r.cz, d > w, y, 2.6);
    return r;
  }
  M.room = room;

  /* ---------- the streets: 53rd (south) and 54th (north), the neighbours, the skyline ---------- */
  // 53rd Street runs z -26..0: the near sidewalk -9..0, the road, the far sidewalk
  floor(-120, -9, 120, 0, 0, "pavers"); floor(-120, -20, 120, -9, 0.001, "asphalt"); floor(-120, -26, 120, -20, 0, "pavers");
  box(0, 0.07, -9.06, 240, 0.14, 0.24, MAT.shellDark, false); box(0, 0.07, -19.94, 240, 0.14, 0.24, MAT.shellDark, false);
  for (let x = -118; x < 118; x += 7) hPlane(x, -14.7, x + 2.6, -14.3, 0.02, MAT.strip, true, false);
  for (let z = -19; z < -9.5; z += 1.7) hPlane(-3.2, z, 3.2, z + 0.85, 0.02, MAT.strip, true, false);
  // 54th Street beyond the garden wall: z 66..92
  floor(-120, 66, 120, 75, 0, "pavers"); floor(-120, 75, 120, 86, 0.001, "asphalt"); floor(-120, 86, 120, 92, 0, "pavers");
  box(0, 0.07, 75, 240, 0.14, 0.24, MAT.shellDark, false); box(0, 0.07, 86, 240, 0.14, 0.24, MAT.shellDark, false);
  for (let x = -118; x < 118; x += 7) hPlane(x, 80.3, x + 2.6, 80.7, 0.02, MAT.strip, true, false);
  // the ground everywhere else
  floor(-120, -120, 120, -26, -0.01, "pavers"); floor(-120, 92, 120, 160, -0.01, "pavers"); floor(-120, 0, -40, 66, -0.01, "pavers"); floor(40, 0, 120, 66, -0.01, "pavers");
  // brownstones and towers across both streets, lit at night, and a skyline further out
  function winMat(col, w, h) {
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(1.6), map: M.WIN_DAY.clone(), emissiveMap: M.WIN_NIGHT.clone(), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
    m.map.needsUpdate = true; m.map.repeat.set(w / 7, h / 7); m.emissiveMap.needsUpdate = true; m.emissiveMap.repeat.set(w / 7, h / 7); M.windowMats.push(m); return m;
  }
  M.WIN_DAY = M.canvasTex((g) => { g.fillStyle = "#cfc6b8"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) { g.fillStyle = "#b8ad9c"; g.fillRect(x, y + 27, 256, 2); g.fillStyle = Math.random() < 0.08 ? "#f6e3b0" : "#2a3038"; g.fillRect(x + 7, y + 6, 18, 20); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + 7, y + 6, 18, 5); } }, 256, 256);
  M.WIN_NIGHT = M.canvasTex((g) => { g.fillStyle = "#101216"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) { const on = Math.random() < 0.62; g.fillStyle = on ? (Math.random() < 0.5 ? "#f6e3b0" : "#d8e6ff") : "#0a0b0e"; g.fillRect(x + 7, y + 6, 18, 20); } }, 256, 256);
  for (const t of [M.WIN_DAY, M.WIN_NIGHT]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  const facades53 = [[-96, 30, 26, 0x70665c], [-62, 30, 34, 0x5d6066], [-30, 28, 22, 0x7a6a58], [0, 26, 44, 0x60564e], [30, 28, 30, 0x6b6b64], [62, 30, 38, 0x6e655b], [96, 30, 26, 0x5a5550]];
  for (const [x, w, h, col] of facades53) { box(x, h / 2, -26 - 7, w, h, 14, winMat(col, w, h), true); box(x, 1.0, -26.3, w, 2.0, 0.6, surf("brick"), false); }
  const facades54 = [[-96, 30, 24, 0x6b6b64], [-62, 30, 30, 0x70665c], [-30, 28, 26, 0x5d6066], [0, 26, 22, 0x7a6a58], [30, 28, 28, 0x60564e], [62, 30, 36, 0x6e655b], [96, 30, 24, 0x5a5550]];
  for (const [x, w, h, col] of facades54) { box(x, h / 2, 92 + 7, w, h, 14, winMat(col, w, h), true); box(x, 1.0, 92.3, w, 2.0, 0.6, surf("brick"), false); }
  // the neighbours flanking the block and the garden
  box(-54, 14, 20, 28, 28, 40, winMat(0x6e655b, 28, 28), true); box(54, 15, 20, 28, 30, 40, winMat(0x645a50, 28, 30), true);
  box(-34, 9, 53, 28, 18, 26, winMat(0x736b60, 28, 18), true); box(54, 11, 53, 28, 22, 26, winMat(0x6e655b, 28, 22), true);
  // the skyline: Midtown towers in rings, far enough to sit in the fog
  M.srand();
  for (let i = 0; i < 70; i++) {
    const a = M.srand() * Math.PI * 2, r = 150 + M.srand() * 170, x = Math.cos(a) * r, z = 30 + Math.sin(a) * r;
    if (Math.abs(x) < 125 && z > -45 && z < 110) continue;
    const w = 18 + M.srand() * 26, d = 18 + M.srand() * 26, h = 50 + M.srand() * 150;
    box(x, h / 2, z, w, h, d, winMat([0x5a5e66, 0x6a6560, 0x4e5560, 0x777065][i % 4], w, h), false, false);
    if (i % 5 === 0) box(x, h + 6, z, w * 0.5, 12, d * 0.5, MAT.shellDark, false, false);
  }

  /* ---------- the ground floor ---------- */
  const G = 0, GH = 6.0;                                                  // ground, its ceiling under the floor 2 slab
  floor(-40, 0, 40, 40, 0.005, "terrazzo");                               // one terrazzo floor through the block
  slab(-40, 0, 40, 40, F[1], 0.5, null);                                  // floor 2 slab (its top is the floor 2 plate)
  plate(-40, 40, 0, 40, 0);
  // the facade on 53rd: glass at ground level the whole width, the doors at x -4..4
  glassPane(-22, GH / 2, 0, 36, GH, "z", true, 2.4); glassPane(22, GH / 2, 0, 36, GH, "z", true, 2.4);
  glassPane(0, GH / 2 + 1.75, 0, 8, GH - 3.5, "z", false, 4);           // over the doors
  for (const x of [-4, 4]) box(x, 1.75, 0, 0.22, 3.5, 0.4, MAT.blackSteel, false);
  box(0, 3.65, -1.6, 14, 0.32, 3.6, MAT.charcoal, false);                 // the canopy, with MLow's logo on its face
  { const t = M.img("assets/mlow_logo.png"); const s = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.38), new THREE.MeshBasicMaterial({ map: t, transparent: true })); s.position.set(0, 3.65, -3.42); s.rotation.y = Math.PI; M.world.add(s); }
  for (const x of [-5.5, 5.5]) box(x, 1.8, -3.2, 0.14, 3.6, 0.14, MAT.blackSteel, true);
  // inside: the lobby hall x -14..14, the store, the cafe, the escalator hall, the lift
  // west wall of the lobby: the store's party wall, with its door at z 6..10 and the escalator hall opening z 22..40
  wall(-14, 0, -14, 6, GH, 0, MAT.bone); wall(-14, 10, -14, 22, GH, 0, MAT.bone); wall(-14, 6, -14, 10, GH - 3.4, 3.4, MAT.bone);
  wall(14, 0, 14, 6, GH, 0, MAT.bone); wall(14, 10, 14, 22, GH, 0, MAT.bone); wall(14, 6, 14, 10, GH - 3.4, 3.4, MAT.bone);
  wall(14, 22, 14, 34, GH, 0, MAT.bone); wall(14, 38, 14, 40, GH, 0, MAT.bone);                          // east wall north of the cafe, the lift door at z 34..38
  // the store and the cafe shells
  wall(-40, 0.2, -40, 22, GH, 0, MAT.bone); wall(-40, 22, -28, 22, GH, 0, MAT.bone); wall(-28, 22, -14, 22, GH - 3.4, 3.4, MAT.bone);   // store north wall, open to the escalator hall x -28..-14
  wall(40, 0.2, 40, 40, GH, 0, MAT.bone); wall(14, 22, 40, 22, GH, 0, MAT.bone);
  wall(-40, 22, -40, 40, GH, 0, MAT.bone); wall(-40, 40, -28, 40, GH, 0, MAT.bone); wall(-28, 40, -14, 40, GH, 0, MAT.bone);         // west ground north walls
  wall(18, 40, 40, 40, GH, 0, MAT.bone); wall(14, 40, 18, 40, GH, 0, MAT.bone);
  wall(-28, 22, -28, 40, GH, 0, MAT.bone);                                                                 // the escalator hall's west wall (the families hang here)
  // the Garden Lobby: glass to the garden, doors at x -8..-4 and 4..8
  glassPane(-11, GH / 2, 40, 6, GH, "z", true, 3); glassPane(0, GH / 2, 40, 8, GH, "z", true, 4); glassPane(11, GH / 2, 40, 6, GH, "z", true, 3);
  glassPane(-6, GH / 2 + 1.75, 40, 4, GH - 3.5, "z", false, 4); glassPane(6, GH / 2 + 1.75, 40, 4, GH - 3.5, "z", false, 4);
  for (const x of [-8, -4, 4, 8]) box(x, 1.75, 40, 0.18, 3.5, 0.36, MAT.blackSteel, false);
  ceiling(-40, 0, 40, 40, GH);
  for (let i = 0; i < 5; i++) M.laylights.push(laylight(0, GH, 4 + i * 8, 20, 4.2, 1.1));
  for (const z of [6, 20, 34]) point(0, GH - 0.8, z, 1.1, 24); point(-27, GH - 0.8, 11, 1.0, 26); point(27, GH - 0.8, 11, 1.0, 26); point(-21, GH - 0.8, 31, 0.9, 20);
  for (let i = 0; i < 3; i++) { M.laylights.push(laylight(-27, GH, 4 + i * 7, 20, 3.6, 0.8)); M.laylights.push(laylight(27, GH, 4 + i * 7, 20, 3.6, 0.8)); }
  M.laylights.push(laylight(-21, GH, 31, 10, 10, 0.8)); M.laylights.push(laylight(27, GH, 31, 20, 10, 0.8));
  // the desk, stanchions, benches
  sign(0, 0.62, 7.2, 2.6, 0.36, signTex("ADMISSION IS FREE. IT ALWAYS WAS.", { w: 1300, h: 180, bg: "#1b1d21", fg: "#f0efea", size: 60, quotes: false }), Math.PI);
  bench(-9, 16, false, 0, 3); bench(9, 16, false, 0, 3); bench(-9, 30, false, 0, 3); bench(9, 30, false, 0, 3);
  M.ROOMS.lobby = { key: "lobby", name: "The lobby", x0: -14, x1: 14, z0: 0, z1: 40, y: 0, h: GH, cx: 0, cz: 20, walls: [
    { ax: -14, az: 10, bx: -14, bz: 22, nx: 1, nz: 0, len: 12, side: "w" }, { ax: -14, az: 0.6, bx: -14, bz: 6, nx: 1, nz: 0, len: 5.4, side: "w" },
    { ax: 14, az: 10, bx: 14, bz: 22, nx: -1, nz: 0, len: 12, side: "e" }, { ax: 14, az: 0.6, bx: 14, bz: 6, nx: -1, nz: 0, len: 5.4, side: "e" },
    { ax: 14, az: 22, bx: 14, bz: 34, nx: -1, nz: 0, len: 12, side: "e" }] };
  M.ROOMS.gardenlobby = { key: "gardenlobby", name: "The Garden Lobby", x0: -14, x1: 14, z0: 30, z1: 40, y: 0, h: GH, cx: 0, cz: 36, walls: [] };
  // the store: x -40..-14, z 0..22. Posters on the west wall and the north wall, shelves, the register
  M.ROOMS.store = { key: "store", name: "The store", x0: -40, x1: -14, z0: 0.3, z1: 22, y: 0, h: GH, cx: -27, cz: 11, walls: [
    { ax: -40, az: 0.6, bx: -40, bz: 22, nx: 1, nz: 0, len: 21.4, side: "w" }, { ax: -40, az: 21.8, bx: -28, bz: 21.8, nx: 0, nz: -1, len: 12, side: "n" }] };
  M.ROOMS.cafe = { key: "cafe", name: "The cafe", x0: 14, x1: 40, z0: 0.3, z1: 22, y: 0, h: GH, cx: 27, cz: 11, walls: [
    { ax: 40, az: 0.6, bx: 40, bz: 22, nx: -1, nz: 0, len: 21.4, side: "e" }, { ax: 14, az: 21.8, bx: 40, bz: 21.8, nx: 0, nz: -1, len: 26, side: "n" }] };
  M.ROOMS.stairhall = { key: "stairhall", name: "The escalators", x0: -28, x1: -14, z0: 22, z1: 40, y: 0, h: GH, cx: -21, cz: 31, walls: [] };
  sign(-21, 4.9, 22.2, 4.0, 0.46, signTex("THE STORE", { w: 1000, h: 115 }), 0);
  sign(27, 4.9, 22.2, 3.2, 0.46, signTex("THE BODEGA", { w: 1000, h: 115 }), 0);
  sign(-13.75, 4.9, 31, 3.0, 0.4, signTex("ESCALATORS", { w: 1000, h: 115 }), Math.PI / 2);
  sign(6, 4.2, 39.8, 2.2, 0.36, signTex("GARDEN", { w: 600, h: 110 }), Math.PI);
  sign(-6, 4.2, 39.8, 2.2, 0.36, signTex("GARDEN", { w: 600, h: 110 }), Math.PI);
  // the lift: a glass shaft the full height, doors on the lobby side at every floor
  for (const z of [LIFT.z0, LIFT.z1]) glassPane(16, ROOF / 2, z, 4, ROOF, "z", true, 2);
  glassPane(18, ROOF / 2, 36, 4, ROOF, "x", true, 2);
  for (let k = 0; k < F.length; k++) { const y = F[k]; wall(14, LIFT.z0, 14, LIFT.z0 + 1, FH, y, MAT.bone, 0.2); wall(14, LIFT.z1 - 1, 14, LIFT.z1, FH, y, MAT.bone, 0.2); wall(14, LIFT.z0 + 1, 14, LIFT.z1 - 1, FH - 2.8, y + 2.8, MAT.bone, 0.2); }
  const cab = M.liftCab = new THREE.Group(); M.world.add(cab);
  { const fl = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.6), MAT.charcoal); fl.position.set(16, 0.1, 36); cab.add(fl); const cl = fl.clone(); cl.position.y = 3.3; cab.add(cl);
    for (const [x, z, w, d] of [[14.3, 36, 0.05, 3.6], [17.7, 36, 0.05, 3.6], [16, 34.3, 3.6, 0.05], [16, 37.7, 3.6, 0.05]]) { const g = new THREE.Mesh(new THREE.BoxGeometry(w, 3.1, d), MAT.glassRail); g.position.set(x, 1.75, z); cab.add(g); } }
  for (let k = 0; k < F.length; k++) plate(LIFT.x0, LIFT.x1, LIFT.z0, LIFT.z1, F[k]);
  // escalators ground -> 2 -> 3 -> 4 -> 5 -> 6 in the well x -28..-14, z 24..38, alternating direction
  for (let k = 0; k < F.length - 1; k++) {
    const y0 = F[k], y1 = F[k + 1], up = k % 2 === 0;                  // even: runs north (z 24 -> 38), odd: runs south
    const za = up ? 24 : 38, zb = up ? 38 : 24, len = 14, rise = y1 - y0, L = Math.hypot(len, rise), ang = Math.atan2(rise, len) * (up ? 1 : -1);
    const stepTex = M.canvasTex((g) => { g.fillStyle = "#2a2d31"; g.fillRect(0, 0, 64, 512); g.fillStyle = "#9a9ea4"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 64, 3); g.fillStyle = "#ffd600"; g.fillRect(0, 0, 2, 512); g.fillRect(62, 0, 2, 512); }, 64, 512);
    stepTex.wrapS = stepTex.wrapT = THREE.RepeatWrapping; stepTex.repeat.set(1, L / 0.8);
    for (const x of [-24, -18]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, L), new THREE.MeshStandardMaterial({ map: stepTex, roughness: 0.6, metalness: 0.3 }));
      m.position.set(x, (y0 + y1) / 2 - 0.25, (za + zb) / 2); m.rotation.x = -ang; m.receiveShadow = true; M.world.add(m);
      M.escalators.push({ tex: stepTex, dir: x === -24 ? 1 : -1 });
      for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, L), MAT.glassRail); g.position.set(x + s * 1.33, (y0 + y1) / 2 + 0.55, (za + zb) / 2); g.rotation.x = -ang; M.world.add(g); const h = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, L), MAT.rubber); h.position.set(x + s * 1.33, (y0 + y1) / 2 + 1.12, (za + zb) / 2); h.rotation.x = -ang; M.world.add(h); }
    }
    M.ramps.push({ minX: -25.3, maxX: -22.7, minZ: 24, maxZ: 38, axis: "z", a0: za, a1: zb, y0, y1 });
    M.ramps.push({ minX: -19.3, maxX: -16.7, minZ: 24, maxZ: 38, axis: "z", a0: za, a1: zb, y0, y1 });
    // between and beside the two runs, nothing to stand on: keep visitors on the steps
    keepOuts.push({ minX: -22.7, maxX: -19.3, minZ: 24, maxZ: 38, yMin: y0 + 0.4, yMax: y1 + 1.5 });
    if (k > 0) { floor(-28, 24, -25.3, 38, y0 + 0.005, "planks"); plate(-28, -25.3, 24, 38, y0); box(-26.65, y0 - 0.25, 31, 2.7, 0.5, 14, MAT.white, false, false); rail(-25.3, 24, -25.3, 38, y0); }
    else keepOuts.push({ minX: -28, maxX: -25.3, minZ: 24, maxZ: 38, yMin: y0 + 0.4, yMax: y1 - 0.6 });
    keepOuts.push({ minX: -16.7, maxX: -14, minZ: 24, maxZ: 38, yMin: y0 + 0.4, yMax: y1 + 1.5 });
    if (k > 0) { // the well is open through the floor plates: rails along its edges at every upper floor
      rail(-22.7, 24, -19.3, 24, y0); rail(-16.7, 24, -14, 24, y0); rail(-22.7, 38, -19.3, 38, y0); rail(-16.7, 38, -14, 38, y0);
    }
  }

  { const y0 = F[F.length - 1]; floor(-28, 24, -25.3, 38, y0 + 0.005, "planks"); plate(-28, -25.3, 24, 38, y0); box(-26.65, y0 - 0.25, 31, 2.7, 0.5, 14, MAT.white, false, false); rail(-25.3, 24, -25.3, 38, y0); }
  /* ---------- floors 2 to 6: the rings around the atrium ---------- */
  const FLOOR_SETS = ["planks", "planks", "planks", "planks", "planks"];
  for (let k = 1; k < F.length; k++) {
    const y = F[k], f = k + 1, isAtriumFloor = k === 1, top = k === F.length - 1;
    // the plate: the whole ring, minus the void above floor 2, minus the escalator well, plus the lift
    const P = [[-40, -28, 0, 40], [-28, -14, 0, 24], [-28, -14, 38, 40], [-14, 14, 0, 10], [-14, 14, 30, 40], [14, 40, 0, 40]];
    if (isAtriumFloor) P.push([-14, 14, 10, 30]); else { P.push([-14, -11, 10, 30]); P.push([11, 14, 10, 30]); }
    for (const [x0, x1, z0, z1] of P) { floor(x0, z0, x1, z1, y + 0.005, FLOOR_SETS[k - 1]); plate(x0, x1, z0, z1, y); }
    // the slab above (its underside is this floor's ceiling in the corridors), not over the void, not over the well
    if (!top) { for (const [x0, x1, z0, z1] of [[-40, -28, 0, 40], [-28, -14, 0, 24], [-28, -14, 38, 40], [-14, 14, 0, 10], [-14, 14, 30, 40], [14, 40, 0, 40], [-14, -11, 10, 30], [11, 14, 10, 30]]) box((x0 + x1) / 2, y + FH - 0.25, (z0 + z1) / 2, x1 - x0, 0.5, z1 - z0, MAT.white, false, false); }
    // the void: keep out, and glass rails on its edges (floors 3 and up). Floor 4 has the bridge.
    if (!isAtriumFloor) {
      const bridge = k === 3;
      if (bridge) { keepOuts.push({ minX: -11, maxX: 11, minZ: 10, maxZ: 19.4, yMin: y - 0.5, yMax: y + 2 }); keepOuts.push({ minX: -11, maxX: 11, minZ: 22.6, maxZ: 30, yMin: y - 0.5, yMax: y + 2 }); }
      else keepOuts.push({ minX: -11, maxX: 11, minZ: 10, maxZ: 30, yMin: y - 0.5, yMax: y + 2 });
      rail(-11, 10, 11, 10, y); rail(-11, 30, 11, 30, y);
      if (bridge) { rail(-11, 10, -11, 19.4, y); rail(-11, 22.6, -11, 30, y); rail(11, 10, 11, 19.4, y); rail(11, 22.6, 11, 30, y); }
      else { rail(-11, 10, -11, 30, y); rail(11, 10, 11, 30, y); }
      if (bridge) {
        // a glass bridge across the atrium: the thing a real museum cannot do
        const b = box(0, y - 0.08, 21, 22, 0.16, 3.2, MAT.glass, false, false); b.material = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, roughness: 0.02, transparent: true, opacity: 0.35, side: THREE.DoubleSide, envMapIntensity: 1.4 });
        plate(-11, 11, 19.4, 22.6, y); rail(-11, 19.4, 11, 19.4, y); rail(-11, 22.6, 11, 22.6, y);
        for (let x = -10; x <= 10; x += 2.5) box(x, y - 0.3, 21, 0.14, 0.45, 3.2, MAT.steel, false, false);
        sign(0, y + 1.6, 19.38, 1.6, 0.3, signTex("BRIDGE", { w: 700, h: 130 }), Math.PI); sign(0, y + 1.6, 22.62, 1.6, 0.3, signTex("BRIDGE", { w: 700, h: 130 }), 0);
      }
    }
    // the well is open on upper floors: the plates already leave it out
    // rooms. West wing: W1 z 0..12.5, W2 z 12.5..22 (x -40..-14), W3 x -40..-28 z 24..40. East: E1, E2, E3 with the lift in E3.
    const RH = 5.0;
    room(`W1_${f}`, -40, -14, 0.4, 12.5, y, { doors: [{ side: "e", a: 3.0, b: 6.2 }, { side: "n", a: -19.2, b: -16 }], name: "West 1", h: RH });
    room(`W2_${f}`, -40, -14, 12.5, 22, y, { doors: [{ side: "s", a: -19.2, b: -16 }, { side: "e", a: 15, b: 18.2 }], name: "West 2", h: RH });
    room(`W3_${f}`, -40, -28, 24, 39.6, y, { doors: [{ side: "e", a: 30, b: 33.2 }], name: "West 3", h: RH });
    room(`E1_${f}`, 14, 40, 0.4, 13.3, y, { doors: [{ side: "w", a: 3.0, b: 6.2 }, { side: "n", a: 16, b: 19.2 }], name: "East 1", h: RH });
    room(`E2_${f}`, 14, 40, 13.3, 26.6, y, { doors: [{ side: "s", a: 16, b: 19.2 }, { side: "w", a: 15, b: 18.2 }, { side: "n", a: 16, b: 19.2 }], name: "East 2", h: RH });
    room(`E3_${f}`, 14, 40, 26.6, 39.6, y, { doors: [{ side: "s", a: 16, b: 19.2 }, { side: "w", a: 28, b: 31.2 }, { side: "w", a: 33.8, b: 38.2 }, { side: "n", a: 14, b: 19.4 }], name: "East 3", h: RH });   // the west gap and the north cut are the lift shaft
    // the lift shaft inside E3: a solid glass box, its door faces the corridor at x 14 (already drawn)
    addSolid(LIFT.x0, LIFT.x1, LIFT.z0, LIFT.z1, y - 0.5, y + FH);
    // the north room: glass to the garden on floors 2 and 3, stone above; the door from the north balcony
    room(`N_${f}`, -14, 14, 33, 39.6, y, { doors: [{ side: "s", a: -2, b: 2 }], glass: f <= 3 ? ["n"] : [], name: "North", h: RH, light: 1.0 });
    // the south band: a balcony behind the facade glass on every floor; on 6 it is the terrace
    if (!top) { glassPane(0, y + FH / 2, 0, 28, FH, "z", true, 2.4); }
    else {
      // the terrace: no roof over the south band, a parapet, cafe tables, the water tower
      rail(-14, 0.2, 14, 0.2, y, 1.2);
      sign(0, y + 1.9, 0.26, 3, 0.4, signTex("THE TERRACE", { w: 1000, h: 130 }), 0, true);
    }
    // the corridor around the void is lit from the slab above
    if (!top) { for (const z of [4, 35]) M.laylights.push(laylight(0, y + FH - 0.5, z, 22, 3.4, 0.9)); for (const x of [-12.5, 12.5]) M.laylights.push(laylight(x, y + FH - 0.5, 20, 2.2, 16, 0.8)); }
    point(0, y + FH - 1.2, 5, 0.8, 22); point(0, y + FH - 1.2, 35, 0.8, 22);
    // room names in quotes over the doors (the hang module writes the show names)
    // the escalator landing strips are part of the plates; the well's north edge at z 38 is plate (landing)
  }
  /* ---------- the atrium: the void from floor 2 to the skylight, the facade wall, the roof ---------- */
  // the atrium's walls are the rooms' walls with their doors, floor by floor; the corridors around the void join them
  // the roof over the rings, the skylight over the void
  box(0, ROOF + 0.25, 20, 80, 0.5, 40, MAT.white, false, false);
  for (let x = -10; x <= 10; x += 2.2) box(x, ROOF + 0.2, 20, 0.12, 0.3, 20, MAT.blackSteel, false, false);
  for (let z = 11; z <= 29; z += 2.0) box(0, ROOF + 0.2, z, 22, 0.3, 0.12, MAT.blackSteel, false, false);
  const sky = new THREE.Mesh(new THREE.BoxGeometry(22, 0.06, 20), MAT.glass); sky.position.set(0, ROOF + 0.3, 20); M.world.add(sky);
  M.skylightLight = point(0, ROOF - 1.5, 20, 1.6, 40, 0xf4f6ff); point(0, 20, 20, 1.2, 36, 0xf4f6ff); point(0, 10, 20, 1.0, 30, 0xfff1dc);
  // the facade above the ground floor: curtain glass for the atrium bay, stone with window bands for the wings
  glassPane(0, (F[5] + F[1]) / 2, -0.2, 28, F[5] - F[1], "z", false, 2.4);
  for (const side of [-1, 1]) {
    box(side * 27, (ROOF + F[1]) / 2, -0.2, 26, ROOF - F[1], 0.5, surf("ashlar"), true);
    for (let k = 1; k < F.length; k++) box(side * 27, F[k] + 2.6, -0.5, 24, 1.5, 0.12, MAT.glass, false, false);
    box(side * 40.45, ROOF / 2, 20, 0.5, ROOF, 40, surf("ashlar"), true);
    for (let k = 1; k < F.length; k++) for (const z of [6, 20, 34]) box(side * 40.75, F[k] + 2.6, z, 0.12, 1.5, 8, MAT.glass, false, false);
  }
  // the north face: glass for the north rooms on 2 and 3 (drawn by the rooms), stone above
  box(0, (ROOF + F[3]) / 2, 40.2, 28, ROOF - F[3], 0.5, surf("ashlar"), true);
  for (const side of [-1, 1]) box(side * 27, (ROOF + F[1]) / 2, 40.2, 26, ROOF - F[1], 0.5, surf("ashlar"), true);
  // the facade banners: MLow's posters between the floors, the way MoMA hangs its show banners
  M.facadeBanners = [[-32, 0.2], [32, 0.2]];
  // the sign: the logo on the canopy already; the name on the glass, small, like the real one
  sign(0, 9.2, -0.45, 6.4, 0.9, signTex("MoMLOW", { w: 1400, h: 200, bg: "#0d0d0d", fg: "#f0efea", size: 128, quotes: false }), Math.PI);

  /* ---------- the sculpture garden: x -20..40, z 40..66; THE COUNTED on its north wall; 54th Street beyond ---------- */
  floor(-20, 40, 40, 66, 0.004, "marble"); plate(-20, 40, 40, 66, 0);
  wall(-20, 40, -20, 66, 6, 0, surf("brick"), 0.5); wall(40, 40.5, 40, 66, 6, 0, surf("brick"), 0.5);
  wall(-20, 66, 40, 66, 14.5, 0, MAT.charcoal, 0.6);                      // THE COUNTED's wall
  wall(-40, 40.3, -20, 40.3, 6, 0, surf("brick"), 0.5);                   // the wing's garden face continues as the garden's west return
  // two long reflecting pools with marble rims and slab bridges, as at MoMA
  function pool(x1, z1, x2, z2) {
    for (const [a, b, c, d] of [[x1, z1, x2, z1], [x1, z2, x2, z2], [x1, z1, x1, z2], [x2, z1, x2, z2]]) wall(a, b, c, d, 0.36, 0, surf("marble"), 0.3);
    const w = hPlane(x1 + 0.3, z1 + 0.3, x2 - 0.3, z2 - 0.3, 0.26, MAT.water, true, false); w.receiveShadow = true;
    keepOuts.push({ minX: x1, maxX: x2, minZ: z1, maxZ: z2, yMin: -1, yMax: 1.5 });
    return w;
  }
  M.waters = [pool(-8, 47, 20, 50.5), pool(4, 56, 34, 59.5)];
  // slab bridges cross the pools: the pool keep outs are cut where the bridges are
  for (const [x, z1, z2] of [[6, 47, 50.5], [20, 56, 59.5]]) {
    box(x, 0.33, (z1 + z2) / 2, 1.8, 0.1, z2 - z1 + 1.8, surf("marble"), false); plate(x - 0.9, x + 0.9, z1 - 0.9, z2 + 0.9, 0.38);   // the slab reaches past the rims, so you step up before they can stop you
    const ko = keepOuts.find(k => k.minZ === z1 && k.maxZ === z2); if (ko) { const x1 = ko.maxX; ko.maxX = x - 0.9; keepOuts.push({ minX: x + 0.9, maxX: x1, minZ: z1, maxZ: z2, yMin: -1, yMax: 1.5 }); }
  }
  floor(-19.6, 42, -17.4, 64, 0.03, "grass"); floor(37.4, 42, 39.6, 64, 0.03, "grass"); floor(-16, 61, 2, 65.2, 0.03, "grass");
  bench(0, 44, false, 0, 3); bench(28, 44, false, 0, 3); bench(-14, 54, true, 0, 3); bench(36, 53, true, 0, 3); bench(14, 63, false, 0, 3);
  sign(-19.75, 4.6, 53, 3.2, 0.46, signTex("GARDEN", { w: 900, h: 130 }), Math.PI / 2); sign(39.75, 4.6, 53, 3.2, 0.46, signTex("GARDEN", { w: 900, h: 130 }), -Math.PI / 2);
  // the gates to 54th Street in the north wall's ends
  for (const x of [-17, 37]) { for (let i = 0; i < 9; i++) box(x - 1.6 + i * 0.4, 1.6, 66, 0.05, 3.2, 0.05, MAT.blackSteel, false, false); }

  /* ---------- zones for the HUD and the jump menu ---------- */
  M.ZONES = [
    { key: "street", name: "53rd Street", sub: "Outside", x: 0, z: -7, y: 0, yaw: Math.PI },
    { key: "lobby", name: "The lobby", sub: "Ground floor", x: 0, z: 3, y: 0, yaw: Math.PI },
    { key: "atrium", name: "The atrium", sub: "Floor 2", x: -8.5, z: 9, y: F[1], yaw: Math.PI - 0.5 },
    { key: "f3", name: "Floor 3", sub: "Places, design, the sets", x: -12.5, z: 5, y: F[2], yaw: Math.PI / 2 },
    { key: "f4", name: "Floor 4", sub: "The bridge", x: 0, z: 8, y: F[3], yaw: Math.PI },
    { key: "f5", name: "Floor 5", sub: "The Originals", x: -12.5, z: 5, y: F[4], yaw: Math.PI / 2 },
    { key: "f6", name: "Floor 6", sub: "The curator's rooms", x: -12.5, z: 5, y: F[5], yaw: Math.PI / 2 },
    { key: "garden", name: "The sculpture garden", sub: "The Counted", x: 10, z: 44, y: 0, yaw: Math.PI },
    { key: "store", name: "The store", sub: "Ground floor", x: -20, z: 8, y: 0, yaw: Math.PI / 2 },
    { key: "terrace", name: "The terrace", sub: "Floor 6", x: 0, z: 6, y: F[5], yaw: 0 }
  ];
  M.zoneOf = function (P, feet) {
    const k = F.reduce((best, y, i) => Math.abs(feet - y) < Math.abs(feet - F[best]) ? i : best, 0), f = k + 1;
    if (P.z < 0) return ["53rd Street", "Outside"];
    if (P.z > 66) return ["54th Street", "Outside"];
    if (P.z > 40 && P.x > -20) return ["The sculpture garden", "The Counted, on the north wall"];
    if (k === 0) { if (P.x < -14 && P.z < 22) return ["The store", "Posters, prints, stickers"]; if (P.x > 14 && P.z < 22) return ["The Bodega", "The cafe"]; if (P.x < -14) return ["The escalators", "The Families, on the way up"]; if (P.z > 30) return ["The Garden Lobby", "Ground floor"]; return ["The lobby", "Ground floor"]; }
    for (const key in M.ROOMS) { const r = M.ROOMS[key]; if (Math.abs(r.y - F[k]) < 0.1 && P.x >= r.x0 && P.x <= r.x1 && P.z >= r.z0 && P.z <= r.z1) return [`Floor ${f}`, r.showName || r.name]; }
    if (P.x > -28 && P.x < -14 && P.z > 24) return ["The escalators", `Floor ${f}`];
    if (k === 1 && P.x > -11 && P.x < 11 && P.z > 10 && P.z < 30) return ["The atrium", "Floor 2"];
    if (k === 3 && P.x > -11 && P.x < 11) return ["The bridge", "Floor 4, over the atrium"];
    if (k === 5 && P.z < 10) return ["The terrace", "Floor 6"];
    return [`Floor ${f}`, "The corridor"];
  };
})(window.M);
