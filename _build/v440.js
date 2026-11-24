/* ================================================================
   v440 THE LOOK: SHARP (2026-11-24)
   The anti aliasing and the half resolution passes left every texture a touch soft, the brick, the paving, the
   lettering on the signs. A contrast adaptive sharpen (after AMD's FidelityFX CAS) runs last: it sharpens fine
   detail by how much local contrast there is, so flat sky and smooth water stay smooth and edges never ring.
   About a third of a millisecond. Desktop. ?sharp=0 off.
   ================================================================ */
const SHARP = { pass: null };
window.__SHARP = SHARP;
function sharpSetup() {
  if (SHARP.pass || SHARP.no || isMobile || !POST.comp || !THREE.ShaderPass || /sharp=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, uPx: { value: new THREE.Vector2(1 / 1280, 1 / 720) }, uAmt: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform vec2 uPx; uniform float uAmt; varying vec2 vUv;',
      'void main(){ vec3 e = texture2D(tDiffuse, vUv).rgb;',
      '  vec3 b = texture2D(tDiffuse, vUv + vec2(0.0, -uPx.y)).rgb, d = texture2D(tDiffuse, vUv + vec2(-uPx.x, 0.0)).rgb, f = texture2D(tDiffuse, vUv + vec2(uPx.x, 0.0)).rgb, h = texture2D(tDiffuse, vUv + vec2(0.0, uPx.y)).rgb;',
      '  vec3 mn = min(e, min(min(b, d), min(f, h))), mx = max(e, max(max(b, d), max(f, h)));',
      '  vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));',
      '  vec3 w = amp * -1.0 / mix(8.0, 5.0, uAmt);',
      '  vec3 o = (e + (b + d + f + h) * w) / (1.0 + 4.0 * w);',
      '  gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0); }'].join('\n') });
  POST.comp.addPass(pass); SHARP.pass = pass;
  const sz = new THREE.Vector2(); const fit = () => { renderer.getDrawingBufferSize(sz); pass.uniforms.uPx.value.set(1 / sz.x, 1 / sz.y); }; fit(); addEventListener('resize', fit);
}
window.__FRAMES.push(() => { try { sharpSetup(); } catch (e) { SHARP.no = true; console.warn('v440 sharp', e); } });
