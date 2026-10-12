// Round twelve, batch 4: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Batch 4 sets: batteries, susan, dumbo, bronx, kramer, zoolander, wildstyle, ragingbull, ferry, tenenbaums, meanstreets, barefoot, crooklyn.
// Every nyb_<set>_* model is a Poly Haven CC0 model repainted and labelled in Blender (_build/brand/b4.json).
const PI = Math.PI, H = PI / 2;

// a soft additive glow, for a practical that should read lit without a light
function glow(c, K, g, col, x, y, z, s = 0.8) {
  const { THREE } = c, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.set(s, s, 1); sp.position.set(x, y, z); g.add(sp); return sp;
}
// a ceiling fan that turns only while you are in its set
function fan(c, r, g, X, K, name, x, z, y, len = 1.4, speed = 2.4) {
  const m = K.prop(r, g, X, name, x, z, { len, y });
  c.tick((t, dt, P, ri) => { if (ri === r.i) m.rotation.y += dt * speed; });
  return m;
}
// a glowing sign on a wall, MeshBasic so it reads lit
function neon(c, g, text, x, y, z, ry, o = {}) {
  const s = c.sign(text, { w: 4, h: 0.6, bg: '#0b1020', fg: '#ff4fa3', glow: 18, border: '#22d3ee', ...o }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}

export const PROPS = {
  batteries: [
    ['nyb_batteries_piecase', 16.7, -4.3, { h: 2.4, ry: -H - 0.3, r: 0.8, egg: ['The pie case', 'batteries_pie', "Every pie in this case hit the floor once and was put back together by something the size of a hubcap. MLow had a slice. You cannot find the seams."] }],
    ['nyb_batteries_wetfloor', 8.6, 0.6, { h: 0.75, ry: 0.5, r: 0.3 }],
    ['nyb_coffeecart', 13.8, -1.9, { len: 1.8, ry: -0.4, r: 0.9 }],
    ['vintage_electric_kettle', 11.4, -4.7, { h: 0.28, y: 1.05, ry: 0.4 }],
    ['strawberry_chocolate_cake', 8.6, -4.6, { len: 0.3, y: 1.05 }],
    ['nyb_batteries_clock', 18.0, -7.96, { h: 0.6, y: 3.0 }],
  ],
  susan: [
    ['nyb_susan_trunk', 6.9, -4.9, { h: 1.0, y: 0.6, ry: 0.15, r: 0.7 }],
    ['nyb_susan_mirror', 17.6, -7.97, { h: 1.6, y: 0.9 }],
    ['nyb_susan_suitcase', 17.6, -0.6, { len: 1.2, ry: -0.5 }],
    ['nyb_susan_ad', 0.16, 0.4, { len: 1.1, y: 1.4, ry: H, egg: ['The personal ad', 'susan_ad', "DESPERATELY COUNTING SUSAN. Meet me at the Magic Club. Look for the jacket with the eye flower on the back. Signed, MLow."] }],
    ['Chandelier_03', 6, 0, { h: 1.1, y: 4.85 }], ['Chandelier_03', 14, 0, { h: 1.1, y: 4.85 }],
    ['nyb_barstool_pink', 8, 6.6, { h: 0.8, y: 3.0 }], ['nyb_barstool_pink', 12, 6.6, { h: 0.8, y: 3.0, ry: 0.6 }],
    ['brass_goblets', 7.5, 0.6, { len: 0.3, y: 0.65 }], ['brass_goblets', 12.5, 0.6, { len: 0.3, y: 0.65, ry: 1 }],
  ],
  dumbo: [
    ['nyb_dumbo_gaslamp', 13.3, -0.6, { h: 4.2, r: 0.25 }], ['nyb_dumbo_gaslamp', 3.4, -0.6, { h: 4.2, r: 0.25 }],
    ['nyb_dumbo_barrel', 2.6, -2.6, { h: 0.9, r: 0.45, ry: 0.4 }],
    ['nyb_dumbo_crate', 17.4, 0.4, { h: 0.6, ry: 0.3, r: 0.45 }], ['wicker_basket_01', 17.4, 0.4, { len: 0.5, y: 0.6, ry: 0.2 }],
    ['strawberry_chocolate_cake', 18.6, -1.2, { len: 0.16, y: 1.15, egg: ['A charlotte russe', 'dumbo_charlotte', "A charlotte russe on a crate, two cents, saved for a girl on the third floor. The kid ate it while he waited. MLow says that is the most honest frame in the picture."] }],
    ['nyb_dumbo_handtruck', 16.6, -3.4, { h: 1.3, ry: -0.6, r: 0.35 }],
    ['street_lamp_02', 0.3, 0.4, { h: 0.9, y: 3.4, ry: H }], ['street_lamp_02', 19.4, 0.4, { h: 0.9, y: 3.4, ry: -H }],
    ['wooden_bucket_01', 2.4, 6.2, { h: 0.45 }],
  ],
  bronx: [
    ['nyb_bronx_cardtable', 12.2, -4.5, { h: 0.78, r: 0.9, egg: ['The card table', 'bronx_table', "The table outside the club. One deck, three chairs, and one rule: whoever counts the money does not deal. MLow deals."] }],
    ['nyb_bronx_chair', 11.2, -4.5, { h: 0.95, ry: H }], ['nyb_bronx_chair', 13.2, -4.5, { h: 0.95, ry: -H }], ['nyb_bronx_chair', 12.2, -5.5, { h: 0.95 }],
    ['cigarette_case', 12.0, -4.35, { len: 0.2, y: 0.78, ry: 0.4 }], ['brass_goblets', 12.4, -4.7, { len: 0.28, y: 0.78 }],
    ['nyb_payphone', 0.32, 0.6, { h: 0.75, y: 1.0, ry: H }],
    ['nyb_hydrant_pink', 9.2, -1.4, { h: 0.8, r: 0.25 }],
    ['trashbag', 18.1, -6.9, { h: 0.55 }], ['trashbag', 19.2, -5.6, { h: 0.5, ry: 1 }],
    ['nyb_milkcrate_pink', 4.1, -6.5, { h: 0.35 }], ['nyb_milkcrate_cyan', 4.1, -6.5, { h: 0.35, y: 0.35, ry: 0.4 }],
    ['nyb_aircon', 19.4, 0.2, { len: 1.6, y: 5.4, ry: -H }], ['nyb_aircon', 0.3, -0.4, { len: 1.6, y: 6.2, ry: H }],
  ],
  kramer: [
    ['nyb_kramer_stove', 16.6, -6.85, { h: 0.92 }],
    ['nyb_kramer_milk', 9.3, -1.7, { h: 0.28, y: 0.92, egg: ['The milk', 'kramer_milk', "Grade A, counted. Billy pours it himself now: half in the glass, half on the counter. MLow calls that a fair split."] }],
    ['wooden_spoon', 10.6, -1.6, { len: 0.3, y: 0.92, ry: 0.3 }], ['bananas', 12.6, -1.5, { len: 0.35, y: 0.92, ry: -0.3 }],
    ['nyb_kramer_phone', 18.8, -7.88, { h: 0.6, y: 1.3 }],
    ['nyb_kramer_suitcase', 3.6, 6.9, { len: 1.2, ry: 0.15 }],
    ['painted_wooden_table', 4.0, -3.4, { len: 1.8, ry: H, r: 0.9 }],
    ['dining_chair_02', 3.15, -3.4, { h: 0.9, ry: H }], ['dining_chair_02', 4.85, -3.4, { h: 0.9, ry: -H }],
    ['wooden_bowl_01', 4.0, -3.2, { len: 0.26, y: 0.72 }],
    ['wall_clock', 10, 7.95, { h: 0.45, y: 4.0, ry: PI }],
    ['sofa_03', 16.4, 0.9, { len: 2.4, ry: -H, r: 1.1 }], ['coffee_table_round_01', 14.6, 0.9, { len: 1.0, r: 0.5 }], ['binder_notebook', 14.6, 0.9, { len: 0.45, y: 0.36, ry: 0.5 }],
  ],
  zoolander: [
    ['nyb_zoo_bust', 6.0, 0.4, { h: 0.75, y: 1.0 }],
    ['nyb_zoo_mirror', 14.2, 0.2, { h: 1.9, ry: -0.3, r: 0.5, egg: ['The mirror', 'zoolander_mirror', "Who is that really, really good looking New Yorker? Oh. It is you. MLow counted you twice, once for each angle."] }],
    ['nyb_zoo_screen', 15.9, -4.4, { h: 1.9, ry: -0.5, r: 0.5 }],
    ['nyb_zoo_lounge', 2.6, -3.0, { h: 1.0, ry: PI - 0.5, r: 0.55 }], ['nyb_zoo_lounge', 5.0, -3.0, { h: 1.0, ry: PI + 0.5, r: 0.55 }],
    ['modern_coffee_table_01', 3.8, -4.5, { len: 1.1, ry: H, r: 0.55 }],
    ['binder_notebook', 3.7, -4.5, { len: 0.4, y: 0.36, ry: 0.4 }], ['Camera_01', 4.0, -4.3, { len: 0.22, y: 0.36, ry: 2.2 }],
  ],
  wildstyle: [
    ['nyb_milkcrate_cyan', 13.0, -0.6, { h: 0.35, r: 0.4 }], ['nyb_milkcrate_pink', 13.0, -0.6, { h: 0.35, y: 0.35, ry: 0.3 }],
    ['nyb_wild_fire', 17.0, -0.7, { h: 0.9, r: 0.4 }],
    ['nyb_barrier', 2.4, 0.4, { len: 1.6, ry: 0.3, r: 0.6 }], ['nyb_barrier', 7.6, 6.5, { len: 1.6, r: 0.6 }],
    ['nyb_wild_cans2', 4.8, -0.2, { len: 0.28, ry: 0.6 }],
    ['can_rusted', 5.6, 0.6, { h: 0.15 }], ['can_rusted', 14.2, 1.0, { h: 0.15 }], ['can_rusted', 9.0, -1.0, { h: 0.15, ry: 2 }],
    ['trashbag', 18.8, -5.8, { h: 0.55 }],
    ['nyb_wild_flood', 0.35, -0.2, { h: 0.6, y: 5.2, ry: H }], ['nyb_wild_flood', 19.4, -0.2, { h: 0.6, y: 5.2, ry: -H }],
  ],
  ragingbull: [
    ['nyb_bull_head', 10, -7.7, { h: 1.3, y: 4.6, snd: 'bell', egg: ['The trophy', 'ragingbull_trophy', "The Bronx Bull, cast in gold and mounted in grey. Every fighter who passes it touches a horn for luck. MLow touched both."] }],
    ['nyb_bull_stool', 6.95, -4.0, { h: 0.5, y: 0.9, ry: 0.8 }], ['nyb_bull_stool', 13.05, 2.0, { h: 0.5, y: 0.9, ry: -2.4 }],
    ['nyb_bull_bucket', 7.45, -4.1, { h: 0.4, y: 0.9 }], ['nyb_bull_bucket', 12.55, 2.1, { h: 0.4, y: 0.9 }],
    ['nyb_bull_cutkit', 14.1, -4.9, { len: 0.5, ry: 0.3 }],
    ['painted_wooden_table', 4.7, -3.0, { len: 1.8, ry: H, r: 0.8 }],
    ['nyb_bull_megaphone', 4.7, -3.5, { len: 0.35, y: 0.72, ry: H }], ['Camera_01', 4.7, -2.5, { len: 0.22, y: 0.72, ry: H }],
    ['nyb_bull_chair', 3.8, -3.5, { h: 0.85, ry: H }], ['nyb_bull_chair', 3.8, -2.5, { h: 0.85, ry: H }],
    ['nyb_bull_chair', 15.2, -3.6, { h: 0.85, ry: -H }], ['nyb_bull_chair', 15.2, -2.4, { h: 0.85, ry: -H }], ['nyb_bull_chair', 15.2, -1.2, { h: 0.85, ry: -H }], ['nyb_bull_chair', 15.2, 0, { h: 0.85, ry: -H }],
  ],
  ferry: [
    ['nyb_ferry_lifebuoy', 6.0, -0.9, { h: 0.95, y: 0.45, ry: 0.35, egg: ['The lifebuoy', 'ferry_buoy', "N3W FERRY, STATEN ISLAND. Twenty five minutes each way, free, and the best view of the harbour money cannot buy. MLow rides it for the light at the Battery."] }],
    ['nyb_ferry_lifebuoy', 7.0, -7.24, { h: 1.05, y: 0.03 }], ['nyb_ferry_lifebuoy', 13.0, -7.24, { h: 1.05, y: 0.03 }],
    ['nyb_ferry_lifejacket', 0.25, 0.6, { h: 0.9, y: 1.3, ry: H }], ['nyb_ferry_lifejacket', 19.5, 0.6, { h: 0.9, y: 1.3, ry: -H }],
    ['nyb_ferry_bag', 12.4, 1.0, { len: 0.9, ry: 0.3, egg: ['Her bag', 'ferry_heels', "Sneakers for the ferry, heels for the office. The bag holds both, a newspaper, and a resume with MLow down as a reference."] }],
    ['nyb_ferry_thermos', 11.4, -7.4, { h: 0.28, y: 1.1 }], ['vintage_binocular', 8.8, -7.4, { len: 0.2, y: 1.1, ry: 0.3 }],
    ['nyb_coffeecart', 2.6, 6.5, { len: 1.8, ry: H, r: 0.9 }],
    ['nyb_extinguisher', 19.4, -0.4, { h: 0.6, y: 1.0, ry: -H }],
  ],
  tenenbaums: [
    ['nyb_tenen_games', 5.4, -3.6, { h: 2.2, ry: 0.35, r: 0.9 }], ['nyb_tenen_games', 14.6, -3.6, { h: 2.2, ry: -0.35, r: 0.9 }],
    ['nyb_tenen_mousetrap', 9.2, -1.6, { len: 0.3, ry: 0.2, egg: ['A gilded mousetrap', 'tenenbaums_trap', "A gold mousetrap, baited with a pencil sketch. The Dalmatian mice are not fooled. MLow set two anyway, one each side, for the symmetry."] }],
    ['nyb_tenen_mousetrap', 10.8, -1.6, { len: 0.3, ry: -0.2, egg: ['A gilded mousetrap', 'tenenbaums_trap', "A gold mousetrap, baited with a pencil sketch. The Dalmatian mice are not fooled. MLow set two anyway, one each side, for the symmetry."] }],
    ['nyb_tenen_portrait', 2.0, -7.97, { h: 1.5, y: 2.9 }], ['nyb_tenen_portrait', 18.0, -7.97, { h: 1.5, y: 2.9 }],
    ['Chandelier_01', 10, 1.0, { h: 1.0, y: 4.9 }], ['Chandelier_02', 5, 1.0, { h: 0.9, y: 5.0 }], ['Chandelier_02', 15, 1.0, { h: 0.9, y: 5.0 }],
    ['side_table_tall_01', 6.4, -6.3, { h: 0.76, r: 0.3 }], ['side_table_tall_01', 13.6, -6.3, { h: 0.76, r: 0.3 }],
    ['brass_candleholders', 6.4, -6.3, { len: 0.42, y: 0.76 }], ['brass_candleholders', 13.6, -6.3, { len: 0.42, y: 0.76 }],
  ],
  meanstreets: [
    ['nyb_mean_candles', 9.4, -1.55, { len: 0.9, y: 1.2, egg: ['The votive candles', 'meanstreets_candle', "Hold your hand over the flame as long as you can stand it. That is the down payment. MLow pays the rest in pictures."] }],
    ['nyb_mean_tv', 18.2, -7.7, { len: 0.7, y: 3.03 }],
    ['nyb_mean_dartboard', 16.8, -7.97, { h: 0.45, y: 1.5 }],
    ['wine_bottles_01', 1.5, -5.6, { len: 0.6, y: 1.1, ry: H }], ['brass_goblets', 1.6, -2.8, { len: 0.35, y: 1.1 }],
    ['nyb_register_gold', 1.55, 1.7, { h: 0.4, y: 1.1, ry: H }], ['cigarette_pack', 1.7, -0.6, { len: 0.09, y: 1.1 }],
  ],
  barefoot: [
    ['nyb_barefoot_bench', 10.0, -3.0, { h: 1.0, y: 4.5, r: 0.7 }],
    ['nyb_barefoot_boots', 11.0, -2.5, { len: 0.5, y: 4.5, ry: 0.4, egg: ['The boots', 'barefoot_boots', "Boots off at the top of five flights. She says the park is better barefoot, even in February. MLow says the climb is too."] }],
    ['nyb_trash_dsny', 17.0, 0.4, { h: 0.9, r: 0.35 }],
    ['nyb_payphone', 19.45, 0.4, { h: 0.75, y: 1.0, ry: -H }],
    ['nyb_barefoot_box', 4.0, -4.0, { h: 0.5, y: 4.5, ry: 0.3 }], ['nyb_barefoot_box', 4.7, -3.2, { h: 0.45, y: 4.5, ry: -0.4 }],
    ['nyb_barefoot_box', 4.0, -4.0, { h: 0.4, y: 5.0, ry: 0.9 }], ['nyb_barefoot_box', 16.4, -5.8, { h: 0.5, y: 4.5, ry: 0.8 }],
    ['nyb_barefoot_bucket', 10.0, -5.0, { h: 0.4, y: 4.5 }],
    ['sofa_02', 15.6, -3.4, { len: 1.9, y: 4.5 }],
    ['vintage_suitcase', 6.0, -6.6, { len: 1.2, y: 4.5, ry: 0.2 }],
  ],
  crooklyn: [
    ['throw_pillows_01', 4.25, 4.2, { len: 0.8, y: 0.5, ry: H }],
    ['coffee_table_round_01', 5.8, 4.2, { len: 1.0, r: 0.5 }], ['bananas', 5.8, 4.2, { len: 0.32, y: 0.38, ry: 0.5 }],
    ['nyb_crooklyn_portrait', 16.4, -0.86, { h: 1.0, y: 1.3, egg: ['The family portrait', 'crooklyn_portrait', "Five kids, one bathroom, and one picture where everybody is looking at the camera. MLow got it on the third try, after the dog left."] }],
    ['potted_plant_04', 11.6, -0.4, { h: 1.0, r: 0.3 }], ['vintage_cabinet_01', 4.6, -0.55, { h: 2.0, r: 0.9 }],
    ['dining_table', 13.4, 1.4, { len: 2.0, r: 1.0 }], ['dining_chair_02', 12.6, 0.7, { h: 0.9 }], ['dining_chair_02', 14.2, 0.7, { h: 0.9 }], ['dining_chair_02', 12.6, 2.1, { h: 0.9, ry: PI }], ['dining_chair_02', 14.2, 2.1, { h: 0.9, ry: PI }],
    ['wooden_bowl_01', 13.4, 1.4, { len: 0.3, y: 0.8 }],
    ['vintage_day_bed', 5.0, -4.2, { len: 2.0, r: 1.0 }], ['Rockingchair_01', 14.6, -4.2, { h: 1.1, ry: -0.4, r: 0.5 }],
  ],
};

export const ROOM = {
  batteries(c, r, g, X, K) {
    [6, 14].forEach((x) => fan(c, r, g, X, K, 'nyb_batteries_fan', x, 0, 5.45));
    [7, 10, 13].forEach((x) => { K.prop(r, g, X, 'modern_ceiling_lamp_01', x, -4.6, { h: 1.3, y: 4.7 }); glow(c, K, g, 'rgba(220,255,240,.7)', x, 4.85, -4.6, 1.1); });
    neon(c, g, "MLOW'S CAFE  OPEN ALL NIGHT", 10, 4.3, 7.86, PI, { w: 5, h: 0.7 });
    // two regulars at the counter, and a table in the middle of the floor
    [[8, 0x6a3a3a], [12, 0x3a4a6a]].forEach(([x, col]) => { const e = K.extra(g, x, -3.7, { seated: true, col, ry: PI }); e.position.y = 0.36; });
    K.prop(r, g, X, 'round_wooden_table_02', 11.4, -0.3, { h: 0.75, r: 0.55 });
    [[10.7, -0.3, H], [12.1, -0.3, -H]].forEach(([x, z, ry]) => K.prop(r, g, X, 'dining_chair_02', x, z, { h: 0.9, ry }));
    K.prop(r, g, X, 'carrot_cake', 11.4, -0.3, { len: 0.25, y: 0.75 });
  },
  susan(c, r, g, X, K) {
    [[6.8, 0.6], [11.8, 0.6]].forEach(([x, z], k) => K.extra(g, x, z, { seated: true, col: k ? 0x5a2a6a : 0x2a3a6a, ry: H }));
    neon(c, g, 'N3W MAGIC CLUB\nLIVE TONIGHT', 0.2, 4.4, -3.0, H, { w: 3.2, h: 0.9 });
  },
  dumbo(c, r, g, X, K) {
    const { THREE } = c;
    // the hero: a 1922 cine camera on its wooden legs, by the one cobble, pointed where the picture was taken
    const tri = new THREE.Group(); tri.position.set(11.6, 0, 1.9); g.add(tri); const wood = K.std(0x3a2a1a, { roughness: 0.7 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.3, l = c.slab(0.05, 1.5, 0.05, wood, Math.cos(a) * 0.28, 0.72, Math.sin(a) * 0.28); l.rotation.set(-Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3); tri.add(l); }
    tri.add(c.slab(0.3, 0.06, 0.3, wood, 0, 1.45, 0));
    const cam = K.prop(r, g, X, 'nyb_dumbo_camera', 11.6, 1.9, { len: 0.5, y: 1.48, ry: PI - 0.15 }); c.post(X(11.6), 1.9, 0.4);
    c.clickable(cam, () => { c.sound.tick(); c.toast('MLOW STUDIO, 1922. Rolling. Now find the cobble it is pointed from.', 2600); }, 'The camera');
    // washing on the line across the street, high, swaying only while you watch
    const cols = [0xd8c8a8, 0xb89878, 0xe8dcc0, 0x8a7a68, 0xc8b8a0];
    const lines = [-2.2, 3.8].map((z, li) => { const o = new THREE.Group(); o.position.set(0, 7.4 - li * 0.6, z); g.add(o); o.add(c.slab(19.4, 0.02, 0.02, K.std(0x2a2a2a), 9.9, 0, 0));
      for (let k = 0; k < 9; k++) { const w = 0.5 + Math.random() * 0.5, h = 0.5 + Math.random() * 0.6, cl = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0), K.std(cols[(k + li) % 5], { side: THREE.DoubleSide, roughness: 1 })); cl.position.x = 1.2 + k * 2.1 + Math.random() * 0.4; o.add(cl); }
      return o; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lines.forEach((o, k) => o.children.forEach((cl, j) => { if (j) cl.rotation.x = Math.sin(t * 1.3 + j + k) * 0.18; })); });
  },
  bronx(c, r, g, X, K) {
    [[11.2, -4.5, H], [13.2, -4.5, -H]].forEach(([x, z, ry], k) => { const e = K.extra(g, x, z, { seated: true, col: k ? 0x2a2a2a : 0x4a3a2a, ry }); e.position.y = 0.06; });
    // the feast lights over Belmont Avenue
    [-3.2, 0.4, 4.0].forEach((z) => K.bulbs(g, 0.6, 19.2, 6.6, z, 26, 0xfff0c0));
    [-3.2, 0.4, 4.0].forEach((z) => g.add(c.slab(19.2, 0.02, 0.02, K.std(0x222222), 9.9, 6.68, z)));
  },
  kramer(c, r, g, X, K) {
    // the stove slab gives way to a real 1979 range, at the same height, so the pan and the toast sit where they did
    g.children.forEach((o) => { if (o.isMesh && Math.abs(o.position.x - 16.6) < 0.01 && Math.abs(o.position.z + 6.8) < 0.01 && Math.abs(o.position.y - 0.46) < 0.01) o.visible = false; });
    [8, 12].forEach((x) => { K.prop(r, g, X, 'modern_ceiling_lamp_01', x, -1.4, { h: 1.3, y: 4.7 }); glow(c, K, g, 'rgba(255,240,210,.7)', x, 4.85, -1.4, 1.1); });
  },
  zoolander(c, r, g, X, K) {
    g.add(c.slab(0.6, 1.0, 0.6, K.std(0xf4f4f0, { roughness: 0.25 }), 6.0, 0.5, 0.4)); c.post(X(6.0), 0.4, 0.45);
    const plaque = c.sign('BLUE STEEL\nA PORTRAIT BY MLOW', { w: 0.56, h: 0.2, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 }); plaque.position.set(6.0, 0.8, 0.71); g.add(plaque);
    [6, 10, 14].forEach((x) => { K.prop(r, g, X, 'modern_ceiling_lamp_01', x, 0, { h: 1.2, y: 4.8 }); glow(c, K, g, 'rgba(255,255,255,.7)', x, 4.95, 0, 1.1); });
    // a runway down the middle of the floor, flat so you can walk it, with two photographers at the end
    g.add(c.slab(11, 0.02, 1.4, K.std(0x111111, { roughness: 0.15, metalness: 0.3 }), 10, 0.011, 1.5));
    [0.8, 2.2].forEach((z) => g.add(c.slab(11, 0.025, 0.04, K.basic(0xff4fa3), 10, 0.013, z)));
    const rw = c.sign('N3W FASHION WEEK  WALK OFF TONIGHT', { w: 4, h: 0.3, bg: null, fg: '#22d3ee', font: c.SERIF, weight: 900 }); rw.rotation.x = -H; rw.position.set(10, 0.03, 1.5); g.add(rw);
    [[16.2, 0.6, -1.2], [16.2, 2.4, -1.9]].forEach(([x, z, ry]) => { K.extra(g, x, z, { col: 0x222222, ry }); K.prop(r, g, X, 'Camera_01', x - 0.3, z, { len: 0.2, y: 1.3, ry: ry - H }); });
  },
  wildstyle(c, r, g, X, K) {
    // the hero: a boombox on two milk crates. Click it and the yard has a beat.
    const bb = K.prop(r, g, X, 'nyb_wild_boombox', 13.0, -0.6, { len: 1.25, y: 0.7, ry: -0.3 }); let on = false;
    c.clickable(bb, () => { on = !on; c.sound.beat(on); if (on) c.egg('wildstyle_boombox', "N3W BEAT BOX, batteries from the bodega, volume past ten. Every writer in the yard paints faster to it. MLow tagged the handle."); }, 'The boombox');
    c.tick((t, dt, P, ri) => { if (ri !== r.i && on) { on = false; c.sound.beat(false); } });
    // the barrel fire
    const fl = [0, 1, 2].map((k) => glow(c, K, g, k ? 'rgba(255,150,40,.8)' : 'rgba(255,220,120,.9)', 17.0, 1.0, -0.7, 0.8));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fl.forEach((s, k) => { const u = (t * 0.9 + k / 3) % 1; s.position.set(17.0 + Math.sin(t * 5 + k) * 0.08, 0.95 + u * 0.7, -0.7); s.scale.setScalar(0.9 - u * 0.6); s.material.opacity = 1 - u; }); });
    const sign = c.sign('N3W TRANSIT YARD\nNO TRESPASSING\nWRITERS WELCOME', { w: 2.6, h: 1.0, bg: '#f4ead2', fg: '#b01818', font: c.MONO, weight: 800, border: '#b01818' });
    sign.position.set(19.5, 4.2, -3.0); sign.rotation.y = -H; g.add(sign);
    // a cardboard floor by the tracks, and a b boy spinning on it while you watch
    const mat = c.slab(1.8, 0.02, 1.3, K.std(0xb08a5a, { roughness: 1 }), 7.2, 0.01, 0.4); g.add(mat);
    const tag = c.sign('N3W ROCK STEADY', { w: 1.2, h: 0.24, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900 }); tag.rotation.x = -H; tag.position.set(7.2, 0.025, 0.85); g.add(tag);
    const bb2 = K.extra(g, 7.2, 0.3, { col: 0x22d3ee }); const fan2 = K.extra(g, 8.7, -0.3, { col: 0xff7a1a, ry: -1.2 });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bb2.rotation.y += dt * 5; bb2.position.y = Math.abs(Math.sin(t * 6)) * 0.08; fan2.position.y = Math.abs(Math.sin(t * 4)) * 0.04; });
    ['old_tyre', 'old_tyre'].forEach((n, k) => K.prop(r, g, X, n, 1.9 + k * 0.5, 6.2 - k * 0.2, { len: 0.75, ry: H + k * 0.3 }));
  },
  ragingbull(c, r, g, X, K) {
    // the trophy mount over the photograph: a dark shield and a brass plate
    g.add(c.slab(1.7, 1.55, 0.08, K.std(0x111111, { roughness: 0.35, metalness: 0.4 }), 10, 5.2, -7.92)); glow(c, K, g, 'rgba(255,255,255,.35)', 10, 5.3, -7.4, 2.4);
    // a second corner, a spit bucket and towels by the steps
    K.prop(r, g, X, 'nyb_bull_bucket', 8.6, 3.0, { h: 0.4 }); K.prop(r, g, X, 'nyb_bull_stool', 11.6, 3.1, { h: 0.5, ry: 0.4 });
    // the lights over the ring
    [[8, -3], [12, -3], [8, 1], [12, 1]].forEach(([x, z]) => { K.prop(r, g, X, 'hanging_industrial_lamp', x, z, { h: 1.35, y: 4.5 }); glow(c, K, g, 'rgba(255,255,255,.8)', x, 4.5, z, 1.4); });
  },
  ferry(c, r, g, X, K) {
    const { THREE } = c;
    // the hero lifebuoy stands mid deck on its own post; three commuters on the benches
    g.add(c.slab(0.12, 0.95, 0.12, K.std(0xf4ead2, { roughness: 0.5 }), 6.0, 0.47, -1.05)); c.post(X(6.0), -1.0, 0.5);
    [[3.7, 0x2a3a6a], [16.3, 0x3a5a3a]].forEach(([x, col]) => K.extra(g, x, 2.15, { seated: true, col }));
    // signal flags along both rails
    const cols = [0xff7a1a, 0xffffff, 0x1d4ed8, 0xf5c542, 0xff4fa3, 0x22d3ee];
    [0.3, 19.45].forEach((x) => { g.add(c.slab(0.02, 0.02, 13, K.std(0x333333), x, 3.6, -0.5));
      for (let k = 0; k < 16; k++) { const f = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.2), new THREE.Vector3(0, 0, 0.2), new THREE.Vector3(0, -0.45, 0)]), K.std(cols[k % 6], { side: THREE.DoubleSide })); f.geometry.computeVertexNormals(); f.position.set(x, 3.6, -6.6 + k * 0.82); g.add(f); } });
  },
  tenenbaums(c, r, g, X, K) {
    [5, 10, 15].forEach((x) => glow(c, K, g, 'rgba(255,220,180,.6)', x, 5.2, 1.0, 1.4));
  },
  meanstreets(c, r, g, X, K) {
    const { THREE } = c;
    // the hero: a votive rack against the east wall, three tiers of red glass, under the gilded candlesticks
    const wood = K.std(0x2a1008, { roughness: 0.5 }); [[-1.55, 1.2], [-1.3, 1.0], [-1.05, 0.8]].forEach(([z, y]) => g.add(c.slab(1.5, y, 0.26, wood, 9.4, y / 2, z)));
    const cup = new THREE.CylinderGeometry(0.035, 0.03, 0.07, 10), red = K.basic(0xff3020, { transparent: true, opacity: 0.9 }), flames = [];
    [[-1.55, 1.2], [-1.3, 1.0], [-1.05, 0.8]].forEach(([z, y], ti) => { for (let k = 0; k < 8; k++) { const m = new THREE.Mesh(cup, red); const x = 8.77 + k * 0.18 + (ti % 2) * 0.05; m.position.set(x, y + 0.035, z); g.add(m); if (k % 2 === ti % 2) flames.push(glow(c, K, g, 'rgba(255,170,60,.9)', x, y + 0.1, z, 0.22)); } });
    c.post(X(9.0), -1.3, 0.5); c.post(X(9.8), -1.3, 0.5);
    const plaque = c.sign('SAN GENNARO, LIGHT ONE FOR MLOW', { w: 1.4, h: 0.16, bg: '#1a0404', fg: '#f5c542', font: c.SERIF, weight: 800 }); plaque.position.set(9.4, 0.5, -0.91); g.add(plaque);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; flames.forEach((s, k) => { s.scale.setScalar(0.18 + Math.abs(Math.sin(t * 7 + k * 1.7)) * 0.08); }); });
    g.add(c.slab(0.8, 0.05, 0.5, wood, 18.2, 3.0, -7.75));
    [7, 13].forEach((x) => fan(c, r, g, X, K, 'ceiling_fan', x, 0, 5.45, 1.3, 1.6));
    neon(c, g, "MLOW'S COCKTAILS", 10, 4.3, 7.86, PI, { fg: '#ff3030', border: '#f5c542' });
  },
  barefoot(c, r, g, X, K) {
    // a caged bulb at every landing, on the east wall of the stair
    const TOP = 4.5, z0 = 6.4, zt = -2.0;
    for (let k = 0; k < 4; k++) { const z = z0 - (k + 1) * (z0 - zt) / 5, y = TOP * (k + 1) / 5 + 1.9;
      K.prop(r, g, X, 'industrial_wall_sconce', 13.95, z, { h: 0.4, y, ry: -H }); glow(c, K, g, 'rgba(255,220,160,.7)', 13.75, y + 0.05, z, 0.9); }
  },
  crooklyn(c, r, g, X, K) {
    // the hero: a real 1970s set around the dance show already playing (the screen is the set's own canvas)
    const ry = -H - 0.4, nx = Math.sin(ry), nz = Math.cos(ry);
    K.prop(r, g, X, 'nyb_crooklyn_tv', 7.4 - nx * 0.33, 5.6 - nz * 0.33, { len: 0.75, y: 0.745, ry });
    [6, 14].forEach((x) => fan(c, r, g, X, K, 'nyb_crooklyn_fan', x, 2.5, 5.45));
    [[12.6, 0.7, 0, 0xff7a1a], [14.2, 0.7, 0, 0x22aa66], [14.2, 2.1, PI, 0x3b82f6]].forEach(([x, z, ry, col]) => { const e = K.extra(g, x, z, { seated: true, col, ry }); e.scale.setScalar(0.75); e.position.y = 0.12; });
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  batteries: { bar_chair_round_01: 'nyb_batteries_stool', CashRegister_01: 'nyb_batteries_register' },
  susan: { round_wooden_table_01: 'nyb_susan_table', dining_chair_02: 'nyb_susan_chair' },
  dumbo: { wooden_barrels_01: 'nyb_dumbo_barrel', wooden_crate_01: 'nyb_dumbo_crate', wooden_crate_02: 'nyb_dumbo_crate2' },
  bronx: { metal_trash_can: 'nyb_trash_dsny', street_lamp_01: 'nyb_bronx_lamp', WoodenChair_01: 'nyb_bronx_chair' },
  kramer: { bar_chair_round_01: 'nyb_kramer_stool', potted_plant_02: 'nyb_kramer_plant' },
  zoolander: { GreenChair_01: 'nyb_zoo_chair', potted_plant_02: 'nyb_zoo_plant' },
  wildstyle: { Barrel_01: 'nyb_wild_barrel', spray_paint_bottles_02: 'nyb_wild_cans' },
  ferry: { modular_street_seating: 'nyb_ferry_bench' },
  tenenbaums: { ArmChair_01: 'nyb_tenen_armchair', potted_plant_02: 'nyb_tenen_plant' },
  meanstreets: { bar_chair_round_01: 'nyb_mean_stool' },
  crooklyn: { Sofa_01: 'nyb_crooklyn_sofa' },
};
