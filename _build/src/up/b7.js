// Round twelve, batch 7: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Sets: miracle, treebrooklyn, gatsby, bigdaddy, serendipity, bigbusiness, hudsucker, bobbyfischer, eternal, mmmystery,
// angrymen, deskset, lostweekend. Models are the nyb_<set>_* edits in _build/brand/b7.json.
const PI = Math.PI, H = PI / 2;
// a slow spin for a ceiling fan, only while its set is the one you are in
const spinWhileHere = (c, r, o, rate) => c.tick((t, dt, P, ri) => { if (ri === r.i) o.rotation.y += dt * (typeof rate === 'function' ? rate() : rate); });

export const PROPS = {
  miracle: [
    // the hero: the Post Office's hand truck, and the sacks of letters to Santa it brought to court
    ['nyb_miracle_mailcart', 2.9, 1.2, { h: 1.45, ry: -0.6, r: 0.45, egg: ['A hand truck from the Post Office', 'miracle_postmark', 'Every sack on this truck is stamped N3W POST, TO SANTA CLAUS. The Post Office believes in him, so does the State of New York, and MLow counted the letters twice.'], snd: 'thud' }],
    ['nyb_miracle_sack', 2.95, 1.3, { len: 0.62, y: 0.12, ry: 0.4 }],
    ['nyb_miracle_sack', 2.1, 0.6, { len: 0.7, ry: 1.1, r: 0.35 }], ['nyb_miracle_sack', 2.2, 1.6, { len: 0.66, ry: -0.6, r: 0.35 }], ['nyb_miracle_sack', 3.5, 1.7, { len: 0.6, ry: 2.8, r: 0.3 }],
    // the Christmas tree in the corner by the jury, the portrait, the clock over the fireplace, the mantel
    ['nyb_miracle_tree', 18.7, -6.6, { h: 2.5, r: 0.5 }],
    ['nyb_miracle_portrait', 18.0, -7.86, { h: 1.0, y: 1.9 }],
    ['nyb_miracle_clock', 19.84, 0.0, { h: 0.55, y: 2.45, ry: -H }],
    ['brass_candleholders', 19.35, -0.45, { len: 0.55, y: 1.3, ry: -H }],
    // the court reporter's table in the well, the letters on the bench, the spittoon
    ['WoodenTable_01', 11.4, -2.6, { len: 1.1, r: 0.6 }], ['stationery_supplies', 11.3, -2.6, { len: 0.4, y: 0.78 }],
    ['brass_pot_01', 5.2, 0.9, { h: 0.3 }],
    // the public benches behind the bar
    ['painted_wooden_bench', 7.2, 6.3, { len: 2.2, r: 0.7 }], ['painted_wooden_bench', 12.8, 6.3, { len: 2.2, r: 0.7 }],
  ],
  treebrooklyn: [
    // Monday in the yard: the wash tub, the basket, the stool, under the lines
    ['nyb_treebrooklyn_tub', 8.9, 1.2, { h: 0.55, r: 0.3 }], ['wicker_basket_01', 8.1, 1.55, { len: 0.6, ry: 0.3 }], ['wooden_stool_01', 9.6, 1.6, { h: 0.45, ry: 0.4, r: 0.25 }],
    // the tin can bank on the crate, and a watering can for a tree that needs none
    ['nyb_treebrooklyn_bank', 3.55, -6.2, { h: 0.2, y: 0.6, egg: ['A tin can bank', 'treebrooklyn_bank', 'A tin can nailed to the floor, a penny in it every day toward a piece of land. Half of Brooklyn kept one. MLow keeps his for the census.'], snd: 'clink' }],
    ['nyb_treebrooklyn_can', 12.4, -2.0, { len: 0.45, ry: 2.2 }], ['planter_pot_clay', 11.9, -2.5, { h: 0.22 }],
    ['street_rat', 6.6, -5.6, { len: 0.3, ry: -0.8 }], ['wooden_ladder', 0.35, 0.6, { h: 2.6, ry: H }], ['rubber_boots', 9.9, 0.9, { h: 0.35, ry: 1.0 }],
  ],
  gatsby: [
    // the hero: the oculist's spare pair, giant, gilt, with eye flowers for lenses, dropped in the ash
    ['nyb_gatsby_spectacles', 8.6, 0.6, { len: 3.4, ry: -1.15, r: 1.2, egg: ['A giant pair of spectacles', 'gatsby_spectacles', 'The doctor on the billboard keeps a spare pair down here in the ash. MLow had the lenses reground as eye flowers, so they watch the road even when the sign is asleep.'], snd: 'clink' }],
    // Wilson's garage: drums, a gas can, tyres, the tools
    ['nyb_gatsby_drum', 0.95, -0.2, { h: 0.95, r: 0.35 }], ['nyb_gatsby_drum', 1.7, -0.45, { h: 0.95, ry: 1.3, r: 0.35 }], ['nyb_gatsby_drum', 1.25, -0.25, { h: 0.95, y: 0.95, ry: 0.5 }],
    ['nyb_gatsby_gascan', 2.15, 1.35, { h: 0.46, ry: -0.7 }], ['old_tyre', 2.6, 0.3, { len: 0.75, r: 0.4 }], ['old_tyre', 2.6, 0.3, { len: 0.75, y: 0.24, ry: 0.6 }],
    ['tire_pump', 1.1, 1.75, { h: 0.6, ry: 0.4 }], ['oil_tin', 2.2, -0.4, { h: 0.22, ry: 0.5 }], ['small_oil_can_01', 1.6, 0.35, { len: 0.25, y: 1.9 }],
    // the ash men: their shovels, their drums of ash, the barrel they warm their hands at
    ['nyb_gatsby_spade', 5.6, -1.1, { h: 1.15, ry: 0.3 }], ['nyb_gatsby_spade', 6.8, -1.6, { h: 1.15, ry: -0.4 }], ['nyb_gatsby_spade', 8.0, -2.2, { h: 1.15, ry: 0.9 }],
    ['nyb_gatsby_drum2', 9.0, -3.4, { h: 0.95, r: 0.35 }], ['nyb_gatsby_drum2', 9.8, -3.9, { h: 0.95, ry: 2, r: 0.35 }], ['barrel_stove', 6.4, -0.2, { h: 0.85, r: 0.35 }],
    ['dead_tree_trunk', 12.6, 1.2, { len: 3.0, ry: 0.5, r: 0.6 }], ['cement_bag', 3.6, -0.9, { len: 0.7, ry: 0.4 }],
    // the telephone line along the road
    ['nyb_gatsby_pole', 0.8, 6.9, { h: 4.8, ry: 0.2, r: 0.2 }], ['nyb_gatsby_pole', 19.2, 6.9, { h: 4.8, ry: -0.2, r: 0.2 }],
  ],
  bigdaddy: [
    // the hero: a frank cart on the Mall, ketchup on everything, because that is the only way he eats
    ['nyb_bigdaddy_cart', 5.5, -3.7, { len: 2.2, ry: -0.56, r: 1.0, egg: ['A frank cart', 'bigdaddy_ketchup', 'N3W FRANKS, KETCHUP ON EVERYTHING. The kid orders his with ketchup and nothing else, the vendor counts him as a regular, and MLow paid for the next one.'], snd: 'ding' }],
    ['nyb_bigdaddy_sign', 6.7, 1.0, { h: 1.5, ry: -0.9, r: 0.4 }],
    ['nyb_trash_dsny', 13.2, 1.5, { h: 0.95, r: 0.35 }], ['nyb_trash_dsny', 6.6, -6.1, { h: 0.95, r: 0.35 }],
    ['nyb_lamp_banner', 7.0, -6.3, { h: 4.2, r: 0.25 }], ['nyb_lamp_banner', 13.0, -6.3, { h: 4.2, r: 0.25 }],
    ['shrub_01', 1.0, 0.7, { h: 1.0, r: 0.5 }], ['shrub_02', 19.0, -6.9, { h: 1.2, r: 0.6 }], ['shrub_01', 19.1, -0.6, { h: 0.9, r: 0.5 }],
    ['american_football', 6.2, -1.6, { len: 0.3, ry: 0.7 }], ['nyb_bench_plaque', 14.4, -3.4, { len: 2.0, ry: -H, r: 0.7 }],
  ],
  serendipity: [
    // the hero: the lobby clock everybody on Park Avenue arranges to meet under
    ['nyb_serendipity_clock', 10.0, -1.3, { h: 3.1, ry: -1.05, r: 0.5, egg: ['The lobby clock', 'serendipity_clock', 'Meet me under the clock, said every couple who ever lost each other in a hotel on Park. MLow set it to the minute you were counted, so you are never late.'], snd: 'ding' }],
    // a sofa and two chairs to wait in, a side table, a vase
    ['sofa_03', 3.3, -2.6, { len: 2.6, ry: H, r: 0.9 }], ['GreenChair_01', 5.3, -3.9, { h: 1.05, ry: -H - 0.3, r: 0.4 }], ['GreenChair_01', 5.3, -1.3, { h: 1.05, ry: -H + 0.3, r: 0.4 }],
    ['side_table_01', 3.4, -4.4, { h: 0.55 }], ['brass_vase_01', 3.4, -4.4, { h: 0.6, y: 0.55 }],
    // the bellhop's cart with somebody's luggage, floor 23
    ['hand_truck', 17.4, -4.0, { h: 1.4, ry: -0.8, r: 0.4 }], ['nyb_serendipity_luggage', 16.7, -4.6, { len: 1.5, ry: -0.5, r: 0.6 }], ['nyb_serendipity_luggage', 16.7, -4.5, { len: 1.3, y: 0.24, ry: -0.3 }],
    // the mirror by the lifts
    ['ornate_mirror_01', 18.0, -7.86, { h: 1.6, y: 0.9 }], ['ornate_mirror_01', 2.0, -7.86, { h: 1.6, y: 0.9 }],
    // the console by the east door, and a table for two
    ['ClassicConsole_01', 19.35, 0.5, { len: 1.5, ry: -H, r: 0.4 }], ['brass_candleholders', 19.35, 0.5, { len: 0.7, y: 0.95, ry: -H }],
    ['round_wooden_table_02', 14.6, 0.2, { len: 0.9, r: 0.55 }], ['GreenChair_01', 14.6, -0.75, { h: 1.05, r: 0.35 }], ['GreenChair_01', 15.5, 0.6, { h: 1.05, ry: -2.0, r: 0.35 }], ['brass_goblets', 14.6, 0.2, { len: 0.3, y: 0.76 }],
  ],
  hudsucker: [
    // the hero: the president's desk on the 44th floor, turned to face whoever walks in
    ['nyb_hudsucker_desk', 15.6, 0.7, { len: 2.0, ry: -H, r: 0.9, egg: ['The president\'s desk', 'hudsucker_president', 'THE PRESIDENT, N3W INDUSTRIES, FLOOR 44. The last one left by the window; this one came up from the mailroom with a circle drawn on an envelope. MLow took the minutes.'], snd: 'thud' }],
    ['nyb_hudsucker_chair', 16.5, 0.7, { h: 1.0, ry: -H }], ['nyb_hudsucker_phone', 19.84, 0.7, { h: 0.6, y: 1.3, ry: -H }],
    ['cigarette_case', 15.5, 1.3, { len: 0.3, y: 0.79, ry: 0.4 }], ['office_notepads', 15.5, 0.1, { len: 0.35, y: 0.79 }],
    // the board's papers and water down the long table
    ['office_notepads', 9.6, -4.8, { len: 0.35, y: 0.79 }], ['office_notepads', 10.4, -2.6, { len: 0.35, y: 0.79, ry: PI }], ['office_notepads', 9.6, -0.4, { len: 0.35, y: 0.79 }],
    ['brass_goblets', 10.0, -3.7, { len: 0.3, y: 0.79 }], ['brass_goblets', 10.0, 1.2, { len: 0.3, y: 0.79 }],
    // the founder, framed; plants in the corners
    ['fancy_picture_frame_02', 18.0, -7.86, { h: 1.2, y: 1.5 }], ['potted_plant_04', 19.1, -6.8, { h: 1.3, r: 0.4 }], ['potted_plant_04', 19.2, 6.9, { h: 1.3, r: 0.4 }],
  ],
  bobbyfischer: [
    // the hero: the hustler's own board by the gate, pink and blue men, five dollars a game
    ['nyb_bobbyfischer_chess', 2.7, 1.3, { len: 0.78, y: 0.8, ry: -0.5, egg: ['The hustler\'s board', 'bobbyfischer_board', 'Five dollars a game, touch move, no crying. The pink men always move first on this board, and the hustler swears MLow is the only one who ever beat him in under ten.'], snd: 'slap' }],
    ['nyb_bobbyfischer_stool', 2.0, 1.75, { h: 0.45, ry: 1.0 }], ['nyb_bobbyfischer_stool', 3.4, 0.85, { h: 0.45, ry: -0.6 }],
    ['nyb_bobbyfischer_sign', 1.2, 0.0, { h: 1.5, ry: -0.15, r: 0.4 }],
    ['nyb_trash_dsny', 6.6, -6.2, { h: 0.95, r: 0.35 }], ['nyb_trash_dsny', 13.4, -6.2, { h: 0.95, r: 0.35 }],
    ['nyb_bench_plaque', 8.0, -6.1, { len: 2.0, r: 0.7 }], ['nyb_bench_plaque', 12.0, -6.1, { len: 2.0, r: 0.7 }], ['boombox', 12.4, -6.05, { len: 0.5, y: 0.45, ry: 0.2 }],
    ['folding_wooden_stool', 13.2, 1.8, { h: 0.45, ry: 0.8 }],
  ],
  mmmystery: [
    // the screen we are behind, the seats waiting to be bolted down, the reels, the sandbags
    ['nyb_mmmystery_screen', 15.6, -3.4, { h: 2.8, ry: -0.55, r: 0.7 }],
    ['nyb_mmmystery_seat', 2.2, -1.0, { h: 1.05, ry: H, r: 0.35 }], ['nyb_mmmystery_seat', 2.2, -0.2, { h: 1.05, ry: H, r: 0.35 }], ['nyb_mmmystery_seat', 2.2, 0.6, { h: 1.05, ry: H, r: 0.35 }],
    ['nyb_mmmystery_seat', 17.8, -1.0, { h: 1.05, ry: -H, r: 0.35 }], ['nyb_mmmystery_seat', 17.8, -0.2, { h: 1.05, ry: -H, r: 0.35 }],
    ['wooden_crate_01', 17.9, 6.4, { h: 0.6, r: 0.45 }], ['nyb_mmmystery_reel', 17.9, 6.4, { len: 0.42, y: 0.6, ry: 0.2 }], ['nyb_mmmystery_reel', 17.9, 6.4, { len: 0.42, y: 0.68, ry: 0.9 }], ['nyb_mmmystery_reel', 17.85, 6.45, { len: 0.42, y: 0.76, ry: -0.4 }],
    ['ladder_sectioned_01', 1.1, -7.75, { h: 3.4 }], ['nyb_mmmystery_sandbag', 1.6, -7.0, { len: 0.7, ry: 0.3 }], ['nyb_mmmystery_sandbag', 2.2, -7.2, { len: 0.7, ry: -0.2 }], ['nyb_mmmystery_sandbag', 1.9, -7.1, { len: 0.7, y: 0.18, ry: 1.2 }],
  ],
  angrymen: [
    // the table's clutter: water, notepads, cigarettes
    ['nyb_angrymen_pitcher', 10.0, -0.6, { h: 0.24, y: 0.79, ry: 0.6 }], ['office_notepads', 9.4, -4.4, { len: 0.35, y: 0.79, ry: H }], ['office_notepads', 10.6, -3.1, { len: 0.35, y: 0.79, ry: -H }],
    ['office_notepads', 9.4, -0.6, { len: 0.35, y: 0.79, ry: H }], ['office_notepads', 10.6, 0.7, { len: 0.35, y: 0.79, ry: -H }],
    ['cigarette_pack', 9.5, -3.6, { len: 0.09, y: 0.79 }], ['cigarette_pack', 10.5, -1.0, { len: 0.09, y: 0.79, ry: 1 }], ['cigarette_pack', 9.6, 1.2, { len: 0.09, y: 0.79, ry: 2 }],
    // the clock over the door, the law reports, the wastebasket
    ['nyb_angrymen_clock', 0.14, 3.8, { h: 0.5, y: 4.3, ry: H }], ['wooden_bookshelf_worn', 19.5, 0.7, { h: 2.0, ry: -H }], ['book_encyclopedia_set_01', 19.5, 0.7, { len: 0.6, y: 1.05, ry: -H }],
    ['wicker_basket_01', 13.0, -6.1, { len: 0.4 }],
  ],
  deskset: [
    // the hero: the department's card catalogue, by the door, the thing the machine was bought to replace
    ['nyb_deskset_cabinet', 2.6, 0.6, { h: 1.9, ry: 0.7, r: 0.6, egg: ['The card catalogue', 'deskset_catalogue', 'CARD CATALOGUE, ASK BUNNY. Every drawer cross filed by hand: weights, ships, poems, and one drawer marked PEOPLE that holds the census. The electronic brain has never found it.'], snd: 'tick' }],
    // a second desk in the well, set for Sylvia, and its desk things
    ['metal_office_desk', 11.0, -0.4, { len: 1.6, ry: PI, r: 0.8 }], ['desk_lamp_arm_01', 10.5, -0.6, { h: 0.5, y: 0.79 }], ['vintage_stapler', 11.3, -0.6, { len: 0.18, y: 0.79, ry: 0.6 }],
    ['binder_notebook', 11.6, -0.2, { len: 0.3, y: 0.79, ry: 0.3 }], ['office_notepads', 14.3, -1.0, { len: 0.35, y: 0.79 }],
    // the reference phone on the wall, the department clock
    ['nyb_deskset_phone', 19.84, 0.8, { h: 0.6, y: 1.25, ry: -H }], ['wall_clock', 18.0, -7.86, { h: 0.5, y: 3.0 }],
    // the reading table, with the encyclopaedia open on it
    ['round_wooden_table_01', 15.6, 1.0, { len: 1.1, r: 0.6 }], ['book_encyclopedia_set_01', 15.6, 1.0, { len: 0.55, y: 0.73, ry: 0.4 }], ['dining_chair_02', 14.8, 1.3, { h: 0.95, ry: 1.9 }], ['dining_chair_02', 16.4, 0.7, { h: 0.95, ry: -1.2 }],
    ['potted_plant_02', 19.0, 6.9, { h: 1.3, r: 0.4 }], ['potted_plant_02', 1.0, 6.9, { h: 1.3, r: 0.4 }],
  ],
  lostweekend: [
    // the hero: the suitcase packed for the weekend in the country, a bottle of rye riding on top of it
    ['nyb_lostweekend_case', 3.1, -1.1, { len: 0.85, ry: 0.5, r: 0.45, egg: ['A packed suitcase', 'lostweekend_case', 'Packed on Thursday for a weekend in the country, never carried past the door. THE WEEKEND, BY MLow: one bottle in the case, one on the string out the window, one in the light. He counts them; nobody else is allowed to.'], snd: 'clink' }],
    ['nyb_lostweekend_rye', 3.15, -1.1, { h: 0.32, y: 0.24, ry: 0.3 }],
    // the bottles he hides: the table, the nightstand, behind the sofa
    ['nyb_lostweekend_rye', 5.7, -3.7, { h: 0.32, y: 0.78 }], ['nyb_lostweekend_rye', 5.3, 6.75, { h: 0.32, y: 0.7 }], ['nyb_lostweekend_rye', 16.9, 6.1, { h: 0.32, ry: 1.2 }],
    // the armchair turned to the wall with the crack in it, and its side table
    ['ArmChair_01', 9.4, 0.4, { h: 1.0, ry: -2.2, r: 0.5 }], ['side_table_tall_01', 8.6, 1.1, { h: 0.75 }], ['nyb_lostweekend_rye', 8.6, 1.1, { h: 0.3, y: 0.75 }],
    // the mousetrap under the crack, the nightstand and its lamp, the clock, a picture
    ['nyb_lostweekend_trap', 0.55, 0.9, { len: 0.25, ry: 0.5 }], ['ClassicNightstand_01', 5.3, 6.75, { h: 0.7 }], ['vintage_oil_lamp', 5.05, 6.8, { h: 0.6, y: 0.7 }],
    ['wall_clock', 19.84, 0.8, { h: 0.45, y: 2.6, ry: -H }], ['hanging_picture_frame_01', 18.0, -7.86, { h: 1.0, y: 1.8 }],
  ],
};

export const ROOM = {
  lostweekend(c, r, g, X, K) {
    // a bare bulb on a pull chain over the bed, glowing
    K.prop(r, g, X, 'pull_chain_light_socket', 3.6, 5.6, { h: 0.2, y: 5.8 });
    const bulb = new c.THREE.Sprite(new c.THREE.SpriteMaterial({ map: K.glowTex('rgba(255,220,160,.6)'), transparent: true, depthWrite: false, blending: c.THREE.AdditiveBlending })); bulb.scale.set(0.8, 0.8, 1); bulb.position.set(3.6, 5.72, 5.6); g.add(bulb);
  },
  deskset(c, r, g, X, K) {
    // fluorescent tubes over the department, 1957 office issue
    [[6, -1.6], [14, -1.6], [6, 3.6], [14, 3.6]].forEach(([x, z]) => K.prop(r, g, X, 'mounted_fluorescent_lights', x, z, { len: 1.3, y: 5.92 }));
    // Sylvia at her desk
    K.extra(g, 11.0, -1.15, { seated: true, col: 0x6a3a5a, ry: 0 });
  },
  angrymen(c, r, g, X, K) {
    // the hero: the ceiling fan over the table, stuck all summer; it only turns once the room is twelve to nothing
    const fan = K.prop(r, g, X, 'nyb_angrymen_fan', 10.0, -1.8, { len: 1.5, y: 5.45 }); let nudge = 0;
    c.clickable(fan, () => { nudge = 1.2; c.sound.tick(); c.egg('angrymen_fan', 'The ceiling fan in jury room twelve, N3W COUNTY. It has not turned all summer. It starts the minute the last juror changes his mind, and MLow wired it to the tally board.'); }, 'The ceiling fan');
    const rain = g.children.find((o) => o.isLineSegments);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const on = rain && rain.material.opacity > 0.2; nudge = Math.max(0, nudge - dt * 0.5); fan.rotation.y += dt * (on ? 9 : nudge * 3 + Math.max(0, Math.sin(t * 0.7)) * 0.08); });
    [-4.6, 1.0].forEach((z) => K.prop(r, g, X, 'modern_ceiling_lamp_01', 10.0, z, { h: 0.9, y: 5.0 }));
    // the guard who locks them in
    K.extra(g, 17.8, 1.3, { col: 0x1a2a4a, ry: -2.2 }); c.post(X(17.8), 1.3, 0.3);
  },
  mmmystery(c, r, g, X, K) {
    // the hero: booth one, high on the back wall where the beam starts, with the house projector on its shelf
    const shelf = K.std(0x2a2020, { roughness: 0.7 }); g.add(c.slab(2.6, 0.12, 1.1, shelf, 10, 3.35, 7.3));
    [-1.2, 1.2].forEach((x) => { const b = c.slab(0.08, 0.6, 0.08, shelf, 10 + x, 3.05, 7.5); b.rotation.x = 0.7; g.add(b); });
    const pj = K.prop(r, g, X, 'nyb_mmmystery_projector', 10, 7.25, { h: 1.0, y: 3.41, ry: PI });
    c.clickable(pj, () => { c.sound.tick(); c.egg('mmmystery_projector', 'Booth one, the MLow Revival House. The mirror maze picture runs every night at nine, and the projectionist rewinds it by hand, counting the frames.'); }, 'The projector');
    const lens = new c.THREE.Sprite(new c.THREE.SpriteMaterial({ map: K.glowTex('rgba(255,240,210,.7)'), transparent: true, depthWrite: false, blending: c.THREE.AdditiveBlending })); lens.scale.set(0.9, 0.9, 1); lens.position.set(10, 3.9, 6.75); g.add(lens);
    c.tick((t, dt, P, ri) => { if (ri === r.i) lens.material.opacity = 0.7 + Math.abs(Math.sin(t * 24)) * 0.3; });
    // work lights over the backstage
    [[6, 1], [14, 1]].forEach(([x, z]) => K.prop(r, g, X, 'caged_hanging_light', x, z, { len: 1.1, y: 4.9 }));
  },
  eternal(c, r, g, X, K) {
    // everything new here is a memory too: it joins the set's erasing (one at a time, while you look away) and comes back with the rest
    const { THREE } = c, mine = [];
    const keep = (name, x, z, o) => { const m = K.prop(r, g, X, name, x, z, o); m.userData.s = 1; mine.push(m); return m; };
    // the hero: the bed on the beach, the last memory to go
    const bed = keep('nyb_eternal_bed', 11.8, -1.0, { len: 2.0, ry: -0.5, r: 0.9 });
    c.clickable(bed, () => { c.sound.whoosh(0.08, 0.6); c.egg('eternal_bed', 'A bed on the beach at Montauk, in the snow: the last memory they get to. Lacuna files it under PATIENT: YOU. MLow kept a copy in the census.'); }, 'A bed in the snow');
    // the shop: two cases of books, a display table, the lamps
    keep('nyb_eternal_books', 19.45, 0.6, { h: 2.1, ry: -H }); keep('nyb_eternal_books', 18.0, -7.5, { h: 2.1 });
    keep('wooden_display_shelves_01', 3.2, 0.8, { h: 1.1, ry: 0.4, r: 0.5 }); keep('book_encyclopedia_set_01', 9.6, -4.4, { len: 0.5, y: 0.76, ry: 0.3 });
    keep('hanging_industrial_lamp', 6.0, -1.0, { h: 1.3, y: 4.7 }); keep('hanging_industrial_lamp', 14.0, 1.0, { h: 1.3, y: 4.7 }); keep('potted_plant_01', 19.0, 6.9, { h: 1.2 });
    const snow = g.children.find((o) => o.isPoints), fw = new THREE.Vector3(), wp = new THREE.Vector3(); let next = 1.3;
    c.tick((t, dt, P, ri) => {
      mine.forEach((m) => { m.scale.setScalar(Math.max(0.001, m.scale.x + (m.userData.s - m.scale.x) * Math.min(1, dt * 2))); });
      const on = ri === r.i && snow && snow.material.opacity >= 0.04;
      if (!on) { mine.forEach((m) => { m.userData.s = 1; }); return; }
      next -= dt; if (next > 0) return; next = 1.3;
      c.camera.getWorldDirection(fw); const unseen = mine.filter((m) => { if (m.userData.s < 1) return false; m.getWorldPosition(wp); const dx = wp.x - P.x, dz = wp.z - P.z, L = Math.hypot(dx, dz) || 1; return (dx * fw.x + dz * fw.z) / L < 0.7; });
      if (unseen.length) unseen[(Math.random() * unseen.length) | 0].userData.s = 0.001;
    });
  },
  bobbyfischer(c, r, g, X, K) {
    // the hustler's stone table by the gate, like the park's own
    const stone = K.std(0x9a948a, { roughness: 0.8 }); g.add(c.slab(0.9, 0.08, 0.9, stone, 2.7, 0.76, 1.3)); g.add(c.slab(0.28, 0.72, 0.28, stone, 2.7, 0.36, 1.3)); c.post(X(2.7), 1.3, 0.65);
    // kibitzers round the blitz table and the corner tables, leaning in
    [[9.2, 2.2, 2.6, 0x4a3a2a], [10.9, 2.3, -2.7, 0x2a3a4a], [5.0, -1.1, -2.6, 0x5a4a5a], [15.0, -1.0, 2.5, 0x3a5a3a], [10.0, -2.6, PI, 0x6a4a3a]].forEach(([x, z, ry, col]) => { const e = K.extra(g, x, z, { col, ry }); e.rotation.x = 0.12; c.post(X(x), z, 0.3); });
  },
  hudsucker(c, r, g, X, K) {
    // globe pendants over the long table, gilt
    [-4.0, -1.0, 2.0].forEach((z) => K.prop(r, g, X, 'nyb_hudsucker_globe', 10.0, z, { h: 1.0, y: 4.9 }));
    // the new president himself, behind the desk
    K.extra(g, 16.5, 0.7, { seated: true, col: 0x2a2a3a, ry: -H });
    // a lamp on the desk, lit, so the gold reads across a dark floor
    K.prop(r, g, X, 'desk_lamp_arm_01', 15.75, 1.45, { h: 0.5, y: 0.79, ry: -H });
    const glow = new c.THREE.Sprite(new c.THREE.SpriteMaterial({ map: K.glowTex('rgba(255,214,140,.55)'), transparent: true, depthWrite: false, blending: c.THREE.AdditiveBlending })); glow.scale.set(2.2, 2.2, 1); glow.position.set(15.4, 1.15, 1.2); g.add(glow);
  },
  bigbusiness(c, r, g, X, K) {
    // everything new comes in pairs, one each side of the glassless mirror (z = MZ), so the reflection never gives itself away
    const MZ = -0.8;
    const pair = (name, x, d, o = {}, click) => [1, -1].forEach((s) => { const m = K.prop(r, g, X, name, x, MZ + s * d, { ...o, ry: s > 0 ? (o.ry || 0) : PI - (o.ry || 0) }); if (click && s > 0) c.clickable(m, click, 'A gilt vanity'); });
    // the hero: a gilt vanity, Suite 1111, with its own mirror and perfume, against each side of the pink wall
    pair('nyb_bigbusiness_vanity', 3.0, 0.45, { len: 1.5, r: 0.45 }, () => { c.sound.ding(); c.egg('bigbusiness_vanity', 'Suite 1111 has two of everything: two vanities, two gold mirrors, two women with the same face. MLow counted them twice and got one New Yorker each time.'); });
    pair('nyb_bigbusiness_mirror', 3.0, 0.13, { h: 1.1, y: 1.1 });
    pair('brass_vase_01', 2.55, 0.5, { h: 0.32, y: 0.95 }); pair('brass_candleholders', 3.45, 0.5, { len: 0.45, y: 0.95 });
    // ottomans in the middle of the lounge, low enough not to hide the twin
    pair('Ottoman_01', 8.0, 1.7, { h: 0.45, r: 0.35 }); pair('Ottoman_01', 12.0, 1.7, { h: 0.45, ry: 0.5, r: 0.35 });
    // a picture on the far partition, and a chandelier each side
    pair('fancy_picture_frame_02', 17.2, 0.12, { h: 0.9, y: 1.4 }); pair('Chandelier_02', 10.0, 3.0, { h: 0.9, y: 4.7 }); pair('Chandelier_02', 4.0, 3.0, { h: 0.9, y: 4.7 });
  },
  serendipity(c, r, g, X, K) {
    // two more chandeliers down the lobby
    [[5.0, -2.4], [15.0, -2.4]].forEach(([x, z]) => K.prop(r, g, X, 'nyb_serendipity_chandelier', x, z, { h: 1.0, y: 4.8 }));
  },
  bigdaddy(c, r, g, X, K) {
    // pigeons working the frank cart
    for (let k = 0; k < 4; k++) { const p = c.glb('pigeon', { len: 0.35, x: 4.6 + k * 0.5, z: -2.5 + (k % 2) * 0.4, ry: k * 1.7, parent: g }); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; p.position.y = Math.abs(Math.sin(t * 4 + k)) * 0.02; p.rotation.y = k * 1.7 + Math.sin(t * 0.8 + k) * 0.8; }); }
  },
  gatsby(c, r, g, X, K) {
    // the wires between the poles, sagging over the valley
    const { THREE } = c, wm = new THREE.LineBasicMaterial({ color: 0x2a2620 });
    [4.62, 4.05].forEach((y) => { const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push(new THREE.Vector3(0.8 + 18.4 * u, y - Math.sin(u * PI) * 0.5, 6.9)); } g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wm)); });
    // the garage sign on the wall
    const s = c.sign('WILSON\'S GARAGE\nREPAIRS  GAS  N3W MOTOR OIL', { w: 2.4, h: 0.62, bg: '#d8ccb0', fg: '#3a2a1a', font: c.SERIF, weight: 900, border: '#6a5a3a' }); s.position.set(0.14, 3.1, 0.55); s.rotation.y = H; g.add(s);
  },
  treebrooklyn(c, r, g, X, K) {
    // the fire escape, assembled and painted ours: two storeys over the yard, off the paintings, with Francie reading on the first landing
    const fe = g.children.find((o) => o.isGroup && Math.abs(o.position.x - 18.4) < 0.01 && Math.abs(o.position.z + 4.4) < 0.01);
    if (fe) { fe.scale.setScalar(4.4 / 3.6); fe.position.set(18.75, 0, -6.2); c.clickable(fe, () => c.egg('treebrooklyn_fireescape', 'Francie\'s reading room: the fire escape, one library book a day, and a tree that will not quit. Every reader in the yard is counted, and MLow left the window open.'), 'The fire escape'); }
    const fr = K.extra(g, 18.55, -6.0, { seated: true, col: 0x8a5a6a, ry: -H }); fr.position.y = 1.7; fr.scale.setScalar(0.8);
    K.prop(r, g, X, 'planter_pot_clay', 18.5, -7.1, { h: 0.24, y: 1.72 }); K.prop(r, g, X, 'planter_pot_clay', 18.5, -5.2, { h: 0.2, y: 1.72 });
    // the coal and ice man's sign, painted on the yard wall
    const s = c.sign('ICE  COAL  WOOD\nN3W DELIVERY CO.  BY MLow', { w: 2.6, h: 0.6, bg: '#e8dcc0', fg: '#7a1a1a', font: c.SERIF, weight: 900, border: '#7a1a1a' }); s.position.set(0.14, 3.45, -4.2); s.rotation.y = H; g.add(s);
  },
  miracle(c, r, g, X, K) {
    // two ceiling fans turning slowly over the court, as they did before air conditioning reached Centre Street
    [[6.0, -1.6], [14.0, -1.6]].forEach(([x, z], k) => { const f = K.prop(r, g, X, 'nyb_miracle_fan', x, z, { len: 1.3, y: 5.5, ry: k }); spinWhileHere(c, r, f, 1.4); });
    // the court reporter, taking it all down
    K.extra(g, 11.4, -1.85, { seated: true, col: 0x3a3a4a, ry: PI });
    // the public, on the benches behind the bar
    [[6.6, 0x4a4a5a], [7.8, 0x6a5a4a], [12.4, 0x3a4a3a], [13.4, 0x5a3a3a]].forEach(([x, col]) => K.extra(g, x, 6.25, { seated: true, col, ry: PI }));
    // Exhibit A on its easel in the well
    const ea = new c.THREE.Group(); ea.position.set(8.4, 0, -2.6); ea.rotation.y = 0.5; g.add(ea);
    const wood = K.std(0x4a3018); [[-0.35, 0.12], [0.35, 0.12], [0, -0.3]].forEach(([x, z]) => { const l = c.slab(0.04, 1.7, 0.04, wood, x, 0.82, z); l.rotation.x = z < 0 ? -0.2 : 0.08; ea.add(l); });
    const ex = c.sign('EXHIBIT A\nLETTERS TO SANTA\nN3W POST, 21 SACKS', { w: 0.9, h: 0.7, bg: '#f4ead2', fg: '#1a1a1a', font: c.SERIF, weight: 800, border: '#c8a050' }); ex.position.set(0, 1.25, 0.16); ex.rotation.x = -0.08; ea.add(ex); c.post(X(8.4), -2.6, 0.45);
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  lostweekend: { Sofa_01: 'nyb_lostweekend_sofa', old_bed_frame: 'nyb_lostweekend_bed', WoodenTable_02: 'nyb_lostweekend_table' },
  deskset: { metal_office_desk: 'nyb_deskset_desk', Shelf_01: 'nyb_deskset_shelf', book_encyclopedia_set_01: 'nyb_deskset_books' },
  angrymen: { WoodenChair_01: 'nyb_angrymen_chair', WetFloorSign_01: 'nyb_angrymen_wetfloor' },
  eternal: { Sofa_01: 'nyb_eternal_sofa', Television_01: 'nyb_eternal_tv', vintage_suitcase: 'nyb_eternal_case' },
  bobbyfischer: { street_lamp_02: 'nyb_bobbyfischer_lamp' },
  hudsucker: { dining_chair_02: 'nyb_hudsucker_chair' },
  bigbusiness: { ArmChair_01: 'nyb_bigbusiness_armchair', potted_plant_02: 'nyb_bigbusiness_planter', ornate_mirror_01: 'nyb_bigbusiness_mirror' },
  serendipity: { Chandelier_01: 'nyb_serendipity_chandelier', potted_plant_02: 'nyb_serendipity_planter' },
  bigdaddy: { painted_wooden_bench: 'nyb_bigdaddy_bench', street_lamp_02: 'nyb_bigdaddy_lamp' },
  miracle: { WoodenChair_01: 'nyb_miracle_juror', WoodenTable_03: 'nyb_miracle_counsel' },
  treebrooklyn: { modular_fire_escape: 'nyb_treebrooklyn_fireescape', metal_trash_can: 'nyb_treebrooklyn_ashcan', wooden_crate_02: 'nyb_treebrooklyn_crate' },
};
