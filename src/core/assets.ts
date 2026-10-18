import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// One loader for everything, with caches, a load counter for the curtain, and failures recorded on window.inside.

export type Piece = { n: number; t: string; story: string; ar: number; f: string; place: string };
export type Manifest = {
  art: Record<string, Piece[]>;
  posters: { f: string; ar: number }[];
  stickers: { f: string; ar: number; kind: string }[];
  interiors: string[];
};

export const loading = { total: 0, done: 0, failed: [] as string[], onChange: () => {} };
const track = <X>(p: Promise<X>, url: string) => {
  loading.total++; loading.onChange();
  return p.then((v) => { loading.done++; loading.onChange(); return v; },
    (e) => { loading.done++; loading.failed.push(url); loading.onChange(); throw e; });
};

let maxAniso = 8;
export function setAniso(n: number) { maxAniso = n; }

const texCache = new Map<string, T.Texture>();
const texLoader = new T.TextureLoader();
/** A texture that exists at once and fills in when the file arrives. */
export function tex(url: string, srgb = true, repeat?: [number, number]): T.Texture {
  const key = url + (srgb ? '' : '#lin') + (repeat ? repeat.join('x') : '');
  const have = texCache.get(key);
  if (have) return have;
  const t = new T.Texture();
  t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  track(new Promise<HTMLImageElement>((ok, no) => texLoader.load(url, (l) => ok(l.image as HTMLImageElement), undefined, no)), url)
    .then((img) => { t.image = img; t.needsUpdate = true; }).catch(() => {});
  texCache.set(key, t);
  return t;
}

/** CC0 PBR surface from the museum pack (colour, normal, roughness) for meshes with metric UVs (kit.ts): one tile
 * every `tile` metres. Grazing light is what sells it, so the normal map is always on. */
export function pbr(name: string, tile = 1, opts: Partial<T.MeshStandardMaterialParameters> = {}) {
  const r: [number, number] = [1 / tile, 1 / tile];
  return new T.MeshStandardMaterial({
    map: tex(`tex/${name}_c.jpg`, true, r),
    normalMap: tex(`tex/${name}_n.jpg`, false, r),
    roughnessMap: tex(`tex/${name}_r.jpg`, false, r),
    ...opts,
  });
}

const gltf = new GLTFLoader();
const glbCache = new Map<string, Promise<T.Group>>();
/** A clone of a prop from the museum pack, scaled to a height in metres, its base on y = 0, centred on x and z. */
export function prop(name: string, height?: number, cb?: (g: T.Group) => void): T.Group {
  const holder = new T.Group();
  holder.name = name;
  let p = glbCache.get(name);
  if (!p) {
    p = track(gltf.loadAsync(`glb/${name}.glb`).then((g) => g.scene), name);
    glbCache.set(name, p);
  }
  p.then((src) => {
    const g = src.clone(true);
    const box = new T.Box3().setFromObject(g), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    const k = height ? height / Math.max(1e-3, size.y) : 1;
    g.scale.setScalar(k);
    g.position.set(-c.x * k, -box.min.y * k, -c.z * k);
    g.traverse((o) => { if ((o as T.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    holder.add(g);
    cb?.(g);
  }).catch(() => {});
  return holder;
}

export function hdr(url: string, renderer: T.WebGLRenderer, done: (env: T.Texture) => void) {
  track(new HDRLoader().loadAsync(url), url).then((t) => {
    t.mapping = T.EquirectangularReflectionMapping;
    const pm = new T.PMREMGenerator(renderer);
    done(pm.fromEquirectangular(t).texture);
    t.dispose(); pm.dispose();
  }).catch(() => {});
}

export async function manifest(): Promise<Manifest> {
  return track(fetch('manifest.json').then((r) => r.json()), 'manifest.json');
}
