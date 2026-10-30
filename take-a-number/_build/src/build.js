// TAKE A NUMBER, room by room. A museum of New York lines: the DMV, the market, the rope, the deli ticket, the drop,
// Santaland, the bathroom at a bar, and the front of the line at Grand Central. The props are the branded nyb_ edits
// and Poly Haven (CC0) through the NEW YORKERS Blender lane, the people in the lines are the house extras and ON
// LOCATION's Tripo cast with eye flowers for heads, and the things on the shelves are instanced boxes with MLow labels.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { PI, INK, DZ1, DZ2, DH, Reflector, basic, std, here, local, shell, eyeFlower, decal, glowTex, glow, bulbs, watcher, extra, headTex, plaque, notice, board, label, plinth, column, confetti, slotsDefault, slotsSouthOnly, slotsWestFree, lane, stanchions, prop, cast, queue } from './kit.js';
import { alcove, column as pillar, coffer, neon, gold, recolor } from './fx.js';
export { eyeFlower };

// ---------- the ticket: one number for the whole museum, taken in room one, checked at every board, up at the end ----------
const TICKET = { n: 0, serving: 4, lost: false, taken: false, all: [] };
TICKET.redraw = () => TICKET.all.forEach((b) => b.draw());
function ticketBoard(c, g, x, y, z, ry, title, w = 2.4) {
  const b = board(c, g, w, w * 0.45, 256); b.m.position.set(x, y, z); b.m.rotation.y = ry;
  b.draw = (extra2 = '') => { const { q, W: w2, H: h2 } = b; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#f5c542'; q.font = `800 ${h2 * 0.14}px ${c.MONO}`; q.textAlign = 'left'; q.fillText(title, 18, h2 * 0.22); q.fillStyle = '#ff4a4a'; q.font = `900 ${h2 * 0.4}px ${c.MONO}`; q.fillText('NOW SERVING ' + TICKET.serving, 18, h2 * 0.62); q.fillStyle = '#f4ead2'; q.font = `600 ${h2 * 0.13}px ${c.MONO}`; q.fillText(TICKET.taken ? (TICKET.lost ? 'YOUR TICKET: LOST' : `YOUR TICKET: ${TICKET.n.toLocaleString('en-US')}`) + extra2 : 'TAKE A TICKET IN ROOM ONE' + extra2, 18, h2 * 0.88); b.up(); };
  b.draw(); TICKET.all.push(b); return b;
}
// the shuffle: a line of New Yorkers that inches along a path and never gets anywhere
function shuffle(c, g, pts, n, { speed = 0.08, col } = {}) {
  const Q = queue(c, g, (u) => { const p = pts(u); return [p[0], p[1], p[2]]; }, n, { col: col || ((k) => [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a, 0x3a2a5a][k % 5]) });
  c.tick((t, dt) => { for (const q of Q) { q.u = (q.u + dt * speed / n) % 1; const p = pts(q.u); q.o.position.set(p[0], 0, p[1]); q.o.rotation.y = p[2] ?? 0; q.o.userData.body.position.y = 1.0 + Math.max(0, Math.sin(t * 2.2 + q.k * 1.7)) * 0.02; q.o.userData.head.rotation.y = Math.sin(t * 0.7 + q.k) * 0.3; } });
  return Q;
}

// ---------- the dressing kit: textures drawn by code, glass, hung signs, shelves of products, rows of chairs ----------
const S = (c, n, rep = 1, tint) => c.surf(n, rep, tint);
const GLASS = {}; let CHROME = null;
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const chrome = (c) => (CHROME ||= std(c, 0xd0d4d8, { metalness: 1, roughness: 0.15 }));
const glass = (c, tint = 0xa0c0d0, op = 0.3) => (GLASS[tint + ':' + op] ||= new c.THREE.MeshStandardMaterial({ color: tint, transparent: true, opacity: op, roughness: 0.05, metalness: 0.2 }));
function box(c, g, w, h, d, mat, x, y, z, ry = 0) { const m = c.slab(w, h, d, mat, x, y, z); if (ry) m.rotation.y = ry; g.add(m); return m; }
function pane(c, g, w, h, x, y, z, ry = 0, tint, op) { return box(c, g, w, h, 0.04, glass(c, tint, op), x, y, z, ry); }
function texMat(c, t, o = {}) { t.wrapS = t.wrapT = c.THREE.RepeatWrapping; const m = new c.THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...o }); m.userData.rep = 1; return m; }
// velvet: a deep colour with a nap and folds
function velvet(c, col = '#6a0f1f') { return texMat(c, c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = col; q.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { q.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } for (let i = 0; i < 40; i++) { q.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.1})`; q.fillRect(Math.random() * w, 0, 3 + Math.random() * 10, h); } }), { roughness: 0.95 }); }
// tile: a checker with grout
function tile(c, a = '#f4f0e6', b = '#1a1a1a', n = 8) { return texMat(c, c.canvasTex(256, 256, (q, w, h) => { const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { q.fillStyle = (i + j) % 2 ? a : b; q.fillRect(i * s, j * s, s, s); } q.strokeStyle = 'rgba(0,0,0,.3)'; q.lineWidth = 2; for (let i = 0; i <= n; i++) { q.beginPath(); q.moveTo(i * s, 0); q.lineTo(i * s, h); q.stroke(); q.beginPath(); q.moveTo(0, i * s); q.lineTo(w, i * s); q.stroke(); } }), { roughness: 0.35 }); }
// a sign hung from the ceiling on two chains, the same text on both faces
function hung(c, g, text, x, y, z, ry, w, h, bg = '#0d0d0d', fg = '#f5c542', top = H_IN) {
  const o = new c.THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  for (const s of [1, -1]) { const a = c.sign(text, { w, h, bg, fg, font: c.FONT, weight: 900, px: 128 }); a.position.z = 0.02 * s; a.rotation.y = s > 0 ? 0 : PI; o.add(a); }
  const ch = std(c, 0x222222, { metalness: 0.8, roughness: 0.4 }), L = Math.max(0.05, top - y - h / 2); for (const dx of [-w * 0.4, w * 0.4]) o.add(c.slab(0.03, L, 0.03, ch, dx, h / 2 + L / 2, 0)); return o;
}
// products: instanced boxes with three MLow labels, tinted from the palette, scattered on shelf levels
let LABELS = null;
function products(c, parent, x0, x1, ys, z0, z1, n, seed = 0) {
  const { THREE } = c; LABELS ||= ['EYE CRUNCH', 'NAZAR COLA', 'MLOW TOYS'].map((name, i) => c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = ['#c81e1e', '#1d4ed8', '#f5c542'][i]; q.fillRect(0, h * 0.28, w, h * 0.3); q.fillStyle = i === 2 ? '#111' : '#fff'; q.font = `900 ${h * 0.15}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(name, w / 2, h * 0.43); eyeFlower(q, w / 2, h * 0.78, h * 0.13); }));
  const per = Math.ceil(n / 3), M = new THREE.Matrix4(), col = new THREE.Color(), V = new THREE.Vector3(); let k = seed * 7919 + 13;
  const rnd = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
  LABELS.forEach((t, li) => { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), per);
    for (let i = 0; i < per; i++) { const y = ys[(i + li) % ys.length], sx = 0.16 + rnd() * 0.16, sy = 0.18 + rnd() * 0.2, sz = 0.14 + rnd() * 0.12; M.makeRotationY((rnd() - 0.5) * 0.3); M.setPosition(x0 + rnd() * (x1 - x0), y + sy / 2, z0 + rnd() * (z1 - z0)); M.scale(V.set(sx, sy, sz)); m.setMatrixAt(i, M); col.set(INK[(i * 5 + li + seed) % INK.length]).lerp(new THREE.Color(0xffffff), 0.5); m.setColorAt(i, col); }
    m.instanceMatrix.needsUpdate = true; parent.add(m); });
}
// a row of chairs with people in some of them
function seats(c, r, g, X, x0, z, n, dx, { model = 'nyb_angrymen_chair', h = 0.92, ry = 0, fill = 0.6, seed = 0, rad = 0.3 } = {}) {
  for (let i = 0; i < n; i++) { const x = x0 + i * dx; prop(c, r, g, X, model, x, z, { h, ry, r: rad }); if (((i * 7 + seed * 3) % 10) / 10 < fill) extra(c, g, x, z, { seated: true, ry, col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a][(i + seed) % 4] }); }
}
// a mirror ball on a wire, with a glow
function mirrorBall(c, g, x, y, z, R, top = H_IN) { const { THREE } = c, m = new THREE.Mesh(new THREE.SphereGeometry(R, 18, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, flatShading: true, envMapIntensity: 2 })); m.position.set(x, y, z); g.add(m); g.add(c.slab(0.02, top - y - R, 0.02, std(c, 0x222222), x, y + R + (top - y - R) / 2, z)); glow(c, g, x, y, z, 'rgba(255,255,255,.45)', R * 3); c.tick((t) => { m.rotation.y = t * 0.4; }); return m; }
// a salami on a string
let SAL = null;
function salami(c, g, x, y, z, L = 0.6, R = 0.055) { const { THREE } = c; SAL ||= texMat(c, c.canvasTex(64, 128, (q, w, h) => { q.fillStyle = '#6a2a22'; q.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { q.fillStyle = `rgba(240,230,210,${0.3 + Math.random() * 0.5})`; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7); q.fill(); } q.strokeStyle = 'rgba(255,255,255,.35)'; q.lineWidth = 2; for (let i = 0; i < 8; i++) { q.beginPath(); q.moveTo(0, i * 16); q.lineTo(w, i * 16); q.stroke(); } }), { roughness: 0.7 }); const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.9, L, 10), SAL); m.position.set(x, y, z); g.add(m); g.add(c.slab(0.01, 0.4, 0.01, basic(c, 0xd8c8a0), x, y + L / 2 + 0.2, z)); return m; }
// a candy cane: a tube along a J, striped
let CANE = null;
function cane(c, g, x, z, h = 1.6, ry = 0) { const { THREE } = c; CANE ||= (() => { const t = c.canvasTex(64, 64, (q, w, hh) => { q.fillStyle = '#f4f0ea'; q.fillRect(0, 0, w, hh); q.fillStyle = '#c81e1e'; for (let i = -2; i < 6; i++) { q.beginPath(); q.moveTo(i * 16, 0); q.lineTo(i * 16 + 8, 0); q.lineTo(i * 16 + 8 + 64, hh); q.lineTo(i * 16 + 64, hh); q.closePath(); q.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }); })();
  const R = h * 0.18, pts = []; for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(0, i / 6 * (h - R), 0)); for (let i = 1; i <= 8; i++) { const a = PI - i / 8 * PI; pts.push(new THREE.Vector3(R + R * Math.cos(a), h - R + R * Math.sin(a), 0)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, h * 0.045, 8), CANE); m.position.set(x, 0.02, z); m.rotation.y = ry; g.add(m); return m; }
// a garland: a green swag between two points with lights along it
function garland(c, g, x1, y1, z1, x2, y2, z2, sag = 0.7) { const { THREE } = c, a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= sag; const cv = new THREE.QuadraticBezierCurve3(a, mid, b); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.09, 6), std(c, 0x1e4a24, { roughness: 1 }))); const on = basic(c, 0xffe8a0), geo = new THREE.SphereGeometry(0.035, 6, 5); for (let i = 1; i < 12; i++) { const p = cv.getPoint(i / 12), s = new THREE.Mesh(geo, on); s.position.copy(p); s.position.y -= 0.1; g.add(s); } }
// a tray vault: four slopes from a rectangle at y0 up to a smaller one at y1, the sky painted on it
function vault(c, g, x0, x1, z0, z1, y0, y1, inset, mat) {
  const { THREE } = c, P = [], U = [], I = [], add = (x, y, z) => { P.push(x, y, z); U.push(x / 12, z / 12); return P.length / 3 - 1; };
  const o = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => add(x, y0, z)), n = [[x0 + inset, z0 + inset], [x1 - inset, z0 + inset], [x1 - inset, z1 - inset], [x0 + inset, z1 - inset]].map(([x, z]) => add(x, y1, z));
  for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; I.push(o[k], n[k], n[k2], o[k], n[k2], o[k2]); } I.push(n[0], n[1], n[2], n[0], n[2], n[3]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat); g.add(m); return m;
}
// a poster: a framed canvas drawn by code
function poster(c, g, x, y, z, ry, w, h, draw) { const o = new c.THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); o.add(c.slab(w + 0.08, h + 0.08, 0.03, std(c, 0x111111, { roughness: 0.5 }), 0, 0, -0.02)); const d = decal(c, w, h, draw, 320); d.position.z = 0.005; o.add(d); return o; }
const deptPoster = (title, line, col = '#c81e1e') => (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = col; q.fillRect(0, 0, w, h * 0.16); q.fillStyle = '#fff'; q.font = `900 ${h * 0.07}px ${'"Space Grotesk", Arial, sans-serif'}`; q.textAlign = 'center'; q.fillText('DEPT. OF THE COUNTED', w / 2, h * 0.11); eyeFlower(q, w / 2, h * 0.48, w * 0.26); q.fillStyle = '#111'; q.font = `900 ${h * 0.085}px ${'"Space Grotesk", Arial, sans-serif'}`; q.fillText(title, w / 2, h * 0.82); q.font = `600 ${h * 0.05}px monospace`; q.fillText(line, w / 2, h * 0.9); };

const ROOM = {
  // TAKE A NUMBER. The ticket machine gives you a number. The board serves another. They will never meet.
  ticket(c, r, g, X) {
    const { THREE } = c, marble = S(c, 'marble', 1.2, 0xd8d4c8), steel = S(c, 'steel', 1, 0x9aa0a8), panel = S(c, 'planks', 1.4, 0xc8a870), cream = S(c, 'plaster', 1, 0xe8e0c8), brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.3 });
    // the hero: the machine on a marble plinth in the middle of the floor, under a board the size of a wall
    g.add(c.slab(1.4, 0.3, 1.4, marble, 10, 0.15, -0.4)); const mc = new THREE.Group(); mc.position.set(10, 0.3, -0.4); g.add(mc); c.post(X(10), -0.4, 0.85);
    mc.add(c.slab(0.5, 1.2, 0.4, std(c, 0xc81e1e, { roughness: 0.4 }), 0, 0.6, 0)); mc.add(c.slab(0.3, 0.06, 0.3, std(c, 0x111111), 0, 1.23, 0)); const slot = c.slab(0.16, 0.03, 0.2, std(c, 0xf4ead2), 0, 1.0, 0.21); mc.add(slot);
    const lbl = c.sign('TAKE A\nNUMBER', { w: 0.44, h: 0.4, bg: '#f4ead2', fg: '#c81e1e', font: c.FONT, weight: 900, px: 128 }); lbl.position.set(0, 0.7, 0.21); mc.add(lbl);
    mc.add(c.slab(0.06, 0.5, 0.06, brass, 0, 1.5, 0)); const arrowS = c.sign('"HERE"', { w: 0.6, h: 0.22, bg: '#f5c542', fg: '#111', font: c.FONT, weight: 900, px: 96 }); arrowS.position.set(0, 1.82, 0); mc.add(arrowS);
    const boards = [ticketBoard(c, g, 10, 4.4, -1.9, 0, 'DEPARTMENT OF WAITING · ALL WINDOWS · OPEN: NONE', 6), ticketBoard(c, g, 10, 5.2, -D / 2 + 0.3, 0, 'WINDOW 1 TO 6', 3.4), ticketBoard(c, g, 10, 5.0, D / 2 - 0.3, PI, 'ROOM 2 · ALSO CLOSED', 2.4)];
    box(c, g, 6.2, 2.8, 0.1, steel, 10, 4.4, -1.98); for (const dx of [-2.6, 2.6]) box(c, g, 0.04, 0.4, 0.04, std(c, 0x222222, { metalness: 0.8 }), 10 + dx, 5.9, -1.94);
    const tk = decal(c, 0.4, 0.6, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); }); tk.visible = false; tk.position.set(0.3, 1.1, 0.4); mc.add(tk);
    c.clickable(mc, () => {
      if (TICKET.taken) { c.toast(`You have a ticket. ${TICKET.n.toLocaleString('en-US')}. One per customer. The customer is you. Forever.`, 3000); return; }
      TICKET.taken = true; TICKET.n = 9000000 + Math.floor(Math.random() * 999999); c.sound.ticket && c.sound.ticket(); c.flash(0.1);
      const q = tk.material.map.userData.canvas.getContext('2d'), w = q.canvas.width, h = q.canvas.height; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 ${h * 0.09}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('YOUR NUMBER', w / 2, h * 0.3); q.font = `900 ${h * 0.16}px ${c.MONO}`; q.fillText(TICKET.n.toLocaleString('en-US'), w / 2, h * 0.55); q.font = `600 ${h * 0.07}px ${c.MONO}`; q.fillText('KEEP THIS TICKET', w / 2, h * 0.8); tk.material.map.needsUpdate = true; tk.visible = true;
      c.egg('ticket_number', `Number ${TICKET.n.toLocaleString('en-US')}. Now serving 4. At one a minute that is ${Math.round((TICKET.n - 4) / 525600)} years. Keep the ticket. The ticket is the whole museum.`);
      TICKET.redraw();
    }, 'The ticket machine');
    // the board counts, mostly up
    let ac = 0; c.tick((t, dt, P, ri) => { ac += dt; if (ac > 11) { ac = 0; TICKET.serving += Math.random() < 0.8 ? 1 : -1; TICKET.redraw(); if (here(r, ri)) c.sound.beep && c.sound.beep(); if (TICKET.serving === 3) c.egg('ticket_backwards', 'Now serving 3. It went backwards. Somebody at window 7 asked a question.'); } });
    lane(c, g, 10, 5.0, 10, 0.8); notice(c, g, 'TAKE A NUMBER "FIRST"', 10, 0.06, 2.8, 0, 2.6, 0.26, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    // the nook: six service windows along a marble counter, brass bars, blinds down on five, the clerk at the one that is open and at lunch
    for (let k = 0; k < 6; k++) { const x = 2.6 + k * 2.96, open = k === 3; box(c, g, 2.6, 1.05, 0.7, marble, x, 0.525, -5.4); box(c, g, 2.6, 0.06, 0.8, std(c, 0x1a1a1a, { roughness: 0.3 }), x, 1.08, -5.4); pane(c, g, 2.4, 1.9, x, 2.05, -5.4); for (let b = 0; b < 7; b++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.9, 6), brass), x - 1.05 + b * 0.35, 2.05, -5.37));
      box(c, g, 0.16, 3.3, 0.9, panel, x + 1.48, 1.65, -5.4); if (!open) box(c, g, 2.3, 1.3, 0.03, cream, x, 1.75, -5.62); box(c, g, 0.5, 0.03, 0.3, brass, x - 0.6, 1.12, -5.2); box(c, g, 0.3, 0.06, 0.22, std(c, 0xf4ead2), x + 0.7, 1.14, -5.2);
      notice(c, g, open ? 'WINDOW ' + (k + 1) + ' · OPEN' : 'WINDOW ' + (k + 1) + ' · CLOSED', x, 3.3, -5.36, 0, 1.6, 0.26, '#0d0d0d', open ? '#5aff8a' : '#ff4a4a'); }
    box(c, g, 0.16, 3.3, 0.9, panel, 1.12, 1.65, -5.4); c.wall(X(1.0), -5.05, X(18.7), -5.05);
    cast(c, r, g, X, 'clerk', 11.5, -6.3, { h: 1.76, ry: 0, line: () => TICKET.taken ? `${TICKET.n.toLocaleString('en-US')}? We are on 4. Have a seat. The seats are for 4.` : 'Take a number first. The number is the whole point. The number is the museum.', hint: 'The clerk', egg: 'ticket_clerk' });
    notice(c, g, 'AT LUNCH · BACK AT "4"', 11.5, 1.4, -5.63, 0, 1.2, 0.2, '#f4ead2', '#c81e1e');
    // behind the glass: files, desks, fans, the mail cart, a clerk who is not the clerk
    prop(c, r, g, X, 'nyb_apartment_files', 2.4, -7.4, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'nyb_apartment_files', 19.2, -6.6, { h: 1.3, ry: -PI / 2, r: 0.4 });
    prop(c, r, g, X, 'nyb_apartment_desk', 5.6, -6.9, { len: 1.5, ry: PI }); extra(c, g, 5.6, -7.4, { seated: true, ry: 0, col: 0x4a3a2a }); prop(c, r, g, X, 'nyb_crowd_desk', 15.4, -6.9, { len: 1.5, ry: PI });
    prop(c, r, g, X, 'nyb_crowd_fan', 14.3, -5.6, { h: 0.45, y: 1.1 }); prop(c, r, g, X, 'nyb_angrymen_fan', 19.2, -6.6, { h: 0.45, y: 1.3 }); prop(c, r, g, X, 'nyb_miracle_mailcart', 8.6, -7.0, { len: 1.0, ry: 0.4 });
    // the queue pen in front of the windows: a long line that inches east and never arrives
    shuffle(c, g, (u) => [1.8 + u * 16.2, -4.3 + Math.sin(u * 11) * 0.2, -PI / 2], 14, { speed: 0.1 });
    stanchions(c, g, X, [[1.2, -3.5], [18.8, -3.5]], { tape: true }); lane(c, g, 1.8, -4.3, 18, -4.3, 0xf5c542, 0.8);
    // the waiting room: rows of chairs with people in them, an aisle down the middle for the machine
    [-2.4, -1.1, 0.2, 1.5].forEach((z, j) => { seats(c, r, g, X, 2.2, z, 4, 1.3, { seed: j, fill: 0.65 }); seats(c, r, g, X, 12.8, z, 4, 1.3, { seed: j + 4, fill: 0.6 }); });
    prop(c, r, g, X, 'nyb_dogday_desk', 18.6, -0.6, { len: 1.6, ry: -PI / 2, r: 0.7 }); extra(c, g, 19.3, -0.6, { seated: true, ry: -PI / 2, col: 0x2a2a3a }); notice(c, g, 'INFORMATION · NO', 18.6, 1.9, -0.6, -PI / 2, 1.4, 0.22, '#0d0d0d', '#f5c542');
    prop(c, r, g, X, 'nyb_angrymen_wetfloor', 6.6, 1.9, { h: 0.8, ry: 0.5, r: 0.3 }); prop(c, r, g, X, 'nyb_trash_dsny', 1.0, 0.9, { h: 1.0, r: 0.4 }); prop(c, r, g, X, 'nyb_extinguisher', 0.3, 0.1, { h: 0.6, y: 1.0, ry: PI / 2 });
    // the mezzanine: ROOM 2 UPSTAIRS, railed, five people looking down, also closed; the elevator that would take you is out
    const deck = S(c, 'planks', 2, 0x8a6a48); box(c, g, W, 0.16, 2.4, deck, W / 2, 3.5, 6.8); box(c, g, W, 0.5, 0.1, steel, W / 2, 3.32, 5.62); const rm = std(c, 0x1a1a1a, { metalness: 0.7, roughness: 0.4 });
    for (let k = 0; k <= 10; k++) box(c, g, 0.05, 1.0, 0.05, rm, k * 2, 4.08, 5.7); box(c, g, W, 0.05, 0.05, rm, W / 2, 4.58, 5.7); box(c, g, W, 0.03, 0.03, rm, W / 2, 4.1, 5.7);
    notice(c, g, 'ROOM 2 · UPSTAIRS · "ALSO CLOSED"', 10, 3.32, 5.56, 0, 4.4, 0.36, '#0d0d0d', '#f5c542');
    [3, 7, 10.5, 14, 17].forEach((x, i) => { const e = extra(c, g, x, 6.9, { ry: 0, col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a, 0x6a5a2a, 0x3a2a5a][i] }); e.position.y = 3.58; });
    box(c, g, 1.2, 2.2, 0.1, panel, 18.5, 4.68, 7.8); notice(c, g, 'ROOM 2', 18.5, 5.95, 7.72, PI, 1.0, 0.2, '#0d0d0d', '#f4ead2');
    box(c, g, 0.14, 2.4, 1.3, steel, 0.32, 1.2, 7.0); box(c, g, 0.02, 2.2, 0.03, std(c, 0x111111), 0.4, 1.1, 7.0); notice(c, g, 'ELEVATOR · OUT OF SERVICE · USE STAIRS · STAIRS: SEE ELEVATOR', 0.4, 2.8, 7.0, PI / 2, 1.5, 0.3, '#f4ead2', '#c81e1e');
    // under the deck: the forms desk, the cooler, the mail cart's twin
    prop(c, r, g, X, 'nyb_dogday_desk', 18.9, 6.6, { len: 1.6, ry: PI / 2, r: 0.7 }); prop(c, r, g, X, 'clipboard', 18.9, 6.6, { len: 0.4, y: 0.76, egg: ['A clipboard', 'ticket_form', 'Form MV-82. Fill it in black ink. The pen is blue. The pen is chained to the desk. The desk is form MV-83.'] }); prop(c, r, g, X, 'office_notepads', 19.2, 7.1, { len: 0.3, y: 0.76 });
    prop(c, r, g, X, 'nyb_crowd_cooler', 0.9, 6.6, { h: 1.3, r: 0.4, hint: 'The cooler', fn: (cc, m) => cc.say(m, 'Empty since 4. Nobody has refilled it. Nobody has been called to refill it.', 2600, 1.4) }); prop(c, r, g, X, 'nyb_miracle_mailcart', 13.6, 6.6, { len: 1.0, ry: -0.3, r: 0.6 });
    // the walls: clocks that disagree, signs, the air conditioner, the camera that counts
    prop(c, r, g, X, 'wall_clock', 5.6, -D / 2 + 0.3, { len: 0.6, y: 5.2, egg: ['The clock', 'ticket_clock', 'The clock is right. It is the only thing in the building that is right, and nobody has asked it a question.'] });
    prop(c, r, g, X, 'nyb_apartment_clock', 0.3, 0.6, { len: 0.5, y: 3.6, ry: PI / 2 }); prop(c, r, g, X, 'nyb_crowd_clock', 19.6, 0.6, { len: 0.5, y: 3.6, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_dogday_clock', 11.3, D / 2 - 0.3, { len: 0.5, y: 2.75, ry: PI });
    notice(c, g, 'NO "LINE" · THE LINE IS A NUMBER', 2.0, 3.5, -D / 2 + 0.3, 0, 3.2, 0.3, '#0d0d0d', '#f5c542'); notice(c, g, 'NO PHONES · NO PHOTOS · NO QUESTIONS', 18.0, 3.5, -D / 2 + 0.3, 0, 3.2, 0.3, '#0d0d0d', '#ff4a4a');
    poster(c, g, 0.3, 2.0, 6.0, PI / 2, 0.8, 1.1, deptPoster('TAKE A NUMBER', 'THE NUMBER IS YOU')); poster(c, g, 19.6, 2.4, 5.0, -PI / 2, 0.8, 1.1, deptPoster('WINDOW 4', 'OPEN. CLOSED. OPEN.', '#1d4ed8')); poster(c, g, 3.2, 3.0, -D / 2 + 0.3, 0, 0.8, 1.1, deptPoster('FORM MV-82', 'BLACK INK ONLY', '#f5c542'));
    prop(c, r, g, X, 'nyb_aircon', 0.4, -3.0, { h: 0.5, y: 4.6, ry: PI / 2 }); prop(c, r, g, X, 'nyb_seccam_counted', 19.4, 7.3, { h: 0.3, y: 5.3, ry: PI * 0.75 });
    // overhead: a drop ceiling grid and the fixtures
    coffer(c, r, g, { nx: 8, nz: 6, y: 6, mat: S(c, 'plaster', 1, 0xd8d4cc), bulb: 0 });
    plaque(c, g, 10, 3.0, D / 2 - 0.13, PI, 'NOW SERVING "4"', 'THE DEPARTMENT OF WAITING', 2.4);
    TICKET.boards = boards;
  },

  // THE LINE FOR THE LINE. The aisle moves with you. Walking backwards is the way out.
  market(c, r, g, X) {
    const { THREE } = c, wood = S(c, 'planks', 1.2, 0xd8c8a8), cream = S(c, 'plaster', 1, 0xf0e8d8), steel = S(c, 'steel', 1, 0xb0b4b8);
    // the aisle runs east to west along z -3.1, shelves on both sides as a ring that slides; walk west and the shelves walk with you
    const run = 2.8, N = 8, L = run * N, units = [], aisle = new THREE.Group(); g.add(aisle); let off = 0;
    for (const [zc, back] of [[-4.9, -0.5], [-1.3, 0.5]]) for (let k = 0; k < N; k++) { const sh = new THREE.Group(); sh.position.set(0, 0, zc); aisle.add(sh); units.push({ sh, base: k * run });
      for (const y of [0.35, 0.95, 1.55]) sh.add(c.slab(run, 0.05, 1.0, wood, 0, y, 0)); for (const a of [-run / 2 + 0.03, run / 2 - 0.03]) sh.add(c.slab(0.05, 2.1, 1.0, wood, a, 1.05, 0)); sh.add(c.slab(run, 2.1, 0.05, wood, 0, 1.05, 0)); for (const sd of [-1, 1]) { sh.add(c.slab(run, 0.3, 0.06, std(c, 0xc81e1e, { roughness: 0.5 }), 0, 2.0, sd * 0.49));
      const tag = c.sign(['EYE CRUNCH · 2 FOR 5', 'NAZAR COLA · COLD', 'MLOW TOYS · AISLE 1', 'DIP · THE DIP', 'EVERYTHING · 3.99'][(k + (sd > 0 ? 2 : 0)) % 5], { w: 1.6, h: 0.18, bg: '#f5c542', fg: '#111', font: c.FONT, weight: 900, px: 64 }); tag.position.set(0, 2.0, sd * 0.53); tag.rotation.y = sd > 0 ? 0 : PI; sh.add(tag);
      products(c, sh, -run / 2 + 0.15, run / 2 - 0.15, [0.38, 0.98, 1.58], sd > 0 ? 0.06 : -0.42, sd > 0 ? 0.42 : -0.06, 27, k + (back < 0 ? 0 : 8) + (sd > 0 ? 16 : 0)); } }
    const place = () => { for (const u of units) { let x = ((u.base + off) % L + L) % L - 1.4; u.sh.position.x = x; } }; place();
    c.wall(X(1.0), -4.4, X(19.0), -4.4); c.wall(X(1.0), -1.8, X(19.0), -1.8); c.wall(X(1.0), -5.4, X(19.0), -5.4); c.wall(X(1.0), -0.8, X(19.0), -0.8);
    // the line in the aisle, carts and crates and all, shuffling west toward the samples
    const Q = shuffle(c, g, (u) => [18 - u * 16.2, -3.1 + Math.sin(u * 12) * 0.25, PI / 2], 11, { speed: 0.12 });
    for (let i = 0; i < 4; i++) prop(c, r, g, X, 'hand_truck', 15.5 - i * 3.6, -2.5, { h: 1.0, ry: PI / 2 + 0.3, r: 0.3 });
    for (const [x, m] of [[16.2, 'nyb_milkcrate_pink'], [9.4, 'nyb_milkcrate_cyan'], [4.2, 'nyb_milkcrate_pink']]) prop(c, r, g, X, m, x, -2.1, { len: 0.5 });
    // the treadmill: walking west in the aisle clamps you and slides the shelves; walking east lets you through
    let esc = 0, warned = 0;
    r.move = (P, nx, nz, dt) => { const L2 = local(r, P); const inAisle = L2.z > -4.4 && L2.z < -1.8 && L2.x > 1.8 && L2.x < 18.6; if (!inAisle) return [nx, nz]; const dx = nx - P.x; if (dx < 0) { off = (off - dx) % L; place(); return [P.x, nz]; } esc += dx; if (esc > 2 && !warned) { warned = 1; c.egg('market_backwards', 'Backwards. The line only holds you if you want what it wants. Walk away from the samples and the aisle lets go.'); } return [nx, nz]; };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L2 = local(r, P); if (L2.z > -4.4 && L2.z < -1.8 && L2.x < 17 && !r.told) { r.told = true; c.toast('The aisle. Walk forward and the shelves walk with you. The line never shortens. Try walking backwards.', 4200); } });
    // the samples station at the head of the aisle, the one per customer
    box(c, g, 0.8, 0.9, 2.4, cream, 1.2, 0.45, -3.1); c.wall(X(1.6), -4.4, X(1.6), -1.8); cast(c, r, g, X, 'workgirl', 0.7, -3.1, { h: 1.74, ry: -PI / 2, r: 0, line: 'Samples. One per customer. The customer is the line. The line gets one.', hint: 'The samples', egg: 'market_sample' });
    prop(c, r, g, X, 'food_pomegranate_01', 1.2, -3.4, { h: 0.12, y: 0.9 }); prop(c, r, g, X, 'food_lime_01', 1.2, -2.8, { h: 0.1, y: 0.9 }); notice(c, g, 'SAMPLES · "ONE"', 1.6, 1.15, -3.1, PI / 2, 0.8, 0.16, '#f5c542', '#111');
    hung(c, g, 'AISLE 1 · EVERYTHING · ALSO THE LINE', 10, 3.6, -3.1, 0, 3.2, 0.36); hung(c, g, 'SAMPLES · THIS WAY · FOREVER', 4, 3.6, -3.1, 0, 2.6, 0.36);
    // the nook: two checkout lanes under a low fluorescent ceiling, register 4 open and unreachable
    box(c, g, 7.2, 0.14, 3.4, cream, 4.4, 2.9, 1.0); for (const x of [2.4, 4.4, 6.4]) { box(c, g, 1.2, 0.05, 0.3, basic(c, 0xfff4e0), x, 2.8, 1.0); glow(c, g, x, 2.7, 1.0, 'rgba(255,240,210,.5)', 1.6); }
    for (const [z, reg, n] of [[0.1, 'nyb_register_gold', '4'], [1.7, 'nyb_batteries_register', '5']]) { box(c, g, 3.0, 0.9, 0.7, steel, 4.0, 0.45, z); box(c, g, 2.0, 0.02, 0.5, std(c, 0x111111, { roughness: 0.3 }), 4.6, 0.91, z); prop(c, r, g, X, reg, 2.6, z, { len: 0.6, y: 0.9, ry: PI }); c.wall(X(2.5), z - 0.35, X(5.5), z - 0.35); c.wall(X(2.5), z + 0.35, X(5.5), z + 0.35); hung(c, g, 'LANE ' + n + (n === '4' ? ' · OPEN' : ' · CLOSED'), 4.0, 2.3, z, PI / 2, 1.1, 0.26, '#0d0d0d', n === '4' ? '#5aff8a' : '#ff4a4a', 2.85); pane(c, g, 1.6, 1.2, 1.6, 1.5, z, PI / 2); }
    cast(c, r, g, X, 'dad', 2.6, -0.7, { h: 1.78, ry: 0, line: 'Register 4 is open. Register 4 is always open. Nobody can reach register 4.', hint: 'Register 4' });
    [[3.8, 0.9], [5.0, 0.9], [6.2, 0.9]].forEach(([x, z], i) => extra(c, g, x, z, { ry: PI / 2, col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a][i] })); prop(c, r, g, X, 'nyb_milkcrate_cyan', 6.4, 1.7, { len: 0.5, y: 0.9 }); prop(c, r, g, X, 'nyb_milkcrate_pink', 1.2, 0.1, { len: 0.5, y: 0.9 });
    // the middle of the floor: the display table, the fruit stand, the coffee cart, the wet floor
    prop(c, r, g, X, 'nyb_mcmlow_table', 10.4, -0.2, { len: 1.6, r: 0.9 }); prop(c, r, g, X, 'ph_carrot_cake', 9.9, -0.2, { h: 0.4, y: 0.78, egg: ['A cake', 'market_cake', 'The cake. Wrapped. Six ninety nine. The line for the cake is the line.'] }); prop(c, r, g, X, 'ph_wine_bottles_01', 10.9, -0.2, { len: 0.6, y: 0.78, hint: 'Two buck chuck', fn: (cc, m) => cc.say(m, 'Three dollars now. Wrapped. Still the best deal in the building, including the exit.', 2600, 0.7) });
    prop(c, r, g, X, 'nyb_heat_fruitstand', 14.2, 0.4, { len: 1.8, r: 1.0 }); prop(c, r, g, X, 'bananas', 14.2, 0.4, { len: 0.6, y: 0.9 }); products(c, g, 13.5, 14.9, [0.45, 0.95, 1.45], 0.15, 0.65, 24, 51); prop(c, r, g, X, 'nyb_coffeecart', 17.2, 0.6, { len: 1.6, ry: -0.3, r: 0.9, egg: ['The coffee cart', 'market_coffee', 'Coffee, regular. Regular means milk and two sugars. Regular also means forty minutes. The cart has no line, which is suspicious.'] });
    prop(c, r, g, X, 'nyb_mcmlow_wetfloor', 12.6, 1.4, { h: 0.8, ry: -0.4, r: 0.3 }); prop(c, r, g, X, 'wooden_crate_02', 16.6, -0.9, { len: 0.9, r: 0.5 }); prop(c, r, g, X, 'cardboard_box_01', 16.6, -0.9, { len: 0.7, y: 0.5 });
    // the frozen aisle: a cold alcove in the south east corner, glass doors, a blue hum
    const fz = alcove(c, r, g, X, { side: 'e', at: 6.9, w: 2.0, d: 1.5, h: 2.6, mat: steel, floorMat: tile(c, '#e8ecf0', '#c8d0d8', 6), light: 0x9ad0ff });
    for (const dz of [-0.55, 0.55]) { const p = pane(c, fz, 0.9, 2.0, dz, 1.15, -0.5, 0, 0xc0e0ff, 0.25); c.clickable(p, () => { c.egg('market_freezer', 'The freezer. Mandarin orange chicken, the last bag. Behind the glass it is cold. In front of the glass it is a line.'); c.sound.click && c.sound.click(); }, 'The freezer door'); } box(c, fz, 2.0, 0.08, 0.06, std(c, 0x222222), 0, 2.2, -0.45); glow(c, fz, 0, 1.4, -0.4, 'rgba(160,220,255,.4)', 2.2);
    notice(c, g, 'FROZEN · "LAST BAG"', 18.9, 2.9, 5.76, -PI / 2, 1.5, 0.22, '#0d0d0d', '#9ad0ff');
    // the walls and the flanks: branded shelves, the clock, the air, the camera
    prop(c, r, g, X, 'nyb_copa_shelves', 1.3, -7.3, { h: 1.45, r: 0.6 }); prop(c, r, g, X, 'nyb_big_shelves', 18.3, -7.3, { h: 2.2, r: 0.8 }); products(c, g, 17.4, 19.2, [0.5, 1.1, 1.7], -7.5, -7.1, 18, 31);
    prop(c, r, g, X, 'nyb_batteries_clock', 10, -D / 2 + 0.3, { len: 0.6, y: 5.3 }); prop(c, r, g, X, 'nyb_aircon', 19.6, -3.0, { h: 0.5, y: 4.6, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_seccam_counted', 0.5, 7.4, { h: 0.3, y: 5.3, ry: PI / 4 });
    poster(c, g, 0.3, 2.2, 7.0, PI / 2, 0.8, 1.1, deptPoster('THE LINE', 'FORTY MINUTES FOR DIP', '#1d4ed8')); poster(c, g, 19.6, 2.2, -1.0, -PI / 2, 0.8, 1.1, deptPoster('EYE CRUNCH', 'TWO FOR FIVE'));
    // overhead: the bulbs, the ducts, the fluorescents from the table
    bulbs(c, g, 2, 18, 5.5, -3.1, 24, 0xfff0c0); bulbs(c, g, 2, 18, 5.5, 3.6, 24, 0xfff0c0);
    notice(c, g, 'THE LINE STARTS "HERE" · ALSO THERE', 10, 4.6, -D / 2 + 0.3, 0, 3.6, 0.32, '#0d0d0d', '#f5c542');
    plaque(c, g, 15, 3.5, D / 2 - 0.13, PI, 'FORTY MINUTES FOR "DIP"', 'THE LINE FOR THE LINE', 2.4);
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE MARKET · NOW SERVING EVERYONE BUT YOU');
  },

  // THE ROPE. The bouncer only lets the line move while you are not looking at him.
  club(c, r, g, X) {
    const { THREE } = c, vel = velvet(c, '#5a0c1c'), velB = velvet(c, '#101428'), chrome = std(c, 0xc8ccd4, { metalness: 1, roughness: 0.2 }), dark = S(c, 'concrete', 1, 0x2a2630);
    const door = c.slab(2.6, 3.2, 0.3, vel, 10, 1.6, -5.9); g.add(door); c.wall(X(8.7), -5.7, X(11.3), -5.7); box(c, g, 3.2, 0.2, 1.4, dark, 10, 3.5, -5.2); box(c, g, 0.08, 0.6, 0.08, chrome, 8.5, 3.3, -4.55); box(c, g, 0.08, 0.6, 0.08, chrome, 11.5, 3.3, -4.55);
    const neonS = c.sign('STUDIO N3W', { w: 3.4, h: 0.7, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 24, px: 200 }); neonS.position.set(10, 4.0, -5.7); g.add(neonS);
    bulbs(c, g, 7.5, 12.5, 3.4, -5.7, 12, 0xff4fa3); bulbs(c, g, 8.5, 11.5, 3.42, -4.5, 8, 0xffe0a0);
    const pl = new THREE.PointLight(0xff4fa3, 20, 14, 1.6); pl.position.set(10, 3.5, -4.5); g.add(pl);
    // the rope and the line behind it (the lane stops short of the door lane so the room stays walkable)
    stanchions(c, g, X, [[6.8, -4.0], [13.2, -4.0]]); stanchions(c, g, X, [[12.6, -2.6], [12.6, 2.0]]); stanchions(c, g, X, [[7.4, -2.6], [7.4, 2.0]]);
    const N = 12, Qs = []; for (let i = 0; i < N; i++) { const z = -3.0 + i * 0.52; Qs.push({ o: extra(c, g, 10 + Math.sin(i) * 0.4, z, { col: [0x6a2a5a, 0x2a2a6a, 0xa02a3a, 0x2a6a6a][i % 4] }), z, home: z }); }
    const bouncer = cast(c, r, g, X, 'boxer', 10, -4.8, { h: 1.95, ry: 0, r: 0.5, line: 'You are not on the list. The list is not on the list. Stop looking at me.', hint: 'The bouncer' });
    box(c, g, 0.6, 1.1, 0.5, velB, 8.6, 0.55, -4.7); prop(c, r, g, X, 'clipboard', 8.6, -4.7, { len: 0.4, y: 1.1, ry: 0.3 }); notice(c, g, 'THE "LIST"', 8.6, 0.8, -4.44, 0, 0.5, 0.14, '#f5c542', '#111'); c.post(X(8.6), -4.7, 0.45); prop(c, r, g, X, 'nyb_blackswan_boombox', 11.4, -4.7, { len: 0.6, y: 0.0, ry: -0.3 });
    const fwd = new THREE.Vector3(); let moved = 0, seenT = 0, inside = false, lastSeen = false;
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE ROPE · NOW SERVING NOBODY');
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || inside) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -4.8 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const seen = dot > 0.55 && d < 16;
      if (seen !== lastSeen) { lastSeen = seen; if (seen && moved > 0.5) c.say(bouncer, ['Stop.', 'Eyes.', 'Nobody moves.', 'I said.'][(moved * 3 | 0) % 4], 1200, 2.2); }
      if (!seen) { moved += dt; for (const q of Qs) { q.z -= dt * 0.35; if (q.z < -3.4) { q.z = 2.8; } q.o.position.z = q.z; }
        // you move too, if you are in the lane
        if (L.x > 7.6 && L.x < 12.4 && L.z > -3.2 && L.z < 5.4) { c.P.z -= dt * 0.35; }
      } else seenT += dt;
      if (!seen && L.x > 8.7 && L.x < 11.3 && L.z < -3.6) { inside = true; c.sound.disco && c.sound.disco(); c.flash(0.6); c.egg('club_inside', 'You are in. You never looked at him. The whole line went in behind you. Inside it is a room exactly like this one, with worse music.'); setTimeout(() => c.toast('Inside. It is 1977 in here and it is the same room. The bathroom line is two rooms east.', 4200), 1500); }
      if (seenT > 20 && !r.stared) { r.stared = true; c.egg('club_staring', 'Twenty seconds looking at the bouncer. Nobody has moved. He has not blinked. He is also a painting.'); } });
    cast(c, r, g, X, 'discoking', 3.4, 1.8, { h: 1.8, ry: 0.8, line: 'I was in. I came out for air. There is no air. Now I am in line. The line is the club.', hint: 'The disco king', egg: 'club_king' });
    cast(c, r, g, X, 'gown', 15.0, 2.0, { h: 1.78, ry: -0.8, line: 'The trick is to not want it. He can smell wanting it. Also he is looking at you right now.', hint: 'The gown' });
    // the hero: a mirror ball the size of a cab over the line, two little ones over the corners, the chandelier at the door
    mirrorBall(c, g, 10, 4.2, -1.0, 1.0); mirrorBall(c, g, 4, 4.8, 0.6, 0.4); mirrorBall(c, g, 16, 4.8, 0.6, 0.4);
    prop(c, r, g, X, 'nyb_disco_chandelier', 10, -5.4, { h: 1.2, y: 4.6 }); prop(c, r, g, X, 'nyb_fame_speaker', 6.8, -5.6, { h: 0.9, y: 2.6, ry: 0.6 }); prop(c, r, g, X, 'nyb_fame_speaker', 13.2, -5.6, { h: 0.9, y: 2.6, ry: -0.6 }); for (const x of [6.8, 13.2]) box(c, g, 0.5, 0.06, 0.5, chrome, x, 2.56, -5.6);
    // the nook: the DJ booth on a velvet stage in the north west, the deck, the neon lip
    box(c, g, 4.6, 1.0, 3.0, vel, 3.2, 0.5, -4.7); box(c, g, 4.6, 0.06, 3.0, S(c, 'planks', 1, 0x2a2030), 3.2, 1.03, -4.7); c.wall(X(0.9), -3.2, X(5.5), -3.2); c.wall(X(5.5), -3.2, X(5.5), -6.2); neon(c, g, 0.9, 1.0, -3.2, 5.5, 1.0, -3.2, 0xff4fa3, 0.02);
    prop(c, r, g, X, 'nyb_disco_deck', 3.2, -5.0, { len: 1.6, y: 1.06, ry: 0 }); const dj = extra(c, g, 3.2, -5.8, { ry: 0, col: 0x1a1a2a, pool: 'night' }); dj.position.y = 1.06; c.tick((t) => { dj.userData.head.rotation.z = Math.sin(t * 4) * 0.12; });
    for (const dx of [-1.6, 1.6]) { prop(c, r, g, X, 'nyb_fame_speaker', 3.2 + dx, -4.0, { h: 0.8, y: 1.06 }); } box(c, g, 0.08, 3.0, 0.08, chrome, 1.0, 2.5, -6.0); box(c, g, 0.08, 3.0, 0.08, chrome, 5.4, 2.5, -6.0); hung(c, g, 'DJ · "THE COUNT"', 3.2, 3.6, -4.7, 0, 2.0, 0.3, '#0d0d0d', '#22d3ee');
    glow(c, g, 1.6, 2.2, -5.5, 'rgba(34,211,238,.35)', 2.0); glow(c, g, 4.8, 2.2, -5.5, 'rgba(255,79,163,.35)', 2.0);
    // the column screen and the VIP banquette behind it, where nobody you know is
    const colMat = S(c, 'marble', 1, 0x3a3040); for (const z of [-6.2, -4.0, -1.8]) pillar(c, r, g, X, 15.4, z, { h: H_IN, rad: 0.26, mat: colMat }); neon(c, g, 15.4, 4.4, -6.2, 15.4, 4.4, -1.8, 0x22d3ee, 0.02);
    prop(c, r, g, X, 'nyb_disco_sofa', 18.4, -5.4, { len: 2.2, ry: -PI / 2, r: 0.9 }); prop(c, r, g, X, 'nyb_disco_sofa', 18.4, -2.2, { len: 2.2, ry: -PI / 2, r: 0.9 }); prop(c, r, g, X, 'nyb_disco_table', 17.0, -3.8, { len: 1.0, r: 0.6 });
    for (const [x, z] of [[16.4, -5.4], [16.4, -2.2], [17.0, -6.6]]) prop(c, r, g, X, 'nyb_disco_stool', x, z, { h: 0.5, r: 0.25 }); for (const [x, z] of [[17.0, -1.2], [18.6, -7.0]]) prop(c, r, g, X, 'nyb_barstool_pink', x, z, { h: 0.75, r: 0.25 });
    extra(c, g, 18.4, -5.4, { seated: true, ry: -PI / 2, col: 0x5a1a4a }); extra(c, g, 18.4, -2.2, { seated: true, ry: -PI / 2, col: 0x1a3a5a }); extra(c, g, 16.4, -5.4, { seated: true, ry: PI / 2, col: 0x4a1a1a });
    notice(c, g, 'VIP · "NOT YOU"', 15.4, 2.6, -4.0, PI / 2, 1.2, 0.22, '#0d0d0d', '#22d3ee'); prop(c, r, g, X, 'nyb_disco_paint', 19.6, -0.4, { len: 1.0, y: 2.4, ry: -PI / 2 });
    // the street: the cab that has been waiting since eleven, the hydrant, the lamps, the trash, the smokers
    prop(c, r, g, X, 'h_taxi', 16.6, 6.4, { len: 4.4, ry: 0.1, r: 2.2, raw: true, egg: ['A cab', 'club_cab', 'The cab is waiting for someone who went in at eleven. It is 1977. The meter is at $4,120.'] });
    prop(c, r, g, X, 'nyb_hydrant_pink', 1.2, -1.0, { h: 0.8, r: 0.3 }); prop(c, r, g, X, 'nyb_trash_dsny', 18.6, 1.2, { h: 1.0, r: 0.4 }); prop(c, r, g, X, 'nyb_lamp_nazar', 0.8, -7.2, { h: 3.8, r: 0.3 }); prop(c, r, g, X, 'nyb_lamp_banner', 19.0, 6.6, { h: 3.8, r: 0.3 });
    [[13.8, 4.2, 0.6], [14.6, 5.0, -0.4], [5.6, 6.6, 2.4]].forEach(([x, z, ry], i) => extra(c, g, x, z, { ry, col: [0x3a1a3a, 0x1a1a3a, 0x3a2a1a][i], pool: 'night' }));
    const dust = []; for (let i = 0; i < 6; i++) dust.push(glow(c, g, 4 + Math.random() * 12, 0.4 + Math.random(), -5 + Math.random() * 3, 'rgba(255,120,200,.25)', 2.5)); c.tick((t) => dust.forEach((s, i) => { s.position.x += Math.sin(t * 0.3 + i) * 0.004; }));
    // the walls: velvet curtains on the flanks, the posters, the bulbs on the ceiling edge
    for (const x of [2.0, 18.0]) { const cur = decal(c, 3.6, 4.6, (q, w, h) => { q.fillStyle = '#4a0a18'; q.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { const gr = q.createLinearGradient(i * w / 24, 0, (i + 1) * w / 24, 0); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(0.5, 'rgba(255,120,150,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); q.fillStyle = gr; q.fillRect(i * w / 24, 0, w / 24, h); } q.fillStyle = '#d6a640'; q.fillRect(0, 0, w, h * 0.03); }, 384); cur.position.set(x, 2.4, -D / 2 + 0.14); g.add(cur); }
    poster(c, g, 0.3, 2.2, 7.0, PI / 2, 0.8, 1.1, deptPoster('THE ROPE', 'NOT ON THE LIST', '#ff4fa3')); poster(c, g, 19.6, 2.4, 2.8, -PI / 2, 0.8, 1.1, deptPoster('1977', 'DO NOT LOOK', '#22d3ee'));
    bulbs(c, g, 1, 19, 5.6, -7.4, 30, 0xff4fa3); bulbs(c, g, 1, 19, 5.6, 7.4, 30, 0x22d3ee); bulbs(c, g, 0.6, 0.6, 5.6, -6, 2, 0xf5c542);
    notice(c, g, 'DO NOT "LOOK" AT THE BOUNCER', 10, 0.06, 4.6, 0, 3.2, 0.3, '#0d0d0d', '#ff4fa3').rotation.x = -PI / 2;
    plaque(c, g, 7.4, 3.5, D / 2 - 0.13, PI, 'THE LIST IS NOT ON THE "LIST"', 'THE ROPE, 1977', 2.4);
  },

  // HOLD THE TICKET. The deli hands you a ticket; the man by the pickles takes it; the cashier charges fifty.
  deli(c, r, g, X) {
    const { THREE } = c; const DT = { have: false, lost: false, paid: 0, warned: false };
    const counterM = S(c, 'planks', 1.2, 0xb08a58), marble = S(c, 'marble', 1, 0xe8e0d0), steel = S(c, 'steel', 1, 0xc0c4c8), brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.3 });
    // the door man with the tickets, by the ticket post near the way in
    box(c, g, 0.08, 1.3, 0.08, brass, 6.4, 0.65, 2.0); box(c, g, 0.3, 0.26, 0.2, std(c, 0xc81e1e), 6.4, 1.35, 2.0); notice(c, g, 'TICKET · "HOLD IT"', 6.4, 1.6, 2.0, 0.3, 0.9, 0.16, '#f4ead2', '#c81e1e'); c.post(X(6.4), 2.0, 0.2);
    const door = cast(c, r, g, X, 'maitre', 7.0, 2.4, { h: 1.8, ry: 0.9, r: 0.4 }); c.clickable(door, () => { if (!DT.have) { DT.have = true; DT.lost = false; c.sound.ticket && c.sound.ticket(); c.say(door, 'Ticket. Hold it. Do not lose it. Fifty dollars if you lose it. Everybody loses it.', 3600, 2.1); if (!r.ticketOnce) { r.ticketOnce = true; c.egg('deli_held', 'A deli ticket. It is a receipt for the right to pay. Lose it and it costs fifty. Hold it like a passport.'); } } else c.say(door, 'You have one. Hold it.', 1600, 2.1); }, 'The ticket man');
    // the nook: the cutters' counter you walk along, three cutters behind it, the slicer, the trays, the steam
    box(c, g, 10, 1.1, 0.9, counterM, 10, 0.55, -4.6); box(c, g, 10.2, 0.06, 1.0, marble, 10, 1.13, -4.6); c.wall(X(5), -4.1, X(15), -4.1); pane(c, g, 10, 0.5, 10, 1.45, -4.6); for (const x of [5.2, 7.6, 10, 12.4, 14.8]) box(c, g, 0.04, 0.5, 0.06, brass, x, 1.45, -4.6);
    const checker = tile(c, '#f4f0e6', '#1a1a1a', 10); const fl = c.slab(10.4, 0.02, 2.6, checker, 10, 0.012, -2.9); g.add(fl);
    box(c, g, 10, 1.0, 0.6, steel, 10, 0.5, -6.6); box(c, g, 10, 1.2, 0.05, steel, 10, 1.9, -6.95); box(c, g, 0.7, 0.5, 0.5, steel, 7.2, 1.25, -6.6); box(c, g, 0.5, 0.5, 0.04, chrome(c), 7.2, 1.3, -6.3); box(c, g, 1.6, 0.3, 0.6, steel, 11.6, 1.15, -6.6); glow(c, g, 11.6, 1.5, -6.6, 'rgba(255,220,180,.4)', 1.4);
    for (const x of [5.8, 8.6, 12.8, 14.6]) box(c, g, 0.5, 0.03, 0.35, steel, x, 1.17, -4.6); for (const x of [6.4, 9.2, 13.4]) { g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), std(c, 0xf5c542)), x, 1.24, -4.5)); }
    prop(c, r, g, X, 'nyb_copa_pan', 9.6, -6.6, { len: 0.5, y: 1.0 }); prop(c, r, g, X, 'nyb_copa_pan', 13.8, -6.6, { len: 0.5, y: 1.0, ry: 0.5 }); prop(c, r, g, X, 'nyb_copa_gravy', 10.6, -6.6, { h: 0.25, y: 1.0 }); prop(c, r, g, X, 'nyb_heat_radio', 5.4, -6.6, { len: 0.4, y: 1.0, ry: 0.3 });
    const cutter = cast(c, r, g, X, 'butcher', 8, -5.4, { h: 1.82, ry: 0, line: () => DT.have ? 'Pastrami. On rye. Mustard. Say less. I take the ticket, I write on the ticket, you get the ticket back. Hold it.' : 'Ticket first. No ticket, no pastrami. No pastrami, no reason.', hint: 'The cutter', egg: 'deli_cutter' });
    extra(c, g, 11.2, -5.5, { ry: 0, col: 0xf0f0f0 }); extra(c, g, 13.6, -5.5, { ry: 0.2, col: 0xe8e8e8 });
    const rail = box(c, g, 10, 0.03, 0.03, steel, 10, 3.0, -5.6); for (let i = 0; i < 14; i++) salami(c, g, 5.4 + i * 0.7, 2.45 + (i % 3) * 0.08, -5.6 + (i % 2) * 0.15, 0.5 + (i % 4) * 0.08);
    const ps = c.sign('PASTRAMI', { w: 3.0, h: 0.6, bg: null, fg: '#ff7a1a', font: c.FONT, weight: 900, glow: 22, px: 160 }); ps.position.set(10, 3.5, -4.2); g.add(ps);
    for (const x of [6.5, 10, 13.5]) prop(c, r, g, X, 'hanging_industrial_lamp', x, -3.6, { h: 0.7, y: 3.4 });
    // the cashier at the end of the line, the register, the fifty dollar policy
    const cashier = cast(c, r, g, X, 'clerk', 16.8, -3.2, { h: 1.76, ry: -PI / 2, r: 0.4 }); box(c, g, 0.9, 1.1, 2.0, counterM, 17.8, 0.55, -3.2); box(c, g, 1.0, 0.06, 2.1, marble, 17.8, 1.13, -3.2); c.wall(X(17.3), -4.2, X(17.3), -2.2); prop(c, r, g, X, 'nyb_register_gold', 17.8, -3.2, { len: 0.6, y: 1.16, ry: -PI / 2 });
    c.clickable(cashier, () => { if (DT.have && !DT.lost) { DT.paid++; c.say(cashier, 'Twenty six fifty. The ticket says pastrami. Next.', 2600, 2.1); if (DT.paid === 1) c.egg('deli_paid', 'Paid with the ticket in hand. Twenty six fifty. Whole museum, the only room where a thing worked out.'); } else { c.say(cashier, 'No ticket? Fifty dollars. Policy. The policy is older than the pickles.', 3200, 2.1); c.sound.horn && c.sound.horn(); if (!r.fined) { r.fined = true; c.egg('deli_fifty', 'Fifty dollars. You lost the ticket. The man by the pickles has it. He has four hundred of them.'); } } }, 'The cashier');
    notice(c, g, 'LOST TICKET · "$50" · NO EXCEPTIONS · ONE EXCEPTION', 10, 2.6, -D / 2 + 0.3, 0, 4.4, 0.34, '#f4ead2', '#c81e1e');
    box(c, g, 0.3, 1.4, 1.6, S(c, 'planks', 1, 0x8a6a48), 19.4, 2.4, -5.8); for (const [z, m] of [[-6.3, 'nyb_feast_wine'], [-5.3, 'nyb_feast_wine']]) prop(c, r, g, X, m, 19.4, z, { h: 0.4, y: 3.12, ry: -PI / 2 }); products(c, g, 19.3, 19.5, [1.72, 2.42], -6.5, -5.1, 9, 44);
    // the man by the pickles, who takes tickets from anyone who walks past; the pickles are the hero of the room
    const pk = cast(c, r, g, X, 'sonny', 12.6, 2.4, { h: 1.8, ry: 0.4, r: 0.4, line: 'Pickles? Half sour. Full sour. Take one. Take two. I took your ticket. Look.', hint: 'The man by the pickles' });
    box(c, g, 2.2, 0.3, 1.6, marble, 14.4, 0.15, 2.6); c.post(X(14.4), 2.6, 1.3); prop(c, r, g, X, 'nyb_katz_pickles', 14.4, 2.6, { len: 1.5, y: 0.3, ry: 0.2 }); hung(c, g, 'PICKLES · HALF SOUR · "FULL SOUR"', 14.4, 3.3, 2.6, 0, 2.4, 0.3, '#1a5a2a', '#f4ead2');
    prop(c, r, g, X, 'wooden_barrels_01', 16.2, 1.2, { len: 1.1, r: 0.6 }); prop(c, r, g, X, 'wine_barrel_01', 13.2, 4.0, { h: 0.9, r: 0.5 }); glow(c, g, 14.4, 1.2, 2.6, 'rgba(120,255,120,.25)', 2.4);
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || !DT.have || DT.lost) return; const L = local(r, P); if (Math.hypot(L.x - 12.6, L.z - 2.4) < 1.4) { DT.lost = true; DT.have = false; c.say(pk, 'Got it.', 1400, 2.1); c.sound.tick && c.sound.tick(); setTimeout(() => c.toast('Your ticket is gone. The man by the pickles. Check your pockets. Do not check your pockets.', 3600), 1200); } });
    // the line along the counter, penned by a tape, and the seating: tables, chairs, regulars, Sally
    shuffle(c, g, (u) => [5 + u * 9.5, -2.6 + Math.sin(u * 12) * 0.25, -PI / 2], 11, { speed: 0.1 }); stanchions(c, g, X, [[4.6, -1.9], [15.4, -1.9]], { tape: true });
    for (const [x, z, m] of [[3.4, -1.4, 'nyb_katz_table'], [6.4, 0.6, 'nyb_katz_tableplain'], [16.6, 1.0, 'nyb_katz_table'], [4.2, 1.6, 'nyb_katz_tableplain'], [2.4, 0.4, 'nyb_katz_table'], [18.2, -0.8, 'nyb_katz_tableplain']]) { prop(c, r, g, X, m, x, z, { len: 1.0, r: 0.55 }); prop(c, r, g, X, 'nyb_katz_chair', x + 0.7, z, { h: 0.9, ry: -PI / 2, r: 0.25 }); prop(c, r, g, X, 'nyb_katz_chair', x - 0.7, z, { h: 0.9, ry: PI / 2, r: 0.25 }); }
    for (const [x, z, ry] of [[4.1, -1.4, -PI / 2], [15.9, 1.0, PI / 2], [3.5, 1.6, -PI / 2], [1.7, 0.4, PI / 2], [17.5, -0.8, PI / 2], [4.9, 1.6, PI / 2]]) extra(c, g, x, z, { seated: true, ry, col: [0x2a3a6a, 0x6a2a3a, 0x2a6a4a][Math.round(x) % 3] });
    cast(c, r, g, X, 'sally', 6.4 - 0.7, 0.6, { h: 1.72, ry: PI / 2, line: "I'll have what she's counting.", hint: 'A regular', egg: 'deli_counting' });
    prop(c, r, g, X, 'hamburger_buns', 6.4, 0.6, { len: 0.4, y: 0.74 }); prop(c, r, g, X, 'croissant', 16.6, 1.0, { len: 0.3, y: 0.74 }); for (const [x, z] of [[3.4, -1.4], [4.2, 1.6], [18.2, -0.8]]) { box(c, g, 0.3, 0.02, 0.2, steel, x, 0.75, z); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), std(c, 0xf5c542)), x + 0.2, 0.82, z + 0.1)); }
    // the walls: the frames, the clock, the fans, the neon, the posters, the camera
    prop(c, r, g, X, 'ceiling_fan', 10, 0, { len: 1.4, y: 5.6, spin: 2 }); prop(c, r, g, X, 'ceiling_fan', 4, 3.0, { len: 1.2, y: 5.6, spin: 1.6 }); prop(c, r, g, X, 'ceiling_fan', 16, 4.0, { len: 1.2, y: 5.6, spin: 2.4 });
    prop(c, r, g, X, 'nyb_katz_clock', 10, -D / 2 + 0.3, { len: 0.6, y: 5.3 }); prop(c, r, g, X, 'nyb_katz_frame_a', 2.0, -D / 2 + 0.3, { len: 1.0, y: 3.6 }); prop(c, r, g, X, 'nyb_katz_frame_b', 18.0, -D / 2 + 0.3, { len: 1.0, y: 3.6 });
    poster(c, g, 0.3, 2.2, 7.0, PI / 2, 0.8, 1.1, deptPoster('HOLD THE TICKET', 'FIFTY DOLLARS', '#c81e1e')); poster(c, g, 19.6, 2.2, 0.6, -PI / 2, 0.8, 1.1, deptPoster('PASTRAMI', 'SAY LESS', '#ff7a1a'));
    prop(c, r, g, X, 'nyb_aircon', 19.6, -6.8, { h: 0.5, y: 4.4, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_seccam_counted', 0.5, -7.4, { h: 0.3, y: 5.3, ry: -PI / 4 }); prop(c, r, g, X, 'nyb_extinguisher', 0.3, 6.6, { h: 0.6, y: 1.0, ry: PI / 2 });
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE DELI · HOLD THE TICKET');
    plaque(c, g, 15, 3.5, D / 2 - 0.13, PI, 'HOLD THE "TICKET"', 'THE DELI, SINCE 1888', 2.4);
  },

  // THE DROP. The line moves only while you stand still. The stock drops every ten seconds.
  drop(c, r, g, X) {
    const { THREE } = c; const DR = { stock: 40, still: 0, pos: 12, got: false, sold: false, lastX: 0, lastZ: 0 };
    const white = S(c, 'plaster', 1, 0xf4f4f4), conc = S(c, 'concrete', 1, 0xd0d0d0), steel = S(c, 'steel', 1, 0xc8c8cc), black = std(c, 0x111111, { roughness: 0.4 });
    const wallB = board(c, g, 4.0, 1.4, 384); wallB.m.position.set(10, 3.8, -5.9);
    const draw = () => { const { q, W: w2, H: h2 } = wallB; q.fillStyle = '#fff'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#c81e1e'; q.fillRect(0, 0, w2, h2 * 0.3); q.fillStyle = '#fff'; q.font = `900 ${h2 * 0.2}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('N3W YORKERS', w2 / 2, h2 * 0.22); q.fillStyle = '#111'; q.font = `800 ${h2 * 0.16}px ${c.MONO}`; q.fillText(DR.sold ? 'SOLD OUT' : `IN STOCK: ${DR.stock}`, w2 / 2, h2 * 0.56); q.font = `600 ${h2 * 0.12}px ${c.MONO}`; q.fillText(`YOUR PLACE IN LINE: ${DR.pos}`, w2 / 2, h2 * 0.8); wallB.up(); }; draw();
    // the counter, the rail of tees behind it with the one tee on it, the boxes stacked behind, the clerk
    box(c, g, 6, 1.0, 0.8, white, 10, 0.5, -4.6); box(c, g, 6.1, 0.05, 0.9, black, 10, 1.02, -4.6); c.wall(X(7), -4.1, X(13), -4.1);
    box(c, g, 5.0, 0.03, 0.03, steel, 10, 2.05, -5.0); for (const dx of [-2.5, 2.5]) box(c, g, 0.03, 2.05, 0.03, steel, 10 + dx, 1.02, -5.0);
    const teeTex = (col, logo) => (q, w, h) => { q.fillStyle = col; q.beginPath(); q.moveTo(w * 0.3, h * 0.05); q.lineTo(w * 0.7, h * 0.05); q.lineTo(w * 0.98, h * 0.25); q.lineTo(w * 0.82, h * 0.38); q.lineTo(w * 0.82, h * 0.98); q.lineTo(w * 0.18, h * 0.98); q.lineTo(w * 0.18, h * 0.38); q.lineTo(w * 0.02, h * 0.25); q.closePath(); q.fill(); q.fillStyle = logo; q.fillRect(w * 0.34, h * 0.5, w * 0.32, h * 0.12); q.fillStyle = col === '#111111' ? '#111' : '#fff'; q.font = `900 ${h * 0.085}px ${'"Space Grotesk", Arial, sans-serif'}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('N3W', w / 2, h * 0.56); };
    ['#ffffff', '#111111', '#c81e1e', '#ffffff', '#1d4ed8', '#ffffff'].forEach((col, i) => { const t = decal(c, 0.62, 0.78, teeTex(col, col === '#c81e1e' ? '#fff' : '#c81e1e')); t.position.set(7.9 + i * 0.84, 1.62, -4.95); g.add(t); box(c, g, 0.3, 0.02, 0.02, steel, 7.9 + i * 0.84, 2.0, -4.97); });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) prop(c, r, g, X, 'nyb_stairs_box', 7.6 + i * 1.3, -6.4 - (i % 2) * 0.3, { len: 0.55, y: j * 0.3, ry: (i * 0.4) % 1 });
    cast(c, r, g, X, 'tracksuit', 10, -5.4, { h: 1.78, ry: 0, line: () => DR.sold ? 'Sold out. Resale table is on the left. Ten X. It is the same shirt.' : 'Stand still. The line moves when you stand still. That is the whole technology.', hint: 'The clerk' });
    extra(c, g, 7.6, -3.6, { ry: 0.4, col: 0x111111, pool: ['tough', 'killer'] }); extra(c, g, 12.4, -3.6, { ry: -0.4, col: 0x111111, pool: ['tough', 'killer'] });
    const N = 14, Qs = []; for (let i = 0; i < N; i++) Qs.push({ o: extra(c, g, 10 + Math.sin(i * 2) * 0.4, -3.4 + i * 0.5, { col: [0x111111, 0xc81e1e, 0xf4f4f4, 0x111111][i % 4] }), z: -3.4 + i * 0.5 });
    let sc = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri) || DR.got) return; const L = local(r, P); const moved = Math.hypot(L.x - DR.lastX, L.z - DR.lastZ) > 0.02; DR.lastX = L.x; DR.lastZ = L.z;
      if (!moved) DR.still += dt; else DR.still = 0;
      if (DR.still > 1.5 && DR.pos > 0) { DR.pos -= dt * 0.6; for (const q of Qs) { q.z -= dt * 0.42; if (q.z < -3.8) q.z = 3.4; q.o.position.z = q.z; } }
      sc += dt; if (sc > 10) { sc = 0; if (!DR.sold) { DR.stock -= 4 + Math.floor(Math.random() * 6); if (DR.stock <= 0) { DR.stock = 0; DR.sold = true; c.sound.horn && c.sound.horn(); c.egg('drop_soldout', 'Sold out at 11:01. You were number twelve in a line that moved while you stood still. The resale table has one. Ten times.'); } } draw(); }
      if (DR.pos <= 0 && !DR.got) { DR.got = true; draw(); c.sound.ding(); c.flash(0.3); if (DR.sold) c.egg('drop_front', 'Front of the line. Sold out. The shirt you wanted is on the table to the left for ten times the price and it is the same shirt.'); else c.egg('drop_copped', 'Front of the line. One tee. Box logo. You stood still for it. Standing still is the skill.'); } });
    // the lane: tape to the edge of the door lane, barriers at the tail, the floor says stand still
    stanchions(c, g, X, [[8.4, -3.4], [8.4, 2.2]], { tape: true }); stanchions(c, g, X, [[11.6, -3.4], [11.6, 2.2]], { tape: true });
    prop(c, r, g, X, 'nyb_barrier', 7.0, 1.4, { len: 2.0, ry: 0, r: 0.8 }); prop(c, r, g, X, 'nyb_barrier', 13.0, 1.4, { len: 2.0, ry: 0, r: 0.8 });
    notice(c, g, 'STAND "STILL" · THE LINE MOVES WHEN YOU DO NOT', 10, 0.06, 4.8, 0, 3.6, 0.3, '#111', '#fff').rotation.x = -PI / 2;
    // the hero: a glass column with the one tee in it, turning, lit, on a white plinth
    const vit = new THREE.Group(); vit.position.set(15.6, 0, -1.8); g.add(vit); c.post(X(15.6), -1.8, 1.0);
    vit.add(c.slab(1.3, 0.6, 1.3, white, 0, 0.3, 0)); vit.add(c.slab(1.1, 0.06, 1.1, black, 0, 2.95, 0)); for (const [rx, rz, ry] of [[0, 0.55, 0], [0, -0.55, 0], [0.55, 0, PI / 2], [-0.55, 0, PI / 2]]) { const p = c.slab(1.1, 2.3, 0.03, glass(c, 0xe0f0ff, 0.18), rx, 1.75, rz); p.rotation.y = ry; vit.add(p); }
    const one = new THREE.Group(); one.position.y = 1.7; vit.add(one); const td = decal(c, 0.7, 0.9, teeTex('#ffffff', '#c81e1e')); td.material.side = THREE.DoubleSide; one.add(td); c.tick((t) => { one.rotation.y = t * 0.5; }); glow(c, vit, 0, 2.4, 0, 'rgba(255,255,255,.5)', 1.6);
    const oneS = c.sign('ONE · "THE ONE"', { w: 1.1, h: 0.2, bg: '#c81e1e', fg: '#fff', font: c.FONT, weight: 900, px: 96 }); oneS.position.set(0, 0.62, 0.66); vit.add(oneS);
    c.clickable(vit, () => { c.egg('drop_one', 'The one. The run was one. Everyone in line is here for it, and the table on the left already has it. Thursday is a feeling.'); c.sound.clink && c.sound.clink(); }, 'The one');
    // resale: the same shirt, a table, ten X
    box(c, g, 2.4, 0.9, 1.0, black, 3.6, 0.45, 0.8); c.wall(X(2.4), 0.3, X(4.8), 0.3); c.wall(X(2.4), 1.3, X(4.8), 1.3); box(c, g, 2.4, 0.02, 1.0, velvet(c, '#151515'), 3.6, 0.91, 0.8);
    const tee2 = decal(c, 0.7, 0.8, teeTex('#ffffff', '#c81e1e')); tee2.rotation.x = -0.9; tee2.position.set(3.6, 1.2, 0.6); g.add(tee2); notice(c, g, 'SAME SHIRT · "10X"', 3.6, 1.0, 1.32, 0, 1.2, 0.2, '#c81e1e', '#fff');
    cast(c, r, g, X, 'hustler', 3.6, -0.2, { h: 1.78, ry: 0, line: 'Same shirt. Ten X. Still cheaper than the line. The line is forty minutes of your life. I am four hundred dollars of it.', hint: 'The resale table', egg: 'drop_resale' });
    // the nook: the stock room behind a half door, shelves of boxes, staff only
    const st = alcove(c, r, g, X, { side: 'w', at: -3.6, w: 3.2, d: 1.8, h: 2.8, mat: conc, floorMat: conc, light: 0xffd0b0 });
    box(c, st, 3.0, 1.0, 0.06, white, 0, 0.5, 0.88); box(c, st, 3.0, 0.08, 0.06, black, 0, 1.02, 0.88); c.wall(X(1.95), -5.2, X(1.95), -2.0); notice(c, st, 'STAFF ONLY · "STAFF: NONE"', 0, 1.3, 0.9, 0, 1.6, 0.22, '#111', '#fff');
    for (const dx of [-0.9, 0.9]) { prop(c, r, g, X, 'steel_frame_shelves_03', 1.0, -3.6 + dx, { h: 2.4, ry: PI / 2 }); } for (let i = 0; i < 8; i++) prop(c, r, g, X, 'nyb_stairs_box', 0.8 + (i % 2) * 0.5, -4.5 + (i % 4) * 0.55, { len: 0.5, y: 0.7 + (i >> 2) * 0.75 }); for (let i = 0; i < 3; i++) prop(c, r, g, X, 'cardboard_box_01', 1.5, -4.7 + i * 0.9, { len: 0.6, y: 1.6 });
    // the lounge: where the people who were first wait for the people who were second
    prop(c, r, g, X, 'nyb_zoo_screen', 14.0, 0.6, { h: 1.9, ry: 0, r: 0.9 }); prop(c, r, g, X, 'nyb_prada_lounge', 17.4, 0.6, { len: 2.0, ry: -PI / 2, r: 0.8 }); prop(c, r, g, X, 'nyb_prada_chair', 15.6, -0.4, { h: 0.8, ry: PI / 2, r: 0.4 }); prop(c, r, g, X, 'nyb_prada_chair', 15.6, 1.6, { h: 0.8, ry: PI / 2, r: 0.4 });
    prop(c, r, g, X, 'nyb_prada_plant', 19.0, -1.2, { h: 1.5, r: 0.4 }); extra(c, g, 17.4, 0.6, { seated: true, ry: -PI / 2, col: 0x111111 }); extra(c, g, 15.6, -0.4, { seated: true, ry: PI / 2, col: 0xc81e1e }); prop(c, r, g, X, 'nyb_prada_cover', 19.6, 7.0, { len: 0.9, y: 2.2, ry: -PI / 2 });
    // the plinths of wrapped things, the tyre, the megaphone, the sign
    prop(c, r, g, X, 'ph_digital_wrist_watch', 16.8, -5.2, { len: 0.5, y: 0.95, hint: 'A watch', fn: (cc, m) => cc.say(m, 'Wrapped. Drops Thursday. Dropped Thursday. It is Thursday.', 2400, 0.7) }); plinth(c, g, X, 16.8, -5.2, 0.9, 0.9, 0.9, 0xf4f4f4);
    prop(c, r, g, X, 'ph_vintage_lighter', 4.0, -5.2, { h: 0.4, y: 0.95, hint: 'A lighter', fn: (cc, m) => cc.say(m, 'A wrapped lighter. Collab. Limited. It lights.', 2200, 0.6) }); plinth(c, g, X, 4.0, -5.2, 0.9, 0.9, 0.9, 0xf4f4f4);
    prop(c, r, g, X, 'ph_old_tyre', 6.2, 6.9, { len: 1.0, r: 0.6, hint: 'A tyre', fn: (cc, m) => cc.say(m, 'The tyre. Wrapped. Four hundred. Does not fit anything. That is the point.', 2400, 0.7) });
    prop(c, r, g, X, 'ph_Megaphone_01', 5.6, -3.0, { len: 0.7, y: 0.0, hint: 'The megaphone', fn: (cc, m) => cc.say(m, 'The line is closed. The line is also for sale.', 2200, 0.5) });
    prop(c, r, g, X, 'nyb_aframe_sign', 13.8, 2.6, { h: 1.0, ry: 0.4, r: 0.4 }); prop(c, r, g, X, 'nyb_seccam_counted', 19.4, -7.4, { h: 0.3, y: 5.3, ry: -PI * 0.75 }); prop(c, r, g, X, 'nyb_seccam_counted', 0.5, -7.4, { h: 0.3, y: 5.3, ry: -PI / 4 });
    // the walls: the frames on the flanks, the track lights overhead, the posters
    prop(c, r, g, X, 'nyb_prada_frame1', 2.0, -D / 2 + 0.3, { len: 1.2, y: 3.6 }); prop(c, r, g, X, 'nyb_prada_frame2', 18.0, -D / 2 + 0.3, { len: 1.2, y: 3.6 });
    for (const z of [-2, 3]) { box(c, g, 14, 0.04, 0.04, black, 10, 5.75, z); for (let i = 0; i < 5; i++) { const x = 4 + i * 3; g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 10), black), x, 5.6, z)); glow(c, g, x, 5.5, z, 'rgba(255,255,255,.35)', 0.8); } }
    poster(c, g, 0.3, 2.2, 7.0, PI / 2, 0.8, 1.1, deptPoster('THE DROP', 'SOLD OUT AT 11:01')); poster(c, g, 19.6, 2.2, -0.2, -PI / 2, 0.8, 1.1, deptPoster('STAND STILL', 'THE SKILL', '#111'));
    notice(c, g, 'ONE PER PERSON · "THE PERSON IS THE LINE"', 10, 5.2, -D / 2 + 0.3, 0, 4.0, 0.3, '#111', '#fff');
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE DROP · NOW SERVING THURSDAY');
    plaque(c, g, 15, 3.5, D / 2 - 0.13, PI, 'SOLD OUT AT "11:01"', 'THE DROP', 2.4);
  },

  // THE MAZE. Santaland. The exit door sends you back to the entrance twice; the third time it lets you through.
  santa(c, r, g, X) {
    const { THREE } = c; const SL = { loops: 0, cool: 0 };
    const green = S(c, 'grass', 0.6, 0x1e5a2a), red = velvet(c, '#a01c1c'), goldM = gold(c), ice = S(c, 'ashlar', 1, 0xc8d8e8), snow = std(c, 0xf4f6ff, { roughness: 1 });
    // the maze walls: hedges with a red velvet cap and lights along the top
    const hedge = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), m = c.slab(L, 1.4, 0.4, green, (x1 + x2) / 2, 0.7, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); g.add(m); c.wall(X(x1), z1, X(x2), z2); const cap = c.slab(L, 0.1, 0.5, red, (x1 + x2) / 2, 1.42, (z1 + z2) / 2); cap.rotation.y = m.rotation.y; g.add(cap); const n = Math.max(2, Math.round(L / 0.7)); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), basic(c, [0xff4040, 0x40ff60, 0xffe080, 0x4080ff][i % 4])); s.position.set(x1 + (x2 - x1) * u, 1.5, z1 + (z2 - z1) * u); g.add(s); } };
    hedge(3, 3, 3, -4); hedge(3, -4, 8, -4); hedge(8, -4, 8, -1); hedge(5.5, 3, 5.5, 0.5); hedge(5.5, 0.5, 11, 0.5); hedge(12, 3, 12, -2); hedge(12, -2, 17, -2); hedge(14.5, 3, 14.5, 1); hedge(17, 3, 17, -5); hedge(10, -2, 10, -6);
    // the entrance arch and the exit door that lies
    const arch = (x, z, text) => { for (const dx of [-1.2, 1.2]) { g.add(c.slab(0.3, 2.6, 0.3, red, x + dx, 1.3, z)); cane(c, g, x + dx * 1.25, z + 0.3, 2.2, dx < 0 ? 0 : PI); } g.add(c.slab(2.7, 0.3, 0.3, red, x, 2.6, z)); notice(c, g, text, x, 2.95, z, 0, 2.6, 0.3, '#f4ead2', '#a02020'); g.add(c.slab(2.7, 0.1, 0.4, goldM, x, 2.8, z)); };
    arch(4.2, 4.2, 'SANTALAND · "ENTER" · 45 MIN'); arch(13.4, -5.2, 'EXIT · "REALLY"');
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; SL.cool -= dt; const L = local(r, P); if (SL.cool <= 0 && Math.abs(L.x - 13.4) < 1.2 && L.z < -5.0 && L.z > -6.2) { SL.loops++; SL.cool = 3; if (SL.loops < 3) { c.flash(0.4); c.sound.whoosh && c.sound.whoosh(); c.P.x = r.x0 + 4.2; c.P.z = 5.2; c.P.yaw = 0; c.toast(['The exit was the entrance. Santaland is a loop. Try again.', 'The exit was the entrance again. The elf says the third time counts.'][SL.loops - 1], 3600); } else if (SL.loops === 3) { c.egg('santa_loop', 'Third time through the exit and it let you through. Santaland is a loop; the elves are paid by the loop. Happy holidays.'); c.sound.applause && c.sound.applause(); } } });
    // the grotto at the maze's heart: Santa's throne under an icy vault, snow drifts, the elf, the camera
    box(c, g, 4.2, 2.8, 0.4, ice, 14.6, 1.4, -4.9); box(c, g, 0.4, 2.8, 2.4, ice, 12.7, 1.4, -3.9); box(c, g, 0.4, 2.8, 2.4, ice, 16.5, 1.4, -3.9); box(c, g, 4.2, 0.4, 2.8, ice, 14.6, 3.0, -3.9); c.wall(X(12.5), -3.0, X(12.5), -4.9);
    for (const [x, z, s] of [[13.0, -4.4, 0.9], [16.2, -4.5, 0.8], [12.9, -2.9, 0.6], [16.4, -2.8, 0.7], [1.0, -7.2, 1.2], [19.0, 7.2, 1.0], [0.8, 7.2, 0.9], [19.2, -7.0, 0.8]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), snow); m.scale.y = 0.35; m.position.set(x, 0, z); g.add(m); }
    const chair = plinth(c, g, X, 14.6, -3.6, 1.6, 0.4, 1.4, 0xa02020); box(c, g, 1.2, 1.6, 0.2, red, 14.6, 1.2, -4.2); box(c, g, 1.3, 0.1, 0.3, goldM, 14.6, 2.05, -4.2); box(c, g, 1.7, 0.06, 1.5, goldM, 14.6, 0.43, -3.6);
    bulbs(c, g, 12.8, 16.4, 2.75, -2.55, 10, 0xffe080); glow(c, g, 14.6, 2.2, -3.6, 'rgba(255,220,160,.4)', 2.6); hung(c, g, 'SANTA · "BE SPECIFIC"', 14.6, 3.5, -2.4, 0, 2.2, 0.3, '#a02020', '#f4ead2');
    cast(c, r, g, X, 'elf', 16.0, -3.6, { h: 1.6, ry: -0.6, line: () => `Loop ${SL.loops} of 3. The third one is real. I have said that ${SL.loops * 400 + 12} times today.`, hint: 'The elf', egg: 'santa_elf' });
    cast(c, r, g, X, 'famer', 14.6, -3.6, { h: 1.9, ry: 0.3, y: 0.4, r: 0.5, line: 'Ho. What do you want. Be specific. The line is long and the wish list is a spreadsheet.', hint: 'Santa', egg: 'santa_claus' });
    shuffle(c, g, (u) => { const path = [[4.2, 3.5], [4.2, -3], [7, -3], [7, -0.5], [6, 1.5], [11, 1.5], [11, -1], [13, -1], [13, 2], [16, 2], [16, -1], [13.5, -3]]; const k = Math.min(path.length - 2, Math.floor(u * (path.length - 1))), f = u * (path.length - 1) - k; const a = path[k], b = path[k + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[0] - a[0], b[1] - a[1])]; }, 16, { speed: 0.16, col: (k) => [0xc81e1e, 0x1a5a2a, 0xf5c542, 0x2a3a6a][k % 4] });
    prop(c, r, g, X, 'Camera_01', 15.4, -5.6, { len: 0.5, y: 1.3 }); g.add(c.slab(0.06, 1.3, 0.06, std(c, 0x222), 15.4, 0.65, -5.6)); c.post(X(15.4), -5.6, 0.2); notice(c, g, 'PHOTO WITH SANTA · $45 · "THE LOOP IS FREE"', 16.6, 1.8, -5.9, 0.4, 1.8, 0.24, '#f4ead2', '#a02020');
    // the hero: Prometheus, gilded, on a gold plinth in the middle of the maze, taller than the hedges
    box(c, g, 1.4, 0.7, 1.4, goldM, 9.2, 0.35, -1.4); c.post(X(9.2), -1.4, 0.95); c.glb('nyb_rink_prometheus', { h: 2.6, x: 9.2, y: 0.7, z: -1.4, ry: 0.3, parent: g, onload: (gg) => recolor(gg, goldM) }); glow(c, g, 9.2, 2.2, -1.4, 'rgba(255,220,120,.4)', 3.0); notice(c, g, 'PROMETHEUS · "ALSO IN LINE"', 9.2, 0.5, -0.66, 0, 1.2, 0.18, '#111', '#f5c542');
    // the tree in the corner, the gifts under it, the sack, the crate, the wheel of loops
    prop(c, r, g, X, 'nyb_miracle_tree', 1.6, -5.8, { h: 3.8, r: 1.0, egg: ['The tree', 'santa_tree', 'The tree. Sixty feet in the photo, twelve in the room, four in your memory. The lights are counted. All of them.'] }); bulbs(c, g, 0.6, 2.6, 2.4, -5.0, 8, 0xffe080); bulbs(c, g, 0.8, 2.4, 1.5, -4.9, 6, 0xff4040);
    prop(c, r, g, X, 'nyb_rink_gift_a', 2.8, -6.4, { len: 0.8, r: 0.4 }); prop(c, r, g, X, 'nyb_rink_gift_b', 0.9, -4.6, { len: 0.6, r: 0.3 }); prop(c, r, g, X, 'nyb_rink_gift_b', 2.8, -6.4, { len: 0.5, y: 0.6 }); prop(c, r, g, X, 'nyb_miracle_sack', 2.6, -4.8, { h: 1.0, r: 0.5 }); prop(c, r, g, X, 'nyb_penguins_crate', 18.4, -0.6, { len: 0.9, r: 0.5 }); prop(c, r, g, X, 'nyb_rink_gift_a', 18.4, -0.6, { len: 0.6, y: 0.6 });
    prop(c, r, g, X, 'nyb_enchanted_wheel', 18.4, -5.6, { h: 1.8, ry: -PI / 2, r: 0.6, hint: 'The wheel of loops', fn: (cc, m) => cc.say(m, 'Spin it. It lands on three. It always lands on three.', 2400, 1.6) });
    prop(c, r, g, X, 'strawberry_chocolate_cake', 2.0, 1.0, { len: 0.5, y: 0.0, egg: ['A cake', 'santa_cake', 'Cookies for Santa. It is a cake. Santa has notes.'] }); prop(c, r, g, X, 'nyb_miracle_portrait', 18.0, -D / 2 + 0.3, { len: 1.1, y: 3.6 });
    for (const [x, z] of [[1.4, 2.4], [18.6, 1.6], [1.4, 6.4], [18.6, 6.4], [8.4, -6.6]]) prop(c, r, g, X, 'nyb_rink_planter', x, z, { h: 1.4, r: 0.45 }); prop(c, r, g, X, 'potted_plant_01', 10.8, -6.6, { h: 1.6, r: 0.4 });
    // candy canes at the corners and along the walls, the elves at the gate
    for (const [x, z, ry] of [[2.2, 4.4, 0], [6.2, 4.4, PI], [1.0, -2.4, 0.5], [19.0, 3.4, -0.5], [11.2, -6.6, 0], [18.4, -3.2, PI]]) cane(c, g, x, z, 1.8, ry);
    cast(c, r, g, X, 'elf', 2.2, 2.2, { h: 1.6, ry: 0.6, line: 'Candy cane? One per loop. You are on loop zero. Enjoy the hedge.', hint: 'An elf' });
    [[6.0, 5.0, -0.5], [7.0, 6.6, 0.3], [2.6, 5.8, 0.8]].forEach(([x, z, ry], i) => extra(c, g, x, z, { ry, col: [0xc81e1e, 0x1a5a2a, 0xf5c542][i] }));
    // overhead: garlands swagged along the walls, the chandelier, the string lights
    for (let i = 0; i < 4; i++) { garland(c, g, i * 5, 5.4, -7.6, (i + 1) * 5, 5.4, -7.6); garland(c, g, i * 5, 5.4, 7.6, (i + 1) * 5, 5.4, 7.6); } for (let i = 0; i < 3; i++) { garland(c, g, 0.4, 5.4, -7 + i * 5, 0.4, 5.4, -2 + i * 5); garland(c, g, 19.6, 5.4, -7 + i * 5, 19.6, 5.4, -2 + i * 5); }
    prop(c, r, g, X, 'nyb_enchanted_chandelier', 10, 2.5, { h: 1.3, y: 5.4 }); bulbs(c, g, 1, 19, 5.5, -6.4, 30, 0xff4040); bulbs(c, g, 1, 19, 5.5, 6.4, 30, 0x40ff60); bulbs(c, g, 3, 17, 4.4, 0, 20, 0xffe080); bulbs(c, g, 3, 17, 4.4, -3.5, 20, 0xffe080);
    poster(c, g, 0.3, 2.2, 0.4, PI / 2, 0.8, 1.1, deptPoster('SANTALAND', 'THE LINE IS THE ATTRACTION', '#1a5a2a')); poster(c, g, 19.6, 2.2, -4.2, -PI / 2, 0.8, 1.1, deptPoster('LOOP 3', 'THE THIRD ONE COUNTS', '#a02020'));
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'SANTALAND · NOW SERVING LOOP ' + 0);
    plaque(c, g, 10, 3.5, D / 2 - 0.13, PI, 'THE "LINE" IS THE ATTRACTION', 'SANTALAND, HERALD SQUARE', 2.4);
  },

  // THE BATHROOM LINE. The door is occupied while you look at it. Walk away and it opens.
  bathroom(c, r, g, X) {
    const { THREE } = c; const BR = { occ: true, opened: 0, inside: false };
    const barM = S(c, 'planks', 1, 0x3a2418), top = std(c, 0x1a1410, { roughness: 0.25, metalness: 0.2 }), brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.3 }), tl = tile(c, '#e8e4d8', '#2a2a2a', 10), brick = S(c, 'brick', 1.2, 0x5a3a30);
    // the nook: the bar along the south west, the back bar of shelves and bottles, the taps, the stools, the regulars
    box(c, g, 6.4, 1.1, 0.7, barM, 4.4, 0.55, 6.4); box(c, g, 6.6, 0.06, 0.8, top, 4.4, 1.13, 6.4); box(c, g, 6.4, 0.08, 0.08, brass, 4.4, 0.2, 6.0); c.wall(X(1.2), 6.0, X(7.6), 6.0); c.wall(X(7.6), 6.0, X(7.6), 8);
    box(c, g, 7.0, 0.06, 0.4, barM, 4.4, 1.3, 7.7); box(c, g, 7.0, 0.06, 0.4, barM, 4.4, 1.95, 7.7); box(c, g, 7.0, 0.06, 0.4, barM, 4.4, 2.6, 7.7); box(c, g, 7.0, 1.8, 0.04, std(c, 0x101010, { roughness: 0.1, metalness: 0.6 }), 4.4, 2.0, 7.86);
    for (const y of [1.33, 1.98, 2.63]) { const geo = new THREE.CylinderGeometry(0.035, 0.04, 0.3, 8), m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.85 }), 18), M = new THREE.Matrix4(), col = new THREE.Color(); for (let i = 0; i < 18; i++) { M.makeTranslation(1.2 + i * 0.37, y + 0.15, 7.7 + (i % 2) * 0.08); m.setMatrixAt(i, M); col.set([0x7a3a1a, 0x2a6a3a, 0xe0c060, 0x8a1a2a, 0x3a3a8a, 0xe8e8e8][(i + y * 3 | 0) % 6]); m.setColorAt(i, col); } g.add(m); }
    prop(c, r, g, X, 'nyb_cocktail_bottles', 2.4, 7.6, { len: 0.7, y: 2.66 }); prop(c, r, g, X, 'nyb_lostweekend_rye', 5.6, 6.4, { h: 0.3, y: 1.16 }); prop(c, r, g, X, 'nyb_bs_boombox', 7.0, 7.6, { len: 0.6, y: 1.36, ry: 0.3 });
    box(c, g, 0.7, 0.12, 0.16, brass, 3.4, 1.22, 6.3); for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 8), brass), 3.2 + i * 0.14, 1.4, 6.3)); for (const x of [2.0, 4.6, 6.4]) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.14, 10), glass(c, 0xffd080, 0.6)), x, 1.23, 6.2));
    const neonB = c.sign('COCKTAILS', { w: 2.6, h: 0.6, bg: null, fg: '#22d3ee', font: c.SERIF, weight: 900, glow: 22, px: 160 }); neonB.position.set(4.4, 3.4, 7.8); neonB.rotation.y = PI; g.add(neonB); neon(c, g, 1.2, 2.95, 7.7, 7.6, 2.95, 7.7, 0xff4fa3, 0.02);
    const bt = cast(c, r, g, X, 'bartender', 4.4, 7.1, { h: 1.8, ry: PI, line: 'One stall. Fourteen people. Saturday. The key is on the spoon. The spoon is with the guy. The guy is in the stall.', hint: 'The bartender', egg: 'bathroom_spoon' });
    [[1.8, 'nyb_cocktail_stool', 0.7], [3.0, 'nyb_mean_stool', 0.7], [4.2, 'nyb_barstool_pink', 0.75], [5.4, 'bar_chair_round_01', 1.0], [6.6, 'nyb_barstool_pink', 0.75]].forEach(([x, m, h], i) => { prop(c, r, g, X, m, x, 5.5, { h, r: 0.25 }); if (i !== 1 && i !== 3) extra(c, g, x, 5.5, { seated: true, ry: PI, col: [0x3a2a5a, 0x5a2a2a, 0x2a4a5a][i % 3] }); });
    prop(c, r, g, X, 'ph_ClassicConsole_01', 16.5, 7.3, { h: 1.3, ry: PI, r: 0.6, hint: 'The jukebox', fn: (cc, m) => { cc.say(m, 'Three plays for a dollar. The line has played the same song since one.', 2400, 1.4); cc.sound.note && cc.sound.note(); } }); glow(c, g, 16.5, 1.0, 7.0, 'rgba(255,120,200,.4)', 1.6);
    // the hallway to the stall: brick walls, a low tiled ceiling, a bulb that flickers, the dryer, the machine, the phone
    for (const x of [8.6, 11.4]) { box(c, g, 0.24, 3.2, 3.0, brick, x, 1.6, -4.1); c.wall(X(x), -5.6, X(x), -2.6); } box(c, g, 3.0, 0.14, 3.0, tl, 10, 3.2, -4.1); box(c, g, 3.0, 0.02, 3.0, tl, 10, 0.012, -4.1);
    const door = c.slab(1.0, 2.2, 0.1, std(c, 0x4a2a1a, { roughness: 0.6 }), 10, 1.1, -5.4); g.add(door); g.add(c.slab(1.4, 2.6, 0.3, std(c, 0x6a3a30), 10, 1.3, -5.7)); c.wall(X(9.3), -5.3, X(10.7), -5.3);
    const sgn = board(c, g, 0.6, 0.3, 128); sgn.m.position.set(10, 2.5, -5.3);
    const drawS = () => { const { q, W: w2, H: h2 } = sgn; q.fillStyle = BR.occ ? '#c81e1e' : '#1a8a3a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#fff'; q.font = `900 ${h2 * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(BR.occ ? 'OCCUPIED' : 'VACANT', w2 / 2, h2 * 0.68); sgn.up(); }; drawS();
    const fwd = new THREE.Vector3(); let far = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.getWorldDirection(fwd); const L = local(r, P); const dx = 10 - L.x, dz = -5.4 - L.z, d = Math.hypot(dx, dz), dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-6);
      const looking = dot > 0.6 && d < 14;
      if (looking && !BR.occ) { BR.occ = true; drawS(); door.rotation.y = 0; c.sound.thud && c.sound.thud(0.2); }
      if (!looking || d > 9) { far += dt; if (far > 2.5 && BR.occ) { BR.occ = false; BR.opened++; drawS(); door.rotation.y = 0.9; c.sound.click && c.sound.click(); if (BR.opened === 3 && !r.schro) { r.schro = true; c.egg('bathroom_schrodinger', "Vacant while you are not looking. Occupied the moment you are. A bathroom in two states at once. Schrodinger's stall, Avenue A."); } } } else far = 0;
      if (!BR.occ && d < 1.2 && !BR.inside) { BR.inside = true; c.flash(0.3); c.egg('bathroom_inside', 'You got in. You walked up backwards. The hand dryer says COUNTED. Everything in here says COUNTED.'); } });
    const dryer = box(c, g, 0.3, 0.26, 0.2, std(c, 0xd0d4d8, { metalness: 0.8, roughness: 0.3 }), 8.78, 1.3, -4.8); notice(c, g, 'HAND DRYER · "COUNTED"', 8.74, 1.62, -4.8, PI / 2, 0.8, 0.14, '#0d0d0d', '#f5c542'); c.clickable(dryer, () => { c.egg('bathroom_dryer', 'The hand dryer. Counted. It blows for eleven seconds, which is the exact length of the line moving one person.'); c.sound.whoosh && c.sound.whoosh(); }, 'The hand dryer');
    box(c, g, 0.3, 0.5, 0.22, std(c, 0x2a2a5a, { roughness: 0.4 }), 11.22, 1.4, -4.4); notice(c, g, 'NAZAR · "75c"', 11.1, 1.4, -4.4, -PI / 2, 0.24, 0.22, '#f5c542', '#111'); prop(c, r, g, X, 'nyb_payphone', 11.24, -3.1, { h: 0.7, y: 1.1, ry: -PI / 2 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), basic(c, 0xffd0a0)); bulb.position.set(10, 3.0, -4.1); g.add(bulb); const bg = glow(c, g, 10, 2.95, -4.1, 'rgba(255,200,140,.5)', 1.4); c.tick((t) => { const on = Math.sin(t * 9) + Math.sin(t * 2.3) > -0.9; bulb.visible = on; bg.visible = on; });
    for (const [x, z, ry, txt] of [[8.74, -3.4, PI / 2, 'THE COUNT WAS HERE'], [11.26, -5.0, -PI / 2, 'CALL 555 WAIT'], [8.74, -5.2, PI / 2, 'EYE CRUNCH 4 EVER']]) { const d = decal(c, 0.9, 0.3, (q, w, h) => { q.fillStyle = ['#ff4fa3', '#22d3ee', '#f5c542'][Math.round(z) % 3 < 0 ? 0 : Math.abs(Math.round(z)) % 3]; q.font = `900 ${h * 0.5}px "Space Grotesk", Arial, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(txt, w / 2, h / 2); }, 96); d.position.set(x, 2.2, z); d.rotation.y = ry; g.add(d); }
    // the line, which has given up in order, out of the hallway and into the room
    for (let i = 0; i < 9; i++) { const e = extra(c, g, 10 + Math.sin(i * 1.3) * 0.5, -4.6 + i * 0.68, { col: [0x3a2a5a, 0x5a2a2a, 0x2a4a5a][i % 3] }); c.tick((t) => { e.userData.body.rotation.z = Math.sin(t * 1.5 + i) * 0.04; e.userData.head.rotation.y = Math.sin(t * 0.5 + i * 2) * 0.6; }); }
    stanchions(c, g, X, [[9.0, -2.4], [9.0, 1.0]], { col: 0x222222, tape: true }); notice(c, g, 'ONE "STALL" · THE LINE STARTS AT THE BAR', 10, 0.06, 1.8, 0, 3.0, 0.28, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    // the room: tables, stools, candles, the regulars, the dancer, the writer, the dartboards, the second bar
    for (const [x, z, m] of [[14.6, 0.4, 'nyb_cocktail_table'], [3.2, -4.0, 'round_wooden_table_02'], [16.4, -4.6, 'nyb_cocktail_table'], [4.6, 0.2, 'nyb_cocktail_table']]) { prop(c, r, g, X, m, x, z, { len: 0.9, r: 0.5 }); prop(c, r, g, X, 'nyb_mean_stool', x + 0.7, z, { h: 0.7, r: 0.25 }); prop(c, r, g, X, 'nyb_cocktail_stool', x - 0.7, z, { h: 0.7, r: 0.25 }); prop(c, r, g, X, 'nyb_mean_candles', x, z, { h: 0.2, y: 0.76 }); glow(c, g, x, 0.9, z, 'rgba(255,170,90,.45)', 0.7); }
    for (const [x, z, ry] of [[15.3, 0.4, -PI / 2], [13.9, 0.4, PI / 2], [3.9, -4.0, -PI / 2], [17.1, -4.6, -PI / 2], [3.9, 0.2, -PI / 2]]) extra(c, g, x, z, { seated: true, ry, col: [0x3a2a5a, 0x5a2a2a, 0x2a4a5a][Math.abs(Math.round(x)) % 3] });
    cast(c, r, g, X, 'dancer', 5.4, -2.6, { h: 1.76, ry: 0.8, line: 'I have been in this line since the last song. The song was long. The line is longer. I am dancing in it.', hint: 'A dancer' });
    cast(c, r, g, X, 'writer', 15.0, -2.2, { h: 1.76, ry: -0.8, line: 'I am writing about the line. The line is the only story in this bar.', hint: 'A writer', egg: 'bathroom_writer' });
    [[7.0, -0.6, 0.4], [13.2, -2.8, -0.5], [12.6, 6.4, 2.6], [1.6, 2.0, 1.2]].forEach(([x, z, ry], i) => extra(c, g, x, z, { ry, col: [0x3a1a3a, 0x1a1a3a, 0x3a2a1a, 0x2a3a2a][i], pool: 'night' }));
    prop(c, r, g, X, 'nyb_devils_bar', 18.7, -1.0, { len: 2.6, ry: -PI / 2, r: 0.8 }); prop(c, r, g, X, 'nyb_cocktail_stool', 17.4, -1.6, { h: 0.7, r: 0.25 }); prop(c, r, g, X, 'nyb_cocktail_stool', 17.4, -0.4, { h: 0.7, r: 0.25 }); extra(c, g, 17.4, -0.4, { seated: true, ry: -PI / 2, col: 0x5a2a2a });
    prop(c, r, g, X, 'nyb_cocktail_dartboard', 19.6, 7.0, { len: 0.5, y: 1.7, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_mean_dartboard', 0.4, 7.0, { len: 0.5, y: 1.7, ry: PI / 2 }); lane(c, g, 18.6, 7.0, 16.6, 7.0, 0xf5c542, 0.5);
    prop(c, r, g, X, 'nyb_mean_tv', 18.6, -7.0, { len: 0.7, y: 3.0, ry: -PI * 0.75 }); box(c, g, 0.5, 0.05, 0.5, std(c, 0x222222), 18.6, 2.96, -7.0); prop(c, r, g, X, 'Television_01', 2.0, -7.3, { len: 0.7, y: 3.0, ry: 0.3 }); box(c, g, 0.5, 0.05, 0.5, std(c, 0x222222), 2.0, 2.96, -7.3);
    prop(c, r, g, X, 'nyb_trash_dsny', 1.4, -5.0, { h: 0.9, r: 0.4 }); prop(c, r, g, X, 'dustpan', 18.2, -5.4, { len: 0.4 }); prop(c, r, g, X, 'wooden_broom', 18.6, -4.6, { h: 1.3, ry: 0.3 }); prop(c, r, g, X, 'nyb_aircon', 19.6, -3.2, { h: 0.5, y: 4.4, ry: -PI / 2 }); prop(c, r, g, X, 'nyb_extinguisher', 0.3, -0.4, { h: 0.6, y: 1.0, ry: PI / 2 });
    poster(c, g, 0.3, 2.4, 7.0, PI / 2, 0.8, 1.1, deptPoster('ONE STALL', 'SATURDAY, 1 AM', '#ff4fa3')); poster(c, g, 19.6, 2.4, 2.9, -PI / 2, 0.8, 1.1, deptPoster('THE COUNT', 'A COCKTAIL', '#22d3ee'));
    const chalk = decal(c, 1.4, 1.0, (q, w, h) => { q.fillStyle = '#1a1a1a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#8a6a48'; q.lineWidth = 8; q.strokeRect(4, 4, w - 8, h - 8); q.fillStyle = '#f4ead2'; q.font = `700 ${h * 0.11}px monospace`; q.textAlign = 'center'; ['COCKTAILS', 'THE COUNT  $14', 'EYE OPENER  $12', 'NAZAR COLA  $4', 'THE LINE  FREE'].forEach((l, i) => q.fillText(l, w / 2, h * (0.2 + i * 0.17))); }); chalk.position.set(10.6, 2.4, 7.8); chalk.rotation.y = PI; g.add(chalk);
    // overhead: beams, the bulbs over the bar, the pendants from the table
    coffer(c, r, g, { nx: 4, nz: 3, y: 6, mat: S(c, 'planks', 1, 0x3a2418), bulb: 0xff8040 }); bulbs(c, g, 1.4, 7.4, 4.4, 7.4, 12, 0xff8040);
    ticketBoard(c, g, 0.16, 4.4, 1.2, PI / 2, 'THE STALL · NOW SERVING WHOEVER IS IN THERE');
    plaque(c, g, 13.0, 3.5, D / 2 - 0.13, PI, 'ONE "STALL"', 'A BAR ON AVENUE A', 2.0);
  },

  // THE FRONT OF THE LINE. Grand Central. The board lists every line; stand on the star and your number comes up.
  front(c, r, g, X) {
    const { THREE } = c, HT = r.tall || H_IN, marble = S(c, 'marble', 1.4, 0xe0d8c8), brassM = std(c, 0xb08a3a, { metalness: 0.9, roughness: 0.35 }), dark = std(c, 0x1a1410, { roughness: 0.4 });
    const BIG = board(c, g, 9, 3.2, 768); BIG.m.position.set(10, 4.4, -D / 2 + 0.3);
    const LINES = [['THE DMV', 'NOW SERVING 4'], ['THE MARKET', 'FORTY MINUTES'], ['THE ROPE', 'NOT ON THE LIST'], ['THE DELI', 'HOLD THE TICKET'], ['THE DROP', 'SOLD OUT'], ['SANTALAND', 'LOOP 3'], ['THE STALL', 'OCCUPIED'], ['THE FRONT', 'YOU']];
    let flipped = false; const draw = (up) => { const { q, W: w2, H: h2 } = BIG; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w2, h2); q.fillStyle = '#f5c542'; q.font = `800 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'left'; q.fillText('EVERY LINE IN THE CITY · DEPARTURES', 30, h2 * 0.1); q.font = `600 ${h2 * 0.07}px ${c.MONO}`; LINES.forEach(([a, b], i) => { const y = h2 * (0.22 + i * 0.095); q.fillStyle = '#f4ead2'; q.fillText(a, 30, y); q.fillStyle = i === 7 && up ? '#5aff8a' : '#ff8a4a'; q.textAlign = 'right'; q.fillText(i === 7 && up ? `NOW SERVING ${TICKET.n.toLocaleString('en-US')}` : b, w2 - 30, y); q.textAlign = 'left'; }); BIG.up(); }; draw(false);
    box(c, g, 9.3, 3.5, 0.12, brassM, 10, 4.4, -D / 2 + 0.22); for (const dx of [-4.2, 4.2]) box(c, g, 0.05, HT - 6.15, 0.05, dark, 10 + dx, 6.15 + (HT - 6.15) / 2, -D / 2 + 0.3);
    // the hero: the information booth, a brass octagon with the four faced clock on top, a clerk inside, the gold star under it
    const bx = 10, bz = 0.2, oct = (rt, rb, h, y, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 8), m); o.position.set(bx, y, bz); o.rotation.y = PI / 8; g.add(o); return o; };
    oct(1.3, 1.35, 0.2, 0.1, marble); oct(1.1, 1.12, 1.0, 0.7, brassM); const win = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 1.1, 8, 1, true), glass(c, 0xd8e8f0, 0.22)); win.material.side = THREE.DoubleSide; win.position.set(bx, 1.75, bz); win.rotation.y = PI / 8; g.add(win);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; box(c, g, 0.06, 1.1, 0.06, brassM, bx + Math.cos(a) * 1.08, 1.75, bz + Math.sin(a) * 1.08); } oct(1.3, 1.1, 0.3, 2.45, brassM); oct(0.5, 0.5, 0.3, 2.75, brassM); c.post(X(bx), bz, 1.5);
    const clk = new THREE.Group(); clk.position.set(bx, 3.3, bz); g.add(clk); clk.add(c.slab(0.62, 0.62, 0.62, brassM, 0, 0, 0)); const face = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.fill(); q.strokeStyle = '#111'; q.lineWidth = 6; q.stroke(); q.fillStyle = '#111'; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; q.beginPath(); q.arc(w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * w * 0.38, i % 3 ? 4 : 8, 0, 7); q.fill(); } q.lineWidth = 8; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + w * 0.22, h / 2 - w * 0.2); q.stroke(); q.lineWidth = 5; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 - w * 0.1, h / 2 + w * 0.32); q.stroke(); eyeFlower(q, w / 2, h * 0.3, w * 0.05); });
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.5, emissive: 0xffffff, emissiveMap: face, emissiveIntensity: 0.35 })); f.rotation.y = k * PI / 2; f.position.set(Math.sin(k * PI / 2) * 0.32, 0, Math.cos(k * PI / 2) * 0.32); clk.add(f); }
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), gold(c)); fin.position.y = 0.46; clk.add(fin); glow(c, g, bx, 3.3, bz, 'rgba(255,230,160,.35)', 1.6);
    c.clickable(clk, () => { c.egg('front_clock', 'The four faced clock. Four faces, four times, none of them yours. Meet me under it. Everyone says that. Nobody has ever found anyone.'); c.sound.bell && c.sound.bell(); }, 'The clock');
    extra(c, g, bx, bz, { seated: true, ry: 0, col: 0x2a2a3a }); notice(c, g, 'INFORMATION · "ASK"', bx, 2.3, bz + 1.12, 0, 1.4, 0.2, '#0d0d0d', '#f5c542');
    const star = decal(c, 1.0, 1.0, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2 - PI / 2, R = k % 2 ? w * 0.2 : w * 0.46; q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.closePath(); q.fill(); }); star.rotation.x = -PI / 2; star.position.set(10, 0.02, 2.4); g.add(star); glow(c, g, 10, 0.3, 2.4, 'rgba(255,220,120,.35)', 1.6);
    const paper = confetti(c, g, 600);
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || flipped) return; const L = local(r, P); if (Math.hypot(L.x - 10, L.z - 2.4) < 0.6) { if (!TICKET.taken) { if (!r.noTk) { r.noTk = true; c.toast('No ticket. The board cannot serve a number you never took. Room one has the machine.', 3600); } return; } flipped = true; let k = 0; const iv = setInterval(() => { k++; c.sound.tick && c.sound.tick(); if (k > 14) { clearInterval(iv); draw(true); c.sound.applause && c.sound.applause(); paper.burst(10, 5, 2.4, 8); c.egg('front_served', `Now serving ${TICKET.n.toLocaleString('en-US')}. Your number. It took ${LINES.length} lines and the whole museum. The window is open. The window is closed. Thank you for waiting.`); setTimeout(() => { window.__finale && window.__finale(); }, 4500); } else { const { q, W: w2, H: h2 } = BIG; q.fillStyle = '#0a0a0a'; q.fillRect(w2 * 0.5, h2 * (0.22 + 7 * 0.095) - h2 * 0.07, w2 * 0.5, h2 * 0.09); q.fillStyle = '#ff8a4a'; q.font = `600 ${h2 * 0.07}px ${c.MONO}`; q.textAlign = 'right'; q.fillText(String(Math.floor(Math.random() * 9999999)).padStart(7, '0'), w2 - 30, h2 * (0.22 + 7 * 0.095)); q.textAlign = 'left'; BIG.up(); } }, 120); } });
    // the concourse: the crowd crossing, the columns, the benches, the luggage, the shoe shine
    const Q = queue(c, g, (u) => [1 + u * 18, 2.4 + Math.sin(u * 7) * 1.2, PI / 2], 16, { col: (k) => [0x2a3a6a, 0x5a3a2a, 0x3a5a4a, 0x2a2a2a][k % 4] }); c.tick((t, dt) => { for (const q of Q) { q.u = (q.u + dt * 0.03 * (q.k % 2 ? 1 : -1) + 1) % 1; q.o.position.set(1 + q.u * 18, 0, 3.6 + Math.sin(q.u * 7) * 1.5); q.o.rotation.y = q.k % 2 ? PI / 2 : -PI / 2; } });
    for (const [x, z] of [[2.6, -3.2], [17.4, -3.2], [2.6, 0.6], [17.4, 0.6]]) pillar(c, r, g, X, x, z, { h: HT, rad: 0.42, mat: marble });
    for (const [x, z, ry] of [[6.0, -3.6, 0], [14.0, -3.6, 0]]) { prop(c, r, g, X, 'nyb_fisherking_bench', x, z, { len: 2.0, ry, r: 0.9 }); extra(c, g, x - 0.5, z, { seated: true, ry, col: 0x2a3a6a }); extra(c, g, x + 0.5, z, { seated: true, ry, col: 0x5a3a2a }); }
    prop(c, r, g, X, 'nyb_fisherking_suitcase', 5.2, -2.6, { len: 0.7, ry: 0.3 }); prop(c, r, g, X, 'nyb_serendipity_luggage', 14.9, -2.5, { len: 0.8, ry: -0.4 }); prop(c, r, g, X, 'nyb_dundee_luggage', 7.4, -0.8, { len: 0.8, ry: 0.6, r: 0.4 }); prop(c, r, g, X, 'nyb_ontown_crate1', 12.6, -0.6, { len: 0.8, r: 0.5 }); prop(c, r, g, X, 'vintage_suitcase', 12.6, -0.6, { len: 0.6, y: 0.5 });
    prop(c, r, g, X, 'nyb_fisherking_shine', 16.8, 6.8, { len: 1.4, ry: PI, r: 0.8, egg: ['The shoe shine', 'front_shine', 'The shine. Eight dollars. Your shoes have stood in eight lines. The man knows which ones by the scuff.'] }); extra(c, g, 16.8, 6.8, { seated: true, ry: PI, col: 0x3a2a1a });
    prop(c, r, g, X, 'mk_newsstand', 17.4, -6.0, { len: 2.2, ry: 0.5, r: 1.2 }); prop(c, r, g, X, 'nyb_naked_newsstand', 2.2, -6.0, { len: 2.0, ry: -0.4, r: 1.1 }); prop(c, r, g, X, 'nyb_fisherking_news', 4.6, -6.8, { len: 0.8, r: 0.4 });
    prop(c, r, g, X, 'nyb_lamp_banner', 6.4, 1.2, { h: 3.8, r: 0.3 }); prop(c, r, g, X, 'nyb_lamp_banner', 13.6, 1.2, { h: 3.8, r: 0.3 }); prop(c, r, g, X, 'nyb_bench_plaque', 10, 7.4, { len: 1.8, ry: PI, r: 0.5 }); extra(c, g, 10.4, 6.9, { seated: true, ry: PI, col: 0x2a2a3a });
    cast(c, r, g, X, 'anchor', 16.4, 1.0, { h: 1.8, ry: -0.9, line: 'This is the front. Of all of them. Stand on the star. The board does the rest, if you kept the ticket. Nobody keeps the ticket.', hint: 'The announcer', egg: 'front_anchor' });
    cast(c, r, g, X, 'susan', 3.6, 1.2, { h: 1.72, ry: 0.9, line: 'I was number nine million something. I am still number nine million something. Numbers do not expire. People do.', hint: 'A New Yorker' });
    // the nook: the balcony along the south wall, balustrade, people looking down; the whispering corner under it
    const deck = S(c, 'marble', 1.4, 0xd8d0c0); box(c, g, W, 0.2, 2.6, deck, W / 2, 3.7, 6.7); box(c, g, W, 0.6, 0.12, marble, W / 2, 3.45, 5.44);
    for (let k = 0; k <= 40; k++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8), marble), k * 0.5, 4.25, 5.5)); box(c, g, W, 0.08, 0.14, marble, W / 2, 4.74, 5.5);
    [2.5, 5.5, 9.0, 12.5, 15.5, 18.0].forEach((x, i) => { const e = extra(c, g, x, 6.6, { ry: 0, col: [0x2a3a6a, 0x5a3a2a, 0x3a5a4a, 0x2a2a2a][i % 4] }); e.position.y = 3.8; });
    notice(c, g, 'THE BALCONY · "LOOK DOWN" · THE LINE IS BELOW', 10, 3.45, 5.37, 0, 4.0, 0.3, '#0d0d0d', '#f5c542'); for (const x of [1.0, 19.0]) { box(c, g, 1.2, 2.4, 0.1, brassM, x, 5.0, 7.8); notice(c, g, 'TRACK "' + (x < 10 ? '1' : '2') + '"', x, 6.4, 7.72, PI, 1.0, 0.2, '#0d0d0d', '#f4ead2'); }
    const wg = pillar(c, r, g, X, 0.9, -7.1, { h: HT, rad: 0.3, mat: marble }); c.clickable(wg, () => { c.egg('front_whisper', 'The whispering corner. Say something to the wall and the man in the opposite corner hears your number. He has heard every number. He has never heard his own.'); c.sound.drone && c.sound.drone(); }, 'The whispering corner'); pillar(c, r, g, X, 19.1, -7.1, { h: HT, rad: 0.3, mat: marble });
    notice(c, g, 'TRACK "1" · ALL LINES', 2.0, 3.8, -D / 2 + 0.3, 0, 2.4, 0.3, '#0d0d0d', '#f5c542'); notice(c, g, 'TRACK "2" · NO LINES', 18.0, 3.8, -D / 2 + 0.3, 0, 2.4, 0.3, '#0d0d0d', '#f5c542'); prop(c, r, g, X, 'nyb_serendipity_clock', 2.0, -D / 2 + 0.3, { len: 0.6, y: 5.3 });
    // the vault: the sky painted on a tray above the well, gold stars, lines between them, chandeliers under it
    const sky = new THREE.MeshBasicMaterial({ map: c.canvasTex(1024, 1024, (q, w, h) => { q.fillStyle = '#2a5a7a'; q.fillRect(0, 0, w, h); let s = 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const P2 = []; for (let i = 0; i < 90; i++) P2.push([rnd() * w, rnd() * h, 2 + rnd() * 4]); q.strokeStyle = 'rgba(245,197,66,.35)'; q.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = P2[i], b = P2[(i * 7 + 3) % 90]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < w * 0.22) { q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke(); } } q.fillStyle = '#ffe8a0'; for (const [x, y, rr] of P2) { q.beginPath(); q.arc(x, y, rr, 0, 7); q.fill(); } for (let i = 0; i < 5; i++) eyeFlower(q, 120 + rnd() * (w - 240), 120 + rnd() * (h - 240), 36 + rnd() * 20); }), toneMapped: false, side: THREE.DoubleSide });
    sky.map.wrapS = sky.map.wrapT = THREE.RepeatWrapping; vault(c, g, 4, 16, -7, 5, HT, HT + 1.5, 2.6, sky); for (let i = 0; i < 24; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), basic(c, 0xffe8a0)); st.position.set(5 + Math.random() * 10, HT + 0.2 + Math.random() * 1.0, -6 + Math.random() * 10); g.add(st); }
    prop(c, r, g, X, 'nyb_lobby_chandelier', 10, 3.6, { h: 1.4, y: 5.4 });
    poster(c, g, 0.3, 2.4, 7.0, PI / 2, 0.8, 1.1, deptPoster('THE FRONT', 'THANK YOU FOR WAITING', '#f5c542')); poster(c, g, 19.6, 2.4, 7.0, -PI / 2, 0.8, 1.1, deptPoster('YOUR NUMBER', 'IS UP', '#1d4ed8'));
    notice(c, g, 'STAND ON THE "STAR" · UNDER THE CLOCK', 10, 0.06, 4.0, 0, 3.0, 0.3, '#0d0d0d', '#f5c542').rotation.x = -PI / 2;
    plaque(c, g, 15, 3.0, D / 2 - 0.13, PI, 'THANK YOU FOR "WAITING"', 'THE FRONT OF THE LINE', 2.4);
  },
};

const PROPS = {
  ticket: [['mounted_fluorescent_lights', 5, -2, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 15, -2, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 5, 3, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 15, 3, { len: 1.6, y: 5.85 }], ['fire_alarm', 0.4, 1.4, { h: 0.3, y: 1.8, ry: PI / 2 }]],
  market: [['mounted_fluorescent_lights', 10, -3.1, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 15, 3, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 5, -6.4, { len: 1.6, y: 5.85 }], ['cardboard_box_01', 18.2, 4.0, { len: 0.8, r: 0.5 }], ['plastic_crate_01', 1.6, 1.4, { len: 0.6, r: 0.4 }]],
  club: [],
  deli: [['WetFloorSign_01', 1.8, 1.4, { h: 0.9, ry: 0.4, r: 0.3 }]],
  drop: [['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }], ['Shelf_01', 18.6, -5.0, { h: 2.0, ry: -PI / 2, r: 0.6 }]],
  santa: [['Chandelier_01', 5, -5.4, { h: 1.2, y: 5.5 }], ['Chandelier_01', 15, 5.4, { h: 1.2, y: 5.5 }]],
  bathroom: [['hanging_industrial_lamp', 6, -2, { h: 0.8, y: 5.0 }], ['hanging_industrial_lamp', 14, -2, { h: 0.8, y: 5.0 }], ['hanging_industrial_lamp', 10, 5.0, { h: 0.8, y: 5.0 }]],
  front: [['Chandelier_03', 6, -1, { h: 1.3, y: 5.6 }], ['Chandelier_03', 14, -1, { h: 1.3, y: 5.6 }]],
};
const south = (xs) => xs.map((x) => ({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })), west = (zs) => zs.map((z) => ({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })), east = (zs) => zs.map((z) => ({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })), S7 = [2.2, 4.8, 7.4, 10, 12.6, 15.2, 17.8];
const SLOTS = {
  front: slotsSouthOnly,
  market: () => [...south(S7), ...west([-6.6, 0.6, 7.0]), ...east([-6.6, 0.6])],
  club: () => [...south([2.2, 4.8, 7.4, 10, 12.6]), ...west([-1.8, 0.6, 7.0]), ...east([-6.6, -4.2, -1.8, 0.6])],
  drop: () => [...south(S7), ...west([-6.6, 7.0]), ...east([-6.6, -4.2, -1.8])],
  bathroom: () => [...south([10, 12.6, 15.2, 17.8]), ...west([-6.6, -4.2, -1.8, 0.6]), ...east([-6.6, -4.2, -1.8, 0.6])],
};

let _ROOMS = null;
export function buildRoom(c, r) {
  if (!_ROOMS) _ROOMS = c.ROOMS;
  if (!c._leaveHook) { c._leaveHook = true; let last = -1; c.tick((t, dt, P, ri) => { if (ri !== last) { const prev = _ROOMS[last]; prev && prev.onLeave && prev.onLeave(); last = ri; } }); }
  const dressing = (c2, r2, g, X) => { const b = c2.sign(`LINE ${r2.lvl} · TAKE A NUMBER`, { w: 2.6, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c2.MONO, weight: 700 }); b.position.set(W / 2 + PORTAL.w / 2 + 1.2, 2.6, -D / 2 + 0.14); g.add(b); TICKET.redraw(); };
  shell(c, r, { SLOTS, PROPS, ROOM, dressing });
}
