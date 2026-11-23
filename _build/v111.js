/* ================================================================
   v111 SHARPER SHADOWS (2026-11-23)
   The sun's shadow map used to be a 110 metre box centred on your feet, so half of it was always behind you. It now
   sits twenty metres ahead of where you look and is tighter (84 m on a computer, 4096 px), so the shadows you can see
   are about twice as crisp: railings, chair legs, the dogs' legs, the leaves. Softer penumbra, less acne. Phones keep
   the old box. Everything new on the island (the CC0 animals and cars, the market, the walk up, the threshold)
   casts and receives.
   ================================================================ */
(function shadows() {
  if (isMobile || !sun || !sun.shadow) return; window.__SHADOW_AHEAD = 20;
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42 }); sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; if ('radius' in sun.shadow) sun.shadow.radius = 2.5;
  // cast from the bigger new pieces too
  setTimeout(() => { try { scene.traverse(o => { if (!o.isMesh || o.castShadow || o.isInstancedMesh || !o.geometry || (o.material && (o.material.transparent || o.material.isShaderMaterial || o.material.isMeshBasicMaterial))) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z); if (r > 0.5 && r < 9) o.castShadow = true; }); } catch (e) { } }, 4000);
})();
