import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PHONE } from './scan';

/* THE LOOK for the loft (2026-11-23), the museum's look.ts and the Gary tower's real.js ported to this engine.
   1. A room probe: once the loft and its art have loaded, a cube camera at eye height in the middle of the aisle
      photographs the loft itself, and that becomes the environment every surface reflects and is lit by, matched
      in brightness to the generic RoomEnvironment it replaces. The glass, the brass and the polished boards show
      this room, not a studio softbox.
   2. Finish: full anisotropy on every texture, so the long boards and the brick stay sharp to the back wall.
   3. Soft ambient occlusion (GTAO, desktop only): creases, feet, the undersides of joists and the backs of frames.
   4. Grade, in display space: a soft curve, warm highlights and cool shadows, a soft vignette, fine grain.
   Desktop only for 3 and 4; phones keep the plain renderer. `?look=0` restores the old look in full. */
const MODE = new URLSearchParams(location.search).get('look');
export const LOOK_ON = MODE !== '0';

const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
function measure(renderer: T.WebGLRenderer, scene: T.Scene, at: T.Vector3) {
  const rt = new T.WebGLCubeRenderTarget(16, { type: T.HalfFloatType });
  const cam = new T.CubeCamera(0.1, 200, rt);
  cam.position.copy(at);
  cam.update(renderer, scene);
  const px = new Uint16Array(16 * 16 * 4);
  let sum = 0;
  for (let f = 0; f < 6; f++) {
    renderer.readRenderTargetPixels(rt as unknown as T.WebGLRenderTarget, 0, 0, 16, 16, px, f);
    for (let i = 0; i < px.length; i += 4) {
      const v = lum(T.DataUtils.fromHalfFloat(px[i]), T.DataUtils.fromHalfFloat(px[i + 1]), T.DataUtils.fromHalfFloat(px[i + 2]));
      if (Number.isFinite(v)) sum += Math.min(v, 50);
    }
  }
  rt.dispose();
  return sum / (6 * 16 * 16);
}

export function bakeProbe(renderer: T.WebGLRenderer, scene: T.Scene, at: T.Vector3) {
  if (!LOOK_ON) return;
  const ref = scene.environment, refI = scene.environmentIntensity;
  // what the old environment gives on its own, to match
  const tmp = new T.Scene(); tmp.background = ref; tmp.backgroundBlurriness = 1;
  const target = ref ? measure(renderer, tmp, new T.Vector3()) * refI : 0;
  const crt = new T.WebGLCubeRenderTarget(256, { type: T.HalfFloatType });
  const cam = new T.CubeCamera(0.1, 200, crt);
  cam.position.copy(at);
  cam.update(renderer, scene);
  const seen = measure(renderer, scene, at);
  const pm = new T.PMREMGenerator(renderer);
  const env = pm.fromCubemap(crt.texture);
  crt.dispose(); pm.dispose();
  scene.environment = env.texture;
  const k = target > 0 && seen > 0 ? target / seen : 1;
  scene.environmentIntensity = Math.min(2.5, Math.max(0.3, k));
}

const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap'] as const;
export function finish(renderer: T.WebGLRenderer, scene: T.Scene) {
  if (!LOOK_ON) return;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const done = new WeakSet<T.Material>();
  scene.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      if (!mat || done.has(mat)) continue;
      done.add(mat);
      const r = mat as unknown as Record<string, T.Texture | null>;
      for (const k of TEX_KEYS) { const t = r[k]; if (t && t.anisotropy < aniso) { t.anisotropy = aniso; t.needsUpdate = true; } }
    }
  });
}

function gradePass() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new T.Vector2(1280, 720) } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec3 c=texture2D(tDiffuse,vUv).rgb;
  float l=dot(c,vec3(.2126,.7152,.0722));
  vec3 s=c*c*(3.-2.*c);
  c=mix(c,s,.14);
  c+=vec3(.02,.008,-.016)*smoothstep(.45,1.,l);
  c+=vec3(-.01,.0,.018)*(1.-smoothstep(.0,.35,l));
  float l2=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l2),c,1.04);
  vec2 q=(vUv-.5)*vec2(uRes.x/uRes.y,1.);
  c*=1.-.24*smoothstep(.4,1.1,length(q));
  float g=h(vUv*uRes+fract(uTime*7.13)*91.7)-.5;
  c+=g*.016*(1.-abs(l*2.-1.));
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`,
  });
}

/** The renderer's last step. On a phone or with ?look=0 it is a plain render. */
export function makeLook(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera) {
  if (!LOOK_ON || PHONE) {
    return { render: () => renderer.render(scene, camera), setSize: (_w: number, _h: number) => {}, composer: null as EffectComposer | null };
  }
  const rt = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.blendIntensity = 0.85;
  ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  composer.addPass(ao);
  composer.addPass(new OutputPass());
  const grade = gradePass();
  composer.addPass(grade);
  return {
    composer,
    render: () => { grade.uniforms.uTime.value = performance.now() / 1000; composer.render(); },
    setSize: (w: number, h: number) => {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      (grade.uniforms.uRes.value as T.Vector2).set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    },
  };
}
