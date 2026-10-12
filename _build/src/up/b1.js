// Round twelve, batch 1: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Every nyb_<set>_* model is a Poly Haven CC0 prop made ours in Blender: recipes in _build/brand/b1.json.
const PI = Math.PI;

// a soft glow sprite for a practical (no new lights: every set shares one scene)
function glow(c, K, g, x, y, z, s = 0.9, col = 'rgba(255,214,150,.55)') {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a box on the floor (a plinth, a stand, a prep table) with its collider
function block(c, g, X, mat, x, z, w, h, d, r) { g.add(c.slab(w, h, d, mat, x, h / 2, z)); if (r) c.post(X(x), z, r); }
// brass posts and red velvet, for a queue on the carpet
function queue(c, K, g, pts) {
  const { THREE } = c, brass = K.std(0xd6a640, { metalness: 1, roughness: 0.25 }), red = K.std(0x8a0f1e, { roughness: 0.85 });
  pts.forEach(([x, z], i) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), brass); b.position.set(x, 0.02, z); g.add(b);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), brass); k.position.set(x, 0.98, z); g.add(k);
    const q = pts[i + 1]; if (!q) return;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3((x + q[0]) / 2, 0.62, (z + q[1]) / 2), new THREE.Vector3(q[0], 0.9, q[1]));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red));
  });
}
// a tripod under a press camera
function tripod(c, K, g, x, z, h) {
  const steel = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.4 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.03, h, 0.03, steel, x + Math.cos(a) * 0.18, h / 2, z + Math.sin(a) * 0.18); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); g.add(l); }
}

// a stock prop placed by len on a tall thin model (a bat) loads metres tall: once it lands, give it its real length and lay it on the floor
function layDown(c, g, x, z, L) {
  const grp = g.children.find((o) => o.isGroup && Math.abs(o.position.x - x) < 0.01 && Math.abs(o.position.z - z) < 0.01); if (!grp) return;
  const b = new c.THREE.Box3(), v = new c.THREE.Vector3(); let done = false;
  c.tick(() => { if (done || !grp.userData.ready) return; done = true; grp.updateMatrixWorld(true); b.setFromObject(grp); b.getSize(v);
    grp.children.forEach((m) => { if (m.isMesh) m.visible = false; }); grp.scale.setScalar(L / Math.max(0.01, v.y)); grp.rotation.x = PI / 2; grp.position.y = 0.035; });
}

export const PROPS = {
  lobby: [
    ['nyb_lobby_easel', 8.4, 1.2, { h: 1.25, ry: -0.35, r: 0.4 }],
    ['nyb_lobby_sofa', 2.6, 0.4, { len: 2.0, r: 0.7 }],
    ['nyb_lobby_chandelier', 5.0, -3.6, { h: 1.3, y: 4.6 }],
    ['nyb_lobby_palm', 0.9, -0.6, { h: 1.4, r: 0.4 }], ['nyb_lobby_palm', 19.1, 1.2, { h: 1.4, r: 0.4 }],
  ],
  taxi: [
    ['nyb_taxi_poster', 0.16, 6.8, { h: 1.0, y: 1.4, ry: PI / 2 }], ['nyb_taxi_poster', 18.0, -7.86, { h: 1.0, y: 1.6 }],
    ['nyb_aircon', 0.32, -0.2, { len: 0.9, y: 2.6, ry: PI / 2 }],
    ['old_military_crate', 15.0, -1.6, { len: 0.9, r: 0.5 }], ['nyb_taxi_box', 15.0, -1.6, { h: 0.34, y: 0.42, ry: 0.5 }],
    ['vintage_lighter', 2.2, -6.75, { len: 0.06, y: 0.9 }],
    ['round_wooden_table_02', 11.4, -0.8, { h: 0.75, r: 0.6 }], ['dining_chair_02', 12.3, -0.4, { h: 0.95, ry: -1.9, r: 0.35 }],
    ['cigarette_pack', 11.2, -0.7, { len: 0.09, y: 0.75, ry: 0.6 }], ['nyb_taxi_box', 11.6, -0.95, { h: 0.18, y: 0.75, ry: 0.3 }],
  ],
  big: [
    ['nyb_big_duck', 9.0, -5.4, { h: 1.3, ry: 0.5, r: 0.6, egg: ['A very big duck', 'big_duck', 'Squeeze it and it says MLow. A toy this big is for the grown ups who still make wishes.'], snd: 'pop' }],
    ['nyb_big_soldier', 1.2, -0.3, { h: 1.25, ry: PI / 2 - 0.3, r: 0.35 }], ['nyb_big_soldier', 18.7, -0.3, { h: 1.25, ry: -PI / 2 + 0.3, r: 0.35 }],
    ['nyb_big_shelves', 0.35, 6.5, { h: 1.6, r: 0.5 }], ['nyb_big_shelves', 19.3, 6.5, { h: 1.6, ry: PI, r: 0.5 }],
    ['nyb_big_dart', 0.16, 0.9, { len: 0.6, y: 1.6, ry: PI / 2 }],
    ['rubber_duck_toy', 0.4, 6.2, { h: 0.2, y: 1.18, ry: PI / 2 }], ['rubber_duck_toy', 0.4, 6.8, { h: 0.2, y: 0.8, ry: PI / 2 }], ['baseball_01', 19.3, 6.3, { len: 0.075, y: 1.18 }],
    ['american_football', 19.3, 6.8, { len: 0.28, y: 0.8, ry: 0.4 }], ['nyb_big_duck', 19.3, 6.2, { h: 0.22, y: 0.42, ry: -PI / 2 }],
  ],
  itch: [
    ['nyb_itch_newsstand', 1.0, 0.4, { h: 1.6, r: 0.55 }],
    ['modular_fire_escape', 10, 7.55, { h: 6.0, y: 3.4, ry: PI }],
    ['nyb_aircon', 3.4, 7.75, { len: 0.9, y: 4.6, ry: PI }], ['nyb_aircon', 16.6, 7.75, { len: 0.9, y: 5.2, ry: PI }],
  ],
  heat: [
    ['nyb_heat_ices', 4.4, 0.6, { len: 1.8, ry: 0.3, r: 0.9, egg: ['MLOW ICES', 'heat_ices', 'Coco, lemon, cherry, a quarter a cup on the hottest day of the year. The ices man counts the block by flavour.'], snd: 'ding' }],
    ['nyb_heat_radio', 0.45, 0.6, { len: 0.5, y: 2.95, ry: PI / 2 }],
    ['modular_fire_escape', 19.2, -3.0, { h: 5.5, y: 4.4, ry: -PI / 2 }],
    ['nyb_aircon', 0.3, -5.6, { len: 0.9, y: 5.4, ry: PI / 2 }], ['nyb_aircon', 0.3, 6.4, { len: 0.9, y: 3.6, ry: PI / 2 }],
    ['nyb_milkcrate_cyan', 14.6, -6.6, { h: 0.32, r: 0.3 }], ['nyb_milkcrate_pink', 14.6, -6.6, { h: 0.32, y: 0.33, ry: 0.4 }],
  ],
  ghost: [
    ['nyb_ghost_trap', 11.4, 1.1, { len: 0.42, ry: -0.4 }],
    ['nyb_ghost_bell', 10, 7.86, { h: 0.34, y: 3.3, ry: PI }], ['nyb_ghost_bell', 0.15, 0.6, { h: 0.3, y: 1.4, ry: PI / 2 }],
    ['nyb_ghost_lamp', 6.2, -3.6, { h: 1.3, y: 4.62 }], ['nyb_ghost_lamp', 8.6, -3.6, { h: 1.3, y: 4.62 }], ['nyb_ghost_lamp', 11.0, -3.6, { h: 1.3, y: 4.62 }],
    ['rubber_boots', 1.0, 6.6, { h: 0.42, ry: 0.3 }], ['rubber_boots', 1.7, 6.6, { h: 0.42, ry: -0.2 }], ['rubber_boots', 2.4, 6.6, { h: 0.42, ry: 0.1 }],
    ['nyb_ghost_slime', 18.9, 6.4, { h: 0.9, r: 0.4 }],
  ],
  natm: [
    ['nyb_natm_teddy', 17.0, -5.6, { h: 2.1, y: 1.0, ry: -0.5, egg: ['The Rough Rider', 'natm_rider', 'Gilded, rearing, riderless until midnight. Then an eye flower climbs on and asks the hall to speak softly and carry a big count.'], snd: 'ding' }],
    ['nyb_natm_whale', 1.7, 0.2, { h: 1.5, y: 0.9, ry: PI / 2 }],
    ['nyb_natm_elephant', 2.6, 6.2, { h: 0.9, y: 0.5, ry: 0.6 }],
    ['nyb_natm_bull', 0.2, 0.9, { h: 0.6, y: 3.3, ry: PI / 2 }], ['nyb_natm_bull', 19.55, -0.4, { h: 0.6, y: 3.3, ry: -PI / 2 }],
    ['nyb_natm_flashlight', 16.6, 4.6, { len: 0.3, y: 0.5, ry: 0.8 }],
    ['lantern_chandelier_01', 4.0, 4.6, { h: 1.2, y: 4.75 }], ['lantern_chandelier_01', 16.0, 4.6, { h: 1.2, y: 4.75 }],
  ],
  coney: [
    ['nyb_coney_barrel', 10.6, -1.2, { h: 0.9, r: 0.45, egg: ['MLOW FURIES', 'coney_furies', 'Gilded bats in a barrel at dawn. The Furies left them when they heard Coney was counting. The only swinging here is the wheel.'], snd: 'thud' }],
    ['nyb_coney_franks', 15.2, 0.6, { len: 2.0, ry: -0.3, r: 1.0 }],
    ['nyb_bench_plaque', 7.4, -2.6, { len: 1.8, r: 0.6 }],
    ['nyb_coney_buoy', 0.18, 0.4, { h: 0.84, y: 1.3, ry: PI / 2 }], ['nyb_coney_buoy', 19.6, -0.6, { h: 0.84, y: 1.3, ry: -PI / 2 }],
  ],
  stairs: [
    ['nyb_stairs_tv', 7.4, -2.0, { h: 0.42, y: 2.88, ry: 0.3, egg: ['LIVE WITH MLOW', 'stairs_tv', 'Tonight on the show: a man who climbed a hundred steps and never got higher. Applause sign on. The audience is counted.'], snd: 'ding' }],
    ['modular_fire_escape', 0.5, 5.2, { h: 6.0, y: 3.6, ry: PI / 2 }], ['modular_fire_escape', 19.5, 5.2, { h: 6.0, y: 3.6, ry: -PI / 2 }],
    ['nyb_aircon', 3.0, 7.75, { len: 0.9, y: 4.4, ry: PI }], ['nyb_aircon', 17.0, 7.75, { len: 0.9, y: 5.0, ry: PI }],
    ['nyb_milkcrate_cyan', 18.6, 2.0, { h: 0.32, r: 0.3 }], ['nyb_milkcrate_pink', 18.6, 2.0, { h: 0.32, y: 0.33, ry: 0.5 }],
  ],
  tiffany: [
    ['nyb_tiffany_box', 10.6, -1.4, { len: 2.3, ry: 0.25, r: 0.9, egg: ['N3W YORKERS & CO.', 'tiffany_box', 'Nothing inside but a card that says you, counted. Engraving is free if you can say where you were at five in the morning.'], snd: 'ding' }],
    ['nyb_tiffany_cat', 12.0, -4.9, { h: 0.42, y: 0.45, ry: 0.6 }],
    ['nyb_tiffany_clock', 10, 6.2, { h: 1.1, y: 4.1, ry: PI }],
    ['nyb_tiffany_planter', 4.8, 5.6, { len: 1.0, ry: PI, r: 0.5 }], ['nyb_tiffany_planter', 15.2, 5.6, { len: 1.0, ry: PI, r: 0.5 }],
    ['shrub_01', 4.8, 5.6, { len: 0.9, y: 0.4 }], ['shrub_01', 15.2, 5.6, { len: 0.9, y: 0.4 }],
    ['nyb_lobby_sconce', 5.4, 6.3, { h: 0.45, y: 3.2, ry: PI }], ['nyb_lobby_sconce', 14.6, 6.3, { h: 0.45, y: 3.2, ry: PI }],
  ],
  rear: [
    ['nyb_rear_photo', 0.15, 0.6, { len: 0.8, y: 1.8, ry: PI / 2 }], ['nyb_rear_photo', 0.15, 6.8, { len: 0.8, y: 1.8, ry: PI / 2 }],
    ['nyb_rear_photo', 19.62, 0.6, { len: 0.8, y: 1.8, ry: -PI / 2 }], ['nyb_rear_photo', 19.62, 6.8, { len: 0.8, y: 1.8, ry: -PI / 2 }],
    ['CoffeeTable_01', 7.6, -1.4, { len: 1.2, r: 0.6 }], ['sofa_02', 5.6, -1.4, { len: 2.0, ry: PI / 2, r: 0.8 }], ['wine_bottles_01', 7.4, -1.4, { len: 0.3, y: 0.45 }], ['brass_candleholders', 7.9, -1.3, { h: 0.3, y: 0.45 }],
    ['ClassicConsole_01', 0.55, 6.6, { len: 1.1, ry: PI / 2, r: 0.5 }], ['tea_set_01', 12.0, -5.7, { len: 0.3, y: 0.78 }],
  ],
  disco: [
    ['nyb_disco_paint', 18.85, -3.6, { h: 1.1, ry: -0.9, r: 0.5, egg: ['MLOW PAINTS', 'disco_paint', 'One can of pink, swung all the way down 86th Street on the beat. MLow says every entrance needs a prop and a reason to walk.'], snd: 'pop' }],
    ['nyb_disco_paint', 0.75, -0.6, { h: 0.2, y: 1.1, ry: 0.4 }], ['nyb_disco_paint', 0.85, -0.3, { h: 0.2, y: 1.1, ry: -0.3 }],
    ['nyb_disco_sofa', 5.6, 7.0, { len: 2.4, ry: PI, r: 0.7 }], ['nyb_disco_sofa', 14.4, 7.0, { len: 2.4, ry: PI, r: 0.7 }],
    ['nyb_disco_table', 10, 7.15, { h: 0.75, r: 0.45 }],
    ['nyb_disco_chandelier', 5, -3, { h: 1.0, y: 4.95 }], ['nyb_disco_chandelier', 15, -3, { h: 1.0, y: 4.95 }],
    ['wine_bottles_01', 0.8, -3.7, { len: 0.4, y: 1.1, ry: PI / 2 }], ['brass_goblets', 0.8, -2.5, { len: 0.3, y: 1.1 }],
  ],
  copa: [
    ['nyb_copa_gravy', 12.95, 2.15, { h: 0.5, y: 0.92, ry: -0.6, egg: ['MLOW SUNDAY GRAVY', 'copa_gravy', 'The pot that feeds the whole staff. Every cook and busboy, and every New Yorker who came in the back way, gets a plate.'], snd: 'clink' }],
    ['WoodenTable_02', 6.2, 5.9, { len: 1.8, r: 0.8 }],
    ['wooden_cutting_board', 5.8, 5.9, { len: 0.45, y: 0.78, ry: 0.2 }], ['yellow_onion', 5.7, 5.85, { len: 0.09, y: 0.8 }], ['lemon', 6.7, 6.0, { len: 0.08, y: 0.78 }], ['lemon', 6.8, 5.8, { len: 0.08, y: 0.78 }],
    ['brass_pot_01', 6.4, 6.05, { h: 0.26, y: 0.78 }],
    ['wall_clock', 10, 7.86, { len: 0.5, y: 4.2, ry: PI }],
  ],
};

export const ROOM = {
  lobby(c, r, g, X, K) {
    // the hero: the house projector on a black and gold plinth, aimed at the entrance
    const plinth = K.std(0x120607, { roughness: 0.4, metalness: 0.3 }), gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 });
    block(c, g, X, plinth, 5.6, 0.2, 0.9, 0.85, 0.9, 0.6); g.add(c.slab(0.96, 0.06, 0.96, gold, 5.6, 0.85, 0.2));
    K.prop(r, g, X, 'nyb_lobby_projector', 5.6, 0.2, { h: 1.35, y: 0.88, ry: -PI / 2 + 0.5, egg: ['MLOW PICTURES', 'lobby_reel', 'Reel one of one. MLow shot every New Yorker on it, and this projector refuses to show anybody twice.'], snd: 'tick' });
    const beam = glow(c, K, g, 5.8, 1.5, 0.7, 1.6, 'rgba(255,236,190,.45)');
    c.tick((t, dt, P, ri) => { if (ri === r.i) beam.material.opacity = 0.75 + Math.sin(t * 24) * 0.12; });
    // the queue for the next show, mid carpet
    queue(c, K, g, [[6.8, -1.4], [8.4, -1.4], [10.0, -1.4], [10.0, -3.0]]);
    [[7.4, -0.9, 0x3a1a4a], [8.6, -0.9, 0x1d4ed8], [9.5, -0.95, 0x2f6b3a]].forEach(([x, z, col]) => { K.extra(g, x, z, { col, ry: PI - 0.3 }); c.post(X(x), z, 0.3); });
    K.extra(g, 2.6, 0.55, { seated: true, col: 0x8a0f1e });
    // gilt sconces between the paintings and on the side walls, each with its own warm glow
    [3.5, 6.1, 8.7, 11.3, 13.9, 16.5].forEach((x) => { K.prop(r, g, X, 'nyb_lobby_sconce', x, 7.82, { h: 0.45, y: 2.1, ry: PI }); glow(c, K, g, x, 2.15, 7.6); });
    [[0.2, -0.6, PI / 2], [0.2, 6.6, PI / 2], [19.55, -0.6, -PI / 2], [19.55, 6.6, -PI / 2]].forEach(([x, z, ry]) => { K.prop(r, g, X, 'nyb_lobby_sconce', x, z, { h: 0.45, y: 2.4, ry }); glow(c, K, g, x + (x < 10 ? 0.25 : -0.25), 2.45, z); });
    // ticket stubs dropped on the carpet
    const stub = (s) => K.decal(0.32, 0.14, (q, w, h) => { q.fillStyle = s ? '#ff4fa3' : '#f5c542'; q.fillRect(0, 0, w, h); q.fillStyle = '#120607'; q.font = `800 ${h * 0.3}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('ADMIT ONE', w / 2, h * 0.42); q.font = `600 ${h * 0.2}px ${c.MONO}`; q.fillText('NEW YORKER', w / 2, h * 0.75); }, 128);
    [[4.2, 1.6, 0.4], [7.8, -2.2, 2.1], [3.1, -2.4, 1.2], [11.6, 1.4, -0.6], [9.3, 1.9, 0.9]].forEach(([x, z, a], i) => { const m = stub(i % 2); m.rotation.set(-PI / 2, 0, a); m.position.set(x, 0.014, z); g.add(m); });
  },

  taxi(c, r, g, X, K) {
    // the hero: the hack line payphone on its pole, cab yellow, facing the door
    const pole = K.std(0x2a2a2a, { metalness: 0.7, roughness: 0.4 });
    g.add(c.slab(0.08, 1.9, 0.08, pole, 6.4, 0.95, 0.28)); c.post(X(6.4), 0.4, 0.4);
    K.prop(r, g, X, 'nyb_taxi_phone', 6.4, 0.4, { h: 0.85, y: 0.95, ry: 0.55, egg: ['MLOW CAB CO.', 'taxi_hackline', 'You call the hack line at three in the morning. A voice says MLow Cab Co., we take every fare, we count every fare, where to?'], snd: 'beep' });
    const top = c.sign('MLOW CAB CO.  24 HRS', { w: 1.3, h: 0.26, bg: '#f5c542', fg: '#0b1020', font: c.MONO, weight: 800, border: '#0b1020' }); top.position.set(6.4, 2.02, 0.32); top.rotation.y = 0.55; g.add(top);
    // the set he kicked over: on its side by the armchair, still on
    const tv = K.prop(r, g, X, 'nyb_taxi_tv', 8.0, -2.6, { h: 0.46, y: 0.3, ry: -0.5 }); tv.rotation.z = PI / 2; c.post(X(8.0), -2.6, 0.35);
    // bare bulbs on pull chains, the only light a walk up gets
    [[6, -3.4], [13.4, -2.2], [10, 3.2]].forEach(([x, z]) => {
      K.prop(r, g, X, 'pull_chain_light_socket', x, z, { h: 0.17, y: 5.83 }); glow(c, K, g, x, 5.72, z, 1.0, 'rgba(255,220,160,.6)');
    });
    // takeout boxes and a newspaper on the floor
    const paper = K.decal(0.6, 0.42, (q, w, h) => { q.fillStyle = '#e8e0cc'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.16}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE DAILY COUNT', w / 2, h * 0.2); q.font = `700 ${h * 0.11}px ${c.FONT}`; q.fillText('CABBIE SEES EVERYTHING', w / 2, h * 0.38); q.fillStyle = '#777'; for (let y = 0.48; y < 0.95; y += 0.07) q.fillRect(w * 0.08, h * y, w * 0.84, h * 0.025); }, 256);
    paper.rotation.set(-PI / 2, 0, 0.5); paper.position.set(10.8, 0.013, -3.2); g.add(paper);
  },

  big(c, r, g, X, K) {
    // globe lamps over the shop floor
    [[5, -3.6], [15, -3.6], [5, 4.2], [15, 4.2]].forEach(([x, z]) => { K.prop(r, g, X, 'modern_ceiling_lamp_01', x, z, { h: 0.95, y: 5.05 }); glow(c, K, g, x, 5.2, z, 1.2, 'rgba(255,240,210,.5)'); });
    // shoppers by the chess set
    K.extra(g, 11.0, -3.0, { col: 0xff4fa3, ry: 0.6 }); c.post(X(11.0), -3.0, 0.3);
    K.extra(g, 14.8, -3.4, { col: 0x22d3ee, ry: -0.5 }); c.post(X(14.8), -3.4, 0.3);
    layDown(c, g, 7.0, 5.0, 0.85);
    const sale = c.sign('MLOW TOYS · FIFTH AVENUE · EST. 1988', { w: 7.5, h: 0.5, bg: '#ff4fa3', fg: '#ffffff', font: c.SERIF, weight: 900, border: '#f5c542' }); sale.position.set(10, 4.4, 7.86); sale.rotation.y = PI; g.add(sale);
  },

  itch(c, r, g, X, K) {
    // the hero: the press line. Three cameras on tripods, all aimed at the grate, and the men behind them
    queue(c, K, g, [[5.8, 0.1], [8.2, 0.1], [10.6, 0.1], [13.0, 0.1], [14.4, 0.1]]); c.wall(X(5.8), 0.1, X(14.4), 0.1);
    [[6.6, 1.0, 0.15], [9.8, 1.1, 0], [13.0, 1.0, -0.15]].forEach(([x, z, a], i) => {
      tripod(c, K, g, x, z, 1.4); c.post(X(x), z, 0.3);
      const cam = K.prop(r, g, X, 'nyb_itch_presscam', x, z, { h: 0.14, y: 1.4, ry: PI + a, ...(i === 1 ? { egg: ['MLOW PRESS', 'itch_flash', 'Flash. Lexington Avenue, two in the morning, and every lens on the block points one way. MLow kept the negative.'], snd: 'pop', fn: (c) => c.flash(0.5) } : {}) });
      K.extra(g, x + 0.75, z + 0.35, { col: [0x6a5a48, 0x8a6a3a, 0x4a5a7a][i], ry: PI + a }); c.post(X(x + 0.75), z + 0.35, 0.3);
    });
    // the crowd, held back on the far side
    [[3.4, -1.6, 0x5a4a3a], [4.2, -2.4, 0x1d4ed8], [16.0, -1.6, 0x8a0f1e], [16.8, -2.6, 0x2f6b3a]].forEach(([x, z, col]) => { K.extra(g, x, z, { col, ry: x < 10 ? -0.5 : 0.5 }); c.post(X(x), z, 0.3); });
    let pop = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; pop -= dt; if (pop < 0) { pop = 2 + Math.random() * 4; flashes[(Math.random() * 3) | 0].material.opacity = 1; } flashes.forEach((f) => { f.material.opacity *= 0.85; }); });
    const flashes = [[6.6, 1.0], [9.8, 1.1], [13.0, 1.0]].map(([x, z]) => { const s = glow(c, K, g, x, 1.6, z - 0.15, 1.4, 'rgba(220,240,255,.9)'); s.material.opacity = 0; return s; });
    K.steam(g, 13.6, 0.05, 3.0);
  },

  heat(c, r, g, X, K) {
    // fruit on the stand, and a striped awning over it
    // the hero: the fruit stand on the corner, turned to the street, under a striped awning
    const st = new c.THREE.Group(); st.position.set(17.4, 0, -1.0); st.rotation.y = -2.3; g.add(st); c.post(X(17.4), -1.0, 0.75);
    c.glb('nyb_heat_fruitstand', { h: 1.6, parent: st, onload: () => {} });
    const fr = [['bananas', 0.3], ['lemon', 0.08], ['food_apple_01', 0.08], ['food_lime_01', 0.07], ['food_pomegranate_01', 0.09]];
    [0.42, 0.8, 1.18].forEach((y, j) => [-0.35, 0, 0.35].forEach((dz, i) => { const [n, len] = fr[(i + j * 2) % fr.length]; c.glb('ph_' + n, { len, x: 0.05, y, z: dz, ry: i, parent: st, shadow: false }); }));
    const aw = K.decal(1.6, 1.1, (q, w, h) => { for (let i = 0; i < 10; i++) { q.fillStyle = i % 2 ? '#f4ead2' : '#2f8a3a'; q.fillRect(i * w / 10, 0, w / 10, h * 0.85); } q.fillStyle = '#c8102e'; q.fillRect(0, h * 0.85, w, h * 0.15); }, 128);
    aw.material.side = c.THREE.DoubleSide; aw.rotation.order = 'YXZ'; aw.rotation.set(-0.8, PI / 2, 0); aw.position.set(0.45, 2.15, 0); st.add(aw);
    // the corner men, in their chairs, under an umbrella
    K.extra(g, 15.8, -5.2, { seated: true, col: 0x6a4a2a, ry: 2.6 }); K.extra(g, 16.7, -4.2, { seated: true, col: 0x3a5a3a, ry: 2.2 });
    const { THREE } = c, um = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 12, 1, true), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 64, (q, w, h) => { for (let i = 0; i < 12; i++) { q.fillStyle = ['#ff4fa3', '#f5c542', '#22d3ee'][i % 3]; q.fillRect(i * w / 12, 0, w / 12, h); } }), side: THREE.DoubleSide, roughness: 0.8 }));
    um.position.set(16.3, 2.3, -4.7); g.add(um); g.add(c.slab(0.04, 2.1, 0.04, K.std(0xdddddd, { metalness: 0.6 }), 16.3, 1.05, -4.7));
    const wl = c.sign('WE COUNT 108 FM', { w: 1.6, h: 0.3, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 800, glow: 10 }); wl.position.set(0.16, 3.5, 0.6); wl.rotation.y = PI / 2; g.add(wl);
    g.add(c.slab(0.5, 0.06, 1.0, K.std(0x6a6058), 0.37, 2.92, 0.6));
  },

  ghost(c, r, g, X, K) {
    // the hero: three packs on the equipment bench by the car, ready to roll
    const steel = K.std(0x3a3f44, { metalness: 0.6, roughness: 0.45 });
    block(c, g, X, steel, 13.2, 0.5, 3.0, 0.5, 0.7); c.wall(X(11.7), 0.15, X(14.7), 0.15); c.wall(X(11.7), 0.85, X(14.7), 0.85);
    [12.2, 13.2, 14.2].forEach((x, i) => K.prop(r, g, X, 'nyb_ghost_pack', x, 0.5, { h: 0.55, y: 0.5, ry: 0.15 - i * 0.15, ...(i === 1 ? { egg: ['The pack', 'ghost_pack', 'An unlicensed accelerator, licensed by MLow. It does not catch anything. It counts, and it has counted four hundred and twelve in this firehouse.'], snd: 'beep' } : {}) }));
    [12.2, 13.2, 14.2].forEach((x) => glow(c, K, g, x, 0.85, 0.85, 0.5, 'rgba(34,211,238,.6)'));
    const hk = c.sign('N3W HOOK & LADDER 317', { w: 4.4, h: 0.5, bg: '#8a0f1e', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' }); hk.position.set(10, 5.3, 7.86); hk.rotation.y = PI; g.add(hk);
    // turnout coats on pegs over the boots
    [1.0, 1.7, 2.4].forEach((x) => { g.add(c.slab(0.5, 0.9, 0.12, K.std(0x3a3020, { roughness: 0.9 }), x, 1.6, 7.8)); g.add(c.slab(0.5, 0.05, 0.13, K.std(0xd8c040, { roughness: 0.6 }), x, 1.4, 7.73)); });
  },

  natm(c, r, g, X, K) {
    // marble plinths for the rider and the whale, a low one for the elephant
    const marble = K.std(0xd8d0c4, { roughness: 0.3 });
    block(c, g, X, marble, 17.0, -5.6, 1.4, 1.0, 1.0, 0.85); block(c, g, X, marble, 1.7, 0.2, 1.0, 0.9, 1.4, 0.75); block(c, g, X, marble, 2.6, 6.2, 1.2, 0.5, 0.8, 0.7);
    const pl = c.sign('THE ROUGH RIDER · GILDED BY MLow', { w: 1.3, h: 0.16, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); pl.position.set(17.0, 0.75, -5.09); g.add(pl);
    const ban = c.sign('AMERICAN MUSEUM OF THE COUNTED', { w: 9, h: 0.6, bg: '#0e1830', fg: '#d8b878', font: c.SERIF, weight: 900, border: '#d8b878' }); ban.position.set(10, 4.5, 7.86); ban.rotation.y = PI; g.add(ban);
    [[4.0, 4.6], [16.0, 4.6]].forEach(([x, z]) => glow(c, K, g, x, 4.9, z, 1.4, 'rgba(255,200,120,.5)'));
  },

  coney(c, r, g, X, K) {
    // gilded bats standing in the Furies' barrel
    [[-0.12, -0.08, 0.15, 0.1], [0.1, -0.1, -0.12, 0.08], [0.02, 0.12, 0.05, -0.16], [-0.1, 0.1, -0.1, -0.1]].forEach(([dx, dz, rx, rz]) => { const b = K.prop(r, g, X, 'nyb_coney_bat', 10.6 + dx, -1.2 + dz, { h: 0.85, y: 0.45 }); b.rotation.x = rx; b.rotation.z = rz; });
    layDown(c, g, 9.4, -5.0, 0.85);
    // two Warriors on the bench, waiting for the train home
    K.extra(g, 7.0, -2.6, { seated: true, col: 0x5a3a1a, ry: 0 }); K.extra(g, 7.8, -2.6, { seated: true, col: 0x5a3a1a, ry: 0 });
    // strings of bulbs over the boardwalk
    K.bulbs(g, 1, 19, 4.6, 0.2, 30, 0xffd6a0); K.bulbs(g, 1, 19, 4.2, 6.6, 30, 0xffb0d0);
    const tag = K.decal(3.2, 1.2, (q, w, h) => { q.font = `900 ${h * 0.6}px ${c.FONT}`; q.textAlign = 'center'; q.lineWidth = h * 0.06; q.strokeStyle = '#0b1020'; q.strokeText('MLow', w / 2, h * 0.7); q.fillStyle = '#ff4fa3'; q.fillText('MLow', w / 2, h * 0.7); }, 256);
    tag.position.set(0.14, 4.0, -4.2); tag.rotation.y = PI / 2; g.add(tag);
  },

  stairs(c, r, g, X, K) {
    // the hero: the garbage strike, piled at the foot of the steps on both sides and up on the landing
    const bags = [[2.0, -0.9, 0], [2.7, -1.0, 0], [3.4, -1.1, 0], [2.3, -0.3, 0], [4.4, -0.9, 0], [2.6, -0.6, 0.45], [3.6, -1.0, 0.45], [1.5, 0.3, 0],
      [15.6, -1.0, 0], [16.3, -1.0, 0], [17.0, -0.8, 0], [15.9, -0.4, 0], [16.6, -0.9, 0.45], [17.9, -0.6, 0],
      [6.6, -1.9, 2.34], [7.3, -2.1, 2.34], [8.0, -1.9, 2.34], [6.9, -2.5, 2.34], [6.8, -2.1, 2.79], [12.0, -1.9, 2.34], [12.7, -2.0, 2.34], [13.4, -1.9, 2.34], [13.0, -2.5, 2.34], [12.9, -2.1, 2.79], [3.2, -3.4, 2.34], [16.4, -3.2, 2.34]];
    bags.forEach(([x, z, y], i) => K.prop(r, g, X, i % 3 ? 'nyb_stairs_bagblk' : 'nyb_stairs_bag', x, z, { h: 0.55, y, ry: i * 1.7 }));
    c.post(X(3.0), -0.8, 1.0); c.post(X(16.5), -0.8, 0.9);
    const strike = c.sign('DEPT. OF THE COUNTED · STRIKE DAY 18 · NO PICKUP', { w: 3.4, h: 0.22, bg: '#f5c542', fg: '#0b1020', font: c.MONO, weight: 800 }); strike.position.set(10, 2.5, -1.62); g.add(strike);
    // gilded rats that work the pile, only while you are here
    const rats = [[2.6, -0.2], [16.4, -0.1], [10.0, -1.75]].map(([x, z], i) => ({ m: K.prop(r, g, X, 'nyb_stairs_rat', x, z, { len: 0.28, ry: i }), x, z, k: i * 2.1 }));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; rats.forEach((q) => { const u = Math.sin(t * 0.9 + q.k); q.m.position.x = q.x + u * 0.9; q.m.rotation.y = u > Math.sin(t * 0.9 + q.k - 0.05) ? PI / 2 : -PI / 2; }); });
  },

  tiffany(c, r, g, X, K) {
    // the doorman of N3W YORKERS & CO., early for his shift
    K.extra(g, 12.4, 5.4, { col: 0x10203a, ry: 0.3 }); c.post(X(12.4), 5.4, 0.3);
    [[5.4, 3.2, 6.15], [14.6, 3.2, 6.15]].forEach(([x, y, z]) => glow(c, K, g, x, y, z, 0.9));
    glow(c, K, g, 10, 4.6, 6.1, 1.4, 'rgba(255,224,150,.5)');
  },

  rear(c, r, g, X, K) {
    // the fan turns all night: it is 94 degrees in the Village
    const fan = K.prop(r, g, X, 'nyb_rear_fan', 10, 0, { len: 1.4, y: 5.45 });
    c.tick((t, dt, P, ri) => { if (ri === r.i && fan) fan.rotation.y = t * 3.2; });
    // the hero: the long lens on its tripod, aimed across the courtyard, gilded
    tripod(c, K, g, 10.6, -5.9, 1.35); c.post(X(10.6), -5.9, 0.35);
    K.prop(r, g, X, 'nyb_rear_camera', 10.6, -5.9, { h: 0.28, y: 1.33, ry: PI, egg: ['MLOW 400MM', 'rear_lens', 'A long lens, a leg in a cast and six weeks at one window. MLow calls that a residency, and the courtyard calls it rude.'], snd: 'tick' });
    const { THREE } = c, lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.85, 20), K.std(0xc9a033, { metalness: 1, roughness: 0.3 })); lens.rotation.x = PI / 2; lens.position.set(10.6, 1.47, -6.45); g.add(lens);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), K.std(0x111111)); rim.rotation.x = PI / 2; rim.position.set(10.6, 1.47, -6.9); g.add(rim);
    const tag = c.sign('MLOW 400MM', { w: 0.42, h: 0.08, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); tag.position.set(10.6, 1.585, -6.45); tag.rotation.set(-PI / 2, 0, 0); g.add(tag);
    // Lisa, in the armchair
    K.extra(g, 16.2, -3.6, { seated: true, col: 0xf4ead2, ry: -0.8 });
  },

  disco(c, r, g, X, K) {
    // couples on the banquettes, south of the floor
    K.extra(g, 5.2, 6.8, { seated: true, col: 0x9b5cff, ry: PI }); K.extra(g, 14.8, 6.8, { seated: true, col: 0xff2e88, ry: PI });
    [[5, -3], [15, -3]].forEach(([x, z]) => glow(c, K, g, x, 4.6, z, 1.6, 'rgba(200,220,255,.45)'));
    const sp = c.sign('MLOW PAINTS · 86TH STREET', { w: 2.4, h: 0.3, bg: '#ff4fa3', fg: '#ffffff', font: c.MONO, weight: 800 }); sp.position.set(19.6, 2.4, -3.6); sp.rotation.y = -PI / 2; g.add(sp);
  },

  copa(c, r, g, X, K) {
    // a pot rack over the range, pans hanging
    const bar = K.std(0x9a9ca0, { metalness: 1, roughness: 0.3 });
    g.add(c.slab(4.6, 0.05, 0.05, bar, 15.2, 2.7, 2.4)); [13.0, 17.4].forEach((x) => g.add(c.slab(0.03, 3.3, 0.03, bar, x, 4.35, 2.4)));
    [13.6, 14.5, 15.4, 16.3, 17.0].forEach((x, i) => { const p = K.prop(r, g, X, 'nyb_copa_pan', x, 2.4, { len: 0.42, y: 2.42 - (i % 2) * 0.06, ry: 0.4 * i }); p.rotation.x = PI / 2; });
    // the line cooks, working the range
    [[14.1, 3.35], [15.7, 3.35]].forEach(([x, z]) => { K.extra(g, x, z, { col: 0xeeeeee, ry: PI }); c.post(X(x), z, 0.3); });
    K.extra(g, 5.6, 6.6, { col: 0xeeeeee, ry: 0.4 }); c.post(X(5.6), 6.6, 0.3);
    K.steam(g, 12.95, 1.45, 2.15);
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  lobby: { Sofa_01: 'nyb_lobby_sofa', Ottoman_01: 'nyb_lobby_ottoman', potted_plant_02: 'nyb_lobby_palm', Chandelier_02: 'nyb_lobby_chandelier', CashRegister_01: 'nyb_register_gold' },
  taxi: { metal_trash_can: 'nyb_trash_dsny', cardboard_box_01: 'nyb_taxi_box', ArmChair_01: 'nyb_taxi_armchair' },
  big: { chess_set: 'nyb_big_chess', alarm_clock_01: 'nyb_big_alarm', Ukulele_01: 'nyb_big_uke' },
  itch: { metal_trash_can: 'nyb_trash_dsny', fire_hydrant: 'nyb_itch_hydrant', WetFloorSign_01: 'nyb_itch_caution', Camera_01: 'nyb_itch_presscam' },
  heat: { plastic_crate_01: 'nyb_milkcrate_pink', metal_trash_can: 'nyb_heat_can', utility_box_01: 'nyb_utility_bomb' },
  ghost: { Barrel_01: 'nyb_ghost_slime', korean_fire_extinguisher_01: 'nyb_extinguisher', metal_toolbox: 'nyb_ghost_trap' },
  natm: { marble_bust_01: 'nyb_natm_bust', WetFloorSign_01: 'nyb_natm_wet' },
  coney: { Barrel_01: 'nyb_coney_barrel', metal_trash_can: 'nyb_trash_dsny', street_lamp_01: 'nyb_lamp_nazar', baseball_bat: 'nyb_coney_bat' },
  stairs: { metal_trash_can: 'nyb_trash_dsny', street_lamp_02: 'nyb_lamp_banner', cardboard_box_01: 'nyb_stairs_box' },
  tiffany: { CoffeeCart_01: 'nyb_coffeecart', metal_trash_can: 'nyb_trash_dsny', fire_hydrant: 'nyb_hydrant_gold', street_lamp_01: 'nyb_lamp_nazar' },
  rear: { Camera_01: 'nyb_rear_camera', ArmChair_01: 'nyb_rear_armchair', vintage_suitcase: 'nyb_suitcase_bomb' },
  disco: { bar_chair_round_01: 'nyb_disco_stool', cassette_player: 'nyb_disco_deck' },
  copa: { steel_frame_shelves_03: 'nyb_copa_shelves', wooden_crate_01: 'nyb_copa_crate', wine_barrel_01: 'nyb_copa_barrel', wooden_crate_02: 'nyb_copa_crate2' },
};
