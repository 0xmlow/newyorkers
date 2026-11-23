/* ================================================================
   v106 REAL ANIMALS (2026-11-23)
   The hand built dogs become real rigged animals. Every animal and car from here on is a CC0 model by Quaternius
   (Public Domain, from poly.pizza: the Animated Animal Pack, the Pigeon, the Rat, the Taxi and the Car), loaded
   from assets/glb/cc0, cloned with its own skeleton (RigCrowd.cloneSkinned) and driven by its own clips: it walks
   when it moves, gallops when it is fast, idles and eats when it stops, and its feet keep pace with the ground.
   CC0.dress(group, name, opts) hides an old hand built model and puts the real one inside the same group, so all
   the old behaviour (fetch, chasing pigeons, the leashes) keeps working untouched.
   ================================================================ */
const CC0 = { a: {}, live: [], face: { shiba: 0, husky: 0, horse: 0, pigeon: 0, rat: 0, taxi: 0, car_b: 0, cow: 0, donkey: 0, alpaca: 0, wolf: 0, deer: 0, stag: 0 } };
window.__CC0 = CC0;
CC0.load = name => CC0.a[name] || (CC0.a[name] = new Promise(res => {
  if (!gltfLoader) return res(null);
  gltfLoader.load('assets/glb/cc0/' + name + '.glb', g => { try { g.scene.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(g.scene); g.size = bb.getSize(new THREE.Vector3()); g.min = bb.min.clone(); g.center = bb.getCenter(new THREE.Vector3());
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } }); } catch (e) { } res(g); }, undefined, () => { (window.__propFail = window.__propFail || []).push(name); res(null); });
}));
const CC0_CLIPS = { walk: /(^|\|)(Rat_)?Walk$/, run: /(^|\|)(Gallop|Rat_Run)$/, idle: /(^|\|)(Rat_)?Idle$/, eat: /(^|\|)Eating$/, jump: /(^|\|)(Rat_)?Jump$/, peck: /Bite_Front$/, attack: /(^|\|)(Rat_)?Attack(_Headbutt)?$/, dance: /\|Dance$/, leap: /(^|\|)Gallop_Jump$/ };
CC0.make = (name, opts) => {
  opts = opts || {}; const h = { name, root: new THREE.Group(), opts, st: '', sp: 0, last: null, mixer: null, acts: {}, wheels: [], ready: false };
  (opts.parent || scene).add(h.root); if (opts.pos) h.root.position.copy(opts.pos);
  CC0.load(name).then(g => { if (!g) return; const skinned = g.animations && g.animations.length; const m = skinned && window.RigCrowd ? RigCrowd.cloneSkinned(g.scene) : g.scene.clone(true);
    const s = opts.h ? opts.h / g.size.y : opts.len ? opts.len / Math.max(g.size.x, g.size.z) : (opts.scale || 1); m.scale.setScalar(s); m.position.set(-g.center.x * s, -g.min.y * s, -g.center.z * s);
    const wrap = new THREE.Group(); wrap.rotation.y = (opts.yaw || 0) + (CC0.face[name] || 0); wrap.add(m); h.root.add(wrap); h.model = m; h.wrap = wrap;
    if (opts.tint !== undefined) { const t = new THREE.Color(opts.tint); m.traverse(o => { if (o.isMesh && o.material) { o.material = Array.isArray(o.material) ? o.material.map(q => q.clone()) : o.material.clone(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(q => { if (q.color && !/Eye|Black|Window|Light|Pupil/i.test(q.name)) q.color.multiply(t); }); } }); }
    // wheels: re-centre each wheel mesh on its own hub and spin it about its axle (the one bbox axis unlike the other two)
    m.traverse(o => { if (!/Wheel/i.test(o.name || '') || !o.isMesh || !o.geometry) return; o.geometry = o.geometry.clone(); o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox, c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      o.geometry.translate(-c.x, -c.y, -c.z); o.position.add(c.clone().multiply(o.scale).applyQuaternion(o.quaternion)); const d = [Math.abs(sz.x - (sz.y + sz.z) / 2), Math.abs(sz.y - (sz.x + sz.z) / 2), Math.abs(sz.z - (sz.x + sz.y) / 2)];
      o.userData.axle = d[0] >= d[1] && d[0] >= d[2] ? 'x' : d[1] >= d[2] ? 'y' : 'z'; o.userData.q0 = o.quaternion.clone(); o.userData.spin = 0; h.wheels.push(o); });
    if (name === 'pigeon') m.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); if (/Main/.test(o.material.name)) o.material.color.setHex([0x4e535c, 0x5d626b, 0x454a52, 0x6a6f77][Math.floor(Math.random() * 4)]); if (/Secondary/.test(o.material.name)) o.material.color.setHex(0x3a4a48); o.material.roughness = 0.8; } });
    if (skinned) { h.mixer = new THREE.AnimationMixer(m); for (const k in CC0_CLIPS) { const c = g.animations.find(a => CC0_CLIPS[k].test(a.name)); if (c) h.acts[k] = h.mixer.clipAction(c); } }
    h.ready = true; if (opts.onReady) opts.onReady(h); });
  CC0.live.push(h); return h;
};
CC0.dress = (group, name, opts) => { opts = Object.assign({}, opts || {}); group.traverse(o => { if (o.isMesh && !(opts.keep && opts.keep(o))) o.visible = false; }); opts.parent = group; return CC0.make(name, opts); };
CC0.play = (h, st, fade) => { if (!h.mixer || h.st === st) return; const a = h.acts[st] || h.acts.idle; if (!a) return; const prev = h.acts[h.st]; a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play(); if (prev && prev !== a) prev.crossFadeTo(a, fade || 0.25, false); h.st = st; };
const _cw = new THREE.Vector3(), _cq = new THREE.Quaternion(), _ax = new THREE.Vector3();
function cc0Visible(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function cc0Frame(dt) {
  CC0.live.forEach(h => { if (!h.ready) return; h.root.getWorldPosition(_cw); const d = _cw.distanceTo(camera.position);
    if (h.last) { const v = Math.hypot(_cw.x - h.last.x, _cw.z - h.last.z) / Math.max(dt, 1e-3); h.sp += (Math.min(v, 30) - h.sp) * Math.min(1, dt * 6); } else h.last = new THREE.Vector3(); h.last.copy(_cw);
    if (h.wheels.length) h.wheels.forEach(w => { w.userData.spin += h.sp / 0.35 * dt; const ax = w.userData.axle; w.quaternion.copy(w.userData.q0).multiply(_cq.setFromAxisAngle(ax === 'x' ? _ax.set(1, 0, 0) : ax === 'y' ? _ax.set(0, 1, 0) : _ax.set(0, 0, 1), w.userData.spin)); });
    if (!h.mixer || d > (h.opts.far || 90) || !cc0Visible(h.root)) return;
    let st = h.force || (h.sp > (h.opts.runAt || 3.2) ? 'run' : h.sp > 0.18 ? 'walk' : (h.opts.idleAlt && Math.sin(LIFE.t * 0.13 + h.root.id) > 0.6 ? h.opts.idleAlt : 'idle')); CC0.play(h, st);
    const a = h.acts[h.st]; if (a) a.timeScale = h.st === 'walk' ? Math.max(0.5, Math.min(2, h.sp / (h.opts.walkSp || 1.2))) : h.st === 'run' ? Math.max(0.7, Math.min(1.6, h.sp / (h.opts.runSp || 6))) : 1;
    h.mixer.update(dt); });
}
window.__FRAMES.push(dt => { try { cc0Frame(dt); } catch (e) { if (!CC0.err) { CC0.err = e; console.warn('v106 cc0', e); } } });
// the dogs: the fetch dog, the two that chase pigeons, and the dog walker's six
(function realDogs() {
  try { if (FETCH && FETCH.d) CC0.dress(FETCH.d.g, 'shiba', { h: 0.62 / 1.35, idleAlt: 'eat', walkSp: 1.0, runSp: 5 }); } catch (e) { }
  try { ZOO.dogs.forEach((o, i) => CC0.dress(o.d.g, i ? 'husky' : 'shiba', { h: (i ? 0.75 : 0.6) / (i ? 1.1 : 0.9), tint: i ? undefined : 0x3a3a3a, idleAlt: 'eat' })); } catch (e) { }
  try { const kinds = [['husky', 0.8, 0xb0a698], ['shiba', 0.42, undefined], ['husky', 0.62, 0xf0dcb8], ['shiba', 0.36, 0xd8c09a], ['husky', 0.7, undefined], ['shiba', 0.45, 0x2a2622]];
    DOGW.dogs.forEach((d, i) => { const [n, hh, tint] = kinds[i]; CC0.dress(d.g, n, { h: hh, yaw: PI / 2, tint, walkSp: 1.1, idleAlt: 'eat' }); }); } catch (e) { }
})();
