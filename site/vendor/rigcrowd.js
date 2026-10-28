/* rigcrowd.js (2026-10-28): the rigged NEW YORKERS cast for the three.js r128 pages (MoMLOW, MEME ISLAND).
   The cast was rigged in UPGRADE ALL ROOMS 2026-10-28/rig (rig_pass.py, RIG_TRIAL.md): each figure is one skinned mesh,
   1.88 m to the flower top, feet at the origin, facing +Z, with a `walk` clip (a 1 s in place loop: the planted foot
   moves back at the figure's recorded speed) and an `idle` clip (4 s, breath, weight shift, a glance), and a bone named
   `head` whose own Y axis is world up. The full file is 3,000 tris, the lite file 800 tris with the same skeleton.

   RigCrowd.load(loader, url)       one parse per file, shared by every copy
   new RigCrowd.Figure(asset, opt)  a clone with its own skeleton and mixer; walk while moving, idle while not (crossfade
                                    0.3 s), random start time, a head yaw on top of the clip toward a target, clamped
   RigCrowd.Lod(opt)                ranks figures by distance (and whether they are in front), hands out the full tier,
                                    the lite tier and the static tier under a cap, and times the mixer updates
   No SkeletonUtils is vendored in these pages, so cloneSkinned() is the same parallel traverse rebind it does. */
(function () {
  "use strict";
  const THREE = window.THREE;
  const Y = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _hq = new THREE.Quaternion(), _ax = new THREE.Vector3(), _p = new THREE.Vector3();
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function parallel(a, b, fn) { fn(a, b); for (let i = 0; i < a.children.length; i++) parallel(a.children[i], b.children[i], fn); }
  // SkeletonUtils.clone: clone the graph, then point every cloned skinned mesh at the cloned bones
  function cloneSkinned(src) {
    const out = src.clone(true), map = new Map();
    parallel(src, out, (a, b) => map.set(a, b));
    parallel(src, out, (a, b) => {
      if (!b.isSkinnedMesh) return;
      b.skeleton = a.skeleton.clone(); b.bindMatrix.copy(a.bindMatrix);
      b.skeleton.bones = a.skeleton.bones.map((bn) => map.get(bn));
      b.bind(b.skeleton, b.bindMatrix);
    });
    return out;
  }

  const files = {};
  function load(loader, url) {
    if (!files[url]) files[url] = new Promise((res) => {
      loader.load(url, (r) => {
        const clips = {}; for (const c of r.animations || []) clips[c.name] = c;
        let ok = false; r.scene.traverse((o) => { if (o.isSkinnedMesh) ok = true; });
        res(ok ? { scene: r.scene, clips } : null);
      }, undefined, () => { (window.__propFail = window.__propFail || []).push(url); res(null); });
    });
    return files[url];
  }

  // opt: { scale, speed (the recorded walk speed in m/s at scale 1), walks (false for idle only), lookMax (radians),
  //        shadow, material (fn: material => material), moving, yaw (turns the model inside the root) }
  function Figure(asset, opt) {
    this.opt = opt; this.scale = opt.scale || 1; this.speed = opt.speed || 0.7; this.lookMax = opt.lookMax || 1.05;
    this.root = new THREE.Group();
    const o = this.model = cloneSkinned(asset.scene); this.root.add(o); this.root.scale.setScalar(this.scale);
    if (opt.yaw) o.rotation.y = opt.yaw;   // a file that does not face +Z (the Blind Woman faces 90 degrees off)
    this.head = null; this.tris = 0;
    o.traverse((m) => {
      if (m.isBone && m.name === "head") this.head = m;
      if (m.isMesh) {
        m.castShadow = !!opt.shadow; m.receiveShadow = true;
        if (opt.material) m.material = opt.material(m.material);
        const g = m.geometry; this.tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      }
    });
    const mx = this.mixer = new THREE.AnimationMixer(o);
    this.walk = opt.walks !== false && asset.clips.walk ? mx.clipAction(asset.clips.walk) : null;
    this.idle = asset.clips.idle ? mx.clipAction(asset.clips.idle) : null;
    for (const a of [this.walk, this.idle]) if (a) { a.play(); a.time = Math.random() * a.getClip().duration; a.setEffectiveWeight(0); a.enabled = false; }
    this.moving = null; this.look = 0; this.lookWant = 0; this.lookOn = false;
    // the head bone's rest pose is tilted (HEAD_TURN_FIX.md): keep it, put it back before every mixer update (a clip
    // that does not key the head would otherwise accumulate the turn), and turn about world up in the head's own frame
    this.rest = this.head ? this.head.quaternion.clone() : null;
    this.vel = new THREE.Vector3(); this.last = null; this.walking = false;
    this.setMoving(!!opt.moving, 0);
  }
  Figure.prototype.setMoving = function (on, fade) {
    on = on && !!this.walk;
    if (on === this.moving) return; this.moving = on;
    const to = on ? this.walk : this.idle, from = on ? this.idle : this.walk;
    if (!to) return;
    to.enabled = true; to.setEffectiveTimeScale(1);
    if (!fade || !from || !from.enabled) { if (from) { from.stopFading(); from.setEffectiveWeight(0); from.enabled = false; } to.stopFading(); to.setEffectiveWeight(1); return; }
    to.setEffectiveWeight(1); from.crossFadeTo(to, fade, false);
  };
  // the head turns toward a world yaw: rel is the angle from the body's facing, clamped; returns what the clamp left over
  // (the body turns by that much, eased by the caller). null lets the head come home.
  Figure.prototype.lookToward = function (rel) {
    if (rel === null || rel === undefined) { this.lookOn = false; this.lookWant = 0; return 0; }
    rel = wrap(rel); const c = Math.max(-this.lookMax, Math.min(this.lookMax, rel));
    this.lookOn = true; this.lookWant = c; return rel - c;
  };
  // ground speed in m/s while moving: the walk's time scale follows it so the planted foot stays put
  Figure.prototype.update = function (dt, ground) {
    if (this.moving && this.walk && ground) this.walk.setEffectiveTimeScale(ground / (this.speed * this.scale));
    // walking is read from the figure's real motion, averaged as a vector, so a bob or a sway never counts
    this.root.getWorldPosition(_p);
    if (this.last && dt > 0) this.vel.lerp(this.last.sub(_p).multiplyScalar(-1 / dt), Math.min(1, dt * 2.5));
    this.last = (this.last || new THREE.Vector3()).copy(_p); this.walking = this.vel.length() > 0.2;
    if (this.head && this.rest) this.head.quaternion.copy(this.rest);
    this.mixer.update(dt);
    const want = this.walking ? 0 : this.lookWant;
    this.look += (want - this.look) * Math.min(1, dt * 4);
    if (this.head && Math.abs(this.look) > 1e-3) {
      this.head.getWorldQuaternion(_hq).invert(); _ax.copy(Y).applyQuaternion(_hq).normalize();
      this.head.quaternion.multiply(_q.setFromAxisAngle(_ax, this.look));
    }
  };
  Figure.prototype.dispose = function () { this.mixer.stopAllAction(); if (this.root.parent) this.root.parent.remove(this.root); };

  // tiers: 0 full rig, 1 lite rig, 2 static. opt: { cap, full, every }. Each item: { pos(): Vector3, rig: bool,
  // setTier(t) }. The figures in front of the camera are preferred; a figure behind counts as 2.5 times as far.
  function Lod(opt) {
    this.cap = opt.cap; this.full = Math.min(opt.full, opt.cap); this.every = opt.every || 0.3; this.t = this.every;
    this.items = []; this.stats = { skinned: 0, full: 0, lite: 0, static: 0, tris: 0, mixMs: 0, mixAvg: 0, figures: 0 };
  }
  const _v = new THREE.Vector3(), _f = new THREE.Vector3();
  Lod.prototype.add = function (it) { it.tier = -1; this.items.push(it); };
  Lod.prototype.rank = function (cam) {
    cam.getWorldDirection(_f);
    const list = [];
    for (const it of this.items) {
      if (!it.rig) { if (it.tier !== 2) { it.tier = 2; it.setTier(2); } continue; }
      _v.copy(it.pos()).sub(cam.position); const d = _v.length(); const front = _v.dot(_f) > -1;
      list.push({ it, s: front ? d : d * 2.5 });
    }
    list.sort((a, b) => a.s - b.s);
    list.forEach((e, i) => { const t = i < this.full ? 0 : i < this.cap ? 1 : 2; if (t !== e.it.tier) { e.it.tier = t; e.it.setTier(t); } });
  };
  // call once a frame: re-ranks every `every` seconds, then runs fn(item, dt) for each skinned item, timed
  Lod.prototype.tick = function (dt, cam, fn) {
    this.t += dt; if (this.t >= this.every) { this.t = 0; this.rank(cam); }
    const t0 = performance.now(); const s = this.stats; s.full = s.lite = s.static = s.tris = 0;
    for (const it of this.items) {
      if (it.tier === 0) s.full++; else if (it.tier === 1) s.lite++; else { s.static++; continue; }
      fn(it, dt); if (it.fig) s.tris += it.fig.tris;
    }
    s.skinned = s.full + s.lite; s.figures = this.items.length;
    s.mixMs = performance.now() - t0; s.mixAvg += (s.mixMs - s.mixAvg) * 0.05;
  };

  window.RigCrowd = { load, Figure, Lod, cloneSkinned, wrap };
})();
