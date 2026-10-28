// The rigged cast (2026-10-28). The same Tripo eye flower New Yorkers as the static cast, rigged in Blender
// (UPGRADE ALL ROOMS 2026-10-28/rig, RIG_TRIAL.md): 3,000 triangles, a walk and an idle clip, a bone named head.
// main.js load() takes assets/rig/<name>.glb for a name in RIG and falls back to the static GLB when it fails;
// ?rig=off keeps the static cast. Files face +Z, feet on the origin, 1.88 m to the flower top.
//
// rigTick() runs once a frame: the nearest figures (20 on a desktop, 8 on a phone) play; the rest hold their pose,
// which before their first update is the sculpted pose of the static file. A figure whose group moves walks, its clip
// scaled to its real speed so the planted foot stays put; one that stands idles from a random start. Near the visitor
// the head bone turns toward the camera (60 degrees at most, eased) and a standing body turns only past that.
import * as THREE from 'three';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// name: [kind, walk m/s at 1.88 m]. w walks and idles, i idle only (a prop on the floor), s seated, n seated without look
export const RIG = {
  actress: ['w', 0.55], bartender: ['w', 0.78], discoking: ['w', 0.73], gown: ['w', 0.55], hustler: ['w', 0.67], loretta: ['w', 0.46],
  maitre: ['w', 0.49], oscar: ['w', 0.87], tough: ['w', 0.76], annieh: ['w', 0.46], editor: ['w', 0.46], rosemary: ['w', 0.46],
  workgirl: ['w', 0.78], wiseguy: ['w', 0.76], susan: ['w', 0.76], cabbie: ['w', 0.71], killer: ['w', 0.28], writer: ['w', 0.67],
  clerk: ['i'], felix: ['i'], blindwoman: ['i'], prince: ['i'],
  folksinger: ['s'], robber: ['s'], sally: ['n'], lensman: ['n'],   // sally and lensman hold things to the face: no look
};
// Files that do not face +Z after all (2026-10-28, UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing): five rig files face 90
// degrees off. main.js turns the clone by this before it is placed (inside the figure, so rigAdd's base keeps it and the
// group's rotation, the look and the body turn all keep +Z as the front). The static tough and sally face +Z already.
// susan needs none: her file was re-rigged doll face forward (rig_pass.py YAW_EXTRA), so her look aims the doll face.
export const RIG_FACE = { blindwoman: -Math.PI / 2, hustler: -Math.PI / 2, lensman: Math.PI / 2, tough: Math.PI / 2, sally: Math.PI / 2 };
export const RIG_ON = !/[?&]rig=off\b/.test(location.search);
export const RIGSTAT = { figures: 0, active: 0, ms: 0 };
export const rigClone = skClone;

const LIST = [], LIM = 1.05, BODY = 1.2, LOOK_D = 6, Y = new THREE.Vector3(0, 1, 0);
const C = new THREE.Vector3(), W = new THREE.Vector3(), S = new THREE.Vector3(), L = new THREE.Vector3(), qy = new THREE.Quaternion(), HQ = new THREE.Quaternion(), HAX = new THREE.Vector3(), D = new THREE.Vector3();
Object.defineProperty(RIGSTAT, 'list', { value: LIST });   // for the review harness, kept out of JSON
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// root: the clone of the rigged scene, already placed; outer: the group the room code moves (its position is the path)
export function rigAdd(root, clips, name, outer) {
  const [kind, speed] = RIG[name], mixer = new THREE.AnimationMixer(root);
  const clip = (n) => clips.find((c) => c.name === n);
  const idle = clip('idle') && mixer.clipAction(clip('idle'));
  const walk = kind === 'w' && clip('walk') ? mixer.clipAction(clip('walk')) : null;
  if (idle) { idle.play(); idle.time = Math.random() * idle.getClip().duration; }
  if (walk) { walk.play(); walk.time = Math.random() * walk.getClip().duration; walk.setEffectiveWeight(0); }
  let head = null; root.traverse((o) => { if (o.isBone && o.name === 'head') head = o; });
  const rec = { name, root, outer, mixer, idle, walk, head, kind, speed: speed || 0.7, rest: head ? head.quaternion.clone() : null, base: root.rotation.y,
    last: outer.position.clone(), vel: new THREE.Vector3(), lim: name === 'bartender' || name === 'susan' ? 0.44 : LIM, v: 0, wk: 0, look: 0, body: 0, d: Infinity };
  LIST.push(rec); RIGSTAT.figures = LIST.length; return rec;
}
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

export function rigTick(dt, camera, cap) {
  if (!LIST.length) return;
  const t0 = performance.now();
  camera.getWorldPosition(C);
  for (const r of LIST) {
    // the speed of the group the room moves, in its parent's frame (a room that rolls or slides does not make anyone walk)
    const ps = r.outer.parent ? r.outer.parent.getWorldScale(S).y : 1;   // in metres: a room may be built at a forced scale
    // velocity averaged as a vector (HEAD_TURN_FIX.md): a bob or a sway back and forth cancels out and never reads as walking
    if (dt > 0) { D.copy(r.outer.position).sub(r.last).multiplyScalar(ps / dt); if (D.lengthSq() > 9) D.setLength(3); r.vel.lerp(D, Math.min(1, dt * 2.5)); }
    r.last.copy(r.outer.position); r.v = r.vel.length();
    r.d = r.outer.parent && shown(r.root) ? r.root.getWorldPosition(W).distanceTo(C) : Infinity;
  }
  const act = LIST.filter((r) => r.d < Infinity).sort((a, b) => a.d - b.d).slice(0, cap);
  for (const r of act) {
    r.root.getWorldScale(S); const k = S.y;
    const moving = !!r.walk && r.v > 0.2;
    r.wk += ((moving ? 1 : 0) - r.wk) * Math.min(1, dt * 5);
    if (r.walk) { r.walk.setEffectiveWeight(r.wk); r.walk.timeScale = moving ? clamp(r.v / (r.speed * k), 0.3, 2.5) : 1; }
    if (r.idle) r.idle.setEffectiveWeight(1 - r.wk);
    if (r.head) r.head.quaternion.copy(r.rest);
    r.mixer.update(dt);
    if (!r.head || r.kind === 'n') continue;
    // where the visitor is, in the frame the figure was placed in (its front is +Z there)
    let want = 0, wantBody = 0;
    if (r.d < LOOK_D && r.wk < 0.5 && r.root.parent) {
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
