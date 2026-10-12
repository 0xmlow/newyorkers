// Round thirteen batch c1: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// No new lights: every glow here is emissive, additive or a sprite, and the finishing pass blooms it.
// Every tick returns at once unless its set is the one you are in or next to.
const PI = Math.PI;
const near = (r, ri) => Math.abs(ri - r.i) <= 1;

// ---------- the kit for this batch ----------
// a soft glow sprite for a practical
function glow(c, K, g, x, y, z, s = 0.9, col = 'rgba(255,214,150,.55)') {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a vertical fade, bright at the top, for light shafts and haze
let _fade;
function fadeTex(c) { return _fade ||= c.canvasTex(8, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
// a light shaft: an open cone of additive haze from a fixture to the floor
function shaft(c, g, x, y, z, { r1 = 0.15, r2 = 1.2, h = 4, col = 0xffe0b0, op = 0.16, rx = 0, rz = 0 } = {}) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 28, 1, true), new THREE.MeshBasicMaterial({ map: fadeTex(c), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.geometry.translate(0, -h / 2, 0); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); return m;
}
// a flat card of haze (a window's light falling in, steam over a grate)
function hazeCard(c, g, w, h, col, op, x, y, z, ry = 0) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: fadeTex(c), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}
// dust in the air: points that drift, only while the set is near
function motes(c, K, g, r, [x1, x2, y1, y2, z1, z2], n, col = 'rgba(255,230,190,.9)', size = 0.06, wind = 0) {
  const { THREE } = c; n = c.MOBILE ? n >> 1 : n;
  const pos = new Float32Array(n * 3), base = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { base[i * 3] = x1 + Math.random() * (x2 - x1); base[i * 3 + 1] = y1 + Math.random() * (y2 - y1); base[i * 3 + 2] = z1 + Math.random() * (z2 - z1); }
  pos.set(base); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: K.glowTex(col), size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); pts.frustumCulled = false; g.add(pts);
  const H = y2 - y1;
  c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (let i = 0; i < n; i++) { const k = i * 3, ph = i * 1.37;
    pos[k] = base[k] + Math.sin(t * 0.21 + ph) * 0.35 + wind * ((t * 0.3 + ph) % 4);
    pos[k + 1] = y1 + ((base[k + 1] - y1 + t * (wind ? -0.6 : 0.05) * (1 + (i % 3))) % H + H) % H;
    pos[k + 2] = base[k + 2] + Math.cos(t * 0.17 + ph) * 0.35; }
    geo.attributes.position.needsUpdate = true; });
  return pts;
}
// neon: a sign with no board, pushed bright enough to bloom
function neon(c, text, o = {}) { const s = c.sign(text, { bg: null, glow: 28, weight: 800, ...o }); s.material.color.setScalar(o.k || 1.7); return s; }
function put(g, m, x, y, z, ry = 0, rx = 0) { m.position.set(x, y, z); m.rotation.set(rx, ry, 0); g.add(m); return m; }
// a flat thing on the floor
function floorArt(c, K, g, w, h, draw, x, z, a = 0, px = 512) { const m = K.decal(w, h, draw, px); m.rotation.set(-PI / 2, 0, a); m.position.set(x, 0.016, z); m.material.roughness = 0.6; g.add(m); return m; }
// a row of bulbs, instanced; chase = n turns every n-th one off in a running pattern
function bulbLine(c, g, r, pts, col = 0xffd9a0, rad = 0.05, k = 2.2, chase = 0, speed = 6) {
  const { THREE } = c, mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(rad, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), pts.length);
  const m4 = new THREE.Matrix4(), on = new THREE.Color(col).multiplyScalar(k), off = new THREE.Color(col).multiplyScalar(0.12);
  pts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, on); }); g.add(mesh);
  if (chase) { let last = -1; c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const s = (t * speed) | 0; if (s === last) return; last = s; for (let i = 0; i < pts.length; i++) mesh.setColorAt(i, (i + s) % chase ? on : off); mesh.instanceColor.needsUpdate = true; }); }
  return mesh;
}
// the room's ceiling and floor slabs, found by where build.js put them
function findSlab(g, y, w = 20) { return g.children.find((o) => o.isMesh && o.geometry?.parameters?.width === w && Math.abs(o.position.y - y) < 0.02); }
function reskin(c, mesh, tex, o = {}) { if (!mesh) return; tex.wrapS = tex.wrapT = c.THREE.RepeatWrapping; mesh.material = new c.THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, ...o }); }
// soft hanging fabric: a plane with folds, for curtains and drapes
function drape(c, w, h, col, x, y, z, ry = 0) {
  const { THREE } = c, geo = new THREE.PlaneGeometry(w, h, 32, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / w * 34) * 0.07);
  geo.computeVertexNormals();
  const tex = c.canvasTex(256, 64, (q, W2, H2) => { for (let x = 0; x < W2; x++) { const v = 0.55 + 0.45 * Math.sin(x / W2 * 34 * 2.2); q.fillStyle = `rgba(0,0,0,${(1 - v) * 0.55})`; q.fillRect(x, 0, 1, H2); } });
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, map: tex, roughness: 0.85, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; return m;
}

// ---------- interior mapping: a flat plane with a room behind it that is not there ----------
// The plane (w by h, facing +Z) looks into a box `depth` deep. Every pixel casts the view ray into the box and
// asks `shade(face, uv, p)` for the colour where it lands: true parallax on one quad, no render target.
// faces: 0 back, 1 left, 2 right, 3 bottom, 4 top. uv on walls: x = depth fraction, y = height; on floor and top: x across, y depth.
// o.bw, o.bh: the box can be bigger than the plane (a porthole into a room); o.ox, o.oy: where the plane sits on its face; o.circle: a round window
function interior(c, w, h, depth, shade, uniforms = {}, decl = '', o = {}) {
  const { THREE } = c;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uW: { value: o.bw || w }, uH: { value: o.bh || h }, uD: { value: depth }, uT: { value: 0 }, uOff: { value: new THREE.Vector2(o.ox || 0, o.oy || 0) }, uCirc: { value: o.circle ? w / 2 : 0 }, ...uniforms },
    vertexShader: 'varying vec3 vP; varying vec3 vC; void main(){ vP = position; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uW, uH, uD, uT, uCirc; uniform vec2 uOff; ${decl} varying vec3 vP; varying vec3 vC;
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      ${shade}
      void main(){
        if (uCirc > 0. && length(vP.xy) > uCirc) discard;
        vec3 d = normalize(vP - vC), o = vP + vec3(uOff, 0.); d.x = abs(d.x) < 1e-5 ? 1e-5 : d.x; d.y = abs(d.y) < 1e-5 ? 1e-5 : d.y; d.z = min(d.z, -1e-5);
        float tx = ((d.x > 0. ? uW : -uW) * .5 - o.x) / d.x, ty = ((d.y > 0. ? uH : -uH) * .5 - o.y) / d.y, tz = (-uD - o.z) / d.z;
        float t = min(tx, min(ty, tz)); vec3 p = o + d * t; int f; vec2 uv;
        if (t == tz) { f = 0; uv = vec2(p.x / uW + .5, p.y / uH + .5); }
        else if (t == tx) { f = d.x < 0. ? 1 : 2; uv = vec2(-p.z / uD, p.y / uH + .5); }
        else { f = d.y < 0. ? 3 : 4; uv = vec2(p.x / uW + .5, -p.z / uD); }
        gl_FragColor = vec4(shade(f, uv, p), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  c.tick((t) => { mat.uniforms.uT.value = t; });
  return m;
}

// ---------- anamorphic placement: from the eye V, an object pushed k times as far and made k times bigger looks the same ----------
function along(c, V, obj, k, local) { obj.position.set(V.x + (local.x - V.x) * k, V.y + (local.y - V.y) * k, V.z + (local.z - V.z) * k); obj.scale.multiplyScalar(k); return obj; }

export const PROPS = {};

export const ROOM = {
  // ===== THE LOBBY: an infinity well in the ceiling, a marquee that goes up forever =====
  lobby(c, r, g, X, K) {
    const { THREE } = c;
    // the coffered ceiling, oxblood and gilt
    reskin(c, findSlab(g, 6.05), c.canvasTex(512, 512, (q, w, h) => {
      q.fillStyle = '#1a0507'; q.fillRect(0, 0, w, h);
      const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#4a0d14'); gr.addColorStop(1, '#2a0609');
      q.fillStyle = gr; q.fillRect(40, 40, w - 80, h - 80); q.strokeStyle = '#c9a033'; q.lineWidth = 10; q.strokeRect(40, 40, w - 80, h - 80); q.lineWidth = 3; q.strokeRect(70, 70, w - 140, h - 140);
      q.save(); q.translate(w / 2, h / 2); for (let i = 0; i < 16; i++) { q.rotate(PI / 8); q.fillStyle = i % 2 ? '#c9a033' : '#8a6a20'; q.beginPath(); q.ellipse(46, 0, 40, 12, 0, 0, 7); q.fill(); } q.restore();
      q.fillStyle = '#1d4ed8'; q.beginPath(); q.arc(w / 2, h / 2, 22, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(w / 2, h / 2, 10, 0, 7); q.fill();
    }), { roughness: 0.55, metalness: 0.2 });
    // THE ILLUSION: an oculus over the chandelier. Look up and the marquee runs on up, ring after ring, forever.
    const oc = interior(c, 5, 5, 40, `
      vec3 shade(int f, vec2 uv, vec3 p){
        float z = -p.z, fade = exp(-z * 0.085);
        if (f == 0) return vec3(1.6, 1.1, 0.6) * 0.5;
        float a = (f == 1 || f == 2) ? uv.y : uv.x, ring = fract(z / 0.8), row = floor(z / 0.8);
        vec3 velvet = mix(vec3(0.32, 0.03, 0.05), vec3(0.08, 0.0, 0.01), smoothstep(0.2, 1.0, abs(a - 0.5) * 2.0)) * (0.75 + 0.25 * sin(a * 90.0));
        float band = step(ring, 0.16);
        vec3 col = mix(velvet, vec3(0.75, 0.55, 0.18), band);
        float bx = fract(a * 10.0) - 0.5, by = (ring - 0.08) / 0.16 - 0.5, bulb = smoothstep(0.32, 0.12, length(vec2(bx, by * 1.4)));
        float on = mod(floor(a * 10.0) + row - floor(uT * 7.0), 3.0) > 0.5 ? 1.0 : 0.15;
        col += vec3(3.0, 2.1, 1.0) * bulb * band * on;
        col += vec3(0.5, 0.25, 0.1) * exp(-z * 0.02) * 0.15;
        return col * fade + vec3(0.9, 0.5, 0.2) * (1.0 - fade) * 0.25;
      }`);
    put(g, oc, 10, 5.985, 1, 0, PI / 2);
    const gold = K.std(0xc9a033, { metalness: 1, roughness: 0.28 });
    [[0, -2.5, 5.4, 0.3], [0, 2.5, 5.4, 0.3], [-2.5, 0, 0.3, 5.4], [2.5, 0, 0.3, 5.4]].forEach(([dx, dz, w, d]) => g.add(c.slab(w, 0.18, d, gold, 10 + dx, 5.9, 1 + dz)));
    bulbLine(c, g, r, Array.from({ length: 40 }, (_, i) => { const s = i / 10 | 0, u = (i % 10) / 10 * 5.4 - 2.7; return [[10 + u, 1 - 2.75], [10 + 2.75, 1 + u], [10 - u, 1 + 2.75], [10 - 2.75, 1 - u]][s].concat(); }).map(([x, z]) => [x, 5.78, z]), 0xffd9a0, 0.06, 2.4, 3, 7);
    shaft(c, g, 10, 5.9, 1, { r1: 2.3, r2: 3.4, h: 5.9, col: 0xffc890, op: 0.07 });
    c.clickable(oc, () => { c.sound.ding(); c.egg('lobby_oculus', 'MLow had the ceiling dug out to the top of the marquee and never found the top. Every bulb up there is a New Yorker who stayed for one more show.'); }, 'Look up');
    // curtains framing the screen, with gold tassels
    [[3.75, 0.25], [16.25, -0.25]].forEach(([x, k]) => { g.add(drape(c, 1.5, 4.7, 0x7a0a16, x, 2.35, -7.82)); const t = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), gold); t.position.set(x + k * 1.6, 1.5, -7.7); g.add(t); g.add(c.slab(0.03, 0.5, 0.03, gold, x + k * 1.6, 1.8, -7.7)); });
    g.add(drape(c, 13.6, 0.7, 0x7a0a16, 10, 4.65, -7.78));
    // neon on the north wall, either side of the screen
    put(g, neon(c, 'BOX OFFICE', { w: 2.6, h: 0.5, fg: '#ff4fa3', font: c.SERIF, weight: 900 }), 18.0, 3.7, -7.86);
    put(g, neon(c, 'EVERY SEAT COUNTED', { w: 3.0, h: 0.36, fg: '#22d3ee', font: c.MONO }), 2.0, 3.6, -7.86);
    put(g, neon(c, 'ADMIT ONE NEW YORKER', { w: 3.0, h: 0.3, fg: '#f5c542', font: c.MONO, k: 1.4 }), 18.0, 3.1, -7.86);
    // a bulb cornice right round the top of the walls, chasing
    const corn = []; for (let x = 0.6; x < 19.6; x += 0.5) corn.push([x, 5.75, 7.82]); for (let z = -7.4; z < 7.6; z += 0.5) { corn.push([0.16, 5.75, z]); corn.push([19.6, 5.75, z]); }
    bulbLine(c, g, r, corn, 0xffe0a8, 0.045, 2.0, 4, 5);
    // the red carpet runner, down the middle to the rope
    floorArt(c, K, g, 2.2, 12, (q, w, h) => { q.fillStyle = '#8a0a18'; q.fillRect(0, 0, w, h); q.fillStyle = '#c9a033'; q.fillRect(0, 0, w * 0.05, h); q.fillRect(w * 0.95, 0, w * 0.05, h);
      for (let y = 0; y < h; y += 46) { q.fillStyle = 'rgba(0,0,0,.18)'; q.fillRect(w * 0.08, y, w * 0.84, 2); }
      q.globalAlpha = 0.07; for (let i = 0; i < 1500; i++) { q.fillStyle = i % 2 ? '#000' : '#fff'; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, 10, 0.4, 0, 512);
    // a round velvet banquette with a gilt lamp column, mid floor
    const ban = new THREE.Group(); ban.position.set(11.9, 0, 0.8); g.add(ban); c.post(X(11.9), 0.8, 0.9);
    const tuft = c.canvasTex(512, 128, (q, w, h) => { q.fillStyle = '#7a0a16'; q.fillRect(0, 0, w, h); for (let y = 16; y < h; y += 32) for (let x = (y / 32 % 2) * 16; x < w; x += 32) { const gr = q.createRadialGradient(x, y, 1, x, y, 16); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - 16, y - 16, 32, 32); q.fillStyle = '#c9a033'; q.fillRect(x - 1, y - 1, 3, 3); } });
    put(ban, new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.45, 32), new THREE.MeshStandardMaterial({ map: tuft, roughness: 0.9 })), 0, 0.23, 0);
    put(ban, new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.7, 24), new THREE.MeshStandardMaterial({ map: tuft, roughness: 0.9 })), 0, 0.8, 0);
    put(ban, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.4, 12), gold), 0, 1.7, 0);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), K.basic(0xffe6b8)); globe.material.color.multiplyScalar(2); globe.position.y = 2.5; ban.add(globe);
    glow(c, K, ban, 0, 2.5, 0, 1.6, 'rgba(255,214,150,.6)');
    // dust in the projector light and under the oculus
    motes(c, K, g, r, [2, 18, 0.4, 5.6, -6, 7], 160, 'rgba(255,220,170,.9)', 0.05);
  },

  // ===== TAXI DRIVER: the street's neon through two layers of blinds, a moire that crawls as you walk =====
  taxi(c, r, g, X, K) {
    const { THREE } = c;
    // the ceiling: water stains and a crack, a walk up in Hell's Kitchen
    reskin(c, findSlab(g, 6.05), c.canvasTex(512, 512, (q, w, h) => {
      q.fillStyle = '#4a4036'; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) { const x = Math.random() * w, y = Math.random() * h, R = 30 + Math.random() * 90, gr = q.createRadialGradient(x, y, R * 0.4, x, y, R); gr.addColorStop(0, 'rgba(60,40,20,.0)'); gr.addColorStop(0.85, 'rgba(70,45,20,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - R, y - R, 2 * R, 2 * R); }
      q.strokeStyle = 'rgba(20,14,10,.8)'; q.lineWidth = 2; q.beginPath(); let x = 0, y = h * 0.4; q.moveTo(x, y); while (x < w) { x += 10 + Math.random() * 30; y += (Math.random() - 0.5) * 30; q.lineTo(x, y); } q.stroke();
      q.globalAlpha = 0.12; for (let i = 0; i < 4000; i++) { q.fillStyle = i % 2 ? '#000' : '#bba'; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }), { roughness: 0.95 });
    // THE ILLUSION: over the screen, a window of vertical blinds with the street's neon behind them, the two sets of
    // slats a hand apart and a hair off parallel. Walk across the room and bands of light crawl the other way.
    const WX = 10, WY = 5.2, WW = 11.6, WH = 1.4;
    const neonBack = c.canvasTex(1024, 128, (q, w, h) => { q.fillStyle = '#05030a'; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 9) { q.fillStyle = x % 27 ? '#ff2a5a' : '#ff8a3a'; q.fillRect(x, 0, 4, h); } });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: neonBack, toneMapped: false })); back.material.color.setScalar(1.6); put(g, back, WX, WY, -7.86);
    back.rotation.z = 0.025;
    const slat = c.canvasTex(1024, 64, (q, w, h) => { q.clearRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { q.fillStyle = '#0d0a08'; q.fillRect(x, 0, 5, h); } });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: slat, transparent: true, alphaTest: 0.5 })); put(g, front, WX, WY, -7.42);
    const fr = K.std(0x2a1a10, { roughness: 0.6 });
    g.add(c.slab(WW + 0.3, 0.12, 0.6, fr, WX, WY - WH / 2 - 0.06, -7.62)); g.add(c.slab(WW + 0.3, 0.12, 0.6, fr, WX, WY + WH / 2 + 0.06, -7.62));
    [-WW / 2 - 0.1, -WW / 6, WW / 6, WW / 2 + 0.1].forEach((dx) => g.add(c.slab(0.12, WH + 0.2, 0.6, fr, WX + dx, WY, -7.62)));
    hazeCard(c, g, WW, 3.4, 0xff3060, 0.1, WX, WY - 2.3, -7.3).rotation.x = PI;
    c.clickable(front, () => { c.sound.tick(); c.egg('taxi_blinds', 'Two sets of blinds and the street in between. MLow counts the stripes when he cannot sleep and never gets the same number twice.'); }, 'The blinds');
    let fl = 0; c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fl = Math.sin(t * 2.7) + Math.sin(t * 9.1) > -1.2 ? 1.6 : 0.5; back.material.color.setScalar(fl); });
    // the three bare bulbs throw cones down through the smoke
    [[6, -3.4], [13.4, -2.2], [10, 3.2]].forEach(([x, z]) => shaft(c, g, x, 5.7, z, { r1: 0.06, r2: 1.6, h: 5.6, col: 0xffd8a0, op: 0.05 }));
    motes(c, K, g, r, [1, 19, 0.6, 5.2, -7, 7], 150, 'rgba(200,210,230,.7)', 0.07);
    // a cast iron radiator, hissing
    const rad = new THREE.Group(); rad.position.set(19.55, 0, 0.9); rad.rotation.y = -PI / 2; g.add(rad); c.post(X(19.4), 0.9, 0.4);
    const iron = K.std(0x8a7a62, { metalness: 0.6, roughness: 0.5 }); for (let i = 0; i < 14; i++) rad.add(c.slab(0.07, 0.75, 0.22, iron, -0.55 + i * 0.085, 0.47, 0)); rad.add(c.slab(1.25, 0.06, 0.24, iron, 0, 0.08, 0)); rad.add(c.slab(1.25, 0.05, 0.24, iron, 0, 0.86, 0));
    K.steam(g, 19.3, 0.9, 0.6);
    // a cab's roof light on the floor, lit, OFF DUTY
    const rl = new THREE.Group(); rl.position.set(8.6, 0, 1.0); rl.rotation.y = 0.4; g.add(rl); c.post(X(8.6), 1.0, 0.45);
    const lit = neon(c, 'MLOW CAB\nOFF DUTY', { w: 0.9, h: 0.32, fg: '#0b1020', bg: '#f5c542', font: c.MONO, glow: 0 }); lit.material.color.setScalar(1.4);
    rl.add(c.slab(0.96, 0.36, 0.3, K.std(0xf5c542, { roughness: 0.4 }), 0, 0.18, 0)); put(rl, lit, 0, 0.2, 0.152); put(rl, lit.clone(), 0, 0.2, -0.152, PI);
    glow(c, K, rl, 0, 0.3, 0, 1.4, 'rgba(255,210,90,.45)');
    // a threadbare rug under the table
    floorArt(c, K, g, 3.0, 2.2, (q, w, h) => { q.fillStyle = '#5a1a14'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a050'; q.lineWidth = 10; q.strokeRect(16, 16, w - 32, h - 32); q.strokeStyle = '#1a2a4a'; q.lineWidth = 6; q.strokeRect(40, 40, w - 80, h - 80);
      q.save(); q.translate(w / 2, h / 2); q.fillStyle = '#c8a050'; for (let i = 0; i < 8; i++) { q.rotate(PI / 4); q.beginPath(); q.ellipse(50, 0, 46, 14, 0, 0, 7); q.fill(); } q.restore();
      q.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 600; i++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`; q.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 2); } }, 11.4, -0.8, 0.1);
    // the television on its side, flickering blue on the floor
    const tvg = glow(c, K, g, 8.0, 0.35, -2.2, 1.8, 'rgba(120,160,255,.5)');
    c.tick((t, dt, P, ri) => { if (near(r, ri)) tvg.material.opacity = 0.6 + Math.sin(t * 13) * 0.2 + Math.sin(t * 31) * 0.15; });
    // clippings pinned over the dresser
    [[1.4, 2.9, '#e8e0cc', 'CABBIE\nCOUNTS\nCITY'], [2.4, 3.1, '#f4ead2', 'NIGHT\nSHIFT'], [3.4, 2.85, '#e0d8c0', 'WHO IS\nCOUNTED']].forEach(([x, y, bg, t], i) => put(g, c.sign(t, { w: 0.6, h: 0.75, bg, fg: '#1a1a1a', font: c.SERIF, weight: 900, pad: 0.16 }), x, y, -7.85, 0).rotation.z = (i - 1) * 0.08);
  },

  // ===== BIG: a Beuchet chair. From the star the giant chair is whole and the New Yorker on it is tiny. =====
  big(c, r, g, X, K) {
    const { THREE } = c;
    // a painted sky on the ceiling, for a shop that sells wishes
    reskin(c, findSlab(g, 6.05), c.canvasTex(512, 512, (q, w, h) => {
      const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7ab8f0'); gr.addColorStop(1, '#bfe0ff'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { const x = Math.random() * w, y = Math.random() * h; q.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 6; k++) { q.beginPath(); q.arc(x + k * 18 - 45, y + Math.sin(k) * 10, 22 + Math.random() * 14, 0, 7); q.fill(); } }
      for (let i = 0; i < 30; i++) { q.fillStyle = '#fff6c0'; const x = Math.random() * w, y = Math.random() * h; q.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, R = k % 2 ? 3 : 8; q.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } q.fill(); }
    }), { roughness: 0.9, emissive: 0x2a4a6a, emissiveIntensity: 0.25 });
    // THE ILLUSION: the chair. Its legs stand here at the piano; its seat and back are 2.4 times as far away and
    // 2.4 times as big, all on rays from one eye. From the star they meet, and whoever sits up there is a doll.
    const V = new THREE.Vector3(7.4, 1.62, 5.8), k = 2.4, cx = 7.4, hw = 0.8, zf = 2.25, zb = 1.95, sy = 1.05;
    const paint = K.std(0xff4fa3, { roughness: 0.45 }), paint2 = K.std(0x22d3ee, { roughness: 0.45 }), yel = K.std(0xf5c542, { roughness: 0.45 });
    [[cx - hw, zf], [cx + hw, zf], [cx - hw, zb], [cx + hw, zb]].forEach(([x, z], i) => { g.add(c.slab(0.09, sy, 0.09, i < 2 ? paint2 : paint, x, sy / 2, z)); c.post(X(x), z, 0.12); });
    g.add(c.slab(2 * hw + 0.09, 0.1, 0.06, yel, cx, 0.35, zf)); g.add(c.slab(0.06, 0.1, zf - zb, yel, cx - hw, 0.35, (zf + zb) / 2)); g.add(c.slab(0.06, 0.1, zf - zb, yel, cx + hw, 0.35, (zf + zb) / 2));
    const seatTex = c.canvasTex(512, 256, (q, w, h) => { q.fillStyle = '#ff4fa3'; q.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#ff79bd' : '#ff4fa3'; q.fillRect(i * w / 8, 0, w / 8, h); } });
    const backTex = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#22d3ee'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 24; q.strokeRect(20, 20, w - 40, h - 40); K.eyeFlower(q, w / 2, h * 0.42, 130); q.fillStyle = '#0b1020'; q.font = `900 64px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('MLOW TOYS', w / 2, h * 0.86); });
    const far = new THREE.Group(); g.add(far);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2 * hw + 0.12, 0.09, zf - zb + 0.12), [paint, paint, new THREE.MeshStandardMaterial({ map: seatTex, roughness: 0.5 }), paint, paint, paint]);
    seat.position.set(cx, sy + 0.045, (zf + zb) / 2); along(c, V, seat, k, seat.position.clone()); far.add(seat);
    const bk = new THREE.Mesh(new THREE.BoxGeometry(2 * hw + 0.12, 0.85, 0.08), [paint2, paint2, paint2, paint2, new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 })]);
    bk.position.set(cx, sy + 0.09 + 0.425, zb - 0.02); along(c, V, bk, k, bk.position.clone()); far.add(bk);
    // a riser under the far seat, hidden by the seat itself from the star
    const sb = new THREE.Box3().setFromObject(seat); g.add(c.slab(sb.max.x - sb.min.x - 0.3, sb.min.y, sb.max.z - sb.min.z - 0.3, K.std(0x1a1a22), cx, sb.min.y / 2, (sb.min.z + sb.max.z) / 2));
    c.wall(X(sb.min.x), sb.max.z, X(sb.max.x), sb.max.z); c.wall(X(sb.min.x), sb.min.z, X(sb.max.x), sb.min.z); c.wall(X(sb.min.x), sb.min.z, X(sb.min.x), sb.max.z); c.wall(X(sb.max.x), sb.min.z, X(sb.max.x), sb.max.z);
    const doll = K.extra(g, cx + 0.3, (sb.min.z + sb.max.z) / 2 + 0.1, { seated: true, col: 0xf5c542, ry: 0 }); doll.position.y = sb.max.y - 0.45;
    floorArt(c, K, g, 1.0, 1.0, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? w * 0.2 : w * 0.47; q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q.fill(); q.fillStyle = '#0b1020'; q.font = `800 ${h * 0.075}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND HERE', w / 2, h * 0.53); q.fillText('LOOK AT THE CHAIR', w / 2, h * 0.62); }, V.x, V.z, 0, 256);
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (Math.hypot(P.x - r.x0 - V.x, P.z - V.z) < 0.4) { c.camera.getWorldDirection(fw); if (fw.z < -0.9) c.egg('big_chair', 'From the star the chair is whole and the New Yorker on it is the size of a toy. Step off the star and the seat is across the shop. Big is just where you stand.'); } });
    c.clickable(seat, () => c.toast('Stand on the gold star by the entrance and look at the chair.'), 'The big chair');
    // balloons tethered to the shelves and drifting at the ceiling
    const bal = []; const sGeo = new THREE.SphereGeometry(0.22, 16, 12);
    [[3, -6.6], [4.2, 6.6], [7.4, -6.8], [12.6, 6.8], [16.2, 6.5], [18.2, -2.4], [1.4, -2.6], [14.4, -6.9], [6.4, 6.9]].forEach(([x, z], i) => {
      const col = [0xff4fa3, 0x22d3ee, 0xf5c542, 0x3b82f6, 0xff7a1a][i % 5], m = new THREE.Mesh(sGeo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.15, clearcoat: 1, emissive: col, emissiveIntensity: 0.25 })); m.scale.set(1, 1.2, 1);
      const y = 4.6 + (i % 3) * 0.4; m.position.set(x, y, z); g.add(m); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, y - 1.6, 3), K.std(0xffffff)); st.position.set(x, (y + 1.6) / 2 - 0.15, z); g.add(st); bal.push({ m, st, y, ph: i });
    });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; for (const b of bal) { const dy = Math.sin(t * 0.8 + b.ph) * 0.12; b.m.position.y = b.y + dy; b.m.rotation.z = Math.sin(t * 0.6 + b.ph) * 0.1; } });
    // a toy biplane on a wire, circling under the sky
    const pl = new THREE.Group(); g.add(pl); const red = K.std(0xc8102e, { roughness: 0.4 });
    pl.add(c.slab(0.9, 0.16, 0.16, red, 0, 0, 0)); pl.add(c.slab(0.24, 0.03, 1.3, yel, 0.12, 0.1, 0)); pl.add(c.slab(0.24, 0.03, 1.3, yel, 0.12, -0.1, 0)); pl.add(c.slab(0.12, 0.25, 0.04, red, -0.42, 0.12, 0)); pl.add(c.slab(0.1, 0.03, 0.5, red, -0.42, 0.02, 0));
    const prop = c.slab(0.02, 0.5, 0.06, K.std(0x333333), 0.47, 0, 0); pl.add(prop);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const a = t * 0.35; pl.position.set(10 + Math.cos(a) * 6.5, 5.0 + Math.sin(t * 0.9) * 0.2, 0.5 + Math.sin(a) * 4.5); pl.rotation.set(0, -a - PI / 2, -0.35); prop.rotation.x = t * 40; });
    // the shop's neon, either side of the window onto Fifth
    put(g, neon(c, 'MLOW TOYS', { w: 3.2, h: 0.7, fg: '#ff4fa3', font: c.SERIF, weight: 900 }), 2.0, 4.4, -7.86);
    put(g, neon(c, 'WISHES 2ND FLOOR', { w: 3.2, h: 0.4, fg: '#22d3ee', font: c.MONO }), 18.0, 4.4, -7.86);
    // light from the globe lamps, and confetti in it
    [[5, -3.6], [15, -3.6], [5, 4.2], [15, 4.2]].forEach(([x, z]) => shaft(c, g, x, 5.0, z, { r1: 0.2, r2: 1.7, h: 5.0, col: 0xfff0d0, op: 0.07 }));
    motes(c, K, g, r, [2, 18, 0.3, 5.6, -7, 7], 140, 'rgba(255,120,200,.95)', 0.07);
    motes(c, K, g, r, [2, 18, 0.3, 5.6, -7, 7], 100, 'rgba(120,230,255,.95)', 0.07);
  },

  // ===== THE SEVEN YEAR ITCH: the grate opens onto a station that is not there, and the 6 train runs through it =====
  itch(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: the grate's gaps were painted black. Now they are open, and under them is a tiled shaft, the
    // track bed and, every fifteen seconds, the train: true parallax on a quad lying on the pavement.
    const gm = g.children.find((o) => o.isMesh && o.geometry?.parameters?.width === 5.2 && Math.abs(o.position.y - 0.012) < 0.002);
    if (gm) { gm.material = new THREE.MeshStandardMaterial({ map: c.canvasTex(512, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#7a8088'; for (let x = 0; x < w; x += 16) q.fillRect(x, 0, 5, h); for (let y = 0; y < h; y += 64) q.fillRect(0, y, w, 6); q.strokeStyle = '#8b9096'; q.lineWidth = 10; q.strokeRect(0, 0, w, h); }), metalness: 0.85, roughness: 0.35, alphaTest: 0.5 }); }
    const lamp = g.children.find((o) => o.isPointLight && Math.abs(o.position.y - 0.3) < 0.01);
    const uTr = { value: 0 };
    const pit = interior(c, 5.2, 2.8, 4.5, `
      vec3 tiles(vec2 m){ vec2 tl = fract(m / vec2(0.3, 0.15)); float gr = step(0.06, tl.x) * step(0.1, tl.y); return mix(vec3(0.25), vec3(0.86, 0.84, 0.76), gr); }
      vec3 shade(int f, vec2 uv, vec3 p){
        float dep = -p.z, lit = 0.25 + 0.75 * exp(-dep * 0.45), x = p.x + uT * 26.0 * uTr;
        vec3 col;
        if (f == 0) {
          float tie = step(0.72, fract(p.x / 0.6)), rail = smoothstep(0.03, 0.0, abs(abs(p.y) - 0.5));
          col = mix(vec3(0.09, 0.08, 0.07), vec3(0.22, 0.15, 0.1), tie) + vec3(0.6) * rail;
          col *= 0.5 + 0.5 * hsh(floor(p.xy * 40.0));
          if (uTr > 0.05) { float seam = step(0.94, fract(x / 2.4)); col = mix(vec3(0.55, 0.57, 0.6) * (0.7 + 0.3 * step(0.5, fract(p.y * 3.0))), vec3(0.05), seam); }
        } else {
          vec2 m = (f == 1 || f == 2) ? vec2(p.y, dep) : vec2(p.x, dep);
          col = tiles(m);
          if (dep > 0.55 && dep < 0.75) col = vec3(0.45, 0.08, 0.12) * (0.8 + 0.2 * step(0.5, fract(m.x * 2.0)));
          if (uTr > 0.05 && dep > 2.6) { float win = step(0.3, fract(x / 1.2)) * step(dep, 3.6); col = mix(vec3(0.5, 0.52, 0.56), vec3(2.6, 2.3, 1.6), win); }
        }
        return col * lit * (1.0 + uTr * 1.6 * (0.7 + 0.3 * sin(uT * 40.0)));
      }`, { uTr }, 'uniform float uTr;');
    put(g, pit, 10, 0.004, -2.0, 0, -PI / 2);
    c.tick((t, dt, P, ri) => { if (near(r, ri) && lamp) uTr.value += (Math.min(1, lamp.intensity / 8) - uTr.value) * Math.min(1, dt * 6); });
    c.clickable(pit, () => { c.sound.boom(0.3); c.egg('itch_pit', 'Look down through the grate: tile, rails, the 6 train. MLow painted none of it and all of it is down there.'); }, 'Look down');
    const up = []; for (let i = 0; i < 5; i++) up.push(hazeCard(c, g, 1.2, 2.6, 0xdde6ff, 0, 8 + i, 1.3, -2.0 + (i % 2) * 0.6, i));
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; up.forEach((m, i) => { m.material.opacity = uTr.value * 0.16; m.position.y = 1.3 + ((t * 0.7 + i * 0.3) % 1) * 0.8; m.rotation.y = i + t * 0.2; }); });
    // the subway entrance globes, green as they always are, and the lamps along Lexington
    [[6.2, -4.6], [13.8, -4.6]].forEach(([x, z]) => {
      g.add(c.slab(0.08, 2.4, 0.08, K.std(0x1a3a24, { metalness: 0.6, roughness: 0.4 }), x, 1.2, z)); c.post(X(x), z, 0.15);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), K.basic(0x5cff8a)); gl.material.color.multiplyScalar(1.6); gl.position.set(x, 2.55, z); g.add(gl);
      glow(c, K, g, x, 2.55, z, 1.6, 'rgba(90,255,140,.5)'); put(g, neon(c, 'UPTOWN 6', { w: 0.9, h: 0.16, fg: '#f4ead2', font: c.MONO, glow: 6, k: 1.2 }), x, 2.15, z + 0.05);
    });
    [[2.2, -5], [17.8, -5]].forEach(([x, z]) => { glow(c, K, g, x, 4.45, z, 2.2, 'rgba(255,220,150,.6)'); shaft(c, g, x, 4.4, z, { r1: 0.15, r2: 2.0, h: 4.4, col: 0xffd8a0, op: 0.07 }); });
    // a crosswalk and a rain slick on the pavement
    floorArt(c, K, g, 12, 2.6, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(240,236,220,.85)'; for (let x = 0; x < w; x += 64) q.fillRect(x + 8, 8, 34, h - 16); q.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.6})`; q.fillRect(Math.random() * w, Math.random() * h, 4, 3); } }, 10, 5.6, 0, 512);
    [[4.6, 3.6, 2.2, 0.3], [14.8, 2.4, 1.6, -0.5], [9.0, 6.6, 1.4, 1.2]].forEach(([x, z, s, a]) => { const p = floorArt(c, K, g, s, s * 0.55, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(10,14,22,.8)'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.48, h * 0.44, 0, 0, 7); q.fill(); }, x, z, a, 256); p.material.roughness = 0.04; p.material.metalness = 0.8; });
    // neon on the north wall, either side of the marquee
    put(g, neon(c, 'N3W-LUX\nNEWSREEL', { w: 2.6, h: 1.0, fg: '#22d3ee', font: c.SERIF, weight: 900 }), 2.2, 6.6, -7.86);
    put(g, neon(c, 'COOL INSIDE', { w: 2.6, h: 0.5, fg: '#7ad8ff', font: c.SERIF, weight: 900 }), 17.8, 6.8, -7.86);
    put(g, neon(c, 'AIR CONDITIONED', { w: 2.6, h: 0.3, fg: '#ff4fa3', font: c.MONO }), 17.8, 6.3, -7.86);
    // moths round the lamps, and night air
    motes(c, K, g, r, [1, 19, 1.0, 6, -7, 7], 120, 'rgba(255,230,180,.85)', 0.06);
    // bunting of flash bulbs strung over the street for the shoot
    const sag = []; for (let i = 0; i <= 30; i++) { const u = i / 30; sag.push([1 + u * 18, 6.4 - Math.sin(u * PI) * 0.8, -3.2]); } bulbLine(c, g, r, sag, 0xfff2d0, 0.06, 2.2, 5, 4);
    for (let i = 0; i <= 30; i++) { const u = i / 30; sag[i] = [1 + u * 18, 6.0 - Math.sin(u * PI) * 0.7, 1.6]; } bulbLine(c, g, r, sag, 0xffd0e0, 0.06, 2.0, 4, 3);
  },

  // ===== DO THE RIGHT THING: rotating snakes on the wall of fame, a drift you can only see from the side of your eye =====
  heat(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: peripheral drift. Rings of black, dark, white and light segments in the block's colours; the brain
    // reads the luminance steps as motion, and the wheels turn whenever you are not looking straight at them.
    const snakes = (q, w, h, bg) => {
      q.fillStyle = bg; q.fillRect(0, 0, w, h);
      const SEQ = ['#0b0b0b', '#1d4ed8', '#ffffff', '#f5c542'], F = [0.3, 0.2, 0.3, 0.2];
      const disc = (cx, cy, R, dir) => { for (let j = 0; j < 5; j++) { const r1 = R * (1 - j * 0.19), r2 = r1 - R * 0.17, n = 14 + j * -2; for (let i = 0; i < n; i++) { let a = i / n * PI * 2 + j * 0.2; for (let s = 0; s < 4; s++) { const da = PI * 2 / n * F[s]; q.fillStyle = SEQ[dir > 0 ? s : 3 - s]; q.beginPath(); q.arc(cx, cy, r1, a, a + da); q.arc(cx, cy, r2, a + da, a, true); q.fill(); a += da; } } } q.fillStyle = '#c8102e'; q.beginPath(); q.arc(cx, cy, R * 0.12, 0, 7); q.fill(); };
      const N = 3, R = w / N / 2; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) disc(R + i * 2 * R, R + j * 2 * R, R * 0.96, (i + j) % 2 ? 1 : -1);
    };
    const mural = (x, bg) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshStandardMaterial({ map: c.canvasTex(1024, 1024, (q, w, h) => snakes(q, w, h, bg)), roughness: 0.8 })); put(g, m, x, 6.4, -7.85); return m; };
    const m1 = mural(2.0, '#2f8a3a'), m2 = mural(18.0, '#c8102e');
    const cap = c.sign('THE WALL KEEPS TURNING. LOOK AWAY.', { w: 3.6, h: 0.3, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); put(g, cap, 2.0, 4.4, -7.84);
    [m1, m2].forEach((m) => c.clickable(m, () => { c.sound.pop(); c.egg('heat_snakes', 'Look straight at a wheel and it stops. Look at the next one and the first starts up again. Bed-Stuy in August, nothing on this block holds still.'); }, 'The wall'));
    // the same, painted on the street for the block party
    const dr = floorArt(c, K, g, 3.0, 3.0, (q, w, h) => { q.clearRect(0, 0, w, h); q.save(); q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 4, 0, 7); q.clip(); snakes(q, w * 3, h * 3, '#c8102e'); q.restore(); }, 9.4, 2.4, 0.3, 512);
    dr.material.opacity = 0.92;
    // a rainbow standing in the hydrant's spray
    const rb = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 8, 48, PI), new THREE.MeshBasicMaterial({ map: c.canvasTex(8, 64, (q, w, h) => { ['#ff2a2a', '#ff8a1a', '#ffe23a', '#3adf5a', '#3a8aff', '#8a3aff'].forEach((col, i) => { q.fillStyle = col; q.fillRect(0, i * h / 6, w, h / 6); }); }), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    put(g, rb, 9.6, 0.1, -2.2, 0.15);
    c.clickable(rb, () => { c.sound.ding(); c.egg('heat_rainbow', 'A rainbow over Stuyvesant Avenue, made with one wrench and a hundred and three degrees. MLow says it is the only free thing on the block.'); }, 'A rainbow');
    c.tick((t, dt, P, ri) => { if (near(r, ri)) rb.material.opacity = 0.24 + Math.sin(t * 1.3) * 0.08; });
    // sunlight raking down between the buildings
    [[6, 0.35], [12.5, 0.25], [16.5, 0.4]].forEach(([x, a], i) => { const s = hazeCard(c, g, 2.4, 11, 0xffc070, 0.09, x, 5.0, -3 + i * 2.5, 0.3); s.rotation.z = a; });
    motes(c, K, g, r, [1, 19, 0.4, 7, -7, 7], 150, 'rgba(255,190,110,.9)', 0.06);
    // laundry across the street, two lines of it, moving in what passes for a breeze
    const wash = []; [[6.6, 3.2], [7.8, -1.0]].forEach(([y, z]) => {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 19.4, 4), K.std(0xeeeeee)); line.rotation.z = PI / 2; line.position.set(10, y + 0.05, z); g.add(line);
      for (let i = 0; i < 9; i++) { const col = ['#f4ead2', '#ff4fa3', '#22d3ee', '#f5c542', '#ffffff', '#c8102e'][((i + z * 3 | 0) % 6 + 6) % 6], w = 0.5 + (i % 3) * 0.2;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.7), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, side: THREE.DoubleSide })); m.geometry.translate(0, -0.35, 0); m.position.set(1.8 + i * 2.0, y, z); g.add(m); wash.push(m); }
    });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; wash.forEach((m, i) => { m.rotation.x = Math.sin(t * 1.4 + i) * 0.18; }); });
    // the corner: a pizzeria in neon, a double yellow line, hopscotch in chalk
    put(g, neon(c, 'MLOW\'S FAMOUS\nPIZZERIA', { w: 3.0, h: 1.0, fg: '#ff3b1f', font: c.SERIF, weight: 900 }), 2.0, 3.4, -7.86);
    put(g, neon(c, 'NAZAR COLA', { w: 3.0, h: 0.6, fg: '#f5c542', font: c.SERIF, weight: 900 }), 18.0, 3.6, -7.86);
    floorArt(c, K, g, 19, 0.3, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.fillRect(0, h * 0.1, w, h * 0.3); q.fillRect(0, h * 0.6, w, h * 0.3); }, 10, 0.6, 0, 256);
    floorArt(c, K, g, 1.2, 3.2, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(255,255,255,.85)'; q.lineWidth = 6; const s = h / 8; [[0, 1], [1, 1], [2, 2], [3, 1], [4, 2], [5, 1], [6, 2], [7, 1]].forEach(([k, n], i) => { for (let j = 0; j < n; j++) q.strokeRect(n === 1 ? w / 4 : j * w / 2 + 4, h - (k + 1) * s, n === 1 ? w / 2 : w / 2 - 8, s - 4); q.fillStyle = '#fff'; q.font = `700 ${s * 0.4}px ${c.FONT}`; q.textAlign = 'center'; q.fillText(String(i + 1), w / 2, h - k * s - s * 0.35); }); }, 15.2, 5.4, 0.2, 256);
  },

  // ===== GHOSTBUSTERS: shadows that do not match the things that cast them =====
  ghost(c, r, g, X, K) {
    const { THREE } = c;
    // pressed tin over the bay
    reskin(c, findSlab(g, 6.05), c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#5a5a5e'; q.fillRect(0, 0, w, h); q.strokeStyle = '#8a8a90'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20); q.strokeStyle = '#3a3a3e'; q.lineWidth = 3; q.strokeRect(30, 30, w - 60, h - 60); q.beginPath(); q.arc(w / 2, h / 2, 50, 0, 7); q.stroke(); q.beginPath(); q.arc(w / 2, h / 2, 25, 0, 7); q.stroke(); for (let i = 0; i < 8; i++) { q.save(); q.translate(w / 2, h / 2); q.rotate(i * PI / 4); q.fillStyle = '#7a7a80'; q.fillRect(55, -4, 40, 8); q.restore(); } }), { metalness: 0.5, roughness: 0.45 });
    // THE ILLUSION: three shadows on the firehouse floor, and none of them belongs to what is standing over it.
    // The car throws a ghost with its arms up, the pole throws something green and round, and yours is not yours.
    const sil = (draw) => c.canvasTex(256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.filter = 'blur(3px)'; q.fillStyle = '#fff'; draw(q, w, h); });
    const ghostS = sil((q, w, h) => { q.beginPath(); q.arc(w / 2, h * 0.36, w * 0.22, PI, 0); q.lineTo(w * 0.72, h * 0.82); for (let i = 0; i < 5; i++) q.lineTo(w * (0.72 - (i + 0.5) * 0.088), h * (i % 2 ? 0.82 : 0.9)); q.lineTo(w * 0.28, h * 0.36); q.fill(); q.fillRect(w * 0.12, h * 0.2, w * 0.12, h * 0.3); q.fillRect(w * 0.76, h * 0.2, w * 0.12, h * 0.3); });
    const blobS = sil((q, w, h) => { q.beginPath(); q.ellipse(w / 2, h * 0.55, w * 0.36, h * 0.3, 0, 0, 7); q.fill(); q.beginPath(); q.arc(w * 0.3, h * 0.25, w * 0.08, 0, 7); q.arc(w * 0.7, h * 0.25, w * 0.08, 0, 7); q.fill(); q.fillRect(w * 0.1, h * 0.45, w * 0.8, h * 0.08); });
    const shadow = (tex, s, col = 0x000000, op = 0.7) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: col, alphaMap: tex, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -PI / 2; m.position.y = 0.02; g.add(m); return m; };
    const puftS = sil((q, w, h) => { q.beginPath(); q.arc(w / 2, h * 0.2, w * 0.13, 0, 7); q.fill(); q.beginPath(); q.ellipse(w / 2, h * 0.55, w * 0.27, h * 0.27, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w * 0.2, h * 0.42, w * 0.08, h * 0.16, 0.6, 0, 7); q.ellipse(w * 0.8, h * 0.42, w * 0.08, h * 0.16, -0.6, 0, 7); q.fill(); q.fillRect(w * 0.33, h * 0.75, w * 0.12, h * 0.22); q.fillRect(w * 0.55, h * 0.75, w * 0.12, h * 0.22); });
    const s1 = shadow(ghostS, 3.0, 0x000000, 0.8); s1.position.set(13.2, 0.02, 2.0);
    const s2 = shadow(blobS, 2.2, 0x0a3a10, 0.8); s2.position.set(16.4, 0.02, -2.9);
    const s4 = shadow(puftS, 4.2, 0x000000, 0.75); s4.position.set(5.7, 0.02, -0.6);
    const s3 = shadow(ghostS, 1.6, 0x000000, 0.65);
    [s1, s2, s3, s4].forEach((s) => c.clickable(s, () => { c.sound.squeak?.(); c.egg('ghost_shadow', 'That is not your shadow. Yours went up to the bunks an hour ago, and MLow counted it twice on the way.'); }, 'A shadow'));
    let lx = 0, lz = 0;
    c.tick((t, dt, P, ri) => {
      if (!near(r, ri)) return;
      s1.rotation.z = Math.sin(t * 0.5) * 0.12; s1.scale.setScalar(1 + Math.sin(t * 0.9) * 0.05); s4.rotation.z = Math.sin(t * 0.3) * 0.08;
      s2.position.x = 16.4 + Math.sin(t * 0.7) * 0.4; s2.rotation.z = t * 0.3;
      // your shadow walks behind you, a step late and not quite where the lights would put it
      const px = P.x - r.x0, pz = P.z; lx += (px + 0.9 - lx) * Math.min(1, dt * 1.2); lz += (pz + 1.4 - lz) * Math.min(1, dt * 1.2);
      s3.position.set(lx, 0.021, lz); s3.rotation.z = Math.sin(t * 2) * 0.15;
    });
    // ectoplasm: a puddle by the containment unit that glows, and mist that rises off it
    const ecto = floorArt(c, K, g, 2.4, 1.6, (q, w, h) => { q.clearRect(0, 0, w, h); const gr = q.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(150,255,90,1)'); gr.addColorStop(0.6, 'rgba(60,200,40,.85)'); gr.addColorStop(1, 'rgba(0,80,0,0)'); q.fillStyle = gr; q.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2, R = w * (0.32 + Math.random() * 0.14); q.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R * 0.7); } q.fill(); }, 18.2, 0.4, 0, 256);
    ecto.material.emissive = new THREE.Color(0x3aff2a); ecto.material.emissiveIntensity = 1.4; ecto.material.emissiveMap = ecto.material.map;
    glow(c, K, g, 18.2, 0.3, 0.4, 2.4, 'rgba(90,255,60,.45)');
    motes(c, K, g, r, [16.8, 19.4, 0.05, 2.6, -0.4, 1.2], 50, 'rgba(120,255,80,.9)', 0.09);
    // the alarm beacon over the bay door, turning
    const bea = new THREE.Group(); bea.position.set(10, 4.75, -7.6); g.add(bea);
    bea.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, PI * 2, 0, PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2030).multiplyScalar(2), toneMapped: false })));
    const beam = shaft(c, bea, 0, 0.08, 0, { r1: 0.05, r2: 1.3, h: 5, col: 0xff2030, op: 0.18, rz: PI / 2 }); beam.position.set(0, 0.08, 0);
    const bg2 = glow(c, K, bea, 0, 0.1, 0.1, 1.4, 'rgba(255,40,50,.7)');
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; bea.rotation.y = t * 4; bg2.material.opacity = 0.5 + 0.5 * Math.max(0, Math.cos(t * 4)); });
    // the bay floor: hazard stripes along the car's path, KEEP CLEAR in yellow
    floorArt(c, K, g, 3.4, 9, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(245,197,66,.85)'; q.fillRect(0, 0, 14, h); q.fillRect(w - 14, 0, 14, h); q.save(); q.translate(w / 2, h * 0.85); q.font = `900 ${w * 0.16}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('KEEP', 0, -w * 0.2); q.fillText('CLEAR', 0, 0); q.restore(); }, 8.6, 1.8, 0, 512);
    // ghost wisps that drift through the bay and fade when you look at them
    const wisp = [], fw = new THREE.Vector3(), wp = new THREE.Vector3();
    for (let i = 0; i < 6; i++) { const s = glow(c, K, g, 0, 0, 0, 1.2, 'rgba(180,255,220,.5)'); wisp.push({ s, ph: i * 1.1, op: 0 }); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; c.camera.getWorldDirection(fw);
      wisp.forEach((w) => { const a = t * 0.15 + w.ph; w.s.position.set(10 + Math.cos(a) * 7, 2.6 + Math.sin(t * 0.6 + w.ph) * 1.4, Math.sin(a * 1.3) * 5); w.s.getWorldPosition(wp); wp.sub(c.camera.position).normalize();
        const seen = wp.dot(fw) > 0.93; w.op += ((seen ? 0.05 : 0.7) - w.op) * Math.min(1, dt * 3); w.s.material.opacity = w.op; }); });
    // a neon sign for the firm
    put(g, neon(c, 'N3W YORK\nGHOST COUNT', { w: 3.0, h: 0.9, fg: '#22ff88', font: c.SERIF, weight: 900 }), 2.0, 3.6, -7.86);
    put(g, neon(c, 'WE COUNT\nWHAT YOU CANNOT SEE', { w: 3.2, h: 0.7, fg: '#ff4060', font: c.MONO }), 18.0, 3.6, -7.86);
  },

  // ===== NIGHT AT THE MUSEUM: two reverspectives, galleries that turn to follow you as you walk the rotunda =====
  natm(c, r, g, X, K) {
    const { THREE } = c;
    // the rotunda's coffers, and a skylight full of moon
    reskin(c, findSlab(g, 6.05), c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#2a2420'; q.fillRect(0, 0, w, h); for (let k = 0; k < 4; k++) { q.fillStyle = ['#4a4038', '#3a322c', '#5a4e44', '#2e2824'][k]; q.fillRect(30 + k * 26, 30 + k * 26, w - 60 - k * 52, h - 60 - k * 52); } q.fillStyle = '#b89a5a'; q.beginPath(); q.arc(w / 2, h / 2, 26, 0, 7); q.fill(); }), { roughness: 0.7 });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#16244a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e8eeff'; q.beginPath(); q.arc(w * 0.62, h * 0.4, 34, 0, 7); q.fill(); for (let i = 0; i < 60; i++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2); q.strokeStyle = '#0a0a10'; q.lineWidth = 8; q.strokeRect(0, 0, w, h); q.beginPath(); q.moveTo(w / 2, 0); q.lineTo(w / 2, h); q.moveTo(0, h / 2); q.lineTo(w, h / 2); q.stroke(); }), toneMapped: false }));
    sky.material.color.setScalar(1.5); put(g, sky, 10, 5.98, -0.5, 0, PI / 2);
    shaft(c, g, 10, 5.95, -0.5, { r1: 1.7, r2: 2.4, h: 5.95, col: 0x9cb8ff, op: 0.08 });
    motes(c, K, g, r, [7.5, 12.5, 0.2, 5.8, -3, 2], 90, 'rgba(190,210,255,.9)', 0.05);
    // THE ILLUSION: reverspective, after Patrick Hughes. Three blocks stick out of the wall at you, and each is painted
    // as a gallery running away from you. The nearest point is painted as the farthest, so as you walk past, the
    // galleries swing round to follow you.
    const T = (draw) => c.canvasTex(256, 256, draw);
    const floorT = T((q, w, h) => { for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) { q.fillStyle = (i + j) % 2 ? '#e8e0d0' : '#5a4a3a'; q.fillRect(i * w / 6, j * h / 8, w / 6, h / 8); } });
    const ceilT = T((q, w, h) => { q.fillStyle = '#3a3026'; q.fillRect(0, 0, w, h); for (let j = 0; j < 6; j++) { q.fillStyle = '#c8a860'; q.fillRect(0, j * h / 6, w, 5); q.fillStyle = '#fff2c8'; q.beginPath(); q.arc(w / 2, j * h / 6 + h / 12, 10, 0, 7); q.fill(); } });
    const wallT = T((q, w, h) => { q.fillStyle = '#6a2a24'; q.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) { const y = j * h / 4 + 8; q.fillStyle = '#c8a050'; q.fillRect(w * 0.25, y, w * 0.5, h / 4 - 22); q.fillStyle = ['#2a4a6a', '#e8d8b0', '#3a5a3a', '#8a3a2a'][j]; q.fillRect(w * 0.3, y + 6, w * 0.4, h / 4 - 34); } });
    const endT = T((q, w, h) => { q.fillStyle = '#f8e8c0'; q.fillRect(0, 0, w, h); const gr = q.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#d8b070'); q.fillStyle = gr; q.fillRect(0, 0, w, h); K.eyeFlower(q, w / 2, h * 0.45, w * 0.28); q.fillStyle = '#2a1a10'; q.fillRect(w * 0.3, h * 0.78, w * 0.4, h * 0.08); });
    const mFloor = new THREE.MeshBasicMaterial({ map: floorT }), mCeil = new THREE.MeshBasicMaterial({ map: ceilT }), mWallL = new THREE.MeshBasicMaterial({ map: wallT, color: 0xd8d0c8 }), mWallR = new THREE.MeshBasicMaterial({ map: wallT, color: 0xa89888 }), mEnd = new THREE.MeshBasicMaterial({ map: endT });
    const quad = (a, b, c2, d) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c2, ...a, ...c2, ...d], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); return geo; };
    const block = (grp, x, bw, bh, tw, th, p) => {
      const B = [[x - bw / 2, bh / 2, 0], [x + bw / 2, bh / 2, 0], [x + bw / 2, -bh / 2, 0], [x - bw / 2, -bh / 2, 0]], Tp = [[x - tw / 2, th / 2, p], [x + tw / 2, th / 2, p], [x + tw / 2, -th / 2, p], [x - tw / 2, -th / 2, p]];
      grp.add(new THREE.Mesh(quad(B[3], B[2], Tp[2], Tp[3]), mFloor)); grp.add(new THREE.Mesh(quad(B[0], B[1], Tp[1], Tp[0]), mCeil));
      grp.add(new THREE.Mesh(quad(B[0], B[3], Tp[3], Tp[0]), mWallL)); grp.add(new THREE.Mesh(quad(B[2], B[1], Tp[1], Tp[2]), mWallR));
      grp.add(new THREE.Mesh(quad(Tp[3], Tp[2], Tp[1], Tp[0]), mEnd));
      grp.children.slice(-5).forEach((m) => { m.material.side = THREE.DoubleSide; });
    };
    const rev = [];
    [2.0, 18.0].forEach((cx) => {
      const grp = new THREE.Group(); grp.position.set(cx, 4.2, -7.84); g.add(grp); rev.push(grp);
      grp.add(c.slab(3.7, 2.1, 0.04, K.std(0x1a1410, { roughness: 0.8 }), 0, 0, -0.02)); grp.add(c.slab(3.9, 0.1, 0.1, K.std(0xc8a050, { metalness: 1, roughness: 0.3 }), 0, 1.08, 0)); grp.add(c.slab(3.9, 0.1, 0.1, K.std(0xc8a050, { metalness: 1, roughness: 0.3 }), 0, -1.08, 0));
      [-1.2, 0, 1.2].forEach((x) => block(grp, x, 1.15, 1.9, 0.34, 0.56, 0.62));
    });
    const lab = c.sign('REVERSPECTIVE · AFTER HUGHES · WALK PAST IT', { w: 3.6, h: 0.2, bg: '#0b1020', fg: '#d8b878', font: c.MONO, weight: 700 }); put(g, lab, 2.0, 3.0, -7.84);
    rev.forEach((grp) => c.clickable(grp, () => { c.sound.ding(); c.egg('natm_reverse', 'The far end of each gallery is the part nearest your nose. Walk past and the halls swing round after you, the way every exhibit here does after dark.'); }, 'The galleries'));
    // torches on the side walls, flickering
    const fl = [];
    [[0.3, 0.4, PI / 2], [0.3, 6.4, PI / 2], [19.5, 0.4, -PI / 2], [19.5, 6.4, -PI / 2], [19.5, -6.6, -PI / 2]].forEach(([x, z, ry]) => {
      const b = new THREE.Group(); b.position.set(x, 2.7, z); b.rotation.y = ry; g.add(b);
      b.add(c.slab(0.12, 0.5, 0.12, K.std(0x3a2a1a, { metalness: 0.5 }), 0, -0.25, 0.1)); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.16, 12), K.std(0xb08a3a, { metalness: 1, roughness: 0.3 })); cup.position.set(0, 0.04, 0.14); b.add(cup);
      const f = glow(c, K, b, 0, 0.22, 0.14, 0.5, 'rgba(255,170,60,.95)'), h2 = glow(c, K, b, 0, 0.3, 0.25, 2.2, 'rgba(255,140,40,.35)'); fl.push([f, h2]);
    });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; fl.forEach(([f, h2], i) => { const k = 0.8 + Math.sin(t * 13 + i) * 0.1 + Math.sin(t * 7.3 + i * 2) * 0.1; f.scale.set(0.42 * k, 0.6 * k, 1); h2.material.opacity = k * 0.9; }); });
    // a brass compass rose let into the rotunda floor
    floorArt(c, K, g, 4.4, 4.4, (q, w, h) => { q.clearRect(0, 0, w, h); q.translate(w / 2, h / 2); q.strokeStyle = '#b8923a'; q.lineWidth = 10; q.beginPath(); q.arc(0, 0, w * 0.47, 0, 7); q.stroke(); q.lineWidth = 4; q.beginPath(); q.arc(0, 0, w * 0.4, 0, 7); q.stroke();
      for (let i = 0; i < 16; i++) { q.save(); q.rotate(i * PI / 8); q.fillStyle = i % 2 ? '#8a6a2a' : '#d8b058'; q.beginPath(); q.moveTo(0, -w * (i % 4 ? 0.26 : 0.38)); q.lineTo(w * 0.04, 0); q.lineTo(-w * 0.04, 0); q.fill(); q.restore(); }
      q.fillStyle = '#1a2a4a'; q.beginPath(); q.arc(0, 0, w * 0.06, 0, 7); q.fill(); q.fillStyle = '#d8b058'; q.font = `900 ${w * 0.06}px ${c.SERIF}`; q.textAlign = 'center'; ['N', 'E', 'S', 'W'].forEach((s, i) => { q.save(); q.rotate(i * PI / 2); q.fillText(s, 0, -w * 0.415); q.restore(); }); }, 10, 1.6, 0, 1024);
    // the tablet, under glass, waking the hall
    const vit = new THREE.Group(); vit.position.set(7.0, 0, 6.3); g.add(vit); c.post(X(7.0), 6.3, 0.6);
    vit.add(c.slab(1.0, 0.8, 0.7, K.std(0x2a1a10, { roughness: 0.5 }), 0, 0.4, 0));
    const tab = c.slab(0.5, 0.36, 0.05, K.std(0xd8a838, { metalness: 1, roughness: 0.25, emissive: 0x8a5a10, emissiveIntensity: 0.6 }), 0, 0.98, 0); tab.rotation.x = -0.35; vit.add(tab);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, roughness: 0.02, metalness: 0.1 })); gl.position.y = 1.05; vit.add(gl);
    const tg = glow(c, K, vit, 0, 1.0, 0, 1.6, 'rgba(255,200,90,.6)');
    c.tick((t, dt, P, ri) => { if (near(r, ri)) tg.material.opacity = 0.6 + Math.sin(t * 2.2) * 0.3; });
    c.clickable(vit, () => { c.sound.ding(); c.egg('natm_tablet', 'The tablet of the counted. At sundown it wakes every exhibit and every New Yorker in the hall, and at sunrise MLow slides it back under the glass.'); }, 'The tablet');
    // the night guard's flashlight, sweeping the hall
    K.extra(g, 14.8, 6.2, { col: 0x1a2a4a, ry: PI + 0.4 }); c.post(X(14.8), 6.2, 0.3);
    const beam = new THREE.Group(); beam.position.set(14.8, 1.3, 5.9); g.add(beam);
    shaft(c, beam, 0, 0, 0, { r1: 0.04, r2: 1.1, h: 9, col: 0xfff0c8, op: 0.12, rx: -PI / 2 + 0.08 });
    glow(c, K, beam, 0, 0, -0.1, 0.6, 'rgba(255,245,210,.9)');
    c.tick((t, dt, P, ri) => { if (near(r, ri)) beam.rotation.y = 0.5 + Math.sin(t * 0.5) * 0.6; });
    // banners hung from the coffers
    [['DINOSAURS', '#8a1a1a', 4.6], ['THE COUNTED', '#1a2a5a', 15.4]].forEach(([t2, bg, x]) => { const s = c.sign(t2.split('').join('\n'), { w: 0.9, h: 3.6, bg, fg: '#f4ead2', font: c.SERIF, weight: 900, pad: 0.04 }); s.material.toneMapped = true; put(g, s, x, 3.9, 6.9, PI); });
  },
  // ===== THE WARRIORS: Ponzo rails down the boardwalk. Two lights of one length, and the far one looks longer =====
  coney(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: two rails converge from the entrance to the wheel, and two neon tubes of exactly the same length
    // lie across them, one near and one far. The rails say the far one is far, so your eye stretches it.
    const steel = K.std(0x8a8a90, { metalness: 0.9, roughness: 0.3 }), wood = K.std(0x4a3424, { roughness: 0.9 });
    const RX = 9.0, Z1 = 6.4, Z2 = -5.6, W1 = 2.6, W2 = 0.55, rail = (s) => { const x1 = RX + s * W1, x2 = RX + s * W2, len = Math.hypot(x2 - x1, Z2 - Z1); const m = c.slab(0.07, 0.07, len, steel, (x1 + x2) / 2, 0.035, (Z1 + Z2) / 2); m.rotation.y = Math.atan2(x2 - x1, Z2 - Z1); g.add(m); };
    rail(-1); rail(1);
    const N = 22, ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 0.16), wood, N), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), qq = new THREE.Quaternion(), pp = new THREE.Vector3();
    for (let i = 0; i < N; i++) { const u = i / (N - 1), z = Z1 + (Z2 - Z1) * u, w = 2 * (W1 + (W2 - W1) * u) + 0.4; m4.compose(pp.set(RX, 0.015, z), qq, sc.set(w, 1, 1 - u * 0.6)); ties.setMatrixAt(i, m4); } g.add(ties);
    const tube = (z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12), K.basic(0xff4fa3)); m.material.color.multiplyScalar(2.2); m.rotation.z = PI / 2; m.position.set(RX, 0.2, z); g.add(m); [-0.5, 0.5].forEach((dx) => g.add(c.slab(0.04, 0.2, 0.04, steel, RX + dx, 0.1, z))); glow(c, K, g, RX, 0.24, z, 1.6, 'rgba(255,79,163,.45)'); return m; };
    const t1 = tube(1.0), t2 = tube(-4.8);
    floorArt(c, K, g, 3.6, 0.5, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `800 ${h * 0.42}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('BOTH LIGHTS ARE 1.3 M. MEASURE THEM.', w / 2, h * 0.65); }, RX, 5.2, 0, 256);
    [t1, t2].forEach((m) => c.clickable(m, () => { c.sound.ding(); c.egg('coney_ponzo', 'Same length, both of them. The far one only looks longer because the rails told you it was far. The Warriors walked all the way home on that kind of lie.'); }, 'A light on the rails'));
    // dawn over the ocean: pink rays down through the haze, gulls overhead
    [[4, 0.5], [9, 0.3], [15, 0.45]].forEach(([x, a], i) => hazeCard(c, g, 3, 12, 0xffa0c8, 0.08, x, 5.5, -5.5 + i * 0.6, 0.15).rotation.z = a);
    motes(c, K, g, r, [1, 19, 0.3, 6, -7, 7], 120, 'rgba(255,190,220,.8)', 0.06);
    const gulls = []; const wingM = K.std(0xf0f0f0, { roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) { const b = new THREE.Group(); g.add(b); const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), wingM), wr = wl.clone(); wl.geometry = wl.geometry.clone().translate(-0.25, 0, 0); wr.geometry = wr.geometry.clone().translate(0.25, 0, 0); wl.rotation.x = wr.rotation.x = -PI / 2; b.add(wl, wr); b.add(c.slab(0.08, 0.06, 0.26, wingM, 0, 0, 0)); gulls.push({ b, wl, wr, R: 5 + i * 1.6, h: 6.5 + i * 0.6, ph: i * 1.3 }); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; gulls.forEach((q) => { const a = t * 0.18 + q.ph; q.b.position.set(10 + Math.cos(a) * q.R, q.h + Math.sin(t * 0.7 + q.ph) * 0.4, -1 + Math.sin(a) * q.R * 0.6); q.b.rotation.y = -a; const f = Math.sin(t * 6 + q.ph) * 0.5; q.wl.rotation.z = f; q.wr.rotation.z = -f; }); });
    c.clickable(gulls[0].b, () => { c.sound.gull?.(); }, 'A gull');
    // the lamps on the boardwalk, still on at dawn
    [[18.8, 1.0], [1.2, 6.8]].forEach(([x, z]) => { glow(c, K, g, x, 4.45, z, 2.0, 'rgba(255,220,170,.6)'); });
    // pennants strung over the boardwalk
    const pen = []; for (let i = 0; i < 24; i++) { const u = i / 23, m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.45), new THREE.MeshStandardMaterial({ color: [0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff][i % 4], side: THREE.DoubleSide, roughness: 0.8 })); m.geometry.translate(0, -0.22, 0); m.position.set(1 + u * 18, 5.4 - Math.sin(u * PI) * 0.6, 3.2); g.add(m); pen.push(m); }
    c.tick((t, dt, P, ri) => { if (near(r, ri)) pen.forEach((m, i) => { m.rotation.x = Math.sin(t * 2 + i * 0.7) * 0.25; }); });
    // neon for the food stands, either side of the wheel
    put(g, neon(c, 'HOT DOGS · CLAMS\nKNISHES · MLOW', { w: 3.4, h: 0.9, fg: '#ffb04a', font: c.SERIF, weight: 900 }), 17.6, 4.0, -7.86);
    put(g, neon(c, 'N3W YORKERS\nCOME OUT TO PLAY', { w: 3.4, h: 0.9, fg: '#22d3ee', font: c.SERIF, weight: 900 }), 2.4, 6.4, -7.86);
    // sand blown up onto the boards, and the gang's tag on them
    [[2.6, 5.6, 3.4], [17.4, 6.4, 2.6], [17.8, -2.6, 2.2]].forEach(([x, z, s]) => floorArt(c, K, g, s, s * 0.6, (q, w, h) => { q.clearRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const a = Math.random() * 7, R = Math.sqrt(Math.random()) * 0.48; q.fillStyle = `rgba(${200 + Math.random() * 40},${170 + Math.random() * 30},${120 + Math.random() * 30},${0.5 + Math.random() * 0.5})`; q.fillRect(w / 2 + Math.cos(a) * R * w, h / 2 + Math.sin(a) * R * h, 3, 3); } }, x, z, Math.random(), 256));
    floorArt(c, K, g, 2.6, 2.6, (q, w, h) => { q.clearRect(0, 0, w, h); q.globalAlpha = 0.85; K.eyeFlower(q, w / 2, h * 0.42, w * 0.3); q.fillStyle = '#ff4fa3'; q.font = `900 ${h * 0.13}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('THE COUNTED', w / 2, h * 0.9); }, 4.6, 1.4, 0.4, 512);
  },

  // ===== JOKER: a Penrose triangle over the step street that only closes from the foot of the stairs =====
  stairs(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: three beams at right angles, an open path in space. From the star at the foot of the steps the
    // far end of the last beam lands exactly on the start of the first, and the three close into a triangle that
    // cannot exist. Every cross section is scaled to its distance from that eye, so the beams read as one even bar.
    const V = new THREE.Vector3(10, 1.62, 5.8), A = new THREE.Vector3(14.0, 5.3, -5.6), dA = V.distanceTo(A), L = 2.3, s = 0.34;
    const u = V.clone().sub(A).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), u);
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(u, 0.25));
    const e = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((v) => v.applyQuaternion(q));
    const Pt = [A.clone()]; e.forEach((ei, i) => Pt.push(Pt[i].clone().addScaledVector(ei, L)));
    const mats = [0xc8102e, 0xe0a020, 0x2f8a3a].map((col) => new THREE.MeshBasicMaterial({ color: col }));
    const tri = new THREE.Group(); g.add(tri); const ax = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      const dims = [s, s, s]; dims[i] = L + s; const geo = new THREE.BoxGeometry(...dims), pos = geo.attributes.position, mid = Pt[i].clone().add(Pt[i + 1]).multiplyScalar(0.5);
      for (let k = 0; k < pos.count; k++) { const a = [pos.getX(k), pos.getY(k), pos.getZ(k)]; ax.copy(mid).addScaledVector(e[i], a[i]); const f = V.distanceTo(ax) / dA; for (let j = 0; j < 3; j++) if (j !== i) a[j] *= f; pos.setXYZ(k, a[0], a[1], a[2]); }
      const m = new THREE.Mesh(geo, [mats[0], mats[0], mats[1], mats[1], mats[2], mats[2]]); m.position.copy(mid); m.quaternion.copy(q); tri.add(m);
    }
    const lb = glow(c, K, g, A.x, A.y, A.z - 0.6, 6, 'rgba(255,170,90,.25)');
    c.clickable(tri, () => { c.sound.ding(); c.egg('stairs_penrose', 'From the star the three beams close into a triangle that cannot exist. Highbridge has a staircase like that too, and you are standing at the bottom of it.'); }, 'The triangle');
    floorArt(c, K, g, 1.0, 1.0, (q2, w, h) => { q2.fillStyle = '#e0a020'; q2.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? w * 0.2 : w * 0.47; q2.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R); } q2.fill(); q2.fillStyle = '#0b1020'; q2.font = `800 ${h * 0.075}px ${c.MONO}`; q2.textAlign = 'center'; q2.fillText('STAND HERE', w / 2, h * 0.53); q2.fillText('LOOK UP RIGHT', w / 2, h * 0.62); }, V.x, V.z, 0, 256);
    const fw = new THREE.Vector3(), to = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; if (Math.hypot(P.x - r.x0 - V.x, P.z - V.z) < 0.4) { c.camera.getWorldDirection(fw); to.set(A.x + r.x0, A.y, A.z).sub(c.camera.position).normalize(); if (fw.dot(to) > 0.95) c.egg('stairs_penrose', 'From the star the three beams close into a triangle that cannot exist. Highbridge has a staircase like that too, and you are standing at the bottom of it.'); } });
    // dusk: sodium lamps, rays through the haze, leaves coming down
    [5.4, 14.6].forEach((x) => { glow(c, K, g, x, 6.5, -2.35, 2.4, 'rgba(255,170,70,.65)'); shaft(c, g, x, 6.4, -2.35, { r1: 0.12, r2: 1.8, h: 4.2, col: 0xffa040, op: 0.08 }); });
    [[3, 0.35], [10, 0.2], [17, 0.4]].forEach(([x, a], i) => hazeCard(c, g, 3.2, 12, 0xff9a40, 0.07, x, 6, -6.6 + i * 0.4, 0.1).rotation.z = a);
    motes(c, K, g, r, [2, 18, 0.2, 7, -6, 6], 110, 'rgba(230,120,40,.95)', 0.09, 0.15);
    // wires overhead with pigeons on them
    const wire = K.std(0x111111);
    [7.4, 8.2].forEach((y, j) => { for (let i = 0; i < 10; i++) { const u1 = i / 10, u2 = (i + 1) / 10, y1 = y - Math.sin(u1 * PI) * 0.7, y2 = y - Math.sin(u2 * PI) * 0.7, len = Math.hypot(2, y2 - y1), m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4), wire); m.position.set(u1 * 20 + 1, (y1 + y2) / 2, -1 + j * 2.6); m.rotation.z = PI / 2 + Math.atan2(y2 - y1, 2); g.add(m); } });
    [[4, 7.4 - Math.sin(0.2 * PI) * 0.7, -1], [4.6, 7.4 - Math.sin(0.23 * PI) * 0.7, -1], [12.6, 8.2 - Math.sin(0.58 * PI) * 0.7, 1.6], [13.4, 8.2 - Math.sin(0.62 * PI) * 0.7, 1.6], [15, 7.4 - Math.sin(0.7 * PI) * 0.7, -1]].forEach(([x, y, z], k) => c.glb('pigeon', { h: 0.3, x, y: y + 0.01, z, ry: k * 1.3, parent: g, shadow: false }));
    // tags on the low walls of the flight, and handbills on the steps of the street
    const tag = (txt, col) => K.decal(2.4, 0.9, (q2, w, h) => { q2.clearRect(0, 0, w, h); q2.font = `900 ${h * 0.55}px ${c.FONT}`; q2.textAlign = 'center'; q2.lineWidth = h * 0.06; q2.strokeStyle = '#0b1020'; q2.strokeText(txt, w / 2, h * 0.68); q2.fillStyle = col; q2.fillText(txt, w / 2, h * 0.68); }, 256);
    put(g, tag('MLow', '#22d3ee'), 5.68, 1.4, 1.4, -PI / 2); put(g, tag('SMILE, COUNTED', '#ff4fa3'), 14.32, 1.5, 1.2, PI / 2);
    const fl = K.flyer('COUNT ME'); [[3.4, 3.4, 0.4], [16.2, 4.6, 1.8], [5.2, 6.4, 2.6], [12.8, 6.8, 0.9], [2.0, 1.8, 2.2]].forEach(([x, z, a]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.32), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.9 })); m.rotation.set(-PI / 2, 0, a); m.position.set(x, 0.015, z); g.add(m); });
    K.steam(g, 4.6, 0.05, 4.4);
    floorArt(c, K, g, 0.9, 0.9, (q2, w, h) => { q2.fillStyle = '#2a2a2e'; q2.beginPath(); q2.arc(w / 2, h / 2, w / 2 - 2, 0, 7); q2.fill(); q2.strokeStyle = '#555'; q2.lineWidth = 6; for (let i = 1; i < 5; i++) { q2.beginPath(); q2.arc(w / 2, h / 2, i * w / 10, 0, 7); q2.stroke(); } q2.fillStyle = '#888'; q2.font = `800 ${h * 0.09}px ${c.MONO}`; q2.textAlign = 'center'; q2.fillText('N3W SEWER', w / 2, h * 0.53); }, 4.6, 4.4, 0, 256);
    // neon for the corner store under the steps
    put(g, neon(c, 'BODEGA\n24 HRS', { w: 2.6, h: 1.0, fg: '#ff3b6b', font: c.SERIF, weight: 900 }), 2.2, 3.6, -7.86);
    put(g, neon(c, 'HIGHBRIDGE', { w: 2.8, h: 0.5, fg: '#7ad8ff', font: c.MONO }), 17.8, 3.4, -7.86);
  },

  // ===== BREAKFAST AT TIFFANY'S: a cafe wall on Fifth. Every line is straight, none of them look it =====
  tiffany(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: the cafe wall. Rows of dark and pale tiles, each row nudged a quarter tile, with grey mortar
    // between. The mortar lines are dead level and they all look like they slope, on the walls and on the pavement.
    const cafe = (q, w, h, tw, th) => { q.fillStyle = '#8a8a88'; q.fillRect(0, 0, w, h); const off = [0, 0.25, 0.5, 0.25]; for (let j = 0; j * th < h; j++) { const o = off[j % 4] * tw * 2; for (let i = -2; i * tw < w + tw * 2; i++) { q.fillStyle = i % 2 ? '#0e0e10' : '#86d6ca'; q.fillRect(i * tw + o, j * th + 3, tw, th - 6); } } };
    [2.0, 18.0].forEach((x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 4.4), new THREE.MeshStandardMaterial({ map: c.canvasTex(512, 608, (q, w, h) => cafe(q, w, h, 56, 44)), roughness: 0.4, metalness: 0.1 })); put(g, m, x, 4.8, -7.85); c.clickable(m, () => { c.sound.ding(); c.egg('tiffany_cafe', 'Every line on the wall is dead level. MLow checked them with a spirit level at five in the morning, then went for coffee because they kept tilting.'); }, 'The tiles'); });
    const cap = c.sign('THE LINES ARE LEVEL. HONEST.', { w: 3.6, h: 0.26, bg: '#0e0e10', fg: '#86d6ca', font: c.MONO, weight: 700 }); put(g, cap, 2.0, 2.45, -7.84);
    floorArt(c, K, g, 12, 1.8, (q, w, h) => cafe(q, w, h, 64, 48), 10, 1.15, 0, 1024);
    // the pavement scored into flags, the kerb, the morning
    floorArt(c, K, g, 19.4, 15.4, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(40,36,44,.45)'; q.lineWidth = 3; for (let x = 0; x < w; x += w / 13) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, h); q.stroke(); } for (let y = 0; y < h; y += h / 10) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); } q.globalAlpha = 0.18; for (let i = 0; i < 120; i++) { q.fillStyle = '#1a1820'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, 7); q.fill(); } }, 10, 0, 0, 1024).position.y = 0.012;
    [[3, 0.32], [10, 0.22], [16, 0.38]].forEach(([x, a], i) => hazeCard(c, g, 3.2, 12, 0xffd0e0, 0.07, x, 6, -6.4 + i * 0.5, 0.2).rotation.z = -a);
    motes(c, K, g, r, [1, 19, 0.3, 6, -7, 7], 90, 'rgba(255,230,240,.8)', 0.05);
    [[16.1, 3.4], [3.4, 1.4]].forEach(([x, z]) => glow(c, K, g, x, 4.45, z, 1.6, 'rgba(255,236,200,.5)'));
    // green street blades on a corner post
    const post = new THREE.Group(); post.position.set(18.6, 0, 4.2); g.add(post); c.post(X(18.6), 4.2, 0.15);
    post.add(c.slab(0.08, 3.2, 0.08, K.std(0x2a3a2a, { metalness: 0.6, roughness: 0.5 }), 0, 1.6, 0));
    const blade = (t, y, ry) => { const s = c.sign(t, { w: 1.3, h: 0.24, bg: '#1f6a3a', fg: '#ffffff', font: c.FONT, weight: 700, border: '#ffffff' }); s.material.toneMapped = true; s.material.side = THREE.DoubleSide; put(post, s, 0, y, 0, ry); };
    blade('5 AV', 3.05, 0); blade('E 57 ST', 2.75, PI / 2);
    // pigeons working the pavement for crumbs
    const pig = [[8.2, 3.6], [8.7, 3.9], [12.4, 3.3]].map(([x, z], k) => c.glb('pigeon', { h: 0.3, x, z, ry: k * 2.1, parent: g }));
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; pig.forEach((p, k) => { p.rotation.x = Math.max(0, Math.sin(t * 3 + k * 2)) * 0.5; p.rotation.y = k * 2.1 + Math.sin(t * 0.4 + k) * 0.8; }); });
    // banners down the facade, and steam off the coffee
    [[1.0, 0x0e1830], [3.0, 0x86d6ca], [17.0, 0x86d6ca], [19.0, 0x0e1830]].forEach(([x, col], i) => { const s = c.sign('N3W\nYORKERS\n&\nCO.', { w: 0.8, h: 2.6, bg: '#' + col.toString(16).padStart(6, '0'), fg: i % 3 ? '#0e1830' : '#d8b878', font: c.SERIF, weight: 900, pad: 0.06 }); s.material.toneMapped = true; put(g, s, x, 8.4, -7.84); });
    K.steam(g, 3.2, 1.05, -4.4);
    put(g, neon(c, 'OPEN AT 5 A.M.', { w: 2.4, h: 0.36, fg: '#ffd8a0', font: c.SERIF, weight: 700, k: 1.3 }), 10, 4.55, 6.15, PI);
  },

  // ===== REAR WINDOW: an Ames window turning on a wire. It goes round and round; your eye says it only rocks =====
  rear(c, r, g, X, K) {
    const { THREE } = c;
    // joists across the ceiling and a pendant over the table
    const joist = K.std(0x3a2a1a, { roughness: 0.85 }); for (let x = 1.5; x < 20; x += 2.4) g.add(c.slab(0.18, 0.28, 16, joist, x, 5.86, 0));
    // THE ILLUSION: the Ames window. A trapezoid painted with the shading of a rectangular sash seen at an angle.
    // It turns a full circle, steadily, and your eye insists it only swings back and forth.
    const aw = c.canvasTex(512, 320, (q, w, h) => {
      q.clearRect(0, 0, w, h); const tl = [8, 8], tr = [w - 8, h * 0.2], br = [w - 8, h * 0.8], bl = [8, h - 8];
      const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], quadP = (u1, v1, u2, v2) => { const T1 = lerp(tl, tr, u1), B1 = lerp(bl, br, u1), T2 = lerp(tl, tr, u2), B2 = lerp(bl, br, u2); return [lerp(T1, B1, v1), lerp(T2, B2, v1), lerp(T2, B2, v2), lerp(T1, B1, v2)]; };
      const poly = (p, col) => { q.fillStyle = col; q.beginPath(); p.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.fill(); };
      poly(quadP(0, 0, 1, 1), '#e8e0cc');
      const cuts = [[0.06, 0.36], [0.4, 0.68], [0.71, 0.95]], rows = [[0.07, 0.47], [0.53, 0.93]];
      cuts.forEach(([u1, u2]) => rows.forEach(([v1, v2]) => { q.save(); q.globalCompositeOperation = 'destination-out'; poly(quadP(u1, v1, u2, v2), '#000'); q.restore(); poly(quadP(u1, v1, u1 + (u2 - u1) * 0.08, v2), 'rgba(80,60,40,.6)'); poly(quadP(u1, v1, u2, v1 + 0.04), 'rgba(80,60,40,.45)'); }));
      q.strokeStyle = '#6a5038'; q.lineWidth = 6; q.beginPath(); [tl, tr, br, bl, tl].forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.stroke();
    });
    const ames = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshStandardMaterial({ map: aw, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x2a2010, emissiveMap: aw }));
    const ag = new THREE.Group(); ag.position.set(13.4, 2.5, 1.2); g.add(ag); ag.add(ames);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.8, 4), K.std(0xcccccc)); wire.position.set(13.4, 4.5, 1.2); g.add(wire);
    c.tick((t, dt, P, ri) => { if (near(r, ri)) ag.rotation.y = t * 0.55; });
    c.clickable(ames, () => { c.sound.tick(); c.egg('rear_ames', 'It is turning all the way round. Your eyes swear it only rocks back and forth. MLow says that is the whole picture: you see what you already decided you saw.'); }, 'The turning window');
    const lab = c.sign('AMES WINDOW · IT TURNS ALL THE WAY ROUND', { w: 1.5, h: 0.1, bg: '#0b1020', fg: '#f5c542', font: c.MONO, weight: 700 }); lab.material.toneMapped = true; put(g, lab, 13.4, 1.75, 1.2); c.tick((t, dt, P, ri) => { if (near(r, ri)) lab.rotation.y = Math.atan2(P.x - r.x0 - 13.4, P.z - 1.2); });
    // moonlight from the courtyard lying in window shapes on the floor
    floorArt(c, K, g, 12, 4.2, (q, w, h) => { q.clearRect(0, 0, w, h); for (let i = 0; i < 4; i++) { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(150,180,255,.55)'); gr.addColorStop(1, 'rgba(150,180,255,0)'); q.fillStyle = gr; q.beginPath(); const x0 = 30 + i * w / 4, x1 = x0 + w / 4 - 60; q.moveTo(x0, 0); q.lineTo(x1, 0); q.lineTo(x1 + 60, h); q.lineTo(x0 + 60, h); q.fill(); } q.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 6; y < h; y += 22) q.fillRect(0, y, w, 6); }, 10, -4.6, 0, 512).material.blending = THREE.AdditiveBlending;
    hazeCard(c, g, 12, 4.4, 0x9cb8ff, 0.08, 10, 2.2, -6.9);
    // lamps: a pendant over the table, a floor lamp by the armchair, the window's candles
    const shadeM = new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb060, emissiveIntensity: 1.4, side: THREE.DoubleSide, roughness: 0.7 });
    const pend = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 20, 1, true), shadeM); pend.position.set(12.2, 2.6, -5.4); g.add(pend); g.add(c.slab(0.01, 3.2, 0.01, K.std(0x222222), 12.2, 4.35, -5.4)); glow(c, K, g, 12.2, 2.45, -5.4, 1.6, 'rgba(255,200,130,.6)');
    shaft(c, g, 12.2, 2.5, -5.4, { r1: 0.3, r2: 1.1, h: 2.5, col: 0xffc880, op: 0.09 });
    const fl2 = new THREE.Group(); fl2.position.set(17.4, 0, -4.4); g.add(fl2); c.post(X(17.4), -4.4, 0.25);
    fl2.add(c.slab(0.04, 1.6, 0.04, K.std(0x2a2a2a, { metalness: 0.6 }), 0, 0.8, 0)); put(fl2, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.36, 18, 1, true), shadeM), 0, 1.7, 0); glow(c, K, fl2, 0, 1.7, 0, 1.6, 'rgba(255,200,130,.55)');
    // a rug under the coffee table, and the heat: smoke from the cigarette in the ashtray
    floorArt(c, K, g, 3.4, 2.4, (q, w, h) => { q.fillStyle = '#2a3a5a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a050'; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28); q.strokeStyle = '#8a2a2a'; q.lineWidth = 14; q.strokeRect(40, 40, w - 80, h - 80); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { q.fillStyle = (i + j) % 2 ? '#8a2a2a' : '#c8a050'; q.beginPath(); q.arc(90 + i * (w - 180) / 5, 90 + j * (h - 180) / 2, 14, 0, 7); q.fill(); } }, 7.0, -1.4, 0, 512);
    motes(c, K, g, r, [2, 18, 0.5, 5.4, -7, 6], 100, 'rgba(200,210,240,.6)', 0.06);
    // a thermometer on the wall, 94 in the shade
    const th = c.sign('94°F', { w: 0.5, h: 0.24, bg: '#f4ead2', fg: '#c8102e', font: c.MONO, weight: 800 }); th.material.toneMapped = true; put(g, th, 19.6, 2.0, 3.0 - 3.6, -PI / 2);
  },

  // ===== SATURDAY NIGHT FEVER: a neon Necker cube spinning over the floor. Which way? Both. =====
  disco(c, r, g, X, K) {
    const { THREE } = c;
    // a black ceiling full of fibre optic stars
    reskin(c, findSlab(g, 6.05), c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#08060c'; q.fillRect(0, 0, w, h); q.strokeStyle = '#1a1424'; q.lineWidth = 2; for (let x = 0; x < w; x += 32) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, h); q.stroke(); q.beginPath(); q.moveTo(0, x); q.lineTo(w, x); q.stroke(); } }), { roughness: 0.3, metalness: 0.6 });
    const NS = c.MOBILE ? 120 : 240, sp = new Float32Array(NS * 3); for (let i = 0; i < NS; i++) { sp[i * 3] = 0.5 + Math.random() * 19; sp[i * 3 + 1] = 5.97; sp[i * 3 + 2] = -7.5 + Math.random() * 15; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ map: K.glowTex('rgba(255,255,255,1)'), size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(stars);
    c.tick((t, dt, P, ri) => { if (near(r, ri)) stars.material.size = 0.1 + Math.sin(t * 3) * 0.03; });
    // THE ILLUSION: a wire cube in neon, no walls, no shading, drawn through itself. It turns one way, steadily.
    // With nothing to say which edge is in front, your eye flips it, and it spins the other way. Then back.
    const cube = new THREE.Group(); cube.position.set(10, 5.0, -6.6); g.add(cube);
    const em = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff4fa3).multiplyScalar(2.2), toneMapped: false, depthWrite: false, transparent: true });
    const S = 1.5, edge = (a, b) => { const v = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, v.length(), 6), em); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.renderOrder = 10; cube.add(m); };
    const Vt = []; for (let i = 0; i < 8; i++) Vt.push(new THREE.Vector3(i & 1 ? S / 2 : -S / 2, i & 2 ? S / 2 : -S / 2, i & 4 ? S / 2 : -S / 2));
    for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) { const j = i ^ (1 << k); if (j > i) edge(Vt[i], Vt[j]); }
    cube.rotation.x = 0.42;
    c.tick((t, dt, P, ri) => { if (near(r, ri)) cube.rotation.y = t * 0.6; });
    glow(c, K, g, 10, 5.0, -6.9, 3.2, 'rgba(255,79,163,.25)');
    c.clickable(cube, () => { c.sound.ding(); c.egg('disco_cube', 'Left or right? It only ever turns one way. MLow says the floor is the same: everybody out there thinks they are the one leading.'); }, 'The cube');
    // coloured beams from the corners, sweeping the floor
    const beams = [[1, -7.4, 0xff4fa3], [19, -7.4, 0x22d3ee], [1, 7.4, 0xf5c542], [19, 7.4, 0x9b5cff]].map(([x, z, col]) => { const b = new THREE.Group(); b.position.set(x, 5.8, z); g.add(b); shaft(c, b, 0, 0, 0, { r1: 0.05, r2: 1.0, h: 9, col, op: 0.14 }); glow(c, K, b, 0, 0, 0, 0.8, 'rgba(255,255,255,.8)'); return b; });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; beams.forEach((b, i) => { b.rotation.set(0.5 + Math.sin(t * 0.9 + i) * 0.35, 0, 0); b.rotation.order = 'YXZ'; b.rotation.y = Math.atan2(10 - b.position.x, -b.position.z) + Math.sin(t * 0.7 + i * 1.7) * 0.6; b.rotation.x = -0.9 + Math.sin(t * 1.1 + i) * 0.25; }); });
    // a green laser fan from the booth
    const lz = new THREE.Group(); lz.position.set(18.2, 1.4, -6.4); g.add(lz); const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3aff6a).multiplyScalar(2), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const rays = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 14, 4), lm); m.geometry.translate(0, 7, 0); lz.add(m); rays.push(m); }
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; rays.forEach((m, i) => { m.rotation.set(-PI / 2 + 0.25 + Math.sin(t * 2.1) * 0.12, 0, 0); m.rotation.order = 'YXZ'; m.rotation.y = PI / 4 + (i - 3) * 0.16 + Math.sin(t * 0.8) * 0.4; }); lm.opacity = ((t * 4) | 0) % 5 ? 0.45 : 0.05; });
    // speaker stacks either side of the screen, cones that pump
    const cones = [];
    [3.1, 16.9].forEach((x) => { g.add(c.slab(1.3, 2.6, 0.9, K.std(0x111114, { roughness: 0.6 }), x, 1.3, -7.3)); c.post(X(x), -7.3, 0.7); [0.7, 1.6, 2.3].forEach((y, k) => { const s = new THREE.Mesh(new THREE.CircleGeometry(k === 2 ? 0.16 : 0.42, 24), new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.5, roughness: 0.4, emissive: 0x9b5cff, emissiveIntensity: 0.2 })); s.position.set(x, y, -6.84); g.add(s); cones.push(s); }); });
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const k = 1 + Math.max(0, Math.sin(t * 2 * PI * 1.8)) * 0.08; cones.forEach((s) => s.scale.setScalar(k)); });
    // a neon frame round the screen that chases colour
    const fr = []; for (let x = 4.2; x <= 15.8; x += 0.3) fr.push([x, 4.55, -7.8]); for (let y = 0.3; y < 4.55; y += 0.3) { fr.push([4.1, y, -7.8]); fr.push([15.9, y, -7.8]); }
    bulbLine(c, g, r, fr, 0xff4fa3, 0.05, 2.4, 3, 8);
    put(g, neon(c, 'DANCE', { w: 2.6, h: 0.8, fg: '#22d3ee', font: c.SERIF, weight: 900 }), 2.0, 4.6, -7.86);
    put(g, neon(c, 'BAY RIDGE', { w: 2.6, h: 0.6, fg: '#f5c542', font: c.SERIF, weight: 900 }), 18.0, 4.6, -7.86);
    motes(c, K, g, r, [1, 19, 0.5, 5.6, -7, 7], 140, 'rgba(220,200,255,.7)', 0.06);
  },

  // ===== GOODFELLAS: round windows in the kitchen doors look into a showroom that is not there =====
  copa(c, r, g, X, K) {
    const { THREE } = c;
    // THE ILLUSION: two swing doors at the end of the kitchen with portholes. Through them, true parallax: red booths,
    // a lamp on every table and the band on the stand. Walk past and the room slides by as a room should. Behind the
    // doors is a wall.
    const D0 = new THREE.Group(); D0.position.set(17.9, 0, -7.86); g.add(D0);
    const dm = K.std(0xb8bcc0, { metalness: 0.85, roughness: 0.3 });
    [-0.62, 0.62].forEach((dx) => { D0.add(c.slab(1.18, 2.5, 0.08, dm, dx, 1.25, 0.04)); D0.add(c.slab(0.9, 0.12, 0.09, K.std(0x4a4a50, { metalness: 0.8 }), dx, 0.9, 0.06)); });
    D0.add(c.slab(2.7, 0.14, 0.14, K.std(0x2a2a2e), 0, 2.57, 0.06)); [-1.33, 1.33].forEach((dx) => D0.add(c.slab(0.14, 2.6, 0.14, K.std(0x2a2a2e), dx, 1.3, 0.06)));
    const room = `
      vec3 shade(int f, vec2 uv, vec3 p){
        vec3 col; float dep = -p.z;
        if (f == 0) { col = vec3(0.55, 0.04, 0.07) * (0.55 + 0.45 * sin(p.x * 18.0) * sin(p.x * 18.0));
          if (p.y > 1.15) col = vec3(0.8, 0.6, 0.2) * (0.6 + 0.4 * step(0.5, fract(p.x * 8.0)));
          if (p.y < -0.9) col = vec3(0.35, 0.22, 0.12);
          col += vec3(0.9, 0.7, 0.4) * exp(-pow(length(vec2(p.x * 0.6, p.y + 0.3)), 2.0) * 2.0);
          float man = step(abs(fract(p.x * 0.9 + 0.5) - 0.5), 0.09) * step(-0.9, p.y) * step(p.y, -0.05) * step(abs(p.x), 2.2);
          float head = step(length(vec2(fract(p.x * 0.9 + 0.5) - 0.5, (p.y - 0.08) * 0.9)), 0.08) * step(abs(p.x), 2.2);
          col = mix(col, vec3(0.02), max(man, head)); }
        else if (f == 3) { vec2 cp = fract(vec2(p.x, p.z) * 1.5) - 0.5; col = mix(vec3(0.42, 0.04, 0.06), vec3(0.75, 0.55, 0.2), step(0.42, max(abs(cp.x), abs(cp.y)))); }
        else if (f == 4) { col = vec3(0.1, 0.03, 0.02) + vec3(1.4, 1.1, 0.6) * exp(-pow(length(vec2(p.x, fract(dep / 2.6) - 0.5)), 2.0) * 30.0); }
        else { float pil = step(abs(fract(dep / 1.6) - 0.5), 0.05); col = mix(vec3(0.28, 0.025, 0.04) * (0.8 + 0.2 * sin(p.y * 40.0) * sin(dep * 40.0)), vec3(0.85, 0.65, 0.25), pil);
          vec2 sc = vec2(fract(dep / 1.6) - 0.5, p.y - 0.4); col += vec3(1.8, 1.2, 0.6) * exp(-dot(sc, sc) * 90.0); }
        col *= 0.55 + 0.45 * exp(-dep * 0.08);
        return col;
      }
      vec3 lamps(vec3 o, vec3 d, float th){ vec3 s = vec3(0.0);
        for (int i = 0; i < 3; i++) for (int j = 0; j < 4; j++) { vec3 L = vec3(-2.0 + float(i) * 2.0, -0.62, -1.4 - float(j) * 1.6);
          float t = clamp(dot(L - o, d), 0.0, th); vec3 q = o + d * t - L; s += vec3(2.4, 1.6, 0.8) * exp(-dot(q, q) * 260.0) + vec3(0.25, 0.12, 0.05) * exp(-dot(q, q) * 12.0); }
        vec3 C = vec3(0.0, 1.2, -4.0); float t2 = clamp(dot(C - o, d), 0.0, th); vec3 q2 = o + d * t2 - C; s += vec3(0.8, 0.7, 0.5) * exp(-dot(q2, q2) * 60.0);
        return s; }`;
    const ports = [-0.62, 0.62].map((dx) => {
      const m = interior(c, 0.56, 0.56, 8, room.replace('vec3 shade(', 'vec3 base(') + `
        vec3 shade(int f, vec2 uv, vec3 p){ return base(f, uv, p); }`, {}, '', { bw: 6, bh: 3, ox: dx, oy: 0.1, circle: true });
      // add the table lamps: patch the main to fold them in
      m.material.fragmentShader = m.material.fragmentShader.replace('gl_FragColor = vec4(shade(f, uv, p), 1.);', 'gl_FragColor = vec4(shade(f, uv, p) + lamps(o, d, t), 1.);');
      put(D0, m, dx, 1.6, 0.095); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 8, 28), K.std(0xd8dce0, { metalness: 1, roughness: 0.2 })); put(D0, ring, dx, 1.6, 0.1); return m; });
    ports.forEach((m) => c.clickable(m, () => { c.sound.clink(1400); c.egg('copa_porthole', 'Through the round window: the room, the band, the best table. MLow says every great night has a kitchen in front of it and a door at the end.'); }, 'The round window'));
    put(g, neon(c, 'SHOWROOM', { w: 2.4, h: 0.5, fg: '#ff3b3b', font: c.SERIF, weight: 900 }), 17.9, 2.95, -7.6);
    put(g, neon(c, 'IN', { w: 0.5, h: 0.3, fg: '#5cff8a', font: c.MONO }), 17.28, 2.25, -7.76); put(g, neon(c, 'OUT', { w: 0.6, h: 0.3, fg: '#ff4060', font: c.MONO }), 18.52, 2.25, -7.76);
    // the exhaust hood over the range, ducts along the ceiling
    const ss = K.std(0xc8ccd0, { metalness: 0.9, roughness: 0.28 });
    g.add(c.slab(5.4, 0.7, 1.6, ss, 15.2, 4.6, 2.4)); const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 16), ss); hood.position.set(15.2, 5.3, 2.4); g.add(hood);
    const filt = c.canvasTex(256, 64, (q, w, h) => { q.fillStyle = '#6a6e74'; q.fillRect(0, 0, w, h); q.strokeStyle = '#3a3c40'; q.lineWidth = 2; for (let x = 0; x < w; x += 6) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 20, h); q.stroke(); } });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), new THREE.MeshStandardMaterial({ map: filt, metalness: 0.8, roughness: 0.4 })); fm.rotation.x = PI / 2; fm.position.set(15.2, 4.24, 2.4); g.add(fm);
    [[-2.4, 0.5], [2.4, 0.4]].forEach(([z, rr]) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 19, 18), ss); d.rotation.z = PI / 2; d.position.set(10, 5.5, z); g.add(d); for (let x = 1.5; x < 19; x += 2.5) { const band = new THREE.Mesh(new THREE.CylinderGeometry(rr + 0.02, rr + 0.02, 0.06, 18), K.std(0x8a8e94, { metalness: 1, roughness: 0.4 })); band.rotation.z = PI / 2; band.position.set(x, 5.5, z); g.add(band); } });
    // heat lamps over the pass, glowing
    [5.6, 6.2, 6.8].forEach((x) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), K.basic(0xff5a2a)); b.material.color.multiplyScalar(2.2); b.position.set(x, 1.95, 5.9); g.add(b); g.add(c.slab(0.01, 3.9, 0.01, K.std(0x222222), x, 3.95, 5.9)); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 16, 1, true), ss); sh.position.set(x, 2.07, 5.9); g.add(sh); });
    glow(c, K, g, 6.2, 1.8, 5.9, 2.0, 'rgba(255,90,40,.55)');
    // the ticket rail, orders fluttering
    g.add(c.slab(2.2, 0.04, 0.06, ss, 6.2, 1.55, 5.2)); const tk = [];
    for (let i = 0; i < 7; i++) { const s = c.sign(['TABLE 1\nVEAL', 'TABLE 4\nLOBSTER', 'TABLE 9\nGRAVY', 'TABLE 2\nSTEAK', 'TABLE 7\nCLAMS', 'TABLE 3\nMLow', 'TABLE 5\nCHAMP.'][i], { w: 0.2, h: 0.28, bg: '#f4ead2', fg: '#1a1a1a', font: c.MONO, weight: 700, pad: 0.1 }); s.material.toneMapped = true; s.material.side = THREE.DoubleSide; s.geometry.translate(0, -0.14, 0); put(g, s, 5.3 + i * 0.3, 1.54, 5.24); tk.push(s); }
    c.tick((t, dt, P, ri) => { if (near(r, ri)) tk.forEach((s, i) => { s.rotation.x = Math.sin(t * 2.3 + i) * 0.12; }); });
    // a rubber mat at the range and a floor drain
    floorArt(c, K, g, 5.0, 1.0, (q, w, h) => { q.fillStyle = '#18181a'; q.fillRect(0, 0, w, h); q.fillStyle = '#2e2e32'; for (let y = 8; y < h; y += 18) for (let x = (y / 18 % 2) * 9 + 4; x < w; x += 18) { q.beginPath(); q.arc(x, y, 6, 0, 7); q.fill(); } }, 15.2, 3.45, 0, 512);
    floorArt(c, K, g, 0.6, 0.6, (q, w, h) => { q.fillStyle = '#5a5c60'; q.fillRect(0, 0, w, h); q.fillStyle = '#0a0a0c'; for (let x = 10; x < w - 10; x += 18) q.fillRect(x, 12, 9, h - 24); }, 10, 0.9, 0, 128);
    // a waiter with a tray, up and down behind the shelves all night
    const wt = K.extra(g, 12, -4.8, { col: 0xf4f0e8, ry: PI / 2 }); const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 20), ss); tray.position.set(0.3, 1.42, 0); wt.add(tray);
    const cnd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), K.basic(0xffd890)); cnd.material.color.multiplyScalar(2); cnd.position.set(0.3, 1.5, 0); wt.add(cnd);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; const u = (Math.sin(t * 0.35) + 1) / 2, x = 12 + u * 6; wt.position.x = x; wt.rotation.y = Math.cos(t * 0.35) > 0 ? PI / 2 : -PI / 2; wt.position.y = Math.abs(Math.sin(t * 6)) * 0.03; });
    motes(c, K, g, r, [12, 18.4, 1.2, 5, 1.6, 3.2], 60, 'rgba(240,240,240,.5)', 0.08);
  },
};

export const SWAP = {};
