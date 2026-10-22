// wing_b.js: four rooms of THE VEEFRIENDS WING of CLOUDS AND DIRT V2. Burn Island, the Gift Goat's room, the flip
// court and the toy aisle. Each takes the room context `c` from main.js like the floors in build.js, and each has one
// trick the browser can do that a building cannot: a crater that pays out, a door that shrinks you, a gym that turns
// over, a claw that is honest. Helpers from build.js are copied here, never imported, so the two files stay separate.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { lava, gold, column } from './fx.js';

const PI = Math.PI;
const PURPLE = 0x5a2fa0, GOLD = 0xf5c542;
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const V3 = (c, x, y, z) => new c.THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

// ---------- helpers copied from build.js ----------
function glowTex(c, col) { return c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, PI * 2); g.fill();
}
const HEAD = {};
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0 } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head; return o;
}
function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line) c.clickable(m, () => { c.say(m, line, 3600, h + 0.3); if (egg) c.egg(egg); }, hint || 'Say hello');
  return m;
}
function plaque(c, g, x, y, z, ry, text, who = 'GARY VAYNERCHUK', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a glow sprite: a torch flame, a bulb halo, a gift's light
function glow(c, col, s = 0.6, blend = true) { const { THREE } = c, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, col), transparent: true, depthWrite: false, blending: blend ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false })); sp.scale.set(s, s, 1); return sp; }
// a niche cut into a false wall inside the room: the opening is on the plane x = face, the niche runs d metres in (+x)
function niche(c, r, g, X, { face, zc, w, d, h, mat, floorMat, light = 0xffd9a8, lightI = 4 }) {
  const { THREE } = c, grp = new THREE.Group(); grp.position.set(face + d / 2, 0, zc); g.add(grp);
  const box = (sx, sy, sz, x, y, z, mm) => { const b = c.slab(sx, sy, sz, mm, x, y, z); grp.add(b); return b; };
  box(d, 0.04, w, 0, 0.02, 0, floorMat || mat); box(d, 0.1, w, 0, h + 0.05, 0, mat);
  box(0.2, h + 0.2, w + 0.4, d / 2 + 0.1, h / 2, 0, mat); box(d, h + 0.2, 0.2, 0, h / 2, -w / 2 - 0.1, mat); box(d, h + 0.2, 0.2, 0, h / 2, w / 2 + 0.1, mat);
  c.wall(X(face + d), zc - w / 2, X(face + d), zc + w / 2); c.wall(X(face), zc - w / 2, X(face + d), zc - w / 2); c.wall(X(face), zc + w / 2, X(face + d), zc + w / 2);
  if (light) { const l = new THREE.PointLight(light, lightI, Math.max(4, d * 2.5), 1.6); l.position.set(0, h - 0.25, 0); grp.add(l); }
  return grp;
}
// a string of coloured bulbs that twinkle, for a toy store or a dock
function fairy(c, g, pts, n, cols = [0xff4040, 0x40ff80, 0xffd040, 0x40a0ff, 0xff60c0]) {
  const { THREE } = c, geo = new THREE.SphereGeometry(0.045, 8, 6), mats = cols.map((k) => basic(c, k)), off = std(c, 0x202020, { roughness: 0.5 }), bulbs = [];
  const wire = std(c, 0x1a3a1a, { roughness: 0.8 });
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s], b = pts[s + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 5), wire);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()); g.add(m);
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, bm = new THREE.Mesh(geo, mats[(s * n + i) % mats.length]); bm.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 0.06 - Math.sin(u * PI) * 0.12, a[2] + (b[2] - a[2]) * u); g.add(bm); bulbs.push({ bm, on: bm.material, ph: Math.random() * 7 }); }
  }
  return (t) => bulbs.forEach((b) => { b.bm.material = Math.sin(t * 2.2 + b.ph) > -0.6 ? b.on : off; });
}

// ---------- the four rooms ----------
export const ROOMS_B = {
  // BURN ISLAND. Black sand, a dock, a crater at the foot of the volcano. Throw a Book Games token in and the island pays.
  burn(c, r, g, X) {
    const { THREE } = c;
    const rock = c.surf('rock', 1.6, 0x4a4042), basalt = c.surf('rock', 1, 0x26222a), planks = c.surf('planks', 1.4, 0x5a4634), oldwood = c.surf('oldwood', 1, 0x4a3828), wet = c.surf('sand', 2, 0x1a1618);
    // the cliffs: an outdoor room gets brick from the engine, so black rock stands in front of it on three sides
    const cliff = (w, h, d, x, y, z) => g.add(c.slab(w, h, d, rock, x, y, z));
    cliff(0.5, 10, 10, 0.5, 5, -3); cliff(0.5, 10, 2.4, 0.5, 5, 6.8); cliff(0.5, 3.2, 3.6, 0.5, 8.4, 3.8);
    cliff(0.5, 10, 10, 19.3, 5, -3); cliff(0.5, 10, 2.4, 19.3, 5, 6.8); cliff(0.5, 3.2, 3.6, 19.3, 8.4, 3.8);
    cliff(20, 10, 0.3, 10, 5, 7.77);
    c.wall(X(0.75), -8, X(0.75), 2); c.wall(X(0.75), 5.6, X(0.75), 8); c.wall(X(19.05), -8, X(19.05), 2); c.wall(X(19.05), 5.6, X(19.05), 8); c.wall(X(0), 7.6, X(20), 7.6);
    const rockG = new THREE.DodecahedronGeometry(1, 0);
    for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(rockG, rock); const s = rnd(0.5, 1.3); m.scale.set(s * rnd(1, 1.8), s, s * rnd(1, 1.6)); m.position.set(k < 7 ? 0.6 : 19.2, 9.6 + rnd(0, 0.6), -7 + (k % 7) * 2.3 + rnd(-0.4, 0.4)); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(m); }
    // the tide line: a wet strip of sand and a shore of foam before the crater
    const tide = c.slab(20, 0.02, 2.4, wet, 10, 0.005, -5.4); g.add(tide);
    const foam = decal(c, 20, 0.5, (q, w, h) => { q.fillStyle = 'rgba(255,255,255,0)'; q.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(230,236,240,${rnd(0.1, 0.6)})`; q.beginPath(); q.arc(rnd(0, w), h / 2 + Math.sin(rnd(0, 7)) * h * 0.3, rnd(1, 5), 0, 7); q.fill(); } }, 64); foam.rotation.x = -PI / 2; foam.position.set(10, 0.02, -4.2); g.add(foam);
    for (let k = 0; k < 3; k++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, rnd(1.6, 2.6), 9), oldwood); log.rotation.z = PI / 2; log.rotation.y = rnd(0, 3); log.position.set([6.2, 14.4, 4.2][k], 0.14, [1.8, 1.4, -2.2][k]); g.add(log); c.post(X(log.position.x), log.position.z, 0.5); }
    // the dock: planks on posts, north toward the picture, a step above the sand
    const DZ0 = 5.6, DZ1 = -5.8, DY = 0.32;
    for (let z = DZ0; z > DZ1; z -= 0.42) { const p = c.slab(2.4, 0.06, 0.36, planks, 10, DY, z - 0.18); p.rotation.y = rnd(-0.012, 0.012); p.rotation.z = rnd(-0.01, 0.01); g.add(p); }
    for (const dx of [-1.0, 0, 1.0]) g.add(c.slab(0.12, 0.12, DZ0 - DZ1, oldwood, 10 + dx, DY - 0.09, (DZ0 + DZ1) / 2));
    for (let z = DZ0 - 0.3; z > DZ1; z -= 1.9) for (const dx of [-1.1, 1.1]) g.add(c.slab(0.14, 0.9, 0.14, oldwood, 10 + dx, 0.25, z));
    for (const z of [DZ0 - 0.3, DZ0 - 0.3 - 3.8, DZ1 + 0.4]) for (const dx of [-1.1, 1.1]) { g.add(c.slab(0.16, 0.9, 0.16, oldwood, 10 + dx, DY + 0.45, z)); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), oldwood); cap.position.set(10 + dx, DY + 0.92, z); g.add(cap); }
    r.ground = (x, z) => (Math.abs(x - 10) < 1.25 && z < DZ0 + 0.1 && z > DZ1 - 0.1 ? DY : 0);
    // torches with a flame sprite each, three of them carrying a real light
    const flameM = new THREE.SpriteMaterial({ map: glowTex(c, '#ff7a1a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb060, toneMapped: false }), flames = [], wrap = c.surf('leather', 1, 0x3a2418);
    const torch = (x, z, h = 2.2, light = false) => {
      const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.z = rnd(-0.05, 0.05); g.add(t);
      t.add(c.slab(0.08, h, 0.08, oldwood, 0, h / 2, 0)); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.3, 10), wrap); head.position.y = h; t.add(head);
      const s = new THREE.Sprite(flameM); s.position.y = h + 0.32; s.scale.set(0.6, 0.9, 1); t.add(s); flames.push({ s, ph: Math.random() * 7 });
      if (light) { const l = new THREE.PointLight(0xff8a30, 5, 7, 1.6); l.position.y = h + 0.3; t.add(l); }
      c.post(X(x), z, 0.16); return t;
    };
    [[8.3, 4.6, true], [11.7, 4.6], [8.3, 0.6], [11.7, 0.6, true], [8.3, -3.4], [11.7, -3.4, true], [15.0, -0.4], [6.2, 6.6], [13.3, 6.2], [6.6, -4.6]].forEach(([x, z, l]) => torch(x, z, 2.2, !!l));
    // the basalt: hexagonal columns in a loose grid you walk between; the tallest carries the plaque
    const hexG = new THREE.CylinderGeometry(1, 1, 1, 6);
    const COLS = [[14.2, -6.2, 3.2], [15.9, -6.3, 2.6], [17.6, -6.1, 3.6], [18.6, -5.4, 2.2], [14.6, -4.5, 1.6], [16.3, -4.6, 0.5], [18.0, -4.4, 2.9], [14.0, -2.8, 2.4], [15.7, -2.9, 0.4], [17.4, -2.7, 1.2], [18.6, -2.4, 3.4], [14.8, -1.1, 0.7], [16.6, -1.2, 2.0], [18.4, -0.9, 0.9], [13.2, -5.0, 1.0], [12.9, -1.9, 0.6]];
    COLS.forEach(([x, z, h]) => { const m = new THREE.Mesh(hexG, basalt); m.scale.set(0.48, h, 0.48); m.position.set(x, h / 2, z); m.rotation.y = rnd(0, PI); g.add(m); c.post(X(x), z, 0.52); });
    const facts = c.sign('BOOK GAMES\nLAUNCHED JANUARY 10, 2022\n125,000 BURNABLE TOKENS\nTWELVE COPIES OF TWELVE AND A HALF EARNED ONE\nBURNED HERE FOR SERIES 2 CHARACTERS\nAND THE ERUPTIONS THAT FOLLOWED', { w: 1.5, h: 1.1, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 700, px: 300, pad: 0.1, border: '#5a2fa0' });
    facts.position.set(17.6, 1.9, -5.55); g.add(facts);
    c.clickable(facts, () => c.egg('burn_basalt', 'The basalt nook. Twelve books for one token, one token for one shot at the crater. The maths of Book Games was always the maths of a bookstore with a volcano.'), 'The plaque in the basalt');
    const lan = new THREE.PointLight(0xffc070, 3, 6, 1.6); lan.position.set(16.3, 0.9, -4.6); g.add(lan);
    // the lava pit, south west: a plane of the Lava spectacular behind a rim of basalt, and a wall so you cannot step in
    const lavaM = lava(c);
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.9), lavaM); pit.rotation.x = -PI / 2; pit.position.set(2.9, 0.02, 6.8); g.add(pit);
    for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(hexG, basalt); m.scale.set(0.3, rnd(0.25, 0.5), 0.3); m.position.set(1.0 + k * 0.64, m.scale.y / 2, 5.78); m.rotation.y = rnd(0, 3); g.add(m); }
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(hexG, basalt); m.scale.set(0.3, rnd(0.25, 0.5), 0.3); m.position.set(5.0, m.scale.y / 2, 6.3 + k * 0.62); m.rotation.y = rnd(0, 3); g.add(m); }
    c.wall(X(0.6), 5.65, X(5.15), 5.65); c.wall(X(5.15), 5.65, X(5.15), 8);
    const pitL = new THREE.PointLight(0xff5a10, 8, 9, 1.4); pitL.position.set(2.9, 1.0, 6.8); g.add(pitL);
    const heat = []; for (let i = 0; i < 6; i++) { const s = glow(c, '#ff6a20', 0.5); g.add(s); heat.push({ s, k: i / 6 }); }
    const pitSign = c.sign('THE PIT TAKES TOKENS TOO. IT GIVES NOTHING BACK.', { w: 2.2, h: 0.22, bg: '#111', fg: '#ff7a1a', font: c.MONO, weight: 700 }); pitSign.position.set(5.3, 1.1, 5.4); pitSign.rotation.y = -0.8; g.add(pitSign);
    // the crater mouth: a ring of basalt around a disc of lava where the plate begins
    const CX = 10, CZ = -7.5, CR = 1.5;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(CR, 0.3, 10, 40), basalt); ring.rotation.x = PI / 2; ring.position.set(CX, 0.28, CZ); g.add(ring);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(CR - 0.1, 40), lavaM); mouth.rotation.x = -PI / 2; mouth.position.set(CX, 0.12, CZ); g.add(mouth);
    c.post(X(CX), CZ, CR + 0.15);
    const crL = new THREE.PointLight(0xff6a20, 10, 12, 1.4); crL.position.set(CX, 1.2, CZ); g.add(crL);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); beam.position.set(CX, 4.5, CZ); g.add(beam);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 24), basalt); plinth.position.set(CX, -3, CZ); g.add(plinth);
    // the burn reward: three of the cast wait under the crater, one rises per eruption
    const VF = ['panda', 'elephant', 'gorilla', 'goat', 'blackcat', 'bee', 'ant', 'alien', 'ape', 'pig', 'eagle', 'panther', 'worm'].sort(() => Math.random() - 0.5).slice(0, 3);
    const NAMES = { panda: 'Patient Panda', elephant: 'Empathy Elephant', gorilla: 'Gratitude Gorilla', goat: 'Gift Goat', blackcat: 'the Very Very Very Very Lucky Black Cat', bee: 'Gary Bee', ant: 'Accountable Ant', alien: 'Adaptable Alien', ape: 'Alert Ape', pig: 'Patient Pig', eagle: 'Eager Eagle', panther: 'Podcast Panther', worm: 'Tough To Beat A Worm From The Dirt' };
    const rewards = VF.map((nm) => { const m = c.glb('vf_' + nm, { h: 1.9, x: CX, y: -3, z: CZ, parent: g, shadow: false }); m.visible = false; m.userData.nm = NAMES[nm]; return m; });
    const emberN = 320, ePos = new Float32Array(emberN * 3), eVel = new Float32Array(emberN * 3), eLife = new Float32Array(emberN);
    const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ map: glowTex(c, '#ff6a20'), color: 0xffb060, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); embers.frustumCulled = false; embers.visible = false; g.add(embers);
    let erupt = 0, eruptT = -99, rewardK = -1, reward = null, alive = 0;
    const doErupt = () => {
      erupt++; eruptT = c.TIME.t; c.sound.roar(0.7); c.sound.boom(0.6); c.flash(0.6);
      for (let i = 0; i < emberN; i++) { ePos[i * 3] = CX + rnd(-0.6, 0.6); ePos[i * 3 + 1] = 0.3; ePos[i * 3 + 2] = CZ + rnd(-0.6, 0.6); eVel[i * 3] = rnd(-2.5, 2.5); eVel[i * 3 + 1] = rnd(4, 11); eVel[i * 3 + 2] = rnd(-2.5, 2.5); eLife[i] = rnd(1.2, 3.2); }
      alive = emberN; embers.visible = true;
      if (reward) reward.visible = false; rewardK = (rewardK + 1) % rewards.length; reward = rewards[rewardK]; reward.visible = true; reward.position.y = -3; plinth.position.y = -3;
      c.toast(`ERUPTION. ${reward.userData.nm} comes out of the crater. That is the burn reward.`, 3400);
      if (erupt === 1) c.egg('burn_erupt', 'The island erupted. One token in the crater and a friend climbs out. Book Games was a bookstore that paid in characters, and this is the till.');
      if (erupt === 3) c.egg('burn_third', 'Three eruptions. Series 2 came out of burns like these, 55,555 tokens in April 2022. You have now personally caused a supply event.');
    };
    // the crate of tokens: click to take one, then click anywhere to throw it where you are looking
    const coinG = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), goldM = gold(c);
    const crate = new THREE.Group(); crate.position.set(12.9, 0, 4.4); g.add(crate);
    crate.add(c.slab(0.8, 0.5, 0.6, oldwood, 0, 0.25, 0)); for (const dz of [-0.31, 0.31]) crate.add(c.slab(0.84, 0.06, 0.04, planks, 0, 0.4, dz));
    for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(coinG, goldM); m.position.set(rnd(-0.28, 0.28), 0.52 + (k % 4) * 0.03, rnd(-0.18, 0.18)); m.rotation.set(rnd(-0.4, 0.4), rnd(0, 6), rnd(-0.3, 0.3)); crate.add(m); }
    c.post(X(12.9), 4.4, 0.55);
    const crateSign = c.sign('BOOK GAMES TOKENS\nTAKE ONE. THROW IT IN THE CRATER.', { w: 1.3, h: 0.4, bg: '#5a2fa0', fg: '#f5c542', font: c.MONO, weight: 800, px: 120 }); crateSign.position.set(13.6, 1.3, 4.2); crateSign.rotation.y = -0.5; g.add(crateSign);
    g.add(c.slab(0.05, 1.2, 0.05, oldwood, 13.6, 0.6, 4.25));
    const post2 = c.sign('BURN ISLAND', { w: 1.4, h: 0.32, bg: '#111', fg: '#ff7a1a', font: c.SERIF, weight: 900, glow: 12 }); post2.position.set(7.2, 1.5, 5.0); post2.rotation.y = 0.4; g.add(post2); g.add(c.slab(0.06, 1.5, 0.06, oldwood, 7.2, 0.75, 5.05)); c.post(X(7.2), 5.05, 0.15);
    const hand = new THREE.Mesh(coinG, goldM); hand.visible = false; g.add(hand);
    const catcher = new THREE.Mesh(new THREE.BoxGeometry(W, 12, D), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); catcher.position.set(W / 2, 5, 0); catcher.visible = false; g.add(catcher);
    let held = false, thrown = 0; const tokens = [], fw = new THREE.Vector3(), rt = new THREE.Vector3();
    const throwToken = () => {
      if (!held) return; held = false; hand.visible = false; catcher.visible = false;
      const P = c.P, b = new THREE.Mesh(coinG, goldM); c.camera.getWorldDirection(fw);
      b.position.set(P.x - r.x0 + fw.x * 0.6, c.camera.position.y + fw.y * 0.6 - 0.1, P.z + fw.z * 0.6); g.add(b);
      const sp = 11; tokens.push({ b, v: new THREE.Vector3(fw.x * sp, fw.y * sp + 3.0, fw.z * sp), t: 0, done: false }); thrown++; c.sound.whoosh(0.15, 0.5);
      if (thrown === 1) c.toast('In the air. Twelve copies of the book bought one of these. The crater is at the end of the dock.', 3000);
    };
    const takeToken = () => { if (held) return throwToken(); held = true; hand.visible = true; catcher.visible = true; c.sound.clink(2400); c.toast('Token in hand. Click anywhere to throw it where you are looking.', 2600); };
    c.clickable(crate, takeToken, 'A crate of Book Games tokens'); c.clickable(catcher, throwToken, 'Throw the token where you are looking');
    const MISS = ['Short. The sand keeps it.', 'Wide. Black sand, gold coin, no eruption.', 'Off the dock. It is a token, not a boomerang.', 'Nearly. The crater is three metres wide and you still missed it.'];
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (held) { held = false; hand.visible = false; catcher.visible = false; } return; }
      flames.forEach((f) => { f.s.scale.set(0.5 + Math.sin(t * 9 + f.ph) * 0.08, 0.8 + Math.sin(t * 13 + f.ph) * 0.15, 1); });
      heat.forEach((p) => { const u = (t * 0.35 + p.k) % 1; p.s.position.set(2.9 + Math.sin(u * 7 + p.k * 9) * 1.4, 0.2 + u * 2.4, 6.8 + Math.cos(u * 5 + p.k * 4) * 0.6); p.s.material.opacity = (1 - u) * 0.5; });
      if (held) { c.camera.getWorldDirection(fw); rt.set(fw.z, 0, -fw.x).normalize(); hand.position.set(c.camera.position.x - r.x0 + fw.x * 0.5 + rt.x * 0.2, c.camera.position.y + fw.y * 0.5 - 0.14, c.camera.position.z + fw.z * 0.5 + rt.z * 0.2); hand.rotation.set(t * 3, 0, 0); }
      for (const o of tokens) {
        if (o.done) continue; o.t += dt; o.v.y -= 9.8 * dt; o.b.position.addScaledVector(o.v, dt); o.b.rotation.x += dt * 14; const p = o.b.position;
        const gh = r.ground(p.x, p.z), inCrater = Math.hypot(p.x - CX, p.z - CZ) < CR, inPit = p.x > 0.9 && p.x < 4.9 && p.z > 5.85 && p.z < 7.8;
        if (p.y < gh + 0.05 || p.z < -8.6 || o.t > 7) {
          o.done = true;
          if (inCrater) { g.remove(o.b); doErupt(); }
          else if (inPit) { g.remove(o.b); c.sound.tick(); c.sound.drip(); c.egg('burn_sizzle', 'That is the wrong fire. The pit takes tokens too, it just gives nothing back. Burn Island only pays at the crater.'); }
          else if (p.z < -8.6) { g.remove(o.b); c.toast('Over the crater and into the night. Gone.', 1800); }
          else { p.y = gh + 0.02; o.b.rotation.set(PI / 2, rnd(0, 6), 0); c.sound.clink(2000); c.toast(MISS[thrown % MISS.length], 1800); setTimeout(() => g.remove(o.b), 9000); }
        }
      }
      const e = t - eruptT;
      if (e < 1.3) c.shake(0.22 * (1 - e / 1.3));
      lavaM.emissiveIntensity = 1.8 + Math.max(0, 3.4 * (1 - e / 6));
      beam.material.opacity = e < 4.5 ? 0.38 * Math.sin(Math.min(1, e / 4.5) * PI) : 0; beam.rotation.y = t * 0.4;
      if (reward) { const u = ease(Math.min(1, Math.max(0, (e - 0.4) / 3))); reward.position.y = -3 + 3.6 * u; plinth.position.y = reward.position.y - 0.15; reward.rotation.y = e * 0.5; }
      if (alive) { alive = 0; for (let i = 0; i < emberN; i++) { if (eLife[i] <= 0) continue; eLife[i] -= dt; eVel[i * 3 + 1] -= 6 * dt; ePos[i * 3] += eVel[i * 3] * dt; ePos[i * 3 + 1] += eVel[i * 3 + 1] * dt; ePos[i * 3 + 2] += eVel[i * 3 + 2] * dt; if (ePos[i * 3 + 1] < 0.05) { ePos[i * 3 + 1] = 0.05; eVel[i * 3 + 1] *= -0.3; } if (eLife[i] > 0) alive++; } eGeo.attributes.position.needsUpdate = true; if (!alive) embers.visible = false; }
    });
    // two islanders on the sand, flower headed, warming their hands
    extra(c, g, 4.6, 3.2, { col: 0x5a2fa0, ry: 2.4 }); extra(c, g, 15.6, 2.6, { col: 0xf5c542, ry: -2.2 }); c.post(X(4.6), 3.2, 0.3); c.post(X(15.6), 2.6, 0.3);
    plaque(c, g, 0.8, 2.2, -0.6, PI / 2, 'Burn it and see what comes out.', 'BURN ISLAND, 2022', 1.4);
  },

  // THE GIFT GOAT'S ROOM. Velvet, parquet, a wall of presents, and three doors on the east wall that get smaller.
  // The smallest is Access, three hundred of them, and it shrinks you to fit the table set for two.
  goat(c, r, g, X) {
    const { THREE } = c;
    const velvet = c.surf('velvet', 1.2, PURPLE), velvetD = c.surf('velvet', 1.2, 0x3a1a6a), oak = c.surf('oldwood', 1, 0x6a4a30), goldM = gold(c), parq = c.surf('parquet', 1.2, 0xb89868), red = std(c, 0xc0202a, { roughness: 0.5 });
    // the wall of presents: two layers of wrapped boxes, three papers, instanced
    const paper = (base, ribbon) => c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = base; q.fillRect(0, 0, w, h); q.globalAlpha = 0.14; q.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { q.beginPath(); q.arc(rnd(0, w), rnd(0, h), 5, 0, 7); q.fill(); } q.globalAlpha = 1; q.fillStyle = ribbon; q.fillRect(w * 0.43, 0, w * 0.14, h); q.fillRect(0, h * 0.43, w, h * 0.14); });
    const papers = [paper('#5a2fa0', '#f5c542'), paper('#f5c542', '#5a2fa0'), paper('#f4ead2', '#ff4fa3')].map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }));
    const boxGeo = new THREE.BoxGeometry(1, 1, 1), byK = [[], [], []];
    for (let layer = 0; layer < 2; layer++) {
      const zc = layer ? 7.66 : 7.28; let x = 0.5;
      while (x < 19.3) { const w = rnd(0.36, 0.68); if (!layer && x > 15.3) break; let y = 0; while (y < 5.9) { const h = rnd(0.3, 0.62); if (y + h > 5.95) break; byK[(Math.random() * 3) | 0].push([x + w / 2, y + h / 2, zc, w, h, 0.38]); y += h + 0.02; } x += w + 0.03; }
    }
    const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), M = new THREE.Matrix4();
    byK.forEach((arr, k) => { const im = new THREE.InstancedMesh(boxGeo, papers[k], arr.length); arr.forEach((b, i) => { _p.set(b[0], b[1], b[2]); _q.setFromEuler(_e.set(0, rnd(-0.05, 0.05), 0)); _s.set(b[3], b[4], b[5]); M.compose(_p, _q, _s); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; g.add(im); });
    c.wall(X(0.4), 7.05, X(15.3), 7.05); c.wall(X(15.3), 7.05, X(15.3), 7.45); c.wall(X(15.3), 7.45, X(19.6), 7.45);
    // ten presents on the floor in front of the wall that open: a lid on a hinge, a bow, a light inside, a line
    const GIFTS = ['A print. Signed, numbered, in the post by Friday.', 'A phone call. One on one, no agenda but yours.', 'Dinner. He picks the place, you pick the subject.', 'Tennis. He will not let you win.', 'A garage sale morning. Six a.m., a thermos, other people\'s stuff.', 'A card you did not know you wanted until it came.', 'Dinner again. The second one is where the real talk happens.', 'A call at the worst possible time that turns out to be the right one.', 'Tennis, doubles. You are on his side this time.', 'A garage sale with a trunk full by nine and a story for every item.'];
    const opened = new Set();
    for (let k = 0; k < 10; k++) {
      const x = 1.3 + k * 1.5, z = 6.6, s = rnd(0.46, 0.68), h = s * rnd(0.7, 1.0), mat = papers[k % 3], gb = new THREE.Group(); gb.position.set(x, 0, z); gb.rotation.y = rnd(-0.3, 0.3); g.add(gb);
      gb.add(c.slab(s, h, s, mat, 0, h / 2, 0));
      const hinge = new THREE.Group(); hinge.position.set(0, h, s / 2); gb.add(hinge); hinge.add(c.slab(s + 0.04, 0.1, s + 0.04, mat, 0, 0.05, -s / 2));
      const bow = new THREE.Group(); bow.position.set(0, 0.1, -s / 2); hinge.add(bow);
      for (const rz of [0.6, -0.6]) { const loop = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), red); loop.rotation.set(PI / 2, 0, rz); loop.position.set(Math.sin(rz) * 0.08, 0.05, 0); bow.add(loop); }
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), red); knot.position.y = 0.06; bow.add(knot);
      const lit = glow(c, '#ffd080', 0.9); lit.position.set(0, h + 0.1, 0); lit.visible = false; gb.add(lit);
      c.post(X(x), z, s / 2 + 0.1);
      let open = false, ang = 0;
      c.clickable(gb, () => {
        if (open) { c.toast(GIFTS[(k + 3) % 10], 2600); return; } open = true; opened.add(k); c.sound.pop(); setTimeout(() => c.sound.ding(), 120); lit.visible = true;
        c.toast(GIFTS[k], 3400);
        if (opened.size === 1) c.egg('goat_gift', 'A present from the Gift Goat. Five hundred and fifty five holders got gifts in the post, and none of them knew what was in the box until they opened it. Same here.');
        if (opened.size === 10) c.egg('goat_ten', 'Ten boxes, ten gifts, no two alike. The Gift Goat was the first collectible that bought you a surprise instead of a picture.');
      }, 'A wrapped present');
      c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const tg = open ? -2.3 : 0; ang += (tg - ang) * Math.min(1, dt * 6); hinge.rotation.x = ang; if (open) { lit.material.opacity = 0.6 + Math.sin(t * 5 + k) * 0.3; lit.position.y = h + 0.2 + Math.sin(t * 2 + k) * 0.08; } });
    }
    // the Gift Goat by the wall, a bow on its head
    const goat = cast(c, r, g, X, 'vf_goat', 13.4, 5.9, { h: 1.8, ry: -0.7, line: 'Five hundred and fifty five of me. Every one of us owes somebody a present. Pick a box.', hint: 'The Gift Goat' });
    const bow = new THREE.Group(); bow.position.set(13.4, 1.86, 5.9); bow.rotation.y = -0.7; g.add(bow);
    for (const rz of [0.7, -0.7]) { const loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 16), red); loop.rotation.set(PI / 2, 0, rz); loop.position.x = Math.sin(rz) * 0.11; bow.add(loop); }
    bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), red));
    // the false east wall and its three doors, Admission, Gift Goat, Access, each a niche the size of its door
    const FACE = 17.4, DEEP = 2.2;
    const face = (z0, z1, y0 = 0, y1 = H_IN) => { g.add(c.slab(0.24, y1 - y0, z1 - z0, velvet, FACE - 0.12, (y0 + y1) / 2, (z0 + z1) / 2)); if (y0 === 0) c.wall(X(FACE), z0, X(FACE), z1); };
    const DOORS = [['ADMISSION 9,400', -5.6, 2.6], ['GIFT GOAT 555', -2.4, 1.8], ['ACCESS 300', -0.2, 1.1]];
    face(-8, -7.0); face(-4.2, -3.4); face(-1.4, -0.85); face(0.45, 1.0); g.add(c.slab(DEEP + 0.3, H_IN, 0.24, velvet, FACE + DEEP / 2 + 0.05, H_IN / 2, 1.0)); c.wall(X(FACE), 1.0, X(FACE + DEEP + 0.2), 1.0);
    const niches = DOORS.map(([label, zc, w]) => {
      face(zc - w / 2 - 0.1, zc + w / 2 + 0.1, w, H_IN);
      const n = niche(c, r, g, X, { face: FACE, zc, w, d: DEEP, h: w, mat: velvetD, floorMat: parq, lightI: w > 2 ? 5 : w > 1.5 ? 3.5 : 1.6 });
      const s = c.sign(label, { w: Math.max(1.2, w), h: 0.3, bg: '#5a2fa0', fg: '#f5c542', font: c.MONO, weight: 800, border: '#f5c542' }); s.position.set(FACE - 0.14, w + 0.3, zc); s.rotation.y = -PI / 2; g.add(s);
      for (const dz of [-w / 2 - 0.1, w / 2 + 0.1]) g.add(c.slab(0.3, w + 0.2, 0.14, goldM, FACE - 0.13, w / 2 + 0.1, zc + dz));
      g.add(c.slab(0.3, 0.14, w + 0.4, goldM, FACE - 0.13, w + 0.07, zc));
      return n;
    });
    // ADMISSION: a ticket booth. A counter, a glass, a roll of tickets, a flower headed clerk.
    { const n = niches[0], glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.05, thickness: 0.02, transparent: true, opacity: 0.35 });
      n.add(c.slab(0.5, 1.0, 2.4, oak, -0.2, 0.5, 0)); n.add(c.slab(0.56, 0.05, 2.5, c.surf('marble', 1, 0xd8d0c0), -0.2, 1.02, 0));
      n.add(c.slab(0.04, 1.3, 2.4, glass, -0.2, 1.7, 0)); for (const dz of [-1.2, 1.2]) n.add(c.slab(0.06, 1.4, 0.06, goldM, -0.2, 1.72, dz));
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), basic(c, 0x111111)); hole.position.set(-0.23, 1.55, 0); hole.rotation.y = -PI / 2; n.add(hole);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 20), std(c, 0xf5c542, { roughness: 0.9 })); roll.position.set(-0.3, 1.1, -0.7); roll.rotation.x = PI / 2; n.add(roll);
      const strip = c.sign('ADMIT ONE · ADMIT ONE · ADMIT ONE', { w: 0.9, h: 0.09, bg: '#f5c542', fg: '#111', font: c.MONO, weight: 800, px: 48 }); strip.position.set(-0.42, 1.06, -0.2); strip.rotation.x = -PI / 2; strip.rotation.z = PI / 2; n.add(strip);
      extra(c, n, 0.45, 0.2, { seated: true, col: 0x5a2fa0, ry: -PI / 2 }).position.y = 0.3;
      const back = c.sign('ADMISSION\n9,400 OF THE 10,255\nSERIES 1 · MAY 11, 2021', { w: 1.8, h: 0.7, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 800, px: 180 }); back.position.set(DEEP / 2 - 0.02, 1.9, 0); back.rotation.y = -PI / 2; n.add(back);
      c.wall(X(FACE + DEEP / 2 - 0.5), -5.6 - 1.3, X(FACE + DEEP / 2 - 0.5), -5.6 + 1.3);
      c.clickable(roll, () => { c.sound.ticket(); c.egg('goat_ticket', 'Admission. Nine thousand four hundred of the ten thousand two hundred and fifty five, and every one was a ticket before it was a picture. The booth is still open.'); }, 'The ticket roll');
      c.clickable(strip, () => roll.userData.click && roll.userData.click(), 'The ticket roll'); }
    // GIFT GOAT: the 555 tags and the framed note about gift number one
    { const n = niches[1], paperM = std(c, 0xf4ead2, { roughness: 0.95 });
      n.add(c.slab(0.9, 0.5, 0.7, oak, 0.1, 0.25, 0.3)); const stack = c.slab(0.3, 0.22, 0.24, paperM, 0.1, 0.61, 0.3); n.add(stack);
      const edge = decal(c, 0.3, 0.22, (q, w, h) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, w, h); q.fillStyle = '#b8a888'; for (let y = 0; y < h; y += 3) q.fillRect(0, y, w, 1); }, 64); edge.position.set(0.1, 0.61, 0.42); n.add(edge);
      ['No. 1', 'No. 2', 'No. 3', 'No. 555'].forEach((tg, i) => { const s = c.sign(`GIFT TAG ${tg}\nOF 555`, { w: 0.24, h: 0.14, bg: '#f4ead2', fg: '#5a2fa0', font: c.MONO, weight: 800, px: 64, border: '#5a2fa0' }); s.position.set(-0.3 + i * 0.22, 0.58 + i * 0.03, 0.05 - i * 0.04); s.rotation.set(-0.9, 0.3 - i * 0.2, 0); n.add(s); });
      const note = c.sign('GIFT NUMBER ONE\nA print and an NFT by Gary and Danny Cole\nto every one of the 555 Gift Goats', { w: 1.3, h: 0.62, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 180, pad: 0.1 }); note.position.set(DEEP / 2 - 0.04, 1.15, 0); note.rotation.y = -PI / 2; n.add(note);
      n.add(c.slab(0.05, 0.76, 1.44, goldM, DEEP / 2 - 0.01, 1.15, 0));
      c.clickable(note, () => c.egg('goat_one', 'Gift number one: a Gary and Danny Cole print and an NFT, to five hundred and fifty five people who bought a goat. The goat delivered. It kept delivering.'), 'The framed note');
      c.clickable(stack, () => { c.sound.tick(); c.toast('Five hundred and fifty five tags, numbered. A gift goes out, then another. The stack never got shorter.', 2800); }, 'The gift tags');
      for (let k = 0; k < 3; k++) { const s = 0.26 - k * 0.04, b = c.slab(s, s * 0.8, s, papers[k], -0.5 + k * 0.1, s * 0.4 + k * 0.21, -0.45 + k * 0.05); b.rotation.y = k * 0.4; n.add(b); }
      c.post(X(FACE + DEEP / 2 + 0.1), -2.4 + 0.3, 0.5); }
    // ACCESS: the table set for two, at fifty five percent. The four real experiences are on the wall.
    { const n = niches[2], S = 0.55, white = std(c, 0xf4f4f0, { roughness: 0.3 }), cloth = c.surf('velvet', 0.5, 0xf4ead2);
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), cloth); tbl.position.set(0.2, 0.74 * S, 0); n.add(tbl);
      n.add(c.slab(0.04, 0.72 * S, 0.04, oak, 0.2, 0.36 * S, 0)); const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 16), oak); foot.position.set(0.2, 0.02, 0); n.add(foot);
      for (const dz of [-0.36, 0.36]) { n.add(c.slab(0.22, 0.03, 0.22, oak, 0.2, 0.42 * S, dz)); for (const dx of [-0.09, 0.09]) for (const d2 of [-0.09, 0.09]) n.add(c.slab(0.02, 0.42 * S, 0.02, oak, 0.2 + dx, 0.21 * S, dz + d2)); n.add(c.slab(0.22, 0.4 * S, 0.02, oak, 0.2, 0.62 * S, dz + Math.sign(dz) * 0.1)); }
      for (const dz of [-0.13, 0.13]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 20), white); pl.position.set(0.2, 0.74 * S + 0.02, dz); n.add(pl); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.07, 10), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.8, roughness: 0.1, transparent: true, opacity: 0.6 })); gl.position.set(0.3, 0.74 * S + 0.05, dz + 0.06); n.add(gl); }
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), white); candle.position.set(0.2, 0.74 * S + 0.06, 0); n.add(candle); const cf = glow(c, '#ffb040', 0.12); cf.position.set(0.2, 0.74 * S + 0.12, 0); n.add(cf);
      [['GARY', -0.13], ['YOU', 0.13]].forEach(([nm, dz]) => { const s = c.sign(nm, { w: 0.09, h: 0.04, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 800, px: 32 }); s.position.set(0.1, 0.74 * S + 0.04, dz); s.rotation.set(-0.3, -PI / 2, 0, 'YXZ'); n.add(s); });
      const rk = new THREE.Group(); rk.position.set(0.6, 0.72, -0.45); rk.rotation.y = -PI / 2; n.add(rk); rk.add(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 20), std(c, 0x2a4a8a))); rk.add(c.slab(0.02, 0.16, 0.02, std(c, 0x8a6a40), 0, -0.17, 0));
      const strings = decal(c, 0.16, 0.16, (q, w, h) => { q.strokeStyle = '#eee'; q.lineWidth = 2; for (let i = 1; i < 8; i++) { q.beginPath(); q.moveTo(i * w / 8, 0); q.lineTo(i * w / 8, h); q.moveTo(0, i * h / 8); q.lineTo(w, i * h / 8); q.stroke(); } }, 64); strings.position.set(0.59, 0.72, -0.45); strings.rotation.y = -PI / 2; n.add(strings);
      n.add(c.slab(0.05, 0.1, 0.06, std(c, 0x111111), 0.7, 0.05, 0.4)); const ph = c.sign('CALL', { w: 0.05, h: 0.08, bg: '#111', fg: '#7fff9a', font: c.MONO, weight: 800, px: 48 }); ph.position.set(0.67, 0.06, 0.4); ph.rotation.y = -PI / 2; n.add(ph);
      const gs = c.sign('GARAGE SALE\nSATURDAY 6 AM', { w: 0.3, h: 0.18, bg: '#f5c542', fg: '#111', font: c.FONT, weight: 900, px: 64 }); gs.position.set(0.8, 0.4, 0.3); gs.rotation.y = -PI / 2; n.add(gs); n.add(c.slab(0.02, 0.3, 0.02, oak, 0.81, 0.15, 0.3));
      const wallS = c.sign('ACCESS · 300 TOKENS\nGARAGE SALING WITH GARY · TENNIS\nDINNER · A ONE ON ONE CALL', { w: 0.95, h: 0.34, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 128, pad: 0.08 }); wallS.position.set(DEEP / 2 - 0.04, 0.78, 0); wallS.rotation.y = -PI / 2; n.add(wallS);
      c.post(X(FACE + DEEP / 2 + 0.2), -0.2, 0.3);
      c.clickable(tbl, () => c.egg('goat_access', 'Access. Three hundred tokens, and this is what they bought: garage saling with Gary, tennis, dinner, a one on one call. The table is set for two and you are small enough to sit at it.'), 'The table set for two');
      c.clickable(rk, () => c.toast('Tennis. He plays to win and so should you.', 2400), 'The racket'); c.clickable(gs, () => c.toast('Garage saling. Six in the morning, a thermos, and a trunk that comes home full.', 2600), 'The garage sale sign'); }
    // the trick: the small door shrinks you, and the room gives you back your size when you leave it
    let told = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (r.owns) { P.scale = 1; P.speed = 1; r.owns = false; } return; }
      const lx = P.x - r.x0, want = lx > FACE - 1.7 && Math.abs(P.z + 0.2) < 0.95 ? 0.55 : 1;
      if (want < 1 && !r.owns) { r.owns = true; if (!told) { told = true; c.toast('The small door. You are fifty five percent of yourself now. The table inside is set for two.', 3200); c.sound.lift(); } }
      if (r.owns) { P.scale += (want - P.scale) * Math.min(1, dt * 6); P.speed = P.scale; if (want === 1 && Math.abs(P.scale - 1) < 0.01) { P.scale = 1; P.speed = 1; r.owns = false; } }
    });
    // the rest of the room: a runner, gold columns, a cornice, sconces, the gift mountain with the cat on top
    g.add(c.slab(2.2, 0.02, 13.4, c.surf('carpet2', 2, 0xa01030), 10, 0.011, 0.1));
    column(c, r, g, X, 16.4, 1.6, { h: H_IN, rad: 0.28, mat: goldM }); column(c, r, g, X, 16.4, -7.3, { h: H_IN, rad: 0.28, mat: goldM });
    for (const [x, z, w, d] of [[10, -7.8, 20, 0.2], [0.2, 0, 0.2, 16], [10, 7.9, 20, 0.2], [FACE - 0.1, -3.5, 0.2, 9]]) g.add(c.slab(w, 0.24, d, goldM, x, H_IN - 0.12, z));
    for (const z of [-6.2, -3.2, -0.2, 2.8]) { g.add(c.slab(0.12, 0.3, 0.2, goldM, 0.3, 3.2, z)); const b = glow(c, '#ffd080', 0.9); b.position.set(0.5, 3.5, z); g.add(b); }
    const pile = [[2.0, -6.2, 1.4], [3.6, -6.7, 1.0], [1.6, -4.6, 0.9], [2.7, -5.2, 0.7]];
    pile.forEach(([x, z, s], k) => { const b = c.slab(s, s * 0.85, s, papers[k % 3], x, s * 0.425, z); b.rotation.y = k * 0.3; g.add(b); c.post(X(x), z, s * 0.75); for (const rz of [0.6, -0.6]) { const loop = new THREE.Mesh(new THREE.TorusGeometry(s * 0.12, s * 0.035, 8, 16), red); loop.rotation.set(PI / 2, 0, rz); loop.position.set(x + Math.sin(rz) * s * 0.12, s * 0.9, z); g.add(loop); } });
    cast(c, r, g, X, 'vf_blackcat', 2.0, -6.2, { h: 0.7, y: 1.19, ry: 0.6, r: 0, line: 'The Very Very Very Very Lucky Black Cat. I sit on the biggest box. It is not for you.', hint: 'The black cat' });
    const title = c.sign('THE GIFT GOAT\'S ROOM · 555 GIFT GOATS · 300 ACCESS · 9,400 ADMISSION', { w: 5.2, h: 0.32, bg: '#5a2fa0', fg: '#f5c542', font: c.MONO, weight: 800 }); title.position.set(10, 5.3, -7.86); g.add(title);
    plaque(c, g, 10, 4.2, 7.0, PI, 'Give more than you take.', 'THE GIFT GOAT, 2021', 1.6);
  },

  // MEET ME IN THE MIDDLE. A gym. Patient Pig has the west end, Eager Eagle the east, and the half court line is the
  // spine of the book: cross it and the whole room turns over, floor to ceiling, the way the picture book flips.
  middle(c, r, g, X) {
    const { THREE } = c, PINK = 0xff8fc0, BROWN = 0x6b3f1d;
    const flip = new THREE.Group(); flip.position.set(0, 3, 0); g.add(flip);
    const inner = new THREE.Group(); inner.position.y = -3; flip.add(inner);   // room coordinates inside the thing that turns
    const steel = std(c, 0x8a8f96, { metalness: 0.8, roughness: 0.35 }), seatM = c.surf('paint', 1, 0x3a5a9a), seatM2 = c.surf('paint', 1, 0x9a3a4a), board = c.surf('plaster', 1, 0xf4f4f0), orange = std(c, 0xe8742a, { roughness: 0.5 });
    // the court lines, drawn once and laid twice: on the floor and on the ceiling, so the walk goes on after the flip
    const courtT = c.canvasTex(1600, 1040, (q, w, h) => {
      const S = 100, cx = w / 2, cy = h / 2; q.fillStyle = 'rgba(255,143,192,0.16)'; q.fillRect(0, 0, w / 2, h); q.fillStyle = 'rgba(107,63,29,0.16)'; q.fillRect(w / 2, 0, w / 2, h);
      q.strokeStyle = '#f4f4f0'; q.lineWidth = 9; q.strokeRect(0.2 * S, 0.2 * S, w - 0.4 * S, h - 0.4 * S); q.beginPath(); q.moveTo(cx, 0.2 * S); q.lineTo(cx, h - 0.2 * S); q.stroke();
      q.beginPath(); q.arc(cx, cy, 1.8 * S, 0, 7); q.stroke(); q.fillStyle = '#f5c542'; q.beginPath(); q.arc(cx, cy, 0.5 * S, 0, 7); q.fill();
      for (const side of [-1, 1]) { const bx = side < 0 ? 0.2 * S : w - 0.2 * S, dir = -side; q.fillStyle = side < 0 ? 'rgba(255,143,192,0.35)' : 'rgba(107,63,29,0.35)'; q.fillRect(Math.min(bx, bx + dir * 5.8 * S), cy - 2.45 * S, 5.8 * S, 4.9 * S); q.strokeRect(Math.min(bx, bx + dir * 5.8 * S), cy - 2.45 * S, 5.8 * S, 4.9 * S);
        q.beginPath(); q.arc(bx + dir * 5.8 * S, cy, 1.8 * S, 0, 7); q.stroke(); q.beginPath(); q.arc(bx + dir * 1.2 * S, cy, 6.6 * S, side < 0 ? -1.25 : PI - 1.25, side < 0 ? 1.25 : PI + 1.25); q.stroke(); }
      q.fillStyle = '#f4f4f0'; q.font = `900 ${0.6 * S}px ${c.SERIF}`; q.textAlign = 'center'; q.save(); q.translate(cx, cy - 2.9 * S); q.fillText('MEET ME IN THE MIDDLE', 0, 0); q.restore(); q.save(); q.translate(cx, cy + 2.9 * S); q.rotate(PI); q.fillText('MEET ME IN THE MIDDLE', 0, 0); q.restore();
    });
    const mkCourt = () => new THREE.Mesh(new THREE.PlaneGeometry(16, 10.4), new THREE.MeshStandardMaterial({ map: courtT, transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    const cf = mkCourt(); cf.rotation.x = -PI / 2; cf.position.set(10, 0.012, 0); inner.add(cf);
    const cc = mkCourt(); cc.rotation.x = PI / 2; cc.position.set(10, H_IN - 0.012, 0); inner.add(cc);
    // the hoops: a pole, a glass board, a ring, a net of lines
    const hoop = (hx, dir) => {
      const grp = new THREE.Group(); grp.position.set(hx, 0, 0); grp.rotation.y = dir > 0 ? 0 : PI; inner.add(grp);
      grp.add(c.slab(1.2, 0.2, 1.0, std(c, 0x1a1a22), -1.0, 0.1, 0)); grp.add(c.slab(0.12, 3.6, 0.12, steel, -1.0, 1.9, 0)); grp.add(c.slab(1.0, 0.08, 0.08, steel, -0.5, 3.6, 0));
      grp.add(c.slab(0.05, 1.05, 1.8, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.6, roughness: 0.05, thickness: 0.05, transparent: true, opacity: 0.5 }), -0.05, 3.4, 0));
      const sq = decal(c, 0.6, 0.45, (q, w, h) => { q.strokeStyle = '#ff4040'; q.lineWidth = 10; q.strokeRect(6, 6, w - 12, h - 12); q.strokeStyle = '#f4f4f0'; q.lineWidth = 6; q.strokeRect(2, 2, w - 4, h - 4); }, 96); sq.position.set(-0.02, 3.3, 0); sq.rotation.y = PI / 2; grp.add(sq);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 24), orange); rim.rotation.x = PI / 2; rim.position.set(0.3, 3.05, 0); grp.add(rim);
      grp.add(c.slab(0.3, 0.06, 0.1, orange, 0.1, 3.03, 0));
      const net = new THREE.Group(); net.position.set(0.3, 3.05, 0); grp.add(net); const nm = std(c, 0xf4f4f0, { roughness: 0.9 });
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, m = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.46, 4), nm); m.position.set(Math.cos(a) * 0.18, -0.22, Math.sin(a) * 0.18); m.rotation.z = Math.cos(a) * 0.22; m.rotation.x = -Math.sin(a) * 0.22; net.add(m); }
      for (const [y, rr] of [[-0.15, 0.2], [-0.3, 0.15], [-0.44, 0.1]]) { const h = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.005, 4, 16), nm); h.rotation.x = PI / 2; h.position.y = y; net.add(h); }
      return { grp, rim, net };
    };
    const hoops = [hoop(2.4, 1), hoop(17.6, -1)]; c.post(X(1.4), 0, 0.5); c.post(X(18.6), 0, 0.5);
    // the stands: three steps a side, flower headed crowd, the pig's people in pink and the eagle's in brown and white
    const stands = (x0, x1, z0, dirZ, mat) => { for (let k = 0; k < 3; k++) { const z = z0 + dirZ * (0.265 + 0.53 * k); inner.add(c.slab(x1 - x0, 0.4 * (k + 1), 0.53, mat, (x0 + x1) / 2, 0.2 * (k + 1), z)); } for (const x of [x0, x1]) inner.add(c.slab(0.08, 1.3, 1.6, std(c, 0x1a1a22), x, 0.65, z0 + dirZ * 0.8)); };
    stands(3.6, 13.6, 6.2, 1, seatM); stands(1.0, 7.4, -5.0, -1, seatM2); stands(12.6, 19.0, -5.0, -1, seatM);
    c.wall(X(3.6), 6.15, X(13.6), 6.15); c.wall(X(1.0), -4.95, X(7.4), -4.95); c.wall(X(7.4), -4.95, X(7.4), -6.75); c.wall(X(12.6), -4.95, X(19.0), -4.95); c.wall(X(12.6), -4.95, X(12.6), -6.75);
    const crowd = [];
    const sit = (x, z, k, west) => { const o = extra(c, inner, x, z, { seated: true, col: west ? (Math.random() < 0.6 ? PINK : 0xf4ead2) : (Math.random() < 0.5 ? BROWN : 0xf4f4f0), ry: z > 0 ? PI : 0 }); o.position.y = 0.4 * (k + 1); crowd.push({ o, ph: Math.random() * 7 }); };
    for (let i = 0; i < 9; i++) sit(4.2 + i * 1.1 + rnd(-0.15, 0.15), 6.2 + 0.3 + 0.53 * (i % 3), i % 3, 4.2 + i * 1.1 < 10);
    for (let i = 0; i < 5; i++) sit(1.6 + i * 1.3, -5.0 - 0.3 - 0.53 * (i % 3), i % 3, true);
    for (let i = 0; i < 5; i++) sit(13.2 + i * 1.3, -5.0 - 0.3 - 0.53 * (i % 3), i % 3, false);
    // the two of them: the pig in the west stands, the eagle in the east
    const pig = cast(c, r, inner, X, 'vf_pig', 5.6, 7.5, { h: 1.5, y: 0.8, ry: PI, r: 0, line: 'I watch from my end. I can wait. The game comes to the middle eventually.', egg: 'middle_pig', hint: 'Patient Pig' });
    const eagle = cast(c, r, inner, X, 'vf_eagle', 15.8, -6.2, { h: 1.5, y: 0.8, ry: 0, r: 0, line: 'I watch from my end. Hurry up. The game is already in the middle.', egg: 'middle_eagle', hint: 'Eager Eagle' });
    // pennants on strings across the gym, pink to the west, brown and white to the east
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.16, 0, 0, 0.16, 0, 0, 0, -0.5, 0], 3)); tri.computeVertexNormals();
    const pm = { p: std(c, PINK, { side: THREE.DoubleSide }), w: std(c, 0xf4f4f0, { side: THREE.DoubleSide }), b: std(c, BROWN, { side: THREE.DoubleSide }) }, pens = [];
    const string = (x, cols) => { inner.add(c.slab(0.01, 0.01, D - 0.4, std(c, 0x222222), x, 5.3, 0)); for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(tri, pm[cols[i % cols.length]]); m.position.set(x, 5.28, -7.4 + i * 0.86); m.rotation.y = PI / 2; inner.add(m); pens.push({ m, ph: i }); } };
    string(5.0, ['p', 'w']); string(15.0, ['b', 'w']);
    // banners, the scoreboard, the dugouts under each end of the south stands
    const banner = (txt, x, y, z, ry, bg, fg) => { const s = c.sign(txt, { w: 3.2, h: 0.5, bg, fg, font: c.SERIF, weight: 900, px: 128 }); s.position.set(x, y, z); s.rotation.y = ry; inner.add(s); return s; };
    banner('PATIENT PIG · WEST END', 4.4, 4.5, 7.8, PI, '#ff8fc0', '#111'); banner('EAGER EAGLE · EAST END', 15.6, 4.5, 7.8, PI, '#6b3f1d', '#f4f4f0');
    banner('MEET ME IN THE MIDDLE · A PICTURE BOOK · 2024', 10, 4.6, 7.8, PI, '#111', '#f5c542'); banner('HALF COURT. THE BOOK FLIPS HERE.', 10, 5.3, -7.86, 0, '#f5c542', '#111');
    let score = [0, 0], boardM = null;
    const scoreboard = () => { if (boardM) { inner.remove(boardM); boardM.material.map.dispose(); } boardM = c.sign(`PIG ${score[0]}   ·   EAGLE ${score[1]}`, { w: 2.6, h: 0.6, bg: '#111', fg: '#ff4040', font: c.MONO, weight: 900, glow: 10 }); boardM.position.set(10, 4.0, 7.8); boardM.rotation.y = PI; inner.add(boardM); };
    scoreboard(); inner.add(c.slab(2.8, 0.8, 0.12, std(c, 0x222228), 10, 4.0, 7.86));
    const dugout = (x0, x1, nm, col) => {
      const xc = (x0 + x1) / 2, w = x1 - x0; inner.add(c.slab(w, 0.1, 1.6, seatM, xc, 1.25, 7.0)); inner.add(c.slab(0.1, 1.3, 1.6, std(c, 0x1a1a22), x1, 0.65, 7.0)); inner.add(c.slab(0.1, 1.3, 1.6, std(c, 0x1a1a22), x0, 0.65, 7.0));
      inner.add(c.slab(w - 0.6, 0.06, 0.4, c.surf('planks', 1, 0x8a6a48), xc, 0.45, 7.5)); for (const dx of [-w / 2 + 0.5, w / 2 - 0.5]) inner.add(c.slab(0.06, 0.45, 0.4, steel, xc + dx, 0.22, 7.5));
      const cool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.6, 16), std(c, 0xe8e8e0)); cool.position.set(x0 + 0.5, 0.3, 6.6); inner.add(cool); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), std(c, 0x2a4a8a)); lid.position.set(x0 + 0.5, 0.64, 6.6); inner.add(lid);
      for (let k = 0; k < 3; k++) inner.add(c.slab(0.3, 0.06, 0.2, std(c, 0xf4f4f0, { roughness: 0.95 }), x1 - 0.6, 0.48 + k * 0.07, 7.4));
      const s = c.sign(nm, { w: 1.6, h: 0.22, bg: col, fg: col === '#ff8fc0' ? '#111' : '#f4f4f0', font: c.MONO, weight: 800 }); s.position.set(xc, 1.42, 6.2); s.rotation.y = PI; inner.add(s);
      c.post(X(x0 + 0.5), 6.6, 0.3); c.wall(X(x0), 6.2, X(x0), 7.8); c.wall(X(x1), 6.2, X(x1), 7.8);
    };
    dugout(1.0, 3.5, 'HOME · PATIENT PIG', '#ff8fc0'); dugout(13.7, 16.2, 'VISITORS · EAGER EAGLE', '#6b3f1d');
    // the ball on a rack: click it and it goes up at the nearer hoop. Through the ring is a swish and a point for that end.
    const ballT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#e8742a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#1a1a1a'; q.lineWidth = 5; q.beginPath(); q.moveTo(w / 2, 0); q.lineTo(w / 2, h); q.moveTo(0, h / 2); q.lineTo(w, h / 2); q.stroke(); q.beginPath(); q.arc(w / 2, h / 2, w * 0.3, 0, 7); q.stroke(); });
    const ballM = new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.7 }), ballG = new THREE.SphereGeometry(0.12, 16, 12);
    const rack = new THREE.Group(); rack.position.set(13.0, 0, 4.6); inner.add(rack); for (const dy of [0.35, 0.75]) for (const dz of [-0.3, 0.3]) rack.add(c.slab(0.9, 0.03, 0.03, steel, 0, dy, dz)); for (const dx of [-0.42, 0.42]) rack.add(c.slab(0.03, 0.8, 0.6, steel, dx, 0.4, 0));
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(ballG, ballM); b.position.set(-0.28 + k * 0.28, 0.5, 0); rack.add(b); }
    const ball = new THREE.Mesh(ballG, ballM); ball.position.set(0, 0.9, 0); rack.add(ball); c.post(X(13.0), 4.6, 0.6);
    let shot = null, swishes = 0; const _rw = new THREE.Vector3(), _st = new THREE.Vector3();
    const shoot = () => {
      if (shot) return; const P = c.P; const lx = P.x - r.x0, k = lx < 10 ? 0 : 1; hoops[k].rim.getWorldPosition(_rw); _rw.x -= r.x0;
      c.camera.getWorldDirection(_st); _st.set(P.x - r.x0 + _st.x * 0.5, c.camera.position.y + 0.1, P.z + _st.z * 0.5);
      const b = new THREE.Mesh(ballG, ballM); b.position.copy(_st); g.add(b); ball.visible = false;
      const dist = Math.hypot(_rw.x - _st.x, _rw.z - _st.z), T = 1.1 + dist * 0.06, v = new THREE.Vector3().subVectors(_rw, _st).divideScalar(T); v.y += 0.5 * 9.8 * T;
      const err = 0.04 + dist * 0.012; v.x += rnd(-err, err); v.z += rnd(-err, err);
      shot = { b, v, t: 0, k, rimY: _rw.y, rimX: _rw.x, rimZ: _rw.z, prevY: _st.y, bounces: 0, done: false }; c.sound.whoosh(0.1, 0.4);
    };
    c.clickable(ball, shoot, 'Shoot at the near hoop');
    // the trick: cross the half court line and the gym turns over about its long axis
    let side = 0, flipping = false, ang = 0, from = 0, target = 0, t0 = 0, flips = 0, cool = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      crowd.forEach((e) => { e.o.userData.head.rotation.z = Math.sin(t * 2 + e.ph) * 0.12; });
      pens.forEach((p) => { p.m.rotation.z = Math.sin(t * 1.6 + p.ph) * 0.18; });
      hoops.forEach((h) => { h.net.rotation.z *= 0.95; h.net.rotation.x *= 0.95; });
      const lx = P.x - r.x0; cool -= dt;
      if (!flipping) { const s = lx < 9.4 ? -1 : lx > 10.6 ? 1 : 0; if (s && side && s !== side && cool <= 0) { flipping = true; from = ang; target = ang + PI * s; t0 = t; cool = 2.2; flips++; c.sound.whoosh(0.5, 1.0); c.toast(s > 0 ? 'Eager Eagle\'s end. The book flips.' : 'Patient Pig\'s end. The book flips back.', 2200); if (flips === 1) c.egg('middle_flip', 'The gym turned over. Two characters watch the same game from opposite ends, and the book flips in the middle so each gets a cover. Meet Me in the Middle, 2024.'); } if (s) side = s; }
      if (flipping) { const u = Math.min(1, (t - t0) / 1.0); ang = from + (target - from) * ease(u); flip.rotation.x = ang; if (u >= 1) { flipping = false; c.sound.thud(0.5); c.shake(0.08); } }
      if (shot && !shot.done) {
        const o = shot; o.t += dt; o.v.y -= 9.8 * dt; o.b.position.addScaledVector(o.v, dt); o.b.rotation.x += dt * 8; const p = o.b.position;
        const crossed = (o.prevY > o.rimY && p.y <= o.rimY) || (o.prevY < o.rimY && p.y >= o.rimY), hd = Math.hypot(p.x - o.rimX, p.z - o.rimZ);
        if (crossed && hd < 0.2) { swishes++; score[o.k] += 2; scoreboard(); hoops[o.k].net.rotation.z = 0.3; c.sound.whoosh(0.3, 0.4); setTimeout(() => c.sound.ding(), 150); c.flash(0.25); c.toast(o.k ? 'SWISH. Two for the eagle.' : 'SWISH. Two for the pig.', 2200); if (swishes === 1) c.egg('middle_swish', 'Through the net. Whoever you were rooting for just scored, and from the other end it looked like a loss. Same shot. Meet in the middle.'); }
        else if (crossed && hd < 0.5) { c.sound.thud(0.3); o.v.x *= -0.4; o.v.z *= -0.4; o.v.y = Math.abs(o.v.y) * 0.4; c.toast(['Rim.', 'Front iron.', 'In and out.'][(Math.random() * 3) | 0], 1400); }
        if (p.y < 0.12) { p.y = 0.12; o.v.y = Math.abs(o.v.y) * 0.55; o.v.x *= 0.8; o.v.z *= 0.8; o.bounces++; c.sound.thud(0.15); }
        o.prevY = p.y;
        if (o.bounces > 4 || o.t > 6 || p.x < 0.3 || p.x > 19.7 || Math.abs(p.z) > 7.8) { o.done = true; g.remove(o.b); ball.visible = true; shot = null; }
      }
    });
    column(c, r, g, X, 0.6, 1.4, { h: H_IN, rad: 0.22, mat: steel }); column(c, r, g, X, 0.6, 6.0, { h: H_IN, rad: 0.22, mat: steel }); column(c, r, g, X, 19.4, 1.4, { h: H_IN, rad: 0.22, mat: steel }); column(c, r, g, X, 19.4, 6.0, { h: H_IN, rad: 0.22, mat: steel });
    plaque(c, g, 0.3, 3.4, -2.4, PI / 2, 'Everyone is watching the same game from a different seat.', 'MEET ME IN THE MIDDLE, 2024', 1.6);
  },

  // THE TOY AISLE. Shelves to the ceiling, ten figures in window boxes, bins of plush, a checkout, and a claw machine
  // that is honest: it never drops a win. It just has to be over one.
  toys(c, r, g, X) {
    const { THREE } = c;
    const steel = std(c, 0x8a8f96, { metalness: 0.8, roughness: 0.35 }), shelfM = c.surf('paint', 1, 0xe8e0d0), backM = c.surf('paint', 1, 0xd0c8b8), oak = c.surf('oldwood', 1, 0x7a5a38), rubber = c.surf('rubber', 1, 0x222222);
    const NAMES10 = ['Practical Peacock', 'Willful Wizard', 'Genuine Giraffe', 'Adventurous Astronaut', 'Gratitude Gorilla', 'Patient Panda', 'Empathy Elephant', 'Common Sense Cow', 'Heart Trooper', 'Be the Bigger Person'];
    const COLS10 = ['#22d3ee', '#5a2fa0', '#f5c542', '#3b82f6', '#7fff9a', '#f4ead2', '#ff8fc0', '#ff7a1a', '#ff4040', '#a0e0ff'];
    const INSIDE = { 'Gratitude Gorilla': 'vf_gorilla', 'Patient Panda': 'vf_panda', 'Empathy Elephant': 'vf_elephant' };
    // the shelves: steel uprights, painted boards, a back panel, five levels each side
    const run = (x0, x1, z0, z1) => {
      const w = x1 - x0, cx = (x0 + x1) / 2, len = z1 - z0, cz = (z0 + z1) / 2;
      for (const y of [0.1, 1.1, 2.1, 3.1, 4.1]) g.add(c.slab(w, 0.06, len, shelfM, cx, y, cz));
      for (let z = z0; z <= z1 + 0.01; z += len / 4) for (const x of [x0 + 0.04, x1 - 0.04]) g.add(c.slab(0.05, 4.5, 0.05, steel, x, 2.25, z));
      g.add(c.slab(0.04, 4.5, len, backM, x0 < 10 ? x0 + 0.02 : x1 - 0.02, 2.25, cz)); g.add(c.slab(w, 0.4, len, c.surf('metal', 1, 0x6a6a70), cx, 4.5, cz));
      c.wall(X(x0), z0, X(x1), z0); c.wall(X(x0), z1, X(x1), z1); c.wall(X(x0 < 10 ? x1 : x0), z0, X(x0 < 10 ? x1 : x0), z1);
    };
    run(0.3, 1.5, -7.6, 1.6); run(18.5, 19.7, -7.6, 1.6);
    // a boxed figure: a card front with a window, a glass, a printed insert, and three of them hold the real figure
    const CARD = {}, INS = {};
    const cardTex = (k) => CARD[k] ||= c.canvasTex(256, 384, (q, w, h) => { const col = COLS10[k], nm = NAMES10[k].split(' '); q.fillStyle = col; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.fillRect(12, 12, w - 24, h - 24); q.fillStyle = col; q.fillRect(20, 20, w - 40, h - 40); q.clearRect(36, 118, w - 72, 200); q.fillStyle = '#111'; q.textAlign = 'center'; q.font = `900 ${nm.length > 2 ? 24 : 30}px ${c.SERIF}`; nm.forEach((s, i) => q.fillText(s.toUpperCase(), w / 2, 58 + i * (nm.length > 2 ? 26 : 34))); q.font = `700 12px ${c.MONO}`; q.fillText('MACY\'S AND TOYS R US', w / 2, h - 36); q.fillText('OCTOBER 2022', w / 2, h - 20); eyeFlower(q, 36, 36, 16); });
    const insTex = (k) => INS[k] ||= c.canvasTex(128, 192, (q, w, h) => { q.fillStyle = COLS10[k]; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.5)'; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, h * 0.4, 30); q.fillStyle = '#111'; q.font = `800 11px ${c.MONO}`; q.textAlign = 'center'; q.fillText(NAMES10[k].toUpperCase().slice(0, 20), w / 2, h - 24); });
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.7, roughness: 0.05, thickness: 0.02, transparent: true, opacity: 0.35 });
    const seen = new Set(), figures = [];
    const boxFig = (k, x, y, z, ry) => {
      const bw = 0.42, bh = 0.6, bd = 0.26, grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshStandardMaterial({ map: cardTex(k), transparent: true, alphaTest: 0.5, roughness: 0.7 })); card.position.set(0, bh / 2, bd / 2); grp.add(card);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.1, 0.3), glassM); gl.position.set(0, bh / 2 + 0.02, bd / 2 - 0.004); grp.add(gl);
      const ins = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.04, bh - 0.04), new THREE.MeshStandardMaterial({ map: insTex(k), roughness: 0.9 })); ins.position.set(0, bh / 2, -bd / 2 + 0.01); grp.add(ins);
      const side = std(c, new THREE.Color(COLS10[k]).getHex(), { roughness: 0.8 }); grp.add(c.slab(0.02, bh, bd, side, -bw / 2, bh / 2, 0)); grp.add(c.slab(0.02, bh, bd, side, bw / 2, bh / 2, 0)); grp.add(c.slab(bw, 0.02, bd, side, 0, bh, 0)); grp.add(c.slab(bw, 0.02, bd, side, 0, 0.01, 0)); grp.add(c.slab(bw, bh, 0.02, side, 0, bh / 2, -bd / 2));
      const vf = INSIDE[NAMES10[k]]; let fig = null;
      if (vf) { fig = c.glb(vf, { h: 0.42, x: 0, y: 0.03, z: 0, parent: grp, shadow: false }); figures.push(fig); }
      c.clickable(grp, () => { seen.add(k); c.sound.click(); if (fig) c.say(grp, `${NAMES10[k]}. The real one. The box is the part they got wrong.`, 3000, bh + 0.2); else c.toast(`${NAMES10[k]}. One of the ten figures that went to Macy's and Toys R Us in October 2022. Boxed, windowed, shelved.`, 3000); if (seen.size === 10) c.egg('toys_ten', 'All ten names on the shelf: a peacock, a wizard, a giraffe, an astronaut, a gorilla, a panda, an elephant, a cow, a trooper and a reminder to be the bigger person. October 2022, in a real toy store.'); }, NAMES10[k]);
      return grp;
    };
    let k = 0;
    for (const [side, x, ry] of [['w', 1.2, PI / 2], ['e', 18.8, -PI / 2]]) for (const y of [0.16, 1.16, 2.16]) for (let i = 0; i < 6; i++) { boxFig(k % 10, x, y, -7.0 + i * 1.4 + rnd(-0.1, 0.1), ry + rnd(-0.1, 0.1)); k++; }
    // plush: a body, a head, two ears, all velvet. Bins on the floor and piles on the high shelves.
    const PL = [0xff8fc0, 0xf5c542, 0x7fff9a, 0x22d3ee, 0xf4ead2, 0x9a6cff, 0xff7a1a], plushes = [];
    const plush = (parent, x, y, z, s = 1, col) => { const m = c.surf('velvet', 0.6, col || PL[(Math.random() * PL.length) | 0]), o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = rnd(0, 6); o.rotation.z = rnd(-0.3, 0.3); parent.add(o);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 12, 10), m); body.position.y = 0.16 * s; o.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 12, 10), m); head.position.y = 0.36 * s; o.add(head);
      for (const dx of [-0.09, 0.09]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 6), m); ear.position.set(dx * s, 0.46 * s, 0); o.add(ear); }
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.035 * s, 10), basic(c, 0x111111)); eye.position.set(0, 0.37 * s, 0.115 * s); o.add(eye); plushes.push(o); return o; };
    const bin = (x, z) => { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); for (const [w, d, dx, dz] of [[1.3, 0.04, 0, 0.5], [1.3, 0.04, 0, -0.5], [0.04, 1.0, 0.65, 0], [0.04, 1.0, -0.65, 0]]) b.add(c.slab(w, 0.7, d, steel, dx, 0.35, dz)); b.add(c.slab(1.3, 0.04, 1.0, rubber, 0, 0.02, 0)); for (let i = 0; i < 9; i++) plush(b, rnd(-0.45, 0.45), 0.05 + (i > 5 ? 0.3 : 0), rnd(-0.3, 0.3), 0.9); c.post(X(x), z, 0.8); c.clickable(b, () => { c.sound.squeak(); c.toast(['Plush. Soft, cheap, and it still has to say something.', 'Plush. Nobody ever burned one.', 'Plush. Squeeze it, it squeaks, it does not mint.'][(Math.random() * 3) | 0], 2600); }, 'A bin of plush'); return b; };
    bin(3.4, -5.6); bin(16.6, -5.6); bin(16.6, 0.4);
    for (let i = 0; i < 6; i++) { plush(g, 0.9, 3.16, -7.0 + i * 1.5, 0.8); plush(g, 19.1, 3.16, -7.0 + i * 1.5, 0.8); plush(g, 0.9, 4.16, -6.4 + i * 1.5, 0.7); }
    for (let i = 0; i < 5; i++) g.add(c.slab(0.5, 0.42, 0.5, c.surf('paint', 1, [0xc8a060, 0xb89050, 0xd0b070][i % 3]), 19.0, 4.37, -6.6 + i * 1.7));
    // the claw machine. A cabinet, a glass box, a bed of plush with two figures in it, a claw on a gantry, a chute.
    const mc = new THREE.Group(); mc.position.set(15.2, 0, -2.6); mc.rotation.y = -PI / 2; g.add(mc);
    const cabM = c.surf('paint', 1, 0xc02030), MW = 1.6, MD = 1.3, MH = 0.9;
    mc.add(c.slab(MW, MH, MD, cabM, 0, MH / 2, 0)); mc.add(c.slab(MW + 0.1, 0.06, MD + 0.1, steel, 0, MH + 0.03, 0)); mc.add(c.slab(MW + 0.1, 0.12, MD + 0.1, cabM, 0, MH + 1.56, 0));
    for (const dx of [-MW / 2, MW / 2]) for (const dz of [-MD / 2, MD / 2]) mc.add(c.slab(0.06, 1.5, 0.06, steel, dx, MH + 0.8, dz));
    for (const [w, d, dx, dz] of [[MW, 0.02, 0, MD / 2], [MW, 0.02, 0, -MD / 2], [0.02, MD, MW / 2, 0], [0.02, MD, -MW / 2, 0]]) mc.add(c.slab(w, 1.5, d, glassM, dx, MH + 0.8, dz));
    mc.add(c.slab(MW - 0.1, 0.06, MD - 0.1, c.surf('velvet', 1, 0x9a6cff), 0, MH + 0.09, 0));
    const chute = c.slab(0.36, 0.02, 0.36, basic(c, 0x050505), -0.6, MH + 0.125, 0.42); mc.add(chute); mc.add(c.slab(0.4, 0.16, 0.02, steel, -0.6, MH + 0.2, 0.24)); mc.add(c.slab(0.02, 0.16, 0.4, steel, -0.4, MH + 0.2, 0.42));
    const flap = c.sign('PRIZE', { w: 0.36, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800, px: 64 }); flap.position.set(-0.6, 0.5, MD / 2 + 0.01); mc.add(flap);
    const items = []; const addItem = (x, kind, nm, build) => { const o = build(); o.position.set(x, MH + 0.12, 0); items.push({ o, x, kind, nm, home: o.position.clone(), taken: false }); };
    [[-0.2, 0xf5c542], [0.6, 0xff8fc0], [0.1, 0x7fff9a], [-0.5, 0x22d3ee], [0.35, 0xf4ead2]].forEach(([x, col]) => addItem(x, 'plush', 'plush', () => plush(mc, 0, 0, 0, 0.75, col)));
    addItem(-0.35, 'figure', 'Patient Panda', () => { const o = new THREE.Group(); mc.add(o); c.glb('vf_panda', { h: 0.36, parent: o, shadow: false }); return o; });
    addItem(0.45, 'figure', 'Gary Bee', () => { const o = new THREE.Group(); mc.add(o); c.glb('vf_bee', { h: 0.36, parent: o, shadow: false }); return o; });
    const rail = c.slab(MW - 0.1, 0.05, 0.05, steel, 0, MH + 1.42, 0); mc.add(rail);
    const carriage = new THREE.Group(); carriage.position.set(0, MH + 1.42, 0); mc.add(carriage); carriage.add(c.slab(0.16, 0.12, 0.16, std(c, 0x222228), 0, 0, 0));
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), steel); carriage.add(cable);
    const claw = new THREE.Group(); mc.add(claw); claw.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), steel));
    const prongs = []; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, pg = new THREE.Group(); pg.rotation.y = a; claw.add(pg); const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.3, 6), steel); pr.position.set(0.08, -0.13, 0); pr.rotation.z = 0.5; pg.add(pr); const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.1, 6), steel); tip.position.set(0.14, -0.3, 0); tip.rotation.z = -0.3; pg.add(tip); prongs.push(pg); }
    const panel = c.slab(MW, 0.1, 0.36, cabM, 0, MH + 0.05, MD / 2 + 0.18); mc.add(panel);
    const stick = new THREE.Group(); stick.position.set(-0.4, MH + 0.1, MD / 2 + 0.18); mc.add(stick); stick.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 16), std(c, 0x111111))); const rod = c.slab(0.02, 0.18, 0.02, steel, 0, 0.09, 0); stick.add(rod); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), std(c, 0xff2020, { roughness: 0.3 })); knob.position.y = 0.2; stick.add(knob);
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), std(c, 0xff2020, { roughness: 0.3, emissive: 0x400000 })); drop.position.set(0.4, MH + 0.12, MD / 2 + 0.18); mc.add(drop);
    const dropS = c.sign('DROP', { w: 0.2, h: 0.08, bg: null, fg: '#f4f4f0', font: c.MONO, weight: 900, px: 48 }); dropS.position.set(0.4, MH + 0.105, MD / 2 + 0.3); dropS.rotation.x = -PI / 2; mc.add(dropS);
    const top = c.sign('THE HONEST CLAW\nIT NEVER DROPS A WIN', { w: 1.5, h: 0.5, bg: '#111', fg: '#f5c542', font: c.SERIF, weight: 900, px: 128, border: '#f5c542' }); top.position.set(0, MH + 1.95, MD / 2 - 0.1); mc.add(top); mc.add(c.slab(1.6, 0.56, 0.1, cabM, 0, MH + 1.95, MD / 2 - 0.18));
    const slot = c.sign('ONE TOKEN · NO REFUNDS', { w: 0.5, h: 0.08, bg: '#f5c542', fg: '#111', font: c.MONO, weight: 800, px: 40 }); slot.position.set(0.2, 0.5, MD / 2 + 0.01); mc.add(slot);
    c.wall(X(14.3), -3.5, X(16.1), -3.5); c.wall(X(14.3), -1.7, X(16.1), -1.7); c.wall(X(14.3), -3.5, X(14.3), -1.7); c.wall(X(16.1), -3.5, X(16.1), -1.7);
    const CL = { x: 0, dir: 1, st: 'idle', y: MH + 1.3, held: null, grip: 0, wins: 0 };
    const setClaw = () => { claw.position.set(CL.x, CL.y, 0); carriage.position.x = CL.x; cable.scale.y = Math.max(0.05, MH + 1.42 - CL.y); cable.position.y = -cable.scale.y / 2; prongs.forEach((p) => { p.rotation.x = 0; p.children[0].rotation.z = 0.5 - CL.grip * 0.45; p.children[1].rotation.z = -0.3 - CL.grip * 0.4; }); if (CL.held) CL.held.o.position.set(CL.x, CL.y - 0.33, 0); };
    c.clickable(stick, () => { if (CL.st !== 'idle') return; CL.dir *= -1; CL.x = Math.max(-0.62, Math.min(0.62, CL.x + CL.dir * 0.22)); rod.rotation.z = -CL.dir * 0.35; knob.position.x = -CL.dir * 0.07; c.sound.click(); }, 'The joystick');
    c.clickable(drop, () => { if (CL.st !== 'idle') { c.toast('The claw is busy.', 1200); return; } CL.st = 'down'; c.sound.beep(600, 0.08, 0.15); }, 'DROP');
    c.clickable(dropS, () => drop.userData.click && drop.userData.click(), 'DROP');
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      if (CL.st === 'idle') { CL.x += CL.dir * 0.16 * dt; if (Math.abs(CL.x) > 0.62) { CL.x = Math.sign(CL.x) * 0.62; CL.dir *= -1; } CL.grip += (0 - CL.grip) * Math.min(1, dt * 4); }
      else if (CL.st === 'down') { CL.y -= 0.9 * dt; if (CL.y <= MH + 0.42) { CL.y = MH + 0.42; let best = null, bd = 0.21; items.forEach((it) => { const d = Math.abs(it.x - CL.x); if (!it.taken && d < bd) { bd = d; best = it; } }); CL.held = best; if (best) best.taken = true; CL.st = 'grip'; CL.gt = t; c.sound.tick(); } }
      else if (CL.st === 'grip') { CL.grip = Math.min(1, (t - CL.gt) * 3); if (CL.grip >= 1) CL.st = 'up'; }
      else if (CL.st === 'up') { CL.y += 0.8 * dt; if (CL.y >= MH + 1.3) { CL.y = MH + 1.3; if (CL.held) CL.st = 'carry'; else { CL.st = 'idle'; c.toast('The claw closed on air. Honest claw, bad timing.', 2200); } } }
      else if (CL.st === 'carry') { CL.x += (-0.6 - CL.x) * Math.min(1, dt * 1.6); if (Math.abs(CL.x + 0.6) < 0.015) { CL.x = -0.6; CL.st = 'release'; CL.gt = t; } }
      else if (CL.st === 'release') { CL.grip = Math.max(0, 1 - (t - CL.gt) * 3); const h = CL.held; if (h) { h.o.position.y -= 2.2 * dt; h.o.position.z += (0.42 - h.o.position.z) * Math.min(1, dt * 4); if (h.o.position.y < MH - 0.2) { h.o.visible = false; CL.held = null; c.sound.thud(0.25);
        if (h.kind === 'figure') { CL.wins++; c.sound.ding(); c.flash(0.3); c.toast(`${h.nm}. Out of the chute, into your hands. The claw does not drop a win.`, 3000); c.egg('toys_claw', 'You won a figure from the claw. The claw at the toy store took your money and kept the panda. This one is honest. It only ever had to be over one.'); }
        else c.toast(['Plush. The claw is honest, it just has taste. Try again.', 'Plush. Soft prize, hard truth: you dropped it on the wrong thing.', 'Plush. It is yours. It is also plush.'][(Math.random() * 3) | 0], 2600);
        setTimeout(() => { h.o.position.copy(h.home); h.o.visible = true; h.taken = false; }, 4000); } }
        if (!CL.held && CL.grip <= 0) CL.st = 'idle'; }
      setClaw();
      plushes.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.8 + i) * 0.04 + (p.userData.z0 ??= p.rotation.z); });
    });
    setClaw();
    // the checkout nook: a counter, a belt, a till, a price gun, a lane light with a five on it
    const ck = new THREE.Group(); ck.position.set(2.4, 0, 6.85); g.add(ck);
    ck.add(c.slab(3.6, 1.0, 0.8, oak, 0, 0.5, 0)); ck.add(c.slab(3.7, 0.05, 0.9, c.surf('marble2', 1, 0xd8d0c8), 0, 1.02, 0)); ck.add(c.slab(1.6, 0.05, 0.56, rubber, -0.8, 1.06, 0)); for (const dx of [-1.6, 0]) ck.add(c.slab(0.04, 0.08, 0.6, steel, dx, 1.06, 0));
    const gun = new THREE.Group(); gun.position.set(0.1, 1.05, -0.2); gun.rotation.y = 0.6; ck.add(gun); gun.add(c.slab(0.22, 0.09, 0.07, std(c, 0xff7a1a, { roughness: 0.5 }), 0, 0.045, 0)); const grip = c.slab(0.05, 0.12, 0.05, std(c, 0xff7a1a, { roughness: 0.5 }), 0.06, -0.06, 0); grip.rotation.z = 0.3; gun.add(grip); const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 14), std(c, 0xf4f4f0)); roll.position.set(-0.07, 0.12, 0); roll.rotation.x = PI / 2; gun.add(roll);
    c.clickable(gun, () => { c.sound.tick(); c.sound.pop(); c.egg('toys_gun', 'The price gun. It will not tell you what a panda in a box went for in 2022, and neither will I. Everything in here is underpriced until it is not.'); }, 'The price gun');
    ck.add(c.slab(0.05, 2.6, 0.05, steel, 1.5, 2.3, 0)); const lane = c.sign('5', { w: 0.4, h: 0.5, bg: '#125740', fg: '#ffffff', font: c.SERIF, weight: 900, px: 128, border: '#ffffff' }); lane.position.set(1.5, 3.6, 0.03); lane.rotation.y = PI; ck.add(lane); const laneL = glow(c, '#7fff9a', 0.7); laneL.position.set(1.5, 3.95, 0); ck.add(laneL);
    const chk = c.sign('CHECKOUT · CASH OR CRYPTO', { w: 1.8, h: 0.24, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800 }); chk.position.set(0, 2.4, -0.4); chk.rotation.y = PI; ck.add(chk); ck.add(c.slab(0.03, 1.3, 0.03, steel, -0.9, 1.75, -0.4)); ck.add(c.slab(0.03, 1.3, 0.03, steel, 0.9, 1.75, -0.4));
    for (let i = 0; i < 4; i++) { const bag = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), std(c, 0xf4f4f0, { side: THREE.DoubleSide, roughness: 0.95 })); bag.position.set(1.0 + i * 0.12, 0.8, 0.44); ck.add(bag); }
    for (let i = 0; i < 6; i++) ck.add(c.slab(0.16, 0.05, 0.08, std(c, PL[i % PL.length]), -1.6 + i * 0.2, 1.08 + (i % 2) * 0.05, 0.3));
    g.add(c.slab(0.1, 1.3, 1.4, backM, 4.5, 0.65, 7.1)); c.wall(X(0.5), 6.4, X(4.5), 6.4); c.wall(X(4.5), 6.4, X(4.5), 8);
    // the Christmas lights, strung along the shelf tops, over the till and across the claw
    const tw = [fairy(c, g, [[1.6, 4.6, -7.6], [1.6, 4.6, 1.6]], 22), fairy(c, g, [[18.4, 4.6, -7.6], [18.4, 4.6, 1.6]], 22), fairy(c, g, [[0.6, 3.2, 7.4], [4.4, 3.4, 7.4]], 10), fairy(c, g, [[13.6, 3.6, -3.4], [16.8, 3.6, -3.4]], 8)];
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tw.forEach((f) => f(t)); });
    const title = c.sign('THE TOY AISLE · TEN FIGURES · MACY\'S AND TOYS R US · OCTOBER 2022', { w: 5.4, h: 0.32, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800 }); title.position.set(10, 5.3, -7.86); g.add(title);
    const aisle = c.sign('AISLE 5 · COLLECTIBLES · PLUSH · CLAW', { w: 2.2, h: 0.3, bg: '#f4ead2', fg: '#111', font: c.FONT, weight: 900 }); aisle.position.set(10, 5.2, 7.86); aisle.rotation.y = PI; g.add(aisle);
    extra(c, g, 6.4, -4.0, { col: 0x3a4a6a, ry: 1.2 }); c.post(X(6.4), -4.0, 0.3); extra(c, g, 13.0, 3.0, { col: 0xff8fc0, ry: -2.0 }); c.post(X(13.0), 3.0, 0.3);
    plaque(c, g, 17.2, 3.6, -7.86, 0, 'Put the thing where the people already are.', 'MACY\'S, OCTOBER 2022', 1.5);
  },
};

// the props per room: Poly Haven CC0 ids (files ph_<id>.glb), [name, x, z, { h | len, ry, y, r, egg: [hint, id, line], snd }]
export const PROPS_B = {
  burn: [
    ['boulder_01', 2.0, -6.4, { len: 1.6, r: 0.9 }], ['boulder_01', 17.2, 5.4, { len: 1.1, r: 0.6, ry: 1.1 }],
    ['coast_rocks_01', 5.6, -6.0, { len: 2.4, r: 1.2 }], ['coast_rocks_02', 14.4, 5.0, { len: 1.8, r: 0.9, ry: 1.2 }],
    ['coast_rocks_01', 1.8, 0.3, { len: 1.8, r: 0.9, ry: 2.2 }], ['coast_rocks_02', 18.4, 1.0, { len: 1.5, r: 0.75, ry: 0.4 }],
    ['Lantern_01', 16.3, -4.6, { h: 0.4, y: 0.5 }], ['Lantern_01', 12.6, 3.6, { h: 0.4 }],
  ],
  goat: [
    ['Chandelier_02', 10, -2, { h: 1.2, y: 5.4 }],
    ['ArmChair_01', 14.6, -6.6, { h: 1.0, ry: 2.6, r: 0.5 }], ['side_table_01', 15.6, -6.0, { h: 0.6, r: 0.3 }], ['brass_goblets', 15.6, -6.0, { len: 0.3, y: 0.6 }], ['brass_vase_01', 15.6, -6.0, { h: 0.4, y: 0.6 }],
    ['potted_plant_02', 0.9, 6.3, { h: 1.6, r: 0.4 }],
  ],
  middle: [
    ['painted_wooden_bench', 6.4, 5.4, { len: 2.0, ry: 0, r: 0.8 }], ['painted_wooden_bench', 15.6, 5.4, { len: 2.0, ry: 0, r: 0.8 }],
    ['plastic_crate_02', 4.4, 5.3, { h: 0.4, r: 0.3 }], ['plastic_bottle_gallon', 4.4, 5.3, { h: 0.3, y: 0.4 }],
    ['wall_clock', 0.2, 4.0, { h: 0.5, y: 4.2, ry: PI / 2 }], ['Megaphone_01', 17.4, 5.3, { len: 0.4, ry: -1.0 }],
    ['mounted_fluorescent_lights', 6, 2, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 2, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 6, -3, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, -3, { len: 1.3, y: 5.85 }],
  ],
  toys: [
    ['CashRegister_01', 3.3, 6.85, { h: 0.42, y: 1.05, ry: PI, egg: ['The till', 'toys_till', 'The till. A toy store rings up a panda the way a liquor store rings up a bottle, and he has stood behind both counters. Everything is retail if you squint.'], snd: 'ding' }],
    ['steel_frame_shelves_03', 13.8, -6.8, { h: 2.0, ry: 0, r: 0.7 }], ['steel_frame_shelves_01', 2.8, 1.2, { h: 2.0, ry: -PI / 2, r: 0.7 }],
    ['rubber_duck_toy', 1.0, -3.3, { len: 0.24, y: 3.16 }], ['rubber_duck_toy', 19.0, -0.2, { len: 0.24, y: 3.16, ry: 2 }], ['chess_set', 19.0, -5.4, { len: 0.42, y: 3.16 }],
    ['baseball_01', 1.0, 0.4, { len: 0.1, y: 3.16 }], ['cassette_player', 1.0, -5.8, { len: 0.36, y: 3.16, ry: PI / 2 }],
    ['Ukulele_01', 13.8, -6.8, { len: 0.6, y: 1.0, ry: 0 }], ['Television_01', 2.8, 1.2, { len: 0.7, y: 1.0, ry: -PI / 2 }],
    ['mounted_fluorescent_lights', 6, -3, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, -3, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 10, 3, { len: 1.3, y: 5.85 }],
    ['security_camera_01', 19.6, -7.4, { h: 0.3, y: 5.4, ry: 2.4 }],
  ],
};

// where the twelve New Yorkers hang: on the cliff faces at Burn Island, off the gift wall at the Goat's, above the stands
// at the court, above the counter and the shelves on the aisle
export const SLOTS_B = {
  burn: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.4, z: 7.48, ry: PI, w: 1.4 }); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.89, y: 2.4, z, ry: PI / 2, w: 1.3 })); [-4.2, -1.8].forEach((z) => S.push({ x: 18.91, y: 4.4, z, ry: -PI / 2, w: 1.3 })); return S; },
  goat: () => { const S = []; for (const y of [2.4, 4.4]) [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y, z, ry: PI / 2, w: 1.3 })); S.push({ x: 1.6, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 }, { x: 16.6, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); [2.2, 4.3].forEach((y) => S.push({ x: W - 0.14, y, z: 6.8, ry: -PI / 2, w: 1.3 })); return S; },
  middle: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 3.0, z: D / 2 - 0.14, ry: PI, w: 1.4 }); [-3.6, -1.2].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.3 })); [-3.6, -1.2].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.3 })); S.push({ x: 1.6, y: 2.4, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); return S; },
  toys: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 3.0, z: D / 2 - 0.14, ry: PI, w: 1.4 }); S.push({ x: 2.0, y: 4.3, z: -D / 2 + 0.14, ry: 0, w: 1.3 }, { x: 17.2, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 }); [2.2, 4.3].forEach((y) => S.push({ x: W - 0.14, y, z: 6.8, ry: -PI / 2, w: 1.3 })); S.push({ x: 0.14, y: 3.4, z: 6.8, ry: PI / 2, w: 1.3 }); return S; },
};
