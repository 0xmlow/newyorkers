/* ================================================================
   v460 THE DRONE SHOW IN THE WATER (2026-11-24)
   The harbour mirrors the show: every drone gets a reflection in the water below it, pulled into a short
   wavering streak by the swell and dimmer than the drone, so each picture hangs over a rippling copy of itself.
   A second draw of the same points, folded under the surface in the vertex shader. ?dronelook=0 off.
   ================================================================ */
(function droneMirror() {
  if (!window.__DRONES || !DRONES.pts || /dronelook=0/.test(location.search)) return;
  const g = DRONES.pts.geometry, geo = new THREE.BufferGeometry(); geo.setAttribute('position', g.attributes.position); geo.setAttribute('color', g.attributes.color);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexColors: true, uniforms: { uPx: { value: 1 }, uK: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'uniform float uPx, uT; varying vec3 vC; varying float vA; void main(){ vC = color; vec3 p = position; float h = p.y; p.y = -h + 0.15; p.x += sin(uT * 1.7 + h * 0.31 + p.z * 0.2) * (0.5 + h * 0.015); vA = smoothstep(2.0, 10.0, h); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(3.2 * uPx / -mv.z, 2.0, 40.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uK; varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; d.y *= 0.3; float r = length(d) * 2.0; float a = smoothstep(1.0, 0.0, r) * uK * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a * 0.4, 1.0); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; scene.add(pts); DRONES.mir = pts;
})();
window.__FRAMES.push(dt => { try { if (!DRONES.mir) return; DRONES.mir.visible = DRONES.pts.visible; const u = DRONES.mir.material.uniforms; u.uT.value += dt; u.uPx.value = renderer.getDrawingBufferSize(_dpx).y / (2 * Math.tan(camera.fov * PI / 360)); u.uK.value = 0.4 + 0.6 * Math.min(1, (L.lamps || 0) * 1.2); } catch (e) { } });
