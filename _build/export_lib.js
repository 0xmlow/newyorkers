/* Bake the live island into one exportable scene: world transforms applied, instances expanded,
   the card shader's per-instance UVs written into real UVs, the sky as a textured cylinder.
   Then GLTFExporter writes one self-contained binary glTF and POSTs it raw to the local sink. */
window.__exportGLB = async function (sinkUrl) {
  const g = window.__game, S = g.scene; S.updateMatrixWorld(true);
  const out = new THREE.Scene(); out.name = 'MEME ISLAND by MLow';
  const matCache = new Map(), stats = { meshes: 0, instanced: 0, instances: 0, skipped: 0, tris: 0 };
  const visible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  function exportMat(m, vcol) {
    const key = m.uuid + (vcol ? 'v' : ''); if (matCache.has(key)) return matCache.get(key);
    let r;
    if (m.isShaderMaterial) r = new THREE.MeshBasicMaterial({ map: m.uniforms && m.uniforms.t0 ? m.uniforms.t0.value : null, side: THREE.DoubleSide });
    else { r = m.clone(); r.onBeforeCompile = function () { }; if (r.isMeshBasicMaterial && r.map && r.map.image && !r.map.image.getContext && r.map.image.width >= 4000) { } }
    if (vcol) r.vertexColors = true; r.name = m.name || r.type; matCache.set(key, r); return r;
  }
  function merge(parts) { // parts: [{geo (non indexed or indexed), m4}]
    let nv = 0, ni = 0; parts.forEach(p => { nv += p.geo.attributes.position.count; ni += p.geo.index ? p.geo.index.count : p.geo.attributes.position.count; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = parts[0].col ? new Float32Array(nv * 3) : null, idx = new Uint32Array(ni);
    let vo = 0, io = 0; const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    parts.forEach(p => {
      const G = p.geo, P = G.attributes.position, N = G.attributes.normal, U = G.attributes.uv, c = P.count; nm.getNormalMatrix(p.m4);
      for (let i = 0; i < c; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(p.m4); pos.set([v.x, v.y, v.z], (vo + i) * 3);
        if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], (vo + i) * 3); }
        if (p.uvr) { const ux = U.getX(i), uy = U.getY(i); uv[(vo + i) * 2] = p.uvr[0] + (p.uvr[2] - p.uvr[0]) * ux; uv[(vo + i) * 2 + 1] = p.uvr[1] + (p.uvr[3] - p.uvr[1]) * uy; }
        else if (U) { uv[(vo + i) * 2] = U.getX(i); uv[(vo + i) * 2 + 1] = U.getY(i); }
        if (col) col.set([p.col.r, p.col.g, p.col.b], (vo + i) * 3);
      }
      if (G.index) for (let i = 0; i < G.index.count; i++) idx[io + i] = G.index.getX(i) + vo; else for (let i = 0; i < c; i++) idx[io + i] = vo + i;
      vo += c; io += G.index ? G.index.count : c;
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); return geo;
  }
  const im4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(), cc = new THREE.Color();
  S.traverse(o => {
    if (!o.isMesh || !visible(o)) { if (o.isPoints || o.isLine || o.isSprite) stats.skipped++; return; }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some(m => m.blending === THREE.AdditiveBlending || m.visible === false)) { stats.skipped++; return; }
    // the sky photographs and the 2.6 km sea are the page's backdrop, not the island: viewers bring their own sky
    if (mats.some(m => m.isShaderMaterial || (m.fog === false && m.depthWrite === false)) || (o.geometry.parameters && o.geometry.parameters.width === 2600)) { stats.skipped++; return; }
    if (o.isInstancedMesh) {
      const parts = [], uvr = o.geometry.attributes.uvr;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, im4); if (Math.abs(im4.determinant()) < 1e-9) continue; w4.multiplyMatrices(o.matrixWorld, im4);
        const part = { geo: o.geometry, m4: w4.clone() }; if (uvr) part.uvr = [uvr.getX(i), uvr.getY(i), uvr.getZ(i), uvr.getW(i)];
        if (o.instanceColor) { o.getColorAt(i, cc); part.col = cc.clone(); } parts.push(part);
      }
      if (!parts.length) return; const CH = 6000; // chunk so no single mesh gets enormous
      for (let s = 0; s < parts.length; s += CH) { const mm = new THREE.Mesh(merge(parts.slice(s, s + CH)), exportMat(mats[0], !!o.instanceColor)); mm.name = (o.name || 'instances') + '_' + s; out.add(mm); }
      stats.instanced++; stats.instances += parts.length; return;
    }
    const src = o.geometry, geo = new THREE.BufferGeometry(); // plain float attributes: the r128 exporter rejects quantized and interleaved ones
    for (const k in src.attributes) { if (k === 'uvr') continue; const A = src.attributes[k], n = A.count, sz = A.itemSize, f = new Float32Array(n * sz), get = ['getX', 'getY', 'getZ', 'getW'];
      const arr = A.isInterleavedBufferAttribute ? A.data.array : A.array, div = !A.normalized ? 1 : arr instanceof Int8Array ? 127 : arr instanceof Uint8Array ? 255 : arr instanceof Int16Array ? 32767 : arr instanceof Uint16Array ? 65535 : 1; // r128 getX does not denormalize
      for (let i = 0; i < n; i++) for (let c = 0; c < sz; c++) { const v = A[get[c]](i) / div; f[i * sz + c] = div === 1 ? v : Math.max(-1, v); } geo.setAttribute(k, new THREE.BufferAttribute(f, sz)); }
    if (src.index) geo.setIndex(new THREE.BufferAttribute(Uint32Array.from(src.index.array), 1)); src.groups.forEach(gr => geo.addGroup(gr.start, gr.count, gr.materialIndex));
    geo.applyMatrix4(o.matrixWorld); if (o.userData.exportLift) geo.translate(0, o.userData.exportLift, 0); // thin layers z-fight at viewer distances ['uvr'].forEach(a => geo.deleteAttribute && geo.attributes[a] && geo.deleteAttribute(a));
    const mm = new THREE.Mesh(geo, Array.isArray(o.material) ? mats.map(m => exportMat(m)) : exportMat(o.material)); mm.name = o.name || o.geometry.type; out.add(mm); stats.meshes++;
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(330, 128), new THREE.MeshStandardMaterial({ color: 0x1b8fa6, roughness: 0.15, metalness: 0.1, name: 'harbour water' }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.02; water.name = 'harbour water'; out.add(water);
  out.traverse(o => { if (o.isMesh) stats.tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  // opaque photographic textures go out as JPEG instead of PNG
  matCache.forEach(m => ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach(k => { const t = m[k]; if (t && t.image && !(t.image instanceof HTMLCanvasElement) && !m.transparent && !m.alphaTest) t.format = THREE.RGBFormat; }));
  const exporter = new THREE.GLTFExporter();
  const glb = await new Promise((res, rej) => exporter.parse(out, res, { binary: true, maxTextureSize: 4096, onlyVisible: true, embedImages: true }));
  const r = await fetch(sinkUrl, { method: 'POST', body: new Blob([glb], { type: 'application/octet-stream' }) });
  return Object.assign(stats, { bytes: glb.byteLength, status: r.status, tris: Math.round(stats.tris) });
};
