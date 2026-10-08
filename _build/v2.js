/* ================================================================
   V2  ·  THE DEGEN DUNGEON LAYER (Astra's V2 design document, 2026-10-08, _build/astra_v2.md)
   Sits on top of the V1 rooms: photographic panels, decals, CC0 models (Poly Haven), MLow's stickers in 3D,
   the density schedule per zone, five sub rooms, the lighting per zone, and forty more eggs.
   ================================================================ */
const CC0 = D.cc0 || [], STICK = D.stickers || [];
const cc0 = (key, x, y, z, ry, size, o = {}) => model(key, x, y, z, ry, size, Object.assign({ dir: 'cc0', label: key.replace(/_\d+$/, '').replace(/_/g, ' ') + ' (CC0, Poly Haven)', kind: 'cc0' }, o));
const sticker = (key, x, y, z, ry, size, o = {}) => model(key, x, y, z, ry, size, Object.assign({ dir: 'sticker', label: key.replace(/_/g, ' ') + ' (MLow sticker, in 3D)', kind: 'sticker' }, o));
/* a photographic panel: a flat photo hung on a wall, 1 cm proud, matte, lit by the room */
const PANEL_TEX = {};
function panel(name, W, H, x, y, z, ry, o = {}) {
  const t = PANEL_TEX[name] || (PANEL_TEX[name] = tex(`assets/v2/${name}.webp`)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0 }); const p = plane(W, H, m, x + Math.sin(ry) * 0.012, y, z + Math.cos(ry) * 0.012, ry); p.userData.panel = name; PICK_EXTRA.push(p);
  if (o.frame) box(W + 0.08, H + 0.08, 0.03, o.frame === 'brass' ? MAT.gold : MAT.frame, x + Math.sin(ry) * 0.004, y, z + Math.cos(ry) * 0.004, ry, 0, false);
  return p;
}
/* a decal: an alpha cutout on a wall (rx 0) or on the floor (rx -PI/2), 3 mm off the surface */
function decal(name, W, H, x, y, z, ry = 0, floor = false, rz = 0) {
  const t = PANEL_TEX[name] || (PANEL_TEX[name] = tex(`assets/v2/${name}.webp`)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.08, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m); if (floor) { p.rotation.set(-PI / 2, 0, rz); p.position.set(x, y + 0.004, z); } else { p.rotation.set(0, ry, rz, 'YXZ'); p.position.set(x + Math.sin(ry) * 0.004, y, z + Math.cos(ry) * 0.004); } p.receiveShadow = true; scene.add(p); return p;
}
/* small primitives that make a basement real */
function outlet(x, y, z, ry) { box(0.075, 0.12, 0.012, MAT.beige, x + Math.sin(ry) * 0.006, y, z + Math.cos(ry) * 0.006, ry, 0, false); [-0.022, 0.022].forEach(dy => { box(0.012, 0.016, 0.006, MAT.ink, x + Math.sin(ry) * 0.013 - Math.cos(ry) * 0.012, y + dy, z + Math.cos(ry) * 0.013 + Math.sin(ry) * 0.012, ry, 0, false); box(0.012, 0.016, 0.006, MAT.ink, x + Math.sin(ry) * 0.013 + Math.cos(ry) * 0.012, y + dy, z + Math.cos(ry) * 0.013 - Math.sin(ry) * 0.012, ry, 0, false); }); }
function lightSwitch(x, y, z, ry) { box(0.075, 0.12, 0.012, MAT.beige, x + Math.sin(ry) * 0.006, y, z + Math.cos(ry) * 0.006, ry, 0, false); box(0.014, 0.03, 0.02, MAT.orange, x + Math.sin(ry) * 0.02, y, z + Math.cos(ry) * 0.02, ry, 0, false); }
/* an extension cord: an orange tube along a wobbly spline on the floor, ending in a chunky socket */
function cord(pts, color = 0xFF6B00) { const c = new THREE.CatmullRomCurve3(pts.map(p => new V3(p[0], p[1] + 0.012, p[2]))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.009, 6, false), new THREE.MeshStandardMaterial({ color, roughness: 0.6 })); scene.add(m); const e = pts[pts.length - 1]; box(0.06, 0.04, 0.09, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), e[0], e[1] + 0.02, e[2], rnd() * PI); return m; }
/* a storage tote: translucent plastic with a coloured lid */
function tote(x, y, z, ry, lid = 0xb02020, body = 0x9fb8a6) { const bm = new THREE.MeshStandardMaterial({ color: body, roughness: 0.4, transparent: true, opacity: 0.75 }); const b = box(0.62, 0.38, 0.42, bm, x, y + 0.19, z, ry); box(0.64, 0.05, 0.44, new THREE.MeshStandardMaterial({ color: lid, roughness: 0.5 }), x, y + 0.405, z, ry); boxWalls(x, z, 0.62, 0.42, ry, -1, y + 0.5); return b; }
/* a paint can */
function paintCan(x, y, z, drip = 0x6a7fb8) { cyl(0.085, 0.085, 0.19, MAT.steel, x, y + 0.095, z, 16); cyl(0.07, 0.07, 0.012, new THREE.MeshStandardMaterial({ color: drip, roughness: 0.4 }), x, y + 0.197, z, 16); box(0.05, 0.03, 0.004, new THREE.MeshStandardMaterial({ color: drip, roughness: 0.5 }), x + 0.084, y + 0.1, z); }
/* VHS tapes, a stack of them */
function vhs(x, y, z, n, ry = 0) { for (let i = 0; i < n; i++) { const m = box(0.19, 0.025, 0.105, i % 3 ? MAT.ink : new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.6 }), x + (rnd() - 0.5) * 0.02, y + 0.0125 + i * 0.026, z + (rnd() - 0.5) * 0.02, ry + (rnd() - 0.5) * 0.15, 0, false); box(0.14, 0.001, 0.07, MAT.white, m.position.x, m.position.y + 0.013, m.position.z, m.rotation.y, 0, false); } }
/* a soup tub with a label plaque */
function tub(x, y, z, label) { cyl(0.12, 0.11, 0.14, MAT.white, x, y + 0.07, z, 16); cyl(0.125, 0.125, 0.012, new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.6 }), x, y + 0.146, z, 16); if (label) plaque([{ t: label, s: 0.52, f: 'mono', c: '#0D0D0D' }], x, y + 0.08, z + 0.121, 0, 0.16, 0.05, { bg: '#f6f3ea', back: false }); }
/* the brushed aluminium plaque Astra specified: 20 x 7 cm, two screws, quotation marks */
function tag(text, x, y, z, ry) { plaque([{ t: '"' + text + '"', s: 0.5 }], x, y, z, ry, 0.2, 0.07, { bg: '#b9bcc0', fg: '#0D0D0D', back: false }); [-0.085, 0.085].forEach(dx => cyl(0.004, 0.004, 0.004, MAT.ink, x + Math.cos(ry) * dx + Math.sin(ry) * 0.034, y, z - Math.sin(ry) * dx + Math.cos(ry) * 0.034, 6, 0, PI / 2)); }
const V2 = { eggs: {}, looks: [], rat: null, crown: null, throne: null, ledger: null, console: null, freezer2: null, tubs: [], chairs: [], sock2: null, portrait: null, yarn: null, mask: null, carton: null, basket: null, seal: null, bead: null, knocks: 0, cc0Lamp: null };

/* --- Z1 THE STAIRS: the pegboard, the holiday bins, the ladder, the parcels, the cord, the trap, the cellar door --- */
(function z1() {
  panel('p01_pegboard', 1.3, 0.87, -1.27, 1.35, 21.4, PI / 2); // west wall of the landing, where the tools live
  cc0('ladder_sectioned_01', 1.05, 0, 23.6, -0.3, 1.95, { tick: null }); post(1.05, 23.6, 0.3, -1, 2);
  cc0('cardboard_box_01', -0.95, 0, 20.5, 0.2, 0.42); cc0('cardboard_box_01', -0.95, 0.42, 20.5, -0.3, 0.38); cc0('cardboard_box_01', -0.95, 0.8, 20.5, 0.5, 0.3); post(-0.95, 20.5, 0.32, -1, 1.2);
  tote(0.9, 0, 20.6, 0.2); tote(0.9, 0.41, 20.6, -0.1, 0xc0c0c0, 0xd8d8e0); box(0.02, 0.3, 0.02, MAT.wood, 1.05, 1.0, 20.5, 0, 0, false); // an antler poking out
  cord([[-1.2, 0, 23.9], [-0.9, 0, 23.2], [-1.1, 0, 22.4], [-0.7, 0, 21.8]]); outlet(-1.29, 0.28, 23.4, PI / 2); lightSwitch(-1.29, 1.15, 20.6, PI / 2);
  box(0.1, 0.012, 0.05, MAT.wood, 1.1, 0.006, 23.9, 0.4, 0, false); box(0.03, 0.004, 0.03, MAT.crust, 1.1, 0.014, 23.9, 0, 0, false); // the mouse trap with a bagel crumb
  decal('d_tidemark', 2.6, 0.27, 0, 0.14, 20.03, 0); decal('d_boots', 0.6, 1.8, 0.2, 0, 21.4, 0, true, 0.1);
  sticker('cellar_door', -1.1, 0, 24.0, PI / 2, 1.6, { mode: 'h' }); sticker('coal_chute', 1.1, 1.0, 22.9, -PI / 2, 0.5, { mode: 'm' });
  plaque([{ t: 'YOUR MOM\'S BASEMENT', s: 0.46, c: '#2962FF' }, { t: 'CULTURAL INSTITUTION. SIDE ENTRANCE.', s: 0.2 }], 1.29, 1.45, 23.2, -PI / 2, 0.65, 0.32, { bg: '#0D0D0D' });
  tag('STORAGE', -1.29, 1.62, 20.9, PI / 2);
})();

/* --- Z2 THE DEN: the real sofa, the real TV, the VHS wall, the posters, the treadmill coat rack, the thermostat, the recliner --- */
(function z2() {
  // replace the box sofa with sofa_02 under the plastic: the V1 boxes stay as the collision and the plastic skin sits over the model
  cc0('sofa_02', 0, 0, 17.5, PI, 0.95, { mode: 'h', placed: s => { s.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.envMapIntensity = 0.3; } }); } });
  W.sofa.visible = false; scene.children.filter(o => o.isMesh && o.material === MAT.plastic && o !== W.sofa).forEach(o => { o.material = o.material.clone(); o.material.opacity = 0.35; o.material.transparent = true; o.material.roughness = 0.2; o.material.envMapIntensity = 2.0; });
  cc0('television_02', 0, 0.5, 11.62, 0, 0.62, { mode: 'h' }); W.crt.mesh.visible = false; MAT.screen.visible = false;
  box(1.1, 0.5, 0.5, MAT.wood, 0, 0.25, 11.6); vhs(-0.35, 0.5, 11.55, 3, 0.2); vhs(0.4, 0.5, 11.6, 2, -0.2); prop('radio', 0.75, 0.5, 11.55, 0.3, 0.2);
  panel('p02_vhs', 2.4, 1.34, 2.6, 1.35, 11.03, 0); panel('p03_posters', 1.8, 1.2, 4.47, 1.5, 17.0, -PI / 2);
  // the treadmill as a coat rack
  box(0.78, 0.12, 1.75, MAT.ink, -3.6, 0.06, 15.0, 0); box(0.05, 1.3, 0.05, MAT.steel, -3.95, 0.7, 14.2); box(0.05, 1.3, 0.05, MAT.steel, -3.25, 0.7, 14.2); box(0.8, 0.05, 0.05, MAT.steel, -3.6, 1.35, 14.2); boxWalls(-3.6, 15.0, 0.8, 1.8, 0, -1, 1.4);
  [[-3.85, 0x3a3a52], [-3.6, 0x6b4a2e], [-3.35, 0x8a1f2a]].forEach(([x, c]) => box(0.22, 0.75, 0.12, new THREE.MeshStandardMaterial({ color: c, roughness: 1 }), x, 0.95, 14.28, 0.1));
  box(0.14, 0.1, 0.025, MAT.beige, 4.47, 1.4, 12.6, -PI / 2); plaque([{ t: '68', s: 0.7, f: 'mono', c: '#0D0D0D' }], 4.455, 1.42, 12.6, -PI / 2, 0.07, 0.03, { bg: '#c9d8c4', back: false }); // the thermostat
  box(0.05, 0.025, 0.19, MAT.ink, -0.32, 0.45, 16.1, 0.4); // the remote, taped
  box(0.4, 0.24, 0.28, new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.3, transparent: true, opacity: 0.7 }), 1.8, 0.12, 14.6, 0.2); for (let i = 0; i < 10; i++) cyl(0.03, 0.03, 0.12, MAT.steel, 1.66 + (i % 4) * 0.09, 0.08, 14.5 + Math.floor(i / 4) * 0.09, 10); // the case of seltzer, two slots empty
  cc0('boombox', -0.9, 0.44, 16.2, 0.3, 0.14, { mode: 'h' }); cc0('mid_century_lounge_chair', 3.7, 0, 11.9, -2.4, 0.9, { mode: 'h' }); post(3.7, 11.9, 0.5, -1, 1.0);
  sticker('rabbit_ears', 0, 1.12, 11.62, 0, 0.42, { mode: 'm' });
  outlet(4.49, 0.28, 19.2, -PI / 2); outlet(-4.49, 0.28, 12.2, PI / 2); decal('d_cobweb', 0.45, 0.45, -4.3, 2.12, 11.2, PI / 4); decal('d_cola', 0.45, 0.35, 0.55, 0, 16.6, 0, true);
  cord([[4.3, 0, 19.0], [3.2, 0, 19.6], [2.0, 0, 19.3], [1.2, 0, 18.4]]);
  tag('WELLNESS', -4.47, 1.62, 16.2, PI / 2);
})();

/* --- Z3 THE CARD ROOM: felt, real chairs, the dartboard with the chart, the bar back, the trash, the pickle barrel --- */
(function z3() {
  cc0('plastic_monobloc_chair_01', -8.5, 0, 18.25, 0, 0.8, { mode: 'h' }); cc0('folding_wooden_stool', -8.5, 0, 20.15, PI, 0.45, { mode: 'h' });
  cc0('dartboard', -11.97, 1.5, 18.6, PI / 2, 0.45, { mode: 'm' }); plane(0.3, 0.2, new THREE.MeshBasicMaterial({ map: signTex([{ t: '▂▃▅▇▅▃▁', s: 0.6, c: '#c8102e' }], 256, 160, '#f6f3ea'), toneMapped: false }), -11.93, 1.5, 18.6, PI / 2); // the collapsing candlestick chart taped over it
  cc0('metal_trash_can', -5.3, 0, 21.3, 0.4, 0.63, { mode: 'h' }); post(-5.3, 21.3, 0.3, -1, 0.8); [[-5.25, 0.68, 21.25], [-5.4, 0.66, 21.4]].forEach(p => { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05, 0), MAT.white); b.position.set(...p); scene.add(b); });
  panel('p04_barback', 2.4, 1.34, -11.05, 1.75, 21.97, PI); cc0('cassette_player', -11.0, 0.9, 21.55, PI, 0.09, { mode: 'h' });
  sticker('pickle_barrel', -11.3, 0, 17.6, 0.3, 0.9, { mode: 'h' }); post(-11.3, 17.6, 0.4, -1, 1.0);
  box(0.25, 0.25, 0.002, new THREE.MeshStandardMaterial({ color: 0xd6c296, roughness: 1 }), -11.97, 1.6, 20.4, PI / 2, 0, false); // the masking tape X
  [[-7.9, 19.9], [-9.1, 19.9], [-7.9, 18.5], [-9.1, 18.5]].forEach(([x, z]) => box(0.08, 0.004, 0.08, new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 1 }), x, 0.002, z, 0, 0, false)); // taped chair footprint
  // the panic room: a flush door in the south wall; press E and it is a padded cell with a dead phone and an inward peephole
  const pd = box(0.8, 2.0, 0.05, MAT.panel, -6.6, 1.0, 21.95, 0, 0, false); interact(-6.6, 21.3, 1.2, 'THE FLUSH DOOR', () => { toast('A PANIC ROOM. PADDED STOOL. DEAD PHONE. THE PEEPHOLE FACES IN. SECURITY IS WATCHING YOURSELF PANIC.', 'blue'); pd.rotation.y = pd.rotation.y ? 0 : -1.4; state.eggs.add('panic'); knock(1); }, 0);
  tag('LIQUIDITY', -11.97, 1.62, 21.6, PI / 2); outlet(-11.97, 0.28, 20.0, PI / 2); lightSwitch(-5.25, 1.15, 17.9, PI);
})();

/* --- Z4 BOILER AND LAUNDRY: the heater, the sink, the dehumidifier, the sump, the workbench and its photograph, the paint cans, the stickers --- */
(function z4() {
  cyl(0.33, 0.33, 1.65, MAT.enamel, 12.3, 0.825, 15.6, 20); cyl(0.05, 0.05, 0.5, MAT.steel, 12.3, 1.9, 15.6, 10); [-0.1, 0.1].forEach(dx => cyl(0.012, 0.012, 0.6, MAT.copper, 12.3 + dx, 1.95, 15.6, 8)); post(12.3, 15.6, 0.4, -1, 1.8); // the hot water heater
  box(0.82, 0.88, 0.62, MAT.enamel, 10.2, 0.44, 11.65); box(0.7, 0.3, 0.5, MAT.ink, 10.2, 0.74, 11.65); cyl(0.012, 0.012, 0.3, MAT.steel, 10.2, 1.03, 11.4, 8); boxWalls(10.2, 11.65, 0.82, 0.62, 0, -1, 1.0); // the slop sink
  box(0.36, 0.57, 0.28, MAT.beige, 12.4, 0.285, 16.8); box(0.3, 0.06, 0.02, MAT.ink, 12.4, 0.45, 16.95); post(12.4, 16.8, 0.28, -1, 0.7); // dehumidifier
  cyl(0.32, 0.32, 0.03, MAT.ink, 12.5, 0.015, 18.6, 20); cyl(0.04, 0.04, 1.8, MAT.white, 12.75, 0.9, 18.6, 10); // sump pit and the PVC rising
  panel('p05_workbench', 2.0, 1.6, 4.78, 1.55, 15.6, PI / 2); box(0.95, 0.78, 2.4, MAT.wood, 5.3, 0.39, 15.6, 0); boxWalls(5.3, 15.6, 0.95, 2.4, 0, -1, 0.9); // the bench under its photograph
  cc0('metal_toolbox', 5.3, 0.79, 15.0, 0.3, 0.24, { mode: 'h' }); cc0('pipe_wrench', 5.3, 0.79, 16.2, 1.2, 0.38, { mode: 'm' }); prop('nailbin', 5.1, 0.79, 16.6, 0, 0.14); prop('oilcan', 5.5, 0.79, 14.6, 0.5, 0.2);
  [[11.2, 18.4], [11.5, 18.3], [11.35, 18.65], [11.8, 18.5], [11.2, 18.4, 0.2], [11.5, 18.3, 0.2]].forEach(([x, z, y]) => paintCan(x, y || 0, z, [0x6a7fb8, 0xc8102e, 0xd8c070, 0x3a6b3a, 0xf0f0e0, 0x8a4a2a][Math.floor(rnd() * 6)])); post(11.5, 18.45, 0.5, -1, 0.5);
  panel('p06_cavity', 1.2, 1.6, 7.9, 1.2, 11.03, 0); decal('d_rust', 0.18, 0.8, 12.97, 1.2, 16.4, -PI / 2); decal('d_detergent', 0.55, 0.4, 7.0, 0, 12.3, 0, true); cyl(0.15, 0.15, 0.004, MAT.ink, 7.7, 0.003, 12.6, 16); // the drain
  sticker('fuse_box', 12.97, 1.5, 12.9, -PI / 2, 0.55, { mode: 'm' }); sticker('laundry_bag', 9.4, 0, 12.5, 0.4, 0.7, { mode: 'h' }); sticker('drying_rack', 21.3, 0, 21.0, 0.6, 1.0, { mode: 'h' }); post(21.3, 21.0, 0.5, -1, 1.0);
  cc0('korean_fire_extinguisher_01', 4.85, 0.35, 14.2, PI / 2, 0.5, { mode: 'h' }); box(0.03, 0.08, 0.03, MAT.orange, 4.85, 0.9, 14.2);
  cc0('portable_generator', 10.6, 0, 18.3, PI, 0.55, { mode: 'h' }); post(10.6, 18.3, 0.4, -1, 0.7); cc0('metal_jerrycan', 10.0, 0, 18.5, 0.3, 0.45, { mode: 'h' });
  // the sub basement: a door in the south wall and eight steps down to a sump, a folding chair and the basement landlord
  const sd = box(0.9, 2.0, 0.06, MAT.panel, 6.2, 1.0, 18.95, 0, 0, false); interact(6.2, 18.3, 1.2, 'THE SUB BASEMENT', () => { toast('EIGHT STEPS DOWN. CONCRETE. A SUMP PUMP. ONE FOLDING CHAIR. THE BASEMENT HAS A BASEMENT LANDLORD.', 'blue'); sd.rotation.y = sd.rotation.y ? 0 : 1.3; state.eggs.add('subbasement'); knock(3); }, 0);
  tag('INFRASTRUCTURE', 4.78, 1.62, 12.2, PI / 2); outlet(12.97, 0.28, 17.2, -PI / 2);
})();

/* --- Z5 the Penrose and the PC get their shelves and the exercise graveyard --- */
(function z5() {
  panel('p07_pcshelf', 1.4, 1.7, 4.78, 1.3, 17.4, PI / 2); // Flushing computer repair, beside the relic
  // NordicTrack and Bowflex, the exercise graveyard against the court's north door wall
  box(0.1, 0.05, 1.8, MAT.wood, 10.6, 0.3, 14.6, 0); box(0.1, 0.05, 1.8, MAT.wood, 11.1, 0.3, 14.6, 0); box(0.08, 1.3, 0.08, MAT.steel, 10.85, 0.7, 13.75); box(0.3, 0.1, 0.5, MAT.ink, 10.6, 0.4, 14.9); box(0.3, 0.1, 0.5, MAT.ink, 11.1, 0.4, 14.3); boxWalls(10.85, 14.6, 0.7, 1.9, 0, -1, 1.3);
  box(1.0, 0.1, 0.5, MAT.ink, 8.2, 0.45, 14.4); box(0.08, 2.0, 0.08, MAT.steel, 8.2, 1.0, 13.9); for (let i = 0; i < 6; i++) { const r = cyl(0.008, 0.008, 1.1, MAT.ink, 8.2 + (i - 2.5) * 0.06, 1.5, 13.85, 6); r.rotation.z = (i - 2.5) * 0.12; } boxWalls(8.2, 14.2, 1.0, 0.8, 0, -1, 1.2);
  cc0('ceiling_fan', 9, 1.95, 15.0, 0, 0.3, { mode: 'h', tick: (s, dt) => { if (s.root) s.root.rotation.y += dt * 1.1; } });
  cc0('plastic_crate_01', 12.5, 0, 17.5, 0.2, 0.32, { mode: 'h' }); for (let i = 0; i < 12; i++) box(0.09, 0.09, 0.003, MAT.ink, 12.42 + (i % 4) * 0.045 - 0.07, 0.36 + Math.floor(i / 4) * 0.004, 17.5 + (rnd() - 0.5) * 0.1, rnd() * 0.3, 0, false);
  cyl(0.16, 0.16, 0.36, MAT.steel, 12.6, 0.18, 14.4, 16); cyl(0.14, 0.14, 0.02, new THREE.MeshStandardMaterial({ color: 0x2b2a24, roughness: 0.1 }), 12.6, 0.34, 14.4, 16); // condensate bucket with dark water
  for (let i = 0; i < 12; i++) box(0.05, 0.22, 0.05, MAT.steel, 11.0 + i * 0.045, 2.0, 16.2, 0.2, 0, false); // the duct tape pipe repair
  decal('d_coax', 0.45, 0.7, 12.97, 1.1, 13.6, -PI / 2);
  // the server closet behind the PC: one rack, a desk fan, one loose power strip the whole dungeon runs on
  interact(4.9, 18.0, 1.3, 'THE SERVER CLOSET', () => { toast('ONE RACK. TANGLED PATCH CABLES. A DESK FAN. THE ENTIRE DUNGEON RUNS ON ONE LOOSE POWER STRIP. DO NOT TOUCH THE STRIP.', 'blue'); state.eggs.add('server'); flash('#2962FF'); }, 0);
})();

/* --- Z6 THE HALLWAY: the Peloton, the water cooler, the cage photograph, the crates, the extinguisher, the fuse box, the rat --- */
(function z6() {
  const x = HALL.x; box(0.62, 0.1, 1.1, MAT.ink, x - 0.55, 0.05, 9.6, 0.1); box(0.06, 1.1, 0.06, MAT.steel, x - 0.55, 0.65, 9.2); box(0.3, 0.2, 0.02, MAT.ink, x - 0.55, 1.25, 9.1, 0, 0, false); [[0x8a1f2a], [0x3a3a52], [0xf0ede4]].forEach(([c], i) => box(0.3, 0.02, 0.12, new THREE.MeshStandardMaterial({ color: c, roughness: 1 }), x - 0.55 + (i - 1) * 0.1, 1.0, 9.4, 0.2)); // the broken Peloton, three towels
  cyl(0.17, 0.17, 1.0, MAT.beige, x + 0.5, 0.5, 10.4, 14); cyl(0.14, 0.12, 0.35, MAT.glass, x + 0.5, 1.15, 10.4, 14); cyl(0.03, 0.025, 0.07, MAT.white, x + 0.5, 0.95, 10.22, 10); post(x + 0.5, 10.4, 0.22, -1, 1.3); // the water cooler with a wedged cup
  panel('p08_cage', 1.0, 0.82, HALL.x - HALL.w(7.0) / 2, 1.0, 7.0, PI / 2); panel('p09_bins', 0.76, 0.76, HALL.x + HALL.w(5.4) / 2, 0.95, 5.4, -PI / 2);
  cc0('plastic_crate_01', x + 0.45, 0, 8.3, 0.1, 0.3, { mode: 'h' }); cc0('plastic_crate_01', x + 0.45, 0.3, 8.3, 0.25, 0.3, { mode: 'h' }); cc0('plastic_crate_01', x + 0.45, 0.6, 8.3, 0.05, 0.3, { mode: 'h' });
  cc0('power_box_01', x - HALL.w(8.8) / 2 + 0.02, 1.0, 8.8, PI / 2, 0.45, { mode: 'h' }); cc0('street_rat', x + 0.3, 0, 2.2, -0.6, 0.12, { mode: 'm', placed: s => { V2.hallRat = s; } });
  sticker('mop_bucket', x + 0.45, 0, 10.9, 0.2, 0.55, { mode: 'h' }); prop('umbrellastand', x - 0.5, 0, 10.9, 0, 0.55);
  decal('d_plaster', 0.6, 0.35, x + HALL.w(4.2) / 2, 1.0, 4.2, -PI / 2); box(0.07, 0.004, 9.0, MAT.ink, x, 0.002, 6.0, 0, 0, false); // the false perspective seam
  // the crawlspace hatch at the mouth: every remote in there works the den TV except its own
  const hatch = box(0.7, 0.7, 0.03, MAT.panel, x - HALL.w(10.4) / 2 + 0.02, 0.4, 10.4, PI / 2, 0, false); interact(x, 10.4, 1.0, 'THE CRAWLSPACE HATCH', () => { hatch.rotation.x = hatch.rotation.x ? 0 : -1.3; toast('DIRT FLOOR. JOISTS. FORTY LOST REMOTES. EVERY ONE WORKS THE DEN TV EXCEPT ITS OWN.', 'blue'); channel(); state.eggs.add('crawl'); }, 0);
})();

/* --- Z7 THE BAGEL CAVERN: the shelves of the bodega and the pantry, the deli counter, the seltzer pallet, the gantry, the console --- */
(function z7() {
  const cx = -20, cz = -9;
  panel('p10_bodega', 2.4, 1.8, -35.97, 1.6, -14, PI / 2); panel('p11_pantry', 1.8, 1.8, -3.63, 1.6, -18, -PI / 2);
  box(2.4, 1.0, 0.9, MAT.steel, -33.5, 0.5, -20.5, 0); box(2.4, 0.5, 0.9, MAT.glass, -33.5, 1.25, -20.5, 0); boxWalls(-33.5, -20.5, 2.4, 0.9, 0, -1, 1.5); prop('breadslicer', -33.0, 1.0, -20.4, 0, 0.4); prop('bagelbin', -34.2, 1.0, -20.4, 0, 0.42); // the deli counter
  box(1.2, 0.12, 1.0, MAT.wood, -8, 0.06, -20, 0); for (let i = 0; i < 8; i++) box(0.4, 0.24, 0.28, new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.3, transparent: true, opacity: 0.7 }), -8.4 + (i % 3) * 0.4, 0.24 + Math.floor(i / 3) * 0.26, -20.3 + (i % 2) * 0.5, 0); boxWalls(-8, -20, 1.2, 1.0, 0, -1, 0.9); // the seltzer pallet
  cc0('barrel_03', -27, 0, -22.5, 0.4, 0.95, { mode: 'h' }); post(-27, -22.5, 0.4, -1, 1.1); box(0.35, 0.02, 0.05, MAT.steel, -27, 0.97, -22.5, 0.3);
  // the utility gantry over the bagel: four posts, a grating, three pipes and two cable trays, and the console with RENT, COPIUM and RESET
  [[-24, -13], [-16, -13], [-24, -5], [-16, -5]].forEach(([x, z]) => { box(0.12, 4.0, 0.12, MAT.iron, x, 2.0, z); post(x, z, 0.15, -1, 4); }); box(8.2, 0.08, 8.2, MAT.pipe, cx, 4.0, cz, 0, 0, false);
  [-0.3, 0, 0.3].forEach(dx => cyl(0.06, 0.06, 30, MAT.pipe, cx + dx * 4, 4.4, cz, 10, PI / 2)); [-1, 1].forEach(s => box(30, 0.08, 0.18, MAT.steel, cx, 4.6, cz + s * 1.2, 0, 0, false));
  const con = box(0.8, 1.2, 0.45, MAT.beige, -11.5, 0.6, -3.0, 0); boxWalls(-11.5, -3.0, 0.8, 0.45, 0, -1, 1.3); V2.consoleScreen = plane(0.26, 0.12, new THREE.MeshBasicMaterial({ map: signTex([{ t: 'READY', s: 0.5, f: 'mono' }], 256, 128, '#0a2a1a', '#7fff9a'), toneMapped: false }), -11.5, 0.95, -2.77, 0);
  [['RENT', -11.72], ['COPIUM', -11.5], ['RESET', -11.28]].forEach(([n, x]) => { const b = box(0.12, 0.05, 0.08, MAT.orange, x, 0.7, -2.78, 0); plaque([{ t: n, s: 0.6, f: 'mono' }], x, 0.62, -2.775, 0, 0.14, 0.03, { bg: '#0D0D0D', back: false }); V2['btn' + n] = b; interact(x, -2.2, 0.7, 'PRESS ' + n, () => consoleButton(n), 0); });
  tag('INFRASTRUCTURE', -11.5, 1.35, -2.78, 0);
  // the wine cellar of seltzer: a door in the south wall, racks that hold only seltzer, one velvet cushion under a siphon
  const wd = box(0.8, 2.0, 0.06, MAT.wood, -30, 1.0, 6.17, 0, 0, false); interact(-30, 5.5, 1.2, 'THE WINE CELLAR', () => { toast('TIMBER RACKS. ONLY SELTZER. ONE VELVET CUSHION UNDER A SIPHON. THE VINTAGE IS HOW FLAT IT IS.', 'blue'); wd.rotation.y = wd.rotation.y ? 0 : 1.2; state.eggs.add('cellar'); chime(392); }, 0);
  sticker('rent_envelope', 12.35, 0.78, 20.85, 0.3, 0.2, { mode: 'm' }); // the rent envelope lives on the court desk
  decal('d_sesame', 1.2, 0.8, -5.5, 0, 3.0, 0, true, 0.2); box(0.22, 0.3, 0.002, new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1, transparent: true, opacity: 0.35 }), -3.63, 1.35, -8.0, -PI / 2, 0, false); // the grease smear
  cc0('hanging_industrial_lamp', cx, 3.4, cz, 0, 0.6, { mode: 'h' });
})();

/* --- Z8 THE COURT: the runner, the dais, the throne, the Rat King as Astra drew him, the desk, the chairs, the portrait, the cold room shelves --- */
(function z8() {
  box(1.8, 0.008, 7.0, new THREE.MeshStandardMaterial({ color: 0x5a1f22, roughness: 1 }), 9, 0.004, 23.8, 0, 0, false); for (let z = 21; z < 27; z += 1.2) box(0.3, 0.004, 0.3, MAT.orange, 9, 0.009, z, PI / 4, 0, false); // the runner, floor arrows toward the throne
  box(3.4, 0.3, 2.0, MAT.wood, 9, 0.15, 26.6, 0, 0, false); box(3.4, 0.06, 0.04, MAT.gold, 9, 0.17, 25.6, 0, 0, false); padRect(7.3, 10.7, 25.6, 27.6, 0.3, -1); padRamp(8.2, 9.8, 24.2, 25.6, 'z', 24.2, 25.6, 0, 0.3); // the dais and its ramp
  // the throne is the recliner; the V1 Rat King (the crystal rat) stays on its crates as the monument, the bathrobe king sits here
  V2.throne = cc0('mid_century_lounge_chair', 9, 0.3, 26.8, PI, 0.95, { mode: 'h' }); box(0.4, 0.3, 0.3, MAT.crust, 9, 1.35, 27.2, 0.1); post(9, 26.8, 0.5, -1, 1.5);
  const rk = new THREE.Group(); const rb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), MAT.fur); rb.scale.set(1, 1.1, 1); rb.position.y = 0.3; rk.add(rb); const rh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), MAT.fur); rh.position.set(0, 0.62, 0.08); rk.add(rh); V2.ratHead = rh;
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), MAT.fur); e.position.set(s * 0.1, 0.74, 0.04); rk.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), MAT.ink); ey.position.set(s * 0.05, 0.64, 0.2); rk.add(ey); });
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.5, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x7b1f2a, roughness: 1, side: THREE.DoubleSide })); robe.position.y = 0.3; rk.add(robe);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), MAT.gold); crown.position.set(0, 0.8, 0.05); rk.add(crown); V2.crown = crown; const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0xc9a08a, roughness: 1 })); tail.rotation.z = 1.3; tail.position.set(0.2, 0.15, -0.1); rk.add(tail);
  rk.position.set(9, 0.62, 26.75); rk.rotation.y = PI; rk.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(rk); V2.rat = rk;
  // the court desk: stamp, ledger, mug
  box(1.8, 0.04, 0.7, MAT.wood, 12.0, 0.76, 21.0, 0); [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]].forEach(([a, b]) => cyl(0.02, 0.02, 0.76, MAT.steel, 12 + a, 0.38, 21 + b, 8)); boxWalls(12.0, 21.0, 1.8, 0.7, 0, -1, 0.9);
  V2.stamp = box(0.06, 0.1, 0.06, MAT.wood, 11.4, 0.83, 20.9, 0); box(0.05, 0.02, 0.05, MAT.orange, 11.4, 0.77, 20.9); V2.ledger = plane(0.3, 0.22, new THREE.MeshBasicMaterial({ map: signTex([{ t: 'LEDGER', s: 0.3, f: 'mono', c: '#0D0D0D' }, { t: 'RENT: VERBAL', s: 0.22, f: 'mono', c: '#0D0D0D' }], 512, 384, '#f6f3ea'), toneMapped: false }), 12.0, 0.785, 21.0, 0, -PI / 2); cyl(0.045, 0.04, 0.1, MAT.white, 12.6, 0.83, 21.2, 12);
  interact(12.0, 20.3, 1.2, 'STAMP THE LEDGER', () => { V2.stampT = 1; ledgerWrite('APPROVED BY MOM'); state.eggs.add('stamp'); chime(523); }, 0);
  [[6.2, 21.5, 0.3], [6.2, 23.0, -0.2], [11.8, 23.2, 0.4]].forEach(([x, z, ry], i) => { const m = i === 1 ? cc0('plastic_monobloc_chair_01', x, 0, z, ry, 0.8, { mode: 'h' }) : cc0('folding_wooden_stool', x, 0, z, ry, 0.45, { mode: 'h' }); V2.chairs.push(m); post(x, z, 0.3, -1, 0.9); });
  V2.portrait = panel('p13_portrait', 0.96, 1.2, 5.03, 1.5, 25.0, PI / 2, { frame: 'brass' }); V2.mask = box(0.3, 0.1, 0.01, MAT.ink, 5.08, 1.72, 25.0, PI / 2, 0, false); V2.mask.visible = false;
  tag('SOVEREIGN', 7.5, 1.7, 27.97, PI); tag('LIQUIDITY', 10.5, 1.7, 27.97, PI); V2.seal = plaque([{ t: 'MLOW', s: 0.6, c: '#2962FF' }], 9, 0.31, 25.62, 0, 0.5, 0.2, { bg: '#0D0D0D', back: false }); V2.seal.rotation.x = -PI / 2; V2.seal.position.set(9, 0.306, 26.2);
  box(0.25, 0.1, 0.18, MAT.white, 8.6, 0.62, 27.5, 0.2); V2.carton = box(0.25, 0.06, 0.18, MAT.white, 8.6, 0.7, 27.5, 0.2); V2.carton.geometry.translate(0, 0, 0.09); V2.carton.position.z = 27.41; V2.key = box(0.03, 0.01, 0.08, MAT.gold, 8.6, 0.64, 27.5); V2.key.visible = false; // the carton hiding the gold house key
  decal('d_frost', 0.6, 1.0, 27.97, 1.0, 24.0, -PI / 2); // frost bloom in the cold room
  const rat = [[8.8, 26.0], [8.9, 26.4], [8.6, 26.5], [8.4, 26.2], [8.5, 25.9], [8.8, 26.0]]; const g = new THREE.BufferGeometry().setFromPoints(rat.map(p => new V3(p[0], 0.004, p[1]))); scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf0ede4 }))); // chalk outline of a rat
  cc0('concrete_cat_statue', 12.6, 0, 27.4, -0.4, 0.5, { mode: 'h' }); cc0('trashbag', 5.6, 0, 20.0, 0.3, 0.55, { mode: 'h' }); cc0('street_rat', 6.5, 0, 24.5, 1.2, 0.12, { mode: 'm' });
  // the cold room shelves: twelve tubs with labels
  [[20.6, 0], [27.4, PI]].forEach(([x, ry]) => { for (let i = 0; i < 4; i++) box(0.45, 0.02, 2.8, MAT.steel, x, 0.4 + i * 0.42, 24, ry, 0, false); [0.1, 0.5, 0.9, 1.3].forEach(dy => { }); boxWalls(x, 24, 0.5, 2.8, 0, -1, 1.8); });
  const labels = ['SOUP', 'MORE SOUP', 'EMERGENCY SOUP', 'SOUP (2019)', 'NOT SOUP', 'SOUP?', 'LASAGNA', 'GRAVY', 'SAUCE', 'SUNDAY SAUCE', 'ICE', 'SOUP']; let k = 0;
  [[20.6, 0], [27.4, PI]].forEach(([x, ry]) => { for (let i = 0; i < 6; i++) { const t = { g: null }; tub(x + (ry ? -0.02 : 0.02), 0.42 + Math.floor(i / 3) * 0.42, 23.0 + (i % 3) * 0.9, labels[k++]); } });
  sticker('cheese_wheel', 10.9, 0.3, 26.3, 0.4, 0.5, { mode: 'm' }); panel('p12_freezer', 1.1, 1.65, 24, 1.5, 20.03, 0);
  interact(8.6, 24.0, 2.2, '', null, 0);
})();

/* --- lighting per zone (Astra section 8): recolour the bulbs by zone, scale by the den --- */
(function lightsV2() {
  const Z = [[-1.4, 1.4, 20, 30, 0xB9C9D6, 0.55], [-4.5, 4.5, 11, 20, 0xFFD29A, 1.0], [-12, -4.75, 17, 22, 0xE8BB73, 0.7], [4.75, 13, 11, 19, 0xCED7B0, 0.6], [-3.7, -1.3, -40, 11, 0xD7CAB1, 0.35], [-36, -3.6, -24, 6.2, 0xE8A45B, 0.4], [5, 13, 19.25, 28, 0xB8DDE5, 0.5], [20, 28, 20, 28, 0xB8DDE5, 0.5]];
  practicals.forEach(l => { const z = Z.find(z => l.position.x >= z[0] && l.position.x <= z[1] && l.position.z >= z[2] && l.position.z <= z[3]); if (!z || l.userData.keep) return; l.color.set(z[4]); l.intensity *= z[5] * 1.15; l.userData.base *= z[5] * 1.15; l.decay = 2; });
  BULBS.forEach(b => { const z = Z.find(z => b.x >= z[0] && b.x <= z[1] && b.z >= z[2] && b.z <= z[3]); if (z) b.color = z[4]; });
})();

/* --- the forty: Astra's eggs, physical first --- */
function ledgerWrite(t, c = '#0D0D0D') { V2.ledger.material.map = signTex([{ t: 'LEDGER', s: 0.3, f: 'mono', c: '#0D0D0D' }, { t, s: 0.22, f: 'mono', c }], 512, 384, '#f6f3ea'); V2.ledger.material.needsUpdate = true; }
function consoleSay(t) { V2.consoleScreen.material.map = signTex([{ t, s: 0.5, f: 'mono' }], 256, 128, '#0a2a1a', '#7fff9a'); V2.consoleScreen.material.needsUpdate = true; }
function consoleButton(n) { const b = V2['btn' + n]; if (b) { b.position.y = 0.68; setTimeout(() => b.position.y = 0.7, 300); }
  if (n === 'RENT') { consoleSay('DUE: ONE PHONE CALL'); toast('RENT: DUE. ONE PHONE CALL. SHE WOULD NEVER. SHE MIGHT.'); } if (n === 'COPIUM') { V2.steam = 3; consoleSay('COPING'); toast('THREE HARMLESS PUFFS OF STEAM. THE CONSOLE IS COPING.', 'blue'); } if (n === 'RESET') { resetEggs(); consoleSay('READY'); toast('EVERY TEMPORARY EGG RETURNED TO ITS STARTING STATE OVER ONE SECOND.'); } state.eggs.add('console'); chime(n === 'RESET' ? 330 : 660); }
function resetEggs() { V2.mask.visible = false; V2.crownT = 0; V2.nodT = 0; V2.reclineT = 0; if (V2.yarn) { V2.yarn.visible = false; } V2.chairTiltT = 0; V2.tubsT = 0; ledgerWrite('RENT: VERBAL'); W.freezer.open = false; }
Object.assign(EGGS, {
  gn: () => { V2.reclineT = 5; toast('THE THRONE RECLINES TWELVE DEGREES. FIVE SECONDS. THEN BACK TO WORK.'); },
  rekt: () => { ledgerWrite('TUITION PAID', '#c8102e'); toast('THE LEDGER: TUITION PAID, IN RED. THE NEXT PAGE IS BLANK.'); },
  anon: () => { V2.mask.visible = true; V2.maskT = 6; toast('THE PORTRAIT HAS PUT ON A PAPER EYE MASK. SIX SECONDS OF PRIVACY.'); },
  lurk: () => toast('THE MUG SAYS: ATTENDANCE COUNTS.'),
  sage: () => { V2.stampSpin = 1; toast('THE STAMP TURNS OVER. ITS UNDERSIDE SAYS LET IT REST.'); },
  thread: () => { if (!V2.yarn) { const g = new THREE.BufferGeometry().setFromPoints([new V3(5.1, 2.1, 25.0), new V3(8, 2.3, 23), new V3(12, 0.8, 21)]); V2.yarn = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xc8102e })); scene.add(V2.yarn); } V2.yarn.visible = true; V2.yarnT = 5; toast('RED YARN FROM THE PORTRAIT TO THE LEDGER. IT CONNECTS. IT ALWAYS CONNECTS.'); },
  bodega: () => { V2.sandwichT = 10; toast('A WRAPPED EGG AND CHEESE HAS APPEARED IN THE FREEZER BASKET. TEN SECONDS. SALT PEPPER KETCHUP.'); },
  baconeggandcheese: () => { ledgerWrite('SALTPEPPERKETCHUP?'); toast('THE LEDGER ASKS: SALTPEPPERKETCHUP?'); },
  subway: () => { V2.trainT = 5; toast('A TRAIN PASSES, LEFT TO RIGHT, UNDER THE FLOOR. IT IS NOT STOPPING HERE.'); knock(1); },
  showtime: () => { V2.chairTiltT = 2; toast('SHOWTIME. THE REAR LEFT CHAIR TILTS EIGHT DEGREES. WHAT TIME IS IT.'); },
  alternate: () => { toast('ALTERNATE SIDE: THE FREEZER LABELS HAVE SWAPPED SIDES. MOVE YOUR SOUP.'); V2.tubsT = 3; },
  hungry: () => { W.freezer.open = true; W.freezerLight.intensity = 3; toast('THE LID OPENS 75 DEGREES. THE BASKET IS STOCKED. SHE KNEW.', 'blue'); },
  laundry: () => { V2.drumSpin = 6; toast('THE DRUM TURNS TWO REVOLUTIONS. THE SHELL STAYS. THE SOCK DOES NOT.'); },
  rent: () => { toast('RENT DUE IN ' + rentDue() + '. VERBAL LEASE. MONTH TO MONTH. SHE WOULD NEVER. SHE MIGHT.'); if (nyc().d === '1') { V2.envelope = V2.envelope || box(0.22, 0.01, 0.11, MAT.white, 12.3, 0.78, 20.8, 0.2); toast('IT IS THE FIRST. A RENT ENVELOPE IS ON THE DESK.'); } },
  key: () => { if (V2.key.visible) toast('YOU STILL HAVE A KEY. YOU ALWAYS HAD A KEY.'); else toast('THERE IS A KEY SOMEWHERE IN THIS COURT. UNDER SOMETHING. IN SOMETHING.'); },
  seize: () => toast('THE MEANS OF PRODUCTION ARE A BOILER AND A DRYER. THEY ARE YOURS. GOOD LUCK.'),
  touchgrass: () => EGGS['touch grass'](),
});
// physical eggs on the freezer: E at the handle toggles the lid; E at the open basket raises it; E at the carton reveals the key
INTER.push({ x: 8.6, z: 26.6, r: 1.3, label: 'THE FREEZER BASKET', fn: () => { if (!W.freezer.open) return openFreezer(); if (!V2.basketUp) { V2.basketUp = true; toast('THE BASKET RISES AND SLIDES TOWARD YOU. UNDER IT: A TAKEOUT CARTON.'); V2.carton.position.y = 0.78; return; } V2.carton.rotation.x = -1.0; V2.key.visible = true; toast('THE CARTON OPENS. A GOLD HOUSE KEY. YOU STILL HAVE A KEY.', 'blue'); state.eggs.add('key'); chime(880); }, y: 0 });
/* look at something for three seconds: the portrait, the LIQUIDITY plaque, the dryer sock, the MLow seal */
V2.looks = [
  { x: 5.03, y: 1.5, z: 25.0, r: 0.8, t: 0, fn: () => { V2.eyesT = 4; toast('THE PAINTED EYES HAVE SHIFTED TOWARD THE FREEZER.'); } },
  { x: 10.5, y: 1.7, z: 27.97, r: 0.4, t: 0, fn: () => { V2.beadT = 3; toast('A BEAD OF CONDENSATION RUNS DOWN LIQUIDITY. THEN IT IS GONE.'); } },
  { x: 8.3, y: 0.5, z: 11.6, r: 0.5, t: 0, fn: () => { if (!V2.sock2) { V2.sock2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), MAT.sock); V2.sock2.position.set(-0.1, -0.2, 0); W.dryer.drum.add(V2.sock2); } V2.sock2.visible = true; V2.sock2T = 8; toast('A MATCHING SOCK HAS APPEARED BESIDE IT. EIGHT SECONDS. DO NOT GET ATTACHED.'); } },
  { x: 9, y: 0.31, z: 26.2, r: 0.5, t: 0, fn: () => { V2.sealT = 2; V2.saluteT = 2; toast('THE SEAL BRIGHTENS. THE RAT KING SALUTES. ONCE.', 'blue'); } },
];
V2.lookDir = new V3(); V2.lookTmp = new V3();
function lookTick(dt) { camera.getWorldDirection(V2.lookDir); V2.looks.forEach(L => { V2.lookTmp.set(L.x, L.y, L.z).sub(camera.position); const d = V2.lookTmp.length(); if (d > 8) { L.t = 0; return; } V2.lookTmp.normalize(); const ang = Math.acos(clamp(V2.lookDir.dot(V2.lookTmp), -1, 1)); if (ang < Math.atan2(L.r, d) + 0.05) { L.t += dt; if (L.t > 3 && !L.fired) { L.fired = true; L.fn(); state.eggs.add('look'); } } else { L.t = 0; L.fired = false; } }); }
/* New York time and the calendar */
V2.clockFired = {};
function clockEggs() { const t = nyc(); const k = t.d + ':' + t.h; if (V2.clockFired[k]) return; V2.clockFired[k] = true;
  if (t.h === 7) { consoleSay('COFFEE FIRST'); toast('07:00 NEW YORK. THE CONSOLE SAYS COFFEE FIRST.'); } if (t.h === 17) { ledgerWrite('SIGNAL PROBLEMS, SPIRITUALLY'); } if (t.h === 23) { V2.crownDownT = 10; toast('23:00. THE RAT KING LOWERS HIS CROWN OVER HIS EYES.'); }
  if (t.d === '15' && !V2.extra) { V2.extra = true; toast('THE FIFTEENTH. THE FREEZER LABELS SAY: MOM SENT EXTRA.'); } }
/* the physical tick: nods, crowns, recline, mask, yarn, steam, chairs, tubs, stamp, bead, train, salute */
function v2Tick(dt, t) {
  if (!V2.rat) return; const rk = V2.rat;
  if (V2.nodT > 0) { V2.nodT -= dt; V2.ratHead.rotation.x = Math.sin(t * 8) * 0.25; } else V2.ratHead.rotation.x *= 0.9;
  if (V2.crownT > 0) { V2.crownT -= dt; V2.crown.position.y = 0.92; } else if (V2.crownDownT > 0) { V2.crownDownT -= dt; V2.crown.position.y = 0.66; } else V2.crown.position.y += (0.8 - V2.crown.position.y) * 0.1;
  if (V2.reclineT > 0) { V2.reclineT -= dt; rk.rotation.x = -0.2; } else rk.rotation.x *= 0.9;
  if (V2.pointT > 0) { V2.pointT -= dt; rk.rotation.y = PI + 0.5; } else rk.rotation.y += (PI - rk.rotation.y) * 0.1;
  if (V2.saluteT > 0) { V2.saluteT -= dt; rk.rotation.z = Math.sin(t * 6) * 0.08; } else rk.rotation.z *= 0.9;
  if (V2.maskT > 0) { V2.maskT -= dt; if (V2.maskT <= 0) V2.mask.visible = false; }
  if (V2.yarnT > 0) { V2.yarnT -= dt; if (V2.yarnT <= 0) V2.yarn.visible = false; }
  if (V2.steam > 0) { V2.steamT = (V2.steamT || 0) + dt; if (V2.steamT > 0.6) { V2.steamT = 0; V2.steam--; const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); p.position.set(-11.5, 1.25, -2.9); scene.add(p); const born = t; const up = () => { p.position.y += 0.02; p.material.opacity -= 0.02; if (p.material.opacity > 0) requestAnimationFrame(up); else scene.remove(p); }; up(); } }
  if (V2.chairTiltT > 0) { V2.chairTiltT -= dt; const c = V2.chairs[0]; if (c && c.root) c.root.rotation.x = -0.14; } else V2.chairs.forEach(c => { if (c.root) c.root.rotation.x *= 0.9; });
  if (V2.stampT > 0) { V2.stampT -= dt; V2.stamp.position.y = 0.78 + Math.abs(Math.sin(V2.stampT * PI)) * 0.06; }
  if (V2.stampSpin > 0) { V2.stampSpin -= dt; V2.stamp.rotation.x = PI * (1 - V2.stampSpin); }
  if (V2.eyesT > 0) { V2.eyesT -= dt; V2.portrait.material.map.offset.x = 0.012; } else if (V2.portrait) V2.portrait.material.map.offset.x = 0;
  if (V2.sealT > 0) { V2.sealT -= dt; V2.seal.material.color.setScalar(1.6); } else V2.seal.material.color.setScalar(1);
  if (V2.drumSpin > 0) { V2.drumSpin -= dt; W.dryer.drum.rotation.z += dt * 2.1; }
  if (V2.sock2T > 0) { V2.sock2T -= dt; if (V2.sock2T <= 0 && V2.sock2) V2.sock2.visible = false; }
  if (V2.trainT > 0) { V2.trainT -= dt; camera.position.y += Math.sin(t * 40) * 0.004; }
  if (V2.hallRat && V2.hallRat.root && state.eggs.has('crawl')) { V2.hallRat.root.position.z += dt * 0.4; if (V2.hallRat.root.position.z > 10.8) V2.hallRat.root.position.z = 1.5; }
  const inCourt = P.x > 5 && P.x < 13 && P.z > 19.25 && P.z < 28; if (inCourt && state.idle > 30 && !V2.pointed) { V2.pointed = true; V2.pointT = 3; toast('THE RAT KING POINTS AT THE AUDIENCE CHAIRS. SIT.'); } if (!inCourt || state.idle < 1) V2.pointed = false;
  const inCold = P.x > 20 && P.x < 28 && P.z > 20 && P.z < 28; if (inCold && state.idle > 10 && !V2.tubsFaced) { V2.tubsFaced = true; toast('EVERY SOUP TUB HAS TURNED TEN DEGREES TOWARD YOU. THEY WILL RESET IN THREE SECONDS.'); } if (!inCold || state.idle < 1) V2.tubsFaced = false;
  if (Math.floor(t) % 30 === 0 && Math.floor(t) !== V2.lastClock) { V2.lastClock = Math.floor(t); clockEggs(); }
  lookTick(dt);
}
/* a gm nod for the king, on top of V1's boiler knock */
const _gm = EGGS.gm; EGGS.gm = () => { _gm(); V2.nodT = 2; }; const _wagmi = EGGS.wagmi; EGGS.wagmi = () => { _wagmi(); V2.crownT = 2; }; const _hodl = EGGS.hodl; EGGS.hodl = () => { _hodl(); toast('THE RAT KING HUGS A SOUP TUB. FIVE SECONDS.'); }; const _cope = EGGS.cope; EGGS.cope = () => { _cope(); consoleSay('FAN RUNNING'); }; const _greentext = EGGS.greentext; EGGS.greentext = () => { _greentext(); ledgerWrite('>came downstairs for five minutes', '#789922'); }; const _upstairs = EGGS.upstairs; EGGS.upstairs = () => { knock(3); toast("THREE SOFT KNOCKS FROM THE CEILING. FOOD'S READY."); }; const _mom = EGGS.mom; EGGS.mom = () => { _mom(); consoleSay('TEXT HER BACK'); };
