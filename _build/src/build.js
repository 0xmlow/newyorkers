// The sets, one by one. Every sign, label and product is a NEW YORKERS brand, and every member of the
// cast has an eye flower for a head: the scenes are the films', the people are ours.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';

const PI = Math.PI;
const INK = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;

export function buildRoom(c, r) {
  const { THREE, scene } = c;
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN;

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if (r.ceil && !r.outdoor) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, H_IN + 0.05, 0));

  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
  g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) g.add(c.slab(pw, H_IN - PORTAL.h, 0.24, mats.wall, W / 2, PORTAL.h + (H_IN - PORTAL.h) / 2, -D / 2 - 0.12));
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
  if (r.last) sideWall(W, false);
  else sideWall(W - 0.25, true);   // the room's own face on the shared wall, so the next set's wallpaper does not show through
  const ds = { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' };
  if (r.i > 0) { const s = c.sign(`< ${r.prev}`, ds); s.position.set(0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  c.plate(r);

  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, r.frame, g); });

  slate(c, r, g);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);   // an unmarked edge, so nobody walks into the photograph
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing(c, r, g, X);
}

// ---------- surfaces ----------
function matsFor(c, r) {
  const { THREE } = c;
  const m = {};
  if (r.floor === 'carpet') { const t = carpetTex(c); t.repeat.set(5, 4); m.floor = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, color: r.floorTint || 0xffffff }); m.floor.userData.rep = 4; }
  else m.floor = c.surf(r.floor, r.floor === 'asphalt' ? 3 : r.floor === 'planks' ? 2.2 : 2.2, r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, 0x5a5650) : null;
  if ((window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else if (r.outdoor) m.wall = c.surf('brick', 2.4, 0x6e6660);
  else m.wall = c.surf(r.wall, 2.4, r.wallTint);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.3; m.floor.metalness = 0.3; }
  return m;
}
function carpetTex(c) {
  const t = c.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6e0b16'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a033'; g.lineWidth = 6;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const cx = x * 256 + 128, cy = y * 256 + 128;
      g.beginPath(); g.moveTo(cx, cy - 90); g.lineTo(cx + 90, cy); g.lineTo(cx, cy + 90); g.lineTo(cx - 90, cy); g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.stroke();
      g.fillStyle = '#1d4ed8'; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
    }
    g.globalAlpha = 0.08; for (let i = 0; i < 3000; i++) { g.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  t.wrapS = t.wrapT = 1000; return t;
}

export function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, Math.PI * 2); g.fill();
}
function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
function glowTex(c, col) { return c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });

// a row of bulbs that chase, for marquees
function bulbs(c, g, x1, x2, y, z, n, col = 0xffe0a0) {
  const { THREE } = c, ms = [], on = basic(c, col), off = std(c, 0x3a3020, { roughness: 0.4 });
  const geo = new THREE.SphereGeometry(0.06, 10, 8);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, on); m.position.set(x1 + (x2 - x1) * i / (n - 1), y, z); g.add(m); ms.push(m); }
  c.tick((t) => { const k = (t * 8) | 0; ms.forEach((m, i) => { m.material = (i + k) % 3 === 0 ? off : on; }); });
}
// an eye that watches you: a white disc, and an iris that slides toward the camera
function watcher(c, g, x, y, z, ry, R = 0.5) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const petals = decal(c, R * 3.2, R * 3.2, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.98));
  o.add(petals);
  const white = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 32), basic(c, 0xf4f4f4)); white.position.z = 0.01; o.add(white);
  const iris = new THREE.Group(); iris.position.z = 0.02; o.add(iris);
  const ir = new THREE.Mesh(new THREE.CircleGeometry(R * 0.32, 32), basic(c, 0x1d4ed8)); iris.add(ir);
  const pu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.15, 24), basic(c, 0x0b1020)); pu.position.z = 0.005; iris.add(pu);
  const v = new THREE.Vector3(), inv = new THREE.Matrix4();
  c.tick(() => { v.copy(c.camera.position); o.updateMatrixWorld(); inv.copy(o.matrixWorld).invert(); v.applyMatrix4(inv); const L = Math.hypot(v.x, v.y, v.z) || 1; iris.position.x = v.x / L * R * 0.3; iris.position.y = v.y / L * R * 0.3; });
  return o;
}
function flyer(c, text, bg = '#f4ead2') { return c.canvasTex(128, 160, (q, w, h) => { q.fillStyle = bg; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, 56, 40); q.fillStyle = '#111'; q.font = `800 22px ${c.FONT}`; q.textAlign = 'center'; q.fillText(text, w / 2, 130); }); }

// ---------- the slate: every set is a scene in the same picture ----------
function slate(c, r, g) {
  const { THREE } = c;
  const board = decal(c, 1.5, 1.25, (q, w, h) => {
    q.fillStyle = '#121212'; q.fillRect(0, h * 0.2, w, h * 0.8);
    for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#121212' : '#f4ead2'; q.beginPath(); q.moveTo(i * w / 8, 0); q.lineTo((i + 1) * w / 8, 0); q.lineTo((i + 1.5) * w / 8, h * 0.18); q.lineTo((i + 0.5) * w / 8, h * 0.18); q.fill(); }
    q.fillStyle = '#f4ead2'; q.font = `700 ${h * 0.07}px ${c.MONO}`; q.textAlign = 'left';
    q.fillText('ON LOCATION', w * 0.06, h * 0.32); q.fillText(`SCENE ${r.i + 1}`, w * 0.6, h * 0.32);
    q.font = `900 ${h * 0.1}px ${c.SERIF}`; const lines = (r.film || '').split(', ');
    q.fillText(lines[0].slice(0, 22), w * 0.06, h * 0.52); q.font = `600 ${h * 0.07}px ${c.MONO}`; q.fillText(lines[1] || '', w * 0.06, h * 0.64);
    q.fillText('DIRECTOR  MLow', w * 0.06, h * 0.8); q.fillText('TAKE 1', w * 0.6, h * 0.8);
    q.fillText('CAST  NEW YORKERS', w * 0.06, h * 0.92);
  }, 384);
  board.position.set(W / 2 - PORTAL.w / 2 - 1.2, r.low ? 1.1 : 1.7, -D / 2 + 0.03); if (r.low) { board.position.z = -D / 2 + 0.3; board.rotation.x = -0.35; }
  g.add(board);
}

// every set has its crew: the director's chair, a lamp on a stand, a boom
function dressing(c, r, g, X) {
  const { THREE } = c;
  const wood = std(c, 0x4a3018), canvas = std(c, 0x1b1b1b, { roughness: 0.9 });
  const ch = new THREE.Group(); ch.position.set(W - 2.2, 0, D / 2 - 1.6); ch.rotation.y = -2.4; g.add(ch);
  for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) ch.add(c.slab(0.04, 0.9, 0.04, wood, x, 0.45, z));
  ch.add(c.slab(0.56, 0.03, 0.42, canvas, 0, 0.6, 0));
  const back = c.sign('MLow', { w: 0.56, h: 0.22, bg: '#1b1b1b', fg: '#f5c542', font: c.SERIF, weight: 900 }); back.position.set(0, 1.0, -0.22); back.rotation.y = PI; ch.add(back);
  const back2 = back.clone(); back2.rotation.y = 0; back2.position.z = -0.21; ch.add(back2);
  c.post(X(W - 2.2), D / 2 - 1.6, 0.4);
  // the lamp
  const [lx, lz] = LAMP[r.id] || [1.4, -D / 2 + 1.4];
  const lp = new THREE.Group(); lp.position.set(lx, 0, lz); lp.rotation.y = Math.atan2(W / 2 - lx, 2 - lz); g.add(lp);
  const steel = std(c, 0x222222, { metalness: 0.8, roughness: 0.35 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.03, 1.5, 0.03, steel, Math.cos(a) * 0.3, 0.7, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); lp.add(l); }
  lp.add(c.slab(0.04, 1.6, 0.04, steel, 0, 2.1, 0));
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.45, 20), steel); head.rotation.x = PI / 2 - 0.25; head.position.set(0, 2.95, 0.05); lp.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), basic(c, 0xfff2d0)); lens.position.set(0, 3.0, 0.29); lens.rotation.x = -0.25; lp.add(lens);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,230,180,.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(1.6, 1.6, 1); halo.position.set(0, 3.0, 0.35); lp.add(halo);
  c.post(X(lx), lz, 0.4);
}
const LAMP = { copa: [6, -6.4], walking: [5, -6.4], taxi: [5.4, -6.8], big: [5.6, -6.8], itch: [4.6, -6.8], heat: [7.2, -6.8], natm: [6.2, -6.8], coney: [7, 4.4], stairs: [3.4, -6.4], kong: [3, 2] };

// a velvet rope across the set, a step in front of the photograph: plates are made to be seen from the room
function rope(c, r, g, X) {
  const { THREE } = c, z = -D / 2 + 1.25, x1 = (W - PORTAL.w) / 2 + 0.3, x2 = (W + PORTAL.w) / 2 - 0.3, n = 6;
  const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, 0x8a0f1e, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i < n) { const seg = (x2 - x1) / n, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + seg / 2, 0.62, z), new THREE.Vector3(x + seg, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
  }
  c.wall(X(x1), z, X(x2), z); c.wall(X(x1), z, X(x1), -D / 2); c.wall(X(x2), z, X(x2), -D / 2);
  const q = c.sign('QUIET ON SET', { w: 1.3, h: 0.22, bg: '#111', fg: '#ff3b3b', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
}

// ---------- the CC0 prop library (Poly Haven, CC0) ----------
// [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd }]. Names are Poly Haven ids, files ph_<id>.glb.
function prop(c, r, g, X, name, x, z, o = {}) {
  const m = c.glb('ph_' + name, { h: o.h, len: o.len, x, y: o.y || 0, z, ry: o.ry || 0, parent: g, shadow: !o.y });
  if (o.r) c.post(X(x), z, o.r);
  if (o.egg) c.clickable(m, () => { if (o.snd) c.sound[o.snd](); c.egg(o.egg[1], o.egg[2]); o.fn && o.fn(c); }, o.egg[0]);
  if (o.spin) c.tick((t) => { m.rotation.y = (o.ry || 0) + Math.sin(t * o.spin) * 0.3; });
  return m;
}
const PROPS = {
  lobby: [
    ['Chandelier_02', 4.6, 2.2, { h: 1.3, y: 4.6 }], ['Chandelier_02', 15.4, -0.6, { h: 1.3, y: 4.6 }],
    ['Sofa_01', 0.95, -4.2, { len: 2.1, ry: Math.PI / 2, r: 0.7 }], ['Ottoman_01', 2.4, -3.4, { h: 0.45, r: 0.35 }], ['potted_plant_02', 0.9, 6.9, { h: 1.4, r: 0.4 }], ['potted_plant_02', 19.1, 6.9, { h: 1.4, r: 0.4 }],
    ['WoodenTable_01', 6.6, -5.6, { len: 1.3, r: 0.6 }], ['filmstrip_projector_8mm', 6.6, -5.6, { h: 0.42, y: 0.78, ry: Math.PI, egg: ['The projector', 'projector', 'An 8mm projector, still warm. Somebody has been screening New Yorkers to New Yorkers.'], snd: 'tick' }],
    ['CashRegister_01', 18.2, -7.2, { h: 0.4, y: 1.05, ry: 0.4, egg: ['The till', 'till', 'Admission: one New Yorker. Change: none. Receipt: you, counted.'], snd: 'ticket' }],
    ['vintage_video_camera', 13.6, -5.8, { h: 0.6, y: 0.78, ry: -0.6 }], ['WoodenTable_01', 13.6, -5.8, { len: 1.3, r: 0.6 }],
  ],
  taxi: [
    ['ArmChair_01', 6.6, -3.6, { h: 1.0, ry: 0.6, r: 0.55 }], ['desk_lamp_arm_01', 2.0, -6.9, { h: 0.5, y: 0.9 }], ['alarm_clock_01', 3.2, -6.7, { h: 0.14, y: 0.9, ry: 0.4, egg: ['The clock', 'clock', 'Four in the morning. Cannot sleep. Might as well drive around and count people.'], snd: 'tick' }],
    ['cigarette_pack', 3.0, -6.95, { len: 0.09, y: 0.9 }], ['cassette_player', 18.6, -6.85, { len: 0.3, y: 0.0 }], ['cardboard_box_01', 19.1, 0.9, { h: 0.5, r: 0.35 }], ['cardboard_box_01', 19.0, 0.7, { h: 0.45, y: 0.5, ry: 0.6 }],
    ['WoodenChair_01', 12.6, 4.6, { h: 0.95, ry: Math.PI, r: 0.35 }], ['metal_trash_can', 8.4, -6.4, { h: 0.9, r: 0.35 }],
  ],
  big: [
    ['chess_set', 12.8, -4.6, { len: 2.3, r: 1.3, egg: ['A giant chess set', 'chess', 'Your move. Every pawn on this board is a New Yorker, which explains the shouting.'], snd: 'thud' }],
    ['vintage_grandfather_clock_01', 19.0, -6.9, { h: 3.4, r: 0.5 }], ['Ukulele_01', 15.6, -6.2, { len: 1.6, ry: 0.5 }], ['american_football', 6.2, 4.4, { len: 0.3 }], ['baseball_01', 7.4, 4.8, { len: 0.075 }],
    ['baseball_bat', 7.0, 5.0, { len: 0.85, ry: 1.1 }], ['Lantern_01', 2.3, -4.9, { h: 0.35, y: 0 }], ['alarm_clock_01', 5.0, -6.6, { h: 0.9, ry: 0.4, r: 0.5, egg: ['A very big alarm clock', 'bigclock', 'In this store even the alarm clock wished to be big.'], snd: 'ding' }],
  ],
  itch: [
    ['fire_hydrant', 14.6, -0.9, { h: 0.85, r: 0.3 }], ['metal_trash_can', 5.4, -0.8, { h: 0.95, r: 0.35 }], ['water_manhole_cover', 13.6, 3.0, { len: 0.85 }],
    ['WetFloorSign_01', 6.7, -2.6, { h: 0.62, ry: 0.4, egg: ['A wet floor sign', 'caution', 'CAUTION: UPDRAFT. Lexington Avenue accepts no responsibility for what the 6 train does to your hemline.'] }],
    ['wooden_crate_01', 15.4, -5.7, { h: 0.6, r: 0.45 }], ['Camera_01', 15.4, -5.7, { h: 0.2, y: 0.6, ry: 0.8 }], ['Megaphone_01', 4.8, -5.9, { len: 0.45, ry: 1.2 }], ['security_light', 19.8, 1.0, { h: 0.4, y: 4.2, ry: -Math.PI / 2 }],
  ],
  heat: [
    ['WoodenChair_01', 15.8, -5.2, { h: 0.95, ry: 2.6, r: 0.35 }], ['WoodenChair_01', 16.7, -4.2, { h: 0.95, ry: 2.2, r: 0.35 }],
    ['plastic_crate_01', 19.1, -3.0, { h: 0.32, r: 0.4 }], ['plastic_crate_01', 19.1, -3.0, { h: 0.32, y: 0.33, ry: 0.3, egg: ['Milk crates', 'crates', 'Milk crate furniture. The official seating of the five boroughs since forever.'] }], ['plastic_crate_01', 18.5, -2.3, { h: 0.32, r: 0.35 }],
    ['bananas', 19.1, -3.0, { len: 0.3, y: 0.66 }], ['lemon', 18.5, -2.3, { len: 0.08, y: 0.33 }], ['metal_trash_can', 0.9, 1.2, { h: 0.95, r: 0.35 }], ['old_tyre', 18.8, 0.8, { len: 0.7 }], ['utility_box_01', 19.6, -6.9, { h: 1.3 }],
  ],
  ghost: [
    ['metal_office_desk', 3.6, -3.6, { len: 1.6, ry: Math.PI / 2, r: 0.8 }], ['desk_lamp_arm_01', 3.4, -4.1, { h: 0.5, y: 0.76 }],
    ['vintage_radio_transceiver', 3.7, -3.1, { len: 0.45, y: 0.76, ry: Math.PI / 2, egg: ['The radio', 'radio', 'Dispatch: we got one. Big. Sweet. Coming up Central Park West. Bring the car.'], snd: 'beep' }],
    ['old_gas_mask', 3.8, -4.4, { len: 0.3, y: 0.76 }], ['korean_fire_extinguisher_01', 0.5, 0.9, { h: 0.55 }], ['ladder_sectioned_01', 19.5, -6.4, { h: 3.2, ry: -Math.PI / 2 }],
    ['metal_toolbox', 12.6, -6.2, { len: 0.55 }], ['Barrel_01', 0.9, -6.8, { h: 0.9, r: 0.4 }], ['Barrel_01', 1.7, -7.2, { h: 0.9, r: 0.4 }],
    ['mounted_fluorescent_lights', 6, 0, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.3, y: 5.85 }], ['Megaphone_01', 4.0, -2.4, { len: 0.4, y: 0.76, ry: 2 }],
  ],
  natm: [
    ['marble_bust_01', 1.0, -3.0, { h: 0.7, y: 1.1 }], ['marble_bust_01', 1.0, -5.4, { h: 0.7, y: 1.1, ry: 0.4 }], ['gothic_statue', 18.8, -6.4, { h: 2.1, r: 0.5 }],
    ['vintage_grandfather_clock_01', 19.3, 0.6, { h: 2.2, ry: -Math.PI / 2, r: 0.45, egg: ['The clock', 'midnight', 'It strikes midnight. In this museum that is when the exhibits clock in.'], snd: 'ding' }],
    ['WetFloorSign_01', 12.4, 6.0, { h: 0.6 }], ['Lantern_01', 17.0, 4.62, { h: 0.3, y: 0.5 }], ['security_light', 0.2, 2.0, { h: 0.4, y: 4.4, ry: Math.PI / 2 }],
  ],
  coney: [
    ['modular_street_seating', 12.6, 3.6, { len: 2.6, r: 1.1 }], ['street_lamp_01', 18.8, 1.0, { h: 4.6, r: 0.25 }], ['street_lamp_01', 1.2, 6.8, { h: 4.6, r: 0.25 }], ['metal_trash_can', 14.8, 5.4, { h: 0.95, r: 0.35 }],
    ['baseball_bat', 9.4, -5.0, { len: 0.85, ry: 0.4, egg: ['A dropped bat', 'bat', 'Somebody dropped a bat by the wheel. Leave it. Trust me on this one.'] }],
    ['Barrel_01', 18.8, -6.6, { h: 0.9, r: 0.4 }], ['wooden_crate_02', 19.0, -5.4, { h: 0.6, r: 0.4 }], ['old_tyre', 17.6, -6.9, { len: 0.7 }],
    ['spray_paint_bottles_02', 1.4, -3.0, { len: 0.35, egg: ['Spray cans', 'spray', 'Somebody has been painting eye flowers on every shutter on the boardwalk. No idea who. None.'] }],
  ],
  stairs: [
    ['metal_trash_can', 4.4, 2.0, { h: 0.95, r: 0.35 }], ['street_lamp_02', 16.6, 4.0, { h: 4.4, r: 0.25 }], ['cardboard_box_01', 3.0, -0.8, { h: 0.5, r: 0.35 }],
    ['concrete_road_barrier', 17.4, 0.6, { len: 2, r: 0.9 }], ['old_tyre', 2.4, 0.6, { len: 0.7 }],
  ],
  kong: [
    ['binoculars', 4.2, -7.2, { len: 0.5, y: 1.25, ry: Math.PI, egg: ['Coin binoculars', 'scope', 'Twenty five cents. Look east. Then look east again. He is right there.'], fn: (c) => c.zoom(true) }],
    ['binoculars', 15.8, -7.2, { len: 0.5, y: 1.25, ry: Math.PI }], ['modular_street_seating', 10, 5.6, { len: 2.6, r: 1.1 }], ['security_light', 19.8, -2, { h: 0.4, y: 3.4, ry: -Math.PI / 2 }],
  ],
};

// ---------- hanging plans ----------
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const SLOTS = {
  barefoot: () => { const S = [], south = D / 2 - 0.14; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
    [-6.4, -4.2].forEach((z) => S.push({ x: 0.14, y: 6.4, z, ry: PI / 2, w: 1.4 })); [-6.4, -4.2, -2.6].forEach((z) => S.push({ x: W - 0.14, y: 6.4, z, ry: -PI / 2, w: 1.4 })); return S; },
  tiffany: () => { const S = [], south = D / 2 - 0.14; [2.0, 4.0, 16.0, 18.0].forEach((x) => S.push({ x, y: 2.1, z: south, ry: PI, w: 1.4 }));
    [7.4, 10, 12.6].forEach((x) => S.push({ x, y: 2.2, z: D / 2 - 0.2, ry: PI, w: 1.1 }));
    [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  taxi: () => { const S = [], south = D / 2 - 0.14; [1.6, 3.6, 5.6, 14.4, 16.4, 18.4].forEach((x) => S.push({ x, y: 2.0, z: south, ry: PI, w: 1.4 }));
    [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.6, z, ry: -PI / 2, w: 1.4 })); return S; },
  heat: () => { const S = [], south = D / 2 - 0.14; for (let i = 0; i < 6; i++) S.push({ x: 2.4 + i * 3.04, y: 2.2, z: south, ry: PI, w: 1.6 }); for (let i = 0; i < 6; i++) S.push({ x: 2.4 + i * 3.04 + 1.52, y: 4.0, z: south, ry: PI, w: 1.4 }); return S; },
};

// ---------- the sets ----------
const ROOM = {
  lobby(c, r, g, X) {
    const { THREE } = c;
    // marquee over the portal
    const mq = c.sign('NOW SHOWING\nON LOCATION', { w: 7, h: 1.3, bg: '#120607', fg: '#ffe7b0', font: c.SERIF, weight: 900, glow: 18, border: '#c9a033' });
    mq.position.set(W / 2, PORTAL.h + 0.75, -D / 2 + 0.05); g.add(mq);
    bulbs(c, g, W / 2 - 3.6, W / 2 + 3.6, PORTAL.h + 1.5, -D / 2 + 0.1, 28); bulbs(c, g, W / 2 - 3.6, W / 2 + 3.6, PORTAL.h + 0.02, -D / 2 + 0.1, 28);
    // a chandelier of nazar beads
    const ch = new THREE.Group(); ch.position.set(W / 2, 4.6, 1); g.add(ch);
    const bead = new THREE.SphereGeometry(0.07, 10, 8), glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.05, transmission: 0.6, clearcoat: 1, emissive: 0x335577, emissiveIntensity: 0.4 });
    for (let ring = 0; ring < 4; ring++) for (let i = 0; i < 14 + ring * 6; i++) { const a = i / (14 + ring * 6) * PI * 2, R = 0.5 + ring * 0.35, m = new THREE.Mesh(bead, i % 4 ? glass : basic(c, 0x1d4ed8)); m.position.set(Math.cos(a) * R, -ring * 0.22, Math.sin(a) * R); ch.add(m); }
    const cg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,170,.6)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); cg.scale.set(4, 4, 1); cg.position.y = -0.4; ch.add(cg);
    c.tick((t) => { ch.rotation.y = t * 0.05; });
    // the concession stand and the usher
    const pc = c.glb('popcorn', { h: 2.0, x: 16.8, z: -4.2, ry: -0.5, parent: g }); c.post(X(16.8), -4.2, 0.8);
    c.clickable(pc, () => { c.egg('popcorn', 'EYE CRUNCH. Every kernel has an eye. Every eye has seen the movie.'); c.sound.pop(); }, 'EYE CRUNCH');
    const us = c.glb('usher', { h: 1.85, x: 4.4, z: -6.2, ry: 0.35, parent: g }); c.post(X(4.4), -6.2, 0.45);
    c.clickable(us, () => { c.say(us, 'Tickets please. Oh, you are a New Yorker. Go right in, any set you like.', 3600); c.egg('usher'); }, 'The usher');
    c.tick((t) => { us.rotation.y = 0.35 + Math.sin(t * 0.7) * 0.15; });
    // the anamorphic title: thirty two shards hang at random depths along rays from one spot on the carpet.
    // From that spot, and only that spot, they line up into the title.
    const V = new THREE.Vector3(r.x0 + 15.2, 1.62, 4.6), title = c.canvasTex(1024, 512, (q, w, h) => {
      eyeFlower(q, w / 2, 150, 120);
      q.fillStyle = '#ffe7b0'; q.textAlign = 'center'; q.font = `900 150px ${c.SERIF}`; q.shadowColor = '#ff4fa3'; q.shadowBlur = 24; q.fillText('ON LOCATION', w / 2, 400);
      q.font = `700 40px ${c.MONO}`; q.shadowBlur = 0; q.fillStyle = '#22d3ee'; q.fillText('NEW YORK AT THE MOVIES', w / 2, 470);
    });
    const NXs = 8, NYs = 4, PW = 0.95, PH = 0.475, up = 0.1;
    for (let j = 0; j < NYs; j++) for (let i = 0; i < NXs; i++) {
      const u0 = i / NXs, v0 = j / NYs, d = 2.6 + Math.random() * 7.5;
      const geo = new THREE.PlaneGeometry(PW / NXs * d, PH / NYs * d), uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / NXs, v0 + uv.getY(k) / NYs);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: title, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
      const px = (u0 + 0.5 / NXs - 0.5) * PW, py = (v0 + 0.5 / NYs - 0.5) * PH + up;
      m.position.set(V.x - r.x0 + px * d, V.y + py * d, V.z - d); g.add(m);
      const sx = m.position.x, sy = m.position.y, ph = Math.random() * 6;
      c.tick((t) => { const wob = Math.sin(t * 0.6 + ph) * 0.006; m.position.x = sx + wob * d; m.position.y = sy + wob * d * 0.5; });
    }
    const star = decal(c, 1.1, 1.1, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, R = k % 2 ? w * 0.2 : w * 0.46; q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.fill(); q.fillStyle = '#120607'; q.font = `800 ${h * 0.08}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND HERE', w / 2, h * 0.56); });
    star.rotation.x = -PI / 2; star.position.set(V.x - r.x0, 0.012, V.z); g.add(star);
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (Math.hypot(P.x - V.x, P.z - V.z) < 0.45) { c.camera.getWorldDirection(fw); if (fw.z < -0.97) c.egg('anamorph', 'From exactly here, every piece lines up. That is the whole trick of the movies.'); } });
  },

  taxi(c, r, g, X) {
    const { THREE } = c;
    // the mirror: a Reflector on the south wall. Your reflection is a cab driver with an eye flower for a head.
    const mirror = new Reflector(new THREE.PlaneGeometry(5.6, 2.6), { textureWidth: c.MOBILE ? 512 : 1024, textureHeight: c.MOBILE ? 256 : 512, color: 0xb8b8b0, clipBias: 0.003 });
    mirror.position.set(W / 2, 1.55, D / 2 - 0.16); mirror.rotation.y = PI; g.add(mirror);
    mirror.getReflectionCamera(c.camera).layers.enable(1);
    const frame = std(c, 0x2a1a0e, { roughness: 0.5 });
    g.add(c.slab(5.9, 0.15, 0.08, frame, W / 2, 2.92, D / 2 - 0.12)); g.add(c.slab(5.9, 0.15, 0.08, frame, W / 2, 0.18, D / 2 - 0.12));
    g.add(c.slab(0.15, 2.8, 0.08, frame, W / 2 - 2.9, 1.55, D / 2 - 0.12)); g.add(c.slab(0.15, 2.8, 0.08, frame, W / 2 + 2.9, 1.55, D / 2 - 0.12));
    const me = c.glb('cabbie', { h: 1.82, parent: c.scene, onload: (o) => o.traverse((m) => m.layers.set(1)) });
    const hist = []; let stand = 0, lag = 0, said = 0;
    c.tick((t, dt, P, ri) => {
      hist.push({ t, x: P.x, z: P.z, y: P.y, yaw: P.yaw }); while (hist.length && hist[0].t < t - 2) hist.shift();
      if (ri !== r.i) { me.visible = false; stand = 0; return; }
      me.visible = true;
      const front = P.z > D / 2 - 4.2 && Math.abs(P.x - X(W / 2)) < 3;
      stand = front ? stand + dt : Math.max(0, stand - dt * 2);
      lag += ((stand > 5 ? 0.9 : 0) - lag) * Math.min(1, dt * 0.8);
      let s = hist[hist.length - 1]; for (let i = hist.length - 1; i >= 0; i--) if (hist[i].t <= t - lag) { s = hist[i]; break; }
      me.position.set(s.x, s.y - 1.62 * P.scale - 0.02, s.z); me.rotation.y = s.yaw + PI; me.scale.setScalar(P.scale);
      if (stand > 5 && t - said > 14) { said = t; c.say(mirror, 'You countin\' me? You countin\' ME?', 3200, 1.8); setTimeout(() => c.say(mirror, 'Nobody else in here. Must be me.', 3000, 1.8), 3400); c.egg('mirror', 'Your reflection is running a little late. It is a New Yorker, it has places to be.'); }
    });
    // the bed, the dresser, a television nobody turned off
    const sheet = std(c, 0xcfc4a8, { roughness: 0.95 }), wood = std(c, 0x3a2412);
    g.add(c.slab(2.2, 0.35, 1.2, wood, 17.8, 0.25, -5.2)); g.add(c.slab(2.1, 0.22, 1.1, sheet, 17.8, 0.53, -5.2)); g.add(c.slab(0.5, 0.18, 0.9, std(c, 0xeeeeee), 18.6, 0.72, -5.2));
    c.wall(X(16.7), -5.8, X(19), -5.8); c.wall(X(16.7), -4.6, X(19), -4.6); c.wall(X(16.7), -5.8, X(16.7), -4.6);
    g.add(c.slab(1.6, 0.9, 0.6, wood, 2.6, 0.45, -6.8)); c.wall(X(1.8), -6.4, X(3.4), -6.4);
    g.add(c.slab(0.7, 0.55, 0.5, std(c, 0x222222), 2.6, 1.18, -6.8));
    const tv = c.canvasTex(128, 96, () => {}), tvm = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), new THREE.MeshBasicMaterial({ map: tv, toneMapped: false })); tvm.position.set(2.6, 1.18, -6.54); g.add(tvm);
    let tn = 0;
    c.tick((t, dt, P, ri) => { if (ri !== r.i || t - tn < 0.08) return; tn = t; const q = tv.userData.canvas.getContext('2d'), id = q.createImageData(128, 96); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } q.putImageData(id, 0, 0); if ((t | 0) % 6 < 2) { q.fillStyle = '#000'; q.fillRect(0, 34, 128, 28); q.fillStyle = '#f5c542'; q.font = '700 16px monospace'; q.textAlign = 'center'; q.fillText('GET COUNTED', 64, 54); } tv.needsUpdate = true; });
    c.clickable(tvm, () => c.egg('tv', 'Channel 3, 3 a.m. It has been telling you to get counted all night.'), 'The set');
    // neon from the street outside, blinking
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; });
    const ns = c.sign('EYE SHOW', { w: 2.2, h: 0.5, bg: null, fg: '#ff3b6b', glow: 26, weight: 800 }); ns.position.set(3.2, 3.8, -D / 2 + 0.06); g.add(ns);
    c.tick((t) => { ns.visible = Math.sin(t * 3.1) + Math.sin(t * 7.3) > -0.6; });
  },

  big(c, r, g, X) {
    const { THREE } = c;
    // the floor piano: 28 white keys, the black ones raised, each plays when you stand on it
    const x0 = 3, KW = 0.5, Z1 = -1.6, Z2 = 1.6, keys = [];
    const white = std(c, 0xf6f3ea, { roughness: 0.3 }), black = std(c, 0x111111, { roughness: 0.25 }), lit = basic(c, 0xffd36a);
    const freq = (semi) => 261.63 * Math.pow(2, semi / 12);
    const WS = [0, 2, 4, 5, 7, 9, 11];
    for (let i = 0; i < 28; i++) { const m = c.slab(KW - 0.03, 0.06, Z2 - Z1, white, x0 + i * KW + KW / 2, 0.03, (Z1 + Z2) / 2); g.add(m); keys.push({ m, x1: x0 + i * KW, x2: x0 + (i + 1) * KW, z1: Z1, z2: Z2, f: freq(Math.floor(i / 7) * 12 + WS[i % 7] - 12), mat: white, black: false }); }
    for (let i = 0; i < 27; i++) { if ([2, 6].includes(i % 7)) continue; const xc = x0 + (i + 1) * KW, m = c.slab(0.3, 0.08, 1.7, black, xc, 0.05, Z1 + 0.85); g.add(m); keys.push({ m, x1: xc - 0.15, x2: xc + 0.15, z1: Z1, z2: Z1 + 1.7, f: freq(Math.floor(i / 7) * 12 + WS[i % 7] + 1 - 12), mat: black, black: true }); }
    const brand = c.sign('MLow GRAND · PLAY THE FLOOR', { w: 4, h: 0.3, bg: null, fg: '#1b1b1b', font: c.MONO, weight: 700 }); brand.rotation.x = -PI / 2; brand.position.set(W / 2, 0.07, Z2 + 0.35); g.add(brand);
    let on = null; const played = new Set();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const lx = P.x - r.x0; let k = null;
      for (const q of keys) if (lx > q.x1 && lx < q.x2 && P.z > q.z1 && P.z < q.z2 && (!k || q.black)) k = q;
      if (k !== on) { if (on) on.m.material = on.mat; on = k; if (k) { k.m.material = lit; c.sound.note(k.f * (P.scale > 1.5 ? 0.5 : 1)); played.add(k); if (played.size === 10) { c.sound.applause(4); c.egg('piano', 'Ten keys with your feet. Fifth Avenue applauds. The floor asks for an encore.'); } } }
    });
    // MLOWTAR: put in a wish, wake up big
    const mt = c.glb('mlowtar', { h: 2.5, x: 2.4, z: -6.4, ry: 0.4, parent: g }); c.post(X(2.4), -6.4, 0.7);
    const eye = new THREE.PointLight(0xff4fa3, 0, 4); eye.position.set(2.6, 2.0, -5.9); g.add(eye);
    let big = 0;
    c.clickable(mt, () => {
      if (big > 0) return; c.say(mt, 'MLOWTAR SPEAKS: your wish is granted.', 3000, 2.9); c.sound.whoosh(0.6, 2.5); eye.intensity = 6; big = 22; c.FX.warp = 1;
      setTimeout(() => { c.FX.warp = 0; }, 1600); c.egg('wish', 'Your wish is granted. You are BIG. Try the piano now.');
    }, 'MLOWTAR SPEAKS');
    c.tick((t, dt, P) => { if (big > 0) { big -= dt; P.scale += (2.4 - P.scale) * Math.min(1, dt * 1.5); P.speed = 1.7; r.shrinking = true; if (big <= 0) { c.toast('Midnight on Fifth Avenue. You are small again.'); c.FX.warp = 0.6; setTimeout(() => { c.FX.warp = 0; }, 1200); } } else if (r.shrinking) { P.scale += (1 - P.scale) * Math.min(1, dt * 1.5); P.speed = 1; if (Math.abs(P.scale - 1) < 0.01) { P.scale = 1; r.shrinking = false; } } eye.intensity *= 0.98; });   // only undo its own wish, or it fights every other set that changes your size or speed
    // a tower of toy blocks
    const L = 'N3WYORKERS';
    for (let i = 0; i < 10; i++) { const b = blockMesh(c, L[i], INK[i % 6]); b.position.set(17.3 + (i % 2) * 0.62 - (i > 5 ? 0.3 : 0), 0.3 + Math.floor(i / 2) * 0.6, -5.8 + (i % 3) * 0.05); b.rotation.y = (Math.random() - 0.5) * 0.4; g.add(b); }
    c.post(X(17.6), -5.8, 0.8);
  },

  itch(c, r, g, X) {
    const { THREE } = c;
    // the grate: when the train passes underneath, whoever stands on it goes up
    const gx1 = 7.4, gx2 = 12.6, gz1 = -3.4, gz2 = -0.6; r.holdLift = true;
    const gt = c.canvasTex(512, 256, (q, w, h) => { q.fillStyle = '#05070a'; q.fillRect(0, 0, w, h); q.fillStyle = '#6f757c'; for (let x = 0; x < w; x += 16) q.fillRect(x, 0, 5, h); for (let y = 0; y < h; y += 64) q.fillRect(0, y, w, 6); q.strokeStyle = '#8b9096'; q.lineWidth = 10; q.strokeRect(0, 0, w, h); });
    const grate = new THREE.Mesh(new THREE.PlaneGeometry(gx2 - gx1, gz2 - gz1), new THREE.MeshStandardMaterial({ map: gt, metalness: 0.8, roughness: 0.4 }));
    grate.rotation.x = -PI / 2; grate.position.set((gx1 + gx2) / 2, 0.012, (gz1 + gz2) / 2); g.add(grate);
    const glow = new THREE.PointLight(0xfff0c0, 0, 6); glow.position.set(10, 0.3, -2); g.add(glow);
    const dress = c.glb('dress', { h: 1.75, x: 11.6, z: -2.0, ry: -0.3, parent: g }); c.post(X(11.6), -2.0, 0.4);
    c.clickable(dress, () => { c.say(dress, 'Isn\'t it delicious? The breeze from the 6 train.', 3200, 2.1); c.egg('dress'); }, 'The breeze');
    // marquee and lamps
    const mq = c.sign('N3W YORKERS\nTHE UNCOUNTED', { w: 6, h: 1.4, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 900, border: '#d23' }); mq.position.set(W / 2, 5.4, -D / 2 + 0.05); g.add(mq);
    bulbs(c, g, W / 2 - 3.1, W / 2 + 3.1, 6.25, -D / 2 + 0.1, 26); bulbs(c, g, W / 2 - 3.1, W / 2 + 3.1, 4.55, -D / 2 + 0.1, 26);
    c.glb('lamppost', { h: 4.6, x: 2.2, z: -5, parent: g }); c.post(X(2.2), -5, 0.25);
    c.glb('lamppost', { h: 4.6, x: 17.8, z: -5, parent: g }); c.post(X(17.8), -5, 0.25);
    // flyers on the pavement that go up with you
    const papers = [], ft = flyer(c, 'GET COUNTED');
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide, roughness: 0.9 })); const p = { m, x: gx1 + Math.random() * (gx2 - gx1), z: gz1 + Math.random() * (gz2 - gz1), y: 0.02, vy: 0, spin: Math.random() * 6 }; m.rotation.x = -PI / 2; m.position.set(p.x, 0.02, p.z); g.add(m); papers.push(p); }
    let next = 6, train = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      next -= dt; if (next <= 0) { next = 13 + Math.random() * 5; train = 3.2; c.sound.boom(0.7); c.sound.whoosh(0.5, 3); c.shake(0.04); for (let k = 0; k < 4; k++) setTimeout(() => { c.flash(0.45); c.sound.pop(); }, 400 + k * 500); papers.forEach((p) => { p.vy = 3 + Math.random() * 4; }); }
      const lx = P.x - r.x0, on = lx > gx1 && lx < gx2 && P.z > gz1 && P.z < gz2;
      if (train > 0) { train -= dt; glow.intensity = 8; if (on) { P.lift += (3.2 - P.lift) * Math.min(1, dt * 1.6); c.egg('grate', 'The train passes underneath and you go up with the skirt. Lexington and 52nd, 1954.'); } }
      else { glow.intensity *= 0.9; P.lift += (0 - P.lift) * Math.min(1, dt * 0.9); }
      for (const p of papers) { if (p.vy || p.y > 0.03) { p.vy -= dt * 2.2; p.y = Math.max(0.02, p.y + p.vy * dt); p.spin += dt * 3; p.m.position.set(p.x + Math.sin(p.spin) * 0.3, p.y, p.z + Math.cos(p.spin * 0.7) * 0.3); p.m.rotation.set(-PI / 2 + Math.sin(p.spin) * 1.2, p.spin, 0); if (p.y <= 0.02) { p.vy = 0; p.m.rotation.set(-PI / 2, 0, p.spin); } } }
      if (dress.children[0]) { const s = train > 0 ? 1 + Math.sin(t * 18) * 0.03 : 1; dress.children[0].scale.x = dress.children[0].scale.z = dress.children[0].scale.y * s; }
    });
  },

  heat(c, r, g, X) {
    const { THREE } = c;
    // the hydrant, open, and the spray it throws across the street
    const hx = 13, hz = -2.2;
    c.glb('hydrant', { h: 0.95, x: hx, z: hz, ry: -PI / 2, parent: g }); c.post(X(hx), hz, 0.3);
    const N = c.MOBILE ? 500 : 1100, pos = new Float32Array(N * 3), st = [];
    for (let i = 0; i < N; i++) st.push({ t: Math.random() * 1.4, a: (Math.random() - 0.5) * 0.5, v: 7 + Math.random() * 3 });
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spray = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xd8f0ff, size: 0.07, transparent: true, opacity: 0.75, depthWrite: false })); spray.frustumCulled = false; g.add(spray);
    const wetZ = { x1: 6, x2: 12.6, z1: -3.6, z2: -0.8 };
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshStandardMaterial({ color: 0x223040, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.6 })); puddle.rotation.x = -PI / 2; puddle.scale.set(1.5, 0.7, 1); puddle.position.set(9.4, 0.015, -2.2); g.add(puddle);
    let wet = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { document.querySelector('#wet').style.opacity = 0; return; }
      for (let i = 0; i < N; i++) { const s = st[i]; s.t += dt; if (s.t > 1.4) { s.t = 0; s.a = (Math.random() - 0.5) * 0.5; s.v = 7 + Math.random() * 3; } const vx = -Math.cos(s.a) * s.v, vz = Math.sin(s.a) * s.v; pos[i * 3] = hx - 0.15 + vx * s.t * 0.75; pos[i * 3 + 1] = Math.max(0.02, 0.6 + 2.6 * s.t - 4.9 * s.t * s.t); pos[i * 3 + 2] = hz + vz * s.t * 0.45; }
      pg.attributes.position.needsUpdate = true;
      const lx = P.x - r.x0, inS = lx > wetZ.x1 && lx < wetZ.x2 && P.z > wetZ.z1 && P.z < wetZ.z2;
      wet = inS ? 1 : Math.max(0, wet - dt * 0.4); document.querySelector('#wet').style.opacity = wet.toFixed(2);
      if (inS) c.egg('hydrant', 'Hottest day of the summer, coldest water on the block. Stuyvesant Avenue thanks you.');
    });
    // the thermometer on the bank, still climbing
    const th = c.canvasTex(512, 256, () => {}), thm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: th, toneMapped: false }));
    thm.position.set(0.14, 4.6, -3); thm.rotation.y = PI / 2; g.add(thm);
    let deg = 0;
    c.tick((t) => { const d = 103 + Math.floor(t / 40); if (d === deg) return; deg = d; const q = th.userData.canvas.getContext('2d'); q.fillStyle = '#0b0b0b'; q.fillRect(0, 0, 512, 256); q.fillStyle = '#ff3b1f'; q.shadowColor = '#ff3b1f'; q.shadowBlur = 20; q.font = '900 150px monospace'; q.textAlign = 'center'; q.fillText(`${d}°F`, 256, 170); q.shadowBlur = 0; q.font = '700 30px monospace'; q.fillStyle = '#f5c542'; q.fillText('N3W YORKERS SAVINGS BANK', 256, 232); th.needsUpdate = true; });
    // the box: click it and the block hears it
    const bb = c.glb('boombox', { len: 1.1, x: 4.2, y: 0.9, z: -6.2, ry: 0.4, parent: g });
    g.add(c.slab(3.2, 0.9, 1.6, c.surf('concrete', 2, 0x8a6a58), 3.4, 0.45, -6.6)); c.wall(X(1.8), -5.8, X(5), -5.8);
    let on = false;
    c.clickable(bb, () => { on = !on; c.sound.beat(on); if (on) { c.say(bb, 'TURN IT UP. THE WHOLE BLOCK IS COUNTED.', 2800, 1.0); c.egg('boombox'); } }, 'The box');
    c.tick((t, dt, P, ri) => { if (ri !== r.i && on) { on = false; c.sound.beat(false); } bb.scale.setScalar(on ? 1 + Math.max(0, Math.sin(t * 9.6)) * 0.06 : 1); });
    // the wall of fame and a cooler of cola
    const wf = c.sign('WALL OF FAME · ALL BED-STUY · ALL NEW YORKERS', { w: 12, h: 0.6, bg: '#111', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#ff4fa3' }); wf.position.set(W / 2, 5.4, D / 2 - 0.15); wf.rotation.y = PI; g.add(wf);
    g.add(c.slab(1.2, 0.8, 0.7, std(c, 0xc8102e), 17.6, 0.4, -6.4)); const cl = c.sign('NAZAR COLA\nICE COLD', { w: 1.1, h: 0.5, bg: '#c8102e', fg: '#fff', weight: 900 }); cl.position.set(17.6, 0.45, -6.04); g.add(cl); c.post(X(17.6), -6.4, 0.7);
  },

  ghost(c, r, g, X) {
    const { THREE } = c;
    // the car, nose out of the bay
    c.glb('ambulance', { len: 6.2, x: 8.6, z: -2.6, ry: PI, parent: g });
    [-0.3, -2.6, -4.9].forEach((z) => c.post(X(8.6), z, 1.15));
    // the pole down from the bunks
    const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.22 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H_IN, 16), brass); pole.position.set(16, H_IN / 2, -4.5); g.add(pole); c.post(X(16), -4.5, 0.25);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 32), brass); ring.rotation.x = PI / 2; ring.position.set(16, H_IN - 0.02, -4.5); g.add(ring);
    let slide = 0;
    c.clickable(pole, () => { slide = 1.6; c.P.lift = 3.8; c.sound.whoosh(0.4, 1.4); c.egg('pole', 'Down the pole from the bunk room. The alarm never rings when you are ready.'); }, 'The pole');
    c.tick((t, dt, P) => { if (slide > 0) { slide -= dt; if (slide <= 0) { c.sound.thud(0.5); c.shake(0.05); } } });
    // the containment unit, and the button you must not press
    const unit = new THREE.Group(); unit.position.set(W - 0.5, 0, -1.6); unit.rotation.y = -PI / 2; g.add(unit);
    unit.add(c.slab(1.8, 2.2, 0.7, std(c, 0x3a3f44, { metalness: 0.6, roughness: 0.4 }), 0, 1.1, 0));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), basic(c, 0xff2030)); lamp.position.set(-0.6, 1.9, 0.36); unit.add(lamp);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24), basic(c, 0xff2030)); btn.rotation.x = PI / 2; btn.position.set(0, 1.3, 0.38); unit.add(btn);
    const lbl = c.sign('DO NOT PRESS', { w: 1.2, h: 0.22, bg: '#f5c542', fg: '#111', font: c.MONO, weight: 700 }); lbl.position.set(0, 0.95, 0.36); unit.add(lbl);
    c.post(X(W - 0.5), -1.6, 1.0);
    c.tick((t) => { lamp.visible = (t * 2 | 0) % 2 === 0; });
    // the hollow face: the giant's head always turns to you, from wherever you stand
    const puft = c.glb('puft', { h: 34, x: W / 2, y: -40, z: -48, parent: g }); puft.visible = false;
    let rise = 0;
    c.clickable(btn, () => {
      if (rise) { c.toast('You already pressed it. It is already here.'); return; }
      rise = 0.001; puft.visible = true; c.sound.roar(0.6); c.shake(0.08); c.flash(0.6);
      for (let k = 0; k < 6; k++) setTimeout(() => c.sound.beep(988, 0.08, 0.25, 'square'), k * 350);
      c.egg('puft', 'You pressed it. Of course you pressed it. Something sweet and enormous is coming up Central Park West.');
    }, 'DO NOT PRESS');
    const v = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (!rise) return;
      rise = Math.min(1, rise + dt / 6); puft.position.y = -40 + 40 * (1 - Math.pow(1 - rise, 3));
      puft.getWorldPosition(v); puft.rotation.y = Math.atan2(P.x - v.x, P.z - v.z) * 0.6 + Math.sin(t * 0.8) * 0.05;
      if (ri === r.i && rise < 1) c.shake(0.015);
    });
    watcher(c, g, 2.6, 4.4, -D / 2 + 0.05, 0, 0.7); watcher(c, g, W - 2.6, 4.4, -D / 2 + 0.05, 0, 0.7);
  },

  natm(c, r, g, X) {
    const { THREE } = c;
    // the skeleton moves only while you are not looking at it
    const rex = c.glb('trex', { len: 8.5, x: W / 2, z: -3.2, ry: 0, parent: g });
    const col = c.post(X(W / 2), -3.2, 2.6);
    const target = new THREE.Vector3(), fw = new THREE.Vector3(), to = new THREE.Vector3();
    let met = false, fetch = null;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i || !rex.userData.ready) return;
      rex.getWorldPosition(to); const dx = P.x - to.x, dz = P.z - to.z, d = Math.hypot(dx, dz);
      c.camera.getWorldDirection(fw); const seen = (-dx * fw.x - dz * fw.z) / (d * Math.hypot(fw.x, fw.z) + 1e-6) > 0.45;
      if (fetch) { target.set(fetch.x, 0, fetch.z); } else target.set(P.x, 0, P.z);
      const tx = target.x - to.x, tz = target.z - to.z, td = Math.hypot(tx, tz);
      if (!seen || fetch) {
        const want = Math.atan2(tx, tz); let dr = want - rex.rotation.y; while (dr > PI) dr -= 2 * PI; while (dr < -PI) dr += 2 * PI; rex.rotation.y += dr * Math.min(1, dt * 2);
        const stop = fetch ? 1.2 : 4.6;
        if (td > stop) { const sp = (fetch ? 2.4 : 1.4) * dt; rex.position.x = Math.max(4, Math.min(16, rex.position.x + tx / td * sp)); rex.position.z = Math.max(-5, Math.min(3.5, rex.position.z + tz / td * sp)); }
        else if (fetch) { fetch = null; c.sound.roar(0.4); c.egg('fetch', 'Rex fetched the bone. Rex is a good boy. Rex is 66 million years old.'); }
      }
      col.x = r.x0 + rex.position.x; col.z = rex.position.z;
      if (!met && d < 5 && seen) { met = true; c.sound.roar(0.7); c.shake(0.06); c.egg('trex', 'It moved. You saw it move. Nobody on the Upper West Side will believe you.'); }
    });
    // the bone on the bench
    const bone = new THREE.Group(); bone.position.set(17.2, 0.62, 4.6); g.add(bone);
    const ivory = std(c, 0xe8dcc0, { roughness: 0.7 });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10), ivory); sh.rotation.z = PI / 2; bone.add(sh);
    for (const sx of [-0.32, 0.32]) for (const sz of [-0.05, 0.05]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), ivory); k.position.set(sx, 0, sz); bone.add(k); }
    g.add(c.slab(1.8, 0.5, 0.6, std(c, 0x3a2a1a), 17.2, 0.25, 4.6)); c.post(X(17.2), 4.6, 0.7);
    c.clickable(bone, () => { if (fetch) return; const fx = 4.5 + Math.random() * 3, fz = -4 + Math.random() * 3; fetch = { x: r.x0 + fx, z: fz }; bone.position.set(fx, 0.08, fz); c.sound.whoosh(0.3, 0.8); c.toast('You threw the bone. Do not look. Let him fetch.'); }, 'A bone');
    // the head on the plinth
    const mo = c.glb('moai', { h: 2.7, x: 3.2, z: -5.8, ry: 0.5, parent: g }); c.post(X(3.2), -5.8, 0.8);
    c.clickable(mo, () => { c.say(mo, 'Dum dum. You give me count count.', 3000, 3.0); c.sound.boom(0.3); c.egg('moai'); }, 'The head');
    // torches that flicker
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; });
    watcher(c, g, W / 2, 5.2, -D / 2 + 0.05, 0, 0.6);
  },

  coney(c, r, g, X) {
    const { THREE } = c;
    const hd = c.glb('hotdog', { h: 2.4, x: 16.4, z: -4.6, ry: -0.6, parent: g }); c.post(X(16.4), -4.6, 0.9);
    c.clickable(hd, () => { c.say(hd, 'Two with everything. MLow FAMOUS, since about five minutes ago.', 3000, 2.6); c.egg('hotdog'); }, 'MLow FAMOUS');
    const crew = [6.8, 9, 11.2].map((x, i) => { const o = c.glb('tough', { h: 1.85, x, z: -6.4 + (i === 1 ? -0.3 : 0), ry: (x - 9) * -0.08, parent: g }); c.post(X(x), -6.4, 0.45); return o; });
    c.tick((t) => crew.forEach((o, i) => { o.position.y = Math.abs(Math.sin(t * 1.4 + i)) * 0.03; }));
    // three bottles on a crate: clink them in a row and the crew sings
    g.add(c.slab(0.9, 0.6, 0.6, std(c, 0x6a4a2a), 3.4, 0.3, -1.4)); c.post(X(3.4), -1.4, 0.55);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x2f6b3a, roughness: 0.1, transmission: 0.5, thickness: 0.2, clearcoat: 1 });
    let seq = 0;
    [-0.28, 0, 0.28].forEach((dx, i) => {
      const b = new THREE.Group(); b.position.set(3.4 + dx, 0.6, -1.4); g.add(b);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), glass); body.position.y = 0.11; b.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.045, 0.12, 12), glass); neck.position.y = 0.28; b.add(neck);
      c.clickable(b, () => { c.sound.clink(2200 + i * 500); seq = seq === i ? i + 1 : (i === 0 ? 1 : 0); if (seq === 3) { seq = 0; c.say(crew[1], 'New Yorkers... come out and get counted...', 3600, 2.2); c.egg('bottles'); } }, 'Clink');
    });
    // the wheel: stare into the spiral and the boardwalk breathes when you look away
    const wh = new THREE.Group(); wh.position.set(3.6, 3.3, -D / 2 + 0.6); g.add(wh);
    const spiral = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#111'; q.fillRect(0, 0, w, h); q.translate(w / 2, h / 2); for (let a = 0; a < 40; a += 0.02) { const R = a * 6.2; q.fillStyle = INK[Math.floor(a / 2) % 4]; q.beginPath(); q.arc(Math.cos(a) * R, Math.sin(a) * R, 6 + a * 0.4, 0, 7); q.fill(); } eyeFlower(q, 0, 0, 46); });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 64), new THREE.MeshBasicMaterial({ map: spiral, toneMapped: false })); wh.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.08, 10, 64), std(c, 0xe0e0e0, { metalness: 0.7, roughness: 0.3 })); wh.add(rim);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, car = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.24), basic(c, [0xff4fa3, 0x22d3ee, 0xf5c542, 0x3b82f6][i % 4])); car.position.set(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0.1); wh.add(car); }
    const leg = std(c, 0xcfcfcf, { metalness: 0.6 }); for (const s of [-1, 1]) { const l = c.slab(0.12, 3.6, 0.12, leg, 3.6 + s * 1.1, 1.6, -D / 2 + 0.7); l.rotation.z = s * 0.3; g.add(l); }
    const lbl = c.sign('STARE AT THE WHEEL · 10 SECONDS', { w: 3.4, h: 0.28, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); lbl.position.set(3.6, 0.6, -D / 2 + 0.55); g.add(lbl);
    let stare = 0, after = 0; const fw = new THREE.Vector3(), wp = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      disc.rotation.z = -t * 2.4;
      if (ri !== r.i) { if (after > 0) { after = 0; c.FX.warp = 0; } stare = 0; return; }
      wh.getWorldPosition(wp); const dx = wp.x - c.camera.position.x, dy = wp.y - c.camera.position.y, dz = wp.z - c.camera.position.z, d = Math.hypot(dx, dy, dz);
      c.camera.getWorldDirection(fw); const dot = (dx * fw.x + dy * fw.y + dz * fw.z) / d;
      if (d < 12 && dot > 0.95) { stare += dt; if (stare > 3 && stare - dt <= 3) c.toast('Keep staring...'); if (stare > 10 && after <= 0) { after = 7; c.toast('Now look away, at the boardwalk.', 2500); } }
      else if (after <= 0) stare = Math.max(0, stare - dt * 0.5);
      if (after > 0) { after -= dt; const looking = dot < 0.9; c.FX.warp = looking ? Math.min(1, after / 2) * 1.2 : 0; if (looking) c.egg('spiral', 'The boardwalk breathes. It is not the website, it is your eyes. Coney Island does that.'); if (after <= 0) { c.FX.warp = 0; stare = 0; } }
    });
    c.glb('pigeon', { h: 0.32, x: 13, y: 0, z: 1, ry: 2, parent: g });
  },

  stairs(c, r, g, X, mats) {
    const { THREE } = c;
    // a staircase with no top. Climb it and the steps come down to meet you: you never get closer.
    // The flight in the room ends on a landing level with the bottom of the photograph, which carries the
    // stairs on up the hill, so the real steps and the pictured ones read as one street.
    const sx1 = 6, sx2 = 14, z0 = 3, RUN = 0.35, RISE = 0.18, S = RISE / RUN, N = 13, LINE = 1.4, TOP = N * RISE, zl = z0 - N * RUN;
    const conc = c.surf('concrete', 1.6, 0xa09a90), edge = std(c, 0xd8c9a0, { roughness: 0.7 });
    const flight = new THREE.Group(); g.add(flight);
    for (let k = 0; k < N + 1; k++) { const z = z0 - k * RUN; flight.add(c.slab(sx2 - sx1, RISE * (k + 1), RUN, conc, (sx1 + sx2) / 2, RISE * (k + 1) / 2, z - RUN / 2)); flight.add(c.slab(sx2 - sx1, 0.02, 0.04, edge, (sx1 + sx2) / 2, RISE * (k + 1) + 0.01, z - 0.02)); }
    const leafM = std(c, 0xb0501c, { roughness: 0.9, side: THREE.DoubleSide });
    for (let i = 0; i < 50; i++) { const k = Math.floor(Math.random() * N), l = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), leafM); l.rotation.set(-PI / 2, 0, Math.random() * 6); l.position.set(sx1 + 0.3 + Math.random() * (sx2 - sx1 - 0.6), RISE * (k + 1) + 0.012, z0 - k * RUN - Math.random() * RUN); flight.add(l); }
    // the landing, wall to wall, up to the portal
    g.add(c.slab(W, TOP, zl + D / 2, conc, W / 2, TOP / 2, (zl - D / 2) / 2));
    // low painted walls either side of the flight, fixed to the hill
    for (const x of [sx1 - 0.15, sx2 + 0.15]) g.add(c.slab(0.3, TOP + 1.0, N * RUN, mats.wall, x, (TOP + 1.0) / 2, z0 - N * RUN / 2, 2));
    c.wall(X(sx1 - 0.3), z0, X(sx1 - 0.3), zl); c.wall(X(sx2 + 0.3), z0, X(sx2 + 0.3), zl);
    c.wall(X(0), zl, X(sx1 - 0.3), zl); c.wall(X(sx2 + 0.3), zl, X(W), zl);
    const rail = std(c, 0x2c5a3a, { metalness: 0.6, roughness: 0.4 }), len = N * RUN / Math.cos(Math.atan(S));
    for (const x of [sx1 + 0.25, sx2 - 0.25]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 8), rail); m.rotation.x = -(PI / 2 - Math.atan(S)); m.position.set(x, TOP / 2 + 0.95, z0 - N * RUN / 2); g.add(m); }
    c.glb('lamppost', { h: 4.4, x: sx1 - 0.6, y: TOP, z: zl - 0.8, parent: g }); c.glb('lamppost', { h: 4.4, x: sx2 + 0.6, y: TOP, z: zl - 0.8, parent: g });
    // the dancer, always the same distance ahead
    const dy = TOP, dz = zl - 3.2;
    const dn = c.glb('dancer', { h: 1.85, x: W / 2, y: dy, z: dz, ry: 0, parent: g });
    c.tick((t) => { dn.rotation.y = Math.sin(t * 2.2) * 0.6; dn.position.y = dy + Math.abs(Math.sin(t * 4.4)) * 0.12; dn.rotation.z = Math.sin(t * 2.2) * 0.12; });
    c.clickable(dn, () => { c.say(dn, 'Come on up. It is only a few more steps.', 3000, 2.1); c.egg('dancer'); }, 'The dancer');
    let off = 0, steps = 0, shown = 0;
    r.ground = (lx, z) => (lx > sx1 && lx < sx2 && z < z0 ? Math.min(TOP, (z0 - z) * S) : 0);
    r.move = (P, nx, nz) => {
      const lx = nx - r.x0;
      if (lx > sx1 && lx < sx2 && nz < LINE && nz < P.z) { const d = P.z - nz; off += d; steps += d / RUN; nz = Math.max(nz, Math.min(P.z, LINE)); }
      return [nx, nz];
    };
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const k = off % RUN; flight.position.set(0, -k * S, k);
      const n = Math.floor(steps); if (n > shown) { shown = n; document.querySelector('#rk').textContent = `Step ${n}. Keep climbing.`; if (n % 2 === 0) c.sound.tick(); }
      if (n >= 100) c.egg('stairs', 'A hundred steps and you are exactly where you started. Very New York.');
    });
    r.plateY = TOP;
  },

  kong(c, r, g, X) {
    const { THREE } = c;
    // the deck, with a glass floor at the edge over the street, 1,250 feet down
    const fm = c.surf('concrete', 2.2, 0x9a9a9a), gx1 = 7, gx2 = 13, gz1 = -3.6, gz2 = 0.4;
    g.add(c.slab(W, 0.1, D / 2 - gz2, fm, W / 2, -0.05, (gz2 + D / 2) / 2)); g.add(c.slab(W, 0.1, gz1 + D / 2, fm, W / 2, -0.05, (gz1 - D / 2) / 2));
    g.add(c.slab(gx1, 0.1, gz2 - gz1, fm, gx1 / 2, -0.05, (gz1 + gz2) / 2)); g.add(c.slab(W - gx2, 0.1, gz2 - gz1, fm, (W + gx2) / 2, -0.05, (gz1 + gz2) / 2));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(gx2 - gx1, gz2 - gz1), new THREE.MeshPhysicalMaterial({ color: 0xbfd8e0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.25, metalness: 0 }));
    glass.rotation.x = -PI / 2; glass.position.set((gx1 + gx2) / 2, 0.005, (gz1 + gz2) / 2); g.add(glass);
    const gl = c.sign('GLASS FLOOR · 102 STORIES · LOOK DOWN', { w: 4.6, h: 0.3, bg: null, fg: '#f4ead2', font: c.MONO, weight: 700 }); gl.rotation.x = -PI / 2; gl.position.set(W / 2, 0.012, gz2 + 0.3); g.add(gl);
    const frameM = std(c, 0x777777, { metalness: 0.8 }); for (let x = gx1; x <= gx2; x += 1.5) g.add(c.slab(0.05, 0.03, gz2 - gz1, frameM, x, 0.01, (gz1 + gz2) / 2));
    // the shaft and the street at the bottom of it
    const DEPTH = 381, shaftM = new THREE.MeshBasicMaterial({ map: facadeTex(c), fog: false, side: THREE.BackSide });
    shaftM.map.wrapS = shaftM.map.wrapT = THREE.RepeatWrapping; shaftM.map.repeat.set(2, 40);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(gx2 - gx1, DEPTH, gz2 - gz1 + 0.01), shaftM); shaft.position.set((gx1 + gx2) / 2, -DEPTH / 2 - 0.1, (gz1 + gz2) / 2); g.add(shaft);
    const street = new THREE.Mesh(new THREE.PlaneGeometry(gx2 - gx1, gz2 - gz1), new THREE.MeshBasicMaterial({ map: aerialTex(c), fog: false })); street.rotation.x = -PI / 2; street.position.set((gx1 + gx2) / 2, -DEPTH + 0.5, (gz1 + gz2) / 2); g.add(street);
    const parapet = c.surf('concrete', 1.5, 0x8a8a8a);
    for (const x of [4.2, 15.8]) { const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.25, 12), std(c, 0x555555, { metalness: 0.8, roughness: 0.4 })); ped.position.set(x, 0.62, -7.2); g.add(ped); c.post(X(x), -7.2, 0.25); }
    g.add(c.slab(PORTAL.w, 1.05, 0.4, parapet, W / 2, 0.52, -D / 2 - 0.1));
    let looked = false; const fw = new THREE.Vector3();
    // the vertigo: stand on the glass and look down, and the camera pulls back while the lens widens
    const onGlass = (P) => { const lx = P.x - r.x0; return lx > gx1 && lx < gx2 && P.z > gz1 && P.z < gz2; };
    r.fov = (P) => (onGlass(P) ? 66 + Math.max(0, Math.min(1, (-P.pitch - 0.25) / 0.8)) * 40 : 66);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (c.FX.sat !== null && ri !== r.i) c.FX.sat = null; return; }
      // colour comes back only when you stand close to a New Yorker
      c.FX.sat = window.__peekNear && window.__peekNear() ? 1 : null;
      const lx = P.x - r.x0;
      if (!looked && onGlass(P)) { c.camera.getWorldDirection(fw); if (fw.y < -0.75) { looked = true; c.shake(0.05); c.egg('down', 'You looked down. 1,250 feet of Fifth Avenue, and it looks right back up at you.'); } }
    });
    // he is not on the building across the way. He is right here, over the east wall of the deck.
    const sp = new THREE.Group(); sp.position.set(W + 4.5, 0, -3); g.add(sp);
    const ape = c.glb('ape', { h: 13, x: 0, y: -1, z: 0, ry: -PI / 2, parent: sp });
    c.tick((t) => { ape.rotation.z = Math.sin(t * 0.7) * 0.04; ape.rotation.y = -PI / 2 + Math.sin(t * 0.3) * 0.15; });
    // the planes, circling; hit one and he swats
    for (let i = 0; i < 4; i++) {
      const pl = c.glb('biplane', { len: 3.4, parent: sp }), R = 11 + i * 2.5, h = 9 + i * 2.5, ph = i / 4 * PI * 2, sp0 = 0.25 + i * 0.03;
      c.tick((t) => { const a = t * sp0 + ph; pl.position.set(Math.cos(a) * R, h + Math.sin(t + i) * 2, Math.sin(a) * R); pl.rotation.set(0, -a, -0.5); });
      c.clickable(pl, () => { c.sound.roar(0.8); c.shake(0.1); c.egg('kong', 'He swats. He misses. He is a New Yorker now, he is not leaving.'); setTimeout(() => window.__finale && window.__finale(), 3200); }, 'A biplane');
    }
  },
};

Object.assign(ROOM, {
  tiffany(c, r, g, X) {
    const { THREE } = c;
    // the window: a lit box set into the facade, three New Yorkers on velvet easels inside like jewels
    const win = new THREE.Group(); win.position.set(W / 2, 0, D / 2 - 0.12); g.add(win);
    const bronze = std(c, 0x8a6a3a, { metalness: 1, roughness: 0.3 }), velvet = std(c, 0x0e1830, { roughness: 1 }), granite = std(c, 0x6a5a62, { roughness: 0.35, metalness: 0.1 });
    win.add(c.slab(8.6, 0.9, 1.6, granite, 0, 0.45, -0.8)); win.add(c.slab(8.6, 0.5, 1.6, granite, 0, 3.75, -0.8));
    win.add(c.slab(8.2, 0.05, 1.4, velvet, 0, 0.93, -0.8)); win.add(c.slab(8.2, 2.6, 0.05, velvet, 0, 2.2, -0.05));
    for (const x of [-4.2, 4.2]) win.add(c.slab(0.2, 3.6, 1.6, bronze, x, 2.0, -0.8));
    win.add(c.slab(8.6, 0.12, 0.12, bronze, 0, 3.5, -1.6)); win.add(c.slab(8.6, 0.12, 0.12, bronze, 0, 0.92, -1.6));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.2, envMapIntensity: 2 })); glass.position.set(0, 2.2, -1.6); glass.rotation.y = PI; win.add(glass);
    c.wall(X(W / 2 - 4.3), D / 2 - 1.75, X(W / 2 + 4.3), D / 2 - 1.75);
    const brand = c.sign('N3W YORKERS & CO.', { w: 5.2, h: 0.5, bg: null, fg: '#d8b878', font: c.SERIF, weight: 700 }); brand.position.set(0, 3.75, -1.62); brand.rotation.y = PI; win.add(brand);
    const spot = new THREE.PointLight(0xfff0d0, 6, 5); spot.position.set(0, 3.2, -0.8); win.add(spot);
    // pearls on velvet necks
    const pearl = new THREE.MeshPhysicalMaterial({ color: 0xfff8f0, roughness: 0.15, clearcoat: 1, sheen: 1 });
    for (const x of [-3.2, -1.1, 1.1, 3.2]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.7, 16), velvet); n.position.set(x, 1.3, -0.5); win.add(n); for (let k = 0; k < 3; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17 + k * 0.03, 0.018, 8, 40), pearl); ring.rotation.x = PI / 2 - 0.5; ring.position.set(x, 1.45 - k * 0.07, -0.47 + k * 0.02); win.add(ring); } }
    // Pepper's ghost: a figure in the glass that only exists from beside the lamp post
    const ghost = c.glb('gown', { h: 1.9, x: 0, y: 0.95, z: -0.5, ry: PI, parent: win, shadow: false, onload: (o) => o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0; m.material.depthWrite = false; m.userData.ghost = true; } }) });
    const SPOT = new THREE.Vector3(r.x0 + 15.6, 0, 3.4);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const d = Math.hypot(P.x - SPOT.x, P.z - SPOT.z), a = Math.max(0, 1 - d / 1.1) * 0.6;
      ghost.traverse((m) => { if (m.userData.ghost) m.material.opacity += (a - m.material.opacity) * Math.min(1, dt * 4); });
      if (a > 0.45) c.egg('pepper', 'Pepper\'s ghost: from beside the lamp post the glass shows who stood in this window at dawn. Step away and she is gone.');
    });
    // the real one, on the pavement, breakfast in hand, looking in
    const her = c.glb('gown', { h: 1.85, x: 7.2, z: 4.6, ry: PI - 0.3, parent: g }); c.post(X(7.2), 4.6, 0.45);
    c.clickable(her, () => { c.say(her, 'Nothing very bad could happen to you in a place that counts you.', 3600, 2.1); c.egg('tiffany'); }, 'Breakfast');
    const cart = prop(c, r, g, X, 'CoffeeCart_01', 3.4, -4.6, { len: 2.0, ry: 0.5, r: 0.9, egg: ['The coffee cart', 'breakfast', 'Coffee and a croissant at five in the morning, eaten at a shop window you cannot afford. The most New York meal there is.'], snd: 'ding' });
    prop(c, r, g, X, 'croissant', 3.0, -4.4, { len: 0.16, y: 1.02 });
    prop(c, r, g, X, 'street_lamp_01', 16.1, 3.4, { h: 4.6, r: 0.25 }); prop(c, r, g, X, 'street_lamp_01', 3.4, 1.4, { h: 4.6, r: 0.25 });
    prop(c, r, g, X, 'fire_hydrant', 18.8, 1.4, { h: 0.85, r: 0.3 }); prop(c, r, g, X, 'metal_trash_can', 17.4, -6.0, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'modular_street_seating', 12.6, -4.8, { len: 2.6, r: 1.1 });
    c.glb('checker', { len: 5.0, x: 1.6, z: -2.2, ry: 0.1, parent: g }); [-0.4, -2.2, -4].forEach((z) => c.post(X(1.6), z, 1.0));
  },

  rear(c, r, g, X, mats) {
    const { THREE } = c;
    // the window frame and half drawn blinds across the portal
    const frame = std(c, 0xece4d4, { roughness: 0.6 });
    for (const x of [4.05, 7, 10, 13, 15.95]) g.add(c.slab(0.14, PORTAL.h, 0.16, frame, x, PORTAL.h / 2, -D / 2 + 0.1));
    g.add(c.slab(PORTAL.w, 0.9, 0.3, mats.wall, W / 2, 0.45, -D / 2 + 0.1)); g.add(c.slab(PORTAL.w + 0.2, 0.08, 0.5, frame, W / 2, 0.92, -D / 2 + 0.18));
    c.wall(X(4), -D / 2 + 0.4, X(16), -D / 2 + 0.4);
    for (let k = 0; k < 9; k++) g.add(c.slab(PORTAL.w, 0.02, 0.07, std(c, 0xf0ead8), W / 2, PORTAL.h - 0.06 - k * 0.09, -D / 2 + 0.22));
    // the far side of the courtyard, in 3D: twelve windows, twelve lives, drawn live
    const FX0 = 0, FW = 20, FH = 16, FZ = -24, cols = 4, rows = 3, cw = 256, ch = 256;
    const atlas = c.canvasTex(cw * cols, ch * rows, () => {}), q = atlas.userData.canvas.getContext('2d');
    const fac = new THREE.Group(); fac.position.set(FX0, 0, FZ); g.add(fac);
    const brick = c.surf('brick', 2.4, 0x7a5040); fac.add(c.slab(FW, FH, 0.4, brick, FW / 2, FH / 2, 0));
    const win = []; const WW = 2.3, WH = 2.6;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, x = 2.6 + i * 4.9, y = 3.2 + j * 4.2, geo = new THREE.PlaneGeometry(WW, WH), uv = geo.attributes.uv;
      for (let v = 0; v < uv.count; v++) uv.setXY(v, (i + uv.getX(v)) / cols, 1 - (j + 1 - uv.getY(v)) / rows);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false, fog: false })); m.position.set(x, y, 0.22); fac.add(m); win.push(m);
      fac.add(c.slab(WW + 0.3, 0.2, 0.3, std(c, 0x3a2a20), x, y - WH / 2 - 0.1, 0.3));
      // fire escape balcony
      if (i % 2 === 0) { const fe = std(c, 0x1a1a1a, { metalness: 0.7 }); fac.add(c.slab(WW + 1.6, 0.06, 1.0, fe, x + 0.4, y - WH / 2 - 0.2, 0.8)); for (let b = 0; b < 8; b++) fac.add(c.slab(0.03, 0.9, 0.03, fe, x - 0.9 + b * 0.37 + 0.4, y - WH / 2 + 0.25, 1.28)); }
    }
    const roof = c.sign('N3W YORKERS · WEST 9TH', { w: 6, h: 0.7, bg: null, fg: '#ff4fa3', glow: 20 }); roof.position.set(FW / 2, FH + 0.6, 0.3); fac.add(roof);
    const WHO = ['dancer', 'composer', 'lonely', 'salesman', 'sleepers', 'painter', 'sculptor', 'newlyweds', 'tv', 'dog', 'empty', 'pigeons'];
    let caught = false, lastDraw = 0;
    const person = (x, y, s, col, t, pose = 0) => { q.fillStyle = col; q.fillRect(x - 10 * s, y - 34 * s, 20 * s, 48 * s); q.strokeStyle = col; q.lineWidth = 6 * s; q.beginPath(); q.moveTo(x - 9 * s, y - 28 * s); q.lineTo(x - 26 * s, y - 28 * s + Math.sin(t * 3 + pose) * 18 * s); q.moveTo(x + 9 * s, y - 28 * s); q.lineTo(x + 26 * s, y - 30 * s - Math.cos(t * 3 + pose) * 18 * s); q.moveTo(x - 6 * s, y + 14 * s); q.lineTo(x - 10 * s, y + 52 * s); q.moveTo(x + 6 * s, y + 14 * s); q.lineTo(x + 10 * s, y + 52 * s); q.stroke(); eyeFlower(q, x, y - 52 * s, 22 * s); };
    const draw = (t) => {
      WHO.forEach((w, k) => {
        const ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch; q.save(); q.beginPath(); q.rect(ox, oy, cw, ch); q.clip(); q.translate(ox, oy);
        const lit = !(w === 'empty' || (w === 'salesman' && caught && (t * 2 | 0) % 2) || (w === 'newlyweds'));
        q.fillStyle = lit ? ['#ffd98a', '#ffcf9a', '#f8e2b0'][k % 3] : '#141820'; q.fillRect(0, 0, cw, ch);
        if (w === 'newlyweds') { q.fillStyle = '#d8c090'; q.fillRect(0, 0, cw, ch); q.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < ch; y += 14) q.fillRect(0, y, cw, 3); }
        if (w === 'dancer') person(128 + Math.sin(t) * 60, 150, 1.4, '#3a1020', t * 2);
        if (w === 'composer') { q.fillStyle = '#222'; q.fillRect(30, 150, 140, 60); person(200, 150, 1.3, '#202840', t * 0.6, 1); }
        if (w === 'lonely') { q.fillStyle = '#704020'; q.fillRect(40, 170, 170, 12); person(80 + Math.sin(t * 0.4) * 20, 150, 1.2, '#402040', t * 0.3); q.fillStyle = '#fff'; q.fillRect(150, 160, 24, 10); q.fillRect(110, 160, 24, 10); }
        if (w === 'salesman') { const x = 128 + Math.sin(t * 0.5) * 70; person(x, 150, 1.3, '#202020', t * 0.5); q.fillStyle = '#5a3a20'; q.fillRect(x + 22, 170, 46, 34); if ((t * 0.5 | 0) % 3 === 0) { q.fillStyle = '#d0d0d0'; q.fillRect(x - 60, 120, 40, 8); } if (caught) { eyeFlower(q, 128, 110, 70); } }
        if (w === 'sleepers') { person(90, 190, 1, '#304050', 0); person(170, 190, 1, '#503040', 1); }
        if (w === 'painter') { q.fillStyle = '#fff'; q.fillRect(150, 60, 80, 110); eyeFlower(q, 190, 110, 30); person(90, 150, 1.3, '#205030', t * 1.5); }
        if (w === 'sculptor') { q.fillStyle = '#ccc'; q.beginPath(); q.ellipse(170, 170, 40, 60, 0, 0, 7); q.fill(); person(80, 150, 1.3, '#402818', t * 2); }
        if (w === 'tv') { q.fillStyle = '#88aaff'; q.fillRect(150, 110, 70, 55); person(90, 160, 1.2, '#302830', 0); }
        if (w === 'dog') { q.fillStyle = '#704020'; q.fillRect(60, 200, 130, 40); q.fillStyle = '#c8a070'; q.beginPath(); q.ellipse(125, 190, 30, 18, 0, 0, 7); q.fill(); }
        if (w === 'pigeons') { for (let b = 0; b < 6; b++) { q.fillStyle = '#556'; q.beginPath(); q.ellipse(40 + b * 34, 180 + Math.sin(t * 4 + b) * 6, 14, 9, 0, 0, 7); q.fill(); } }
        // the frame of the window
        q.strokeStyle = '#2a1a14'; q.lineWidth = 14; q.strokeRect(0, 0, cw, ch); q.lineWidth = 6; q.beginPath(); q.moveTo(cw / 2, 0); q.lineTo(cw / 2, ch); q.moveTo(0, ch / 2); q.lineTo(cw, ch / 2); q.stroke();
        q.restore();
      });
      atlas.needsUpdate = true;
    };
    draw(0);
    c.tick((t, dt, P, ri) => { if (ri !== r.i || t - lastDraw < 0.1) return; lastDraw = t; draw(t); });
    win.forEach((m, k) => c.clickable(m, () => {
      const w = WHO[k];
      if (w === 'salesman') { if (!c.P.zoom) { c.toast('Too far to see. Use the binoculars: press Z.'); return; } caught = true; c.sound.thud(0.4); c.shake(0.03); c.egg('salesman', 'You saw him. Worse, he saw you. Now he is looking straight at your window.'); }
      else if (w === 'dog') c.egg('dogbasket', 'Third floor, the dog in the basket. The dog knows too much about the flower bed.');
      else c.toast({ dancer: 'Miss Count, practising at the window, every night.', composer: 'The composer, one bar from finished since 1954.', lonely: 'Dinner for two. Again. She counts the chairs.', sleepers: 'Too hot to sleep inside. The fire escape it is.', painter: 'Somebody painting eye flowers. Very late, very good.', sculptor: 'The sculptor, carving a hunger.', newlyweds: 'The shade has been down since Tuesday.', tv: 'Channel 3. Nothing on. Watching anyway.', empty: 'For rent. Nobody counted.', pigeons: 'Pigeons. Of course pigeons.' }[w] || '');
    }, 'A window'));
    // the dog, lowered to the garden in a basket on a rope, and back
    const basket = new THREE.Group(); fac.add(basket); const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.4, 14, 1, true), std(c, 0x8a6030, { side: THREE.DoubleSide })); basket.add(bk);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 4), std(c, 0xccbb99)); fac.add(rope);
    c.tick((t) => { const y = 3 + (Math.sin(t * 0.25) * 0.5 + 0.5) * 9; basket.position.set(FW - 1.2, y, 1.6); rope.scale.y = FH - y; rope.position.set(FW - 1.2, (FH + y) / 2, 1.6); });
    c.clickable(basket, () => c.egg('dogbasket', 'The dog in the basket. Up and down all night. The dog knows too much about the flower bed.'), 'The basket');
    // the room
    const man = c.glb('lensman', { h: 1.5, x: 8.4, z: -5.2, ry: PI, parent: g }); c.post(X(8.4), -5.2, 0.7);
    c.clickable(man, () => { c.say(man, 'We have become a race of window watchers. Press Z and join us.', 3400, 1.8); c.egg('jeff'); }, 'The photographer');
    prop(c, r, g, X, 'WoodenTable_01', 12.2, -5.4, { len: 1.3, r: 0.6 });
    prop(c, r, g, X, 'binoculars', 12.0, -5.4, { len: 0.22, y: 0.78, egg: ['Binoculars', 'binocs', 'Binoculars. Everybody in this city is watching somebody. Press Z to put them down.'], fn: (c) => c.zoom(true) });
    prop(c, r, g, X, 'Camera_01', 12.5, -5.2, { h: 0.18, y: 0.78, ry: 2 }); prop(c, r, g, X, 'desk_lamp_arm_01', 12.6, -5.7, { h: 0.5, y: 0.78 });
    prop(c, r, g, X, 'ArmChair_01', 16.2, -3.6, { h: 1.0, ry: -0.8, r: 0.55 }); prop(c, r, g, X, 'Shelf_01', 19.6, -4.0, { len: 1.2, y: 1.6, ry: -PI / 2 }); prop(c, r, g, X, 'mantel_clock_01', 19.6, -4.0, { h: 0.3, y: 1.75, ry: -PI / 2 });
    prop(c, r, g, X, 'potted_plant_02', 3.2, -6.8, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'vintage_suitcase', 3.4, 4.6, { len: 0.7, egg: ['A suitcase', 'suitcase', 'A salesman\'s suitcase, here? Somebody went over there and came back with evidence.'] });
  },

  disco(c, r, g, X) {
    const { THREE } = c;
    // the floor: 176 glass tiles, instanced, each one remembers your foot
    const x1 = 2, x2 = 18, z1 = -6, z2 = 5, n = (x2 - x1) * (z2 - z1), heat = new Float32Array(n), seen = new Set();
    const tile = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, 0.06, 0.94), new THREE.MeshBasicMaterial({ toneMapped: false }), n); g.add(tile);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(), PAL = [0xff2e88, 0x22d3ee, 0xf5c542, 0x3b82f6, 0x9b5cff, 0x2ee88a].map((h) => new THREE.Color(h));
    for (let k = 0; k < n; k++) { const i = k % (x2 - x1), j = (k / (x2 - x1)) | 0; m4.makeTranslation(x1 + i + 0.5, 0.035, z1 + j + 0.5); tile.setMatrixAt(k, m4); }
    let strobe = false, music = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (strobe || music) { strobe = music = false; c.sound.disco(false); document.querySelector('#strobe').style.opacity = 0; } return; }
      const li = Math.floor(P.x - r.x0 - x1), lj = Math.floor(P.z - z1);
      if (li >= 0 && li < x2 - x1 && lj >= 0 && lj < z2 - z1) { const k = lj * (x2 - x1) + li; heat[k] = 1; seen.add(k); if (seen.size === 40) c.egg('floor', 'Forty tiles. Bay Ridge has never seen footwork like this, and Bay Ridge has seen footwork.'); }
      const beat = (t * 2) | 0;
      for (let k = 0; k < n; k++) { const i = k % (x2 - x1), j = (k / (x2 - x1)) | 0; col.copy(PAL[(i + j + beat) % PAL.length]).multiplyScalar(0.35 + 0.35 * ((i * 7 + j * 3 + beat) % 4 === 0)); if (heat[k] > 0) { col.lerp(new THREE.Color(1, 1, 1), heat[k]); heat[k] = Math.max(0, heat[k] - dt * 0.6); } tile.setColorAt(k, col); }
      tile.instanceColor.needsUpdate = true;
      document.querySelector('#strobe').style.opacity = strobe && ((t * 18) | 0) % 2 ? 0.92 : 0;
    });
    // the ball and its spots
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, flatShading: true, envMapIntensity: 3 })); ball.position.set(W / 2, 5.0, -0.5); g.add(ball);
    g.add(c.slab(0.02, 0.9, 0.02, std(c, 0x888888), W / 2, 5.6, -0.5));
    const spotM = new THREE.MeshBasicMaterial({ map: glowTex(c, 'rgba(255,255,255,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const spots = []; for (let k = 0; k < 36; k++) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), spotM.clone()); sm.material.color = PAL[k % PAL.length]; g.add(sm); spots.push({ sm, a: Math.random() * 6.3, h: Math.random() * 4 + 0.5 }); }
    c.tick((t) => { ball.rotation.y = t * 0.6; spots.forEach((s, k) => { const a = s.a + t * 0.6, side = k % 3; if (side === 0) { s.sm.position.set(W / 2 + Math.cos(a) * 9, s.h, D / 2 - 0.15); s.sm.rotation.set(0, PI, 0); } else if (side === 1) { s.sm.position.set(0.15 + (r.i > 0 ? 0 : 0), s.h, Math.sin(a) * 7); s.sm.rotation.set(0, PI / 2, 0); } else { s.sm.position.set(W / 2 + Math.cos(a) * 7, 0.1, Math.sin(a * 1.3) * 5); s.sm.rotation.set(-PI / 2, 0, 0); } }); });
    // the dancer
    const dn = c.glb('discoking', { h: 1.9, x: W / 2, y: 0.07, z: -2.4, ry: 0, parent: g, shadow: false }); c.post(X(W / 2), -2.4, 0.4);
    c.tick((t) => { dn.rotation.y = Math.sin(t * 1.2) * 0.8; dn.position.y = 0.07 + Math.abs(Math.sin(t * 4)) * 0.08; });
    c.clickable(dn, () => { c.say(dn, 'Would you just look at that floor? It is counting your steps.', 3200, 2.2); c.egg('discoking'); }, 'The dancer');
    // the booth
    const booth = new THREE.Group(); booth.position.set(18.2, 0, -6.6); g.add(booth);
    booth.add(c.slab(3.0, 1.1, 1.2, std(c, 0xc0c4cc, { metalness: 1, roughness: 0.2 }), 0, 0.55, 0)); c.post(X(18.2), -6.6, 1.3);
    const nb = c.sign('2001 N3W YORKERS', { w: 2.6, h: 0.4, bg: null, fg: '#22d3ee', glow: 22 }); nb.position.set(0, 0.6, 0.62); booth.add(nb);
    prop(c, r, g, X, 'cassette_player', 17.6, -6.6, { len: 0.35, y: 1.1 }); prop(c, r, g, X, 'vintage_radio_transceiver', 18.8, -6.7, { len: 0.45, y: 1.1 });
    const bS = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), basic(c, 0xffffff)); bS.position.set(-0.3, 1.13, 0.35); booth.add(bS);
    const bM = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), basic(c, 0xff2e88)); bM.position.set(0.3, 1.13, 0.35); booth.add(bM);
    c.clickable(bS, () => { strobe = !strobe; if (strobe) c.egg('strobe', 'Strobe on. Everyone moves in snapshots now. Your eyes are doing that, not the dancers.'); }, 'STROBE');
    c.clickable(bM, () => { music = !music; c.sound.disco(music); if (music) c.egg('needle'); }, 'MUSIC');
    // the bar
    g.add(c.slab(1.0, 1.1, 5.4, std(c, 0x2a1a30, { metalness: 0.4, roughness: 0.3 }), 0.8, 0.55, -1.8)); c.wall(X(1.3), -4.5, X(1.3), 0.9);
    [-3.6, -2.4, -1.2, 0].forEach((z) => prop(c, r, g, X, 'bar_chair_round_01', 1.9, z, { h: 0.8, r: 0.25 }));
    const cola = c.sign('NAZAR COLA', { w: 1.6, h: 0.32, bg: null, fg: '#ff3b3b', glow: 18 }); cola.position.set(0.16, 2.6, -1.8); cola.rotation.y = PI / 2; g.add(cola);
  },

  copa(c, r, g, X) {
    const { THREE } = c;
    // the kitchen, laid out so the long take has to weave
    const steel = std(c, 0xb8bcc0, { metalness: 0.9, roughness: 0.35 });
    const stockM = [std(c, 0xb0b4b8, { metalness: 1, roughness: 0.3 }), std(c, 0xc8b89a), std(c, 0x8a2a1a), std(c, 0x2a4a2a), std(c, 0xe8e0d0)];
    const shelfRow = (x0, x1, z) => { for (let x = x0; x < x1; x += 2.0) { prop(c, r, g, X, 'steel_frame_shelves_03', x + 1, z, { h: 1.9 });
      for (const y of [0.42, 0.98, 1.54]) for (let k = 0; k < 4; k++) { const kind = (x * 7 + y * 13 + k * 5) % 5 | 0, px = x + 0.3 + k * 0.42; if (kind === 0 || kind === 4) { const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.24, 16), stockM[0]); pt.position.set(px, y + 0.12, z); g.add(pt); } else { g.add(c.slab(0.3, 0.22 + (kind === 2 ? 0.12 : 0), 0.3, stockM[kind], px, y + 0.13, z)); } } } c.wall(X(x0), z - 0.35, X(x1), z - 0.35); c.wall(X(x0), z + 0.35, X(x1), z + 0.35); };
    shelfRow(2, 9, 1.8); shelfRow(11, 18, -2.4);
    // the line: a range with pots on it, steam
    g.add(c.slab(5, 0.92, 1.0, steel, 15.2, 0.46, 2.4)); c.wall(X(12.7), 1.9, X(17.7), 1.9); c.wall(X(12.7), 2.9, X(17.7), 2.9);
    const pot = std(c, 0x9a9ca0, { metalness: 1, roughness: 0.3 });
    [13.4, 14.8, 16.2].forEach((x, k) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.4 - k * 0.08, 20), pot); p.position.set(x, 1.12, 2.4); g.add(p); steam(c, g, x, 1.4, 2.4); });
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.06, 20), pot); pan.position.set(16.9, 0.97, 2.2); g.add(pan);
    c.clickable(pan, () => { c.sound.clink(900); c.egg('sauce', 'Sunday gravy, Tuesday night. Garlic sliced so thin it dissolves. Do not let it burn.'); }, 'The pan');
    [[3, -5.6], [3.6, -4.8]].forEach(([x, z]) => prop(c, r, g, X, 'wooden_crate_01', x, z, { h: 0.6, r: 0.45 }));
    prop(c, r, g, X, 'wooden_crate_02', 3.3, -5.2, { h: 0.55, y: 0.6, ry: 0.3 }); prop(c, r, g, X, 'cardboard_box_01', 7.4, 5.4, { h: 0.5, r: 0.35 }); prop(c, r, g, X, 'wine_barrel_01', 18.6, 5.2, { h: 1.0, r: 0.5 });
    prop(c, r, g, X, 'plastic_crate_01', 1.0, 6.6, { h: 0.32 }); prop(c, r, g, X, 'Barrel_01', 19.2, 0.6, { h: 0.9, r: 0.4 });
    ['mounted_fluorescent_lights'].forEach((nm) => [4, 10, 16].forEach((x) => prop(c, r, g, X, nm, x, 0, { len: 1.3, y: 5.85 })));
    // a table set for you, by the stage, when you get there
    const tb = new THREE.Group(); tb.position.set(W / 2, 0, -5.9); tb.visible = false; g.add(tb);
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.74, 24), std(c, 0xf4efe6, { roughness: 0.9 })); cloth.position.y = 0.37; tb.add(cloth);
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 16, 1, true), basic(c, 0xffd890)); lamp.position.y = 0.95; tb.add(lamp);
    tb.add(c.slab(0.02, 0.2, 0.02, std(c, 0xb08a3a, { metalness: 1 }), 0, 0.83, 0));
    // the maitre d' and the long take
    const md = c.glb('maitre', { h: 1.95, x: 12.2, z: 5.0, ry: -0.6, parent: g }); c.post(X(12.2), 5.0, 0.45);
    const V = (x, z, y = 1.62) => new THREE.Vector3(r.x0 + x, y, z);
    const path = new THREE.CatmullRomCurve3([V(10, 5.6), V(12.4, 4.2), V(10.6, 3.1), V(9.8, 0.3, 1.66), V(6.2, -0.4), V(2.4, -0.9, 1.7), V(1.4, -2.6), V(3.0, -3.9), V(6.6, -3.6), V(9.4, -3.9, 1.5), V(10, -4.0, 1.42)], false, 'centripetal');
    let riding = false;
    c.clickable(md, () => {
      if (riding) return; riding = true; c.say(md, 'Right this way. Through the kitchen, everybody does.', 2600, 2.3); c.sound.chords(14); if (c.P.zoom) c.zoom(false);
      setTimeout(() => c.ride(path, 14, () => { tb.visible = true; riding = false; c.P.yaw = 0; c.P.pitch = -0.08; c.egg('copa', 'One take, no cuts, best table in the house. In the Copa, you never wait in line.'); }), 600);
    }, 'The maitre d\'');
    const wall_ = c.sign('KITCHEN ONLY · N3W YORKERS', { w: 3.6, h: 0.4, bg: '#111', fg: '#f4ead2', font: c.MONO, weight: 700 }); wall_.position.set(W / 2, 3.2, D / 2 - 0.15); wall_.rotation.y = PI; g.add(wall_);
  },

  walking(c, r, g, X) {
    const { THREE } = c;
    // the crosswalk
    const stripe = std(c, 0xeeeee4, { roughness: 0.8 });
    for (let x = 0.6; x < W; x += 1.0) g.add(c.slab(0.5, 0.02, 3.2, stripe, x, 0.01, 1.0));
    const wk = c.sign('WALK', { w: 0.9, h: 0.4, bg: '#111', fg: '#f4ead2', font: c.MONO, weight: 700 }), dw = c.sign('DONT WALK', { w: 0.9, h: 0.4, bg: '#111', fg: '#ff5a2a', font: c.MONO, weight: 700 });
    const sig = new THREE.Group(); sig.position.set(17.6, 2.8, 3.4); g.add(sig); sig.add(wk); sig.add(dw); wk.position.y = 0.45; g.add(c.slab(0.1, 2.6, 0.1, std(c, 0x1a1a1a), 17.6, 1.3, 3.3)); c.post(X(17.6), 3.3, 0.2);
    // the cab, every twelve seconds or so, straight up the avenue at you
    const cab = c.glb('checker', { len: 5.0, x: 10, z: -26, ry: 0, parent: g });
    const hu = c.glb('hustler', { h: 1.7, x: 4, z: 1.2, ry: PI / 2, parent: g });
    let cz = -26, next = 4, run = false, slow = 0, banged = false, hx = 4, hd = 1;
    c.tick((t, dt, P, ri, rdt) => {
      if (ri !== r.i) { c.TIME.target = 1; return; }
      // the hustler crosses and recrosses
      hx += hd * dt * 0.7; if (hx > 16) hd = -1; if (hx < 4) hd = 1; hu.position.x = hx; hu.rotation.y = hd > 0 ? PI / 2 : -PI / 2;
      next -= dt; if (next <= 0 && !run) { run = true; cz = -26; banged = false; c.sound.horn(0.2); }
      if (run) {
        const stop = -2.4, v = cz < stop - 6 ? 14 : Math.max(0, (stop - cz) * 2.2);
        cz += v * dt; cab.position.z = cz;
        const inLane = Math.abs(P.x - (r.x0 + 10)) < 2.2 && P.z > -3 && P.z < 4, near = stop - cz < 9;
        if (near && inLane && slow <= 0 && cz < stop - 1) { slow = 2.6; c.TIME.target = 0.12; c.sound.screech(); c.egg('bullet', 'Time slows the way it does when a Checker cab is two feet from your shins on Sixth Avenue.'); }
        if (stop - cz < 0.3) { run = false; next = 11 + Math.random() * 5; setTimeout(() => { cab.position.z = -26; }, 3000);
          if (!banged && Math.abs(hx - 10) < 4) { banged = true; c.sound.thud(0.6); c.say(hu, 'I\'M WALKIN\' HERE! I\'M COUNTED HERE!', 3000, 2.0); } }
      }
      if (slow > 0) { slow -= rdt; if (slow <= 0) c.TIME.target = 1; }
    });
    c.clickable(cab, () => { c.sound.thud(0.7); c.shake(0.05); c.say(cab, 'HEY! I\'M WALKIN\' HERE!', 2400, 1.8); c.egg('walking', 'You banged on the hood of a moving cab on Sixth Avenue. You are a New Yorker now. It is official.'); }, 'The hood');
    c.clickable(hu, () => { c.say(hu, 'Ratso? Never heard of him. I am a New Yorker.', 2800, 2.0); c.egg('hustler'); }, 'The hustler');
    // the block
    prop(c, r, g, X, 'street_lamp_02', 2.0, -5.0, { h: 4.6, r: 0.25 }); prop(c, r, g, X, 'street_lamp_02', 18.2, -5.0, { h: 4.6, r: 0.25 });
    prop(c, r, g, X, 'fire_hydrant', 17.6, 5.2, { h: 0.85, r: 0.3 }); prop(c, r, g, X, 'metal_trash_can', 2.6, 3.4, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'water_manhole_cover', 13.4, -4.2, { len: 0.85 }); steam(c, g, 13.4, 0.1, -4.2);
    prop(c, r, g, X, 'concrete_road_barrier', 17.2, -6.6, { len: 2, r: 0.9 }); prop(c, r, g, X, 'utility_box_01', 19.4, -2.6, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'cardboard_box_01', 1.0, 6.8, { h: 0.5 }); prop(c, r, g, X, 'cardboard_box_01', 1.4, 6.4, { h: 0.45, ry: 0.5 });
    [[6, 2.2], [6.6, 1.6], [7.2, 2.5]].forEach(([x, z], k) => { const pg = c.glb('pigeon', { h: 0.3, x, z, ry: k * 2, parent: g }); c.tick((t) => { pg.position.y = cz > -8 && Math.abs(cz) < 26 ? Math.min(3, pg.position.y + 0.08) : Math.max(0, pg.position.y - 0.05); }); });
  },
});

// a seated or standing extra: a coloured body and an eye flower head that can turn to look at you
const HEAD = {};
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0 } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head; return o;
}

Object.assign(ROOM, {
  katz(c, r, g, X) {
    const { THREE } = c;
    // the room: twelve tables, twenty patrons, a counter, and one table with a sign over it
    const patrons = [], cols = [0x6a3a3a, 0x3a4a6a, 0x4a5a3a, 0x6a5a3a, 0x5a3a5a, 0x2a2a3a];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = 3 + i * 3.6, z = -4.6 + j * 3.3; if (i === 1 && j === 1) continue;
      prop(c, r, g, X, 'WoodenTable_01', x, z, { len: 1.2, r: 0.7 });
      [-0.75, 0.75].forEach((dz, k) => { prop(c, r, g, X, 'dining_chair_02', x, z + dz, { h: 0.9, ry: k ? PI : 0 }); if ((i + j + k) % 3) patrons.push(extra(c, g, x, z + dz * 1.05, { seated: true, col: cols[(i * 3 + j + k) % 6], ry: k ? PI : 0 })); });
      if ((i + j) % 2) prop(c, r, g, X, 'hamburger_buns', x + 0.2, z, { len: 0.25, y: 0.76 });
    }
    // her table
    const tx = 6.6, tz = -1.3; c.post(X(tx), tz, 0.7);
    const sally = c.glb('sally', { h: 1.4, x: tx, z: tz, ry: 0.3, parent: g });
    const sg = c.sign('WHERE YOU GOT COUNTED.\nHOPE YOU HAD WHAT THEY HAD!', { w: 2.2, h: 0.5, bg: '#f4ead2', fg: '#a01818', font: c.SERIF, weight: 800, border: '#a01818' }); sg.position.set(tx, 3.2, tz); g.add(sg);
    g.add(c.slab(0.01, 1.0, 0.01, std(c, 0x222222), tx - 0.9, 3.95, tz)); g.add(c.slab(0.01, 1.0, 0.01, std(c, 0x222222), tx + 0.9, 3.95, tz));
    let stare = 0;
    const look = () => { stare = 4.5; c.sound.room('silence'); setTimeout(() => c.say(patrons[3], 'I\'ll have what she\'s counting.', 3400, 1.4), 2200); c.egg('katz', 'The whole room turned to look. It does that when somebody really enjoys their order.'); };
    c.clickable(sally, look, 'Her table');
    const v = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (stare > 0) { stare -= dt; if (stare <= 0) c.sound.room('katz'); } patrons.forEach((p, k) => { const hd = p.userData.head; if (stare > 0) { hd.getWorldPosition(v); const a = Math.atan2(P.x - v.x, P.z - v.z) - p.rotation.y; hd.rotation.y += (a - hd.rotation.y) * Math.min(1, dt * 5); } else hd.rotation.y += (Math.sin(t * 0.6 + k) * 0.25 - hd.rotation.y) * Math.min(1, dt * 2); }); });
    // the counter, the salamis, the ticket
    g.add(c.slab(1.0, 1.1, 9, std(c, 0xd8d0c0, { roughness: 0.4 }), W - 1.0, 0.55, -1.6)); c.wall(X(W - 1.6), -6.1, X(W - 1.6), 2.9);
    g.add(c.slab(1.1, 0.06, 9.1, std(c, 0x9aa0a6, { metalness: 0.9, roughness: 0.3 }), W - 1.0, 1.13, -1.6));
    prop(c, r, g, X, 'CashRegister_01', W - 1.0, 2.2, { h: 0.4, y: 1.16, ry: -PI / 2 });
    const sal = std(c, 0x6a2a1a, { roughness: 0.6 });
    for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), sal); m.position.set(W - 0.5, 3.2 + (k % 2) * 0.2, -5.5 + k * 0.7); g.add(m); }
    const tk = c.sign('DON\'T LOSE\nYOUR TICKET', { w: 1.0, h: 0.5, bg: '#ffd84a', fg: '#111', weight: 900 }); tk.position.set(W - 1.55, 1.6, 3.6); tk.rotation.y = -PI / 2; g.add(tk);
    c.clickable(tk, () => { c.sound.ticket(); c.egg('ticket', 'Do not lose your ticket. Lose it and you pay for the whole deli. That rule is older than the census.'); }, 'The ticket');
  },

  feast(c, r, g, X) {
    const { THREE } = c;
    // forced perspective: each arch of bulbs is smaller and lower than the last, so the street reads three times as long.
    // Walk to the end and you stand taller than the arches.
    const bulbM = basic(c, 0xffd890), bulbG = new THREE.SphereGeometry(0.07, 8, 6);
    const N = 9, pos = [];
    for (let k = 0; k < N; k++) { const s = Math.pow(0.82, k), z = 6 - k * 1.55, w = 9 * s, h = 5.8 * s; for (let a = 0; a <= 28; a++) { const u = a / 28, ang = PI * u; pos.push([W / 2 - Math.cos(ang) * w, h * 0.55 + Math.sin(ang) * h * 0.45, z]); } [-1, 1].forEach((sd) => g.add(c.slab(0.14 * s, h * 0.55, 0.14 * s, std(c, 0x5a4020), W / 2 + sd * w, h * 0.275, z))); }
    const inst = new THREE.InstancedMesh(bulbG, bulbM, pos.length), m4 = new THREE.Matrix4(); pos.forEach((p, k) => { m4.makeTranslation(...p); inst.setMatrixAt(k, m4); }); g.add(inst);
    for (let k = 0; k < N; k++) { const s = Math.pow(0.82, k); c.post(X(W / 2 - 9 * s), 6 - k * 1.55, 0.15); c.post(X(W / 2 + 9 * s), 6 - k * 1.55, 0.15); }
    let giant = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (!giant && P.z < -5.2) { giant = true; c.egg('giant', 'Forced perspective. The arches only shrink, you never grew. On Mulberry Street in 1917 you are now three storeys tall.'); } });
    // the stalls
    const stall = (x, z, name, col) => { const st = new THREE.Group(); st.position.set(x, 0, z); g.add(st); st.add(c.slab(2.2, 1.0, 0.9, std(c, 0x6a4a2a), 0, 0.5, 0)); for (let k = 0; k < 6; k++) st.add(c.slab(0.37, 0.05, 1.2, std(c, k % 2 ? 0xffffff : col), -0.92 + k * 0.37, 2.2, 0.1)); [-1, 1].forEach((sd) => st.add(c.slab(0.06, 2.2, 0.06, std(c, 0x3a2a1a), sd * 1.05, 1.1, 0.6))); const sg = c.sign(name, { w: 2.0, h: 0.32, bg: '#f4ead2', fg: '#8a1a1a', font: c.SERIF, weight: 900 }); sg.position.set(0, 1.5, 0.66); st.add(sg); c.post(X(x), z, 1.1); return st; };
    const can = stall(2.4, -2.0, 'N3W YORKERS CANNOLI', 0x2a8a3a); stall(17.6, -2.0, 'ZEPPOLE · SAUSAGE', 0xc82a2a); stall(17.6, 2.6, 'NAZAR COLA', 0x1d4ed8);
    const cream = std(c, 0xf4ecd8); for (let k = 0; k < 8; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10), std(c, 0xc8903a)); m.rotation.z = PI / 2; m.position.set(-0.8 + k * 0.22, 1.06, 0.1); can.add(m); const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), cream); e.position.set(-0.8 + k * 0.22 + 0.1, 1.06, 0.1); can.add(e); }
    c.clickable(can, () => { c.sound.pop(); c.egg('cannoli', 'Leave the phone. Take the cannoli.'); }, 'Cannoli');
    // the saint, carried up the street, covered in dollar bills; pin one on
    const saint = prop(c, r, g, X, 'gothic_statue', 10, -4.4, { h: 2.0, y: 0.6, r: 0.9 }); g.add(c.slab(1.4, 0.6, 1.4, std(c, 0xd8c8a0), 10, 0.3, -4.4));
    const bill = std(c, 0x8ab88a, { side: THREE.DoubleSide }); let pinned = 0;
    c.clickable(saint, () => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), bill); b.position.set(10 + (Math.random() - 0.5) * 0.5, 1.2 + Math.random() * 1.2, -3.9); b.rotation.set(0, 0, (Math.random() - 0.5) * 1); g.add(b); if (++pinned === 3) c.egg('saint', 'Three dollars pinned to the saint. The band plays a little louder for you.'); c.sound.ding(); }, 'Pin a dollar');
    prop(c, r, g, X, 'wooden_barrels_01', 1.4, 2.6, { h: 1.0, r: 0.6 }); prop(c, r, g, X, 'wooden_crate_01', 3.6, -3.2, { h: 0.6 }); prop(c, r, g, X, 'painted_wooden_bench', 14.4, 5.6, { len: 1.8, r: 0.8 });
    prop(c, r, g, X, 'lantern_chandelier_01', 10, 2, { h: 1.0, y: 6.4 });
  },

  westside(c, r, g, X) {
    const { THREE } = c;
    // a fire escape you can climb: two flights up the south wall to a top landing
    const iron = std(c, 0x1c1c1e, { metalness: 0.7, roughness: 0.5 }), z1 = 6.6, z2 = 7.8, H1 = 2.8, H2 = 5.6;
    const runs = [[2.2, 7.4, 0, H1], [7.4, 9.2, H1, H1], [9.2, 14.4, H1, H2], [14.4, 19.6, H2, H2]];
    runs.forEach(([a, b, h0, h1]) => { const L = b - a, n = Math.max(1, Math.round(L / 0.3)); for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, y = h0 + (h1 - h0) * u; g.add(c.slab(L / n * 0.92, 0.05, z2 - z1, iron, a + L * u, y, (z1 + z2) / 2)); } for (let k = 0; k <= L / 0.4; k++) { const x = a + k * 0.4, y = h0 + (h1 - h0) * (k * 0.4 / L); g.add(c.slab(0.03, 1.0, 0.03, iron, x, y + 0.5, z1)); } const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, Math.hypot(L, h1 - h0), 6), iron); rail.rotation.z = PI / 2 - Math.atan2(h1 - h0, L); rail.position.set(a + L / 2, (h0 + h1) / 2 + 1.0, z1); g.add(rail); });
    c.wall(X(3.0), z1, X(W), z1);
    r.ground = (lx, z) => { if (z < z1) return 0; for (const [a, b, h0, h1] of runs) if (lx >= a && lx <= b) return h0 + (h1 - h0) * (lx - a) / (b - a); return 0; };
    const maria = c.glb('maria', { h: 1.65, x: 18.4, y: H2, z: 7.2, ry: -PI / 2, parent: g, shadow: false });
    let met = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i || met) return; if (P.y > H2 + 1 && P.x - r.x0 > 16) { met = true; c.say(maria, 'You climbed a fire escape for me. Very West Side. Very 1961.', 3600, 2.0); c.egg('tonight', 'Top of the fire escape, dusk, the whole block below. Some nights the city is a musical.'); } });
    // the court: a hoop and a ball
    const hoop = new THREE.Group(); hoop.position.set(16.5, 0, -4.8); g.add(hoop); hoop.add(c.slab(0.12, 3.0, 0.12, iron, 0, 1.5, -0.5)); hoop.add(c.slab(1.6, 1.0, 0.06, std(c, 0xf0f0f0), 0, 3.4, -0.4));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 20), std(c, 0xff5a1a)); rim.rotation.x = PI / 2; rim.position.set(0, 3.05, -0.1); hoop.add(rim); c.post(X(16.5), -5.3, 0.3);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), std(c, 0xd8601a, { roughness: 0.7 })); ball.position.set(13.5, 0.12, -2.4); g.add(ball);
    let shot = null;
    c.clickable(ball, () => { if (!shot) { shot = 0; c.sound.whoosh(0.3, 0.9); } }, 'The ball');
    c.tick((t, dt) => { if (shot === null) return; shot += dt; const u = Math.min(1, shot / 1.1), a = new THREE.Vector3(13.5, 0.12, -2.4), b = new THREE.Vector3(16.5, 3.05, -4.9); ball.position.lerpVectors(a, b, u); ball.position.y += Math.sin(u * PI) * 2.2; if (u >= 1) { shot = null; c.sound.clink(800); ball.position.copy(a); c.egg('swish', 'Nothing but net on a West Side court. Somebody snaps their fingers in approval.'); } });
    [6.6, 8.4].forEach((x, k) => { const o = c.glb('tough', { h: 1.85, x, z: -5.8, ry: 0.2 - k * 0.4, parent: g }); c.post(X(x), -5.8, 0.4); c.tick((t) => { o.position.y = Math.abs(Math.sin(t * 2.6 + k)) * 0.05; }); c.clickable(o, () => { c.sound.tick(); setTimeout(() => c.sound.tick(), 300); c.egg('snap', 'Two snaps. In this neighbourhood that is a whole conversation.'); }, 'Snap'); });
    prop(c, r, g, X, 'metal_trash_can', 1.2, -1, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'wooden_crate_02', 19.1, -2.4, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'street_lamp_01', 1.4, -6.2, { h: 4.6, r: 0.25 });
  },

  loft(c, r, g, X) {
    const { THREE } = c;
    // the wheel and the clay: click to shape, five shapes, the last is an eye flower vase
    const wheel = new THREE.Group(); wheel.position.set(8, 0, -2.6); g.add(wheel);
    wheel.add(c.slab(1.0, 0.6, 1.0, std(c, 0x8a8478, { roughness: 0.7 }), 0, 0.3, 0)); const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 32), std(c, 0x5a5a5a, { metalness: 0.6 })); disc.position.y = 0.63; wheel.add(disc); c.post(X(8), -2.6, 0.7);
    prop(c, r, g, X, 'wooden_stool_01', 8, -1.7, { h: 0.5 });
    const SH = [[[0, 0], [0.18, 0], [0.2, 0.15], [0.14, 0.3], [0.08, 0.32]], [[0, 0], [0.12, 0], [0.26, 0.12], [0.3, 0.2]], [[0, 0], [0.12, 0], [0.15, 0.2], [0.06, 0.42], [0.05, 0.56], [0.08, 0.6]], [[0, 0], [0.14, 0], [0.16, 0.22], [0.15, 0.3]], [[0, 0], [0.16, 0], [0.24, 0.16], [0.12, 0.34], [0.2, 0.46], [0.26, 0.5]]];
    const clayM = std(c, 0xa0602e, { roughness: 0.55 }); let clay = null, si = 0, made = 0;
    const shape = (k) => { if (clay) wheel.remove(clay); clay = new THREE.Mesh(new THREE.LatheGeometry(SH[k].map(([x, y]) => new THREE.Vector2(x, y)), 32), clayM); clay.position.y = 0.66; wheel.add(clay); c.clickable(clay, click, 'Shape the clay'); };
    const click = () => { si = (si + 1) % SH.length; shape(si); c.sound.whoosh(0.15, 0.6); if (++made === 5) c.egg('pottery', 'Five pots and not one of them stood up. The clay remembers your hands anyway.'); };
    shape(0); c.tick((t) => { if (clay) clay.rotation.y = t * 7; disc.rotation.y = t * 7; });
    // the token on the door: it climbs only while your back is turned
    const door = new THREE.Group(); door.position.set(W - 0.2, 0, -4.6); door.rotation.y = -PI / 2; g.add(door);
    door.add(c.slab(1.4, 2.6, 0.08, std(c, 0x5a3a24), 0, 1.3, 0));
    const tok = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 20), std(c, 0xd8b048, { metalness: 1, roughness: 0.25 })); tok.rotation.x = PI / 2; tok.position.set(0.3, 0.2, 0.06); door.add(tok);
    const fw = new THREE.Vector3(), tw = new THREE.Vector3(); let caught = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tok.getWorldPosition(tw); c.camera.getWorldDirection(fw); const dx = tw.x - P.x, dz = tw.z - P.z, d = Math.hypot(dx, dz), seen = (dx * fw.x + dz * fw.z) / (d * Math.hypot(fw.x, fw.z) + 1e-6) > 0.6; if (!seen && tok.position.y < 2.4) tok.position.y += dt * 0.25; if (seen && tok.position.y > 1.2 && !caught) { caught = true; c.egg('penny', 'The token climbed the door while you were not looking. Somebody in this loft never left.'); } });
    // the jukebox
    const jb = new THREE.Group(); jb.position.set(2.2, 0, -6.4); jb.rotation.y = 0.5; g.add(jb);
    jb.add(c.slab(1.0, 1.5, 0.6, std(c, 0x8a3a1a, { roughness: 0.4 }), 0, 0.75, 0)); const arc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 24, 1, false, 0, PI), basic(c, 0xffa040)); arc.rotation.set(PI / 2, 0, PI / 2); arc.position.y = 1.5; jb.add(arc); c.post(X(2.2), -6.4, 0.6);
    c.clickable(jb, () => { c.sound.chords(8); c.egg('jukebox', 'You know the song this jukebox wants to play. We cannot play it for licensing reasons, so hum.'); }, 'The jukebox');
    [['ceramic_vase_01', 0.4], ['ceramic_vase_03', 0.35]].forEach(([nm, h], k) => [0, 1, 2].forEach((j) => prop(c, r, g, X, nm, 3 + j * 0.6 + k * 0.3, -7.6, { h, y: 1.0 + k * 0.6 })));
    g.add(c.slab(3.2, 0.05, 0.4, std(c, 0x6a4a2a), 3.9, 1.0, -7.6)); g.add(c.slab(3.2, 0.05, 0.4, std(c, 0x6a4a2a), 3.9, 1.6, -7.6));
    prop(c, r, g, X, 'Sofa_01', 14.2, 1.6, { len: 2.2, ry: -PI / 2, r: 1.0 }); prop(c, r, g, X, 'Rockingchair_01', 16.6, -3.4, { h: 1.1, ry: -0.6, r: 0.5, spin: 1.2 }); prop(c, r, g, X, 'lantern_chandelier_01', 8, -2.6, { h: 0.9, y: 4.6 }); prop(c, r, g, X, 'potted_plant_02', 18.8, -6.8, { h: 1.4, r: 0.4 });
    for (const x of [5, 10, 15]) g.add(c.slab(0.36, H_IN, 0.36, std(c, 0x7a7a74, { metalness: 0.5 }), x, H_IN / 2, 2.8)), c.post(X(x), 2.8, 0.25);
  },

  wallst(c, r, g, X) {
    const { THREE } = c;
    // the ticker: a strip of LED around three walls; every click you make in here moves YOUR price
    let you = 1.0;
    const tick = c.canvasTex(2048, 64, () => {}), tq = tick.userData.canvas.getContext('2d'); tick.wrapS = THREE.RepeatWrapping; tick.repeat.x = 2;
    const draw = () => { tq.fillStyle = '#020802'; tq.fillRect(0, 0, 2048, 64); tq.font = '700 40px monospace'; tq.fillStyle = '#5aff7a'; tq.fillText(`N3W 7542 UP 11   EYE 31.11 UP 2   NAZAR 4.20 DOWN 1   MLOW 317 UP 317   YOU ${you.toFixed(2)} UP   COUNTED 1111 UP   PIGEON 0.25 FLAT   `, 0, 46); tick.needsUpdate = true; };
    draw();
    const strip = (len, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.42), new THREE.MeshBasicMaterial({ map: tick, toneMapped: false })); m.position.set(x, 4.9, z); m.rotation.y = ry; g.add(m); };
    strip(W - 0.4, W / 2, D / 2 - 0.16, PI); strip(D - 0.4, 0.16, 0, PI / 2); strip(D - 0.4, W - 0.16, 0, -PI / 2);
    c.tick((t, dt, P, ri) => { if (ri === r.i) tick.offset.x = (t * 0.06) % 1; });
    const bump = () => { you *= 1.11; draw(); if (you > 3) c.egg('bull', 'Your share price tripled because you clicked things on a trading floor. That is, honestly, how it works.'); };
    // the desks, screens and phones
    const scr = c.canvasTex(256, 192, (q) => { q.fillStyle = '#031203'; q.fillRect(0, 0, 256, 192); q.font = '700 18px monospace'; q.fillStyle = '#4aff6a'; ['N3W   7542  +11', 'EYE   31.11 +2', 'NAZAR 4.20  -1', 'MLOW  317   +317', 'TAXI  2.50  FLAT', 'BAGEL 1.25  +0.25'].forEach((l, k) => q.fillText(l, 12, 30 + k * 28)); });
    const phones = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const x = 4 + i * 6, z = -4.6 + j * 3.4; g.add(c.slab(4.2, 0.76, 1.2, std(c, 0x3a3226), x, 0.38, z)); c.wall(X(x - 2.1), z - 0.6, X(x + 2.1), z - 0.6); c.wall(X(x - 2.1), z + 0.6, X(x + 2.1), z + 0.6);
      [-1.2, 0, 1.2].forEach((dx) => { g.add(c.slab(0.6, 0.48, 0.5, std(c, 0xd8d0c0), x + dx, 1.0, z - 0.2)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); sc.position.set(x + dx, 1.02, z + 0.06); g.add(sc); });
      [-0.6, 0.6].forEach((dx) => { const ph = c.slab(0.32, 0.1, 0.22, std(c, 0x1a1a1a), x + dx, 0.81, z + 0.35); g.add(ph); const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), basic(c, 0xff2020)); led.position.set(x + dx + 0.12, 0.88, z + 0.42); led.visible = false; g.add(led); phones.push({ ph, led, ring: false }); c.clickable(ph, () => { const p = phones.find((q) => q.ph === ph); if (p.ring) { p.ring = false; p.led.visible = false; c.toast(['Buy N3W. All of it.', 'Sell the bagels, keep the schmear.', 'MLow is on line two. He says count everyone.', 'Lunch is for people who are not counted.'][Math.random() * 4 | 0]); c.egg('phone'); } bump(); }, 'A phone'); });
      prop(c, r, g, X, 'GreenChair_01', x - 1, z + 1.0, { h: 0.95, ry: PI }); prop(c, r, g, X, 'GreenChair_01', x + 1, z + 1.0, { h: 0.95, ry: PI });
    }
    let nextRing = 2;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; nextRing -= dt; if (nextRing <= 0) { nextRing = 1.5 + Math.random() * 2.5; const p = phones[Math.random() * phones.length | 0]; p.ring = true; for (let k = 0; k < 4; k++) setTimeout(() => c.sound.beep(1400 + (k % 2) * 200, 0.04, 0.12, 'square'), k * 140); } phones.forEach((p) => { if (p.ring) p.led.visible = (t * 6 | 0) % 2 === 0; }); });
    const br = c.glb('broker', { h: 1.9, x: 13.6, z: 5.0, ry: PI + 0.5, parent: g }); c.post(X(13.6), 5.0, 0.45);
    c.clickable(br, () => { c.say(br, 'Counting, for lack of a better word, is good. Counting is right. Counting works.', 3800, 2.2); c.egg('broker'); bump(); }, 'The broker');
    // three clocks, on the real time in three cities
    [['TOKYO', 9], ['LONDON', 0], ['NEW YORK', -5]].forEach(([nm, off], k) => { const ck = c.canvasTex(256, 300, () => {}), q = ck.userData.canvas.getContext('2d'), m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.05), new THREE.MeshBasicMaterial({ map: ck, transparent: true, toneMapped: false })); m.position.set(6 + k * 4, 3.6, -D / 2 + 0.06); g.add(m);
      let last = -1; c.tick(() => { const d = new Date(), mi = d.getUTCMinutes(); if (mi === last) return; last = mi; const h = (d.getUTCHours() + off + 24) % 24; q.clearRect(0, 0, 256, 300); q.fillStyle = '#f4f4ee'; q.beginPath(); q.arc(128, 128, 120, 0, 7); q.fill(); q.strokeStyle = '#111'; q.lineWidth = 8; q.stroke(); const hand = (a, l, w) => { q.lineWidth = w; q.beginPath(); q.moveTo(128, 128); q.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); q.stroke(); }; hand((h % 12 + mi / 60) / 12 * 2 * PI, 60, 10); hand(mi / 60 * 2 * PI, 95, 6); q.fillStyle = '#f4ead2'; q.font = '700 30px monospace'; q.textAlign = 'center'; q.fillText(nm, 128, 290); ck.needsUpdate = true; }); });
  },

  pigeons(c, r, g, X) {
    const { THREE } = c;
    // snow
    const NS = c.MOBILE ? 500 : 1400, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) { sp[k * 3] = Math.random() * W; sp[k * 3 + 1] = Math.random() * 10; sp[k * 3 + 2] = (Math.random() - 0.5) * D; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false })); snow.frustumCulled = false; g.add(snow);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NS; k++) { sp[k * 3 + 1] -= dt * (0.6 + (k % 5) * 0.1); sp[k * 3] += Math.sin(t + k) * dt * 0.2; if (sp[k * 3 + 1] < 0) sp[k * 3 + 1] = 10; } sg.attributes.position.needsUpdate = true; });
    // four hundred pigeons: they peck, and they leave all at once when you run at them
    const NP = c.MOBILE ? 180 : 400, body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6).scale(1, 0.8, 1.5), std(c, 0x6a7080, { roughness: 0.8 }), NP), head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), std(c, 0x4a6a5a, { roughness: 0.6 }), NP);
    g.add(body); g.add(head); body.frustumCulled = head.frustumCulled = false;
    const B = []; for (let k = 0; k < NP; k++) B.push({ x: 2 + Math.random() * 16, z: -6.5 + Math.random() * 12, y: 0.1, vy: 0, vx: 0, vz: 0, a: Math.random() * 6.3, fly: 0, home: null });
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
    let lastX = 0, lastZ = 0, flew = 0, lady = null;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const lx = P.x - r.x0, spd = Math.hypot(lx - lastX, P.z - lastZ) / Math.max(dt, 1e-3); lastX = lx; lastZ = P.z;
      B.forEach((b, k) => {
        const d = Math.hypot(b.x - lx, b.z - P.z);
        if (b.fly <= 0 && d < (spd > 4.5 ? 4.5 : 1.0)) { b.fly = 4 + Math.random() * 3; b.vy = 3 + Math.random() * 2; b.vx = (b.x - lx) / d * 3; b.vz = (b.z - P.z) / d * 3; flew++; if (flew > 150) c.egg('scatter', 'One hundred and fifty pigeons in the air at once. Central Park will be talking about you all winter.'); }
        if (b.fly > 0) { b.fly -= dt; b.x += b.vx * dt; b.z += b.vz * dt; b.y = Math.max(0.1, b.y + b.vy * dt); b.vy -= dt * (b.fly < 2 ? 2.5 : 0.3); b.a = Math.atan2(b.vx, b.vz); if (b.y <= 0.1 && b.fly < 2) b.fly = 0; b.x = Math.max(1, Math.min(19, b.x)); b.z = Math.max(-7, Math.min(7, b.z)); }
        else if (lady && b.home) { b.x += (b.home[0] - b.x) * dt * 0.8; b.z += (b.home[1] - b.z) * dt * 0.8; }
        const peck = b.fly > 0 ? 0 : Math.max(0, Math.sin(t * 5 + k)) * 0.04;
        e.set(0, b.a, 0); q4.setFromEuler(e); m4.compose(pv.set(b.x, b.y + 0.06, b.z), q4, one); body.setMatrixAt(k, m4);
        m4.compose(pv.set(b.x + Math.sin(b.a) * 0.14, b.y + 0.14 - peck, b.z + Math.cos(b.a) * 0.14), q4, one); head.setMatrixAt(k, m4);
      });
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    });
    const pl = c.glb('pigeonlady', { h: 1.7, x: 10, z: -4.2, ry: 0, parent: g }); c.post(X(10), -4.2, 0.45);
    c.clickable(pl, () => { lady = true; B.forEach((b, k) => { b.home = [10 + Math.cos(k) * (0.8 + (k % 7) * 0.25), -4.2 + Math.sin(k) * (0.8 + (k % 7) * 0.25) + 0.6]; }); c.say(pl, 'Pigeons never forget a face. Or a count. Hold out your hand.', 3600, 2.0); c.egg('pigeonlady'); setTimeout(() => { lady = null; }, 9000); }, 'The pigeon lady');
    prop(c, r, g, X, 'painted_wooden_bench', 4.4, -1.6, { len: 1.9, ry: 0.4, r: 0.8 }); prop(c, r, g, X, 'painted_wooden_bench', 15.6, -1.6, { len: 1.9, ry: -0.4, r: 0.8 });
    prop(c, r, g, X, 'street_lamp_01', 2.2, -5.6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'street_lamp_01', 17.8, -5.6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'metal_trash_can', 18.8, 1.4, { h: 0.95, r: 0.35 });
  },

  rink(c, r, g, X) {
    const { THREE } = c;
    // real reflective ice, and real ice physics: you keep gliding after you let go
    const ice = new Reflector(new THREE.PlaneGeometry(W, D), { textureWidth: c.MOBILE ? 512 : 1024, textureHeight: c.MOBILE ? 512 : 1024, color: 0x8a9ab0, clipBias: 0.003 });
    ice.rotation.x = -PI / 2; ice.position.set(W / 2, 0, 0); g.add(ice);
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.18, roughness: 0.3, depthWrite: false })); frost.rotation.x = -PI / 2; frost.position.set(W / 2, 0.01, 0); g.add(frost);
    const vel = { x: 0, z: 0 }; let glided = 0;
    r.move = (P, nx, nz, dt) => { r.moving = true; vel.x += ((nx - P.x) / Math.max(dt, 1e-3) - vel.x) * Math.min(1, dt * 1.6); vel.z += ((nz - P.z) / Math.max(dt, 1e-3) - vel.z) * Math.min(1, dt * 1.6); return [P.x + vel.x * dt, P.z + vel.z * dt]; };
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { vel.x = vel.z = 0; return; } const sp = Math.hypot(vel.x, vel.z); if (sp > 0.05) { glided += sp * dt; if (!r.moving) { P.x = Math.max(r.x0 + 0.5, Math.min(r.x0 + W - 0.5, P.x + vel.x * dt)); P.z = Math.max(-5.2, Math.min(7.5, P.z + vel.z * dt)); vel.x *= 0.985; vel.z *= 0.985; } } r.moving = false; if (glided > 40) c.egg('glide', 'Forty metres of ice. You glide like a New Yorker who learned on a pond in Queens.'); });
    // the tree: a cone of boughs, ornaments that are eye flowers, a star you can light
    const tree = new THREE.Group(); tree.position.set(W / 2, 0, -6.8); g.add(tree); c.post(X(W / 2), -6.8, 1.8);
    for (let k = 0; k < 7; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(2.4 - k * 0.3, 1.8, 18), std(c, 0x1a4a2a, { roughness: 0.9 })); cn.position.y = 1.2 + k * 1.05; tree.add(cn); }
    const ornT = HEAD.t || (HEAD.t = c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98)));
    for (let k = 0; k < 60; k++) { const lvl = Math.random(), y = 0.8 + lvl * 7.2, rad = (2.3 - lvl * 2.0), a = Math.random() * 6.3, o = new THREE.Sprite(new THREE.SpriteMaterial({ map: ornT, toneMapped: false })); o.scale.setScalar(0.32); o.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); tree.add(o); }
    const lightsM = []; for (let k = 0; k < 90; k++) { const lvl = Math.random(), a = Math.random() * 6.3, m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), basic(c, [0xff3030, 0xffd040, 0x30ff60, 0x40a0ff][k % 4])); m.position.set(Math.cos(a) * (2.35 - lvl * 2.05), 0.6 + lvl * 7.4, Math.sin(a) * (2.35 - lvl * 2.05)); tree.add(m); lightsM.push(m); }
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), basic(c, 0xffe080)); star.position.y = 8.6; tree.add(star); let lit = 0;
    c.clickable(star, () => { lit++; c.sound.ding(); if (lit === 1) c.egg('tree', 'You lit the star. Somewhere in Midtown a crowd of eye flowers says ooh.'); }, 'The star');
    c.tick((t) => { star.rotation.y = t; lightsM.forEach((m, k) => { m.visible = ((t * 3 + k) | 0) % 3 !== 0 || lit > 0; }); });
    // skaters round the rink, and the one who knows MLow
    const cast = ['elf', 'gown', 'discoking', 'maitre', 'dress', 'cabbie'];
    cast.forEach((nm, k) => { const o = c.glb(nm, { h: nm === 'elf' ? 2.0 : 1.8, parent: g, shadow: false }); const R = 5.2 + (k % 3) * 0.9, ph = k / cast.length * 2 * PI, s = 0.18 + (k % 2) * 0.06;
      c.tick((t) => { const a = t * s + ph; o.position.set(W / 2 + Math.cos(a) * R * 1.3, 0, 0.4 + Math.sin(a) * R * 0.75); o.rotation.y = -a; o.rotation.z = 0.12; });
      if (nm === 'elf') c.clickable(o, () => { c.say(o, 'MLOW! MLOW\'S COMING! I KNOW HIM!', 3000, 2.3); c.egg('elf'); }, 'The elf'); });
    for (let k = 0; k < 10; k++) { const a = k / 10 * 2 * PI, x = W / 2 + Math.cos(a) * 9.4, z = Math.sin(a) * 7.4; if (Math.abs(z) > 7.6) continue; g.add(c.slab(0.05, 4, 0.05, std(c, 0xcccccc, { metalness: 0.8 }), x, 2, z)); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), std(c, [0xc82a2a, 0x1d4ed8, 0xf5c542, 0xffffff][k % 4], { side: THREE.DoubleSide })); f.position.set(x + 0.45, 3.6, z); g.add(f); c.tick((t) => { f.rotation.y = Math.sin(t * 2 + k) * 0.3; }); }
  },

  moon(c, r, g, X) {
    const { THREE } = c;
    // the moon illusion: huge on the horizon, small overhead. Here it is literally so.
    const mt = c.canvasTex(512, 512, (q) => { const gr = q.createRadialGradient(256, 256, 160, 256, 256, 256); gr.addColorStop(0, 'rgba(255,230,170,1)'); gr.addColorStop(0.9, 'rgba(255,220,150,.25)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); q.fillStyle = gr; q.fillRect(0, 0, 512, 512); q.fillStyle = '#fff2c8'; q.beginPath(); q.arc(256, 256, 190, 0, 7); q.fill(); q.fillStyle = 'rgba(200,170,110,.35)'; [[200, 200, 40], [300, 280, 55], [230, 320, 30], [320, 190, 25]].forEach(([x, y, rr]) => { q.beginPath(); q.arc(x, y, rr, 0, 7); q.fill(); }); });
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, toneMapped: false, depthWrite: false })); g.add(moon);
    let up = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const lift = Math.max(0, Math.min(1, (P.pitch - 0.05) / 0.9)); moon.position.set(W / 2, 8 + lift * 40, -46 + lift * 22); moon.scale.setScalar(26 - lift * 20); if (lift > 0.8 && !up) { up = true; c.egg('moonillusion', 'The moon illusion: on the horizon it is enormous, overhead it is a coin. Your brain did that. In this room we just made it true.'); } });
    c.clickable(moon, () => c.egg('bellaluna', 'La bella luna. It came up over the bridge just for you, and for everybody else in Brooklyn.'), 'The moon');
    const lo = c.glb('loretta', { h: 1.75, x: 6.6, z: -1.2, ry: 0.6, parent: g }); c.post(X(6.6), -1.2, 0.45);
    c.clickable(lo, () => { c.shake(0.08); c.sound.thud(0.5); c.say(lo, 'SNAP OUT OF IT! You got counted!', 2800, 2.0); c.egg('snapout'); }, 'Loretta');
    // stoops on both sides
    const st = c.surf('concrete', 1.4, 0x8a6a58);
    [[1.6, PI / 2], [18.4, -PI / 2]].forEach(([x, ry]) => [-5.6, -1.4].forEach((z) => { for (let k = 0; k < 6; k++) g.add(c.slab(1.4 - k * 0.2 + 0.4, 0.18, 1.6, st, x + (ry > 0 ? -1 : 1) * (0.6 - k * 0.1), 0.09 + k * 0.18, z)); c.post(X(x), z, 0.9); }));
    prop(c, r, g, X, 'street_lamp_02', 3.8, 3.2, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'street_lamp_02', 16.2, 3.2, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'metal_trash_can', 17.0, -3.4, { h: 0.95, r: 0.35 });
    c.tick((t, dt, P, ri) => { if (ri === r.i && Math.random() < dt * 0.05) c.sound.howl(); });
  },

  pelham(c, r, g, X, mats) {
    const { THREE } = c;
    // a station platform outside, and the car itself running north into the photograph
    const cx1 = 8.5, cx2 = 11.5, cz1 = -D / 2, cz2 = 6.4, CH = 2.6;
    const shell = std(c, 0xb0b0a8, { metalness: 0.6, roughness: 0.4 }), seat = std(c, 0xe08a20, { roughness: 0.5 }), floor = std(c, 0x5a4a3a, { roughness: 0.8 });
    g.add(c.slab(cx2 - cx1, 0.08, cz2 - cz1, floor, W / 2, 0.04, (cz1 + cz2) / 2)); g.add(c.slab(cx2 - cx1, 0.08, cz2 - cz1, shell, W / 2, CH, (cz1 + cz2) / 2)); g.add(c.slab(cx2 - cx1 + 0.2, 0.2, 0.08, shell, W / 2, CH - 0.1, cz2));
    // the car sides: panels with windows that show a moving tunnel
    const tun = c.canvasTex(512, 128, (q) => { q.fillStyle = '#050505'; q.fillRect(0, 0, 512, 128); for (let k = 0; k < 6; k++) { const x = k * 90 + 20; q.fillStyle = 'rgba(255,240,180,.95)'; q.fillRect(x, 50, 46, 10); const gr = q.createRadialGradient(x + 23, 55, 2, x + 23, 55, 60); gr.addColorStop(0, 'rgba(255,220,140,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - 40, 0, 130, 128); } q.fillStyle = '#1a1a14'; for (let x = 0; x < 512; x += 64) q.fillRect(x, 0, 8, 128); });
    tun.wrapS = THREE.RepeatWrapping; const winM = new THREE.MeshBasicMaterial({ map: tun, toneMapped: false });
    [cx1, cx2].forEach((x, sd) => { for (let z = cz1; z < cz2 - 0.1; z += 2.2) { const doorGap = sd === 0 && z > 2 && z < 4.4; if (doorGap) continue; g.add(c.slab(0.08, 0.9, 2.2, mats.wall, x, 0.45, z + 1.1)); g.add(c.slab(0.08, 0.9, 2.2, mats.wall, x, 2.15, z + 1.1)); const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), winM); w.position.set(x + (sd ? -0.05 : 0.05), 1.3, z + 1.1); w.rotation.y = sd ? -PI / 2 : PI / 2; g.add(w); g.add(c.slab(0.02, 0.8, 0.2, shell, x, 1.3, z + 0.1)); }
      g.add(c.slab(0.5, 0.42, cz2 - cz1 - 0.6, seat, x + (sd ? -0.3 : 0.3), 0.21, (cz1 + cz2) / 2 - (sd === 0 ? 0 : 0))); });
    c.wall(X(cx2), cz1, X(cx2), cz2); c.wall(X(cx1), cz1, X(cx1), 2.2); c.wall(X(cx1), 4.2, X(cx1), cz2); c.wall(X(cx1), cz2, X(cx2), cz2);
    for (let z = cz1 + 1; z < cz2; z += 1.6) { g.add(c.slab(0.04, CH, 0.04, std(c, 0xd8d8d8, { metalness: 1, roughness: 0.2 }), W / 2, CH / 2, z)); const ft = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.2), basic(c, 0xf0fff0)); ft.rotation.x = PI / 2; ft.position.set(W / 2, CH - 0.05, z); g.add(ft); }
    // only the far end of the car opens onto the photograph: cover the rest of the portal with the tunnel wall
    const tw = std(c, 0x1a1a18, { roughness: 0.9 }); g.add(c.slab(cx1 - 4, PORTAL.h, 0.3, tw, (4 + cx1) / 2, PORTAL.h / 2, -D / 2 + 0.1)); g.add(c.slab(16 - cx2, PORTAL.h, 0.3, tw, (16 + cx2) / 2, PORTAL.h / 2, -D / 2 + 0.1)); g.add(c.slab(cx2 - cx1, PORTAL.h - CH, 0.3, tw, W / 2, CH + (PORTAL.h - CH) / 2, -D / 2 + 0.1));
    // the ride that never moves
    let run = 0, rode = 0;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), basic(c, 0xff3030)); handle.position.set(cx2 - 0.3, 1.4, -6.4); g.add(handle);
    c.clickable(handle, () => { run = run ? 0 : 1; c.sound.boom(0.6); c.toast(run ? 'Next stop: nowhere. Stand clear.' : 'Doors opening.'); }, 'The handle');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { run = 0; return; } const inCar = P.x - r.x0 > cx1 && P.x - r.x0 < cx2 && P.z < cz2; if (run && inCar) { tun.offset.x += dt * 2.6; c.P.roll = Math.sin(t * 2.3) * 0.012; if (Math.random() < dt * 0.6) c.shake(0.02); rode += dt; if (rode > 12) c.egg('moving', 'Twelve seconds at speed and the car never moved an inch. The windows and the sway did all of it. That is the trick.'); } });
    const hj = c.glb('hijacker', { h: 1.8, x: W / 2, z: -4.4, ry: 0, parent: g }); c.post(X(W / 2), -4.4, 0.35);
    c.clickable(hj, () => { c.say(hj, 'Pelham One Two Three, this car is being counted. Nobody move.', 3400, 2.0); c.egg('pelham'); }, 'The man in the hat');
    // the platform
    prop(c, r, g, X, 'modular_street_seating', 4.2, 4.0, { len: 2.4, ry: PI / 2, r: 1.0 }); prop(c, r, g, X, 'metal_trash_can', 3.0, -3.6, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'WetFloorSign_01', 6.0, 1.0, { h: 0.6 }); prop(c, r, g, X, 'security_light', 0.2, -2, { h: 0.4, y: 3.6, ry: PI / 2 });
    const edge = c.slab(0.5, 0.02, D, std(c, 0xf5c542), cx1 - 0.3, 0.01, 0); g.add(edge);
  },

  manhattan(c, r, g, X) {
    const { THREE } = c;
    // the bench, the bridge, and fireworks: the only colour in the picture
    const bench = c.glb('bench', { h: 1.4, x: W / 2, z: -4.8, ry: PI, parent: g }); c.post(X(W / 2), -4.8, 1.2);
    let sat = 0, sit = 0, played = false;
    const N = 260, fp = new Float32Array(N * 3), fc = new Float32Array(N * 3), fv = [];
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('color', new THREE.BufferAttribute(fc, 3));
    const fw = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); fw.frustumCulled = false; g.add(fw);
    for (let k = 0; k < N; k++) fv.push({ v: new THREE.Vector3(), life: 0 });
    const launch = () => { const cx = 4 + Math.random() * 12, cy = 22 + Math.random() * 14, cz = -60, col = new THREE.Color([0xff4fa3, 0x22d3ee, 0xf5c542, 0x3b82f6][Math.random() * 4 | 0]); fv.forEach((p, k) => { const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(6 + Math.random() * 4); fp[k * 3] = cx; fp[k * 3 + 1] = cy; fp[k * 3 + 2] = cz; p.v.copy(d); p.life = 2.4; fc[k * 3] = col.r; fc[k * 3 + 1] = col.g; fc[k * 3 + 2] = col.b; }); sat = 0.7; c.sound.boom(0.4); };
    let next = 3;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (c.FX.sat !== null && r.owns) { c.FX.sat = null; r.owns = false; } return; }
      next -= dt; if (next <= 0) { next = 3 + Math.random() * 3; launch(); }
      fv.forEach((p, k) => { if (p.life <= 0) return; p.life -= dt; fp[k * 3] += p.v.x * dt; fp[k * 3 + 1] += p.v.y * dt; fp[k * 3 + 2] += p.v.z * dt; p.v.y -= dt * 3; const f = Math.max(0, p.life / 2.4); fc[k * 3] *= 0.99; fc[k * 3 + 1] *= 0.99; fc[k * 3 + 2] *= 0.99; });
      fg.attributes.position.needsUpdate = fg.attributes.color.needsUpdate = true;
      sat = Math.max(0, sat - dt * 0.35); c.FX.sat = sat > 0.02 ? sat : null; r.owns = true;
      const near = Math.hypot(P.x - X(W / 2), P.z + 3.6) < 1.6; sit = near ? sit + dt : 0;
      if (sit > 4 && !played) { played = true; c.sound.rhapsody(); c.egg('rhapsody', 'Sit long enough on this bench at dawn and a clarinet starts climbing. Gershwin, 1924, public domain, and still the sound of this city.'); }
    });
    const box = new THREE.Group(); box.position.set(15.6, 0, -6.6); g.add(box); box.add(c.slab(0.8, 0.6, 0.6, std(c, 0x3a3a3a), 0, 0.3, 0)); const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), basic(c, 0xffffff)); fuse.position.set(0, 0.8, 0); box.add(fuse); c.post(X(15.6), -6.6, 0.5);
    c.clickable(box, () => { launch(); setTimeout(launch, 400); c.egg('fireworks', 'Fireworks over the bridge, in black and white, except where they are not.'); }, 'Fireworks');
    prop(c, r, g, X, 'street_lamp_02', 4.0, -6.6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'painted_wooden_bench', 4.6, -2.4, { len: 1.9, r: 0.8 }); prop(c, r, g, X, 'metal_trash_can', 17.2, -2.4, { h: 0.95, r: 0.35 });
  },
});

Object.assign(ROOM, {
  clover(c, r, g, X) {
    const { THREE } = c;
    // found footage: the camera never stops shaking, the REC light never stops blinking
    const rec = document.createElement('div'); rec.style.cssText = 'position:fixed;left:18px;bottom:96px;font:700 14px "IBM Plex Mono",monospace;color:#ff3030;letter-spacing:.12em;z-index:9;display:none;text-shadow:0 0 6px #000'; document.body.appendChild(rec);
    // the head comes down the avenue, out of the photograph, and stops at the rope
    const head = c.glb('libhead', { h: 5.5, x: W / 2 + 1.5, y: 30, z: -70, ry: 0.4, parent: g });
    let fall = -1, seen = false;
    const drop = () => { fall = 0; c.sound.whoosh(0.8, 2.4); };
    c.tick((t, dt, P, ri) => {
      const on = ri === r.i; rec.style.display = on ? 'block' : 'none'; if (!on) return;
      const s = (t | 0); rec.textContent = `${(t * 2 | 0) % 2 ? '●' : ' '} REC  02:${String((14 + (s / 60 | 0)) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      c.shake(0.006);
      if (!seen && fall < 0) { seen = true; setTimeout(drop, 3500); }
      if (fall >= 0 && fall < 1) { fall = Math.min(1, fall + dt / 2.6); const u = fall; head.position.set(W / 2 + 1.5, Math.max(0, 30 * (1 - u * u * 1.2)), -70 + 60 * u); head.rotation.x = u * 2.2; head.rotation.z = u * 0.6; if (fall >= 1) { head.position.y = 0; c.shake(0.18); c.sound.boom(1.0); c.sound.thud(0.9); c.flash(0.3); c.egg('head', 'Her head came down Broadway and stopped at your feet. Keep rolling. Somebody has to get this on tape.'); } }
    });
    c.clickable(head, () => { if (fall >= 1) { fall = 0; c.sound.whoosh(0.8, 2.4); } }, 'Again');
    [[5, -5], [15.5, -5.6], [12.6, 2.2]].forEach(([x, z], k) => prop(c, r, g, X, 'concrete_road_barrier', x, z, { len: 2, ry: k * 0.7, r: 0.9 }));
    [[3, 1.4], [17, -1.2]].forEach(([x, z]) => prop(c, r, g, X, 'old_tyre', x, z, { len: 0.7 }));
    prop(c, r, g, X, 'metal_trash_can', 18.6, 3.0, { h: 0.95, ry: 1.4, r: 0.35 }); prop(c, r, g, X, 'cardboard_box_01', 2.0, -3.4, { h: 0.5 });
    const rub = std(c, 0x7a7068, { roughness: 0.95 }); for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.3), rub); m.position.set(1 + Math.random() * 18, 0.1, -6.5 + Math.random() * 12); m.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(m); }
  },

  library(c, r, g, X) {
    const { THREE } = c;
    // reading tables, green lamps, books
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
      const x = 5.5 + i * 9, z = -5 + j * 3; g.add(c.slab(5, 0.08, 1.4, std(c, 0x5a3a1e, { roughness: 0.5 }), x, 0.78, z)); [-2, 2].forEach((dx) => g.add(c.slab(0.12, 0.76, 1.2, std(c, 0x4a2e16), x + dx, 0.38, z))); c.wall(X(x - 2.5), z, X(x + 2.5), z);
      [-1.5, 0, 1.5].forEach((dx) => { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.12, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x1e6a3a, emissive: 0x0a3a1a, side: THREE.DoubleSide })); sh.position.set(x + dx, 1.2, z); g.add(sh); g.add(c.slab(0.02, 0.4, 0.02, std(c, 0xc8a050, { metalness: 1 }), x + dx, 1.0, z)); });
      if ((i + j) % 2) prop(c, r, g, X, 'book_encyclopedia_set_01', x - 0.8, z, { len: 0.5, y: 0.82 }); else prop(c, r, g, X, 'decorative_book_set_01', x + 0.6, z, { len: 0.4, y: 0.82 });
    }
    // the fire, and the debate about what to burn
    prop(c, r, g, X, 'stone_fire_pit', 2.4, 4.6, { len: 1.6, r: 0.9 });
    const fire = []; for (let k = 0; k < 8; k++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,140,40,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(f); fire.push(f); }
    c.tick((t) => fire.forEach((f, k) => { const u = (t * 0.9 + k / 8) % 1; f.position.set(2.4 + Math.sin(k * 3) * 0.2, 0.4 + u * 1.2, 4.6 + Math.cos(k * 5) * 0.2); f.scale.setScalar(0.9 - u * 0.6); f.material.opacity = 1 - u; }));
    let burned = 0;
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), new THREE.MeshBasicMaterial({ visible: false })); pit.position.set(2.4, 0.6, 4.6); g.add(pit);
    c.clickable(pit, () => { burned++; c.sound.whoosh(0.3, 0.8); c.toast(['Tax law. Into the fire.', 'The phone book. Warm, actually.', 'Not the census. Never the census.'][Math.min(2, burned - 1)]); if (burned === 3) c.egg('books', 'You burned the tax code and the phone book and saved the census. Correct order.'); }, 'Feed the fire');
    // the freeze: start it by walking toward the windows, then outrun it
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(W, 1), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.85 })); frost.rotation.x = -PI / 2; frost.position.set(W / 2, 0.02, -D / 2); g.add(frost);
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(200,230,255,.85) 100%);transition:opacity .3s'; document.body.appendChild(ov);
    let front = null, done = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { ov.style.opacity = 0; return; }
      if (front === null && P.z < -3) { front = -D / 2; c.toast('It is coming. RUN.', 2000); c.sound.whoosh(0.7, 3); }
      if (front !== null) { front += dt * 1.6; const len = front + D / 2; frost.scale.y = Math.max(0.01, len); frost.position.z = -D / 2 + len / 2; const near = P.z - front; ov.style.opacity = Math.max(0, Math.min(1, 1 - near / 3)).toFixed(2);
        if (near < 0) { c.toast('Frozen solid. It thaws in a moment. Try again, faster.', 2600); front = null; frost.scale.y = 0.01; ov.style.opacity = 0; }
        else if (P.z > 6.6 && !done) { done = true; c.egg('outran', 'You outran the cold across the whole reading room. The fire is warm. Stay by it.'); front = null; frost.scale.y = 0.01; ov.style.opacity = 0; } }
    });
    prop(c, r, g, X, 'WoodenChair_01', 3.6, 3.4, { h: 0.95, ry: 2.2 }); prop(c, r, g, X, 'Chandelier_01', 10, -1, { h: 1.4, y: 4.4 }); prop(c, r, g, X, 'vintage_grandfather_clock_01', 19.3, 6.6, { h: 2.2, ry: -PI / 2, r: 0.4 });
  },

  dogday(c, r, g, X) {
    const { THREE } = c;
    // the counter with its brass bars, the vault, police lights through the door
    g.add(c.slab(12, 1.1, 0.8, std(c, 0x8a6a48), W / 2, 0.55, -3.6)); c.wall(X(4), -3.6, X(16), -3.6);
    const brass = std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }); for (let x = 4.2; x <= 15.8; x += 0.3) g.add(c.slab(0.025, 1.0, 0.025, brass, x, 1.6, -3.6)); g.add(c.slab(12, 0.06, 0.1, brass, W / 2, 2.1, -3.6));
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 40), std(c, 0x9aa0a8, { metalness: 1, roughness: 0.25 })); vault.rotation.z = PI / 2; vault.position.set(W - 0.3, 1.8, -5); g.add(vault);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 24), brass); wheel.rotation.y = PI / 2; wheel.position.set(W - 0.55, 1.8, -5); g.add(wheel);
    c.clickable(wheel, () => { c.sound.clink(600); c.egg('vault', 'The vault holds eleven hundred and eleven dollars. Somebody already counted it.'); }, 'The vault');
    const red = new THREE.PointLight(0xff2020, 0, 16), blue = new THREE.PointLight(0x2040ff, 0, 16); red.position.set(6, 2.5, -7); blue.position.set(14, 2.5, -7); g.add(red); g.add(blue);
    const sonny = c.glb('sonny', { h: 1.8, x: W / 2, z: -5.6, ry: 0, parent: g });
    let chanted = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { red.intensity = blue.intensity = 0; return; }
      const ph = (t * 3) | 0; red.intensity = ph % 2 ? 18 : 0; blue.intensity = ph % 2 ? 0 : 18;
      const near = Math.max(0, Math.min(1, (2 - P.z) / 7)); if (Math.random() < dt * (0.4 + near * 2.5)) c.sound.chant(0.05 + near * 0.3);
      if (!chanted && P.z < -2) { chanted = true; c.say(sonny, 'COUNTED! COUNTED! COUNTED!', 3200, 2.0); c.egg('chant', 'The whole street chants it back. Brooklyn, August, a hundred degrees.'); }
    });
    c.clickable(sonny, () => c.say(sonny, 'Somebody order pizza? To a bank? In Brooklyn?', 2800, 2.0), 'Sonny');
    const pz = new THREE.Group(); pz.position.set(15.2, 0, 2.6); g.add(pz); g.add(c.slab(1.2, 0.76, 0.8, std(c, 0x4a3a2a), 15.2, 0.38, 2.6));
    for (let k = 0; k < 5; k++) pz.add(c.slab(0.45, 0.05, 0.45, std(c, 0xe8e0d0), (k % 2) * 0.05, 0.79 + k * 0.055, 0)); c.post(X(15.2), 2.6, 0.7);
    c.clickable(pz, () => { c.sound.ding(); c.egg('pizza', 'Five pies delivered to an armed standoff. The delivery kid is a hero on the six o\'clock news.'); }, 'Pizza');
    prop(c, r, g, X, 'metal_office_desk', 3.4, 3.0, { len: 1.5, ry: 0.3, r: 0.8 }); prop(c, r, g, X, 'Television_01', 3.4, 3.0, { h: 0.5, y: 0.76, ry: 0.3 }); prop(c, r, g, X, 'desk_lamp_arm_01', 4.0, 2.8, { h: 0.5, y: 0.76 });
    prop(c, r, g, X, 'WoodenChair_01', 6.0, 5.6, { h: 0.95 }); prop(c, r, g, X, 'potted_plant_02', 0.9, 6.9, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'CashRegister_01', 8, -3.7, { h: 0.35, y: 1.1, ry: PI });
  },

  fame(c, r, g, X) {
    const { THREE } = c;
    // four parked cabs, a stack of crates to climb, dance on the roofs
    const cabs = [4, 8, 12, 16], CZ = -2.2, ROOF = 1.45, LEN = 4.6, WID = 1.9;
    cabs.forEach((x) => c.glb('checker', { len: LEN, x, z: CZ, ry: PI, parent: g }));
    prop(c, r, g, X, 'wooden_crate_01', 1.6, CZ, { h: 0.6 }); prop(c, r, g, X, 'wooden_crate_02', 2.3, CZ - 0.9, { h: 0.55 });
    const onCab = (lx, z) => cabs.findIndex((x) => Math.abs(lx - x) < WID / 2 && Math.abs(z - CZ) < LEN / 2 - 0.3);
    r.ground = (lx, z) => { const k = onCab(lx, z); if (k >= 0) return ROOF; if (Math.abs(lx - 1.6) < 0.4 && Math.abs(z - CZ) < 0.4) return 0.6; if (Math.abs(lx - 2.3) < 0.4 && Math.abs(z - CZ + 0.9) < 0.4) return 0.55; return 0; };
    const visited = new Set(); let music = false;
    const dancer = c.glb('famer', { h: 1.75, x: 12, y: ROOF, z: CZ, ry: 0, parent: g, shadow: false });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (music) { music = false; c.sound.disco(false); } return; }
      dancer.rotation.y = t * 1.2; dancer.position.y = ROOF + Math.abs(Math.sin(t * 4)) * 0.25;
      const k = onCab(P.x - r.x0, P.z); if (k >= 0) { visited.add(k); if (!music) { music = true; c.sound.disco(true); } c.P.lift = Math.abs(Math.sin(t * 8)) * 0.05; } else if (music && P.y < 1.8) { music = false; c.sound.disco(false); }
      if (visited.size === 4) { visited.add(9); c.egg('fame', 'Four taxi roofs on West 46th and not one of them dented. They are going to remember you.'); }
    });
    // an upright piano in the street
    const pn = new THREE.Group(); pn.position.set(16.6, 0, 3.6); pn.rotation.y = -PI / 2; g.add(pn); pn.add(c.slab(1.5, 1.3, 0.6, std(c, 0x2a1a10, { roughness: 0.4 }), 0, 0.65, 0)); pn.add(c.slab(1.3, 0.04, 0.2, std(c, 0xf4f0e6), 0, 0.8, 0.38)); c.post(X(16.6), 3.6, 0.8);
    c.clickable(pn, () => { [261.6, 329.6, 392, 523.3].forEach((f, k) => setTimeout(() => c.sound.note(f), k * 140)); c.egg('pianoplayer', 'Somebody wheeled a piano into West 46th Street and the whole block learned the routine.'); }, 'The piano');
    const conf = []; const cm = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff].map((h) => std(c, h, { side: THREE.DoubleSide }));
    for (let k = 0; k < 120; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), cm[k % 4]); m.position.set(Math.random() * W, Math.random() * 9, -7 + Math.random() * 14); g.add(m); conf.push(m); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; conf.forEach((m, k) => { m.position.y -= dt * 0.5; m.rotation.x += dt * 3; m.rotation.y += dt * 2; if (m.position.y < 0) m.position.y = 9; }); });
  },

  annie(c, r, g, X) {
    const { THREE } = c;
    // the line, and the subtitles that say what everybody in it is actually thinking
    const SUB = [['I loved the director\'s early work.', 'I have never seen one of his films.'], ['This line is so long.', 'I am counting the people in front of me. Eleven.'], ['We should get popcorn.', 'If he gets popcorn I am leaving him.'], ['Fellini is overrated.', 'I cannot spell Fellini.'], ['I am fine with any seat.', 'Aisle. Aisle or death.'], ['This scarf? Old thing.', 'This scarf cost four hundred dollars.'], ['Nice to see you.', 'Who is this.'], ['I am not cold.', 'I am extremely cold.']];
    const line = []; for (let k = 0; k < 8; k++) { const e = extra(c, g, 13.2 - k * 0.9 + (k % 2) * 0.1, -2.6 + Math.sin(k) * 0.15, { col: [0x6a4a3a, 0x3a4a5a, 0x5a3a4a, 0x4a5a3a][k % 4], ry: -PI / 2 }); line.push(e); c.post(X(13.2 - k * 0.9), -2.6, 0.3); }
    const sub = document.createElement('div'); sub.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);max-width:80vw;text-align:center;font:600 18px "Space Grotesk",sans-serif;color:#fff;text-shadow:0 2px 6px #000;z-index:9;display:none;line-height:1.4'; document.body.appendChild(sub);
    const read = new Set(), fw = new THREE.Vector3(), hw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { sub.style.display = 'none'; return; }
      c.camera.getWorldDirection(fw); let best = -1, bd = 0.97;
      line.forEach((e, k) => { e.userData.head.getWorldPosition(hw); const d = hw.distanceTo(c.camera.position); if (d > 6) return; const dot = hw.sub(c.camera.position).normalize().dot(fw); if (dot > bd) { bd = dot; best = k; } });
      if (best >= 0) { const [a2, b2] = SUB[best]; sub.innerHTML = `“${a2}”<br><span style="color:#f5c542;font-size:15px">SUBTITLE: ${b2}</span>`; sub.style.display = 'block'; read.add(best); if (read.size === 5) { read.add(99); c.egg('subtitles', 'Five people, five subtitles. Everybody in this city is thinking something else.'); } }
      else sub.style.display = 'none';
    });
    // the loud one, and the man behind the standee
    const loud = line[2]; c.clickable(loud, () => { c.say(loud, 'Actually, what McLuhan meant about the medium is...', 3200, 1.0); }, 'The loud one');
    const st = c.sign('COMING SOON\nTHE COUNT', { w: 1.4, h: 2.2, bg: '#1a1a1a', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#f5c542' }); st.position.set(5.6, 1.1, -4.4); st.rotation.y = 0.4; g.add(st);
    const behind = extra(c, g, 5.6, -4.8, { col: 0x5a5a5a, ry: 0.4 }); behind.visible = false;
    c.clickable(st, () => { behind.visible = true; let u = 0; const iv = setInterval(() => { u += 0.05; behind.position.x = 5.6 + u * 1.3; if (u >= 1) clearInterval(iv); }, 30); setTimeout(() => c.say(behind, 'You know nothing of my count.', 3000, 1.0), 900); c.egg('mcluhan', 'Pulled him out from behind the standee. If only life were like this.'); }, 'The standee');
    const an = c.glb('annieh', { h: 1.7, x: 15.8, z: 1.2, ry: -0.8, parent: g }); c.post(X(15.8), 1.2, 0.4);
    c.clickable(an, () => { c.say(an, 'La di da. La di count.', 2600, 2.0); c.egg('ladida'); }, 'Annie');
    c.glb('popcorn', { h: 1.9, x: 18.4, z: 4.8, ry: -1.2, parent: g }); c.post(X(18.4), 4.8, 0.7); prop(c, r, g, X, 'CashRegister_01', 2.0, 5.6, { h: 0.35, y: 1.0, ry: 1.2 }); g.add(c.slab(1.4, 1.0, 0.7, std(c, 0x5a1a1a), 2.0, 0.5, 5.6)); c.post(X(2.0), 5.6, 0.7);
    prop(c, r, g, X, 'Chandelier_02', 10, 1, { h: 1.2, y: 4.7 });
  },

  unisphere(c, r, g, X) {
    const { THREE } = c;
    // the Unisphere: steel meridians and parallels, slowly turning, over a pool
    const uni = new THREE.Group(); uni.position.set(W / 2, 5.2, -4.6); g.add(uni);
    const steel = std(c, 0xb8bcc0, { metalness: 1, roughness: 0.35 }), R = 3.0;
    for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 6, 64), steel); m.rotation.y = k / 12 * PI; uni.add(m); }
    for (let k = -3; k <= 3; k++) { const rr = Math.cos(k / 4 * PI / 2) * R; const m = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.04, 6, 64), steel); m.rotation.x = PI / 2; m.position.y = Math.sin(k / 4 * PI / 2) * R; uni.add(m); }
    const land = std(c, 0xc8ccd0, { metalness: 1, roughness: 0.3, side: THREE.DoubleSide }); for (let k = 0; k < 14; k++) { const a = Math.random() * 6.3, b = (Math.random() - 0.5) * 2.2, p = new THREE.Mesh(new THREE.SphereGeometry(R + 0.03, 12, 8, a, 0.5 + Math.random() * 0.6, 1.2 + b * 0.4, 0.4 + Math.random() * 0.4), land); uni.add(p); }
    uni.add(c.slab(0.3, 2.2, 0.3, steel, 0, -R - 0.9, 0)); g.add(c.slab(2.4, 0.3, 2.4, std(c, 0x808488), W / 2, 0.15, -4.6)); c.post(X(W / 2), -4.6, 1.5);
    c.tick((t) => { uni.rotation.y = t * 0.08; });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(5.6, 48), new THREE.MeshStandardMaterial({ color: 0x3a6a9a, metalness: 0.9, roughness: 0.08 })); pool.rotation.x = -PI / 2; pool.position.set(W / 2, 0.02, -4.6); pool.scale.setScalar(0.7); g.add(pool);
    // two saucers; one of them will lift you
    const saucers = [0, 1].map((k) => { const s = new THREE.Group(); g.add(s); s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.6, 0.35, 32), std(c, 0xd0d4d8, { metalness: 1, roughness: 0.2 }))); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 10, 0, 2 * PI, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0x88ffcc, emissive: 0x22aa77, transparent: true, opacity: 0.8 })); dome.position.y = 0.15; s.add(dome); const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); beam.position.y = -4.5; beam.visible = false; s.add(beam); s.userData.beam = beam; return s; });
    let lift = 0;
    c.tick((t, dt, P, ri) => { saucers.forEach((s, k) => { const a = t * (0.25 + k * 0.1) + k * 3; s.position.set(W / 2 + Math.cos(a) * 7, 11 + Math.sin(t + k) * 0.6, -3 + Math.sin(a) * 4); s.rotation.y = t; });
      if (ri !== r.i) return; const s = saucers[0], d = Math.hypot(P.x - s.position.x - r.x0, P.z - s.position.z); s.userData.beam.visible = lift > 0 || d < 3; if (d < 2.2 && lift <= 0) { lift = 3; c.egg('beam', 'Beamed up three metres over Flushing Meadows, then politely put back. Queens has seen weirder.'); } if (lift > 0) { lift -= dt; c.P.lift = Math.sin(Math.min(1, (3 - lift) / 3) * PI) * 3; } });
    // the man in the black suit
    const ag = c.glb('agent', { h: 1.85, x: 14.6, z: 3.2, ry: -0.6, parent: g }); c.post(X(14.6), 3.2, 0.45);
    c.clickable(ag, () => {
      c.flash(1); c.sound.beep(2400, 0.1, 0.4, 'sine');
      const e = document.querySelector('#eggs'), nm = document.querySelector('#rname'), k2 = document.querySelector('#rk'), keep = [e.textContent, nm.textContent, k2.textContent];
      e.textContent = '0 / 0'; nm.textContent = 'Nothing to see here.'; k2.textContent = 'You were never in Queens.';
      setTimeout(() => { nm.textContent = keep[1]; k2.textContent = keep[2]; c.egg('neuralyzer', 'You remember nothing about the last three seconds. That is fine. Neither do we.'); }, 3000);
    }, 'Look at the pen');
    prop(c, r, g, X, 'modular_street_seating', 4.2, 4.4, { len: 2.6, r: 1.1 }); prop(c, r, g, X, 'street_lamp_02', 2.0, -6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'street_lamp_02', 18.0, -6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'metal_trash_can', 17.6, 5.6, { h: 0.95, r: 0.35 });
  },

  mcmlow(c, r, g, X) {
    const { THREE } = c;
    // the counter, the two golden eyes, the menu
    g.add(c.slab(14, 1.05, 0.9, std(c, 0xd83020, { roughness: 0.5 }), W / 2, 0.52, -5)); g.add(c.slab(14.2, 0.06, 1.0, std(c, 0xe8e0d0), W / 2, 1.08, -5)); c.wall(X(3), -4.5, X(17), -4.5);
    [6, 10, 14].forEach((x) => prop(c, r, g, X, 'CashRegister_01', x, -5.1, { h: 0.35, y: 1.11, ry: PI }));
    const gold = std(c, 0xf5c020, { metalness: 0.6, roughness: 0.3, emissive: 0x403000 }); [-1.1, 1.1].forEach((dx) => { const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 40), gold); ring.rotation.x = PI / 2; ring.position.set(W / 2 + dx, 4.0, -D / 2 + 0.2); g.add(ring); const eye = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), basic(c, 0x1d4ed8)); eye.position.set(W / 2 + dx, 4.0, -D / 2 + 0.27); g.add(eye); const pup = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), basic(c, 0x0b1020)); pup.position.set(W / 2 + dx, 4.0, -D / 2 + 0.28); g.add(pup); });
    const menu = c.sign('THE BIG COUNT 1.11   ·   THE EYE MAC 3.17   ·   NAZAR COLA 0.69   ·   COUNTED FRIES 0.99', { w: 13, h: 0.5, bg: '#1a1a1a', fg: '#ffd040', font: c.MONO, weight: 700 }); menu.position.set(W / 2, 2.6, -5.5); g.add(menu);
    // order up
    const trayZ = -4.4; let orders = 0;
    c.clickable(menu, () => { orders++; c.sound.ding(); prop(c, r, g, X, 'hamburger_buns', 6 + orders * 0.7, trayZ - 0.6, { len: 0.22, y: 1.1 }); c.wake(r.i); if (orders === 1) c.egg('order', 'One Big Count, extra eye. Here at McMLOW\'S the sesame seed bun has no seeds. Totally different.'); }, 'Order');
    // the floor is mopped wherever you walk
    const shine = []; const sm = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.02, transparent: true, opacity: 0.35, depthWrite: false });
    for (let k = 0; k < 60; k++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), sm.clone()); m.rotation.x = -PI / 2; m.position.y = 0.012; m.visible = false; g.add(m); shine.push(m); }
    let si = 0, lx0 = 0, lz0 = 0, mopped = 0;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const lx = P.x - r.x0; if (Math.hypot(lx - lx0, P.z - lz0) > 0.5) { lx0 = lx; lz0 = P.z; const m = shine[si++ % shine.length]; m.position.x = lx; m.position.z = P.z; m.visible = true; m.material.opacity = 0.45; if (++mopped === 50) c.egg('mopped', 'Fifty steps of freshly mopped floor. A prince did that. Do not tell anyone.'); } shine.forEach((m) => { if (m.visible) { m.material.opacity -= dt * 0.04; if (m.material.opacity <= 0) m.visible = false; } }); });
    const pr = c.glb('prince', { h: 1.85, x: 6.2, z: 1.6, ry: 0.5, parent: g }); c.post(X(6.2), 1.6, 0.45);
    c.tick((t) => { pr.rotation.y = 0.5 + Math.sin(t * 2) * 0.25; });
    c.clickable(pr, () => { c.say(pr, 'Welcome to McMLOW\'S. Would you like a Big Count? I am just here to mop.', 3200, 2.1); c.egg('prince'); }, 'The new hire');
    prop(c, r, g, X, 'WetFloorSign_01', 8.0, 2.6, { h: 0.6, ry: 0.6 });
    [[2, 2], [2, 5], [18, 2], [18, 5]].forEach(([x, z]) => { g.add(c.slab(1.6, 0.8, 0.9, std(c, 0xd8b020), x, 0.4, z)); g.add(c.slab(1.6, 1.2, 0.2, std(c, 0xc82a1a), x, 0.6, z - 0.75)); g.add(c.slab(1.6, 1.2, 0.2, std(c, 0xc82a1a), x, 0.6, z + 0.75)); c.post(X(x), z, 0.9); });
  },

  bramford(c, r, g, X, mats) {
    const { THREE } = c;
    // a corridor inside the room, and a door at the end that you only reach walking backwards
    const cx1 = 7.4, cx2 = 12.6, LINE = -2.4;
    const wallM = mats.wall.clone(); if (wallM.map) wallM.map = wallM.map.clone();
    [cx1, cx2].forEach((x) => g.add(c.slab(0.2, H_IN, D, wallM, x, H_IN / 2, 0)));
    c.wall(X(cx1), -D / 2, X(cx1), D / 2 - 2.2); c.wall(X(cx2), -D / 2, X(cx2), D / 2 - 2.2);
    for (let z = -6; z < 7; z += 3) { [cx1 + 0.12, cx2 - 0.12].forEach((x) => { const sc = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), basic(c, 0xffc070)); sc.position.set(x, 2.4, z); g.add(sc); }); }
    const door = new THREE.Group(); door.position.set(W / 2, 0, -6.6); g.add(door); door.add(c.slab(1.4, 2.6, 0.1, std(c, 0x3a1e10, { roughness: 0.5 }), 0, 1.3, 0)); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std(c, 0xd8b048, { metalness: 1 })); knob.position.set(0.5, 1.1, 0.08); door.add(knob);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 2.6), basic(c, 0xfff0c0)); glow.position.set(0.72, 1.3, 0.06); door.add(glow);
    let scroll = 0, reached = false;
    r.move = (P, nx, nz) => {
      const lx = nx - r.x0, facingNorth = Math.cos(P.yaw) > 0.3;
      if (lx > cx1 && lx < cx2 && nz < LINE && nz < P.z && facingNorth) { scroll += P.z - nz; if (wallM.map) wallM.map.offset.x = scroll * 0.1; nz = Math.max(nz, LINE); }
      return [nx, nz];
    };
    c.tick((t, dt, P, ri) => { if (ri !== r.i || reached) return; if (P.z < -5.6 && Math.abs(P.x - r.x0 - W / 2) < 2) { reached = true; door.rotation.y = 0.9; door.position.x -= 0.6; c.sound.chords(6); c.egg('backwards', 'You walked backwards to the door. In this building that is the only way anyone has ever arrived.'); } });
    const ro = c.glb('rosemary', { h: 1.65, x: 11.4, z: 4.2, ry: -0.6, parent: g }); c.post(X(11.4), 4.2, 0.4);
    c.clickable(ro, () => { c.say(ro, 'The neighbours are lovely. They keep counting me in my sleep.', 3200, 2.0); c.egg('rosemary'); }, 'The new tenant');
    const charm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), std(c, 0xc0c0c0, { metalness: 1, roughness: 0.2 })); charm.position.set(cx1 + 0.2, 1.5, 1.4); g.add(charm);
    c.clickable(charm, () => { c.sound.drip(); c.egg('tannis', 'A charm full of something that smells of the eye flower. Wear it. Or do not. Nobody here will say.'); }, 'A charm');
    prop(c, r, g, X, 'vintage_suitcase', 9.0, 5.8, { len: 0.7, ry: 0.3 }); prop(c, r, g, X, 'ornate_mirror_01', cx2 - 0.15, 2.0, { h: 1.2, y: 1.0, ry: -PI / 2 }); prop(c, r, g, X, 'vintage_grandfather_clock_01', cx1 + 0.4, -3.6, { h: 2.1, ry: PI / 2 });
  },

  apartment(c, r, g, X) {
    const { THREE } = c;
    // the west half: desks in forced perspective, smaller every row
    for (let row = 0; row < 7; row++) { const s = Math.pow(0.86, row), z = 5 - row * 1.7 * s; for (let col = 0; col < 3; col++) { const x = 2.4 + col * 2.2 * s + row * 0.35; const d = new THREE.Group(); d.position.set(x, 0, z); d.scale.setScalar(s); g.add(d); d.add(c.slab(1.4, 0.06, 0.8, std(c, 0x7a7a7a), 0, 0.76, 0)); d.add(c.slab(1.3, 0.72, 0.7, std(c, 0x5a5a5a), 0, 0.38, 0)); d.add(c.slab(0.4, 0.2, 0.3, std(c, 0x2a2a2a), 0.2, 0.88, 0)); if ((row + col) % 2) d.add(extra(c, d, 0, 0.6, { seated: true, col: 0x4a4a4a, ry: PI })); } c.post(X(2.4 + 2.2 * s + row * 0.35), z, 2.2 * s); }
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.03), std(c, 0xd8c060, { metalness: 1, roughness: 0.3 })); key.position.set(2.6, 0.8, 5.0); g.add(key);
    c.clickable(key, () => { c.sound.clink(3000); c.egg('key', 'The key to the executive washroom. Everybody on the nineteenth floor wants it. Nobody remembers why.'); }, 'A key');
    const clerk = c.glb('clerk', { h: 1.8, x: 6.4, z: 6.2, ry: 0.4, parent: g }); c.post(X(6.4), 6.2, 0.45);
    c.clickable(clerk, () => { c.say(clerk, 'Spaghetti, strained through a tennis racket. That is just how you do it.', 3000, 2.0); c.egg('racket'); }, 'The clerk');
    // the east half: an Ames room. The back wall runs from far on the left to near on the right and the ceiling drops
    // with it, so from the X on the floor it reads as a square room and two identical clerks read as giant and tiny.
    const V = new THREE.Vector3(15, 1.62, 5.4), A = new THREE.Vector3(11.5, 0, -6.8), B = new THREE.Vector3(18.6, 0, -2.4), H0 = 3.6;
    const hAt = (p) => H0 * Math.hypot(p.x - V.x, p.z - V.z) / Math.hypot(A.x - V.x, A.z - V.z);
    const check = c.canvasTex(256, 256, (q) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = (x + y) % 2 ? '#e8e8e8' : '#202020'; q.fillRect(x * 32, y * 32, 32, 32); } });
    const quad = (p1, p2, p3, p4, mat) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([...p1, ...p2, ...p3, ...p1, ...p3, ...p4], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); g.add(m); };
    const wm = new THREE.MeshStandardMaterial({ map: check, side: THREE.DoubleSide, roughness: 0.8 }), fm = wm.clone();
    const hA = hAt(A), hB = hAt(B), L = new THREE.Vector3(11.5, 0, -0.6), Rr = new THREE.Vector3(18.6, 0, -0.6);
    quad([A.x, 0, A.z], [B.x, 0, B.z], [B.x, hB, B.z], [A.x, hA, A.z], wm);
    quad([L.x, 0, L.z], [A.x, 0, A.z], [A.x, hA, A.z], [L.x, H0 * 0.75, L.z], wm);
    quad([B.x, 0, B.z], [Rr.x, 0, Rr.z], [Rr.x, H0 * 0.6, Rr.z], [B.x, hB, B.z], wm);
    quad([L.x, 0.01, L.z], [Rr.x, 0.01, Rr.z], [B.x, 0.01, B.z], [A.x, 0.01, A.z], fm);
    quad([L.x, H0 * 0.75, L.z], [A.x, hA, A.z], [B.x, hB, B.z], [Rr.x, H0 * 0.6, Rr.z], wm);
    c.wall(X(L.x), L.z, X(A.x), A.z); c.wall(X(A.x), A.z, X(B.x), B.z); c.wall(X(B.x), B.z, X(Rr.x), Rr.z); c.wall(X(L.x), L.z, X(Rr.x), Rr.z);
    [[A, 0.12], [B, -0.12]].forEach(([p, d]) => { const o = c.glb('clerk', { h: 1.75, x: p.x + (p === A ? 0.9 : -0.9), z: p.z + 0.9, ry: 0.2 + d, parent: g, shadow: false }); });
    const xm = c.sign('X  LOOK FROM HERE', { w: 1.4, h: 0.3, bg: null, fg: '#ffffff', font: c.MONO, weight: 700 }); xm.rotation.x = -PI / 2; xm.position.set(V.x, 0.012, V.z); g.add(xm);
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (Math.hypot(P.x - r.x0 - V.x, P.z - V.z) < 0.5) { c.camera.getWorldDirection(fw); if (fw.z < -0.9) c.egg('ames', 'From the X they are the same room and two very different sizes. They are the same size. The room is not square. That is an Ames room.'); } });
  },

  chase(c, r, g, X) {
    const { THREE } = c;
    // the el: two rows of riveted columns and a deck overhead; in the car they stream past you
    const steel = std(c, 0x3a4a3a, { metalness: 0.7, roughness: 0.6 }), cols = [];
    for (let k = 0; k < 9; k++) [3.2, 16.8].forEach((x) => { const m = c.slab(0.4, 6, 0.4, steel, x, 3, 7 - k * 1.9); g.add(m); cols.push(m); c.post(X(x), 7 - k * 1.9, 0.3); });
    g.add(c.slab(15, 0.5, D, steel, W / 2, 6.2, 0));
    const ties = []; for (let k = 0; k < 18; k++) { const m = c.slab(14.6, 0.12, 0.25, std(c, 0x2a2a20), W / 2, 5.9, 7.5 - k * 0.9); g.add(m); ties.push(m); }
    const train = new THREE.Group(); g.add(train); train.add(c.slab(3, 3, 17, std(c, 0x9a9a9a, { metalness: 0.7 }), 0, 0, 0)); for (let k = 0; k < 8; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), basic(c, 0xfff0c0)); w.position.set(1.52, 0.4, -7 + k * 2); w.rotation.y = PI / 2; train.add(w); const w2 = w.clone(); w2.position.x = -1.52; w2.rotation.y = -PI / 2; train.add(w2); }
    const CX = 13.2, car = c.glb('sedan', { len: 5.0, x: CX, z: 1.4, ry: PI, parent: g }); [-0.2, 1.4, 3.0].forEach((z) => c.post(X(CX), z, 1.0));
    let ride = 0, tz = -60, done = false;
    c.tick((t, dt, P, ri) => {
      tz += dt * 22; if (tz > 40) tz = -80; train.position.set(W / 2, 7.9, tz); if (ri === r.i && Math.abs(tz) < 14) c.shake(0.01);
      if (ri !== r.i) return;
      if (ride > 0) {
        ride -= dt; const v = 18; cols.forEach((m) => { m.position.z += v * dt; if (m.position.z > 8) m.position.z -= 9 * 1.9; }); ties.forEach((m) => { m.position.z += v * dt; if (m.position.z > 8) m.position.z -= 18 * 0.9; });
        P.x = r.x0 + CX - 0.4; P.z = 1.2; P.lift = -0.45 + Math.sin(t * 9) * 0.02; c.P.roll = Math.sin(t * 1.7) * 0.03;
        if (Math.random() < dt * 0.5) { c.sound.horn(0.25); P.yaw += (Math.random() - 0.5) * 0.4; c.shake(0.05); }
        const stripe = ((t * 10) | 0) % 2; c.FX.flash = stripe ? 0.06 : 0;
        if (ride <= 0) { c.sound.screech(); c.TIME.target = 1; P.x = r.x0 + CX - 2.2; if (!done) { done = true; c.egg('chase', 'Fourteen seconds under the el at full speed and the car never left its parking space. The columns did the driving.'); } P.z = 5.6; P.lift = 0; }
      }
    });
    c.clickable(car, () => { if (ride > 0) return; ride = 14; c.sound.boom(0.5); c.P.yaw = 0; c.toast('Hold on.', 1500); }, 'Get in');
    prop(c, r, g, X, 'metal_trash_can', 1.4, 2.6, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'cardboard_box_01', 18.8, -4.4, { h: 0.5 }); prop(c, r, g, X, 'fire_hydrant', 18.4, 3.4, { h: 0.85, r: 0.3 });
    const pram = new THREE.Group(); pram.position.set(6.4, 0, -3.0); g.add(pram); pram.add(c.slab(0.7, 0.4, 1.0, std(c, 0x2a2a3a), 0, 0.6, 0)); [[-0.3, -0.4], [0.3, -0.4], [-0.3, 0.4], [0.3, 0.4]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 16), std(c, 0x111111)); w.rotation.y = PI / 2; w.position.set(x, 0.15, z); pram.add(w); });
    c.clickable(pram, () => c.egg('pram', 'An empty pram under the el. Whoever pushed it saw the car and ran. Smart.'), 'A pram');
  },
});


// a facade of windows across a street or courtyard, drawn live from one canvas atlas
function facade(c, g, { x0 = 0, w = 20, h = 16, z = -24, cols = 6, rows = 4, draw }) {
  const { THREE } = c, cw = 128, ch = 128, atlas = c.canvasTex(cw * cols, ch * rows, () => {}), q = atlas.userData.canvas.getContext('2d');
  const f = new THREE.Group(); f.position.set(x0, 0, z); g.add(f); f.add(c.slab(w, h, 0.4, c.surf('brick', 2.4, 0x6a5048), w / 2, h / 2, 0));
  const wins = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const geo = new THREE.PlaneGeometry(1.8, 2.2), uv = geo.attributes.uv; for (let v = 0; v < uv.count; v++) uv.setXY(v, (i + uv.getX(v)) / cols, 1 - (j + 1 - uv.getY(v)) / rows); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false, fog: false })); m.position.set(1.8 + i * (w - 3.6) / (cols - 1), 2.6 + j * (h - 4.4) / (rows - 1), 0.22); f.add(m); wins.push(m); }
  const paint = (t) => { for (let k = 0; k < cols * rows; k++) { const ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch; q.save(); q.beginPath(); q.rect(ox, oy, cw, ch); q.clip(); q.translate(ox, oy); draw(q, k, t, cw, ch); q.strokeStyle = '#2a1a14'; q.lineWidth = 8; q.strokeRect(0, 0, cw, ch); q.restore(); } atlas.needsUpdate = true; };
  return { f, wins, paint };
}
function figure(q, x, y, s, col, t, arms = 0) { q.fillStyle = col; q.fillRect(x - 8 * s, y - 26 * s, 16 * s, 40 * s); q.strokeStyle = col; q.lineWidth = 5 * s; q.beginPath(); q.moveTo(x - 7 * s, y - 22 * s); q.lineTo(x - 20 * s, y - 22 * s - arms * 18 * s + Math.sin(t * 6) * 4 * s); q.moveTo(x + 7 * s, y - 22 * s); q.lineTo(x + 20 * s, y - 22 * s - arms * 18 * s + Math.cos(t * 6) * 4 * s); q.stroke(); eyeFlower(q, x, y - 40 * s, 17 * s); }

Object.assign(ROOM, {
  birdman(c, r, g, X) {
    const { THREE } = c;
    // hold F (or click the wings) to rise over Times Square; let go and you glide back down
    let wings = 0, flown = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const up = (c.keys && c.keys.KeyF) || wings > 0; if (wings > 0) wings -= dt;
      P.lift = up ? Math.min(9, P.lift + dt * 3.2) : Math.max(0, P.lift - dt * 1.6);
      if (P.lift > 6 && !flown) { flown = true; c.egg('fly', 'You flew over Times Square in your underwear. Nobody looked up. It is Times Square.'); }
    });
    const w = c.sign('WINGS', { w: 1.2, h: 0.4, bg: '#111', fg: '#ff4fa3', font: c.MONO, weight: 700, border: '#ff4fa3' }); w.position.set(4.2, 1.4, 4.0); w.rotation.y = 0.6; g.add(w);
    c.clickable(w, () => { wings = 4; c.sound.whoosh(0.4, 2); }, 'Fly');
    const fl = c.glb('flyer', { h: 1.8, x: 15.6, y: 0, z: -5.6, ry: -0.3, parent: g }); c.post(X(15.6), -5.6, 0.4);
    c.clickable(fl, () => { c.say(fl, 'I am not the guy in the costume. I am the guy in the underwear. Look up.', 3200, 2.0); c.egg('flyer'); }, 'The actor');
    // a water tower, vents, feathers
    const wood = std(c, 0x6a4a30, { roughness: 0.9 }); const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 2.6, 18), wood); tank.position.set(3.2, 4.4, -5.2); g.add(tank); const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.0, 18), std(c, 0x3a3a3a)); cone.position.set(3.2, 6.2, -5.2); g.add(cone);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(c.slab(0.12, 3.1, 0.12, std(c, 0x2a2a2a, { metalness: 0.7 }), 3.2 + dx, 1.55, -5.2 + dz)); c.post(X(3.2), -5.2, 1.6);
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }); const fe = [];
    for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.2), fm); m.position.set(Math.random() * W, Math.random() * 9, -7 + Math.random() * 14); g.add(m); fe.push(m); }
    c.tick((t, dt) => fe.forEach((m, k) => { m.position.y -= dt * 0.4; m.position.x += Math.sin(t + k) * dt * 0.3; m.rotation.z += dt; if (m.position.y < 0) m.position.y = 9; }));
    prop(c, r, g, X, 'security_light', 0.2, 1, { h: 0.4, y: 4, ry: PI / 2 });
  },

  network(c, r, g, X, mats) {
    const { THREE } = c;
    const frame = std(c, 0xe8e0d0, { roughness: 0.6 });
    for (const x of [4.05, 8, 12, 15.95]) g.add(c.slab(0.14, PORTAL.h, 0.16, frame, x, PORTAL.h / 2, -D / 2 + 0.1));
    g.add(c.slab(PORTAL.w, 0.95, 0.3, mats.wall, W / 2, 0.47, -D / 2 + 0.1)); c.wall(X(4), -D / 2 + 0.4, X(16), -D / 2 + 0.4);
    // the building across the street, every window a life
    const lit = new Array(24).fill(false); [3, 9, 16].forEach((k) => { lit[k] = true; });
    const F = facade(c, g, { z: -20, draw: (q, k, t, w, h) => { q.fillStyle = lit[k] ? '#ffd890' : '#141820'; q.fillRect(0, 0, w, h); if (lit[k]) figure(q, w / 2, h * 0.7, 1.1, '#2a2030', t + k, shouting ? 1 : 0); } });
    let shouting = false, last = 0; F.paint(0);
    c.tick((t, dt, P, ri) => { if (ri !== r.i || t - last < 0.12) return; last = t; F.paint(t); });
    // rain and lightning
    const NR = 700, rp = new Float32Array(NR * 3); for (let k = 0; k < NR; k++) { rp[k * 3] = Math.random() * W; rp[k * 3 + 1] = Math.random() * 14; rp[k * 3 + 2] = -9 - Math.random() * 10; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0xaac8ff, size: 0.04, transparent: true, opacity: 0.7 })); rain.frustumCulled = false; g.add(rain);
    let bolt = 6;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NR; k++) { rp[k * 3 + 1] -= dt * 9; if (rp[k * 3 + 1] < 0) rp[k * 3 + 1] = 14; } rg.attributes.position.needsUpdate = true; bolt -= dt; if (bolt <= 0) { bolt = 6 + Math.random() * 6; c.flash(0.5); setTimeout(() => c.sound.boom(0.7), 400); } });
    // the shout
    const sill = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 0.6), new THREE.MeshBasicMaterial({ visible: false })); sill.position.set(W / 2, 1.0, -D / 2 + 0.5); g.add(sill);
    const an = c.glb('anchor', { h: 1.85, x: 13.4, z: -5.4, ry: PI + 0.4, parent: g }); c.post(X(13.4), -5.4, 0.45);
    const shout = () => { if (shouting) return; shouting = true; c.sound.chant(0.4); c.say(an, 'I\'M COUNTED AS HELL AND I\'M NOT GOING TO TAKE THIS ANYMORE!', 3600, 2.1); let k = 0; const iv = setInterval(() => { const off = lit.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (!off.length) { clearInterval(iv); c.egg('madashell', 'You shouted out the window and the whole building opened up and shouted back. 1976, still true.'); setTimeout(() => { shouting = false; }, 6000); return; } lit[off[Math.random() * off.length | 0]] = true; if (k++ % 3 === 0) c.sound.chant(0.15); }, 220); };
    c.clickable(sill, shout, 'Open the window and shout'); c.clickable(an, shout, 'The anchorman');
    prop(c, r, g, X, 'Television_01', 3.0, 3.6, { h: 0.6, ry: 1.0 }); prop(c, r, g, X, 'Sofa_01', 7.0, 3.4, { len: 2.1, ry: PI, r: 1.0 }); prop(c, r, g, X, 'ArmChair_01', 16.4, 2.2, { h: 1.0, ry: -2.2, r: 0.55 }); prop(c, r, g, X, 'desk_lamp_arm_01', 17.4, 5.4, { h: 0.5, y: 0.8 }); g.add(c.slab(1.0, 0.8, 0.6, std(c, 0x4a3020), 17.4, 0.4, 5.4));
  },

  gems(c, r, g, X) {
    const { THREE } = c;
    // the buzzer airlock at the west door: the inner glass door opens only after the buzz
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xd0f0ff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2 });
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.4, 3.6), glass); inner.position.set(3.0, 1.7, (DZ1 + DZ2) / 2); g.add(inner);
    [DZ1, DZ2].forEach((z) => { g.add(c.slab(3.0, 3.6, 0.12, std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), 1.5, 1.8, z)); c.wall(X(0), z, X(3), z); });
    const door = c.wall(X(3.0), DZ1, X(3.0), DZ2); let buzzing = -1, buzzed = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const lx = P.x - r.x0; if (buzzing < 0 && !buzzed && lx < 2.9 && P.z > DZ1 && P.z < DZ2) { buzzing = 2.2; c.toast('Wait. They are looking at you on the camera.', 2000); } if (buzzing > 0) { buzzing -= dt; if ((t * 10 | 0) % 2) c.sound.beep(220, 0.06, 0.06, 'square'); if (buzzing <= 0) { buzzed = true; door.off = true; inner.position.z = DZ2 + 1.9; c.egg('buzzed', 'Buzzed in. On 47th Street they let you in one door at a time, and only if they like your face.'); } } });
    // cases of gold
    const gold = std(c, 0xf0c040, { metalness: 1, roughness: 0.2 });
    [[6, 3], [14, 3], [6, -1], [14, -1]].forEach(([x, z]) => { g.add(c.slab(3.4, 0.9, 1.0, std(c, 0x1a1a1a), x, 0.45, z)); const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 1.0), glass); top.position.set(x, 1.1, z); g.add(top); c.wall(X(x - 1.7), z, X(x + 1.7), z); for (let k = 0; k < 8; k++) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.1 + (k % 3) * 0.03, 0.012, 6, 20), gold); ch.rotation.x = PI / 2; ch.position.set(x - 1.4 + k * 0.4, 0.93, z); g.add(ch); } });
    // the opal
    const opT = c.canvasTex(256, 256, (q) => { q.fillStyle = '#05030a'; q.fillRect(0, 0, 256, 256); for (let k = 0; k < 400; k++) { q.fillStyle = `hsla(${180 + Math.random() * 160},90%,${50 + Math.random() * 30}%,${Math.random()})`; q.beginPath(); q.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3, 0, 7); q.fill(); } });
    const opal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ map: opT, emissiveMap: opT, emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3 })); opal.position.set(10, 1.35, -3.6); g.add(opal);
    g.add(c.slab(0.8, 1.05, 0.8, std(c, 0x2a0a3a), 10, 0.52, -3.6)); c.post(X(10), -3.6, 0.6); c.tick((t) => { opal.rotation.y = t * 0.4; opal.rotation.x = t * 0.2; });
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:30;pointer-events:none;display:none'; document.body.appendChild(cv);
    c.clickable(opal, () => { cv.width = innerWidth; cv.height = innerHeight; cv.style.display = 'block'; const q = cv.getContext('2d'), st = Array.from({ length: 500 }, () => ({ a: Math.random() * 6.3, d: Math.random(), h: 180 + Math.random() * 160 })); const t0 = performance.now(); c.sound.whoosh(0.6, 4);
      const fr = () => { const u = (performance.now() - t0) / 4000; q.fillStyle = 'rgba(4,2,10,.25)'; q.fillRect(0, 0, cv.width, cv.height); st.forEach((p) => { p.d += 0.012 + p.d * 0.03; if (p.d > 1.5) p.d = 0.01; const R = p.d * p.d * Math.max(cv.width, cv.height); q.fillStyle = `hsl(${p.h},90%,70%)`; q.fillRect(cv.width / 2 + Math.cos(p.a) * R, cv.height / 2 + Math.sin(p.a) * R, 2 + p.d * 4, 2 + p.d * 4); }); if (u < 1) requestAnimationFrame(fr); else { cv.style.display = 'none'; c.egg('opal', 'There is a whole galaxy in that rock. Everybody wants to look. Nobody wants to pay.'); } }; fr(); }, 'Look into the opal');
    const jw = c.glb('jeweler', { h: 1.8, x: 12.4, z: -4.6, ry: -0.5, parent: g }); c.post(X(12.4), -4.6, 0.45);
    c.clickable(jw, () => { c.say(jw, 'This is how I count.', 2400, 2.0); c.egg('jeweler'); }, 'The jeweller');
    prop(c, r, g, X, 'CashRegister_01', 14, 3, { h: 0.35, y: 1.3, ry: PI }); prop(c, r, g, X, 'security_light', W - 0.2, -6, { h: 0.4, y: 4, ry: -PI / 2 });
  },

  smoke(c, r, g, X) {
    const { THREE } = c;
    // the album: every page is the same corner, same minute, a different day
    const DAYS = [['DAY 1', 0xfff2e0], ['DAY 412, RAIN', 0x8a98b0], ['DAY 1,096, SNOW', 0xe8f0ff], ['DAY 1,830, AUGUST', 0xffd090], ['DAY 2,201, FOG', 0xb0b0b0], ['DAY 2,750, GOLD', 0xffc070], ['DAY 3,014, BLUE HOUR', 0x7090d0], ['DAY 3,333', 0xffe8d0], ['DAY 3,650, DUSK RED', 0xff9070], ['DAY 4,000', 0xffffff]];
    let day = 0;
    const lbl = c.sign('DAY 1 · 8:00 A.M.', { w: 2.4, h: 0.4, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); lbl.position.set(W / 2, 4.9, -D / 2 + 0.06); g.add(lbl);
    const setLabel = (txt) => { const cv = lbl.material.map.userData.canvas, q = cv.getContext('2d'); q.fillStyle = '#111'; q.fillRect(0, 0, cv.width, cv.height); q.fillStyle = '#f5c542'; q.font = `700 ${cv.height * 0.45}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(txt, cv.width / 2, cv.height / 2); lbl.material.map.needsUpdate = true; };
    g.add(c.slab(4, 1.0, 0.9, std(c, 0x5a3a20), 13, 0.5, 1.2)); c.wall(X(11), 0.8, X(15), 0.8);
    const album = new THREE.Group(); album.position.set(12.4, 1.02, 1.2); g.add(album); album.add(c.slab(0.7, 0.06, 0.5, std(c, 0x2a1a10), 0, 0, 0)); album.add(c.slab(0.64, 0.02, 0.46, std(c, 0xf4ead2), 0, 0.04, 0));
    let flips = 0;
    c.clickable(album, () => { day = (day + 1) % DAYS.length; const [txt, tint] = DAYS[day]; setLabel(`${txt} · 8:00 A.M.`); if (r.plateMesh) r.plateMesh.material.color.set(tint); c.sound.tick(); if (++flips === 10) c.egg('album', 'Ten pages, ten days, one corner. You only see it if you slow down. MLow has been doing it for twenty seven years.'); }, 'Turn the page');
    const au = c.glb('auggie', { h: 1.8, x: 14.4, z: 2.2, ry: PI + 0.3, parent: g }); c.post(X(14.4), 2.2, 0.45);
    c.clickable(au, () => { c.say(au, 'Every morning at eight, same corner. People think it is the same picture. It never is.', 3400, 2.0); c.egg('auggie'); }, 'Auggie');
    const tri = new THREE.Group(); tri.position.set(7.0, 0, -5.6); g.add(tri); for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2, l = c.slab(0.03, 1.4, 0.03, std(c, 0x222222, { metalness: 0.7 }), Math.cos(a) * 0.25, 0.65, Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); tri.add(l); }
    const cam = prop(c, r, g, X, 'Camera_01', 7.0, -5.6, { h: 0.22, y: 1.35, ry: PI }); c.post(X(7.0), -5.6, 0.35);
    c.clickable(cam, () => { c.flash(0.7); c.sound.pop(); c.egg('photo', 'Click. Eight a.m. Tomorrow you come back and take it again.'); }, 'Take today\'s picture');
    for (let k = 0; k < 14; k++) g.add(c.slab(0.3, 0.08, 0.22, std(c, [0x8a3a1a, 0xc8a050, 0x2a4a2a, 0x6a1a1a][k % 4]), 11.4 + (k % 7) * 0.45, 1.04 + Math.floor(k / 7) * 0.09, 1.0));
    prop(c, r, g, X, 'metal_trash_can', 4.2, -5.8, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'WoodenChair_01', 15.6, -2, { h: 0.95, ry: -1, r: 0.35 });
  },

  mail(c, r, g, X) {
    const { THREE } = c;
    // shelves of books, instanced
    const NB = 900, bk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.28, 0.2), new THREE.MeshStandardMaterial({ roughness: 0.7 }), NB), m4 = new THREE.Matrix4(), col = new THREE.Color(); g.add(bk);
    let n = 0; const unit = (x, z, ry) => { g.add(c.slab(2.0, 2.4, 0.4, std(c, 0x6a4a2a), x, 1.2, z, 1)); for (let sh = 0; sh < 5 && n < NB; sh++) for (let b = 0; b < 30 && n < NB; b++) { const h = 0.22 + Math.random() * 0.1; m4.makeScale(1, h / 0.28, 1); m4.setPosition(x - 0.9 + b * 0.062, 0.3 + sh * 0.45 + h / 2, z + (ry ? -0.22 : 0.22)); bk.setMatrixAt(n, m4); bk.setColorAt(n++, col.setHSL(Math.random(), 0.5, 0.45)); } };
    [3, 6, 14, 17].forEach((x) => unit(x, -5.4, 0)); [-5.4].forEach((z) => [3, 6, 14, 17].forEach((x) => c.wall(X(x - 1), z, X(x + 1), z)));
    bk.count = n; bk.instanceMatrix.needsUpdate = true; bk.instanceColor.needsUpdate = true;
    // the computer on the desk, and the dial up
    g.add(c.slab(1.6, 0.76, 0.8, std(c, 0x7a5a3a), 16.2, 0.38, 3.6)); c.post(X(16.2), 3.6, 0.9);
    const scrT = c.canvasTex(256, 192, () => {}), sq = scrT.userData.canvas.getContext('2d'); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshBasicMaterial({ map: scrT, toneMapped: false })); scr.position.set(16.2, 1.12, 3.25); scr.rotation.y = PI; g.add(scr);
    g.add(c.slab(0.5, 0.42, 0.45, std(c, 0xe8e0c8), 16.2, 1.0, 3.5)); g.add(c.slab(0.5, 0.03, 0.18, std(c, 0xe8e0c8), 16.2, 0.78, 3.1));
    const typeLines = (lines) => { let i = 0; const all = lines.join('\n'); const iv = setInterval(() => { i++; sq.fillStyle = '#0a1a4a'; sq.fillRect(0, 0, 256, 192); sq.fillStyle = '#e8f0ff'; sq.font = '600 13px monospace'; all.slice(0, i).split('\n').forEach((l, k) => sq.fillText(l, 10, 22 + k * 18)); scrT.needsUpdate = true; if (i >= all.length) clearInterval(iv); }, 45); };
    typeLines(['N3W ONLINE', '', 'click to sign on']);
    let online = false;
    c.clickable(scr, () => { if (online) return; online = true; c.sound.modem(); typeLines(['Dialing...', '', '', '']); setTimeout(() => { typeLines(['Welcome!', 'YOU\'VE GOT COUNTED.', '', 'NY152: hello?', 'NY152: are you on the', '  upper west side too?', 'NY152: I count you.']); c.egg('mail', 'You dialled in. You have got counted. Somebody on the Upper West Side has been typing to you all along.'); }, 5200); }, 'Sign on');
    const bs = c.glb('bookseller', { h: 1.7, x: 8.6, z: 1.2, ry: 0.4, parent: g }); c.post(X(8.6), 1.2, 0.4);
    c.clickable(bs, () => { c.say(bs, 'We are the shop around the count. Small, a little broke, and every book has been read by somebody who loves it.', 3800, 1.9); c.egg('bookseller'); }, 'The bookseller');
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), std(c, 0xc84a3a, { roughness: 1 })); rug.rotation.x = -PI / 2; rug.position.set(5, 0.012, 2.2); g.add(rug);
    prop(c, r, g, X, 'Rockingchair_01', 5, 3.6, { h: 1.1, ry: PI, r: 0.5, spin: 1.1 }); [[4, 1.4], [6, 1.4], [5, 0.8]].forEach(([x, z]) => prop(c, r, g, X, 'wooden_stool_01', x, z, { h: 0.35 }));
    prop(c, r, g, X, 'potted_plant_02', 19, 6.8, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'desk_lamp_arm_01', 16.8, 3.7, { h: 0.5, y: 0.76 });
  },

  batteries(c, r, g, X) {
    const { THREE } = c;
    g.add(c.slab(10, 1.05, 0.8, std(c, 0xd8d0c0, { roughness: 0.4 }), W / 2, 0.52, -4.6)); c.wall(X(5), -4.6, X(15), -4.6);
    [6, 8, 10, 12, 14].forEach((x) => prop(c, r, g, X, 'bar_chair_round_01', x, -3.7, { h: 0.8 }));
    // six broken plates on the floor
    const plateM = std(c, 0xf4f4ee, { roughness: 0.3, side: THREE.DoubleSide }), spots = [[4, 1], [7, 3.6], [12, 2.2], [15, 0], [17, 4], [9, -1.6]];
    const broken = spots.map(([x, z]) => { const shards = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.16, 6, k / 6 * PI * 2, PI / 3), plateM); m.rotation.x = -PI / 2; const a = Math.random() * 6.3, d = 0.2 + Math.random() * 0.5; m.userData.from = new THREE.Vector3(x + Math.cos(a) * d, 0.012, z + Math.sin(a) * d); m.userData.to = new THREE.Vector3(x, 0.012, z); m.userData.r0 = Math.random() * 6; m.position.copy(m.userData.from); m.rotation.z = m.userData.r0; g.add(m); shards.push(m); } return { x, z, shards, fixed: false, u: 0 }; });
    // two saucers the size of hubcaps
    const mk = () => { const s = new THREE.Group(); g.add(s); s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.07, 24), std(c, 0xc8ccd0, { metalness: 1, roughness: 0.2 }))); const d = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, 2 * PI, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0x80ffd0, emissive: 0x30c090 })); d.position.y = 0.03; s.add(d); const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x80ffd0, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = -0.45; beam.visible = false; s.add(beam); s.userData.beam = beam; s.position.set(10, 2, 0); return s; };
    const sau = [mk(), mk()]; let allFixed = false;
    sau.forEach((s, k) => c.clickable(s, () => { c.sound.beep(1800 + k * 300, 0.06, 0.12, 'sine'); c.egg('saucer', 'It beeps at you. It is the size of a hubcap and twice as loyal.'); }, 'A tiny saucer'));
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;   // the saucers only work while you watch, or the egg pops up three sets away
      sau.forEach((s, k) => {
        let target = null; const job = broken.find((b, i) => !b.fixed && i % 2 === k);
        if (job) target = new THREE.Vector3(job.x, 0.9, job.z); else target = new THREE.Vector3(P.x - r.x0 + (k ? 0.6 : -0.6), P.y + 0.4, P.z - 0.8);
        s.position.lerp(target, Math.min(1, dt * (job ? 1.2 : 2))); s.rotation.y += dt * 4; s.position.y += Math.sin(t * 3 + k) * 0.003;
        const at = job && s.position.distanceTo(target) < 0.3; s.userData.beam.visible = !!at;
        if (at) { job.u = Math.min(1, job.u + dt * 0.4); job.shards.forEach((m) => { m.position.lerpVectors(m.userData.from, m.userData.to, job.u); m.rotation.z = m.userData.r0 * (1 - job.u); }); if (job.u >= 1) { job.fixed = true; c.sound.ding(); } }
      });
      if (!allFixed && broken.every((b) => b.fixed)) { allFixed = true; c.egg('fixed', 'Every plate in the diner is mended. The saucers want to come with you. Let them.'); }
    });
    prop(c, r, g, X, 'CashRegister_01', 14.4, -4.7, { h: 0.35, y: 1.05, ry: PI }); prop(c, r, g, X, 'carrot_cake', 7, -4.6, { len: 0.3, y: 1.05 });
    [[2, 4], [18, 4], [2, -1], [18, -1]].forEach(([x, z]) => { g.add(c.slab(1.6, 0.76, 0.9, std(c, 0x8a2a2a), x, 0.38, z)); c.post(X(x), z, 0.9); });
  },

  susan(c, r, g, X) {
    const { THREE } = c;
    // the stage and the cabinet; the balcony you can only reach by vanishing
    const SZ1 = -6.6, SZ2 = -4.0, SH = 0.6, BZ = 5.2, BH = 3.0;
    g.add(c.slab(12, SH, SZ2 - SZ1, std(c, 0x2a1020), W / 2, SH / 2, (SZ1 + SZ2) / 2)); g.add(c.slab(20, 0.2, D / 2 - BZ, std(c, 0x1a0a14), W / 2, BH - 0.1, (BZ + D / 2) / 2)); g.add(c.slab(20, 1.0, 0.08, std(c, 0xc8a050, { metalness: 1 }), W / 2, BH + 0.5, BZ));
    for (const x of [1.5, 5.5, 14.5, 18.5]) g.add(c.slab(0.2, BH, 0.2, std(c, 0x1a0a14), x, BH / 2, BZ + 0.2));
    r.ground = (lx, z) => { if (r.onBalcony && z > BZ) return BH; if (lx > 4 && lx < 16 && z > SZ1 && z < SZ2) return SH; return 0; };
    const starT = c.canvasTex(256, 512, (q) => { q.fillStyle = '#1a1050'; q.fillRect(0, 0, 256, 512); q.fillStyle = '#f5c542'; for (let k = 0; k < 60; k++) { const x = Math.random() * 256, y = Math.random() * 512, s = 4 + Math.random() * 8; q.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? s * 0.4 : s; q.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } q.fill(); } });
    const cab = new THREE.Group(); cab.position.set(W / 2, SH, -5.3); g.add(cab); const cm = new THREE.MeshStandardMaterial({ map: starT, roughness: 0.5 });
    cab.add(c.slab(1.2, 2.4, 0.06, cm, 0, 1.2, -0.6)); cab.add(c.slab(0.06, 2.4, 1.2, cm, -0.6, 1.2, 0)); cab.add(c.slab(0.06, 2.4, 1.2, cm, 0.6, 1.2, 0)); cab.add(c.slab(1.26, 0.1, 1.26, cm, 0, 2.45, 0));
    let inside = 0, gone = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { r.onBalcony = false; return; } const lx = P.x - r.x0; if (!r.onBalcony && Math.abs(lx - W / 2) < 0.55 && Math.abs(P.z + 5.3) < 0.55) { inside += dt; if (inside > 1.2) { inside = 0; c.flash(1); c.sound.boom(0.5); r.onBalcony = true; P.x = r.x0 + W / 2; P.z = 6.6; P.yaw = 0; if (!gone) { gone = true; c.egg('vanish', 'Abracadabra. You stepped into the cabinet on the stage and came out on the balcony. The club applauds.'); c.sound.applause(3); } } } else inside = 0;
      if (r.onBalcony && (P.x - r.x0 > 18.6 || P.x - r.x0 < 1.4)) { r.onBalcony = false; P.z = 4.4; } });
    c.wall(X(0), BZ - 0.05, X(1.4), BZ - 0.05); c.wall(X(1.4), BZ, X(18.6), BZ); r.colliderNote = 'the balcony rail blocks walking up from below; the ends drop you back down';
    const su = c.glb('susan', { h: 1.7, x: 16.6, z: -2.0, ry: -0.3, parent: g }); c.post(X(16.6), -2.0, 0.4);
    c.clickable(su, () => { c.say(su, 'Seeking somebody? Everybody in this club is seeking somebody.', 3000, 2.0); c.egg('jacket', 'That jacket. Half of downtown has been seeking it since 1985.'); }, 'The jacket');
    [[4, -1.6], [7.5, 0.6], [12.5, 0.6], [16, 2.6], [5, 3]].forEach(([x, z]) => { prop(c, r, g, X, 'round_wooden_table_01', x, z, { len: 0.9, r: 0.55 }); prop(c, r, g, X, 'dining_chair_02', x - 0.7, z, { h: 0.9, ry: PI / 2 }); });
  },

  dumbo(c, r, g, X) {
    const { THREE } = c;
    // the one cobble the picture was taken from
    const SPOT = new THREE.Vector3(W / 2 + 0.6, 0, 1.4), xm = c.sign('X', { w: 0.5, h: 0.5, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900 }); xm.rotation.x = -PI / 2; xm.position.set(SPOT.x, 0.03, SPOT.z); g.add(xm);
    const fw = new THREE.Vector3(); let framed = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (r.bars) { r.bars = false; document.querySelector('#bars').classList.remove('on'); } return; } const on = Math.hypot(P.x - r.x0 - SPOT.x, P.z - SPOT.z) < 0.5; c.camera.getWorldDirection(fw); const aimed = on && fw.z < -0.95 && Math.abs(fw.y) < 0.2;
      if (aimed !== !!r.bars) { r.bars = aimed; document.querySelector('#bars').classList.toggle('on', aimed); c.FX.sat = aimed ? 0.15 : null; }
      if (aimed && !framed) { framed = true; c.egg('theshot', 'From this one cobble the bridge frames the city like a picture. Every photographer in New York has stood exactly here.'); } });
    // the kids, running down the street and back
    const kids = [0, 1, 2, 3].map((k) => extra(c, g, 4 + k, 0, { col: [0x4a3a2a, 0x2a3a4a, 0x5a4a3a, 0x3a2a2a][k] }));
    kids.forEach((o) => o.scale.setScalar(0.7));
    c.tick((t) => kids.forEach((o, k) => { const u = (Math.sin(t * 0.5 + k * 0.4) + 1) / 2; o.position.set(5 + k * 1.2, Math.abs(Math.sin(t * 8 + k)) * 0.06, 5 - u * 10); o.rotation.y = Math.cos(t * 0.5 + k * 0.4) > 0 ? PI : 0; }));
    prop(c, r, g, X, 'wooden_barrels_01', 1.6, -4, { h: 1.0, r: 0.6 }); prop(c, r, g, X, 'wooden_crate_01', 18.4, -2, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'wooden_crate_02', 18.6, -1.2, { h: 0.55, y: 0.6 });
    [[14, 2.4], [14.6, 2.0], [13.4, 1.8]].forEach(([x, z], k) => c.glb('pigeon', { h: 0.3, x, z, ry: k * 2, parent: g }));
  },

  bronx(c, r, g, X) {
    const { THREE } = c;
    // the door test
    const car = c.glb('sedan', { len: 5.0, x: 15.4, z: 0.8, ry: PI, parent: g }); [-0.8, 0.8, 2.4].forEach((z) => c.post(X(15.4), z, 1.0));
    let tested = false;
    c.clickable(car, () => { if (tested) return; tested = true; c.toast('Lock her door. Walk round. If she reaches over and unlocks yours, she is the one.', 3200); setTimeout(() => { c.sound.clink(500); c.sound.thud(0.2); c.egg('doortest', 'She reached over and unlocked your door. She is the one. The saddest thing in life is a count you never made.'); }, 3600); }, 'The door test');
    // dice on the sidewalk
    const dice = [0, 1].map((k) => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), std(c, 0xf4f0e8, { roughness: 0.3 })); d.position.set(4.6 + k * 0.25, 0.06, 2.6); g.add(d); return d; });
    let rolling = 0, sevens = 0;
    dice.forEach((d) => c.clickable(d, () => { if (rolling > 0) return; rolling = 1.0; c.sound.tick(); }, 'Roll'));
    c.tick((t, dt) => { if (rolling <= 0) return; rolling -= dt; dice.forEach((d, k) => { d.rotation.x += dt * 20; d.rotation.z += dt * 15; d.position.y = 0.06 + Math.abs(Math.sin(rolling * 9 + k)) * 0.2; }); if (rolling <= 0) { const a = 1 + (Math.random() * 6 | 0), b = 1 + (Math.random() * 6 | 0); dice.forEach((d) => { d.position.y = 0.06; d.rotation.set(0, Math.random() * 6, 0); }); c.toast(`${a} and ${b}. ${a + b === 7 || a + b === 11 ? 'Winner!' : 'Roll again.'}`, 1800); if (a + b === 7 || a + b === 11) c.egg('dice', 'Seven on the sidewalk on Belmont Avenue. Collect, and do not tell your father.'); } });
    // a stoop and the neighbours on it
    const st = c.surf('concrete', 1.4, 0x8a6a58); for (let k = 0; k < 6; k++) g.add(c.slab(2.0, 0.18, 1.6 - k * 0.2, st, 2.2, 0.09 + k * 0.18, -5.4 + k * 0.1)); c.post(X(2.2), -5.4, 1.2);
    [[1.8, -5.0, 0.9], [2.6, -5.3, 0.72]].forEach(([x, z, y]) => { const e = extra(c, g, x, z, { seated: true, col: 0x5a3a2a }); e.position.y = y - 0.45; });
    const club = c.sign('N3W YORKERS SOCIAL CLUB\nMEMBERS ONLY', { w: 3.2, h: 0.7, bg: '#1a1a1a', fg: '#f4ead2', font: c.SERIF, weight: 800, border: '#c8a050' }); club.position.set(W - 0.16, 3.4, -4.6); club.rotation.y = -PI / 2; g.add(club);
    c.clickable(club, () => c.egg('club', 'Members only. You are not a member. Nobody is a member. Everybody goes in anyway.'), 'The club');
    prop(c, r, g, X, 'WoodenChair_01', 6.2, 3.4, { h: 0.95, ry: 0.5 }); prop(c, r, g, X, 'WoodenChair_01', 7.0, 3.8, { h: 0.95, ry: -0.6 }); prop(c, r, g, X, 'metal_trash_can', 18.8, -6.4, { h: 0.95, r: 0.35 }); prop(c, r, g, X, 'street_lamp_01', 1.2, 3.4, { h: 4.6, r: 0.25 });
  },

  kramer(c, r, g, X) {
    const { THREE } = c;
    // the island, the bowl, the pan, and four eggs
    g.add(c.slab(8, 0.92, 1.4, std(c, 0xe8e0d0, { roughness: 0.4 }), W / 2, 0.46, -1.4)); c.wall(X(6), -2.1, X(14), -2.1); c.wall(X(6), -0.7, X(14), -0.7);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 10, 0, 2 * PI, PI / 2, PI / 2), std(c, 0xf4f4f0, { side: THREE.DoubleSide })); bowl.position.set(10, 1.14, -1.4); g.add(bowl);
    const yolk = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20), std(c, 0xf0b020)); yolk.rotation.x = -PI / 2; yolk.position.set(10, 0.95, -1.4); yolk.scale.setScalar(0.01); g.add(yolk);
    const shell = std(c, 0xf4ece0, { roughness: 0.5 }); let cracked = 0;
    [8.2, 8.7, 11.3, 11.8].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), shell); e.scale.set(1, 1.3, 1); e.position.set(x, 0.99, -1.2); g.add(e);
      c.clickable(e, () => { if (!e.visible) return; e.visible = false; c.sound.crack(); cracked++; yolk.scale.setScalar(cracked / 4); for (const dx of [-0.05, 0.05]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6, 0, PI), shell); h.position.set(10 + dx * 3, 0.95, -1.0); h.rotation.set(Math.random(), Math.random() * 6, 0); g.add(h); }
        if (cracked === 4) { c.egg('frenchtoast', 'Four eggs cracked into the bowl. Four easter eggs. Literally.'); toast.visible = true; } }, 'Crack an egg'); });
    // the stove and the pan
    g.add(c.slab(1.6, 0.92, 0.8, std(c, 0xd8d8d0, { metalness: 0.3 }), 16.6, 0.46, -6.8)); c.post(X(16.6), -6.8, 1.0);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.05, 24), std(c, 0x2a2a2a, { metalness: 0.8 })); pan.position.set(16.6, 0.97, -6.7); g.add(pan);
    const toast = c.slab(0.24, 0.03, 0.24, std(c, 0xd09040, { roughness: 0.8 }), 16.6, 1.01, -6.7); toast.visible = false; g.add(toast); steam(c, g, 16.6, 1.0, -6.7);
    const dad = c.glb('dad', { h: 1.8, x: 15.4, z: -5.6, ry: 0.8, parent: g }); c.post(X(15.4), -5.6, 0.45);
    c.clickable(dad, () => { c.say(dad, 'We are a team. You crack, I flip. Do not tell your mother about the smoke.', 3200, 2.0); c.egg('dad'); }, 'Dad');
    const kid = extra(c, g, 13.6, -4.8, { col: 0x3a6aaa, ry: 0.4 }); kid.scale.setScalar(0.62);
    [7.4, 9, 11, 12.6].forEach((x) => prop(c, r, g, X, 'bar_chair_round_01', x, 0.0, { h: 0.8 }));
    prop(c, r, g, X, 'alarm_clock_01', 2.6, -6.9, { h: 0.15, y: 0.92 }); g.add(c.slab(2.4, 0.92, 0.7, std(c, 0xc8b898), 2.6, 0.46, -7.2)); prop(c, r, g, X, 'potted_plant_02', 19, 6.8, { h: 1.3, r: 0.4 }); prop(c, r, g, X, 'food_apple_01', 3.0, -7.1, { len: 0.08, y: 0.92 });
  },
});

Object.assign(ROOM, {
  zoolander(c, r, g, X) {
    const { THREE } = c;
    // the model: a centre for kids, so small it is for ants. Every click, three times bigger.
    g.add(c.slab(4.4, 0.06, 1.6, std(c, 0xf4f4f0, { roughness: 0.3 }), W / 2, 0.76, -3.6)); [-2, 2].forEach((dx) => g.add(c.slab(0.08, 0.74, 1.4, std(c, 0xc0c0c0, { metalness: 0.8 }), W / 2 + dx, 0.37, -3.6))); c.wall(X(7.8), -3.6, X(12.2), -3.6);
    const model = new THREE.Group(); model.position.set(W / 2, 0.79, -3.6); g.add(model);
    const wm = std(c, 0xe8e8e0, { roughness: 0.6 }), gl = std(c, 0x6a9ac0, { metalness: 0.6, roughness: 0.2 });
    [[0, 0, 0.1, 0.12, 0.1], [0.08, 0, 0.06, 0.08, 0.06], [-0.07, 0.02, 0.05, 0.06, 0.05]].forEach(([x, z, w, h, d]) => { model.add(c.slab(w, h, d, wm, x, h / 2, z)); model.add(c.slab(w * 0.9, h * 0.6, 0.002, gl, x, h * 0.55, z + d / 2 + 0.001)); });
    const tag = c.sign('CENTER FOR KIDS WHO CANT COUNT GOOD', { w: 0.24, h: 0.03, bg: '#fff', fg: '#111', font: c.MONO, weight: 700 }); tag.position.set(0, 0.005, 0.1); tag.rotation.x = -PI / 2; model.add(tag);
    let k = 1, grow = 1;
    const bs = c.glb('bluesteel', { h: 1.9, x: 12.8, z: -2.2, ry: -0.8, parent: g }); c.post(X(12.8), -2.2, 0.45);
    c.clickable(model, () => { if (k >= 27) { k = 1; c.toast('Back to ant size.'); return; } c.say(bs, k === 1 ? 'What is this? A center for ants? It needs to be at least three times bigger.' : 'Bigger.', 2600, 2.1); k *= 3; c.sound.whoosh(0.3, 1); if (k === 27) c.egg('ants', 'Three times bigger, three times. Now the center for ants is a center for New Yorkers.'); }, 'The model');
    c.tick((t, dt) => { grow += (k - grow) * Math.min(1, dt * 2); model.scale.setScalar(grow); });
    c.clickable(bs, () => { c.flash(0.6); c.sound.pop(); c.say(bs, 'Blue Steel.', 1600, 2.1); c.egg('bluesteel', 'Blue Steel. Ferrari. Le Tigre. They are the same look. You count them anyway.'); }, 'The model');
    prop(c, r, g, X, 'GreenChair_01', 8.6, -2.2, { h: 0.95, ry: PI }); prop(c, r, g, X, 'GreenChair_01', 11.4, -2.2, { h: 0.95, ry: PI }); prop(c, r, g, X, 'potted_plant_02', 1, 6.8, { h: 1.4, r: 0.4 }); prop(c, r, g, X, 'potted_plant_02', 19, 6.8, { h: 1.4, r: 0.4 });
  },

  wildstyle(c, r, g, X) {
    const { THREE } = c;
    // a train in the yard and as many cans as you like
    for (const z of [-4.4, -3.0, 1.6, 3.0]) g.add(c.slab(W, 0.12, 0.1, std(c, 0x7a6a5a, { metalness: 0.6, roughness: 0.5 }), W / 2, 0.06, z));
    for (let x = 0.5; x < W; x += 0.8) g.add(c.slab(0.2, 0.08, 2.0, std(c, 0x3a2a1a), x, 0.04, -3.7));
    const car = c.glb('h_subway_car', { len: 15, x: W / 2, z: -3.7, ry: PI / 2, parent: g }); [3, 6.5, 10, 13.5, 17].forEach((x) => c.post(X(x), -3.7, 1.6));
    const TAGS = ['N3W', 'COUNTED', 'MLow', 'EYE', 'NYC', 'WILD', 'FLOWER'], COLS = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ff7a1a', '#9b5cff', '#2ee88a']; let n = 0;
    const paint = () => { const h = c.lastHit; if (!h || !h.face) return; const t = c.canvasTex(256, 128, (q) => { const col = COLS[n % COLS.length]; q.save(); q.translate(128, 64); q.rotate((Math.random() - 0.5) * 0.3); q.font = `900 ${50 + Math.random() * 20}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineWidth = 10; q.strokeStyle = '#111'; q.strokeText(TAGS[n % TAGS.length], 0, 0); q.fillStyle = col; q.fillText(TAGS[n % TAGS.length], 0, 0); q.restore(); if (n % 3 === 0) eyeFlower(q, 30, 30, 24); q.fillStyle = col; for (let k = 0; k < 6; k++) q.fillRect(40 + Math.random() * 180, 90, 4, 10 + Math.random() * 30); });
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.6 })); const nrm = h.face.normal.clone().transformDirection(h.object.matrixWorld); d.position.copy(h.point).addScaledVector(nrm, 0.02); d.lookAt(h.point.clone().addScaledVector(nrm, 1)); c.scene.add(d); g.userData.paints = (g.userData.paints || []).concat(d); n++; c.sound.whoosh(0.15, 0.5);
      if (n === 10) c.egg('burner', 'Ten pieces on one car. By morning this train will carry your name through four boroughs.'); };
    c.clickable(car, paint, 'Paint the train');
    c.tick((t, dt, P, ri) => { (g.userData.paints || []).forEach((d) => { d.visible = Math.abs(ri - r.i) <= 1; }); });
    const wr = c.glb('writer', { h: 1.8, x: 4.2, z: -1.2, ry: PI + 0.4, parent: g }); c.post(X(4.2), -1.2, 0.45);
    c.clickable(wr, () => { c.say(wr, 'Click the train. Go big. Burners only, no toys.', 2800, 2.0); c.egg('writer'); }, 'The writer');
    prop(c, r, g, X, 'spray_paint_bottles_02', 5.0, -0.6, { len: 0.4 }); prop(c, r, g, X, 'spray_paint_bottles_02', 14.4, 0.4, { len: 0.4, ry: 1 }); prop(c, r, g, X, 'Barrel_01', 18.6, 4.6, { h: 0.9, r: 0.4 }); prop(c, r, g, X, 'old_tyre', 1.6, 4.4, { len: 0.7 });
  },

  ragingbull(c, r, g, X) {
    const { THREE } = c;
    // the ring: step in and time slows; flashbulbs from the crowd
    const x1 = 6.5, x2 = 13.5, z1 = -4.5, z2 = 2.5, RH = 0.9;
    g.add(c.slab(x2 - x1, RH, z2 - z1, std(c, 0xd8d8d0, { roughness: 0.9 }), W / 2, RH / 2, (z1 + z2) / 2));
    for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) g.add(c.slab(0.16, 1.6, 0.16, std(c, 0x2a2a2a), x, RH + 0.8, z));
    const rope = std(c, 0xeeeeee); [0.45, 0.9, 1.35].forEach((h) => { g.add(c.slab(x2 - x1, 0.04, 0.04, rope, W / 2, RH + h, z1)); g.add(c.slab(x2 - x1, 0.04, 0.04, rope, W / 2, RH + h, z2)); g.add(c.slab(0.04, 0.04, z2 - z1, rope, x1, RH + h, (z1 + z2) / 2)); g.add(c.slab(0.04, 0.04, z2 - z1, rope, x2, RH + h, (z1 + z2) / 2)); });
    const st = [[W / 2, z2 + 0.3, 0.3], [W / 2, z2 + 0.8, 0]]; g.add(c.slab(1.2, 0.6, 0.5, std(c, 0x3a3a3a), W / 2, 0.3, z2 + 0.35));
    r.ground = (lx, z) => (lx > x1 && lx < x2 && z > z1 && z < z2 ? RH : (Math.abs(lx - W / 2) < 0.6 && z > z2 && z < z2 + 0.6 ? 0.6 : 0));
    c.wall(X(x1), z1, X(x2), z1); c.wall(X(x1), z1, X(x1), z2); c.wall(X(x2), z1, X(x2), z2); c.wall(X(x1), z2, X(W / 2 - 0.6), z2); c.wall(X(W / 2 + 0.6), z2, X(x2), z2);
    const bx = c.glb('boxer', { h: 1.8, x: 12.2, y: RH, z: -3.4, ry: -2.4, parent: g, shadow: false });
    let inRing = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (inRing) { inRing = false; c.TIME.target = 1; } return; } const lx = P.x - r.x0, now = lx > x1 && lx < x2 && P.z > z1 && P.z < z2; if (now !== inRing) { inRing = now; c.TIME.target = now ? 0.35 : 1; if (now) c.egg('ring', 'Inside the ropes everything slows down. The crowd, the lights, your own breath. Then the bell.'); } if (Math.random() < dt * (inRing ? 3 : 1)) { c.flash(0.25); c.sound.pop(); } bx.position.y = RH + Math.abs(Math.sin(t * 3)) * 0.05; bx.rotation.y = -2.4 + Math.sin(t * 1.5) * 0.3; });
    c.clickable(bx, () => { c.sound.thud(0.6); c.say(bx, 'You never got me down. You hear me? You never got me down.', 3000, 2.0); c.egg('boxer'); }, 'The fighter');
    // the heavy bag
    const bag = new THREE.Group(); bag.position.set(17, 3.6, 4); g.add(bag); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.2, 16), std(c, 0x3a2a20, { roughness: 0.6 })); body.position.y = -1.6; bag.add(body); bag.add(c.slab(0.02, 1.0, 0.02, std(c, 0x888888), 0, -0.5, 0)); c.post(X(17), 4, 0.4);
    let sw = 0, sv = 0, hits = 0; c.clickable(bag, () => { sv += 2.2; c.sound.thud(0.5); if (++hits === 5) c.egg('bag', 'Five on the bag. Your hands hurt in black and white too.'); }, 'Hit the bag');
    c.tick((t, dt) => { sv += -sw * 9 * dt; sv *= 0.985; sw += sv * dt; bag.rotation.x = sw; });
  },

  ferry(c, r, g, X) {
    const { THREE } = c;
    // the whole deck rocks on the harbour; the photograph rocks with it
    c.tick((t, dt, P, ri) => { const a = Math.sin(t * 0.55) * 0.025, b = Math.sin(t * 0.37) * 0.012; g.rotation.z = a; g.rotation.x = b; if (r.plateMesh) { r.plateMesh.parent.rotation.z = -a * 0.5; r.plateMesh.parent.position.y = Math.sin(t * 0.55) * 0.12; } if (ri === r.i) { P.roll = a * 0.8; r.sea = (r.sea || 0) + dt; if (r.sea > 20 && !r.legs) { r.legs = true; c.egg('sealegs', 'Twenty seconds on the deck and you have your sea legs. The ferry is still free, after all these years.'); } } });
    g.add(c.slab(PORTAL.w, 1.1, 0.12, std(c, 0xe8e8e0, { metalness: 0.3 }), W / 2, 0.55, -D / 2 + 0.6)); c.wall(X(4), -D / 2 + 0.7, X(16), -D / 2 + 0.7);
    [[4.4, 2], [10, 2], [15.6, 2]].forEach(([x, z]) => prop(c, r, g, X, 'modular_street_seating', x, z, { len: 2.6, r: 1.1 }));
    [3, 17].forEach((x) => c.glb('life_ring', { h: 0.8, x, y: 1.3, z: -D / 2 + 0.7, parent: g, shadow: false }));
    const gulls = [0, 1, 2].map((k) => c.glb('gull', { len: 0.8, parent: g, shadow: false }));
    c.tick((t) => gulls.forEach((o, k) => { const a = t * (0.4 + k * 0.1) + k * 2; o.position.set(W / 2 + Math.cos(a) * (6 + k), 5 + Math.sin(t + k) * 0.5, -3 + Math.sin(a) * 3); o.rotation.y = -a; }));
    const wg = c.glb('workgirl', { h: 1.75, x: 13.4, z: -5.8, ry: PI - 0.4, parent: g }); c.post(X(13.4), -5.8, 0.4);
    c.clickable(wg, () => { c.say(wg, 'I have a head for business and a heart for New York.', 3000, 2.0); c.egg('workgirl'); }, 'The commuter');
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 16, 1, true), std(c, 0xd8b048, { metalness: 1, side: THREE.DoubleSide })); horn.rotation.z = PI / 2; horn.position.set(1.0, 2.4, -2); g.add(horn);
    c.clickable(horn, () => { c.sound.foghorn(); c.egg('horn', 'The ferry horn. Every commuter on the deck pretends it did not make them jump.'); }, 'The horn');
  },

  tenenbaums(c, r, g, X) {
    const { THREE } = c;
    // the centre line: stand on it, look straight down the hall, and the picture snaps into a chapter
    const line = c.slab(0.06, 0.012, D - 1, basic(c, 0xf5c542), W / 2, 0.012, 0); g.add(line);
    const card = document.createElement('div'); card.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,-50%);font:700 42px Fraunces,serif;color:#f4ead2;text-shadow:0 2px 12px #000;letter-spacing:.08em;z-index:9;display:none;text-align:center'; card.innerHTML = 'CHAPTER ONE<br><span style="font:600 16px IBM Plex Mono,monospace;letter-spacing:.3em">THE COUNT</span>'; document.body.appendChild(card);
    const fw = new THREE.Vector3(); let snapped = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { card.style.display = 'none'; if (r.bars) { r.bars = false; document.querySelector('#bars').classList.remove('on'); } return; } c.camera.getWorldDirection(fw); const on = P.z < 1.5 && Math.abs(P.x - r.x0 - W / 2) < 0.18 && fw.z < -0.985 && Math.abs(fw.x) < 0.04; if (on !== !!r.bars) { r.bars = on; document.querySelector('#bars').classList.toggle('on', on); card.style.display = on ? 'block' : 'none'; if (on) c.sound.chords(4); } if (on && !snapped) { snapped = true; c.egg('symmetry', 'Dead centre. Everything on the left is on the right. That is how this family has always liked to be seen.'); } });
    // the tent in the hall
    const tent = new THREE.Group(); tent.position.set(W / 2, 0, -3.4); g.add(tent); const tm = std(c, 0xd8c8a0, { side: THREE.DoubleSide, roughness: 0.9 });
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute([-1.2, 0, -1, 0, 1.3, -1, 0, 1.3, 1, -1.2, 0, -1, 0, 1.3, 1, -1.2, 0, 1, 1.2, 0, -1, 0, 1.3, 1, 0, 1.3, -1, 1.2, 0, -1, 1.2, 0, 1, 0, 1.3, 1], 3)); tg.computeVertexNormals(); tent.add(new THREE.Mesh(tg, tm)); c.post(X(W / 2), -3.4, 1.2);
    c.clickable(tent, () => { c.say(tent, 'Somebody has been living in the hall tent since 1985. Nobody asks.', 2800, 1.7); c.egg('tent'); }, 'The tent');
    // Dalmatian mice
    const spot = c.canvasTex(64, 64, (q) => { q.fillStyle = '#fff'; q.fillRect(0, 0, 64, 64); q.fillStyle = '#111'; for (let k = 0; k < 7; k++) { q.beginPath(); q.arc(Math.random() * 64, Math.random() * 64, 3 + Math.random() * 4, 0, 7); q.fill(); } });
    const mice = []; for (let k = 0; k < 24; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 0.7, 1.6), new THREE.MeshStandardMaterial({ map: spot })); m.position.set(3 + Math.random() * 14, 0.05, -6 + Math.random() * 12); m.userData.a = Math.random() * 6.3; g.add(m); mice.push(m); }
    c.tick((t, dt) => mice.forEach((m) => { m.userData.a += (Math.random() - 0.5) * dt * 6; m.position.x = Math.max(1, Math.min(19, m.position.x + Math.sin(m.userData.a) * dt * 1.5)); m.position.z = Math.max(-6.5, Math.min(7, m.position.z + Math.cos(m.userData.a) * dt * 1.5)); m.rotation.y = m.userData.a; }));
    mice.forEach((m) => c.clickable(m, () => { c.sound.squeak(); c.egg('mice', 'Dalmatian mice. Bred in the house. Spotted, every one of them, by hand.'); }, 'A Dalmatian mouse'));
    const ts = c.glb('tracksuit', { h: 1.85, x: W / 2, z: -6.0, ry: 0, parent: g }); c.post(X(W / 2), -6.0, 0.4);
    c.clickable(ts, () => { c.say(ts, 'I have had a rough year, Dad.', 2400, 2.1); c.egg('tracksuit'); }, 'The eldest');
    [[5, PI / 2], [15, -PI / 2]].forEach(([x, ry]) => prop(c, r, g, X, 'ArmChair_01', x, 2, { h: 1.0, ry, r: 0.55 })); [[3, -6.8], [17, -6.8]].forEach(([x, z]) => prop(c, r, g, X, 'potted_plant_02', x, z, { h: 1.4, r: 0.4 }));
  },

  meanstreets(c, r, g, X) {
    const { THREE } = c;
    // the entrance: every time you come in through the door, the room goes slow and red for you
    let inDoor = false;
    c.tick((t, dt, P, ri) => { const here = ri === r.i, lx = P.x - r.x0; if (!here) { inDoor = false; return; } if (!inDoor && lx < 2.5) { inDoor = true; c.TIME.target = 0.3; c.toast('Walk in like you own the place.', 2400); setTimeout(() => { c.TIME.target = 1; }, 1800); c.egg('entrance', 'Slow motion, red light, every head turns. It is the only way to walk into this bar.'); } if (lx > 4) inDoor = inDoor && lx < 2.5 ? true : inDoor; });
    g.add(c.slab(1.0, 1.1, 10, std(c, 0x3a1a10, { roughness: 0.4 }), 1.6, 0.55, -2)); c.wall(X(2.1), -7, X(2.1), 3);
    [-6, -4.5, -3, -1.5, 0, 1.5].forEach((z) => prop(c, r, g, X, 'bar_chair_round_01', 2.8, z, { h: 0.8 }));
    const pool = new THREE.Group(); pool.position.set(13, 0, 1.4); g.add(pool); pool.add(c.slab(2.6, 0.8, 1.4, std(c, 0x3a2010), 0, 0.4, 0)); pool.add(c.slab(2.4, 0.02, 1.2, std(c, 0x1a6a2a, { roughness: 1 }), 0, 0.81, 0)); c.post(X(13), 1.4, 1.4);
    for (let k = 0; k < 10; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), std(c, [0xd8b020, 0x1a3a9a, 0xc82020, 0x5a1a7a, 0xe86020, 0x1a6a2a, 0x7a1a1a, 0x111111, 0xffffff, 0xd8b020][k], { roughness: 0.2 })); b.position.set(-0.6 + (k % 4) * 0.12, 0.86, -0.2 + Math.floor(k / 4) * 0.12); pool.add(b); }
    c.clickable(pool, () => { c.sound.clink(1600); c.egg('pool', 'Eight ball, corner pocket. Somebody here owes somebody money for that.'); }, 'Break');
    const jb = c.slab(1.0, 1.5, 0.6, std(c, 0x8a1a1a, { roughness: 0.3, emissive: 0x300000 }), 18.8, 0.75, -4); g.add(jb); c.post(X(18.8), -4, 0.6);
    let on = false; c.clickable(jb, () => { on = !on; c.sound.beat(on); if (on) c.egg('jukebox2'); }, 'The jukebox');
    c.tick((t, dt, P, ri) => { if (ri !== r.i && on) { on = false; c.sound.beat(false); } });
    const wg = c.glb('wiseguy', { h: 1.85, x: 6.4, z: -2.0, ry: -1.0, parent: g }); c.post(X(6.4), -2.0, 0.45);
    c.clickable(wg, () => { c.say(wg, 'You don\'t make up for your sins in church. You do it on the street. And you count.', 3400, 2.1); c.egg('wiseguy'); }, 'The regular');
  },

  barefoot(c, r, g, X) {
    const { THREE } = c;
    // five flights up a long straight stair to the apartment, which is level with the bottom of the photograph
    const sx1 = 6, sx2 = 14, z0 = 6.4, zt = -2.0, TOP = 4.5, S = TOP / (z0 - zt);
    const step = std(c, 0x6a4a30, { roughness: 0.7 }), N = 30, run = (z0 - zt) / N;
    for (let k = 0; k < N; k++) g.add(c.slab(sx2 - sx1, TOP * (k + 1) / N, run, step, (sx1 + sx2) / 2, TOP * (k + 1) / N / 2, z0 - k * run - run / 2));
    g.add(c.slab(W, TOP, zt + D / 2, std(c, 0x6a5040), W / 2, TOP / 2, (zt - D / 2) / 2));
    for (const x of [sx1 - 0.15, sx2 + 0.15]) g.add(c.slab(0.3, TOP + 1, z0 - zt, std(c, 0xa8b8a8), x, (TOP + 1) / 2, (z0 + zt) / 2));
    c.wall(X(sx1 - 0.3), z0, X(sx1 - 0.3), zt); c.wall(X(sx2 + 0.3), z0, X(sx2 + 0.3), zt); c.wall(X(0), zt, X(sx1 - 0.3), zt); c.wall(X(sx2 + 0.3), zt, X(W), zt);
    ['2ND FLOOR', '3RD FLOOR', '4TH FLOOR', '5TH FLOOR'].forEach((txt, k) => { const s2 = c.sign(txt, { w: 1.4, h: 0.3, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 700 }); const z = z0 - (k + 1) * (z0 - zt) / 5; s2.position.set(sx1, TOP * (k + 1) / 5 + 1.6, z); s2.rotation.y = PI / 2; g.add(s2); });
    r.ground = (lx, z) => (z < zt ? TOP : (lx > sx1 && lx < sx2 && z < z0 ? (z0 - z) * S : 0));
    r.plateY = TOP;
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.85) 100%)'; document.body.appendChild(ov);
    let made = false, pant = 0;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { ov.style.opacity = 0; return; } const h = Math.max(0, P.y - 1.62); ov.style.opacity = (Math.min(1, h / TOP) * 0.7 * (0.8 + Math.sin(t * 5) * 0.2)).toFixed(2); if (h > 1 && Math.random() < dt * 1.5) c.sound.pant(); if (h > TOP - 0.2 && !made) { made = true; c.egg('fivefloors', 'Five flights. Six if you count the stoop. Nobody counts the stoop.'); } });
    // the skylight up there, missing a pane, and the snow coming through it
    const NS = 300, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) { sp[k * 3] = 9 + Math.random() * 2; sp[k * 3 + 1] = TOP + Math.random() * 5; sp[k * 3 + 2] = -6 + Math.random() * 2; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })); snow.frustumCulled = false; g.add(snow);
    c.tick((t, dt) => { for (let k = 0; k < NS; k++) { sp[k * 3 + 1] -= dt * 0.8; if (sp[k * 3 + 1] < TOP) sp[k * 3 + 1] = TOP + 5; } sg.attributes.position.needsUpdate = true; });
    const hole = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), new THREE.MeshBasicMaterial({ visible: false })); hole.position.set(10, TOP + 1.5, -5); g.add(hole);
    c.clickable(hole, () => c.egg('skylight', 'The skylight is missing a pane. It snows in the living room. The landlord says it is a feature.'), 'The skylight');
    [[8, -4], [12, -4.4]].forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: k ? 0x8a2a2a : 0x2a3a6a, ry: k ? -0.4 : 0.4 }); e.position.y = TOP; });
  },

  crooklyn(c, r, g, X) {
    const { THREE } = c;
    // the middle door: walk through it and the picture squeezes; walk back and it lets go
    const fr = std(c, 0xe8e0d0); [[-0.8, 0], [0.8, 0]].forEach(([dx]) => g.add(c.slab(0.16, 2.6, 0.2, fr, W / 2 + dx, 1.3, -1))); g.add(c.slab(1.76, 0.16, 0.2, fr, W / 2, 2.6, -1));
    g.add(c.slab(7, 2.8, 0.2, std(c, 0xd8c8a0), W / 2 - 4.4, 1.4, -1)); g.add(c.slab(7, 2.8, 0.2, std(c, 0xd8c8a0), W / 2 + 4.4, 1.4, -1)); c.wall(X(W / 2 - 7.9), -1, X(W / 2 - 0.8), -1); c.wall(X(W / 2 + 0.8), -1, X(W / 2 + 7.9), -1);
    let squeezed = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (P.squeeze) P.squeeze = 0; return; } const now = P.z < -1; if (now !== squeezed) { squeezed = now; if (now) c.egg('squeeze', 'Through the door, the whole picture squeezes. The film did that on purpose. Projectionists kept trying to fix it.'); } P.squeeze = squeezed ? 1.55 : 0; });
    // the TV with a dance show, the record player, the plastic on the sofa
    prop(c, r, g, X, 'Sofa_01', 4.2, 4.2, { len: 2.2, ry: PI / 2, r: 1.0 }); const plastic = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 2.3), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, roughness: 0.05 })); plastic.position.set(4.2, 0.45, 4.2); g.add(plastic);
    const tvT = c.canvasTex(160, 120, () => {}), tq = tvT.userData.canvas.getContext('2d'); const tv = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ map: tvT, toneMapped: false })); tv.position.set(7.4, 1.0, 5.6); tv.rotation.y = -PI / 2 - 0.4; g.add(tv); g.add(c.slab(0.7, 0.75, 0.6, std(c, 0x4a3020), 7.6, 0.37, 5.6));
    let tl = 0; c.tick((t) => { if (t - tl < 0.1) return; tl = t; tq.fillStyle = '#2a1050'; tq.fillRect(0, 0, 160, 120); for (let k = 0; k < 5; k++) figure(tq, 20 + k * 30, 90 + Math.sin(t * 6 + k) * 4, 0.8, ['#ff4fa3', '#f5c542', '#22d3ee', '#ff7a1a', '#ffffff'][k], t + k, Math.sin(t * 4 + k) > 0 ? 1 : 0); tvT.needsUpdate = true; });
    c.clickable(tv, () => { c.sound.beat(true); setTimeout(() => c.sound.beat(false), 6000); c.egg('soultv', 'Saturday afternoon, the dance show is on, and everybody in the house drops everything.'); }, 'The TV');
    const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.01, 32), std(c, 0x111111, { roughness: 0.3 })); rec.position.set(16, 0.95, 5.4); g.add(rec); g.add(c.slab(0.6, 0.9, 0.5, std(c, 0x6a4a2a), 16, 0.45, 5.4)); c.tick((t) => { rec.rotation.y = t * 3.5; });
    const kids = [0, 1, 2].map((k) => { const e = extra(c, g, 6 + k * 3, 2, { col: [0xff7a1a, 0x22aa66, 0x3b82f6][k] }); e.scale.setScalar(0.6); return e; });
    c.tick((t) => kids.forEach((e, k) => { e.position.x = W / 2 + Math.sin(t * 0.8 + k * 2) * 6; e.position.z = 3 + Math.cos(t * 0.6 + k) * 2.5; e.position.y = Math.abs(Math.sin(t * 8 + k)) * 0.05; }));
  },

  legend(c, r, g, X) {
    const { THREE } = c;
    // grass through the asphalt, instanced
    const NG = c.MOBILE ? 1500 : 4000, blade = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.6).translate(0, 0.3, 0), new THREE.MeshStandardMaterial({ color: 0x6a8a3a, side: THREE.DoubleSide, roughness: 0.9 }), NG), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let k = 0; k < NG; k++) { e.set((Math.random() - 0.5) * 0.4, Math.random() * 6.3, 0); q4.setFromEuler(e); sc.set(1, 0.25 + Math.random() * 0.6, 1); m4.compose(v.set(Math.random() * W, 0, -7.5 + Math.random() * 15), q4, sc); blade.setMatrixAt(k, m4); } g.add(blade);
    c.glb('checker', { len: 5, x: 3.4, z: -3, ry: 0.4, parent: g }); c.post(X(3.4), -3, 1.4); c.glb('sedan', { len: 5, x: 16.4, z: 2.4, ry: -0.3, parent: g }); c.post(X(16.4), 2.4, 1.4);
    // the dog stays close
    const dog = c.glb('dog', { h: 0.7, x: 11.4, z: 3.6, ry: -0.4, parent: g }); c.post(X(11.4), 3.6, 0.4);
    c.clickable(dog, () => { c.sound.bark(); c.egg('dog', 'Best friend in an empty city. Still sits when you say sit.'); }, 'The dog');
    // the deer, across the square every so often
    const deer = [0, 1, 2, 3, 4, 5].map((k) => c.glb('deer', { h: 1.4, x: -30, z: -5 + k * 0.6, parent: g, shadow: false })); let run = -1, next = 5;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; next -= dt; if (next <= 0 && run < 0) { run = 0; next = 14; c.sound.boom(0.2); } if (run >= 0) { run += dt; deer.forEach((d, k) => { d.position.set(22 - run * 9 - k * 0.9, Math.abs(Math.sin(run * 10 + k)) * 0.25, -5.5 + k * 0.7 + Math.sin(k) * 0.4); d.rotation.y = -PI / 2; }); if (run > 4) { run = -1; deer.forEach((d) => { d.position.x = -30; }); if (!r.saw) { r.saw = true; c.egg('deer', 'A herd of deer across Times Square, and nobody to see it but you.'); } } } });
    // tee off
    const gf = c.glb('golfer', { h: 1.8, x: 7.6, z: 1.8, ry: -0.6, parent: g }); c.post(X(7.6), 1.8, 0.45);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), std(c, 0xffffff)); ball.position.set(8.2, 0.05, 1.4); g.add(ball);
    let fly = -1; c.clickable(gf, () => { if (fly >= 0) return; fly = 0; c.sound.clink(3200); }, 'Tee off');
    c.tick((t, dt) => { if (fly < 0) return; fly += dt; ball.position.set(8.2 - fly * 1.5, 0.05 + Math.sin(Math.min(1, fly / 3) * PI) * 18, 1.4 - fly * 14); if (fly > 3) { fly = -1; ball.position.set(8.2, 0.05, 1.4); c.egg('golf', 'Fore. Nobody to hear it for a hundred blocks. Long drive, though.'); } });
  },

  llewyn(c, r, g, X) {
    const { THREE } = c;
    // the stage and the song
    g.add(c.slab(6, 0.4, 2.2, std(c, 0x3a2a1a), W / 2, 0.2, -5.6)); c.wall(X(7), -4.5, X(13), -4.5);
    const fs = c.glb('folksinger', { h: 1.5, x: W / 2, y: 0.4, z: -5.6, ry: 0, parent: g, shadow: false });
    const PROG = [[196, 247, 294], [165, 196, 247], [131, 165, 196], [147, 185, 220]]; let playing = false;
    c.clickable(fs, () => { if (playing) return; playing = true; let i = 0; const iv = setInterval(() => { const ch = PROG[(i >> 2) % 4]; ch.forEach((f, k) => setTimeout(() => c.sound.note(f, 0.12), k * 60)); if (++i >= 16) { clearInterval(iv); playing = false; c.egg('hoot', 'One song at the Gaslight, a hat passed round, two dollars. A good night, by MacDougal Street standards.'); } }, 500); }, 'The singer');
    [[5, -1], [8.4, 0.6], [11.6, 0.6], [15, -1], [6, 3.2], [14, 3.2]].forEach(([x, z]) => { prop(c, r, g, X, 'round_wooden_table_01', x, z, { len: 0.8, r: 0.5 }); prop(c, r, g, X, 'dining_chair_02', x, z + 0.7, { h: 0.9, ry: PI }); });
    // the cat. Click it and it gets out, and it follows you through every set in the gallery.
    const cat = c.glb('cat', { h: 0.4, x: 8.4, y: 0.76, z: 0.6, parent: c.scene, shadow: false }); cat.position.x += r.x0;
    let free = false;
    c.clickable(cat, () => { if (free) return; free = true; c.sound.meow(); c.egg('cat', 'The cat got out. It is coming with you now, through every set. That is what cats in Greenwich Village do.'); }, 'The cat');
    c.tick((t, dt, P) => { if (!free) return; const tx = P.x + Math.sin(P.yaw + 2.4) * 1.2, tz = P.z + Math.cos(P.yaw + 2.4) * 1.2; cat.position.x += (tx - cat.position.x) * Math.min(1, dt * 2); cat.position.z += (tz - cat.position.z) * Math.min(1, dt * 2); cat.position.y += ((P.y - 1.62 * P.scale) - cat.position.y) * Math.min(1, dt * 4); cat.rotation.y = Math.atan2(P.x - cat.position.x, P.z - cat.position.z); if (Math.random() < dt * 0.02) c.sound.meow(); });
  },
});

Object.assign(ROOM, {
  fisherking(c, r, g, X) {
    const { THREE } = c;
    // the ceiling: a teal sky with gold constellations, painted backwards like the real one
    const sky = c.canvasTex(1024, 820, (q, w, h) => {
      q.fillStyle = '#2f6f6a'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(240,200,110,.5)'; q.lineWidth = 2; q.fillStyle = '#f0c86e';
      const st = []; for (let k = 0; k < 170; k++) st.push([Math.random() * w, Math.random() * h]);
      for (let k = 0; k < 70; k++) { const a = st[k], b = st[k + 1 + (k % 3)]; q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke(); }
      st.forEach(([x, y]) => { q.beginPath(); q.arc(x, y, 1.5 + Math.random() * 2.5, 0, 7); q.fill(); });
      q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.47, h * 0.12, 0.18, 0, 7); q.stroke();
      [[0.18, 0.28], [0.5, 0.16], [0.82, 0.7], [0.3, 0.78]].forEach(([u, v]) => eyeFlower(q, u * w, v * h, 34, '#f0c86e', '#c89030'));
      q.font = `700 22px ${c.SERIF}`; q.textAlign = 'center'; ['AQUARIUS', 'PISCES', 'ARIES', 'TAURUS', 'GEMINI', 'CANCER'].forEach((s, k) => q.fillText(s.split('').reverse().join(''), (k + 0.5) * w / 6, h * (0.42 + (k % 2) * 0.2)));
    });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, D - 0.4), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); ceil.rotation.x = PI / 2; ceil.position.set(W / 2, H_IN - 0.03, 0); g.add(ceil);
    c.clickable(ceil, () => c.egg('backwards', 'The ceiling is painted backwards. Seen from outside the sky, the painters said. Seen from here, by New Yorkers looking up.'), 'The ceiling');
    // the information booth and its four faced clock, on real New York time
    const brass = std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), marble = std(c, 0xd8ccb0, { roughness: 0.3 }), bx = W / 2, bz = -1.6;
    const booth = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.15, 40), marble); booth.position.set(bx, 0.58, bz); g.add(booth);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.08, 40), brass); top.position.set(bx, 1.18, bz); g.add(top);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; g.add(c.slab(0.05, 1.0, 0.05, brass, bx + Math.cos(a) * 1.52, 1.7, bz + Math.sin(a) * 1.52)); }
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.62, 0.5, 40), brass); roof.position.set(bx, 2.45, bz); g.add(roof);
    const ck = new THREE.Group(); ck.position.set(bx, 3.05, bz); g.add(ck); ck.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 18), brass));
    const acorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 16), brass); acorn.position.y = 0.6; ck.add(acorn);
    const cT = c.canvasTex(256, 256, () => {}), cq = cT.userData.canvas.getContext('2d');
    const hand = (a, l, wd) => { cq.save(); cq.translate(128, 128); cq.rotate(a); cq.fillRect(-wd / 2, -l, wd, l); cq.restore(); };
    const drawClock = () => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); cq.fillStyle = '#f6eed8'; cq.beginPath(); cq.arc(128, 128, 124, 0, 7); cq.fill(); cq.strokeStyle = '#7a5a20'; cq.lineWidth = 10; cq.stroke(); cq.fillStyle = '#2a1a08'; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; cq.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); } hand((d.getHours() % 12 + d.getMinutes() / 60) / 12 * PI * 2, 60, 9); hand(d.getMinutes() / 60 * PI * 2, 92, 5); cq.fillStyle = '#b01010'; hand(d.getSeconds() / 60 * PI * 2, 100, 2); cT.needsUpdate = true; };
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), new THREE.MeshBasicMaterial({ map: cT, toneMapped: false })); const a = k * PI / 2; f.position.set(Math.sin(a) * 0.41, 0, Math.cos(a) * 0.41); f.rotation.y = a; ck.add(f); }
    drawClock(); let cl = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i || t - cl < 1) return; cl = t; drawClock(); });
    c.post(X(bx), bz, 1.7);
    c.clickable(ck, () => { c.sound.ding(); c.egg('clock4', 'Meet me under the clock. Every New Yorker has said it, and every one of them was late.'); }, 'The clock');
    // the departures board, flapping
    const DEST = ['POUGHKEEPSIE', 'NEW HAVEN', 'CROTON HARMON', 'WHITE PLAINS', 'COLD SPRING', 'STAMFORD', 'THE COUNT', 'BREWSTER', 'WASSAIC', 'MLow EXPRESS'];
    const bT = c.canvasTex(1024, 320, () => {}), bq = bT.userData.canvas.getContext('2d'), rows = DEST.slice(0, 5).map((d, k) => ({ d, flip: 0, time: `${6 + k}:${['04', '17', '32', '45', '58'][k]}` }));
    const drawBoard = () => { bq.fillStyle = '#0c0c0c'; bq.fillRect(0, 0, 1024, 320); bq.font = `700 30px ${c.MONO}`; bq.fillStyle = '#f5c542'; bq.fillText('DEPARTURES', 24, 40); bq.fillText('TRACK', 860, 40); rows.forEach((rw, k) => { const y = 92 + k * 52; bq.fillStyle = '#1c1c1c'; for (let i = 0; i < 22; i++) bq.fillRect(20 + i * 38, y - 34, 34, 44); bq.fillStyle = '#f4ead2'; let s = `${rw.time}  ${rw.d}`; if (rw.flip > 0) s = s.split('').map((ch) => (ch === ' ' ? ' ' : String.fromCharCode(65 + Math.random() * 26 | 0))).join(''); s.padEnd(22).slice(0, 22).split('').forEach((ch, i) => bq.fillText(ch, 27 + i * 38, y)); bq.fillText(String(17 + k * 6), 880, y); }); bT.needsUpdate = true; };
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.38), new THREE.MeshBasicMaterial({ map: bT, toneMapped: false })); board.position.set(W - 0.58, 4.4, -3.6); board.rotation.y = -PI / 2; g.add(board);
    g.add(c.slab(0.12, 1.6, 4.6, std(c, 0x2a2014, { metalness: 0.5 }), W - 0.5, 4.4, -3.6));
    drawBoard(); let bl = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i || t - bl < 0.12) return; bl = t; rows.forEach((rw) => { if (rw.flip > 0) { rw.flip--; if (!rw.flip) rw.d = DEST[Math.random() * DEST.length | 0]; } else if (Math.random() < 0.01) { rw.flip = 8; c.sound.tick(); } }); drawBoard(); });
    c.clickable(board, () => c.egg('track61', 'Track 61 is not on the board. It never was: a private platform under the Waldorf, for a president who did not want to be seen.'), 'The departures board');
    // forty commuters, and the waltz
    const N = c.MOBILE ? 24 : 40, COLS = [0x3a2a1e, 0x2a2a34, 0x5a4a3a, 0x1e1e24, 0x6a5a48, 0x3a3a48, 0x4a2a2a, 0x7a6a50];
    const ppl = []; for (let k = 0; k < N; k++) { const e = extra(c, g, 0, 0, { col: COLS[k % COLS.length] }); let wx, wz; do { wx = 1.5 + Math.random() * 17; wz = -6 + Math.random() * 12.5; } while (Math.hypot(wx - bx, wz - bz) < 2.2); ppl.push({ e, wx, wz, dir: Math.random() * PI * 2, sp: 0.7 + Math.random() * 0.7, ph: Math.random() * 6 }); }
    const couple = c.glb('waltzers', { h: 1.8, x: 5.6, z: 2.2, parent: g }); c.post(X(5.6), 2.2, 0.6);
    let still = 0, w = 0, lx = 0, lz = 0, on = false, waltzed = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (on) { on = false; c.sound.waltz(false); } still = 0; return; }
      const mv = Math.hypot(P.x - lx, P.z - lz); lx = P.x; lz = P.z; still = mv < 0.004 ? still + dt : 0;
      const want = still > 3 ? 1 : 0; w += (want - w) * Math.min(1, dt * (want ? 0.9 : 2.5));
      if (want && !on) { on = true; c.sound.waltz(true); if (!waltzed) { waltzed = true; c.egg('waltz', 'Stand still in Grand Central long enough and the whole concourse waltzes. Move, and they are commuters again, late for the 5:42.'); } }
      if (!want && on) { on = false; c.sound.waltz(false); }
      couple.rotation.y = t * (0.4 + w * 1.6);
      ppl.forEach((p, k) => {
        if (w < 0.98) {
          p.wx += Math.sin(p.dir) * p.sp * dt * (1 - w); p.wz += Math.cos(p.dir) * p.sp * dt * (1 - w);
          if (p.wx < 1.2 || p.wx > 18.8) { p.dir = -p.dir; p.wx = Math.max(1.2, Math.min(18.8, p.wx)); }
          if (p.wz < -6.4 || p.wz > 6.8) { p.dir = PI - p.dir; p.wz = Math.max(-6.4, Math.min(6.8, p.wz)); }
          const ddx = p.wx - bx, ddz = p.wz - bz; if (ddx * ddx + ddz * ddz < 4.4) p.dir = Math.atan2(ddx, ddz);
        }
        const pair = k >> 1, np = Math.ceil(N / 2), ring = 3.4 + (pair % 3) * 1.4, a0 = pair / np * PI * 2 + t * 0.12;
        const cx = bx + Math.cos(a0) * ring, cz = bz + Math.sin(a0) * ring * 0.85, th = t * 2.2 + pair + (k & 1) * PI;
        const ux = cx + Math.cos(th) * 0.32, uz = cz + Math.sin(th) * 0.32;
        p.e.position.set(p.wx + (ux - p.wx) * w, (1 - w) * Math.abs(Math.sin(t * 7 + p.ph)) * 0.03 + w * Math.abs(Math.sin(t * 3.3 + k)) * 0.05, p.wz + (uz - p.wz) * w);
        p.e.rotation.y = w > 0.5 ? -th : p.dir;
      });
    });
    c.clickable(couple, () => { c.say(couple, 'One two three, one two three. Nobody in this station walks when they can waltz.', 3000, 2.0); c.egg('waltzers'); }, 'The dancers');
    // the Grail, in plain sight on a bench
    const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.08, 0], [0.08, 0.02], [0.02, 0.05], [0.02, 0.14], [0.1, 0.2], [0.12, 0.3], [0.11, 0.31]].map(([x, y]) => new THREE.Vector2(x, y)), 24), std(c, 0xe0b040, { metalness: 1, roughness: 0.2, side: THREE.DoubleSide }));
    cup.position.set(1.0, 0.46, -2.6); g.add(cup);
    c.clickable(cup, () => { c.sound.clink(2200); c.egg('grail', 'The Grail. All that questing and it was in a townhouse on Fifth Avenue the whole time, on a shelf, next to a library card.'); }, 'A gold cup');
    prop(c, r, g, X, 'painted_wooden_bench', 0.9, -3.4, { len: 2.2, ry: PI / 2, r: 0.5 }); prop(c, r, g, X, 'painted_wooden_bench', W - 0.9, 0.6, { len: 2.2, ry: -PI / 2, r: 0.5 });
    [[3.2, 5.6, 0.4], [13.6, 3.4, -0.7], [16.8, -5.2, 1.2], [7.4, -5.6, 2.2]].forEach(([x, z, ry]) => prop(c, r, g, X, 'vintage_suitcase', x, z, { len: 0.7, ry }));
    prop(c, r, g, X, 'brass_candleholders', bx, bz, { h: 0.3, y: 1.22 });
  },

  waituntildark(c, r, g, X) {
    const { THREE } = c;
    // three bulbs on cords: break them all and the room is as dark for everybody as it is for her
    const bulbs = [[5, -2.2], [10, 1.2], [15, -2.2]].map(([x, z], k) => {
      g.add(c.slab(0.01, H_IN - 3.2, 0.01, std(c, 0x111111), x, 3.2 + (H_IN - 3.2) / 2, z));
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), basic(c, 0xfff2c8)); b.position.set(x, 3.1, z); g.add(b);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,230,180,.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(0.9, 0.9, 1); b.add(halo);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); b.add(hit);
      const o = { b, k, on: true }; c.clickable(hit, () => { if (!o.on) return; o.on = false; b.visible = false; c.sound.crack(); c.flash(0.12); if (bulbs.every((q) => !q.on)) { c.toast('All three bulbs gone. Except the refrigerator. You forgot the refrigerator.', 3600); } }, 'Break the bulb');
      return o;
    });
    // the refrigerator, door open, the one light left
    const fx = 17.6, fz = -5.6, white = std(c, 0xe8e4d8, { roughness: 0.35 });
    g.add(c.slab(0.8, 1.7, 0.7, white, fx, 0.85, fz)); c.post(X(fx), fz, 0.6);
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.5), basic(c, 0xe8f4ff)); inner.position.set(fx, 0.9, fz + 0.36); g.add(inner);
    const door = new THREE.Group(); door.position.set(fx - 0.4, 0, fz + 0.36); g.add(door); door.add(c.slab(0.05, 1.68, 0.8, white, -0.02, 0.85, 0.4)); door.rotation.y = 0.15;
    let fridge = true;
    c.clickable(door, () => { fridge = !fridge; c.sound.thud(0.3); if (!fridge) c.egg('fridge', 'You shut the refrigerator. Now it is dark for both of you, and only one of you is used to it.'); }, 'The refrigerator door');
    // the flashlight in your hand, for when it is properly dark
    const spot = new THREE.SpotLight(0xfff4d8, 0, 14, 0.32, 0.5, 1.2); c.scene.add(spot); c.scene.add(spot.target);
    const killer = c.glb('killer', { h: 1.88, x: 15.2, z: -4.2, ry: -0.6, parent: g }); const kHome = [15.2, -4.2];
    const blind = c.glb('blindwoman', { h: 1.7, x: 6.6, z: -4.4, ry: 0.5, parent: g }); c.post(X(6.6), -4.4, 0.4);
    c.clickable(blind, () => { c.say(blind, 'I can not see you either. That makes this the fairest room in New York.', 3000, 1.9); c.egg('blindwoman'); }, 'The woman with the cane');
    c.clickable(killer, () => { c.say(killer, 'Lights out, everybody counts the same. Count to ten.', 2800, 2.0); c.egg('killer'); }, 'The man in the dark coat');
    const fw = new THREE.Vector3(), kp = new THREE.Vector3(); let lit = 0, dark = 0, scared = false;
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i, out = bulbs.every((q) => !q.on);
      if (!here) { if (bulbs.some((q) => !q.on) || !fridge) { bulbs.forEach((q) => { q.on = true; q.b.visible = true; }); fridge = true; killer.position.set(kHome[0], 0, kHome[1]); } if (r.plateMesh) r.plateMesh.material.color.setScalar(1); spot.intensity = 0; return; }
      door.rotation.y += ((fridge ? -1.9 : 0.02) - door.rotation.y) * Math.min(1, dt * 6); inner.visible = fridge;
      bulbs.forEach((q) => { c.lights[q.k].userData.i = q.on ? r.lights[q.k][4] : 0; });
      c.lights[3].position.set(X(fx), 0.9, fz + 0.9); c.lights[3].color.set(0xd8ecff); c.lights[3].distance = 7; c.lights[3].userData.i = fridge ? 9 : 0;
      const k = out ? (fridge ? 0.25 : 0.02) : 1; c.hemi.intensity += (r.hemi[2] * k - c.hemi.intensity) * Math.min(1, dt * 3); c.scene.environmentIntensity = r.env * k;
      if (r.plateMesh) r.plateMesh.material.color.setScalar(0.08 + 0.92 * k);
      const pitch = out && !fridge;
      spot.intensity += ((pitch ? 60 : 0) - spot.intensity) * Math.min(1, dt * 5);
      c.camera.getWorldDirection(fw); spot.position.copy(c.camera.position).addScaledVector(fw, 0.2); spot.position.y -= 0.25; spot.target.position.copy(c.camera.position).addScaledVector(fw, 6);
      if (!pitch) { dark = 0; return; }
      dark += dt; killer.getWorldPosition(kp); kp.y = 1.5; const dx = kp.x - P.x, dz = kp.z - P.z, d = Math.hypot(dx, dz), inBeam = (dx * fw.x + dz * fw.z) / (d * Math.hypot(fw.x, fw.z) + 1e-6) > 0.94;
      killer.rotation.y = Math.atan2(-dx, -dz);
      if (inBeam) { lit += dt; if (lit > 3 && !r.held) { r.held = true; c.egg('beam', 'Keep him in the light and he stays put. Look away for one second and he is a step closer. Do not look away.'); } }
      else if (dark > 2 && d > 1.4) { killer.position.x -= dx / d * dt * 0.9; killer.position.z -= dz / d * dt * 0.9; }
      if (d < 1.5 && !scared) { scared = true; c.flash(1); c.shake(0.15); c.sound.screech(); c.egg('lunge', 'He came out of the dark. Every audience in 1967 screamed at once. So did you.'); setTimeout(() => { bulbs.forEach((q) => { q.on = true; q.b.visible = true; }); fridge = true; killer.position.set(kHome[0], 0, kHome[1]); scared = false; }, 900); }
    });
    // the wall telephone, the doll, the darkroom
    const phone = new THREE.Group(); phone.position.set(0.16, 1.5, -2.6); phone.rotation.y = PI / 2; g.add(phone); phone.add(c.slab(0.22, 0.32, 0.08, std(c, 0x1a1a1a, { roughness: 0.3 }), 0, 0, 0)); phone.add(c.slab(0.06, 0.26, 0.06, std(c, 0x1a1a1a, { roughness: 0.3 }), 0.14, 0.02, 0.06));
    c.clickable(phone, () => { [0, 500, 1400].forEach((d) => setTimeout(() => c.sound.beep(440, 0.08, 0.35, 'sine'), d)); c.egg('signal', 'Two rings, a pause, one ring. That is the signal from upstairs: somebody is coming down the steps.'); }, 'The telephone');
    prop(c, r, g, X, 'WoodenTable_02', 8.6, -5.4, { len: 1.4, r: 0.7 }); prop(c, r, g, X, 'painted_wooden_chair_01', 8.0, -4.6, { h: 0.9, ry: PI });
    prop(c, r, g, X, 'Camera_01', 8.9, -5.5, { h: 0.18, y: 0.76, ry: 0.6, egg: ['A camera', 'darkroom', 'A photographer lives here. Red bulb in the bathroom, prints on a line, and a camera that sees better in the dark than anyone.'] });
    const doll = new THREE.Group(); doll.position.set(8.3, 0.76, -5.5); g.add(doll); const dm = std(c, 0xf0d8c8); doll.add(c.slab(0.12, 0.18, 0.08, std(c, 0x8a2a3a), 0, 0.09, 0)); const dh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), dm); dh.position.y = 0.24; doll.add(dh);
    c.clickable(doll, () => c.egg('doll', 'The doll everybody is after. Open it up and all that is inside is stuffing and one census form, filled in.'), 'A doll');
    prop(c, r, g, X, 'drawer_cabinet', 1.0, -6.6, { h: 1.1, ry: PI / 2, r: 0.5 }); prop(c, r, g, X, 'ArmChair_01', 3.4, 5.2, { h: 1.0, ry: 2.4, r: 0.55 }); prop(c, r, g, X, 'vintage_suitcase', 12.4, 6.8, { len: 0.7 });
  },

  tootsie(c, r, g, X) {
    const { THREE } = c;
    // the set inside the set: a hospital room with no fourth wall
    const sheet = std(c, 0xf2f2f6, { roughness: 0.9 }), chrome = std(c, 0xc8c8cc, { metalness: 0.9, roughness: 0.3 });
    const bed = new THREE.Group(); bed.position.set(W / 2, 0, -4.6); g.add(bed); bed.add(c.slab(1.0, 0.1, 2.1, chrome, 0, 0.55, 0)); bed.add(c.slab(0.96, 0.18, 2.0, sheet, 0, 0.69, 0)); bed.add(c.slab(0.6, 0.12, 0.34, sheet, 0, 0.84, -0.78)); bed.add(c.slab(1.0, 0.8, 0.05, chrome, 0, 0.9, -1.04));
    [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]].forEach(([x, z]) => bed.add(c.slab(0.04, 0.55, 0.04, chrome, x, 0.27, z))); c.post(X(W / 2), -4.6, 1.1);
    const drip = new THREE.Group(); drip.position.set(W / 2 + 0.9, 0, -5.2); g.add(drip); drip.add(c.slab(0.03, 1.9, 0.03, chrome, 0, 0.95, 0)); const bag = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10).scale(1, 1.5, 0.5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.1 })); bag.position.y = 1.8; drip.add(bag);
    const act = c.glb('actress', { h: 1.86, x: W / 2 - 1.6, z: -3.6, ry: 0.5, parent: g }); c.post(X(W / 2 - 1.6), -3.6, 0.4);
    c.clickable(act, () => { c.say(act, 'I was a better New Yorker as a woman than I ever was as a man. Write that down. Count it.', 3400, 2.1); c.egg('actress'); }, 'The star');
    // the studio camera that follows you, and the monitors that show what it sees: you, on the air
    const cam = new THREE.Group(); cam.position.set(13.8, 0, 3.4); g.add(cam); const grey = std(c, 0x3a3a40, { metalness: 0.5, roughness: 0.5 }), dk = std(c, 0x18181c, { roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.18, 24), grey); base.position.y = 0.12; cam.add(base); cam.add(c.slab(0.16, 1.2, 0.16, chrome, 0, 0.8, 0));
    const head = new THREE.Group(); head.position.y = 1.55; cam.add(head); head.add(c.slab(0.46, 0.42, 0.8, dk, 0, 0, 0)); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.36, 20), grey); lens.rotation.x = PI / 2; lens.position.z = -0.56; head.add(lens);
    head.add(c.slab(0.36, 0.28, 0.3, grey, 0, 0.3, 0.25)); head.add(c.slab(0.9, 0.04, 0.04, chrome, 0, -0.1, 0.6));
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), basic(c, 0x330000)); tally.position.set(0, 0.26, -0.42); head.add(tally);
    const logo = decal(c, 0.3, 0.3, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.95)); logo.position.set(0.235, 0, 0); logo.rotation.y = PI / 2; head.add(logo);
    c.post(X(13.8), 3.4, 0.7);
    const cam2 = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 60); cam2.layers.enable(1); head.add(cam2); cam2.position.z = -0.75; cam2.rotation.y = 0;
    const rt2 = new THREE.WebGLRenderTarget(c.MOBILE ? 320 : 512, c.MOBILE ? 180 : 288); rt2.texture.colorSpace = THREE.SRGBColorSpace;
    const screens = [];
    const monitor = (x, z, ry, s) => { const m = new THREE.Group(); m.position.set(x, 0, z); m.rotation.y = ry; g.add(m); m.add(c.slab(0.05, 1.2 * s, 0.05, chrome, 0, 0.6 * s, 0)); m.add(c.slab(1.0 * s, 0.62 * s, 0.4 * s, dk, 0, 1.45 * s, 0)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.88 * s, 0.5 * s), new THREE.MeshBasicMaterial({ map: rt2.texture, color: 0xdde6ff })); sc.position.set(0, 1.45 * s, 0.21 * s); m.add(sc); screens.push(sc); c.post(X(x), z, 0.4 * s); return m; };
    monitor(3.2, 1.0, 0.9, 1.3); monitor(16.8, -1.4, -1.0, 1.1); monitor(6.6, 5.4, PI - 0.3, 1.0);
    const me = extra(c, c.scene, 0, 0, { col: 0xc8102e }); me.traverse((o) => o.layers.set(1));
    const onair = c.sign('ON AIR', { w: 1.6, h: 0.42, bg: '#2a0000', fg: '#ff4040', font: c.MONO, weight: 800 }); onair.position.set(W / 2, 4.6, -D / 2 + 0.2); g.add(onair);
    const v = new THREE.Vector3(); let fc = 0, aired = 0, was = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { me.visible = false; return; }
      me.visible = true; me.position.set(P.x, P.y - 1.62 * P.scale, P.z); me.rotation.y = P.yaw;
      const dx = P.x - X(13.8), dz = P.z - 3.4; head.rotation.y += (Math.atan2(-dx, -dz) - head.rotation.y) * Math.min(1, dt * 1.2);
      cam2.updateMatrixWorld(); v.set(P.x, P.y - 0.3, P.z).project(cam2); const inFrame = v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9 && Math.hypot(dx, dz) > 1.2;
      tally.material.color.set(inFrame ? 0xff2020 : 0x330000); onair.visible = inFrame || (t * 2 | 0) % 2 === 0;
      if (inFrame) { aired += dt; if (aired > 2 && !was) { was = true; c.egg('onair', 'Two seconds in frame and you are live on Southwest General. Twelve million viewers. Do not look at the lens.'); } }
      if (fc++ % 2) return;
      screens.forEach((s) => { s.visible = false; }); const old = c.renderer.getRenderTarget(); c.renderer.setRenderTarget(rt2); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(old); screens.forEach((s) => { s.visible = true; });
    });
    c.clickable(head, () => { c.sound.tick(); c.egg('studiocam', 'Camera two. It follows whoever is talking. Right now, that is you.'); }, 'Camera two');
    // applause, the light rig, the flowers
    const ap = c.sign('APPLAUSE', { w: 2.0, h: 0.5, bg: '#1a1a1a', fg: '#5a5040', font: c.MONO, weight: 800 }); ap.position.set(0.2, 4.4, -3.6); ap.rotation.y = PI / 2; g.add(ap);
    c.clickable(ap, () => { c.sound.applause(4); ap.material.color?.set?.(0xffffff); c.egg('applause', 'The APPLAUSE light. The studio audience has never once clapped without it.'); }, 'The APPLAUSE light');
    for (let x = 3; x <= 17; x += 2.8) { const lamp = c.glb('ph_hanging_industrial_lamp', { h: 0.5, x, y: 5.2, z: -3.2, parent: g, shadow: false }); }
    g.add(c.slab(15, 0.08, 0.08, std(c, 0x222222, { metalness: 0.8 }), W / 2, 5.75, -3.2));
    [[W / 2 - 1.8, -5.6], [W / 2 + 1.8, -5.8]].forEach(([x, z]) => { g.add(c.slab(0.4, 1.0, 0.4, std(c, 0xf4f4f4), x, 0.5, z)); prop(c, r, g, X, 'ceramic_vase_01', x, z, { h: 0.5, y: 1.0 }); });
    prop(c, r, g, X, 'Megaphone_01', 18.4, 4.8, { len: 0.45, ry: 1.2 }); prop(c, r, g, X, 'metal_toolbox', 2.0, 6.6, { len: 0.55 }); prop(c, r, g, X, 'ladder_sectioned_01', 19.4, -6.0, { h: 3.2, ry: -PI / 2 });
  },

  insideman(c, r, g, X) {
    const { THREE } = c;
    // everybody in white coveralls and dark glasses, sitting on the marble: hostages and robbers dressed the same. One is him.
    const spots = []; for (const x0 of [2.6, 14.2]) for (let i = 0; i < 3; i++) for (let j = 0; j < (c.MOBILE ? 3 : 4); j++) spots.push([x0 + i * 1.6, -5.2 + j * 1.6]);
    const R = spots.length * Math.random() | 0, LINES = ['Hostage. A dentist from Bay Ridge.', 'Hostage. Came in for a roll of quarters.', 'Hostage. Has been counted twice today already.', 'Hostage. Wants it on the record that the coveralls itch.', 'Hostage. Teller, window four. Very calm about all this.', 'Hostage. Says he is a cop. He is not a cop.'];
    let found = false, wrong = 0;
    const ppl = spots.map(([x, z], k) => { const o = c.glb('robber', { h: 1.0, x, z, ry: (Math.random() - 0.5) * 0.2, parent: g }); c.post(X(x), z, 0.45); c.clickable(o, () => { if (k === R) { if (!found) { found = true; c.flash(0.4); } c.say(o, 'My name is MLow. Pay strict attention to what I say, because I count my words carefully and I never repeat myself.', 4200, 1.4); c.egg('dalton', 'Found him. The robber was sitting with the hostages the whole time, dressed exactly like them.'); } else { c.toast(LINES[wrong++ % LINES.length], 2200); } }, 'Somebody in coveralls'); return o; });
    const rob = ppl[R];
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const dx = P.x - X(spots[R][0]), dz = P.z - spots[R][1]; const want = Math.max(-0.7, Math.min(0.7, Math.atan2(dx, dz))); rob.rotation.y += (want - rob.rotation.y) * Math.min(1, dt * 0.8); ppl.forEach((o, k) => { if (k !== R) o.position.y = Math.sin(t * 0.7 + k) * 0.004; }); });
    // the vault, and the one box that mattered
    const steel = std(c, 0xb8bcc4, { metalness: 1, roughness: 0.25 }), vault = new THREE.Group(); vault.position.set(W - 0.3, 1.9, -4.4); vault.rotation.y = -PI / 2; g.add(vault);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.12, 12, 48), steel); vault.add(ring);
    const doorV = new THREE.Group(); vault.add(doorV); const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.4, 48), steel); disk.rotation.x = PI / 2; disk.position.z = 0.15; doorV.add(disk);
    const wheel = new THREE.Group(); wheel.position.z = 0.45; doorV.add(wheel); for (let k = 0; k < 6; k++) { const s = c.slab(0.06, 1.2, 0.06, std(c, 0xd8b048, { metalness: 1, roughness: 0.2 }), 0, 0, 0); s.rotation.z = k * PI / 3; wheel.add(s); }
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), basic(c, 0xffd070)); glow.position.z = -0.1; vault.add(glow);
    let spin = 0, open = 0; c.clickable(doorV, () => { spin = 2.4; c.sound.crack(); setTimeout(() => { open = 1; c.sound.boom(0.3); c.egg('box392', 'Safe deposit box 392. The only thing anybody took. Everything else in the vault: untouched, counted, accounted for.'); }, 1400); }, 'The vault');
    c.tick((t, dt) => { wheel.rotation.z += spin * dt * 4; spin *= 0.97; doorV.rotation.y += (open * -1.2 - doorV.rotation.y) * Math.min(1, dt * 1.5); doorV.position.x = Math.sin(-doorV.rotation.y) * -1.3; });
    // the false wall in the supply room, a week of a man behind it
    const sx = 2.2, sz = 6.9, panel = c.slab(2.2, 2.6, 0.1, std(c, 0xc8b898, { roughness: 0.8 }), sx, 1.3, sz); g.add(panel);
    const cubby = new THREE.Group(); cubby.position.set(sx, 0, sz + 0.5); g.add(cubby); cubby.add(c.slab(1.8, 0.3, 0.6, std(c, 0x4a5a3a), 0, 0.15, 0)); cubby.add(c.slab(0.3, 0.06, 0.22, std(c, 0x8a2a1a), 0.5, 0.33, 0));
    let slid = false; c.clickable(panel, () => { slid = !slid; c.sound.whoosh(0.2, 0.6); if (slid) c.egg('falsewall', 'A week behind a false wall in the supply room, with a bucket and a book. Then he walks out the front door, past everyone.'); }, 'A wall that sounds hollow');
    c.tick((t, dt) => { panel.position.x += ((slid ? sx + 2.1 : sx) - panel.position.x) * Math.min(1, dt * 3); });
    prop(c, r, g, X, 'steel_frame_shelves_03', 4.6, 7.2, { h: 2.0, ry: PI }); prop(c, r, g, X, 'cardboard_box_01', 4.2, 6.6, { h: 0.45 });
    // the teller line
    for (const [x1, x2] of [[16.2, 19.6]]) { g.add(c.slab(x2 - x1, 1.1, 0.7, std(c, 0x5a3a1e, { roughness: 0.4 }), (x1 + x2) / 2, 0.55, -7.2)); for (let x = x1 + 0.1; x < x2; x += 0.12) g.add(c.slab(0.02, 0.8, 0.02, std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), x, 1.5, -7.0)); c.wall(X(x1), -6.8, X(x2), -6.8); }
    prop(c, r, g, X, 'CashRegister_01', 18.8, -7.2, { h: 0.36, y: 1.1 }); prop(c, r, g, X, 'mantel_clock_01', 17.4, -7.2, { h: 0.3, y: 1.1 }); prop(c, r, g, X, 'desk_lamp_arm_01', 16.4, -7.2, { h: 0.45, y: 1.1 });
    const sb = c.sign('DO NOT TALK. DO NOT MOVE. YOU ARE COUNTED.', { w: 4.2, h: 0.32, bg: '#111', fg: '#f4ead2', font: c.MONO, weight: 700 }); sb.position.set(0.2, 3.4, -1.4); sb.rotation.y = PI / 2; g.add(sb);
  },
});

Object.assign(ROOM, {
  prada(c, r, g, X) {
    const { THREE } = c;
    // the racks: seventy garments on three rails, swaying when you walk past
    const PAL = [0x111111, 0xf4f4f4, 0xc8102e, 0x2a52be, 0xe8c8a8, 0x6a1a4a, 0x1a3a2a, 0xd8a020, 0xf0a0c0, 0x5a5a60], rails = [[2.8, -1.6], [2.8, 2.6], [17.2, -0.6]];
    const chrome = std(c, 0xd0d0d4, { metalness: 0.9, roughness: 0.25 }), N = rails.length * 24;
    const coats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1.0, 0.03).translate(0, -0.55, 0), std(c, 0xffffff, { roughness: 0.85 }), N); g.add(coats);
    const col = new THREE.Color(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), sw = new Float32Array(N);
    rails.forEach(([x, z]) => { g.add(c.slab(0.03, 0.03, 2.5, chrome, x, 1.78, z)); [-1.25, 1.25].forEach((dz) => { g.add(c.slab(0.03, 1.78, 0.03, chrome, x, 0.89, z + dz)); g.add(c.slab(0.5, 0.03, 0.03, chrome, x, 0.02, z + dz)); }); c.post(X(x), z, 0.6); c.post(X(x), z + 0.9, 0.5); c.post(X(x), z - 0.9, 0.5); });
    for (let k = 0; k < N; k++) { col.setHex(PAL[(k * 7 + (k >> 3)) % PAL.length]); col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06); coats.setColorAt(k, col); }
    const placeCoats = (t, P) => { for (let k = 0; k < N; k++) { const [x, z] = rails[(k / 24) | 0], zz = z - 1.15 + (k % 24) * 0.1, dx = P ? P.x - X(x) : 9, dz = P ? P.z - zz : 9; if (Math.hypot(dx, dz) < 1.1) sw[k] = Math.min(0.35, sw[k] + 0.05); sw[k] *= 0.97; e4.set(Math.sin(t * 3 + k) * sw[k], 0, 0); q4.setFromEuler(e4); m4.compose(v4.set(x, 1.76, zz), q4, one); coats.setMatrixAt(k, m4); } coats.instanceMatrix.needsUpdate = true; };
    placeCoats(0); c.tick((t, dt, P, ri) => { if (ri === r.i) placeCoats(t, P); });
    // two belts. They look the same. They are not the same.
    const table = c.slab(1.8, 0.05, 0.8, std(c, 0xffffff, { roughness: 0.2 }), W / 2 - 1.2, 0.76, -2.2); g.add(table); [[-0.8, -0.32], [0.8, -0.32], [-0.8, 0.32], [0.8, 0.32]].forEach(([dx, dz]) => g.add(c.slab(0.04, 0.74, 0.04, chrome, W / 2 - 1.2 + dx, 0.37, -2.2 + dz))); c.post(X(W / 2 - 1.2), -2.2, 0.9);
    const wash = document.createElement('div'); wash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:7;background:#2a52be;mix-blend-mode:color;opacity:0;transition:opacity 1.6s'; document.body.appendChild(wash);
    const editor = c.glb('editor', { h: 1.78, x: 13.6, z: -3.4, ry: -0.5, parent: g }); c.post(X(13.6), -3.4, 0.4);
    let blue = 0;
    [[-0.4, 0x2a52be], [0.4, 0x2b55c1]].forEach(([dx, hex]) => { const b = new THREE.Group(); b.position.set(W / 2 - 1.2 + dx, 0.795, -2.2); g.add(b); const strap = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 6, 40), std(c, hex, { roughness: 0.5 })); strap.rotation.x = PI / 2; strap.scale.set(1, 1, 0.25); b.add(strap); b.add(c.slab(0.05, 0.012, 0.06, chrome, 0.16, 0.006, 0));
      c.clickable(b, () => { blue = 6; wash.style.opacity = 0.42; c.sound.whoosh(0.2, 1.5); c.say(editor, 'Not blue. Cerulean. It came off a runway, through a department store, into a clearance bin, and onto your back. Counted all the way.', 5200, 2.0); c.egg('cerulean', 'Two belts, identical to you, entirely different to everyone in this building. That is the whole job.'); }, 'A belt'); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (blue) { blue = 0; wash.style.opacity = 0; } return; } if (blue > 0) { blue -= dt; if (blue <= 0) { blue = 0; wash.style.opacity = 0; } } });
    c.clickable(editor, () => { c.say(editor, 'That is all.', 1800, 2.0); c.egg('editor'); }, 'The editor');
    const asst = c.glb('assistant', { h: 1.68, x: 7.4, z: -0.8, ry: 0.9, parent: g }); c.post(X(7.4), -0.8, 0.4);
    c.clickable(asst, () => { c.say(asst, 'Fourteen lattes, a phone that never stops, and the Book by ten. Sure. Fine. Great.', 3200, 1.9); c.egg('assistant'); }, 'The new assistant');
    // her desk, the coffee, the Book
    g.add(c.slab(2.0, 0.04, 0.9, new THREE.MeshPhysicalMaterial({ color: 0xe8f0f0, transparent: true, opacity: 0.45, roughness: 0.05 }), 13.6, 0.75, -5.2)); [-0.9, 0.9].forEach((dx) => g.add(c.slab(0.04, 0.74, 0.8, chrome, 13.6 + dx, 0.37, -5.2))); c.post(X(13.6), -5.2, 1.0);
    const book = c.slab(0.36, 0.08, 0.5, std(c, 0x1a1a1a, { roughness: 0.6 }), 13.0, 0.81, -5.2); g.add(book);
    c.clickable(book, () => c.egg('thebook', 'The Book: next month, pasted up by hand. Deliver it to the townhouse by ten, leave it on the table, and never, ever go upstairs.'), 'The Book');
    const cups = new THREE.Group(); cups.position.set(14.2, 0.77, -5.0); g.add(cups); [0, 0.12].forEach((dx) => { const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.15, 16), std(c, 0xf4f0e8)); cu.position.set(dx, 0.075, 0); cups.add(cu); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 16), std(c, 0x222222)); lid.position.set(dx, 0.16, 0); cups.add(lid); });
    c.clickable(cups, () => c.egg('latte', 'Her coffee lands on the desk at nine sharp, scalding. If it is cold, so are you.'), 'Two coffees');
    // the staff, clacking back and forth, who all stop dead when you get near her
    const staff = [5.6, 9.0, 11.6, 15.6].map((x, k) => ({ e: extra(c, g, x, 0, { col: [0x111111, 0x2a2a2a, 0xf4f4f4, 0x111111][k] }), x, ph: k * 1.7, sp: 0.5 + k * 0.08 }));
    let hush = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const near = Math.hypot(P.x - X(13.6), P.z + 3.4) < 3.2; if (near && !hush) c.egg('gird', 'Everybody freezes when she walks in. Shoes change, lipstick goes on, somebody hides a sandwich. Gird your loins.'); hush = near; staff.forEach((s) => { if (!hush) { s.ph += dt * s.sp; s.e.position.z = Math.sin(s.ph) * 5.6; s.e.position.y = Math.abs(Math.sin(s.ph * 9)) * 0.03; s.e.rotation.y = Math.cos(s.ph) > 0 ? 0 : PI; } else s.e.rotation.y = Math.atan2(13.6 - s.x, -3.4 - s.e.position.z); }); });
    prop(c, r, g, X, 'modern_arm_chair_01', 6.0, 5.2, { h: 0.85, ry: PI - 0.4, r: 0.45 }); prop(c, r, g, X, 'modern_arm_chair_01', 8.6, 5.6, { h: 0.85, ry: PI + 0.3, r: 0.45 }); prop(c, r, g, X, 'modern_coffee_table_01', 7.3, 4.2, { len: 1.1, r: 0.5 });
    prop(c, r, g, X, 'mid_century_lounge_chair', 15.8, 4.6, { h: 0.9, ry: -2.4, r: 0.55 }); prop(c, r, g, X, 'ClassicConsole_01', 0.5, -3.0, { len: 1.4, ry: PI / 2 }); prop(c, r, g, X, 'ceramic_vase_03', 7.3, 4.2, { h: 0.35, y: 0.42 });
    [[1, -6.6], [19, -6.6], [19, 6.8]].forEach(([x, z]) => prop(c, r, g, X, 'potted_plant_02', x, z, { h: 1.4, r: 0.4 }));
  },

  blackswan(c, r, g, X) {
    const { THREE } = c;
    // the mirror wall and the barre. Your reflection is a dancer. Stand there long enough and it is a different dancer.
    const mw = 11, mh = 3.4;
    const mirror = new Reflector(new THREE.PlaneGeometry(mw, mh), { textureWidth: c.MOBILE ? 512 : 1280, textureHeight: c.MOBILE ? 160 : 400, color: 0xb0b4b8, clipBias: 0.003 });
    mirror.position.set(W / 2, 0.1 + mh / 2, D / 2 - 0.16); mirror.rotation.y = PI; g.add(mirror); mirror.getReflectionCamera(c.camera).layers.enable(1);
    const wood = std(c, 0xb08a5a, { roughness: 0.4 }), steel = std(c, 0x9a9aa0, { metalness: 0.9, roughness: 0.3 });
    g.add(c.slab(mw, 0.06, 0.06, wood, W / 2, 1.05, D / 2 - 0.5)); for (let x = W / 2 - mw / 2 + 0.4; x < W / 2 + mw / 2; x += 2.6) g.add(c.slab(0.04, 0.04, 0.36, steel, x, 1.05, D / 2 - 0.34));
    c.wall(X(W / 2 - mw / 2), D / 2 - 0.6, X(W / 2 + mw / 2), D / 2 - 0.6);
    const lay = (o) => o.traverse((m) => m.layers.set(1));
    const white = c.glb('odette', { h: 1.7, parent: c.scene, shadow: false, onload: lay }), black = c.glb('odile', { h: 1.7, parent: c.scene, shadow: false, onload: lay });
    let stand = 0, said = false; const fwd = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { white.visible = black.visible = false; stand = 0; return; }
      c.camera.getWorldDirection(fwd); const front = P.z > D / 2 - 4.5 && Math.abs(P.x - X(W / 2)) < mw / 2 && fwd.z > 0.6; stand = front ? stand + dt : Math.max(0, stand - dt * 3);
      const turned = stand > 4; white.visible = !turned; black.visible = turned;
      white.position.set(P.x, P.y - 1.62 * P.scale, P.z); white.rotation.y = P.yaw + PI; white.scale.setScalar(P.scale);
      if (!turned) { black.position.copy(white.position); black.rotation.y = white.rotation.y; return; }
      const ph = t % 7; black.position.x += (P.x - black.position.x) * Math.min(1, dt * 0.6); black.position.z += (P.z - black.position.z) * Math.min(1, dt * 0.6);
      black.position.y = P.y - 1.62 * P.scale + (ph < 2.5 ? Math.abs(Math.sin(t * 7)) * 0.08 : 0);
      black.rotation.y = ph < 2.5 ? t * 9 : ph < 4.5 ? P.yaw : P.yaw + PI + Math.sin(t * 2) * 0.3;
      if (!said) { said = true; c.say(mirror, 'You stopped. She did not.', 2600, 1.4); c.egg('otherswan', 'Your reflection kept dancing after you stopped. It turned its back on you, then it turned round. It wants your part.'); }
    });
    // the company, at the barre on the far side
    [[5.8, -3.4, 0.4], [14.2, -3.4, -0.4]].forEach(([x, z, ry], k) => { const d = c.glb('odette', { h: 1.7, x, z, ry, parent: g }); c.post(X(x), z, 0.45); c.tick((t) => { d.rotation.y = ry + Math.sin(t * 0.6 + k * 2) * 0.5; d.position.y = Math.abs(Math.sin(t * 1.2 + k)) * 0.04; }); c.clickable(d, () => { c.say(d, 'I felt it. Perfect. I was counted.', 2400, 1.9); c.egg('odette'); }, 'A dancer'); });
    // the music box: the theme from 1876, in the public domain, on a comb of little bells
    const mb = new THREE.Group(); mb.position.set(1.4, 0, -0.2); g.add(mb); prop(c, r, g, X, 'wooden_stool_02', 1.4, -0.2, { h: 0.62, r: 0.3 });
    mb.add(c.slab(0.32, 0.14, 0.22, std(c, 0xe8a8c0, { roughness: 0.4 }), 0, 0.69, 0)); const lid = c.slab(0.32, 0.02, 0.22, std(c, 0xe8a8c0, { roughness: 0.4 }), 0, 0.77, -0.1); lid.rotation.x = -1.2; lid.position.set(0, 0.85, -0.13); mb.add(lid);
    const tiny = new THREE.Group(); tiny.position.y = 0.77; mb.add(tiny); const tt = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.03, 12), std(c, 0xffffff)); tt.position.y = 0.04; tiny.add(tt); tiny.add(c.slab(0.008, 0.08, 0.008, std(c, 0xf0d0c0), 0, 0.07, 0));
    const THEME = [[740, 2], [493.9, 0.5], [554.4, 0.5], [587.3, 0.5], [659.3, 0.5], [740, 1.5], [587.3, 0.5], [740, 1.5], [587.3, 0.5], [740, 1.5], [493.9, 0.5], [587.3, 0.5], [493.9, 0.5], [392, 0.5], [587.3, 0.5], [493.9, 3]];
    let playing = false; c.clickable(mb, () => { if (playing) return; playing = true; let at = 0; THEME.forEach(([f, d]) => { setTimeout(() => c.sound.note(f, 0.16), at * 330); at += d; }); setTimeout(() => { playing = false; c.egg('musicbox', 'The swan theme, on a music box from her childhood bedroom. Her mother still winds it every night.'); }, at * 330); }, 'A music box');
    c.tick((t) => { tiny.rotation.y = playing ? t * 5 : tiny.rotation.y; });
    // pointe shoes on a nail, and the pink cake nobody will eat
    const shoes = new THREE.Group(); shoes.position.set(0.22, 1.5, 0.8); g.add(shoes); [-0.06, 0.06].forEach((dz, k) => { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 4, 10), std(c, 0xf0c8c0, { roughness: 0.3 })); s.position.set(0, -0.15 - k * 0.04, dz); s.rotation.z = 0.15; shoes.add(s); const rb = c.slab(0.004, 0.3, 0.012, std(c, 0xf0b0b8), 0.01, -0.02, dz); shoes.add(rb); });
    c.clickable(shoes, () => c.egg('pointe', 'Pointe shoes, broken in by hand: bent, scored, sewn, slammed in a door. Every dancer in the company has a method and a superstition.'), 'Pointe shoes');
    prop(c, r, g, X, 'painted_wooden_chair_01', 18.6, -0.4, { h: 0.9, ry: -PI / 2, r: 0.35 });
    const cake = new THREE.Group(); cake.position.set(18.6, 0.47, -0.4); g.add(cake); const ck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24), std(c, 0xf4b8c8, { roughness: 0.6 })); ck1.position.y = 0.06; cake.add(ck1); const ck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 24), std(c, 0xffffff)); ck2.position.y = 0.13; cake.add(ck2);
    c.clickable(cake, () => c.egg('cake', 'A big pink cake to celebrate the part. She will not eat it. Her mother says she will throw it out, then does not.'), 'A pink cake');
    prop(c, r, g, X, 'vintage_suitcase', 2.6, 6.4, { len: 0.7, ry: 0.3 }); prop(c, r, g, X, 'Lantern_01', 17.6, -6.4, { h: 0.4 });
  },

  cocktail(c, r, g, X) {
    const { THREE } = c;
    // the bar, lit from inside, neon underneath
    const bx1 = 4.4, bx2 = 15.6, bz = -2.9;
    g.add(c.slab(bx2 - bx1, 1.08, 0.7, std(c, 0x1a0a14, { roughness: 0.35 }), W / 2, 0.54, bz)); g.add(c.slab(bx2 - bx1 + 0.2, 0.05, 0.84, basic(c, 0xfff0e0), W / 2, 1.1, bz));
    g.add(c.slab(bx2 - bx1, 0.04, 0.02, basic(c, 0xff4fa3), W / 2, 0.12, bz + 0.36)); g.add(c.slab(bx2 - bx1, 0.04, 0.02, basic(c, 0x22d3ee), W / 2, 1.02, bz + 0.36));
    c.wall(X(bx1), bz + 0.36, X(bx2), bz + 0.36); c.wall(X(bx1), bz + 0.36, X(bx1), -6.8); c.wall(X(bx2), bz + 0.36, X(bx2), -6.8);
    for (let k = 0; k < 7; k++) prop(c, r, g, X, 'bar_chair_round_01', bx1 + 0.8 + k * 1.6, bz + 0.85, { h: 0.82 });
    // bottles, a lot of bottles: one instanced wall of them, lit from below
    const bGeo = new THREE.LatheGeometry([[0, 0], [0.04, 0], [0.042, 0.02], [0.042, 0.18], [0.02, 0.23], [0.014, 0.3], [0.016, 0.31], [0, 0.31]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
    const NB = 72, shelf = new THREE.InstancedMesh(bGeo, new THREE.MeshStandardMaterial({ roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.88 }), NB), m4 = new THREE.Matrix4(), cl = new THREE.Color(), BC = [0x6a3a10, 0x2a6a2a, 0xc8a050, 0xe8e8e8, 0x8a1a1a, 0x3a3a8a, 0xd87a20, 0x1a1a1a];
    for (let k = 0; k < NB; k++) { const row = (k / 18) | 0, i = k % 18; m4.makeTranslation(16.3 + i * 0.18, 1.22 + row * 0.5, -7.55 + (i % 2) * 0.08); shelf.setMatrixAt(k, m4); shelf.setColorAt(k, cl.setHex(BC[(k * 5) % BC.length])); } g.add(shelf);
    for (let row = 0; row < 4; row++) { g.add(c.slab(3.4, 0.03, 0.3, std(c, 0xffffff, { roughness: 0.2 }), 17.9, 1.2 + row * 0.5, -7.55)); g.add(c.slab(3.4, 0.015, 0.02, basic(c, row % 2 ? 0xff4fa3 : 0x22d3ee), 17.9, 1.19 + row * 0.5, -7.39)); }
    // the tap: Nazar Cola
    const tap = new THREE.Group(); tap.position.set(6.2, 1.12, bz - 0.1); g.add(tap); tap.add(c.slab(0.05, 0.36, 0.05, std(c, 0xd0d0d0, { metalness: 1, roughness: 0.2 }), 0, 0.18, 0)); const eye = decal(c, 0.12, 0.12, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.95)); eye.position.set(0, 0.42, 0.03); tap.add(eye);
    c.clickable(tap, () => { c.sound.drip(); c.egg('nazarcola', 'Nazar Cola, on tap. Keeps the evil eye off and the sugar on.'); }, 'The tap');
    const board = c.sign('THE LAST BARMAN POET  ·  TONIGHT', { w: 2.4, h: 0.36, bg: '#111', fg: '#f4ead2', font: c.SERIF, weight: 800 }); board.position.set(0.2, 3.3, -3.6); board.rotation.y = PI / 2; g.add(board);
    c.clickable(board, () => c.egg('poet', 'Tonight the last barman poet stands on the bar and reads. It is mostly about cocktails and entirely about himself.'), 'A chalkboard');
    // the flair: click the bartender and he throws you bottles. Click them in the air to catch.
    const bt = c.glb('bartender', { h: 1.85, x: W / 2, z: bz - 1.0, ry: 0, parent: g });
    const BOT = [0x2a8a3a, 0xa83a1a, 0x3a5aa8].map((hex) => { const b = new THREE.Mesh(bGeo, std(c, hex, { roughness: 0.08, metalness: 0.2 })); b.scale.setScalar(1.4); b.visible = false; g.add(b); const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.2; b.add(hit); return { b, hit, s: -1, back: false, a: new THREE.Vector3(), z: new THREE.Vector3() }; });
    const A = new THREE.Vector3(W / 2 + 0.3, 1.6, bz - 0.6), DUR = c.MOBILE ? 1.9 : 1.45; let juggling = false, streak = 0, best = 0;
    const toss = (o, P) => { if (!juggling) return; o.a.copy(A); o.z.set(P.x - r.x0 - Math.sin(P.yaw) * 1.1, 1.35, P.z - Math.cos(P.yaw) * 1.1); o.s = 0; o.back = false; o.b.visible = true; };
    BOT.forEach((o) => c.clickable(o.hit, () => { if (o.s < 0.12 || o.back) return; streak++; best = Math.max(best, streak); c.sound.catch_(streak); o.back = true; o.s = 0; o.a.copy(o.b.position); o.z.copy(A); if (streak === 5) c.egg('flair', 'Five in a row. You could work the bar at Flanagan\'s. Tips are better standing on it.'); }, 'Catch the bottle'));
    c.clickable(bt, () => { if (juggling) return; c.say(bt, 'Coughlin\'s Law: never leave a New Yorker uncounted. Heads up.', 2600, 2.0); c.egg('bartender'); juggling = true; streak = 0; BOT.forEach((o, k) => setTimeout(() => toss(o, c.P), 900 + k * 650)); }, 'The bartender');
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (juggling) { juggling = false; BOT.forEach((o) => { o.s = -1; o.b.visible = false; }); } return; }
      BOT.forEach((o) => { if (o.s < 0) return; o.s += dt / (o.back ? 0.7 : DUR); const u = Math.min(1, o.s);
        o.b.position.lerpVectors(o.a, o.z, u); o.b.position.y += Math.sin(u * PI) * (o.back ? 1.2 : 2.0); o.b.rotation.z = t * 11; o.b.rotation.x = t * 3;
        if (u >= 1) { if (o.back) { o.s = -1; setTimeout(() => toss(o, c.P), 250); } else { o.s = -1; o.b.position.y = 0.05; o.b.rotation.set(PI / 2, 0, 0); c.sound.crack(); streak = 0; juggling = false; c.toast(`Dropped. ${best} caught. Click the bartender to go again.`, 2600); c.egg('drop', 'Dropped one. At Flanagan\'s that comes out of your tips.'); setTimeout(() => { o.b.visible = false; }, 1500); } } });
      bt.rotation.y = Math.sin(t * 2) * (juggling ? 0.3 : 0.08); bt.position.y = juggling ? Math.abs(Math.sin(t * 6)) * 0.03 : 0;
    });
    // the neon ceiling
    [[W / 2, 0xff4fa3], [W / 2, 0x22d3ee]].forEach(([x, hex], k) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6 + k * 0.5, 0.03, 8, 64), basic(c, hex)); ring.rotation.x = PI / 2; ring.position.set(x, 5.6 - k * 0.15, 1.6); g.add(ring); });
    prop(c, r, g, X, 'ceramic_vase_03', 9.0, bz, { h: 0.3, y: 1.13 }); prop(c, r, g, X, 'lemon', 11.0, bz, { len: 0.08, y: 1.13 }); prop(c, r, g, X, 'lemon', 11.1, bz + 0.05, { len: 0.08, y: 1.13 });
    [[2.6, 6.4], [14.6, 6.4]].forEach(([x, z]) => { prop(c, r, g, X, 'round_wooden_table_01', x, z, { len: 0.8, r: 0.5 }); prop(c, r, g, X, 'bar_chair_round_01', x + 0.7, z, { h: 0.8 }); });
  },
});

Object.assign(ROOM, {
  gangs(c, r, g, X) {
    const { THREE } = c;
    // six gas lamps in a fog you can barely see your hand in. Light them one by one; the fog gives back who was standing in it.
    const LAMPS = [[3.2, -4.6], [16.8, -4.6], [3.2, 0.6], [16.8, 0.6], [7.0, 6.4], [13.0, 6.4]], iron = std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.5 });
    let lit = 0;
    const lamps = LAMPS.map(([x, z]) => {
      const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); o.add(c.slab(0.1, 2.8, 0.1, iron, 0, 1.4, 0)); o.add(c.slab(0.3, 0.06, 0.3, iron, 0, 2.82, 0));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.26), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0x000000, transparent: true, opacity: 0.8, roughness: 0.1 })); glass.position.y = 3.04; o.add(glass);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 4), iron); cap.position.y = 3.33; cap.rotation.y = PI / 4; o.add(cap);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,200,120,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(3.4, 3.4, 1); halo.position.y = 3.04; halo.visible = false; o.add(halo);
      c.post(X(x), z, 0.2);
      const L = { glass, halo, on: false }; c.clickable(o, () => { if (L.on) return; L.on = true; lit++; glass.material.emissive.set(0xffb060); glass.material.emissiveIntensity = 2.2; halo.visible = true; c.sound.whoosh(0.15, 0.6); if (lit === LAMPS.length) setTimeout(() => { c.say(butcher, 'You are in the Points now. Everybody here gets counted, whether they like it or not.', 3800, 2.2); c.egg('points', 'Every lamp in Paradise Square lit, and now you can see them all: they were standing there the whole time, watching you in the fog.'); }, 600); }, 'Light the lamp');
      return L;
    });
    const butcher = c.glb('butcher', { h: 1.98, x: W / 2, z: -4.8, ry: 0, parent: g }); c.post(X(W / 2), -4.8, 0.45);
    c.clickable(butcher, () => { c.say(butcher, 'I count every face in this square. Yours I will remember.', 2800, 2.3); c.egg('butcher'); }, 'The man in the top hat');
    // the crowd in the fog, every head turned to you
    const crowd = []; for (let k = 0; k < (c.MOBILE ? 12 : 22); k++) { let x, z; do { x = 1.5 + Math.random() * 17; z = -6.4 + Math.random() * 13; } while (Math.abs(x - W / 2) < 1.6 && z > -1 || (x < 2.6 || x > 17.4) && z > 1.6 && z < 6); const e = extra(c, g, x, z, { col: [0x1a1814, 0x2a241c, 0x3a2a20, 0x14161a][k % 4] }); e.userData.hat = k % 3 === 0; if (e.userData.hat) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 14), std(c, 0x0e0e0e)); h.position.y = 2.0; e.add(h); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16), std(c, 0x0e0e0e)); br.position.y = 1.86; e.add(br); } c.post(X(x), z, 0.3); crowd.push(e); }
    const snowN = c.MOBILE ? 400 : 900, sp = new Float32Array(snowN * 3); for (let k = 0; k < snowN; k++) { sp[k * 3] = Math.random() * W; sp[k * 3 + 1] = Math.random() * 6; sp[k * 3 + 2] = -7.5 + Math.random() * 15; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.8 })); snow.frustumCulled = false; g.add(snow);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      c.scene.fog.density = 0.075 - lit * 0.0095;
      crowd.forEach((e, k) => { const want = Math.atan2(P.x - X(e.position.x), P.z - e.position.z); e.rotation.y += (want - e.rotation.y) * Math.min(1, dt * 0.6); });
      butcher.rotation.y = Math.atan2(P.x - X(W / 2), P.z + 4.8);
      for (let k = 0; k < snowN; k++) { sp[k * 3 + 1] -= dt * 0.7; sp[k * 3] += Math.sin(t + k) * dt * 0.1; if (sp[k * 3 + 1] < 0) sp[k * 3 + 1] = 6; } sg.attributes.position.needsUpdate = true;
    });
    // the oyster cart, the hat, the barrels
    const cart = new THREE.Group(); cart.position.set(16.4, 0, -1.8); cart.rotation.y = 0.4; g.add(cart); const wd = std(c, 0x4a3420, { roughness: 0.8 });
    cart.add(c.slab(1.8, 0.08, 1.0, wd, 0, 0.72, 0)); cart.add(c.slab(1.8, 0.3, 0.05, wd, 0, 0.9, 0.48)); cart.add(c.slab(1.8, 0.3, 0.05, wd, 0, 0.9, -0.48)); [-0.6, 0.6].forEach((dz) => { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 20), wd); wh.position.set(0, 0.44, dz * 1.0); g.add(wh); cart.add(wh); }); [0.2, -0.2].forEach((dz) => cart.add(c.slab(1.6, 0.05, 0.05, wd, -1.6, 0.75, dz)));
    const shells = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6).scale(1, 0.35, 0.7), std(c, 0x9a9488, { roughness: 0.7 }), 40), m4 = new THREE.Matrix4(); for (let k = 0; k < 40; k++) { m4.makeRotationY(Math.random() * 6); m4.setPosition(-0.8 + Math.random() * 1.6, 0.8 + Math.random() * 0.06, -0.4 + Math.random() * 0.8); shells.setMatrixAt(k, m4); } cart.add(shells); c.post(X(16.4), -1.8, 1.0);
    const os = c.sign('N3W YORKERS OYSTERS  ·  A PENNY', { w: 1.8, h: 0.26, bg: '#e8dcc0', fg: '#2a1a0a', font: c.SERIF, weight: 800 }); os.position.set(0, 1.25, 0.5); cart.add(os);
    c.clickable(cart, () => c.egg('oysters', 'Oysters by the cartload. In 1863 New York shucked more of them than anywhere on earth, and Five Points ate them by the penny.'), 'An oyster cart');
    prop(c, r, g, X, 'Barrel_01', 4.8, 4.2, { h: 0.9, r: 0.4 });
    const hat = new THREE.Group(); hat.position.set(4.8, 0.9, 4.2); g.add(hat); const hc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.3, 16), std(c, 0x0e0e0e, { roughness: 0.5 })); hc.position.y = 0.17; hat.add(hc); const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 20), std(c, 0x0e0e0e)); hat.add(hb);
    c.clickable(hat, () => { hat.visible = false; c.egg('stovepipe', 'A stovepipe hat on a barrel. In Paradise Square you could tell a gang by its hats, its coats and which way it wore its colours.'); setTimeout(() => { hat.visible = true; }, 8000); }, 'A top hat');
    prop(c, r, g, X, 'wooden_barrels_01', 18.4, -5.6, { h: 1.0, r: 0.8 }); prop(c, r, g, X, 'wooden_crate_02', 1.6, -6.4, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'Lantern_01', 1.6, -6.4, { h: 0.35, y: 0.6 }); prop(c, r, g, X, 'wooden_crate_01', 18.2, 6.6, { h: 0.6, r: 0.4 });
  },

  oddcouple(c, r, g, X) {
    const { THREE } = c;
    // one apartment, two men, a line down the middle. The half you are standing in is always his.
    const line = c.slab(0.05, 0.012, D - 1, basic(c, 0xc8102e), W / 2, 0.012, 0); g.add(line);
    const items = [], keep = (o, neat, lx) => { o.userData.lx = lx; o.userData.neat = neat; items.push(o); return o; };
    const pr = (name, lx, z, o, neat) => keep(prop(c, r, g, X, name, lx, z, o), neat, lx);
    // the neat half
    pr('painted_wooden_cabinet', 0.6, -3.0, { h: 1.0, ry: PI / 2 }, true); pr('coffee_table_round_01', 5.0, 0.6, { len: 1.0 }, true); pr('ceramic_vase_01', 5.0, 0.6, { h: 0.4, y: 0.45 }, true);
    pr('potted_plant_02', 1.0, -6.6, { h: 1.4 }, true); pr('ArmChair_01', 3.4, 1.4, { h: 1.0, ry: 0.9 }, true); pr('desk_lamp_arm_01', 0.6, -2.8, { h: 0.5, y: 1.0 }, true);
    const mags = new THREE.Group(); mags.position.set(5.0, 0.42, 0.9); g.add(mags); for (let k = 0; k < 5; k++) mags.add(c.slab(0.22, 0.012, 0.3, std(c, [0xc8102e, 0x2a52be, 0xf5c542, 0x111111, 0xf4f4f4][k]), 0, k * 0.013, 0)); keep(mags, true, 5.0);
    const felix = keep(c.glb('felix', { h: 1.75, x: 6.6, z: -1.6, ry: 0.5, parent: g }), true, 6.6);
    c.clickable(felix, () => { c.say(felix, 'Coasters. Use the coasters. I counted them this morning and there were twelve.', 3000, 2.0); c.egg('felix'); }, 'The neat one');
    // the messy half
    pr('Sofa_01', 2.0, -1.6, { len: 2.2, ry: PI / 2 }, false); pr('cardboard_box_01', 3.0, 6.6, { h: 0.5, ry: 0.5 }, false); pr('desk_lamp_arm_01', 6.2, 5.8, { h: 0.5, ry: 1.9 }, false); pr('old_tyre', 7.0, -6.0, { len: 0.7 }, false);
    const oscar = keep(c.glb('oscar', { h: 1.78, x: 6.4, z: 1.6, ry: -0.4, parent: g }), false, 6.4);
    c.clickable(oscar, () => { c.say(oscar, 'I am a slob, you are neat, and we are both counted. Pass the green sandwich.', 3000, 2.0); c.egg('oscar'); }, 'The messy one');
    const pizza = new THREE.Group(); pizza.position.set(4.6, 0, 3.4); g.add(pizza); keep(pizza, false, 4.6);
    const pT = c.canvasTex(128, 128, (q) => { q.fillStyle = '#c8a070'; q.fillRect(0, 0, 128, 128); q.fillStyle = '#e8c060'; q.beginPath(); q.arc(64, 64, 54, 0, 7); q.fill(); q.fillStyle = '#b0301a'; for (let k = 0; k < 10; k++) { q.beginPath(); q.arc(20 + Math.random() * 88, 20 + Math.random() * 88, 7, 0, 7); q.fill(); } q.fillStyle = '#c8a070'; q.beginPath(); q.moveTo(64, 64); q.arc(64, 64, 60, 0.3, 1.5); q.fill(); });
    [[0, 0, 0.3], [0.5, 0.2, -0.4], [0.1, -0.5, 1.1]].forEach(([dx, dz, ry], k) => { const bx = new THREE.Group(); bx.position.set(dx, 0.02 + k * 0.05, dz); bx.rotation.y = ry; pizza.add(bx); bx.add(c.slab(0.45, 0.04, 0.45, std(c, 0xe8dcc0), 0, 0, 0)); const pz = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: pT })); pz.rotation.x = -PI / 2; pz.position.y = 0.022; bx.add(pz); });
    const cans = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 12), std(c, 0xc8c8cc, { metalness: 0.8, roughness: 0.3 }), 14), m4 = new THREE.Matrix4(), CAN = [];
    for (let k = 0; k < 14; k++) CAN.push([2.6 + Math.random() * 6, -5 + Math.random() * 11, Math.random() < 0.5]);
    const canGroup = new THREE.Group(); g.add(canGroup); canGroup.add(cans); keep(canGroup, false, 0);
    const placeCans = (mirror) => { CAN.forEach(([x, z, down], k) => { m4.makeRotationZ(down ? PI / 2 : 0); m4.setPosition(mirror ? W - x : x, down ? 0.033 : 0.06, z); cans.setMatrixAt(k, m4); }); cans.instanceMatrix.needsUpdate = true; };
    const clothes = new THREE.Group(); clothes.position.set(3.4, 0, -4.4); g.add(clothes); keep(clothes, false, 3.4); [[0, 0, 0x3a5a8a], [0.6, 0.3, 0xe8e0d0], [-0.3, 0.6, 0x8a2a2a], [0.9, -0.5, 0x2a2a2a]].forEach(([dx, dz, hex]) => { const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8).scale(1.3, 0.35, 1), std(c, hex, { roughness: 0.95 })); p2.position.set(dx, 0.08, dz); clothes.add(p2); });
    const tbl = pr('WoodenTable_03', 6.4, -4.2, { len: 1.3 }, false);
    const sand = new THREE.Group(); sand.position.set(6.4, 0.78, -4.2); g.add(sand); keep(sand, false, 6.4); [[-0.2, 0x8a9a3a], [0.2, 0x7a5030]].forEach(([dx, hex]) => { sand.add(c.slab(0.2, 0.015, 0.2, std(c, 0xf4f4f4), dx, 0, 0)); sand.add(c.slab(0.14, 0.05, 0.12, std(c, hex, { roughness: 0.9 }), dx, 0.035, 0)); });
    c.clickable(sand, () => c.egg('sandwich', 'Green sandwiches or brown sandwiches. The green is either very new cheese or very old meat. Nobody in this apartment has checked.'), 'Two sandwiches');
    let neatLeft = false, swaps = 0;   // you come in on the left, so the left starts as the slob's half
    items.forEach((o) => { if (o !== canGroup) o.position.x = o.userData.neat === neatLeft ? o.userData.lx : W - o.userData.lx; });
    placeCans(neatLeft);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const leftSide = P.x - r.x0 < W / 2, want = !leftSide;
      if (want !== neatLeft) { neatLeft = want; c.flash(0.25); c.sound.whoosh(0.25, 0.8); placeCans(neatLeft); if (++swaps === 2) c.egg('swap', 'Cross the line and the two halves trade places. Wherever you stand is the slob\'s half. Two divorced men, one apartment, no truce.'); }
      items.forEach((o) => { if (o === canGroup) return; const lx = o.userData.lx, tx = o.userData.neat === neatLeft ? lx : W - lx; o.position.x += (tx - o.position.x) * Math.min(1, dt * 5); });
      felix.position.y = Math.abs(Math.sin(t * 5)) * 0.02;
    });
    // the poker table on the line, the linguine on the wall, the note on the door
    prop(c, r, g, X, 'round_wooden_table_01', W / 2, -5.2, { len: 1.5, r: 0.8 }); [[0, -0.95, 0], [0.95, 0, -PI / 2], [-0.95, 0, PI / 2], [0, 0.95, PI]].forEach(([dx, dz, ry]) => prop(c, r, g, X, 'dining_chair_02', W / 2 + dx, -5.2 + dz, { h: 0.9, ry }));
    const chips = new THREE.Group(); chips.position.set(W / 2, 0.76, -5.2); g.add(chips); for (let k = 0; k < 18; k++) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 12), std(c, [0xc8102e, 0x2a52be, 0xffffff][k % 3])); ch.position.set(-0.2 + (k % 3) * 0.2, (k / 3 | 0) * 0.007, 0.2); chips.add(ch); } for (let k = 0; k < 5; k++) { const cd = c.slab(0.06, 0.002, 0.09, std(c, 0xffffff), -0.2 + k * 0.1, 0.002, -0.1); cd.rotation.y = (Math.random() - 0.5) * 0.4; chips.add(cd); }
    c.clickable(chips, () => { c.sound.clink(1800); c.egg('poker', 'Friday night poker. Six players, one ashtray, and the same five dollars changing hands since 1965.'); }, 'The poker table');
    const lin = decal(c, 1.4, 1.0, (q, w, h) => { q.strokeStyle = '#e8c870'; q.lineWidth = 5; for (let k = 0; k < 26; k++) { q.beginPath(); let x = w * 0.3 + Math.random() * w * 0.4, y = h * 0.2; q.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (Math.random() - 0.5) * 50; y += 18 + Math.random() * 20; q.lineTo(x, y); } q.stroke(); } q.fillStyle = 'rgba(180,60,20,.5)'; q.beginPath(); q.arc(w / 2, h * 0.3, 40, 0, 7); q.fill(); });
    lin.position.set(1.6, 3.1, -D / 2 + 0.03); g.add(lin);
    c.clickable(lin, () => c.egg('linguine', 'It is not spaghetti. It is linguine. Now it is a wall piece, hung and counted.'), 'Something on the wall');
    const note = c.sign('WE ARE ALL OUT OF CENSUS FORMS. F.U.', { w: 1.2, h: 0.22, bg: '#fff8d0', fg: '#222', font: c.MONO, weight: 600 }); note.position.set(0.2, 1.6, 1.4); note.rotation.y = PI / 2; g.add(note);
    c.clickable(note, () => c.egg('fu', 'A note on the door, signed with his initials. He meant Felix Ungar. Everybody read it the other way.'), 'A note');
  },

  ontown(c, r, g, X) {
    const { THREE } = c;
    // shore leave runs on its own clock in here: a whole day, dawn to dawn, in sixty seconds
    const KEY = [[0, 0xf0b890, 0.75, 1.0], [0.18, 0xa8c8e8, 1.15, 1.0], [0.46, 0xb8c8d8, 1.0, 0.95], [0.56, 0xe88858, 0.7, 0.8], [0.66, 0x101830, 0.12, 0.28], [0.9, 0x1a1a3a, 0.14, 0.3], [1, 0xf0b890, 0.75, 1.0]];
    const ca = new THREE.Color(), cb = new THREE.Color(), sky = new THREE.Color(), white = new THREE.Color(1, 1, 1);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,150,.9)'), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sun.scale.set(18, 18, 1); g.add(sun);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(220,230,255,.8)'), transparent: true, depthWrite: false, fog: false })); moon.scale.set(7, 7, 1); g.add(moon);
    const NS = 500, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) { sp[k * 3] = W / 2 + (Math.random() - 0.5) * 260; sp[k * 3 + 1] = 32 + Math.random() * 60; sp[k * 3 + 2] = -100 - Math.random() * 40; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0, fog: false, depthWrite: false })); stars.frustumCulled = false; g.add(stars);
    // the clock on its post, telling shore leave time
    const post = new THREE.Group(); post.position.set(16.6, 0, -2.6); g.add(post); const iron = std(c, 0x1e2a24, { metalness: 0.6, roughness: 0.5 });
    post.add(c.slab(0.14, 3.4, 0.14, iron, 0, 1.7, 0)); const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32), iron); drum.rotation.x = PI / 2; drum.position.y = 3.7; post.add(drum); c.post(X(16.6), -2.6, 0.3);
    const cT = c.canvasTex(256, 256, () => {}), cq = cT.userData.canvas.getContext('2d');
    [0.11, -0.11].forEach((dz, k) => { const f = new THREE.Mesh(new THREE.CircleGeometry(0.44, 32), new THREE.MeshBasicMaterial({ map: cT, toneMapped: false })); f.position.set(0, 3.7, dz); f.rotation.y = k ? PI : 0; post.add(f); });
    const drawClock = (hrs) => { cq.fillStyle = '#f4eedc'; cq.beginPath(); cq.arc(128, 128, 124, 0, 7); cq.fill(); cq.fillStyle = '#1e2a24'; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; cq.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 9, 6, 18); } [[hrs / 12 * PI * 2, 58, 9], [hrs % 1 * PI * 2, 94, 5]].forEach(([a, l, wd]) => { cq.save(); cq.translate(128, 128); cq.rotate(a); cq.fillRect(-wd / 2, -l, wd, l); cq.restore(); }); cq.font = `700 20px ${c.MONO}`; cq.textAlign = 'center'; cq.fillText(hrs % 24 < 12 ? 'A.M.' : 'P.M.', 128, 178); cT.needsUpdate = true; };
    c.clickable(post, () => c.egg('shoreclock', 'Twenty four hours of shore leave, and this clock runs them in sixty seconds. Exactly how it feels to a sailor.'), 'The pier clock');
    // three sailors, one day, no time to waste
    const sailors = c.glb('sailors', { len: 3.0, x: W / 2, z: -3.6, parent: g });
    c.clickable(sailors, () => { c.say(sailors, 'Twenty four hours in New York and we are going to count every block of it. Starting with you.', 3200, 2.2); c.egg('sailors'); }, 'Three sailors');
    // Miss Turnstiles, on a kiosk
    const kiosk = new THREE.Group(); kiosk.position.set(3.6, 0, -1.4); g.add(kiosk); kiosk.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 2.6, 24), std(c, 0x2a3a30, { roughness: 0.6 }))); kiosk.children[0].position.y = 1.3; c.post(X(3.6), -1.4, 0.6);
    const poster = decal(c, 0.8, 1.1, (q, w, h) => { q.fillStyle = '#f4e8c8'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.font = `900 ${w * 0.11}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('MISS TURNSTILES', w / 2, h * 0.12); q.font = `700 ${w * 0.07}px ${c.MONO}`; q.fillStyle = '#222'; q.fillText('FOR THE MONTH', w / 2, h * 0.19); eyeFlower(q, w / 2, h * 0.42, w * 0.2); q.fillStyle = '#2a52be'; q.fillRect(w * 0.38, h * 0.52, w * 0.24, h * 0.3); q.fillStyle = '#222'; q.font = `600 ${w * 0.06}px ${c.MONO}`; q.fillText('LOVES THE ARTS AND', w / 2, h * 0.88); q.fillText('A GOOD COUNT', w / 2, h * 0.94); }, 384);
    poster.position.set(0, 1.5, 0.52); kiosk.add(poster);
    c.clickable(kiosk, () => c.egg('turnstiles', 'Miss Turnstiles for the month. One sailor sees her poster on the subway and spends his whole shore leave hunting her across the city.'), 'A poster');
    // the ship's bell, bollards, sea bags, rings
    const bell = new THREE.Group(); bell.position.set(6.4, 0, 4.6); g.add(bell); bell.add(c.slab(0.08, 2.2, 0.08, iron, -0.4, 1.1, 0)); bell.add(c.slab(0.08, 2.2, 0.08, iron, 0.4, 1.1, 0)); bell.add(c.slab(0.9, 0.08, 0.08, iron, 0, 2.2, 0));
    const bm = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.3], [0.08, 0.3], [0.12, 0.2], [0.14, 0.05], [0.19, 0], [0.18, -0.02]].map(([x, y]) => new THREE.Vector2(x, y)), 24), std(c, 0xd8a840, { metalness: 1, roughness: 0.25, side: THREE.DoubleSide })); bm.position.y = 1.78; bell.add(bm); c.post(X(6.4), 4.6, 0.5);
    let ring = 0; c.clickable(bell, () => { ring = 1; [0, 380].forEach((d) => setTimeout(() => c.sound.clink(880), d)); c.egg('eightbells', 'Eight bells. End of the watch, start of the leave.'); }, 'The ship\'s bell');
    [[2.2, -6.0], [17.8, -6.0], [10, -6.2]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 16), iron); b.position.set(x, 0.3, z); g.add(b); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, PI * 2, 0, PI / 2), iron); cap.position.set(x, 0.6, z); g.add(cap); const rope = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 20), std(c, 0xc8b080, { roughness: 1 })); rope.rotation.x = PI / 2; rope.position.set(x + 0.5, 0.04, z + 0.3); g.add(rope); });
    [[13.0, 4.6], [13.5, 4.9], [12.6, 5.1]].forEach(([x, z], k) => { const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.9, 14), std(c, 0xe8e4d8, { roughness: 0.95 })); bag.position.set(x, 0.45, z); bag.rotation.z = k === 2 ? PI / 2.3 : 0; if (k === 2) bag.position.y = 0.22; g.add(bag); }); c.post(X(13.1), 4.8, 0.6);
    [3.0, 17.0].forEach((x) => c.glb('life_ring', { h: 0.8, x, y: 1.3, z: -D / 2 + 0.25, parent: g, shadow: false }));
    const gulls = [0, 1].map(() => c.glb('gull', { len: 0.8, parent: g, shadow: false }));
    prop(c, r, g, X, 'street_lamp_01', 1.2, -0.6, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'street_lamp_01', 18.8, 6.8, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'wooden_crate_01', 18.2, -5.6, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'wooden_crate_02', 18.6, -4.8, { h: 0.5, y: 0 });
    const lampGlow = [[1.2, -0.6], [18.8, 6.8]].map(([x, z]) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,160,.6)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(x, 4.3, z); s.scale.set(2.4, 2.4, 1); g.add(s); return s; });
    let T = 0, day = 0;
    c.tick((t, dt, P, ri) => {
      gulls.forEach((o, k) => { const a = t * (0.35 + k * 0.1) + k * 3; o.position.set(W / 2 + Math.cos(a) * (6 + k * 2), 6 + Math.sin(t + k) * 0.6, -4 + Math.sin(a) * 3); o.rotation.y = -a; });
      bm.rotation.z = Math.sin(t * 9) * 0.3 * ring; ring *= 0.98;
      if (ri !== r.i) return;
      T += dt; const u = (T % 60) / 60, n = Math.floor(T / 60);
      if (n !== day) { day = n; c.sound.whistle(); c.toast('Six A.M. Shore leave is over. All hands back aboard.', 3200); c.egg('shoreleave', 'A whole day of shore leave, dawn to dawn, gone in a minute. The ship sails at six. It always does.'); }
      let k = 0; while (KEY[k + 1][0] < u) k++; const a = KEY[k], b = KEY[k + 1], f = (u - a[0]) / (b[0] - a[0]);
      sky.copy(ca.setHex(a[1])).lerp(cb.setHex(b[1]), f); const hi = a[2] + (b[2] - a[2]) * f, br = a[3] + (b[3] - a[3]) * f;
      c.scene.background.copy(sky); c.scene.fog.color.copy(sky); c.hemi.intensity = hi; c.scene.environmentIntensity = r.env * hi;
      c.lights[0].userData.i = 16 * hi;
      if (r.plateMesh) r.plateMesh.material.color.copy(white).lerp(sky, 0.4).multiplyScalar(br);
      const sa = u / 0.6 * PI; sun.visible = u < 0.6; sun.position.set(W / 2 - Math.cos(sa) * 70, 18 + Math.sin(sa) * 34, -120);
      const ma = (u - 0.6) / 0.4 * PI; moon.visible = u >= 0.62; moon.position.set(W / 2 - Math.cos(ma) * 60, 26 + Math.sin(ma) * 22, -110);
      const night = u > 0.6 && u < 0.97; stars.material.opacity += ((night ? 0.9 : 0) - stars.material.opacity) * Math.min(1, dt * 2); lampGlow.forEach((s) => { s.visible = u > 0.55 || u < 0.04; });
      drawClock(6 + u * 24);
      sailors.position.x = W / 2 + Math.sin(t * 0.7) * 2.6; sailors.position.y = Math.abs(Math.sin(t * 5)) * 0.06; sailors.rotation.y = Math.sin(t * 1.4) * 0.25;
    });
    g.add(c.slab(PORTAL.w, 1.0, 0.1, std(c, 0x3a3a34, { metalness: 0.4 }), W / 2, 0.5, -D / 2 + 0.4));
  },
});

Object.assign(SLOTS, {
  insideman: () => { const S = [], south = D / 2 - 0.14; [6.2, 8.8, 11.4, 14.0].forEach((x) => S.push({ x, y: 2.1, z: south, ry: PI, w: 1.5 }));
    [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); S.push({ x: W - 0.14, y: 2.1, z: -1.2, ry: -PI / 2, w: 1.2 }); return S; },
  blackswan: () => { const S = [], south = D / 2 - 0.14; [2.2, 17.8].forEach((x) => S.push({ x, y: 2.1, z: south, ry: PI, w: 1.4 }));
    [-6.6, -4.2, -1.8].forEach((z) => { S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }); }); return S; },
});

Object.assign(ROOM, {
  godfather(c, r, g, X) {
    const { THREE } = c;
    // six small tables under checked cloths, and the one in the middle that matters
    const check = c.canvasTex(128, 128, (q) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = (x + y) % 2 ? '#f4eee0' : '#b0201a'; q.fillRect(x * 16, y * 16, 16, 16); } });
    const cloth = new THREE.MeshStandardMaterial({ map: check, roughness: 0.9 }), straw = std(c, 0xc8a050, { roughness: 1 }), glass = std(c, 0x1a3a1a, { roughness: 0.1, metalness: 0.2 });
    const bottle = (x, z, y) => { const b = new THREE.Group(); b.position.set(x, y, z); g.add(b); const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), straw); s.position.y = 0.07; b.add(s); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.18, 10), glass); n.position.y = 0.2; b.add(n); const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), std(c, 0xf4ecd8)); cd.position.y = 0.33; b.add(cd); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), basic(c, 0xffb040)); fl.position.y = 0.38; b.add(fl); return fl; };
    const flames = [];
    const table = (x, z, big) => { const w = big ? 1.1 : 0.8; g.add(c.slab(w, 0.04, w, cloth, x, 0.76, z)); g.add(c.slab(w + 0.02, 0.2, 0.01, cloth, x, 0.66, z + w / 2)); g.add(c.slab(w + 0.02, 0.2, 0.01, cloth, x, 0.66, z - w / 2)); g.add(c.slab(0.06, 0.74, 0.06, std(c, 0x2a1a10), x, 0.37, z)); flames.push(bottle(x, z, 0.78)); c.post(X(x), z, w * 0.6);
      [[0, -w / 2 - 0.25, 0], [0, w / 2 + 0.25, PI]].forEach(([dx, dz, ry]) => prop(c, r, g, X, 'dining_chair_02', x + dx, z + dz, { h: 0.9, ry })); };
    [[3.6, -4.6], [16.4, -4.6], [3.6, 0.4], [16.4, 0.4], [5.4, 4.2], [14.6, 4.2]].forEach(([x, z]) => table(x, z)); const TX = W / 2, TZ = -2.6; table(TX, TZ, true);
    c.tick((t) => flames.forEach((f, k) => { f.scale.setScalar(0.8 + Math.sin(t * 13 + k * 2) * 0.25); }));
    // the two at the table
    const sol = c.glb('wiseguy', { h: 1.82, x: TX - 1.05, z: TZ, ry: PI / 2, parent: g }), cop = c.glb('agent', { h: 1.86, x: TX + 1.05, z: TZ, ry: -PI / 2, parent: g });
    c.clickable(sol, () => { c.say(sol, 'It is strictly business. And the business is counting.', 2800, 2.0); c.egg('strictly'); }, 'The man at the table');
    c.clickable(cop, () => { c.say(cop, 'Say what you have to say. Then eat. The veal is the best in the city.', 2800, 2.1); c.egg('veal'); }, 'The other man at the table');
    const wt = c.glb('maitre', { h: 1.8, x: 17.6, z: -2.2, ry: -1.2, parent: g }); c.post(X(17.6), -2.2, 0.4);
    c.clickable(wt, () => { c.say(wt, 'Table for three? The middle one is taken. It is always taken.', 2600, 2.0); c.egg('waiter'); }, 'The waiter');
    // the walk to the table: the lens closes in, the train gets louder, and then it is right on top of you
    let roared = 0, reached = false;
    r.fov = (P) => { const d = Math.hypot(P.x - X(TX), P.z - TZ); return d < 5.5 ? 38 + (d - 1) / 4.5 * 28 : 66; };
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { reached = false; return; }
      const d = Math.hypot(P.x - X(TX), P.z - TZ), k = Math.max(0, Math.min(1, (6 - d) / 5));
      if (k > 0 && t - roared > 1.4 - k) { roared = t; c.sound.roar(0.1 + k * 0.5); c.shake(0.006 + k * 0.02); }
      if (d < 1.6 && !reached) { reached = true; c.flash(0.5); c.sound.screech(); c.egg('louis', 'The train is so loud nobody hears a thing at the middle table. That is why it was chosen.'); }
    });
    // the restroom at the back, and what is taped behind the cistern
    const tile = std(c, 0xe8e4d8, { roughness: 0.3 });
    g.add(c.slab(0.1, 2.4, 2.1, tile, 18.6, 1.2, 6.9)); c.wall(X(18.6), 5.85, X(18.6), D / 2);
    const door = c.sign('MEN', { w: 0.5, h: 0.18, bg: '#2a1a10', fg: '#f4ead2', font: c.SERIF, weight: 800 }); door.position.set(18.54, 1.9, 6.3); door.rotation.y = -PI / 2; g.add(door);
    const cistern = c.slab(0.5, 0.36, 0.2, std(c, 0xf4f4f0, { roughness: 0.2 }), 19.2, 1.4, D / 2 - 0.25); g.add(cistern); g.add(c.slab(0.4, 0.4, 0.55, std(c, 0xf4f4f0, { roughness: 0.2 }), 19.2, 0.2, D / 2 - 0.55));
    c.clickable(cistern, () => { c.sound.clink(900); c.egg('cistern', 'Behind the cistern, taped where nobody would look: a census form, filled in, signed, counted.'); }, 'The cistern');
    prop(c, r, g, X, 'CashRegister_01', 1.0, -4.6, { h: 0.36, y: 1.05, ry: PI / 2 }); g.add(c.slab(0.8, 1.05, 1.6, std(c, 0x3a2010, { roughness: 0.4 }), 0.8, 0.52, -4.6)); c.post(X(0.8), -4.6, 0.8);
  },

  crowd(c, r, g, X) {
    const { THREE } = c;
    // the desks get smaller toward the back, and so do the clerks: forced perspective, like the set
    const Z0 = 4.4, Z1 = -6.6, ROWS = 9, COLS = 6, sAt = (z) => 1 - (Z0 - z) / (Z0 - Z1) * 0.62;
    const desk = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.06, 0.7).translate(0, 0.74, 0), std(c, 0x8a8a8a, { metalness: 0.5, roughness: 0.4 }), ROWS * COLS);
    const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.72, 0.6).translate(0, 0.36, 0), std(c, 0x6a6a6a, { metalness: 0.5, roughness: 0.5 }), ROWS * COLS);
    const type = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.14, 0.3).translate(0, 0.84, -0.05), std(c, 0x1a1a1a, { roughness: 0.3 }), ROWS * COLS);
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(); let k = 0; const seats = [];
    for (let j = 0; j < ROWS; j++) { const z = Z0 - j * (Z0 - Z1) / (ROWS - 1), s = sAt(z); for (let i = 0; i < COLS; i++) { const x = W / 2 + (i - (COLS - 1) / 2) * 2.6 * s + (i < COLS / 2 ? -0.5 : 0.5) * s; m4.compose(v.set(x, 0, z), q4, sc.set(s, s, s)); desk.setMatrixAt(k, m4); legs.setMatrixAt(k, m4); type.setMatrixAt(k, m4); seats.push([x, z, s]); k++; } }
    [desk, legs, type].forEach((m) => g.add(m));
    // a clerk at every other desk, scaled with it
    const clerks = seats.filter((_, i) => i % 2 === 0).map(([x, z, s], i) => { const e = extra(c, g, x, z + 0.55 * s, { seated: true, col: 0xe8e8e8, ry: PI }); e.scale.setScalar(s); return e; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; clerks.forEach((e, i) => { e.userData.head.rotation.z = Math.sin(t * 6 + i) * 0.05; }); if (Math.random() < dt * 6) c.sound.tick(); });
    // the ceiling grid, converging too
    const panel = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.0, 0.3), basic(c, 0xf4f8ff), ROWS * 4); k = 0;
    for (let j = 0; j < ROWS; j++) { const z = Z0 - j * (Z0 - Z1) / (ROWS - 1), s = sAt(z); for (let i = 0; i < 4; i++) { m4.compose(v.set(W / 2 + (i - 1.5) * 4 * s, H_IN - 0.02 - (1 - s) * 1.6, z), q4.setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), sc.set(s, s, s)); panel.setMatrixAt(k++, m4); } } g.add(panel);
    // walk to the back and you outgrow the room
    let giant = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { if (r.grown) { P.scale = 1; r.grown = false; } return; } r.grown = true; const want = 1 + Math.max(0, Math.min(1, (Z0 - 1 - P.z) / (Z0 - 1 - Z1))) * 0.9; P.scale += (want - P.scale) * Math.min(1, dt * 2); if (P.scale > 1.7 && !giant) { giant = true; c.egg('giant', 'The back rows are smaller, and so are the clerks: the set was built in forced perspective. From back here, you are a giant.'); } });
    // the new clerk, the lift girl, desk 137
    const sims = c.glb('broker', { h: 1.82, x: 1.6, z: 0.8, ry: 0.9, parent: g }); c.post(X(1.6), 0.8, 0.45);
    c.clickable(sims, () => { c.say(sims, 'I am going to be somebody big in this city. For now I am desk one three seven.', 3200, 2.1); c.egg('sims'); }, 'The new clerk');
    const lift = c.glb('workgirl', { h: 1.7, x: 17.2, z: 4.2, ry: -1.2, parent: g }); c.post(X(17.2), 4.2, 0.4);
    c.clickable(lift, () => { c.say(lift, 'One of the crowd? Everybody up here is one of the crowd. That is why I count them.', 3000, 1.9); c.egg('mary'); }, 'The lift operator');
    g.add(c.slab(1.6, 3.0, 0.1, std(c, 0xb0a070, { metalness: 0.8, roughness: 0.3 }), 18.6, 1.5, 6.6)); const ind = c.sign('29', { w: 0.4, h: 0.22, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800 }); ind.position.set(18.6, 3.25, 6.54); ind.rotation.y = PI; g.add(ind);
    const key = new THREE.Group(); key.position.set(seats[2][0], 0.79, seats[2][1]); g.add(key); key.add(c.slab(0.07, 0.01, 0.025, std(c, 0xd8b048, { metalness: 1 }), 0, 0, 0)); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 16), std(c, 0xd8b048, { metalness: 1 })); ring.rotation.x = PI / 2; ring.position.x = -0.05; key.add(ring);
    c.clickable(key, () => c.egg('desk137', 'Desk 137, one of thousands. The camera climbed the skyscraper and found him there in 1928; thirty two years later another film borrowed the shot.'), 'A key on desk 137');
    prop(c, r, g, X, 'metal_office_desk', 1.4, -1.0, { len: 1.6, ry: PI / 2, r: 0.8 }); prop(c, r, g, X, 'desk_lamp_arm_01', 1.4, -1.4, { h: 0.5, y: 0.76 }); prop(c, r, g, X, 'vintage_grandfather_clock_01', 19.3, -2.0, { h: 2.2, ry: -PI / 2, r: 0.4 });
  },

  producers(c, r, g, X) {
    const { THREE } = c;
    // the fountain: walk round it and it answers; the faster you circle, the higher it goes
    const FX = W / 2, FZ = -1.8, R = 2.6, stone = std(c, 0xe0d4b8, { roughness: 0.6 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.22, 10, 64), stone); rim.rotation.x = PI / 2; rim.position.set(FX, 0.45, FZ); g.add(rim);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.45, 64, 1, true), stone); wall.position.set(FX, 0.22, FZ); g.add(wall);
    const water = new THREE.Mesh(new THREE.CircleGeometry(R - 0.1, 64), new THREE.MeshStandardMaterial({ color: 0x1a3a6a, metalness: 0.6, roughness: 0.08, emissive: 0x102040 })); water.rotation.x = -PI / 2; water.position.set(FX, 0.36, FZ); g.add(water);
    c.post(X(FX), FZ, R + 0.2);
    const N = c.MOBILE ? 600 : 1400, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe8b0, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false })); pts.frustumCulled = false; g.add(pts);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,150,.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.set(FX, 1.2, FZ); glow.scale.set(5, 5, 1); g.add(glow);
    let last = null, spin = 0, power = 0.25, burst = false;
    c.tick((t, dt, P, ri) => {
      if (ri === r.i) { const a = Math.atan2(P.z - FZ, P.x - X(FX)), d = Math.hypot(P.z - FZ, P.x - X(FX)); if (last !== null && d < 7) { let da = a - last; if (da > PI) da -= 2 * PI; if (da < -PI) da += 2 * PI; spin += Math.abs(da); } last = a; }
      spin *= Math.pow(0.6, dt); power += (Math.min(1, 0.25 + spin * 0.35) - power) * Math.min(1, dt * 2);
      if (power > 0.95 && !burst && ri === r.i) { burst = true; c.flash(0.4); c.sound.applause(5); c.egg('fountain', 'Round and round the fountain until it goes up like the opening night of a hit. Exactly what was not supposed to happen.'); }
      for (let k = 0; k < N; k++) { life[k] -= dt; if (life[k] <= 0) { const a = Math.random() * PI * 2, rr = Math.random() < 0.3 ? 0 : 0.6 + Math.random() * 1.4; pos[k * 3] = FX + Math.cos(a) * rr; pos[k * 3 + 1] = 0.4; pos[k * 3 + 2] = FZ + Math.sin(a) * rr; const up = (rr === 0 ? 9 : 5.5) * (0.5 + power * 0.9) * (0.85 + Math.random() * 0.3); vel[k * 3] = Math.cos(a) * 0.25; vel[k * 3 + 1] = up; vel[k * 3 + 2] = Math.sin(a) * 0.25; life[k] = up / 9.8 * 2; }
        vel[k * 3 + 1] -= 9.8 * dt; pos[k * 3] += vel[k * 3] * dt; pos[k * 3 + 1] = Math.max(0.38, pos[k * 3 + 1] + vel[k * 3 + 1] * dt); pos[k * 3 + 2] += vel[k * 3 + 2] * dt; }
      pg.attributes.position.needsUpdate = true; glow.material.opacity = 0.4 + power * 0.6;
    });
    const max = c.glb('anchor', { h: 1.84, x: 6.0, z: 1.4, ry: 0.6, parent: g }); c.post(X(6.0), 1.4, 0.45);
    c.clickable(max, () => { c.say(max, 'I want everything I have ever seen in the movies! And I want it counted!', 3000, 2.2); c.egg('bialystock'); }, 'The man with his arms up');
    // the blue blanket, the flop
    prop(c, r, g, X, 'painted_wooden_bench', 14.6, 2.6, { len: 2.0, ry: -0.3, r: 0.6 });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.4), std(c, 0x4a7ac8, { roughness: 1 })); blanket.position.set(14.6, 0.5, 2.6); blanket.rotation.y = 0.4; g.add(blanket);
    c.clickable(blanket, () => { c.say(blanket, 'My blue blanket! Give me my blue blanket!', 2400, 0.8); c.egg('blanket', 'His blue blanket. Do not touch the blue blanket. Fine, you touched the blue blanket.'); }, 'A small blue blanket');
    const flop = decal(c, 1.0, 1.4, (q, w, h) => { q.fillStyle = '#f4e8c8'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.font = `900 ${w * 0.12}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE SUREST', w / 2, h * 0.12); q.fillText('FLOP ON', w / 2, h * 0.22); q.fillText('BROADWAY', w / 2, h * 0.32); eyeFlower(q, w / 2, h * 0.58, w * 0.22); q.fillStyle = '#222'; q.font = `700 ${w * 0.06}px ${c.MONO}`; q.fillText('OPENS AND CLOSES TONIGHT', w / 2, h * 0.9); }, 384);
    const kiosk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 2.4, 20), std(c, 0x2a2a30)); kiosk.position.set(16.8, 1.2, -4.6); g.add(kiosk); flop.position.set(16.8, 1.4, -4.12); g.add(flop); c.post(X(16.8), -4.6, 0.55);
    c.clickable(flop, () => c.egg('flop', 'The plan: raise two million for a sure flop, keep the change. The flaw in the plan: the flop is a hit.'), 'A poster');
    [[2.4, -5.8], [17.6, 5.6], [2.4, 5.6]].forEach(([x, z]) => prop(c, r, g, X, 'street_lamp_02', x, z, { h: 4.0, r: 0.25 }));
  },

  devils(c, r, g, X) {
    const { THREE } = c;
    // the wall behind you is alive. It only moves when you are not looking at it.
    const plaster = std(c, 0xece6da, { roughness: 0.92 }), wz = D / 2 - 0.3;
    g.add(c.slab(W - 1, H_IN - 0.4, 0.3, plaster, W / 2, (H_IN - 0.4) / 2, wz + 0.1));
    const HEAD = c.canvasTex(128, 128, (q, w) => { eyeFlower(q, w / 2, w / 2, w / 2 * 0.95, '#f4f0e8', '#c8c0b0'); const d = q.getImageData(0, 0, w, w); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; d.data[i] = d.data[i + 1] = d.data[i + 2] = 180 + l * 0.3; } q.putImageData(d, 0, 0); });
    const figs = []; const NF = c.MOBILE ? 18 : 30;
    const pose = (f, seed) => { const rr = (k) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; f.position.set(1.4 + rr(1) * (W - 2.8), 0.6 + rr(2) * 4.2, wz - 0.05 - rr(3) * 0.25); f.rotation.set(0, PI, (rr(4) - 0.5) * 2.4); f.userData.armL.rotation.z = (rr(5) - 0.5) * 3; f.userData.armR.rotation.z = (rr(6) - 0.5) * 3; f.userData.legs.rotation.z = (rr(7) - 0.5) * 1.2; };
    for (let k = 0; k < NF; k++) { const f = new THREE.Group(); g.add(f); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.6, 4, 10), plaster); f.add(body);
      const armL = new THREE.Group(); armL.position.set(-0.18, 0.25, 0); f.add(armL); const al = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), plaster); al.position.y = -0.3; armL.add(al);
      const armR = new THREE.Group(); armR.position.set(0.18, 0.25, 0); f.add(armR); const ar = al.clone(); armR.add(ar);
      const legs = new THREE.Group(); legs.position.y = -0.4; f.add(legs); const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.6, 4, 8), plaster); lg.position.y = -0.35; legs.add(lg);
      const hd = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshStandardMaterial({ map: HEAD, transparent: true, alphaTest: 0.2, roughness: 0.9 })); hd.position.set(0, 0.62, -0.06); hd.rotation.y = PI; f.add(hd);
      f.userData = { armL, armR, legs, seed: k * 7.3 }; pose(f, f.userData.seed); figs.push(f); }
    const reacher = figs[0]; let looking = true, changes = 0, reach = 0, said = false;
    const fwd = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      c.camera.getWorldDirection(fwd); const now = fwd.z > 0.25;
      if (now !== looking) { looking = now; if (!now) { figs.forEach((f) => { f.userData.seed += 1 + Math.random() * 3; pose(f, f.userData.seed); }); reach = Math.min(1.6, reach + 0.35); changes++; if (changes === 3 && !said) { said = true; c.egg('livingwall', 'Every time you look away, the wall rearranges itself. And one of them is a little further out of it each time.'); } } }
      reacher.position.set(W / 2, 1.8, wz - 0.1 - reach); reacher.rotation.set(0, PI, 0); reacher.userData.armL.rotation.set(-PI / 2 + 0.3, 0, 0); reacher.userData.armR.rotation.set(-PI / 2 + 0.3, 0, 0);
    });
    c.clickable(reacher, () => { c.sound.drone(); c.egg('reacher', 'You touched the one reaching out of the wall. It was warm.'); }, 'A figure in the wall');
    // the man in the black suit, the fire, the furniture
    const dev = c.glb('agent', { h: 1.86, x: 15.4, z: -4.6, ry: -0.6, parent: g }); c.post(X(15.4), -4.6, 0.45);
    c.clickable(dev, () => { c.say(dev, 'Vanity. Definitely my favourite sin. Second favourite: being counted.', 3000, 2.1); c.egg('vanity'); }, 'The man in the black suit');
    const fp = new THREE.Group(); fp.position.set(0.5, 0, -1.0); fp.rotation.y = PI / 2; g.add(fp); fp.add(c.slab(2.2, 1.6, 0.6, std(c, 0x1a1a1c, { roughness: 0.2 }), 0, 0.8, 0)); fp.add(c.slab(1.4, 0.9, 0.62, basic(c, 0x0a0400), 0, 0.55, 0.01));
    const fire = []; for (let k = 0; k < 7; k++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,120,30,.8)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.position.set(-0.5 + k * 0.16, 0.4, 0.4); fp.add(f); fire.push(f); }
    c.tick((t) => fire.forEach((f, k) => { const s = 0.4 + Math.abs(Math.sin(t * 7 + k * 1.7)) * 0.4; f.scale.set(s, s * 1.5, 1); f.position.y = 0.35 + s * 0.3; }));
    c.clickable(fp, () => c.egg('fireplace', 'The fire never needs a log. Nobody in the building has ever asked where the heat comes from.'), 'The fireplace');
    prop(c, r, g, X, 'modern_arm_chair_01', 3.2, -3.4, { h: 0.85, ry: -2.2, r: 0.45 }); prop(c, r, g, X, 'mid_century_lounge_chair', 3.4, -6.2, { h: 0.9, ry: -1.0, r: 0.5 }); prop(c, r, g, X, 'modern_coffee_table_01', 4.6, -4.8, { len: 1.1, r: 0.5 }); prop(c, r, g, X, 'ceramic_vase_03', 4.6, -4.8, { h: 0.35, y: 0.42 });
    prop(c, r, g, X, 'brass_candleholders', 0.6, -1.0, { h: 0.3, y: 1.6 });
  },

  diehard(c, r, g, X) {
    const { THREE } = c;
    // the riddle at the fountain: a five gallon jug, a three gallon jug, put exactly four on the scale
    const FX = W / 2, FZ = -2.4, stone = std(c, 0xa8a090, { roughness: 0.8 });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 0.6, 48), stone); basin.position.set(FX, 0.3, FZ); g.add(basin); const wtr = new THREE.Mesh(new THREE.CircleGeometry(2.05, 48), new THREE.MeshStandardMaterial({ color: 0x3a6a7a, metalness: 0.5, roughness: 0.1 })); wtr.rotation.x = -PI / 2; wtr.position.set(FX, 0.58, FZ); g.add(wtr); c.post(X(FX), FZ, 2.4);
    const jug = (cap, x) => { const o = new THREE.Group(); o.position.set(x, 0, FZ + 3.7); g.add(o); const h = 0.18 * cap; const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide })); shell.position.y = h / 2; o.add(shell);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 20), new THREE.MeshStandardMaterial({ color: 0x3aa0d8, transparent: true, opacity: 0.8 })); o.add(water); const lab = c.sign(`${cap} GAL`, { w: 0.4, h: 0.14, bg: '#fff', fg: '#111', font: c.MONO, weight: 800 }); lab.position.set(0, h + 0.12, 0); o.add(lab); return { o, cap, h, water, v: 0 }; };
    const J5 = jug(5, FX - 0.8), J3 = jug(3, FX + 0.8);
    const show = () => [J5, J3].forEach((j) => { const f = j.v / j.cap; j.water.visible = f > 0; j.water.scale.y = Math.max(0.001, j.h * f); j.water.position.y = j.h * f / 2; });
    // the briefcase bomb and its clock
    const bT = c.canvasTex(256, 96, () => {}), bq = bT.userData.canvas.getContext('2d'); const brief = new THREE.Group(); brief.position.set(FX + 3.4, 0, FZ + 1.6); g.add(brief);
    prop(c, r, g, X, 'painted_wooden_bench', FX + 3.4, FZ + 1.6, { len: 1.8, ry: -0.5, r: 0.6 }); brief.add(c.slab(0.5, 0.36, 0.14, std(c, 0x2a1a10, { roughness: 0.5 }), 0, 0.68, 0)); const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), new THREE.MeshBasicMaterial({ map: bT, toneMapped: false })); disp.position.set(0, 0.7, 0.075); brief.add(disp); brief.rotation.y = -0.5;
    let T = 180, armed = false, won = false; const drawT = () => { bq.fillStyle = '#100'; bq.fillRect(0, 0, 256, 96); bq.fillStyle = won ? '#40ff60' : '#ff3030'; bq.font = `700 70px ${c.MONO}`; bq.textAlign = 'center'; const s = Math.max(0, Math.ceil(T)); bq.fillText(won ? 'SAFE' : `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`, 128, 74); bT.needsUpdate = true; }; drawT();
    const reset = () => { J5.v = 0; J3.v = 0; show(); T = 180; armed = false; drawT(); };
    // the six moves, as placards on the rim
    const scale = new THREE.Group(); scale.position.set(FX, 0, FZ + 4.7); g.add(scale); scale.add(c.slab(0.7, 0.12, 0.7, std(c, 0x8a8a8a, { metalness: 0.7 }), 0, 0.06, 0)); const sT = c.canvasTex(256, 64, () => {}), sq = sT.userData.canvas.getContext('2d'); const sd = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.13), new THREE.MeshBasicMaterial({ map: sT, toneMapped: false })); sd.position.set(0, 0.5, 0.36); scale.add(sd); scale.add(c.slab(0.06, 0.45, 0.06, std(c, 0x8a8a8a), 0, 0.3, 0.33));
    const drawS = (v) => { sq.fillStyle = '#0a1a0a'; sq.fillRect(0, 0, 256, 64); sq.fillStyle = '#7aff7a'; sq.font = `700 40px ${c.MONO}`; sq.textAlign = 'center'; sq.fillText(v == null ? '-.-- GAL' : `${v.toFixed(2)} GAL`, 128, 46); sT.needsUpdate = true; }; drawS(null);
    const pour = (a, b) => { const m = Math.min(a.v, b.cap - b.v); a.v -= m; b.v += m; };
    const MOVES = [['FILL 5', () => { J5.v = 5; }], ['EMPTY 5', () => { J5.v = 0; }], ['POUR 5 INTO 3', () => pour(J5, J3)], ['FILL 3', () => { J3.v = 3; }], ['EMPTY 3', () => { J3.v = 0; }], ['POUR 3 INTO 5', () => pour(J3, J5)], ['WEIGH THE 5', null]];
    MOVES.forEach(([label, fn], i) => { const s = c.sign(label, { w: 0.9, h: 0.22, bg: fn ? '#f4ead2' : '#c8102e', fg: fn ? '#111' : '#fff', font: c.MONO, weight: 800 }); const a = -PI / 2 + (i - 3) * 0.22; s.position.set(FX + Math.cos(a) * 2.75, 0.95, FZ - Math.sin(a) * 2.75); s.rotation.y = Math.atan2(Math.cos(a), -Math.sin(a)); g.add(s);
      c.clickable(s, () => { if (won) return; armed = true; if (fn) { fn(); show(); c.sound.drip(); drawS(null); return; } drawS(J5.v); if (Math.abs(J5.v - 4) < 1e-6) { won = true; drawT(); c.sound.ding(); c.flash(0.4); c.egg('jugs', 'Four gallons on the scale, to the ounce. Fill the five, pour into the three, empty the three, pour the two across, fill the five, top up the three. The bomb is off.'); setTimeout(() => { won = false; reset(); }, 12000); } else { c.sound.beep(220, 0.1, 0.4); c.toast(`${J5.v} gallons. The scale wants exactly four.`, 2400); } }, label); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i || !armed || won) return; const before = Math.ceil(T); T -= dt; if (Math.ceil(T) !== before) { drawT(); if (T < 30) c.sound.beep(1800, 0.05, 0.05); } if (T <= 0) { c.flash(1); c.shake(0.2); c.sound.boom(0.8); c.toast('Out of time. The jugs are full of water again, and so is everything else. Try again.', 3200); c.egg('kaboom'); reset(); } });
    // the payphone that rings, the two men
    const ph = new THREE.Group(); ph.position.set(16.8, 0, -4.4); ph.rotation.y = -0.8; g.add(ph); ph.add(c.slab(0.08, 1.6, 0.08, std(c, 0x5a5a5a), 0, 0.8, 0)); ph.add(c.slab(0.4, 0.6, 0.25, std(c, 0x7a7a7a, { metalness: 0.6 }), 0, 1.5, 0.1)); c.post(X(16.8), -4.4, 0.35);
    let ringT = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ringT -= dt; if (ringT <= 0) { ringT = 14; [0, 400].forEach((d) => setTimeout(() => c.sound.beep(480, 0.06, 0.3, 'sine'), d)); } });
    c.clickable(ph, () => { c.say(ph, 'Simon says: four gallons, a five and a three. You have three minutes. Starting when you touch a jug.', 3800, 1.9); c.egg('simon'); }, 'The payphone');
    const mc = c.glb('tough', { h: 1.84, x: FX - 3.4, z: FZ + 2.2, ry: 0.8, parent: g }); c.post(X(FX - 3.4), FZ + 2.2, 0.45);
    c.clickable(mc, () => { c.say(mc, 'I hate this job. I hate riddles. Hand me the jug.', 2600, 2.0); c.egg('mcclane'); }, 'The man in the undershirt');
    const zeus = c.glb('cabbie', { h: 1.8, x: FX + 2.6, z: FZ + 3.2, ry: -0.6, parent: g }); c.post(X(FX + 2.6), FZ + 3.2, 0.45);
    c.clickable(zeus, () => { c.say(zeus, 'Four. Not three point nine. Four.', 2400, 2.0); c.egg('zeus'); }, 'The shopkeeper');
    [[2.2, -5.6], [17.8, 5.6]].forEach(([x, z]) => prop(c, r, g, X, 'street_lamp_01', x, z, { h: 4.2, r: 0.25 })); prop(c, r, g, X, 'metal_trash_can', 2.6, 4.6, { h: 0.9, r: 0.35 });
  },
});

Object.assign(ROOM, {
  dundee(c, r, g, X) {
    const { THREE } = c;
    // the mugger's little knife, and then the other one
    const steel = std(c, 0xd8dce0, { metalness: 1, roughness: 0.15 }), wood = std(c, 0x4a2a14, { roughness: 0.6 });
    const knifeMesh = (L) => { const k = new THREE.Group(); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, L * 0.7, L * 0.12), steel); blade.position.y = L * 0.45; k.add(blade); const tip = new THREE.Mesh(new THREE.ConeGeometry(L * 0.06, L * 0.16, 4), steel); tip.position.y = L * 0.88; tip.rotation.y = PI / 4; tip.scale.z = 0.2; k.add(tip); const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, L * 0.22), std(c, 0xb8a060, { metalness: 0.9 })); hilt.position.y = L * 0.1; k.add(hilt); const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L * 0.18, 10), wood); grip.position.y = 0; k.add(grip); return k; };
    const mug = c.glb('hustler', { h: 1.8, x: 12.6, z: -1.8, ry: -1.4, parent: g }); c.post(X(12.6), -1.8, 0.45);
    const small = knifeMesh(0.25); small.position.set(12.1, 1.05, -1.7); small.rotation.z = PI / 2.3; g.add(small);
    const bush = c.glb('auggie', { h: 1.86, x: 9.2, z: -1.6, ry: 1.4, parent: g }); c.post(X(9.2), -1.6, 0.45);
    const big = knifeMesh(1); big.position.set(9.7, 1.1, -1.6); big.rotation.z = -PI / 2.6; big.scale.setScalar(0.01); g.add(big);
    let grow = 0, want = 0, flee = 0;
    c.clickable(mug, () => { c.say(mug, 'Give us your wallet, mate.', 2000, 2.0); c.egg('mugger'); }, 'The kid with a knife');
    c.clickable(bush, () => { if (want) return; want = 1; c.sound.whoosh(0.4, 0.8); c.say(bush, 'That is not a census. THIS is a census.', 3200, 2.1); setTimeout(() => { flee = 1; c.sound.screech(); c.egg('thisisaknife', 'That is not a knife. The kid with the switchblade has left Midtown at a sprint.'); }, 1800); setTimeout(() => { want = 0; flee = 0; mug.position.set(12.6, 0, -1.8); small.visible = true; }, 12000); }, 'The man from the bush');
    c.tick((t, dt) => { grow += (want * 1.8 - grow) * Math.min(1, dt * 2.5); big.scale.setScalar(Math.max(0.01, grow)); if (flee) { mug.position.x = Math.min(19.3, mug.position.x + dt * 6); mug.visible = mug.position.x < 19.2; mug.rotation.y = PI / 2; small.visible = false; } else mug.visible = true; });
    // a crocodile in the sewer, under a grate
    const gx = 6.2, gz = 3.2; const grate = new THREE.Group(); grate.position.set(gx, 0.01, gz); g.add(grate); for (let k = 0; k < 9; k++) grate.add(c.slab(0.05, 0.02, 1.4, std(c, 0x2a2a2a, { metalness: 0.8 }), -0.6 + k * 0.15, 0.01, 0));
    const under = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0x0a1410, roughness: 0.2, metalness: 0.4 })); under.rotation.x = -PI / 2; under.position.set(gx, 0.005, gz); g.add(under);
    const croc = new THREE.Group(); g.add(croc); const cm = std(c, 0x2a3a1a, { roughness: 0.7 }); const cb = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), cm); cb.rotation.z = PI / 2; croc.add(cb); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), basic(c, 0xd8c040)); eye.position.set(0.38, 0.06, 0.04); croc.add(eye); const eye2 = eye.clone(); eye2.position.z = -0.04; croc.add(eye2);
    c.tick((t) => { const u = (t * 0.15) % 1; croc.position.set(gx - 0.6 + u * 1.2, -0.02 + Math.sin(t) * 0.01, gz + Math.sin(t * 0.7) * 0.2); croc.visible = u > 0.05 && u < 0.95; });
    c.clickable(grate, () => { c.sound.drip(); c.egg('sewercroc', 'Everybody in New York has a cousin who saw an alligator in the sewer. This one is a crocodile, and it is counted.'); }, 'A sewer grate');
    steam(c, g, 13.4, 0.1, 3.6); steam(c, g, 4.0, 0.1, -4.2);
    const lady = c.glb('gown', { h: 1.8, x: 15.4, z: -3.0, ry: -0.8, parent: g }); c.post(X(15.4), -3.0, 0.4);
    c.clickable(lady, () => { c.say(lady, 'He has never been to a city. He has already counted everyone on this block.', 2800, 2.1); c.egg('reporter'); }, 'The reporter');
    // the hotel canopy, the doorman's whistle
    const can = new THREE.Group(); can.position.set(17.6, 0, 3.6); g.add(can); can.add(c.slab(2.4, 0.15, 3.6, std(c, 0x1a2a4a, { roughness: 0.5 }), 0, 3.2, 0)); [[-1.1, 1.7], [1.1, 1.7]].forEach(([dx, dz]) => can.add(c.slab(0.06, 3.2, 0.06, std(c, 0xc8a050, { metalness: 1 }), dx, 1.6, dz)));
    const hs = c.sign('N3W YORKERS HOTEL', { w: 2.2, h: 0.3, bg: '#1a2a4a', fg: '#f5c542', font: c.SERIF, weight: 800 }); hs.position.set(0, 3.2, 1.81); can.add(hs);
    prop(c, r, g, X, 'fire_hydrant', 7.4, -4.6, { h: 0.85, r: 0.3 }); prop(c, r, g, X, 'metal_trash_can', 2.4, 4.6, { h: 0.9, r: 0.35 }); prop(c, r, g, X, 'street_lamp_01', 1.4, -1.0, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'water_manhole_cover', 13.4, 3.6, { len: 0.85 });
  },

  dolly(c, r, g, X) {
    const { THREE } = c;
    // bunting across the street
    const flagM = [0xc8102e, 0xf4f4f4, 0x1a3a8a].map((hex) => new THREE.MeshStandardMaterial({ color: hex, side: THREE.DoubleSide, roughness: 0.8 })), tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.18, 0, 0, 0.18, 0, 0, 0, -0.34, 0], 3)); tri.computeVertexNormals();
    const flags = []; for (let row = 0; row < 4; row++) { const z = -6 + row * 3.6; for (let k = 0; k < 26; k++) { const x = 0.4 + k * 0.74, f = new THREE.Mesh(tri, flagM[k % 3]); f.position.set(x, 3.6 - Math.sin(k / 25 * PI) * 0.6, z); g.add(f); flags.push(f); } }
    c.tick((t) => flags.forEach((f, k) => { f.rotation.x = Math.sin(t * 2 + k * 0.4) * 0.25; }));
    // the parade: a column marches up 14th Street and round again. Walk with it, in step.
    const COLS = [0xc8102e, 0x1a3a8a, 0xf4ead2, 0x6a2a6a, 0x2a5a3a, 0xd8a040], marchers = [];
    for (let k = 0; k < (c.MOBILE ? 18 : 30); k++) { const e = extra(c, g, 0, 0, { col: COLS[k % COLS.length] }); const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), std(c, 0xe8d8a0, { roughness: 0.9 })); hat.position.y = 1.98; e.add(hat); e.userData.lane = k % 3; e.userData.off = (k / 3 | 0) * 1.6; marchers.push(e); }
    const dolly = c.glb('loretta', { h: 1.82, parent: g });
    const SPEED = 1.1, LEN = 14, LANES = [12.8, 14.0, 15.2];
    let stepT = 0, on = false, done = false, lastZ = null, vs = 0;
    const NC = 500, cp = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); const conf = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0 })); conf.frustumCulled = false; g.add(conf);
    const col = new THREE.Color(); for (let k = 0; k < NC; k++) { cp[k * 3] = Math.random() * W; cp[k * 3 + 1] = Math.random() * 6; cp[k * 3 + 2] = -7 + Math.random() * 14; col.setHSL(Math.random(), 0.8, 0.6); cc[k * 3] = col.r; cc[k * 3 + 1] = col.g; cc[k * 3 + 2] = col.b; }
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i; if (here !== on) { on = here; c.sound.march(here); }
      const front = 6.8 - ((t * SPEED) % LEN);
      marchers.forEach((e) => { let z = front + e.userData.off; if (z > 7) z -= LEN; e.position.set(LANES[e.userData.lane], Math.abs(Math.sin(t * 5.8 + e.userData.off)) * 0.06, z); e.rotation.y = PI; });
      let dz = 6.8 - ((t * SPEED) % LEN) - 1.6; dolly.position.set(14.0, 0, dz); dolly.rotation.y = PI;
      if (!here) { lastZ = null; return; }
      const inCol = Math.abs(P.x - X(14.0)) < 2.2; if (lastZ !== null && dt > 0) vs += ((lastZ - P.z) / dt - vs) * Math.min(1, dt * 3); lastZ = P.z; const v = vs;
      stepT = inCol && v > SPEED * 0.6 && v < SPEED * 1.9 ? stepT + dt : Math.max(0, stepT - dt * 0.5);
      const k = Math.min(1, stepT / 4); conf.material.opacity = k;
      if (k > 0) { for (let i = 0; i < NC; i++) { cp[i * 3 + 1] -= dt * 1.2; cp[i * 3] += Math.sin(t * 3 + i) * dt * 0.3; if (cp[i * 3 + 1] < 0) cp[i * 3 + 1] = 6; } cg.attributes.position.needsUpdate = true; }
      if (k >= 1 && !done) { done = true; c.sound.applause(4); c.egg('parade', 'In step with the 14th Street Association, four seconds straight. The confetti is for you. Do not get used to it.'); }
    });
    c.clickable(dolly, () => { c.say(dolly, 'Money is like manure: no good unless you spread it around. Same goes for counting.', 3200, 2.2); c.egg('dolly'); }, 'The woman leading the parade');
    // the bass drum, the banner
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 24), std(c, 0xf4f0e0, { roughness: 0.5 })); drum.rotation.z = PI / 2; drum.position.set(2.0, 0.6, -2.4); g.add(drum); const dh = decal(c, 0.8, 0.8, (q, w, h) => { q.fillStyle = '#c8102e'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.36); }); dh.position.set(2.18, 0.6, -2.4); dh.rotation.y = PI / 2; g.add(dh); c.post(X(2.0), -2.4, 0.5);
    c.clickable(drum, () => { c.sound.thud(0.9); c.sound.boom(0.3); c.egg('bassdrum', 'The big drum. The whole parade keeps time off it, and the horses downtown keep time off it too.'); }, 'The bass drum');
    prop(c, r, g, X, 'street_lamp_02', 2.2, 5.6, { h: 4.0, r: 0.25 }); prop(c, r, g, X, 'street_lamp_02', 17.8, -5.6, { h: 4.0, r: 0.25 }); prop(c, r, g, X, 'wooden_barrels_01', 18.2, 6.2, { h: 1.0, r: 0.8 });
  },

  stuart(c, r, g, X) {
    const { THREE } = c;
    // the boat pond: an oval of water, the boats, and yours is number seven. Face where you want it to sail.
    const PX = W / 2, PZ = -1.4, RX = 7.6, RZ = 4.2, stone = std(c, 0xc8c0a8, { roughness: 0.7 });
    const shape = new THREE.Shape(); shape.absellipse(0, 0, RX, RZ, 0, PI * 2); const water = new THREE.Mesh(new THREE.ShapeGeometry(shape, 64), new THREE.MeshStandardMaterial({ color: 0x3a5a6a, metalness: 0.55, roughness: 0.12 })); water.rotation.x = -PI / 2; water.position.set(PX, 0.05, PZ); g.add(water);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 96), stone); rim.scale.set(RX + 0.15, RZ + 0.15, 6); rim.rotation.x = PI / 2; rim.position.set(PX, 0.2, PZ); g.add(rim);
    for (let k = 0; k < 40; k++) { const a = k / 40 * PI * 2, a2 = (k + 1) / 40 * PI * 2; c.wall(X(PX + Math.cos(a) * (RX + 0.2)), PZ + Math.sin(a) * (RZ + 0.2), X(PX + Math.cos(a2) * (RX + 0.2)), PZ + Math.sin(a2) * (RZ + 0.2)); }
    const SAIL = ['#ffffff', '#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#2ee88a', '#c8102e'];
    const boats = SAIL.map((s, k) => { const b = new THREE.Group(); g.add(b); const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), std(c, k === 6 ? 0xc8102e : 0x3a2a1a, { roughness: 0.4 })); hull.rotation.z = PI / 2; hull.scale.set(1, 1, 0.6); b.add(hull); b.add(c.slab(0.012, 0.7, 0.012, std(c, 0xd8c8a0), 0, 0.4, 0));
      const sail = decal(c, 0.38, 0.6, (q, w, h) => { q.fillStyle = s; q.beginPath(); q.moveTo(2, h - 2); q.lineTo(w - 2, h - 2); q.lineTo(2, 2); q.fill(); q.fillStyle = '#111'; q.font = `900 ${w * 0.35}px ${c.SERIF}`; q.fillText(String(k + 1), w * 0.12, h * 0.8); }); sail.position.set(0.19, 0.42, 0.01); b.add(sail); const sail2 = sail.clone(); sail2.rotation.y = PI; sail2.position.z = -0.01; b.add(sail2);
      return { b, x: PX - RX + 1.2, z: PZ - 2.6 + k * 0.85, sp: 0.5 + Math.random() * 0.3, mine: k === 6 }; });
    const finish = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 10), basic(c, 0xf5c542)); finish.position.set(PX + RX - 1.0, 0.3, PZ); g.add(finish);
    let race = false, won = false, fw = new THREE.Vector3();
    const place = () => boats.forEach((o, k) => { o.x = PX - RX + 1.2; o.z = PZ - 2.6 + k * 0.85; });
    c.tick((t, dt, P, ri) => {
      boats.forEach((o, k) => {
        if (race && ri === r.i) { if (o.mine) { c.camera.getWorldDirection(fw); const L = Math.hypot(fw.x, fw.z) || 1; o.x += fw.x / L * dt * 1.1; o.z += fw.z / L * dt * 1.1; o.b.rotation.y = Math.atan2(-fw.z, fw.x); } else { o.x += dt * o.sp * (0.8 + Math.sin(t + k) * 0.3); o.z += Math.sin(t * 0.8 + k * 2) * dt * 0.2; o.b.rotation.y = 0; } }
        const nx = (o.x - PX) / (RX - 0.4), nz = (o.z - PZ) / (RZ - 0.4), d = Math.hypot(nx, nz); if (d > 1) { o.x = PX + nx / d * (RX - 0.4); o.z = PZ + nz / d * (RZ - 0.4); }
        o.b.position.set(o.x, 0.08 + Math.sin(t * 2 + k) * 0.02, o.z); o.b.rotation.z = Math.sin(t * 1.5 + k) * 0.08;
        if (race && Math.hypot(o.x - finish.position.x, o.z - finish.position.z) < 0.8) { race = false; if (o.mine) { won = true; c.sound.applause(3); c.egg('regatta', 'Number seven first across Conservatory Water, sailed by looking where you wanted to go. That is the whole trick to sailing.'); } else c.toast(`Number ${k + 1} wins. Click your boat to race again.`, 2600); setTimeout(place, 2500); }
      });
    });
    c.clickable(boats[6].b, () => { if (race) return; place(); race = true; c.sound.whistle(); c.toast('Race on. Your red boat sails wherever you look. Aim for the gold post.', 3200); }, 'Your boat, number seven');
    // the ducks, the bronze mushroom, the families on the rim
    const ducks = []; for (let k = 0; k < 5; k++) { const d = new THREE.Group(); g.add(d); const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), std(c, 0x6a5a3a)); b.scale.set(1.4, 0.8, 1); d.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), std(c, 0x1a5a2a)); h.position.set(0.12, 0.08, 0); d.add(h); ducks.push(d); c.clickable(d, () => { c.sound.beep(380, 0.08, 0.15, 'sawtooth'); c.egg('duck', 'A mallard, unimpressed by your boat.'); }, 'A duck'); }
    c.tick((t) => ducks.forEach((d, k) => { const a = t * 0.15 + k * 1.3; d.position.set(PX + Math.cos(a) * (RX - 1.5) * 0.7, 0.07, PZ + Math.sin(a) * (RZ - 1.2) * 0.7); d.rotation.y = -a - PI / 2; }));
    const brz = std(c, 0x7a5a30, { metalness: 0.9, roughness: 0.35 }); const mush = new THREE.Group(); mush.position.set(2.0, 0, -5.8); g.add(mush); [[0, 1.0, 0.6], [0.5, 0.6, 0.35], [-0.45, 0.5, 0.3]].forEach(([dx, h, rr]) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.25, rr * 0.3, h, 12), brz); st.position.set(dx, h / 2, 0); mush.add(st); const cap = new THREE.Mesh(new THREE.SphereGeometry(rr, 16, 10, 0, PI * 2, 0, PI / 2), brz); cap.position.set(dx, h, 0); mush.add(cap); }); c.post(X(2.0), -5.8, 0.8);
    c.clickable(mush, () => c.egg('alice', 'Bronze mushrooms by the pond, from the Alice statue at the north end. Children have polished them smooth since 1959.'), 'Bronze mushrooms');
    [[3.0, 4.4], [5.4, 4.8], [14.6, 4.8], [17.0, 4.4]].forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: [0xc8102e, 0x2a5a8a, 0xd8a040, 0x2a6a3a][k], ry: PI }); e.scale.setScalar(k % 2 ? 0.65 : 1); c.post(X(x), z, 0.3); });
    prop(c, r, g, X, 'painted_wooden_bench', 10, 6.4, { len: 2.0, ry: PI, r: 0.6 }); prop(c, r, g, X, 'street_lamp_02', 1.6, 6.6, { h: 4.0, r: 0.25 }); prop(c, r, g, X, 'street_lamp_02', 18.4, 6.6, { h: 4.0, r: 0.25 });
  },

  sweetsmell(c, r, g, X) {
    const { THREE } = c;
    // the billboard that blows real smoke rings, every four seconds, over the street
    const bb = new THREE.Group(); bb.position.set(W - 0.5, 3.9, -2.6); bb.rotation.y = -PI / 2; g.add(bb);
    const face = decal(c, 3.2, 2.2, (q, w, h) => { q.fillStyle = '#d8d8d8'; q.fillRect(0, 0, w, h); eyeFlower(q, w * 0.42, h * 0.42, h * 0.38, '#f4f4f4', '#8a8a8a'); q.fillStyle = '#222'; q.beginPath(); q.ellipse(w * 0.42, h * 0.86, w * 0.05, h * 0.04, 0, 0, 7); q.fill(); q.font = `900 ${h * 0.12}px ${c.SERIF}`; q.fillText('N3W YORKERS', w * 0.64, h * 0.3); q.font = `600 ${h * 0.07}px ${c.MONO}`; q.fillText('BLOW YOUR OWN', w * 0.64, h * 0.45); q.fillText('RING', w * 0.64, h * 0.54); }, 512);
    bb.add(face); bb.add(c.slab(3.4, 2.4, 0.1, std(c, 0x1a1a1a), 0, 0, -0.06));
    const mouth = new THREE.Vector3(); const rings = []; const rm = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, transparent: true, opacity: 0, depthWrite: false });
    for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 10, 32), rm.clone()); g.add(m); rings.push({ m, t: -1 }); }
    let next = 0, through = false; const rp = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      next -= dt; if (next <= 0) { next = 4; const o = rings.find((q) => q.t < 0); if (o) { o.t = 0; if (ri === r.i) c.sound.whoosh(0.08, 1.5); } }
      rings.forEach((o) => { if (o.t < 0) return; o.t += dt; const u = o.t / 9; if (u > 1) { o.t = -1; o.m.material.opacity = 0; return; }
        o.m.position.set(W - 0.8 - u * 17, 2.4 - u * 0.8 + Math.sin(o.t) * 0.1, -2.6 + u * 3.6); o.m.rotation.set(0, PI / 2 + Math.sin(o.t * 0.5) * 0.3, 0); o.m.scale.setScalar(1 + u * 2.2); o.m.material.opacity = 0.75 * (1 - u) * Math.min(1, o.t * 3);
        if (ri === r.i && !through) { o.m.getWorldPosition(rp); if (Math.hypot(rp.x - P.x, rp.y - P.y, rp.z - P.z) < 0.35 * o.m.scale.x) { through = true; c.flash(0.2); c.egg('smokering', 'Straight through a smoke ring. The real billboard on Times Square puffed steam rings like this every few seconds, all night, for years.'); } } });
    });
    // marquee bulbs, rain, a Checker cab
    const mq = new THREE.Group(); mq.position.set(0.4, 3.6, -2.0); mq.rotation.y = PI / 2; g.add(mq); mq.add(c.slab(4.4, 1.0, 0.4, std(c, 0x1a1a1a), 0, 0, 0)); const mt = c.sign('N3W YORKERS THEATRE  ·  TONIGHT', { w: 4.0, h: 0.5, bg: '#f4f4f4', fg: '#111', font: c.SERIF, weight: 800 }); mt.position.z = 0.21; mq.add(mt);
    bulbs(c, mq, -2.1, 2.1, 0.45, 0.22, 24); bulbs(c, mq, -2.1, 2.1, -0.45, 0.22, 24);
    const NR = c.MOBILE ? 500 : 1200, rp2 = new Float32Array(NR * 6); for (let k = 0; k < NR; k++) { const x = Math.random() * W, y = Math.random() * 6, z = -7.5 + Math.random() * 15; rp2.set([x, y, z, x, y - 0.25, z], k * 6); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp2, 3)); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8c8c8, transparent: true, opacity: 0.35 })); rain.frustumCulled = false; g.add(rain);
    c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 1) return; for (let k = 0; k < NR; k++) { let y = rp2[k * 6 + 1] - dt * 9; if (y < 0) y += 6; rp2[k * 6 + 1] = y; rp2[k * 6 + 4] = y - 0.25; } rg.attributes.position.needsUpdate = true; });
    c.glb('checker', { len: 5, x: 14.2, z: 3.4, ry: 0.2, parent: g }); c.post(X(14.2), 3.4, 1.3);
    const col = c.glb('hijacker', { h: 1.84, x: 6.4, z: -1.4, ry: 0.4, parent: g }); c.post(X(6.4), -1.4, 0.45);
    c.clickable(col, () => { c.say(col, 'Count me, Sidney.', 2000, 2.1); c.egg('countme'); }, 'The columnist');
    const stand = new THREE.Group(); stand.position.set(3.6, 0, 4.4); g.add(stand); stand.add(c.slab(1.4, 1.0, 0.7, std(c, 0x3a3a3a), 0, 0.5, 0)); for (let k = 0; k < 6; k++) { const p = c.slab(0.3, 0.02, 0.4, std(c, 0xe8e8e0), -0.5 + k * 0.2, 1.02 + k * 0.004, 0); p.rotation.y = (k % 2 - 0.5) * 0.2; stand.add(p); } c.post(X(3.6), 4.4, 0.8);
    c.clickable(stand, () => c.egg('column', 'The morning column: sixty million readers, and one man who decides which name goes in it. Tonight it is yours.'), 'A newsstand');
    prop(c, r, g, X, 'street_lamp_01', 1.4, 5.8, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'fire_hydrant', 9.0, 5.2, { h: 0.85, r: 0.3 });
  },

  scent(c, r, g, X) {
    const { THREE } = c;
    // the tango: lit footprints on the parquet, slow, slow, quick quick, slow. Stand on each while it is lit.
    const STEPS = [[9, 3.6, 1], [9, 2.2, 1], [10.2, 1.6, 0.5], [11.2, 1.0, 0.5], [11.2, -0.4, 1], [10, -1.0, 1], [8.8, -0.4, 0.5], [8.2, 0.8, 0.5], [9, 2.0, 1], [10.6, 2.6, 1], [11.6, 3.2, 0.5], [12.4, 3.8, 1]];
    const prints = STEPS.map(([x, z], k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.6), new THREE.MeshBasicMaterial({ map: c.canvasTex(64, 112, (q) => { q.fillStyle = '#ffffff'; q.beginPath(); q.ellipse(32, 36, 22, 32, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(32, 92, 16, 18, 0, 0, 7); q.fill(); }), transparent: true, opacity: 0.12, color: 0xf5c542, depthWrite: false, toneMapped: false })); m.rotation.x = -PI / 2; m.rotation.z = k % 2 ? 0.2 : -0.2; m.position.set(x, 0.015, z); g.add(m); return m; });
    let i = 0, beat = 0, hits = 0, playing = false, best = 0;
    const couple = new THREE.Group(); couple.position.set(14.4, 0, -3.0); g.add(couple); const col = c.glb('maitre', { h: 1.82, x: 0.3, z: 0, ry: -PI / 2, parent: couple }), her = c.glb('gown', { h: 1.74, x: -0.3, z: 0, ry: PI / 2, parent: couple }); c.post(X(14.4), -3.0, 0.8);
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i; if (here !== playing) { playing = here; c.sound.tango(here); }
      couple.rotation.y = t * (0.5 + Math.min(hits, 8) * 0.12); couple.position.y = Math.abs(Math.sin(t * 2.8)) * 0.03;
      if (!here) return;
      beat += dt; const dur = STEPS[i][2] * 0.9; prints.forEach((m, k) => { m.material.opacity = k === i ? 0.9 : k < i ? 0.3 : 0.1; });
      const d = Math.hypot(P.x - X(STEPS[i][0]), P.z - STEPS[i][1]);
      if (d < 0.5) { hits++; i++; beat = 0; c.sound.note(440 * Math.pow(1.06, hits % 12), 0.1); best = Math.max(best, hits); if (i >= STEPS.length) { i = 0; c.flash(0.3); c.sound.applause(3); c.egg('tango', 'Twelve steps of tango, in time, without a single mistake. If you get tangled up, you just count on.'); hits = 0; } }
      else if (beat > dur * 2.2 && i > 0) { i = 0; hits = 0; beat = 0; c.toast('Lost the beat. Back to the first light.', 1600); }
    });
    [col, her].forEach((o) => c.clickable(o, () => { c.say(col, 'If you make a mistake and get tangled up, just count on. Hoo ah.', 3000, 2.1); c.egg('colonel'); }, 'The colonel and his partner'));
    // tables, candles, the band stand
    const cloth = std(c, 0xf8f4ea, { roughness: 0.9 }); const flames = [];
    [[2.6, -4.4], [2.6, -0.6], [3.4, 6.6], [16.6, 6.6], [17.4, -0.6], [6.4, 6.6], [13.6, 6.6]].forEach(([x, z]) => { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.76, 24), cloth); tb.position.set(x, 0.38, z); g.add(tb); c.post(X(x), z, 0.65); const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), std(c, 0xf4ecd8)); cd.position.set(x, 0.85, z); g.add(cd); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,190,90,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.position.set(x, 0.98, z); f.scale.set(0.3, 0.3, 1); g.add(f); flames.push(f); [[0.85, 0], [-0.85, 0]].forEach(([dx, dz]) => prop(c, r, g, X, 'dining_chair_02', x + dx, z + dz, { h: 0.9, ry: dx > 0 ? -PI / 2 : PI / 2 })); });
    c.tick((t) => flames.forEach((f, k) => f.scale.setScalar(0.26 + Math.sin(t * 11 + k * 3) * 0.04)));
    const band = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 1.6), std(c, 0x3a1a0a, { roughness: 0.5 })); band.position.set(W / 2, 0.15, -6.2); g.add(band);
    const bando = new THREE.Group(); bando.position.set(W / 2 - 1.2, 0.3, -6.2); g.add(bando); bando.add(extra(c, bando, 0, 0, { seated: true, col: 0x111111 })); const box = c.slab(0.36, 0.22, 0.2, std(c, 0x111111, { roughness: 0.3 }), 0, 0.8, 0.3); bando.add(box);
    c.tick((t) => { box.scale.x = 1 + Math.sin(t * 3.5) * 0.35; });
    c.clickable(bando, () => { c.egg('bandoneon', 'The bandoneon: a German squeezebox built for church music, adopted by Buenos Aires for the tango. Seventy one buttons, none of them labelled.'); }, 'The bandoneon player');
    prop(c, r, g, X, 'Chandelier_02', W / 2, -1.0, { h: 1.3, y: 4.6 }); prop(c, r, g, X, 'Chandelier_02', W / 2, 4.6, { h: 1.3, y: 4.6 });
  },
});

Object.assign(SLOTS, {
  devils: () => { const S = []; [-6.6, -4.2].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
});

Object.assign(ROOM, {
  splash(c, r, g, X) {
    const { THREE } = c;
    // the tank: walk in and you are under water. Slower, lighter, blue, and the light moves on everything.
    const tx1 = 5.4, tx2 = 14.6, tz1 = -5.6, tz2 = -0.8, TH = 3.2, glassM = new THREE.MeshPhysicalMaterial({ color: 0xc8f0ff, transparent: true, opacity: 0.18, roughness: 0.02, side: THREE.DoubleSide, depthWrite: false });
    const steel = std(c, 0x8a9aa0, { metalness: 0.8, roughness: 0.3 });
    [[tx1, tz1, tx2, tz1], [tx1, tz1, tx1, tz2], [tx2, tz1, tx2, tz2]].forEach(([a, b, cc, d]) => { const w = Math.hypot(cc - a, d - b), m = new THREE.Mesh(new THREE.PlaneGeometry(w, TH), glassM); m.position.set((a + cc) / 2, TH / 2, (b + d) / 2); m.rotation.y = a === cc ? PI / 2 : 0; g.add(m); });
    [[tx1, W / 2 - 1.2], [W / 2 + 1.2, tx2]].forEach(([a, b]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, TH), glassM); m.position.set((a + b) / 2, TH / 2, tz2); g.add(m); });
    for (const [x, z] of [[tx1, tz1], [tx2, tz1], [tx1, tz2], [tx2, tz2], [W / 2 - 1.2, tz2], [W / 2 + 1.2, tz2]]) g.add(c.slab(0.12, TH + 0.1, 0.12, steel, x, (TH + 0.1) / 2, z));
    g.add(c.slab(tx2 - tx1, 0.1, 0.12, steel, W / 2, TH + 0.05, tz2)); g.add(c.slab(tx2 - tx1, 0.1, 0.12, steel, W / 2, TH + 0.05, tz1));
    c.wall(X(tx1), tz2, X(W / 2 - 1.2), tz2); c.wall(X(W / 2 + 1.2), tz2, X(tx2), tz2); c.wall(X(tx1), tz1, X(tx1), tz2); c.wall(X(tx2), tz1, X(tx2), tz2);
    const water = new THREE.Mesh(new THREE.BoxGeometry(tx2 - tx1 - 0.1, TH - 0.3, tz2 - tz1 - 0.1), new THREE.MeshStandardMaterial({ color: 0x2a8ab0, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false, side: THREE.BackSide })); water.position.set(W / 2, (TH - 0.3) / 2, (tz1 + tz2) / 2); g.add(water);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(tx2 - tx1 - 0.1, tz2 - tz1 - 0.1), new THREE.MeshStandardMaterial({ color: 0x6ac8e8, transparent: true, opacity: 0.45, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.05 })); surf.rotation.x = -PI / 2; surf.position.set(W / 2, TH - 0.3, (tz1 + tz2) / 2); g.add(surf);
    // bubbles
    const NB = 260, bp = new Float32Array(NB * 3); for (let k = 0; k < NB; k++) { bp[k * 3] = tx1 + 0.3 + Math.random() * (tx2 - tx1 - 0.6); bp[k * 3 + 1] = Math.random() * (TH - 0.3); bp[k * 3 + 2] = tz1 + 0.3 + Math.random() * (tz2 - tz1 - 0.6); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); const bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xe8ffff, size: 0.05, transparent: true, opacity: 0.7 })); bubbles.frustumCulled = false; g.add(bubbles);
    // the mermaid, built here: an eye flower, a body, a long green tail
    const mer = new THREE.Group(); g.add(mer); const skin = std(c, 0xe8c0a8, { roughness: 0.6 }), scale = std(c, 0x1a8a6a, { roughness: 0.25, metalness: 0.4 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.4, 4, 10), skin); torso.position.y = 0.5; mer.add(torso);
    const tail = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.9], [0.06, -0.85], [0.14, -0.5], [0.17, -0.1], [0.16, 0.2], [0, 0.25]].map(([x, y]) => new THREE.Vector2(x, y)), 16), scale); mer.add(tail);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.3, 3), scale); fin.position.y = -1.0; fin.rotation.z = PI; fin.scale.z = 0.2; mer.add(fin);
    const hd = decal(c, 0.6, 0.6, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.95)); hd.position.y = 1.0; mer.add(hd);
    mer.rotation.z = PI / 2;
    c.tick((t) => { const a = t * 0.35; mer.position.set(W / 2 + Math.cos(a) * 3.2, 1.4 + Math.sin(t * 0.9) * 0.4, -3.2 + Math.sin(a) * 1.4); mer.rotation.y = -a; tail.rotation.x = Math.sin(t * 3) * 0.25; fin.rotation.x = Math.sin(t * 3 + 0.6) * 0.4;
      for (let k = 0; k < NB; k++) { bp[k * 3 + 1] += 0.004 + (k % 5) * 0.001; if (bp[k * 3 + 1] > TH - 0.3) bp[k * 3 + 1] = 0; } bg.attributes.position.needsUpdate = true; });
    c.clickable(mer, () => { c.sound.note(880, 0.15); c.egg('madison', 'She named herself after a street sign on Madison Avenue. Now she is counted under it.'); }, 'The mermaid');
    // under water: the screen, the speed, the float
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:7;opacity:0;transition:opacity .6s;mix-blend-mode:multiply;background:radial-gradient(ellipse at 50% 30%,#bfefff 0%,#2a8ab0 70%,#0a3a5a 100%)'; document.body.appendChild(ov);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;opacity:0;transition:opacity .6s;mix-blend-mode:screen'; document.body.appendChild(cv); const cq = cv.getContext('2d');
    let under = false, dove = false;
    c.tick((t, dt, P, ri) => {
      const lx = P.x - r.x0, inTank = ri === r.i && lx > tx1 && lx < tx2 && P.z > tz1 && P.z < tz2;
      if (inTank !== under) { under = inTank; ov.style.opacity = cv.style.opacity = under ? 0.85 : 0; P.speed = under ? 0.55 : 1; if (under) { c.sound.whoosh(0.3, 1.2); if (!dove) { dove = true; c.egg('underwater', 'Under water in the tank: slower, lighter, bluer. She has been living like this the whole time.'); } } }
      if (under) { P.lift = 0.25 + Math.sin(t * 1.2) * 0.12; cq.clearRect(0, 0, 256, 256); cq.strokeStyle = 'rgba(200,255,255,.35)'; cq.lineWidth = 3; for (let k = 0; k < 14; k++) { cq.beginPath(); for (let x = 0; x <= 256; x += 16) { const y = k * 20 + Math.sin(x * 0.05 + t * 2 + k) * 8 + Math.sin(x * 0.11 - t * 1.3) * 5; x ? cq.lineTo(x, y) : cq.moveTo(x, y); } cq.stroke(); } if (Math.random() < dt * 2) c.sound.drip(); }
    });
    r.holdLift = false;
    // the scientist, the lobster, the lab
    const sci = c.glb('agent', { h: 1.86, x: 16.8, z: 1.4, ry: -2.2, parent: g }); c.post(X(16.8), 1.4, 0.45);
    c.clickable(sci, () => { c.say(sci, 'I just need one test to prove she is real. One test, and a census form.', 2800, 2.1); c.egg('kornbluth'); }, 'The scientist');
    prop(c, r, g, X, 'metal_office_desk', 2.0, -4.0, { len: 1.6, ry: PI / 2, r: 0.8 }); prop(c, r, g, X, 'classic_laptop', 2.0, -4.4, { len: 0.35, y: 0.76, ry: PI / 2 }); prop(c, r, g, X, 'desk_lamp_arm_01', 2.0, -3.4, { h: 0.5, y: 0.76 });
    prop(c, r, g, X, 'WoodenTable_02', 15.6, 4.6, { len: 1.2, r: 0.6 }); const lob = new THREE.Group(); lob.position.set(15.6, 0.78, 4.6); g.add(lob); lob.add(c.slab(0.36, 0.015, 0.36, std(c, 0xf4f4f0), 0, 0, 0)); const lb = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), std(c, 0xc8301a, { roughness: 0.4 })); lb.rotation.z = PI / 2; lb.position.y = 0.05; lob.add(lb); [-1, 1].forEach((s2) => { const cl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), std(c, 0xc8301a)); cl.position.set(0.18, 0.05, s2 * 0.08); cl.scale.set(1.5, 0.7, 1); lob.add(cl); });
    c.clickable(lob, () => c.egg('lobster', 'A whole lobster, eaten shell and all at a very good restaurant. Nobody at the next table said a word.'), 'A lobster');
    prop(c, r, g, X, 'steel_frame_shelves_03', 18.8, -5.4, { h: 2.0, ry: -PI / 2 }); prop(c, r, g, X, 'korean_fire_extinguisher_01', 0.5, 0.9, { h: 0.55 });
  },

  afterhours(c, r, g, X) {
    const { THREE } = c;
    // the night that will not let you go home: the far door brings you back to the start, twice
    let tries = 0, freed = false;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (P.x < r.x0) tries = 0; return; }
      const lx = P.x - r.x0;
      if (lx > W - 0.9 && P.z > DZ1 && P.z < DZ2 && tries < 2) { tries++; P.x = r.x0 + 1.2; c.flash(0.6); c.sound.whoosh(0.3, 0.8); c.toast(tries === 1 ? 'Spring Street again. It is still three in the morning.' : 'Spring Street again. One more try. The token machine is broken, but the door might not be.', 3000); if (tries === 2 && !freed) { freed = true; c.egg('afterhours', 'Twice out the door and twice back on Spring Street. A night in SoHo that will not let you go home. The third time it does.'); } }
    });
    // the bagel paperweights
    prop(c, r, g, X, 'WoodenTable_01', 4.4, -3.6, { len: 1.4, r: 0.7 }); const bagels = new THREE.Group(); bagels.position.set(4.4, 0.78, -3.6); g.add(bagels);
    for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, 10, 20), std(c, 0xc89858, { roughness: 0.8 })); b.rotation.x = PI / 2; b.position.set(-0.45 + (k % 4) * 0.3, 0.035, -0.15 + (k >> 2) * 0.3); bagels.add(b); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 14), std(c, 0xf8f4e8, { roughness: 0.6 })); cr.position.set(b.position.x, 0.065, b.position.z); bagels.add(cr); }
    c.clickable(bagels, () => c.egg('bagels', 'Plaster bagels with plaster cream cheese. Paperweights, sold by a sculptor in a loft on Spring Street. Do not bite one.'), 'Bagel paperweights');
    // the ice cream truck, parked, its tune never stops
    const truck = new THREE.Group(); truck.position.set(15.8, 0, -3.2); truck.rotation.y = 0.15; g.add(truck); truck.add(c.slab(2.0, 2.2, 4.2, std(c, 0xf4f4f0, { roughness: 0.4 }), 0, 1.3, 0)); truck.add(c.slab(2.02, 0.3, 4.22, std(c, 0x2a5ac8), 0, 0.5, 0));
    const cone = decal(c, 1.4, 1.8, (q, w, h) => { q.fillStyle = '#d8a050'; q.beginPath(); q.moveTo(w * 0.3, h * 0.45); q.lineTo(w * 0.7, h * 0.45); q.lineTo(w / 2, h * 0.98); q.fill(); eyeFlower(q, w / 2, h * 0.3, w * 0.3, '#fff0f4', '#ff7aa8'); }); cone.position.set(-1.02, 1.6, 0.4); cone.rotation.y = -PI / 2; truck.add(cone);
    const tl = c.sign('N3W YORKERS ICE CREAM', { w: 3.6, h: 0.32, bg: '#2a5ac8', fg: '#fff', font: c.SERIF, weight: 800 }); tl.position.set(-1.02, 2.2, 0); tl.rotation.y = -PI / 2; truck.add(tl);
    [[-1, -1.4], [1, -1.4], [-1, 1.4], [1, 1.4]].forEach(([dx, dz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16), std(c, 0x111111)); w.rotation.z = PI / 2; w.position.set(dx, 0.38, dz); truck.add(w); }); c.post(X(15.8), -3.2, 1.6); c.post(X(15.8), -4.8, 1.2); c.post(X(15.8), -1.6, 1.2);
    let tune = 0; c.clickable(truck, () => { const N = [523.3, 659.3, 784, 659.3, 698.5, 587.3, 523.3]; N.forEach((f, k) => setTimeout(() => c.sound.note(f, 0.12), k * 220)); if (++tune === 1) c.egg('icecream', 'An ice cream truck playing its tune at three in the morning, on a street where nobody is buying.'); }, 'The ice cream truck');
    // the crowd that follows you, with flashlights
    const mob = []; for (let k = 0; k < 7; k++) { const e = extra(c, g, 2 + k * 0.6, 6, { col: [0x2a2a34, 0x3a2a2a, 0x1a1a1a][k % 3] }); const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,240,200,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.position.set(0.25, 1.1, 0.3); fl.scale.set(0.5, 0.5, 1); e.add(fl); mob.push(e); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; mob.forEach((e, k) => { const tx = P.x - r.x0 + Math.cos(k * 0.9) * (3.5 + k * 0.3), tz = P.z + 2.5 + Math.sin(k * 1.3) * 1.5; e.position.x += (Math.max(1, Math.min(19, tx)) - e.position.x) * Math.min(1, dt * 0.35); e.position.z += (Math.max(-6.5, Math.min(7.2, tz)) - e.position.z) * Math.min(1, dt * 0.35); e.rotation.y = Math.atan2(P.x - r.x0 - e.position.x, P.z - e.position.z); }); });
    const punk = c.glb('susan', { h: 1.74, x: 7.2, z: 2.0, ry: 0.6, parent: g }); c.post(X(7.2), 2.0, 0.4);
    c.clickable(punk, () => { c.say(punk, 'Different rules apply this late at night. Starting with: everybody counts.', 2800, 2.0); c.egg('kiki'); }, 'A woman at the club door');
    const paul = c.glb('broker', { h: 1.82, x: 11.6, z: 3.2, ry: -0.4, parent: g }); c.post(X(11.6), 3.2, 0.45);
    c.clickable(paul, () => { c.say(paul, 'I just want to go home. I had forty dollars. It blew out of the cab window.', 2800, 2.1); c.egg('paul'); }, 'A man in a suit');
    steam(c, g, 9.6, 0.1, -1.0); prop(c, r, g, X, 'water_manhole_cover', 9.6, -1.0, { len: 0.85 }); prop(c, r, g, X, 'street_lamp_01', 1.4, -1.2, { h: 4.4, r: 0.25 }); prop(c, r, g, X, 'metal_trash_can', 2.6, -5.6, { h: 0.9, r: 0.35 }); prop(c, r, g, X, 'rollershutter_door', 18.8, 6.8, { len: 2.4, ry: -PI / 2 });
  },

  crown(c, r, g, X) {
    const { THREE } = c;
    // the shell game: three bowler hats, three briefcases, one painting. Watch.
    const bench = c.slab(6, 0.5, 1.0, std(c, 0x3a2a1a, { roughness: 0.5 }), W / 2, 0.25, -3.0); g.add(bench); c.post(X(W / 2 - 2), -3.0, 0.8); c.post(X(W / 2), -3.0, 0.8); c.post(X(W / 2 + 2), -3.0, 0.8);
    const paint = (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0a050'); gr.addColorStop(0.45, '#e86a30'); gr.addColorStop(0.55, '#3a5a8a'); gr.addColorStop(1, '#1a2a4a'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(40,30,60,.85)'; q.fillRect(w * 0.42, h * 0.18, w * 0.05, h * 0.3); q.beginPath(); q.moveTo(w * 0.36, h * 0.48); q.lineTo(w * 0.6, h * 0.48); q.lineTo(w * 0.56, h * 0.36); q.lineTo(w * 0.4, h * 0.36); q.fill(); for (let k = 0; k < 400; k++) { q.fillStyle = `rgba(255,${180 + Math.random() * 70 | 0},${80 + Math.random() * 100 | 0},.25)`; q.fillRect(Math.random() * w, Math.random() * h * 0.5, 6, 2); } for (let k = 0; k < 300; k++) { q.fillStyle = `rgba(${200 + Math.random() * 55 | 0},${120 + Math.random() * 60 | 0},60,.25)`; q.fillRect(Math.random() * w, h * 0.55 + Math.random() * h * 0.45, 8, 2); } };
    const art = decal(c, 1.6, 1.1, paint, 384); const panel = c.slab(2.6, 2.8, 0.2, std(c, 0xe8e0d0, { roughness: 0.8 }), W / 2, 1.4, -5.3); g.add(panel); c.wall(X(W / 2 - 1.3), -5.3, X(W / 2 + 1.3), -5.3); const frame = new THREE.Group(); frame.position.set(W / 2, 1.9, -5.18); g.add(frame); frame.add(c.slab(1.9, 1.4, 0.08, std(c, 0xc8a050, { metalness: 0.9, roughness: 0.3 }), 0, 0, -0.02)); art.position.z = 0.03; frame.add(art);
    const plaque = c.sign('SAN GIORGIO MAGGIORE AT DUSK, 1908', { w: 1.8, h: 0.16, bg: '#1a1a1a', fg: '#f4ead2', font: c.MONO, weight: 600 }); plaque.position.set(W / 2, 1.0, -5.18); g.add(plaque);
    const men = [], cases = []; const SL = [W / 2 - 2, W / 2, W / 2 + 2];
    for (let k = 0; k < 3; k++) { const e = extra(c, g, SL[k], -3.9, { col: 0x16161c }); const crown = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, PI * 2, 0, PI / 2), std(c, 0x0e0e0e, { roughness: 0.5 })); crown.position.y = 1.95; e.add(crown); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 20), std(c, 0x0e0e0e)); brim.position.y = 1.95; e.add(brim); men.push(e);
      const cs = new THREE.Group(); g.add(cs); cs.add(c.slab(0.5, 0.36, 0.12, std(c, 0x2a1a0e, { roughness: 0.4 }), 0, 0, 0)); cs.add(c.slab(0.14, 0.04, 0.03, std(c, 0xc8a050, { metalness: 1 }), 0, 0.2, 0)); cs.position.set(SL[k], 0.68, -3.0); cs.userData.slot = k; cases.push(cs); }
    let hold = -1, state = 'idle', swaps = 0, from = [0, 1, 2], tSw = 0, pair = [0, 1], wins = 0;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,200,90,.8)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(0.9, 0.9, 1); glow.visible = false; g.add(glow);
    c.clickable(frame, () => { if (state !== 'idle') return; hold = Math.floor(Math.random() * 3); art.visible = false; glow.visible = true; state = 'show'; tSw = 0; swaps = 0; c.sound.ticket(); c.toast('The painting goes into a briefcase. Watch that one.', 2400); }, 'The painting');
    c.tick((t, dt, P, ri) => {
      if (state === 'show') { const cs = cases.find((q) => q.userData.slot === hold); glow.position.set(cs.position.x, 1.2, cs.position.z); tSw += dt; if (tSw > 1.6) { glow.visible = false; state = 'swap'; tSw = 0; pair = [0, 1]; } }
      else if (state === 'swap') { tSw += dt; const D2 = 0.55, u = Math.min(1, tSw / D2); const a = cases.find((q) => q.userData.slot === pair[0]), b = cases.find((q) => q.userData.slot === pair[1]); const xa = SL[pair[0]], xb = SL[pair[1]]; a.position.x = xa + (xb - xa) * u; a.position.z = -3.0 + Math.sin(u * PI) * 0.6; b.position.x = xb + (xa - xb) * u; b.position.z = -3.0 - Math.sin(u * PI) * 0.6; men.forEach((m, k) => { m.position.y = Math.abs(Math.sin(t * 9 + k)) * 0.05; });
        if (u >= 1) { a.userData.slot = pair[1]; b.userData.slot = pair[0]; if (hold === pair[0]) hold = pair[1]; else if (hold === pair[1]) hold = pair[0]; a.position.z = b.position.z = -3.0; swaps++; tSw = 0; const p0 = Math.floor(Math.random() * 3); pair = [p0, (p0 + 1 + Math.floor(Math.random() * 2)) % 3]; c.sound.tick(); if (swaps >= 9) { state = 'pick'; c.toast('Which briefcase?', 2000); } } }
      cases.forEach((cs) => { if (state !== 'swap') cs.position.x += (SL[cs.userData.slot] - cs.position.x) * Math.min(1, dt * 8); });
    });
    cases.forEach((cs) => c.clickable(cs, () => { if (state !== 'pick') return; const ok = cs.userData.slot === hold; state = 'idle'; art.visible = true; const right = cases.find((q) => q.userData.slot === hold); glow.position.set(right.position.x, 1.2, right.position.z); glow.visible = true; setTimeout(() => { glow.visible = false; }, 1600);
      if (ok) { c.flash(0.4); c.sound.ding(); c.egg('shellgame', 'You kept your eye on the right briefcase through nine swaps. The thief returns the painting the way he took it: in plain sight.'); } else c.toast('Wrong case. The painting was never going to be where you were looking. Click the frame to go again.', 3000); }, 'A briefcase'));
    const inv = c.glb('workgirl', { h: 1.74, x: 4.2, z: 1.6, ry: 0.7, parent: g }); c.post(X(4.2), 1.6, 0.4);
    c.clickable(inv, () => { c.say(inv, 'I do not want the painting back. I want the man who took it. And his count.', 2800, 1.9); c.egg('banning'); }, 'The insurance investigator');
    const tc = c.glb('maitre', { h: 1.84, x: 16.0, z: 2.0, ry: -0.8, parent: g }); c.post(X(16.0), 2.0, 0.4);
    c.clickable(tc, () => { c.say(tc, 'Do you want to dance, or do you want to count?', 2400, 2.1); c.egg('crown'); }, 'A man in a tuxedo');
    [[0.6, -3.6], [19.4, -3.6]].forEach(([x, z]) => prop(c, r, g, X, 'marble_bust_01', x, z, { h: 0.7, y: 1.1 })); [[0.6, -3.6], [19.4, -3.6]].forEach(([x, z]) => g.add(c.slab(0.5, 1.1, 0.5, std(c, 0xe8e0d0), x, 0.55, z)));
    prop(c, r, g, X, 'painted_wooden_bench', 16.8, 5.2, { len: 2.2, ry: -PI / 2, r: 0.6 });
  },

  trading(c, r, g, X) {
    const { THREE } = c;
    // the pit: three raised rings you can climb, forty traders in coloured jackets, and the board
    const PXc = W / 2, PZc = -1.6, ringM = std(c, 0x5a4a3a, { roughness: 0.6 });
    [[4.6, 0.2], [3.5, 0.4], [2.4, 0.6]].forEach(([rr, h]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, h, 8), ringM); m.position.set(PXc, h / 2, PZc); m.rotation.y = PI / 8; g.add(m); });
    r.ground = (lx, z) => { const d = Math.hypot(lx - PXc, z - PZc); return d < 2.3 ? 0.6 : d < 3.4 ? 0.4 : d < 4.5 ? 0.2 : 0; };
    const JK = [0xd8a020, 0xc8102e, 0x2a5ac8, 0x2a8a3a, 0xe86a20, 0x7a2a8a, 0xf4f4f0], tr = [];
    for (let k = 0; k < (c.MOBILE ? 24 : 40); k++) { const a = k / 40 * PI * 2 * 3 + k * 0.3, rr = 2.0 + (k % 3) * 1.1, x = PXc + Math.cos(a) * rr, z = PZc + Math.sin(a) * rr; const d = rr, y = d < 2.3 ? 0.6 : d < 3.4 ? 0.4 : 0.2; const e = extra(c, g, x, z, { col: JK[k % JK.length], ry: Math.atan2(PXc - x, PZc - z) }); e.userData.y0 = y; e.position.y = y;
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), basic(c, 0xffffff)); card.position.set(0.25, 1.8, 0.1); e.add(card); e.userData.card = card; tr.push(e); }
    // the board
    const bT = c.canvasTex(512, 256, () => {}), bq = bT.userData.canvas.getContext('2d'); const board = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ map: bT, toneMapped: false })); board.position.set(W - 0.6, 3.8, -3.6); board.rotation.y = -PI / 2; g.add(board); g.add(c.slab(0.1, 2.0, 3.8, std(c, 0x111111), W - 0.52, 3.8, -3.6));
    let price = 142, hist = [142], frenzy = 0, open = false, crashed = false, bellT = 4;
    const draw = () => { bq.fillStyle = '#0a0a0a'; bq.fillRect(0, 0, 512, 256); bq.fillStyle = '#f5c542'; bq.font = `700 30px ${c.MONO}`; bq.fillText('FCOJ  N3W YORKERS EXCHANGE', 20, 40); bq.fillStyle = price < 100 ? '#ff4040' : '#40ff60'; bq.font = `800 64px ${c.MONO}`; bq.fillText(price.toFixed(2), 20, 120); bq.fillStyle = '#888'; bq.font = `600 22px ${c.MONO}`; bq.fillText(open ? 'MARKET OPEN' : 'WAITING FOR THE BELL', 20, 160); bq.strokeStyle = price < 100 ? '#ff4040' : '#40ff60'; bq.lineWidth = 3; bq.beginPath(); hist.slice(-60).forEach((p, i) => { const x = 260 + i * 4, y = 240 - (p - 20) * 0.7; i ? bq.lineTo(x, y) : bq.moveTo(x, y); }); bq.stroke(); bT.needsUpdate = true; }; draw();
    const btn = (label, x, col, fn) => { const s = c.sign(label, { w: 1.2, h: 0.5, bg: col, fg: '#fff', font: c.MONO, weight: 900 }); s.position.set(x, 1.4, 5.2); s.rotation.y = 0; g.add(s); const pole = c.slab(0.06, 1.2, 0.06, std(c, 0x333333), x, 0.6, 5.25); g.add(pole); c.clickable(s, fn, label); };
    btn('SELL', 8.4, '#c8102e', () => { if (!open) { c.toast('Wait for the bell.', 1400); return; } price = Math.max(29, price - 6 - Math.random() * 4); hist.push(price); frenzy = 2; c.sound.roar(0.25); draw(); if (price < 30 && !crashed) { crashed = true; c.flash(0.5); c.sound.applause(4); c.egg('oj', 'Frozen orange juice sold short before the crop report came out, all the way down to twenty nine. Counted, Billy Ray. Counted, Louis.'); } });
    btn('BUY', 11.6, '#2a8a3a', () => { if (!open) { c.toast('Wait for the bell.', 1400); return; } price = Math.min(160, price + 5); hist.push(price); frenzy = 2; c.sound.roar(0.2); draw(); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bellT -= dt; if (bellT <= 0 && !open) { open = true; c.sound.bell(); c.toast('The bell. Trading is open.', 1600); draw(); } frenzy = Math.max(0, frenzy - dt * 0.5); const k = (open ? 0.5 : 0.1) + frenzy; tr.forEach((e, i) => { e.position.y = e.userData.y0 + Math.abs(Math.sin(t * (4 + k * 6) + i)) * 0.08 * (1 + k); e.userData.card.position.y = 1.8 + Math.abs(Math.sin(t * 7 + i)) * 0.4 * k; }); if (Math.random() < dt * 0.6 && open) { price += (Math.random() - 0.5) * 2; hist.push(price); draw(); } });
    const duke = c.glb('wiseguy', { h: 1.8, x: 2.8, z: -3.6, ry: 0.8, parent: g }), duke2 = c.glb('broker', { h: 1.84, x: 3.6, z: -5.0, ry: 0.6, parent: g }); c.post(X(2.8), -3.6, 0.45); c.post(X(3.6), -5.0, 0.45);
    c.clickable(duke, () => { c.say(duke, 'Buy. Buy everything. The report says the crop is ruined.', 2400, 2.0); c.egg('dukes'); }, 'An old man in a good suit');
    c.clickable(duke2, () => { c.say(duke2, 'One dollar says they cannot do it. One dollar, Mortimer.', 2400, 2.1); c.egg('onedollar'); }, 'His brother');
    for (let k = 0; k < 5; k++) prop(c, r, g, X, 'cardboard_box_01', 17.0 + (k % 2) * 0.6, 4.4 + k * 0.5, { h: 0.4, ry: k });
  },

  miracle(c, r, g, X) {
    const { THREE } = c;
    // the courtroom: the bench, the jury, and the mail that settles the case
    const oak = std(c, 0x5a3a1e, { roughness: 0.5 });
    g.add(c.slab(4.0, 1.4, 1.0, oak, W / 2, 0.7, -5.4)); g.add(c.slab(4.4, 0.1, 1.2, oak, W / 2, 1.42, -5.4)); g.add(c.slab(4.0, 0.4, 1.0, oak, W / 2, 0.2, -6.2)); c.post(X(W / 2 - 1.2), -5.4, 1.0); c.post(X(W / 2 + 1.2), -5.4, 1.0); c.post(X(W / 2), -5.4, 1.0);
    const judge = extra(c, g, W / 2, -6.2, { col: 0x111111 }); judge.position.y = 0.4; judge.rotation.y = 0;
    const seal = decal(c, 1.0, 1.0, (q, w, h) => { q.fillStyle = '#c8a050'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.36); q.fillStyle = '#2a1a0a'; q.font = `700 ${w * 0.07}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('SUPREME COURT', w / 2, h * 0.93); }); seal.position.set(W / 2, 3.2, -D / 2 + 0.03); g.add(seal);
    for (let k = 0; k < 6; k++) prop(c, r, g, X, 'WoodenChair_01', 16.4 + (k % 3) * 0.8, -4.8 + (k / 3 | 0) * 1.0, { h: 0.95, ry: -PI / 2 }); g.add(c.slab(0.1, 1.0, 2.6, oak, 15.8, 0.5, -4.3)); c.wall(X(15.8), -5.6, X(15.8), -3.0);
    [[4.0, 0.0], [6.4, 0.0], [13.6, 0.0], [16.0, 0.0]].forEach(([x, z]) => prop(c, r, g, X, 'WoodenTable_03', x, z, { len: 1.4, r: 0.7 }));
    g.add(c.slab(12, 0.8, 0.08, std(c, 0x7a5a3a, { roughness: 0.5 }), W / 2, 0.4, 2.2)); c.wall(X(4), 2.2, X(W / 2 - 0.8), 2.2); c.wall(X(W / 2 + 0.8), 2.2, X(16), 2.2);
    // Santa, on the stand
    const santa = extra(c, g, 6.2, -4.6, { col: 0xc8102e, ry: 0.6 }); const beard = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), std(c, 0xf8f8f8, { roughness: 1 })); beard.scale.set(1, 1.2, 0.6); beard.position.set(0, 1.35, 0.12); santa.add(beard); const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 16), std(c, 0xc8102e)); hat.position.y = 2.05; hat.rotation.z = 0.3; santa.add(hat); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std(c, 0xffffff)); pom.position.set(0.12, 2.25, 0); santa.add(pom); c.post(X(6.2), -4.6, 0.4);
    c.clickable(santa, () => { c.say(santa, 'Faith is believing in things when common sense tells you not to. Same as the census.', 3000, 2.2); c.egg('kris'); }, 'A man with a white beard');
    const lawyer = c.glb('anchor', { h: 1.84, x: 7.8, z: 1.0, ry: 0.4, parent: g }); c.post(X(7.8), 1.0, 0.45);
    // the mail sacks: click the cart at the door and the Post Office has its say
    const cart = new THREE.Group(); cart.position.set(3.2, 0, 6.6); g.add(cart); cart.add(c.slab(1.4, 0.7, 0.9, std(c, 0x4a5a6a, { metalness: 0.4 }), 0, 0.45, 0)); c.post(X(3.2), 6.6, 0.8);
    const sackM = std(c, 0xb8a888, { roughness: 1 }), sacks = [], letters = [];
    for (let k = 0; k < 21; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), sackM); s.scale.set(1, 1.3, 0.8); s.visible = false; g.add(s); sacks.push({ s, t: -1, to: new THREE.Vector3(W / 2 - 1.6 + (k % 7) * 0.53, 1.75 + (k / 7 | 0) * 0.42, -5.4 + ((k * 3) % 5 - 2) * 0.12) }); }
    const LM = new THREE.MeshBasicMaterial({ color: 0xf4f0e0, side: THREE.DoubleSide }); for (let k = 0; k < 60; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), LM); l.visible = false; g.add(l); letters.push(l); }
    let dumped = false;
    c.clickable(cart, () => { if (dumped) return; dumped = true; c.sound.thud(0.6); sacks.forEach((o, k) => setTimeout(() => { o.t = 0; o.s.visible = true; c.sound.thud(0.3); }, k * 160)); setTimeout(() => { letters.forEach((l) => { l.visible = true; l.position.set(W / 2 + (Math.random() - 0.5) * 4, 3 + Math.random() * 2, -5 + Math.random() * 2); l.userData.v = Math.random() * 6; }); c.say(judge, 'The Post Office of the United States has delivered these letters to Santa Claus. Case dismissed.', 4200, 2.2); c.egg('mailsacks', 'Twenty one sacks of letters addressed to Santa Claus, delivered to this courtroom by the United States Post Office. The State cannot argue with the Post Office.'); }, 3600); }, 'The mail cart');
    c.tick((t, dt) => { sacks.forEach((o) => { if (o.t < 0) return; o.t = Math.min(1, o.t + dt * 1.3); const u = o.t, a = new THREE.Vector3(3.2, 0.9, 6.6); o.s.position.lerpVectors(a, o.to, u); o.s.position.y += Math.sin(u * PI) * 2.4; o.s.rotation.z = u * 4; }); letters.forEach((l, k) => { if (!l.visible) return; l.position.y = Math.max(1.5, l.position.y - dt * 0.6); l.rotation.set(t * 2 + k, t * 3 + l.userData.v, 0); }); });
    // the cane by the fireplace
    const fpl = new THREE.Group(); fpl.position.set(19.4, 0, 0.0); fpl.rotation.y = -PI / 2; g.add(fpl); fpl.add(c.slab(1.6, 1.3, 0.4, std(c, 0xd8ccb0, { roughness: 0.6 }), 0, 0.65, 0)); fpl.add(c.slab(1.0, 0.8, 0.42, basic(c, 0x140800), 0, 0.45, 0.01));
    const cane = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16, PI), std(c, 0x3a2010)); cane.position.set(0.9, 0.95, 0.2); fpl.add(cane); const shaft = c.slab(0.024, 0.9, 0.024, std(c, 0x3a2010), 0.96, 0.5, 0.2); fpl.add(shaft);
    c.clickable(fpl, () => c.egg('cane', 'A cane by the fireplace in a house nobody has moved into yet. Nobody here owns a cane.'), 'A cane by the fireplace');
    const elf = c.glb('elf', { h: 1.1, x: 5.0, z: 6.4, ry: 0.4, parent: g }); c.post(X(5.0), 6.4, 0.3);
    c.clickable(elf, () => { c.say(elf, 'I counted the letters. Fifty thousand and one.', 2200, 1.4); c.egg('helper'); }, 'A very small helper');
  },
});

Object.assign(ROOM, {
  treebrooklyn(c, r, g, X) {
    const { THREE } = c;
    // the Tree of Heaven: every time you look away it grows, up toward the fire escape
    const TX = 13.6, TZ = -3.4, bark = std(c, 0x5a5048, { roughness: 0.9 }), leafM = new THREE.MeshStandardMaterial({ color: 0x5a7a3a, side: THREE.DoubleSide, roughness: 0.8, transparent: true, alphaTest: 0.3, map: c.canvasTex(64, 128, (q) => { q.fillStyle = '#6a8a40'; for (let k = 0; k < 9; k++) { q.beginPath(); q.ellipse(16 + (k % 2) * 32, 10 + k * 13, 14, 6, (k % 2 ? -1 : 1) * 0.5, 0, 7); q.fill(); } q.fillRect(30, 0, 4, 128); }) });
    const tree = new THREE.Group(); tree.position.set(TX, 0, TZ); g.add(tree); c.post(X(TX), TZ, 0.4);
    const SEG = []; const grow = (parent, len, rad, depth, seed) => { const b = new THREE.Group(); parent.add(b); const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 8), bark); m.position.y = len / 2; b.add(m); b.userData = { depth, len }; b.scale.setScalar(0.001); SEG.push(b);
      if (depth < 5) { const n = depth < 2 ? 2 : 3; for (let k = 0; k < n; k++) { const ch = new THREE.Group(); ch.position.y = len * (0.7 + k * 0.1); const rr = (x) => { const v = Math.sin(seed * 91.3 + k * 17.1 + x) * 43758.5; return v - Math.floor(v); }; ch.rotation.set((rr(1) - 0.5) * 1.3, rr(2) * PI * 2, (rr(3) - 0.5) * 1.3); b.add(ch); grow(ch, len * 0.72, rad * 0.62, depth + 1, seed * 1.7 + k); } }
      else for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.44), leafM); l.position.set(0, len * (0.4 + k * 0.15), 0); l.rotation.set(0.6, k * 1.6, 0.4); b.add(l); }
      return b; };
    grow(tree, 1.6, 0.16, 0, 1.3);
    let level = 0, looking = false, done = false; const fw = new THREE.Vector3(), tp = new THREE.Vector3(TX, 2, TZ);
    const setLevel = () => SEG.forEach((b) => { b.userData.want = b.userData.depth <= level ? 1 : 0.001; }); setLevel();
    c.tick((t, dt, P, ri) => {
      SEG.forEach((b) => { const w = b.userData.want; b.scale.setScalar(b.scale.x + (w - b.scale.x) * Math.min(1, dt * 1.5)); });
      tree.rotation.z = Math.sin(t * 0.8) * 0.02;
      if (ri !== r.i) return;
      c.camera.getWorldDirection(fw); const dx = X(TX) - P.x, dz = TZ - P.z, L = Math.hypot(dx, dz) || 1, dot = (dx * fw.x + dz * fw.z) / L;
      const now = dot > 0.75; if (looking && !now && level < 5) { level++; setLevel(); c.sound.crack(); if (level === 5 && !done) { done = true; c.egg('treeofheaven', 'The Tree of Heaven. It grows out of cement, out of rubble, out of nothing at all. Look away and it has climbed another storey.'); } } looking = now;
    });
    c.clickable(tree, () => c.egg('ailanthus', 'Ailanthus, brought from China in the 1780s, now in every back yard in Brooklyn. Nobody planted these ones.'), 'The tree');
    // the fire escape, the reader, the washing
    prop(c, r, g, X, 'modular_fire_escape', 18.4, -4.4, { h: 3.6, ry: -PI / 2 });
    const reader = c.glb('bookseller', { h: 1.6, x: 16.4, z: -1.0, ry: -1.2, parent: g }); c.post(X(16.4), -1.0, 0.4);
    c.clickable(reader, () => { c.say(reader, 'One book a day from the branch library, in order. I am up to B. Then I will count the whole block.', 3200, 1.9); c.egg('francie'); }, 'A girl with books');
    const COLS = ['#f4f4f0', '#c8d8e8', '#e8d0c0', '#d0d8c0', '#f0e0e0'], wash = [];
    for (const z of [-0.6, 2.6]) { g.add(c.slab(W - 1, 0.01, 0.01, std(c, 0x666666), W / 2, 3.4, z)); for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6 + (k % 3) * 0.2), new THREE.MeshStandardMaterial({ color: COLS[k % 5], side: THREE.DoubleSide, roughness: 0.9 })); m.geometry.translate(0, -0.3, 0); m.position.set(1.2 + k * 1.3, 3.4, z); g.add(m); wash.push(m); } }
    c.tick((t) => wash.forEach((m, k) => { m.rotation.x = Math.sin(t * 1.6 + k) * 0.25; }));
    c.clickable(wash[3], () => c.egg('washing', 'Monday is washing day on every line in the yard. The line squeaks on its pulley when you pull it in.'), 'Washing on the line');
    prop(c, r, g, X, 'wooden_barrels_01', 2.4, -5.4, { h: 1.0, r: 0.8 }); prop(c, r, g, X, 'wooden_crate_02', 3.6, -6.2, { h: 0.6, r: 0.4 }); prop(c, r, g, X, 'metal_trash_can', 6.0, -6.2, { h: 0.9, r: 0.35 }); prop(c, r, g, X, 'old_bed_frame', 7.4, 6.2, { len: 2.0, ry: 0.2 });
  },

  gatsby(c, r, g, X) {
    const { THREE } = c;
    // the eyes of the billboard: they follow you, and if you hold their stare the colour drains away
    const bb = new THREE.Group(); bb.position.set(W / 2, 0, -5.4); g.add(bb);
    bb.add(c.slab(9, 3.0, 0.15, std(c, 0xe8dcc0, { roughness: 0.95 }), 0, 4.8, 0)); [-4.2, 4.2].forEach((x) => bb.add(c.slab(0.2, 3.5, 0.2, std(c, 0x5a4a3a), x, 1.75, -0.2)));
    const eyeL = watcher(c, bb, -2.0, 4.8, 0.1, 0, 1.1), eyeR = watcher(c, bb, 2.0, 4.8, 0.1, 0, 1.1);
    [-2.0, 2.0].forEach((x) => { const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 10, 40), std(c, 0xd8b048, { metalness: 0.9, roughness: 0.3 })); rim.position.set(x, 4.8, 0.16); bb.add(rim); }); bb.add(c.slab(1.6, 0.1, 0.1, std(c, 0xd8b048, { metalness: 0.9 }), 0, 4.95, 0.16));
    const sign = c.sign('DR. T. J. ECKLEBURG, OCULIST  ·  N3W YORKERS', { w: 6.0, h: 0.4, bg: '#e8dcc0', fg: '#3a2a1a', font: c.SERIF, weight: 800 }); sign.position.set(0, 3.55, 0.09); bb.add(sign);
    let stare = 0, drained = false; const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (r.owns) { c.FX.sat = null; r.owns = false; } return; }
      c.camera.getWorldDirection(fw); const dx = X(W / 2) - P.x, dy = 4.8 - P.y, dz = -5.4 - P.z, L = Math.hypot(dx, dy, dz), dot = (dx * fw.x + dy * fw.y + dz * fw.z) / L;
      stare = dot > 0.97 ? stare + dt : Math.max(0, stare - dt * 0.7); c.FX.sat = Math.max(0, 0.55 - stare * 0.18); r.owns = true;
      if (stare > 3 && !drained) { drained = true; c.say(eyeL, 'God sees everything.', 2600, 1.8); c.egg('eckleburg', 'You held the stare of the billboard until the colour went out of the valley. It was always going to win.'); }
    });
    // ash: drifting, and the men who shovel it
    const NA = 700, ap = new Float32Array(NA * 3); for (let k = 0; k < NA; k++) { ap[k * 3] = Math.random() * W; ap[k * 3 + 1] = Math.random() * 6; ap[k * 3 + 2] = -7 + Math.random() * 14; }
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(ap, 3)); const ash = new THREE.Points(ag, new THREE.PointsMaterial({ color: 0x8a8478, size: 0.05, transparent: true, opacity: 0.7 })); ash.frustumCulled = false; g.add(ash);
    c.tick((t, dt) => { for (let k = 0; k < NA; k++) { ap[k * 3] += dt * (0.4 + Math.sin(k) * 0.2); ap[k * 3 + 1] -= dt * 0.08; if (ap[k * 3] > W) ap[k * 3] = 0; if (ap[k * 3 + 1] < 0) ap[k * 3 + 1] = 6; } ag.attributes.position.needsUpdate = true; });
    const heap = std(c, 0x7a746a, { roughness: 1 }); [[3.2, -3.0, 1.6], [16.8, 1.0, 1.3], [4.0, 4.6, 1.1]].forEach(([x, z, rr]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(rr, rr * 0.9, 12), heap); m.position.set(x, rr * 0.45, z); g.add(m); c.post(X(x), z, rr * 0.8); });
    const men = [0, 1, 2].map((k) => { const e = extra(c, g, 5 + k * 1.2, -1.6 - k * 0.6, { col: 0x6a645a }); return e; });
    c.tick((t) => men.forEach((e, k) => { e.rotation.x = Math.max(0, Math.sin(t * 1.5 + k)) * 0.35; }));
    // the yellow car, every so often, too fast
    const car = new THREE.Group(); g.add(car); const yel = std(c, 0xe8c030, { roughness: 0.3, metalness: 0.4 }); car.add(c.slab(1.8, 0.5, 4.2, yel, 0, 0.7, 0)); car.add(c.slab(1.6, 0.5, 1.6, yel, 0, 1.2, 0.6)); [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 8, 20), std(c, 0x1a1a1a)); w.rotation.y = PI / 2; w.position.set(x, 0.42, z); car.add(w); });
    let run = -1, wait = 6, seen = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { car.visible = false; return; } wait -= dt; if (wait < 0 && run < 0) { run = 0; c.sound.horn(0.15); } if (run >= 0) { run += dt; car.visible = true; car.position.set(W / 2 + 6.4, 0, 9 - run * 18); if (run > 1.2) { run = -1; wait = 14; car.visible = false; } } });
    c.clickable(car, () => { c.egg('yellowcar', 'A big yellow car, far too fast, through the valley on the road to the city. Everybody at the garage remembers it.'); }, 'The yellow car');
    // the garage
    const pump = new THREE.Group(); pump.position.set(1.6, 0, 1.0); g.add(pump); pump.add(c.slab(0.5, 1.8, 0.4, std(c, 0xc82020, { roughness: 0.5 }), 0, 0.9, 0)); const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), basic(c, 0xf4ead2)); globe.position.y = 2.0; pump.add(globe); c.post(X(1.6), 1.0, 0.4);
    c.clickable(pump, () => c.egg('garage', 'A garage at the edge of the ash heaps. The man who runs it is as grey as the valley.'), 'A gas pump');
    const wil = c.glb('tough', { h: 1.8, x: 2.6, z: 2.6, ry: 0.6, parent: g }); c.post(X(2.6), 2.6, 0.45);
    c.clickable(wil, () => { c.say(wil, 'You can fool me, but you cannot fool the eyes on that sign.', 2600, 2.0); c.egg('wilson'); }, 'The man at the garage');
  },

  bigdaddy(c, r, g, X) {
    const { THREE } = c;
    // rollerbladers down the Mall, and a stick on the path
    const blades = []; for (let k = 0; k < 6; k++) { const e = extra(c, g, 0, 0, { col: [0xff4fa3, 0x22d3ee, 0xf5c542, 0x2a8a3a, 0xe86a20, 0x7a2a8a][k] }); blades.push({ e, lane: 8.4 + (k % 3) * 1.6, ph: k * 2.3, fall: 0 }); }
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.2, 8), std(c, 0x5a3a1a, { roughness: 0.9 })); stick.rotation.z = PI / 2; stick.position.set(6.6, 0.04, 3.4); g.add(stick);
    let held = false, trips = 0; const fw = new THREE.Vector3();
    c.clickable(stick, () => { held = !held; c.sound.click(); if (held) c.toast('You have the stick. Stand by the path.', 2000); }, 'A stick');
    c.tick((t, dt, P, ri) => {
      if (held && ri === r.i) { c.camera.getWorldDirection(fw); stick.position.set(P.x - r.x0 + fw.x * 0.7 + 0.2, P.y - 0.9, P.z + fw.z * 0.7); stick.rotation.set(0.3, Math.atan2(fw.x, fw.z), PI / 2 - 0.3); } else if (held) held = false;
      blades.forEach((b) => { const cyc = (t * 0.22 + b.ph * 0.1) % 1, z = 7.5 - cyc * 15; if (b.fall > 0) { b.fall -= dt; b.e.rotation.x = Math.min(PI / 2, b.e.rotation.x + dt * 6); b.e.position.y = 0.1; return; } b.e.rotation.x = 0; b.e.position.set(b.lane + Math.sin(t * 3 + b.ph) * 0.3, 0, z); b.e.rotation.y = PI + Math.sin(t * 3 + b.ph) * 0.2;
        if (held && ri === r.i && Math.hypot(b.e.position.x - (P.x - r.x0), z - P.z) < 1.3) { b.fall = 2.2; c.sound.thud(0.5); trips++; if (trips === 3) c.egg('trip', 'Three rollerbladers down on the Mall. A terrible lesson in parenting, and very funny from where you are standing.'); } });
    });
    const dad = c.glb('hustler', { h: 1.8, x: 5.0, z: 2.0, ry: 0.8, parent: g }); c.post(X(5.0), 2.0, 0.45);
    c.clickable(dad, () => { c.say(dad, 'Rule one: if they are wearing rollerblades, they are fair game. Rule two: count them as they go down.', 3200, 2.0); c.egg('sonny'); }, 'A man in a hurry');
    const kid = extra(c, g, 4.2, 2.6, { col: 0x2a5ac8, ry: 0.8 }); kid.scale.setScalar(0.62); c.post(X(4.2), 2.6, 0.3);
    c.clickable(kid, () => { c.sound.note(660, 0.1); c.egg('kid', 'Five years old, wears what he wants, eats ketchup on everything, and is now very good with a stick.'); }, 'A kid');
    [[3.0, -4.0], [3.0, -1.0], [17.0, -4.0], [17.0, -1.0], [17.0, 3.0]].forEach(([x, z]) => prop(c, r, g, X, 'painted_wooden_bench', x, z, { len: 2.0, ry: x < 10 ? PI / 2 : -PI / 2, r: 0.6 }));
    [[1.6, 5.6], [18.4, 5.6], [1.6, -6.4], [18.4, -6.4]].forEach(([x, z]) => prop(c, r, g, X, 'street_lamp_02', x, z, { h: 4.0, r: 0.25 }));
    const hd = new THREE.Group(); hd.position.set(14.6, 0, 5.0); g.add(hd); hd.add(c.slab(1.4, 1.0, 0.8, std(c, 0xd8d8d0, { metalness: 0.5 }), 0, 0.5, 0)); const um = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.4, 12), std(c, 0xe8c030)); um.position.y = 2.2; hd.add(um); hd.add(c.slab(0.04, 1.8, 0.04, std(c, 0x888888), 0, 1.3, 0)); c.post(X(14.6), 5.0, 0.8);
    c.clickable(hd, () => c.egg('hotdog2', 'A hot dog cart on the Mall. The kid wants his with ketchup and nothing else, ever.'), 'A hot dog cart');
  },

  serendipity(c, r, g, X) {
    const { THREE } = c;
    // two lifts. You pick a floor, she picks a floor. If the doors open on the same one, it was fate.
    const brass = std(c, 0xc8a050, { metalness: 1, roughness: 0.25 }), LX = [W / 2 - 2.2, W / 2 + 2.2], LZ = -5.6, doors = [], dials = [];
    LX.forEach((x, k) => { g.add(c.slab(2.2, 3.4, 0.3, std(c, 0x2a1a10, { roughness: 0.4 }), x, 1.7, LZ - 0.2)); const dL = c.slab(0.75, 2.6, 0.06, brass, x - 0.38, 1.3, LZ - 0.02), dR = c.slab(0.75, 2.6, 0.06, brass, x + 0.38, 1.3, LZ - 0.02); g.add(dL); g.add(dR); doors.push([dL, dR, x]);
      const car = c.slab(1.4, 2.6, 0.05, basic(c, 0xffe8c0), x, 1.3, LZ - 0.32); g.add(car);
      const dT = c.canvasTex(256, 128, () => {}), dq = dT.userData.canvas.getContext('2d'); const dial = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: dT, toneMapped: false })); dial.position.set(x, 3.0, LZ); g.add(dial); dials.push({ dq, dT, f: 1 }); });
    c.wall(X(LX[0] - 1.2), LZ, X(LX[1] + 1.2), LZ);
    const drawDial = (d, f) => { const q = d.dq; q.fillStyle = '#2a1a0a'; q.fillRect(0, 0, 256, 128); q.strokeStyle = '#c8a050'; q.lineWidth = 6; q.beginPath(); q.arc(128, 120, 100, PI, 0); q.stroke(); q.fillStyle = '#f4e8c8'; q.font = `700 20px ${c.SERIF}`; q.textAlign = 'center'; for (let k = 1; k <= 23; k += 2) { const a = PI + (k - 1) / 22 * PI; q.fillText(String(k), 128 + Math.cos(a) * 82, 126 + Math.sin(a) * 82); } const a = PI + (f - 1) / 22 * PI; q.strokeStyle = '#ff3030'; q.lineWidth = 4; q.beginPath(); q.moveTo(128, 120); q.lineTo(128 + Math.cos(a) * 92, 120 + Math.sin(a) * 92); q.stroke(); d.dT.needsUpdate = true; };
    dials.forEach((d) => drawDial(d, 1));
    let busy = false, tries = 0, open = 0, met = false;
    const ride = (mine) => { if (busy) return; busy = true; tries++; const hers = tries >= 3 ? mine : 1 + Math.floor(Math.random() * 23); c.sound.lift(); let t0 = 0; const iv = setInterval(() => { t0 += 0.05; const u = Math.min(1, t0 / 3); const fa = 1 + (mine - 1) * u, fb = 1 + (hers - 1) * u; drawDial(dials[0], fa); drawDial(dials[1], fb); if (u >= 1) { clearInterval(iv); c.sound.lift(); if (mine === hers) { open = 1; c.flash(0.4); c.sound.ding(); if (!met) { met = true; c.egg('fate', `Floor ${mine}, both lifts. If the doors open on the same floor, it was meant to be. It took ${tries} tries.`); } } else c.toast(`You stopped at ${mine}. She stopped at ${hers}. Not tonight. Pick again.`, 2800); setTimeout(() => { open = 0; drawDial(dials[0], 1); drawDial(dials[1], 1); busy = false; }, 5000); } }, 50); };
    [3, 7, 12, 16, 23].forEach((f, k) => { const b = c.sign(String(f), { w: 0.32, h: 0.32, bg: '#c8a050', fg: '#2a1a0a', font: c.SERIF, weight: 900 }); b.position.set(W / 2 - 0.55 + k * 0.28, 1.4, LZ + 0.02); g.add(b); c.clickable(b, () => ride(f), `Floor ${f}`); });
    c.tick((t, dt) => doors.forEach(([dL, dR, x]) => { const o = open; dL.position.x += ((x - 0.38 - o * 0.7) - dL.position.x) * Math.min(1, dt * 3); dR.position.x += ((x + 0.38 + o * 0.7) - dR.position.x) * Math.min(1, dt * 3); }));
    const him = c.glb('agent', { h: 1.84, x: LX[0], z: LZ - 0.7, ry: 0, parent: g, shadow: false }), her = c.glb('workgirl', { h: 1.72, x: LX[1], z: LZ - 0.7, ry: 0, parent: g, shadow: false });
    // the glove, the frozen hot chocolate, the five dollar bill
    prop(c, r, g, X, 'round_wooden_table_01', 4.6, 2.0, { len: 0.9, r: 0.5 }); const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.04, 0.05], [0.04, 0.1], [0.12, 0.3], [0.13, 0.32]].map(([x, y]) => new THREE.Vector2(x, y)), 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.05 })); cup.position.set(4.6, 0.77, 2.0); g.add(cup); const choc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10, 0, PI * 2, 0, PI / 2), std(c, 0x6a3a1a)); choc.position.set(4.6, 1.06, 2.0); g.add(choc); const cream = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), std(c, 0xfffaf0)); cream.position.set(4.6, 1.14, 2.0); g.add(cream);
    c.clickable(cup, () => c.egg('frrrozen', 'A frozen hot chocolate the size of a flower pot, from the café on East 60th. Two spoons. Somebody has already started it.'), 'A frozen hot chocolate');
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.24), std(c, 0x1a1a1a, { roughness: 1 })); glove.position.set(15.4, 0.47, 3.0); g.add(glove); prop(c, r, g, X, 'painted_wooden_bench', 15.4, 3.0, { len: 1.8, ry: -PI / 2, r: 0.6 });
    c.clickable(glove, () => c.egg('glove', 'One black cashmere glove, left on a bench. The other one is somewhere in the city, with its own story.'), 'A glove');
    const bill = c.sign('$5  ·  N3W', { w: 0.3, h: 0.14, bg: '#c8d8b0', fg: '#1a3a1a', font: c.MONO, weight: 800 }); bill.position.set(0.2, 1.4, 0.8); bill.rotation.y = PI / 2; g.add(bill);
    c.clickable(bill, () => c.egg('fivedollars', 'A five dollar bill with a phone number written on it, spent at a newsstand. If it ever comes back to you, call.'), 'A five dollar bill');
    [[1.0, -6.6], [19.0, -6.6]].forEach(([x, z]) => prop(c, r, g, X, 'potted_plant_02', x, z, { h: 1.4, r: 0.4 })); prop(c, r, g, X, 'Chandelier_01', W / 2, 1.0, { h: 1.0, y: 4.8 });
  },

  bigbusiness(c, r, g, X) {
    const { THREE } = c;
    // a wall across the lounge with a big gilt mirror frame in it. There is no glass. The woman on the other side moves when you move.
    const MZ = -0.8, pink = std(c, 0xf0d0d4, { roughness: 0.8 }), gold = std(c, 0xd8b048, { metalness: 1, roughness: 0.25 });
    g.add(c.slab(5.6, 3.2, 0.2, pink, 2.8, 1.6, MZ)); g.add(c.slab(5.6, 3.2, 0.2, pink, W - 2.8, 1.6, MZ)); g.add(c.slab(8.8, 0.5, 0.2, pink, W / 2, 0.25, MZ)); g.add(c.slab(8.8, 0.4, 0.2, pink, W / 2, 3.0, MZ));
    c.wall(X(0), MZ, X(W), MZ);
    [[W / 2 - 4.4, 1.6, 0.16, 2.6], [W / 2 + 4.4, 1.6, 0.16, 2.6]].forEach(([x, y, w, h]) => g.add(c.slab(w, h, 0.3, gold, x, y, MZ))); g.add(c.slab(9.0, 0.16, 0.3, gold, W / 2, 2.8, MZ)); g.add(c.slab(9.0, 0.16, 0.3, gold, W / 2, 0.5, MZ));
    // the lounge on this side, and the same lounge, mirrored, on that side
    const side = (s) => { const z0 = MZ + s * 2.6; prop(c, r, g, X, 'ArmChair_01', 16.2, z0, { h: 1.0, ry: s > 0 ? PI : 0 }); prop(c, r, g, X, 'ArmChair_01', 17.6, z0 + s * 1.2, { h: 1.0, ry: s > 0 ? PI : 0 }); prop(c, r, g, X, 'potted_plant_02', W / 2 - 3.6, MZ + s * 0.6, { h: 1.2 }); prop(c, r, g, X, 'potted_plant_02', W / 2 + 3.6, MZ + s * 0.6, { h: 1.2 }); const vanity = c.slab(0.5, 0.8, 2.0, std(c, 0xf8f4f0, { roughness: 0.3 }), 1.0, 0.4, MZ + s * 1.6); g.add(vanity); prop(c, r, g, X, 'ornate_mirror_01', 0.4, MZ + s * 1.6, { h: 1.0, y: 1.0, ry: PI / 2 }); };
    side(1); side(-1); c.post(X(1.0), MZ + 1.6, 1.0);
    const twin = c.glb('loretta', { h: 1.74, parent: g }); let hold = 0, broke = false, said = false; const hist = [];
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { twin.visible = false; hold = 0; return; } twin.visible = true;
      const lx = P.x - r.x0; hist.push({ t, x: lx, z: P.z, yaw: P.yaw }); while (hist.length && hist[0].t < t - 0.3) hist.shift(); const s = hist[0];
      const front = P.z > MZ && P.z < MZ + 4 && Math.abs(lx - W / 2) < 4.2; hold = front ? hold + dt : Math.max(0, hold - dt);
      if (hold > 6 && !broke) { broke = true; c.say(twin, 'We are not a reflection, honey. We were switched at birth. And we have both been counted.', 3600, 2.0); c.egg('twins', 'The mirror has no glass. The woman on the other side kept up with you for six seconds, then stopped pretending.'); setTimeout(() => { broke = false; hold = 0; }, 9000); }
      if (!broke) { twin.position.set(s.x, 0, 2 * MZ - s.z); twin.rotation.y = PI - s.yaw + PI; } else { twin.rotation.y += dt * 2.5; }
    });
    c.clickable(twin, () => c.egg('nottheglass', 'You reached for the glass and there was nothing there.'), 'Your reflection');
    const faucet = new THREE.Group(); faucet.position.set(1.2, 0.8, MZ + 1.6); g.add(faucet); const swan = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16, PI * 1.3), gold); swan.position.y = 0.1; faucet.add(swan);
    c.clickable(faucet, () => { c.sound.drip(); c.egg('swanfaucet', 'Gold swan taps in the ladies lounge. The hotel claims they are gold plated. Nobody has checked.'); }, 'A gold tap');
  },
});

function steam(c, g, x, y, z) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: glowTex(c, 'rgba(230,230,230,.35)'), transparent: true, depthWrite: false, toneMapped: false }), puffs = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(m.clone()); g.add(s); puffs.push({ s, k: i / 6 }); }
  c.tick((t) => puffs.forEach((p) => { const u = (t * 0.25 + p.k) % 1; p.s.position.set(x + Math.sin(u * 6 + p.k * 9) * 0.2, y + u * 2.2, z); p.s.scale.setScalar(0.4 + u * 1.4); p.s.material.opacity = (1 - u) * 0.7; }));
}

function blockMesh(c, ch, col) {
  const t = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = col; q.fillRect(0, 0, w, h); q.strokeStyle = '#fff'; q.lineWidth = 8; q.strokeRect(6, 6, w - 12, h - 12); q.fillStyle = '#fff'; q.font = `900 86px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(ch, w / 2, h / 2 + 4); });
  return new c.THREE.Mesh(new c.THREE.BoxGeometry(0.6, 0.6, 0.6), new c.THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
}
function facadeTex(c) {
  return c.canvasTex(256, 256, (q, w, h) => {
    q.fillStyle = '#8c8c8c'; q.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { q.fillStyle = Math.random() < 0.5 ? '#f0f0e0' : '#2a2a2a'; q.fillRect(x + 3, y + 3, 9, 10); }
    q.fillStyle = '#b0b0b0'; for (let x = 0; x < w; x += 64) q.fillRect(x, 0, 6, h);
  });
}
function aerialTex(c) {
  return c.canvasTex(512, 512, (q, w, h) => {
    q.fillStyle = '#1a1a1a'; q.fillRect(0, 0, w, h);
    q.fillStyle = '#6a6a6a'; for (let y = 0; y < h; y += 128) q.fillRect(0, y + 50, w, 28); q.fillRect(w / 2 - 20, 0, 40, h);
    for (let i = 0; i < 90; i++) { q.fillStyle = Math.random() < 0.6 ? '#f2c230' : '#ffffff'; const y = Math.floor(Math.random() * 4) * 128 + 54 + Math.random() * 18; q.fillRect(Math.random() * w, y, 7, 4); }
    for (let i = 0; i < 40; i++) { q.fillStyle = '#e8e8e8'; q.fillRect(w / 2 - 16 + Math.random() * 28, Math.random() * h, 4, 7); }
    q.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 400; i++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  });
}
