// THE FOURTH FLOOR. The painting, walkable: New Yorker No. 47, The Eviction. A long low corridor of eye flower
// murals, one fluorescent tube that will not stop flickering, windows onto the J crossing the bridge, notices in the
// air. At the end of the hall, a skeleton in a cap and a long black coat. He only moves when you are not looking,
// and when the light goes out. If he reaches you, you have been served.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, paperWind, sheet, relief, stamp, glowTex, liveTex } from './kit.js';

const CX0 = 7.6, CX1 = 12.4, CZ = 1.6;   // the corridor runs north from the cross hall at z = 1.6
const WINS = [-5.4, -3.0, -0.6], DOORS = [[-5.0, '4A'], [-2.5, '4B'], [0.0, '4C']];

export function hallwaySlots(r, HT) {
  const S = [], south = D / 2 - 0.14, y = 1.6;
  for (let i = 0; i < 6; i++) S.push({ x: 1.8 + i * 3.25, y, z: south, ry: PI, w: 1.15 });
  [[-6.2], [-3.75], [-1.25]].forEach(([z]) => S.push({ x: CX0 + 0.14, y, z, ry: PI / 2, w: 0.9 }));
  S.push({ x: 0.14, y, z: 4.6, ry: PI / 2, w: 1.0 });
  return S;
}

export function hallway(c, r, g, X, mats) {
  const { THREE } = c, HI = r.h;
  // the corridor walls, murals both sides, the east one cut for windows
  g.add(c.slab(0.2, HI, CZ + D / 2, mats.wall, CX0 - 0.1, HI / 2, (CZ - D / 2) / 2)); c.wall(X(CX0), -D / 2, X(CX0), CZ);
  const east = (z0, z1, y0, h) => g.add(c.slab(0.2, h, z1 - z0, mats.wall, CX1 + 0.1, y0 + h / 2, (z0 + z1) / 2));
  let z = -D / 2; for (const wz of WINS) { east(z, wz - 0.8, 0, HI); east(wz - 0.8, wz + 0.8, 0, 1.0); east(wz - 0.8, wz + 0.8, 2.5, HI - 2.5); z = wz + 0.8; } east(z, CZ, 0, HI);
  c.wall(X(CX1), -D / 2, X(CX1), CZ);
  // the rest of the floor plan is not ours: two blocks of wall fill it, so the hall reads as a hall
  g.add(c.slab(CX0 - 0.2, HI, 0.2, mats.wall, (CX0 - 0.2) / 2, HI / 2, CZ)); c.wall(X(0), CZ, X(CX0), CZ);
  g.add(c.slab(W - CX1 - 0.2, HI, 0.2, mats.wall, CX1 + 0.2 + (W - CX1 - 0.2) / 2, HI / 2, CZ)); c.wall(X(CX1), CZ, X(W), CZ);
  // a low concrete ceiling, with the stains of a hundred winters
  const ceil = c.surf('concrete', 2, 0x4a5068);
  g.add(c.slab(W, 0.06, D, ceil, W / 2, HI + 0.03, 0));
  // the windows: steel sashes, and outside, the J on the bridge (the 4F window view, flat, far off)
  const sash = std(c, 0x2a3040, { metalness: 0.6, roughness: 0.4 });
  const view = (window.VIDEOS || []).includes('window') ? liveTex(c, 'window', r) : c.tex.load('assets/plates/window.jpg'); view.colorSpace = THREE.SRGBColorSpace;
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.8), new THREE.MeshBasicMaterial({ map: view, toneMapped: false, fog: false, color: 0xb8c4ff }));
  outside.position.set(CX1 + 4.0, 1.9, -2.9); outside.rotation.y = -PI / 2; g.add(outside);
  WINS.forEach((wz) => {
    for (const dz of [-0.8, 0, 0.8]) g.add(box(c, 0.08, 1.5, 0.06, sash, CX1 + 0.12, 1.75, wz + dz));
    for (const y of [1.0, 1.75, 2.5]) g.add(box(c, 0.08, 0.06, 1.62, sash, CX1 + 0.12, y, wz));
    const sill = box(c, 0.36, 0.06, 1.7, std(c, 0x8a8a84, { roughness: 0.8 }), CX1 + 0.02, 1.0, wz); g.add(sill);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), new THREE.MeshStandardMaterial({ color: 0x223355, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.8 }));
    glass.position.set(CX1 + 0.14, 1.75, wz); glass.rotation.y = -PI / 2; g.add(glass);
    c.clickable(glass, () => c.egg('jbridge', 'The J on the Williamsburg Bridge, every eight minutes, for forty one years. You stop hearing it in a week. You hear it again the night before you leave.'), 'The window');
  });
  // the doors along the hall, painted over by the mural, numbered by hand
  const knocked = new Set(), lines = { '4A': 'Behind 4A, a television, very loud. Nobody comes.', '4B': 'Behind 4B, nothing. 4B went in March. The mural on the door is newer than the lock.', '4C': 'Behind 4C, a woman: "If you are the marshal, I have a court date. If you are the super, the sink." Then: "Sorry about 4F, baby."' };
  DOORS.forEach(([dz, n]) => {
    const d = box(c, 0.06, 2.2, 1.0, std(c, 0x22304a, { roughness: 0.5 }), CX0 + 0.04, 1.1, dz); g.add(d);
    g.add(box(c, 0.1, 2.36, 0.08, std(c, 0x15192a), CX0 + 0.05, 1.18, dz - 0.54)); g.add(box(c, 0.1, 2.36, 0.08, std(c, 0x15192a), CX0 + 0.05, 1.18, dz + 0.54));
    const s = c.sign(n, { w: 0.3, h: 0.2, bg: null, fg: '#f4ead2', font: c.FONT, weight: 900 }); s.position.set(CX0 + 0.09, 1.9, dz); s.rotation.y = PI / 2; g.add(s);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), std(c, 0xb08a3a, { metalness: 1, roughness: 0.3 })); k.position.set(CX0 + 0.1, 1.0, dz + 0.36); g.add(k);
    c.clickable(d, () => { [0, 180, 360].forEach((t) => setTimeout(() => c.sound.thud(0.4), t)); c.toast(lines[n], 4200); knocked.add(n); if (knocked.size === 3) c.egg('knocks', 'You knocked on every door on four. Two answered. That is a good floor, for this building, this year.'); }, `Knock on ${n}`);
  });
  // the stair opening in the cross hall, behind a steel rail, going down into the dark
  const rail = std(c, 0x1a1c24, { metalness: 0.7, roughness: 0.4 });
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.6), basic(c, 0x020203)); hole.rotation.x = -PI / 2; hole.position.set(3.4, 0.005, 5.4); g.add(hole);
  for (let k = 0; k < 6; k++) g.add(box(c, 1.4, 0.05, 0.3, std(c, 0x3a3020), 2.2 + 0.2, -0.18 - k * 0.18, 6.8 - k * 0.3));
  for (const [x1, z1, x2, z2] of [[1.1, 3.6, 5.7, 3.6], [5.7, 3.6, 5.7, 7.2]]) { const L = Math.hypot(x2 - x1, z2 - z1), m = box(c, x1 === x2 ? 0.05 : L, 0.05, x1 === x2 ? L : 0.05, rail, (x1 + x2) / 2, 1.0, (z1 + z2) / 2); g.add(m); g.add(box(c, x1 === x2 ? 0.03 : L, 0.03, x1 === x2 ? L : 0.03, rail, (x1 + x2) / 2, 0.5, (z1 + z2) / 2)); for (let u = 0; u <= 1.001; u += 0.25) g.add(cyl(c, 0.022, 0.022, 1.0, rail, x1 + (x2 - x1) * u, 0.5, z1 + (z2 - z1) * u, 6)); c.wall(X(x1), z1, X(x2), z2); }
  c.wall(X(1.1), 3.6, X(1.1), 7.4);
  // fluorescent fixtures down the hall; the second one flickers, all of them die together now and then
  const tubes = [];
  for (const tz of [5.0, 2.6, -0.4, -3.4, -6.4]) { const f = new THREE.Group(); f.position.set(W / 2, HI - 0.06, tz); g.add(f); f.add(box(c, 0.3, 0.07, 1.3, std(c, 0xd8dce0, { metalness: 0.4 }), 0, 0, 0)); const tb = box(c, 0.08, 0.05, 1.2, basic(c, 0xeaf6ff), 0, -0.05, 0); f.add(tb); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(200,230,255,.35)'), transparent: true, depthWrite: false, toneMapped: false })); gl.scale.set(2.6, 1.2, 1); gl.position.y = -0.2; f.add(gl); tubes.push({ tb, gl }); }
  // notices in the air, blowing toward you down the hall, as in the painting
  const wind = paperWind(c, g, { x0: CX0 + 0.4, x1: CX1 - 0.4, y0: 0.2, y1: 2.6, z0: -6.6, z1: 7.4, n: 44, speed: 1.2, dir: 1 });
  [[8.4, -4.0, 0.3], [11.6, -1.4, 1.9], [9.0, 0.8, 2.9], [3.0, 2.4, 0.4], [16.4, 6.4, 1.2]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, ['notice', 'pink', 'yellow'][k % 3], k + 6));

  // ---- him ----
  const HOME = [10, -6.0], him = relief(c, g, 'eviction', { h: 1.92, x: HOME[0], z: HOME[1], depth: 0.26 });
  him.userData.click = () => { c.say(him, ['Nothing personal. I just carry the paper.', 'Seventy two hours. I do not make the hours.', 'Nice cap, right? It is the only thing I own that they cannot take.'][(Math.random() * 3) | 0], 3800, 2.2); c.egg('eviction', 'You looked him in the eye sockets. New Yorker No. 47, The Eviction: a skeleton in a Mets coloured cap, Brooklyn, Villains. He is the most polite man in the building.'); };
  him.userData.hint = 'The Eviction';
  const v = new THREE.Vector3(), fw = new THREE.Vector3();
  let dark = 0, nextDark = 4, served = 0, steps = 0;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) { him.position.set(HOME[0], 0, HOME[1]); dark = 0; return; }
    // the light: a steady buzz, a flutter on the second tube, and every few seconds the whole floor goes out
    nextDark -= dt; if (nextDark < 0 && dark <= 0) { dark = 0.22 + Math.random() * 0.25; nextDark = 3 + Math.random() * 5; c.sound.tick(); }
    const out = dark > 0; if (out) dark -= dt;
    tubes.forEach((q, k) => { const on = !out && !(k === 1 && Math.sin(t * 31) > 0.6); q.tb.material.color.setHex(on ? 0xeaf6ff : 0x223040); q.gl.visible = on; });
    if (c.lights[0]) c.lights[0].userData.i = out ? 0.6 : 16; if (c.lights[1]) c.lights[1].userData.i = out ? 0.4 : 12;
    // is anybody looking at him
    him.getWorldPosition(v); const dx = P.x - v.x, dz = P.z - v.z, dist = Math.hypot(dx, dz);
    c.camera.getWorldDirection(fw); const toHim = Math.atan2(-dx, -dz), look = Math.atan2(fw.x, fw.z), ang = Math.abs(((toHim - look + PI * 3) % (PI * 2)) - PI);
    const watched = !out && ang < 0.62;
    if (!watched && dist > 1.15) {
      const sp = out ? 5.5 : 1.7, k = Math.min(1, sp * dt / dist);
      let nx = him.position.x + dx * k, nz = him.position.z + dz * k;
      if (nz < CZ - 0.2) nx = Math.max(CX0 + 0.5, Math.min(CX1 - 0.5, nx));
      him.position.x = nx; him.position.z = nz; steps += sp * dt;
    }
    if (dist < 1.15 && served <= 0) {
      served = 4; stamp(c, 'EVICTION'); c.flash(0.4); wind.gust = 3;
      c.egg('served', 'Served. He was right behind you, and the paper is in your hand. You have seventy two hours. Everybody on this floor has had this paper.');
      setTimeout(() => { him.position.set(HOME[0], 0, HOME[1]); wind.gust = 1; }, 900);
    }
    if (served > 0) served -= dt;
  });
  // the door of 4F at the end of the cross hall, its notice taped at eye height
  const nt = sheet(c, g, 0, 0, 0); nt.rotation.set(0, -PI / 2, -0.03); nt.scale.setScalar(1.5); nt.position.set(W - 0.39, 1.55, 6.3);
  const f4 = c.sign('4F', { w: 0.42, h: 0.28, bg: '#b08a3a', fg: '#141414', font: c.SERIF, weight: 900 }); f4.position.set(W - 0.4, 2.05, 6.3); f4.rotation.y = -PI / 2; g.add(f4);
  const cal = decal(c, 0.5, 0.36, (q, w, h) => { q.fillStyle = '#ff7a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#141414'; q.font = `900 ${h * 0.3}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('4F THIS WAY', w / 2, h * 0.62); });
  cal.position.set(W - 0.39, 2.65, 3.8); cal.rotation.y = -PI / 2; g.add(cal);
}
