/* ================================================================
   v36 IMPERMANENT VISION, SECOND PASS (2026-11-22)
   - POOLS: where the drips land, paint pools on the ground, marbled cobalt, cyan, hot pink and bone, glossy and wet,
     with contour rings in it. Under the bodega door, the toll, the subway, N3W Square, THE CUT and the lighthouse.
   - THE OBSERVER: a solitary dark figure on the north rocks past the lighthouse, back to the island, looking at the
     Witness. He never turns round. E near him and you get one line.
   - SKY VEINS: after dark, faint electric contour rivers run across the sky behind the Witness, cobalt and violet
     with a single copper thread, slowly moving. The night is cut open a little.
   ================================================================ */
const IV2 = { pools: [], veins: null };
window.__IV2 = IV2;
function poolTexture(seed) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'); if (!c || !c.beginPath) return new THREE.CanvasTexture(cv);
  const rnd = (k) => { const x = Math.sin(seed * 91.7 + k * 13.1) * 43758.5; return x - Math.floor(x); };
  c.clearRect(0, 0, 512, 512); c.save(); c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 200 * (0.72 + 0.2 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 7 + seed * 2) + 0.06 * rnd(i)); const x = 256 + Math.cos(a) * r, y = 256 + Math.sin(a) * r * 0.86; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.clip();
  c.fillStyle = '#0a1230'; c.fillRect(0, 0, 512, 512);
  const cols = ['#2962ff', '#08deff', '#ff4fa0', '#efe8da', '#2962ff', '#7a3cff'];
  for (let i = 0; i < 46; i++) { c.strokeStyle = cols[i % cols.length]; c.globalAlpha = i % 5 === 0 ? 0.95 : 0.55; c.lineWidth = i % 5 === 0 ? 5 : 2.2; c.beginPath(); const r0 = 12 + i * 5.2;
    for (let k = 0; k <= 64; k++) { const a = k / 64 * Math.PI * 2, rr = r0 * (1 + 0.18 * Math.sin(a * 3 + i * 0.3 + seed) + 0.08 * Math.sin(a * 9 + seed)); const x = 256 + Math.cos(a) * rr, y = 256 + Math.sin(a) * rr * 0.86; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  c.restore(); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t;
}
(function pools() {
  const spots = [[11.0, 61.5, 1.6], [11.0, 70.5, 1.4], [-7.6, 96.3, 1.2], [7.6, 105.8, 1.3], [81, 15.8, 2.2], [25.4, 27.2, 1.1], [-41.2, -67.6, 2.0], [0, -120.9, 1.4]];
  const meshes = []; scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.geometry) meshes.push(o); }); const rc = new THREE.Raycaster();
  const surf = (x, z) => { try { rc.set(new THREE.Vector3(x, 12, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(meshes, false).find(i => i.point.y < 2.2 && i.face && i.face.normal.y > 0.5); if (h) return h.point.y; } catch (e) { } return Math.max(ground(x, z), floorAt(x, z, 3).f || 0); };
  spots.forEach(([x, z, s], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 2, s * 2), new THREE.MeshStandardMaterial({ map: poolTexture(i + 1), transparent: true, alphaTest: 0.05, roughness: 0.06, metalness: 0.1, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -3, depthWrite: false }));
    m.material.emissiveMap = m.material.map; m.rotation.x = -PI / 2; m.rotation.z = i * 1.3; m.position.set(x, surf(x, z) + 0.015, z); m.renderOrder = 2; scene.add(m); IV2.pools.push(m); });
})();
(function observer() {
  const x = 0.5, z = -137.5, g0 = Math.max(ground(x, z), floorAt(x, z, 8).f || 0); const P0 = person(0x0b0c10, 0x0b0c10, 0x16171c, 'writer'); P0.g.position.set(x, g0, z); P0.g.rotation.y = PI; IV2.obs = P0; IV2.obsY = g0;
  const sm = new THREE.MeshStandardMaterial({ color: 0x0c0d12, roughness: 0.9, metalness: 0 }); IV2.obsMat = sm;
  interact(x, z, 3, 'E · STAND BESIDE HIM', secret('observer', () => { toast('HE HAS BEEN WATCHING IT LONGER THAN YOU HAVE. HE DOES NOT LOOK AWAY.'); }));
})();
(function veins() {
  const geo = new THREE.SphereGeometry(900, 48, 24, PI * 0.15, PI * 0.7, PI * 0.12, PI * 0.36);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false, uniforms: { uT: IV.time, uN: IV.night },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uN; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y), mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ vec3 d = normalize(vP); vec3 q = d * 3.2 + vec3(uT * 0.004, 0.0, uT * 0.002); float f = n(q) * 0.6 + n(q * 2.1) * 0.3 + n(q * 4.3) * 0.1; f *= 7.0;
        float l = 1.0 - smoothstep(0.0, 0.06, min(fract(f), 1.0 - fract(f))); float idx = floor(f);
        vec3 c = mix(vec3(0.16, 0.38, 1.0), vec3(0.48, 0.24, 1.0), n(d * 9.0)); if (mod(idx, 7.0) < 0.5) c = vec3(0.85, 0.5, 0.3);
        float mask = smoothstep(0.0, 0.25, d.y) * (1.0 - smoothstep(0.6, 0.95, d.y)) * smoothstep(0.35, 0.65, n(d * 2.0 + 1.7));
        gl_FragColor = vec4(c * l * mask * uN * 0.55, 1.0); }` });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = -9; m.frustumCulled = false; m.rotation.y = PI; scene.add(m); IV2.veins = m;
})();
window.__FRAMES.push(dt => { try {
  const n = IV.night.value; IV2.pools.forEach((p, i) => p.material.emissiveIntensity = 0.05 + 0.55 * n * (0.8 + 0.2 * Math.sin(IV.time.value * 0.7 + i)));
  IV2.veins.visible = n > 0.05;
  if (IV2.obs && !IV2.obsDone && IV2.obs.g.userData.slot && IV2.obs.g.userData.slot.children.length) { IV2.obsDone = true; IV2.obs.g.userData.slot.traverse(o => { if (o.isMesh) o.material = IV2.obsMat; }); }
} catch (e) { if (!IV2.err) { IV2.err = e; console.warn('v36 iv2', e); } } });
