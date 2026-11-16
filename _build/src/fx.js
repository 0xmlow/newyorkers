// fx.js: the V2 toolbox the wing is built with. Materials that cannot exist in a shop (the six Spectaculars), pixel
// punks drawn by code, a halftone that prints the visitor, and the geometry that turns a box into a place: alcoves,
// columns, a mezzanine, stairs, a coffered ceiling, neon tubes. Everything takes the room context `c` from main.js.
const PI = Math.PI;

// ---------- the Spectaculars ----------
// hologram: a view dependent rainbow, like the foil on a card
export function hologram(c) {
  const { THREE } = c;
  const m = new THREE.MeshPhysicalMaterial({ color: 0xe8e8f0, metalness: 0.9, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [120, 700], envMapIntensity: 1.6 });
  m.userData.spectacular = 'Hologram'; return m;
}
// lava: a dark crust with molten light moving in the cracks (emissive map scrolled every frame)
export function lava(c) {
  const { THREE } = c;
  const tex = c.canvasTex(512, 512, (q, w, h) => {
    q.fillStyle = '#2a0c04'; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 18; const g = q.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,${120 + Math.random() * 100 | 0},20,0.9)`); g.addColorStop(1, 'rgba(60,10,0,0)'); q.fillStyle = g; q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); }
    q.globalCompositeOperation = 'multiply'; for (let i = 0; i < 300; i++) { q.fillStyle = 'rgba(20,5,2,.7)'; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, 4 + Math.random() * 12, Math.random() * 3, 0, 7); q.fill(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const m = new THREE.MeshStandardMaterial({ color: 0x1a0a06, roughness: 0.75, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.8 });
  c.tick((t) => { tex.offset.y = t * 0.03; tex.offset.x = Math.sin(t * 0.2) * 0.05; });
  m.userData.spectacular = 'Lava'; return m;
}
// bubble gum: pink, soft, a little see through at the edges
export function bubblegum(c) {
  const { THREE } = c;
  const m = new THREE.MeshPhysicalMaterial({ color: 0xff8fc0, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 1, sheenColor: new THREE.Color(0xffd0e8), transmission: 0.15, thickness: 0.4 });
  m.userData.spectacular = 'Bubble Gum'; return m;
}
// diamond: glass that bends the room, with a sparkle in the roughness
export function diamond(c) {
  const { THREE } = c;
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 2.4, envMapIntensity: 2.5, specularIntensity: 1, iridescence: 0.4, iridescenceIOR: 2.0 });
  m.userData.spectacular = 'Diamond'; return m;
}
export function gold(c) {
  const { THREE } = c;
  const m = new THREE.MeshStandardMaterial({ color: 0xffc44d, metalness: 1, roughness: 0.22, envMapIntensity: 1.8 });
  m.userData.spectacular = 'Gold'; return m;
}
export function emerald(c) {
  const { THREE } = c;
  const m = new THREE.MeshPhysicalMaterial({ color: 0x20c060, metalness: 0, roughness: 0.05, transmission: 0.85, thickness: 1.0, ior: 1.58, envMapIntensity: 2.0, attenuationColor: new THREE.Color(0x0a6a30), attenuationDistance: 0.8 });
  m.userData.spectacular = 'Emerald'; return m;
}
export const SPECTACULARS = { hologram, lava, bubblegum, diamond, gold, emerald };
// paint a loaded GLB (a vf_ character) in one material, keeping the ink outline black
export function recolor(root, mat) {
  root.traverse((o) => { if (o.isMesh && o.material) { const nm = (o.material.name || '').toLowerCase(); if (nm === 'ink' || nm === 'eyedark' || nm === 'eyewhite' || nm === 'eyeglint') return; o.material = mat; } });
}

// ---------- pixel punks: never a real punk, always a New Yorker with a flower for a head ----------
// 24 by 24, drawn by code from a seed, nearest neighbour so every pixel stays a pixel
export function punkCanvas(c, seed, px = 24, scale = 8) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const cv = document.createElement('canvas'); cv.width = cv.height = px * scale; const q = cv.getContext('2d'); q.imageSmoothingEnabled = false;
  const P = (x, y, col) => { q.fillStyle = col; q.fillRect(x * scale, y * scale, scale, scale); };
  const BG = ['#638596', '#8e6fb6', '#95554f', '#5c9c7b', '#b5a26b', '#4f6d9c'][seed % 6]; q.fillStyle = BG; q.fillRect(0, 0, cv.width, cv.height);
  const skin = ['#dbb180', '#ae8b61', '#713f1d', '#ead9d9', '#7da269', '#352410'][(seed * 7) % 6];
  // body and neck
  for (let y = 17; y < 24; y++) for (let x = 7; x < 17; x++) P(x, y, skin);
  for (let y = 14; y < 18; y++) for (let x = 10; x < 14; x++) P(x, y, skin);
  // the flower head: petals in a ring, an eye in the middle
  const petal = ['#f9c6dd', '#ffe08a', '#bfe3ff', '#d9b8ff', '#ffffff'][(seed * 3) % 5], edge = ['#ff4fa3', '#ff7a1a', '#22d3ee', '#9a6cff', '#f5c542'][(seed * 11) % 5];
  const cx = 12, cy = 8;
  for (let a = 0; a < 8; a++) { const ang = a / 8 * PI * 2; const x = Math.round(cx + Math.cos(ang) * 5.2), y = Math.round(cy + Math.sin(ang) * 5.2); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) P(x + dx, y + dy, (Math.abs(dx) + Math.abs(dy)) > 1 ? edge : petal); }
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 10) P(cx + dx, cy + dy, '#ffffff');
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 4) P(cx + dx, cy + dy, '#1d4ed8');
  P(cx, cy, '#0b1020'); P(cx - 1, cy - 1, '#ffffff');
  // an accessory, the punk way: a cap, shades, a cigarette, an earring, a mohawk
  const acc = (seed * 13) % 6;
  if (acc === 0) { for (let x = 6; x < 19; x++) P(x, 2, '#1a1a1a'); for (let x = 8; x < 17; x++) P(x, 1, '#1a1a1a'); for (let x = 16; x < 21; x++) P(x, 3, '#1a1a1a'); }
  if (acc === 1) { for (let x = 8; x < 17; x++) P(x, cy, '#101010'); P(7, cy, '#101010'); P(17, cy, '#101010'); }
  if (acc === 2) { for (let x = 16; x < 22; x++) P(x, 12, '#e8e8e8'); P(22, 12, '#ff7a1a'); P(23, 11, '#888'); }
  if (acc === 3) { P(6, 11, '#f5c542'); P(6, 12, '#f5c542'); }
  if (acc === 4) { for (let x = 10; x < 15; x++) for (let y = 0; y < 3; y++) P(x, y, edge); }
  if (acc === 5) { for (let x = 9; x < 16; x++) P(x, 3, '#5a2fa0'); P(8, 4, '#5a2fa0'); P(16, 4, '#5a2fa0'); }
  const t = new c.THREE.CanvasTexture(cv); t.colorSpace = c.THREE.SRGBColorSpace; t.magFilter = c.THREE.NearestFilter; t.minFilter = c.THREE.NearestFilter; t.generateMipmaps = false; t.userData.canvas = cv; t.userData.px = px; return t;
}
// a punk as a standing figure of cubes: one instanced cube per lit pixel, a voxel giant
export function voxelPunk(c, seed, size = 0.12, px = 24, depth = 3) {
  const { THREE } = c, t = punkCanvas(c, seed, px, 1), q = t.userData.canvas.getContext('2d'), d = q.getImageData(0, 0, px, px).data;
  const cells = [];
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) { const k = (y * px + x) * 4; cells.push([x, y, d[k], d[k + 1], d[k + 2]]); }
  const geo = new THREE.BoxGeometry(size, size, size * depth), mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }), cells.length);
  const M = new THREE.Matrix4(), col = new THREE.Color();
  cells.forEach(([x, y, r, g, b], i) => { M.makeTranslation((x - px / 2 + 0.5) * size, (px - y - 0.5) * size, 0); mesh.setMatrixAt(i, M); mesh.setColorAt(i, col.setRGB(r / 255, g / 255, b / 255).convertSRGBToLinear()); });
  mesh.instanceMatrix.needsUpdate = true; mesh.userData.cells = cells; mesh.userData.size = size; mesh.userData.px = px; return mesh;
}

// ---------- the halftone press: a render target seen through newspaper dots ----------
export function halftoneMaterial(c, texture) {
  const { THREE } = c;
  return new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: texture }, uScale: { value: 90 }, uInk: { value: new THREE.Color(0x1a1612) }, uPaper: { value: new THREE.Color(0xf4ead2) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uScale; uniform vec3 uInk, uPaper; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114));
        vec2 p = vUv * uScale; vec2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p; vec2 g = fract(r) - 0.5; float d = length(g);
        float dot_ = step(d, (1.0 - l) * 0.7); gl_FragColor = vec4(mix(uPaper, uInk, dot_), 1.0); }`, toneMapped: false });
}

// ---------- geometry that makes a box a place ----------
// an alcove: a niche built out from a wall into the room (the room's own wall is its back), with two sides, a roof, its
// own floor finish, a light and colliders, so the visitor can walk into it. The room walls are never cut.
// side: 'w' | 'e' | 's' (west, east, south wall); at: the position along that wall; w, d, h: width, depth, height
export function alcove(c, r, g, X, { side = 'w', at = 0, w = 2.4, d = 1.8, h = 2.8, mat, floorMat, light = 0xffd9a8 }) {
  const { THREE } = c, W = 20, D = 16, m = mat || c.surf('plaster', 2.4, 0x8a8070), fm = floorMat || m;
  const grp = new THREE.Group(); g.add(grp);
  // local frame: x runs across the opening, +z points out of the wall into the room, the back sits at z = -d/2
  let cx, cz, ry;
  if (side === 'w') { cx = d / 2 + 0.13; cz = at; ry = PI / 2; } else if (side === 'e') { cx = W - 0.38 - d / 2; cz = at; ry = -PI / 2; } else { cx = at; cz = D / 2 - 0.02 - d / 2; ry = PI; }
  grp.position.set(cx, 0, cz); grp.rotation.y = ry;
  const box = (sx, sy, sz, x, y, z, mm) => { const b = c.slab(sx, sy, sz, mm, x, y, z); grp.add(b); return b; };
  box(w, 0.03, d, 0, 0.015, 0, fm);                                   // its own floor finish
  box(w + 0.4, 0.14, d, 0, h + 0.07, 0, m);                           // the roof
  box(w + 0.4, 0.5, 0.14, 0, h + 0.25, d / 2 - 0.07, m);              // a lintel over the opening
  box(w - 0.02, h, 0.06, 0, h / 2, -d / 2 + 0.03, m);                 // a back lining, so the niche reads as its own place
  box(0.2, h + 0.14, d, -w / 2 - 0.1, (h + 0.14) / 2, 0, m); box(0.2, h + 0.14, d, w / 2 + 0.1, (h + 0.14) / 2, 0, m);
  const cs = Math.cos(ry), sn = Math.sin(ry), pt = (lx, lz) => [X(cx + lx * cs + lz * sn), cz - lx * sn + lz * cs];
  const a1 = pt(-w / 2 - 0.2, -d / 2), a2 = pt(-w / 2 - 0.2, d / 2), b1 = pt(w / 2 + 0.2, -d / 2), b2 = pt(w / 2 + 0.2, d / 2);
  c.wall(a1[0], a1[1], a2[0], a2[1]); c.wall(b1[0], b1[1], b2[0], b2[1]);
  if (light) { const l = new THREE.PointLight(light, 6, 6, 1.5); l.position.set(0, h - 0.4, 0); grp.add(l); }
  const o = pt(0, d / 2); grp.userData.open = [o[0] - r.x0, o[1]]; return grp;   // where the opening meets the room, local x and z
}
// a column: a shaft with a base and a cap, and a round collider
export function column(c, r, g, X, x, z, { h = 6, rad = 0.35, mat, cap = true } = {}) {
  const { THREE } = c, m = mat || c.surf('marble2', 1, 0xd8d0c8);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.06, h - 0.5, 24), m); sh.position.set(x, h / 2 - 0.25 + 0.25, z); g.add(sh);
  g.add(c.slab(rad * 2.6, 0.25, rad * 2.6, m, x, 0.125, z)); if (cap) g.add(c.slab(rad * 2.6, 0.25, rad * 2.6, m, x, h - 0.125, z));
  c.post(X(x), z, rad + 0.1); return sh;
}
// a mezzanine: a balcony along a wall at height y with a rail, a stair up to it, and the ground function to walk it
export function mezzanine(c, r, g, X, { side = 's', y = 3.0, depth = 3.2, mat, rail = 0x1a1a1a, stairAt = 2.0 }) {
  const { THREE } = c, W = 20, D = 16, m = mat || c.surf('planks', 2, 0x8a6a48), rm = new THREE.MeshStandardMaterial({ color: rail, metalness: 0.7, roughness: 0.4 });
  // only the south wall version is needed so far: a balcony across the whole width at the back of the room
  const z0 = D / 2 - depth, deck = c.slab(W, 0.14, depth, m, W / 2, y - 0.07, D / 2 - depth / 2); g.add(deck);
  for (let k = 0; k <= 20; k++) g.add(c.slab(0.04, 1.0, 0.04, rm, k, y + 0.5, z0 + 0.1)); g.add(c.slab(W, 0.05, 0.05, rm, W / 2, y + 1.0, z0 + 0.1));
  // the stair: a straight flight along the west wall up to the deck
  const run = 4.2, steps = Math.round(y / 0.18), sw = 1.3;
  for (let s = 0; s < steps; s++) { const t = (s + 1) / steps; g.add(c.slab(sw, 0.18, run / steps + 0.02, m, stairAt, y * t - 0.09, z0 - run + run * t - run / steps / 2)); }
  const sr = c.slab(0.04, 1.0, Math.hypot(run, y), rm, stairAt + sw / 2, y / 2 + 0.6, z0 - run / 2); sr.rotation.x = Math.atan2(y, run); g.add(sr);
  // walkable height: the stair ramps, the deck is flat; a rail collider keeps you off the edge
  r.ground = (x, z) => { if (z > z0 - 0.05) return y; if (Math.abs(x - stairAt) < sw / 2 + 0.1 && z > z0 - run) return y * (z - (z0 - run)) / run; return 0; };
  c.wall(X(0), z0 + 0.1, X(stairAt - sw / 2 - 0.1), z0 + 0.1); c.wall(X(stairAt + sw / 2 + 0.1), z0 + 0.1, X(W), z0 + 0.1);
  c.wall(X(stairAt - sw / 2 - 0.1), z0 - run, X(stairAt - sw / 2 - 0.1), z0 + 0.1); c.wall(X(stairAt + sw / 2 + 0.1), z0 - run, X(stairAt + sw / 2 + 0.1), z0 + 0.1);
  return { y, z0, deck };
}
// a coffered ceiling: beams both ways under the slab, with a warm bulb in every other coffer
export function coffer(c, r, g, { nx = 5, nz = 4, y = 6, mat, bulb = 0xffd9a8 }) {
  const { THREE } = c, W = 20, D = 16, m = mat || c.surf('planks', 2, 0x5a4030);
  for (let i = 0; i <= nx; i++) g.add(c.slab(0.24, 0.5, D, m, i * W / nx, y - 0.25, 0));
  for (let j = 0; j <= nz; j++) g.add(c.slab(W, 0.5, 0.24, m, W / 2, y - 0.25, -D / 2 + j * D / nz));
  if (bulb) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if ((i + j) % 2 === 0) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: bulb, toneMapped: false })); b.position.set((i + 0.5) * W / nx, y - 0.3, -D / 2 + (j + 0.5) * D / nz); g.add(b); }
}
// a neon tube: a glowing cylinder along a line, with a glow sprite at each end
export function neon(c, g, x1, y1, z1, x2, y2, z2, color = 0xff4fa3, rad = 0.025) {
  const { THREE } = c, a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), L = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, L, 10), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m);
  const l = new THREE.PointLight(color, 4, 5, 1.6); l.position.copy(m.position); g.add(l); return m;
}
// a trading card as a mesh: a canvas front with name, art and the three attributes, a foil back
export function cardTex(c, { name, aura, stamina, skill, rarity = 'Core', col = '#5a2fa0', draw }) {
  return c.canvasTex(512, 716, (q, w, h) => {
    q.fillStyle = { Core: '#f4ead2', Rare: '#8a5a2a', 'Very Rare': '#ff7a1a', Epic: '#2a8a4a', Spectacular: '#f5c542' }[rarity] || '#f4ead2'; q.fillRect(0, 0, w, h);
    q.fillStyle = '#111'; q.fillRect(18, 18, w - 36, h - 36); q.fillStyle = col; q.fillRect(30, 30, w - 60, h - 60);
    q.fillStyle = '#f4ead2'; q.fillRect(44, 120, w - 88, 330);
    if (draw) { q.save(); q.beginPath(); q.rect(44, 120, w - 88, 330); q.clip(); draw(q, 44, 120, w - 88, 330); q.restore(); }
    q.fillStyle = '#f4ead2'; q.font = `900 36px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(name.toUpperCase().slice(0, 22), w / 2, 90);
    q.font = `700 22px ${c.MONO}`; q.fillText(rarity.toUpperCase(), w / 2, 480);
    const rows = [['AURA', aura, '#22d3ee'], ['STAMINA', stamina, '#ff4fa3'], ['SKILL', skill, '#f5c542']];
    rows.forEach(([k, v, cc], i) => { const y = 530 + i * 56; q.fillStyle = cc; q.fillRect(60, y - 30, 392, 44); q.fillStyle = '#111'; q.font = `800 26px ${c.MONO}`; q.textAlign = 'left'; q.fillText(k, 76, y); q.textAlign = 'right'; q.font = `900 34px ${c.MONO}`; q.fillText(String(v), 436, y); });
    q.textAlign = 'center'; q.fillStyle = '#f4ead2'; q.font = `600 16px ${c.MONO}`; q.fillText('COMPETE AND COLLECT · FIRST TO SEVEN', w / 2, h - 32);
  }, 512);
}
