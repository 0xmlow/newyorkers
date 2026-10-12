// Round thirteen batch c5: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// Sets: legend, llewyn, fisherking, waituntildark, tootsie, insideman, prada, blackswan, cocktail, gangs, oddcouple, ontown, godfather.
// No new lights anywhere: practicals are emissive or additive, and everything that moves only moves while its set is near.
const PI = Math.PI;

// ---------- shared helpers, local to this batch ----------
const TX = {};
// a soft round dot, for glows, motes, snow and stars
function dotTex(c) { return TX.dot ||= c.canvasTex(64, 64, (q, w, h) => { const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
// a light beam: soft across, fading toward its far end
function beamTex(c) {
  return TX.beam ||= c.canvasTex(64, 256, (q, w, h) => {
    const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = gx; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-in';
    const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.08, 'rgba(0,0,0,1)'); gy.addColorStop(0.55, 'rgba(0,0,0,.55)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    q.fillStyle = gy; q.fillRect(0, 0, w, h);
  });
}
// a smoke or fog puff: a few blurred blobs
function smokeTex(c) {
  return TX.smoke ||= c.canvasTex(128, 128, (q, w, h) => {
    for (let k = 0; k < 14; k++) { const x = 30 + Math.random() * 68, y = 30 + Math.random() * 68, R = 14 + Math.random() * 26, gr = q.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }
  });
}
const add = (T) => ({ transparent: true, depthWrite: false, blending: T.AdditiveBlending });
function glow(c, g, col, s, x, y, z, op = 1) {
  const T = c.THREE, m = new T.Sprite(new T.SpriteMaterial({ map: dotTex(c), color: col, opacity: op, ...add(T) }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// an emissive material bright enough to bloom (the finishing pass blooms anything over 0.66)
function hot(c, hex, k = 1.6, o = {}) { const m = new c.THREE.MeshBasicMaterial({ color: hex, toneMapped: false, ...o }); m.color.multiplyScalar(k); return m; }
function place(m, g, x, y, z, rx = 0, ry = 0, rz = 0) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; }
// a beam of light from (x, y, z) along d for len metres, two crossed planes so it holds from any side
function beam(c, g, x, y, z, d, w, len, col, op) {
  const T = c.THREE, b = new T.Group(), mat = new T.MeshBasicMaterial({ map: beamTex(c), color: col, opacity: op, side: T.DoubleSide, fog: false, ...add(T) });
  const geo = new T.PlaneGeometry(w, len).translate(0, -len / 2, 0);
  b.add(new T.Mesh(geo, mat)); const p2 = new T.Mesh(geo, mat); p2.rotation.y = PI / 2; b.add(p2);
  b.position.set(x, y, z); b.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), new T.Vector3(...d).normalize()); g.add(b); return b;
}
// a cone of light from a fixture down to the floor
function cone(c, g, x, y, z, r0, r1, len, col, op) {
  const T = c.THREE, m = new T.Mesh(new T.CylinderGeometry(r0, r1, len, 28, 1, true).translate(0, -len / 2, 0), new T.MeshBasicMaterial({ map: beamTex(c), color: col, opacity: op, side: T.DoubleSide, fog: false, ...add(T) }));
  m.position.set(x, y, z); g.add(m); return m;
}
// dust, pollen, snow or feathers: points drifting in a box, only animated while the set is near
function motes(c, r, g, o) {
  const T = c.THREE, { n = 200, box = [0, 20, 0, 5, -7, 7], col = 0xffffff, size = 0.04, op = 0.6, fall = 0, drift = 0.08, addv = true, map } = o, N = c.MOBILE ? n >> 1 : n;
  const p = new Float32Array(N * 3), ph = new Float32Array(N), [x0, x1, y0, y1, z0, z1] = box;
  for (let k = 0; k < N; k++) { p[k * 3] = x0 + Math.random() * (x1 - x0); p[k * 3 + 1] = y0 + Math.random() * (y1 - y0); p[k * 3 + 2] = z0 + Math.random() * (z1 - z0); ph[k] = Math.random() * 6.3; }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(p, 3));
  const mat = new T.PointsMaterial({ map: map || dotTex(c), color: col, size, opacity: op, transparent: true, depthWrite: false, blending: addv ? T.AdditiveBlending : T.NormalBlending });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; g.add(pts);
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    for (let k = 0; k < N; k++) {
      const i = k * 3; p[i] += Math.sin(t * 0.4 + ph[k]) * dt * drift; p[i + 2] += Math.cos(t * 0.3 + ph[k] * 1.3) * dt * drift; p[i + 1] += (Math.sin(t * 0.5 + ph[k] * 2) * drift * 0.5 - fall) * dt;
      if (p[i + 1] < y0) p[i + 1] = y1; else if (p[i + 1] > y1) p[i + 1] = y0;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return pts;
}
// big soft puffs of smoke or fog that drift and breathe
function haze(c, r, g, o) {
  const T = c.THREE, { n = 6, box = [2, 18, 2.4, 4.2, -6, 6], col = 0xffffff, op = 0.35, s = [4, 7], speed = 0.15, addv = true } = o, list = [];
  for (let k = 0; k < (c.MOBILE ? Math.ceil(n / 2) : n); k++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: smokeTex(c), color: col, opacity: op, transparent: true, depthWrite: false, blending: addv ? T.AdditiveBlending : T.NormalBlending }));
    const sc = s[0] + Math.random() * (s[1] - s[0]); sp.scale.set(sc, sc * 0.6, 1); sp.position.set(box[0] + Math.random() * (box[1] - box[0]), box[2] + Math.random() * (box[3] - box[2]), box[4] + Math.random() * (box[5] - box[4])); sp.material.rotation = Math.random() * 6;
    g.add(sp); list.push({ sp, x: sp.position.x, ph: Math.random() * 6.3 });
  }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; list.forEach((q) => { q.x += dt * speed; if (q.x > box[1]) q.x = box[0]; q.sp.position.x = q.x; q.sp.material.rotation += dt * 0.03; q.sp.material.opacity = op * (0.75 + Math.sin(t * 0.4 + q.ph) * 0.25); }); });
  return list;
}
// a canvas texture on a plane, flat on the floor or on a wall
function plane(c, g, w, h, draw, x, y, z, o = {}) {
  const T = c.THREE, t = c.canvasTex(Math.round((o.px || 512) * w / h), o.px || 512, draw);
  const mat = o.basic ? new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: o.tone !== false, polygonOffset: true, polygonOffsetFactor: -2 })
    : new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: o.rough ?? 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  if (o.k) mat.color.multiplyScalar(o.k);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.set(x, y, z); if (o.floor) m.rotation.x = -PI / 2; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; g.add(m); return m;
}
// a neon word: a glowing sign with a halo, that can flicker
function neon(c, g, text, x, y, z, ry, o = {}) {
  const { w = 2.4, h = 0.5, col = '#ff4fa3', font = c.SERIF, k = 1.8 } = o;
  const s = c.sign(text, { w, h, bg: null, fg: col, font, weight: 800, glow: 26, px: 192 }); s.material.color.setScalar(k); s.position.set(x, y, z); s.rotation.y = ry; g.add(s);
  return s;
}
// a small sign in a group
function sg2(c, g, text, w, h, x, y, z, ry = 0) { const s = c.sign(text, { w, h, bg: '#ffffff', fg: '#111111', font: c.SERIF, weight: 800 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }
// find a mesh the set made, by a test on it
function find(g, f) { let hit = null; g.traverse((o) => { if (!hit && f(o)) hit = o; }); return hit; }
function findAll(g, f) { const out = []; g.traverse((o) => { if (f(o)) out.push(o); }); return out; }
const near = (o, x, y, z, e = 0.05) => Math.abs(o.position.x - x) < e && (y === null || Math.abs(o.position.y - y) < e) && Math.abs(o.position.z - z) < e;
// a deterministic hash for procedural paint, so a texture is the same every load
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

export const PROPS = {};

export const ROOM = {
  // ---------- I Am Legend: Times Square, three years on ----------
  legend(c, r, g, X, K) {
    const T = c.THREE;
    r.post = { ...r.post, bloom: 0.9, vig: 0.48 };
    // the illusion: a sinkhole into the 42nd Street shuttle, painted on the asphalt in perspective for one spot
    const hx0 = 8.3, hx1 = 11.4, hz0 = 0.55, hz1 = 3.2, DEP = 4.2, E = [9.85, 1.62, 5.9], PX = c.MOBILE ? 220 : 440;
    const PW = PX, PH = Math.round(PX * (hz1 - hz0) / (hx1 - hx0));
    const eye = document.createElement('canvas'); eye.width = eye.height = 128; K.eyeFlower(eye.getContext('2d'), 64, 64, 60); const ED = eye.getContext('2d').getImageData(0, 0, 128, 128).data;
    const pit = c.canvasTex(PW, PH, (q, w, h) => {
      const img = q.createImageData(w, h), d = img.data;
      // an outline that wobbles: the crust of asphalt that hangs over the edge
      const rim = (x, z) => { const u = (x - hx0) / (hx1 - hx0) * 2 - 1, v = (z - hz0) / (hz1 - hz0) * 2 - 1, a = Math.atan2(v, u), rr = 0.86 + Math.sin(a * 5 + 1) * 0.05 + Math.sin(a * 11) * 0.03 + Math.sin(a * 23 + 2) * 0.015; return Math.pow(Math.abs(u), 2.6) + Math.pow(Math.abs(v), 2.6) - Math.pow(rr, 2.6); };
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const x = hx0 + (i + 0.5) / w * (hx1 - hx0), z = hz0 + (j + 0.5) / h * (hz1 - hz0), o = (j * w + i) * 4, e = rim(x, z);
        if (e > 0.06) { d[o + 3] = 0; continue; }
        if (e > -0.05) { const n = hash(x * 40, z * 40); d[o] = d[o + 1] = 70 + n * 50; d[o + 2] = 60 + n * 40; d[o + 3] = 255; continue; }   // the broken lip
        const dx = x - E[0], dy = -E[1], dz = z - E[2];
        const sx = dx > 0 ? (hx1 - x) / dx : dx < 0 ? (hx0 - x) / dx : 1e9, sz = dz > 0 ? (hz1 - z) / dz : dz < 0 ? (hz0 - z) / dz : 1e9, sb = DEP / -dy;
        const s = Math.min(sx, sz, sb), px = x + dx * s, py = dy * s, pz = z + dz * s, dep = -py;
        let R, G, B;
        const tile = (a, b) => { const gx = a / 0.15, gy = b / 0.075, fx = gx - Math.floor(gx), fy = gy - Math.floor(gy), grout = fx < 0.08 || fy < 0.12, n = hash(Math.floor(gx), Math.floor(gy)); return grout ? [50, 46, 40] : [150 + n * 40, 146 + n * 34, 120 + n * 26]; };
        if (s === sb) {   // the track bed: ballast, sleepers, two rails, and a puddle
          const n = hash(px * 30, pz * 30); R = 60 + n * 40; G = 56 + n * 36; B = 50 + n * 30;
          const zc = (hz0 + hz1) / 2 - 0.2, sl = (px * 1.6) % 1;
          if (Math.abs(pz - zc) < 0.55 && sl > 0.0 && sl < 0.32) { R = 78; G = 56; B = 40; }
          if (Math.abs(Math.abs(pz - zc) - 0.36) < 0.03) { R = 150; G = 150; B = 160; }
          if (Math.hypot((px - 10.4) / 1.2, (pz - 2.5) / 0.4) < 0.5) { R = 40; G = 52; B = 64; }
        } else {
          const along = s === sx ? pz : px, n = hash(along * 20, dep * 20);
          if (dep < 0.16) { R = 34 + n * 30; G = R; B = R - 4; }                 // asphalt
          else if (dep < 0.55) { R = 92 + n * 40; G = 66 + n * 28; B = 42 + n * 20; if (hash(along * 7, dep * 3) > 0.93) { R = 140; G = 120; B = 90; } }   // soil and stones
          else if (dep < 0.68) { R = 120; G = 40; B = 34; }                     // a maroon band
          else { [R, G, B] = tile(along, dep); }
          // the far wall carries the station mosaic: an eye flower, as the old stations carried their names
          if (s === sz && dz < 0 && dep > 1.0 && dep < 2.3) { const u = (px - 9.2) / 1.3, v = (dep - 1.0) / 1.3; if (u >= 0 && u < 1) { const k = ((Math.floor(v * 127)) * 128 + Math.floor(u * 127)) * 4; if (ED[k + 3] > 100) { R = ED[k]; G = ED[k + 1]; B = ED[k + 2]; } } }
          // a red emergency lamp on the east wall
          const lamp = Math.hypot(along - 1.8, dep - 1.6); if (s === sx && dx > 0 && lamp < 0.12) { R = 255; G = 60; B = 40; }
        }
        // depth: the deeper, the darker, except where the red lamp reaches
        let k = Math.max(0.05, Math.pow(Math.max(0, 1 - dep * 0.3), 1.8)) * (s === sb ? 0.75 : 1); const glowR = Math.max(0, 1 - Math.hypot(px - hx1, pz - 1.8, dep - 1.6) / 1.6);
        d[o] = Math.min(255, R * k + glowR * 120); d[o + 1] = G * k + glowR * 10; d[o + 2] = B * k + glowR * 8; d[o + 3] = 255;
      }
      q.putImageData(img, 0, 0);
    });
    const hole = new T.Mesh(new T.PlaneGeometry(hx1 - hx0, hz1 - hz0), new T.MeshBasicMaterial({ map: pit, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    hole.rotation.x = -PI / 2; hole.position.set((hx0 + hx1) / 2, 0.008, (hz0 + hz1) / 2); g.add(hole);
    c.clickable(hole, () => { c.sound.boom(0.25); c.egg('legend_sinkhole', 'Three years of no traffic and Times Square fell into the shuttle. Stand on the mark and it is a hole. Step off it and it is paint. MLow counts it either way.'); }, 'A hole in the street');
    // the mark you stand on, stencilled on the asphalt
    plane(c, g, 0.9, 0.9, (q, w, h) => { q.strokeStyle = 'rgba(245,197,66,.85)'; q.lineWidth = w * 0.05; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, 7); q.stroke(); q.fillStyle = 'rgba(245,197,66,.85)'; q.font = `800 ${w * 0.11}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND', w / 2, h * 0.47); q.fillText('HERE', w / 2, h * 0.62); }, 9.85, 0.01, 6.2, { floor: true, px: 256 });
    // the grass: clumps of tapered blades, gold at the tips, and a wind through them; none inside the hole
    const blade = find(g, (o) => o.isInstancedMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 0.06) < 1e-3);
    if (blade) {
      const bt = c.canvasTex(128, 128, (q, w, h) => { for (let k = 0; k < 6; k++) { const x0 = 12 + k * 20 + Math.random() * 6, lean = (Math.random() - 0.5) * 40, top = 4 + Math.random() * 40, gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#141c0c'); gr.addColorStop(0.45, '#3a5418'); gr.addColorStop(1, '#8a8a44'); q.fillStyle = gr; q.beginPath(); q.moveTo(x0 - 6, h); q.quadraticCurveTo(x0 - 2, h * 0.5, x0 + lean, top); q.quadraticCurveTo(x0 + 3, h * 0.55, x0 + 6, h); q.fill(); } });
      blade.geometry = new T.PlaneGeometry(0.36, 0.66).translate(0, 0.33, 0);
      const U = { value: 0 }, bm = new T.MeshStandardMaterial({ map: bt, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.95, envMapIntensity: 0.3 });
      bm.onBeforeCompile = (s) => { s.uniforms.uT = U; s.vertexShader = 'uniform float uT;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.); float sw = (sin(uT * 1.6 + ip.x * 0.7 + ip.z * 0.5) * 0.1 + sin(uT * 3.3 + ip.x * 2.1) * 0.03) * position.y * position.y * 3.;\n  transformed.x += sw; transformed.z += sw * 0.5;'); };
      blade.material = bm; const m4 = new T.Matrix4(), v = new T.Vector3(), q4 = new T.Quaternion(), sc = new T.Vector3(), col = new T.Color();
      for (let k = 0; k < blade.count; k++) { blade.getMatrixAt(k, m4); m4.decompose(v, q4, sc); if (v.x > hx0 - 0.25 && v.x < hx1 + 0.25 && v.z > hz0 - 0.25 && v.z < hz1 + 0.25) { sc.setScalar(0); m4.compose(v, q4, sc); blade.setMatrixAt(k, m4); } blade.setColorAt(k, col.setHSL(0.18 + Math.random() * 0.08, 0.3 + Math.random() * 0.2, 0.32 + Math.random() * 0.2)); }
      blade.instanceMatrix.needsUpdate = true; if (blade.instanceColor) blade.instanceColor.needsUpdate = true;
      c.tick((t, dt, P, ri) => { if (ri === r.i) U.value = t; });
      // taller weeds along the kerbs and round the wrecks
      const NW = c.MOBILE ? 50 : 110, weeds = new T.InstancedMesh(new T.PlaneGeometry(0.6, 1.2).translate(0, 0.6, 0), bm, NW);
      for (let k = 0; k < NW; k++) { const side = k % 4; const x = side < 2 ? (side ? 19.3 : 0.7) + (Math.random() - 0.5) * 0.8 : Math.random() * 20, z = side < 2 ? -7 + Math.random() * 14 : (side === 2 ? -6.9 : 7.1) + (Math.random() - 0.5) * 0.6; if (side < 2 && z > 1.6 && z < 6) { m4.makeScale(0, 0, 0); weeds.setMatrixAt(k, m4); continue; } q4.setFromEuler(new T.Euler(0, Math.random() * 6.3, 0)); m4.compose(v.set(x, 0, z), q4, sc.setScalar(0.6 + Math.random() * 0.8)); weeds.setMatrixAt(k, m4); weeds.setColorAt(k, col.setHSL(0.2 + Math.random() * 0.06, 0.4, 0.35 + Math.random() * 0.2)); }
      g.add(weeds);
    }
    // the golf bucket moves off the hole's edge, balls and all
    findAll(g, (o) => o.isGroup && near(o, 8.6, null, 2.1)).forEach((o) => o.position.set(6.9, o.position.y, 2.5));
    findAll(g, (o) => o.isInstancedMesh && o.count === 14 && o.geometry.type === 'SphereGeometry').forEach((o) => o.position.set(-1.7, 0, 0.4));
    // broken asphalt round the lip, and the city's sawhorses
    const asph = c.surf('asphalt', 1, 0x5a5a50), chunks = new T.InstancedMesh(new T.BoxGeometry(0.4, 0.09, 0.3), asph, 16), m4 = new T.Matrix4(), q4 = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2 + Math.random() * 0.2, x = 9.85 + Math.cos(a) * 1.8, z = 1.88 + Math.sin(a) * 1.55; if (z > 2.6 && Math.abs(x - 9.85) < 0.9) { m4.makeScale(0, 0, 0); chunks.setMatrixAt(k, m4); continue; } e.set((Math.random() - 0.5) * 0.5, a, (Math.random() - 0.5) * 0.6); q4.setFromEuler(e); m4.compose(v.set(x, 0.03, z), q4, one.set(0.6 + Math.random() * 0.8, 1, 0.6 + Math.random() * 0.8)); chunks.setMatrixAt(k, m4); }
    g.add(chunks);
    const stripe = c.canvasTex(256, 32, (q, w, h) => { for (let i = -2; i < 16; i++) { q.fillStyle = i % 2 ? '#f4f4f0' : '#ff7a1a'; q.beginPath(); q.moveTo(i * 20, h); q.lineTo(i * 20 + 20, h); q.lineTo(i * 20 + 40, 0); q.lineTo(i * 20 + 20, 0); q.fill(); } });
    const warn = [], horses = [];
    [[7.5, 0.9, PI / 2 + 0.25], [12.3, 1.2, PI / 2 - 0.2]].forEach(([x, z, ry]) => {
      const s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); const wood = K.std(0xd8d0b8, { roughness: 0.8 });
      [-0.55, 0.55].forEach((dx) => [-1, 1].forEach((sd) => { const l = c.slab(0.05, 1.0, 0.05, wood, dx, 0.48, sd * 0.14); l.rotation.x = sd * 0.25; s.add(l); }));
      const bd = new T.Mesh(new T.BoxGeometry(1.3, 0.2, 0.04), new T.MeshStandardMaterial({ map: stripe, roughness: 0.6 })); bd.position.y = 0.88; s.add(bd);
      const lt = new T.Mesh(new T.SphereGeometry(0.06, 12, 10), hot(c, 0xffa020, 2.2)); lt.position.set(0.5, 1.06, 0); s.add(lt); warn.push(lt, glow(c, s, 0xffa040, 0.7, 0.5, 1.06, 0.05));
      c.post(X(x), z, 0.5); horses.push(s);
    });
    horses.forEach((s) => { const dot = c.sign('N3W DOT. SINKHOLE. DO NOT FEED THE HOLE', { w: 1.2, h: 0.13, bg: '#ff7a1a', fg: '#111111', font: c.MONO, weight: 800 }); dot.position.set(0, 0.66, 0.16); s.add(dot); const d2 = dot.clone(); d2.rotation.y = PI; d2.position.z = -0.16; s.add(d2); });
    // the signal at the corner still blinks amber for nobody
    const sigP = new T.Group(); sigP.position.set(18.7, 0, -3.4); g.add(sigP); const iron = K.std(0x2a2e26, { metalness: 0.6, roughness: 0.5 });
    sigP.add(c.slab(0.12, 5.2, 0.12, iron, 0, 2.6, 0)); sigP.add(c.slab(2.6, 0.1, 0.1, iron, -1.3, 5.0, 0)); c.post(X(18.7), -3.4, 0.2);
    const head = new T.Group(); head.position.set(-2.2, 4.4, 0); sigP.add(head); head.add(c.slab(0.36, 1.0, 0.3, K.std(0x3a4a2a, { roughness: 0.6 }), 0, 0, 0));
    const amber = hot(c, 0xffb020, 2.4), off = K.std(0x2a2410), lens = [];
    [0.3, 0, -0.3].forEach((y, k) => { const l = new T.Mesh(new T.CircleGeometry(0.1, 20), k === 1 ? amber : off); l.position.set(0, y, 0.16); head.add(l); lens.push(l); const l2 = l.clone(); l2.position.z = -0.16; l2.rotation.y = PI; head.add(l2); });
    const sigGlow = glow(c, head, 0xffb030, 1.4, 0, 0, 0.25);
    // the deli's neon, sputtering on what is left of the grid
    const deli = neon(c, g, 'N3W DELI 24 HRS', 0.16, 4.1, -3.2, PI / 2, { w: 2.6, h: 0.5, col: '#ff4fa3' });
    // puddles from last night's rain, black mirrors in the asphalt
    const pud = new T.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.9, roughness: 0.12, envMapIntensity: 0.55 });
    [[5.6, 4.6, 1.3, 0.6], [13.4, 4.2, 0.9, 0.5], [4.2, -5.2, 1.1, 0.5], [14.6, 5.9, 0.7, 0.35]].forEach(([x, z, a, b2]) => { const p = new T.Mesh(new T.CircleGeometry(1, 32), pud); p.scale.set(a, b2, 1); p.rotation.x = -PI / 2; p.position.set(x, 0.006, z); g.add(p); });
    // sun through the gaps in the towers, and the pollen hanging in it
    [[15.5, 9.5, -6.5], [12.5, 9.8, -7.2], [18.2, 9.2, -2.0]].forEach(([x, y, z], k) => beam(c, g, x, y, z, [-0.55, -0.8, 0.3], 1.6 + k * 0.5, 13, 0xfff2c8, 0.07));
    motes(c, r, g, { n: 260, box: [0.5, 19.5, 0.3, 6, -7, 7], col: 0xfff0b0, size: 0.05, op: 0.55, drift: 0.12 });
    // newspapers tumbling through the square
    const paperT = c.canvasTex(128, 96, (q, w, h) => { q.fillStyle = '#d8d0b8'; q.fillRect(0, 0, w, h); q.fillStyle = '#222'; q.font = `900 16px ${c.SERIF}`; q.fillText('THE DAILY COUNT', 6, 18); q.fillStyle = '#777'; for (let y = 28; y < h - 6; y += 7) q.fillRect(6, y, w - 12, 3); });
    const papers = [0, 1, 2, 3].map((k) => { const m = new T.Mesh(new T.PlaneGeometry(0.42, 0.32), new T.MeshStandardMaterial({ map: paperT, side: T.DoubleSide, roughness: 0.9 })); g.add(m); return { m, u: k / 4, z: -5 + k * 3.2 }; });
    // birds over the square: the city went quiet and the starlings came back
    const birdG = new T.BufferGeometry(); birdG.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.12, -0.35, 0.05, -0.05, 0, 0, -0.08, 0, 0, 0.12, 0.35, 0.05, -0.05, 0, 0, -0.08], 3)); birdG.computeVertexNormals();
    const birdM = new T.MeshBasicMaterial({ color: 0x1a1a18, side: T.DoubleSide }), birds = [];
    for (let k = 0; k < 11; k++) { const b = new T.Mesh(birdG, birdM); b.scale.setScalar(1.2 + Math.random() * 0.6); g.add(b); birds.push({ b, a: Math.random() * 6.3, rr: 4 + Math.random() * 5, y: 12 + Math.random() * 4, sp: 0.35 + Math.random() * 0.2 }); }
    // ivy hanging off the billboards and the cornices
    const ivyT = c.canvasTex(128, 512, (q, w, h) => { for (let s = 0; s < 5; s++) { let x = 14 + s * 24; for (let y = 0; y < h; y += 7) { x += (Math.random() - 0.5) * 5; if (y > h * (0.45 + Math.random() * 0.55)) break; q.fillStyle = `hsl(${95 + Math.random() * 30},${40 + Math.random() * 25}%,${18 + Math.random() * 20}%)`; q.beginPath(); q.ellipse(x + (Math.random() - 0.5) * 12, y, 6, 4, Math.random() * 3, 0, 7); q.fill(); } } });
    const ivyM = new T.MeshStandardMaterial({ map: ivyT, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.8 });
    [[0.2, -5.6, PI / 2], [0.2, -1.0, PI / 2], [19.55, -5.0, -PI / 2], [19.55, 1.0, -PI / 2], [3.5, 7.82, PI], [16.5, 7.82, PI]].forEach(([x, z, ry], k) => { const m = new T.Mesh(new T.PlaneGeometry(1.4, 5.6), ivyM); m.position.set(x, 10 - 2.8, z); m.rotation.y = ry; g.add(m); });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const on = (t * 1.1) % 1 < 0.5; lens[1].material = on ? amber : off; sigGlow.visible = on; warn.forEach((o, k) => { o.visible = ((t * 1.6 + k * 0.25) % 1) < 0.55; });
      deli.material.color.setScalar(Math.random() < 0.06 ? 0.25 : 1.8);
      papers.forEach((p) => { p.u = (p.u + dt * 0.035) % 1; p.m.position.set(-1 + p.u * 22, 0.12 + Math.abs(Math.sin(p.u * 40)) * 0.5, p.z + Math.sin(p.u * 9) * 0.8); p.m.rotation.set(p.u * 30, p.u * 11, p.u * 17); });
      birds.forEach((q) => { q.a += dt * q.sp; q.b.position.set(10 + Math.cos(q.a) * q.rr, q.y + Math.sin(q.a * 3) * 0.4, -1 + Math.sin(q.a) * q.rr * 0.6); q.b.rotation.y = -q.a; q.b.scale.y = 0.4 + Math.abs(Math.sin(t * 9 + q.rr)) * 1.4; });
    });
  },

  // ---------- Inside Llewyn Davis: the Gaslight, MacDougal Street ----------
  llewyn(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 1.05, vig: 0.55 };
    // the illusion: Ulysses, the cat, as a hollow mask over the stage. The face is pressed inward, painted as if it stood out,
    // so the eye reads it the right way round and it turns to follow you wherever you walk.
    const NU = c.MOBILE ? 48 : 72, S = 1.9, KD = S / 1.3, ears = (u, v) => [-1, 1].reduce((a, s) => a + 0.11 * Math.exp(-(((u - s * 0.56) ** 2) / 0.018 + ((v - 0.74) ** 2) / 0.03)), 0);
    const dep = (u, v) => { const b = Math.max(0, 1 - (u * u + (v * 1.08) ** 2) / 0.72); return 0.3 * Math.sqrt(b) + ears(u, v) + 0.1 * Math.exp(-((u * u) / 0.07 + ((v + 0.3) ** 2) / 0.03)) + 0.07 * Math.exp(-((u * u + (v + 0.14) ** 2) / 0.007)) - 0.05 * [-1, 1].reduce((a, s) => a + Math.exp(-(((u - s * 0.3) ** 2) + (v - 0.08) ** 2) / 0.016), 0); };
    const D0 = 0.44 * KD, geo = new T.PlaneGeometry(S, S, NU, NU), pos = geo.attributes.position, colr = new Float32Array(pos.count * 3), L = new T.Vector3(-0.3, 0.8, 0.55).normalize(), n3 = new T.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / (S / 2), v = pos.getY(i) / (S / 2), d = dep(u, v) * KD, e = 0.01;
      pos.setZ(i, D0 - d);   // hollow: the nose is the deepest point
      const du = KD * (dep(u + e, v) - dep(u - e, v)) / (2 * e) / (S / 2), dv = KD * (dep(u, v + e) - dep(u, v - e)) / (2 * e) / (S / 2);
      n3.set(-du, -dv, 1).normalize(); const sh = 0.32 + 0.85 * Math.max(0, n3.dot(L));   // shaded as if it stood out
      colr[i * 3] = colr[i * 3 + 1] = colr[i * 3 + 2] = sh;
    }
    geo.setAttribute('color', new T.BufferAttribute(colr, 3)); geo.computeVertexNormals();
    const fur = c.canvasTex(512, 512, (q, w, h) => {
      const cx = w / 2, cy = h / 2, R = w / 2;
      q.fillStyle = '#d8822c'; q.beginPath(); q.ellipse(cx, cy + R * 0.02, R * 0.85, R * 0.79, 0, 0, 7); q.fill();
      [-1, 1].forEach((s) => { q.beginPath(); q.moveTo(cx + s * R * 0.22, cy - R * 0.55); q.lineTo(cx + s * R * 0.62, cy - R * 0.98); q.lineTo(cx + s * R * 0.8, cy - R * 0.3); q.fill(); q.fillStyle = '#e8a0a0'; q.beginPath(); q.moveTo(cx + s * R * 0.36, cy - R * 0.55); q.lineTo(cx + s * R * 0.6, cy - R * 0.84); q.lineTo(cx + s * R * 0.7, cy - R * 0.42); q.fill(); q.fillStyle = '#d8822c'; });
      q.strokeStyle = '#8a4a14'; q.lineWidth = 10; q.lineCap = 'round';
      [[-0.18, -0.62, -0.1, -0.32], [0, -0.66, 0, -0.34], [0.18, -0.62, 0.1, -0.32], [-0.7, -0.1, -0.45, -0.05], [0.7, -0.1, 0.45, -0.05], [-0.72, 0.12, -0.5, 0.1], [0.72, 0.12, 0.5, 0.1]].forEach(([a, b, c2, d2]) => { q.beginPath(); q.moveTo(cx + a * R, cy + b * R); q.lineTo(cx + c2 * R, cy + d2 * R); q.stroke(); });
      q.fillStyle = '#f4ecdc'; q.beginPath(); q.ellipse(cx, cy + R * 0.34, R * 0.34, R * 0.24, 0, 0, 7); q.fill();
      // one green cat's eye, and one eye flower, because it is MLow's cat now
      q.fillStyle = '#7ac83a'; q.beginPath(); q.ellipse(cx - R * 0.3, cy - R * 0.08, R * 0.13, R * 0.1, -0.2, 0, 7); q.fill(); q.fillStyle = '#111'; q.beginPath(); q.ellipse(cx - R * 0.3, cy - R * 0.08, R * 0.025, R * 0.09, 0, 0, 7); q.fill();
      K.eyeFlower(q, cx + R * 0.3, cy - R * 0.08, R * 0.17);
      q.fillStyle = '#d86a7a'; q.beginPath(); q.moveTo(cx - R * 0.07, cy + R * 0.12); q.lineTo(cx + R * 0.07, cy + R * 0.12); q.lineTo(cx, cy + R * 0.2); q.fill();
      q.strokeStyle = 'rgba(250,250,240,.9)'; q.lineWidth = 3; [-1, 1].forEach((s) => [0.26, 0.32, 0.38].forEach((y, k) => { q.beginPath(); q.moveTo(cx + s * R * 0.2, cy + R * y); q.lineTo(cx + s * R * 0.75, cy + R * (y - 0.08 + k * 0.08)); q.stroke(); }));
    });
    const mask = new T.Mesh(geo, new T.MeshBasicMaterial({ map: fur, vertexColors: true, alphaTest: 0.5, side: T.DoubleSide }));
    // it hangs on a roundel over the tables, turned to the door, so it reads from the moment you walk in
    const rd = new T.Group(); rd.position.set(14.3, 3.95, -2.3); rd.rotation.y = -0.5; g.add(rd);
    const disc = new T.Mesh(new T.CylinderGeometry(1.12, 1.12, 0.08, 40), K.std(0x2a1a10, { roughness: 0.6 })); disc.rotation.x = PI / 2; disc.position.z = -0.05; rd.add(disc);
    const rim = new T.Mesh(new T.TorusGeometry(1.12, 0.045, 8, 48), K.std(0xc8a050, { metalness: 1, roughness: 0.3 })); rim.position.z = 0.02; rd.add(rim);
    [-0.7, 0.7].forEach((dx) => { const ch = c.slab(0.02, K.H_IN - 3.95 - 0.8, 0.02, K.std(0x222222, { metalness: 0.8 }), dx, 0.8 + (K.H_IN - 3.95 - 0.8) / 2, 0); rd.add(ch); });
    mask.position.set(0, 0, 0); rd.add(mask);
    const plq = c.sign('ULYSSES. HE GOT OUT', { w: 1.1, h: 0.14, bg: '#1a120a', fg: '#e8c060', font: c.SERIF, weight: 800 }); plq.position.set(0, -1.02, 0.05); rd.add(plq);
    c.clickable(mask, () => { c.sound.meow(); c.egg('llewyn_ulysses', 'Ulysses, pressed into the wall face first. It is hollow, so it turns to watch you walk the whole room. The cat that got out still keeps an eye on the door.'); }, 'The cat over the stage');
    glow(c, rd, 0xffc890, 2.6, 0, -0.6, 0.6, 0.25);
    // the stage, in planks, with footlights along its edge and a spot cone down on the singer
    const st = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === 6 && Math.abs(o.position.z + 5.6) < 0.01 && Math.abs(o.position.y - 0.2) < 0.01);
    if (st) st.material = c.surf('planks', 1.2, 0x8a6040);
    const fl = new T.SphereGeometry(0.035, 10, 8), flm = hot(c, 0xffc070, 2.4);
    for (let k = 0; k < 15; k++) { const x = 7.2 + k * 0.4; const b = new T.Mesh(fl, flm); b.position.set(x, 0.42, -4.52); g.add(b); }
    glow(c, g, 0xffb060, 6.5, 10, 0.5, -4.4, 0.22);
    const spot = cone(c, g, 10, H6 - 0.1, -4.9, 0.12, 1.25, H6 - 0.5, 0xfff0c8, 0.16);
    glow(c, g, 0xffffff, 0.9, 10, H6 - 0.12, -4.9, 0.9);
    plane(c, g, 2.6, 2.6, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,236,200,.55)'); gr.addColorStop(1, 'rgba(255,236,200,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 10, 0.405, -5.3, { floor: true, basic: true, px: 128 });
    motes(c, r, g, { n: 140, box: [8.8, 11.2, 0.6, 5.6, -5.8, -4.2], col: 0xfff0c8, size: 0.03, op: 0.7, drift: 0.05 });
    // cigarette smoke, low and slow, the whole room deep
    haze(c, r, g, { n: 7, box: [1, 19, 2.2, 4.4, -6, 6], col: 0xd8c8b0, op: 0.12, s: [4, 7], speed: 0.12 });
    // a pressed tin ceiling, the Village basement kind
    const ceil = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === K.W && Math.abs(o.position.y - (H6 + 0.05)) < 0.01);
    if (ceil) {
      const tin = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#4a3a28'; q.fillRect(0, 0, w, h); const bev = (x, y, s2, a, b2) => { q.fillStyle = a; q.fillRect(x, y, s2, 4); q.fillRect(x, y, 4, s2); q.fillStyle = b2; q.fillRect(x, y + s2 - 4, s2, 4); q.fillRect(x + s2 - 4, y, 4, s2); }; bev(8, 8, 240, '#8a7048', '#20160c'); bev(40, 40, 176, '#20160c', '#8a7048'); q.fillStyle = '#6a5434'; q.beginPath(); q.arc(128, 128, 46, 0, 7); q.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; q.fillStyle = k % 2 ? '#8a7048' : '#2a1e12'; q.beginPath(); q.ellipse(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30, 16, 7, a, 0, 7); q.fill(); } q.fillStyle = '#9a8050'; q.beginPath(); q.arc(128, 128, 10, 0, 7); q.fill(); });
      tin.wrapS = tin.wrapT = T.RepeatWrapping; tin.repeat.set(3 / 1.25, 3 / 1.25);
      ceil.material = new T.MeshStandardMaterial({ map: tin, metalness: 0.55, roughness: 0.45, color: 0x9a8a70 });
    }
    // the floor takes the candlelight: a little more gloss on the boards, in this set only
    const floor = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === K.W && Math.abs(o.position.y + 0.05) < 0.01);
    if (floor) { floor.material = floor.material.clone(); floor.material.roughness = 0.55; floor.material.envMapIntensity = 1.4; }
    // candle flames that flicker, with pools of light on the table tops
    const cands = [[5.16, -1.12], [11.76, 0.48], [15.16, -1.12], [6.16, 3.08], [14.16, 3.08], [3.28, 6.4], [16.48, 6.4]].map(([x, z], k) => {
      const f = glow(c, g, 0xffa040, 0.32, x, 0.8, z, 1); const pool = glow(c, g, 0xff9a40, 1.3, x, 0.66, z, 0.35); return { f, pool, k };
    });
    // neon in the window of the stairwell: the club's name, the way you see it from MacDougal Street
    neon(c, g, 'the N3W Gaslight', K.W - 0.4, 4.45, -4.2, -PI / 2, { w: 3.0, h: 0.62, col: '#ffb04a', font: c.SERIF });
    neon(c, g, 'OPEN STAGE', 0.16, 4.45, -4.2, PI / 2, { w: 2.2, h: 0.45, col: '#ff4fa3', font: c.MONO });
    // the set list on an easel by the stage
    const ea = new T.Group(); ea.position.set(13.9, 0, -3.9); ea.rotation.y = -0.5; g.add(ea); const wd = K.std(0x3a2618, { roughness: 0.7 });
    [-0.3, 0.3].forEach((dx) => { const l = c.slab(0.04, 1.6, 0.04, wd, dx, 0.8, 0); l.rotation.z = -dx * 0.12; ea.add(l); }); c.post(X(13.9), -3.9, 0.4);
    const board = plane(c, ea, 0.7, 0.9, (q, w, h) => { q.fillStyle = '#1e2420'; q.fillRect(0, 0, w, h); q.strokeStyle = '#6a4a2a'; q.lineWidth = 18; q.strokeRect(0, 0, w, h); q.fillStyle = '#f0ece0'; q.textAlign = 'center'; q.font = `700 ${h * 0.07}px ${c.SERIF}`; q.fillText('TONIGHT', w / 2, h * 0.14); q.font = `600 ${h * 0.048}px ${c.MONO}`; ['1. THE HANGING SONG', '2. THE CAT ONE', '3. THE COUNT', '4. FARE THEE WELL, MLow', '', 'PASS THE HAT'].forEach((s, k) => q.fillText(s, w / 2, h * (0.28 + k * 0.1))); K.eyeFlower(q, w / 2, h * 0.88, h * 0.06); }, 0, 1.15, 0.03, { px: 384 });
    // paw prints from the cat's table to the east door: it got out
    const paw = c.canvasTex(64, 64, (q) => { q.fillStyle = 'rgba(240,230,210,.7)'; q.beginPath(); q.ellipse(32, 40, 12, 10, 0, 0, 7); q.fill(); [[18, 22], [28, 16], [38, 16], [47, 22]].forEach(([x, y]) => { q.beginPath(); q.arc(x, y, 5, 0, 7); q.fill(); }); });
    const pm = new T.MeshBasicMaterial({ map: paw, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), pg = new T.PlaneGeometry(0.12, 0.12);
    for (let k = 0; k < 18; k++) { const u = k / 17, x = 8.8 + u * 10.2, z = 1.2 + u * 2.4 + (k % 2 ? 0.08 : -0.08), m = new T.Mesh(pg, pm); m.rotation.set(-PI / 2, 0, -PI / 2 + 0.22); m.position.set(x, 0.006, z); g.add(m); }
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      cands.forEach((q) => { const f = 0.85 + Math.sin(t * 13 + q.k * 3) * 0.1 + Math.sin(t * 29 + q.k) * 0.06; q.f.scale.set(0.3 * f, 0.38 * f, 1); q.pool.material.opacity = 0.3 * f; });
      spot.material.opacity = 0.15 + Math.sin(t * 0.7) * 0.015;
    });
  },

  // ---------- The Fisher King: Grand Central, the main concourse ----------
  fisherking(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 0.95, vig: 0.45 };
    // the illusion: the way down to the tracks, a forty metre tunnel built one and a half metres deep. Every rib is smaller than the one
    // before and the floor climbs to meet the vanishing point, so from the floor it runs for ever. Walk round the side and see.
    const win = find(g, (o) => o.isMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 3.2) < 0.01 && near(o, 18.0, 1.75, -7.97)); if (win) win.visible = false;
    findAll(g, (o) => o.isGroup && (near(o, 17.5, null, -6.7) || near(o, 16.6, null, -6.3))).forEach((o, k) => o.position.set(k ? 14.6 : 15.4, o.position.y, -6.0));
    const tx = 17.75, z0 = -6.55, z1 = -7.96, NR = 16, VY = 1.45, HW = 1.3, HH = 2.0;
    const tun = new T.Group(); g.add(tun);
    const prof = []; for (let k = 0; k <= 24; k++) { const a = PI - k / 24 * PI; prof.push([Math.cos(a) * HW, HH + Math.sin(a) * HW * 0.9]); }
    const outline = [[-HW, 0], ...prof, [HW, 0]];   // floor corners, up the left wall, over the vault, down the right wall
    const ringAt = (i) => { const s = 1 / (1 + i * 0.42), zz = z0 + (z1 - z0) * (1 - s) / (1 - 1 / (1 + NR * 0.42)); return { s, zz, by: VY * (1 - s) }; };
    const tileT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#4a4438'; q.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { const n = hash(x, y); q.fillStyle = `rgb(${196 + n * 30},${188 + n * 26},${160 + n * 20})`; q.fillRect(x * 32 + (y % 2) * 16 + 2, y * 16 + 2, 28, 12); } q.fillStyle = 'rgba(60,40,20,.35)'; q.fillRect(0, h * 0.62, w, h * 0.38); });
    tileT.wrapS = tileT.wrapT = T.RepeatWrapping;
    const vp = [], uv = [], cl = [], idx = [], M = outline.length;
    for (let i = 0; i <= NR; i++) { const { s, zz, by } = ringAt(i), shade = Math.pow(s, 1.5); outline.forEach(([px, py], j) => { vp.push(tx + px * s, by + py * s, zz); uv.push(j / (M - 1) * 6, i * 0.7); const lit = shade * (i % 2 ? 0.92 : 1); cl.push(lit, lit * 0.96, lit * 0.86); }); }
    for (let i = 0; i < NR; i++) for (let j = 1; j < M - 2; j++) { const a = i * M + j, b = a + 1, c2 = a + M, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const shell = new T.BufferGeometry(); shell.setAttribute('position', new T.Float32BufferAttribute(vp, 3)); shell.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); shell.setAttribute('color', new T.Float32BufferAttribute(cl, 3)); shell.setIndex(idx);
    tun.add(new T.Mesh(shell, new T.MeshBasicMaterial({ map: tileT, vertexColors: true, side: T.DoubleSide })));
    // the track bed: two rails and the sleepers, converging
    const bedT = c.canvasTex(128, 256, (q, w, h) => { q.fillStyle = '#2a2622'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { q.fillStyle = '#4a3624'; q.fillRect(14, y, w - 28, 12); } q.fillStyle = '#c8ccd4'; q.fillRect(36, 0, 6, h); q.fillRect(w - 42, 0, 6, h); q.fillStyle = '#d8b040'; q.fillRect(2, 0, 4, h); });
    bedT.wrapT = T.RepeatWrapping;
    const bp = [], bu = [], bc = [], bi = [];
    for (let i = 0; i <= NR; i++) { const { s, zz, by } = ringAt(i), sh = Math.pow(s, 1.5); bp.push(tx - HW * s, by + 0.004, zz, tx + HW * s, by + 0.004, zz); bu.push(0, i, 1, i); bc.push(sh, sh, sh, sh, sh, sh); }
    for (let i = 0; i < NR; i++) { const a = i * 2; bi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const bed = new T.BufferGeometry(); bed.setAttribute('position', new T.Float32BufferAttribute(bp, 3)); bed.setAttribute('uv', new T.Float32BufferAttribute(bu, 2)); bed.setAttribute('color', new T.Float32BufferAttribute(bc, 3)); bed.setIndex(bi);
    tun.add(new T.Mesh(bed, new T.MeshBasicMaterial({ map: bedT, vertexColors: true, side: T.DoubleSide })));
    // a lamp on every other rib, smaller and smaller, and the far end dark until the train comes
    const lampM = hot(c, 0xffe0a0, 2.2), lg = new T.SphereGeometry(0.06, 10, 8);
    for (let i = 1; i < NR; i++) { const { s, zz, by } = ringAt(i); [-1, 1].forEach((sd) => { const m = new T.Mesh(lg, lampM); m.scale.setScalar(s); m.position.set(tx + sd * HW * 0.92 * s, by + HH * 0.9 * s, zz + 0.01); tun.add(m); glow(c, tun, 0xffd890, 0.7 * s, m.position.x, m.position.y, zz + 0.02, 0.7); }); }
    const end = ringAt(NR), endDisc = new T.Mesh(new T.CircleGeometry(HW * end.s * 1.05, 24), new T.MeshBasicMaterial({ color: 0x050505 })); endDisc.position.set(tx, end.by + HH * end.s * 0.8, z1 + 0.005); tun.add(endDisc);
    const head = glow(c, tun, 0xfff4d0, 0.1, tx, VY + 0.02, z1 + 0.03, 1);
    // the mouth: a carved frame and its name, and the plain sides that give the trick away
    const stone = c.surf('marble', 1.2, 0xd8ccb0), mouth = new T.Group(); mouth.position.set(tx, 0, z0 + 0.04); tun.add(mouth);
    mouth.add(c.slab(0.3, HH + 0.2, 0.18, stone, -HW - 0.15, (HH + 0.2) / 2, 0)); mouth.add(c.slab(0.3, HH + 0.2, 0.18, stone, HW + 0.15, (HH + 0.2) / 2, 0));
    mouth.add(c.slab(HW * 2 + 0.6, 0.5, 0.18, stone, 0, HH + HW * 0.9 + 0.3, 0));
    const arch = new T.Mesh(new T.TorusGeometry(HW + 0.08, 0.1, 8, 32, PI), K.std(0xc8a050, { metalness: 1, roughness: 0.3 })); arch.scale.y = 0.9; arch.position.set(0, HH, 0.06); mouth.add(arch);
    const nm = c.sign('TRACK 61', { w: 1.5, h: 0.3, bg: '#1a120a', fg: '#e8c060', font: c.SERIF, weight: 800, border: '#c8a050' }); nm.position.set(0, HH + HW * 0.9 + 0.3, 0.1); mouth.add(nm);
    [-1, 1].forEach((sd) => { const side = c.slab(0.12, HH + HW, z0 - z1, stone, tx + sd * (HW + 0.24), (HH + HW) / 2, (z0 + z1) / 2); g.add(side); });
    g.add(c.slab(HW * 2 + 0.6, 0.12, z0 - z1, stone, tx, HH + HW * 0.9 + 0.55, (z0 + z1) / 2));
    c.wall(X(tx - HW - 0.3), z0 + 0.12, X(tx + HW + 0.3), z0 + 0.12);
    c.clickable(tun, () => { c.sound.whoosh(0.3, 1.2); c.egg('fisherking_track61', 'Track 61 runs forty metres under the Waldorf. Here it is a metre and a half deep: every arch smaller than the last, and the floor climbing to meet them. MLow built the rest out of perspective.'); }, 'The way to the tracks');
    // the great windows on the south wall, and the beams of sun that come through them across the concourse
    const winT = c.canvasTex(256, 384, (q, w, h) => { q.fillStyle = '#fff4dc'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2a14'; for (let x = 0; x <= 6; x++) q.fillRect(x * (w - 8) / 6, 0, 8, h); for (let y = 0; y <= 9; y++) q.fillRect(0, y * (h - 8) / 9, w, 8); q.globalCompositeOperation = 'destination-in'; q.beginPath(); q.moveTo(0, h); q.lineTo(0, w / 2); q.arc(w / 2, w / 2, w / 2, PI, 0); q.lineTo(w, h); q.fill(); });
    [5.0, 10, 15.0].forEach((x) => { const m = new T.Mesh(new T.PlaneGeometry(2.0, 3.0), new T.MeshBasicMaterial({ map: winT, transparent: true, toneMapped: false, color: new T.Color(1.5, 1.4, 1.2) })); m.position.set(x, 4.45, 7.86); m.rotation.y = PI; g.add(m);
      beam(c, g, x, 5.4, 7.6, [0.12, -0.5, -0.86], 1.8, 12.5, 0xffe8b8, 0.085); });
    motes(c, r, g, { n: 260, box: [2, 18, 0.5, 5.5, -6, 7.5], col: 0xffe8c0, size: 0.035, op: 0.6, drift: 0.06 });
    // the booth in real marble, an INFORMATION band in gold, and the clock lit from inside
    findAll(g, (o) => o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop === 1.5 && o.geometry.parameters.radiusBottom === 1.6).forEach((o) => { o.material = c.surf('marble', 0.8, 0xe8dcc0); });
    const band = c.canvasTex(1024, 64, (q, w, h) => { q.fillStyle = '#1a120a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f0c860'; q.font = `700 40px ${c.SERIF}`; q.textBaseline = 'middle'; for (let k = 0; k < 3; k++) q.fillText('INFORMATION  ·  N3W YORKERS  ·  ', k * w / 3 + 10, h / 2 + 2); });
    band.wrapS = T.RepeatWrapping;
    const ring = new T.Mesh(new T.CylinderGeometry(1.63, 1.63, 0.2, 48, 1, true), new T.MeshBasicMaterial({ map: band, toneMapped: false, color: new T.Color(1.4, 1.3, 1.1) })); ring.position.set(10, 1.33, -1.6); g.add(ring);
    findAll(g, (o) => o.isMesh && o.geometry.type === 'CircleGeometry' && Math.abs(o.geometry.parameters.radius - 0.33) < 1e-3).forEach((o) => o.material.color.setScalar(1.35));
    glow(c, g, 0xfff0c8, 2.2, 10, 3.05, -1.6, 0.4);
    // the ceiling's own lit stars: fifty nine of them in the real one
    const NS = 59, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) { sp[k * 3] = 0.6 + Math.random() * 18.8; sp[k * 3 + 1] = H6 - 0.08; sp[k * 3 + 2] = -7.4 + Math.random() * 14.8; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    const stars = [0, 1].map((k) => { const m = new T.PointsMaterial({ map: dotTex(c), color: new T.Color(2.2, 1.9, 1.2), size: 0.16, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending }); const p = new T.Points(sg, m); p.geometry.setDrawRange(k * 30, 30); p.frustumCulled = false; g.add(p); return m; });
    // commuters in hats, a briefcase for every third one
    const fed = new T.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.7 }), crown = new T.CylinderGeometry(0.15, 0.17, 0.16, 16), brim = new T.CylinderGeometry(0.3, 0.3, 0.02, 20);
    const caseG = new T.BoxGeometry(0.42, 0.3, 0.1), caseM = new T.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.5 });
    findAll(g, (o) => o.isGroup && o.userData.head && o.parent === g).forEach((e, k) => {
      if (k % 2 === 0) { const h1 = new T.Mesh(crown, fed); h1.position.y = 1.93; e.add(h1); const h2 = new T.Mesh(brim, fed); h2.position.y = 1.86; e.add(h2); }
      if (k % 3 === 0) { const b = new T.Mesh(caseG, caseM); b.position.set(0.28, 0.5, 0); b.rotation.y = PI / 2; e.add(b); }
    });
    // the departures board glows a little brighter
    findAll(g, (o) => o.isMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 4.4) < 0.01 && Math.abs(o.geometry.parameters.height - 1.38) < 0.01).forEach((o) => o.material.color.setScalar(1.25));
    let train = 9;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      stars[0].opacity = 0.65 + Math.sin(t * 2.1) * 0.35; stars[1].opacity = 0.65 + Math.sin(t * 1.7 + 2) * 0.35;
      // a train comes up the tunnel every so often: the headlight swells from a point to the whole mouth
      train -= dt; const u = train < 0 ? Math.min(1, -train / 3.2) : 0; head.scale.setScalar(0.12 + u * u * 3.4); head.material.opacity = 0.4 + u * 0.6;
      if (train < -3.2) { train = 14 + Math.random() * 8; c.sound.whoosh(0.25, 0.9); }
    });
  },
  // ---------- Wait Until Dark: the basement flat, St. Luke's Place ----------
  // Everything new here dims with the three bulbs, so the dark stays as dark as the set needs it.
  waituntildark(c, r, g, X, K) {
    const T = c.THREE;
    r.post = { ...r.post, bloom: 0.9, vig: 0.62 };
    const bulbs = findAll(g, (o) => o.isMesh && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - 0.09) < 1e-3 && Math.abs(o.position.y - 3.1) < 0.01);
    const inner = find(g, (o) => o.isMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 0.68) < 1e-3 && Math.abs(o.geometry.parameters.height - 1.5) < 1e-3);
    // the illusion: shadows that belong to somebody else. A paper screen lit from behind: on it, a man with a raised knife and
    // a woman with a cane. Walk round the back and it is a coat stand, an umbrella and a lamp. They lean as the lamp sways.
    const scr = new T.Group(); scr.position.set(14.3, 0, -0.7); scr.rotation.y = -0.6; g.add(scr);
    const paperT = c.canvasTex(768, 512, (q, w, h) => {
      const gr = q.createRadialGradient(w * 0.5, h * 0.62, 20, w * 0.5, h * 0.6, w * 0.6); gr.addColorStop(0, '#fff2d0'); gr.addColorStop(1, '#a8743a'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.save(); q.filter = 'blur(6px)'; q.fillStyle = 'rgba(30,18,8,.9)';
      const fig = (cx, s, draw) => { q.save(); q.translate(cx, h); q.scale(s, s); draw(); q.restore(); };
      fig(w * 0.3, 1.0, () => {   // Roat: hat, coat, the raised knife
        q.beginPath(); q.ellipse(0, -400, 30, 36, 0, 0, 7); q.fill(); q.fillRect(-56, -432, 112, 14); q.fillRect(-32, -470, 64, 44);
        q.beginPath(); q.moveTo(-60, -360); q.lineTo(60, -360); q.lineTo(78, -150); q.lineTo(50, 0); q.lineTo(14, 0); q.lineTo(0, -120); q.lineTo(-14, 0); q.lineTo(-50, 0); q.lineTo(-78, -150); q.fill();
        q.beginPath(); q.moveTo(50, -350); q.lineTo(130, -440); q.lineTo(150, -425); q.lineTo(70, -330); q.fill(); q.beginPath(); q.moveTo(135, -440); q.lineTo(185, -500); q.lineTo(150, -428); q.fill();
      });
      fig(w * 0.74, 0.9, () => {  // Susy: head, dress, her cane out in front
        q.beginPath(); q.ellipse(0, -405, 28, 34, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(0, -425, 40, 26, 0, 0, 7); q.fill();
        q.beginPath(); q.moveTo(-42, -365); q.lineTo(42, -365); q.lineTo(70, -60); q.lineTo(40, 0); q.lineTo(-40, 0); q.lineTo(-70, -60); q.fill();
        q.save(); q.translate(40, -250); q.rotate(-0.5); q.fillRect(0, 0, 7, 290); q.restore(); q.fillRect(-48, -330, 96, 10);
      });
      q.restore();
      q.fillStyle = '#3a2410'; for (let k = 0; k <= 3; k++) q.fillRect(k * (w - 10) / 3, 0, 10, h); q.fillRect(0, 0, w, 10); q.fillRect(0, h - 10, w, 10);
      q.fillStyle = 'rgba(58,36,16,.6)'; for (let y = 1; y < 4; y++) q.fillRect(0, y * h / 4, w, 3); for (let x = 1; x < 9; x++) if (x % 3) q.fillRect(x * w / 9, 0, 3, h);
    });
    const paper = new T.MeshBasicMaterial({ map: paperT, side: T.DoubleSide, toneMapped: false }); paper.color.setScalar(1.15);
    const PW = 0.9, PH = 1.95, ang = [0.35, 0, -0.35];
    [-1, 0, 1].forEach((k, i) => {
      const pg = new T.PlaneGeometry(PW, PH); const uv = pg.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (uv.getX(j) + i) / 3);
      const pn = new T.Mesh(pg, paper); pn.position.set(k * PW * 0.97, PH / 2 + 0.06, Math.abs(k) * 0.14); pn.rotation.y = ang[i]; scr.add(pn);
    });
    c.post(X(14.3), -0.7, 0.75); c.post(X(14.3 - 0.85), -0.7 - 0.55, 0.45); c.post(X(14.3 + 0.85), -0.7 + 0.55, 0.45);
    glow(c, scr, 0xffd8a0, 4.2, 0, 1.0, 0.25, 0.22);
    // behind it, what is really there: a lamp on the floor, a coat stand, an umbrella in its stand
    const back = new T.Group(); back.position.set(0, 0, -0.9); scr.add(back); const dk = K.std(0x2a1a10, { roughness: 0.6 });
    const cs = new T.Group(); cs.position.set(-0.55, 0, 0.3); back.add(cs);
    cs.add(c.slab(0.05, 1.85, 0.05, dk, 0, 0.925, 0)); [0, 1, 2].forEach((k) => { const l = c.slab(0.04, 0.5, 0.04, dk, Math.cos(k * 2.1) * 0.16, 0.15, Math.sin(k * 2.1) * 0.16); l.rotation.set(Math.sin(k * 2.1) * 0.6, 0, -Math.cos(k * 2.1) * 0.6); cs.add(l); });
    const coat = new T.Mesh(new T.CylinderGeometry(0.1, 0.3, 1.1, 12, 1, true), K.std(0x4a3a2a, { roughness: 0.9, side: T.DoubleSide })); coat.position.set(0.08, 1.15, 0.05); cs.add(coat);
    const hat = new T.Mesh(new T.CylinderGeometry(0.13, 0.14, 0.12, 16), K.std(0x1a1a1a)); hat.position.y = 1.92; cs.add(hat); const brim = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.015, 18), K.std(0x1a1a1a)); brim.position.y = 1.86; cs.add(brim);
    const us = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.5, 14, 1, true), K.std(0x6a5a40, { metalness: 0.6, side: T.DoubleSide })); us.position.set(0.7, 0.25, 0.35); back.add(us);
    const umb = c.slab(0.025, 0.95, 0.025, K.std(0x111111), 0.72, 0.6, 0.35); umb.rotation.z = -0.12; back.add(umb);
    const lampB = new T.Mesh(new T.SphereGeometry(0.07, 12, 10), hot(c, 0xfff0d0, 2.4)); lampB.position.set(0.05, 0.25, -0.5); back.add(lampB); back.add(c.slab(0.2, 0.18, 0.2, K.std(0x3a3632, { metalness: 0.5 }), 0.05, 0.09, -0.5));
    const lampG = glow(c, back, 0xffe0b0, 1.4, 0.05, 0.3, -0.5, 0.7);
    const pairs = [scr];
    c.clickable(scr, () => { c.sound.screech(); c.egg('waituntildark_shadows', 'A coat stand throws a man with a knife, an umbrella throws a woman with a cane. In this flat the shadows know who is coming down the steps before she does. MLow hangs his hat somewhere else.'); }, 'A paper screen');
    // a cone of light under each bulb, with the dust turning in it
    const cones = bulbs.map((b) => cone(c, g, b.position.x, 3.05, b.position.z, 0.06, 1.5, 3.0, 0xffe6b8, 0.045));
    motes(c, r, g, { n: 120, box: [3, 17, 0.3, 3, -3.5, 2.5], col: 0xffe8c8, size: 0.03, op: 0.5, drift: 0.05 });
    // the refrigerator's cold light, the last light in the flat
    const fz = glow(c, g, 0xcfe6ff, 3.2, 17.6, 1.0, -4.8, 0.45); const fzp = plane(c, g, 2.2, 2.6, (q, w, h) => { const gr = q.createRadialGradient(w / 2, 0, 0, w / 2, 0, h); gr.addColorStop(0, 'rgba(200,226,255,.5)'); gr.addColorStop(1, 'rgba(200,226,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 17.6, 0.007, -4.0, { floor: true, basic: true, px: 128 });
    fzp.material.blending = T.AdditiveBlending;
    // the darkroom safelight glows red over the bench
    const safe = find(g, (o) => o.isMesh && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - 0.07) < 1e-3 && Math.abs(o.position.y - 2.7) < 0.01);
    let red = null; if (safe) { safe.material = hot(c, 0xff2010, 1.2); red = glow(c, safe.parent, 0xff3020, 0.45, 0, 2.7, 0.05, 0.4); }
    // cars on Seventh Avenue: their headlights sweep through the blinds and across the ceiling, dark or not
    const blindT = c.canvasTex(64, 256, (q, w, h) => { for (let y = 0; y < h; y += 16) { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,250,230,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, y, w, 9); } });
    const sweep = new T.Mesh(new T.PlaneGeometry(2.2, 9), new T.MeshBasicMaterial({ map: blindT, color: 0xfff0d0, opacity: 0, ...add(T), fog: false })); sweep.rotation.x = PI / 2; sweep.rotation.z = 0.5; sweep.position.y = K.H_IN - 0.06; g.add(sweep);
    // a cast iron radiator under the south pictures, a sink with a drip by the stove
    const iron = K.std(0x3a3632, { metalness: 0.5, roughness: 0.6 }), fin = new T.InstancedMesh(new T.BoxGeometry(0.06, 0.7, 0.18), iron, 22), m4 = new T.Matrix4();
    for (let k = 0; k < 22; k++) { m4.makeTranslation(5.6 + k * 0.075, 0.42, 7.78); fin.setMatrixAt(k, m4); } g.add(fin); c.wall(X(5.5), 7.6, X(7.3), 7.6);
    const sink = new T.Group(); sink.position.set(19.3, 0, -0.6); g.add(sink); sink.add(c.slab(0.6, 0.88, 0.8, K.std(0xe8e4d8, { roughness: 0.3 }), 0, 0.44, 0)); sink.add(c.slab(0.5, 0.06, 0.6, K.std(0xc8ccd0, { metalness: 0.8, roughness: 0.25 }), 0, 0.89, 0)); c.post(X(19.3), -0.6, 0.45);
    const tap = c.slab(0.03, 0.3, 0.03, K.std(0xc8ccd0, { metalness: 1, roughness: 0.2 }), 0.2, 1.05, 0); sink.add(tap); const spout = c.slab(0.18, 0.03, 0.03, K.std(0xc8ccd0, { metalness: 1, roughness: 0.2 }), 0.12, 1.19, 0); sink.add(spout);
    const drop = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), K.std(0xd8f0ff, { roughness: 0.05, metalness: 0.2 })); sink.add(drop); let dropY = 1.17;
    c.clickable(sink, () => { c.sound.drip(); c.toast('Drip. Drip. You can find a whole flat by its sounds, if you have had the practice.', 2600); }, 'The sink');
    // prints that fell off the line, a strip of negatives, cobwebs in the corners
    for (let k = 0; k < 5; k++) { const m = plane(c, g, 0.22, 0.28, (q, w, h) => { q.fillStyle = '#efeee8'; q.fillRect(0, 0, w, h); q.fillStyle = '#222'; q.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.7); K.eyeFlower(q, w / 2, h * 0.43, w * 0.25, '#cfcfcf', '#7a7a7a'); }, 7.2 + Math.random() * 1.6, 0.007, 1.2 + Math.random() * 1.2, { floor: true, px: 128 }); m.rotation.z = Math.random() * 6; }
    const neg = plane(c, g, 0.16, 1.1, (q, w, h) => { q.fillStyle = '#2a1a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#d8a860'; for (let y = 0; y < h; y += 14) { q.fillRect(4, y + 3, 6, 6); q.fillRect(w - 10, y + 3, 6, 6); } q.fillStyle = 'rgba(255,220,170,.55)'; for (let k = 0; k < 5; k++) q.fillRect(16, 10 + k * h / 5, w - 32, h / 5 - 20); }, 4.6, 1.75, 0.6, { px: 256 });
    neg.material.side = T.DoubleSide; neg.rotation.y = 0.3;
    const web = c.canvasTex(256, 256, (q, w, h) => { q.strokeStyle = 'rgba(220,220,220,.35)'; q.lineWidth = 1.5; for (let k = 0; k < 9; k++) { const a = k / 8 * PI / 2; q.beginPath(); q.moveTo(0, 0); q.lineTo(Math.cos(a) * w, Math.sin(a) * h); q.stroke(); } for (let rr = 30; rr < 250; rr += 26) { q.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * PI / 2, x = Math.cos(a) * rr, y = Math.sin(a) * rr; k ? q.quadraticCurveTo(Math.cos(a - 0.1) * rr * 0.92, Math.sin(a - 0.1) * rr * 0.92, x, y) : q.moveTo(x, y); } q.stroke(); } });
    const webM = new T.MeshBasicMaterial({ map: web, transparent: true, depthWrite: false, side: T.DoubleSide });
    [[0.15, -7.85, 0], [19.6, -7.85, PI / 2], [0.15, 7.85, -PI / 2], [19.6, 7.85, PI]].forEach(([x, z, a]) => { const m = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), webM); m.position.set(x + (x < 10 ? 0.4 : -0.4), K.H_IN - 0.4, z + (z < 0 ? 0.4 : -0.4)); m.rotation.set(0, a + PI / 4, 0); m.rotation.order = 'YXZ'; m.rotation.x = 0; g.add(m); });
    let car = 4;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const on = bulbs.filter((b) => b.visible).length, k = on / 3, fr = inner ? inner.visible : true;
      cones.forEach((m, i) => { m.visible = bulbs[i].visible; m.rotation.z = Math.sin(t * 0.8 + i) * 0.04; });
      paper.color.setScalar(0.08 + 1.07 * k); lampB.visible = lampG.visible = on > 0;
      fz.visible = fzp.visible = fr; if (red) red.visible = on > 0; if (safe) safe.material.color.setRGB(on ? 1.2 : 0.2, on ? 0.12 : 0.02, on ? 0.06 : 0.01);
      car -= dt; const u = car < 0 ? -car / 2.4 : -1; if (u >= 0 && u <= 1) { sweep.position.set(-1 + u * 22, K.H_IN - 0.06, -3.0 + u * 3); sweep.material.opacity = Math.sin(u * PI) * 0.22; } else sweep.material.opacity = 0; if (car < -2.4) car = 8 + Math.random() * 7;
      dropY -= dt * (dropY < 1.16 ? 2.5 : 0.04); if (dropY < 0.9) { dropY = 1.17; } drop.position.set(0.04, dropY, 0);
    });
  },

  // ---------- Tootsie: Studio 8, Southwest General ----------
  tootsie(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 1.0, vig: 0.5 };
    // the illusion: a hybrid picture. Up close the board says DOROTHY in fine sharp lines; walk back to the door and the fine lines melt
    // into grey and a soft MICHAEL comes up out of it. Same board, same person, depending on how far away you stand.
    const hyb = c.canvasTex(1024, 704, (q, w, h) => {
      q.fillStyle = '#9a9692'; q.fillRect(0, 0, w, h);
      q.filter = 'blur(17px)'; q.fillStyle = '#2a2624'; q.font = `900 ${h * 0.4}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('MICHAEL', w / 2, h * 0.5);
      q.filter = 'blur(40px)'; q.fillStyle = '#d8d2cc'; q.fillRect(0, 0, w, h * 0.08); q.fillRect(0, h * 0.92, w, h * 0.08); q.filter = 'none';
      // DOROTHY: letters filled with fine black and white lines that average out to the grey of the board
      const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mq = mc.getContext('2d');
      mq.fillStyle = '#fff'; mq.font = `900 ${h * 0.27}px ${c.SERIF}`; mq.textAlign = 'center'; mq.textBaseline = 'middle'; mq.fillText('DOROTHY', w / 2, h * 0.5);
      mq.lineWidth = 6; mq.strokeStyle = '#fff'; mq.strokeRect(w * 0.06, h * 0.12, w * 0.88, h * 0.76);
      // added to the soft picture, not painted over it: the fine lines carry no average of their own, so far away only MICHAEL is left
      const base = q.getImageData(0, 0, w, h), md = mq.getImageData(0, 0, w, h).data, bd = base.data;
      for (let y = 0; y < h; y++) { const sgn = ((y >> 1) & 1) ? -1 : 1; for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, m = md[o + 3] / 255; if (m < 0.02) continue; const d2 = sgn * 62 * m; bd[o] = Math.max(0, Math.min(255, bd[o] + d2)); bd[o + 1] = Math.max(0, Math.min(255, bd[o + 1] + d2)); bd[o + 2] = Math.max(0, Math.min(255, bd[o + 2] + d2)); } }
      q.putImageData(base, 0, 0);
      // her glasses, the same way: sharp red rims only up close
      q.strokeStyle = 'rgba(200,16,46,.9)'; q.lineWidth = 3; [[w * 0.42, h * 0.2], [w * 0.58, h * 0.2]].forEach(([x, y]) => { q.beginPath(); q.ellipse(x, y, 34, 28, 0, 0, 7); q.stroke(); }); q.beginPath(); q.moveTo(w * 0.42 + 34, h * 0.2); q.lineTo(w * 0.58 - 34, h * 0.2); q.stroke();
      q.fillStyle = '#1a1a1a'; q.font = `600 18px ${c.MONO}`; q.fillText('SOUTHWEST GENERAL. N3W TV. STARRING A NEW YORKER. BY MLow', w / 2, h * 0.86);
    });
    const fl = new T.Group(); fl.position.set(16.3, 0, 0.5); fl.rotation.y = -0.86; g.add(fl);
    const board = new T.Mesh(new T.PlaneGeometry(2.7, 1.86), new T.MeshStandardMaterial({ map: hyb, roughness: 0.85 })); board.position.y = 1.55; fl.add(board);
    const bk = c.slab(2.8, 1.96, 0.05, K.std(0x1a1a1a, { roughness: 0.7 }), 0, 1.55, -0.03); fl.add(bk);
    [-1.15, 1.15].forEach((dx) => { fl.add(c.slab(0.05, 0.62, 0.05, K.std(0x2a2a2e, { metalness: 0.7 }), dx, 0.31, -0.05)); fl.add(c.slab(0.05, 0.05, 0.7, K.std(0x2a2a2e, { metalness: 0.7 }), dx, 0.03, -0.05)); });
    c.post(X(16.3), 0.5, 1.1); c.post(X(16.3 - 0.75), 0.5 - 0.55, 0.6); c.post(X(16.3 + 0.75), 0.5 + 0.55, 0.6);
    c.clickable(board, () => { c.sound.applause(2); c.egg('tootsie_hybrid', 'Up close the board says Dorothy. Walk back to the door and it says Michael. Same board, same New Yorker, it only depends how far away you stand. MLow stands in the middle.'); }, 'A studio board');
    // the lighting grid: two pipes the width of the studio, a row of lamps on each, some of them on
    const pipe = K.std(0x1a1a1c, { metalness: 0.8, roughness: 0.4 }), lampG = new T.CylinderGeometry(0.13, 0.16, 0.34, 14), lampM = K.std(0x222226, { metalness: 0.6, roughness: 0.5 });
    [-1.4, -5.8].forEach((z) => g.add(c.slab(17, 0.07, 0.07, pipe, 10, 5.45, z)));
    const lit = [];
    [-1.4, -5.8].forEach((z, j) => { for (let k = 0; k < 9; k++) { const x = 2.4 + k * 1.9, l = new T.Mesh(lampG, lampM); l.position.set(x, 5.2, z); l.rotation.x = j ? 0.5 : -0.5; g.add(l); if ((k + j) % 3 === 0) { const f = new T.Mesh(new T.CircleGeometry(0.12, 16), hot(c, 0xfff4dc, 2.4)); f.position.set(0, -0.18, 0); f.rotation.x = PI / 2; l.add(f); lit.push([x, z, j]); } } });
    lit.forEach(([x, z, j]) => { const cn = cone(c, g, x, 5.05, z, 0.12, 1.1, 4.6, 0xfff2dc, 0.07); cn.rotation.x = j ? 0.45 : -0.45; glow(c, g, 0xfff4dc, 0.8, x, 5.02, z, 0.8); });
    haze(c, r, g, { n: 6, box: [3, 17, 2.6, 4.6, -7, 1], col: 0xe8e8f0, op: 0.09, s: [5, 8], speed: 0.1 });
    motes(c, r, g, { n: 160, box: [4, 16, 0.4, 5, -7, -1], col: 0xfff6e8, size: 0.03, op: 0.55, drift: 0.05 });
    // a pool of hard light on the hospital bed, and glossy black floor under the set
    { const bf = plane(c, g, 9, 5, (q, w, h) => { q.fillStyle = '#141416'; q.fillRect(0, 0, w, h); }, 10, 0.005, -5.1, { floor: true, rough: 0.22, px: 64 }); bf.material.envMapIntensity = 0.25; }
    plane(c, g, 3.2, 3.4, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,248,232,.5)'); gr.addColorStop(1, 'rgba(255,248,232,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 10, 0.01, -4.6, { floor: true, basic: true, px: 128 }).material.blending = T.AdditiveBlending;
    // spike tape and camera marks on the studio floor
    const tape = (x, z, col, a) => { const m = new T.Mesh(new T.PlaneGeometry(0.34, 0.05), new T.MeshBasicMaterial({ color: col })); m.rotation.set(-PI / 2, 0, a); m.position.set(x, 0.008, z); g.add(m); const n = m.clone(); n.rotation.z = a + PI / 2; n.position.x += 0; g.add(n); };
    [[8.4, -2.6, 0xf5c542], [11.6, -2.6, 0x22d3ee], [10, -1.9, 0xff4fa3], [13.2, 1.8, 0xf5c542], [6.6, 1.2, 0x22d3ee]].forEach(([x, z, col], k) => tape(x, z, col, k * 0.3));
    plane(c, g, 0.9, 0.3, (q, w, h) => { q.fillStyle = '#f5c542'; q.font = `800 ${h * 0.7}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('CAM 2', w / 2, h / 2); }, 13.8, 0.008, 4.55, { floor: true, px: 96 });
    // the boom over the bed, and its operator; the floor manager with her headset
    const boomP = new T.Group(); boomP.position.set(12.4, 0, -3.0); g.add(boomP); const op = K.extra(boomP, 0, 0, { col: 0x2a2a34, ry: -0.9 }); c.post(X(12.4), -3.0, 0.35);
    const pole = c.slab(3.0, 0.035, 0.035, K.std(0x9a9aa0, { metalness: 0.8, roughness: 0.3 }), -1.2, 2.6, -0.6); pole.rotation.set(0, -0.45, 0.22); boomP.add(pole);
    const mic = new T.Mesh(new T.CapsuleGeometry(0.06, 0.3, 4, 10), K.std(0x2a2a2a, { roughness: 0.9 })); mic.rotation.z = PI / 2; mic.position.set(-2.55, 2.95, -1.3); boomP.add(mic);
    const fm = K.extra(g, 6.6, 3.4, { col: 0x8a2a3a, ry: 2.2 }); c.post(X(6.6), 3.4, 0.3); const set = new T.Mesh(new T.TorusGeometry(0.2, 0.02, 6, 20, PI), K.std(0x111111)); set.position.y = 1.62; fm.add(set);
    // the studio clock counting down to air, in red figures
    const ct = c.canvasTex(256, 96, () => {}), cq = ct.userData.canvas.getContext('2d');
    const clk = new T.Mesh(new T.PlaneGeometry(1.2, 0.45), new T.MeshBasicMaterial({ map: ct, toneMapped: false })); clk.position.set(0.16, 3.6, -1.0); clk.rotation.y = PI / 2; g.add(clk);
    const drawClk = (s) => { cq.fillStyle = '#100404'; cq.fillRect(0, 0, 256, 96); cq.fillStyle = '#ff3a2a'; cq.font = `700 56px ${c.MONO}`; cq.textAlign = 'center'; cq.textBaseline = 'middle'; cq.fillText(s, 128, 50); cq.font = `700 14px ${c.MONO}`; cq.fillText('ON AIR IN', 128, 12); ct.needsUpdate = true; };
    clk.material.color.setScalar(1.6); drawClk('00:30');
    // the vanity bulbs and the ON AIR sign burn hotter
    findAll(g, (o) => o.isMesh && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - 0.035) < 1e-3).forEach((o) => { o.material = hot(c, 0xfff0c8, 2.2); });
    const onair = find(g, (o) => o.isMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 1.6) < 1e-3 && Math.abs(o.geometry.parameters.height - 0.42) < 1e-3); if (onair) onair.material.color.setScalar(1.9);
    glow(c, g, 0xff3030, 2.2, 10, 4.6, -7.7, 0.35);
    // a catwalk over the studio, with the crew's work lights
    const truss = K.std(0x2a2a2e, { metalness: 0.7, roughness: 0.4 });
    [-0.35, 0.35].forEach((dz) => g.add(c.slab(17, 0.06, 0.06, truss, 10, 5.75, 3.4 + dz))); for (let x = 1.6; x <= 18.4; x += 0.8) { const d = c.slab(0.03, 0.03, 0.7, truss, x, 5.75, 3.4); g.add(d); }
    [4, 10, 16].forEach((x) => { const w = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), hot(c, 0xff8a40, 2.0)); w.position.set(x, 5.65, 3.4); g.add(w); glow(c, g, 0xff9a50, 0.9, x, 5.6, 3.4, 0.6); });
    let sec = 30, acc = 0;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; acc += dt; if (acc >= 1) { acc = 0; sec = sec > 0 ? sec - 1 : 30; drawClk(sec ? `00:${String(sec).padStart(2, '0')}` : 'ON AIR'); } });
  },

  // ---------- Inside Man: Manhattan Trust, Wall Street ----------
  insideman(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 0.9, vig: 0.45 };
    // the illusion: the perfect plan, as a lobby sculpture. Three brass beams that close into an impossible triangle, but only
    // from the brass disc on the floor. Step off it and the plan comes apart in the air.
    const C = new T.Vector3(10, 1.62, 4.6), S = new T.Vector3(10, 4.0, -2.0), L = 2.0, t2 = 0.3;
    const w = S.clone().sub(C).normalize(), p = new T.Vector3().crossVectors(w, new T.Vector3(0, 1, 0)).normalize(), q = new T.Vector3().crossVectors(p, w);
    const th0 = PI * 4 / 3, E = [0, 1, 2].map((i) => { const a = th0 + i * PI * 2 / 3; return w.clone().multiplyScalar(1 / Math.sqrt(3)).addScaledVector(p, Math.sqrt(2 / 3) * Math.cos(a)).addScaledVector(q, Math.sqrt(2 / 3) * Math.sin(a)); });
    const tone = [new T.MeshBasicMaterial({ color: 0xf2d68a }), new T.MeshBasicMaterial({ color: 0xb48a3a }), new T.MeshBasicMaterial({ color: 0x5a4018 })];
    const pen = new T.Group(); g.add(pen); let at = S.clone(); const pts = [S.clone()];
    E.forEach((d, i) => {
      const a = E[(i + 1) % 3], b = new T.Vector3().crossVectors(d, a), geo = new T.BoxGeometry(t2, t2, L + t2);
      // faces: +-x look along a, +-y along b, +-z along d; colour each by which axis it faces so every beam shades alike
      const ax = [(i + 1) % 3, (i + 1) % 3, -1, -1, i, i], mats = ax.map((k) => k >= 0 ? tone[k] : null);
      const third = 3 - i - (i + 1) % 3; mats[2] = mats[3] = tone[third];
      const m = new T.Mesh(geo, mats); m.matrixAutoUpdate = false;
      const mid = at.clone().addScaledVector(d, L / 2); m.matrix.makeBasis(a, b, d).setPosition(mid); pen.add(m);
      at = at.clone().addScaledVector(d, L); pts.push(at.clone());
    });
    // hung on fine cables from the coffers
    [pts[0], pts[1], pts[2]].forEach((v) => { if (v.y < H6) { const cb = c.slab(0.008, H6 - v.y, 0.008, K.std(0x888888, { metalness: 1 }), v.x, v.y + (H6 - v.y) / 2, v.z); g.add(cb); } });
    c.clickable(pen, () => { c.sound.clink(1400); c.egg('insideman_perfect', 'The perfect robbery, as a sculpture: it only closes from one spot on the marble. Step off the brass disc and the plan comes apart. MLow commissioned it for the lobby and counted the beams twice.'); }, 'A brass sculpture');
    // the brass disc you stand on
    plane(c, g, 0.8, 0.8, (q, w2, h) => { const gr = q.createRadialGradient(w2 / 2, h / 2, 0, w2 / 2, h / 2, w2 / 2); gr.addColorStop(0, '#f4d890'); gr.addColorStop(0.85, '#a07a30'); gr.addColorStop(0.86, '#3a2a10'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.beginPath(); q.arc(w2 / 2, h / 2, w2 / 2, 0, 7); q.fill(); q.fillStyle = '#3a2a10'; q.font = `800 ${w2 * 0.1}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('STAND HERE', w2 / 2, h * 0.47); q.font = `700 ${w2 * 0.06}px ${c.MONO}`; q.fillText('THE PLAN IS PERFECT', w2 / 2, h * 0.6); }, 10, 0.008, 4.6, { floor: true, rough: 0.3, px: 256 }).material.metalness = 0.8;
    // an inlaid compass rose of brass and dark marble in the middle of the floor
    plane(c, g, 3.0, 3.0, (q, w2, h) => { const cx = w2 / 2, R = w2 / 2; q.strokeStyle = '#a07a30'; q.lineWidth = 10; q.beginPath(); q.arc(cx, cx, R * 0.94, 0, 7); q.stroke(); q.lineWidth = 4; q.beginPath(); q.arc(cx, cx, R * 0.8, 0, 7); q.stroke();
      for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, l = k % 4 === 0 ? 0.78 : k % 2 ? 0.4 : 0.58; q.fillStyle = k % 2 ? '#2a2e34' : '#b88a3a'; q.beginPath(); q.moveTo(cx + Math.cos(a) * R * l, cx + Math.sin(a) * R * l); q.lineTo(cx + Math.cos(a + 0.16) * R * 0.12, cx + Math.sin(a + 0.16) * R * 0.12); q.lineTo(cx + Math.cos(a - 0.16) * R * 0.12, cx + Math.sin(a - 0.16) * R * 0.12); q.fill(); }
      K.eyeFlower(q, cx, cx, R * 0.13, '#f4e8c8', '#b88a3a'); }, 10, 0.007, -0.6, { floor: true, rough: 0.25, px: 512 });
    // a coffered ceiling, gilded, with a lamp in every coffer
    const gilt = K.std(0xb89040, { metalness: 0.9, roughness: 0.35 });
    for (let x = 0; x <= 20; x += 2.5) g.add(c.slab(0.16, 0.24, 16, gilt, x, H6 - 0.12, 0));
    for (let z = -8; z <= 8; z += 2.0) g.add(c.slab(20, 0.24, 0.16, gilt, 10, H6 - 0.12, z));
    const NC = 8 * 8, cl = new T.InstancedMesh(new T.CircleGeometry(0.16, 16), hot(c, 0xf4f0ff, 2.0), NC), m4 = new T.Matrix4(), rx = new T.Matrix4().makeRotationX(PI / 2); let k2 = 0;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { m4.makeTranslation(1.25 + i * 2.5, H6 - 0.03, -7 + j * 2.0).multiply(rx); cl.setMatrixAt(k2++, m4); } g.add(cl);
    // banker's lamps on the loan desk and the teller counter, glowing green
    const shadeM = new T.MeshStandardMaterial({ color: 0x1f6b3a, emissive: 0x1f8a4a, emissiveIntensity: 0.9, roughness: 0.3, side: T.DoubleSide });
    [[9.4, 0.72, -2.75], [16.9, 1.11, -7.15], [18.3, 1.11, -7.15]].forEach(([x, y, z]) => { const l = new T.Group(); l.position.set(x, y, z); g.add(l); l.add(c.slab(0.02, 0.3, 0.02, gilt, 0, 0.15, 0)); const sh = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.34, 16, 1, false, 0, PI).rotateZ(PI / 2), shadeM); sh.position.y = 0.34; l.add(sh); l.add(c.slab(0.28, 0.02, 0.14, gilt, 0, 0.01, 0)); glow(c, l, 0x9affc0, 0.6, 0, 0.3, 0.08, 0.6); glow(c, l, 0xfff0c8, 0.9, 0, 0.12, 0.1, 0.4); });
    // outside, the siege: police lights washing red and blue across the ceiling and the south wall
    const wash = [0xff2030, 0x2050ff].map((col, k) => { const m = new T.Mesh(new T.PlaneGeometry(9, 7), new T.MeshBasicMaterial({ map: dotTex(c), color: col, opacity: 0, ...add(T), fog: false })); m.rotation.x = PI / 2; m.position.set(k ? 14 : 6, H6 - 0.3, 4.5); g.add(m); return m; });
    const flash = [0xff2030, 0x2050ff].map((col, k) => glow(c, g, col, 3.4, k ? 15.5 : 4.5, 4.4, 7.6, 0));
    // the alarm beacon over the vault, turning
    const bc = new T.Group(); bc.position.set(K.W - 0.4, 4.0, -4.4); g.add(bc); bc.add(new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 0.22, 16), hot(c, 0xff2a10, 1.6)));
    const rot = new T.Group(); bc.add(rot); const ray = new T.Mesh(new T.PlaneGeometry(2.6, 0.5).translate(1.3, 0, 0), new T.MeshBasicMaterial({ map: beamTex(c), color: 0xff3020, opacity: 0.35, side: T.DoubleSide, ...add(T), fog: false })); ray.rotation.z = -PI / 2; const rr = new T.Group(); rr.add(ray); rr.rotation.z = PI / 2; rot.add(rr);
    // light from the high windows on the west wall, and dust in it
    [-5.4, -2.6, 0.2].forEach((z) => beam(c, g, 0.3, 5.6, z, [0.75, -0.6, 0.1], 1.4, 10, 0xdde8ff, 0.06));
    motes(c, r, g, { n: 200, box: [1, 19, 0.5, 5.5, -7, 6], col: 0xe8f0ff, size: 0.03, op: 0.5, drift: 0.05 });
    // deposit slips on the marble, and banded stacks on the loan desk
    const slip = c.canvasTex(128, 64, (q, w2, h) => { q.fillStyle = '#e8f0e8'; q.fillRect(0, 0, w2, h); q.fillStyle = '#2a5a3a'; q.fillRect(0, 0, w2, 10); q.fillStyle = '#7a8a7a'; for (let y = 18; y < h; y += 9) q.fillRect(8, y, w2 - 16, 2); });
    const slipM = new T.MeshStandardMaterial({ map: slip, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }), slipI = new T.InstancedMesh(new T.PlaneGeometry(0.2, 0.1), slipM, 24);
    for (let k = 0; k < 24; k++) { m4.makeRotationFromEuler(new T.Euler(-PI / 2, 0, Math.random() * 6)); m4.setPosition(6 + Math.random() * 8, 0.006 + k * 0.0002, -2 + Math.random() * 7.5); slipI.setMatrixAt(k, m4); } g.add(slipI);
    const cash = K.std(0x6a8a5a, { roughness: 0.8 }), bandM = K.std(0xc8a050);
    for (let k = 0; k < 4; k++) { const st = c.slab(0.16, 0.06 + (k % 2) * 0.04, 0.07, cash, 10.15 + (k % 2) * 0.18, 0.74, -2.75 + (k >> 1) * 0.1); g.add(st); g.add(c.slab(0.03, st.geometry.parameters.height + 0.004, 0.072, bandM, st.position.x, 0.74, st.position.z)); }
    haze(c, r, g, { n: 5, box: [2, 18, 2.8, 4.8, -6, 5], col: 0xd8e0f0, op: 0.07, s: [6, 9], speed: 0.08 });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const ph = (t * 2.2) % 2, a = ph < 1 ? Math.max(0, Math.sin(ph * PI)) : 0, b = ph >= 1 ? Math.max(0, Math.sin((ph - 1) * PI)) : 0;
      wash[0].material.opacity = a * 0.2; wash[1].material.opacity = b * 0.24; flash[0].material.opacity = a * 0.7; flash[1].material.opacity = b * 0.7;
      rot.rotation.y = t * 3.2;
    });
  },
  // ---------- The Devil Wears Prada: Runway, the ninth floor ----------
  prada(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 0.75, vig: 0.32 };
    // the illusion: two sheer banners of fine stripes, one hung a hand's width behind the other at a slightly different pitch.
    // Walk and broad bands of cerulean run across them like a river; stand still and they stop.
    const lines = (col) => { const t = c.canvasTex(1024, 16, (q, w, h) => { for (let x = 0; x < w; x += 16) { q.fillStyle = col; q.fillRect(x, 0, 7, h); } }); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t; };
    const BW = 8.4, BH = 2.2, BY = 4.15, BZ = -0.5;
    const front = lines('#2a52be'); front.repeat.set(BW / 0.05 / 64, 1);
    const backT = lines('#14161c'); backT.repeat.set(BW / 0.054 / 64, 1);
    const veil = new T.Group(); g.add(veil);
    [[backT, BZ - 0.22], [front, BZ]].forEach(([t, z]) => { const m = new T.Mesh(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02, side: T.DoubleSide, depthWrite: false })); m.position.set(10, BY, z); veil.add(m); });
    const lightbox = new T.Mesh(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: c.canvasTex(256, 64, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8eeff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#dfe8ff'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }), toneMapped: false, side: T.DoubleSide }));
    lightbox.material.color.setScalar(1.05); lightbox.position.set(10, BY, BZ - 0.5); veil.add(lightbox);
    const rail = K.std(0xd0d0d4, { metalness: 0.9, roughness: 0.25 });
    [BY + BH / 2 + 0.04, BY - BH / 2 - 0.04].forEach((y) => veil.add(c.slab(BW + 0.1, 0.05, 0.6, rail, 10, y, BZ - 0.25)));
    [-BW / 2 + 0.3, BW / 2 - 0.3].forEach((dx) => veil.add(c.slab(0.01, H6 - BY - BH / 2, 0.01, rail, 10 + dx, (H6 + BY + BH / 2) / 2, BZ - 0.08)));
    const cap = c.sign('CERULEAN. IT MOVES WHEN YOU DO', { w: 3.2, h: 0.2, bg: '#ffffff', fg: '#2a52be', font: c.SERIF, weight: 800 }); cap.position.set(10, BY - BH / 2 - 0.2, BZ + 0.02); veil.add(cap);
    c.clickable(veil, () => { c.sound.whoosh(0.2, 1.2); c.egg('prada_moire', 'Two sheer banners of stripes. Walk and the bands run across them like a cerulean river; stand still and they stop. Nothing moved but you, which at Runway counts as a promotion.'); }, 'Two striped banners');
    // a lacquered runway down the middle of the floor, edged in cerulean light
    plane(c, g, 1.3, 12.4, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#e8ecf4'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#e8ecf4'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 10.7, 0.006, 0.3, { floor: true, rough: 0.08, px: 256 });
    [10.02, 11.38].forEach((x) => { const m = new T.Mesh(new T.PlaneGeometry(0.035, 12.4), hot(c, 0x3a6aff, 2.2)); m.rotation.x = -PI / 2; m.position.set(x, 0.008, 0.3); g.add(m); });
    // light panels in the ceiling, a grid of them
    const NP = 5 * 4, pan = new T.InstancedMesh(new T.PlaneGeometry(1.4, 0.7), hot(c, 0xf4f8ff, 1.5), NP), m4 = new T.Matrix4(), rx = new T.Matrix4().makeRotationX(PI / 2); let k2 = 0;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { m4.makeTranslation(2.4 + i * 3.8, H6 - 0.02, -6 + j * 3.6).multiply(rx); pan.setMatrixAt(k2++, m4); } g.add(pan);
    // backlit fashion plates high on the side walls
    const plate = (title, sub, bg, acc, x, z, ry) => { const m = plane(c, g, 2.0, 1.2, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bg); gr.addColorStop(1, '#ffffff'); q.fillStyle = gr; q.fillRect(0, 0, w, h); K.eyeFlower(q, w * 0.24, h * 0.5, h * 0.34, '#ffffff', acc); q.fillStyle = '#111'; q.textAlign = 'left'; q.font = `400 ${h * 0.2}px ${c.SERIF}`; q.fillText(title, w * 0.46, h * 0.48); q.font = `700 ${h * 0.07}px ${c.MONO}`; q.fillStyle = acc; q.fillText(sub, w * 0.46, h * 0.64); }, x, 4.3, z, { basic: true, tone: false, k: 1.1, px: 384, ry }); return m; };
    plate('Runway', 'THE N3W ISSUE', '#9ab8ff', '#2a52be', 0.16, -3.0, PI / 2); plate('Runway', 'BY MLow', '#ffb8d8', '#ff4fa3', 0.16, 0.6, PI / 2);
    plate('Runway', 'CERULEAN', '#b8e8ff', '#22d3ee', K.W - 0.4, -3.0, -PI / 2); plate('Runway', 'GIRD YOURSELF', '#fff0b8', '#c8a050', K.W - 0.4, 0.6, -PI / 2);
    // the sweater itself, on a dress form, under its own light
    const df = new T.Group(); df.position.set(4.6, 0, 0.7); df.rotation.y = 0.6; g.add(df); c.post(X(4.6), 0.7, 0.4);
    const torso = new T.Mesh(new T.LatheGeometry([[0, 0], [0.14, 0], [0.19, 0.12], [0.16, 0.32], [0.19, 0.5], [0.17, 0.66], [0.08, 0.74], [0.05, 0.8], [0, 0.82]].map(([a, b]) => new T.Vector2(a, b)), 24), K.std(0x2a5ad8, { roughness: 0.95 }));
    torso.position.y = 0.95; df.add(torso); df.add(c.slab(0.03, 0.95, 0.03, rail, 0, 0.48, 0)); const ft = new T.Mesh(new T.CylinderGeometry(0.22, 0.25, 0.04, 20), rail); ft.position.y = 0.02; df.add(ft);
    const knit = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#2a52be'; q.fillRect(0, 0, w, h); q.strokeStyle = '#3a6ae0'; q.lineWidth = 3; for (let y = 0; y < h; y += 10) for (let x = 0; x < w; x += 10) { q.beginPath(); q.moveTo(x, y); q.lineTo(x + 5, y + 8); q.lineTo(x + 10, y); q.stroke(); } }); knit.wrapS = knit.wrapT = T.RepeatWrapping; knit.repeat.set(4, 3); torso.material.map = knit; torso.material.color.set(0xffffff);
    cone(c, g, 4.6, H6 - 0.1, 0.7, 0.1, 0.9, H6 - 0.3, 0xe8f0ff, 0.09); glow(c, g, 0xffffff, 0.8, 4.6, H6 - 0.12, 0.7, 0.9);
    sg2(c, df, 'NOT BLUE. CERULEAN', 0.9, 0.12, 0, 0.75, 0.24);
    // a spot on the cover and one on the belts
    cone(c, g, 13.0, H6 - 0.1, 1.6, 0.1, 1.1, H6 - 0.3, 0xe8f0ff, 0.08); cone(c, g, 8.8, H6 - 0.1, -2.2, 0.1, 1.0, H6 - 0.3, 0xe8f0ff, 0.08);
    // towers of back issues by the editor's desk, and shopping bags by the closet
    const spines = ['#2a52be', '#ff4fa3', '#111111', '#f5c542', '#ffffff', '#c8102e', '#22d3ee'], magM = spines.map((s) => K.std(new T.Color(s).getHex(), { roughness: 0.4 }));
    [[11.4, -6.3], [11.9, -6.6], [15.9, -6.4]].forEach(([x, z], j) => { for (let k = 0; k < 9 + j * 3; k++) { const s = c.slab(0.3, 0.05, 0.4, magM[(k + j) % magM.length], x + (Math.random() - 0.5) * 0.03, 0.025 + k * 0.05, z); s.rotation.y = (Math.random() - 0.5) * 0.2; g.add(s); } c.post(X(x), z, 0.3); });
    [[2.0, 6.5, 0xff4fa3], [2.45, 6.75, 0x111111], [2.2, 7.1, 0xf4f4f4], [2.7, 6.4, 0x2a52be]].forEach(([x, z, col], k) => { const b = c.slab(0.32, 0.4, 0.14, K.std(col, { roughness: 0.4 }), x, 0.2, z); b.rotation.y = k * 0.5; g.add(b); const hd = new T.Mesh(new T.TorusGeometry(0.08, 0.008, 6, 16, PI), K.std(0x222222)); hd.position.set(x, 0.4, z); hd.rotation.y = k * 0.5; g.add(hd); });
    // white orchids on the coffee table
    const orch = new T.Group(); orch.position.set(7.3, 0.62, 4.2); g.add(orch); const petal = K.std(0xffffff, { roughness: 0.5, emissive: 0x222222 });
    for (let k = 0; k < 3; k++) { const st = c.slab(0.008, 0.5, 0.008, K.std(0x3a5a2a), (k - 1) * 0.06, 0.25, 0); st.rotation.z = (k - 1) * 0.2; orch.add(st); for (let j = 0; j < 4; j++) { const f = new T.Mesh(new T.SphereGeometry(0.035, 8, 6).scale(1, 0.4, 1), petal); f.position.set((k - 1) * 0.1 + j * 0.03, 0.4 + j * 0.04, 0.03); orch.add(f); } }
    // the shoot: flashes popping round the runway
    const pops = [0, 1, 2].map(() => glow(c, g, 0xffffff, 1.8, 10.7, 1.6, 0, 0));
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      pops.forEach((s, k) => { s.material.opacity *= 0.82; if (Math.random() < dt * 0.6) { s.position.set(9.4 + Math.random() * 2.6, 1.2 + Math.random() * 1.2, -5 + Math.random() * 10); s.material.opacity = 1; } });
    });
  },

  // ---------- Black Swan: the rehearsal studio, Lincoln Center ----------
  blackswan(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 0.9, vig: 0.55 };
    // the illusion: the spinning dancer. A ballerina in pure silhouette against a lightbox, turning on one toe.
    // Look at her and she turns one way; blink, or look at her foot, and she turns the other. Both are true.
    const lb = new T.Group(); lb.position.set(4.3, 0, -1.3); lb.rotation.y = 0.72; g.add(lb); c.post(X(4.3), -1.3, 1.0);
    const box2 = K.std(0x18181c, { metalness: 0.4, roughness: 0.5 });
    lb.add(c.slab(2.0, 2.7, 0.18, box2, 0, 1.35, -0.12));
    const glowP = new T.Mesh(new T.PlaneGeometry(1.84, 2.54), new T.MeshBasicMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h / 2, w * 0.75); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c8d4e8'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }), toneMapped: false }));
    glowP.material.color.setScalar(1.25); glowP.position.set(0, 1.35, -0.02); lb.add(glowP);
    const blk = new T.MeshBasicMaterial({ color: 0x000000 }), spin = new T.Group(); spin.position.set(0, 0.25, 0.32); lb.add(spin);
    lb.add(c.slab(0.6, 0.25, 0.6, box2, 0, 0.125, 0.32));
    c.glb('odette', { h: 1.65, parent: spin, shadow: false, onload: (gg, sc) => sc.traverse((m) => { if (m.isMesh) m.material = blk; }) });
    c.clickable(lb, () => { c.sound.note(740, 0.15); c.egg('blackswan_spin', 'She turns one way. Blink and she turns the other. Nothing about her changed but you. The white swan and the black one are the same dancer, MLow says, and so is the direction.'); }, 'A turning dancer');
    // the spot that finds the centre of the floor, a pool of light under it
    cone(c, g, 10, H6 - 0.1, -1.8, 0.12, 1.5, H6 - 0.2, 0xe8eeff, 0.11); glow(c, g, 0xffffff, 0.9, 10, H6 - 0.12, -1.8, 0.9);
    plane(c, g, 3.4, 3.4, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(235,240,255,.5)'); gr.addColorStop(1, 'rgba(235,240,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }, 10, 0.008, -1.8, { floor: true, basic: true, px: 128 }).material.blending = T.AdditiveBlending;
    // cold window light from high on the west wall, and dust in it
    [-5.6, -3.0, -0.4].forEach((z) => beam(c, g, 0.3, 5.5, z, [0.8, -0.55, 0.12], 1.3, 10, 0xdce6ff, 0.075));
    const winT = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#eef4ff'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2a30'; q.fillRect(0, h / 2 - 3, w, 6); q.fillRect(w / 2 - 3, 0, 6, h); q.lineWidth = 8; q.strokeStyle = '#2a2a30'; q.strokeRect(0, 0, w, h); });
    [-5.6, -3.0, -0.4].forEach((z) => { const m = new T.Mesh(new T.PlaneGeometry(1.3, 1.0), new T.MeshBasicMaterial({ map: winT, toneMapped: false })); m.material.color.setScalar(1.4); m.position.set(0.14, 5.3, z); m.rotation.y = PI / 2; g.add(m); });
    motes(c, r, g, { n: 200, box: [0.5, 19, 0.3, 5.6, -7, 6], col: 0xe8eeff, size: 0.03, op: 0.5, drift: 0.05 });
    // feathers, black and white, drifting down through the room
    const fT = c.canvasTex(64, 128, (q, w, h) => { q.fillStyle = '#ffffff'; q.beginPath(); q.moveTo(w / 2, 4); q.quadraticCurveTo(w * 0.95, h * 0.4, w / 2, h - 4); q.quadraticCurveTo(w * 0.05, h * 0.4, w / 2, 4); q.fill(); q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 2; q.beginPath(); q.moveTo(w / 2, 6); q.lineTo(w / 2, h - 2); q.stroke(); });
    const NF = c.MOBILE ? 24 : 50, fth = new T.InstancedMesh(new T.PlaneGeometry(0.07, 0.14), new T.MeshStandardMaterial({ map: fT, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.9 }), NF), fd = [], col = new T.Color(), e = new T.Euler(), q4 = new T.Quaternion(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1), m4 = new T.Matrix4();
    for (let k = 0; k < NF; k++) { fd.push([1 + Math.random() * 18, Math.random() * 5.6, -7 + Math.random() * 14, Math.random() * 6, 0.12 + Math.random() * 0.15]); fth.setColorAt(k, col.setHex(k % 3 ? 0xf4f4f4 : 0x141414)); }
    fth.frustumCulled = false; g.add(fth);
    // skylights in the ceiling
    [[6, -3], [14, -3], [6, 2.5], [14, 2.5]].forEach(([x, z]) => { const m = new T.Mesh(new T.PlaneGeometry(2.2, 1.6), new T.MeshBasicMaterial({ map: winT, toneMapped: false })); m.material.color.setScalar(1.25); m.rotation.x = PI / 2; m.position.set(x, H6 - 0.02, z); g.add(m); });
    // the rehearsal pianist at an upright against the east wall
    const pn = new T.Group(); pn.position.set(18.95, 0, -5.4); pn.rotation.y = -PI / 2; g.add(pn); const ebony = K.std(0x0c0c0e, { roughness: 0.25, metalness: 0.2 });
    pn.add(c.slab(1.45, 1.22, 0.55, ebony, 0, 0.61, 0)); pn.add(c.slab(1.4, 0.05, 0.22, K.std(0xf4f0e8, { roughness: 0.3 }), 0, 0.74, 0.36)); for (let k = 0; k < 20; k++) pn.add(c.slab(0.025, 0.02, 0.12, ebony, -0.62 + k * 0.066, 0.77, 0.32));
    pn.add(c.slab(0.8, 0.45, 0.35, ebony, 0, 0.225, 0.95)); c.post(X(18.95), -5.4, 0.8);
    K.extra(pn, 0, 0.95, { seated: true, col: 0x1a1a1e, ry: PI }); const cand = glow(c, pn, 0xffd890, 0.5, 0.55, 1.3, 0.1, 0.8);
    c.clickable(pn, () => { [740, 493.9, 554.4, 587.3, 659.3, 740].forEach((f, k) => setTimeout(() => c.sound.note(f, 0.14), k * 260)); }, 'The rehearsal piano');
    // the rosin box by the barre, its powder spilled
    const ros = new T.Group(); ros.position.set(13.6, 0, 1.5); g.add(ros); ros.add(c.slab(0.8, 0.08, 0.6, K.std(0x6a4a2a, { roughness: 0.8 }), 0, 0.04, 0)); ros.add(c.slab(0.72, 0.01, 0.52, K.std(0xf0e8d8, { roughness: 1 }), 0, 0.085, 0));
    plane(c, g, 1.4, 1.0, (q, w, h) => { for (let k = 0; k < 300; k++) { q.fillStyle = `rgba(245,240,230,${Math.random() * 0.25})`; q.beginPath(); q.arc(w / 2 + (Math.random() - 0.5) * w * 0.8, h / 2 + (Math.random() - 0.5) * h * 0.7, 2 + Math.random() * 6, 0, 7); q.fill(); } }, 13.6, 0.007, 1.5, { floor: true, px: 128 });
    haze(c, r, g, { n: 5, box: [2, 18, 2.6, 4.6, -6, 5], col: 0xe0e6f0, op: 0.06, s: [6, 9], speed: 0.07 });
    c.tick((t, dt, P, ri) => {
      if (Math.abs(ri - r.i) > 1) return;
      spin.rotation.y = t * 2.6;
      if (ri !== r.i) return;
      for (let k = 0; k < NF; k++) { const f = fd[k]; f[1] -= dt * f[4]; if (f[1] < 0.02) f[1] = 5.6; e.set(Math.sin(t * 1.3 + f[3]) * 0.9, t * 0.6 + f[3], Math.cos(t * 1.1 + f[3]) * 0.7); q4.setFromEuler(e); m4.compose(v.set(f[0] + Math.sin(t * 0.8 + f[3]) * 0.4, f[1], f[2] + Math.cos(t * 0.7 + f[3]) * 0.3), q4, one); fth.setMatrixAt(k, m4); }
      fth.instanceMatrix.needsUpdate = true; cand.material.opacity = 0.7 + Math.sin(t * 11) * 0.15;
    });
  },

  // ---------- Cocktail: Flanagan's, Upper East Side ----------
  cocktail(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 1.1, vig: 0.5 };
    // the illusion: a glass panel in the floor over a neon well that goes down for ever. It is a sheet of glass on the boards:
    // the depth is drawn by the light, frame after frame of pink and cyan falling away under your feet, true from wherever you stand.
    const WX = 10, WZ = 0.4, HW = 1.5, HD = 1.3;
    const well = new T.Mesh(new T.PlaneGeometry(HW * 2, HD * 2), new T.ShaderMaterial({
      uniforms: { uC: { value: new T.Vector3(r.x0 + WX, 0.012, WZ) }, uH: { value: new T.Vector2(HW, HD) }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uC; uniform vec2 uH; uniform float uT; varying vec3 vW;
        void main(){
          vec3 d = normalize(vW - cameraPosition); d.x = abs(d.x) < 1e-4 ? 1e-4 : d.x; d.z = abs(d.z) < 1e-4 ? 1e-4 : d.z; vec3 p = vW - uC;
          float tx = ((d.x > 0. ? uH.x : -uH.x) - p.x) / d.x, tz = ((d.z > 0. ? uH.y : -uH.y) - p.z) / d.z, tb = (-60. - p.y) / d.y;
          float t = min(min(tx, tz), tb); vec3 h = p + d * t; float dep = -h.y;
          vec3 col = vec3(0.012, 0.004, 0.02);
          if (t < tb) {
            float k = dep / 0.2 + uT * 0.6, f = abs(fract(k) - 0.5) * 2., line = smoothstep(0.86, 1., f);
            vec3 neon = mod(floor(k + 0.5), 2.) < 1. ? vec3(1.6, 0.25, 0.8) : vec3(0.2, 1.3, 1.6);
            col += neon * line * exp(-dep * 0.075) * 1.6 + neon * 0.05 * exp(-dep * 0.2);
          } else col += vec3(0.6, 0.5, 1.2) * smoothstep(0.6, 0., length(h.xz)) * 0.4;
          float e = max(abs(p.x) / uH.x, abs(p.z) / uH.y); col += vec3(0.9, 0.9, 1.) * smoothstep(0.93, 1., e) * 0.25;
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    well.rotation.x = -PI / 2; well.position.set(WX, 0.012, WZ); g.add(well);
    const chrome = K.std(0xd0d0d8, { metalness: 1, roughness: 0.15 });
    [[0, HD + 0.04, HW * 2 + 0.16, 0.08], [0, -HD - 0.04, HW * 2 + 0.16, 0.08], [HW + 0.04, 0, 0.08, HD * 2], [-HW - 0.04, 0, 0.08, HD * 2]].forEach(([dx, dz, w, d]) => g.add(c.slab(w, 0.025, d, chrome, WX + dx, 0.0125, WZ + dz)));
    const sheen = new T.Mesh(new T.PlaneGeometry(HW * 2, HD * 2), new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.05, depthWrite: false })); sheen.rotation.x = -PI / 2; sheen.position.set(WX, 0.02, WZ); g.add(sheen);
    c.clickable(well, () => { c.sound.whoosh(0.25, 1.6); c.egg('cocktail_infinity', 'A sheet of glass on the boards, and under it the neon goes down for ever. Brian said he would own a bar called Cocktails and Dreams. MLow put the dreams in the floor.'); }, 'Look down');
    // the mirror ball and the sparkles it throws round the room
    const ballT = c.canvasTex(256, 128, (q, w, h) => { for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { const v = 120 + Math.random() * 135; q.fillStyle = `rgb(${v},${v},${v + 10})`; q.fillRect(x, y, 7, 7); } });
    const ball = new T.Mesh(new T.SphereGeometry(0.42, 32, 20), new T.MeshStandardMaterial({ map: ballT, metalness: 1, roughness: 0.12, envMapIntensity: 2 })); ball.position.set(10, 4.75, 1.6); g.add(ball);
    g.add(c.slab(0.012, H6 - 5.17, 0.012, K.std(0x222222), 10, (H6 + 5.17) / 2, 1.6));
    const NSP = c.MOBILE ? 90 : 180, sp = new Float32Array(NSP * 3);
    for (let k = 0; k < NSP; k++) { const a = Math.random() * PI * 2, b = Math.acos(Math.random() * 1.6 - 0.8), rr = 5.5 + Math.random() * 2.5; sp[k * 3] = Math.cos(a) * Math.sin(b) * rr; sp[k * 3 + 1] = Math.cos(b) * rr * 0.6; sp[k * 3 + 2] = Math.sin(a) * Math.sin(b) * rr; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    const sparks = new T.Points(sg, new T.PointsMaterial({ map: dotTex(c), color: new T.Color(2.0, 1.8, 2.2), size: 0.09, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending })); sparks.position.copy(ball.position); g.add(sparks);
    // two slow beams sweeping from the ceiling, pink and cyan
    const sweeps = [[0xff4fa3, 6.5], [0x22d3ee, 13.5]].map(([col, x]) => { const b = beam(c, g, x, H6 - 0.1, 2.5, [0, -1, 0], 0.5, 7, col, 0.18); return b; });
    // the beach bar he ends up running: a neon palm and its name, high on the west wall
    const palmT = c.canvasTex(512, 512, (q, w, h) => { q.strokeStyle = '#7dffb0'; q.lineWidth = 14; q.lineCap = 'round'; q.shadowColor = '#7dffb0'; q.shadowBlur = 24; q.beginPath(); q.moveTo(w * 0.5, h * 0.95); q.quadraticCurveTo(w * 0.42, h * 0.6, w * 0.52, h * 0.32); q.stroke(); q.strokeStyle = '#3affc8'; for (let k = 0; k < 6; k++) { const a = -PI + k / 5 * PI; q.beginPath(); q.moveTo(w * 0.52, h * 0.32); q.quadraticCurveTo(w * 0.52 + Math.cos(a) * w * 0.2, h * 0.32 + Math.sin(a) * h * 0.18 - h * 0.08, w * 0.52 + Math.cos(a) * w * 0.36, h * 0.32 + Math.sin(a) * h * 0.1 + h * 0.06); q.stroke(); } q.fillStyle = '#ff9a3a'; q.shadowColor = '#ff9a3a'; [[0.48, 0.36], [0.56, 0.37]].forEach(([u, v2]) => { q.beginPath(); q.arc(w * u, h * v2, 14, 0, 7); q.fill(); }); });
    const palm = new T.Mesh(new T.PlaneGeometry(1.8, 1.8), new T.MeshBasicMaterial({ map: palmT, transparent: true, toneMapped: false, depthWrite: false })); palm.material.color.setScalar(1.8); palm.position.set(0.16, 4.3, 0.4); palm.rotation.y = PI / 2; g.add(palm);
    const isl = neon(c, g, 'MLow ISLAND BAR', 0.16, 3.3, 0.4, PI / 2, { w: 2.6, h: 0.42, col: '#ff9a3a', font: c.SERIF });
    const last = neon(c, g, 'LAST CALL', K.W - 0.4, 4.4, -0.6, -PI / 2, { w: 2.2, h: 0.5, col: '#22d3ee', font: c.MONO });
    // a row of drinks on the bar, lit from inside
    const DR = [0x22d3ee, 0xff4fa3, 0xf5c542, 0x7dffb0, 0xff7a1a, 0x9a6aff];
    for (let k = 0; k < 6; k++) { const x = 7.0 + k * 1.15, z = -2.75; const gl = new T.Mesh(new T.ConeGeometry(0.07, 0.11, 16, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, side: T.DoubleSide })); gl.rotation.x = PI; gl.position.set(x, 1.27, z); g.add(gl);
      const liq = new T.Mesh(new T.ConeGeometry(0.06, 0.08, 16), hot(c, DR[k], 1.5)); liq.rotation.x = PI; liq.position.set(x, 1.255, z); g.add(liq); g.add(c.slab(0.006, 0.1, 0.006, K.std(0xffffff), x, 1.17, z)); glow(c, g, DR[k], 0.35, x, 1.26, z + 0.05, 0.6); }
    // smoke over the room, and the floor polished so the neon runs across it
    haze(c, r, g, { n: 7, box: [2, 18, 2.4, 4.8, -5, 6], col: 0xffb8e8, op: 0.08, s: [5, 8], speed: 0.12 });
    const floor = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === K.W && Math.abs(o.position.y + 0.05) < 0.01);
    if (floor) { floor.material = floor.material.clone(); floor.material.roughness = 0.42; floor.material.envMapIntensity = 1.6; }
    const rings = findAll(g, (o) => o.isMesh && o.geometry.type === 'TorusGeometry' && o.geometry.parameters.radius > 2.5 && o.geometry.parameters.tube < 0.05);
    rings.forEach((m) => { m.material = m.material.clone(); });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      well.material.uniforms.uT.value = t; ball.rotation.y = t * 0.5; sparks.rotation.y = t * 0.5;
      sweeps.forEach((b, k) => { b.rotation.set(Math.sin(t * 0.6 + k * 2) * 0.55, 0, Math.cos(t * 0.45 + k) * 0.5); });
      rings.forEach((m, k) => m.material.color.setScalar(1.2 + Math.sin(t * 2 + k * PI) * 0.6));
      last.material.color.setScalar((t * 0.8) % 1 < 0.5 ? 1.9 : 0.5); isl.material.color.setScalar(Math.random() < 0.03 ? 0.4 : 1.8);
    });
  },
  // ---------- Gangs of New York: Paradise Square, Five Points, 1863 ----------
  gangs(c, r, g, X, K) {
    const T = c.THREE;
    r.post = { ...r.post, bloom: 1.0, vig: 0.55 };
    // the illusion: an eye flower chalked across the cobbles, two crates and a barrel. From the chalk mark it is a perfect round
    // flower standing up in the fog; one step off it and it smears into pieces over everything.
    const E = new T.Vector3(r.x0 + 10, 1.62, 4.7), pc = new T.PerspectiveCamera(36, 1, 0.1, 40); pc.position.copy(E); pc.lookAt(r.x0 + 10, 0, 1.9); pc.updateMatrixWorld(true);
    const VP = new T.Matrix4().multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
    const art = c.canvasTex(1024, 1024, (q, w, h) => {
      K.eyeFlower(q, w / 2, h / 2, w * 0.36, '#f4ece0', '#c8102e');
      q.strokeStyle = '#f4ece0'; q.lineWidth = 16; q.beginPath(); q.arc(w / 2, h / 2, w * 0.44, 0, 7); q.stroke();
      q.fillStyle = '#f4ece0'; q.font = `900 ${w * 0.05}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle';
      const s = 'PARADISE SQ.  COUNTED 1863  BY MLow  '; for (let k = 0; k < s.length; k++) { const a = -PI / 2 + (k - s.length / 2) / s.length * PI * 2; q.save(); q.translate(w / 2 + Math.cos(a) * w * 0.47, h / 2 + Math.sin(a) * w * 0.47); q.rotate(a + PI / 2); q.fillText(s[k], 0, 0); q.restore(); }
      q.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 9000; k++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.6})`; q.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1 + Math.random() * 2); }
    });
    const proj = new T.ShaderMaterial({ uniforms: { map: { value: art }, uVP: { value: VP }, uE: { value: E } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3,
      vertexShader: 'uniform mat4 uVP; varying vec4 vP; varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vP = uVP * w; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 uE; varying vec4 vP; varying vec3 vW; varying vec3 vN; void main(){ vec3 n = vP.xyz / vP.w; if (abs(n.x) > 1. || abs(n.y) > 1. || n.z > 1.) discard; if (dot(vN, normalize(uE - vW)) < 0.02) discard; vec4 c = texture2D(map, n.xy * 0.5 + 0.5); if (c.a < 0.03) discard; gl_FragColor = vec4(c.rgb * 0.9, c.a * 0.9); }' });
    const ground = new T.Mesh(new T.PlaneGeometry(7, 7.8), proj); ground.rotation.x = -PI / 2; ground.position.set(10, 0.012, 0.4); g.add(ground);
    const wood = K.std(0x5a4028, { roughness: 0.85 }), paintOn = (m) => { const o = new T.Mesh(m.geometry, proj); o.position.copy(m.position); o.rotation.copy(m.rotation); o.scale.setScalar(1.004); g.add(o); };
    [[10.8, 0.275, 1.55, 0.55, 0.25], [9.2, 0.25, 2.05, 0.5, -0.15], [9.2, 0.72, 2.05, 0.44, 0.15]].forEach(([x, y, z, s, ry]) => { const b = new T.Mesh(new T.BoxGeometry(s, s, s), wood); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); paintOn(b); c.post(X(x), z, 0.4); });
    const bar = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.8, 20), wood); bar.position.set(10.05, 0.4, 0.75); g.add(bar); paintOn(bar); c.post(X(10.05), 0.75, 0.35);
    plane(c, g, 0.9, 0.9, (q, w, h) => { q.strokeStyle = 'rgba(244,236,224,.85)'; q.lineWidth = w * 0.04; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, 7); q.stroke(); q.fillStyle = 'rgba(244,236,224,.85)'; q.font = `800 ${w * 0.11}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('STAND', w / 2, h * 0.47); q.fillText('HERE', w / 2, h * 0.62); }, 10, 0.014, 4.9, { floor: true, px: 256 });
    c.clickable(ground, () => { c.sound.chant(0.12); c.egg('gangs_chalk', 'From the chalk mark it is one round eye flower standing in the fog. Step off and it falls apart across the cobbles, the crates and the barrel. Five Points was like that: one picture, from one corner.'); }, 'Chalk on the cobbles');
    // round snow instead of square, and the cobbles wet
    findAll(g, (o) => o.isPoints && o.material.size === 0.04).forEach((p) => { p.material.map = dotTex(c); p.material.size = 0.075; p.material.depthWrite = false; p.material.needsUpdate = true; });
    const floor = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === K.W && Math.abs(o.position.y + 0.05) < 0.01);
    if (floor) { floor.material = floor.material.clone(); floor.material.roughness = 0.4; floor.material.envMapIntensity = 1.3; }
    // a pool of light on the cobbles under each gas lamp, once it is lit
    const pools = findAll(g, (o) => o.isSprite && Math.abs(o.scale.x - 3.4) < 0.01 && Math.abs(o.position.y - 3.04) < 0.01).map((h) => { const p = h.parent.position; const m = plane(c, g, 3.4, 3.4, (q, w, hh) => { const gr = q.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, hh); }, p.x, 0.01, p.z, { floor: true, basic: true, px: 128 }); m.material.blending = T.AdditiveBlending; return [h, m]; });
    // embers off the fire barrel
    const NE = c.MOBILE ? 30 : 60, ep = new Float32Array(NE * 3), el = new Float32Array(NE);
    for (let k = 0; k < NE; k++) { el[k] = Math.random(); }
    const eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(ep, 3));
    const embers = new T.Points(eg, new T.PointsMaterial({ map: dotTex(c), color: new T.Color(2.4, 1.0, 0.3), size: 0.05, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending })); embers.frustumCulled = false; g.add(embers);
    // three in the crowd carry torches
    const crowd = findAll(g, (o) => o.isGroup && o.userData.head && o.parent === g);
    const torches = crowd.filter((_, k) => k % 6 === 1).slice(0, 3).map((e) => { const st = c.slab(0.04, 0.8, 0.04, K.std(0x3a2414), 0.32, 1.35, 0.1); e.add(st); const f = glow(c, e, 0xffa040, 0.55, 0.32, 1.85, 0.1, 1); const f2 = glow(c, e, 0xff6a20, 1.6, 0.32, 1.85, 0.1, 0.35); return [f, f2]; });
    // ground fog that crawls, and smoke from the chimneys over the square
    haze(c, r, g, { n: 8, box: [0, 20, 0.2, 1.0, -7, 7], col: 0xa8acb2, op: 0.22, s: [5, 8], speed: 0.18, addv: false });
    const smokes = [[3, -7.2], [8, 7.4], [14, -7.2], [18, 7.4]].map(([x, z]) => haze(c, r, g, { n: 3, box: [x - 0.3, x + 0.3, 4.2, 6.5, z, z], col: 0x6a6c70, op: 0.3, s: [1.6, 2.6], speed: 0.0, addv: false }));
    // tenement windows lit high on the side walls, somebody in each
    const winT = c.canvasTex(64, 96, (q, w, h) => { q.fillStyle = '#ffb860'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2410'; q.fillRect(w / 2 - 2, 0, 4, h); q.fillRect(0, h / 2 - 2, w, 4); q.fillStyle = 'rgba(40,20,8,.75)'; q.beginPath(); q.ellipse(w * 0.3, h * 0.62, 10, 14, 0, 0, 7); q.fill(); q.fillRect(w * 0.18, h * 0.72, 22, 30); });
    [[0.14, -5.4, PI / 2], [0.14, -3.0, PI / 2], [0.14, -0.6, PI / 2], [K.W - 0.38, -5.4, -PI / 2], [K.W - 0.38, -3.0, -PI / 2], [K.W - 0.38, -0.6, -PI / 2]].forEach(([x, z, ry], k) => { if (k % 2 && k > 2) return; const m = new T.Mesh(new T.PlaneGeometry(0.55, 0.8), new T.MeshBasicMaterial({ map: winT, toneMapped: false })); m.material.color.setScalar(1.3); m.position.set(x, 3.35, z); m.rotation.y = ry; g.add(m); glow(c, g, 0xffb060, 1.2, x + (x < 10 ? 0.2 : -0.2), 3.35, z, 0.35); });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      pools.forEach(([h, m]) => { m.visible = h.visible; });
      for (let k = 0; k < NE; k++) { el[k] += dt * (0.35 + (k % 5) * 0.06); if (el[k] > 1) el[k] = 0; const u = el[k]; ep[k * 3] = 6.6 + Math.sin(k * 7.3 + u * 6) * 0.25 * (0.3 + u); ep[k * 3 + 1] = 0.9 + u * 3.2; ep[k * 3 + 2] = 2.0 + Math.cos(k * 3.1 + u * 5) * 0.25 * (0.3 + u); }
      eg.attributes.position.needsUpdate = true;
      torches.forEach(([f, f2], k) => { const v = 0.5 + Math.sin(t * 17 + k * 3) * 0.08 + Math.sin(t * 31 + k) * 0.05; f.scale.set(v, v * 1.4, 1); f2.material.opacity = 0.3 + Math.sin(t * 9 + k) * 0.08; });
      smokes.forEach((list, j) => list.forEach((q, k) => { const u = (t * 0.08 + k / 3 + j * 0.2) % 1; q.sp.position.y = 4.2 + u * 3; q.sp.material.opacity = 0.3 * (1 - u); }));
    });
  },

  // ---------- The Odd Couple: 1049 Park Avenue ----------
  // New things trade sides with the line exactly as the set's own do: neat on one half, slob on the other.
  oddcouple(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN, mine = [];
    r.post = { ...r.post, bloom: 0.85, vig: 0.45 };
    const keep = (o, lx, neat) => { mine.push([o, lx, neat]); return o; };
    // the illusion: an Ames window. A trapezoid painted as a window seen in perspective, turning round and round on a wire.
    // The eye will not have it turning: it sees a window swinging back and forth, and the rod through it bends and passes through.
    const AW = 2.4, AH1 = 1.45, AH2 = 0.85;
    const ames = c.canvasTex(1024, 640, (q, w, h) => {
      const top = (u) => h / 2 - (AH1 + (AH2 - AH1) * u) / AH1 * h / 2, bot = (u) => h / 2 + (AH1 + (AH2 - AH1) * u) / AH1 * h / 2;
      const path = (u0, u1, v0, v1) => { q.beginPath(); const P2 = (u, v) => [u * w, top(u) + (bot(u) - top(u)) * v]; [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].forEach(([u, v], k) => { const [x, y] = P2(u, v); k ? q.lineTo(x, y) : q.moveTo(x, y); }); q.closePath(); };
      path(0, 1, 0, 1); q.fillStyle = '#e8dcc0'; q.fill();
      // the panes, narrower toward the short side, cut out
      const cols = [0, 0.4, 0.71, 0.92, 1], fr = (u) => 0.07 - 0.035 * u;
      q.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const u0 = cols[i] + fr(cols[i]) * 0.55, u1 = cols[i + 1] - fr(cols[i + 1]) * 0.55; path(u0, u1, j ? 0.53 : 0.09, j ? 0.91 : 0.47); q.fill(); }
      q.globalCompositeOperation = 'source-over';
      // shading painted on as if it were a box seen at an angle: the inner edges of each pane darker on one side
      q.strokeStyle = 'rgba(90,70,40,.55)'; q.lineWidth = 6; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const u0 = cols[i] + fr(cols[i]) * 0.55, u1 = cols[i + 1] - fr(cols[i + 1]) * 0.55; path(u0, u1, j ? 0.53 : 0.09, j ? 0.91 : 0.47); q.stroke(); }
      q.strokeStyle = '#8a6a3a'; q.lineWidth = 10; path(0, 1, 0, 1); q.stroke();
    });
    const aw = new T.Group(); aw.position.set(10, 3.25, 0.6); g.add(aw);
    const pane = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(-AW / 2, -AH1 / 2), new T.Vector2(AW / 2, -AH2 / 2), new T.Vector2(AW / 2, AH2 / 2), new T.Vector2(-AW / 2, AH1 / 2)])), new T.MeshBasicMaterial({ map: ames, alphaTest: 0.5, side: T.DoubleSide }));
    { const uv = pane.geometry.attributes.uv, ps = pane.geometry.attributes.position; for (let k = 0; k < uv.count; k++) uv.setXY(k, ps.getX(k) / AW + 0.5, ps.getY(k) / AH1 + 0.5); }
    aw.add(pane);
    const rod = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 1.4, 10), K.std(0xf5c542, { roughness: 0.5 })); rod.rotation.x = PI / 2; rod.position.set(-0.62, 0.24, 0); aw.add(rod);
    const tipM = new T.Mesh(new T.ConeGeometry(0.018, 0.06, 10), K.std(0x2a2a2a)); tipM.rotation.x = PI / 2; tipM.position.set(-0.62, 0.24, 0.73); aw.add(tipM);
    g.add(c.slab(0.006, H6 - 3.25 - AH1 / 2, 0.006, K.std(0x888888, { metalness: 1 }), 10, (H6 + 3.25 + AH1 / 2) / 2, 0.6));
    c.clickable(aw, () => { c.sound.squeak(); c.egg('oddcouple_ames', 'It turns all the way round. Your eye says it is swinging back and forth, and the pencil goes straight through the glass. A window that cannot pick a side, hung right on the line. MLow hung it there on purpose.'); }, 'A turning window');
    // the city through a second window, lights coming on in the towers across Park Avenue
    const city = plane(c, g, 2.4, 1.8, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#2a1a3a'); q.fillStyle = gr; q.fillRect(0, 0, w, h); for (let k = 0; k < 8; k++) { const bw = w * (0.08 + Math.random() * 0.08), bh = h * (0.35 + Math.random() * 0.55), x0 = k * w / 8; q.fillStyle = '#141a30'; q.fillRect(x0, h - bh, bw, bh); for (let i = 0; i < 30; i++) if (Math.random() < 0.6) { q.fillStyle = Math.random() < 0.85 ? '#ffd27a' : '#9ae8ff'; q.fillRect(x0 + 4 + Math.random() * (bw - 10), h - bh + 4 + Math.random() * (bh - 10), 5, 6); } } q.strokeStyle = '#e8dcc0'; q.lineWidth = 14; q.strokeRect(0, 0, w, h); q.beginPath(); q.moveTo(w / 2, 0); q.lineTo(w / 2, h); q.moveTo(0, h / 2); q.lineTo(w, h / 2); q.stroke(); }, 2.0, 2.5, -7.97, { basic: true, tone: false, k: 1.2, px: 256 });
    glow(c, g, 0x8ab0ff, 3.2, 2.0, 2.5, -7.6, 0.18);
    // two standard lamps, one each side, warm
    [[0.9, 0.8], [K.W - 0.9, 0.8]].forEach(([x, z]) => { const l = new T.Group(); l.position.set(x, 0, z); g.add(l); l.add(c.slab(0.03, 1.5, 0.03, K.std(0xc8a050, { metalness: 0.9, roughness: 0.3 }), 0, 0.75, 0)); const sh = new T.Mesh(new T.CylinderGeometry(0.18, 0.28, 0.32, 20, 1, true), new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.25, 0.85), side: T.DoubleSide, toneMapped: false })); sh.position.y = 1.6; l.add(sh); glow(c, l, 0xffd090, 2.0, 0, 1.55, 0, 0.45); c.post(X(x), z, 0.3); });
    // Oscar's television with the ballgame on, flickering blue: it trades sides with him
    const tv = new T.Group(); tv.position.set(3.2, 0, 2.0); tv.rotation.y = 0.7; g.add(tv); keep(tv, 3.2, false);
    tv.add(c.slab(0.9, 0.62, 0.5, K.std(0x4a2a14, { roughness: 0.5 }), 0, 0.31, 0)); tv.add(c.slab(0.7, 0.52, 0.45, K.std(0x3a2a1a, { roughness: 0.4 }), 0, 0.88, 0));
    const scrT = c.canvasTex(128, 96, (q, w, h) => { q.fillStyle = '#4a8a4a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#e8f0e8'; q.lineWidth = 2; q.beginPath(); q.moveTo(w / 2, h * 0.9); q.lineTo(w * 0.15, h * 0.4); q.moveTo(w / 2, h * 0.9); q.lineTo(w * 0.85, h * 0.4); q.stroke(); q.fillStyle = '#c8a070'; q.beginPath(); q.arc(w / 2, h * 0.62, 10, 0, 7); q.fill(); q.fillStyle = '#fff'; q.font = `700 12px ${c.MONO}`; q.fillText('METS 2  N3W 1', 6, 14); });
    const scr = new T.Mesh(new T.PlaneGeometry(0.56, 0.42), new T.MeshBasicMaterial({ map: scrT, toneMapped: false })); scr.position.set(0, 0.88, 0.228); tv.add(scr); const tvg = glow(c, tv, 0x9ac8ff, 1.6, 0, 0.88, 0.4, 0.35);
    // Felix's bar cart, decanters lined up by height
    const cart = new T.Group(); cart.position.set(K.W - 2.6, 0, 6.6); g.add(cart); keep(cart, 2.6, true); const brass = K.std(0xc8a050, { metalness: 0.9, roughness: 0.3 });
    [0.25, 0.75].forEach((y) => cart.add(c.slab(0.9, 0.025, 0.45, K.std(0x1a1a1a, { roughness: 0.15, metalness: 0.4 }), 0, y, 0))); [[-0.43, -0.2], [0.43, -0.2], [-0.43, 0.2], [0.43, 0.2]].forEach(([dx, dz]) => cart.add(c.slab(0.02, 0.8, 0.02, brass, dx, 0.4, dz)));
    for (let k = 0; k < 4; k++) { const d = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.2 + k * 0.03, 12), new T.MeshPhysicalMaterial({ color: [0xc87a2a, 0x8a2a1a, 0xe8d8a0, 0x6a3a10][k], transparent: true, opacity: 0.8, roughness: 0.05 })); d.position.set(-0.3 + k * 0.2, 0.86 + k * 0.015, 0); cart.add(d); }
    // the oval rug on the neat side
    const rug = plane(c, g, 2.6, 1.8, (q, w, h) => { q.fillStyle = '#2a4a6a'; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); q.fill(); q.strokeStyle = '#e8dcc0'; q.lineWidth = 10; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.44, h * 0.42, 0, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, h / 2, h * 0.2, '#e8dcc0', '#c8a050'); }, K.W - 5.0, 0.008, -1.0, { floor: true, px: 256 }); keep(rug, 5.0, true);
    // cigar smoke over the poker table, an ashtray smoking on the slob side, flies over the old sandwiches
    haze(c, r, g, { n: 4, box: [8.6, 11.4, 1.8, 2.6, -6.2, -4.2], col: 0xc8c0b0, op: 0.12, s: [1.6, 2.6], speed: 0.06 });
    const ash = new T.Group(); ash.position.set(4.6, 0.02, 3.6); g.add(ash); keep(ash, 4.6, false); ash.add(new T.Mesh(new T.CylinderGeometry(0.09, 0.07, 0.04, 14), K.std(0x6a6a70, { metalness: 0.6 })));
    const curl = [0, 1, 2].map((k) => { const s = new T.Sprite(new T.SpriteMaterial({ map: smokeTex(c), color: 0xd8d0c0, opacity: 0.3, transparent: true, depthWrite: false })); ash.add(s); return s; });
    const sand = find(g, (o) => o.isGroup && Math.abs(o.position.y - 0.78) < 0.01 && Math.abs(o.position.z + 4.2) < 0.01 && o.children.length === 4);
    const NFL = 7, flp = new Float32Array(NFL * 3), flg = new T.BufferGeometry(); flg.setAttribute('position', new T.BufferAttribute(flp, 3));
    const flies = new T.Points(flg, new T.PointsMaterial({ color: 0x111111, size: 0.025 })); flies.frustumCulled = false; (sand || g).add(flies);
    // crown moulding round the top of the walls
    const mould = K.std(0xf0e6cc, { roughness: 0.6 });
    [[10, H6 - 0.12, -7.86, 20, 0.18], [10, H6 - 0.12, 7.86, 20, 0.18]].forEach(([x, y, z, w2, d]) => g.add(c.slab(w2, 0.24, d, mould, x, y, z)));
    [[0.14, 0], [K.W - 0.38, 0]].forEach(([x]) => g.add(c.slab(0.18, 0.24, 16, mould, x, H6 - 0.12, 0)));
    motes(c, r, g, { n: 120, box: [1, 19, 0.5, 4.5, -7, 6], col: 0xfff0d8, size: 0.03, op: 0.45, drift: 0.04 });
    mine.forEach(([m, lx, neat]) => { m.position.x = neat === false ? lx : K.W - lx; });
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      aw.rotation.y = t * 0.55;
      const neatLeft = !(P.x - r.x0 < K.W / 2); mine.forEach(([m, lx, neat]) => { const tx = neat === neatLeft ? lx : K.W - lx; m.position.x += (tx - m.position.x) * Math.min(1, dt * 5); });
      const fl = 0.75 + Math.sin(t * 23) * 0.15 + Math.sin(t * 7) * 0.1; scr.material.color.setScalar(fl * 1.4); tvg.material.opacity = 0.25 * fl;
      curl.forEach((s, k) => { const u = (t * 0.25 + k / 3) % 1; s.position.set(Math.sin(u * 7 + k) * 0.06, 0.05 + u * 0.7, 0); s.scale.setScalar(0.08 + u * 0.35); s.material.opacity = 0.35 * (1 - u); });
      for (let k = 0; k < NFL; k++) { const a = t * (3 + k * 0.7) + k; flp[k * 3] = Math.cos(a) * 0.18 + Math.sin(a * 2.3) * 0.05; flp[k * 3 + 1] = 0.15 + Math.sin(a * 1.7) * 0.07; flp[k * 3 + 2] = Math.sin(a) * 0.14; }
      flg.attributes.position.needsUpdate = true;
    });
  },

  // ---------- On the Town: the Brooklyn Navy Yard, 6 A.M. ----------
  ontown(c, r, g, X, K) {
    const T = c.THREE;
    r.post = { ...r.post, bloom: 0.85, vig: 0.4 };
    // the illusion: a reverspective, the way Patrick Hughes paints the city. Three blocks stick out toward you and are painted as
    // three avenues running away from you, so as you walk past them the streets swing round to follow you.
    const mk = find(g, (o) => o.isGroup && near(o, 16.3, null, 1.6)); if (mk) mk.position.set(18.4, mk.position.y, 0.4);
    const rv = new T.Group(); rv.position.set(14.4, 0.95, 0.15); rv.rotation.y = -0.28; g.add(rv);
    const BWd = 1.2, BHt = 1.8, TW = 0.34, TH = 0.46, DEP = 0.62, TY = -0.12;
    const face = (draw) => { const t = c.canvasTex(256, 256, draw); const m = new T.MeshBasicMaterial({ map: t, side: T.DoubleSide }); m.color.setScalar(0.92); return m; };
    const facade = (flip, tone) => face((q, w, h) => { q.fillStyle = tone; q.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { const u = i / 7, x = (flip ? 1 - u - 1 / 7 : u) * w; q.fillStyle = 'rgba(0,0,0,.18)'; q.fillRect(x, 0, 2, h); for (let j = 0; j < 9; j++) { q.fillStyle = (i * 7 + j) % 5 ? '#f8d890' : '#2a3a5a'; q.fillRect(x + w / 7 * 0.22, h * (0.04 + j * 0.107), w / 7 * 0.56, h * 0.06); } } });
    const sky = face((q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#f0a878'); gr.addColorStop(1, '#ffe0b8'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 4; k++) { q.beginPath(); q.ellipse(w * (0.2 + k * 0.2), h * (0.3 + (k % 2) * 0.3), 30, 8, 0, 0, 7); q.fill(); } });
    const street = face((q, w, h) => { q.fillStyle = '#4a4a50'; q.fillRect(0, 0, w, h); q.fillStyle = '#8a8a8a'; q.fillRect(0, 0, w, h * 0.16); q.fillRect(0, h * 0.84, w, h * 0.16); q.fillStyle = '#f5c542'; for (let x = 0; x < w; x += 40) q.fillRect(x, h * 0.48, 22, 6); });
    const tip = face((q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f8b890'); gr.addColorStop(1, '#ffe8c8'); q.fillStyle = gr; q.fillRect(0, 0, w, h); K.eyeFlower(q, w / 2, h * 0.42, w * 0.18, '#fff4e0', '#ff7a1a'); q.fillStyle = '#5a5060'; for (let k = 0; k < 9; k++) { const bw = w / 9, bh = h * (0.2 + Math.random() * 0.25); q.fillRect(k * bw, h * 0.8 - bh, bw - 2, bh); } q.fillStyle = '#4a4a50'; q.fillRect(0, h * 0.8, w, h * 0.2); });
    const quad = (A, B, C2, D, mat, N = 10) => { const geo = new T.PlaneGeometry(1, 1, N, N), ps = geo.attributes.position, uv = geo.attributes.uv, p = new T.Vector3(), q2 = new T.Vector3(); for (let k = 0; k < ps.count; k++) { const s = uv.getX(k), tt = uv.getY(k); p.copy(A).lerp(B, s); q2.copy(D).lerp(C2, s); p.lerp(q2, tt); ps.setXYZ(k, p.x, p.y, p.z); } geo.computeVertexNormals(); const m = new T.Mesh(geo, mat); rv.add(m); return m; };
    const fac = [facade(false, '#9a4a3a'), facade(true, '#8a5a4a'), facade(false, '#7a6a5a'), facade(true, '#a85a40'), facade(false, '#6a5a6a'), facade(true, '#9a6a4a')];
    [-1, 0, 1].forEach((k) => {
      const cx = k * BWd, V = (x, y, z) => new T.Vector3(x, y, z);
      const b0 = V(cx - BWd / 2, -BHt / 2, 0), b1 = V(cx + BWd / 2, -BHt / 2, 0), b2 = V(cx + BWd / 2, BHt / 2, 0), b3 = V(cx - BWd / 2, BHt / 2, 0);
      const t0 = V(cx - TW / 2, TY - TH / 2, DEP), t1 = V(cx + TW / 2, TY - TH / 2, DEP), t2 = V(cx + TW / 2, TY + TH / 2, DEP), t3 = V(cx - TW / 2, TY + TH / 2, DEP);
      // each face runs from its edge on the board (near, s = 0) to its edge on the tip (far, s = 1)
      quad(b3, t3, t0, b0, fac[(k + 1) * 2]);        // left wall of the avenue
      quad(b2, t2, t1, b1, fac[(k + 1) * 2 + 1]);    // right wall
      quad(b3, b2, t2, t3, sky);                     // the sky over it
      quad(b0, b1, t1, t0, street);                  // the street
      quad(t0, t1, t2, t3, tip);                     // the far end of the avenue
    });
    const frm = K.std(0x1e2a3a, { roughness: 0.5 });
    rv.add(c.slab(3 * BWd + 0.16, 0.08, 0.12, frm, 0, BHt / 2 + 0.04, 0.02)); rv.add(c.slab(3 * BWd + 0.16, 0.08, 0.12, frm, 0, -BHt / 2 - 0.04, 0.02)); [-1, 1].forEach((s) => rv.add(c.slab(0.08, BHt + 0.16, 0.12, frm, s * (1.5 * BWd + 0.04), 0, 0.02)));
    rv.add(c.slab(3 * BWd, BHt, 0.04, K.std(0x5a4a3a, { roughness: 0.8 }), 0, 0, -0.02));
    [-1, 1].forEach((s) => { const lg = c.slab(0.1, 0.95, 0.1, frm, s * 1.5, -BHt / 2 - 0.47, 0.1); rv.add(lg); });
    const pl = c.sign('N3W YORK, ONE DAY OF IT. WALK PAST SLOWLY', { w: 2.6, h: 0.16, bg: '#f4ead2', fg: '#1e2a3a', font: c.SERIF, weight: 800 }); pl.position.set(0, BHt / 2 + 0.2, 0.05); rv.add(pl);
    c.post(X(14.4), 0.15, 1.0); c.post(X(14.4 - 1.3), 0.15 + 0.36, 0.6); c.post(X(14.4 + 1.3), 0.15 - 0.36, 0.6);
    c.clickable(rv, () => { c.sound.whistle(); c.egg('ontown_reverse', 'Three avenues running away from you, built coming toward you. Walk past and the streets swing round to follow. Twenty four hours of shore leave feels exactly like that. MLow painted it the Hughes way.'); }, 'A painting of three avenues');
    // the flag at the corner of the yard, flying
    const fp = new T.Group(); fp.position.set(19.1, 0, -7.2); g.add(fp); fp.add(c.slab(0.07, 7.2, 0.07, K.std(0xd8d8d8, { metalness: 0.7, roughness: 0.3 }), 0, 3.6, 0)); c.post(X(19.1), -7.2, 0.2);
    const flagT = c.canvasTex(380, 200, (q, w, h) => { for (let k = 0; k < 13; k++) { q.fillStyle = k % 2 ? '#f4f0e8' : '#b22234'; q.fillRect(0, k * h / 13, w, h / 13 + 1); } q.fillStyle = '#3c3b6e'; q.fillRect(0, 0, w * 0.4, h * 7 / 13); q.fillStyle = '#f4f0e8'; for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { q.beginPath(); q.arc(10 + i * 18, 9 + j * 17, 3, 0, 7); q.fill(); } });
    const FN = 16, flag = new T.Mesh(new T.PlaneGeometry(1.8, 0.95, FN, 4).translate(-0.9, 0, 0), new T.MeshStandardMaterial({ map: flagT, side: T.DoubleSide, roughness: 0.8 })); flag.position.set(-0.04, 6.6, 0); fp.add(flag);
    const fpos = flag.geometry.attributes.position, fx0 = Float32Array.from({ length: fpos.count }, (_, k) => fpos.getX(k));
    // the signal lamp on its tripod by the rope, flashing the ship's name in light
    const sl = new T.Group(); sl.position.set(5.0, 0, -5.8); sl.rotation.y = 0.6; g.add(sl); const blk = K.std(0x1a1e24, { metalness: 0.6, roughness: 0.4 });
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2, l = c.slab(0.03, 1.3, 0.03, blk, Math.cos(a) * 0.2, 0.62, Math.sin(a) * 0.2); l.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); sl.add(l); }
    const lh = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.34, 18), blk); lh.rotation.x = PI / 2; lh.position.y = 1.36; sl.add(lh); const lens = new T.Mesh(new T.CircleGeometry(0.14, 18), hot(c, 0xfff4d8, 2.6)); lens.position.set(0, 1.36, 0.175); sl.add(lens); const lg2 = glow(c, sl, 0xfff0d0, 1.6, 0, 1.36, 0.3, 1); c.post(X(5.0), -5.8, 0.35);
    const MORSE = '-. ...-- .--  -.-- --- .-. -.- . .-. ...'; let mi = 0, mt = 0;
    // chains between the bollards along the pier edge
    const chainM = K.std(0x2a2e30, { metalness: 0.8, roughness: 0.4 });
    [[2.2, 10], [10, 17.8]].forEach(([a, b]) => { const cv = new T.QuadraticBezierCurve3(new T.Vector3(a, 0.5, -6.0), new T.Vector3((a + b) / 2, 0.18, -6.1), new T.Vector3(b, 0.5, -6.0)); const pts = cv.getPoints(30), ln = new T.InstancedMesh(new T.TorusGeometry(0.035, 0.012, 5, 10), chainM, pts.length), m4 = new T.Matrix4(); pts.forEach((p, k) => { m4.makeRotationY(k % 2 ? PI / 2 : 0); m4.setPosition(p); ln.setMatrixAt(k, m4); }); g.add(ln); });
    // smoke from the Yard's stacks beyond the rope, gulls wheeling, puddles holding the sky
    const stacks = [[3.2, -7.7], [16.8, -7.7]].map(([x, z]) => haze(c, r, g, { n: 3, box: [x, x, 4.5, 8, z, z], col: 0xd8c8c0, op: 0.35, s: [2, 3.4], speed: 0, addv: false }));
    const birdG = new T.BufferGeometry(); birdG.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.12, -0.4, 0.06, -0.05, 0, 0, -0.08, 0, 0, 0.12, 0.4, 0.06, -0.05, 0, 0, -0.08], 3)); birdG.computeVertexNormals();
    const gulls = []; for (let k = 0; k < 6; k++) { const b = new T.Mesh(birdG, new T.MeshStandardMaterial({ color: 0xf4f4f4, side: T.DoubleSide })); g.add(b); gulls.push({ b, a: Math.random() * 6.3, rr: 5 + Math.random() * 6, y: 7 + Math.random() * 4, sp: 0.3 + Math.random() * 0.2 }); }
    const pud = new T.MeshStandardMaterial({ color: 0x1a1c22, metalness: 1, roughness: 0.05, envMapIntensity: 1.5 });
    [[7.2, 3.2, 1.0, 0.45], [12.6, 5.6, 0.8, 0.35], [3.4, 5.4, 0.7, 0.3]].forEach(([x, z, a, b2]) => { const p = new T.Mesh(new T.CircleGeometry(1, 28), pud); p.scale.set(a, b2, 1); p.rotation.x = -PI / 2; p.position.set(x, 0.007, z); g.add(p); });
    const dawn = glow(c, g, 0xffc890, 14, 10, 1.2, -9, 0.25);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      for (let k = 0; k < fpos.count; k++) { const x = fx0[k], u = -x / 1.8; fpos.setZ(k, Math.sin(t * 5 + x * 4) * 0.12 * u); fpos.setY(k, fpos.getY(k)); } fpos.needsUpdate = true;
      mt -= dt; if (mt < 0) { const ch = MORSE[mi % MORSE.length]; mi++; const on = ch === '.' || ch === '-'; lens.visible = lg2.visible = on; mt = ch === '-' ? 0.6 : ch === '.' ? 0.2 : 0.35; if (!on) mt = ch === ' ' ? 0.5 : 0.2; }
      gulls.forEach((q) => { q.a += dt * q.sp; q.b.position.set(10 + Math.cos(q.a) * q.rr, q.y + Math.sin(q.a * 3) * 0.5, -3 + Math.sin(q.a) * q.rr * 0.5); q.b.rotation.y = -q.a; q.b.scale.y = 0.5 + Math.abs(Math.sin(t * 6 + q.rr)) * 1.2; });
      stacks.forEach((list, j) => list.forEach((q, k) => { const u = (t * 0.07 + k / 3 + j * 0.3) % 1; q.sp.position.y = 4.5 + u * 5; q.sp.position.x += Math.sin(t * 0.3) * dt * 0.1; q.sp.material.opacity = 0.35 * (1 - u); }));
      dawn.material.color.copy(c.scene.fog.color);
    });
  },

  // ---------- The Godfather: Louis' Restaurant, the Bronx ----------
  godfather(c, r, g, X, K) {
    const T = c.THREE, H6 = K.H_IN;
    r.post = { ...r.post, bloom: 1.0, vig: 0.58 };
    // the illusion: the cafe wall. Rows of black and white tiles with grey grout, each row shifted a little from the one above.
    // Every line is dead level. They all look like they are sliding downhill, the way the room tilts for him at that table.
    const cafe = (w, h, rows) => { const px = 64, t = c.canvasTex(px * 2, px * rows, (q, W2, H2) => {
      const sh = [0, 0.5, 1, 0.5]; q.fillStyle = '#7c7c7c'; q.fillRect(0, 0, W2, H2);
      for (let j = 0; j < rows; j++) { const off = sh[j % 4] * px; for (let i = -2; i < 4; i++) { q.fillStyle = (i & 1) ? '#f2eee6' : '#121212'; q.fillRect(i * px + off, j * px + px * 0.04, px, px * 0.92); } }
    }); t.wrapS = T.RepeatWrapping; t.repeat.set(w / (2 * h / rows), 1); t.magFilter = T.LinearFilter; return t; };
    const frieze = new T.Mesh(new T.PlaneGeometry(12, 1.3), new T.MeshStandardMaterial({ map: cafe(12, 1.3, 6), roughness: 0.35 })); frieze.position.set(10, 5.2, -7.985); g.add(frieze);
    [[0.15, PI / 2], [K.W - 0.39, -PI / 2]].forEach(([x, ry]) => { const m = new T.Mesh(new T.PlaneGeometry(15.8, 0.9), new T.MeshStandardMaterial({ map: cafe(15.8, 0.9, 4), roughness: 0.35 })); m.position.set(x, 4.6, 0); m.rotation.y = ry; g.add(m); });
    const wain = new T.Mesh(new T.PlaneGeometry(19.6, 0.9), new T.MeshStandardMaterial({ map: cafe(19.6, 0.9, 4), roughness: 0.35 })); wain.position.set(10, 0.5, 7.985); wain.rotation.y = PI; g.add(wain);
    c.clickable(frieze, () => { c.sound.roar(0.15); c.egg('godfather_tiles', 'Every row of tiles at Louis\' runs dead level. The black and white make them lean like a man walking back from the bathroom with something taped to the cistern. MLow laid them straight. Check with your thumb.'); }, 'The tiles over the door');
    // a hex mosaic floor, the Bronx kind, in place of the plain terrazzo
    const floor = find(g, (o) => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === K.W && Math.abs(o.position.y + 0.05) < 0.01);
    if (floor) {
      const hexT = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#6a6458'; q.fillRect(0, 0, w, h); const R = 14, dx = R * Math.sqrt(3), dy = R * 1.5; for (let j = -1; j * dy < h + R; j++) for (let i = -1; i * dx < w + dx; i++) { const x = i * dx + (j & 1 ? dx / 2 : 0), y = j * dy, n = hash(i, j), flower = ((i + (j & 1) * 0) % 6 === 0 && j % 4 === 0); q.fillStyle = flower ? '#8a1a14' : n < 0.025 ? '#1a1a1a' : `rgb(${226 + n * 20},${220 + n * 18},${206 + n * 16})`; q.beginPath(); for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3; q.lineTo(x + Math.cos(a) * (R - 1.4), y + Math.sin(a) * (R - 1.4)); } q.fill(); } });
      hexT.wrapS = hexT.wrapT = T.RepeatWrapping; hexT.repeat.set(2.2 / 1.6, 2.2 / 1.6);
      floor.material = new T.MeshStandardMaterial({ map: hexT, roughness: 0.4, envMapIntensity: 1.1 });
    }
    // a halo round every candle flame, and a pool of light on every cloth
    const flames = findAll(g, (o) => o.isMesh && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - 0.012) < 1e-4);
    const halos = flames.map((f, k) => { f.material = hot(c, 0xffb040, 2.6); const p = new T.Vector3(); f.getWorldPosition(p); p.x -= r.x0; return [glow(c, g, 0xffa040, 0.5, p.x, p.y, p.z, 0.9), glow(c, g, 0xff9a40, 1.5, p.x, p.y - 0.25, p.z, 0.3), k]; });
    // brass sconces between the pictures on both side walls
    [[0.18, PI / 2], [K.W - 0.42, -PI / 2]].forEach(([x, ry]) => [-5.4, -3.0, -0.6].forEach((z) => { const s = new T.Group(); s.position.set(x, 3.25, z); s.rotation.y = ry; g.add(s); s.add(c.slab(0.12, 0.2, 0.04, K.std(0xc8a050, { metalness: 0.9, roughness: 0.3 }), 0, 0, 0)); const sh = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 0.16, 14, 1, true), new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.0, 0.55), side: T.DoubleSide, toneMapped: false })); sh.position.set(0, 0.14, 0.1); s.add(sh); glow(c, s, 0xffb070, 1.2, 0, 0.12, 0.15, 0.5); }));
    // dark beams across the ceiling, and chianti bottles hung in straw from the one over the bar
    const beamM = K.std(0x2a1a10, { roughness: 0.7 }); for (let x = 1.5; x < 20; x += 3.4) g.add(c.slab(0.26, 0.3, 16, beamM, x, H6 - 0.15, 0));
    const straw = K.std(0xc8a050, { roughness: 1 }), glassG = K.std(0x1a3a1a, { roughness: 0.1, metalness: 0.2 });
    for (let k = 0; k < 7; k++) { const x = 1.5 + (k % 2 ? 0.25 : -0.25), z = -6.2 + k * 0.5, y = 4.6 - (k % 3) * 0.25; g.add(c.slab(0.006, H6 - 0.3 - y, 0.006, K.std(0x6a5a3a), x, (H6 - 0.3 + y) / 2 + 0.1, z)); const b = new T.Mesh(new T.SphereGeometry(0.1, 12, 10), straw); b.position.set(x, y, z); g.add(b); const n = new T.Mesh(new T.CylinderGeometry(0.02, 0.035, 0.2, 10), glassG); n.position.set(x, y + 0.16, z); g.add(n); }
    // plates of spaghetti and bread on the side tables
    const pasta = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#f4f0e8'; q.beginPath(); q.arc(64, 64, 60, 0, 7); q.fill(); q.strokeStyle = '#e8c070'; q.lineWidth = 3; for (let k = 0; k < 40; k++) { q.beginPath(); q.arc(64 + (Math.random() - 0.5) * 30, 64 + (Math.random() - 0.5) * 30, 10 + Math.random() * 18, Math.random() * 6, Math.random() * 6 + 2); q.stroke(); } q.fillStyle = '#a82a1a'; q.beginPath(); q.arc(64, 64, 14, 0, 7); q.fill(); });
    const pm = new T.MeshStandardMaterial({ map: pasta, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    [[3.6, -4.6], [16.4, -4.6], [3.6, 0.4], [16.4, 0.4], [5.4, 4.2], [14.6, 4.2]].forEach(([x, z]) => { const p = new T.Mesh(new T.PlaneGeometry(0.26, 0.26), pm); p.rotation.x = -PI / 2; p.position.set(x + 0.18, 0.785, z + 0.14); g.add(p); const br = new T.Mesh(new T.CapsuleGeometry(0.03, 0.12, 4, 8), K.std(0xc89a5a, { roughness: 0.9 })); br.rotation.z = PI / 2; br.position.set(x - 0.2, 0.8, z - 0.12); g.add(br); });
    // the El going over: a band of lit carriage windows crossing the ceiling, the room shaking under it
    const trainT = c.canvasTex(512, 64, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,0)'; q.fillRect(0, 0, w, h); for (let x = 6; x < w; x += 42) { q.fillStyle = 'rgba(255,230,170,.95)'; q.fillRect(x, 14, 30, 36); } });
    const train = new T.Mesh(new T.PlaneGeometry(14, 1.6), new T.MeshBasicMaterial({ map: trainT, color: 0xffe8b0, opacity: 0, ...add(T), fog: false })); train.rotation.x = PI / 2; train.position.set(-8, H6 - 0.33, 2.4); g.add(train);
    haze(c, r, g, { n: 6, box: [1, 19, 2.4, 4.4, -6, 6], col: 0xd8b890, op: 0.08, s: [5, 8], speed: 0.08 });
    motes(c, r, g, { n: 140, box: [1, 19, 0.4, 4.6, -7, 6], col: 0xffe0b0, size: 0.03, op: 0.45, drift: 0.04 });
    let el = 6;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      halos.forEach(([a, b, k]) => { const f = 0.85 + Math.sin(t * 13 + k * 2.1) * 0.1 + Math.sin(t * 27 + k) * 0.06; a.scale.set(0.42 * f, 0.55 * f, 1); b.material.opacity = 0.28 * f; });
      el -= dt; if (el < 0) { const u = -el / 3.0; train.position.x = -8 + u * 36; train.material.opacity = Math.sin(Math.min(1, u) * PI) * 0.35; if (u > 1) { el = 12 + Math.random() * 6; train.material.opacity = 0; } else if (Math.random() < dt * 4) c.shake(0.004); }
    });
  },
};

export const SWAP = {};
