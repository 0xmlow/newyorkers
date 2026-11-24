/* ================================================================
   v439 THE LOOK: A LENS FOR THE TOUR (2026-11-24)
   The guided tour and every camera rail now shoot like a film camera: the thing the shot is about stays sharp and
   the world behind it melts into soft discs of light (a golden angle bokeh, sixteen taps, wider the further past
   the subject a pixel is), so each stop reads as a composed shot instead of a game screenshot. Focus follows the
   rail's look point as it moves. Walking about keeps everything sharp, and so do the aerial and the long survey rails. Desktop (it needs the depth pass).
   ?dof=0 off, ?dof=1 keeps it on while you walk.
   ================================================================ */
const DOF = { pass: null, k: 0, focus: 20 };
window.__DOF = DOF;
const _dofA = new V3(), _dofB = new V3();
function dofSetup() {
  if (DOF.pass || !POST.comp || !AO.on || !AO.depth || !THREE.ShaderPass || /dof=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: AO.depth.depthTexture }, uInvProj: { value: new THREE.Matrix4() }, uFocus: { value: 20 }, uK: { value: 0 }, uPx: { value: new THREE.Vector2(1 / 1280, 1 / 720) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse, tDepth; uniform mat4 uInvProj; uniform float uFocus, uK; uniform vec2 uPx; varying vec2 vUv;',
      'float dist(vec2 uv){ float d = texture2D(tDepth, uv).x; if (d >= 0.99999) return 5000.0; vec4 v = uInvProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return length(v.xyz / v.w); }',
      'float coc(float z){ return clamp((abs(z - uFocus) / max(z, 0.5) - 0.3) * 1.4, 0.0, 1.0) * uK * (z < uFocus ? 0.55 : 1.0); }',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uK < 0.01) { gl_FragColor = c; return; }',
      '  float z0 = dist(vUv), r0 = coc(z0) * 5.0; if (r0 < 0.4) { gl_FragColor = c; return; }',
      '  vec3 acc = c.rgb; float ws = 1.0;',
      '  for (int i = 1; i < 17; i++) { float t = float(i) / 16.0, a = float(i) * 2.39996; vec2 o = vec2(cos(a), sin(a)) * sqrt(t) * r0 * uPx;',
      '    float z = dist(vUv + o); float rz = coc(z) * 5.0; float w = z < z0 ? clamp(rz / max(r0, 0.01), 0.0, 1.0) : 1.0; vec3 s = texture2D(tDiffuse, vUv + o).rgb;',
      '    w *= 1.0 + 2.0 * smoothstep(0.9, 2.0, dot(s, vec3(0.3, 0.59, 0.11))); acc += s * w; ws += w; }',
      '  gl_FragColor = vec4(acc / ws, c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi : 1, 0, pass); DOF.pass = pass;
}
function dofFrame(dt) {
  dofSetup(); if (!DOF.pass) return; const u = DOF.pass.uniforms;
  const want = (RAIL.on && RAIL.look && RAIL.dur < 60 && camera.position.y < 30 ? 1 : 0) || (/dof=1/.test(location.search) ? 1 : 0);
  if (RAIL.on && RAIL.look) { const lin = Math.min(1, RAIL.t / RAIL.dur), e = RAIL.ease ? lin * lin * (3 - 2 * lin) : lin; _dofA.fromArray(RAIL.look[0]); _dofB.fromArray(RAIL.look[1]); _dofA.lerp(_dofB, e); DOF.focus = Math.max(2, camera.position.distanceTo(_dofA)); }
  DOF.k += (want - DOF.k) * Math.min(1, dt * 2.5); u.uK.value = DOF.k; u.uFocus.value = DOF.focus; DOF.pass.enabled = DOF.k > 0.01 && AO.on;
  u.tDepth.value = AO.depth.depthTexture; u.uInvProj.value.copy(camera.projectionMatrixInverse);
  const s = renderer.getDrawingBufferSize(_dofSz); u.uPx.value.set(1 / s.x, 1 / s.y);
}
const _dofSz = new THREE.Vector2();
window.__FRAMES.push(dt => { try { dofFrame(dt); } catch (e) { if (!DOF.err) { DOF.err = e; console.warn('v439 dof', e); } } });
