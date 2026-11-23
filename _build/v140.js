/* ================================================================
   v140 YOU CAN SEE YOUR BREATH (2026-11-23)
   In the cold (December to February all day, November and March mornings and evenings, and whenever it snows)
   everybody's breath shows: a small white cloud every few seconds from every person near you, out in front of
   their face, swelling and gone. Yours too, in front of the camera, so you walk through your own breath.
   ================================================================ */
const BREATH = { heads: [], scan: 0, k: 0, i: 0, mine: 0, N: 220, T: 0 };
window.__BREATH = BREATH;
(function breath() {
  const N = BREATH.N, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute('aVel', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute('aBirth', new THREE.Float32BufferAttribute(new Float32Array(N).fill(-99), 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uScale: { value: 400 }, uK: { value: 1 }, uL: { value: 1 } },
    vertexShader: 'attribute vec3 aVel; attribute float aBirth; uniform float uT, uScale; varying float vA; void main(){ float age = uT - aBirth; if (age < 0.0 || age > 1.8) { vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0); return; }' +
      ' float e = 1.0 - exp(-age * 2.2); vec3 p = position + aVel * e * 0.45 + vec3(0.0, age * 0.06, 0.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (0.16 + e * 0.5) * uScale / max(0.15, -mv.z); vA = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.5, 1.8, age)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uK, uL; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(q)) * vA * 0.55 * uK; if (a < 0.004) discard; gl_FragColor = vec4(vec3(0.92, 0.94, 0.96) * uL, a); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); BREATH.pts = pts; BREATH.mat = mat;
})();
const _brw = new V3(), _brd = new V3();
function breathPuff(x, y, z, vx, vy, vz) { const a = BREATH.pts.geometry.attributes, i = BREATH.i++ % BREATH.N; a.position.setXYZ(i, x, y, z); a.aVel.setXYZ(i, vx, vy, vz); a.aBirth.setX(i, BREATH.T); a.position.needsUpdate = a.aVel.needsUpdate = a.aBirth.needsUpdate = true; }
function breathFrame(dt) {
  const t = nycTime(TIME.utc), W = WX.override || WX.cur, cold = t.mo === 12 || t.mo <= 2 || W === 'SNOW' || ((t.mo === 11 || t.mo === 3) && (t.hours < 10 || t.hours > 17));
  BREATH.k += ((cold ? 1 : 0) - BREATH.k) * Math.min(1, dt * 0.3); BREATH.T += dt; const m = BREATH.mat.uniforms; m.uT.value = BREATH.T; m.uK.value = BREATH.k; m.uL.value = 0.45 + 0.55 * (1 - (L.lamps || 0) * 0.7); m.uScale.value = renderer.domElement.height * 0.5 / Math.tan(camera.fov * PI / 360);
  if (BREATH.k < 0.05) { BREATH.pts.visible = false; return; } BREATH.pts.visible = true;
  BREATH.scan -= dt; if (BREATH.scan <= 0) { BREATH.scan = 3; BREATH.heads.length = 0; const cp = camera.position; scene.traverse(o => { if (o.isMesh && o.geometry === PG.head && BREATH.heads.length < 40) { o.getWorldPosition(_brw); if (_brw.distanceToSquared(cp) < 30 * 30) BREATH.heads.push({ o, ph: Math.random() * 4 }); } }); }
  BREATH.heads.forEach(h => { h.ph -= dt; if (h.ph > 0) return; h.ph = 3 + Math.random() * 1.5; let o = h.o, vis = true; while (o) { if (!o.visible) { vis = false; break; } o = o.parent; } if (!vis) return;
    h.o.getWorldPosition(_brw); (h.o.parent || h.o).getWorldDirection(_brd); _brd.y = 0; _brd.normalize(); breathPuff(_brw.x + _brd.x * 0.17, _brw.y - 0.05, _brw.z + _brd.z * 0.17, _brd.x * 0.8, -0.05, _brd.z * 0.8); });
  // 2026-11-23: the camera's own breath is gone: in first person it could only ever read as a smudge on the lens
}
window.__FRAMES.push(dt => { try { breathFrame(dt); } catch (e) { if (!BREATH.err) { BREATH.err = e; console.warn('v140 breath', e); } } });
