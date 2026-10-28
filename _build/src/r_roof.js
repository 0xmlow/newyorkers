// TAR BEACH. The roof over 4F: silver paint on tar, a water tower, a pigeon coop, string lights, two folding chairs,
// and the Williamsburg Bridge with the J crossing it. The trick: open the coop and the flock goes out over the river
// and draws the shape everybody on this block already knows, an eye flower, in the air above the bridge.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, prop, swap, relief, glowTex, eyeFlower, sheet, stamp, art, artTex, anamorph } from './kit.js';

export function roof(c, r, g, X) {
  const { THREE } = c;
  // the parapet along the north edge, capped with terracotta coping
  const coping = std(c, 0x9a5a3a, { roughness: 0.8 });
  g.add(box(c, W, 0.12, 0.4, coping, W / 2, 1.16, -D / 2 + 0.1));
  // ---- the water tower, on its steel legs ----
  { const T = new THREE.Group(); T.position.set(16.2, 0, -4.2); g.add(T);
    const steel = std(c, 0x2a2a2e, { metalness: 0.7, roughness: 0.5 }), cedar = std(c, 0x6a4a32, { roughness: 0.9 }), hoop = std(c, 0x3a3a3c, { metalness: 0.8, roughness: 0.4 });
    for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) T.add(box(c, 0.14, 3.2, 0.14, steel, x, 1.6, z));
    for (const y of [1.0, 2.2]) { T.add(box(c, 2.74, 0.06, 0.06, steel, 0, y, -1.3)); T.add(box(c, 2.74, 0.06, 0.06, steel, 0, y, 1.3)); T.add(box(c, 0.06, 0.06, 2.74, steel, -1.3, y, 0)); T.add(box(c, 0.06, 0.06, 2.74, steel, 1.3, y, 0)); }
    T.add(box(c, 3.0, 0.16, 3.0, cedar, 0, 3.28, 0));
    const N = 40; for (let k = 0; k < N; k++) { const a = k / N * PI * 2, st = box(c, 0.26, 3.6, 0.08, std(c, [0x6a4a32, 0x5a3e2a, 0x7a5638][k % 3], { roughness: 0.95 }), Math.cos(a) * 1.62, 5.16, Math.sin(a) * 1.62); st.rotation.y = -a + PI / 2; T.add(st); }
    for (const y of [3.8, 4.6, 5.4, 6.2, 6.8]) { const h = new THREE.Mesh(new THREE.TorusGeometry(1.67, 0.03, 6, 40), hoop); h.rotation.x = PI / 2; h.position.y = y; T.add(h); }
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.3, 24), std(c, 0x4a3a2a, { roughness: 0.9 })); cone.position.y = 7.6; T.add(cone); T.add(cyl(c, 0.1, 0.02, 0.5, steel, 0, 8.4, 0, 8));
    const lad = std(c, 0x2a2a2e, { metalness: 0.7 }); for (const dx of [-0.2, 0.2]) T.add(box(c, 0.04, 7.2, 0.04, lad, dx, 3.6, 1.72)); for (let y = 0.4; y < 7; y += 0.32) T.add(box(c, 0.44, 0.03, 0.03, lad, 0, y, 1.72));
    const tag = c.sign('N3W', { w: 1.2, h: 0.5, bg: null, fg: '#ff4fa3', font: c.FONT, weight: 900 }); tag.position.set(0, 5.0, 1.72); T.add(tag);
    // THE MARKS tower.glb, the tank with the eye flower and N3W YORKERS on it, turned so the painted side faces the roof door
    swap(c, T, 'tower', [...T.children], { h: 8.6, ry: -PI / 2 });
    c.post(X(16.2), -4.2, 2.0); }
  // ---- the pigeon coop: a wooden loft with a wire front, birds inside ----
  const coop = new THREE.Group(); coop.position.set(4.0, 0, -4.4); g.add(coop);
  const wood = std(c, 0x8a6a40, { roughness: 0.85 }), wire = c.canvasTex(256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(200,200,190,.9)'; q.lineWidth = 2; for (let k = -w; k < w * 2; k += 14) { q.beginPath(); q.moveTo(k, 0); q.lineTo(k + h, h); q.stroke(); q.beginPath(); q.moveTo(k, h); q.lineTo(k + h, 0); q.stroke(); } });
  wire.wrapS = wire.wrapT = THREE.RepeatWrapping; wire.repeat.set(3, 2);
  coop.add(box(c, 3.0, 0.1, 1.6, wood, 0, 0.6, 0)); coop.add(box(c, 3.0, 1.6, 0.06, wood, 0, 1.4, -0.8)); coop.add(box(c, 0.06, 1.6, 1.6, wood, -1.5, 1.4, 0)); coop.add(box(c, 0.06, 1.6, 1.6, wood, 1.5, 1.4, 0));
  const roofP = box(c, 3.3, 0.06, 1.9, std(c, 0x3a3a3a, { roughness: 0.9 }), 0, 2.25, 0); roofP.rotation.x = -0.12; coop.add(roofP);
  for (const x of [-1.4, 1.4]) for (const z of [-0.7, 0.7]) coop.add(box(c, 0.08, 0.6, 0.08, wood, x, 0.3, z));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.5), new THREE.MeshStandardMaterial({ map: wire, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.5 })); front.position.set(0, 1.4, 0.8); coop.add(front);
  const door = new THREE.Group(); door.position.set(0.75, 0.65, 0.81); coop.add(door); const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.3), new THREE.MeshStandardMaterial({ map: wire, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); dm.position.set(0.35, 0.65, 0); door.add(dm); door.add(box(c, 0.7, 0.05, 0.04, wood, 0.35, 1.3, 0)); door.add(box(c, 0.7, 0.05, 0.04, wood, 0.35, 0.0, 0));
  for (const [x, z] of [[-1.0, 0.1], [-0.4, -0.3], [0.2, 0.2], [0.9, -0.2]]) c.glb('pigeon', { len: 0.3, x, y: 0.66, z, ry: Math.random() * 6, parent: coop, shadow: false });
  c.wall(X(2.5), -5.25, X(5.5), -5.25); c.wall(X(2.5), -3.55, X(5.5), -3.55); c.wall(X(2.5), -5.25, X(2.5), -3.55); c.wall(X(5.5), -5.25, X(5.5), -3.55);
  const sign = c.sign('THE MLOW LOFT · EST. 1979', { w: 1.6, h: 0.18, bg: '#f2ede0', fg: '#141414', font: c.MONO, weight: 700 }); sign.position.set(0, 2.05, 0.84); coop.add(sign);

  // ---- the flock: birds out over the river, into the shape of an eye flower, and home ----
  // The flock is a painting: one bird for each cell of a 16 by 9 grid over a census New Yorker, each bird the colour of its
  // cell. Out over the river they find their places and hold the picture up over the bridge; then they come home.
  const GX = 16, GY = 9, NB = GX * GY, wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, -0.22, 0, -0.04, 0, 0.02, -0.06, 0, 0, 0.12, 0.22, 0, -0.04, 0, 0.02, -0.06], 3)); wing.computeVertexNormals();
  const flock = new THREE.InstancedMesh(wing, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }), NB); flock.frustumCulled = false; flock.visible = false; g.add(flock);
  const fp = art(r, 12), grey = new THREE.Color(0xd8dce8); for (let i = 0; i < NB; i++) flock.setColorAt(i, grey);
  { const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = GX; cv.height = GY; const q2 = cv.getContext('2d'); q2.drawImage(im, 0, 0, GX, GY); const d = q2.getImageData(0, 0, GX, GY).data; for (let i = 0; i < NB; i++) flock.setColorAt(i, new THREE.Color().setRGB(d[i * 4] / 255, d[i * 4 + 1] / 255, d[i * 4 + 2] / 255, THREE.SRGBColorSpace)); flock.instanceColor.needsUpdate = true; }; im.src = `assets/art/${fp.f}`; }
  const tgt = []; for (let i = 0; i < NB; i++) { const gx = i % GX, gy = (i / GX) | 0; tgt.push(new THREE.Vector3(W / 2 + (gx - (GX - 1) / 2) * 1.05, 12 - (gy - (GY - 1) / 2) * 1.05, -26)); }
  const B = []; for (let i = 0; i < NB; i++) B.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), ph: Math.random() * 6, d: Math.random() });
  const o = new THREE.Object3D(); let phase = -1, pt = 0, opened = 0;
  const release = () => { if (phase >= 0) return; phase = 0; pt = 0; flock.visible = true; door.rotation.y = -1.6; c.sound.whoosh(0.5, 2.4); for (let k = 0; k < 6; k++) setTimeout(() => c.sound.coo(), k * 180);
    B.forEach((b) => { b.p.set(4.0 + (Math.random() - 0.5) * 2, 1.4 + Math.random(), -3.6); b.v.set((Math.random() - 0.5) * 3, 3 + Math.random() * 3, -4 - Math.random() * 4); }); };
  c.clickable(coop, () => { release(); if (++opened === 1) setTimeout(() => c.egg('flock', `The birds went out over the river and held up a painting over the bridge, one pigeon to a pixel: ${fp.t}, No. ${fp.n}, ${fp.h}. Then they came home. They always come home. They have no lease.`), 8000); }, 'Open the coop');
  c.tick((t, dt, P, ri) => {
    if (phase < 0) return; pt += dt;
    if (phase === 0 && pt > 3.0) { phase = 1; pt = 0; }
    if (phase === 1 && pt > 9.0) { phase = 2; pt = 0; }
    if (phase === 2 && pt > 6.5) { phase = -1; flock.visible = false; door.rotation.y = 0; return; }
    const tmp = new THREE.Vector3();
    B.forEach((b, i) => {
      if (phase === 0) { b.v.y -= dt * 0.4; b.v.z -= dt * 1.2; }
      else if (phase === 1) { tmp.copy(tgt[i]).sub(b.p); const L = tmp.length(); b.v.lerp(tmp.multiplyScalar(Math.min(1.4, L) * 1.6 / Math.max(0.4, Math.sqrt(L))), Math.min(1, dt * 1.6)); if (L < 0.6) b.v.multiplyScalar(0.6); }
      else { tmp.set(4.0 + (b.d - 0.5) * 2, 1.6, -4.4).sub(b.p); b.v.lerp(tmp.multiplyScalar(0.55), Math.min(1, dt * 1.2)); }
      b.p.addScaledVector(b.v, dt);
      o.position.copy(b.p); const hold = phase === 1 && b.v.length() < 0.9; if (hold) { o.rotation.set(PI / 2, 0, 0); o.scale.set(4.6, 1, 6.2); } else { o.lookAt(b.p.x + b.v.x, b.p.y + b.v.y, b.p.z + b.v.z); const flap = 0.4 + Math.abs(Math.sin(t * 14 + b.ph)) * 1.2; o.scale.set(3.4, flap * 3.4, 3.4); } o.updateMatrix(); flock.setMatrixAt(i, o.matrix);
    });
    flock.instanceMatrix.needsUpdate = true;
  });

  // ---- string lights over the tar, sagging between two poles ----
  const poles = [[2.0, 3.2], [18.0, 3.2]]; for (const [x, z] of poles) { g.add(cyl(c, 0.04, 0.05, 2.9, std(c, 0x2a2a2a, { metalness: 0.6 }), x, 1.45, z, 8)); c.post(X(x), z, 0.2); }
  const bulbs = [], bm = new THREE.SphereGeometry(0.05, 8, 6);
  for (let k = 0; k <= 28; k++) { const u = k / 28, x = 2 + 16 * u, y = 2.85 - Math.sin(u * PI) * 0.7; const b = new THREE.Mesh(bm, basic(c, 0xffd090)); b.position.set(x, y, 3.2); g.add(b); bulbs.push(b); }
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bulbs.map((b) => b.position.clone().add(new THREE.Vector3(0, 0.05, 0)))), 60, 0.006, 4), std(c, 0x111111)); g.add(cord);
  c.tick((t) => bulbs.forEach((b, k) => { b.material.color.setHex(Math.sin(t * 0.8 + k * 1.7) > 0.97 ? 0x8a6a40 : 0xffd090); }));
  // tar beach: a towel, two folding chairs, a radio, a cooler
  const towel = decal(c, 1.0, 1.8, (q2, w, h) => { for (let k = 0; k < 9; k++) { q2.fillStyle = ['#ff4fa3', '#f4ead2', '#22d3ee'][k % 3]; q2.fillRect(0, k * h / 9, w, h / 9); } eyeFlower(q2, w / 2, h / 2, w * 0.3); });
  towel.rotation.x = -PI / 2; towel.position.set(6.4, 0.012, 4.4); towel.rotation.z = 0.3; g.add(towel);
  c.clickable(towel, () => c.egg('tarbeach', 'Tar beach: a towel on the roof in August, because the real beach is an hour on the subway and this one is free. 4F had the best roof on Broadway. Everybody said so.'), 'A towel on the tar');
  prop(c, r, g, X, 'plastic_monobloc_chair_01', 17.0, 1.6, { h: 0.8, ry: PI * 0.85, r: 0.3 }); prop(c, r, g, X, 'plastic_monobloc_chair_01', 18.2, 2.0, { h: 0.8, ry: PI * 1.05, r: 0.3 });
  prop(c, r, g, X, 'portable_cassette_player', 7.4, 4.9, { len: 0.36, ry: 0.4 });
  const cooler = box(c, 0.6, 0.42, 0.4, std(c, 0x1d4ed8, { roughness: 0.4 }), 17.6, 0.21, 3.4); g.add(cooler); g.add(box(c, 0.62, 0.06, 0.42, basic(c, 0xf4f4f4), 17.6, 0.44, 3.4)); c.post(X(17.6), 3.4, 0.35);
  // the satellite dish and an old TV aerial, pointed at nothing in particular
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 10, 0, PI * 2, 0, 0.8), std(c, 0xe8e8e8, { side: THREE.DoubleSide, roughness: 0.5 })); dish.position.set(1.0, 2.2, -6.6); dish.rotation.set(-1.1, 0.5, 0); g.add(dish); g.add(cyl(c, 0.03, 0.03, 2.0, std(c, 0x8a8a8a, { metalness: 0.8 }), 1.0, 1.0, -6.6, 6));
  const ant = new THREE.Group(); ant.position.set(19.0, 0, -6.2); g.add(ant); ant.add(cyl(c, 0.02, 0.02, 3.4, std(c, 0x8a8a8a, { metalness: 0.9 }), 0, 1.7, 0, 6)); for (let k = 0; k < 6; k++) ant.add(box(c, 1.2 - k * 0.14, 0.015, 0.015, std(c, 0x8a8a8a, { metalness: 0.9 }), 0, 2.4 + k * 0.16, 0));
  // the bulkhead you came up through, a hose, and the last of the notices, which blew up here too
  [[6.6, 5.2, 0.4], [14.4, -1.4, 2.4]].forEach(([x, z, ry], k) => sheet(c, g, x, z, ry, k ? 'pink' : 'notice', k + 17));
  // him, off duty, at the parapet with his back to you, looking at the bridge
  const him = relief(c, g, 'eviction', { h: 1.9, x: 11.4, z: -6.9, depth: 0.24, face: false }); him.rotation.y = PI;
  him.userData.click = () => { c.say(him, 'Off the clock. Best view in Brooklyn. I have been in every flat on this block and I never lived anywhere with a view.', 4400, 2.2); c.egg('offduty'); }; him.userData.hint = 'Somebody at the parapet';
  // the end: walk to the parapet and look out
  let ended = false; c.tick((t, dt, P, ri) => { if (ri === r.i && P.z < -6.4 && !ended) { ended = true; c.toast('The city keeps everything: the key, the chair on the curb, the name on the mailbox. Thank you for walking up.', 6000); c.egg('roofend', 'You came up all six flights. From up here 4F is a window like every other window. Somebody new will be in it by spring.'); } });

  // ---- chalk on the tar: from the top of the stairs a New Yorker stands up off the roof like a sign; walk on and it lies down ----
  const pk = art(r, 13), EY = [10, 6.4];
  anamorph(c, g, artTex(c, pk), { ex: EY[0], ez: EY[1], zp: 2.6, cx: 10, w: 2.2, h: 1.24, x0: 4.5, x1: 15.5, z0: 2.58, z1: -7.6, alpha: 0.9 });
  let ch = 0; const fw4 = new THREE.Vector3();
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; c.camera.getWorldDirection(fw4); const on = Math.hypot(P.x - r.x0 - EY[0], P.z - EY[1]) < 0.5 && fw4.z < -0.9 && fw4.y < -0.04; ch = on ? ch + dt : 0; if (ch > 1.2) { ch = -1e9; c.egg('tarchalk', `From the top of the stairs a painting stands up off the tar: ${pk.t}, No. ${pk.n}. It is chalk, flat on the roof, drawn for exactly this spot.`); } });
}
