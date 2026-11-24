// THE LOOK (2026-11-23, THE BIG UPGRADE). The museum's look.ts and the Gary tower's real.js, ported to the park.
// Three things the park lacked, desktop only, ?look=0 brings back the old frame for comparing:
//   1. a reflection probe of the park itself: on arrival in each zone a cube camera at head height renders the park as
//      it is lit, PMREM filters it, and it becomes scene.environment, so chrome, glass, water and the polished hall floor
//      reflect the rides and the trees round them instead of one gradient sky
//   2. a soft ambient occlusion pass from the depth buffer (half resolution, range checked, blurred in the finish), so
//      feet, benches, stalls and the hall's skirting sit on the ground instead of floating
//   3. a calm display grade: ACES in the finish, a soft S curve, warm highlights and cool shadows, a light vignette and a
//      fine grain that moves, the way a print of a photograph looks rather than a game frame
// Phones keep their budget: no occlusion, no grade, no second target; the probe still runs once per zone at 64 px.
import * as THREE from 'three';

const Q = new URLSearchParams(location.search);
export const LOOK = { on: Q.get('look') !== '0' };

export function makeLook(renderer, scene, camera, { phone = false } = {}) {
  const post = LOOK.on && !phone;
  const size = new THREE.Vector2();
  // ---------- 1. the probe ----------
  const cubeRT = new THREE.WebGLCubeRenderTarget(phone ? 64 : 256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.5, 1500, cubeRT);
  let pm = null, probeTex = null;
  const baseEnv = scene.environment;
  function capture(at, hide = []) {
    if (!LOOK.on) return;
    pm ||= new THREE.PMREMGenerator(renderer);
    const hidden = hide.filter((o) => o && o.visible); hidden.forEach((o) => (o.visible = false));
    const fog = scene.fog, env = scene.environment; scene.fog = null; scene.environment = baseEnv;
    cubeCam.position.copy(at); cubeCam.update(renderer, scene);
    scene.fog = fog; scene.environment = env;
    hidden.forEach((o) => (o.visible = true));
    const t = pm.fromCubemap(cubeRT.texture).texture;
    if (probeTex) probeTex.dispose();
    probeTex = t; scene.environment = t;
  }

  renderer.info.autoReset = false;                 // the counters cover the whole frame, not just its last pass
  if (!post) return { capture, render: () => { renderer.info.reset(); renderer.render(scene, camera); }, resize() {}, post: false };

  // ---------- 2 and 3. the frame target, occlusion and the finish ----------
  renderer.getDrawingBufferSize(size);
  const depthTex = new THREE.DepthTexture(size.x, size.y); depthTex.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4, depthTexture: depthTex });
  const aoRT = new THREE.WebGLRenderTarget(Math.ceil(size.x / 2), Math.ceil(size.y / 2), { type: THREE.UnsignedByteType });
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadGeo = new THREE.PlaneGeometry(2, 2);
  const aoMat = new THREE.ShaderMaterial({
    uniforms: { tDepth: { value: depthTex }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.9 }, uPower: { value: 1.35 } },
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      uniform sampler2D tDepth; uniform float uRadius, uPower; uniform mat4 uProj, uInv; varying vec2 vUv;
      vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = uInv * vec4(uv * 2. - 1., d * 2. - 1., 1.); return p.xyz / p.w; }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.); return; }
        vec3 P = viewPos(vUv);
        if (-P.z > 140.) { gl_FragColor = vec4(1.); return; }          // far park: no occlusion, it only adds noise
        vec3 N = normalize(cross(dFdx(P), dFdy(P)));
        float a0 = h(gl_FragCoord.xy) * 6.2831; float occ = 0.;
        vec3 T = normalize(abs(N.y) < 0.9 ? cross(N, vec3(0., 1., 0.)) : cross(N, vec3(1., 0., 0.))), B = cross(N, T);
        float rad = uRadius * clamp(-P.z / 12., 0.6, 2.2);
        for (int i = 0; i < 14; i++) {
          float fi = float(i), a = a0 + fi * 2.3999, r = (fi + 0.5) / 14., z = sqrt(1. - r);
          vec3 s = P + (T * cos(a) * sqrt(r) + B * sin(a) * sqrt(r) + N * z) * rad * mix(0.15, 1., r * r);
          vec4 q = uProj * vec4(s, 1.); vec2 suv = q.xy / q.w * 0.5 + 0.5;
          float sz = viewPos(suv).z;
          float range = smoothstep(0., 1., rad / abs(P.z - sz));
          occ += (sz >= s.z + 0.03 ? 1. : 0.) * range;
        }
        float ao = pow(clamp(1. - occ / 14., 0., 1.), uPower);
        gl_FragColor = vec4(vec3(mix(1., ao, smoothstep(140., 60., -P.z))), 1.);
      }`,
  });
  const finMat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tAO: { value: aoRT.texture }, uTexel: { value: new THREE.Vector2() }, uTime: { value: 0 }, uAO: { value: 1 } },
    depthTest: false, depthWrite: false, toneMapped: true,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      uniform sampler2D tColor, tAO; uniform vec2 uTexel; uniform float uTime, uAO; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tColor, vUv).rgb;
        float ao = 0.;                                                 // 3 x 3 tent blur of the half resolution occlusion
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) ao += texture2D(tAO, vUv + vec2(float(x), float(y)) * uTexel * 2.).r * (x == 0 && y == 0 ? 0.25 : (x == 0 || y == 0 ? 0.125 : 0.0625));
        c *= mix(1., ao, uAO);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        vec3 g = gl_FragColor.rgb;
        float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
        g = mix(g, g * g * (3. - 2. * g), 0.22);                                   // soft S curve
        g += mix(vec3(-0.012, 0.0, 0.016), vec3(0.022, 0.008, -0.018), smoothstep(0.15, 0.85, l));   // cool shadows, warm highlights
        vec2 q = vUv - 0.5; g *= 1. - 0.32 * smoothstep(0.32, 0.95, dot(q, q) * 2.2);                  // vignette
        g += (h(vUv * 911. + fract(uTime) * 37.) - 0.5) * 0.022;                                       // fine grain
        gl_FragColor = vec4(clamp(g, 0., 1.), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const aoQuad = new THREE.Mesh(quadGeo, aoMat), finQuad = new THREE.Mesh(quadGeo, finMat);
  aoQuad.frustumCulled = finQuad.frustumCulled = false;
  const aoScene = new THREE.Scene(), finScene = new THREE.Scene(); aoScene.add(aoQuad); finScene.add(finQuad);
  function resize() {
    renderer.getDrawingBufferSize(size);
    rt.setSize(size.x, size.y); aoRT.setSize(Math.ceil(size.x / 2), Math.ceil(size.y / 2));
    finMat.uniforms.uTexel.value.set(1 / aoRT.width, 1 / aoRT.height);
  }
  resize();
  let t = 0;
  function render(dt = 0.016, { ao = true } = {}) {
    t += dt; renderer.info.reset();
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    if (ao) {
      aoMat.uniforms.uProj.value.copy(camera.projectionMatrix); aoMat.uniforms.uInv.value.copy(camera.projectionMatrixInverse);
      renderer.setRenderTarget(aoRT); renderer.render(aoScene, quadCam);
    }
    finMat.uniforms.uAO.value = ao ? 1 : 0; finMat.uniforms.uTime.value = t;
    renderer.setRenderTarget(null); renderer.render(finScene, quadCam);
  }
  return { capture, render, resize, post: true };
}
