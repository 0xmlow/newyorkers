// Round thirteen batch c2: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// No new lights: practicals are emissive or additive and the finishing pass blooms them. Every tick returns at once
// unless its set is the one you stand in (or, for the cheap ones, a neighbour).
const PI = Math.PI;
const here = (r, ri) => ri === r.i;

// ---------- the kit this batch shares ----------
// an additive glow sprite: a bulb, a lamp head, a halo
function glow(c, K, g, x, y, z, s = 0.9, col = 'rgba(255,214,150,.55)') {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a soft additive plane: a light shaft, haze, a cone of dust in a beam
const SHAFT = {};
function shaftTex(c, col) {
  return SHAFT[col] ||= c.canvasTex(64, 256, (q, w, h) => {
    const v = q.createLinearGradient(0, 0, 0, h); v.addColorStop(0, col); v.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = v; q.fillRect(0, 0, w, h);
    q.globalCompositeOperation = 'destination-in'; const u = q.createLinearGradient(0, 0, w, 0); u.addColorStop(0, 'rgba(0,0,0,0)'); u.addColorStop(0.5, 'rgba(0,0,0,1)'); u.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = u; q.fillRect(0, 0, w, h);
  });
}
function bandTex(c, col) {
  return SHAFT['b' + col] ||= c.canvasTex(64, 128, (q, w, h) => {
    const v = q.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.55, col); v.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = v; q.fillRect(0, 0, w, h);
    q.globalCompositeOperation = 'destination-in'; const u = q.createLinearGradient(0, 0, w, 0); u.addColorStop(0, 'rgba(0,0,0,0)'); u.addColorStop(0.2, 'rgba(0,0,0,1)'); u.addColorStop(0.8, 'rgba(0,0,0,1)'); u.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = u; q.fillRect(0, 0, w, h);
  });
}
function shaft(c, g, x, y, z, w, h, col = 'rgba(255,230,180,.35)', o = {}) {
  const { THREE } = c, geo = new THREE.PlaneGeometry(w, h, 1, 1); geo.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: o.band ? bandTex(c, col) : shaftTex(c, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false, opacity: o.op ?? 1 }));
  m.position.set(x, y, z); m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); g.add(m); return m;
}
// a cone of light under a fixture, open at both ends
function cone(c, g, x, y, z, r0, r1, h, col = 'rgba(255,230,180,.22)') {
  const { THREE } = c, geo = new THREE.CylinderGeometry(r0, r1, h, 24, 1, true); geo.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTex(c, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
  m.position.set(x, y, z); g.add(m); return m;
}
// a flat decal on the floor (or anything horizontal), drawn on a canvas
function floorArt(c, K, g, w, d, x, z, draw, px = 512, y = 0.013) { if (c.MOBILE) px = Math.min(px, Math.floor(1024 * Math.min(1, d / w))); const m = K.decal(w, d, draw, px); m.rotation.x = -PI / 2; m.position.set(x, y, z); g.add(m); return m; }
// drifting motes in a box: dust in light, ash, sparks, snow. One Points, moved in its tick only while the set is yours
const DOT = {};
function motes(c, g, r, n, [x1, y1, z1, x2, y2, z2], o = {}) {
  const { THREE } = c, N = c.MOBILE ? n >> 1 : n, p = new Float32Array(N * 3), sd = new Float32Array(N);
  for (let k = 0; k < N; k++) { p[k * 3] = x1 + Math.random() * (x2 - x1); p[k * 3 + 1] = y1 + Math.random() * (y2 - y1); p[k * 3 + 2] = z1 + Math.random() * (z2 - z1); sd[k] = Math.random() * 6.3; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  DOT.t ||= c.canvasTex(32, 32, (q, w) => { const gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, w); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: o.col ?? 0xffe8c0, size: (o.size ?? 0.04) * 1.8, transparent: true, opacity: o.op ?? 0.8, depthWrite: false, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false, map: o.map || DOT.t }));
  pts.frustumCulled = false; g.add(pts);
  const vy = o.vy ?? 0.05, sw = o.sway ?? 0.08;
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; for (let k = 0; k < N; k++) { const i = k * 3; p[i + 1] += vy * dt * (0.6 + (k % 5) * 0.2); p[i] += Math.sin(t * 0.7 + sd[k]) * sw * dt; p[i + 2] += Math.cos(t * 0.5 + sd[k]) * sw * dt * 0.6;
    if (p[i + 1] > y2) p[i + 1] = y1; else if (p[i + 1] < y1) p[i + 1] = y2; } geo.attributes.position.needsUpdate = true; });
  return pts;
}
// emissive material that blooms
const lit = (c, color, k = 1.6, o = {}) => new c.THREE.MeshBasicMaterial({ color: new c.THREE.Color(color).multiplyScalar(k), toneMapped: false, ...o });
function grime(q, w, h, n = 60, a = 0.12) { for (let i = 0; i < n; i++) { const x = Math.random() * w, y = Math.random() * h, rr = 10 + Math.random() * w * 0.05, gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }

// anamorphosis: paint on the floor what a standing picture would look like from one eye point.
// src is a canvas standing upright in the plane z = zb, from x bx to bx + bw, floor to bh. The floor patch is x1..x2, z1..z2 (z1 < z2).
function anamorph(c, src, { E, zb, bx, bw, bh, x1, x2, z1, z2, W2 = 1024, H2 = 512, shadow = 0.5 }) {
  const sw = src.width, sh = src.height, sd = src.getContext('2d').getImageData(0, 0, sw, sh).data;
  return c.canvasTex(W2, H2, (q, w, h) => {
    const img = q.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) { const fz = z1 + (j + 0.5) / h * (z2 - z1);
      for (let i = 0; i < w; i++) { const fx = x1 + (i + 0.5) / w * (x2 - x1), o = (j * w + i) * 4;
        // the cast shadow first: the picture laid back on the floor behind its own foot, as if lit from behind you
        if (shadow && fz < zb) { const Y = (zb - fz) * 0.55, u = (fx - bx) / bw, v = 1 - Y / bh; if (u >= 0 && u < 1 && v >= 0 && v < 1) { const s = ((v * sh | 0) * sw + (u * sw | 0)) * 4 + 3; if (sd[s] > 40) { d[o + 3] = 255 * shadow * sd[s] / 255; } } }
        if (fz >= zb || fz >= E.z) continue;
        const t = (zb - E.z) / (fz - E.z), Y = E.y * (1 - t), X = E.x + t * (fx - E.x), u = (X - bx) / bw, v = 1 - Y / bh;
        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
        const s = ((v * sh | 0) * sw + (u * sw | 0)) * 4; if (sd[s + 3] < 10) continue;
        const a = sd[s + 3] / 255; d[o] = sd[s]; d[o + 1] = sd[s + 1]; d[o + 2] = sd[s + 2]; d[o + 3] = Math.max(d[o + 3], 255 * a);
      } }
    q.putImageData(img, 0, 0);
  });
}

export const PROPS = {};
export const ROOM = {};
export const SWAP = {};

Object.assign(ROOM, {
  // ---------------- Midnight Cowboy: the crosswalk ----------------
  walking(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: anamorphic street paint. From the marked spot at the entrance the words stand up out of the crosswalk
    // as solid yellow letters; take one step off it and they fall flat into a long smear down the avenue.
    const E = { x: 10, y: 1.62, z: 5.8 }, zb = 2.6, bh = 0.9, bx = 6.6, bw = 6.8;
    const src = document.createElement('canvas'); src.width = 1360; src.height = 180; const q = src.getContext('2d');
    q.font = `900 150px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'alphabetic'; const T = 'I\'M WALKIN\' HERE!', cx = 680, by = 162;
    for (let k = 14; k > 0; k--) { q.fillStyle = k > 2 ? '#a8661a' : '#5a3008'; q.fillText(T, cx, by - k); }   // the block's top face, seen from above
    q.lineWidth = 10; q.strokeStyle = '#111'; q.strokeText(T, cx, by - 14); q.fillStyle = '#ffcf3a'; q.fillText(T, cx, by - 14);
    const ana = anamorph(c, src, { E, zb, bx, bw, bh, x1: 2, x2: 18, z1: -2.2, z2: zb, W2: c.MOBILE ? 1024 : 1536, H2: 512, shadow: 0.45 });
    const am = new THREE.Mesh(new THREE.PlaneGeometry(16, zb + 2.2), new THREE.MeshStandardMaterial({ map: ana, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    am.rotation.x = -PI / 2; am.position.set(10, 0.032, (zb - 2.2) / 2); g.add(am);
    // the marked spot: two painted feet in a ring that glows
    const spot = floorArt(c, K, g, 1.3, 1.3, E.x, E.z, (q2, w, h) => { q2.strokeStyle = '#22d3ee'; q2.lineWidth = 10; q2.beginPath(); q2.arc(w / 2, h / 2, w * 0.44, 0, 7); q2.stroke();
      q2.fillStyle = '#22d3ee'; [[-0.12, 0.05], [0.12, -0.02]].forEach(([u, v]) => { q2.beginPath(); q2.ellipse(w * (0.5 + u), h * (0.52 + v), w * 0.07, h * 0.16, 0, 0, 7); q2.fill(); });
      q2.fillStyle = '#f4ead2'; q2.font = `800 ${h * 0.08}px ${c.MONO}`; q2.textAlign = 'center'; q2.fillText('STAND HERE. LOOK UP THE AVENUE.', w / 2, h * 0.16); q2.fillText('MLow', w / 2, h * 0.9); }, 256, 0.02);
    spot.material = new THREE.MeshBasicMaterial({ map: spot.material.map, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3), polygonOffset: true, polygonOffsetFactor: -4 });
    c.clickable(spot, () => { c.sound.ding(); c.egg('walking_paint', 'Stand on the feet and the paint stands up and shouts. Step off and it lies back down in the road, like every New Yorker after a double shift. MLow painted it at dawn, before the cabs.'); }, 'The painted feet');
    // the road: lane lines, a stop bar, oil, tar seams, a second manhole, and puddles that hold the sky
    floorArt(c, K, g, 20, 16, 10, 0, (q2, w, h) => { const s = w / 20, Z = (z) => (z + 8) * s;
      q2.fillStyle = 'rgba(240,236,220,.8)'; for (let z = -8; z < -1.5; z += 1.6) [6.4, 13.6].forEach((x) => q2.fillRect(x * s - 4, Z(z), 8, s * 0.9));
      q2.fillRect(3 * s, Z(-1.3), 14 * s, s * 0.32);
      q2.fillStyle = 'rgba(245,197,66,.85)'; q2.font = `900 ${s * 0.9}px ${c.FONT}`; q2.textAlign = 'center'; q2.save(); q2.translate(10 * s, Z(-4.6)); q2.scale(1, 2.2); q2.fillText('ONLY', 0, 0); q2.restore();
      q2.strokeStyle = 'rgba(10,10,10,.55)'; q2.lineWidth = 5; for (let k = 0; k < 7; k++) { q2.beginPath(); let x = Math.random() * w, y = 0; q2.moveTo(x, y); while (y < h) { y += 30; x += (Math.random() - 0.5) * 30; q2.lineTo(x, y); } q2.stroke(); }
      for (let k = 0; k < 26; k++) { const x = Math.random() * w, y = Math.random() * h, rr = 12 + Math.random() * 40, gr = q2.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(10,8,20,.5)'); gr.addColorStop(0.6, 'rgba(60,20,90,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q2.fillStyle = gr; q2.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      grime(q2, w, h, 50, 0.16);
      // the second manhole
      const mx = 6.2 * s, my = Z(-3.6); q2.fillStyle = '#2a2622'; q2.beginPath(); q2.arc(mx, my, s * 0.42, 0, 7); q2.fill(); q2.strokeStyle = '#4a4440'; q2.lineWidth = 3; for (let k = 1; k < 5; k++) { q2.beginPath(); q2.arc(mx, my, s * 0.09 * k, 0, 7); q2.stroke(); }
      q2.fillStyle = '#6a625a'; q2.font = `700 ${s * 0.09}px ${c.MONO}`; q2.textAlign = 'center'; q2.fillText('N3W SEWER', mx, my - s * 0.18); }, 1024, 0.011);
    K.steam(g, 6.2, 0.1, -3.6);
    const pud = new THREE.MeshStandardMaterial({ color: 0x202430, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    [[3.2, -5.4, 1.6, 0.7], [15.2, -1.9, 1.2, 0.5], [17.4, 3.8, 1.0, 0.6], [8.1, -6.4, 1.4, 0.45]].forEach(([x, z, a, b]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), pud); m.scale.set(a, b, 1); m.rotation.x = -PI / 2; m.position.set(x, 0.016, z); g.add(m); });
    // the sun at the end of the avenue: long shafts down the street, and dust in them
    [[7.8, -0.25], [10, 0], [12.4, 0.22]].forEach(([x, rz], k) => shaft(c, g, x, 9.5, -7.4 + k * 0.3, 2.2 + k * 0.4, 13, 'rgba(255,214,150,.26)', { rx: -0.95, rz }));
    motes(c, g, r, 260, [3, 0.2, -7, 17, 4.5, 4], { col: 0xffe0a8, size: 0.035, vy: 0.04, sway: 0.15, op: 0.75 });
    // overhead: a span wire across the avenue with a signal head hanging over the crosswalk, red then green
    const wire = K.std(0x111111); g.add(c.slab(19.5, 0.025, 0.025, wire, 10, 6.6, 0.4));
    const head = new THREE.Group(); head.position.set(10, 6.0, 0.4); g.add(head);
    head.add(c.slab(0.42, 1.25, 0.36, K.std(0x1d3a1d, { roughness: 0.6 }), 0, 0, 0)); head.add(c.slab(0.02, 0.6, 0.02, wire, 0, 0.9, 0));
    const lamps = [0xff3020, 0xffb020, 0x30ff70].map((col, k) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), lit(c, col, 0.25)); m.position.set(0, 0.38 - k * 0.38, 0.185); head.add(m); const v = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.18, 16, 1, true, 0, PI), K.std(0x111111, { side: THREE.DoubleSide })); v.rotation.x = PI / 2; v.rotation.y = PI; v.position.set(0, 0.48 - k * 0.38, 0.26); head.add(v); return m; });
    const back = head.clone(); back.rotation.y = PI; back.position.z = 0.4; g.add(back);
    const hg = glow(c, K, g, 10, 6.38, 0.7, 1.4, 'rgba(255,60,40,.6)');
    // a blade sign on the east wall high over the block, chasing bulbs, and a hotel blade on the west
    const blade = (x, ry, word, col) => { const s = c.sign(word, { w: 0.7, h: 3.4, bg: '#101010', fg: col, font: c.FONT, weight: 900, glow: 24, border: col }); s.position.set(x, 6.4, -1.0); s.rotation.y = ry; g.add(s); const s2 = s.clone(); s2.rotation.y = ry + PI; s2.position.x += ry > 0 ? 0.02 : -0.02; g.add(s2); g.add(c.slab(0.9, 0.05, 0.05, wire, x + (ry > 0 ? -0.4 : 0.4), 8.2, -1.0)); return s; };
    blade(0.75, PI / 2, 'H\nO\nT\nE\nL', '#ff4fa3'); blade(19.25, -PI / 2, 'M\nL\nO\nW', '#22d3ee');
    const mq = c.sign('MLOW CINEMA  ·  MIDNIGHT SHOWS', { w: 4.6, h: 0.6, bg: '#1a0f08', fg: '#ffd890', font: c.FONT, weight: 900, glow: 18, border: '#f5c542' }); mq.position.set(19.6, 4.85, -4.2); mq.rotation.y = -PI / 2; g.add(mq);
    const chase = []; const bg2 = new THREE.SphereGeometry(0.05, 8, 6), on = lit(c, 0xffd890, 1.8), off = K.std(0x3a3020);
    for (let k = 0; k < 24; k++) { const m = new THREE.Mesh(bg2, on); m.position.set(19.52, k < 12 ? 5.2 : 4.5, -6.5 + (k % 12) * 0.38); g.add(m); chase.push(m); }
    // newspapers blowing across the street
    const paperT = c.canvasTex(128, 160, (q2, w, h) => { q2.fillStyle = '#e8e2d0'; q2.fillRect(0, 0, w, h); q2.fillStyle = '#111'; q2.font = `900 22px ${c.SERIF}`; q2.fillText('N3W DAILY', 8, 26); q2.fillStyle = '#555'; for (let y = 40; y < h - 8; y += 7) q2.fillRect(8, y, w - 16 - (y % 21), 3); });
    const papers = [0, 1, 2, 3].map((k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshStandardMaterial({ map: paperT, side: THREE.DoubleSide, roughness: 0.9 })); g.add(m); return m; });
    // halos on the two street lamps, so the block reads lit
    [2.0, 18.2].forEach((x) => glow(c, K, g, x, 4.45, -5.0, 1.5, 'rgba(255,220,160,.55)'));
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const ph = (t % 12) / 12, red = ph < 0.55, amb = ph >= 0.55 && ph < 0.65;
      lamps[0].material.color.setRGB(red ? 3 : 0.25, red ? 0.4 : 0.05, red ? 0.25 : 0.03); lamps[1].material.color.setRGB(amb ? 3 : 0.3, amb ? 1.8 : 0.2, amb ? 0.3 : 0.02); lamps[2].material.color.setRGB(0.05, !red && !amb ? 3 : 0.25, !red && !amb ? 1.2 : 0.08);
      hg.position.y = red ? 6.38 : amb ? 6.0 : 5.62; hg.material.color.setRGB(red ? 1 : amb ? 1 : 0.3, red ? 0.3 : amb ? 0.75 : 1, red ? 0.2 : 0.2);
      const k0 = (t * 9) | 0; chase.forEach((m, i) => { m.material = (i + k0) % 4 === 0 ? off : on; });
      papers.forEach((m, k) => { const u = ((t * 0.07 + k * 0.27) % 1); m.position.set(1 + u * 18, 0.05 + Math.abs(Math.sin(t * 2 + k * 2)) * (0.3 + k * 0.15), -5.6 + k * 2.7 + Math.sin(t * 0.6 + k) * 0.8); m.rotation.set(-PI / 2 + Math.sin(t * 3 + k) * 0.7, t * (1 + k * 0.3), Math.cos(t * 2.4 + k) * 0.5); });
    });
    r.post = { ...(r.post || {}), bloom: 0.95, vig: 0.5 };
  },
});

Object.assign(ROOM, {
  // ---------------- When Harry Met Sally: the deli ----------------
  katz(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: the cafe wall. Black and white tiles, every row shifted a little, grey grout: the rows are dead straight
    // and level, and every one of them looks like a wedge. A wainscot down the west wall and the whole counter front.
    const tileT = c.canvasTex(512, 256, (q, w, h) => { const n = 8, tw = w / n, rows = 6, th = h / rows, sh = [0, 0.25, 0.5, 0.25, 0, 0.25];
      q.fillStyle = '#8a8a86'; q.fillRect(0, 0, w, h);
      for (let j = 0; j < rows; j++) for (let i = -1; i <= n; i++) { const x = (i + sh[j]) * tw; q.fillStyle = i % 2 === 0 ? '#0d0d0d' : '#f2efe6'; q.fillRect(x + 2, j * th + 2, tw - 4, th - 4); }
      q.globalAlpha = 0.08; grime(q, w, h, 30, 0.5); });
    tileT.wrapS = THREE.RepeatWrapping;
    const tileM = (len) => { const t = tileT.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.x = len / 1.6; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.22, metalness: 0.05 }); };
    const wains = (x, z1, z2, ry) => { const L = z2 - z1, m = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.2), tileM(L)); m.position.set(x, 0.6, (z1 + z2) / 2); m.rotation.y = ry; g.add(m); g.add(c.slab(0.06, 0.08, L, K.std(0x1a1410, { roughness: 0.4 }), x, 1.24, (z1 + z2) / 2)); return m; };
    const w1 = wains(0.15, -8, 1.95, PI / 2); wains(0.15, 5.65, 8, PI / 2);
    // the counter front (it was a flat cream slab): same tiles, and a brass foot rail
    const cf = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), tileM(9)); cf.position.set(K.W - 1.51, 0.55, -1.6); cf.rotation.y = -PI / 2; g.add(cf);
    g.add(c.slab(0.05, 0.05, 9, K.std(0xd6a640, { metalness: 1, roughness: 0.25 }), K.W - 1.75, 0.22, -1.6));
    c.clickable(w1, () => { c.sound.clink(900); c.egg('katz_tiles', 'Every row of these tiles is dead level. Lay a ruler on them. Your eyes still say the wall is sliding into the pickles. MLow tiled it himself and would not use a spirit level, out of spite.'); }, 'The tiles');
    // the ceiling: pressed tin, painted cream, the whole room
    const tin = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#c9bfa6'; q.fillRect(0, 0, w, h); const s = w / 2;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * s, y = j * s; q.strokeStyle = 'rgba(70,55,30,.55)'; q.lineWidth = 5; q.strokeRect(x + 8, y + 8, s - 16, s - 16); q.strokeStyle = 'rgba(255,250,235,.7)'; q.lineWidth = 2; q.strokeRect(x + 12, y + 12, s - 24, s - 24);
        q.beginPath(); q.arc(x + s / 2, y + s / 2, s * 0.26, 0, 7); q.stroke(); q.strokeStyle = 'rgba(70,55,30,.5)'; q.beginPath(); q.arc(x + s / 2, y + s / 2, s * 0.2, 0, 7); q.stroke();
        for (let a = 0; a < 8; a++) { q.beginPath(); q.ellipse(x + s / 2 + Math.cos(a * PI / 4) * s * 0.13, y + s / 2 + Math.sin(a * PI / 4) * s * 0.13, s * 0.05, s * 0.025, a * PI / 4, 0, 7); q.stroke(); } } });
    tin.wrapS = tin.wrapT = THREE.RepeatWrapping; tin.repeat.set(16, 13);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshStandardMaterial({ map: tin, roughness: 0.45, metalness: 0.35, color: 0xd8ccb0 })); ceil.rotation.x = PI / 2; ceil.position.set(10, 5.97, 0); g.add(ceil);
    // milk glass globes on rods, two rows, each with a soft cone of light under it
    const globes = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) globes.push([2.4 + i * 3.1, j ? 2.2 : -3.8]);
    const gm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 16, 12), lit(c, 0xfff0d0, 1.5), globes.length), rm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 6), K.std(0x2a2018, { metalness: 0.6 }), globes.length), m4 = new THREE.Matrix4();
    globes.forEach(([x, z], k) => { m4.makeTranslation(x, 4.25, z); gm.setMatrixAt(k, m4); m4.makeTranslation(x, 5.25, z); rm.setMatrixAt(k, m4); glow(c, K, g, x, 4.25, z, 1.3, 'rgba(255,220,160,.5)'); if (k % 2 === 0) cone(c, g, x, 4.1, z, 0.25, 1.6, 4.0, 'rgba(255,225,170,.09)'); });
    g.add(gm); g.add(rm);
    // the menu board over the counter, lit, and steam off the carving station
    const menu = c.sign('PASTRAMI ON RYE  ·  CORNED BEEF  ·  KNISH\nFULL SOUR  ·  HALF SOUR  ·  EGG CREAM\nN3W YORKERS DELI  ·  EST. BY MLow', { w: 6.4, h: 1.3, bg: '#14100c', fg: '#ffe6a8', font: c.SERIF, weight: 800, glow: 14, border: '#c9a033' });
    menu.position.set(K.W - 0.3, 4.55, -1.6); menu.rotation.y = -PI / 2; g.add(menu);
    [-4.6, -2.4, -0.2].forEach((z) => K.steam(g, K.W - 1.0, 1.2, z));
    // neon in the north window over her table, and a ticket machine that glows
    const neon = c.sign('I\'LL HAVE WHAT SHE\'S COUNTING', { w: 5.6, h: 0.55, bg: null, fg: '#ff4fa3', font: c.FONT, weight: 900, glow: 30 }); neon.material.color.setScalar(1.6); neon.position.set(13.2, 4.75, -7.75); g.add(neon);
    const tk = new THREE.Group(); tk.position.set(18.2, 0, 4.8); g.add(tk); tk.add(c.slab(0.36, 1.3, 0.3, K.std(0xb01818, { roughness: 0.35 }), 0, 0.65, 0)); const tl = c.sign('TAKE A\nTICKET', { w: 0.32, h: 0.24, bg: '#ffd84a', fg: '#111', weight: 900 }); tl.position.set(0, 1.05, 0.16); tk.add(tl); c.post(X(18.2), 4.8, 0.3);
    glow(c, K, g, 18.2, 1.05, 5.05, 0.7, 'rgba(255,216,74,.5)');
    // on every table: mustard, a napkin box and a plate of pickles
    const tables = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (!(i === 1 && j === 1)) tables.push([3 + i * 3.6, -4.6 + j * 3.3]);
    const must = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 10), K.std(0xf5c518, { roughness: 0.3 }), tables.length), nap = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.12, 0.09), K.std(0xc8ccd0, { metalness: 0.9, roughness: 0.25 }), tables.length), pk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8).rotateZ(PI / 2), K.std(0x5a7a2a, { roughness: 0.5 }), tables.length * 3);
    tables.forEach(([x, z], k) => { m4.makeTranslation(x - 0.3, 0.86, z + 0.12); must.setMatrixAt(k, m4); m4.makeTranslation(x - 0.15, 0.83, z - 0.1); nap.setMatrixAt(k, m4); for (let p = 0; p < 3; p++) { m4.makeTranslation(x + 0.25, 0.8, z - 0.05 + p * 0.06); pk.setMatrixAt(k * 3 + p, m4); } });
    g.add(must); g.add(nap); g.add(pk);
    // salamis hung the length of the counter, more of them, with a string each
    const N = 30, sal = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), K.std(0x7a2e1a, { roughness: 0.55 }), N);
    for (let k = 0; k < N; k++) { m4.makeTranslation(K.W - 1.0 + (k % 3 - 1) * 0.18, 3.55 + (k % 2) * 0.12, -5.8 + k * 0.29); sal.setMatrixAt(k, m4); } g.add(sal);
    g.add(c.slab(0.03, 0.03, 9, K.std(0x2a2018), K.W - 1.0, 3.95, -1.6));
    // warm haze from the street windows, and dust in it
    [3.5, 8, 12.5].forEach((x, k) => shaft(c, g, x, 5.4, -7.6, 2.4, 7, 'rgba(255,214,160,.16)', { rx: -0.7, rz: (k - 1) * 0.15 }));
    motes(c, g, r, 180, [1, 0.5, -7, 18, 5, 6], { col: 0xffe2b8, size: 0.03, vy: 0.03 });
    // the floor: a deli's hex tile, worn to the grout in the aisles
    floorArt(c, K, g, 20, 16, 10, 0, (q, w, h) => { grime(q, w, h, 70, 0.12); q.strokeStyle = 'rgba(30,20,10,.18)'; q.lineWidth = 1; const s = 14;
      for (let y = 0; y < h; y += s * 0.87) for (let x = ((y / (s * 0.87)) | 0) % 2 ? s / 2 : 0; x < w; x += s) { q.beginPath(); for (let a = 0; a < 6; a++) q.lineTo(x + Math.cos(a * PI / 3 + PI / 6) * s * 0.55, y + Math.sin(a * PI / 3 + PI / 6) * s * 0.55); q.closePath(); q.stroke(); }
      q.fillStyle = 'rgba(160,20,20,.85)'; q.font = `900 ${h * 0.03}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('NO TICKET, NO SANDWICH', w * 0.9, h * 0.86); }, 1024, 0.012);
    r.post = { ...(r.post || {}), bloom: 0.9, vig: 0.45 };
  },

  // ---------------- The Godfather Part II: the feast ----------------
  feast(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: peripheral drift. Four luminarie rosettes on the house fronts, painted in the rotating snakes order
    // (black, wine, white, gold in every cell, rings reversed): they sit perfectly still and turn in the corner of your eye.
    const ros = c.canvasTex(c.MOBILE ? 768 : 1024, c.MOBILE ? 768 : 1024, (q, w) => { const C = w / 2, cols = ['#0a0604', '#7a1020', '#fff6e0', '#f5c542'];
      q.fillStyle = '#1a0c06'; q.beginPath(); q.arc(C, C, C, 0, 7); q.fill();
      for (let ring = 0; ring < 7; ring++) { const r0 = C * (0.12 + ring * 0.125), r1 = r0 + C * 0.115, n = 10 + ring * 6, dir = ring % 2 ? 1 : -1;
        for (let s = 0; s < n; s++) for (let k = 0; k < 4; k++) { const a0 = (s + k / 4) / n * 2 * PI, a1 = (s + (k + 1) / 4) / n * 2 * PI, kk = dir > 0 ? k : 3 - k;
          q.fillStyle = cols[kk]; q.beginPath(); q.arc(C, C, r1, a0, a1); q.arc(C, C, r0, a1, a0, true); q.closePath(); q.fill(); } }
      for (let k = 0; k < 48; k++) { const a = k / 48 * 2 * PI; q.fillStyle = '#ffe6a0'; q.beginPath(); q.arc(C + Math.cos(a) * C * 0.96, C + Math.sin(a) * C * 0.96, C * 0.025, 0, 7); q.fill(); }
      K.eyeFlower(q, C, C, C * 0.14); });
    const rosM = new THREE.MeshBasicMaterial({ map: ros, transparent: true, toneMapped: false, color: new THREE.Color(0.62, 0.6, 0.57) });
    const rosettes = [];
    [[0.2, PI / 2], [K.W - 0.2, -PI / 2]].forEach(([x, ry]) => [-5.2, -0.2].forEach((z, k) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1.7 - k * 0.2, 64), rosM); m.position.set(x + (ry > 0 ? 0.02 : -0.02), 6.6 - k * 0.3, z); m.rotation.y = ry; g.add(m); rosettes.push(m); }));
    // and one over the far end of the street, hung on the last arch
    const big = new THREE.Mesh(new THREE.CircleGeometry(1.3, 64), rosM); big.position.set(10, 7.8, -6.6); g.add(big); rosettes.push(big);
    rosettes.forEach((m) => c.clickable(m, () => { c.sound.chords(4); c.egg('feast_rosette', 'Look at the eye in the middle and the rosette stops dead. Look away and every ring starts turning again. Nothing on Mulberry Street moves unless you are not watching it. MLow learned that from the old men on the folding chairs.'); }, 'The rosette'));
    // festoons: strings of bulbs zigzagging across the street at three heights, all one instanced mesh
    const B = []; for (let s = 0; s < 6; s++) { const z = -6 + s * 2.4, y = 5.8 + (s % 2) * 0.6; for (let k = 0; k <= 26; k++) { const u = k / 26, x = 0.6 + u * 18.8, sag = Math.sin(u * PI) * 1.2; B.push([x, y - sag, z + Math.sin(u * PI * 2) * 0.4]); } }
    const bulbM = lit(c, 0xffd890, 2.0), bm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), bulbM, B.length), m4 = new THREE.Matrix4();
    B.forEach((p, k) => { m4.makeTranslation(p[0], p[1], p[2]); bm.setMatrixAt(k, m4); }); g.add(bm);
    for (let s = 0; s < 6; s++) { const pts = []; for (let k = 0; k <= 26; k++) pts.push(new THREE.Vector3(...B[s * 27 + k])); g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x1a1008 }))); }
    // tricolore bunting under the bulbs, red white and green triangles
    const flagG = new THREE.BufferGeometry(); { const v = [], col = [], cc = [[0.12, 0.5, 0.2], [0.95, 0.93, 0.88], [0.75, 0.1, 0.12]];
      for (let s = 0; s < 3; s++) { const z = -4.8 + s * 4.2, y = 5.0; for (let k = 0; k < 30; k++) { const u = k / 30, x = 0.8 + u * 18.4, yy = y - Math.sin(u * PI) * 0.9, c3 = cc[k % 3]; v.push(x, yy, z, x + 0.5, yy, z, x + 0.25, yy - 0.45, z); for (let i = 0; i < 3; i++) col.push(...c3); } }
      flagG.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); flagG.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); flagG.computeVertexNormals(); }
    const flags = new THREE.Mesh(flagG, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 })); g.add(flags);
    // red paper lanterns down both sides, glowing
    const lanT = c.canvasTex(128, 160, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.5, '#ff5020'); gr.addColorStop(1, '#8a0a10'); q.fillStyle = gr; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 8, 0, 0, 7); q.fill(); q.strokeStyle = 'rgba(60,0,0,.5)'; q.lineWidth = 2; for (let y = 20; y < h - 10; y += 12) { q.beginPath(); q.ellipse(w / 2, y, w / 2 - 6, 3, 0, 0, 7); q.stroke(); } q.fillStyle = '#1a0a04'; q.fillRect(w / 2 - 20, 0, 40, 10); q.fillRect(w / 2 - 20, h - 10, 40, 10); });
    const lanterns = []; [1.4, 18.6].forEach((x) => [-5.5, -3, -0.5, 6.5].forEach((z, k) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lanT, toneMapped: false, color: new THREE.Color(1.3, 1.2, 1.1) })); s.scale.set(0.5, 0.62, 1); s.position.set(x, 3.9 + (k % 2) * 0.3, z); g.add(s); lanterns.push(s); glow(c, K, g, x, 3.9 + (k % 2) * 0.3, z, 1.3, 'rgba(255,90,40,.45)'); }));
    // smoke off the sausage stall, and sparks off the grill
    K.steam(g, 17.6, 1.1, -2.0); K.steam(g, 17.2, 1.1, -1.8);
    motes(c, g, r, 60, [16.8, 1.0, -2.4, 18.4, 3.6, -1.6], { col: 0xffa040, size: 0.04, vy: 0.9, sway: 0.4 });
    // confetti all over the cobbles, and a warm haze over the street
    const NC = c.MOBILE ? 200 : 420, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.04), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }), NC), col3 = new THREE.Color(), e = new THREE.Euler(), qq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
    for (let k = 0; k < NC; k++) { e.set(-PI / 2 + (Math.random() - 0.5) * 0.3, 0, Math.random() * 6.3); qq.setFromEuler(e); m4.compose(pv.set(1 + Math.random() * 18, 0.012, -6.6 + Math.random() * 14), qq, one); conf.setMatrixAt(k, m4); conf.setColorAt(k, col3.set([0xc82a2a, 0xf4ead2, 0x2a8a3a, 0xf5c542, 0xff4fa3][k % 5])); }
    g.add(conf);
    [[4, 0.15], [10, 0], [16, -0.15]].forEach(([x, rz]) => shaft(c, g, x, 7.2, -4, 5, 7, 'rgba(255,170,90,.1)', { rz }));
    motes(c, g, r, 160, [1, 0.5, -7, 19, 6, 7], { col: 0xffd8a0, size: 0.035, vy: 0.06 });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; lanterns.forEach((s, k) => { s.position.y += Math.sin(t * 1.3 + k) * 0.0015; }); bulbM.color.setScalar(1.9 + Math.sin(t * 9) * 0.06); });
    r.post = { ...(r.post || {}), bloom: 1.05, vig: 0.55 };
  },
});

Object.assign(ROOM, {
  // ---------------- West Side Story: the street ----------------
  westside(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: a Penrose triangle in fire escape iron, hung over the street. Three straight beams at right angles that
    // never meet: from the chalk star at the entrance they close into one impossible triangle. Step off it and it falls open.
    // Every vertex is slid along its own sight line from the star, so the far end is fattened exactly as much as distance thins it.
    const E = new THREE.Vector3(10, 1.62, 5.8), Cc = new THREE.Vector3(10, 4.7, -4.4), u = E.clone().sub(Cc).normalize(), dE = E.distanceTo(Cc);
    const L = 2.7, t = 0.34, d = new THREE.Vector3(1, 1, 1).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(d, u), roll = new THREE.Quaternion().setFromAxisAngle(u, 0.42 + PI / 3); q.premultiply(roll);
    const beams = [[L + t, t, t, L / 2, 0, 0], [t, L + t, t, L, L / 2, 0], [t, t, L + t, L, L, L / 2]];
    const off = new THREE.Vector3(L / 2, L / 2, L / 2), v = new THREE.Vector3(), wp = new THREE.Vector3();
    const face = (col, em) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.25, emissive: em });
    const tone = [face(0xff6a8a, 0x5a1424), face(0xff6a8a, 0x5a1424), face(0xc0283e, 0x300810), face(0xc0283e, 0x300810), face(0x5a0c1c, 0x12020a), face(0x5a0c1c, 0x12020a)], iron = tone;
    const tri = new THREE.Group(); g.add(tri);
    beams.forEach(([w, h, dd, x, y, z]) => { const geo = new THREE.BoxGeometry(w, h, dd, 1, 1, 1); geo.translate(x, y, z); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).sub(off).applyQuaternion(q).add(Cc); const s = v.clone().sub(Cc).dot(u); wp.copy(v).addScaledVector(u, -s); v.copy(E).addScaledVector(wp.sub(E), (dE - s) / dE); pa.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals(); geo.computeBoundingSphere(); tri.add(new THREE.Mesh(geo, iron)); });
    // the cables it hangs from, and pink neon tubes under it so it reads at dusk
    [-1, 1].forEach((sx) => g.add(c.slab(0.015, 4.4, 0.015, K.std(0x111111), 10 + sx * 1.1, 8.6, -4.6)));
    const star = floorArt(c, K, g, 1.4, 1.4, E.x, E.z, (q2, w, h) => { q2.strokeStyle = 'rgba(255,255,255,.92)'; q2.lineWidth = 9; q2.lineJoin = 'round'; q2.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? w * 0.18 : w * 0.42; q2.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } q2.closePath(); q2.stroke(); q2.fillStyle = 'rgba(255,79,163,.85)'; q2.fill(); q2.fillStyle = '#fff'; q2.font = `800 ${h * 0.075}px ${c.MONO}`; q2.textAlign = 'center'; q2.fillText('STAND ON THE STAR, LOOK UP', w / 2, h * 0.97); }, 256, 0.02);
    const clickT = () => { c.sound.clink(700); c.egg('westside_triangle', 'Three iron beams, three right angles, and they never touch. From the chalk star they close into one triangle that cannot exist. Two gangs, one block, same trick: it only holds together from where you stand. MLow chalked the star.'); };
    tri.children.forEach((m) => c.clickable(m, clickT, 'The triangle')); c.clickable(star, clickT, 'The chalk star');
    // the court under the hoop, painted; a chain link fence behind it
    floorArt(c, K, g, 5, 6, 16.5, -2.6, (q2, w, h) => { q2.strokeStyle = 'rgba(245,240,225,.85)'; q2.lineWidth = 6; const s = w / 5; q2.strokeRect(s * 1.7, 0, s * 1.6, s * 2.9); q2.beginPath(); q2.arc(w / 2, s * 2.9, s * 0.8, 0, PI); q2.stroke(); q2.beginPath(); q2.arc(w / 2, s * 0.3, s * 3.0, 0.15, PI - 0.15); q2.stroke();
      q2.fillStyle = 'rgba(255,79,163,.7)'; q2.font = `900 ${s * 0.5}px ${c.FONT}`; q2.textAlign = 'center'; q2.fillText('JETS', w / 2, s * 4.6); q2.fillStyle = 'rgba(34,211,238,.7)'; q2.fillText('SHARKS', w / 2, s * 5.4); grime(q2, w, h, 30, 0.2); }, 512, 0.012);
    // an open hydrant on a hot night: water arcing into the street
    const NW = c.MOBILE ? 110 : 240, wp2 = new Float32Array(NW * 3), wl = new Float32Array(NW); for (let k = 0; k < NW; k++) wl[k] = Math.random();
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp2, 3));
    const water = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false })); water.frustumCulled = false; g.add(water);
    const splash = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); splash.scale.set(1.5, 0.9, 1); splash.rotation.x = -PI / 2; splash.position.set(6.8, 0.015, 1.4); g.add(splash);
    // wet asphalt that holds the neon, and a manhole that breathes
    [[13.5, 3.6, 2.0, 0.8], [3.0, -5.6, 1.4, 0.6]].forEach(([x, z, a, b]) => { const m = splash.clone(); m.scale.set(a, b, 1); m.position.set(x, 0.015, z); g.add(m); });
    floorArt(c, K, g, 1, 1, 12.6, -5.2, (q2, w, h) => { q2.fillStyle = '#211d1a'; q2.beginPath(); q2.arc(w / 2, h / 2, w * 0.45, 0, 7); q2.fill(); q2.strokeStyle = '#3e3832'; q2.lineWidth = 4; for (let k = 1; k < 5; k++) { q2.beginPath(); q2.arc(w / 2, h / 2, w * 0.1 * k, 0, 7); q2.stroke(); } }, 128, 0.012);
    K.steam(g, 12.6, 0.1, -5.2);
    // dusk: a purple haze at the far end, a few stars coming out, moths round the lamps
    [[5, 0.1], [10, 0], [15, -0.1]].forEach(([x, rz]) => shaft(c, g, x, 9, -7.2, 6, 9, 'rgba(255,120,200,.12)', { rz }));
    const stars = []; for (let k = 0; k < 40; k++) stars.push(glow(c, K, g, 1 + Math.random() * 18, 11 + Math.random() * 7, -6 + Math.random() * 12, 0.25 + Math.random() * 0.25, 'rgba(255,240,255,.9)'));
    [0.6, 19.4].forEach((x) => { glow(c, K, g, x, 2.95, 0.6, 1.4, 'rgba(255,220,170,.6)'); motes(c, g, r, 14, [x - 0.5, 2.6, 0.1, x + 0.5, 3.4, 1.1], { col: 0xfff0d0, size: 0.04, vy: 0, sway: 0.9 }); });
    // a string of bare bulbs across the street, between the fire escapes
    const N = 22, bm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), lit(c, 0xffe0a8, 2.0), N), m4 = new THREE.Matrix4(), pts = [];
    for (let k = 0; k < N; k++) { const uu = k / (N - 1), x = 0.4 + uu * 19.2, y = 5.2 - Math.sin(uu * PI) * 1.0; m4.makeTranslation(x, y - 0.1, 4.6); bm.setMatrixAt(k, m4); pts.push(new THREE.Vector3(x, y, 4.6)); } g.add(bm); g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x111111 })));
    c.tick((t2, dt, P, ri) => {
      if (!here(r, ri)) return;
      for (let k = 0; k < NW; k++) { wl[k] += dt * 1.1; if (wl[k] > 1) wl[k] -= 1; const s = wl[k], a = k * 2.4; wp2[k * 3] = 5.0 + s * 2.6 + Math.sin(a) * 0.08 * s; wp2[k * 3 + 1] = 0.55 + s * 1.4 - s * s * 1.9 + Math.cos(a) * 0.05; wp2[k * 3 + 2] = 1.2 + Math.sin(a * 1.7) * 0.25 * s; }
      wg.attributes.position.needsUpdate = true;
      stars.forEach((s, k) => { s.material.opacity = 0.6 + Math.sin(t2 * (1 + k % 3) + k) * 0.4; });
    });
    r.post = { ...(r.post || {}), bloom: 1.0, vig: 0.5 };
  },

  // ---------------- Ghost: the loft ----------------
  loft(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: Pepper's ghost. A sheet of glass at forty five degrees in front of the wheel, and a lamp in a black booth beside it.
    // Look through the glass and he is standing behind the stool with his hands on the clay. Walk round the glass and nobody is there.
    const P0 = new THREE.Vector3(8.1, 1.35, 0.5), n = new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2), tg = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2), HW = 1.25, G = new THREE.Vector3(8.0, 1.0, -0.95);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, 2.5), new THREE.MeshStandardMaterial({ color: 0xa8c8ff, roughness: 0.02, metalness: 0.95, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    glass.position.copy(P0); glass.rotation.y = -PI / 4; g.add(glass);
    const frame = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.35 });
    [-1, 1].forEach((s) => { const m = c.slab(0.05, 2.6, 0.05, frame, P0.x + tg.x * HW * s, 1.3, P0.z + tg.z * HW * s); g.add(m); c.post(X(m.position.x), m.position.z, 0.12); });
    const top = c.slab(HW * 2, 0.05, 0.05, frame, P0.x, 2.62, P0.z); top.rotation.y = -PI / 4; g.add(top); const bot = top.clone(); bot.position.y = 0.08; g.add(bot);
    c.wall(X(P0.x - tg.x * HW), P0.z - tg.z * HW, X(P0.x + tg.x * HW), P0.z + tg.z * HW);
    // the ghost: a cool glow in the shape of a man, an eye flower for a face, leaning over the wheel
    const ghT = c.canvasTex(256, 512, (q, w, h) => { q.filter = 'blur(6px)'; const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(190,230,255,.95)'); gr.addColorStop(1, 'rgba(120,180,255,0)'); q.fillStyle = gr;
      q.beginPath(); q.ellipse(w / 2, h * 0.42, w * 0.2, h * 0.2, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w / 2, h * 0.74, w * 0.16, h * 0.24, 0, 0, 7); q.fill();
      q.lineWidth = 26; q.strokeStyle = 'rgba(190,230,255,.8)'; q.lineCap = 'round'; q.beginPath(); q.moveTo(w * 0.36, h * 0.32); q.quadraticCurveTo(w * 0.18, h * 0.5, w * 0.34, h * 0.6); q.moveTo(w * 0.64, h * 0.32); q.quadraticCurveTo(w * 0.82, h * 0.5, w * 0.66, h * 0.6); q.stroke();
      q.filter = 'none'; q.globalAlpha = 0.85; K.eyeFlower(q, w / 2, h * 0.15, w * 0.2, '#e8f6ff', '#7ab8ff'); });
    const ghM = new THREE.MeshBasicMaterial({ map: ghT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(2.0, 2.2, 2.6), side: THREE.DoubleSide });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), ghM); ghost.position.copy(G).setY(1.02); g.add(ghost);
    // the booth with the lamp and the actor, open only on the side that faces the glass (mirror of the ghost across the pane)
    const S = G.clone().addScaledVector(n, -2 * G.clone().sub(P0).dot(n)), booth = new THREE.Group(); booth.position.copy(S).addScaledVector(n, 0.25).setY(0); booth.rotation.y = -PI / 4; g.add(booth);
    const blk = K.std(0x0a0a0c, { roughness: 0.95 }), gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 }); booth.add(c.slab(0.9, 1.9, 0.05, blk, 0, 0.95, 0.45)); booth.add(c.slab(0.05, 1.9, 0.9, blk, -0.45, 0.95, 0)); booth.add(c.slab(0.05, 1.9, 0.9, blk, 0.45, 0.95, 0)); booth.add(c.slab(0.95, 0.05, 0.95, blk, 0, 1.9, 0));
    [[-0.47, 0.47], [0.47, 0.47], [-0.47, -0.45], [0.47, -0.45]].forEach(([x, z]) => booth.add(c.slab(0.04, 1.92, 0.04, gold, x, 0.96, z))); booth.add(c.slab(0.98, 0.04, 0.98, gold, 0, 1.93, 0));
    const actor = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), new THREE.MeshBasicMaterial({ map: ghT, transparent: true, depthWrite: false, toneMapped: false })); actor.position.set(0, 0.95, -0.2); actor.scale.setScalar(0.85); booth.add(actor);
    [[0, 0.48, 0], [0.48, 0, PI / 2], [-0.48, 0, -PI / 2]].forEach(([x, z, ry]) => { const bl = c.sign('PEPPER\'S LAMP\nDO NOT OPEN', { w: 0.7, h: 0.32, bg: '#0a0a0c', fg: '#f5c542', font: c.MONO, weight: 700, border: '#f5c542' }); bl.position.set(x, 1.55, z); bl.rotation.y = ry; booth.add(bl); });
    c.post(X(booth.position.x), booth.position.z, 0.6);
    c.clickable(glass, () => { c.sound.chords(5); c.egg('loft_ghost', 'A sheet of glass, a lamp in a black box, and a man who will not leave. That is Pepper\'s ghost, the oldest trick in the theatre, and it still works on everyone in SoHo. MLow says ditto.'); }, 'The glass');
    // the loft itself: timber joists and beams under the ceiling, a skylight with moonlight coming down through it
    const wood = c.surf('planks', 2, 0x4a3420);
    [2.5, 7.5, 12.5, 17.5].forEach((x) => g.add(c.slab(0.34, 0.42, 16, wood, x, 5.78, 0)));
    const NJ = 26, jm = new THREE.InstancedMesh(new THREE.BoxGeometry(20, 0.18, 0.09), K.std(0x3a2818, { roughness: 0.85 }), NJ), m4 = new THREE.Matrix4();
    for (let k = 0; k < NJ; k++) { m4.makeTranslation(10, 5.5, -7.6 + k * 0.6); jm.setMatrixAt(k, m4); } g.add(jm);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), lit(c, 0x6a88c8, 0.9)); sky.rotation.x = PI / 2; sky.position.set(10, 5.4, -4.2); g.add(sky);
    for (let k = 0; k < 4; k++) g.add(c.slab(0.06, 0.06, 2.2, frame, 8.2 + k * 1.2, 5.38, -4.2)); g.add(c.slab(3.6, 0.06, 0.06, frame, 10, 5.38, -4.2));
    [[9.2, 0.06], [10.4, 0], [11.4, -0.06]].forEach(([x, rz]) => shaft(c, g, x, 5.35, -4.2, 1.1, 5.4, 'rgba(150,190,255,.2)', { rx: 0.18, rz }));
    motes(c, g, r, 140, [8, 0.3, -5.4, 12, 5.2, -2.6], { col: 0xc8dcff, size: 0.03, vy: -0.03 });
    // the three columns were flat grey slabs: cast iron now, painted dark green, with a base and a capital
    const ironM = K.std(0x1e3a2e, { metalness: 0.6, roughness: 0.45 });
    g.traverse((o) => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && Math.abs(o.position.z - 2.8) < 0.01 && Math.abs(o.position.y - K.H_IN / 2) < 0.01 && o.geometry.parameters.width === 0.36) o.material = ironM; });
    [5, 10, 15].forEach((x) => { g.add(c.slab(0.62, 0.32, 0.62, ironM, x, 0.16, 2.8)); g.add(c.slab(0.7, 0.24, 0.7, ironM, x, 5.68, 2.8)); g.add(c.slab(0.5, 0.12, 0.5, ironM, x, 5.5, 2.8)); });
    // fairy lights draped column to column, and candles on the coffee table
    const NB = 40, bm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 5), lit(c, 0xffd8a0, 2.2), NB);
    for (let k = 0; k < NB; k++) { const uu = (k % 20) / 19, x = (k < 20 ? 5 : 10) + uu * 5, y = 4.6 - Math.sin(uu * PI) * 0.8; m4.makeTranslation(x, y, 2.8); bm.setMatrixAt(k, m4); } g.add(bm);
    const flames = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * PI, x = 12.4 + Math.cos(a) * 0.32, z = 1.6 + Math.sin(a) * 0.32, hh = 0.08 + (k % 3) * 0.04;
      const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, hh, 10), K.std(0xf4ead2, { roughness: 0.6 })); cd.position.set(x, 0.4 + hh / 2, z); g.add(cd); flames.push(glow(c, K, g, x, 0.44 + hh, z, 0.22, 'rgba(255,180,80,.9)')); }
    // the kiln, glowing at the door, and clay all over a drop cloth under the wheel
    const kiln = new THREE.Group(); kiln.position.set(5.6, 0, -6.8); g.add(kiln); kiln.add(c.slab(1.1, 1.3, 0.9, K.std(0x8a8a86, { metalness: 0.5, roughness: 0.4 }), 0, 0.65, 0));
    const kd = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.06), lit(c, 0xff6a1a, 2.5)); kd.position.set(0, 0.8, 0.46); kiln.add(kd); const kg = glow(c, K, g, 5.6, 0.8, -6.3, 1.1, 'rgba(255,110,30,.6)'); c.post(X(5.6), -6.8, 0.6);
    const kl = c.sign('KILN  ·  2300°F  ·  MLow', { w: 1.0, h: 0.16, bg: '#111', fg: '#ff9a40', font: c.MONO, weight: 700 }); kl.position.set(0, 1.2, 0.46); kiln.add(kl);
    floorArt(c, K, g, 2.6, 2.4, 8, -2.4, (q, w, h) => { q.fillStyle = 'rgba(214,204,186,.92)'; q.fillRect(6, 6, w - 12, h - 12); q.strokeStyle = 'rgba(120,100,80,.5)'; q.lineWidth = 3; for (let k = 0; k < 6; k++) { q.beginPath(); q.moveTo(0, Math.random() * h); q.bezierCurveTo(w * 0.3, Math.random() * h, w * 0.6, Math.random() * h, w, Math.random() * h); q.stroke(); }
      for (let k = 0; k < 70; k++) { q.fillStyle = `rgba(${150 + Math.random() * 30 | 0},${80 + Math.random() * 20 | 0},40,${0.4 + Math.random() * 0.5})`; q.beginPath(); q.arc(w / 2 + (Math.random() - 0.5) * w * 0.8, h / 2 + (Math.random() - 0.5) * h * 0.8, 2 + Math.random() * 10, 0, 7); q.fill(); } }, 512, 0.012);
    const cam = new THREE.Vector3(), dn = new THREE.Vector3(), s1 = new THREE.Vector3(), s2 = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      cam.set(P.x - r.x0, P.y, P.z); dn.copy(G).sub(cam); const den = dn.dot(n); let vis = 0;
      if (Math.abs(den) > 1e-4) { const tt = s1.copy(P0).sub(cam).dot(n) / den; if (tt > 0 && tt < 1) { s1.copy(cam).addScaledVector(dn, tt); const Iy = s1.y; s2.copy(s1).sub(P0); const lat = s2.dot(tg); if (Math.abs(lat) < HW && Iy > 0.1 && Iy < 2.6) { const co = Math.abs(s2.copy(cam).sub(s1).normalize().dot(n)); vis = 0.55 + 0.45 * (1 - co); } } }
      const lamp = 0.65 + 0.35 * Math.sin(t * 0.5);
      ghM.opacity += (vis * lamp - ghM.opacity) * Math.min(1, dt * 6); ghost.rotation.y = Math.atan2(cam.x - G.x, cam.z - G.z); ghost.position.y = 1.02 + Math.sin(t * 0.8) * 0.03;
      const f = 0.85 + Math.random() * 0.3; flames.forEach((s, k) => { s.scale.setScalar(0.2 * (k % 2 ? f : 2 - f)); }); kg.material.opacity = 0.75 + Math.sin(t * 3) * 0.2;
    });
    r.post = { ...(r.post || {}), bloom: 1.0, vig: 0.5 };
  },
});

Object.assign(ROOM, {
  // ---------------- Wall Street: the floor ----------------
  wallst(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: a Necker cube in green neon, turning over the floor. Twelve equal edges, no faces, nothing in front of
    // anything: your eye cannot tell which face is near, so the cube keeps reversing the way it spins. Bull, bear, bull.
    const cube = new THREE.Group(); cube.position.set(10, 3.7, -1.6); g.add(cube);
    const neonM = lit(c, 0x5aff7a, 2.2, { depthTest: false, depthWrite: false, transparent: true }), S = 0.9, e = 0.035;
    const edges = []; [-1, 1].forEach((a) => [-1, 1].forEach((b) => { edges.push([[0, a * S, b * S], [2 * S, e, e]], [[a * S, 0, b * S], [e, 2 * S, e]], [[a * S, b * S, 0], [e, e, 2 * S]]); }));
    edges.forEach(([p, s]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...s), neonM); m.position.set(...p); m.renderOrder = 10; cube.add(m); });
    cube.rotation.x = 0.42; const spin = new THREE.Group(); g.add(spin); spin.add(cube); cube.position.set(0, 0, 0); spin.position.set(10, 3.7, -1.6);
    const halo = glow(c, K, g, 10, 3.7, -1.6, 4.2, 'rgba(90,255,122,.16)');
    const cl = c.sign('WHICH WAY IS IT TURNING?  BULL OR BEAR?', { w: 4.4, h: 0.32, bg: '#03140a', fg: '#5aff7a', font: c.MONO, weight: 700, glow: 12, border: '#5aff7a' }); cl.position.set(10, 2.25, -1.6); g.add(cl); const cl2 = cl.clone(); cl2.rotation.y = PI; g.add(cl2);
    g.add(c.slab(0.012, 1.5, 0.012, K.std(0x222222), 10, 5.25, -1.6));
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(10, 3.7, -1.6); g.add(hit);
    c.clickable(hit, () => { c.sound.beep(880, 0.08, 0.2); c.egg('wallst_cube', 'It turns left. No, right. Twelve green lines and not one of them is in front of another, so your eye picks a direction and then changes its mind, like every trader on this floor. MLow bought both ways.'); }, 'The cube');
    // the ceiling: an office drop ceiling, acoustic tiles in a grid, fluorescent troffers that hum
    const tiles = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#d8d6cc'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(80,80,70,.35)'; for (let k = 0; k < 900; k++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2); q.fillStyle = '#9a9a92'; q.fillRect(0, 0, w, 6); q.fillRect(0, 0, 6, h); });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(16.6, 13.3);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.9, color: 0x8a948e })); ceil.rotation.x = PI / 2; ceil.position.set(10, 5.95, 0); g.add(ceil);
    const NT = 12, tro = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.2, 0.6), lit(c, 0xe8fff0, 1.25), NT), m4 = new THREE.Matrix4(), qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
    for (let k = 0; k < NT; k++) { m4.compose(pv.set(2.4 + (k % 4) * 5.0, 5.93, -5.4 + (k / 4 | 0) * 4.6), qx, one); tro.setMatrixAt(k, m4); } g.add(tro);
    // the desks were flat brown slabs: walnut laminate now, with a brass edge
    const lam = c.canvasTex(512, 128, (q, w, h) => { q.fillStyle = '#3a2214'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { q.fillStyle = `rgba(${90 + Math.random() * 40 | 0},${50 + Math.random() * 20 | 0},20,${0.25 + Math.random() * 0.3})`; q.fillRect(0, y, w, 1 + Math.random() * 2); } q.globalAlpha = 0.5; for (let k = 0; k < 12; k++) { q.strokeStyle = 'rgba(20,10,4,.6)'; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 6 + Math.random() * 10, 0, 0, 7); q.stroke(); } });
    lam.wrapS = lam.wrapT = THREE.RepeatWrapping; const deskM = new THREE.MeshStandardMaterial({ map: lam, roughness: 0.28, metalness: 0.05, color: 0x9a8070 }), brass = K.std(0xc9a033, { metalness: 1, roughness: 0.3 });
    g.traverse((o) => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 4.2 && Math.abs(o.geometry.parameters.height - 0.76) < 0.001) o.material = deskM; });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = 4 + i * 6, z = -4.6 + j * 3.4; g.add(c.slab(4.24, 0.03, 1.24, brass, x, 0.775, z)); }
    // green CRT glow off every monitor, smoke from the ashtrays, haze along the ceiling
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) [-1.2, 0, 1.2].forEach((dx) => glow(c, K, g, 4 + i * 6 + dx, 1.02, -4.6 + j * 3.4 + 0.12, 0.7, 'rgba(60,255,110,.28)'));
    [[4, -4.6], [16, -1.2], [10, 2.2]].forEach(([x, z]) => K.steam(g, x + 0.9, 0.85, z + 0.2));
    [[5, 0.1], [10, 0], [15, -0.1]].forEach(([x, rz]) => shaft(c, g, x, 5.9, -2, 4, 2.2, 'rgba(160,200,190,.1)', { rx: PI / 2 - 0.15, rz }));
    motes(c, g, r, 120, [1, 1, -7, 19, 5.5, 7], { col: 0xd0ffe0, size: 0.03, vy: 0.02 });
    // the big board hung from the ceiling, both faces, the index everyone came for
    const idx = c.canvasTex(1024, 192, (q, w, h) => { q.fillStyle = '#020a04'; q.fillRect(0, 0, w, h); q.font = `700 64px ${c.MONO}`; q.fillStyle = '#ffb020'; q.fillText('N3W INDUSTRIAL AVERAGE', 30, 80); q.fillStyle = '#5aff7a'; q.font = `700 84px ${c.MONO}`; q.fillText('7542.11  UP 317', 30, 170); q.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < h; y += 4) q.fillRect(0, y, w, 1); });
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.98), new THREE.MeshBasicMaterial({ map: idx, toneMapped: false, side: THREE.DoubleSide })); bd.position.set(10, 5.2, -7.72); g.add(bd); g.add(c.slab(5.4, 1.1, 0.06, K.std(0x111111), 10, 5.2, -7.78));
    // ticker tape and order slips all over the carpet
    const NP = c.MOBILE ? 160 : 340, slip = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.08), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), NP), col = new THREE.Color(), eu = new THREE.Euler(), qq = new THREE.Quaternion();
    for (let k = 0; k < NP; k++) { eu.set(-PI / 2 + (Math.random() - 0.5) * 0.3, 0, Math.random() * 6.3); qq.setFromEuler(eu); m4.compose(pv.set(1 + Math.random() * 18, 0.012, -6.4 + Math.random() * 13.6), qq, one); slip.setMatrixAt(k, m4); slip.setColorAt(k, col.set([0xf4f0e0, 0xffe680, 0xffc0d0, 0xc8f0ff][k % 4])); }
    g.add(slip);
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; spin.rotation.y = t * 0.55; halo.material.opacity = 0.8 + Math.sin(t * 7) * 0.08; });
    r.post = { ...(r.post || {}), bloom: 0.95, vig: 0.5 };
  },

  // ---------------- Home Alone 2: the pigeons ----------------
  pigeons(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: a Beuchet bird. From the painted feet by the south wall, a pigeon perches on the rim of the birdbath in front of you.
    // Walk off the feet and it is standing on the ground ten metres away, beside the pigeon lady, and it is taller than she is.
    const E = new THREE.Vector3(14.5, 1.62, 6.9), N = new THREE.Vector3(14.1, 1.40, 5.4), k = E.y / (E.y - N.y), F = E.clone().add(N.clone().sub(E).multiplyScalar(k));
    const stone = c.surf('concrete', 1, 0xc8c4bc);
    const bath = new THREE.Group(); bath.position.set(N.x, 0, N.z); g.add(bath);
    bath.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.26, 16), stone)); bath.children[0].position.y = 0.63;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.12, 24), stone); bowl.position.y = N.y - 0.06; bath.add(bowl);
    const ice = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), new THREE.MeshStandardMaterial({ color: 0xdff0ff, roughness: 0.05, metalness: 0.4 })); ice.rotation.x = -PI / 2; ice.position.y = N.y - 0.005; bath.add(ice);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.03, 8, 24), K.std(0xf8f8ff, { roughness: 0.9 })); cap.rotation.x = PI / 2; cap.position.y = N.y; bath.add(cap);
    c.post(X(N.x), N.z, 0.3);
    g.traverse((o) => { if (o.isPoints && !o.material.map && o.material.size === 0.05) { o.material.map = K.glowTex('rgba(255,255,255,.9)'); o.material.size = 0.09; o.material.needsUpdate = true; }
      if (o.isInstancedMesh && o.material.color && o.material.color.getHex() === 0x6a7080) { o.material.map = c.canvasTex(128, 64, (q, w, h) => { q.fillStyle = '#8a909e'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a4e5a'; [0.3, 0.42, 0.58, 0.7].forEach((u) => q.fillRect(w * u, h * 0.45, w * 0.05, h * 0.3)); q.fillStyle = '#c8ccd4'; q.fillRect(0, h * 0.75, w, h * 0.25); }); o.material.color.set(0xffffff); o.material.needsUpdate = true; }
      if (o.isInstancedMesh && o.material.color && o.material.color.getHex() === 0x4a6a5a) { o.material.metalness = 0.6; o.material.roughness = 0.35; o.material.emissive = new THREE.Color(0x0a2a1a); o.material.color.set(0x3a7a5a); } });
    const giant = c.glb('pigeon', { h: 0.3 * k, x: F.x, z: F.z, ry: 0.5, parent: g, shadow: false }); c.post(X(F.x), F.z, 0.35 * k / 2);
    const feet = floorArt(c, K, g, 1.2, 1.2, E.x, E.z, (q, w, h) => { q.fillStyle = 'rgba(80,120,170,.9)'; [[-0.12, 0.05], [0.12, -0.02]].forEach(([u, v]) => { q.beginPath(); q.ellipse(w * (0.5 + u), h * (0.5 + v), w * 0.07, h * 0.16, 0, 0, 7); q.fill(); });
      q.fillStyle = '#1d3a5a'; q.font = `800 ${h * 0.075}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND HERE. FEED THE BIRD.', w / 2, h * 0.12); q.fillText('MLow', w / 2, h * 0.94); q.strokeStyle = 'rgba(80,120,170,.8)'; q.lineWidth = 6; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, 7); q.stroke(); }, 256, 0.02);
    const eg = () => { c.sound.pop(); c.egg('pigeons_giant', 'From the painted feet it is a pigeon on a birdbath. From anywhere else it is a pigeon the size of a doorman, standing next to the pigeon lady, waiting for a very big crumb. Same bird. MLow counted it twice by mistake.'); };
    c.clickable(bath, eg, 'The birdbath'); c.clickable(feet, eg, 'The painted feet'); c.clickable(giant, eg, 'A pigeon');
    // snow lying everywhere: drifts against the walls, snow on the ground with tracks of people and birds in it
    floorArt(c, K, g, 20, 16, 10, 0, (q, w, h) => { const s = w / 20;
      for (let k2 = 0; k2 < 140; k2++) { const x = Math.random() * w, y = Math.random() * h, rr = 20 + Math.random() * 90, gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      q.fillStyle = 'rgba(120,130,150,.35)'; for (let tr = 0; tr < 4; tr++) { let x = (2 + tr * 4.5) * s, y = h; const dx = (Math.random() - 0.5) * 2; for (let st = 0; st < 30; st++) { q.beginPath(); q.ellipse(x + (st % 2 ? 6 : -6), y, 5, 9, 0, 0, 7); q.fill(); y -= 22; x += dx * 4; } }
      q.strokeStyle = 'rgba(100,110,130,.45)'; q.lineWidth = 1.5; for (let k2 = 0; k2 < 160; k2++) { const x = (6 + Math.random() * 8) * s, y = (2 + Math.random() * 6) * s; [-0.5, 0, 0.5].forEach((a) => { q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.sin(a) * 6, y - Math.cos(a) * 6); q.stroke(); }); } }, 1024, 0.011);
    const drift = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.85 }), ND = 16, dm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 8, 0, PI * 2, 0, PI / 2), drift, ND), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    for (let i = 0; i < ND; i++) { const side = i % 2, z = -7 + (i >> 1) * 1.0; sv.set(0.6 + Math.random() * 0.5, 0.25 + Math.random() * 0.2, 0.8 + Math.random() * 0.4); m4.compose(pv.set(side ? 19.6 : 0.4, 0, z), qq, sv); dm.setMatrixAt(i, m4); } g.add(dm);
    // two little trees wrapped in Christmas lights by the rope, and the lamps lit, with snow glittering in their cones
    const NB = c.MOBILE ? 90 : 160, lb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 5), lit(c, 0xffffff, 1.0), NB), cc = new THREE.Color(), lights = [];
    [[3.4, -7.0], [16.6, -7.0]].forEach(([x, z], j) => { const trunk = c.slab(0.14, 1.2, 0.14, K.std(0x3a2a1a), x, 0.6, z); g.add(trunk); c.post(X(x), z, 0.35);
      for (let i = 0; i < 6; i++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 1.3, 5), K.std(0x2a1e14)); br.position.set(x + Math.cos(i * 1.1) * 0.3, 1.6 + i * 0.25, z + Math.sin(i * 1.1) * 0.3); br.rotation.set(Math.sin(i * 1.1) * 0.7, 0, -Math.cos(i * 1.1) * 0.7); g.add(br); }
      for (let i = 0; i < NB / 2; i++) { const u = i / (NB / 2), a = u * 26, rad = 0.9 * (1 - u) + 0.1; m4.makeTranslation(x + Math.cos(a) * rad, 0.9 + u * 2.6, z + Math.sin(a) * rad); lb.setMatrixAt(j * NB / 2 + i, m4); lb.setColorAt(j * NB / 2 + i, cc.set([0xff3030, 0x30ff60, 0xffd040, 0x40a0ff][i % 4]).multiplyScalar(2)); } });
    g.add(lb);
    [2.2, 17.8].forEach((x) => { glow(c, K, g, x, 4.25, -5.6, 1.6, 'rgba(255,220,150,.6)'); cone(c, g, x, 4.2, -5.6, 0.15, 1.8, 4.2, 'rgba(255,225,170,.14)'); motes(c, g, r, 50, [x - 1.5, 0.2, -7.1, x + 1.5, 4.2, -4.1], { col: 0xfff4d8, size: 0.04, vy: -0.4, sway: 0.25 }); });
    // cocoa steam off the cart, a scatter of seed round the lady, low mist over the snow
    K.steam(g, 18.2, 1.2, -0.8);
    const NS = c.MOBILE ? 120 : 260, seed = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 4, 3), K.std(0xc8a060), NS);
    for (let i = 0; i < NS; i++) { const a = Math.random() * 6.3, rr = 0.5 + Math.random() * 2.2; m4.makeTranslation(10 + Math.cos(a) * rr, 0.01, -4.2 + Math.sin(a) * rr * 0.7); seed.setMatrixAt(i, m4); } g.add(seed);
    [[-4, 0], [0, 1]].forEach(([z, k2]) => shaft(c, g, 10, 1.0, z, 20, 1.0, 'rgba(220,230,255,.13)', { band: true }));
    // a sign on the gate side: the lady's hours
    const hs = c.sign('THE PIGEON LADY  ·  FEEDING AT DUSK  ·  COUNTED DAILY', { w: 5.6, h: 0.42, bg: '#0e1a2a', fg: '#f4ead2', font: c.MONO, weight: 700, border: '#9ab8d8' }); hs.position.set(10, 0.6, 7.86); hs.rotation.y = PI; g.add(hs);
    r.post = { ...(r.post || {}), bloom: 0.9, vig: 0.4 };
  },

  // ---------------- Elf: the rink ----------------
  rink(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: a dolly zoom on the ice. Skate toward the tree and the lens opens as you go: the tree holds its size
    // and the whole plaza stretches away behind it, the Vertigo shot, done on skates.
    const base = c.MOBILE ? 72 : 66;
    const T0 = Math.tan(base * PI / 360);
    r.fov = (P) => { const d = Math.hypot(P.x - X(10), P.z + 6.8); if (d >= 12.2 || Math.abs(P.x - X(10)) > 7) return base; const f = Math.min(104, 2 * Math.atan(T0 * 9 / Math.max(0.1, d - 3.2)) * 180 / PI); return d > 6 ? f : base + (f - base) * Math.max(0, (d - 3.5) / 2.5); };
    const sg = c.sign('SKATE TO THE TREE. KEEP YOUR EYES ON THE STAR.', { w: 5.2, h: 0.36, bg: '#0a1028', fg: '#ffe080', font: c.MONO, weight: 700, border: '#ffe080' }); sg.position.set(10, 4.2, 7.86); sg.rotation.y = PI; g.add(sg);
    let fired = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || fired) return; if (Math.hypot(P.x - X(10), P.z + 6.8) < 6) { fired = true; c.egg('rink_vertigo', 'You skated in and the tree never got any bigger. The lens opened as you came, so the plaza ran away behind it. That is the Vertigo shot, on ice, and MLow did it in one take in rented skates.'); } });
    // skate scratches all over the ice, curling round the rink
    floorArt(c, K, g, 20, 16, 10, 0, (q, w, h) => { q.lineCap = 'round'; for (let k = 0; k < 90; k++) { const cx = w / 2 + (Math.random() - 0.5) * w * 0.3, cy = h * 0.55, R = w * (0.15 + Math.random() * 0.38), a0 = Math.random() * 6.3, a1 = a0 + 0.3 + Math.random() * 1.6;
      q.strokeStyle = `rgba(240,248,255,${0.12 + Math.random() * 0.25})`; q.lineWidth = 1 + Math.random() * 2; q.beginPath(); q.ellipse(cx, cy, R, R * 0.75, 0, a0, a1); q.stroke(); }
      for (let k = 0; k < 12; k++) { const x = Math.random() * w, y = Math.random() * h, gr = q.createRadialGradient(x, y, 0, x, y, 40); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(x - 40, y - 40, 80, 80); } }, 1024, 0.015);
    // a canopy of lights from the top of the tree out to the walls
    const NS = 14, PER = c.MOBILE ? 14 : 22, can = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 5), lit(c, 0xffffff, 1.0), NS * PER), m4 = new THREE.Matrix4(), cc = new THREE.Color(), top = new THREE.Vector3(10, 8.2, -6.8);
    for (let s = 0; s < NS; s++) { const a = PI * (0.08 + 0.84 * s / (NS - 1)), end = new THREE.Vector3(10 - Math.cos(a) * 10.6, 5.6, -6.8 + Math.sin(a) * 15);
      if (end.x < 0.3) end.x = 0.3; if (end.x > 19.7) end.x = 19.7; if (end.z > 7.7) end.z = 7.7;
      for (let i = 0; i < PER; i++) { const u = (i + 1) / (PER + 1), p = top.clone().lerp(end, u); p.y -= Math.sin(u * PI) * 0.9; m4.makeTranslation(p.x, p.y, p.z); can.setMatrixAt(s * PER + i, m4); can.setColorAt(s * PER + i, cc.set([0xffd890, 0xff5050, 0x60ff90, 0x80c0ff][(s + i) % 4]).multiplyScalar(2.2)); } }
    g.add(can);
    // the tree glows, and the star throws a halo
    glow(c, K, g, 10, 4.2, -6.4, 7, 'rgba(255,200,120,.22)'); const sh = glow(c, K, g, 10, 8.6, -6.8, 2.6, 'rgba(255,230,140,.7)');
    // wire angels with trumpets, glowing white, the plaza's own, both sides of the ice
    const angT = c.canvasTex(256, 384, (q, w, h) => { q.strokeStyle = '#fff8e0'; q.lineWidth = 5; q.shadowColor = '#ffe8a0'; q.shadowBlur = 14; q.lineCap = 'round';
      q.beginPath(); q.ellipse(w / 2, h * 0.18, 26, 30, 0, 0, 7); q.stroke(); q.beginPath(); q.moveTo(w / 2 - 30, h * 0.27); q.lineTo(w / 2 - 70, h * 0.95); q.lineTo(w / 2 + 70, h * 0.95); q.lineTo(w / 2 + 30, h * 0.27); q.stroke();
      [-1, 1].forEach((s) => { q.beginPath(); q.moveTo(w / 2 + s * 30, h * 0.3); q.bezierCurveTo(w / 2 + s * 140, h * 0.05, w / 2 + s * 120, h * 0.5, w / 2 + s * 40, h * 0.55); q.stroke(); for (let k = 1; k < 4; k++) { q.beginPath(); q.moveTo(w / 2 + s * 34, h * (0.3 + k * 0.06)); q.lineTo(w / 2 + s * (60 + k * 18), h * (0.18 + k * 0.08)); q.stroke(); } });
      q.beginPath(); q.moveTo(w / 2 + 10, h * 0.2); q.lineTo(w / 2 + 110, h * 0.02); q.stroke(); q.beginPath(); q.arc(w / 2 + 112, h * 0.02 + 6, 12, 0, 7); q.stroke(); });
    [[1.6, 3.8, 0.5], [18.4, 3.8, -0.5], [1.6, -4.0, 0.5], [18.4, -4.0, -0.5]].forEach(([x, z, ry]) => { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.1), new THREE.MeshBasicMaterial({ map: angT, transparent: true, toneMapped: false, color: new THREE.Color(1.4, 1.35, 1.2), side: THREE.DoubleSide, depthWrite: false })); a.position.set(x, 3.3, z); a.rotation.y = ry + (x < 10 ? PI / 2 : -PI / 2); g.add(a); });
    // giant ornaments by the rope, and snow coming down through the lights
    [[3.4, -7.0, 0.7, 0xc8102e], [5.4, -7.3, 0.5, 0xf5c542], [16.8, -7.3, 0.55, 0x1d4ed8]].forEach(([x, z, R, col]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 20), K.std(col, { metalness: 0.9, roughness: 0.15 })); b.position.set(x, R, z); g.add(b); const band = new THREE.Mesh(new THREE.TorusGeometry(R * 1.0, R * 0.06, 8, 32), lit(c, 0xffe080, 1.5)); band.rotation.x = PI / 2; band.position.set(x, R, z); g.add(band); c.post(X(x), z, R); });
    motes(c, g, r, 420, [0.5, 0.1, -7.5, 19.5, 9, 7.5], { col: 0xffffff, size: 0.05, vy: -0.5, sway: 0.3, op: 0.9 });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; sh.material.opacity = 0.8 + Math.sin(t * 3) * 0.2; });
    r.post = { ...(r.post || {}), bloom: 1.1, vig: 0.5 };
  },

  // ---------------- Moonstruck: the moon over the Heights ----------------
  moon(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: an Ames window turning on a post in the street. A trapezoid painted as a window seen at an angle:
    // it spins all the way round, and you will swear it only rocks back and forth, the long side always toward you.
    const amesT = c.canvasTex(512, 384, (q, w, h) => { const L = h, R2 = h * 0.5, top = (x) => (h - (L + (R2 - L) * x / w)) / 2, bot = (x) => h - top(x);
      q.beginPath(); q.moveTo(0, top(0)); q.lineTo(w, top(w)); q.lineTo(w, bot(w)); q.lineTo(0, bot(0)); q.closePath(); q.fillStyle = '#f4ead2'; q.fill();
      const cols = [0, 0.3, 0.52, 0.7, 0.84, 0.95, 1.02].map((u) => u / 1.02 * w), rows = [0, 0.33, 0.66, 1];
      for (let i = 0; i < cols.length - 1; i++) for (let j = 0; j < 3; j++) { const x0 = cols[i] + 10 * (1 - i / 6), x1 = cols[i + 1] - 8 * (1 - i / 6), y = (x, v) => top(x) + (bot(x) - top(x)) * v, m = 0.05;
        q.beginPath(); q.moveTo(x0, y(x0, rows[j] + m)); q.lineTo(x1, y(x1, rows[j] + m)); q.lineTo(x1, y(x1, rows[j + 1] - m)); q.lineTo(x0, y(x0, rows[j + 1] - m)); q.closePath();
        const gr = q.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#22406e'); q.fillStyle = gr; q.fill();
        q.fillStyle = 'rgba(255,240,200,.25)'; q.beginPath(); q.moveTo(x0, y(x0, rows[j] + m)); q.lineTo((x0 + x1) / 2, y((x0 + x1) / 2, rows[j] + m)); q.lineTo(x0, y(x0, rows[j + 1] - m)); q.closePath(); q.fill(); }
      q.strokeStyle = '#7a6a50'; q.lineWidth = 3; q.beginPath(); q.moveTo(0, top(0)); q.lineTo(w, top(w)); q.lineTo(w, bot(w)); q.lineTo(0, bot(0)); q.closePath(); q.stroke(); });
    const ames = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), new THREE.MeshStandardMaterial({ map: amesT, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, emissive: 0xffffff, emissiveMap: amesT, emissiveIntensity: 0.45 }));
    const pivot = new THREE.Group(); pivot.position.set(10, 2.95, -3.2); g.add(pivot); pivot.add(ames);
    g.add(c.slab(0.05, 2.6, 0.05, K.std(0x1a1a1a, { metalness: 0.7 }), 10, 1.3, -3.2)); g.add(c.slab(0.5, 0.06, 0.5, K.std(0x1a1a1a, { metalness: 0.7 }), 10, 0.03, -3.2)); c.post(X(10), -3.2, 0.3);
    const al = c.sign('AMES WINDOW  ·  IT IS TURNING ALL THE WAY ROUND', { w: 2.6, h: 0.2, bg: '#0a0e1a', fg: '#ffe8b0', font: c.MONO, weight: 700 }); al.position.set(10, 0.9, -3.15); g.add(al); const al2 = al.clone(); al2.rotation.y = PI; al2.position.z = -3.25; g.add(al2);
    c.clickable(ames, () => { c.sound.chords(6); c.egg('moon_window', 'It turns all the way round, every time, and your eye refuses to believe it: it keeps the long side near and swears the window only rocks. Loretta knows the feeling. MLow sells these at the bakery, two for a dollar.'); }, 'The window');
    // the moon throws a long streak down the wet street toward you, and clouds cross it
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 15), new THREE.MeshBasicMaterial({ map: shaftTex(c, 'rgba(255,236,190,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    streak.rotation.x = -PI / 2; streak.rotation.z = PI; streak.position.set(10, 0.02, 0); g.add(streak);
    const cloudT = c.canvasTex(256, 128, (q, w, h) => { for (let k = 0; k < 18; k++) { const x = 30 + Math.random() * 196, y = 40 + Math.random() * 50, rr = 20 + Math.random() * 30, gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(60,70,95,.5)'); gr.addColorStop(1, 'rgba(60,70,95,0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); } });
    const clouds = [0, 1, 2].map((k) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false })); s.scale.set(30, 12, 1); s.position.set(0, 16 + k * 6, -42); g.add(s); return s; });
    for (let k = 0; k < 30; k++) glow(c, K, g, Math.random() * 20, 11 + Math.random() * 10, -7 + Math.random() * 10, 0.2 + Math.random() * 0.2, 'rgba(255,248,230,.9)');
    // the opera kiosk: a column with tonight's bill, lit from inside
    const kio = new THREE.Group(); kio.position.set(4.6, 0, -2.8); g.add(kio); c.post(X(4.6), -2.8, 0.6);
    const billT = c.canvasTex(1024, 512, (q, w, h) => { q.fillStyle = '#1a0e14'; q.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = i * w / 3; q.fillStyle = ['#c8102e', '#f4ead2', '#1d4ed8'][i]; q.fillRect(x + 10, 20, w / 3 - 20, h - 40); q.fillStyle = i === 1 ? '#111' : '#f4ead2'; q.font = `900 64px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(['LA', 'N3W', 'TONIGHT'][i], x + w / 6, 140); q.font = `900 ${i === 2 ? 50 : 72}px ${c.SERIF}`; q.fillText(['BOHEME', 'OPERA', 'SOLD OUT'][i], x + w / 6, 240); K.eyeFlower(q, x + w / 6, 360, 70); q.font = `700 28px ${c.MONO}`; q.fillText('BY MLow', x + w / 6, 470); } });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.2, 32, 1, true), new THREE.MeshStandardMaterial({ map: billT, emissive: 0xffffff, emissiveMap: billT, emissiveIntensity: 0.55, roughness: 0.7 })); col.position.y = 1.4; kio.add(col);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 10, 0, PI * 2, 0, PI / 2), K.std(0x1e3a2e, { metalness: 0.6, roughness: 0.4 })); dome.position.y = 2.5; kio.add(dome); kio.add(c.slab(1.2, 0.3, 1.2, K.std(0x1e3a2e, { metalness: 0.6 }), 0, 0.15, 0));
    // lamp halos, lanterns by the stoops, a warm glow in the bakery door, and moonlit mist on the street
    [3.8, 16.2].forEach((x) => { glow(c, K, g, x, 4.25, 3.2, 1.6, 'rgba(255,214,150,.6)'); cone(c, g, x, 4.2, 3.2, 0.12, 1.6, 4.2, 'rgba(255,214,150,.12)'); });
    [[1.0, -4.6], [1.0, -0.4], [19.0, -4.6], [19.0, -0.4]].forEach(([x, z]) => { g.add(c.slab(0.16, 0.28, 0.16, lit(c, 0xffc070, 1.6), x, 1.6, z)); glow(c, K, g, x, 1.6, z, 0.9, 'rgba(255,190,110,.6)'); });
    glow(c, K, g, 16.4, 1.2, -6.4, 2.4, 'rgba(255,190,120,.35)');
    [[-3, 0.04], [0.5, -0.04]].forEach(([z, rz]) => shaft(c, g, 10, 1.0, z, 20, 1.0, 'rgba(200,210,255,.1)', { rz, band: true }));
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; pivot.rotation.y = t * 0.6; clouds.forEach((s, k) => { s.position.x = ((t * (0.6 + k * 0.25) + k * 17) % 60) - 20; }); });
    r.post = { ...(r.post || {}), bloom: 1.0, vig: 0.5 };
  },
});

Object.assign(ROOM, {
  // ---------------- The Taking of Pelham One Two Three: the car ----------------
  pelham(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: an infinity tunnel either side of the car. Each tunnel mouth is eighty centimetres deep and holds sixteen
    // arches, every one a little smaller and further back than perspective would make it, so the tunnel runs on forever,
    // signals and all, and the arches slide against each other as you walk past.
    const archT = c.canvasTex(256, 256, (q, w, h) => { q.strokeStyle = '#fff'; q.lineWidth = 7; q.beginPath(); q.moveTo(20, h - 6); q.lineTo(20, h * 0.42); q.arc(w / 2, h * 0.42, w / 2 - 20, PI, 0); q.lineTo(w - 20, h - 6); q.stroke();
      q.lineWidth = 3; q.beginPath(); q.moveTo(20, h - 40); q.lineTo(w - 20, h - 40); q.stroke(); q.fillStyle = '#fff'; [[34, h * 0.55], [w - 34, h * 0.55]].forEach(([x, y]) => { q.beginPath(); q.arc(x, y, 7, 0, 7); q.fill(); }); });
    const tunnels = [];
    [6.25, 13.75].forEach((cx, side) => {
      const mouth = new THREE.Group(); mouth.position.set(cx, 0, -7.74); g.add(mouth); tunnels.push(mouth);
      const brick = c.surf('brick', 1.2, 0x5a4a40), dark = K.std(0x050505, { roughness: 1 });
      mouth.add(c.slab(0.3, 3.6, 0.85, brick, -1.55, 1.8, 0.42)); mouth.add(c.slab(0.3, 3.6, 0.85, brick, 1.55, 1.8, 0.42)); mouth.add(c.slab(3.4, 0.5, 0.85, brick, 0, 3.85, 0.42));
      mouth.add(c.slab(2.8, 3.4, 0.02, dark, 0, 1.7, 0.01));
      for (let k = 0; k < 16; k++) { const s = Math.pow(0.8, k), col = new THREE.Color(k % 4 === 3 ? 0xff4030 : k % 4 === 1 ? 0x40ff80 : 0xffc870).multiplyScalar(1.8 * Math.pow(0.86, k));
        const a = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * s, 3.2 * s), new THREE.MeshBasicMaterial({ map: archT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: col }));
        a.position.set(0, 0.22 + 1.6 * s + (1 - s) * 0.9, 0.8 - k * 0.05); mouth.add(a); }
      const lab = c.sign(side ? 'UPTOWN  ·  FOREVER' : 'DOWNTOWN  ·  FOREVER', { w: 2.6, h: 0.32, bg: '#0b1020', fg: '#f4ead2', font: c.MONO, weight: 700, border: '#f5c542' }); lab.position.set(0, 3.85, 0.86); mouth.add(lab);
      const hit = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.4), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, 1.7, 0.85); mouth.add(hit);
      c.clickable(hit, () => { c.sound.boom(0.3); c.egg('pelham_tunnel', 'Eighty centimetres deep, and it runs to Pelham Bay and past it. The arches only get smaller, the signals only get dimmer, and the tunnel never ends. MLow rode it to the last stop once. There is no last stop.'); }, 'The tunnel');
      c.post(X(cx - 1.55), -7.3, 0.35); c.post(X(cx + 1.55), -7.3, 0.35);
    });
    // the car: a ribbed rubber floor, moulded seats, and ad cards along both sides over the windows
    const rib = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#4a4440'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { q.fillStyle = '#2e2a28'; q.fillRect(0, y, w, 3); q.fillStyle = '#5e5852'; q.fillRect(0, y + 3, w, 1); } grime(q, w, h, 10, 0.3); }); rib.wrapS = rib.wrapT = THREE.RepeatWrapping;
    const seatT = c.canvasTex(256, 64, (q, w, h) => { for (let k = 0; k < 4; k++) { const x = k * w / 4, gr = q.createLinearGradient(x, 0, x + w / 4, 0); gr.addColorStop(0, '#a8560e'); gr.addColorStop(0.15, '#f0a030'); gr.addColorStop(0.5, '#ffbe50'); gr.addColorStop(0.85, '#e08a20'); gr.addColorStop(1, '#8a4808'); q.fillStyle = gr; q.fillRect(x, 0, w / 4, h); } }); seatT.wrapS = seatT.wrapT = THREE.RepeatWrapping;
    const seatM = new THREE.MeshStandardMaterial({ map: seatT, roughness: 0.3 }), floorM = new THREE.MeshStandardMaterial({ map: rib, roughness: 0.85 });
    g.traverse((o) => { if (!o.isMesh || o.geometry.type !== 'BoxGeometry') return; const p = o.geometry.parameters; if (p.width === 3 && Math.abs(p.height - 0.08) < 1e-3 && o.position.y < 0.1) o.material = floorM; if (o.material.color && o.material.color.getHex() === 0xe08a20 && Math.abs(p.height - 0.42) < 1e-3) o.material = seatM; });
    const ads = c.canvasTex(c.MOBILE ? 1024 : 2048, c.MOBILE ? 64 : 128, (q, w0, h0) => { q.scale(w0 / 2048, h0 / 128); const w = 2048, h = 128; const A = [['GET COUNTED', '#f5c542', '#111'], ['MLOW CAB CO.', '#111', '#f5c542'], ['N3W BELL  CALL HOME', '#1d4ed8', '#fff'], ['NAZAR COLA', '#c8102e', '#fff'], ['DR. EYE  SKIN', '#f4ead2', '#1d4ed8'], ['TOKENS 35 CENTS', '#22d3ee', '#111'], ['EYE CRUNCH', '#ff4fa3', '#fff'], ['DEPT. OF THE COUNTED', '#0b1020', '#f4ead2']];
      A.forEach(([t, bg, fg], k) => { const x = k * w / 8; q.fillStyle = bg; q.fillRect(x + 4, 4, w / 8 - 8, h - 8); q.fillStyle = fg; q.font = `900 ${t.length > 14 ? 26 : 34}px ${c.FONT}`; q.textAlign = 'center'; q.fillText(t, x + w / 16, h * 0.62); K.eyeFlower(q, x + 26, 26, 16); }); });
    ads.wrapS = THREE.RepeatWrapping; ads.repeat.x = 1.7;
    [[8.56, PI / 2], [11.44, -PI / 2]].forEach(([x, ry]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 0.34), new THREE.MeshBasicMaterial({ map: ads, toneMapped: false, color: 0xd8d8d0 })); m.position.set(x, 2.38, -0.8); m.rotation.y = ry; g.add(m); });
    const route = c.sign('PELHAM 1 2 3', { w: 1.8, h: 0.34, bg: '#111', fg: '#ffb020', font: c.MONO, weight: 700, glow: 14 }); route.position.set(10, 2.95, 6.46); g.add(route); g.add(c.slab(3.2, 0.5, 0.06, K.std(0xb0b0a8, { metalness: 0.6 }), 10, 2.95, 6.42));
    // the platform: a cleaner's nightmare of a floor, and the edge stencilled
    floorArt(c, K, g, 8, 16, 4, 0, (q, w, h) => { grime(q, w, h, 60, 0.22); for (let k = 0; k < 160; k++) { q.fillStyle = `rgba(${30 + Math.random() * 40 | 0},${30 + Math.random() * 30 | 0},30,.55)`; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 3, 0, 7); q.fill(); }
      q.save(); q.translate(w * 0.92, h / 2); q.rotate(-PI / 2); q.fillStyle = 'rgba(245,197,66,.9)'; q.font = `900 ${w * 0.05}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('WATCH THE GAP  ·  N3W TRANSIT  ·  WATCH THE GAP', 0, 0); q.restore(); }, 512, 0.012);
    floorArt(c, K, g, 8, 16, 16, 0, (q, w, h) => { grime(q, w, h, 60, 0.22); for (let k = 0; k < 140; k++) { q.fillStyle = 'rgba(40,36,30,.5)'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 3, 0, 7); q.fill(); } }, 512, 0.012);
    // overhead: steel girders across the platform and caged bulbs in a row, a soft cone under each
    const gird = K.std(0x2f5a3a, { metalness: 0.5, roughness: 0.55 });
    [-6, -2.5, 1, 4.5].forEach((z) => { g.add(c.slab(20, 0.36, 0.14, gird, 10, 5.6, z)); g.add(c.slab(20, 0.04, 0.4, gird, 10, 5.42, z)); });
    [3, 6.6, 13.4, 17].forEach((x) => [-4.2, -0.8, 2.8].forEach((z) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lit(c, 0xfff0c8, 2)); b.position.set(x, 4.6, z); g.add(b); g.add(c.slab(0.015, 1.0, 0.015, K.std(0x111111), x, 5.1, z)); glow(c, K, g, x, 4.6, z, 0.8, 'rgba(255,236,190,.5)'); cone(c, g, x, 4.55, z, 0.1, 1.3, 4.5, 'rgba(255,236,190,.07)'); }));
    // steam up out of the track bed, dust in the light, and a signal at each tunnel mouth, red then green
    K.steam(g, 4.4, 0.1, -6.6); K.steam(g, 15.6, 0.1, -6.6);
    motes(c, g, r, 150, [1, 0.5, -7.5, 19, 5, 6], { col: 0xfff0d0, size: 0.03, vy: 0.02 });
    const sig = [6.25, 13.75].map((x) => [glow(c, K, g, x - 1.85, 2.9, -6.8, 0.6, 'rgba(255,50,40,.9)'), glow(c, K, g, x - 1.85, 2.6, -6.8, 0.6, 'rgba(60,255,120,.9)')]);
    [6.25, 13.75].forEach((x) => g.add(c.slab(0.16, 0.7, 0.12, K.std(0x111111), x - 1.85, 2.75, -6.86)));
    const tubes = []; g.traverse((o) => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width === 0.2 && o.geometry.parameters.height === 1.2) tubes.push(o); });
    const tubeOff = K.std(0x445044);
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const red = (t % 8) < 5; sig.forEach(([a, b]) => { a.visible = red; b.visible = !red; });
      if (tubes[3]) { const f = Math.sin(t * 31) > 0.6 && Math.sin(t * 1.7) > 0.3; tubes[3].userData.m ||= tubes[3].material; tubes[3].material = f ? tubeOff : tubes[3].userData.m; }
    });
    r.post = { ...(r.post || {}), bloom: 0.95, vig: 0.55 };
  },

  // ---------------- Manhattan: the bench at Sutton Place ----------------
  manhattan(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: an afterimage, in a black and white film. A screen on a stand shows the bridge in negative. Stare at the dot
    // while it counts down, the screen goes blank, and the bridge appears on it, the right way round, lit, made by your own eye.
    const neg = c.canvasTex(1024, 640, (q, w, h) => { q.fillStyle = '#f2f2f2'; q.fillRect(0, 0, w, h);
      q.fillStyle = '#101010'; q.fillRect(0, h * 0.72, w, h * 0.28); [[0.12, 0.08], [0.2, 0.14], [0.86, 0.1], [0.93, 0.18]].forEach(([u, hh]) => q.fillRect(w * u, h * (0.72 - hh), w * 0.05, h * hh));
      const tw = [[0.3, 0.2], [0.68, 0.2]]; tw.forEach(([u]) => { q.fillRect(w * u - 14, h * 0.18, 28, h * 0.6); q.fillRect(w * u - 30, h * 0.18, 60, 14); q.fillRect(w * u - 30, h * 0.4, 60, 10); });
      q.strokeStyle = '#101010'; q.lineWidth = 7; q.beginPath(); q.moveTo(0, h * 0.5); q.quadraticCurveTo(w * 0.15, h * 0.62, w * 0.3, h * 0.19); q.quadraticCurveTo(w * 0.49, h * 0.62, w * 0.68, h * 0.19); q.quadraticCurveTo(w * 0.84, h * 0.62, w, h * 0.5); q.stroke();
      q.lineWidth = 3; for (let x = 0; x < w; x += 22) { const y = h * 0.6; q.beginPath(); q.moveTo(x, y); q.lineTo(x, y - 60 - Math.abs(Math.sin(x / w * PI * 3)) * 70); q.stroke(); }
      q.fillRect(0, h * 0.6, w, 16); q.fillStyle = '#000'; for (let x = 10; x < w; x += 34) { q.beginPath(); q.arc(x, h * 0.6 - 6, 5, 0, 7); q.fill(); }
      q.fillStyle = '#000'; q.beginPath(); q.arc(w / 2, h / 2, 9, 0, 7); q.fill(); q.strokeStyle = '#000'; q.lineWidth = 2; q.beginPath(); q.arc(w / 2, h / 2, 18, 0, 7); q.stroke(); });
    const blank = c.canvasTex(64, 40, (q, w, h) => { q.fillStyle = '#7a7a7a'; q.fillRect(0, 0, w, h); });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.63), new THREE.MeshBasicMaterial({ map: neg, toneMapped: false, color: 0xe8e8e8 }));
    const stand = new THREE.Group(); stand.position.set(3.4, 0, -0.4); stand.rotation.y = Math.atan2(10 - 3.4, 5.8 + 0.4); g.add(stand); scr.position.y = 1.85; stand.add(scr);
    const st = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.4 }); stand.add(c.slab(2.75, 1.78, 0.04, st, 0, 1.85, -0.03)); stand.add(c.slab(0.05, 1.0, 0.05, st, 0, 0.5, -0.06));
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.03, 1.1, 0.03, st, Math.cos(a) * 0.3, 0.45, -0.06 + Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); stand.add(l); }
    const cap = c.sign('STARE AT THE DOT UNTIL THE SCREEN GOES BLANK', { w: 2.6, h: 0.16, bg: '#0a0a0a', fg: '#f0f0f0', font: c.MONO, weight: 700 }); cap.position.set(0, 0.88, 0.01); stand.add(cap);
    const cnt = c.canvasTex(128, 64, () => {}), cq = cnt.userData.canvas.getContext('2d'); const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: cnt, transparent: true, toneMapped: false })); cm.position.set(1.05, 2.5, 0.01); stand.add(cm);
    c.post(X(3.4), -0.4, 0.5);
    let stare = 0, last = -1, seen = false; const fw = new THREE.Vector3(), sp = new THREE.Vector3();
    c.clickable(scr, () => c.toast('Stare at the dot. Do not blink. Wait for the blank.'), 'The screen');
    // the esplanade: hexagon pavers, an iron railing along the river with the bridge's necklace of bulbs on it
    floorArt(c, K, g, 20, 16, 10, 0, (q, w, h) => { const s = 9; q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 1.2;
      for (let y = 0; y < h + s; y += s * 1.5) for (let x = 0; x < w + s; x += s * 1.732) { const ox = ((y / (s * 1.5)) | 0) % 2 ? s * 0.866 : 0; q.beginPath(); for (let a = 0; a < 6; a++) q.lineTo(x + ox + Math.cos(a * PI / 3 + PI / 6) * s, y + Math.sin(a * PI / 3 + PI / 6) * s); q.closePath(); q.stroke(); }
      grime(q, w, h, 60, 0.2); }, 1024, 0.011);
    const NP = 78, posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 1.05, 0.035), st, NP), m4 = new THREE.Matrix4();
    for (let k = 0; k < NP; k++) { m4.makeTranslation(0.3 + k * 0.25, 0.52, -7.45); posts.setMatrixAt(k, m4); } g.add(posts);
    g.add(c.slab(19.6, 0.06, 0.08, st, 10, 1.06, -7.45)); g.add(c.slab(19.6, 0.03, 0.03, st, 10, 0.2, -7.45));
    const NB = 40, neck = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), lit(c, 0xffffff, 2.2), NB);
    for (let k = 0; k < NB; k++) { const u = (k % 20) / 19, x = (k < 20 ? 0.4 : 10.2) + u * 9.4; m4.makeTranslation(x, 1.6 - Math.sin(u * PI) * 0.45, -7.45); neck.setMatrixAt(k, m4); } g.add(neck);
    for (let k = 0; k < 3; k++) g.add(c.slab(0.05, 0.6, 0.05, st, 0.4 + k * 9.6, 1.35, -7.45));
    // the lamps lit, with cones; river mist rolling in low; a dolly track and the camera on it, aimed at the bench
    [[16.2, -6.4], [2.6, -3.0], [17.4, -3.0], [4.0, -6.6]].forEach(([x, z]) => { glow(c, K, g, x, 4.25, z, 1.7, 'rgba(255,255,255,.6)'); cone(c, g, x, 4.2, z, 0.12, 1.5, 4.2, 'rgba(255,255,255,.1)'); });
    const mist = [-6.5, -5, -3.4].map((z, k) => shaft(c, g, 10, 1.1, z, 22, 1.1, 'rgba(230,230,230,.16)', { band: true }));
    motes(c, g, r, 120, [0.5, 0.05, -7.4, 19.5, 1.2, -2], { col: 0xffffff, size: 0.05, vy: 0, sway: 0.5, op: 0.4 });
    const rail = K.std(0x8a8a8a, { metalness: 0.9, roughness: 0.3 }), wood = K.std(0x4a3a2a);
    [-0.35, 0.35].forEach((dx) => g.add(c.slab(0.06, 0.05, 6, rail, 15.6 + dx, 0.08, -2.0))); const NS = 12, sl = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.05, 0.12), wood, NS);
    for (let k = 0; k < NS; k++) { m4.makeTranslation(15.6, 0.03, -4.8 + k * 0.52); sl.setMatrixAt(k, m4); } g.add(sl);
    const dolly = new THREE.Group(); dolly.position.set(15.6, 0, -1.6); dolly.rotation.y = Math.atan2(10 - 15.6, -4.8 + 1.6) + PI; g.add(dolly);
    dolly.add(c.slab(0.8, 0.3, 1.0, st, 0, 0.3, 0)); dolly.add(c.slab(0.08, 0.9, 0.08, st, 0, 0.9, 0)); const body = c.slab(0.3, 0.32, 0.5, K.std(0x222222, { metalness: 0.4 }), 0, 1.45, 0); dolly.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.32, 16), st); lens.rotation.x = PI / 2; lens.position.set(0, 1.45, -0.4); dolly.add(lens);
    [[-0.1, 1.72], [0.12, 1.72]].forEach(([x, y]) => { const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20), st); reel.rotation.z = PI / 2; reel.position.set(x * 0, y, x * 1.6); dolly.add(reel); });
    c.post(X(15.6), -1.6, 0.55);
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      c.camera.getWorldDirection(fw); scr.getWorldPosition(sp); const dx = sp.x - P.x, dz = sp.z - P.z, d = Math.hypot(dx, dz), facing = d < 9 && (dx * fw.x + dz * fw.z) / (d * Math.hypot(fw.x, fw.z) + 1e-6) > 0.94;
      stare = facing ? stare + dt : Math.max(0, stare - dt * 2);
      const phase = stare >= 12 ? 1 : 0; scr.material.map = phase ? blank : neg; const n = phase ? 0 : Math.ceil(12 - stare);
      if (n !== last) { last = n; cq.clearRect(0, 0, 128, 64); if (n > 0) { cq.fillStyle = '#000'; cq.font = `700 46px ${c.MONO}`; cq.textAlign = 'center'; cq.fillText(String(n), 64, 48); } cnt.needsUpdate = true; }
      if (stare >= 17) stare = 0;
      if (phase && !seen) { seen = true; c.egg('manhattan_afterimage', 'The bridge you see on the blank screen is not on the screen. Your own eye made it, the right way round, from twelve seconds of the negative. Black and white, like the picture, and gone in a blink. MLow says that is the city at five in the morning.'); }
      mist.forEach((m, k) => { m.position.x = 10 + Math.sin(t * 0.1 + k * 2) * 1.5; });
    });
    r.post = { ...(r.post || {}), bloom: 0.9, vig: 0.55 };
  },
});

Object.assign(ROOM, {
  // ---------------- Cloverfield: the head ----------------
  clover(c, r, g, X, K) {
    const { THREE } = c;
    // ILLUSION: shadows that do not match. A searchlight rakes the camera on its tripod, and the shadow the tripod throws
    // down the avenue is something else, with legs, and it breathes while the tripod stands still. Every so often the same
    // shape walks across the east wall, cast by nothing at all.
    // the creature, drawn standing: long legs, a hunched body, arms to the ground, a small head
    const monster = (q, w, h) => { q.fillStyle = '#000'; q.strokeStyle = '#000'; q.lineCap = 'round'; q.lineJoin = 'round';
      q.beginPath(); q.ellipse(w * 0.5, h * 0.36, w * 0.2, h * 0.11, 0.15, 0, 7); q.fill(); q.beginPath(); q.ellipse(w * 0.6, h * 0.2, w * 0.07, h * 0.05, 0.4, 0, 7); q.fill();
      [[0.42, 0.42, 0.2, 0.99, 34], [0.58, 0.43, 0.8, 0.99, 34], [0.36, 0.34, 0.06, 0.8, 22], [0.64, 0.33, 0.95, 0.78, 22], [0.47, 0.44, 0.38, 0.99, 18], [0.55, 0.44, 0.66, 0.99, 18]].forEach(([x0, y0, x1, y1, lw], k) => {
        q.lineWidth = lw * w / 512; q.beginPath(); q.moveTo(w * x0, h * y0); q.quadraticCurveTo(w * (x0 + x1) / 2 + (k % 2 ? 1 : -1) * w * 0.14, h * (y0 + y1) / 2 - h * 0.12, w * x1, h * y1); q.stroke(); });
      q.lineWidth = 8 * w / 512; [[0.06, 0.8], [0.95, 0.78]].forEach(([x, y]) => [-1, 0, 1].forEach((d) => { q.beginPath(); q.moveTo(w * x, h * y); q.lineTo(w * (x + d * 0.04), h * (y + 0.05)); q.stroke(); }));
      q.lineWidth = 6 * w / 512; for (let k = 0; k < 7; k++) { q.beginPath(); q.moveTo(w * (0.38 + k * 0.04), h * 0.27); q.lineTo(w * (0.36 + k * 0.045), h * 0.2 - (k % 2) * h * 0.03); q.stroke(); } };
    const monT = c.canvasTex(1024, 512, (q, w, h) => { q.setTransform(0, 1, -1, 0, w, 0); monster(q, h, w); q.setTransform(1, 0, 0, 1, 0, 0);
      q.globalCompositeOperation = 'destination-in'; const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
    const wallT = c.canvasTex(512, 1024, (q, w, h) => monster(q, w, h));
    const shM = new THREE.MeshBasicMaterial({ map: monT, transparent: true, depthWrite: false, opacity: 0.92, polygonOffset: true, polygonOffsetFactor: -4 });
    // a film light on a stand rakes the tripod (8.4, -1.2) from the north west; the shadow falls toward you, and it is not a tripod's
    const L = new THREE.Vector3(6.2, 2.4, -4.6), T = new THREE.Vector3(8.4, 0, -1.2), dir = Math.atan2(T.x - L.x, T.z - L.z);
    const lamp = new THREE.Group(); lamp.position.set(L.x, 0, L.z); g.add(lamp); const steel = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.4 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = c.slab(0.03, 1.4, 0.03, steel, Math.cos(a) * 0.32, 0.66, Math.sin(a) * 0.32); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); lamp.add(l); }
    lamp.add(c.slab(0.05, 1.2, 0.05, steel, 0, 1.8, 0)); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.5, 20), steel); hd.position.y = L.y; hd.rotation.set(1.02, dir + PI, 0, 'YXZ'); lamp.add(hd); c.post(X(L.x), L.z, 0.45);
    const lensG = glow(c, K, g, L.x + Math.sin(dir) * 0.3, L.y - 0.12, L.z + Math.cos(dir) * 0.3, 1.4, 'rgba(230,240,255,.95)');
    const beam = cone(c, g, 0, 0, 0, 0.25, 2.4, 4.6, 'rgba(220,235,255,.16)'); beam.position.set(L.x, L.y, L.z); beam.rotation.set(1.02, dir + PI, 0, 'YXZ');
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: K.glowTex('rgba(220,232,255,.6)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    pool.scale.set(3.4, 5.6, 1); pool.rotation.set(-PI / 2, 0, dir); pool.position.set(T.x + Math.sin(dir) * 2.6, 0.016, T.z + Math.cos(dir) * 2.6); g.add(pool);
    const sgeo = new THREE.PlaneGeometry(7.0, 4.2); sgeo.translate(3.5, 0, 0);
    const fsh = new THREE.Mesh(sgeo, shM); fsh.rotation.x = -PI / 2; const fp = new THREE.Group(); fp.position.set(T.x, 0.022, T.z); fp.rotation.y = dir - PI / 2; fp.add(fsh); g.add(fp);
    const wsh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 11), new THREE.MeshBasicMaterial({ map: wallT, transparent: true, depthWrite: false, opacity: 0 })); wsh.position.set(K.W - 0.4, 5.4, 0); wsh.rotation.y = -PI / 2; g.add(wsh);
    c.clickable(fsh, () => { c.sound.boom(0.5); c.egg('clover_shadow', 'The tripod is three sticks and a camcorder. Its shadow has six legs and it is breathing. Do not look up. Keep rolling. MLow would have.'); }, 'The shadow');
    // fires in the rubble, embers and smoke going up, ash coming down over everything
    const flameT = K.glowTex('rgba(255,120,30,.9)'), fires = [];
    [[3.0, -5.6], [17.4, 4.6], [11.8, -6.2]].forEach(([x, z]) => { for (let k = 0; k < 6; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(s); fires.push({ s, x, z, k }); }
      glow(c, K, g, x, 0.5, z, 3.2, 'rgba(255,90,20,.35)'); motes(c, g, r, 40, [x - 0.6, 0.2, z - 0.6, x + 0.6, 5, z + 0.6], { col: 0xff8a30, size: 0.05, vy: 1.2, sway: 0.5 }); });
    const smokeT = c.canvasTex(128, 128, (q, w) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(40,34,30,.75)'); gr.addColorStop(1, 'rgba(40,34,30,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, w); });
    const smoke = []; [[3.0, -5.6], [11.8, -6.2]].forEach(([x, z]) => { for (let k = 0; k < 6; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false })); g.add(s); smoke.push({ s, x, z, k: k / 6 }); } });
    motes(c, g, r, 300, [0.5, 0.1, -7.5, 19.5, 9, 7.5], { col: 0x8a8480, size: 0.045, vy: -0.25, sway: 0.4, op: 0.8, normal: true });
    // police lights flashing off a barrier, hazards blinking on the car, searchlights sweeping the sky
    const red = glow(c, K, g, 12.3, 1.3, 2.4, 1.4, 'rgba(255,40,40,.85)'), blue = glow(c, K, g, 13.0, 1.3, 2.0, 1.4, 'rgba(60,110,255,.85)');
    const haz = [[12.6, 1.4], [16.4, 0.4], [12.9, -0.3], [16.6, 1.6]].map(([x, z]) => glow(c, K, g, x, 0.7, z, 0.7, 'rgba(255,170,40,.9)'));
    const sweeps = [[3, 0.3], [17, -0.4]].map(([x, a]) => { const m = shaft(c, g, x, 0.0, -7.5, 1.6, 30, 'rgba(200,220,255,.22)', {}); m.geometry.rotateZ(PI); m.userData.a = a; return m; });
    // the avenue: a crack across it, scorch, glass glittering
    floorArt(c, K, g, 20, 16, 10, 0, (q, w, h) => { const s = w / 20;
      for (let k = 0; k < 9; k++) { const x = Math.random() * w, y = Math.random() * h, rr = 30 + Math.random() * 90, gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(10,6,4,.7)'); gr.addColorStop(1, 'rgba(10,6,4,0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      q.strokeStyle = 'rgba(8,6,4,.9)'; const crack = (x, y, a, L, wd) => { if (L < 12 || wd < 0.6) return; q.lineWidth = wd; q.beginPath(); q.moveTo(x, y); const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; q.lineTo(x2, y2); q.stroke(); crack(x2, y2, a + (Math.random() - 0.5) * 0.9, L * 0.8, wd * 0.8); if (Math.random() < 0.35) crack(x2, y2, a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6), L * 0.6, wd * 0.6); };
      crack(w * 0.55, 0, PI / 2 + 0.1, 70, 9); crack(w * 0.4, h * 0.3, 0.3, 60, 6);
      for (let k = 0; k < 500; k++) { q.fillStyle = `rgba(${200 + Math.random() * 55 | 0},${220 + Math.random() * 35 | 0},255,${0.3 + Math.random() * 0.6})`; q.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
      grime(q, w, h, 40, 0.25); q.fillStyle = 'rgba(255,255,255,.6)'; q.font = `900 ${s * 0.7}px ${c.FONT}`; q.textAlign = 'center'; q.save(); q.translate(5 * s, 11 * s); q.scale(1, 2); q.fillText('EVAC', 0, 0); q.restore(); }, 1024, 0.011);
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      fires.forEach(({ s, x, z, k }) => { const u = (t * 1.2 + k / 6) % 1; s.position.set(x + Math.sin(k * 3 + t * 4) * 0.15, 0.2 + u * 1.3, z + Math.cos(k * 5) * 0.15); s.scale.setScalar((1.1 - u * 0.8) * (0.8 + Math.random() * 0.3)); s.material.opacity = 1 - u; });
      smoke.forEach(({ s, x, z, k }) => { const u = (t * 0.08 + k) % 1; s.position.set(x + u * 1.5, 1.5 + u * 8, z); s.scale.setScalar(1.2 + u * 4); s.material.opacity = Math.sin(u * PI) * 0.8; });
      const fl = (t * 3 | 0) % 2; red.visible = !!fl; blue.visible = !fl; haz.forEach((h2) => { h2.visible = (t * 1.6 | 0) % 2 === 0; });
      sweeps.forEach((m, k) => { m.rotation.z = Math.sin(t * 0.35 + k * 2) * 0.5 + m.userData.a; m.rotation.x = -0.25; });
      fsh.scale.set(1 + Math.sin(t * 1.3) * 0.06, 1 + Math.sin(t * 2.1) * 0.08, 1); fsh.position.y = Math.sin(t * 0.9) * 0.08;
      lensG.material.opacity = 0.85 + Math.random() * 0.15;
      const cyc = (t % 22) / 22; if (cyc < 0.4) { const u = cyc / 0.4; wsh.position.z = -5.5 + u * 11; wsh.material.opacity = Math.sin(u * PI) * 0.7; } else wsh.material.opacity = 0;
    });
    r.post = { ...(r.post || {}), bloom: 1.0, vig: 0.6 };
  },

  // ---------------- The Day After Tomorrow: the reading room ----------------
  library(c, r, g, X, K, mats) {
    const { THREE } = c;
    // ILLUSION: a crevasse down the middle aisle. The marble opens on a blue drop seven metres deep, icicles round the lip,
    // a book falling and falling. Walk straight across it: the floor is still there. You just cannot see it.
    const hx1 = 8.6, hx2 = 11.4, hz1 = -1.5, hz2 = 3.6, DEP = 7;
    let floor = null; g.traverse((o) => { if (!floor && o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === K.W && o.geometry.parameters.depth === K.D && Math.abs(o.position.y + 0.05) < 1e-3) floor = o; });
    if (floor) {
      floor.visible = false; const fm = floor.material, rx = fm.userData.repX || fm.userData.rep || 2, ry = fm.userData.repY || fm.userData.rep || 2;
      [[0, K.W, -K.D / 2, hz1], [0, K.W, hz2, K.D / 2], [0, hx1, hz1, hz2], [hx2, K.W, hz1, hz2]].forEach(([x1, x2, z1, z2]) => { const m = c.slab(x2 - x1, 0.1, z2 - z1, fm, (x1 + x2) / 2, -0.05, (z1 + z2) / 2); const pa = m.geometry.attributes.position, na = m.geometry.attributes.normal, uv = m.geometry.attributes.uv;
        for (let i = 0; i < pa.count; i++) if (na.getY(i) > 0.5) uv.setXY(i, (pa.getX(i) + m.position.x) / rx, (K.D / 2 - (pa.getZ(i) + m.position.z)) / ry); g.add(m); });
    }
    const iceT = c.canvasTex(256, 512, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8f6ff'); gr.addColorStop(0.12, '#7ab4e0'); gr.addColorStop(0.45, '#14406e'); gr.addColorStop(1, '#010612'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.strokeStyle = 'rgba(255,255,255,.45)'; for (let k = 0; k < 40; k++) { q.lineWidth = 1 + Math.random() * 2; q.beginPath(); let x = Math.random() * w, y = Math.random() * h; q.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 30; q.lineTo(x, y); } q.stroke(); }
      for (let k = 0; k < 30; k++) { q.fillStyle = 'rgba(255,255,255,.18)'; q.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1 + Math.random() * 3); } });
    const iceM = new THREE.MeshStandardMaterial({ map: iceT, emissive: 0x2a6aa8, emissiveMap: iceT, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.2, side: THREE.BackSide });
    const pit = new THREE.Mesh(new THREE.BoxGeometry(hx2 - hx1, DEP, hz2 - hz1, 1, 4, 1), iceM); pit.position.set((hx1 + hx2) / 2, -DEP / 2 - 0.1, (hz1 + hz2) / 2); g.add(pit);
    const bot = new THREE.Mesh(new THREE.PlaneGeometry(hx2 - hx1, hz2 - hz1), lit(c, 0x0a2a5a, 0.9)); bot.rotation.x = -PI / 2; bot.position.set(10, -DEP + 0.02, (hz1 + hz2) / 2); g.add(bot);
    const LW = hx2 - hx1 + 1.6, LD = hz2 - hz1 + 1.6;
    floorArt(c, K, g, LW, LD, (hx1 + hx2) / 2, (hz1 + hz2) / 2, (q, w, h) => { const s = w / LW;
      const x0 = 0.8 * s, y0 = 0.8 * s, x1 = w - 0.8 * s, y1 = h - 0.8 * s, j = () => (0.02 + Math.random() * 0.14) * s;
      q.save(); q.beginPath(); q.rect(0, 0, w, h); q.moveTo(x0, y0); for (let x = x0; x < x1; x += 10) q.lineTo(x, y0 + j()); for (let y = y0; y < y1; y += 10) q.lineTo(x1 - j(), y); for (let x = x1; x > x0; x -= 10) q.lineTo(x, y1 - j()); for (let y = y1; y > y0; y -= 10) q.lineTo(x0 + j(), y); q.closePath(); q.clip('evenodd');
      for (let k = 0; k < 220; k++) { const x = Math.random() * w, y = Math.random() * h, rr = 6 + Math.random() * 26, gr = q.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(250,253,255,.9)'); gr.addColorStop(1, 'rgba(250,253,255,0)'); q.fillStyle = gr; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      q.restore(); }, 512, 0.014);
    const NI = 44, ic = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 6).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xe8f6ff, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x2a5a8a }), NI), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    for (let k = 0; k < NI; k++) { const side = k % 4, u = Math.random(), L = 0.25 + Math.random() * 0.7; const x = side < 2 ? hx1 + 0.05 + u * (hx2 - hx1 - 0.1) : side === 2 ? hx1 + 0.06 : hx2 - 0.06, z = side === 0 ? hz1 + 0.06 : side === 1 ? hz2 - 0.06 : hz1 + 0.05 + u * (hz2 - hz1 - 0.1); m4.compose(pv.set(x, -L / 2, z), qq, sv.set(1, L, 1)); ic.setMatrixAt(k, m4); } g.add(ic);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.3), K.std(0x8a1a1a)); g.add(book);
    const pitMist = [0, 1, 2].map((k) => shaft(c, g, 10, 0.05 - k * 1.8, 1.05, 2.8, 2.5, 'rgba(160,210,255,.22)', { ry: k * 0.9 }));
    const lab = c.sign('MIND THE CREVASSE. OR DO NOT: THE FLOOR IS STILL THERE.', { w: 3.8, h: 0.22, bg: '#0e1a2a', fg: '#e8f6ff', font: c.MONO, weight: 700 }); lab.rotation.x = -PI / 2; lab.position.set(10, 0.03, hz2 + 0.4); g.add(lab);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(hx2 - hx1, hz2 - hz1), new THREE.MeshBasicMaterial({ visible: false })); hit.rotation.x = -PI / 2; hit.position.set(10, 0.01, (hz1 + hz2) / 2); g.add(hit);
    let crossed = false;
    const eg = () => { if (crossed) return; crossed = true; c.sound.whoosh(0.4, 1.5); c.egg('library_crevasse', 'You walked straight across a seven metre drop in the floor of the reading room. The marble was there the whole time. MLow says the cold is like that: it only looks bottomless.'); };
    c.clickable(hit, eg, 'The crevasse');
    // the ceiling: coffers in gold round a painted sky, the way the real room has it
    const ceilT = c.canvasTex(c.MOBILE ? 1024 : 2048, c.MOBILE ? 820 : 1640, (q, w, h) => { q.fillStyle = '#3a2410'; q.fillRect(0, 0, w, h);
      const panel = (x, y, pw, ph) => { const gr = q.createLinearGradient(x, y, x, y + ph); gr.addColorStop(0, '#8ab4e0'); gr.addColorStop(1, '#d8e8f4'); q.fillStyle = gr; q.fillRect(x, y, pw, ph);
        for (let k = 0; k < 14; k++) { const cx = x + Math.random() * pw, cy = y + Math.random() * ph, rr = pw * (0.05 + Math.random() * 0.1), cg = q.createRadialGradient(cx, cy, 0, cx, cy, rr); cg.addColorStop(0, 'rgba(255,248,240,.85)'); cg.addColorStop(1, 'rgba(255,248,240,0)'); q.fillStyle = cg; q.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
        q.strokeStyle = '#d8a83a'; q.lineWidth = w * 0.012; q.strokeRect(x, y, pw, ph); q.strokeStyle = '#7a5418'; q.lineWidth = w * 0.004; q.strokeRect(x + w * 0.01, y + w * 0.01, pw - w * 0.02, ph - w * 0.02); };
      for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) { const cw = w / 10, ch = h / 8; q.fillStyle = (i + j) % 2 ? '#5a3a14' : '#4a2e10'; q.fillRect(i * cw, j * ch, cw, ch); q.strokeStyle = '#c99a30'; q.lineWidth = 4; q.strokeRect(i * cw + 6, j * ch + 6, cw - 12, ch - 12); q.fillStyle = '#d8a83a'; q.beginPath(); q.arc(i * cw + cw / 2, j * ch + ch / 2, cw * 0.12, 0, 7); q.fill(); }
      panel(w * 0.08, h * 0.12, w * 0.36, h * 0.76); panel(w * 0.56, h * 0.12, w * 0.36, h * 0.76); });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshStandardMaterial({ map: ceilT, roughness: 0.6, metalness: 0.2, emissive: 0xffffff, emissiveMap: ceilT, emissiveIntensity: 0.18 })); ceil.rotation.x = PI / 2; ceil.position.set(10, 5.97, 0); g.add(ceil);
    // green lamps glowing on every table, frost and icicles on the table edges, books spilled by the fire
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { const x = 5.5 + i * 9, z = -5 + j * 3; [-1.5, 0, 1.5].forEach((dx) => glow(c, K, g, x + dx, 1.12, z, 0.6, 'rgba(120,255,160,.45)')); }
    const NT = 64, ti = new THREE.InstancedMesh(new THREE.ConeGeometry(0.025, 1, 5).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xe8f6ff, roughness: 0.1, transparent: true, opacity: 0.85 }), NT);
    for (let k = 0; k < NT; k++) { const t2 = k % 8, i = t2 >> 2, j = t2 & 3, x = 5.5 + i * 9 - 2.4 + Math.random() * 4.8, z = -5 + j * 3 + (k % 2 ? 0.7 : -0.7), L = 0.1 + Math.random() * 0.25; m4.compose(pv.set(x, 0.74 - L / 2, z), qq, sv.set(1, L, 1)); ti.setMatrixAt(k, m4); } g.add(ti);
    const NBk = 34, bk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.05, 0.28), new THREE.MeshStandardMaterial({ roughness: 0.7 }), NBk), cc = new THREE.Color(), eu = new THREE.Euler();
    for (let k = 0; k < NBk; k++) { eu.set(0, Math.random() * 6.3, 0); qq.setFromEuler(eu); m4.compose(pv.set(1.2 + Math.random() * 3, 0.025 + (k % 3) * 0.05, 3.0 + Math.random() * 1.2), qq, sv.set(1, 1, 1)); bk.setMatrixAt(k, m4); bk.setColorAt(k, cc.set([0x8a1a1a, 0x1a3a6a, 0x2a5a2a, 0x6a4a1a, 0xd8c8a0][k % 5])); } g.add(bk); qq.identity();
    motes(c, g, r, 40, [1.8, 0.4, 4.0, 3.0, 3.0, 5.2], { col: 0xff9a40, size: 0.05, vy: 0.9, sway: 0.5 });
    // snow blown in from the north, drifts at the windows, cold light coming through, snow still falling indoors
    floorArt(c, K, g, 20, 6, 10, -5, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(250,252,255,.95)'); gr.addColorStop(1, 'rgba(250,252,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      for (let k = 0; k < 60; k++) { const x = Math.random() * w, y = Math.random() * h * 0.8, rr = 10 + Math.random() * 40, g2 = q.createRadialGradient(x, y, 0, x, y, rr); g2.addColorStop(0, 'rgba(255,255,255,.7)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g2; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }, 512, 0.013);
    const ND = 10, dr = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 8, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.8 }), ND);
    for (let k = 0; k < ND; k++) { m4.compose(pv.set(1 + k * 2 + Math.random(), 0, -7.6 + Math.random() * 0.4), qq, sv.set(0.9 + Math.random() * 0.6, 0.25 + Math.random() * 0.25, 0.6)); dr.setMatrixAt(k, m4); } g.add(dr);
    [[4, 0.12], [10, 0], [16, -0.12]].forEach(([x, rz]) => shaft(c, g, x, 5.4, -7.6, 3, 8, 'rgba(190,220,255,.16)', { rx: -0.75, rz }));
    motes(c, g, r, 260, [0.5, 0.1, -7.5, 19.5, 5.8, 7.5], { col: 0xffffff, size: 0.04, vy: -0.3, sway: 0.3, op: 0.85 });
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const u = (t * 0.22) % 1; book.position.set(10 + Math.sin(t) * 0.3, -0.3 - u * (DEP - 0.6), 1.05 + Math.cos(t * 0.7) * 0.4); book.rotation.set(t * 2.1, t * 1.3, t * 0.7); book.scale.setScalar(1 - u * 0.3);
      pitMist.forEach((m, k) => { m.rotation.y = k * 0.9 + t * 0.1; });
      const lx = P.x - r.x0; if (!crossed && lx > hx1 + 0.3 && lx < hx2 - 0.3 && P.z > hz1 + 0.3 && P.z < hz2 - 0.3) eg();
    });
    r.post = { ...(r.post || {}), bloom: 0.95, vig: 0.5 };
  },
});
