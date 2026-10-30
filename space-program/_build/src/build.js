// N3W YORKERS SPACE PROGRAM, room by room. The city left for the moon because the rent was right. The spacecraft are
// MLow's own M.Texture GLBs (NASA and Smithsonian models wrapped in his paintings), the props are Poly Haven (CC0) through
// the NEW YORKERS Blender lane, the cast are ON LOCATION's Tripo New Yorkers with eye flowers for heads.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast, queue } from './kit.js';
import { alcove, mezzanine, coffer, neon } from './fx.js';
export { eyeFlower };

// ---------- the set dressing kit of this gallery: small things, many times ----------
const MATS = {}; const mat = (k, f) => (MATS[k] ||= f());
const S = (c, n, rep, tint) => c.surf(n, rep, tint);
const box = (c, g, w, h, d, m, x, y, z) => { const b = c.slab(w, h, d, m, x, y, z); g.add(b); return b; };
const props = (c, r, g, X, L) => L.map((q) => prop(c, r, g, X, ...q));
// a cylinder: a rail, a pipe, a pole. Along y; rz = PI / 2 lays it along x, rx = PI / 2 along z
function rod(c, g, m, R, L, x, y, z, rx = 0, rz = 0, n = 10) { const o = new c.THREE.Mesh(new c.THREE.CylinderGeometry(R, R, L, n), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; }
const steelM = (c) => mat('steel', () => std(c, 0xb8bcc2, { metalness: 0.9, roughness: 0.3 }));
// a card: a canvas on a wall or a rail with a ground colour and lines of text, the first line big
function card(c, g, x, y, z, ry, w, h, bg, fg, lines, font) {
  const m = decal(c, w, h, (q, W2, H2) => { q.fillStyle = bg; q.fillRect(0, 0, W2, H2); q.strokeStyle = fg; q.lineWidth = H2 * 0.03; q.strokeRect(H2 * 0.04, H2 * 0.04, W2 - H2 * 0.08, H2 - H2 * 0.08); q.fillStyle = fg; q.textAlign = 'center'; q.textBaseline = 'middle';
    const n = lines.length; lines.forEach((l, i) => { const big = i === 0; q.font = `${big ? 900 : 600} ${H2 * (big ? (n === 1 ? 0.3 : 0.24) : 0.12)}px ${font || c.FONT}`; q.fillText(l, W2 / 2, n === 1 ? H2 * 0.5 : H2 * (0.34 + i * 0.24)); }); });
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}
// a fluorescent tube in a housing: no light, a bright bar
function fluor(c, g, x, y, z, L = 1.4, ry = 0, col = 0xeaf4ff) {
  const m = new c.THREE.Mesh(new c.THREE.BoxGeometry(L, 0.05, 0.12), mat('fl' + col, () => basic(c, col))); m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
  const h = c.slab(L + 0.1, 0.08, 0.3, mat('flh', () => std(c, 0xd8dce0, { metalness: 0.6, roughness: 0.4 })), x, y + 0.06, z); h.rotation.y = ry; g.add(h); return m;
}
// a paper coffee cup, blue and white, the city's own
function cup(c, g, x, y, z) {
  const { THREE } = c, t = mat('cupT', () => c.canvasTex(128, 64, (q, w, h) => { q.fillStyle = '#f4f4f4'; q.fillRect(0, 0, w, h); q.fillStyle = '#1d4ed8'; q.fillRect(0, 8, w, 9); q.fillRect(0, h - 18, w, 9); q.font = '900 13px sans-serif'; q.textAlign = 'center'; q.fillText('N3W YORKERS', w / 2, h / 2 + 5); }));
  const m = new THREE.Mesh(mat('cupG', () => new THREE.CylinderGeometry(0.045, 0.035, 0.11, 14)), mat('cupM', () => new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }))); m.position.set(x, y + 0.055, z); g.add(m); return m;
}
const bagel = (c, g, x, y, z) => { const m = new c.THREE.Mesh(mat('bagG', () => new c.THREE.TorusGeometry(0.08, 0.035, 10, 20)), mat('bagM', () => std(c, 0xc8955a, { roughness: 0.95 }))); m.position.set(x, y, z); m.rotation.x = PI / 2; g.add(m); return m; };
// a shelf of cans, instanced, in the house colours
function cans(c, g, x1, x2, y, z, n, rows = 1, R = 0.035, H = 0.1) {
  const { THREE } = c, t = mat('canT', () => c.canvasTex(128, 64, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = '900 16px sans-serif'; q.textAlign = 'center'; q.fillText('NAZAR', w / 2, 26); q.fillText('COLA', w / 2, 46); q.fillStyle = '#1d4ed8'; q.beginPath(); q.arc(w / 2, 12, 5, 0, 7); q.fill(); }));
  const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(R, R, H, 12), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.3 }), n * rows), M = new THREE.Matrix4(), col = new THREE.Color();
  for (let r2 = 0; r2 < rows; r2++) for (let i = 0; i < n; i++) { const k = r2 * n + i; M.makeTranslation(x1 + (x2 - x1) * (i + 0.5) / n, y + H / 2 + r2 * (H + 0.01), z + (r2 % 2) * R * 1.4); m.setMatrixAt(k, M); col.set(INK[(i + r2) % INK.length]).lerp(new THREE.Color(0xffffff), 0.5); m.setColorAt(k, col); }
  g.add(m); return m;
}
// a string of pennants between two points
function pennants(c, g, x1, y1, z1, x2, y2, z2, n = 12) {
  const { THREE } = c, a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), L = a.distanceTo(b);
  const line = rod(c, g, mat('string', () => std(c, 0x222222)), 0.008, L, 0, 0, 0, 0, 0, 5); line.position.copy(a).add(b).multiplyScalar(0.5); line.rotation.set(0, 0, 0); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const t = mat('penT', () => c.canvasTex(64, 96, (q, w, h) => { q.fillStyle = '#ffffff'; q.beginPath(); q.moveTo(0, 0); q.lineTo(w, 0); q.lineTo(w / 2, h); q.closePath(); q.fill(); }));
  const geo = mat('penG', () => new THREE.PlaneGeometry(0.28, 0.42)), yaw = Math.atan2(x2 - x1, z2 - z1) + PI / 2;
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, p = a.clone().lerp(b, u); p.y -= 0.22 + Math.sin(u * PI) * 0.25; const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, color: INK[i % INK.length], transparent: true, side: THREE.DoubleSide, roughness: 0.8 })); m.position.copy(p); m.rotation.y = yaw; g.add(m); c.tick((tt) => { m.rotation.z = Math.sin(tt * 2 + i) * 0.12; }); }
}
// a radar screen that sweeps, on its own stand
function radar(c, g, X, x, z, ry, w = 1.0, title = 'DEEP SPACE') {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  o.add(c.slab(0.5, 0.1, 0.5, steelM(c), 0, 0.05, 0)); rod(c, o, steelM(c), 0.03, 1.1, 0, 0.6, 0); o.add(c.slab(w + 0.1, w + 0.1, 0.08, mat('dark', () => std(c, 0x1a1c22)), 0, 1.6, -0.04));
  const b = board(c, o, w, w, 256); b.m.position.set(0, 1.6, 0.01); c.post(X(x), z, 0.4);
  b.draw = (t) => { const { q, W: w2, H: h2 } = b; q.fillStyle = '#031008'; q.fillRect(0, 0, w2, h2); q.strokeStyle = '#1a5a2a'; q.lineWidth = 2; for (let k = 1; k <= 3; k++) { q.beginPath(); q.arc(w2 / 2, h2 / 2, w2 * 0.15 * k, 0, 7); q.stroke(); } q.beginPath(); q.moveTo(0, h2 / 2); q.lineTo(w2, h2 / 2); q.moveTo(w2 / 2, 0); q.lineTo(w2 / 2, h2); q.stroke();
    const a = t * 1.6; const gr = q.createConicGradient ? q.createConicGradient(a, w2 / 2, h2 / 2) : null; if (gr) { gr.addColorStop(0, 'rgba(90,255,138,.0)'); gr.addColorStop(0.85, 'rgba(90,255,138,.0)'); gr.addColorStop(1, 'rgba(90,255,138,.6)'); q.fillStyle = gr; q.beginPath(); q.arc(w2 / 2, h2 / 2, w2 * 0.46, 0, 7); q.fill(); }
    q.strokeStyle = '#5aff8a'; q.lineWidth = 3; q.beginPath(); q.moveTo(w2 / 2, h2 / 2); q.lineTo(w2 / 2 + Math.cos(a) * w2 * 0.46, h2 / 2 + Math.sin(a) * w2 * 0.46); q.stroke();
    q.fillStyle = '#f5c542'; for (let k = 0; k < 4; k++) { const ph = (t * 0.3 + k * 1.7) % 6.28, rr = w2 * (0.12 + k * 0.09); q.beginPath(); q.arc(w2 / 2 + Math.cos(ph) * rr, h2 / 2 + Math.sin(ph) * rr, 4, 0, 7); q.fill(); }
    q.fillStyle = '#9ad0a8'; q.font = `700 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'left'; q.fillText(title, 10, h2 * 0.08); q.fillText('4 CONTACTS · ALL FROM QUEENS', 10, h2 * 0.96); b.up(); };
  b.draw(0); return b;
}
// a flag on a pole: the census mark, in the house colours
function flag(c, g, X, x, z, text = 'N3W YORKERS') {
  const { THREE } = c; const pole = c.slab(0.05, 3.2, 0.05, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.6, z); g.add(pole); c.post(X(x), z, 0.1);
  const f = c.sign(text, { w: 1.4, h: 0.8, bg: '#1d4ed8', fg: '#f4ead2', font: c.FONT, weight: 900, px: 160, border: '#f5c542' }); f.position.set(x + 0.72, 2.75, z); g.add(f);
  c.tick((t) => { f.rotation.y = Math.sin(t * 2.1 + x) * 0.12; f.position.y = 2.75 + Math.sin(t * 3) * 0.02; }); return f;
}
// a console: a desk in brushed steel, a screen that draws itself, a chair
function console_(c, g, X, x, z, ry, draw) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  o.add(c.slab(1.8, 0.05, 0.8, S(c, 'steel', 1, 0xb0b4bc), 0, 0.76, 0)); for (const a of [-0.8, 0.8]) o.add(c.slab(0.06, 0.76, 0.7, S(c, 'steel', 1, 0x4a4e56), a, 0.38, 0));
  const b = board(c, o, 1.2, 0.7, 256); b.m.position.set(0, 1.25, -0.3); b.m.rotation.x = -0.2; o.add(c.slab(1.3, 0.78, 0.06, std(c, 0x1a1c22), 0, 1.25, -0.34));
  c.post(X(x), z, 0.9); b.draw = draw; return b;
}
const ROOM = {
  // MISSION CONTROL. The countdown runs only while nobody in the room is looking at it.
  control(c, r, g, X) {
    const { THREE } = c;
    const CD = { t: 600, launched: false, stared: 0, watched: false, go: [false, false, false, false, false] };
    const big = board(c, g, 7, 2.4, 512); big.m.position.set(10, 4.55, -D / 2 + 0.3);
    const fmt = (s) => { const m = Math.floor(s / 60), ss = Math.floor(s % 60); return `T MINUS ${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
    const drawBig = (seen) => { const { q, W: w2, H: h2 } = big; q.fillStyle = '#05070c'; q.fillRect(0, 0, w2, h2); q.fillStyle = seen ? '#ff4a4a' : '#5aff8a'; q.font = `900 ${h2 * 0.42}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(CD.launched ? 'LIFTOFF' : fmt(CD.t), w2 / 2, h2 * 0.56); q.fillStyle = '#f5c542'; q.font = `700 ${h2 * 0.11}px ${c.MONO}`; q.fillText(CD.launched ? 'THE PAD IS CLEAR · WALK EAST' : seen ? 'HOLD · SOMEBODY IS WATCHING' : 'COUNTING · NOBODY IS WATCHING', w2 / 2, h2 * 0.82); q.textAlign = 'left'; q.font = `600 ${h2 * 0.08}px ${c.MONO}`; q.fillStyle = '#8d8676'; q.fillText('N3W YORKERS SPACE PROGRAM · FLOYD BENNETT FIELD · FUNDED BY THE FARE HIKE', 24, h2 * 0.14); big.up(); };
    drawBig(false);
    const fwd = new THREE.Vector3(); let ac = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || CD.launched) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -D / 2 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const seen = dot > 0.72 && c.P.pitch > -0.5;
      if (seen) { CD.stared += dt; if (CD.stared > 8 && !CD.watched) { CD.watched = true; c.egg('watched', 'A watched countdown never counts. Turn around. It only moves while nobody in the room is looking at it.'); } }
      else { CD.stared = 0; CD.t -= dt * 6; }
      if (CD.t <= 0) { CD.t = 0; CD.launched = true; c.sound.boom && c.sound.boom(); c.shake(0.25); c.flash(0.8); c.egg('liftoff', 'Liftoff. The pad is on Rockaway Beach, next door. Nobody in this room saw it happen, which is how it happened.'); setTimeout(() => c.toast('The rocket is on the beach. Walk east to the pad.', 4200), 1200); }
      ac += dt; if (ac > 0.2) { ac = 0; drawBig(seen); } });
    // the room: a coffered steel ceiling with a tube in every coffer, a riser for the back row, the viewing gallery over the south wall
    const conc = S(c, 'concrete', 2, 0x8a8e98), stl = S(c, 'steel', 2, 0x5a5e68);
    coffer(c, r, g, { nx: 5, nz: 4, y: 6, mat: S(c, 'steel', 2, 0x9a9ea8), bulb: 0 });
    { const l = new THREE.PointLight(0xfff0d8, 9, 11, 1.6); l.position.set(10, 4.2, -1.2); g.add(l); }
    for (const x of [2, 6, 10, 14, 18]) for (const z of [-6, -2, 2]) fluor(c, g, x, 5.62, z, 1.6);
    box(c, g, 17.2, 0.3, 2.6, conc, 10, 0.15, -1.0); box(c, g, 17.2, 0.02, 0.12, mat('ylw', () => basic(c, 0xf5c542)), 10, 0.31, 0.26);
    const mz = mezzanine(c, r, g, X, { y: 3.5, depth: 2.6, mat: stl, rail: 0x2a2e36, stairAt: 2.0 }); const mg = r.ground;
    r.ground = (x, z) => mg(x, z) || (x > 1.4 && x < 18.6 && z > -2.3 && z < 0.3 ? 0.3 : 0);
    card(c, g, 10, 5.2, D / 2 - 0.13, PI, 5.2, 0.6, '#0d0d0d', '#f5c542', ['VIEWING GALLERY · FAMILIES, PRESS, THE COMPTROLLER']);
    for (const [x, z, ry, pool] of [[6, 6.9, PI, 'suits'], [9.2, 6.7, PI + 0.3, 'suits'], [13.4, 6.9, PI - 0.2, 'dressy'], [16.4, 6.8, PI, 'suits']]) { const e = extra(c, g, x, z, { ry, pool }); e.position.y = mz.y; }
    prop(c, r, g, X, 'nyb_crowd_cooler', 18.4, 7.0, { h: 1.5, y: mz.y, egg: ['The water cooler', 'control_cooler', 'The water cooler on the gallery. The real GO NO GO happens here, in paper cups, before anybody sits down.'] });
    prop(c, r, g, X, 'nyb_hudsucker_globe', 10.6, 7.1, { h: 1.3, y: mz.y, spin: 0.2, egg: ['The globe', 'control_globe', 'The globe. From a boardroom on Wall Street. Spin it: everywhere on it is the same distance from the rent.'] });
    for (let k = 0; k < 7; k++) cup(c, g, 3 + k * 2.3, mz.y + 1.02, 5.5 + (k % 2) * 0.1);
    // the hero under the big board: the quote board from the Street, now the program's own ticker
    const hero = prop(c, r, g, X, 'nyb_wallst_quote', 10, -5.4, { len: 3.4, r: 1.5, egg: ['The quote board', 'control_quote', 'The quote board, from the floor of the Exchange. It lists the fare, the rent and the countdown. Two of the three only go up.'] });
    label(c, g, 7.4, 0.5, -4.2, 0, ['THE BOARD', 'from the Exchange, repainted', '"FARE · RENT · T MINUS"']);
    // five consoles, five GO NO GO calls
    const NAMES = ['FIDO', 'GUIDO', 'EECOM', 'RETRO', 'CAPCOM'], Q = ['Fuel: a bodega pump on Avenue U. GO.', 'Guidance: the Belt Parkway, then up. GO.', 'Environment: 70 degrees and the smell of the ocean. GO.', 'Retro: we can always take the ferry back. GO.', 'Capcom: the astronaut says what. GO.'];
    NAMES.forEach((n, k) => { const x = 4.2 + k * 2.9, b = console_(c, g, X, x, 1.4, 0, null); const draw = () => { const { q, W: w2, H: h2 } = b; q.fillStyle = CD.go[k] ? '#0a2a14' : '#0a0c14'; q.fillRect(0, 0, w2, h2); q.fillStyle = CD.go[k] ? '#5aff8a' : '#ff8a4a'; q.font = `800 ${h2 * 0.26}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(n, w2 / 2, h2 * 0.4); q.fillText(CD.go[k] ? 'GO' : 'NO GO', w2 / 2, h2 * 0.78); b.up(); }; draw();
      c.clickable(b.m, () => { CD.go[k] = !CD.go[k]; draw(); c.sound.beep && c.sound.beep(); c.say(b.m, Q[k], 3000, 0.9); if (CD.go.every(Boolean)) c.egg('go', 'Five GO calls. Flight, we are go for a launch nobody will watch. That is the only kind we can afford.'); }, n + ' console (click for GO)');
      const e = extra(c, g, x, 2.2, { seated: true, col: [0x2a3a6a, 0x3a2a4a, 0x2a4a3a, 0x4a2a2a, 0x3a3a2a][k], ry: PI, pool: 'seated' }); e.userData.body.scale.y = 0.9;
      cup(c, g, x + 0.6, 0.78, 1.5); if (k % 2) prop(c, r, g, X, 'binder_notebook', x - 0.6, 1.55, { len: 0.3, y: 0.78, ry: 0.4 }); else prop(c, r, g, X, 'office_notepads', x - 0.55, 1.5, { len: 0.3, y: 0.78 }); });
    for (const x of [4.2, 7.1, 10, 12.9, 15.8]) prop(c, r, g, X, 'SchoolChair_01', x, 2.3, { h: 0.9, ry: PI, shadow: true });
    // the back row on the riser: the Street's own desks, a screen on each, a controller at each
    [['nyb_wallst_desk', 4.4, 'nyb_trading_tv', 'TRAJECTORY'], ['nyb_crowd_desk', 8.2, 'nyb_network_tv', 'WEATHER'], ['nyb_trading_desk', 12.0, 'nyb_trading_tv', 'SURGEON'], ['nyb_wallst_desk', 15.8, 'nyb_network_tv', 'PAO']].forEach(([d, x, tv, nm], k) => {
      prop(c, r, g, X, d, x, -1.2, { len: 1.9, y: 0.3, r: 1.0 }); prop(c, r, g, X, tv, x + 0.3, -1.35, { len: 0.7, y: 1.06, ry: PI }); prop(c, r, g, X, 'SchoolChair_01', x, -0.4, { h: 0.9, y: 0.3, ry: PI });
      const e = extra(c, g, x, -0.5, { seated: true, col: [0x3a3a5a, 0x5a3a3a, 0x3a5a4a, 0x4a4a2a][k], ry: PI, pool: 'seated' }); e.position.y = 0.3;
      cup(c, g, x - 0.7, 1.06, -1.1); label(c, g, x, 0.62, 0.2, 0, [nm, 'back row, the riser', '"ALSO GO"'], 0.7); });
    prop(c, r, g, X, 'nyb_hudsucker_phone', 7.5, -1.0, { len: 0.36, y: 1.06, ry: -0.4 }); prop(c, r, g, X, 'nyb_deskset_phone', 12.7, -1.0, { len: 0.34, y: 1.06, ry: 0.3 });
    prop(c, r, g, X, 'desk_lamp_arm_01', 3.7, -1.5, { h: 0.5, y: 1.06, ry: 0.8 }); prop(c, r, g, X, 'desk_lamp_arm_01', 16.5, -1.5, { h: 0.5, y: 1.06, ry: -0.8 }); prop(c, r, g, X, 'clipboard', 10.3, -0.9, { len: 0.32, y: 1.06, ry: 0.2 });
    // the flight director and the model of the room he wishes he had
    cast(c, r, g, X, 'agent', 10, -3.6, { h: 1.85, ry: PI, line: () => CD.launched ? 'It is up. Nobody saw it go. Perfect launch.' : 'Flight here. The clock only runs when the room is empty. Budget cuts. Turn around.', hint: 'The flight director', egg: 'flight' });
    plinth(c, g, X, 1.4, -4.6, 1.3, 0.9, 1.0); const jsc = c.glb('nasa_jsc-mission-control-room', { len: 1.2, x: 1.4, y: 0.9, z: -4.6, ry: 0.4, parent: g }); c.clickable(jsc, () => c.say(jsc, 'A model of the mission control we were promised. In the budget it is called "the painting".', 3400, 1.3), 'The model'); label(c, g, 1.4, 0.5, -4.0, 0, ['MISSION CONTROL, MODEL', 'the one in the brochure', '"A RENDERING"']);
    plinth(c, g, X, 18.6, -4.6, 1.3, 0.9, 1.0); const mess = c.glb('mercury-surface-space-environment-geochemistry-and-ranging-messenger', { len: 1.2, x: 18.6, y: 1.0, z: -4.6, ry: -0.4, parent: g }); c.tick((t) => { mess.rotation.y = t * 0.3; }); c.clickable(mess, () => c.say(mess, 'MESSENGER. Went to Mercury. Came back for the fare.', 2600, 1.3), 'A probe');
    prop(c, r, g, X, 'classic_laptop', 10, 0.8, { len: 0.5, y: 0.78, egg: ['A laptop', 'laptop', 'The launch software is a spreadsheet. The spreadsheet is a napkin. The napkin says GO.'] });
    prop(c, r, g, X, 'vintage_radio_transceiver', 15.8, 0.8, { len: 0.5, y: 0.78, egg: ['The radio', 'radio', 'Houston does not pick up. Houston never picks up. We call Flushing. Flushing picks up.'] });
    // the video walls in the front corners: the Street's screens stacked three high, and the eye that watches the watchers
    for (const [x, ry] of [[1.5, 0.9], [18.5, -0.9]]) { prop(c, r, g, X, 'nyb_network_tv', x, -6.8, { len: 0.9, ry }); prop(c, r, g, X, 'nyb_trading_tv', x, -6.8, { len: 0.8, y: 0.72, ry: ry * 0.8 }); prop(c, r, g, X, 'nyb_tv_eye', x, -6.8, { len: 0.7, y: 1.36, ry: ry * 1.1, hint: 'The eye', fn: (cc, m) => cc.say(m, 'The eye channel. It watches the countdown so you do not have to. The countdown knows.', 2800, 0.5) }); c.post(X(x), -6.8, 0.7); }
    // the orbit board on the east wall: the ground track, the capsule over Queens every ninety minutes
    const trk = board(c, g, 4.6, 1.8, 384); trk.m.position.set(W - 0.2, 4.4, -3.0); trk.m.rotation.y = -PI / 2; box(c, g, 0.08, 1.95, 4.75, mat('dark', () => std(c, 0x1a1c22)), W - 0.24, 4.4, -3.0);
    const drawTrk = (t) => { const { q, W: w2, H: h2 } = trk; q.fillStyle = '#06101a'; q.fillRect(0, 0, w2, h2); q.strokeStyle = '#1e3a5a'; q.lineWidth = 2; for (let i = 1; i < 12; i++) { q.beginPath(); q.moveTo(w2 * i / 12, 0); q.lineTo(w2 * i / 12, h2); q.stroke(); } for (let j = 1; j < 6; j++) { q.beginPath(); q.moveTo(0, h2 * j / 6); q.lineTo(w2, h2 * j / 6); q.stroke(); }
      q.fillStyle = '#24483a'; [[0.3, 0.4, 70, 34, 0.3], [0.37, 0.46, 44, 22, 0.6], [0.33, 0.5, 52, 20, 0.1], [0.42, 0.42, 30, 14, 0.2]].forEach(([u, v, a, b2, rr]) => { q.beginPath(); q.ellipse(w2 * u, h2 * v, a, b2, rr, 0, 7); q.fill(); });
      q.strokeStyle = '#5aff8a'; q.lineWidth = 3; for (let k = 0; k < 3; k++) { q.beginPath(); for (let i = 0; i <= 100; i++) { const u = i / 100, x = w2 * u, y = h2 / 2 + Math.sin(u * PI * 2 + k * 2.1 - t * 0.05) * h2 * 0.32; i ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); }
      const u = (t * 0.02) % 1; q.fillStyle = '#ff4fa3'; q.beginPath(); q.arc(w2 * u, h2 / 2 + Math.sin(u * PI * 2 - t * 0.05) * h2 * 0.32, 8, 0, 7); q.fill();
      q.fillStyle = '#f5c542'; q.font = `700 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('GROUND TRACK · THE CAPSULE PASSES OVER QUEENS EVERY 90 MIN', 14, h2 * 0.1); q.fillText('QUEENS HAS NOTICED', 14, h2 * 0.95); trk.up(); };
    drawTrk(0); let ta = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ta += dt; if (ta > 0.25) { ta = 0; drawTrk(t); } });
    c.clickable(trk.m, () => c.egg('control_track', 'The ground track. The capsule passes over Queens every ninety minutes. Queens has noticed and has filed a complaint about the noise.'), 'The ground track');
    // the walls and the corners: files, a cabinet, the clock that runs on Street time, a fan, the counted camera, the extinguisher
    props(c, r, g, X, [['nyb_crowd_files', 0.7, -0.6, { h: 1.5, ry: PI / 2, r: 0.5 }], ['nyb_crowd_files', 0.7, 0.6, { h: 1.5, ry: PI / 2, r: 0.5 }], ['nyb_deskset_cabinet', 19.1, -0.8, { h: 1.3, ry: -PI / 2, r: 0.5 }], ['nyb_crowd_cooler', 18.8, -2.4, { h: 1.5, r: 0.4 }],
      ['nyb_crowd_clock', 19.6, 1.0, { len: 0.6, y: 3.2, ry: -PI / 2 }], ['nyb_crowd_fan', 0.6, 1.2, { h: 0.5, y: 1.52, ry: PI / 2, spin: 0 }], ['nyb_seccam_counted', 19.5, 1.6, { len: 0.5, y: 4.6, ry: -PI / 2 - 0.6 }], ['nyb_extinguisher', 0.4, 1.4, { h: 0.6, y: 0.8, ry: PI / 2 }],
      ['nyb_crowd_lamp', 1.4, 0.0, { h: 0.6, y: 1.5, ry: PI / 2 }], ['stationery_supplies', 0.7, 0.0, { len: 0.3, y: 1.5 }], ['nyb_tv_eye', 10, 7.2, { len: 0.6, y: mz.y, ry: PI, spin: 0.4 }], ['nyb_crowd_tallclock', 18.9, 6.6, { h: 2.0, ry: -PI / 2 }]]);
    prop(c, r, g, X, 'fire_alarm', 0.3, 2.4, { h: 0.3, y: 1.8, ry: PI / 2 });
    notice(c, g, '"MISSION" CONTROL · "LAUNCH" IS A STATE OF MIND', 10, 2.6, -D / 2 + 0.3, 0, 4.4, 0.36, '#0d0d0d', '#f5c542');
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'FUNDED BY THE "FARE HIKE"', 'THE N3W YORKERS SPACE PROGRAM', 2.4);
  },
  // THE LAUNCH PAD. Walk at the rocket; the lens widens and the pad stays where it is. Click it to go up.
  pad(c, r, g, X) {
    const { THREE } = c;
    const px = 10, pz = -4.4;
    g.add(c.slab(6, 0.6, 6, S(c, 'concrete', 2, 0x8a8a8a), px, 0.3, pz)); c.wall(X(px - 3), pz - 3, X(px + 3), pz - 3); c.wall(X(px - 3), pz + 3, X(px + 3), pz + 3); c.wall(X(px - 3), pz - 3, X(px - 3), pz + 3); c.wall(X(px + 3), pz - 3, X(px + 3), pz + 3);
    const rocket = c.glb('ares-1-a', { h: 9, x: px, y: 0.6, z: pz, parent: g, shadow: false }); const atlas = c.glb('atlas-9-faith-7', { h: 4.2, x: px + 2.2, y: 0.6, z: pz + 1.8, parent: g, shadow: false });
    // the tower, the flame trench, the smoke
    for (const dz of [-2.2, 2.2]) g.add(c.slab(0.3, 9, 0.3, std(c, 0xc8402a, { metalness: 0.5, roughness: 0.6 }), px - 2.4, 5.1, pz + dz)); for (let y = 1.6; y < 9; y += 1.6) g.add(c.slab(0.2, 0.2, 4.7, std(c, 0xc8402a), px - 2.4, y, pz));
    const smoke = []; for (let i = 0; i < 14; i++) { const s = glow(c, g, px + (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.6, pz + (Math.random() - 0.5) * 3, 'rgba(220,220,230,.35)', 2.2 + Math.random() * 2); smoke.push(s); }
    c.tick((t) => smoke.forEach((s, i) => { s.position.y = 0.4 + Math.sin(t * 0.6 + i) * 0.25; s.material.opacity = 0.5 + Math.sin(t * 0.8 + i * 2) * 0.2; }));
    // the dolly zoom: the field of view narrows with the distance to the pad, and the engine pulls the camera back
    r.fov = (P) => { const L = local(r, P); const d = Math.hypot(L.x - px, L.z - pz); return 66 - Math.max(0, Math.min(1, (10 - d) / 8)) * 34; };
    let near = false; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P), d = Math.hypot(L.x - px, L.z - pz); if (d < 4.6 && !near) { near = true; c.sound.drone && c.sound.drone(); c.egg('vertigo', 'The closer you walk, the further the pad gets. The lens does that. Hitchcock did it to a bell tower. We did it to a rocket on the beach.'); } if (d > 7) near = false; });
    // strap in: a ride up the tower and out of the room
    c.clickable(rocket, () => { if (r.launching) return; r.launching = true; c.toast('Strapped in. Hold on to something. Hold on to nothing. Nothing is what we have.', 3000); c.sound.boom && c.sound.boom();
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(r.x0 + px - 4.2, 1.6, pz + 5), new THREE.Vector3(r.x0 + px - 4.4, 4, pz + 4), new THREE.Vector3(r.x0 + px - 4.6, 9, pz + 2), new THREE.Vector3(r.x0 + px - 3, 16, pz - 2), new THREE.Vector3(r.x0 + px, 26, pz - 10)]);
      c.ride(curve, 7, () => { c.flash(1); c.shake(0.3); c.egg('ride', 'Up and out. Rockaway got small, then Brooklyn got small, then the rent got small. Welcome to low Earth orbit, next car.'); setTimeout(() => { c.P.lift = 0; c.go(r.i + 1); r.launching = false; }, 400); }); }, 'The rocket (strap in)');
    label(c, g, px - 3.4, 0.9, pz + 3.2, 0, ['ARES, ONE OF THEM', 'wrapped, fuelled, on a beach', '"CLICK TO BOARD"']);
    // the perimeter: chainlink with a gate at the walk, the city's barriers, the signs
    for (const x of [4.6, 7.3, 12.7, 15.4]) { prop(c, r, g, X, 'nyb_chainlink', x, -0.6, { len: 2.8, r: 0 }); c.wall(X(x - 1.4), -0.6, X(x + 1.4), -0.6); }
    props(c, r, g, X, [['nyb_barrier', 6.4, 0.6, { len: 2.0, ry: 0.2, r: 1.0 }], ['nyb_barrier', 13.6, 0.6, { len: 2.0, ry: -0.2, r: 1.0 }], ['nyb_itch_caution', 7.6, 1.5, { h: 0.9, ry: 0.4, r: 0.3 }],
      ['nyb_aframe_sign', 12.6, 1.8, { h: 1.0, ry: -0.5, r: 0.4, egg: ['The sign', 'pad_sign', 'VIEWING, THIRTY SEVEN DOLLARS. Same price as the hot dog. The hot dog comes with a view of the sign.'] }]]);
    // the searchlights from a premiere in 1933, sweeping the sky over Rockaway
    const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    [[5.4, -6.9, 0], [14.6, -6.9, 2.1]].forEach(([x, z, ph]) => { prop(c, r, g, X, 'nyb_kong_searchlight', x, z, { h: 1.9, ry: x < 10 ? 0.6 : -0.6, r: 0.7, egg: ['A searchlight', 'pad_searchlight', 'The searchlights are from a premiere in 1933. Something big climbed something tall that night too. The rent was eleven dollars.'] });
      const pv = new THREE.Group(); pv.position.set(x, 1.3, z); g.add(pv); const m = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.1, 18, 12, 1, true), beamM); m.position.y = 9; pv.add(m); glow(c, g, x, 1.4, z, 'rgba(255,240,200,.9)', 1.2); c.tick((t) => { pv.rotation.z = Math.sin(t * 0.3 + ph) * 0.45 * (x < 10 ? -1 : 1); pv.rotation.x = Math.cos(t * 0.23 + ph) * 0.35; }); });
    // the viewing stand: three tiers of pavers in the south west corner, the program's public, a rail along the top
    const pav = S(c, 'pavers', 1.5, 0x9a9a98), rl = steelM(c); for (let k = 0; k < 3; k++) { const t = box(c, g, 6.2, 0.42 * (k + 1), 0.7, pav, 4.3, 0.21 * (k + 1), 6.25 + k * 0.7); if (!k) c.clickable(t, () => c.egg('pad_bleachers', 'The bleachers. From a Little League field in Marine Park, loaned for the launch. The Little League is also here. They are the program.'), 'The viewing stand'); }
    box(c, g, 6.4, 0.04, 0.04, rl, 4.3, 1.9, 7.95); for (const x of [1.3, 4.3, 7.3]) rod(c, g, rl, 0.02, 0.64, x, 1.58, 7.95); c.wall(X(1.2), 5.88, X(7.4), 5.88); c.wall(X(7.45), 5.88, X(7.45), 8);
    [[2.0, 0], [3.4, 0], [4.8, 0], [6.2, 0], [2.7, 1], [4.1, 1], [5.5, 1], [2.0, 2], [3.6, 2], [5.2, 2], [6.5, 2]].forEach(([x, k], i) => { const e = extra(c, g, x, 6.3 + k * 0.7, { seated: true, ry: PI + (Math.random() - 0.5) * 0.4, pool: 'seated', col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a][i % 4] }); e.position.y = 0.42 * (k + 1); });
    cup(c, g, 2.7, 0.42, 6.0); cup(c, g, 5.5, 0.84, 6.7); cup(c, g, 3.9, 1.26, 7.4); card(c, g, 4.3, 2.6, D / 2 - 0.13, PI, 3.2, 0.5, '#1d4ed8', '#f4ead2', ['LAUNCH VIEWING · $37 · NO REFUNDS AFTER T MINUS ONE']);
    for (const [x, z, ry] of [[5.2, 0.8, PI + 0.3], [15.0, 1.4, PI - 0.4], [6.4, 2.6, PI + 0.1]]) extra(c, g, x, z, { ry });
    // the beach: the suit, the hot dog cart, the pigeon lady, the generator the whole program runs on
    const suit = c.glb('ph_metal_toolbox', { len: 1.0, x: 4.2, z: 1.6, ry: 0.5, parent: g }); c.post(X(4.2), 1.6, 0.5); c.clickable(suit, () => { c.say(suit, 'The suit is at the cleaners. The toolbox is wrapped. Those are the two facts.', 2800, 1.0); c.egg('suit', 'No suit. The program sent it to a dry cleaner on Beach 116th in March. The ticket is in the toolbox. The toolbox is wrapped. Launch is now.'); }, 'The toolbox'); label(c, g, 4.2, 0.5, 2.3, 0, ['THE SUIT', 'at the cleaners since March', '"LAUNCH ANYWAY"']);
    cast(c, r, g, X, 'hotdog', 16.2, 2.2, { h: 1.8, ry: -0.6, line: 'Hot dog, thirty seven dollars. Launch price. Tomorrow it is forty.', hint: 'The vendor', egg: 'hotdog' });
    prop(c, r, g, X, 'nyb_coffeecart', 17.6, 0.4, { len: 2.0, ry: -PI / 2, r: 1.0 }); prop(c, r, g, X, 'nyb_coney_franks', 15.2, 3.4, { h: 0.8, ry: 0.3, r: 0.4 });
    cast(c, r, g, X, 'pigeonlady', 2.6, -1.8, { h: 1.72, ry: 0.9, line: 'The pigeons are not coming. The pigeons have seen a launch. The pigeons are smarter than the program.', hint: 'The pigeon lady' });
    prop(c, r, g, X, 'nyb_sw_generator', 15.2, -5.4, { len: 1.5, ry: 0.4, r: 0.8, egg: ['The generator', 'generator', 'The whole program runs off this generator. It runs off a gas can. The gas can is from a station on Cross Bay Boulevard that closed in 2019.'] });
    props(c, r, g, X, [['nyb_sw_jerrycan', 16.6, -5.0, { h: 0.5, r: 0.3 }], ['nyb_legend_jerry', 16.2, -5.9, { h: 0.5, ry: 0.5, r: 0.3 }], ['nyb_gatsby_gascan', 14.2, -6.4, { h: 0.4, r: 0.25 }], ['nyb_gatsby_gascan', 14.7, -6.5, { h: 0.4, ry: 1, r: 0.25 }],
      ['nyb_gatsby_drum', 17.5, -6.6, { h: 0.9, r: 0.4, egg: ['A fuel drum', 'pad_drums', 'Fuel. Also from Cross Bay Boulevard. The drums say DO NOT STORE NEAR HEAT. The rocket says otherwise.'] }], ['nyb_gatsby_drum2', 18.4, -6.1, { h: 0.9, ry: 0.4, r: 0.4 }], ['nyb_coney_barrel', 18.6, -4.9, { h: 0.9, r: 0.4 }],
      ['nyb_apes_crate', 15.8, -3.4, { len: 1.0, ry: 0.3, r: 0.6 }], ['nyb_apes_crate', 17.2, -3.8, { len: 0.8, ry: 0.9, r: 0.5 }], ['nyb_apes_buoy', 18.8, -7.1, { h: 1.6, r: 0.5, bob: 1.2 }], ['propane_tank', 3.4, -5.4, { h: 1.2, r: 0.5 }],
      ['nyb_legend_tarpcar', 3.2, -5.4, { len: 4.0, ry: 0.25, r: 1.7, egg: ['A car under a tarp', 'pad_tarp', 'Under the tarp is the first rocket. It is a Buick. It did not go up. It went to Howard Beach, which the committee counted.'] }], ['nyb_utility_bomb', 0.7, -7.3, { h: 1.2, ry: PI / 2, r: 0.5 }],
      ['nyb_hitch_stove', 15.0, 6.7, { h: 0.9, ry: 0.4, r: 0.5 }], ['folding_wooden_stool', 14.0, 6.2, { h: 0.45, r: 0.3 }], ['folding_wooden_stool', 16.2, 6.4, { h: 0.45, ry: 0.6, r: 0.3 }], ['brass_pot_01', 15.0, 6.7, { h: 0.2, y: 0.9 }],
      ['nyb_trash_dsny', 18.4, 7.1, { h: 1.1, r: 0.4 }], ['nyb_payphone', 19.2, 6.6, { h: 2.0, ry: -PI / 2, r: 0.4 }], ['nyb_hydrant_pink', 12.2, 7.3, { h: 0.8, r: 0.3 }], ['nyb_lamp_banner', 8.3, 7.3, { h: 4.6, r: 0.3 }], ['nyb_lamp_banner', 13.5, 7.3, { h: 4.6, r: 0.3 }],
      ['nyb_milkcrate_cyan', 14.3, 1.2, { h: 0.4, r: 0.3 }], ['nyb_milkcrate_pink', 14.3, 1.2, { h: 0.4, y: 0.4, ry: 0.4 }], ['cement_bag', 3.6, -3.0, { len: 0.8, r: 0.4 }], ['old_tyre', 1.2, -2.6, { len: 0.7, r: 0.4 }]]);
    cup(c, g, 14.0, 0.45, 6.2); cup(c, g, 16.2, 0.45, 6.4);
    for (const [x, z] of [[14.6, 6.9], [1.0, -3.6]]) extra(c, g, x, z, { ry: x < 10 ? -PI / 2 : PI / 2 + 0.3 });
    // cables from the generator to the pad, two pennant lines from the tower, the gull
    const cab = mat('cable', () => std(c, 0x111111, { roughness: 0.9 })); rod(c, g, cab, 0.02, 2.4, 14.2, 0.03, -4.2, 0, PI / 2); rod(c, g, cab, 0.02, 3.0, 14.4, 0.03, -5.0, 0, PI / 2);
    pennants(c, g, px - 2.4, 8.6, pz - 2.2, 1.0, 4.4, 7.6, 16); pennants(c, g, px - 2.4, 8.6, pz + 2.2, 19.0, 4.6, 7.6, 16);
    flag(c, g, X, 7.9, 5.6);
    const g2 = c.glb('gull', { len: 0.8, x: 10, y: 3.2, z: 1, parent: g, shadow: false }); c.tick((t) => { g2.position.set(10 + Math.sin(t * 0.5) * 7, 3.2 + Math.sin(t * 1.2) * 0.3, 1 + Math.cos(t * 0.5) * 3); g2.rotation.y = Math.atan2(Math.cos(t * 0.5) * 7, -Math.sin(t * 0.5) * 3); });
    notice(c, g, '"ROCKAWAY" SPACEPORT · NO SWIMMING DURING LAUNCH', 10, 0.06, 4.6, 0, 3.2, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
  },
  // THE CAPSULE. A subway car in orbit. Gravity is off. SPACE pushes off the floor.
  capsule(c, r, g, X) {
    const { THREE } = c;
    const Z = { vy: 0, on: false, floated: false, vx: 0, vz: 0 };
    r.holdLift = true;
    r.onEnter = () => { Z.on = true; c.toast('Zero G. SPACE pushes you off the floor. Walking drifts. Stand clear of the closing airlock.', 4200); };
    r.onLeave = () => { Z.on = false; c.P.lift = 0; };
    const key = (e) => { if (!Z.on || e.repeat || e.code !== 'Space') return; Z.vy = Math.max(Z.vy, 1.6); c.sound.whoosh && c.sound.whoosh(); if (!Z.floated) { Z.floated = true; c.egg('float', 'You pushed off. In orbit the floor is a suggestion. So is the ceiling. So, lately, is the fare.'); } };
    addEventListener('keydown', key);
    const ob = document.getElementById('olliebtn'); if (ob) ob.addEventListener('click', () => { if (Z.on) key({ code: 'Space' }); });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; Z.vy -= dt * 0.35; c.P.lift += Z.vy * dt; if (c.P.lift > 3.6) { c.P.lift = 3.6; Z.vy = -Math.abs(Z.vy) * 0.3; } if (c.P.lift < 0) { c.P.lift = 0; if (Z.vy < -0.6) c.sound.thud && c.sound.thud(0.2); Z.vy = 0; } });
    r.move = (P, nx, nz, dt) => { Z.vx += ((nx - P.x) / Math.max(dt, 1e-3) - Z.vx) * Math.min(1, dt * 1.2); Z.vz += ((nz - P.z) / Math.max(dt, 1e-3) - Z.vz) * Math.min(1, dt * 1.2); return [P.x + Z.vx * dt, P.z + Z.vz * dt]; };
    // the car: seats in painted fibreglass, poles, handrails with the straps on them, the ad rail, and things that float
    const steel = steelM(c), orange = S(c, 'plaster', 1, 0xff8a1a), yellow = S(c, 'plaster', 1, 0xf5c542), dk = S(c, 'steel', 1.5, 0x5a5e66);
    for (const z of [-5.6, 5.6]) for (let x = 3.0; x < 14; x += 1.2) { const s = c.slab(1.0, 0.1, 0.9, (x / 1.2 | 0) % 2 ? orange : yellow, x, 0.5, z); g.add(s); g.add(c.slab(1.0, 0.8, 0.1, (x / 1.2 | 0) % 2 ? orange : yellow, x, 0.95, z + (z > 0 ? 0.4 : -0.4))); }
    c.wall(X(2.4), -5.1, X(14.6), -5.1); c.wall(X(2.4), 5.1, X(14.6), 5.1);
    for (const x of [4, 8, 12, 17]) { g.add(c.slab(0.05, 5.9, 0.05, steel, x, 2.95, -3)); g.add(c.slab(0.05, 5.9, 0.05, steel, x, 2.95, 3)); c.post(X(x), -3, 0.12); c.post(X(x), 3, 0.12); }
    for (const z of [-3, 3]) rod(c, g, steel, 0.025, 11.6, 8.3, 2.1, z, 0, PI / 2);
    for (let x = 2.8; x < 14; x += 1.0) for (const z of [-3, 3]) { const st = c.slab(0.04, 0.5, 0.04, std(c, 0x1a1a1a), x, 1.86, z); g.add(st); c.tick((t) => { st.rotation.x = Math.sin(t * 1.3 + x) * 0.5; st.rotation.z = Math.cos(t * 0.9 + x) * 0.5; }); }
    // the ad rail: the cards every rider reads twice
    const ADS = [['EYE CRUNCH', 'the cereal that looks back'], ['NAZAR COLA', 'nobody sold twice'], ['DEPT. OF THE COUNTED', 'have you been counted'], ['LEARN TO DRIVE', 'in orbit, nights'], ['N3W YORKERS', 'the census is in orbit'], ['IF YOU SEE SOMETHING', 'it is probably floating'], ['ROOMS TO LET', 'low earth, no fee']];
    for (const [z, ry] of [[-3.5, 0], [3.5, PI]]) { const rail = box(c, g, 11.8, 0.62, 0.06, dk, 8.3, 2.78, z); rail.rotation.x = z < 0 ? 0.28 : -0.28; ADS.forEach(([a, b], k) => { const m = card(c, g, 3.3 + k * 1.65, 2.78, z + (z < 0 ? 0.04 : -0.04), ry, 1.4, 0.5, ['#f4ead2', '#1d4ed8', '#111', '#ff4fa3'][k % 4], k % 4 === 0 || k % 4 === 2 ? (k % 4 ? '#f5c542' : '#111') : '#f4ead2', [a, b]); m.rotation.x = z < 0 ? 0.28 : -0.28; }); }
    // the airlock bulkhead: a round hatch across the car at x 15, the chamber beyond it is the pilot's
    const bh = S(c, 'steel', 2, 0x8a8e96); box(c, g, 0.3, 1.5, 16, bh, 15, 5.25, 0); for (const z of [-5.2, 5.2]) box(c, g, 0.3, 4.6, 5.6, bh, 15, 2.3, z); c.wall(X(15), -8, X(15), -2.4); c.wall(X(15), 2.4, X(15), 8);
    const ringP = new THREE.Mesh(new THREE.RingGeometry(2.3, 3.5, 48), S(c, 'steel', 1, 0x6a6e76)); ringP.position.set(15, 2.3, 0); ringP.rotation.y = PI / 2; ringP.material.side = THREE.DoubleSide; g.add(ringP);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.14, 12, 48), std(c, 0xf5c542, { metalness: 0.6, roughness: 0.4 })); ring.position.set(15, 2.3, 0); ring.rotation.y = PI / 2; g.add(ring);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, b = new THREE.Mesh(mat('boltG', () => new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8)), steel); b.position.set(15, 2.3 + Math.sin(a) * 2.3, Math.cos(a) * 2.3); b.rotation.z = PI / 2; g.add(b); }
    card(c, g, 14.84, 4.9, 0, -PI / 2, 2.8, 0.4, '#0d0d0d', '#f5c542', ['AIRLOCK · MIND THE GAP · THE GAP IS SPACE']);
    prop(c, r, g, X, 'nyb_pelham_clock', 14.84, 3.6, { len: 0.6, y: 3.6, ry: -PI / 2, egg: ['The clock', 'capsule_clock', 'The clock says the next airlock is in nine seconds. It has said nine seconds since 1974. It is the most reliable thing on the line.'] });
    props(c, r, g, X, [['nyb_extinguisher', 15.25, 2.9, { h: 0.6, y: 0.9, ry: PI / 2 }], ['nyb_pelham_bench', 17.6, -3.8, { len: 1.6, r: 0.7 }], ['nyb_pelham_bench', 17.2, 4.0, { len: 1.6, ry: PI, r: 0.7 }], ['nyb_tv_eye', 17.6, -3.8, { len: 0.5, y: 0.5, ry: -0.5, hint: 'The eye', fn: (cc, m) => cc.say(m, 'The eye channel. Orbit edition. Same eye.', 2400, 0.5) }],
      ['nyb_pelham_light', 6.0, 0, { len: 1.2, y: 5.7 }], ['nyb_pelham_light', 10.0, 0, { len: 1.2, y: 5.7 }], ['nyb_pelham_light', 14.0, 0, { len: 1.2, y: 5.7 }], ['nyb_pelham_light', 17.6, 0, { len: 1.2, y: 5.7 }], ['nyb_pelham_wetfloor', 6.4, 4.3, { h: 0.7, r: 0.3 }], ['nyb_splash_monitor', 12.4, 4.4, { h: 0.6, y: 0.0, ry: PI, r: 0.4 }], ['nyb_seccam_counted', 14.84, 2.9, { len: 0.4, y: 4.6, ry: -PI / 2 + 0.6 }]]);
    for (const x of [4, 8, 12, 17.6]) fluor(c, g, x, 5.78, -2.6, 1.2); for (const x of [4, 8, 12, 17.6]) fluor(c, g, x, 5.78, 2.6, 1.2);
    // the cab: a niche in the west wall where the car is driven from, the monitor and the eye that counts the riders
    const cab = alcove(c, r, g, X, { side: 'w', at: -4.4, w: 2.6, d: 1.8, h: 2.8, mat: S(c, 'steel', 2, 0x7a7e86), floorMat: S(c, 'steel', 1, 0x5a5e66), light: 0x80c0ff });
    prop(c, r, g, X, 'nyb_splash_monitor', 0.5, -4.4, { h: 0.7, y: 1.0, ry: PI / 2, egg: ['The cab monitor', 'capsule_cab', 'The cab. The monitor shows the track ahead. There is no track ahead. The monitor shows the track anyway, out of habit.'] });
    prop(c, r, g, X, 'nyb_pelham_bench', 1.2, -4.4, { len: 1.1, ry: PI / 2, r: 0.5 }); box(c, g, 0.6, 0.9, 1.6, dk, 0.5, 0.45, -4.4); prop(c, r, g, X, 'classic_laptop', 0.6, -4.9, { len: 0.4, y: 0.9, ry: PI / 2 }); cup(c, g, 0.6, 0.9, -3.9);
    for (const [x, y, z, k] of [[1.0, 1.9, -4.9, 'N3W'], [1.0, 1.9, -4.4, 'LEO'], [1.0, 1.9, -3.9, 'HOME']]) card(c, g, 0.2, y, z, PI / 2, 0.42, 0.3, '#111', '#5aff8a', [k]);
    card(c, g, 0.2, 2.5, -4.4, PI / 2, 1.8, 0.3, '#f5c542', '#111', ['MOTORMAN ONLY · AND YOU, APPARENTLY']);
    // the floaters: the command module, a duck, an apple, a wrench, a cassette player, and the rider's own things, let go
    const F = [['si_nasm_command-module-apollo-11', 10, 2.4, 0, { len: 1.6 }], ['ph_rubber_duck_toy', 5, 2.0, 1.2, { h: 0.4 }], ['ph_food_apple_01', 14, 1.8, -1.0, { h: 0.2 }], ['ph_cassette_player', 7, 2.6, -1.6, { len: 0.5 }], ['ph_hatchet', 15.5, 2.2, 1.4, { len: 0.5 }], ['ph_wooden_bowl_01', 3.2, 1.6, 0.6, { len: 0.4 }]];
    F.forEach(([name, x, y, z, o], k) => { const m = c.glb(name, { ...o, x, y, z, parent: g, shadow: false }); c.tick((t) => { m.position.set(x + Math.sin(t * 0.4 + k) * 1.2, y + Math.sin(t * 0.7 + k * 2) * 0.6, z + Math.cos(t * 0.5 + k) * 0.8); m.rotation.set(t * 0.3 + k, t * 0.5, t * 0.2); });
      c.clickable(m, () => { const L = ['The command module. Apollo 11. It is in here because the museum lent it and never asked for it back.', 'The duck floats in the bath. The duck floats here. The duck does not know the difference. Neither do you.', 'An apple from the bodega on Mars. Eight minutes old. Eight minutes is nothing. Eight minutes is a transfer at Jay Street.', 'The cassette player. One tape. The tape is the announcements. The announcements are the music.', 'A hatchet. For the airlock. The airlock is a door. The door is the problem.', 'A bowl. Somebody tried soup.']; c.say(m, L[k], 3200, 0.6); if (k === 1) c.egg('duck', 'The duck. It floated down a sewer once, a long time ago, in another gallery. It has been promoted.'); }, 'A floater'); });
    const drift = (m, x, y, z, k, say, hint, egg) => { c.tick((t) => { m.position.set(x + Math.sin(t * 0.35 + k) * 1.0, y + Math.sin(t * 0.6 + k * 2) * 0.5, z + Math.cos(t * 0.45 + k) * 0.7); m.rotation.set(t * 0.4 + k, t * 0.3, t * 0.25); }); c.clickable(m, () => { c.say(m, say, 3000, 0.4); egg && c.egg(egg[0], egg[1]); }, hint); return m; };
    [[6.4, 1.7, 0.6], [11.2, 2.8, -1.2], [16.8, 2.2, 0.4]].forEach(([x, y, z], k) => drift(bagel(c, g, x, y, z), x, y, z, k + 7, 'A bagel. Everything. It is holding its shape better than the program.', 'A bagel', k === 0 ? ['capsule_bagel', 'An everything bagel in zero G. The seeds left first. They are in the ventilation now. The car smells like Sunday.'] : null));
    [[4.2, 2.6, -0.8], [9.0, 1.5, 1.4], [13.4, 2.2, 0.2]].forEach(([x, y, z], k) => drift(cup(c, g, x, y, z), x, y, z, k + 11, 'Coffee, light and sweet, in a sphere now. Drink it before it finds the electronics.', 'A coffee'));
    { const mc = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.012), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 164, (q, w, h) => { q.fillStyle = '#f5c542'; q.fillRect(0, 0, w, h); q.fillStyle = '#1d4ed8'; q.fillRect(0, h - 40, w, 40); q.fillStyle = '#111'; q.font = '900 44px sans-serif'; q.fillText('N3W CARD', 16, 60); q.font = '700 22px sans-serif'; q.fillText('INSUFFICIENT FARE · EXPIRED IN ORBIT', 16, 100); q.fillStyle = '#f4ead2'; q.font = '700 20px sans-serif'; q.fillText('TRANSFERS: NOWHERE', 16, h - 13); }), roughness: 0.5 })); g.add(mc); drift(mc, 8.0, 2.0, 2.2, 15, 'The card. Insufficient fare. Up here too.', 'A fare card', ['capsule_metrocard', 'The fare card. Expired in orbit. The MTA honours it nowhere, which, from up here, is everywhere.']); }
    drift(prop(c, r, g, X, 'nyb_suitcase_bomb', 12.6, 3.2, { len: 0.7, y: 3.2 }), 12.6, 3.2, 1.6, 19, 'Unattended luggage. It is attending to itself.', 'A suitcase'); drift(prop(c, r, g, X, 'nyb_pelham_wetfloor', 5.2, 3.4, { h: 0.6, y: 3.4 }), 5.2, 3.4, -0.4, 23, 'Caution. The floor is wet. The floor is also up there.', 'A sign');
    // the pilot is a cabbie; the passengers hold the poles
    cast(c, r, g, X, 'cabbie', 18.2, 0, { h: 1.8, ry: -PI / 2, line: 'Fare to orbit is two ninety. Transfers are free. There is nowhere to transfer to.', hint: 'The pilot', egg: 'fare' });
    for (const [x, z, col] of [[4.6, -4.6, 0x2a3a6a], [11.8, 4.6, 0x3a2a4a], [13.6, -4.6, 0x4a3a2a], [8.4, 4.6, 0x2a4a3a]]) { const e = extra(c, g, x, z, { seated: true, col, ry: z < 0 ? 0 : PI, pool: 'seated' }); c.tick((t) => { e.position.y = Math.sin(t * 0.8 + x) * 0.2 + 0.1; }); }
    for (const [x, z, ry] of [[8, -2.4, 0.4], [12, 2.5, PI - 0.5]]) { const e = extra(c, g, x, z, { ry, pool: 'night' }); c.tick((t) => { e.position.y = Math.sin(t * 0.6 + x) * 0.15 + 0.15; }); }
    // the airlock chime, and the doors that close on the beat
    const doors = [c.slab(1.4, 2.2, 0.1, steel, W - 1.1, 1.1, 2.0), c.slab(1.4, 2.2, 0.1, steel, W - 1.1, 1.1, 5.6)]; doors.forEach((d) => g.add(d));
    let ph = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ph += dt; const k = (ph % 9) / 9, open = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.15); doors[0].position.z = 2.0 + (1 - open) * 1.6; doors[1].position.z = 5.6 - (1 - open) * 1.6; if (((ph % 9) | 0) === 5 && !r._chimed) { r._chimed = true; c.sound.ding(); setTimeout(() => c.sound.ding(), 350); } if ((ph % 9) < 1) r._chimed = false; });
    notice(c, g, 'STAND CLEAR OF THE CLOSING "AIRLOCK"', W - 1.1, 2.6, 3.8, -PI / 2, 2.6, 0.3, '#0d0d0d', '#f5c542');
    const ad = c.sign('N3W YORKERS · THE CENSUS IS IN ORBIT · 7,542 COUNTED · NOBODY SOLD TWICE', { w: 6, h: 0.5, bg: '#f4ead2', fg: '#111', font: c.FONT, weight: 800 }); ad.position.set(10, 4.6, D / 2 - 0.16); ad.rotation.y = PI; g.add(ad);
    // the route map on the south wall: every stop the car makes now
    const map = decal(c, 3.0, 1.6, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.09}px ${c.FONT}`; q.fillText('ORBITAL SERVICE · THE N3W LINE', 20, h * 0.12); const stops = ['FLOYD BENNETT', 'ROCKAWAY', 'LOW EARTH', 'THE MOON', 'MARS', 'THE VILLAGE', 'FLUSHING', 'THE HARBOR']; [['#1d4ed8', 0.35], ['#ff4fa3', 0.55], ['#f5c542', 0.75]].forEach(([col, v], i) => { q.strokeStyle = col; q.lineWidth = h * 0.05; q.beginPath(); q.moveTo(w * 0.05, h * v); for (let k = 1; k <= 8; k++) q.lineTo(w * (0.05 + k * 0.11), h * (v + Math.sin(k + i) * 0.06)); q.stroke(); }); q.fillStyle = '#111'; q.font = `700 ${h * 0.055}px ${c.MONO}`; stops.forEach((s2, k) => { q.save(); q.translate(w * (0.08 + k * 0.11), h * 0.9); q.rotate(-0.5); q.fillText(s2, 0, 0); q.restore(); q.fillStyle = '#fff'; q.beginPath(); q.arc(w * (0.05 + (k + 1) * 0.11), h * (0.55 + Math.sin(k + 2) * 0.06), h * 0.03, 0, 7); q.fill(); q.strokeStyle = '#111'; q.lineWidth = 2; q.stroke(); q.fillStyle = '#111'; }); });
    map.position.set(4.0, 4.4, D / 2 - 0.15); map.rotation.y = PI; g.add(map); c.clickable(map, () => c.egg('capsule_map', 'The route map. Eight stops, no transfers, one fare. The last stop is the harbor. Nobody has asked where the first stop is.'), 'The map');
    plaque(c, g, 10, 3.6, D / 2 - 0.13, PI, 'THE SUBWAY CAR WAS "FREE"', 'PROCUREMENT', 2.2);
    prop(c, r, g, X, 'fire_alarm', 0.4, -1.0, { h: 0.3, y: 1.8, ry: PI / 2 });
  },
  // THE MOON. One sixth gravity, footprints that stay, alternate side parking for the lander.
  moon(c, r, g, X, mats) {
    const { THREE } = c;
    const M = { vy: 0, on: false, jumped: false, steps: 0, lastX: 0, lastZ: 0, side: 0, ticketed: 0, win: 0, timer: 90 };
    r.holdLift = true;
    r.onEnter = () => { M.on = true; c.toast('The moon. SPACE jumps. One sixth gravity, the same alternate side parking.', 3800); };
    r.onLeave = () => { M.on = false; c.P.lift = 0; };
    const key = (e) => { if (!M.on || e.repeat || e.code !== 'Space' || c.P.lift > 0.05) return; M.vy = 5.2; c.sound.whoosh && c.sound.whoosh(); };
    addEventListener('keydown', key); const ob = document.getElementById('olliebtn'); if (ob) ob.addEventListener('click', () => { if (M.on) key({ code: 'Space' }); });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; M.vy -= dt * 3.2; c.P.lift += M.vy * dt; if (c.P.lift > 2.4 && !M.jumped) { M.jumped = true; c.egg('jump', 'Two and a half metres straight up. On Earth that is a career. Here it is a Tuesday.'); } if (c.P.lift < 0) { if (M.vy < -1.5) { c.sound.thud && c.sound.thud(0.3); c.shake(0.03); } c.P.lift = 0; M.vy = 0; } });
    // the ground: the room's own floor with a square cut out of the south west, and the dig, a bowl you walk down into
    const PIT = { x: 5.0, z: 6.3, R: 1.6, d: 0.8 }, pitY = (x, z) => { const d = Math.hypot(x - PIT.x, z - PIT.z); return d < PIT.R ? -PIT.d * (1 - (d / PIT.R) ** 2) : 0; };
    r.ground = pitY; const fm = mats.floor;
    g.add(c.slab(W, 0.1, 12.7, fm, W / 2, -0.05, -D / 2 + 6.35)); g.add(c.slab(3.4, 0.1, 3.2, fm, 1.7, -0.05, 6.3)); g.add(c.slab(13.4, 0.1, 3.2, fm, 13.3, -0.05, 6.3)); g.add(c.slab(W, 0.1, 0.1, fm, W / 2, -0.05, 7.95));
    { const geo = new THREE.PlaneGeometry(3.2, 3.2, 28, 28); geo.rotateX(-PI / 2); const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + PIT.x, z = p.getZ(i) + PIT.z; p.setY(i, pitY(x, z) - 0.001); uv.setXY(i, uv.getX(i) * 1.5, uv.getY(i) * 1.5); } geo.computeVertexNormals(); const bowl = new THREE.Mesh(geo, fm); bowl.position.set(PIT.x, 0, PIT.z); g.add(bowl);
      c.clickable(bowl, () => c.egg('moon_pit', 'The dig. The program is looking for water. It found a crate. The crate is from Flushing, 1964. Somebody got here first and left a pole.'), 'The dig'); }
    // footprints that stay: an instanced boot print wherever you step
    const N = 400, fp = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.3).rotateX(-PI / 2), basic(c, 0x707070, { transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), N); fp.count = 0; fp.frustumCulled = false; fp.renderOrder = 1; g.add(fp); const mm = new THREE.Matrix4(), ee = new THREE.Euler();
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || c.P.lift > 0.1) return; const L = local(r, P); if (Math.hypot(L.x - M.lastX, L.z - M.lastZ) > 0.55) { M.lastX = L.x; M.lastZ = L.z; const k = M.steps % N; ee.set(0, c.P.yaw, 0); mm.makeRotationFromEuler(ee); mm.setPosition(L.x + Math.cos(c.P.yaw) * (M.steps % 2 ? 0.16 : -0.16), pitY(L.x, L.z) + 0.012, L.z - Math.sin(c.P.yaw) * (M.steps % 2 ? 0.16 : -0.16)); fp.setMatrixAt(k, mm); fp.count = Math.min(N, fp.count + 1); fp.instanceMatrix.needsUpdate = true; M.steps++; if (M.steps === 40) c.egg('footprints', 'Forty footprints. They stay forever up here. No wind, no sanitation, no super. The first clean floor in the city.'); } });
    // the lander, parked on the wrong side; the sweeper comes every ninety seconds
    const crater = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 40), std(c, 0x6a6a68, { roughness: 1 })); crater.rotation.x = -PI / 2; crater.position.set(10, 0.01, -2.4); g.add(crater);
    const sides = [[5.4, -2.4], [14.6, -2.4]]; const lander = c.glb('nasa_apollo-lunar-module', { len: 3.6, x: sides[0][0], z: sides[0][1], parent: g, ry: 0.4 }); const lpost = c.post(X(sides[0][0]), sides[0][1], 1.8);
    const sweeper = cast(c, r, g, X, 'clerk', -2, 2.4, { h: 1.76, ry: PI / 2, r: 0, line: 'Street cleaning. Nine to ten thirty. Lunar time. You knew.', hint: 'The sweeper' }); sweeper.visible = false;
    const sb = board(c, g, 2.2, 1.2, 256); sb.m.position.set(10, 2.2, -6.2); const drawSB = () => { const { q, W: w2, H: h2 } = sb; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#c81e1e'; q.font = `900 ${h2 * 0.22}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('NO PARKING', w2 / 2, h2 * 0.3); q.fillStyle = '#111'; q.font = `700 ${h2 * 0.13}px ${c.FONT}`; q.fillText(M.side ? 'WEST SIDE OF CRATER' : 'EAST SIDE OF CRATER', w2 / 2, h2 * 0.52); q.fillText(`SWEEPER IN ${Math.ceil(M.timer)} S`, w2 / 2, h2 * 0.72); q.font = `600 ${h2 * 0.1}px ${c.MONO}`; q.fillText('LUNAR DOT', w2 / 2, h2 * 0.9); sb.up(); }; drawSB();
    const move = () => { M.side = 1 - M.side; const [x, z] = sides[M.side]; lander.position.set(x, 0, z); lpost.x = X(x); lpost.z = z; c.sound.whoosh && c.sound.whoosh(); };
    c.clickable(lander, () => { if (M.sweeping) { c.toast('Too late. He is already writing.', 2000); return; } move(); M.moved = (M.moved || 0) + 1; c.toast(`Moved the lander to the ${M.side ? 'east' : 'west'} side. ${Math.ceil(M.timer)} seconds until the sweeper.`, 2600); if (M.moved === 3) c.egg('altside', 'Three moves. Alternate side parking on the moon. The sweeper has never swept. The sweeper only writes.'); }, 'The lander (move it)');
    let sc = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; M.timer -= dt; sc += dt; if (sc > 1) { sc = 0; drawSB(); }
      if (M.timer <= 0 && !M.sweeping) { M.sweeping = true; sweeper.visible = true; sweeper.position.set(-1, 0, sides[M.side][1] + 2.2); }
      if (M.sweeping) { const tx = sides[M.side][0]; sweeper.position.x += (tx - sweeper.position.x) * Math.min(1, dt * 0.8); sweeper.rotation.y = PI / 2; if (Math.abs(sweeper.position.x - tx) < 0.5) { M.sweeping = false; M.timer = 90; M.ticketed++; const tk = decal(c, 0.5, 0.7, (q, w, h) => { q.fillStyle = '#ff8a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.14}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('VIOLATION', w / 2, h * 0.3); q.font = `700 ${h * 0.1}px ${c.MONO}`; q.fillText('$65 · LUNAR', w / 2, h * 0.55); q.fillText(`#${M.ticketed}`, w / 2, h * 0.8); }); tk.position.set(sides[M.side][0] - 1.2 + M.ticketed * 0.1, 1.4, sides[M.side][1] + 1.6); g.add(tk); c.sound.ticket && c.sound.ticket(); c.say(sweeper, 'Sixty five dollars. Lunar.', 2600, 2.0); if (M.ticketed === 2) c.egg('ticket', 'Two tickets on the lander. The program is now in debt to the Department of Transportation of the moon, which is one guy.'); setTimeout(() => { sweeper.visible = false; sweeper.position.x = -2; }, 3000); } } });
    // the meters at both parking spots, never fed
    const meter = (x, z, egg) => { const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); rod(c, o, steelM(c), 0.03, 1.2, 0, 0.6, 0); o.add(c.slab(0.16, 0.3, 0.12, S(c, 'steel', 1, 0x7a7e86), 0, 1.3, 0)); card(c, o, 0, 1.3, 0.065, 0, 0.13, 0.2, '#111', '#ff4a4a', ['EXPIRED']); c.post(X(x), z, 0.2); c.clickable(o, () => { c.sound.click && c.sound.click(); if (egg) c.egg('moon_meter', 'The meter. A quarter buys fifteen minutes, lunar. A lunar minute is a month. The meter has never been fed and has never once said so.'); else c.say(o, 'Expired. Since the Sea of Tranquility was the Sheep Meadow.', 2400, 1.5); }, 'A parking meter'); };
    meter(7.4, -0.6, true); meter(12.6, -0.6, false);
    // the hero: the first thing the city planted up here was a hydrant, in gold
    box(c, g, 1.6, 0.3, 1.6, S(c, 'concrete', 1, 0xb0b0ae), 13.8, 0.15, 3.0); prop(c, r, g, X, 'nyb_hydrant_gold', 13.8, 3.0, { h: 1.9, y: 0.3, r: 1.0, egg: ['The hydrant', 'moon_hydrant', 'The first thing the city planted on the moon was a hydrant. Gold. No water for 240,000 miles. The dogs are on their way.'] });
    label(c, g, 13.8, 0.62, 3.9, 0, ['HYDRANT, GOLD', 'planted day one, no water', '"THE DOGS ARE COMING"']);
    // the street, up here: a payphone, the can, crates, a bench with a plaque, the pole with the flag line
    props(c, r, g, X, [['nyb_payphone', 16.6, 4.8, { h: 2.0, ry: -0.5, r: 0.4, egg: ['The payphone', 'moon_payphone', 'The payphone. Collect calls to Earth, two and a half seconds each way. The quarter is the same quarter.'] }], ['nyb_trash_dsny', 7.8, -0.4, { h: 1.1, r: 0.4 }], ['nyb_apes_crate', 12.4, -5.9, { len: 1.0, ry: 0.4, r: 0.6 }], ['nyb_apes_crate', 13.4, -6.3, { len: 0.8, ry: 1.1, r: 0.5 }],
      ['nyb_unisphere_crate', 5.0, 6.3, { len: 0.8, y: -0.78, ry: 0.5, r: 0 }], ['nyb_gatsby_spade', 4.2, 5.5, { h: 1.0, y: pitY(4.2, 5.5) + 0.0, ry: 0.4, r: 0 }], ['nyb_gatsby_gascan', 6.2, -4.6, { h: 0.4, r: 0.25 }], ['nyb_sw_jerrycan', 6.8, -4.2, { h: 0.5, ry: 0.5, r: 0.3 }],
      ['nyb_unisphere_pole', 2.4, -6.0, { h: 4.0, r: 0.2 }], ['nyb_unisphere_pole', 2.4, 1.0, { h: 4.0, r: 0.2 }], ['nyb_bench_plaque', 12.0, 7.0, { len: 1.8, r: 0.7 }], ['nyb_moon_rock', 16.8, -0.4, { h: 0.6, r: 0.4, hint: 'A moon rock', fn: (cc, m) => cc.say(m, 'A moon rock. From a bakery in Brooklyn Heights. Also a moon rock, now.', 2400, 0.6) }],
      ['boulder_01', 1.8, -7.0, { len: 1.4, r: 0.7, ry: 1 }], ['boulder_01', 18.4, -7.2, { len: 1.8, r: 0.9, ry: 2 }], ['boulder_01', 18.6, 6.9, { len: 1.1, r: 0.6, ry: 3 }], ['boulder_01', 0.9, 7.2, { len: 1.0, r: 0.5, ry: 4 }], ['coast_rocks_02', 15.2, 6.6, { len: 1.4, r: 0.6 }],
      ['boulder_01', 3.5, 4.9, { len: 0.6, ry: 5 }], ['boulder_01', 6.5, 7.6, { len: 0.6, ry: 6 }], ['boulder_01', 3.4, 7.5, { len: 0.5, ry: 7 }], ['nyb_unisphere_cat', 11.4, 7.2, { h: 0.5, ry: -0.4, hint: 'A cat', fn: (cc, m) => cc.say(m, 'The cat came up on the first launch. It has not said why.', 2200, 0.5) }]]);
    pennants(c, g, 2.4, 3.3, -6.0, 2.4, 3.3, 1.0, 14);
    for (const [x, z, s] of [[3, -6, 1.2], [17, -5.5, 1.6], [2.4, 4.4, 0.9], [16.8, 4.8, 1.3], [8, 5.2, 0.8]]) prop(c, r, g, X, 'boulder_01', x, z, { len: s, r: s * 0.5, ry: x });
    prop(c, r, g, X, 'coast_rocks_01', 12.4, 4.2, { len: 1.6, r: 0.7 }); flag(c, g, X, 9.2, 0.6, 'N3W YORKERS · COUNTED HERE');
    for (const [x, z, ry] of [[12.4, 4.6, -PI / 2 - 0.4], [16.2, 6.6, PI + 0.6], [3.0, -0.8, 0.8]]) extra(c, g, x, z, { ry });
    const lro = c.glb('lunar-reconnaissance-orbiter-b', { len: 1.4, x: 10, y: 7.5, z: -2, parent: g, shadow: false }); c.tick((t) => { lro.position.set(10 + Math.sin(t * 0.25) * 8, 7.5, -2 + Math.cos(t * 0.25) * 4); lro.rotation.y = t * 0.4; });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3a6acc, emissive: 0x1a3a88, emissiveIntensity: 0.4, roughness: 0.6 })); earth.position.set(16, 9, -D / 2 - 14); g.add(earth); const cl = new THREE.Mesh(new THREE.SphereGeometry(2.68, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1 })); earth.add(cl); c.tick((t) => { earth.rotation.y = t * 0.05; cl.rotation.y = -t * 0.02; });
    c.clickable(earth, () => c.egg('earth', 'Earth. From here it is blue, quiet and 240,000 miles from the nearest landlord. The best view of New York is this one.'), 'Earth');
    const mrock = c.glb('moon', { len: 1.1, x: 15.6, y: 0.55, z: 1.4, parent: g, shadow: false }); c.post(X(15.6), 1.4, 0.7); c.clickable(mrock, () => c.say(mrock, 'A moon on the moon. Wrapped. The committee did not think it through.', 2600, 1.0), 'A moon');
    notice(c, g, '"TRANQUILITY" · FORMERLY THE SHEEP MEADOW', 3.8, 1.5, -6.4, 0, 2.8, 0.3, '#0d0d0d', '#f5c542');
    card(c, g, 14.0, 3.5, D / 2 - 0.13, PI, 4.0, 0.5, '#f4ead2', '#111', ['SHEEP MEADOW · NO SHEEP · NO MEADOW · NO BALL PLAYING']);
  },
  // MARS, THE BODEGA. Everything answers three seconds late. Light delay.
  mars(c, r, g, X) {
    const { THREE } = c; let answered = 0;
    const late = (m, fn, hint) => c.clickable(m, () => { c.sound.tick && c.sound.tick(); const dots = c.say(m, '...', 3100, 1.6); setTimeout(() => { fn(); answered++; if (answered === 1) c.egg('delay', 'Three seconds. Light delay, Mars to the bodega. The real one is eight minutes. The program trimmed it. Do not ask how.'); }, 3000); }, hint);
    // the bodega: a low room in the south west corner, a counter you walk behind, shelves, an awning, the striped light of a corner store
    const wood = S(c, 'planks', 1, 0x7a4a30), brk = S(c, 'brick', 2, 0x8a4a30), top = S(c, 'steel', 1, 0xb8bcc2), ceil = S(c, 'planks', 2, 0x3a2a20);
    box(c, g, 4.6, 1.0, 0.8, wood, 4.3, 0.5, 3.6); box(c, g, 4.8, 0.06, 0.95, top, 4.3, 1.03, 3.6); c.wall(X(2.0), 3.2, X(6.6), 3.2); c.wall(X(2.0), 4.0, X(6.6), 4.0); c.wall(X(2.0), 3.2, X(2.0), 4.0);
    box(c, g, 7.6, 0.2, 5.5, ceil, 4.0, 3.3, 5.25); box(c, g, 0.24, 3.4, 4.0, brk, 7.8, 1.7, 6.0); c.wall(X(7.8), 4.0, X(7.8), 8);
    const awn = c.canvasTex(256, 64, (q, w, h) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#f4ead2' : '#c81e1e'; q.fillRect(i * w / 8, 0, w / 8, h); } }); awn.wrapS = awn.wrapT = THREE.RepeatWrapping; awn.repeat.set(4, 1);
    const awning = c.slab(5.2, 0.08, 1.4, new THREE.MeshStandardMaterial({ map: awn, roughness: 0.9, side: THREE.DoubleSide }), 4.3, 3.0, 2.2); awning.rotation.x = 0.35; g.add(awning); notice(c, g, 'BODEGA · OPEN 24 SOLS · ATM INSIDE', 4.3, 2.5, 2.6, 0, 4.6, 0.3, '#f5c542', '#111');
    neon(c, g, 1.9, 2.95, 2.62, 6.7, 2.95, 2.62, 0xff4fa3, 0.02); { const l = new THREE.PointLight(0xfff0d0, 7, 8, 1.5); l.position.set(4.2, 3.0, 5.4); g.add(l); } fluor(c, g, 2.4, 3.16, 5.4, 1.4); fluor(c, g, 6.0, 3.16, 5.4, 1.4);
    props(c, r, g, X, [['nyb_big_shelves', 2.6, 7.3, { len: 2.4, r: 0.9 }], ['nyb_big_shelves', 5.6, 7.3, { len: 2.4, r: 0.9 }], ['nyb_splash_shelves', 4.1, 5.7, { len: 2.0, h: 1.1, r: 0.8 }], ['cardboard_box_01', 7.2, 7.2, { len: 0.7, r: 0.4 }], ['cardboard_box_01', 7.2, 7.2, { len: 0.6, y: 0.5, ry: 0.4 }], ['cardboard_box_01', 1.0, 7.3, { len: 0.7, ry: 0.3, r: 0.4 }]]);
    cans(c, g, 3.3, 4.9, 1.1, 5.5, 9, 2); cans(c, g, 2.3, 3.0, 1.06, 3.4, 4, 1); cans(c, g, 1.5, 3.6, 0.0, 7.6, 10, 3); cans(c, g, 4.6, 6.6, 0.0, 7.6, 10, 2);
    const reg = prop(c, r, g, X, 'nyb_register_gold', 2.6, 3.75, { len: 0.55, y: 1.06, ry: PI }); late(reg, () => { c.say(reg, 'Ka ching. Three seconds late. The sale was on Earth.', 2600, 0.7); c.egg('mars_register', 'The register. Gold. It rings three seconds after the sale, so every sale on Mars is already history by the time it is rung.'); }, 'The register');
    const radio = prop(c, r, g, X, 'nyb_heat_radio', 6.0, 3.7, { len: 0.42, y: 1.06, ry: PI + 0.3 }); late(radio, () => c.say(radio, 'The radio gets one station. It is the 7 train announcements, eight minutes late. Still better than the 7 train.', 3200, 0.6), 'The radio');
    const catm = cast(c, r, g, X, 'sw_bodegacat', 4.3, 4.6, { h: 1.0, ry: PI, r: 0.4 }); late(catm, () => c.say(catm, 'Coffee is a dollar. Has been since 1997. Was on Earth. Is on Mars. The dollar is the constant.', 3600, 1.3), 'The bodega cat');
    const jug = prop(c, r, g, X, 'jug_01', 3.8, 3.6, { h: 0.5, y: 1.06 }); late(jug, () => { c.say(jug, 'Coffee. Light and sweet. One dollar. Also one dollar on the way back.', 3000, 0.8); c.egg('coffee', 'A dollar coffee on Mars. The bodega beat NASA, Elon and the MTA to Mars with a Bunn machine and a will.'); }, 'The coffee');
    const ban = prop(c, r, g, X, 'bananas', 4.9, 3.6, { len: 0.6, y: 1.06 }); late(ban, () => c.say(ban, 'Three for a dollar. They were green at launch.', 2600, 0.8), 'Bananas');
    for (const [x, z] of [[2.1, 3.5], [5.5, 3.5], [4.3, 1.1]]) cup(c, g, x, x < 5.1 && z > 3 ? 1.06 : 1.06, z);
    const hcan = props(c, r, g, X, [['nyb_heat_can', 3.4, 5.6, { h: 0.3, y: 1.1 }], ['nyb_heat_can', 4.9, 5.6, { h: 0.3, y: 1.1, ry: 0.5 }], ['nyb_heat_can', 6.4, 3.5, { h: 0.3, y: 1.06, ry: 1.2 }]]); late(hcan[0], () => { c.say(hcan[0], 'Nazar Cola. Nobody sold twice. Everybody drank twice.', 2600, 0.5); c.egg('mars_cans', 'Nazar Cola, the Mars run. The cans came up as ballast. They sold out in a sol. The ballast is now the economy.'); }, 'A can');
    // the front of the store: the fruit stand, the ices, the crates, the sign, the wet floor nobody mopped
    const fruit = prop(c, r, g, X, 'nyb_heat_fruitstand', 3.4, 0.3, { len: 2.0, r: 0.9 }); late(fruit, () => c.say(fruit, 'Mangoes. From a greenhouse in Red Hook. Two dollars. Two dollars on Mars. Red Hook was the hard part.', 3200, 1.2), 'The fruit stand');
    const ices = prop(c, r, g, X, 'nyb_heat_ices', 5.4, 0.9, { len: 1.3, ry: 0.3, r: 0.7 }); late(ices, () => { c.say(ices, 'Cherry. Lemon. Rainbow. The rainbow is the planet.', 2600, 1.0); c.egg('mars_ices', 'Italian ices on Mars. Cherry. The cherry is the only red thing in Gale Crater that is supposed to be.'); }, 'The ices');
    props(c, r, g, X, [['nyb_milkcrate_cyan', 1.9, 0.6, { h: 0.5, r: 0.4 }], ['nyb_milkcrate_pink', 1.9, 0.6, { h: 0.5, y: 0.5, ry: 0.3 }], ['nyb_milkcrate_pink', 7.2, 5.2, { h: 0.5, r: 0.4 }], ['nyb_mcmlow_wetfloor', 6.0, 4.6, { h: 0.7, r: 0.3 }], ['nyb_aframe_sign', 7.6, 0.2, { h: 1.0, ry: -0.6, r: 0.4 }], ['metal_jug', 7.3, 4.6, { h: 0.5, r: 0.3 }], ['hand_truck', 1.6, 6.6, { h: 1.1, ry: 0.5, r: 0.4 }]]);
    for (const [x, z, ry] of [[1.8, 2.5, PI - 0.3], [3.6, 0.3, PI + 0.4], [15.6, -0.8, 0.6]]) extra(c, g, x, z, { ry });
    // the corner outside: the newsstand, the lamp, the hydrant, the can, the phone, the coffee cart that came up as ballast too
    const news = prop(c, r, g, X, 'nyb_itch_newsstand', 19.0, 7.0, { len: 2.2, ry: -PI / 2, r: 1.1 }); late(news, () => { c.say(news, 'Papers. Eight minutes old. Fresh, for papers.', 2400, 1.4); c.egg('mars_newsstand', 'The newsstand. The paper is eight minutes old and the headline is still about the rent. The rent is on Earth. The headline followed it here.'); }, 'The newsstand');
    props(c, r, g, X, [['nyb_coffeecart', 10.8, 7.0, { len: 2.0, ry: PI / 2 + 0.2, r: 1.0 }], ['nyb_lamp_nazar', 11.6, 0.2, { h: 4.4, r: 0.3 }], ['nyb_hydrant_pink', 14.6, 3.2, { h: 0.8, r: 0.3 }], ['nyb_trash_dsny', 9.6, 7.1, { h: 1.1, r: 0.4 }], ['nyb_payphone', 16.2, 7.3, { h: 2.0, r: 0.4 }], ['nyb_utility_bomb', 19.3, -0.6, { h: 1.2, ry: -PI / 2, r: 0.4 }],
      ['Barrel_01', 12.8, 7.2, { h: 0.9, r: 0.4 }], ['nyb_apes_crate', 1.2, -0.6, { len: 0.9, ry: 0.5, r: 0.5 }], ['wooden_crate_01', 18.6, 0.2, { len: 0.8, ry: 0.4, r: 0.5 }]]);
    // the rovers and landers, parked where New York parks: everywhere
    const R = [['nasa_curiosity-rover-simplified', 13.4, -2.6, 'Curiosity', 'Curiosity. Looks for life. Found a bodega. Stopped looking.', { len: 2.6 }], ['nasa_insight-cruise-lander', 16.4, -0.9, 'InSight', 'InSight. Listens for marsquakes. Hears the 7 train. The 7 train is on Earth. Still hears it.', { len: 2.2 }], ['nasa_mars-atmosphere-and-volatile-evolution-maven-b', 10.6, -5.0, 'MAVEN', 'MAVEN. Measures the air leaving. Relatable.', { len: 2.4 }], ['nasa_mars-reconnaissance-orbiter', 17.2, -5.2, 'MRO', 'The orbiter. Took a picture of your apartment from Mars. It was a studio. It is still a studio.', { len: 2.0 }], ['nasa_magellan', 3.0, -5.2, 'Magellan', 'Magellan. Wrong planet. Happens to the best of us. Happens to everyone at Jay Street.', { len: 2.0 }]];
    R.forEach(([name, x, z, nm, line, o]) => { const m = c.glb(name, { ...o, x, z, parent: g, ry: Math.random() * 2 }); c.post(X(x), z, 1.2); late(m, () => c.say(m, line, 3400, 1.4), nm); label(c, g, x, 0.5, z + 1.3, 0, [nm.toUpperCase(), 'parked, Gale Crater', '"THREE SECONDS"']); });
    // the dust, the cast, the eight minute clock
    const dust = []; for (let i = 0; i < 10; i++) dust.push(glow(c, g, Math.random() * W, 0.6 + Math.random(), -6 + Math.random() * 10, 'rgba(255,140,80,.25)', 2.5 + Math.random() * 2)); c.tick((t) => dust.forEach((s, i) => { s.position.x = ((s.position.x + 0.004 * (i + 2)) % W); }));
    cast(c, r, g, X, 'wiseguy', 12.4, 3.4, { h: 1.8, ry: 0.6, r: 0.4 });
    const wg = g.children[g.children.length - 1]; late(wg, () => c.say(wg, 'You from the neighborhood? Everybody here is from the neighborhood. The neighborhood is 140 million miles wide.', 3600, 2.0), 'A regular');
    const clockB = board(c, g, 2.4, 0.8, 256); clockB.m.position.set(14, 3.4, D / 2 - 0.16); clockB.m.rotation.y = PI; let delayT = 480;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; delayT = 480 + Math.sin(t * 0.1) * 60; if (((t * 2) | 0) === (((t - dt) * 2) | 0)) return; const { q, W: w2, H: h2 } = clockB; q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#ff8a4a'; q.font = `800 ${h2 * 0.3}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(`EARTH IS ${Math.round(delayT / 60)} MIN AWAY`, w2 / 2, h2 * 0.42); q.fillStyle = '#f4ead2'; q.font = `600 ${h2 * 0.2}px ${c.MONO}`; q.fillText('WE TRIMMED IT TO 3 SECONDS', w2 / 2, h2 * 0.78); clockB.up(); });
    plaque(c, g, 11.0, 3.4, D / 2 - 0.13, PI, 'THE COFFEE IS STILL A "DOLLAR"', 'THE BODEGA, GALE CRATER', 2.4);
    for (const [x, z] of [[2.0, 6.6], [6.2, 6.6]]) card(c, g, x, 2.6, D / 2 - 0.13, PI, 1.6, 0.7, '#f4ead2', '#c81e1e', ['NAZAR COLA', 'ice cold, three seconds']);
  },
  // THE HUBBLE ROOM. A telescope pointed at a courtyard. One window is doing something wrong.
  hubble(c, r, g, X) {
    const { THREE } = c;
    // the mount, and the telescope you look through
    g.add(c.slab(1.2, 0.9, 1.2, S(c, 'steel', 1, 0x5a5a60), 10, 0.45, 0.4)); c.post(X(10), 0.4, 0.9);
    const hub = c.glb('nasa_hubble-25th-anniversary-model', { h: 2.4, x: 10, y: 1.5, z: 0.4, ry: PI, parent: g, shadow: false }); hub.rotation.x = -0.9;
    c.clickable(hub, () => { c.zoom(true); c.egg('scope', 'Two billion dollars of optics pointed across a courtyard at a kitchen. In New York every telescope is pointed at a kitchen. Press Z to put it down.'); }, 'Hubble (look through it)');
    label(c, g, 10, 0.5, 1.3, 0, ['HUBBLE, 1:12', 'pointed at 3C, the kitchen', '"ASTRONOMY"']); cup(c, g, 10.5, 0.9, 0.9);
    // the live windows: twelve cells of one canvas atlas, redrawn at eight frames a second; one of them is wrong
    const CW = 128, CH = 96, cols = 4, rows = 3, tex = c.canvasTex(CW * cols, CH * rows, () => {}), q = tex.userData.canvas.getContext('2d');
    const wrong = 7; const scenes = ['cooking', 'tv', 'dancing', 'reading', 'plant', 'piano', 'cat', 'wrong', 'laundry', 'party', 'sleeping', 'yoga'];
    const drawCell = (k, t) => { const x0 = (k % cols) * CW, y0 = Math.floor(k / cols) * CH; q.save(); q.beginPath(); q.rect(x0, y0, CW, CH); q.clip(); q.fillStyle = ['#2a1a0a', '#1a1a2a', '#0a1a1a', '#1a0a1a'][k % 4]; q.fillRect(x0, y0, CW, CH); q.fillStyle = 'rgba(255,220,160,.25)'; q.fillRect(x0, y0, CW, CH);
      const s = scenes[k], cx = x0 + CW / 2, cy = y0 + CH / 2; q.fillStyle = '#ffe0a0';
      const fig = (fx, fy, sc, arms) => { q.fillStyle = '#222'; q.fillRect(fx - 7 * sc, fy - 18 * sc, 14 * sc, 36 * sc); q.strokeStyle = '#222'; q.lineWidth = 4 * sc; q.beginPath(); q.moveTo(fx - 6 * sc, fy - 14 * sc); q.lineTo(fx - 18 * sc, fy - 14 * sc - arms * 14 * sc + Math.sin(t * 6) * 4 * sc); q.moveTo(fx + 6 * sc, fy - 14 * sc); q.lineTo(fx + 18 * sc, fy - 14 * sc - arms * 14 * sc + Math.cos(t * 6) * 4 * sc); q.stroke(); eyeFlower(q, fx, fy - 28 * sc, 11 * sc); };
      if (s === 'cooking') { q.fillStyle = '#888'; q.fillRect(cx - 30, cy + 10, 60, 20); fig(cx - 10, cy + 8, 0.8, 0.3); q.fillStyle = 'rgba(255,255,255,.4)'; q.beginPath(); q.arc(cx + 10 + Math.sin(t * 3) * 4, cy - 10 - (t * 20 % 30), 5, 0, 7); q.fill(); }
      else if (s === 'tv') { q.fillStyle = `hsl(${(t * 60) % 360},80%,60%)`; q.fillRect(cx - 24, cy - 16, 48, 30); fig(cx + 30, cy + 10, 0.7, 0); }
      else if (s === 'dancing') { fig(cx - 14 + Math.sin(t * 4) * 8, cy + 6, 0.9, 1); fig(cx + 14 - Math.sin(t * 4) * 8, cy + 6, 0.9, 1); }
      else if (s === 'reading') { fig(cx, cy + 8, 0.8, 0.5); q.fillStyle = '#f4ead2'; q.fillRect(cx - 12, cy - 8, 24, 16); }
      else if (s === 'plant') { q.fillStyle = '#2a7a3a'; for (let i = 0; i < 5; i++) { q.beginPath(); q.ellipse(cx + Math.cos(i) * 16, cy + Math.sin(i * 2) * 10, 14, 6, i, 0, 7); q.fill(); } q.fillStyle = '#a0522d'; q.fillRect(cx - 10, cy + 12, 20, 22); }
      else if (s === 'piano') { q.fillStyle = '#111'; q.fillRect(cx - 34, cy, 68, 24); q.fillStyle = '#fff'; for (let i = 0; i < 9; i++) q.fillRect(cx - 32 + i * 7.5, cy + 2, 6, 20); fig(cx, cy + 4, 0.8, Math.abs(Math.sin(t * 5))); }
      else if (s === 'cat') { q.fillStyle = '#f5c542'; q.beginPath(); q.ellipse(cx, cy + 10, 22, 12, 0, 0, 7); q.fill(); q.beginPath(); q.arc(cx + 18, cy, 9, 0, 7); q.fill(); q.fillStyle = '#111'; q.fillRect(cx + 14, cy - 2, 2, 2); q.fillRect(cx + 20, cy - 2, 2, 2); }
      else if (s === 'wrong') { // the wrong one: somebody wrapping a pigeon in a painting, at this hour
        fig(cx - 12, cy + 8, 0.9, 1); q.fillStyle = INK[(t * 4 | 0) % INK.length]; q.beginPath(); q.ellipse(cx + 20, cy + 6, 14, 9, 0, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(cx + 30, cy, 4, 0, 7); q.fill(); }
      else if (s === 'laundry') { for (let i = 0; i < 4; i++) { q.fillStyle = ['#f5c542', '#ff4fa3', '#22d3ee', '#fff'][i]; q.fillRect(cx - 40 + i * 22, cy - 20 + Math.sin(t * 2 + i) * 4, 14, 22); } q.strokeStyle = '#888'; q.beginPath(); q.moveTo(x0, cy - 22); q.lineTo(x0 + CW, cy - 22); q.stroke(); }
      else if (s === 'party') { for (let i = 0; i < 4; i++) fig(cx - 36 + i * 24, cy + 10, 0.6, Math.abs(Math.sin(t * 3 + i))); q.fillStyle = `hsl(${(t * 200) % 360},90%,60%)`; q.beginPath(); q.arc(cx, y0 + 10, 5, 0, 7); q.fill(); }
      else if (s === 'sleeping') { q.fillStyle = '#334'; q.fillRect(cx - 34, cy + 4, 68, 22); q.fillStyle = '#f4ead2'; q.fillRect(cx - 30, cy + 2, 60, 8); eyeFlower(q, cx + 22, cy + 2, 8); q.fillStyle = '#fff'; q.font = '10px sans-serif'; q.fillText('z', cx + 32, cy - 8 - (t * 6 % 12)); }
      else if (s === 'yoga') { fig(cx, cy + 10, 0.8, 1 + Math.sin(t) * 0.3); }
      q.restore(); };
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * cols * 2.2, 0.45 * rows * 2.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); win.position.set(0.14, 3.6, -2.2); win.rotation.y = PI / 2; g.add(win);
    const win2 = new THREE.Mesh(win.geometry, win.material); win2.position.set(W - 0.14, 3.6, -2.2); win2.rotation.y = -PI / 2; g.add(win2);
    // the brick around them, and the fire escapes
    for (const [x, ry] of [[0.26, PI / 2], [W - 0.26, -PI / 2]]) { const fe = c.glb('ph_modular_fire_escape', { h: 4.6, x: x + (x < 1 ? 0.5 : -0.5), y: 0.9, z: -2.2, ry, parent: g, shadow: false }); }
    let ac = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ac += dt; if (ac < 0.125) return; ac = 0; for (let k = 0; k < cols * rows; k++) drawCell(k, t); tex.needsUpdate = true; });
    // click a window (through the scope or not) to name what it is doing; the wrong one is the egg
    const cells = []; for (let k = 0; k < cols * rows; k++) { for (const [wx, ry, sgn] of [[0.16, PI / 2, 1], [W - 0.16, -PI / 2, -1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); const cx = (k % cols - 1.5) * 1.32, cy = (1 - Math.floor(k / cols)) * 0.99; m.position.set(wx, 3.6 + cy, -2.2 + sgn * cx); m.rotation.y = ry; g.add(m); cells.push(m);
      c.clickable(m, () => { const S = { cooking: 'Cooking. At this hour. Onions.', tv: 'Television. The colours change. The person does not.', dancing: 'Dancing. Two people. One song. No music.', reading: 'Reading. A book. A real one. Report it.', plant: 'A plant. The tenant moved out in 2019. The plant pays the rent now.', piano: 'The piano. Every night. The same four bars. We know the four bars.', cat: 'The cat. It is looking back at the telescope. It has been looking back for a week.', wrong: 'Somebody is wrapping a pigeon in a painting at two in the morning. That one. That is the one.', laundry: 'Laundry, on the line, across the airshaft, in the dark. Hope.', party: 'A party. Four people. The music is the party next door, which is also four people.', sleeping: 'Asleep. The one honest window in the courtyard.', yoga: 'Yoga. Downward something. The something is the ceiling.' }; c.say(m, S[scenes[k]], 3600, 0.6); if (scenes[k] === 'wrong') c.egg('wrong', 'The wrong window. 3C. A New Yorker wrapping a pigeon in a painting at this hour. The telescope has a photo. The photo is a painting now.'); }, 'A window'); } }
    cast(c, r, g, X, 'lensman', 3.4, 4.4, { h: 1.78, ry: 0.8, line: 'I was watching the courtyard before the telescope. The telescope is better. The courtyard is the same.', hint: 'The photographer', egg: 'lensman' });
    prop(c, r, g, X, 'nyb_rear_camera', 4.4, 4.0, { h: 0.5, y: 0.0, hint: 'A camera', fn: (cc, m) => cc.say(m, 'A long lens. For birds. There are no birds.', 2400, 0.6) });
    prop(c, r, g, X, 'wheelchair_01', 2.4, 3.0, { len: 1.1, ry: 0.6, r: 0.5 });
    // the apartment: an alcove in the south east, the daybed, the leg in its cast, the chair by the window, the fan, the binoculars from before the budget
    alcove(c, r, g, X, { side: 's', at: 17.4, w: 2.8, d: 2.1, h: 3.0, mat: S(c, 'plaster', 2, 0x9a8a70), floorMat: S(c, 'planks', 1, 0x7a5a40), light: 0xffd9a8 });
    const bed = prop(c, r, g, X, 'vintage_day_bed', 17.4, 7.4, { len: 1.9, ry: 0, r: 0 }); c.wall(X(16.2), 6.9, X(18.6), 6.9);
    { const bt = c.canvasTex(128, 128, (q2, w, h) => { q2.fillStyle = '#f0ece0'; q2.fillRect(0, 0, w, h); q2.strokeStyle = '#d8d2c0'; q2.lineWidth = 3; for (let i = -h; i < w; i += 14) { q2.beginPath(); q2.moveTo(i, 0); q2.lineTo(i + h, h); q2.stroke(); } q2.fillStyle = '#1d4ed8'; q2.font = '900 20px sans-serif'; q2.fillText('GET WELL', 14, 60); q2.fillText('3C', 44, 90); }); const cast_ = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.62, 16), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.95 })); cast_.position.set(16.9, 0.62, 7.3); cast_.rotation.z = PI / 2; cast_.rotation.y = 0.2; g.add(cast_);
      c.clickable(cast_, () => c.egg('hubble_cast', 'The cast. A broken leg, six weeks, a courtyard and a telescope. The leg is the alibi. Everybody signed it. Nobody from 3C.'), 'The leg'); }
    props(c, r, g, X, [['nyb_rear_armchair', 18.4, 6.5, { len: 0.9, ry: PI + 0.7, r: 0.5 }], ['nyb_rear_fan', 16.4, 6.4, { h: 0.9, ry: 0.6, r: 0.3 }], ['side_table_01', 17.6, 6.3, { h: 0.6, r: 0.3 }], ['binoculars', 17.6, 6.3, { len: 0.22, y: 0.6, ry: 0.5, egg: ['Binoculars', 'hubble_binoculars', 'Binoculars, from before the budget. Same windows. Same wrong one. Two billion dollars confirmed what seven dollars suspected.'] }],
      ['nyb_rear_photo', 17.4, 7.9, { len: 0.8, y: 1.9, ry: PI }], ['nyb_rear_photo', 16.5, 7.9, { len: 0.5, y: 2.5, ry: PI }], ['nyb_walking_aircon', 0.3, -5.3, { len: 0.8, y: 1.9, ry: PI / 2, egg: ['An air conditioner', 'hubble_ac', 'The air conditioner. It has dripped on 2B since 1954. 2B has moved out four times. The drip stays.'] }], ['nyb_birdman_ac', 19.7, -5.3, { len: 0.8, y: 1.9, ry: -PI / 2 }], ['nyb_aircon', 12.6, 7.8, { len: 0.8, y: 3.4, ry: PI }],
      ['nyb_treebrooklyn_fireescape', 2.0, -7.6, { h: 3.2, y: 3.4 }], ['nyb_treebrooklyn_fireescape', 18.0, -7.6, { h: 3.2, y: 3.4 }], ['nyb_pigeons_bench', 6.2, -0.8, { len: 1.8, ry: 0.3, r: 0.8 }], ['nyb_pigeons_planter', 14.0, -1.0, { len: 1.0, r: 0.6 }], ['nyb_kong_scope', 14.8, 1.8, { h: 1.5, ry: -PI / 2, r: 0.4, hint: 'A coin telescope', fn: (cc, m) => cc.say(m, 'A quarter for two minutes. Pointed at 4D. 4D is worth a quarter.', 2400, 1.2) }],
      ['nyb_kong_scope', 5.2, -4.6, { h: 1.5, ry: PI / 2, r: 0.4 }], ['nyb_trash_dsny', 0.8, 7.2, { h: 1.1, r: 0.4 }], ['nyb_lamp_nazar', 1.3, 6.6, { h: 4.4, r: 0.3 }], ['nyb_lamp_nazar', 14.6, 6.9, { h: 4.4, r: 0.3 }], ['planter_box_01', 6.0, 7.2, { len: 1.2, r: 0.5 }], ['planter_box_01', 9.6, 7.2, { len: 1.2, r: 0.5 }],
      ['nyb_pigeons_seed', 7.2, -1.4, { len: 0.3 }], ['nyb_tv_eye', 18.8, 5.0, { len: 0.5, ry: -1.0, r: 0.3 }], ['nyb_walking_radio', 17.0, 6.3, { len: 0.3, y: 0.6, ry: 0.3 }]]);
    cup(c, g, 17.4, 0.6, 6.15); cup(c, g, 6.6, 0.0, -0.2);
    { const e = extra(c, g, 6.2, -0.8, { seated: true, ry: 0.3, pool: 'seated' }); e.position.y = 0.0; } for (const [x, z, ry] of [[7.6, 5.0, -0.8], [13.2, 4.2, 2.4]]) extra(c, g, x, z, { ry, pool: 'night' });
    // the laundry line across the courtyard, somebody's whole week
    { const a = new THREE.Vector3(0.9, 4.8, -3.0), b = new THREE.Vector3(19.1, 4.6, 3.6), L = a.distanceTo(b), line = rod(c, g, mat('string', () => std(c, 0x222222)), 0.01, L, 0, 0, 0, 0, 0, 5); line.position.copy(a).add(b).multiplyScalar(0.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      const st = c.canvasTex(96, 96, (q2, w, h) => { q2.fillStyle = '#ffffff'; q2.beginPath(); q2.moveTo(10, 10); q2.lineTo(86, 10); q2.lineTo(96, 34); q2.lineTo(80, 42); q2.lineTo(80, 92); q2.lineTo(16, 92); q2.lineTo(16, 42); q2.lineTo(0, 34); q2.closePath(); q2.fill(); }), yaw = Math.atan2(b.x - a.x, b.z - a.z) + PI / 2;
      for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, p = a.clone().lerp(b, u); p.y -= 0.34 + Math.sin(u * PI) * 0.3; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: st, color: INK[(i * 2) % INK.length], transparent: true, side: THREE.DoubleSide, roughness: 0.9 })); m.position.copy(p); m.rotation.y = yaw; g.add(m); c.tick((t) => { m.rotation.z = Math.sin(t * 1.4 + i) * 0.1; }); if (i === 4) c.clickable(m, () => c.egg('hubble_laundry', 'The laundry. Across the airshaft, four floors up, somebody dries a whole week in the dark. The telescope counted the socks. Odd.'), 'The laundry'); } }
    // the satellites on their poles: everything else the program could not afford to launch
    [['nasa_chandra-x-ray-observatory-2', 3, -5.2, 2.0], ['nasa_far-ultraviolet-spectroscopic-explorer', 17, -5.2, 1.6], ['nasa_aura-a', 16.4, 4.6, 1.4]].forEach(([n, x, z, len]) => { g.add(c.slab(0.06, 3.2, 0.06, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.6, z)); c.post(X(x), z, 0.3); const m = c.glb(n, { len, x, y: 3.3, z, parent: g, shadow: false }); c.tick((t) => { m.rotation.y = t * 0.2 + x; }); c.clickable(m, () => c.say(m, 'Also pointed at the courtyard.', 2000, 1.2), 'A satellite'); });
    plaque(c, g, 10, 3.0, D / 2 - 0.13, PI, 'EVERY TELESCOPE POINTS AT A "WINDOW"', 'THE HUBBLE ROOM', 2.4);
    card(c, g, 4.6, 3.4, D / 2 - 0.13, PI, 2.6, 0.5, '#f4ead2', '#111', ['COURTYARD RULES · NO LOOKING · EVERYBODY LOOKS']);
  },
  // THE ASTEROID BELT. Whisper into one dish and it comes out of the other; catch what falls from the sky.
  belt(c, r, g, X) {
    const { THREE } = c;
    // the dish platforms: two decks of pavers under the dishes, a step up to each, a rail round the edge
    const pav = S(c, 'pavers', 1.5, 0x9a9aa0), rl = steelM(c);
    const deck = (x0, x1, sx0, sx1) => { const cx = (x0 + x1) / 2; box(c, g, x1 - x0, 0.5, 5.8, pav, cx, 0.25, -3.5); box(c, g, sx1 - sx0, 0.25, 0.8, pav, (sx0 + sx1) / 2, 0.125, -0.2);
      c.wall(X(x0), -0.6, X(sx0), -0.6); c.wall(X(sx1), -0.6, X(x1), -0.6); c.wall(X(x0), -6.4, X(x0), -0.6); c.wall(X(x1), -6.4, X(x1), -0.6);
      for (const x of [x0 + 0.1, sx0, sx1, x1 - 0.1]) rod(c, g, rl, 0.02, 1.0, x, 1.0, -0.55); box(c, g, sx0 - x0, 0.04, 0.04, rl, (x0 + sx0) / 2, 1.5, -0.55); box(c, g, x1 - sx1, 0.04, 0.04, rl, (sx1 + x1) / 2, 1.5, -0.55); };
    deck(0.6, 5.8, 1.8, 4.6); deck(14.2, 19.4, 15.4, 18.2);
    r.ground = (x, z) => { const on = (x0, x1, sx0, sx1) => (x > x0 && x < x1 && z < -0.6 && z > -6.4) ? 0.5 : (x > sx0 && x < sx1 && z >= -0.6 && z < 0.2) ? 0.25 : 0; return on(0.6, 5.8, 1.8, 4.6) || on(14.2, 19.4, 15.4, 18.2); };
    const d1 = c.glb('deep-space-network-34-meter', { h: 4.2, x: 3.2, y: 0.5, z: -3.2, ry: 0.6, parent: g }); c.post(X(3.2), -3.2, 1.6);
    const d2 = c.glb('deep-space-network-70-meter', { h: 5.2, x: 16.8, y: 0.5, z: -3.2, ry: -0.6, parent: g }); c.post(X(16.8), -3.2, 2.0);
    const LINES = ['Can you hear me.', 'The rent is due on the first.', 'I left the stove on in Astoria.', 'Tell my super the ceiling is doing it again.', 'Is anybody out there. Is anybody out there counting.', 'We are 7,542. Nobody sold twice.'];
    let li = 0; const spark = glow(c, g, 0, 0, 0, 'rgba(255,220,120,.9)', 0.8); spark.visible = false;
    const whisper = (from, to) => { const line = LINES[li++ % LINES.length]; c.say(from, `"${line}"`, 2600, 4.4); c.sound.beep && c.sound.beep(); const a = from.position.clone(), b = to.position.clone(); a.y = 3; b.y = 3.6; spark.visible = true; const t0 = performance.now();
      const step = () => { const u = Math.min(1, (performance.now() - t0) / 1800); spark.position.lerpVectors(a, b, u); spark.position.y = 3 + Math.sin(u * PI) * 5; if (u < 1) requestAnimationFrame(step); else { spark.visible = false; c.say(to, `"${line.toUpperCase()}"`, 3200, 5.4); try { const u2 = new SpeechSynthesisUtterance(line); u2.rate = 0.85; u2.pitch = 0.6; speechSynthesis.speak(u2); } catch (e) {} if (li === 3) c.egg('dish', 'Three whispers across the fairground. The dishes talk to Voyager, usually. Tonight they talk to Astoria.'); } }; step(); };
    c.clickable(d1, () => whisper(d1, d2), 'The 34 metre dish (whisper)'); c.clickable(d2, () => whisper(d2, d1), 'The 70 metre dish (whisper)');
    label(c, g, 3.2, 1.1, -0.9, 0, ['THE 34 METRE DISH', 'whispers to the other one', '"SAY SOMETHING"']); label(c, g, 16.8, 1.1, -0.9, 0, ['THE 70 METRE DISH', 'hears Voyager, and Astoria', '"LOUDER"']);
    // what comes out of the sky: asteroids on arcs toward you; click one before it lands
    const rocks = ['asteroid-4179-toutatis', '1999-rq36-asteroid', 'eclipse-2017', 'moon']; const live = []; let caught = 0, missed = 0, nextAt = 4;
    const throwOne = (P) => { const L = local(r, P); const name = rocks[(caught + missed) % rocks.length]; const m = c.glb(name, { len: 0.7 + Math.random() * 0.6, x: 10, y: 12, z: -7, parent: g, shadow: false }); const hit = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })); m.add(hit);
      const o = { m, t: 0, x0: 10, z0: -7, x1: L.x + (Math.random() - 0.5) * 2, z1: L.z + 1.5, done: false }; live.push(o);
      c.clickable(m, () => { if (o.done) return; o.done = true; caught++; c.sound.pop && c.sound.pop(); c.flash(0.15); c.say(m, ['Caught.', 'Got it.', 'Mine.', 'Counted.'][caught % 4], 1200, 1); m.visible = false; if (caught === 3) c.egg('catch', 'Three caught. The Belt sends them and the city catches them. We have been catching things from the sky since the Dodgers.'); }, 'Catch it'); };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; nextAt -= dt; if (nextAt <= 0 && live.filter((o) => !o.done).length < 3) { nextAt = 5 + Math.random() * 4; throwOne(P); }
      for (const o of live) { if (o.done) continue; o.t += dt / 4; const u = o.t; o.m.position.set(o.x0 + (o.x1 - o.x0) * u, 12 * (1 - u) * (1 - u) + 0.4, o.z0 + (o.z1 - o.z0) * u); o.m.rotation.x += dt; o.m.rotation.y += dt * 0.7; if (u >= 1) { o.done = true; missed++; c.sound.thud && c.sound.thud(0.4); c.shake(0.06); setTimeout(() => { o.m.visible = false; }, 4000); if (missed === 1) c.toast('One landed. It is a small crater now. The city will name it after a council member.', 3200); } } });
    // the catch zone, marked in neon on the pavers; the radar that sees them coming; the belt itself, overhead
    neon(c, g, 7, 0.08, -1, 13, 0.08, -1, 0xff4fa3, 0.025); const pk = mat('pinkN', () => basic(c, 0xff4fa3)); for (const [x1, z1, x2, z2] of [[7, 3, 13, 3], [7, -1, 7, 3], [13, -1, 13, 3]]) { const L = Math.hypot(x2 - x1, z2 - z1), m = rod(c, g, pk, 0.025, L, (x1 + x2) / 2, 0.08, (z1 + z2) / 2, x1 === x2 ? PI / 2 : 0, x1 === x2 ? 0 : PI / 2); }
    const zone = notice(c, g, 'CATCH ZONE · STAND HERE · LOOK UP', 10, 0.06, 1.0, 0, 3.0, 0.3, '#0d0d0d', '#ff4fa3'); zone.rotation.x = -PI / 2; c.clickable(zone, () => c.egg('belt_zone', 'The catch zone. Painted by the same crew that paints the bike lanes, which is why it is also a bike lane.'), 'The catch zone');
    const radars = [radar(c, g, X, 6.8, -5.6, 0.5, 1.0, 'DSN FLUSHING · 34 M'), radar(c, g, X, 13.2, -5.6, -0.5, 1.0, 'DSN FLUSHING · 70 M'), radar(c, g, X, 3.5, 6.8, PI, 0.9, 'INBOUND')]; let ra = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ra += dt; if (ra > 0.12) { ra = 0; radars.forEach((b) => b.draw(t)); } });
    c.clickable(radars[2].m, () => c.egg('belt_radar', 'The radar. Four contacts, all inbound, all from Queens. Everything that has ever come at this city came from Queens first.'), 'The radar');
    { const n = 40, geo = new THREE.IcosahedronGeometry(0.32, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.75 + Math.random() * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } geo.computeVertexNormals();
      const im = new THREE.InstancedMesh(geo, std(c, 0x7a7670, { roughness: 1 }), n), M = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(); im.frustumCulled = false; g.add(im);
      const A = []; for (let i = 0; i < n; i++) A.push({ x: 1 + Math.random() * 18, y: 6 + Math.random() * 3.5, z: -7 + Math.random() * 14, s: 0.5 + Math.random() * 1.6, r: Math.random() * 6, w: 0.1 + Math.random() * 0.3 });
      c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; A.forEach((a, i) => { E.set(a.r + t * a.w, t * a.w * 0.7, a.r); Q.setFromEuler(E); V.set(a.x + Math.sin(t * 0.1 + i) * 0.4, a.y + Math.sin(t * 0.3 + i) * 0.3, a.z); SC.setScalar(a.s); M.compose(V, Q, SC); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; }); }
    // the fair: searchlights, the poles with the pennants, the coin telescopes, the life ring for the pond that is not there
    const beamM = new THREE.MeshBasicMaterial({ color: 0xc0d0ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    [[6.1, 7.0, 0], [13.9, 7.0, 1.7]].forEach(([x, z, ph]) => { prop(c, r, g, X, 'nyb_kong_searchlight', x, z, { h: 1.9, ry: x < 10 ? 2.6 : -2.6, r: 0.6, egg: ['A searchlight', 'belt_searchlight', 'The searchlights. They found the first one. Then the second. The third one found them.'] });
      const pv = new THREE.Group(); pv.position.set(x, 1.3, z); g.add(pv); const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.1, 18, 12, 1, true), beamM); m.position.y = 9; pv.add(m); glow(c, g, x, 1.4, z, 'rgba(200,220,255,.9)', 1.1); c.tick((t) => { pv.rotation.z = Math.sin(t * 0.27 + ph) * 0.4 * (x < 10 ? -1 : 1); pv.rotation.x = -0.4 + Math.cos(t * 0.21 + ph) * 0.3; }); });
    for (const x of [3.5, 8.7, 11.3, 16.5]) prop(c, r, g, X, 'nyb_unisphere_pole', x, 7.3, { h: 4.4, r: 0.2 }); pennants(c, g, 3.5, 3.9, 7.3, 8.7, 3.9, 7.3, 10); pennants(c, g, 8.7, 3.9, 7.3, 11.3, 3.9, 7.3, 6); pennants(c, g, 11.3, 3.9, 7.3, 16.5, 3.9, 7.3, 10);
    props(c, r, g, X, [['nyb_kong_scope', 2.6, 0.0, { h: 1.5, y: 0.25, ry: 0.4, r: 0.4, hint: 'A coin telescope', fn: (cc, m) => cc.say(m, 'A quarter. Two minutes. The belt, or the Unisphere, or the parking lot. All three are the fair.', 2600, 1.2) }], ['nyb_kong_scope', 17.0, 0.0, { h: 1.5, y: 0.25, ry: -0.4, r: 0.4 }],
      ['nyb_apes_lifebuoy', 19.72, 1.2, { len: 0.7, y: 1.4, ry: -PI / 2, egg: ['A life ring', 'belt_lifebuoy', 'A life ring, for the fountain. The fountain was drained in 1965. The ring has been on duty since, which is the longest shift in the city.'] }], ['nyb_splash_air', 18.0, 6.9, { h: 1.0, ry: -0.5, r: 0.4 }], ['nyb_trash_dsny', 15.4, 7.2, { h: 1.1, r: 0.4 }], ['nyb_unisphere_bench', 7.2, 4.4, { len: 1.8, ry: PI, r: 0.8 }],
      ['nyb_unisphere_neuralyzer', 10, 7.0, { len: 0.5, y: 0.5, hint: 'A device', fn: (cc, m) => cc.say(m, 'Look here. Not at the sky. You did not see the thing. The thing saw you.', 2600, 0.6) }], ['nyb_utility_bomb', 0.7, 7.2, { h: 1.2, ry: PI / 2, r: 0.5 }], ['nyb_unisphere_crate', 1.0, 0.4, { len: 0.8, y: 0.25, ry: 0.4, r: 0.5 }], ['nyb_legend_radio', 3.4, -5.6, { len: 0.5, y: 0.5, ry: 0.5 }], ['nyb_sw_generator', 18.0, -5.8, { len: 1.3, y: 0.5, ry: -0.6, r: 0.7 }]]);
    box(c, g, 1.2, 0.8, 0.8, S(c, 'concrete', 1, 0x8a8a90), 10, 0.9, 7.0); cup(c, g, 4.2, 0.5, -5.2); cup(c, g, 15.6, 0.5, -5.4);
    for (const [x, z, ry, y] of [[2.4, -5.4, 0.4, 0.5], [15.8, -5.6, -0.3, 0.5], [5.8, 4.8, PI + 0.5, 0], [14.6, 2.6, PI - 0.4, 0]]) { const e = extra(c, g, x, z, { ry }); e.position.y = y; }
    // the rest of the fleet, on poles, and a supernova far off
    [['cubesat-mirata', 6.4, 2.2, 0.8], ['cloudsat-b', 13.6, 2.2, 1.4], ['ice-clouds-and-land-elevation-satellite-2-icesat-2-b', 2.4, 4.6, 1.2], ['gravity-recovery-and-climate-experiment-grace-b', 17.6, 4.6, 1.2], ['nasa_lunar-atmosphere-and-dust-environment-explorer-ladee', 8.0, -3.6, 1.2], ['lunar-laser-communications-demonstration-llcd', 12.2, -6.2, 1.0], ['hinode-solar-b', 7.6, -6.2, 1.2], ['argo', 6.4, -2.4, 1.0]].forEach(([n, x, z, len]) => { g.add(c.slab(0.06, 2.6, 0.06, std(c, 0xd8d8d8, { metalness: 0.9, roughness: 0.3 }), x, 1.3, z)); c.post(X(x), z, 0.4); const m = c.glb(n, n === 'argo' ? { h: 1.2, x, y: 2.7, z, parent: g, shadow: false } : { len, x, y: 2.7, z, parent: g, shadow: false }); c.tick((t) => { m.rotation.y = t * 0.25 + x; }); c.clickable(m, () => c.say(m, 'Launched. Wrapped. Loaned to the fair. Nobody at the fair asked.', 2200, 1.0), 'A satellite'); });
    const nova = c.glb('cassiopeia-a-supernova-c-2025', { len: 9, x: 10, y: 12, z: -D / 2 - 30, parent: g, shadow: false }); c.tick((t) => { nova.rotation.y = t * 0.08; nova.rotation.z = t * 0.03; }); glow(c, g, 10, 12, -D / 2 - 29, 'rgba(120,180,255,.5)', 14);
    const dg = c.glb('dg-tau', { h: 2.2, x: 16.2, y: 4.2, z: 0.6, parent: g, shadow: false }); c.tick((t) => { dg.rotation.y = t * 0.3; dg.position.y = 4.2 + Math.sin(t) * 0.2; }); c.clickable(dg, () => c.say(dg, 'DG Tau. A star being born. Loud about it. Very Queens.', 2600, 1.4), 'A young star');
    flag(c, g, X, 1.4, 1.0, "WORLD'S FAIR · N3W");
    cast(c, r, g, X, 'agent', 14.6, 4.2, { h: 1.85, ry: -0.5, line: 'Look at the dish. Not the sky. The sky is where things come from. The dish is where we say so.', hint: 'The agent' });
    plaque(c, g, 10, 2.8, D / 2 - 0.13, PI, 'WE TALK TO "VOYAGER" AND ASTORIA', 'DEEP SPACE NETWORK, FLUSHING', 2.6);
    card(c, g, 14.0, 3.4, D / 2 - 0.13, PI, 3.0, 0.5, '#0d0d0d', '#22d3ee', ["WORLD'S FAIR · FAR SIDE · ADMISSION: ONE WHISPER"]);
  },
  // SPLASHDOWN. The capsule came down by the ferry; keep pace with the parade and the city throws the paper.
  splash(c, r, g, X, mats) {
    const { THREE } = c;
    // the deck stops at the rail; past it is the harbor, a mirror, and the pier the city built for the capsule
    g.add(c.slab(W, 0.1, 12.8, mats.floor, W / 2, -0.05, 1.6));
    const water = new Reflector(new THREE.PlaneGeometry(W, 3.3), { textureWidth: c.MOBILE ? 512 : 1024, textureHeight: c.MOBILE ? 128 : 256, color: 0x6a8aa0, clipBias: 0.003 }); water.rotation.x = -PI / 2; water.position.set(W / 2, -0.12, -D / 2 + 1.6); g.add(water);
    const rail = std(c, 0xd06a30, { roughness: 0.6 }), RZ = -D / 2 + 3.2; for (const [x0, x1] of [[0, 9.2], [10.8, W]]) { g.add(c.slab(x1 - x0, 0.08, 0.08, rail, (x0 + x1) / 2, 1.0, RZ)); c.wall(X(x0), RZ + 0.1, X(x1), RZ + 0.1); }
    for (let x = 0.5; x < W; x += 1.6) if (Math.abs(x - 10) > 1.2) g.add(c.slab(0.06, 1.0, 0.06, rail, x, 0.5, RZ)); for (const x of [9.2, 10.8]) g.add(c.slab(0.06, 1.0, 0.06, rail, x, 0.5, RZ));
    const plk = S(c, 'planks', 1.5, 0x8a6a48); const pier = box(c, g, 1.6, 0.12, 2.1, plk, 10, -0.02, RZ - 1.0); for (const x of [9.2, 10.8]) { g.add(c.slab(0.06, 1.0, 2.1, std(c, 0xd06a30), x, 0.5, RZ - 1.0)); g.add(c.slab(0.08, 0.08, 2.1, rail, x, 1.0, RZ - 1.0)); c.wall(X(x), RZ - 2.0, X(x), RZ); } g.add(c.slab(1.6, 0.08, 0.08, rail, 10, 1.0, RZ - 2.0)); c.wall(X(9.2), RZ - 2.0, X(10.8), RZ - 2.0);
    c.clickable(pier, () => c.egg('splash_pier', 'The pier. Seven feet of it. The city built seven feet of pier for the capsule and sent the bill to the moon. The moon has not paid.'), 'The pier');
    const cm = c.glb('si_nasm_command-module-apollo-11', { len: 2.4, x: 13.2, y: -0.6, z: -D / 2 + 1.4, parent: g, shadow: false }); c.tick((t) => { cm.position.y = -0.6 + Math.sin(t * 1.1) * 0.15; cm.rotation.z = Math.sin(t * 0.7) * 0.12; cm.rotation.y = t * 0.1; });
    c.clickable(cm, () => c.say(cm, 'Down. Wet. Home. The ferry did not stop. The ferry never stops. That is the ferry.', 3200, 1.6), 'The capsule');
    for (const x of [2.4, 17.6]) prop(c, r, g, X, 'nyb_ferry_lifebuoy', x, RZ + 0.05, { len: 0.7, y: 1.0, hint: 'A life ring', fn: (cc, m) => cc.say(m, 'Wrapped. It still floats. Art floats.', 2000, 0.6) });
    props(c, r, g, X, [['nyb_ontown_buoy', 4.0, -6.6, { h: 1.4, y: -0.3, bob: 1.1 }], ['nyb_stuart_buoy', 16.4, -7.0, { h: 1.2, y: -0.3, bob: 0.9 }], ['nyb_coney_buoy', 7.0, -7.3, { h: 1.3, y: -0.3, bob: 1.3 }], ['nyb_apes_buoy', 1.4, -7.0, { h: 1.2, y: -0.3, bob: 1.0 }]]);
    // the parade: a column of New Yorkers that loops along the deck; keep pace with it and the paper comes down
    const N = 14, col = []; for (let i = 0; i < N; i++) col.push({ o: extra(c, g, 0, 0, { col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a][i % 4] }), u: i / N });
    const paper = confetti(c, g, 500); const PR = { v: 0, pace: 0, done: false, sailor: null };
    const sail = cast(c, r, g, X, 'sailors', 10, 1.4, { h: 1.8, ry: PI / 2, r: 0, line: 'On the town. Twenty four hours. We did it in seven minutes. Catch up.', hint: 'The sailors', egg: 'sailors' });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const sp = 1.3; for (const q of col) { q.u = (q.u + dt * sp / 24) % 1; const x = 1 + q.u * 18, z = 1.4 + Math.sin(q.u * PI * 2) * 0.4; q.o.position.set(x, 0, z); q.o.rotation.y = PI / 2; q.o.userData.body.position.y = 1.0 + Math.abs(Math.sin(t * 7 + q.u * 20)) * 0.06; } sail.position.x = 1 + ((t * sp / 24 + 0.5) % 1) * 18; sail.position.z = 2.6;
      const L = local(r, P); PR.v += ((Math.hypot(c.P.x - (PR.lx ?? c.P.x), 0) / Math.max(dt, 1e-3)) - PR.v) * Math.min(1, dt * 3); PR.lx = c.P.x; const inLane = L.z > 0.2 && L.z < 3.6;
      if (inLane && Math.abs(PR.v - sp) < 0.5 && c.keys && (c.keys.KeyD || c.keys.ArrowRight)) PR.pace += dt; else PR.pace = Math.max(0, PR.pace - dt * 0.5);
      if (PR.pace > 4 && !PR.done) { PR.done = true; paper.burst(L.x, 5, L.z, 10); c.sound.applause && c.sound.applause(); c.egg('parade', 'You kept pace with the parade for four seconds and the city threw the paper. Ticker tape, for a capsule that landed next to a boat. Welcome home.'); setTimeout(() => { window.__finale && window.__finale(); }, 5000); } });
    notice(c, g, 'WALK WITH THE "PARADE" · HOLD D FOR FOUR SECONDS', 10, 0.06, 4.6, 0, 3.6, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    // the ticker tape that never stops: strips of paper down from the windows, all day
    { const n = 220, geo = new THREE.PlaneGeometry(0.05, 0.28), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), n), M = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), col = new THREE.Color(); im.frustumCulled = false; g.add(im);
      const T = []; for (let i = 0; i < n; i++) { T.push({ x: Math.random() * W, y: Math.random() * 9, z: -4 + Math.random() * 10.5, v: 0.5 + Math.random() * 0.5, ph: Math.random() * 6 }); col.set(i % 3 ? '#f4ead2' : INK[i % INK.length]); im.setColorAt(i, col); }
      c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; T.forEach((a, i) => { a.y -= a.v * dt; if (a.y < 0.05) { a.y = 9; a.x = Math.random() * W; } E.set(t * 2 + a.ph, t * 1.5 + a.ph, Math.sin(t + a.ph)); Q.setFromEuler(E); V.set(a.x + Math.sin(t * 1.2 + a.ph) * 0.3, a.y, a.z + Math.cos(t + a.ph) * 0.2); M.compose(V, Q, SC); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; }); }
    // the reviewing stand: a deck of planks over the south wall with a step up, benches from the ferry, the city's dignitaries
    const RS = { x0: 3, x1: 17, z0: 6.2, y: 0.7 }; box(c, g, 14, 0.7, 1.8, plk, 10, 0.35, 7.1); box(c, g, 14, 0.35, 0.6, plk, 10, 0.175, 5.9);
    r.ground = (x, z) => (x > RS.x0 && x < RS.x1) ? (z > RS.z0 ? RS.y : z > 5.6 ? 0.35 : 0) : 0; c.wall(X(RS.x0), 5.6, X(RS.x0), 8); c.wall(X(RS.x1), 5.6, X(RS.x1), 8);
    const rm = std(c, 0xf4ead2, { roughness: 0.7 }); g.add(c.slab(14, 0.05, 0.05, rm, 10, RS.y + 1.0, RS.z0 + 0.1)); for (let x = 3.2; x <= 17; x += 1.15) if (Math.abs(x - 10) > 0.9) rod(c, g, rm, 0.02, 1.0, x, RS.y + 0.5, RS.z0 + 0.1, 0, 0, 6);
    c.wall(X(RS.x0), RS.z0 + 0.1, X(9.1), RS.z0 + 0.1); c.wall(X(10.9), RS.z0 + 0.1, X(RS.x1), RS.z0 + 0.1);
    pennants(c, g, 3, RS.y + 1.0, RS.z0 + 0.1, 17, RS.y + 1.0, RS.z0 + 0.1, 22);
    [[5.2, 0.4], [14.8, -0.4]].forEach(([x, ry]) => prop(c, r, g, X, 'nyb_ferry_bench', x, 7.4, { len: 1.9, y: RS.y, ry: PI + ry, r: 0 })); prop(c, r, g, X, 'nyb_ferry_bench', 10, 7.5, { len: 1.9, y: RS.y, ry: PI, r: 0 });
    [[4.6, 7.4], [10.4, 7.5], [15.2, 7.4]].forEach(([x, z], i) => { const e = extra(c, g, x, z, { seated: true, ry: PI, pool: 'seated', col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a][i] }); e.position.y = RS.y; });
    for (const [x, z, ry] of [[7.4, 6.9, PI + 0.3], [12.6, 6.9, PI - 0.2], [16.2, 6.8, PI + 0.5], [3.8, 6.8, PI - 0.4]]) { const e = extra(c, g, x, z, { ry, pool: 'dressy' }); e.position.y = RS.y; }
    prop(c, r, g, X, 'nyb_ferry_thermos', 10.9, 7.5, { h: 0.3, y: RS.y + 0.45, egg: ['A thermos', 'splash_thermos', 'The thermos. Coffee from the terminal, poured at six, still warm at the parade. The ferry coffee outlasted the mission.'] });
    prop(c, r, g, X, 'nyb_ferry_bag', 6.4, 7.1, { h: 0.5, y: RS.y, ry: 0.4 }); cup(c, g, 5.6, RS.y + 0.45, 7.4); cup(c, g, 14.2, RS.y + 0.45, 7.4);
    // the hero: the ferry that did not stop, at one to forty, on a plinth the Parks Department gave up
    box(c, g, 4.6, 0.5, 1.6, S(c, 'concrete', 1, 0x8a8a90), 10, 0.25, -2.6); prop(c, r, g, X, 'nyb_ontown_ship', 10, -2.6, { len: 4.6, y: 0.5, r: 2.4, egg: ['The ferry', 'splash_ship', 'The ferry, one to forty. It did not stop for the capsule. It does not stop for this either. Orange, free, every half hour, and right.'] });
    label(c, g, 7.2, 0.5, -1.6, 0, ['THE FERRY, 1:40', 'did not stop, will not stop', '"EVERY HALF HOUR"']);
    // the harbor front: lamps with their banners, the water the ferry is on, the jackets, the banner for the whole thing
    props(c, r, g, X, [['nyb_lamp_banner', 4.0, -3.8, { h: 4.6, r: 0.3, egg: ['A lamp banner', 'splash_lamp', 'The banner on the lamp says WELCOME HOME in a face the city bought in 1969 and has used for everything since, including the summons.'] }], ['nyb_lamp_banner', 16.0, -3.8, { h: 4.6, r: 0.3 }], ['nyb_ferry_lifejacket', 0.4, 6.6, { h: 0.6, y: 1.3, ry: PI / 2 }], ['nyb_ferry_lifejacket', 19.6, 6.6, { h: 0.6, y: 1.3, ry: -PI / 2 }],
      ['nyb_dolly_banner', 1.8, 6.6, { h: 2.4, ry: 0.3, r: 0.5 }], ['nyb_splash_buoy', 18.6, -0.6, { h: 1.4, r: 0.5, bob: 1.2 }], ['nyb_trash_dsny', 18.8, 7.2, { h: 1.1, r: 0.4 }], ['nyb_ontown_marker', 1.2, -4.0, { h: 1.2, r: 0.4 }], ['nyb_ontown_crate1', 18.4, -3.6, { len: 0.9, ry: 0.4, r: 0.5 }], ['nyb_ontown_crate2', 18.4, -3.6, { len: 0.7, y: 0.6, ry: 0.9 }],
      ['nyb_ontown_jacket', 1.6, -2.8, { h: 0.9, ry: 0.5, r: 0.3 }], ['nyb_splash_shell', 8.0, -3.6, { len: 0.5, hint: 'A shell', fn: (cc, m) => cc.say(m, 'A shell from the splashdown. The ocean sent a receipt.', 2200, 0.4) }], ['nyb_hydrant_pink', 14.2, 4.6, { h: 0.8, r: 0.3 }]]);
    for (const [x, z, ry] of [[6.2, -4.2, PI], [13.4, -4.2, PI + 0.3], [2.4, -0.4, PI / 2]]) extra(c, g, x, z, { ry, pool: 'walkers' });
    pennants(c, g, 0.4, 4.8, -4.2, 19.6, 4.8, -4.2, 26); pennants(c, g, 0.4, 5.2, 0.2, 19.6, 5.2, 0.2, 26); pennants(c, g, 0.4, 4.6, 4.2, 19.6, 4.6, 4.2, 26);
    // the turnstile home, which does not accept the fare
    const ts = c.glb('mk_turnstile', { h: 1.0, x: 17.6, z: 5.0, ry: PI / 2, parent: g }); c.post(X(17.6), 5.0, 0.5); let swipes = 0; c.clickable(ts, () => { swipes++; c.sound.turnstile && c.sound.turnstile(); c.say(ts, swipes < 4 ? 'INSUFFICIENT FARE' : swipes < 6 ? 'PLEASE SWIPE AGAIN AT THIS TURNSTILE' : 'GO', 1600, 1.2); if (swipes === 6) c.egg('swipe', 'Six swipes. You went to the moon and back and the turnstile still said swipe again. Welcome home.'); }, 'The turnstile');
    const banner = c.sign('WELCOME HOME · N3W YORKERS SPACE PROGRAM · THE LEASE IS UP', { w: 8, h: 0.6, bg: '#1d4ed8', fg: '#f4ead2', font: c.FONT, weight: 900, border: '#f5c542' }); banner.position.set(10, 4.4, D / 2 - 0.16); banner.rotation.y = PI; g.add(banner);
    const gl = c.glb('gull', { len: 0.8, x: 10, y: 3, z: -5, parent: g, shadow: false }); c.tick((t) => { gl.position.set(10 + Math.sin(t * 0.45) * 8, 3 + Math.sin(t) * 0.4, -5 + Math.cos(t * 0.45) * 2); gl.rotation.y = Math.cos(t * 0.45) > 0 ? PI / 2 : -PI / 2; });
    cast(c, r, g, X, 'hustler', 2.6, 5.2, { h: 1.78, ry: 0.7, line: 'You went to space? I got a cousin went to space. Came back. Rent went up anyway.', hint: 'A regular' });
    plaque(c, g, 10, 3.7, D / 2 - 0.13, PI, 'THE FERRY DID NOT "STOP"', 'SPLASHDOWN, THE HARBOR', 2.4);
  },
};

const PROPS = {
  control: [['metal_trash_can', 18.6, 1.0, { h: 0.8, r: 0.4 }], ['power_box_01', 0.4, -2.6, { h: 0.9, y: 1.2, ry: PI / 2 }], ['wall_clock', 10, -D / 2 + 0.3, { len: 0.5, y: 5.6 }], ['metal_trash_can', 1.6, 2.6, { h: 0.7, r: 0.4 }]],
  pad: [['wooden_crate_01', 16.6, -2.6, { len: 0.9, ry: 0.5, r: 0.5 }]],
  capsule: [],
  moon: [['tree_stump_01', 8.4, 7.0, { len: 0.8, r: 0.4, egg: ['A stump', 'stump', 'A tree stump on the moon. Nobody planted a tree. Somebody planted a stump. Union work.'] }]],
  mars: [],
  hubble: [['planter_pot_clay', 15.6, 4.6, { h: 0.5, r: 0.3 }], ['trashbag', 1.6, 7.3, { len: 0.8, r: 0.4 }], ['trashbag', 2.3, 7.5, { len: 0.7, r: 0.4 }]],
  belt: [['modular_street_seating', 12.8, 6.9, { len: 2.6, r: 1.0 }], ['metal_trash_can', 4.6, 5.4, { h: 0.8, r: 0.4 }]],
  splash: [['wooden_barrels_01', 1.4, -1.6, { len: 1.0, r: 0.6 }]],
};
const SLOTS = { capsule: slotsWestFree, splash: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.9, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; }, mars: () => { const S = []; for (let i = 0; i < 4; i++) S.push({ x: 9.6 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; }, pad: () => { const S = []; for (let i = 0; i < 5; i++) S.push({ x: 8.6 + i * 2.4, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); S.push({ x: 18.0, y: 2.3, z: -D / 2 + 0.14, ry: 0, w: 1.4 }); return S; },
  hubble: () => { const S = []; for (let i = 0; i < 6; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, 1.2, 6.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, 1.2].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); S.push({ x: 2.0, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.4 }); return S; } };

let _ROOMS = null;
export function buildRoom(c, r) {
  if (!_ROOMS) _ROOMS = c.ROOMS;
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => { const b = c2.sign(`${r2.lvl} · N3W YORKERS SPACE PROGRAM`, { w: 2.6, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c2.MONO, weight: 700 }); b.position.set(W / 2 + PORTAL.w / 2 + 1.2, 2.6, -D / 2 + 0.14); g.add(b); };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
