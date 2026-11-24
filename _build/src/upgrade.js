// THE BIG UPGRADE (2026-11-24). MLow: "as detailed and cool as my movie sets gallery or the gallery I made Gary, but
// even better". The October rooms were plates and murals with code boxes in front of them: square black posts for
// subway columns, slab desks, box crates, flat black ceilings. This file adds, per room and in this order:
//   real models (our own movie set and museum kit, Poly Haven CC0), scanned surfaces (Poly Haven CC0, assets/scan),
//   built architecture (I-beams, jack arches, coffers, a drop ceiling, skirting, copings, a roof bulkhead),
//   signs in the house fonts (Archivo, JetBrains Mono, Permanent Marker), and one optical illusion per room, each an egg.
// Every model is u_<source name>.glb in assets/glb; NOTES.md in the upgrade folder lists source and licence.
import { W, D, H_IN, PORTAL } from './rooms.js';

const PI = Math.PI;
const ARCH = '"Archivo Expanded", "Archivo Narrow", "Helvetica Neue", Arial, sans-serif';
const NARROW = '"Archivo Narrow", "Helvetica Neue", Arial, sans-serif';
const MARKER = '"Permanent Marker", "Comic Sans MS", cursive';
const JB = '"JetBrains Mono", Menlo, monospace';

export function upgradeRoom(c, r, g, X, mats) {
  if (!UP[r.id]) return;
  UP[r.id](c, r, g, X, mats);
  if (!r.outdoor) skirting(c, r, g);
}

// ---------- helpers ----------
// A projected decal: the canvas is projected from one eye point onto a set of planes, so it reads perfectly from that
// point and falls apart everywhere else (anamorphic floor art, Felice Varini's rings). Planes are subdivided so the
// affine texture interpolation inside each triangle stays true to the projection.
function projDecal(c, g, { eye, at, fov, aspect, tex, planes, glow = 0.35, rough = 0.7 }) {
  const { THREE } = c;
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.05, 200); cam.position.set(...eye); cam.lookAt(...at); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: rough, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const v = new THREE.Vector3(), M = new THREE.Matrix4(), E = new THREE.Euler();
  for (const p of planes) {
    const geo = new THREE.PlaneGeometry(p.w, p.h, Math.max(1, Math.ceil(p.w * 4)), Math.max(1, Math.ceil(p.h * 4)));
    E.set(p.rx || 0, p.ry || 0, 0, 'YXZ'); M.makeRotationFromEuler(E).setPosition(p.x, p.y, p.z); geo.applyMatrix4(M);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const behind = v.clone().applyMatrix4(cam.matrixWorldInverse).z > 0; v.project(cam); uv.setXY(i, behind ? -9 : v.x * 0.5 + 0.5, behind ? -9 : v.y * 0.5 + 0.5); }
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 2; g.add(m);
  }
  return mat;
}
// the spot an illusion resolves from: painted footprints on the floor, and the egg when you stand on them
function spot(c, r, g, X, [x, z], id, line) {
  const { THREE } = c;
  const t = c.canvasTex(256, 256, (q, w, h) => {
    q.fillStyle = 'rgba(245,197,66,.9)';
    for (const s of [-1, 1]) { q.save(); q.translate(w / 2 + s * 34, h / 2 + 10); q.rotate(s * 0.06); q.beginPath(); q.ellipse(0, -30, 22, 40, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(0, 42, 18, 22, 0, 0, 7); q.fill(); q.restore(); }
    q.font = `400 30px ${MARKER}`; q.textAlign = 'center'; q.fillText('STAND HERE', w / 2, 34);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -PI / 2; m.position.set(x, 0.008, z); g.add(m);
  let done = false;
  c.tick((tt, dt, P) => { if (done) return; if (Math.hypot(P.x - X(x), P.z - z) < 0.45) { done = true; c.egg(id, line); } });
}
function txt(c, w, h, draw) { const t = c.canvasTex(w, h, (q, W2, H2) => { q.clearRect(0, 0, W2, H2); draw(q, W2, H2); q.clearRect(0, 0, W2, 4); q.clearRect(0, H2 - 4, W2, 4); q.clearRect(0, 0, 4, H2); q.clearRect(W2 - 4, 0, 4, H2); }); return t; }
// skirting and a picture rail round an indoor room: the line where a wall meets the floor is what reads as built
function skirting(c, r, g) {
  const { THREE } = c;
  const m = new THREE.MeshStandardMaterial({ color: r.id === 'subway' ? 0x2c3a2e : r.id === 'theater' ? 0x3a0c10 : 0x2a1c12, roughness: 0.55, metalness: r.id === 'subway' ? 0.4 : 0 });
  const k = 0.16, d = 0.03, s = D / 2, px1 = (W - PORTAL.w) / 2;
  g.add(c.slab(W, k, d, m, W / 2, k / 2, s - d / 2));
  g.add(c.slab(px1, k, d, m, px1 / 2, k / 2, -s + d / 2)); g.add(c.slab(px1, k, d, m, W - px1 / 2, k / 2, -s + d / 2));
  const a = 2 + s, b = s - 5.6;   // west wall either side of the door
  if (r.i > 0) { g.add(c.slab(d, k, a, m, d / 2, k / 2, -s + a / 2)); g.add(c.slab(d, k, b, m, d / 2, k / 2, s - b / 2)); } else g.add(c.slab(d, k, D, m, d / 2, k / 2, 0));
}
function ibeam(c, g, x, z, h, mat) {   // a riveted steel column, flanges facing the track like the IRT's
  const grp = new c.THREE.Group(); grp.position.set(x, 0, z);
  grp.add(c.slab(0.3, h, 0.026, mat, 0, h / 2, 0.137)); grp.add(c.slab(0.3, h, 0.026, mat, 0, h / 2, -0.137)); grp.add(c.slab(0.022, h, 0.25, mat, 0, h / 2, 0));
  grp.add(c.slab(0.46, 0.05, 0.46, mat, 0, 0.025, 0)); grp.add(c.slab(0.42, 0.12, 0.42, mat, 0, h - 0.06, 0));
  const rv = new c.THREE.InstancedMesh(new c.THREE.SphereGeometry(0.012, 6, 4), mat, 40), M = new c.THREE.Matrix4(); let k = 0;
  for (let y = 0.4; y < h - 0.2 && k < 40; y += 0.3) for (const s of [-1, 1]) M.makeTranslation(0.1 * s, y, 0.152), rv.setMatrixAt(k++, M);
  rv.count = k; grp.add(rv); g.add(grp); return grp;
}
// the east wall seen from inside a room, as decal planes that leave the doorway (z 2 to 5.6, 3.6 m high) open
function eastWall(y0 = 0, y1 = H_IN) { const x = W - 0.13, ry = -PI / 2, h = y1 - y0; return [{ x, ry, y: y0 + h / 2, h, z: (-D / 2 + 2) / 2, w: D / 2 + 2 }, { x, ry, y: y0 + h / 2, h, z: (5.6 + D / 2) / 2, w: D / 2 - 5.6 }, { x, ry, y: (3.6 + y1) / 2, h: y1 - 3.6, z: 3.8, w: 3.6 }]; }
// a Firefly plate (FIREFLY_QUEUE.md): the file in assets/ff is a placeholder until the queued image replaces it
function ffPlate(c, g, file, w, h, x, y, z, ry, glow = 0.3) {
  const { THREE } = c; const t = c.tex.load(`assets/ff/${file}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: glow }));
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}
function neon(c, text, w, h, col, font = ARCH) { return c.sign(text, { w, h, bg: null, fg: col, glow: 26, weight: 700, px: 200, font }); }

// ---------- the rooms ----------
const UP = {
  street(c, r, g, X) {
    // fire escapes up both facades, the iron that makes a New York block
    c.glb('u_ph_modular_fire_escape', { h: 7.4, x: 0.7, y: 2.6, z: -2.6, ry: PI / 2, parent: g });
    c.glb('u_ph_modular_fire_escape', { h: 7.4, x: W - 0.7, y: 2.6, z: -2.6, ry: -PI / 2, parent: g });
    // window units hanging off the brick
    c.glb('u_nyb_aircon', { len: 1.7, x: 0.32, y: 4.4, z: 5.2, ry: PI / 2, parent: g });
    c.glb('u_nyb_aircon', { len: 1.7, x: W - 0.32, y: 5.4, z: -6.6, ry: -PI / 2, parent: g });
    // a shuttered storefront on the west side, gates down for the night
    c.glb('u_ph_rollershutter_door', { len: 3.4, x: 0.3, z: 3.6, ry: PI / 2, parent: g }); c.wall(X(0.5), 1.9, X(0.5), 5.3);
    // the street furniture
    const pole = c.slab(0.07, 1.25, 0.07, new c.THREE.MeshStandardMaterial({ color: 0x2a2c2e, metalness: 0.8, roughness: 0.4 }), 19.35, 0.62, -5.4); g.add(pole);
    c.glb('u_nyb_payphone', { h: 0.74, x: 19.35, y: 1.1, z: -5.4, ry: -PI / 2, parent: g, onload: (o) => c.clickable(o, () => { c.sound.tick(); c.toast('N3W BELL: press 1 to be counted. Press 2 to stay uncounted. All lines are busy.'); }, 'The payphone') });
    c.post(X(19.35), -5.4, 0.35);
    c.glb('u_nyb_walking_newsbox', { h: 1.12, x: 2.4, z: -7.35, parent: g }); c.post(X(2.4), -7.35, 0.6);
    c.glb('u_nyb_mcmlow_bin', { len: 1.5, x: 17.4, z: -7.3, parent: g }); c.post(X(17.4), -7.3, 0.8);
    // a painted billboard over the hoarding, in a steel frame with two gooseneck lamps
    ffPlate(c, g, 'street_billboard.jpg', 7.2, 4.05, 10, 6.4, D / 2 - 0.16, PI, 0.42);
    const stl = new c.THREE.MeshStandardMaterial({ color: 0x23262a, metalness: 0.8, roughness: 0.45 });
    for (const [w, h, x, y] of [[7.5, 0.14, 10, 8.5], [7.5, 0.14, 10, 4.3], [0.14, 4.3, 6.32, 6.4], [0.14, 4.3, 13.68, 6.4], [7.5, 0.06, 10, 4.05]]) g.add(c.slab(w, h, 0.12, stl, x, y, D / 2 - 0.2));
    for (const lx of [7.6, 12.4]) { g.add(c.slab(0.04, 0.04, 0.9, stl, lx, 8.75, D / 2 - 0.62)); const b = new c.THREE.Mesh(new c.THREE.SphereGeometry(0.08, 10, 8), new c.THREE.MeshBasicMaterial({ color: 0xffe6b0, toneMapped: false })); b.position.set(lx, 8.68, D / 2 - 1.05); g.add(b); }
    c.glb('u_ph_water_manhole_cover', { len: 0.85, x: 9.2, y: 0.002, z: -5.4, parent: g });   // the steam comes out of it now
    // the illusion: anamorphic street paint. From the footprints it stands up off the asphalt as a sign.
    const t = txt(c, 1600, 1000, (q, w, h) => {
      q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillStyle = '#ff4fa3'; q.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);
      q.fillStyle = '#0b1020'; q.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.7);
      q.fillStyle = '#f4ead2'; q.font = `700 ${h * 0.2}px ${ARCH}`; q.fillText('YOU WERE', w / 2, h * 0.35);
      q.fillStyle = '#f5c542'; let fs = h * 0.26; q.font = `400 ${fs}px ${MARKER}`; const mw = q.measureText('NOT COUNTED').width; if (mw > w * 0.74) { fs *= w * 0.74 / mw; q.font = `400 ${fs}px ${MARKER}`; } q.fillText('NOT COUNTED', w / 2, h * 0.62);
      q.strokeStyle = '#f4ead2'; q.lineWidth = 9; q.lineCap = 'round'; for (let i = 0; i < 4; i++) { q.beginPath(); q.moveTo(w * 0.15 + i * 24, h * 0.72); q.lineTo(w * 0.15 + i * 24 + 6, h * 0.82); q.stroke(); } q.beginPath(); q.moveTo(w * 0.135, h * 0.8); q.lineTo(w * 0.24, h * 0.73); q.stroke();
    });
    projDecal(c, g, { eye: [10, 1.62, 5.8], at: [10, 0.15, -1.2], fov: 15, aspect: 1.6, tex: t, glow: 0.5, rough: 0.35, planes: [{ x: 10, y: 0.006, z: -2.6, w: 9, h: 10.8, rx: -PI / 2 }] });
    spot(c, r, g, X, [10, 5.8], 'anamorph', 'From here the street paint stands up. Take one step and it lies down again.');
  },

  deli(c, r, g, X, mats) {
    const { THREE } = c;
    // a drop ceiling: the T-bar grid and real fluorescent fixtures round the old tubes
    const tbar = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.5, metalness: 0.3 });
    const nx = Math.round(W / 0.61), nz = Math.round(D / 0.61);
    const gx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.03, D), tbar, nx), gz = new THREE.InstancedMesh(new THREE.BoxGeometry(W, 0.03, 0.025), tbar, nz), M = new THREE.Matrix4();
    for (let i = 0; i < nx; i++) gx.setMatrixAt(i, M.makeTranslation(i * W / nx, H_IN - 0.016, 0));
    for (let i = 0; i < nz; i++) gz.setMatrixAt(i, M.makeTranslation(W / 2, H_IN - 0.016, -D / 2 + i * D / nz));
    g.add(gx, gz);
    for (const tx of [4, 10, 16]) for (const tz of [-5, 0, 5]) c.glb('u_ph_mounted_fluorescent_lights', { len: 1.3, x: tx, y: H_IN - 0.07, z: tz, ry: PI / 2, parent: g });
    // the counter gets a real register; crates, water, a stool, a camera that counts you
    c.glb('u_ph_CashRegister_01', { h: 0.5, x: 17.65, y: 1.095, z: 2.6, ry: -PI / 2, parent: g, onload: (o) => c.clickable(o, () => { c.sound.ticket(); c.toast('NO SALE. Nothing here is counted, so nothing is for sale.'); }, 'The register') });
    for (const [x, y, z, k] of [[2.4, 0, -7.45, 0], [2.85, 0, -7.45, 0], [2.62, 0.5, -7.45, 0], [3.3, 0, -7.4, 0]]) c.glb('u_nyb_crowd_cooler', { h: 0.5, x, y, z, ry: k, parent: g });
    c.post(X(2.8), -7.4, 0.55);
    for (const [x, y, z, col, ry] of [[15.9, 0, -2.7, 'cyan', 0.1], [15.9, 0.33, -2.7, 'pink', -0.08], [15.9, 0.66, -2.7, 'cyan', 0.2], [16.35, 0, -3.25, 'pink', 0.5]]) c.glb(`u_nyb_milkcrate_${col}`, { h: 0.33, x, y, z, ry, parent: g });
    c.post(X(16.1), -2.95, 0.45);
    c.glb('u_ph_metal_stool_01', { h: 0.78, x: 16.45, z: -0.6, parent: g }); c.post(X(16.45), -0.6, 0.25);
    c.glb('u_ph_standing_chalkboard_01', { h: 1.35, x: 11.6, z: 5.9, ry: -0.5, parent: g, onload: (o) => {
      const ch = c.canvasTex(512, 640, (q, w, h) => { q.fillStyle = '#1d2320'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(244,234,210,.92)'; q.textAlign = 'center'; q.font = `400 60px ${MARKER}`; q.fillText('TODAY', w / 2, 90); q.font = `400 42px ${MARKER}`; ['CHOPPED CHEESE', 'ON A ROLL', '', 'NAZAR COLA', '2 FOR 1 TALLY'].forEach((s, i) => q.fillText(s, w / 2, 180 + i * 70)); q.fillStyle = '#ff4fa3'; q.fillText('ASK THE CAT', w / 2, 590); });
      const b = new c.THREE.Box3().setFromObject(o); const face = new c.THREE.Mesh(new c.THREE.PlaneGeometry(0.66, 0.86), new c.THREE.MeshStandardMaterial({ map: ch, roughness: 0.9 }));
      face.position.set(0, (b.max.y - o.position.y) * 0.6, 0.2); face.rotation.x = -0.24; o.add(face);
    } });
    c.post(X(11.6), 5.9, 0.5);
    c.glb('u_ph_security_camera_02', { len: 0.42, x: 19.5, y: 5.5, z: 7.4, ry: -2.4, parent: g });
    const op = neon(c, 'OPEN 24 HRS', 2.8, 0.55, '#ff3b5c'); op.position.set(2.0, 5.55, -D / 2 + 0.03);
    if (mats.ceil) { mats.ceil.emissive.set(0xd8d4cc); mats.ceil.emissiveMap = mats.ceil.map; mats.ceil.emissiveIntensity = 0.32; }   // tiles lit by the tubes, not a black void g.add(op);
    // the illusion: a trapdoor painted on the terrazzo. From the footprints the stockroom is open under your feet.
    const t = txt(c, 1400, 1000, (q, w, h) => {
      const L = [w * 0.16, h * 0.9], R = [w * 0.84, h * 0.9], RT = [w * 0.74, h * 0.32], LT = [w * 0.26, h * 0.32];   // the hole as the eye sees it
      const k = 0.36, LB = [w * 0.33, h * 0.86], RB = [w * 0.67, h * 0.86], RB2 = [w * 0.62, h * 0.5], LB2 = [w * 0.38, h * 0.5];
      const poly = (pts, f) => { q.beginPath(); q.moveTo(...pts[0]); pts.slice(1).forEach((p) => q.lineTo(...p)); q.closePath(); q.fillStyle = f; q.fill(); };
      poly([L, R, RT, LT], '#08090a');
      const gw = q.createLinearGradient(0, h * 0.3, 0, h * 0.9); gw.addColorStop(0, '#2a2620'); gw.addColorStop(1, '#0c0b0a');
      poly([LT, LB2, LB, L], gw); poly([RT, R, RB, RB2], gw);
      const gb = q.createLinearGradient(0, h * 0.32, 0, h * 0.5); gb.addColorStop(0, '#3a3428'); gb.addColorStop(1, '#16140f'); poly([LT, RT, RB2, LB2], gb);
      const gl = q.createRadialGradient(w / 2, h * 0.7, 10, w / 2, h * 0.7, w * 0.22); gl.addColorStop(0, 'rgba(255,214,140,.95)'); gl.addColorStop(1, 'rgba(255,214,140,0)'); poly([LB2, RB2, RB, LB], '#1a1712'); q.fillStyle = gl; q.fillRect(w * 0.3, h * 0.5, w * 0.4, h * 0.36);
      q.strokeStyle = '#8a6a3a'; q.lineWidth = 12; for (const x of [0.43, 0.57]) { q.beginPath(); q.moveTo(w * x, h * 0.33); q.lineTo(w * (0.5 + (x - 0.5) * 1.2), h * 0.88); q.stroke(); }
      q.lineWidth = 9; for (let i = 0; i < 7; i++) { const y = h * (0.37 + i * 0.075), s = 0.07 + i * 0.008; q.beginPath(); q.moveTo(w * (0.5 - s), y); q.lineTo(w * (0.5 + s), y); q.stroke(); }
      q.fillStyle = '#ffd68a'; q.textAlign = 'center'; q.font = `700 ${h * 0.05}px ${JB}`; q.fillText('STOCKROOM: EVERYONE UNCOUNTED', w / 2, h * 0.8);
      poly([LT, RT, [w * 0.72, h * 0.04], [w * 0.28, h * 0.04]], '#6b4c2a');   // the lid, standing open
      q.strokeStyle = '#3d2a16'; q.lineWidth = 6; for (let i = 1; i < 5; i++) { const y = h * (0.32 - i * 0.056); q.beginPath(); q.moveTo(w * (0.26 + i * 0.004), y); q.lineTo(w * (0.74 - i * 0.004), y); q.stroke(); }
      q.fillStyle = '#c9a227'; q.fillRect(w * 0.47, h * 0.14, w * 0.06, h * 0.03);
      q.strokeStyle = '#f5c542'; q.lineWidth = 10; q.beginPath(); q.moveTo(...L); q.lineTo(...R); q.lineTo(...RT); q.lineTo(...LT); q.closePath(); q.stroke();
    });
    projDecal(c, g, { eye: [10, 1.62, 5.8], at: [10, 0, 0.2], fov: 22, aspect: 1.4, tex: t, glow: 0.25, rough: 0.5, planes: [{ x: 10, y: 0.006, z: -1.4, w: 6.2, h: 9.6, rx: -PI / 2 }] });
    spot(c, r, g, X, [10, 5.8], 'pit', 'Mind the trapdoor. It is painted on. Walk over it.');
  },

  subway(c, r, g, X) {
    const { THREE } = c;
    // built I-beam columns in scanned green paint, a jack arch ceiling between riveted girders
    const steel = c.surf('greenmetal', 1.2, 0x7f927f); steel.metalness = 0.45; steel.roughness = 0.6;
    for (const bx of [3.5, 8, 12, 16.5]) for (const bz of [-5.2, 2.6]) { if (Math.abs(bx - 10) < 2.6 && bz < 0) continue; ibeam(c, g, bx, bz, H_IN - 0.5, steel);
      if (bz > 0) { const s = c.sign('UNCOUNTED ST', { w: 0.9, h: 0.24, bg: '#0d0d0d', fg: '#f4f4f0', font: NARROW, weight: 700, px: 96 }); s.position.set(bx, 2.55, bz + 0.155); g.add(s); } }
    const gird = c.surf('greenmetal', 2, 0x5d6e60);
    const xs = [0, 3.5, 8, 12, 16.5, W];
    for (const x of xs) g.add(c.slab(0.3, 0.5, D, gird, x, H_IN - 0.25, 0));
    const arch = c.surf('ceiltile', 2, 0x8c8a82);
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i] + 0.15, b = xs[i + 1] - 0.15, w = b - a, s = 0.32, R = (w * w / 4 + s * s) / (2 * s), th = 2 * Math.asin(w / 2 / R);
      const geo = new THREE.CylinderGeometry(R, R, D, 24, 1, true, PI - th / 2, th); geo.rotateX(PI / 2);
      const m = new THREE.Mesh(geo, arch); m.material = arch.clone(); m.material.side = THREE.BackSide;
      m.position.set((a + b) / 2, H_IN - 0.5 + s - R, 0); m.rotation.z = 0; g.add(m);
    }
    for (const fx of [1.75, 5.75, 10, 14.25, 18.25]) for (const fz of [-4.5, 0.5, 5]) c.glb('u_ph_mounted_fluorescent_lights', { len: 1.2, x: fx, y: H_IN - 0.62, z: fz, ry: PI / 2, parent: g });
    // benches, the clock over the edge, the cans
    for (const bx of [6.4, 13.6]) { c.glb('u_nyb_pelham_bench', { len: 3.6, x: bx, z: 7.3, ry: PI, parent: g }); c.wall(X(bx - 1.9), 6.9, X(bx + 1.9), 6.9); }
    const rod = c.slab(0.04, 1.2, 0.04, new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 }), 10, H_IN - 0.5 - 0.6, -6.2); g.add(rod);
    c.glb('u_nyb_pelham_clock', { h: 0.62, x: 10, y: 4.0, z: -6.17, parent: g }); c.glb('u_nyb_pelham_clock', { h: 0.62, x: 10, y: 4.0, z: -6.23, ry: PI, parent: g });
    for (const tx of [2.0, 18.0]) ffPlate(c, g, 'subway_tablet.jpg', 3.3, 1.1, tx, 4.75, -D / 2 + 0.13, 0, 0.2);   // mosaic tablets, Firefly queue
    c.glb('u_nyb_dogday_wastebin', { len: 1.3, x: 17.3, z: 3.6, ry: -0.3, parent: g }); c.post(X(17.3), 3.6, 0.7);
    // the illusion, after Felice Varini: a yellow tally ring painted across the columns, the floor and the far wall.
    // Only from the footprints past the turnstiles does it close into one ring.
    const t = txt(c, 1200, 1200, (q, w, h) => {
      q.strokeStyle = '#f5c542'; q.lineCap = 'round'; q.lineWidth = w * 0.06; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, PI * 2); q.stroke();
      q.lineWidth = w * 0.045; for (let i = 0; i < 4; i++) { const x = w * (0.33 + i * 0.11); q.beginPath(); q.moveTo(x, h * 0.3); q.lineTo(x + w * 0.015, h * 0.7); q.stroke(); }
      q.strokeStyle = '#ff4fa3'; q.beginPath(); q.moveTo(w * 0.27, h * 0.62); q.lineTo(w * 0.76, h * 0.38); q.stroke();
    });
    const eye = [4.6, 1.62, 0.2], at = [16, 1.75, -0.4];
    const planes = [...eastWall(0, H_IN - 0.5), { x: 13, y: 0.006, z: 0, w: 13.5, h: D - 0.2, rx: -PI / 2 }];
    for (const [bx, bz] of [[8, 2.6], [12, 2.6], [16.5, 2.6], [16.5, -5.2]]) planes.push({ x: bx - 0.152, y: (H_IN - 0.5) / 2, z: bz, w: 0.3, h: H_IN - 0.5, ry: -PI / 2 }, { x: bx, y: (H_IN - 0.5) / 2, z: bz + (bz > 0 ? -0.152 : 0.152), w: 0.3, h: H_IN - 0.5, ry: bz > 0 ? PI : 0 });
    projDecal(c, g, { eye, at, fov: 46, aspect: 1, tex: t, glow: 0.55, rough: 0.6, planes });
    spot(c, r, g, X, [eye[0], eye[2]], 'varini', 'There it is: one ring, one tally. Step off the mark and it breaks back into pieces.');
  },

  archive(c, r, g, X) {
    const { THREE } = c;
    // card catalogues and shelving up both walls, the Marks now hang above them
    const cabs = ['u_nyb_deskset_cabinet', 'u_nyb_wolf_cabinet', 'u_nyb_wud_cabinet'];
    for (const [x, ry] of [[0.38, PI / 2], [W - 0.38, -PI / 2]]) for (let i = 0; i < 8; i++) c.glb(cabs[(i + (x > 1 ? 1 : 0)) % 3], { h: 1.9, x, z: -6.9 + i * 1.17, ry, parent: g });
    // the desk, the clipboard, the encyclopedia of everyone who was not counted
    c.glb('u_ph_metal_office_desk', { h: 0.86, x: 10, z: 2.4, parent: g });
    c.glb('u_ph_clipboard', { len: 0.34, x: 10.15, y: 0.865, z: 2.75, ry: 0.3, parent: g });
    c.glb('u_ph_book_encyclopedia_set_01', { len: 0.55, x: 9.9, y: 0.865, z: 2.05, parent: g });
    c.glb('u_ph_vintage_grandfather_clock_01', { h: 2.2, x: 3.35, z: -7.55, parent: g, onload: (o) => c.clickable(o, () => { c.sound.thud(0.4); c.say(o, 'It strikes 1790. Every hour.', 2600, 2.3); }, 'The clock') });
    c.post(X(3.35), -7.55, 0.4);
    c.glb('u_ph_security_camera_02', { len: 0.42, x: 19.5, y: 5.4, z: -7.5, ry: -0.8, parent: g });
    // a coffered ceiling in dark panelling with two chandeliers
    const pan = c.surf('panel', 1.2, 0x8a6a50);
    const bx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.3, D), pan, 7), bz = new THREE.InstancedMesh(new THREE.BoxGeometry(W, 0.3, 0.22), pan, 5), M = new THREE.Matrix4();
    for (let i = 0; i < 7; i++) bx.setMatrixAt(i, M.makeTranslation(i * W / 6, H_IN - 0.15, 0));
    for (let i = 0; i < 5; i++) bz.setMatrixAt(i, M.makeTranslation(W / 2, H_IN - 0.15, -D / 2 + i * D / 4));
    g.add(bx, bz);
    for (const cx of [6.7, 13.3]) c.glb('u_ph_Chandelier_02', { h: 1.2, x: cx, y: H_IN - 1.2, z: 0, parent: g });
    const pl = c.sign('DEPARTMENT OF THE UNCOUNTED\nRECORDS SINCE 1790 · NOTHING KEPT', { w: 6.4, h: 0.7, bg: '#2a1c0e', fg: '#e8c878', font: ARCH, weight: 700, px: 160, border: '#c9a227' });
    pl.position.set(W / 2, 4.75, D / 2 - 0.03); pl.rotation.y = PI; g.add(pl);
    // the illusion: the Department's stamp, projected across the east catalogues and the wall. Sit at the desk to read it.
    const t = txt(c, 1600, 700, (q, w, h) => {
      q.save(); q.translate(w / 2, h / 2); q.rotate(-0.06); q.strokeStyle = q.fillStyle = 'rgba(214,30,48,.92)'; q.lineWidth = 26; q.strokeRect(-w * 0.44, -h * 0.36, w * 0.88, h * 0.72);
      q.font = `700 ${h * 0.36}px ${ARCH}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('UNCOUNTED', 0, -h * 0.03);
      q.font = `600 ${h * 0.09}px ${JB}`; q.fillText('DEPT. OF THE UNCOUNTED · FILED, NOT KEPT', 0, h * 0.24); q.restore();
    });
    const eye = [10, 1.62, 1.2], at = [19.6, 2.1, -2.4];
    projDecal(c, g, { eye, at, fov: 30, aspect: 2.2, tex: t, glow: 0.4, planes: [...eastWall(), { x: W - 0.62, y: 0.95, z: -2.8, w: 9.6, h: 1.9, ry: -PI / 2 }] });
    spot(c, r, g, X, [eye[0], eye[2]], 'stampwall', 'From the desk the whole east wall is one stamp. Walk on and it is filed in pieces.');
  },

  alley(c, r, g, X) {
    // real crates, milk crates, bags and a drum in place of the box crates
    const st = [['u_ph_wooden_crate_01', 0.42, 0.95], ['u_nyb_milkcrate_cyan', 0.33, 0.4], ['u_nyb_milkcrate_pink', 0.33, 0.4]];
    for (const side of [0, 1]) {
      const bx = side ? W - 1.6 : 1.6, s = side ? -1 : 1;
      [[0, 0, -6.9, 0, 0.05], [0, 0.42, -6.9, 0, -0.06], [1, 0, -5.9, 0, 0.2], [2, 0.33, -5.9, 0, -0.1], [1, 0.66, -5.9, 0, 0.3], [0, 0, -5.0, 0.8, 0.4], [2, 0, -6.4, 0.9, 0], [1, 0, -6.9, 1.0, 0.1]].forEach(([k, y, z, dx, ry]) => {
        const [n, hh] = st[k]; c.glb(n, { h: hh, x: bx + s * dx * 0.7, y, z, ry: ry + (side ? PI : 0), parent: g });
      });
    }
    for (const [x, z, ry] of [[0.45, -4.25, 0.3], [0.75, -4.6, 2], [0.4, -4.75, 4], [W - 0.5, -4.4, 1]]) c.glb('u_ph_trashbag', { h: 0.55, x, z, ry, parent: g });
    c.glb('u_ph_Barrel_01', { h: 0.9, x: 16.5, z: -7.45, parent: g }); c.post(X(16.5), -7.45, 0.4); c.post(X(0.5), -4.45, 0.3); c.post(X(W - 0.5), -4.4, 0.25);
    c.glb('u_ph_exterior_aircon_unit', { len: 1.7, x: 0.3, y: 5.7, z: 1.0, ry: PI / 2, parent: g });
    c.glb('u_ph_exterior_aircon_unit', { len: 1.7, x: W - 0.3, y: 6.3, z: -1.6, ry: -PI / 2, parent: g });
    const ns = c.sign('NO STANDING\nANYTIME', { w: 1.2, h: 0.5, bg: '#e8e8e2', fg: '#c81e30', font: NARROW, weight: 700, px: 128, border: '#c81e30' }); ns.material.color.setScalar(0.7);
    ns.position.set(W - 0.16, 3.0, 4.2); ns.rotation.y = -PI / 2; g.add(ns);
    // the illusion: an eye flower painted across the cobbles and up the east wall. From the footprints it is flat and whole.
    const t = txt(c, 1200, 1200, (q, w, h) => {
      const R = w * 0.36, x = w / 2, y = h / 2; q.globalAlpha = 0.8;
      for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; q.save(); q.translate(x, y); q.rotate(a); const gr = q.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#f8d6e4'); gr.addColorStop(0.5, '#f3a6c8'); gr.addColorStop(1, '#e0307e'); q.fillStyle = gr; q.beginPath(); q.ellipse(R * 0.55, 0, R * 0.46, R * 0.2, 0, 0, PI * 2); q.fill(); q.restore(); }
      [[0.38, '#1d4ed8'], [0.29, '#ffffff'], [0.2, '#22d3ee'], [0.1, '#0b1020']].forEach(([k, col]) => { q.fillStyle = col; q.beginPath(); q.arc(x, y, R * k, 0, PI * 2); q.fill(); });
      q.fillStyle = '#fff'; q.beginPath(); q.arc(x - R * 0.05, y - R * 0.05, R * 0.035, 0, PI * 2); q.fill();
      q.fillStyle = '#ff4fa3'; for (let i = 0; i < 9; i++) { const xx = x + (i - 4) * R * 0.2; q.fillRect(xx, y + R * 0.75, 10, R * (0.1 + (i * 37 % 10) / 30)); }
    });
    const eye = [6, 1.62, 6.4], at = [17.6, 0.15, -0.6];
    projDecal(c, g, { eye, at, fov: 22, aspect: 1, tex: t, glow: 0.14, rough: 0.45, planes: [{ x: 13.5, y: 0.006, z: -0.5, w: 13, h: 13, rx: -PI / 2 }, ...eastWall(0, 6)] });
    spot(c, r, g, X, [eye[0], eye[2]], 'flower', 'The flower lies flat on the corner. It is painted on two walls and a street.');
  },

  theater(c, r, g, X) {
    const { THREE } = c;
    const gilt = new THREE.MeshStandardMaterial({ color: 0xb8902e, metalness: 1, roughness: 0.32 });
    // two blocks of house seats facing the stage, a centre aisle for the X
    for (const [x0, x1] of [[3.6, 6.6], [13.4, 16.4]]) {
      for (const z of [3.0, 4.6]) for (let x = x0; x <= x1 + 0.01; x += 1.0) c.glb('u_nyb_mmmystery_seat', { h: 1.02, x, z, ry: PI, parent: g });
      c.wall(X(x0 - 0.45), 2.6, X(x1 + 0.45), 2.6); c.wall(X(x0 - 0.45), 5.05, X(x1 + 0.45), 5.05); c.wall(X(x0 - 0.45), 2.6, X(x0 - 0.45), 5.05); c.wall(X(x1 + 0.45), 2.6, X(x1 + 0.45), 5.05);
    }
    c.glb('u_chandelier', { h: 2.4, x: 10, y: H_IN - 2.45, z: 1.4, parent: g });
    for (const [x, ry] of [[0.5, -2.4], [W - 0.5, 2.4]]) { c.glb('u_nyb_nys_spot', { len: 0.7, x, y: 4.3, z: 6.6, ry, parent: g }); g.add(c.slab(Math.abs(x - (x < 10 ? 0 : W)) + 0.1, 0.05, 0.08, gilt, (x + (x < 10 ? 0 : W)) / 2, 4.28, 6.6)); }
    // a coffered ceiling in gilt and plaster, with a painted panel over the house
    const M = new THREE.Matrix4(), bx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.22, D), gilt, 6), bz = new THREE.InstancedMesh(new THREE.BoxGeometry(W, 0.22, 0.16), gilt, 5);
    for (let i = 0; i < 6; i++) bx.setMatrixAt(i, M.makeTranslation(i * W / 5, H_IN - 0.11, 0));
    for (let i = 0; i < 5; i++) bz.setMatrixAt(i, M.makeTranslation(W / 2, H_IN - 0.11, -D / 2 + i * D / 4));
    g.add(bx, bz);
    const mt = c.tex.load('assets/ff/theater_ceiling.jpg'); mt.colorSpace = THREE.SRGBColorSpace;   // Firefly queue: replace the file
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 7.6), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.8, emissive: 0xffffff, emissiveMap: mt, emissiveIntensity: 0.25 }));
    mural.rotation.x = PI / 2; mural.position.set(10, H_IN - 0.02, 2); g.add(mural);
    const rose = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 10, 32), gilt); rose.rotation.x = PI / 2; rose.position.set(10, H_IN - 0.06, 1.4); g.add(rose);
    for (const [x, ry] of [[0.15, PI / 2], [W - 0.15, -PI / 2]]) { const e = c.sign('EXIT', { w: 0.7, h: 0.28, bg: '#160404', fg: '#ff3a2a', font: ARCH, weight: 700, glow: 14, px: 96 }); e.position.set(x, 4.62, 3.8); e.rotation.y = ry; g.add(e); }
    // the illusion: Pepper's ghost. A sheet of glass in the proscenium; stand on the X and an era closer appears on stage.
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(PORTAL.w - 0.4, PORTAL.h - 0.2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, roughness: 0.04, metalness: 0, depthWrite: false, envMapIntensity: 1.5 }));
    glass.position.set(10, PORTAL.h / 2, -D / 2 + 1.1); g.add(glass);
    const cl = window.MARKS.c[(Math.random() * window.MARKS.c.length) | 0];
    const gt = c.tex.load(`assets/art/th/${cl.c}.jpg`); gt.colorSpace = THREE.SRGBColorSpace;
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4 * 9 / 16), new THREE.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    ghost.position.set(10, 2.1, -D / 2 + 0.95); g.add(ghost);
    let seen = false;
    c.tick((tt, dt, P) => {
      const here = Math.hypot(P.x - X(10), P.z + 3.4) < 0.75, k = here ? 0.62 : 0; const m = ghost.material;
      m.opacity += (k - m.opacity) * Math.min(1, dt * 1.6); ghost.position.y = 2.1 + Math.sin(tt * 0.8) * 0.05; ghost.visible = m.opacity > 0.01;
      if (here && m.opacity > 0.4 && !seen) { seen = true; c.egg('ghost', `Pepper's ghost: ${cl.t} on a sheet of glass. Step off the X and it is gone.`); }
    });
  },

  roof(c, r, g, X) {
    const { THREE } = c;
    // a stone coping on the parapet, a stair bulkhead, the roof's machinery and two chairs by the lights
    const cope = c.surf('concrete', 1.2, 0xb0aca4), px1 = (W - PORTAL.w) / 2;
    g.add(c.slab(px1, 0.08, 0.42, cope, px1 / 2, 1.14, -D / 2 - 0.12)); g.add(c.slab(px1, 0.08, 0.42, cope, W - px1 / 2, 1.14, -D / 2 - 0.12));
    const br = c.surf('brick', 2.4, 0x7a6a62);
    g.add(c.slab(2.6, 2.9, 2.8, br, 1.42, 1.45, -6.5)); g.add(c.slab(2.8, 0.12, 3.0, cope, 1.42, 2.96, -6.5)); c.wall(X(0.1), -4.95, X(2.75), -4.95); c.wall(X(2.75), -4.95, X(2.75), -8);
    g.add(c.slab(0.05, 2.1, 0.95, new THREE.MeshStandardMaterial({ color: 0x5a1a14, metalness: 0.5, roughness: 0.5 }), 2.74, 1.05, -6.4));
    const ra = c.sign('ROOF ACCESS\nALARM WILL NOT SOUND', { w: 0.9, h: 0.36, bg: '#c81e30', fg: '#f4f4f0', font: NARROW, weight: 700, px: 96 }); ra.position.set(2.775, 2.35, -6.4); ra.rotation.y = PI / 2; g.add(ra);
    const cage = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a0, toneMapped: false })); cage.position.set(2.82, 2.7, -6.4); g.add(cage);
    c.glb('u_nyb_walking_aircon', { len: 0.9, x: 4.6, z: -7.45, parent: g }); c.post(X(4.6), -7.45, 0.5);
    c.glb('u_ph_exterior_aircon_unit', { len: 1.8, x: 3.2, z: 7.55, ry: PI, parent: g }); c.wall(X(2.2), 7.2, X(4.2), 7.2);
    c.glb('u_ph_propane_tank', { h: 0.55, x: 18.6, z: 7.3, parent: g }); c.post(X(18.6), 7.3, 0.3);
    c.glb('u_ph_power_box_01', { h: 0.5, x: 14.2, y: 1.2, z: 7.82, ry: PI, parent: g });
    // the night out sits in front of you now, not behind the Marks: two chairs and a cooler under a warm pool of light,
    // and a warming barrel with a fire in it on the right
    for (const [x, z, ry] of [[6.2, 0.5, 0.7], [7.7, 0.1, -0.5]]) { c.glb('u_ph_plastic_monobloc_chair_01', { h: 0.88, x, z, ry, parent: g }); c.post(X(x), z, 0.35); }
    c.glb('u_nyb_crowd_cooler', { len: 0.6, x: 6.95, z: -0.55, ry: 0.2, parent: g }); c.post(X(6.95), -0.55, 0.35);
    c.glb('u_ph_Barrel_01', { h: 0.9, x: 15.6, z: -1.2, parent: g }); c.post(X(15.6), -1.2, 0.4);
    const fire = new THREE.Mesh(new THREE.CircleGeometry(0.27, 20), new THREE.MeshBasicMaterial({ color: 0xff7a2a, toneMapped: false }));
    fire.rotation.x = -PI / 2; fire.position.set(15.6, 0.86, -1.2); g.add(fire);
    c.tick((tt) => { fire.material.color.setHSL(0.06 + Math.sin(tt * 7) * 0.01, 1, 0.55 + Math.sin(tt * 11.3) * 0.06 + Math.sin(tt * 4.1) * 0.05); });
    // pools of light on the tar, so the floor reads as a lit roof and not a void
    const pool = c.canvasTex(256, 256, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,200,140,.55)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
    for (const [x, z, s] of [[6.9, 0.2, 5.5], [15.6, -1.2, 4.2], [10, 3.5, 7]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); m.rotation.x = -PI / 2; m.position.set(x, 0.012, z); g.add(m); }
    // the illusion: an empty gilt frame on an easel. From the footprints the skyline fills it exactly: the city as a Mark.
    const gilt = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 1, roughness: 0.3 });
    const fw = 2.3, fh = 1.3, fy = 1.85, fz = -7.5, fx = 12.6;
    for (const [w, h, x, y] of [[fw + 0.24, 0.12, 0, fh / 2 + 0.06], [fw + 0.24, 0.12, 0, -fh / 2 - 0.06], [0.12, fh, -fw / 2 - 0.06, 0], [0.12, fh, fw / 2 + 0.06, 0]]) g.add(c.slab(w, h, 0.08, gilt, fx + x, fy + y, fz));
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 });
    for (const s of [-1, 1]) { const leg = c.slab(0.06, 2.0, 0.06, wood, fx + s * 0.7, 1.0, fz + 0.1); leg.rotation.z = s * 0.12; g.add(leg); }
    const back = c.slab(0.06, 2.1, 0.06, wood, fx, 1.0, fz - 0.4); back.rotation.x = -0.25; g.add(back);
    const lab = c.sign('THE CITY, 3 A.M.\nNOT COUNTED · NOT FOR SALE', { w: 1.2, h: 0.22, bg: '#f2ead8', fg: '#1b1b1b', font: JB, weight: 600, px: 96 }); lab.position.set(fx, fy - fh / 2 - 0.28, fz + 0.05); g.add(lab);
    c.post(X(fx), fz, 0.8);
    spot(c, r, g, X, [fx, -3.6], 'frame', 'Look through the frame: the whole skyline, hung. MLow did not paint this one. Nobody did.');
  },
};
