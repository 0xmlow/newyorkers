// THE WHISPERING GALLERY. Two tiled vaults like the ones outside the Oyster Bar, where a whisper in one corner is
// heard in the opposite one. Here a word goes in as itself and arrives as its New York twin: whisper TALK in one
// corner and TOCK lights up across the way. Each vault has four corners, two diagonals, two pairs.
// The voice is the browser's own; it reads the New York spelling (tawk), so it gets the accent near enough.
import { W, D } from './rooms.js';
import { PI, std, basic, box, glowTex } from './kit.js';
import { pairs, pairTex, openPair, label, dress } from './pairs.js';

// Guastavino tile: herringbone terracotta in the warm glaze
function guastavino(c) {
  return c.canvasTex(512, 512, (q, w, h) => {
    q.fillStyle = '#b07a48'; q.fillRect(0, 0, w, h);
    for (let y = -32; y < h + 32; y += 32) for (let x = -64; x < w + 64; x += 64) {
      for (const [dx, dy, rot] of [[0, 0, 0.785], [32, 16, -0.785]]) { q.save(); q.translate(x + dx, y + dy); q.rotate(rot); const t = 0.75 + Math.random() * 0.25; q.fillStyle = `rgb(${200 * t | 0},${140 * t | 0},${90 * t | 0})`; q.fillRect(-20, -7, 40, 14); q.restore(); }
    }
  });
}

export function whisper(c, r, g, X) {
  const { THREE } = c, HI = r.h, P = pairs('whisper');
  const gt = guastavino(c); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(4, 3);
  const tile = new THREE.MeshStandardMaterial({ map: gt, roughness: 0.35, metalness: 0.05, side: THREE.BackSide });
  const SP = 2.6, RISE = 4.4;   // the spring line and the height of each vault above it
  const bays = [{ cx: 5.2, x0: 1.2, x1: 9.2 }, { cx: 14.8, x0: 10.8, x1: 18.8 }], Z0 = -6.2, Z1 = 6.2;
  const corners = [];
  for (const b of bays) {
    // a groin vault: two half cylinders crossing; the lower of the two is what you see, which is what a groin vault is.
    // Each is turned so the half that is kept points up (local z for the one along z, local x for the one along x).
    const rx = (b.x1 - b.x0) / 2, rz = (Z1 - Z0) / 2;
    const vz = new THREE.Mesh(new THREE.CylinderGeometry(rx, rx, Z1 - Z0, 32, 1, true, -PI / 2, PI), tile); vz.rotation.x = -PI / 2; vz.scale.set(1, 1, RISE / rx); vz.position.set(b.cx, SP, 0); g.add(vz);
    const vx = new THREE.Mesh(new THREE.CylinderGeometry(rz, rz, b.x1 - b.x0, 32, 1, true, 0, PI), tile); vx.rotation.z = PI / 2; vx.scale.set(RISE / rz, 1, 1); vx.position.set(b.cx, SP, 0); g.add(vx);
    // the four piers, and a panel on each, turned to face its opposite corner across the vault
    for (const [x, z] of [[b.x0, Z0], [b.x1, Z0], [b.x0, Z1], [b.x1, Z1]]) {
      g.add(box(c, 0.7, SP + 0.2, 0.7, std(c, 0xc8a070, { roughness: 0.5 }), x, (SP + 0.2) / 2, z)); c.post(X(x), z, 0.5);
      corners.push({ b, x, z });
    }
  }
  // the pairs: each diagonal of each vault. A is in one corner, B in the one across.
  const diag = [[0, 3], [1, 2], [4, 7], [5, 6]];
  const links = [];
  P.slice(0, diag.length).forEach((p, k) => {
    const [ia, ib] = diag[k], A = corners[ia], B = corners[ib];
    const mk = (C, O, side, word) => {
      const ang = Math.atan2(O.x - C.x, O.z - C.z), grp = new THREE.Group(); grp.position.set(C.x + Math.sin(ang) * 0.62, 0, C.z + Math.cos(ang) * 0.62); grp.rotation.y = ang; g.add(grp);
      const pw = 1.05, ph = pw / 0.74;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: pairTex(c, p, side), toneMapped: false })); m.position.y = 1.55; grp.add(m);
      grp.add(box(c, pw + 0.1, ph + 0.1, 0.04, std(c, 0xb8902e, { metalness: 1, roughness: 0.3 }), 0, 1.55, -0.03));
      const s = c.sign(word, { w: 0.9, h: 0.2, bg: '#2a1a0c', fg: '#f5d76e', font: c.SERIF, weight: 900, px: 96 }); s.position.set(0, 0.62, 0.01); grp.add(s);
      // the glow that answers
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, '#f5d76e'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.2, 2.2, 1); glow.position.y = 1.55; grp.add(glow);
      return { grp, m, glow, word };
    };
    const a = mk(A, B, 'a', p.a), b = mk(B, A, 'b', p.b);
    const L = { p, a, b, fly: null };
    links.push(L);
    for (const [from, to] of [[a, b], [b, a]]) c.clickable(from.m, () => send(L, from, to), `Whisper ${from.word} into the corner`);
  });
  // the word in flight: a little sprite of gold that runs up the vault and down to the opposite corner
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, '#ffe9a0'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); spark.scale.set(0.6, 0.6, 1); spark.visible = false; g.add(spark);
  const say = (w) => { try { const u = new SpeechSynthesisUtterance(w.toLowerCase()); u.rate = 0.8; u.pitch = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
  function send(L, from, to) {
    if (L.fly) return;
    say(from.word); c.sound.whoosh && c.sound.whoosh(0.4);
    const p0 = from.grp.position.clone().setY(1.6), p1 = to.grp.position.clone().setY(1.6);
    L.fly = { from, to, p0, p1, t: 0 };
  }
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return;
    let any = false;
    for (const L of links) {
      for (const s of [L.a, L.b]) s.glow.material.opacity *= Math.exp(-dt * 1.4);
      if (!L.fly) continue; any = true;
      const f = L.fly; f.t += dt / 1.8; const u = Math.min(1, f.t);
      spark.visible = true; spark.position.lerpVectors(f.p0, f.p1, u); spark.position.y = 1.6 + Math.sin(u * PI) * (RISE + SP - 1.9);
      if (u >= 1) { L.fly = null; f.to.glow.material.opacity = 1; say(f.to.word); c.toast(`${f.from.word}, said in one corner, arrives as ${f.to.word}. ${L.p.quip}`, 4200); setTimeout(() => openPair(c, L.p, ['whisper', 'The Whispering Gallery: the sound runs up the curve of the tile and down to the opposite corner. In New York it arrives as the other word.']), 1400); }
    }
    if (!any) spark.visible = false;
  });
  // the Oyster Bar sign, and somebody who has been standing in a corner whispering for an hour
  // a flat tile ceiling at the crown, which is all you see in the slot between the two vaults and past their ends
  const cm = new THREE.MeshStandardMaterial({ map: gt, roughness: 0.4 }); g.add(c.slab(W, 0.1, D, cm, W / 2, SP + RISE + 0.02, 0));
  const sg = c.sign('WHISPER // WHISPER', { w: 1.5, h: 0.2, bg: '#2a1a0c', fg: '#f5d76e', font: c.SERIF, weight: 900 }); sg.position.set(W / 2, 2.4, -D / 2 + 0.05); g.add(sg);
  const man = c.glb('dad', { h: 1.75, x: 11.4, z: 1.2, ry: -PI * 0.3, parent: g }); c.post(X(11.4), 1.2, 0.35);
  c.clickable(man, () => { c.say(man, 'I said COFFEE. She heard CAWFEE. We have been married forty years. Same difference.', 4200, 2.1); c.egg('cawfee'); }, 'A man in the middle');
  // the oyster bar spills out under the vaults (Poly Haven CC0), a chandelier at each crown
  dress(c, r, g, X, [
    ['Chandelier_02', 5.2, 0, { h: 1.2, y: SP + RISE - 1.3 }], ['Chandelier_02', 14.8, 0, { h: 1.2, y: SP + RISE - 1.3 }],
    ['round_wooden_table_01', 5.2, -1.4, { h: 0.76, r: 0.6 }], ['WoodenChair_01', 4.4, -1.6, { h: 0.9, ry: 1.4 }], ['WoodenChair_01', 6.0, -1.2, { h: 0.9, ry: -1.6 }],
    ['round_wooden_table_01', 14.8, 1.6, { h: 0.76, r: 0.6 }], ['WoodenChair_01', 14.0, 1.8, { h: 0.9, ry: 1.6 }], ['wine_bottles_01', 14.8, 1.6, { h: 0.3, y: 0.76 }],
    ['brass_candleholders', 5.2, -1.4, { h: 0.25, y: 0.76 }], ['vintage_suitcase', 18.6, 6.6, { h: 0.5, ry: 0.4 }],
  ], [
    ['sally', 7.6, 4.6, 2.4, 'I whispered COFFEE in that corner. He heard CAWFEE across the hall. We have been married forty years.'], ['oscar', 16.4, -3.2, -0.8], ['loretta', 2.6, 3.0, 1.2],
  ]);
}
