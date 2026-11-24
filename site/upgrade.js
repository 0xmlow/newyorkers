// MLOW INTERNATIONAL, THE BIG UPGRADE (2026-11-24).
// MLow: "as detailed and cool as my movies set gallery or the gallery I made Gary but even better".
// The terminal is one Blender set whose light (and colour) is baked into four lightmaps, so everything here sits on top
// of the bake rather than replacing it:
//   scan   scanned Poly Haven surfaces multiplied over the bake as a detail layer, in world metres, and polished floors
//          that reflect the room they are in (a probe per hall) through the scan's own normal and roughness maps
//   look   ACES, a soft ambient occlusion pass, a calm display grade (curve, warm highlights, cool shadows, vignette,
//          grain); desktop only, phones keep the straight render
//   props  real models where code primitives stood: taxis for the box cars, cherry trees for the pink balls, the
//          station clock under the dome, stanchion queues at the desks, luggage at the travellers' feet and riding the
//          carousels, benches, palms, lamps, the globe at arrivals
//   built  ceilings with slats and downlights, signs in the house type, one illusion per hall
// Switches for comparing: ?look=0 ?scan=0 ?props=0 ?built=0 (or ?up=0 for the terminal as it was).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const Q = new URLSearchParams(location.search);
const ALL = Q.get('up') !== '0';
export const UP = {
  look: ALL && Q.get('look') !== '0', scan: ALL && Q.get('scan') !== '0',
  props: ALL && Q.get('props') !== '0', built: ALL && Q.get('built') !== '0',
};

const TEX = 'assets/tex/', GLB = 'assets/glb/';
const rad = THREE.MathUtils.degToRad;

export async function upgrade(ctx) {
  const { scene, renderer, camera, gltf, mergedRoot, envMap, touch, cast, travellers = [] } = ctx;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const api = { render: null, update: () => {}, loaded: false, probes: [], illusions: [] };
  const pending = [];

  // ------------------------------------------------------------------ fonts (house type for every sign)
  const fontsReady = Promise.all([
    ['Archivo Expanded', 'ArchivoExpanded.woff2', '700'], ['Archivo Narrow', 'ArchivoNarrow-700.woff2', '700'], ['JetBrains Mono', 'JetBrainsMono.woff2', '400'],
  ].map(([fam, file, w]) => new FontFace(fam, `url(assets/fonts/${file})`, { weight: w }).load().then((f) => document.fonts.add(f)).catch(() => null)));

  // ================================================================== 1. scanned surfaces over the bake
  const texLoader = new THREE.TextureLoader();
  const texCache = {};
  function tex(name, kind) {
    const key = name + kind;
    if (!texCache[key]) {
      const t = texLoader.load(`${TEX}${name}_${kind}.jpg`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
      t.colorSpace = THREE.NoColorSpace;
      texCache[key] = t;
    }
    return texCache[key];
  }
  // per baked material: [scan, metres per repeat, strength] for up facing, down facing and side faces.
  // refl: how much the floor mirrors its hall; rough: the polish (multiplies the scan's roughness map)
  const SCAN = {
    terrazzo: { top: ['floor', 3.2, 0.55], refl: 0.34, rough: 0.16 },
    liner_blue: { top: ['floor', 3.2, 0.32], side: ['plaster', 2.6, 0.22], refl: 0.26, rough: 0.2 },
    plaza_white: { top: ['pavers', 3.6, 0.6], bottom: ['plaster', 3, 0.28], side: ['plaster', 2.6, 0.3] },
    plaster: { top: ['plaster', 2.6, 0.4], bottom: ['plaster', 2.6, 0.4], side: ['plaster', 2.6, 0.42] },
    asphalt: { top: ['asphalt', 5, 0.75] }, lot: { top: ['asphalt', 5, 0.75] },
    tarmac: { top: ['apron', 7.5, 0.62] },
    ground: { top: ['grass', 2.6, 0.8] }, soil: { top: ['grass', 1.8, 0.55] },
    conc: { top: ['apron', 4, 0.4], side: ['apron', 4, 0.4] },
    bridge: { top: ['apron', 4, 0.3], side: ['plaster', 3, 0.25] },
  };
  const floorMats = [];
  if (UP.scan) {
    for (const mesh of mergedRoot.children) {
      const m = mesh.material, key = m.name.replace(/_baked$/, ''), s = SCAN[key];
      if (!s || m.userData.scanned) continue;
      m.userData.scanned = true;
      const slots = ['top', 'bottom', 'side'].filter((k) => s[k]);
      const uni = {};
      for (const k of slots) { uni[`u_${k}`] = { value: tex(s[k][0], 'd') }; uni[`u_${k}S`] = { value: s[k][1] }; uni[`u_${k}K`] = { value: s[k][2] }; }
      const refl = s.refl && !touch;
      if (refl) {
        uni.u_n = { value: tex(s.top[0], 'n') }; uni.u_r = { value: tex(s.top[0], 'r') };
        uni.u_refl = { value: s.refl }; uni.u_rough = { value: s.rough };
        m.envMap = envMap; floorMats.push(m);
      }
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uni);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);');
        let decl = 'varying vec3 vWP; varying vec3 vWN;\n';
        for (const k of slots) decl += `uniform sampler2D u_${k}; uniform float u_${k}S; uniform float u_${k}K;\n`;
        if (refl) decl += 'uniform sampler2D u_n; uniform sampler2D u_r; uniform float u_refl; uniform float u_rough;\n';
        if (refl) decl += '#include <cube_uv_reflection_fragment>\n';   // MeshBasic never pulls this in itself
        decl += `float triScan(sampler2D t, float s, vec3 w){ return texture2D(t, vWP.zy / s).r * w.x + texture2D(t, vWP.xz / s).r * w.y + texture2D(t, vWP.xy / s).r * w.z; }
float scanLayer(sampler2D t, float s, float k, vec3 w){
  float a = triScan(t, s, w) / 0.502, b = triScan(t, s * 7.31, w) / 0.502;   // the tile, and a slow wash so it never reads as a repeat
  return mix(1.0, a, k) * mix(1.0, b, k * 0.35);
}\n`;
        let body = '\nvec3 sN = normalize(vWN); vec3 sW = pow(abs(sN), vec3(4.0)); sW /= (sW.x + sW.y + sW.z + 1e-5); float sD = 1.0;\n';
        const has = (k) => slots.includes(k);
        body += `if (sN.y > 0.6) { ${has('top') ? 'sD = scanLayer(u_top, u_topS, u_topK, sW);' : ''} }
else if (sN.y < -0.6) { ${has('bottom') ? 'sD = scanLayer(u_bottom, u_bottomS, u_bottomK, sW);' : ''} }
else { ${has('side') ? 'sD = scanLayer(u_side, u_sideS, u_sideK, sW);' : ''} }
diffuseColor.rgb *= clamp(sD, 0.35, 1.8);\n`;
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\n' + decl)
          .replace('#include <color_fragment>', '#include <color_fragment>' + body);
        if (refl) {
          sh.fragmentShader = sh.fragmentShader.replace('#include <envmap_fragment>', `
#ifdef ENVMAP_TYPE_CUBE_UV
  if (sN.y > 0.6) {
    vec3 tn = texture2D(u_n, vWP.xz / u_topS).xyz * 2.0 - 1.0;
    vec3 Nf = normalize(vec3(tn.x * 0.35, 1.0, -tn.y * 0.35));
    vec3 Vd = normalize(vWP - cameraPosition);
    float rr = clamp(texture2D(u_r, vWP.xz / u_topS).r * u_rough * 2.0, 0.03, 0.9);
    vec3 Rv = reflect(Vd, Nf);
    vec3 envC = textureCubeUV(envMap, envMapRotation * Rv, rr).rgb;
    float fr = u_refl * (0.18 + 0.82 * pow(1.0 - max(dot(-Vd, Nf), 0.0), 4.0));
    outgoingLight = mix(outgoingLight, envC, clamp(fr, 0.0, 0.85));
  }
#else
  #include <envmap_fragment>
#endif`);
        }
      };
      m.customProgramCacheKey = () => 'scan:' + key + (refl ? ':r' : '');
      m.needsUpdate = true;
    }
  }
  for (const lm of Object.values(ctx.lightmaps || {})) lm.tex.anisotropy = maxAniso;

  // ================================================================== 2. the look: probes, AO, grade
  // Probes: one per hall, the hall rendered at head height into a cube and filtered, so the polished floor reflects
  // the room it is in (the sky env made every floor reflect the same pale sky). Outside, the sky stays.
  const HALLS = [
    { name: 'rotunda', at: [0, 3.2, 4], r: 36 }, { name: 'concourse', at: [0, 3.2, -96], r: 60, box: [-13, 13, -150, -42] },
    { name: 'hub', at: [0, 3.2, -192], r: 60 }, { name: 'arrivals', at: [62, 3, -24], r: 30, box: [35, 87, -51, -10] },
  ];
  let pmrem = null;
  function captureProbes() {
    if (!UP.look || touch) return;
    pmrem ||= new THREE.PMREMGenerator(renderer);
    const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cc = new THREE.CubeCamera(0.2, 900, rt);
    const save = floorMats.map((m) => m.envMap); floorMats.forEach((m) => (m.envMap = envMap));
    const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
    for (const h of HALLS) {
      cc.position.set(...h.at); cc.update(renderer, scene);
      const t = pmrem.fromCubemap(rt.texture).texture;
      if (h.tex) h.tex.dispose(); h.tex = t;
    }
    renderer.toneMapping = tm; floorMats.forEach((m, i) => (m.envMap = save[i])); rt.dispose();
    api.probes = HALLS;
  }
  function hallAt(p) {
    let best = null, bd = 1e9;
    for (const h of HALLS) {
      if (h.box && (p.x < h.box[0] || p.x > h.box[1] || p.z < h.box[2] || p.z > h.box[3])) continue;
      const d = Math.hypot(p.x - h.at[0], p.z - h.at[2]); if (d < h.r && d < bd) { bd = d; best = h; }
    }
    return best;
  }
  let lastHall;
  function pickProbe() {
    const h = hallAt(camera.position);
    if (h === lastHall) return; lastHall = h;
    const t = (h && h.tex) || envMap;
    floorMats.forEach((m) => (m.envMap = t));
    scene.environment = (h && h.tex) || envMap;      // props inside take the hall's light too
  }

  // post: scene into a multisampled half float target, AO at half size, then one grade pass to the screen
  if (UP.look && !touch) {
    const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
    const depth = new THREE.DepthTexture(size.x, size.y); depth.type = THREE.UnsignedIntType;
    const rtScene = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4, depthTexture: depth });
    const rtAO = new THREE.WebGLRenderTarget(size.x >> 1, size.y >> 1, { type: THREE.UnsignedByteType });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false;
    const qScene = new THREE.Scene(); qScene.add(quad); const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const aoMat = new THREE.ShaderMaterial({
      uniforms: { tDepth: { value: depth }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.7 }, uPower: { value: 1.3 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      depthTest: false, depthWrite: false,
      fragmentShader: `
        uniform sampler2D tDepth; uniform float uRadius, uPower; uniform mat4 uProj, uInv; varying vec2 vUv;
        vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = uInv * vec4(uv * 2. - 1., d * 2. - 1., 1.); return p.xyz / p.w; }
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.); return; }
          vec3 P = viewPos(vUv); vec3 N = normalize(cross(dFdx(P), dFdy(P)));
          float a0 = h(gl_FragCoord.xy) * 6.2831; float occ = 0.;
          vec3 T = normalize(abs(N.y) < 0.9 ? cross(N, vec3(0., 1., 0.)) : cross(N, vec3(1., 0., 0.))), B = cross(N, T);
          for (int i = 0; i < 12; i++) {
            float fi = float(i), a = a0 + fi * 2.3999, r = (fi + 0.5) / 12., z = sqrt(1. - r);
            vec3 s = P + (T * cos(a) * sqrt(r) + B * sin(a) * sqrt(r) + N * z) * uRadius * mix(0.15, 1., r * r);
            vec4 q = uProj * vec4(s, 1.); vec2 suv = q.xy / q.w * 0.5 + 0.5;
            float sz = viewPos(suv).z;
            occ += (sz >= s.z + 0.03 ? 1. : 0.) * smoothstep(0., 1., uRadius / abs(P.z - sz));
          }
          // fade with distance: the bake already holds the large scale occlusion, this is for feet, seams and props
          float fade = 1. - smoothstep(25., 60., -P.z);
          gl_FragColor = vec4(vec3(mix(1., pow(clamp(1. - occ / 12., 0., 1.), uPower), fade)), 1.);
        }`,
    });
    const gradeMat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: rtScene.texture }, tAO: { value: rtAO.texture }, uExposure: { value: 1 }, uTime: { value: 0 }, uTexel: { value: new THREE.Vector2(2 / size.x, 2 / size.y) }, uAOk: { value: 0.75 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      depthTest: false, depthWrite: false, toneMapped: false,
      fragmentShader: `
        uniform sampler2D tColor, tAO; uniform float uExposure, uTime, uAOk; uniform vec2 uTexel; varying vec2 vUv;
        vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
        vec3 aces(vec3 c){
          const mat3 IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
          const mat3 OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
          c *= uExposure / 0.6; c = IN * c; c = RRTAndODTFit(c); c = OUT * c; return clamp(c, 0., 1.);
        }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - 0.055, step(0.0031308, c)); }
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tColor, vUv).rgb;
          float ao = 0.;   // 3 x 3 blur of the half size occlusion
          for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) ao += texture2D(tAO, vUv + vec2(float(x), float(y)) * uTexel).r;
          c *= mix(1., ao / 9., uAOk);
          c = aces(c);
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(c, c * vec3(0.96, 1.0, 1.05), (1. - smoothstep(0.0, 0.45, l)) * 0.5);   // cool shadows
          c = mix(c, c * vec3(1.04, 1.0, 0.95), smoothstep(0.55, 1.0, l) * 0.5);         // warm highlights
          c = mix(c, c * c * (3. - 2. * c), 0.18);                                       // a soft S curve
          vec2 q = vUv - 0.5; c *= 1. - dot(q, q) * 0.42;                                // vignette
          c = toSRGB(c);
          c += (h(gl_FragCoord.xy) - 0.5) * 0.022;                                       // fine grain
          gl_FragColor = vec4(c, 1.);
        }`,
    });
    let t0 = performance.now();
    api.render = () => {
      renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
      aoMat.uniforms.uProj.value.copy(camera.projectionMatrix); aoMat.uniforms.uInv.value.copy(camera.projectionMatrixInverse);
      quad.material = aoMat; renderer.setRenderTarget(rtAO); renderer.render(qScene, qCam);
      gradeMat.uniforms.uExposure.value = renderer.toneMappingExposure;
      gradeMat.uniforms.uTime.value = ((performance.now() - t0) / 1000) % 100;
      quad.material = gradeMat; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    };
    api.resize = () => {
      renderer.getDrawingBufferSize(size);
      rtScene.setSize(size.x, size.y); rtAO.setSize(size.x >> 1, size.y >> 1);
      depth.image.width = size.x; depth.image.height = size.y;
      gradeMat.uniforms.uTexel.value.set(2 / size.x, 2 / size.y);
    };
  }

  // ================================================================== 3. real models
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const models = {};
  const model = (name) => (models[name] ||= loader.loadAsync(GLB + name + '.glb').then((g) => {
    g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => { if (o.isMesh) { for (const t of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (o.material[t]) o.material[t].anisotropy = maxAniso; } });
    return g.scene;
  }).catch((e) => { console.warn('model failed', name, e); return null; }));
  const box3 = new THREE.Box3();
  // place one model at many matrices: one InstancedMesh per mesh of the model. Each placement is
  // {x, y, z, ry, s} with the model's bounding box bottom set on y and its footprint centred on x, z.
  function instance(root, places, opts = {}) {
    if (!root || !places.length) return null;
    box3.setFromObject(root);
    const c = box3.getCenter(new THREE.Vector3()), base = new THREE.Matrix4().makeTranslation(-c.x, -box3.min.y, -c.z);
    const g = new THREE.Group(); g.name = opts.name || 'up_props';
    const M = new THREE.Matrix4(), P = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const im = new THREE.InstancedMesh(o.geometry, o.material, places.length);
      places.forEach((p, i) => {
        q.setFromEuler(e.set(p.rx || 0, p.ry || 0, p.rz || 0));
        P.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.sx ?? p.s, p.sy ?? p.s, p.sz ?? p.s));
        M.multiplyMatrices(P, base).multiply(o.matrixWorld); im.setMatrixAt(i, M);
      });
      im.computeBoundingSphere(); im.frustumCulled = true;
      g.add(im);
    });
    scene.add(g); return g;
  }
  const sizeOf = (root) => box3.setFromObject(root).getSize(new THREE.Vector3());
  const T3 = THREE.Vector3, DOWN = new T3(0, -1, 0);
  const floorY = (x, z, from = 4.5) => { const h = cast(new T3(x, from, z), DOWN, 30); return h ? h.point.y : null; };
  // free: nothing stands higher than the floor in a circle of radius r (desks, plinths, columns are all in the
  // collision set), and no traveller stands within 1.1 m
  function free(x, z, r = 0.6, floor = null) {
    const f0 = floor ?? floorY(x, z); if (f0 === null) return null;
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      const f = floorY(x + dx, z + dz); if (f === null || Math.abs(f - f0) > 0.08) return null;
    }
    for (const t of travellers) if (Math.hypot(t.x - x, t.z - z) < 1.1) return null;
    return f0;
  }
  const rnd = (() => { let s = 6529; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  // things the visitor should not walk through: their footprint boxes join the collision BVH once everything lands
  const solids = [];
  function solidBox(x, y, z, w, h, d, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y + h / 2, z); solids.push(g);
  }

  if (UP.props) {
    // ---- taxis for the box cars. The cars are five instanced sets (body, glass, wheels), one per colour; each
    // instance keeps its spot and heading and becomes a yellow cab of about the same length.
    const carSets = [];
    gltf.scene.traverse((o) => { if (o.isInstancedMesh && /^car_c\d$/.test(o.material.name || '')) carSets.push(o); });
    const CABS = ['h_taxi', 'h_taxi_camry', 'h_taxi_sienna', 'h_taxi_escape', 'h_taxi_nv200'];
    carSets.forEach((body, ci) => pending.push(model(CABS[ci % CABS.length]).then((cab) => {
      if (!cab) return;
      body.geometry.computeBoundingBox(); const bb = body.geometry.boundingBox, bs = bb.getSize(new T3());
      const longX = bs.x > bs.z, m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(), pos = new T3(), q = new THREE.Quaternion(), sc = new T3();
      const places = [];
      for (let i = 0; i < body.count; i++) {
        body.getMatrixAt(i, m4); w4.multiplyMatrices(body.matrixWorld, m4); w4.decompose(pos, q, sc);
        const ax = new T3(longX ? 1 : 0, 0, longX ? 0 : 1).applyQuaternion(q);
        const len = Math.max(bs.x * sc.x, bs.z * sc.z, 4.2);
        const ctr = bb.getCenter(new T3()).applyMatrix4(w4);
        const fy = floorY(ctr.x, ctr.z, ctr.y + 1) ?? pos.y;
        places.push({ x: ctr.x, y: fy, z: ctr.z, ry: Math.atan2(ax.x, ax.z), s: Math.min(len, 5) * 0.98 });
      }
      instance(cab, places, { name: 'up_cabs' });
      for (const sib of body.parent.children) if (sib.isInstancedMesh && sib.count === body.count) sib.visible = false;
    })));

    // ---- cherry trees for the pink balls (desktop: 44 trees of 18k triangles; phones keep the balls)
    if (!touch) {
      const crowns = [];
      gltf.scene.traverse((o) => { if (o.isInstancedMesh && /^t(pink2?|green)$/.test(o.material.name || '')) crowns.push(o); });
      pending.push(model('tree_cherry').then((tree) => {
        if (!tree || !crowns.length) return;
        const th = sizeOf(tree).y, places = [];
        for (const cr of crowns) {
          cr.geometry.computeBoundingBox(); const bb = cr.geometry.boundingBox, m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4();
          for (let i = 0; i < cr.count; i++) {
            cr.getMatrixAt(i, m4); w4.multiplyMatrices(cr.matrixWorld, m4);
            const top = new T3(0, bb.max.y, 0).applyMatrix4(w4), c = bb.getCenter(new T3()).applyMatrix4(w4);
            if (c.y < -10) continue;                 // the Blender templates parked under the ground
            const fy = floorY(c.x, c.z, top.y + 1) ?? 0;
            places.push({ x: c.x, y: fy - 0.05, z: c.z, ry: rnd() * 6.28, s: Math.max(4, top.y - fy) * 1.25 / th });
          }
          for (const sib of cr.parent.children) if (sib.isInstancedMesh && sib.count === cr.count) sib.visible = false;
        }
        instance(tree, places, { name: 'up_trees' });
      }));
    }

    // ---- the station clock under the dome: the centrepiece of the check in hall, hung over the eye's pupil
    pending.push(model('moynihan_clock').then((clk) => {
      if (!clk) return;
      const h = sizeOf(clk).y, s = 6.2 / h;
      const g = instance(clk, [{ x: 0, y: 11.2, z: 0, ry: 0, s }], { name: 'up_clock' });
      // the drop rod to the ring beam
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 8), new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.8, roughness: 0.35 }));
      rod.position.set(0, 11.2 + 6.2 + 3, 0); scene.add(rod);
      api.clock = g;
    }));

    // ---- check in desks: a stanchion queue in front of each, with a belt between posts
    const desks = [];
    gltf.scene.traverse((o) => { const m = /^desk(\d)_counter$/.exec(o.name); if (m) desks.push(o); });
    pending.push(model('penn_stanchion').then((st) => {
      if (!st || !desks.length) return;
      const hS = sizeOf(st).y, posts = [], belts = [];
      for (const d of desks) {
        const b = new THREE.Box3().setFromObject(d), c = b.getCenter(new T3());
        const out = new T3(c.x, 0, c.z).normalize();                 // desks face away from the drum's centre
        const tan = new T3(-out.z, 0, out.x);
        const lane = [];
        for (let k = 0; k < 5; k++) for (const side of [-1, 1]) {
          const p = c.clone().addScaledVector(out, 3.2 + k * 1.5).addScaledVector(tan, side * 1.1);
          lane.push(p);
          const f = floorY(p.x, p.z); if (f !== null) posts.push({ x: p.x, y: f, z: p.z, ry: 0, s: 1.0 / hS });
        }
        for (let k = 0; k < 4; k++) for (const side of [-1, 1]) belts.push([c.clone().addScaledVector(out, 3.2 + k * 1.5).addScaledVector(tan, side * 1.1), out]);
      }
      instance(st, posts, { name: 'up_stanchions' });
      const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.06, 1.5), new THREE.MeshStandardMaterial({ color: 0x1d3fbf, roughness: 0.6 }), belts.length);
      const M = new THREE.Matrix4();
      belts.forEach(([p, out], i) => { const ry = Math.atan2(out.x, out.z); const mid = p.clone().addScaledVector(out, 0.75); M.makeRotationY(ry).setPosition(mid.x, 0.95, mid.z); bm.setMatrixAt(i, M); });
      scene.add(bm);
    }));

    // ---- palms in planters round the drum, between the columns
    pending.push(model('cp_palm').then((pm) => {
      if (!pm) return;
      const hP = sizeOf(pm).y, places = [];
      for (let k = 0; k < 16; k++) {
        const a = (k + 0.5) / 16 * Math.PI * 2, r = 24.5, x = Math.sin(a) * r, z = Math.cos(a) * r;
        if (z > 18 && Math.abs(x) < 9) continue;                        // keep the entrance axis open
        const f = free(x, z, 0.9); if (f !== null) { places.push({ x, y: f, z, ry: a, s: 2.6 / hP }); solidBox(x, f, z, 1, 1.4, 1); }
      }
      for (const z of [-52, -84, -116, -146]) for (const x of [-10.2, 10.2]) {   // the concourse, between the hangs
        const f = free(x, z, 0.7); if (f !== null) { places.push({ x, y: f, z, ry: rnd() * 6, s: 2.2 / hP }); solidBox(x, f, z, 0.9, 1.4, 0.9); }
      }
      instance(pm, places, { name: 'up_palms' });
    }));

    // ---- benches: down the concourse facing the walls, and gate rows in each blossom pod
    pending.push(model('museum_bench').then((bn) => {
      if (!bn) return;
      const L = sizeOf(bn).x, places = [];
      for (let z = -58; z >= -142; z -= 14) for (const x of [-6.2, 6.2]) {
        const f = free(x, z, 1.2); if (f !== null) { places.push({ x, y: f, z, ry: Math.PI / 2, s: 2.4 / L }); solidBox(x, f, z, 0.7, 0.5, 2.4); }
      }
      const HUB = new T3(0, 0, -196);
      for (let k = 0; k < 7; k++) {          // the seven pods sit round the hub drum
        const a = Math.PI + (k - 3) * (Math.PI * 2 / 7.6), dir = new T3(Math.sin(a), 0, Math.cos(a)), tan = new T3(dir.z, 0, -dir.x);
        for (let row = 0; row < 3; row++) for (const off of [-2.7, 0, 2.7]) {
          const p = HUB.clone().addScaledVector(dir, 31 + row * 2.2).addScaledVector(tan, off);
          const f = free(p.x, p.z, 1.3); if (f !== null) { places.push({ x: p.x, y: f, z: p.z, ry: Math.atan2(tan.x, tan.z), s: 2.4 / L }); solidBox(p.x, f, p.z, 2.4, 0.5, 0.7, Math.atan2(tan.x, tan.z) + Math.PI / 2); }
        }
      }
      instance(bn, places, { name: 'up_benches' });
    }));

    // ---- luggage: at the feet of about half the travellers, and riding both carousels
    pending.push(model('penn_luggage').then((lg) => {
      if (!lg) return;
      const hL = sizeOf(lg).y, places = [];
      for (const t of travellers) {
        if (rnd() > 0.5) continue;
        const a = t.ry + Math.PI / 2, x = t.x + Math.sin(a) * 0.55, z = t.z + Math.cos(a) * 0.55;
        const f = floorY(x, z, t.y + 1.2); if (f !== null && Math.abs(f - t.y) < 0.2) places.push({ x, y: f, z, ry: t.ry + (rnd() - 0.5) * 0.6, s: (0.55 + rnd() * 0.2) / hL });
      }
      instance(lg, places, { name: 'up_luggage' });
      // carousels: a ring of bags at the belt, turning with it
      for (const [cx, cz] of [[51, -31], [73, -31]]) {
        const ring = new THREE.Group(); ring.position.set(cx, 0, cz); scene.add(ring);
        const ps = [];
        for (let k = 0; k < 11; k++) {
          const a = k / 11 * Math.PI * 2 + rnd() * 0.2, r = 4.15, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
          const f = floorY(x, z, 2.2); if (f === null || f < 0.5 || f > 1.2) continue;
          ps.push({ x: Math.sin(a) * r, y: f + 0.01, z: Math.cos(a) * r, ry: a + Math.PI / 2 + (rnd() - 0.5) * 0.5, s: (0.5 + rnd() * 0.15) / hL });
        }
        const g = instance(lg, ps, { name: 'up_carousel' }); if (g) { scene.remove(g); ring.add(g); }
        api.illusions.push({ update: (dt) => { ring.rotation.y += dt * 0.12; } });
      }
    }));

    // ---- the globe at arrivals, the world you just flew in from
    pending.push(model('globe_stand').then((gl) => {
      if (!gl) return;
      const x = 62, z = -19, f = free(x, z, 1.4);
      if (f === null) return;
      const s = 3.4 / sizeOf(gl).y, g = instance(gl, [{ x, y: f, z, ry: 0.4, s }], { name: 'up_globe' });
      solidBox(x, f, z, 2.2, 3, 2.2);
      api.globe = g;
    }));

    // ---- street lamps along the drop off kerb
    const lane = gltf.scene.getObjectByName('dropoff_lane');
    if (lane) pending.push(model('ph_street_lamp_01').then((lp) => {
      if (!lp) return;
      const b = new THREE.Box3().setFromObject(lane), places = [], hl = sizeOf(lp).y;
      const alongX = b.max.x - b.min.x > b.max.z - b.min.z;
      if (alongX) {
        for (let x = b.min.x + 6; x < b.max.x - 4; x += 12) for (const z of [b.max.z + 1.2]) { const f = free(x, z, 0.4); if (f !== null) { places.push({ x, y: f, z, ry: Math.PI, s: 6.5 / hl }); solidBox(x, f, z, 0.4, 3, 0.4); } }
      } else {
        for (let z = b.min.z + 6; z < b.max.z - 4; z += 12) for (const x of [b.min.x - 1.2]) { const f = free(x, z, 0.4); if (f !== null) { places.push({ x, y: f, z, ry: -Math.PI / 2, s: 6.5 / hl }); solidBox(x, f, z, 0.4, 3, 0.4); } }
      }
      instance(lp, places, { name: 'up_lamps' });
    }));
  }

  // ================================================================== 4. built: ceilings, signs, illusions
  if (UP.built) {
    const M = new THREE.Matrix4();
    const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1dc).multiplyScalar(2.4) });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.4, metalness: 0.6 });
    const DISC = new THREE.CircleGeometry(0.16, 20).rotateX(Math.PI / 2), RING = new THREE.RingGeometry(0.16, 0.24, 20).rotateX(Math.PI / 2);
    const lights = [];
    const ceilAt = (x, z, from = 2) => { const h = cast(new T3(x, from, z), new T3(0, 1, 0), 30); return h ? h.point.y : null; };
    // the concourse: oak baffles across both sides of the skylight, a row of downlights down each side
    const slats = [];
    for (let z = -44; z >= -148; z -= 0.9) {
      const cy = ceilAt(-7, z); if (cy === null || cy > 9.5) continue;
      slats.push([-7.4, cy, z], [7.4, cy, z]);
    }
    for (let z = -46; z >= -148; z -= 5) for (const x of [-10.2, 10.2]) { const cy = ceilAt(x, z); if (cy !== null && cy < 9.5) lights.push([x, cy - 0.42, z]); }
    if (slats.length) {
      const g = new THREE.BoxGeometry(8.6, 0.36, 0.09);
      const oak = new THREE.MeshLambertMaterial({ color: 0xc69a6b, emissive: 0x6b4a2c, emissiveIntensity: 0.9 });   // lit from below by the hall, not by the low sun
      texLoader.load(`${TEX}floor_d.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; oak.map = t; oak.needsUpdate = true; });
      const im = new THREE.InstancedMesh(g, oak, slats.length);
      slats.forEach(([x, y, z], i) => { M.makeTranslation(x, y - 0.2, z); im.setMatrixAt(i, M); }); scene.add(im);
    }
    // the hub and the arrivals hall: rings and grids of downlights
    for (const r of [7, 12.5, 17.5]) for (let k = 0, n = Math.round(r * 1.3); k < n; k++) {
      const a = k / n * Math.PI * 2, x = Math.sin(a) * r, z = -196 + Math.cos(a) * r, cy = ceilAt(x, z);
      if (cy !== null && cy < 9) lights.push([x, cy - 0.01, z]);
    }
    for (let x = 40; x <= 84; x += 5) for (let z = -48; z <= -12; z += 5) { const cy = ceilAt(x, z); if (cy !== null && cy < 8) lights.push([x, cy - 0.01, z]); }
    if (lights.length) {
      const d = new THREE.InstancedMesh(DISC, lampMat, lights.length), t = new THREE.InstancedMesh(RING, trimMat, lights.length);
      lights.forEach(([x, y, z], i) => { M.makeTranslation(x, y, z); d.setMatrixAt(i, M); t.setMatrixAt(i, M); });
      scene.add(d, t);
    }

    // ---- signs in the house type: black panels, acid type, the way an airport speaks
    await fontsReady;
    function signTex(lines, w = 1024, h = 256, { bg = '#0d0d0d', fg = '#d7ff1f', sub = '#f0f4f8' } = {}) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = fg; g.fillRect(0, h - 10, w, 10);
      let y = h * 0.5;
      g.textBaseline = 'middle'; g.textAlign = 'left';
      if (lines[1]) {
        g.font = `700 ${h * 0.36}px "Archivo Expanded", "Archivo Narrow", sans-serif`; g.fillStyle = fg; g.fillText(lines[0], h * 0.18, h * 0.36, w - h * 0.3);
        g.font = `400 ${h * 0.16}px "JetBrains Mono", monospace`; g.fillStyle = sub; g.fillText(lines[1], h * 0.2, h * 0.74, w - h * 0.3);
      } else {
        g.font = `700 ${h * 0.42}px "Archivo Expanded", "Archivo Narrow", sans-serif`; g.fillStyle = fg; g.fillText(lines[0], h * 0.18, y, w - h * 0.3);
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
    }
    const sign = (lines, x, y, z, ry, W = 4, H = 1, opts) => {
      const g = new THREE.Group();
      const face = new THREE.MeshBasicMaterial({ map: signTex(lines, 1024, Math.round(1024 * H / W), opts) });
      const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.14), [trimMat, trimMat, trimMat, trimMat, face, face]);
      g.add(box);
      g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
      return g;
    };
    const hang = (g, top) => {   // two drop rods to the ceiling
      for (const dx of [-0.4, 0.4]) {
        const W = g.children[0].geometry.parameters.width * dx, len = top - g.position.y;
        if (len <= 0.3) continue;
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), trimMat);
        rod.position.set(W, len / 2, 0); g.add(rod);
      }
    };
    // concourse wayfinding, hung from the slats
    for (const [z, l1, l2] of [[-50, 'GATES B1 TO B7', 'BLOSSOM HUB  ·  6 MIN WALK'], [-100, 'GALLERY CONCOURSE', 'fLOWers  ·  18 WORKS ON THE WALLS'], [-140, 'GATES B1 TO B7', 'BLOSSOM HUB  ·  1 MIN WALK']]) {
      const cy = ceilAt(0, z) ?? 7.9; const s = sign([l1, l2], 0, 5.1, z, 0, 6.4, 1.3); hang(s, Math.min(cy, 9) );
    }
    // check in: a sign over each desk
    let di = 0;
    gltf.scene.traverse((o) => {
      const m = /^desk(\d)_counter$/.exec(o.name); if (!m) return;
      const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new T3()), out = new T3(c.x, 0, c.z).normalize();
      const names = [['CHECK IN  B1 B2', 'MLOW AIR  ·  ALL DESTINATIONS'], ['CHECK IN  B3 B4', 'BAG DROP  ·  ONE CARRY ON'], ['CHECK IN  B5', 'fLOWers CLASS  ·  PRIORITY'], ['CHECK IN  B6 B7', 'NEW YORKERS  ·  RESIDENTS LANE']];
      const n = names[di++ % 4];
      const s = sign(n, c.x + out.x * 0.2, 4.4, c.z + out.z * 0.2, Math.atan2(out.x, out.z), 4.6, 1.0);
      hang(s, 7.5);
    });
    // arrivals: a number totem at each carousel
    [[51, -31, '1'], [73, -31, '2']].forEach(([x, z, n]) => {
      const tx = x, tz = z + 7.2, f = free(tx, tz, 0.5);
      if (f === null) return;
      const s = sign([`BAGGAGE ${n}`, 'MLOW AIR  ·  MW317  ·  NOW ARRIVING'], tx, f + 2.6, tz, 0, 3.2, 1.0, { fg: '#00e5ff' });
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.1, 0.16), trimMat); pole.position.set(0, -1.55, 0); s.add(pole);
      solidBox(tx, f, tz, 0.4, 2, 0.4);
    });
    // drop off: the kerb sign
    const lane = gltf.scene.getObjectByName('dropoff_lane');
    if (lane) {
      const b = new THREE.Box3().setFromObject(lane), c = b.getCenter(new T3());
      // on the median between the drop off lane and the boulevard, facing the cars coming in
      const sx = c.x + 22, sz = b.max.z + 3.2;
      const s = sign(['DEPARTURES', 'TERMINAL B  ·  BLOSSOM  ·  DROP OFF ONLY'], sx, 5.6, sz, 0, 7.5, 1.6, { bg: '#2962ff', fg: '#f0f4f8', sub: '#f0f4f8' });
      for (const dx of [-3.3, 3.3]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.8, 10), trimMat); p.position.set(dx, -2.4 - 0.8, 0); s.add(p); }
      for (const dx of [-3.3, 3.3]) solidBox(sx + dx, 0, sz, 0.3, 3, 0.3);
    }

    // ---- illusions: anamorphic paint. A small real 3D scene is rendered from one marked standpoint, and that render is
    // projected back onto the flat floor from the same point, so from the mark it stands up in 3D and from anywhere else
    // it is a smear of paint. One per hall.
    function anamorph({ eye, target, rect, y = 0.17, build, res = 1024, mark = true, fov = 60 }) {
      const cam = new THREE.PerspectiveCamera(fov, 1, 0.1, 200); cam.position.copy(eye); cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      const mini = new THREE.Scene(); build(mini);
      const rt = new THREE.WebGLRenderTarget(res, res, { samples: 4 });
      const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(mini, cam);
      renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA);
      const [x0, x1, z0, z1] = rect, nx = 48, nz = 48;
      const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
      const p = geo.attributes.position, uv = geo.attributes.uv, v = new T3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).project(cam); uv.setXY(i, v.x * 0.5 + 0.5, v.y * 0.5 + 0.5); }
      const mat = new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false });
      mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nif (vMapUv.x < 0. || vMapUv.x > 1. || vMapUv.y < 0. || vMapUv.y > 1.) discard;'); };
      const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 1; scene.add(mesh);
      if (mark) {   // the footprints: stand here
        const fp = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd7ff1f }));
        fp.position.set(eye.x, y + 0.005, eye.z); scene.add(fp);
      }
      api.illusions.push({ eye, mesh });
      return mesh;
    }
    api.anamorph = anamorph;
    const lit = (s, k = 1) => { s.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6 * k)); const d = new THREE.DirectionalLight(0xffffff, 2.2 * k); d.position.set(-3, 8, 5); s.add(d); };
    // the check in hall: block letters WELCOME TO NEW YORK standing on the floor, seen from the door mark
    const letterBlocks = (s0, text, at, h, color, ry = 0) => {
      const s = new THREE.Group(); s.position.copy(at); s.rotation.y = ry; s0.add(s); at = new T3(0, 0, 0);
      const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'center';
      let px = 200; do { g.font = `700 ${px}px "Archivo Expanded", sans-serif`; px -= 6; } while (g.measureText(text).width > 1960 && px > 40);
      g.fillText(text, 1024, 135);
      const tm = new THREE.CanvasTexture(c);
      const front = new THREE.MeshStandardMaterial({ color, map: tm, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide });
      const w = h * 8;
      for (let k = 0; k < 7; k++) {   // extrude by stacking the cut out letters: cheap, solid from the front
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), k === 0 ? front : new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.45), map: tm, alphaTest: 0.5, side: THREE.DoubleSide }));
        m.position.set(at.x, at.y + h / 2, at.z - k * 0.03); s.add(m);
      }
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.9), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, map: tm, alphaTest: 0.5 }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.set(at.x + 0.2, at.y + 0.002, at.z - 0.2 - h * 0.45); s.add(shadow);
    };
    anamorph({
      eye: new T3(0, 1.65 + 0.17, 23), target: new T3(0, 0.3, 13), rect: [-6, 6, 10, 16.5], fov: 55, mark: false,   // the mark is the spawn itself
      build: (s) => { lit(s); letterBlocks(s, 'WELCOME TO NEW YORK', new T3(0, 0.17, 15.2), 0.55, 0x2962ff); },
    });
    // the concourse: a shaft opens in the floor onto open sky, seen from its mark
    anamorph({
      eye: new T3(-3.4, 1.8, -61.6), target: new T3(-3.4, -5, -66), rect: [-4.7, -2.1, -69.6, -63.1], fov: 60,
      build: (s) => {
        lit(s, 0.55);
        const W = 1.9, L = 5.5, D = 7, z0 = -63.5, x0 = -3.4, y0 = 0.17;
        const gc = document.createElement('canvas'); gc.width = 8; gc.height = 256; const gg = gc.getContext('2d');
        const gr = gg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c9c4ba'); gr.addColorStop(0.18, '#6d6a64'); gr.addColorStop(0.6, '#26272c'); gr.addColorStop(1, '#5d86d8');
        gg.fillStyle = gr; gg.fillRect(0, 0, 8, 256); const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
        const wall = new THREE.MeshBasicMaterial({ map: gt }), dark = new THREE.MeshBasicMaterial({ color: 0x141518 });
        const add = (geo, mat, x, y, z, rx = 0, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); };
        add(new THREE.PlaneGeometry(L, D), wall, x0 - W / 2, y0 - D / 2, z0 - L / 2, 0, Math.PI / 2);
        add(new THREE.PlaneGeometry(L, D), wall, x0 + W / 2, y0 - D / 2, z0 - L / 2, 0, -Math.PI / 2);
        add(new THREE.PlaneGeometry(W, D), wall, x0, y0 - D / 2, z0 - L);
        // the bottom of the shaft is open sky, with MW317 passing far below
        const kc = document.createElement('canvas'); kc.width = 256; kc.height = 512; const kg = kc.getContext('2d');
        const sg = kg.createLinearGradient(0, 0, 0, 512); sg.addColorStop(0, '#9cc4ff'); sg.addColorStop(1, '#3f78e0'); kg.fillStyle = sg; kg.fillRect(0, 0, 256, 512);
        kg.fillStyle = 'rgba(255,255,255,0.85)'; for (const [cx, cy, r] of [[60, 120, 40], [95, 110, 34], [190, 330, 46], [150, 345, 30], [40, 430, 26]]) { kg.beginPath(); kg.arc(cx, cy, r, 0, 7); kg.fill(); }
        kg.fillStyle = '#ffffff'; kg.save(); kg.translate(150, 220); kg.rotate(-0.5); kg.fillRect(-4, -26, 8, 52); kg.fillRect(-24, -4, 48, 8); kg.fillRect(-10, 20, 20, 5); kg.restore();
        const st = new THREE.CanvasTexture(kc); st.colorSpace = THREE.SRGBColorSpace;
        add(new THREE.PlaneGeometry(W, L), new THREE.MeshBasicMaterial({ map: st }), x0, y0 - D, z0 - L / 2, -Math.PI / 2);
        const lip = new THREE.MeshBasicMaterial({ color: 0xf2efe8 }), line = new THREE.MeshBasicMaterial({ color: 0xd7ff1f });
        for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(0.22, L + 0.44), lip, x0 + sx * (W / 2 + 0.11), y0 + 0.001, z0 - L / 2, -Math.PI / 2);
        add(new THREE.PlaneGeometry(W + 0.44, 0.22), lip, x0, y0 + 0.001, z0 + 0.11, -Math.PI / 2);
        add(new THREE.PlaneGeometry(W + 0.44, 0.22), lip, x0, y0 + 0.001, z0 - L - 0.11, -Math.PI / 2);
        add(new THREE.PlaneGeometry(W + 0.44, 0.08), line, x0, y0 + 0.002, z0 + 0.3, -Math.PI / 2);
        const rail = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.6, roughness: 0.3 });
        for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.06, L), rail, x0 + sx * (W / 2 - 0.15), y0 + 0.9, z0 - L / 2);
        const sgn = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.4), new THREE.MeshBasicMaterial({ map: signTex(['MIND THE DROP'], 1024, 232) }));
        sgn.position.set(x0, y0 - 0.9, z0 - L + 0.02); s.add(sgn);
      },
    });
    // the gate hub: the evil eye, floating as a cloud of shards that only come together from the blossom mark
    (async () => {
      const img = await new THREE.TextureLoader().loadAsync('eye_truecolor.png').catch(() => null);
      if (!img) return;
      img.colorSpace = THREE.SRGBColorSpace;
      // the cloud floats in the neck, 6 to 11 m from the mark, and ends before the sculpture plinths begin (z -186)
      const eye = new T3(0, 1.65 + 0.15, -172), dir = new T3(0, 0.15, -1).normalize();
      const N = 9, group = new THREE.Group(); group.name = 'up_eye_shards';
      const fovH = 12;                          // the eye fills 12 m at 20 m: about 33 degrees across
      const right = new T3(-dir.z, 0, dir.x).normalize(), upv = new T3().crossVectors(right, dir).normalize();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const d = 6 + rnd() * 5;              // depth along the line of sight, 6 to 11 m
        const size = fovH * d / 20 / N;
        const geo = new THREE.PlaneGeometry(size, size);
        const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + uv.getX(k)) / N, (j + uv.getY(k)) / N);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: img, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true }));
        const ox = ((i + 0.5) / N - 0.5) * fovH * d / 20, oy = ((j + 0.5) / N - 0.5) * fovH * d / 20;
        m.position.copy(eye).addScaledVector(dir, d).addScaledVector(right, ox).addScaledVector(upv, oy);
        m.lookAt(eye); group.add(m);
      }
      scene.add(group);
      const fp = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd7ff1f })); fp.position.set(eye.x, 0.18, eye.z); scene.add(fp);
      api.illusions.push({ eye, mesh: group, update: (dt, t) => { group.children.forEach((m, k) => { m.position.y += Math.sin(t * 0.6 + k) * 0.0008; }); } });
    })();
    // arrivals: a peripheral drift rug (Kitaoka's rotating snakes) round the globe: it is still, it seems to turn
    {
      const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
      g.fillStyle = '#f0f4f8'; g.fillRect(0, 0, 1024, 1024);
      const cols = ['#0d0d0d', '#2962ff', '#f0f4f8', '#d7ff1f'];
      for (let ring = 0; ring < 7; ring++) {
        const r0 = 120 + ring * 55, r1 = r0 + 55, n = 24 + ring * 6;
        for (let k = 0; k < n; k++) for (let q = 0; q < 4; q++) {
          const a0 = ((k + q / 4) / n) * Math.PI * 2 + ring * 0.13, a1 = a0 + Math.PI * 2 / n / 4;
          g.fillStyle = cols[(q + (ring % 2) * 2) % 4]; g.beginPath(); g.arc(512, 512, r1, a0, a1); g.arc(512, 512, r0, a1, a0, true); g.closePath(); g.fill();
        }
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
      const f = floorY(62, -19);
      if (f !== null) {
        const rug = new THREE.Mesh(new THREE.CircleGeometry(5.6, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -2, color: 0xd8d8d8 }));
        rug.position.set(62, f + 0.01, -19); rug.renderOrder = 1; scene.add(rug);
      }
    }
    // drop off: a floating zebra crossing (blocks that hover over the road, painted flat), seen from the kerb mark
    if (lane) {
      const b = new THREE.Box3().setFromObject(lane), cx = (b.min.x + b.max.x) / 2;
      const alongX = b.max.x - b.min.x > b.max.z - b.min.z;
      if (alongX) {
        const zc = (b.min.z + b.max.z) / 2, half = (b.max.z - b.min.z) / 2;
        const eyeP = new T3(cx + 4, 1.8, b.max.z + 3.5);
        const fy = floorY(cx + 4, zc) ?? 0.05;
        anamorph({
          eye: eyeP, target: new T3(cx + 4, 0, zc - 2), rect: [cx - 1, cx + 9, b.min.z - 2, b.max.z + 1], y: fy + 0.03, fov: 70,
          build: (s) => {
            lit(s);
            for (let k = 0; k < 6; k++) {
              const x = cx + 0.4 + k * 1.3;
              const blk = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, half * 2 - 0.4), new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.7 }));
              blk.position.set(x, fy + 0.03 + 0.28, zc); s.add(blk);
              const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, half * 2 - 0.4), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
              sh.rotation.x = -Math.PI / 2; sh.position.set(x + 0.55, fy + 0.031, zc - 0.25); s.add(sh);
            }
          },
        });
      }
    }
  }

  // ================================================================== Firefly plates (queued in FIREFLY_QUEUE.md)
  // Each is invisible until its file lands in assets/ff/; dropping the file in is all it takes.
  if (UP.built) {
    const ff = (file, w, h, x, y, z, ry) => new THREE.TextureLoader().load(`assets/ff/${file}`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: 0xe8e8e8 }));
      m.position.set(x, y, z); m.rotation.y = ry; scene.add(m);
    }, undefined, () => {});
    ff('arrivals_mural.webp', 12, 1.5, 62, 3.82, -51.62, 0);      // a frieze over the census works on the back wall of arrivals, never behind them
  }

  // ================================================================== 5. the apron
  if (UP.props) {
    pending.push(model('ph_concrete_road_barrier').then((br) => {     // the airside line along the north edge of the apron
      if (!br) return;
      const L = sizeOf(br).x, places = [];
      for (let x = 30; x <= 146; x += 1.62) { const f = free(x, -151, 0.5); if (f !== null) places.push({ x, y: f, z: -151, ry: 0, s: 1.6 / L }); }
      instance(br, places, { name: 'up_barriers' });
      if (places.length) solidBox((places[0].x + places.at(-1).x) / 2, places[0].y, -151, places.at(-1).x - places[0].x + 1.6, 0.9, 0.7);
    }));
    pending.push(model('penn_luggage').then((lg) => {          // a baggage train: four dollies of bags behind a tug
      if (!lg) return;
      const hL = sizeOf(lg).y, bags = [], deck = [], z = -266;
      const dolly = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.5 }), tug = new THREE.MeshStandardMaterial({ color: 0xd7ff1f, roughness: 0.45 });
      const f0 = floorY(70, z); if (f0 === null) return;
      for (let k = 0; k < 4; k++) {
        const x = 64 + k * 3.4;
        const d = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.7), dolly); d.position.set(x, f0 + 0.55, z); scene.add(d);
        for (const wx of [-1.1, 1.1]) for (const wz of [-0.7, 0.7]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 14).rotateX(Math.PI / 2), dolly); w.position.set(x + wx, f0 + 0.22, z + wz); scene.add(w); }
        for (let b = 0; b < 4; b++) bags.push({ x: x - 0.8 + (b % 2) * 1.5, y: f0 + 0.61, z: z - 0.4 + (b >> 1) * 0.8, ry: rnd() * 0.4, s: (0.55 + rnd() * 0.15) / hL });
        solidBox(x, f0, z, 2.9, 1.2, 1.8);
      }
      const t = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 1.6), tug); t.position.set(61, f0 + 0.85, z); scene.add(t); solidBox(61, f0, z, 2.4, 1.5, 1.6);
      instance(lg, bags, { name: 'up_baggage_train' });
    }));
  }
  if (UP.built) {
    const a = new T3(95, 0, -258), dir = new T3(-Math.sin(1.9911), 0, -Math.cos(1.9911));
    const at = a.clone().addScaledVector(dir, 10); at.y = (floorY(at.x, at.z) ?? 0.05) + 0.03;
    const sp = (floorY(95, -258) ?? 0.05) + 1.65;
    const eye = new T3(95, sp, -258);
    // anamorphic: STAND B4 standing on the tarmac, from the apron spot
    const lb = (s) => {
      const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'center';
      let px = 210; do { g.font = `700 ${px}px "Archivo Expanded", sans-serif`; px -= 6; } while (g.measureText('STAND B4').width > 1960 && px > 40);
      g.fillText('STAND B4', 1024, 135);
      const tm = new THREE.CanvasTexture(c), h = 0.8, w = h * 8, grp = new THREE.Group();
      grp.position.copy(at); grp.rotation.y = Math.atan2(-dir.x, -dir.z); s.add(grp);
      for (let k = 0; k < 9; k++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: k ? 0x8a9a10 : 0xd7ff1f, map: tm, alphaTest: 0.5, side: THREE.DoubleSide }));
        m.position.set(0, h / 2, -k * 0.035); grp.add(m);
      }
      s.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.3)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(-40, 30, 20); s.add(d);
    };
    // the paint must reach the far end of the letters' shadow on the ground: a generous rect round the spot of standing
    api.anamorph({ eye, target: at.clone().setY(at.y + 0.6), rect: [at.x - 11, at.x + 4, at.z - 6, at.z + 11], y: at.y, fov: 60, mark: false, res: 2048, build: lb });
  }

  // ================================================================== settle: colliders, probes
  const all = Promise.all(pending).then(() => {
    if (solids.length && ctx.addSolids) ctx.addSolids(solids);
    // probes after the models land, then again once the late textures arrive
    setTimeout(captureProbes, 300); setTimeout(() => { captureProbes(); lastHall = undefined; }, 4000);
    api.loaded = true;
  });
  api.ready = all;
  let tt = 0;
  api.update = (dt) => {
    tt += dt;
    if (UP.look && !touch && api.probes.length) pickProbe();
    for (const il of api.illusions) il.update?.(dt, tt);
  };
  return api;
}
