// ONLY IN NEW YORK, the photoreal pass (2026-11-09), ported from CLOUDS AND DIRT V2's real.js (2026-11-02) by reading, not by patch.
// Four of its five moves apply here:
//   1. a reflection probe per indoor room: the room's own light, captured once its models have landed, becomes the
//      room's scene.environment, so the marble, the brass and the chrome reflect that room and not a sky
//   2. floors: a roughness per floor type, a little more reflection, full anisotropy so the tiles stay sharp to the far wall
//   3. ambient occlusion from the scene target's depth, half resolution, desktop only (main.js runs it; the shader is here)
//   4. a calmer lens: the colour fringe and the vignette ease (main.js, the finish)
// The fifth, a lit ceiling with recessed downlights, is NOT ported: these are subway stations, Grand Central, a tenement
// studio and two bodegas, every one with its own generated ceiling at its real height, already lit. No office downlights.
// ?real=off brings back the old look. Phones and ?lite skip the occlusion; the probe runs everywhere.
//
// What differs from the tower's probe, because this gallery had a load and stutter pass (2026-11-01):
//   - the cube target is flagged the way the scene target is (isXRRenderTarget, linear), so the scene tone maps into it
//     with the SAME programs it already compiled for the screen pass. An unflagged target asks every material in view
//     for a second program with no tone mapping: a stall on the first capture in every room.
//   - the fog stays on during the capture, for the same reason (fog on or off is part of every program's key)
//   - the cube is 256 because the three skies are 1024 wide and PMREM makes a 256 cube of those: the same size keeps
//     envMapCubeUVHeight, and so every program, unchanged when the room's probe replaces the sky
//   - one face a frame, then the PMREM filter on the seventh: six room draws in one frame is a hitch you can feel
import * as THREE from 'three';

export const REAL = { on: new URLSearchParams(location.search).get('real') !== 'off' };

// ---------- the floors ----------
// Each value multiplies the texture's own roughness map, so the grain stays.
const GLOSS = { terrazzo: 0.42, marble: 0.3, marble2: 0.32, parquet: 0.5, planks: 0.6, checker: 0.38, metal: 0.45, concrete: 0.78, plaster: 0.7, oldwood: 0.75 };
export function floorFinish(r, mat, renderer) {
  if (!REAL.on || !mat || r.outdoor || r.noGloss) return;
  const k = r.gloss ?? GLOSS[r.floor]; if (k) { mat.roughness = k; mat.envMapIntensity = 1.4; }
  const a = renderer.capabilities.getMaxAnisotropy(); for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) if (t) t.anisotropy = a;
}

// ---------- the reflection probe ----------
export function makeProbe(renderer, scene) {
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  cubeRT.isXRRenderTarget = true; cubeRT.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const cam = new THREE.CubeCamera(0.1, 120, cubeRT);
  let pm = null, job = null;
  const P = {
    get busy() { return !!job; }, get room() { return job && job.r; }, n: 0,
    // the filter's own shaders, compiled at the start and not at the first door: one real run over the empty cube, since a
    // program is keyed on the target it draws into and compileCubemapShader() compiles for the screen
    boot() { if (!REAL.on || pm) return; pm = new THREE.PMREMGenerator(renderer); pm.fromCubemap(cubeRT.texture).dispose(); },
    start(r, x, y, z) { if (!REAL.on || job) return false; job = { r, face: 0 }; cam.position.set(x, y, z); cam.updateMatrixWorld(); return true; },
    cancel() { job = null; },
    // one face of the cube a frame; `env` is the reflection strength to capture under (the room's own, not the boosted one)
    step(hide, env) {
      if (!job) return null;
      P.boot();
      if (cam.coordinateSystem !== renderer.coordinateSystem) { cam.coordinateSystem = renderer.coordinateSystem; cam.updateCoordinateSystem(); cam.updateMatrixWorld(true); }
      const old = renderer.getRenderTarget(), ei = scene.environmentIntensity; scene.environmentIntensity = env;
      const hidden = (hide || []).filter((o) => o && o.visible); hidden.forEach((o) => (o.visible = false));
      renderer.setRenderTarget(cubeRT, job.face); renderer.render(scene, cam.children[job.face]);
      hidden.forEach((o) => (o.visible = true)); scene.environmentIntensity = ei; renderer.setRenderTarget(old);
      if (++job.face < 6) return null;
      const r = job.r; job = null;
      r.probeRT = pm.fromCubemap(cubeRT.texture, r.probeRT || null); r.probe = r.probeRT.texture; P.n++;
      return r;
    },
    drop(r) { if (job && job.r === r) job = null; if (r.probeRT) { r.probeRT.dispose(); r.probeRT = r.probe = null; } r.probeN = 0; r.probeReady = 0; },
  };
  return P;
}

// ---------- ambient occlusion ----------
// Half resolution, sixteen samples in a view space hemisphere around the normal rebuilt from depth, range checked so a
// far wall does not darken a near edge, then blurred by the bloom chain's own separable blur and multiplied in the finish.
export function aoMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { tDepth: { value: null }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.55 }, uPower: { value: 1.4 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    depthTest: false, depthWrite: false,
    fragmentShader: `
      uniform sampler2D tDepth; uniform float uRadius, uPower; uniform mat4 uProj, uInv; varying vec2 vUv;
      vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = uInv * vec4(uv * 2. - 1., d * 2. - 1., 1.); return p.xyz / p.w; }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.); return; }
        vec3 P = viewPos(vUv);
        vec3 N = normalize(cross(dFdx(P), dFdy(P)));
        float a0 = h(gl_FragCoord.xy) * 6.2831; float occ = 0.;
        vec3 T = normalize(abs(N.y) < 0.9 ? cross(N, vec3(0., 1., 0.)) : cross(N, vec3(1., 0., 0.))), B = cross(N, T);
        for (int i = 0; i < 16; i++) {
          float fi = float(i), a = a0 + fi * 2.3999, r = (fi + 0.5) / 16., z = sqrt(1. - r);
          vec3 s = P + (T * cos(a) * sqrt(r) + B * sin(a) * sqrt(r) + N * z) * uRadius * mix(0.15, 1., r * r);
          vec4 q = uProj * vec4(s, 1.); vec2 suv = q.xy / q.w * 0.5 + 0.5;
          float sz = viewPos(suv).z;
          float range = smoothstep(0., 1., uRadius / abs(P.z - sz));
          occ += (sz >= s.z + 0.02 ? 1. : 0.) * range;
        }
        float ao = pow(clamp(1. - occ / 16., 0., 1.), uPower);
        gl_FragColor = vec4(vec3(ao), 1.);
      }`,
  });
}
