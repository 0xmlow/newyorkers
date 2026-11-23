/* ================================================================
   v171 THE LOOK: LAMPLIGHT ON THE GROUND (2026-11-23)
   v112's pools were glowing decals laid on the ground, flat discs of colour. Now the lamps really light the
   ground: every walkable material (paving, grass, sand, the road, the pier boards, concrete, stone) computes the
   light of the forty odd lamps near it per pixel, warm sodium white falling off with distance like a real
   lamp, so the paving's own texture and relief light up under each lamp and fade into the dark between them.
   The halos round the bulbs stay; the old discs are dimmed to a faint glow on the bulb side.
   ================================================================ */
const LAMPL = { u: { uLamps: { value: [] }, uLampN: { value: 0 }, uLampK: { value: 0 }, uLampC: { value: new THREE.Color(1.0, 0.72, 0.42) } } };
window.__LAMPL = LAMPL;
(function lampLight() {
  if (!LOOK.on || !LAMP || !LAMP.pts) return; const pts = LAMP.pts.slice(0, 48); for (let i = 0; i < 48; i++) { const p = pts[i]; LAMPL.u.uLamps.value.push(p ? new THREE.Vector4(p[0], p[1], p[2], (p[3] || 6) * 1.25) : new THREE.Vector4(0, -999, 0, 1)); } LAMPL.u.uLampN.value = pts.length;
  const mats = [MAT.grass, MAT.sand, MAT.pave, MAT.conc, MAT.road, MAT.stone, MAT.terr, MAT.lime, MAT.wood].filter((m, i, a) => m && a.indexOf(m) === i);
  mats.forEach((m, mi) => { const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : 'k' + mi;
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); Object.assign(sh.uniforms, LAMPL.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLW;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 lw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nlw = instanceMatrix * lw;\n#endif\nvLW = (modelMatrix * lw).xyz; }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLW; uniform vec4 uLamps[48]; uniform float uLampN, uLampK; uniform vec3 uLampC;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          if (uLampK > 0.001) { float lsum = 0.0; for (int i = 0; i < 48; i++) { if (float(i) >= uLampN) break; vec4 Lp = uLamps[i]; vec3 dv = Lp.xyz - vLW; float d2 = dot(dv, dv); float r2 = Lp.w * Lp.w; if (d2 < r2) { float a = 1.0 - d2 / r2; lsum += a * a * (2.2 / (1.0 + d2 * 0.18)); } }
            totalEmissiveRadiance += diffuseColor.rgb * uLampC * lsum * uLampK; }`);
    };
    m.customProgramCacheKey = () => prevKey + '-lampl171'; m.needsUpdate = true; });
})();
function lamplFrame(dt) { if (!LAMPL.u.uLampN.value) return; const k = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.15) * 1.4)); LAMPL.u.uLampK.value = k * 1.15; try { if (LAMP.pools) LAMP.pools.material.opacity = 0.12 * k; } catch (e) { } }
window.__FRAMES.push(dt => { try { lamplFrame(dt); } catch (e) { if (!LAMPL.err) { LAMPL.err = e; console.warn('v171 lamplight', e); } } });
