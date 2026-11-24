// look.js, THE LOOK for the bodega (2026-11-23). Ported from the museum's look.ts and the Gary tower's real.js.
// The rooms read as a game level for three reasons this file fixes once for every room:
//   1. Nothing reflected anything: there was no environment at all, so the enamel, the chrome rims, the glass and the
//      checker floor were lit only by point lights. Each room now photographs itself from eye height with a cube
//      camera once its models have landed, and that photograph is its environment (reflections and one bounce).
//   2. Textures smeared at grazing angles: every texture gets the GPU's full anisotropic filtering.
//   3. Nothing sat in its corners: a screen space ambient occlusion pass darkens creases, feet and shelf backs,
//      and a calm display space grade (soft curve, warm highlights, cool shadows, vignette, fine grain) finishes it.
// The artworks are never graded or tone mapped: their materials write alpha 0.5 into the scene target and the
// finish passes those pixels through untouched, so a New Yorker shows exactly as it was painted.
// Desktop only. Phones (a coarse pointer) and ?look=0 render exactly as before.
import * as THREE from './vendor/three.module.js';

const Q = new URLSearchParams(location.search), MODE = Q.get('look');
const coarse = matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
export const LOOK = { on: MODE !== '0' && !coarse };

// eye height probe spots per room, world coordinates
const SPOTS = { store: [0, 1.7, 2.2], walk: [0, 1.7, 2.2], overview: [0, 1.7, 2.2], archive: [0, 1.9, -22], laundry: [-34, 1.8, 0.6], mail: [34, 1.8, 2.4], roof: [0, 1.8, 40] };
const ENV = { store: .45, archive: .55, laundry: .28, mail: .4, roof: .25 };
const AO = { store: .85, archive: .8, laundry: .85, mail: .85, roof: .55 };

const quadGeo = new THREE.BufferGeometry();
quadGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
quadGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

const aoFrag = `uniform sampler2D tDepth;uniform float uRadius,uPower;uniform mat4 uProj,uInv;varying vec2 vUv;
vec3 viewPos(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 p=uInv*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){float d0=texture2D(tDepth,vUv).x;if(d0>=.99999){gl_FragColor=vec4(1.);return;}
vec3 P=viewPos(vUv);vec3 N=normalize(cross(dFdx(P),dFdy(P)));float a0=h(gl_FragCoord.xy)*6.2831,occ=0.;
vec3 T=normalize(abs(N.y)<.9?cross(N,vec3(0.,1.,0.)):cross(N,vec3(1.,0.,0.))),B=cross(N,T);
for(int i=0;i<16;i++){float fi=float(i),a=a0+fi*2.3999,r=(fi+.5)/16.,z=sqrt(1.-r);
vec3 s=P+(T*cos(a)*sqrt(r)+B*sin(a)*sqrt(r)+N*z)*uRadius*mix(.15,1.,r*r);vec4 q=uProj*vec4(s,1.);vec2 suv=q.xy/q.w*.5+.5;
float sz=viewPos(suv).z;float range=smoothstep(0.,1.,uRadius/abs(P.z-sz));occ+=(sz>=s.z+.02?1.:0.)*range;}
gl_FragColor=vec4(vec3(pow(clamp(1.-occ/16.,0.,1.),uPower)),1.);}`;

const blurFrag = `uniform sampler2D tAO;uniform vec2 uTexel;varying vec2 vUv;void main(){float s=0.;
for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++)s+=texture2D(tAO,vUv+vec2(float(x),float(y))*uTexel).r;gl_FragColor=vec4(vec3(s/25.),1.);}`;

const finishFrag = `uniform sampler2D tScene,tAO;uniform float uExposure,uAO,uTime;uniform vec2 uRes;varying vec2 vUv;
vec3 RRT(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.4329510)+.238081;return a/b;}
vec3 aces(vec3 c){const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
c*=uExposure/.6;c=I*c;c=RRT(c);c=O*c;return clamp(c,0.,1.);}
vec3 srgb(vec3 c){return mix(pow(c,vec3(1./2.4))*1.055-.055,c*12.92,vec3(lessThanEqual(c,vec3(.0031308))));}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec4 s=texture2D(tScene,vUv);
if(s.a<.75){gl_FragColor=vec4(srgb(clamp(s.rgb,0.,1.)),1.);return;}
vec3 c=s.rgb*mix(1.,texture2D(tAO,vUv).r,uAO);c=srgb(aces(c));
float l=dot(c,vec3(.2126,.7152,.0722));vec3 sc=c*c*(3.-2.*c);c=mix(c,sc,.14);
c+=vec3(.022,.008,-.018)*smoothstep(.45,1.,l);c+=vec3(-.012,0.,.02)*(1.-smoothstep(0.,.35,l));
float l2=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l2),c,1.04);
vec2 q=(vUv-.5)*vec2(uRes.x/uRes.y,1.);c*=1.-.26*smoothstep(.35,1.05,length(q));
c+=(h(vUv*uRes+fract(uTime*7.13)*91.7)-.5)*.018*(1.-abs(l*2.-1.));
gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;

const vert = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';

export function makeLook(renderer, scene, camera) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const look = { on: LOOK.on, probes: {}, current: 'store', baked: {}, art: new Set() };
  // 2. finish: full anisotropy, run again whenever models land
  look.finish = () => {
    const keys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap'];
    scene.traverse(o => {
      if (!o.material) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        for (const k of keys) { const t = m[k]; if (t && t.anisotropy < aniso) { t.anisotropy = aniso; if (t.image) t.needsUpdate = true; } }
        if (look.on && m.toneMapped === false && !m.transparent && !look.art.has(m)) {
          // the art mask: alpha 0.5 into the scene target, no blending (one, zero), colour untouched
          look.art.add(m); m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.ZeroFactor; m.opacity = .5; m.needsUpdate = true;
        }
      }
    });
  };
  if (!look.on) {
    look.render = () => renderer.render(scene, camera);
    look.room = () => {}; look.resize = () => {}; look.bake = () => {};
    return look;
  }
  // 1. the room probe
  const pmrem = new THREE.PMREMGenerator(renderer);
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(.1, 160, cubeRT);
  look.bake = (id) => {
    const spot = SPOTS[id] || SPOTS.store, fog = scene.fog, env = scene.environment;
    scene.fog = null; scene.environment = null;
    cubeCam.position.set(...spot); cubeCam.update(renderer, scene);
    scene.fog = fog; scene.environment = env;
    const pm = pmrem.fromCubemap(cubeRT.texture);
    const key = id === 'walk' || id === 'overview' ? 'store' : id;
    if (look.probes[key]) look.probes[key].dispose();
    look.probes[key] = pm;
    if (look.current === key) { scene.environment = pm.texture; scene.environmentIntensity = ENV[key] ?? .5; }
  };
  look.room = (id, ready) => {
    const key = id === 'walk' || id === 'overview' ? 'store' : id; look.current = key;
    finishU.uAO.value = AO[key] ?? .8;
    if (look.probes[key]) { scene.environment = look.probes[key].texture; scene.environmentIntensity = ENV[key] ?? .5; }
    else scene.environment = null;
    // take it twice: once the room is in place, and again for the textures and models that land late
    if (!look.baked[key]) {
      look.baked[key] = true;
      Promise.resolve(ready).then(() => {
        setTimeout(() => { look.finish(); if (look.current === key) look.bake(key); }, 600);
        setTimeout(() => { look.finish(); if (look.current === key) look.bake(key); }, 3500);
      });
    }
  };
  // 3. ambient occlusion and the grade
  const size = new THREE.Vector2();
  const depth = new THREE.DepthTexture(1, 1); depth.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthTexture: depth });
  const aoA = new THREE.WebGLRenderTarget(1, 1), aoB = new THREE.WebGLRenderTarget(1, 1);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pass = (frag, uniforms) => { const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false }); const s = new THREE.Scene(); const q = new THREE.Mesh(quadGeo, m); q.frustumCulled = false; s.add(q); return { m, s }; };
  const aoU = { tDepth: { value: depth }, uProj: { value: new THREE.Matrix4() }, uInv: { value: new THREE.Matrix4() }, uRadius: { value: .5 }, uPower: { value: 1.35 } };
  const blurU = { tAO: { value: aoA.texture }, uTexel: { value: new THREE.Vector2() } };
  const finishU = { tScene: { value: rt.texture }, tAO: { value: aoB.texture }, uExposure: { value: renderer.toneMappingExposure }, uAO: { value: .85 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2() } };
  const aoP = pass(aoFrag, aoU), blurP = pass(blurFrag, blurU), finP = pass(finishFrag, finishU);
  look.resize = () => {
    renderer.getDrawingBufferSize(size);
    rt.setSize(size.x, size.y); aoA.setSize(size.x >> 1, size.y >> 1); aoB.setSize(size.x >> 1, size.y >> 1);
    blurU.uTexel.value.set(1 / (size.x >> 1), 1 / (size.y >> 1)); finishU.uRes.value.copy(size);
  };
  look.resize();
  look.render = (t = 0) => {
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    aoU.uProj.value.copy(camera.projectionMatrix); aoU.uInv.value.copy(camera.projectionMatrixInverse);
    renderer.setRenderTarget(aoA); renderer.render(aoP.s, ortho);
    renderer.setRenderTarget(aoB); renderer.render(blurP.s, ortho);
    finishU.uTime.value = t; finishU.uExposure.value = renderer.toneMappingExposure;
    renderer.setRenderTarget(null); renderer.render(finP.s, ortho);
  };
  return look;
}
