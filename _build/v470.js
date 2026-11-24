/* ================================================================
   v470 THE LOOK: THE BLADES FOLLOW THE MOWER (2026-11-24)
   The mown stripes (v443) were in the lawn's surface; the living blades of grass that grow round you (v170) did not
   know about them, so up close the stripes vanished under a uniform carpet. The blades now lean with the mower:
   in each stripe they are combed one way and the next stripe the other, and their tips catch the light or turn
   from it the same way the stripe does, so the pattern runs right up to your feet. ?mow=0 off.
   ================================================================ */
(function bladesMow() {
  if (!window.__LAWN || !LAWN.mesh || /mow=0/.test(location.search)) return;
  const m = LAWN.mesh.material, prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
  m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r);
    sh.vertexShader = sh.vertexShader.replace('vec2 side = vec2(-dir.y, dir.x);', 'float bS = mod(floor(wxz.x / 3.6), 2.0) * 2.0 - 1.0; dir = normalize(mix(dir, vec2(0.0, bS), 0.7)); vec2 side = vec2(-dir.y, dir.x);')
      .replace('* (0.75 + 0.5 * clump);', '* (0.75 + 0.5 * clump) * (1.0 + 0.16 * bS * sign(cameraPosition.z - wxz.y));');
  };
  m.customProgramCacheKey = () => (pk ? pk() : '') + '|mow470'; m.needsUpdate = true;
})();
