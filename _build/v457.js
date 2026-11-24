/* ================================================================
   v457 THE DRONE SHOW, RELIT (2026-11-24)
   The v42 show (six hundred drones on the hour after dark) drew every drone as a flat sprite of one fixed size, so
   near drones and far drones looked the same and the pictures read as dots on glass. Each drone is now a point of
   light with a hot core and a soft halo, sized by its real distance (the near edge of a picture is bigger than the
   far one), brighter as the night gets darker, so the bloom pass turns the swarm into a glowing picture in the
   sky and its depth shows when it pours from one picture to the next. ?dronelook=0 off.
   ================================================================ */
(function droneRelight() {
  if (!window.__DRONES || !DRONES.pts || /dronelook=0/.test(location.search)) return;
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexColors: true, uniforms: { uPx: { value: 1 }, uK: { value: 1 } },
    vertexShader: 'uniform float uPx; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(2.6 * uPx / -mv.z, 2.0, 40.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uK; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float core = smoothstep(0.32, 0.0, r), halo = smoothstep(1.0, 0.0, r); float a = (core * 1.05 + halo * halo * 0.4) * uK; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, 1.0); }' });
  DRONES.pts.material = mat; DRONES.relit = mat;
})();
window.__FRAMES.push(() => { try { if (!DRONES.relit || !DRONES.pts.visible) return; const u = DRONES.relit.uniforms; u.uPx.value = renderer.getDrawingBufferSize(_dpx).y / (2 * Math.tan(camera.fov * PI / 360)); u.uK.value = 0.55 + 0.75 * Math.min(1, (L.lamps || 0) * 1.2); } catch (e) { } });
const _dpx = new THREE.Vector2();
