import * as T from 'three';
import { glb } from './assets';

// THE BIG UPGRADE (2026-11-24): real models where the block had boxes. Every helper here takes a CC0 GLB from
// public/glb/up (Poly Haven and our own museum pack, provenance in public/glb/up/SOURCES.md) and either places one
// copy or instances it many times, one draw call per mesh of the model.

/** Scale and offset that put a model's base on y = 0, centred on x and z, `height` metres tall (or `fit` on its
 * largest horizontal side when height is 0). */
function norm(src: T.Object3D, height: number, fit = 0, pick?: string) {
  src.updateMatrixWorld(true);
  const box = new T.Box3();
  src.traverse((m) => { if ((m as T.Mesh).isMesh && picked(m as T.Mesh, pick)) box.expandByObject(m); });
  const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const k = height ? height / Math.max(1e-3, size.y) : fit / Math.max(1e-3, size.x, size.z);
  return new T.Matrix4().makeScale(k, k, k).multiply(new T.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));
}

/** Poly Haven packs several variants in one file, one material each (two air conditioners, a clean and a rusted
 * can): `pick` keeps the meshes whose material name contains it. */
const picked = (m: T.Mesh, pick?: string) => !pick || pick.split('|').some((k) => { const n = (m.material as T.Material).name || ''; return k[0] === '=' ? n === k.slice(1) : n.includes(k); });

/** One model, many places: an InstancedMesh per mesh in the GLB. `at` are the placements (position, yaw, scale). */
export function instProp(parent: T.Object3D, name: string, height: number, at: { p: T.Vector3; ry?: number; s?: number; rx?: number }[],
  o: { shadow?: boolean; fit?: number; tint?: number; pick?: string } = {}) {
  const holder = new T.Group(); holder.name = 'inst:' + name; parent.add(holder);
  if (!at.length) return holder;
  glb('up/' + name).then((src) => {
    const base = norm(src, height, o.fit, o.pick);
    const place = at.map((a) => new T.Matrix4().compose(a.p, new T.Quaternion().setFromEuler(new T.Euler(a.rx ?? 0, a.ry ?? 0, 0)), new T.Vector3().setScalar(a.s ?? 1)));
    src.traverse((m) => {
      const mesh = m as T.Mesh; if (!mesh.isMesh || !picked(mesh, o.pick)) return;
      const local = base.clone().multiply(mesh.matrixWorld);
      let mat = mesh.material as T.Material;
      if (o.tint !== undefined) { mat = (mat as T.MeshStandardMaterial).clone(); (mat as T.MeshStandardMaterial).color.multiplyScalar(o.tint); }
      const im = new T.InstancedMesh(mesh.geometry, mat, place.length);
      place.forEach((pm, i) => im.setMatrixAt(i, pm.clone().multiply(local)));
      im.castShadow = o.shadow !== false; im.receiveShadow = true; im.computeBoundingSphere();
      holder.add(im);
    });
  }).catch(() => {});
  return holder;
}

/** One copy, placed. Same as assets.prop but from public/glb/up and with a yaw, so a room reads as a list of places. */
export function put(parent: T.Object3D, name: string, height: number, x: number, y: number, z: number, ry = 0, cb?: (g: T.Object3D) => void, fit = 0, pick?: string) {
  const holder = new T.Group(); holder.name = 'up:' + name; holder.position.set(x, y, z); holder.rotation.y = ry; parent.add(holder);
  glb('up/' + name).then((src) => {
    const g = src.clone(true);
    if (pick) { const drop: T.Object3D[] = []; g.traverse((m) => { if ((m as T.Mesh).isMesh && !picked(m as T.Mesh, pick)) drop.push(m); }); drop.forEach((m) => m.parent?.remove(m)); }
    g.applyMatrix4(norm(src, height, fit, pick));
    g.traverse((m) => { if ((m as T.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    holder.add(g); cb?.(g);
  }).catch(() => {});
  return holder;
}

/** The triangles of a model's meshes (in model space) for which keep(centroid, material name) is true, as one
 * geometry per material. For Poly Haven kits laid out exploded in one file (the fire escape). */
export function cut(src: T.Object3D, keep: (c: T.Vector3, mat: string) => boolean) {
  src.updateMatrixWorld(true);
  const out: { geo: T.BufferGeometry; mat: T.Material }[] = [];
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), mid = new T.Vector3();
  src.traverse((m) => {
    const mesh = m as T.Mesh; if (!mesh.isMesh) return;
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, name = (mesh.material as T.Material).name || '';
    const pos: number[] = [], nor: number[] = [], uv: number[] = [];
    for (let i = 0; i < P.count; i += 3) {
      a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
      mid.copy(a).add(b).add(c).multiplyScalar(1 / 3);
      if (!keep(mid, name)) continue;
      for (let k = 0; k < 3; k++) {
        pos.push(P.getX(i + k), P.getY(i + k), P.getZ(i + k));
        if (N) nor.push(N.getX(i + k), N.getY(i + k), N.getZ(i + k));
        if (U) uv.push(U.getX(i + k), U.getY(i + k));
      }
    }
    if (!pos.length) return;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    if (nor.length) geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); else geo.computeVertexNormals();
    if (uv.length) geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    out.push({ geo, mat: mesh.material as T.Material });
  });
  return out;
}

/** A Firefly plate that may not exist yet: draws `fallback` (a canvas) until the file loads, then swaps it in. */
export function ffTex(url: string, fallback: HTMLCanvasElement) {
  const t = new T.CanvasTexture(fallback); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  const img = new Image();
  img.onload = () => { (t as T.Texture).image = img; t.needsUpdate = true; };
  img.src = url;
  return t;
}
