/* Hero props, 2026-10-09: AI made GLBs (FLORA and Krea, Tripo H3.1 from a GPT Image concept, then
   blender/prop_pass.py) that take the place of the box built stand ins in rooms 165 to 178.

   The stand in is still built first, then pulled out of the static merge with `standIn`, so it can be
   hidden when the GLB arrives. A GLB that fails to load leaves the room exactly as it was. Every hero
   file is named h_<thing>.glb in assets/museum/props; the concepts and run ids are in
   MUSEUM HEROES 2026-10-09/ beside the site folder. */
import * as T from 'three';
import type { RoomDef } from './types';

type K = Parameters<RoomDef['build']>[0];

/* Everything the kit merged since `mark` (k.objects.length taken before building the stand in) is
   handed back as its own meshes, out of the static batch, so it can be hidden later. */
export function standIn(k: K, mark: number): T.Object3D[] {
  const ms = k.objects.splice(mark);
  for (const m of ms) k.dynamic.add(m);
  return ms;
}

export function hide(os: T.Object3D[]) {
  for (const o of os) o.visible = false;
}

/* Load a hero once, fitted to one dimension (length along z, width along x, or height), base at
   y 0 and centred in plan, inside a group ready to clone. Clones share geometry and materials. */
export function hero(k: K, name: string, fit: { height?: number; length?: number; width?: number; box?: [number, number, number] }): Promise<T.Group | null> {
  return Promise.resolve(k.prop(name, 0, -500, 0, { scale: 1 })).then((o: T.Object3D | null) => {
    if (!o || !o.isObject3D) return null;
    k.scene.remove(o);
    k.dynamic.delete(o);
    o.position.set(0, 0, 0);
    o.rotation.set(0, 0, 0);
    o.scale.setScalar(1);
    o.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(o), size = bb.getSize(new T.Vector3());
    /* `box` [width, height, length] stretches each axis to an envelope a moving thing must stay inside */
    const u = fit.length ? fit.length / size.z : fit.width ? fit.width / size.x : (fit.height ?? 1) / size.y;
    const s = fit.box ? new T.Vector3(fit.box[0] / size.x, fit.box[1] / size.y, fit.box[2] / size.z) : new T.Vector3(u, u, u);
    o.scale.copy(s);
    o.position.set((-(bb.min.x + bb.max.x) / 2) * s.x, -bb.min.y * s.y, (-(bb.min.z + bb.max.z) / 2) * s.z);
    const g = new T.Group();
    g.add(o);
    g.userData.size = size.multiply(s);
    return g;
  });
}

/* A loaded hero as instanced parts: one draw per part for many copies. `at` matrices are applied in
   front of each part's own transform; update them later with `setAt`. */
export function heroInstances(k: K, g: T.Group, n: number) {
  g.updateMatrixWorld(true);
  const parts: { im: T.InstancedMesh; local: T.Matrix4 }[] = [];
  g.traverse((c) => {
    if (c instanceof T.Mesh) {
      const im = new T.InstancedMesh(c.geometry, c.material, n);
      im.castShadow = c.castShadow;
      im.receiveShadow = c.receiveShadow;
      im.frustumCulled = false;
      k.scene.add(im);
      k.dynamic.add(im);
      parts.push({ im, local: c.matrixWorld.clone() });
    }
  });
  const tmp = new T.Matrix4();
  return {
    parts,
    setAt(i: number, m: T.Matrix4) {
      for (const p of parts) p.im.setMatrixAt(i, tmp.multiplyMatrices(m, p.local));
    },
    commit() {
      for (const p of parts) p.im.instanceMatrix.needsUpdate = true;
    },
  };
}
