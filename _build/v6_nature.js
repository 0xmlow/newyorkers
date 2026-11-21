/* ================================================================
   v6 NATURE  ·  2026-11-21
   MLow: "next level". The island stopped looking like a blockout the moment its ground, its plants and its shore
   were real: Poly Haven CC0 scans for every surface people walk on and every plant they walk past (free, no
   generation), scattered by rules the island already knows (its pads, walls and posts), swaying in one wind,
   culled by cell so a phone can carry it. The palms are rebuilt with curved ringed trunks and real fronds.
   Butterflies work the flower beds; cloud shadows cross the lawn when the weather says so.
   ================================================================ */
const NAT = { meshes: [], wind: { value: 0 }, windT: { value: 0 }, cloud: { value: 0.25 }, ready: false, cellsBuilt: 0, flow: [] };
const natRnd = (function () { let s = 1110529; return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();

/* ---- 1. scanned surfaces ---- */
function phSet(mat, name, rep, o) {
  o = o || {};
  mat.map = tex(`assets/ph/${name}_c.webp`, rep); mat.normalMap = tex(`assets/ph/${name}_n.webp`, rep, false); mat.roughnessMap = tex(`assets/ph/${name}_r.webp`, rep, false);
  mat.roughness = o.rough !== undefined ? o.rough : 1; mat.normalScale = new THREE.Vector2(o.ns || 1, o.ns || 1);
  if (o.color !== undefined) mat.color.set(o.color);
  mat.needsUpdate = true; return mat;
}
// big surfaces repeat; break the repeat with a second rotated read and a slow brightness field, and lay cloud shadow on top
const NAT_GROUND_GLSL = {
  vpars: 'varying vec3 vNW;', vmain: 'vNW = (modelMatrix * vec4(transformed, 1.0)).xyz;',
  fpars: `varying vec3 vNW; uniform float uCloud, uWT;
    float nh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(nh(i), nh(i + vec2(1.0, 0.0)), f.x), mix(nh(i + vec2(0.0, 1.0)), nh(i + vec2(1.0, 1.0)), f.x), f.y); }
    float cloudMask(vec2 p) { p = p * 0.012 + vec2(uWT * 0.006, uWT * 0.0035); return smoothstep(0.52, 0.72, vn(p) * 0.6 + vn(p * 2.3 + 7.0) * 0.3 + vn(p * 5.1) * 0.1); }`,
  map: `#ifdef USE_MAP
      vec4 texelColor = texture2D(map, vUv);
      vec4 texB = texture2D(map, vec2(-vUv.y, vUv.x) * 0.61 + vec2(0.37, 0.11));
      float mac = vn(vNW.xz * 0.045) * 0.6 + vn(vNW.xz * 0.13) * 0.4;
      texelColor.rgb = mix(texelColor.rgb, texB.rgb, 0.4) * (0.8 + 0.42 * mac);
      float tl = dot(texelColor.rgb, vec3(0.3, 0.59, 0.11));
      #ifdef NAT_LUSH
        texelColor.rgb = mix(texelColor.rgb, vec3(0.25, 0.42, 0.13) * (0.5 + 1.3 * tl) + vec3(0.07, 0.05, 0.0) * mac, 0.5);
      #endif
      #ifdef NAT_PALE
        texelColor.rgb = mix(texelColor.rgb, vec3(0.93, 0.85, 0.70) * (0.62 + 0.75 * tl), 0.55);
      #endif
      texelColor = mapTexelToLinear(texelColor);
      diffuseColor *= texelColor;
    #endif
    diffuseColor.rgb *= 1.0 - uCloud * 0.32 * cloudMask(vNW.xz);`
};
function groundPatch(sh, def) {
  if (def) sh.fragmentShader = '#define ' + def + '\n' + sh.fragmentShader;
  sh.uniforms.uCloud = NAT.cloud; sh.uniforms.uWT = NAT.windT;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + NAT_GROUND_GLSL.vpars).replace('#include <project_vertex>', '#include <project_vertex>\n' + NAT_GROUND_GLSL.vmain);
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + NAT_GROUND_GLSL.fpars).replace('#include <map_fragment>', NAT_GROUND_GLSL.map);
}
phSet(MAT.sand, 'coast_sand_01', 3.4, { ns: 1.1 }); MAT.sand.color.setRGB(1.12, 1.08, 1.02);
phSet(MAT.grass, 'leafy_grass', 2.6, { ns: 1.2 });
phSet(MAT.wood, 'weathered_planks', 0.7, { color: 0xe9ddca, ns: 1.2 });
phSet(MAT.conc, 'concrete_floor_02', 1.4, { color: 0xeeeeee });
phSet(MAT.white, 'white_stucco', 1, { ns: 1.4 }); phSet(MAT.bone, 'white_stucco', 1, { color: 0xF0EFEA, ns: 1.4 });
phSet(MAT.pave, 'hexagonal_concrete_paving', 1, { color: 0xf2efe8 });
(function () {
  const sandPrev = MAT.sand.onBeforeCompile;
  MAT.sand.onBeforeCompile = sh => { sandPrev(sh); groundPatch(sh, 'NAT_PALE'); }; MAT.sand.customProgramCacheKey = () => 'mi-sand-v6';
  MAT.grass.onBeforeCompile = sh => groundPatch(sh, 'NAT_LUSH'); MAT.grass.customProgramCacheKey = () => 'mi-grass-v6';
  // the paving ring and the paths had no texture space: give every paved surface world UVs, 3 m to a tile
  scene.updateMatrixWorld(true); const v = new V3();
  scene.traverse(o => { if (!o.isMesh || o.material !== MAT.pave || !o.geometry.attributes.uv) return;
    const g = o.geometry, p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); uv.setXY(i, v.x / 3, v.z / 3); } uv.needsUpdate = true; });
})();

/* ---- 2. where things may grow: not on a pad, not in a wall, not in a post, not on the paths ---- */
function natBlocked(x, z, r) {
  for (const c of CIRCS) if (c.on && Math.hypot(x - c.x, z - c.z) < c.r + r) return true;
  for (const s of SEGS) { if (!s.on) continue; const dx = s.x2 - s.x1, dz = s.z2 - s.z1, L2 = dx * dx + dz * dz || 1, t = clamp(((x - s.x1) * dx + (z - s.z1) * dz) / L2, 0, 1); if (Math.hypot(x - s.x1 - t * dx, z - s.z1 - t * dz) < r + 0.3) return true; }
  const f = floorAt(x, z, 3), g = ground(x, z); return !!(f.block || (f.f !== null && f.f > g + 0.05));
}
function natLawn(x, z) { const r = Math.hypot(x, z); if (r > 101) return false; if (Math.abs(x) < 17.5 && Math.abs(z) < 17.5) return false; if (r > 36 && r < 44) return false; if (Math.abs(x) < 3.2 && Math.abs(z) > 16) return false; if (Math.abs(z) < 3.2 && Math.abs(x) > 16) return false; return true; }
function natPier(x, z) { return (Math.abs(x) < 7 && z > 104) || (x > 0 && x < 30 && z > 118) || (z < -100 && Math.abs(x) < 20); }

/* ---- 3. the plants and rocks: load, wind, place, instance by cell ---- */
const NAT_ASSETS = {
  gazania: { file: 'flower_gazania', th: 0.42, wind: 1.4, range: 75, shadow: false },
  periwinkle: { file: 'periwinkle_plant', th: 0.6, wind: 1.2, range: 75, shadow: false },
  ursinia: { file: 'flower_ursinia', th: 0.5, wind: 1.5, range: 75, shadow: false },
  dandelion: { file: 'dandelion_01', th: 0.45, wind: 1.3, range: 75, shadow: false },
  fern: { file: 'fern_02', th: 0.9, wind: 0.35, range: 90, shadow: true },
  shrub: { file: 'shrub_04', th: 1.1, wind: 0.6, range: 90, shadow: true },
  tuft: { file: 'grass_bermuda_01', th: 0.32, wind: 1.2, range: 55, shadow: false },
  dune: { file: 'grass_medium_02', th: 0.95, wind: 0.9, range: 110, shadow: false },
  iceplant: { file: 'crystalline_iceplant', th: 0.16, wind: 0.1, range: 70, shadow: false },
  tree1: { file: 'island_tree_01', wind: 0.012, range: 600, shadow: true },
  tree2: { file: 'island_tree_02', wind: 0.012, range: 600, shadow: true },
  boulder: { file: 'boulder_01', wind: 0, range: 320, shadow: true },
  beachrocks: { file: 'sand_rocks_small_01', wind: 0, range: 300, shadow: true },
  coastrocks: { file: 'coast_land_rocks_02', wind: 0, range: 700, shadow: true },
  shell: { file: 'lambis_shell', wind: 0, range: 40, shadow: false }
};
const NAT_LIGHT = isMobile ? 0.4 : 1;
function natWindPatch(mat, amp) {
  if (!amp) return mat;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = NAT.wind; sh.uniforms.uWT = NAT.windT; sh.uniforms.uAmp = { value: amp };
    sh.vertexShader = 'uniform float uWind, uWT, uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz;
      #else
        vec3 ip = vec3(0.0);
      #endif
      float hh = max(position.y, 0.0);
      float ws = sin(uWT * 1.9 + ip.x * 0.23 + ip.z * 0.19) * 0.7 + sin(uWT * 3.7 + ip.x * 0.71 - ip.z * 0.53) * 0.3;
      float gust = 0.55 + 0.45 * sin(uWT * 0.31 + ip.x * 0.02);
      transformed.x += ws * uAmp * uWind * gust * hh * hh;
      transformed.z += ws * 0.55 * uAmp * uWind * gust * hh * hh;`);
  };
  mat.customProgramCacheKey = () => 'mi-wind-' + amp;
  return mat;
}
function natLoadAll() {
  const L2 = new THREE.GLTFLoader(), ids = Object.keys(NAT_ASSETS);
  return Promise.all(ids.map(id => new Promise(res => {
    const a = NAT_ASSETS[id];
    L2.load(`assets/ph/ph_${a.file}.glb`, gl => {
      const vars = [], mats = new Map();
      const tops = gl.scene.children; // one node per plant; a single node (a tree, a rock) is one whole variant even when it holds several parts
      tops.forEach(top => {
        const parts = []; top.updateMatrixWorld(true);
        top.traverse(o => { if (!o.isMesh) return; let m = mats.get(o.material);
          if (!m) { m = o.material.clone(); m.envMapIntensity = 0.35; if (m.map) m.map.anisotropy = ANISO; if (m.alphaTest > 0 || m.transparent || (m.map && m.map.format === THREE.RGBAFormat)) { m.transparent = false; m.alphaTest = Math.max(m.alphaTest, 0.42); m.side = THREE.DoubleSide; } natWindPatch(m, a.wind); mats.set(o.material, m); }
          const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().makeTranslation(-top.position.x, -top.position.y, -top.position.z).multiply(o.matrixWorld)); g.computeBoundingBox(); parts.push({ g, m }); });
        if (parts.length) { const bb = new THREE.Box3(); parts.forEach(p => bb.union(p.g.boundingBox)); vars.push({ parts, h: bb.max.y - bb.min.y, w: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) }); }
      });
      a.vars = vars; res();
    }, undefined, () => { a.vars = []; res(); });
  })));
}
const NAT_PLACE = [];
function natAdd(id, x, z, s, y, ry, vi) { const a = NAT_ASSETS[id]; if (!a.vars || !a.vars.length) return; const v = vi !== undefined ? vi % a.vars.length : Math.floor(natRnd() * a.vars.length);
  if (a.th) s = a.th / Math.max(0.02, a.vars[v].h) * (0.75 + natRnd() * 0.5); // plants are sized by a target height, not by their scan
  NAT_PLACE.push({ id, v, x, z, y: y !== undefined ? y : ground(x, z), s, ry: ry !== undefined ? ry : natRnd() * PI * 2 }); }
function natScatter() {
  const R = natRnd, tryXZ = (fn, n) => { for (let i = 0; i < n; i++) { const p = fn(); if (p) return p; } return null; };
  const lawnPt = (rad) => tryXZ(() => { const a = R() * PI * 2, r = Math.sqrt(R()) * 100, x = Math.cos(a) * r, z = Math.sin(a) * r; return natLawn(x, z) && !natBlocked(x, z, rad) ? [x, z] : null; }, 40);
  // flower meadows: drifts of one or two species, the way they seed themselves
  const FL = ['gazania', 'periwinkle', 'ursinia', 'dandelion'];
  for (let c = 0; c < Math.round(120 * NAT_LIGHT); c++) {
    const p = lawnPt(1.5); if (!p) continue; const sp = FL[c % 4], sp2 = FL[(c + 1 + (c >> 2)) % 4], n = 26 + Math.floor(R() * 26), rad = 2.2 + R() * 3.2;
    NAT.flow.push(p);
    for (let i = 0; i < n; i++) { const a = R() * PI * 2, r = Math.sqrt(R()) * rad, x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r; if (!natLawn(x, z) || natBlocked(x, z, 0.15)) continue; natAdd(R() < 0.75 ? sp : sp2, x, z, 2.4 + R() * 1.6); }
  }
  // grass tufts everywhere on the lawn, ferns and shrubs where the lawn meets things
  for (let i = 0; i < Math.round(1500 * NAT_LIGHT); i++) { const p = lawnPt(0.2); if (p) natAdd('tuft', p[0], p[1], 0.9 + R() * 0.9); }
  for (let i = 0; i < Math.round(260 * NAT_LIGHT); i++) { const p = lawnPt(0.6); if (!p) continue; const k = R(); natAdd(k < 0.45 ? 'fern' : k < 0.75 ? 'shrub' : 'periwinkle', p[0], p[1], k < 0.45 ? 1.0 + R() * 0.6 : k < 0.75 ? 2.6 + R() * 1.8 : 3 + R() * 1.5); }
  // real shrubs where the old green icosahedra stood
  SHRUB_SPOTS.forEach(([x, z], i) => { const k = R(); natAdd(k < 0.6 ? 'shrub' : 'fern', x, z, k < 0.6 ? 3 + R() * 2 : 1.2 + R() * 0.5); });
  // trees in the open lawn, never in a doorway
  let tr = 0; for (let i = 0; i < 400 && tr < 26; i++) { const a = R() * PI * 2, r = 52 + R() * 46, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!natLawn(x, z) || natBlocked(x, z, 3.2)) continue;
    const id = R() < 0.5 ? 'tree1' : 'tree2'; natAdd(id, x, z, 1.3 + R() * 0.55); post(x, z, 0.45); tr++; }
  // the beach: dune grass in the soft sand, ice plant at the lawn's edge, shells at the tide line
  for (let i = 0; i < Math.round(520 * NAT_LIGHT); i++) { const a = R() * PI * 2, r = 103 + R() * 24, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z) || natBlocked(x, z, 0.3)) continue; natAdd('dune', x, z, 1.2 + R() * 1.4); }
  for (let i = 0; i < Math.round(220 * NAT_LIGHT); i++) { const a = R() * PI * 2, r = 99 + R() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z) || natBlocked(x, z, 0.3)) continue; natAdd('iceplant', x, z, 1.4 + R() * 1.4); }
  for (let i = 0; i < 70; i++) { const a = R() * PI * 2, r = 127 + R() * 8, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z)) continue; natAdd('shell', x, z, 0.8 + R() * 1.6, ground(x, z) - 0.01); }
  // the shore: rocks that break the island's perfect circle, half in the sea
  for (let i = 0; i < 40; i++) { const a = R() * PI * 2, r = 130 + R() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z)) continue; const s = 0.7 + Math.pow(R(), 2) * 2.6; natAdd('boulder', x, z, s, ground(x, z) - s * 0.35); if (r < 137) post(x, z, s * 0.55); }
  for (let i = 0; i < 44; i++) { const a = R() * PI * 2, r = 124 + R() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z)) continue; natAdd('beachrocks', x, z, 0.8 + R() * 0.8, ground(x, z) - 0.08); }
  for (let i = 0; i < 22; i++) { const a = (i + R() * 0.6) / 22 * PI * 2, r = 139 + R() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r; if (natPier(x, z)) continue; const s = 1.4 + R() * 1.4; natAdd('coastrocks', x, z, s, ground(x, z) - s * 0.25); }
}
function natBuild() {
  const CELL = 44, groups = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  NAT_PLACE.forEach(p => { const key = p.id + '|' + p.v + '|' + Math.floor(p.x / CELL) + '|' + Math.floor(p.z / CELL); (groups.get(key) || groups.set(key, []).get(key)).push(p); });
  groups.forEach((list, key) => {
    const [id, vi] = key.split('|'), a = NAT_ASSETS[id], va = a.vars[+vi]; let cx = 0, cz = 0; list.forEach(p => { cx += p.x; cz += p.z; }); cx /= list.length; cz /= list.length;
    let rad = 0; list.forEach(p => rad = Math.max(rad, Math.hypot(p.x - cx, p.z - cz) + va.w * p.s)); rad += va.h;
    va.parts.forEach(pt => {
      const im = new THREE.InstancedMesh(pt.g, pt.m, list.length);
      list.forEach((p, i) => { q.setFromEuler(e.set((natRnd() - 0.5) * 0.08, p.ry, (natRnd() - 0.5) * 0.08)); m4.compose(new V3(p.x, p.y, p.z), q, new V3(p.s, p.s * (0.9 + natRnd() * 0.2), p.s)); im.setMatrixAt(i, m4); });
      im.castShadow = a.shadow && !isMobile; im.receiveShadow = true; im.frustumCulled = false; im.userData.nat = { c: new V3(cx, list[0].y + va.h * 0.5, cz), r: rad, range: a.range };
      scene.add(im); NAT.meshes.push(im);
    });
  });
  NAT.ready = true;
}
const _natFr = new THREE.Frustum(), _natM = new THREE.Matrix4(), _natS = new THREE.Sphere();
function natFrame(dt) {
  NAT.windT.value = T; NAT.wind.value = 1 + 1.6 * ((typeof WX !== 'undefined' && WX.wet) || 0);
  const wx = (typeof WX !== 'undefined' && WX.cur) || 'CLEAR'; const want = wx === 'SCATTERED' ? 0.95 : wx === 'CLEAR' ? 0.3 : 0.15; NAT.cloud.value += (want * clamp(L.sunI / 1.2, 0, 1) - NAT.cloud.value) * Math.min(1, dt);
  if (!NAT.ready) return;
  camera.updateMatrixWorld(); _natM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _natFr.setFromProjectionMatrix(_natM);
  const cp = camera.position;
  for (const im of NAT.meshes) { const u = im.userData.nat; _natS.center.copy(u.c); _natS.radius = u.r; im.visible = cp.distanceTo(u.c) - u.r < u.range && _natFr.intersectsSphere(_natS); }
  BFLY.step(dt);
}

/* ---- 4. palms, rebuilt: a ringed trunk that curves, nine pinnate fronds that droop and move ---- */
const PALM = (function () {
  const out = { trunk: null, fronds: null, nuts: null, shader: null };
  // the frond texture: a rachis and some ninety leaflets, painted once on a canvas
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 1024; const c = cv.getContext('2d');
  if (c && c.beginPath && c.createLinearGradient) {
    for (let i = 0; i < 150; i++) {
      const t = i / 150, y = 1010 - t * 990, len = 124 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) + 10, side = i % 2 ? 1 : -1, ang = 1.05 - t * 0.4;
      const gx = c.createLinearGradient(128, y, 128 + side * len, y); gx.addColorStop(0, `rgb(${52 + t * 30},${92 + t * 40},${34 + t * 10})`); gx.addColorStop(1, `rgb(${92 + t * 40},${132 + t * 30},${48})`);
      c.fillStyle = gx; c.beginPath(); c.moveTo(128, y); const ex = 128 + side * len * Math.sin(ang), ey = y - len * Math.cos(ang);
      c.quadraticCurveTo(128 + side * len * 0.55, y - 22, ex, ey); c.quadraticCurveTo(128 + side * len * 0.4, y + 6, 128, y + 14); c.fill();
    }
    c.strokeStyle = '#5c5a2e'; c.lineWidth = 7; c.beginPath(); c.moveTo(128, 1024); c.lineTo(128, 10); c.stroke();
  }
  const ft = new THREE.CanvasTexture(cv); ft.encoding = THREE.sRGBEncoding; ft.anisotropy = ANISO;
  const fm = new THREE.MeshStandardMaterial({ map: ft, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75, color: 0xdfe8c8 });
  fm.onBeforeCompile = sh => { sh.uniforms.uWind = NAT.wind; sh.uniforms.uWT = NAT.windT;
    sh.vertexShader = 'uniform float uWind, uWT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 ip = instanceMatrix[3].xyz; float tt = uv.y * uv.y;
      transformed.y += (sin(uWT * 2.3 + ip.x * 0.4 + ip.y * 3.0) * 0.06 + sin(uWT * 5.1 + ip.z) * 0.02) * tt * uWind * 2.0;
      transformed.x += sin(uWT * 1.7 + ip.z * 0.3) * 0.05 * tt * uWind;`); };
  fm.customProgramCacheKey = () => 'mi-frond-v6';
  // a frond: 1 m long strip, bent down along its length, folded into a shallow V across it
  const fg = new THREE.PlaneGeometry(1, 1, 2, 14); fg.translate(0, 0.5, 0); const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setXYZ(i, x * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, y + 0.1))), -0.42 * y * y + Math.abs(x) * 0.22, y); }
  fg.rotateX(0); fg.computeVertexNormals();
  // a trunk: tapered, ringed, slightly curved, 1 m tall (scaled per palm)
  const tg = new THREE.CylinderGeometry(0.16, 0.27, 1, 10, 24, false); tg.translate(0, 0.5, 0); const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), ring = 1 + 0.07 * Math.max(0, Math.sin(y * 24 * PI)) + (y < 0.06 ? 0.4 * (0.06 - y) / 0.06 : 0); tp.setXYZ(i, x * ring + 0.12 * y * y, y, z * ring); }
  tg.computeVertexNormals();
  const bark = new THREE.MeshStandardMaterial({ map: tex('assets/ph/palm_bark_c.webp', 1), normalMap: tex('assets/ph/palm_bark_n.webp', 1, false), roughnessMap: tex('assets/ph/palm_bark_r.webp', 1, false), roughness: 1, color: 0xd8cfc0 });
  [bark.map, bark.normalMap, bark.roughnessMap].forEach(t => t.repeat.set(1.5, 6));
  out.build = function (list) {
    const N = list.length, trunk = new THREE.InstancedMesh(tg, bark, N), fronds = new THREE.InstancedMesh(fg, fm, N * 11), nuts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a4126, roughness: 0.7 }), N * 4);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), R = natRnd; let f = 0, k = 0;
    list.forEach((p, i) => {
      const yaw = R() * PI * 2; q.setFromEuler(e.set(p.lean, yaw, p.lean * 0.6, 'YXZ')); m.compose(new V3(p.x, p.g, p.z), q, new V3(1, p.h, 1)); trunk.setMatrixAt(i, m);
      const top = new V3(0.12, 1, 0).multiply(new V3(1, p.h, 1)).applyQuaternion(q).add(new V3(p.x, p.g, p.z));
      const nf = 9 + Math.floor(R() * 3);
      for (let j = 0; j < nf; j++) { const L = 3.2 + R() * 1.6, tilt = j < 2 ? -1.05 : -(0.08 + R() * 0.5); q.setFromEuler(e.set(tilt, j / nf * PI * 2 + R() * 0.4, 0, 'YXZ')); m.compose(top, q, new V3(1.9 + R() * 0.4, L, L)); fronds.setMatrixAt(f++, m); }
      for (let j = 0; j < 3 + Math.floor(R() * 2); j++) { const a = R() * PI * 2; m.compose(top.clone().add(new V3(Math.cos(a) * 0.22, -0.25 - R() * 0.15, Math.sin(a) * 0.22)), q.identity(), new V3(1, 1.1, 1)); nuts.setMatrixAt(k++, m); }
    });
    trunk.count = N; fronds.count = f; nuts.count = k; trunk.castShadow = fronds.castShadow = true; trunk.receiveShadow = fronds.receiveShadow = true;
    [trunk, fronds, nuts].forEach(o => scene.add(o)); out.trunk = trunk; out.fronds = fronds; out.nuts = nuts;
  };
  return out;
})();

/* ---- 5. butterflies: forty, working the flower drifts, wings beating ---- */
const BFLY = (function () {
  const N = isMobile ? 16 : 40, g = new THREE.BufferGeometry();
  // two wings hinged on the body line (x = 0); the left wing has x < 0
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.05, -0.09, 0.01, 0.07, -0.08, 0, -0.06, 0, 0, -0.04, 0, 0, 0.05, 0.09, 0.01, 0.07, 0.08, 0, -0.06, 0, 0, -0.04], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]); g.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xffffff }); // flat colour: lit wings went black edge on
  mat.onBeforeCompile = sh => { sh.uniforms.uWT = NAT.windT; sh.vertexShader = 'uniform float uWT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7; float fl = sin(uWT * 22.0 + ph) * 1.1;
      float sx = sign(position.x); float ax = abs(position.x); transformed.x = sx * ax * cos(fl); transformed.y += ax * sin(fl);`); };
  mat.customProgramCacheKey = () => 'mi-bfly-v6';
  const mesh = new THREE.InstancedMesh(g, mat, N); mesh.frustumCulled = false; mesh.visible = false;
  const COLS = [0xff8a1e, 0xffd23a, 0xf4f1e8, 0x2962FF, 0xe85aa0, 0xff5a2a], c = new THREE.Color();
  const B = []; for (let i = 0; i < N; i++) { mesh.setColorAt(i, c.set(COLS[i % COLS.length])); B.push({ x: 0, y: 1, z: 0, tx: 0, tz: 0, home: 0, t: Math.random() * 10, sp: 1.2 + Math.random() }); }
  scene.add(mesh); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(1.3, 1.3, 1.3);
  return { mesh, step(dt) {
    if (!NAT.flow.length) return; mesh.visible = L.sunI > 0.4 && (typeof WX === 'undefined' || WX.cur === 'CLEAR' || WX.cur === 'SCATTERED');
    if (!mesh.visible) return;
    B.forEach((b, i) => {
      if (!b.init) { const f = NAT.flow[(i * 7) % NAT.flow.length]; b.x = b.tx = f[0]; b.z = b.tz = f[1]; b.home = (i * 7) % NAT.flow.length; b.init = 1; }
      b.t -= dt; const d = Math.hypot(b.tx - b.x, b.tz - b.z);
      if (b.t < 0 || d < 0.3) { b.t = 1.5 + Math.random() * 3; if (Math.random() < 0.08) b.home = Math.floor(Math.random() * NAT.flow.length); const f = NAT.flow[b.home]; b.tx = f[0] + (Math.random() - 0.5) * 7; b.tz = f[1] + (Math.random() - 0.5) * 7; }
      const k = Math.min(1, dt * b.sp / Math.max(d, 0.001)); b.x += (b.tx - b.x) * k; b.z += (b.tz - b.z) * k;
      const gy = ground(b.x, b.z); b.y = gy + 0.5 + 0.35 * Math.sin(T * 2.3 + i) + 0.15 * Math.sin(T * 7.1 + i * 3);
      q.setFromEuler(e.set(0.2 * Math.sin(T * 3 + i), Math.atan2(b.tx - b.x, b.tz - b.z), 0)); m.compose(new V3(b.x, b.y, b.z), q, s); mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  } };
})();

PALM.build(PALM_SPOTS);
if (typeof THREE.GLTFLoader === 'function') natLoadAll().then(() => { try { natScatter(); natBuild(); } catch (e) { console.warn('MEME ISLAND: nature layer failed,', e.message); } });
window.__NAT = NAT; window.__PALM = PALM; window.__NATP = NAT_PLACE; window.__NATA = NAT_ASSETS;
