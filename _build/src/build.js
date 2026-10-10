// The rooms, one by one. Every label, sign and product in here is a NEW YORKERS brand.
import { W, D, H_IN, PORTAL } from './rooms.js';

const PI = Math.PI;
const BRANDS = ['EYE CRUNCH', 'TALLY CHIPS', 'UNCOUNTED', 'NAZAR COLA', 'N3W YORKERS', 'MLow', 'THE MARKS', 'COUNTED OUT', 'BODEGA BLOOM', 'ERA XIX', 'GET COUNTED', 'LEFT OFF'];
const INK = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ffffff', '#ff7a1a'];

export function buildRoom(c, r) {
  const { THREE, scene } = c;
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;   // room x to world x, for colliders
  const mats = matsFor(c, r);
  const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN;

  // floor, ceiling
  g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if (r.ceil && !r.outdoor) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, H_IN + 0.05, 0));

  // walls with colliders. South: full. North: flanks either side of the portal plus a lintel.
  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
  g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) g.add(c.slab(pw, H_IN - PORTAL.h, 0.24, mats.wall, W / 2, PORTAL.h + (H_IN - PORTAL.h) / 2, -D / 2 - 0.12));
  // west wall (doorway to the previous room) and the east end wall of the last room
  const DZ1 = 2, DZ2 = 5.6, DH = 3.6;
  const sideWall = (x, door) => {
    if (!door) { g.add(c.slab(0.24, HT, D, mats.wall, x, HT / 2, 0)); c.wall(X(x), -D / 2, X(x), D / 2); return; }
    const a = DZ1 + D / 2, b = D / 2 - DZ2;
    g.add(c.slab(0.24, HT, a, mats.wall, x, HT / 2, -D / 2 + a / 2));
    g.add(c.slab(0.24, HT, b, mats.wall, x, HT / 2, D / 2 - b / 2));
    g.add(c.slab(0.24, HT - DH, DZ2 - DZ1, mats.wall, x, DH + (HT - DH) / 2, (DZ1 + DZ2) / 2));
    c.wall(X(x), -D / 2, X(x), DZ1); c.wall(X(x), DZ2, X(x), D / 2);
    const fr = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
    for (const z of [DZ1, DZ2]) g.add(c.slab(0.36, DH, 0.14, fr, x, DH / 2, z));
    g.add(c.slab(0.36, 0.16, DZ2 - DZ1 + 0.14, fr, x, DH + 0.08, (DZ1 + DZ2) / 2));
  };
  sideWall(0, r.i > 0);
  if (r.last || r.id === 'roof') sideWall(W, false);
  // door signs: the next room's name over the east door, the previous one's over the west
  if (r.i > 0) { const s = c.sign(`< ${prevName(r)}`, { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' }); s.position.set(0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' }); s.position.set(W - 0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  // the plate behind the portal
  c.plate(r);

  // the Marks
  const slots = slotsFor(r);
  r.marks.forEach((m, k) => { const s = slots[k]; if (!s) return; c.hang(m, s.x, s.y, s.z, s.ry, s.w, s.style || r.frame || 'black', g); });

  // the room's own things
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  // every room gets drips and an eye flower or two, because it is that kind of night
  dressing(c, r, g);
}

function prevName(r) { return r.prev || ''; }

// ---------- surfaces ----------
function matsFor(c, r) {
  const { THREE } = c;
  const m = { floor: c.surf(r.floor, r.floor === 'asphalt' ? 3 : r.floor === 'cobble' ? 1.5 : 2.2, r.floorTint || (r.outdoor ? 0x5a5c66 : 0x9a9a9a)) };
  m.ceil = r.ceil === 'steel' ? new THREE.MeshStandardMaterial({ color: 0x1b1d1f, metalness: 0.6, roughness: 0.6 }) : r.ceil ? c.surf(r.ceil, 3, 0x5a5650) : null;
  if (r.mural && (window.WALLS || []).includes(r.id)) {   // a Nano Banana wall painted for this room, one image per 10 m of wall, floor to top
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else if (r.wall === 'tile') m.wall = tileMat(c);
  else if (r.wall === 'velvet') m.wall = new THREE.MeshStandardMaterial({ color: 0x5a0a12, roughness: 0.9, map: noiseTex(c, '#6e0f18', '#3d050b') });
  else if (r.outdoor) m.wall = c.surf('brick', 2.4, 0x6e6660);
  else m.wall = c.surf(r.wall, 2.4, r.wallTint);
  if (r.floor === 'asphalt' || r.floor === 'cobble') { m.floor.roughness = 0.32; m.floor.metalness = 0.35; }  // it rained
  return m;
}
function tileMat(c) {
  const t = c.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#7d827c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      const v = 228 + Math.random() * 18; g.fillStyle = `rgb(${v},${v},${v - 6})`; g.fillRect(x * 128 + 3, y * 64 + 3, 122, 58);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x * 128 + 6, y * 64 + 6, 116, 8);
    }
  });
  t.wrapS = t.wrapT = 1000; // RepeatWrapping
  const m = new c.THREE.MeshStandardMaterial({ map: t, roughness: 0.18, metalness: 0.05 }); m.userData.rep = 1.2; return m;
}
function noiseTex(c, a, b) {
  const t = c.canvasTex(256, 256, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = b; g.globalAlpha = 0.25; g.fillRect(i * 3.7 % w, 0, 2, h); } });
  t.wrapS = t.wrapT = 1000; return t;
}

// the eye flower, drawn: white and pink petals round a blue nazar
export function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, Math.PI * 2); g.fill();
}
function drips(g, w, h, n, top = 0) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, len = h * (0.2 + Math.random() * 0.7), wd = 3 + Math.random() * 9; g.fillStyle = INK[i % 3];
    g.globalAlpha = 0.85; g.fillRect(x, top, wd, len); g.beginPath(); g.arc(x + wd / 2, top + len, wd * 0.9, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}
function tally(g, x, y, s, col = 'rgba(255,255,255,.85)', n = 5) {
  g.strokeStyle = col; g.lineWidth = s * 0.08; g.lineCap = 'round';
  for (let i = 0; i < Math.min(4, n); i++) { g.beginPath(); g.moveTo(x + i * s * 0.22, y); g.lineTo(x + i * s * 0.22 + s * 0.03, y + s); g.stroke(); }
  if (n >= 5) { g.beginPath(); g.moveTo(x - s * 0.1, y + s * 0.8); g.lineTo(x + s * 0.85, y + s * 0.15); g.stroke(); }
}
function decal(c, w, h, draw) { const t = c.canvasTex(Math.round(256 * w / h), 256, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
function neon(c, text, w, h, col) { return c.sign(text, { w, h, bg: null, fg: col, glow: 28, weight: 700, px: 200 }); }

function dressing(c, r, g) {
  const { THREE } = c;
  // paint drips down the wall above the portal and in the corners, plus chalk tallies by the doors
  const d = decal(c, 6, 3, (q, w, h) => drips(q, w, h, 26));
  d.position.set(W / 2, r.outdoor ? 6.5 : H_IN - 1.5, -D / 2 + 0.02); g.add(d);
  const t = decal(c, 1.4, 1, (q, w, h) => { for (let i = 0; i < 3; i++) tally(q, 20 + i * 120, 40 + (i % 2) * 60, 100); });
  t.position.set(0.14, 1.2, -1); t.rotation.y = PI / 2; if (r.i > 0) g.add(t);
  // a nazar hanging on a string by the portal
  const nz = new THREE.Group(); nz.position.set(W / 2 - PORTAL.w / 2 - 0.5, r.outdoor ? 3.2 : PORTAL.h - 0.2, -D / 2 + 0.4);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8), new THREE.MeshBasicMaterial({ color: 0x222222 })); str.position.y = 0.4; nz.add(str);
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), new THREE.MeshPhysicalMaterial({ map: c.canvasTex(256, 256, (q) => { [[128, '#1d4ed8'], [92, '#ffffff'], [60, '#22d3ee'], [30, '#0b1020']].forEach(([rr, col]) => { q.fillStyle = col; q.beginPath(); q.arc(128, 128, rr, 0, 7); q.fill(); }); }), roughness: 0.05, transmission: 0.2, clearcoat: 1 }));
  eye.rotation.x = PI / 2; nz.add(eye); g.add(nz);
  c.tick((tt) => { nz.rotation.z = Math.sin(tt * 1.3 + r.i) * 0.12; nz.rotation.y = tt * 0.4; });
}

// ---------- hanging plans ----------
function slotsFor(r) {
  const S = [], w = r.artW || 1.3, south = D / 2 - 0.14, north = -D / 2 + 0.14;
  const row = (y, z, ry, xs, style) => xs.forEach((x) => S.push({ x, y, z, ry, w, style }));
  const xsS = Array.from({ length: 11 }, (_, i) => 1.6 + i * 1.68);
  const side = (x, ry, y) => { [-7, -5.3, -3.6, -1.9, 0.2].forEach((z) => S.push({ x, y, z, ry, w })); S.push({ x, y, z: 6.8, ry, w }); };
  if (r.id === 'street') { // the plywood hoarding, pasted two rows deep
    row(1.35, south - 0.2, PI, Array.from({ length: 12 }, (_, i) => 1.3 + i * 1.58), 'paste');
    row(2.55, south - 0.2, PI, Array.from({ length: 12 }, (_, i) => 1.3 + i * 1.58 + 0.4), 'paste');
    return S;
  }
  if (r.id === 'theater') { for (let i = 0; i < 9; i++) S.push({ x: 1.9 + i * 2.03, y: 2.5, z: south, ry: PI, w: 1.72, style: 'gilt' }); return S; }
  if (r.id === 'roof') { // three washing lines
    [[-2.2, 9], [1.6, 9], [5.2, 8]].forEach(([z, n]) => { for (let i = 0; i < n; i++) S.push({ x: 2.4 + i * (15.2 / (n - 1)), y: 1.75, z, ry: 0, w: 1.15, style: 'line' }); });
    return S;
  }
  const hi = r.id === 'deli' ? 3.35 : 2.0;
  row(hi, south, PI, xsS);
  if (r.id !== 'deli') side(0.14, PI / 2, hi); else S.push(...[-7, -5.3, -3.6, -1.9, 0.2, 6.8].map((z) => ({ x: 0.14, y: 3.5, z, ry: PI / 2, w })));
  side(W - 0.14, -PI / 2, hi);
  row(hi, north, 0, [2.0, 18.0]);
  row(hi + 1.5, south, PI, xsS);
  return S;
}

// ---------- the rooms ----------
const ROOM = {
  street(c, r, g, X) {
    const { THREE } = c;
    // the plywood hoarding the Marks are pasted to, POST NO BILLS stencilled, tallies everywhere
    const ply = c.slab(W - 0.4, 3.6, 0.06, c.surf('planks', 2.4, 0xc49a62), W / 2, 1.8, D / 2 - 0.18); g.add(ply);
    const pnb = decal(c, 7, 1, (q, w, h) => { q.fillStyle = 'rgba(20,20,20,.85)'; q.font = `900 ${h * 0.7}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('POST NO BILLS', w / 2, h / 2); });
    pnb.position.set(W / 2, 3.25, D / 2 - 0.25); pnb.rotation.y = PI; g.add(pnb);
    const tl = decal(c, 4, 1.4, (q, w, h) => { for (let i = 0; i < 6; i++) tally(q, 20 + i * 120, 30 + (i % 3) * 40, 110); });
    tl.position.set(3, 0.55, D / 2 - 0.26); tl.rotation.y = PI; g.add(tl);
    // the newsstand, where the papers already know
    c.glb('newsstand', { h: 2.7, x: 3.2, z: -4.6, ry: 0.7, parent: g, onload: (o) => c.clickable(o, () => { const H = ['150 NEW YORKERS LEFT OFF THE COUNT. THEY ARE TAKING IT WELL.', 'LOCAL PIGEON DEMANDS RECOUNT', 'CENSUS TAKER STILL LOOKING FOR APARTMENT 4R', 'BODEGA CAT DECLINES TO COMMENT', 'SEALED CARDS, SAME FOR EVERYONE. NOBODY PICKS.', 'EYE FLOWERS SPOTTED ON CANAL STREET AGAIN']; c.toast('EXTRA: ' + H[(Math.random() * H.length) | 0]); c.egg('news'); }, 'Read the paper') });
    c.post(X(3.2), -4.6, 1.4);
    // the hydrant is open, of course it is
    const hy = c.glb('hydrant', { h: 0.85, x: 15.6, z: -6.2, ry: -0.7, parent: g, onload: (o) => c.clickable(o, () => { c.say(o, 'Summer never ends on this block.'); c.egg('hydrant'); }, 'The hydrant') });
    c.post(X(15.6), -6.2, 0.4);
    spray(c, g, 15.3, 0.55, -6.2, X, r);
    steam(c, g, 9.2, 0, -5.4);
    // the cab, MLOW on the roof, a working horn
    taxi(c, g, 14.6, -1.8, PI / 2 + 0.08, X);
    c.glb('lamppost', { h: 5.2, x: 0.8, z: -6.8, parent: g }); c.post(X(0.8), -6.8, 0.25);
    c.glb('mailbox', { h: 1.25, x: 6.8, z: 6.6, ry: PI, parent: g }); c.post(X(6.8), 6.6, 0.45);
    c.glb('storm_drain', { len: 1.2, x: 11, z: -7.4, parent: g });
    pigeons(c, g, r, X, 7, [6, 13, -3, 4]);
    // the dark facades either side above the hoarding, lit windows
    windows(c, g, r);
  },
  deli(c, r, g, X) {
    const { THREE } = c;
    // two gondolas lined with NEW YORKERS products, one aisle that runs into the photograph
    for (const gx of [6.2, 13.8]) { gondola(c, g, gx, -7.2, 2.2, 9.2); c.wall(X(gx - 0.55), -7.2, X(gx - 0.55), 2.2); c.wall(X(gx + 0.55), -7.2, X(gx + 0.55), 2.2); }
    // the fridge wall
    const fr = decal(c, 8.6, 2.5, (q, w, h) => { q.fillStyle = '#d8f4ff'; q.fillRect(0, 0, w, h); for (let col = 0; col < 18; col++) for (let rw = 0; rw < 4; rw++) { const x = col * w / 18, y = rw * h / 4; for (let b = 0; b < 4; b++) { q.fillStyle = INK[(col + rw + b) % INK.length]; q.fillRect(x + 6 + b * 14, y + 22, 10, h / 4 - 30); } q.fillStyle = '#0b1020'; q.font = `700 11px ${c.MONO}`; q.fillText(rw % 2 ? 'NAZAR COLA' : 'EYE WATER', x + 6, y + 14); } q.strokeStyle = '#8899aa'; q.lineWidth = 6; for (let i = 0; i <= 6; i++) q.strokeRect(i * w / 6, 0, w / 6, h); });
    fr.material = new THREE.MeshBasicMaterial({ map: fr.material.map, toneMapped: false }); fr.material.color.setScalar(0.9);
    fr.position.set(0.16, 1.35, -2.6); fr.rotation.y = PI / 2; g.add(fr);
    // the counter, the register, the cat, the take-a-number
    const top = new THREE.MeshStandardMaterial({ color: 0xa8b0b5, metalness: 0.9, roughness: 0.25 });
    g.add(c.slab(1.1, 1.05, 6, c.surf('planks', 1.5, 0x8a5a3a), 17.6, 0.52, 1.2)); g.add(c.slab(1.2, 0.05, 6.1, top, 17.6, 1.07, 1.2)); c.wall(X(17), -1.8, X(17), 4.2); c.wall(X(17), -1.8, X(20), -1.8);
    const front = decal(c, 5.8, 0.9, (q, w, h) => { q.fillStyle = '#0d3b2e'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `800 ${h * 0.42}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('THE UNCOUNTED DELI · HEROES · COFFEE · LOTTO', w / 2, h / 2); eyeFlower(q, 50, h / 2, 40); eyeFlower(q, w - 50, h / 2, 40); });
    front.position.set(17.03, 0.62, 1.2); front.rotation.y = -PI / 2; g.add(front);
    let serving = 47; const led = c.canvasTex(512, 160, () => {}); const drawLed = () => { const q = led.userData.canvas.getContext('2d'); q.fillStyle = '#120202'; q.fillRect(0, 0, 512, 160); q.fillStyle = '#ff3b2f'; q.font = `600 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText('NOW SERVING', 256, 42); q.shadowColor = '#ff2a1a'; q.shadowBlur = 24; q.font = `700 96px ${c.MONO}`; q.fillText(String(serving).padStart(3, '0'), 256, 138); led.needsUpdate = true; }; drawLed();
    const ledm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshBasicMaterial({ map: led, toneMapped: false })); ledm.position.set(16.95, 3.0, 1.2); ledm.rotation.y = -PI / 2; g.add(ledm);
    c.glb('dispenser', { h: 1.35, x: 16.3, z: 4.8, ry: -PI / 2, parent: g, onload: (o) => c.clickable(o, () => {
      serving++; drawLed(); c.sound.ticket();
      const m = r.marks[(Math.random() * r.marks.length) | 0]; c.toast(`NOW SERVING ${String(serving).padStart(3, '0')}: ${m.t}`);
      if (m.mesh) { const mt = m.mesh.material; let k = 0; const iv = setInterval(() => { mt.emissiveIntensity = (k++ % 2) ? 0.55 : 2.2; if (k > 9) { clearInterval(iv); mt.emissiveIntensity = 0.55; } }, 160); }
      c.egg('ticket');
    }, 'Take a number') });
    c.post(X(16.3), 4.8, 0.35);
    const cat = c.glb('cat', { h: 0.48, x: 17.6, z: -0.6, y: 1.1, ry: -PI / 2, parent: g, onload: (o) => c.clickable(o, () => { c.sound.meow(); const L = ['This is my store.', 'You were not counted. Neither was I.', 'Mrrp.', 'No photos. Fine, one photo.', 'I sleep on the ledger. It is warm.']; c.say(o, L[(Math.random() * L.length) | 0], 2600, 0.9); c.egg('cat'); }, 'The bodega cat') });
    c.tick((t, dt, P) => { const a = Math.atan2(P.x - X(17.6), P.z - (-0.6)); cat.rotation.y += (((a - cat.rotation.y + PI * 3) % (PI * 2)) - PI) * dt * 0.6; });
    // menu board of nonsense
    const mb = decal(c, 3.4, 1.6, (q, w, h) => { q.fillStyle = '#141414'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.07}px ${c.MONO}`; ['BACON EGG AND CHEESE ....... 1 TALLY', 'THE UNCOUNTED HERO ......... 5 TALLIES', 'EYE FLOWER TEA ............. ASK THE CAT', 'CHOPPED CHEESE ............. ERA XIV', 'NAZAR COLA ................. 2 FOR 1', 'COFFEE, REGULAR ............ WE ARE HAPPY', '                             TO COUNT YOU'].forEach((s, i) => q.fillText(s, 20, 34 + i * h * 0.12)); for (let i = 0; i < 4; i++) tally(q, w - 140 + (i % 2) * 60, h - 110 + (i > 1 ? 40 : 0), 40, '#f4ead2'); });
    mb.position.set(W - 0.16, 4.0, -4.2); mb.rotation.y = -PI / 2; g.add(mb);
    // fluorescent tubes, one dying a green death
    const tubes = []; for (const tx of [4, 10, 16]) for (const tz of [-5, 0, 5]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 2.4), new THREE.MeshBasicMaterial({ color: 0xf2fff4, toneMapped: false })); m.position.set(tx, H_IN - 0.08, tz); g.add(m); tubes.push(m); }
    c.tick((t) => { const f = Math.sin(t * 37) > 0.3 && Math.sin(t * 3.1) > -0.2; tubes[4].material.color.set(f ? 0xb8ffc8 : 0x203020); });
  },
  subway(c, r, g, X) {
    const { THREE } = c;
    const beam = new THREE.MeshStandardMaterial({ color: 0x0e0f10, metalness: 0.7, roughness: 0.55 });
    for (const bx of [3.5, 8, 12, 16.5]) for (const bz of [-5.2, 2.6]) { if (Math.abs(bx - 10) < 2.6 && bz < 0) continue; g.add(c.slab(0.3, H_IN, 0.3, beam, bx, H_IN / 2, bz)); c.post(X(bx), bz, 0.28); const tl = decal(c, 0.28, 1.4, (q, w, h) => { for (let i = 0; i < 3; i++) tally(q, 10, 20 + i * 80, 60); }); tl.position.set(bx, 1.4, bz + 0.16); g.add(tl); }
    // the mosaic name band and an eye flower in tile
    const band = decal(c, W - 1, 0.7, (q, w, h) => { q.fillStyle = '#5b2a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f2ead6'; q.fillRect(6, 6, w - 12, h - 12); q.fillStyle = '#3a6a3a'; q.fillRect(14, 14, w - 28, h - 28); q.fillStyle = '#f2ead6'; q.font = `700 ${h * 0.5}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('UNCOUNTED ST', w / 2, h / 2); eyeFlower(q, 120, h / 2, h * 0.36); eyeFlower(q, w - 120, h / 2, h * 0.36); });
    band.position.set(W / 2, 4.5, D / 2 - 0.15); band.rotation.y = PI; g.add(band);
    // the yellow edge at the portal
    const edge = decal(c, PORTAL.w, 0.6, (q, w, h) => { q.fillStyle = '#e8c21a'; q.fillRect(0, 0, w, h); q.fillStyle = '#b9960f'; for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { q.beginPath(); q.arc(x, y, 4, 0, 7); q.fill(); } });
    edge.position.set(W / 2, 0.012, -D / 2 + 0.3); edge.rotation.x = -PI / 2; g.add(edge);
    // turnstiles that count you
    let counted = 0;
    for (const tz of [-1.4, 0.2, 1.8]) { const tg = c.glb('turnstile', { h: 1.05, x: 3.4, z: tz, ry: 0, parent: g }); c.post(X(3.4), tz, 0.3); }
    let was = 0; c.tick((t, dt, P) => { const inside = P.x > X(3.0) && P.x < X(3.8) && P.z > -2.2 && P.z < 2.6 ? 1 : 0; if (inside && !was) { counted++; c.sound.turnstile(); c.toast(counted === 1 ? '+1. You have been counted. Welcome back.' : `+1. Counted ${counted} times. That is ${counted - 1} too many.`); c.egg('turnstile'); } was = inside; });
    // pizza rat on patrol at the foot of the north wall
    const rat = c.glb('rat', { len: 0.42, x: 2, z: -7.5, parent: g, onload: (o) => c.clickable(o, () => { c.sound.squeak(); c.say(o, 'Pizza Rat has been counted. Pizza Rat declines.', 2600, 0.6); c.egg('rat'); }, 'Pizza Rat') });
    let rx = 2, dir = 1, pause = 0;
    c.tick((t, dt) => { if (pause > 0) { pause -= dt; return; } rx += dir * dt * 2.6; if (rx > 18 || rx < 2) { dir *= -1; pause = 1 + Math.random() * 3; } rat.position.x = rx; rat.rotation.y = dir > 0 ? PI / 2 : -PI / 2; rat.position.y = Math.abs(Math.sin(t * 22)) * 0.02; });
    // the train: lights come up the tunnel in the photograph, then the car tears past the opening
    const lamps = new THREE.Group(), lampMat = new THREE.SpriteMaterial({ map: glowTex(c, '#fff6d0'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    for (const sx of [-0.55, 0.55]) { const s = new THREE.Sprite(lampMat); s.position.x = sx; lamps.add(s); } g.add(lamps); lamps.visible = false;
    const car = c.glb('h_subway_car', { len: 16, x: -30, z: -D / 2 - 2.2, ry: PI / 2, parent: g }); car.visible = false;
    const flash = document.querySelector('#flash'); let T = 8;
    c.tick((t, dt, P, ri) => {
      T -= dt; if (ri !== r.i) { lamps.visible = car.visible = false; return; }
      if (T < 9 && T > 1) { const k = 1 - (T - 1) / 8; lamps.visible = true; const z = -D / 2 - 60 * (1 - k) - 1; lamps.position.set(W / 2, 1.2, z); lamps.children.forEach((s) => s.scale.setScalar(0.4 + k * 2.2)); lampMat.opacity = 0.3 + k * 0.7; if (k > 0.5) c.shake(0.004 * k); }
      else lamps.visible = false;
      if (T <= 1 && T > -1.2) { car.visible = true; car.position.x = W / 2 + (1 - T) * 22 - 22; c.shake(0.03); if (flash) flash.style.opacity = T > 0.6 ? 0.35 : 0; }
      else car.visible = false;
      if (T <= 1 && T + dt > 1) { c.sound.whoosh(1, 2.6); c.egg('train'); }
      if (T < -1.2) T = 24 + Math.random() * 10;
    });
    windows(c, g, r, true);
  },
  archive(c, r, g, X) {
    const { THREE } = c;
    // cabinets up both side walls, every drawer an era
    const cab = drawerTex(c);
    for (const cx of [0.55, W - 0.55]) for (let z = -6.6; z < 1.6; z += 1.0) { const m = c.slab(0.9, 2.2, 0.98, new THREE.MeshStandardMaterial({ map: cab, color: 0x7d8a5a, metalness: 0.5, roughness: 0.5 }), cx, 1.1, z); g.add(m); }
    c.wall(X(1), -7.2, X(1), 1.9); c.wall(X(W - 1), -7.2, X(W - 1), 1.9);
    // the desk and the stamp
    const oak = c.surf('planks', 1.2, 0x6b4423);
    g.add(c.slab(3.6, 0.08, 1.6, oak, 10, 0.86, 2.4)); for (const [lx, lz] of [[8.4, 1.8], [11.6, 1.8], [8.4, 3], [11.6, 3]]) g.add(c.slab(0.1, 0.84, 0.1, oak, lx, 0.42, lz)); c.post(X(9.2), 2.4, 1.0); c.post(X(10.8), 2.4, 1.0);
    let stamped = 0;
    const paper = c.canvasTex(512, 360, (q, w, h) => { q.fillStyle = '#efe6cf'; q.fillRect(0, 0, w, h); q.fillStyle = '#333'; q.font = `600 22px ${c.MONO}`; q.fillText('N3W YORKERS CENSUS FORM', 24, 40); for (let i = 0; i < 7; i++) q.fillRect(24, 70 + i * 36, w - 48, 1); });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.63), new THREE.MeshStandardMaterial({ map: paper, roughness: 0.9 })); sheet.rotation.x = -PI / 2; sheet.position.set(10.9, 0.905, 2.5); g.add(sheet);
    const stamp = c.glb('stamp', { h: 1.5, x: 9.3, z: 2.4, y: 0.9, parent: g, onload: (o) => c.clickable(o, () => {
      if (stamp.userData.busy) return; stamp.userData.busy = 1; const x0 = stamp.position.x; let k = 0;
      const iv = setInterval(() => { k++; stamp.position.y = 0.9 + Math.sin(Math.min(1, k / 10) * PI) * 0.9; stamp.position.x = x0 + Math.min(1, k / 10) * 1.6; if (k === 10) { stamp.position.y = 0.9; c.sound.thud(0.9); c.shake(0.06); stamped++; const q = paper.userData.canvas.getContext('2d'); q.save(); q.translate(140 + Math.random() * 240, 120 + Math.random() * 160); q.rotate((Math.random() - 0.5) * 0.6); q.strokeStyle = q.fillStyle = 'rgba(200,20,40,.85)'; q.lineWidth = 6; q.strokeRect(-120, -34, 240, 68); q.font = `900 40px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(stamped % 3 ? 'UNCOUNTED' : 'COUNTED?', 0, 2); q.restore(); paper.needsUpdate = true; c.toast(stamped === 1 ? 'Stamped. Somewhere a New Yorker feels it.' : `Stamped ${stamped} times. The Department thanks you.`); c.egg('stamp'); } if (k > 10 && k < 22) { stamp.position.x = x0 + (1 - (k - 10) / 12) * 1.6; } if (k >= 22) { stamp.position.x = x0; clearInterval(iv); stamp.userData.busy = 0; } }, 30);
    }, 'The stamp') });
    // banker's lamps
    for (const lx of [8.6, 11.4]) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x2bd46a, toneMapped: false, side: 2 })); sh.position.set(lx, 1.32, 3.0); g.add(sh); g.add(c.slab(0.03, 0.4, 0.03, new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 1, roughness: 0.3 }), lx, 1.1, 3.0)); }
    // the census taker, pacing, judging
    const taker = c.glb('taker', { h: 1.76, x: 4, z: -3, parent: g, onload: (o) => c.clickable(o, () => { const L = ['Name? Borough? Era?', 'You are not on my list. Nobody is on my list.', 'I have been counting since 1790.', 'Four strokes and a slash. Every time.', 'Are you a New Yorker or just visiting? Both count. Neither counts.']; c.say(o, L[(Math.random() * L.length) | 0], 3000, 2.05); c.egg('taker'); }, 'The census taker') });
    const path = [[4, -3], [16, -3], [15, 0.6], [5, 0.6]]; let pi = 0, wait = 0, lastSay = 0;
    c.tick((t, dt, P) => {
      if (wait > 0) { wait -= dt; return; }
      const [tx, tz] = path[pi], dx = tx - taker.position.x, dz = tz - taker.position.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { pi = (pi + 1) % path.length; wait = 1.5; return; }
      taker.position.x += dx / d * dt * 0.9; taker.position.z += dz / d * dt * 0.9; taker.rotation.y = Math.atan2(dx, dz); taker.position.y = Math.abs(Math.sin(t * 6)) * 0.03;
      const pd = Math.hypot(P.x - X(taker.position.x), P.z - taker.position.z);
      if (pd < 2.4 && t - lastSay > 7) { lastSay = t; c.say(taker, ['Sir. SIR. You were not counted.', 'Clipboard says no.', 'Please stand still, I am counting.'][(t | 0) % 3], 2600, 2.05); }
    });
    // census cards drifting down from the vault
    falling(c, g, r, 0xf0e6cc, 40);
  },
  alley(c, r, g, X) {
    const { THREE } = c;
    // neon, all of it ours
    [['EYE FLOWER NOODLES', '#ff3a6a', 1.6, 4.4, -2], ['TALLY 24 HRS', '#22d3ee', 18.4, 4.0, 1], ['NAZAR CHECK CASHING', '#f5c542', 1.6, 3.4, 3.5], ['N3W YORKERS', '#ff4fa3', 18.4, 5.2, -4]].forEach(([s, col, x, y, z]) => { const n = neon(c, s, 3.2, 0.5, col); n.position.set(x < 10 ? 0.2 : W - 0.2, y, z); n.rotation.y = x < 10 ? PI / 2 : -PI / 2; g.add(n); });
    // lanterns with eyes
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#e8202a'; q.fillRect(0, 0, w, h); eyeFlower(q, w * 0.25, h / 2, 40, '#ffe0e8', '#ffb000'); eyeFlower(q, w * 0.75, h / 2, 40, '#ffe0e8', '#ffb000'); }), toneMapped: false })); l.scale.y = 1.25; l.position.set(2 + i * 2.66, 4.6 + Math.sin(i) * 0.2, -6.2 + (i % 2) * 1.2); g.add(l); c.tick((t) => { l.rotation.y = t * 0.3 + i; l.position.y = 4.6 + Math.sin(t * 0.9 + i) * 0.06; }); }
    // crates of MLow FARMS produce
    const crate = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#9b7444'; q.fillRect(0, 0, w, h); q.fillStyle = '#6b4c28'; for (let i = 0; i < 5; i++) q.fillRect(0, i * 52, w, 6); q.fillStyle = '#1b1b1b'; q.font = `800 30px ${c.FONT}`; q.textAlign = 'center'; q.fillText('MLow FARMS', w / 2, 120); q.font = `600 18px ${c.MONO}`; q.fillText('GROWN UNCOUNTED', w / 2, 152); });
    const cm = new THREE.MeshStandardMaterial({ map: crate, roughness: 0.85 });
    for (let i = 0; i < 14; i++) { const x = i < 7 ? 1.2 + (i % 3) * 0.7 : W - 1.2 - (i % 3) * 0.7, z = -6.8 + ((i / 3) | 0) % 3 * 0.8, y = 0.25 + (i % 2) * 0.5; g.add(c.slab(0.64, 0.48, 0.48, cm, x, y, z)); }
    c.wall(X(2.8), -7.2, X(2.8), -4.6); c.wall(X(W - 2.8), -7.2, X(W - 2.8), -4.6);
    // three card monte. Nobody picks. Not even MLow.
    const table = c.glb('monte', { h: 0.95, x: 10, z: 0.6, parent: g, onload: (o) => c.clickable(o, () => monte(c, g, table), 'Three card monte') });
    c.post(X(10), 0.6, 0.75);
    // puddles that hold the neon
    for (const [x, z, s] of [[7, -3, 1.6], [13, 2, 1.2], [4, 4, 1]]) { const p = new THREE.Mesh(new THREE.CircleGeometry(s, 32), new THREE.MeshStandardMaterial({ color: 0x0a1418, metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.45, depthWrite: false })); p.rotation.x = -PI / 2; p.position.set(x, 0.006, z); p.scale.y = 0.6; g.add(p); }
    steam(c, g, 16.5, 0, -2.5); dripsFall(c, g, r);
    windows(c, g, r);
  },
  theater(c, r, g, X) {
    const { THREE } = c;
    // a gilt proscenium round the portal, the marquee over it
    const gilt = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 1, roughness: 0.3 });
    g.add(c.slab(0.5, PORTAL.h + 0.5, 0.5, gilt, W / 2 - PORTAL.w / 2 - 0.25, (PORTAL.h + 0.5) / 2, -D / 2 + 0.1)); g.add(c.slab(0.5, PORTAL.h + 0.5, 0.5, gilt, W / 2 + PORTAL.w / 2 + 0.25, (PORTAL.h + 0.5) / 2, -D / 2 + 0.1)); g.add(c.slab(PORTAL.w + 1, 0.5, 0.5, gilt, W / 2, PORTAL.h + 0.25, -D / 2 + 0.1));
    const mq = c.sign('THE MARKS\nNINE ERA CLOSERS · ONE NIGHT ONLY', { w: 7, h: 1.1, bg: '#140806', fg: '#ffe9b0', glow: 18, border: '#f5c542', font: c.SERIF });
    mq.position.set(W / 2, PORTAL.h + 1.0, -D / 2 + 0.38); g.add(mq);
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), 60);
    for (let i = 0; i < 60; i++) { const k = i / 60, pr = 2 * (7.3 + 1.3); let d = k * pr, x, y; if (d < 7.3) { x = -3.65 + d; y = 0.62; } else if ((d -= 7.3) < 1.3) { x = 3.65; y = 0.62 - d; } else if ((d -= 1.3) < 7.3) { x = 3.65 - d; y = -0.68; } else { d -= 7.3; x = -3.65; y = -0.68 + d; } bulbs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(W / 2 + x, PORTAL.h + 1.0 + y, -D / 2 + 0.42)); bulbs.setColorAt(i, new THREE.Color(0xffd27a)); }
    g.add(bulbs); const bc = new THREE.Color();
    c.tick((t) => { for (let i = 0; i < 60; i++) bulbs.setColorAt(i, bc.set(((i + (t * 12 | 0)) % 4) ? 0xffd27a : 0x3a2808)); bulbs.instanceColor.needsUpdate = true; });
    // curtains, gathered
    for (const side of [-1, 1]) { const cg = new THREE.PlaneGeometry(2.2, H_IN, 40, 1), p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.12); cg.computeVertexNormals(); const cu = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0x8a0f1c, roughness: 0.75, side: 2 })); cu.position.set(W / 2 + side * (PORTAL.w / 2 + 1.5), H_IN / 2, -D / 2 + 0.6); g.add(cu); }
    // footlights
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a0, toneMapped: false })); b.position.set(W / 2 - PORTAL.w / 2 + 0.3 + i * (PORTAL.w - 0.6) / 13, 0.06, -D / 2 + 0.3); g.add(b); }
    // the mark on the stage: stand on it
    const x = decal(c, 0.8, 0.8, (q, w, h) => { q.strokeStyle = '#f5c542'; q.lineWidth = 26; q.beginPath(); q.moveTo(30, 30); q.lineTo(w - 30, h - 30); q.moveTo(w - 30, 30); q.lineTo(30, h - 30); q.stroke(); });
    x.rotation.x = -PI / 2; x.position.set(W / 2, 0.012, -3.4); g.add(x);
    const spot = new THREE.SpotLight(0xfff2d8, 0, 14, 0.22, 0.5, 1.2); spot.position.set(W / 2, H_IN - 0.2, 2); spot.target.position.set(W / 2, 0, -3.4); g.add(spot, spot.target);
    let on = 0, lastClap = -99;
    c.tick((t, dt, P) => { const here = Math.hypot(P.x - X(W / 2), P.z + 3.4) < 0.7; spot.intensity += ((here ? 220 : 0) - spot.intensity) * dt * 4; if (here && !on && t - lastClap > 8) { lastClap = t; c.sound.applause(5); c.toast('Break a leg. The house is full of nobody, and they love you.'); c.egg('stage'); } on = here; });
    windows(c, g, r, true);
  },
  roof(c, r, g, X) {
    const { THREE } = c;
    // clothesline poles and the lines the Marks hang from
    const wood = new THREE.MeshStandardMaterial({ color: 0x4b3a2a, roughness: 0.9 });
    for (const z of [-2.2, 1.6, 5.2]) { for (const x of [1.4, 18.6]) { g.add(c.slab(0.12, 2.6, 0.12, wood, x, 1.3, z)); c.post(X(x), z, 0.2); } const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 17.2), new THREE.MeshBasicMaterial({ color: 0xdedede })); line.rotation.z = PI / 2; line.position.set(10, 2.42, z); g.add(line); }
    r.marks.forEach((m, i) => { const grp = m.group; if (!grp) return; const ph = i * 0.7; c.tick((t) => { grp.rotation.x = Math.sin(t * 1.6 + ph) * 0.12 + 0.05; grp.rotation.z = Math.sin(t * 1.1 + ph) * 0.03; }); grp.position.y = 1.85; });
    // string lights
    for (let i = 0; i < 40; i++) { const k = i / 39, b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: INK[i % 3], toneMapped: false })); b.position.set(1.4 + k * 17.2, 3.4 - Math.sin(k * PI) * 0.6, 7.2); g.add(b); }
    const tower = c.glb('tower', { h: 7.4, x: 16.4, z: -5.2, parent: g, onload: (o) => c.clickable(o, () => { c.say(o, 'Out of order since 1987. Somebody counted it anyway.', 3000, 7.6); c.egg('tower'); }, 'The water tower') });
    c.post(X(16.4), -5.2, 1.8);
    // the seal: break it, the night ends, the drop begins
    const plinth = c.slab(1.4, 1.0, 1.4, c.surf('marble', 1.2), 9, 0.5, -2.9); g.add(plinth); c.post(X(9), -2.9, 1.0);
    let hits = 0, broken = false;
    const seal = c.glb('seal', { len: 1.5, x: 9, y: 1.0, z: -2.9, parent: g, onload: (o) => { c.clickable(o, () => {
      if (broken) return; hits++; c.sound.crack(); c.shake(0.02 * hits); seal.scale.setScalar(1 + hits * 0.04);
      if (hits < 3) { c.toast(['It cracks. Again.', 'One more.'][hits - 1]); return; }
      broken = true; burst(c, g, r, 9, 1.6, -2.9, 260); seal.visible = false; c.sound.boom(0.8); c.egg('seal');
      setTimeout(() => document.querySelector('#finale').classList.add('on'), 1400);
    }, 'Break the seal'); } });
    c.tick((t) => { if (!broken) { seal.rotation.y = Math.sin(t * 0.6) * 0.3; seal.position.y = 1.0 + Math.sin(t * 1.4) * 0.04; } });
    // fireworks over the skyline, eye flowers in pink, cyan and gold
    let F = 2; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; F -= dt; if (F < 0) { F = 1.5 + Math.random() * 2.5; burst(c, g, r, 10 + (Math.random() - 0.5) * 30, 16 + Math.random() * 10, -D / 2 - 40 - Math.random() * 30, 140, true); c.sound.boom(0.2); } });
    pigeons(c, g, r, X, 5, [3, 15, -1, 6]);
  },
};

// ---------- props and systems ----------
function gondola(c, g, x, z1, z2, n) {
  const { THREE } = c;
  const steel = new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.6, roughness: 0.4 }), len = z2 - z1, zc = (z1 + z2) / 2;
  g.add(c.slab(0.12, 1.9, len, steel, x, 0.95, zc));
  for (const y of [0.12, 0.55, 0.98, 1.41, 1.84]) for (const s of [-1, 1]) g.add(c.slab(0.5, 0.03, len, steel, x + s * 0.3, y, zc));
  // products: bags, cans, boxes, every one an MLow brand
  const labels = BRANDS.map((b, i) => c.canvasTex(128, 192, (q, w, h) => { q.fillStyle = INK[i % INK.length]; q.fillRect(0, 0, w, h); q.fillStyle = i % 2 ? '#0b1020' : '#ffffff'; q.font = `900 ${b.length > 9 ? 15 : 19}px ${c.FONT}`; q.textAlign = 'center'; q.fillText(b, w / 2, 34); eyeFlower(q, w / 2, h * 0.58, 34); drips(q, w, 30, 4, 0); }));
  const mats = labels.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.15 }));
  const geo = new THREE.BoxGeometry(0.2, 0.3, 0.08);
  mats.forEach((m, k) => {
    const im = new THREE.InstancedMesh(geo, m, 80); let i = 0; const M = new THREE.Matrix4(), Qt = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3(), E = new THREE.Euler();
    for (const y of [0.29, 0.72, 1.15, 1.58]) for (const s of [-1, 1]) for (let zz = z1 + 0.2; zz < z2 - 0.1; zz += 0.24) {
      if (((zz * 7 + y * 13 + s * 5) * 1000 | 0) % mats.length !== k || i >= 80) continue;
      E.set((Math.random() - 0.5) * 0.1, s > 0 ? PI / 2 : -PI / 2, (Math.random() - 0.5) * 0.1); Qt.setFromEuler(E); V.set(x + s * 0.34, y, zz); S.setScalar(0.85 + Math.random() * 0.3); M.compose(V, Qt, S); im.setMatrixAt(i++, M);
    }
    im.count = i; g.add(im);
  });
  // shelf talkers
  for (const s of [-1, 1]) { const st = decal(c, len - 0.2, 0.12, (q, w, h) => { q.fillStyle = '#f5c542'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `800 ${h * 0.6}px ${c.MONO}`; for (let x = 10; x < w; x += 330) q.fillText('2 FOR 1 TALLY · EYE CRUNCH', x, h * 0.72); }); st.position.set(x + s * 0.56, 0.5, zc); st.rotation.y = s > 0 ? PI / 2 : -PI / 2; g.add(st); }
}
function drawerTex(c) {
  const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX'];
  return c.canvasTex(256, 512, (q, w, h) => {
    q.fillStyle = '#7a865a'; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const y = i * h / 4; q.strokeStyle = '#3d4530'; q.lineWidth = 6; q.strokeRect(10, y + 10, w - 20, h / 4 - 20); q.fillStyle = '#efe6cf'; q.fillRect(w / 2 - 50, y + 30, 100, 36); q.fillStyle = '#222'; q.font = `700 20px ${c.MONO}`; q.textAlign = 'center'; q.fillText('ERA ' + ROM[(Math.random() * 19) | 0], w / 2, y + 55); q.fillStyle = '#c9a227'; q.fillRect(w / 2 - 34, y + 84, 68, 12); }
  });
}
function glowTex(c, col) { return c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }

function taxi(c, g, x, z, ry, X) {
  const { THREE } = c;
  const cab = c.glb('h_taxi', { len: 4.9, x, z, ry, parent: g, onload: (o) => {
    const b = new THREE.Box3().setFromObject(o), top = b.max.y - cab.position.y;
    const tex = c.tex.load('assets/env/topper.jpg'); tex.colorSpace = THREE.SRGBColorSpace; tex.repeat.set(1, 0.5); tex.offset.set(0, 0.5);
    const tb = new THREE.Group(); tb.position.y = top + 0.2;
    tb.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 0.16), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.35 })));
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.31), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); p.position.z = s * 0.081; if (s < 0) p.rotation.y = PI; tb.add(p); }
    cab.add(tb);
    c.clickable(cab, () => { c.sound.horn(0.35); c.say(cab, ["I'M WALKIN' HERE.", 'Where to? Every Mark is on the meter.', 'Off duty. Unless you are a Mark.'][(Math.random() * 3) | 0], 2600, 2.2); c.egg('taxi'); }, 'The MLow cab');
  } });
  c.post(X(x), z, 1.2); c.post(X(x) + Math.sin(ry) * 1.6, z + Math.cos(ry) * 1.6, 1.0); c.post(X(x) - Math.sin(ry) * 1.6, z - Math.cos(ry) * 1.6, 1.0);
}
function pigeons(c, g, r, X, n, [x1, x2, z1, z2]) {
  const birds = [];
  for (let i = 0; i < n; i++) { const b = c.glb('pigeon', { h: 0.3, x: x1 + Math.random() * (x2 - x1), z: z1 + Math.random() * (z2 - z1), ry: Math.random() * 6, parent: g, onload: (o) => c.clickable(o, () => { c.sound.coo(); c.say(o, ['Coo. I demand a recount.', 'This is my avenue.', 'Coo.'][i % 3], 2200, 0.5); c.egg('pigeon'); }, 'A pigeon') }); b.userData = { vy: 0, fly: 0, home: [b.position.x, b.position.z], peck: Math.random() * 6 }; birds.push(b); }
  c.tick((t, dt, P, ri) => {
    if (Math.abs(ri - r.i) > 1) return;
    for (const b of birds) {
      const u = b.userData, d = Math.hypot(P.x - X(b.position.x), P.z - b.position.z);
      if (!u.fly && d < 1.8) { u.fly = 1; u.vy = 3; c.sound.coo(); }
      if (u.fly) { b.position.y += u.vy * dt; u.vy += 1.2 * dt; b.position.x += Math.sin(b.rotation.y) * dt * 3; b.position.z += Math.cos(b.rotation.y) * dt * 3; b.rotation.z = Math.sin(t * 40) * 0.3; if (b.position.y > 14) { u.fly = 0; b.position.set(u.home[0], 0, u.home[1]); b.rotation.z = 0; } }
      else { u.peck += dt; b.rotation.x = Math.sin(u.peck * 6) > 0.7 ? 0.5 : 0; if ((t * 0.5 + u.home[0]) % 5 < dt) b.rotation.y += (Math.random() - 0.5) * 2; }
    }
  });
}
function spray(c, g, x, y, z, X, r) {
  const { THREE } = c, N = 500, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, color: 0xcfe8ff, transparent: true, opacity: 0.75, depthWrite: false })); g.add(pts); pts.frustumCulled = false;
  let wet = 0;
  c.tick((t, dt, P, ri) => {
    if (Math.abs(ri - r.i) > 1) return;
    for (let i = 0; i < N; i++) {
      if ((life[i] -= dt) <= 0) { life[i] = 0.8 + Math.random() * 0.6; pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = -4 - Math.random() * 1.5; vel[i * 3 + 1] = 2 + Math.random() * 1.5; vel[i * 3 + 2] = (Math.random() - 0.5) * 1.2; }
      vel[i * 3 + 1] -= 9.8 * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] = Math.max(0.01, pos[i * 3 + 1] + vel[i * 3 + 1] * dt); pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    geo.attributes.position.needsUpdate = true;
    const inSpray = P.x > X(x - 5) && P.x < X(x) && Math.abs(P.z - z) < 1.2;
    const el = document.querySelector('#wet'); if (el) el.style.opacity = Math.max(0, (wet = Math.max(0, wet + (inSpray ? dt * 2 : -dt * 0.4)) && Math.min(1, wet)) * 0.9);
    if (inSpray && wet > 0.3 && !g.userData.soaked) { g.userData.soaked = 1; c.egg('hydrant', 'You got hydranted. It counts as a bath.'); }
  });
}
function steam(c, g, x, y, z) {
  const { THREE } = c, m = new THREE.SpriteMaterial({ map: c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(230,235,245,.55)'); gr.addColorStop(1, 'rgba(230,235,245,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false });
  const ps = []; for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(m.clone()); s.userData.k = i / 18; g.add(s); ps.push(s); }
  c.tick((t) => { for (const s of ps) { const k = (s.userData.k + t * 0.12) % 1; s.position.set(x + Math.sin(k * 9 + t) * 0.3 * k, y + k * 4, z + Math.cos(k * 7) * 0.2 * k); s.scale.setScalar(0.6 + k * 2.6); s.material.opacity = Math.sin(k * PI) * 0.5; } });
}
function falling(c, g, r, col, n) {
  const { THREE } = c, ps = [], m = new THREE.MeshStandardMaterial({ color: col, side: 2, roughness: 0.9 });
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.13), m); p.userData = { x: 2 + Math.random() * 16, z: -7 + Math.random() * 13, k: Math.random(), s: 0.3 + Math.random() * 0.5 }; g.add(p); ps.push(p); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (const p of ps) { const u = p.userData; u.k = (u.k + dt * u.s * 0.12) % 1; p.position.set(u.x + Math.sin(t * u.s * 3 + u.x) * 0.5, H_IN - u.k * H_IN, u.z + Math.cos(t * u.s * 2) * 0.4); p.rotation.set(t * u.s * 2, t * u.s, t * u.s * 1.5); } });
}
function dripsFall(c, g, r) {
  const { THREE } = c, ps = []; for (let i = 0; i < 24; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: [0x9fd8ff, 0xff4fa3, 0x22d3ee][i % 3] })); d.userData = { x: Math.random() < 0.5 ? 0.6 : W - 0.6, z: -6 + Math.random() * 12, k: Math.random(), s: 0.6 + Math.random() }; g.add(d); ps.push(d); }
  c.tick((t, dt) => { for (const d of ps) { const u = d.userData; u.k = (u.k + dt * u.s * 0.6) % 1; d.position.set(u.x, 4.2 - u.k * u.k * 4.2, u.z); } });
}
function windows(c, g, r, inside) {
  if (!r.outdoor) return;
  const { THREE } = c;
  const tx = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#1a1210'; q.fillRect(0, 0, w, h); for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) { const lit = Math.random() < 0.45; q.fillStyle = lit ? ['#ffcf7a', '#ffe7b0', '#9fd8ff', '#ff9ec8'][(x + y) % 4] : '#0b0d12'; q.fillRect(x * 85 + 18, y * 100 + 20, 50, 66); if (lit && Math.random() < 0.3) eyeFlower(q, x * 85 + 43, y * 100 + 52, 18); } });
  for (const [x, ry] of [[0.2, PI / 2], [W - 0.2, -PI / 2]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(D - 1, 5.4), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); p.material.color.setScalar(0.85); p.position.set(x, 6.6, 0); p.rotation.y = ry; if (!r.low) g.add(p); }
}
function burst(c, g, r, x, y, z, n, sky) {
  const { THREE } = c, pos = new Float32Array(n * 3), vel = [], cols = new Float32Array(n * 3), col = new THREE.Color();
  const pal = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff];
  for (let i = 0; i < n; i++) { const a = Math.random() * PI * 2, b = Math.acos(Math.random() * 2 - 1), s = (sky ? 6 : 3.5) * (0.6 + Math.random() * 0.4) * (i % 8 < 4 ? 1 : 0.55); vel.push([Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s * (sky ? 1 : 0.6) + (sky ? 0 : 2), Math.sin(b) * Math.sin(a) * s]); pos.set([x, y, z], i * 3); col.set(i % 8 < 4 ? pal[(i >> 3) % 3] : 0x1d4ed8); cols.set([col.r, col.g, col.b], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.PointsMaterial({ size: sky ? 0.5 : 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
  const pts = new THREE.Points(geo, m); pts.frustumCulled = false; g.add(pts); let life = 0;
  const f = (t, dt) => { if (!pts.parent) return; life += dt; for (let i = 0; i < n; i++) { vel[i][1] -= (sky ? 2 : 6) * dt; vel[i][0] *= 0.985; vel[i][2] *= 0.985; pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] += vel[i][1] * dt; pos[i * 3 + 2] += vel[i][2] * dt; } geo.attributes.position.needsUpdate = true; m.opacity = Math.max(0, 1 - life / 2.4); if (life > 2.5) { g.remove(pts); geo.dispose(); m.dispose(); } };
  c.tick(f);
}
function monte(c, g, table) {
  const { THREE } = c;
  if (g.userData.monte) return; g.userData.monte = 1;
  const all = window.MARKS.u, pick = all[(Math.random() * all.length) | 0];
  const back = c.canvasTex(180, 256, (q, w, h) => { q.fillStyle = '#0b1020'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); eyeFlower(q, w / 2, h / 2, 60); });
  const cards = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.31), new THREE.MeshStandardMaterial({ map: back, side: 2 })); m.rotation.x = -PI / 2; m.position.set(table.position.x - 0.3 + i * 0.3, 0.99, table.position.z); g.add(m); return m; });
  c.toast('Watch the card. Nobody picks. Not even MLow.');
  let k = 0; const iv = setInterval(() => {
    const a = (Math.random() * 3) | 0, b = (a + 1 + ((Math.random() * 2) | 0)) % 3, xa = cards[a].position.x; cards[a].position.x = cards[b].position.x; cards[b].position.x = xa; c.sound.tick();
    if (++k > 14) { clearInterval(iv); c.toast('Pick one.');
      cards.forEach((cd) => { cd.userData.hint = 'This one'; cd.userData.click = () => {
        const face = c.tex.load(`assets/art/th/${pick.c}.jpg`); face.colorSpace = THREE.SRGBColorSpace; cd.material = new THREE.MeshBasicMaterial({ map: face, side: 2, toneMapped: false }); cd.scale.set(1.6, 1, 0.9); cd.position.y += 0.02;
        c.toast(`You got No. ${pick.c}, ${pick.t}. You did not pick it. Nobody did.`, 4200); c.egg('monte');
        setTimeout(() => { c.openMark(pick); cards.forEach((q) => g.remove(q)); g.userData.monte = 0; }, 1600);
        cards.forEach((q) => { q.userData.click = null; });
      }; });
      window.__clickables && cards.forEach((cd) => window.__clickables.push(cd));
    }
  }, 160);
}
