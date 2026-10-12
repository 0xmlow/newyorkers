// Round twelve, batch 8: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// The edits (nyb_<set>_*) are made from Poly Haven CC0 models by _build/brand/b8.json.
const PI = Math.PI;

// ---------- small helpers, shared by the batch ----------
// a payphone on its own steel post, the way the city mounts them
function phonePost(c, K, r, g, X, name, x, z, ry, o = {}) {
  const pole = c.slab(0.12, 1.0, 0.12, K.std(0x3a3e44, { metalness: 0.7, roughness: 0.4 }), x, 0.5, z); g.add(pole);
  const m = K.prop(r, g, X, name, x, z, { h: 0.9, y: 0.92, ry, ...o }); c.post(X(x), z, 0.3); return m;
}
// a sign on a wall: plane, hung at (x, y, z) facing ry
function wallSign(c, g, text, x, y, z, ry, o) { const s = c.sign(text, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }
// a flat canvas picture on a wall
function poster(c, K, g, w, h, draw, x, y, z, ry, px = 256) { const d = K.decal(w, h, draw, px); d.position.set(x, y, z); d.rotation.y = ry; g.add(d); return d; }
// facing from (x, z) toward (tx, tz), for a model whose front is +Z at ry 0
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

export const PROPS = {
  outoftowners: [
    ['nyb_trash_dsny', 12.6, -5.2, { h: 0.95, ry: 0.3, r: 0.4 }], ['nyb_trash_dsny', 6.4, -5.6, { h: 0.95, ry: -0.2, r: 0.4 }],
    ['nyb_oot_trashbag', 13.4, -4.6, { h: 0.6, ry: 0.8 }], ['nyb_oot_trashbag', 11.8, -4.8, { h: 0.55, ry: 2.1 }], ['nyb_oot_trashbag', 13.9, -5.5, { h: 0.62, ry: -0.6 }],
    ['nyb_oot_trashbag', 5.6, -5.0, { h: 0.58, ry: 1.4 }], ['trashbag', 7.2, -5.2, { h: 0.5, ry: 0.4 }], ['trashbag', 12.9, -3.9, { h: 0.45, ry: 2.6 }],
    ['nyb_hydrant_pink', 4.9, 1.2, { h: 0.8, ry: 0.4, r: 0.25 }],
    ['nyb_barrier', 9.0, 1.4, { len: 1.5, ry: 0.5, r: 0.3 }], ['nyb_barrier', 11.4, 1.2, { len: 1.5, ry: -0.6, r: 0.3 }],
    ['vintage_suitcase', 8.4, -2.8, { len: 0.75, ry: 0.9 }], ['nyb_aframe_sign', 15.2, 0.2, { h: 1.0, ry: -0.5, r: 0.3 }],
    ['nyb_aircon', 0.32, 0.6, { len: 0.95, y: 2.9, ry: PI / 2 }], ['nyb_aircon', 19.5, -6.5, { len: 0.95, y: 2.6, ry: -PI / 2 }],
  ],
  nakedcity: [
    ['nyb_naked_bench', 5.7, -4.8, { len: 1.5, r: 0.5 }], ['nyb_naked_bench', 12.5, -4.8, { len: 1.5, r: 0.5 }],
    ['nyb_naked_bundle', 8.2, -1.2, { len: 0.7, ry: 0.3, r: 0.35 }], ['nyb_naked_bundle', 10.1, -1.0, { len: 0.7, ry: -0.4, r: 0.35 }],
    ['nyb_naked_bundle', 6.1, -6.2, { len: 0.7, ry: 0.1 }], ['wooden_bucket_01', 13.8, -6.2, { h: 0.45 }],
    ['metal_trash_can', 1.6, 0.4, { h: 0.9, r: 0.35 }], ['vintage_suitcase', 18.4, 0.6, { len: 0.8, ry: -PI / 2 }],
  ],
  apes: [
    ['nyb_apes_horse', 13.6, -2.2, { h: 2.6, ry: -0.6, r: 0.8 }],
    ['dead_tree_trunk_02', 6.4, 6.3, { len: 3.4, ry: 0.15, r: 0.6 }], ['coast_rocks_02', 17.6, -6.2, { len: 4.2, ry: 0.4 }], ['coast_rocks_02', 2.4, -6.3, { len: 3.6, ry: 2.2 }],
    ['boulder_01', 18.6, -4.6, { len: 1.6, ry: 0.7, r: 0.7 }], ['boulder_01', 1.4, -4.4, { len: 1.3, ry: 2.1, r: 0.6 }],
  ],
  enchanted: [
    ['nyb_enchanted_wheel', 13.4, -4.8, { h: 1.25, ry: -0.7, r: 0.5 }],
    ['nyb_enchanted_chandelier', 10, -0.8, { h: 1.3, y: 4.65 }], ['nyb_enchanted_chandelier', 4.6, 3.8, { h: 1.1, y: 4.85 }],
    ['wooden_bookshelf_worn', 0.45, 0.4, { h: 2.1, ry: PI / 2, r: 0.5 }], ['throw_pillows_01', 2.05, -2.4, { len: 0.8, y: 0.42, ry: PI / 2 }],
    ['coffee_table_round_01', 3.6, -2.4, { len: 1.0, r: 0.55 }], ['hanging_picture_frame_02', 6.1, 7.86, { len: 1.1, y: 4.0, ry: PI }],
    ['hanging_picture_frame_02', 13.9, 7.86, { len: 1.1, y: 4.0, ry: PI }], ['potted_plant_01', 18.7, 6.8, { h: 1.2, r: 0.35 }],
  ],
  wolf: [
    ['nyb_wolf_desk', 10, 0.8, { len: 2.0, r: 0.95 }],
    ['nyb_wolf_cabinet', 0.4, 0.4, { h: 1.9, ry: PI / 2, r: 0.5 }], ['nyb_wolf_cabinet', 19.5, 0.4, { h: 1.9, ry: -PI / 2, r: 0.5 }],
    ['nyb_wolf_cashbox', 18.7, 6.7, { len: 0.55, ry: 0.3, r: 0.4 }], ['nyb_wolf_cashbox', 18.8, 6.6, { len: 0.5, y: 0.34, ry: -0.2 }], ['nyb_wolf_cashbox', 1.3, 6.8, { len: 0.55, ry: 1.2, r: 0.4 }],
    ['nyb_wolf_cashbox', 8.3, 0.9, { len: 0.5, ry: 0.5, r: 0.35 }], ['nyb_wolf_cashbox', 11.7, 0.9, { len: 0.5, ry: -0.4, r: 0.35 }],
    ['potted_plant_01', 1.2, -0.9, { h: 1.3, r: 0.35 }],
  ],
  penguins: [
    ['nyb_penguins_crate', 13.4, 0.6, { len: 1.7, ry: -0.35, r: 0.85, egg: ['A shipping crate', 'penguins_crate', 'Air freight from Antarctica to Park Avenue, postage due. The doorman signed for one penguin. By breakfast he had counted six, and MLow says the crate is still cold.'], snd: 'honk' }],
    ['nyb_penguins_chandelier', 10, -1.0, { h: 1.3, y: 4.65 }], ['nyb_penguins_chandelier', 4.6, 3.6, { h: 1.1, y: 4.85 }],
    ['nyb_penguins_boots', 1.9, 6.6, { len: 0.6, ry: 0.4 }], ['nyb_penguins_bucket', 5.05, -0.1, { h: 0.45, r: 0.25 }],
    ['nyb_aircon', 0.32, 0.4, { len: 1.0, y: 2.8, ry: PI / 2 }], ['sofa_02', 8.4, -5.7, { len: 2.0, r: 0.9 }],
    ['fancy_picture_frame_02', 6.1, 7.86, { h: 1.1, y: 4.1, ry: PI }], ['fancy_picture_frame_02', 13.9, 7.86, { h: 1.1, y: 4.1, ry: PI }],
  ],
  hitch: [
    ['nyb_hitch_bottle', 13.2, -2.8, { h: 1.5, ry: -0.5, r: 0.45, egg: ['A very large bottle', 'hitch_bottle', 'The pharmacy only had the giant size, so he drank it in the car, all of it. MLow keeps one this big in every kitchen in Tribeca, just in case of a first date.'], snd: 'clink' }],
    ['nyb_hitch_stove', 6.2, -6.1, { h: 0.95, r: 0.45 }], ['nyb_hitch_pot', 6.08, -6.0, { h: 0.28, y: 0.95 }],
    ['nyb_hitch_pendant', 8.8, -2.4, { h: 1.4, y: 4.6 }], ['nyb_hitch_pendant', 10, -2.4, { h: 1.4, y: 4.6 }], ['nyb_hitch_pendant', 11.2, -2.4, { h: 1.4, y: 4.6 }],
    ['wine_bottles_01', 8.5, -2.7, { len: 0.55, y: 0.97 }], ['vintage_electric_kettle', 8.4, -6.0, { h: 0.28, y: 0.92 }], ['wooden_cutting_board', 9.6, -6.0, { len: 0.45, y: 0.92 }],
    ['wall_clock', 0.18, 0.6, { len: 0.45, y: 2.5, ry: PI / 2 }],
  ],
  towerheist: [
    ['nyb_th_car', 9.4, -2.6, { len: 4.2, ry: 0.12 }],
    ['nyb_th_sofa', 15.2, -2.2, { len: 2.6, ry: -PI / 2, r: 0.6 }],
    ['side_table_tall_01', 4.2, -4.8, { h: 0.9, r: 0.35 }],
    ['nyb_th_bust', 4.2, -4.8, { h: 0.62, y: 0.9, ry: 0.4, egg: ['A gold bust', 'towerheist_bust', 'His own face in solid gold, in his own hallway, lit like a saint. The building staff counted it twice. MLow says it is the only thing in the flat that was honestly paid for.'], snd: 'clink' }],
    ['brass_vase_01', 7.2, -5.9, { h: 0.9, r: 0.25 }], ['brass_vase_01', 11.8, -5.9, { h: 0.9, r: 0.25 }],
    ['gothic_statue', 17.8, 6.2, { h: 1.7, ry: -2.4, r: 0.7 }],
    ['nyb_th_chandelier', 4.4, -3.0, { h: 1.0, y: 4.9 }], ['nyb_th_chandelier', 15.6, -3.0, { h: 1.0, y: 4.9 }],
    ['nyb_wolf_cashbox', 16.8, -4.6, { len: 0.5, ry: 0.4 }], ['nyb_wolf_cashbox', 16.6, -4.1, { len: 0.45, ry: -0.3 }],
    ['wine_bottles_01', 5.6, 3.4, { len: 0.5, y: 0.39, ry: 0.4 }],
  ],
  nowyousee: [
    ['nyb_nys_chest', 6.4, -5.3, { len: 1.1, y: 0.6, ry: 0.25 }],
    ['nyb_nys_lion', 4.6, -6.3, { h: 0.85, y: 0.6, ry: 0.4 }], ['nyb_nys_lion', 15.4, -6.3, { h: 0.85, y: 0.6, ry: -0.4 }],
    ['brass_candleholders', 13.4, -5.1, { len: 1.0, y: 0.6, ry: -0.2 }],
    ['nyb_nys_mirror', 19.56, -6.4, { h: 1.9, y: 0.8, ry: -PI / 2 }],
    ['Chandelier_03', 6.2, 3.1, { h: 1.0, y: 4.9 }], ['Chandelier_03', 13.8, 3.1, { h: 1.0, y: 4.9 }],
  ],
  beatstreet: [
    ['nyb_hydrant_pink', 17.8, 0.6, { h: 0.8, ry: -0.6, r: 0.25 }], ['nyb_trash_dsny', 2.4, 0.5, { h: 0.95, ry: 0.4, r: 0.4 }],
    ['nyb_chainlink', 4.6, -6.0, { len: 3.6 }], ['old_tyre', 2.2, -5.0, { h: 0.62, ry: 0.4 }], ['old_tyre', 2.6, -5.5, { h: 0.6, ry: 1.2 }],
    ['trashbag', 3.1, 0.9, { h: 0.5, ry: 1.0 }], ['nyb_milkcrate_cyan', 16.6, 1.6, { h: 0.32, ry: 0.3 }], ['nyb_milkcrate_pink', 17.2, 1.1, { h: 0.32, ry: -0.5 }],
    ['nyb_lamp_banner', 1.3, 1.1, { h: 4.0, r: 0.25 }],
  ],
  mitty: [
    ['nyb_mitty_box', 12.2, -5.7, { len: 0.55, ry: 0.2, r: 0.35 }], ['nyb_mitty_box', 12.25, -5.65, { len: 0.5, y: 0.35, ry: -0.3 }], ['nyb_mitty_box', 12.9, -5.2, { len: 0.55, ry: 1.3, r: 0.35 }],
    ['nyb_mitty_box', 7.2, -5.8, { len: 0.55, ry: -0.2, r: 0.35 }],
    ['nyb_mitty_cover', 6.1, 7.85, { h: 1.25, y: 3.6, ry: PI }], ['nyb_mitty_cover', 13.9, 7.85, { h: 1.25, y: 3.6, ry: PI }],
    ['desk_lamp_arm_01', 10.6, -3.25, { h: 0.5, y: 0.79, ry: -0.6 }], ['magnifying_glass_01', 9.5, -2.85, { h: 0.18, y: 0.79, ry: 0.3 }],
    ['side_table_01', 16.8, 0.4, { len: 0.6, r: 0.35 }], ['filmstrip_projector_8mm', 16.8, 0.4, { len: 0.5, y: 0.55, ry: -PI / 2 }],
    ['nyb_wolf_clock', 0.2, 0.4, { len: 0.5, y: 2.6, ry: PI / 2 }],
  ],
  statuewalk: [
    ['nyb_sw_slimetank', 12.0, 1.7, { h: 1.1, ry: -0.5, r: 0.35 }], ['nyb_sw_jerrycan', 12.6, 2.2, { h: 0.5, ry: 0.3 }], ['nyb_sw_jerrycan', 12.3, 1.0, { h: 0.5, ry: 1.9 }],
    ['nyb_sw_generator', 7.9, 1.9, { len: 0.95, ry: 0.4, r: 0.5, egg: ['A generator', 'statuewalk_generator', 'Runs on a song and a crowd. At midnight on Fifth Avenue it runs on two million people counting down at once, and MLow says that is more than enough to walk a statue.'], snd: 'chords' }],
    ['nyb_barrier', 7.4, -3.3, { len: 1.6, ry: PI / 2, r: 0.3 }], ['nyb_barrier', 12.6, -3.3, { len: 1.6, ry: PI / 2, r: 0.3 }],
    ['nyb_barrier', 7.4, -0.9, { len: 1.6, ry: PI / 2, r: 0.3 }], ['nyb_barrier', 12.6, -0.9, { len: 1.6, ry: PI / 2, r: 0.3 }],
    ['nyb_trash_dsny', 17.8, 1.0, { h: 0.95, ry: -0.4, r: 0.4 }],
  ],
  kong: [
    ['nyb_kong_crate', 15.6, -5.2, { len: 3.0, ry: -PI / 2, egg: ['A shipping crate', 'kong_crate', 'Shipped from an island nobody could find, by a man who only wanted a picture. Chrome steel chains. MLow counted every link, and one is missing.'], snd: 'boom' }],
    ['wooden_crate_01', 4.6, -0.6, { len: 0.8, ry: 0.3, r: 0.4 }], ['nyb_kong_megaphone', 4.55, -0.6, { len: 0.45, y: 0.35, ry: 2.4 }],
    ['nyb_kong_postcards', 0.5, 0.5, { h: 1.6, ry: PI, r: 0.5 }], ['postcard_set_01', 0.9, 0.5, { len: 0.55, y: 0.95, ry: PI / 2 }],
    ['nyb_kong_lamp', 0.3, 6.6, { h: 1.3, y: 1.7, ry: PI / 2 }], ['nyb_kong_lamp', 19.7, 6.6, { h: 1.3, y: 1.7, ry: -PI / 2 }], ['nyb_kong_lamp', 19.7, 0.8, { h: 1.3, y: 1.7, ry: -PI / 2 }],
    ['metal_trash_can', 2.4, 6.7, { h: 0.85, r: 0.35 }], ['vintage_binocular', 6.4, -7.95, { len: 0.2, y: 1.05, ry: 0.4 }],
  ],
};

export const ROOM = {
  // ---------- The Out-of-Towners, 1970: the phone that never gets through ----------
  outoftowners(c, r, g, X, K) {
    const ph = phonePost(c, K, r, g, X, 'nyb_oot_payphone', 7.0, -0.8, 0.25, { egg: ['A payphone', 'oot_dime', 'Dime in, no dial tone. Dime in, the line is dead. Dime in, the hotel says try again in the morning. MLow says keep your last dime for the cab, and count it twice.'], snd: 'turnstile' });
    // the hood over it, the way 1970 did it
    const hood = c.slab(0.62, 0.08, 0.55, K.std(0x2a4a8a, { metalness: 0.5 }), 7.0, 2.0, -0.8); hood.rotation.y = 0.25; g.add(hood);
    const hs = c.sign('PHONE', { w: 0.6, h: 0.16, bg: '#1d4ed8', fg: '#ffffff', font: c.MONO, weight: 800 }); hs.position.set(7.0 + Math.sin(0.25) * 0.28, 2.13, -0.8 + Math.cos(0.25) * 0.28); hs.rotation.y = 0.25; g.add(hs);
    // the hotel awning on the east wall, over the desk
    const aw = new c.THREE.Mesh(new c.THREE.BoxGeometry(1.1, 0.08, 2.8), new c.THREE.MeshStandardMaterial({ map: c.canvasTex(64, 256, (q, w, h) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#f4ead2' : '#7a1020'; q.fillRect(0, i * h / 8, w, h / 8); } }), roughness: 0.8 }));
    aw.position.set(19.1, 3.5, -2.6); aw.rotation.z = 0.25; g.add(aw);
    wallSign(c, g, 'N3W YORKERS HOTEL', 18.5, 3.2, -2.6, -PI / 2, { w: 2.6, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' });
    // a man under an umbrella, waiting for the same cab you are
    const e = K.extra(g, 13.6, -0.6, { col: 0x2a2a34, ry: -0.9 }); c.post(X(13.6), -0.6, 0.4);
    const um = new c.THREE.Mesh(new c.THREE.ConeGeometry(0.48, 0.22, 12, 1, true), K.std(0x111111, { roughness: 0.3, side: c.THREE.DoubleSide })); um.position.set(0, 2.12, 0); e.add(um); e.add(c.slab(0.02, 0.7, 0.02, K.std(0x222222), 0.08, 1.85, 0));
    // the strike's own headline, pasted on the west wall
    poster(c, K, g, 0.9, 1.2, (q, w, h) => { q.fillStyle = '#f0ead8'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.11}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE N3W', w / 2, h * 0.14); q.fillText('DAILY', w / 2, h * 0.26); q.font = `900 ${h * 0.12}px ${c.FONT}`; q.fillText('STRIKE', w / 2, h * 0.45); q.fillText('DAY 9', w / 2, h * 0.58); q.font = `600 ${h * 0.05}px ${c.MONO}`; q.fillText('GARBAGE TO THE', w / 2, h * 0.72); q.fillText('SECOND FLOOR', w / 2, h * 0.78); K.eyeFlower(q, w / 2, h * 0.9, h * 0.07); }, 0.14, 1.6, 6.6, PI / 2);
  },

  // ---------- The Naked City, 1948: the newsstand where the eight million stories are sold for two cents ----------
  nakedcity(c, r, g, X, K) {
    const { THREE } = c, green = K.std(0x2f5a3a, { roughness: 0.7 }), x0 = 9.1, z0 = -2.6;
    // the hero: the stand, its roof and its posts, the papers on the counter
    K.prop(r, g, X, 'nyb_naked_newsstand', x0, z0, { h: 1.6, ry: PI / 2 }); c.post(X(x0), z0, 0.7);
    [-0.62, 0.62].forEach((dx) => g.add(c.slab(0.08, 2.4, 0.08, green, x0 + dx, 1.2, z0 + 0.5)));
    const roof = c.slab(1.6, 0.08, 1.3, green, x0, 2.42, z0 + 0.1); roof.rotation.x = 0.12; g.add(roof);
    wallSign(c, g, 'THE N3W DAILY', x0, 2.7, z0 + 0.72, 0, { w: 1.6, h: 0.32, bg: '#0b1020', fg: '#f4ead2', font: c.SERIF, weight: 900, border: '#f5c542' });
    const head = (t1, t2) => c.canvasTex(256, 320, (q, w, h) => { q.fillStyle = '#ece6d6'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 30px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE N3W DAILY', w / 2, 40); q.fillRect(16, 52, w - 32, 4); q.font = `900 46px ${c.FONT}`; q.fillText(t1, w / 2, 120); q.fillText(t2, w / 2, 172); q.fillStyle = '#555'; for (let i = 0; i < 9; i++) q.fillRect(20 + (i % 3) * 76, 200 + (i / 3 | 0) * 34, 66, 22); });
    [['8,000,000', 'STORIES'], ['ONE OF', 'THEM'], ['CITY', 'COUNTED'], ['MLOW', 'EXTRA']].forEach(([a, b], k) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ map: head(a, b), roughness: 0.9 })); p.position.set(x0 - 0.54 + k * 0.36, 1.25, z0 + 0.6); p.rotation.x = -0.25; g.add(p); });
    const vendor = K.extra(g, x0 + 1.05, z0 + 0.1, { seated: true, col: 0x3a3a3a, ry: -0.3 }); g.add(c.slab(0.4, 0.45, 0.4, K.std(0x5a4a38), x0 + 1.05, 0.22, z0 + 0.1));
    // the police call box: pull it and the precinct takes down one more story
    K.prop(r, g, X, 'nyb_naked_callbox', 5.7, 0.4, { h: 1.35, ry: 0.15, r: 0.35, snd: 'bell', egg: ['A police call box', 'nakedcity_callbox', 'Box 317 rings the precinct. The sergeant says write it down, that is one more, seven million nine hundred ninety nine thousand to go. MLow has the carbon copy.'] });
    // lamps on the trusses, pigeons on the beams
    [[3.25, -4.6, PI / 2], [3.25, 0.4, PI / 2], [16.75, -4.6, -PI / 2], [16.75, 0.4, -PI / 2]].forEach(([x, z, ry]) => K.prop(r, g, X, 'nyb_naked_lamp', x, z, { h: 0.95, y: 2.0, ry }));
    [[3.0, -6.2], [3.0, -1.4], [17.0, -3.2], [17.0, 0.8], [17.0, 7.0]].forEach(([x, z], k) => { const p = c.glb('pigeon', { len: 0.32, x, y: 3.3, z, ry: k * 1.7, parent: g, shadow: false }); });
    // the wanted poster and the paper's own bill on the brick
    const bill = (t, sub) => (q, w, h) => { q.fillStyle = '#e8e2d0'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.textAlign = 'center'; q.font = `900 ${h * 0.12}px ${c.SERIF}`; q.fillText(t, w / 2, h * 0.16); K.eyeFlower(q, w / 2, h * 0.48, h * 0.22); q.font = `700 ${h * 0.06}px ${c.MONO}`; sub.forEach((s, i) => q.fillText(s, w / 2, h * (0.8 + i * 0.08))); };
    poster(c, K, g, 0.8, 1.1, bill('WANTED', ['FOR A STORY', 'ASK ANY COP']), 0.14, 1.7, 6.6, PI / 2);
    poster(c, K, g, 0.8, 1.1, bill('READ IT', ['THE N3W DAILY', 'TWO CENTS']), 19.6, 1.7, 6.6, -PI / 2);
    poster(c, K, g, 0.8, 1.1, bill('MISSING', ['ONE STORY', 'REWARD, MLOW']), 19.6, 1.7, 0.4, -PI / 2);
  },

  // ---------- Planet of the Apes, 1968: a dig on the beach at the end of the world ----------
  apes(c, r, g, X, K) {
    const { THREE } = c, wood = K.std(0x8a7a60, { roughness: 1 }), rag = K.std(0x8a7058, { roughness: 1, side: THREE.DoubleSide });
    // the excavation: stakes and string, a crate, a spade, a bucket, and what they found
    const dig = [2.4, -1.4, 5.2, 1.0];   // x1, z1, x2, z2
    [[dig[0], dig[1]], [dig[2], dig[1]], [dig[0], dig[3]], [dig[2], dig[3]]].forEach(([x, z]) => g.add(c.slab(0.05, 0.5, 0.05, wood, x, 0.25, z)));
    const str = K.basic(0xf4ead2); [[dig[0], dig[1], dig[2], dig[1]], [dig[0], dig[3], dig[2], dig[3]], [dig[0], dig[1], dig[0], dig[3]], [dig[2], dig[1], dig[2], dig[3]]].forEach(([a, b, cc, d]) => { const L = Math.hypot(cc - a, d - b), s = c.slab(a === cc ? 0.01 : L, 0.01, a === cc ? L : 0.01, str, (a + cc) / 2, 0.45, (b + d) / 2); g.add(s); });
    const pit = K.decal(2.6, 2.0, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(70,50,30,.75)'); gr.addColorStop(1, 'rgba(120,96,70,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); pit.rotation.x = -PI / 2; pit.position.set(3.8, 0.012, -0.2); g.add(pit);
    K.prop(r, g, X, 'nyb_apes_crate', 3.0, -0.8, { len: 1.4, ry: 0.2, r: 0.6 });
    const spade = K.prop(r, g, X, 'rusted_spade_01', 4.8, 0.5, { h: 1.1, ry: 0.5 }); spade.rotation.z = 0.25;
    K.prop(r, g, X, 'wooden_bucket_01', 4.6, -1.0, { h: 0.42, r: 0.25 });
    K.prop(r, g, X, 'round_spectacles', 2.9, -0.75, { len: 0.16, y: 0.53, ry: 0.4, snd: 'clink', egg: ['A pair of glasses', 'apes_glasses', 'Dug out of the sand by the Department of the Counted: a pair of round glasses and a form with a name on it. Proof that a human lived here, and was counted. MLow signed the form.'] });
    K.prop(r, g, X, 'magnifying_glass_01', 3.4, -0.6, { h: 0.2, y: 0.53, ry: 1.2 });
    // the sea gave these back
    const buoy = K.prop(r, g, X, 'nyb_apes_buoy', 17.2, -3.4, { h: 2.5, ry: 0.5, r: 0.7 }); buoy.rotation.z = 0.32;
    const lb = K.prop(r, g, X, 'nyb_apes_lifebuoy', 9.4, 1.0, { len: 0.85, y: 0.05, ry: 0.3 }); lb.rotation.x = -1.25;
    // the scarecrows that mark the zone, eye flowers for heads
    const crow = (x, z, ry) => { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); o.add(c.slab(0.08, 2.4, 0.08, wood, 0, 1.2, 0)); o.add(c.slab(1.5, 0.07, 0.07, wood, 0, 1.75, 0)); const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), rag); sh.position.set(0, 1.55, 0.05); o.add(sh); const hd = K.decal(0.7, 0.7, (q, w) => K.eyeFlower(q, w / 2, w / 2, w / 2 * 0.95, '#e8dcc0', '#8a6a40')); hd.position.set(0, 2.25, 0.06); o.add(hd); c.post(X(x), z, 0.3); return o; };
    crow(1.4, -3.4, 0.5); crow(16.8, 0.8, -0.6);
    // the city's last subway entrance, up to its globes in sand
    const sx = 18.4, sz = -1.8, iron = K.std(0x2a3a30, { metalness: 0.6, roughness: 0.6 });
    const sgn = new THREE.Group(); sgn.position.set(sx, -0.5, sz); sgn.rotation.set(0.12, -0.5, 0.18); g.add(sgn);
    sgn.add(c.slab(0.1, 2.4, 0.1, iron, 0, 1.2, 0)); const glob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0x3a8a4a, emissive: 0x1a5a2a, emissiveIntensity: 0.6, roughness: 0.3 })); glob.position.y = 2.55; sgn.add(glob);
    const plate = c.sign('N3W YORK\nNEXT STOP 3978', { w: 1.1, h: 0.42, bg: '#1a1a1a', fg: '#f4ead2', font: c.FONT, weight: 800 }); plate.position.set(0, 1.9, 0.07); sgn.add(plate); c.post(X(sx), sz, 0.3);
  },

  // ---------- Enchanted, 2007: the big apple, the mirror, the wheel ----------
  enchanted(c, r, g, X, K) {
    // the hero: one bite only, on a pedestal in the middle of the flat
    K.prop(r, g, X, 'side_table_tall_01', 10, -0.6, { h: 0.95, r: 0.45 });
    const ap = K.prop(r, g, X, 'nyb_enchanted_apple', 10, -0.6, { h: 0.7, y: 0.95, ry: 0.2 });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ap.rotation.y = 0.2 + t * 0.25; });
    wallSign(c, g, 'THE BIG APPLE, ONE BITE ONLY', 10, 0.55, -0.32, 0, { w: 0.9, h: 0.12, bg: '#f4ead2', fg: '#7a1020', font: c.SERIF, weight: 900 });
    // the magic mirror on the east wall
    K.prop(r, g, X, 'nyb_enchanted_mirror', 19.55, -6.3, { h: 1.7, y: 0.8, ry: -PI / 2, snd: 'ding', egg: ['A mirror', 'enchanted_mirror', 'Mirror, mirror on the wall, who is the most counted of them all. It says you. MLow had it made to say that to everybody on the Upper West Side.'] });
    // little birds on the bookshelf, waiting for the song
    [[0.5, 0.0], [0.5, 0.8]].forEach(([x, z], k) => c.glb('pigeon', { len: 0.28, x, y: 2.12, z, ry: PI / 2 + k, parent: g, shadow: false }));
  },

  // ---------- The Wolf of Wall Street, 2013: screens on every desk, the boss's gold desk ----------
  wolf(c, r, g, X, K) {
    // the CRTs, one to a desk corner, all showing the same ticker
    [[5.6, -5.4], [8.6, -5.4], [11.6, -5.4], [14.6, -5.4], [2.6, -2.8], [5.6, -2.8], [14.6, -2.8], [17.6, -2.8], [5.6, -0.2], [14.6, -0.2], [5.6, 2.4], [14.6, 2.4]].forEach(([x, z]) => K.prop(r, g, X, 'nyb_wolf_crt', x + 0.5, z - 0.12, { len: 0.36, y: 0.76, ry: 0.15 }));
    K.prop(r, g, X, 'nyb_wolf_megaphone', 9.3, 0.7, { len: 0.42, y: 0.79, ry: -2.2, snd: 'thump', egg: ['A megaphone', 'wolf_megaphone', 'He shouts that he is not leaving and the whole floor shouts back. Not one phone has been hung up since. MLow says every call on this floor is somebody getting counted.'] });
    // three clocks, three cities
    [[6.1, 'N3W YORK'], [10, 'LONG ISLAND'], [13.9, 'A BANK IN GENEVA']].forEach(([x, t]) => { K.prop(r, g, X, 'nyb_wolf_clock', x, 7.84, { len: 0.6, y: 3.7, ry: PI }); wallSign(c, g, t, x, 3.42, 7.86, PI, { w: 1.3, h: 0.16, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); });
    // the strip lights
    [[4, -4.2], [10, -4.2], [16, -4.2], [4, -0.6], [10, -0.6], [16, -0.6], [4, 3.0], [16, 3.0]].forEach(([x, z]) => K.prop(r, g, X, 'mounted_fluorescent_lights', x, z, { len: 1.4, y: 5.94 }));
    wallSign(c, g, 'N3W OAKMONT', 10, 5.0, -7.85, 0, { w: 4.0, h: 0.6, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 18 });
  },

  // ---------- Mr. Popper's Penguins, 2011: a snowman with an eye for a head ----------
  penguins(c, r, g, X, K) {
    const { THREE } = c, snow = K.std(0xffffff, { roughness: 0.95 }), sx = 16.8, sz = 1.2;
    [[0.5, 0.48], [0.36, 1.18], [0.26, 1.7]].forEach(([R, y]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 14), snow); s.position.set(sx, y, sz); g.add(s); });
    const hd = K.decal(0.5, 0.5, (q, w) => K.eyeFlower(q, w / 2, w / 2, w / 2 * 0.95, '#ffffff', '#22d3ee')); hd.position.set(sx, 1.72, sz + 0.27); hd.rotation.y = 0; g.add(hd);
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 20), K.std(0xff4fa3)); sc.rotation.x = PI / 2; sc.position.set(sx, 1.46, sz); g.add(sc);
    [-1, 1].forEach((s) => { const a = c.slab(0.6, 0.03, 0.03, K.std(0x4a3020), sx + s * 0.55, 1.3, sz); a.rotation.z = s * 0.5; g.add(a); });
    c.post(X(sx), sz, 0.55);
    wallSign(c, g, 'THERMOSTAT  MLOW  MAX COLD', 0.2, 2.15, 0.4, PI / 2, { w: 1.1, h: 0.12, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 });
  },

  // ---------- Hitch, 2005: the back counter, the dance steps ----------
  hitch(c, r, g, X, K) {
    const top = K.std(0xe8e4dc, { roughness: 0.2 }), wood = K.std(0x3a2a1a, { roughness: 0.4 });
    g.add(c.slab(4.6, 0.9, 0.65, wood, 9.0, 0.45, -6.1)); g.add(c.slab(4.7, 0.04, 0.7, top, 9.0, 0.91, -6.1)); c.wall(X(6.7), -5.75, X(11.3), -5.75);
    // the dance lesson, chalked on the floor: step, together, step, and do not point
    const steps = K.decal(2.2, 2.2, (q, w, h) => { q.fillStyle = 'rgba(244,234,210,.85)'; const f = (x, y, a, n) => { q.save(); q.translate(x, y); q.rotate(a); q.beginPath(); q.ellipse(0, 0, 14, 26, 0, 0, 7); q.fill(); q.restore(); q.font = `700 22px ${c.MONO}`; q.fillText(n, x + 22, y + 6); }; f(80, 380, 0, '1'); f(140, 380, 0, '2'); f(110, 280, 0.2, '3'); f(200, 240, 0.3, '4'); f(260, 320, -0.2, '5'); f(330, 260, 0, '6'); q.font = `900 30px ${c.SERIF}`; q.fillText('STAY IN YOUR SPOT', 40, 60); q.font = `700 22px ${c.MONO}`; q.fillText('LESSON 1, BY MLOW', 40, 96); }, 512);
    steps.rotation.x = -PI / 2; steps.position.set(4.2, 0.012, -0.6); g.add(steps);
    wallSign(c, g, 'N3W FISH MARKET, DELIVERED', 10, 4.4, -7.85, 0, { w: 3.6, h: 0.4, bg: '#0b1020', fg: '#f4ead2', font: c.SERIF, weight: 900, border: '#f5c542' });
  },

  // ---------- Kate & Leopold, 2001: the watch on the line, and props that keep to their century ----------
  kateleopold(c, r, g, X, K) {
    const { THREE } = c, then = new THREE.Group(), now = new THREE.Group(); g.add(then); g.add(now);
    // the hero sits on the line itself, in both centuries
    const stone = K.std(0x8a8478, { roughness: 0.9 }); g.add(c.slab(0.7, 0.5, 0.7, stone, 10.9, 0.25, 0)); c.post(X(10.9), 0, 0.5);
    const w = K.prop(r, g, X, 'nyb_kl_watch', 10.9, 0, { h: 1.5, y: 0.5, snd: 'tick', egg: ['A pocket watch', 'kl_watch', 'His watch keeps 1876 and hers keeps 2001. MLow set the big one to both, so it is right twice a century and wrong in between, like every clock on this bridge.'] });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; w.rotation.y = Math.sin(t * 0.6) * 0.5; then.visible = P.z < 0; now.visible = P.z >= 0; });
    // 1876: the bridge is being built. Barrels of spikes, wire rope, lanterns, a ladder, a sledge.
    const T = (name, x, z, o) => K.prop(r, then, X, name, x, z, o);
    T('nyb_kl_barrel', 4.6, -1.3, { h: 0.95, ry: 0.3, r: 0.4 }); T('nyb_kl_barrel', 5.3, -1.9, { h: 0.95, ry: 1.4, r: 0.4 }); T('nyb_kl_barrel', 15.2, -5.4, { h: 0.95, ry: 2.2, r: 0.4 });
    T('nyb_kl_crate', 14.4, -1.6, { len: 1.0, ry: -0.3, r: 0.55 }); T('nyb_kl_crate', 14.45, -1.62, { len: 0.9, y: 0.42, ry: 0.1 });
    T('nyb_kl_lantern', 14.5, -1.5, { h: 0.45, y: 0.82 }); T('nyb_kl_lantern', 4.6, -1.3, { h: 0.45, y: 0.95 });
    const lad = T('wooden_ladder', 8.0, -5.5, { h: 2.6, ry: 0 }); lad.rotation.x = -0.25;
    T('sledgehammer_01', 12.4, -5.6, { h: 0.95, ry: 0.4 }); T('wooden_bucket_01', 11.6, -5.4, { h: 0.42 }); T('wicker_basket_01', 6.6, -1.0, { len: 0.5, ry: 0.6 });
    // 1876 seen from the south half too (no colliders: cross the line and they are gone)
    T('nyb_kl_barrel', 18.2, 6.4, { h: 0.95, ry: 0.8 }); T('nyb_kl_crate', 1.8, 6.6, { len: 1.0, ry: 0.4 });
    // 2001: a promenade. Benches, a coffee cart, a bin, a lamp.
    const N = (name, x, z, o) => K.prop(r, now, X, name, x, z, o);
    N('nyb_kl_bench', 4.6, 1.3, { len: 1.5, ry: PI, r: 0.5 }); N('nyb_kl_bench', 14.2, 1.3, { len: 1.5, ry: PI, r: 0.5 });
    N('nyb_coffeecart', 18.3, 0.9, { len: 1.4, ry: -PI / 2, r: 0.7 }); N('nyb_trash_dsny', 1.8, 0.9, { h: 0.95, r: 0.4 });
    N('nyb_lamp_banner', 1.4, 6.6, { h: 4.0, r: 0.25 }); N('nyb_lamp_banner', 18.6, 6.6, { h: 4.0, r: 0.25 });
    N('nyb_kl_bench', 7.8, -5.4, { len: 1.5, ry: 0 }); N('nyb_coffeecart', 14.0, -5.2, { len: 1.4, ry: 0.3 });
    // and the plaques that say which year you are standing in
    const yr = (t, z, ry, grp) => { const s = c.sign(t, { w: 0.66, h: 0.24, bg: '#0b1020', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' }); s.position.set(10.9, 0.26, z); s.rotation.y = ry; grp.add(s); };
    yr('1876', -0.37, PI, then); yr('2001', 0.37, 0, now);
  },

  // ---------- Tower Heist, 2011: the car under its cover, the money in the car ----------
  towerheist(c, r, g, X, K) {
    c.post(X(9.6), -1.2, 0.9); c.post(X(9.3), -2.6, 0.9); c.post(X(9.1), -4.0, 0.9);
    wallSign(c, g, 'DO NOT TOUCH THE CAR', 9.6, 1.0, -0.2, 0.12, { w: 1.4, h: 0.2, bg: '#f4ead2', fg: '#7a1020', font: c.MONO, weight: 800 });
    // brass stanchions and a red rope round it, the way he showed it off
    const brass = K.std(0xd6a640, { metalness: 1, roughness: 0.25 }), red = K.std(0x8a0f1e, { roughness: 0.85 });
    const pts = [[8.0, -0.3], [11.2, -0.1], [11.2, -5.0], [8.0, -5.2]];
    pts.forEach(([x, z]) => { const p = new c.THREE.Mesh(new c.THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), brass); p.position.set(x, 0.48, z); g.add(p); });
    pts.forEach(([x, z], i) => { const [x2, z2] = pts[(i + 1) % 4], cv = new c.THREE.QuadraticBezierCurve3(new c.THREE.Vector3(x, 0.9, z), new c.THREE.Vector3((x + x2) / 2, 0.66, (z + z2) / 2), new c.THREE.Vector3(x2, 0.9, z2)); g.add(new c.THREE.Mesh(new c.THREE.TubeGeometry(cv, 12, 0.022, 6), red)); });
  },

  // ---------- Now You See Me, 2013: the hypnotist's watch over the stage, curtains, follow spots ----------
  nowyousee(c, r, g, X, K) {
    const { THREE } = c;
    // the watch, swinging, on a chain from the flies
    const pend = new THREE.Group(); pend.position.set(10, 5.95, -1.0); g.add(pend);
    const chain = c.slab(0.015, 1.0, 0.015, K.std(0xd6a640, { metalness: 1, roughness: 0.3 }), 0, -0.5, 0); pend.add(chain);
    const wt = c.glb('nyb_nys_watch', { h: 0.9, y: -1.95, parent: pend, shadow: false });
    let held = 0;
    c.clickable(wt, () => { c.sound.chords(4); c.flash(0.25); c.egg('nowyousee_hypno', 'Look at the watch. You are getting very sleepy. When you wake up you will remember being counted, and nothing else. MLow will remember the rest.'); held = 3; }, 'A swinging watch');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; held = Math.max(0, held - dt); pend.rotation.z = Math.sin(t * 1.6) * (0.28 + held * 0.1); });
    // the curtains
    const vel = new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 64, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? '#5a0a1a' : '#a8102e'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }), roughness: 0.9, side: THREE.DoubleSide });
    [[3.4, 0.25], [16.6, -0.25]].forEach(([x, ry]) => { const cu = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 5.4), vel); cu.position.set(x, 3.1, -6.3); cu.rotation.y = ry; g.add(cu); });
    const val = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.3), vel); val.position.set(10, 5.82, -6.6); g.add(val);
    g.add(c.slab(14, 0.05, 0.05, K.std(0xd6a640, { metalness: 1, roughness: 0.3 }), 10, 5.66, -6.58));
    // two follow spots at the back of the house, on stands, aimed at the stage
    const steel = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.4 });
    [[1.0, 6.3], [19.0, 6.3]].forEach(([x, z]) => { g.add(c.slab(0.06, 1.5, 0.06, steel, x, 0.75, z)); K.prop(r, g, X, 'nyb_nys_spot', x, z, { len: 0.55, y: 1.5, ry: face(x, z, 10, -5.4) }); c.post(X(x), z, 0.35);
      const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,240,200,.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); beam.scale.set(0.9, 0.9, 1); beam.position.set(x + (10 - x) * 0.03, 1.72, z - 0.25); g.add(beam); });
    wallSign(c, g, 'THE FOUR HORSEMEN, ONE NIGHT, BY MLOW', 10, 4.55, 7.85, PI, { w: 6.0, h: 0.42, bg: '#0a0410', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' });
  },

  // ---------- Beat Street, 1984: a record shop front, a fire in a barrel, a sound system on crates ----------
  beatstreet(c, r, g, X, K, mats) {
    const { THREE } = c;
    // the hero: a shuttered shop front, sprayed, with the shop's sign over it
    const fx = 15.9, fz = -5.7, fry = -0.32;
    const front = new THREE.Group(); front.position.set(fx, 0, fz); front.rotation.y = fry; g.add(front);
    front.add(c.slab(3.6, 3.3, 0.3, mats.wall, 0, 1.65, -0.35));
    K.prop(r, front, X, 'nyb_bs_shutter', 0, -0.12, { len: 3.1 });
    const shop = c.sign('MLOW RECORDS', { w: 3.2, h: 0.5, bg: '#111', fg: '#ff4fa3', font: c.FONT, weight: 900, glow: 14, border: '#22d3ee' }); shop.position.set(0, 2.95, -0.18); front.add(shop);
    [-1.4, 0, 1.4].forEach((dx) => c.post(X(fx + Math.cos(fry) * dx), fz - Math.sin(fry) * dx - 0.2, 0.45));
    // the fire in the barrel
    K.prop(r, g, X, 'nyb_bs_barrel', 3.4, -3.4, { h: 0.86, r: 0.42, snd: 'crack', egg: ['A burning barrel', 'beatstreet_barrel', 'A fire in a barrel in July. Nobody is cold. It is just where the crew stands to plan the next piece, and MLow counts them by the light.'] });
    const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,140,40,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fire.position.set(3.4, 1.05, -3.4); g.add(fire);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const k = 0.9 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.08; fire.scale.set(0.9 * k, 1.1 * k, 1); });
    K.steam(g, 3.4, 1.2, -3.4);
    // the sound system: milk crates and a gold box
    K.prop(r, g, X, 'nyb_milkcrate_pink', 5.5, 0.6, { h: 0.32, ry: 0.2, r: 0.35 }); K.prop(r, g, X, 'nyb_milkcrate_cyan', 5.5, 0.6, { h: 0.32, y: 0.32, ry: -0.1 });
    K.prop(r, g, X, 'nyb_bs_boombox', 5.5, 0.6, { len: 0.75, y: 0.64, ry: 0.5 });
    // the top of the south wall is a piece, end to end
    poster(c, K, g, 15, 0.95, (q, w, h) => { const cols = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ff7a1a']; q.textBaseline = 'middle'; q.font = `900 ${h * 0.78}px ${c.FONT}`; let x = 20; ['N3W', 'YORKERS', 'BRONX', 'MLOW', 'COUNTED', '1984'].forEach((s, i) => { q.lineWidth = 14; q.strokeStyle = '#111'; q.strokeText(s, x, h * 0.55); q.fillStyle = cols[i % 5]; q.fillText(s, x, h * 0.55); x += q.measureText(s).width + 40; }); }, 10, 3.5, 7.86, PI, 160);
  },

  // ---------- The Secret Life of Walter Mitty, 2013: the camera on a plinth, the archive aisles ----------
  mitty(c, r, g, X, K) {
    const white = K.std(0xe8eaec, { roughness: 0.5 });
    g.add(c.slab(0.6, 1.05, 0.6, white, 6.2, 0.525, 0.6)); c.post(X(6.2), 0.6, 0.45);
    K.prop(r, g, X, 'nyb_mitty_camera', 6.2, 0.6, { len: 0.95, y: 1.05, ry: 0.5, snd: 'click', egg: ['A camera', 'mitty_camera', 'The photographer\'s camera. He saw a snow leopard through it and never took the picture. MLow says some moments you do not shoot, you just count.'] });
    wallSign(c, g, 'NEGATIVE 25 WAS INSIDE', 6.2, 0.7, 0.915, 0, { w: 0.55, h: 0.1, bg: '#0b1020', fg: '#f4ead2', font: c.MONO, weight: 700 });
    // two aisles of archive shelving
    [[4.6, -4.4, PI / 2], [15.4, -4.4, -PI / 2]].forEach(([x, z, ry]) => { K.prop(r, g, X, 'nyb_mitty_shelves', x, z, { len: 2.35, ry }); c.wall(X(x), z - 1.15, X(x), z + 1.15);
      [[-0.7, 0.05], [0.2, 0.05], [-0.3, 0.84], [0.6, 0.84], [-0.6, 1.62]].forEach(([dz, y], k) => K.prop(r, g, X, 'nyb_mitty_box', x + (ry > 0 ? 0.05 : -0.05), z + dz, { len: 0.42, y: y + 0.02, ry: k * 0.3 })); });
    [[4, -4.4], [10, -4.4], [16, -4.4], [4, -0.4], [10, -0.4], [16, -0.4], [7, 3.4], [13, 3.4]].forEach(([x, z]) => K.prop(r, g, X, 'mounted_fluorescent_lights', x, z, { len: 1.4, y: 5.94 }));
  },

  // ---------- Ghostbusters II, 1989: the slime rig, the barricades, the new year ----------
  statuewalk(c, r, g, X, K) {
    const { THREE } = c;
    // a hose from the tank to the avenue
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(12.0, 0.9, 1.7), new THREE.Vector3(11.6, 0.1, 1.2), new THREE.Vector3(11.0, 0.05, 0.2), new THREE.Vector3(10.6, 0.05, -0.6)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.04, 8), K.std(0xff4fa3, { emissive: 0x80204a, roughness: 0.3 })));
    // a payphone on Fifth
    phonePost(c, K, r, g, X, 'nyb_payphone', 2.2, 0.9, PI / 2);
    // happy new year across the top of the wall, and a string of bulbs
    wallSign(c, g, 'HAPPY N3W YEAR 1990', 10, 3.45, 7.86, PI, { w: 7.0, h: 0.6, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 22 });
    K.bulbs(g, 1.2, 18.8, 3.92, 7.8, 34, 0xffd8f0);
    // confetti in the air at the end of the walk
    const NC = c.MOBILE ? 120 : 260, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.04), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), NC), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), CS = [], col = new THREE.Color();
    const pal = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff];
    for (let i = 0; i < NC; i++) { CS.push({ x: 4 + Math.random() * 12, y: Math.random() * 6, z: -6 + Math.random() * 12, r: Math.random() * 6 }); conf.setColorAt(i, col.setHex(pal[i % 4])); }
    conf.frustumCulled = false; g.add(conf);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { conf.visible = false; return; } conf.visible = true; CS.forEach((b, i) => { b.y -= dt * (0.5 + (i % 4) * 0.15); b.r += dt * 4; if (b.y < 0.02) b.y = 6; e4.set(b.r, b.r * 0.7, 0); q4.setFromEuler(e4); m4.compose(v4.set(b.x + Math.sin(t + i) * 0.2, b.y, b.z), q4, one); conf.setMatrixAt(i, m4); }); conf.instanceMatrix.needsUpdate = true; });
  },

  // ---------- King Kong, 1933: the finale. The crate he came in, the chains, the film crew, the deck ----------
  kong(c, r, g, X, K) {
    const { THREE } = c;
    c.post(X(14.4), -5.2, 0.7); c.post(X(15.6), -5.2, 0.7); c.post(X(16.8), -5.2, 0.7);
    // the chains: out of the crate, across the deck, up and over the east wall to him
    const link = new THREE.TorusGeometry(0.11, 0.035, 6, 12), steel = K.std(0xb8b8c0, { metalness: 1, roughness: 0.25 });
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(16.9, 0.9, -5.2), new THREE.Vector3(17.8, 0.05, -5.6), new THREE.Vector3(18.8, 0.05, -6.2), new THREE.Vector3(19.6, 1.6, -6.4), new THREE.Vector3(19.86, 4.06, -6.5), new THREE.Vector3(20.6, 3.6, -6.5)]);
    const NL = 64, links = new THREE.InstancedMesh(link, steel, NL), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 0, 1), tg = new THREE.Vector3(), p4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), tw = new THREE.Quaternion();
    for (let i = 0; i < NL; i++) { const u = i / (NL - 1); path.getPoint(u, p4); path.getTangent(u, tg); q4.setFromUnitVectors(up, tg); tw.setFromAxisAngle(tg, i % 2 ? PI / 2 : 0); q4.premultiply(tw); m4.compose(p4, q4, one); links.setMatrixAt(i, m4); }
    g.add(links);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 10, 24), steel); cuff.position.set(17.4, 0.09, -4.0); cuff.rotation.x = PI / 2; g.add(cuff);
    const broke = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 6, 12, PI * 1.3), steel); broke.position.set(17.8, 0.04, -3.6); broke.rotation.x = PI / 2; g.add(broke);
    // the film crew: a cine camera on a wooden tripod, pointed at the edge
    const wood = K.std(0x5a3a1a, { roughness: 0.7 }), cam = new THREE.Group(); cam.position.set(5.6, 0, -2.0); cam.rotation.y = face(5.6, -2.0, 10, -7); g.add(cam);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.04, 1.45, 0.04, wood, Math.cos(a) * 0.28, 0.68, Math.sin(a) * 0.28); l.rotation.set(Math.sin(a) * 0.36, 0, -Math.cos(a) * 0.36); cam.add(l); }
    cam.add(c.slab(0.3, 0.05, 0.3, wood, 0, 1.38, 0));
    c.glb('ph_vintage_video_camera', { h: 0.42, y: 1.4, parent: cam, shadow: false }); c.post(X(5.6), -2.0, 0.45);
    // the art deco deck lamps and two searchlights sweeping the sky
    const lamps = [];
    [[2.9, -6.5], [17.2, -6.9]].forEach(([x, z], k) => { g.add(c.slab(0.5, 0.7, 0.5, K.std(0x6a6a6a, { metalness: 0.4 }), x, 0.35, z)); const sl = K.prop(r, g, X, 'nyb_kong_searchlight', x, z, { len: 0.75, y: 0.7, ry: face(x, z, 10, -8) }); lamps.push(sl); c.post(X(x), z, 0.4);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,255,255,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(1.0, 1.0, 1); halo.position.set(0, 0.25, 0.3); sl.add(halo); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lamps.forEach((l, k) => { l.rotation.x = -0.5 - Math.sin(t * 0.4 + k) * 0.15; l.rotation.y = face(k ? 17.2 : 2.9, k ? -6.9 : -6.5, 10, -8) + Math.sin(t * 0.3 + k * 2) * 0.6; }); });
    // two flagpoles at the south corners, pennants reading N3W, snapping in the wind up here
    const flags = [];
    [[1.0, 7.3], [19.0, 7.3]].forEach(([x, z]) => { g.add(c.slab(0.07, 6.2, 0.07, K.std(0xd0d0d0, { metalness: 0.9, roughness: 0.3 }), x, 3.1, z)); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), K.std(0xd6a640, { metalness: 1, roughness: 0.25 })); ball.position.set(x, 6.25, z); g.add(ball);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8, 12, 1), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.moveTo(0, 0); q.lineTo(w, h / 2); q.lineTo(0, h); q.fill(); q.fillStyle = '#111'; q.font = `900 46px ${c.SERIF}`; q.fillText('N3W', 20, 80); K.eyeFlower(q, 160, 64, 22); }), transparent: true, side: THREE.DoubleSide, roughness: 0.8 }));
      fl.geometry.translate(0.8, 0, 0); fl.position.set(x, 5.7, z); fl.rotation.y = x < 10 ? 0 : PI; g.add(fl); flags.push(fl); c.post(X(x), z, 0.15); });
    const fp = flags[0].geometry.attributes.position, fx0 = Float32Array.from(fp.array);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let i = 0; i < fp.count; i++) { const x = fx0[i * 3]; fp.setZ(i, Math.sin(x * 3 - t * 6) * 0.12 * x / 1.6); } fp.needsUpdate = true; });
    flags[1].geometry = flags[0].geometry;
    // the deck's own signs
    wallSign(c, g, 'N3W OBSERVATORY, 102ND FLOOR, 1933', 0.15, 3.35, 0.6, PI / 2, { w: 2.6, h: 0.32, bg: '#111', fg: '#f4ead2', font: c.SERIF, weight: 900, border: '#d6a640' });
    wallSign(c, g, 'MLOW PICTURES PRESENTS THE EIGHTH WONDER', 10, 3.45, 7.86, PI, { w: 8.0, h: 0.5, bg: '#111', fg: '#f4ead2', font: c.SERIF, weight: 900, border: '#d6a640' });
    // 1933 sightseers at the parapet, hats on, backs to you, and one on the bench
    const hat = (e, k, dy = 0) => { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), K.std(0x1a1a1a)); br.position.y = 1.98 + dy; e.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.14, 14), K.std(k % 2 ? 0x2a2a2a : 0x4a4a4a)); cr.position.y = 2.06 + dy; e.add(cr); };
    [[5.6, -6.6, 0x3a3a3a], [6.5, -6.5, 0x5a5a5a], [13.3, -6.6, 0x2a2a2a]].forEach(([x, z, col], k) => { const e = K.extra(g, x, z, { col, ry: PI + (k - 1) * 0.2 }); hat(e, k); c.post(X(x), z, 0.3); });
    K.prop(r, g, X, 'painted_wooden_bench', 3.4, -4.4, { len: 1.4, ry: PI, r: 0.5 });
    const sit = K.extra(g, 3.2, -4.45, { seated: true, col: 0x3a3a3a, ry: PI }); hat(sit, 1, -0.55);
    K.extra(g, 1.5, 1.3, { seated: true, col: 0x2a2a2a, ry: PI / 2 }); g.add(c.slab(0.4, 0.45, 0.4, K.std(0x3a3a3a), 1.5, 0.22, 1.3));
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  outoftowners: { vintage_suitcase: 'nyb_oot_suitcase', water_manhole_cover: 'nyb_oot_manhole', street_lamp_01: 'nyb_lamp_banner' },
  enchanted: { Sofa_01: 'nyb_enchanted_sofa', ArmChair_01: 'nyb_enchanted_armchair', Television_01: 'nyb_tv_eye' },
  penguins: { modern_arm_chair_01: 'nyb_penguins_chair', potted_plant_02: 'nyb_penguins_plant' },
  hitch: { bar_chair_round_01: 'nyb_barstool_pink', classic_laptop: 'nyb_hitch_laptop' },
  towerheist: { modern_arm_chair_01: 'nyb_th_chair', modern_coffee_table_01: 'nyb_th_table', Chandelier_02: 'nyb_th_chandelier' },
  nowyousee: { dining_chair_02: 'nyb_nys_chair' },
  beatstreet: { spray_paint_bottles_02: 'nyb_bs_cans' },
  mitty: { metal_office_desk: 'nyb_mitty_desk' },
  statuewalk: { street_lamp_01: 'nyb_sw_lamp' },
  kong: { binoculars: 'nyb_kong_scope', modular_street_seating: 'nyb_kong_bench', security_light: 'nyb_kong_light' },
};
