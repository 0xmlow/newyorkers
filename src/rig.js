// rig.js (2026-10-28): the single figures of the show are the rigged cast (UPGRADE ALL ROOMS 2026-10-28/rig, copied into
// gen/rig and from there into assets/glb as rig_<name>.glb). Each is one skinned mesh, feet at the origin, facing +Z,
// with an `idle` clip (4 s: breath, weight shift, a glance) and a bone named `head` whose own Y axis is up. The idle runs
// from a random time; on top of it the head turns toward you, clamped (60 degrees, 25 for the Bartender), eased, and the
// body turns only past the clamp, as far as the figure's place allows (none for the clerk on his crate). That brings back
// the old trick of the drawn heads, the eyes that follow you, on the attendant, the clerk, the nave figure, the guard and
// the usher; the cashier snaps his head round when anything is shaken. ?rig=off keeps the static cast (crowd.js), and
// ?crowd=old the capsules. The static figure is kept as the fallback: a failed load leaves it as it was.
// Room ticks only run in the room you are in, so at most one or two mixers ever run at once.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CROWD_ON, figure } from './crowd.js';

export const RIG_ON = CROWD_ON && !/[?&]rig=off(&|$)/.test(location.search);
// height of each file to the flower top (rig_manifest.json) and the look clamp in degrees
const RIG = { bartender: [1.88, 25], cabbie: [1.88, 60], robber: [1.0, 60], blindwoman: [1.88, 60], killer: [1.88, 60], oscar: [1.88, 60], prince: [1.88, 60], maitre: [1.88, 60] };
const loader = new GLTFLoader(), files = {}, Y = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _hq = new THREE.Quaternion(), _ax = new THREE.Vector3(), _v = new THREE.Vector3(), _p = new THREE.Vector3();
const load = (name) => (files[name] ||= new Promise((res) => loader.load(`assets/glb/rig_${name}.glb`, (r) => res(r), undefined, () => res(null))));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const RIGS = (window.__rigs = []);   // for the audit: { name, room, fig }

// a rigged figure into `parent`, h tall, at x y z turned ry, hiding `hide` once it lands. o.near: metres within which it
// looks at you; o.body: radians the body may turn from where it was put; returns a handle with snap() (a quick head turn)
export function rigged(c, parent, name, { h, x = 0, y = 0, z = 0, ry = 0, hide = [], near = 7, body = 0.6, onload } = {}) {
  if (!RIG_ON || !RIG[name]) return figure(c, parent, name + '_full', { h, x, y, z, ry, hide, onload }), null;
  const H = { name, room: c.R.id, fig: null, look: 0, turn: 0, fast: 0, snap() { H.fast = 0.6; } };
  RIGS.push(H);
  load(name).then((r) => {
    if (!r) { figure(c, parent, name + '_full', { h, x, y, z, ry, hide, onload }); return; }
    const o = cloneSkinned(r.scene), root = new THREE.Group(); root.position.set(x, y, z); root.rotation.y = ry; root.scale.setScalar(h / RIG[name][0]); root.add(o);
    if (name === 'blindwoman') o.rotation.y = -Math.PI / 2;   // her rig file faces 90 degrees off +Z (checked in four views)
    let head = null; o.traverse((m) => { if (m.isBone && m.name === 'head') head = m; if (m.isMesh) { m.material = m.material.clone(); m.material.envMapIntensity = 1.2; m.castShadow = true; m.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(o), idle = r.animations.find((a) => a.name === 'idle');
    if (idle) { const a = mixer.clipAction(idle); a.play(); a.time = Math.random() * idle.duration; }
    parent.add(root); for (const p of hide) if (p) p.visible = false;
    for (let p = parent; p; p = p.parent) if (p.userData.click) { c.click(p, p.userData.click, p.userData.hint); break; }
    const max = RIG[name][1] * Math.PI / 180;
    // the head bone's rest pose is tilted (UPGRADE ALL ROOMS 2026-10-28/rig/HEAD_TURN_FIX.md): it goes back to rest before
    // every mixer update, and turns about world up taken into the head's own frame, so the flower stays face on
    const rest = head ? head.quaternion.clone() : null, vel = new THREE.Vector3(); let last = null;
    H.fig = { root, head, mixer };
    c.tick((t, dt) => {
      const t0 = performance.now();
      // a figure that is being carried along (none is, today) does not look: walking is read from averaged motion
      root.getWorldPosition(_p); if (last && dt > 0) vel.lerp(last.sub(_p).multiplyScalar(-1 / dt), Math.min(1, dt * 2.5)); last = (last || new THREE.Vector3()).copy(_p);
      if (head && rest) head.quaternion.copy(rest);
      mixer.update(dt);
      // you, in the figure's own frame (so the reader on the ceiling and the clerk on his crate work the same)
      root.updateWorldMatrix(true, false); _v.copy(c.camera.position); root.worldToLocal(_v);
      const d = Math.hypot(_v.x, _v.z) * root.scale.x;
      let want = 0;
      if (d < near && vel.length() < 0.2) {
        const rel = wrap(Math.atan2(_v.x, _v.z)), cl = Math.max(-max, Math.min(max, rel)); want = cl;
        const over = rel - cl; if (Math.abs(over) > 1e-3 && body > 0) { H.turn = Math.max(-body, Math.min(body, H.turn + over * Math.min(1, dt * 1.2))); root.rotation.y = ry + H.turn; }
      }
      const k = H.fast > 0 ? 16 : 3.5; H.fast -= dt;
      H.look += (want - H.look) * Math.min(1, dt * k);
      if (head && Math.abs(H.look) > 1e-3) { head.getWorldQuaternion(_hq).invert(); _ax.copy(Y).applyQuaternion(_hq).normalize(); head.quaternion.multiply(_q.setFromAxisAngle(_ax, H.look)); }
      H.ms = performance.now() - t0;
    });
    onload && onload(root);
  });
  return H;
}
