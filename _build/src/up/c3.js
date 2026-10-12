// Round thirteen batch c3: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// Sets: dogday, fame, annie, unisphere, mcmlow, bramford, apartment, chase, birdman, network, gems, smoke, mail.
// No new lights: practicals are emissive (colours over 1 bloom), glow sprites and additive geometry. Every tick is gated
// on its set being near, and allocates nothing.
const PI = Math.PI;
const near = (r, ri) => Math.abs(ri - r.i) <= 1;

// ---------- small kit ----------
// an emissive colour that blooms: k over 1 pushes it past the bloom threshold
function hot(c, hex, k = 1.6, o = {}) { const m = new c.THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.color.set(hex).multiplyScalar(k); return m; }
function halo(c, K, g, x, y, z, col = 'rgba(255,230,180,.55)', s = 1.2) {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a soft vertical gradient, bright at the top, for light shafts and beams
let _GRAD;
function gradTex(c) { return _GRAD ||= c.canvasTex(8, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
// a cone of light, open, additive, top at (x, y, z) pointing down unless rotated
function shaft(c, g, x, y, z, r0, r1, h, col, op = 0.18) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 28, 1, true), new THREE.MeshBasicMaterial({ map: gradTex(c), color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.geometry.translate(0, -h / 2, 0); m.position.set(x, y, z); g.add(m); return m;
}
// a flat plane with a canvas texture; o: basic (unlit), add (additive), op, glow (colour multiplier)
function panel(c, g, w, h, draw, px, x, y, z, o = {}) {
  const { THREE } = c, t = c.canvasTex(Math.round(px * w / h), px, draw);
  const mat = o.basic || o.add ? new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: !!(o.add || o.alpha), opacity: o.op ?? 1, depthWrite: !o.add && !o.alpha, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: !o.add })
    : new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, transparent: !!o.alpha, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
  if (o.glow) mat.color.setScalar(o.glow);
  if (o.floor) { mat.polygonOffset = true; mat.polygonOffsetFactor = -2; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z);
  if (o.floor) m.rotation.x = -PI / 2; else if (o.ceil) m.rotation.x = PI / 2; if (o.ry) m.rotation.y = o.ry;
  g.add(m); return m;
}
// a ceiling skin under the set's own (the plaster ceilings read as a black void): pressed tin, acoustic tile, coffers
function ceiling(c, g, draw, rep = [10, 8], o = {}) {
  const { THREE } = c, t = c.canvasTex(256, 256, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 19.5, o.d || 15.6), new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.5, metalness: o.metal ?? 0.3, color: o.tint ?? 0xffffff }));
  m.rotation.x = PI / 2; m.position.set(o.x ?? 10, o.y ?? 5.97, o.z ?? 0); g.add(m); return m;
}
const tin = (base, hi) => (q, w, h) => {
  q.fillStyle = base; q.fillRect(0, 0, w, h);
  q.strokeStyle = hi; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.lineWidth = 3; q.strokeRect(26, 26, w - 52, h - 52);
  q.beginPath(); q.arc(w / 2, h / 2, 54, 0, 7); q.stroke(); q.beginPath(); q.arc(w / 2, h / 2, 30, 0, 7); q.stroke();
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; q.beginPath(); q.ellipse(w / 2 + Math.cos(a) * 42, h / 2 + Math.sin(a) * 42, 12, 5, a, 0, 7); q.stroke(); }
  q.fillStyle = 'rgba(0,0,0,.35)'; q.fillRect(0, h - 6, w, 6); q.fillRect(w - 6, 0, 6, h);
  q.globalAlpha = 0.12; for (let i = 0; i < 900; i++) { q.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } q.globalAlpha = 1;
};
// dust in the air, drifting; cheap points, half on a phone
function motes(c, r, g, n, x0, x1, y0, y1, z0, z1, col = 0xffe8c0, size = 0.03, op = 0.6) {
  const { THREE } = c; n = c.MOBILE ? n >> 1 : n;
  const p = new Float32Array(n * 3), s = new Float32Array(n); for (let k = 0; k < n; k++) { p[k * 3] = x0 + Math.random() * (x1 - x0); p[k * 3 + 1] = y0 + Math.random() * (y1 - y0); p[k * 3 + 2] = z0 + Math.random() * (z1 - z0); s[k] = Math.random() * 6.3; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  pts.frustumCulled = false; g.add(pts);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < n; k++) { p[k * 3] += Math.sin(t * 0.3 + s[k]) * dt * 0.05; p[k * 3 + 1] += (Math.cos(t * 0.2 + s[k] * 2) * 0.04 + 0.01) * dt; if (p[k * 3 + 1] > y1) p[k * 3 + 1] = y0; } geo.attributes.position.needsUpdate = true; });
  return pts;
}
// an instanced field of one geometry: list of [x, y, z, ry, s, colour]
function field(c, g, geo, mat, list) {
  const { THREE } = c, m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(), col = new THREE.Color();
  list.forEach(([x, y, z, ry = 0, s = 1, cc], k) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix(); m.setMatrixAt(k, o.matrix); if (cc != null) m.setColorAt(k, col.set(cc)); });
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; g.add(m); return m;
}
// a hanging catenary of lit bulbs and its wire
function garland(c, r, g, x1, x2, y, z, sag, n, col = 0xffd890, k = 2.2) {
  const { THREE } = c, pts = [], list = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3(x1 + (x2 - x1) * u, y - sag * 4 * u * (1 - u), z)); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x111111 })));
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; list.push([x1 + (x2 - x1) * u, y - sag * 4 * u * (1 - u) - 0.06, z]); }
  return field(c, g, new THREE.SphereGeometry(0.05, 8, 6), hot(c, col, k), list);
}
function noise(q, w, h, n, a = 0.1, cols = ['#000', '#fff'], s = 2) { q.globalAlpha = a; for (let i = 0; i < n; i++) { q.fillStyle = cols[i % cols.length]; q.fillRect(Math.random() * w, Math.random() * h, s, s); } q.globalAlpha = 1; }
// a floor mark for the spot an illusion resolves from
function mark(c, K, g, x, z, text, ry = 0) {
  const m = panel(c, g, 1.1, 1.1, (q, w, h) => { q.strokeStyle = '#f5c542'; q.lineWidth = 10; q.beginPath(); q.arc(w / 2, h / 2, w * 0.44, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, h * 0.42, w * 0.2);
    q.fillStyle = '#f5c542'; q.font = `700 ${h * 0.075}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(text, w / 2, h * 0.78); }, 256, x, 0.014, z, { basic: true, alpha: true, floor: true, glow: 1.1 });
  m.rotation.z = ry; return m;
}

// ---------- the anamorphic floor: paint what a 3D thing would look like from one eye, onto the floor ----------
// draw(q, P) gets P(x, y, z) giving canvas coordinates of the floor point that hides (x, y, z) from the eye E.
function anamorph(c, g, E, x0, x1, z0, z1, px, draw, o = {}) {
  const cw = px, ch = Math.round(px * (z1 - z0) / (x1 - x0));
  const P = (x, y, z) => { const t = E.y / (E.y - y), fx = E.x + (x - E.x) * t, fz = E.z + (z - E.z) * t; return [(fx - x0) / (x1 - x0) * cw, (fz - z0) / (z1 - z0) * ch]; };
  const poly = (q, pts, fill) => { q.beginPath(); pts.forEach(([x, y, z], i) => { const [u, v] = P(x, y, z); i ? q.lineTo(u, v) : q.moveTo(u, v); }); q.closePath(); q.fillStyle = fill; q.fill(); };
  return panel(c, g, x1 - x0, z1 - z0, (q) => draw(q, P, poly, cw, ch), ch, (x0 + x1) / 2, o.y ?? 0.013, (z0 + z1) / 2, { basic: true, floor: true, alpha: !!o.alpha, glow: o.glow });
}

export const PROPS = {};

export const ROOM = {
  // ---------------- DOG DAY AFTERNOON: the bank, a hundred degrees ----------------
  dogday(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, heat: 0.45, bloom: 1.05, vig: 0.5, sat: 1.1 };
    // ILLUSION: a trompe l'oeil pit. The floor in front of the benches is painted, from the eye on the mark, as the open
    // vault four metres down: ladder, block walls, the money on the floor at the bottom. Walk over it; it is paint.
    const E = new THREE.Vector3(10, 1.62, 4.4), HX0 = 8.3, HX1 = 11.7, HZ0 = -1.2, HZ1 = 2.2, DEP = 1.9;
    const pit = anamorph(c, g, E, HX0, HX1, HZ0, HZ1, 1024, (q, Pp, poly, w, h) => {
      q.fillStyle = '#050403'; q.fillRect(0, 0, w, h);
      // block walls, banded darker as they go down, with mortar courses
      const walls = [[[HX0, HZ0], [HX1, HZ0]], [[HX0, HZ1], [HX0, HZ0]], [[HX1, HZ0], [HX1, HZ1]]];
      // the bottom first (the farthest thing), lit gold by the money
      poly(q, [[HX0, -DEP, HZ0], [HX1, -DEP, HZ0], [HX1, -DEP, HZ1], [HX0, -DEP, HZ1]], '#2a2010');
      for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) { const x = HX0 + 0.15 + i * 0.36, z = HZ0 + 0.12 + j * 0.3, hh = 0.12 + ((i * 7 + j * 3) % 5) * 0.05; if ((i + j) % 3 === 0) continue;
        const cx = x + 0.13, cz = z + 0.08, y0 = -DEP, y1 = -DEP + hh, gold = (i * j) % 4 === 1;
        poly(q, [[x, y1, z], [cx + 0.13, y1, z], [cx + 0.13, y1, cz + 0.08], [x, y1, cz + 0.08]], gold ? '#ffd76a' : '#7fae6a');
        poly(q, [[x, y0, cz + 0.08], [cx + 0.13, y0, cz + 0.08], [cx + 0.13, y1, cz + 0.08], [x, y1, cz + 0.08]], gold ? '#a8781a' : '#3e5e34'); }
      walls.forEach(([[ax, az], [bx, bz]], wi) => {
        for (let b = 0; b < 14; b++) { const y0 = -b * DEP / 14, y1 = -(b + 1) * DEP / 14, l = 40 - b * 2.4 - (wi ? 7 : 0);
          poly(q, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], `hsl(30,14%,${Math.max(4, l)}%)`);
          q.strokeStyle = 'rgba(0,0,0,.45)'; q.lineWidth = 2; const [u0, v0] = Pp(ax, y1, az), [u1, v1] = Pp(bx, y1, bz); q.beginPath(); q.moveTo(u0, v0); q.lineTo(u1, v1); q.stroke();
          for (let s = 0; s < 8; s++) { const f = (s + (b % 2) * 0.5) / 8, [a1, b1] = Pp(ax + (bx - ax) * f, y0, az + (bz - az) * f), [a2, b2] = Pp(ax + (bx - ax) * f, y1, az + (bz - az) * f); q.beginPath(); q.moveTo(a1, b1); q.lineTo(a2, b2); q.stroke(); } }
      });
      // the steel ladder on the far wall
      [9.7, 10.3].forEach((x) => poly(q, [[x, 0, HZ0 + 0.02], [x + 0.06, 0, HZ0 + 0.02], [x + 0.06, -DEP, HZ0 + 0.02], [x, -DEP, HZ0 + 0.02]], '#9a9890'));
      for (let k = 1; k < 7; k++) { const y = -k * 0.27; poly(q, [[9.7, y, HZ0 + 0.03], [10.36, y, HZ0 + 0.03], [10.36, y - 0.04, HZ0 + 0.03], [9.7, y - 0.04, HZ0 + 0.03]], '#bcb8ae'); }
      // the gold glow coming up from the money, and the lip of the cut floor
      const gr = q.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.5); gr.addColorStop(0, 'rgba(255,200,90,.32)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.strokeStyle = '#d8c8a0'; q.lineWidth = 10; q.strokeRect(0, 0, w, h);
    });
    c.clickable(pit, () => { c.sound.clink(900); c.egg('dogday_pit', 'You looked down into the vault. It is two metres deep and exactly one coat of paint thick. MLow says the best heists are painted.'); }, 'The open vault');
    // a brass edge around the cut, and a mark on the floor where it lines up
    const brass = K.std(0xd6a640, { metalness: 1, roughness: 0.25 });
    [[HX0, HZ0, HX1, HZ0], [HX0, HZ1, HX1, HZ1], [HX0, HZ0, HX0, HZ1], [HX1, HZ0, HX1, HZ1]].forEach(([a, b, cc, d]) => g.add(c.slab(Math.abs(cc - a) + 0.06, 0.025, Math.abs(d - b) + 0.06, brass, (a + cc) / 2, 0.0125, (b + d) / 2)));
    mark(c, K, g, E.x, E.z, 'MIND THE VAULT');
    // the money Sonny threw to the street, still coming down: instanced bills turning in the heat
    const NB = c.MOBILE ? 22 : 44, billT = c.canvasTex(128, 56, (q, w, h) => { q.fillStyle = '#b8d0a0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#3e5e34'; q.lineWidth = 4; q.strokeRect(4, 4, w - 8, h - 8); q.fillStyle = '#3e5e34'; q.beginPath(); q.arc(w / 2, h / 2, 16, 0, 7); q.fill(); q.font = `700 16px ${c.MONO}`; q.fillText('11', 10, 22); q.fillText('11', w - 30, h - 10); });
    const bills = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.07), new THREE.MeshStandardMaterial({ map: billT, side: THREE.DoubleSide, roughness: 0.8 }), NB), bd = new THREE.Object3D(), bs = [];
    for (let k = 0; k < NB; k++) bs.push([1.5 + Math.random() * 17, Math.random() * 5.6, -3 + Math.random() * 10, Math.random() * 6.3]); g.add(bills); bills.frustumCulled = false;
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let k = 0; k < NB; k++) { const b = bs[k]; b[1] -= dt * 0.35; if (b[1] < 0.02) b[1] = 5.6; bd.position.set(b[0] + Math.sin(t * 0.9 + b[3]) * 0.25, b[1], b[2]); bd.rotation.set(t * 1.3 + b[3], b[3], Math.sin(t * 2 + b[3]) * 0.8); bd.updateMatrix(); bills.setMatrixAt(k, bd.matrix); } bills.instanceMatrix.needsUpdate = true; });
    // bills already on the floor by the benches
    field(c, g, new THREE.PlaneGeometry(0.16, 0.07).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ map: billT, roughness: 0.9 }), Array.from({ length: 26 }, (_, k) => [3 + Math.random() * 14, 0.006 + k * 0.0002, 2 + Math.random() * 5, Math.random() * 6.3]));
    // a pressed tin ceiling, and the time and temperature sign every Brooklyn bank had: it says the heat
    ceiling(c, g, tin('#6a5236', '#c8a060'), [12, 10], { metal: 0.7, rough: 0.35 });
    const tt = c.canvasTex(512, 160, () => {}), tq = tt.userData.canvas.getContext('2d');
    const ttDraw = (s) => { tq.fillStyle = '#0a0604'; tq.fillRect(0, 0, 512, 160); tq.fillStyle = '#ff9a2a'; tq.font = `700 104px ${c.MONO}`; tq.textAlign = 'center'; tq.textBaseline = 'middle'; tq.fillText(s, 256, 84);
      tq.fillStyle = 'rgba(0,0,0,.55)'; for (let y = 0; y < 160; y += 6) tq.fillRect(0, y, 512, 2); for (let x = 0; x < 512; x += 6) tq.fillRect(x, 0, 2, 160); tt.needsUpdate = true; };
    ttDraw('2:57 PM');
    const ttm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: tt, toneMapped: false })); ttm.material.color.setScalar(1.9); ttm.position.set(10, 4.95, -3.62); g.add(ttm);
    g.add(c.slab(2.6, 0.95, 0.12, K.std(0x1a1410, { metalness: 0.6, roughness: 0.4 }), 10, 4.95, -3.7));
    const ttl = c.sign('N3W YORKERS SAVINGS. TIME AND TEMP', { w: 2.6, h: 0.18, bg: '#1a1410', fg: '#d6a640', font: c.MONO, weight: 700 }); ttl.position.set(10, 4.38, -3.62); g.add(ttl);
    let ttLast = -1;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const s = ((t / 2.5) | 0) % 3; if (s === ttLast) return; ttLast = s; ttDraw(['2:57 PM', '97 F', 'COUNTED'][s]); });
    // green banker's lamps along the counter, lit
    const shade = K.std(0x1a6a3a, { roughness: 0.2, metalness: 0.3, emissive: 0x0a4a22, side: THREE.DoubleSide }), stem = K.std(0xd6a640, { metalness: 1, roughness: 0.3 }), shg = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 16, 1, false, PI / 2, PI);
    [5.2, 8.6, 11.4, 14.8].forEach((x) => { const sh = new THREE.Mesh(shg, shade); sh.position.set(x, 1.45, -3.32); sh.rotation.z = PI / 2; g.add(sh); g.add(c.slab(0.3, 0.012, 0.1, hot(c, 0xfff0c0, 1.8), x, 1.37, -3.32));
      g.add(c.slab(0.03, 0.32, 0.03, stem, x, 1.26, -3.32)); g.add(c.slab(0.2, 0.03, 0.14, stem, x, 1.115, -3.32)); halo(c, K, g, x, 1.38, -3.25, 'rgba(255,240,180,.55)', 0.7); });
    // the teller windows lit from inside, numbered
    [5, 8.3, 11.7, 15].forEach((x, k) => { const s = c.sign(`TELLER ${k + 1}`, { w: 1.0, h: 0.22, bg: '#1a1006', fg: '#ffd890', font: c.MONO, weight: 700, glow: 10 }); s.material.color.setScalar(1.5); s.position.set(x, 2.32, -3.55); g.add(s); });
    // the queue: brass stanchions and a red rope, and a sign on chains over it
    const red = K.std(0x8a0f1e, { roughness: 0.85 }), qx = [3.0, 4.4, 5.8, 7.2];
    qx.forEach((x, i) => { g.add(c.slab(0.05, 0.95, 0.05, stem, x, 0.48, -2.3)); g.add(c.slab(0.3, 0.03, 0.3, stem, x, 0.015, -2.3)); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), stem); kn.position.set(x, 0.98, -2.3); g.add(kn);
      if (i < qx.length - 1) { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, -2.3), new THREE.Vector3(x + 0.7, 0.62, -2.3), new THREE.Vector3(x + 1.4, 0.9, -2.3)); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.025, 6), red)); } });
    c.wall(X(3.0), -2.3, X(7.2), -2.3);
    const ln = c.sign('LINE FORMS HERE\nPLEASE WAIT TO BE COUNTED', { w: 2.2, h: 0.55, bg: '#0e1a12', fg: '#f4ead2', font: c.SERIF, weight: 800, border: '#d6a640' }); ln.position.set(5.1, 3.5, -2.3); g.add(ln);
    [4.15, 6.05].forEach((x) => g.add(c.slab(0.015, 2.2, 0.015, stem, x, 4.9, -2.3)));
    const ins = c.sign('DEPOSITS INSURED BY THE\nDEPT. OF THE COUNTED', { w: 1.5, h: 0.4, bg: '#d6a640', fg: '#1a1006', font: c.SERIF, weight: 800 }); ins.position.set(13.9, 0.62, -3.19); g.add(ins);
    // the police lights through the doors, as beams on the haze; they swap with the set's own red and blue
    const sr = shaft(c, g, 4, 4.6, -7.6, 0.3, 2.6, 7.5, 0xff2a2a, 0.0), sb = shaft(c, g, 16, 4.6, -7.6, 0.3, 2.6, 7.5, 0x2a5aff, 0.0);
    sr.rotation.x = sb.rotation.x = -1.05; sr.rotation.z = -0.25; sb.rotation.z = 0.25;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const ph = (t * 3) | 0; sr.material.opacity = ph % 2 ? 0.16 : 0.02; sb.material.opacity = ph % 2 ? 0.02 : 0.16; });
    motes(c, r, g, 160, 2, 18, 0.3, 5.5, -3, 7, 0xffe0b0, 0.03, 0.55);
    // the heat: two standing fans on the floor with their own little wind, and a sweating water cooler
    const fanG = [[1.6, -1.5, 0.9], [18.4, -1.2, -0.9]].map(([x, z, ry]) => { const f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.y = ry; g.add(f); f.add(c.slab(0.04, 1.2, 0.04, stem, 0, 0.6, 0)); f.add(c.slab(0.4, 0.04, 0.4, K.std(0x2a2a2a), 0, 0.02, 0));
      const cage = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 6, 24), stem); cage.position.set(0, 1.3, 0.05); f.add(cage);
      const bl = new THREE.Group(); bl.position.set(0, 1.3, 0.06); f.add(bl); for (let k = 0; k < 3; k++) { const b = c.slab(0.1, 0.27, 0.01, K.std(0x6a8a9a, { metalness: 0.6 }), 0, 0.13, 0); b.geometry.translate(0, 0, 0); const p = new THREE.Group(); p.rotation.z = k / 3 * PI * 2; p.add(b); bl.add(p); }
      c.post(X(x), z, 0.3); return bl; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fanG.forEach((b) => { b.rotation.z = t * 14; }); });
    const wc = new THREE.Group(); wc.position.set(18.9, 0, -5.4); g.add(wc); wc.add(c.slab(0.4, 0.95, 0.4, K.std(0xd8d0c0, { roughness: 0.4 }), 0, 0.48, 0));
    const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 16), new THREE.MeshStandardMaterial({ color: 0x8ac8ff, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.1 })); jug.position.y = 1.18; wc.add(jug); c.post(X(18.9), -5.4, 0.3);
  },

  // ---------------- FAME: West 46th Street dances ----------------
  fame(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.0, sat: 1.15 };
    // ILLUSION: peripheral drift. The street is painted with rotating snakes (black, blue, white, gold, in that order
    // around every ring): stand still and look at one disc, and every disc you are not looking at turns on its own.
    const snakes = (q, w, h) => {
      q.fillStyle = '#16120e'; q.fillRect(0, 0, w, h);
      const seq = ['#0b0b10', '#1d4ed8', '#ffffff', '#f5c542'], D = h / 2;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
        const cx = D * (i + 0.5) + (w - D * 4) / 2, cy = D * (j + 0.5), dir = (i + j) % 2 ? 1 : -1;
        q.fillStyle = '#7a7a72'; q.beginPath(); q.arc(cx, cy, D * 0.48, 0, 7); q.fill();
        for (let ring = 0; ring < 4; ring++) { const R1 = D * (0.46 - ring * 0.1), R0 = R1 - D * 0.09, n = [26, 20, 14, 10][ring];
          for (let s = 0; s < n; s++) { const a0 = (s + ring * 0.5) / n * PI * 2, a1 = a0 + PI * 2 / n; for (let k = 0; k < 4; k++) { const b0 = a0 + (dir > 0 ? k : 3 - k) / 4 * (a1 - a0), b1 = b0 + (a1 - a0) / 4; q.fillStyle = seq[k]; q.beginPath(); q.arc(cx, cy, R1, b0, b1); q.arc(cx, cy, R0, b1, b0, true); q.closePath(); q.fill(); } } }
        K.eyeFlower(q, cx, cy, D * 0.06);
      }
      q.strokeStyle = '#f5c542'; q.lineWidth = 6; q.strokeRect(3, 3, w - 6, h - 6);
      noise(q, w, h, 6000, 0.12, ['#000', '#888'], 2);
    };
    panel(c, g, 8.4, 4.2, snakes, 1024, 10, 0.014, 2.9, { floor: true, rough: 0.45 });
    // bunting across the street, three runs of pennants in the palette
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.18, 0, 0, 0.18, 0, 0, 0, -0.34, 0], 3)); tri.computeVertexNormals();
    const pal = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff, 0x3b82f6], pen = [];
    [-4.5, 0.2, 4.6].forEach((z, j) => { const y = 7.2 - j * 0.4, sag = 1.0; for (let i = 0; i < 34; i++) { const u = (i + 0.5) / 34; pen.push([0.4 + 19.2 * u, y - sag * 4 * u * (1 - u), z, 0, 1, pal[(i + j) % 5]]); }
      const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector3(0.4 + 19.2 * u, y - sag * 4 * u * (1 - u) + 0.01, z)); } g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x222222 }))); });
    const bunt = field(c, g, tri, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }), pen);
    // string lights, warm, two runs lower down
    garland(c, r, g, 0.4, 19.6, 5.6, -1.6, 0.9, 38, 0xffd890, 2.4); garland(c, r, g, 0.4, 19.6, 5.3, 2.4, 0.8, 38, 0xff9ad0, 2.2);
    // the premiere searchlights, sweeping up off the end of the street
    const sl = [3, 17].map((x) => { const s = shaft(c, g, x, 0.3, -6.6, 0.15, 1.3, 16, 0xfff0d0, 0.09); s.rotation.x = PI; return s; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sl.forEach((s, k) => { s.rotation.z = Math.sin(t * 0.5 + k * 2) * 0.45 + (k ? 0.25 : -0.25); s.rotation.x = PI - 0.25 + Math.cos(t * 0.37 + k) * 0.12; }); });
    // neon under each cab, pulsing on the beat of the street
    const ug = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xff4fa3].map((col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.4), new THREE.MeshBasicMaterial({ map: K.glowTex('rgba(255,255,255,.9)'), color: col, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.rotation.x = -PI / 2; m.position.set(4 + k * 4, 0.02, -2.2); g.add(m); return m; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ug.forEach((m, k) => { m.material.opacity = 0.25 + Math.abs(Math.sin(t * 4 + k * 0.8)) * 0.45; }); });
    // a vertical blade sign off the east wall with chasing bulbs, NEW YORKERS version of the school
    const blade = c.sign('F\nA\nM\nE', { w: 0.8, h: 3.4, bg: '#1a0a14', fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 18, border: '#f5c542' }); blade.material.color.setScalar(1.6);
    blade.position.set(19.3, 6.2, -0.2); blade.rotation.y = -PI / 2; g.add(blade); const blade2 = blade.clone(); blade2.rotation.y = PI / 2; blade2.position.x = 19.28; g.add(blade2);
    const bulbsA = []; for (let k = 0; k < 18; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), hot(c, 0xffe0a0, 2.2)); const u = k / 17; m.position.set(19.3, 4.5 + u * 3.4, -0.62); g.add(m); bulbsA.push(m); const m2 = m.clone(); m2.position.z = 0.22; g.add(m2); bulbsA.push(m2); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const k = (t * 10) | 0; bulbsA.forEach((m, i) => { m.visible = ((i >> 1) + k) % 3 !== 0; }); });
    // the walk signal: DANCE in white, the orange hand says DO NOT, and it never does
    const pole = new THREE.Group(); pole.position.set(1.3, 0, -0.6); g.add(pole); pole.add(c.slab(0.1, 2.9, 0.1, K.std(0x2a2a20, { metalness: 0.6 }), 0, 1.45, 0)); pole.add(c.slab(0.5, 0.5, 0.3, K.std(0x1a1a14, { metalness: 0.4 }), 0.12, 2.75, 0)); c.post(X(1.3), -0.6, 0.25);
    const sig = c.canvasTex(256, 256, () => {}), sq = sig.userData.canvas.getContext('2d');
    const sigDraw = (on) => { sq.fillStyle = '#050505'; sq.fillRect(0, 0, 256, 256); sq.fillStyle = on ? '#f4f4ff' : '#ff7a1a'; sq.font = `900 ${on ? 70 : 54}px ${c.FONT}`; sq.textAlign = 'center'; sq.textBaseline = 'middle'; sq.fillText(on ? 'DANCE' : 'DON\'T', 128, 128); sq.fillStyle = 'rgba(0,0,0,.5)'; for (let i = 0; i < 256; i += 5) { sq.fillRect(i, 0, 1.5, 256); sq.fillRect(0, i, 256, 1.5); } sig.needsUpdate = true; };
    sigDraw(true); const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: sig, toneMapped: false })); face.material.color.setScalar(1.7); face.position.set(0.12, 2.75, 0.16); pole.add(face);
    let sigOn = 1; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const on = ((t / 1.6) | 0) % 4 !== 3 ? 1 : 0; if (on !== sigOn) { sigOn = on; sigDraw(on); } });
    c.clickable(pole, () => { c.sound.beep(880, 0.08, 0.2, 'square'); c.egg('fame_signal', 'The signal on West 46th only has two settings: DANCE, and a flashing hand nobody obeys. The kids from the school taught it that. MLow wired it.'); }, 'The walk signal');
    // steam out of the street, and a hydrant open for the dancers
    K.steam(g, 6.4, 0.05, 5.6); K.steam(g, 14.2, 0.05, -5.2);
    motes(c, r, g, 120, 1, 19, 0.5, 8, -6, 7, 0xffd0e0, 0.04, 0.5);
  },
};

const coffer = (base, gold) => (q, w, h) => {
  q.fillStyle = base; q.fillRect(0, 0, w, h);
  const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(0,0,0,.4)'); q.fillStyle = gr; q.fillRect(22, 22, w - 44, h - 44);
  q.strokeStyle = gold; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28); q.lineWidth = 3; q.strokeRect(34, 34, w - 68, h - 68);
  q.fillStyle = gold; q.beginPath(); q.arc(w / 2, h / 2, 16, 0, 7); q.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; q.beginPath(); q.arc(w / 2 + Math.cos(a) * 34, h / 2 + Math.sin(a) * 34, 4, 0, 7); q.fill(); }
  noise(q, w, h, 700, 0.15);
};
// a blurred shadow shape on the floor: draw(q) fills the silhouette in black; the shadowBlur trick keeps it soft in every browser
function shadowDecal(c, g, w, h, x, z, draw, op = 0.6, ry = 0) {
  const m = panel(c, g, w, h, (q, cw, ch) => { q.fillStyle = '#000'; q.strokeStyle = '#000'; const s = ch * 0.012;
    for (let k = 0; k < 9; k++) { q.save(); q.globalAlpha = k ? op / 7 : op * 0.55; if (k) q.translate(Math.cos(k / 8 * PI * 2) * s, Math.sin(k / 8 * PI * 2) * s); draw(q, cw, ch); q.restore(); } }, 512, x, 0.013 + Math.random() * 0.002, z, { basic: true, alpha: true, floor: true });
  m.rotation.z = ry; return m;
}

Object.assign(ROOM, {
  // ---------------- ANNIE HALL: the line at the New Yorker ----------------
  annie(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.15, vig: 0.55 };
    // ILLUSION: Pepper's ghost. A peep booth on the east side shows the little house under the Coney Island coaster where
    // Alvy grew up; a sheet of glass at 45 degrees inside it puts the boy in the kitchen, floating, see through, there
    // only when you stand in front of it. Walk to the side and he is gone.
    const B = new THREE.Group(); B.position.set(16.7, 0, -0.9); B.rotation.y = -0.78; g.add(B); c.post(X(16.7), -0.9, 0.75); const BF = new THREE.Vector3(Math.sin(-0.78), 0, Math.cos(-0.78));
    const wood = K.std(0x3a1a12, { roughness: 0.45 }), gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 });
    B.add(c.slab(1.3, 0.95, 0.8, wood, 0, 0.475, 0)); B.add(c.slab(1.3, 0.1, 0.8, wood, 0, 2.35, 0)); B.add(c.slab(0.08, 1.4, 0.8, wood, -0.61, 1.65, 0)); B.add(c.slab(0.08, 1.4, 0.8, wood, 0.61, 1.65, 0));
    B.add(c.slab(1.34, 0.04, 0.84, gold, 0, 0.97, 0)); B.add(c.slab(1.34, 0.04, 0.84, gold, 0, 2.31, 0));
    // the real backdrop: the house under the coaster, at dusk
    const back = panel(c, B, 1.14, 1.32, (q, w, h) => { const sk = q.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#1a1036'); sk.addColorStop(0.6, '#c85a4a'); sk.addColorStop(1, '#f0b070'); q.fillStyle = sk; q.fillRect(0, 0, w, h);
      q.strokeStyle = '#f4ead2'; q.lineWidth = 3; q.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h * 0.28 + Math.sin(x / w * 7) * h * 0.12; x ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke();
      for (let x = 8; x < w; x += 22) { const y = h * 0.28 + Math.sin(x / w * 7) * h * 0.12; q.beginPath(); q.moveTo(x, y); q.lineTo(x - 10, h * 0.62); q.moveTo(x, y); q.lineTo(x + 10, h * 0.62); q.stroke(); }
      q.fillStyle = '#2a1a14'; q.fillRect(w * 0.18, h * 0.55, w * 0.64, h * 0.4); q.beginPath(); q.moveTo(w * 0.12, h * 0.56); q.lineTo(w * 0.5, h * 0.4); q.lineTo(w * 0.88, h * 0.56); q.fill();
      q.fillStyle = '#ffd890'; [[0.26, 0.64], [0.6, 0.64], [0.26, 0.78], [0.6, 0.78]].forEach(([a, b]) => q.fillRect(w * a, h * b, w * 0.13, h * 0.09));
      q.fillStyle = '#f4ead2'; q.font = `700 ${h * 0.045}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('BROOKLYN, UNDER THE COASTER', w / 2, h * 0.97); }, 384, 0, 1.65, -0.36, { basic: true, glow: 1.15 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.4), new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.1, roughness: 0.02, metalness: 0.9, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(0, 1.65, 0.0); glass.rotation.x = -PI / 4; B.add(glass);
    const ghostT = c.canvasTex(256, 384, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h * 0.45, w * 0.55); gr.addColorStop(0, 'rgba(140,200,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.fillStyle = '#9ad0ff'; q.fillRect(w * 0.38, h * 0.45, w * 0.24, h * 0.36); q.fillRect(w * 0.4, h * 0.8, w * 0.07, h * 0.16); q.fillRect(w * 0.53, h * 0.8, w * 0.07, h * 0.16);
      q.strokeStyle = '#9ad0ff'; q.lineWidth = 12; q.beginPath(); q.moveTo(w * 0.4, h * 0.5); q.lineTo(w * 0.22, h * 0.36); q.moveTo(w * 0.6, h * 0.5); q.lineTo(w * 0.76, h * 0.62); q.stroke();
      K.eyeFlower(q, w / 2, h * 0.32, w * 0.2, '#d8ecff', '#4aa0ff'); });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.93), new THREE.MeshBasicMaterial({ map: ghostT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); ghost.position.set(0, 1.5, -0.12); B.add(ghost);
    const cap = c.sign('THE HOUSE UNDER THE COASTER\nSTAND IN FRONT. HE IS STILL HOME.', { w: 1.3, h: 0.3, bg: '#1a0a08', fg: '#f5c542', font: c.MONO, weight: 700 }); cap.position.set(0, 2.52, 0.41); B.add(cap);
    const bf = new THREE.Vector3(), bq = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; B.getWorldPosition(bq); bf.set(P.x - bq.x, 0, P.z - bq.z); const d = bf.length(), fwd = d > 0.01 ? bf.dot(BF) / d : 0;
      ghost.material.opacity = Math.max(0, (fwd - 0.82) / 0.18) * Math.min(1, 6 / Math.max(d, 1)) * (0.75 + Math.sin(t * 3) * 0.12); ghost.position.y = 1.5 + Math.sin(t * 9) * 0.008; back.position.x = Math.sin(t * 11) * 0.003; });
    c.clickable(B, () => { c.sound.whoosh(0.3, 1.5); c.egg('annie_ghost', 'The boy under the roller coaster, still at the kitchen table, see through. A sheet of glass and a lamp did it in 1862. MLow did it with a sheet of glass and a census.'); }, 'The peep booth');
    // a coffered ceiling with a gold cove that glows round the edge
    ceiling(c, g, coffer('#2a0a0c', '#c9a033'), [8, 6], { metal: 0.6, rough: 0.4 });
    const cove = hot(c, 0xffb860, 1.5); [[10, 7.85, 19.5, 0], [0.18, 0, 15.6, 1], [19.82, 0, 15.6, 1]].forEach(([x, z, L, side]) => g.add(side ? c.slab(0.05, 0.05, L, cove, x, 5.86, z) : c.slab(L, 0.05, 0.05, cove, x, 5.86, z)));
    // the proscenium round the picture: chasing bulbs up both sides and across the top
    const bl = []; const bgeo = new THREE.SphereGeometry(0.055, 8, 6), bon = hot(c, 0xffe0a0, 2.4), boff = K.std(0x3a3020);
    for (let k = 0; k < 15; k++) [3.82, 16.18].forEach((x) => { const m = new THREE.Mesh(bgeo, bon); m.position.set(x, 0.3 + k * 0.3, -7.93); g.add(m); bl.push(m); });
    for (let k = 0; k < 41; k++) { const m = new THREE.Mesh(bgeo, bon); m.position.set(3.82 + k * 0.309, 4.6, -7.93); g.add(m); bl.push(m); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const k = (t * 7) | 0; bl.forEach((m, i) => { m.material = (i + k) % 4 === 0 ? boff : bon; }); });
    // red velvet drapes with a valance, either side of the picture
    const drape = (q, w, h) => { for (let x = 0; x < w; x++) { const v = 0.55 + 0.45 * Math.sin(x / w * PI * 9); q.fillStyle = `rgb(${90 + v * 90 | 0},${8 + v * 14 | 0},${16 + v * 18 | 0})`; q.fillRect(x, 0, 1, h); } const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#c9a033'; q.fillRect(0, h - 10, w, 10); };
    panel(c, g, 1.1, 4.8, drape, 512, 3.2, 2.4, -7.9, { rough: 0.9 }); panel(c, g, 1.1, 4.8, drape, 512, 16.8, 2.4, -7.9, { rough: 0.9 });
    // the projector beam from the booth window in the south wall, over everyone's heads, dust turning in it
    g.add(c.slab(0.9, 0.5, 0.05, hot(c, 0xfff4e0, 1.8), 10, 5.2, 7.86));
    const pb = shaft(c, g, 10, 5.45, 7.8, 0.1, 1.5, 15.2, 0xfff0d8, 0.028); pb.rotation.x = PI / 2 - 0.19;
    motes(c, r, g, 200, 7.5, 12.5, 3.2, 5.6, -7, 7.5, 0xfff0d0, 0.025, 0.7);
    // sconce scallops: the wash of light each sconce throws up and down the wall
    const scal = (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,200,130,.9)'); gr.addColorStop(1, 'rgba(255,200,130,0)'); q.fillStyle = gr; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); q.fill(); };
    [[0.15, PI / 2], [19.85, -PI / 2]].forEach(([x, ry]) => [-5.4, -3.0].forEach((z) => panel(c, g, 0.9, 2.2, scal, 128, x, 2.7, z, { add: true, op: 0.55, ry })));
    // the candy case on the concession stand, lit from inside
    const cc = new THREE.Group(); cc.position.set(2.0, 1.0, 5.45); cc.rotation.y = 1.2; g.add(cc);
    cc.add(c.slab(1.3, 0.04, 0.5, gold, 0, 0.02, 0)); const cg = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 0.5), new THREE.MeshStandardMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false })); cg.position.y = 0.25; cc.add(cg);
    field(c, cc, new THREE.BoxGeometry(0.16, 0.06, 0.1), new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: 0x201008 }), Array.from({ length: 24 }, (_, k) => [-0.55 + (k % 8) * 0.157, 0.08 + ((k / 8) | 0) * 0.07, -0.12 + ((k / 8) | 0) * 0.08, 0, 1, [0xff4fa3, 0xf5c542, 0x22d3ee, 0xe83a2a, 0xffffff][k % 5]]));
    halo(c, K, cc, 0, 0.3, 0.1, 'rgba(255,220,160,.5)', 1.4);
    // the letter board easel: tonight's show
    const lb = c.sign('TONIGHT ONLY\nTHE SORROW AND\nTHE COUNT\n4 HRS. NO LATECOMERS', { w: 1.1, h: 1.3, bg: '#111', fg: '#f4f4f4', font: c.MONO, weight: 700, border: '#c9a033' }); lb.position.set(2.6, 1.25, 0.9); lb.rotation.y = 0.5; g.add(lb);
    const easel = new THREE.Group(); easel.position.set(2.6, 0, 0.82); easel.rotation.y = 0.5; g.add(easel); [-0.45, 0.45].forEach((dx) => { const l = c.slab(0.04, 1.9, 0.04, gold, dx, 0.95, -0.05); easel.add(l); }); c.post(X(2.6), 0.82, 0.45);
  },

  // ---------------- MEN IN BLACK: the Unisphere ----------------
  unisphere(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 0.95, sat: 1.1 };
    const PX = 10, PZ = -4.6;
    // the plaza paving, radial round the fountain, granite in two tones with the joints and the wear
    panel(c, g, 19.6, 15.6, (q, w, h) => { const sx = w / 19.6, cx = PX * sx, cy = (PZ + 7.8) * sx; q.fillStyle = '#b8b2a6'; q.fillRect(0, 0, w, h);
      for (let k = 1; k < 26; k++) { q.strokeStyle = k % 3 ? 'rgba(60,54,48,.35)' : 'rgba(60,54,48,.6)'; q.lineWidth = k % 3 ? 2 : 4; q.beginPath(); q.arc(cx, cy, k * 0.75 * sx, 0, 7); q.stroke(); if (k % 3 === 0) { q.fillStyle = 'rgba(140,128,112,.25)'; q.beginPath(); q.arc(cx, cy, k * 0.75 * sx, 0, 7); q.arc(cx, cy, (k - 1) * 0.75 * sx, 0, 7, true); q.fill(); } }
      for (let a = 0; a < 64; a++) { const an = a / 64 * PI * 2; q.strokeStyle = 'rgba(60,54,48,.3)'; q.lineWidth = 2; q.beginPath(); q.moveTo(cx + Math.cos(an) * 4.2 * sx, cy + Math.sin(an) * 4.2 * sx); q.lineTo(cx + Math.cos(an) * 22 * sx, cy + Math.sin(an) * 22 * sx); q.stroke(); }
      noise(q, w, h, 30000, 0.12, ['#000', '#fff', '#8a7a6a'], 3); }, 1024, 10, 0.011, 0, { floor: true, rough: 0.75 });
    // the pool's granite rim and the fountain ring of jets, which play
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.95, 0.16, 8, 64), K.std(0x9a948a, { roughness: 0.6 })); rim.rotation.x = PI / 2; rim.position.set(PX, 0.12, PZ); g.add(rim);
    const NJ = c.MOBILE ? 20 : 36, jet = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.07, 1, 6, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: gradTex(c), color: 0xe8f4ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), NJ), jd = new THREE.Object3D();
    jet.frustumCulled = false; g.add(jet);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let k = 0; k < NJ; k++) { const a = k / NJ * PI * 2; jd.position.set(PX + Math.cos(a) * 3.55, 0.05, PZ + Math.sin(a) * 3.55); jd.rotation.set(Math.sin(a) * -0.22, 0, Math.cos(a) * 0.22); jd.scale.set(1, 1.6 + Math.sin(t * 2.2 + k * 0.7) * 0.7, 1); jd.updateMatrix(); jet.setMatrixAt(k, jd.matrix); } jet.instanceMatrix.needsUpdate = true; });
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; halo(c, K, g, PX + Math.cos(a) * 3.4, 0.5, PZ + Math.sin(a) * 3.4, 'rgba(220,235,255,.35)', 1.6); }
    // floodlights at the base, washing up the globe
    [0, 1, 2, 3].forEach((k) => { const a = k / 4 * PI * 2 + 0.4, s = shaft(c, g, PX + Math.cos(a) * 1.7, 0.3, PZ + Math.sin(a) * 1.7, 0.12, 1.6, 7.5, 0xfff4e0, 0.08); s.rotation.x = PI; s.rotation.z = Math.cos(a) * 0.18; s.rotation.y = 0; g.add(c.slab(0.3, 0.25, 0.3, K.std(0x2a2a2a, { metalness: 0.6 }), PX + Math.cos(a) * 1.7, 0.12, PZ + Math.sin(a) * 1.7)); });
    // ILLUSION: shadows that do not match. The sun throws every shadow on the plaza toward you, and most of them are
    // honest: the crates, the planters, the man by the crates. The cat's shadow is a giant bug. The agent's is not a man.
    const sh = (x, z, w, h, f, op = 0.55) => shadowDecal(c, g, w, h, x - 0.15, z + h / 2 - 0.05, f, op, 0.18);
    const person = (q, w, h) => { q.beginPath(); q.ellipse(w / 2, h * 0.1, w * 0.12, h * 0.06, 0, 0, 7); q.fill(); q.fillRect(w * 0.36, h * 0.12, w * 0.28, h * 0.5); q.beginPath(); q.arc(w / 2, h * 0.72, w * 0.14, 0, 7); q.fill(); };
    sh(15.4, 2.0, 0.8, 2.3, person, 0.5);
    sh(16.4, 0.6, 1.6, 1.4, (q, w, h) => q.fillRect(w * 0.08, 0, w * 0.84, h * 0.9));
    [4.4, 15.6].forEach((x) => sh(x, -0.6, 1.6, 1.5, (q, w, h) => { q.fillRect(w * 0.06, 0, w * 0.88, h * 0.45); q.beginPath(); q.ellipse(w / 2, h * 0.62, w * 0.36, h * 0.28, 0, 0, 7); q.fill(); }));
    sh(6.2, 1.2, 1.0, 2.8, (q, w, h) => { q.fillRect(w * 0.1, 0, w * 0.8, h * 0.35); q.fillRect(w * 0.42, h * 0.35, w * 0.16, h * 0.45); });
    const bug = (q, w, h) => { const cx = w / 2; q.beginPath(); q.ellipse(cx, h * 0.07, w * 0.08, h * 0.05, 0, 0, 7); q.fill();
      q.beginPath(); q.ellipse(cx, h * 0.42, w * 0.2, h * 0.28, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(cx, h * 0.76, w * 0.13, h * 0.09, 0, 0, 7); q.fill();
      q.lineWidth = w * 0.035; q.strokeStyle = '#000'; q.lineCap = 'round';
      for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => { const y = h * (0.3 + i * 0.12); q.beginPath(); q.moveTo(cx + s * w * 0.15, y); q.lineTo(cx + s * w * 0.4, y - h * 0.06 + i * h * 0.04); q.lineTo(cx + s * w * 0.47, y + h * 0.08); q.stroke(); });
      [-1, 1].forEach((s) => { q.beginPath(); q.moveTo(cx + s * w * 0.05, h * 0.84); q.quadraticCurveTo(cx + s * w * 0.3, h * 0.95, cx + s * w * 0.42, h * 0.86); q.stroke(); q.beginPath(); q.moveTo(cx + s * w * 0.06, h * 0.82); q.lineTo(cx + s * w * 0.16, h * 0.98); q.stroke(); }); };
    const bugS = sh(13.4, 0.0, 2.8, 4.2, bug, 0.62); bugS.geometry.translate(0, -2.1, 0); bugS.position.z -= 2.1;   // pivot at the cat's feet
    const alien = (q, w, h) => { q.beginPath(); q.ellipse(w / 2, h * 0.08, w * 0.14, h * 0.05, 0, 0, 7); q.fill(); q.fillRect(w * 0.42, h * 0.1, w * 0.16, h * 0.5);
      q.beginPath(); q.ellipse(w / 2, h * 0.76, w * 0.3, h * 0.17, 0, 0, 7); q.fill(); q.lineWidth = w * 0.05; q.strokeStyle = '#000'; [-1, 1].forEach((s) => { q.beginPath(); q.moveTo(w / 2 + s * w * 0.06, h * 0.25); q.bezierCurveTo(w / 2 + s * w * 0.4, h * 0.3, w / 2 + s * w * 0.2, h * 0.5, w / 2 + s * w * 0.45, h * 0.55); q.stroke(); q.beginPath(); q.moveTo(w / 2 + s * w * 0.15, h * 0.9); q.lineTo(w / 2 + s * w * 0.3, h * 0.99); q.stroke(); }); };
    sh(14.6, 3.2, 1.1, 2.8, alien, 0.55);
    c.clickable(bugS, () => { c.sound.beep(180, 0.3, 0.3, 'sawtooth'); c.egg('unisphere_shadow', 'Look at the cat. Now look at its shadow. In Queens you learn to trust the shadow. MLow painted every one of these at noon, and one of them moved.'); }, 'The cat\'s shadow');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bugS.scale.x = 1 + Math.sin(t * 1.3) * 0.06; bugS.rotation.z = 0.18 + Math.sin(t * 0.7) * 0.05; });
    // the sun, low over the fair, and the info stand
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(255,236,190,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sun.scale.set(9, 9, 1); sun.position.set(16, 13, -14); g.add(sun);
    const ks = new THREE.Group(); ks.position.set(3.2, 0, 1.0); ks.rotation.y = 0.35; g.add(ks); c.post(X(3.2), 1.0, 0.5);
    ks.add(c.slab(0.12, 1.1, 0.12, K.std(0x8a8e96, { metalness: 1, roughness: 0.3 }), 0, 0.55, 0));
    const map = panel(c, ks, 1.2, 0.8, (q, w, h) => { q.fillStyle = '#0b1020'; q.fillRect(0, 0, w, h); q.strokeStyle = '#22d3ee'; q.lineWidth = 3; q.beginPath(); q.arc(w * 0.5, h * 0.55, h * 0.3, 0, 7); q.stroke();
      for (let k = 0; k < 9; k++) { q.strokeRect(w * (0.08 + (k % 3) * 0.06), h * (0.15 + ((k / 3) | 0) * 0.2), w * 0.05, h * 0.14); q.strokeRect(w * (0.78 + (k % 2) * 0.07), h * (0.12 + ((k / 2) | 0) * 0.16), w * 0.05, h * 0.12); }
      q.fillStyle = '#ff4fa3'; q.beginPath(); q.arc(w * 0.5, h * 0.9, 9, 0, 7); q.fill(); q.fillStyle = '#f5c542'; q.font = `700 ${h * 0.08}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('N3W WORLD\'S FAIR. YOU ARE HERE. PROBABLY.', w / 2, h * 0.09); }, 512, 0, 1.45, 0.07, { basic: true, glow: 1.25 });
    map.rotation.x = -0.35; const mb = c.slab(1.3, 0.9, 0.08, K.std(0x1a1a1e, { metalness: 0.6 }), 0, 1.45, 0.0); mb.rotation.x = -0.35; ks.add(mb);
    motes(c, r, g, 90, 1, 19, 0.3, 6, -6, 7, 0xfff8e0, 0.035, 0.45);
  },
});

Object.assign(ROOM, {
  // ---------------- COMING TO AMERICA: McMLOW'S, Queens ----------------
  mcmlow(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.05, sat: 1.12 };
    // ILLUSION: a Beuchet chair. From the crown on the floor the royal throne of Zamunda stands whole by the window, and
    // the king on it is the size of a toddler. Step off the crown: the legs are here, the seat and back are four metres on.
    const E = new THREE.Vector3(13.0, 1.62, 6.6), d1 = 2.0, k = 2.0;
    const near0 = new THREE.Group(), far0 = new THREE.Group(); [near0, far0].forEach((q) => { q.position.copy(E); g.add(q); }); far0.scale.setScalar(k);
    const red = K.std(0x9a0f1e, { roughness: 0.8 }), gold = K.std(0xf5c020, { metalness: 1, roughness: 0.25, emissive: 0x2a1a00 }), Y = (y) => y - E.y;
    // in throne space: front at dz = -d1, seat height 1.3, width 1.8, depth 0.9, back 2.1 tall
    const S = (q, w, h, d, m, x, y, z) => { const s = c.slab(w, h, d, m, x, Y(y), z); q.add(s); return s; };
    S(near0, 0.18, 1.3, 0.18, gold, -0.86, 0.65, -d1); S(near0, 0.18, 1.3, 0.18, gold, 0.86, 0.65, -d1);
    S(near0, 1.56, 1.06, 0.06, red, 0, 0.6, -d1); S(near0, 1.56, 0.07, 0.08, gold, 0, 1.17, -d1); S(near0, 1.56, 0.07, 0.08, gold, 0, 0.08, -d1);
    const crestT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#f5c020'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.48, 0, 7); q.fill(); K.eyeFlower(q, w / 2, h / 2, w * 0.4); });
    const crestM = new THREE.MeshStandardMaterial({ map: crestT, transparent: true, metalness: 0.5, roughness: 0.4 });
    const cr = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), crestM); cr.position.set(0, Y(0.62), -d1 + 0.035); near0.add(cr);
    [-0.86, 0.86].forEach((x) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), gold); f.position.set(x, Y(1.36), -d1); near0.add(f); });
    S(far0, 1.8, 0.16, 0.9, red, 0, 1.38, -d1 - 0.45); S(far0, 1.84, 0.06, 0.94, gold, 0, 1.3, -d1 - 0.45);
    S(far0, 1.8, 2.1, 0.14, red, 0, 2.4, -d1 - 0.92); S(far0, 1.9, 0.12, 0.18, gold, 0, 3.45, -d1 - 0.92);
    [-0.92, 0.92].forEach((x) => { S(far0, 0.14, 0.5, 0.86, red, x, 1.62, -d1 - 0.45); S(far0, 0.18, 0.08, 0.9, gold, x, 1.9, -d1 - 0.45); S(far0, 0.16, 2.3, 0.16, gold, x, 2.45, -d1 - 0.92); const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), gold); f.position.set(x, Y(3.66), -d1 - 0.92); far0.add(f); });
    const bc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), crestM); bc.position.set(0, Y(2.55), -d1 - 0.84); far0.add(bc);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.34, 6, 1, true), gold); crown.material = gold.clone(); crown.material.side = THREE.DoubleSide; crown.position.set(0, Y(3.75), -d1 - 0.92); far0.add(crown);
    // a dark plinth under the far seat, hidden from the crown by the apron
    const fz = E.z - (d1 + 0.45) * k, fy = E.y + (1.3 - E.y) * k; g.add(c.slab(1.6 * k, Math.max(0.05, fy - 0.12), 0.8 * k, K.std(0x1a0a08), E.x, Math.max(0.05, fy - 0.12) / 2, fz));
    c.wall(X(E.x - 0.95), E.z - d1, X(E.x + 0.95), E.z - d1); c.post(X(E.x), fz, 1.6);
    // the king, normal sized, on the far seat
    const king = K.extra(g, E.x, fz + 0.1, { seated: true, col: 0xd8b020 }); king.position.y = fy - 0.45;
    const kc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.16, 8, 1, true), gold); kc.material = gold.clone(); kc.material.side = THREE.DoubleSide; kc.position.set(0, 1.42 + 0.32, 0); king.add(kc);
    mark(c, K, g, E.x, E.z, 'SIT THE KING');
    c.clickable(near0, () => { c.sound.chords(3); c.egg('mcmlow_throne', 'From the crown on the floor the throne of Zamunda is whole and the king is the size of a Happy Count toy. Two steps left and it is three pieces of furniture. MLow knows which one the king is sitting on.'); }, 'The throne');
    // a drop ceiling with luminous panels, and a buzzing neon OPEN in the window wall
    ceiling(c, g, (q, w, h) => { q.fillStyle = '#d8d0c0'; q.fillRect(0, 0, w, h); noise(q, w, h, 3000, 0.25, ['#8a8070', '#fff'], 2); q.strokeStyle = '#6a6458'; q.lineWidth = 6; q.strokeRect(0, 0, w, h); }, [16, 13], { metal: 0, rough: 0.9 });
    field(c, g, new THREE.PlaneGeometry(1.15, 0.55).rotateX(PI / 2), hot(c, 0xfff6e8, 1.25), [[3, 5.95, -2], [7, 5.95, -2], [13, 5.95, -2], [17, 5.95, -2], [3, 5.95, 3], [7, 5.95, 3], [13, 5.95, 3], [17, 5.95, 3]]);
    const open = c.sign('OPEN 24 HRS', { w: 1.6, h: 0.42, bg: null, fg: '#ff3b5c', font: c.FONT, weight: 800, glow: 24 }); open.material.color.setScalar(2.0); open.position.set(0.16, 3.6, -0.6); open.rotation.y = PI / 2; g.add(open);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; open.visible = Math.sin(t * 23) > -0.92 || Math.sin(t * 0.7) > 0.3; });
    // rose petals strewn on the floor ahead of the prince, the way they are in Zamunda
    const pet = new THREE.PlaneGeometry(0.07, 0.05).rotateX(-PI / 2);
    field(c, g, pet, new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }), Array.from({ length: c.MOBILE ? 90 : 180 }, (_, i) => { const u = Math.random(); return [6.2 + (E.x - 6.2) * u + (Math.random() - 0.5) * 1.2, 0.008 + i * 0.00003, 1.8 + (fz + 1.2 - 1.8) * u * 0.3 + (Math.random() - 0.5) * 1.4 + u * 2.5, Math.random() * 6.3, 1, [0xc8102e, 0x9a0f1e, 0xff4f6a][i % 3]]; }));
    // trays on the tables: fries in their boxes, cola with straws
    const fry = new THREE.BoxGeometry(0.012, 0.09, 0.012), box = new THREE.BoxGeometry(0.1, 0.08, 0.06), cup = new THREE.CylinderGeometry(0.045, 0.035, 0.15, 12);
    const fl = [], bl = [], cl = [];
    [[4.4, -1.0], [13.2, -1.0], [15.8, -1.0]].forEach(([x, z]) => { [-0.25, 0.25].forEach((dz, j) => { const bx = x - 0.15, bz = z + dz; bl.push([bx, 0.9, bz, 0, 1, 0xc8102e]); for (let i = 0; i < 9; i++) fl.push([bx - 0.035 + (i % 3) * 0.035, 0.97, bz - 0.015 + ((i / 3) | 0) * 0.015, i * 0.3, 1, 0xf5c542]); cl.push([x + 0.2, 0.935, bz, 0, 1, j ? 0xf5c542 : 0xffffff]); }); });
    field(c, g, box, K.std(0xffffff, { roughness: 0.5 }), bl); field(c, g, fry, K.std(0xffffff, { roughness: 0.6, emissive: 0x332200 }), fl); field(c, g, cup, K.std(0xffffff, { roughness: 0.4 }), cl);
    // the soda fountain behind the counter, lit, and steam off the fryers
    const sf = new THREE.Group(); sf.position.set(4.2, 1.1, -5.5); g.add(sf); sf.add(c.slab(1.4, 0.7, 0.4, K.std(0xc8c8c8, { metalness: 0.9, roughness: 0.25 }), 0, 0.35, 0));
    sf.add(panel(c, g, 1.3, 0.3, (q, w, h) => { ['#c8102e', '#f5c542', '#22d3ee', '#ff4fa3'].forEach((col, i) => { q.fillStyle = col; q.fillRect(i * w / 4 + 4, 4, w / 4 - 8, h - 8); q.fillStyle = '#fff'; q.font = `800 ${h * 0.34}px ${c.FONT}`; q.textAlign = 'center'; q.fillText(['NAZAR', 'GOLD', 'CYAN', 'PINK'][i], i * w / 4 + w / 8, h * 0.62); }); }, 128, 0, 0.5, 0.21, { basic: true, glow: 1.5 }));
    K.steam(g, 15.6, 1.2, -5.6); K.steam(g, 16.2, 1.2, -5.7);
    // a wet floor shine that runs to the counter under the pendant globes
    [[4.4, -1.0], [13.2, -1.0], [15.8, -1.0], [10, 0.6]].forEach(([x, z]) => panel(c, g, 1.6, 1.6, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,90,60,.55)'); gr.addColorStop(1, 'rgba(255,90,60,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 128, x, 0.016, z, { add: true, floor: true, op: 0.6 }));
    motes(c, r, g, 100, 2, 18, 0.4, 5.6, -4, 7, 0xfff0d0, 0.025, 0.4);
  },

  // ---------------- ROSEMARY'S BABY: the Bramford corridor ----------------
  bramford(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.2, vig: 0.62, ca: 0.005 };
    // ILLUSION: a cafe wall dado. Both corridor walls are tiled to waist height in rows of dark and cream tiles, every row
    // shifted a little. Every mortar line is dead level. None of them looks it: the corridor leans toward the door.
    const cafe = c.canvasTex(512, 256, (q, w, h) => { const rows = 6, rh = h / rows, bw = w / 8; q.fillStyle = '#8a7a64'; q.fillRect(0, 0, w, h);
      const sh = [0, 0.3, 0.6, 0.3, 0, 0.3];
      for (let j = 0; j < rows; j++) for (let i = -1; i < 9; i++) { const x = (i + sh[j]) * bw; q.fillStyle = i % 2 === 0 ? '#120806' : '#ecdcb8'; q.fillRect(x, j * rh + rh * 0.06, bw, rh * 0.88); }
      noise(q, w, h, 2500, 0.1, ['#000', '#fff'], 2); });
    cafe.wrapS = cafe.wrapT = THREE.RepeatWrapping; cafe.repeat.set(13.6 / 2.4, 1);
    const dm = new THREE.MeshStandardMaterial({ map: cafe, roughness: 0.25, metalness: 0.05 });
    const dados = [[7.52, PI / 2], [12.48, -PI / 2]].map(([x, ry]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 1.2), dm); m.position.set(x, 0.62, -1.0); m.rotation.y = ry; g.add(m); g.add(c.slab(0.06, 0.06, 13.6, K.std(0x3a1a10, { roughness: 0.4 }), x + (ry > 0 ? 0.02 : -0.02), 1.25, -1.0)); return m; });
    let wallMat = null; g.traverse((o) => { if (o.isMesh && o.geometry?.parameters?.width === 0.2 && o.geometry.parameters.height === 6 && o.material?.map) wallMat = o.material; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i || !wallMat?.map) return; cafe.offset.x = wallMat.map.offset.x * 16 / 2.4; });
    const sign = c.sign('KEEP WALKING. THE LINES ARE LEVEL.', { w: 2.2, h: 0.16, bg: '#1a0e08', fg: '#c9a033', font: c.MONO, weight: 700 }); sign.position.set(7.54, 1.42, 3.6); sign.rotation.y = PI / 2; g.add(sign);
    c.clickable(dados[0], () => { c.sound.drip(); c.egg('bramford_tiles', 'Every grout line on this wall is dead level. Your eyes swear they are not. In the Bramford the building lies to you politely, and MLow tiled it that way on purpose.'); }, 'The tiles');
    // a dark coffered ceiling over everything
    ceiling(c, g, coffer('#1a0e08', '#5a3a1a'), [8, 6], { metal: 0.2, rough: 0.6 });
    // down light cones from the corridor lanterns and the sconces, in the haze
    [-2.5, 3.5].forEach((z) => shaft(c, g, 10, 5.0, z, 0.2, 1.3, 5.0, 0xffb070, 0.045));
    [-3, 0, 3].forEach((z) => { [7.75, 12.25].forEach((x) => { const s = shaft(c, g, x, 2.3, z, 0.05, 0.32, 1.1, 0xffc080, 0.05); s.rotation.x = PI; }); });
    motes(c, r, g, 140, 7.6, 12.4, 0.3, 5.5, -7, 6, 0xffd0a0, 0.025, 0.6);
    // the black bassinet at the end of the hall, an eye flower mobile turning over it
    const bas = new THREE.Group(); bas.position.set(11.4, 0, -5.0); g.add(bas); c.post(X(11.4), -5.0, 0.45);
    const blk = K.std(0x0a0a0c, { roughness: 0.35 }); bas.add(c.slab(0.5, 0.05, 0.85, blk, 0, 0.55, 0));
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.28, 0.35, 20, 1, true, 0, PI), blk); tub.material = blk.clone(); tub.material.side = THREE.DoubleSide; tub.rotation.set(0, 0, PI / 2); tub.scale.set(1, 2.4, 1); tub.position.y = 0.78; bas.add(tub);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, PI, 0, PI / 2), blk); hood.material = tub.material; hood.position.set(0, 0.8, -0.32); hood.rotation.x = -0.3; bas.add(hood);
    [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]].forEach(([x, z]) => bas.add(c.slab(0.03, 0.55, 0.03, K.std(0x1a1a1a, { metalness: 0.7 }), x, 0.27, z)));
    const mob = new THREE.Group(); mob.position.set(0, 1.55, 0.05); bas.add(mob); mob.add(c.slab(0.01, 0.3, 0.01, K.std(0x888888, { metalness: 1 }), 0, 0.15, 0));
    const ef = c.canvasTex(128, 128, (q, w) => K.eyeFlower(q, w / 2, w / 2, w * 0.48));
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2, d = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshBasicMaterial({ map: ef, transparent: true, side: THREE.DoubleSide, toneMapped: false })); d.position.set(Math.cos(a) * 0.2, -0.05 - (i % 2) * 0.08, Math.sin(a) * 0.2); mob.add(d); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; mob.rotation.y = t * 0.6; });
    // candles on the hall table, flickering, and light under the door at the end
    const cand = hot(c, 0xffb050, 2.2), fls = [];
    [[3.38, -0.12], [3.62, -0.3], [3.52, 0.0]].forEach(([x, z], i) => { g.add(c.slab(0.04, 0.16 + i * 0.04, 0.04, K.std(0xf4ead2), x, 0.68 + i * 0.02, z)); const f = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), cand); f.position.set(x, 0.79 + i * 0.04, z); f.scale.y = 1.8; g.add(f); fls.push([f, halo(c, K, g, x, 0.8 + i * 0.04, z, 'rgba(255,170,80,.6)', 0.5)]); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fls.forEach(([f, h], i) => { const v = 0.8 + Math.sin(t * 13 + i * 2) * 0.1 + Math.sin(t * 31 + i) * 0.08; f.scale.y = 1.6 * v; h.material.opacity = v; }); });
    g.add(c.slab(1.4, 0.02, 0.3, hot(c, 0xffc070, 1.6), 10, 0.012, -6.4));
    // a green haze of tannis root drifting along the floor
    const tn = []; for (let i = 0; i < (c.MOBILE ? 4 : 8); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(120,200,120,.25)'), transparent: true, depthWrite: false, opacity: 0.35 })); s.scale.set(2.2, 0.9, 1); g.add(s); tn.push(s); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tn.forEach((s, i) => { const u = (t * 0.03 + i / tn.length) % 1; s.position.set(8 + (i % 3) * 2, 0.35 + Math.sin(t + i) * 0.1, 5.5 - u * 12); s.material.opacity = Math.sin(u * PI) * 0.35; }); });
  },

  // ---------------- THE APARTMENT: the nineteenth floor ----------------
  apartment(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.1 };
    // ILLUSION: moire. The whole ceiling is the nineteenth floor's luminous ceiling: a glowing panel, and 34 cm under it a
    // louvre grille at a slightly different pitch and a hair off square. The two never move. The bands do, as you walk.
    const lum = new THREE.Mesh(new THREE.PlaneGeometry(19.5, 15.6), hot(c, 0xf4f4ff, 1.15)); lum.rotation.x = PI / 2; lum.position.set(10, 5.98, 0); g.add(lum);
    const grate = (pitch, ang, px) => { const t = c.canvasTex(256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#060606'; const n = 8; for (let i = 0; i < n; i++) { q.fillRect(0, i * h / n, w, h / n * 0.62); q.fillRect(i * w / n, 0, w / n * 0.62, h); } });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(19.5 / pitch / 8, 15.6 / pitch / 8); t.rotation = ang; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; };
    const g1 = new THREE.Mesh(new THREE.PlaneGeometry(19.5, 15.6), new THREE.MeshBasicMaterial({ map: grate(0.16, 0, 256), transparent: true, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide }));
    g1.rotation.x = PI / 2; g1.position.set(10, 5.92, 0); g.add(g1);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(19.5, 15.6), new THREE.MeshBasicMaterial({ map: grate(0.172, 0.05, 256), transparent: true, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide, color: 0x1a1a1a }));
    g2.rotation.x = PI / 2; g2.position.set(10, 5.58, 0); g.add(g2);
    c.clickable(g2, () => { c.sound.tick(); c.egg('apartment_ceiling', 'Two grilles, one glowing ceiling, and the bands roll across it like weather whenever you move. Thirty one thousand two hundred and fifty nine clerks never looked up. MLow did.'); }, 'The ceiling');
    // the office Christmas party: streamers across the room, a little tree with lights, paper everywhere
    const st = []; for (let i = 0; i < 6; i++) { const z = -5 + i * 2.2, pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push(new THREE.Vector3(0.4 + 19.2 * u, 5.4 - Math.sin(u * PI) * 0.9 + Math.sin(u * 40) * 0.04, z + Math.sin(u * 30 + i) * 0.05)); }
      st.push(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.018, 4), K.std(i % 2 ? 0xe8e8e8 : 0x8a8a8a, { roughness: 0.7 }))); g.add(st[i]); }
    const tree = new THREE.Group(); tree.position.set(1.2, 0, 6.8); g.add(tree); c.post(X(1.2), 6.8, 0.7);
    for (let k = 0; k < 4; k++) { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75 - k * 0.15, 0.7, 14), K.std(0x2a3a2a, { roughness: 0.9 })); cone.position.y = 0.7 + k * 0.42; tree.add(cone); }
    tree.add(c.slab(0.12, 0.4, 0.12, K.std(0x3a2a1a), 0, 0.2, 0));
    const tl = []; for (let i = 0; i < 40; i++) { const a = i * 2.4, y = 0.45 + (i / 40) * 1.7, rr = 0.75 * (1 - (y - 0.35) / 2.1) + 0.04; tl.push([Math.cos(a) * rr, y, Math.sin(a) * rr, 0, 1, [0xffffff, 0xffe0a0, 0xff9090, 0x90c0ff][i % 4]]); }
    const tli = field(c, tree, new THREE.SphereGeometry(0.035, 6, 5), hot(c, 0xffffff, 2.0), tl);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), hot(c, 0xfff0c0, 2.4)); star.position.y = 2.25; tree.add(star); halo(c, K, tree, 0, 2.25, 0, 'rgba(255,250,230,.6)', 0.9);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tli.visible = Math.sin(t * 3) > -0.7; star.rotation.y = t; });
    field(c, g, new THREE.PlaneGeometry(0.21, 0.28).rotateX(-PI / 2), K.std(0xf4f4f0, { roughness: 0.9, side: THREE.DoubleSide }), Array.from({ length: c.MOBILE ? 40 : 80 }, (_, i) => [1 + Math.random() * 18, 0.006 + i * 0.0001, -0.5 + Math.random() * 7.5, Math.random() * 6.3]));
    // the elevator floor dial over the west door, its needle stuck between eighteen and twenty
    const dial = panel(c, g, 1.0, 0.55, (q, w, h) => { q.fillStyle = '#1a1a1a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8d0b0'; q.lineWidth = 4; q.beginPath(); q.arc(w / 2, h * 0.92, h * 0.78, PI, 0); q.stroke();
      q.fillStyle = '#d8d0b0'; q.font = `700 ${h * 0.11}px ${c.MONO}`; q.textAlign = 'center'; for (let i = 0; i <= 10; i++) { const a = PI + i / 10 * PI, n = i * 3 || 'L'; q.fillText(String(n), w / 2 + Math.cos(a) * h * 0.66, h * 0.95 + Math.sin(a) * h * 0.66); } }, 256, 0.14, 4.25, 3.8, { basic: true, glow: 1.4, ry: PI / 2 });
    const needle = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.36).translate(0, 0.18, 0), hot(c, 0xffffff, 2.0)); needle.position.set(0.15, 4.0, 3.8); needle.rotation.y = PI / 2; g.add(needle);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; needle.rotation.x = -(Math.sin(t * 0.4) * 0.15 + 0.38); });
    // venetian blind light on the floor by the windows, and dust in it
    panel(c, g, 6, 3.2, (q, w, h) => { for (let i = 0; i < 18; i++) { q.fillStyle = 'rgba(255,255,255,.55)'; q.fillRect(0, i * h / 18, w, h / 18 * 0.5); } const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); q.globalCompositeOperation = 'destination-out'; q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 256, 5.5, 0.015, -5.3, { add: true, floor: true, op: 0.5 });
    motes(c, r, g, 140, 1, 19, 0.3, 5.5, -7, 7, 0xffffff, 0.025, 0.5);
    // the floor number, lit, and the desk lamps on the near desk
    const fl = c.sign('19', { w: 0.8, h: 0.6, bg: '#111', fg: '#f4f4f4', font: c.SERIF, weight: 900, glow: 16, border: '#d8d0b0' }); fl.material.color.setScalar(1.4); fl.position.set(19.82, 4.25, 3.8); fl.rotation.y = -PI / 2; g.add(fl);
    halo(c, K, g, 10.4, 1.3, 2.05, 'rgba(255,255,240,.6)', 0.8);
  },

  // ---------------- THE FRENCH CONNECTION: under the el ----------------
  chase(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.0, ca: 0.005 };
    // ILLUSION: a dolly zoom. Stand on the camera mark in the street and look down the el: the lens zooms in while the
    // camera tracks back, so the car stays put and the whole street stretches and slams shut around it, over and over.
    const MX = 10.2, MZ = 0.9, BASE = c.MOBILE ? 72 : 66; let tin = 0, onMark = false;
    r.fov = (P) => (onMark ? BASE - 30 * (0.5 - 0.5 * Math.cos(tin * 0.9)) : BASE);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) { onMark = false; return; } const d = Math.hypot(P.x - r.x0 - MX, P.z - MZ); onMark = d < 0.9 && Math.cos(P.yaw) > 0.6 && !P.ride; tin = onMark ? tin + dt : 0; if (onMark && tin > 3 && tin < 3 + dt * 1.5) c.egg('chase_dolly', 'Track back, zoom in, the car stays the same size and Bensonhurst comes apart around it. Hitchcock did it on a staircase. MLow did it under the el, on a mark you can stand on.'); });
    mark(c, K, g, MX, MZ, 'STAND. LOOK DOWN THE EL.');
    // the dolly track the effect needs: rails and sleepers from the mark back to the south wall, and the camera dolly on it
    const rail = K.std(0x8a8e96, { metalness: 1, roughness: 0.3 });
    [-0.3, 0.3].forEach((dx) => g.add(c.slab(0.05, 0.05, 6.6, rail, MX + dx, 0.03, MZ + 3.6)));
    field(c, g, new THREE.BoxGeometry(0.9, 0.03, 0.08), K.std(0x4a3420, { roughness: 0.9 }), Array.from({ length: 16 }, (_, i) => [MX, 0.015, MZ + 0.5 + i * 0.42]));
    const dolly = new THREE.Group(); dolly.position.set(MX, 0, 7.3); g.add(dolly); c.post(X(MX), 7.3, 0.5);
    dolly.add(c.slab(0.8, 0.12, 0.9, K.std(0x2a2a2a, { metalness: 0.6 }), 0, 0.18, 0)); dolly.add(c.slab(0.08, 0.9, 0.08, rail, 0, 0.7, 0));
    const cam = new THREE.Group(); cam.position.set(0, 1.25, 0); dolly.add(cam); cam.add(c.slab(0.28, 0.32, 0.5, K.std(0x111111, { roughness: 0.4 }), 0, 0, 0));
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 16), K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.3 })); lens.rotation.x = PI / 2; lens.position.z = -0.38; cam.add(lens);
    [[-0.1, 0.24], [0.14, 0.24]].forEach(([z, y]) => { const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20), K.std(0x111111, { metalness: 0.5 })); reel.rotation.z = PI / 2; reel.position.set(0, y, z); cam.add(reel); });
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), hot(c, 0xff2020, 2.5)); tally.position.set(0.1, 0.18, -0.2); cam.add(tally);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tally.visible = onMark || Math.sin(t * 4) > 0; });
    // the light through the el: bars of sun across the asphalt from between the ties, and the slanting shafts that make them
    panel(c, g, 13.4, 15.6, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 18; k++) { const y = (k + 0.5) / 18 * h; q.fillStyle = 'rgba(255,236,190,.7)'; q.fillRect(0, y - h / 18 * 0.22, w, h / 18 * 0.44); } }, 512, 10, 0.016, 0, { add: true, floor: true, op: 0.4 });
    // sparks off the third rail when the train goes over
    const NS = c.MOBILE ? 60 : 120, sp = new Float32Array(NS * 3), sv = new Float32Array(NS * 3), sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: new THREE.Color(1.0, 0.75, 0.3).multiplyScalar(2.5), size: 0.05, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sparks.frustumCulled = false; g.add(sparks);
    for (let k = 0; k < NS; k++) sp[k * 3 + 1] = -5;
    let si = 0, train = null; g.traverse((o) => { if (!train && o.isGroup && o.children.length > 10 && o.children[0]?.geometry?.parameters?.depth === 17) train = o; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const over = train && Math.abs(train.position.z) < 9;
      if (over) for (let n = 0; n < 4; n++) { const k = si++ % NS; sp[k * 3] = 3.2 + Math.random() * 13.6; sp[k * 3 + 1] = 5.95; sp[k * 3 + 2] = train.position.z + (Math.random() - 0.5) * 8; sv[k * 3] = (Math.random() - 0.5) * 1.5; sv[k * 3 + 1] = -Math.random() * 2; sv[k * 3 + 2] = (Math.random() - 0.5) * 1.5; }
      for (let k = 0; k < NS; k++) { if (sp[k * 3 + 1] < -1) continue; sv[k * 3 + 1] -= 9.8 * dt; sp[k * 3] += sv[k * 3] * dt; sp[k * 3 + 1] += sv[k * 3 + 1] * dt; sp[k * 3 + 2] += sv[k * 3 + 2] * dt; if (sp[k * 3 + 1] < 0.02) sp[k * 3 + 1] = -5; }
      sgeo.attributes.position.needsUpdate = true; });
    // a traffic light hung over the street, blinking amber; station signs on the columns; neon in a shop window
    const tlg = new THREE.Group(); tlg.position.set(10, 5.15, -2.2); g.add(tlg); tlg.add(c.slab(0.02, 0.6, 0.02, K.std(0x111111), 0, 0.6, 0)); tlg.add(c.slab(0.36, 1.0, 0.3, K.std(0x2a3a1a, { metalness: 0.4 }), 0, 0, 0));
    const lamps = [[0xff2a1a, 0.3], [0xffb020, 0], [0x20ff8a, -0.3]].map(([col, y]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), hot(c, col, 2.2)); m.position.set(0, y, 0.16); tlg.add(m); const m2 = m.clone(); m2.position.z = -0.16; m2.rotation.y = PI; tlg.add(m2); return [m, m2]; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const on = Math.sin(t * 5) > 0; lamps[0].forEach((m) => { m.visible = false; }); lamps[2].forEach((m) => { m.visible = false; }); lamps[1].forEach((m) => { m.visible = on; }); });
    [[3.42, 2.5, PI / 2], [16.58, -1.3, -PI / 2]].forEach(([x, z, ry]) => { const s = c.sign('86 ST\nN3W LINE', { w: 0.9, h: 0.6, bg: '#0e3a24', fg: '#f4f4f4', font: c.FONT, weight: 800, border: '#f4f4f4' }); s.position.set(x, 3.2, z); s.rotation.y = ry; g.add(s); });
    const neon = c.sign('N3W PIZZA\nSLICE 25c', { w: 1.6, h: 0.7, bg: null, fg: '#ff4f6a', font: c.FONT, weight: 800, glow: 22 }); neon.material.color.setScalar(2.0); neon.position.set(0.16, 3.0, -3.6); neon.rotation.y = PI / 2; g.add(neon);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; neon.visible = Math.sin(t * 17) > -0.95 || Math.sin(t * 0.5) > 0.4; });
    // puddles that hold the sky and the neon, and the litter of the street
    [[5.2, 3.4, 1.6, 0.9], [14.6, -2.6, 1.2, 0.7], [11.6, 5.6, 1.0, 0.6], [6.0, -5.2, 1.4, 0.8]].forEach(([x, z, a, b]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 1, roughness: 0.04 })); p.rotation.x = -PI / 2; p.scale.set(a, b, 1); p.position.set(x, 0.009, z); g.add(p); });
    field(c, g, new THREE.PlaneGeometry(0.22, 0.16).rotateX(-PI / 2), K.std(0xd8d0bc, { roughness: 0.9, side: THREE.DoubleSide }), Array.from({ length: c.MOBILE ? 30 : 60 }, (_, i) => [3.4 + Math.random() * 13.2, 0.007 + i * 0.0001, -6 + Math.random() * 13.5, Math.random() * 6.3, 0.6 + Math.random() * 0.8]));
    motes(c, r, g, 140, 3.4, 16.6, 0.3, 5.8, -7, 7, 0xffe8c0, 0.03, 0.55);
  },
});

// a hollow mask: the relief is pushed away from you but shaded as if it bulged toward you, so it turns to follow you
function hollowMask(c, g, w, h, depth, hf, tint, light = [-0.45, 0.6, 0.66]) {
  const { THREE } = c, N = c.MOBILE ? 56 : 84, geo = new THREE.PlaneGeometry(w, h, N, N), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), e = 0.01;
  const L = new THREE.Vector3(...light).normalize(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / (w / 2), y = pos.getY(i) / (h / 2), z0 = hf(x, y);
    pos.setZ(i, -z0 * depth);
    n.set(-(hf(x + e, y) - hf(x - e, y)) / (2 * e) * depth / (w / 2), -(hf(x, y + e) - hf(x, y - e)) / (2 * e) * depth / (h / 2), 1).normalize();
    const sh = 0.18 + 0.95 * Math.max(0, n.dot(L)), [cr, cg, cb] = tint(x, y, z0); col[i * 3] = cr * sh; col[i * 3 + 1] = cg * sh; col[i * 3 + 2] = cb * sh; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); g.add(m); return m;
}
// interior mapping: a flat plane that draws a box of street behind itself, ray traced per pixel, with true parallax
function portal(c, r, g, w, h, d, tex, o = {}) {
  const { THREE } = c;
  const mat = new THREE.ShaderMaterial({ uniforms: { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, tB: { value: tex.back }, tS: { value: tex.side }, tF: { value: tex.floor }, uW: { value: o.bw || w }, uH: { value: o.bh || h }, uD: { value: d } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uCam; uniform float uT, uW, uH, uD; uniform sampler2D tB, tS, tF; varying vec3 vP;
      void main(){
        vec3 dir = normalize(vP - uCam);
        float tx = ((dir.x > 0.0 ? 0.5 * uW : -0.5 * uW) - vP.x) / dir.x;
        float ty = ((dir.y > 0.0 ? uH : 0.0) - vP.y) / dir.y;
        float tz = (-uD - vP.z) / dir.z;
        float t = min(tx, min(ty, tz)); vec3 p = vP + dir * t; vec3 col;
        if (t == tz) col = texture2D(tB, vec2(p.x / uW + 0.5, p.y / uH)).rgb;
        else if (t == tx) col = texture2D(tS, vec2(dir.x > 0.0 ? -p.z / uD : 1.0 + p.z / uD, p.y / uH)).rgb * (dir.x > 0.0 ? 0.85 : 1.0);
        else if (dir.y < 0.0) col = texture2D(tF, vec2(p.x / uW + 0.5, -p.z / uD)).rgb;
        else col = mix(vec3(0.2, 0.17, 0.36), vec3(0.04, 0.05, 0.16), clamp(p.y / uH - 0.4, 0.0, 1.0));
        // a cab crossing the street a third of the way in
        float tc = (-uD * 0.42 - vP.z) / dir.z; vec3 q = vP + dir * tc; float cx = mod(uT * 3.2, uW * 3.0) - uW * 1.5;
        if (tc < t && q.y > 0.15 && q.y < 0.95 && abs(q.x - cx) < 1.05) { col = vec3(0.85, 0.6, 0.08) * (q.y > 0.62 ? 0.55 : 1.0); if (q.y < 0.4 && abs(q.x - cx - 0.95) < 0.12) col = vec3(3.0, 2.6, 1.8); if (q.y > 0.95 - 0.12 && abs(q.x - cx) < 0.25) col = vec3(2.2, 2.0, 1.2); t = tc; }
        col *= 1.0 + step(0.82, col.r) * step(0.55, col.g) * 1.4;
        col = mix(col, vec3(0.05, 0.05, 0.11), clamp(t / (uD * 2.2), 0.0, 0.55));
        gl_FragColor = vec4(col, 1.0);
      }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), mat); g.add(m);
  const inv = new THREE.Matrix4(); let ready = false;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (!ready) { m.updateWorldMatrix(true, false); inv.copy(m.matrixWorld).invert(); ready = true; } mat.uniforms.uCam.value.copy(c.camera.position).applyMatrix4(inv); mat.uniforms.uT.value = t; });
  return m;
}

Object.assign(ROOM, {
  // ---------------- BIRDMAN: the roof over Times Square ----------------
  birdman(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.25, vig: 0.55, ca: 0.005 };
    // ILLUSION: a hollow mask. The Birdman head from the play is hung on a stand as a hollow mould: its beak points away
    // from you, but it is painted lit from above like a face, so your brain flips it out and it turns to watch you walk.
    const M = new THREE.Group(); M.position.set(5.6, 0, -2.4); M.rotation.y = 0.45; g.add(M); c.post(X(5.6), -2.4, 0.8);
    const hf = (x, y) => { const head = Math.sqrt(Math.max(0, 1 - x * x / 0.62 - (y - 0.05) * (y - 0.05) / 0.82)) * 0.42;
      const beak = 0.7 * Math.exp(-x * x / 0.012) * Math.exp(-((y + 0.18) * (y + 0.18)) / 0.05) + 0.35 * Math.exp(-x * x / 0.03) * Math.exp(-((y + 0.02) * (y + 0.02)) / 0.03);
      const eyes = -0.14 * (Math.exp(-((x - 0.3) ** 2 + (y - 0.2) ** 2) / 0.018) + Math.exp(-((x + 0.3) ** 2 + (y - 0.2) ** 2) / 0.018));
      const brow = 0.08 * Math.exp(-((y - 0.36 + Math.abs(x) * 0.25) ** 2) / 0.004) * (Math.abs(x) < 0.62 ? 1 : 0); return Math.max(0, head + beak + eyes + brow); };
    const tint = (x, y, z) => { const eye = Math.exp(-((Math.abs(x) - 0.3) ** 2 + (y - 0.2) ** 2) / 0.006), bk = Math.exp(-x * x / 0.02) * Math.exp(-((y + 0.15) ** 2) / 0.06); if (z <= 0.001) return [0.05, 0.05, 0.07];
      return [0.32 + bk * 0.6 + eye * 0.1, 0.3 + bk * 0.42 + eye * 0.6, 0.36 + bk * 0.05 + eye * 0.9]; };
    const mask = hollowMask(c, M, 1.5, 1.8, 0.55, hf, tint); mask.position.set(0, 2.05, 0.05);
    M.add(c.slab(1.7, 2.05, 0.06, K.std(0x0a0a0e, { roughness: 0.6 }), 0, 2.05, -0.7)); [-0.83, 0.83].forEach((x) => M.add(c.slab(0.04, 1.9, 0.68, K.std(0x0a0a0e, { roughness: 0.6 }), x, 2.05, -0.36))); M.add(c.slab(0.1, 1.1, 0.1, K.std(0x2a2a2a, { metalness: 0.7 }), 0, 0.55, -0.4)); M.add(c.slab(0.9, 0.06, 0.8, K.std(0x2a2a2a, { metalness: 0.7 }), 0, 0.03, -0.3));
    const pl = c.sign('BIRDMAN HEAD, HOLLOW. IT IS LOOKING AT YOU ANYWAY.', { w: 1.7, h: 0.14, bg: '#0a0a0e', fg: '#ff4fa3', font: c.MONO, weight: 700 }); pl.position.set(0, 0.96, 0.02); M.add(pl);
    halo(c, K, M, 0, 3.3, 0.4, 'rgba(255,240,220,.35)', 1.6);
    // the drum kit that plays the score, set up on the tar
    const D = new THREE.Group(); D.position.set(13.4, 0, -1.4); D.rotation.y = -0.6; g.add(D); c.post(X(13.4), -1.4, 0.9);
    const shell = K.std(0x8a0f2e, { metalness: 0.4, roughness: 0.3 }), head = K.std(0xf0ece0, { roughness: 0.7 }), chrome = K.std(0xd0d4d8, { metalness: 1, roughness: 0.2 }), brass = K.std(0xd6a640, { metalness: 1, roughness: 0.3 });
    const drum = (r0, len, x, y, z, rx = 0) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, len, 24), shell); s.position.set(x, y, z); s.rotation.x = rx; D.add(s); const hd = new THREE.Mesh(new THREE.CircleGeometry(r0 * 0.96, 24), head); hd.position.set(x, y + Math.cos(rx) * len / 2 + 0.002, z + Math.sin(rx) * len / 2); hd.rotation.x = -PI / 2 + rx; D.add(hd); return s; };
    const kick = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 28), shell); kick.rotation.x = PI / 2; kick.position.set(0, 0.28, 0); D.add(kick);
    const kf = panel(c, D, 0.5, 0.5, (q, w) => { q.fillStyle = '#f0ece0'; q.beginPath(); q.arc(w / 2, w / 2, w / 2, 0, 7); q.fill(); K.eyeFlower(q, w / 2, w / 2, w * 0.36); }, 128, 0, 0.28, 0.205, { alpha: true }); kf.material.transparent = true;
    drum(0.16, 0.14, -0.42, 0.62, 0.15); drum(0.12, 0.12, -0.14, 0.72, -0.1, 0.25); drum(0.13, 0.13, 0.18, 0.72, -0.1, 0.25); drum(0.19, 0.3, 0.5, 0.42, 0.2);
    [[-0.62, 1.05, 0.0, 0.2], [0.65, 1.15, -0.2, 0.22], [-0.25, 1.2, -0.35, 0.18]].forEach(([x, y, z, rr]) => { D.add(c.slab(0.02, y, 0.02, chrome, x, y / 2, z)); const cy = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr * 0.98, 0.012, 24), brass); cy.position.set(x, y, z); cy.rotation.z = 0.12; D.add(cy); });
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), K.std(0x111111)); stool.position.set(0, 0.55, 0.65); D.add(stool); D.add(c.slab(0.04, 0.5, 0.04, chrome, 0, 0.27, 0.65));
    c.clickable(D, () => { [0, 160, 320, 400, 480, 640, 720, 800].forEach((ms, i) => setTimeout(() => (i % 3 === 0 ? c.sound.thud(0.4) : i % 3 === 1 ? c.sound.tick() : c.sound.boom(0.15)), ms)); c.egg('birdman_drums', 'The whole score is one man on a drum kit, following the actor up the stairs and onto the roof. This kit plays a single fill and then waits for its cue. MLow is its cue.'); }, 'The drum kit');
    // a tar roof: seams, patches, puddles that hold the neon
    panel(c, g, 19.6, 15.6, (q, w, h) => { q.fillStyle = '#2a2628'; q.fillRect(0, 0, w, h); noise(q, w, h, 40000, 0.25, ['#000', '#5a5458', '#3a3436'], 3);
      q.strokeStyle = 'rgba(0,0,0,.6)'; q.lineWidth = 5; for (let y = 0; y < h; y += h / 9) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y + 6); q.stroke(); }
      for (let k = 0; k < 14; k++) { q.fillStyle = `rgba(${10 + Math.random() * 20},${10 + Math.random() * 15},${12 + Math.random() * 20},.75)`; q.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 120, 30 + Math.random() * 80); } }, 1024, 10, 0.011, 0, { floor: true, rough: 0.55 });
    [[7.6, 4.2, 1.4, 0.8], [12.2, 2.2, 1.0, 0.6], [3.6, -0.6, 1.2, 0.7], [16.4, 4.8, 0.9, 0.5]].forEach(([x, z, a, b]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: 0x08060a, metalness: 1, roughness: 0.03 })); p.rotation.x = -PI / 2; p.scale.set(a, b, 1); p.position.set(x, 0.014, z); g.add(p); });
    // Times Square's glow in the sky behind, and two searchlights from the street
    [[4, 7, -14, 'rgba(255,60,170,.55)', 16], [14, 6, -14, 'rgba(40,200,255,.5)', 15], [10, 10, -16, 'rgba(255,200,80,.4)', 18]].forEach(([x, y, z, col, s]) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(s, s * 0.6, 1); sp.position.set(x, y, z); g.add(sp); });
    const sl = [6, 15].map((x) => { const s = shaft(c, g, x, -1, -9.5, 0.2, 2.2, 22, 0xe8f0ff, 0.07); s.rotation.x = PI; return s; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sl.forEach((s, k) => { s.rotation.z = Math.sin(t * 0.4 + k * 2.5) * 0.5; s.rotation.x = PI - 0.15 + Math.sin(t * 0.3 + k) * 0.1; }); });
    // the billboard on the east parapet, its ticker crawling
    const tk = c.canvasTex(1024, 128, (q, w, h) => { q.fillStyle = '#05050a'; q.fillRect(0, 0, w, h); q.fillStyle = '#ff4fa3'; q.font = `800 ${h * 0.6}px ${c.FONT}`; q.textBaseline = 'middle'; q.fillText('TONIGHT ONLY. BIRDMAN, WITH NEW YORKERS. SOLD OUT. ', 10, h / 2); q.fillStyle = 'rgba(0,0,0,.45)'; for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 1.5, h); });
    tk.wrapS = THREE.RepeatWrapping; tk.repeat.set(1.4, 1);
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.9), new THREE.MeshBasicMaterial({ map: tk, toneMapped: false })); bb.material.color.setScalar(1.8); bb.position.set(19.6, 6.4, -2.5); bb.rotation.y = -PI / 2; g.add(bb);
    g.add(c.slab(0.2, 1.1, 7.3, K.std(0x111114, { metalness: 0.6 }), 19.72, 6.4, -2.5));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tk.offset.x = t * 0.08; });
    // red aircraft beacons on the water tower and the parapets, steam out of the vents
    const bc = [[3.2, 6.75, -5.2], [0.4, 9.9, -7.6], [19.6, 9.9, -7.6], [19.6, 7.1, -2.5]].map(([x, y, z]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), hot(c, 0xff2020, 2.6)); m.position.set(x, y, z); g.add(m); return [m, halo(c, K, g, x, y, z, 'rgba(255,40,40,.6)', 0.9)]; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const on = (t % 1.6) < 0.5; bc.forEach(([m, h]) => { m.visible = h.visible = on; }); });
    K.steam(g, 2.4, 1.0, 1.2); K.steam(g, 17.8, 1.0, 0.6);
    motes(c, r, g, 120, 1, 19, 0.3, 7, -7, 7, 0xffb0e0, 0.035, 0.45);
  },

  // ---------------- NETWORK: the window ----------------
  network(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.2, vig: 0.55 };
    // ILLUSION: an infinity tunnel. A console television pointed at itself: inside the cabinet the screen holds a screen
    // that holds a screen, turning a few degrees each time, down a well that has no bottom. The cabinet is a metre deep.
    const T = new THREE.Group(); T.position.set(12.2, 0, 0.4); T.rotation.y = -0.35; g.add(T); c.post(X(12.2), 0.4, 0.9);
    const walnut = K.std(0x4a2a14, { roughness: 0.45 }), blk = K.std(0x050506, { roughness: 0.9 });
    T.add(c.slab(1.7, 0.55, 1.05, walnut, 0, 0.275, -0.4)); T.add(c.slab(1.7, 0.12, 1.05, walnut, 0, 1.79, -0.4)); T.add(c.slab(0.14, 1.3, 1.05, walnut, -0.78, 1.2, -0.4)); T.add(c.slab(0.14, 1.3, 1.05, walnut, 0.78, 1.2, -0.4)); T.add(c.slab(1.7, 1.3, 0.05, blk, 0, 1.2, -0.92));
    [[-0.84, 0.08], [0.84, 0.08]].forEach(([x, y]) => T.add(c.slab(0.08, 0.16, 0.08, K.std(0xd6a640, { metalness: 1 }), x * 0.9, y, 0)));
    const ringT = c.canvasTex(256, 192, (q, w, h) => { q.clearRect(0, 0, w, h); const rr = (x, y, ww, hh, rad) => { q.beginPath(); q.moveTo(x + rad, y); q.arcTo(x + ww, y, x + ww, y + hh, rad); q.arcTo(x + ww, y + hh, x, y + hh, rad); q.arcTo(x, y + hh, x, y, rad); q.arcTo(x, y, x + ww, y, rad); q.closePath(); };
      q.lineWidth = 10; q.strokeStyle = '#ffffff'; rr(10, 10, w - 20, h - 20, 34); q.stroke(); q.lineWidth = 3; q.strokeStyle = 'rgba(255,255,255,.5)'; rr(24, 24, w - 48, h - 48, 26); q.stroke(); });
    const NL = c.MOBILE ? 12 : 18, rings = [];
    for (let i = 0; i < NL; i++) { const s = Math.pow(0.84, i), m = new THREE.Mesh(new THREE.PlaneGeometry(1.36 * s, 1.02 * s), new THREE.MeshBasicMaterial({ map: ringT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.position.set(0, 1.2, -0.02 - (1 - s) * 0.95); T.add(m); rings.push(m); }
    const core = panel(c, T, 0.3, 0.3, (q, w) => K.eyeFlower(q, w / 2, w / 2, w * 0.46), 128, 0, 1.2, -0.9, { basic: true, alpha: true, glow: 1.6 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.08), new THREE.MeshStandardMaterial({ color: 0x223040, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.6, depthWrite: false })); glass.position.set(0, 1.2, 0.13); T.add(glass);
    const col = new THREE.Color();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; rings.forEach((m, i) => { m.rotation.z = Math.sin(t * 0.35) * 0.09 * i; col.setHSL((t * 0.05 + i * 0.045) % 1, 0.85, 0.55); m.material.color.copy(col).multiplyScalar(1.7 - i * 0.07); }); core.rotation.z = t * 0.6; });
    c.clickable(T, () => { c.sound.beep(1000, 0.4, 0.15, 'sine'); c.egg('network_feedback', 'Point a camera at its own monitor and you get a tunnel to nowhere. Network television worked out that trick in 1976 and never stopped doing it. MLow pointed the census at itself and got a city.'); }, 'The console set');
    const lt = c.sign('N3W YORKERS NETWORK. LIVE FROM ITSELF', { w: 1.6, h: 0.14, bg: '#0a0a0e', fg: '#f5c542', font: c.MONO, weight: 700 }); lt.position.set(0, 0.45, 0.13); T.add(lt);
    // an acoustic tile ceiling with can lights; blue television light on the carpet; rain running down the window
    ceiling(c, g, (q, w, h) => { q.fillStyle = '#2a2622'; q.fillRect(0, 0, w, h); noise(q, w, h, 4000, 0.3, ['#000', '#5a5248'], 2); q.strokeStyle = '#141210'; q.lineWidth = 6; q.strokeRect(0, 0, w, h); }, [14, 11], { metal: 0, rough: 0.95 });
    field(c, g, new THREE.CircleGeometry(0.12, 16).rotateX(PI / 2), hot(c, 0xfff0d8, 1.8), [[3, 5.95, 5], [7, 5.95, 5], [13, 5.95, 5], [17, 5.95, 5], [3, 5.95, -4], [17, 5.95, -4], [10, 5.95, 2]]);
    [[3, 5], [7, 5], [13, 5], [17, 5], [3, -4], [17, -4]].forEach(([x, z]) => shaft(c, g, x, 5.9, z, 0.1, 1.0, 5.8, 0xffe8c8, 0.04));
    const tvg = [[5.0, -0.6, 1.8], [12.0, 1.4, 1.8]].map(([x, z, s]) => panel(c, g, s, s, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(120,170,255,.8)'); gr.addColorStop(1, 'rgba(120,170,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 128, x, 0.016, z, { add: true, floor: true, op: 0.5 }));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tvg.forEach((m, i) => { m.material.opacity = 0.2 + Math.sin(t * 7 + i * 3) * 0.06 + Math.sin(t * 23 + i) * 0.04; }); });
    const rainT = c.canvasTex(256, 512, (q, w, h) => { q.clearRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const x = Math.random() * w, y = Math.random() * h, l = 20 + Math.random() * 80; const gr = q.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(200,220,255,0)'); gr.addColorStop(1, 'rgba(220,235,255,.7)'); q.strokeStyle = gr; q.lineWidth = 1 + Math.random() * 2; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.random() * 3, y + l); q.stroke(); q.fillStyle = 'rgba(230,240,255,.8)'; q.beginPath(); q.arc(x, y + l, 2, 0, 7); q.fill(); } });
    rainT.wrapS = rainT.wrapT = THREE.RepeatWrapping; rainT.repeat.set(4, 1.4);
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 3.4), new THREE.MeshBasicMaterial({ map: rainT, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false })); rw.position.set(10, 2.65, -7.7); g.add(rw);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; rainT.offset.y = t * 0.12; });
    // lightning washes in through the window across the floor
    const lw = panel(c, g, 12, 6, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(200,215,255,1)'); gr.addColorStop(1, 'rgba(200,215,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000'; for (let x = w / 4; x < w; x += w / 4) q.fillRect(x - 6, 0, 12, h); }, 256, 10, 0.017, -4.6, { add: true, floor: true, op: 0 });
    let fl = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (Math.random() < dt * 0.15) fl = 1; fl *= 0.9; lw.material.opacity = fl * (Math.random() < 0.6 ? 0.8 : 0.3); });
    // the ratings board: tonight's share, counting up
    const rb = c.canvasTex(512, 256, () => {}), rq = rb.userData.canvas.getContext('2d');
    const rbm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: rb, toneMapped: false })); rbm.material.color.setScalar(1.6); rbm.position.set(19.82, 3.6, 4.3); rbm.rotation.y = -PI / 2; g.add(rbm);
    let lastN = -1; const rbDraw = (n) => { rq.fillStyle = '#060a06'; rq.fillRect(0, 0, 512, 256); rq.strokeStyle = '#2aff8a'; rq.lineWidth = 6; rq.strokeRect(6, 6, 500, 244); rq.fillStyle = '#2aff8a'; rq.font = `700 34px ${c.MONO}`; rq.fillText('THE N3W RATINGS', 30, 56); rq.font = `700 30px ${c.MONO}`; rq.fillText('SHARE      ' + (31 + (n % 9)), 30, 120); rq.fillText('COUNTED    ' + (1111 + n * 7).toLocaleString('en-US'), 30, 170); rq.fillText('WINDOWS    ' + (3 + (n % 21)) + ' OF 24', 30, 220); rb.needsUpdate = true; };
    rbDraw(0); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const n = (t / 1.5) | 0; if (n !== lastN) { lastN = n; rbDraw(n); } });
    // cigarette smoke over the sofa, and the desk lamp's pool
    const sm = []; for (let i = 0; i < (c.MOBILE ? 3 : 6); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(200,200,210,.3)'), transparent: true, depthWrite: false, opacity: 0.3 })); g.add(s); sm.push(s); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sm.forEach((s, i) => { const u = (t * 0.07 + i / sm.length) % 1; s.position.set(6.9 + Math.sin(t * 0.5 + i) * 0.4, 0.6 + u * 3.2, 2.0 + Math.cos(t * 0.4 + i) * 0.3); s.scale.setScalar(0.5 + u * 1.8); s.material.opacity = Math.sin(u * PI) * 0.28; }); });
    halo(c, K, g, 17.4, 1.15, 5.4, 'rgba(255,220,160,.6)', 1.2);
    motes(c, r, g, 90, 2, 18, 0.4, 5.5, -6, 7, 0xd0dcff, 0.025, 0.4);
  },

  // ---------------- UNCUT GEMS: the showroom on 47th Street ----------------
  gems(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.25, vig: 0.5, ca: 0.006 };
    // ILLUSION: a reverspective, after Patrick Hughes. Two blocks stick out of the north wall toward you, and they are
    // painted as two showroom corridors going away from you. Walk across the room and they swing round to follow you.
    const RV = new THREE.Group(); RV.position.set(18.0, 2.5, -7.86); g.add(RV);
    const quad = (a, b, cc, d, tex) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...cc, ...a, ...cc, ...d], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide })); m.material.color.setScalar(1.15); RV.add(m); return m; };
    // faces are drawn with u running from the wall edge (0) to the front edge (1): lines parallel to the wall converge on the front
    const floorT = c.canvasTex(256, 256, (q, w, h) => { const n = 8; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { q.fillStyle = (i + j) % 2 ? '#f2eee4' : '#1a1418'; q.fillRect(i * w / n, j * h / n, w / n, h / n); } });
    const ceilT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#16121a'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff4d8'; for (let i = 0; i < 6; i++) q.fillRect(i * w / 6 + 10, h * 0.42, w / 12, h * 0.16); });
    const wallT = (flip) => c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#2a1e10'; q.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const x = i * w / 6; q.fillStyle = '#0c0a10'; q.fillRect(x + 6, h * 0.3, w / 6 - 12, h * 0.4); q.fillStyle = '#ffe6a0'; q.fillRect(x + 6, h * 0.3, w / 6 - 12, 4); for (let k = 0; k < 4; k++) { q.fillStyle = ['#f5c542', '#22d3ee', '#ff4fa3', '#ffffff'][(k + i) % 4]; q.beginPath(); q.arc(x + w / 12, h * (0.36 + k * 0.09), 4, 0, 7); q.fill(); } q.fillStyle = '#c9a033'; q.fillRect(x, 0, 3, h); } if (flip) { q.globalCompositeOperation = 'copy'; } });
    const endT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#0a0810'; q.fillRect(0, 0, w, h); const gr = q.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.6); gr.addColorStop(0, '#fff4d0'); gr.addColorStop(0.4, '#f5c542'); gr.addColorStop(1, '#2a1a08'); q.fillStyle = gr; q.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.88); q.fillStyle = '#0a0810'; q.font = `800 ${h * 0.09}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('N3W', w / 2, h * 0.3); q.fillText('GEMS', w / 2, h * 0.42); K.eyeFlower(q, w / 2, h * 0.68, w * 0.16); });
    const fT = wallT(), fT2 = wallT(true);
    [-0.9, 0.9].forEach((cx) => { const BW = 1.7, BH = 2.3, FW = 0.42, FH = 0.56, P = 0.85;
      const b = [[cx - BW / 2, -BH / 2, 0], [cx + BW / 2, -BH / 2, 0], [cx + BW / 2, BH / 2, 0], [cx - BW / 2, BH / 2, 0]], f = [[cx - FW / 2, -FH / 2, P], [cx + FW / 2, -FH / 2, P], [cx + FW / 2, FH / 2, P], [cx - FW / 2, FH / 2, P]];
      // floor (bottom face), ceiling (top), two walls, the end
      quad(b[0], b[1], f[1], f[0], floorT); quad(b[3], b[2], f[2], f[3], ceilT);
      quad(b[0], f[0], f[3], b[3], fT); quad(b[1], f[1], f[2], b[2], fT2);
      quad(f[0], f[1], f[2], f[3], endT); });
    RV.add(c.slab(3.7, 2.5, 0.04, K.std(0x14101a), 0, 0, -0.03)); [[-1.86, 0], [1.86, 0]].forEach(([x]) => RV.add(c.slab(0.06, 2.5, 0.12, K.std(0xc9a033, { metalness: 1, roughness: 0.3 }), x, 0, 0.04)));
    [-1.26, 1.26].forEach((y) => RV.add(c.slab(3.78, 0.06, 0.12, K.std(0xc9a033, { metalness: 1, roughness: 0.3 }), 0, y, 0.04)));
    const rvl = c.sign('REVERSPECTIVE, AFTER HUGHES. WALK PAST IT SLOWLY.', { w: 3.4, h: 0.14, bg: '#0a0810', fg: '#f5c542', font: c.MONO, weight: 700 }); rvl.position.set(0, -1.42, 0.03); RV.add(rvl);
    c.post(X(17.1), -7.2, 0.6); c.post(X(18.9), -7.2, 0.6);
    // the eye flower toys in a crate by the door, blinking and bobbing, the egg
    const fb = new THREE.Group(); fb.position.set(4.4, 0, 6.6); g.add(fb); c.post(X(4.4), 6.6, 0.55);
    fb.add(c.slab(0.9, 0.4, 0.6, K.std(0x8a6a3a, { roughness: 0.8 }), 0, 0.2, 0));
    const fur = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff, 0x9a6aff, 0xff7a1a].map((h) => K.std(h, { roughness: 1 })), eyeT = c.canvasTex(128, 64, (q, w, h) => { q.fillStyle = '#fff'; [w * 0.28, w * 0.72].forEach((x) => { q.beginPath(); q.arc(x, h / 2, h * 0.42, 0, 7); q.fill(); }); q.fillStyle = '#1d4ed8'; [w * 0.28, w * 0.72].forEach((x) => { q.beginPath(); q.arc(x, h / 2, h * 0.24, 0, 7); q.fill(); }); q.fillStyle = '#000'; [w * 0.28, w * 0.72].forEach((x) => { q.beginPath(); q.arc(x, h / 2, h * 0.11, 0, 7); q.fill(); }); });
    const furbies = []; for (let i = 0; i < 6; i++) { const f = new THREE.Group(); f.position.set(-0.3 + (i % 3) * 0.3, 0.48, -0.13 + ((i / 3) | 0) * 0.26); fb.add(f); const bd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), fur[i]); bd.scale.y = 1.15; f.add(bd); const ey = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ map: eyeT, toneMapped: false })); ey.position.set(0, 0.04, 0.115); f.add(ey); [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), fur[i]); ear.position.set(s * 0.07, 0.15, 0); ear.rotation.z = -s * 0.4; f.add(ear); }); f.userData.ey = ey; furbies.push(f); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; furbies.forEach((f, i) => { f.position.y = 0.48 + Math.abs(Math.sin(t * 3 + i)) * 0.03; f.rotation.y = Math.sin(t + i * 2) * 0.5; f.userData.ey.scale.y = (t * 0.7 + i * 0.37) % 2 < 0.08 ? 0.1 : 1; }); });
    c.clickable(fb, () => { c.sound.beep(1400, 0.06, 0.2, 'square'); setTimeout(() => c.sound.beep(1800, 0.06, 0.2, 'square'), 90); c.egg('gems_toys', 'A crate of talking toys with eye flowers for eyes, every one of them a little bit wired wrong. On 47th Street even the toys are a hustle. MLow bought them all and named them after the opal.'); }, 'The talking toys');
    // a mirrored ceiling of brass tiles, pin spots over every case, and the glints on the gold
    ceiling(c, g, tin('#3a2a14', '#d6a640'), [12, 10], { metal: 0.9, rough: 0.22 });
    const spots = [[6, 3], [14, 3], [6, -1], [14, -1], [10, 1], [10, -3.6]];
    field(c, g, new THREE.CircleGeometry(0.07, 12).rotateX(PI / 2), hot(c, 0xffffff, 2.4), spots.map(([x, z]) => [x, 5.94, z]));
    spots.forEach(([x, z]) => shaft(c, g, x, 5.9, z, 0.03, 0.3, 4.9, 0xfff4e0, 0.025));
    const NG = c.MOBILE ? 40 : 80, gp = new Float32Array(NG * 3), gph = new Float32Array(NG); for (let k = 0; k < NG; k++) { const [x, z] = spots[k % 4]; gp[k * 3] = x - 1.6 + Math.random() * 3.2; gp[k * 3 + 1] = 0.95 + Math.random() * 0.05; gp[k * 3 + 2] = z - 0.4 + Math.random() * 0.8; gph[k] = Math.random() * 6.3; }
    const ggeo = new THREE.BufferGeometry(); ggeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glints = new THREE.Points(ggeo, new THREE.PointsMaterial({ map: K.glowTex('rgba(255,255,255,1)'), size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(2, 1.9, 1.6) })); g.add(glints);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; glints.material.opacity = 0.6 + Math.sin(t * 9) * 0.4; glints.rotation.y = 0; });
    // gems on velvet trays in the side cases
    const velvet = K.std(0x1a0a2a, { roughness: 1 }); [[6, 3], [14, 3]].forEach(([x, z]) => g.add(c.slab(2.6, 0.02, 0.6, velvet, x, 0.92, z)));
    field(c, g, new THREE.OctahedronGeometry(0.035), new THREE.MeshStandardMaterial({ roughness: 0.05, metalness: 0.3, emissive: 0x222222 }), Array.from({ length: 40 }, (_, k) => [(k < 20 ? 6 : 14) - 1.2 + (k % 10) * 0.26, 0.97, 3 - 0.15 + ((k / 10 | 0) % 2) * 0.3, k, 1, [0xff2a6a, 0x22d3ee, 0x2aff8a, 0xf5c542, 0xffffff, 0x9a6aff][k % 6]]));
    // the gold price ticker over the door, and a neon in the window
    const tk = c.canvasTex(1024, 64, (q, w, h) => { q.fillStyle = '#100404'; q.fillRect(0, 0, w, h); q.fillStyle = '#ff3a2a'; q.font = `700 ${h * 0.7}px ${c.MONO}`; q.textBaseline = 'middle'; q.fillText('GOLD 1,111.00   OPAL PRICELESS   DIAMONDS COUNTED   47TH ST   ', 8, h / 2); q.fillStyle = 'rgba(0,0,0,.5)'; for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 1.5, h); for (let y = 0; y < h; y += 4) q.fillRect(0, y, w, 1.5); });
    tk.wrapS = THREE.RepeatWrapping; const tkm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.28), new THREE.MeshBasicMaterial({ map: tk, toneMapped: false })); tkm.material.color.setScalar(2.0); tkm.position.set(10, 4.75, -7.85); g.add(tkm);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tk.offset.x = t * 0.06; });
    const ne = c.sign('WE BUY GOLD\nWE SELL COUNTS', { w: 1.8, h: 0.7, bg: null, fg: '#22d3ee', font: c.FONT, weight: 800, glow: 22 }); ne.material.color.setScalar(2.0); ne.position.set(0.16, 4.1, -3.2); ne.rotation.y = PI / 2; g.add(ne);
    // a gold compass inlaid in the marble at the middle of the floor
    panel(c, g, 2.4, 2.4, (q, w, h) => { q.strokeStyle = '#d6a640'; q.lineWidth = 8; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.stroke(); q.lineWidth = 3; q.beginPath(); q.arc(w / 2, h / 2, w * 0.4, 0, 7); q.stroke(); q.fillStyle = '#d6a640';
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, L = i % 2 ? 0.25 : 0.4; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * w * L, h / 2 + Math.sin(a) * h * L); q.lineTo(w / 2 + Math.cos(a + 0.2) * w * 0.07, h / 2 + Math.sin(a + 0.2) * h * 0.07); q.lineTo(w / 2 + Math.cos(a - 0.2) * w * 0.07, h / 2 + Math.sin(a - 0.2) * h * 0.07); q.fill(); } }, 512, 10, 0.014, 4.4, { alpha: true, floor: true, metal: 0.9, rough: 0.25 });
    motes(c, r, g, 100, 2, 18, 0.5, 5.6, -6, 7, 0xfff0d8, 0.025, 0.5);
  },

  // ---------------- SMOKE: the corner, eight a.m. ----------------
  smoke(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.1, vig: 0.5 };
    // ILLUSION: a picture that is two pictures. Auggie's 4,000 mornings are pinned to the north wall in a grid; up close
    // every square is the same corner on a different day. Step back to the door and the grid is one big eye flower.
    const NX = 26, NY = 26, TW = 40;
    const target = document.createElement('canvas'); target.width = target.height = NX; const tq = target.getContext('2d'); tq.fillStyle = '#3a2a1a'; tq.fillRect(0, 0, NX, NY); K.eyeFlower(tq, NX / 2, NY / 2, NX * 0.49, '#f8e0c8', '#e8508a'); const td = tq.getImageData(0, 0, NX, NY).data;
    const mosaic = panel(c, g, 3.6, 3.6, (q, w, h) => { const s = w / NX;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = (j * NX + i) * 4, R = td[k], G = td[k + 1], B = td[k + 2], x = i * s, y = j * s;
        q.fillStyle = `rgb(${R},${G},${B})`; q.fillRect(x, y, s, s);
        // the corner: a building edge, the sidewalk, the awning, the sky, all in the tile's own colour family
        const day = (i * 7 + j * 13) % 9; q.fillStyle = `rgba(255,255,255,${0.22 + (day % 3) * 0.08})`; q.fillRect(x, y, s, s * 0.35);
        q.fillStyle = 'rgba(0,0,0,.42)'; q.fillRect(x + s * 0.12, y + s * 0.28, s * 0.42, s * 0.55); q.fillRect(x + s * 0.62, y + s * 0.4, s * 0.3, s * 0.43);
        q.fillStyle = 'rgba(255,255,255,.18)'; for (let wy = 0; wy < 3; wy++) q.fillRect(x + s * 0.18, y + s * (0.34 + wy * 0.15), s * 0.08, s * 0.07);
        q.fillStyle = 'rgba(0,0,0,.2)'; q.fillRect(x, y + s * 0.83, s, s * 0.17); q.fillStyle = 'rgba(255,255,255,.25)'; q.fillRect(x + s * (0.1 + day * 0.08), y + s * 0.7, s * 0.05, s * 0.13);
        q.strokeStyle = 'rgba(250,245,235,.9)'; q.lineWidth = 2; q.strokeRect(x + 1, y + 1, s - 2, s - 2); } }, NX * TW, 18.0, 2.4, -7.86, { basic: true, glow: 0.85 });
    const lab = c.sign('4,000 MORNINGS, 8 A.M., THE SAME CORNER. NOW STAND BACK.', { w: 3.6, h: 0.16, bg: '#1a0e08', fg: '#f5c542', font: c.MONO, weight: 700 }); lab.position.set(18.0, 0.42, -7.84); g.add(lab);
    c.clickable(mosaic, () => { c.sound.tick(); c.egg('smoke_mosaic', 'Up close it is Auggie\'s corner, morning after morning, rain, snow, August. From the door it is one eye looking back. MLow says that is what twenty seven years of the same corner looks like.'); }, 'The wall of mornings');
    // pressed tin overhead, and the eight o'clock sun coming in long and low through the shop window
    ceiling(c, g, tin('#4a3220', '#a07a40'), [12, 10], { metal: 0.6, rough: 0.4 });
    [[5, 0.5], [10, 0.4], [15, 0.6]].forEach(([x, rz]) => { const s = shaft(c, g, x, 4.3, -7.9, 0.6, 2.4, 13, 0xffd8a0, 0.03); s.rotation.x = -PI / 2 + 0.55; s.rotation.z = (x - 10) * -0.02; });
    panel(c, g, 12, 7, (q, w, h) => { for (let i = 0; i < 4; i++) { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); q.fillStyle = gr; q.beginPath(); const x0 = w * (0.05 + i * 0.24); q.moveTo(x0, 0); q.lineTo(x0 + w * 0.18, 0); q.lineTo(x0 + w * 0.26, h); q.lineTo(x0 + w * 0.06, h); q.fill(); } }, 256, 10, 0.016, -3.6, { add: true, floor: true, op: 0.5 });
    motes(c, r, g, 200, 3, 17, 0.3, 4.5, -7, 3, 0xffe0b0, 0.03, 0.75);
    // cigar smoke off the ashtray on the counter, the tip glowing
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), hot(c, 0xff5a1a, 3)); tip.position.set(12.9, 1.04, 1.25); g.add(tip); g.add(c.slab(0.12, 0.012, 0.012, K.std(0x5a3a1a), 12.84, 1.04, 1.25));
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.025, 16), K.std(0x8a8a90, { metalness: 0.9, roughness: 0.3 })); tray.position.set(12.82, 1.01, 1.25); g.add(tray);
    const puffs = []; for (let i = 0; i < (c.MOBILE ? 4 : 8); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex('rgba(220,220,230,.35)'), transparent: true, depthWrite: false })); g.add(s); puffs.push(s); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tip.scale.setScalar(0.8 + Math.sin(t * 2.3) * 0.3); puffs.forEach((s, i) => { const u = (t * 0.12 + i / puffs.length) % 1; s.position.set(12.9 + Math.sin(u * 9 + i) * 0.15 * u, 1.08 + u * 2.4, 1.25 + Math.cos(u * 7 + i) * 0.12 * u); s.scale.setScalar(0.12 + u * 0.9); s.material.opacity = Math.sin(u * PI) * 0.35; }); });
    // neon in the window: OPEN, and the lotto
    const op = c.sign('OPEN', { w: 1.1, h: 0.4, bg: null, fg: '#ff3b5c', font: c.FONT, weight: 800, glow: 22 }); op.material.color.setScalar(2.1); op.position.set(5.0, 3.7, -7.88); g.add(op);
    const lo = c.sign('LOTTO\nCOUNTED DAILY', { w: 1.2, h: 0.6, bg: null, fg: '#22d3ee', font: c.FONT, weight: 800, glow: 22 }); lo.material.color.setScalar(2.0); lo.position.set(15.0, 3.6, -7.88); g.add(lo);
    // penny candy jars on the counter and a rack of the morning papers
    const jar = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16), jm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false });
    [11.5, 11.75, 12.0].forEach((x, i) => { const j = new THREE.Mesh(jar, jm); j.position.set(x, 1.12, 0.95); g.add(j); field(c, g, new THREE.SphereGeometry(0.022, 8, 6), K.std(0xffffff, { roughness: 0.3, emissive: 0x111111 }), Array.from({ length: 14 }, (_, k) => [x - 0.05 + (k % 4) * 0.033, 1.03 + ((k / 4) | 0) * 0.04, 0.95 - 0.03 + (k % 3) * 0.03, 0, 1, [0xff4fa3, 0xf5c542, 0x22d3ee, 0xff7a1a][(k + i) % 4]])); });
    const rack = new THREE.Group(); rack.position.set(16.6, 0, 1.4); rack.rotation.y = -0.6; g.add(rack); c.post(X(16.6), 1.4, 0.55);
    rack.add(c.slab(1.0, 0.04, 0.5, K.std(0x3a2a1a), 0, 0.8, 0)); rack.add(c.slab(1.0, 0.04, 0.5, K.std(0x3a2a1a), 0, 0.4, 0)); [-0.48, 0.48].forEach((x) => rack.add(c.slab(0.04, 0.9, 0.5, K.std(0x2a1a10), x, 0.45, 0)));
    ['N3W DAILY', 'THE COUNT', 'POST N3W', 'BROOKLYN EYE'].forEach((nm, i) => { const p = c.sign(`${nm}\nCOUNTED`, { w: 0.42, h: 0.3, bg: '#f4f0e4', fg: '#111', font: c.SERIF, weight: 900 }); p.position.set(-0.24 + (i % 2) * 0.48, 0.84 + 0.03 - ((i / 2) | 0) * 0.4 + 0.18, 0.1); p.rotation.x = -0.9; rack.add(p); });
    // Auggie's camera flashes at the corner, once in a while
    const fl = halo(c, K, g, 7.0, 1.4, -5.75, 'rgba(255,255,255,1)', 0.1);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = t % 12; fl.scale.setScalar(u < 0.12 ? 3.5 : 0.01); });
  },

  // ---------------- YOU'VE GOT MAIL: the shop around the count ----------------
  mail(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.1, vig: 0.48 };
    // ILLUSION: a portal. A shop door stands on its own in the middle of the floor, and through it is the Upper West Side
    // at night: a street, brownstones, a cab going by. Walk round it and the street keeps its depth. Look behind: books.
    const backT = c.canvasTex(512, 384, (q, w, h) => { const sk = q.createLinearGradient(0, 0, 0, h * 0.4); sk.addColorStop(0, '#1a2050'); sk.addColorStop(1, '#4a3a6a'); q.fillStyle = sk; q.fillRect(0, 0, w, h); q.fillStyle = '#fff6e0'; q.beginPath(); q.arc(w * 0.8, h * 0.07, 12, 0, 7); q.fill(); for (let b = 0; b < 4; b++) { const x = b * w / 4; q.fillStyle = ['#8a5a44', '#7a4a3a', '#9a6a50', '#6a4a3e'][b]; q.fillRect(x + 2, h * 0.12, w / 4 - 4, h * 0.88);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { const lit = (b + i + j) % 3 !== 0; q.fillStyle = lit ? '#ffcf7a' : '#1a1418'; q.fillRect(x + 20 + i * 60, h * (0.2 + j * 0.17), 34, h * 0.1); } q.fillStyle = '#2a1a14'; q.fillRect(x + 40, h * 0.86, 50, h * 0.14); }
      q.fillStyle = '#0a0a0a'; q.fillRect(0, h * 0.96, w, h * 0.04); });
    const sideT = c.canvasTex(512, 256, (q, w, h) => { q.fillStyle = '#7a5040'; q.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { const x = i * w / 10; for (let j = 0; j < 3; j++) { q.fillStyle = (i + j) % 3 ? '#ffcf7a' : '#140e10'; q.fillRect(x + 10, h * (0.2 + j * 0.22), w / 10 - 26, h * 0.12); } q.fillStyle = '#1a1210'; q.fillRect(x, 0, 3, h); }
      q.fillStyle = '#5a2a1a'; q.fillRect(0, h * 0.82, w, h * 0.18); q.fillStyle = '#c84a3a'; for (let i = 0; i < 10; i += 3) q.fillRect(i * w / 10, h * 0.8, w / 10 * 2, h * 0.05); });
    const floorT = c.canvasTex(256, 512, (q, w, h) => { q.fillStyle = '#1a1a20'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a4650'; q.fillRect(0, 0, w * 0.2, h); q.fillRect(w * 0.8, 0, w * 0.2, h); for (let y = 0; y < h; y += 26) { q.fillStyle = '#3a3640'; q.fillRect(0, y, w * 0.2, 2); q.fillRect(w * 0.8, y, w * 0.2, 2); }
      q.fillStyle = '#f5c542'; for (let y = 10; y < h; y += 60) q.fillRect(w / 2 - 3, y, 6, 30); for (let k = 0; k < 40; k++) { q.fillStyle = `rgba(255,${120 + Math.random() * 80 | 0},40,.8)`; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 4, 2, Math.random() * 3, 0, 7); q.fill(); } });
    const PD = new THREE.Group(); PD.position.set(14.6, 0, 0.0); PD.rotation.y = -0.55; g.add(PD); c.wall(X(14.6 - Math.cos(-0.55) * 0.75), 0.0 + Math.sin(-0.55) * 0.75, X(14.6 + Math.cos(-0.55) * 0.75), 0.0 - Math.sin(-0.55) * 0.75);
    const win = portal(c, r, PD, 1.2, 2.2, 16, { back: backT, side: sideT, floor: floorT }, { bw: 7, bh: 11 }); win.position.z = 0.0;
    const wood = K.std(0x2a4a3a, { roughness: 0.4 }), brass = K.std(0xd6a640, { metalness: 1, roughness: 0.3 });
    PD.add(c.slab(0.14, 2.4, 0.22, wood, -0.67, 1.2, 0)); PD.add(c.slab(0.14, 2.4, 0.22, wood, 0.67, 1.2, 0)); PD.add(c.slab(1.48, 0.18, 0.22, wood, 0, 2.31, 0)); PD.add(c.slab(1.48, 0.04, 0.3, brass, 0, 0.02, 0));
    const back = panel(c, PD, 1.2, 2.2, (q, w, h) => { q.fillStyle = '#5a3a20'; q.fillRect(0, 0, w, h); for (let s = 0; s < 6; s++) { q.fillStyle = '#3a2410'; q.fillRect(0, s * h / 6, w, 6); for (let b = 0; b < 12; b++) { q.fillStyle = `hsl(${(b * 47 + s * 31) % 360},55%,48%)`; q.fillRect(6 + b * (w - 12) / 12, s * h / 6 + 10, (w - 12) / 12 - 2, h / 6 - 14); } } }, 256, 0, 1.1, -0.02, {}); back.rotation.y = PI;
    const tr = c.sign('THE UPPER WEST SIDE\nTHIS WAY', { w: 1.2, h: 0.26, bg: '#2a4a3a', fg: '#f4ead2', font: c.SERIF, weight: 800 }); tr.position.set(0, 2.54, 0.02); PD.add(tr);
    halo(c, K, PD, 0.62, 2.0, 0.2, 'rgba(255,220,150,.6)', 0.5);
    c.clickable(win, () => { c.sound.modem(); c.egg('mail_portal', 'A door with no wall, and behind it West 82nd Street in the fall, with a cab going by. Walk round it: books. Walk back: the street. MLow keeps it open for whoever is still typing.'); }, 'The door to the street');
    // autumn leaves blown in from the street, across the floorboards in front of the door
    field(c, g, new THREE.PlaneGeometry(0.09, 0.06).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), Array.from({ length: c.MOBILE ? 50 : 110 }, (_, i) => { const a = Math.random() * PI - 0.6, d = Math.random() * Math.random() * 3.2; return [14.6 + Math.sin(-0.55) * 0.3 + Math.cos(a) * d * 0.8 - 0.4, 0.008 + i * 0.00005, 0.3 + Math.abs(Math.sin(a)) * d, Math.random() * 6.3, 1, [0xd8501a, 0xe8a020, 0x9a2a10, 0xc87a1a][i % 4]]; }));
    // books flying overhead on their threads, turning slowly
    const NBK = c.MOBILE ? 10 : 18, fly = []; const cols = [0xc84a3a, 0x2a6a9a, 0xf5c542, 0x4a8a4a, 0xff4fa3, 0x7a4aa8];
    for (let i = 0; i < NBK; i++) { const b = new THREE.Group(); b.position.set(2 + Math.random() * 16, 3.6 + Math.random() * 1.6, -5 + Math.random() * 11); g.add(b); const m = cols[i % 6];
      [-1, 1].forEach((s) => { const cv = c.slab(0.2, 0.012, 0.28, K.std(m, { roughness: 0.6 }), s * 0.09, 0, 0); cv.rotation.z = s * 0.45; b.add(cv); const pg = c.slab(0.17, 0.02, 0.26, K.std(0xf4ead2, { roughness: 0.9 }), s * 0.08, 0.02, 0); pg.rotation.z = s * 0.4; b.add(pg); });
      b.add(c.slab(0.003, 6 - b.position.y, 0.003, K.std(0xdddddd), 0, (6 - b.position.y) / 2, 0)); fly.push(b); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fly.forEach((b, i) => { b.rotation.y = t * 0.3 + i; b.children[0].rotation.z = 0.45 + Math.sin(t * 2 + i) * 0.15; b.children[2].rotation.z = -0.45 - Math.sin(t * 2 + i) * 0.15; }); });
    // a beamed ceiling, fairy lights along the tops of the wall shelves
    ceiling(c, g, (q, w, h) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, w, h); noise(q, w, h, 2000, 0.12, ['#8a7a5a', '#fff'], 2); q.fillStyle = '#5a3a1e'; q.fillRect(0, h * 0.4, w, h * 0.2); q.fillStyle = 'rgba(0,0,0,.25)'; q.fillRect(0, h * 0.6, w, 6); }, [1, 8], { metal: 0, rough: 0.9 });
    garland(c, r, g, 0.4, 19.6, 4.6, 7.7, 0.25, 46, 0xffd890, 2.4); garland(c, r, g, 0.4, 7.6, 4.4, -7.7, 0.2, 18, 0xffd890, 2.4); garland(c, r, g, 12.4, 19.6, 4.4, -7.7, 0.2, 18, 0xffd890, 2.4);
    // the story hour rug gets its pattern: an eye flower in a ring of stars
    let rug = null; g.traverse((o) => { if (o.isMesh && o.geometry?.type === 'CircleGeometry' && Math.abs(o.geometry.parameters.radius - 1.6) < 0.01) rug = o; });
    if (rug) { rug.material = new THREE.MeshStandardMaterial({ roughness: 1, map: c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#c84a3a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 14; q.beginPath(); q.arc(w / 2, h / 2, w * 0.45, 0, 7); q.stroke(); q.lineWidth = 6; q.beginPath(); q.arc(w / 2, h / 2, w * 0.38, 0, 7); q.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; q.fillStyle = '#f4ead2'; q.font = `900 ${w * 0.06}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('*', w / 2 + Math.cos(a) * w * 0.415, h / 2 + Math.sin(a) * h * 0.415); }
      K.eyeFlower(q, w / 2, h / 2, w * 0.3, '#fbe6f0', '#2a6a9a'); noise(q, w, h, 9000, 0.12, ['#000', '#fff'], 2); }) }); }
    // hot cocoa steaming on the round table; pumpkins by the coffee cart; reading lamps glowing on the shelf ends
    const mug = new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14); [[10.7, -0.8], [11.3, -1.2]].forEach(([x, z], i) => { const m = new THREE.Mesh(mug, K.std(i ? 0xf5c542 : 0x2a6a9a, { roughness: 0.4 })); m.position.set(x, 0.8, z); g.add(m); }); K.steam(g, 11.0, 0.86, -1.0);
    [[17.8, 2.2, 0.28], [18.2, 2.7, 0.2], [17.5, 2.75, 0.16]].forEach(([x, z, s]) => { const p = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 10), K.std(0xe8701a, { roughness: 0.6 })); p.scale.y = 0.75; p.position.set(x, s * 0.75, z); g.add(p); g.add(c.slab(0.03, s * 0.5, 0.03, K.std(0x3a5a1a), x, s * 1.6, z)); });
    c.post(X(17.9), 2.5, 0.5);
    [[7.6, -2.0], [12.4, -2.0]].forEach(([x, z]) => halo(c, K, g, x, 2.1, z, 'rgba(255,214,150,.55)', 1.3));
    motes(c, r, g, 120, 1, 19, 0.3, 5, -6, 7, 0xffe0b0, 0.025, 0.5);
  },
});

export const SWAP = {};
