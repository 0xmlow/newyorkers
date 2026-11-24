/* look.ts — THE LOOK for every room at once (2026-11-23).

   What the museum had: standard materials, ACES, a shadow casting sun, GTAO,
   bloom, SMAA. What gave it away: every room, a marble rotunda or a subway
   platform, reflected the same three photographed city skies, so polished
   floors, glass, gilt frames and brass showed a street that is not there and
   never the room they stand in. The work on MEME ISLAND and the Gary tower
   taught that the passes which change every frame (light, reflections, grade)
   are the ones people notice; single features are not.

   1. A room probe. Once the room has loaded, a cube camera at eye height
      photographs the room itself, with the real city sky behind any opening,
      and that becomes the room's reflections and ambient light. Its brightness
      is measured and matched to the light the room had before, so no room goes
      dark or washes out because its walls are black or white.
   2. Finish. Every texture gets full anisotropic filtering, so floors and
      long walls stay sharp at grazing angles instead of smearing, and large
      floors that were already somewhat smooth get a little polish so they pick
      up the room.
   3. Grade. A last pass in display space: a soft vignette, a gentle contrast
      curve, warm highlights and cool shadows, and a fine grain that keeps the
      flat colour fields from banding. The calm lens, nothing that reads as a
      filter.

   High path only. `?look=0` restores the old look in full; `?look=probe`,
   `?look=finish`, `?look=grade` switch on one piece alone for comparison. */
import * as T from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const MODE = params.get('look');
export const LOOK = {
  probe: MODE === null || MODE === '1' || MODE === 'probe',
  finish: MODE === null || MODE === '1' || MODE === 'finish',
  grade: MODE === null || MODE === '1' || MODE === 'grade',
};

/* ---------- 1. the room probe ---------- */
const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/* average radiance seen by a small cube camera at `at`, in linear units */
function measure(renderer: T.WebGLRenderer, scene: T.Scene, at: T.Vector3): number {
  const rt = new T.WebGLCubeRenderTarget(16, { type: T.HalfFloatType });
  const cam = new T.CubeCamera(0.1, 1200, rt);
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

export class Probe {
  private pmrem: T.PMREMGenerator;
  private rt: T.WebGLRenderTarget | null = null;
  private live = true;
  constructor(private renderer: T.WebGLRenderer, private scene: T.Scene) {
    this.pmrem = new T.PMREMGenerator(renderer);
  }
  /* `sky` is the photographed sky the room already lights with (an equirect texture), used behind openings;
     `ref` is the environment and intensity the room had, so the probe can be matched to it */
  bake(at: T.Vector3, sky: T.Texture | null, refEnv: T.Texture | null, refIntensity: number) {
    if (!this.live) return;
    const s = this.scene;
    const hidden: T.Object3D[] = [];
    /* glints, markers and the sky dome stay out of the photograph; the dome is replaced by the real sky */
    s.traverse((o) => {
      if (!o.visible) return;
      const big = (o as T.Mesh).geometry?.boundingSphere?.radius ?? 0;
      if ((o as T.Sprite).isSprite || o.userData.noProbe || ((o as T.Mesh).isMesh && o.renderOrder === -10 && big > 500)) { o.visible = false; hidden.push(o); }
    });
    const bg = s.background, env = s.environment, ei = s.environmentIntensity, fog = s.fog;
    if (sky) { s.background = sky; s.backgroundIntensity = 1; }
    s.fog = null;
    /* the room as it is now lit by the old environment: what the probe should match */
    s.environment = refEnv; s.environmentIntensity = refIntensity;
    const target = refEnv ? Math.max(1e-4, this.avgEnv(refEnv) * refIntensity) : 0;
    const crt = new T.WebGLCubeRenderTarget(256, { type: T.HalfFloatType, generateMipmaps: false });
    const cam = new T.CubeCamera(0.1, 1200, crt);
    cam.position.copy(at);
    cam.update(this.renderer, s);
    const seen = measure(this.renderer, s, at);
    const pm = this.pmrem.fromCubemap(crt.texture);
    crt.dispose();
    s.background = bg; s.fog = fog;
    for (const o of hidden) o.visible = true;
    this.rt?.dispose();
    this.rt = pm;
    s.environment = pm.texture;
    /* what a surface sees from the probe is the room's own radiance; scale it so the ambient level matches
       what the old environment gave (target), clamped so a black box or a white box stays within reason */
    const k = target > 0 && seen > 0 ? target / seen : 1;
    s.environmentIntensity = Math.min(3.5, Math.max(0.35, k));
    void env; void ei;
  }
  /* mean radiance of a PMREM environment, from its smallest mip, read through a tiny cube render */
  private avgEnv(tex: T.Texture): number {
    const tmp = new T.Scene();
    tmp.background = tex;
    tmp.backgroundBlurriness = 1;
    return measure(this.renderer, tmp, new T.Vector3());
  }
  dispose() {
    this.live = false;
    this.rt?.dispose();
    this.pmrem.dispose();
  }
}

/* ---------- 2. finish ---------- */
const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap'] as const;
export function finish(renderer: T.WebGLRenderer, scene: T.Scene) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const box = new T.Box3(), size = new T.Vector3();
  const done = new WeakSet<T.Material>();
  scene.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      if (!mat || done.has(mat)) continue;
      done.add(mat);
      const r = mat as unknown as Record<string, T.Texture | null>;
      for (const k of TEX_KEYS) {
        const t = r[k];
        if (t && t.anisotropy < aniso) { t.anisotropy = aniso; t.needsUpdate = true; }
      }
    }
    /* floors: big, flat, near the ground. Polish only what was already meant to be smooth-ish;
       grass, carpet, asphalt and earth (rough > 0.8) are left alone */
    if ((m as unknown as T.InstancedMesh).isInstancedMesh || Array.isArray(m.material)) return;
    const mat = m.material as T.MeshStandardMaterial;
    if (!mat?.isMeshStandardMaterial || mat.transparent || mat.userData.lookFloor) return;
    box.setFromObject(m).getSize(size);
    if (size.y < 0.35 && size.x * size.z > 30 && box.max.y < 0.6 && box.min.y > -1.5 && mat.roughness <= 0.8 && mat.metalness < 0.5) {
      mat.userData.lookFloor = true;
      mat.roughness = Math.max(0.12, mat.roughness * 0.72);
      mat.envMapIntensity = Math.max(mat.envMapIntensity ?? 1, 1.15);
      mat.needsUpdate = true;
    }
  });
}

/* ---------- 3. grade ---------- */
export function gradePass() {
  const p = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new T.Vector2(1280, 720) }, uNight: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime,uNight;uniform vec2 uRes;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec3 c=texture2D(tDiffuse,vUv).rgb;
  float l=dot(c,vec3(.2126,.7152,.0722));
  /* gentle S curve around mid grey, a touch less at night so the dark stays readable */
  vec3 s=c*c*(3.-2.*c);
  c=mix(c,s,.16*(1.-.4*uNight));
  /* split tone: warm highlights, cool shadows */
  c+=vec3(.022,.008,-.018)*smoothstep(.45,1.,l);
  c+=vec3(-.012,.0,.02)*(1.-smoothstep(.0,.35,l));
  /* a hair of saturation back after the curve */
  float l2=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l2),c,1.04);
  /* soft vignette on the long axis */
  vec2 q=(vUv-.5)*vec2(uRes.x/uRes.y,1.);
  c*=1.-.28*smoothstep(.35,1.05,length(q));
  /* fine luminance grain, strongest in the mids */
  float g=h(vUv*uRes+fract(uTime*7.13)*91.7)-.5;
  c+=g*.018*(1.-abs(l*2.-1.));
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`,
  });
  return p;
}
