/* ================================================================
   v187 THE LOOK: THE PIER (2026-11-23)
   The pier deck was one dark slab. It is now boards: a seam every eighteen centimetres, each board its own shade,
   nail heads where the boards cross the joists, darker along the seams where the water sits. Cast iron bollards
   stand along both edges, and three life rings hang on posts. ?pier=0 off.
   ================================================================ */
const PIER2 = {};
window.__PIER2 = PIER2;
(function pier() {
  if (!LOOK.on || /pier=0/.test(location.search)) return;
  const m = MAT.wood; if (m) { const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPW; varying float vPU;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 pw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\npw = instanceMatrix * pw;\n#endif\nvPW = (modelMatrix * pw).xyz; vPU = normalize(mat3(modelMatrix) * objectNormal).y; }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPW; varying float vPU; float pwH(float x){ return fract(sin(x * 91.7) * 43758.5); }').replace('#include <color_fragment>', `#include <color_fragment>
        if (vPU > 0.9 && abs(vPW.x) < 3.05 && vPW.z > 125.5 && vPW.z < 182.5 && vPW.y > 0.45 && vPW.y < 0.65) { float b = vPW.z / 0.18, bi = floor(b), f = fract(b);
          diffuseColor.rgb *= 0.82 + 0.3 * pwH(bi); float seam = 1.0 - smoothstep(0.0, 0.06, min(f, 1.0 - f)); diffuseColor.rgb *= 1.0 - 0.6 * seam;
          float jx = mod(vPW.x + 3.0, 1.5); float nail = (1.0 - smoothstep(0.012, 0.022, length(vec2(jx - 0.75, (f - 0.5) * 0.18)))); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.07, 0.06), nail * 0.8); }`); };
    m.customProgramCacheKey = () => pk + '-pier187'; m.needsUpdate = true; }
  const iron = new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.5, metalness: 0.6 }), orange = new THREE.MeshStandardMaterial({ color: 0xff6b00, roughness: 0.55 }), white = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6 });
  const bol = new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.16, 0.06], [0.12, 0.1], [0.12, 0.42], [0.18, 0.5], [0.16, 0.58], [0, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
  const pts = []; for (let z = 131; z <= 180; z += 7) [-2.8, 2.8].forEach(x => pts.push([x, z])); const bi = new THREE.InstancedMesh(bol, iron, pts.length), m4 = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { m4.makeTranslation(x, 0.55, z); bi.setMatrixAt(i, m4); if (typeof post === 'function') post(x, z, 0.18); }); bi.castShadow = true; scene.add(bi);
  [[2.75, 142], [-2.75, 158], [2.75, 172]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 8), iron); p.position.set(x, 1.2, z); scene.add(p);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.075, 10, 24), orange); ring.position.set(x - Math.sign(x) * 0.09, 1.55, z); ring.rotation.y = PI / 2; ring.castShadow = true; scene.add(ring);
    for (let k = 0; k < 4; k++) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.078, 6, 4, 0.22), white); band.position.copy(ring.position); band.rotation.set(0, PI / 2, k * PI / 2 + 0.67); scene.add(band); } });
  PIER2.n = pts.length;
})();
