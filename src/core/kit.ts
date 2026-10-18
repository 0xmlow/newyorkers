import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Geometry helpers. One unit is one metre. Every box gets metric UVs in world-aligned coordinates, so a PBR surface
// with repeat 1/tile reads at the same scale on every wall and joins across neighbouring boxes.

export const v3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);

export function metricUV(g: T.BufferGeometry, ox = 0, oy = 0, oz = 0) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + ox, y = p.getY(i) + oy, z = p.getZ(i) + oz;
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ax >= ay && ax >= az) uv.setXY(i, z * Math.sign(n.getX(i) || 1), y);
    else if (ay >= az) uv.setXY(i, x, z);
    else uv.setXY(i, x * Math.sign(n.getZ(i) || 1), y);
  }
  uv.needsUpdate = true;
  return g;
}

export function box(parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, shadow = true) {
  const g = metricUV(new T.BoxGeometry(w, h, d), x, y, z);
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = shadow; o.receiveShadow = true;
  parent.add(o);
  return o;
}

/** A wall in the x/y plane of a given thickness with rectangular openings cut through it (real holes, not paint). */
export function wallWithOpenings(parent: T.Object3D, w: number, h: number, t: number, m: T.Material,
  holes: { x: number; y: number; w: number; h: number }[], pos: T.Vector3, rotY = 0) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  for (const o of holes) {
    const hp = new T.Path();
    hp.moveTo(o.x - o.w / 2, o.y); hp.lineTo(o.x - o.w / 2, o.y + o.h); hp.lineTo(o.x + o.w / 2, o.y + o.h); hp.lineTo(o.x + o.w / 2, o.y); hp.lineTo(o.x - o.w / 2, o.y);
    s.holes.push(hp);
  }
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  g.computeVertexNormals();
  // metric UVs in the wall's own frame
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const az = Math.abs(n.getZ(i)), ax = Math.abs(n.getX(i));
    if (az > 0.5) uv.setXY(i, p.getX(i) + pos.x, p.getY(i));
    else if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i));
    else uv.setXY(i, p.getX(i), p.getZ(i));
  }
  const o = new T.Mesh(g, m);
  o.position.copy(pos); o.rotation.y = rotY;
  o.castShadow = true; o.receiveShadow = true;
  parent.add(o);
  return o;
}

export function plane(parent: T.Object3D, w: number, h: number, m: T.Material, pos: T.Vector3, rot = v3()) {
  const o = new T.Mesh(new T.PlaneGeometry(w, h), m);
  o.position.copy(pos); o.rotation.set(rot.x, rot.y, rot.z);
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

export function floorPlane(parent: T.Object3D, w: number, d: number, m: T.Material, x: number, y: number, z: number) {
  const g = new T.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + x, -(p.getZ(i) + z));
  const o = new T.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; parent.add(o);
  return o;
}

type Ink = { bg?: string; ink?: string; font?: string; weight?: number; align?: CanvasTextAlign; pad?: number; border?: string };
/** Sign text drawn to a canvas: the wordmark style of the transit kit, or whatever the sign wants. */
export function signTexture(lines: string[], w: number, h: number, o: Ink = {}) {
  const c = document.createElement('canvas'), px = 1024;
  c.width = px; c.height = Math.max(32, Math.round((px * h) / w));
  const x = c.getContext('2d')!;
  if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, c.width, c.height); }
  if (o.border) { x.strokeStyle = o.border; x.lineWidth = c.height * 0.06; x.strokeRect(0, 0, c.width, c.height); }
  x.fillStyle = o.ink || '#f0f4f8';
  x.textBaseline = 'middle'; x.textAlign = o.align || 'center';
  const pad = (o.pad ?? 0.06) * c.width;
  const n = lines.length;
  lines.forEach((l, i) => {
    let size = (c.height / (n + 0.6)) * (i === 0 ? 0.9 : 0.62);
    x.font = `${i === 0 ? o.weight || 700 : 500} ${size}px ${o.font || 'Archivo, Arial Narrow, sans-serif'}`;
    while (x.measureText(l).width > c.width - pad * 2 && size > 8) { size *= 0.92; x.font = `${i === 0 ? o.weight || 700 : 500} ${size}px ${o.font || 'Archivo, Arial Narrow, sans-serif'}`; }
    const xx = o.align === 'left' ? pad : o.align === 'right' ? c.width - pad : c.width / 2;
    x.fillText(l, xx, (c.height * (i + 0.8)) / (n + 0.6));
  });
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function sign(parent: T.Object3D, lines: string[], w: number, h: number, pos: T.Vector3, rotY = 0, o: Ink & { glow?: number } = {}) {
  const m = new T.MeshBasicMaterial({ map: signTexture(lines, w, h, o), transparent: !o.bg, toneMapped: !o.glow });
  if (o.glow) m.color.setScalar(o.glow);
  const s = plane(parent, w, h, m, pos, v3(0, rotY, 0));
  s.receiveShadow = false;
  return s;
}

// ---------- walkable areas: rectangles you may stand in, rectangles you may not ----------
export type Rect = [number, number, number, number]; // x0, z0, x1, z1 in room coordinates
export function inside(r: Rect, x: number, z: number, pad = 0) {
  return x > r[0] + pad && x < r[2] - pad && z > r[1] + pad && z < r[3] - pad;
}
/** Your footprint (a 0.22 m square around you) must lie in the union of the floor rectangles, so rectangles that
 * meet or overlap make one continuous floor, and must not touch an obstacle. */
export function walkable(walk: Rect[], block: Rect[], x: number, z: number, r = 0.22) {
  const on = (px: number, pz: number) => walk.some((w) => inside(w, px, pz, 0));
  return on(x - r, z - r) && on(x + r, z - r) && on(x - r, z + r) && on(x + r, z + r) && on(x, z) && !block.some((b) => inside(b, x, z, -0.25));
}

export function seeded(seed: number) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Merge every static mesh under root into one mesh per material (world baked relative to root). Skips anything that
 * moves or is picked: instanced meshes, sprites, transparent materials, portals, mirrors, clickable art, and anything
 * under an object with userData.dynamic. The block went from ~6,000 draw calls a frame (each pass) to a few hundred. */
export function batchStatic(root: T.Object3D, keep: Set<T.Object3D>) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const groups = new Map<T.Material, { geos: T.BufferGeometry[]; cast: boolean }>();
  const remove: T.Mesh[] = [];
  const dyn = (o: T.Object3D | null): boolean => { while (o && o !== root) { if (o.userData.dynamic) return true; o = o.parent; } return false; };
  root.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.isMesh || (m as unknown as T.InstancedMesh).isInstancedMesh || keep.has(m) || m.userData.portal || (m as unknown as { isReflector?: boolean }).isReflector) return;
    const mat = m.material as T.Material;
    if (Array.isArray(mat) || mat.transparent || dyn(m)) return;
    const g = m.geometry;
    if (!g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
    let c = g.clone();
    for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
    if (c.index) c = c.toNonIndexed();
    c.applyMatrix4(inv.clone().multiply(m.matrixWorld));
    const e = groups.get(mat) || { geos: [], cast: false };
    e.geos.push(c); e.cast ||= m.castShadow; groups.set(mat, e);
    remove.push(m);
  });
  for (const m of remove) m.parent?.remove(m);
  for (const [mat, e] of groups) {
    const merged = mergeGeometries(e.geos, false);
    if (!merged) continue;
    const mesh = new T.Mesh(merged, mat); mesh.castShadow = e.cast; mesh.receiveShadow = true; mesh.name = 'batched';
    root.add(mesh);
    e.geos.forEach((x) => x.dispose());
  }
  return remove.length;
}
