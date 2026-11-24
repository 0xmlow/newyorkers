/* ================================================================
   v312 ILLUSION: THE LILAC CHASER, IN HOT PINK (2026-11-24)
   A round navy board on the east lawn: twelve soft hot pink dots round a small cross, one dot vanishing at a time,
   going round. Stare at the cross for twenty seconds and the pink dots fade away, and a green dot that is not there
   runs round the circle instead (Jeremy Hinton's illusion, 2005; afterimage plus Troxler fading). ?chaser=0 off.
   ================================================================ */
const CHASE = { t: 0 };
window.__CHASE = CHASE;
(function chaser() {
  if (!LOOK.on || /chaser=0/.test(location.search)) return; const X = 24.5, Z = 3.6, g = ground(X, Z);
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv; void main(){ vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard; vec3 col = vec3(0.62, 0.63, 0.66);
      int off = int(mod(floor(uT * 8.3), 12.0)); for (int i = 0; i < 12; i++) { if (i == off) continue; float a = float(i) / 12.0 * 6.2831853; vec2 c = vec2(cos(a), sin(a)) * 0.62; float d = length(p - c); col = mix(col, vec3(1.0, 0.25, 0.64), exp(-d * d * 60.0) * 0.85); }
      float cr = step(abs(p.x), 0.012) * step(abs(p.y), 0.07) + step(abs(p.y), 0.012) * step(abs(p.x), 0.07); col = mix(col, vec3(0.05), clamp(cr, 0.0, 1.0)); if (r > 0.96) col = vec3(0.07, 0.13, 0.25);
      gl_FragColor = vec4(col, 1.0); }` });
  const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64), mat); m.position.set(X, g + 2.3, Z); m.rotation.y = PI; scene.add(m); CHASE.mat = mat;
  facPut('iron', X, g + 0.9, Z + 0.05, 0.1, 1.8, 0.1, 0); facFlush(); post(X, Z, 0.2, -5, 2);
  CHASE.ok = true; CHASE.P = [X, g, Z];
})();
window.__FRAMES.push(dt => { try { if (!CHASE.mat) return; CHASE.t += dt; CHASE.mat.uniforms.uT.value = CHASE.t; } catch (e) { } });
