// ---------- the real Rockefeller Plaza, at 1:1 (round six, 2026-11-16) ----------
// MLow: "this still doesn't look like Rockefeller Plaza or the tree there, because that is way more massive, and the layout
// of the plaza and ice skating rink and buildings are different." Until v5 the tree stood 8 m past the rope between two
// shopfronts, with a photograph behind it. Now one model of the real place, in metres, is shared by the three rooms that
// stand in it, each at its own spot in the plan: the Channel Gardens (you among the beds, the tree seventy metres off at the
// end of them), the rink (you on the ice, Prometheus and the tree over the far end), and the lighting (you at the rail where
// the gardens drop into the sunken plaza). It is drawn only from the room you are in (the neighbours stand where it would be).
// Plaza frame: px across (0 on the axis of the gardens), pz along it (0 at the east lip of the sunken plaza, negative toward
// 30 Rock), py up from street level. From the plans: the gardens 60 ft wide between La Maison Francaise and the British
// Empire Building, six storeys; the sunken plaza a storey down, the rink about 59 by 122 ft; Prometheus, about 18 ft, gilded,
// on the west wall over his pool inside the zodiac ring; the tree on the upper plaza behind him (82 ft this year); flags on
// poles round the rim; Rockefeller Plaza, the private street; then 30 Rockefeller Plaza, 850 ft, its narrow east face toward
// the gardens, stepping in as it climbs, floodlit at the crown.
const RP = { PW: 19.0, PL: 37.2, PD: 4.6, TZ: -44.6, TH: 25, TR: 6.9, ST: [-50.5, -58.5], ROCK: -60, RIM: 6.4 };
const RPU = { t: { value: 0 } };
const FMAT = {};
// a facade in light, not texture: limestone piers and window strips computed from world position, so a 260 m tower is crisp
// at any distance and costs one draw; floors lit at random, a warm ground floor of shops, floodlight at the foot and crown;
// uLevel follows the room's dress level, so the countdown takes the city down with the plaza
function plazaFacade(c, r, key, o) {
  const id = r.id + key; if (FMAT[id]) return FMAT[id];
  const { THREE } = c, p = Object.assign({ tone: [0.8, 0.75, 0.66], bay: 1.8, pier: 0.5, floor: 3.8, lit: 0.42, flood: 0.12, top: 300, topGlow: 0, ground: 0, base: 0, warm: [1, 0.74, 0.46], seed: 1 }, o);
  const m = new THREE.ShaderMaterial({ fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTone: { value: new THREE.Color(...p.tone) }, uWarm: { value: new THREE.Color(...p.warm) }, uBay: { value: p.bay }, uPier: { value: p.pier }, uFloor: { value: p.floor },
      uLit: { value: p.lit }, uFlood: { value: p.flood }, uTop: { value: p.top }, uTopGlow: { value: p.topGlow }, uGround: { value: p.ground }, uBase: { value: p.base }, uLevel: { value: 1 }, uSeed: { value: p.seed } }]),
    vertexShader: `varying vec3 vW, vN;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uTone, uWarm; uniform float uBay, uPier, uFloor, uLit, uFlood, uTop, uTopGlow, uGround, uBase, uLevel, uSeed; varying vec3 vW, vN;
      #include <fog_pars_fragment>
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.13) * 43758.5453); }
      void main(){
        vec3 n = normalize(vN), col; float yy = vW.y - uBase;
        if (abs(n.y) > 0.5) col = uTone * 0.04 * (0.4 + 0.6 * uLevel);
        else {
          float u = abs(n.z) > abs(n.x) ? vW.x : vW.z;
          float fu = u / uBay, xu = fract(fu), cu = floor(fu), fy = yy / uFloor, xy = fract(fy), cy = floor(fy), pw = uPier / uBay * 0.5;
          float win = smoothstep(pw - 0.02, pw + 0.02, xu) * smoothstep(1. - pw + 0.02, 1. - pw - 0.02, xu) * smoothstep(0.24, 0.28, xy) * smoothstep(0.86, 0.82, xy);
          float on = step(1. - uLit, h21(vec2(cu, cy) + n.xz * 31.));
          float flood = uFlood * (0.3 + 0.7 * exp(-max(yy, 0.) / 16.)) + uTopGlow * smoothstep(uTop - 75., uTop - 4., yy);
          vec3 stone = uTone * (0.05 + flood) * (0.35 + 0.65 * uLevel);
          float fr = pow(1. - abs(dot(normalize(cameraPosition - vW), n)), 3.);
          vec3 glass = vec3(0.01, 0.014, 0.024) + vec3(0.05, 0.06, 0.09) * fr;
          vec3 lamp = uWarm * (0.42 + 0.7 * h21(vec2(cy, cu) + 7.)) * uLevel;
          float strip = smoothstep(pw - 0.02, pw + 0.02, xu) * smoothstep(1. - pw + 0.02, 1. - pw - 0.02, xu);   // the Rockefeller signature: piers run unbroken to the top, dark spandrels between the windows
          vec3 span = uTone * (0.03 + flood * 0.35) * (0.35 + 0.65 * uLevel) + vec3(0.012, 0.012, 0.016);
          col = mix(stone, mix(span, mix(glass, lamp, on), win), strip);
          // far off, the facade becomes its own average, so the stripes never shimmer
          float fade = smoothstep(uBay * 40., uBay * 150., length(cameraPosition - vW));
          col = mix(col, stone * 0.55 + mix(glass, uWarm * 0.75 * uLevel, uLit) * 0.32, fade);
          if (uGround > 0. && yy > 0. && yy < uGround) {   // the ground floor: lit shop windows between granite piers
            float s = fract(u / 4.2), sh = smoothstep(0.07, 0.1, s) * smoothstep(0.93, 0.9, s) * smoothstep(0.35, 0.45, yy) * smoothstep(uGround - 1.0, uGround - 1.2, yy);
            col = mix(uTone * 0.2 * (0.4 + 0.6 * uLevel), uWarm * 1.1 * uLevel * (0.75 + 0.5 * h21(vec2(floor(u / 4.2), 3.))), sh);
          }
        }
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { m.uniforms.uLevel.value = v; } });
  return (FMAT[id] = m);
}
const FLAGTEX = [];
function flagTex(c, i) {
  const D8 = [
    (q, w, h) => { ['#0d3a8a', '#f4f0e6', '#c8102e'].forEach((k, j) => { q.fillStyle = k; q.fillRect(j * w / 3, 0, w / 3, h); }); },
    (q, w, h) => { ['#111111', '#d6a640', '#b0102a'].forEach((k, j) => { q.fillStyle = k; q.fillRect(0, j * h / 3, w, h / 3); }); },
    (q, w, h) => { q.fillStyle = '#2962ff'; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, h * 0.42); },
    (q, w, h) => { q.fillStyle = '#0d5a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4f0e6'; q.fillRect(0, h * 0.4, w, h * 0.2); q.fillRect(w * 0.3, 0, w * 0.12, h); },
    (q, w, h) => { for (let j = 0; j < 7; j++) { q.fillStyle = j % 2 ? '#f4f0e6' : '#c8102e'; q.fillRect(0, j * h / 7, w, h / 7 + 1); } q.fillStyle = '#0d1b4a'; q.fillRect(0, 0, w * 0.4, h * 0.57); },
    (q, w, h) => { q.fillStyle = '#f4f0e6'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.28, 0, PI * 2); q.fill(); },
    (q, w, h) => { ['#ff7a1a', '#f4f0e6', '#0d8a4a'].forEach((k, j) => { q.fillStyle = k; q.fillRect(j * w / 3, 0, w / 3, h); }); },
    (q, w, h) => { q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.3}px Georgia, serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('N3W', w / 2, h * 0.36); q.fillText('YORKERS', w / 2, h * 0.7); },
    (q, w, h) => { ['#5aa0e8', '#f4f0e6', '#5aa0e8'].forEach((k, j) => { q.fillStyle = k; q.fillRect(0, j * h / 3, w, h / 3); }); q.fillStyle = '#d6a640'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.12, 0, PI * 2); q.fill(); },
    (q, w, h) => { q.fillStyle = '#b0102a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4f0e6'; q.fillRect(w * 0.42, 0, w * 0.16, h); q.fillRect(0, h * 0.38, w, h * 0.24); },
  ];
  return FLAGTEX[i] ||= c.canvasTex(192, 128, D8[i % D8.length]);
}

function realPlaza(c, r, g, X, o) {
  const { THREE } = c, { PW, PL, PD, RIM } = RP, dz = o.dz, dy = o.dy || 0;
  const G = new THREE.Group(); g.add(G); r.plaza = G;
  c.tick((t, dt, P, ri) => { const on = ri === r.i; if (G.visible !== on) G.visible = on; if (on) RPU.t.value = t; });
  // the plaza frame to the room's: x across, z along, y up
  const RX = (px) => W / 2 + px, RZ = (pz) => pz + dz, RY = (py) => py + dy;
  // the room's own walkable band (and the neighbours' beside it): below 10.2 m nothing of the plaza may stand there
  const bz0 = -D / 2 - 0.6 - dz, bz1 = D / 2 + 0.6 - dz, inBand = (a, b) => Math.max(a, b) > bz0 && Math.min(a, b) < bz1;
  const BOX = {}, add = (key, px0, px1, pz0, pz1, py0, py1) => { if (px1 - px0 < 0.01 || Math.abs(pz1 - pz0) < 0.01 || py1 - py0 < 0.01) return;
    const gg = new THREE.BoxGeometry(px1 - px0, py1 - py0, Math.abs(pz1 - pz0)); gg.translate(RX((px0 + px1) / 2), RY((py0 + py1) / 2), RZ((pz0 + pz1) / 2)); (BOX[key] ||= []).push(gg); };
  // a mass that respects the band: inside it only the part above the room's 10 m facades
  const mass = (key, px0, px1, pzA, pzB, py0, py1) => { const a = Math.min(pzA, pzB), b = Math.max(pzA, pzB);
    if (!inBand(a, b)) { add(key, px0, px1, a, b, py0, py1); return; }
    if (a < bz0) add(key, px0, px1, a, bz0, py0, py1);
    if (b > bz1) add(key, px0, px1, bz1, b, py0, py1);
    const lo = Math.max(py0, 10.2 - dy); add(key, px0, px1, Math.max(a, bz0), Math.min(b, bz1), lo, py1); };
  const mats = {
    rock: plazaFacade(c, r, 'rock', { tone: [0.82, 0.77, 0.67], bay: 1.6, pier: 1.02, floor: 3.9, lit: 0.2, flood: 0.16, top: 259, topGlow: 0.85, base: dy, seed: 3 }),
    mid: plazaFacade(c, r, 'mid', { tone: [0.76, 0.72, 0.64], bay: 1.9, pier: 0.95, floor: 3.7, lit: 0.26, flood: 0.12, ground: 5.0, base: dy, seed: 5 }),
    chan: plazaFacade(c, r, 'chan', { tone: [0.84, 0.79, 0.68], bay: 2.5, pier: 1.2, floor: 4.0, lit: 0.34, flood: 0.11, ground: 5.4, base: dy, seed: 7 }),
    far: plazaFacade(c, r, 'far', { tone: [0.5, 0.52, 0.58], bay: 2.2, pier: 0.9, floor: 3.6, lit: 0.22, flood: 0.04, base: dy, seed: 9 }),
  };
  const gran = c.surf('acg_granite005a', 1.4, 0x7a7680), pave = c.surf('acg_pavingstones128', 2.6, 0x8a867e), asph = c.surf('acg_asphalt033', 4, 0x45454c);
  const bronze = std(c, 0xb08a40, { metalness: 1, roughness: 0.3 }), gold = std(c, 0xe0b048, { metalness: 1, roughness: 0.18, emissive: 0x3a2400, emissiveIntensity: 0.6 });
  const slabP = (mat, px0, px1, pz0, pz1, py0, py1) => { const m = c.slab(px1 - px0, py1 - py0, Math.abs(pz1 - pz0), mat, RX((px0 + px1) / 2), RY((py0 + py1) / 2), RZ((pz0 + pz1) / 2)); G.add(m); return m; };
  // and its paving, which must also keep out of the band
  const ground = (mat, px0, px1, pzA, pzB, py0, py1) => { const a = Math.min(pzA, pzB), b = Math.max(pzA, pzB);
    if (!inBand(a, b)) return slabP(mat, px0, px1, a, b, py0, py1); if (a < bz0) slabP(mat, px0, px1, a, bz0, py0, py1); if (b > bz1) slabP(mat, px0, px1, bz1, b, py0, py1); };

  // ---- the sunken plaza: walls, ice, the rink-level restaurant windows, the parapet, the flags ----
  const e = PW / 2, rim = e + RIM;
  const iceFrom = o.iceFrom ?? 0;
  if (iceFrom > -PL) { const T = c.canvasTex(512, 1024, (q, w, h) => { q.fillStyle = '#c4ccd6'; q.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { q.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.2})`; q.lineWidth = 0.6 + Math.random() * 1.4; q.beginPath(); const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, L = 30 + Math.random() * 160; q.moveTo(x, y); q.quadraticCurveTo(x + Math.cos(a + 1) * L * 0.5, y + Math.sin(a + 1) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); q.stroke(); } });
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL + iceFrom), new THREE.MeshStandardMaterial({ map: T, color: 0xdfe8f2, roughness: 0.14, metalness: 0.35, envMapIntensity: 1.6 }));
    ice.rotation.x = -PI / 2; ice.position.set(RX(0), RY(-PD + 0.01), RZ((iceFrom - PL) / 2)); G.add(ice);
    // the boards: white with a brass cap, round the ice
    const bd = std(c, 0xf0f0ee, { roughness: 0.45 });
    for (const s of [-1, 1]) ground(bd, s * (e - 0.6) - 0.06, s * (e - 0.6) + 0.06, Math.min(iceFrom, -0.4), -PL + 0.4, -PD, -PD + 1.05);
    slabP(bd, -e + 0.6, e - 0.6, -PL + 0.46, -PL + 0.34, -PD, -PD + 1.05); }
  for (const s of [-1, 1]) {   // north and south walls of the pit, granite, a storey deep, with the rink restaurants in them
    ground(gran, s > 0 ? e : -e - 0.6, s > 0 ? e + 0.6 : -e, 0, -PL, -PD, 0);
    ground(gran, s > 0 ? e : -e - 0.6, s > 0 ? e + 0.6 : -e, 0.3, -PL, 0, 0.92);   // the parapet you lean on
    ground(bronze, s > 0 ? e + 0.24 : -e - 0.36, s > 0 ? e + 0.36 : -e - 0.24, 0.3, -PL, 0.92, 1.0);
  }
  slabP(gran, -e - 0.6, e + 0.6, -PL, -PL - 0.8, -PD, 0);                                     // the west wall, under the tree
  slabP(gran, -e - 0.6, e + 0.6, -PL - 0.2, -PL - 0.8, 0, 0.92); slabP(bronze, -e, e, -PL - 0.44, -PL - 0.56, 0.92, 1.0);
  if (o.eastLip) { slabP(gran, -e - 0.6, e + 0.6, 0.6, 0, -PD, 0); slabP(gran, -e - 0.6, e + 0.6, 0.6, 0.2, 0, 0.92); }
  { const B = Builder(c);   // the restaurants at rink level, ray traced rooms behind the glass (arch.part.js)
    for (const s of [-1, 1]) { const x = RX(s * e), F = { O: new THREE.Vector3(x, 0, RZ(0)), T: new THREE.Vector3(0, 0, -1), N: new THREE.Vector3(-s, 0, 0) };
      for (let u = 2.4; u < PL - 1.5; u += 3.9) { if (inBand(-u - 1.6, -u + 1.6)) continue; B.window(F, u, RY(-PD + 1.75), 0.02, 3.1, 2.5, [3, 5, 2, 4][Math.round(u) % 4], 0.85, 0, 3.2); } }
    if (o.rinkWalls) for (const x of [0.13, W - 0.38]) { const s = x < 1 ? -1 : 1, F = { O: new THREE.Vector3(x, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-s, 0, 0) };
      for (const [u, w] of [[2.0, 3.0], [5.6, 3.0], [8.6, 2.6], [14.6, 1.8]]) B.window(F, u, 1.75, 0.02, w, 2.4, [5, 3, 4, 2][Math.round(u) % 4], 0.85, 0, 3.2); }
    B.finish(G); }
  // the flags: a ring of poles round the rim, each flag waving on its own phase (one draw per design)
  { const poles = [], fl = {}, plane = new THREE.PlaneGeometry(1.5, 0.98, 10, 4).translate(0.75, 0, 0);
    const aU = new Float32Array(plane.attributes.position.count); for (let i = 0; i < aU.length; i++) aU[i] = plane.attributes.position.getX(i) / 1.5; plane.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    let k = 0; const pole = (px, pz, ry) => { poles.push([px, pz]); const q = plane.clone(); q.rotateY(ry); q.translate(RX(px), RY(6.4), RZ(pz)); (fl[k % 10] ||= []).push(q); k++; };
    for (const s of [-1, 1]) for (let pz = -1.2; pz > -PL; pz -= 2.3) pole(s * (e + 1.1), pz, s > 0 ? -0.6 : PI + 0.6);
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, 7.1, 6), std(c, 0xd8d8dc, { metalness: 0.8, roughness: 0.3 }), poles.length);
    const fin = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), gold, poles.length), m4 = new THREE.Matrix4();
    poles.forEach(([px, pz], i) => { m4.makeTranslation(RX(px), RY(3.55), RZ(pz)); pm.setMatrixAt(i, m4); m4.makeTranslation(RX(px), RY(7.15), RZ(pz)); fin.setMatrixAt(i, m4); }); G.add(pm, fin);
    for (const j in fl) { const fm = new THREE.MeshStandardMaterial({ map: flagTex(c, +j), side: THREE.DoubleSide, roughness: 0.85, emissive: 0xffffff, emissiveMap: flagTex(c, +j), emissiveIntensity: 0.08 });
      fm.onBeforeCompile = (s) => { s.uniforms.uT = RPU.t; s.vertexShader = 'uniform float uT; attribute float aU;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * sin(aU * 7.0 - uT * 3.1 + position.x * 0.41 + position.z * 0.29) * 0.12 * aU; transformed.y -= aU * aU * 0.12;'); };
      const mm = new THREE.Mesh(mergeGeometries(fl[j]), fm); G.add(mm); } }

  // ---- the street level round the pit: promenade, the terrace under the tree, the private street, the sidewalk ----
  for (const s of [-1, 1]) ground(pave, s > 0 ? e + 0.6 : -rim, s > 0 ? rim : -e - 0.6, 0.6, -PL - 0.8, -PD, 0);
  slabP(pave, -rim - 12, rim + 12, -PL - 0.8, RP.ST[0], -PD, 0);
  slabP(asph, -rim - 60, rim + 60, RP.ST[0], RP.ST[1], -0.6, -0.12);
  for (const z of RP.ST) slabP(gran, -rim - 60, rim + 60, z + 0.15, z - 0.15, -0.6, 0.02);
  slabP(pave, -rim - 60, rim + 60, RP.ST[1], RP.ROCK - 0.2, -0.6, 0);
  if (o.terrace) ground(pave, -rim, rim, o.terrace[0], o.terrace[1], -PD, 0);   // the lip where the gardens meet the pit

  // ---- the buildings ----
  // the Channel Gardens pair: six storeys and a roof garden storey set back, either side of the gardens, 200 ft long
  for (const s of [-1, 1]) { const a = s > 0 ? 9.9 : -32, b = s > 0 ? 32 : -9.9; mass('chan', a, b, 2, 62, 0, 26.5); mass('chan', s > 0 ? 12.5 : -29.5, s > 0 ? 29.5 : -12.5, 4.5, 59.5, 26.5, 31.5); }
  // round the sunken plaza: the low wings at the rim, the taller blocks behind them
  for (const s of [-1, 1]) { mass('mid', s > 0 ? rim : -38, s > 0 ? 38 : -rim, 2, -49, 0, 22); mass('mid', s > 0 ? 30 : -78, s > 0 ? 78 : -30, -6, -52, 0, 64); }
  // 30 Rockefeller Plaza: the podium, then the slab, its narrow east face toward the gardens, stepping in as it climbs
  const RK = RP.ROCK; mass('rock', -46, 46, RK, RK - 40, 0, 24);
  [[29, 72], [25, 118], [21.5, 168], [18.5, 214], [15.5, 259]].forEach(([hw, h], i) => mass('rock', -hw, hw, RK - 2 - i * 0.6, RK - 104 + i * 6, 0, h));
  // the city behind and either side
  { let s = 41; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) { const a = -PI * 0.92 + rnd() * PI * 0.84, d = 170 + rnd() * 260, px = Math.sin(a) * d * 1.3, pz = -60 - Math.cos(a) * d * 0.25 - d * 0.55, w = 18 + rnd() * 34, h = 50 + rnd() * rnd() * 230;
      if (Math.abs(px) < 60 && pz > -200) continue; mass('far', px - w / 2, px + w / 2, pz + w / 2, pz - w / 2, 0, h); } }
  for (const k in BOX) { const m = new THREE.Mesh(mergeGeometries(BOX[k]), mats[k]); m.frustumCulled = false; G.add(m); }
  // 30 Rock's front door: three tall lit doorways, a limestone frame, and over it a gilded relief (an eye flower, here)
  { const fz = RZ(RK) + 0.06, dm = new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }); dm.userData.e0 = 0;
    for (const px of [-3.1, 0, 3.1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 6.2), dm); d.position.set(RX(px), RY(3.1), fz); G.add(d); }
    G.add(c.slab(10.4, 0.6, 0.5, std(c, 0xcfc6b4, { roughness: 0.7 }), RX(0), RY(6.6), fz + 0.2));
    const rel = c.canvasTex(512, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7a5a1a'); gr.addColorStop(1, '#3a2a0a'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.strokeStyle = '#f0c860'; q.lineWidth = 5;
      for (let i = 0; i < 9; i++) { q.beginPath(); q.moveTo(w / 2, h * 0.55); q.lineTo(w / 2 + Math.cos(-PI * i / 8) * w * 0.48, h * 0.55 + Math.sin(-PI * i / 8) * h * 0.5); q.stroke(); } eyeFlower(q, w / 2, h * 0.55, h * 0.3, '#f6dc8a', '#c8902a'); });
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: rel, metalness: 0.7, roughness: 0.35, emissive: 0xffc860, emissiveMap: rel, emissiveIntensity: 0.35 })); rm.position.set(RX(0), RY(10.2), fz); G.add(rm);
    // the crown: the observation decks' glass, lit, and the aviation light
    const deck = new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false, transparent: true, opacity: 0.8 });
    for (const y of [246, 252.5, 258.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(31.4, 0.35, 0.2), deck); b.position.set(RX(0), RY(y), RZ(RK - 2 - 4 * 0.6) + 0.2); G.add(b); }
    const av = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,40,30,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); av.scale.setScalar(5); av.position.set(RX(0), RY(266), RZ(RK - 40)); G.add(av);
    G.add(c.slab(0.5, 7, 0.5, std(c, 0x333338), RX(0), RY(262.5), RZ(RK - 40)));
    c.tick((t) => { av.material.opacity = Math.sin(t * 2.6) > 0.2 ? 1 : 0.08; }); }

  // ---- Prometheus over his pool, in the zodiac ring, floodlit gold ----
  { const pz = -PL + 0.9;
    slabP(gran, -7.5, 7.5, -PL + 3.4, -PL, -PD, -PD + 0.55); slabP(std(c, 0x0a1622, { roughness: 0.05, metalness: 0.7 }), -7.2, 7.2, -PL + 3.1, -PL + 0.2, -PD + 0.5, -PD + 0.52);
    slabP(gran, -2.4, 2.4, -PL + 2.0, -PL, -PD, -PD + 1.7);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.15, 10, 72), gold); ring.position.set(RX(0), RY(-PD + 4.7), RZ(-PL + 0.5)); G.add(ring);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, d = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18), gold); d.position.set(RX(Math.cos(a) * 3.7), RY(-PD + 4.7 + Math.sin(a) * 3.7), RZ(-PL + 0.68)); G.add(d); }
    const prom = c.glb('nyb_rink_prometheus', { h: 5.4, x: RX(0), y: RY(-PD + 1.7), z: RZ(pz), parent: G, shadow: false, onload: (gg) => gg.traverse((q) => { if (q.isMesh && q.material) { q.material = q.material.clone(); q.material.emissive = new THREE.Color(0xffb040); q.material.emissiveIntensity = 0.22; } }) });
    c.clickable(prom, () => c.egg('prometheus', 'Prometheus, gilded bronze, about eighteen feet, by Paul Manship, 1934, in his ring of the zodiac over the rink. He brought fire to humanity. The ice department has concerns.'), 'Prometheus');
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,190,90,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55 })); glow.scale.set(11, 9, 1); glow.position.set(RX(0), RY(-PD + 4.4), RZ(-PL + 1.6)); G.add(glow); }

  // ---- the tree on the upper plaza, guyed, with its own lights following the one you lit ----
  r.treeZ = RZ(RP.TZ); r.treeY = RY(0);
  if (o.tree) { const T = buildTree(c, G, { H: RP.TH, R: RP.TR, x: RX(0), y: RY(0), z: r.treeZ, lights: o.lights || 18000, size: 0.26 });
    T.group.traverse((q) => { const u = q.material && q.material.uniforms; if (u && u.uGain && q.isPoints && q.geometry.attributes.position.count > 5000) u.uGain.value *= 0.8; });
    let v = LT.tree ? 1.04 : 0; T.set(v); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const want = LT.tree ? 1.04 : 0; if (Math.abs(want - v) > 0.001) { v += Math.sign(want - v) * Math.min(Math.abs(want - v), dt * 0.35); T.set(v); } }); r.plazaTree = T; }
  { const wire = []; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; wire.push(RX(Math.cos(a) * 1.2), RY(RP.TH * 0.62), r.treeZ + Math.sin(a) * 1.2, RX(Math.cos(a) * 11), RY(0), r.treeZ + Math.sin(a) * 11 * 0.55); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); G.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.6 }))); }

  // ---- the Channel Gardens beyond the room: beds down the middle, a pool in each, lit evergreens ----
  if (o.gardens) { const [g0, g1] = o.gardens, soil = std(c, 0x1e1812, { roughness: 1 }), water = std(c, 0x0a1830, { roughness: 0.04, metalness: 0.6 }), tw = [], sh = [];
    for (let pz = g0; pz < g1 - 6; pz += 8.6) { if (inBand(pz, pz + 7.2)) continue;
      slabP(gran, -3, 3, pz, pz + 7.2, 0, 0.72); slabP(soil, -2.85, 2.85, pz + 0.15, pz + 7.05, 0.72, 0.76); slabP(water, -0.8, 0.8, pz + 1, pz + 6.2, 0.74, 0.78);
      for (let i = 0; i < 14; i++) { const px = (i % 2 ? 1 : -1) * (1.3 + Math.random() * 1.3), z = pz + 0.6 + Math.random() * 6; sh.push([px, z, 0.7 + Math.random() * 0.8]); for (let k = 0; k < 6; k++) tw.push([RX(px + (Math.random() - 0.5) * 0.6), RY(0.9 + Math.random() * 1.0), RZ(z + (Math.random() - 0.5) * 0.6), Math.random(), WARM[(Math.random() * 4) | 0]]); } }
    if (sh.length) { const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.34, 1, 8), std(c, 0x163a22, { roughness: 0.9 }), sh.length), m4 = new THREE.Matrix4(); sh.forEach(([px, z, h], i) => { m4.makeScale(1, h, 1).setPosition(RX(px), RY(0.76 + h / 2), RZ(z)); im.setMatrixAt(i, m4); }); G.add(im);
      ledPoints(c, G, tw, { size: 0.08, gain: 1.8 }).material.uniforms.uOn.value = 1.1; } }

  // ---- people: skaters on the far ice, New Yorkers along the rails ----
  const sk = [];
  for (let i = 0; i < (o.skaters || 0); i++) { const s = new THREE.Group(); G.add(s); const m = c.glb(i % 3 === 2 ? 'lt_wobbler' : 'lt_skater', { h: 1.75, parent: s }); sk.push({ s, m, ph: i / (o.skaters) * PI * 2, w: 0.16 + (i % 3) * 0.035, ax: e - 2.6 - (i % 2) * 1.4, az: (o.ska ?? PL / 2 - 4) - (i % 3) * 1.2 }); }
  const rail = [];
  for (let i = 0; i < (o.railers || 0); i++) { const side = i % 2 ? 1 : -1, pz = -3 - (i * 7.3) % (PL - 6); if (inBand(pz - 1, pz + 1)) continue;
    const ex = extra(c, G, RX(side * (e + 0.75)), RZ(pz), { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a][i % 4], ry: side > 0 ? -PI / 2 : PI / 2, pool: 'night' }); ex.position.y = RY(0); rail.push(ex); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sk.forEach((q) => { if (!q.go && q.m.userData.play) { q.m.userData.play('walk', 1.1); q.go = 1; } const a = t * q.w + q.ph;
    q.s.position.set(RX(Math.cos(a) * q.ax), RY(-PD), RZ((o.skc ?? -PL / 2) + Math.sin(a) * q.az)); q.s.rotation.y = Math.atan2(-Math.sin(a) * q.ax, Math.cos(a) * q.az); }); });
  return G;
}
