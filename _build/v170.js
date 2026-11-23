/* ================================================================
   v170 THE LOOK: THE LAWN (2026-11-23)
   At eye level the lawn was a textured plane with tufts dotted on it, the most visible cheap surface in almost
   every frame. Now a real field of grass grows around you: up to 90,000 blades in a 46 metre square that travels
   with you (each blade keeps its own spot in the world, so nothing swims as you walk), tapered, bent, darker at
   the root and catching the light at the tip, lit and shadowed by the same sun as everything else, leaning in
   the island's wind, thinning out at the edge so it melts into the lawn texture. It grows only where there is
   lawn: once the island has loaded, it is photographed from straight above with grass painted white and
   everything else black (and the height of every surface stored alongside), and the blades read that map, so
   no grass comes up through a path, a plaza, a plinth or a building. Desktop only; ?grass=0 turns it off.
   ================================================================ */
const LAWN = { n: 90000, T: 46, ready: false, t: 0, shots: 0 };
window.__LAWN = LAWN;
(function lawnField() {
  if (!LOOK.on || isMobile || /grass=0/.test(location.search)) return;
  const rt = new THREE.WebGLRenderTarget(1024, 1024, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat }); LAWN.rt = rt;
  const vs = '#include <common>\nvarying float vY;\nvoid main(){\n#include <begin_vertex>\n#include <project_vertex>\nvec4 wp = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwp = instanceMatrix * wp;\n#endif\nwp = modelMatrix * wp; vY = wp.y; }';
  const enc = 'varying float vY; uniform float uG; void main(){ float h = clamp((vY + 2.0) / 12.0, 0.0, 1.0) * 255.0; gl_FragColor = vec4(uG, floor(h) / 255.0, fract(h), 1.0); }';
  LAWN.gMat = new THREE.ShaderMaterial({ uniforms: { uG: { value: 1 } }, vertexShader: vs, fragmentShader: enc, side: THREE.DoubleSide });
  LAWN.oMat = new THREE.ShaderMaterial({ uniforms: { uG: { value: 0 } }, vertexShader: vs, fragmentShader: enc, side: THREE.DoubleSide });
  LAWN.cam = new THREE.OrthographicCamera(-110, 110, 110, -110, 1, 260); LAWN.cam.position.set(0, 120, 0); LAWN.cam.up.set(0, 0, -1); LAWN.cam.lookAt(0, 0, 0); LAWN.cam.updateMatrixWorld(true);
  // one blade: a tapered strip of three segments, 0 to 1 tall
  const pos = [], idx = [], uv = []; const segs = 3; for (let i = 0; i <= segs; i++) { const v = i / segs, w = 0.5 * (1 - v * 0.92); pos.push(-w, v, 0, w, v, 0); uv.push(0, v, 1, v); } for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => i % 3 === 1 ? 1 : 0), 3));
  const N = LAWN.n, off = new Float32Array(N * 2), rnd = new Float32Array(N * 4); for (let i = 0; i < N; i++) { off[i * 2] = Math.random(); off[i * 2 + 1] = Math.random(); rnd[i * 4] = Math.random(); rnd[i * 4 + 1] = Math.random(); rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random(); }
  geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2)); geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4)); geo.instanceCount = N;
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }); LAWN.u = { uMask: { value: rt.texture }, uCam: { value: new THREE.Vector2() }, uT: { value: LAWN.T }, uTime: { value: 0 }, uWind: { value: 0.5 }, uBase: { value: new THREE.Color(0x1e3212) }, uTip: { value: new THREE.Color(0x8aa04a) } };
  mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, LAWN.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aOff; attribute vec4 aRnd; uniform sampler2D uMask; uniform vec2 uCam; uniform float uT, uTime, uWind; uniform vec3 uBase, uTip; varying vec3 vGrass;\nvec2 lawnUV(vec2 p){ return vec2((p.x + 110.0) / 220.0, (110.0 - p.y) / 220.0); }')      .replace('#include <begin_vertex>', `vec2 wxz = mod(aOff * uT - uCam + uT * 0.5, vec2(uT)) + uCam - uT * 0.5;
        vec4 mk = texture2D(uMask, lawnUV(wxz)); float gy = (mk.g * 255.0 + mk.b) / 255.0 * 12.0 - 2.0;
        vec4 mk2 = texture2D(uMask, lawnUV(wxz + vec2(0.35, 0.0))); vec4 mk3 = texture2D(uMask, lawnUV(wxz + vec2(0.0, 0.35)));
        float on = mk.r * step(0.5, mk2.r) * step(0.5, mk3.r); float dc = length(wxz - uCam); float fade = 1.0 - smoothstep(uT * 0.32, uT * 0.48, dc);
        float clump = 0.55 + 0.45 * sin(wxz.x * 1.7 + sin(wxz.y * 1.3)) * sin(wxz.y * 1.9 + cos(wxz.x * 0.7));
        float hgt = (0.12 + aRnd.x * 0.22) * (0.6 + 0.7 * clump) * on * fade; float wid = 0.022 + aRnd.y * 0.02;
        float ang = aRnd.z * 6.2831853; vec2 dir = vec2(cos(ang), sin(ang)); vec2 side = vec2(-dir.y, dir.x);
        float v = position.y; float bend = v * v * (0.25 + aRnd.w * 0.35); float gust = sin(uTime * 1.7 + wxz.x * 0.35 + wxz.y * 0.22) * 0.5 + sin(uTime * 3.1 + wxz.x * 1.3) * 0.2;
        vec2 lean = dir * bend + vec2(0.8, 0.45) * v * v * uWind * (0.25 + 0.35 * gust);
        vec3 transformed = vec3(wxz.x + side.x * position.x * wid + lean.x * hgt * 2.0, gy + v * hgt, wxz.y + side.y * position.x * wid + lean.y * hgt * 2.0);
        vGrass = mix(uBase, uTip * (0.8 + 0.4 * aRnd.w), smoothstep(0.0, 1.0, v)) * (0.75 + 0.5 * clump);`)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(vec3(0.0, 1.0, 0.0) + vec3(cos(aRnd.z * 6.2831853), 0.0, sin(aRnd.z * 6.2831853)) * 0.35);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrass;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vGrass;');
  };
  mat.customProgramCacheKey = () => 'mi-lawn-v170';
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.visible = false; scene.add(mesh); LAWN.mesh = mesh; LAWN.mat = mat;
})();
function lawnShoot() {
  const swaps = [], hidden = []; scene.traverse(o => { if (o === LAWN.mesh) { hidden.push(o); return; } if (!o.isMesh && !o.isPoints && !o.isSprite && !o.isLine) return; const m = o.material; if (!m || Array.isArray(m) || o.isPoints || o.isSprite || o.isLine || m.transparent || m.depthWrite === false || !o.visible) { if (o.visible) hidden.push(o); return; } swaps.push([o, m]); o.material = m === MAT.grass ? LAWN.gMat : LAWN.oMat; });
  if (!renderer.getClearColor || !renderer.setRenderTarget) { swaps.forEach(([o, m]) => o.material = m); return; } const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(); hidden.forEach(o => o.visible = false); const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null;
  try { renderer.setClearColor(0x000000, 1); renderer.setRenderTarget(LAWN.rt); renderer.clear(); renderer.render(scene, LAWN.cam); } finally { renderer.setRenderTarget(null); renderer.setClearColor(cc, ca); scene.background = bg; scene.fog = fog; swaps.forEach(([o, m]) => o.material = m); hidden.forEach(o => o.visible = true); }
  LAWN.ready = true; LAWN.mesh.visible = true; LAWN.shots++;
}
function lawnFrame(dt) {
  if (!LAWN.mesh) return; LAWN.t += dt; if ((LAWN.shots === 0 && LAWN.t > 6) || (LAWN.shots === 1 && LAWN.t > 25) || (LAWN.shots === 2 && LAWN.t > 70)) lawnShoot();
  const u = LAWN.u; u.uCam.value.set(camera.position.x, camera.position.z); u.uTime.value += dt; u.uWind.value = 0.35 + 0.4 * Math.sin(LIFE.t * 0.05) + (WX.wet || 0) * 0.4;
  const snow = WX.snow || 0, autumn = (() => { const m = SKY.t ? SKY.t.mo : 6; return m >= 10 || m <= 3 ? 1 : 0; })();
  u.uBase.value.setRGB(0.12, 0.2, 0.07).lerp(_lwn.setRGB(0.2, 0.19, 0.09), autumn * 0.5).lerp(_lwn.setRGB(0.75, 0.78, 0.82), snow * 0.8);
  u.uTip.value.setRGB(0.54, 0.63, 0.29).lerp(_lwn.setRGB(0.66, 0.6, 0.34), autumn * 0.55).lerp(_lwn.setRGB(0.95, 0.96, 0.98), snow * 0.8);
  LAWN.mesh.visible = LAWN.ready && camera.position.y < 40;
}
const _lwn = new THREE.Color();
window.__FRAMES.push(dt => { try { lawnFrame(dt); } catch (e) { if (!LAWN.err) { LAWN.err = e; console.warn('v170 lawn', e); } } });
