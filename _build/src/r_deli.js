// OPEN // CLOSED. A deli on the corner where every picture is the sign that hangs in the door: two sided, on a
// string, word A on the front and word B on the back. Walk past quickly and the draft spins them; they wind up on
// the string, unwind, and settle on whichever side they settle on. Click one to give it a turn.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, steam } from './kit.js';
import { pairs, pairTex, openPair, plaque, label, dress } from './pairs.js';

export function deli(c, r, g, X) {
  const { THREE } = c, HI = r.h, P = pairs('deli');
  // ---- the counter runs along the east wall, the way a bodega's does, so the aisle in the photograph stays clear ----
  const steel = std(c, 0xb8bcc0, { metalness: 0.9, roughness: 0.3 });
  const CX = 17.4;   // the counter's front face line
  g.add(box(c, 0.9, 1.05, 6.8, std(c, 0xd8d0b8, { roughness: 0.4 }), CX + 0.45, 0.52, -3.4)); g.add(box(c, 1.0, 0.05, 6.9, steel, CX + 0.45, 1.07, -3.4));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 6.6), new THREE.MeshStandardMaterial({ color: 0xc8e8f0, transparent: true, opacity: 0.25, roughness: 0.05 })); glass.position.set(CX + 0.1, 1.4, -3.4); g.add(glass);
  c.wall(X(CX), -6.8, X(CX), 0); c.wall(X(CX), 0, X(W), 0);
  c.wall(X(4), -D / 2 + 1.0, X(16), -D / 2 + 1.0);   // the photograph starts here
  for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) { const roll = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), std(c, 0xd8a050, { roughness: 0.7 })); roll.scale.y = 0.6; roll.position.set(CX + 0.6 + (k % 2) * 0.2, 1.42, -6.2 + i * 1.3 + Math.floor(k / 2) * 0.2); g.add(roll); }
  // the counterman behind it, and the menu board hung over his head with its typos that are not typos
  const guy = c.glb('butcher', { h: 1.8, x: 19.0, z: -3.6, ry: -PI / 2, parent: g });
  c.clickable(guy, () => { c.say(guy, 'Salt pepper ketchup, or? I said OR. Not the boat thing.', 3600, 2.1); c.egg('counterman'); }, 'The counterman');
  const menu = c.canvasTex(1536, 512, (q, w, h) => {
    q.fillStyle = '#121212'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `900 56px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('"DELI" // "DELLY" · OPEN 24 // 7', w / 2, 70);
    const L = [['BACON EGG & CHEESE ON A ROLE', '4.50'], ['PLANE BAGEL W/ SCHMEAR', '3.25'], ['LEAK SOUP (ASK THE SUPER)', '6.00'], ['MEET BALL HERO', '9.00'], ['FLOWER TORTILLA WRAP', '8.50'], ['HOARSE RADISH ON THE SIDE', '0.75'], ['SERIAL, NINE DOLLARS, DO NOT ASK', '9.00'], ['THE CHOPPED CHEESE, SAME DIFFERENCE', '7.75']];
    q.font = `700 36px ${c.MONO}`; L.forEach(([a, b], i) => { const x = i < 4 ? 60 : w / 2 + 30, y = 150 + (i % 4) * 84; q.textAlign = 'left'; q.fillStyle = '#f4ead2'; q.fillText(a, x, y); q.textAlign = 'right'; q.fillStyle = '#ff7a1a'; q.fillText(b, x + w / 2 - 90, y); });
  });
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.8), new THREE.MeshBasicMaterial({ map: menu, toneMapped: false })); mb.position.set(W - 0.2, HI - 1.25, -3.4); mb.rotation.y = -PI / 2; g.add(mb);
  c.clickable(mb, () => c.egg('menu', 'Every line on the menu is spelled wrong on purpose. A bacon egg and cheese on a role. It is waiting for its big break.'), 'The menu');
  // the deli cat on the counter, the coffee urn steaming
  const cat = c.glb('cat', { h: 0.3, x: CX + 0.5, y: 1.1, z: -0.8, ry: -1.2, parent: g });
  c.clickable(cat, () => { c.sound.meow(); c.egg('delicat', 'The deli cat. It has heard every homophone in this city and has never once been impressed.'); }, 'The deli cat');
  const urn = cyl(c, 0.2, 0.2, 0.55, steel, CX + 0.5, 1.36, -6.4); g.add(urn); steam(c, g, CX + 0.5, 1.7, -6.4);
  c.clickable(urn, () => c.egg('urn', 'The coffee urn: EARN // URN. The guy on the e bike earns it, the urn pours it. One dollar.'), 'The coffee urn');
  // the shop around it (Poly Haven CC0): shelves down the west wall, crates, the register, the bananas
  dress(c, r, g, X, [
    ['CashRegister_01', CX + 0.5, -2.2, { h: 0.35, y: 1.09, ry: -PI / 2 }], ['bananas', CX + 0.5, -4.6, { h: 0.18, y: 1.09 }], ['wicker_basket_01', CX + 0.5, -5.4, { h: 0.25, y: 1.09 }],
    ['wooden_display_shelves_01', 0.5, -4.8, { h: 2.0, ry: PI / 2, r: 0.6 }], ['steel_frame_shelves_01', 0.5, -1.4, { h: 2.0, ry: PI / 2, r: 0.6 }], ['steel_frame_shelves_03', 2.6, 7.5, { h: 2.0, ry: PI, r: 0.6 }],
    ['plastic_crate_01', 3.2, 6.8, { h: 0.32 }], ['plastic_crate_02', 3.3, 6.8, { h: 0.32, y: 0.32, ry: 0.4 }], ['cardboard_box_01', 15.6, 6.9, { h: 0.5, ry: 0.3 }],
    ['plastic_bottle_gallon', 14.9, 7.1, { h: 0.32 }], ['WetFloorSign_01', 9.6, 5.8, { h: 0.6, ry: 0.4, r: 0.3 }], ['plastic_broom', 19.6, 6.8, { h: 1.4, ry: 0.2 }],
  ], [
    ['maria', 8.4, 4.2, 2.8, 'I come in for milk. I leave with a scratch off, a hero and a homophone.'], ['felix', 15.8, -1.0, 1.4, 'Bacon egg and cheese on a ROLE. He spells it like that every morning. I stopped correcting him in 2009.'], ['tough', 4.6, 2.4, -1.8],
  ]);
  // ---- the hanging signs: two sided, on strings, they spin when you pass ----
  const SW = 1.25, SH = SW / 0.74, signs = [];
  const spots = [[3.6, -1.6], [7.0, -0.4], [10.4, -1.6], [13.8, -0.4], [6.0, 3.4], [11.4, 3.4]];
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z] = spots[k], piv = new THREE.Group(); piv.position.set(x, HI - 0.02, z); g.add(piv);
    const len = HI - 0.6 - SH - 0.3;
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 4), basic(c, 0xd8d0c0)); str.position.y = -len / 2; piv.add(str);
    const card = new THREE.Group(); card.position.y = -len - SH / 2; piv.add(card);
    const fa = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'a'), toneMapped: false })); fa.position.z = 0.012; card.add(fa);
    const fb = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'b'), toneMapped: false })); fb.position.z = -0.012; fb.rotation.y = PI; card.add(fb);
    card.add(box(c, SW + 0.08, SH + 0.08, 0.02, std(c, 0x101010), 0, 0, 0));
    // the word on a strip at the bottom of each face, like the OPEN sign's red letters
    for (const [side, word, rz] of [[1, p.a, 0], [-1, p.b, PI]]) { const s = c.sign(word, { w: SW * 0.9, h: 0.2, bg: '#c81e1e', fg: '#fff', font: c.SERIF, weight: 900, px: 96 }); s.position.set(0, -SH / 2 + 0.16, side * 0.016); s.rotation.y = rz; card.add(s); }
    const st = { p, card, x: r.x0 + x, z, a: Math.random() * 0.4 - 0.2, v: 0 };
    signs.push(st);
    for (const f of [fa, fb]) c.clickable(f, () => { st.v += 9 + Math.random() * 6; c.sound.whoosh && c.sound.whoosh(0.3); c.egg('spin', 'Two sided, on a string. Whichever side it settles on is today\'s word. Same difference.'); if (st.v > 0) setTimeout(() => openPair(c, p), 900); }, `${label(p)} · give it a spin`);
    c.post(X(x), z, 0.45);
  });
  let px = 0, pz = 0, first = true;
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) { first = true; return; }
    const sp = first ? 0 : Math.hypot(Pl.x - px, Pl.z - pz) / Math.max(dt, 1e-3); first = false; px = Pl.x; pz = Pl.z;
    for (const s of signs) {
      const d = Math.hypot(Pl.x - s.x, Pl.z - s.z);
      if (d < 1.6 && sp > 1.2) s.v += (sp - 1.2) * (1.6 - d) * dt * 6 * (Pl.x > s.x ? 1 : -1);   // your draft
      s.v += -s.a * 0.9 * dt * 2.2;   // the string twisting back
      s.v *= Math.exp(-dt * 0.55); s.a += s.v * dt; s.card.rotation.y = s.a;
    }
  });
  // the door sign itself: OPEN // CLOSED, by the entrance, the one that started it
  const ds = new THREE.Group(); ds.position.set(1.0, 2.2, 3.8); ds.rotation.y = PI / 2; g.add(ds);
  for (const [z, word, ry, bg] of [[0.01, 'OPEN', 0, '#c81e1e'], [-0.01, 'CLOSED', PI, '#1a1a1a']]) { const s = c.sign(word, { w: 0.9, h: 0.34, bg, fg: '#fff', font: c.SERIF, weight: 900 }); s.position.z = z; s.rotation.y = ry; ds.add(s); }
  let dv = 0, da = 0; c.clickable(ds.children[0], () => { dv += 12; c.egg('opensign', 'OPEN // CLOSED. The first diptych in any deli. Somebody always flips it to the wrong side at 3am.'); }, 'The door sign');
  c.tick((t, dt) => { dv += -da * dt * 2; dv *= Math.exp(-dt * 0.5); da += dv * dt; ds.rotation.y = PI / 2 + da; });
  // a barber pole by the door that is two words in a spiral, climbing forever
  const pole = c.canvasTex(256, 512, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.save(); q.translate(w / 2, h / 2); q.rotate(-0.5); for (let y = -h; y < h; y += 110) { q.fillStyle = '#c81e1e'; q.fillRect(-w, y, w * 2, 40); q.fillStyle = '#1e3aa0'; q.fillRect(-w, y + 55, w * 2, 40); } q.restore(); q.fillStyle = '#111'; q.font = `900 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText('SAME', w / 2, h * 0.3); q.fillText('DIFFERENCE', w / 2, h * 0.72); });
  pole.wrapT = THREE.RepeatWrapping;
  const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 24, 1, true), new THREE.MeshBasicMaterial({ map: pole, toneMapped: false })); bp.position.set(0.3, 2.0, 6.4); g.add(bp);
  c.tick((t) => { pole.offset.y = (t * 0.25) % 1; });
}
