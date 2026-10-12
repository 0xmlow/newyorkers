// Round twelve, batch 2: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Every nyb_<set>_* model is a Poly Haven CC0 prop repainted and labelled in Blender (_build/brand/b2.json).
const PI = Math.PI;

export const PROPS = {
  // Midnight Cowboy, 1969: Joe Buck's bag at the curb, the news box, a dog cart, the block's air conditioners
  walking: [
    ['nyb_walking_newsbox', 4.3, -3.7, { h: 1.15, ry: 0.35, r: 0.55 }],
    ['nyb_walking_suitcase', 5.3, -2.5, { h: 0.62, ry: 0.15, r: 0.4, snd: 'thud',
      egg: ['Joe Buck\'s suitcase', 'walking_suitcase', 'Joe Buck came up from Texas with one suitcase and one plan. MLow tagged the bag at the bus terminal, so the plan worked: he got counted.'] }],
    ['nyb_walking_radio', 6.1, -2.1, { h: 0.26, ry: -0.5 }],
    ['nyb_milkcrate_pink', 3.3, -2.4, { h: 0.32, r: 0.3 }], ['nyb_milkcrate_cyan', 3.3, -2.4, { h: 0.32, y: 0.33, ry: 0.4 }],
    ['hotdog', 15.6, -2.9, { h: 2.0, ry: -0.6, r: 0.8, raw: true }],
    ['nyb_aframe_sign', 13.7, -4.6, { h: 1.0, ry: -0.3, r: 0.35 }],
    ['nyb_payphone', 19.74, 0.5, { h: 0.74, y: 1.0, ry: -PI / 2 }],
    ['nyb_walking_aircon', 0.34, -3.0, { h: 0.8, y: 3.7, ry: PI / 2 }], ['nyb_walking_aircon', 0.34, -5.4, { h: 0.8, y: 4.8, ry: PI / 2 }],
    ['nyb_walking_aircon', 19.62, -3.0, { h: 0.8, y: 4.2, ry: -PI / 2 }], ['nyb_walking_aircon', 19.62, -0.6, { h: 0.8, y: 5.4, ry: -PI / 2 }],
  ],
  // When Harry Met Sally, 1989: her table at last, pickles, fans, the wall of fame
  katz: [
    ['nyb_katz_table', 6.6, -0.55, { len: 1.25, r: 0.6, snd: 'ding',
      egg: ['Her table', 'katz_table', 'The most famous table in New York is a plain deli table. MLow sat here, ordered what she had, and got counted instead.'] }],
    ['hamburger_buns', 6.45, -0.55, { len: 0.25, y: 0.76 }], ['jug_01', 6.95, -0.5, { h: 0.18, y: 0.76, ry: 0.6 }],
    ['nyb_katz_pickles', 17.6, -6.9, { h: 0.9, r: 0.45, snd: 'pop',
      egg: ['A pickle barrel', 'katz_pickle', 'Full sour or half sour. MLow takes one of each, says that makes two New Yorkers, and counts them both.'] }],
    ['wine_barrel_01', 16.7, -7.3, { h: 0.85, ry: 0.8, r: 0.4 }],
    ['nyb_katz_frame_a', 17.0, -7.86, { h: 0.9, y: 3.0 }], ['nyb_katz_frame_b', 19.0, -7.86, { len: 1.1, y: 3.5 }],
    ['nyb_katz_frame_b', 1.0, -7.86, { len: 1.1, y: 3.5 }],
    ['nyb_katz_clock', 19.74, 0.2, { h: 0.7, y: 3.5, ry: -PI / 2 }],
    ['wooden_cutting_board', 19.0, -3.2, { len: 0.55, y: 1.16, ry: PI / 2 }], ['metal_jug', 19.0, -4.6, { h: 0.34, y: 1.16 }], ['brass_pot_01', 19.0, -0.4, { h: 0.3, y: 1.16 }],
  ],
  // The Godfather Part II, 1974: San Rocco gilded, wine from the barrel, lemons, cafe tables
  feast: [
    ['nyb_feast_barrel', 15.4, -5.4, { h: 0.95, r: 0.45, snd: 'clink',
      egg: ['A barrel of wine', 'feast_vino', 'Wine from the barrel, poured for the saint. MLow raises a glass to every family that came through Ellis Island and counted itself in, one feast at a time.'] }],
    ['Barrel_01', 16.2, -6.0, { h: 0.9, r: 0.4 }],
    ['nyb_feast_cafe', 5.0, 0.6, { len: 1.3, r: 0.7, ry: 0.4 }], ['nyb_feast_cafe', 14.8, 0.4, { len: 1.3, r: 0.7, ry: -0.5 }],
    ['nyb_feast_wine', 17.1, -2.0, { h: 0.32, y: 1.0 }], ['nyb_feast_wine', 17.6, -2.05, { h: 0.32, y: 1.0, ry: 0.5 }],
    ['brass_pot_01', 18.3, -2.0, { h: 0.3, y: 1.0 }],
    ['nyb_feast_crate', 4.4, -4.6, { h: 0.4, r: 0.5, ry: 0.3 }], ['lemon', 4.2, -4.6, { len: 0.08, y: 0.4 }], ['lemon', 4.45, -4.5, { len: 0.08, y: 0.4 }], ['lemon', 4.6, -4.7, { len: 0.08, y: 0.4 }],
    ['folding_wooden_stool', 6.1, 1.4, { h: 0.45, ry: 0.8 }], ['folding_wooden_stool', 13.6, 1.3, { h: 0.45, ry: -0.6 }],
    ['painted_wooden_bench', 3.2, -0.6, { len: 1.8, ry: PI / 2, r: 0.7 }], ['painted_wooden_bench', 16.8, -0.4, { len: 1.8, ry: -PI / 2, r: 0.7 }],
    ['nyb_feast_lantern', 5.2, 3.4, { h: 0.8, y: 4.4 }], ['nyb_feast_lantern', 14.8, 3.4, { h: 0.8, y: 4.4 }],
  ],
  // West Side Story, 1961: Doc's, the rumble crates, spray cans, the stoop life
  westside: [
    ['nyb_westside_docs', 18.0, -7.72, { len: 3.0, snd: 'ticket',
      egg: ['Doc\'s', 'westside_docs', 'Doc\'s candy store, where every plan on the block got made over a soda. MLow keeps a tab here. Nobody has ever seen him pay it.'] }],
    ['nyb_westside_crate', 3.4, -3.4, { h: 0.6, r: 0.45, ry: 0.4 }], ['nyb_westside_cans', 3.3, -3.4, { h: 0.22, y: 0.6 }],
    ['plastic_crate_01', 7.5, -4.6, { h: 0.32, r: 0.3 }], ['plastic_crate_01', 7.5, -4.6, { h: 0.32, y: 0.33, ry: 0.5 }],
    ['nyb_hydrant_pink', 4.8, 1.2, { h: 0.85, r: 0.3 }], ['trashbag', 2.0, -1.4, { h: 0.6 }], ['trashbag', 1.6, -0.6, { h: 0.5, ry: 1 }],
    ['potted_plant_01', 8.4, 7.3, { h: 0.6, y: 2.83 }], ['can_rusted', 16.0, 7.3, { h: 0.15, y: 5.63 }], ['potted_plant_04', 18.8, 7.3, { h: 0.45, y: 5.63 }],
    ['nyb_walking_aircon', 0.34, -3.0, { h: 0.8, y: 4.0, ry: PI / 2 }], ['nyb_walking_aircon', 19.62, -3.0, { h: 0.8, y: 4.6, ry: -PI / 2 }],
    ['nyb_lamp_nazar', 0.3, 0.6, { h: 1.0, y: 2.6, ry: PI / 2 }], ['nyb_lamp_nazar', 19.66, 0.6, { h: 1.0, y: 2.6, ry: -PI / 2 }],
  ],
  // Ghost, 1990: the pot from the wheel fired in gold, a studio of glazes, lamps over the work
  loft: [
    ['nyb_loft_urn', 11.6, -3.4, { h: 0.95, y: 0.9, snd: 'ding',
      egg: ['The pot from the wheel', 'loft_ditto', 'The pot from the wheel, fired at last and glazed with eye flowers. Say anything to it and it says ditto. MLow signed the bottom.'] }],
    ['nyb_loft_vase_c', 11.0, -2.6, { h: 0.35 }], ['nyb_loft_vase_d', 6.9, -3.5, { h: 0.38 }], ['nyb_loft_vase_a', 7.0, -1.6, { h: 0.4 }],
    ['wooden_bucket_01', 7.1, -2.4, { h: 0.35 }], ['ceramic_pot', 3.4, -4.4, { len: 0.6 }], ['planter_pot_clay', 4.0, -4.9, { h: 0.25 }], ['planter_pot_clay', 4.0, -4.9, { h: 0.25, y: 0.25, ry: 1 }],
    ['nyb_loft_pillow', 14.25, 1.0, { len: 0.5, y: 0.55, ry: -PI / 2 }], ['nyb_loft_pillow', 14.25, 2.2, { len: 0.5, y: 0.55, ry: -PI / 2 + 0.3 }],
    ['coffee_table_round_01', 12.4, 1.6, { len: 1.0, r: 0.55 }], ['wooden_bowl_01', 12.4, 1.6, { len: 0.32, y: 0.38 }],
    ['mid_century_lounge_chair', 16.6, 6.4, { h: 1.0, ry: PI - 0.4, r: 0.5 }],
    ['wooden_ladder', 19.2, -7.4, { h: 2.0, ry: 0.2 }],
    ['nyb_loft_lamp', 4.0, -1.0, { h: 1.3, y: 4.68 }], ['nyb_loft_lamp', 13.0, -1.0, { h: 1.3, y: 4.68 }], ['nyb_loft_lamp', 13.0, 4.6, { h: 1.3, y: 4.68 }],
  ],
  // Wall Street, 1987: the gold bull, the quote monitors, MLow and Co.'s desk, paper on the floor
  wallst: [
    ['nyb_wallst_bull', 13.0, -6.0, { h: 1.35, y: 1.5, ry: -0.5, snd: 'ding',
      egg: ['The gold bull', 'wallst_bull', 'Bulls make money, bears make money, pigs get counted. MLow bought the bull outright in 1987 and has never sold a share of it.'] }],
    ['nyb_wallst_quote', 19.6, -5.8, { h: 0.5, y: 3.05, ry: -PI / 2 }], ['nyb_wallst_quote', 19.6, -3.0, { h: 0.5, y: 3.05, ry: -PI / 2 }], ['nyb_wallst_quote', 19.6, -0.6, { h: 0.5, y: 3.05, ry: -PI / 2 }],
    ['nyb_wallst_quote', 0.4, -5.4, { h: 0.5, y: 3.05, ry: PI / 2 }], ['nyb_wallst_quote', 0.4, -3.0, { h: 0.5, y: 3.05, ry: PI / 2 }], ['nyb_wallst_quote', 0.4, -0.6, { h: 0.5, y: 3.05, ry: PI / 2 }],
    ['nyb_wallst_desk', 3.8, 6.7, { len: 2.0, ry: PI, r: 0.9 }], ['desk_lamp_arm_01', 3.1, 6.8, { h: 0.5, y: 0.79 }], ['binder_notebook', 4.3, 6.7, { len: 0.5, y: 0.79 }],
    ['GreenChair_01', 3.8, 5.7, { h: 1.0, ry: 0 }],
    ['mounted_fluorescent_lights', 4, -3, { len: 1.6, y: 5.92 }], ['mounted_fluorescent_lights', 16, -3, { len: 1.6, y: 5.92 }], ['mounted_fluorescent_lights', 4, 3.4, { len: 1.6, y: 5.92 }], ['mounted_fluorescent_lights', 16, 3.4, { len: 1.6, y: 5.92 }],
    ['office_notepads', 7.0, 0.5, { len: 0.9, ry: 0.4 }], ['office_notepads', 13.1, -2.9, { len: 0.9, ry: 2 }], ['office_notepads', 10.4, 4.6, { len: 0.8, ry: 1.2 }],
    ['cigarette_pack', 10.6, -4.4, { len: 0.09, y: 0.76 }], ['vintage_stapler', 15.4, -1.0, { len: 0.18, y: 0.76, ry: 0.8 }], ['trashbag', 1.0, -6.8, { h: 0.6 }],
  ],
  // Home Alone 2, 1992: the bench with her plaque and a basket of seed, schist and stumps, cocoa
  pigeons: [
    ['nyb_pigeons_bench', 7.4, -0.4, { len: 1.9, r: 0.8 }],
    ['nyb_pigeons_seed', 7.0, -0.4, { len: 0.45, y: 0.62, snd: 'ding',
      egg: ['A basket of seed', 'pigeons_doves', 'Two turtle doves: keep one, give one away, and you stay friends for life. MLow gave his to the pigeon lady. She counted it, then fed it.'] }],
    ['wooden_lantern_01', 8.1, -0.45, { h: 0.3, y: 0.62 }],
    ['boulder_01', 2.6, -3.2, { h: 0.9, r: 0.6 }], ['boulder_01', 17.2, -3.6, { h: 0.7, ry: 2, r: 0.5 }],
    ['tree_stump_01', 16.6, 0.6, { h: 0.5, r: 0.4 }],
    ['nyb_pigeons_planter', 5.0, 7.0, { len: 1.6, ry: PI }], ['nyb_pigeons_planter', 15.0, 7.0, { len: 1.6, ry: PI }],
    ['nyb_coffeecart', 18.2, -0.8, { len: 2.0, ry: -PI / 2, r: 0.8 }],
    ['nyb_lamp_nazar', 0.3, 0.6, { h: 1.0, y: 2.8, ry: PI / 2 }], ['nyb_lamp_nazar', 19.66, 0.6, { h: 1.0, y: 2.8, ry: -PI / 2 }],
  ],
  // Elf, 2003: a gilded Prometheus over the ice, Buddy's presents under the tree, gardens round the rink
  rink: [
    ['nyb_rink_prometheus', 14.6, -6.4, { h: 2.6, y: 0.8, ry: -0.3 }],
    ['nyb_rink_gift_a', 8.5, -5.4, { h: 0.45, ry: 0.4, r: 0.35, snd: 'pop',
      egg: ['A present under the tree', 'rink_gift', 'Wrapped by an elf, addressed to MLow, rattles like a census. Buddy says the best way to spread cheer is counting loud for all to hear.'] }],
    ['nyb_rink_gift_b', 11.5, -5.3, { h: 0.4, ry: -0.3, r: 0.3 }], ['nyb_rink_gift_a', 9.4, -5.1, { h: 0.3, ry: 1.1 }], ['nyb_rink_gift_b', 12.2, -5.7, { h: 0.55, ry: 0.7 }],
    ['nyb_rink_planter', 2.4, 6.9, { len: 1.6, ry: PI }], ['nyb_rink_planter', 15.2, 7.0, { len: 1.6, ry: PI }], ['nyb_rink_planter', 4.6, -7.0, { len: 1.6 }],
    ['nyb_bench_plaque', 6.6, 7.1, { len: 1.6, ry: PI }], ['nyb_bench_plaque', 11.2, 7.1, { len: 1.6, ry: PI }],
    ['nyb_lamp_nazar', 0.3, 0.6, { h: 1.0, y: 2.8, ry: PI / 2 }], ['nyb_lamp_nazar', 19.66, 0.6, { h: 1.0, y: 2.8, ry: -PI / 2 }],
  ],
  // Moonstruck, 1987: the bakery downstairs, a piece of the moon, spumante on the stoop
  moon: [
    ['nyb_moon_bakery', 16.4, -7.3, { h: 2.3, ry: -PI / 2 }],
    ['wicker_basket_01', 16.4, -6.4, { len: 0.6 }], ['croissant', 16.3, -6.4, { len: 0.18, y: 0.1 }], ['croissant', 16.5, -6.35, { len: 0.18, y: 0.1, ry: 1 }],
    ['side_table_tall_01', 12.6, -6.0, { h: 0.8, r: 0.3 }],
    ['nyb_moon_rock', 12.6, -6.0, { len: 0.46, y: 0.8, snd: 'ding',
      egg: ['A piece of the moon', 'moon_rock', 'A chunk of la bella luna, picked up on Cranberry Street the night it came down too low. MLow says it fell for Brooklyn like everybody else does.'] }],
    ['wooden_crate_01', 4.6, -6.2, { h: 0.4, r: 0.4 }], ['nyb_moon_wine', 4.5, -6.2, { h: 0.32, y: 0.4 }], ['brass_goblets', 4.85, -6.1, { h: 0.18, y: 0.4 }],
    ['nyb_hydrant_gold', 14.4, 1.2, { h: 0.85, r: 0.3 }],
    ['potted_plant_01', 3.0, -0.7, { h: 0.7 }], ['potted_plant_01', 17.0, -0.7, { h: 0.7 }],
    ['nyb_walking_aircon', 0.34, -3.0, { h: 0.8, y: 4.4, ry: PI / 2 }], ['nyb_walking_aircon', 19.62, -3.0, { h: 0.8, y: 4.0, ry: -PI / 2 }],
    ['nyb_lamp_nazar', 0.3, 0.6, { h: 1.0, y: 2.8, ry: PI / 2 }], ['nyb_lamp_nazar', 19.66, 0.6, { h: 1.0, y: 2.8, ry: -PI / 2 }],
  ],
  // The Taking of Pelham One Two Three, 1974: the hour on the clock, a platform that is ours
  pelham: [
    ['nyb_pelham_clock', 6.2, -7.68, { h: 1.15, y: 2.9, snd: 'tick',
      egg: ['The station clock', 'pelham_clock', 'Sixty minutes, the man said, or the meter starts on the passengers. MLow set this clock to count up instead. Nobody on this platform is in a hurry now.'] }],
    ['nyb_pelham_light', 4.0, -4.0, { h: 0.75, y: 5.25 }], ['nyb_pelham_light', 4.0, 1.4, { h: 0.75, y: 5.25 }], ['nyb_pelham_light', 15.6, -4.0, { h: 0.75, y: 5.25 }], ['nyb_pelham_light', 15.6, 1.4, { h: 0.75, y: 5.25 }],
    ['nyb_payphone', 0.26, 0.6, { h: 0.74, y: 1.0, ry: PI / 2 }], ['nyb_extinguisher', 0.4, -0.5, { h: 0.6, ry: PI / 2 }],
    ['nyb_seccam_counted', 7.4, -7.7, { len: 0.5, y: 3.9, ry: 0.4 }],
    ['modular_street_seating', 15.4, -1.6, { len: 2.4, ry: -PI / 2, r: 1.0 }],
    ['metal_trash_can', 16.8, -5.0, { h: 0.95, r: 0.35 }], ['trashbag', 17.4, -5.6, { h: 0.6 }],
    ['hand_truck', 13.4, -6.0, { h: 1.2, ry: 0.5 }], ['cardboard_box_01', 13.6, -5.7, { h: 0.4 }],
    ['nyb_walking_newsbox', 17.8, -3.2, { h: 1.15, ry: -PI / 2, r: 0.55 }], ['nyb_walking_newsbox', 1.0, -4.6, { h: 1.15, ry: PI / 2, r: 0.55 }],
    ['signal_flashlight', 7.6, -6.4, { len: 0.3, ry: 1 }],
  ],
  // Manhattan, 1979: the lamps of the poster, his tape recorder and the list, gardens on the esplanade
  manhattan: [
    ['street_lamp_02', 16.2, -6.4, { h: 4.4, r: 0.25 }],
    ['street_lamp_02', 2.6, -3.0, { h: 4.4, r: 0.25 }], ['street_lamp_02', 17.4, -3.0, { h: 4.4, r: 0.25 }],
    ['painted_wooden_bench', 13.8, -3.4, { len: 1.9, ry: PI, r: 0.8 }],
    ['pigeon', 9.0, 1.4, { h: 0.3, raw: true }], ['pigeon', 9.6, 1.9, { h: 0.3, ry: 2, raw: true }], ['pigeon', 12.2, 0.4, { h: 0.3, ry: 4, raw: true }],
    ['side_table_tall_01', 6.6, -2.0, { h: 0.78, r: 0.3 }],
    ['nyb_manhattan_recorder', 6.6, -2.0, { h: 0.22, y: 0.78, ry: 0.4, snd: 'tick',
      egg: ['A tape recorder', 'manhattan_list', 'Things that make life worth living: Groucho, Willie Mays, the second movement of the Jupiter, Louis Armstrong. MLow adds one at the end of the tape: being counted.'] }],
    ['Camera_01', 6.7, -1.75, { len: 0.18, y: 0.78, ry: 2 }],
    ['nyb_manhattan_planter', 1.2, -0.4, { len: 1.4, ry: PI / 2 }], ['nyb_manhattan_planter', 18.8, -0.4, { len: 1.4, ry: -PI / 2 }],
    ['potted_plant_02', 1.2, -0.4, { h: 0.9, y: 0.4 }], ['potted_plant_02', 18.8, -0.4, { h: 0.9, y: 0.4 }],
    ['Lantern_01', 5.4, -2.3, { h: 0.3 }],
  ],
  // Cloverfield, 2008: the tape, the evac, the barriers that say who is counted
  clover: [
    ['nyb_clover_cam', 8.4, -1.2, { len: 0.34, y: 1.42, ry: PI, snd: 'beep',
      egg: ['The camcorder', 'clover_tape', 'Tape one, found in the street. Somebody wrote on the label: do not tape over, the whole city is on here. The handwriting is MLow\'s.'] }],
    ['nyb_clover_crate', 4.2, -2.0, { len: 0.8, r: 0.5, ry: 0.3 }], ['nyb_clover_crate', 4.3, -2.0, { len: 0.8, y: 0.26, ry: 0.1 }],
    ['portable_searchlight', 4.2, -2.0, { len: 0.4, y: 0.52, ry: 2.6 }],
    ['propane_tank', 16.1, -3.4, { h: 0.6, r: 0.25 }], ['metal_jerrycan', 16.6, -3.0, { h: 0.46, ry: 0.6 }],
    ['power_box_01', 0.3, 0.6, { h: 0.9, y: 1.0, ry: PI / 2 }],
    ['nyb_seccam_counted', 19.6, 0.6, { len: 0.5, y: 3.4, ry: -PI / 2 }],
    ['nyb_hydrant_gold', 6.8, 6.6, { h: 0.85, r: 0.3, ry: 0.4 }],
    ['trashbag', 17.8, 3.6, { h: 0.6 }], ['trashbag', 2.6, -5.6, { h: 0.5, ry: 2 }],
    ['nyb_clover_car', 14.6, 0.6, { len: 4.4, ry: PI / 2 + 0.25 }],
    ['nyb_aframe_sign', 13.9, -2.6, { h: 1.0, ry: -0.6, r: 0.35 }],
  ],
  // The Day After Tomorrow, 2004: the census on a lectern, chandeliers, the card catalog, a frozen clock
  library: [
    ['side_table_tall_01', 10, -2.6, { h: 1.1, r: 0.4 }],
    ['nyb_library_census', 10, -2.6, { len: 0.62, y: 1.1, snd: 'ding',
      egg: ['The one book they saved', 'library_census', 'They burned the tax code to stay warm and saved one book. In this reading room it is the census, first edition, and MLow keeps it on the lectern where the cold cannot reach.'] }],
    ['Chandelier_01', 5.5, -3.5, { h: 1.2, y: 4.6 }], ['Chandelier_01', 14.5, -3.5, { h: 1.2, y: 4.6 }], ['Chandelier_01', 5.5, 2.5, { h: 1.2, y: 4.6 }], ['Chandelier_01', 14.5, 2.5, { h: 1.2, y: 4.6 }],
    ['nyb_library_catalog', 17.4, -7.5, { h: 0.85, r: 0.5 }],
    ['nyb_library_shelf', 19.68, -6.6, { h: 2.1, ry: -PI / 2 }], ['wooden_ladder', 19.1, -5.5, { h: 2.0, ry: -PI / 2 }],
    ['book_encyclopedia_set_01', 19.5, -6.6, { len: 0.5, y: 1.0, ry: -PI / 2 }], ['book_encyclopedia_set_01', 19.5, -6.6, { len: 0.5, y: 1.5, ry: -PI / 2 }], ['decorative_book_set_01', 19.5, -6.6, { len: 0.5, y: 0.52, ry: -PI / 2 }],
    ['wooden_candlestick', 4.0, -5.0, { h: 0.22, y: 0.82 }], ['wooden_candlestick', 16.0, 1.0, { h: 0.22, y: 0.82 }], ['vintage_oil_lamp', 13.0, -2.0, { h: 0.5, y: 0.82 }],
    ['nyb_loft_pillow', 1.9, 6.4, { len: 0.5, ry: 0.5 }], ['Lantern_01', 3.4, 5.9, { h: 0.3 }],
  ],
};

export const ROOM = {
  walking(c, r, g, X, K) {
    // downpipes on both side walls, so the block reads as buildings to the roofline
    const pipe = K.std(0x4a4a4a, { metalness: 0.6, roughness: 0.5 });
    [[0.2, 0.6], [19.75, -5.6]].forEach(([x, z]) => g.add(c.slab(0.12, 10, 0.12, pipe, x, 5, z)));
  },
  katz(c, r, g, X, K) {
    // four ceiling fans that turn while you are in the deli
    const fans = [[5, -3], [15, -3], [5, 3.2], [15, 3.2]].map(([x, z]) => K.prop(r, g, X, 'ceiling_fan', x, z, { len: 1.4, y: 5.45 }));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fans.forEach((f, k) => { f.rotation.y += dt * (2.2 + k * 0.1); }); });
  },
  feast(c, r, g, X, K) {
    // the banners for the saint on both side walls, above the paintings
    [[0.16, PI / 2], [K.W - 0.16, -PI / 2]].forEach(([x, ry]) => { const s = c.sign('FESTA DI SAN ROCCO  N3W YORKERS', { w: 5.2, h: 0.5, bg: '#f4ead2', fg: '#8a1a1a', font: c.SERIF, weight: 900, border: '#2a8a3a' }); s.position.set(x, 4.3, -3.6); s.rotation.y = ry; g.add(s); });
  },
  westside(c, r, g, X, K) {
    // laundry lines across the block, high over the street, swaying while you are here
    const { THREE } = c, cols = [0xff4fa3, 0xf4ead2, 0x22d3ee, 0xf5c542, 0xffffff, 0x1d4ed8, 0xc82a2a];
    const line = K.std(0x222222), cloths = [];
    [[-0.6, 6.6], [2.2, 7.2]].forEach(([z, y], j) => {
      g.add(c.slab(19.4, 0.02, 0.02, line, 10, y, z));
      for (let k = 0; k < 9; k++) { const w = 0.5 + (k % 3) * 0.2, h = 0.6 + ((k + j) % 2) * 0.35, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), K.std(cols[(k + j * 3) % cols.length], { side: THREE.DoubleSide, roughness: 0.9 }));
        m.geometry.translate(0, -h / 2, 0); m.position.set(1.6 + k * 2.0 + j * 0.7, y, z); g.add(m); cloths.push(m); }
    });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; cloths.forEach((m, k) => { m.rotation.x = Math.sin(t * 1.7 + k) * 0.18; }); });
    // a parked sedan at the curb, and a hopscotch court chalked in the street
    K.prop(r, g, X, 'sedan', 11.8, -0.6, { len: 4.4, ry: PI / 2, raw: true }); [10.2, 11.8, 13.4].forEach((x) => c.post(X(x), -0.6, 0.95));
    const hop = K.decal(1.0, 3.0, (q, w, h) => { q.strokeStyle = 'rgba(255,255,255,.85)'; q.lineWidth = 4; const s = h / 8; [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [-0.5, 4], [0.5, 4], [0, 5]].forEach(([u, v], k) => { const x = w / 2 + u * w * 0.48 - w * 0.24, y = h - (v + 1) * s * 1.1; q.strokeRect(x, y, w * 0.48, s * 1.05); q.fillStyle = 'rgba(255,79,163,.9)'; q.font = `700 ${s * 0.6}px sans-serif`; q.fillText(String(k + 1), x + w * 0.18, y + s * 0.7); });
      K.eyeFlower(q, w / 2, s * 0.8, s * 0.7); }, 256);
    hop.rotation.x = -PI / 2; hop.position.set(5.6, 0.012, 3.4); g.add(hop);
  },
  loft(c, r, g, X, K) {
    // a plinth for the fired pot
    g.add(c.slab(0.55, 0.9, 0.55, K.std(0xeeeae2, { roughness: 0.4 }), 11.6, 0.45, -3.4)); c.post(X(11.6), -3.4, 0.4);
    // a rug under the sofa corner, eye flowers woven in
    const rug = K.decal(3.4, 2.6, (q, w, h) => { q.fillStyle = '#3a2a4a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) K.eyeFlower(q, w * (0.14 + i * 0.24), h * (0.2 + j * 0.3), h * 0.11); }, 256);
    rug.rotation.x = -PI / 2; rug.position.set(13.2, 0.012, 1.6); g.add(rug);
  },
  wallst(c, r, g, X, K) {
    // the bull stands on a black marble plinth by the windows
    g.add(c.slab(0.9, 1.5, 0.9, K.std(0x111114, { roughness: 0.15, metalness: 0.3 }), 13.0, 0.75, -6.0)); c.post(X(13.0), -6.0, 0.6);
    const pl = c.sign('MLOW CAPITAL', { w: 0.8, h: 0.16, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); pl.position.set(13.0, 1.25, -5.54); g.add(pl);
  },
  rink(c, r, g, X, K) {
    // the gold statue's plinth, and a halo so it reads across the ice
    const { THREE } = c;
    g.add(c.slab(1.5, 0.8, 1.1, K.std(0x2a2a30, { roughness: 0.3, metalness: 0.4 }), 14.6, 0.4, -6.4)); c.post(X(14.6), -6.4, 0.8);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,210,120,.45)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); h.scale.set(3.2, 3.2, 1); h.position.set(14.6, 2.2, -6.5); g.add(h);
  },
  clover(c, r, g, X, K) {
    // the tripod under the found camera, and the power box spitting sparks
    const { THREE } = c, leg = K.std(0x1a1a1a, { metalness: 0.6 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.03, 1.45, 0.03, leg, 8.4 + Math.cos(a) * 0.28, 0.7, -1.2 + Math.sin(a) * 0.28); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); g.add(l); }
    c.post(X(8.4), -1.2, 0.35);
    const rec = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), K.basic(0xff2020)); rec.position.set(8.5, 1.6, -1.02); g.add(rec);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(140,200,255,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.position.set(0.5, 1.5, 0.6); g.add(sp);
    [12.6, 14.6, 16.6].forEach((x) => c.post(X(x), 0.6 + (x - 14.6) * 0.25, 0.95));
    const rg = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,60,60,.6)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); rg.scale.set(0.9, 0.9, 1); rg.position.set(8.4, 1.5, -1.25); g.add(rg);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; rg.visible = rec.visible = (t * 2 | 0) % 2 === 0; const on = Math.random() < 0.12; sp.visible = on; if (on) sp.scale.setScalar(0.3 + Math.random() * 0.6); });
  },
  pelham(c, r, g, X, K) {
    // the station's green I beams down both platforms, with the line's name stencilled on
    const beam = K.std(0x2f5a3a, { metalness: 0.5, roughness: 0.55 });
    [5.4, 14.6].forEach((x) => [-5.6, -2.6, 0.4].forEach((z) => { g.add(c.slab(0.22, 6, 0.08, beam, x, 3, z)); g.add(c.slab(0.06, 6, 0.3, beam, x, 3, z)); c.post(X(x), z, 0.2);
      const s = c.sign('28 ST', { w: 0.5, h: 0.24, bg: '#0b1020', fg: '#f4ead2', font: c.MONO, weight: 700 }); s.position.set(x, 2.2, z + 0.16); g.add(s); }));
  },
  moon(c, r, g, X, K) {
    // the bakery's shelves, stocked; a little moonlight over the piece of the moon
    const { THREE } = c;
    [0.5, 0.99, 1.47].forEach((y, j) => [15.9, 16.4, 16.9].forEach((x, k) => K.prop(r, g, X, 'croissant', x, -7.3, { len: 0.22, y: y + 0.01, ry: (j + k) * 0.7 })));
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,236,190,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); h.scale.set(1.2, 1.2, 1); h.position.set(12.6, 1.0, -6.0); g.add(h);
  },
  library(c, r, g, X, K) {
    // a cold halo over the lectern, so the saved book reads from the door
    const { THREE } = c;
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(200,230,255,.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); h.scale.set(1.6, 1.6, 1); h.position.set(10, 1.35, -2.6); g.add(h);
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  walking: { street_lamp_02: 'nyb_walking_lamp', metal_trash_can: 'nyb_trash_dsny', fire_hydrant: 'nyb_hydrant_pink', utility_box_01: 'nyb_utility_bomb' },
  katz: { WoodenTable_01: 'nyb_katz_tableplain', dining_chair_02: 'nyb_katz_chair', CashRegister_01: 'nyb_register_gold' },
  feast: { gothic_statue: 'nyb_feast_saint', wooden_barrels_01: 'nyb_feast_barrel', wooden_crate_01: 'nyb_feast_crate', painted_wooden_bench: 'nyb_feast_bench', lantern_chandelier_01: 'nyb_feast_lantern' },
  westside: { metal_trash_can: 'nyb_trash_dsny', wooden_crate_02: 'nyb_westside_crate', street_lamp_01: 'nyb_lamp_banner' },
  loft: { Sofa_01: 'nyb_loft_sofa', Rockingchair_01: 'nyb_loft_rocker', ceramic_vase_01: 'nyb_loft_vase_a', ceramic_vase_03: 'nyb_loft_vase_b', lantern_chandelier_01: 'nyb_feast_lantern' },
  wallst: { GreenChair_01: 'nyb_wallst_chair' },
  pigeons: { painted_wooden_bench: 'nyb_bench_plaque', street_lamp_01: 'nyb_pigeons_lamp', metal_trash_can: 'nyb_trash_dsny' },
  moon: { street_lamp_02: 'nyb_moon_lamp', metal_trash_can: 'nyb_trash_dsny' },
  pelham: { metal_trash_can: 'nyb_trash_dsny', WetFloorSign_01: 'nyb_pelham_wetfloor', modular_street_seating: 'nyb_pelham_bench' },
  manhattan: { street_lamp_02: 'nyb_manhattan_lamp', painted_wooden_bench: 'nyb_manhattan_bench', metal_trash_can: 'nyb_trash_dsny' },
  clover: { concrete_road_barrier: 'nyb_clover_barrier', metal_trash_can: 'nyb_trash_dsny', cardboard_box_01: 'nyb_clover_box' },
  library: { book_encyclopedia_set_01: 'nyb_library_books', decorative_book_set_01: 'nyb_library_books2', Chandelier_01: 'nyb_library_chandelier', vintage_grandfather_clock_01: 'nyb_library_clock' },
};
