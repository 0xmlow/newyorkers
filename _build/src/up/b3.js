// Round twelve, batch 3: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Sets: dogday, fame, annie, unisphere, mcmlow, bramford, apartment, chase, birdman, network, gems, smoke, mail.
// The nyb_<set>_* models are CC0 Poly Haven props made ours in Blender (recipes in _build/brand/b3.json).
const PI = Math.PI;

// a practical that glows without a light: a soft additive sprite
function halo(c, K, g, x, y, z, col = 'rgba(255,230,180,.55)', s = 1.2) {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a model whose materials glow once it loads (fluorescent tubes, lamp globes, screens)
function lit(c, g, name, x, y, z, o = {}) {
  return c.glb(name, { h: o.h, len: o.len, x, y, z, ry: o.ry || 0, parent: g, shadow: false, onload: (gg) => {
    gg.traverse((m) => { if (m.isMesh && m.material && !m.material.map?.userData?.sticker) { m.material = m.material.clone(); m.material.emissive = new c.THREE.Color(o.col || 0xfff4e0); m.material.emissiveIntensity = o.k ?? 0.7; } });
  } });
}
// spin a group about y while its set is the one you are in
function spinner(c, r, list, v = 2.2) { c.tick((t, dt, P, ri) => { if (ri !== r.i) return; list.forEach((f, k) => { f.rotation.y = t * (v + k * 0.35); }); }); }

export const PROPS = {
  dogday: [
    // the police line in front of the counter, and the bullhorn on it
    ['nyb_barrier', 10, -1.75, { h: 0.83, r: 0.8 }],
    ['nyb_dogday_bullhorn', 10, -1.75, { h: 0.6, y: 0.83, ry: 0.5, egg: ['The bullhorn', 'dogday_bullhorn', 'The bullhorn from the standoff. Sonny never needed one: he shouted a single word into a hundred degrees and all of Brooklyn shouted it back. On this block the word is counted.'], snd: 'horn' }],
    ['nyb_dogday_bench', 6.6, 0.4, { len: 1.7, r: 0.7 }], ['nyb_dogday_bench', 13.4, 0.4, { len: 1.7, r: 0.7 }],
    ['nyb_dogday_wastebin', 12.9, -2.75, { h: 0.62, r: 0.5 }],
    ['nyb_dogday_clock', 2.8, -7.86, { h: 0.62, y: 3.1 }],
    ['nyb_seccam_counted', 0.3, -7.3, { h: 0.3, y: 4.4, ry: 0.8 }],
    ['nyb_aircon', 10, 7.7, { h: 0.75, y: 5.1, ry: PI }],
    ['ph_fire_alarm', 0.16, 0.9, { h: 0.3, y: 2.5, ry: PI / 2 }],
  ],
  fame: [
    ['nyb_fame_aframe', 10, 1.0, { h: 1.25, r: 0.45 }],
    ['nyb_fame_crate_a', 18.2, -0.2, { h: 0.38, ry: 0.3, r: 0.55 }], ['nyb_fame_crate_a', 18.25, -0.2, { h: 0.38, y: 0.38, ry: -0.1 }],
    ['nyb_fame_ukulele', 18.1, -0.1, { h: 0.58, y: 0.76, ry: -0.4 }],
    ['nyb_milkcrate_pink', 1.1, 6.6, { h: 0.3, r: 0.4 }], ['nyb_milkcrate_cyan', 1.1, 6.6, { h: 0.3, y: 0.3, ry: 0.4 }], ['nyb_milkcrate_pink', 1.7, 7.1, { h: 0.3, ry: -0.3 }],
    ['nyb_lamp_banner', 1.0, -5.4, { h: 3.9, ry: PI / 2, r: 0.25 }], ['nyb_lamp_banner', 19.0, -5.4, { h: 3.9, ry: -PI / 2, r: 0.25 }],
    ['nyb_payphone', 19.45, 0.6, { h: 0.74, y: 1.0, ry: -PI / 2 }],
    ['nyb_hydrant_pink', 2.6, 1.4, { h: 0.75, r: 0.3 }],
    ['ph_modular_fire_escape', 10, 7.5, { h: 5.6, y: 3.6, ry: PI }],
    ['nyb_aircon', 0.32, 0.4, { h: 0.8, y: 4.4, ry: PI / 2 }],
  ],
  annie: [
    ['nyb_annie_poster', 18.0, -7.82, { h: 2.0, y: 0.95, egg: ['The poster', 'annie_poster', 'The Sorrow and the Count, four hours long. He will not walk in two minutes after it starts, so here everybody is, in line for the next show. MLow is in line too. He brought a book.'], snd: 'ticket' }],
    ['nyb_annie_frame', 0.95, -7.9, { h: 1.1, y: 1.4 }],
    ['nyb_annie_chandelier', 4.5, 2.5, { h: 1.2, y: 4.7 }], ['nyb_annie_chandelier', 15.5, 2.5, { h: 1.2, y: 4.7 }],
    ['nyb_annie_sconce', 0.27, -5.4, { h: 0.4, y: 2.7, ry: PI / 2 }], ['nyb_annie_sconce', 0.27, -3.0, { h: 0.4, y: 2.7, ry: PI / 2 }],
    ['nyb_annie_sconce', 19.48, -5.4, { h: 0.4, y: 2.7, ry: -PI / 2 }], ['nyb_annie_sconce', 19.48, -3.0, { h: 0.4, y: 2.7, ry: -PI / 2 }],
    ['nyb_annie_sofa', 0.62, -3.0, { len: 2.2, ry: PI / 2, r: 0.7 }],
    ['ph_Ottoman_01', 8.4, 1.0, { h: 0.45, r: 0.4 }], ['ph_Ottoman_01', 11.6, 1.0, { h: 0.45, ry: 0.4, r: 0.4 }],
  ],
  unisphere: [
    ['nyb_unisphere_cat', 13.4, 0.0, { h: 0.7, ry: -0.3, r: 0.3 }],
    ['nyb_unisphere_crate', 16.4, 0.6, { len: 1.3, ry: 0.2, r: 0.75 }], ['nyb_unisphere_crate', 16.5, 0.6, { len: 1.3, y: 0.48, ry: -0.1 }],
    ['nyb_unisphere_pole', 1.1, 0.3, { h: 3.9, ry: PI / 2, r: 0.25 }], ['nyb_unisphere_pole', 18.9, 0.3, { h: 3.9, ry: -PI / 2, r: 0.25 }],
    ['ph_planter_box_01', 4.4, -0.6, { len: 1.4, r: 0.6 }], ['ph_planter_box_01', 15.6, -0.6, { len: 1.4, r: 0.6 }],
    ['ph_shrub_02', 4.4, -0.6, { h: 0.9, y: 0.6 }], ['ph_shrub_02', 15.6, -0.6, { h: 0.9, y: 0.6, ry: 1.3 }],
  ],
  mcmlow: [
    ['nyb_mcmlow_bucket', 10, 0.6, { h: 0.62, y: 0.47, ry: 0.3, egg: ['The royal mop bucket', 'mcmlow_bucket', 'The royal mop bucket: gold outside, suds inside. In Queens a prince starts at the bottom and mops his way up. MLow started at the bottom too. He painted it.'], snd: 'ding' }],
    ['nyb_mcmlow_table', 4.4, -1.0, { h: 0.86, ry: PI / 2, r: 0.8 }], ['nyb_mcmlow_table', 13.2, -1.0, { h: 0.86, ry: PI / 2, r: 0.8 }], ['nyb_mcmlow_table', 15.8, -1.0, { h: 0.86, ry: PI / 2, r: 0.8 }],
    ['nyb_mcmlow_bin', 18.95, -3.2, { h: 0.9, ry: -PI / 2, r: 0.5 }],
  ],
  bramford: [
    ['nyb_bramford_closet', 8.15, -1.2, { h: 2.3, ry: PI / 2, r: 0.75, egg: ['The linen closet', 'bramford_closet', 'Behind the linen there is a door, and behind the door the neighbours are counting. Rosemary moved the shelves to find it. MLow would knock first.'], snd: 'drip' }],
    ['ph_side_table_01', 11.95, -0.4, { h: 0.6, ry: -PI / 2, r: 0.35 }], ['nyb_bramford_mousse', 11.95, -0.4, { len: 0.26, y: 0.6 }],
    ['ph_chinese_armchair', 2.4, -0.2, { h: 1.3, ry: PI / 2, r: 0.5 }], ['ph_side_table_01', 3.5, -0.2, { h: 0.6, r: 0.35 }],
    ['ph_GothicCommode_01', 16.2, 7.55, { h: 1.1, ry: PI, r: 0.6 }],
  ],
  apartment: [
    ['nyb_apartment_desk', 9.6, 2.4, { h: 0.78, r: 0.95, egg: ['Desk 861', 'apartment_desk', 'Desk 861 of 31,259. C.C. Baxter lends out his apartment and keeps very careful count. MLow keeps the count too, and lends out nothing but the eye flower.'], snd: 'tick' }],
    ['ph_SchoolChair_01', 9.6, 1.55, { h: 0.95, ry: 0 }],
    ['nyb_apartment_party', 9.0, 2.45, { len: 0.55, y: 0.78 }], ['ph_vintage_stapler', 10.15, 2.25, { len: 0.2, y: 0.78, ry: 0.4 }],
    ['ph_office_notepads', 10.25, 2.6, { len: 0.5, y: 0.78, ry: 0.1 }], ['ph_desk_lamp_arm_01', 10.4, 2.05, { h: 0.55, y: 0.78, ry: -2.6 }],
    ['ph_stationery_supplies', 9.55, 2.15, { len: 0.3, y: 0.78 }],
    ['nyb_apartment_clock', 1.0, -7.86, { h: 0.75, y: 3.2 }],
    ['nyb_apartment_files', 0.65, -3.0, { h: 1.25, ry: PI / 2, r: 0.6 }], ['nyb_apartment_files', 0.65, -0.6, { h: 1.25, ry: PI / 2, r: 0.6 }],
  ],
  chase: [
    ['nyb_chase_lincoln', 7.7, 0.0, { len: 4.6, ry: PI, egg: ['The Lincoln', 'chase_lincoln', 'Popeye had the Lincoln stripped to the frame looking for what was hidden inside it. Everything MLow hides is in plain sight. Count again.'], snd: 'thud' }],
    ['nyb_chase_manhole', 10.2, 4.0, { len: 0.9 }],
    ['nyb_chase_lamp', 1.3, -5.4, { h: 3.9, ry: PI / 2, r: 0.25 }], ['nyb_chase_lamp', 18.7, -5.4, { h: 3.9, ry: -PI / 2, r: 0.25 }],
    ['nyb_payphone', 3.56, 1.3, { h: 0.74, y: 1.05, ry: PI / 2 }],
    ['nyb_coffeecart', 18.6, 0.4, { len: 2.0, ry: -PI / 2, r: 0.9 }],
    ['ph_old_tyre', 0.5, -3.15, { h: 0.6, ry: PI / 2 }], ['ph_old_tyre', 0.5, -2.95, { h: 0.6, ry: PI / 2 + 0.1 }], ['ph_old_tyre', 0.55, -2.75, { h: 0.6, ry: PI / 2 - 0.1 }],
    ['nyb_utility_bomb', 19.4, -3.0, { h: 1.1, ry: -PI / 2, r: 0.4 }],
  ],
  birdman: [
    ['nyb_birdman_ac', 17.8, 0.6, { h: 0.95, ry: -PI / 2, r: 1.0 }], ['nyb_birdman_ac', 2.4, 1.2, { h: 0.95, ry: PI / 2, r: 1.0 }],
    ['ph_modular_airduct_rectangular_01', 18.6, -3.6, { len: 4.0, ry: PI / 2 }],
    ['nyb_birdman_chair', 13.6, 3.4, { h: 0.88, ry: -0.7, r: 0.4 }], ['nyb_birdman_chair', 14.9, 2.5, { h: 0.88, ry: -2.0, r: 0.4 }], ['nyb_birdman_chair', 10, 2.45, { h: 0.88, ry: PI, r: 0.35 }],
    ['nyb_milkcrate_pink', 14.4, 3.4, { h: 0.32 }], ['ph_cigarette_pack', 14.4, 3.4, { h: 0.1, y: 0.32, ry: 0.5 }],
  ],
  network: [
    ['nyb_network_radio', 17.05, 5.45, { h: 0.3, y: 0.8, ry: -PI / 2 }],
    ['ph_coffee_table_round_01', 7.0, 2.1, { h: 0.45, r: 0.65 }], ['ph_cigarette_pack', 6.8, 2.0, { h: 0.1, y: 0.45, ry: 0.3 }], ['ph_vintage_lighter', 7.15, 1.9, { h: 0.06, y: 0.45 }],
  ],
  gems: [
    ['nyb_gems_rough', 10, 1.0, { len: 0.42, y: 1.02, ry: 0.5, spin: 0.5, egg: ['The rough', 'gems_rough', 'The rough it came out of: a rock from Ethiopia with a galaxy asleep inside. Everybody on 47th Street wants to hold it. MLow only wanted to count the colours. He stopped at a thousand and eleven.'], snd: 'clink' }],
    ['nyb_gems_chair', 5.0, 4.05, { h: 0.85, ry: PI, r: 0.4 }], ['nyb_gems_chair', 15.0, 4.05, { h: 0.85, ry: PI, r: 0.4 }],
    ['nyb_gems_watch', 5.0, -0.75, { len: 0.3, y: 0.93, ry: PI / 2 }], ['nyb_gems_watch', 5.6, -0.75, { len: 0.3, y: 0.93, ry: PI / 2 }],
    ['nyb_gems_watch', 6.2, -0.75, { len: 0.3, y: 0.93, ry: PI / 2 }], ['nyb_gems_watch', 6.8, -0.75, { len: 0.3, y: 0.93, ry: PI / 2 }],
    ['nyb_gems_duck', 14.0, -0.75, { h: 0.2, y: 0.93, ry: 0.3 }],
    ['nyb_seccam_counted', 0.3, 1.6, { h: 0.3, y: 4.0, ry: 1.73 }], ['nyb_seccam_counted', 19.5, 6.8, { h: 0.3, y: 4.0, ry: -2.18 }],
    ['ph_Chandelier_03', 6, 1.0, { h: 1.0, y: 4.9 }], ['ph_Chandelier_03', 14, 1.0, { h: 1.0, y: 4.9 }],
  ],
  smoke: [
    ['nyb_smoke_humidor', 5.6, -0.6, { h: 1.9, ry: -PI / 2, r: 0.75 }],
    ['nyb_smoke_clock', 2.8, -7.86, { h: 0.6, y: 3.2, egg: ['The clock', 'smoke_clock', 'The shop clock stopped at eight years ago and nobody fixed it. It is right once a day, exactly when Auggie takes the picture. MLow keeps his at the same time.'], snd: 'tick' }],
    ['nyb_smoke_album', 14.3, 1.35, { len: 0.55, y: 1.0, ry: 0.2 }],
    ['ph_wooden_stool_01', 11.2, 2.35, { h: 0.7, r: 0.3 }], ['ph_wooden_stool_01', 12.5, 2.45, { h: 0.7, ry: 0.6, r: 0.3 }],
    ['ph_cigarette_pack', 11.3, 1.4, { h: 0.1, y: 1.0, ry: 0.3 }], ['ph_vintage_lighter', 11.6, 1.45, { h: 0.06, y: 1.0 }], ['ph_cigarette_case', 11.9, 1.5, { len: 0.3, y: 1.0, ry: -0.2 }],
  ],
  mail: [
    ['ph_round_wooden_table_01', 11.0, -1.0, { h: 0.75, r: 0.75 }],
    ['nyb_mail_daisies', 11.0, -1.0, { h: 1.35, y: 0.75, egg: ['The daisies', 'mail_daisy', 'Daisies are the friendliest flower, somebody typed once at two in the morning. The eye flower is friendlier. It looks back.'], snd: 'ding' }],
    ['ph_book_encyclopedia_set_01', 15.6, 3.8, { len: 0.5, y: 0.76, ry: 0.2 }],
    ['nyb_mail_shelf', 7.6, -3.0, { h: 1.9, r: 0.75 }], ['nyb_mail_shelf', 12.4, -3.0, { h: 1.9, r: 0.75 }],
    ['ph_Chandelier_01', 6, 0.5, { h: 0.9, y: 5.0 }], ['ph_Chandelier_01', 14, 0.5, { h: 0.9, y: 5.0 }],
    ['nyb_coffeecart', 18.6, 0.6, { len: 2.0, ry: -PI / 2, r: 0.9 }],
  ],
};

export const ROOM = {
  dogday(c, r, g, X, K) {
    // August, a hundred degrees, the air conditioning off: two brass fans do what they can
    const fans = [6, 14].map((x) => K.prop(r, g, X, 'nyb_dogday_fan', x, 0.6, { h: 0.55, y: 5.42 }));
    spinner(c, r, fans, 2.2);
    [[4.2, -1.0], [15.8, -1.0], [10, 4.2]].forEach(([x, z]) => lit(c, g, 'ph_mounted_fluorescent_lights', x, 5.94, z, { len: 1.5 }));
    // the pies, a stack of them by the door
    for (let k = 0; k < 3; k++) { const b = K.prop(r, g, X, 'nyb_dogday_pizza', 13.9, 2.3, { len: 0.52, y: k * 0.105, ry: k * 0.3 }); b.scale.y = 0.3; }
    c.post(X(13.9), 2.3, 0.35);
    // the ledger Sonny burned in the waste basket, still smoking
    K.steam(g, 12.7, 0.62, -2.75);
    // two tellers behind the bars
    K.extra(g, 6.8, -4.7, { col: 0x6a4a5a }); K.extra(g, 13.4, -4.8, { col: 0x4a5a6a, ry: -0.2 });
  },

  fame(c, r, g, X, K) {
    // the speaker rig strapped to the first cab's roof, the way Bruno's father did it
    const sp = K.prop(r, g, X, 'nyb_fame_speaker', 4, -2.6, { len: 1.2, y: 1.45 });
    c.clickable(sp, () => { [392, 523.3, 659.3, 784, 659.3, 784, 1046.5].forEach((f, k) => setTimeout(() => c.sound.note(f), k * 150)); c.egg('fame_speaker', 'Bruno\'s father bolted speakers to his cab and stopped West 46th Street dead. This rig only plays one station, MLow FM: three notes and the whole block is dancing.'); }, 'The speakers on the cab');
    // the street dances with you
    const ds = [[8.2, 0.6, 0xff4fa3], [12.6, 1.7, 0x22d3ee], [14.6, 1.2, 0xf5c542]].map(([x, z, col], k) => { c.post(X(x), z, 0.35); return K.extra(g, x, z, { col, ry: -0.3 + k * 0.3 }); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ds.forEach((e, k) => { e.position.y = Math.abs(Math.sin(t * 4 + k * 1.3)) * 0.22; e.rotation.y = Math.sin(t * 2 + k) * 0.7; }); });
  },

  annie(c, r, g, X, K) {
    // the brass glow of the sconces and chandeliers, no new lights
    [[0.45, -5.4], [0.45, -3.0], [19.3, -5.4], [19.3, -3.0]].forEach(([x, z]) => halo(c, K, g, x, 2.6, z, 'rgba(255,200,140,.45)', 0.9));
    [[4.5, 2.5], [15.5, 2.5], [10, 1]].forEach(([x, z]) => halo(c, K, g, x, 4.95, z, 'rgba(255,214,160,.5)', 1.8));
    // somebody on the lobby sofa, reading the paper rather than queueing
    K.extra(g, 0.75, -3.5, { seated: true, ry: PI / 2, col: 0x8a6a4a });
    // the hero poster gets its own marquee: a row of chasing bulbs under it and a warm wash on it
    K.bulbs(g, 17.1, 18.9, 0.82, -7.72, 12, 0xffe0a0); halo(c, K, g, 18.0, 1.95, -7.4, 'rgba(255,220,150,.35)', 2.6);
  },

  unisphere(c, r, g, X, K) {
    const { THREE } = c;
    // the neuralyzer, giant, on a steel plinth: look into the light
    const steel = K.std(0x8a8e96, { metalness: 1, roughness: 0.3 });
    g.add(c.slab(0.8, 0.9, 0.8, steel, 6.2, 0.45, 1.2)); c.post(X(6.2), 1.2, 0.55);
    const pl = c.sign('N3W MEMORY DEPT.\nDO NOT LOOK DIRECTLY', { w: 0.76, h: 0.26, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 }); pl.position.set(6.2, 0.62, 1.61); g.add(pl);
    const nz = K.prop(r, g, X, 'nyb_unisphere_neuralyzer', 6.2, 1.2, { len: 1.3, y: 0.9 }); nz.rotation.x = -PI / 2; nz.position.y = 0.9 + 0.65; nz.position.z = 1.2 + 0.17;
    const gl = halo(c, K, g, 6.2, 2.2, 1.37, 'rgba(120,255,230,.7)', 0.9);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; gl.material.opacity = 0.55 + Math.sin(t * 3) * 0.35; });
    c.clickable(nz, () => { c.flash(1); c.sound.beep(2400, 0.1, 0.4, 'sine'); c.egg('unisphere_neuralyzer', 'Look into the light. You never saw a pen this big in Queens, MLow never made one, and the World\'s Fair closed in 1965 without a single visitor from space. Carry on.'); }, 'The big pen');
    // his partner in black, by the crates
    c.post(X(15.4), 2.0, 0.35); K.extra(g, 15.4, 2.0, { col: 0x111114, ry: -0.5 });
  },

  mcmlow(c, r, g, X, K) {
    // the royal mop bucket on a red velvet cushion, a broom leaning on it
    g.add(c.slab(0.8, 0.42, 0.8, K.std(0x8a0f1e, { roughness: 0.95 }), 10, 0.21, 0.6)); g.add(c.slab(0.84, 0.05, 0.84, K.std(0xf5c542, { metalness: 1, roughness: 0.3 }), 10, 0.445, 0.6)); c.post(X(10), 0.6, 0.6);
    const br = K.prop(r, g, X, 'ph_wooden_broom', 10.32, 0.45, { h: 1.4, y: 0.47, ry: 0.5 }); br.rotation.z = -0.22;
    // red globe pendants over the tables
    [[4.4, -1.0], [13.2, -1.0], [15.8, -1.0], [10, 0.6]].forEach(([x, z]) => lit(c, g, 'nyb_mcmlow_lamp', x, 5.0, z, { h: 1.0, col: 0x7a1808, k: 0.8 }));
    // the line at the counter, and a regular at the window table
    [[8.2, -3.8, 0x2a6a4a], [11.8, -3.9, 0x6a2a6a]].forEach(([x, z, col]) => { K.extra(g, x, z, { ry: PI, col }); c.post(X(x), z, 0.3); });
    K.extra(g, 12.62, -1.0, { seated: true, ry: PI / 2, col: 0xd8b020 });
    const hire = c.sign('NOW HIRING. PRINCES WELCOME', { w: 3.4, h: 0.42, bg: '#c82a1a', fg: '#f5c542', font: c.MONO, weight: 700, border: '#f5c542' }); hire.position.set(0.15, 4.4, -3.0); hire.rotation.y = PI / 2; g.add(hire);
  },

  bramford(c, r, g, X, K) {
    const { THREE } = c;
    // brass sconces on both corridor walls, round the old bulbs
    [-3, 0, 3].forEach((z) => { K.prop(r, g, X, 'nyb_bramford_sconce', 7.66, z, { h: 0.4, y: 2.12, ry: PI / 2 }); K.prop(r, g, X, 'nyb_bramford_sconce', 12.34, z, { h: 0.4, y: 2.12, ry: -PI / 2 }); });
    // two lanterns down the middle
    [-2.5, 3.5].forEach((z) => { K.prop(r, g, X, 'ph_lantern_chandelier_01', 10, z, { h: 0.9, y: 5.05 }); halo(c, K, g, 10, 5.4, z, 'rgba(255,180,100,.55)', 1.6); });
    // a runner down the corridor, worn, with the eye in its border
    const run = K.decal(2.4, 12.6, (q, w, h) => { q.fillStyle = '#4a0e12'; q.fillRect(0, 0, w, h); q.strokeStyle = '#b8902a'; q.lineWidth = w * 0.04; q.strokeRect(w * 0.06, w * 0.06, w * 0.88, h - w * 0.12);
      for (let k = 0; k < 9; k++) K.eyeFlower(q, w / 2, h * (k + 0.5) / 9, w * 0.16, '#e8c8b0', '#8a2a2a'); q.globalAlpha = 0.18; for (let i = 0; i < 2500; i++) { q.fillStyle = Math.random() < 0.5 ? '#000' : '#c8a070'; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, 512);
    run.rotation.x = -PI / 2; run.position.set(10, 0.013, -0.2); g.add(run);
    // the Scrabble tiles on the side table in the west hall: Rosemary's anagram, our version
    const tiles = K.decal(0.5, 0.36, (q, w, h) => { q.fillStyle = '#7a1a1a'; q.fillRect(0, 0, w, h); const rows = ['ALL OF', 'THEM', 'COUNTED']; q.font = `700 ${h * 0.13}px serif`; q.textAlign = 'center'; q.textBaseline = 'middle';
      rows.forEach((s, j) => { const n = s.length, tw = w * 0.11; [...s].forEach((ch, i) => { if (ch === ' ') return; const x = w / 2 + (i - (n - 1) / 2) * tw * 1.08, y = h * (0.22 + j * 0.28); q.fillStyle = '#f0e2bc'; q.fillRect(x - tw / 2, y - tw / 2, tw, tw); q.fillStyle = '#1a1210'; q.fillText(ch, x, y); }); }); }, 256);
    tiles.rotation.x = -PI / 2; tiles.position.set(3.5, 0.612, -0.2); g.add(tiles);
    // a neighbour in the east hall, watching the corridor
    K.extra(g, 14.4, 4.2, { col: 0x5a3a5a, ry: -PI / 2 }); c.post(X(14.4), 4.2, 0.3);
  },

  apartment(c, r, g, X, K) {
    // the nineteenth floor's grid of fluorescent tubes, lit
    [[3.2, 4.2], [6.4, 4.2], [3.2, 1.2], [6.4, 1.2], [9.6, 2.4], [9.6, -1.6]].forEach(([x, z]) => lit(c, g, 'ph_mounted_fluorescent_lights', x, 5.94, z, { len: 1.5, k: 0.9 }));
  },

  chase(c, r, g, X, K) {
    // the Lincoln takes room: three posts along it; steam from the manhole; two people waiting for the train
    [-1.6, 0, 1.6].forEach((z) => c.post(X(7.7), z, 0.95));
    K.steam(g, 10.2, 0.05, 4.0);
    [[5.0, -5.6, 0x5a4a3a, 0.4], [14.8, -5.8, 0x3a3a5a, -0.3]].forEach(([x, z, col, ry]) => { K.extra(g, x, z, { col, ry }); c.post(X(x), z, 0.3); });
  },

  birdman(c, r, g, X, K) {
    const { THREE } = c;
    // the dressing room mirror, carried up to the roof: a table, the mirror, a frame of bulbs
    g.add(c.slab(1.6, 0.76, 0.55, K.std(0x1a1a1a, { roughness: 0.5 }), 10, 0.38, 1.6)); c.post(X(10), 1.6, 0.8);
    K.prop(r, g, X, 'nyb_birdman_vanity', 10, 1.4, { h: 1.3, y: 0.76, egg: ['The mirror', 'birdman_vanity', 'A note on the dressing room mirror: a thing is a thing, not what is said of that thing. Up here a New Yorker is a New Yorker, whatever the reviews say. Counted.'], snd: 'pop' });
    const bm = K.basic(0xfff0c8), bg = new THREE.SphereGeometry(0.04, 10, 8);
    for (let k = 0; k < 7; k++) { const y = 0.95 + k * 0.17; [-0.52, 0.52].forEach((dx) => { const b = new THREE.Mesh(bg, bm); b.position.set(10 + dx, y, 1.42); g.add(b); }); }
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(bg, bm); b.position.set(9.6 + k * 0.16, 2.2, 1.42); g.add(b); }
    halo(c, K, g, 10, 1.5, 1.5, 'rgba(255,240,200,.35)', 2.4);
    K.prop(r, g, X, 'ph_cigarette_pack', 9.5, 1.65, { h: 0.1, y: 0.76, ry: 0.4 }); K.prop(r, g, X, 'ph_vintage_lighter', 10.5, 1.7, { h: 0.06, y: 0.76 });
    // a stagehand on his break
    K.extra(g, 13.6, 3.4, { seated: true, ry: -0.7, col: 0x2a2a2a });
    // a string of bulbs across the roof
    K.bulbs(g, 1.2, 18.8, 4.4, -0.6, 34, 0xffe0a0);
  },

  network(c, r, g, X, K) {
    const { THREE } = c;
    // the control room's monitor stack, every screen the same face
    const sg = new THREE.Group(); sg.position.set(5.2, 0, -1.6); sg.rotation.y = 0.45; g.add(sg); c.post(X(5.2), -1.6, 1.3);
    const steel = K.std(0x2a2a2e, { metalness: 0.8, roughness: 0.4 });
    sg.add(c.slab(2.5, 0.05, 0.6, steel, 0, 0.5, 0)); sg.add(c.slab(2.5, 0.05, 0.6, steel, 0, 1.08, 0)); sg.add(c.slab(2.5, 0.05, 0.6, steel, 0, 1.68, 0));
    [-1.22, 1.22].forEach((x) => sg.add(c.slab(0.05, 1.7, 0.6, steel, x, 0.85, 0)));
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) K.prop(r, sg, X, 'nyb_network_tv', -0.8 + i * 0.8, 0, { h: 0.5, y: 0.525 + j * 0.58, ry: (i - 1) * -0.08 });
    const oa = c.sign('ON AIR', { w: 1.0, h: 0.3, bg: '#2a0000', fg: '#ff3b3b', font: c.MONO, weight: 700, glow: 14 }); oa.position.set(0, 1.92, 0.05); sg.add(oa);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; oa.visible = Math.sin(t * 2.2) > -0.6; });
    c.clickable(sg, () => { c.sound.chant(0.3); c.egg('network_tv', 'Six monitors, one face, live from the window. The ratings went through the roof. MLow never reads the ratings. He counts the people at the windows.'); }, 'The monitors');
    [[5.2, -1.6], [11, 1.0]].forEach(([x, z]) => lit(c, g, 'ph_mounted_fluorescent_lights', x, 5.94, z, { len: 1.5, k: 0.5 }));
  },

  gems(c, r, g, X, K) {
    const { THREE } = c;
    // the rough in a glass vitrine on a plinth, between the cases
    g.add(c.slab(0.7, 1.0, 0.7, K.std(0x14101a, { roughness: 0.4 }), 10, 0.5, 1.0)); c.post(X(10), 1.0, 0.5);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.62), new THREE.MeshStandardMaterial({ color: 0xd0f0ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2, depthWrite: false })); box.position.set(10, 1.27, 1.0); g.add(box);
    const lb = c.sign('ROUGH, 1,111 CT. NOT FOR SALE', { w: 0.68, h: 0.12, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); lb.position.set(10, 0.85, 1.36); g.add(lb);
    const gl = halo(c, K, g, 10, 1.25, 1.0, 'rgba(160,120,255,.6)', 1.0);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; gl.material.opacity = 0.5 + Math.sin(t * 1.7) * 0.3; });
    [6, 14].forEach((x) => halo(c, K, g, x, 4.6, 1.0, 'rgba(255,240,220,.5)', 1.8));
  },

  smoke(c, r, g, X, K) {
    // a ceiling fan turning over the counter; the regulars on their stools
    const fan = K.prop(r, g, X, 'ph_ceiling_fan', 10, 2.0, { h: 0.5, y: 5.48 }); spinner(c, r, [fan], 1.8);
    [K.extra(g, 11.2, 2.35, { seated: true, ry: PI, col: 0x5a4a3a }), K.extra(g, 12.5, 2.45, { seated: true, ry: PI + 0.5, col: 0x3a4a5a })].forEach((e) => { e.position.y = 0.26; });
    // the humidor as an island: its sign on top, cigar boxes in every cubby
    const hs = c.sign('BROOKLYN COUNT CO.\nCIGARS, PAPERS, LOTTO', { w: 1.4, h: 0.42, bg: '#1a0e08', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' }); hs.position.set(5.6, 2.15, -0.6); g.add(hs);
    const hs2 = hs.clone(); hs2.rotation.y = PI; hs2.position.z = -0.62; g.add(hs2);
    const cb = [0x8a3a1a, 0xc8a050, 0x2a4a2a, 0x6a1a1a, 0xd8c8a0].map((h) => K.std(h, { roughness: 0.6 }));
    [0.6, 1.02, 1.44].forEach((y, j) => [-0.42, 0, 0.42].forEach((dx, i) => { for (let k = 0; k < 2; k++) g.add(c.slab(0.32, 0.07, 0.24, cb[(i + j + k) % 5], 5.6 + dx, y + 0.035 + k * 0.075, -0.6)); }));
    const lotto = c.sign('LOTTO. COUNTED DAILY', { w: 1.6, h: 0.3, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700, border: '#ff4fa3' }); lotto.position.set(13.8, 0.62, 1.66); g.add(lotto);
  },

  mail(c, r, g, X, K) {
    // story hour: three small New Yorkers on the stools, a reader in the rocker
    [[4, 1.4], [6, 1.4], [5, 0.8]].forEach(([x, z], k) => { const e = K.extra(g, x, z, { seated: true, ry: Math.atan2(5 - x, 3.6 - z), col: [0xff4fa3, 0x22d3ee, 0xf5c542][k] }); e.scale.setScalar(0.62); e.position.y = 0.35 - 0.45 * 0.62 + 0.02; });
    K.extra(g, 5, 3.6, { seated: true, ry: PI, col: 0x2a4a8a });
    [6, 14].forEach((x) => halo(c, K, g, x, 4.85, 0.5, 'rgba(255,220,170,.5)', 1.8));
    // the children's shelves, filled
    const { THREE } = c, N = 160, bk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.24, 0.17), new THREE.MeshStandardMaterial({ roughness: 0.7 }), N), m4 = new THREE.Matrix4(), col = new THREE.Color(); g.add(bk);
    let n = 0; [7.6, 12.4].forEach((sx) => { for (let s = 0; s < 4; s++) for (let b = 0; b < 20 && n < N; b++) { const h = 0.18 + Math.random() * 0.08; m4.makeScale(1, h / 0.24, 1); m4.setPosition(sx - 0.5 + b * 0.052, 0.36 + s * 0.31 + h / 2, -3.0); bk.setMatrixAt(n, m4); bk.setColorAt(n++, col.setHSL([0.92, 0.52, 0.13, 0.6][(b + s) % 4], 0.65, 0.55)); } });
    bk.count = n; bk.instanceMatrix.needsUpdate = true; bk.instanceColor.needsUpdate = true;
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  dogday: { CashRegister_01: 'nyb_register_gold', Television_01: 'nyb_tv_eye', metal_office_desk: 'nyb_dogday_desk' },
  fame: { wooden_crate_01: 'nyb_fame_crate_a', wooden_crate_02: 'nyb_fame_crate_b' },
  annie: { CashRegister_01: 'nyb_register_gold', Chandelier_02: 'nyb_annie_chandelier' },
  unisphere: { modular_street_seating: 'nyb_unisphere_bench', metal_trash_can: 'nyb_trash_dsny', street_lamp_02: 'nyb_lamp_nazar' },
  mcmlow: { CashRegister_01: 'nyb_mcmlow_register', WetFloorSign_01: 'nyb_mcmlow_wetfloor', hamburger_buns: 'nyb_mcmlow_bigcount' },
  bramford: { vintage_suitcase: 'nyb_bramford_suitcase', ornate_mirror_01: 'nyb_bramford_mirror', vintage_grandfather_clock_01: 'nyb_bramford_clock' },
  chase: { metal_trash_can: 'nyb_trash_dsny', fire_hydrant: 'nyb_hydrant_gold', cardboard_box_01: 'nyb_chase_box' },
  birdman: { security_light: 'nyb_birdman_seclight' },
  network: { Television_01: 'nyb_tv_eye', Sofa_01: 'nyb_network_sofa', ArmChair_01: 'nyb_network_chair' },
  gems: { CashRegister_01: 'nyb_register_gold', security_light: 'nyb_gems_light' },
  smoke: { metal_trash_can: 'nyb_trash_dsny', WoodenChair_01: 'nyb_smoke_chair', Camera_01: 'nyb_smoke_camera' },
  mail: { Rockingchair_01: 'nyb_mail_rocker', wooden_stool_01: 'nyb_mail_stool' },
};
