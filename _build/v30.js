/* ================================================================
   v30 PHOTOREAL PASS (2026-11-22)
   What still read as CG after v5 to v29 was the perfectly clean paint: the white, ink, orange, blue, graphite,
   steel and bone materials were one flat value from top to bottom. Real paint is never that.
   - GRIME: a world space breakup chained into those materials: low frequency albedo drift (sun bleaching), streaks
     that run down from the tops of surfaces, a darker splash band where things meet the ground, and roughness that
     varies across the surface so reflections break up instead of sliding like plastic.
   - LIGHT: the sun's shadow map goes to 4096 on desktops (the edges were soft mush at 2048 over the 4 m grid).
   - GRADE: saturation down to 0.97 (the old 1.1 was a game's), a touch more S curve, grain a hair heavier.
   Source art, cards, signs and the Impermanent Vision paint are untouched (the grime skips anything unlit).
   ================================================================ */
const PR = { mats: [] };
window.__PR = PR;
const PR_GLSL = `varying vec3 vPrW;
float prH(vec3 p){ return fract(sin(dot(p, vec3(91.7, 247.3, 17.9))) * 31758.5453); }
float prN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(prH(i), prH(i + vec3(1,0,0)), f.x), mix(prH(i + vec3(0,1,0)), prH(i + vec3(1,1,0)), f.x), f.y), mix(mix(prH(i + vec3(0,0,1)), prH(i + vec3(1,0,1)), f.x), mix(prH(i + vec3(0,1,1)), prH(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
function prChain(m, amt) {
  if (!m || m.userData.pr) return; m.userData.pr = true; amt = amt || 1; const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
  m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); sh.uniforms.uPrA = { value: amt };
    if (sh.vertexShader.indexOf('vPrW') < 0) sh.vertexShader = 'varying vec3 vPrW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 prw = vec4(transformed, 1.0);\n #ifdef USE_INSTANCING\n prw = instanceMatrix * prw;\n #endif\n vPrW = (modelMatrix * prw).xyz;');
    sh.fragmentShader = PR_GLSL + 'uniform float uPrA;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
 { float big = prN(vPrW * 0.18), mid = prN(vPrW * 0.9 + 3.1), fine = prN(vPrW * 7.0);
   float streak = prN(vec3(vPrW.x * 2.2, vPrW.y * 0.12, vPrW.z * 2.2)); float splash = 1.0 - smoothstep(0.6, 1.5, vPrW.y);
   float g = (big - 0.5) * 0.10 + (mid - 0.5) * 0.06 + (fine - 0.5) * 0.04 - smoothstep(0.55, 0.9, streak) * 0.07 - splash * (0.10 + 0.08 * mid);
   diffuseColor.rgb *= 1.0 + g * uPrA; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.93, 0.9, 0.84), splash * 0.35 * uPrA); }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
 roughnessFactor = clamp(roughnessFactor + (prN(vPrW * 1.7) - 0.5) * 0.22 * uPrA + (1.0 - smoothstep(0.6, 1.5, vPrW.y)) * 0.12 * uPrA, 0.04, 1.0);`);
  };
  m.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|pr'; m.needsUpdate = true; PR.mats.push(m);
}
['white', 'ink', 'orange', 'blue', 'graphite', 'steel', 'bone', 'gold', 'trunk', 'wood', 'pave', 'asphalt'].forEach(k => { const m = MAT[k]; if (m && m.isMeshStandardMaterial) prChain(m, k === 'gold' || k === 'steel' ? 0.6 : 1); });
[ARCH.steel, ARCH.shutter].forEach(m => prChain(m, 0.8));
// the cast crowd materials and the v8 to v26 painted hulls, trucks and trains are left as they are: their own textures or vertex colours carry the detail

/* sharper sun shadows on desktops */
try { if (!isMobile && sun && sun.shadow && sun.shadow.mapSize.x < 4096) { sun.shadow.mapSize.set(4096, 4096); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.02; } } catch (e) { }

/* a more filmic grade, applied once the post chain exists */
function prGrade() { try { if (!POST || !POST.grade || PR.graded) return; const u = POST.grade.uniforms; u.uSat.value = 0.97; u.uCurve.value = 0.3; u.uGrain.value = 0.02; u.uVig.value = 0.34; PR.graded = true; } catch (e) { } }
/* aerial perspective: real air hazes distance, so the El, the tower and the skyline get their scale back. Lighter at night. */
window.__FRAMES.push(dt => { prGrade(); const n = Math.min(1, (L.lamps || 0) * 1.3); window.__FOGN = 0.42 + 0.4 * n; window.__FOGF = 0.62 + 0.3 * n; });
