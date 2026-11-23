/* ================================================================
   v189 THE LOOK: SHRUBS (2026-11-23)
   The shrubs along the promenade were twenty sided dice. Every one is now a lumpy, irregular mound of foliage,
   darker and cooler deep inside and at the foot, lighter where the top catches the sky, each a little different
   in colour. Same plants, same places. ?shrubs=0 off.
   ================================================================ */
const SHRUB = { n: 0 };
window.__SHRUB = SHRUB;
(function shrubs() {
  if (!LOOK.on || /shrubs=0/.test(location.search) || !MAT.shrub) return;
  const geo = new THREE.IcosahedronGeometry(0.7, 3), p = geo.attributes.position, v = new V3(), col = new Float32Array(p.count * 3);
  const h3 = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, y, z) => Math.sin(x * 3.1 + z * 1.7) * 0.5 + Math.sin(y * 4.3 + x * 2.2) * 0.3 + Math.sin(z * 5.9 - y * 3.3) * 0.2;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); let r = 0.7 * (1 + 0.16 * noise(n.x * 2, n.y * 2, n.z * 2) + 0.08 * (h3(n.x, n.y, n.z) - 0.5));
    v.copy(n).multiplyScalar(r); if (v.y < -0.32) v.y = -0.32 - (v.y + 0.32) * 0.1; p.setXYZ(i, v.x, v.y, v.z);
    const up = (n.y + 1) / 2, k = 0.45 + 0.6 * up * (0.85 + 0.3 * h3(n.z, n.x, n.y)); col[i * 3] = k * 0.92; col[i * 3 + 1] = k; col[i * 3 + 2] = k * 0.8; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const mat = MAT.shrub.clone(); mat.vertexColors = true; mat.flatShading = false; if (mat.color) mat.color.multiplyScalar(1.15);
  scene.traverse(o => { if (o.isInstancedMesh && o.material === MAT.shrub && o.geometry && o.geometry.type === 'IcosahedronGeometry' && o.geometry.parameters.detail === 0) { o.geometry = geo; o.material = mat; SHRUB.n += o.count; } });
})();
