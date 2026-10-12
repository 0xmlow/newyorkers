// Round twelve, batch 5: see UPGRADE_BRIEF_2026-10-10.md. PROPS rows are [name, x, z, opts] exactly as in build.js;
// ROOM functions get (c, r, g, X, K, mats) where K is the kit (prop, decal, extra, std, basic, eyeFlower, bulbs, ...).
// Batch 5 sets: legend, llewyn, fisherking, waituntildark, tootsie, insideman, prada, blackswan, cocktail, gangs,
// oddcouple, ontown, godfather. Every nyb_<set>_* model is a Poly Haven CC0 prop made ours in _build/brand/b5.json.
const PI = Math.PI;

// ---------- small helpers, local to this batch ----------
const GT = {};
// a soft additive glow, for practicals: lamps, candles, neon. No real lights: every set shares one scene.
function halo(c, K, g, col, s, x, y, z) {
  const T = c.THREE, sp = new T.Sprite(new T.SpriteMaterial({ map: GT[col] ||= K.glowTex(col), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  sp.scale.set(s, s, 1); sp.position.set(x, y, z); g.add(sp); return sp;
}
function sg(c, g, text, o, x, y, z, ry = 0) { const s = c.sign(text, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }
function dc(K, g, w, h, draw, x, y, z, ry = 0, px = 256) { const m = K.decal(w, h, draw, px); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; }
function box(c, g, w, h, d, mat, x, y, z, ry = 0) { const m = c.slab(w, h, d, mat, x, y, z); m.rotation.y = ry; g.add(m); return m; }
// a solid footprint for something the visitor should not walk through
function solid(c, X, x1, z1, x2, z2) { c.wall(X(x1), z1, X(x2), z1); c.wall(X(x2), z1, X(x2), z2); c.wall(X(x2), z2, X(x1), z2); c.wall(X(x1), z2, X(x1), z1); }
// fit a line of text into a width on a canvas
function fit(q, s, font, weight, px, maxW) { let f = px; q.font = `${weight} ${f}px ${font}`; while (q.measureText(s).width > maxW && f > 8) { f -= 2; q.font = `${weight} ${f}px ${font}`; } return f; }
// a printed poster or notice: a title, an eye flower, a few lines
function poster(c, K, g, w, h, o, x, y, z, ry = 0) {
  const { bg = '#f4ead2', fg = '#111111', acc = '#ff4fa3', title = '', lines = [], eye = true, tf = c.SERIF, worn = 0 } = o;
  return dc(K, g, w, h, (q, W2, H2) => {
    q.fillStyle = bg; q.fillRect(0, 0, W2, H2); q.strokeStyle = acc; q.lineWidth = W2 * 0.025; q.strokeRect(W2 * 0.04, W2 * 0.04, W2 * 0.92, H2 - W2 * 0.08);
    q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = fg;
    let yy = H2 * 0.13; if (title) { const f = fit(q, title, tf, 900, H2 * 0.12, W2 * 0.84); q.fillText(title, W2 / 2, yy); yy += f * 0.9; }
    if (eye) { const R = Math.min(W2, H2) * 0.2; K.eyeFlower(q, W2 / 2, yy + R * 1.05, R); yy += R * 2.3; }
    q.fillStyle = fg; lines.forEach((l) => { const f = fit(q, l, c.MONO, 700, H2 * 0.055, W2 * 0.84); q.fillText(l, W2 / 2, yy); yy += f * 1.35; });
    if (worn) { q.globalAlpha = worn; for (let k = 0; k < 900; k++) { q.fillStyle = Math.random() < 0.6 ? '#000' : '#fff'; q.fillRect(Math.random() * W2, Math.random() * H2, 3, 3); } q.globalAlpha = 1; }
  }, x, y, z, ry, 512);
}
// a hanging cord from the ceiling down to y
function cord(c, K, g, x, z, y, top = 6) { box(c, g, 0.012, top - y, 0.012, K.std(0x111111), x, y + (top - y) / 2, z); }
// a ceiling fan that turns only while you are in its set
function fan(c, K, r, g, X, x, z, y = 5.48) { const m = K.prop(r, g, X, 'ceiling_fan', x, z, { len: 1.4, y }); c.tick((t, dt, P, ri) => { if (ri === r.i) m.rotation.y += dt * 2.4; }); return m; }

export const PROPS = {
};

export const ROOM = {
  // ---------- I Am Legend, 2007: Times Square, three years after ----------
  legend(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o);
    // the hero: his daily broadcast. A field radio on a ration crate, the generator beside it, his chair facing the dial.
    p('nyb_legend_crate', 10.9, -0.3, { len: 1.3, ry: -0.12, r: 0.75 });
    p('nyb_legend_radio', 10.85, -0.28, { h: 1.25, y: 0.48, ry: -0.12, egg: ['N3W RADIO, AM 317', 'legend_radio', 'N3W RADIO, AM 317. Every day at midday the same broadcast: food, shelter, the seaport at noon. MLow keeps it on the dial and adds one line: if you are out there, you are counted.'],
      fn: (cc) => [0, 160, 320, 900, 1060].forEach((d) => setTimeout(() => cc.sound.beep(d < 800 ? 880 : 660, 0.05, 0.12, 'sine'), d)) });
    p('portable_generator', 12.2, 0.15, { len: 0.8, ry: -0.6, r: 0.45 });
    p('plastic_monobloc_chair_01', 9.75, 0.15, { h: 0.85, ry: PI / 2 + 0.5 });
    // the quarantine line from the evacuation, still standing, and the cars nobody came back for
    p('nyb_legend_barrier', 5.0, -6.3, { len: 1.6, ry: 0.1, r: 0.7 }); p('nyb_legend_barrier', 15.1, -6.3, { len: 1.6, ry: -0.15, r: 0.7 }); p('nyb_legend_barrier', 6.0, -0.6, { len: 1.6, ry: 0.35, r: 0.7 });
    p('nyb_legend_tarpcar', 15.6, -0.9, { len: 4.4, ry: PI / 2 - 0.12 }); c.post(X(14.4), -0.75, 0.9); c.post(X(16.8), -1.05, 0.9);
    p('nyb_legend_jerry', 13.6, 0.55, { h: 0.46, ry: 0.4 }); p('nyb_legend_jerry', 13.95, 0.35, { h: 0.46, ry: -0.5 });
    p('old_tyre', 8.6, -0.9, { h: 0.6, ry: 0.7 });
    // his golf: a bucket of balls by the tee
    p('wooden_bucket_01', 8.6, 2.1, { h: 0.4 });
    const balls = new T.InstancedMesh(new T.SphereGeometry(0.022, 8, 6), K.std(0xf4f4f0), 14), m4 = new T.Matrix4();
    for (let k = 0; k < 14; k++) { m4.makeTranslation(8.6 + (Math.random() - 0.5) * 0.18, 0.4 + Math.random() * 0.03, 2.1 + (Math.random() - 0.5) * 0.18); balls.setMatrixAt(k, m4); } g.add(balls);
    // the street, three years on: the trash nobody collected, the weeds through the asphalt, the lamps with nobody under them
    p('nyb_trash_dsny', 13.9, 6.75, { len: 1.6, ry: PI }); p('trashbag', 12.85, 6.9, { h: 0.55 }); p('trashbag', 15.1, 6.95, { h: 0.5, ry: 1.1 });
    p('nyb_hydrant_pink', 1.9, 1.1, { h: 0.8, ry: PI / 2 });
    p('nyb_payphone', 19.55, -6.4, { h: 0.74, y: 1.0, ry: -PI / 2 }); box(c, g, 0.08, 1.0, 0.08, K.std(0x30343a, { metalness: 0.7 }), 19.6, 0.5, -6.4);
    p('nyb_lamp_banner', 1.2, -0.4, { h: 4.4, r: 0.25 }); p('nyb_lamp_banner', 18.8, 0.9, { h: 4.4, ry: PI, r: 0.25 });
    p('nyb_aframe_sign', 8.7, 6.8, { h: 1.1, ry: PI + 0.3 });
    p('shrub_02', 1.3, 6.8, { len: 2.4, ry: PI / 2 }); p('shrub_02', 19.0, -6.8, { len: 2.2, ry: PI / 2 });
    p('shrub_01', 7.2, -6.35, { len: 2.4, ry: 0.05 }); p('shrub_01', 12.9, -6.4, { len: 2.0, ry: -0.08 });
    p('dead_tree_trunk', 4.4, 6.4, { len: 2.6, ry: 0.3 });
    // a street sign, N3W style
    const sp = new T.Group(); sp.position.set(17.4, 0, 6.7); g.add(sp); sp.add(c.slab(0.07, 3.0, 0.07, K.std(0x2a2e34, { metalness: 0.7 }), 0, 1.5, 0)); c.post(X(17.4), 6.7, 0.15);
    [['N3W BROADWAY', 0], ['W 42 ST', PI / 2]].forEach(([s, a], k) => { const m = c.sign(s, { w: 1.1, h: 0.2, bg: '#1f6b3a', fg: '#ffffff', border: '#ffffff', font: c.FONT }); m.position.set(0, 2.85 - k * 0.24, 0); m.rotation.y = a; sp.add(m); const b = m.clone(); b.rotation.y = a + PI; sp.add(b); });
    // Fred, the mannequin he talks to. Here Fred is a New Yorker with an eye flower, and still says nothing.
    const fred = K.extra(g, 16.2, 6.3, { col: 0x2a3a5a, ry: PI + 0.6 }); c.post(X(16.2), 6.3, 0.35);
    c.clickable(fred, () => c.say(fred, 'Fred does not talk. Fred has been standing here three years. Fred is counted anyway.', 3000, 2.0), 'A mannequin');
    // two dead billboards, ten metres up, with the weeds climbing them
    const board = (title, sub, bg, acc, x, z, ry) => dc(K, g, 6.4, 3.2, (q, w, h) => {
      q.fillStyle = bg; q.fillRect(0, 0, w, h); K.eyeFlower(q, w * 0.18, h * 0.5, h * 0.36, '#fbe6f0', acc);
      q.fillStyle = '#f4ead2'; q.textAlign = 'left'; q.textBaseline = 'middle'; fit(q, title, c.SERIF, 900, h * 0.22, w * 0.6); q.fillText(title, w * 0.36, h * 0.4);
      fit(q, sub, c.MONO, 700, h * 0.09, w * 0.6); q.fillStyle = acc; q.fillText(sub, w * 0.36, h * 0.66);
      q.globalAlpha = 0.55; for (let k = 0; k < 2200; k++) { q.fillStyle = Math.random() < 0.5 ? '#8a8a7a' : '#3a3a30'; q.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
      q.globalAlpha = 1; q.strokeStyle = '#4a6a2a'; q.lineWidth = 5; for (let k = 0; k < 18; k++) { let vx = Math.random() * w, vy = h; q.beginPath(); q.moveTo(vx, vy); for (let s = 0; s < 9; s++) { vx += (Math.random() - 0.5) * 50; vy -= 14 + Math.random() * 26; q.lineTo(vx, vy); } q.stroke(); }
      q.fillStyle = 'rgba(10,10,10,.55)'; q.fillRect(w * 0.7, 0, w * 0.3, h * 0.25);
    }, x, 6.6, z, ry, 512);
    board('N3W YORKERS', 'NOW COUNTING. ALL OF YOU.', '#2a2440', '#ff4fa3', 0.14, -3.2, PI / 2);
    board('MLow, LIVE', 'TONIGHT ONLY. SOLD OUT.', '#123040', '#22d3ee', K.W - 0.38, 0.6, -PI / 2);
  },

  // ---------- Inside Llewyn Davis, 2013: the Gaslight, MacDougal Street, 1961 ----------
  llewyn(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), chrome = K.std(0x9a9aa0, { metalness: 0.9, roughness: 0.3 });
    // the hero: his guitar on its stand, on the stage beside the singer, in a little pool of light
    const st = new T.Group(); st.position.set(11.7, 0.4, -5.45); st.rotation.y = -0.35; g.add(st);
    [[-0.12, 0.6], [0.12, -0.6]].forEach(([dx, a]) => { const l = c.slab(0.025, 0.55, 0.025, chrome, dx, 0.26, 0.08); l.rotation.z = a * 0.4; st.add(l); }); st.add(c.slab(0.3, 0.025, 0.12, chrome, 0, 0.12, 0.02));
    p('nyb_llewyn_guitar', 11.7, -5.45, { h: 1.15, y: 0.42, ry: -0.35 });
    halo(c, K, g, 'rgba(255,214,150,.42)', 2.8, 11.7, 1.45, -5.75);
    // the microphone, the stool, his case and his coat of a life
    box(c, g, 0.03, 1.5, 0.03, chrome, 10, 1.15, -4.95); const mic = new T.Mesh(new T.SphereGeometry(0.045, 12, 10), K.std(0x2a2a2e, { metalness: 0.8 })); mic.position.set(10, 1.93, -4.95); g.add(mic);
    box(c, g, 0.3, 0.02, 0.3, chrome, 10, 0.41, -4.95);
    p('folding_wooden_stool', 8.6, -5.7, { h: 0.5, y: 0.4, ry: 0.4 });
    p('nyb_llewyn_case', 13.2, -6.05, { len: 1.15, y: 0.4, ry: -0.2 });
    // the record nobody bought, by the crate
    const rec = p('nyb_llewyn_records', 6.0, -4.85, { len: 0.75, ry: 0.35, r: 0.4, egg: ['A crate of records', 'llewyn_album', 'Inside MLow Davis. Four hundred pressed, a crate of them under the stage, and no royalties because he took the session fee. Every copy here is unsold, and every one is counted.'] });
    const lp = new T.Group(); lp.position.set(6.0, 0.3, -4.85); lp.rotation.y = 0.35; g.add(lp);
    for (let k = 0; k < 6; k++) { const s = c.slab(0.3, 0.3, 0.008, K.std([0x2a2a30, 0xf4ead2, 0x3a3a44][k % 3]), -0.18 + k * 0.07, 0.14, 0); s.rotation.x = -0.12; lp.add(s); }
    // a candle on every table but the cat's, and a hat on one
    [[5, -1], [11.6, 0.6], [15, -1], [6, 3.2], [14, 3.2]].forEach(([x, z]) => { p('wooden_candlestick', x + 0.16, z - 0.12, { h: 0.16, y: 0.58 }); const f = new T.Mesh(new T.SphereGeometry(0.014, 8, 6), K.basic(0xffc060)); f.position.set(x + 0.16, 0.76, z - 0.12); g.add(f); halo(c, K, g, 'rgba(255,190,110,.55)', 0.5, x + 0.16, 0.77, z - 0.12); });
    p('fishermans_hat', 15.25, -0.85, { len: 0.3, y: 0.58, ry: 0.6 });
    // two more tables at the back of the room, full
    [[3.4, 6.3], [16.6, 6.3]].forEach(([x, z], k) => { p('round_wooden_table_01', x, z, { len: 0.8, r: 0.5 }); p('dining_chair_02', x, z - 0.7, { h: 0.9 }); K.extra(g, x, z - 0.7, { seated: true, col: [0x3a3440, 0x4a3024][k] });
      p('wooden_candlestick', x - 0.12, z + 0.1, { h: 0.16, y: 0.58 }); halo(c, K, g, 'rgba(255,190,110,.55)', 0.5, x - 0.12, 0.77, z + 0.1); });
    // a house that listens: four in the audience, turned to the stage
    [[5, -0.3, 0x3a2a24], [11.6, 1.3, 0x2a3040], [15, -0.3, 0x4a3a2a], [14, 3.9, 0x2a2a2e], [8.4, 1.3, 0x5a3a2a], [6, 3.9, 0x2a3a2a]].forEach(([x, z, col]) => K.extra(g, x, z, { seated: true, ry: PI, col }));
    [[16.9, -3.2, -2.5, 0x3a3030], [3.1, -3.6, 2.6, 0x2a2a34]].forEach(([x, z, ry, col]) => { K.extra(g, x, z, { ry, col }); c.post(X(x), z, 0.3); });
    // a basement: pipes along the ceiling, bare bulbs on cords
    [[-2.6, 0.07], [0.6, 0.05], [3.6, 0.09]].forEach(([z, rr]) => { const pp = new T.Mesh(new T.CylinderGeometry(rr, rr, 19.6, 10), K.std(0x4a4440, { metalness: 0.6, roughness: 0.5 })); pp.rotation.z = PI / 2; pp.position.set(10, 5.75, z); g.add(pp); });
    [[4, -2.4], [8, 1.9], [12, 1.9], [16, -2.4], [10, 5.0]].forEach(([x, z]) => { cord(c, K, g, x, z, 4.3); const b = new T.Mesh(new T.SphereGeometry(0.06, 12, 10), K.basic(0xffd890)); b.position.set(x, 4.25, z); g.add(b); halo(c, K, g, 'rgba(255,214,150,.6)', 1.1, x, 4.25, z); });
    // the walls: bills for the hootenanny, two frames, two sconces
    poster(c, K, g, 0.9, 1.3, { title: 'HOOTENANNY', lines: ['TONIGHT AT THE N3W GASLIGHT', 'PASS THE HAT', 'MLow ON THE DOOR'], acc: '#f5c542' }, 0.14, 1.9, 0.6, PI / 2);
    poster(c, K, g, 0.9, 1.3, { title: 'N3W FOLK', lines: ['MONDAYS. OPEN STAGE', 'BRING YOUR OWN SONG', 'EVERY SINGER COUNTED'], bg: '#2a2a30', fg: '#f4ead2', acc: '#22d3ee' }, K.W - 0.38, 1.9, -6.6, -PI / 2);
    poster(c, K, g, 0.9, 1.3, { title: 'NO MINIMUM', lines: ['COFFEE 25 CENTS', 'THE N3W GASLIGHT', 'MACDOUGAL STREET'], acc: '#ff4fa3' }, K.W - 0.38, 1.9, 0.6, -PI / 2);
    p('hanging_picture_frame_02', 2.3, -7.93, { h: 0.55, y: 2.0 }); p('hanging_picture_frame_01', 17.7, -7.93, { h: 0.8, y: 1.8 });
    [1.0, 19.0].forEach((x) => { p('industrial_wall_sconce', x, -7.88, { h: 0.34, y: 2.5 }); halo(c, K, g, 'rgba(255,200,130,.5)', 1.0, x, 2.55, -7.7); });
    // coffee, because it was a coffee house
    p('nyb_coffeecart', 19.05, 6.8, { len: 1.6, ry: -PI / 2, r: 0.6 });
    sg(c, g, 'ESPRESSO. THE N3W GASLIGHT', { w: 1.8, h: 0.24, bg: '#1a1410', fg: '#f5c542', font: c.SERIF }, K.W - 0.39, 2.7, 6.8, -PI / 2);
  },

  // ---------- The Fisher King, 1991: Grand Central, the main concourse ----------
  fisherking(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), bx = 10, bz = -1.6;
    // the hero: three gold cups on a marble column above the crowd, and only one of them is the Grail
    const gx = 14.4, gz = 0.2, marble = K.std(0xd8ccb0, { roughness: 0.3 }), gold = K.std(0xc8a050, { metalness: 1, roughness: 0.3 });
    const col = new T.Mesh(new T.CylinderGeometry(0.26, 0.3, 1.9, 24), marble); col.position.set(gx, 0.95, gz); g.add(col);
    [[0.04, 0.42], [1.92, 0.36]].forEach(([y, rr]) => { const m = new T.Mesh(new T.CylinderGeometry(rr, rr, 0.08, 24), gold); m.position.set(gx, y, gz); g.add(m); }); c.post(X(gx), gz, 0.4);
    p('nyb_fisherking_grail', gx, gz, { h: 0.55, y: 1.96, ry: -0.5, egg: ['Three gold cups', 'fisherking_cups', 'Three gold cups on a column in the concourse, and only one is the Grail: the plainest, Parry says. MLow put an eye flower on his, which is cheating, which is very New York.'] });
    halo(c, K, g, 'rgba(255,214,120,.6)', 1.6, gx, 2.2, gz);
    sg(c, g, 'THE GRAIL. ASK AT INFORMATION', { w: 1.1, h: 0.16, bg: '#2a1a08', fg: '#c8a050', font: c.SERIF }, gx, 1.5, gz + 0.31);
    // the shoeshine stand by the west door
    box(c, g, 1.3, 0.45, 0.95, K.std(0x3a2414, { roughness: 0.5 }), 1.0, 0.225, 6.85); c.post(X(1.0), 6.85, 0.7);
    p('nyb_fisherking_shine', 1.0, 6.85, { h: 1.95, y: 0.45, ry: PI / 2 });
    K.extra(g, 1.95, 6.2, { col: 0x5a4a3a, ry: -PI / 2 + 0.4 }); c.post(X(1.95), 6.2, 0.3);
    // the newsstand, the payphones, the coffee
    p('nyb_fisherking_news', 19.3, 6.75, { h: 1.6, ry: PI, r: 0.6 });
    const nb = new T.Group(); nb.position.set(18.3, 0, 6.8); nb.rotation.y = -PI / 2 + 0.3; g.add(nb); [-1, 1].forEach((s) => { const l = c.slab(0.6, 0.9, 0.02, K.std(0x1e4a32), 0, 0.45, s * 0.12); l.rotation.x = s * 0.25; nb.add(l); });
    const head = c.sign('GRAIL FOUND\nIN MIDTOWN', { w: 0.56, h: 0.6, bg: '#f4ead2', fg: '#111111', font: c.SERIF }); head.position.set(0, 0.5, 0.25); head.rotation.x = -0.25; nb.add(head); c.post(X(18.3), 6.8, 0.4);
    [-6.7, -5.95].forEach((z) => { p('nyb_payphone', 19.55, z, { h: 0.74, y: 1.0, ry: -PI / 2 }); });
    p('nyb_coffeecart', 2.4, -6.9, { len: 1.8, r: 0.8 });
    p('nyb_trash_dsny', 0.75, 1.0, { len: 1.3, ry: PI / 2 });
    // a redcap's hand truck with somebody's bags
    p('hand_truck', 17.5, -6.7, { h: 1.3, ry: -0.4 }); p('nyb_fisherking_suitcase', 16.6, -6.3, { len: 0.9, ry: 0.5 });
    // brass chandeliers hung off the painted sky
    [[4.6, 2.2], [15.4, 2.2]].forEach(([x, z]) => { p('Chandelier_03', x, z, { h: 1.2, y: 4.62 }); cord(c, K, g, x, z, 5.8, 5.98); halo(c, K, g, 'rgba(255,220,150,.5)', 2.2, x, 4.95, z); });
    // the ticket windows on the north wall, and the way to the tracks
    const windows = (x) => dc(K, g, 3.2, 1.7, (q, w, h) => {
      q.fillStyle = '#3a2a18'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8a050'; q.fillRect(0, 0, w, h * 0.16); q.fillStyle = '#2a1a08'; q.textAlign = 'center'; q.textBaseline = 'middle'; fit(q, 'TICKETS. N3W HAVEN LINE. MLow EXPRESS', c.SERIF, 800, h * 0.1, w * 0.92); q.fillText('TICKETS. N3W HAVEN LINE. MLow EXPRESS', w / 2, h * 0.08);
      for (let k = 0; k < 3; k++) { const x0 = w * (0.08 + k * 0.31), ww = w * 0.24; q.fillStyle = '#f0dcb0'; q.fillRect(x0, h * 0.28, ww, h * 0.46); q.strokeStyle = '#c8a050'; q.lineWidth = 3; for (let i = 1; i < 9; i++) { q.beginPath(); q.moveTo(x0 + ww * i / 9, h * 0.28); q.lineTo(x0 + ww * i / 9, h * 0.74); q.stroke(); } q.fillStyle = '#c8a050'; q.fillRect(x0 - 6, h * 0.74, ww + 12, h * 0.06); K.eyeFlower(q, x0 + ww / 2, h * 0.88, h * 0.07); }
    }, x, 1.75, -7.97, 0, 384);
    windows(2.0); windows(18.0);
    sg(c, g, 'TO TRACKS 23 TO 42', { w: 2.4, h: 0.32, bg: '#2a2014', fg: '#c8a050', font: c.SERIF }, 0.14, 4.6, -4.2, PI / 2);
  },

  // ---------- Wait Until Dark, 1967: the basement flat, St. Luke's Place ----------
  // Nothing here glows: when the bulbs go, everything in this room goes with them.
  waituntildark(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), wood = K.std(0x3a2a1c, { roughness: 0.7 });
    // the hero: Sam's darkroom. Enlarger, trays, the developer she throws in his eyes, prints drying on a line.
    const dk = new T.Group(); dk.position.set(5.6, 0, 0.0); dk.rotation.y = 0.3; g.add(dk); c.post(X(5.6), 0, 1.25);
    dk.add(c.slab(2.4, 0.9, 0.62, wood, 0, 0.45, 0)); dk.add(c.slab(2.5, 0.04, 0.68, K.std(0x1a1a1a, { roughness: 0.3 }), 0, 0.92, 0));
    [[-0.25, 0xf4f4f0], [0, 0x1a1a1a], [0.25, 0xf4f4f0]].forEach(([x, col]) => dk.add(c.slab(0.24, 0.03, 0.32, K.std(col, { roughness: 0.3 }), x, 0.955, 0.05)));
    const line = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 2.6, 4), K.std(0x222222)); line.rotation.z = PI / 2; line.position.set(0, 2.1, 0.15); dk.add(line);
    for (let k = 0; k < 5; k++) { const pr = dc(K, dk, 0.22, 0.28, (q, w, h) => { q.fillStyle = '#f4f4ee'; q.fillRect(0, 0, w, h); q.fillStyle = '#222'; q.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.7); K.eyeFlower(q, w / 2, h * 0.43, w * 0.28, '#d8d8d8', '#888888'); }, -1.0 + k * 0.5, 1.93, 0.16, 0, 128); pr.rotation.z = (Math.random() - 0.5) * 0.12; }
    const safe = new T.Mesh(new T.SphereGeometry(0.07, 12, 10), K.std(0x5a0a0a, { roughness: 0.3 })); safe.position.set(0, 2.7, 0); dk.add(safe); dk.add(c.slab(0.012, 3.3, 0.012, K.std(0x111111), 0, 4.35, 0));
    const dsg = c.sign('DARKROOM. KEEP SHUT', { w: 1.0, h: 0.16, bg: '#2a0a0a', fg: '#e8c8c0', font: c.MONO }); dsg.position.set(0, 2.45, 0.05); dk.add(dsg);
    const wx = (lx, lz) => [5.6 + lx * Math.cos(0.3) + lz * Math.sin(0.3), lz * Math.cos(0.3) - lx * Math.sin(0.3)];
    p('nyb_wud_enlarger', ...wx(-0.75, -0.05), { h: 1.0, y: 0.94, ry: 0.45 });
    p('nyb_wud_chem', ...wx(0.7, 0.02), { len: 0.85, y: 0.94, ry: 0.3, egg: ['Bottles from the darkroom', 'waituntildark_developer', 'Developer from the darkroom. In the dark she throws it in his face, because in the dark she is the only one who knows where everything is. MLow labels his bottles in Braille.'] });
    // a sofa facing the coffee table, a little dinette by the south wall
    p('sofa_03', 10, 1.7, { len: 2.0, ry: PI, r: 0.6 }); c.post(X(9.3), 1.7, 0.5); c.post(X(10.7), 1.7, 0.5);
    p('round_wooden_table_01', 14.2, 6.3, { len: 0.9, r: 0.5 }); p('painted_wooden_chair_01', 13.5, 6.3, { h: 0.9, ry: PI / 2 }); p('painted_wooden_chair_01', 14.9, 6.3, { h: 0.9, ry: -PI / 2 });
    // the kitchen: a 1967 range against the east wall, the kettle on it
    p('nyb_wud_stove', 19.3, -3.0, { h: 0.9, ry: -PI / 2, r: 0.45 }); p('vintage_electric_kettle', 19.25, -3.1, { h: 0.24, y: 0.9, ry: -PI / 2 });
    // the living room: a side table and its lamp, an ottoman, books she reads with her fingers
    p('side_table_tall_01', 2.1, 6.5, { h: 0.66 }); p('vintage_oil_lamp', 2.1, 6.5, { h: 0.42, y: 0.66 });
    p('Ottoman_01', 4.6, 6.4, { h: 0.42, ry: 0.3, r: 0.45 });
    p('wooden_bookshelf_worn', 0.4, 6.6, { h: 1.9, ry: PI / 2, r: 0.5 }); p('book_encyclopedia_set_01', 0.42, 6.6, { len: 0.55, y: 1.12, ry: PI / 2 });
    sg(c, g, 'BRAILLE. VOLS 1 TO 12', { w: 0.7, h: 0.12, bg: '#f4ead2', fg: '#222222', font: c.MONO }, 0.75, 1.86, 6.6, PI / 2);
    // the middle of the floor: a rug, the coffee table she has memorised, her cane against it
    dc(K, g, 4.2, 3.0, (q, w, h) => { q.fillStyle = '#5a2a22'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a060'; q.lineWidth = 10; q.strokeRect(18, 18, w - 36, h - 36); q.strokeStyle = '#2a4a5a'; q.lineWidth = 6; q.strokeRect(44, 44, w - 88, h - 88); K.eyeFlower(q, w / 2, h / 2, h * 0.22, '#e8d0b0', '#c8a060'); }, 10, 0.012, -0.5, 0, 256).rotation.x = -PI / 2;
    p('CoffeeTable_01', 10, -0.45, { len: 1.3, r: 0.65 });
    const cane = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.1, 8), K.std(0xf4f4f0, { roughness: 0.4 })); cane.position.set(10.95, 0.3, -0.05); cane.rotation.z = 1.05; g.add(cane);
    const tip = new T.Mesh(new T.CylinderGeometry(0.013, 0.013, 0.12, 8), K.std(0xc8102e)); tip.position.set(11.43, 0.03, -0.05); tip.rotation.z = 1.05; g.add(tip);
    // the walls: a clock that ticks, two street level windows with the blinds down, a pipe run overhead
    p('wall_clock', 2.3, -7.94, { h: 0.4, y: 2.6 });
    [2.0, 18.0].forEach((x) => dc(K, g, 2.2, 1.0, (q, w, h) => { q.fillStyle = '#1a1c22'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8c0a8'; for (let k = 0; k < 14; k++) q.fillRect(w * 0.05, h * (0.08 + k * 0.062), w * 0.9, h * 0.04); q.fillStyle = '#2a2a2a'; [0.3, 0.38, 0.66].forEach((u) => q.fillRect(w * u, h * 0.86, w * 0.03, h * 0.14)); q.strokeStyle = '#3a2a1c'; q.lineWidth = 12; q.strokeRect(0, 0, w, h); }, x, 3.9, -7.97, 0, 256));
    [-6.2, 5.6].forEach((z) => { const pp = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 19.6, 10), K.std(0x3a3632, { metalness: 0.5 })); pp.rotation.z = PI / 2; pp.position.set(10, 5.7, z); g.add(pp); });
  },

  // ---------- Tootsie, 1982: Studio 8, Southwest General ----------
  tootsie(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), steel = K.std(0x2a2a2e, { metalness: 0.7, roughness: 0.4 });
    // the hero: Dorothy's dressing table, star on the mirror, bulbs all round, the red glasses waiting
    const vx = 5.0, vz = -2.8, vr = 0.35, fx = Math.sin(vr), fz = Math.cos(vr);
    p('ClassicConsole_01', vx, vz, { len: 1.4, ry: vr, r: 0.6 });
    p('nyb_tootsie_mirror', vx - fx * 0.2, vz - fz * 0.2, { h: 1.05, y: 0.86, ry: vr });
    const vb = new T.Group(); vb.position.set(vx - fx * 0.18, 0.86, vz - fz * 0.18); vb.rotation.y = vr; g.add(vb);
    const bulb = new T.SphereGeometry(0.035, 10, 8), warm = K.basic(0xfff0c8);
    for (let k = 0; k < 7; k++) [-0.4, 0.4].forEach((dx) => { const b = new T.Mesh(bulb, warm); b.position.set(dx, 0.1 + k * 0.15, 0.04); vb.add(b); });
    for (let k = 1; k < 6; k++) { const b = new T.Mesh(bulb, warm); b.position.set(-0.4 + k * 0.133, 1.08, 0.04); vb.add(b); }
    halo(c, K, g, 'rgba(255,236,200,.45)', 2.2, vx - fx * 0.1, 1.45, vz - fz * 0.1);
    p('nyb_tootsie_glasses', vx + 0.3, vz + 0.12, { len: 0.2, y: 0.865, ry: vr, egg: ['Red glasses', 'tootsie_glasses', 'Dorothy Michaels, red glasses big as saucers. Michael wore them so nobody would look too closely. MLow wears his so everybody does.'] });
    [[-0.3, 0xc8102e], [-0.22, 0xf0c8b0], [-0.15, 0x2a2a2a]].forEach(([dx, col]) => { const m = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.09, 10), K.std(col)); m.position.set(vx + dx, 0.905, vz + 0.1); g.add(m); });
    p('folding_wooden_stool', vx + fx * 0.65, vz + fz * 0.65, { h: 0.45, ry: vr });
    // the studio: two lights on stands aimed at the bed
    [[7.1, -1.4, 2.42], [12.9, -1.6, -2.39]].forEach(([x, z, a]) => {
      const s = new T.Group(); s.position.set(x, 0, z); g.add(s); for (let i = 0; i < 3; i++) { const q = i / 3 * PI * 2, l = c.slab(0.025, 1.5, 0.025, steel, Math.cos(q) * 0.22, 0.7, Math.sin(q) * 0.22); l.rotation.set(Math.sin(q) * 0.3, 0, -Math.cos(q) * 0.3); s.add(l); } s.add(c.slab(0.035, 0.4, 0.035, steel, 0, 1.5, 0)); c.post(X(x), z, 0.35);
      p('nyb_tootsie_light', x, z, { len: 0.5, y: 1.62, ry: a - PI / 2 }); halo(c, K, g, 'rgba(255,244,220,.45)', 1.3, x + Math.sin(a) * 0.3, 1.82, z + Math.cos(a) * 0.3);
    });
    // the hospital set dressing: a wheelchair, crutches, a first aid box by the bed
    p('wheelchair_01', 12.5, -3.25, { h: 1.0, ry: -0.6, r: 0.5 }); p('vintage_crutches_01', 11.4, -6.1, { h: 1.3, ry: 0.3 });
    box(c, g, 0.45, 0.6, 0.4, K.std(0xe8e8ec), 8.8, 0.3, -5.4); p('medical_box', 8.8, -5.4, { len: 0.38, y: 0.6, ry: 0.2 });
    // Dorothy's wardrobe on a rail
    const rail = new T.Group(); rail.position.set(2.4, 0, -6.5); g.add(rail); rail.add(c.slab(2.2, 0.03, 0.03, steel, 0, 1.75, 0)); [-1.1, 1.1].forEach((dx) => { rail.add(c.slab(0.03, 1.75, 0.03, steel, dx, 0.875, 0)); rail.add(c.slab(0.03, 0.03, 0.5, steel, dx, 0.03, 0)); }); c.wall(X(1.3), -6.5, X(3.5), -6.5);
    [0xc8102e, 0x2a5a3a, 0xe8d0b8, 0xc8102e, 0x6a3a7a, 0x2a2a5a, 0xf0c0a0, 0xc8102e, 0x1a1a1a].forEach((col, k) => { const d = new T.Mesh(new T.CylinderGeometry(0.1, 0.28, 1.1, 10, 1, true), K.std(col, { side: T.DoubleSide, roughness: k % 3 === 0 ? 0.25 : 0.8, metalness: k % 3 === 0 ? 0.5 : 0 })); d.position.set(-0.95 + k * 0.24, 1.15, 0); rail.add(d); });
    // the cue cards in the middle of the floor, for the star, facing the bed
    const cue = new T.Group(); cue.position.set(10, 0, -1.2); cue.rotation.y = PI; g.add(cue); [-0.35, 0.35].forEach((dx) => cue.add(c.slab(0.03, 1.4, 0.03, K.std(0x4a3a2a), dx, 0.7, 0))); c.post(X(10), -1.2, 0.4);
    const card = dc(K, cue, 0.9, 0.62, (q, w, h) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.textAlign = 'center'; q.textBaseline = 'middle'; ['EMILY KIMBERLY:', 'I WILL NOT BE', 'UNCOUNTED,', 'DR. BREWSTER.'].forEach((l, k) => { fit(q, l, c.FONT, 800, h * 0.14, w * 0.9); q.fillText(l, w / 2, h * (0.18 + k * 0.21)); }); }, 0, 1.25, 0.03, 0, 256);
    // cables across the floor from camera two, and a second lighting batten overhead
    const cable = (pts) => { const cv = new T.CatmullRomCurve3(pts.map(([x, z]) => new T.Vector3(x, 0.02, z))); g.add(new T.Mesh(new T.TubeGeometry(cv, 40, 0.012, 5), K.std(0x111111, { roughness: 0.8 }))); };
    cable([[13.8, 3.4], [11.5, 2.0], [8.0, 2.2], [4.6, 1.6], [3.2, 1.0]]); cable([[13.8, 3.4], [15.4, 1.2], [16.8, -1.4]]); cable([[13.8, 3.4], [9.5, 4.6], [6.6, 5.4]]);
    box(c, g, 15, 0.08, 0.08, K.std(0x222222, { metalness: 0.8 }), 10, 5.75, 1.8);
    [4.5, 8.5, 11.5, 15.5].forEach((x) => { K.prop(r, g, X, 'hanging_industrial_lamp', x, 1.8, { h: 0.5, y: 5.2 }); halo(c, K, g, 'rgba(255,240,210,.4)', 1.0, x, 5.15, 1.8); });
    // craft services by the west wall, and the studio's own signs
    p('nyb_coffeecart', 1.05, 6.75, { len: 1.6, ry: PI / 2, r: 0.6 });
    sg(c, g, 'STUDIO 8. SOUTHWEST GENERAL. N3W TV', { w: 3.4, h: 0.36, bg: '#111111', fg: '#f4ead2', font: c.MONO }, 18.0, 3.4, -7.97);
    sg(c, g, 'QUIET. TAPING', { w: 1.4, h: 0.3, bg: '#2a0000', fg: '#ff4040', font: c.MONO }, 2.0, 3.4, -7.97);
  },

  // ---------- Inside Man, 2006: Manhattan Trust, Wall Street ----------
  insideman(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), brass = K.std(0xc8a050, { metalness: 1, roughness: 0.3 });
    // the hero: the safe deposit wall, box 392 picked out in gold
    box(c, g, 2.05, 0.85, 0.7, K.std(0x8a9098, { metalness: 0.8, roughness: 0.35 }), 1.08, 0.425, -7.5); box(c, g, 2.09, 0.03, 0.74, K.std(0xc8a050, { metalness: 1, roughness: 0.3 }), 1.08, 0.86, -7.5);
    [0.6, 1.58].forEach((x) => p('nyb_insideman_boxes', x, -7.5, { h: 0.92, y: 0.87 })); c.wall(X(0.15), -7.1, X(2.15), -7.1);
    halo(c, K, g, 'rgba(255,214,120,.4)', 0.9, 1.85, 1.3, -7.05);
    sg(c, g, 'SAFE DEPOSIT', { w: 1.9, h: 0.32, bg: '#0b1020', fg: '#c8a050', font: c.SERIF }, 1.08, 2.25, -7.97);
    // the loan desk in the middle of the marble, and the tape somebody left on it
    p('nyb_insideman_desk', 10, -2.6, { len: 1.8, ry: PI, r: 0.9 });
    p('nyb_insideman_tape', 9.55, -2.5, { len: 0.2, y: 0.71, egg: ['A tape player', 'insideman_tape', 'The voice the police spent a day translating was an old speech by a dictator, played on a tape on purpose. MLow left his own tape: the census, read aloud, in every language in the city.'], snd: 'tick' });
    p('desk_lamp_arm_01', 10.6, -2.8, { h: 0.45, y: 0.71, ry: PI }); p('vintage_stapler', 10.2, -2.45, { len: 0.2, y: 0.71, ry: 0.4 }); p('office_notepads', 9.9, -2.75, { len: 0.45, y: 0.71 });
    p('metal_stool_01', 10, -3.35, { h: 0.55 });
    // the queue for the tellers: brass posts and a red rope across the floor
    const red = K.std(0x8a0f1e, { roughness: 0.85 }), post = new T.CylinderGeometry(0.03, 0.04, 0.95, 10), base = new T.CylinderGeometry(0.14, 0.15, 0.03, 16);
    for (let k = 0; k < 5; k++) { const x = 7.4 + k * 1.3, m = new T.Mesh(post, brass); m.position.set(x, 0.48, 0.7); g.add(m); const b = new T.Mesh(base, brass); b.position.set(x, 0.015, 0.7); g.add(b);
      if (k < 4) { const cv = new T.QuadraticBezierCurve3(new T.Vector3(x, 0.9, 0.7), new T.Vector3(x + 0.65, 0.66, 0.7), new T.Vector3(x + 1.3, 0.9, 0.7)); g.add(new T.Mesh(new T.TubeGeometry(cv, 10, 0.022, 6), red)); } }
    c.wall(X(7.4), 0.7, X(12.6), 0.7);
    // their tools, by the supply room: a sledgehammer, a crowbar, the paint for the cameras
    p('sledgehammer_01', 1.0, 6.3, { h: 1.0, ry: 0.4 }); p('crowbar_01', 1.35, 6.75, { h: 0.56, ry: -0.3 }); p('spray_paint_bottles_02', 5.6, 7.0, { h: 0.22 });
    // the cameras they painted over, the chandeliers, the clock, the plants
    p('nyb_seccam_counted', 0.3, 0.6, { h: 0.3, y: 3.6, ry: PI / 2 }); p('nyb_seccam_counted', 19.45, -6.0, { h: 0.3, y: 3.6, ry: -PI / 2 }); p('nyb_seccam_counted', 19.45, 6.6, { h: 0.3, y: 3.6, ry: -PI / 2 - 0.5 });
    [[6.0, 2.4], [14.0, 2.4]].forEach(([x, z]) => { p('Chandelier_02', x, z, { h: 1.0, y: 4.85 }); cord(c, K, g, x, z, 5.85); halo(c, K, g, 'rgba(240,244,255,.45)', 2.0, x, 5.1, z); });
    p('wall_clock', 18.0, -7.94, { h: 0.6, y: 3.3 });
    p('potted_plant_01', 19.1, 7.0, { h: 1.3 }); p('potted_plant_01', 12.7, 7.15, { h: 1.2, ry: 1.2 });
    sg(c, g, 'MANHATTAN TRUST. EST. 1931. COUNTED SINCE', { w: 4.6, h: 0.34, bg: '#0b1020', fg: '#c8a050', font: c.SERIF }, 10, 4.6, 7.97, PI);
  },

  // ---------- The Devil Wears Prada, 2006: Runway, the ninth floor ----------
  prada(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), chrome = K.std(0xd0d0d4, { metalness: 0.9, roughness: 0.25 });
    // the hero: the cerulean issue, on an easel in the middle of the floor, the way the run through puts it
    const ea = new T.Group(); ea.position.set(13.0, 0, 1.6); ea.rotation.y = -0.35; g.add(ea); [-0.45, 0.45].forEach((dx) => { const l = c.slab(0.035, 1.9, 0.035, chrome, dx, 0.92, 0); l.rotation.z = -dx * 0.08; ea.add(l); }); const bl = c.slab(0.035, 1.8, 0.035, chrome, 0, 0.88, -0.35); bl.rotation.x = 0.2; ea.add(bl); ea.add(c.slab(1.0, 0.03, 0.08, chrome, 0, 0.36, 0.03)); c.post(X(13.0), 1.6, 0.55);
    p('nyb_prada_cover', 13.02, 1.66, { h: 1.5, y: 0.38, ry: -0.35, egg: ['The cover', 'prada_cover', 'The cerulean issue. Forty covers on the wall, one woman, four seconds, a small sigh. MLow put a New Yorker on it and she said fine, which at Runway is a parade.'] });
    // two more covers on the north wall
    p('nyb_prada_frame1', 1.15, -7.95, { h: 1.3, y: 1.35 }); p('nyb_prada_frame2', 18.0, -7.95, { h: 1.3, y: 1.35 });
    // white pendants over the floor
    [[5.5, -1.8], [14.5, -1.8], [13.6, -5.2], [7.3, 4.2], [15.8, 4.4]].forEach(([x, z]) => { p('modern_ceiling_lamp_01', x, z, { h: 0.9, y: 5.1 }); halo(c, K, g, 'rgba(255,255,255,.35)', 1.0, x, 5.12, z); });
    // the Closet: shoes on white shelves by the west door
    const cl = new T.Group(); cl.position.set(0.45, 0, 6.7); cl.rotation.y = PI / 2; g.add(cl); const wht = K.std(0xf8f8f8, { roughness: 0.2 });
    cl.add(c.slab(1.8, 2.1, 0.04, wht, 0, 1.05, -0.2)); [-0.9, 0.9].forEach((dx) => cl.add(c.slab(0.04, 2.1, 0.42, wht, dx, 1.05, 0)));
    const SH = [0xc8102e, 0x111111, 0xe8c8a8, 0x2a52be, 0xf0a0c0, 0xd8a020];
    [0.35, 0.8, 1.25, 1.7].forEach((y, row) => { cl.add(c.slab(1.8, 0.03, 0.42, wht, 0, y, 0)); for (let k = 0; k < 4; k++) { const col = SH[(row * 4 + k) % SH.length]; [-0.04, 0.04].forEach((d) => { const s = c.slab(0.07, 0.07, 0.22, K.std(col, { roughness: 0.3 }), -0.66 + k * 0.44 + d, y + 0.05, 0.02); s.rotation.x = -0.25; cl.add(s); }); } });
    c.wall(X(0.2), 5.8, X(0.7), 5.8); c.wall(X(0.7), 5.8, X(0.7), 7.6);
    sg(c, g, 'THE CLOSET', { w: 1.4, h: 0.26, bg: '#111111', fg: '#ffffff', font: c.SERIF }, 0.14, 2.45, 6.7, PI / 2);
    p('Ottoman_01', 12.4, 6.3, { h: 0.45, ry: 0.4, r: 0.45 });
    // the masthead, big, over the south wall
    sg(c, g, 'RUNWAY', { w: 5.2, h: 1.0, bg: null, fg: '#111111', font: c.SERIF, weight: 400 }, 10, 4.6, 7.96, PI);
  },

  // ---------- Black Swan, 2010: the rehearsal studio, Lincoln Center ----------
  blackswan(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), steel = K.std(0x9a9aa0, { metalness: 0.9, roughness: 0.3 }), wood = K.std(0xb08a5a, { roughness: 0.4 });
    // the hero: her dressing table, the mirror ringed with bulbs, the Swan Queen's crown laid in front of it
    const vx = 15.6, vz = -1.2, vr = -0.35, fx = Math.sin(vr), fz = Math.cos(vr);
    p('ClassicConsole_01', vx, vz, { len: 1.3, ry: vr, r: 0.6 });
    p('nyb_blackswan_mirror', vx - fx * 0.18, vz - fz * 0.18, { h: 1.0, y: 0.8, ry: vr, egg: ['Her mirror', 'blackswan_mirror', 'Her dressing table mirror. Every mirror in this film is a beat late, and this one has a crack in the corner. MLow signed the frame, so at least one of you in it is counted.'], fn: (cc) => cc.flash(0.15) });
    const vb = new T.Group(); vb.position.set(vx - fx * 0.16, 0.8, vz - fz * 0.16); vb.rotation.y = vr; g.add(vb); const bg = new T.SphereGeometry(0.03, 10, 8), wb = K.basic(0xfff6e8);
    for (let k = 0; k < 7; k++) [-0.38, 0.38].forEach((dx) => { const b = new T.Mesh(bg, wb); b.position.set(dx, 0.08 + k * 0.14, 0.03); vb.add(b); });
    halo(c, K, g, 'rgba(255,246,232,.4)', 2.0, vx - fx * 0.1, 1.35, vz - fz * 0.1);
    const crown = new T.Group(); crown.position.set(vx + 0.2, 0.83, vz + 0.12); g.add(crown); const silver = K.std(0xe8e8f0, { metalness: 1, roughness: 0.2 });
    const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.008, 6, 24), silver); ring.rotation.x = PI / 2; crown.add(ring);
    for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2, s = new T.Mesh(new T.ConeGeometry(0.008, 0.05 + (k % 2) * 0.03, 5), silver); s.position.set(Math.cos(a) * 0.08, 0.03, Math.sin(a) * 0.08); crown.add(s); }
    // a free standing barre in the middle of the floor
    [7.4, 12.6].forEach((x) => { box(c, g, 0.05, 1.1, 0.05, steel, x, 0.55, 0.6); box(c, g, 0.05, 0.03, 0.6, steel, x, 0.015, 0.6); });
    const br = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 5.2, 12), wood); br.rotation.z = PI / 2; br.position.set(10, 1.05, 0.6); g.add(br); c.wall(X(7.4), 0.6, X(12.6), 0.6);
    // spike tape on the floor, where the corps de ballet stand
    for (let k = 0; k < 8; k++) { const m = new T.Mesh(new T.PlaneGeometry(0.3, 0.03), K.basic(k % 2 ? 0xff4fa3 : 0xf4f4f4)); m.rotation.x = -PI / 2; m.rotation.z = k % 2 ? PI / 2 : 0; m.position.set(6 + (k >> 1) * 2.6, 0.006, -1.6); g.add(m); }
    // the room: fans, benches with the company's bags, rosin, the rehearsal boombox, a clock
    fan(c, K, r, g, X, 6.5, -1.0); fan(c, K, r, g, X, 13.5, -1.0);
    p('painted_wooden_bench', 2.8, -7.3, { len: 1.3, r: 0.5 }); p('painted_wooden_bench', 16.0, -7.3, { len: 1.3, r: 0.5 });
    p('nyb_blackswan_bag', 2.8, -7.25, { len: 0.9, y: 0.48, ry: 0.1 });
    // the south end, by the mirror: a dancer resting on a bench, bags and water by the corner
    p('painted_wooden_bench', 16.4, 6.9, { len: 1.3, ry: PI, r: 0.5 }); K.extra(g, 16.4, 6.85, { seated: true, ry: PI, col: 0x1a1a1e });
    p('nyb_blackswan_bag', 3.2, 6.9, { len: 0.9, ry: 0.4 }); p('folding_wooden_stool', 4.4, 6.6, { h: 0.45, ry: 0.3 });
    [[4.3, 6.5, 0x22d3ee], [4.5, 6.7, 0xf4f4f4]].forEach(([x, z, col]) => { const b2 = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.22, 12), K.std(col, { roughness: 0.2 })); b2.position.set(x, 0.56, z); g.add(b2); });
    p('nyb_blackswan_boombox', 8.4, -6.3, { len: 0.6, ry: 0.2 }); p('wooden_bucket_01', 12.4, -6.4, { h: 0.4 });
    p('wall_clock', 2.0, -7.94, { h: 0.45, y: 3.0 });
    poster(c, K, g, 1.3, 1.9, { title: 'SWAN LAKE', lines: ['N3W BALLET COMPANY', 'THE NEW SEASON', 'A NEW SWAN QUEEN', 'BY MLow'], bg: '#0b0b10', fg: '#f4ead2', acc: '#f4f4f4', tf: c.SERIF }, 18.0, 2.4, -7.97);
  },

  // ---------- Cocktail, 1988: Flanagan's, Upper East Side ----------
  cocktail(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), bz = -2.9;
    // the hero: four bottles the size of a bartender, on a riser by the west wall, for the flair
    const rs = new T.Group(); rs.position.set(2.8, 0, -0.9); rs.rotation.y = 0.8; g.add(rs); rs.add(c.slab(2.4, 0.25, 0.5, K.std(0x1a0a14, { roughness: 0.3 }), 0, 0.125, 0)); rs.add(c.slab(2.4, 0.03, 0.02, K.basic(0xff4fa3), 0, 0.24, 0.26)); rs.add(c.slab(2.4, 0.03, 0.02, K.basic(0x22d3ee), 0, 0.03, 0.26));
    p('nyb_cocktail_bottles', 2.8, -0.9, { h: 1.0, y: 0.25, ry: 0.8 }); c.post(X(2.15), -1.6, 0.5); c.post(X(2.8), -0.9, 0.5); c.post(X(3.45), -0.2, 0.5);
    halo(c, K, g, 'rgba(255,79,163,.35)', 3.0, 2.6, 0.9, -1.3);
    // the bar's name, in neon, over the south wall
    sg(c, g, 'COCKTAILS & DREAMS', { w: 4.4, h: 0.6, bg: '#0a0410', fg: '#ff4fa3', border: '#22d3ee', font: c.SERIF, weight: 900, glow: 22 }, 10, 5.25, 7.95, PI);
    sg(c, g, 'by MLow', { w: 1.3, h: 0.3, bg: '#0a0410', fg: '#22d3ee', font: c.SERIF, weight: 700, glow: 14 }, 11.9, 4.8, 7.95, PI);
    // the Red Eye on the bar: beer, tomato juice, a raw egg. Here the egg is an eye.
    const re = new T.Group(); re.position.set(12.3, 1.13, bz + 0.12); g.add(re);
    const gl = new T.Mesh(new T.CylinderGeometry(0.045, 0.036, 0.16, 16, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, side: T.DoubleSide })); gl.position.y = 0.08; re.add(gl);
    const bev = new T.Mesh(new T.CylinderGeometry(0.041, 0.034, 0.13, 16), K.std(0xb0301a, { roughness: 0.2 })); bev.position.y = 0.068; re.add(bev);
    const eye = K.decal(0.07, 0.07, (q, w, h) => K.eyeFlower(q, w / 2, h / 2, w / 2 * 0.95), 64); eye.rotation.x = -PI / 2; eye.position.y = 0.136; re.add(eye);
    c.clickable(re, () => { c.sound.drip(); c.egg('cocktail_redeye', 'The Red Eye: beer, tomato juice, one raw egg. The hangover cure they pour at Flanagan\'s. In this bar the egg is an eye, and it is counting you.'); }, 'A Red Eye');
    // the register at the end of the bar, limes by the lemons, an ice bucket
    p('nyb_register_gold', 14.9, bz, { h: 0.35, y: 1.12, ry: PI }); p('food_lime_01', 11.3, bz + 0.05, { len: 0.07, y: 1.13 }); p('food_lime_01', 11.42, bz - 0.04, { len: 0.07, y: 1.13 }); p('wooden_bucket_01', 8.0, bz, { h: 0.25, y: 1.13 });
    // two wine barrels as standing tables in the middle of the floor, a crowd round them
    [[6.2, 1.3], [13.8, 1.3]].forEach(([x, z], k) => { p('wine_barrel_01', x, z, { h: 0.98, r: 0.45 }); const top = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.04, 24), K.std(0x2a1410, { roughness: 0.3 })); top.position.set(x, 1.0, z); g.add(top);
      K.extra(g, x + 0.7, z + 0.1, { ry: -PI / 2, col: [0x2a52be, 0x3a3a48][k] }); K.extra(g, x - 0.7, z - 0.1, { ry: PI / 2, col: [0xc8102e, 0xf0e8d8][k] }); c.post(X(x + 0.7), z + 0.1, 0.3); c.post(X(x - 0.7), z - 0.1, 0.3); });
    // ceiling fans, a darts board, a television on a bracket
    fan(c, K, r, g, X, 5.0, 3.0); fan(c, K, r, g, X, 15.0, 3.0);
    p('nyb_cocktail_dartboard', 19.58, 0.4, { h: 0.45, y: 1.55, ry: -PI / 2 });
    box(c, g, 0.5, 0.04, 0.4, K.std(0x222222, { metalness: 0.7 }), 1.0, 2.58, -7.7); p('television_02', 1.0, -7.7, { h: 0.45, y: 2.6, ry: 0.4 });
  },

  // ---------- Gangs of New York, 2002: Paradise Square, Five Points, 1863 ----------
  gangs(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), wd = K.std(0x3a2818, { roughness: 0.85 });
    // the hero: the Butcher's shop front, the bull's head over the board, the block and the hatchet beneath
    [11.5, 13.5].forEach((x) => box(c, g, 0.12, 2.6, 0.12, wd, x, 1.3, -6.3)); c.post(X(11.5), -6.3, 0.15); c.post(X(13.5), -6.3, 0.15);
    const sb = dc(K, g, 2.1, 0.9, (q, w, h) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#5a0a0a'; q.lineWidth = 10; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = '#5a0a0a'; q.textAlign = 'center'; q.textBaseline = 'middle'; fit(q, 'N3W NATIVE MEATS', c.SERIF, 900, h * 0.3, w * 0.86); q.fillText('N3W NATIVE MEATS', w / 2, h * 0.36); fit(q, 'CUT AND COUNTED. PARADISE SQ.', c.MONO, 700, h * 0.13, w * 0.86); q.fillText('CUT AND COUNTED. PARADISE SQ.', w / 2, h * 0.7); }, 12.5, 2.3, -6.24, 0, 256);
    box(c, g, 2.2, 1.0, 0.06, wd, 12.5, 2.3, -6.3);
    p('nyb_gangs_bull', 12.5, -6.3, { h: 0.62, y: 2.8 });
    p('nyb_gangs_block', 12.5, -5.25, { len: 1.1, r: 0.55 }); p('hatchet', 12.45, -5.25, { h: 0.32, y: 0.28, ry: 0.6 });
    // a fire in a barrel, the only warm thing in the square, flickering only while you are here
    p('nyb_gangs_stove', 6.6, 2.0, { h: 0.85, r: 0.4 });
    const fire = [0, 1, 2].map((k) => halo(c, K, g, k ? 'rgba(255,150,60,.6)' : 'rgba(255,200,120,.7)', 1.2 + k * 0.6, 6.6, 1.0 + k * 0.15, 2.0));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fire.forEach((s, k) => { const v = 1.2 + k * 0.6 + Math.sin(t * (9 + k * 3) + k) * 0.18 + Math.sin(t * 23 + k) * 0.1; s.scale.set(v, v, 1); }); });
    // the draft notices of 1863, pasted on the walls
    const notice = (x, z, ry) => poster(c, K, g, 1.1, 1.5, { title: 'NOTICE', lines: ['THE COUNT OF 1863', 'EVERY MAN IN THE CITY', 'TO BE ENTERED AND DRAWN', 'BY ORDER. N3W YORK', 'MLow, ENUMERATOR'], bg: '#e8dcc0', fg: '#2a1a0a', acc: '#2a1a0a', eye: true, worn: 0.25 }, x, 1.9, z, ry);
    const nt = notice(0.14, 0.6, PI / 2); notice(K.W - 0.38, 0.6, -PI / 2); notice(0.14, 7.0, PI / 2);
    c.clickable(nt, () => c.egg('gangs_draft', 'A notice from 1863: every man in the city entered on a list, names drawn by lot. The city burned for four days. MLow\'s list only counts you, and nobody draws your name.'), 'A notice on the wall');
    // washing strung across the square between the walls
    const CL = ['#e8e0cc', '#c8bca0', '#8a3a2a', '#d8d0c0', '#6a7a8a', '#f0ece0'], tex = {};
    const garment = (k) => tex[k] ||= K.decal(1, 1, (q, w, h) => { q.fillStyle = CL[k % CL.length]; q.beginPath();
      if (k % 3 === 0) { q.moveTo(w * 0.2, 0); q.lineTo(w * 0.8, 0); q.lineTo(w, h * 0.25); q.lineTo(w * 0.8, h * 0.3); q.lineTo(w * 0.78, h); q.lineTo(w * 0.22, h); q.lineTo(w * 0.2, h * 0.3); q.lineTo(0, h * 0.25); }
      else if (k % 3 === 1) { q.moveTo(w * 0.15, 0); q.lineTo(w * 0.85, 0); q.lineTo(w * 0.8, h); q.lineTo(w * 0.56, h); q.lineTo(w * 0.5, h * 0.4); q.lineTo(w * 0.44, h); q.lineTo(w * 0.2, h); }
      else { q.moveTo(0, 0); q.lineTo(w, 0); q.lineTo(w * 0.96, h * 0.9); q.lineTo(w * 0.5, h); q.lineTo(w * 0.04, h * 0.9); }
      q.closePath(); q.fill(); q.globalAlpha = 0.07; q.fillStyle = '#000'; for (let i = 0; i < 120; i++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }, 64).material;
    [-2.3, 0.9].forEach((z, j) => { const ln = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 19.4, 4), K.std(0x2a2a2a)); ln.rotation.z = PI / 2; ln.position.set(10, 3.5, z); g.add(ln);
      for (let k = 0; k < 9; k++) { const kk = k + j * 2, w = 0.4 + (kk % 3) * 0.12, hh = 0.55 + (kk % 2) * 0.2, m = garment(kk).clone(); m.side = T.DoubleSide; const cl = new T.Mesh(new T.PlaneGeometry(w, hh), m); cl.position.set(1.6 + k * 2.05 + j * 0.6, 3.5 - hh / 2, z); cl.rotation.y = (Math.random() - 0.5) * 0.3; g.add(cl); } });
    // buckets and baskets by the oyster cart, a ladder against the north wall
    p('wooden_bucket_01', 15.0, -0.7, { h: 0.4 }); p('wicker_basket_01', 17.7, -0.3, { h: 0.4, ry: 0.5 }); p('wooden_ladder', 18.6, -7.5, { h: 1.7 });
  },

  // ---------- The Odd Couple, 1968: 1049 Park Avenue ----------
  // New things here trade sides with the line exactly as the set's own do: neat on one half, slob on the other.
  oddcouple(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), mine = [];
    const add = (n, lx, z, o, neat) => { const m = p(n, lx, z, o); mine.push([m, lx, neat]); return m; };
    // Felix's: the spray he uses mid game, the tea set, the broom and pan
    add('nyb_oddcouple_spray', 0.6, -3.4, { h: 0.3, y: 1.0, ry: PI / 2, egg: ['A spray can', 'oddcouple_spray', 'Felix sprays the poker table mid hand, then lines up the coasters. MLow bottled it: Eau de Census, smells like a clean count.'] }, true);
    add('tea_set_01', 5.0, 0.3, { len: 0.42, y: 0.45 }, true); add('wooden_broom', 1.3, 6.8, { h: 1.3 }, true); add('dustpan', 1.65, 6.95, { len: 0.3 }, true);
    // Oscar's: the trash, the sportswriter's bat and ball, the buns, the bananas
    add('nyb_oddcouple_bag', 8.0, 6.6, { h: 0.55 }, false); add('nyb_oddcouple_bag', 7.35, 6.95, { h: 0.5, ry: 1.2 }, false);
    add('baseball_bat', 2.95, -0.45, { h: 0.86, ry: 0.4 }, false); add('baseball_01', 3.2, -0.25, { len: 0.075 }, false);
    add('hamburger_buns', 6.35, -4.05, { len: 0.35, y: 0.78 }, false); add('bananas', 6.7, -4.35, { len: 0.3, y: 0.78, ry: 0.8 }, false);
    mine.forEach(([m, lx, neat]) => { m.position.x = neat === false ? lx : K.W - lx; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const neatLeft = !(P.x - r.x0 < K.W / 2); mine.forEach(([m, lx, neat]) => { const tx = neat === neatLeft ? lx : K.W - lx; m.position.x += (tx - m.position.x) * Math.min(1, dt * 5); }); });
    // the hero is the poker table on the line, felted green (a SWAP below). Chips and cards on top of it, where you can see them.
    const top = new T.Group(); top.position.set(10, 1.085, -5.2); g.add(top);
    for (let k = 0; k < 24; k++) { const ch = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.007, 12), K.std([0xc8102e, 0x2a52be, 0xffffff, 0xf5c542][k % 4])); ch.position.set([-0.45, 0.45, 0, 0][k % 4] + (k % 4 > 1 ? (k % 4 === 2 ? -0.1 : 0.1) : 0), (k >> 2) * 0.0075, [0, 0, 0.45, -0.45][k % 4]); top.add(ch); }
    for (let k = 0; k < 5; k++) { const cd = c.slab(0.06, 0.002, 0.09, K.std(0xffffff), -0.12 + k * 0.065, 0.002, 0.1); cd.rotation.y = (Math.random() - 0.5) * 0.4; top.add(cd); }
    const ash = new T.Mesh(new T.CylinderGeometry(0.06, 0.05, 0.025, 16), K.std(0x8a8a90, { metalness: 0.6 })); ash.position.set(0.15, 0.012, -0.15); top.add(ash);
    c.clickable(top, () => { c.sound.clink(1800); c.egg('poker'); }, 'The poker game');
    // the card room lamp, low and green over the game, so the table reads from the door
    const shade = new T.Mesh(new T.ConeGeometry(0.42, 0.28, 24, 1, true), K.std(0x1f6b3a, { side: T.DoubleSide, roughness: 0.4, emissive: 0x0a2a14 })); shade.position.set(10, 2.35, -5.2); g.add(shade);
    const bulbP = new T.Mesh(new T.SphereGeometry(0.06, 12, 10), K.basic(0xfff0c8)); bulbP.position.set(10, 2.24, -5.2); g.add(bulbP); cord(c, K, g, 10, -5.2, 2.48);
    halo(c, K, g, 'rgba(255,236,190,.55)', 1.6, 10, 2.1, -5.2);
    // over the line: a chandelier, and an air conditioner in each window, both halves
    p('Chandelier_01', 10, -1.2, { h: 0.85, y: 4.95 }); cord(c, K, g, 10, -1.2, 5.75); halo(c, K, g, 'rgba(255,236,200,.45)', 1.8, 10, 5.2, -1.2);
    p('nyb_aircon', 0.32, 6.6, { len: 1.1, y: 2.5, ry: PI / 2 }); p('nyb_aircon', K.W - 0.48, 6.6, { len: 1.1, y: 2.5, ry: -PI / 2 });
    dc(K, g, 2.4, 1.8, (q, w, h) => { q.fillStyle = '#0a1028'; q.fillRect(0, 0, w, h); for (let k = 0; k < 9; k++) { const bw = w * (0.06 + Math.random() * 0.08), bh = h * (0.3 + Math.random() * 0.6), x0 = k * w / 9; q.fillStyle = '#1a2038'; q.fillRect(x0, h - bh, bw, bh); for (let i = 0; i < 26; i++) if (Math.random() < 0.55) { q.fillStyle = Math.random() < 0.8 ? '#f5c542' : '#22d3ee'; q.fillRect(x0 + Math.random() * bw * 0.85, h - bh + Math.random() * bh * 0.95, 4, 5); } } q.strokeStyle = '#e8dcc0'; q.lineWidth = 14; q.strokeRect(0, 0, w, h); q.beginPath(); q.moveTo(w / 2, 0); q.lineTo(w / 2, h); q.moveTo(0, h / 2); q.lineTo(w, h / 2); q.stroke(); }, 18.0, 2.5, -7.97, 0, 256);
    sg(c, g, 'PARK AVENUE, 12TH FLOOR', { w: 1.6, h: 0.18, bg: '#e8dcc0', fg: '#3a2a1a', font: c.SERIF }, 18.0, 1.45, -7.96);
  },

  // ---------- On the Town, 1949: the Brooklyn Navy Yard, 6 A.M. ----------
  ontown(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), navy = K.std(0x1e2a3a, { roughness: 0.5 });
    // the hero: their ship, as the model in the case at the Yard gate: U.S.S. N3W YORKER
    box(c, g, 3.1, 0.45, 0.8, K.std(0x3a4a5e, { roughness: 0.5 }), 10.4, 0.225, 0.8); box(c, g, 3.15, 0.04, 0.85, K.std(0xc8a050, { metalness: 1, roughness: 0.3 }), 10.4, 0.46, 0.8); solid(c, X, 8.8, 0.35, 12.0, 1.25);
    p('nyb_ontown_ship', 10.4, 0.8, { len: 3.0, y: 0.48, ry: -PI / 2, egg: ['A model ship', 'ontown_ship', 'U.S.S. N3W YORKER, built here at the Yard. Three sailors walk off her at six in the morning with twenty four hours to see all of New York. MLow counted them off. He will count them back on.'], snd: 'whistle' });
    // lifebuoys and a life jacket on the walls, a channel marker and a buoy on the pier
    p('nyb_ontown_buoy', 0.2, 0.6, { h: 0.8, y: 1.6, ry: PI / 2 }); p('nyb_ontown_buoy', K.W - 0.42, 0.6, { h: 0.8, y: 1.6, ry: -PI / 2 });
    p('nyb_ontown_jacket', 0.2, 6.6, { h: 0.9, y: 1.4, ry: PI / 2 });
    p('nyb_ontown_marker', 16.3, 1.6, { h: 2.2, r: 0.6 }); p('ocean_buoy', 1.2, 7.0, { h: 1.6, r: 0.5 });
    // cargo on the pier: a hand truck, an old crate, two barrels
    p('hand_truck', 14.6, -6.0, { h: 1.2, ry: 0.5 }); p('old_military_crate', 12.0, 6.5, { len: 1.2, r: 0.6 });
    p('wine_barrel_01', 18.9, -3.05, { h: 0.85, r: 0.4 }); p('wine_barrel_01', 18.95, -2.25, { h: 0.85, ry: 1, r: 0.4 });
    // signal flags strung overhead, the Yard's sign over the south wall
    const FL = [0xc8102e, 0xf5c542, 0x1d4ed8, 0xffffff, 0x111111, 0x22d3ee], tri = new T.BufferGeometry().setFromPoints([new T.Vector3(-0.16, 0, 0), new T.Vector3(0.16, 0, 0), new T.Vector3(0, -0.36, 0)]); tri.computeVertexNormals();
    const string = (a, b, n) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), cv = new T.QuadraticBezierCurve3(A, A.clone().lerp(B, 0.5).add(new T.Vector3(0, -0.5, 0)), B); g.add(new T.Mesh(new T.TubeGeometry(cv, 24, 0.008, 4), K.std(0x2a2a2a)));
      for (let k = 1; k < n; k++) { const pt = cv.getPoint(k / n), f = new T.Mesh(tri, K.std(FL[k % FL.length], { side: T.DoubleSide, roughness: 0.8 })); f.position.copy(pt); f.lookAt(pt.x + (B.z - A.z), pt.y, pt.z - (B.x - A.x)); g.add(f); } };
    string([1.2, 4.2, -0.6], [16.6, 4.0, -2.6], 22); string([0.2, 3.7, 3.4], [19.6, 3.7, 3.4], 26);
    sg(c, g, 'N3W NAVY YARD. BROOKLYN', { w: 4.4, h: 0.5, bg: '#1e2a3a', fg: '#f4ead2', border: '#f5c542', font: c.SERIF }, 10, 3.45, 7.96, PI);
    sg(c, g, 'SHORE LEAVE 24 HOURS. SHIP SAILS AT SIX', { w: 3.6, h: 0.34, bg: '#f4ead2', fg: '#1e2a3a', font: c.MONO }, 0.14, 3.3, -3.0, PI / 2);
  },

  // ---------- The Godfather, 1972: Louis' Restaurant, the Bronx ----------
  godfather(c, r, g, X, K) {
    const T = c.THREE, p = (n, x, z, o) => K.prop(r, g, X, n, x, z, o), wd = K.std(0x3a2010, { roughness: 0.5 });
    // the hero: Genco Pura, the family's olive oil, stacked on the shelves by the north wall and crated beside them
    const SX = 17.9, sw = K.std(0x6a4a2a, { roughness: 0.6 });
    box(c, g, 2.5, 1.9, 0.05, sw, SX, 0.95, -7.95); [SX - 1.25, SX + 1.25].forEach((x) => box(c, g, 0.05, 1.9, 0.42, sw, x, 0.95, -7.75)); c.wall(X(SX - 1.3), -7.5, X(SX + 1.3), -7.5);
    [0.05, 0.62, 1.19, 1.76].forEach((y) => box(c, g, 2.5, 0.04, 0.42, sw, SX, y, -7.75));
    [0.07, 0.64].forEach((y) => { for (let k = 0; k < 6; k++) p('nyb_godfather_genco', SX - 0.95 + k * 0.38, -7.72, { h: 0.22, y, ry: (k % 2) * 0.15 }); });
    for (let k = 0; k < 4; k++) p('nyb_godfather_genco', SX - 0.6 + k * 0.38, -7.72, { h: 0.22, y: 1.21, ry: 0.1 });
    p('wine_bottles_01', SX, -7.75, { h: 0.32, y: 1.78 });
    [[16.4, 0], [16.4, 0.35], [16.4, 0.7]].forEach(([x, y], k) => p('nyb_godfather_crate', x, -7.3, { len: 0.8, y, ry: (k - 1) * 0.06 }));
    c.post(X(16.4), -7.3, 0.45);
    sg(c, g, 'GENCO PURA OLIVE OIL', { w: 2.5, h: 0.34, bg: '#2a6a3a', fg: '#f4ead2', border: '#c8102e', font: c.SERIF }, SX, 2.45, -7.94);
    sg(c, g, 'IMPORTED BY MLow. THE BRONX', { w: 2.1, h: 0.18, bg: '#f4ead2', fg: '#2a6a3a', font: c.MONO }, SX, 2.18, -7.93);
    halo(c, K, g, 'rgba(255,220,160,.35)', 2.4, SX, 1.4, -7.4);
    // on the register counter: a gold horse's head, a gift from a producer who said no
    p('nyb_godfather_horse', 0.8, -4.05, { h: 0.42, y: 1.05, ry: PI / 2 });
    // the oranges on the middle table
    p('wooden_bowl_02', 10.28, -2.32, { len: 0.24, y: 0.78, egg: ['A bowl of oranges', 'godfather_oranges', 'A bowl of oranges on the middle table. In these films the oranges turn up just before something goes wrong. MLow peels one anyway and counts the segments: always ten, always counted.'] });
    [[10.24, -2.33], [10.32, -2.28], [10.29, -2.39]].forEach(([x, z], k) => p('nyb_godfather_orange', x, z, { h: 0.075, y: 0.8 + (k === 2 ? 0.04 : 0), ry: k }));
    // house red by the east wall, fans and a lantern overhead, two pictures of the old country
    p('nyb_godfather_barrel', 0.75, -7.1, { h: 0.9, ry: PI / 2, r: 0.45 }); p('nyb_godfather_barrel', 1.65, -7.35, { h: 0.9, ry: 0.3, r: 0.45 });
    fan(c, K, r, g, X, 6.0, 1.8); fan(c, K, r, g, X, 14.0, 1.8);
    p('lantern_chandelier_01', 10, -2.6, { h: 0.8, y: 4.3 }); cord(c, K, g, 10, -2.6, 5.05); halo(c, K, g, 'rgba(255,200,130,.5)', 1.8, 10, 4.55, -2.6);
    p('fancy_picture_frame_01', 0.15, 0.6, { len: 0.9, y: 2.2, ry: PI / 2 });
  },
};

// SWAP: { room: { stock_name: 'nyb_edit' } } turns a prop already in build.js into its NEW YORKERS edit, in that set only
export const SWAP = {
  llewyn: { round_wooden_table_01: 'nyb_llewyn_table', dining_chair_02: 'nyb_llewyn_chair' },
  fisherking: { painted_wooden_bench: 'nyb_fisherking_bench', vintage_suitcase: 'nyb_fisherking_suitcase' },
  waituntildark: { Camera_01: 'nyb_wud_camera', drawer_cabinet: 'nyb_wud_cabinet', ArmChair_01: 'nyb_wud_armchair' },
  tootsie: { Megaphone_01: 'nyb_tootsie_megaphone', metal_toolbox: 'nyb_tootsie_toolbox', ceramic_vase_01: 'nyb_tootsie_vase' },
  insideman: { cardboard_box_01: 'nyb_insideman_box', CashRegister_01: 'nyb_insideman_teller' },
  prada: { modern_arm_chair_01: 'nyb_prada_chair', potted_plant_02: 'nyb_prada_plant', mid_century_lounge_chair: 'nyb_prada_lounge' },
  blackswan: { wooden_stool_02: 'nyb_blackswan_stool', painted_wooden_chair_01: 'nyb_blackswan_chair', vintage_suitcase: 'nyb_blackswan_bag' },
  cocktail: { bar_chair_round_01: 'nyb_cocktail_stool', round_wooden_table_01: 'nyb_cocktail_table' },
  gangs: { Barrel_01: 'nyb_gangs_barrel', wooden_crate_02: 'nyb_gangs_crate', wooden_crate_01: 'nyb_gangs_crate2' },
  oddcouple: { round_wooden_table_01: 'nyb_oddcouple_poker', dining_chair_02: 'nyb_oddcouple_chair', Sofa_01: 'nyb_oddcouple_sofa' },
  ontown: { street_lamp_01: 'nyb_lamp_banner', wooden_crate_01: 'nyb_ontown_crate1', wooden_crate_02: 'nyb_ontown_crate2' },
  godfather: { dining_chair_02: 'nyb_godfather_chair', CashRegister_01: 'nyb_godfather_register' },
};
