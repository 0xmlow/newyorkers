/* rigcast.js: the rigged NEW YORKERS cast for a walkable gallery (2026-10-28).
 *
 * A plain script that sets window.RigCast, so the same file runs in the three.js r128 galleries (global THREE,
 * <script> tag) and the r169 module galleries (import './rigcast.js' for its side effect). The page passes its own
 * THREE, a GLTFLoader and a skinned clone function (SkeletonUtils.clone), so nothing here imports three.
 *
 * Two tiers, as RIG_TRIAL.md proposes:
 *  - far: one InstancedMesh per character, the lite rig's geometry in its rest pose (no skinning, ~800 triangles),
 *    every spot of that character in one draw call;
 *  - near: the nearest `cap` spots (about 20 on a desktop, 8 on a phone) become SkinnedMesh clones of the full rig
 *    with their own AnimationMixer, playing idle from a random start. The instance under a near figure is hidden
 *    (zero scale) and restored when the visitor walks away.
 * Look at: after the mixer, the bone named `head` takes a yaw about world up (converted into the head's tilted frame,
 * HEAD_TURN_FIX.md) toward the camera, clamped to 60 degrees (25 for bartender and susan) and eased;
 * past 60 the whole figure turns slowly by the excess, and eases back once the visitor leaves.
 *
 * Spots: [{ pos: Vector3 (in `parent` space, feet), ry (yaw, rig forward is +Z), s (scale), cast: 'cabbie',
 *           look: true }]. Nothing is shown until every file has loaded; `onReady` is where the page hides its old
 * primitives, so a failed load leaves the gallery exactly as it was.
 */
(function () {
  var LITE = { actress: 1, bartender: 1, discoking: 1, gown: 1, hustler: 1, loretta: 1, maitre: 1, oscar: 1, tough: 1, annieh: 1,
    editor: 1, rosemary: 1, workgirl: 1, wiseguy: 1, susan: 1, cabbie: 1, killer: 1, writer: 1 };
  /* FACE (2026-10-28): five rig files face 90 degrees off +Z (rig_manifest.json, shots/rig_facing/lineup_front_noyaw.jpg).
     The yaw goes inside the figure's root, so spot.ry, the look-at and the body turn all keep +Z as the front. */
  var D = Math.PI / 180;
  var FACE = { blindwoman: -90 * D, hustler: -90 * D, lensman: 90 * D, tough: 90 * D, sally: 90 * D };
  // susan needs none: her file was re-rigged doll face forward (rig_pass.py YAW_EXTRA); the hustler's flower is bound to his head (FLOWER)

  function RigCast(o) {
    var THREE = o.THREE, spots = o.spots, parent = o.parent, cam = o.camera, base = o.base || 'assets/rig/';
    var phone = !!o.phone, cap = phone ? (o.capPhone || 8) : (o.cap || 20);
    var nearR = phone ? (o.nearPhone || 18) : (o.near || 30), lookR = o.lookDist || 7;
    var MAXH = 60 * Math.PI / 180, Y = new THREE.Vector3(0, 1, 0);
    var names = [], seen = {};
    spots.forEach(function (s, i) { s.i = i; if (!seen[s.cast]) { seen[s.cast] = 1; names.push(s.cast); } });
    var full = {}, lite = {}, far = {}, pool = {}, active = [];
    var cp = new THREE.Vector3(), lp = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Quaternion();
    var hq = new THREE.Quaternion(), hax = new THREE.Vector3();
    var CLAMP = { bartender: 25 * Math.PI / 180, susan: 25 * Math.PI / 180 };   // their bows and shaker stretch past ~25
    var M = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), E = new THREE.Euler(), S = new THREE.Vector3();
    var self = { ready: false, failed: false, spots: spots, active: active, update: update, stats: stats, mixerMs: 0, created: 0 };

    function load(url) { return new Promise(function (res) { o.loader.load(url, res, undefined, function () { res(null); }); }); }
    function skinned(root) { var m = null; root.traverse(function (c) { if (!m && c.isSkinnedMesh) m = c; }); return m; }

    self.promise = Promise.all(names.map(function (n) {
      return Promise.all([load(base + n + '.glb'), LITE[n] ? load(base + n + '_lite.glb') : Promise.resolve(null)])
        .then(function (r) { full[n] = r[0]; lite[n] = r[1] || r[0]; });
    })).then(function () {
      if (names.some(function (n) { return !full[n] || !skinned(full[n].scene); })) { self.failed = true; return self; }
      build(); self.ready = true; if (o.onReady) o.onReady(self); return self;
    });

    function spotMatrix(s, out) {
      E.set(0, s.ry + (FACE[s.cast] || 0), 0); q.setFromEuler(E); S.setScalar(s.s || 1);   // a pure yaw, uniform scale: same as inside the root
      return out.compose(s.pos, q, S);
    }

    function build() {
      names.forEach(function (n) {
        var src = skinned(lite[n].scene), list = spots.filter(function (s) { return s.cast === n; });
        var mat = src.material.clone(); if ('skinning' in mat) mat.skinning = false;   // r128 keeps the flag on the material
        var im = new THREE.InstancedMesh(src.geometry, mat, list.length);
        im.name = 'rigcast_far_' + n; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
        list.forEach(function (s, k) { s.k = k; im.setMatrixAt(k, spotMatrix(s, M)); });
        im.instanceMatrix.needsUpdate = true;
        far[n] = im; pool[n] = []; parent.add(im);
      });
    }

    function make(n) {
      var g = full[n], body = o.clone(g.scene), root = new THREE.Group();
      body.rotation.y = FACE[n] || 0; root.add(body); root.name = 'rigcast_' + n;   // the file's front turned to +Z
      body.traverse(function (c) { if (c.isMesh) { c.frustumCulled = false; c.castShadow = !!o.shadow; } });
      var mixer = new THREE.AnimationMixer(body), clip = null;
      g.animations.forEach(function (a) { if (a.name === 'idle') clip = a; });
      var action = mixer.clipAction(clip || g.animations[0]); action.play();
      var head = body.getObjectByName('head');
      var a = { n: n, root: root, mixer: mixer, action: action, dur: (clip || g.animations[0]).duration, head: head,
        headRest: head ? head.quaternion.clone() : null, hy: 0, body: 0, spot: null };
      parent.add(root); self.created++;
      return a;
    }

    function reassign() {
      var cand = [];
      for (var i = 0; i < spots.length; i++) {
        var s = spots[i], d = s.pos.distanceTo(lp);
        if (d < nearR) cand.push([d, s]);
      }
      cand.sort(function (x, y) { return x[0] - y[0]; });
      var want = {}; for (i = 0; i < cand.length && i < cap; i++) want[cand[i][1].i] = cand[i][1];
      var dirty = {};
      for (i = active.length - 1; i >= 0; i--) {
        var a = active[i];
        if (!want[a.spot.i]) {
          a.root.visible = false; far[a.n].setMatrixAt(a.spot.k, spotMatrix(a.spot, M)); dirty[a.n] = 1;
          a.spot.a = null; a.spot = null; pool[a.n].push(a); active.splice(i, 1);
        }
      }
      for (var key in want) {
        var sp = want[key]; if (sp.a) continue;
        var b = pool[sp.cast].pop() || make(sp.cast);
        b.spot = sp; sp.a = b; b.hy = 0; b.body = 0;
        b.root.position.copy(sp.pos); b.root.rotation.set(0, sp.ry, 0); b.root.scale.setScalar(sp.s || 1); b.root.visible = true;
        b.action.time = Math.random() * b.dur;
        far[sp.cast].setMatrixAt(sp.k, ZERO); dirty[sp.cast] = 1;
        active.push(b);
      }
      for (var n in dirty) far[n].instanceMatrix.needsUpdate = true;
    }

    var acc = 1;
    function update(dt) {
      if (!self.ready) return;
      var t0 = performance.now();
      cam.getWorldPosition(cp); lp.copy(cp); parent.worldToLocal(lp);
      acc += dt; if (acc > 0.25) { acc = 0; reassign(); }
      var k = Math.min(1, dt * 4), kb = Math.min(1, dt * 1.6), kr = Math.min(1, dt * 0.8);
      for (var i = 0; i < active.length; i++) {
        var a = active[i];
        if (a.head) a.head.quaternion.copy(a.headRest);          // the clip may not key the head; never accumulate
        a.mixer.update(dt);
        if (!a.head) continue;
        a.root.updateMatrixWorld();
        v.copy(cp); a.root.worldToLocal(v);
        var near = a.spot.look !== false && Math.hypot(v.x, v.z) * (a.spot.s || 1) < lookR;
        var ang = Math.atan2(v.x, v.z), hw = 0, cl = CLAMP[a.n] || MAXH;
        if (near) {
          hw = Math.max(-cl, Math.min(cl, ang));
          if (Math.abs(ang) > cl) a.body += (ang - hw) * kb;            // the body follows only past the clamp
        } else a.body += (0 - a.body) * kr;
        a.root.rotation.y = a.spot.ry + a.body;
        a.hy += (hw - a.hy) * k;
        if (Math.abs(a.hy) > 1e-3) {
          // The head bone's rest pose is tilted, so its own Y is not up: turning about it spins the flower edge on
          // (HEAD_TURN_FIX.md). Turn about world up, expressed in the head's frame.
          a.root.updateMatrixWorld(true);
          a.head.getWorldQuaternion(hq).invert();
          hax.copy(Y).applyQuaternion(hq).normalize();
          a.head.quaternion.multiply(q.setFromAxisAngle(hax, a.hy));
        }
      }
      var ms = performance.now() - t0; self.mixerMs = self.mixerMs * 0.95 + ms * 0.05;
    }

    function stats() {
      var nearTris = 0, farTris = 0;
      active.forEach(function (a) { var m = skinned(a.root); nearTris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; });
      names.forEach(function (n) { var g = far[n].geometry; farTris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (far[n].count - (active.filter(function (a) { return a.n === n; }).length)); });
      return { spots: spots.length, kinds: names.length, active: active.length, created: self.created, cap: cap,
        nearTris: Math.round(nearTris), farTris: Math.round(farTris), mixerMs: +self.mixerMs.toFixed(3) };
    }
    return self;
  }
  RigCast.LITE = LITE; RigCast.FACE = FACE;
  window.RigCast = RigCast;
})();
