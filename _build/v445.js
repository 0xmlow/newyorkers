/* ================================================================
   v445 THE LOOK: THE CITY GLOW (2026-11-24)
   New York never has a dark sky. After dusk the horizon behind the painted skyline now carries the city's glow:
   a broad sodium orange and pink haze rising off Manhattan to the south and the north, strongest right over the
   towers and fading up into the night blue, brighter under low cloud (which the city lights from below) and
   softer on a clear night. Painted sky untouched; the glow sits in front of it as light. ?cityglow=0 off.
   ================================================================ */
const CGLOW = {};
window.__CGLOW = CGLOW;
(function cityGlow() {
  if (!LOOK.on || /cityglow=0/.test(location.search)) return;
  const geo = new THREE.CylinderGeometry(1050, 1050, 260, 96, 1, true);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false,
    uniforms: { uK: { value: 0 }, uCol: { value: new THREE.Color(1.0, 0.55, 0.28) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uK; uniform vec3 uCol; varying vec3 vP; void main(){ float h = (vP.y + 130.0) / 260.0; float a = atan(vP.x, vP.z);' +
      ' float city = pow(abs(cos(a)), 3.0) * (0.75 + 0.25 * sin(a * 9.0)) + 0.12;' +
      ' float v = smoothstep(0.0, 0.18, h) * (1.0 - smoothstep(0.12, 0.62, h)); vec3 c = mix(uCol, vec3(0.9, 0.45, 0.6), smoothstep(0.25, 0.8, h));' +
      ' gl_FragColor = vec4(c * v * city * uK, 1.0); }' });
  const m = new THREE.Mesh(geo, mat); m.position.y = 90; m.renderOrder = 6; m.frustumCulled = false; scene.add(m); CGLOW.m = m; CGLOW.mat = mat;
})();
window.__FRAMES.push(() => { try { if (!CGLOW.m) return; const W = WX.override || WX.cur, cloud = W === 'CLEAR' ? 0.65 : W === 'SCATTERED' ? 0.85 : 1.15;
  const k = Math.min(1, (L.lamps || 0) * 1.2) * 0.85 * cloud; CGLOW.mat.uniforms.uK.value = k; CGLOW.m.visible = k > 0.005; CGLOW.m.position.x = camera.position.x; CGLOW.m.position.z = camera.position.z; } catch (e) { } });
