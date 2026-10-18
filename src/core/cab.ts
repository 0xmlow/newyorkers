import * as T from 'three';
import { prop, tex } from './assets';

// MLow's cabs, as in the museum (NEW YORKERS SITE/_build/museum/src/kit.ts, 2026-10-09): the five NYC hybrid cab
// types built from MLow's own street photos (Tripo, his yellow and markings baked in), at their real lengths, each
// with the MLOW digital topper on roof rails. The topper's two screens read one slot of public/taxi/screens.jpg
// (2 x 6): slot 0 the MLOW mark, 1 his real topper creative, the rest his paintings. Never a generic cab.

export const CABS = [
  { name: 'h_taxi', len: 4.6 },          // Toyota RAV4 hybrid
  { name: 'h_taxi_escape', len: 4.6 },   // Ford Escape hybrid
  { name: 'h_taxi_nv200', len: 4.4 },    // Nissan NV200
  { name: 'h_taxi_sienna', len: 5.17 },  // Toyota Sienna hybrid
  { name: 'h_taxi_camry', len: 4.88 },   // Toyota Camry hybrid
] as const;

const screenMats = new Map<number, T.MeshBasicMaterial>();
/** The topper screen for one slot of the atlas: an offset into the shared texture, unlit like a real LED screen. */
function screen(slot: number) {
  let m = screenMats.get(slot);
  if (m) return m;
  const base = tex('taxi/screens.jpg');
  const t = base.clone(); t.repeat.set(0.5, 1 / 6); t.offset.set((slot % 2) * 0.5, 1 - (Math.floor(slot / 2) + 1) / 6);
  // the clone shares the image; mark it for upload when the original arrives
  const tick = () => { if (base.image) { t.image = base.image; t.needsUpdate = true; } else setTimeout(tick, 200); }; tick();
  m = new T.MeshBasicMaterial({ map: t, toneMapped: false, color: new T.Color(1.3, 1.3, 1.3) });
  screenMats.set(slot, m);
  return m;
}
const frame = new T.MeshStandardMaterial({ color: 0x2a2d30, metalness: 0.6, roughness: 0.4 });

/** An MLow cab: kind 0..4, topper slot 0..11 (0 the MLOW mark). Nose along -z, wheels on y = 0. */
export function mlowCab(kind: number, slot: number) {
  const k = CABS[kind % CABS.length];
  const holder = new T.Group(); holder.userData.dynamic = true;
  holder.add(prop(k.name, undefined, (o) => {
    // prop() centred it and put it on the ground at its file scale: rescale to the cab's real length along z
    o.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(o), sz = bb.getSize(new T.Vector3()), s = k.len / sz.z;
    o.scale.multiplyScalar(s); o.position.multiplyScalar(s);
    o.updateMatrixWorld(true);
    // find the roof from the highest vertices (an SUV's middle is over the dashboard, not the roof)
    let top = -1e9; const v = new T.Vector3(), pts: T.Vector3[] = [];
    o.traverse((c) => {
      const mm = c as T.Mesh; if (!mm.isMesh) return;
      const pa = mm.geometry.attributes.position as T.BufferAttribute;
      for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i).applyMatrix4(mm.matrixWorld); pts.push(v.clone()); if (v.y > top) top = v.y; }
    });
    const holderInv = new T.Matrix4().copy(o.parent!.matrixWorld).invert();
    const roof = new T.Box3();
    for (const p of pts) if (p.y > top - 0.14) roof.expandByPoint(p.applyMatrix4(holderInv));
    const topL = new T.Vector3(0, top, 0).applyMatrix4(holderInv).y;
    const rx = (roof.min.x + roof.max.x) / 2, rz = (roof.min.z + roof.max.z) / 2, len = roof.max.z - roof.min.z;
    const TL = Math.min(1.2, Math.max(0.8, len * 0.7)), TH = 0.38, TT = 0.18, ty = topL + 0.07 + TH / 2;
    const body = new T.Mesh(new T.BoxGeometry(TT, TH, TL), frame); body.position.set(rx, ty, rz); body.castShadow = true; o.parent!.add(body);
    for (const side of [-1, 1]) {
      const p = new T.Mesh(new T.PlaneGeometry(TL * 0.95, TH * 0.86), screen(slot));
      p.position.set(rx + side * (TT / 2 + 0.003), ty, rz); p.rotation.y = side * Math.PI / 2; o.parent!.add(p);
    }
    const legs = new T.Mesh(new T.BoxGeometry(0.07, 0.09, TL * 0.8), frame); legs.position.set(rx, topL + 0.035, rz); o.parent!.add(legs);
  }));
  return holder;
}
