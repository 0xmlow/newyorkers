// Round thirteen batch c8: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// Every illusion is something you see from the spot named in its comment. No new lights: emissive, additive and sprites only.
const PI = Math.PI;

// ---------- small helpers, shared by the batch ----------
const near = (r, ri) => Math.abs(ri - r.i) <= 1;
const GT = new Map();
// one soft round glow texture per colour, shared by the batch
function gtex(K, col) { let t = GT.get(col); if (!t) { t = K.glowTex(col); GT.set(col, t); } return t; }
// an additive glow sprite: bulbs, flames, screens, the moon
function glow(c, K, g, col, x, y, z, s, op = 1) {
  const { THREE } = c, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex(K, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op, fog: false }));
  sp.scale.set(s, s, 1); sp.position.set(x, y, z); g.add(sp); return sp;
}
// a colour above 1 that the finishing pass blooms
function hot(c, hex, k = 1.8, o = {}) { return new c.THREE.MeshBasicMaterial({ color: new c.THREE.Color(hex).multiplyScalar(k), toneMapped: false, ...o }); }
let FADE = null;
function fadeTex(c) { return FADE ||= c.canvasTex(8, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
// a cone of light under a lamp: open cone, bright at the top, gone at the floor
function haze(c, g, x, yTop, z, rTop, rBot, h, col, op = 0.18) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 28, 1, true), new THREE.MeshBasicMaterial({ map: fadeTex(c), color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.position.set(x, yTop - h / 2, z); g.add(m); return m;
}
let SOFT = null;
function softTex(c) { return SOFT ||= c.canvasTex(128, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-in'; const g2 = q.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g2; q.fillRect(0, 0, w, h); }); }
// a shaft of light: a plane, soft at both edges, fading toward its foot
function shaft(c, g, w, h, col, op, x, y, z, rx, ry, rz) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: softTex(c), color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz, 'YXZ'); g.add(m); return m;
}
// motes, snow, embers: points that drift inside a box, only when the set is near
function motes(c, K, r, g, n, [x1, x2, y1, y2, z1, z2], col, size, [vx, vy, vz], wob = 0.2) {
  const { THREE } = c; n = c.MOBILE ? n >> 1 : n;
  const p = new Float32Array(n * 3); for (let k = 0; k < n; k++) p.set([x1 + Math.random() * (x2 - x1), y1 + Math.random() * (y2 - y1), z1 + Math.random() * (z2 - z1)], k * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: gtex(K, 'rgba(255,255,255,.6)'), color: col, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); pts.frustumCulled = false; g.add(pts);
  c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let k = 0; k < n; k++) { let x = p[k * 3] + (vx + Math.sin(t * 0.7 + k) * wob) * dt, y = p[k * 3 + 1] + vy * dt, z = p[k * 3 + 2] + (vz + Math.cos(t * 0.6 + k * 1.3) * wob) * dt; if (y < y1) y = y2; if (y > y2) y = y1; if (x < x1) x = x2; if (x > x2) x = x1; if (z < z1) z = z2; if (z > z2) z = z1; p[k * 3] = x; p[k * 3 + 1] = y; p[k * 3 + 2] = z; } geo.attributes.position.needsUpdate = true; });
  return pts;
}
// a flat picture: a canvas on a plane, lit or self lit
function pic(c, g, w, h, draw, px, x, y, z, ry, o = {}) {
  const { THREE } = c, t = c.canvasTex(Math.round(px * w / h), px, draw);
  const mat = o.lit ? new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.8, transparent: !!o.alpha, depthWrite: !o.alpha }) : new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: !!o.alpha, depthWrite: !o.alpha, fog: o.fog ?? true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; if (o.flat) { m.rotation.set(-PI / 2, 0, ry, 'YXZ'); } g.add(m); return m;
}
// a skyline beyond the south wall, lit windows and all (outdoor sets only: there is nothing out there)
function skyline(c, g, { z = 10.5, y0 = 0, h = 14, w = 20, night = true, tone = '#141820', win = '#ffd890', seed = 1 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const t = c.canvasTex(1024, 512, (q, W2, H2) => {
    let x = 0; while (x < W2) { const bw = 40 + rnd() * 90, bh = H2 * (0.35 + rnd() * 0.6); q.fillStyle = tone; q.fillRect(x, H2 - bh, bw, bh);
      if (rnd() < 0.35) { q.fillRect(x + bw * 0.3, H2 - bh - 18, bw * 0.4, 18); q.fillRect(x + bw * 0.45, H2 - bh - 40, 4, 22); }
      if (rnd() < 0.3) { q.fillStyle = '#2a2018'; q.fillRect(x + bw * 0.6, H2 - bh - 22, 16, 18); q.beginPath(); q.moveTo(x + bw * 0.6 - 2, H2 - bh - 22); q.lineTo(x + bw * 0.6 + 8, H2 - bh - 30); q.lineTo(x + bw * 0.6 + 18, H2 - bh - 22); q.fill(); }
      for (let wy = H2 - bh + 10; wy < H2 - 6; wy += 13) for (let wx = x + 6; wx < x + bw - 8; wx += 11) { const on = rnd(); if (night ? on < 0.42 : on < 0.9) { q.fillStyle = night ? (on < 0.08 ? '#a8d8ff' : win) : (on < 0.5 ? '#3a4a5a' : '#8aa0b8'); q.globalAlpha = night ? 0.55 + rnd() * 0.45 : 0.7; q.fillRect(wx, wy, 6, 8); q.globalAlpha = 1; } }
      x += bw + 2 + rnd() * 10; }
  });
  const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false }));
  m.position.set(10, y0 + h / 2, z); m.rotation.y = PI; g.add(m); return m;
}
// the set's own floor and ceiling slabs, found by their size
const slabOf = (g, y) => g.children.find((m) => m.isMesh && m.geometry?.parameters?.width === 20 && m.geometry.parameters.depth === 16 && Math.abs(m.position.y - y) < 0.2);
// instanced tumbling paper: newspapers, bills, ticker tape
function paper(c, r, g, n, tex, w, h, [x1, x2, y1, y2, z1, z2], fall, spin = 3) {
  const { THREE } = c; n = c.MOBILE ? Math.ceil(n / 2) : n;
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, color: tex ? 0xffffff : 0xf4ead2, side: THREE.DoubleSide, roughness: 0.9 }), n); im.frustumCulled = false; g.add(im);
  const S = []; for (let i = 0; i < n; i++) S.push({ x: x1 + Math.random() * (x2 - x1), y: y1 + Math.random() * (y2 - y1), z: z1 + Math.random() * (z2 - z1), r: Math.random() * 6 });
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const step = (t, dt) => { S.forEach((b, i) => { fall(b, t, dt, i); if (b.y < y1) b.y = y2; if (b.x > x2) b.x = x1; if (b.x < x1) b.x = x2; b.r += dt * spin * (0.5 + (i % 3) * 0.3); e4.set(b.r, b.r * 0.7, b.r * 0.3); q4.setFromEuler(e4); m4.compose(v4.set(b.x, b.y, b.z), q4, one); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  step(0, 0); c.tick((t, dt, P, ri) => { if (near(r, ri)) step(t, dt); });
  return im;
}

export const PROPS = {};

export const ROOM = {
  // ---------- The Out-of-Towners, 1970 ----------
  // Illusion: an open utility vault in the middle of the street, three storeys of brick and pipe down to glowing water.
  // It is painted (a parallax shader in a flat plane): walk straight over it. Reads from the entrance and from anywhere.
  outoftowners(c, r, g, X, K) {
    const { THREE } = c, PX = 7.0, PZ = 1.6, HW = 1.05, HD = 0.75, DEP = 3.4;
    const pm = new THREE.ShaderMaterial({
      uniforms: { cam: { value: new THREE.Vector3() }, t: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 cam; uniform float t; varying vec3 vP;
        const float HW = ${HW.toFixed(3)}, HD = ${HD.toFixed(3)}, DEP = ${DEP.toFixed(3)};
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        vec3 brick(vec2 uv) { vec2 b = vec2(0.23, 0.085); float row = floor(uv.y / b.y); vec2 q = vec2(uv.x / b.x + mod(row, 2.0) * 0.5, uv.y / b.y); vec2 f = fract(q); float m = step(0.07, f.x) * step(0.12, f.y); float n = hash(floor(q)); float gr = 0.75 + 0.25 * sin(uv.x * 31.0 + sin(uv.x * 7.0) * 3.0); vec3 col = mix(vec3(0.20, 0.10, 0.07), vec3(0.34, 0.18, 0.11), n) * gr; return mix(vec3(0.03, 0.028, 0.025), col, m); }
        void main() {
          vec3 d = normalize(vP - cam); if (d.y > -0.0005) discard;
          float tx = ((d.x > 0.0 ? HW : -HW) - vP.x) / d.x, tz = ((d.z > 0.0 ? HD : -HD) - vP.z) / d.z, ty = (-DEP - vP.y) / d.y;
          float tt = min(min(tx, tz), ty); vec3 h = vP + d * tt; float dep = -h.y; vec3 col;
          if (tt == ty) { float w = 0.5 + 0.5 * sin(h.x * 9.0 + t * 2.0) * sin(h.z * 7.0 - t * 1.6); col = mix(vec3(1.1, 0.38, 0.06), vec3(2.6, 1.15, 0.32), w * w); }
          else {
            vec2 uv = tt == tx ? vec2(h.z, dep) : vec2(h.x, dep); col = brick(uv);
            float pipe = smoothstep(0.09, 0.0, abs(dep - 1.15)); col = mix(col, vec3(0.16, 0.2, 0.22) * (0.5 + 0.9 * smoothstep(0.06, 0.0, abs(dep - 1.12))), pipe);
            float pipe2 = smoothstep(0.05, 0.0, abs(dep - 2.1)); col = mix(col, vec3(0.5, 0.18, 0.08), pipe2 * step(0.0, h.x));
            if (tt == tz && h.z < 0.0 && abs(h.x) < 0.3) { float rail = step(0.25, abs(h.x)); float rung = step(0.84, fract(dep / 0.3)); col = mix(col, vec3(0.62, 0.58, 0.5), max(rail, rung) * step(dep, DEP - 0.2)); }
            float rim = smoothstep(0.12, 0.0, dep); col = mix(col, vec3(0.22, 0.22, 0.24), rim);
            col *= exp(-dep * 1.0); col += vec3(1.2, 0.42, 0.06) * exp(-(DEP - dep) * 1.5) * 1.1;
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const pg = new THREE.PlaneGeometry(HW * 2, HD * 2); pg.rotateX(-PI / 2);
    const pit = new THREE.Mesh(pg, pm); pit.position.set(PX, 0.006, PZ); g.add(pit);
    pit.onBeforeRender = (rd, sc, cam) => { pm.uniforms.cam.value.copy(cam.position); pit.worldToLocal(pm.uniforms.cam.value); };
    c.tick((t, dt, P, ri) => { if (near(r, ri)) pm.uniforms.t.value = t; });
    // the steel rim, the lid leaning on a cone, the striped horses round it
    const steel = K.std(0x4a4c50, { metalness: 0.8, roughness: 0.35 });
    [[0, -HD - 0.04, HW * 2 + 0.16, 0.08], [0, HD + 0.04, HW * 2 + 0.16, 0.08], [-HW - 0.04, 0, 0.08, HD * 2], [HW + 0.04, 0, 0.08, HD * 2]].forEach(([dx, dz, w, d]) => g.add(c.slab(w, 0.025, d, steel, PX + dx, 0.012, PZ + dz)));
    const plateT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#5a5c60'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) { q.save(); q.translate(x, y); q.rotate((y / 16 % 2 ? 1 : -1) * 0.6); q.fillStyle = '#8a8c90'; q.fillRect(-5, -1.5, 10, 3); q.restore(); } q.fillStyle = '#f5c542'; q.font = `900 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText('N3W EDISON', w / 2, h / 2 + 10); });
    const lid = c.slab(1.1, 0.04, 0.8, new THREE.MeshStandardMaterial({ map: plateT, metalness: 0.8, roughness: 0.4 }), PX - 1.6, 0.36, PZ - 0.1); lid.rotation.z = -1.2; g.add(lid);
    const cone = (x, z) => { const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); o.add(new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 16), K.std(0xff6a10, { roughness: 0.5 }))); o.children[0].position.y = 0.31; const band = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.115, 0.1, 16), K.std(0xf4f4f0, { roughness: 0.3 })); band.position.y = 0.36; o.add(band); o.add(c.slab(0.4, 0.03, 0.4, K.std(0x111111), 0, 0.015, 0)); };
    [[PX - 1.45, PZ - 1.0], [PX + 1.45, PZ + 1.0], [PX - 1.45, PZ + 1.05], [PX + 2.3, PZ - 0.9]].forEach(([x, z]) => cone(x, z));
    K.steam(g, PX - 0.3, 0.1, PZ); K.steam(g, PX + 0.4, 0.2, PZ + 0.2);
    glow(c, K, g, 'rgba(255,120,30,.7)', PX, 0.05, PZ, 2.6, 0.35);
    wallSign(c, g, 'N3W EDISON, WORK IN PROGRESS', PX - 0.2, 0.75, PZ - 1.08, 0.0, { w: 1.1, h: 0.16, bg: '#ff6a10', fg: '#111', font: c.MONO, weight: 800 });
    c.clickable(pit, () => { c.sound.boom(0.3); c.egg('outoftowners_vault', 'An open vault on 45th Street, three storeys of steam and pipe and nobody watching it. You walked right across it. It is paint. MLow says the city has more holes than New Yorkers, and counts both.'); }, 'An open vault');
    // the traffic light on its wire over the middle of the street, cycling for nobody
    const wire = K.std(0x0a0a0a, { roughness: 0.6 });
    [[3.9, -1.0, 0.12], [4.25, -3.6, 0.25], [4.1, 0.9, 0.18]].forEach(([y, z, sag]) => { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.2, y, z), new THREE.Vector3(10, y - sag * 4, z + 0.3), new THREE.Vector3(19.8, y, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.012, 4), wire)); });
    const tl = new THREE.Group(); tl.position.set(10, 3.05, -1.0); g.add(tl); tl.add(c.slab(0.34, 0.95, 0.3, K.std(0x2a2410, { roughness: 0.5, metalness: 0.3 }), 0, 0, 0)); tl.add(c.slab(0.02, 0.32, 0.02, wire, 0, 0.62, 0));
    const lampM = [0xff2a1a, 0xffb020, 0x30ff80].map((h) => hot(c, h, 0.12)), lampC = [0xff2a1a, 0xffb020, 0x30ff80].map((h) => new THREE.Color(h));
    const lampG = [];
    [0.3, 0, -0.3].forEach((dy, k) => { [1, -1].forEach((s) => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), lampM[k]); d.position.set(0, dy, s * 0.152); if (s < 0) d.rotation.y = PI; tl.add(d); const v = c.slab(0.26, 0.03, 0.12, K.std(0x1a1608), 0, dy + 0.13, s * 0.2); tl.add(v); }); lampG.push(glow(c, K, tl, ['rgba(255,60,40,.8)', 'rgba(255,180,40,.8)', 'rgba(60,255,140,.8)'][k], 0, dy, 0.3, 0.9, 0)); });
    let phase = -1;
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const u = t % 12, on = u < 5 ? 2 : u < 10 ? 0 : 1; if (on === phase) return; phase = on; lampM.forEach((m, k) => m.color.copy(lampC[k]).multiplyScalar(k === on ? 2.6 : 0.1)); lampG.forEach((s, k) => { s.material.opacity = k === on ? 0.9 : 0; }); });
    // puddles that hold the neon, and the neon itself smeared across the wet street
    const pudT = c.canvasTex(256, 256, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2, h / 2.4, 0, 0, 7); q.fill(); });
    const pudM = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.04, metalness: 0.9, alphaMap: pudT, transparent: true, depthWrite: false, envMapIntensity: 2.2 });
    [[6.2, 2.0, 2.2, 1.2], [13.4, 1.2, 2.6, 1.4], [16.6, -1.2, 2.0, 1.6], [4.0, -3.4, 1.6, 1.0], [12.6, -5.0, 1.8, 0.9], [8.4, 5.6, 2.2, 1.3]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pudM); m.rotation.x = -PI / 2; m.position.set(x, 0.004, z); g.add(m); });
    [[16.9, -2.6, 'rgba(255,60,60,.9)', 0xff3040, 0.9], [18.0, -2.0, 'rgba(255,200,80,.9)', 0xffc040, 0.7], [7.0, -0.4, 'rgba(60,120,255,.9)', 0x3070ff, 0.6], [13.4, 1.0, 'rgba(255,79,163,.9)', 0xff4fa3, 0.7], [5.0, 7.0, 'rgba(34,211,238,.9)', 0x22d3ee, 0.8]].forEach(([x, z, , col, op]) => shaft(c, g, 0.7, 3.2, col, op * 0.55, x, 0.012, z + 1.2, -PI / 2, 0, 0));
    // rain landing: rings on the wet asphalt
    const NR = c.MOBILE ? 30 : 70, ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.035, 0.05, 14).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), NR); ring.frustumCulled = false; g.add(ring);
    const RS = []; for (let i = 0; i < NR; i++) RS.push({ x: 1 + Math.random() * 18, z: -7 + Math.random() * 14, u: Math.random() }); const m4 = new THREE.Matrix4(), col = new THREE.Color();
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; RS.forEach((s, i) => { s.u += dt * 1.6; if (s.u > 1) { s.u = 0; s.x = 1 + Math.random() * 18; s.z = -7 + Math.random() * 14; } const k = 0.3 + s.u * 3.2; m4.makeScale(k, 1, k); m4.setPosition(s.x, 0.008, s.z); ring.setMatrixAt(i, m4); ring.setColorAt(i, col.setScalar((1 - s.u) * 0.5)); }); ring.instanceMatrix.needsUpdate = true; if (ring.instanceColor) ring.instanceColor.needsUpdate = true; });
    // a page of the paper, blowing down the block
    const pageT = c.canvasTex(128, 160, (q, w, h) => { q.fillStyle = '#e8e2d0'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = `900 18px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE N3W DAILY', w / 2, 22); q.font = `900 26px ${c.FONT}`; q.fillText('STRIKE', w / 2, 56); q.fillStyle = '#666'; for (let i = 0; i < 12; i++) q.fillRect(10 + (i % 2) * 58, 70 + (i >> 1) * 14, 50, 8); });
    paper(c, r, g, 5, pageT, 0.4, 0.5, [0.5, 19.5, 0.05, 1.4, -6, 6], (b, t, dt, i) => { b.x += dt * (1.2 + (i % 3) * 0.5); b.y = 0.15 + Math.abs(Math.sin(t * 1.3 + i * 2)) * (0.9 + (i % 2)); b.z += Math.sin(t * 0.7 + i) * dt * 0.6; }, 2.5);
    // a diner in neon on the south wall, blinking, and the skyline over it
    const roofM = K.std(0x1a1a1a, { metalness: 0.6 }); [[6.0, 4.2], [14.6, 3.0]].forEach(([x, w]) => [-w / 2 + 0.2, w / 2 - 0.2].forEach((dx) => g.add(c.slab(0.06, 0.9, 0.06, roofM, x + dx, 4.3, 8.0))));
    const din = wallSign(c, g, 'N3W DINER, OPEN ALL NIGHT', 6.0, 4.75, 8.0, PI, { w: 4.2, h: 0.5, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 18 });
    const bar = wallSign(c, g, 'COFFEE 10 CENTS', 14.6, 4.7, 8.0, PI, { w: 3.0, h: 0.42, bg: null, fg: '#22d3ee', font: c.MONO, weight: 800, glow: 16 });
    din.material.color.setScalar(1.6); bar.material.color.setScalar(1.5);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; bar.visible = (t % 3.2) > 0.25 && !((t % 7.1) > 6.8); });
    skyline(c, g, { z: 11, h: 15, seed: 7 });
    // the street lamps get their wet halo, and a little cone of rain under each
    glow(c, K, g, 'rgba(255,220,160,.8)', 1.4, 4.25, -1.0, 2.2, 0.8);
    haze(c, g, 1.4, 4.2, -1.0, 0.15, 1.6, 4.2, 0xffd8a0, 0.12);
  },

  // ---------- The Naked City, 1948 ----------
  // Illusion: shadows that are not theirs. Every walker on the boards throws the long noir shadow of somebody else,
  // and so do you: look down from anywhere on the set and there is a man in a hat at your feet.
  nakedcity(c, r, g, X, K) {
    const { THREE } = c;
    const fig = (kind) => c.canvasTex(128, 512, (q, w, h) => {
      q.filter = 'blur(1px)'; q.fillStyle = '#000'; const cx = w / 2, R = (x, y, ww, hh) => q.fillRect(cx + x - ww / 2, y, ww, hh), E = (x, y, rx, ry) => { q.beginPath(); q.ellipse(cx + x, y, rx, ry, 0, 0, 7); q.fill(); };
      // feet are at the bottom of the canvas (the end that touches the walker), the head at the top
      if (kind === 0) { E(0, 34, 44, 9); R(0, 6, 46, 30); E(0, 58, 20, 24); q.beginPath(); q.moveTo(cx - 32, 80); q.lineTo(cx + 32, 80); q.lineTo(cx + 46, 330); q.lineTo(cx - 46, 330); q.fill(); R(-14, 330, 18, 170); R(14, 330, 18, 170); q.beginPath(); q.moveTo(cx + 30, 100); q.lineTo(cx + 62, 190); q.lineTo(cx + 52, 196); q.lineTo(cx + 24, 120); q.fill(); R(56, 186, 14, 40); }   // hat, trench coat, a gun
      if (kind === 1) { q.beginPath(); q.arc(cx, 70, 60, PI, 0); q.fill(); R(0, 70, 4, 60); E(0, 120, 17, 20); q.beginPath(); q.moveTo(cx - 22, 140); q.lineTo(cx + 22, 140); q.lineTo(cx + 50, 380); q.lineTo(cx - 50, 380); q.fill(); R(-12, 380, 12, 120); R(12, 380, 12, 120); }   // umbrella, a dress
      if (kind === 2) { R(0, 24, 40, 14); E(0, 30, 30, 7); E(0, 58, 19, 22); q.beginPath(); q.moveTo(cx - 34, 80); q.lineTo(cx + 34, 80); q.lineTo(cx + 40, 320); q.lineTo(cx - 40, 320); q.fill(); R(-14, 320, 20, 180); R(14, 320, 20, 180); q.save(); q.translate(cx + 34, 200); q.rotate(-0.6); q.fillRect(0, 0, 8, 110); q.restore(); }   // a cop with a nightstick
      if (kind === 3) { E(-40, 40, 26, 30); q.fillRect(cx - 41, 70, 2, 170); E(0, 250, 15, 17); q.beginPath(); q.moveTo(cx - 20, 268); q.lineTo(cx + 20, 268); q.lineTo(cx + 26, 400); q.lineTo(cx - 26, 400); q.fill(); R(-9, 400, 12, 100); R(9, 400, 12, 100); q.save(); q.translate(cx - 18, 280); q.rotate(0.9); q.fillRect(0, -50, 7, 56); q.restore(); }   // a kid with a balloon
      if (kind === 4) { E(0, 50, 18, 21); q.beginPath(); q.moveTo(cx - 30, 72); q.lineTo(cx + 30, 72); q.lineTo(cx + 36, 300); q.lineTo(cx - 36, 300); q.fill(); R(-12, 300, 18, 200); R(12, 300, 18, 200); q.save(); q.translate(cx + 30, 120); q.rotate(-0.2); q.fillRect(0, 0, 40, 150); q.restore(); E(70 - cx + cx, 110, 0, 0); }   // a man carrying a case
    });
    const TX = [0, 1, 2, 3, 4].map(fig), dir = Math.atan2(-0.95, -0.32);   // the sun is low in the east: shadows run west
    const shadow = (k, L = 4.4) => { const geo = new THREE.PlaneGeometry(1.15, L); geo.translate(0, -L / 2, 0); geo.rotateX(-PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TX[k], transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.y = dir; g.add(m); return m; };
    const walkers = g.children.filter((o) => o.userData && o.userData.sp !== undefined && o.userData.dir !== undefined && o.userData.ph !== undefined);
    const SH = walkers.map((e, i) => { const s = shadow(1 + (i % 4)); s.position.set(e.position.x, 0.012, e.position.z); return s; });
    const mine = shadow(0, 4.8); mine.visible = false;
    c.tick((t, dt, P, ri) => {
      if (!near(r, ri)) return;
      walkers.forEach((e, i) => SH[i].position.set(e.position.x, 0.012, e.position.z));
      mine.visible = ri === r.i; if (mine.visible) mine.position.set(P.x - r.x0, 0.013, P.z);
    });
    // the detective's shadow on the boards is the man he is looking for
    const ds = shadow(0, 5.0); ds.position.set(12.4, 0.012, 2.4); ds.material.opacity = 0.85;
    // the bridge's main cables overhead, and the suspenders down to the truss
    const cableM = K.std(0x4a4a4a, { metalness: 0.7, roughness: 0.45 });
    [3.0, 17.0].forEach((x) => { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 12, -16), new THREE.Vector3(x, 6.2, -4), new THREE.Vector3(x, 4.4, 4), new THREE.Vector3(x, 5.2, 12)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 40, 0.14, 8), cableM));
      const n = 12, sus = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5), cableM, n), m4 = new THREE.Matrix4(), v = new THREE.Vector3(); for (let i = 0; i < n; i++) { const z = -7.2 + i * 1.3; let u = 0, best = 9; for (let k = 0; k <= 60; k++) { cv.getPoint(k / 60, v); const d = Math.abs(v.z - z); if (d < best) { best = d; u = k / 60; } } cv.getPoint(u, v); const top = v.y, bot = 3.3; m4.makeScale(1, top - bot, 1); m4.setPosition(x, (top + bot) / 2, z); sus.setMatrixAt(i, m4); } g.add(sus); });
    // the lamps on the trusses, lit, with a little fog round each
    [[3.6, -4.6], [3.6, 0.4], [16.4, -4.6], [16.4, 0.4]].forEach(([x, z]) => { glow(c, K, g, 'rgba(255,250,235,.9)', x, 2.62, z, 1.4, 0.95); haze(c, g, x, 2.6, z, 0.06, 1.0, 2.6, 0xffffff, 0.07); });
    // the fog comes off the river in banks and rolls across the walk
    const fogM = new THREE.SpriteMaterial({ map: gtex(K, 'rgba(235,235,235,.35)'), transparent: true, depthWrite: false, opacity: 0.4 }), banks = [];
    for (let k = 0; k < (c.MOBILE ? 4 : 7); k++) { const s = new THREE.Sprite(fogM); s.scale.set(7, 3, 1); s.position.set(Math.random() * 20, 1.0 + Math.random() * 1.6, -6 + Math.random() * 10); g.add(s); banks.push(s); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; banks.forEach((s, k) => { s.position.x += dt * (0.25 + k * 0.04); if (s.position.x > 24) s.position.x = -4; }); });
    // pigeons, a flock wheeling over the walk
    const NB = c.MOBILE ? 12 : 24, bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, -0.32, 0.06, -0.05, 0, 0, -0.1, 0, 0, 0.12, 0.32, 0.06, -0.05, 0, 0, -0.1], 3)); bg.computeVertexNormals();
    const birds = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide }), NB); birds.frustumCulled = false; g.add(birds);
    const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), be = new THREE.Euler(), bv = new THREE.Vector3(), bs = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let i = 0; i < NB; i++) { const a = t * 0.45 + i * 0.26, R = 5 + (i % 5) * 0.6; bv.set(10 + Math.cos(a) * R, 6.5 + Math.sin(t * 0.8 + i) * 0.6 + (i % 3) * 0.4, -2 + Math.sin(a) * R * 0.7); be.set(0, -a, 0.3); bq.setFromEuler(be); bs.set(1, 1 + Math.sin(t * 14 + i) * 0.9, 1); bm.compose(bv, bq, bs); birds.setMatrixAt(i, bm); } birds.instanceMatrix.needsUpdate = true; });
    // the press photographer, flash on a stick, and the pictures he will sell by morning
    const ph = K.extra(g, 15.4, -0.6, { col: 0x2a2a2a, ry: -PI / 2 + 0.3 }); c.post(X(15.4), -0.6, 0.4);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), K.std(0x111111)); hat.position.y = 1.98; ph.add(hat); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.15, 14), K.std(0x1a1a1a)); cr.position.y = 2.06; ph.add(cr);
    const camB = c.slab(0.22, 0.2, 0.18, K.std(0x111111, { metalness: 0.4 }), 0, 1.45, 0.32); ph.add(camB); const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.05, 0.08, 16, 1, true), K.std(0xd8d8d8, { metalness: 1, roughness: 0.15, side: THREE.DoubleSide })); pan.rotation.x = PI / 2; pan.position.set(0.16, 1.62, 0.36); ph.add(pan);
    const flash = glow(c, K, ph, 'rgba(255,255,255,1)', 0.16, 1.62, 0.5, 2.6, 0); let fl = 0;
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fl -= dt; if (fl < -3.5 - (t % 2)) fl = 0.12; flash.material.opacity = fl > 0 ? 1 : 0; });
    c.clickable(ph, () => { fl = 0.15; c.sound.click ? c.sound.click() : c.sound.tick(); c.egg('nakedcity_flash', 'Flash. A man with a press camera shoots every stranger on the bridge and sells them to the papers by morning. Look at the boards: none of the shadows match. MLow bought the negatives, all eight million.'); }, 'A press photographer');
    // a gantry sign over the walk, the skyline of the Lower East Side behind the south wall
    const gan = new THREE.Group(); gan.position.set(10, 0, -3.6); g.add(gan); gan.add(c.slab(14.2, 0.18, 0.18, cableM, 0, 3.5, 0));
    const gs = c.sign('TO DELANCEY ST.   N3W YORKERS WALK EAST', { w: 6.4, h: 0.42, bg: '#1a1a1a', fg: '#f4f4ea', font: c.FONT, weight: 800, border: '#cfcfcf' }); gs.position.set(0, 3.15, 0.1); gan.add(gs);
    skyline(c, g, { z: 11, h: 12, night: false, tone: '#3a3a3a', seed: 3 });
    // a stencil on the boards, and loose pages blowing across them
    const st = pic(c, g, 4.4, 0.7, (q, w, h) => { q.fillStyle = 'rgba(240,240,232,.55)'; q.font = `900 ${h * 0.6}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('PEDESTRIANS, BE COUNTED', w / 2, h / 2); }, 128, 10, 0.011, 1.2, 0, { alpha: true, flat: true, lit: true });
    st.material.polygonOffset = true; st.material.polygonOffsetFactor = -2;
    paper(c, r, g, 6, null, 0.36, 0.46, [0.5, 19.5, 0.03, 1.2, -6.5, 6.5], (b, t, dt, i) => { b.x -= dt * (0.9 + (i % 3) * 0.4); b.y = 0.08 + Math.abs(Math.sin(t * 1.1 + i * 2)) * 0.8; }, 2);
  },

  // ---------- Planet of the Apes, 1968 ----------
  // Illusion: anamorphic writing in the sand. From the footprints at the entrance (where the set opens) it stands up
  // as a crown and YOU MANIACS, square to your eye. One step off and it is a smear on a beach.
  apes(c, r, g, X, K, mats) {
    const { THREE } = c;
    // the beach: a sand floor with ripples, not a tinted concrete slab
    const sandT = c.canvasTex(1024, 1024, (q, w, h) => { q.fillStyle = '#c9a874'; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y += 3) { const v = Math.sin(y * 0.07 + Math.sin(x * 0.012 + y * 0.004) * 4 + Math.sin(x * 0.031) * 1.2); if (v > 0.75) { q.fillStyle = 'rgba(255,240,210,.12)'; q.fillRect(x, y, 2, 3); } else if (v < -0.8) { q.fillStyle = 'rgba(110,80,45,.1)'; q.fillRect(x, y, 2, 3); } } for (let i = 0; i < 26000; i++) { q.fillStyle = Math.random() < 0.5 ? 'rgba(90,70,40,.35)' : 'rgba(255,245,220,.35)'; q.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } });
    sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(3, 2.4);
    const fl = slabOf(g, -0.05); if (fl) fl.material = new THREE.MeshStandardMaterial({ map: sandT, bumpMap: sandT, bumpScale: 1.2, roughness: 1, color: 0xe8dcc4 });
    // the anamorph: a projector camera sits at the footprints and throws the drawing onto the ground
    const S = new THREE.Vector3(r.x0 + 10, 1.62, 5.8), pj = new THREE.PerspectiveCamera(21.3, 2, 0.1, 100); pj.position.copy(S); pj.lookAt(r.x0 + 10, 0, 0.6); pj.updateMatrixWorld(); pj.updateProjectionMatrix();
    const draw = c.canvasTex(1024, 512, (q, w, h) => {
      q.lineJoin = 'round'; q.lineCap = 'round'; const ink = 'rgba(92,58,30,.92)', lip = 'rgba(255,244,220,.75)';
      // the crown, seven rays
      const cx = w / 2, cy = h * 0.44; q.lineWidth = 16; q.strokeStyle = lip; const crown = () => { q.beginPath(); q.moveTo(cx - 170, cy); q.quadraticCurveTo(cx, cy - 44, cx + 170, cy); q.quadraticCurveTo(cx, cy + 16, cx - 170, cy); for (let i = 0; i < 7; i++) { const a = PI + 0.35 + i * (PI - 0.7) / 6, bx = cx + Math.cos(a) * 150, by = cy - 14 + Math.sin(a) * 12, tx = cx + Math.cos(a) * 250, ty = cy - 30 + Math.sin(a) * 150, nx = -Math.sin(a) * 18, ny = Math.cos(a) * 6; q.moveTo(bx - nx, by - ny); q.lineTo(tx, ty); q.lineTo(bx + nx, by + ny); } q.stroke(); };
      q.save(); q.translate(3, 3); crown(); q.restore(); q.lineWidth = 12; q.strokeStyle = ink; crown();
      q.font = `900 104px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineWidth = 7; q.strokeStyle = lip; q.strokeText('YOU MANIACS', cx + 3, h * 0.66 + 3); q.fillStyle = ink; q.fillText('YOU MANIACS', cx, h * 0.66); q.strokeText('', 0, 0);
      q.font = `800 34px ${c.MONO}`; q.fillStyle = ink; q.fillText('N3W YORK WAS HERE. COUNTED BY MLOW', cx, h * 0.86);
      q.strokeStyle = ink; q.lineWidth = 6; q.strokeRect(70, h * 0.12, w - 140, h * 0.82);
    });
    const am = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { map: { value: draw }, proj: { value: new THREE.Matrix4().multiplyMatrices(pj.projectionMatrix, pj.matrixWorldInverse) } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform sampler2D map; uniform mat4 proj; varying vec3 vW; void main(){ vec4 p = proj * vec4(vW, 1.0); if (p.w <= 0.0) discard; vec2 n = p.xy / p.w; if (abs(n.x) > 1.0 || abs(n.y) > 1.0) discard; vec4 col = texture2D(map, n * 0.5 + 0.5); if (col.a < 0.03) discard; gl_FragColor = vec4(col.rgb, col.a); }' });
    const ag = new THREE.PlaneGeometry(17, 11.2); ag.rotateX(-PI / 2); const ana = new THREE.Mesh(ag, am); ana.position.set(10, 0.008, -2.3); ana.renderOrder = 1; g.add(ana);
    // the footprints you stand in, and a driftwood sign that tells you to
    const feet = pic(c, g, 0.9, 0.9, (q, w, h) => { q.fillStyle = 'rgba(80,55,30,.6)'; [[0.36, 1], [0.64, -1]].forEach(([fx, s]) => { q.beginPath(); q.ellipse(w * fx, h * 0.55, w * 0.09, h * 0.2, s * 0.08, 0, 7); q.fill(); for (let i = 0; i < 5; i++) { q.beginPath(); q.arc(w * fx - s * w * 0.06 + s * i * w * 0.03, h * 0.3 - Math.abs(i - 1) * 3, 5 - i * 0.6, 0, 7); q.fill(); } }); }, 256, 10, 0.011, 5.85, 0, { alpha: true, flat: true, lit: true });
    feet.material.polygonOffset = true; feet.material.polygonOffsetFactor = -3;
    const sp = new THREE.Group(); sp.position.set(11.3, 0, 6.6); sp.rotation.y = -0.5; g.add(sp); sp.add(c.slab(0.09, 1.4, 0.09, K.std(0x7a6a50, { roughness: 1 }), 0, 0.7, 0));
    const board = pic(c, sp, 1.0, 0.36, (q, w, h) => { q.fillStyle = '#9a8460'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(60,40,20,.5)'; for (let i = 0; i < 6; i++) { q.beginPath(); q.moveTo(0, i * h / 6 + 4); q.bezierCurveTo(w / 3, i * h / 6 + 9, w * 0.6, i * h / 6, w, i * h / 6 + 6); q.stroke(); } q.fillStyle = '#2a1a0a'; q.font = `900 ${h * 0.32}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('STAND IN THE FOOTPRINTS', w / 2, h * 0.36); q.font = `700 ${h * 0.2}px ${c.MONO}`; q.fillText('AND READ THE SAND', w / 2, h * 0.72); }, 256, 0, 1.25, 0.06, 0, { lit: true });
    c.clickable(board, () => { c.sound.chords(3); c.egg('apes_sand', 'Stand in the footprints and the sand stands up and shouts at you. Take one step and it is just a beach again. MLow says that is how every ruin works: it only makes sense from where they stood.'); }, 'A driftwood sign');
    // surf: a band of foam that runs along the waterline
    const foamT = c.canvasTex(1024, 64, (q, w, h) => { for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`; q.beginPath(); q.ellipse(Math.random() * w, h / 2 + (Math.random() - 0.5) * h * 0.6, 3 + Math.random() * 14, 1.5 + Math.random() * 4, 0, 0, 7); q.fill(); } }); foamT.wrapS = THREE.RepeatWrapping; foamT.repeat.set(2, 1);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.7), new THREE.MeshBasicMaterial({ map: foamT, transparent: true, depthWrite: false, opacity: 0.9 })); foam.rotation.x = -PI / 2; foam.position.set(10, 0.07, -6.1); g.add(foam);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; foamT.offset.x = t * 0.02; foam.position.z = -6.1 + Math.sin(t * 0.9) * 0.18; foam.material.opacity = 0.65 + Math.sin(t * 0.9 + 1) * 0.25; });
    // tide pools that hold the sky
    const poolT = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#fff'; q.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * PI * 2, R = w * (0.38 + Math.sin(i * 2.3) * 0.08); q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.fill(); });
    const poolM = new THREE.MeshStandardMaterial({ color: 0x6a90b0, roughness: 0.03, metalness: 0.85, alphaMap: poolT, transparent: true, depthWrite: false, envMapIntensity: 2.5 });
    [[14.6, -5.2, 1.6], [6.2, 2.4, 1.1], [16.4, 3.0, 1.3], [1.8, -1.6, 1.0]].forEach(([x, z, s]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 1.4, s), poolM); m.rotation.x = -PI / 2; m.position.set(x, 0.006, z); g.add(m); });
    // what is left of the city: a yellow cab up to its roof in sand, girders, a hydrant
    const cab = c.glb('h_taxi', { len: 4.0, x: 17.0, y: -0.75, z: 6.1, ry: -0.5, parent: g, shadow: false }); cab.rotation.z = 0.12; c.post(X(17.0), 6.1, 1.2);
    const rust = K.std(0x6a3a22, { roughness: 0.9, metalness: 0.4 });
    [[12.8, -5.8, 0.4, 0.5, 2.6], [13.5, -6.2, -0.3, 0.2, 2.0], [4.0, 4.0 + 2.6, 0.7, -0.4, 1.6]].forEach(([x, z, rz, ry, h]) => { const b = c.slab(0.16, h, 0.3, rust, x, h / 2 - 0.3, z); b.rotation.set(0, ry, rz); g.add(b); });
    K.prop(r, g, X, 'nyb_hydrant_gold', 3.2, 6.2, { h: 0.8, y: -0.35, ry: 0.6 });
    [[7.6, -4.6, 0.3], [11.6, 0.6, 1.4], [18.2, 1.6, 2.6]].forEach(([x, z, ry]) => K.prop(r, g, X, 'lambis_shell', x, z, { len: 0.22, ry }));
    // gulls on the wind, sand blowing low, sparkle on the water
    for (let k = 0; k < 3; k++) { const gl = c.glb('gull', { len: 0.7, x: 10, y: 7, z: -3, parent: g, shadow: false }); c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const a = t * (0.3 + k * 0.07) + k * 2.1, R = 3 + k * 1.2; gl.position.set(10 + Math.cos(a) * R, 7.5 + k * 0.8 + Math.sin(t + k) * 0.4, -4.5 + Math.sin(a) * R * 0.5); gl.rotation.set(0, -a + (k % 2 ? 0 : PI), Math.sin(t * 2 + k) * 0.2); }); }
    motes(c, K, r, g, 160, [0, 20, 0.02, 0.5, -6, 4], 0x8a7454, 0.025, [1.6, 0, 0.2], 0.3);
    motes(c, K, r, g, 90, [0, 20, 0.05, 0.25, -7.6, -6.4], 0xffffff, 0.09, [0.3, 0, 0], 0.4);
    r.post = { ...(r.post || {}), bloom: 0.9 };
  },

  // ---------- Enchanted, 2007 ----------
  // Illusion: a rotating Ames window. A trapezoid painted as a window seen at an angle turns round and round on its
  // chain over the flat, and your eye swears it is only swinging back and forth. Reads from the entrance, up and left.
  enchanted(c, r, g, X, K) {
    const { THREE } = c;
    const amesT = c.canvasTex(1024, 512, (q, w, h) => {
      // the frame: left edge full height, right edge half. Every bar and pane is drawn in that perspective.
      const L = (u, v) => [u * w, h / 2 + (v - 0.5) * h * (1 - 0.5 * u)];   // u 0..1 across, v 0..1 down
      const cols = [0, 0.3, 0.54, 0.73, 0.88, 1], rows = [0, 0.33, 0.67, 1], quad = (u1, v1, u2, v2) => { q.beginPath(); q.moveTo(...L(u1, v1)); q.lineTo(...L(u2, v1)); q.lineTo(...L(u2, v2)); q.lineTo(...L(u1, v2)); q.closePath(); };
      quad(0, 0, 1, 1); q.fillStyle = '#e8d8b8'; q.fill();
      const glass = ['#ff9ad0', '#9ae8ff', '#ffe08a', '#c8a8ff'];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const bu = 0.06 * (1 - cols[i] * 0.5) , bv = 0.07; const u1 = cols[i] + 0.035, u2 = cols[i + 1] - 0.035, v1 = rows[j] + bv, v2 = rows[j + 1] - bv * 0.6;
        quad(u1, v1, u2, v2); const [ax, ay] = L(u1, v1), [bx, by] = L(u2, v2), gr = q.createLinearGradient(ax, ay, bx, by); gr.addColorStop(0, glass[(i + j) % 4]); gr.addColorStop(1, '#ffffff'); q.fillStyle = gr; q.fill();
        quad(u1, v1, u2, v1 + 0.04); q.fillStyle = 'rgba(80,50,20,.45)'; q.fill(); quad(u1, v1, u1 + 0.015, v2); q.fillStyle = 'rgba(80,50,20,.3)'; q.fill(); }
      q.strokeStyle = '#8a6a30'; q.lineWidth = 6; quad(0.01, 0.01, 0.99, 0.99); q.stroke();
      q.fillStyle = '#ff4fa3'; const [ex, ey] = L(0.15, 0.5); K.eyeFlower(q, ex, ey, 38);
    });
    const ames = new THREE.Group(); ames.position.set(6.6, 3.5, -3.2); g.add(ames);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: amesT, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false })); ames.add(pane);
    const gold = K.std(0xd6a640, { metalness: 1, roughness: 0.25 }); g.add(c.slab(0.02, 6 - 4.15, 0.02, gold, 6.6, (6 + 4.15) / 2, -3.2));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), hot(c, 0xff2a3a, 1.4)); ball.position.set(1.15, -0.25, 0.12); ames.add(ball); const rod = c.slab(0.02, 0.02, 0.5, gold, 1.15, -0.25, 0); ames.add(rod);
    c.tick((t, dt, P, ri) => { if (near(r, ri)) ames.rotation.y = t * 0.55; });
    c.clickable(pane, () => { c.sound.chords(3); c.egg('enchanted_window', 'It is turning all the way round. Your eyes say it only swings. Watch the little red apple go straight through the glass. MLow says Andalasia is like that, and so is the Upper West Side.'); }, 'A window on a chain');
    // a pressed tin ceiling instead of a black hole overhead, and a cornice round the top of the walls
    const ceil = slabOf(g, 6.05);
    if (ceil) { const tin = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, w, h); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = x * 256 + 128, cy = y * 256 + 128; q.strokeStyle = 'rgba(140,110,60,.5)'; q.lineWidth = 6; q.strokeRect(cx - 118, cy - 118, 236, 236); q.strokeStyle = 'rgba(255,255,255,.7)'; q.lineWidth = 3; q.strokeRect(cx - 112, cy - 112, 224, 224); for (let i = 0; i < 8; i++) { q.save(); q.translate(cx, cy); q.rotate(i * PI / 4); q.fillStyle = 'rgba(150,110,60,.35)'; q.beginPath(); q.ellipse(52, 0, 46, 16, 0, 0, 7); q.fill(); q.restore(); } q.fillStyle = '#d6a640'; q.beginPath(); q.arc(cx, cy, 18, 0, 7); q.fill(); } }); tin.wrapS = tin.wrapT = THREE.RepeatWrapping; tin.repeat.set(10, 8); ceil.material = new THREE.MeshStandardMaterial({ map: tin, bumpMap: tin, bumpScale: 2, roughness: 0.5, metalness: 0.2 }); }
    const corn = K.std(0xf0e6d0, { roughness: 0.5 }), gl = K.std(0xd6a640, { metalness: 1, roughness: 0.3 });
    [[10, 7.84, 20, 0], [10, -7.84, 20, 0], [0.16, 0, 16, 1], [19.84, 0, 16, 1]].forEach(([x, z, L, s]) => { g.add(c.slab(s ? 0.2 : L, 0.32, s ? L : 0.2, corn, x, 5.84, z)); g.add(c.slab(s ? 0.22 : L, 0.04, s ? L : 0.22, gl, x, 5.66, z)); });
    // sunlight through the east window, slanting across the flat, with dust turning in it
    [[-4.2, 1.5, 0.22], [-3.0, 1.0, 0.16], [-1.8, 1.3, 0.12]].forEach(([z, w, op], k) => shaft(c, g, w, 9.5, 0xfff0c8, op, 15.0 - k * 0.4, 2.8, z, 0, 0, 0.62));
    motes(c, K, r, g, 140, [9, 19, 0.3, 5.2, -5, -1], 0xffe0a0, 0.05, [0, -0.05, 0], 0.15);
    // fairy dust round the apple, rising
    motes(c, K, r, g, 90, [9.2, 10.8, 0.9, 3.2, -1.4, 0.2], 0xffb0ff, 0.07, [0, 0.35, 0], 0.4);
    glow(c, K, g, 'rgba(255,60,80,.6)', 10, 1.45, -0.6, 1.2, 0.6);
    // a round rug under it all
    const rug = pic(c, g, 5.2, 5.2, (q, w, h) => { const cx = w / 2; [['#f6d6e2', 1], ['#c84a7a', 0.93], ['#f6e8d8', 0.88], ['#2a5ac8', 0.62], ['#f6e8d8', 0.58], ['#ff9ad0', 0.3]].forEach(([col, k]) => { q.fillStyle = col; q.beginPath(); q.arc(cx, cx, cx * k, 0, 7); q.fill(); }); for (let i = 0; i < 16; i++) { q.save(); q.translate(cx, cx); q.rotate(i * PI / 8); q.fillStyle = '#d6a640'; q.beginPath(); q.ellipse(cx * 0.75, 0, cx * 0.1, cx * 0.04, 0, 0, 7); q.fill(); q.fillStyle = '#c84a7a'; q.beginPath(); q.arc(cx * 0.45, 0, cx * 0.035, 0, 7); q.fill(); q.restore(); } K.eyeFlower(q, cx, cx, cx * 0.22); }, 512, 10, 0.007, -0.6, 0, { alpha: true, flat: true, lit: true, rough: 1 });
    rug.material.polygonOffset = true; rug.material.polygonOffsetFactor = -1;
    // sconces between the pictures, candles lit
    const sconce = (x, z, ry) => { const o = new THREE.Group(); o.position.set(x, 3.15, z); o.rotation.y = ry; g.add(o); o.add(c.slab(0.16, 0.34, 0.03, gl, 0, 0, 0)); o.add(c.slab(0.05, 0.05, 0.22, gl, 0, -0.08, 0.11)); const cdl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 10), K.std(0xf8f0e0)); cdl.position.set(0, 0.03, 0.22); o.add(cdl); const f = glow(c, K, o, 'rgba(255,190,90,.95)', 0, 0.16, 0.22, 0.45, 1); return f; };
    const flames = [[0.17, -5.4, PI / 2], [0.17, -3.0, PI / 2], [19.83, -5.4, -PI / 2], [19.83, -3.0, -PI / 2], [3.5, 7.83, PI], [8.7, 7.83, PI], [11.3, 7.83, PI], [16.5, 7.83, PI]].map(([x, z, ry]) => sconce(x, z, ry));
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; flames.forEach((f, k) => f.scale.setScalar(0.42 + Math.sin(t * 11 + k * 2) * 0.04 + Math.sin(t * 17 + k) * 0.03)); });
    // three bluebirds round the chandelier, waiting for the song
    const birds = [0, 1, 2].map((k) => { const b = new THREE.Group(); g.add(b); const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), K.std(0x2a6ae8, { roughness: 0.5 })); body.scale.set(1.5, 1, 1); b.add(body); const belly = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), K.std(0xf8d8b8)); belly.position.set(0.02, -0.03, 0); b.add(belly); const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), K.std(0xf5c542)); beak.rotation.z = -PI / 2; beak.position.x = 0.15; b.add(beak); const wings = [-1, 1].map((s) => { const w2 = c.slab(0.12, 0.01, 0.16, K.std(0x1a4ac8), 0, 0.03, s * 0.1); b.add(w2); return w2; }); b.userData.w = wings; return b; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; birds.forEach((b, k) => { const a = t * 0.9 + k * 2.1; b.position.set(10 + Math.cos(a) * 1.4, 3.7 + Math.sin(t * 2 + k) * 0.15, -0.8 + Math.sin(a) * 1.4); b.rotation.y = -a - PI / 2; b.userData.w.forEach((w2, s) => { w2.rotation.x = (s ? 1 : -1) * Math.sin(t * 22 + k) * 0.7; }); }); });
    // soap bubbles drifting up: the cleaning is coming
    const NBB = c.MOBILE ? 14 : 30, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff0ff, roughness: 0.02, metalness: 0.9, transparent: true, opacity: 0.32, envMapIntensity: 3, depthWrite: false }), NBB); bub.frustumCulled = false; g.add(bub);
    const BB = []; for (let i = 0; i < NBB; i++) BB.push({ x: 2 + Math.random() * 16, y: Math.random() * 5.5, z: -6 + Math.random() * 13, s: 0.4 + Math.random() * 0.9 }); const bm = new THREE.Matrix4();
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; BB.forEach((b, i) => { b.y += dt * (0.18 + (i % 4) * 0.05); if (b.y > 5.6) b.y = 0.2; bm.makeScale(b.s, b.s, b.s); bm.setPosition(b.x + Math.sin(t * 0.8 + i) * 0.3, b.y, b.z + Math.cos(t * 0.6 + i) * 0.3); bub.setMatrixAt(i, bm); }); bub.instanceMatrix.needsUpdate = true; });
    // the storybook, open on the coffee table
    const book = new THREE.Group(); book.position.set(3.6, 0.48, -2.4); book.rotation.y = 0.5; g.add(book);
    const pageT = (left) => c.canvasTex(256, 320, (q, w, h) => { q.fillStyle = '#fbf4e4'; q.fillRect(0, 0, w, h); q.fillStyle = '#7a1020'; q.textAlign = 'center'; if (left) { q.font = `900 30px ${c.SERIF}`; q.fillText('Once upon', w / 2, 70); q.fillText('a time in', w / 2, 108); q.fillText('N3W YORK', w / 2, 146); K.eyeFlower(q, w / 2, 230, 50); } else { q.fillStyle = '#3a2a1a'; q.font = `600 15px ${c.SERIF}`; ['she sang to the pigeons,', 'and the pigeons came.', 'she sang to the rats,', 'and the rats came too.', 'nobody on the block', 'said a word. it is', 'New York. MLow counted', 'every one of them.'].forEach((s, i) => q.fillText(s, w / 2, 60 + i * 28)); } });
    [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.44), new THREE.MeshStandardMaterial({ map: pageT(s < 0), roughness: 0.9 })); p.rotation.set(-PI / 2, 0, 0); p.rotation.y = 0; p.position.set(s * 0.175, 0.02, 0); p.rotateY(-s * 0.12); book.add(p); });
    book.add(c.slab(0.74, 0.03, 0.47, K.std(0x7a1020, { roughness: 0.6 }), 0, 0, 0));
    r.post = { ...(r.post || {}), bloom: 1.1 };
  },

  // ---------- The Wolf of Wall Street, 2013 ----------
  // Illusion: an infinity well in the ceiling. Look up from anywhere in the front half of the floor: neon frames of money
  // go up and up for ever (forced perspective: the whole shaft is five metres), and bills keep falling out of it.
  wolf(c, r, g, X, K) {
    const { THREE } = c, HX1 = 6.6, HX2 = 13.4, HZ1 = -3.7, HZ2 = -1.1, cx = (HX1 + HX2) / 2, cz = (HZ1 + HZ2) / 2, hw = (HX2 - HX1) / 2, hd = (HZ2 - HZ1) / 2;
    const ceil = slabOf(g, 6.05);
    if (ceil) { ceil.visible = false; const m = ceil.material, y = ceil.position.y; [[10, (HZ1 - 8) / 2, 20, HZ1 + 8], [10, (HZ2 + 8) / 2, 20, 8 - HZ2], [HX1 / 2, cz, HX1, HZ2 - HZ1], [(HX2 + 20) / 2, cz, 20 - HX2, HZ2 - HZ1]].forEach(([x, z, w, d]) => g.add(c.slab(w, 0.1, d, m, x, y, z))); }
    const N = 30, bar = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), N * 4), m4 = new THREE.Matrix4(), col = new THREE.Color(); let y = 6.0, s = 1;
    for (let k = 0; k < N; k++) { const fw = hw * s, fd = hd * s, th = 0.07 * s, cA = k % 2 ? [0.25, 1.4, 0.55] : [1.8, 1.25, 0.35], dim = 1.4 * Math.pow(0.93, k);
      [[cx, cz - fd, fw * 2, th], [cx, cz + fd, fw * 2, th], [cx - fw, cz, th, fd * 2], [cx + fw, cz, th, fd * 2]].forEach(([x, z, w, d], j) => { m4.makeScale(w, th, d); m4.setPosition(x, y, z); bar.setMatrixAt(k * 4 + j, m4); bar.setColorAt(k * 4 + j, col.setRGB(cA[0] * dim, cA[1] * dim, cA[2] * dim)); });
      y += 0.42 * s; s *= 0.9; }
    g.add(bar); const top = y;
    const well = new THREE.Mesh(new THREE.CylinderGeometry(s / 0.707, 1 / 0.707, top - 6.0, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0.9, roughness: 0.18, side: THREE.BackSide })); well.rotation.y = PI / 4; well.scale.set(hw, 1, hd); well.position.set(cx, (6.0 + top) / 2, cz);
    // a cylinder with four sides: scale after the 45 degree turn, so wrap it in a group
    const wg = new THREE.Group(); wg.position.set(cx, (6.0 + top) / 2, cz); wg.scale.set(hw, 1, hd); well.position.set(0, 0, 0); well.scale.set(1, 1, 1); wg.add(well); g.add(wg);
    glow(c, K, g, 'rgba(255,230,140,.9)', cx, top + 0.1, cz, 1.2, 1);
    const billT = c.canvasTex(128, 56, (q, w, h) => { q.fillStyle = '#9ab888'; q.fillRect(0, 0, w, h); q.strokeStyle = '#3a5a32'; q.lineWidth = 4; q.strokeRect(4, 4, w - 8, h - 8); q.fillStyle = '#2a4a22'; q.font = `900 20px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('MLOW', w / 2, h / 2 + 7); q.font = `900 16px ${c.MONO}`; q.fillText('100', 20, 22); q.fillText('100', w - 20, h - 12); });
    paper(c, r, g, 36, billT, 0.16, 0.07, [HX1 + 0.3, HX2 - 0.3, 0.05, top - 0.5, HZ1 + 0.2, HZ2 - 0.2], (b, t, dt, i) => { b.y -= dt * (0.35 + (i % 5) * 0.08); b.x += Math.sin(t * 0.9 + i) * dt * 0.25; }, 2.5);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(HX2 - HX1, HZ2 - HZ1), new THREE.MeshBasicMaterial({ visible: false })); hit.rotation.x = PI / 2; hit.position.set(cx, 5.95, cz); g.add(hit);
    c.clickable(hit, () => { c.sound.thump(0.6); c.egg('wolf_moneypit', 'Look up. Floor after floor of money, all the way to the top, and every floor wants more. It is five metres deep. MLow counted to forty frames and stopped, because the forty first is a mirror.'); }, 'A hole in the ceiling');
    // the strip lights actually lit, a cold haze under each
    [[4, -4.2], [10, -4.2], [16, -4.2], [4, -0.6], [10, -0.6], [16, -0.6], [4, 3.0], [16, 3.0]].forEach(([x, z]) => { g.add(c.slab(1.2, 0.03, 0.12, hot(c, 0xe8f4ff, 1.5), x, 5.84, z)); haze(c, g, x, 5.82, z, 0.3, 1.6, 4.2, 0xd8ecff, 0.06); });
    // twelve screens glowing green
    [[5.6, -5.4], [8.6, -5.4], [11.6, -5.4], [14.6, -5.4], [2.6, -2.8], [5.6, -2.8], [14.6, -2.8], [17.6, -2.8], [5.6, -0.2], [14.6, -0.2], [5.6, 2.4], [14.6, 2.4]].forEach(([x, z]) => glow(c, K, g, 'rgba(60,255,120,.6)', x + 0.5, 0.98, z + 0.08, 0.55, 0.7));
    // the tape runs round the walls, prices up and up
    const tape = c.canvasTex(c.MOBILE ? 1024 : 2048, 64, (q, w, h) => { q.fillStyle = '#050505'; q.fillRect(0, 0, w, h); q.font = `800 40px ${c.MONO}`; q.textBaseline = 'middle'; let x = 10; const T = ['N3W +3.17', 'MLOW +11.14', 'CNSUS +6.66', 'SKLY -0.42', 'MARKS +0.69', 'OAK +12.00', 'PINK +4.20', 'EYE +1.11', 'NYC +8.00']; while (x < w) { T.forEach((s2) => { q.fillStyle = s2.includes('-') ? '#ff3a3a' : '#3aff7a'; q.fillText(s2, x, h / 2); x += q.measureText(s2).width + 50; }); } }); tape.wrapS = THREE.RepeatWrapping;
    const tapeM = new THREE.MeshBasicMaterial({ map: tape, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.5) });
    [[10, 7.85, PI, 19.4], [0.15, -3.0, PI / 2, 9.6], [19.85, -3.0, -PI / 2, 9.6]].forEach(([x, z, ry, L]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.3), tapeM); m.position.set(x, 4.85, z); m.rotation.y = ry; g.add(m); g.add(c.slab(ry === PI ? L + 0.1 : 0.04, 0.38, ry === PI ? 0.04 : L + 0.1, K.std(0x111111), x + (ry === PI ? 0 : ry > 0 ? -0.02 : 0.02), 4.85, z + (ry === PI ? 0.02 : 0))); });
    tape.repeat.set(2, 1);
    c.tick((t, dt, P, ri) => { if (near(r, ri)) tape.offset.x = (t * 0.03) % 1; });
    // smoke hanging under the ceiling
    const smokeM = new THREE.SpriteMaterial({ map: gtex(K, 'rgba(170,190,220,.4)'), transparent: true, depthWrite: false, opacity: 0.22 }), puffs = [];
    for (let k = 0; k < (c.MOBILE ? 5 : 10); k++) { const sp = new THREE.Sprite(smokeM); sp.scale.set(5, 2, 1); sp.position.set(Math.random() * 20, 3.6 + Math.random() * 1.6, -6 + Math.random() * 12); g.add(sp); puffs.push(sp); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; puffs.forEach((p, k) => { p.position.x += dt * 0.12 * (k % 2 ? 1 : -1); if (p.position.x > 22) p.position.x = -2; if (p.position.x < -2) p.position.x = 22; }); });
    // a red line light on every phone, blinking out of step
    const PH = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { if ((i === 2 || i === 3) && j > 1) continue; PH.push([2.6 + i * 3.0 - 0.45, -5.4 + j * 2.6 + 0.22]); }
    const led = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), PH.length); g.add(led); PH.forEach(([x, z], i) => { m4.makeTranslation(x, 0.79, z); led.setMatrixAt(i, m4); led.setColorAt(i, col.setRGB(2.5, 0.2, 0.1)); });
    let lt = 0; c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; lt += dt; if (lt < 0.2) return; lt = 0; PH.forEach((p, i) => led.setColorAt(i, (Math.sin(t * 3 + i * 1.7) > 0.2) ? col.setRGB(2.5, 0.15, 0.1) : col.setRGB(0.15, 0.02, 0.02))); led.instanceColor.needsUpdate = true; });
    // the sales boards high on the side walls
    const board = (title, rows, x, ry) => pic(c, g, 3.6, 1.3, (q, w, h) => { q.fillStyle = '#f4f6f8'; q.fillRect(0, 0, w, h); q.strokeStyle = '#8a8e94'; q.lineWidth = 10; q.strokeRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.font = `900 ${h * 0.17}px ${c.FONT}`; q.fillText(title, 24, h * 0.22); q.font = `700 ${h * 0.11}px ${c.MONO}`; rows.forEach(([n, v], i) => { q.fillStyle = '#1d4ed8'; q.fillText(n, 24, h * (0.42 + i * 0.16)); q.fillStyle = '#111'; q.fillText(v, w * 0.62, h * (0.42 + i * 0.16)); }); }, 256, x, 3.75, -4.2, ry, { lit: true });
    board('SALES TODAY', [['DONNIE', '|||| |||| ||'], ['THE KID', '|||| |||'], ['MLOW', '|||| |||| |||| ||||']], 0.16, PI / 2);
    board('NEW YORKERS COUNTED', [['MONDAY', '1,111'], ['TUESDAY', '6,666'], ['TODAY', 'ALL OF THEM']], 19.84, -PI / 2);
    motes(c, K, r, g, 120, [1, 19, 0.5, 5.5, -7, 7], 0xc8d8ff, 0.035, [0.05, 0.02, 0], 0.1);
    r.post = { ...(r.post || {}), bloom: 1.15 };
  },

  // ---------- Mr. Popper's Penguins, 2011 ----------
  // Illusion: cafe wall tiles in penguin black and white over the window and high on both walls. Every row of tiles is
  // dead level and every row looks like a wedge. Reads from the entrance, straight ahead and up.
  penguins(c, r, g, X, K) {
    const { THREE } = c;
    const cafe = c.canvasTex(512, 256, (q, w, h) => { const T = 64, off = [0, 0.25, 0.5, 0.25]; for (let j = 0; j < 4; j++) { for (let i = -1; i < 9; i++) { q.fillStyle = (i % 2 + 2) % 2 ? '#f4f8fc' : '#0a0c10'; q.fillRect((i + off[j]) * T, j * T, T, T); } q.fillStyle = '#7f868f'; q.fillRect(0, j * T - 3, w, 6); } q.fillStyle = '#7f868f'; q.fillRect(0, h - 3, w, 3); });
    cafe.wrapS = cafe.wrapT = THREE.RepeatWrapping;
    const band = (w, h, x, y, z, ry) => { const t = cafe.clone(); t.needsUpdate = true; t.repeat.set(w / 3.0, h / 1.5); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.25, metalness: 0.05 })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    const nb = band(12, 1.5, 10, 5.2, -7.86, 0); band(7.4, 2.25, 0.15, 4.55, -4.1, PI / 2); band(7.4, 2.25, 19.85, 4.55, -4.1, -PI / 2);
    const trim = K.std(0xd6dde6, { metalness: 0.8, roughness: 0.25 }); [[10, 4.42, -7.84, 12.2, 0], [10, 5.98, -7.84, 12.2, 0]].forEach(([x, y, z, L]) => g.add(c.slab(L, 0.06, 0.06, trim, x, y, z)));
    c.clickable(nb, () => { c.sound.honk(); c.egg('penguins_tiles', 'Every row of tiles is dead straight. Get a ruler. Every row looks like a slide for penguins anyway. MLow tiled the penthouse in it so the birds would feel at home.'); }, 'The tiles');
    // frosted windows on the walls by the doors, snow beyond, cold light coming in
    const frost = c.canvasTex(256, 384, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8ecff'); gr.addColorStop(1, '#a8c8f0'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(80,100,130,.5)'; for (let i = 0; i < 9; i++) q.fillRect(i * 30 + 6, h * 0.55 - (i * 37 % 90), 22, h); q.strokeStyle = 'rgba(255,255,255,.75)'; q.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = Math.random() < 0.5 ? Math.random() * 40 : w - Math.random() * 40, y = Math.random() * h; q.beginPath(); q.moveTo(x, y); for (let k = 0; k < 4; k++) q.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50); q.stroke(); } q.fillStyle = '#e8eef4'; q.fillRect(w / 2 - 5, 0, 10, h); q.fillRect(0, h / 2 - 5, w, 10); q.strokeStyle = '#e8eef4'; q.lineWidth = 18; q.strokeRect(0, 0, w, h); });
    [[0.14, PI / 2], [19.86, -PI / 2]].forEach(([x, ry]) => { const m = pic(c, g, 1.6, 2.4, (q, w, h) => q.drawImage(frost.image, 0, 0, w, h), 256, x, 2.3, 6.9, ry); m.material.color.setScalar(1.25); shaft(c, g, 1.4, 7, 0xc8e4ff, 0.14, x + (ry > 0 ? 2.2 : -2.2), 1.8, 6.4, 0, ry, (ry > 0 ? -1 : 1) * 0.9); });
    motes(c, K, r, g, 60, [0.3, 19.7, 0.2, 4, 5.8, 7.9], 0xffffff, 0.06, [0, -0.4, 0], 0.2);
    // icicles all the way round under the ceiling, and drifts along the walls
    const NI = c.MOBILE ? 60 : 130, ice = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 6).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.8, envMapIntensity: 2 }), NI), m4 = new THREE.Matrix4();
    for (let i = 0; i < NI; i++) { const u = i / NI * 64, side = u < 20 ? 0 : u < 32 ? 1 : u < 52 ? 2 : 3, a = side === 0 ? u : side === 1 ? u - 20 : side === 2 ? u - 32 : u - 52; const [x, z] = side === 0 ? [a, 7.8] : side === 1 ? [19.8, 7.6 - a * 1.3] : side === 2 ? [20 - a, -7.8] : [0.2, -7.6 + a * 1.3]; const L = 0.2 + Math.random() * 0.55; m4.makeScale(1, L, 1); m4.setPosition(x, 5.95 - L / 2, z); ice.setMatrixAt(i, m4); }
    g.add(ice);
    const drift = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }); [[1.2, -7.2, 1.6], [18.6, -7.0, 1.4], [0.9, 7.4, 1.3], [19.1, 7.3, 1.7], [0.8, -0.2, 0.9], [19.2, 1.2, 0.9]].forEach(([x, z, s]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), drift); d.scale.set(s, s * 0.35, s * 0.8); d.position.set(x, 0, z); g.add(d); });
    // the chandeliers lit cold, a soft glow under each
    [[10, 4.35, -1.0, 2.0], [4.6, 4.55, 3.6, 1.6]].forEach(([x, y, z, s]) => { glow(c, K, g, 'rgba(220,240,255,.9)', x, y, z, s, 0.9); haze(c, g, x, y, z, 0.2, 1.6, y, 0xe0f0ff, 0.05); });
    // an ice fireplace on the west wall: blue flames that are colder than the room
    const fp = new THREE.Group(); fp.position.set(0.12, 0, 0.4); fp.rotation.y = PI / 2; g.add(fp);
    const mm = K.std(0xf0f4f8, { roughness: 0.2, metalness: 0.1 }); fp.add(c.slab(1.7, 0.1, 0.45, mm, 0, 1.22, 0.2)); fp.add(c.slab(0.25, 1.2, 0.36, mm, -0.72, 0.6, 0.18)); fp.add(c.slab(0.25, 1.2, 0.36, mm, 0.72, 0.6, 0.18)); fp.add(c.slab(1.2, 0.9, 0.05, K.std(0x0a1018), 0, 0.45, 0.02));
    const fl = [0, 1, 2, 3].map((k) => glow(c, K, fp, 'rgba(80,180,255,.9)', -0.36 + k * 0.24, 0.3, 0.2, 0.5, 1)); const fg = glow(c, K, fp, 'rgba(120,200,255,.5)', 0, 0.4, 0.4, 1.8, 0.7);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fl.forEach((f, k) => { const s2 = 0.4 + Math.abs(Math.sin(t * 7 + k * 1.3)) * 0.25; f.scale.set(s2 * 0.8, s2 * 1.4, 1); f.position.y = 0.25 + s2 * 0.3; }); fg.material.opacity = 0.55 + Math.sin(t * 9) * 0.1; });
    c.post(X(0.5), 0.4, 0.5);
    // a snow globe the size of a tub, Park Avenue inside it, snowing
    const SG = new THREE.Group(); SG.position.set(8.2, 0, 1.0); g.add(SG); c.post(X(8.2), 1.0, 0.65);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.34, 32), K.std(0x2a1a10, { roughness: 0.35 })); base.position.y = 0.17; SG.add(base); const gband = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.05, 32), K.std(0xb08a40, { metalness: 0.9, roughness: 0.35 })); gband.position.y = 0.3; SG.add(gband);
    [[0, 0.3, 0.9], [-0.22, 0.2, 0.6], [0.22, 0.24, 0.7], [0.1, 0.16, 0.45], [-0.12, 0.18, 0.5]].forEach(([dx, w, h], k) => SG.add(c.slab(w * 0.6, h * 0.5, w * 0.6, K.std(0x8a96a6, { roughness: 0.6 }), dx, 0.36 + h * 0.25, (k % 2 ? 0.12 : -0.1))));
    const glassM = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.02, metalness: 0.5, transparent: true, opacity: 0.32, envMapIntensity: 3.5, depthWrite: false }); const gb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20), glassM); gb.position.y = 0.9; SG.add(gb); glow(c, K, SG, 'rgba(200,230,255,.5)', 0, 0.9, 0, 1.7, 0.35);
    const NG = 120, gp = new Float32Array(NG * 3); for (let k = 0; k < NG; k++) gp.set([(Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 0.9, (Math.random() - 0.5) * 0.9], k * 3); const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); const gs = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025 })); SG.add(gs);
    let shake = 0; c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; shake = Math.max(0, shake - dt); for (let k = 0; k < NG; k++) { let x = gp[k * 3], y = gp[k * 3 + 1], z = gp[k * 3 + 2]; y -= dt * (0.08 + shake * 0.3); x += Math.sin(t * (1 + shake * 4) + k) * dt * (0.05 + shake * 0.6); z += Math.cos(t * (1.2 + shake * 4) + k) * dt * (0.05 + shake * 0.6); if (y < 0.4 || x * x + (y - 0.9) * (y - 0.9) + z * z > 0.33) { y = 1.35; x = (Math.random() - 0.5) * 0.6; z = (Math.random() - 0.5) * 0.6; } gp[k * 3] = x; gp[k * 3 + 1] = y; gp[k * 3 + 2] = z; } gg.attributes.position.needsUpdate = true; });
    c.clickable(gb, () => { shake = 4; c.sound.honk(); c.toast('A blizzard on Park Avenue, about the size of a bathtub.', 1800); }, 'A snow globe');
    // ice on the marble and a line of little footprints across it
    const pr = pic(c, g, 9, 1.2, (q, w, h) => { q.fillStyle = 'rgba(40,60,80,.32)'; for (let i = 0; i < 26; i++) { const x = 20 + i * (w - 40) / 26, y = h / 2 + Math.sin(i * 0.7) * h * 0.25 + (i % 2 ? 12 : -12); q.save(); q.translate(x, y); q.rotate(PI / 2); [[-6, 0], [0, -8], [6, 0]].forEach(([dx, dy]) => { q.beginPath(); q.ellipse(dx, dy, 3, 9, dx * 0.08, 0, 7); q.fill(); }); q.restore(); } }, 128, 12.2, 0.012, 4.4, 0, { alpha: true, flat: true, lit: true });
    pr.material.polygonOffset = true; pr.material.polygonOffsetFactor = -2;
    const iceM = new THREE.MeshStandardMaterial({ color: 0xc8e8ff, roughness: 0.02, metalness: 0.6, transparent: true, opacity: 0.5, envMapIntensity: 2.5, depthWrite: false }); [[11.2, -4.2, 2.4, 1.4], [16.0, 5.6, 2.0, 1.2], [3.2, 4.4, 1.6, 1.0]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), iceM); m.scale.set(w / 2, d / 2, 1); m.rotation.x = -PI / 2; m.position.set(x, 0.015, z); g.add(m); });
    r.post = { ...(r.post || {}), bloom: 0.8 };
  },

  // ---------- Hitch, 2005 ----------
  // Illusion: rotating snakes. The tiles over the window and high on both walls are still; they swim and turn the moment
  // you look anywhere else (peripheral drift). The shellfish gets the blame. Reads from the entrance, ahead and up.
  hitch(c, r, g, X, K) {
    const { THREE } = c;
    const snakes = c.canvasTex(512, 256, (q, w, h) => {
      q.fillStyle = '#0b1020'; q.fillRect(0, 0, w, h);
      const SEQ = ['#000000', '#1d4ed8', '#ffffff', '#f5c542'], FR = [0.32, 0.18, 0.32, 0.18];
      [[128, 128, 1], [384, 128, -1]].forEach(([cx, cy, dir]) => {
        q.fillStyle = '#2a8a5a'; q.beginPath(); q.arc(cx, cy, 124, 0, 7); q.fill();
        for (let ring = 0; ring < 5; ring++) { const R2 = 120 - ring * 22, R1 = R2 - 18, n = 18 - ring * 2, off = ring * 0.37;
          for (let i = 0; i < n; i++) { let a = off + i / n * PI * 2; for (let k = 0; k < 4; k++) { const da = FR[k] / n * PI * 2; const a1 = dir > 0 ? a : -a, a2 = dir > 0 ? a + da : -(a + da); q.fillStyle = SEQ[k]; q.beginPath(); q.arc(cx, cy, R2, a1, a2, dir < 0); q.arc(cx, cy, R1, a2, a1, dir > 0); q.closePath(); q.fill(); a += da; } } }
        q.fillStyle = '#ff4fa3'; q.beginPath(); q.arc(cx, cy, 12, 0, 7); q.fill(); });
    });
    snakes.wrapS = THREE.RepeatWrapping;
    const band = (w, h, x, y, z, ry) => { const t = snakes.clone(); t.needsUpdate = true; t.repeat.set(w / (2 * h), 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    const nb = band(12, 1.5, 10, 5.2, -7.86, 0); band(7.4, 2.2, 0.15, 4.6, -4.1, PI / 2); band(7.4, 2.2, 19.85, 4.6, -4.1, -PI / 2);
    c.clickable(nb, () => { c.sound.crack(); c.egg('hitch_tiles', 'Stare at one circle and it holds still. Look away and every tile in the kitchen starts to swim. That is your eyes, not the shellfish. MLow tiled it this way so a first date never notices a silence.'); }, 'The tiles');
    // the pendants lit, warm light falling on the island
    [8.8, 10, 11.2].forEach((x) => { glow(c, K, g, 'rgba(255,200,120,.95)', x, 4.62, -2.4, 0.8, 1); haze(c, g, x, 4.6, -2.4, 0.12, 0.85, 3.6, 0xffd8a0, 0.09); });
    // the pot on the stove: a blue flame under it and steam off it
    glow(c, K, g, 'rgba(60,120,255,.9)', 6.08, 0.98, -6.0, 0.55, 0.9); K.steam(g, 6.08, 1.3, -6.0);
    // candles and two glasses of red on the island
    const fl = [9.5, 10.0, 10.5].map((x, k) => { const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18 - k * 0.03, 12), K.std(0xf8f0e4, { roughness: 0.6 })); cd.position.set(x, 0.97 + (0.18 - k * 0.03) / 2, -2.15); g.add(cd); return glow(c, K, g, 'rgba(255,180,80,.95)', x, 1.1 + (0.18 - k * 0.03), -2.15, 0.32, 1); });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fl.forEach((f, k) => f.scale.setScalar(0.3 + Math.sin(t * 13 + k * 2) * 0.03 + Math.sin(t * 21 + k) * 0.02)); });
    const prof = [[0, 0], [0.035, 0], [0.035, 0.005], [0.006, 0.02], [0.006, 0.11], [0.04, 0.14], [0.045, 0.2], [0.04, 0.24]].map(([x, y]) => new THREE.Vector2(x, y));
    const glassM = new THREE.MeshStandardMaterial({ color: 0xf0f4ff, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0.35, side: THREE.DoubleSide, envMapIntensity: 2.5, depthWrite: false });
    [[10.7, -2.55], [9.3, -2.6]].forEach(([x, z]) => { const gl = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), glassM); gl.position.set(x, 0.97, z); g.add(gl); const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.022, 0.05, 16), K.std(0x6a0a1a, { roughness: 0.1 })); wine.position.set(x, 0.97 + 0.145, z); g.add(wine); });
    // a checker floor in the kitchen, polished
    const chk = c.canvasTex(256, 256, (q, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = (x + y) % 2 ? '#e8e2d6' : '#1a1a1e'; q.fillRect(x * 32, y * 32, 32, 32); } }); chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(4, 3);
    const kf = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.6), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.15, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -1 })); kf.rotation.x = -PI / 2; kf.position.set(10, 0.004, -4.4); g.add(kf);
    // rose petals scattered toward the island
    const NP = c.MOBILE ? 50 : 110, pet = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 8).scale(1, 0.7, 1).rotateX(-PI / 2), K.std(0xc8102e, { roughness: 0.5, side: THREE.DoubleSide }), NP), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < NP; i++) { const u = Math.random(), x = 10 + (Math.random() - 0.5) * (2 + u * 12), z = -1.2 + u * 7.5 + (Math.random() - 0.5) * 1.2; e4.set(0, Math.random() * 6, 0); q4.setFromEuler(e4); m4.compose(v4.set(x, 0.01 + i * 0.00002, z), q4, one); pet.setMatrixAt(i, m4); } g.add(pet);
    // a loft ceiling: two runs of spiral duct, and three strings of little bulbs
    const duct = K.std(0xb8bcc2, { metalness: 0.9, roughness: 0.35 }); [-5.2, 3.6].forEach((z) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 19.4, 20, 1, true), duct); d.rotation.z = PI / 2; d.position.set(10, 5.45, z); g.add(d); for (let x = 1; x < 20; x += 2.4) { g.add(c.slab(0.03, 0.25, 0.03, duct, x, 5.85, z)); const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.02, 6, 20), duct); band2.rotation.y = PI / 2; band2.position.set(x, 5.45, z); g.add(band2); } });
    [-1.0, 1.4, 5.4].forEach((z) => K.bulbs(g, 1.0, 19.0, 5.15, z, 26, 0xffe0b0));
    motes(c, K, r, g, 80, [7.5, 12.5, 1.0, 4.5, -3.4, -1.4], 0xffd8a0, 0.04, [0, -0.04, 0], 0.1);
    r.post = { ...(r.post || {}), bloom: 1.05 };
  },

  // ---------- Kate & Leopold, 2001 ----------
  // Illusion: moire in the cables. Two webs of wire hang over the promenade a little apart, like the bridge's suspenders
  // and stays; walk anywhere under them and slow bands of light and dark swim through the wires. Look up from the entrance.
  kateleopold(c, r, g, X, K) {
    const { THREE } = c, iron = new THREE.LineBasicMaterial({ color: 0x2a221c, transparent: true, opacity: 0.55 });
    const A = []; for (let x = 1.0; x <= 19.0; x += 0.3) A.push(x, 5.0, -7.6, x, 5.0, 7.6);
    const la = new THREE.BufferGeometry(); la.setAttribute('position', new THREE.Float32BufferAttribute(A, 3)); g.add(new THREE.LineSegments(la, iron));
    const B = [], top = [10, 13, -18]; for (let i = 0; i <= 84; i++) { const x = 1.0 + i * 18 / 84; B.push(top[0], top[1], top[2], x, 5.6, 7.6); }
    const lb = new THREE.BufferGeometry(); lb.setAttribute('position', new THREE.Float32BufferAttribute(B, 3)); g.add(new THREE.LineSegments(lb, iron));
    const main = K.std(0x3a322a, { metalness: 0.6, roughness: 0.5 }); [1.0, 19.0].forEach((x) => { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 13, -18), new THREE.Vector3(x, 6.2, -6), new THREE.Vector3(x, 5.0, 2), new THREE.Vector3(x, 5.4, 9)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 40, 0.12, 8), main)); });
    // the crack in time along the line: a seam of gold light, sparks rising off it
    const seamT = c.canvasTex(16, 64, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
    const seam = new THREE.Mesh(new THREE.PlaneGeometry(19, 0.7), new THREE.MeshBasicMaterial({ map: seamT, color: new THREE.Color(1.6, 1.2, 0.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); seam.rotation.x = -PI / 2; seam.position.set(10, 0.02, 0); g.add(seam);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(19, 2.6), new THREE.MeshBasicMaterial({ map: fadeTex(c), color: 0xffd890, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false })); wall.rotation.z = PI; wall.position.set(10, 1.3, 0); g.add(wall);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; seam.material.opacity = 0.6 + Math.sin(t * 3) * 0.25; wall.material.opacity = 0.06 + Math.sin(t * 2.2) * 0.03; });
    motes(c, K, r, g, 120, [0.6, 19.4, 0, 2.6, -0.12, 0.12], 0xffe0a0, 0.05, [0, 0.5, 0], 0.05);
    // the two centuries, each with its own things (the line decides which you see)
    const then = new THREE.Group(), now = new THREE.Group(); g.add(then); g.add(now);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; then.visible = P.z < 0; now.visible = P.z >= 0; });
    [[3, -3], [17, -3], [3, 3.6], [17, 3.6]].forEach(([x, z]) => glow(c, K, then, 'rgba(255,190,90,.9)', x, 3.4, z, 1.3, 1));
    [[1.4, 6.6], [18.6, 6.6]].forEach(([x, z]) => glow(c, K, now, 'rgba(230,240,255,.9)', x + (x < 10 ? 0.4 : -0.4), 3.9, z, 1.1, 0.8));
    // 1876: bunting over the works, a steam engine driving the winch, and a reel of Roebling's wire rope
    const flagT = c.canvasTex(64, 64, (q, w, h) => { q.fillStyle = '#fff'; q.beginPath(); q.moveTo(0, 0); q.lineTo(w, 0); q.lineTo(w / 2, h); q.fill(); });
    [[-4.4, 3.5], [-1.4, 3.3]].forEach(([z, y]) => { const NF = 22, fm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.4), new THREE.MeshStandardMaterial({ map: flagT, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), NF), m4 = new THREE.Matrix4(), col = new THREE.Color(); for (let i = 0; i < NF; i++) { const x = 1.2 + i * 17.6 / (NF - 1), sag = Math.sin(i / (NF - 1) * PI) * 0.5; m4.makeTranslation(x, y - sag - 0.2, z); fm.setMatrixAt(i, m4); fm.setColorAt(i, col.setHex([0xb8202e, 0xf4ead2, 0x1d3a8a][i % 3])); } then.add(fm); const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(1.0, y, z), new THREE.Vector3(10, y - 1.0, z), new THREE.Vector3(19, y, z)); then.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 20, 0.01, 4), K.std(0x222222))); });
    const eng = new THREE.Group(); eng.position.set(17.2, 0, -2.0); then.add(eng); const blk = K.std(0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), brass = K.std(0xc89a40, { metalness: 1, roughness: 0.3 });
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 20), blk); boiler.rotation.x = PI / 2; boiler.position.y = 0.85; eng.add(boiler); [-0.7, 0.7].forEach((dz) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 24), blk); w.position.set(0.5, 0.42, dz); w.rotation.y = PI / 2; eng.add(w); w.userData.spin = 1; });
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.4, 12), blk); stack.position.set(0, 1.9, -0.55); eng.add(stack); eng.add(c.slab(0.3, 0.06, 0.3, brass, 0, 2.6, -0.55)); [-0.2, 0.3].forEach((dz) => { const bd = new THREE.Mesh(new THREE.TorusGeometry(0.455, 0.02, 6, 24), brass); bd.position.set(0, 0.85, dz); eng.add(bd); });
    K.steam(then, 17.2, 2.7, -2.55); c.post(X(17.2), -2.0, 0.85);
    const fire = glow(c, K, eng, 'rgba(255,120,30,.9)', 0, 0.55, 0.82, 0.5, 1);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fire.material.opacity = 0.7 + Math.sin(t * 13) * 0.2; eng.children.forEach((ch) => { if (ch.userData.spin) ch.rotation.x += dt * 2; }); });
    const reel = new THREE.Group(); reel.position.set(12.2, 0, -3.3); reel.rotation.y = 0.3; then.add(reel); const wood = K.std(0x7a5a38, { roughness: 0.8 });
    [-0.45, 0.45].forEach((dz) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 24), wood); d.rotation.x = PI / 2; d.position.set(0, 0.78, dz); reel.add(d); });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.82, 24), K.std(0x8a8a8a, { metalness: 0.9, roughness: 0.35 })); drum.rotation.x = PI / 2; drum.position.y = 0.78; reel.add(drum);
    const wireT = c.canvasTex(256, 64, (q, w, h) => { q.fillStyle = '#7a7a7a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#b8b8b8'; q.lineWidth = 2; for (let x = -h; x < w; x += 6) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + h * 0.3, h); q.stroke(); } }); wireT.wrapS = wireT.wrapT = THREE.RepeatWrapping; wireT.repeat.set(6, 4); drum.material.map = wireT;
    const lab = c.sign('N3W WIRE ROPE, 1876, COUNTED BY MLOW', { w: 1.1, h: 0.14, bg: '#2a1a0a', fg: '#f5c542', font: c.SERIF, weight: 800 }); lab.position.set(0, 0.78, 0.5); reel.add(lab); c.post(X(12.2), -3.3, 0.8);
    c.clickable(drum, () => { c.sound.tick(); c.egg('kateleopold_wire', 'Wire rope, spun on the bridge itself, fourteen thousand miles of it. Now look up and walk: the cables start to swim. MLow says that is the bridge counting you back.'); }, 'A reel of wire rope');
    // 2001: a hot dog cart under a striped umbrella
    const cart = new THREE.Group(); cart.position.set(16.2, 0, 6.4); now.add(cart); cart.add(c.slab(1.4, 0.9, 0.7, K.std(0xd8dce0, { metalness: 0.8, roughness: 0.3 }), 0, 0.6, 0));
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 16, 1, true), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 32, (q, w, h) => { for (let i = 0; i < 16; i++) { q.fillStyle = i % 2 ? '#f5c542' : '#1d4ed8'; q.fillRect(i * 16, 0, 16, h); } }), side: THREE.DoubleSide, roughness: 0.7 })); um.position.y = 2.35; cart.add(um); cart.add(c.slab(0.04, 1.3, 0.04, K.std(0x888888), 0, 1.6, 0));
    const cs = c.sign('N3W FRANKS', { w: 1.2, h: 0.24, bg: '#c8102e', fg: '#fff', font: c.FONT, weight: 900 }); cs.position.set(0, 0.75, 0.36); cart.add(cs); c.post(X(16.2), 6.4, 0.75);
    // fog off the river below, gulls over it
    const fogM = new THREE.SpriteMaterial({ map: gtex(K, 'rgba(240,235,225,.35)'), transparent: true, depthWrite: false, opacity: 0.45 }), banks = [];
    for (let k = 0; k < (c.MOBILE ? 3 : 6); k++) { const s = new THREE.Sprite(fogM); s.scale.set(6, 2.2, 1); s.position.set(Math.random() * 20, 0.6 + Math.random(), -7.0 + Math.random() * 0.6); g.add(s); banks.push(s); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; banks.forEach((s, k) => { s.position.x += dt * (0.3 + k * 0.05); if (s.position.x > 23) s.position.x = -3; }); });
    for (let k = 0; k < 2; k++) { const gl = c.glb('gull', { len: 0.7, x: 10, y: 8, z: -4, parent: g, shadow: false }); c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const a = t * (0.35 + k * 0.1) + k * 3, R = 4 + k * 2; gl.position.set(10 + Math.cos(a) * R, 7.2 + k + Math.sin(t + k) * 0.4, -4 + Math.sin(a) * R * 0.5); gl.rotation.set(0, -a + (k ? PI : 0), 0.2); }); }
    r.post = { ...(r.post || {}), bloom: 0.9 };
  },

  // ---------- Tower Heist, 2011 ----------
  // Illusion: two hollow gold masks of the owner over the window. Both are dished in, not out, and painted as if they
  // stood proud, so as you walk across the penthouse they turn and keep looking at you. Reads from the entrance and the lane.
  towerheist(c, r, g, X, K) {
    const { THREE } = c;
    const face = (x, y) => { const ex = x / 0.46, ey = y / 0.62, e = ex * ex + ey * ey; if (e >= 1) return 0; const G = (cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
      return 0.26 * Math.sqrt(1 - e) + 0.13 * G(0, -0.02, 0.06, 0.17) + 0.05 * G(0, -0.17, 0.08, 0.05) + 0.05 * G(0, 0.17, 0.32, 0.05) - 0.07 * (G(0.15, 0.08, 0.08, 0.06) + G(-0.15, 0.08, 0.08, 0.06)) + 0.04 * G(0, -0.33, 0.13, 0.035) + 0.04 * G(0, -0.48, 0.13, 0.07) + 0.03 * (G(0.21, -0.12, 0.1, 0.1) + G(-0.21, -0.12, 0.1, 0.1)); };
    const geo = new THREE.PlaneGeometry(1.0, 1.32, 56, 72), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, face(pos.getX(i), pos.getY(i)));
    geo.computeVertexNormals(); const nrm = geo.attributes.normal, colA = new Float32Array(pos.count * 3), L = new THREE.Vector3(0.25, 0.75, 0.6).normalize();
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), inside = (x / 0.46) ** 2 + (y / 0.62) ** 2 < 0.985; const d = Math.max(0, nrm.getX(i) * L.x + nrm.getY(i) * L.y + nrm.getZ(i) * L.z), sp = Math.pow(d, 24);
      if (inside) colA.set([0.38 + d * 1.0 + sp * 0.9, 0.24 + d * 0.72 + sp * 0.8, 0.06 + d * 0.25 + sp * 0.6], i * 3); else colA.set([0.06, 0.015, 0.03], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    for (let i = 0; i < pos.count; i++) pos.setZ(i, -pos.getZ(i)); pos.needsUpdate = true;   // now hollow: the painted light still says it stands out
    const maskM = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), gold = K.std(0xd6a640, { metalness: 1, roughness: 0.22 });
    const masks = [5.4, 14.6].map((x) => { const o = new THREE.Group(); o.position.set(x, 5.16, -7.88 + 0.48); o.scale.setScalar(1.15); g.add(o); o.add(new THREE.Mesh(geo, maskM));
      [[0, 0.71, 1.16, 0.1, 0.5], [0, -0.71, 1.16, 0.1, 0.5], [-0.58, 0, 0.1, 1.52, 0.5], [0.58, 0, 0.1, 1.52, 0.5]].forEach(([dx, dy, w, h, d]) => o.add(c.slab(w, h, d, gold, dx, dy, -0.2)));
      const pl = c.sign('THE OWNER, HOLLOW', { w: 0.9, h: 0.1, bg: '#111', fg: '#d6a640', font: c.SERIF, weight: 800 }); pl.position.set(0, -0.84, 0.06); o.add(pl); glow(c, K, o, 'rgba(255,210,120,.5)', 0, 0.8, 0.3, 1.0, 0.6); return o; });
    masks.forEach((o) => c.clickable(o, () => { c.sound.chords(3); c.egg('towerheist_masks', 'Two gold faces of the owner over the window, and wherever you walk they turn to watch you. They are hollow, pressed in like a mould. So was he. MLow says check the car.'); }, 'A gold mask'));
    // a coffered ceiling in cream and gold
    const ceil = slabOf(g, 6.05);
    if (ceil) { const cof = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#efe6d2'; q.fillRect(0, 0, w, h); const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d8c8a8'); gr.addColorStop(1, '#f8f0e0'); q.fillStyle = gr; q.fillRect(40, 40, w - 80, h - 80); q.strokeStyle = '#c89a40'; q.lineWidth = 10; q.strokeRect(40, 40, w - 80, h - 80); q.lineWidth = 3; q.strokeRect(70, 70, w - 140, h - 140); q.fillStyle = '#c89a40'; q.beginPath(); q.arc(w / 2, h / 2, 26, 0, 7); q.fill(); }); cof.wrapS = cof.wrapT = THREE.RepeatWrapping; cof.repeat.set(8, 6.4); ceil.material = new THREE.MeshStandardMaterial({ map: cof, bumpMap: cof, bumpScale: 3, roughness: 0.45, metalness: 0.15 }); }
    // the chandeliers lit, sconces between the pictures
    [[10, 4.75, 1.0, 1.1], [4.4, 5.05, -3.0, 1.0], [15.6, 5.05, -3.0, 1.0]].forEach(([x, y, z, s]) => { glow(c, K, g, 'rgba(255,225,170,.95)', x, y, z, s, 0.6); haze(c, g, x, y, z, 0.2, 1.4, y - 0.2, 0xffe8c0, 0.05); });
    [3.5, 8.7, 11.3, 16.5].forEach((x) => { g.add(c.slab(0.14, 0.4, 0.04, gold, x, 3.25, 7.86)); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.18, 14, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.5, 1.1), side: THREE.DoubleSide, toneMapped: false })); sh.position.set(x, 3.45, 7.74); g.add(sh); glow(c, K, g, 'rgba(255,220,160,.8)', x, 3.45, 7.7, 0.8, 0.8); });
    // a compass rose of gold in the marble, a rug by the sofa
    const rose = pic(c, g, 3.0, 3.0, (q, w, h) => { const cx = w / 2; q.strokeStyle = '#c89a40'; q.lineWidth = 6; q.beginPath(); q.arc(cx, cx, cx * 0.95, 0, 7); q.stroke(); q.lineWidth = 2; q.beginPath(); q.arc(cx, cx, cx * 0.85, 0, 7); q.stroke(); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, R = i % 4 === 0 ? 0.92 : i % 2 ? 0.45 : 0.65; q.fillStyle = i % 2 ? '#1a1a1a' : '#c89a40'; q.beginPath(); q.moveTo(cx + Math.cos(a) * cx * R, cx + Math.sin(a) * cx * R); q.lineTo(cx + Math.cos(a + 0.2) * cx * 0.12, cx + Math.sin(a + 0.2) * cx * 0.12); q.lineTo(cx + Math.cos(a - 0.2) * cx * 0.12, cx + Math.sin(a - 0.2) * cx * 0.12); q.fill(); } q.fillStyle = '#c89a40'; q.font = `900 ${cx * 0.14}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N', cx, cx * 0.2); }, 512, 10, 0.008, 3.4, 0, { alpha: true, flat: true, lit: true, rough: 0.3 });
    rose.material.metalness = 0.6; rose.material.polygonOffset = true; rose.material.polygonOffsetFactor = -2;
    const rug = pic(c, g, 3.2, 4.2, (q, w, h) => { q.fillStyle = '#5a0a14'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c89a40'; q.lineWidth = 12; q.strokeRect(14, 14, w - 28, h - 28); q.lineWidth = 4; q.strokeRect(40, 40, w - 80, h - 80); for (let i = 0; i < 40; i++) { q.fillStyle = ['#c89a40', '#1d3a6a', '#e8d8b8'][i % 3]; q.save(); q.translate(w / 2, h / 2); q.rotate(i * PI / 20); q.beginPath(); q.ellipse(w * 0.22, 0, w * 0.08, w * 0.025, 0, 0, 7); q.fill(); q.restore(); } K.eyeFlower(q, w / 2, h / 2, w * 0.12); }, 512, 14.2, 0.007, -2.2, 0, { alpha: false, flat: true, lit: true, rough: 1 });
    rug.material.polygonOffset = true; rug.material.polygonOffsetFactor = -1;
    // ticker tape falling past the window: the parade is right there
    paper(c, r, g, 60, null, 0.025, 0.22, [3.6, 16.4, -0.2, 6.5, -7.7, -7.1], (b, t, dt, i) => { b.y -= dt * (0.4 + (i % 4) * 0.12); b.x += Math.sin(t * 1.3 + i) * dt * 0.3; }, 4);
    // the gold, stacked on a velvet plinth, catching every light in the room
    const pl2 = new THREE.Group(); pl2.position.set(17.4, 0, 0.9); g.add(pl2); pl2.add(c.slab(0.8, 0.9, 0.8, K.std(0x3a0a14, { roughness: 1 }), 0, 0.45, 0)); c.post(X(17.4), 0.9, 0.5);
    const bar = new THREE.BoxGeometry(0.22, 0.07, 0.1), goldB = K.std(0xffc840, { metalness: 1, roughness: 0.15, emissive: 0x3a2400 });
    [[3, 0], [2, 1], [1, 2]].forEach(([n, lv]) => { for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const b = new THREE.Mesh(bar, goldB); b.position.set((i - (n - 1) / 2) * 0.24, 0.94 + lv * 0.075, (j - 0.5) * 0.12); pl2.add(b); } });
    const tw = [0, 1, 2].map((k) => glow(c, K, pl2, 'rgba(255,240,180,1)', -0.2 + k * 0.2, 1.05 + k * 0.05, 0.1, 0.25, 0));
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; tw.forEach((s, k) => { const u = (t * 0.7 + k * 0.37) % 1; s.material.opacity = u < 0.15 ? Math.sin(u / 0.15 * PI) : 0; }); });
    // the building's cameras, red light on
    [[0.3, 7.6, PI * 0.75], [19.7, 7.6, -PI * 0.75]].forEach(([x, z, ry]) => { const cam = new THREE.Group(); cam.position.set(x, 5.5, z); cam.rotation.y = ry; g.add(cam); cam.add(c.slab(0.16, 0.14, 0.34, K.std(0xe8e8e8, { roughness: 0.4 }), 0, 0, 0.17)); const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), hot(c, 0xff2020, 2.4)); led.position.set(0.05, 0.05, 0.35); cam.add(led); c.tick((t) => { led.visible = (t % 1.4) < 0.7; }); });
    // a champagne tower, for the party he never threw
    const ct = new THREE.Group(); ct.position.set(3.0, 0, 0.6); g.add(ct); ct.add(c.slab(0.9, 0.78, 0.9, K.std(0xf4f0e8, { roughness: 0.3 }), 0, 0.39, 0)); c.post(X(3.0), 0.6, 0.55);
    const prof = [[0, 0], [0.04, 0], [0.04, 0.005], [0.006, 0.02], [0.006, 0.09], [0.07, 0.1], [0.075, 0.13], [0.06, 0.15]].map(([x, y]) => new THREE.Vector2(x, y)), cg = new THREE.LatheGeometry(prof, 18);
    const cm = new THREE.MeshStandardMaterial({ color: 0xfff4d8, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0.45, envMapIntensity: 2.5, depthWrite: false }), fizz = hot(c, 0xffd870, 1.2, { transparent: true, opacity: 0.85 });
    [[3, 0.16], [2, 0.16], [1, 0.16]].forEach(([n, sp], lv) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i - (n - 1) / 2) * sp, z = (j - (n - 1) / 2) * sp, y = 0.78 + lv * 0.15; const gl = new THREE.Mesh(cg, cm); gl.position.set(x, y, z); ct.add(gl); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.03, 0.03, 12), fizz); w.position.set(x, y + 0.115, z); ct.add(w); } });
    glow(c, K, ct, 'rgba(255,220,120,.6)', 0, 1.2, 0, 0.9, 0.6);
    motes(c, K, r, g, 100, [2, 18, 1, 5.5, -6, 6], 0xffe8c0, 0.035, [0.03, 0.02, 0], 0.1);
    r.post = { ...(r.post || {}), bloom: 1.0 };
  },

  // ---------- Now You See Me, 2013 ----------
  // Illusion: reverspective (after Patrick Hughes). Over the stage, four painted halls run deep into the wall. They do
  // not: every one of them sticks out at you, and as you cross the house they swing round to follow. Reads from the entrance.
  nowyousee(c, r, g, X, K) {
    const { THREE } = c, BW = 1.5, BH = 1.3, FW = 0.46, FH = 0.4, DPT = 0.62, Z0 = -7.87;
    const side = (kind) => c.canvasTex(256, 256, (q, w, h) => {
      // u runs from the wall (left of the canvas) to the front face (right); v across the face
      if (kind === 'wall') { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#3a0614'); gr.addColorStop(1, '#c8203e'); q.fillStyle = gr; q.fillRect(0, 0, w, h); for (let k = 1; k < 7; k++) { const u = 1 - 1 / (1 + k * 0.55); q.fillStyle = '#d6a640'; q.fillRect(u * w - 3, 0, 6, h); q.fillStyle = '#ffe8a0'; for (let j = 1; j < 4; j++) { q.beginPath(); q.arc(u * w + 10, j * h / 4, 5 - k * 0.4, 0, 7); q.fill(); } } q.fillStyle = 'rgba(214,166,64,.9)'; q.fillRect(0, h * 0.18, w, 5); q.fillRect(0, h * 0.82, w, 5); }
      if (kind === 'ceil') { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#05030a'); gr.addColorStop(1, '#2a1640'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#ffe8a0'; for (let i = 0; i < 70; i++) { const u = Math.random(); q.globalAlpha = 0.4 + u * 0.6; q.fillRect(u * w, Math.random() * h, 2, 2); } q.globalAlpha = 1; q.strokeStyle = 'rgba(214,166,64,.6)'; q.lineWidth = 3; for (let j = 1; j < 4; j++) { q.beginPath(); q.moveTo(0, j * h / 4); q.lineTo(w, j * h / 4); q.stroke(); } }
      if (kind === 'floor') { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#1a0e08'); gr.addColorStop(1, '#8a5a30'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(0,0,0,.6)'; q.lineWidth = 3; for (let j = 0; j < 9; j++) { q.beginPath(); q.moveTo(0, j * h / 8); q.lineTo(w, j * h / 8); q.stroke(); } for (let k = 1; k < 8; k++) { const u = 1 - 1 / (1 + k * 0.55); q.beginPath(); q.moveTo(u * w, 0); q.lineTo(u * w, h); q.stroke(); } }
    });
    const frontT = c.canvasTex(256, 224, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, w * 0.7); gr.addColorStop(0, '#fff8d8'); gr.addColorStop(0.3, '#ffc860'); gr.addColorStop(1, '#3a0a24'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#c8203e'; q.fillRect(0, 0, 34, h); q.fillRect(w - 34, 0, 34, h); q.fillStyle = '#0a0410'; q.beginPath(); q.ellipse(w / 2, h * 0.52, 14, 16, 0, 0, 7); q.fill(); q.beginPath(); q.moveTo(w / 2 - 22, h * 0.95); q.lineTo(w / 2 + 22, h * 0.95); q.lineTo(w / 2 + 12, h * 0.6); q.lineTo(w / 2 - 12, h * 0.6); q.fill(); K.eyeFlower(q, w / 2, h * 0.5, 22); q.fillStyle = '#f5c542'; q.font = `900 30px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('★', w / 2, h * 0.22); });
    const mW = new THREE.MeshBasicMaterial({ map: side('wall'), toneMapped: false, side: THREE.DoubleSide }), mC = new THREE.MeshBasicMaterial({ map: side('ceil'), toneMapped: false, side: THREE.DoubleSide }), mF = new THREE.MeshBasicMaterial({ map: side('floor'), toneMapped: false, side: THREE.DoubleSide }), mFr = new THREE.MeshBasicMaterial({ map: frontT, toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3) });
    // one quad with its own uv: a = wall end, b = front end
    const quad = (a1, a2, b1, b2, mat) => { const gq = new THREE.BufferGeometry(); gq.setAttribute('position', new THREE.Float32BufferAttribute([...a1, ...b1, ...b2, ...a1, ...b2, ...a2], 3)); gq.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); return new THREE.Mesh(gq, mat); };
    // a hall: base on the wall (local z 0), front face out at z = depth. Over the stage, and three on each side wall up high.
    const halls = new THREE.Group(); g.add(halls);
    const hall = (par, cx, cy, bw, bh, fw, fh, dp) => { const bl = [cx - bw / 2, cy - bh / 2, 0], br = [cx + bw / 2, cy - bh / 2, 0], tl = [cx - bw / 2, cy + bh / 2, 0], tr = [cx + bw / 2, cy + bh / 2, 0];
      const fbl = [cx - fw / 2, cy - fh / 2, dp], fbr = [cx + fw / 2, cy - fh / 2, dp], ftl = [cx - fw / 2, cy + fh / 2, dp], ftr = [cx + fw / 2, cy + fh / 2, dp];
      par.add(quad(bl, tl, fbl, ftl, mW)); par.add(quad(tr, br, ftr, fbr, mW)); par.add(quad(tl, tr, ftl, ftr, mC)); par.add(quad(br, bl, fbr, fbl, mF));
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), mFr); fr.position.set(cx, cy, dp + 0.001); par.add(fr); };
    const north = new THREE.Group(); north.position.z = Z0; halls.add(north); [4.95, 6.6, 13.4, 15.05].forEach((cx) => hall(north, cx, 5.2, BW, BH, FW, FH, DPT));
    const west = new THREE.Group(); west.position.x = 0.14; west.rotation.y = PI / 2; halls.add(west); const east = new THREE.Group(); east.position.x = 19.86; east.rotation.y = -PI / 2; halls.add(east);
    const fm = K.std(0xd6a640, { metalness: 1, roughness: 0.3 });
    [-4.9, -2.45, 0].forEach((z) => { hall(west, -z, 4.55, 2.2, 1.9, 0.68, 0.58, 0.9); hall(east, z, 4.55, 2.2, 1.9, 0.68, 0.58, 0.9); [[west, -z], [east, z]].forEach(([par, cx]) => { par.add(c.slab(2.3, 0.06, 0.06, fm, cx, 4.55 + 0.98, 0.03)); par.add(c.slab(2.3, 0.06, 0.06, fm, cx, 4.55 - 0.98, 0.03)); }); });
    const gold = K.std(0xd6a640, { metalness: 1, roughness: 0.3 }); [[5.775, 3.4], [14.225, 3.4]].forEach(([x, w]) => { g.add(c.slab(w, 0.06, 0.08, gold, x, 5.2 + 0.68, Z0 + 0.04)); g.add(c.slab(w, 0.06, 0.08, gold, x, 5.2 - 0.68, Z0 + 0.04)); });
    c.clickable(halls, () => { c.sound.drumroll ? c.sound.drumroll(1.5) : c.sound.chords(3); c.egg('nowyousee_halls', 'Four long halls running back into the wall. They are not. Every one of them sticks straight out at you, and they turn to follow you across the house. The closer you look, MLow says, the less you count.'); }, 'The painted halls');
    // marquee bulbs round the proscenium
    K.bulbs(g, 4.3, 15.7, 4.5, -7.82, 40, 0xffe0a0); K.bulbs(g, 4.3, 15.7, 5.94, -7.82, 40, 0xffe0a0);
    // three top lights straight down on the magician, pink, white and cyan
    [[8.6, 0xff4fa3], [10, 0xfff0d0], [11.4, 0x22d3ee]].forEach(([x, col]) => { haze(c, g, x, 5.9, -5.6, 0.12, 1.1, 5.3, col, 0.1); glow(c, K, g, 'rgba(255,255,255,.6)', x, 5.85, -5.6, 0.6, 0.8); });
    glow(c, K, g, 'rgba(255,240,210,.5)', 10, 1.6, -5.5, 3.0, 0.5);
    // the stage: lacquer black with a gold star, footlights along the edge, low fog rolling over it
    const top = pic(c, g, 12, 2.2, (q, w, h) => { q.fillStyle = '#0a0608'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d6a640'; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = '#d6a640'; q.font = `900 ${h * 0.7}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('★', w / 2, h / 2); }, 256, 10, 0.605, -5.6, 0, { flat: true, lit: true, rough: 0.12 });
    top.material.metalness = 0.3;
    const NF = 30, fb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 10, 8), hot(c, 0xffd890, 2.2), NF), m4 = new THREE.Matrix4(); for (let i = 0; i < NF; i++) { m4.makeTranslation(4.3 + i * 11.4 / (NF - 1), 0.64, -4.47); fb.setMatrixAt(i, m4); } g.add(fb);
    shaft(c, g, 11.6, 0.9, 0xffd890, 0.25, 10, 1.05, -4.45, 0, 0, PI);
    const fogM = new THREE.SpriteMaterial({ map: gtex(K, 'rgba(200,180,230,.35)'), transparent: true, depthWrite: false, opacity: 0.5 }), fogs = [];
    for (let k = 0; k < (c.MOBILE ? 4 : 8); k++) { const s = new THREE.Sprite(fogM); s.scale.set(3.5, 1.0, 1); s.position.set(4 + Math.random() * 12, 0.85, -6.4 + Math.random() * 1.6); g.add(s); fogs.push(s); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fogs.forEach((s, k) => { s.position.x += dt * 0.2 * (k % 2 ? 1 : -1); if (s.position.x > 16.5) s.position.x = 3.5; if (s.position.x < 3.5) s.position.x = 16.5; }); });
    // a fountain of cards spiralling round the magician
    const back = c.canvasTex(64, 90, (q, w, h) => { q.fillStyle = '#fbf8f0'; q.fillRect(0, 0, w, h); q.fillStyle = '#a8102e'; q.fillRect(4, 4, w - 8, h - 8); q.strokeStyle = '#d6a640'; q.lineWidth = 2; for (let i = -h; i < w; i += 8) { q.beginPath(); q.moveTo(i, 4); q.lineTo(i + h, h - 4); q.stroke(); } });
    const NC = c.MOBILE ? 26 : 52, cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.23), new THREE.MeshStandardMaterial({ map: back, side: THREE.DoubleSide, roughness: 0.5 }), NC); cards.frustumCulled = false; g.add(cards);
    const q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let i = 0; i < NC; i++) { const u = ((t * 0.12 + i / NC) % 1), a = u * PI * 6 + i; v4.set(10 + Math.cos(a) * (0.9 + u * 0.7), 1.0 + u * 3.4, -5.6 + Math.sin(a) * (0.9 + u * 0.7)); e4.set(t + i, -a, 0.3); q4.setFromEuler(e4); m4.compose(v4, q4, one); cards.setMatrixAt(i, m4); } cards.instanceMatrix.needsUpdate = true; });
    // stars under the ceiling, a neon eye over the back wall, the chandeliers lit
    const NS = c.MOBILE ? 140 : 300, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) sp.set([Math.random() * 20, 5.85, -7.8 + Math.random() * 15.6], k * 3);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ map: gtex(K, 'rgba(255,240,200,.8)'), color: 0xfff0c0, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(stars);
    c.tick((t, dt, P, ri) => { if (near(r, ri)) stars.material.opacity = 0.75 + Math.sin(t * 2.3) * 0.25; });
    const eye = pic(c, g, 2.2, 1.9, (q, w, h) => { q.shadowColor = '#f5c542'; q.shadowBlur = 18; q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.beginPath(); q.moveTo(w / 2, 14); q.lineTo(w - 14, h - 14); q.lineTo(14, h - 14); q.closePath(); q.stroke(); q.shadowBlur = 0; K.eyeFlower(q, w / 2, h * 0.62, h * 0.2); }, 256, 10, 4.5, 7.85, PI, { alpha: true }); eye.material.color.setScalar(1.5);
    [[6.2, 3.1], [13.8, 3.1]].forEach(([x, z]) => glow(c, K, g, 'rgba(255,220,160,.9)', x, 4.95, z, 1.6, 0.8));
    // a red carpet up the aisle to the stage
    const run = pic(c, g, 1.0, 11.8, (q, w, h) => { q.fillStyle = '#7a0a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#d6a640'; q.fillRect(4, 0, 5, h); q.fillRect(w - 9, 0, 5, h); }, 512, 10, 0.009, 1.5, 0, { flat: true, lit: true, rough: 1 });
    run.material.polygonOffset = true; run.material.polygonOffsetFactor = -1;
    r.post = { ...(r.post || {}), bloom: 1.2 };
  },

  // ---------- Beat Street, 1984 ----------
  // Illusion: an impossible triangle. Three painted bars in the lot join up into a Penrose triangle, but only from the
  // tag on the ground where the set opens (the entrance view). Take one step and the corner comes apart.
  beatstreet(c, r, g, X, K) {
    const { THREE } = c, E = new THREE.Vector3(10, 1.62, 5.8), L = 2.0, T = 0.3, n = new THREE.Vector3(1, 1, 1).normalize(), Y = new THREE.Vector3(0, 1, 0);
    const A = new THREE.Vector3(15.3, 0.9, -1.6); let ex, ey, ez, pts;
    for (let it = 0; it < 4; it++) {
      const v = A.clone().sub(E).normalize(), q = new THREE.Quaternion().setFromUnitVectors(n, v);
      ex = new THREE.Vector3(1, 0, 0).applyQuaternion(q); ey = new THREE.Vector3(0, 1, 0).applyQuaternion(q); ez = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      // roll about the line of sight so the far corner sits to the right and the triangle stands on its base
      const right = new THREE.Vector3().crossVectors(v, Y).normalize(), pz = ez.clone().negate().projectOnPlane(v).normalize(), ang = Math.atan2(new THREE.Vector3().crossVectors(pz, right).dot(v), pz.dot(right));
      const rq = new THREE.Quaternion().setFromAxisAngle(v, ang); ex.applyQuaternion(rq); ey.applyQuaternion(rq); ez.applyQuaternion(rq);
      pts = [A.clone(), A.clone().addScaledVector(ex, L), A.clone().addScaledVector(ex, L).addScaledVector(ey, L), A.clone().addScaledVector(ex, L).addScaledVector(ey, L).addScaledVector(ez, L)];
      const lo = Math.min(...pts.map((p) => p.y)) - T; if (lo < 0.35) A.y += 0.35 - lo; else break;
    }
    const cols = [0xff4fa3, 0x22d3ee, 0xf5c542], tri = new THREE.Group(); g.add(tri);
    const barM = (k) => new THREE.MeshStandardMaterial({ color: cols[k], roughness: 0.45, metalness: 0.1, emissive: cols[k], emissiveIntensity: 0.18 });
    const mkBar = (p, q2, dir, k, ext0, ext1) => { const len = p.distanceTo(q2) + ext0 + ext1, geo = new THREE.BoxGeometry(T, len, T), m = new THREE.Mesh(geo, barM(k)); const mid = p.clone().addScaledVector(dir, (len) / 2 - ext0); m.position.copy(mid); m.quaternion.setFromUnitVectors(Y, dir); tri.add(m); const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x111111 })); ed.position.copy(m.position); ed.quaternion.copy(m.quaternion); tri.add(ed); return m; };
    const b1 = mkBar(pts[0], pts[1], ex, 0, T / 2, T / 2), b2 = mkBar(pts[1], pts[2], ey, 1, T / 2, T / 2), b3 = mkBar(pts[2], pts[3], ez, 2, T / 2, 0);
    const low = pts.reduce((a, p) => (p.y < a.y ? p : a)); tri.add(c.slab(0.06, low.y - T / 2, 0.06, K.std(0x111111, { metalness: 0.6 }), low.x, (low.y - T / 2) / 2, low.z)); c.post(X(low.x), low.z, 0.3);
    [b1, b2, b3].forEach((b) => c.clickable(b, () => { c.sound.crack(); c.egg('beatstreet_triangle', 'Three bars, three colours, one triangle that cannot exist. Stand on the tag where you came in and it closes. Step off and the Bronx tells you the truth. MLow painted it in one night.'); }, 'A painted triangle'));
    const tag = pic(c, g, 1.6, 0.5, (q, w, h) => { q.font = `900 ${h * 0.55}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineWidth = 8; q.strokeStyle = '#111'; q.strokeText('STAND HERE, B BOY', w / 2, h / 2); q.fillStyle = '#ff4fa3'; q.fillText('STAND HERE, B BOY', w / 2, h / 2); }, 128, 10, 0.012, 5.0, 0, { alpha: true, flat: true, lit: true });
    tag.material.polygonOffset = true; tag.material.polygonOffsetFactor = -3;
    // the el over the south wall, a car laid up on it, painted end to end
    const el = K.std(0x2a3a2a, { metalness: 0.6, roughness: 0.6 }); g.add(c.slab(20, 0.6, 2.4, el, 10, 4.6, 11.2)); for (let x = 0; x <= 20; x += 5) g.add(c.slab(0.4, 4.4, 0.4, el, x, 2.2, 11.2)); g.add(c.slab(20, 0.5, 0.08, el, 10, 5.15, 10.05));
    c.glb('h_subway_car', { len: 15, x: 10, y: 4.9, z: 11.2, ry: PI / 2, parent: g, shadow: false });
    skyline(c, g, { z: 14, h: 13, night: false, tone: '#6a5a50', seed: 11 });
    // the hydrant is open: it is July
    const NW = c.MOBILE ? 70 : 160, wp = new Float32Array(NW * 3), WS = []; for (let i = 0; i < NW; i++) WS.push({ u: Math.random(), s: 0.8 + Math.random() * 0.4, a: (Math.random() - 0.5) * 0.4 });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); const water = new THREE.Points(wg, new THREE.PointsMaterial({ map: gtex(K, 'rgba(220,240,255,.8)'), color: 0xd8f0ff, size: 0.08, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); water.frustumCulled = false; g.add(water);
    const H0 = new THREE.Vector3(17.55, 0.5, 0.8);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; WS.forEach((w, i) => { w.u += dt * 0.9 * w.s; if (w.u > 1) w.u -= 1; const tt = w.u * 0.9, vx = -3.2 * w.s, vz = 1.4 + w.a, vy = 2.2 * w.s; wp[i * 3] = H0.x + vx * tt; wp[i * 3 + 1] = Math.max(0.02, H0.y + vy * tt - 4.9 * tt * tt); wp[i * 3 + 2] = H0.z + vz * tt; }); wg.attributes.position.needsUpdate = true; });
    const wet = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.03, metalness: 0.85, transparent: true, opacity: 0.7, envMapIntensity: 2 })); wet.scale.set(2.2, 1.2, 1); wet.rotation.x = -PI / 2; wet.position.set(15.4, 0.006, 1.8); g.add(wet);
    // weeds in the cracks, tags along the bottom of both walls
    const weedT = c.canvasTex(64, 64, (q, w, h) => { q.strokeStyle = '#4a7a2a'; q.lineWidth = 3; for (let i = 0; i < 9; i++) { q.beginPath(); q.moveTo(w / 2 + (i - 4) * 2, h); q.quadraticCurveTo(w / 2 + (i - 4) * 5, h * 0.5, w / 2 + (i - 4) * 7, h * (0.1 + (i % 3) * 0.15)); q.stroke(); } });
    const NWd = c.MOBILE ? 30 : 60, weeds = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.4).translate(0, 0.2, 0), new THREE.MeshStandardMaterial({ map: weedT, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 }), NWd), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), v4 = new THREE.Vector3();
    for (let i = 0; i < NWd; i++) { const edge = i % 3, x = edge === 0 ? 0.4 + Math.random() * 0.5 : edge === 1 ? 19.1 + Math.random() * 0.5 : 1 + Math.random() * 18, z = edge === 2 ? -6.8 + Math.random() * 0.6 : -7 + Math.random() * 14; e4.set(0, Math.random() * 3, 0); q4.setFromEuler(e4); const s = 0.6 + Math.random() * 0.9; m4.compose(v4.set(x, 0, z), q4, one.set(s, s, s)); weeds.setMatrixAt(i, m4); } g.add(weeds);
    const tags = (seed) => (q, w, h) => { let s2 = seed; const rnd = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647); const words = ['MLOW', 'N3W', 'COUNTED', 'BX', 'EYE 1', 'SKELLY', 'LOW 317', 'KING', 'FRESH', 'NYC 84']; let x = 10; while (x < w - 60) { const wd = words[(rnd() * words.length) | 0], fs = h * (0.4 + rnd() * 0.4); q.save(); q.translate(x, h * 0.7); q.rotate((rnd() - 0.5) * 0.25); q.font = `900 ${fs}px ${c.FONT}`; q.lineWidth = 6; q.strokeStyle = '#111'; q.strokeText(wd, 0, 0); q.fillStyle = ['#ff4fa3', '#22d3ee', '#f5c542', '#ffffff', '#3b82f6', '#ff7a1a'][(rnd() * 6) | 0]; q.fillText(wd, 0, 0); q.restore(); x += q.measureText(wd).width * (fs / (h * 0.6)) + 30 + rnd() * 40; } };
    [[0.16, PI / 2, 3], [19.84, -PI / 2, 5]].forEach(([x, ry, sd]) => pic(c, g, 8.8, 0.9, tags(sd), 128, x, 0.75, -3.0, ry, { alpha: true, lit: true }));
    // the beat, out of the box in rings
    const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 6, 40), new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.position.set(5.5, 0.85, 0.6); m.rotation.y = 0.5; g.add(m); return m; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; rings.forEach((m, k) => { const u = ((t * 2.13) + k / 3) % 1; m.scale.setScalar(0.4 + u * 3.5); m.material.opacity = (1 - u) * 0.8; m.material.color.setHex(k === 1 ? 0x22d3ee : 0xff4fa3); }); });
    // washing on the lines across the lot, moving in the breeze
    const cloth = [0xff4fa3, 0xf4f4f0, 0x2a5ac8, 0xf5c542, 0xc8102e, 0x22d3ee], wash = [];
    [[-5.6, 3.8], [-3.4, 3.9]].forEach(([z, y], j) => { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.2, y, z), new THREE.Vector3(10, y - 0.8, z), new THREE.Vector3(19.8, y, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.008, 4), K.std(0xdddddd))); for (let i = 0; i < 9; i++) { const u = 0.1 + i * 0.09 + j * 0.03, p = cv.getPoint(u), w = 0.3 + (i % 3) * 0.12, piece = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.4 + (i % 2) * 0.2).translate(0, -0.22, 0), K.std(cloth[(i + j) % 6], { side: THREE.DoubleSide, roughness: 0.9 })); piece.position.copy(p); g.add(piece); wash.push(piece); } });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; wash.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.7 + i) * 0.25; }); });
    motes(c, K, r, g, 100, [1, 19, 0.3, 4, -6, 6], 0xffe0b0, 0.03, [0.15, 0.02, 0], 0.15);
    r.post = { ...(r.post || {}), bloom: 0.85 };
  },

  // ---------- The Secret Life of Walter Mitty, 2013 ----------
  // Illusion: an afterimage. Over the window a lightbox shows negative twenty five, as a negative. Stare at the red dot
  // until the light goes white, and the picture is there the right way round, in your own eye. Reads from the entrance.
  mitty(c, r, g, X, K) {
    const { THREE } = c, LW = c.MOBILE ? 768 : 1024, LH = Math.round(LW * 0.55);
    const scene = (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a62c8'); gr.addColorStop(0.6, '#a8c8f0'); gr.addColorStop(1, '#f0f4f8'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.fillStyle = '#ffd860'; q.beginPath(); q.arc(w * 0.78, h * 0.22, h * 0.09, 0, 7); q.fill();
      [['#5a6a88', 0.62, 0.3], ['#8a9ab8', 0.7, 0.22], ['#f4f8fc', 0.8, 0.16]].forEach(([col, base, amp], k) => { q.fillStyle = col; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 8) q.lineTo(x, h * base - Math.abs(Math.sin(x / w * 7 + k * 2)) * h * amp - Math.sin(x / w * 31 + k) * h * 0.015); q.lineTo(w, h); q.fill(); });
      q.fillStyle = '#c83a10'; q.beginPath(); q.ellipse(w * 0.42, h * 0.6, h * 0.025, h * 0.06, 0, 0, 7); q.fill(); K.eyeFlower(q, w * 0.42, h * 0.52, h * 0.035); };
    const negT = c.canvasTex(LW, LH, (q, w, h) => { scene(q, w, h); const im = q.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } q.putImageData(im, 0, 0); q.fillStyle = '#ff1010'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.018, 0, 7); q.fill(); q.fillStyle = 'rgba(255,255,255,.85)'; q.font = `800 ${h * 0.045}px ${c.MONO}`; q.fillText('NEGATIVE 25.  STARE AT THE RED DOT', w * 0.03, h * 0.94); });
    const whiteT = c.canvasTex(LW, LH, (q, w, h) => { q.fillStyle = '#f2f2ee'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.012, 0, 7); q.fill(); q.fillStyle = 'rgba(0,0,0,.45)'; q.font = `800 ${h * 0.045}px ${c.MONO}`; q.fillText('NOW LOOK AT THE DOT', w * 0.03, h * 0.94); });
    const posT = c.canvasTex(LW >> 1, LH >> 1, scene);
    g.add(c.slab(2.9, 1.66, 0.1, K.std(0xb8bcc2, { metalness: 0.9, roughness: 0.3 }), 10, 5.2, -7.9));
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.48), new THREE.MeshBasicMaterial({ map: negT, toneMapped: false, color: new THREE.Color(1.25, 1.25, 1.25) })); lb.position.set(10, 5.2, -7.84); g.add(lb);
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.48), new THREE.MeshBasicMaterial({ map: posT, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })); ghost.position.set(10, 5.2, -7.835); g.add(ghost);
    const halo = glow(c, K, g, 'rgba(230,240,255,.6)', 10, 5.2, -7.6, 4.2, 0.35);
    let white = false;
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const u = t % 24, w2 = u > 17; if (w2 !== white) { white = w2; lb.material.map = w2 ? whiteT : negT; lb.material.needsUpdate = true; halo.material.opacity = w2 ? 0.6 : 0.35; } ghost.material.opacity = w2 ? Math.max(0, 0.13 * (1 - (u - 17.3) / 4)) : 0; });
    c.clickable(lb, () => { c.sound.click ? c.sound.click() : c.sound.tick(); c.egg('mitty_afterimage', 'Stare at the red dot until the light goes white. The picture is still there, the right way round, in your own eye. MLow says that is the only print of negative twenty five there is.'); }, 'A lightbox');
    // the tubes lit, one of them on its way out; a polished floor with aisle lines
    const tubes = [[4, -4.4], [10, -4.4], [16, -4.4], [4, -0.4], [10, -0.4], [16, -0.4], [7, 3.4], [13, 3.4]].map(([x, z]) => { const m = c.slab(1.2, 0.03, 0.12, hot(c, 0xe8f4ff, 1.5), x, 5.84, z); g.add(m); const h = haze(c, g, x, 5.82, z, 0.3, 1.5, 4.6, 0xd8ecff, 0.05); return [m, h]; });
    const [bad, badH] = tubes[4];
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const on = Math.sin(t * 37) + Math.sin(t * 13.3) > -0.6 || (t % 5) > 1.2; bad.visible = on; badH.visible = on; });
    const fl = slabOf(g, -0.05); if (fl) { fl.material = fl.material.clone(); fl.material.roughness = 0.32; fl.material.metalness = 0.12; fl.material.envMapIntensity = 1.5; }
    [6.6, 13.4].forEach((x) => { const ln = pic(c, g, 0.12, 14, (q, w, h) => { q.fillStyle = '#e8b820'; q.fillRect(0, 0, w, h); }, 64, x, 0.008, -0.5, 0, { flat: true, lit: true }); ln.material.polygonOffset = true; ln.material.polygonOffsetFactor = -2; });
    const st = pic(c, g, 2.6, 0.5, (q, w, h) => { q.fillStyle = 'rgba(232,184,32,.85)'; q.font = `900 ${h * 0.6}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('ARCHIVE AISLE 25', w / 2, h / 2); }, 128, 10, 0.009, 1.6, 0, { alpha: true, flat: true, lit: true }); st.material.polygonOffset = true; st.material.polygonOffsetFactor = -2;
    // covers of the magazine across the top of the south wall, the motto and the name on the side walls
    const NCV = 9, CW = c.MOBILE ? 1024 : 2048, pics = ['mtn', 'shark', 'volcano', 'board', 'leopard', 'heli', 'sea', 'eye', 'city'];
    pic(c, g, 18, 1.0, (q, w, h) => { const sw = w / NCV; pics.forEach((p, i) => { const x = i * sw + sw * 0.14, cw = sw * 0.72; q.fillStyle = ['#1d4ed8', '#c8102e', '#2a8a5a', '#f5c542', '#111', '#ff4fa3', '#22d3ee', '#7a1020', '#3a3a3a'][i]; q.fillRect(x, 0, cw, h); q.fillStyle = '#fff'; q.fillRect(x + 6, 8, cw - 12, h * 0.14); q.fillStyle = '#c8102e'; q.font = `900 ${h * 0.1}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('NEGATIVE ASSETS', x + cw / 2, 8 + h * 0.11); const cx = x + cw / 2, cy = h * 0.58, R = cw * 0.32;
      q.fillStyle = 'rgba(255,255,255,.9)'; if (p === 'mtn' || p === 'volcano') { q.beginPath(); q.moveTo(cx - R * 1.3, cy + R); q.lineTo(cx, cy - R); q.lineTo(cx + R * 1.3, cy + R); q.fill(); if (p === 'volcano') { q.fillStyle = '#ff7a1a'; q.beginPath(); q.arc(cx, cy - R, R * 0.35, 0, 7); q.fill(); } } else if (p === 'shark') { q.beginPath(); q.moveTo(cx - R, cy + R * 0.4); q.lineTo(cx, cy - R); q.lineTo(cx + R * 0.5, cy + R * 0.4); q.fill(); } else if (p === 'board') { q.fillRect(cx - R, cy, R * 2, R * 0.25); q.beginPath(); q.arc(cx - R * 0.6, cy + R * 0.4, R * 0.15, 0, 7); q.arc(cx + R * 0.6, cy + R * 0.4, R * 0.15, 0, 7); q.fill(); } else if (p === 'leopard') { for (let k = 0; k < 14; k++) { q.beginPath(); q.arc(cx + (Math.random() - 0.5) * R * 2, cy + (Math.random() - 0.5) * R * 2, R * 0.12, 0, 7); q.fill(); } } else if (p === 'heli') { q.fillRect(cx - R, cy - R * 0.5, R * 2, 4); q.beginPath(); q.ellipse(cx, cy, R * 0.5, R * 0.3, 0, 0, 7); q.fill(); } else if (p === 'sea') { for (let k = 0; k < 4; k++) { q.beginPath(); q.arc(cx - R + k * R * 0.66, cy, R * 0.33, PI, 0); q.fill(); } } else if (p === 'eye') K.eyeFlower(q, cx, cy, R); else { for (let k = 0; k < 6; k++) q.fillRect(cx - R + k * R * 0.36, cy + R - (k % 3 + 1) * R * 0.5, R * 0.28, (k % 3 + 1) * R * 0.5); } }); }, CW / 18, 10, 4.95, 7.85, PI, { lit: true });
    pic(c, g, 7.4, 0.55, (q, w, h) => { q.fillStyle = '#2a2c30'; q.font = `700 italic ${h * 0.4}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('To see the city, to count every face in it. That is the purpose of Negative Assets.', w / 2, h / 2); }, 128, 0.16, 4.5, -4.1, PI / 2, { alpha: true, lit: true });
    pic(c, g, 6.0, 1.0, (q, w, h) => { q.fillStyle = '#c8102e'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.font = `900 ${h * 0.56}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('NEGATIVE ASSETS', w / 2, h * 0.54); }, 128, 19.84, 4.6, -4.1, -PI / 2, { lit: true });
    // strips of film drying on wires over the aisles
    const filmT = c.canvasTex(32, 256, (q, w, h) => { q.fillStyle = '#2a1a0a'; q.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 12) { q.fillStyle = '#f0e0c0'; q.fillRect(2, y, 4, 6); q.fillRect(w - 6, y, 4, 6); } for (let y = 6; y < h; y += 40) { q.fillStyle = `rgba(${200 + Math.random() * 55},${130 + Math.random() * 60},60,.7)`; q.fillRect(8, y, w - 16, 32); } });
    const NFS = 24, film = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 1.1).translate(0, -0.55, 0), new THREE.MeshStandardMaterial({ map: filmT, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.92 }), NFS), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    film.frustumCulled = false; g.add(film); const FS = []; [-2.2, 0.8, 4.4].forEach((z) => { g.add(c.slab(18.6, 0.01, 0.01, K.std(0x888888), 10, 4.85, z)); for (let i = 0; i < 8; i++) FS.push([2.2 + i * 2.2 + (z > 0 ? 0.6 : 0), z]); });
    const swing = (t) => { FS.forEach(([x, z], i) => { e4.set(Math.sin(t * 0.9 + i) * 0.08, Math.sin(t * 0.5 + i * 2) * 0.5, 0); q4.setFromEuler(e4); m4.compose(v4.set(x, 4.85, z), q4, one); film.setMatrixAt(i, m4); }); film.instanceMatrix.needsUpdate = true; };
    swing(0); c.tick((t, dt, P, ri) => { if (near(r, ri)) swing(t); });
    // the darkroom door: red safelight, a red sign
    const red = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), hot(c, 0xff1a10, 2.4)); red.position.set(19.75, 3.0, 6.6); g.add(red); glow(c, K, g, 'rgba(255,30,20,.8)', 19.6, 3.0, 6.6, 1.6, 0.8);
    const ds = c.sign('DARKROOM, IN USE', { w: 1.4, h: 0.26, bg: '#1a0000', fg: '#ff3020', font: c.MONO, weight: 800, glow: 10 }); ds.position.set(19.84, 2.6, 6.6); ds.rotation.y = -PI / 2; ds.material.color.setScalar(1.4); g.add(ds);
    g.add(c.slab(0.06, 2.3, 1.0, K.std(0x1a1a1a, { roughness: 0.6 }), 19.86, 1.15, 6.6));
    // contact sheets on the desk, a cart of boxes in the aisle
    pic(c, g, 0.42, 0.34, (q, w, h) => { q.fillStyle = '#f4f4f0'; q.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { q.fillStyle = `hsl(${200 + x * 20},20%,${30 + y * 10}%)`; q.fillRect(6 + x * w / 5.2, 6 + y * h / 4.2, w / 5.6, h / 4.8); } q.strokeStyle = '#c8102e'; q.lineWidth = 3; q.beginPath(); q.arc(6 + 2 * w / 5.2 + w / 11, 6 + h / 4.2 + h / 9, w / 9, 0, 7); q.stroke(); }, 256, 9.2, 0.785, -2.8, 0.3, { flat: true, lit: true });
    const cart = new THREE.Group(); cart.position.set(2.8, 0, 0.6); cart.rotation.y = 0.3; g.add(cart); const cm = K.std(0x8a8e94, { metalness: 0.8, roughness: 0.35 });
    cart.add(c.slab(1.1, 0.04, 0.6, cm, 0, 0.8, 0)); cart.add(c.slab(1.1, 0.04, 0.6, cm, 0, 0.25, 0)); [[-0.52, -0.27], [0.52, -0.27], [-0.52, 0.27], [0.52, 0.27]].forEach(([x, z]) => { cart.add(c.slab(0.03, 0.75, 0.03, cm, x, 0.48, z)); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), K.std(0x111111)); w.rotation.x = PI / 2; w.position.set(x, 0.06, z); cart.add(w); });
    K.prop(r, cart, X, 'nyb_mitty_box', -0.25, 0, { len: 0.45, y: 0.82, ry: 0.2 }); K.prop(r, cart, X, 'nyb_mitty_box', 0.28, 0.02, { len: 0.42, y: 0.82, ry: -0.3 }); K.prop(r, cart, X, 'nyb_mitty_box', 0, 0, { len: 0.45, y: 0.27, ry: 0.1 }); c.post(X(2.8), 0.6, 0.6);
    motes(c, K, r, g, 110, [7, 13, 2.5, 5.8, -7.6, -4.5], 0xe8f0ff, 0.035, [0, -0.03, 0.02], 0.1);
    r.post = { ...(r.post || {}), bloom: 1.0 };
  },

  // ---------- Ghostbusters II, 1989 ----------
  // Illusion: Pepper's ghost. In the lit shop window on the east side of Fifth a ghost floats between the mannequins,
  // seen through the glass and only from in front of it; walk along the window and she thins out to nothing. From the entrance, right.
  statuewalk(c, r, g, X, K) {
    const { THREE } = c, WX = 19.1, WZ = 0.3, bronze = K.std(0x4a3a24, { metalness: 0.8, roughness: 0.35 });
    const win = new THREE.Group(); win.position.set(WX, 0, WZ); g.add(win);
    win.add(c.slab(0.9, 0.5, 2.7, bronze, 0.4, 0.25, 0)); win.add(c.slab(0.9, 0.3, 2.7, bronze, 0.4, 2.75, 0)); [-1.28, 1.28].forEach((dz) => win.add(c.slab(0.9, 2.9, 0.14, bronze, 0.4, 1.45, dz)));
    const back = pic(c, win, 2.42, 2.1, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#8a1a2a'); gr.addColorStop(1, '#2a0408'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(214,166,64,.35)'; q.lineWidth = 2; for (let i = -h; i < w; i += 40) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i + h, h); q.stroke(); q.beginPath(); q.moveTo(i + h, 0); q.lineTo(i, h); q.stroke(); } }, 256, 0.78, 1.55, 0, -PI / 2, { lit: true });
    back.material.emissive = new THREE.Color(0x3a0810); back.material.emissiveMap = back.material.map;
    win.add(c.slab(0.8, 0.02, 2.42, K.std(0xf4ece0, { roughness: 0.4 }), 0.4, 0.51, 0)); win.add(c.slab(0.05, 0.03, 2.4, hot(c, 0xfff0d0, 1.8), 0.15, 2.58, 0));
    glow(c, K, win, 'rgba(255,220,170,.7)', 0.45, 1.8, 0, 2.6, 0.45);
    [-0.75, 0.8].forEach((dz, k) => { const m = K.extra(win, 0.45, dz, { col: [0xc8102e, 0xf4f4f0][k], ry: -PI / 2 }); m.position.y = 0.52; });
    [[0.5, 0.25, 0xd6a640], [0.35, -0.2, 0x22d3ee], [0.55, 0.0, 0xff4fa3]].forEach(([x, z, col], k) => { const b = c.slab(0.24 - k * 0.04, 0.2 - k * 0.03, 0.24, K.std(col, { roughness: 0.4 }), x, 0.62, z); win.add(b); });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 2.0), new THREE.MeshStandardMaterial({ color: 0xc8e0f0, roughness: 0.04, metalness: 1, transparent: true, opacity: 0.16, envMapIntensity: 2.5, depthWrite: false })); glass.position.set(-0.04, 1.5, 0); glass.rotation.y = -PI / 2; win.add(glass);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 1, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide })); sheet.position.set(0.4, 1.5, 0); sheet.rotation.set(0, -PI / 2, 0); sheet.rotateX(-PI / 4); win.add(sheet);
    const ghostT = c.canvasTex(256, 384, (q, w, h) => { q.filter = 'blur(4px)'; const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(200,255,240,.9)'); gr.addColorStop(1, 'rgba(120,220,255,0)'); q.fillStyle = gr; q.beginPath(); q.moveTo(w * 0.3, h * 0.25); q.quadraticCurveTo(w * 0.1, h * 0.6, w * 0.22, h * 0.95); q.quadraticCurveTo(w * 0.4, h * 0.82, w * 0.5, h * 0.98); q.quadraticCurveTo(w * 0.62, h * 0.82, w * 0.8, h * 0.95); q.quadraticCurveTo(w * 0.9, h * 0.6, w * 0.7, h * 0.25); q.closePath(); q.fill(); q.beginPath(); q.moveTo(w * 0.3, h * 0.35); q.quadraticCurveTo(w * 0.05, h * 0.3, w * 0.02, h * 0.12); q.lineTo(w * 0.1, h * 0.1); q.quadraticCurveTo(w * 0.2, h * 0.28, w * 0.34, h * 0.3); q.fill(); q.filter = 'none'; q.globalAlpha = 0.85; K.eyeFlower(q, w / 2, h * 0.2, w * 0.2, '#e8fff8', '#22d3ee'); });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshBasicMaterial({ map: ghostT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })); ghost.position.set(0.5, 1.55, 0.05); ghost.rotation.y = -PI / 2; win.add(ghost);
    const gv = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) { ghost.material.opacity = 0; return; } gv.set(P.x - r.x0 - WX, 0, P.z - WZ); const L = Math.hypot(gv.x, gv.z) || 1, front = -gv.x / L; const vis = Math.max(0, Math.min(1, (front - 0.25) / 0.4)); ghost.material.opacity = vis * (0.85 + Math.sin(t * 1.3) * 0.15); ghost.position.y = 1.55 + Math.sin(t * 0.9) * 0.12; ghost.position.z = 0.05 + Math.sin(t * 0.5) * 0.25; ghost.rotation.z = Math.sin(t * 0.7) * 0.06; });
    c.wall(X(WX - 0.05), WZ - 1.35, X(WX - 0.05), WZ + 1.35);
    const sg = c.sign('MLOW & CO., FIFTH AVENUE', { w: 2.6, h: 0.28, bg: '#0d0d0d', fg: '#f5c542', font: c.SERIF, weight: 900, border: '#d6a640', glow: 10 }); sg.position.set(-0.08, 3.05, 0); sg.rotation.y = -PI / 2; sg.material.color.setScalar(1.3); win.add(sg);
    const nb = 14, bm = hot(c, 0xffe0a0, 2); for (let i = 0; i < nb; i++) { const u = i / (nb - 1), z = -1.3 + u * 2.6, b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bm); b.position.set(-0.06, 2.65, z); win.add(b); }
    c.clickable(glass, () => { c.sound.chords(4); c.egg('statuewalk_ghost', 'A ghost in the window on Fifth, between the mannequins, and she is only there if you stand in front of the glass. Walk along it and she thins to nothing. MLow says half the New Yorkers on this avenue are like that.'); }, 'A shop window');
    // the skyline and its countdown, searchlights behind it, fireworks over the avenue
    skyline(c, g, { z: 11.5, h: 16, seed: 5 });
    const cdT = c.canvasTex(512, 128, () => {}), cq = cdT.userData.canvas.getContext('2d'); let shown = -1;
    const drawCD = (n) => { cq.fillStyle = '#05060a'; cq.fillRect(0, 0, 512, 128); cq.textAlign = 'center'; cq.textBaseline = 'middle'; if (n > 0) { cq.fillStyle = '#ff4fa3'; cq.font = `900 54px ${c.FONT}`; cq.fillText(`1990 IN ${n}`, 256, 66); } else { cq.fillStyle = '#f5c542'; cq.font = `900 50px ${c.SERIF}`; cq.fillText('HAPPY N3W YEAR', 256, 66); } cdT.needsUpdate = true; };
    drawCD(10); const cd = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: cdT, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.5) })); cd.position.set(10, 9.6, 11.3); cd.rotation.y = PI; g.add(cd);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const u = Math.floor(t % 15), n = Math.max(0, 10 - u); if (n !== shown) { shown = n; drawCD(n); } });
    const sl = [4, 16].map((x, k) => { const geo = new THREE.CylinderGeometry(0.15, 2.6, 40, 20, 1, true); geo.rotateX(PI); geo.translate(0, 20, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: fadeTex(c), color: 0xd8e4ff, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false })); m.position.set(x, 0, 13); g.add(m); return m; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; sl.forEach((m, k) => { m.rotation.z = Math.sin(t * 0.3 + k * 2) * 0.45; m.rotation.x = -0.25 + Math.sin(t * 0.21 + k) * 0.15; }); });
    const NB = c.MOBILE ? 50 : 90, bursts = [0, 1, 2].map((k) => { const p = new Float32Array(NB * 3), dirs = new Float32Array(NB * 3); for (let i = 0; i < NB; i++) { const a = Math.random() * PI * 2, b = Math.acos(2 * Math.random() - 1); dirs.set([Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)], i * 3); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: gtex(K, 'rgba(255,255,255,.9)'), size: 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); pts.frustumCulled = false; g.add(pts); return { pts, p, dirs, geo, c0: new THREE.Vector3(), k }; });
    const PAL = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff];
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; bursts.forEach((B) => { const u = ((t + B.k * 1.3) % 4) / 4; if (u < B.last) { B.c0.set(4 + Math.random() * 12, 9 + Math.random() * 4, -5 + Math.random() * 8); B.pts.material.color.setHex(PAL[(Math.random() * 4) | 0]).multiplyScalar(1.8); } B.last = u; const R = Math.sqrt(u) * 3.2; for (let i = 0; i < NB; i++) { B.p[i * 3] = B.c0.x + B.dirs[i * 3] * R; B.p[i * 3 + 1] = B.c0.y + B.dirs[i * 3 + 1] * R - u * u * 2; B.p[i * 3 + 2] = B.c0.z + B.dirs[i * 3 + 2] * R; } B.geo.attributes.position.needsUpdate = true; B.pts.material.opacity = u < 0.7 ? 1 : (1 - u) / 0.3; }); });
    // the lamps on Fifth with their halo in the snow, drifts against the walls, slush down the avenue
    [[1.4, -1], [18.6, -1]].forEach(([x, z]) => { glow(c, K, g, 'rgba(255,230,190,.9)', x + (x < 10 ? 0.45 : -0.45), 4.25, z, 2.0, 0.85); haze(c, g, x + (x < 10 ? 0.45 : -0.45), 4.2, z, 0.12, 1.5, 4.2, 0xffe8c8, 0.1); });
    const drift = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.95 }); [[1.0, -7.0, 1.4], [19.0, -6.6, 1.6], [1.2, 7.2, 1.2], [18.8, 7.4, 1.5], [0.9, 1.0, 0.8], [6.0, 7.5, 1.0], [14.0, 7.5, 1.1]].forEach(([x, z, s]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), drift); d.scale.set(s, s * 0.32, s * 0.7); d.position.set(x, 0, z); g.add(d); });
    [8.9, 11.1].forEach((x) => { const tr = pic(c, g, 0.5, 15, (q, w, h) => { q.fillStyle = 'rgba(20,20,26,.55)'; for (let y = 0; y < h; y += 10) q.fillRect(4 + Math.sin(y * 0.02) * 3, y, w - 8, 6); }, 64, x, 0.007, 0, 0, { alpha: true, flat: true, lit: true }); tr.material.polygonOffset = true; tr.material.polygonOffsetFactor = -2; });
    // holiday lights strung along both walls, twinkling
    const NL = c.MOBILE ? 24 : 40, lit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), NL * 2), m4 = new THREE.Matrix4(), col = new THREE.Color(), LC = [[2.4, 0.3, 0.3], [0.3, 2.2, 0.5], [2.4, 1.9, 0.6], [0.4, 0.9, 2.6], [2.4, 0.5, 1.4]];
    for (let s = 0; s < 2; s++) for (let i = 0; i < NL; i++) { const z = -7.6 + i * 15.2 / (NL - 1); m4.makeTranslation(s ? 19.82 : 0.18, 3.75 - Math.abs(Math.sin(i * 0.7)) * 0.18, z); lit.setMatrixAt(s * NL + i, m4); lit.setColorAt(s * NL + i, col.setRGB(...LC[i % 5])); } g.add(lit);
    let tw = 0; c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; tw += dt; if (tw < 0.3) return; tw = 0; for (let i = 0; i < NL * 2; i++) { const k = LC[i % 5], on = Math.sin(t * 2 + i * 1.7) > -0.3 ? 1 : 0.15; lit.setColorAt(i, col.setRGB(k[0] * on, k[1] * on, k[2] * on)); } lit.instanceColor.needsUpdate = true; });
    // steam off a manhole in the middle of the avenue, pink underneath: the river of slime runs down there
    const mh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), K.std(0x2a2a2e, { metalness: 0.8, roughness: 0.4 })); mh.rotation.x = -PI / 2; mh.position.set(10, 0.01, 0.6); g.add(mh); glow(c, K, g, 'rgba(255,79,163,.7)', 10, 0.12, 0.6, 1.0, 0.4); K.steam(g, 10, 0.15, 0.6);
    r.post = { ...(r.post || {}), bloom: 1.2 };
  },

  // ---------- King Kong, 1933 ----------
  // Illusion: forced perspective, the oldest trick in the picture business. A little lady stands on a chrome column on
  // the deck; his hand rests on the east parapet, palm up. From the camera mark on the floor (south, left of the lane)
  // she stands in his palm against the moon. From anywhere else she is a doll on a stick and his hand is empty.
  kong(c, r, g, X, K) {
    const { THREE } = c, S = new THREE.Vector3(8.0, 1.62, 7.0), H = new THREE.Vector3(19.7, 4.35, -2.4), F = S.clone().lerp(H, 0.55);
    // his hand, over the east wall, palm up: bone, like the rest of him
    const boneM = K.std(0xb8b2a4, { roughness: 0.65 }), Yv = new THREE.Vector3(0, 1, 0), hand = new THREE.Group(); hand.position.copy(H); g.add(hand);
    const bone = (a, b, rad) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = new THREE.Mesh(new THREE.CapsuleGeometry(rad, Math.max(0.01, L - rad), 6, 10), boneM); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Yv, d.normalize()); hand.add(m); const k = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.35, 12, 10), boneM); k.position.copy(b); hand.add(k); return m; };
    const wrist = new THREE.Vector3(1.1, -0.35, 0); [[-0.66, 0.42], [-0.22, 0.5], [0.22, 0.48], [0.64, 0.38]].forEach(([z, L]) => { const kn = new THREE.Vector3(-0.7, -0.12, z); bone(new THREE.Vector3(1.0, -0.32, z * 0.45), kn, 0.1); let p0 = kn, a = 0.35; [L, L * 0.8, L * 0.62].forEach((Lk, k) => { const p1 = p0.clone().add(new THREE.Vector3(-Math.cos(a) * Lk, Math.sin(a) * Lk, 0)); bone(p0, p1, 0.085 - k * 0.012); p0 = p1; a += 0.5; }); });
    bone(new THREE.Vector3(0.9, -0.3, 0.55), new THREE.Vector3(0.1, -0.05, 1.05), 0.1); bone(new THREE.Vector3(0.1, -0.05, 1.05), new THREE.Vector3(-0.35, 0.3, 1.0), 0.08);
    [[0, 0], [0.18, 0.25], [0.18, -0.25], [-0.05, 0.4], [-0.05, -0.4]].forEach(([dx, dz]) => { const cb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), boneM); cb.position.set(wrist.x + dx, wrist.y, dz); hand.add(cb); });
    bone(new THREE.Vector3(1.2, -0.4, 0.18), new THREE.Vector3(4.6, -6.5, 0.0), 0.2); bone(new THREE.Vector3(1.2, -0.4, -0.18), new THREE.Vector3(4.8, -6.4, -0.5), 0.17);
    // the moon, far out on the same line, so from the mark his bones stand against it
    const M = S.clone().lerp(H, 6); const moon = glow(c, K, g, 'rgba(240,240,230,.8)', M.x, M.y, M.z, 30, 0.45); const disc = new THREE.Mesh(new THREE.CircleGeometry(9, 48), hot(c, 0xf4f4ec, 1.5)); disc.position.copy(M); g.add(disc); disc.lookAt(new THREE.Vector3(r.x0 + S.x, S.y, S.z));
    // the column and the lady on it
    const chrome = K.std(0xd8d8d8, { metalness: 1, roughness: 0.15 }); g.add(c.slab(0.5, 0.16, 0.5, chrome, F.x, 0.08, F.z)); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, F.y - 0.05, 12), chrome); col.position.set(F.x, (F.y - 0.05) / 2 + 0.05, F.z); g.add(col); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.05, 20), chrome); top.position.set(F.x, F.y - 0.025, F.z); g.add(top); c.post(X(F.x), F.z, 0.35);
    const lady = K.extra(g, F.x, F.z, { col: 0x4a4a4a, ry: Math.atan2(S.x - F.x, S.z - F.z) }); lady.scale.setScalar(0.46); lady.position.y = F.y;
    [-1, 1].forEach((s) => { const a = c.slab(0.06, 0.42, 0.06, K.std(0x4a4a4a), s * 0.2, 1.55, 0); a.rotation.z = s * 2.6; lady.add(a); });
    c.clickable(lady, () => { c.sound.roar(0.4); c.egg('kong_inhand', 'Stand on the camera mark and she is in his hand, twelve hundred feet up, against the moon. Step off and she is a doll on a stick. MLow says that is all a picture ever was, and all a census is too.'); }, 'A little lady on a column');
    const mark = pic(c, g, 1.3, 1.3, (q, w, h) => { const cx = w / 2; q.strokeStyle = '#f4f4ec'; q.lineWidth = 6; q.beginPath(); q.arc(cx, cx, cx * 0.9, 0, 7); q.stroke(); for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; q.beginPath(); q.moveTo(cx + Math.cos(a) * cx * 0.5, cx + Math.sin(a) * cx * 0.5); q.lineTo(cx + Math.cos(a) * cx * 0.84, cx + Math.sin(a) * cx * 0.84); q.lineWidth = i % 2 ? 2 : 5; q.stroke(); } q.fillStyle = '#f4f4ec'; q.font = `900 ${cx * 0.13}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('CAMERA MARK', cx, cx * 0.96); q.fillText('STAND HERE', cx, cx * 1.16); }, 256, S.x, 0.012, S.z, 0, { alpha: true, flat: true, lit: true });
    mark.material.polygonOffset = true; mark.material.polygonOffsetFactor = -3;
    // searchlight beams into the sky, clouds going over, beacons on the poles, lightning far off
    const beams = [[2.9, -6.5], [17.2, -6.9]].map(([x, z], k) => { const geo = new THREE.CylinderGeometry(0.12, 2.4, 45, 20, 1, true); geo.rotateX(PI); geo.translate(0, 22.5, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: fadeTex(c), color: 0xffffff, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false })); m.position.set(x, 1.0, z); g.add(m); return m; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; beams.forEach((m, k) => { m.rotation.x = -0.55 - Math.sin(t * 0.4 + k) * 0.15; m.rotation.z = Math.sin(t * 0.3 + k * 2) * 0.6; }); });
    const cloudM = new THREE.SpriteMaterial({ map: gtex(K, 'rgba(200,200,200,.35)'), transparent: true, depthWrite: false, opacity: 0.35 }), clouds = [];
    for (let k = 0; k < (c.MOBILE ? 4 : 8); k++) { const s = new THREE.Sprite(cloudM); s.scale.set(9, 3, 1); s.position.set(Math.random() * 28 - 4, 7 + Math.random() * 5, -6 + Math.random() * 12); g.add(s); clouds.push(s); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; clouds.forEach((s, k) => { s.position.x += dt * (0.5 + k * 0.08); if (s.position.x > 26) s.position.x = -6; }); });
    const bc = [[1.0, 7.3], [19.0, 7.3]].map(([x, z]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), hot(c, 0xffffff, 2.6)); b.position.set(x, 6.42, z); g.add(b); return [b, glow(c, K, g, 'rgba(255,255,255,.9)', x, 6.42, z, 0.9, 1)]; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const on = (t % 1.6) < 0.35; bc.forEach(([b, s]) => { b.visible = on; s.visible = on; }); });
    const bolt = glow(c, K, g, 'rgba(255,255,255,1)', -8, 16, -40, 40, 0); let flash = 0;
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; flash -= dt; if (flash < -6 && Math.random() < dt * 0.4) flash = 0.25; bolt.material.opacity = flash > 0 ? (Math.sin(flash * 60) > 0 ? 0.6 : 0.15) : 0; });
    // the film crew's two lamps, on stands, burning at the edge
    [[4.0, -3.6], [8.6, -5.0]].forEach(([x, z]) => { const st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.y = Math.atan2(10 - x, -7.6 - z); g.add(st); const steel = K.std(0x222222, { metalness: 0.7, roughness: 0.4 }); st.add(c.slab(0.04, 1.8, 0.04, steel, 0, 0.9, 0)); [0, 2.1, 4.2].forEach((a) => { const l = c.slab(0.03, 0.8, 0.03, steel, Math.cos(a) * 0.25, 0.35, Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); st.add(l); }); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 18), steel); hd.rotation.x = PI / 2; hd.position.y = 1.95; st.add(hd); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), hot(c, 0xffffff, 2.2)); lens.position.set(0, 1.95, 0.205); st.add(lens); glow(c, K, st, 'rgba(255,255,255,.8)', 0, 1.95, 0.4, 1.4, 0.7); c.post(X(x), z, 0.35); });
    // pigeons on the parapet, watching the planes
    [5.2, 7.4, 12.8, 14.6].forEach((x, k) => c.glb('pigeon', { len: 0.3, x, y: 1.06, z: -8.0, ry: PI + k, parent: g, shadow: false }));
    r.post = { ...(r.post || {}), bloom: 1.1 };
  },
};

// a sign on a wall: plane, hung at (x, y, z) facing ry
function wallSign(c, g, text, x, y, z, ry, o) { const s = c.sign(text, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }

export const SWAP = {};
