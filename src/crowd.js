// crowd.js (2026-10-28): the capsule New Yorkers become the cast we generated (the ON LOCATION Tripo characters, an eye
// flower head modelled into every one), cut light by tools/crowd_pass.py into gen/crowd and copied into assets/glb.
// Default on; ?crowd=old keeps the capsules. The capsules are still built and hidden only once the model lands, so a
// failed load leaves the room as it was. Files are named in full so the build ships them:
//   whole figures  crowd_bartender_full crowd_maitre_full crowd_killer_full crowd_oscar_full crowd_writer_full
//                  crowd_cabbie_full crowd_assistant_full crowd_hustler_full crowd_robber_full crowd_blindwoman_full
//                  crowd_prince_full (6,000 tris, 512 px); crowd_susan_full (1,500, 256)
//                  each with its own sculpted eye flower head; any flower drawn in code for the old figure is hidden
//                  (MLow, 2026-10-28: never a second head on a cast member). Only models with legs to the feet:
//                  usher, agent, auggie, bookseller, broker, dad, hijacker, jeweler, sonny, tracksuit stop above the knee
//   hips up        crowd_actress_upper crowd_gown_upper crowd_loretta_upper crowd_editor_upper
//                  crowd_discoking_upper crowd_hustler_upper                                       (1,200 tris, 256 px)
//                  the heart's audience in the boxes, one InstancedMesh per character, their own heads
export const CROWD_ON = !/[?&]crowd=old(&|$)/.test(location.search);

// a figure: crowd_<file> into `parent` (a figure's group), h tall, standing at y, turned ry; hides `hide` when it lands and
// makes the new meshes answer the figure's click
export function figure(c, parent, file, { h, x = 0, y = 0, z = 0, ry = 0, hide = [], onload } = {}) {
  if (!CROWD_ON) return null;
  const out = c.glb('crowd_' + file, { h, x, y, z, ry, parent, onload: (g, sc) => {
    for (const o of hide) if (o) o.visible = false;
    for (let p = parent; p; p = p.parent) if (p.userData.click) { c.click(p, p.userData.click, p.userData.hint); break; }
    onload && onload(g, sc);
  } });
  (window.__crowd = window.__crowd || []).push({ file, g: out, room: c.R.id });   // for the audit shots: which figure is where
  return out;
}

// the parts of a capsule figure to hide: every mesh already in the group, except the ones kept
export const parts = (grp, keep = []) => grp.children.filter((o) => o.isMesh && !keep.includes(o));

// a seated audience: one InstancedMesh per character, seat i gets character i % n. seats: [{ x, y, z }] (y is the seat
// floor). Calls done(list) once every character has landed: list[i] = { mesh, idx } for seat i.
export function audience(c, files, seats, { tall = 1.75, hip = 0.62, done } = {}) {
  if (!CROWD_ON || !seats.length) return;
  const THREE = c.THREE, holder = new THREE.Group(); holder.visible = false; c.add(holder);
  const got = new Array(files.length).fill(null); let left = files.length;
  files.forEach((f, k) => c.glb('crowd_' + f, { parent: holder, shadow: false, onload: (g, sc) => {
    let mesh = null; sc.traverse((m) => { if (!mesh && m.isMesh) mesh = m; });
    if (mesh) got[k] = mesh;
    if (--left) return;
    const use = got.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
    if (!use.length) return;
    const ims = {}, list = [];
    for (const i of use) {
      const n = seats.filter((_, s) => use[s % use.length] === i).length;
      const geo = got[i].geometry; geo.computeBoundingBox();
      const im = new THREE.InstancedMesh(geo, got[i].material, n); im.frustumCulled = false; im.castShadow = false;
      im.userData.k = tall * 0.6 / (geo.boundingBox.max.y - geo.boundingBox.min.y); im.userData.n = 0;
      ims[i] = im; c.add(im);
    }
    seats.forEach((s, j) => { const im = ims[use[j % use.length]]; list.push({ mesh: im, idx: im.userData.n++, base: new THREE.Vector3(s.x, s.y + hip, s.z), k: im.userData.k }); });
    done && done(list);
  } }));
}
