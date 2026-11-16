
// ---------- the one night the whole gallery shares ----------
// LT.tree: the tree is lit (room 4, seen again from room 5). LT.night: the night of Chanukah you chose (room 6), which
// Brooklyn (room 7) and the window (room 8) keep. Kept per browser, so the city remembers what you switched on.
const LT = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('lightings.v1') || '{}'); } catch (e) {}
  // Chanukah by the real calendar, in New York time: the first candle is lit at sundown (about 4:30 pm in December) on the
  // evening before 25 Kislev, and each night begins at the next sundown. 5786: 14 Dec 2025, 5787: 4 Dec 2026,
  // 5788: 24 Dec 2027, 5789: 12 Dec 2028. During Chanukah the real night wins on arrival; out of it, a countdown.
  const FIRST = [[2025, 11, 14], [2026, 11, 4], [2027, 11, 24], [2028, 11, 12]];
  let ny; try { ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); } catch (e) { ny = new Date(); }
  let real = 0, until = 0;
  for (const [y, m, dd] of FIRST) { const st = new Date(y, m, dd, 16, 30), k = Math.floor((ny - st) / 864e5) + 1;
    if (k >= 1 && k <= 8) { real = k; break; } if (k < 1 && !until) until = Math.ceil((st - ny) / 864e5); }
  return { tree: !!s.tree, night: real || s.night || 8, real, until, lit: s.lit || {}, fans: [] }; })();
function ltSave() { try { localStorage.setItem('lightings.v1', JSON.stringify({ tree: LT.tree, night: LT.night, lit: LT.lit })); } catch (e) {} LT.fans.forEach((f) => f()); }
window.LIGHTINGS = LT;
const snd = (c, k, ...a) => { const s = c.sound; if (s && s[k]) s[k](...a); };
const ease = (u) => u * u * (3 - 2 * u);

// ---------- snow ----------
function snowfall(c, r, g, N, box = { x1: 0, x2: W, y1: 0, y2: 12, z1: -D / 2, z2: D / 2 }) {
  const { THREE } = c, pos = new Float32Array(N * 3), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = box.x1 + Math.random() * (box.x2 - box.x1); pos[i * 3 + 1] = box.y1 + Math.random() * (box.y2 - box.y1); pos[i * 3 + 2] = box.z1 + Math.random() * (box.z2 - box.z1); sp[i] = 0.35 + Math.random() * 0.5; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // world sized points blow up into white blobs right in front of the lens: cap the size and fade a flake out inside a metre
  const sm = new THREE.ShaderMaterial({ uniforms: { map: { value: glowTex(c, 'rgba(255,255,255,.9)') }, uH: { value: 500 } }, transparent: true, depthWrite: false,
    vertexShader: 'uniform float uH; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); float d = -mv.z; gl_PointSize = min(0.09 * uH / max(d, .01), 6.); vA = .85 * smoothstep(.6, 1.6, d); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); if (vA * t.a < .01) discard; gl_FragColor = vec4(t.rgb, t.a * vA); }' });
  const pts = new THREE.Points(geo, sm); pts.frustumCulled = false; g.add(pts);
  pts.onBeforeRender = (rd) => { sm.uniforms.uH.value = rd.domElement.height * 0.5; };
  r.snowBoost = 1;
  c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 1) return; const k = r.snowBoost || 1;
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * sp[i] * k; pos[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.12 * k; if (pos[i * 3 + 1] < box.y1) pos[i * 3 + 1] = box.y2; }
    geo.attributes.position.needsUpdate = true; });
  return pts;
}

// ---------- the plate, projection mapped ----------
// The plate is a photograph rebuilt as geometry from its depth map, built to read true from one spot: the middle of the room
// at eye height. Anything drawn on it in its own uv space is anamorphic for free. uLit and uBand switch it off and back on
// (Dyker Heights); uShow plays snowflakes, sweeps and one enormous eye flower across the stone (Fifth Avenue).
function plateFX(c, r) {
  const { THREE } = c, U = { uLit: { value: 1 }, uBand: { value: 2 }, uShow: { value: 0 }, uFlower: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 } };
  let done = false;
  c.tick((t) => { U.uTime.value = t; if (done || !r.plateMesh) return; done = true; const old = r.plateMesh.material;
    const m = new THREE.ShaderMaterial({ uniforms: { map: { value: old.map }, fade: { value: old.alphaMap }, ...U }, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D map, fade; uniform float uLit, uBand, uShow, uFlower, uTime, uWarm; varying vec2 vUv;
        float flake(vec2 p){ float r = length(p); float a = atan(p.y, p.x); a = mod(a + 0.5236, 1.0472) - 0.5236; vec2 q = r * vec2(cos(a), abs(sin(a)));
          float m = smoothstep(0.045, 0.0, q.y) * step(q.x, 1.0);
          for (int k = 1; k <= 3; k++) { float x0 = 0.22 * float(k); float b = abs(q.y - (q.x - x0) * 0.75) ; m += smoothstep(0.04, 0.0, b) * step(x0, q.x) * step(q.x, x0 + 0.32 - 0.06 * float(k)); }
          m += smoothstep(0.12, 0.08, r); return clamp(m, 0., 1.) * smoothstep(1.02, 0.95, r); }
        vec3 flower(vec2 p){ float r = length(p); float a = atan(p.y, p.x); float pet = 0.62 + 0.38 * pow(abs(cos(a * 4.)), 0.6);
          vec3 c = vec3(0.);
          if (r < pet) c = mix(vec3(1.0, 0.95, 0.98), vec3(1.0, 0.31, 0.64), smoothstep(0.25, 1.0, r / pet));
          if (r < 0.42) c = vec3(0.11, 0.3, 0.85); if (r < 0.32) c = vec3(1.); if (r < 0.22) c = vec3(0.13, 0.83, 0.93); if (r < 0.12) c = vec3(0.04, 0.06, 0.13);
          return c * step(r, pet); }
        void main(){
          vec4 tx = texture2D(map, vUv); vec3 col = tx.rgb; float a = texture2D(fade, vUv).g;
          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          float lit = max(uLit, step(vUv.x, uBand));
          vec3 dark = col * mix(0.55, 0.06, smoothstep(0.22, 0.65, lum));
          col = mix(dark, col, lit);
          if (uShow > 0.001) {
            float facade = smoothstep(0.32, 0.42, vUv.y);
            vec2 p = vec2(vUv.x * 2.0, vUv.y); vec2 cell = floor(p * 4.); vec2 f = fract(p * 4.) - 0.5;
            float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
            float beat = 0.5 + 0.5 * sin(uTime * 3.3 + h * 6.28);
            float s = flake(f * (2.6 - beat * 0.9) ) * step(0.35, h);
            float sweep = smoothstep(0.06, 0.0, abs(fract(vUv.x * 1.5 - uTime * 0.25) - 0.5) - 0.42);
            float rings = smoothstep(0.03, 0.0, abs(fract(length(vec2((vUv.x - 0.5) * 2., vUv.y - 0.62)) * 3. - uTime * 0.6) - 0.5) - 0.44);
            vec3 tint = mix(vec3(1.0, 0.92, 0.75), vec3(1.0, 0.25, 0.25), step(0.66, fract(uTime * 0.11)));
            vec3 show = tint * (s * 1.4 + sweep * 0.5 + rings * 0.35);
            col += show * facade * uShow * (0.25 + lum * 0.85);   // v2.1: the peak was blowing the facade out to white
            col *= mix(1.0, 0.55 + 0.45 * facade, uShow * 0.5);
          }
          if (uFlower > 0.001) { vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y - 0.6) / 0.34; vec3 fl = flower(p); float m = step(0.001, dot(fl, vec3(1.)));
            col = mix(col, fl * (0.7 + lum * 1.2) + fl * 0.4, m * uFlower * 0.9); }
          col *= 1.0 + uWarm * vec3(0.25, 0.12, -0.05);
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }` });
    r.plateMesh.material = m; c.warm(r.plateMesh); });
  return U;
}

// ---------- LEDs: tens of thousands of bulbs as one draw ----------
// lc colour, ord the order they come on in (0 first, 1 last). uOn sweeps past ord to light them; uMaster is the main switch.
function ledMat(c, size, gain = 2.4) {
  const { THREE } = c;
  return new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 }, uMaster: { value: 1 }, uTime: { value: 0 }, uSize: { value: size }, uPR: { value: c.renderer.getPixelRatio() * Math.max(1, innerHeight) / 900 }, uGain: { value: gain }, uChase: { value: 0 }, uMinPx: { value: 0 } },
    vertexShader: `attribute vec3 lc; attribute float ord; uniform float uOn, uMaster, uTime, uSize, uPR, uChase, uMinPx; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        float on = smoothstep(ord - 0.012, ord, uOn) * uMaster;
        float tw = 0.78 + 0.22 * sin(uTime * (1.7 + fract(ord * 91.7) * 3.1) + ord * 517.);
        if (uChase > 0.) tw *= 0.35 + 0.65 * step(0.5, fract(ord * 40. - uTime * uChase));
        vA = on * tw; vC = lc;
        gl_PointSize = max(uSize * uPR * (0.45 + 0.55 * on) * 300. / max(0.5, -mv.z), uMinPx * uPR); }`,
    fragmentShader: `uniform float uGain, uMaster; varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); float k = 1. - smoothstep(0., .5, r); float core = 1. - smoothstep(0., .16, r);   /* reversed smoothstep edges are undefined in GLSL: close bulbs drew black pupils */
        vec3 col = mix(vC * 0.05 * uMaster, vC * uGain * k + core * 1.4 * vA, vA); gl_FragColor = vec4(col * k, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
}
const BULB = [[1, 0.24, 0.2], [0.2, 1, 0.42], [0.25, 0.45, 1], [1, 0.7, 0.18], [1, 0.9, 0.72], [1, 0.9, 0.72], [1, 0.4, 0.75]];
function ledPoints(c, g, pts, { size = 0.18, gain, palette = BULB, chase = 0 } = {}) {
  const { THREE } = c, n = pts.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ord = new Float32Array(n);
  pts.forEach((p, i) => { pos.set([p[0], p[1], p[2]], i * 3); const k = p[4] ?? palette[(Math.random() * palette.length) | 0]; col.set(k, i * 3); ord[i] = p[3] ?? 0; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('lc', new THREE.BufferAttribute(col, 3)); geo.setAttribute('ord', new THREE.BufferAttribute(ord, 1));
  const m = ledMat(c, size, gain); m.uniforms.uChase.value = chase; const o = new THREE.Points(geo, m); o.renderOrder = 3; g.add(o);
  c.tick((t) => { m.uniforms.uTime.value = t; });
  return o;
}
// lights along a polyline, evenly spaced
function strand(path, step, ord0 = 0, ord1 = 1) {
  const out = []; let L = 0; const seg = [];
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); seg.push(l); L += l; }
  const n = Math.max(2, Math.round(L / step));
  for (let k = 0; k <= n; k++) { let d = k / n * L, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const u = seg[i] ? d / seg[i] : 0, a = path[i], b = path[i + 1] || a;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, ord0 + (ord1 - ord0) * k / n]); }
  return out;
}
function flameSprite(c, parent, x, y, z, s = 0.2) {
  const { THREE } = c, f = new THREE.Sprite(new THREE.SpriteMaterial({ map: FLAME.t ||= glowTex(c, 'rgba(255,160,50,.95)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, color: 0xffd8a0 }));
  f.position.set(x, y, z); f.scale.set(s * 0.6, s, 1); f.visible = false; parent.add(f);
  const ph = Math.random() * 9; c.tick((t) => { if (f.visible) f.scale.set(s * (0.55 + Math.sin(t * 17 + ph) * 0.05), s * (0.95 + Math.sin(t * 23 + ph) * 0.12), 1); });
  return f;
}
const FLAME = {};

// ---------- the tree ----------
// A Norway spruce of H metres: branch cards in whorls round a dark core (instanced, two draws), strands of LEDs on eight
// helices from the base to the top (one draw, they come on in a spiral), and a crystal star of seventy spikes.
const NEEDLES = {};
function needleTex(c) {
  return NEEDLES.t ||= c.canvasTex(256, 128, (q, w, h) => {
    q.clearRect(0, 0, w, h); q.strokeStyle = '#3a2a1a'; q.lineWidth = 4; q.beginPath(); q.moveTo(0, h / 2); q.quadraticCurveTo(w * 0.5, h * 0.52, w, h * 0.46); q.stroke();
    for (let i = 0; i < 520; i++) { const u = Math.random(), x = u * w, y = h / 2 + (Math.random() - 0.5) * h * (0.25 + 0.7 * (1 - u)) * (1 - u * 0.3);
      const g2 = 18 + Math.random() * 40 | 0; q.strokeStyle = `rgb(${g2 * 0.35 | 0},${g2 + 40},${g2 * 0.5 | 0})`; q.lineWidth = 1.6; q.beginPath(); q.moveTo(x, h / 2 + (y - h / 2) * 0.2); q.lineTo(x + 6 + Math.random() * 8, y); q.stroke(); }
    for (let i = 0; i < 70; i++) { q.fillStyle = 'rgba(190,230,200,.35)'; q.fillRect(Math.random() * w, h * 0.2 + Math.random() * h * 0.6, 3, 1); }
  });
}
function buildTree(c, parent, { H = 24, R = 6.2, x = 0, y = 0, z = 0, lights = 18000, size = 0.2, cards = 1, star = true } = {}) {
  const { THREE } = c, T = new THREE.Group(); T.position.set(x, y, z); parent.add(T);
  const rad = (yy) => R * Math.pow(Math.max(0, 1 - (yy - H * 0.05) / (H * 0.95)), 0.92) + R * 0.03;
  T.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.05, R * 0.08, H * 0.98, 10), std(c, 0x3a2818, { roughness: 1 })).translateY(H * 0.49));
  const core = new THREE.Mesh(new THREE.ConeGeometry(R * 0.86, H * 0.93, 28, 1, true), std(c, 0x0a1f12, { roughness: 1, side: THREE.DoubleSide })); core.position.y = H * 0.05 + H * 0.465; T.add(core);
  const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ map: needleTex(c), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.92, color: 0xb8d8b8, emissive: 0xffb070, emissiveMap: needleTex(c), emissiveIntensity: 0 });
  const list = [], tiers = Math.round(H / 0.42 * cards);
  for (let k = 0; k < tiers; k++) { const yy = H * 0.05 + (k / tiers) * H * 0.93, r0 = rad(yy), n = Math.max(5, Math.round(2 * PI * r0 / 0.62 * cards));
    for (let j = 0; j < n; j++) { const th = (j / n) * 2 * PI + k * 0.71 + Math.random() * 0.2; list.push([yy, th, r0 * (0.95 + Math.random() * 0.15), 0.28 + Math.random() * 0.2]); } }
  const im = new THREE.InstancedMesh(geo, mat, list.length * 2), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  list.forEach(([yy, th, L, droop], i) => {
    const w = Math.max(0.45, L * 0.5);
    for (let v = 0; v < 2; v++) { e.set(v ? 0 : -PI / 2, -th, -droop, 'YZX'); q.setFromEuler(e); s3.set(L, w, 1); p3.set(0, yy, 0); m4.compose(p3, q, s3); im.setMatrixAt(i * 2 + v, m4); }
  });
  im.frustumCulled = false; T.add(im);
  if (H > 20) { const nt = needleTex(c); nt.generateMipmaps = false; nt.minFilter = THREE.LinearFilter; nt.needsUpdate = true; mat.alphaTest = 0.25; }
  // the strands: eight helices, twenty six turns, base to top; ord is the distance along the helix, so they light in a spiral
  const pts = [], S = 8, N = c.MOBILE ? Math.round(lights * 0.4) : lights;
  for (let i = 0; i < N; i++) { const s = i % S, u = Math.floor(i / S) / (N / S), yy = H * 0.04 + u * H * 0.92, th = u * 26 * 2 * PI + s * 2 * PI / S + (Math.random() - 0.5) * 0.25, rr = rad(yy) * (0.86 + Math.random() * 0.2);
    pts.push([Math.cos(th) * rr, yy, Math.sin(th) * rr, u]); }
  const leds = ledPoints(c, T, pts, { size }); if (H > 20) leds.material.uniforms.uMinPx.value = 2.1;
  const out = { group: T, leds, mat, rad, H, R };
  if (star) {
    const parts = [], up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), SR = H * 0.06;
    for (let i = 0; i < 70; i++) { const yy = 1 - (i + 0.5) / 70 * 2, rr = Math.sqrt(1 - yy * yy), th = i * 2.39996; d.set(Math.cos(th) * rr, yy, Math.sin(th) * rr * 0.42).normalize();
      const L = SR * (0.62 + Math.random() * 0.38), cg = new THREE.ConeGeometry(SR * 0.075, L, 5).translate(0, L / 2, 0); cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d)); parts.push(cg); }
    parts.push(new THREE.IcosahedronGeometry(SR * 0.28, 1));
    const sg = mergeGeometries(parts.map((p) => p.toNonIndexed())); sg.computeVertexNormals();
    const sm = new THREE.MeshPhysicalMaterial({ color: 0xfff4dc, emissive: 0xfff0c8, emissiveIntensity: 0.04, metalness: 0.15, roughness: 0.06, iridescence: 1, iridescenceIOR: 1.6, envMapIntensity: 2.5 });
    const st = new THREE.Mesh(sg, sm); st.position.y = H + SR * 0.55; T.add(st);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,236,190,.85)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.scale.setScalar(SR * 5); glow.position.y = st.position.y; T.add(glow);
    const sp = []; for (let i = 0; i < 260; i++) { const th = Math.random() * 2 * PI, yy = (Math.random() - 0.5) * 2, rr = Math.sqrt(1 - yy * yy), L = SR * (0.2 + Math.random() * 0.8); sp.push([Math.cos(th) * rr * L, st.position.y + yy * L, Math.sin(th) * rr * L * 0.42, 0.999, [1, 0.97, 0.9]]); }
    const sparks = ledPoints(c, T, sp, { size: size * 0.9, gain: 3 });
    out.star = { st, sm, glow, sparks };
    c.tick((t) => { st.rotation.y = Math.sin(t * 0.25) * 0.25; });
  }
  // how lit the tree is, 0 to 1.04: the spiral passes the top at 1, the star takes the last few hundredths
  out.set = (v) => { leds.material.uniforms.uOn.value = v; mat.emissiveIntensity = Math.min(1, v) * 0.32; if (out.star) { const k = Math.max(0, Math.min(1, (v - 0.99) / 0.05)); out.star.sm.emissiveIntensity = 0.04 + k * 3.2; out.star.glow.material.opacity = k * 0.95; out.star.sparks.material.uniforms.uOn.value = k > 0.5 ? 1.01 : 0; } };
  out.set(0);
  return out;
}

// ---------- menorahs ----------
// lamps are numbered from the visitor's left. On night n the n rightmost carry oil; they are lit newest first, left to right,
// after the shamash. lit(n) returns that order.
const lightOrder = (n) => Array.from({ length: n }, (_, k) => 8 - n + k);
function lamp(c, g, x, y, z, { chimney = true, s = 1, metal } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.1 * s, 0.14 * s, 16), metal).translateY(0.07 * s));
  if (chimney) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.13 * s, 0.46 * s, 18, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, side: THREE.DoubleSide, depthWrite: false })); gl.position.y = 0.37 * s; o.add(gl); }
  const f = flameSprite(c, o, 0, 0.3 * s, 0, 0.3 * s);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.8 * s, 0.5 * s), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.35 * s; o.add(hit);
  // v2.1: a soft halo around each lit chimney, so the night's count reads from across the plaza (a bare 30 cm flame did not)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: FLAME.h ||= glowTex(c, 'rgba(255,190,110,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.75 }));
  halo.position.y = 0.36 * s; halo.scale.set(1.3 * s, 1.5 * s, 1); halo.visible = false; o.add(halo);
  const ph = Math.random() * 9; c.tick((t) => { if (halo.visible) halo.material.opacity = 0.62 + Math.sin(t * 7 + ph) * 0.06 + Math.sin(t * 13 + ph) * 0.04; });
  return { o, f, hit, set: (on) => { f.visible = on; halo.visible = on; } };
}
// Fifth Avenue's: a square stem, straight diagonal arms after the old drawing, lamps under glass chimneys
function menorahFifth(c, g, x, z, gold) {
  const { THREE } = c, M = new THREE.Group(); M.position.set(x, 0, z); g.add(M);
  const LY = 6.7, SP = 0.98;
  M.add(c.slab(8.8, 0.7, 2.4, std(c, 0x22242a, { roughness: 0.7 }), 0, 0.35, 0));
  M.add(c.slab(1.2, 0.5, 1.2, gold, 0, 0.95, 0)); M.add(c.slab(0.34, LY + 0.9 - 1.2, 0.34, gold, 0, 1.2 + (LY + 0.9 - 1.2) / 2, 0));
  for (const sx of [-1, 1]) for (let k = 1; k <= 4; k++) { const ax = sx * k * SP, y0 = LY - k * SP, L = Math.hypot(ax, LY - y0);
    const arm = c.slab(0.2, L, 0.2, gold, ax / 2, (y0 + LY) / 2, 0); arm.rotation.z = -Math.atan2(ax, LY - y0); M.add(arm); M.add(c.slab(0.24, 0.12, 0.24, gold, ax, LY - 0.05, 0)); }
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), std(c, 0x888888, { metalness: 0.8 })); r.position.set(-4.2 + i * 1.68, 1.25, 1.1); M.add(r); }
  M.add(c.slab(8.6, 0.06, 0.06, std(c, 0x888888, { metalness: 0.8 }), 0, 1.8, 1.1));
  const lamps = []; for (let i = 0; i < 8; i++) { const lx = (i < 4 ? -(4 - i) : i - 3) * SP; lamps.push(lamp(c, M, lx, LY, 0, { metal: gold })); }
  const sham = lamp(c, M, 0, LY + 0.9, 0, { metal: gold });
  // v5: the modelled menorah (Krea concept, Tripo H3.1) replaces the boxes; the code keeps only the flames, halos and hit boxes,
  // set into its chimneys. Its outer lamps span 94% of its width, so a 8.33 m model puts them on the old 0.98 m spacing.
  const glbM = c.glb('lt_menorah_m', { len: 8.33, parent: M, shadow: true, onload: (gg, sc) => {
    const b = new THREE.Box3().setFromObject(sc), top = b.max.y - M.position.y;
    M.children.forEach((ch) => { if (ch !== gg && ch.isMesh) ch.visible = false; });
    // the eight lamps sit 13% of the height below the top, the shamash 3% below it
    const ly = top * 0.835 - 0.3, sy = top * 0.955 - 0.3; [...lamps, sham].forEach((L, i) => { L.o.children.forEach((ch) => { if (ch.isMesh && ch !== L.hit) ch.visible = false; }); L.o.position.y = i < 8 ? ly : sy; });
    out.LY = ly; } });
  const out = { M, lamps, sham, LY, z, glb: glbM };
  return out;
}
// Brooklyn's: the other largest, round arms, lamps under glass
function menorahBrooklyn(c, g, x, z, gold) {
  const { THREE } = c, M = new THREE.Group(); M.position.set(x, 0, z); g.add(M);
  const LY = 6.9, SP = 0.95;
  M.add(c.slab(8.6, 0.6, 2.2, std(c, 0x2a2420, { roughness: 0.7 }), 0, 0.3, 0));
  M.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.8, 24), gold).translateY(1.0));
  M.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, LY + 0.8 - 1.4, 16), gold).translateY(1.4 + (LY + 0.8 - 1.4) / 2));
  for (let k = 1; k <= 4; k++) { const rr = k * SP, tor = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.11, 10, 48, PI), gold); tor.rotation.z = PI; tor.position.y = LY; M.add(tor); }
  const lamps = []; for (let i = 0; i < 8; i++) { const lx = (i < 4 ? -(4 - i) : i - 3) * SP; lamps.push(lamp(c, M, lx, LY, 0, { metal: gold })); }
  const sham = lamp(c, M, 0, LY + 0.8, 0, { metal: gold });
  // v5: the modelled curved menorah (Krea concept, Tripo H3.1); outer lamps span 92% of it, so 8.25 m keeps the 0.95 m spacing
  c.glb('lt_menorah_b', { len: 8.25, parent: M, shadow: true, onload: (gg, sc) => {
    const top = new THREE.Box3().setFromObject(sc).max.y - M.position.y;
    M.children.forEach((ch) => { if (ch !== gg && ch.isMesh) ch.visible = false; });
    [...lamps, sham].forEach((L, i) => { L.o.children.forEach((ch) => { if (ch.isMesh && ch !== L.hit) ch.visible = false; }); L.o.position.y = top * (i < 8 ? 0.8 : 0.93) - 0.3; /* the flame sits 0.3 m above its lamp group */ }); } });
  return { M, lamps, sham, LY, z };
}
// a night picker: TONIGHT, NIGHT n OF 8, with arrows either side
function nightPicker(c, g, X, x, y, z, ry, onPick) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const b = board(c, o, 1.9, 0.9, 256);
  const draw = () => { const { q, W: w, H: h } = b; q.fillStyle = '#10131c'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d6a640'; q.lineWidth = 6; q.strokeRect(6, 6, w - 12, h - 12);
    q.fillStyle = '#f4ead2'; q.textAlign = 'center'; q.font = `700 ${h * (LT.real ? 0.13 : 0.085)}px ${c.MONO}`; q.fillText(LT.real ? (LT.night === LT.real ? 'TONIGHT, BY THE CALENDAR' : 'TONIGHT IS NIGHT ' + LT.real) : LT.until ? `CHANUKAH IN ${LT.until} DAY${LT.until === 1 ? '' : 'S'} · PICK A NIGHT` : 'PICK TONIGHT', w / 2, h * 0.24);
    q.font = `900 ${h * 0.36}px ${c.SERIF}`; q.fillStyle = '#ffd27a'; q.fillText(`NIGHT ${LT.night}`, w / 2, h * 0.62);
    q.font = `700 ${h * 0.12}px ${c.MONO}`; q.fillStyle = '#9aa4c0'; q.fillText('<  CLICK THE ARROWS  >', w / 2, h * 0.86); b.up(); };
  draw(); LT.fans.push(draw);
  for (const sx of [-1, 1]) { const a = c.sign(sx < 0 ? '<' : '>', { w: 0.32, h: 0.5, bg: '#d6a640', fg: '#10131c', font: c.SERIF, weight: 900 }); a.position.set(sx * 1.2, 0, 0.01); o.add(a);
    c.clickable(a, () => { LT.night = Math.max(1, Math.min(8, LT.night + sx)); snd(c, 'click'); ltSave(); onPick && onPick(); }, sx < 0 ? 'One night earlier' : 'One night later'); }
  o.add(c.slab(0.08, y, 0.08, std(c, 0x222222), 0, -y / 2, -0.05)); c.post(X(x), z, 0.3);
  return o;
}

// ---------- the props per room (Poly Haven CC0 and the house models) ----------
const PROPS = {
  fifth: [['street_lamp_02', 1.4, -5.6, { h: 4.6, r: 0.3 }], ['street_lamp_02', 18.6, -5.6, { h: 4.6, r: 0.3 }], ['mailbox', 17.8, 2.2, { h: 1.25, r: 0.4, raw: true, ry: -PI / 2 }],
    ['nyb_barrier', 4.0, -6.6, { len: 1.55 }], ['nyb_barrier', 5.8, -6.6, { len: 1.55 }], ['nyb_barrier', 14.2, -6.6, { len: 1.55 }], ['nyb_barrier', 16.0, -6.6, { len: 1.55 }]],
  channel: [],
  rink: [['nyb_rink_gift_a', 1.4, -6.4, { h: 1.3, r: 0.7 }], ['nyb_rink_gift_b', 18.6, -6.4, { h: 1.5, r: 0.7 }]],
  tree: [['street_lamp_02', 1.4, 1.0, { h: 4.6, r: 0.3 }], ['street_lamp_02', 18.6, 1.0, { h: 4.6, r: 0.3 }]],
  top: [],
  menorah: [['street_lamp_01', 1.4, -5.6, { h: 4.4, r: 0.3 }], ['street_lamp_01', 18.6, 0.6, { h: 4.4, r: 0.3 }], ['painted_wooden_bench', 2.0, -1.4, { len: 1.8, ry: PI / 2, r: 0.8 }]],
  brooklyn: [['street_lamp_01', 1.4, -5.6, { h: 4.4, r: 0.3 }], ['street_lamp_01', 18.6, -5.6, { h: 4.4, r: 0.3 }], ['CoffeeCart_01', 17.2, -1.0, { len: 2.2, ry: -PI / 2, r: 1.1, egg: ['The latke cart', 'latkes', 'Latkes and jelly doughnuts at a menorah lighting: the miracle was oil, so the menu is fried. A rare holiday where the food is also the footnote.'] }]],
  window: [['wooden_bookshelf_worn', 19.2, -6.8, { h: 2.2, ry: -PI / 2, r: 0.6 }], ['sofa_02', 13.0, 2.2, { len: 2.1, ry: PI, r: 0.9 }], ['potted_plant_02', 18.8, -1.0, { h: 1.2, r: 0.3 }], ['electric_stove', 1.2, -7.0, { h: 0.95, ry: PI / 2, r: 0.6 }], ['WoodenTable_01', 6.0, -2.2, { len: 1.6, r: 0.9 }], ['WoodenChair_01', 5.2, -1.2, { h: 0.9, ry: PI * 0.9 }], ['WoodenChair_01', 6.8, -1.2, { h: 0.9, ry: PI * 1.1 }]],
  dyker: [['nutcracker', 2.2, -5.8, { h: 3.6, raw: true, ry: PI / 2, r: 0.6 }], ['nutcracker', 17.8, -5.8, { h: 3.6, raw: true, ry: -PI / 2, r: 0.6 }], ['nyb_big_soldier', 2.4, -1.4, { h: 2.4, ry: PI / 2, r: 0.5 }],
    ['garden_gnome', 17.6, -5.0, { h: 0.7, ry: -PI / 2 }], ['wooden_ladder', 18.4, -1.2, { h: 3.2, ry: -PI / 2, r: 0.4, egg: ['A ladder', 'ladder', 'Some households hire professional decorators. Holiday spirit has subcontractors, and the subcontractors have a waiting list.'] }]],
};
// the census New Yorkers hang where the room leaves room for them
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const south7 = (y = 2.1, w = 1.5) => Array.from({ length: 7 }, (_, i) => ({ x: 2.2 + i * 2.6, y, z: D / 2 - 0.14, ry: PI, w }));
const SLOTS = {
  channel: () => [...south7(), { x: 0.14, y: 2.4, z: 6.6, ry: PI / 2, w: 1.2 }, { x: W - 0.4, y: 2.4, z: 6.6, ry: -PI / 2, w: 1.2 }],
  rink: () => [...south7(2.6), ...[-6.4, -3.8, -1.2].map((z) => ({ x: 0.14, y: 2.8, z, ry: PI / 2, w: 1.4 })), ...[-3.8, -1.2].map((z) => ({ x: W - 0.4, y: 2.8, z, ry: -PI / 2, w: 1.4 }))],
  menorah: () => [...south7(), ...[-4.4, -2.0].map((z) => ({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }))],
  window: () => [...south7(1.8, 1.3), ...[-4.2, -1.8].map((z) => ({ x: 0.14, y: 1.8, z, ry: PI / 2, w: 1.2 })), ...[-4.2, -1.8].map((z) => ({ x: W - 0.4, y: 1.8, z, ry: -PI / 2, w: 1.2 }))],
  dyker: () => [...south7(2.4)],
  top: () => [...south7(2.0, 1.4), ...[-4.2, -1.8].map((z) => ({ x: 0.14, y: 2.0, z, ry: PI / 2, w: 1.3 })), ...[-4.2, -1.8].map((z) => ({ x: W - 0.4, y: 2.0, z, ry: -PI / 2, w: 1.3 }))],
};
const GOLD = (c) => std(c, 0xd8a83e, { metalness: 1, roughness: 0.22 });

// ---------- the rooms ----------
const ROOM = {
  // THE SHOW ACROSS THE STREET. Stand on the X and the facade plays; it resolves into one enormous eye flower only from there.
  fifth(c, r, g, X) {
    const { THREE } = c, U = plateFX(c, r);
    const xm = decal(c, 1.3, 1.3, (q, w, h) => { q.strokeStyle = '#ff6b00'; q.lineWidth = w * 0.13; q.lineCap = 'round'; q.beginPath(); q.moveTo(w * 0.18, h * 0.18); q.lineTo(w * 0.82, h * 0.82); q.moveTo(w * 0.82, h * 0.18); q.lineTo(w * 0.18, h * 0.82); q.stroke(); });
    xm.rotation.x = -PI / 2; xm.position.set(W / 2, 0.012, 0); g.add(xm);
    const lbl = decal(c, 1.6, 0.34, (q, w, h) => { q.fillStyle = '#ff6b00'; q.font = `700 ${h * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('"X"   STAND HERE', w / 2, h * 0.68); });
    lbl.rotation.x = -PI / 2; lbl.position.set(W / 2, 0.012, 1.0); g.add(lbl);
    const sign = notice(c, g, '"THE SHOW"\nEVERY TEN MINUTES, OR WHENEVER YOU STAND ON THE X', 18.6, 2.6, -4.4, -PI / 2, 2.0, 0.6); c.clickable(sign, () => c.egg('compass', 'The store is on the east side of the avenue and faces the gardens. Manhattan still expects you to know which way east is, at night, in December.'), 'A sign');
    let on = -1, told = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (on >= 0) { on = -1; } U.uShow.value = Math.max(0, U.uShow.value - dt); U.uFlower.value = 0; return; }
      const L = local(r, P), onX = Math.hypot(L.x - W / 2, L.z) < 0.7;
      if (onX && on < 0) { on = 0; snd(c, 'whoosh', 0.6, 3); c.music.level && c.music.level(1.3); if (!told) { told = true; c.toast('Do not move. The building is doing something.', 2600); } }
      if (on >= 0) { on += dt; U.uShow.value = Math.min(1, U.uShow.value + dt * 0.8);
        const fl = on > 14 && on < 24 ? Math.min(1, (on - 14) / 2) * Math.min(1, (24 - on) / 1.5) : 0; U.uFlower.value = fl * (onX ? 1 : 0.35);
        if (on > 16 && onX && !r.flowered) { r.flowered = true; c.flash(0.25); c.egg('show', 'From the X, and only from the X, the whole facade becomes one eye flower. The light show here has run most Decembers since 2004, and skipped 2024. Even electricity declined an invitation once.'); }
        if (on > 30) { on = -1; c.music.level && c.music.level(1); }
      } else U.uShow.value = Math.max(0, U.uShow.value - dt * 0.5);
    });
    // the shoppers, the barricades, the hot nut cart
    walkers(c, g, 10, { x1: 2.2, x2: 17.8, z1: 2.4, z2: 6.6, pool: 'night' });
    const cart = c.glb('ph_CoffeeCart_01', { len: 2.2, x: 2.6, z: 3.2, ry: 0.4, parent: g }); c.post(X(2.6), 3.2, 1.1);
    cardboard(c, g, 'NUTS 4 NUTS\nHOT', 2.6, 2.3, 3.2, 0.4, 0.8);
    c.clickable(cart, () => c.egg('nuts', 'Honey roasted nuts, smelt from a block away, eaten by nobody who intended to. The cart is the most successful light show on the avenue: it works by smell.'), 'A nut cart');
    const key = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), GOLD(c)); eggBox(c, g, X, key, 4.9, 0.95, -6.55, 'key', 'A brass key', 'The store opened here in 1924. The key predates your appointment window.');
    const mini = c.slab(0.4, 0.3, 0.12, std(c, 0x111114), 0, 0, 0); eggBox(c, g, X, mini, 15.1, 0.98, -6.55, 'dark', 'A small dark facade', 'A model of the facade with the show switched off: there was none in 2024. The building took a December off. The crowd came anyway.');
  },

  // THE CHANNEL GARDENS. Twelve wire angels. Each lifts its trumpet as you pass; the twelfth plays once all twelve have.
  channel(c, r, g, X) {
    const { THREE } = c;
    const granite = std(c, 0x8a8478, { roughness: 0.6 }), soil = std(c, 0x1e1812, { roughness: 1 }), water = std(c, 0x0a1830, { roughness: 0.04, metalness: 0.6 });
    const beds = [[-7.0, -3.6], [-2.8, 1.2]];
    const shrubG = new THREE.IcosahedronGeometry(0.34, 1).scale(1, 0.75, 1), shrubM = std(c, 0x163a22, { roughness: 0.9 }), poinG = new THREE.SphereGeometry(0.075, 8, 5).scale(1.4, 0.55, 1.4), poinW = std(c, 0xf4f0ea, { roughness: 0.8 }), poinR = std(c, 0xb0102a, { roughness: 0.8 });
    const shrubs = [], poins = [], twinkle = [];
    for (const [x1, x2] of [[7.0, 13.0]]) for (const [z1, z2] of beds) {   // round six: the beds run down the middle, as they do; you walk the sides
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, w = x2 - x1, d = z2 - z1;
      g.add(c.slab(w, 0.72, d, granite, cx, 0.36, cz)); g.add(c.slab(w - 0.3, 0.06, d - 0.3, soil, cx, 0.72, cz));
      c.wall(X(x1), z1, X(x2), z1); c.wall(X(x1), z2, X(x2), z2); c.wall(X(x1), z1, X(x1), z2); c.wall(X(x2), z1, X(x2), z2);
      const px = (x1 + x2) / 2; g.add(c.slab(1.6, 0.05, d - 1.0, water, px, 0.76, cz));
      for (let i = 0; i < 26; i++) { const sx = x1 + 0.3 + Math.random() * (w - 0.6), sz = z1 + 0.3 + Math.random() * (d - 0.6); if (Math.abs(sx - px) < 0.8) continue; shrubs.push([sx, sz, 0.45 + Math.random() * 0.4]); for (let k = 0; k < 6; k++) twinkle.push([sx + (Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.7, sz + (Math.random() - 0.5) * 0.5, Math.random() * 0.2, [1, 0.88, 0.6]]); }
      for (let i = 0; i < 40; i++) poins.push([x1 + 0.2 + Math.random() * (w - 0.4), z1 + 0.2 + Math.random() * (d - 0.4), Math.random() < 0.7]);
    }
    const m4 = new THREE.Matrix4(), sIm = new THREE.InstancedMesh(shrubG, shrubM, shrubs.length);
    shrubs.forEach(([x, z, h], i) => { m4.makeScale(1, h, 1).setPosition(x, 0.75 + h * 0.4, z); sIm.setMatrixAt(i, m4); }); g.add(sIm);
    for (const [col, want] of [[poinW, true], [poinR, false]]) { const list = poins.filter((p) => p[2] === want), im = new THREE.InstancedMesh(poinG, col, list.length); list.forEach(([x, z], i) => { m4.makeTranslation(x, 0.82, z); im.setMatrixAt(i, m4); }); g.add(im); }
    ledPoints(c, g, twinkle, { size: 0.07, gain: 1.6 }).material.uniforms.uOn.value = 1.1;
    // the angels: six a side on the inner edge of the beds, facing up the promenade to the tree
    const spots = [0.8, -0.6, -2.1, -4.1, -5.3, -6.5];
    const angels = [];
    for (const side of [-1, 1]) spots.forEach((z) => { const x = side < 0 ? 7.3 : 12.7;
      const o = new THREE.Group(); o.position.set(x, 0.74, z); g.add(o);
      const WA = wireAngel(c), m = WA.mesh; m.rotation.y = side < 0 ? 0.35 : -0.35; o.add(m);   // v4: a wire sculpture, not a Tripo blob
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98)), transparent: true })); head.scale.setScalar(0.42); head.position.set(0, 2.05, 0.02); o.add(head);
      const a = { o, m, x, z, on: false, side, leds: null }; angels.push(a);
      { const q = new THREE.Group(); q.rotation.y = m.rotation.y; o.add(q); a.leds = ledPoints(c, q, WA.pts, { size: 0.045, gain: 2.3 }); a.leds.material.uniforms.uOn.value = 0.08; }
      c.clickable(m, () => c.egg('feather', 'Twelve wire herald angels, each about eight feet tall, have lined these gardens since 1954. Their attendance record is difficult to challenge.'), 'A herald angel');
    });
    let n = 0, done = false; const scale = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 1568];
    const stream = []; for (let i = 0; i < 600; i++) stream.push([0, 0, 0, i / 600, [1, 0.9, 0.6]]);
    const st = ledPoints(c, g, stream, { size: 0.09, gain: 2.6 }); st.visible = false; const sp = st.geometry.attributes.position;
    let fly = -1;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P);
      angels.forEach((a) => {
        if (!a.on && L.z < a.z + 0.4 && L.z > a.z - 3) { a.on = true; n++; snd(c, 'note', scale[Math.min(11, n - 1)] / 2, 0.2); }
        const k = a.on ? 1 : 0; a.o.rotation.x += ((a.on ? -0.1 : 0.08) - a.o.rotation.x) * Math.min(1, dt * 3); a.o.position.y += ((a.on ? 0.84 : 0.74) - a.o.position.y) * Math.min(1, dt * 3);
        if (a.leds) { const u = a.leds.material.uniforms.uOn; u.value += ((k ? 1.1 : 0.08) - u.value) * Math.min(1, dt * 2); }
      });
      if (n === 12 && !done) { done = true; fly = 0; st.visible = true; snd(c, 'horn', 0.3); setTimeout(() => snd(c, 'horn', 0.3), 420); snd(c, 'chords', 8); c.flash(0.15);
        c.egg('herald', 'All twelve acknowledged you, so the twelfth plays. The angels have pointed their trumpets at the tree since 1954. Eleven introductions. One musician.'); }
      if (fly >= 0) { fly += dt; for (let i = 0; i < 600; i++) { const a = angels[i % 12], u = Math.min(1, Math.max(0, (fly * 0.35 - (i / 600) * 0.6))), wob = Math.sin(i * 7.1 + t * 3) * 0.4;
          sp.setXYZ(i, a.x + (10 - a.x) * u + wob * (1 - u), 3.1 + u * 19 + Math.sin(i) * 0.3, a.z + ((r.treeZ ?? -60) - a.z) * u + wob); }
        sp.needsUpdate = true; if (fly > 6) { fly = -1; st.visible = false; } }
    });
    walkers(c, g, 8, { x1: 7.4, x2: 12.6, z1: -6.2, z2: 6.4, pool: 'night' });
    const twin = c.slab(0.5, 0.4, 0.4, std(c, 0xc8c0b0, { roughness: 0.7 }), 0, 0, 0); eggBox(c, g, X, twin, 6.9, 0.2, 6.6, 'buildings', 'Two little buildings', 'The British and French buildings either side give the Channel Gardens their name: the channel between them. The crossing requires no passport.', 0.4);
    const tile = c.slab(0.5, 0.04, 0.5, std(c, 0x2a5a80, { roughness: 0.2, metalness: 0.4 }), 0, 0, 0); eggBox(c, g, X, tile, 13.1, 0.02, 6.6, 'pools', 'A pool tile', 'The gardens hold six pools. Midtown lets water sit down. Nobody else gets to.');
  },

  // THE RINK. The ice is a mirror, the walk becomes a glide, and the ice keeps your line until the resurfacer comes.
  rink(c, r, g, X) {
    const { THREE } = c;
    if (!c.MOBILE) { const ice = new Reflector(new THREE.PlaneGeometry(W - 0.3, D - 0.3), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x343a44 }); ice.rotation.x = -PI / 2; ice.position.set(W / 2, -0.002, 0); g.add(ice); }
    const iceT = c.canvasTex(1024, 1024, (q, w, h) => { q.fillStyle = 'rgba(235,242,250,.38)'; q.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { q.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.12})`; q.lineWidth = 0.6 + Math.random() * 1.6; q.beginPath(); const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, L = 40 + Math.random() * 260; q.arc(x, y, L, a, a + 0.4 + Math.random() * 0.8); q.stroke(); } });
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: iceT, transparent: true, roughness: c.MOBILE ? 0.1 : 0.35, metalness: c.MOBILE ? 0.4 : 0, color: c.MOBILE ? 0xd8e4f0 : 0xffffff, opacity: c.MOBILE ? 1 : 0.85, depthWrite: false }));
    frost.rotation.x = -PI / 2; frost.position.set(W / 2, 0.003, 0); frost.renderOrder = 1; g.add(frost);
    // the boards, white with a brass cap, west and east
    const board_ = std(c, 0xf2f2f0, { roughness: 0.5 }), cap = GOLD(c);
    for (const x of [0.55, W - 0.55]) for (const [z1, z2] of [[-7.6, 1.6], [6.0, 7.6]]) { g.add(c.slab(0.12, 1.05, z2 - z1, board_, x, 0.52, (z1 + z2) / 2)); g.add(c.slab(0.18, 0.06, z2 - z1, cap, x, 1.07, (z1 + z2) / 2)); c.wall(X(x), z1, X(x), z2); }
    // Prometheus over his fountain, at the head of the rink
    // the trail
    const N = 700, disc = new THREE.InstancedMesh(new THREE.CircleGeometry(0.11, 10).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), N);
    disc.frustumCulled = false; g.add(disc); const tr = [], m4 = new THREE.Matrix4(), col = new THREE.Color(); let head = 0, lx = 0, lz = 0, dist = 0, fig = false, gold = 0;
    for (let i = 0; i < N; i++) { tr.push({ x: 0, z: 0, age: 99, d: 0 }); m4.makeTranslation(0, -5, 0); disc.setMatrixAt(i, m4); disc.setColorAt(i, col.setRGB(0, 0, 0)); }
    // the cast on the ice: three who can, two who cannot, and the resurfacer
    const sk = [];
    [['lt_skater', 7.2, 4.4, 0.32, 0], ['lt_skater', 5.8, 3.2, 0.41, 2.1], ['lt_skater', 4.4, 2.2, 0.5, 4.0], ['lt_wobbler', 3.4, 1.6, 0.14, 1.0], ['lt_wobbler', 6.4, 3.8, 0.11, 3.6]].forEach(([nm, ax, az, w, ph], k) => {
      const o = new THREE.Group(); g.add(o); const m = c.glb(nm, { h: 1.75, parent: o }); const p = c.post(0, 0, 0.45); sk.push({ o, m, ax, az, w, ph, p, wob: nm === 'lt_wobbler', k });
      c.clickable(m, () => c.say(m, nm === 'lt_wobbler' ? ['First time. Also last time. Also, can you hold this.', 'I paid for ninety minutes. I have used eleven.', 'The wall is my friend. Where is the wall.'][k % 3] : ['Edges, not toes. Toes are for the sidewalk.', 'The rink opened as a temporary attraction. That was 1936.', 'Lean in. The ice can smell fear.'][k % 3], 3000, 2.1), 'A skater'); });
    const zam = new THREE.Group(); g.add(zam); const zm = c.glb('lt_zamboni', { len: 3.6, parent: zam }); const zp = c.post(0, 0, 1.3);
    c.clickable(zm, () => c.egg('zamboni', 'The resurfacer shaves the ice, washes it and lays down a film of warm water that freezes flat. It erases everything. Even you. Especially you.'), 'The resurfacer');
    const sk36 = new THREE.Group(); sk36.add(c.slab(0.12, 0.2, 0.32, std(c, 0x5a3a22, { roughness: 0.7 }), 0, 0.14, 0)); sk36.add(c.slab(0.02, 0.03, 0.38, std(c, 0xcccccc, { metalness: 1, roughness: 0.2 }), 0, 0.02, 0));
    eggBox(c, g, X, sk36, 18.2, 1.1, 4.0, 'skate', 'A rental skate', 'Stamped 1936: the rink opened that Christmas Day as a temporary attraction. New York has several definitions of temporary.');
    c.tick((t, dt, P, ri) => {
      sk.forEach((s) => { if (!s.go && s.m.userData.play) { s.m.userData.play('walk', s.wob ? 0.55 : 1.15); s.go = 1; } const a = t * s.w + s.ph, x = W / 2 + Math.cos(a) * s.ax, z = -0.5 + Math.sin(a) * s.az; s.o.position.set(x, 0, z); s.o.rotation.y = Math.atan2(-Math.sin(a) * s.ax, Math.cos(a) * s.az) + (s.wob ? 0 : (Math.sin(t * 0.4 + s.k) > 0.93 ? t * 9 : 0)); s.o.rotation.z = s.wob ? Math.sin(t * 5 + s.k) * 0.18 : 0; s.p.x = X(x); s.p.z = z; });
      const za = t * 0.08, zx = W / 2 + Math.cos(za) * 7.6, zz = -0.6 + Math.sin(za) * 5.6; zam.position.set(zx, 0, zz); zam.rotation.y = Math.atan2(-Math.sin(za) * 7.6, Math.cos(za) * 5.6); zp.x = X(zx); zp.z = zz;
      if (!here(r, ri)) return;
      const L = local(r, P), mv = Math.hypot(L.x - lx, L.z - lz);
      if (mv > 0.16) { dist += mv; lx = L.x; lz = L.z; head = (head + 1) % N; Object.assign(tr[head], { x: L.x, z: L.z, age: 0, d: dist });
        for (const q of tr) if (q.age < 30 && dist - q.d > 6 && Math.hypot(q.x - L.x, q.z - L.z) < 0.45) { if (!fig) { fig = true; c.egg('figure', 'You closed a loop. The ice keeps the figure in gold until the resurfacer comes. Finally, a paper trail worth keeping.'); snd(c, 'ding'); } gold = 2.5; break; } }
      if (gold > 0) gold -= dt;
      for (let i = 0; i < N; i++) { const q = tr[i]; q.age += dt; if (Math.hypot(q.x - zx, q.z - zz) < 1.5) q.age = 99; const k = Math.max(0, 1 - q.age / 28);
        m4.makeTranslation(q.x, k > 0 ? 0.008 : -5, q.z); disc.setMatrixAt(i, m4); disc.setColorAt(i, gold > 0 ? col.setRGB(1.6 * k, 1.1 * k, 0.3 * k) : col.setRGB(0.5 * k, 0.9 * k, 1.4 * k)); }
      disc.instanceMatrix.needsUpdate = true; disc.instanceColor.needsUpdate = true;
      if (dist > 160 && !r.long) { r.long = true; c.egg('laps', `A hundred and sixty metres of skating. The ice surface is about 122 by 59 feet; you have used most of it twice.`); }
    });
    c.tick((t, dt, P, ri) => { if (here(r, ri) && !r.toldIce) { r.toldIce = true; setTimeout(() => c.toast('Ice. You glide now. Let go to coast; it takes a while to stop.', 3200), 600); } });
  },

  // THE LIGHTING. Press the switch; the crowd counts with you; the strands come on in a spiral from the base; then the star.
  tree(c, r, g, X) {
    const { THREE } = c;
    const T = buildTree(c, g, { H: RP.TH, R: RP.TR, x: W / 2, y: r.treeY || 0, z: r.treeZ ?? -16.5, lights: 26000, size: 0.3 });   // round six: real size, real place
    // v2.1 (Astra round two): the lit tree read as a white cone; less gain per bulb keeps dark branches between the bands
    T.group.traverse((o) => { const u = o.material && o.material.uniforms; if (u && u.uGain && o.isPoints && o.geometry.attributes.position.count > 5000) u.uGain.value *= 0.75; });
    r.treeObj = T;
    // the ornaments: this year the real tree wears only lights; ours also wears New Yorkers
    const orn = new THREE.Group(); T.group.add(orn); const cast = r.cast.length ? r.cast : [];
    for (let i = 0; i < Math.min(24, cast.length * 2); i++) { const p = cast[i % cast.length], yy = 2.4 + (i / 24) * 18 + Math.random(), th = i * 2.39996 + 1.2, rr = T.rad(yy) + 0.08;
      const o = new THREE.Group(); o.position.set(Math.cos(th) * rr, yy, Math.sin(th) * rr); o.rotation.y = Math.atan2(Math.cos(th), Math.sin(th)); orn.add(o);
      const tx = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height; if (a > 1) { tt.repeat.set(1 / a, 1); tt.offset.set((1 - 1 / a) / 2, 0); } }); tx.colorSpace = THREE.SRGBColorSpace;
      const dm = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: 0.18, roughness: 0.35 });
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), dm); o.add(d); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 40), GOLD(c)); o.add(rim);
      o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), GOLD(c)).translateY(0.7));
      c.clickable(d, () => c.openPiece ? c.openPiece(p) : null, `${p.t}, an ornament`); o.userData.m = dm; }
    // the plaza dressing: barricades along the line, the switch on its podium, the countdown screen
    for (const i of [0, 1, 10, 11]) prop(c, r, g, X, 'nyb_barrier', 1.2 + i * 1.6, -6.85, { len: 1.55 });   // v4: four, not twelve
    { const brass = std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), rope = std(c, 0x6a0f14, { roughness: 0.7 }); for (let i = 0; i < 9; i++) { const x = 4.4 + i * 1.4; g.add(c.slab(0.07, 0.95, 0.07, brass, x, 0.47, -6.85)); g.add(c.slab(0.16, 0.05, 0.16, brass, x, 0.97, -6.85)); if (i < 8) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.9, -6.85), new THREE.Vector3(x + 0.7, 0.72, -6.85), new THREE.Vector3(x + 1.4, 0.9, -6.85)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 12, 0.025, 6), rope)); } } c.wall(X(4.4), -6.85, X(15.6), -6.85); }
    const pod = new THREE.Group(); pod.position.set(15.6, 0, -5.2); g.add(pod); pod.add(c.slab(1.0, 1.1, 0.7, std(c, 0x15161c, { roughness: 0.5 }), 0, 0.55, 0)); c.post(X(15.6), -5.2, 0.6);
    const sw = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 24), std(c, 0xc8102e, { roughness: 0.35, emissive: 0x400000 })); sw.position.y = 1.17; pod.add(sw);
    const plq = c.sign('"THE SWITCH"', { w: 0.9, h: 0.2, bg: '#15161c', fg: '#f5c542', font: c.MONO, weight: 700 }); plq.position.set(0, 0.85, 0.36); pod.add(plq);
    const scr = board(c, g, 4.8, 2.7, 512); scr.m.position.set(0.3, 6.4, -3.6); scr.m.rotation.y = PI / 2; g.add(c.slab(0.12, 2.9, 5.0, std(c, 0x111111), 0.2, 6.4, -3.6));
    const show = (big, small) => { const { q, W: w, H: h } = scr; q.fillStyle = '#06070c'; q.fillRect(0, 0, w, h); q.textAlign = 'center'; q.fillStyle = '#f5c542'; q.font = `900 ${h * (big.length > 3 ? 0.24 : 0.6)}px ${c.SERIF}`; q.fillText(big, w / 2, h * (big.length > 3 ? 0.52 : 0.66)); q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.075}px ${c.MONO}`; q.fillText(small, w / 2, h * 0.88); scr.up(); };
    show('THE LIGHTING', 'PRESS THE SWITCH ON THE PODIUM');
    const crowd = [];
    for (let i = 0; i < 16; i++) { const side = i % 2, x = side ? 16.2 + (i % 4) * 0.8 : 1.4 + (i % 4) * 0.8, z = -6.0 + Math.floor(i / 4) * 0.9 + Math.sin(i) * 0.2; if (side && x > 15 && z < -4.4) continue; const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a][i % 4], ry: Math.atan2(W / 2 - x, -16 - z) + PI }); c.post(X(x), z, 0.3); crowd.push(e); }
    walkers(c, g, 8, { x1: 3, x2: 17, z1: 2.4, z2: 6.8, pool: 'night' });
    let st = LT.tree ? 'lit' : 'dark', k = 0, v = LT.tree ? 1.04 : 0;
    const go = () => {
      if (st === 'dark') { st = 'count'; k = 0; c.toast('The crowd counts with you.', 2000); sw.position.y = 1.13; }
      else if (st === 'lit') { st = 'off'; c.toast('Lights out. It goes dark every year at the end. You may light it again.', 3200); show('GOOD NIGHT', 'PRESS THE SWITCH TO LIGHT IT AGAIN'); }
    };
    c.clickable(sw, go, 'The switch'); c.clickable(pod, go, 'The switch');
    // v2.1 effect: a vertigo push as the star ignites. r.fov is the engine's dolly zoom hook (it pulls the camera back as the lens
    // widens), so the tree holds its size while the plaza rushes away behind it, then settles
    r.vert = -1; const F0 = c.MOBILE ? 72 : 66, vfov = () => F0 + Math.sin(Math.min(1, r.vert / 3.2) * PI) * 12;
    c.tick((t, dt) => { if (r.vert >= 0) { r.fov = vfov; r.vert += dt; if (r.vert > 3.2) { r.vert = -1; r.fov = null; } } });
    c.tick((t, dt, P, ri) => {
      if (st === 'count') { const n0 = Math.ceil(5 - k); k += dt; const n1 = Math.ceil(5 - k);
        if (n1 !== n0 || k === dt) { if (n1 > 0) { show(String(n1), 'EVERYBODY'); snd(c, 'beep', 660, 0.12, 0.25, 'sine'); crowd.forEach((e, j) => { if ((j + n1) % 3 === 0) c.say(e, String(n1), 900, 2.2); }); } }
        if (k >= 5) { st = 'up'; k = 0; show('LIT', 'FIFTY THOUSAND BULBS, FIVE MILES OF WIRE'); snd(c, 'whoosh', 0.9, 6); sw.position.y = 1.17; } }
      else if (st === 'up') { k += dt; v = Math.min(1.04, ease(Math.min(1, k / 7)) * 1.04); if (k > 6.6 && !r.starred) { r.starred = true; c.flash(0.35); r.vert = 0; [[0, 20, 6, 0xffd060], [16, 22, 4, 0x2962ff], [10, 27, -2, 0xffffff], [3, 24, 2, 0xff4fa3], [18, 19, 7, 0xffd060], [10, 31, -4, 0x7ad8ff]].forEach(([fx, fy, fz, fc], j) => setTimeout(() => { burst(c, g, fx, fy, (r.treeZ ?? -16.5) + fz, fc, 160); snd(c, 'thud', 0.5); }, 2200 + j * 420)); snd(c, 'applause', 6); snd(c, 'chords', 10); r.snowBoost = 2.2; setTimeout(() => { r.snowBoost = 1; }, 9000); }
        if (k >= 7.2) { st = 'lit'; r.starred = false; LT.tree = true; ltSave(); c.egg('lit', 'Construction workers pooled their money for a tree here in 1931; the first official lighting followed in 1933. You held, it happened. Upstairs, seventy floors up, it is lit now too.'); } }
      else if (st === 'off') { v = Math.max(0, v - dt * 0.7); if (v <= 0) { st = 'dark'; LT.tree = false; ltSave(); } }
      T.set(v); orn.children.forEach((o) => { if (o.userData.m) o.userData.m.emissiveIntensity = 0.18 + Math.min(1, v) * 0.4; });
      // v2: the plaza answers the tree. The countdown takes the storefronts, bulbs and lamps down nearly to dark (safety
      // light stays), then everything warms up with the spiral and ends brighter than it began
      const want = st === 'count' ? 0.12 : 0.4 + Math.min(1, v) * 0.75; r._dl = r._dl ?? want; r._dl += (want - r._dl) * Math.min(1, dt * (st === 'count' ? 1.6 : 0.9)); r.dressLevel && r.dressLevel(r._dl);
    });
    const env = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), std(c, 0xd8c8a0, { roughness: 0.9 })); env.rotation.x = -0.4; eggBox(c, g, X, env, 7.6, 1.0, -6.8, 'envelope', 'A pay envelope', 'In 1931 the workers on the Rockefeller Center site pooled their wages for a twenty foot tree. The original crowdfunding had colder hands.');
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 24), std(c, 0x2a5a2a, { roughness: 0.6 })); spool.rotation.z = PI / 2; eggBox(c, g, X, spool, 18.4, 0.4, -2.4, 'spool', 'A spool of wire', 'More than fifty thousand LEDs on about five miles of wire. Someone still has to find the end.', 0.5);
    const plank = c.slab(1.2, 0.08, 0.3, std(c, 0xc8a070, { roughness: 0.8 }), 0, 0, 0); eggBox(c, g, X, plank, 2.2, 0.06, 6.6, 'lumber', 'A plank of spruce', 'Since 2007 the tree has been milled into lumber for homes. Its next room has better insulation.');
    const starInfo = notice(c, g, 'THE STAR · 2018\n70 SPIKES · ABOUT 3 MILLION CRYSTALS · ABOUT 900 LB', 1.8, 2.4, -6.75, 0, 2.6, 0.5); c.clickable(starInfo, () => c.egg('star', 'The star since 2018: seventy spikes, about three million crystals, nine feet four inches across, about nine hundred pounds. It is lifted up by crane. The crane gets no credit.'), 'A plaque');
  },

  // SEVENTY FLOORS UP. A model of the plaza, the tree you lit downstairs in it, and coin binoculars that make it life size.
  top(c, r, g, X) {
    const { THREE } = c;
    g.add(c.slab(PORTAL.w, 1.1, 0.3, std(c, 0x6a6a70, { roughness: 0.8 }), W / 2, 0.55, -D / 2 + 0.1));
    const glass = new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.1, roughness: 0.03, metalness: 0.9, depthWrite: false });
    for (let i = 0; i < 10; i++) g.add(c.slab(1.96, 1.5, 0.03, glass, 1 + i * 2, 1.85, -D / 2 + 0.12));
    // the model, at about 1 to 60
    const tbl = new THREE.Group(); tbl.position.set(W / 2, 0, -2.6); g.add(tbl);
    tbl.add(c.slab(4.6, 0.95, 3.0, std(c, 0x2a1e16, { roughness: 0.5 }), 0, 0.475, 0)); c.wall(X(W / 2 - 2.3), -4.1, X(W / 2 + 2.3), -4.1); c.wall(X(W / 2 - 2.3), -1.1, X(W / 2 + 2.3), -1.1); c.wall(X(W / 2 - 2.3), -4.1, X(W / 2 - 2.3), -1.1); c.wall(X(W / 2 + 2.3), -4.1, X(W / 2 + 2.3), -1.1);
    { const pv = c.surf('acg_pavingstones128', 0.06, 0x4e4a46).clone(); pv.roughness = 1; pv.metalness = 0; pv.envMapIntensity = 0.12; tbl.add(c.slab(4.4, 0.02, 2.8, pv, 0, 0.96, 0, 0.06)); }   // matte: at a tiny eye height the paving is seen at a grazing angle, where it mirrored the sky   // v4: paved at 1:40, so the tiny visitor stands on a street
    const win = c.canvasTex(64, 256, (q, w, h) => { q.fillStyle = '#c8bca8'; q.fillRect(0, 0, w, h); for (let y = 2; y < h; y += 4) for (let x = 2; x < w; x += 4) { q.fillStyle = Math.random() < 0.6 ? '#ffe2a0' : '#2a2a30'; q.fillRect(x, y, 2, 2); } });
    const twr = new THREE.MeshStandardMaterial({ map: win, emissiveMap: win, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.8 });
    // v2.1: the towers wear the generated upper storeys (their windows glow), stepped back like the real setbacks, under glass
    const twr2 = (window.WALLS || []).includes('upper_stone') ? facadeMat(c, 'assets/walls/upper_stone.jpg', [0.6, 2.2], [0, 0], 0.55) : twr; if (twr2.userData) { twr2.emissiveIntensity = 0.6; twr2.userData.e0 = 0.6; } twr2.map && (twr2.map.wrapS = twr2.map.wrapT = THREE.RepeatWrapping);
    [[1.4, 4.3, 0.42], [1.7, 3.6, 0.6], [2.0, 2.4, 0.8], [1.1, 4.7, 0.3]].forEach(([w, h, d]) => tbl.add(c.slab(w, h, d, twr2, -0.4, 0.96 + h / 2, -1.0)));
    [[-1.7, 1.2, 0.9, 1.6], [1.45, 1.4, 0.8, 1.9]].forEach(([x, w, d, h]) => tbl.add(c.slab(w, h, d, twr2, x, 0.96 + h / 2, -0.9)));
    // v4 (Astra: "prove the miniature scale"): a quarter on its edge and a paper coffee cup, real size, on the table;
    // at one fortieth they are a metre wide and three storeys tall
    { const q = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.0018, 32), std(c, 0xc8c8cc, { metalness: 1, roughness: 0.28 })); q.rotation.set(PI / 2, 0, 0.5); q.position.set(0.62, 0.972, 0.2); tbl.add(q);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.034, 0.12, 28), std(c, 0xf2ece0, { roughness: 0.7 })); cup.position.set(-0.85, 1.03, -0.25); tbl.add(cup);
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.0462, 0.0405, 0.05, 28, 1, true), std(c, 0x7a5232, { roughness: 0.9 })); sl.position.set(-0.85, 1.03, -0.25); tbl.add(sl);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.01, 28), std(c, 0x111111, { roughness: 0.5 })); lid.position.set(-0.85, 1.095, -0.25); tbl.add(lid);
      const lb = c.sign('N3W', { w: 0.05, h: 0.02, bg: '#0d1b4a', fg: '#f2ebdd', font: c.SERIF, weight: 900 }); lb.position.set(-0.85, 1.03, -0.205); tbl.add(lb); }
    const vit = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.1, 2.9), new THREE.MeshStandardMaterial({ color: 0xdfeaff, roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.1, depthWrite: false }));   // plain glass: a transmission box hid the towers
    vit.position.set(0, 0.9 + 2.55, 0); tbl.add(vit);   // its bottom face sat on the table and glared white from a tiny visitor's eye
    const here_ = c.sign('YOU ARE HERE  v', { w: 1.2, h: 0.24, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 800 }); here_.position.set(-0.4, 0.96 + 4.3 + 0.3, -0.75); tbl.add(here_);
    tbl.add(c.slab(0.9, 0.012, 0.5, std(c, 0xeef4ff, { roughness: 0.1, metalness: 0.3 }), 0.2, 0.97, 0.75));
    tbl.add(c.slab(0.12, 0.08, 0.06, GOLD(c), 0.2, 1.01, 0.48));
    const mini = buildTree(c, tbl, { H: 0.42, R: 0.11, x: 0.2, y: 0.96, z: 0.12, lights: 1600, size: 0.012, cards: 0.6 });
    const tiny = []; for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, rr = 0.35 + Math.random() * 0.5; tiny.push([0.2 + Math.cos(a) * rr * 1.6, 0.975, 0.3 + Math.sin(a) * rr * 0.6, 1, [1, 0.6, 0.8]]); }
    ledPoints(c, tbl, tiny, { size: 0.01, gain: 0.8 }).material.uniforms.uOn.value = 1.1;
    let mv = 0; LT.fans.push(() => {});
    r.replay = -1;   // v3 (Astra's "the snow globe remembers the city"): a shake replays the model tree's spiral, then it returns to the real tree's state
    c.tick((t, dt) => { if (r.replay >= 0) { r.replay += dt; mv = r.replay < 1 ? Math.max(0, 1 - r.replay) * mv : Math.min(1.04, (r.replay - 1) / 4 * 1.04); if (r.replay > 6) r.replay = -1; } else mv += ((LT.tree ? 1.04 : 0) - mv) * Math.min(1, dt * 1.5); mini.set(mv); });
    const lbl = notice(c, g, 'THE PLAZA · 1 TO 60\nTHE TREE IS LIT WHEN YOU LIT IT', W / 2, 1.2, -1.08, 0, 2.2, 0.36); c.clickable(lbl, () => c.egg('model', 'A model of the plaza seventy floors below. The tree in it follows the real one downstairs: switch it on there and it is on here.'), 'The model');
    // the coin binoculars
    const vw = new THREE.Group(); vw.position.set(W / 2 + 0.2, 0, 0.4); g.add(vw); c.post(X(W / 2 + 0.2), 0.4, 0.35);
    vw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.15, 16), std(c, 0x2c5a3a, { metalness: 0.6, roughness: 0.4 })).translateY(0.58));
    const hd = new THREE.Group(); hd.position.y = 1.32; hd.rotation.x = -0.35; vw.add(hd);
    hd.add(c.slab(0.5, 0.32, 0.42, std(c, 0x2c5a3a, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0));
    for (const sx of [-0.11, 0.11]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 16), std(c, 0x111111)); e.rotation.x = PI / 2; e.position.set(sx, 0.02, 0.26); hd.add(e); const lz = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), std(c, 0x111111)); lz.rotation.x = PI / 2; lz.position.set(sx, 0.02, -0.24); hd.add(lz); }
    const coin = c.sign('25¢', { w: 0.16, h: 0.1, bg: '#c8a040', fg: '#111', font: c.MONO }); coin.position.set(0.18, 0.05, 0.215); hd.add(coin);
    const look = () => { const P = c.P; P.x = X(W / 2 + 0.2); P.z = 1.05; const dx = X(W / 2 + 0.2) - P.x, tz = -2.48 - P.z, ty = 0.96 + 0.24 - (1.62);
      P.yaw = Math.atan2(-(X(W / 2 + 0.2) - P.x), -tz); P.pitch = Math.atan2(ty, Math.hypot(dx, tz)); c.zoom(true);
      if (LT.tree) c.egg('viewer', 'The tree you lit downstairs, life size through a quarter. Same tree. Different rent.'); else c.toast('It is dark down there. Somebody downstairs has not pressed the switch. That somebody is you.', 3600); };
    c.clickable(hd, look, 'Coin binoculars'); c.clickable(vw, look, 'Coin binoculars');
    const tk = c.slab(0.24, 0.01, 0.12, std(c, 0xf4ead2), 0, 0, 0); eggBox(c, g, X, tk, 3.0, 1.12, -D / 2 + 0.2, 'ticket', 'A ticket', 'Dated 1933, the year the deck first opened. The view has acquired neighbours.');
    const tabs = notice(c, g, '67 · 69 · 70', 18.0, 1.6, -D / 2 + 0.3, 0, 1.2, 0.3, '#111', '#f5c542'); c.clickable(tabs, () => c.egg('floors', 'Three observation levels, on the 67th, 69th and 70th floors, about 850 feet up. Apparently one upstairs was insufficient.'), 'Floor tabs');
    const cal = notice(c, g, 'CLOSED 1986\nREOPENED 2005', 1.9, 1.7, 3.2, PI / 2, 1.0, 0.5); c.clickable(cal, () => c.egg('reopened', 'The deck closed in 1986 and reopened in 2005. A substantial coffee break.'), 'A calendar');
    walkers(c, g, 5, { x1: 2.5, x2: 17.5, z1: 2.4, z2: 6.6, pool: 'dressy' });
  },

  // FIFTH AND FIFTY NINTH. Pick tonight, step into the bucket, ride up, light the shamash, then the lamps, newest first.
  menorah(c, r, g, X) {
    const { THREE } = c, gold = GOLD(c);
    const M = menorahFifth(c, g, W / 2, -7.7, gold);
    const show = () => { const n = LT.night, done = LT.lit[n]; M.sham.set(!!done); M.lamps.forEach((l, i) => l.set(!!done && i >= 8 - n)); };
    show(); LT.fans.push(() => { if (!r.up) show(); });
    nightPicker(c, g, X, 4.0, 1.6, -5.6, 0.25, () => { if (!r.up) show(); });
    // the lift: a utility bucket on a boom; it carries you along the lamps
    const base = new THREE.Group(); base.position.set(W / 2, 0, -5.8); g.add(base);
    base.add(c.slab(1.6, 0.7, 1.2, std(c, 0x2a2c30, { roughness: 0.5, metalness: 0.4 }), 0, 0.35, 0)); { const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 24), std(c, 0xe8e2d0, { roughness: 0.4 })); tur.position.y = 0.85; base.add(tur); } base.add(c.slab(1.62, 0.06, 1.22, std(c, 0xff6b00), 0, 0.7, 0));
    const boom = c.slab(0.3, 1, 0.3, std(c, 0xf2f2f0, { roughness: 0.4 }), 0, 0, 0); base.add(boom);
    // v4 (Astra round four: "unfinished primitives"): a fibreglass utility bucket, rounded, with a rim, a rail and a door
    const bucket = new THREE.Group(); base.add(bucket); const fib = std(c, 0xe8e2d0, { roughness: 0.35, metalness: 0.05 }), blk = std(c, 0x1a1a1a, { roughness: 0.6 });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.44, 1.05, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.35, side: THREE.DoubleSide })); shell.position.y = -0.52; bucket.add(shell);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.44, 28), blk); floor.rotation.x = -PI / 2; floor.position.y = -1.04; bucket.add(floor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 8, 32), blk); rim.rotation.x = PI / 2; bucket.add(rim);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 6, 32), std(c, 0xc8c8c8, { metalness: 0.9, roughness: 0.3 })); rail.rotation.x = PI / 2; rail.position.y = 0.32; bucket.add(rail);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; bucket.add(c.slab(0.025, 0.32, 0.025, std(c, 0xc8c8c8, { metalness: 0.9 }), Math.cos(a) * 0.5, 0.16, Math.sin(a) * 0.5)); }
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.525, 0.505, 0.1, 28, 1, true), std(c, 0xff6b00, { roughness: 0.5 })); stripe.position.y = -0.25; bucket.add(stripe);
    const lbl = c.sign('N3W YORKERS · LIGHTING CREW', { w: 0.7, h: 0.11, bg: '#0d1b4a', fg: '#f2ebdd', font: c.MONO, weight: 800 }); lbl.position.set(0, -0.55, 0.53); bucket.add(lbl);
    c.post(X(W / 2), -5.8, 0.9);
    let UPY = M.LY - 0.75;   // bucket floor, so the lamps are at chest height (follows the model's lamps once it loads)
    c.tick(() => { UPY = M.LY - 0.75; });
    const B = { y: 1.8, x: W / 2 }; const layout = () => { bucket.position.set(B.x - W / 2, B.y, 0.4); const hh = Math.max(0.2, B.y - 1.8); boom.scale.y = Math.max(0.05, hh + 0.1); boom.position.set((B.x - W / 2) / 2, 0.8 + hh / 2, 0.2); boom.rotation.z = -Math.atan2(B.x - W / 2, Math.max(0.3, hh)); boom.scale.y = Math.max(0.05, Math.hypot(B.x - W / 2, hh)); }; layout();
    let order = [], step = 0, n = LT.night;
    const up = () => {
      if (r.up) return; n = LT.night; r.up = true; order = ['s', ...lightOrder(n)]; step = 0; M.sham.set(false); M.lamps.forEach((l) => l.set(false));
      const P = c.P, cur = new THREE.CatmullRomCurve3([new THREE.Vector3(P.x, c.EYE, P.z), new THREE.Vector3(X(W / 2), c.EYE + 1.2, -5.4), new THREE.Vector3(X(W / 2), UPY + c.EYE, -5.4)]);
      c.toast(`Night ${n}. Up you go. The shamash first, the one in the middle, on top.`, 3600);
      c.ride(cur, 4, () => { r.holdLift = true; c.P.lift = UPY; c.P.speed = 0; B.target = W / 2; });
    };
    const down = (why) => { if (!r.up) return; r.holdLift = false; c.P.speed = 1; const P = c.P;
      const cur = new THREE.CatmullRomCurve3([new THREE.Vector3(P.x, P.y, P.z), new THREE.Vector3(X(W / 2), c.EYE + 2, -4.4), new THREE.Vector3(X(W / 2), c.EYE, -3.4)]);
      c.ride(cur, 3.4, () => { r.up = false; show(); }); if (why) c.toast(why, 3600); };
    c.clickable(bucket, () => (r.up ? down('Down you come.') : up()), 'Ride the bucket'); c.clickable(base, () => (r.up ? null : up()), 'Ride the bucket');
    const touch = (i) => {
      if (!r.up) { if (i === 's') c.egg('shamash', 'The shamash, the helper: it serves the other eight lights and sits apart. Management, but useful.'); else c.toast('Too high to reach from here. The bucket is behind you.', 2400); return; }
      const want = order[step];
      if (i === want) { (i === 's' ? M.sham : M.lamps[i]).set(true); snd(c, 'clink', 2200); B.target = i === 's' ? W / 2 : W / 2 + M.lamps[i].o.position.x; step++;
        if (step === order.length) { LT.lit[n] = true; LT.night = n; ltSave(); c.flash(0.2); snd(c, 'chords', 6); c.music.level && c.music.level(1.35); setTimeout(() => c.music.level && c.music.level(1), 8000);
          c.egg('menorah', `Night ${n}, lit from the bucket: shamash first, then newest first. Thirty two feet, about four thousand pounds, oil under glass chimneys against the Fifth Avenue wind. Lit here since 1977.`); setTimeout(() => down(), 3800); }
        else if (step === 1) c.toast(`Now the lamps, newest first: start with the leftmost of tonight's ${n}.`, 3000); }
      else if (i !== 's' && i < 8 - n) c.toast('Not tonight. That one is for later in the week.', 2200);
      else c.toast(step === 0 ? 'The shamash first. It lights the others.' : 'Newest first: the leftmost of tonight’s lamps that is still dark.', 2600);
    };
    c.clickable(M.sham.hit, () => touch('s'), 'The shamash'); M.lamps.forEach((l, i) => c.clickable(l.hit, () => touch(i), `Lamp ${i + 1}`));
    c.tick((t, dt, P, ri) => {
      if (r.up && !P.ride) { P.lift = UPY; P.speed = 0; if (B.target != null) { const tx = X(B.target); P.x += (tx - P.x) * Math.min(1, dt * 1.6); } P.z += (-5.4 - P.z) * Math.min(1, dt * 2); B.x = P.x - r.x0; B.y = P.y - c.EYE * P.scale + 1.0; }
      else if (P.ride && here(r, ri)) { B.x = P.x - r.x0; B.y = Math.max(1.8, P.y - c.EYE + 1.0); }
      else { B.x += (W / 2 - B.x) * Math.min(1, dt * 2); B.y += (1.8 - B.y) * Math.min(1, dt * 2); }
      if (r.up && !here(r, ri)) { r.up = false; r.holdLift = false; P.speed = 1; P.lift = 0; }
      layout();
    });
    // the truck, its crew, and the eggs
    const truck = c.glb('lt_truck', { len: 7.4, x: 17.0, z: -3.2, ry: 0, parent: g }); c.post(X(17.0), -4.6, 1.6); c.post(X(17.0), -1.8, 1.6);
    c.clickable(truck, () => c.egg('truck', 'The lamps are lit each night from a utility bucket. On Friday the lighting comes before sunset; on Saturday it waits until Shabbat is out.'), 'The utility truck');
    cast(c, r, g, X, 'lt_lineman', 14.6, -5.0, { h: 1.8, ry: -0.6, r: 0.4, line: 'Lamps, not candles. The glass is for the wind off the park. Shamash first, then newest first. I will be down here holding the clipboard.', egg: 'lineman', hint: 'The lineman' });
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.46, 18, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.04, side: THREE.DoubleSide }));
    g.add(c.slab(0.6, 0.5, 0.5, std(c, 0x6a4a2a, { roughness: 0.8 }), 6.0, 0.25, -5.2)); eggBox(c, g, X, chim, 6.0, 0.73, -5.2, 'chimney', 'A spare chimney', 'Glass shields the flame from wind. Fifth Avenue still gets a vote.', 0.4);
    const card = notice(c, g, '25 KISLEV', 1.6, 1.8, 3.2, PI / 2, 0.9, 0.3); c.clickable(card, () => c.egg('kislev', 'Chanukah begins on the 25th of Kislev; the Gregorian date moves. This year the first light is the evening of December 4th. December does not own the booking.'), 'A calendar card');
    walkers(c, g, 8, { x1: 2.4, x2: 13.6, z1: 1.8, z2: 6.8, pool: 'walkers' });
  },

  // THE OTHER LARGEST. Brooklyn lit the same night you did. Measure either menorah and they always tie. Spin the dreidel.
  brooklyn(c, r, g, X) {
    const { THREE } = c, gold = std(c, 0xcaa23a, { metalness: 1, roughness: 0.3 });
    const M = menorahBrooklyn(c, g, W / 2, -7.6, gold);
    const show = () => { const n = LT.night; M.sham.set(true); M.lamps.forEach((l, i) => l.set(i >= 8 - n)); }; show(); LT.fans.push(show);
    nightPicker(c, g, X, 15.8, 1.6, -5.6, -0.25, show);
    // the tape
    const tapeH = new THREE.Group(); tapeH.position.set(4.4, 0, -5.4); g.add(tapeH); c.post(X(4.4), -5.4, 0.5);
    tapeH.add(c.slab(0.8, 0.8, 0.36, std(c, 0xf5c518, { roughness: 0.4 }), 0, 0.4, 0)); tapeH.add(c.slab(0.5, 0.5, 0.38, std(c, 0x111111), 0, 0.42, 0));
    const ticks = c.canvasTex(64, 2048, (q, w, h) => { q.fillStyle = '#f5d000'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; for (let i = 0; i <= 40; i++) { const y = h - i / 40 * h; q.fillRect(0, y - 2, i % 4 ? 18 : 40, 4); if (i % 4 === 0) { q.font = '700 22px monospace'; q.fillText(String(i), 34, y - 6); } } });
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1), new THREE.MeshStandardMaterial({ map: ticks, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); blade.geometry.translate(0, 0.5, 0); blade.position.set(0, 0.8, 0.2); tapeH.add(blade);
    const read = board(c, g, 3.4, 0.9, 256); read.m.position.set(4.4, 3.2, -5.2); read.m.visible = false;
    const say = (a, b, red) => { const { q, W: w, H: h } = read; q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w, h); q.textAlign = 'center'; q.fillStyle = red ? '#ff4040' : '#f5d000'; q.font = `900 ${h * 0.38}px ${c.SERIF}`; q.fillText(a, w / 2, h * 0.48); q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.14}px ${c.MONO}`; q.fillText(b, w / 2, h * 0.82); read.up(); read.m.visible = true; };
    let tape = { v: 0, to: 0, k: 0 };
    c.clickable(tapeH, () => { snd(c, 'tick'); tape.k = (tape.k % 3) + 1;
      if (tape.k === 1) { tape.to = M.LY + 1.4; tapeH.rotation.y = 0; setTimeout(() => { say('32 FT', 'BROOKLYN. COMMONLY REPORTED. ABOUT 5,000 LB, LESS SURELY.'); c.egg('tape', 'Brooklyn’s menorah has stood here since 1985 and is commonly reported at thirty two feet. Measure it and that is what you get.'); }, 1500); }
      else if (tape.k === 2) { tape.to = M.LY + 1.4; setTimeout(() => { say('TIE', 'MANHATTAN 32 FT · BROOKLYN 32 FT · MEASUREMENT DISPUTED', true); c.egg('tie', 'Both have claimed the title of world’s largest menorah. Two boroughs, one number, several opinions. The tape is staying out of it.'); }, 600); }
      else { tape.to = 24.4; setTimeout(() => { say('80 FT', 'THE ARCH. NOT A MENORAH. FOR THE UNION DEAD, 1892'); c.egg('arch', 'The arch behind it honours the Union soldiers and sailors of the Civil War, dedicated 1892, about eighty feet. It was not built as a menorah canopy, though it does frame one nicely.'); }, 2600); } }, 'A giant tape measure');
    // the dreidel: nun, gimel, hei, shin
    const LET = ['נ', 'ג', 'ה', 'ש'], SAY = ['Nun. Nothing happens. A very New York result.', 'Gimel. You take the whole pot.', 'Hei. You take half. Round down, this is Brooklyn.', 'Shin. Put one in.'];
    const dr = new THREE.Group(); dr.position.set(15.8, 0, 3.4); g.add(dr); c.post(X(15.8), 3.4, 0.7); const body = new THREE.Group(); dr.add(body);
    const faces = LET.map((L) => new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#1d4ed8'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 14; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.62}px serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(L, w / 2, h / 2 + 8); }), roughness: 0.4 }));
    const blue = std(c, 0x1d4ed8, { roughness: 0.4 });
    body.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), [faces[0], faces[2], blue, blue, faces[1], faces[3]]).translateY(1.15));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.64, 0.7, 4), blue); tip.rotation.y = PI / 4; tip.rotation.x = PI; tip.position.y = 0.35; body.add(tip);
    body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), std(c, 0xf5c542, { metalness: 0.8, roughness: 0.3 })).translateY(1.85));
    let spin = 0, ang = 0, landed = -1, spins = 0;
    c.clickable(body, () => { if (spin > 0.5) return; spin = 22 + Math.random() * 10; landed = -1; snd(c, 'whoosh', 0.3, 1.2); }, 'Spin the dreidel');
    c.tick((t, dt) => { if (spin > 0.01) { ang += spin * dt; spin *= Math.pow(0.55, dt); body.rotation.y = ang; body.rotation.z = Math.sin(ang * 0.5) * Math.min(0.3, 0.6 / (spin + 1));
        if (spin < 0.6) { spin = 0; const k = Math.round(ang / (PI / 2)); body.rotation.y = k * PI / 2; body.rotation.z = 0; const order = [0, 1, 3, 2], face = order[((-k % 4) + 4) % 4]; landed = face; spins++;
          c.toast(SAY[face], 3000); c.egg('dreidel', 'Nun, gimel, hei, shin: a great miracle happened there. Nothing, everything, half, put one in. A compact financial district.'); if (spins === 4) c.egg('spins', 'Four spins. In the old game you would be either up a pile of gelt or explaining to a cousin why you are not.'); } } });
    const small = new THREE.Group(); small.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), std(c, 0xf4f4f4, { roughness: 0.4 })).translateY(0.2)); const st2 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.12, 4), std(c, 0xf4f4f4)); st2.rotation.x = PI; st2.position.y = 0.06; small.add(st2);
    eggBox(c, g, X, small, 16.6, 1.0, -1.0, 'pe', 'A small white dreidel', 'In Israel the fourth letter is pe, not shin: a great miracle happened here. Location remains everything.');
    const arch = c.slab(0.5, 0.5, 0.2, std(c, 0xa89880, { roughness: 0.8 }), 0, 0, 0); eggBox(c, g, X, arch, 2.0, 1.25, 3.0, 'archmodel', 'A model of the arch', 'The Soldiers’ and Sailors’ Arch at Grand Army Plaza, finished 1892. It frames the menorah. It was not consulted.');
    g.add(c.slab(0.7, 1.0, 0.5, std(c, 0x3a3a40), 2.0, 0.5, 3.0)); c.post(X(2.0), 3.0, 0.4);
    let tv = 0; c.tick((t, dt) => { tv += (tape.to - tv) * Math.min(1, dt * 1.6); blade.scale.y = Math.max(0.01, tv - 0.8); blade.visible = tv > 0.85; tapeH.rotation.y = tape.k === 3 ? -0.0 : 0; blade.rotation.x = tape.k === 3 ? -0.5 : 0; });
    walkers(c, g, 9, { x1: 2.4, x2: 17.6, z1: 2.4, z2: 6.8, pool: 'walkers' });
  },

  // THE ANSWERING WINDOWS. Light your menorah in the window; the windows across the street answer, one by one, in their own time.
  window(c, r, g, X) {
    const { THREE } = c, CH = r.ceilH, WY = 2.9;
    const wallM = c.surf('plaster', 2.4, 0xe6dcc8), trim = std(c, 0xf4f2ec, { roughness: 0.5 });
    const pw = PORTAL.w, x1 = (W - pw) / 2;
    g.add(c.slab(pw, 0.85, 0.24, wallM, W / 2, 0.425, -D / 2 - 0.12));
    for (const [a, b] of [[x1, x1 + 0.2], [7.2, 8.4], [11.6, 12.8], [W - x1 - 0.2, W - x1]]) g.add(c.slab(b - a, WY - 0.85, 0.24, wallM, (a + b) / 2, 0.85 + (WY - 0.85) / 2, -D / 2 - 0.12));
    const glassM = new THREE.MeshStandardMaterial({ color: 0xaac4e0, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0.9, depthWrite: false });
    for (const [a, b] of [[x1 + 0.2, 7.2], [8.4, 11.6], [12.8, W - x1 - 0.2]]) { const cx = (a + b) / 2, w = b - a;
      g.add(c.slab(w, 0.08, 0.1, trim, cx, 1.9, -D / 2 + 0.02)); g.add(c.slab(0.07, WY - 0.85, 0.08, trim, cx, 0.85 + (WY - 0.85) / 2, -D / 2 + 0.02));
      g.add(c.slab(w, 0.1, 0.12, trim, cx, WY - 0.05, -D / 2 + 0.02)); g.add(c.slab(w, WY - 0.85, 0.02, glassM, cx, 0.85 + (WY - 0.85) / 2, -D / 2 - 0.05));
      // a radiator under each window, painted over too many times
      const rad = new THREE.Group(); rad.position.set(cx, 0, -D / 2 + 0.35); g.add(rad); for (let i = 0; i < 14; i++) rad.add(c.slab(0.07, 0.62, 0.18, std(c, 0xd8d0c0, { metalness: 0.4, roughness: 0.5 }), -0.65 + i * 0.1, 0.36, 0)); }
    g.add(c.slab(pw, 0.05, 0.36, trim, W / 2, 0.88, -D / 2 + 0.06));
    // the street, one floor down, and the building across it
    const st = new THREE.Group(); g.add(st); const SY = -4.5, FZ = -23;
    st.add(c.slab(44, 0.1, 15, c.surf('asphalt', 3, 0x3a3c44), W / 2, SY - 0.05, -15.5)); st.add(c.slab(44, 0.2, 2.2, c.surf('pavers', 2, 0x6a6870), W / 2, SY + 0.1, FZ + 1.1)); st.add(c.slab(44, 0.2, 2.2, c.surf('pavers', 2, 0x6a6870), W / 2, SY + 0.1, -9.1));
    // v2: the building across the street is the Krea plate (work/v2/plate_window.jpg), flat, as a facade 15 m off is; the
    // fourteen windows that answer are measured off that photograph (u, v of its 1600 x 903 proof, work/v2_marks.jpg)
    const FW = 40, FH = FW * 1536 / 2720, FY = SY - 0.6 + FH / 2, fx0 = W / 2 - FW / 2, ftop = FY + FH / 2;
    const ptx = c.tex.load('assets/walls/window_street.jpg'); ptx.colorSpace = THREE.SRGBColorSpace; ptx.anisotropy = 8;
    const facM = new THREE.MeshBasicMaterial({ map: ptx, fog: false }); facM.color.setScalar(0.9);
    st.add(new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), facM).translateX(W / 2).translateY(FY).translateZ(FZ));
    const SPOTS = [[520, 145], [690, 145], [920, 145], [1115, 145], [1250, 145], [690, 333], [920, 333], [1370, 320], [520, 503], [690, 503], [920, 503], [1115, 503], [1250, 503], [388, 715]];
    const wins = r.wins = SPOTS.map(([u, v]) => ({ x: fx0 + u / 1600 * FW, y: ftop - v / 903 * FH, men: true, base: 0, at: -1, glow: 0 }));
    // a lit room seen from outside: warm, darker at the sill, curtains drawn to the sides, a lamp somewhere
    const RT = c.canvasTex(64, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd394'); gr.addColorStop(0.7, '#e08a3c'); gr.addColorStop(1, '#7a3a14'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.fillStyle = 'rgba(70,28,10,.6)'; q.fillRect(0, 0, w * 0.2, h); q.fillRect(w * 0.8, 0, w * 0.2, h); q.fillStyle = 'rgba(255,244,214,.45)'; q.beginPath(); q.arc(w * 0.62, h * 0.38, w * 0.16, 0, 7); q.fill(); });
    const glowIm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.45, 2.4), new THREE.MeshBasicMaterial({ map: RT, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), wins.length); glowIm.position.z = FZ + 0.03; st.add(glowIm);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    const flames = []; wins.forEach((w, k) => { for (let s = 0; s < 9; s++) flames.push([w.x - 0.5 + s * 0.125, w.y - 0.98 + (s === 4 ? 0.12 : 0), FZ + 0.06, s === 4 ? -1 : (s < 4 ? s : s - 1), k]); });
    const fl = ledPoints(c, st, flames.map((f) => [f[0], f[1], f[2], 2, [1, 0.62, 0.22]]), { size: 0.09, gain: 2.8 }); const fo = fl.geometry.attributes.ord;
    fl.material.uniforms.uOn.value = 1.0;
    // someone comes to the window when theirs is lit: an eye flower silhouette against the warm room
    const SIL = c.canvasTex(64, 128, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,.78)'; q.beginPath(); q.ellipse(w / 2, h * 0.92, w * 0.34, h * 0.32, 0, 0, 7); q.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; q.beginPath(); q.ellipse(w / 2 + Math.cos(a) * w * 0.2, h * 0.42 + Math.sin(a) * w * 0.2, w * 0.13, w * 0.09, a, 0, 7); q.fill(); } q.beginPath(); q.arc(w / 2, h * 0.42, w * 0.16, 0, 7); q.fill(); q.fillStyle = 'rgba(41,98,255,.9)'; q.beginPath(); q.arc(w / 2, h * 0.42, w * 0.07, 0, 7); q.fill(); });
    const sils = wins.map((w, k) => { const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: SIL, transparent: true, depthWrite: false, fog: false, opacity: 0 })); sp.position.set(w.x + (k % 2 ? 0.25 : -0.25), w.y - 0.25, FZ + 0.045); st.add(sp); w.sil = sp; w.silAt = 2 + Math.random() * 5; return sp; });
    // v3 (Astra's "fourteen households, one passing light"): each answer arrives along a thin cobalt thread drawn across the
    // brick from the window that answered before it; when all fourteen have answered, an Open Eye Flower blooms over the building
    const threads = []; let lastW = null, bloom = -1;
    const thread = (w) => { const a = lastW || { x: w.x, y: SY + 1.2 }, N = 28, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const u = i / (N - 1); pos.set([a.x + (w.x - a.x) * u + Math.sin(u * PI * 3) * 0.35, a.y + (w.y - a.y) * u + Math.sin(u * PI) * 1.2, FZ + 0.07], i * 3); }
      const gq = new THREE.BufferGeometry(); gq.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gq.setDrawRange(0, 0);
      const ln = new THREE.Line(gq, new THREE.LineBasicMaterial({ color: 0x4a7dff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); st.add(ln); threads.push({ ln, t: 0, N }); lastW = w; };
    const bigF = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: c.canvasTex(512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.95); }), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    bigF.position.set(W / 2, ftop - FH * 0.42, FZ + 0.08); st.add(bigF);
    c.tick((t, dt) => { for (let i = threads.length - 1; i >= 0; i--) { const q = threads[i]; q.t += dt; q.ln.geometry.setDrawRange(0, Math.min(q.N, Math.floor(q.t / 0.8 * q.N)));
        q.ln.material.opacity = 0.95 * Math.max(0, Math.min(1, (3.6 - q.t) / 1.5)); if (q.t > 3.6) { st.remove(q.ln); q.ln.geometry.dispose(); threads.splice(i, 1); } }
      if (bloom >= 0) { bloom += dt; bigF.material.opacity = 0.28 * Math.sin(Math.min(1, bloom / 4.5) * PI); bigF.rotation.z = bloom * 0.05; if (bloom > 4.5) { bloom = -1; bigF.material.opacity = 0; } } });
    const paint = () => { wins.forEach((w, k) => { m4.makeTranslation(w.x, w.y, 0); glowIm.setMatrixAt(k, m4); const v = Math.max(w.base, w.glow); glowIm.setColorAt(k, col.setRGB(v, v, v)); }); glowIm.instanceMatrix.needsUpdate = true; glowIm.instanceColor.needsUpdate = true; };
    paint();
    // the flames across the street: ord 2 is dark; a window's slots come on as it answers (0 lit)
    const answer = (n) => { flames.forEach((f, i) => fo.setX(i, 2)); fo.needsUpdate = true; wins.forEach((w) => { if (w.men) { w.at = 0.8 + Math.random() * 8 + Math.random() * Math.random() * 6; w.on = false; lastW = null; w.glow = 0; if (w.sil) { w.sil.material.opacity = 0; w.silAt = 2 + Math.random() * 5; } w.n = n; w.lit = 0; } }); r.answering = 0; };
    snowfall(c, r, g, c.MOBILE ? 250 : 600, { x1: -6, x2: 26, y1: SY, y2: 16, z1: FZ + 0.5, z2: -8.6 });
    // your menorah on the sill, silver, candles in blue and white
    const MZ = -D / 2 + 0.12, MX = W / 2, MY = 0.905, silver = std(c, 0xd0d4dc, { metalness: 1, roughness: 0.18 });
    g.add(c.slab(1.3, 0.04, 0.16, silver, MX, MY + 0.02, MZ)); g.add(c.slab(0.05, 0.22, 0.05, silver, MX, MY + 0.13, MZ));
    const cand = []; for (let i = 0; i < 9; i++) { const lx = MX - 0.56 + i * 0.14, top = i === 4 ? MY + 0.3 : MY + 0.06, o = new THREE.Group(); o.position.set(lx, top, MZ); g.add(o);
      o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), silver).translateY(0.02));
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8), std(c, i === 4 ? 0xf4ead2 : (i % 2 ? 0x2a5ad8 : 0xf4f6ff), { roughness: 0.7 })); wax.position.y = 0.105; o.add(wax);
      const f = flameSprite(c, o, 0, 0.2, 0, 0.06); const hit = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.25), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.12; o.add(hit);
      cand.push({ o, wax, f, hit, i: i === 4 ? 's' : (i < 4 ? i : i - 1) }); }
    const glowIn = new THREE.PointLight(0xffa040, 0, 3.5, 1.6); glowIn.position.set(MX, MY + 0.35, MZ + 0.3); g.add(glowIn);
    let order = [], step = 0, nn = LT.night;
    const set = () => { nn = LT.night; order = ['s', ...lightOrder(nn)]; step = 0; cand.forEach((k) => { k.f.visible = false; k.wax.visible = k.i === 's' || k.i >= 8 - nn; }); glowIn.intensity = 0; };
    set(); LT.fans.push(() => { if (step === 0 || step >= order.length) set(); });
    nightPicker(c, g, X, 15.2, 1.4, -6.4, -0.2, set);
    cand.forEach((k) => c.clickable(k.hit, () => {
      if (step >= order.length) { c.toast('Lit. Now watch the street.', 2000); return; }
      if (k.i === order[step]) { k.f.visible = true; snd(c, 'clink', 2600); step++; glowIn.intensity = 0.25 + step * 0.12; if (step === order.length) { c.toast('Watch the windows across the street.', 3000); answer(nn); } }
      else if (k.i !== 's' && k.i < 8 - nn) c.toast('No candle there tonight.', 1800);
      else c.toast(step === 0 ? 'The shamash first, the tall one in the middle.' : 'Newest first: the leftmost unlit candle.', 2400);
    }, 'A candle'));
    let ans = 0;
    c.tick((t, dt, P, ri) => {
      if (r.plateMesh && r.plateMesh.scale.x > 0.001) r.plateMesh.scale.setScalar(0.0001);   // v2: the street is our own plane now; the depth plate behind it only smeared (the room manager owns .visible, so collapse it)
      if (!here(r, ri) && Math.abs(ri - r.i) > 1) return; let dirty = false;
      wins.forEach((w, k) => { if (!w.on) { if (w.at < 0) return; w.at -= dt; if (w.at > 0) return; w.on = true; thread(w); }   // the countdown used to run past zero into 'not answering' after one frame
        w.glow = Math.min(1.25, w.glow + dt * 0.5 * (0.6 + Math.random())); dirty = true; if (w.sil) { w.silAt -= dt; if (w.silAt < 0) w.sil.material.opacity = Math.min(1, w.sil.material.opacity + dt * 0.4); } if (w.lit < w.n + 1) { w.tick = (w.tick || 0) - dt; if (w.tick <= 0) { w.tick = 0.35 + Math.random() * 0.6; w.lit++; let s0 = 0; flames.forEach((f, i) => { if (f[4] !== k) return; const slot = f[3]; const on = slot === -1 ? w.lit >= 1 : slot >= 8 - w.n && (slot - (8 - w.n)) < w.lit - 1; fo.setX(i, on ? 0 : 2); s0++; }); fo.needsUpdate = true; if (w.lit === w.n + 1) { ans++; if (ans === 14) bloom = 0; if (ans === 14) c.egg('answer', 'Fourteen windows answered, each in its own time. A street facing window publicises the miracle: that is the whole point of putting it there. Someone across the street noticed.'); } } } else w.at = -1; });
      if (dirty) paint();
    });
    // the kitchen and the table
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.05, 20), std(c, 0x222222, { metalness: 0.6, roughness: 0.4 })); pan.position.set(1.2, 0.98, -6.8); g.add(pan);
    for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 12), std(c, 0xc88a3a, { roughness: 0.8 })); l.position.set(1.12 + (i % 3) * 0.08, 1.01, -6.86 + Math.floor(i / 3) * 0.1); g.add(l); }
    steam(c, g, 1.2, 1.0, -6.8, 0.3);
    const grater = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.24, 4, 1, true), std(c, 0xb8bcc4, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })); eggBox(c, g, X, grater, 1.5, 1.07, -6.4, 'grater', 'A box grater', 'Potato latkes are the Ashkenazi kind, not the only kind. Everybody at the table brought an opinion, and one of them brought applesauce.');
    const plate_ = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.02, 24), std(c, 0xf4f4f4, { roughness: 0.3 })); plate_.position.set(6.0, 0.78, -2.3); g.add(plate_);
    const dough = new THREE.Group(); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), std(c, 0xd89a52, { roughness: 0.8 })); s.scale.y = 0.75; s.position.set((i % 2) * 0.12 - 0.06, 0.05, Math.floor(i / 2) * 0.12 - 0.06); dough.add(s); const sug = new THREE.Mesh(new THREE.SphereGeometry(0.061, 14, 10, 0, PI * 2, 0, 0.9), std(c, 0xfafafa, { roughness: 1 })); sug.scale.y = 0.75; sug.position.copy(s.position); dough.add(sug); }
    eggBox(c, g, X, dough, 6.0, 0.78, -2.3, 'sufganiyot', 'Jelly doughnuts', 'Sufganiyot: fried, filled, sugared, for the oil that lasted. The napkin has accepted its assignment.');
    const rack = new THREE.Group(); for (let i = 0; i < 7; i++) rack.add(c.slab(0.02, 0.01, 0.3, std(c, 0x999999, { metalness: 0.8 }), -0.15 + i * 0.05, 0, 0)); eggBox(c, g, X, rack, 6.6, 0.79, -1.9, 'rack', 'A cooling rack', 'The festival lights are not for reading or cooking by. The kitchen keeps its own bulb, and its own opinions.');
    for (let i = 0; i < 6; i++) { const co = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.005, 16), GOLD(c)); co.position.set(5.5 + Math.random() * 0.3, 0.775, -2.6 + Math.random() * 0.3); g.add(co); }
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 192, (q, w, h) => { q.fillStyle = '#7a2a2a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8b878'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20); q.strokeRect(26, 26, w - 52, h - 52); for (let i = 0; i < 8; i++) { q.fillStyle = '#1d3a6a'; q.beginPath(); q.arc(48 + i * 22, h / 2, 6, 0, 7); q.fill(); } }), roughness: 1 }));
    rug.rotation.x = -PI / 2; rug.position.set(12.0, 0.008, 0.4); g.add(rug);
    const lampW = new THREE.PointLight(0xffc080, 0, 6, 1.4); lampW.position.set(16.8, 1.7, 2.6); g.add(lampW); lampW.intensity = 2.5;
  },

  // DYKER HEIGHTS. Throw the main: the block goes dark, then comes back house by house, each outdoing the last, ending with one porch bulb.
  dyker(c, r, g, X) {
    const { THREE } = c, U = plateFX(c, r);
    const groups = [];   // [ledPoints, wave]
    const add = (pts, wave, o = {}) => { const p = ledPoints(c, g, pts, o); p.material.uniforms.uOn.value = 1.1; groups.push([p, wave]); return p; };
    // the two houses either side: eaves, gables, windows outlined, porch columns wrapped
    for (const side of [0, 1]) { const x = side ? W - 0.45 : 0.45, s = side ? -1 : 1, pal = side ? [[1, 0.2, 0.2], [0.2, 1, 0.4], [1, 0.8, 0.2], [0.3, 0.5, 1]] : [[1, 0.88, 0.62]];
      const pts = [];
      for (const z0 of [-7.4, -2.6]) { const z1 = z0 + 4.2; pts.push(...strand([[x, 6.6, z0], [x, 8.6, (z0 + z1) / 2], [x, 6.6, z1]], 0.14)); pts.push(...strand([[x, 6.6, z0], [x, 6.6, z1]], 0.14));
        for (const zz of [z0 + 0.9, z1 - 0.9]) pts.push(...strand([[x, 3.2, zz - 0.5], [x, 3.2, zz + 0.5], [x, 4.8, zz + 0.5], [x, 4.8, zz - 0.5], [x, 3.2, zz - 0.5]], 0.12)); }
      for (const zz of [-6.6, -3.0, 0.6]) { for (let k = 0; k < 90; k++) { const u = k / 90, a = u * 18; pts.push([x + s * (0.7 + Math.cos(a) * 0.14), u * 3.2, zz + Math.sin(a) * 0.14]); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 10), std(c, 0xf2f0ea)).translateX(x + s * 0.7).translateY(1.6).translateZ(zz)); c.post(X(x + s * 0.7), zz, 0.25); }
      add(pts.map((p) => [...p.slice(0, 3), 0, pal[(Math.random() * pal.length) | 0]]), side ? 3 : 1, { size: 0.09, gain: 2.4 });
      g.add(c.slab(2.6, 0.03, 9.2, c.surf('grass', 2, 0x4a6a3a), side ? W - 1.5 : 1.5, 0.015, -3.0)); }
    // the light tunnel over the walk, chasing
    const tun = []; for (let a = 0; a < 6; a++) { const z = -6.2 + a * 1.4; for (let k = 0; k <= 70; k++) { const u = k / 70 * PI; tun.push([W / 2 + Math.cos(u) * 3.2, Math.sin(u) * 3.6, z, k / 70, [[1, 0.2, 0.3], [1, 1, 1], [0.2, 1, 0.4]][a % 3]]); } }
    add(tun, 2, { size: 0.1, gain: 2.6, chase: 0.6 });
    // candy canes along the walk
    const cane = c.canvasTex(64, 256, (q, w, h) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); q.fillStyle = '#d01020'; for (let y = -64; y < h; y += 48) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y + 32); q.lineTo(w, y + 52); q.lineTo(0, y + 20); q.fill(); } });
    const cm = new THREE.MeshStandardMaterial({ map: cane, roughness: 0.3, emissive: 0x401010, emissiveMap: cane });
    for (const x of [6.4, 13.6]) for (let k = 0; k < 4; k++) { const z = -6.6 + k * 2.4; prop(c, r, g, X, 'lt_candycane', x, z, { h: 1.5, ry: x < 10 ? PI / 2 : -PI / 2 }); }   // v5: modelled canes (Krea, Tripo), not sticks
    // the meter and the main switch
    const box = new THREE.Group(); box.position.set(18.8, 0, -4.8); box.rotation.y = -PI / 2; g.add(box); c.post(X(18.8), -4.8, 0.5);
    box.add(c.slab(0.9, 1.4, 0.3, std(c, 0x6a7a6a, { metalness: 0.5, roughness: 0.5 }), 0, 1.4, 0));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshBasicMaterial({ map: c.canvasTex(128, 128, (q, w) => { q.fillStyle = '#f4f2ea'; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.fillStyle = '#111'; q.font = '700 14px monospace'; q.textAlign = 'center'; q.fillText('KWH', 64, 40); q.fillRect(62, 64, 4, 50); }), toneMapped: false })); dial.position.set(0, 1.62, 0.16); box.add(dial);
    const knife = new THREE.Group(); knife.position.set(0, 1.05, 0.2); box.add(knife); knife.add(c.slab(0.06, 0.5, 0.06, std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), 0, 0.25, 0)); knife.add(c.slab(0.2, 0.08, 0.08, std(c, 0x111111), 0, 0.5, 0));
    const tag = c.sign('"BLOCK FANTASY"\nMAIN', { w: 0.8, h: 0.3, bg: '#ff6b00', fg: '#111', font: c.MONO, weight: 800 }); tag.position.set(0, 2.25, 0.16); box.add(tag);
    const bill = board(c, box, 0.8, 0.3, 128); bill.m.position.set(0, 0.62, 0.16); let kwh = 48211;
    const drawBill = () => { const { q, W: w, H: h } = bill; q.fillStyle = '#0a1a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#40ff60'; q.font = `700 ${h * 0.5}px monospace`; q.textAlign = 'center'; q.fillText(String(Math.floor(kwh)).padStart(7, '0'), w / 2, h * 0.7); bill.up(); };
    // the quiet house: one porch bulb by the south wall
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false })); bulb.position.set(16.4, 2.6, D / 2 - 0.3); g.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,150,.6)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.2); halo.position.copy(bulb.position); g.add(halo);
    const qt = notice(c, g, 'THE QUIET HOUSE', 16.4, 3.1, D / 2 - 0.16, PI, 1.1, 0.22); c.clickable(qt, () => c.egg('quiet', 'One porch bulb. Restraint, on this block, is a provocation. The quiet house has entered the competition.'), 'The quiet house');
    let mode = 'on', k = 0, spin = 1;
    c.clickable(knife, () => { if (mode !== 'on') return; mode = 'dark'; k = 0; knife.rotation.x = 1.2; snd(c, 'thud', 0.8); c.music.mute && c.music.mute(true); c.toast('The block goes dark. Give it a moment. It has its pride.', 3000); }, 'Throw the main');
    c.clickable(box, () => c.egg('meter', 'The meter. Participation, attendance and bulb counts vary year to year, so nobody here will give you a number. The meter will. It is not happy about it.'), 'The meter');
    c.tick((t, dt, P, ri) => {
      let lit = 1;
      if (mode === 'dark') { k += dt; lit = 0; if (k > 2.6) { mode = 'waves'; k = 0; c.music.mute && c.music.mute(false); } }
      else if (mode === 'waves') { k += dt; const w = Math.floor(k / 1.5) + 1; lit = Math.min(1, k / 7.5);
        if (w !== r.wave) { r.wave = w; snd(c, 'thud', 0.4); if (w <= 4) c.flash(0.08 * w); }
        if (k > 9.5) { mode = 'bulb'; k = 0; } }
      else if (mode === 'bulb') { k += dt; if (k > 1.2 && !r.bulbed) { r.bulbed = true; snd(c, 'click'); c.egg('block', 'Back, house by house, each outdoing the last, and then one modest porch bulb. The modern spectacle here is usually traced to one household’s display in 1986. The neighbours took it personally.'); }
        if (k > 2) { mode = 'on'; r.bulbed = false; knife.rotation.x = 0; } }
      const wave = mode === 'waves' ? Math.floor(k / 1.5) + 1 : mode === 'dark' ? 0 : 9;
      groups.forEach(([p, wv]) => { const u = p.material.uniforms.uMaster; u.value += ((wave >= wv ? 1 : 0) - u.value) * Math.min(1, dt * 6); });
      // v2: the blackout takes the facades, canopies, lamps and their puddles with it, then they come back with the waves
      r._dl = r._dl ?? 1; r._dl += ((mode === 'dark' ? 0.04 : lit) - r._dl) * Math.min(1, dt * 5); r.dressLevel && r.dressLevel(r._dl);
      U.uLit.value = mode === 'on' || mode === 'bulb' ? 1 : 0; U.uBand.value = mode === 'waves' ? Math.min(1.01, Math.floor(k / 1.5) * 0.25) : mode === 'dark' ? -1 : 2;
      const b = mode === 'dark' || (mode === 'waves' && k < 8) ? 0 : 1; bulb.visible = b > 0; halo.visible = b > 0;
      if (here(r, ri)) { spin += (((mode === 'dark' ? 0.05 : 1) + (mode === 'waves' ? 3 : 0)) - spin) * Math.min(1, dt * 2); dial.rotation.z -= dt * spin * 3; kwh += dt * spin * 7; if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) drawBill(); }
    });
    drawBill();
    const timer = c.slab(0.16, 0.1, 0.08, std(c, 0xf4f4f4), 0, 0, 0); eggBox(c, g, X, timer, 18.62, 0.9, -4.0, 'timer', 'A plug in timer', 'Timers run the displays on a schedule. Even spectacle needs a bedtime, and this one argues about it.');
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0c8, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 })); eggBox(c, g, X, led, 1.6, 0.2, 3.0, 'led', 'A giant LED bulb', 'LEDs generally draw far less than the old incandescent strings. Restraint found a technicality, and the block spent it on more lights.');
    const santa = c.glb('lt_santa', { h: 2.8, x: 17.2, z: -3.0, ry: -PI / 2, parent: g }); c.post(X(17.2), -3.0, 0.8); c.clickable(santa, () => c.say(santa, 'I am mostly air. So is the competition.', 2600, 3.0), 'An inflatable Santa');
    walkers(c, g, 10, { x1: 7.4, x2: 12.6, z1: -6.0, z2: 6.6, pool: 'walkers' });
  },
};
