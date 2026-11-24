/* ================================================================
   v323 FRAME RATE: THE SMALLEST THINGS GO FIRST (2026-11-24)
   v260's distance rule gave every prop at least 45 m. Fruit, bottles, bowls, cans and stools are under half a
   metre: they now switch off beyond 28 m, the size of a crate beyond 40 m, everything else as before.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__PH || !PCULL) return; if ((PCULL.t2 = (PCULL.t2 || 0) + 1) % 15) return; const cp = camera.position;
  PH.ims.forEach(im => { const s = im.geometry.boundingSphere; if (!s || !im.userData.__sz) { if (!im.userData.__sz) { im.geometry.computeBoundingBox && !im.geometry.boundingBox && im.geometry.computeBoundingBox(); const b = im.geometry.boundingBox; im.userData.__sz = b ? Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) : 1; } return; }
    const sz = im.userData.__sz; if (sz > 0.9) return; const far = sz < 0.5 ? 28 : 40; if (s.center.distanceTo(cp) - s.radius > far) im.visible = false; }); } catch (e) { } });
