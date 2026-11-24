/* ================================================================
   v467 THE LOOK: NIGHT STREAKS (2026-11-24)
   Shot at night through a cinema lens, every hard light (a street lamp, a headlight, the drones, the marquee
   bulbs) throws a thin horizontal streak of blue light across the frame, the anamorphic flare that says
   "film" before anything else does. Only the brightest pixels streak, only after dusk, fading with distance from
   the light. Desktop. ?streaks=0 off.
   ================================================================ */
const STREAK = { pass: null };
window.__STREAK = STREAK;
function streakSetup() {
  if (STREAK.pass || STREAK.no || isMobile || !POST.comp || !THREE.ShaderPass || /streaks=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, uPx: { value: 1 / 1280 }, uK: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float uPx, uK; varying vec2 vUv;',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uK < 0.01) { gl_FragColor = c; return; } vec3 acc = vec3(0.0);',
      '  for (int i = 1; i <= 24; i++) { float o = float(i) * float(i) * 0.9 * uPx; float w = 1.0 - float(i) / 25.0; vec3 a = texture2D(tDiffuse, vUv + vec2(o, 0.0)).rgb, b = texture2D(tDiffuse, vUv - vec2(o, 0.0)).rgb;',
      '    acc += (max(a - 0.78, 0.0) + max(b - 0.78, 0.0)) * w * w; }',
      '  float l = dot(acc, vec3(0.3, 0.59, 0.11)); gl_FragColor = vec4(c.rgb + vec3(0.35, 0.55, 1.0) * l * 0.09 * uK, c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi : 1, 0, pass); STREAK.pass = pass;
}
const _stsz = new THREE.Vector2();
window.__FRAMES.push(() => { try { streakSetup(); if (!STREAK.pass) return; if (STREAK.no) { STREAK.pass.enabled = false; return; } const k = Math.min(1, Math.max(0, (L.lamps || 0) * 1.5 - 0.3)); STREAK.pass.enabled = k > 0.01; STREAK.pass.uniforms.uK.value = k; renderer.getDrawingBufferSize(_stsz); STREAK.pass.uniforms.uPx.value = 1 / _stsz.x; } catch (e) { STREAK.no = true; } });
