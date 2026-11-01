// crowd.js: the flower headed extras become the cast we already generated (the Tripo NEW YORKERS, _build/crowd_pass.py).
// On by default since 2026-10-28 (MLow approved the trial); ?crowd=old brings back the cylinder, box and sprite head.
// MLow's rule: the WHOLE character, its own sculpted eye flower head included, and the old sprite head hidden (a second
// flower on top looked silly). Each extra gets one of 19 full length standing characters, or for a seated extra one of four seated
// ones (the folk singer on his stool, Sally at her cafe table, the photographer in his wheelchair, the robber cross
// legged), about 3,000 triangles, tinted a little by the extra's colour, a little scale jitter, every copy sharing its
// character's geometry. The old primitives stay built and are hidden only once a character lands, so a failed load
// leaves the crowd as it was. Tricks that turned the sprite head (heads that follow you, a nod) get a pivot at the
// character's feet instead: o.userData.head becomes that pivot, so the whole character turns on its vertical axis, and
// o.userData.headY says how high its head is, for tricks that read where the head is. Files load on first use.
// Rigged (2026-10-28, later): the nearest 20 (8 on a phone) of the characters that have a rig become skinned clones that
// walk at their path's speed or idle, and turn the head bone for the head tricks (crowdTick). ?rig=off keeps them static.
//
// Adopting it in another gallery: copy this file, call crowdInit({ THREE, loader, base, on, clickable }) once, and in
// its extra(), after the head is added, call crowdBody(o, { seated, col, hide: [body, legs, head], pool }). The build must
// ship the crowd_*.glb files named below. crowdParts(names, kind) hands back loaded parts for an instanced crowd.
// Full length models only: agent, auggie, broker and usher (and bookseller, dad, hijacker, jeweler, sonny, tracksuit) were
// generated cut off above the knee and read as sunk into the floor when standing (the MoMLOW feet lineup, 2026-10-28).
export const STANDING = ['cabbie', 'workgirl', 'wiseguy', 'actress', 'annieh', 'writer', 'assistant', 'bartender', 'felix',
  'loretta', 'golfer', 'clerk', 'editor', 'gown', 'killer', 'oscar', 'rosemary', 'blindwoman', 'tough', 'hustler', 'susan', 'discoking', 'maitre'];
export const SEATED = ['folksinger', 'sally', 'lensman', 'robber'];
// the pools the galleries cast from (CHARACTERS_INVENTORY.md, 2026-10-28)
export const POOLS = {
  // walkers: only characters whose rig walks (clerk, felix, blindwoman are idle only, assistant and golfer have no rig,
  // and would glide along a path)
  walkers: ['wiseguy', 'workgirl', 'cabbie', 'editor', 'annieh', 'rosemary', 'tough', 'writer', 'hustler', 'susan', 'oscar', 'killer', 'bartender', 'discoking'],
  suits: ['clerk', 'wiseguy', 'workgirl', 'editor', 'assistant', 'oscar', 'annieh'],
  night: ['writer', 'tough', 'killer', 'gown', 'wiseguy', 'workgirl', 'cabbie', 'loretta', 'bartender', 'susan', 'discoking', 'hustler'],
  dressy: ['actress', 'gown', 'annieh', 'loretta', 'bartender', 'wiseguy', 'editor', 'maitre', 'discoking'],
  seated: ['folksinger', 'sally', 'robber', 'lensman', 'sally', 'folksinger'],
};
// the files, spelt out so the build ships them (build.py ships only names it finds quoted in the source)
export const CROWD_FILES = ['crowd_cabbie', 'crowd_cabbie_lite', 'crowd_workgirl', 'crowd_workgirl_lite', 'crowd_wiseguy',
  'crowd_wiseguy_lite', 'crowd_actress', 'crowd_actress_lite', 'crowd_annieh', 'crowd_annieh_lite', 'crowd_writer',
  'crowd_writer_lite', 'crowd_assistant', 'crowd_assistant_lite', 'crowd_bartender', 'crowd_bartender_lite', 'crowd_felix',
  'crowd_felix_lite', 'crowd_loretta', 'crowd_loretta_lite', 'crowd_golfer', 'crowd_golfer_lite', 'crowd_clerk',
  'crowd_clerk_lite', 'crowd_editor', 'crowd_editor_lite', 'crowd_gown', 'crowd_gown_lite', 'crowd_killer', 'crowd_killer_lite',
  'crowd_oscar', 'crowd_oscar_lite', 'crowd_rosemary', 'crowd_rosemary_lite', 'crowd_blindwoman', 'crowd_blindwoman_lite',
  'crowd_tough', 'crowd_tough_lite', 'crowd_folksinger', 'crowd_sally', 'crowd_lensman', 'crowd_robber',
  'crowd_hustler', 'crowd_hustler_lite', 'crowd_susan', 'crowd_susan_lite', 'crowd_discoking', 'crowd_discoking_lite', 'crowd_maitre', 'crowd_maitre_lite'];
// The parts are in metres (crowd_pass.py): standing 1.88 m to the flower's top (the sprite's top was 1.93), seated ones at
// their own height with their own stool, chair or wheelchair, feet (or the robber, cross legged) on the extra's floor.
const LIFT = {};
export const CROWD = { on: false, parts: {}, mats: new Map(), n: 0, rig: true, cap: 20, ms: 0 };
let T, CLICK, LOADER, BASE, CAST;
const LOADING = {};
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
// the pool for the set being built (build.js calls this before each set); an extra's own pool wins
export function crowdCast(pool) { CAST = pool; }

export function crowdInit({ THREE, loader, base = 'assets/glb/', on = false, clickable, rig = true, mobile = false }) {
  T = THREE; CLICK = clickable; CROWD.on = on; LOADER = loader; BASE = base; CROWD.rig = rig; CROWD.cap = mobile ? 8 : 20;
  HQ = new T.Quaternion(); PQ = new T.Quaternion(); QY = new T.Quaternion(); HAX = new T.Vector3();
}

// one file, loaded once: { geo, mat, h } or null if it failed
function part(f) {
  return (LOADING[f] ||= new Promise((res) => LOADER.load(BASE + f + '.glb', (r) => {
    let mesh = null; r.scene.traverse((m) => { if (!mesh && m.isMesh) mesh = m; });
    if (!mesh) return res(null);
    mesh.geometry.computeBoundingBox(); const p = { geo: mesh.geometry, mat: mesh.material, h: mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y };
    CROWD.parts[f] = p; res(p);
  }, undefined, () => res(null))));
}
// several characters' parts for an instanced crowd: [{ name, geo, mat, h }], the ones that loaded
export function crowdParts(names, kind = 'lite') {
  return Promise.all(names.map((n) => part(kind ? `crowd_${n}_${kind}` : `crowd_${n}`).then((p) => p && { name: n, ...p }))).then((l) => l.filter(Boolean));
}
export function tint(mat, col, k = 0.22) {
  const key = mat.uuid + ':' + col + ':' + k; let m = CROWD.mats.get(key);
  if (!m) { m = mat.clone(); m.color = new T.Color(0xffffff).lerp(new T.Color(col), k); m.envMapIntensity = 1.0; CROWD.mats.set(key, m); }
  return m;
}

// The rigged cast (UPGRADE ALL ROOMS 2026-10-28/rig, rig_pass.py: free, headless Blender): the same 3,000 triangle
// characters with a skeleton, a `walk` and an `idle` clip and a bone named `head`. Walk speed in m/s, null = idle only.
// sally is rigged but her raised hands follow the head, so she stays static; assistant and golfer have no rig.
export const RIG = { actress: 0.55, bartender: 0.778, clerk: null, discoking: 0.733, felix: null, gown: 0.55, hustler: 0.666, loretta: 0.457,
  maitre: 0.485, oscar: 0.869, tough: 0.756, annieh: 0.457, editor: 0.457, rosemary: 0.457, blindwoman: null, workgirl: 0.778, wiseguy: 0.756,
  susan: 0.756, cabbie: 0.711, killer: 0.282, prince: null, writer: 0.666, folksinger: null, lensman: null, robber: null };
export const RIG_FILES = ['rig_actress', 'rig_bartender', 'rig_clerk', 'rig_discoking', 'rig_felix', 'rig_gown', 'rig_hustler', 'rig_loretta',
  'rig_maitre', 'rig_oscar', 'rig_tough', 'rig_annieh', 'rig_editor', 'rig_rosemary', 'rig_blindwoman', 'rig_workgirl', 'rig_wiseguy',
  'rig_susan', 'rig_cabbie', 'rig_killer', 'rig_prince', 'rig_writer', 'rig_folksinger', 'rig_lensman', 'rig_robber'];
const RIG_SCALE = { robber: 1.1 };    // the static robber is 1.1 m, his rig 1.0
// four rig files face the wrong way (rig_pass.py turned every cast file the same -90 degrees; read off four view renders here;
// blindwoman is noted in rig_manifest.json too)
const RIG_YAW = { blindwoman: -Math.PI / 2, hustler: -Math.PI / 2, lensman: Math.PI / 2, tough: Math.PI / 2 };
// the static crowd files that do not face the way MLow wants (2026-10-28): crowd_susan was baked with her eye flower to the
// front, which is the back of her head; MLow: "doll face forward", so the static tier turns half way, and her rig file was
// re-rigged facing +Z (rig_pass.py YAW_EXTRA), so both tiers show the doll face, the sweater front and her toes
const STAT_YAW = { susan: Math.PI };
// The head bone takes a turn up to about 60 degrees, the body the rest; bartender and susan 25 (past that the shaker hand and
// the hair bow stretch, rig_pass notes). The turn is about WORLD up converted into the head's frame, since the head bone's
// rest is tilted: a turn on its own Y spun the flower edge-on (HEAD_TURN_FIX.md, found in the museum).
const LOOK_MAX = 1.05, LOOK_NEAR = { bartender: 0.44, susan: 0.44 };
let HQ, PQ, QY, HAX;   // scratch, made in crowdInit
const ACTORS = [];
let RIGS = {};                          // name: Promise of the loaded gltf
function rigFile(nm) {
  return (RIGS[nm] ||= new Promise((res) => LOADER.load(BASE + 'rig_' + nm + '.glb', (g) => res(g), undefined, () => res(null))));
}

// o: the extra's group. Adds an empty slot now (so children the caller adds later keep their order) and fills it
// when the character has loaded. pool: a POOLS key or a list of names; seated extras only take seated characters.
// o.userData.head becomes `look`, an empty at head height: a trick turns it (rotation.y, or a nod on rotation.z) as it
// turned the sprite, and crowdTick hands that turn to the head bone (rigged) or the whole character (static).
export function crowdBody(o, { seated = false, col = 0x3a4a6a, hide = [], pool = CAST } = {}) {
  if (!CROWD.on || !LOADER) return null;
  const list = Array.isArray(pool) ? pool : POOLS[pool];
  let names = (list || (seated ? POOLS.seated : STANDING)).filter((n) => SEATED.includes(n) === seated);
  if (!names.length) names = seated ? POOLS.seated : STANDING;
  const slot = new T.Group(); o.add(slot);
  const k = CROWD.n++, hsh = Math.abs(Math.round(o.position.x * 3 + o.position.z * 7));
  const nm = names[(k * 7 + hsh) % names.length];
  part(`crowd_${nm}`).then((p) => {
    if (!p) return;
    const s = 0.97 + ((k * 37) % 7) / 100;
    const pivot = new T.Group(); pivot.position.y = LIFT[nm] || 0; slot.add(pivot);
    const m = new T.Mesh(p.geo, tint(p.mat, col)); m.scale.setScalar(s); m.rotation.y = STAT_YAW[nm] || 0; pivot.add(m);
    const look = new T.Group(); look.position.y = seated ? 1.3 : 1.62; slot.add(look);
    const click = hide.find((h) => h.userData.click);
    hide.forEach((h) => { h.visible = false; });
    o.userData.head = look; o.userData.headY = 0; o.userData.cast = nm;
    if (click && CLICK) CLICK(m, click.userData.click, click.userData.hint);
    ACTORS.push({ o, slot, pivot, stat: m, look, nm, s, col, click, seated, rig: null, want: false, last: null, v: new T.Vector3(), base: 0, w: 0, ph: (k * 0.618) % 1 });
  });
  return slot;
}

// build one actor's rigged clone (once), hidden until chosen
function makeRig(a) {
  a.rig = 'loading';
  rigFile(a.nm).then((g) => {
    if (!g) { a.rig = 'none'; return; }
    const root = skClone(g.scene); let head = null, mesh = null;
    root.traverse((q) => { if (q.isBone && q.name === 'head') head = q; if (q.isSkinnedMesh) { mesh = q; q.material = tint(q.material, a.col); q.frustumCulled = false; } });
    root.scale.setScalar(a.s * (RIG_SCALE[a.nm] || 1)); root.rotation.y = RIG_YAW[a.nm] || 0; root.visible = false; a.pivot.add(root);
    const mixer = new T.AnimationMixer(root), clip = (n) => g.animations.find((c) => c.name === n);
    const idle = clip('idle') && mixer.clipAction(clip('idle')), walk = RIG[a.nm] && clip('walk') ? mixer.clipAction(clip('walk')) : null;
    if (idle) { idle.play(); idle.time = a.ph * idle.getClip().duration; }
    if (walk) { walk.play(); walk.time = a.ph * walk.getClip().duration; walk.setEffectiveWeight(0); }
    if (mesh && a.click && CLICK) CLICK(mesh, a.click.userData.click, a.click.userData.hint);
    a.rig = { root, mixer, idle, walk, head, rest: head ? head.quaternion.clone() : null, scale: root.scale.x };
  });
}

let since = 1;
// once a frame (main.js ticks it): choose the nearest actors for a skin, play their clips at their path speed, and
// hand every trick's head turn to a bone or a body
export function crowdTick(dt, camera) {
  if (!CROWD.on || !ACTORS.length) return;
  const t0 = performance.now();
  const P = new T.Vector3(), cam = camera.getWorldPosition(new T.Vector3()), Q = new T.Quaternion(), E = new T.Euler();
  since += dt;
  if (CROWD.rig && since > 0.25) {     // the cap: the nearest few within 30 m get a skin, the rest stay static
    since = 0;
    const live = ACTORS.filter((a) => a.nm in RIG && shown(a.o));
    live.forEach((a) => { a.o.getWorldPosition(P); a.dist = P.distanceTo(cam); });
    live.sort((a, b) => a.dist - b.dist);
    const cap = CROWD.cap, chosen = new Set(live.filter((a) => a.dist < 30).slice(0, cap));
    for (const a of ACTORS) { a.want = chosen.has(a); if (a.want && !a.rig) makeRig(a); }
  }
  for (const a of ACTORS) {
    // the path speed, smoothed over about a second so a bob or a sway in place does not start a walk
    a.o.getWorldPosition(P);
    if (a.last && dt > 0) { const k = Math.min(1, dt / 1.2); a.v.x += ((P.x - a.last.x) / dt - a.v.x) * k; a.v.z += ((P.z - a.last.z) / dt - a.v.z) * k; }
    a.last = a.last || new T.Vector3(); a.last.copy(P);
    const speed = Math.hypot(a.v.x, a.v.z), yaw = a.look.rotation.y, roll = a.look.rotation.z;
    const r = a.rig && a.rig !== 'loading' && a.rig !== 'none' ? a.rig : null, on = !!(r && a.want);
    if (r) { r.root.visible = on; a.stat.visible = !on; } else a.stat.visible = true;
    if (on) {
      const walking = !!r.walk && speed > 0.2;   // speed from the vector averaged velocity: a sway in place averages out
      if (walking) {   // face the way the path goes (in the extra's own frame), and step at its speed so the feet stay planted
        a.o.getWorldQuaternion(Q); E.setFromQuaternion(Q, 'YXZ');
        const want = Math.atan2(a.v.x, a.v.z) - E.y; let d = want - a.base; d = Math.atan2(Math.sin(d), Math.cos(d)); a.base += d * Math.min(1, dt * 4);
        r.walk.timeScale = Math.max(0.4, Math.min(2.5, speed / (RIG[a.nm] * r.scale)));
      } else a.base -= a.base * Math.min(1, dt * 2);
      a.w += ((walking ? 1 : 0) - a.w) * Math.min(1, dt * 3);
      if (r.walk) r.walk.setEffectiveWeight(a.w); if (r.idle) r.idle.setEffectiveWeight(1 - a.w);
      if (r.head) r.head.quaternion.copy(r.rest);   // the mixer writes the head only where a clip keys it: never accumulate
      r.mixer.update(dt);
      const lim = LOOK_NEAR[a.nm] || LOOK_MAX, hy = Math.max(-lim, Math.min(lim, yaw));
      a.pivot.rotation.y = a.base + (yaw - hy); a.pivot.rotation.z = 0;
      if (r.head && (Math.abs(hy) > 1e-3 || Math.abs(roll) > 1e-3)) {
        a.pivot.updateMatrixWorld(true); r.head.getWorldQuaternion(HQ).invert();
        if (Math.abs(hy) > 1e-3) { HAX.set(0, 1, 0).applyQuaternion(HQ).normalize(); r.head.quaternion.multiply(QY.setFromAxisAngle(HAX, hy)); }
        if (Math.abs(roll) > 1e-3) { a.pivot.getWorldQuaternion(PQ); HAX.set(0, 0, 1).applyQuaternion(PQ).applyQuaternion(HQ).normalize(); r.head.quaternion.multiply(QY.setFromAxisAngle(HAX, roll)); }
      }
    } else { a.pivot.rotation.y = yaw; a.pivot.rotation.z = roll; }   // static: the whole character turns, as before
  }
  CROWD.ms = CROWD.ms * 0.9 + (performance.now() - t0) * 0.1;
}
function shown(o) { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }
