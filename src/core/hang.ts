import * as T from 'three';
import { tex, type Piece } from './assets';
import { seeded, signTexture } from './kit';

// The collection on the walls. Art is unlit, white, sRGB and aspect correct (never tinted, never displaced).
// Posters and stickers are MLow's own, also neutral, but pasted: curled paper, overlaps, a slight lift.

export type Clickable = { mesh: T.Object3D; piece: Piece; view: () => { at: T.Vector3; look: T.Vector3 } };
export const clickables: Clickable[] = [];

const frameMats: Record<string, T.Material> = {};
function frameMat(kind: string) {
  return (frameMats[kind] ??= kind === 'brass'
    ? new T.MeshStandardMaterial({ color: 0xb48a4a, metalness: 1, roughness: 0.32 })
    : kind === 'chrome' ? new T.MeshStandardMaterial({ color: 0xd8dde4, metalness: 1, roughness: 0.18 })
    : new T.MeshStandardMaterial({ color: 0x0d0f14, metalness: 0.4, roughness: 0.45 }));
}
let poolTex: T.Texture | null = null;
function pool() {
  if (poolTex) return poolTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 40, 4, 64, 70, 150); g.addColorStop(0, 'rgba(255,236,205,0.55)'); g.addColorStop(1, 'rgba(255,236,205,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 256);
  return (poolTex = new T.CanvasTexture(c));
}

export type HangOpts = { frame?: 'black' | 'brass' | 'chrome' | 'none'; label?: boolean; pool?: boolean; standoff?: number };

/** Hang a piece centred at pos on a wall whose outward normal is rotY (0 = facing +z). Width w in metres. */
export function hang(parent: T.Object3D, piece: Piece, pos: T.Vector3, rotY: number, w: number, o: HangOpts = {}) {
  const g = new T.Group(); g.position.copy(pos); g.rotation.y = rotY; parent.add(g);
  const h = w / (piece.ar || 1.776), kind = o.frame ?? 'black';
  if (kind !== 'none') {
    const f = new T.Mesh(new T.BoxGeometry(w + 0.12, h + 0.12, 0.06), frameMat(kind));
    f.position.z = 0.03; f.castShadow = true; g.add(f);
  }
  const art = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex(piece.f), toneMapped: false }));
  art.position.z = kind === 'none' ? 0.012 : 0.065; g.add(art);
  if (o.label !== false) {
    const lw = Math.min(0.62, w * 0.42), lh = lw * 0.28;
    const lab = new T.Mesh(new T.PlaneGeometry(lw, lh), new T.MeshBasicMaterial({
      map: signTexture([piece.t, `NEW YORKERS No. ${piece.n}${piece.place ? ' . ' + piece.place : ''}`], lw, lh, { bg: '#f0f4f8', ink: '#06163a', align: 'left', pad: 0.06 }),
      toneMapped: false }));
    lab.position.set(w / 2 - lw / 2, -h / 2 - lh / 2 - 0.1, 0.02); g.add(lab);
  }
  if (o.pool !== false) {
    const p = new T.Mesh(new T.PlaneGeometry(w * 1.5, h * 1.9), new T.MeshBasicMaterial({ map: pool(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    p.position.set(0, h * 0.2, 0.004); p.renderOrder = 1; g.add(p);
  }
  clickables.push({ mesh: art, piece, view: () => {
    g.updateMatrixWorld();
    const at = new T.Vector3(0, 0, Math.max(1.6, w * 1.15)).applyMatrix4(g.matrixWorld);
    const look = art.getWorldPosition(new T.Vector3());
    at.y = look.y - 0.1; // the controller settles the eye on the floor after the flight
    return { at, look };
  } });
  return { group: g, art, h };
}

/** A pasted poster: subdivided paper, curled at one corner, never cropped. Height h in metres. */
export function poster(parent: T.Object3D, file: string, ar: number, pos: T.Vector3, rotY: number, h: number, seed = 1) {
  const rnd = seeded(seed), w = h * ar;
  const geo = new T.PlaneGeometry(w, h, 8, 12), p = geo.attributes.position;
  const corner = Math.floor(rnd() * 4), cxs = corner % 2 ? 1 : -1, cys = corner < 2 ? 1 : -1, curl = 0.04 + rnd() * 0.1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2);
    const d = Math.max(0, (x * cxs + y * cys) - 1.2);
    p.setZ(i, d * d * curl * 3 + Math.sin(x * 7 + y * 5 + seed) * 0.002);
  }
  geo.computeVertexNormals();
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex(file), toneMapped: false, side: T.DoubleSide, color: new T.Color(0.86, 0.86, 0.86) }));
  m.position.copy(pos); m.rotation.set(0, rotY, (rnd() - 0.5) * 0.04);
  parent.add(m);
  return m;
}

/** A sticker: alpha cut, slapped on at an angle. Size s in metres. */
export function sticker(parent: T.Object3D, file: string, ar: number, pos: T.Vector3, rotY: number, s: number, spin = 0) {
  const m = new T.Mesh(new T.PlaneGeometry(s * ar, s), new T.MeshBasicMaterial({ map: tex(file), transparent: true, alphaTest: 0.4, toneMapped: false, color: new T.Color(0.9, 0.9, 0.9), depthWrite: false }));
  m.position.copy(pos); m.rotation.set(0, rotY, spin); m.renderOrder = 2;
  parent.add(m);
  return m;
}
