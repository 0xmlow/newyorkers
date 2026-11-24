/* ================================================================
   v438 THE LOOK: HAZE (2026-11-24)
   Real distance has air in it. Until now the island was as crisp and saturated three hundred metres away as at
   your feet, so the far shore, the bridge and the island seen from the air all sat on one flat plane like a
   model on a table. Aerial perspective: every pixel is pushed toward the colour of the air by how far away it is
   (the depth the ambient occlusion pass already draws, read back as metres), very little in the first hundred
   metres, a soft veil by the far side of the island, a real haze by the horizon. Blue grey by day, gold at the
   golden hour, deep blue at night, thicker in fog, rain and snow, and the near world stays untouched, so the
   island separates from the water and the water from the sky. Desktop (it needs the depth pass). ?air=0 off.
   ================================================================ */
const HAZE = { pass: null, k: 1 };
window.__HAZE = HAZE;
function hazeSetup() {
  if (HAZE.pass || !POST.comp || !AO.on || !AO.depth || !THREE.ShaderPass || /air=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: AO.depth.depthTexture }, uInvProj: { value: new THREE.Matrix4() }, uCol: { value: new THREE.Color(0.7, 0.78, 0.86) }, uK: { value: 1 / 700 }, uMax: { value: 0.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse, tDepth; uniform mat4 uInvProj; uniform vec3 uCol; uniform float uK, uMax; varying vec2 vUv;',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); float d = texture2D(tDepth, vUv).x; if (d >= 0.99999) { gl_FragColor = c; return; }',
      '  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); float dist = length(v.xyz / v.w);',
      '  float f = (1.0 - exp(-max(dist - 60.0, 0.0) * uK)) * uMax;',
      '  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); vec3 col = mix(c.rgb, vec3(l), f * 0.5);',
      '  gl_FragColor = vec4(mix(col, uCol, f), c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi : 1, 0, pass); HAZE.pass = pass;
}
function hazeFrame() {
  hazeSetup(); if (!HAZE.pass) return; const u = HAZE.pass.uniforms; HAZE.pass.enabled = AO.on && !HAZE.off;
  u.tDepth.value = AO.depth.depthTexture; u.uInvProj.value.copy(camera.projectionMatrixInverse);
  // the air takes the fog's colour (the time of day already sets it), lifted a little toward the sky
  u.uCol.value.copy(scene.fog.color); if (L.sky) u.uCol.value.lerp(L.sky, 0.25);
  const thick = Math.max(WX.fog || 0, (WX.wet || 0) * 0.6, (WX.snow || 0) * 0.8);
  u.uK.value = (1 / 650) * (1 + thick * 4); u.uMax.value = Math.min(0.8, 0.42 + thick * 0.35) * HAZE.k;
}
window.__FRAMES.push(() => { try { hazeFrame(); } catch (e) { if (!HAZE.err) { HAZE.err = e; console.warn('v438 air', e); } } });
