// COMING // GOING. A subway platform whose ads are lenticular: each picture is a wall of thin prisms, one face of
// every prism carries a slice of word A and the other a slice of word B. Walk past from the west and it is PROFIT,
// from the east PROPHET, and dead centre both at once in stripes (the bus shelter frame, the funniest one).
// Real geometry, not a shader: the prisms are there, so the picture changes because of where you stand.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, art, artPlane } from './kit.js';
import { pairs, pairTex, openPair, plaque, label, dress } from './pairs.js';

// one lenticular panel: n prisms across w, each a ridge of two faces at `ang` off the wall
export function lenticular(c, p, w, h, n = 56, ang = 0.62) {
  const { THREE } = c, g = new THREE.Group(), s = w / n, d = (s / 2) * Math.tan(ang);
  const geo = (face) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + i * s, xm = x0 + s / 2, x1 = x0 + s, u0 = i / n, u1 = (i + 1) / n;
      const [xa, za, xb, zb] = face === 'a' ? [x0, 0, xm, d] : [xm, d, x1, 0];
      const k = pos.length / 3;
      pos.push(xa, -h / 2, za, xb, -h / 2, zb, xb, h / 2, zb, xa, h / 2, za); uv.push(u0, 0, u1, 0, u1, 1, u0, 1);
      idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); bg.computeVertexNormals(); return bg;
  };
  // face a leans toward the west (the viewer on the left sees it), face b toward the east
  for (const side of ['a', 'b']) g.add(new THREE.Mesh(geo(side), new THREE.MeshBasicMaterial({ map: pairTex(c, p, side), toneMapped: false })));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.12, h + 0.12), std(c, 0x111111)); back.position.z = -0.01; g.add(back);
  return g;
}

// white subway tile, the old IRT kind (the doors room uses it too)
export function tileTex(c) {
  return c.canvasTex(512, 512, (q, w, h) => {
    q.fillStyle = '#e9e6dc'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(80,76,66,.35)'; q.lineWidth = 3;
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) { q.strokeRect(x, y, 64, 32); q.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.2})`; q.fillRect(x + 6, y + 4, 22, 4); }
  });
}

export function platform(c, r, g, X) {
  const { THREE } = c, HI = r.h, P = pairs('platform');
  // the platform: the yellow tactile edge runs straight into the plate, so the photograph's tracks are this platform's
  g.add(box(c, 1.1, 0.014, 9.2, std(c, 0xe8c020, { roughness: 0.7 }), 6.2, 0.007, -3.4));
  // the track bed runs from the plate to a bumper at z 1.2, so the west door still opens onto platform
  c.wall(X(5.6), -D / 2 + 1.2, X(5.6), 1.2); c.wall(X(0), 1.2, X(5.6), 1.2);
  g.add(box(c, 5.6, 0.02, 9.2 - 0.0, std(c, 0x14130f, { roughness: 0.95 }), 2.8, -0.012, -3.4));
  const rail = std(c, 0x7a7a80, { metalness: 0.85, roughness: 0.3 });
  for (const x of [1.6, 3.1]) g.add(box(c, 0.08, 0.12, 9.2, rail, x, 0.05, -3.4));
  g.add(box(c, 4.2, 0.9, 0.5, std(c, 0xff6b00, { roughness: 0.6 }), 2.4, 0.45, 1.0));   // the bumper block, safety orange
  for (let z = -7.2; z < 1.0; z += 0.62) g.add(box(c, 2.4, 0.05, 0.22, std(c, 0x3a2a1a), 2.35, 0.02, z));
  // the blue I beam columns, a row along the platform, rivets painted over a hundred times
  const col = std(c, 0x24467a, { roughness: 0.45, metalness: 0.5 });
  for (const z of [-0.6, 3.8]) for (const x of [9.2, 14.8]) { g.add(box(c, 0.34, HI, 0.34, col, x, HI / 2, z)); g.add(box(c, 0.5, 0.12, 0.5, col, x, HI - 0.06, z)); c.post(X(x), z, 0.32); }
  // station signs hung from the ceiling, in quotation marks
  for (const [z, t] of [[1.6, '"UPTOWN" // "DOWNTOWN"'], [5.6, '"COMING" // "GOING"']]) { const s = c.sign(t, { w: 3.4, h: 0.38, bg: '#0d0d0d', fg: '#f4ead2', font: c.FONT, weight: 800 }); s.position.set(12, HI - 0.9, z); s.rotation.y = -PI / 2; g.add(s); const s2 = s.clone(); s2.rotation.y = PI / 2; g.add(s2); }

  // ---- the lenticular ads: four on the south wall, one on each side wall, so the plate stays clear ----
  const PW = 2.1, PH = PW * 1.35;
  const spots = [[7.6, D / 2 - 0.05, PI], [11.2, D / 2 - 0.05, PI], [14.8, D / 2 - 0.05, PI], [18.2, D / 2 - 0.05, PI, 1.7], [W - 0.45, -4.6, -PI / 2], [W - 0.45, -0.9, -PI / 2, 0.86]];   // this room's east face is at W - 0.37
  const live = [];
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry, ws = 1] = spots[k], w = PW * Math.min(1, ws), h = w * 1.35;
    const L = lenticular(c, p, w, h); L.position.set(x, 0.55 + h / 2, z); L.rotation.y = ry; g.add(L);
    // the ad frame: brushed steel, the kind with the plexi and the screws
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.05), std(c, 0x9aa0a8, { metalness: 0.8, roughness: 0.35 })); fr.position.copy(L.position); fr.rotation.y = ry; fr.translateZ(-0.04); g.add(fr);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ visible: false })); hit.position.copy(L.position); hit.rotation.y = ry; hit.translateZ(0.08); g.add(hit);
    c.clickable(hit, () => openPair(c, p, ['lenticular', 'Every ad on this platform is a row of prisms. Walk past one way and the word changes under you; stand dead centre and it is both at once, in stripes: the bus shelter frame.']), label(p));
    const pl = plaque(c, g, p, 0, 0, 0, ry, Math.min(1.8, w * 0.82)); pl.position.copy(L.position); pl.position.y = 0.36; pl.translateZ(0.05);
    live.push({ p, x: r.x0 + x + Math.sin(ry) * 0, z, ry, side: Math.abs(Math.sin(ry)) > 0.5 });
  });
  // stand right in the middle of one and you get both: the seam egg
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return;
    for (const a of live) { const along = a.side ? Pl.z - a.z : Pl.x - a.x, off = a.side ? Math.abs(Pl.x - a.x) : Math.abs(Pl.z - a.z); if (off < 5 && Math.abs(along) < 0.18 && !a.said) { a.said = true; c.egg('seam', `Dead centre: ${label(a.p)} at the same time, in stripes. Same difference.`); } if (Math.abs(along) > 1) a.said = false; }
  });

  // ---- the furniture (Poly Haven CC0) and the riders ----
  dress(c, r, g, X, [
    ['painted_wooden_bench', 12, 6.9, { len: 2.2, ry: PI, r: 0.6 }], ['painted_wooden_bench', 17.2, 0.2, { len: 2.2, ry: -PI / 2, r: 0.6 }],
    ['metal_trash_can', 16.6, 6.9, { h: 0.9, r: 0.35 }], ['WetFloorSign_01', 8.2, 2.6, { h: 0.6, ry: 0.5, r: 0.3, egg: ['"WET FLOOR"', 'wetfloor', '"WET FLOOR". It has been wet since 1904. Same difference.'] }],
    ['security_camera_01', 19.5, -7.2, { h: 0.35, y: 3.4, ry: -2.4 }], ['mounted_fluorescent_lights', 12, -6, { len: 1.6, y: HI - 0.12 }], ['mounted_fluorescent_lights', 12, 4, { len: 1.6, y: HI - 0.12 }],
  ], [
    ['writer', 10.6, -2.6, 2.6, 'Every ad on this platform changes when I walk past. I have missed four trains finding out why.'],
    ['susan', 16.2, 4.8, -1.2], ['tracksuit', 13.4, 6.2, 3.0, 'Uptown it says PROFIT. Downtown it says PROPHET. I am going to Queens, so I get both.'], ['sonny', 8.6, -6.2, 0.4],
  ]);
  // the ticket machine that sells BUY and prints BY
  const mvm = new THREE.Group(); mvm.position.set(19.3, 0, 6.4); mvm.rotation.y = -PI / 2; g.add(mvm);
  mvm.add(box(c, 0.9, 1.7, 0.6, std(c, 0x2a2a30, { metalness: 0.6, roughness: 0.4 }), 0, 0.85, 0));
  const scr = c.sign('BUY // BY', { w: 0.6, h: 0.3, bg: '#081018', fg: '#5cf0ff', font: c.MONO, weight: 800, glow: 0.6 }); scr.position.set(0, 1.35, 0.31); mvm.add(scr);
  c.post(X(19.3), 6.4, 0.5);
  c.clickable(scr, () => { c.sound.ticket(); c.egg('metrocard', 'The machine sells one ride, BUY, and gives you the receipt, BY. It is the cheapest diptych in the city.'); }, 'The ticket machine');
  // a busker by the stairs with his case open
  const b = c.glb('folksinger', { h: 1.75, x: 9.0, z: 6.2, ry: 2.8, parent: g }); c.post(X(9.0), 6.2, 0.35);
  g.add(box(c, 0.6, 0.12, 0.35, std(c, 0x3a2414, { roughness: 0.6 }), 9.6, 0.06, 5.6));   // the open guitar case
  c.clickable(b, () => { c.say(b, 'I only know songs where the words sound like other words. Request one.', 3600, 2.1); c.egg('busker'); }, 'The busker');
}
