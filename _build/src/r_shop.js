// THE GIFT SHOP. Every poster on the walls is a pair (window.POSTERS, from posters/). On the counter, a book of
// scratch off tickets: ONE // WON. Click the silver to scratch it, a patch at a time, and the other word is under it.
// One ticket in the book is the losing kind: the same word twice. Same difference.
import { W, D } from './rooms.js';
import { PI, std, basic, box } from './kit.js';
import { pairs, pairTex, openPair, label, dress } from './pairs.js';

export function shop(c, r, g, X) {
  const { THREE } = c, HI = r.h;
  // ---- the posters: south and north walls, gallery hung, each opens the full one-sheet ----
  const posters = window.POSTERS || [];
  const spots = [];
  // a salon hang: two rows on the south wall and on both side walls
  for (const y of [1.55, 3.85]) for (let i = 0; i < 7; i++) spots.push([2.2 + i * 2.6, D / 2 - 0.06, PI, y]);
  for (const y of [1.55, 3.85]) for (const z of [-6.4, -3.8, -1.2]) { spots.push([0.2, z, PI / 2, y]); spots.push([W - 0.42, z, -PI / 2, y]); }   // the side walls; the north is the shop window
  posters.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry, y] = spots[k], w = 1.36, h = w * 1.5;
    const t = c.tex.load(`assets/posters/${p.f}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; m.translateZ(0.05); g.add(m);
    const fr = box(c, w + 0.1, h + 0.1, 0.04, std(c, 0x0d0d0d), x, y, z); fr.rotation.y = ry; fr.translateZ(0.01);   // behind the poster, never in its plane g.add(fr);
    c.clickable(m, () => { c.openPiece({ pair: true, t: p.t, f: `../posters/${p.f}`, s: p.s || '', h: '' }); c.egg('poster_' + k); }, p.t);
  });
  if (!posters.length) {
    // until the posters are in: the pairs themselves, hung as plain diptychs, both halves side by side
    (window.PAIRS || []).slice(0, spots.length).forEach((p, k) => { const [x, z, ry, y] = spots[k]; const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
      for (const [dx, side] of [[-0.42, 'a'], [0.42, 'b']]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.08), new THREE.MeshBasicMaterial({ map: pairTex(c, p, side), toneMapped: false })); m.position.x = dx; grp.add(m); c.clickable(m, () => openPair(c, p), label(p)); } });
  }
  // ---- the counter and the scratch off ----
  g.add(box(c, 4.2, 1.0, 0.8, std(c, 0x2a1a10, { roughness: 0.45 }), 10, 0.5, 2.8)); g.add(box(c, 4.3, 0.04, 0.9, std(c, 0xb89a60, { metalness: 0.6, roughness: 0.3 }), 10, 1.02, 2.8));
  c.wall(X(7.9), 3.2, X(12.1), 3.2); c.wall(X(7.9), 2.4, X(12.1), 2.4); c.wall(X(7.9), 2.4, X(7.9), 3.2); c.wall(X(12.1), 2.4, X(12.1), 3.2);
  const one = pairs('shop')[0];
  const TW = 1.4, TH = 0.8;
  // the ticket: a canvas we scratch into, over the picture of the second word
  const cv = c.canvasTex(700, 400, () => {}), q = cv.userData.canvas.getContext('2d');
  const bimg = new Image(); bimg.src = one ? `assets/pairs/${one.id}_b.jpg` : '';
  let scratched = 0, losing = false;
  const fresh = () => {
    scratched = 0; losing = Math.random() < 0.2; q.globalCompositeOperation = 'source-over';
    q.fillStyle = '#f5c542'; q.fillRect(0, 0, 700, 400); q.fillStyle = '#c81e1e'; q.font = `900 46px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('ONE // WON', 350, 60);
    q.fillStyle = '#1a1a1a'; q.font = `700 20px ${c.MONO}`; q.fillText('SCRATCH THE SILVER · MATCH THE SOUND · WIN THE OTHER WORD', 350, 92);
    // under the silver: the picture and the word (or, one time in five, the same word again)
    if (bimg.complete && bimg.naturalWidth && !losing) q.drawImage(bimg, 120, 110, 220, 270); else { q.fillStyle = '#fff'; q.fillRect(120, 110, 220, 270); }
    q.fillStyle = '#111'; q.font = `900 64px ${c.SERIF}`; q.fillText(losing ? 'ONE' : 'WON', 510, 270);
    q.fillStyle = '#8a8a90'; q.font = `600 18px ${c.MONO}`; q.fillText(losing ? 'SAME DIFFERENCE. TRY AGAIN.' : 'IT SOUNDS THE SAME. IT IS NOT.', 510, 320);
    // the silver
    q.fillStyle = '#b8bcc4'; q.fillRect(100, 100, 560, 290); q.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 200; i++) q.fillRect(100 + Math.random() * 560, 100 + Math.random() * 290, 6, 1);
    q.fillStyle = '#6a6a72'; q.font = `800 30px ${c.MONO}`; q.fillText('SCRATCH HERE', 380, 255);
    cv.needsUpdate = true;
  };
  bimg.onload = fresh; fresh();
  const tk = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ map: cv, color: 0xb8b8b8, toneMapped: false })); tk.rotation.x = -PI / 2 + 0.5; tk.position.set(10, 1.25, 2.6); tk.rotation.y = PI; g.add(tk);
  c.clickable(tk, () => {
    if (scratched >= 7) { fresh(); c.toast('A new ticket off the book.', 1600); return; }
    scratched++; c.sound.squeak && c.sound.squeak();
    // scratch a band away: a few strokes of a coin, revealed by redrawing the layer under just there
    q.save(); q.beginPath(); for (let i = 0; i < 6; i++) { const x = 110 + Math.random() * 540, y = 110 + Math.random() * 270; q.ellipse(x, y, 70 + Math.random() * 40, 26, Math.random() * PI, 0, 7); } q.clip();
    q.fillStyle = '#f5c542'; q.fillRect(100, 100, 560, 290);
    if (bimg.complete && bimg.naturalWidth && !losing) q.drawImage(bimg, 120, 110, 220, 270); else { q.fillStyle = '#fff'; q.fillRect(120, 110, 220, 270); }
    q.fillStyle = '#111'; q.font = `900 64px ${c.SERIF}`; q.fillText(losing ? 'ONE' : 'WON', 510, 270); q.fillStyle = '#8a8a90'; q.font = `600 18px ${c.MONO}`; q.fillText(losing ? 'SAME DIFFERENCE. TRY AGAIN.' : 'IT SOUNDS THE SAME. IT IS NOT.', 510, 320);
    q.restore(); cv.needsUpdate = true;
    if (scratched === 7) { if (losing) c.egg('losing', 'The losing ticket: ONE and ONE. The same word twice. Same difference.'); else { c.egg('won', 'ONE // WON. You scratched one and won one.'); one && setTimeout(() => openPair(c, one), 700); } }
  }, 'Scratch the ticket');
  const sg = c.sign('SCRATCH OFFS · ONE // WON · 1 DOLLAR', { w: 2.4, h: 0.22, bg: '#c81e1e', fg: '#fff', font: c.MONO, weight: 800 }); sg.position.set(10, 1.9, 3.1); sg.rotation.y = PI; g.add(sg);
  // the clerk, and a cat (every shop in this city has one)
  const clerk = c.glb('clerk', { h: 1.75, x: 10, z: 3.8, ry: PI, parent: g });
  c.clickable(clerk, () => { c.say(clerk, 'Exit through the gift shop. Or the gift shop through the exit. Same difference.', 3800, 2.1); c.egg('giftshop'); }, 'The clerk');
  const cat = c.glb('cat', { h: 0.3, x: 11.6, y: 1.04, z: 2.7, ry: 2.4, parent: g });
  c.clickable(cat, () => { c.sound.meow(); c.egg('shopcat', 'PAWS // PAUSE. It is doing both.'); }, 'The cat');
  // the end of the walk: a door that only says EXIT // EXIT
  const ex = c.sign('EXIT // EXIT', { w: 1.6, h: 0.3, bg: '#0a0a0a', fg: '#ff3a2a', font: c.MONO, weight: 800, glow: 0.6 }); ex.position.set(W - 0.2, 3.0, 3.8); ex.rotation.y = -PI / 2; g.add(ex);
  c.clickable(ex, () => { c.egg('exit', 'EXIT // EXIT. The only pair in the building that is the same word. You were counted, twice.'); window.__finale && window.__finale(); }, 'The exit');
  // the shop window onto Fifth Avenue: mullions and a sill in front of the photograph
  const iron = std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.4 });
  for (const x of [4.1, 8, 12, 15.9]) g.add(box(c, 0.12, HI, 0.12, iron, x, HI / 2, -D / 2 + 0.3));
  g.add(box(c, 12, 0.5, 0.5, std(c, 0xe8e4d8, { roughness: 0.5 }), W / 2, 0.25, -D / 2 + 0.4)); c.wall(X(4), -D / 2 + 0.7, X(16), -D / 2 + 0.7);
  const ws = c.sign('"THE GIFT SHOP" // "THE GIFT, SHOP"', { w: 5.2, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', font: c.SERIF, weight: 900, border: '#ff6b00' }); ws.position.set(W / 2, HI - 0.45, -D / 2 + 0.38); g.add(ws);
  g.add(box(c, 0.6, 1.1, 0.6, std(c, 0xf0efea, { roughness: 0.85 }), 14.2, 0.55, -5.0)); c.post(X(14.2), -5.0, 0.45);   // a plinth for the bust
  // the stock (Poly Haven CC0)
  dress(c, r, g, X, [
    ['CashRegister_01', 8.6, 2.8, { h: 0.35, y: 1.04, ry: PI }], ['postcard_set_01', 11.2, 2.9, { h: 0.08, y: 1.04 }], ['magnifying_glass_01', 9.4, 2.6, { h: 0.06, y: 1.04, ry: 0.6 }],
    ['wooden_display_shelves_01', 3.0, -6.2, { h: 1.8, ry: 0.2, r: 0.6 }], ['wooden_bookshelf_worn', 17.2, -6.2, { h: 1.9, ry: -0.2, r: 0.6 }],
    ['standing_picture_frame_01', 5.6, -5.2, { h: 0.5, ry: 0.4 }], ['ceramic_vase_01', 3.0, -6.2, { h: 0.4, y: 1.82 }], ['potted_plant_02', 18.6, 6.8, { h: 1.2 }], ['potted_plant_01', 1.4, 6.8, { h: 1.0 }],
    ['marble_bust_01', 14.2, -5.0, { h: 0.6, y: 1.1 }],
  ], [
    ['pigeonlady', 5.8, 0.4, 0.8, 'I bought ONE // WON for my nephew. He says it is the same poster twice. I said exactly.'], ['jeweler', 15.6, 0.6, -1.0],
  ]);
}
