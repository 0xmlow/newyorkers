/* ================================================================
   v172 THE LOOK: WEATHERING (2026-11-23)
   Up close most of the island's buildings and props were single flat colours: market stalls, plinths, the walk
   up's shadow side, kiosks, sculpture bases. Nothing real is one colour. Every large object's material (anything
   used on a mesh bigger than two metres, people and animals excluded) now weathers in the shader, in world
   space so it is continuous across faces and never repeats:
   - a slow tonal mottle and a fine grain in colour and in roughness, so light breaks up across a surface;
   - grime rising from the ground: the bottom metre darkens and cools, heaviest at the very base, uneven;
   - rain streaks: on tall vertical walls, thin darker runs falling from the top, varying in length;
   - a faint sun bleach on surfaces that face the sky.
   It runs again as late props load. ?weather=0 turns it off.
   ================================================================ */
const WEATH = { done: new Set(), t: 0, runs: 0, n: 0 };
window.__WEATH = WEATH;
const WEATH_GLSL = `
  float wh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float wn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(wh(i), wh(i + vec3(1,0,0)), f.x), mix(wh(i + vec3(0,1,0)), wh(i + vec3(1,1,0)), f.x), f.y), mix(mix(wh(i + vec3(0,0,1)), wh(i + vec3(1,0,1)), f.x), mix(wh(i + vec3(0,1,1)), wh(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
function weathMat(m) {
  if (WEATH.done.has(m)) return; WEATH.done.add(m); WEATH.n++; const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWW; varying vec3 vWN;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 ww = vec4(transformed, 1.0); vec3 wn0 = objectNormal;\n#ifdef USE_INSTANCING\nww = instanceMatrix * ww; wn0 = mat3(instanceMatrix) * wn0;\n#endif\nvWW = (modelMatrix * ww).xyz; vWN = normalize(mat3(modelMatrix) * wn0); }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWW; varying vec3 vWN;' + WEATH_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float wm = wn(vWW * 0.35) * 0.55 + wn(vWW * 1.7) * 0.3 + wn(vWW * 7.0) * 0.15; float wup = clamp(vWN.y, 0.0, 1.0), wvert = 1.0 - abs(vWN.y);
        diffuseColor.rgb *= 0.8 + 0.4 * wm;
        float wy = vWW.y - 0.58; float grime = (1.0 - smoothstep(0.0, 1.5 + 0.6 * wm, wy)) * (0.6 + 0.4 * wn(vWW * 3.1)) * step(-0.5, wy);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.48, 0.45), grime * 0.78 * (1.0 - wup * 0.7));
        float along = dot(vWW.xz, normalize(vec2(-vWN.z, vWN.x) + 1e-4)); float col = wn(vec3(along * 3.0, 0.0, 0.0));
        float streak = step(0.62, col) * wvert * smoothstep(2.5, 4.0, wy) * (0.5 + 0.5 * wn(vec3(along * 9.0, vWW.y * 0.4, 0.0)));
        diffuseColor.rgb *= 1.0 - 0.24 * streak;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.08 + 0.02, wup * 0.25 * smoothstep(0.4, 0.9, wm));`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.82 + 0.36 * wm) + grime * 0.1, 0.04, 1.0);');
  };
  m.customProgramCacheKey = () => prevKey + '-weath172'; m.needsUpdate = true;
}
const _wb = new THREE.Box3(), _ws = new THREE.Vector3();
function weathScan() {
  const big = new Set(), small = new Set(), skip = new Set([MAT.water, MAT.grass, MAT.sand, MAT.pave, MAT.road, MAT.pool, MAT.glass, MAT.crystal, MAT.gold, MAT.steel, MAT.metal, MAT.leaf, MAT.brain].filter(Boolean));
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || !o.geometry) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _wb.copy(o.geometry.boundingBox); const s = _wb.getSize(_ws); const sc = o.getWorldScale(new THREE.Vector3()); const sz = Math.max(s.x * sc.x, s.y * sc.y, s.z * sc.z) * (o.isInstancedMesh ? 1 : 1);
    ms.forEach(m => { if (!m || !m.isMeshStandardMaterial || m.transparent || skip.has(m) || (m.emissiveIntensity > 0.4 && m.emissive && m.emissive.getHex() !== 0)) return; (sz > 2 ? big : small).add(m); }); });
  big.forEach(weathMat); WEATH.runs++;
}
function weathFrame(dt) { if (!LOOK.on || /weather=0/.test(location.search)) return; WEATH.t += dt; if ((WEATH.runs === 0 && WEATH.t > 4) || (WEATH.runs === 1 && WEATH.t > 22) || (WEATH.runs === 2 && WEATH.t > 60)) weathScan(); }
window.__FRAMES.push(dt => { try { weathFrame(dt); } catch (e) { if (!WEATH.err) { WEATH.err = e; console.warn('v172 weathering', e); } } });
// window glow by day: warm emissive on dark, untextured surfaces (the stalls' lit fronts, the walk up's and the towers' windows) is
// a night effect; by day it flattened whole faces into one lit colour. It now follows the lamps.
const GLOWS = { list: null, t: 0 };
function glowScan() { GLOWS.list = []; const seen = new Set(); scene.traverse(o => { const m = o.material; if (!o.isMesh || !m || Array.isArray(m) || seen.has(m) || !m.isMeshStandardMaterial || m.map || !m.emissive) return; seen.add(m); const e = m.emissive, c = m.color, lumC = (c.r + c.g + c.b) / 3, warm = e.r >= e.b && (e.r + e.g + e.b) / 3 > 0.4;
  if (lumC < 0.25 && warm && m.emissiveIntensity > 0.15) GLOWS.list.push({ m, base: m.emissiveIntensity }); }); }
window.__FRAMES.push(dt => { try { if (!LOOK.on) return; GLOWS.t += dt; if (!GLOWS.list && GLOWS.t > 5) glowScan(); if (GLOWS.t > 30 && !GLOWS.again) { GLOWS.again = true; glowScan(); } if (!GLOWS.list) return; const k = 0.12 + 0.88 * Math.min(1, (L.lamps || 0) * 1.3); GLOWS.list.forEach(g => { if (g.m.emissiveIntensity !== g.last) g.base = g.m.emissiveIntensity; g.m.emissiveIntensity = g.last = g.base * k; }); } catch (e) { } });
