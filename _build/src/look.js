// THE LOOK (2026-11-24, the big upgrade). Ported from the Gary tower's real.js and the museum's look.ts, desktop only.
//   1. each room captures its OWN light into a reflection probe once it has loaded, so the wet asphalt, the deli
//      terrazzo and the chrome reflect that room and its photograph, not one night sky for all seven
//   2. a soft ambient occlusion pass at half resolution darkens creases, feet, shelf backs and corners
//   3. a calm display grade over the frame: soft vignette, cool shadows at the edges, fine grain
// The scene still draws straight to the screen with ACES (the photo plates stay exactly as shot); the occlusion and the
// grade are multiplied over it by one full screen triangle. ?look=0 brings back the old look. Phones skip all of it.
import * as THREE from 'three';

export function makeLook(renderer, scene, camera, { MOBILE, Q }) {
  const on = !MOBILE && Q.get('look') !== '0';
  const L = { on, probe: null, render: null };
  if (!on) { L.render = () => renderer.render(scene, camera); L.capture = () => {}; return L; }

  // ---------- 1. the probe ----------
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cube = new THREE.CubeCamera(0.1, 90, cubeRT);
  const pm = new THREE.PMREMGenerator(renderer);
  L.capture = (r, x, y, z) => {
    const fog = scene.fog; scene.fog = null;
    cube.position.set(x, y, z); cube.update(renderer, scene); scene.fog = fog;
    const t = pm.fromCubemap(cubeRT.texture).texture;
    if (r.probe) r.probe.dispose(); r.probe = t; return t;
  };

  // ---------- 2. occlusion ----------
  const DS = 2;
  const depthRT = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1), depthBuffer: true });
  const aoRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType });
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  const size = () => { const w = Math.max(1, Math.floor(innerWidth * renderer.getPixelRatio() / DS)), h = Math.max(1, Math.floor(innerHeight * renderer.getPixelRatio() / DS)); depthRT.setSize(w, h); aoRT.setSize(w, h); fin.uniforms.uTexel.value.set(1 / w, 1 / h); };
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const ao = new THREE.ShaderMaterial({
    uniforms: { tDepth: { value: depthRT.depthTexture }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.5 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    depthTest: false, depthWrite: false,
    fragmentShader: `
      uniform sampler2D tDepth; uniform float uRadius; uniform mat4 uProj, uInv; varying vec2 vUv;
      vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = uInv * vec4(uv * 2. - 1., d * 2. - 1., 1.); return p.xyz / p.w; }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.); return; }
        vec3 P = viewPos(vUv); vec3 N = normalize(cross(dFdx(P), dFdy(P)));
        float a0 = h(gl_FragCoord.xy) * 6.2831, occ = 0.;
        vec3 T = normalize(abs(N.y) < 0.9 ? cross(N, vec3(0., 1., 0.)) : cross(N, vec3(1., 0., 0.))), B = cross(N, T);
        for (int i = 0; i < 12; i++) {
          float fi = float(i), a = a0 + fi * 2.3999, r = (fi + 0.5) / 12., z = sqrt(1. - r);
          vec3 s = P + (T * cos(a) * sqrt(r) + B * sin(a) * sqrt(r) + N * z) * uRadius * mix(0.15, 1., r * r);
          vec4 q = uProj * vec4(s, 1.); vec2 suv = q.xy / q.w * 0.5 + 0.5;
          float sz = viewPos(suv).z;
          occ += (sz >= s.z + 0.02 ? 1. : 0.) * smoothstep(0., 1., uRadius / abs(P.z - sz));
        }
        gl_FragColor = vec4(vec3(pow(clamp(1. - occ / 12., 0., 1.), 1.3)), 1.);
      }`,
  });
  // ---------- 3. the grade, multiplied over the frame ----------
  const fin = new THREE.ShaderMaterial({
    uniforms: { tAO: { value: aoRT.texture }, uTexel: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uAO: { value: 0.78 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    fragmentShader: `
      uniform sampler2D tAO; uniform vec2 uTexel; uniform float uTime, uAO; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float a = 0.;   // a small blur over the half resolution occlusion
        for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) a += texture2D(tAO, vUv + vec2(float(x), float(y)) * uTexel * 1.5).r;
        a = mix(1., a / 9., uAO);
        vec2 c = vUv - 0.5; float v = 1. - smoothstep(0.32, 0.95, length(c * vec2(1.15, 1.))) * 0.38;      // soft vignette
        vec3 tint = mix(vec3(0.93, 0.96, 1.0), vec3(1.), v);                                              // cool at the edges
        float g = 1. - h(gl_FragCoord.xy + fract(uTime) * 91.7) * 0.045;                                  // fine grain
        gl_FragColor = vec4(vec3(a * v * g) * tint, 1.);
      }`,
  });
  const aoMesh = new THREE.Mesh(tri, ao), finMesh = new THREE.Mesh(tri, fin);
  aoMesh.frustumCulled = finMesh.frustumCulled = false;
  size(); addEventListener('resize', size);
  const hidden = [];
  L.hideFromAO = (o) => hidden.push(o);   // the photo plates: their depth folds are a photograph's, not a room's
  L.render = (t) => {
    const vis = hidden.map((o) => o.visible); hidden.forEach((o) => (o.visible = false));
    const bg = scene.background, fog = scene.fog; scene.background = null; scene.overrideMaterial = depthOnly;
    renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; hidden.forEach((o, i) => (o.visible = vis[i]));
    ao.uniforms.uProj.value.copy(camera.projectionMatrix); ao.uniforms.uInv.value.copy(camera.projectionMatrixInverse);
    renderer.setRenderTarget(aoRT); renderer.render(aoMesh, ortho);
    renderer.setRenderTarget(null); renderer.render(scene, camera);
    fin.uniforms.uTime.value = t; const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(finMesh, ortho); renderer.autoClear = ac;
  };
  return L;
}
