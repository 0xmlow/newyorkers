// THE VESTIBULE. Hex tile, a pressed tin wainscot under nine coats of green, twenty brass mailboxes, a bulb on a cord,
// the stairs. The mailboxes go vacant one by one as the year runs (the building empties with 4F). The trick is the
// peephole of 1A: put your eye to it and you see the hall from behind yourself, and who is standing there.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, cast, prop, bulb, sheet, relief, tinTex, texMat, CH, stamp, eyeFlower, art, artTex, anamorph } from './kit.js';

const NAMES = ['ROSARIO', 'KOWALSKI', 'NGUYEN', 'FELDMAN', 'OKAFOR', 'DIAZ', 'LEVY', 'PIETRZAK', 'MORALES', 'GOLDBERG', 'BAPTISTE', 'SANTANA', 'WEISS', 'CRUZ', 'KAPLAN', 'ALVAREZ', 'MLOW', 'ORTIZ', 'FRIEDMAN', 'TORRES'];
const APTS = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4F', '5A', '5B', '5C', '5D'];
// who has gone by chapter n: 4F at the end, the others before it, in an order that is not the order of the boxes
const GONE_AT = [12, 3, 7, 99, 5, 10, 99, 2, 8, 99, 11, 4, 9, 6, 99, 12, 99, 1, 99, 10];

const L = 4.4, R = 15.6;   // the hall is eleven metres wide, not twenty: the engine's room is bigger than a tenement
export function vestibuleSlots(r, HT) {
  const S = [], y = 2.0, south = D / 2 - 0.14;
  for (let i = 0; i < 5; i++) S.push({ x: 5.8 + i * 2.1, y, z: south, ry: PI, w: 1.05 });
  [-6.6, -5.3].forEach((z) => S.push({ x: L + 0.14, y, z, ry: PI / 2, w: 0.95 })); S.push({ x: R - 0.14, y, z: -6.9, ry: -PI / 2, w: 0.95 });
  return S;
}

export function vestibule(c, r, g, X, mats) {
  const { THREE } = c, HI = r.h;
  for (const x of [L, R]) { g.add(c.slab(0.2, HI, 10, mats.wall, x + (x === L ? -0.1 : 0.1), HI / 2, -3)); g.add(c.slab(0.2, HI, 2.4, mats.wall, x + (x === L ? -0.1 : 0.1), HI / 2, 6.8)); c.wall(X(x), -D / 2, X(x), 2); c.wall(X(x), 5.6, X(x), D / 2); g.add(c.slab(0.2, HI - 3.0, 3.6, mats.wall, x + (x === L ? -0.1 : 0.1), 3.0 + (HI - 3.0) / 2, 3.8)); }
  // the wainscot: pressed tin, painted dark green, to a little over a metre, with a cap rail
  const tin = texMat(c, tinTex(c, '#2c4a38'), 1.2, { color: 0xffffff, roughness: 0.5, metalness: 0.4 });
  const cap = std(c, 0x1e3428, { roughness: 0.4, metalness: 0.3 });
  const wains = (x, z, w, ry) => { const m = c.slab(w, 1.15, 0.04, tin, 0, 0, 0); m.position.set(x, 0.575, z); m.rotation.y = ry; g.add(m); const k = c.slab(w, 0.06, 0.08, cap, 0, 0, 0); k.position.set(x, 1.18, z); k.rotation.y = ry; g.add(k); };
  wains(W / 2, D / 2 - 0.15, R - L, 0); wains(L + 0.13, -3.0, 9.6, PI / 2); wains(L + 0.13, 6.8, 2.4, PI / 2); wains(R - 0.13, -3.0, 9.6, PI / 2); wains(R - 0.13, 6.8, 2.4, PI / 2);
  // the ceiling is pressed tin too, gone cream
  const ceil = texMat(c, tinTex(c, '#d8d0bc'), 1.2, { roughness: 0.6, metalness: 0.2 });
  const cm = c.slab(R - L, 0.04, D, ceil, W / 2, HI - 0.03, 0); g.add(cm);

  // ---- twenty brass mailboxes on the west wall ----
  const brass = std(c, 0xb08a3a, { metalness: 0.85, roughness: 0.35 }), dark = std(c, 0x2a2014, { roughness: 0.8 });
  const MB = new THREE.Group(); MB.position.set(L + 0.2, 1.35, -3.4); MB.rotation.y = PI / 2; g.add(MB);
  MB.add(box(c, 2.5, 1.5, 0.12, dark, 0, 0.6, -0.05));
  const opened = new Set(), doors = [];
  for (let i = 0; i < 20; i++) {
    const col = i % 5, row = (i / 5) | 0, x = -1.0 + col * 0.5, y = 1.18 - row * 0.36;
    const d = new THREE.Group(); d.position.set(x - 0.21, y, 0.04); MB.add(d);
    const face = box(c, 0.42, 0.3, 0.02, brass, 0.21, 0, 0); d.add(face);
    const slot = box(c, 0.22, 0.03, 0.01, dark, 0.21, 0.08, 0.012); d.add(slot);
    const card = decal(c, 0.3, 0.07, (q, w, h) => { q.fillStyle = '#f2ede0'; q.fillRect(0, 0, w, h); q.fillStyle = '#141414'; q.font = `700 ${h * 0.55}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(`${APTS[i]} ${NAMES[i]}`, w / 2, h * 0.7); }, 64);
    card.position.set(0.21, -0.07, 0.013); d.add(card);
    const vac = decal(c, 0.3, 0.07, (q, w, h) => { q.fillStyle = '#c8281e'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.font = `800 ${h * 0.55}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('VACANT', w / 2, h * 0.7); }, 64);
    vac.position.set(0.21, -0.07, 0.016); vac.visible = false; d.add(vac);
    // behind the door, a fold of paper
    const pc = art(r, 12 + i), inside = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshBasicMaterial({ map: artTex(c, pc), toneMapped: false }));
    inside.position.set(x, y, -0.005); MB.add(inside);
    c.clickable(inside, () => { if (d.rotation.y === 0) return; c.openPiece(pc); c.egg('postcard', 'In every mailbox, under the notice, a postcard of a New Yorker from the block. Somebody has been sending the building its own neighbours.'); }, `A postcard in ${APTS[i]}`);
    doors.push({ d, vac, card, i });
    c.clickable(face, () => {
      const open = d.rotation.y === 0; d.rotation.y = open ? -1.9 : 0; c.sound.clink(1800);
      if (open) { opened.add(i); const gone = CH.n >= GONE_AT[i]; c.toast(gone ? `${APTS[i]}: the name is gone. The mail still comes. Most of it is for the landlord.` : i === 15 ? '4F: a notice of petition, a final notice, a lease that says NOT RENEWED, and a birthday card nobody opened yet.' : `${APTS[i]} ${NAMES[i]}: a ConEd bill, a menu, and a notice like everybody else's.`, 3600); }
      if (opened.size === 20) c.egg('mailall', 'Every box on the wall. Every one had the same letter in it, in a different envelope. That is how a building learns it is being emptied.');
      if (i === 16) c.egg('mlowbox', 'Box 5A says MLOW. The artist kept a mailbox here for the census. The mail was all New Yorkers.');
    }, `Mailbox ${APTS[i]}`);
  }
  CH.on((n) => doors.forEach((o) => { o.vac.visible = n >= GONE_AT[o.i]; o.card.visible = !o.vac.visible; }));
  c.post(X(L + 0.3), -3.4, 0.4); c.wall(X(L + 0.4), -4.7, X(L + 0.4), -2.1);
  const mbs = c.sign('LETTERS', { w: 0.8, h: 0.16, bg: null, fg: '#b08a3a', font: c.SERIF, weight: 900 }); mbs.position.set(L + 0.22, 2.3, -3.4); mbs.rotation.y = PI / 2; g.add(mbs);

  // ---- the cork board ----
  const cork = decal(c, 1.4, 0.9, (q, w, h) => { q.fillStyle = '#7a5434'; q.fillRect(0, 0, w, h); q.fillStyle = '#a07850'; q.fillRect(10, 10, w - 20, h - 20); for (let i = 0; i < 2000; i++) { q.fillStyle = Math.random() < 0.5 ? '#8a6040' : '#b08a60'; q.fillRect(10 + Math.random() * (w - 20), 10 + Math.random() * (h - 20), 2, 2); }
    const notes = [['NO HEAT?', 'CALL THE SUPER'], ['TENANT MEETING', 'TUESDAY 7PM 2B'], ['LOST CAT', 'ANSWERS TO MAMI'], ['WE ARE NOT', 'LEAVING'], ['MOVING SALE', '4F EVERYTHING GOES']];
    notes.forEach(([a, b], k) => { const x = 22 + (k % 3) * (w - 40) / 3, y = 22 + ((k / 3) | 0) * (h - 40) / 2; q.save(); q.translate(x + 40, y + 40); q.rotate((Math.random() - 0.5) * 0.12); q.fillStyle = ['#f2ede0', '#f4e6a8', '#f6d6e4'][k % 3]; q.fillRect(-40, -40, (w - 70) / 3, (h - 60) / 2); q.fillStyle = '#141414'; q.font = `800 13px ${c.FONT}`; q.textAlign = 'left'; q.fillText(a, -34, -18); q.font = `500 11px ${c.MONO}`; q.fillText(b, -34, 0); q.fillStyle = '#c8281e'; q.beginPath(); q.arc(-30, -34, 4, 0, 7); q.fill(); q.restore(); });
  }, 512);
  cork.position.set(L + 0.2, 2.0, -0.9); cork.rotation.y = PI / 2; g.add(cork);
  c.clickable(cork, () => c.egg('meeting', 'TENANT MEETING, TUESDAY, 2B. Eleven people came the first time. Four came in March. In July, 2B had moved.'), 'The cork board');

  // ---- the radiator, which knocks ----
  const rad = new THREE.Group(); rad.position.set(R - 0.4, 0, 0.6); g.add(rad);
  const iron = std(c, 0x5a5048, { metalness: 0.7, roughness: 0.55 });
  for (let k = 0; k < 14; k++) rad.add(box(c, 0.16, 0.8, 0.07, iron, 0, 0.5, -0.6 + k * 0.09));
  rad.add(box(c, 0.2, 0.06, 1.3, iron, 0, 0.92, -0.02)); rad.add(box(c, 0.2, 0.06, 1.3, iron, 0, 0.1, -0.02));
  rad.add(cyl(c, 0.025, 0.025, HI, iron, -0.05, HI / 2, 0.75, 8));
  c.post(X(R - 0.4), 0.6, 0.6);
  c.clickable(rad, () => { [0, 160, 330, 900, 1050].forEach((d) => setTimeout(() => { c.sound.thud(0.35); c.sound.clink(900); }, d)); c.egg('knock', 'The radiator answers. Bang bang bang, pause, bang bang. In this building that is how the super says the heat is coming. It was always coming.'); }, 'Knock on the radiator');

  // ---- the stairs: a straight run up into the dark, behind the newel post ----
  const wood = std(c, 0x4a2c18, { roughness: 0.55 }), tread = std(c, 0x6a4a30, { roughness: 0.7 });
  const SX = R - 0.9, SZ0 = -1.4, N = 16, RISE = HI / N, RUN = 0.26;
  for (let k = 0; k < N; k++) { g.add(box(c, 1.4, 0.05, RUN + 0.03, tread, SX, (k + 1) * RISE, SZ0 - k * RUN)); g.add(box(c, 1.4, RISE, 0.03, wood, SX, (k + 0.5) * RISE, SZ0 - k * RUN + RUN / 2)); }
  const str = box(c, 0.08, 0.3, Math.hypot(N * RUN, HI) + 0.2, wood, SX - 0.74, HI / 2 + 0.1, SZ0 - N * RUN / 2); str.rotation.x = Math.atan2(HI, N * RUN); g.add(str);
  const rail = box(c, 0.07, 0.07, Math.hypot(N * RUN, HI) + 0.2, wood, SX - 0.72, HI / 2 + 1.0, SZ0 - N * RUN / 2); rail.rotation.x = Math.atan2(HI, N * RUN); g.add(rail);
  for (let k = 0; k < N; k += 1) g.add(cyl(c, 0.016, 0.016, 0.9, wood, SX - 0.72, (k + 1) * RISE + 0.45, SZ0 - k * RUN, 6));
  const newel = new THREE.Group(); newel.position.set(SX - 0.72, 0, SZ0 + 0.4); g.add(newel); newel.add(box(c, 0.22, 1.25, 0.22, wood, 0, 0.62, 0)); { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), wood); ball.position.y = 1.35; newel.add(ball); }
  c.wall(X(SX - 0.8), SZ0 + 0.5, X(SX - 0.8), -7.6); c.wall(X(SX - 0.8), SZ0 + 0.5, X(SX + 0.75), SZ0 + 0.5); c.wall(X(SX + 0.75), SZ0 + 0.5, X(SX + 0.75), -7.6);
  const up = c.sign('4F IS FOUR FLIGHTS UP · THE DOOR ON THE RIGHT', { w: 2.4, h: 0.18, bg: '#0d0d0d', fg: '#f4ead2', font: c.MONO, weight: 700 }); up.position.set(SX, 1.4, SZ0 + 0.56); g.add(up);

  // ---- the door of 1A, with the peephole ----
  const DZ = 6.8, dx = R - 0.07;
  g.add(box(c, 0.08, 2.3, 1.05, std(c, 0x5a2a1a, { roughness: 0.45 }), dx - 0.02, 1.15, DZ));
  g.add(box(c, 0.12, 2.5, 0.12, std(c, 0x3a2416), dx, 1.25, DZ - 0.58)); g.add(box(c, 0.12, 2.5, 0.12, std(c, 0x3a2416), dx, 1.25, DZ + 0.58)); g.add(box(c, 0.12, 0.12, 1.3, std(c, 0x3a2416), dx, 2.48, DZ));
  const lbl = c.sign('1A', { w: 0.24, h: 0.16, bg: '#b08a3a', fg: '#141414', font: c.SERIF, weight: 900 }); lbl.position.set(dx - 0.08, 1.95, DZ); lbl.rotation.y = -PI / 2; g.add(lbl);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), std(c, 0xb08a3a, { metalness: 1, roughness: 0.3 })); knob.position.set(dx - 0.09, 1.0, DZ + 0.36); g.add(knob);
  const hole = new THREE.Group(); hole.position.set(dx - 0.075, 1.56, DZ); hole.rotation.z = PI / 2; g.add(hole);
  hole.add(cyl(c, 0.03, 0.03, 0.03, std(c, 0xd0a848, { metalness: 1, roughness: 0.2 }), 0, 0, 0, 16)); const lens = cyl(c, 0.016, 0.016, 0.035, basic(c, 0x88aaff), 0, 0, 0, 12); hole.add(lens);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.copy(hole.position); g.add(hit);
  // the view through it: a second camera behind you, a fisheye, and somebody in it
  const RT = new THREE.WebGLRenderTarget(c.MOBILE ? 384 : 640, c.MOBILE ? 384 : 640);
  const pc = new THREE.PerspectiveCamera(118, 1, 0.05, 80);
  const lensMat = new THREE.ShaderMaterial({ uniforms: { t: { value: RT.texture }, k: { value: 0 }, asp: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform sampler2D t; uniform float k; uniform float asp; varying vec2 vUv; void main(){ vec2 p = vUv * 2. - 1.; p.x *= asp; float r = length(p); if (r > 1.) { gl_FragColor = vec4(0.,0.,0.,k); return; } vec2 q = p * (0.62 + 0.38 * r * r); vec3 col = texture2D(t, q * .5 + .5).rgb; col *= smoothstep(1., .82, r); col = mix(col, col * vec3(.9,1.,1.1), .3); gl_FragColor = vec4(col, k); }' });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lensMat); view.renderOrder = 999; view.frustumCulled = false; view.visible = false;
  if (!c.camera.parent) c.scene.add(c.camera); c.camera.add(view); view.position.set(0, 0, -0.2);
  const me = c.glb('agent', { h: 1.78, parent: g }); me.visible = false;
  const him = relief(c, g, 'eviction', { h: 1.95, x: 0, z: 0, face: false }); him.visible = false;
  let peep = 0, seen = false;
  c.clickable(hit, () => { if (peep > 0) return; peep = 6.5; c.sound.tick(); if (!seen) { seen = true; setTimeout(() => c.egg('peep', 'Through the peephole of 1A: the hall, from behind you. You, standing at a door. And right behind you, in a Mets coloured cap, him. Turn round. Nobody there.'), 2500); } }, 'Look through the peephole');
  const fw = new THREE.Vector3();
  c.tick((t, dt, P, ri) => {
    if (peep <= 0 || ri !== r.i) { if (view.visible) { view.visible = false; me.visible = false; him.visible = false; peep = 0; } return; }
    peep -= dt; const a = Math.min(1, Math.min(6.5 - peep, peep) * 2.4); lensMat.uniforms.k.value = a;
    const asp = innerWidth / innerHeight, S = 2 * 0.2 * Math.tan(c.camera.fov * PI / 360); view.scale.set(S * asp * 1.02, S * 1.02, 1); lensMat.uniforms.asp.value = asp * 1.02 / 0.92;
    // you, from behind, and him just behind you
    c.camera.getWorldDirection(fw); fw.y = 0; fw.normalize();
    me.position.set(P.x - r.x0, 0, P.z); me.rotation.y = P.yaw; me.visible = true;
    him.position.set(P.x - r.x0 - fw.x * 1.0 - fw.z * 0.6, 0, P.z - fw.z * 1.0 + fw.x * 0.6); him.rotation.y = P.yaw; him.visible = true;
    pc.position.set(P.x - fw.x * 3.2, 1.75, P.z - fw.z * 3.2); pc.lookAt(P.x, 1.35, P.z);
    view.visible = false; const old = c.renderer.getRenderTarget(); c.renderer.setRenderTarget(RT); c.renderer.render(c.scene, pc); c.renderer.setRenderTarget(old);
    view.visible = true; me.visible = false; him.visible = false;
    if (peep <= 0) { view.visible = false; stamp(c, '1A', 700); }
  });

  // ---- the light: one bare bulb on a cord, swinging a little, the way it does when the door slams ----
  const bl = bulb(c, g, 9.2, HI, 1.6, 0xffc070, 0.9);
  c.tick((t, dt, P, ri) => { bl.rotation.z = Math.sin(t * 1.4) * 0.05; bl.rotation.x = Math.cos(t * 1.1) * 0.03; if (ri === r.i && c.lights[0]) { const fl = Math.sin(t * 23) > 0.93 || Math.sin(t * 3.1) > 0.995; c.lights[0].userData.i = fl ? 4 : 16; bl.userData.bulb.material.color.setHex(fl ? 0x664422 : 0xffc070); } });
  c.clickable(bl, () => c.egg('bulb', 'Forty watts. The landlord replaced it once in eleven years, the week before the building was sold.'), 'The bulb');

  // ---- the super, leaning on his broom by the stairs ----
  cast(c, r, g, X, 'tough', 13.0, -5.6, { h: 1.8, ry: 0.7, line: 'Twenty two years I fixed every boiler and every toilet in this building. This morning they gave me a drill and the address of a locksmith. 4F.', egg: 'super', hint: 'The super' });
  // the door of the building behind you, its glass lettered
  const gl = c.sign('N3W · PLEASE CLOSE THE DOOR · NO MENUS', { w: 3.4, h: 0.22, bg: null, fg: '#f5c542', font: c.MONO, weight: 700 }); gl.position.set(W / 2, 2.7, D / 2 - 0.16); gl.rotation.y = PI; g.add(gl);
  [[5.4, 3.0, 0.3], [8.1, -2.0, 1.2], [11.0, 4.5, 2.1], [6.6, -5.5, 0.9]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, ['notice', 'yellow', 'pink'][k % 3], k + 3));
  prop(c, r, g, X, 'metal_trash_can', L + 0.7, 7.2, { h: 0.9, r: 0.35 });
  const eye = decal(c, 0.5, 0.5, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.9)); eye.position.set(W / 2 - 3, 3.2, D / 2 - 0.16); eye.rotation.y = PI; g.add(eye);

  // ---- the chalk painting: a New Yorker painted flat across the hex tiles, stretched so that from the doormat it stands
  // up out of the floor like a framed picture on an easel. Two steps either way and it is a smear on the tile again. ----
  const EYE = [10, 6.2], pk = art(r, 20);
  anamorph(c, g, artTex(c, pk), { ex: EYE[0], ez: EYE[1], zp: 2.4, cx: 10, w: 2.0, h: 1.12, x0: 5.0, x1: 15.0, z0: 2.38, z1: -7.6, alpha: 0.95 });
  const mat = decal(c, 0.8, 0.5, (q, w, h) => { q.fillStyle = '#f4ead2'; for (const sx of [-1, 1]) { q.beginPath(); q.ellipse(w / 2 + sx * w * 0.12, h * 0.4, w * 0.07, h * 0.22, 0, 0, 7); q.fill(); } q.font = `800 ${h * 0.13}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('THE DOORMAT · LOOK DOWN THE HALL', w / 2, h * 0.92); }, 256);
  mat.rotation.x = -PI / 2; mat.position.set(EYE[0], 0.016, EYE[1]); g.add(mat);
  let chalk = 0; const fw2 = new THREE.Vector3();
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; c.camera.getWorldDirection(fw2); const on = Math.hypot(P.x - r.x0 - EYE[0], P.z - EYE[1]) < 0.45 && fw2.z < -0.9 && fw2.y < -0.05; chalk = on ? chalk + dt : 0; if (chalk > 1.2) { chalk = -1e9; c.egg('chalk', `From the doormat the tiles stand up into a painting: ${pk.t}, No. ${pk.n}, ${pk.h}. It is painted flat on the floor. Take one step and it falls back into the tile.`); } });
  const hit2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 9.8), new THREE.MeshBasicMaterial({ visible: false })); hit2.rotation.x = -PI / 2; hit2.position.set(10, 0.02, -2.6); g.add(hit2);
  c.clickable(hit2, () => c.openPiece(pk), 'The painting on the floor');
}
