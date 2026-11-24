/* ================================================================
   v455 THE LOOK: WHERE THE WATER MEETS THINGS (2026-11-24)
   Every leg of the ring bridge, every pile of the piers and every rock off the beach went into the harbour as if
   into glass: a clean line and nothing else. Real water piles up against what stands in it. Each of the two
   hundred odd things standing in the sea now wears a collar of moving white water, broken and breathing, wider
   on the big rocks and thin round the bridge legs, stronger when the wind is up and faint on a calm night.
   Found by itself after load (anything whose bounds cross the waterline beyond the beach), one instanced draw.
   ?collars=0 off.
   ================================================================ */
const COLLAR = { done: 0, n: 0 };
window.__COLLAR = COLLAR;
function collarBuild() {
  const b = new THREE.Box3(), M = new THREE.Matrix4(), pts = []; scene.updateMatrixWorld(true);
  scene.traverse(o => { if (!o.isMesh || !o.visible || !o.geometry || o === COLLAR.im || o.isSkinnedMesh) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const n = o.isInstancedMesh ? Math.min(o.count, 3000) : 1;
    for (let i = 0; i < n; i++) { if (o.isInstancedMesh) { o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); } else M.copy(o.matrixWorld); b.copy(o.geometry.boundingBox).applyMatrix4(M);
      if (b.min.y < -0.15 && b.max.y > 0.25) { const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, sx = b.max.x - b.min.x, sz = b.max.z - b.min.z, r = Math.max(sx, sz) / 2;
        if (sx < 6 && sz < 6 && Math.hypot(cx, cz) > SHORE - 2 && (o.isInstancedMesh || r < 0.75)) pts.push([cx, cz, r]); } } });
  const N = pts.length; if (!N) return 0;
  const geo = new THREE.RingGeometry(0.5, 1.0, 40, 1); geo.rotateX(-PI / 2);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uK: { value: 1 }, uCol: { value: new THREE.Color(0.9, 0.93, 0.92) } }]),
    vertexShader: '#include <fog_pars_vertex>\nattribute vec3 aC; varying vec2 vP; varying float vR, vS; void main(){ vec3 p = position; float r = length(p.xz); float R = aC.z; vec3 q = vec3(normalize(p.xz).x * (R * 0.92 + (r - 0.5) * 2.0 * (0.35 + R * 0.55)), 0.0, normalize(p.xz).y * (R * 0.92 + (r - 0.5) * 2.0 * (0.35 + R * 0.55))); vR = (r - 0.5) * 2.0; vP = normalize(p.xz); vS = aC.x * 0.37 + aC.y * 0.71; vec4 mvPosition = modelViewMatrix * vec4(q + vec3(aC.x, 0.06, aC.y), 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <common>\n#include <fog_pars_fragment>\nuniform float uT, uK; uniform vec3 uCol; varying vec2 vP; varying float vR, vS;\nvoid main(){ float a = atan(vP.y, vP.x); float n = 0.5 + 0.25 * sin(a * 7.0 + uT * 1.3 + vS) + 0.25 * sin(a * 13.0 - uT * 2.1 + vS * 2.0); float breath = 0.6 + 0.4 * sin(uT * 0.9 + vS);\n float band = smoothstep(0.0, 0.12, vR) * (1.0 - smoothstep(0.2, 1.0 - n * 0.35, vR)); float al = band * smoothstep(0.25, 0.7, n * breath + 0.2) * uK * 0.85; gl_FragColor = vec4(uCol, al);\n#include <fog_fragment>\n}' });
  const ig = new THREE.InstancedBufferGeometry(); ig.index = geo.index; ig.attributes.position = geo.attributes.position; const ac = new Float32Array(N * 3); pts.forEach((p, i) => { ac[i * 3] = p[0]; ac[i * 3 + 1] = p[1]; ac[i * 3 + 2] = p[2]; }); ig.setAttribute('aC', new THREE.InstancedBufferAttribute(ac, 3)); ig.instanceCount = N;
  if (COLLAR.im) { scene.remove(COLLAR.im); } const m = new THREE.Mesh(ig, mat); m.frustumCulled = false; m.renderOrder = 3; scene.add(m); COLLAR.im = m; COLLAR.mat = mat; COLLAR.n = N; return N;
}
window.__FRAMES.push(dt => { try { if (!LOOK.on || /collars=0/.test(location.search)) return; COLLAR.done++; if (COLLAR.done === 400 || COLLAR.done === 2400) collarBuild();
  if (!COLLAR.mat) return; const u = COLLAR.mat.uniforms; u.uT.value += dt; const W = WX.override || WX.cur; u.uK.value = (0.55 + 0.45 * Math.min(1, (WX.wet || 0) + (W === 'CLEAR' ? 0 : 0.4))) * (1 - 0.5 * (L.lamps || 0)) * (camera.position.y < 60 ? 1 : 0.6); } catch (e) { if (!COLLAR.err) { COLLAR.err = e; console.warn('v455', e); } } });
