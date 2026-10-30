// Skate spots for every set: kickers and gaps, quarter pipes and a mini halfpipe, a pyramid, rollers, a manual pad,
// flat, down and rainbow rails, ledges, and three goals. Coney Island is laid out by hand (SPOTS). Every other set is
// laid out once its props have loaded: the floor is sampled on a 0.4 m grid, anything a prop, a wall or a collider
// stands on is blocked, the side doors, the spawn point and the edges are kept clear, and one of four kits is fitted
// into the free floor that is left, biggest piece first. The features are plain data for skate.mjs (surface, solid,
// rails, gaps) plus the meshes, added to the set's own group so they come and go with it.
const DZ1 = 2, DZ2 = 5.6;   // the side doors, as build.js has them
const CELL = 0.4;
// a quarter pipe: a circle of radius R cut at 75 degrees, then a deck
const QR = 1.6, QTOP = 1.2, QA = Math.sqrt(QR * QR - (QR - QTOP) ** 2), QDECK = 1.4;
const PYR = { size: 4.4, top: 1.2, rise: 0.7 }, ROLL = { n: 3, len: 1.2, gap: 0.8, rise: 0.28 };

export const SPOTS = {
  coney: {
    // fitted to the free boardwalk (the grid from PARK.dump): one run down the arcade side, a rail up the right, a ledge by the rope
    features: [
      { type: 'kicker', x: 5.4, z: 3.0, yaw: 0, len: 1.6, w: 1.2, rise: 0.55 },
      { type: 'kicker', x: 5.4, z: -2.8, yaw: Math.PI, len: 2.0, w: 1.2, rise: 0.55 },
      { type: 'rail', x1: 17.0, z1: 5.2, x2: 17.0, z2: -1.0, y: 0.48, name: 'BOARDWALK RAIL' },
      { type: 'rail', x1: 6.8, z1: -0.3, x2: 9.4, z2: -0.3, y1: 0.4, y2: 0.4, arch: 0.4, name: 'TURNSTILE RAINBOW' },
      { type: 'box', x: 14.6, z: -2.2, yaw: -Math.PI / 2, len: 3.0, w: 1.0, h: 0.36 },
      { type: 'roller', x: 12.4, z: 1.2, yaw: Math.PI / 2, w: 1.4 },
    ],
    gap: { from: [5.4, 1.6, 1.0], to: [5.4, -2.4, 1.6], name: 'THE WARRIORS GAP', bonus: 800 },
    goals: [
      { k: 'gap', text: 'Warriors, come out to play: clear the gap over the tracks' },
      { k: 'grind', t: 2, text: 'Grind the boardwalk rail for two seconds' },
      { k: 'combo', n: 2500, text: 'Land a 2,500 combo before the Riffs show up' },
    ],
  },
  // sets that were too full for the fit; kept as fallbacks (the fit gets first go)
  dogday: { features: [{ type: 'rail', x1: 8.4, z1: -4.9, x2: 12.6, z2: -4.9, y: 0.4, name: 'BARRICADE RAIL' }] },
  producers: { features: [{ type: 'rail', x1: 4.2, z1: 3.7, x2: 11.8, z2: 3.7, y: 0.4, name: 'CHORUS LINE RAIL' },
    { type: 'kicker', x: 14.0, z: 4.4, yaw: -Math.PI / 2, len: 1.2, w: 1.0, rise: 0.4 }] },
  diehard: { features: [{ type: 'rail', x1: 2.6, z1: 0.9, x2: 7.8, z2: 0.9, y: 0.4, name: 'FOUNTAIN RAIL' }] },
  stuart: { features: [{ type: 'rail', x1: 5.0, z1: 3.7, x2: 11.8, z2: 3.7, y: 0.4, name: 'POND RAIL' }] },
  statuewalk: { features: [{ type: 'rail', x1: 3.0, z1: 5.4, x2: 3.0, z2: 2.2, y: 0.4, name: 'PEDESTAL RAIL' },
    { type: 'rail', x1: 17.8, z1: 4.6, x2: 17.8, z2: 2.2, y: 0.4, name: 'TORCH RAIL' }] },
};

// ---- the shapes, in a feature's own frame: a along the travel direction, b across ----
function featureH(f, a, b) {
  switch (f.type) {
    case 'kicker': return a >= 0 && a <= f.len && Math.abs(b) <= f.w / 2 ? f.rise * a / f.len : 0;
    case 'quarter': if (Math.abs(b) > f.w / 2 || a < 0) return 0; if (a <= QA) return QR - Math.sqrt(QR * QR - a * a); return a <= QA + QDECK ? QTOP : 0;
    case 'pyramid': { const d = Math.max(Math.abs(a), Math.abs(b)), h = PYR.size / 2, t = PYR.top / 2; if (d > h) return 0; return d <= t ? PYR.rise : PYR.rise * (1 - (d - t) / (h - t)); }
    case 'roller': { if (Math.abs(b) > f.w / 2) return 0; for (let k = 0; k < ROLL.n; k++) { const t = (a - k * (ROLL.len + ROLL.gap)) / ROLL.len; if (t >= 0 && t <= 1) return ROLL.rise * Math.sin(Math.PI * t); } return 0; }
    case 'manual': return Math.abs(a) <= f.len / 2 && Math.abs(b) <= f.w / 2 ? f.h : 0;
    default: return 0;
  }
}
const SOLID = { box: 1 };

export function makePark({ THREE, canvasTex, colliders, W, D }) {
  const PARK = {};   // by room id: { features, surface, solid, rails, gaps, goals, group }
  const mats = {};
  const mat = (k, f) => mats[k] || (mats[k] = f());
  // plywood in the set's own colour, with the house stripes
  const ply = (hue) => mat('ply' + hue.toFixed(2), () => { const base = new THREE.Color().setHSL(hue, 0.6, 0.36), hex = '#' + base.getHexString();
    const t = canvasTex(256, 256, (q, w, h) => {
      q.fillStyle = hex; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { q.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`; q.beginPath(); const y = Math.random() * h; q.moveTo(0, y); q.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 2); q.stroke(); }
      for (let i = 0; i < 12; i++) { q.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.1})`; q.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1 + Math.random() * 3); }
      q.fillStyle = '#f5c542'; q.fillRect(0, 0, w, 10); q.fillStyle = '#ff4fa3'; q.fillRect(0, h - 6, w, 6);
      q.font = '900 46px "Space Grotesk", Arial'; q.fillStyle = 'rgba(244,234,210,.22)'; q.textAlign = 'center'; q.fillText('N3W', w / 2, h / 2 + 16); });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }); });
  const side = () => mat('side', () => new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.9 }));
  const steel = () => mat('steel', () => new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.85, roughness: 0.28, emissive: 0x3a2a00, emissiveIntensity: 0.4 }));
  const pink = () => mat('pink', () => new THREE.MeshStandardMaterial({ color: 0xff4fa3, metalness: 0.4, roughness: 0.35, emissive: 0x501030, emissiveIntensity: 0.5 }));
  const conc = () => mat('conc', () => { const t = canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#8c8a86'; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { q.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},${Math.random() * 0.08})`; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      q.strokeStyle = 'rgba(0,0,0,.25)'; q.lineWidth = 1.5; for (let i = 0; i < 5; i++) { q.beginPath(); let x = Math.random() * w, y = Math.random() * h; q.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; q.lineTo(x, y); } q.stroke(); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); });
  const stencil = (text) => mat('st' + text, () => new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, (q, w, h) => { q.fillStyle = '#0b0c10'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; for (let i = -2; i < 14; i++) { q.beginPath(); q.moveTo(i * 44, 0); q.lineTo(i * 44 + 22, 0); q.lineTo(i * 44 + 52, h); q.lineTo(i * 44 + 30, h); q.fill(); }
      q.fillStyle = '#0b0c10'; q.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.56); q.fillStyle = '#f4ead2'; q.font = '800 44px "Space Grotesk", Arial'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, w / 2, h / 2 + 2); }),
    roughness: 0.8, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));

  // ---- surfaces (world coordinates) ----
  const local = (f, x, z) => { const dx = x - f.wx, dz = z - f.wz, c = Math.cos(f.yaw), s = Math.sin(f.yaw); return [-(dx * s + dz * c), dx * c - dz * s]; };   // [along travel, across]
  const surfaceOf = (fs) => (x, z) => { let h = 0; for (const f of fs) if (!SOLID[f.type] && f.type !== 'rail') { const [a, b] = local(f, x, z); h = Math.max(h, featureH(f, a, b)); } return h; };
  const solidOf = (fs) => (x, z) => { let h = 0; for (const f of fs) if (SOLID[f.type]) { const [a, b] = local(f, x, z); if (Math.abs(a) <= f.len / 2 && Math.abs(b) <= f.w / 2) h = Math.max(h, f.h); } return h; };

  // ---- meshes (set coordinates, in the set's group) ----
  // a feature's own frame as a group: +x is along the travel direction a, +z is across b
  const frame = (f, g) => { const o = new THREE.Group(); o.position.set(f.x, 0.002, f.z); o.rotation.y = f.yaw + Math.PI / 2; g.add(o); return o; };
  function meshKicker(f, g, hue) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(f.len, 0); sh.lineTo(f.len, f.rise); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: f.w, bevelEnabled: false }); geo.translate(0, 0, -f.w / 2);
    const o = frame(f, g), m = new THREE.Mesh(geo, [side(), ply(hue)]); o.add(m);
    const cop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, f.w, 12), steel()); cop.rotation.x = Math.PI / 2; cop.position.set(f.len, f.rise, 0); o.add(cop);
  }
  function meshQuarter(f, g, hue) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let i = 1; i <= 16; i++) { const a = QA * i / 16; sh.lineTo(a, QR - Math.sqrt(QR * QR - a * a)); }
    sh.lineTo(QA + QDECK, QTOP); sh.lineTo(QA + QDECK, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: f.w, bevelEnabled: false }); geo.translate(0, 0, -f.w / 2);
    const o = frame(f, g), m = new THREE.Mesh(geo, [side(), ply(hue)]); o.add(m);
    const cop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, f.w + 0.1, 12), steel()); cop.rotation.x = Math.PI / 2; cop.position.set(QA, QTOP + 0.01, 0); o.add(cop);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(QDECK - 0.3, Math.min(1.1, f.w - 0.3)).rotateX(-Math.PI / 2), stencil('N3W')); d.position.set(QA + QDECK / 2, QTOP + 0.012, 0); o.add(d);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, f.w + 0.1, 8), steel()); rail.rotation.x = Math.PI / 2; rail.position.set(QA + QDECK - 0.05, QTOP + 0.9, 0); o.add(rail);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), steel()); p.position.set(QA + QDECK - 0.05, QTOP + 0.45, s * f.w / 2); o.add(p); }
  }
  // a height field for the shapes that are nothing but a surface: the pyramid, the rollers (the field starts at a = 0 for rollers, centred for the pyramid)
  function meshField(f, g, w, l, segs, material, a0) {
    const geo = new THREE.PlaneGeometry(l, w, segs, Math.max(2, Math.round(segs * w / l))).rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const a = p.getX(i) + a0, b = p.getZ(i); p.setY(i, featureH(f, a, b) + 0.004); uv.setXY(i, a / 1.2, b / 1.2); }
    geo.computeVertexNormals();
    const o = frame(f, g), m = new THREE.Mesh(geo, material); m.position.x = a0; o.add(m); return o;
  }
  function meshPyramid(f, g) {
    const o = meshField(f, g, PYR.size + 0.02, PYR.size + 0.02, 24, conc(), 0);
    for (const [a, b, ry] of [[PYR.top / 2, 0, 0], [-PYR.top / 2, 0, 0], [0, PYR.top / 2, Math.PI / 2], [0, -PYR.top / 2, Math.PI / 2]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, PYR.top), steel()); e.position.set(a, PYR.rise + 0.02, b); e.rotation.y = ry; o.add(e); }
  }
  function meshRoller(f, g) { const l = ROLL.n * ROLL.len + (ROLL.n - 1) * ROLL.gap; meshField(f, g, f.w, l, 36, conc(), l / 2); }
  function meshManual(f, g) { const o = frame(f, g), b = new THREE.Mesh(new THREE.BoxGeometry(f.len, f.h, f.w), [side(), side(), conc(), side(), side(), side()]); b.position.y = f.h / 2; o.add(b);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(f.len - 0.6, 0.5).rotateX(-Math.PI / 2), stencil('MANUAL')); d.position.y = f.h + 0.01; o.add(d); }
  function meshBox(f, g) {
    const o = frame(f, g), b = new THREE.Mesh(new THREE.BoxGeometry(f.len, f.h, f.w), [side(), side(), conc(), side(), side(), side()]); b.position.y = f.h / 2; o.add(b);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(f.len, 0.05, 0.05), steel()); e.position.set(0, f.h, s * f.w / 2); o.add(e); }
  }
  function meshRail(f, g) {
    const dx = f.x2 - f.x1, dz = f.z2 - f.z1, L = Math.hypot(dx, dz), o = new THREE.Group(); o.position.set(f.x1, 0, f.z1); o.rotation.y = Math.atan2(dx, dz); g.add(o);
    const y = (u) => { const a = f.y1 ?? f.y ?? 0, b = f.y2 ?? a; return a + (b - a) * u + (f.arch || 0) * Math.sin(Math.PI * u); };
    const pts = []; for (let i = 0; i <= 24; i++) pts.push(new THREE.Vector3(0, y(i / 24), L * i / 24));
    const bar = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 10, false), pink()); o.add(bar);
    const n = Math.max(2, Math.round(L / 1.6) + 1);
    for (let i = 0; i < n; i++) { const u = (0.2 + (L - 0.4) * i / (n - 1)) / L, h = y(u), p = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, h, 8), steel()); p.position.set(0, h / 2, u * L); o.add(p);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.18), steel()); foot.position.set(0, 0.01, u * L); o.add(foot); }
  }
  function meshGap(gp, g) {
    const [x1, z1] = gp.from, [x2, z2] = gp.to, L = Math.hypot(x2 - x1, z2 - z1);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1, L * 0.6), 1.2).rotateX(-Math.PI / 2), stencil(gp.name || 'GAP'));
    d.position.set((x1 + x2) / 2, 0.015, (z1 + z2) / 2); d.rotation.y = Math.atan2(-(z2 - z1), x2 - x1); g.add(d);
  }

  // ---- automatic layout ----
  const NX = Math.round(W / CELL), NZ = Math.round(D / CELL);
  function grid(r) {
    const occ = new Uint8Array(NX * NZ), mark = (x, z, rad) => {
      for (let i = Math.max(0, Math.floor((x - rad) / CELL)); i <= Math.min(NX - 1, Math.floor((x + rad) / CELL)); i++)
        for (let j = Math.max(0, Math.floor((z + D / 2 - rad) / CELL)); j <= Math.min(NZ - 1, Math.floor((z + D / 2 + rad) / CELL)); j++) occ[j * NX + i] = 1; };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const x = (i + 0.5) * CELL, z = (j + 0.5) * CELL - D / 2;
      if (x < 0.8 || x > W - 0.8 || z < -D / 2 + 1.2 || z > D / 2 - 0.8) occ[j * NX + i] = 1;
      if ((x < 2.4 || x > W - 2.4) && z > DZ1 - 0.4 && z < DZ2 + 0.4) occ[j * NX + i] = 1;     // the doors to the next sets
      if (Math.hypot(x - W / 2, z - (D / 2 - 2.2)) < 1.6) occ[j * NX + i] = 1; }                   // where you arrive
    for (const c of colliders) {
      if (c.r !== undefined) { if (c.x >= r.x0 - 1 && c.x <= r.x0 + W + 1) mark(c.x - r.x0, c.z, c.r + 0.35); continue; }
      const L = Math.hypot(c.x2 - c.x1, c.z2 - c.z1), n = Math.max(1, Math.ceil(L / 0.3));
      for (let k = 0; k <= n; k++) { const x = c.x1 + (c.x2 - c.x1) * k / n - r.x0, z = c.z1 + (c.z2 - c.z1) * k / n; if (x > -1 && x < W + 1) mark(x, z, 0.55); }
    }
    const box = new THREE.Box3();
    r.group.updateMatrixWorld(true);
    r.group.traverse((m) => {
      if (!(m.isMesh || m.isInstancedMesh) || !m.geometry || m.userData.park) return;
      if (m.isInstancedMesh) { m.computeBoundingBox(); box.copy(m.boundingBox).applyMatrix4(m.matrixWorld); }
      else { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); box.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); }
      if (!isFinite(box.min.x) || box.max.y < 0.12 || box.min.y > 1.45) return;                   // floors, decals, and anything you ride under: string lights, awnings, signs, bunting
      const w = box.max.x - box.min.x, d = box.max.z - box.min.z; if (w * d > W * D * 0.5) return;   // the shell of the set itself
      for (let x = box.min.x - r.x0 - 0.15; x <= box.max.x - r.x0 + 0.15; x += CELL / 2) for (let z = box.min.z - 0.15; z <= box.max.z + 0.15; z += CELL / 2) mark(x, z, 0);
    });
    return occ;
  }
  const free = (occ, x, z) => { const i = Math.floor(x / CELL), j = Math.floor((z + D / 2) / CELL); return i >= 0 && i < NX && j >= 0 && j < NZ && !occ[j * NX + i]; };
  // a strip along travel direction yaw from (x, z): a metres ahead (negative is behind), b metres to each side
  function strip(occ, x, z, yaw, a0, a1, b) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
    for (let a = a0; a <= a1 + 1e-6; a += 0.3) for (let s = -b; s <= b + 1e-6; s += 0.3) if (!free(occ, x + fx * a + sx * s, z + fz * a + sz * s)) return false;
    return true;
  }
  function claim(occ, x, z, yaw, a0, a1, b) { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
    for (let a = a0; a <= a1; a += 0.2) for (let s = -b; s <= b; s += 0.2) { const i = Math.floor((x + fx * a + sx * s) / CELL), j = Math.floor((z + fz * a + sz * s + D / 2) / CELL); if (i >= 0 && i < NX && j >= 0 && j < NZ) occ[j * NX + i] = 1; } }
  const YAWS = [0, Math.PI, Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];
  // try every spot and direction, keep the one nearest the middle of the set (the run, a0 to a1, must be free)
  function fit(occ, a0, a1, b, seed) {
    let best = null, bs = 1e9;
    for (const yaw of YAWS) for (let x = 1; x < W - 1; x += 0.5) for (let z = -D / 2 + 1.5; z < D / 2 - 1; z += 0.5) {
      if (!strip(occ, x, z, yaw, a0, a1, b)) continue;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), mx = x + fx * (a0 + a1) / 2, mz = z + fz * (a0 + a1) / 2;
      const sc = Math.hypot(mx - W / 2, (mz - 0.5) * 1.3) + (((x * 7 + z * 13 + yaw * 5 + seed) * 9301 + 49297) % 233280) / 233280 * 0.6;
      if (sc < bs) { bs = sc; best = { x, z, yaw }; }
    }
    return best;
  }
  // the pieces a kit is made of: each is a footprint (run up, length, half width) and what it puts down when it fits
  const ahead = (p, a) => [p.x - Math.sin(p.yaw) * a, p.z - Math.cos(p.yaw) * a];
  const PIECES = {
    gapline: { a0: -2.6, a1: 5.8, b: 0.8, put(p, out) { const [x2, z2] = ahead(p, 5.8), [g1x, g1z] = ahead(p, 1.4), [g2x, g2z] = ahead(p, 4.4);
      out.fs.push({ type: 'kicker', x: p.x, z: p.z, yaw: p.yaw, len: 1.6, w: 1.5, rise: 0.55 }, { type: 'kicker', x: x2, z: z2, yaw: p.yaw + Math.PI, len: 2.0, w: 1.5, rise: 0.55 });
      out.gap = { from: [g1x, g1z, 0.9], to: [g2x, g2z, 1.3], name: 'THE GAP', bonus: 500 }; }, claim: [-3, 6.4, 1.2] },
    gapshort: { a0: -1.6, a1: 4.2, b: 0.7, put(p, out) { const [x2, z2] = ahead(p, 4.2), [g1x, g1z] = ahead(p, 1.0), [g2x, g2z] = ahead(p, 3.4);
      out.fs.push({ type: 'kicker', x: p.x, z: p.z, yaw: p.yaw, len: 1.2, w: 1.3, rise: 0.45 }, { type: 'kicker', x: x2, z: z2, yaw: p.yaw + Math.PI, len: 1.4, w: 1.3, rise: 0.45 });
      out.gap = { from: [g1x, g1z, 0.9], to: [g2x, g2z, 1.3], name: 'THE GAP', bonus: 400 }; }, claim: [-2, 4.8, 1.2] },
    halfpipe: { a0: -8.2, a1: 3.6, b: 1.3, put(p, out) { const [x2, z2] = ahead(p, -4.6);
      out.fs.push({ type: 'quarter', x: p.x, z: p.z, yaw: p.yaw, w: 2.4 }, { type: 'quarter', x: x2, z: z2, yaw: p.yaw + Math.PI, w: 2.4 }); }, claim: [-8.4, 3.8, 1.5] },
    quarter: { a0: -3.0, a1: 3.4, b: 1.3, put(p, out) { out.fs.push({ type: 'quarter', x: p.x, z: p.z, yaw: p.yaw, w: 2.4 }); }, claim: [-3.2, 3.6, 1.5] },
    pyramid: { a0: -2.4, a1: 6.6, b: 2.3, put(p, out) { const [cx, cz] = ahead(p, 2.2), [g1x, g1z] = ahead(p, 1.6), [g2x, g2z] = ahead(p, 3.8);
      out.fs.push({ type: 'pyramid', x: cx, z: cz, yaw: p.yaw }); if (!out.gap) out.gap = { from: [g1x, g1z, 0.9], to: [g2x, g2z, 1.5], name: 'THE PYRAMID', bonus: 450 }; }, claim: [-2.6, 6.8, 2.5] },
    rollers: { a0: -1.6, a1: 6.0, b: 0.9, put(p, out) { out.fs.push({ type: 'roller', x: p.x, z: p.z, yaw: p.yaw, w: 1.6 }); }, claim: [-1.8, 6.2, 1.1] },
    downrail: { a0: -2.4, a1: 4.8, b: 0.5, put(p, out) { const [x2, z2] = ahead(p, 4); out.fs.push({ type: 'rail', x1: p.x, z1: p.z, x2, z2, y1: 0.8, y2: 0.32, name: 'DOWN RAIL' }); }, claim: [-2.6, 5, 1] },
    rainbow: { a0: -2.4, a1: 4.8, b: 0.5, put(p, out) { const [x2, z2] = ahead(p, 4); out.fs.push({ type: 'rail', x1: p.x, z1: p.z, x2, z2, y1: 0.42, y2: 0.42, arch: 0.45, name: 'RAINBOW RAIL' }); }, claim: [-2.6, 5, 1] },
    rail6: { a0: -2.4, a1: 7, b: 0.5, put(p, out) { const [x2, z2] = ahead(p, 6); out.fs.push({ type: 'rail', x1: p.x, z1: p.z, x2, z2, y: 0.45 }); }, claim: [-2.6, 7.2, 1.1] },
    rail4: { a0: -2.4, a1: 5, b: 0.5, put(p, out) { const [x2, z2] = ahead(p, 4); out.fs.push({ type: 'rail', x1: p.x, z1: p.z, x2, z2, y: 0.45 }); }, claim: [-2.6, 5.2, 1.1] },
    rail3: { a0: -1.6, a1: 3.4, b: 0.5, put(p, out) { const [x2, z2] = ahead(p, 2.6); out.fs.push({ type: 'rail', x1: p.x, z1: p.z, x2, z2, y: 0.42 }); }, claim: [-1.8, 3.6, 1] },
    ledge: { a0: -2.2, a1: 3.4, b: 0.75, put(p, out) { const [cx, cz] = ahead(p, 1.4); out.fs.push({ type: 'box', x: cx, z: cz, yaw: p.yaw, len: 2.4, w: 1.3, h: 0.36 }); }, claim: [-2.4, 3.6, 1] },
    manual: { a0: -1.6, a1: 3.6, b: 0.8, put(p, out) { const [cx, cz] = ahead(p, 1.5); out.fs.push({ type: 'manual', x: cx, z: cz, yaw: p.yaw, len: 3, w: 1.4, h: 0.18 }); }, claim: [-1.8, 3.8, 1] },
    kicker: { a0: -1.8, a1: 2.0, b: 0.6, put(p, out) { out.fs.push({ type: 'kicker', x: p.x, z: p.z, yaw: p.yaw, len: 1.2, w: 1.1, rise: 0.4 }); }, claim: [-2, 2.2, 0.8] },
  };
  // four kits, each a list of pieces with their fallbacks; a set takes the kit its number points at
  const KITS = [
    [['gapline', 'gapshort'], ['rail6', 'rail4', 'rail3'], ['ledge']],
    [['quarter'], ['pyramid', 'gapshort'], ['rainbow', 'rail3'], ['rail4', 'rail3']],
    [['halfpipe', 'quarter'], ['manual'], ['downrail', 'rail3'], ['ledge']],
    [['pyramid', 'gapline', 'gapshort'], ['downrail', 'rail4'], ['rollers', 'manual'], ['rail4', 'rail3']],
  ];
  function auto(r) {
    const occ = grid(r), out = { fs: [], gap: null, kit: r.i % KITS.length }, seed = r.i * 31;
    for (const choices of KITS[out.kit]) for (let c = 0; c < choices.length; c++) {
      const P = PIECES[choices[c]], p = fit(occ, P.a0, P.a1, P.b, seed + c * 7 + choices[c].length);
      if (p) { P.put(p, out); claim(occ, p.x, p.z, p.yaw, ...P.claim); break; }
    }
    // a crowded set still gets something: a short rail, a little kicker
    if (!out.fs.length) { const p = fit(occ, PIECES.rail3.a0, PIECES.rail3.a1, PIECES.rail3.b, seed + 7); if (p) { PIECES.rail3.put(p, out); claim(occ, p.x, p.z, p.yaw, ...PIECES.rail3.claim); } }
    if (out.fs.length < 2) { const p = fit(occ, PIECES.kicker.a0, PIECES.kicker.a1, PIECES.kicker.b, seed + 13); if (p) PIECES.kicker.put(p, out); }
    return { features: out.fs, gap: out.gap };
  }
  function goalsFor(r, spec) {
    if (spec.goals) return spec.goals;
    const film = (r.film || r.name).replace(/, \d{4}$/, '').replace(/^The /, 'the '), fs = spec.features, has = (t) => fs.some((f) => f.type === t), g = [];
    if (spec.gap) g.push({ k: 'gap', text: spec.gap.name === 'THE PYRAMID' ? 'Clear the pyramid, bank to bank' : `Clear the gap on the ${film.replace(/^the /, '')} set` });
    if (has('quarter')) g.push({ k: 'trick', trick: 'AIR', text: 'Catch air out of the quarter pipe' }, { k: 'trick', trick: 'ROCK TO FAKIE', text: 'Stall on the coping and roll back fakie' });
    const rail = fs.find((f) => f.type === 'rail');
    if (rail) g.push({ k: 'grind', t: rail.arch ? 1 : rail.y2 !== undefined ? 1.2 : 1.5, text: rail.arch ? 'Grind over the rainbow rail' : rail.y2 !== undefined ? 'Grind the down rail to the bottom' : 'Grind the rail for a second and a half' });
    else if (has('box')) g.push({ k: 'grind', t: 0.8, text: 'Grind the edge of the ledge' });
    if (has('kicker') && !spec.gap) g.push({ k: 'trick', trick: 'AIR', text: 'Launch off the kicker and land it' });
    if (!g.length) g.push({ k: 'trick', trick: 'KICKFLIP', text: `Land a kickflip in the ${film.replace(/^the /, '')} set` });
    const n = 800 + 200 * (r.i % 8) + (g.length > 1 ? 800 : 0);
    g.push({ k: 'combo', n, text: `Land a ${n.toLocaleString('en-US')} combo` });
    if (g.length < 3) g.push({ k: 'speed', v: 9.7, text: 'Hit 35 km/h' });
    return g.slice(0, 3);
  }
  function build(r) {
    // a set with goals of its own is laid out by hand and stays that way; the other hand placed spots are a fallback
    let spec = SPOTS[r.id];
    if (!spec || !spec.goals) { const a = auto(r); spec = a.features.length >= 2 || !spec ? a : spec; }
    const fs = [], g = new THREE.Group(); g.userData.park = true; r.group.add(g);
    const hue = new THREE.Color(r.sky || 0x404060).getHSL({}).h;
    for (const f of spec.features) {
      const w = { ...f, wx: (f.x ?? 0) + r.x0, wz: f.z ?? 0 };
      if (f.type === 'kicker') meshKicker(f, g, hue); else if (f.type === 'quarter') meshQuarter(f, g, hue); else if (f.type === 'pyramid') meshPyramid(f, g); else if (f.type === 'roller') meshRoller(f, g);
      else if (f.type === 'manual') meshManual(f, g); else if (f.type === 'box') meshBox(f, g); else meshRail(f, g);
      fs.push(w);
    }
    if (spec.gap) meshGap(spec.gap, g);
    g.traverse((m) => { m.userData.park = true; });
    const rails = fs.filter((f) => f.type === 'rail').map((f) => ({ x1: f.x1 + r.x0, z1: f.z1, x2: f.x2 + r.x0, z2: f.z2, y: f.y, y1: f.y1, y2: f.y2, arch: f.arch, name: f.name }));
    // a ledge box has two grindable edges
    for (const f of fs.filter((q) => q.type === 'box')) { const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw), sx = Math.cos(f.yaw), sz = -Math.sin(f.yaw);
      for (const s of [-1, 1]) rails.push({ x1: f.wx - fx * f.len / 2 + sx * s * f.w / 2, z1: f.wz - fz * f.len / 2 + sz * s * f.w / 2, x2: f.wx + fx * f.len / 2 + sx * s * f.w / 2, z2: f.wz + fz * f.len / 2 + sz * s * f.w / 2, y: f.h, name: 'LEDGE GRIND' }); }
    const gaps = spec.gap ? [{ from: { x: spec.gap.from[0] + r.x0, z: spec.gap.from[1], r: spec.gap.from[2] }, to: { x: spec.gap.to[0] + r.x0, z: spec.gap.to[1], r: spec.gap.to[2] }, name: spec.gap.name, bonus: spec.gap.bonus }] : [];
    return PARK[r.id] = { features: fs, surface: surfaceOf(fs), solid: solidOf(fs), rails, gaps, goals: goalsFor(r, spec), group: g, auto: !SPOTS[r.id] || !SPOTS[r.id].goals };
  }
  return {
    PARK,
    // lays a set out the first time it is asked once its models are in; null until then
    get(r, ready) { return PARK[r.id] || (ready && r.group ? build(r) : null); },
    // the height of the terrain under a point, for walking: ramps and ledges alike
    surface(r, x, z) { const p = r && PARK[r.id]; return p ? Math.max(p.surface(x, z), p.solid(x, z)) : 0; },
    dump(r) { return grid(r); },
  };
}
