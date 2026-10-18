import * as T from 'three';
import { tex } from './assets';

// A depth plate: an ImageGen view turned into geometry with its Depth Anything V2 map (tools/make_assets.py), the
// MONA pass from THE MARKS gallery. The mesh is the image re projected from the camera that "took" it, so from near
// that camera it is a photograph with real parallax; it is meant to be seen from inside the room, not from the side.
// Relative depth calibrated so the bottom row lands on the floor and the farthest pixels at `far`. Torn at big breaks.

export type PlateOpts = { tanH?: number; eye?: number; near?: number; far?: number; tear?: number; nx?: number; tint?: number; edge?: number };

export function plate(parent: T.Object3D, name: string, o: PlateOpts = {}) {
  const g = new T.Group(); parent.add(g);
  const tanH = o.tanH ?? 0.72, EYE = o.eye ?? 1.6, far = o.far ?? 120, tear = o.tear ?? 2.6, NX = o.nx ?? 220;
  const img = new Image(); img.src = `plates/${name}_d.png`;
  img.onload = () => {
    const cw = img.width, ch = img.height, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const cx = c.getContext('2d')!; cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, cw, ch).data;
    const dAt = (u: number, v: number) => px[(Math.min(ch - 1, Math.round(v * (ch - 1))) * cw + Math.min(cw - 1, Math.round(u * (cw - 1)))) * 4] / 255;
    const tanV = (tanH * ch) / cw;
    const near = o.near ?? EYE / (0.96 * tanV);
    let dn = 0; for (let i = 0; i < 9; i++) dn += dAt(0.3 + i * 0.05, 0.98); dn /= 9;
    let dmin = 1; for (let i = 0; i < 600; i++) dmin = Math.min(dmin, dAt((i * 0.618) % 1, ((i * 0.377) % 1) * 0.8));
    const a = (1 / near - 1 / far) / Math.max(0.05, dn - dmin), b = 1 / far - a * dmin;
    const NY = Math.round((NX * ch) / cw) + 1;
    const pos = new Float32Array((NX + 1) * NY * 3), uvs = new Float32Array((NX + 1) * NY * 2), zz = new Float32Array((NX + 1) * NY);
    let k = 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const u = i / NX, v = j / (NY - 1), x = u * 2 - 1, y = 1 - v * 2;
      const z = Math.min(far * 1.4, Math.max(near * 0.5, 1 / Math.max(1e-4, a * dAt(u, v) + b)));
      pos[k * 3] = x * tanH * z; pos[k * 3 + 1] = EYE + y * tanV * z; pos[k * 3 + 2] = -z; zz[k] = z;
      uvs[k * 2] = u; uvs[k * 2 + 1] = 1 - v;
    }
    const idx: number[] = [];
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) {
      const p = j * (NX + 1) + i, q = p + NX + 1, zs = [zz[p], zz[p + 1], zz[q], zz[q + 1]];
      if (Math.max(...zs) / Math.min(...zs) > tear) continue;
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.BufferAttribute(uvs, 2)); geo.setIndex(idx);
    geo.computeBoundingSphere();
    // soft borders so the plate dissolves into the night at its edges
    const fc = document.createElement('canvas'); fc.width = 256; fc.height = 128; const q = fc.getContext('2d')!, e = o.edge ?? 0.05;
    const gx = q.createLinearGradient(0, 0, 256, 0); gx.addColorStop(0, '#000'); gx.addColorStop(e, '#fff'); gx.addColorStop(1 - e, '#fff'); gx.addColorStop(1, '#000');
    q.fillStyle = gx; q.fillRect(0, 0, 256, 128); q.globalCompositeOperation = 'multiply';
    const gy = q.createLinearGradient(0, 0, 0, 128); gy.addColorStop(0, '#000'); gy.addColorStop(e * 1.5, '#fff'); gy.addColorStop(1, '#fff');
    q.fillStyle = gy; q.fillRect(0, 0, 256, 128);
    const mat = new T.MeshBasicMaterial({ map: tex(`plates/${name}.jpg`), alphaMap: new T.CanvasTexture(fc), transparent: true, fog: false,
      side: T.DoubleSide, depthWrite: true, color: new T.Color(o.tint ?? 0xffffff) });
    const mesh = new T.Mesh(geo, mat); mesh.renderOrder = -1; g.add(mesh);
  };
  return g;
}
