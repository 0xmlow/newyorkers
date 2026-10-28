// THE TWO WAY MIRROR. A precinct interview room cut in half by a wall of one way glass. Each pane is a pair:
// with your side lit, the glass is a mirror and shows word A; with their side lit you see through it to word B,
// sitting in the room behind. The switch by the door turns the lights over (and has a half way click: Pepper's
// ghost, both at once). Put your face up to the glass and cup your hands and you see through anyway, like in life.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl } from './kit.js';
import { pairs, pairTex, openPair, plaque, label, dress } from './pairs.js';

const GZ = -1.4;   // the glass wall

export function interrogation(c, r, g, X, mats) {
  const { THREE } = c, HI = r.h, P = pairs('interrogation');
  // ---- the wall of glass: steel mullions, six panes ----
  const steel = std(c, 0x50565a, { metalness: 0.7, roughness: 0.4 }), wallM = (mats && mats.wall) || std(c, 0x4a5448, { roughness: 0.85 });   // the glass wall wears the room's precinct green wallpaper
  g.add(box(c, W, 0.9, 0.2, wallM, W / 2, 0.45, GZ)); g.add(box(c, W, HI - 2.9, 0.2, wallM, W / 2, 2.9 + (HI - 2.9) / 2, GZ));
  c.wall(X(0), GZ + 0.12, X(W), GZ + 0.12);
  const PW = 2.6, PH = 2.0, panes = [];
  const xs = [2.0, 5.2, 8.4, 11.6, 14.8, 18.0];
  for (let i = 0; i <= xs.length; i++) { const a = i === 0 ? 0 : xs[i - 1] + PW / 2, b = i === xs.length ? W : xs[i] - PW / 2; g.add(box(c, b - a, 2.0, 0.24, steel, (a + b) / 2, 1.9, GZ)); }
  // their room: darker, a table and one chair under a bulb for every pane, and word B sitting in it
  const back = std(c, 0x2a302a, { roughness: 0.9 });
  const theirLights = [];
  P.slice(0, xs.length).forEach((p, k) => {
    const x = xs[k];
    // B sits behind, a step back, lit by its own bulb
    const bw = 1.5, bh = bw / 0.74;
    const B = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshStandardMaterial({ map: pairTex(c, p, 'b'), emissiveMap: pairTex(c, p, 'b'), emissive: 0xffffff, emissiveIntensity: 0.02, roughness: 0.8 })); B.position.set(x, 1.95, -6.6); g.add(B);
    g.add(box(c, bw + 0.1, bh + 0.1, 0.04, std(c, 0x2a2a2a), x, 1.95, -6.64)); for (const dx of [-0.5, 0.5]) g.add(box(c, 0.05, 1.95, 0.05, std(c, 0x3a3a3a), x + dx, 0.6, -6.5));   // on an easel, like a lineup
    g.add(box(c, 1.1, 0.06, 0.7, std(c, 0x8a8a80, { metalness: 0.5 }), x, 0.74, -4.4)); g.add(cyl(c, 0.03, 0.03, 0.72, steel, x - 0.45, 0.36, -4.4)); g.add(cyl(c, 0.03, 0.03, 0.72, steel, x + 0.45, 0.36, -4.4));
    const bulb = new THREE.PointLight(0xfff0d0, 0, 6, 1.6); bulb.position.set(x, 3.2, -5.2); g.add(bulb); theirLights.push(bulb);
    // A is the mirror: it lives in the glass, so it is the same picture from anywhere on your side
    const aw = PW - 0.2, ah = PH - 0.1;
    const Am = new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'a'), toneMapped: false, transparent: true, opacity: 1, depthWrite: false });
    const A = new THREE.Mesh(new THREE.PlaneGeometry(ah * 0.74, ah), Am); A.position.set(x, 1.9, GZ + 0.13); g.add(A);
    const tint = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), new THREE.MeshBasicMaterial({ color: 0x8aa0a8, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); tint.position.set(x, 1.9, GZ + 0.125); g.add(tint);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), basic(c, 0, { transparent: true, opacity: 0, depthWrite: false })); hit.position.set(x, 1.9, GZ + 0.14); g.add(hit);
    c.clickable(hit, () => openPair(c, p), label(p));
    plaque(c, g, p, x, 0.7, GZ + 0.12, 0, 1.7, { bg: '#e8e4d8', fg: '#1a1a1a', border: '#1a1a1a' });
    panes.push({ p, A: Am, tint, B, x: r.x0 + x, see: 0 });
  });
  // ---- the switch: OURS, HALF, THEIRS ----
  const MODES = [['OURS', 0], ['HALF', 0.5], ['THEIRS', 1]];
  let mode = 0, lv = 0;
  const plate = new THREE.Group(); plate.position.set(0.14, 1.4, 6.8); plate.rotation.y = PI / 2; g.add(plate);
  plate.add(box(c, 0.16, 0.26, 0.02, std(c, 0xe8e4d8), 0, 0, 0));
  const tog = box(c, 0.04, 0.09, 0.05, std(c, 0xf4f0e4), 0, 0.03, 0.03); plate.add(tog);
  const labs = MODES.map(([m], i) => { const s = c.sign('LIGHTS: ' + m, { w: 0.6, h: 0.1, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700, px: 64 }); s.position.set(0, 0.24, 0.01); s.visible = !i; plate.add(s); return s; });
  c.clickable(plate.children[0], () => {
    mode = (mode + 1) % 3; c.sound.click(); tog.position.y = [0.03, 0, -0.03][mode];
    labs.forEach((s, i) => { s.visible = i === mode; });
    c.toast(['Your side lit. The glass is a mirror. You see the first word.', 'Half and half. Both words at once, a ghost in the glass.', 'Their side lit. You see who is really sitting in there.'][mode], 3000);
    if (mode === 1) c.egg('ghost', 'Pepper\'s ghost: half the light on each side and the glass shows both at once.'); else if (mode === 2) c.egg('theirside');
  }, 'The light switch');
  // our room: the table, two chairs, a lamp, the case board
  g.add(box(c, 2.2, 0.06, 1.0, std(c, 0x7a7a70, { metalness: 0.4 }), 10, 0.76, 3.6)); for (const dx of [-1, 1]) for (const dz of [-0.4, 0.4]) g.add(cyl(c, 0.03, 0.03, 0.74, steel, 10 + dx, 0.37, 3.6 + dz));
  c.wall(X(8.8), 3.0, X(11.2), 3.0); c.wall(X(8.8), 4.2, X(11.2), 4.2); c.wall(X(8.8), 3.0, X(8.8), 4.2); c.wall(X(11.2), 3.0, X(11.2), 4.2);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.25, 16, 1, true), std(c, 0x2a2a2a, { side: THREE.DoubleSide })); lamp.position.set(10, HI - 0.6, 3.6); g.add(lamp);
  const det = c.glb('agent', { h: 1.8, x: 12.2, z: 3.6, ry: -PI / 2, parent: g }); c.post(X(12.2), 3.6, 0.35);
  c.clickable(det, () => { c.say(det, 'Look at the glass. Is he the liar, or the one with the harp? Take your time. We have all night.', 4000, 2.1); c.egg('detective'); }, 'The detective');
  // the evidence board: the pairs on string, the way a case is made
  const board = c.canvasTex(1024, 640, (q, w, h) => {
    q.fillStyle = '#8a6a40'; q.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; q.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    q.font = `800 30px ${c.MONO}`; q.textAlign = 'center';
    const pts = P.slice(0, 6).map((p, i) => [120 + (i % 3) * 390, 150 + Math.floor(i / 3) * 300]);
    q.strokeStyle = '#c81e1e'; q.lineWidth = 3; q.beginPath(); pts.forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y)); q.lineTo(pts[0][0], pts[0][1]); q.stroke();
    P.slice(0, 6).forEach((p, i) => { const [x, y] = pts[i]; q.fillStyle = '#f4f0e4'; q.fillRect(x - 160, y - 50, 320, 100); q.fillStyle = '#1a1a1a'; q.fillText(p.a, x, y - 8); q.fillText('// ' + p.b, x, y + 30); q.fillStyle = '#c81e1e'; q.beginPath(); q.arc(x, y - 54, 9, 0, 7); q.fill(); });
  });
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), new THREE.MeshStandardMaterial({ map: board, roughness: 0.9 })); bd.position.set(W - 0.16, 1.9, 4.6); bd.rotation.y = -PI / 2; g.add(bd);
  c.clickable(bd, () => c.egg('caseboard', 'The case board. Every suspect has an alibi that sounds exactly like his own name.'), 'The case board');

  // ---- the light, every frame ----
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return;
    lv += (MODES[mode][1] - lv) * Math.min(1, dt * 4);
    for (const s of panes) {
      // cup your hands to the glass: within a metre, you see through whatever the lights say
      const close = Math.abs(Pl.x - s.x) < 1.3 && Pl.z - (GZ) < 1.1 ? 1 : 0;
      s.see += ((Math.max(lv, close * 0.85)) - s.see) * Math.min(1, dt * 5);
      s.A.opacity = 1 - s.see; s.tint.material.opacity = 0.35 * (1 - s.see) + 0.08;
      s.B.material.emissiveIntensity = 0.02 + s.see * 0.9;
      if (close && !s.cupped) { s.cupped = true; c.egg('cupped', 'Hands cupped to the glass: you see through a one way mirror if it is darker on your side. Everybody in this precinct knows. Nobody says.'); }
    }
    theirLights.forEach((l) => { l.intensity = 0.2 + lv * 9; });
  });
  // the room's furniture (Poly Haven CC0): theirs behind the glass, ours on this side
  dress(c, r, g, X, [
    ['SchoolChair_01', 9.2, 3.6, { h: 0.85, ry: PI / 2 }], ['SchoolChair_01', 10.8, 3.6, { h: 0.85, ry: -PI / 2 }], ['clipboard', 10.2, 3.5, { h: 0.03, y: 0.8, ry: 0.3 }],
    ['desk_lamp_arm_01', 9.6, 3.9, { h: 0.45, y: 0.79, ry: 0.8 }], ['metal_trash_can', 1.2, 7.2, { h: 0.7 }], ['fire_alarm', 0.15, 1.2, { h: 0.2, y: 1.6, ry: PI / 2 }],
    ['metal_office_desk', 3.4, -4.6, { len: 1.6, ry: 0.2 }], ['metal_office_desk', 16.8, -4.6, { len: 1.6, ry: -0.2 }], ['drawer_cabinet', 0.8, -7.2, { h: 1.3 }],
    ['vintage_telephone_wall_clock', 19.5, -3.0, { h: 0.5, y: 2.6, ry: -PI / 2 }], ['security_camera_01', 19.4, 7.4, { h: 0.3, y: 3.2, ry: -2.4 }],
  ], [
    ['bluesteel', 4.6, 6.0, -2.6, 'Lights on our side, he is a liar. Lights on theirs, he plays the lyre. The DA wants to know which one we are charging.'],
  ]);
  // the sign on the door, in quotation marks
  const dsg = c.sign('"INTERVIEW" // "IN A VIEW"', { w: 2.0, h: 0.26, bg: '#e8e4d8', fg: '#1a1a1a', font: c.MONO, weight: 800, border: '#ff6b00' }); dsg.position.set(0.15, 3.0, 3.8); dsg.rotation.y = PI / 2; g.add(dsg);
}
