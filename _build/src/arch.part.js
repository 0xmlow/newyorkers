// ---------- v3 architecture (2026-11-15, MLow: "the architecture should be built in a way that makes more sense") ----------
// The v2 facades were photographs pasted on the walls: their windows could never line up with anything, and they had no depth.
// v3 builds the street as buildings: a granite plinth, pilasters, recessed shop windows in bronze frames, lit fascia signs,
// striped awnings and blade signs that stand out into the street, a profiled cornice with dentils, and two upper floors of
// recessed windows with sills, lintels and (in Brooklyn) fire escapes. Every window, shop or flat, is one quad of a single
// merged mesh per room whose shader ray traces a room behind the glass (interior mapping) from an atlas of generated
// interiors (work/v2/grid_*.jpg): back wall, side walls, floor and ceiling, with parallax as you walk, glass fresnel,
// curtains, and a lit level the blackout can take down. Geometry is merged per material: a handful of draw calls a room.
const ARCH = {
  fifth:    { style: 'stone', shops: [0, 1, 6, 4], signs: ['N3W YORKERS', 'MLow', 'BLOOM & EYE', 'NAZAR & SON'], awn: ['#7a1a1a', '#0d1b4a'] },
  channel:  { style: 'stone', shops: [2, 1, 6, 0], signs: ['THE GARDEN SHOP', 'N3W YORKERS', 'EYE CRUNCH', 'MLow'], awn: ['#0d3a24', '#6a1a1a'] },
  rink:     { style: 'stone', shops: [5, 3, 4, 2], signs: ['RINK CAFE', 'SKATES', 'N3W YORKERS', 'MLow'], awn: ['#0d1b4a', '#7a1a1a'] },
  tree:     { style: 'stone', shops: [0, 2, 3, 1], signs: ['N3W YORKERS', 'MLow', 'THE PLAZA SHOP', 'TALLY CHIPS'], awn: ['#7a1a1a', '#0d3a24'] },
  menorah:  { style: 'stone', shops: [4, 6, 1, 5], signs: ['BLUE & WHITE BAKERY', 'N3W YORKERS', 'MLow', 'NAZAR COLA'], awn: ['#0d1b4a', '#e8e4da'] },
  market:   { style: 'brick', shops: [6, 5, 4, 7], signs: ['N3W YORKERS', 'UNION SQUARE CAFE OF EYES', 'MLow', 'THE GREENMARKET'], awn: ['#0d3a24', '#7a1a1a'] },
  brooklyn: { style: 'brick', shops: [4, 7, 5, 3], signs: ['BLOOM BAKERY', 'GRAND ARMY TOYS', 'N3W YORKERS', 'MLow'], awn: ['#0d1b4a', '#e8e4da'], escapes: true },
  dyker:    { style: 'brick', resi: true, shops: [3, 2, 6, 5], signs: ['N3W YORKERS', 'MLow', 'THE BLOCK', 'EYE CRUNCH'], awn: ['#7a1a1a', '#0d3a24'], escapes: true, outline: true },
};
const IMAT = {};
function interiorMat(c) {
  const { THREE } = c;
  if (IMAT.m) return IMAT.m;
  const atlas = c.tex.load('assets/arch/interiors.jpg'); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8;
  const m = new THREE.ShaderMaterial({ uniforms: { uAtlas: { value: atlas }, uLevel: { value: 1 }, uTime: { value: 0 } }, toneMapped: true,
    vertexShader: `attribute vec3 aC, aN; attribute vec2 aS; attribute vec4 aK; varying vec3 vW, vC, vN; varying vec2 vS; varying vec4 vK;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vC = (modelMatrix * vec4(aC, 1.)).xyz; vN = normalize(mat3(modelMatrix) * aN); vS = aS; vK = aK; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D uAtlas; uniform float uLevel, uTime; varying vec3 vW, vC, vN; varying vec2 vS; varying vec4 vK;
      // vK: x = atlas cell, y = lit (0 dark .. 1 bright), z = curtains, w = room depth in metres
      vec3 cellTex(vec2 uv){ float cx = mod(vK.x, 4.), cy = floor(vK.x / 4.); uv = clamp(uv, 0., 1.) * 0.88 + 0.06; return texture2D(uAtlas, vec2((cx + uv.x) / 4., (3. - cy + uv.y) / 4.)).rgb; }
      void main(){
        vec3 U = vec3(0., 1., 0.), T = normalize(cross(U, vN)), p = vW - vC, cam = cameraPosition - vC;
        vec3 P = vec3(dot(p, T), p.y, dot(p, vN)), Cm = vec3(dot(cam, T), cam.y, dot(cam, vN)), d = normalize(P - Cm);
        float w = vS.x * .5, h = vS.y * .5, dep = vK.w;
        float tb = (-dep - P.z) / min(d.z, -1e-4);
        float tx = ((d.x > 0. ? w : -w) - P.x) / (abs(d.x) < 1e-4 ? 1e-4 : d.x);
        float ty = ((d.y > 0. ? h : -h) - P.y) / (abs(d.y) < 1e-4 ? 1e-4 : d.y);
        float t = min(tb, min(tx, ty)); vec3 H = P + d * t; float z01 = clamp(-H.z / dep, 0., 1.);
        vec3 col; float shade;
        if (t == tb) { col = cellTex(vec2(H.x / vS.x + .5, H.y / vS.y + .5)); shade = 1.; }
        else if (t == tx) { col = cellTex(vec2(d.x > 0. ? 1. - z01 * .1 : z01 * .1, H.y / vS.y + .5)); shade = .62 - z01 * .1; }
        else { col = cellTex(vec2(H.x / vS.x + .5, d.y > 0. ? .62 - z01 * .12 : .3 + z01 * .12)); shade = d.y > 0. ? .72 : .8; }   // ceilings and floors from the lit middle of the room, not its dark edge
        vec2 uv = vec2(P.x / vS.x + .5, P.y / vS.y + .5);
        if (vK.z > .5) { float cu = smoothstep(.2, .14, uv.x) + smoothstep(.8, .86, uv.x); col = mix(col, vec3(.55, .28, .15) * (0.6 + 0.4 * sin(uv.y * 90.)), cu * .85); }
        // MLow's Impermanent Vision displays (cells 0 to 2) breathe: contour rivers drift across the back wall, every fifth line heavier
        if (vK.x < 2.5 && t == tb) { vec2 q = vec2(H.x / vS.x, H.y / vS.y) * 3.2; float f = sin(q.x * 1.7 + sin(q.y * 1.3 + uTime * .35) * 1.6) + sin(q.y * 2.1 - uTime * .22 + sin(q.x * .9) * 1.4);
          float ln = fract(f * 2.2 + uTime * .08); float line = smoothstep(.035, .0, abs(ln - .5) - .45) * (mod(floor(f * 2.2 + uTime * .08), 5.) < .5 ? 1.6 : .7);
          col += vec3(.16, .38, 1.) * line * .32 + vec3(0., .9, 1.) * line * .1; }
        float lit = vK.y * uLevel;
        vec3 inside = col * shade * (0.05 + (vK.x < 2.5 ? 0.82 : 1.05) * lit);
        // glass: a cool sky fresnel and a soft streak, stronger when the room is dark
        float fr = pow(1. - abs(d.z), 3.) * .55 + .06;
        vec3 sky = vec3(.05, .08, .15) + vec3(.25, .22, .18) * smoothstep(.97, 1., sin(uv.x * 3. + uv.y * 7. + 1.3));
        vec3 outc = mix(inside, sky, fr * (1. - lit * .55));
        // the frame's shadow inside the reveal
        float edge = smoothstep(0., .05, uv.x) * smoothstep(1., .95, uv.x) * smoothstep(0., .05, uv.y) * smoothstep(1., .95, uv.y);
        gl_FragColor = vec4(outc * (.55 + .45 * edge), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  return (IMAT.m = m);
}
// a facade builder: boxes collected per material in world space (UVs metric, like slab), merged once; window quads collected
// with their interior attributes, merged once
function Builder(c) {
  const { THREE } = c, B = { boxes: {}, mats: {}, win: [] };
  B.mat = (k, m) => { B.mats[k] = m; B.boxes[k] = B.boxes[k] || []; };
  // a box in facade space: O origin on the wall, T along the wall, N out into the room; u along T, y up, n along N
  B.box = (F, k, u, y, n, w, h, d, rep = 2) => {
    const alongZ = Math.abs(F.T.z) > 0.5, g = new THREE.BoxGeometry(alongZ ? d : w, h, alongZ ? w : d);
    const uv = g.attributes.uv, nr = g.attributes.normal;
    for (let i = 0; i < uv.count; i++) { const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)); const sx = alongZ ? d : w, sz = alongZ ? w : d;
      const [a, b] = ax > 0.5 ? [sz, h] : ay > 0.5 ? [sx, sz] : [sx, h]; uv.setXY(i, uv.getX(i) * a / rep, uv.getY(i) * b / rep); }
    const x = F.O.x + F.T.x * u + F.N.x * n, z = F.O.z + F.T.z * u + F.N.z * n; g.translate(x, y, z); B.boxes[k].push(g); return g;
  };
  // a window quad: centre at (u, y), on the plane n, width w, height h; cell, lit, curtains, depth
  B.window = (F, u, y, n, w, h, cell, lit, cur, dep) => { const cx = F.O.x + F.T.x * u + F.N.x * n, cz = F.O.z + F.T.z * u + F.N.z * n;
    const U = new THREE.Vector3(0, 1, 0), N = F.N.clone(), Tn = new THREE.Vector3().crossVectors(U, N).normalize();
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [cx + Tn.x * a, y + b, cz + Tn.z * a]);
    B.win.push({ pts, c: [cx, y, cz], n: [N.x, N.y, N.z], s: [w, h], k: [cell, lit, cur, dep] }); };
  B.finish = (parent) => {
    const out = [];
    for (const k in B.boxes) { if (!B.boxes[k].length) continue; const geo = mergeGeometries(B.boxes[k], false); const m = new THREE.Mesh(geo, B.mats[k]); parent.add(m); out.push(m); }
    if (B.win.length) { const n = B.win.length, pos = new Float32Array(n * 12), aC = new Float32Array(n * 12), aN = new Float32Array(n * 12), aS = new Float32Array(n * 8), aK = new Float32Array(n * 16), idx = [];
      B.win.forEach((q, i) => { q.pts.forEach((p, j) => { pos.set(p, (i * 4 + j) * 3); aC.set(q.c, (i * 4 + j) * 3); aN.set(q.n, (i * 4 + j) * 3); aS.set(q.s, (i * 4 + j) * 2); aK.set(q.k, (i * 4 + j) * 4); }); const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); g.setAttribute('aN', new THREE.BufferAttribute(aN, 3));
      g.setAttribute('aS', new THREE.BufferAttribute(aS, 2)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 4)); g.setIndex(idx); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, interiorMat(c)); m.frustumCulled = false; parent.add(m); out.push(m); }
    return out;
  };
  return B;
}
const SIGNTEX = {};
function shopSign(c, text, bg, fg) {
  return SIGNTEX[text + bg] ||= c.canvasTex(1024, 160, (q, w, h) => { q.fillStyle = bg; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a040'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20);
    q.fillStyle = fg; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = `700 ${text.length > 14 ? 74 : 92}px Georgia, serif`; q.fillText(text, w / 2, h / 2 + 4);
    if (text === 'MLow' || text === 'N3W YORKERS') { eyeFlower(q, 90, h / 2, 54); eyeFlower(q, w - 90, h / 2, 54); } });
}
const AWN = {};
function awningTex(c, col) {
  return AWN[col] ||= c.canvasTex(256, 64, (q, w, h) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#efe8da' : col; q.fillRect(i * w / 8, 0, w / 8, h); } const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
}
function buildArch(c, r, g, X) {
  const cfg = ARCH[r.id]; if (!cfg || !r.outdoor || r.low || r.noArch) return false;
  const { THREE } = c, B = Builder(c), brick = cfg.style === 'brick';
  B.mat('wall', c.surf(brick ? (r.i % 2 ? 'acg_bricks097' : 'acg_bricks059') : 'acg_bricks066', brick ? 1.4 : 2.6, brick ? 0xb08878 : 0xd8cfc0));   // v4: ambientCG CC0 brick and stone
  B.mat('trim', c.surf('ashlar', 1.2, brick ? 0xc8bca8 : 0xd8cfbe));
  B.mat('plinth', c.surf('acg_granite005a', 1.2, 0x6a6670));
  B.mat('bronze', new THREE.MeshStandardMaterial({ color: 0x5a4220, metalness: 0.9, roughness: 0.32 }));
  B.mat('paint', new THREE.MeshStandardMaterial({ color: brick ? 0x14301f : 0x111827, roughness: 0.55, metalness: 0.1 }));
  B.mat('walk', c.surf('acg_pavingstones128', 2.2, 0xa8a49c)); B.mat('curb', c.surf('acg_granite005a', 0.8, 0x8a8890));
  B.mat('iron', new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5, metalness: 0.7 }));
  const HT = 10, GF = 4.5, COR = 5.0, rng = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(r.i * 7919 + 13);
  const facades = [
    { O: new THREE.Vector3(0.12, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(1, 0, 0), L: DZ1 + D / 2 - 0.1, shops: true, side: 'L' },
    { O: new THREE.Vector3(W - 0.37, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-1, 0, 0), L: DZ1 + D / 2 - 0.1, shops: true, side: 'R' },
    { O: new THREE.Vector3(0.12, 0, DZ2 + 0.1), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(1, 0, 0), L: D / 2 - DZ2 - 0.1, shops: false, side: 'L2' },
    { O: new THREE.Vector3(W - 0.37, 0, DZ2 + 0.1), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-1, 0, 0), L: D / 2 - DZ2 - 0.1, shops: false, side: 'R2' },
  ];
  if (!r.openNorth) { const pw = (W - PORTAL.w) / 2;
    facades.push({ O: new THREE.Vector3(0, 0, -D / 2 + 0.01), T: new THREE.Vector3(1, 0, 0), N: new THREE.Vector3(0, 0, 1), L: pw, shops: true, side: 'NL', one: true });
    facades.push({ O: new THREE.Vector3(W - pw, 0, -D / 2 + 0.01), T: new THREE.Vector3(1, 0, 0), N: new THREE.Vector3(0, 0, 1), L: pw, shops: true, side: 'NR', one: true }); }
  let shopK = 0; const signs = [], awnings = [], blades = [], spots = [], swags = [], wreaths = [];
  for (const F of facades) {
    if (cfg.park && (F.side === 'L' || F.side === 'L2' || F.side === 'NL')) continue;   // the park edge, built below
    const L = F.L; if (L < 0.8) continue;
    // the face of the building, full height, and its plinth
    B.box(F, 'wall', L / 2, HT / 2, 0.03, L, HT, 0.06, brick ? 1.6 : 2.4);
    // v4 (Astra: "close the building shells"): north stubs get a full mass behind them (open ground); side faces sit on the
    // shared wall with the next room, so they get a parapet return and a roof edge only, never depth into the neighbour
    if (F.one) { B.box(F, 'wall', L / 2, HT / 2, -4.0, L, HT, 8.0, brick ? 1.6 : 2.4); B.box(F, 'trim', L / 2, HT + 0.12, -4.0, L + 0.1, 0.24, 8.1, 1.2); }
    else B.box(F, 'trim', L / 2, HT + 0.1, 0.0, L, 0.2, 0.3, 1.2);
    B.box(F, 'plinth', L / 2, 0.25, 0.32, L, 0.5, 0.64);
    // ground floor: pilasters and bays
    const P = 0.46, nb = F.one ? 1 : Math.max(1, Math.round((L - P) / 3.3)), bw = (L - P * (nb + 1)) / nb;
    for (let b = 0; b <= nb; b++) { const u = P / 2 + b * (bw + P); B.box(F, 'trim', u, GF / 2, 0.3, P, GF, 0.6, 1.2); B.box(F, 'trim', u, GF - 0.18, 0.36, P + 0.08, 0.36, 0.72, 1.2); }
    for (let b = 0; b < nb; b++) {
      const u0 = P + b * (bw + P), uc = u0 + bw / 2;
      if (!F.shops) { B.box(F, 'wall', uc, 2.2, 0.08, bw, 4.4, 0.16); continue; }
      if (cfg.resi && !F.one) { B.box(F, 'wall', uc, 0.6, 0.08, bw, 1.2, 0.16); B.box(F, 'trim', uc, 1.22, 0.18, bw * 0.8, 0.1, 0.36, 1.2); B.box(F, 'trim', uc, 3.35, 0.14, bw * 0.84, 0.24, 0.28, 1.2);
        B.box(F, 'wall', uc, 3.95, 0.08, bw, 1.0, 0.16); B.box(F, 'paint', uc, 2.25, 0.2, 0.06, 1.95, 0.05);
        B.window(F, uc, 2.25, 0.12, bw * 0.72, 1.95, 8 + Math.floor(rng() * 8), 0.65 + rng() * 0.45, rng() < 0.5 ? 1 : 0, 1.2);
        for (let k = 0; k <= 8; k++) B.box(F, 'iron', uc - bw / 2 + 0.1 + k * (bw - 0.2) / 8, 0.5, 1.05, 0.03, 1.0, 0.03, 1); B.box(F, 'iron', uc, 1.0, 1.05, bw - 0.1, 0.05, 0.05, 1);
        wreaths.push({ F, u: uc, y: 3.62 }); continue; }
      const cell = cfg.shops[shopK % cfg.shops.length], name = cfg.signs[shopK % cfg.signs.length], col = cfg.awn[shopK % cfg.awn.length]; shopK++;
      // kickplate, frame, mullion, glass with the shop behind it
      B.box(F, 'paint', uc, 0.38, 0.5, bw, 0.76, 0.2);
      B.box(F, 'bronze', uc, 0.8, 0.56, bw, 0.08, 0.16); B.box(F, 'bronze', uc, 3.5, 0.56, bw, 0.1, 0.16);
      B.box(F, 'bronze', u0 + 0.05, 2.15, 0.56, 0.1, 2.8, 0.16); B.box(F, 'bronze', u0 + bw - 0.05, 2.15, 0.56, 0.1, 2.8, 0.16);
      if (bw > 2.2) B.box(F, 'bronze', uc, 2.15, 0.58, 0.06, 2.7, 0.08);
      B.window(F, uc, 2.15, 0.5, bw - 0.1, 2.7, cell, 0.55 + rng() * 0.3, 0, 1.9);
      // the fascia sign over the window, lit by little lamps, and the transom
      B.box(F, 'paint', uc, 3.98, 0.52, bw, 0.62, 0.16);
      signs.push({ F, u: uc, y: 3.98, n: 0.615, w: bw - 0.24, h: 0.42, text: name, bg: col === '#e8e4da' ? '#0d1b4a' : '#0a0a0c', fg: '#f2e6c8' });
      for (const s of [-1, 1]) spots.push({ F, u: uc + s * bw * 0.3, y: 4.36, n: 0.85 });
      // an awning on every other shop, a blade sign on the pilaster beside the others
      if (shopK % 2 === 1 || F.one) awnings.push({ F, u: uc, w: bw + 0.1, col }); else blades.push({ F, u: u0 - P / 2, text: name });
      swags.push({ F, u0: u0, u1: u0 + bw });
    }
    // the cornice: a band, dentils, a crown
    B.box(F, 'trim', L / 2, GF + 0.1, 0.42, L, 0.2, 0.84, 1.2);
    for (let u = 0.12; u < L - 0.1; u += 0.26) B.box(F, 'trim', u, GF + 0.29, 0.5, 0.12, 0.16, 0.2, 0.5);
    B.box(F, 'trim', L / 2, GF + 0.46, 0.46, L, 0.18, 0.92, 1.2);
    // upper floors: recessed windows with sills, lintels, jambs; quoins at the ends
    const floors = [[COR + 1.2, 1.75], [COR + 3.75, 1.75]], nw = Math.max(1, Math.floor(L / 1.7)), sp = L / nw;
    for (const [yc, wh] of floors) for (let i = 0; i < nw; i++) {
      const u = sp * (i + 0.5), ww = Math.min(1.05, sp * 0.62);
      B.box(F, 'trim', u, yc - wh / 2 - 0.06, 0.12, ww + 0.3, 0.12, 0.24, 1.2);             // sill
      B.box(F, 'trim', u, yc + wh / 2 + 0.14, 0.1, ww + 0.36, 0.28, 0.2, 1.2);              // lintel
      B.box(F, brick ? 'trim' : 'wall', u - ww / 2 - 0.07, yc, 0.08, 0.14, wh, 0.16); B.box(F, brick ? 'trim' : 'wall', u + ww / 2 + 0.07, yc, 0.08, 0.14, wh, 0.16);
      B.box(F, 'paint', u, yc, 0.11, 0.04, wh, 0.03);                                       // the sash bar, in front of the glass
      const apt = 8 + Math.floor(rng() * 8), lit = rng() < 0.6 ? 0.45 + rng() * 0.6 : rng() * 0.08;
      B.window(F, u, yc, 0.08, ww, wh, apt, lit, rng() < 0.45 ? 1 : 0, 0.85);   // just in front of the wall face (n 0.06): at 0.06 the wall hid it
      if (cfg.escapes && i % 2 === 0 && i + 1 < nw) { const ue = u + sp / 2, ew = sp + ww;      // a fire escape across two windows
        B.box(F, 'iron', ue, yc - wh / 2 - 0.12, 0.55, ew, 0.05, 1.0, 1); B.box(F, 'iron', ue, yc - wh / 2 + 0.85, 1.03, ew, 0.04, 0.04, 1);
        for (let k = 0; k <= 6; k++) B.box(F, 'iron', ue - ew / 2 + k * ew / 6, yc - wh / 2 + 0.38, 1.03, 0.025, 0.95, 0.025, 1); }
    }
    for (const u of [0.2, L - 0.2]) B.box(F, 'trim', u, (COR + HT) / 2, 0.08, 0.4, HT - COR, 0.16, 1.2);
    B.box(F, 'trim', L / 2, HT - 0.2, 0.3, L, 0.4, 0.6, 1.2);                               // parapet coping
    if (F.shops || F.side.length === 2) { B.box(F, 'walk', L / 2, 0.03, 1.55, L, 0.06, 2.5, 1.5); B.box(F, 'curb', L / 2, 0.05, 2.86, L, 0.1, 0.18, 0.8); }
    // a collider along the face, so nobody walks into a pilaster
    const a = F.O.clone(), e = F.O.clone().addScaledVector(F.T, L); a.addScaledVector(F.N, 0.7); e.addScaledVector(F.N, 0.7); c.wall(X(a.x), a.z, X(e.x), e.z);
  }
  const ms = B.finish(g);
  // the windows go down with the block (Dyker) and up with the tree: one level for every interior
  const im = interiorMat(c); r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { im.uniforms.uLevel.value = v; } });
  c.tick((t, dt, P, ri) => { if (ri === r.i) im.uniforms.uTime.value = t; });
  // signs: canvas text on the fascia, glowing a little
  const place = (o, F, u, y, n) => { o.position.set(F.O.x + F.T.x * u + F.N.x * n, y, F.O.z + F.T.z * u + F.N.z * n); o.rotation.y = Math.atan2(F.N.x, F.N.z); };
  for (const s of signs) { const m = new THREE.MeshStandardMaterial({ map: shopSign(c, s.text, s.bg, s.fg), emissive: 0xffffff, emissiveMap: shopSign(c, s.text, s.bg, s.fg), emissiveIntensity: 0.32, roughness: 0.5 }); m.userData.e0 = 0.32; r.dress.mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), m); place(p, s.F, s.u, s.y, s.n); g.add(p); }
  // each lit shop throws a warm pool across the pavement in front of it
  for (const s of signs) { const pm = new THREE.MeshBasicMaterial({ map: POOL.t ||= c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,.6)'); gr.addColorStop(0.5, 'rgba(255,180,110,.2)'); gr.addColorStop(1, 'rgba(255,170,100,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -6 });
    pm.userData.op0 = 0.5; pm.userData.e0 = 0; r.dress.mats.push(pm); const pl = new THREE.Mesh(new THREE.PlaneGeometry(s.w + 0.8, 3.2), pm); pl.rotation.x = -PI / 2; pl.rotation.z = Math.atan2(s.F.N.x, s.F.N.z); place(pl, s.F, s.u, 0.017, 1.9); pl.rotation.set(-PI / 2, 0, Math.atan2(s.F.N.x, s.F.N.z)); g.add(pl); }
  // little gooseneck lamps over the signs: a glow and a pool of light on the sign and the pavement
  for (const s of spots) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.8 }));
    sp.scale.set(0.42, 0.42, 1); sp.userData.op0 = 0.8; place(sp, s.F, s.u, s.y, s.n); g.add(sp); r.dress.glows.push(sp); }
  // awnings: a sloped striped canvas with a valance and two iron arms
  for (const a of awnings) { const tx = awningTex(c, a.col); const m = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85, side: THREE.DoubleSide });
    const o = new THREE.Group(); place(o, a.F, a.u, 3.62, 0.6); g.add(o); const slope = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 1.25), m); slope.rotation.x = -1.05; slope.position.set(0, -0.3, 0.55); o.add(slope);
    const val = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 0.22), m); val.position.set(0, -0.68, 1.1); o.add(val);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), B.mats.iron); arm.rotation.x = 1.05; arm.position.set(s * a.w * 0.45, -0.35, 0.52); o.add(arm); }
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.96, 1.1), new THREE.MeshStandardMaterial({ color: 0xeef2f8, roughness: 0.9, transparent: true, opacity: 0.55 })); snow.rotation.x = -1.05; snow.position.set(0, -0.28, 0.56); o.add(snow); }
  // blade signs: a lit double sided box on a bracket, standing out over the pavement
  for (const b of blades) { const o = new THREE.Group(); place(o, b.F, b.u, 3.9, 0.62); g.add(o); o.rotation.y += PI / 2;
    const tx = shopSign(c, b.text.length > 10 ? b.text.split(' ')[0] : b.text, '#0d1b4a', '#f2e6c8'); const m = new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.5, roughness: 0.4 }); m.userData.e0 = 0.5; r.dress.mats.push(m);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.07), [B.mats.bronze, B.mats.bronze, B.mats.bronze, B.mats.bronze, m, m]); box.position.set(-0.62, 0, 0); box.rotation.z = PI / 2; o.add(box);
    o.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.04), B.mats.iron)).position.set(-0.4, 0.5, 0); }
  for (const w of wreaths) { const x = w.F.O.x + w.F.T.x * w.u + w.F.N.x * 0.3, z = w.F.O.z + w.F.T.z * w.u + w.F.N.z * 0.3; wreath(c, g, x, w.y, z, Math.atan2(w.F.N.x, w.F.N.z), 0.36); }
  // the park edge (Grand Army Plaza Manhattan meets the park): a low stone wall, lamps, and trees wrapped in lights
  if (cfg.park) { const pw = std(c, 0x6a665e, { roughness: 0.85 }); g.add(c.slab(0.6, 0.9, D - 0.4, pw, 0.5, 0.45, 0)); g.add(c.slab(0.75, 0.1, D - 0.4, pw, 0.5, 0.95, 0)); c.wall(X(0.9), -D / 2, X(0.9), D / 2);
    for (const z of [-6.2, -2.4, 1.4, 6.4]) { const t = c.glb('tree_plane', { h: 7.5, x: -1.2, z, parent: g, shadow: false }); const pts = []; for (let i = 0; i < 260; i++) { const a = Math.random() * 6.28, rr = Math.random() * 2.4, y = 3 + Math.random() * 4.2; pts.push([-1.2 + Math.cos(a) * rr, y, z + Math.sin(a) * rr, Math.random(), WARM[(Math.random() * 4) | 0]]); }
      const led = ledPoints(c, g, pts, { size: 0.06, gain: 2.3 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); } }
  // swags of greenery and bulbs between the pilasters, over each shop
  const gpts = [], bulbs = [];
  for (const s of swags) { for (let i = 0; i <= 18; i++) { const t = i / 18, u = s.u0 + (s.u1 - s.u0) * t, y = 4.32 - Math.sin(t * PI) * 0.38, n = 0.66;
      const x = s.F.O.x + s.F.T.x * u + s.F.N.x * n, z = s.F.O.z + s.F.T.z * u + s.F.N.z * n; gpts.push([x, y, z]); if (i % 2 === 0) bulbs.push([x + s.F.N.x * 0.08, y - 0.05, z + s.F.N.z * 0.08, Math.random(), WARM_BLUE[(Math.random() * 7) | 0]]); } }
  if (gpts.length) { const im2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), ORN.n ||= new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 }), gpts.length * 2), m4 = new THREE.Matrix4();
    gpts.forEach((p, i) => { for (let k = 0; k < 2; k++) { m4.makeTranslation(p[0] + (Math.random() - 0.5) * 0.12, p[1] + (Math.random() - 0.5) * 0.1, p[2] + (Math.random() - 0.5) * 0.12); im2.setMatrixAt(i * 2 + k, m4); } }); g.add(im2);
    const led = ledPoints(c, g, bulbs, { size: 0.06, gain: 2.4 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); c9Strand(c, g, bulbs, { scale: 0.7, r });
    // tinsel: silver foil strips wound through the swags, catching every light in the street
    const tin = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.008, 0.1), new THREE.MeshStandardMaterial({ color: 0xe8ecf4, metalness: 1, roughness: 0.12, side: THREE.DoubleSide, envMapIntensity: 2.2 }), gpts.length * 6), m5 = new THREE.Matrix4(), q5 = new THREE.Quaternion(), e5 = new THREE.Euler();
    gpts.forEach((p, i) => { for (let k = 0; k < 6; k++) { e5.set(Math.random() * 0.6, Math.random() * 6.28, Math.random() * 0.6); q5.setFromEuler(e5); m5.compose(new THREE.Vector3(p[0] + (Math.random() - 0.5) * 0.25, p[1] - 0.06 - Math.random() * 0.08, p[2] + (Math.random() - 0.5) * 0.25), q5, new THREE.Vector3(1, 0.7 + Math.random() * 0.8, 1)); tin.setMatrixAt(i * 6 + k, m5); } });
    g.add(tin); c.tick((t, dt, P, ri) => { if (ri === r.i) tin.rotation.y = 0, tin.material.roughness = 0.1 + 0.06 * Math.sin(t * 3); }); }
  // Dyker: every edge outlined in bulbs, the way the block does it
  if (cfg.outline) { const ol = []; for (const F of facades) { const L = F.L; if (L < 0.8) continue;
      for (const y of [GF + 0.56, HT - 0.02]) for (let u = 0; u <= L; u += 0.16) { const n = 0.95; ol.push([F.O.x + F.T.x * u + F.N.x * n, y, F.O.z + F.T.z * u + F.N.z * n, Math.random(), [[1, 0.25, 0.2], [0.2, 0.9, 0.35], [1, 0.8, 0.5], [0.25, 0.45, 1]][(u * 6.25 | 0) % 4]]); } }
    const led = ledPoints(c, g, ol, { size: 0.075, gain: 2.6, chase: 0.6 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); }
  return true;
}
