// BROADWAY UNDER THE J. Marcy Avenue, Williamsburg. The el runs overhead on riveted columns; every few minutes a train
// goes over and the whole street shakes, the light through the ties strobes, the paper in the gutter lifts. The trick
// is the curb: whatever leaves 4F upstairs, month by month, is out here on the sidewalk, and the neighbours pick it over.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, prop, cast, extra, glowTex, paperWind, sheet, CH, LEAVES, FURN, decal, eyeFlower } from './kit.js';

const COLS = [4.2, 15.8], ZS = [6.5, 0.5, -5.5];
// where each departed piece lands on the east sidewalk: [x, z, ry]
const CURB = { 1: [[18.6, -6.4, 2.6]], 2: [[17.6, -5.2, -0.6]], 3: [[19.1, -4.7, 0.3]], 4: [[18.2, -3.4, 0.2], [17.3, -2.4, 1.2], [19.2, -2.6, -2.2]], 6: [[19.5, -1.2, -PI / 2]],
  7: [[17.4, -0.7, 0], [17.9, -0.2, 0]], 8: [[18.4, 0.7, -PI / 2]], 9: [[17.3, 1.4, 0.8]], 10: [[18.0, -4.3, 0.1]], 11: [[17.2, -6.6, 0.9]], 12: [[19.4, 1.5, 0]] };

export function street(c, r, g, X) {
  const { THREE } = c;
  // sidewalks either side of Broadway, a curb you step up
  const walk = c.surf('concrete', 2.2, 0x7a7c84);
  g.add(c.slab(3, 0.15, D, walk, 1.5, 0.075, 0)); g.add(c.slab(3, 0.15, D, walk, W - 1.5, 0.075, 0));
  const curbM = std(c, 0x5a5c64, { roughness: 0.6 }); g.add(c.slab(0.18, 0.16, D, curbM, 3.0, 0.08, 0)); g.add(c.slab(0.18, 0.16, D, curbM, W - 3.0, 0.08, 0));
  r.ground = (x, z) => (x < 3.05 || x > W - 3.05 ? 0.15 : 0);
  // the crosswalk, worn
  const zebra = std(c, 0xd8d4c8, { roughness: 0.7 });
  for (let i = 0; i < 9; i++) { const s = c.slab(0.5, 0.012, 2.6, zebra, 4.6 + i * 1.3, 0.006, -3.0); g.add(s); }
  for (let i = 0; i < 16; i++) g.add(c.slab(0.14, 0.012, 1.4, std(c, 0xe8c020, { roughness: 0.7 }), W / 2 + (i % 2 ? 0.12 : -0.12), 0.006, 7.4 - i * 1.0 - (i % 2) * 0.0));

  // ---- the el: riveted green columns, girders, ties overhead ----
  const green = std(c, 0x2c4a3c, { roughness: 0.55, metalness: 0.55 }), rivet = std(c, 0x3a5a48, { metalness: 0.6, roughness: 0.4 });
  const DECK = 7.6;
  for (const x of COLS) for (const z of ZS) {
    const col = new THREE.Group(); col.position.set(x, 0, z); g.add(col);
    col.add(box(c, 0.9, 0.5, 0.9, std(c, 0x6a6a64, { roughness: 0.9 }), 0, 0.25, 0));   // the concrete footing
    col.add(box(c, 0.46, DECK, 0.12, green, 0, DECK / 2, 0.2)); col.add(box(c, 0.46, DECK, 0.12, green, 0, DECK / 2, -0.2)); col.add(box(c, 0.1, DECK, 0.42, green, 0, DECK / 2, 0));
    const rg = new THREE.SphereGeometry(0.022, 6, 4), rv = new THREE.InstancedMesh(rg, rivet, 60); let k = 0; const o = new THREE.Object3D();
    for (let y = 0.7; y < DECK - 0.2 && k < 60; y += 0.42) for (const s of [-1, 1]) for (const dz of [0.27, -0.27]) { if (k >= 60) break; o.position.set(s * 0.16, y, dz); o.updateMatrix(); rv.setMatrixAt(k++, o.matrix); }
    rv.count = k; col.add(rv);
    col.add(box(c, 0.9, 0.5, 0.9, green, 0, DECK - 0.3, 0));   // the capital bracket
    c.post(X(x), z, 0.5);
  }
  // girders along Broadway and across it
  for (const x of COLS) g.add(box(c, 0.5, 0.9, D + 0.4, green, x, DECK + 0.1, 0));
  for (const z of ZS) g.add(box(c, COLS[1] - COLS[0] + 1, 0.7, 0.4, green, W / 2, DECK + 0.05, z));
  // two track bands of ties, open between them: from below you see the train go over in the gaps
  const tieG = new THREE.BoxGeometry(4.6, 0.18, 0.22), tieM = std(c, 0x241a14, { roughness: 0.9 }), NT = Math.floor(D / 0.5) * 2, ties = new THREE.InstancedMesh(tieG, tieM, NT), to = new THREE.Object3D();
  let n = 0; for (const x of [6.9, 13.1]) for (let z = -D / 2; z < D / 2; z += 0.5) { to.position.set(x, DECK + 0.65, z); to.updateMatrix(); ties.setMatrixAt(n++, to.matrix); }
  g.add(ties);
  const railM = std(c, 0x8a8a90, { metalness: 0.9, roughness: 0.3 });
  for (const x of [6.9, 13.1]) for (const s of [-0.72, 0.72]) g.add(box(c, 0.08, 0.14, D, railM, x + s, DECK + 0.82, 0));
  // sodium lamps hung under the el
  const lampHeads = [];
  for (const z of [3.5, -2.5]) { const L = new THREE.Group(); L.position.set(W / 2, DECK - 0.2, z); g.add(L); L.add(cyl(c, 0.02, 0.02, 0.6, std(c, 0x111111), 0, -0.3, 0, 6)); const sh = cyl(c, 0.05, 0.35, 0.22, std(c, 0x1a2a20, { metalness: 0.6 }), 0, -0.7, 0, 16); L.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), basic(c, 0xffa040)); b.position.y = -0.82; L.add(b); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,150,60,.5)'), transparent: true, depthWrite: false, toneMapped: false })); gl.scale.setScalar(2.2); gl.position.y = -0.85; L.add(gl); lampHeads.push(gl); }
  // the stripes of light the ties let through, lying on the wet street: they strobe when a train goes over
  const stripeT = c.canvasTex(64, 512, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { const gr = q.createLinearGradient(0, y, 0, y + 9); gr.addColorStop(0, 'rgba(255,160,70,0)'); gr.addColorStop(0.5, 'rgba(255,170,80,1)'); gr.addColorStop(1, 'rgba(255,160,70,0)'); q.fillStyle = gr; q.fillRect(0, y, w, 9); } });
  stripeT.wrapT = THREE.RepeatWrapping; stripeT.repeat.set(1, 2);
  const stripeM = new THREE.MeshBasicMaterial({ map: stripeT, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const x of [6.9, 13.1]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(4.2, D), stripeM); s.rotation.x = -PI / 2; s.position.set(x, 0.02, 0); g.add(s); }

  // ---- the train ----
  const train = new THREE.Group(); g.add(train); train.visible = false;
  for (let k = 0; k < 4; k++) c.glb('h_subway_car', { len: 15.4, x: 0, z: k * 15.8, ry: PI / 2, parent: train, shadow: false });
  const winGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 62), basic(c, 0xfff2c8, { transparent: true, opacity: 0.7 })); winGlow.position.set(0, -0.2, 23); winGlow.rotation.x = -PI / 2; train.add(winGlow);
  let next = 9, run = null, rides = 0;
  const pass = () => { run = { t: 0, dir: Math.random() < 0.5 ? 1 : -1 }; train.visible = true; train.position.x = run.dir > 0 ? 6.9 : 13.1; train.rotation.y = run.dir > 0 ? 0 : PI; c.sound.roar(0.7); setTimeout(() => c.sound.roar(0.5), 900); };
  const gust = paperWind(c, g, { x0: 3.4, x1: 16.6, y0: 0.05, y1: 2.6, z0: -7.5, z1: 7.5, n: 40, speed: 0.8, dir: -1 });
  c.tick((t, dt, P, ri) => {
    const here = Math.abs(ri - r.i) <= 0;
    if (!run) { if (here) next -= dt; if (next < 0) pass(); gust.gust += (0.35 - gust.gust) * Math.min(1, dt); return; }
    run.t += dt; const L = 64, s = run.t * 15, z = run.dir > 0 ? 40 - s : -100 + s;
    train.position.set(train.position.x, DECK + 0.95, z);
    const over = Math.max(0, 1 - Math.abs((z + (run.dir > 0 ? L / 2 : -L / 2))) / 34);   // how much of the train is over the room
    stripeM.opacity = 0.32 * (1 - over * 0.7) + (Math.sin(t * 60) > 0 ? over * 0.35 : 0);
    lampHeads.forEach((l) => { l.material.opacity = 1 - over * 0.5 * (Math.sin(t * 37) > 0 ? 1 : 0); });
    gust.gust = 0.35 + over * 2.2;
    if (here && over > 0.2) { c.shake(0.012 * over); if (Math.abs(P.x - r.x0 - train.position.x) < 3 && !run.counted) { run.counted = true; rides++; if (rides >= 2) c.egg('underj', 'Twice under the J. You stopped talking mid sentence both times, like everybody on Broadway. You live here now.'); } }
    if (s > 150) { run = null; train.visible = false; next = 26 + Math.random() * 20; }
  });

  // ---- the curb: the pile grows with the year ----
  const pile = [];
  Object.entries(CURB).forEach(([k, spots]) => { spots.forEach(([x, z, ry], j) => {
    const fm = (FURN[k] || [])[j] || (FURN[k] || [])[0]; if (!fm) return;
    const m = prop(c, r, g, X, fm[0], x, z, { ...fm[1], ry }); m.userData.k = +k; pile.push(m);
  }); });
  // the rug, rolled up and tied with string, against a column
  const rug = new THREE.Group(); rug.position.set(16.6, 0.15, -1.6); g.add(rug); rug.userData.k = 5; pile.push(rug);
  const rl = cyl(c, 0.16, 0.16, 1.9, std(c, 0x7a1e22, { roughness: 0.95 }), 0, 0.95, 0, 16); rl.rotation.z = 0.12; rug.add(rl);
  const free = c.sign('FREE', { w: 0.7, h: 0.32, bg: '#f2ede0', fg: '#141414', font: c.FONT, weight: 900 }); free.position.set(17.9, 1.1, -2.35); free.rotation.set(-0.2, -0.4, 0.05); g.add(free); free.userData.k = 1; pile.push(free);
  const key = new THREE.Group(); key.userData.k = 99; pile.push(key);
  const shown = (n) => pile.forEach((m) => { m.visible = n >= m.userData.k; });
  CH.on((n) => shown(n));
  const pileHit = c.slab(3.4, 1.2, 8.4, new THREE.MeshBasicMaterial({ visible: false }), 18.3, 0.75, -2.6); g.add(pileHit);
  c.clickable(pileHit, () => { const n = CH.n, gone = LEAVES.filter((l) => l.k <= n).map((l) => l.what); c.say(pileHit, gone.length ? `On the curb: ${gone.join(', ')}. Everything from 4F, carried down four floors.` : 'The curb is empty. Upstairs, 4F still has everything. Go up and tear the calendar.', 4800, 1.4); c.egg('curb'); }, 'The curb outside 4F');

  // ---- the block ----
  prop(c, r, g, X, 'fire_hydrant', 3.6, -6.6, { h: 0.85, r: 0.3, raw: false });
  prop(c, r, g, X, 'metal_trash_can', 2.4, -4.8, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'metal_trash_can', 2.5, -4.0, { h: 0.95, r: 0.35 });
  prop(c, r, g, X, 'street_lamp_01', 1.2, 1.5, { h: 4.8, r: 0.25 });
  c.glb('h_taxi', { len: 4.7, x: 4.0, z: 3.0, ry: 0, parent: g }); c.wall(X(3.1), 0.7, X(3.1), 5.3); c.wall(X(4.9), 0.7, X(4.9), 5.3); c.wall(X(3.1), 0.7, X(4.9), 0.7); c.wall(X(3.1), 5.3, X(4.9), 5.3);
  c.glb('storm_drain', { len: 0.9, x: 3.45, z: -1.2, ry: PI / 2, parent: g, shadow: false });
  // the stoop of the building: three brownstone steps and an iron rail each side
  { const bs = std(c, 0x5a3a2c, { roughness: 0.85 }), iron = std(c, 0x111114, { metalness: 0.6, roughness: 0.4 });
    for (let k = 0; k < 3; k++) g.add(box(c, 1.2 - k * 0.3, 0.18, 3.0, bs, W - 0.6 - k * 0.15 - (1.2 - k * 0.3) / 2 + 0.6, 0.15 + 0.09 + k * 0.18, 3.8));
    for (const z of [2.25, 5.35]) { g.add(box(c, 1.3, 0.04, 0.04, iron, W - 0.95, 1.2, z)); for (let k = 0; k < 4; k++) g.add(cyl(c, 0.015, 0.015, 0.9, iron, W - 1.55 + k * 0.38, 0.75, z, 6)); } }
  const rat = c.glb('rat', { len: 0.3, x: 2.9, z: -4.4, ry: 1.2, parent: g });
  c.clickable(rat, () => { c.sound.squeak(); c.egg('ratj', 'The only tenant on this block with a lease nobody can break.'); }, 'A rat');
  for (const [x, z, ry] of [[8.8, -5.4, 0.4], [9.4, -5.9, 2.2], [11.0, -6.4, -1.1]]) c.glb('pigeon', { len: 0.32, x, z, ry, parent: g });
  // the neighbour on a milk crate, watching the pile the way other people watch television
  const crate = box(c, 0.42, 0.32, 0.42, std(c, 0x1d4ed8, { roughness: 0.6 }), 16.0, 0.31, 2.2); g.add(crate); c.post(X(16.0), 2.2, 0.4);
  const nb = extra(c, g, 16.0, 2.2, { seated: true, col: 0x8a3a2a, ry: -0.9 }); nb.position.y = 0.15;
  c.clickable(nb, () => { c.say(nb, ['First of the month, every month, like a clock. Something else comes down those stairs.', 'Forty one years they were up there. I took the plant. The plant is doing fine.', 'You want the chair? Take the chair. Nobody is coming back for the chair.'][(Math.random() * 3) | 0], 4200, 1.7); c.egg('crate'); }, 'The neighbour on the crate');
  // the door of the building: number, buzzers, and the notice taped beside it
  const num = c.sign('N3W', { w: 0.9, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c.SERIF, weight: 900 }); num.position.set(W - 0.4, 4.0, 3.8); num.rotation.y = -PI / 2; g.add(num);
  const buzz = decal(c, 0.22, 0.5, (q, w, h) => { q.fillStyle = '#b8a070'; q.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { q.fillStyle = '#1a1a1a'; q.beginPath(); q.arc(w * 0.75, 14 + i * (h - 20) / 10, 4, 0, 7); q.fill(); q.fillStyle = '#f2ede0'; q.fillRect(6, 9 + i * (h - 20) / 10, w * 0.5, 9); } });
  buzz.position.set(W - 0.4, 1.4, 1.75); buzz.rotation.y = -PI / 2; g.add(buzz);
  const nt = sheet(c, g, 0, 0, 0); nt.rotation.set(0, -PI / 2, 0.04); nt.scale.setScalar(1.6); nt.position.set(W - 0.39, 1.6, 6.2);
  c.clickable(nt, () => { c.sound.tick(); c.egg('doornotice', 'Taped to the door of the building, the way they always are: seventy two hours, apartment 4F. Somebody has written under it in marker: WE ARE STILL HERE.'); }, 'The notice on the door');
  // bodega cat in the light of the corner store window
  const cat = c.glb('cat', { len: 0.5, x: 1.1, z: -6.8, ry: 0.6, parent: g });
  c.clickable(cat, () => { c.sound.meow(); c.egg('elcat', 'The bodega cat. Has outlived three landlords and one city marshal. Pays no rent, gets the good tuna.'); }, 'The bodega cat');
  // eviction notices in the gutter
  [[3.6, 4.2, 0.4], [5.1, -1.5, 1.4], [9.7, 6.4, 2.6], [12.8, 2.0, 0.2], [16.6, -4.1, -1.0]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, ['notice', 'pink', 'yellow'][k % 3], k));
  // an eye on the column where the el meets the street: the city watches the curb too
  const ey = decal(c, 0.9, 0.9, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.95)); ey.position.set(COLS[1] - 0.26, 3.2, 0.5); ey.rotation.y = -PI / 2; g.add(ey);
}
