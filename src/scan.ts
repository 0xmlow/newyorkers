import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js';

// THE BIG UPGRADE (2026-11-23): what the loft is made of now comes from the world, not from code.
// Scanned Poly Haven CC0 surfaces (public/tex, 1k colour and normal, 512 roughness, tiled at their real size in
// metres) and real models (public/glb: our own Tripo casts and Poly Haven CC0 props, Draco compressed).

export const PHONE = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) ||
  (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

const texLoader = new T.TextureLoader();
const texCache = new Map<string, T.Texture>();
function tex(url: string, srgb: boolean) {
  let t = texCache.get(url);
  if (!t) {
    t = texLoader.load(url);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    texCache.set(url, t);
  }
  return t;
}

/** A scanned surface, `size` metres per tile, laid on a w x h metre face (plane UVs 0..1). */
export function scan(name: string, size: number, w = size, h = size, o: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}) {
  const rep = (t: T.Texture) => { const c = t.clone(); c.repeat.set(w / size, h / size); return c; };
  const { normal = 1, ...rest } = o;
  const m = new T.MeshStandardMaterial({
    map: rep(tex(`tex/${name}_c.jpg`, true)),
    normalMap: rep(tex(`tex/${name}_n.jpg`, false)),
    roughnessMap: rep(tex(`tex/${name}_r.jpg`, false)),
    roughness: 1,
    ...rest,
  });
  m.normalScale.set(normal, normal);
  return m;
}

/** Same surface for geometry whose UVs are already in metres (ExtrudeGeometry caps, custom quads). */
export function scanMetric(name: string, size: number, o: Partial<T.MeshStandardMaterialParameters> = {}) {
  return scan(name, size, 1, 1, o);
}

/** World space (triplanar) colour and roughness for a shared material on merged boxes whose UVs are 0..1 per face:
 *  the plaster of every wall, blade and slab gets the scan at its real size wherever it lands. */
export function triplanar(m: T.MeshStandardMaterial, name: string, size: number, strength = 1, mean = 0.38) {
  const cmap = tex(`tex/${name}_c.jpg`, true), rmap = tex(`tex/${name}_r.jpg`, false);
  m.onBeforeCompile = (s) => {
    s.uniforms.tpC = { value: cmap };
    s.uniforms.tpR = { value: rmap };
    s.uniforms.tpS = { value: 1 / size };
    s.uniforms.tpK = { value: strength };
    s.uniforms.tpM = { value: mean };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTpP; varying vec3 vTpN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTpP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTpN = normalize(mat3(modelMatrix) * objectNormal);');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D tpC; uniform sampler2D tpR; uniform float tpS; uniform float tpK; uniform float tpM; varying vec3 vTpP; varying vec3 vTpN;
vec4 tpSample(sampler2D t){ vec3 b = pow(abs(normalize(vTpN)), vec3(4.0)); b /= (b.x + b.y + b.z);
  return texture2D(t, vTpP.zy * tpS) * b.x + texture2D(t, vTpP.xz * tpS) * b.y + texture2D(t, vTpP.xy * tpS) * b.z; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float l = dot(tpSample(tpC).rgb, vec3(0.2126, 0.7152, 0.0722)); diffuseColor.rgb *= clamp(1.0 + (l / tpM - 1.0) * tpK, 0.6, 1.25); }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, roughnessFactor * (0.75 + 0.5 * tpSample(tpR).g), tpK);`);
  };
  m.customProgramCacheKey = () => 'tp_' + name;
  m.needsUpdate = true;
  return m;
}

const gltf = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(DRACO_GLTF_CONFIG); // the wasm decoder Vite bundles into js/
gltf.setDRACOLoader(draco);
const glbCache = new Map<string, Promise<GLTF>>();
export function loadGLB(name: string) {
  let p = glbCache.get(name);
  if (!p) { p = gltf.loadAsync(`glb/${name}.glb`); glbCache.set(name, p); }
  return p;
}

export type Place = {
  at: [number, number, number];
  rotY?: number;
  rot?: [number, number, number];
  /** fit: scale the model so its largest horizontal side, or its height with fitY, matches this many metres */
  fit?: number;
  fitY?: number;
  scale?: number;
  shadow?: boolean;
  /** seat on the floor (bounding box min y at `at` y) and centre in x and z */
  seat?: boolean;
};

/** A real model, seated and sized in metres. Resolves with its group (already in the scene). */
export async function prop(scene: T.Object3D, name: string, p: Place) {
  const g = await loadGLB(name);
  const o = g.scene.clone(true);
  const box = new T.Box3().setFromObject(o), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  let k = p.scale ?? 1;
  if (p.fitY) k = p.fitY / size.y;
  else if (p.fit) k = p.fit / Math.max(size.x, size.z);
  const inner = new T.Group();
  o.position.set(-c.x, p.seat === false ? 0 : -box.min.y, -c.z);
  inner.add(o);
  inner.scale.setScalar(k);
  const outer = new T.Group();
  outer.add(inner);
  outer.position.set(...p.at);
  if (p.rot) outer.rotation.set(...p.rot);
  else outer.rotation.y = p.rotY ?? 0;
  outer.userData.prop = name;
  o.traverse((m) => {
    if ((m as T.Mesh).isMesh) { m.castShadow = p.shadow !== false; m.receiveShadow = true; }
  });
  scene.add(outer);
  return outer;
}

/** Many copies of one model as instanced meshes (a draw call per part, not per copy). */
export async function instanced(scene: T.Object3D, name: string, mats: T.Matrix4[], fitY?: number) {
  const g = await loadGLB(name);
  g.scene.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(g.scene), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const k = fitY ? fitY / size.y : 1;
  // normalise: centred in x and z, top of the model at y 0 (things that hang from the ceiling)
  const norm = new T.Matrix4().makeScale(k, k, k).multiply(new T.Matrix4().makeTranslation(-c.x, -box.max.y, -c.z));
  const out: T.InstancedMesh[] = [];
  g.scene.traverse((m) => {
    const mesh = m as T.Mesh;
    if (!mesh.isMesh) return;
    const local = norm.clone().multiply(mesh.matrixWorld);
    const inst = new T.InstancedMesh(mesh.geometry, mesh.material, mats.length);
    mats.forEach((w, i) => inst.setMatrixAt(i, w.clone().multiply(local)));
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    inst.castShadow = false; inst.receiveShadow = true;
    scene.add(inst);
    out.push(inst);
  });
  return out;
}

/** Canvas type in the house fonts, drawn once the webfonts are in (a sign drawn before they load falls back). */
export async function fontsReady() {
  try {
    await Promise.all(['700 64px Archivo', '500 64px Archivo', '400 32px Plex', '600 32px Plex', '400 64px Serif'].map((f) => document.fonts.load(f)));
  } catch { /* the fallback stack is fine */ }
}
