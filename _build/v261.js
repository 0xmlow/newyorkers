/* ================================================================
   v261 ILLUSION: THE WELL (2026-11-23)
   On the south spoke of the meme river, a round bronze rimmed opening in the paving, and below it the river keeps
   going down: a shaft of contour rings falling away forever toward a small Open Eye at the bottom that is always
   the same distance off however you lean over it. It is a flat disc. One shader traces a ray from your eye into a
   cylinder that is not there and paints what it would meet, so the parallax is exact from every angle.
   ?well=0 turns it off.
   ================================================================ */
const WELL = { t: 0 };
window.__WELL = WELL;
(function well() {
  if (!LOOK.on || /well=0/.test(location.search)) return;
  const X = 0, Z = -27.5, Y = 0.665 + 0.02, R = 1.3; WELL.P = [X, Y, Z];
  const fl = tex('assets/iv_flower.webp');
  const mat = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Vector3(X, Y, Z) }, uR: { value: R }, uT: { value: 0 }, uFl: { value: fl }, uNight: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uC; uniform float uR, uT, uNight; uniform sampler2D uFl; varying vec3 vW;
      void main(){ vec3 ro = vW, rd = normalize(vW - cameraPosition); vec2 o = ro.xz - uC.xz;
        // exit point through the cylinder wall below the disc
        float a = dot(rd.xz, rd.xz), b = 2.0 * dot(o, rd.xz), c = dot(o, o) - uR * uR; float disc = b * b - 4.0 * a * c;
        float t = (-b + sqrt(max(disc, 0.0))) / (2.0 * max(a, 1e-5)); vec3 hit = ro + rd * t; float depth = uC.y - hit.y;
        vec3 col; float ang = atan(hit.z - uC.z, hit.x - uC.x);
        float rings = fract(depth * 1.1 - uT * 0.35); float line = smoothstep(0.05, 0.0, abs(rings - 0.5) - 0.44);
        float band = floor(depth * 1.1 - uT * 0.35); float pick = fract(sin(band * 12.9898) * 43758.5453);
        vec3 lc = pick < 0.5 ? vec3(0.16, 0.38, 1.0) : pick < 0.8 ? vec3(0.03, 0.87, 1.0) : vec3(0.94, 0.91, 0.85);
        float wob = sin(ang * 6.0 + depth * 0.8 + uT) * 0.04; float fog = exp(-depth * 0.07);
        col = mix(vec3(0.02, 0.035, 0.1), lc, line * (0.9 + wob)) * fog;
        // the eye at the bottom: seen straight down the shaft
        vec2 down = o + rd.xz * (ro.y - (uC.y - 60.0)) / max(-rd.y, 1e-3); float rr = length(down) / uR;
        if (rd.y < 0.0 && length(down) < uR) { vec4 f = texture2D(uFl, down / (uR * 0.9) * 0.5 + 0.5); col = mix(col, f.rgb * (0.6 + 0.4 * uNight), f.a * (1.0 - fog) * 0.95); }
        col += lc * line * fog * uNight * 0.25;
        gl_FragColor = vec4(col, 1.0); }`, });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 64), mat); disc.rotation.x = -PI / 2; disc.position.set(X, Y, Z); disc.renderOrder = 4; disc.userData.__single = true; scene.add(disc); WELL.mat = mat;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.09, 12, 64), new THREE.MeshStandardMaterial({ color: 0x8a6a36, roughness: 0.3, metalness: 0.92 })); rim.rotation.x = -PI / 2; rim.position.set(X, Y + 0.02, Z); rim.castShadow = true; scene.add(rim);
  post(X, Z, R + 0.2, -5, Y + 2);
  WELL.ok = true;
})();
window.__FRAMES.push(dt => { try { if (!WELL.mat) return; WELL.t += dt; WELL.mat.uniforms.uT.value = WELL.t; WELL.mat.uniforms.uNight.value = Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
