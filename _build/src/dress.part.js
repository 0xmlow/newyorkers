// ---------- v2 dressing (2026-11-15, after Astra's critique on Krea: "nine versions of the same exhibition box") ----------
// Every room gets inhabited edges: street level facades on both side walls (GPT Image 2.6 on Krea, work/v2/wall_<id>_l/r,
// their shop windows glow by brightness), warm spill from those windows on the paving, bulb canopies on cables overhead,
// lamps that actually light the ground under them, fir trees wrapped in bulbs, snowbanks where snow would sit, steam at
// the carts, and props from ON LOCATION's passed CC0 library. Everything that glows registers in r.dress, so a blackout
// (Dyker Heights) can take the whole block down and bring it back: r.dressLevel(k), k from 0 to 1.
const WARM = [[1, 0.74, 0.38], [1, 0.8, 0.52], [1, 0.66, 0.3], [1, 0.86, 0.62]];
const WARM_BLUE = [...WARM, ...WARM, [0.22, 0.42, 1]];
function dressRoom(c, r, g, X) {
  const { THREE } = c, D2 = D / 2, cfg = DRESS[r.id] || {};
  r.dress = { mats: [], leds: [], glows: [], level: 1 };
  r.dressLevel = (k) => { r.dress.level = k;
    r.dress.mats.forEach((m) => { m.emissiveIntensity = m.userData.e0 * k; if (m.userData.op0 !== undefined) m.opacity = m.userData.op0 * k; });
    r.dress.leds.forEach((o) => { o.material.uniforms.uMaster.value = k; });
    r.dress.glows.forEach((s) => { s.material.opacity = s.userData.op0 * k; });
    if (r.wet) r.wet.material.uniforms.uK.value = (r.wetK || 0.4) * Math.min(1, k); };
  r.arch = buildArch(c, r, g, X);   // v3: real buildings where the room has an ARCH entry
  if (!r.arch && !r.noFacade) facades(c, r, g);
  if (r.outdoor && !r.noFloor && !c.MOBILE && r.wet !== false) wetFloor(c, r, g);
  if (cfg.canopy !== false && (r.outdoor || cfg.canopy)) canopy(c, r, g, cfg.canopy || {});
  if (r.outdoor && !r.low && r.floorKind !== 'none') snowbanks(c, r, g, cfg);
  (cfg.lamps || []).forEach(([x, z, k]) => streetLamp(c, r, g, X, x, z, k));
  (cfg.firs || []).forEach(([x, z, h]) => litFir(c, r, g, X, x, z, h));
  (cfg.props || []).forEach((q) => prop(c, r, g, X, ...q));
  (cfg.steam || []).forEach(([x, y, z, s]) => steam(c, g, x, y, z, s || 1));
  if (cfg.radio) holidayRadio(c, r, g, X, ...cfg.radio);
  (cfg.ads || []).forEach(([x, z, ry, ad]) => adKiosk(c, r, g, X, x, z, ry, ad));
  (cfg.boards || []).forEach(([side, z, ad]) => billboard(c, r, g, side, z, ad));
  if (cfg.stand) treeStand(c, r, g, X, ...cfg.stand);
  if (cfg.orns) ornaments(c, r, g, X, cfg.orns);
  if (cfg.anamorph) anamorphFlower(c, r, g, X, ...cfg.anamorph);
  if (cfg.globe) snowGlobe(c, r, g, X, ...cfg.globe);
  if (cfg.gelt) gelt(c, r, g, ...cfg.gelt);
  if (cfg.iv) ivShow(c, r, g, X, cfg.iv);
  if (r.outdoor && !r.low) southMural(c, r, g);
  if (r.id === 'top') deckViews(c, r, g);
  v4Room(c, r, g, X);
  v5Room(c, r, g, X);
  beatLights(c, r);
  if (cfg.sleigh) flyingSleigh(c, r, g, X);
  (cfg.deer || []).forEach((q) => litReindeer(c, r, g, X, ...q));
  (cfg.snowmen || []).forEach(([x, z, ry]) => { const sm = prop(c, r, g, X, 'lt_snowman', x, z, { h: 1.8, ry, r: 0.5 }); c.clickable(sm, () => c.egg('snowman', 'A snowman with an eye flower for a head. Every New Yorker here has one. The snowman insisted.'), 'A snowman'); });
  (cfg.watch || []).forEach(([x, y, z, ry, R]) => { const w = watcher(c, g, x, y, z, ry, R); w.traverse((m) => { if (m.material && m.material.color) m.material.color.multiplyScalar(0.62); }); c.clickable(w, () => c.egg('watched', 'An eye flower that follows you round the room. It is a flat disc; the pupil slides toward wherever you stand. The oldest trick in portraiture, without the portrait.'), 'An eye flower'); });
}
// a wall image: map plus an emissive that only lets the bright parts (lit windows, bulbs, neon) glow
function facadeMat(c, url, rep = [1, 1], off = [0, 0], night = 0.62) {
  const { THREE } = c, t = c.tex.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(...rep); t.offset.set(...off);
  const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.78, metalness: 0.05, color: new THREE.Color(night, night, night * 1.06) });
  m.userData.e0 = 1.5;
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>',
    `#ifdef USE_EMISSIVEMAP
      vec4 eT = texture2D( emissiveMap, vEmissiveMapUv ); float eL = dot( eT.rgb, vec3( .299, .587, .114 ) );
      totalEmissiveRadiance *= eT.rgb * smoothstep( .52, .9, eL ) * ( .55 + .45 * eT.r );
    #endif`); };
  return m;
}
function facades(c, r, g) {
  if ((DRESS[r.id] || {}).facades === false) return;
  const { THREE } = c, L = (window.WALLS || []).includes(`${r.id}_l`), R = (window.WALLS || []).includes(`${r.id}_r`);
  if (!L && !R) return;
  const H = r.outdoor ? (r.low ? 3.9 : 5) : (r.ceilH || H_IN) - 0.02, Wd = H * 2, z0 = -D / 2, z1 = Math.min(DZ1 - 0.08, z0 + Wd);
  const w = z1 - z0, frac = w / Wd;   // the image is 2:1; where the doorway cuts it short, crop rather than squash
  const side = (id, x, ry) => {
    const m = facadeMat(c, `assets/walls/${id}.jpg`, [frac, 1], [ry > 0 ? 0 : 1 - frac, 0], r.outdoor ? 0.62 : 1.0); r.dress.mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, H), m); p.position.set(x, H / 2, (z0 + z1) / 2); p.rotation.y = ry; g.add(p);
    // the short run of wall between the doorway and the south wall wears the other end of the same picture
    const w2 = D / 2 - DZ2 - 0.08; if (w2 > 0.5) { const m2 = facadeMat(c, `assets/walls/${id}.jpg`, [w2 / Wd, 1], [ry > 0 ? 1 - w2 / Wd : 0, 0], r.outdoor ? 0.62 : 0.85); r.dress.mats.push(m2);
      const p2 = new THREE.Mesh(new THREE.PlaneGeometry(w2, Math.min(H, DH - 0.1)), m2); p2.position.set(x, Math.min(H, DH - 0.1) / 2, D / 2 - w2 / 2); p2.rotation.y = ry; g.add(p2); }
    if (r.outdoor) {   // a cornice where the shopfront ends and the building goes on up
      const corn = c.slab(0.32, 0.28, w + 0.3, std(c, 0x8c8478, { roughness: 0.7 }), x + (ry > 0 ? 0.16 : -0.16), H + 0.14, (z0 + z1) / 2); g.add(corn);
      const sill = c.slab(0.12, 0.22, w, std(c, 0x4a463f, { roughness: 0.6 }), x + (ry > 0 ? 0.06 : -0.06), 0.11, (z0 + z1) / 2); g.add(sill); }
    // the building goes on up: generated upper storeys, stone in Midtown, brick in Brooklyn, their windows glowing too
    const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN, up = r.upper || (['brooklyn', 'dyker'].includes(r.id) ? 'upper_brick' : 'upper_stone');
    if (r.outdoor && !r.low && (window.WALLS || []).includes(up)) { const UH = HT - H - 0.28, UW = D;
      const mu = facadeMat(c, `assets/walls/${up}.jpg`, [UW / (UH * 2), 1], [ry > 0 ? 0 : 0.37, 0], 0.5); mu.map.wrapS = THREE.RepeatWrapping; mu.userData.e0 = mu.emissiveIntensity = 1.2; r.dress.mats.push(mu);
      const pu = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), mu); pu.position.set(x + (ry > 0 ? 0.01 : -0.01), H + 0.28 + UH / 2, 0); pu.rotation.y = ry; g.add(pu); }
    // the windows spill warm light across the paving in front of them
    const sp = spill(c, Math.min(3.2, W * 0.16), w, ry > 0); sp.position.set(x + (ry > 0 ? 1 : -1) * Math.min(3.2, W * 0.16) / 2, 0.015, (z0 + z1) / 2); g.add(sp); r.dress.mats.push(sp.material);
  };
  // the north wall stubs either side of the plate were the blank pillars Astra flagged: they wear the corner of each facade
  // and the upper storeys, so the street runs on into the photograph
  if (r.outdoor && !r.openNorth) { const pw = (W - PORTAL.w) / 2, HT = r.low ? 4 : 10, up = r.upper || (['brooklyn', 'dyker'].includes(r.id) ? 'upper_brick' : 'upper_stone');
    const stub = (id, cx, left) => { const m = facadeMat(c, `assets/walls/${id}.jpg`, [pw / (H * 2), 1], [left ? 1 - pw / (H * 2) : 0, 0], 0.62); r.dress.mats.push(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, H), m); p.position.set(cx, H / 2, -D / 2 + 0.012); g.add(p);
      if (!r.low && (window.WALLS || []).includes(up)) { const UH = HT - H - 0.28, mu = facadeMat(c, `assets/walls/${up}.jpg`, [pw / (UH * 2), 1], [left ? 0.1 : 0.6, 0], 0.5); mu.userData.e0 = mu.emissiveIntensity = 1.2; r.dress.mats.push(mu);
        const pu = new THREE.Mesh(new THREE.PlaneGeometry(pw, UH), mu); pu.position.set(cx, H + 0.28 + UH / 2, -D / 2 + 0.012); g.add(pu);
        g.add(c.slab(pw, 0.28, 0.32, std(c, 0x8c8478, { roughness: 0.7 }), cx, H + 0.14, -D / 2 + 0.16)); } };
    if (L) stub(`${r.id}_l`, pw / 2, true); if (R) stub(`${r.id}_r`, W - pw / 2, false); }
  if (L) side(`${r.id}_l`, 0.13, PI / 2);
  if (R) side(`${r.id}_r`, W - 0.25 - 0.13, -PI / 2);
}
const SPILL = {};
function spill(c, depth, len, fromLeft) {
  const { THREE } = c;
  const t = SPILL[fromLeft] ||= c.canvasTex(256, 32, (q, w, h) => { const gr = q.createLinearGradient(fromLeft ? 0 : w, 0, fromLeft ? w : 0, 0);
    gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(0.35, 'rgba(255,170,90,.2)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -6 });
  m.userData.op0 = 0.55; m.userData.e0 = 0; m.emissiveIntensity = 0;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(depth, len), m); p.rotation.x = -PI / 2; p.renderOrder = 2; return p;
}
// bulbs on sagging cables from wall to wall, the way a block strings them
function canopy(c, r, g, { zs, y = r.low ? 3.5 : 6.2, sag = 0.9, step = 0.32, palette = WARM_BLUE, xa: XA = 0.3, xb: XB = W - 0.55 } = {}) {
  const { THREE } = c, rows = zs || [-5.6, -2.6, 0.4, 3.4, 6.2], pts = [], wire = [];
  for (const z of rows) { const xa = XA, xb = XB, path = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = xa + (xb - xa) * u; path.push([x, y - sag * 4 * u * (1 - u) + Math.sin(u * 9 + z) * 0.03, z + Math.sin(u * PI) * 0.25]); }
    strand(path, step).forEach((p) => pts.push([p[0], p[1] - 0.05, p[2], Math.random(), palette[(Math.random() * palette.length) | 0]]));
    for (let i = 1; i < path.length; i++) wire.push(...path[i - 1], ...path[i]); }
  const o = ledPoints(c, g, pts, { size: 0.06, gain: 1.6 }); o.material.uniforms.uOn.value = 2; r.dress.leds.push(o); c9Strand(c, g, pts, { r });
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  g.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x15140f })));
}
// snow where snow sits: against the wall bases and along the curb at the far edge
function snowbanks(c, r, g, cfg) {
  const { THREE } = c, spots = [];
  const sx = r.arch ? 0.95 : 0.3; for (let z = -D / 2 + 0.2; z < D / 2 - 0.2; z += 0.34) { if (z > DZ1 - 0.2 && z < DZ2 + 0.2) continue; spots.push([sx, z]); spots.push([W - 0.25 - sx, z]); }
  if (cfg.curb !== false) for (let x = 0.4; x < W - 0.5; x += 0.38) { if (cfg.gap && x > cfg.gap[0] && x < cfg.gap[1]) continue; spots.push([x, -D / 2 + 1.25]); }
  const m = c.surf('acg_snow014', 0.8, 0xe8eef8); m.roughness = 0.9;
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), m, spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z], i) => { const s = 0.18 + Math.random() * 0.22; e.set(0, Math.random() * 6, 0); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x + (Math.random() - 0.5) * 0.15, -s * 0.35, z), q, new THREE.Vector3(s * 1.5, s * 0.75, s * 1.3)); im.setMatrixAt(i, m4); });
  g.add(im);
}
// a street lamp with a glowing head and the pool of light it puts on the ground
const POOL = {};
function streetLamp(c, r, g, X, x, z, kind = 1) {
  const { THREE } = c, h = kind === 2 ? 4.4 : 3.9;
  prop(c, r, g, X, kind === 2 ? 'ph_street_lamp_02' : 'ph_street_lamp_01', x, z, { h, r: 0.22 });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: 0xffd6a0, opacity: 0.9 }));
  s.position.set(x, h * 0.93, z); s.scale.set(1.3, 1.3, 1); s.userData.op0 = 0.9; g.add(s); r.dress.glows.push(s);
  wreath(c, g, x, 1.9, z + 0.13, 0, 0.32); lampBanners(c, r, g, x, z, (r.lampK = (r.lampK || 0) + 2));
  const t = POOL.t ||= c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,.6)'); gr.addColorStop(0.5, 'rgba(255,180,110,.2)'); gr.addColorStop(1, 'rgba(255,170,100,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); });
  const pm = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -6 });
  pm.userData.op0 = 0.45; pm.userData.e0 = 0; const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), pm); p.rotation.x = -PI / 2; p.position.set(x, 0.016, z); p.renderOrder = 2; g.add(p); r.dress.mats.push(pm);
}
// a CC0 fir wrapped in a spiral of bulbs, base in a planter
function litFir(c, r, g, X, x, z, h = 2.6) {
  prop(c, r, g, X, 'ph_fir_tree_01', x, z, { h, r: 0.5 });
  const pts = [], turns = 7, n = Math.round(h * 46);
  for (let i = 0; i < n; i++) { const u = i / n, y = 0.35 + u * (h - 0.5), rad = (1 - u) * h * 0.3 + 0.05, a = u * turns * PI * 2;
    pts.push([x + Math.cos(a) * rad, y, z + Math.sin(a) * rad, Math.random(), WARM_BLUE[(Math.random() * WARM_BLUE.length) | 0]]); }
  const o = ledPoints(c, g, pts, { size: 0.07, gain: 2.4 }); o.material.uniforms.uOn.value = 2; r.dress.leds.push(o);
}
// what each room adds. props: [name, x, z, { h, len, ry, r }]. Collisions with the room's own pieces were walked in shots.
const DRESS = {
  fifth: { iv: { side: 1, proj: [15.6, 2.8, 0, -1.3] }, gelt: [18.6, 1.32, 1.0], deer: [[17.4, -2.6, -2.0, 1.8]], snowmen: [[2.6, -4.6, 0.9]], ads: [[3.2, 2.6, PI / 2, 'ad_n3wyorkers']], boards: [[1, -3.2, 'ad_mlowxyz']], orns: [[16.2, -4.9, 0.5], [17.3, -5.4, 0.32]], watch: [[2.0, 7.6, -7.86, 0, 0.9]], radio: [1.3, 4.6, { model: 'ph_boombox', h: 0.42, y: 0.48, ry: PI / 2 }], lamps: [[1.4, -5.6], [18.4, -5.6]], firs: [[1.3, -1.2, 2.4], [18.5, -1.2, 2.4]],
    props: [['ph_CoffeeCart_01', 16.8, 4.6, { h: 1.9, ry: -PI / 2, r: 0.8 }], ['ph_painted_wooden_bench', 1.3, 4.6, { len: 1.8, ry: PI / 2, r: 0.6 }], ['ph_utility_box_01', 18.6, 1.0, { h: 1.2, ry: -PI / 2, r: 0.4 }], ['nyb_walking_newsbox', 1.2, 0.6, { h: 1.1, ry: PI / 2, r: 0.35 }]],
    steam: [[16.8, 1.9, 4.6, 0.8]] },
  channel: { iv: { side: -1, proj: [3.2, 4.6, 0, 1.3] }, gelt: [1.4, 0.55, 2.9], anamorph: [[3.7, 1.6, 6.8], [3.7, 2.4, -1.5], [3.7, -1.0, 4.4, 9], 'From here the paint on the paving stands up into one eye flower. Walk two steps and it smears back into the stones. Surface anamorphosis: the floor is painted as the eye at this spot would see it.'], lamps: [[1.3, 5.2, 2], [18.6, 5.2, 2]], props: [['ph_painted_wooden_bench', 1.3, 2.9, { len: 1.6, ry: PI / 2, r: 0.5 }], ['ph_painted_wooden_bench', 18.6, 2.9, { len: 1.6, ry: -PI / 2, r: 0.5 }]], curb: false },
  rink: { iv: { side: -1, proj: [3.0, 4.8, 0, 1.2] }, gelt: [17.9, 1.85, 5.2], ads: [[1.6, 2.2, PI / 2, 'ad_mlownyc']], radio: [17.9, 4.2, { model: 'ph_vintage_radio_transceiver', h: 0.3, y: 1.0, ry: -PI / 2 }], canopy: { zs: [2.2, 5.0], y: 5.4 }, props: [['nyb_heat_ices', 17.9, 5.2, { h: 1.7, ry: -PI / 2, r: 0.7 }], ['ph_painted_wooden_bench', 1.3, 5.6, { len: 1.6, ry: PI / 2, r: 0.5 }]], steam: [[17.9, 1.7, 5.2, 0.6]] },
  tree: { iv: { side: 1, proj: [14.2, 4.4, 0, -1.2] }, gelt: [2.4, 1.12, -4.6], ads: [[16.9, 2.4, -PI / 2, 'ad_mlownyc']], boards: [[-1, -2.6, 'ad_count']], orns: [[3.6, -5.5, 0.45], [4.5, -5.7, 0.3], [13.4, -5.7, 0.42], [12.6, -5.9, 0.26]], canopy: { zs: [1.0, 4.0, 6.6] }, lamps: [[1.3, -0.6, 2], [18.6, 1.4, 2]], firs: [[1.4, 4.2, 2.6], [18.5, 4.6, 2.6]], gap: [4, 16],
    props: [['ph_tool_cart', 2.4, -4.6, { h: 1.0, ry: 0.4, r: 0.5 }], ['nyb_rink_gift_a', 3.2, -5.6, { h: 0.6, r: 0.4 }], ['nyb_rink_gift_b', 16.9, -6.0, { h: 0.7 }]] },
  top: { facades: false, gelt: [2.0, 0.58, 3.0], globe: [16.4, 2.4], canopy: { zs: [-1, 3], y: 3.6, sag: 0.5 }, firs: [[1.4, 5.4, 1.8], [18.5, 5.4, 1.8]], props: [['ph_painted_wooden_bench', 2.0, 3.0, { len: 1.8, ry: PI / 2, r: 0.6 }]] },
  menorah: { iv: { side: 1, proj: [16.2, 4.6, 0, -1.3] }, gelt: [1.3, 0.58, 2.4], ads: [[16.6, 1.6, -PI / 2, 'ad_n3wyorkers']], boards: [[-1, -2.4, 'ad_mlowxyz']], canopy: { zs: [2.4, 5.6] }, lamps: [[1.4, -4.6], [1.4, 4.8]], firs: [[18.5, 5.4, 2.4]], props: [['ph_painted_wooden_bench', 1.3, 2.4, { len: 1.8, ry: PI / 2, r: 0.6 }], ['ph_CoffeeCart_01', 6.0, 5.6, { h: 1.9, r: 0.8 }]], steam: [[6.0, 1.9, 5.6, 0.7]], gap: [6, 14] },
  brooklyn: { iv: { side: 1, proj: [15.2, 3.0, 0, -1.3] }, gelt: [3.7, 0.12, 0.6], snowmen: [[16.2, -4.2, -0.8]], stand: [2.3, 1.6, PI / 2], ads: [[17.3, 1.4, -PI / 2, 'ad_mlownyc']], radio: [16.4, 4.2, { model: 'ph_boombox', h: 0.45, y: 1.02, ry: -2.2 }], canopy: { zs: [0.4, 3.4, 6.2], palette: WARM_BLUE }, lamps: [[1.3, -4.8, 2]], firs: [[1.4, 5.4, 2.2]],
    props: [['ph_CoffeeCart_01', 17.4, 5.0, { h: 1.9, ry: -PI / 2, r: 0.8 }], ['ph_plastic_monobloc_chair_01', 13.6, 4.6, { h: 0.85, ry: 2.4 }], ['ph_plastic_monobloc_chair_01', 14.5, 5.6, { h: 0.85, ry: 3.4 }], ['ph_plastic_monobloc_chair_01', 12.9, 5.8, { h: 0.85, ry: 1.2 }]],
    steam: [[17.4, 1.9, 5.0, 0.7]], gap: [6, 14] },
  window: { gelt: [10.1, 0.48, -5.3], canopy: { xa: 4.65, xb: 15.35, zs: [-6.6, -3.6, -0.8], y: 3.2, sag: 0.38, step: 0.24, palette: [[0.25, 0.45, 1], [1, 1, 1], [1, 0.86, 0.6], [0.25, 0.45, 1]] }, radio: [6.8, -6.6, { y: 0.62, h: 0.3, ry: 2.6 }], props: [['ph_side_table_01', 6.8, -6.6, { h: 0.6, r: 0.3 }], ['ph_dining_table', 10, 3.6, { len: 1.8, r: 1.0 }], ['ph_dining_chair_02', 9.2, 3.0, { h: 0.95, ry: 0.2 }], ['ph_dining_chair_02', 10.8, 3.0, { h: 0.95, ry: -0.2 }], ['ph_brass_candleholders', 10, 3.6, { h: 0.3, y: 0.76 }], ['ph_vintage_grandfather_clock_01', 5.0, -0.1, { h: 2.1, r: 0.4 }], ['ph_potted_plant_02', 14.9, -7.3, { h: 1.3, r: 0.35 }]] },
  dyker: { sleigh: true, iv: { side: -1, proj: [3.6, 2.6, 0, 1.3] }, gelt: [2.2, 0.62, 5.2], deer: [[16.4, 1.2, -2.2], [17.6, 3.4, -2.6, 1.5]], snowmen: [[3.0, -4.4, 1.2]], orns: [[17.8, -3.0, 0.55], [16.8, -3.7, 0.34]], watch: [[W - 0.5, 7.4, -1.8, -PI / 2, 1.0]], radio: [2.2, 5.2, { model: 'ph_boombox', h: 0.5, ry: 2.2 }], canopy: { zs: [-4.6, -1.6, 1.4, 4.4, 7.0], palette: [...WARM, [1, 0.2, 0.2], [0.2, 0.9, 0.35], [0.22, 0.42, 1]] }, lamps: [[1.4, 2.0, 2]], firs: [[18.5, 6.4, 2.6]],
    props: [['nyb_big_soldier', 1.2, -2.6, { h: 2.4, ry: PI / 2, r: 0.4 }], ['nyb_big_soldier', 1.2, 0.6, { h: 2.4, ry: PI / 2, r: 0.4 }], ['ph_CoffeeCart_01', 15.0, 6.4, { h: 1.9, ry: PI, r: 0.8 }]], steam: [[15.0, 1.9, 6.4, 0.6]] },
};
// wet paving: a Reflector a few millimetres over the floor that only shows through in puddles (a blob mask), so the lights
// break up in the wet the way Astra asked ("wet pavement is not a mirror"). Desktop only; the rink keeps its own ice.
const WETMASK = {};
function wetFloor(c, r, g) {
  const { THREE } = c;
  const mask = WETMASK.t ||= (() => { const t = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, rr = 14 + Math.random() * 70, gr = q.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { q.save(); q.translate(dx, dy); q.beginPath(); q.ellipse(x, y, rr, rr * (0.4 + Math.random() * 0.5), Math.random() * 3, 0, 7); q.fill(); q.restore(); } } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; })();
  const shader = { name: 'WetShader', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tMask: { value: mask }, uK: { value: r.wetK || 0.4 } },
    vertexShader: ['uniform mat4 textureMatrix;', 'varying vec4 vUv;', 'varying vec2 vP;', '#include <common>', '#include <logdepthbuf_pars_vertex>',
      'void main() {', ' vUv = textureMatrix * vec4( position, 1.0 ); vP = position.xy;', ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', ' #include <logdepthbuf_vertex>', '}'].join('\n'),
    fragmentShader: ['uniform vec3 color;', 'uniform sampler2D tDiffuse, tMask;', 'uniform float uK;', 'varying vec4 vUv;', 'varying vec2 vP;', '#include <logdepthbuf_pars_fragment>',
      'void main() {', ' #include <logdepthbuf_fragment>', ' vec4 base = texture2DProj( tDiffuse, vUv );', ' float m = texture2D( tMask, vP * 0.085 ).r * 0.75 + texture2D( tMask, vP * 0.031 + 0.37 ).r * 0.45;',
      ' m = smoothstep( 0.7, 1.1, m );', ' gl_FragColor = vec4( base.rgb * color, m * uK );', ' #include <tonemapping_fragment>', ' #include <colorspace_fragment>', '}'].join('\n') };
  const res = Math.min(1024, Math.round(innerWidth * 0.5));
  const wet = new Reflector(new THREE.PlaneGeometry(W - 0.3, D - 0.3), { clipBias: 0.003, textureWidth: res, textureHeight: Math.round(res * innerHeight / innerWidth), color: 0x9aa4b4, shader });
  wet.material.transparent = true; wet.material.depthWrite = false; wet.renderOrder = 1;
  wet.rotation.x = -PI / 2; wet.position.set(W / 2, 0.004, 0); g.add(wet); r.wet = wet;
}
// the holiday radio (v2.1): one dial, eight traditions (music.js r_*). Each click tunes to the next station; hearing them all is an egg.
const RADIO = { k: -1, heard: new Set() };
const STATIONS = ['r_chanukah', 'r_christmas', 'r_shchedryk', 'r_posadas', 'r_parranda', 'r_kwanzaa', 'r_yalda', 'r_diwali'];
function holidayRadio(c, r, g, X, x, z, { model = 'ph_vintage_radio_transceiver', h = 0.35, y = 0, ry = 0, start } = {}) {
  const m = prop(c, r, g, X, model, x, z, { h, y, ry, r: y ? 0 : 0.3 });
  const tune = () => { RADIO.k = (RADIO.k + 1) % STATIONS.length; const st = STATIONS[RADIO.k]; c.music.play(st); snd(c, 'click'); RADIO.heard.add(st);
    const lab = (c.music.STYLES[st] || {}).label || st; c.toast(`WNYL HOLIDAY RADIO · ${lab}`, 3200);
    if (RADIO.heard.size === STATIONS.length) c.egg('radio', 'All eight stations: Chanukah, Christmas, the Ukrainian Shchedryk, Las Posadas, a Puerto Rican parranda, Kwanzaa, Yalda and Diwali. One city, one dial, the same long nights.'); };
  c.clickable(m, tune, 'The holiday radio');
  return m;
}

// eggs that are named at run time, listed here so the egg count sees them: egg: 'ads_n3wyorkers' egg: 'ads_mlownyc' egg: 'ads_mlowxyz' egg: 'ads_count'
// ---------- v2.1 (MLow: "more dynamic, more illusions, my art everywhere, fake ads, more 3D, more decorations") ----------
const ADTEX = {};
function adTex(c, src) { const { THREE } = c; const t = ADTEX[src] ||= c.tex.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a backlit street kiosk: an ad for one of MLow's sites on the street face, his census art turning over on the other
function adKiosk(c, r, g, X, x, z, ry, ad) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 0.7);
  const frame = std(c, 0x16181d, { metalness: 0.7, roughness: 0.35 });
  o.add(c.slab(1.36, 2.36, 0.34, frame, 0, 1.18 + 0.12, 0)); o.add(c.slab(1.5, 0.12, 0.42, frame, 0, 0.06, 0)); o.add(c.slab(1.46, 0.1, 0.4, frame, 0, 2.47, 0));
  const face = (src, zz, flip) => { const m = new THREE.MeshBasicMaterial({ map: adTex(c, src), toneMapped: false }); m.color.setScalar(0.62); m.userData.e0 = 0;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8 * 1.2 / 1.2 * 1.5 / 1.5 * 1.8 / 1.8), m); p.scale.set(1, 1, 1); p.position.set(0, 1.32, zz); if (flip) p.rotation.y = PI; o.add(p); return p; };
  const front = face(`assets/ads/${ad}.jpg`, 0.175, false); front.geometry = new THREE.PlaneGeometry(1.2, 1.8);
  c.clickable(front, () => c.egg('ads_' + ad.split('_')[1], { ad_n3wyorkers: 'N3WYORKERS.COM: every New Yorker, counted. The ad is fake. The census is not.', ad_mlownyc: 'MLOW.NYC: framed prints, made in New York. You are standing in the advertisement.', ad_mlowxyz: 'MLOW.XYZ: the artist, the whole story. Billboards are the oldest walkable gallery in the city.', ad_count: 'COUNT ME IN, NEW YORK. N3WYORKERS.COM. The crowd on the billboard has more eyes than faces.' }[ad] || 'An advertisement.'), 'An advertisement');
  // the art side turns over every nine seconds, through the room's own New Yorkers
  const cast = (r.cast || []).filter((p) => p.f); if (!cast.length) return o;
  const am = new THREE.MeshBasicMaterial({ toneMapped: false }); am.color.setScalar(0.66);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), am); back.position.set(0, 1.32, -0.175); back.rotation.y = PI; o.add(back);
  let k = (Math.random() * cast.length) | 0, cur = null;
  const show = () => { const p = cast[k % cast.length]; cur = p; const t = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height, b = 1.2 / 1.8; if (a > b) { tt.repeat.set(b / a, 1); tt.offset.set((1 - b / a) / 2, 0); } else { tt.repeat.set(1, a / b); tt.offset.set(0, (1 - a / b) / 2); } }); t.colorSpace = THREE.SRGBColorSpace; am.map = t; am.needsUpdate = true; };
  show(); let tt = Math.random() * 9; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tt += dt; if (tt > 9) { tt = 0; k++; show(); } });
  c.clickable(back, () => cur && c.openPiece && c.openPiece(cur), 'A New Yorker in a lightbox');
  const pool = spill(c, 1.6, 1.4, true); pool.rotation.z = PI / 2; pool.position.set(0, 0.016, 0.9); o.add(pool); r.dress.mats.push(pool.material);
  return o;
}
// a lit billboard on the upper storeys, with its own lamps
const AD_ASPECT = { ad_mlowxyz: 2.51 };
function billboard(c, r, g, side, z, ad, y = 7.4, w = 6.4) {
  const hh = w / (AD_ASPECT[ad] || 2);
  const { THREE } = c, x = side < 0 ? (r.arch ? 0.5 : 0.2) : W - (r.arch ? 0.75 : 0.45), ry = side < 0 ? PI / 2 : -PI / 2, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const m = new THREE.MeshStandardMaterial({ map: adTex(c, `assets/ads/${ad}.jpg`), emissiveMap: adTex(c, `assets/ads/${ad}.jpg`), emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.6 }); m.userData.e0 = 0.85; r.dress.mats.push(m);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), m); face.position.z = 0.1; o.add(face);   // (o.add() returns o: setting .position on it moved the whole board behind its own frame)
  o.add(c.slab(w + 0.3, hh + 0.3, 0.12, std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), 0, 0, 0.02));
  for (let i = 0; i < 4; i++) { const lx = -w / 2 + w * (i + 0.5) / 4; o.add(c.slab(0.06, 0.06, 0.9, std(c, 0x222222), lx, -hh / 2 - 0.25, 0.45));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.9 })); s.position.set(lx, -hh / 2 - 0.2, 0.9); s.scale.set(0.6, 0.6, 1); s.userData.op0 = 0.9; o.add(s); r.dress.glows.push(s); }
  return o;
}
// banners of the room's New Yorkers on a lamp post, both sides, clickable to the piece
function lampBanners(c, r, g, x, z, k0 = 0) {
  const { THREE } = c, cast = (r.cast || []).filter((p) => p.f); if (!cast.length) return;
  [-1, 1].forEach((sx, j) => { const p = cast[(k0 + j) % cast.length];
    const t = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height, b = 0.55 / 1.1; if (a > b) { tt.repeat.set(b / a, 1); tt.offset.set((1 - b / a) / 2, 0); } }); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.1), m); b.position.set(x + sx * 0.36, 2.55, z); b.rotation.y = PI / 2; g.add(b);
    g.add(c.slab(0.7, 0.03, 0.03, std(c, 0x1a1a1a, { metalness: 0.8 }), x, 3.12, z));
    let ph = Math.random() * 6; c.tick((tm) => { b.rotation.y = PI / 2 + Math.sin(tm * 0.9 + ph) * 0.06; });
    c.clickable(b, () => c.openPiece && c.openPiece(p), `${p.t}, on a banner`); });
}
// a sidewalk tree seller: firs leaned in a frame, a string of bulbs, a hand painted sign, a barrel fire
function treeStand(c, r, g, X, x, z, ry = 0) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 1.2);
  const wood = std(c, 0x6a4a2a, { roughness: 0.85 });
  o.add(c.slab(3.2, 0.08, 0.08, wood, 0, 2.2, -0.35)); for (const sx of [-1.55, 1.55]) o.add(c.slab(0.08, 2.2, 0.08, wood, sx, 1.1, -0.35));
  for (let i = 0; i < 6; i++) { const t = c.glb('ph_fir_tree_01', { h: 1.9 + (i % 3) * 0.25, x: -1.3 + i * 0.52, z: -0.5, parent: o, shadow: false }); t.rotation.x = -0.14; t.rotation.z = (Math.random() - 0.5) * 0.1; }
  const pts = strand(Array.from({ length: 13 }, (_, i) => [-1.55 + i * 3.1 / 12, 2.17 - Math.sin(i / 12 * PI) * 0.18, -0.3]), 0.15).map((p) => [p[0], p[1], p[2], Math.random(), WARM[(Math.random() * 4) | 0]]);
  const led = ledPoints(c, o, pts, { size: 0.08, gain: 2.4 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led);
  const sg = c.sign('FRESH TREES\nN3W YORKERS · ASK INSIDE', { w: 1.5, h: 0.6, bg: '#efe4c8', fg: '#7a1a1a', font: c.SERIF, weight: 900, px: 128, pad: 0.1 }); sg.position.set(0, 2.55, -0.3); o.add(sg);
  c.clickable(sg, () => c.egg('trees', 'Every December the sidewalk sellers arrive with trucks of firs and live beside them for a month. The tree is for you. The sign is the whole business plan.'), 'A tree seller');
  const barrel = new THREE.Group(); barrel.position.set(1.9, 0, 0.4); o.add(barrel); c.glb('ph_barrel_stove', { h: 0.9, parent: barrel });
  flameSprite(c, barrel, 0, 1.0, 0, 0.45).visible = true; steam(c, o, 1.9, 1.3, 0.4, 0.6);
}
// giant clearcoat ornaments set down on the street, and wreaths with bows on the lamp posts
const ORN = {};
function ornaments(c, r, g, X, spots) {
  const { THREE } = c, cols = [0xb4161e, 0xd8a640, 0x2962ff, 0xe8e8ee, 0x1f6a3a];
  spots.forEach(([x, z, s = 0.5], i) => { const m = new THREE.MeshPhysicalMaterial({ color: cols[i % cols.length], metalness: 0.85, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 40, 24), m); b.position.set(x, s * 0.98, z); g.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.18, s * 0.2, s * 0.22, 20), std(c, 0xc8a040, { metalness: 1, roughness: 0.25 })); cap.position.set(x, s * 1.98, z); g.add(cap); c.post(X(x), z, s + 0.1); });
}
function wreath(c, g, x, y, z, ry = 0, s = 0.42) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const nm = ORN.n ||= new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 });
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(s * 0.17, 0), nm, 46), m4 = new THREE.Matrix4();
  for (let i = 0; i < 46; i++) { const a = i / 46 * PI * 2, rr = s * (0.82 + Math.random() * 0.12); m4.makeTranslation(Math.cos(a) * rr, Math.sin(a) * rr, (Math.random() - 0.5) * s * 0.2); im.setMatrixAt(i, m4); } o.add(im);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.16, s * 0.06, 8, 16), ORN.b ||= std(c, 0xb4161e, { roughness: 0.45 })); bow.position.set(0, -s * 0.85, 0.05); bow.scale.set(1.6, 1, 1); o.add(bow);
}
// ILLUSION: a picture painted flat across the paving that stands up as an eye flower from one spot only (surface anamorphosis:
// the floor samples the image through a virtual camera at the sweet spot, so from there it lines up into a figure in the air)
function anamorphFlower(c, r, g, X, eye, aim, area, line) {
  const { THREE } = c, cam = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  cam.position.set(X(eye[0]), eye[1], eye[2]); cam.lookAt(X(aim[0]), aim[1], aim[2]); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const VP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const tex = c.canvasTex(1024, 1024, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.96); });
  const m = new THREE.ShaderMaterial({ uniforms: { uVP: { value: VP }, uMap: { value: tex }, uT: { value: 0 }, uNear: { value: 0 } }, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -8,
    vertexShader: 'uniform mat4 uVP; varying vec4 vC; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vC = uVP * wp; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uT, uNear; varying vec4 vC; void main(){ vec2 uv = vC.xy / vC.w * .5 + .5; if (vC.w < 0. || uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard; vec4 t = texture2D(uMap, uv); if (t.a < .02) discard; gl_FragColor = vec4(t.rgb * (0.9 + 0.1 * sin(uT * 2.)), t.a * 0.92 * uNear * uNear); }' });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(area[2], area[3]).rotateX(-PI / 2), m); p.position.set(area[0], 0.02, area[1]); p.renderOrder = 3; g.add(p);
  const mark = c.sign('LOOK FROM HERE', { w: 0.9, h: 0.22, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 700 }); mark.rotation.x = -PI / 2; mark.position.set(eye[0], 0.025, eye[2] + 0.35); g.add(mark);
  let got = false; const f = new THREE.Vector3(), d = new THREE.Vector3();
  c.tick((t, dt, P, ri) => { m.uniforms.uT.value = t; m.uniforms.uNear.value = Math.max(0, 1 - Math.hypot(P.x - X(eye[0]), P.z - eye[2]) / 3); if (got || ri !== r.i) return; if (Math.hypot(P.x - X(eye[0]), P.z - eye[2]) > 0.45) return;
    c.camera.getWorldDirection(f); d.set(X(aim[0]) - c.camera.position.x, aim[1] - c.camera.position.y, aim[2] - c.camera.position.z).normalize(); if (f.dot(d) > 0.96) { got = true; c.egg('anamorph', line); } });
}
// ILLUSION: a snow globe on a plinth. Real glass (transmission), a tiny tree and menorah inside; click and the snow goes up
function snowGlobe(c, r, g, X, x, z) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); c.post(X(x), z, 0.75);
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.95, 40), std(c, 0x2a1c14, { roughness: 0.4 })).translateY(0.475));
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.07, 40), std(c, 0xc8a040, { metalness: 1, roughness: 0.25 })).translateY(0.95));
  const R = 0.62, cy = 0.98 + R * 0.92;
  const inner = new THREE.Group(); inner.position.y = 0.99; o.add(inner);
  inner.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.06, 40), std(c, 0xf2f4f8, { roughness: 0.9 })));
  const tree = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 18), std(c, 0x1d4a2a, { roughness: 0.8 })); tree.position.set(-0.16, 0.34, 0); inner.add(tree);
  const tp = []; for (let i = 0; i < 70; i++) { const u = i / 70, a = u * 6 * PI * 2; tp.push([-0.16 + Math.cos(a) * (1 - u) * 0.17, 0.06 + u * 0.6, Math.sin(a) * (1 - u) * 0.17, Math.random(), WARM_BLUE[(Math.random() * 7) | 0]]); }
  const tl = ledPoints(c, inner, tp, { size: 0.02, gain: 2.6 }); tl.material.uniforms.uOn.value = 2;
  const gold = std(c, 0xd8a640, { metalness: 1, roughness: 0.25 }); const men = new THREE.Group(); men.position.set(0.2, 0.04, 0.05); inner.add(men);
  men.add(c.slab(0.02, 0.24, 0.02, gold, 0, 0.12, 0)); for (let i = -4; i <= 4; i++) { if (!i) continue; const h = 0.07 + Math.abs(i) * 0.012; men.add(c.slab(0.012, h, 0.012, gold, i * 0.024, 0.2 - h / 2 + 0.02, 0)); }
  const fl = ledPoints(c, men, [...Array(9)].map((_, i) => [(i - 4) * 0.024, i === 4 ? 0.27 : 0.235, 0, Math.random(), [1, 0.62, 0.22]]), { size: 0.018, gain: 3 }); fl.material.uniforms.uOn.value = 2;
  const N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const reset = (i, up) => { const a = Math.random() * 6.283, rr = Math.random() * R * 0.8, y = up ? Math.random() * R * 1.4 : 0.05; pos.set([Math.cos(a) * rr, y, Math.sin(a) * rr], i * 3); };
  for (let i = 0; i < N; i++) reset(i, true);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sn = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.9, depthWrite: false })); inner.add(sn);
  let shake = 0; c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 0) return; shake = Math.max(0, shake - dt * 0.25);
    for (let i = 0; i < N; i++) { const k = i * 3; if (shake > 0.3) { vel[k] += (Math.random() - 0.5) * dt * 4 * shake; vel[k + 1] += (Math.random() - 0.35) * dt * 6 * shake; vel[k + 2] += (Math.random() - 0.5) * dt * 4 * shake; }
      vel[k] *= 0.96; vel[k + 1] = vel[k + 1] * 0.96 - dt * 0.04; vel[k + 2] *= 0.96; pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt - dt * 0.05; pos[k + 2] += vel[k + 2] * dt;
      const rr = Math.hypot(pos[k], pos[k + 1] - R * 0.92, pos[k + 2]); if (rr > R * 0.94 || pos[k + 1] < 0.04) { if (pos[k + 1] < 0.04) { pos[k + 1] = 0.04; vel[k + 1] = 0; } else { pos[k] *= 0.93; pos[k + 1] = R * 0.92 + (pos[k + 1] - R * 0.92) * 0.93; pos[k + 2] *= 0.93; } } }
    sg.attributes.position.needsUpdate = true; });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 36), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.35, ior: 1.32, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, transparent: true }));
  glass.position.y = cy; o.add(glass);
  const plq = c.sign('SHAKE', { w: 0.5, h: 0.14, bg: '#c8a040', fg: '#1a1208', font: c.SERIF, weight: 900 }); plq.position.set(0, 0.6, 0.73); o.add(plq);
  const go = () => { shake = 1.6; r.replay = 0; for (let i = 0; i < N; i++) { vel[i * 3 + 1] = Math.random() * 1.2; } snd(c, 'whoosh', 0.4, 1); c.egg('globe', 'The whole plaza in a glass ball: the tree, a menorah, the snow you just stirred up. Seventy floors up, the city is a souvenir of itself.'); };
  c.clickable(glass, go, 'A snow globe'); c.clickable(plq, go, 'A snow globe');
  // the real glass needs to see the room behind it; without a background the transmission pass reads black, so keep it lit
  return o;
}

// a lit wire reindeer: the Tripo deer becomes a faint white wireframe, and warm bulbs are sampled across its surface
function litReindeer(c, r, g, X, x, z, ry = 0, h = 1.9) {
  const { THREE } = c; c.post(X(x), z, 0.7);
  const m = c.glb('lt_reindeer', { h, x, z, ry, parent: g, shadow: true, onload: (grp, sc) => {
    const pts = [], v = new THREE.Vector3(); grp.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert();
    sc.traverse((o) => { if (!o.isMesh) return; o.material = new THREE.MeshBasicMaterial({ color: 0xf4f0e6, wireframe: true, transparent: true, opacity: 0.22, depthWrite: false });
      const smp = new MeshSurfaceSampler(o).build(); for (let i = 0; i < 1400; i++) { smp.sample(v); v.applyMatrix4(o.matrixWorld).applyMatrix4(inv); pts.push([v.x, v.y, v.z, Math.random(), WARM[(Math.random() * 4) | 0]]); } });
    const led = ledPoints(c, grp, pts, { size: 0.045, gain: 2.2 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); } });
  c.clickable(m, () => c.egg('reindeer', 'A wire reindeer wrapped in fourteen hundred bulbs. On this block they come in herds, and the herds compete.'), 'A wire reindeer');
  let ph = Math.random() * 6; c.tick((t) => { m.rotation.y = ry + Math.sin(t * 0.4 + ph) * 0.05; });
  return m;
}

// the gelt hunt: one foil coin hidden in every room, stamped with an eye flower; all nine is an egg
const GELT = { got: new Set() };
function gelt(c, r, g, x, y, z) {
  const { THREE } = c, face = c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(w * 0.4, h * 0.35, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.6, '#d8a640'); gr.addColorStop(1, '#8a6420'); q.fillStyle = gr; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.3); });
  const m = new THREE.MeshStandardMaterial({ map: face, metalness: 0.9, roughness: 0.25, emissive: 0x332200, emissiveMap: face });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 32), [new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 1, roughness: 0.3 }), m, m]);
  coin.rotation.x = PI / 2; const o = new THREE.Group(); o.position.set(x, y, z); o.add(coin); g.add(o);
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })); glint.scale.set(0.3, 0.3, 1); o.add(glint);
  c.tick((t) => { o.rotation.y = t * 1.6; o.position.y = y + Math.sin(t * 2) * 0.015; glint.material.opacity = Math.max(0, Math.sin(t * 1.3 + x) ** 16) * 0.9; });
  c.clickable(coin, () => { if (GELT.got.has(r.id)) return; GELT.got.add(r.id); o.visible = false; snd(c, 'clink', 3200); c.toast(`Chocolate gelt, ${GELT.got.size} of 9.`, 2200);
    if (GELT.got.size === 9) c.egg('gelt', 'All nine pieces of gelt: one in every room. Coins at Chanukah are an old custom; the chocolate kind is the delicious modern one. The foil is the best part, and you know it.'); }, 'Something shiny');
}

// ---------- v3 motion ----------
// The Impermanent Vision show: one building's upper storeys become MLow's living surface. Contour rivers in world space bend
// toward the windows (the thresholds), paint drips fall from the sills, and one sovereign Open Eye Flower opens over the
// street and blinks. A projector on the pavement switches the intensity: Whisper, Bloom, Melt; it also runs by itself.
const IV_MODE = ['OFF', 'WHISPER', 'BLOOM', 'MELT'];
function ivShow(c, r, g, X, { side = -1, z0 = -8, z1 = 1.9, y0 = 5.05, y1 = 9.9, proj } = {}) {
  const { THREE } = c, x = side < 0 ? 0.32 : W - 0.57, L = z1 - z0, Hh = y1 - y0;
  const flower = c.canvasTex(512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.95); });
  const U = { uT: { value: 0 }, uAmt: { value: 0 }, uMode: { value: 0 }, uOpen: { value: 0 }, uFlower: { value: flower }, uAsp: { value: L / Hh } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uT, uAmt, uMode, uOpen, uAsp; uniform sampler2D uFlower; varying vec2 vUv;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * n2(p); p *= 2.03; a *= .5; } return s; }
      void main(){
        vec2 p = vec2(vUv.x * uAsp, vUv.y) * 3.;
        // the windows are the attractors: the field crowds and bends toward each one, as paint pouring out of a threshold
        float att = 0.; for (int i = 0; i < 6; i++) { vec2 w = vec2((float(i) + .5) / 6. * uAsp * 3., (mod(float(i), 2.) < .5 ? .25 : .72) * 3.); att += exp(-length(p - w) / .55); }
        float field = fbm(p * .8 + vec2(0., uT * .05 * uMode)) * 3. + att * 1.3 + uT * .04 * uMode;
        float k = 6. + uMode * 2.; float ln = abs(fract(field * k) - .5); float heavy = mod(floor(field * k), 5.) < .5 ? 1.5 : .8;
        float line = smoothstep(.025, .0, ln - .47) * heavy;
        vec3 cob = vec3(.16, .38, 1.), cy = vec3(0., .9, 1.), pk = vec3(1., .18, .39), vi = vec3(.44, .14, .66);
        vec3 col = mix(cob, cy, smoothstep(.3, .9, fbm(p * .5 + 7.))) * line;
        col += pk * line * smoothstep(.72, .95, fbm(p * .35 + uT * .03)) * step(1.5, uMode);
        // drips from the sills: thin vertical runs that grow down in Bloom and Melt
        float dx = floor(vUv.x * 46.); float rnd = h21(vec2(dx, 3.)); float len = fract(rnd * 7. + uT * .03 * (.5 + rnd)) * (.2 + .3 * uMode);
        float top = rnd > .55 ? .72 : .25; float drip = step(abs(fract(vUv.x * 46.) - .5), .07) * step(top - len, vUv.y) * step(vUv.y, top) * step(1.5, uMode);
        col += mix(cob, pk, rnd) * drip * .9;
        // the sovereign Eye Flower, over the middle of the building, opening with uOpen (Melt), blinking now and then
        vec2 fc = (vUv - vec2(.5, .55)) * vec2(uAsp, 1.) / max(.01, .42 * uOpen); float blink = smoothstep(.0, .06, abs(fract(uT * .11) - .5) - .44);
        if (abs(fc.x) < .5 && abs(fc.y) < .5 && uOpen > .01) { vec4 f = texture2D(uFlower, fc + .5); col = mix(col, f.rgb * 1.9, f.a * uOpen * (fc.y > -.08 && fc.y < .08 ? blink : 1.)); }
        float edge = smoothstep(0., .04, vUv.x) * smoothstep(1., .96, vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(1., .95, vUv.y);
        gl_FragColor = vec4(col * uAmt * edge * .3, 1.); }` });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh), m); p.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); p.rotation.y = side < 0 ? PI / 2 : -PI / 2; p.renderOrder = 4; g.add(p);
  let mode = 0, want = 0, auto = 18 + Math.random() * 20, autoT = 0;
  const set = (k) => { mode = k; want = [0, 0.55, 1, 1.25][k]; U.uMode.value = k; c.toast(`IMPERMANENT VISION · ${IV_MODE[k]}`, 1800); snd(c, 'whoosh', 0.3 + k * 0.2, 1); if (k === 3) c.egg('melt', 'MELT: the building gives up being a building for a moment. Contour rivers pour out of every window toward the one eye that is watching the street. Impermanent Vision, by MLow.'); };
  if (proj) { const pr = prop(c, r, g, X, 'ph_filmstrip_projector_8mm', proj[0], proj[1], { h: 0.5, y: proj[2] || 0, ry: proj[3] || 0, r: 0.3 });
    c.clickable(pr, () => { auto = 9999; set((mode + 1) % 4); }, 'A projector'); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; U.uT.value = t;
    if (auto < 9999) { auto -= dt; if (auto <= 0 && mode === 0) { set(2); autoT = 14; auto = 40 + Math.random() * 20; } if (autoT > 0) { autoT -= dt; if (autoT <= 0) set(0); } }
    U.uAmt.value += (want * (r.dress ? Math.min(1, r.dress.level + 0.3) : 1) - U.uAmt.value) * Math.min(1, dt * 1.5);
    U.uOpen.value += ((mode >= 2 ? (mode === 3 ? 1 : 0.55) : 0) - U.uOpen.value) * Math.min(1, dt * 0.8); });
}
// the lights keep time with the radio: canopies and outlines swell on every beat of whatever station is on
function beatLights(c, r) {
  c.tick((t, dt, P, ri) => { if (ri !== r.i || !r.dress) return; const st = c.music.style || '', on = st.startsWith('r_') || st === r.music;
    const b = c.music.beat || 0.5, ph = (t % b) / b, pulse = on ? 0.95 + 0.1 * Math.pow(1 - ph, 6) : 1;   // Astra: decorative pulse about 10% around rest; fill and navigation never pulse
    r.dress.leds.forEach((o) => { const u = o.material.uniforms; if (u.uGainBase === undefined) u.uGainBase = u.uGain.value; u.uGain.value = u.uGainBase * pulse; }); });
}
// a lit sleigh and two wire reindeer flying a loop over Dyker Heights, bells on the way past
function flyingSleigh(c, r, g, X) {
  const { THREE } = c, o = new THREE.Group(); g.add(o);
  const sl = new THREE.Group(); o.add(sl); o.scale.setScalar(1.5); const red = std(c, 0x8a1010, { roughness: 0.4, metalness: 0.3 }), gold = std(c, 0xd8a640, { metalness: 1, roughness: 0.3 });
  sl.add(c.slab(1.2, 0.5, 0.7, red, 0, 0.45, 0)); sl.add(c.slab(0.3, 0.7, 0.7, red, -0.55, 0.65, 0)); for (const s of [-0.32, 0.32]) sl.add(c.slab(1.6, 0.05, 0.05, gold, 0.1, 0.12, s));
  const pts = []; for (let i = 0; i < 60; i++) { const a = i / 60; pts.push([-0.6 + a * 1.2, 0.72, (i % 2 ? 0.36 : -0.36), Math.random(), WARM[(i * 3) % 4]]); }
  const led = ledPoints(c, sl, pts, { size: 0.06, gain: 2.6 }); led.material.uniforms.uOn.value = 2;
  [1.6, 2.9].forEach((dx, i) => { const d = c.glb('lt_reindeer', { h: 1.3, x: dx, z: 0, ry: PI / 2, parent: o, shadow: false, onload: (grp, sc) => { const v = new THREE.Vector3(), q = [], inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(); grp.updateMatrixWorld(true);
      sc.traverse((mm) => { if (!mm.isMesh) return; mm.material = new THREE.MeshBasicMaterial({ color: 0xf4f0e6, wireframe: true, transparent: true, opacity: 0.2, depthWrite: false }); const smp = new MeshSurfaceSampler(mm).build(); for (let k = 0; k < 700; k++) { smp.sample(v); v.applyMatrix4(mm.matrixWorld).applyMatrix4(inv); q.push([v.x, v.y, v.z, Math.random(), WARM[(k * 7) % 4]]); } });
      const l2 = ledPoints(c, grp, q, { size: 0.04, gain: 2.2 }); l2.material.uniforms.uOn.value = 2; } }); });
  let rang = false; c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 0) { o.visible = false; return; } o.visible = true;
    const a = t * 0.1, x = W / 2 + Math.cos(a) * 11, z = -8 + Math.sin(a) * 7, y = 7.6 + Math.sin(a * 2) * 0.6;
    o.position.set(x, y, z); o.rotation.y = -a + PI; o.rotation.z = Math.sin(a * 2) * 0.08;
    const near = Math.hypot(x - c.camera.position.x, z - c.camera.position.z) < 9; if (near && !rang) { rang = true; snd(c, 'ding'); } if (!near) rang = false; });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(1.4, 0.6, 0); o.add(hit);
  c.clickable(hit, () => c.egg('sleigh', 'A sleigh over Dyker Heights, pulled by two reindeer made of bulbs. On this block, even the sky has entered the competition.'), 'A flying sleigh');
}
// the south wall, behind you as you walk in, carries one of MLow's Impermanent Vision murals painted on the stone (generated
// in his language from the skill's references; edges feathered into the wall, lit faintly as street paint is)
const MURAL = { fifth: 'mural_city', channel: 'mural_city', rink: 'mural_city', tree: 'mural_city', menorah: 'mural_city', market: 'mural_brooklyn', brooklyn: 'mural_brooklyn', dyker: 'mural_brooklyn' };
function southMural(c, r, g) {
  const id = MURAL[r.id]; if (!id || !(window.WALLS || []).includes(id)) return;
  const { THREE } = c, t = c.tex.load(`assets/walls/${id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const fade = c.canvasTex(256, 128, (q, w, h) => { const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.05, '#fff'); gx.addColorStop(0.95, '#fff'); gx.addColorStop(1, '#000'); q.fillStyle = gx; q.fillRect(0, 0, w, h);
    q.globalCompositeOperation = 'multiply'; const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.08, '#fff'); gy.addColorStop(0.92, '#fff'); gy.addColorStop(1, '#000'); q.fillStyle = gy; q.fillRect(0, 0, w, h); });
  const m = new THREE.MeshStandardMaterial({ map: t, alphaMap: fade, transparent: true, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.28 }); m.userData.e0 = 0.28; r.dress.mats.push(m);
  const w = W - 3.0, h = w / 2, p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(W / 2 - 0.12, 0.7 + h / 2, D / 2 - 0.02); p.rotation.y = PI; g.add(p);
  c.clickable(p, () => c.egg('mural', 'A mural by MLow on the wall behind you: the tree and the menorah through one threshold, contour rivers pouring out into the street, one eye watching. Impermanent Vision.'), 'A mural');
}

// seventy floors up: above the parapet the side walls show the city (the deck's own skyline, cropped from its edges), so the
// terrace reads as high and open instead of a courtyard between two slabs (Astra round three)
function deckViews(c, r, g) {
  const { THREE } = c, t = c.tex.load('assets/plates/top.jpg'); t.colorSpace = THREE.SRGBColorSpace;
  [[0.13, PI / 2, 0], [W - 0.38, -PI / 2, 0.62]].forEach(([x, ry, off]) => { const tt = t.clone(); tt.repeat.set(0.38, 0.62); tt.offset.set(off, 0.12); tt.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({ map: tt, fog: false, toneMapped: true }); m.color.setScalar(0.85);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(D, 2.9), m); p.position.set(x, 1.15 + 1.45, 0); p.rotation.y = ry; g.add(p);
    g.add(c.slab(0.3, 0.12, D, std(c, 0x8a8478, { roughness: 0.7 }), x + (ry > 0 ? 0.05 : -0.05), 1.15, 0)); });
}
