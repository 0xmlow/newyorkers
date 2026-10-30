// TAKE A NUMBER, room by room. A museum of New York lines: the DMV, the market, the rope, the deli ticket, the drop,
// Santaland, the bathroom at a bar, and the front of the line at Grand Central. The props are Poly Haven (CC0) through
// the NEW YORKERS Blender lane, the people in the lines are the house extras and ON LOCATION's Tripo cast with eye
// flowers for heads, and a few of the things on the shelves are MLow's M.Texture wrapped objects.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast, queue } from './kit.js';
export { eyeFlower };

// the ticket: one number for the whole museum, taken in room one, checked at every board, up at the end
const TICKET = { n: 0, serving: 4, lost: false, taken: false };
function ticketBoard(c, g, x, y, z, ry, title, w = 2.4) {
  const b = board(c, g, w, w * 0.45, 256); b.m.position.set(x, y, z); b.m.rotation.y = ry;
  b.draw = (extra2 = '') => { const { q, W: w2, H: h2 } = b; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#f5c542'; q.font = `800 ${h2 * 0.14}px ${c.MONO}`; q.textAlign = 'left'; q.fillText(title, 18, h2 * 0.22); q.fillStyle = '#ff4a4a'; q.font = `900 ${h2 * 0.4}px ${c.MONO}`; q.fillText('NOW SERVING ' + TICKET.serving, 18, h2 * 0.62); q.fillStyle = '#f4ead2'; q.font = `600 ${h2 * 0.13}px ${c.MONO}`; q.fillText(TICKET.taken ? (TICKET.lost ? 'YOUR TICKET: LOST' : `YOUR TICKET: ${TICKET.n.toLocaleString('en-US')}`) + extra2 : 'TAKE A TICKET IN ROOM ONE' + extra2, 18, h2 * 0.88); b.up(); };
  b.draw(); return b;
}
// the shuffle: a line of New Yorkers that inches along a path and never gets anywhere
function shuffle(c, g, pts, n, { speed = 0.08, col } = {}) {
  const Q = queue(c, g, (u) => { const p = pts(u); return [p[0], p[1], p[2]]; }, n, { col: col || ((k) => [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a, 0x3a2a5a][k % 5]) });
  c.tick((t, dt) => { for (const q of Q) { q.u = (q.u + dt * speed / n) % 1; const p = pts(q.u); q.o.position.set(p[0], 0, p[1]); q.o.rotation.y = p[2] ?? 0; q.o.userData.body.position.y = 1.0 + Math.max(0, Math.sin(t * 2.2 + q.k * 1.7)) * 0.02; q.o.userData.head.rotation.y = Math.sin(t * 0.7 + q.k) * 0.3; } });
  return Q;
}

const ROOM = {
  // TAKE A NUMBER. The ticket machine gives you a number. The board serves another. They will never meet.
  ticket(c, r, g, X) {
    const { THREE } = c;
    // the machine
    const mc = new THREE.Group(); mc.position.set(10, 0, 1.6); g.add(mc); c.post(X(10), 1.6, 0.5);
    mc.add(c.slab(0.5, 1.2, 0.4, std(c, 0xc81e1e, { roughness: 0.4 }), 0, 0.6, 0)); mc.add(c.slab(0.3, 0.06, 0.3, std(c, 0x111111), 0, 1.23, 0)); const slot = c.slab(0.16, 0.03, 0.2, std(c, 0xf4ead2), 0, 1.0, 0.21); mc.add(slot);
    const lbl = c.sign('TAKE A\nNUMBER', { w: 0.44, h: 0.4, bg: '#f4ead2', fg: '#c81e1e', font: c.FONT, weight: 900, px: 128 }); lbl.position.set(0, 0.7, 0.21); mc.add(lbl);
    const boards = [ticketBoard(c, g, 10, 4.2, -D / 2 + 0.3, 0, 'DEPARTMENT OF WAITING · WINDOW 1 TO 11, OPEN: NONE', 5)];
    const tk = decal(c, 0.4, 0.6, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); }); tk.visible = false; tk.position.set(0.3, 1.1, 0.4); mc.add(tk);
    c.clickable(mc, () => {
      if (TICKET.taken) { c.toast(`You have a ticket. ${TICKET.n.toLocaleString('en-US')}. One per customer. The customer is you. Forever.`, 3000); return; }
      TICKET.taken = true; TICKET.n = 9000000 + Math.floor(Math.random() * 999999); c.sound.ticket && c.sound.ticket(); c.flash(0.1);
      const q = tk.material.map.userData.canvas.getContext('2d'), w = q.canvas.width, h = q.canvas.height; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.09}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('YOUR NUMBER', w / 2, h * 0.3); q.font = `900 ${h * 0.16}px ${c.MONO}`; q.fillText(TICKET.n.toLocaleString('en-US'), w / 2, h * 0.55); q.font = `600 ${h * 0.07}px ${c.MONO}`; q.fillText('KEEP THIS TICKET', w / 2, h * 0.8); tk.material.map.needsUpdate = true; tk.visible = true;
      c.egg('number', `Number ${TICKET.n.toLocaleString('en-US')}. Now serving 4. At one a minute that is ${Math.round((TICKET.n - 4) / 525600)} years. Keep the ticket. The ticket is the whole museum.`);
      boards.forEach((b) => b.draw());
    }, 'The ticket machine');
    // the board counts, mostly up
    let ac = 0; c.tick((t, dt, P, ri) => { ac += dt; if (ac > 11) { ac = 0; TICKET.serving += Math.random() < 0.8 ? 1 : -1; boards.forEach((b) => b.draw()); if (here(r, ri)) c.sound.beep && c.sound.beep(); if (TICKET.serving === 3) c.egg('backwards', 'Now serving 3. It went backwards. Somebody at window 7 asked a question.'); } });
    // the windows, all closed, and the one clerk, who is at lunch
    for (let k = 0; k < 6; k++) { const x = 2.4 + k * 3.1; g.add(c.slab(2.4, 1.1, 0.6, std(c, 0x9aa0a8, { roughness: 0.5 }), x, 0.55, -5.4)); g.add(c.slab(2.4, 2.0, 0.06, new THREE.MeshStandardMaterial({ color: 0xa0c0d0, transparent: true, opacity: 0.35, roughness: 0.05 }), x, 2.1, -5.4)); c.wall(X(x - 1.2), -5.1, X(x + 1.2), -5.1); notice(c, g, k === 3 ? 'WINDOW ' + (k + 1) + ' · OPEN' : 'WINDOW ' + (k + 1) + ' · CLOSED', x, 3.3, -5.36, 0, 1.6, 0.26, '#0d0d0d', k === 3 ? '#5aff8a' : '#ff4a4a'); }
    cast(c, r, g, X, 'clerk', 11.7, -6.3, { h: 1.76, ry: 0, line: () => TICKET.taken ? `${TICKET.n.toLocaleString('en-US')}? We are on 4. Have a seat. The seats are for 4.` : 'Take a number first. The number is the whole point. The number is the museum.', hint: 'The clerk', egg: 'clerk' });
    // the seats: rows of plastic chairs, a few of them taken, and the line that waits for the chairs
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 3 + i * 1.3, z = -1.6 + j * 1.4; prop(c, r, g, X, 'plastic_monobloc_chair_01', x, z, { h: 0.85, r: 0.3 }); if ((i + j) % 3 === 0) extra(c, g, x, z, { seated: true, col: [0x2a3a6a, 0x6a2a3a][j] }); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 13 + i * 1.3, z = -1.6 + j * 1.4; prop(c, r, g, X, 'plastic_monobloc_chair_01', x, z, { h: 0.85, r: 0.3 }); if ((i + j) % 2 === 1) extra(c, g, x, z, { seated: true, col: [0x2a6a4a, 0x6a5a2a][j] }); }
    shuffle(c, g, (u) => [1.6 + u * 7, 4.6 + Math.sin(u * 9) * 0.2, -PI / 2], 6, { speed: 0.1 });
    stanchions(c, g, X, [[1.2, 4.0], [8.8, 4.0], [8.8, 5.4], [1.2, 5.4]], { tape: true });
    prop(c, r, g, X, 'wall_clock', 10, -D / 2 + 0.3, { len: 0.6, y: 5.3, egg: ['The clock', 'clock', 'The clock is right. It is the only thing in the building that is right, and nobody has asked it a question.'] });
    prop(c, r, g, X, 'clipboard', 17.2, 3.4, { len: 0.4, y: 0.76, egg: ['A clipboard', 'form', 'Form MV-82. Fill it in black ink. The pen is blue. The pen is chained to the desk. The desk is form MV-83.'] });
    g.add(c.slab(1.6, 0.76, 0.8, std(c, 0x8a8a90), 17.2, 0.38, 3.4)); c.wall(X(16.4), 3.0, X(18), 3.0); c.wall(X(16.4), 3.8, X(18), 3.8);
    notice(c, g, 'NO "LINE" · THE LINE IS A NUMBER', 10, 2.6, -D / 2 + 0.3, 0, 3.6, 0.32, '#0d0d0d', '#f5c542');
    plaque(c, g, 10, 3.2, D / 2 - 0.13, PI, 'NOW SERVING "4"', 'THE DEPARTMENT OF WAITING', 2.4);
    TICKET.boards = boards;
  },

  // THE LINE FOR THE LINE. The aisle moves with you. Walking backwards is the way out.
  market(c, r, g, X) {
    const { THREE } = c;
    // the shelves along the aisle, as one group that slides
    const aisle = new THREE.Group(); g.add(aisle); const wood = std(c, 0xb08a58, { roughness: 0.7 });
    const run = 6; let off = 0;
    for (let k = -2; k < 6; k++) for (const sx of [6.6, 13.4]) { const z = -6 + k * run / 2; const sh = new THREE.Group(); sh.position.set(sx, 0, z); aisle.add(sh); for (const y of [0.4, 1.1, 1.8]) sh.add(c.slab(1.0, 0.05, 2.6, wood, 0, y, 0)); for (const a of [-1.25, 1.25]) sh.add(c.slab(1.0, 2.0, 0.05, wood, 0, 1.0, a));
      for (let i = 0; i < 6; i++) { const b = c.slab(0.3, 0.35, 0.3, std(c, parseInt(INK[((i + k) % INK.length + INK.length) % INK.length].slice(1), 16), { roughness: 0.6 }), -0.3 + (i % 2) * 0.6, [0.6, 1.3, 2.0][i % 3], -1 + (i / 2 | 0) * 0.9); sh.add(b); } }
    c.wall(X(6.1), -D / 2, X(6.1), D / 2); c.wall(X(7.1), -D / 2, X(7.1), D / 2); c.wall(X(12.9), -D / 2, X(12.9), D / 2); c.wall(X(13.9), -D / 2, X(13.9), D / 2);
    // the line in the aisle, carts and all, shuffling north
    const Q = shuffle(c, g, (u) => [10 + Math.sin(u * 20) * 0.5, 5.5 - u * 11, 0], 7, { speed: 0.12 });
    for (let i = 0; i < 4; i++) prop(c, r, g, X, 'hand_truck', 8.2, 4 - i * 2.8, { h: 1.0, ry: 0.3, r: 0.4 });
    // the treadmill: walking north in the aisle clamps you and slides the shelves; walking south lets you through
    let esc = 0, warned = 0;
    r.move = (P, nx, nz, dt) => { const L = local(r, P); const inAisle = L.x > 7.2 && L.x < 12.8 && L.z < 3 && L.z > -6; if (!inAisle) return [nx, nz]; const dz = nz - P.z; if (dz < 0) { off = (off + dz) % run; aisle.position.z = -(off); return [nx, P.z]; } esc += dz; if (esc > 2 && !warned) { warned = 1; c.egg('backwards', 'Backwards. The line only holds you if you want what it wants. Walk away from the samples and the aisle lets go.'); } return [nx, nz]; };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); if (L.x > 7.2 && L.x < 12.8 && L.z < 0 && !r.told) { r.told = true; c.toast('The aisle. Walk forward and the shelves walk with you. The line never shortens. Try walking backwards.', 4200); } });
    // the samples station, the cashier, the frozen section
    g.add(c.slab(1.2, 0.9, 0.8, std(c, 0xd8d0c0), 10, 0.45, -5.6)); c.post(X(10), -5.6, 0.7); cast(c, r, g, X, 'workgirl', 10, -6.4, { h: 1.74, ry: 0, line: 'Samples. One per customer. The customer is the line. The line gets one.', hint: 'The samples', egg: 'sample' });
    prop(c, r, g, X, 'food_pomegranate_01', 9.8, -5.6, { h: 0.12, y: 0.9 }); prop(c, r, g, X, 'food_lime_01', 10.2, -5.6, { h: 0.1, y: 0.9 });
    prop(c, r, g, X, 'ph_carrot_cake', 2.4, -4.6, { h: 0.5, y: 0.9, hint: 'A cake', fn: (cc, m) => cc.say(m, 'The cake. Wrapped. Six ninety nine. The line for the cake is the line.', 2600, 0.7) }); plinth(c, g, X, 2.4, -4.6, 0.9, 0.9, 0.9, 0xd8d0c0);
    prop(c, r, g, X, 'ph_wine_bottles_01', 17.4, -4.6, { len: 0.8, y: 0.9, hint: 'Two buck chuck', fn: (cc, m) => cc.say(m, 'Three dollars now. Wrapped. Still the best deal in the building, including the exit.', 2600, 0.7) }); plinth(c, g, X, 17.4, -4.6, 0.9, 0.9, 0.9, 0xd8d0c0);
    prop(c, r, g, X, 'CashRegister_01', 3.0, 3.6, { len: 0.7, y: 0.9, ry: PI }); g.add(c.slab(2.4, 0.9, 0.8, std(c, 0xd8d0c0), 3.0, 0.45, 3.6)); c.wall(X(1.8), 3.2, X(4.2), 3.2); c.wall(X(1.8), 4.0, X(4.2), 4.0);
    cast(c, r, g, X, 'dad', 3.0, 4.6, { h: 1.78, ry: PI, line: 'Register 4 is open. Register 4 is always open. Nobody can reach register 4.', hint: 'Register 4' });
    prop(c, r, g, X, 'bananas', 16.8, 3.6, { len: 0.6, y: 0.0, r: 0.4 }); prop(c, r, g, X, 'wooden_crate_02', 16.8, 3.6, { len: 0.9, r: 0.5 });
    bulbs(c, g, 2, 18, 5.5, -2, 24, 0xfff0c0);
    notice(c, g, 'THE LINE STARTS "HERE" · ALSO THERE', 10, 2.8, D / 2 - 0.13, PI, 3.6, 0.32, '#0d0d0d', '#f5c542');
    plaque(c, g, 15, 3.4, D / 2 - 0.13, PI, 'FORTY MINUTES FOR "DIP"', 'THE LINE FOR THE LINE', 2.4);
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE MARKET · NOW SERVING EVERYONE BUT YOU');
  },

  // THE ROPE. The bouncer only lets the line move while you are not looking at him.
  club(c, r, g, X) {
    const { THREE } = c;
    const door = c.slab(2.6, 3.2, 0.3, std(c, 0x1a1016, { roughness: 0.5 }), 10, 1.6, -5.9); g.add(door); c.wall(X(8.7), -5.7, X(11.3), -5.7);
    const neon = c.sign('STUDIO N3W', { w: 3.4, h: 0.7, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 24, px: 200 }); neon.position.set(10, 4.0, -5.7); g.add(neon);
    bulbs(c, g, 7.5, 12.5, 3.4, -5.7, 12, 0xff4fa3);
    const pl = new THREE.PointLight(0xff4fa3, 20, 14, 1.6); pl.position.set(10, 3.5, -4.5); g.add(pl);
    // the rope and the line behind it
    stanchions(c, g, X, [[6.8, -4.0], [13.2, -4.0]]); stanchions(c, g, X, [[12.6, -2.6], [12.6, 5.2]]); stanchions(c, g, X, [[7.4, -2.6], [7.4, 5.2]]);
    const N = 9, Qs = []; for (let i = 0; i < N; i++) { const z = -2.4 + i * 0.85; Qs.push({ o: extra(c, g, 10 + Math.sin(i) * 0.4, z, { col: [0x6a2a5a, 0x2a2a6a, 0xa02a3a, 0x2a6a6a][i % 4] }), z, home: z }); }
    const bouncer = cast(c, r, g, X, 'boxer', 10, -4.8, { h: 1.95, ry: 0, r: 0.5, line: 'You are not on the list. The list is not on the list. Stop looking at me.', hint: 'The bouncer' });
    const fwd = new THREE.Vector3(); let moved = 0, seenT = 0, inside = false, lastSeen = false;
    const sign2 = ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE ROPE · NOW SERVING NOBODY');
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || inside) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -4.8 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const seen = dot > 0.55 && d < 16;
      if (seen !== lastSeen) { lastSeen = seen; if (seen && moved > 0.5) c.say(bouncer, ['Stop.', 'Eyes.', 'Nobody moves.', 'I said.'][(moved * 3 | 0) % 4], 1200, 2.2); }
      if (!seen) { moved += dt; for (const q of Qs) { q.z -= dt * 0.35; if (q.z < -3.4) { q.z = 4.6; } q.o.position.z = q.z; }
        // you move too, if you are in the lane
        if (L.x > 7.6 && L.x < 12.4 && L.z > -3.2 && L.z < 5.4) { c.P.z -= dt * 0.35; }
      } else seenT += dt;
      if (!seen && L.x > 8.7 && L.x < 11.3 && L.z < -3.6) { inside = true; c.sound.disco && c.sound.disco(); c.flash(0.6); c.egg('inside', 'You are in. You never looked at him. The whole line went in behind you. Inside it is a room exactly like this one, with worse music.'); setTimeout(() => c.toast('Inside. It is 1977 in here and it is the same room. The bathroom line is two rooms east.', 4200), 1500); }
      if (seenT > 20 && !r.stared) { r.stared = true; c.egg('staring', 'Twenty seconds looking at the bouncer. Nobody has moved. He has not blinked. He is also a painting.'); } });
    cast(c, r, g, X, 'discoking', 3.4, 2.4, { h: 1.8, ry: 0.8, line: 'I was in. I came out for air. There is no air. Now I am in line. The line is the club.', hint: 'The disco king', egg: 'king' });
    cast(c, r, g, X, 'gown', 16.6, 2.0, { h: 1.78, ry: -0.8, line: 'The trick is to not want it. He can smell wanting it. Also he is looking at you right now.', hint: 'The gown' });
    prop(c, r, g, X, 'h_taxi', 2.6, 5.0, { len: 4.4, ry: PI / 2 + 0.2, r: 2.0, raw: true, egg: ['A cab', 'cab', 'The cab is waiting for someone who went in at eleven. It is 1977. The meter is at $4,120.'] });
    prop(c, r, g, X, 'metal_trash_can', 18.4, -5.2, { h: 0.8, r: 0.4 }); prop(c, r, g, X, 'fire_hydrant', 1.2, -1.0, { h: 0.8, r: 0.3 });
    prop(c, r, g, X, 'street_lamp_02', 1.4, -5.6, { h: 3.8, r: 0.3 }); prop(c, r, g, X, 'street_lamp_02', 18.6, -5.6, { h: 3.8, r: 0.3 });
    const dust = []; for (let i = 0; i < 6; i++) dust.push(glow(c, g, 4 + Math.random() * 12, 0.4 + Math.random(), -5 + Math.random() * 3, 'rgba(255,120,200,.25)', 2.5)); c.tick((t) => dust.forEach((s, i) => { s.position.x += Math.sin(t * 0.3 + i) * 0.004; }));
    notice(c, g, 'DO NOT "LOOK" AT THE BOUNCER', 10, 0.06, 4.6, 0, 3.2, 0.3, '#0d0d0d', '#ff4fa3').rotation.x = -PI / 2;
    plaque(c, g, 15, 3.2, D / 2 - 0.13, PI, 'THE LIST IS NOT ON THE "LIST"', 'THE ROPE, 1977', 2.4);
  },

  // HOLD THE TICKET. The deli hands you a ticket; the man by the pickles takes it; the cashier charges fifty.
  deli(c, r, g, X) {
    const { THREE } = c; const DT = { have: false, lost: false, paid: 0, warned: false };
    // the door man with the tickets, the counter, the cutter, the pickles, the cashier
    const door = cast(c, r, g, X, 'maitre', 3.2, 4.6, { h: 1.8, ry: 0.9, r: 0.4 }); c.clickable(door, () => { if (!DT.have) { DT.have = true; DT.lost = false; c.sound.ticket && c.sound.ticket(); c.say(door, 'Ticket. Hold it. Do not lose it. Fifty dollars if you lose it. Everybody loses it.', 3600, 2.1); if (!r.ticketOnce) { r.ticketOnce = true; c.egg('held', 'A deli ticket. It is a receipt for the right to pay. Lose it and it costs fifty. Hold it like a passport.'); } } else c.say(door, 'You have one. Hold it.', 1600, 2.1); }, 'The ticket man');
    g.add(c.slab(10, 1.1, 0.9, std(c, 0xd8c8a0, { roughness: 0.5 }), 10, 0.55, -4.6)); c.wall(X(5), -4.1, X(15), -4.1); g.add(c.slab(10, 0.5, 0.9, new THREE.MeshStandardMaterial({ color: 0xa0c0d0, transparent: true, opacity: 0.3, roughness: 0.05 }), 10, 1.35, -4.6));
    const cutter = cast(c, r, g, X, 'butcher', 8, -5.4, { h: 1.82, ry: 0, line: () => DT.have ? 'Pastrami. On rye. Mustard. Say less. I take the ticket, I write on the ticket, you get the ticket back. Hold it.' : 'Ticket first. No ticket, no pastrami. No pastrami, no reason.', hint: 'The cutter', egg: 'cutter' });
    const cashier = cast(c, r, g, X, 'clerk', 16.8, -3.2, { h: 1.76, ry: -PI / 2, r: 0.4 }); g.add(c.slab(0.9, 1.1, 2.0, std(c, 0xd8c8a0), 17.8, 0.55, -3.2)); c.wall(X(17.3), -4.2, X(17.3), -2.2);
    c.clickable(cashier, () => { if (DT.have && !DT.lost) { DT.paid++; c.say(cashier, 'Twenty six fifty. The ticket says pastrami. Next.', 2600, 2.1); if (DT.paid === 1) c.egg('paid', 'Paid with the ticket in hand. Twenty six fifty. Whole museum, the only room where a thing worked out.'); } else { c.say(cashier, 'No ticket? Fifty dollars. Policy. The policy is older than the pickles.', 3200, 2.1); c.sound.horn && c.sound.horn(); if (!r.fined) { r.fined = true; c.egg('fifty', 'Fifty dollars. You lost the ticket. The man by the pickles has it. He has four hundred of them.'); } } }, 'The cashier');
    // the man by the pickles, who takes tickets from anyone who walks past
    const pk = cast(c, r, g, X, 'sonny', 12.6, 2.4, { h: 1.8, ry: 0.4, r: 0.4, line: 'Pickles? Half sour. Full sour. Take one. Take two. I took your ticket. Look.', hint: 'The man by the pickles' });
    prop(c, r, g, X, 'wooden_barrels_01', 13.8, 2.6, { len: 1.1, r: 0.6 }); prop(c, r, g, X, 'wine_barrel_01', 11.6, 3.2, { h: 0.9, r: 0.5 });
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || !DT.have || DT.lost) return; const L = local(r, P); if (Math.hypot(L.x - 12.6, L.z - 2.4) < 1.4) { DT.lost = true; DT.have = false; c.say(pk, 'Got it.', 1400, 2.1); c.sound.tick && c.sound.tick(); setTimeout(() => c.toast('Your ticket is gone. The man by the pickles. Check your pockets. Do not check your pockets.', 3600), 1200); } });
    // the tables, the regulars, the sandwich
    for (const [x, z] of [[3.4, -1.4], [6.4, 0.6], [16.6, 1.0], [4.2, 2.0]]) { prop(c, r, g, X, 'round_wooden_table_02', x, z, { len: 1.0, r: 0.55 }); prop(c, r, g, X, 'WoodenChair_01', x + 0.7, z, { h: 0.9, ry: -PI / 2, r: 0.25 }); prop(c, r, g, X, 'WoodenChair_01', x - 0.7, z, { h: 0.9, ry: PI / 2, r: 0.25 }); }
    extra(c, g, 3.4 + 0.7, -1.4, { seated: true, col: 0x2a3a6a, ry: -PI / 2 }); extra(c, g, 16.6 - 0.7, 1.0, { seated: true, col: 0x6a2a3a, ry: PI / 2 });
    cast(c, r, g, X, 'sally', 6.4 - 0.7, 0.6, { h: 1.72, ry: PI / 2, line: "I'll have what she's counting.", hint: 'A regular', egg: 'counting' });
    prop(c, r, g, X, 'hamburger_buns', 6.4, 0.6, { len: 0.4, y: 0.74 }); prop(c, r, g, X, 'croissant', 16.6, 1.0, { len: 0.3, y: 0.74 });
    prop(c, r, g, X, 'ceiling_fan', 10, 0, { len: 1.4, y: 5.6, spin: 2 }); prop(c, r, g, X, 'cassette_player', 18.4, -5.6, { len: 0.5, y: 1.1 }); prop(c, r, g, X, 'nyb_katz_pickles', 10, -5.5, { len: 0.6, y: 1.1 });
    shuffle(c, g, (u) => [5 + u * 9.5, -2.6 + Math.sin(u * 12) * 0.25, -PI / 2], 7, { speed: 0.1 });
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE DELI · HOLD THE TICKET');
    notice(c, g, 'LOST TICKET · "$50" · NO EXCEPTIONS · ONE EXCEPTION', 10, 2.8, -D / 2 + 0.3, 0, 4.4, 0.34, '#f4ead2', '#c81e1e');
    plaque(c, g, 15, 3.2, D / 2 - 0.13, PI, 'HOLD THE "TICKET"', 'THE DELI, SINCE 1888', 2.4);
  },

  // THE DROP. The line moves only while you stand still. The stock drops every ten seconds.
  drop(c, r, g, X) {
    const { THREE } = c; const DR = { stock: 40, still: 0, pos: 12, got: false, sold: false, lastX: 0, lastZ: 0 };
    const wallB = board(c, g, 4.0, 1.4, 384); wallB.m.position.set(10, 3.8, -5.9);
    const draw = () => { const { q, W: w2, H: h2 } = wallB; q.fillStyle = '#fff'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#c81e1e'; q.fillRect(0, 0, w2, h2 * 0.3); q.fillStyle = '#fff'; q.font = `900 ${h2 * 0.2}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('N3W YORKERS', w2 / 2, h2 * 0.22); q.fillStyle = '#111'; q.font = `800 ${h2 * 0.16}px ${c.MONO}`; q.fillText(DR.sold ? 'SOLD OUT' : `IN STOCK: ${DR.stock}`, w2 / 2, h2 * 0.56); q.font = `600 ${h2 * 0.12}px ${c.MONO}`; q.fillText(`YOUR PLACE IN LINE: ${DR.pos}`, w2 / 2, h2 * 0.8); wallB.up(); }; draw();
    // the rack with the box logo tee, wrapped things on the wall, the resale table
    g.add(c.slab(6, 1.0, 0.8, std(c, 0xf4f4f4, { roughness: 0.4 }), 10, 0.5, -4.6)); c.wall(X(7), -4.1, X(13), -4.1);
    const tee = c.slab(0.9, 1.1, 0.04, std(c, 0xffffff), 10, 1.6, -4.3); g.add(tee); const tl = c.sign('N3W', { w: 0.6, h: 0.22, bg: '#c81e1e', fg: '#fff', font: c.FONT, weight: 900 }); tl.position.set(10, 1.7, -4.27); g.add(tl);
    cast(c, r, g, X, 'tracksuit', 10, -5.4, { h: 1.78, ry: 0, line: () => DR.sold ? 'Sold out. Resale table is on the left. Ten X. It is the same shirt.' : 'Stand still. The line moves when you stand still. That is the whole technology.', hint: 'The clerk' });
    const N = 12, Qs = []; for (let i = 0; i < N; i++) Qs.push({ o: extra(c, g, 10 + Math.sin(i * 2) * 0.4, -3.4 + i * 0.6, { col: [0x111111, 0xc81e1e, 0xf4f4f4, 0x111111][i % 4] }), z: -3.4 + i * 0.6 });
    let sc = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri) || DR.got) return; const L = local(r, P); const moved = Math.hypot(L.x - DR.lastX, L.z - DR.lastZ) > 0.02; DR.lastX = L.x; DR.lastZ = L.z;
      if (!moved) DR.still += dt; else DR.still = 0;
      if (DR.still > 1.5 && DR.pos > 0) { DR.pos -= dt * 0.6; for (const q of Qs) { q.z -= dt * 0.42; if (q.z < -3.8) q.z = 3.4; q.o.position.z = q.z; } }
      sc += dt; if (sc > 10) { sc = 0; if (!DR.sold) { DR.stock -= 4 + Math.floor(Math.random() * 6); if (DR.stock <= 0) { DR.stock = 0; DR.sold = true; c.sound.horn && c.sound.horn(); c.egg('soldout', 'Sold out at 11:01. You were number twelve in a line that moved while you stood still. The resale table has one. Ten times.'); } } draw(); }
      if (DR.pos <= 0 && !DR.got) { DR.got = true; draw(); c.sound.ding(); c.flash(0.3); c.egg(DR.sold ? 'front' : 'copped', DR.sold ? 'Front of the line. Sold out. The shirt you wanted is on the table to the left for ten times the price and it is the same shirt.' : 'Front of the line. One tee. Box logo. You stood still for it. Standing still is the skill.'); } });
    // resale: the same shirt, a table, ten X
    g.add(c.slab(2.4, 0.9, 1.0, std(c, 0x111111), 3.0, 0.45, -1.0)); c.wall(X(1.8), -1.5, X(4.2), -1.5); c.wall(X(1.8), -0.5, X(4.2), -0.5);
    const tee2 = c.slab(0.8, 0.6, 0.04, std(c, 0xffffff), 3.0, 1.2, -1.0); tee2.rotation.x = -0.6; g.add(tee2);
    cast(c, r, g, X, 'hustler', 3.0, -2.2, { h: 1.78, ry: 0, line: 'Same shirt. Ten X. Still cheaper than the line. The line is forty minutes of your life. I am four hundred dollars of it.', hint: 'The resale table', egg: 'resale' });
    prop(c, r, g, X, 'ph_digital_wrist_watch', 16.8, -4.6, { len: 0.5, y: 0.95, hint: 'A watch', fn: (cc, m) => cc.say(m, 'Wrapped. Drops Thursday. Dropped Thursday. It is Thursday.', 2400, 0.7) }); plinth(c, g, X, 16.8, -4.6, 0.9, 0.9, 0.9, 0xf4f4f4);
    prop(c, r, g, X, 'ph_vintage_lighter', 3.2, -4.6, { h: 0.4, y: 0.95, hint: 'A lighter', fn: (cc, m) => cc.say(m, 'A wrapped lighter. Collab. Limited. It lights.', 2200, 0.6) }); plinth(c, g, X, 3.2, -4.6, 0.9, 0.9, 0.9, 0xf4f4f4);
    prop(c, r, g, X, 'ph_old_tyre', 17.0, 2.2, { len: 1.0, r: 0.6, hint: 'A tyre', fn: (cc, m) => cc.say(m, 'The tyre. Wrapped. Four hundred. Does not fit anything. That is the point.', 2400, 0.7) });
    prop(c, r, g, X, 'ph_Megaphone_01', 6.2, 2.6, { len: 0.7, y: 0.0, egg: ['A megaphone', 'megaphone', 'The megaphone they use to say the line is closed. It is wrapped. It is also for sale.'] });
    stanchions(c, g, X, [[8.4, -3.4], [8.4, 5.6]], { tape: true }); stanchions(c, g, X, [[11.6, -3.4], [11.6, 5.6]], { tape: true });
    notice(c, g, 'STAND "STILL" · THE LINE MOVES WHEN YOU DO NOT', 10, 0.06, 4.8, 0, 3.6, 0.3, '#111', '#fff').rotation.x = -PI / 2;
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE DROP · NOW SERVING THURSDAY');
    plaque(c, g, 15, 3.2, D / 2 - 0.13, PI, 'SOLD OUT AT "11:01"', 'THE DROP', 2.4);
  },

  // THE MAZE. Santaland. The exit door sends you back to the entrance twice; the third time it lets you through.
  santa(c, r, g, X) {
    const { THREE } = c; const SL = { loops: 0, cool: 0 };
    const green = std(c, 0x1a5a2a, { roughness: 0.8 }), red = std(c, 0xa02020, { roughness: 0.7 });
    // the maze walls: candy stripe hedges
    const hedge = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), m = c.slab(L, 1.4, 0.4, green, (x1 + x2) / 2, 0.7, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); g.add(m); c.wall(X(x1), z1, X(x2), z2); const cap = c.slab(L, 0.1, 0.5, red, (x1 + x2) / 2, 1.42, (z1 + z2) / 2); cap.rotation.y = m.rotation.y; g.add(cap); };
    hedge(3, 3, 3, -4); hedge(3, -4, 8, -4); hedge(8, -4, 8, -1); hedge(5.5, 3, 5.5, 0.5); hedge(5.5, 0.5, 11, 0.5); hedge(12, 3, 12, -2); hedge(12, -2, 17, -2); hedge(14.5, 3, 14.5, 1); hedge(17, 3, 17, -5); hedge(10, -2, 10, -6);
    // the entrance arch and the exit door that lies
    const arch = (x, z, text) => { for (const dx of [-1.2, 1.2]) g.add(c.slab(0.3, 2.6, 0.3, red, x + dx, 1.3, z)); g.add(c.slab(2.7, 0.3, 0.3, red, x, 2.6, z)); notice(c, g, text, x, 2.95, z, 0, 2.6, 0.3, '#f4ead2', '#a02020'); };
    arch(4.2, 4.2, 'SANTALAND · "ENTER" · 45 MIN'); arch(13.4, -5.2, 'EXIT · "REALLY"');
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; SL.cool -= dt; const L = local(r, P); if (SL.cool <= 0 && Math.abs(L.x - 13.4) < 1.2 && L.z < -5.0 && L.z > -6.2) { SL.loops++; SL.cool = 3; if (SL.loops < 3) { c.flash(0.4); c.sound.whoosh && c.sound.whoosh(); c.P.x = r.x0 + 4.2; c.P.z = 5.2; c.P.yaw = 0; c.toast(['The exit was the entrance. Santaland is a loop. Try again.', 'The exit was the entrance again. The elf says the third time counts.'][SL.loops - 1], 3600); } else if (SL.loops === 3) { c.egg('loop', 'Third time through the exit and it let you through. Santaland is a loop; the elves are paid by the loop. Happy holidays.'); c.sound.applause && c.sound.applause(); } } });
    // Santa, the elf, the line of kids, the photo op
    const chair = plinth(c, g, X, 14.6, -3.6, 1.6, 0.4, 1.4, 0xa02020); cast(c, r, g, X, 'elf', 16.0, -3.6, { h: 1.6, ry: -0.6, line: () => `Loop ${SL.loops} of 3. The third one is real. I have said that ${SL.loops * 400 + 12} times today.`, hint: 'The elf', egg: 'elf' });
    cast(c, r, g, X, 'famer', 14.6, -3.6, { h: 1.9, ry: 0.3, y: 0.4, r: 0.5, line: 'Ho. What do you want. Be specific. The line is long and the wish list is a spreadsheet.', hint: 'Santa', egg: 'santa' });
    shuffle(c, g, (u) => { const path = [[4.2, 3.5], [4.2, -3], [7, -3], [7, -0.5], [6, 1.5], [11, 1.5], [11, -1], [13, -1], [13, 2], [16, 2], [16, -1], [13.5, -3]]; const k = Math.min(path.length - 2, Math.floor(u * (path.length - 1))), f = u * (path.length - 1) - k; const a = path[k], b = path[k + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[0] - a[0], b[1] - a[1])]; }, 10, { speed: 0.16, col: (k) => [0xc81e1e, 0x1a5a2a, 0xf5c542, 0x2a3a6a][k % 4] });
    prop(c, r, g, X, 'Camera_01', 15.4, -5.6, { len: 0.5, y: 1.3 }); g.add(c.slab(0.06, 1.3, 0.06, std(c, 0x222), 15.4, 0.65, -5.6)); c.post(X(15.4), -5.6, 0.2);
    for (const [x, z] of [[1.4, -6.2], [18.6, -6.2], [1.4, 5.6], [18.6, 5.6], [9.2, -6.4]]) prop(c, r, g, X, 'potted_plant_01', x, z, { h: 1.6, r: 0.4 });
    prop(c, r, g, X, 'strawberry_chocolate_cake', 2.0, 1.0, { len: 0.5, y: 0.0, egg: ['A cake', 'cake', 'Cookies for Santa. It is a cake. Santa has notes.'] });
    prop(c, r, g, X, 'nyb_rink_gift_a', 18.4, 0.0, { len: 0.8, r: 0.4 }); prop(c, r, g, X, 'nyb_rink_gift_b', 18.4, 1.0, { len: 0.6, y: 0.8 });
    bulbs(c, g, 1, 19, 5.5, -6.4, 30, 0xff4040); bulbs(c, g, 1, 19, 5.5, 6.4, 30, 0x40ff60);
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'SANTALAND · NOW SERVING LOOP ' + 0);
    plaque(c, g, 10, 3.6, D / 2 - 0.13, PI, 'THE "LINE" IS THE ATTRACTION', 'SANTALAND, HERALD SQUARE', 2.4);
  },

  // THE BATHROOM LINE. The door is occupied while you look at it. Walk away and it opens.
  bathroom(c, r, g, X) {
    const { THREE } = c; const BR = { occ: true, opened: 0, inside: false };
    // the bar along the south, the stall at the north, the line between
    g.add(c.slab(12, 1.1, 0.8, std(c, 0x3a2418, { roughness: 0.6 }), 10, 0.55, 5.0)); c.wall(X(4), 4.5, X(16), 4.5);
    for (let x = 4.8; x < 16; x += 1.4) prop(c, r, g, X, 'bar_chair_round_01', x, 3.9, { h: 1.0, r: 0.25 });
    for (const [x, z] of [[9.2, 5.0], [11.6, 5.0], [6.4, 5.0]]) prop(c, r, g, X, 'wine_bottles_01', x, z, { len: 0.5, y: 1.1 });
    const bt = cast(c, r, g, X, 'bartender', 10, 5.9, { h: 1.8, ry: PI, line: 'One stall. Fourteen people. Saturday. The key is on the spoon. The spoon is with the guy. The guy is in the stall.', hint: 'The bartender', egg: 'spoon' });
    const door = c.slab(1.0, 2.2, 0.1, std(c, 0x4a2a1a, { roughness: 0.6 }), 10, 1.1, -5.4); g.add(door); g.add(c.slab(1.4, 2.6, 0.3, std(c, 0x6a3a30), 10, 1.3, -5.7)); c.wall(X(9.3), -5.3, X(10.7), -5.3);
    const sgn = board(c, g, 0.6, 0.3, 128); sgn.m.position.set(10, 2.5, -5.3);
    const drawS = () => { const { q, W: w2, H: h2 } = sgn; q.fillStyle = BR.occ ? '#c81e1e' : '#1a8a3a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#fff'; q.font = `900 ${h2 * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(BR.occ ? 'OCCUPIED' : 'VACANT', w2 / 2, h2 * 0.68); sgn.up(); }; drawS();
    const fwd = new THREE.Vector3(); let far = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -5.4 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const looking = dot > 0.6 && d < 14;
      if (looking && !BR.occ) { BR.occ = true; drawS(); door.rotation.y = 0; c.sound.thud && c.sound.thud(0.2); }
      if (!looking || d > 9) { far += dt; if (far > 2.5 && BR.occ) { BR.occ = false; BR.opened++; drawS(); door.rotation.y = 0.9; c.sound.click && c.sound.click(); if (BR.opened === 3 && !r.schro) { r.schro = true; c.egg('schrodinger', "Vacant while you are not looking. Occupied the moment you are. A bathroom in two states at once. Schrodinger's stall, Avenue A."); } } } else far = 0;
      if (!BR.occ && d < 1.2 && !BR.inside) { BR.inside = true; c.flash(0.3); c.egg('inside2', 'You got in. You walked up backwards. The hand dryer says COUNTED. Everything in here says COUNTED.'); } });
    notice(c, g, 'HAND DRYER · "COUNTED"', 10, 3.0, -5.3, 0, 1.6, 0.26, '#0d0d0d', '#f5c542');
    // the line, which has given up in order
    for (let i = 0; i < 7; i++) { const e = extra(c, g, 10 + Math.sin(i * 1.3) * 0.5, -3.6 + i * 1.0, { col: [0x3a2a5a, 0x5a2a2a, 0x2a4a5a][i % 3] }); c.tick((t) => { e.userData.body.rotation.z = Math.sin(t * 1.5 + i) * 0.04; e.userData.head.rotation.y = Math.sin(t * 0.5 + i * 2) * 0.6; }); }
    cast(c, r, g, X, 'dancer', 4.2, -3.0, { h: 1.76, ry: 0.8, line: 'I have been in this line since the last song. The song was long. The line is longer. I am dancing in it.', hint: 'A dancer' });
    cast(c, r, g, X, 'writer', 16.2, -2.2, { h: 1.76, ry: -0.8, line: 'I am writing about the line. The line is the only story in this bar.', hint: 'A writer', egg: 'writer' });
    prop(c, r, g, X, 'boombox', 17.4, 4.6, { len: 0.6, y: 1.1, raw: true }); prop(c, r, g, X, 'Television_01', 2.6, 4.8, { len: 0.7, y: 2.6, ry: -0.4 });
    prop(c, r, g, X, 'metal_trash_can', 1.4, -5.0, { h: 0.8, r: 0.4 }); prop(c, r, g, X, 'dustpan', 18.2, -5.4, { len: 0.4 }); prop(c, r, g, X, 'wooden_broom', 18.6, -4.6, { h: 1.3, ry: 0.3 });
    bulbs(c, g, 4, 16, 5.0, 4.4, 16, 0xff8040);
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE STALL · NOW SERVING WHOEVER IS IN THERE');
    plaque(c, g, 15, 3.2, D / 2 - 0.13, PI, 'ONE "STALL"', 'A BAR ON AVENUE A', 2.0);
  },

  // THE FRONT OF THE LINE. Grand Central. The board lists every line; stand on the star and your number comes up.
  front(c, r, g, X) {
    const { THREE } = c;
    const BIG = board(c, g, 9, 3.2, 768); BIG.m.position.set(10, 4.4, -D / 2 + 0.3);
    const LINES = [['THE DMV', 'NOW SERVING 4'], ['THE MARKET', 'FORTY MINUTES'], ['THE ROPE', 'NOT ON THE LIST'], ['THE DELI', 'HOLD THE TICKET'], ['THE DROP', 'SOLD OUT'], ['SANTALAND', 'LOOP 3'], ['THE STALL', 'OCCUPIED'], ['THE FRONT', 'YOU']];
    let flipped = false; const draw = (up) => { const { q, W: w2, H: h2 } = BIG; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#f5c542'; q.font = `800 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('EVERY LINE IN THE CITY · DEPARTURES', 30, h2 * 0.1); q.font = `600 ${h2 * 0.07}px ${c.MONO}`; LINES.forEach(([a, b], i) => { const y = h2 * (0.22 + i * 0.095); q.fillStyle = '#f4ead2'; q.fillText(a, 30, y); q.fillStyle = i === 7 && up ? '#5aff8a' : '#ff8a4a'; q.textAlign = 'right'; q.fillText(i === 7 && up ? `NOW SERVING ${TICKET.n.toLocaleString('en-US')}` : b, w2 - 30, y); q.textAlign = 'left'; }); BIG.up(); }; draw(false);
    // the clock on a column, the gold star under it
    column(c, g, 10, 0.4, 4.2, 0.22, 0xd8c8a0); c.post(X(10), 0.4, 0.45); const clk = prop(c, r, g, X, 'mantel_clock_01', 10, 0.4, { len: 0.8, y: 4.2 });
    const star = decal(c, 1.0, 1.0, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2 - PI / 2, R = k % 2 ? w * 0.2 : w * 0.46; q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.closePath(); q.fill(); }); star.rotation.x = -PI / 2; star.position.set(10, 0.02, 2.4); g.add(star);
    const paper = confetti(c, g, 600);
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || flipped) return; const L = local(r, P); if (Math.hypot(L.x - 10, L.z - 2.4) < 0.6) { if (!TICKET.taken) { if (!r.noTk) { r.noTk = true; c.toast('No ticket. The board cannot serve a number you never took. Room one has the machine.', 3600); } return; } flipped = true; let k = 0; const iv = setInterval(() => { k++; c.sound.tick && c.sound.tick(); if (k > 14) { clearInterval(iv); draw(true); c.sound.applause && c.sound.applause(); paper.burst(10, 5, 2.4, 8); c.egg('served', `Now serving ${TICKET.n.toLocaleString('en-US')}. Your number. It took ${LINES.length} lines and the whole museum. The window is open. The window is closed. Thank you for waiting.`); setTimeout(() => { window.__finale && window.__finale(); }, 4500); } else { const { q, W: w2, H: h2 } = BIG; q.fillStyle = '#0a0a0a'; q.fillRect(w2 * 0.5, h2 * (0.22 + 7 * 0.095) - h2 * 0.07, w2 * 0.5, h2 * 0.09); q.fillStyle = '#ff8a4a'; q.font = `600 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'right'; q.fillText(String(Math.floor(Math.random() * 9999999)).padStart(7, '0'), w2 - 30, h2 * (0.22 + 7 * 0.095)); q.textAlign = 'left'; BIG.up(); } }, 120); } });
    // the concourse: the crowd crossing, the windows, the whisper of the vault
    const Q = queue(c, g, (u) => [1 + u * 18, 3.6 + Math.sin(u * 7) * 1.5, PI / 2], 10, { col: (k) => [0x2a3a6a, 0x5a3a2a, 0x3a5a4a, 0x2a2a2a][k % 4] }); c.tick((t, dt) => { for (const q of Q) { q.u = (q.u + dt * 0.03 * (q.k % 2 ? 1 : -1) + 1) % 1; q.o.position.set(1 + q.u * 18, 0, 3.6 + Math.sin(q.u * 7) * 1.5); q.o.rotation.y = q.k % 2 ? PI / 2 : -PI / 2; } });
    for (const x of [2.2, 17.8]) { column(c, g, x, -3, 7, 0.4); c.post(X(x), -3, 0.6); }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ color: 0x3a6a9a, toneMapped: false })); sky.rotation.x = PI / 2; sky.position.set(10, 6.94, -1); g.add(sky); for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), basic(c, 0xffe8a0)); s.rotation.x = PI / 2; s.position.set(3.5 + Math.random() * 13, 6.9, -3.8 + Math.random() * 5.6); g.add(s); }
    cast(c, r, g, X, 'anchor', 16.4, 1.0, { h: 1.8, ry: -0.9, line: 'This is the front. Of all of them. Stand on the star. The board does the rest, if you kept the ticket. Nobody keeps the ticket.', hint: 'The announcer', egg: 'anchor' });
    cast(c, r, g, X, 'susan', 3.6, 1.2, { h: 1.72, ry: 0.9, line: 'I was number nine million something. I am still number nine million something. Numbers do not expire. People do.', hint: 'A New Yorker' });
    prop(c, r, g, X, 'vintage_suitcase', 17.6, 4.6, { len: 0.9, ry: 0.4, r: 0.5 }); prop(c, r, g, X, 'mk_newsstand', 2.4, -5.4, { len: 2.2, ry: 0.4, r: 1.2 });
    notice(c, g, 'STAND ON THE "STAR" · UNDER THE CLOCK', 10, 0.06, 4.0, 0, 3.0, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    plaque(c, g, 15, 3.2, D / 2 - 0.13, PI, 'THANK YOU FOR "WAITING"', 'THE FRONT OF THE LINE', 2.4);
  },
};

const PROPS = {
  ticket: [['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }], ['metal_trash_can', 18.6, 5.4, { h: 0.8, r: 0.4 }], ['WetFloorSign_01', 1.8, 2.6, { h: 0.9, ry: 0.4, r: 0.3 }], ['fire_alarm', 0.4, 2.4, { h: 0.3, y: 1.8, ry: PI / 2 }]],
  market: [['mounted_fluorescent_lights', 10, -4, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 10, 3, { len: 1.6, y: 5.85 }], ['cardboard_box_01', 18.2, 5.2, { len: 0.8, r: 0.5 }], ['plastic_crate_01', 1.6, 5.0, { len: 0.6, r: 0.4 }]],
  club: [],
  deli: [['WetFloorSign_01', 1.8, 4.0, { h: 0.9, ry: 0.4, r: 0.3 }]],
  drop: [['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }], ['Shelf_01', 18.6, 0, { h: 2.0, ry: -PI / 2, r: 0.6 }]],
  santa: [['Chandelier_01', 10, 2, { h: 1.2, y: 5.5 }]],
  bathroom: [['hanging_industrial_lamp', 6, -2, { h: 0.8, y: 5.0 }], ['hanging_industrial_lamp', 14, -2, { h: 0.8, y: 5.0 }]],
  front: [['Chandelier_03', 6, -1, { h: 1.3, y: 5.6 }], ['Chandelier_03', 14, -1, { h: 1.3, y: 5.6 }]],
};
const SLOTS = { front: slotsSouthOnly, club: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; } };

let _ROOMS = null;
export function buildRoom(c, r) {
  if (!_ROOMS) _ROOMS = c.ROOMS;
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => { const b = c2.sign(`LINE ${r2.lvl} · TAKE A NUMBER`, { w: 2.6, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c2.MONO, weight: 700 }); b.position.set(W / 2 + PORTAL.w / 2 + 1.2, 2.6, -D / 2 + 0.14); g.add(b); if (r2.id !== 'ticket') for (const bd of TICKET.boards || []) bd.draw(); };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
