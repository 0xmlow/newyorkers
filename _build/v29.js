/* ================================================================
   v29 IMPERMANENT VISION (2026-11-22): MLow's own art language in the island's architecture, at Whisper by day
   and Bloom by night (apply-mlow-impermanent-vision, spatial-implementation.md).
   - THE CURRENT: a world space contour field chained into the island's concrete, sandstone, bunker, cap and plinth
     materials. The lines crowd and bend toward the thresholds (the bodega door, the toll, the subway, the El
     stair, N3W Square, the lighthouse door and THE CUT), the surface under them pulls toward midnight navy, every
     fifth line is heavier and hot pink. Faint by day, electric at night. Signs, cards and source art are untouched.
   - PAINT: physical drips (geometry, so they have silhouettes) off the cornices and columns beside those thresholds,
     cobalt, cyan, hot pink and bone, with a bead that falls now and then.
   - THE WITNESS: one sovereign Open Eye Flower, six bone petals marbled with cobalt contour lines around a real blue
     iris, rising forty metres out of the north harbour beyond the lighthouse. It turns to watch you. It blinks when
     the El passes, and when you type BLINK.
   - THE CUT: a freestanding stone doorway in the southwest clearing. Inside it there is no clearing: a navy void
     with cyan contour rivers and a red paint current that shift with your point of view. Walk through it and you
     come out on the lighthouse roof, face to face with the Witness.
   ================================================================ */
const IV = { night: { value: 0 }, time: { value: 0 }, attr: { value: [] }, mats: [] };
window.__IV = IV;
const IV_ATTR = [[12, 1.6, 66, 1.0], [0, 3, 100, 0.9], [26, 0.5, 26, 0.9], [2.4, 3, 168, 0.8], [81, 2, 14.6, 0.9], [0, 2, -121.8, 0.8], [-42, 3, -69, 1.3], [0, 60, -215, 0.6]];
IV.attr.value = IV_ATTR.map(a => new THREE.Vector4(a[0], a[1], a[2], a[3]));
const IV_GLSL = `
uniform float uIvNight; uniform float uIvT; uniform vec4 uIvA[8]; varying vec3 vIvW;
float ivH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float ivN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ivH(i), ivH(i + vec3(1,0,0)), f.x), mix(ivH(i + vec3(0,1,0)), ivH(i + vec3(1,1,0)), f.x), f.y), mix(mix(ivH(i + vec3(0,0,1)), ivH(i + vec3(1,0,1)), f.x), mix(ivH(i + vec3(0,1,1)), ivH(i + vec3(1,1,1)), f.x), f.y), f.z); }
float ivF(vec3 p){ return ivN(p) * 0.6 + ivN(p * 2.03) * 0.3 + ivN(p * 4.1) * 0.1; }
vec2 ivField(vec3 p){ float pull = 0.0, f = ivF(p * 0.22 + vec3(0.0, uIvT * 0.01, 0.0)) * 3.0;
  for (int i = 0; i < 8; i++) { float d = length(p - uIvA[i].xyz); float e = exp(-d / (7.0 * uIvA[i].w)); f += e * 2.4 * uIvA[i].w; pull += e * uIvA[i].w; }
  return vec2(f, clamp(pull * 1.35, 0.0, 1.0)); }
`;
function ivChain(m, strength) {
  if (!m || m.userData.iv) return; m.userData.iv = true; const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null; strength = strength || 1;
  m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r);
    sh.uniforms.uIvNight = IV.night; sh.uniforms.uIvT = IV.time; sh.uniforms.uIvA = IV.attr; sh.uniforms.uIvS = { value: strength };
    sh.vertexShader = 'varying vec3 vIvW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 ivw = vec4(transformed, 1.0);\n #ifdef USE_INSTANCING\n ivw = instanceMatrix * ivw;\n #endif\n vIvW = (modelMatrix * ivw).xyz;');
    sh.fragmentShader = IV_GLSL + 'uniform float uIvS;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n vec2 ivFP = ivField(vIvW); float ivCov = ivFP.y * uIvS; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.035, 0.085), ivCov * mix(0.16, 0.82, uIvNight));')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
 { vec2 ivFP2 = ivField(vIvW); float ivCov2 = ivFP2.y * uIvS; float k = 9.0, q = ivFP2.x * k, fq = fract(q), idx = floor(q); float w = mod(idx, 5.0) < 0.5 ? 0.11 : 0.06;
   float ln = smoothstep(w, 0.0, abs(fq - 0.5) * 2.0 - (1.0 - w) + w) ; ln = (1.0 - smoothstep(0.0, w, min(fq, 1.0 - fq)));
   float fade = 1.0 - smoothstep(25.0, 85.0, length(vViewPosition));
   vec3 cA = vec3(0.16, 0.38, 1.0), cB = vec3(0.03, 0.87, 1.0), cP = vec3(1.0, 0.3, 0.63);
   vec3 lc = mod(idx, 5.0) < 0.5 ? cP : mix(cA, cB, ivN(vIvW * 0.3 + idx));
   float amt = ln * fade * (ivCov2 * mix(0.09, 1.25, uIvNight) + 0.05 * uIvNight * uIvS);
   totalEmissiveRadiance += lc * amt; }`);
  };
  m.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|iv' + strength; m.needsUpdate = true; IV.mats.push(m);
}
[MAT.conc, MAT.stone, MAT.sandstone, ARCH.bunker, ARCH.stone, ARCH.cap, ARCH.plinth, MAT.brick].forEach(m => ivChain(m, 1));

/* ---------- physical paint drips beside the thresholds ---------- */
const DRIPS = { beads: [] };
(function drips() {
  const cols = [0x2962ff, 0x08deff, 0xff4fa0, 0xefe8da, 0x2962ff];
  const runs = [ // [x0, z0, x1, z1, top y, count]
    [11.8, 59.2, 11.8, 64, ground(17, 66) + 4.7, 14], [11.8, 68, 11.8, 72.8, ground(17, 66) + 4.7, 14],
    [-7.6, 95.15, -7.6, 95.15, ground(0, 100) + 6.0, 6], [7.6, 104.85, 7.6, 104.85, ground(0, 100) + 6.0, 6], [-8.3, 104.9, 8.3, 104.9, ground(0, 100) + 5.82, 26],
    [76.4, 14.6, 85.6, 14.6, ground(81, 10) + 4.1, 18], [24.6, 24.2, 27.4, 27.8, ground(26, 26) + 1.0, 8], [-1.4, -121.9, 1.4, -121.9, 6.5, 8]];
  const geo = new THREE.CylinderGeometry(1, 0.55, 1, 7, 1); geo.translate(0, -0.5, 0); const tip = new THREE.SphereGeometry(1, 8, 6);
  const per = {}; runs.forEach(([x0, z0, x1, z1, y, n]) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1) + (Math.random() - 0.5) * 0.04; const c = cols[(Math.random() * cols.length) | 0];
    (per[c] || (per[c] = [])).push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, y, L: 0.25 + Math.pow(Math.random(), 2) * 1.6, w: 0.025 + Math.random() * 0.05 }); } });
  const m4 = new THREE.Matrix4(); IV.dripMats = [];
  Object.keys(per).forEach(c => { const L = per[c], mat = new THREE.MeshStandardMaterial({ color: +c, roughness: 0.25, metalness: 0.05, emissive: +c, emissiveIntensity: 0.05 }); IV.dripMats.push(mat);
    const body = new THREE.InstancedMesh(geo, mat, L.length), end = new THREE.InstancedMesh(tip, mat, L.length);
    L.forEach((d, i) => { m4.makeScale(d.w, d.L, d.w); m4.setPosition(d.x, d.y, d.z); body.setMatrixAt(i, m4); m4.makeScale(d.w * 1.25, d.w * 1.6, d.w * 1.25); m4.setPosition(d.x, d.y - d.L, d.z); end.setMatrixAt(i, m4); if (d.L > 1.1) DRIPS.beads.push({ x: d.x, z: d.z, y0: d.y - d.L, c: +c, t: Math.random() * 6 }); });
    [body, end].forEach(o => { o.frustumCulled = false; scene.add(o); }); });
  const bead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.2, emissive: 0x2962ff, emissiveIntensity: 0.3 }), Math.max(1, DRIPS.beads.length)); bead.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bead.frustumCulled = false; scene.add(bead); DRIPS.bead = bead;
})();

/* ---------- THE WITNESS ---------- */
const WIT = { g: null, head: null, iris: null, blink: 0 };
(function witness() {
  const x = 0, z = -215, g = new THREE.Group(); g.position.set(x, -2, z); g.scale.setScalar(1.7); scene.add(g);
  const pcv = document.createElement('canvas'); pcv.width = 256; pcv.height = 512; const c = pcv.getContext('2d');
  if (c && c.beginPath) { const gr = c.createLinearGradient ? c.createLinearGradient(0, 0, 0, 512) : null; if (gr) { gr.addColorStop(0, '#f4efe4'); gr.addColorStop(1, '#d9d1c2'); c.fillStyle = gr; } else c.fillStyle = '#efe8da'; c.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 26; i++) { c.strokeStyle = i % 5 === 0 ? 'rgba(170,110,70,0.35)' : 'rgba(41,98,255,' + (0.12 + Math.random() * 0.18) + ')'; c.lineWidth = i % 5 === 0 ? 2.2 : 1.2; c.beginPath(); for (let y = 0; y <= 512; y += 16) { const xx = 128 + Math.sin(y * 0.012 + i * 0.7) * (40 + i * 3.5) * (y / 512); y ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke(); } }
  const pt = new THREE.CanvasTexture(pcv); pt.encoding = THREE.sRGBEncoding;
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -6, 0), new THREE.Vector3(3, 10, 2), new THREE.Vector3(-2, 24, -1), new THREE.Vector3(0, 36, 0)]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 40, 1.3, 12, false), new THREE.MeshStandardMaterial({ color: 0x1c2a22, roughness: 0.75 })); g.add(stem);
  // no leaves: a bare dark stem reads stranger
  const head = new THREE.Group(); head.position.set(0, 37, 0); g.add(head);
  // the head is MLow's own painted Open Eye Flower (the skill's motif sheet), on a cupped surface so it has depth
  const ft = tex('assets/iv_flower.webp'); ft.anisotropy = ANISO;
  const cup = new THREE.SphereGeometry(30, 48, 24, 0, PI * 2, 0, 0.47); cup.rotateX(PI / 2); cup.translate(0, 0, -30 * Math.cos(0.47) - 0.0);
  { const uv = cup.attributes.uv, ps = cup.attributes.position; for (let i = 0; i < ps.count; i++) { const R = 30 * Math.sin(0.47); uv.setXY(i, 0.5 + ps.getX(i) / (2 * R), 0.5 + ps.getY(i) / (2 * R)); } uv.needsUpdate = true; }
  const faceM = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.45, roughness: 0.55, side: THREE.FrontSide, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0 });
  const face = new THREE.Mesh(cup, faceM); face.position.z = 1.2; head.add(face);
  const backM = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.45, roughness: 0.7, color: 0x8a8578, side: THREE.BackSide }); const back = new THREE.Mesh(cup, backM); back.position.z = 1.15; head.add(back);
  const iris = face; const lid = new THREE.Mesh(new THREE.SphereGeometry(2.3, 24, 12, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: 0.6 })); lid.rotation.x = PI / 2; lid.position.z = 1.6; lid.scale.set(1, 0.001, 0.5); head.add(lid);
  head.scale.setScalar(1.0);
  WIT.g = g; WIT.head = head; WIT.iris = iris; WIT.lid = lid;
})();
const witSecret = secret('witness', () => { WIT.blink = 0.5; toast('THE WITNESS BLINKS. IT WAS NOT A WINK. IT DOES NOT DO WINKS.'); }, ['blink', 'witness', 'openeyeflower']);

/* ---------- THE CUT ---------- */
const CUT = { x: -42, z: -69, ry: 0.6 };
(function theCut() {
  const { x, z, ry } = CUT, g0 = ground(x, z), g = new THREE.Group(); g.position.set(x, g0, z); g.rotation.y = ry; scene.add(g);
  const jm = ARCH.stone || MAT.stone; const W = 3.2, H = 6.2, T = 1.1;
  [-1, 1].forEach(s => { const j = new THREE.Mesh(new THREE.BoxGeometry(1.0, H, T), jm); j.position.set(s * (W / 2 + 0.5), H / 2, 0); j.castShadow = true; g.add(j); });
  const lin = new THREE.Mesh(new THREE.BoxGeometry(W + 2.6, 1.0, T + 0.2), jm); lin.position.y = H + 0.5; lin.castShadow = true; g.add(lin);
  const step = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 0.25, T + 1.6), jm); step.position.y = 0.12; g.add(step);
  const pm = new THREE.ShaderMaterial({ uniforms: { uT: IV.time, uCam: { value: new THREE.Vector3() } }, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW; varying vec2 vU; void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT; uniform vec3 uCam; varying vec3 vW; varying vec2 vU;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p){ return n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15; }
      void main(){ vec3 v = normalize(vW - uCam); vec3 col = vec3(0.012, 0.02, 0.06); float acc = 0.0;
        for (int L = 0; L < 5; L++) { float d = 2.0 + float(L) * 3.0; vec2 q = (vU - 0.5) * vec2(3.2, 6.2) + v.xy * d * 0.9 + vec2(v.z * d * 0.2, 0.0);
          float f = fb(q * 0.35 + float(L) * 7.1 + vec2(0.0, uT * 0.03)) * 6.0 - length(q) * 0.25; float ln = 1.0 - smoothstep(0.0, 0.07, abs(fract(f * 2.2) - 0.5) * 2.0 - 0.86);
          ln = smoothstep(0.86, 0.98, abs(fract(f * 2.2) - 0.5) * 2.0); float k = 1.0 / (1.0 + float(L) * 0.7);
          col += mix(vec3(0.03, 0.87, 1.0), vec3(0.16, 0.38, 1.0), float(L) / 4.0) * ln * k * 0.9; }
        vec2 r = (vU - 0.5) * vec2(3.2, 6.2) + v.xy * 3.0; float cur = smoothstep(0.35, 0.0, abs(r.x + sin(r.y * 1.3 + uT * 0.25) * 0.6 + fb(r * 0.8 + uT * 0.05) - 0.4));
        col += vec3(0.85, 0.08, 0.06) * cur * 0.9; float edge = smoothstep(0.0, 0.06, min(min(vU.x, 1.0 - vU.x), min(vU.y, 1.0 - vU.y))); col *= 0.4 + 0.6 * edge;
        gl_FragColor = vec4(col, 1.0); }`, toneMapped: false });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(W, H), pm); portal.position.y = H / 2 + 0.25; g.add(portal); CUT.pm = pm; CUT.g = g;
  g.updateMatrixWorld(true); [-1, 1].forEach(s => { const p = new THREE.Vector3(s * (W / 2 + 0.5), 0, 0).applyMatrix4(g.matrixWorld); if (typeof CIRCS !== 'undefined') CIRCS.push({ x: p.x, z: p.z, r: 0.75, y0: -5, y1: 9, on: true }); });
  const lab = signTex([{ t: 'THE CUT', s: 0.5 }, { t: 'WALK THROUGH', s: 0.18 }], 512, 256, '#0D0D0D', '#FFFFFF'); const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); sg.position.set(W / 2 + 1.8, 1.2, 0.6); sg.rotation.y = -0.3; g.add(sg);
})();
const cutSecret = secret('thecut', () => { });
function cutFrame(dt) {
  CUT.pm.uniforms.uCam.value.copy(camera.position); const inv = new THREE.Matrix4().copy(CUT.g.matrixWorld).invert(), lp = new THREE.Vector3(P.x, P.y + 1, P.z).applyMatrix4(inv);
  const side = Math.sign(lp.z); if (CUT.side && side && side !== CUT.side && Math.abs(lp.x) < 1.6 && lp.y < 6 && !CUT.cd) { CUT.cd = 3; cutSecret(); flash('#0D0D0D'); teleport(LH.x + 3.5, LH.z - LH.d / 2 + 2.4, 0, 100); toast('YOU WERE INSIDE THE PAINTING FOR A SECOND. NOW YOU ARE ON THE LIGHTHOUSE ROOF. THE WITNESS IS LOOKING AT YOU.'); WIT.blink = 0.4; }
  if (side) CUT.side = side; if (CUT.cd > 0) { CUT.cd -= dt; if (CUT.cd <= 0) CUT.cd = 0; }
}
function ivFrame(dt) {
  IV.time.value += dt; IV.night.value = Math.min(1, Math.max(0, (L.lamps || 0) * 1.35 - 0.1));
  IV.dripMats.forEach(m => m.emissiveIntensity = 0.03 + 0.55 * IV.night.value);
  const m4 = new THREE.Matrix4(); DRIPS.beads.forEach((b, i) => { b.t += dt; const k = (b.t % 6) / 6; const y = k < 0.7 ? b.y0 - 0.05 : b.y0 - (k - 0.7) * (k - 0.7) * 60; m4.makeTranslation(b.x, y < 0 ? -99 : y, b.z); DRIPS.bead.setMatrixAt(i, m4); }); DRIPS.bead.instanceMatrix.needsUpdate = true;
  // the Witness watches
  const hp = new THREE.Vector3(); WIT.head.getWorldPosition(hp); const to = new THREE.Vector3().subVectors(camera.position, hp); const yaw = Math.atan2(to.x, to.z), pitch = Math.atan2(to.y, Math.hypot(to.x, to.z));
  WIT.head.rotation.y += (Math.max(-1.2, Math.min(1.2, yaw)) - WIT.head.rotation.y) * Math.min(1, dt * 0.8); WIT.head.rotation.x += (-pitch * 0.7 - WIT.head.rotation.x) * Math.min(1, dt * 0.8);
  WIT.head.rotation.z = Math.sin(IV.time.value * 0.3) * 0.04; WIT.g.rotation.z = Math.sin(IV.time.value * 0.2) * 0.012;
  if (window.__EL && __EL.cars[0] && Math.hypot(__EL.cars[0].position.x - hp.x, __EL.cars[0].position.z - hp.z) < 60 && !WIT.elBlink) { WIT.elBlink = true; WIT.blink = 0.4; } else if (window.__EL && __EL.cars[0] && Math.hypot(__EL.cars[0].position.x - hp.x, __EL.cars[0].position.z - hp.z) > 90) WIT.elBlink = false;
  if (WIT.blink > 0) { WIT.blink -= dt; const k = Math.sin(Math.max(0, WIT.blink) / 0.4 * PI); WIT.lid.scale.y = Math.max(0.001, k * 1.0); } else WIT.lid.scale.y = 0.001;
  WIT.iris.material.emissiveIntensity = 0.28 * IV.night.value;
  cutFrame(dt);
}
window.__FRAMES.push(dt => { try { ivFrame(dt); } catch (e) { if (!IV.err) { IV.err = e; console.warn('v29 iv', e); } } });
