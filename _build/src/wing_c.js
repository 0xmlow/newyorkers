// wing_c.js: three rooms of THE VEEFRIENDS WING of CLOUDS AND DIRT V2, built by room builder C (2026-10-22).
//   comics  THE SUNDAY COMICS   a newspaper printing hall whose press prints the visitor in halftone, page after page.
//   punks   THE PUNK VAULT      a dark gallery of code drawn pixel New Yorkers and three voxel giants, one of them watching.
//   cellar  THE CELLAR          Wine Library: seven thousand bottles, a mezzanine, four glasses and one sweaty sock.
// Nothing here is a real punk, a real drawing or a real face: every figure has an eye flower for a head.
// The nooks are bays built inside the room volume (see bay() below) because the room walls are solid slabs.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { punkCanvas, voxelPunk, halftoneMaterial, column, mezzanine, coffer, neon } from './fx.js';

const PI = Math.PI;
const PURPLE = 0x5a2fa0, GOLD = 0xf5c542;

// ---------- helpers copied from build.js (that file may not be imported from a wing) ----------
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
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
// the stick figure of the house: a body, two arms, an eye flower for a head
function figure(q, x, y, s, col, t, arms = 0) { q.fillStyle = col; q.fillRect(x - 8 * s, y - 26 * s, 16 * s, 40 * s); q.strokeStyle = col; q.lineWidth = 5 * s; q.beginPath(); q.moveTo(x - 7 * s, y - 22 * s); q.lineTo(x - 20 * s, y - 22 * s - arms * 18 * s + Math.sin(t * 6) * 4 * s); q.moveTo(x + 7 * s, y - 22 * s); q.lineTo(x + 20 * s, y - 22 * s - arms * 18 * s + Math.cos(t * 6) * 4 * s); q.stroke(); eyeFlower(q, x, y - 40 * s, 17 * s); }
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
// word wrap for the comic bubbles
function wrap(q, text, maxW) { const out = []; let line = ''; for (const wd of text.split(' ')) { const t = line ? line + ' ' + wd : wd; if (q.measureText(t).width > maxW && line) { out.push(line); line = wd; } else line = t; } if (line) out.push(line); return out; }
function rrect(q, x, y, w, h, r) { q.beginPath(); q.moveTo(x + r, y); q.lineTo(x + w - r, y); q.quadraticCurveTo(x + w, y, x + w, y + r); q.lineTo(x + w, y + h - r); q.quadraticCurveTo(x + w, y + h, x + w - r, y + h); q.lineTo(x + r, y + h); q.quadraticCurveTo(x, y + h, x, y + h - r); q.lineTo(x, y + r); q.quadraticCurveTo(x, y, x + r, y); q.closePath(); }

// a bay: a nook built into the room from the south wall, with its own floor, side walls, a dropped ceiling, a fascia over the
// mouth, a light and colliders on the sides. (fx.js alcove() builds its niche behind the wall slab, which buildRoom never
// cuts, so a niche there is sealed; a bay inside the room volume is what a visitor can actually walk into.)
function bay(c, r, g, X, { x, w = 3.2, d = 2.4, h = 3.2, mat, floorMat, light = 0xffd9a8 }) {
  const { THREE } = c, m = mat || c.surf('plaster', 2.4, 0x8a8070), fm = floorMat || m, z1 = D / 2, z0 = z1 - d, zc = z1 - d / 2;
  g.add(c.slab(w, 0.04, d, fm, x, 0.02, zc));
  g.add(c.slab(w + 0.4, 0.14, d, m, x, h + 0.07, zc));
  g.add(c.slab(w + 0.4, H_IN - h - 0.14, 0.16, m, x, h + 0.14 + (H_IN - h - 0.14) / 2, z0 + 0.08));
  for (const s of [-1, 1]) { const sx = x + s * (w / 2 + 0.08); g.add(c.slab(0.16, h + 0.14, d, m, sx, (h + 0.14) / 2, zc)); c.wall(X(sx), z0, X(sx), z1); }
  if (light) { const l = new THREE.PointLight(light, 6, 6, 1.5); l.position.set(x, h - 0.4, zc); g.add(l); }
  return { x, z0, z1, zc, w, d, h };
}

// ---------- the comic strips: three panels, flower headed figures, his lines verbatim in the last bubble ----------
const STRIPS = [
  { title: 'KINDNESS', panels: [{ who: 0, text: 'A guy cut the whole bodega line this morning.' }, { who: 1, text: 'And you said something?' }, { who: 2, text: 'Kindness is karma.', quote: true }] },
  { title: 'GRATITUDE', panels: [{ who: 0, text: 'Rent went up. Again.' }, { who: 1, text: 'So why are you smiling?' }, { who: 2, text: 'Gratitude is the cure.', quote: true }] },
  { title: 'PATIENCE', panels: [{ who: 1, text: 'Year three and still nobody knows your name.' }, { who: 0, text: 'Posted nine times today anyway.' }, { who: 2, text: 'Macro patience, micro speed.', quote: true }] },
  { title: 'DOCUMENT', panels: [{ who: 0, text: 'I need a script, a crew and a concept.' }, { who: 1, text: 'You have a phone and a Tuesday.' }, { who: 2, text: 'Document, don\'t create.', quote: true }] },
  { title: 'DREAMS', panels: [{ who: 0, text: 'My cousin says my dream is too small.' }, { who: 1, text: 'Is it his dream?' }, { who: 2, text: 'Your dreams don\'t have to be big, they have to be yours.', quote: true }] },
  { title: 'THE SUNDAY FUNNIES', src: 'LEE ENTERPRISES, 2025', fact: 'lee', panels: [{ who: 0, text: 'Seventy two newspapers.' }, { who: 1, text: 'Twenty five states.' }, { who: 2, text: 'Every Sunday since February 23, 2025.' }] },
  { title: 'THE CANON AGE', src: 'VEEFRIENDS COMIC BOOKS, 2025', fact: 'canon', panels: [{ who: 0, text: 'Issue one.' }, { who: 1, text: 'Issue nine.' }, { who: 2, text: 'Nine comic books in one year. They call 2025 the Canon Age.' }] },
];
function bubble(q, c, x, y, w, text, quote, tailX) {
  q.font = quote ? `900 24px ${c.SERIF}` : `700 20px ${c.FONT}`; const lines = wrap(q, text, w - 36), lh = quote ? 30 : 26, h = lines.length * lh + 24;
  q.fillStyle = '#ffffff'; q.strokeStyle = '#111'; q.lineWidth = quote ? 5 : 3; rrect(q, x, y, w, h, 16); q.fill(); q.stroke();
  q.beginPath(); q.moveTo(tailX - 14, y + h - 1); q.lineTo(tailX, y + h + 26); q.lineTo(tailX + 16, y + h - 1); q.closePath(); q.fill(); q.stroke();
  q.fillStyle = '#ffffff'; q.fillRect(tailX - 11, y + h - 4, 24, 6);
  q.fillStyle = '#111'; q.textAlign = 'left'; q.textBaseline = 'alphabetic'; lines.forEach((l, i) => q.fillText(l, x + 18, y + 12 + (i + 1) * lh - 6));
}
// draws one strip at its native 1152 by 420
function drawStrip(q, c, s) {
  q.fillStyle = '#f4ead2'; q.fillRect(0, 0, 1152, 420);
  q.fillStyle = '#111'; q.font = `900 26px ${c.SERIF}`; q.textAlign = 'left'; q.textBaseline = 'alphabetic'; q.fillText(s.title, 16, 34);
  q.fillStyle = '#5a2fa0'; q.font = `700 13px ${c.MONO}`; q.textAlign = 'right'; q.fillText(s.src || 'NEW YORKERS · THE SUNDAY COMICS', 1136, 32);
  s.panels.forEach((p, i) => {
    const x0 = 16 + i * 376, y0 = 48, pw = 364, ph = 356;
    q.fillStyle = ['#fff8e8', '#e6f2ff', '#ffeaf2'][i]; q.fillRect(x0, y0, pw, ph); q.lineWidth = 5; q.strokeStyle = '#111'; q.strokeRect(x0, y0, pw, ph);
    q.fillStyle = '#d9d0b6'; q.fillRect(x0 + 3, y0 + ph - 44, pw - 6, 41);
    const fy = y0 + ph - 46;
    if (p.who !== 1) figure(q, x0 + 100, fy - 14, 1.5, '#3a4a6a', i * 1.3, p.quote ? 1 : 0);
    if (p.who !== 0) figure(q, x0 + 270, fy - 14, 1.5, '#8a3a5a', i * 2.1 + 1, 0);
    bubble(q, c, x0 + 18, y0 + 16, pw - 36, p.text, !!p.quote, p.who === 1 ? x0 + 270 : x0 + 100);
  });
}
function stripTex(c, s) { return c.canvasTex(1152, 420, (q) => drawStrip(q, c, s)); }
// a whole Sunday page: masthead and three strips, for the pallets, the web and the idle pages
function pageTex(c) {
  return c.canvasTex(512, 720, (q, w) => {
    q.fillStyle = '#f1e8d0'; q.fillRect(0, 0, w, 720);
    q.fillStyle = '#111'; q.font = `900 44px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'alphabetic'; q.fillText('THE SUNDAY COMICS', w / 2, 52);
    q.font = `700 12px ${c.MONO}`; q.fillText('NEW YORKERS · SUNDAY EDITION · SEVENTY TWO PAPERS, TWENTY FIVE STATES', w / 2, 76); q.fillRect(24, 88, w - 48, 3);
    [0, 2, 4].forEach((k, i) => { q.save(); q.translate(20, 104 + i * 200); q.scale(472 / 1152, 180 / 420); drawStrip(q, c, STRIPS[k]); q.restore(); });
  });
}
// a wine label, cream with the house flower, never a real producer
function labelTex(c) { return c.canvasTex(64, 90, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.strokeStyle = '#5a2fa0'; q.lineWidth = 3; q.strokeRect(4, 4, w - 8, h - 8); eyeFlower(q, w / 2, 34, 16, '#fbe6f0', '#5a2fa0'); q.fillStyle = '#111'; q.font = `800 9px ${c.MONO}`; q.textAlign = 'center'; q.fillText('NEW YORKERS', w / 2, 64); q.fillText('2026', w / 2, 76); }); }

export const ROOMS_C = {
  // THE SUNDAY COMICS. A printing hall: four press units, nine rollers, a reel of newsprint, a web over the top, a chute to an
  // overhead rail that carries the pages north to a pallet. Stand on the mark and the press prints you in halftone.
  comics(c, r, g, X) {
    const { THREE } = c;
    const iron = c.surf('metal', 1.6, 0x4a4c50), dark = std(c, 0x16171b, { roughness: 0.45, metalness: 0.5 }), cream = std(c, 0xeee4cc, { roughness: 0.95 }), rollerM = std(c, 0x2a2c30, { roughness: 0.3, metalness: 0.8 });
    coffer(c, r, g, { nx: 4, nz: 3, y: H_IN, mat: c.surf('metal', 2, 0x3a3a3e), bulb: 0xfff0d0 });
    // the press line along the west side
    const PX = 3.6, rollers = [], rollG = new THREE.CylinderGeometry(0.22, 0.22, 2.0, 18);
    [-4.4, -1.6, 1.2, 4.0].forEach((z, k) => {
      g.add(c.slab(2.2, 2.0, 2.2, iron, PX, 1.0, z)); g.add(c.slab(2.3, 0.12, 2.3, dark, PX, 2.06, z)); g.add(c.slab(1.0, 0.5, 0.04, dark, PX + 1.12, 1.4, z));
      const pl = c.sign(`UNIT ${k + 1}`, { w: 0.8, h: 0.16, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800, px: 48 }); pl.position.set(PX + 1.13, 1.75, z); pl.rotation.y = PI / 2; g.add(pl);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), basic(c, k % 2 ? 0x7fff9a : 0xff3030)); lamp.position.set(PX + 1.15, 1.3, z - 0.3); g.add(lamp);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), basic(c, 0xf4ead2)); dial.position.set(PX + 1.15, 1.3, z + 0.3); dial.rotation.y = PI / 2; g.add(dial);
    });
    for (const z of [-3.0, -0.2, 2.6]) { for (const y of [0.6, 1.3, 1.92]) { const m = new THREE.Mesh(rollG, rollerM); m.position.set(PX, y, z); m.rotation.z = PI / 2; g.add(m); rollers.push({ m, s: y > 1 ? 2.2 : -2.2 }); } for (const s of [-1, 1]) g.add(c.slab(0.12, 2.1, 0.5, dark, PX + s * 1.05, 1.05, z)); }
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.7, 28), cream); reel.position.set(PX, 0.75, 5.9); reel.rotation.z = PI / 2; g.add(reel); rollers.push({ m: reel, s: 0.9 });
    for (const s of [-1, 1]) g.add(c.slab(0.14, 1.4, 0.3, dark, PX + s * 0.95, 0.7, 5.9));
    for (const y of [1.5, 2.0]) { const m = new THREE.Mesh(rollG, rollerM); m.position.set(PX, y, -5.6); m.rotation.z = PI / 2; g.add(m); rollers.push({ m, s: 2.6 }); }
    for (const s of [-1, 1]) g.add(c.slab(0.12, 2.1, 0.5, dark, PX + s * 1.05, 1.05, -5.6));
    g.add(c.slab(0.5, 0.5, 11.0, iron, PX, 5.3, 0.2));   // the extraction duct over the line
    c.wall(X(2.4), -5.9, X(4.8), -5.9); c.wall(X(2.4), 6.6, X(4.8), 6.6); c.wall(X(2.4), -5.9, X(2.4), 6.6); c.wall(X(4.8), -5.9, X(4.8), 6.6);
    // the web of newsprint over the top, printed with the Sunday page, running north while the press runs
    const ptex = pageTex(c); ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping; ptex.repeat.set(1, 9);
    const web = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 11.5), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.95, side: THREE.DoubleSide })); web.rotation.x = -PI / 2; web.position.set(PX, 2.15, 0.15); g.add(web);
    const web2 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), web.material); web2.position.set(PX, 1.35, 5.3); web2.rotation.x = -0.9; g.add(web2);   // the strand from the reel up to the top
    // the chute, the overhead rail and its hangers
    const chute = c.slab(1.95, 0.04, 0.7, dark, 5.35, 2.9, 4.4); chute.rotation.z = 0.82; g.add(chute);
    for (const s of [-1, 1]) { const lip = c.slab(1.95, 0.1, 0.03, dark, 5.35, 2.95, 4.4 + s * 0.36); lip.rotation.z = 0.82; g.add(lip); }
    g.add(c.slab(0.1, 0.1, 9.6, dark, 6.0, 4.3, -0.2)); for (const z of [4.2, 2.0, -0.2, -2.4, -4.6]) g.add(c.slab(0.04, 1.6, 0.04, dark, 6.0, 5.1, z));
    // the pallets of papers, and the output pallet where you land
    const page = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: ptex.clone(), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 })); m.material.map.repeat.set(1, 1); m.material.map.needsUpdate = true; return m; };
    const pallet = (x, z, ry, n) => { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); o.add(c.slab(1.2, 0.12, 1.0, c.surf('planks', 1, 0x9a7a50), 0, 0.06, 0)); for (const dx of [-0.5, 0, 0.5]) o.add(c.slab(0.1, 0.1, 1.0, c.surf('planks', 1, 0x7a5a38), dx, 0.05, 0));
      if (n) { o.add(c.slab(1.1, 0.1 * n, 0.85, cream, 0, 0.12 + 0.05 * n, 0)); const p = page(1.0, 0.75); p.rotation.x = -PI / 2; p.position.set(0, 0.125 + 0.1 * n, 0); o.add(p); for (const dx of [-0.3, 0.3]) o.add(c.slab(0.03, 0.1 * n + 0.02, 0.87, std(c, 0x111111), dx, 0.12 + 0.05 * n, 0)); }
      c.post(X(x), z, 0.75); return o; };
    pallet(16.6, -6.6, 0.2, 5); pallet(18.2, -4.6, -0.3, 3); pallet(1.2, -7.0, 0.1, 4); pallet(7.4, 7.0, 0.5, 2); pallet(6.0, -5.4, 0, 3);
    const out = c.sign('OUTPUT · TWELVE PAGES · THE NEWEST ON TOP', { w: 1.6, h: 0.16, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700, px: 48 }); out.position.set(6.0, 1.25, -4.78); g.add(out);
    // the ink drums on the east wall
    const INKS = [[0x22d3ee, 'CYAN'], [0xff4fa3, 'MAGENTA'], [0xf5c542, 'YELLOW'], [0x111111, 'BLACK'], [0x111111, 'BLACK'], [0x22d3ee, 'CYAN']];
    INKS.forEach(([col, nm], k) => { const x = k < 3 ? 18.9 : 18.1, z = -7.2 + (k % 3) * 0.8, dr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 20), std(c, 0x2a2c30, { metalness: 0.7, roughness: 0.4 })); dr.position.set(x, 0.45, z); g.add(dr);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.18, 20), std(c, col, { roughness: 0.5 })); band.position.set(x, 0.6, z); g.add(band);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 20), dark); lid.position.set(x, 0.92, z); g.add(lid);
      c.clickable(dr, () => { c.sound.thud(0.25); c.toast(`${nm}. Four inks and one deadline. Cyan, magenta, yellow, black. Sunday does not wait for anybody.`, 3000); }, `A drum of ${nm.toLowerCase()}`); });
    c.wall(X(17.6), -7.6, X(19.4), -7.6); c.wall(X(17.6), -7.6, X(17.6), -5.2); c.wall(X(17.6), -5.2, X(19.4), -5.2);
    // the strips on the south wall, high, over the New Yorkers
    const read = new Set();
    STRIPS.forEach((s, i) => {
      const x = 1.75 + i * 2.75, m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.91), new THREE.MeshStandardMaterial({ map: stripTex(c, s), roughness: 0.9 })); m.position.set(x, 4.5, D / 2 - 0.14); m.rotation.y = PI; g.add(m);
      g.add(c.slab(2.58, 0.99, 0.03, std(c, 0x111111), x, 4.5, D / 2 - 0.12));
      const last = s.panels[2].text;
      c.clickable(m, () => { c.sound.click(); read.add(i);
        if (s.fact === 'lee') c.egg('comics_lee', 'Seventy two newspapers in twenty five states, every Sunday from February 23, 2025. A marker drawing from a wine store, next to the crossword.');
        else if (s.fact === 'canon') c.egg('comics_canon', 'Nine comic books in 2025 and they call it the Canon Age. Every character already had a trait. Now they have a plot.');
        else c.toast(`"${last}" His line, verbatim. The set up is ours, the punchline is his.`, 3400); }, s.title);
    });
    const mast = c.sign('THE SUNDAY COMICS · 72 NEWSPAPERS · 25 STATES · EVERY SUNDAY', { w: 5.6, h: 0.34, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 12 }); mast.position.set(10, 5.3, -D / 2 + 0.14); g.add(mast);
    const east = c.sign('SINCE FEBRUARY 23, 2025', { w: 3.0, h: 0.3, bg: null, fg: '#f5c542', font: c.MONO, weight: 800, glow: 8 }); east.position.set(W - 0.4, 5.2, -3.0); east.rotation.y = -PI / 2; g.add(east);
    plaque(c, g, 10, 4.6, -D / 2 + 0.14, 0, 'Gratitude is the cure.', 'GARY VAYNERCHUK', 1.8);
    // the loading dock: a bay in the south wall with a roll up door, a hazard stripe and the hand truck (props)
    const dock = bay(c, r, g, X, { x: 14.4, w: 3.2, d: 2.4, h: 3.4, mat: c.surf('brick', 2, 0x6a5a50), floorMat: c.surf('concrete', 1.5, 0x6a6a66), light: 0xffd090 });
    const roll = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#5a5e62'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 24) { q.fillStyle = '#3e4246'; q.fillRect(0, y, w, 4); q.fillStyle = '#6a6e72'; q.fillRect(0, y + 4, w, 3); } });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.1), new THREE.MeshStandardMaterial({ map: roll, roughness: 0.6, metalness: 0.5 })); door.position.set(dock.x, 1.6, dock.z1 - 0.15); door.rotation.y = PI; g.add(door);
    const hz = decal(c, 3.2, 0.5, (q, w, h) => { for (let x = -h; x < w; x += h) { q.fillStyle = '#f5c542'; q.beginPath(); q.moveTo(x, 0); q.lineTo(x + h * 0.5, 0); q.lineTo(x + h, h); q.lineTo(x + h * 0.5, h); q.closePath(); q.fill(); } q.fillStyle = 'rgba(0,0,0,.0)'; }, 64); hz.rotation.x = -PI / 2; hz.position.set(dock.x, 0.045, dock.z0 + 0.3); g.add(hz);
    const dl = c.sign('DOCK 5 · BUNDLES OUT BEFORE THE SUN', { w: 2.4, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800 }); dl.position.set(dock.x, 3.0, dock.z0 - 0.02); dl.rotation.y = PI; g.add(dl);
    for (let k = 0; k < 3; k++) { const b = c.slab(0.5, 0.26, 0.38, cream, 12.95 + k * 0.02, 0.13 + k * 0.27, dock.zc + 0.6); b.rotation.y = k * 0.12; g.add(b); const st = c.slab(0.52, 0.03, 0.03, std(c, 0x111111), 12.95 + k * 0.02, 0.27 + k * 0.27, dock.zc + 0.6); g.add(st); }
    // the bench and two readers
    for (const [x, col] of [[16.5, 0x3a4a6a], [17.9, 0x8a3a5a]]) { extra(c, g, x, 1.0, { seated: true, col, ry: PI }); const p = page(0.42, 0.3); p.position.set(x, 1.08, 0.68); p.rotation.set(0.5, 0, 0); g.add(p); }
    // the paper boy's bundle
    g.add(c.slab(0.5, 0.3, 0.4, cream, 17.4, 0.15, 3.0)); g.add(c.slab(0.52, 0.03, 0.03, std(c, 0x111111), 17.4, 0.3, 3.0));
    // THE PRESS PRINTS YOU: a camera in the press, a proof screen, a mark on the floor, twelve pages, each with its own plate
    const MX = 7.6, MZ = 0.5;
    const mark = decal(c, 0.95, 0.95, (q, w, h) => { q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = '#f5c542'; q.textAlign = 'center'; q.font = `800 ${w * 0.11}px ${c.MONO}`; q.fillText('STAND HERE', w / 2, h / 2 - 8); q.font = `700 ${w * 0.07}px ${c.MONO}`; q.fillText('THE PRESS PRINTS YOU', w / 2, h / 2 + 22); });
    mark.rotation.x = -PI / 2; mark.position.set(MX, 0.02, MZ); g.add(mark);
    const ml = new THREE.PointLight(0xfff0d0, 5, 5, 1.5); ml.position.set(MX, 2.8, MZ); g.add(ml);
    const body = c.slab(0.26, 0.2, 0.2, dark, PX + 1.22, 1.45, MZ); g.add(body); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 14), std(c, 0x0a0a0c, { metalness: 0.8, roughness: 0.2 })); lens.position.set(PX + 1.4, 1.45, MZ); lens.rotation.z = PI / 2; g.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), basic(c, 0x330000)); tally.position.set(PX + 1.23, 1.58, MZ - 0.1); g.add(tally);
    const rtLive = new THREE.WebGLRenderTarget(256, 356, { depthBuffer: true }); rtLive.texture.colorSpace = THREE.SRGBColorSpace;
    const cam2 = new THREE.PerspectiveCamera(42, 256 / 356, 0.1, 20); cam2.position.set(PX + 1.3, 1.45, MZ); g.add(cam2); cam2.lookAt(X(MX), 1.1, MZ); cam2.layers.enable(1);
    const proof = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.84), halftoneMaterial(c, rtLive.texture)); proof.position.set(PX + 1.17, 2.95, MZ); proof.rotation.y = PI / 2; g.add(proof);
    g.add(c.slab(0.06, 0.92, 0.68, dark, PX + 1.13, 2.95, MZ));
    const pf = c.sign('PROOF', { w: 0.6, h: 0.12, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800, px: 40 }); pf.position.set(PX + 1.17, 3.46, MZ); pf.rotation.y = PI / 2; g.add(pf);
    const PGW = 0.56, PGH = 0.78, pgGeo = new THREE.PlaneGeometry(PGW, PGH), comicM = new THREE.MeshStandardMaterial({ map: pageTex(c), roughness: 0.9, side: THREE.DoubleSide });
    const pages = []; for (let i = 0; i < 12; i++) { const rt = new THREE.WebGLRenderTarget(192, 268, { depthBuffer: true }); rt.texture.colorSpace = THREE.SRGBColorSpace; const hm = halftoneMaterial(c, rt.texture); hm.side = THREE.DoubleSide; const m = new THREE.Mesh(pgGeo, comicM); m.visible = false; g.add(m); pages.push({ m, rt, hm, t: 0, state: 'free', yaw: (Math.random() - 0.5) * 0.3 }); }
    const riding = [], stack = [], STX = 6.0, STZ = -5.4, STY = 0.43;
    const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0)), qTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.82), qChute = new THREE.Quaternion().multiplyQuaternions(qTilt, qFlat), qVert = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, PI / 2, 0)), qTmp = new THREE.Quaternion();
    const relayout = () => stack.forEach((p, i) => { p.m.position.set(STX + Math.sin(i * 2.3) * 0.02, STY + i * 0.012, STZ + Math.cos(i * 1.7) * 0.02); p.m.rotation.set(-PI / 2, 0, p.yaw); });
    let printed = false, count = 0;
    const print = (you) => {
      let p = pages.find((q) => q.state === 'free'); if (!p && stack.length) { p = stack.shift(); relayout(); } if (!p) return;
      if (you) { proof.visible = false; p.m.visible = false; c.renderer.setRenderTarget(p.rt); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(null); proof.visible = true; }
      p.m.material = you ? p.hm : comicM; p.t = 0; p.state = 'ride'; p.m.visible = true; p.m.quaternion.copy(qChute); riding.push(p); c.sound.tick(); count++;
      if (you && !printed) { printed = true; c.flash(0.35); c.egg('comics_printed', 'The press printed you. Newspaper dots, Sunday edition, no byline. Seventy two papers would have run it.'); }
      else if (you) c.toast(`Page ${count}. You, in halftone, off the press.`, 1600);
    };
    let frame = 0, onMark = 0, lastPrint = -9;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { onMark = 0; return; }
      frame++;
      rollers.forEach((o) => { o.m.rotation.x += dt * o.s; }); ptex.offset.y -= dt * 0.06;
      const on = Math.hypot(P.x - X(MX), P.z - MZ) < 0.8; onMark = on ? onMark + dt : 0; tally.material.color.set(on ? 0xff2020 : 0x330000);
      if (frame % 2 === 0) { proof.visible = false; c.renderer.setRenderTarget(rtLive); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(null); proof.visible = true; }
      if (t - lastPrint > (on ? 1.6 : 3.4)) { lastPrint = t; print(on && onMark > 0.4); }
      for (let i = riding.length - 1; i >= 0; i--) {
        const p = riding[i], m = p.m; p.t += dt;
        if (p.t < 0.8) { const u = p.t / 0.8; m.position.set(4.7 + 1.3 * u, 2.3 + 1.25 * u, 4.4); m.quaternion.copy(qChute); }
        else if (p.t < 6.8) { const u = (p.t - 0.8) / 6; m.position.set(6.0, 3.4 + Math.sin(p.t * 3) * 0.015, 4.4 - 9.0 * u); m.quaternion.slerpQuaternions(qChute, qVert, Math.min(1, u * 8)); }
        else if (p.t < 7.6) { const u = (p.t - 6.8) / 0.8, e = u * u; m.position.set(STX, 3.4 - (3.4 - STY - stack.length * 0.012) * e, -4.6 - 0.8 * u); qTmp.setFromEuler(new THREE.Euler(-PI / 2, 0, p.yaw)); m.quaternion.slerpQuaternions(qVert, qTmp, u); }
        else { riding.splice(i, 1); p.state = 'stack'; stack.push(p); relayout(); c.sound.pop(); }
      }
    });
    // the people of the hall
    cast(c, r, g, X, 'editor', 7.2, -3.0, { h: 1.8, ry: 0.9, line: 'Seventy two papers, twenty five states, every Sunday. The press does not care who drew it. It cares that it is on time.', egg: 'comics_pressman', hint: 'The pressman' });
    cast(c, r, g, X, 'hustler', 17.0, 3.4, { h: 1.75, ry: -1.0, line: 'Sunday edition. The comics are the only page people still fight over at the counter.', hint: 'The paper boy' });
    extra(c, g, 1.2, -3.4, { col: 0x5a2fa0, ry: PI / 2 }); c.post(X(1.2), -3.4, 0.3);
  },

  // THE PUNK VAULT. Two walls of code drawn pixel New Yorkers, three voxel giants on plinths (one of them turns to watch you),
  // the vault with the floor safe and the facts, and a floor price mountain you can climb.
  punks(c, r, g, X) {
    const { THREE } = c, conc = c.surf('concrete', 2, 0x2a2a34), steel = std(c, 0x1a1a22, { metalness: 0.8, roughness: 0.35 });
    const V = new THREE.Vector3(), M = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), S0 = new THREE.Vector3(0, 0, 0), col = new THREE.Color();
    // the walls of pixels: sixty seeds, ten by six on each side, every tile a New Yorker with a flower for a head
    const ACC = ['a cap', 'shades', 'a cigarette', 'a gold earring', 'a mohawk', 'a purple headband'];
    const seeds = []; for (let i = 0; i < 60; i++) seeds.push(101 + i * 7);
    const texes = seeds.map((s) => punkCanvas(c, s)), tileG = new THREE.PlaneGeometry(0.5, 0.5), seen = new Set(); let tenDone = false;
    const tile = (k, x, y, z, ry) => { const s = seeds[k], m = new THREE.Mesh(tileG, new THREE.MeshBasicMaterial({ map: texes[k], toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
      c.clickable(m, () => { seen.add(s); c.sound.click(); c.toast(`New Yorker No. ${s}, with ${ACC[(s * 13) % 6]}. Twenty four by twenty four, drawn by code. Not a punk. A New Yorker.`, 3200); if (seen.size >= 10 && !tenDone) { tenDone = true; c.egg('punks_ten', 'Ten New Yorkers off the wall. Twenty four by twenty four, drawn by code, no two the same, not a single real punk among them.'); } }, `New Yorker No. ${s}`); return m; };
    for (let j = 0; j < 10; j++) for (let i = 0; i < 6; i++) { const k = j * 6 + i, z = -7.0 + j * 0.62, y = 0.9 + i * 0.62; tile(k, 0.2, y, z, PI / 2); tile(59 - k, W - 0.46, y, z, -PI / 2); }
    g.add(c.slab(0.06, 4.2, 6.6, std(c, 0x08080c), 0.15, 2.45, -4.21)); g.add(c.slab(0.06, 4.2, 6.6, std(c, 0x08080c), W - 0.41, 2.45, -4.21));
    neon(c, g, 0.3, 4.65, -7.3, 0.3, 4.65, -1.0, 0x6a8cff); neon(c, g, W - 0.55, 4.65, -7.3, W - 0.55, 4.65, -1.0, 0xff6ad5);
    const wl = c.sign('SIXTY NEW YORKERS · 24 BY 24 · CLICK ONE', { w: 2.6, h: 0.2, bg: '#0d0d0d', fg: '#6a8cff', font: c.MONO, weight: 800 }); wl.position.set(0.2, 0.5, -4.2); wl.rotation.y = PI / 2; g.add(wl);
    const el = c.sign('THE OTHER SIXTY · SAME SIXTY, OTHER WAY ROUND', { w: 2.6, h: 0.2, bg: '#0d0d0d', fg: '#ff6ad5', font: c.MONO, weight: 800 }); el.position.set(W - 0.46, 0.5, -4.2); el.rotation.y = -PI / 2; g.add(el);
    // two columns framing the far end
    column(c, r, g, X, 6.6, -2.4, { h: H_IN, rad: 0.3, mat: conc }); column(c, r, g, X, 13.4, -2.4, { h: H_IN, rad: 0.3, mat: conc });
    // the three giants: plinths, cubes that fly in when you come near, and the one that turns to watch you
    const BGS = ['#638596', '#8e6fb6', '#95554f', '#5c9c7b', '#b5a26b', '#4f6d9c'], SZ = 0.12, GZ = -5.2, theOne = Math.floor(Math.random() * 3), giants = [];
    [[3.6, 211], [10.0, 227], [16.4, 243]].forEach(([x, seed], k) => {
      const grp = new THREE.Group(); grp.position.set(x, 0.5, GZ); g.add(grp);
      g.add(c.slab(1.6, 0.5, 1.2, c.surf('marble2', 1, 0x3a3a46), x, 0.25, GZ)); c.post(X(x), GZ, 1.55);
      const tag = c.sign(`No. ${seed}`, { w: 0.8, h: 0.16, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800, px: 48 }); tag.position.set(x, 0.3, GZ + 0.61); g.add(tag);
      const mesh = voxelPunk(c, seed, SZ); mesh.frustumCulled = false; grp.add(mesh);
      const bg = BGS[seed % 6], br = parseInt(bg.slice(1, 3), 16), bgg = parseInt(bg.slice(3, 5), 16), bb = parseInt(bg.slice(5, 7), 16);
      const cells = mesh.userData.cells, px = mesh.userData.px, N = cells.length, from = new Float32Array(N * 3), to = new Float32Array(N * 3), solid = new Uint8Array(N);
      cells.forEach(([cx, cy, rr, gg, b2], i) => { solid[i] = (rr === br && gg === bgg && b2 === bb) ? 0 : 1; to[i * 3] = (cx - px / 2 + 0.5) * SZ; to[i * 3 + 1] = (px - cy - 0.5) * SZ; to[i * 3 + 2] = 0; from[i * 3] = (Math.random() - 0.5) * 9; from[i * 3 + 1] = Math.random() * 6 - 0.5; from[i * 3 + 2] = (Math.random() - 0.5) * 8 + 3; });
      for (let i = 0; i < N; i++) { M.compose(V.set(0, 0, 0), Q0, S0); mesh.setMatrixAt(i, M); } mesh.instanceMatrix.needsUpdate = true;
      giants.push({ grp, mesh, from, to, solid, N, u: -1, yaw: 0, k, x });
      c.clickable(mesh, () => { if (k === theOne) { c.sound.boom(0.4); c.flash(0.3); c.egg('punks_theone', 'That one. It has been turning to watch you since you walked in. The other two never moved, which is also a kind of strategy.'); }
        else { c.sound.thud(0.3); c.say(grp, ['Not me. I have not moved since June 2017.', 'Wrong giant. I do not even blink. Try the one that is looking at you.'][k % 2], 3200, 3.1); } }, `New Yorker No. ${seed}, the giant`);
    });
    const gl = c.sign('FIND THE ONE · ONE OF THE THREE IS WATCHING YOU · CLICK IT', { w: 4.6, h: 0.28, bg: null, fg: '#ff6ad5', font: c.MONO, weight: 800, glow: 10 }); gl.position.set(10, 4.9, -D / 2 + 0.14); g.add(gl);
    const nl = c.sign('THE PUNK VAULT · TEN THOUSAND · 24 BY 24 · JUNE 2017', { w: 5.6, h: 0.34, bg: null, fg: '#6a8cff', font: c.SERIF, weight: 900, glow: 10 }); nl.position.set(10, 5.4, -D / 2 + 0.14); g.add(nl);
    // the vault: a bay in the south wall, a floor safe, three plaques of the facts
    const vb = bay(c, r, g, X, { x: 14.4, w: 3.2, d: 2.4, h: 3.0, mat: conc, floorMat: c.surf('marble2', 1, 0x1a1a24), light: 0x8090ff });
    const vs = c.sign('THE VAULT', { w: 1.6, h: 0.36, bg: null, fg: '#6a8cff', font: c.SERIF, weight: 900, glow: 16 }); vs.position.set(vb.x, 3.45, vb.z0 - 0.02); vs.rotation.y = PI; g.add(vs);
    const safe = new THREE.Group(); safe.position.set(vb.x, 0, vb.zc + 0.55); g.add(safe);
    // a hollow box, so the thing inside shows through the open door
    safe.add(c.slab(0.9, 0.9, 0.06, steel, 0, 0.45, 0.37)); for (const s of [-1, 1]) safe.add(c.slab(0.06, 0.9, 0.8, steel, s * 0.42, 0.45, 0)); safe.add(c.slab(0.9, 0.06, 0.8, steel, 0, 0.03, 0)); safe.add(c.slab(0.9, 0.06, 0.8, steel, 0, 0.87, 0));
    safe.add(c.slab(1.0, 0.06, 0.9, std(c, 0x2a2a34, { metalness: 0.6 }), 0, 0.93, 0));
    const hinge = new THREE.Group(); hinge.position.set(-0.45, 0.45, -0.4); hinge.rotation.y = -0.8; safe.add(hinge);
    hinge.add(c.slab(0.86, 0.86, 0.06, steel, 0.43, 0, 0)); const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 20), std(c, 0xd0d0d8, { metalness: 1, roughness: 0.25 })); dial.position.set(0.52, 0.06, -0.045); dial.rotation.x = PI / 2; hinge.add(dial);
    const five = c.sign('5', { w: 0.1, h: 0.1, bg: null, fg: '#111', font: c.SERIF, weight: 900, px: 40 }); five.position.set(0.52, 0.06, -0.065); five.rotation.y = PI; hinge.add(five);
    hinge.add(c.slab(0.16, 0.03, 0.03, std(c, 0xd0d0d8, { metalness: 1, roughness: 0.25 }), 0.68, -0.12, -0.05));
    const inside = new THREE.Mesh(tileG, new THREE.MeshBasicMaterial({ map: punkCanvas(c, 5), toneMapped: false })); inside.position.set(0, 0.5, -0.2); inside.rotation.y = PI; inside.scale.setScalar(0.8); safe.add(inside);
    const sl = new THREE.PointLight(GOLD, 3, 2.5, 1.5); sl.position.set(0, 0.6, -0.1); safe.add(sl);
    c.wall(X(vb.x - 0.5), vb.zc + 0.1, X(vb.x + 0.5), vb.zc + 0.1);
    c.clickable(safe, () => { c.sound.crack(); c.egg('punks_safe', 'The floor safe. Dozens of punks in it, he says, bought in 2021, his favourite collectible. The dial has one number on it and it is five.'); }, 'The floor safe');
    plaque(c, g, vb.x, 2.2, vb.z1 - 0.1, PI, 'CryptoPunks: launched June 2017.\nTen thousand of them, twenty four by twenty four pixels each.', 'THE FACTS', 2.4);
    plaque(c, g, vb.x - vb.w / 2 + 0.09, 1.9, vb.zc - 0.2, PI / 2, 'In 2021 he bought CryptoPunks and has called them\nhis favourite collectible. Dozens of them.\nThe exact number is his business.', 'THE VAULT', 2.0);
    plaque(c, g, vb.x + vb.w / 2 - 0.09, 1.9, vb.zc - 0.2, -PI / 2, 'October 2021: five of his original VeeFriends drawings\nsold at Christie\'s for about 1.2 million dollars.', 'THE VAULT', 2.0);
    // the floor price mountain in the south west: a stepped pyramid of cubes you can climb
    const MX = 3.2, MZ = 6.2, cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), std(c, 0xffffff, { roughness: 0.55 }), 120); let n = 0;
    for (let k = 0; k < 4; k++) { const side = 8 - 2 * k; for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) { V.set(MX + (i - (side - 1) / 2) * 0.4, 0.2 + k * 0.4, MZ + (j - (side - 1) / 2) * 0.4); M.compose(V, Q0, S1); cubes.setMatrixAt(n, M); cubes.setColorAt(n, col.setHex([0x5a2fa0, 0x3a1f70, 0x6a8cff, 0x2a2a40][(i + j + k) % 4])); n++; } }
    cubes.instanceMatrix.needsUpdate = true; g.add(cubes);
    r.ground = (x, z) => { const d = Math.max(Math.abs(x - MX), Math.abs(z - MZ)); return d < 0.4 ? 1.6 : d < 0.8 ? 1.2 : d < 1.2 ? 0.8 : d < 1.6 ? 0.4 : 0; };
    const fl = c.sign('FLOOR', { w: 1.0, h: 0.34, bg: '#f5c542', fg: '#111', font: c.SERIF, weight: 900 }); fl.position.set(MX, 0.95, MZ - 1.21); fl.rotation.y = PI; g.add(fl);
    g.add(c.slab(0.03, 0.9, 0.03, steel, MX + 0.32, 2.05, MZ + 0.32)); const pen = c.sign('FLOOR', { w: 0.36, h: 0.14, bg: '#ff6ad5', fg: '#111', font: c.MONO, weight: 900, px: 40 }); pen.position.set(MX + 0.52, 2.4, MZ + 0.32); g.add(pen);
    c.clickable(cubes, () => c.toast('The floor. It moves every day and everybody has an opinion about why. Climb it.', 2600), 'The floor price');
    // the people
    cast(c, r, g, X, 'tough', 11.6, 7.0, { h: 1.85, ry: -0.9, line: 'Dozens, he says. Not one of them is on this wall. Everybody on this wall got counted first.', egg: 'punks_guard', hint: 'The vault guard' });
    cast(c, r, g, X, 'broker', 17.6, -2.0, { h: 1.8, ry: -1.5, line: 'The floor is a mountain and the mountain moves. Buy the thing you would still want if the floor was zero.', hint: 'A collector' });
    extra(c, g, 1.4, -3.0, { col: 0x1a1a2a, ry: -PI / 2 }); c.post(X(1.4), -3.0, 0.3); extra(c, g, 18.4, -4.5, { col: 0x3a1a3a, ry: PI / 2 }); c.post(X(18.4), -4.5, 0.3);
    // the ticks: the cubes fly in, the one turns, the summit counts
    let top = 0, floored = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      giants.forEach((gi) => {
        const dx = P.x - X(gi.x), dz = P.z - GZ, d = Math.hypot(dx, dz);
        if (gi.u < 0 && d < 6) { gi.u = 0; c.sound.whoosh(0.5, 2); }
        if (gi.u >= 0 && gi.u < 1) { gi.u = Math.min(1, gi.u + dt / 2); const e = 1 - Math.pow(1 - gi.u, 3);
          for (let i = 0; i < gi.N; i++) { if (!gi.solid[i]) continue; const j = i * 3; V.set(gi.from[j] + (gi.to[j] - gi.from[j]) * e, gi.from[j + 1] + (gi.to[j + 1] - gi.from[j + 1]) * e, gi.from[j + 2] + (gi.to[j + 2] - gi.from[j + 2]) * e); M.compose(V, Q0, S1); gi.mesh.setMatrixAt(i, M); }
          gi.mesh.instanceMatrix.needsUpdate = true; if (gi.u >= 1) { c.sound.thud(0.5); c.shake(0.03); } }
        if (gi.k === theOne && gi.u >= 1) { const want = Math.atan2(dx, dz); let dd = want - gi.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); gi.yaw += dd * Math.min(1, dt * 0.6); gi.grp.rotation.y = gi.yaw; }
      });
      const dm = Math.max(Math.abs(P.x - X(MX)), Math.abs(P.z - MZ)); top = dm < 0.45 ? top + dt : 0;
      if (top > 0.8 && !floored) { floored = true; c.sound.ding(); c.egg('punks_floor', 'The floor. You climbed it. Most people only watch it from below and complain.'); }
    });
  },

  // THE CELLAR. Wine Library: racks floor to ceiling on both walls, a tasting counter with four glasses and the silver bucket,
  // barrels and crates, a mezzanine round the back with the WineText office on it. Find the sweaty sock.
  cellar(c, r, g, X) {
    const { THREE } = c, wood = c.surf('oldwood', 1.5, 0x8a6a48), planks = c.surf('planks', 2, 0x7a5a3a);
    const UP = new THREE.Vector3(0, 1, 0), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3(), col = new THREE.Color();
    coffer(c, r, g, { nx: 5, nz: 4, y: H_IN, mat: c.surf('planks', 2, 0x4a3020), bulb: 0xffd090 });
    const mz = mezzanine(c, r, g, X, { y: 3.0, depth: 2.4, stairAt: 6.5, mat: planks }); r.spawn = [10, 3.8];
    g.rotation.x = 0;   // fx.js mezzanine() writes `g.add(rail).rotation.x`, and add() returns the group, so it tilts the whole room; undo that here
    for (const x of [5.5, 14.5]) column(c, r, g, X, x, 4.5, { h: 3.0, rad: 0.16, mat: wood, cap: false });
    // the racks: shelves on both walls, bottles standing two deep (one on a phone), a label on the front row only
    const DEEP = c.MOBILE ? 1 : 2, PITCH = 0.085, SH = 0.36, WF = 0.12, EF = W - 0.37, slots = [];
    [[0, -7.7, 1.9, 5.8], [0, 5.7, 7.9, 2.8], [1, -7.7, 1.9, 5.8], [1, 5.7, 7.9, 2.8]].forEach(([e, z1, z2, top]) => {
      const rows = Math.floor((top - 0.2) / SH), per = Math.floor((z2 - z1) / PITCH), zc = (z1 + z2) / 2;
      for (let k = 0; k < rows; k++) { const y = 0.2 + k * SH; g.add(c.slab(0.42, 0.03, z2 - z1, wood, e ? EF - 0.21 : WF + 0.21, y - 0.015, zc));
        for (let b = 0; b < per; b++) for (let dI = 0; dI < DEEP; dI++) { const off = 0.09 * (DEEP - dI); slots.push([e ? EF - off : WF + off, y, z1 + (b + 0.5) * PITCH, dI === 0 ? (e ? -1 : 1) : 0]); } }
      for (let z = z1; z <= z2 + 0.01; z += 2.4) g.add(c.slab(0.06, top, 0.06, wood, e ? EF - 0.42 : WF + 0.42, top / 2, z));
      g.add(c.slab(0.42, 0.04, z2 - z1, wood, e ? EF - 0.21 : WF + 0.21, top, zc));
      c.wall(X(e ? EF - 0.46 : WF + 0.46), z1, X(e ? EF - 0.46 : WF + 0.46), z2);
    });
    const NB = slots.length, glass = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.15, envMapIntensity: 1.4 });
    const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 8), glass, NB), necks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.022, 0.1, 6), glass, NB);
    const labels = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.07), new THREE.MeshStandardMaterial({ map: labelTex(c), roughness: 0.85 }), slots.filter((s) => s[3]).length); let li = 0;
    slots.forEach(([x, y, z, face], i) => {
      V.set(x, y + 0.1, z); Q.identity(); M.compose(V, Q, S); bodies.setMatrixAt(i, M); V.set(x, y + 0.25, z); M.compose(V, Q, S); necks.setMatrixAt(i, M);
      const h = ((i * 7919) % 100) / 100; col.setHex(h < 0.72 ? 0x0e3a1a : h < 0.86 ? 0x1a4a22 : h < 0.94 ? 0x5a2e0e : 0x9ac0b0).offsetHSL(0, 0, (((i * 104729) % 13) / 13 - 0.5) * 0.08); bodies.setColorAt(i, col); necks.setColorAt(i, col);
      if (face) { V.set(x + face * 0.037, y + 0.1, z); Q.setFromAxisAngle(UP, face * PI / 2); M.compose(V, Q, S); labels.setMatrixAt(li, M); labels.setColorAt(li, col.setHex([0xf4ead2, 0xe8d8b0, 0xffffff, 0xd8c8a0, 0xf0e0e8][i % 5])); li++; }
    });
    bodies.instanceMatrix.needsUpdate = true; necks.instanceMatrix.needsUpdate = true; labels.instanceMatrix.needsUpdate = true; g.add(bodies); g.add(necks); g.add(labels);
    c.clickable(bodies, () => { c.sound.clink(2000); c.toast(`${NB.toLocaleString('en-US')} bottles on these walls, give or take. The real store has more. Nobody has counted either.`, 3000); }, 'The racks');
    // the chalk tags on the shelves
    const TAGS = [[0, -6.0, 'RIESLING', 'Riesling. The grape he spent a thousand episodes defending, and the tag that moved the least.'], [0, -3.2, 'SPANISH', 'Spanish. Where the value hides when everybody else is in Napa.'], [0, -0.4, 'RHONE', 'Rhone. Pepper, bacon, and the aisle the sock lives in.'], [0, 6.8, 'ITALY', 'Italy. Twenty regions and he has an opinion on every one.'], [1, -5.6, 'NEW YORKERS PICK', null], [1, -2.6, 'BURGUNDY', 'Burgundy. The shelf where the price does not match the label and he will tell you which ones are worth it.'], [1, 0.4, 'LOIRE', 'Loire. Chenin, cabernet franc, and the wines he poured when the camera was off.'], [1, 6.8, 'SPARKLING', 'Sparkling. Under the mezzanine, because that is where the bubbles were in the real store too.']];
    TAGS.forEach(([e, z, txt, note]) => { const s = c.sign(txt, { w: 0.7, h: 0.18, bg: '#1b1f1a', fg: '#e8e4d0', font: c.FONT, weight: 800, px: 56, border: '#5a4a3a' }); s.position.set(e ? EF - 0.46 : WF + 0.46, 1.58, z); s.rotation.y = e ? -PI / 2 : PI / 2; g.add(s);
      if (!note) c.clickable(s, () => { c.sound.click(); c.egg('cellar_pick', 'New Yorkers pick. A shelf tag written by whoever worked the floor that day. The tag sold more wine than any critic.'); }, 'The shelf tag');
      else c.clickable(s, () => { c.sound.click(); c.toast(note, 3000); }, txt); });
    // the tasting counter in the north centre
    const CX = 10, CZ = -4.6; g.add(c.slab(4.0, 0.95, 0.7, wood, CX, 0.475, CZ)); g.add(c.slab(4.1, 0.05, 0.8, c.surf('marble', 1, 0xd8d0c0), CX, 0.975, CZ)); g.add(c.slab(4.0, 0.08, 0.1, wood, CX, 0.7, CZ + 0.36));
    c.wall(X(7.95), -5.0, X(12.05), -5.0); c.wall(X(7.95), -4.2, X(12.05), -4.2); c.wall(X(7.95), -5.0, X(7.95), -4.2); c.wall(X(12.05), -5.0, X(12.05), -4.2);
    const silver = std(c, 0xe0e0e8, { metalness: 1, roughness: 0.2, side: THREE.DoubleSide });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.34, 24, 1, true), silver); bucket.position.set(11.5, 1.17, CZ); g.add(bucket);
    const ice = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24), std(c, 0xeaf4ff, { roughness: 0.3 })); ice.position.set(11.5, 1.3, CZ); g.add(ice);
    const chill = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), std(c, 0x183a20, { roughness: 0.2 })); chill.position.set(11.52, 1.42, CZ); chill.rotation.z = 0.2; g.add(chill);
    const spit = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.26, 20, 1, true), std(c, 0x8a8a90, { metalness: 0.9, roughness: 0.5, side: THREE.DoubleSide })); spit.position.set(8.2, 1.13, CZ + 0.05); g.add(spit);
    c.clickable(bucket, () => { c.sound.clink(900); c.egg('cellar_bucket', 'The silver bucket. He tasted into it on camera for five years and the wine trade never quite forgave him. The bucket is cleaner than it looks.'); }, 'The silver bucket');
    c.clickable(spit, () => { c.sound.slap(); c.toast('The spit bucket. Tasting is not drinking. The bucket is where the honesty goes.', 3000); }, 'The spit bucket');
    const corks = new THREE.Group(); corks.position.set(9.0, 1.0, CZ + 0.22); g.add(corks); for (let k = 0; k < 7; k++) { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.045, 8), std(c, 0xc8a070, { roughness: 0.9 })); ck.position.set((Math.random() - 0.5) * 0.3, 0.012, (Math.random() - 0.5) * 0.1); ck.rotation.set(PI / 2, Math.random() * 3, 0); corks.add(ck); }
    // THE NOSE: four glasses; click one and the room tastes like it; one of them is the sweaty sock
    const WINES = [['RIESLING', 0xd8f090, 'Lime zest, a wet slate roof, a tennis ball straight out of the can. Spit it and it still hangs around.', false], ['RIOJA', 0x5a0a18, 'Dried cherry, saddle leather, a cigar box left in a taxi. Big shoulders. Swirl it, then be quiet and taste.', false], ['RHONE', 0x3a0812, 'Bacon fat, black pepper, violets in a tyre shop. And there it is, at the back. The sweaty sock.', true], ['CHABLIS', 0xeadc80, 'Oyster shell, green apple, a cold stone floor. Zero oak. Anybody who calls it boring never had it with a clam.', false]];
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.05, thickness: 0.02, transparent: true, opacity: 0.5 }), tasted = new Set();
    WINES.forEach(([nm, wc, note, sock], k) => {
      const x = 8.9 + k * 0.52, gl = new THREE.Group(); gl.position.set(x, 1.0, CZ - 0.1); g.add(gl);
      gl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 10), glassM)).position.y = 0.05; gl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), glassM)).position.y = 0.14;
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12, 0, PI * 2, 0, PI * 0.55), glassM); bowl.position.y = 0.26; bowl.rotation.x = PI; gl.add(bowl);
      const wine = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 10, 0, PI * 2, PI * 0.5, PI * 0.45), std(c, wc, { roughness: 0.3 })); wine.position.y = 0.255; gl.add(wine);
      const tag = c.sign(nm, { w: 0.3, h: 0.07, bg: '#1b1f1a', fg: '#e8e4d0', font: c.MONO, weight: 700, px: 40 }); tag.position.set(0, 0.36, 0.06); gl.add(tag);
      c.clickable(gl, () => { c.FX.tint = wc; r.owns = true; setTimeout(() => { if (r.owns) { c.FX.tint = null; r.owns = false; } }, 5000); c.sound.slap(); c.sound.clink(1300 + k * 180); c.toast(`${nm}: ${note}`, 4600); tasted.add(k);
        if (sock) c.egg('cellar_sock', 'The sweaty sock. His most famous word for a wine, said with love, on camera, in a store in New Jersey. You found it in four clicks or fewer.');
        else if (tasted.size === 4) c.toast('Four glasses, one sock. Either way, you tasted.', 2800); }, `Nose the ${nm.toLowerCase()}`);
    });
    const nose = c.sign('THE NOSE · FOUR GLASSES · FIND THE SWEATY SOCK', { w: 2.2, h: 0.2, bg: '#1b1f1a', fg: '#e8e4d0', font: c.FONT, weight: 800 }); nose.position.set(CX, 1.4, CZ + 0.42); g.add(nose);
    const bl = c.sign('WINE LIBRARY · SPRINGFIELD, NEW JERSEY · SINCE 1983', { w: 5.0, h: 0.34, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 8 }); bl.position.set(10, 5.3, -D / 2 + 0.14); g.add(bl);
    plaque(c, g, 15.0, 2.3, -D / 2 + 0.14, 0, 'Four wines a day, five days a week, from a store in New Jersey.', 'WINE LIBRARY TV, 2006 TO 2011', 2.2);
    // the mezzanine: a rail sign for the floor, the WineText office behind a partition, a plaque of the store's facts
    const rs = c.sign('THE MEZZANINE · IT RUNS ROUND THE REAL STORE TOO', { w: 3.4, h: 0.24, bg: '#1b1f1a', fg: '#e8e4d0', font: c.FONT, weight: 800 }); rs.position.set(7.0, 3.55, mz.z0 + 0.04); rs.rotation.y = PI; g.add(rs);
    g.add(c.slab(0.12, 2.6, 2.4, c.surf('plaster', 2, 0x9a8a70), 14.6, 3.0 + 1.3, 6.8)); c.wall(X(14.6), 5.6, X(14.6), 8.0);
    const ol = c.sign('WINETEXT · THE OFFICE', { w: 1.4, h: 0.2, bg: '#1b1f1a', fg: '#f5c542', font: c.MONO, weight: 800 }); ol.position.set(14.54, 5.2, 6.8); ol.rotation.y = -PI / 2; g.add(ol);
    const wt = plaque(c, g, 14.68, 4.25, 6.9, PI / 2, 'WineText: one wine a day, by text message, from this store.\n586 Morris Avenue, Springfield, New Jersey. Founded 1983 as Shopper\'s Discount Liquors.\nwinelibrary.com in 1996. He joined full time in 1998.\nThree million to sixty million a year, by his count.', 'WINE LIBRARY', 2.2);
    c.clickable(wt, () => { c.sound.click(); c.egg('cellar_winetext', 'WineText. The store that went online in 1996 now sells wine by text message. Same shelves, same mezzanine, new phone.'); }, 'The plaque');
    const phone = new THREE.Group(); phone.position.set(16.9, 3.76, 6.9); g.add(phone); phone.add(c.slab(0.2, 0.07, 0.15, std(c, 0x1a1a1e, { roughness: 0.5 }), 0, 0.035, 0)); phone.add(c.slab(0.22, 0.05, 0.06, std(c, 0x1a1a1e, { roughness: 0.5 }), 0, 0.095, -0.03));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), basic(c, 0x7fff9a)); scr.position.set(0.02, 0.071, 0.04); scr.rotation.x = -PI / 2; phone.add(scr);
    c.clickable(phone, () => { c.sound.bell(); c.toast('WineText. One wine a day, by text. The shop floor still runs on a phone.', 3000); }, 'The phone');
    // the people: a clerk, the father, somebody upstairs, and two regulars
    cast(c, r, g, X, 'bookseller', 12.8, -5.3, { h: 1.75, ry: 0.9, line: 'Four glasses, one bucket, no notes. Find the sock and I will tell you which shelf it came from.', egg: 'cellar_clerk', hint: 'The clerk' });
    cast(c, r, g, X, 'dad', 3.6, 1.0, { h: 1.8, ry: 0.8, line: 'Nineteen eighty three. Shopper\'s Discount Liquors. Nobody called it a library yet.', hint: 'The father' });
    cast(c, r, g, X, 'hustler', 6.4, 6.4, { h: 1.75, y: 3.0, ry: 0.6, r: 0, line: 'The mezzanine runs round the real store too. From up here you can see every bottle he ever talked about.', hint: 'Somebody upstairs' });
    extra(c, g, 1.0, -3.2, { col: 0x3a4a6a, ry: -PI / 2 }); c.post(X(1.0), -3.2, 0.3);
    const climber = extra(c, g, 6.5, 2.6, { col: 0x5a2fa0, ry: PI }); climber.position.y = 3.0 * (2.6 - (mz.z0 - 4.2)) / 4.2;
    // the tick: give the tint back when you leave
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (r.owns) { c.FX.tint = null; r.owns = false; } return; } });
  },
};

// ---------- the Poly Haven props per room (CC0), [id, x, z, { h | len, ry, y, r, egg }] ----------
export const PROPS_C = {
  comics: [
    ['hand_truck', 13.6, 6.6, { h: 1.2, ry: 0.5, r: 0.45 }],
    ['cardboard_box_01', 15.3, 7.2, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 15.3, 7.2, { len: 0.55, y: 0.42, ry: 0.3 }], ['cardboard_box_01', 15.3, 6.5, { len: 0.5 }],
    ['caged_hanging_light', 3.6, -3.0, { h: 0.5, y: 5.0 }], ['caged_hanging_light', 3.6, 1.0, { h: 0.5, y: 5.0 }], ['caged_hanging_light', 3.6, 5.0, { h: 0.5, y: 5.0 }],
    ['mounted_fluorescent_lights', 14, -2, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 4, { len: 1.3, y: 5.85 }],
    ['painted_wooden_bench', 17.2, 1.0, { len: 2.2, ry: 0, r: 0.9 }],
    ['metal_trash_can', 1.0, 7.2, { h: 0.95, r: 0.35 }], ['metal_stool_01', 7.8, -4.4, { h: 0.7, r: 0.3 }], ['plastic_crate_01', 1.2, -1.0, { h: 0.32, r: 0.35 }],
    ['wall_clock', 19.5, -2.8, { h: 0.5, y: 4.4, ry: -PI / 2 }], ['security_camera_01', 0.4, -7.5, { h: 0.3, y: 5.4, ry: 0.8 }],
    ['standing_chalkboard_01', 16.2, -2.6, { h: 1.7, ry: -0.6, r: 0.5 }],
  ],
  punks: [
    ['security_camera_01', 0.5, -7.5, { h: 0.3, y: 5.3, ry: 0.8 }], ['security_camera_01', 19.3, 7.4, { h: 0.3, y: 5.3, ry: 3.9 }],
    ['caged_hanging_light', 3.6, -4.0, { h: 0.5, y: 5.2 }], ['caged_hanging_light', 10, -4.0, { h: 0.5, y: 5.2 }], ['caged_hanging_light', 16.4, -4.0, { h: 0.5, y: 5.2 }],
    ['hanging_industrial_lamp', 3.2, 6.2, { h: 0.5, y: 5.3 }],
    ['metal_stool_01', 18.2, 0.6, { h: 0.7, r: 0.3 }], ['plastic_crate_02', 1.0, 0.6, { h: 0.4, r: 0.3 }],
    ['vintage_suitcase', 15.4, 7.5, { len: 0.6, ry: 0.4, r: 0.4 }], ['cardboard_box_01', 13.2, 7.6, { len: 0.55, r: 0.35 }],
  ],
  cellar: [
    ['wine_barrel_01', 1.5, -6.5, { h: 0.9, r: 0.5 }], ['wine_barrel_01', 2.9, -6.5, { h: 0.9, r: 0.5 }], ['wine_barrel_01', 1.5, -5.1, { h: 0.9, r: 0.5 }], ['wine_barrel_01', 6.5, 6.6, { h: 0.9, y: 3.0 }],
    ['wooden_crate_01', 17.2, -6.6, { len: 0.8, r: 0.5 }], ['wooden_crate_01', 17.2, -6.6, { len: 0.75, y: 0.8, ry: 0.2 }], ['wooden_crate_01', 18.2, -5.4, { len: 0.8, r: 0.5 }], ['wooden_crate_01', 10.4, 7.2, { len: 0.8, y: 3.0 }],
    ['hand_truck', 16.0, 0.4, { h: 1.2, ry: 0.6, r: 0.45 }], ['cardboard_box_01', 16.4, -1.2, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 16.4, -1.2, { len: 0.55, y: 0.42, ry: 0.4 }],
    ['standing_chalkboard_01', 4.6, -3.0, { h: 1.7, ry: 0.7, r: 0.5 }],
    ['hanging_industrial_lamp', 5, -2, { h: 0.5, y: 5.3 }], ['hanging_industrial_lamp', 15, -2, { h: 0.5, y: 5.3 }], ['caged_hanging_light', 10, -4.6, { h: 0.5, y: 5.2 }],
    ['wine_bottles_01', 11.0, -4.75, { h: 0.35, y: 1.0 }], ['brass_goblets', 9.9, -4.75, { len: 0.2, y: 1.0 }],
    ['metal_office_desk', 17.4, 6.9, { len: 1.5, y: 3.0, r: 0.8 }], ['classic_laptop', 17.8, 6.9, { len: 0.4, y: 3.76 }], ['office_notepads', 16.4, 7.1, { len: 0.25, y: 3.76 }], ['desk_lamp_arm_01', 18.1, 7.2, { h: 0.5, y: 3.76, ry: 0.4 }],
    ['folding_wooden_stool', 17.4, 6.1, { h: 0.5, y: 3.0 }], ['wall_clock', 17.4, 7.8, { h: 0.5, y: 5.0, ry: PI }], ['potted_plant_04', 19.2, 5.0, { h: 1.2, y: 3.0 }],
  ],
};

// ---------- where the twelve New Yorkers hang ----------
export const SLOTS_C = {
  // comics: the south wall under the strips, the east wall, two on the west wall by the press, two beside the portal
  comics: () => { const S = []; [2.2, 4.8, 7.4, 10.0, 17.6].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })); [-4.2, -1.8, 0.4].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); [-6.8, 0.0].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.3 })); [2.0, 18.0].forEach((x) => S.push({ x, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.4 })); return S; },
  // punks: the side walls are the pixel grids, so the New Yorkers take the south wall in two rows, the free ends of the side walls and the portal flanks
  punks: () => { const S = []; [2.2, 4.8, 7.4, 10.0].forEach((x) => S.push({ x, y: 4.4, z: D / 2 - 0.14, ry: PI, w: 1.3 })); [5.6, 8.2, 10.8].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.4 })); S.push({ x: W - 0.14, y: 2.1, z: 0.4, ry: -PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z: 6.8, ry: -PI / 2, w: 1.2 }); S.push({ x: 0.14, y: 2.1, z: 0.4, ry: PI / 2, w: 1.4 }); [1.2, 18.8].forEach((x) => S.push({ x, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.3 })); return S; },
  // cellar: the side walls are racks, so seven hang above the mezzanine deck on the south wall, three under it, two beside the portal
  cellar: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 4.7, z: D / 2 - 0.14, ry: PI, w: 1.3 }); [6.0, 10.0, 14.0].forEach((x) => S.push({ x, y: 1.6, z: D / 2 - 0.14, ry: PI, w: 1.2 })); [2.0, 18.0].forEach((x) => S.push({ x, y: 2.1, z: -D / 2 + 0.14, ry: 0, w: 1.4 })); return S; },
};
