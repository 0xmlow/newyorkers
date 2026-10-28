import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { prop, track } from './assets';

// The rigged cast (2026-10-28): the same Tripo eye flower New Yorkers as the npc_ files, rigged in Blender
// (UPGRADE ALL ROOMS 2026-10-28/rig, RIG_TRIAL.md): 3,000 triangles, walk and idle clips, a bone named head.
// castProp('npc_cabbie', h) loads glb/rig/cabbie.glb and falls back to the static npc_ file when it fails, or on ?rig=off.
// rigTick() runs once a frame: the nearest figures (20 desktop, 8 phone) play, the rest hold the sculpted pose. A figure
// whose holder moves walks at its real speed; one that stands idles from a random start. Near the visitor the head bone
// turns toward the camera (60 degrees at most, eased) and a standing body turns only past that.

type Kind = 'w' | 'i' | 's' | 'n';
const RIG: Record<string, [Kind, number?]> = {
  actress: ['w', 0.55], bartender: ['w', 0.78], discoking: ['w', 0.73], gown: ['w', 0.55], hustler: ['w', 0.67], loretta: ['w', 0.46],
  maitre: ['w', 0.49], oscar: ['w', 0.87], tough: ['w', 0.76], annieh: ['w', 0.46], editor: ['w', 0.46], rosemary: ['w', 0.46],
  workgirl: ['w', 0.78], wiseguy: ['w', 0.76], susan: ['w', 0.76], cabbie: ['w', 0.71], killer: ['w', 0.28], writer: ['w', 0.67],
  clerk: ['i'], felix: ['i'], blindwoman: ['i'], prince: ['i'],
  folksinger: ['s'], robber: ['s'], sally: ['n'], lensman: ['n'],   // sally and lensman hold things to the face: no look
};
export const RIG_ON = !/[?&]rig=off\b/.test(location.search);
// Files that do not face +Z (2026-10-28, UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing): five rig files face 90 degrees off,
// turned inside the figure (the skinned clone, under the fit group) so a holder's rotation, the look and the body turn keep
// +Z as the front. npc_hustler, the static fallback, faces -Z: it turns half way so a fallback faces where the rig would.
const FACE: Record<string, number> = { blindwoman: -Math.PI / 2, hustler: -Math.PI / 2, lensman: Math.PI / 2, tough: Math.PI / 2, sally: Math.PI / 2 };
const STATIC_FACE: Record<string, number> = { npc_hustler: Math.PI };
function staticProp(name: string, height: number): T.Group {
  const g = prop(name, height); if (STATIC_FACE[name]) { const w = new T.Group(); w.name = name; g.rotation.y = STATIC_FACE[name]; w.add(g); return w; } return g;
}
export const RIGSTAT = { figures: 0, active: 0, ms: 0 };

type Rec = { name: string; root: T.Object3D; outer: T.Object3D; mixer: T.AnimationMixer; idle?: T.AnimationAction; walk?: T.AnimationAction;
  head?: T.Bone; rest?: T.Quaternion; kind: Kind; speed: number; base: number; last: T.Vector3; vel: T.Vector3; lim: number; v: number; wk: number; look: number; body: number; d: number };
const LIST: Rec[] = [];
Object.defineProperty(RIGSTAT, 'list', { value: LIST });   // for the review harness, kept out of JSON
const gltf = new GLTFLoader();
const cache = new Map<string, Promise<{ scene: T.Group; animations: T.AnimationClip[] }>>();

/** A cast member: the rigged twin when there is one, else (or when it fails) the static prop. Same fit as prop(). */
export function castProp(name: string, height: number): T.Group {
  const bare = name.replace(/^npc_/, '');
  if (!RIG_ON || !RIG[bare]) return staticProp(name, height);
  const holder = new T.Group(); holder.name = name; holder.userData.dynamic = true;   // never merged by batchStatic
  let p = cache.get(bare);
  if (!p) { p = track(gltf.loadAsync(`glb/rig/${bare}.glb`), 'rig/' + bare); cache.set(bare, p); }
  p.then((src) => {
    const g = skClone(src.scene); g.rotation.y = FACE[bare] || 0;   // before the fit, so the box is the turned figure's
    const box = new T.Box3().setFromObject(g), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    const k = height / Math.max(1e-3, size.y);
    const fit = new T.Group(); fit.scale.setScalar(k); fit.position.set(-c.x * k, -box.min.y * k, -c.z * k); fit.add(g);
    g.traverse((o) => { if ((o as T.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    holder.add(fit);
    add(g, src.animations, bare, holder);
  }).catch(() => { holder.add(staticProp(name, height)); });
  return holder;
}

function add(root: T.Object3D, clips: T.AnimationClip[], name: string, outer: T.Object3D) {
  const [kind, speed] = RIG[name], mixer = new T.AnimationMixer(root);
  const clip = (n: string) => clips.find((c) => c.name === n);
  const ic = clip('idle'), wc = kind === 'w' ? clip('walk') : undefined;
  const idle = ic ? mixer.clipAction(ic) : undefined, walk = wc ? mixer.clipAction(wc) : undefined;
  if (idle) { idle.play(); idle.time = Math.random() * ic!.duration; }
  if (walk) { walk.play(); walk.time = Math.random() * wc!.duration; walk.setEffectiveWeight(0); }
  let head: T.Bone | undefined; root.traverse((o) => { if ((o as T.Bone).isBone && o.name === 'head') head = o as T.Bone; });
  LIST.push({ name, root, outer, mixer, idle, walk, head, rest: head?.quaternion.clone(), kind, speed: speed || 0.7, base: root.rotation.y,
    last: outer.position.clone(), vel: new T.Vector3(), lim: name === 'bartender' || name === 'susan' ? 0.44 : LIM, v: 0, wk: 0, look: 0, body: 0, d: Infinity });
  RIGSTAT.figures = LIST.length;
}

const LIM = 1.05, BODY = 1.2, LOOK_D = 6, Y = new T.Vector3(0, 1, 0);
const C = new T.Vector3(), W = new T.Vector3(), S = new T.Vector3(), L = new T.Vector3(), qy = new T.Quaternion(), HQ = new T.Quaternion(), HAX = new T.Vector3(), D = new T.Vector3();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function rigTick(dt: number, camera: T.Camera, cap: number) {
  if (!LIST.length) return;
  const t0 = performance.now();
  camera.getWorldPosition(C);
  for (const r of LIST) {
    // speed of the holder in its parent's frame, in metres: the subway car rolls round you and nobody should walk for it
    const ps = r.outer.parent ? r.outer.parent.getWorldScale(S).y : 1;
    // velocity averaged as a vector (HEAD_TURN_FIX.md): a bob or a sway back and forth cancels out and never reads as walking
    if (dt > 0) { D.copy(r.outer.position).sub(r.last).multiplyScalar(ps / dt); if (D.lengthSq() > 9) D.setLength(3); r.vel.lerp(D, Math.min(1, dt * 2.5)); }
    r.last.copy(r.outer.position); r.v = r.vel.length();
    // rooms sit 1 km apart, so distance alone picks the room you are in (and a room seen through a portal waits)
    r.d = r.outer.parent ? r.root.getWorldPosition(W).distanceTo(C) : Infinity;
  }
  const act = LIST.filter((r) => r.d < 400).sort((a, b) => a.d - b.d).slice(0, cap);
  for (const r of act) {
    r.root.getWorldScale(S); const k = S.y;
    const moving = !!r.walk && r.v > 0.2;
    r.wk += ((moving ? 1 : 0) - r.wk) * Math.min(1, dt * 5);
    if (r.walk) { r.walk.setEffectiveWeight(r.wk); r.walk.timeScale = moving ? clamp(r.v / (r.speed * k), 0.3, 2.5) : 1; }
    if (r.idle) r.idle.setEffectiveWeight(1 - r.wk);
    if (r.head && r.rest) r.head.quaternion.copy(r.rest);
    r.mixer.update(dt);
    if (!r.head || r.kind === 'n' || !r.root.parent) continue;
    let want = 0, wantBody = 0;
    if (r.d < LOOK_D && r.wk < 0.5) {
      L.copy(C); r.root.parent.worldToLocal(L);
      const a = Math.atan2(L.x - r.root.position.x, L.z - r.root.position.z);
      if (Math.abs(a) < r.lim + BODY) {
        if (r.kind === 'w' || r.kind === 'i') wantBody = clamp(a - clamp(a, -r.lim, r.lim), -BODY, BODY);
        want = clamp(a - r.body, -r.lim, r.lim);
      }
    }
    r.body += (wantBody - r.body) * Math.min(1, dt * 1.6); r.root.rotation.y = r.base + r.body;
    r.look += (want - r.look) * Math.min(1, dt * 3.5);
    // about WORLD up taken into the head's frame: the head bone's rest is tilted, so its own Y spun the flower edge-on
    if (Math.abs(r.look) > 1e-4) { r.root.updateMatrixWorld(true); r.head.getWorldQuaternion(HQ).invert(); HAX.copy(Y).applyQuaternion(HQ).normalize(); r.head.quaternion.multiply(qy.setFromAxisAngle(HAX, r.look)); }
  }
  RIGSTAT.active = act.length;
  RIGSTAT.ms += (performance.now() - t0 - RIGSTAT.ms) * 0.1;
}
