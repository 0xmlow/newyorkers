/* MoMLOW props: MLow's Tripo heroes and the CC0 library (GLB, some Draco), the cabs with their MLOW toppers and the
   traffic on both streets, the set pieces a real museum cannot have, the animals, and everything that moves. */
(function (M) {
  "use strict";
  const { world, MAT, box, sign, signTex, addSolid, rnd, FLOORS: F } = M;
  const gltf = new THREE.GLTFLoader();
  if (THREE.DRACOLoader) { const d = new THREE.DRACOLoader(); d.setDecoderPath("assets/draco/"); gltf.setDRACOLoader(d); }
  M.gltf = gltf;   // shared with people.js (one Draco worker pool)
  const cache = {}, all = M.allProps = [];
  function load(name) { if (!cache[name]) cache[name] = new Promise((res, rej) => gltf.load(`assets/glb/${name}.glb`, g => res(g.scene), undefined, rej)); return cache[name]; }
  const tb = new THREE.Box3(), tv = new THREE.Vector3();
  /* the queue: nothing loads until it is near the visitor's turn. Four files in flight; the nearest waiting item goes next,
     measured from the visitor (or the door before the page runs). Props with priority go first whatever the distance. */
  const waiting = []; let inflight = 0; const MAXF = 4;
  M.queued = () => waiting.length + inflight;
  function pump() {
    while (inflight < MAXF && waiting.length) {
      const px = M.P ? M.P.x : 0, pz = M.P ? M.P.z : -8;
      let best = 0, bd = Infinity;
      for (let i = 0; i < waiting.length; i++) { const w = waiting[i]; const d = (w.pri ? -1e6 : 0) + Math.hypot(w.x - px, w.z - pz) + Math.abs(w.y - (M.P ? M.P.y : 1.6)) * 2 + (cache[w.name] ? -40 : 0); if (d < bd) { bd = d; best = i; } }
      const w = waiting.splice(best, 1)[0]; inflight++; w.go();
    }
  }
  const turn = (name, x, y, z, pri) => new Promise(res => { waiting.push({ name, x, y, z, pri, go: res }); pump(); });
  const done = () => { inflight--; pump(); };
  setInterval(pump, 400);
  /* place a model: scaled to a height (h) or a footprint (w), its base on y, centred on x and z, optional yaw, material, variant pick */
  M.prop = function (name, x, y, z, opt) {
    opt = opt || {};
    const pr = (async () => {
      await turn(name, x, y, z, opt.pri);
      let src; try { src = await load(name); } catch (e) { (window.__propFail = window.__propFail || []).push(name); done(); return null; }
      done();
      const o = src.clone(true);
      if (opt.pick) { const drop = []; o.traverse(m => { if (m.isMesh && !opt.pick.test(m.name)) drop.push(m); }); for (const m of drop) m.parent.remove(m); }
      o.traverse(m => { if (m.isMesh) { m.castShadow = M.hi() && opt.shadow !== false; m.receiveShadow = true; if (opt.mat) m.material = opt.mat; else if (m.material) { m.material.envMapIntensity = opt.env == null ? 0.5 : opt.env; if (m.material.map) m.material.map.anisotropy = Math.min(8, M.ANISO); } } });
      o.rotation.y = opt.yaw || 0; o.updateMatrixWorld(true);
      tb.setFromObject(o); tb.getSize(tv);
      const s = opt.h ? opt.h / tv.y : opt.w ? opt.w / Math.max(tv.x, tv.z) : (opt.scale || 1);
      o.scale.setScalar(s); o.updateMatrixWorld(true); tb.setFromObject(o);
      o.position.set(x - (tb.min.x + tb.max.x) / 2, y - tb.min.y + (opt.lift || 0), z - (tb.min.z + tb.max.z) / 2); o.updateMatrixWorld(true);
      (opt.parent || world).add(o); tb.setFromObject(o);
      if (opt.solid !== false && !opt.parent) addSolid(tb.min.x, tb.max.x, tb.min.z, tb.max.z, tb.min.y, tb.max.y);
      o.userData.name = name; o.userData.box = tb.clone(); if (opt.tag) o.userData.tag = opt.tag;
      return o;
    })();
    all.push(pr); return pr;
  };
  const P = M.prop;

  /* ---------- cabs: the five types MLow photographed, the MLOW topper on the roof, the screens from the atlas ---------- */
  const CABS = [{ n: "h_taxi", len: 4.6 }, { n: "h_taxi_escape", len: 4.6 }, { n: "h_taxi_nv200", len: 4.4 }, { n: "h_taxi_sienna", len: 5.17 }, { n: "h_taxi_camry", len: 4.88 }];
  const screensTex = M.img("assets/taxi/screens.jpg");
  function screenMat(slot) { const t = screensTex.clone(); t.needsUpdate = true; t.repeat.set(0.5, 1 / 6); t.offset.set((slot % 2) * 0.5, 1 - (Math.floor(slot / 2) + 1) / 6); return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); }
  // screens.jpg has its image at load time? No: clone before load stays empty. Build the screen materials once the atlas is in.
  const screenMats = []; let screensReady = false; const pendingScreens = [];
  screensTex.image && (screensReady = true);
  M.texLoader.load("assets/taxi/screens.jpg", (t) => { t.encoding = THREE.sRGBEncoding; for (let i = 0; i < 12; i++) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(0.5, 1 / 6); c.offset.set((i % 2) * 0.5, 1 - (Math.floor(i / 2) + 1) / 6); screenMats.push(new THREE.MeshBasicMaterial({ map: c, toneMapped: false })); } screensReady = true; for (const f of pendingScreens) f(); });
  const cabs = M.cabs = [];
  M.cab = async function (type, x, z, yaw, opt) {
    opt = opt || {}; const kind = CABS[type % CABS.length];
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; world.add(g);
    const o = await P(kind.n, 0, 0, 0, { w: kind.len, parent: g, solid: false, yaw: Math.PI / 2, pri: opt.pri });   // the Tripo cabs face +x; the group turns them
    if (!o) return null;
    // the roof: the highest band of vertices; the topper sits centred on it
    let top = -1e9; const pts = []; const v = new THREE.Vector3();
    o.updateMatrixWorld(true);
    o.traverse(c => { if (!c.isMesh) return; const pa = c.geometry.attributes.position; for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i).applyMatrix4(c.matrixWorld); pts.push(v.clone()); if (v.y > top) top = v.y; } });
    const roof = new THREE.Box3(); for (const p of pts) if (p.y > top - 0.14) roof.expandByPoint(p);
    g.worldToLocal(roof.min); g.worldToLocal(roof.max);
    const rx = (roof.min.x + roof.max.x) / 2, rz = (roof.min.z + roof.max.z) / 2, len = Math.abs(roof.max.x - roof.min.x);
    const TL = Math.min(1.2, Math.max(0.8, len * 0.7)), TH = 0.38, TT = 0.18, ty = top - g.position.y + 0.07 + TH / 2;
    const frame = new THREE.MeshStandardMaterial({ color: 0x2a2d30, metalness: 0.6, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(TL, TH, TT), frame); body.position.set(rx, ty, rz); g.add(body);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(TL * 0.8, 0.09, 0.07), frame); legs.position.set(rx, ty - TH / 2 - 0.045, rz); g.add(legs);
    const slot = opt.slot == null ? (Math.random() < 0.4 ? 0 : 1 + Math.floor(Math.random() * 11)) : opt.slot;
    const put = () => { for (const side of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(TL * 0.95, TH * 0.86), screenMats[slot]); p.position.set(rx, ty, rz + side * (TT / 2 + 0.003)); p.rotation.y = side > 0 ? 0 : Math.PI; g.add(p); } };
    if (screensReady) put(); else pendingScreens.push(put);
    const rec = { g, len: kind.len, speed: opt.speed || 0, lane: opt.lane, x, z, yaw, parked: !opt.speed, honk: 0 };
    if (rec.parked) addSolid(x - kind.len / 2 - 0.2, x + kind.len / 2 + 0.2, z - 1.1, z + 1.1, 0, 1.7);
    cabs.push(rec); return rec;
  };
  // parked at the curb on 53rd, a cabbie beside one; traffic in both directions on both streets
  M.cab(0, -14, -10.3, 0, { slot: 0, pri: true }); M.cab(3, 24, -10.3, 0, { slot: 4 }); M.cab(1, -44, -10.3, 0, { slot: 7 });
  P("cabbie", -11, 0, -8.2, { h: 1.8, yaw: 2.6 });
  for (let i = 0; i < 6; i++) M.cab((i + 2) % 5, -120 + i * 42, -12.2, Math.PI, { speed: 7 + i * 0.6, lane: -1 });
  for (let i = 0; i < 5; i++) M.cab((i + 1) % 5, -100 + i * 48, -17.2, 0, { speed: 6.5 + i * 0.7, lane: 1 });
  for (let i = 0; i < 4; i++) M.cab(i % 5, -110 + i * 55, 78.2, Math.PI, { speed: 7 + i, lane: -1 });
  for (let i = 0; i < 4; i++) M.cab((i + 3) % 5, -90 + i * 55, 83.2, 0, { speed: 6 + i, lane: 1 });

  /* ---------- 53rd Street dressing ---------- */
  for (const x of [-30, -8, 12, 34, 58, -58]) P("lamppost", x, 0, -8.6, { h: 6.2 });
  for (const x of [-22, -46, 48, 70]) P("tree_plane", x, 0, -5.2, { h: 8.5, solid: false, pick: /^v0_hi/ }).then(o => o && addSolid(x - 0.4, x + 0.4, -5.6, -4.8, 0, 3));
  for (const x of [-70, -34, 20, 44, 82]) P("tree_plane", x, 0, -22.6, { h: 8, solid: false, pick: /^v1_hi/ });
  P("mailbox", 26, 0, -8.3, { h: 1.25 }); P("hydrant", -17, 0, -8.4, { h: 0.8 }); P("hydrant", 40, 0, -8.4, { h: 0.8 });
  P("nyb_coffeecart", 16.5, 0, -6.3, { h: 2.1, yaw: Math.PI }); P("hotdog", -20, 0, -6.4, { h: 2.0, yaw: 0.3 });
  P("marks_newsstand", 38, 0, -5.2, { h: 2.6, yaw: Math.PI });
  P("nyb_barrier", -7, 0, -8.6, { h: 1.05, yaw: 0.1 }); P("nyb_barrier", 7.5, 0, -8.6, { h: 1.05, yaw: -0.1 });
  P("nyb_aframe_sign", 9.5, 0, -4.5, { h: 1.0, yaw: -0.4 });
  for (const x of [-12, 13]) P("ph_metal_trash_can", x, 0, -8.5, { h: 1.0 });
  for (const x of [-36, 36]) P("ph_planter_box_01", x, 0, -3.2, { w: 2.2 });
  P("utility_pole", 52, 0, -8.8, { h: 9 }); P("storm_drain", 4, 0.01, -9.3, { w: 0.9, solid: false });
  { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), MAT.orange); cone.position.set(-6.5, 0.35, -9.7); cone.castShadow = M.hi(); world.add(cone); }
  for (const [x, z] of [[-3.4, -6.2], [5.1, -4.4], [15.5, -7.3], [-12.2, -3.1], [30, -5]]) P("pigeon", x, 0, z, { h: 0.28, yaw: rnd(0, 6.28), solid: false }).then(o => o && M.pigeons.push({ o, home: o.position.clone(), t: rnd(0, 6) }));
  M.pigeons = []; M.dog = null; P("dog", -30, 0, -4, { h: 0.6, solid: false }).then(o => { M.dog = o; });
  // 54th Street
  for (const x of [-30, 10, 50]) P("lamppost", x, 0, 74.6, { h: 6.2 }); for (const x of [-50, 0, 30, 70]) P("tree_plane", x, 0, 70.5, { h: 8.5, solid: false, pick: /^v0_lo/ });

  /* ---------- the lobby, the store, the cafe ---------- */
  P("rope_stanchion", -4.9, 0, 9, { h: 1.0 }); P("rope_stanchion", 4.9, 0, 9, { h: 1.0 });
  P("penn_stanchion", -10, 0, 38, { h: 1.0 }); P("penn_stanchion", 10, 0, 38, { h: 1.0 });
  P("mlow_wordmark_relief", 0, 4.6, 39.7, { w: 3.6, solid: false, yaw: Math.PI });
  P("penn_turnstile", -9, 0, 11.5, { h: 1.0, solid: false, yaw: Math.PI / 2 });
  // the store: shelves, the register, MLOWTAR by the door telling fortunes
  P("ph_wooden_display_shelves_01", -34, 0, 12, { h: 2.0, yaw: Math.PI / 2 }); P("ph_wooden_display_shelves_01", -34, 0, 17, { h: 2.0, yaw: Math.PI / 2 });
  P("ph_steel_frame_shelves_03", -21, 0, 19.6, { h: 2.1, yaw: Math.PI }); P("ph_Shelf_01", -36, 0, 4, { h: 1.9, yaw: Math.PI / 2 });
  box(-17.5, 0.5, 3.6, 3.0, 1.0, 0.9, MAT.charcoal, true); P("ph_CashRegister_01", -17.5, 1.0, 3.6, { h: 0.5, solid: false, yaw: Math.PI });
  P("mlowtar", -16.5, 0, 19.5, { h: 2.2, yaw: Math.PI, tag: "MLOWTAR" }); P("ph_postcard_set_01", -27.6, 0.92, 7.1, { w: 0.5, solid: false });
  // the cafe: tables and chairs, a counter, the whale from the kit on the back wall
  for (const [x, z] of [[20, 6], [26, 6], [32, 6], [20, 13], [26, 13], [32, 13]]) { P("ph_round_wooden_table_01", x, 0, z, { h: 0.75 }); for (const [dx, dz, yaw] of [[0, 1.0, Math.PI], [0, -1.0, 0], [1.0, 0, -Math.PI / 2]]) P("ph_dining_chair_02", x + dx, 0, z + dz, { h: 0.9, yaw }); }
  box(37.6, 0.5, 11, 1.2, 1.0, 10, MAT.charcoal, true); box(37.6, 1.03, 11, 1.3, 0.06, 10.2, MAT.plaque, false); for (const z of [7.5, 10, 12.5, 15]) P("ph_bar_chair_round_01", 36.3, 0, z, { h: 0.75 });
  P("ph_Sofa_01", 24, 0, 19.8, { w: 2.4, yaw: Math.PI }); P("ph_potted_plant_02", 15.5, 0, 20.5, { h: 1.6 }); P("ph_potted_plant_01", 38.5, 0, 20.5, { h: 1.5 });
  P("ph_bronze_whale_statue", 30, 0.9, 21.2, { w: 1.6, solid: false });
  // the escalator hall: planters at the landings
  P("ph_potted_plant_01", -27, 0, 23, { h: 1.5 }); P("ph_potted_plant_02", -15, 0, 23, { h: 1.5 });

  /* ---------- the atrium: the things a real museum cannot do ---------- */
  // Liberty, 14 metres, standing on the atrium floor; you pass her torch from the bridge
  P("liberty_statue", 0, F[1], 15, { h: 14, yaw: Math.PI, mat: new THREE.MeshStandardMaterial({ color: 0x6fae95, roughness: 0.7, metalness: 0.15, envMapIntensity: 0.5 }) }).then(o => { if (o) { box(0, F[1] + 0.3, 15, 4.2, 0.6, 4.2, MAT.red, true); sign(0, F[1] + 0.95, 17.15, 2.4, 0.3, signTex("LIBERTY", { w: 900, h: 110 }), 0); } });
  // a sauropod from across the park, because this is a virtual museum and the rules are ours
  P("sauropod_skeleton", 4, F[1], 26, { h: 9.5, yaw: -0.5, solid: false }).then(o => { if (o) { addSolid(1.5, 6.5, 23.5, 28.5, F[1], F[1] + 3); sign(4, F[1] + 0.9, 23.2, 2.6, 0.3, signTex("ON LOAN FROM 79TH STREET", { w: 1400, h: 150 }), 0); } });
  // the Delacorte clock animals, as a carousel floating in the void at floor 5
  const carousel = M.carousel = new THREE.Group(); carousel.position.set(0, 25.2, 20); world.add(carousel);
  const animals = ["h_clock_bear", "h_clock_elephant", "h_clock_goat", "h_clock_hippo", "h_clock_kangaroo", "h_clock_penguin"];
  animals.forEach((a, i) => { const ang = i / 6 * Math.PI * 2; P(a, Math.cos(ang) * 5.6, 0, Math.sin(ang) * 5.6, { h: 1.9, yaw: -ang + Math.PI / 2, parent: carousel, solid: false }); });
  { const ring = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.12, 10, 64), MAT.brass); ring.rotation.x = Math.PI / 2; ring.position.y = -0.1; carousel.add(ring); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 24), MAT.brass); carousel.add(hub); for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.06, 0.06), MAT.brass); sp.position.set(Math.cos(i / 6 * Math.PI * 2) * 2.8, 0, Math.sin(i / 6 * Math.PI * 2) * 2.8); sp.rotation.y = -i / 6 * Math.PI * 2; carousel.add(sp); } }
  // the subway car hanging from the skylight at floor 6, turning slowly
  const car = M.subwayCar = new THREE.Group(); car.position.set(0, 30.6, 20); world.add(car);
  P("h_subway_car", 0, -1.6, 0, { w: 16, parent: car, solid: false, yaw: 0 });
  for (const x of [-6, 6]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.6, 6), MAT.steel); ch.position.set(x, 2.3, 0); car.add(ch); }
  // the mobile under the skylight
  P("mobile", 0, M.ROOF - 4.2, 24, { w: 7, solid: false }).then(o => { M.mobile = o; });
  // a calcified hydrant in a vitrine at the top of the escalators on floor 2 (Arsham)
  P("hydrant", -21, F[1], 39.2, { h: 0.8, mat: MAT.bone, solid: false }).then(o => { if (!o) return; box(-21, F[1] + 0.75, 39.2, 0.9, 1.5, 0.9, MAT.glassRail, true, false); box(-21, F[1] + 0.05, 39.2, 0.9, 0.1, 0.9, MAT.red, false); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.04, 0.09), 0), MAT.calcite); c.position.set(-21 + rnd(-0.2, 0.2), F[1] + rnd(0.4, 0.8), 39.2 + rnd(-0.2, 0.2)); world.add(c); } });
  // the terrace on 6: the water tower, cafe tables
  P("water_tower", 10, F[5], 4, { h: 7.5 }); for (const x of [-9, -3, 3]) { P("ph_round_wooden_table_01", x, F[5], 4.5, { h: 0.75 }); P("ph_dining_chair_02", x + 1, F[5], 4.5, { h: 0.9, yaw: -Math.PI / 2 }); }
  P("fire_escape", 39.6, F[4], 20, { h: 9, solid: false, yaw: -Math.PI / 2 });
  // track lights in the rooms: a run per long wall
  for (const key in M.ROOMS) { const r = M.ROOMS[key]; if (!r.walls.length || r.y === 0) continue; const seg = r.walls.slice().sort((a, b) => b.len - a.len)[0]; const n = Math.max(2, Math.round(seg.len / 4)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; P("track_light", seg.ax + (seg.bx - seg.ax) * t + seg.nx * 1.4, r.y + r.h - 0.55, seg.az + (seg.bz - seg.az) * t + seg.nz * 1.4, { h: 0.45, solid: false, shadow: false }); } }

  /* ---------- the garden ---------- */
  P("mlow_eye_monument", 12, 0.5, 44.5, { h: 5.2 }).then(o => { if (o) box(12, 0.25, 44.5, 3.4, 0.5, 3.4, MAT.red, true); });
  P("blossom_01", 30, 0.3, 45, { h: 2.8 }).then(o => { if (o) box(30, 0.15, 45, 2.2, 0.3, 2.2, MAT.sand, true); });
  P("blossom_03", -12, 0.3, 46, { h: 2.4 }).then(o => { if (o) box(-12, 0.15, 46, 2.0, 0.3, 2.0, MAT.sand, true); });
  P("blossom_06", 26, 0.3, 63, { h: 2.6 }).then(o => { if (o) box(26, 0.15, 63, 2.2, 0.3, 2.2, MAT.sand, true); });
  P("equestrian", 36, 1.0, 62, { h: 3.4, yaw: -Math.PI / 2 }).then(o => { if (o) box(36, 0.5, 62, 2.4, 1.0, 3.6, MAT.sand, true); });
  P("bronze_figure", -14, 0.6, 58, { h: 2.3, yaw: 0.6 }).then(o => { if (o) box(-14, 0.3, 58, 1.3, 0.6, 1.3, MAT.red, true); });
  P("caryatid", -6, 0.5, 62, { h: 2.6 }).then(o => { if (o) box(-6, 0.25, 62, 1.2, 0.5, 1.2, MAT.sand, true); });
  P("cp_fountain", 26, 0, 53, { h: 2.6 }); P("armillary", 0, 0.6, 53.5, { h: 1.8 }).then(o => { if (o) box(0, 0.3, 53.5, 1.2, 0.6, 1.2, MAT.sand, true); });
  P("nutcracker", 38, 0, 42.5, { h: 2.6, yaw: -2.2 }); P("bust_plinth", -16, 0, 43.5, { h: 1.9 }); P("cp_vitrine", 32, 0, 50.5, { h: 1.5 });
  P("noguchi_stone_1", 18, 0, 62.5, { h: 1.2, yaw: 0.4 }); P("noguchi_stone_2", 20, 0, 64, { h: 0.9, yaw: 2.1 }); P("noguchi_stone_3", 16.5, 0, 64.2, { h: 0.7, yaw: 1.2 });
  P("ph_gothic_statue", 8, 0.4, 44.2, { h: 2.6 }).then(o => { if (o) box(8, 0.2, 44.2, 1.0, 0.4, 1.0, MAT.sand, true); });
  P("tree_willow", -10, 0, 54, { h: 8.5, solid: false, pick: /^v0_hi/ }).then(o => o && addSolid(-10.5, -9.5, 53.5, 54.5, 0, 3));
  P("tree_willow", 34, 0, 55, { h: 7.5, solid: false, pick: /^v1_hi/ }).then(o => o && addSolid(33.5, 34.5, 54.5, 55.5, 0, 3));
  for (const [x, z, p] of [[-16, 62, /^v0_hi/], [2, 63, /^v1_lo/], [38, 46, /^v0_lo/]]) P("tree_ginkgo", x, 0, z, { h: 6.5, solid: false, pick: p }).then(o => o && addSolid(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, 3));
  P("pigeonlady", -3, 0, 44, { h: 1.7, yaw: 0.4 }); P("museum_bench", 20, 0, 53, { w: 2.2 }); P("quiet_bench", -17.5, 0, 50, { w: 2.2, yaw: Math.PI / 2 });
  for (const [x, z] of [[2, 45], [-2, 46], [14, 52], [24, 61], [6, 54]]) P("pigeon", x, 0, z, { h: 0.28, yaw: rnd(0, 6.28), solid: false }).then(o => o && M.pigeons.push({ o, home: o.position.clone(), t: rnd(0, 6) }));
  // the fossil cab: Checker, excavated (Arsham), by the garden door
  P("h_taxi", -8, 0.5, 44.5, { w: 4.6, yaw: Math.PI / 2 + 0.35, mat: MAT.bone }).then(o => {
    if (!o) return; box(-8, 0.25, 44.5, 5.6, 0.5, 3.0, MAT.red, true);
    for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.08, 0.22), 0), MAT.calcite); c.position.set(-8 + rnd(-1.9, 1.2), rnd(0.9, 1.9), 44.5 + rnd(-0.9, 0.9)); c.rotation.set(rnd(0, 3), rnd(0, 3), 0); world.add(c); }
    sign(-8, 0.42, 46.02, 1.6, 0.26, signTex("TAXI", { w: 800, h: 130, bg: "#ff6b00", fg: "#0d0d0d" }), 0);
  });
  // the pools: koi in the first, a swan and a sea lion in the second, a turtle on the rim
  M.swimmers = [];
  for (let i = 0; i < 4; i++) P("koi", 0, 0.1, 48.7, { w: 0.9, solid: false, shadow: false }).then(o => { if (o) M.swimmers.push({ o, cx: 6, cz: 48.75, rx: 12, rz: 1.1, t: i * 1.6, k: 0.5 + i * 0.1 }); });
  P("swan", 0, 0.26, 57.7, { w: 1.1, solid: false, shadow: false }).then(o => { if (o) M.swimmers.push({ o, cx: 19, cz: 57.75, rx: 13, rz: 1.0, t: 2, k: 0.22 }); });
  P("sealion_swim", 0, 0.2, 57.7, { w: 1.6, solid: false, shadow: false }).then(o => { if (o) M.swimmers.push({ o, cx: 19, cz: 57.75, rx: 13, rz: 1.0, t: 5, k: 0.35 }); });
  P("turtle", 2.5, 0.37, 50.5, { w: 0.5, solid: false, shadow: false });
  // the lamps in the garden
  for (const [x, z] of [[-4, 52], [16, 46], [30, 60], [-16, 64]]) P("cp_gaslamp", x, 0, z, { h: 3.4 }).then(o => { if (o) M.point(x, 3.2, z, 0.9, 12, 0xffe2b0); });

  /* ---------- animation ---------- */
  M.tickProps = function (dt, t, Pl) {
    for (const c of cabs) {
      if (!c.parked) { c.x += c.speed * dt * (c.lane < 0 ? -1 : 1); if (c.x > 135) c.x = -135; if (c.x < -135) c.x = 135; c.g.position.x = c.x; }
      if (c.honk > 0) { c.honk -= dt; c.g.position.y = Math.abs(Math.sin(t * 30)) * 0.03; } else c.g.position.y = 0;
    }
    carousel.rotation.y = t * 0.12; carousel.position.y = 25.2 + Math.sin(t * 0.5) * 0.25;
    car.rotation.y = Math.sin(t * 0.08) * 0.35; car.position.y = 30.6 + Math.sin(t * 0.31) * 0.12;
    if (M.mobile) { M.mobile.rotation.y = t * 0.1; M.mobile.rotation.z = Math.sin(t * 0.4) * 0.05; }
    for (const e of M.escalators) e.tex.offset.y = (e.tex.offset.y + dt * 0.55 * e.dir) % 1;
    for (const s of M.swimmers) { s.t += dt * s.k; const x = s.cx + Math.cos(s.t) * s.rx, z = s.cz + Math.sin(s.t * 2.1) * s.rz; const nx = s.cx + Math.cos(s.t + 0.05) * s.rx, nz = s.cz + Math.sin((s.t + 0.05) * 2.1) * s.rz; s.o.position.x = x - (s.o.userData.box.max.x - s.o.userData.box.min.x) * 0; s.o.position.z = z; s.o.rotation.y = Math.atan2(nx - x, nz - z); }
    for (const w of M.waters) { }
    const nm = MAT.water.normalMap; nm.offset.x = t * 0.01; nm.offset.y = t * 0.007;
    if (M.dog) { const s = t * 0.3, x = -20 + Math.sin(s) * 26, z = -4.4 + Math.cos(s * 2) * 1.8, nx = -20 + Math.sin(s + 0.02) * 26, nz = -4.4 + Math.cos((s + 0.02) * 2) * 1.8; M.dog.position.x = x; M.dog.position.z = z; M.dog.rotation.y = Math.atan2(nx - x, nz - z); }
    if (M.flyT > 0) M.flyT -= dt;
    for (const p of M.pigeons) { p.t += dt; if (M.flyT > 0) { const k = Math.min(1, (7 - M.flyT) * 1.5); p.o.position.y = p.home.y + Math.sin(k * Math.PI) * 2.2 + k * 0.1; p.o.position.x = p.home.x + Math.sin(p.t * 2) * k * 2; p.o.position.z = p.home.z + Math.cos(p.t * 2) * k * 2; p.o.rotation.y = p.t * 2 + Math.PI / 2; } else { p.o.position.lerp(p.home, Math.min(1, dt * 2)); p.o.position.y = p.home.y + Math.max(0, Math.sin(p.t * 6)) * 0.015; if (Math.random() < 0.004) p.o.rotation.y += rnd(-1, 1); } }
    // the lift cab follows the ride
    if (M.liftY != null) M.liftCab.position.y = M.liftY;
  };
  M.flyT = 0;
})(window.M);
