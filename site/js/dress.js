/* MoMLOW dress: the illusions, the patterns, the station signs, the Penn Station set in the lobby, the cast in bronze,
   and the rest of MLow's heroes placed where New York would put them. Loads after props.js. */
(function (M) {
  "use strict";
  const { world, MAT, box, sign, signTex, prop: P, addSolid, FLOORS: F, img, rnd, canvasTex, plate } = M;
  const F2 = F[1], F3 = F[2], F6 = F[5];

  /* ---------- the site's materials: glazed subway tile, the mosaic frieze, brick ---------- */
  function rep(path, rx, ry, color) { const t = img(path, color !== false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
  const tileMat = (len, h) => new THREE.MeshStandardMaterial({ map: rep("assets/tile.webp", len / 0.6, h / 0.6), roughness: 0.25, metalness: 0.05, envMapIntensity: 0.9 });
  const friezeMat = (len) => new THREE.MeshStandardMaterial({ map: rep("assets/mosaic-eye.webp", len / 1.6, 1), roughness: 0.5, envMapIntensity: 0.4 });
  const mosaicMat = (len, h) => new THREE.MeshStandardMaterial({ map: rep("assets/mosaic.webp", len / 1.2, h / 1.2), roughness: 0.5, envMapIntensity: 0.4 });
  /* a tile dado with a mosaic frieze along a wall face. (ax,az)->(bx,bz) is the wall's centre line, (nx,nz) points into the room. */
  function dado(ax, az, bx, bz, nx, nz, y, opt) {
    opt = opt || {}; const len = Math.hypot(bx - ax, bz - az), alongX = Math.abs(bx - ax) > Math.abs(bz - az), h = opt.h || 0.9, off = opt.off == null ? 0.2 : opt.off;
    const cx = (ax + bx) / 2 + nx * off, cz = (az + bz) / 2 + nz * off;
    box(cx, y + h / 2, cz, alongX ? len : 0.025, h, alongX ? 0.025 : len, tileMat(len, h), false, false);
    box(cx, y + h + 0.11, cz, alongX ? len : 0.028, 0.22, alongX ? 0.028 : len, friezeMat(len), false, false);
    box(cx, y + h + 0.24, cz, alongX ? len : 0.03, 0.04, alongX ? 0.03 : len, MAT.charcoal, false, false);
  }
  // the lobby: both long walls, under the works
  dado(-14, 10, -14, 22, 1, 0, 0); dado(-14, 0.6, -14, 6, 1, 0, 0); dado(14, 10, 14, 22, -1, 0, 0); dado(14, 0.6, 14, 6, -1, 0, 0); dado(14, 22, 14, 34, -1, 0, 0);
  // the corridors around the void on every upper floor: the rooms' faces toward the void, and the north room's south face
  for (let k = 1; k < F.length; k++) {
    const y = F[k];
    for (const [a, b] of [[10, 15], [18.2, 30]]) dado(-14, a, -14, b, 1, 0, y, { off: 0.19 });
    dado(14, 10, 14, 15, -1, 0, y, { off: 0.19 }); dado(14, 18.2, 14, 28, -1, 0, y, { off: 0.19 }); dado(14, 31.2, 14, 33.8, -1, 0, y, { off: 0.19 });
    dado(-14, 33, -2, 33, 0, -1, y, { off: 0.19 }); dado(2, 33, 14, 33, 0, -1, y, { off: 0.19 });
  }
  // the mosaic frieze high on the lobby walls, the way the subway puts its name in tile
  for (const [x, nx] of [[-14, 1], [14, -1]]) box(x + nx * 0.19, 4.9, 11, 0.03, 0.5, 21.6, mosaicMat(21.6, 0.5), false, false);
  box(0, 5.4, 39.8, 28, 0.6, 0.03, mosaicMat(28, 0.6), false, false);

  /* ---------- enamel station signs: the floor at every lift door and escalator landing, with a line bullet ---------- */
  const LINES = ["#DC6F57", "#61C9E2", "#A23231", "#4692C2", "#E79650", "#ECC981"];
  function stationTex(text, sub, color) {
    return canvasTex((g, w, h) => {
      g.fillStyle = "#0c1016"; g.fillRect(0, 0, w, h); g.strokeStyle = "#f0efea"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = color; g.beginPath(); g.arc(120, h / 2, 62, 0, Math.PI * 2); g.fill(); g.fillStyle = "#0c1016"; g.font = "bold 70px Helvetica, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text.replace(/\D/g, "") || text[0], 120, h / 2 + 4);
      g.fillStyle = "#f0efea"; g.textAlign = "left"; g.font = "bold 96px Helvetica, Arial, sans-serif"; g.fillText(text, 220, h / 2 - (sub ? 22 : 0));
      if (sub) { g.font = "500 36px 'IBM Plex Mono', Menlo, monospace"; g.fillStyle = "#8fa7ab"; g.fillText(sub.toUpperCase(), 224, h / 2 + 58); }
    }, 1100, 260);
  }
  const SUBS = ["The lobby, the store, the Bodega", "The atrium, the newest eras", "Places, design, the sets", "Eras VI to XII, the bridge", "The Originals, Eras II to V", "The curator's rooms, the terrace"];
  for (let k = 0; k < F.length; k++) {
    sign(13.78, F[k] + 3.2, 36, 2.6, 0.62, stationTex(k === 0 ? "GROUND" : "FLOOR " + (k + 1), SUBS[k], LINES[k]), -Math.PI / 2);
    sign(-14.22, F[k] + 3.4, 31, 2.6, 0.62, stationTex(k === 0 ? "GROUND" : "FLOOR " + (k + 1), SUBS[k], LINES[k]), Math.PI / 2);
  }
  sign(0, 5.6, 0.22, 3.0, 0.7, stationTex("MoMLOW", "53rd Street", "#ff6b00"), 0);

  /* ---------- illusion panels: one per floor on the north room's south face, where the balcony looks at it ---------- */
  const palette = { ink: "#0d0d0d", cloud: "#f0efea", blue: "#4692C2", gold: "#ECC981", coral: "#DC6F57", slate: "#8FA7AB" };
  function cafeWall() { return canvasTex((g, w, h) => { const t = 128, mortar = 10; g.fillStyle = "#8FA7AB"; g.fillRect(0, 0, w, h); for (let r = 0; r * (t + mortar) < h; r++) { const off = (r % 2) * (t / 2); for (let c = -1; c * t < w + t; c++) { g.fillStyle = (c % 2 === 0) ? palette.ink : palette.cloud; g.fillRect(c * t + off, r * (t + mortar), t, t); } } }, 2048, 1024); }
  function rotatingSnakes() {
    return canvasTex((g, w, h) => {
      g.fillStyle = palette.slate; g.fillRect(0, 0, w, h);
      const cols = [palette.ink, palette.blue, palette.cloud, palette.gold]; const R = 240;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 4; dx++) {
        const cx = R + dx * 2 * R + (dy ? R : 0) - (dy ? 0 : 0), cy = R + dy * 2 * R, dir = (dx + dy) % 2 ? 1 : -1;
        for (let ring = 5; ring >= 1; ring--) { const r1 = ring * R / 5, r0 = r1 - R / 5, seg = 20 + ring * 6; for (let s = 0; s < seg; s++) { const a0 = (s / seg) * Math.PI * 2 * dir + ring * 0.3, a1 = ((s + 1) / seg) * Math.PI * 2 * dir + ring * 0.3; g.fillStyle = cols[s % 4]; g.beginPath(); g.arc(cx, cy, r1, a0, a1, dir < 0); g.arc(cx, cy, r0, a1, a0, dir > 0); g.closePath(); g.fill(); } }
        g.fillStyle = palette.cloud; g.beginPath(); g.arc(cx, cy, R / 5 * 0.55, 0, Math.PI * 2); g.fill();
      }
    }, 2048, 1024);
  }
  function fraser() {
    return canvasTex((g, w, h) => {
      const cx = w / 2, cy = h / 2, c = 36; for (let y = 0; y < h; y += c) for (let x = 0; x < w; x += c) { g.fillStyle = ((x / c + y / c) % 2) ? "#2a3038" : "#5b6570"; g.fillRect(x, y, c, c); }
      for (let r = 60; r < h / 2 - 10; r += 42) { const seg = Math.round(r / 7); for (let s = 0; s < seg; s++) { const a0 = s / seg * Math.PI * 2, a1 = (s + 1) / seg * Math.PI * 2, mid = (a0 + a1) / 2, tw = 0.45; g.strokeStyle = s % 2 ? palette.cloud : palette.ink; g.lineWidth = 16; g.beginPath(); g.moveTo(cx + Math.cos(a0) * (r - 6), cy + Math.sin(a0) * (r - 6)); g.lineTo(cx + Math.cos(a1) * (r + 6), cy + Math.sin(a1) * (r + 6)); g.stroke(); } }
    }, 1400, 1400);
  }
  function zollner() { return canvasTex((g, w, h) => { g.fillStyle = palette.cloud; g.fillRect(0, 0, w, h); g.lineWidth = 8; for (let i = 0; i < 9; i++) { const y = 110 + i * 100; g.strokeStyle = palette.ink; g.beginPath(); g.moveTo(60, y); g.lineTo(w - 60, y); g.stroke(); const dir = i % 2 ? 1 : -1; g.strokeStyle = palette.coral; g.lineWidth = 6; for (let x = 100; x < w - 80; x += 56) { g.beginPath(); g.moveTo(x - 22 * dir, y - 28); g.lineTo(x + 22 * dir, y + 28); g.stroke(); } g.lineWidth = 8; } }, 2048, 1024); }
  function ebbinghaus(flowerImg) {
    return canvasTex((g, w, h) => {
      g.fillStyle = palette.cloud; g.fillRect(0, 0, w, h);
      const draw = (x, y, r) => { if (flowerImg && flowerImg.width) g.drawImage(flowerImg, x - r, y - r, r * 2, r * 2); else { g.fillStyle = palette.blue; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } };
      const L = { x: 520, y: 512, r: 110 }, R = { x: 1528, y: 512, r: 110 };
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; draw(L.x + Math.cos(a) * 340, L.y + Math.sin(a) * 340, 190); }
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; draw(R.x + Math.cos(a) * 190, R.y + Math.sin(a) * 190, 46); }
      draw(L.x, L.y, L.r); draw(R.x, R.y, R.r);
    }, 2048, 1024);
  }
  const PANELS = [
    [1, "THE SAME SIZE", "Two eye flowers, the same size. The ones around them lie.", null],
    [2, "THE WALL IS STRAIGHT", "Every row of tiles is level. The mortar makes them lean.", cafeWall],
    [3, "NOTHING IS MOVING", "Look at one disc and the next one turns. Look at that one and it stops.", rotatingSnakes],
    [4, "THERE IS NO SPIRAL", "Trace one line with your eye. It is a circle. They all are.", fraser],
    [5, "THE LINES ARE PARALLEL", "The hatches push them apart. They are not apart.", zollner]
  ];
  const flowerImg = new Image(); flowerImg.crossOrigin = "anonymous"; flowerImg.src = "assets/flower.png";
  function panel(k, title, text, maker) {
    const y = F[k]; const tex = maker ? maker() : ebbinghaus(null);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(7.5, y + 2.2, 32.78); m.rotation.y = Math.PI; world.add(m);
    box(7.5, y + 2.2, 32.82, 6.56, 3.36, 0.06, MAT.frame, false, false);
    sign(7.5, y + 4.25, 32.76, 3.6, 0.42, signTex(title, { w: 1300, h: 150 }), Math.PI);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshBasicMaterial({ map: M.wallText([["“" + title + "”", "k"], [text, "p"]], { w: 1100, h: 250, hs: 40 }) })); pl.position.set(7.5, y + 0.3 + 0.9, 32.76); pl.rotation.y = Math.PI; world.add(pl);
    if (!maker) flowerImg.addEventListener("load", () => { m.material.map = ebbinghaus(flowerImg); m.material.needsUpdate = true; });
    return m;
  }
  for (const [k, t, txt, mk] of PANELS) panel(k, t, txt, mk);

  /* ---------- the anamorphic painting on the atrium floor: one spot on the floor 3 balcony resolves it ---------- */
  M.buildAnamorph = function (work) {
    const E = new THREE.Vector3(0, F3 + 1.6, 31.6), target = new THREE.Vector3(0, F2 + 0.02, 22.5);
    const D = target.clone().sub(E).normalize(), Rv = new THREE.Vector3().crossVectors(D, new THREE.Vector3(0, 1, 0)).normalize(), U = new THREE.Vector3().crossVectors(Rv, D).normalize();
    const floorY = F2 + 0.015, N = 48;
    // the picture: a 16:9 rectangle on a plane 1 m in front of the eye; find the half height that lands the floor quad inside x -9..9, z 18..29
    let hh = 0.5;
    const corner = (u, v) => { const p = E.clone().addScaledVector(D, 1).addScaledVector(Rv, u).addScaledVector(U, v); const dir = p.sub(E); const t = (floorY - E.y) / dir.y; return E.clone().addScaledVector(dir, t); };
    for (let i = 0; i < 40; i++) { const cs = [corner(-hh * 16 / 9, -hh), corner(hh * 16 / 9, -hh), corner(-hh * 16 / 9, hh), corner(hh * 16 / 9, hh)]; const ok = cs.every(c => c.x > -9 && c.x < 9 && c.z > 17.5 && c.z < 29.2); if (ok) hh *= 1.06; else { hh /= 1.06; break; } }
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const u = (i / N - 0.5) * 2 * hh * 16 / 9, v = (j / N - 0.5) * 2 * hh; const c = corner(u, v); pos.push(c.x, floorY, c.z); uv.push(i / N, j / N); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = img(M.ART + work.f); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); world.add(mesh); M.artMats.push(mesh.material);
    // the spot: an eye flower on the balcony floor and the plaque at the rail
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: img("assets/flower.png"), transparent: true })); spot.rotation.x = -Math.PI / 2; spot.position.set(0, F3 + 0.012, 31.6); world.add(spot);
    sign(0, F3 + 0.6, 31.6, 1.4, 0.26, signTex("STAND HERE", { w: 800, h: 150, bg: "#ff6b00", fg: "#0d0d0d" }), 0, true);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.54), new THREE.MeshBasicMaterial({ map: M.wallText([[work.t, "k"], ["Painted on the atrium floor for this one spot. Step left or right and it melts. No. " + work.n + ", the curator's first pick.", "p"]], { w: 1100, h: 330, hs: 40 }) })); pl.position.set(2.4, F3 + 1.0, 30.6); pl.rotation.x = -0.55; world.add(pl);
    // a mark on the floor itself, read from anywhere: where to stand
    sign(0, F2 + 0.6, 29.6, 2.2, 0.3, signTex("LOOK FROM FLOOR 3", { w: 1100, h: 150 }), Math.PI, true);
  };

  /* ---------- the Penrose triangle on the terrace: three beams that only close from one spot ---------- */
  {
    const grp = new THREE.Group(); const L = 2.4, T = 0.42, mat = MAT.orange;
    const beam = (x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = M.hi(); grp.add(m); };
    beam(L / 2, 0, 0, L + T, T, T); beam(L, L / 2, 0, T, L + T, T); beam(L, L, L / 2 - T * 0.6, T, T, L - T * 1.2);
    const diag = new THREE.Vector3(1, 1, 1).normalize(), dir = new THREE.Vector3(0, 0, 1);
    grp.quaternion.setFromUnitVectors(diag, dir); grp.rotateOnWorldAxis(dir, 0.0);
    const centre = new THREE.Vector3(6, F6 + 2.05, 9.0); grp.position.copy(centre).sub(new THREE.Vector3(L / 2, L / 2, L / 2).applyQuaternion(grp.quaternion)); world.add(grp);
    box(6, F6 + 0.3, 9.0, 1.6, 0.6, 1.6, MAT.red, true);
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: img("assets/flower.png"), transparent: true })); spot.rotation.x = -Math.PI / 2; spot.position.set(6, F6 + 0.012, 1.5); world.add(spot);
    sign(6, F6 + 0.5, 1.5, 1.4, 0.26, signTex("STAND HERE", { w: 800, h: 150, bg: "#ff6b00", fg: "#0d0d0d" }), 0, true);
    sign(6, F6 + 0.95, 10.0, 1.6, 0.3, signTex("TRIANGLE", { w: 800, h: 150 }), Math.PI);
    M.penrose = grp;
  }

  /* ---------- the hollow eye over the garden doors: concave, it follows you around the Garden Lobby ---------- */
  {
    const geo = new THREE.SphereGeometry(1.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const eye = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: img("assets/nazar.png"), side: THREE.BackSide, roughness: 0.35, envMapIntensity: 0.3 }));
    eye.rotation.x = Math.PI / 2; eye.position.set(0, 4.2, 39.4); world.add(eye);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 10, 48), MAT.brass); ring.position.set(0, 4.2, 39.4); world.add(ring);
    sign(0, 2.45, 39.6, 1.6, 0.3, signTex("EYE", { w: 700, h: 150 }), Math.PI);
  }

  /* ---------- the mirror at the end of the escalator hall: the escalators go on forever (high quality) ---------- */
  M.mirror = null;
  if (M.hi() && THREE.Reflector) {
    const mirror = new THREE.Reflector(new THREE.PlaneGeometry(13.6, 5.6), { clipBias: 0.003, textureWidth: 1024, textureHeight: 512, color: 0x9aa4aa });
    mirror.position.set(-21, 2.95, 39.76); mirror.rotation.y = Math.PI; world.add(mirror); M.mirror = mirror;
    box(-21, 2.95, 39.78, 13.8, 5.8, 0.02, MAT.blackSteel, false, false).position.z = 39.82;
    sign(-21, 5.75, 39.7, 1.8, 0.3, signTex("MIRROR", { w: 700, h: 150 }), Math.PI);
  }

  /* ---------- the Penn Station set runs the lobby ---------- */
  P("penn_census_desk", 0, 0, 9, { h: 1.15, yaw: Math.PI, pri: true });
  P("marks_taker", 0, 0, 9.6, { h: 1.8, yaw: Math.PI, pri: true });
  P("marks_stamp", -2.2, 1.05, 8, { w: 0.35, solid: false }); P("marks_seal", 2.4, 1.05, 8, { w: 0.4, solid: false });
  P("marks_dispenser", 9, 0, 11.5, { h: 1.3 }); P("penn_lamp", -11, 0, 2.6, { h: 3.2 }); P("penn_lamp", 11, 0, 2.6, { h: 3.2 });
  P("penn_luggage", -12.2, 0, 5.4, { w: 1.4, yaw: 0.4 }); P("penn_baggage_wagon", -12, 0, 14, { w: 2.2, yaw: Math.PI / 2 });
  P("penn_shoeshine", -11.5, 0, 26, { w: 2.0, yaw: Math.PI / 2 }); P("penn_newsstand", 11.2, 0, 27, { w: 2.6, yaw: -Math.PI / 2 });
  P("penn_eagle", -9.5, 0.8, 36.5, { w: 2.6, yaw: Math.PI - 0.4 }).then(o => { if (o) box(-9.5, 0.4, 36.5, 2.2, 0.8, 1.6, MAT.sand, true); });
  P("h_yellin_lantern", 0, 4.4, 20, { h: 1.6, solid: false }).then(o => { if (o) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), MAT.steel); ch.position.set(0, 5.5, 20); world.add(ch); M.point(0, 4.0, 20, 0.9, 10, 0xffd9a0); } });
  P("bell", -11.8, 0, 36, { h: 1.4 }).then(o => { if (o) o.userData.tag = "bell"; });
  P("marks_cat", -17.3, 1.02, 3.0, { w: 0.5, solid: false, yaw: 2.4 });
  P("globe_stand", -34, 0, 7, { h: 1.6 }); P("ph_marble_bust_01", -36, 1.0, 20, { h: 0.6, solid: false }).then(o => { if (o) box(-36, 0.5, 20, 0.6, 1.0, 0.6, MAT.sand, true); });
  P("barney_greengrass", 37.6, 1.06, 9, { w: 1.2, solid: false, yaw: -Math.PI / 2 });
  P("bartender", 38.8, 0, 11, { h: 1.8, yaw: -Math.PI / 2 }); P("nyb_disco_chandelier", 27, 4.9, 11, { w: 1.6, solid: false });
  P("nyb_devils_lion", 15.5, 0, 2.5, { h: 1.1, yaw: Math.PI / 2 }); P("nyb_crown_bust", 38.5, 0, 20.5, { h: 1.6 });
  // the cafe's north wall gets the cafe wall illusion in real tile
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(24, 4.4), new THREE.MeshStandardMaterial({ map: cafeWall(), roughness: 0.3, envMapIntensity: 0.6 })); m.position.set(27, 2.4, 21.6); m.rotation.y = Math.PI; world.add(m); sign(27, 5.0, 21.58, 3.2, 0.42, signTex("THE WALL IS STRAIGHT", { w: 1300, h: 150 }), Math.PI); }
  // the store's south glass gets the eye flower wallpaper on its inside piers; the escalator hall gets the Families and the mirror
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.4), new THREE.MeshStandardMaterial({ map: rep("assets/flower.png", 8, 3.6), transparent: true, roughness: 0.8 })); m.position.set(-34, 2.9, 21.6); m.rotation.y = Math.PI; world.add(m); }

  /* ---------- the atrium: the whale joins the sauropod; blossoms on the south balcony; the cast in bronze along the void ---------- */
  P("blue_whale", 0, F3 + 1.6, 22, { w: 12, solid: false, yaw: Math.PI / 2 }).then(o => { if (!o) return; M.whale = o; for (const x of [-4, 4]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 7, 6), MAT.steel); ch.position.set(x, F3 + 6, 22); world.add(ch); } });
  for (const [b, x] of [["blossom_02", -9], ["blossom_04", -3], ["blossom_05", 3], ["blossom_07", 9]]) P(b, x, F2 + 0.3, 3.6, { h: 2.6 }).then(o => { if (o) box(x, F2 + 0.15, 3.6, 2.0, 0.3, 2.0, MAT.sand, true); });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.45, metalness: 0.85, envMapIntensity: 0.9 });
  const CAST = [["boxer", "The Boxer"], ["dancer", "The Dancer"], ["actress", "The Actress"], ["folksinger", "The Folk Singer"], ["broker", "The Broker"], ["hustler", "The Hustler"], ["writer", "The Writer"], ["usher", "The Usher"], ["auggie", "Auggie"], ["felix", "Felix"]];
  CAST.forEach(([name, label], i) => {
    const side = i < 5 ? -1 : 1, z = 12.5 + (i % 5) * 3.6, x = side * 9.2;
    box(x, F2 + 0.35, z, 1.1, 0.7, 1.1, MAT.red, true);
    P(name, x, F2 + 0.7, z, { h: 1.85, yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2, mat: bronze, solid: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.16), new THREE.MeshBasicMaterial({ map: canvasTex((g, w, h) => { g.fillStyle = "#f3f1ea"; g.fillRect(0, 0, w, h); g.fillStyle = "#0d0d0d"; g.font = "600 44px Fraunces, Georgia, serif"; g.fillText(label, 24, 62); g.font = "500 24px 'IBM Plex Mono', Menlo, monospace"; g.fillStyle = "#555"; g.fillText("BRONZE, FROM THE ON LOCATION CAST", 24, 104); }, 640, 128) })); pl.position.set(x - side * 0.56, F2 + 0.5, z); pl.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; world.add(pl);
  });
  sign(-9.2, F2 + 3.6, 10.6, 2.2, 0.36, signTex("THE CAST", { w: 800, h: 130 }), 0); sign(9.2, F2 + 3.6, 10.6, 2.2, 0.36, signTex("THE CAST", { w: 800, h: 130 }), 0);
  P("sarcophagus", -8, F[4], 4.5, { w: 2.4, yaw: Math.PI / 2 }).then(o => { if (o) sign(-8, F[4] + 1.3, 3.0, 2.4, 0.3, signTex("ON LOAN FROM 82ND STREET", { w: 1400, h: 150 }), 0); });
  P("corinthian_capital", 12.5, F[2], 8, { h: 1.3 }); P("ionic_capital", 12.5, F[3], 8, { h: 1.1 }); P("newel_urn", -12.5, F[3], 8, { h: 1.2 });
  P("marks_tower", -8, F6, 3.5, { h: 3.2 }); P("lantern", 12, F6, 3, { h: 1.2 }); P("captains_hat", -3, F6 + 0.75, 4.5, { w: 0.4, solid: false });
  P("hook", 12.6, F6 + 1.4, 8.5, { h: 1.6, solid: false }); P("porthole", -13.5, F6 + 2.0, 8.6, { w: 0.9, solid: false, yaw: Math.PI / 2 }); P("ships_wheel", 13.5, F6 + 1.5, 8.6, { w: 1.2, solid: false, yaw: -Math.PI / 2 });
  P("usher", -2.5, F6, 38.6, { h: 1.8, yaw: Math.PI });

  /* ---------- 53rd and 54th: the kiosk, stoops, fire escapes, water towers, phone booths ---------- */
  P("h_irt_kiosk", 46, 0, -5.2, { h: 3.6, yaw: 0 }).then(o => { if (o) { sign(46, 3.9, -3.3, 2.6, 0.3, signTex("UNCOUNTED ST", { w: 1000, h: 130, bg: "#0c1016", fg: "#f0efea", quotes: false }), 0, true); M.point(46, 3, -5.2, 0.8, 8, 0xd8ffd8); } });
  for (const x of [-84, -52, -20, 16, 44, 76]) P("stoop", x, 0, -26.6, { w: 3.2, yaw: Math.PI });
  for (const x of [-96, -30, 30, 96]) P("ph_modular_fire_escape", x, 4, -25.9, { h: 9, solid: false });
  for (const [x, z, h] of [[-62, -33, 34], [0, -33, 44], [62, -33, 38], [-30, 99, 26], [30, 99, 28], [-54, 20, 28], [54, 20, 30]]) P("water_tower", x + rnd(-6, 6), h, z, { h: 5.5, solid: false });
  P("nyb_afterhours_phone", -34, 0, -7.6, { h: 2.4, yaw: 0 }); P("nyb_diehard_phone", 58, 0, -7.6, { h: 2.4, yaw: 0 });
  P("nyb_hydrant_gold", -58, 0, -8.4, { h: 0.8 }); P("nyb_hydrant_pink", 66, 0, 74.6, { h: 0.8 });
  P("ph_water_manhole_cover", -8, 0.01, -14, { w: 0.9, solid: false }); P("ph_water_manhole_cover", 24, 0.01, -16, { w: 0.9, solid: false });
  P("ph_painted_wooden_bench", -27, 0, -4, { w: 1.8 }); P("ph_painted_wooden_bench", 30, 0, -4, { w: 1.8 });
  P("maitre", 14.6, 0, -2.6, { h: 1.8, yaw: Math.PI + 0.3 }); P("wiseguy", 38.6, 0, -3.4, { h: 1.8, yaw: 0.5 }); P("workgirl", -22, 0, 70.6, { h: 1.75, yaw: 1.4 });
  P("nyb_chainlink", -46, 0, 70, { w: 6, yaw: 0 });

  /* ---------- the garden: the Central Park corner, the harbour pieces, the Rat King's court ---------- */
  P("cp_carriage", -13, 0, 50.5, { w: 3.6, yaw: Math.PI / 2 }); P("cp_statue", -16.5, 0.6, 56, { h: 2.6 }).then(o => { if (o) box(-16.5, 0.3, 56, 1.2, 0.6, 1.2, MAT.sand, true); });
  P("cp_globe", 34, 0, 48, { h: 2.2 }); P("cp_palm", 36.5, 0, 42.5, { h: 2.6 }); P("cp_bench", 30, 0, 52, { w: 2.0, yaw: Math.PI }); P("cp_press", 22, 0, 43, { h: 1.6, yaw: Math.PI });
  P("penn_capital", 36, 0, 64, { w: 1.8 }); P("h_ferry", 24, 0.26, 57.7, { w: 3.6, solid: false, yaw: Math.PI / 2 }).then(o => { if (o) M.ferry = o; }); P("h_tug", 12, 0.26, 48.7, { w: 2.0, solid: false, yaw: -Math.PI / 2 }).then(o => { if (o) M.tug = o; });
  P("marks_monte", -4, 0, 60.5, { h: 1.0, yaw: 0.3 }); P("marks_rat", -3.2, 1.0, 60.5, { w: 0.6, solid: false, yaw: 1.2 }); P("marks_rat", -5.5, 0, 61.8, { w: 0.7, solid: false, yaw: -0.8 });
  sign(-4, 1.9, 60.5, 2.2, 0.3, signTex("THE RAT KING'S COURT", { w: 1200, h: 150 }), 0, true);
  P("buoy", 2, 0, 64.5, { h: 1.6 }); P("lobster_trap", 4.5, 0, 64.6, { w: 1.0 }); P("cleat", 7, 0, 64.6, { w: 0.6 }); P("life_ring", -19.6, 1.6, 48, { w: 0.9, solid: false, yaw: Math.PI / 2 });
  P("gull", 8, 0.37, 50.6, { h: 0.3, solid: false }); P("gull", 30, 0.37, 59.6, { h: 0.3, solid: false, yaw: 2 });
  P("palm_urn", -18, 0, 44, { h: 1.1 }); P("palm_urn", 38, 0, 64.5, { h: 1.1 }); P("agent", 16, 0, 46.5, { h: 1.8, yaw: Math.PI + 0.4 }); P("lensman", 0, 0, 56, { h: 1.8, yaw: 0.6 });
  P("h_forklift", 38.8, 0, 72, { w: 3.0, yaw: Math.PI / 2 });

  /* ---------- what moves here ---------- */
  M.tickDress = function (dt, t, Pl) {
    if (M.whale) { M.whale.position.y = F3 + 1.6 + Math.sin(t * 0.4) * 0.15; M.whale.rotation.y = Math.PI / 2 + Math.sin(t * 0.17) * 0.12; }
    if (M.ferry) { M.ferry.position.x = 24 + Math.sin(t * 0.15) * 7; M.ferry.rotation.y = Math.PI / 2 + (Math.cos(t * 0.15) > 0 ? 0 : Math.PI); }
    if (M.tug) { M.tug.position.x = 12 - Math.sin(t * 0.2) * 9; M.tug.rotation.y = -Math.PI / 2 + (Math.cos(t * 0.2) > 0 ? Math.PI : 0); }
    if (M.mirror) M.mirror.visible = Math.hypot(Pl.x + 21, Pl.z - 31) < 32 && Pl.y < 9;
  };
})(window.M);
