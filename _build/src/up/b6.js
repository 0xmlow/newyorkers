// Round twelve, batch 6: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Builder 6: crowd, producers, devils, diehard, dundee, dolly, stuart, sweetsmell, scent, splash, afterhours, crown, trading.
// Every nyb_<set>_* model is a Poly Haven CC0 prop repainted and labelled in Blender (_build/brand/b6.json).
const PI = Math.PI, H2 = Math.PI / 2;

// a pole for a wall phone, a fire alarm box or a hitching post, planted on the floor
const pole = (c, K, g, x, z, h, col = 0x2a2e34, w = 0.08) => { g.add(c.slab(w, h, w, K.std(col, { metalness: 0.6, roughness: 0.4 }), x, h / 2, z)); };
// a plinth for a museum piece
const plinth = (c, K, g, X, x, z, h, w = 0.6, col = 0xece6da) => { g.add(c.slab(w, h, w, K.std(col, { roughness: 0.7 }), x, h / 2, z)); c.post(X(x), z, w * 0.75); };
// spin something only while its set is the one you are in
const spinner = (c, r, objs, sp) => c.tick((t, dt, P, ri) => { if (ri !== r.i) return; objs.forEach((o, k) => { o.rotation.y += dt * sp * (k % 2 ? 0.9 : 1); }); });
// some Poly Haven shutters are one sided and face the wall: once loaded, draw both faces
const twoSided = (c, o) => { let done = false; c.tick(() => { if (done || !o.userData.ready) return; done = true; o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.side = c.THREE.DoubleSide; } }); }); return o; };
// a flat floor decal (a rug, paper on the floor)
const floorDecal = (K, g, w, h, x, z, draw, ry = 0, px = 256) => { const d = K.decal(w, h, draw, px); d.rotation.set(-H2, 0, ry); d.position.set(x, 0.013, z); g.add(d); return d; };

export const PROPS = {
  // ---------- The Crowd, 1928: the Atlas office, 29th floor
  crowd: [
    ['nyb_crowd_clock', 19.6, 0.5, { h: 2.8, y: 2.1, ry: -H2, egg: ['The office clock', 'crowd_five', 'Five o’clock at Atlas: two hundred clerks stand up as one and pour into the lifts. MLow stayed behind and counted every empty chair.'], snd: 'bell' }],
    ['side_table_tall_01', 19.35, 0.5, { h: 0.78, r: 0.3 }], ['nyb_crowd_cooler', 19.35, 0.5, { h: 0.5, y: 0.78 }],
    ['nyb_crowd_files', 0.32, 6.3, { h: 1.25, ry: H2, r: 0.5 }], ['nyb_crowd_files', 0.32, 7.35, { h: 1.25, ry: H2 }], ['nyb_crowd_files', 0.32, 0.6, { h: 1.25, ry: H2, r: 0.5 }],
    ['office_notepads', 3.3, 4.55, { len: 0.3, y: 0.775, ry: 0.3 }], ['vintage_stapler', 5.25, 4.45, { len: 0.18, y: 0.775, ry: -0.5 }],
    ['binder_notebook', 14.75, 4.5, { len: 0.32, y: 0.775, ry: 0.2 }], ['stationery_supplies', 17.35, 4.5, { len: 0.25, y: 0.775, ry: -0.3 }],
  ],
  // ---------- The Producers, 1967: the fountain at Lincoln Center, opening night
  producers: [
    ['nyb_producers_till', 3.4, 0.4, { h: 1.0, y: 1.02, ry: 0.5, egg: ['The box office till', 'producers_till', 'Twenty five thousand percent of one show, sold to every little old lady on Park Avenue. MLow sells a hundred percent of a New Yorker, once, and counts it.'], snd: 'ticket' }],
    ['nyb_producers_light', 6.6, -5.7, { h: 0.85, ry: 0.4, r: 0.45 }], ['nyb_producers_light', 13.4, -5.7, { h: 0.85, ry: -0.4, r: 0.45 }],
    ['nyb_producers_cafe', 4.2, -2.8, { h: 0.86, ry: -0.5, r: 0.85 }], ['nyb_producers_cafe', 15.4, -1.4, { h: 0.86, ry: 0.4, r: 0.85 }],
    ['wine_bottles_01', 4.2, -2.8, { h: 0.3, y: 0.72 }], ['brass_goblets', 15.4, -1.4, { h: 0.18, y: 0.72 }],
    ['nyb_producers_planter', 5.2, 6.7, { len: 1.1, r: 0.5 }], ['nyb_producers_planter', 14.8, 6.7, { len: 1.1, r: 0.5 }],
    ['nyb_producers_planter', 0.75, -0.6, { len: 1.1, ry: H2, r: 0.5 }], ['nyb_producers_planter', 19.25, -0.6, { len: 1.1, ry: -H2, r: 0.5 }],
    ['shrub_01', 5.2, 6.7, { h: 0.8, y: 0.38 }], ['shrub_01', 14.8, 6.7, { h: 0.8, y: 0.38 }], ['shrub_02', 0.75, -0.6, { h: 0.8, y: 0.38 }], ['shrub_02', 19.25, -0.6, { h: 0.8, y: 0.38 }],
    ['nyb_trash_dsny', 12.2, 6.0, { h: 0.9, r: 0.35 }],
  ],
  // ---------- The Devil's Advocate, 1997: the penthouse
  devils: [
    ['nyb_devils_mirror', 19.6, 0.4, { h: 2.3, y: 1.0, ry: -H2, egg: ['A gold mirror', 'devils_mirror', 'Vanity, his favourite sin, in a gold frame. Stand here long enough and the man in the mirror asks to be counted first.'], snd: 'drone' }],
    ['nyb_devils_bar', 19.1, 6.2, { h: 2.1, ry: -H2, r: 0.8 }],
    ['nyb_devils_sofa', 7.4, -1.0, { len: 2.6, ry: -H2, r: 0.7 }], ['coffee_table_round_01', 5.1, -1.0, { len: 1.0, r: 0.5 }],
    ['brass_goblets', 5.0, -1.1, { h: 0.16, y: 0.45 }], ['wine_bottles_01', 5.3, -0.8, { h: 0.3, y: 0.45 }],
    ['nyb_devils_chair', 3.2, 1.0, { h: 0.85, ry: 2.6, r: 0.45 }],
    ['side_table_tall_01', 5.8, -6.5, { h: 0.95, r: 0.3 }], ['nyb_devils_lion', 5.8, -6.5, { h: 0.55, y: 0.95, ry: 0.2 }],
    ['side_table_tall_01', 14.2, -6.5, { h: 0.95, r: 0.3 }], ['nyb_devils_lion', 14.2, -6.5, { h: 0.55, y: 0.95, ry: -0.2 }],
    ['side_table_tall_01', 18.0, 6.9, { h: 0.8 }], ['brass_vase_02', 18.0, 6.9, { h: 0.5, y: 0.8 }],
    ['Chandelier_03', 6.4, -1.0, { h: 1.3, y: 4.6 }], ['Chandelier_03', 14.2, 0.6, { h: 1.3, y: 4.6 }],
    ['nyb_devils_table', 14.2, 0.6, { len: 2.3, r: 1.0 }], ['nyb_scent_chair', 13.6, -0.25, { h: 1.0, ry: 0 }], ['nyb_scent_chair', 14.8, -0.25, { h: 1.0, ry: 0 }], ['nyb_scent_chair', 13.6, 1.45, { h: 1.0, ry: PI }], ['nyb_scent_chair', 14.8, 1.45, { h: 1.0, ry: PI }],
    ['nyb_scent_candle', 13.7, 0.6, { h: 0.32, y: 0.88 }], ['nyb_scent_candle', 14.7, 0.6, { h: 0.32, y: 0.88 }], ['brass_goblets', 14.2, 0.45, { h: 0.16, y: 0.88 }],
    ['potted_plant_02', 1.0, 6.8, { h: 1.5, r: 0.4 }],
  ],
  // ---------- Die Hard with a Vengeance, 1995: the park fountain
  diehard: [
    ['nyb_diehard_phone', 5.4, 5.45, { h: 0.76, y: 0.82, ry: -1.9, egg: ['A payphone on a post', 'diehard_simon', 'Simon says pick up. Every payphone in this park rings for whoever is nearest, and in NEW YORKERS that is always you. Counted, with a three minute warning.'], snd: 'bell' }],
    ['nyb_diehard_cart', 17.9, -0.9, { len: 2.1, ry: -H2, r: 0.7 }],
    ['nyb_milkcrate_cyan', 16.4, 1.2, { h: 0.32, ry: 0.3, r: 0.3 }], ['nyb_diehard_water', 16.4, 1.2, { h: 0.45, y: 0.32, ry: 0.4 }],
    ['nyb_diehard_water', 16.9, 1.6, { h: 0.45, ry: -0.6 }], ['nyb_diehard_water', 15.95, 1.55, { h: 0.45, ry: 2.2 }],
    ['nyb_barrier', 5.2, -5.9, { len: 1.8, ry: 0.15 }], ['nyb_barrier', 14.8, -5.9, { len: 1.8, ry: -0.15 }],
    ['nyb_hydrant_pink', 5.6, 6.6, { h: 0.85, r: 0.3 }], ['shrub_01', 1.0, -0.4, { h: 1.0, r: 0.5 }], ['shrub_02', 19.0, 6.6, { h: 1.0, r: 0.5 }], ['shrub_01', 1.0, 6.8, { h: 1.0, r: 0.5 }],
    ['trashbag', 3.3, 5.6, { h: 0.55, ry: 0.4 }], ['trashbag', 2.0, 5.5, { h: 0.5, ry: 2.0 }],
    ['nyb_utility_bomb', 19.35, -6.4, { h: 1.1, ry: -H2, r: 0.4 }],
  ],
  // ---------- Crocodile Dundee, 1986: a street off Fifth
  dundee: [
    ['nyb_dundee_luggage', 16.9, 1.6, { len: 1.1, ry: -0.3, r: 0.45 }],
    ['planter_box_01', 15.4, 6.6, { len: 1.0, r: 0.45 }], ['shrub_02', 15.4, 6.6, { h: 0.8, y: 0.38 }],
    ['nyb_aircon', 0.3, 6.6, { len: 1.3, y: 2.8, ry: H2 }], ['nyb_aircon', 0.3, -0.2, { len: 1.3, y: 3.0, ry: H2 }],
    ['nyb_payphone', 3.4, -5.7, { h: 0.74, y: 0.85, ry: 0.4, r: 0.3 }],
    ['trashbag', 1.7, 5.6, { h: 0.55, ry: 0.4 }], ['trashbag', 3.3, 5.4, { h: 0.5, ry: 1.4 }],
    ['hotdog', 3.6, -2.4, { h: 2.0, ry: 0.8, r: 0.6, raw: true }],
  ],
  // ---------- Hello, Dolly!, 1969 (New York, 1890): 14th Street, parade day
  dolly: [
    ['nyb_dolly_banner', 10.9, -4.2, { h: 4.0, ry: H2, r: 0.25 }], ['nyb_dolly_banner', 10.9, 1.4, { h: 4.0, ry: H2, r: 0.25 }], ['nyb_dolly_banner', 17.3, -1.4, { h: 4.0, ry: -H2, r: 0.25 }],
    ['nyb_dolly_clock', 6.2, -5.6, { h: 2.6, ry: 0.2, r: 0.4 }],
    ['wooden_crate_02', 4.4, 6.5, { len: 0.9, ry: 0.1, r: 0.5 }], ['nyb_dolly_basket', 4.4, 6.5, { len: 0.5, y: 0.38, ry: -0.3, egg: ['A matchmaker’s basket', 'dolly_arrange', 'Mrs. Dolly Levi arranges things: marriages, parades, a feed merchant’s whole life. Hand her your name and she will have you counted by noon, and married by one.'], snd: 'clink' }],
    ['wooden_crate_01', 7.2, 6.6, { len: 0.9, ry: -0.1, r: 0.5 }], ['wicker_basket_01', 7.0, 6.6, { len: 0.45, y: 0.36 }], ['food_apple_01', 7.4, 6.55, { len: 0.12, y: 0.37 }], ['lemon', 7.5, 6.7, { len: 0.1, y: 0.37 }],
    ['painted_wooden_bench', 6.0, -1.6, { len: 1.6, ry: -H2, r: 0.55 }], ['Barrel_01', 17.4, 6.9, { h: 0.95, r: 0.4 }],
    ['popcorn', 3.2, 1.4, { h: 1.7, ry: 0.7, r: 0.5, raw: true }],
  ],
  // ---------- Stuart Little, 1999: Conservatory Water
  stuart: [
    ['WoodenTable_02', 16.4, 1.95, { len: 1.2, r: 0.65 }],
    ['nyb_stuart_wasp', 16.4, 1.95, { len: 1.5, y: 0.78, ry: 0.15 }],
    ['nyb_stuart_toolbox', 17.7, 2.3, { len: 0.55, ry: -0.4 }], ['vintage_radio_transceiver', 9.4, 6.4, { len: 0.36, y: 0.47, ry: PI + 0.3 }],
    ['nyb_stuart_cat', 18.2, -3.4, { h: 0.6, ry: -H2 - 0.3, r: 0.3, egg: ['A white cat by the pond', 'stuart_snowbell', 'Snowbell, the family cat, watching the boat pond and pretending not to. MLow counted him as a New Yorker. He has filed a complaint.'], snd: 'meow' }],
    ['nyb_stuart_duck', 12.6, 0.6, { h: 0.34, ry: 2.4, bob: 1.6 }],
    ['nyb_stuart_buoy', 19.6, 0.7, { h: 0.75, y: 2.05, ry: -H2 }], ['nyb_coffeecart', 18.9, 0.7, { len: 2.0, ry: -H2, r: 0.75 }],
    ['planter_box_01', 7.6, 6.7, { len: 1.0, r: 0.45 }], ['planter_box_01', 12.4, 6.7, { len: 1.0, r: 0.45 }], ['shrub_01', 7.6, 6.7, { h: 0.8, y: 0.38 }], ['shrub_02', 12.4, 6.7, { h: 0.8, y: 0.38 }],
  ],
  // ---------- Sweet Smell of Success, 1957: Times Square at night
  sweetsmell: [
    ['nyb_sweet_pack', 11.8, -5.3, { h: 2.2, ry: -0.35, r: 0.75, egg: ['A giant pack of smokes', 'sweetsmell_pack', 'N3W YORKERS FILTERS: the billboard across the square sells the rings, this one sells the pack. Sixty million readers took the columnist at his word. Here, only the count is printed.'], snd: 'whoosh' }],
    ['nyb_sweet_alarm', 5.6, 6.5, { h: 0.5, y: 1.0, ry: PI - 0.4, r: 0.2 }],
    ['nyb_sweet_papers', 4.9, 5.25, { h: 0.36, ry: 0.4 }], ['nyb_sweet_papers', 5.35, 5.0, { h: 0.32, y: 0.36, ry: -0.2 }],
    ['side_table_tall_01', 1.0, 0.8, { h: 0.8, r: 0.3 }], ['nyb_sweet_tv', 1.0, 0.8, { h: 0.45, y: 0.8, ry: H2 }],
    ['nyb_aircon', 0.3, 6.8, { len: 1.3, y: 3.0, ry: H2 }], ['nyb_aircon', 19.4, 0.8, { len: 1.3, y: 3.0, ry: -H2 }],
    ['nyb_trash_dsny', 8.0, 6.5, { h: 0.9, r: 0.35 }], ['trashbag', 1.2, -6.2, { h: 0.55 }], ['trashbag', 2.0, -6.4, { h: 0.5, ry: 1.2 }],
    ['nyb_sweet_lamp', 18.6, 6.6, { h: 4.4, r: 0.25 }],
  ],
  // ---------- Scent of a Woman, 1992: the ballroom
  scent: [
    ['nyb_scent_clock', 13.6, -6.0, { h: 2.6, r: 0.45, egg: ['A gold clock by the band', 'scent_clock', 'The ballroom clock keeps tango time: slow, slow, quick quick, slow. A tango has no mistakes, only a man who keeps counting. MLow keeps counting.'], snd: 'tick' }],
    ['side_table_tall_01', 6.9, -5.9, { h: 0.85, r: 0.3 }], ['nyb_scent_candle', 6.9, -5.9, { h: 0.4, y: 0.85 }],
    ['nyb_scent_sofa', 19.15, -5.3, { len: 2.6, ry: -H2, r: 0.7 }], ['nyb_scent_sofa', 0.65, 0.4, { len: 2.4, ry: H2, r: 0.7 }],
    ['nyb_scent_mirror', 19.6, 1.0, { h: 2.2, y: 0.9, ry: -H2 }],
    ['wine_bottles_01', 6.4, 6.55, { h: 0.3, y: 0.76 }], ['brass_goblets', 13.6, 6.55, { h: 0.16, y: 0.76 }], ['brass_goblets', 2.6, -4.4, { h: 0.16, y: 0.76 }],
    ['potted_plant_02', 1.0, 7.1, { h: 1.6, r: 0.4 }], ['potted_plant_02', 19.1, -1.9, { h: 1.6, r: 0.4 }],
    ['nyb_scent_chandelier', 4.0, 2.0, { h: 1.1, y: 4.8 }], ['nyb_scent_chandelier', 16.0, 2.0, { h: 1.1, y: 4.8 }],
  ],
  // ---------- Splash, 1984: the tank in the lab
  splash: [
    ['nyb_splash_buoy', 7.0, -0.7, { h: 0.85, y: 1.5 }],
    ['nyb_splash_sign', 11.8, -0.2, { h: 0.75, ry: -0.3, r: 0.3, egg: ['A wet floor sign', 'splash_wetfloor', 'Caution, mermaid crossing. She came up out of the tank on her own two legs and left a wet trail all the way down Madison Avenue. MLow mopped, then counted the footprints.'], snd: 'drip' }],
    ['nyb_splash_air', 4.75, -0.25, { h: 0.62, r: 0.25 }], ['nyb_splash_air', 4.35, 0.25, { h: 0.62, ry: 1.2, r: 0.25 }],
    ['nyb_splash_shell', 8.2, -3.2, { len: 0.5, ry: 0.6 }], ['nyb_splash_shell', 12.4, -1.6, { len: 0.4, ry: 2.0 }], ['nyb_splash_shell', 15.2, 4.75, { len: 0.3, y: 0.78, ry: 1.0 }],
    ['coast_rocks_01', 12.6, -4.6, { len: 1.6 }], ['coast_rocks_01', 6.8, -4.9, { len: 1.2, ry: 2.0 }],
    ['vintage_microscope', 16.1, 4.4, { h: 0.34, y: 0.78, ry: -0.5 }], ['chemistry_set', 15.3, 4.95, { len: 0.4, y: 0.78, ry: 0.2 }],
    ['mounted_fluorescent_lights', 4.0, 3.0, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 16.0, 3.0, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 10.0, 4.6, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 2.6, -3.4, { len: 1.3, y: 5.92 }],
    ['wall_clock', 19.6, 0.7, { h: 0.45, y: 2.9, ry: -H2 }], ['tool_cart', 3.0, 2.0, { h: 0.9, ry: 0.3, r: 0.45 }], ['nyb_seccam_counted', 19.6, -7.6, { h: 0.3, y: 4.2, ry: -2.4 }],
  ],
  // ---------- After Hours, 1985: Spring Street, 3 A.M.
  afterhours: [
    ['nyb_afterhours_plaster', 6.4, -5.2, { h: 1.75, ry: 0.35, r: 0.75, egg: ['A plaster figure', 'afterhours_plaster', 'Untitled (Paul): a man under a coat of plaster in a SoHo loft, safe from the mob at last. Two men loaded him into a van at dawn. MLow counted him before the plaster set.'], snd: 'thud' }],
    ['nyb_afterhours_phone', 3.0, 0.9, { h: 0.76, y: 0.82, ry: 1.0, r: 0.3 }],
    ['nyb_aircon', 0.3, 6.6, { len: 1.3, y: 3.0, ry: H2 }],
    ['trashbag', 3.6, -6.1, { h: 0.6 }], ['trashbag', 1.9, -6.5, { h: 0.5, ry: 1.3 }], ['trashbag', 1.0, -5.6, { h: 0.55, ry: 2.6 }],
    ['cardboard_box_01', 3.2, -5.0, { h: 0.45, ry: 0.5 }], ['cardboard_box_01', 3.3, -5.1, { h: 0.35, y: 0.45, ry: 1.3 }],
    ['hand_truck', 13.6, -0.6, { h: 1.2, ry: 0.8 }],
    ['nyb_afterhours_cab', 10.6, -4.6, { len: 4.6, ry: -0.06, r: 0.9 }],
  ],
  // ---------- The Thomas Crown Affair, 1999: the Impressionist galleries
  crown: [
    ['nyb_crown_frame', 15.4, -0.9, { len: 1.9, y: 0.95, ry: -1.0, egg: ['An empty gold frame', 'crown_frame', 'The frame is still here; the painting is out on the town. The thief always returns them, a little cleaner. This frame now reads: counted, by MLow.'], snd: 'ding' }],
    ['nyb_crown_degas', 6.2, -0.4, { h: 0.55, y: 1.0, ry: 0.5 }], ['nyb_crown_vase', 13.8, -0.4, { h: 0.6, y: 1.0, ry: -0.3 }],
    ['nyb_crown_case', 13.4, -2.0, { len: 0.9, ry: -0.4 }],
    ['nyb_seccam_counted', 0.4, -7.6, { h: 0.3, y: 4.4, ry: 2.4 }], ['nyb_seccam_counted', 19.6, -7.6, { h: 0.3, y: 4.4, ry: -2.4 }],
    ['bronze_whale_statue', 17.6, -6.3, { h: 0.9, y: 0.8, ry: -0.6 }],
    ['WoodenChair_01', 1.0, 6.8, { h: 0.95, ry: PI - 0.6, r: 0.35 }],
  ],
  // ---------- Trading Places, 1983: the orange juice pit
  trading: [
    ['nyb_trading_case', 14.4, 5.7, { len: 1.0, y: 0.95, ry: -0.9, egg: ['Two briefcases', 'trading_report', 'Two briefcases, one crop report. Swap the real one for the fake and two brothers buy every orange in Florida on bad information. MLow kept the real one, and counted the oranges.'], snd: 'ticket' }],
    ['nyb_trading_clock', 0.12, -6.6, { h: 0.6, y: 4.0, ry: H2 }], ['nyb_trading_clock', 0.12, -4.2, { h: 0.6, y: 4.0, ry: H2 }], ['nyb_trading_clock', 0.12, -1.8, { h: 0.6, y: 4.0, ry: H2 }],
    ['nyb_trading_tv', 7.4, -1.6, { h: 0.6, y: 4.3, ry: 0.4 }], ['nyb_trading_tv', 12.6, -1.6, { h: 0.6, y: 4.3, ry: -0.4 }], ['nyb_trading_tv', 10.0, -5.4, { h: 0.6, y: 4.3, ry: PI }],
    ['nyb_trading_desk', 0.75, 6.5, { len: 1.8, ry: H2, r: 0.6 }], ['nyb_trading_desk', 19.2, -6.2, { len: 1.8, ry: -H2, r: 0.6 }],
    ['office_notepads', 0.7, 6.1, { len: 0.3, y: 0.78, ry: 0.4 }], ['clipboard', 19.15, -6.6, { len: 0.3, y: 0.78, ry: -1.2 }],
    ['nyb_trading_crate', 15.4, 6.6, { len: 0.8, ry: 0.1, r: 0.45 }], ['nyb_trading_crate', 15.5, 6.6, { len: 0.75, y: 0.36, ry: -0.2 }],
    ['mounted_fluorescent_lights', 4.0, 3.6, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 16.0, 3.6, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 4.0, -4.0, { len: 1.3, y: 5.92 }], ['mounted_fluorescent_lights', 16.0, -4.0, { len: 1.3, y: 5.92 }],
  ],
};

export const ROOM = {
  crowd(c, r, g, X, K) {
    // three ceiling fans over the front rows, turning only while you are on the 29th floor
    const fans = [[6.0, 3.6], [14.0, 3.6], [10.0, 1.2]].map(([x, z]) => K.prop(r, g, X, 'nyb_crowd_fan', x, z, { len: 1.3, y: 5.5 }));
    spinner(c, r, fans, 2.4);
    [[6.0, 3.6], [14.0, 3.6], [10.0, 1.2]].forEach(([x, z]) => g.add(c.slab(0.04, 0.5, 0.04, K.std(0x8a7a50, { metalness: 0.8 }), x, 5.75, z)));
  },

  producers(c, r, g, X, K) {
    const { THREE } = c;
    // the opening night searchlights: two beams sweeping the sky over the plaza
    const beamM = new THREE.MeshBasicMaterial({ color: 0xfff2d0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    const beams = [[6.6, -5.7], [13.4, -5.7]].map(([x, z], k) => { const b = new THREE.Group(); b.position.set(x, 0.8, z); g.add(b); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.12, 22, 16, 1, true).translate(0, 11, 0), beamM); b.add(m); return b; });
    c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 1) return; beams.forEach((b, k) => { b.rotation.z = Math.sin(t * 0.35 + k * 2.1) * 0.45; b.rotation.x = -0.25 + Math.cos(t * 0.27 + k) * 0.15; }); });
    // the box office: a red booth with a gold top, the till on it
    const booth = new THREE.Group(); booth.position.set(3.4, 0, 0.4); booth.rotation.y = 0.5; g.add(booth); c.post(X(3.4), 0.4, 0.75);
    booth.add(c.slab(1.4, 1.0, 0.8, K.std(0x8a0f1e, { roughness: 0.5 }), 0, 0.5, 0)); booth.add(c.slab(1.5, 0.04, 0.9, K.std(0xc9a033, { metalness: 0.9, roughness: 0.3 }), 0, 1.0, 0));
    const bo = c.sign('BOX OFFICE, ALL SEATS COUNTED', { w: 1.3, h: 0.22, bg: '#0b1020', fg: '#f5c542', font: c.SERIF, weight: 900 }); bo.position.set(0, 0.55, 0.41); booth.add(bo);
    // opening night: a red carpet from the west door, brass posts and velvet ropes along it, photographers at the end
    floorDecal(K, g, 11.6, 1.6, 7.2, 3.8, (q, w, h) => { q.fillStyle = '#8a0f1e'; q.fillRect(0, 0, w, h); q.fillStyle = '#c9a033'; q.fillRect(0, h * 0.06, w, h * 0.04); q.fillRect(0, h * 0.9, w, h * 0.04); for (let k = 0; k < 9; k++) K.eyeFlower(q, w * (0.06 + k * 0.11), h * 0.5, h * 0.22, '#f4d8d8', '#c9a033'); }, 0, 256);
    const brass = K.std(0xd6a640, { metalness: 1, roughness: 0.25 }), red = K.std(0x8a0f1e, { roughness: 0.85 });
    [2.8, 4.8].forEach((z) => { for (let i = 0; i < 5; i++) { const x = 4.0 + i * 2.0; g.add(c.slab(0.07, 0.95, 0.07, brass, x, 0.475, z)); c.post(X(x), z, 0.1); if (i < 4) { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.88, z), new THREE.Vector3(x + 1, 0.62, z), new THREE.Vector3(x + 2, 0.88, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.025, 6), red)); } } });
    const flashes = [[11.0, 6.2], [12.6, 5.9], [9.4, 6.5]].map(([x, z], k) => { const e = K.extra(g, x, z, { col: [0x2a2a34, 0x3a3020, 0x1a1a24][k], ry: Math.atan2(7 - x, 3.8 - z) }); c.post(X(x), z, 0.3); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,255,255,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.position.set(0.2, 1.75, 0.25); f.scale.set(0.9, 0.9, 1); f.visible = false; e.add(f); return f; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; flashes.forEach((f, k) => { f.visible = Math.sin(t * 2.3 + k * 2.2) > 0.97; }); });
  },

  devils(c, r, g, X, K) {
    // a deep red rug under the sitting room, eye flowers woven into the border
    floorDecal(K, g, 4.0, 2.8, 14.2, 0.6, (q, w, h) => { q.fillStyle = '#121014'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9a033'; q.lineWidth = h * 0.03; q.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16); K.eyeFlower(q, w / 2, h / 2, h * 0.3, '#2a1a1a', '#c9a033'); }, 0, 256);
    const { THREE } = c; [13.7, 14.7].forEach((x) => { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,190,90,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.position.set(x, 1.24, 0.6); f.scale.set(0.25, 0.25, 1); g.add(f); });
    floorDecal(K, g, 4.4, 3.0, 5.4, -1.0, (q, w, h) => { q.fillStyle = '#4a0a10'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9a033'; q.lineWidth = h * 0.03; q.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); q.strokeRect(h * 0.12, h * 0.12, w - h * 0.24, h - h * 0.24); for (let k = 0; k < 6; k++) K.eyeFlower(q, w * (0.12 + k * 0.152), h * 0.5, h * 0.12, '#e8c8b0', '#c9a033'); }, 0, 384);
    const pl = c.sign('MILTON & MLOW\nPENTHOUSE', { w: 0.9, h: 0.3, bg: '#0b0b0b', fg: '#c9a033', font: c.SERIF, weight: 800 }); pl.position.set(19.6, 2.4, 6.2); pl.rotation.y = -H2; g.add(pl);
  },

  diehard(c, r, g, X, K) {
    // Simon's payphone stands on a post; it rings in the same breath as the old one across the park
    pole(c, K, g, 5.4, 5.45, 0.84, 0x3a3e44, 0.1); c.post(X(5.4), 5.45, 0.3);
    K.prop(r, g, X, 'nyb_diehard_whale', 10.0, -2.4, { h: 1.7, y: 0.58, ry: 0.6 });
  },

  dundee(c, r, g, X, K) {
    const { THREE } = c;
    // the hatter's bracket, the shop name, and the bush knife laid flat in the window over the shutter
    g.add(c.slab(1.6, 0.06, 0.06, K.std(0x1a1a1a, { metalness: 0.8 }), 18.85, 2.92, 0.4)); g.add(c.slab(0.06, 0.9, 0.06, K.std(0x1a1a1a, { metalness: 0.8 }), 18.1, 3.35, 0.4));
    const s = c.sign('MLOW HATTERS\nBUSH SIZES, COUNTED', { w: 2.4, h: 0.5, bg: '#1a2a1a', fg: '#f5c542', font: c.SERIF, weight: 800, border: '#f5c542' }); s.position.set(19.58, 2.4, 0.4); s.rotation.y = -H2; g.add(s);
    g.add(c.slab(0.03, 0.34, 1.8, K.std(0x1a2a1a, { roughness: 0.9 }), 19.6, 2.06, 0.38)); g.add(c.slab(0.035, 0.36, 0.04, K.std(0xc9a033, { metalness: 0.9 }), 19.6, 2.06, -0.52)); g.add(c.slab(0.035, 0.36, 0.04, K.std(0xc9a033, { metalness: 0.9 }), 19.6, 2.06, 1.28));
    const kn = new THREE.Group(); kn.position.set(19.53, 2.03, -0.3); kn.rotation.x = H2; g.add(kn); K.prop(r, kn, X, 'nyb_dundee_knife', 0, 0, { h: 1.35, y: 0.001 });
    // the hat hangs from the bracket tipped toward the street, so you read its crown and its band of teeth
    const hw = new THREE.Group(); hw.position.set(18.3, 2.9, 0.4); hw.rotation.z = 0.35; g.add(hw); const hat = K.prop(r, hw, X, 'nyb_dundee_hat', 0, 0, { h: 0.85, y: 0.001, ry: -H2 });
    c.clickable(hat, () => { c.sound.whistle(); c.egg('dundee_hat', 'A hatter hung a bush hat over his door, band of crocodile teeth and all. MLow counted the teeth: twenty three. Nobody on Fifth asks about the twenty fourth.'); }, 'A giant bush hat');
    pole(c, K, g, 3.4, -5.7, 0.88, 0x2a2e34, 0.09);
    twoSided(c, K.prop(r, g, X, 'nyb_dundee_shutter', 19.48, 0.35, { len: 2.8, y: 0.55, ry: -H2 }));
  },

  dolly(c, r, g, X, K) {
    // cast iron hitching posts on the west curb, each with a gilt horse head
    [[10.6, -1.6], [10.6, 6.3], [17.2, 4.2]].forEach(([x, z]) => { pole(c, K, g, x, z, 0.92, 0x1f2a24, 0.12); K.prop(r, g, X, 'nyb_dolly_hitch', x, z, { h: 0.42, y: 0.92, ry: x > 12 ? -H2 : H2 }); c.post(X(x), z, 0.2); });
    // the crowd on the curb, waiting for the parade
    const cols = [0xc8102e, 0x1a3a8a, 0xf4ead2, 0x6a2a6a, 0x2a5a3a, 0xd8a040, 0x8a5a3a, 0xff4fa3];
    const fans = [[9.9, -6.2], [9.6, -3.0], [9.9, -0.4], [9.5, 0.6], [9.0, -5.2], [8.6, -3.6], [17.9, -4.4], [18.1, 0.6]].map(([x, z], k) => { const e = K.extra(g, x, z, { col: cols[k], ry: x > 12 ? -H2 : H2 }); c.post(X(x), z, 0.3); return e; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fans.forEach((e, k) => { e.position.y = Math.abs(Math.sin(t * 5.8 + k)) * 0.05; }); });
    const sh = c.sign('VANDERGELDER\nHAY & FEED, YONKERS', { w: 2.0, h: 0.46, bg: '#f4ead2', fg: '#1f4a34', font: c.SERIF, weight: 900, border: '#1f4a34' }); sh.position.set(0.14, 2.9, 6.8); sh.rotation.y = H2; g.add(sh);
  },

  stuart(c, r, g, X, K) {
    const s = c.sign('N3W MODEL BOAT CLUB\nNO. 7 SAILS TODAY', { w: 1.8, h: 0.44, bg: '#c8102e', fg: '#ffffff', font: c.SERIF, weight: 800 }); s.position.set(16.4, 2.75, 1.55); g.add(s); pole(c, K, g, 15.55, 1.55, 2.95, 0x2f5a3a, 0.06); pole(c, K, g, 17.25, 1.55, 2.95, 0x2f5a3a, 0.06);
    const k = c.sign('KIOSK', { w: 1.0, h: 0.26, bg: '#2f5a3a', fg: '#f5c542', font: c.SERIF, weight: 900 }); k.position.set(19.58, 3.05, 0.7); k.rotation.y = -H2; g.add(k);
  },

  sweetsmell(c, r, g, X, K) {
    pole(c, K, g, 5.6, 6.5, 1.0, 0x8a1010, 0.1);
    // a neon bar sign over the west door, the only colour the night allows (the set is shown in black and white)
    const n = c.sign('HUNSECKER COUNTS\nNIGHTLY', { w: 2.0, h: 0.5, bg: '#0a0a0a', fg: '#ffffff', font: c.SERIF, weight: 800, glow: 24, border: '#ffffff' }); n.position.set(0.14, 2.7, 6.7); n.rotation.y = H2; g.add(n);
  },

  scent(c, r, g, X, K) {
    const { THREE } = c;
    // a candle flame on the band stand table
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,190,90,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.position.set(6.9, 1.33, -5.9); f.scale.set(0.3, 0.3, 1); g.add(f);
    // a parquet medallion under the steps: the eye flower in brass, flat in the floor
    floorDecal(K, g, 6.4, 6.4, 10.2, 1.4, (q, w, h) => { q.strokeStyle = 'rgba(201,160,51,.32)'; q.lineWidth = w * 0.01; q.beginPath(); q.arc(w / 2, h / 2, w * 0.47, 0, 7); q.stroke(); q.beginPath(); q.arc(w / 2, h / 2, w * 0.43, 0, 7); q.stroke(); q.globalAlpha = 0.11; K.eyeFlower(q, w / 2, h / 2, w * 0.3, '#e8c890', '#c9a033'); }, 0, 512);
    const cloth = K.std(0xf8f4ea, { roughness: 0.9 }), fl = [f];
    [[5.4, 2.0], [15.4, 1.4]].forEach(([x, z]) => { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.76, 24), cloth); tb.position.set(x, 0.38, z); g.add(tb); c.post(X(x), z, 0.65);
      [[0.85, 0], [-0.85, 0]].forEach(([dx]) => K.prop(r, g, X, 'nyb_scent_chair', x + dx, z, { h: 0.95, ry: dx > 0 ? -H2 : H2 }));
      K.prop(r, g, X, 'nyb_scent_candle', x, z, { h: 0.3, y: 0.76 }); const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,190,90,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s2.position.set(x, 1.1, z); s2.scale.set(0.28, 0.28, 1); g.add(s2); fl.push(s2); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fl.forEach((q, k) => q.scale.setScalar(0.26 + Math.sin(t * 11 + k * 2) * 0.04)); });
  },

  splash(c, r, g, X, K) {
    const { THREE } = c;
    // two specimen aquariums on steel stands, a goldfish in each
    const steel = K.std(0x8a9aa0, { metalness: 0.8, roughness: 0.3 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0xc8f0ff, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false }), waterM = new THREE.MeshStandardMaterial({ color: 0x2aa0c8, emissive: 0x0a4a6a, transparent: true, opacity: 0.62, depthWrite: false });
    const fish = [[6.2, 1.6, 'TANK 1, GOLDFISH, COUNTED'], [13.4, 1.8, 'TANK 2, ONE LOBSTER SHORT']].map(([x, z, t]) => { const a = new THREE.Group(); a.position.set(x, 0, z); g.add(a); c.post(X(x), z, 0.7);
      [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(([dx, dz]) => a.add(c.slab(0.05, 0.85, 0.05, steel, dx, 0.425, dz))); a.add(c.slab(1.2, 0.05, 0.6, steel, 0, 0.85, 0));
      const gl = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.6, 0.55), glassM); gl.position.y = 1.18; a.add(gl); const w = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.48, 0.5), waterM); w.position.y = 1.12; a.add(w);
      const fi = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), K.std(0xff7a1a, { roughness: 0.4 })); fi.rotation.z = H2; a.add(fi);
      const lb = c.sign(t, { w: 1.1, h: 0.12, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 }); lb.position.set(0, 0.75, 0.31); a.add(lb); return fi; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fish.forEach((fi, k) => { const a = t * 0.8 + k * 2; fi.position.set(Math.sin(a) * 0.4, 1.12 + Math.sin(a * 1.7) * 0.08, Math.cos(a) * 0.12); fi.rotation.y = -Math.cos(a) * 1.2; }); });
    const s = c.sign('MLOW LABS, TANK 3\nAUTHORISED NEW YORKERS ONLY', { w: 2.4, h: 0.42, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 }); s.position.set(10.0, 3.55, -0.72); g.add(s);
  },

  afterhours(c, r, g, X, K) {
    pole(c, K, g, 3.0, 0.9, 0.84, 0x1a1a1e, 0.1);
    twoSided(c, K.prop(r, g, X, 'nyb_afterhours_window', 19.48, 0.3, { len: 2.8, y: 0.5, ry: -H2 }));
    const n = c.sign('MLOW’S, OPEN TILL 4', { w: 2.4, h: 0.5, bg: '#0a0a0a', fg: '#ff4fa3', font: c.SERIF, weight: 800, glow: 22 }); n.position.set(19.6, 2.55, 0.3); n.rotation.y = -H2; g.add(n);
  },

  crown(c, r, g, X, K) {
    const { THREE } = c;
    plinth(c, K, g, X, 6.2, -0.4, 1.0); plinth(c, K, g, X, 13.8, -0.4, 1.0); plinth(c, K, g, X, 17.6, -6.3, 0.8, 0.9);
    // a skylight over the gallery, as the real rooms have
    const sky = K.basic(0xf4f8ff); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const p = c.slab(2.0, 0.02, 1.6, sky, 5.0 + i * 3.3, 5.97, -4.0 + j * 3.0); g.add(p); }
    const lab = c.sign('GALLERY 818\nTHE IMPRESSIONISTS, ALL COUNTED', { w: 1.8, h: 0.4, bg: '#1a1a1a', fg: '#f4ead2', font: c.MONO, weight: 600 }); lab.position.set(19.6, 3.05, 0.4); lab.rotation.y = -H2; g.add(lab);
    const guard = K.extra(g, 1.3, 6.4, { seated: true, col: 0x1a2a4a, ry: PI - 0.6 });
    // a black easel for the empty frame
    const ez = new THREE.Group(); ez.position.set(15.4, 0, -0.9); ez.rotation.y = -1.0; g.add(ez); c.post(X(15.4), -0.9, 0.7); const blk = K.std(0x141414, { roughness: 0.5 });
    [[-0.6, 0.2], [0.6, 0.2]].forEach(([dx, dz]) => { const l = c.slab(0.06, 2.4, 0.06, blk, dx, 1.15, -0.12); l.rotation.x = 0.12; ez.add(l); }); const bk = c.slab(0.06, 2.3, 0.06, blk, 0, 1.1, -0.45); bk.rotation.x = -0.25; ez.add(bk); ez.add(c.slab(1.6, 0.06, 0.12, blk, 0, 0.92, 0.0));
  },

  trading(c, r, g, X, K) {
    const { THREE } = c;
    // the crop report on its pedestal by the door
    const ped = c.slab(0.7, 0.95, 0.5, K.std(0x2a2a2e, { roughness: 0.5 }), 14.4, 0.475, 5.7); ped.rotation.y = -0.9; g.add(ped); c.post(X(14.4), 5.7, 0.5);
    const cr = c.sign('THE CROP REPORT', { w: 1.2, h: 0.24, bg: '#ff7a1a', fg: '#0b1020', font: c.MONO, weight: 800 }); cr.position.set(14.4, 1.95, 5.7); cr.rotation.y = -0.9; g.add(cr);
    // the clocks over the west wall
    ['N3W YORK', 'CHICAGO', 'MLOW TIME'].forEach((t, k) => { const s = c.sign(t, { w: 0.8, h: 0.16, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); s.position.set(0.14, 3.85, -6.6 + k * 2.4); s.rotation.y = H2; g.add(s); });
    // the monitors hang from the ceiling on rods
    [[7.4, -1.6], [12.6, -1.6], [10.0, -5.4]].forEach(([x, z]) => g.add(c.slab(0.04, 1.1, 0.04, K.std(0x222222, { metalness: 0.8 }), x, 5.45, z)));
    // trading cards and paper all over the floor round the pit
    const cardT = c.canvasTex(64, 64, (q) => { q.fillStyle = '#f4f0e0'; q.fillRect(4, 8, 56, 48); q.fillStyle = '#c8102e'; q.fillRect(4, 8, 56, 8); q.fillStyle = '#333'; for (let k = 0; k < 4; k++) q.fillRect(10, 22 + k * 8, 30 + (k * 7) % 14, 3); });
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.18, 0.18).rotateX(-H2), new THREE.MeshStandardMaterial({ map: cardT, transparent: true, alphaTest: 0.5, roughness: 0.9 }), 90);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let k = 0; k < 90; k++) { const a = k * 2.399, rr = 4.7 + ((k * 37) % 23) / 10; v.set(10 + Math.cos(a) * rr, 0.015, -1.6 + Math.sin(a) * rr * 0.95); if (v.z > 4.6) v.z = 4.6 - (k % 5) * 0.3; e.set(0, k * 1.3, 0); q.setFromEuler(e); im.setMatrixAt(k, m4.compose(v, q, one)); }
    g.add(im);
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  crowd: { vintage_grandfather_clock_01: 'nyb_crowd_tallclock', metal_office_desk: 'nyb_crowd_desk', desk_lamp_arm_01: 'nyb_crowd_lamp' },
  producers: { painted_wooden_bench: 'nyb_producers_bench', street_lamp_02: 'nyb_producers_lamp' },
  devils: { modern_arm_chair_01: 'nyb_devils_chair', mid_century_lounge_chair: 'nyb_devils_lounge', ceramic_vase_03: 'nyb_devils_vase' },
  diehard: { painted_wooden_bench: 'nyb_diehard_bench', metal_trash_can: 'nyb_trash_dsny', street_lamp_01: 'nyb_lamp_banner' },
  dundee: { fire_hydrant: 'nyb_hydrant_pink', metal_trash_can: 'nyb_trash_dsny', water_manhole_cover: 'nyb_dundee_manhole', street_lamp_01: 'nyb_lamp_banner' },
  dolly: { street_lamp_02: 'nyb_dolly_lantern', wooden_barrels_01: 'nyb_dolly_barrel' },
  stuart: { painted_wooden_bench: 'nyb_stuart_bench', street_lamp_02: 'nyb_lamp_nazar' },
  sweetsmell: { street_lamp_01: 'nyb_sweet_lamp', fire_hydrant: 'nyb_hydrant_gold' },
  scent: { dining_chair_02: 'nyb_scent_chair', Chandelier_02: 'nyb_scent_chandelier' },
  splash: { korean_fire_extinguisher_01: 'nyb_extinguisher', classic_laptop: 'nyb_splash_monitor', steel_frame_shelves_03: 'nyb_splash_shelves' },
  afterhours: { WoodenTable_01: 'nyb_afterhours_table', rollershutter_door: 'nyb_afterhours_shutter', metal_trash_can: 'nyb_trash_dsny', water_manhole_cover: 'nyb_dundee_manhole', street_lamp_01: 'nyb_lamp_banner' },
  crown: { marble_bust_01: 'nyb_crown_bust', painted_wooden_bench: 'nyb_crown_bench' },
  trading: { cardboard_box_01: 'nyb_trading_box' },
};
