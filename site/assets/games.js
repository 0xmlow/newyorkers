/* THE SPIRAL · the marble games. Every marble in them is one of Bryan Brinkman's, the GLB his Marble Run races.
   RINGER on the void floor, THE DROP from the glass, GUTTER DASH down the whole gutter, SKEE in the paddock.
   window.SpiralGames(S) is called by the gallery once the world is built; S is the gallery's own handle. */
(function(){
"use strict";
window.SpiralGames = function(S){
  var THREE = S.THREE, scene = S.scene, camera = S.camera, TAU = Math.PI * 2;
  var $ = function(id){ return document.getElementById(id); };
  var esc = S.esc;
  function store(k, v){ try { if (v === undefined) return localStorage.getItem("spiral." + k); localStorage.setItem("spiral." + k, v); } catch (e) { return null; } }
  function rnd(a, b){ return a + Math.random() * (b - a); }

  /* ---------- ui ---------- */
  var css = document.createElement("style");
  css.textContent = [
    "#gm .card{padding:22px 24px;max-width:760px}",
    "#gm h2{font:400 44px/1 'Instrument Serif',serif;margin:4px 0 8px}#gm h2 em{color:#f2668b}",
    "#gm .k{font:700 12px 'Archivo Narrow';letter-spacing:.22em;color:#f2bf27;text-transform:uppercase}",
    "#gm p{font-size:13px;opacity:.88;line-height:1.55}",
    "#gm .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:center}",
    "#gm .me{display:flex;gap:10px;align-items:center;font-size:12px;margin-top:10px}#gm .me img{width:48px;height:48px;border-radius:50%;background:#222}",
    "#gm table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}#gm td{padding:4px 6px;border-bottom:1px solid #26262e}",
    "#gm input{font:600 13px 'IBM Plex Mono';background:#0c0c10;color:#eee;border:1px solid #333;padding:8px;width:170px}",
    "#gm .big{font:700 64px/1 'Archivo Narrow';letter-spacing:.04em;color:#f2bf27}",
    "#gmPick .card{max-width:1100px;padding:18px}#gmPick .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:12px}",
    "#gmPick button{all:unset;cursor:pointer;text-align:center;font:600 10px 'IBM Plex Mono';padding:6px;border:1px solid #26262e;border-radius:4px}",
    "#gmPick button:hover,#gmPick button.on{border-color:#f2bf27;background:#18181e}#gmPick img{width:64px;height:64px;border-radius:50%;display:block;margin:0 auto 4px;background:#1a1a20}",
    "#gmHud{left:50%;top:14px;transform:translateX(-50%);display:none;text-align:center;font:700 14px 'Archivo Narrow';letter-spacing:.14em;text-shadow:0 2px 10px #000}",
    "#gmHud b{display:block;font-size:40px;letter-spacing:.04em;color:#f2bf27}#gmHud small{display:block;font:600 11px 'IBM Plex Mono';letter-spacing:.06em;opacity:.9;margin-top:4px}",
    "#gmHud .bar{width:220px;height:8px;background:#222;margin:8px auto 0;border-radius:4px;overflow:hidden}#gmHud .bar i{display:block;height:100%;background:#f2668b;width:0}",
    "#gmQuit{right:14px;top:12px;display:none;pointer-events:auto}",
    "body.gaming #bar,body.gaming #help,body.gaming #zone,body.gaming #cross,body.gaming #prompt{display:none!important}body.gaming #gmHud,body.gaming #gmQuit{display:block}",
    "#gmGo{left:50%;top:40%;transform:translate(-50%,-50%);font:700 120px/1 'Archivo Narrow';color:#fff;text-shadow:0 4px 30px #000;display:none}"
  ].join("");
  document.head.appendChild(css);
  var wrap = document.createElement("div");
  wrap.innerHTML = '<div class="panel" id="gm"><div class="card"><button class="x" id="gmX">CLOSE</button><div id="gmBody"></div></div></div>' +
    '<div class="panel" id="gmPick"><div class="card"><button class="x" id="gmPX">CLOSE</button><div class="k">Pick your marble</div><div style="font-size:12px;opacity:.8;margin-top:4px">All one hundred are Bryan Brinkman\'s, the same models his Marble Run races. Yours plays every game.</div><div class="grid" id="gmGrid"></div></div></div>' +
    '<div class="hud" id="gmHud"></div><div class="hud" id="gmGo"></div><button class="b hud" id="gmQuit" style="--c:#f2668b">Quit · ESC</button>';
  document.body.appendChild(wrap);
  $("gmX").onclick = function(){ $("gm").classList.remove("on"); };
  $("gmPX").onclick = function(){ $("gmPick").classList.remove("on"); };
  $("gmQuit").onclick = function(e){ e.stopPropagation(); quit(); };
  function hud(html){ $("gmHud").innerHTML = html; }
  var goT = 0; function go(txt, ms){ var g = $("gmGo"); g.textContent = txt; g.style.display = "block"; clearTimeout(goT); goT = setTimeout(function(){ g.style.display = "none"; }, ms || 700); }

  /* ---------- your marble ---------- */
  function marbles(){ return S.D().marbles; }
  function nameOf(id){ var m = marbles()[id]; return m ? m.n : "Marble " + id; }
  function thumb(id){ return "https://marblerun.fun/marbles/thumb/" + id + ".webp"; }
  function myId(){ var v = +store("marble"); if (v >= 1 && v <= 100) return v; var c = S.recentChamps(1)[0] || 44; store("marble", c); return c; }
  function pick(cb){
    var g = $("gmGrid"); g.innerHTML = ""; var me = myId();
    for (var i = 1; i <= 100; i++) (function(id){
      var b = document.createElement("button"); if (id === me) b.className = "on";
      b.innerHTML = '<img loading="lazy" alt="" src="' + thumb(id) + '">' + esc(nameOf(id).toUpperCase()) + '<br><span style="opacity:.6">#' + id + "</span>";
      b.onclick = function(){ store("marble", id); $("gmPick").classList.remove("on"); S.toast("<b>" + esc(nameOf(id)).toUpperCase() + "</b> is your marble."); if (cb) cb(id); };
      g.appendChild(b);
    })(i);
    $("gmPick").classList.add("on"); if (document.pointerLockElement) document.exitPointerLock();
  }
  function marbleOf(id, rad, lane){ var g = S.marbleMesh(lane || "CREAM", rad); S.dress(g, id, rad); scene.add(g); return g; }
  function drop(m){ if (!m) return; S.undress(m); scene.remove(m); }
  function roll(m, dx, dz, rad){ var d = Math.hypot(dx, dz); if (d < 1e-5) return; var ax = new THREE.Vector3(dz / d, 0, -dx / d); m.rotateOnWorldAxis(ax, d / rad); }

  /* ---------- boards: the site's arcade board when we are on n3wyorkers.com, a personal best everywhere ---------- */
  function best(id, v){ var b = +store("best." + id) || 0; if (v != null && v > b) { store("best." + id, v); return v; } return b; }
  function board(id, el){
    if (!S.ON_SITE) { el.innerHTML = "<tr><td>The daily board lives on n3wyorkers.com/spiral.</td></tr>"; return; }
    fetch("/api/score?game=" + id).then(function(r){ return r.json(); }).then(function(j){
      el.innerHTML = (j.top && j.top.length ? j.top : []).map(function(x, i){ return "<tr><td>" + (i + 1) + "</td><td>" + esc(x.name) + "</td><td style='text-align:right'>" + x.score.toLocaleString() + "</td></tr>"; }).join("") || "<tr><td>Nobody yet today. Be first.</td></tr>";
    }).catch(function(){ el.innerHTML = "<tr><td>The board is resting.</td></tr>"; });
  }
  function submit(id, score, name, out){
    if (!S.ON_SITE) return;
    fetch("/api/score", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({game: id, score: score, name: name})})
      .then(function(r){ return r.json(); }).then(function(j){ out.textContent = j.ok ? "On the board. Number " + j.rank + " today." : (j.error || "Not taken."); if (j.ok) board(id, $("gmTop")); })
      .catch(function(){ out.textContent = "Could not reach the board."; });
  }

  /* ---------- the four games ---------- */
  var GAMES = {}, CUR = null, CURID = null;

  // RINGER: the oldest marble game there is. Knock the champions out of the chalk ring with your shooter.
  GAMES.ringer = {
    title: 'RIN<em>GER</em>', kick: "The void floor · seven shots",
    rules: "Nine champions' marbles sit in a cross in the chalk ring. Drag back from anywhere and let go to shoot, like a slingshot: the further you pull, the harder it goes, and side to side aims. Or A and D to walk round the ring, hold SPACE and let go. Every marble you knock out of the ring is 100, more than one in a shot is a bonus, and shots you have left at the end are 50 each.",
    make: function(done){
      var C = new THREE.Vector3(5.3, 0, 1.4), RR = 1.6, me = myId(), objs = [];
      var ring = new THREE.Mesh(new THREE.RingGeometry(RR - .03, RR + .03, 96), new THREE.MeshBasicMaterial({color: 0xf0efea})); ring.rotation.x = -Math.PI / 2; ring.position.set(C.x, .012, C.z); scene.add(ring); objs.push(ring);
      var ids = S.recentChamps(12).filter(function(x){ return x !== me; }).slice(0, 9); while (ids.length < 9) { var r0 = 1 + Math.floor(Math.random() * 100); if (r0 !== me && ids.indexOf(r0) < 0) ids.push(r0); }
      var spots = [[0, 0], [.27, 0], [-.27, 0], [.54, 0], [-.54, 0], [0, .27], [0, -.27], [0, .54], [0, -.54]], T = [];
      ids.forEach(function(id, i){ var m = marbleOf(id, .1); m.position.set(C.x + spots[i][0], .1, C.z + spots[i][1]); T.push({m: m, id: id, vx: 0, vz: 0, r: .1, mass: 1, out: false}); });
      var phi = Math.PI / 2, sh = {m: marbleOf(me, .13), vx: 0, vz: 0, r: .13, mass: 1.7};
      var aim = new THREE.Mesh(new THREE.PlaneGeometry(.04, 1), new THREE.MeshBasicMaterial({color: 0xf2bf27, transparent: true, opacity: .85, side: THREE.DoubleSide})); aim.rotation.x = -Math.PI / 2; scene.add(aim); objs.push(aim);
      var st = "aim", shots = 7, score = 0, pull = null, charge = 0, charging = false, ang = 0, power = 0, outThisShot = 0, camP = new THREE.Vector3();
      function place(){ sh.m.position.set(C.x + Math.cos(phi) * (RR + .18), .13, C.z + Math.sin(phi) * (RR + .18)); }
      place();
      function show(){ hud("RINGER<b>" + score + "</b><small>" + shots + " SHOTS LEFT · " + T.filter(function(t){ return !t.out; }).length + " IN THE RING · " + esc(nameOf(me).toUpperCase()) + "</small>" + (st === "aim" ? '<div class="bar"><i style="width:' + Math.round(power * 100) + '%"></i></div>' : "")); }
      function shoot(){
        if (power < .05) return; var fx = C.x - sh.m.position.x, fz = C.z - sh.m.position.z, l = Math.hypot(fx, fz); fx /= l; fz /= l;
        var ca = Math.cos(ang), sa = Math.sin(ang), dx = fx * ca - fz * sa, dz = fx * sa + fz * ca, v = 1.2 + power * 6.2;
        sh.vx = dx * v; sh.vz = dz * v; st = "roll"; outThisShot = 0; aim.visible = false; S.beep(300, .08);
      }
      function settle(){
        shots--; if (outThisShot > 1) { score += 50 * (outThisShot - 1); go("+" + (50 * (outThisShot - 1)) + " COMBO", 900); }
        var left = T.filter(function(t){ return !t.out; }).length;
        if (!left || !shots) { score += shots * 50; return done(score, left ? (9 - left) + " of 9 out of the ring." : "You cleared the ring with " + shots + " shots to spare."); }
        phi = Math.atan2(sh.m.position.z - C.z, sh.m.position.x - C.x); sh.vx = sh.vz = 0; place(); st = "aim"; aim.visible = true; power = 0; ang = 0;
      }
      return {
        enter: function(){ S.toast("Drag back and let go. Knock them out of the ring.", 4000); show(); },
        exit: function(){ T.forEach(function(t){ drop(t.m); }); drop(sh.m); objs.forEach(function(o){ scene.remove(o); }); },
        key: function(e, down){
          if (st !== "aim") return;
          if (e.code === "Space") { if (down) { charging = true; } else if (charging) { charging = false; shoot(); } }
        },
        pointer: function(type, e){
          if (st !== "aim") return;
          if (type === "down") pull = {x: e.clientX, y: e.clientY};
          else if (type === "move" && pull) { var dy = e.clientY - pull.y, dx = e.clientX - pull.x; power = Math.max(0, Math.min(1, dy / 260)); ang = Math.max(-.6, Math.min(.6, -dx / 420)); }
          else if (type === "up" && pull) { pull = null; shoot(); }
        },
        step: function(dt){
          var k = S.keys;
          if (st === "aim") {
            if (k.KeyA) phi += dt * .9; if (k.KeyD) phi -= dt * .9; if (k.ArrowLeft) ang = Math.min(.6, ang + dt * .5); if (k.ArrowRight) ang = Math.max(-.6, ang - dt * .5);
            if (charging) { charge += dt * 1.6; power = .5 - .5 * Math.cos(charge * Math.PI); }
            if (k.KeyA || k.KeyD) place();
            var fx = C.x - sh.m.position.x, fz = C.z - sh.m.position.z, l = Math.hypot(fx, fz), ca = Math.cos(ang), sa = Math.sin(ang), dx = (fx * ca - fz * sa) / l, dz = (fx * sa + fz * ca) / l, len = .3 + power * 1.6;
            aim.scale.y = len; aim.position.set(sh.m.position.x + dx * len / 2, .02, sh.m.position.z + dz * len / 2); aim.rotation.z = -Math.atan2(dx, -dz);
            var out = new THREE.Vector3(sh.m.position.x - C.x, 0, sh.m.position.z - C.z).normalize();
            camP.set(C.x + out.x * (RR + 2.3), 1.55, C.z + out.z * (RR + 2.3));
          } else {
            var sub = 4, h = dt / sub, all = [sh].concat(T.filter(function(t){ return !t.out; }));
            for (var s = 0; s < sub; s++) {
              all.forEach(function(b){ var sp = Math.hypot(b.vx, b.vz); if (sp > 0) { var ns = Math.max(0, sp - 1.15 * h); b.vx *= ns / sp; b.vz *= ns / sp; } var ox = b.m.position.x, oz = b.m.position.z; b.m.position.x += b.vx * h; b.m.position.z += b.vz * h; roll(b.m, b.m.position.x - ox, b.m.position.z - oz, b.r); });
              for (var i = 0; i < all.length; i++) for (var j = i + 1; j < all.length; j++) {
                var a = all[i], b = all[j], dx2 = b.m.position.x - a.m.position.x, dz2 = b.m.position.z - a.m.position.z, d = Math.hypot(dx2, dz2), mn = a.r + b.r;
                if (d > 0 && d < mn) { var nx = dx2 / d, nz = dz2 / d, rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
                  var ov = (mn - d) / 2; a.m.position.x -= nx * ov; a.m.position.z -= nz * ov; b.m.position.x += nx * ov; b.m.position.z += nz * ov;
                  if (rel > 0) { var jj = 2 * rel / (a.mass + b.mass) * .96; a.vx -= jj * b.mass * nx; a.vz -= jj * b.mass * nz; b.vx += jj * a.mass * nx; b.vz += jj * a.mass * nz; S.beep(900 + Math.random() * 300, .05, .04); } }
              }
            }
            T.forEach(function(t){ if (!t.out && Math.hypot(t.m.position.x - C.x, t.m.position.z - C.z) > RR) { t.out = true; outThisShot++; score += 100; go("+100", 600); S.beep(1320, .15); t.vx *= .3; t.vz *= .3; } });
            T.forEach(function(t){ if (t.out) { t.m.position.y = Math.max(-1, t.m.position.y - dt * .3); } });
            if (all.every(function(b){ return Math.hypot(b.vx, b.vz) < .03; })) settle();
            camP.set(C.x, 4.4, C.z + 3.2);
          }
          camera.position.lerp(camP, Math.min(1, dt * 4)); camera.lookAt(C.x, 0, C.z);
          S.P.x = C.x; S.P.z = C.z; S.P.y = 0; show();
        }
      };
    }
  };

  // THE DROP: off the glass at the top, 176 metres down the void, through the hoops, onto the eye.
  GAMES.drop = {
    title: 'THE <em>DROP</em>', kick: "The glass at the top · one dive",
    rules: "You step off the glass with your marble. WASD or the stick steers, SPACE dives faster. Every hoop you thread is 100, and threading them back to back multiplies it. Gold caps are 25. Do not touch the parapets or the hanging cards. Thread the jumbotron for 300, and land on the eye at the bottom for 500.",
    make: function(done){
      var me = myId(), m = marbleOf(me, .3), pos = new THREE.Vector3(0, S.Y_TOP() - 1.5, 0), v = new THREE.Vector3(), objs = [], hoops = [], coins = [], score = 0, combo = 1, t = 0, landed = false, bonkT = 0, jumbo = false, lastY = pos.y;
      var lanes = S.LANES;
      for (var y = S.Y_TOP() - 9, k = 0; y > 12; y -= 6.5, k++) {
        var a = rnd(0, TAU), r = rnd(0, 4.2), L = lanes[k % 5];
        var h = new THREE.Mesh(new THREE.TorusGeometry(.95, .07, 10, 40), new THREE.MeshBasicMaterial({color: S.LANE[L].c})); h.rotation.x = Math.PI / 2; h.position.set(Math.cos(a) * r, y, Math.sin(a) * r); scene.add(h); objs.push(h); hoops.push({m: h, y: y, done: false});
        if (k % 2) { var c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .05, 20), new THREE.MeshStandardMaterial({color: 0xf2bf27, metalness: 1, roughness: .25, emissive: 0x553300})); c.position.set(Math.cos(a + 2) * rnd(1, 4.5), y - 3.2, Math.sin(a + 2) * rnd(1, 4.5)); scene.add(c); objs.push(c); coins.push({m: c, got: false}); }
      }
      m.position.copy(pos);
      function show(){ hud("THE DROP<b>" + score + "</b><small>x" + combo + " · " + Math.max(0, Math.round(pos.y)) + " M · " + Math.round(-v.y * 3.6) + " KM/H · " + esc(nameOf(me).toUpperCase()) + "</small>"); }
      function bonk(msg, pen){ if (bonkT > 0) return; bonkT = .6; score = Math.max(0, score - pen); combo = 1; go(msg, 600); S.beep(140, .2, .08); }
      return {
        enter: function(){ go("3", 600); setTimeout(function(){ go("2", 600); }, 600); setTimeout(function(){ go("1", 600); }, 1200); setTimeout(function(){ go("JUMP", 700); t = 0; }, 1800); t = -1.8; show(); },
        exit: function(){ drop(m); objs.forEach(function(o){ scene.remove(o); }); },
        step: function(dt){
          var k = S.keys, j = S.joy();
          t += dt; bonkT -= dt;
          if (t > 0 && !landed) {
            var ax = ((k.KeyD || k.ArrowRight) ? 1 : 0) - ((k.KeyA || k.ArrowLeft) ? 1 : 0) + j.x, az = ((k.KeyS || k.ArrowDown) ? 1 : 0) - ((k.KeyW || k.ArrowUp) ? 1 : 0) + j.y;
            v.x += ax * 15 * dt; v.z += az * 15 * dt; v.x *= Math.pow(.45, dt); v.z *= Math.pow(.45, dt);
            var term = (k.Space || k.ShiftLeft) ? -27 : -13; v.y = Math.max(term, v.y - 14 * dt); if (v.y < term) v.y = term;
            lastY = pos.y; pos.addScaledVector(v, dt);
            var rr = Math.hypot(pos.x, pos.z);
            if (rr > S.RI - .65) { var nx = pos.x / rr, nz = pos.z / rr; pos.x = nx * (S.RI - .66); pos.z = nz * (S.RI - .66); var dn = v.x * nx + v.z * nz; v.x -= 1.8 * dn * nx; v.z -= 1.8 * dn * nz; bonk("BONK · -50", 50); }
            hoops.forEach(function(h){ if (!h.done && lastY >= h.y && pos.y < h.y) { h.done = true; var d = Math.hypot(pos.x - h.m.position.x, pos.z - h.m.position.z);
              if (d < .9) { score += 100 * combo; go("+" + 100 * combo, 600); combo = Math.min(8, combo + 1); S.beep(660 + combo * 90, .12); h.m.material.color.setHex(0xffffff); } else { combo = 1; h.m.material.opacity = .3; h.m.material.transparent = true; } } });
            coins.forEach(function(c){ if (!c.got && c.m.position.distanceTo(pos) < .65) { c.got = true; c.m.visible = false; score += 25; S.beep(1500, .08); } });
            S.cardMeshes.forEach(function(cm){ var w = cm.getWorldPosition(new THREE.Vector3()); if (w.distanceTo(pos) < .75) bonk("CARD · -25", 25); });
            if (!jumbo && lastY >= 9.8 && pos.y < 9.8) { if (rr < 3.9) { jumbo = true; score += 300; go("THREADED THE JUMBO +300", 1200); S.beep(990, .3); } }
            if (pos.y > 7.3 && pos.y < 9.9 && rr > 3.85 && rr < 4.55) { pos.x *= 3.8 / rr; pos.z *= 3.8 / rr; bonk("JUMBOTRON · -50", 50); }
            if (pos.y <= .3) { pos.y = .3; landed = true; var c0 = Math.hypot(pos.x, pos.z);
              var bonus = c0 < 1.2 ? 500 : c0 < 3.6 ? 150 : 0; score += bonus; go(bonus === 500 ? "ON THE EYE +500" : bonus ? "ON THE RINGS +150" : "LANDED", 1300); S.beep(bonus ? 1200 : 400, .4);
              setTimeout(function(){ done(score, (bonus === 500 ? "Right on the eye. " : "") + hoops.filter(function(h){ return h.m.material.color.getHex() === 0xffffff; }).length + " of " + hoops.length + " hoops threaded."); }, 1300); }
            m.position.copy(pos); m.rotation.x += v.z * dt * 3; m.rotation.z -= v.x * dt * 3; m.rotation.y += dt * 2;
          }
          camera.position.set(pos.x * .85, pos.y + 3.6, pos.z * .85 + 2.4); camera.lookAt(pos.x, pos.y - 5, pos.z - .6);
          S.P.x = pos.x; S.P.z = pos.z; S.P.y = pos.y; show();
        }
      };
    }
  };

  // GUTTER DASH: your marble against four of Bryan's, the whole gutter, top to the cups.
  GAMES.dash = {
    title: 'GUTTER <em>DASH</em>', kick: "The gutter · the whole tower",
    rules: "Five marbles, the full gutter from the glass to the cups, through every run. Hold W (or touch) to tuck and go faster, but the heat bar fills and a cooked marble wobbles. Hit SPACE as you roll over a boost pad for a burst. Finish first for the big bonus. The rivals are the marbles from Bryan's last race.",
    make: function(done){
      var me = myId(), L = S.LANES, objs = [], pads = [], racers = [], t = -3, heat = 0, wob = 0, boost = 0, fin = [], ended = false, msgT = 0;
      var len = S.gutterLength();
      var riv = (S.lastRoster() || []).map(function(x){ return x.id; }).filter(function(id){ return id !== me; });
      S.recentChamps(10).forEach(function(id){ if (riv.length < 4 && id !== me && riv.indexOf(id) < 0) riv.push(id); });
      [me].concat(riv.slice(0, 4)).forEach(function(id, i){ var m = marbleOf(id, .22, L[i]); racers.push({id: id, m: m, p: 0, v: 0, me: i === 0, ph: rnd(0, 6), base: 36 + rnd(-2, 2), t: 0}); });
      var padM = new THREE.MeshBasicMaterial({color: 0x48d9a4, transparent: true, opacity: .9, side: THREE.DoubleSide});
      for (var d = 160; d < len - 60; d += 150) { var p = d / len, at = S.gutterPoint(p), pm = new THREE.Mesh(new THREE.RingGeometry(.12, .2, 3), padM); pm.position.copy(at); pm.position.y += .05; pm.rotation.x = -Math.PI / 2; scene.add(pm); objs.push(pm); pads.push({p: p, m: pm, hit: false}); }
      var meR = racers[0], camA = new THREE.Vector3(), camB = new THREE.Vector3();
      function place(){ var o = racers.slice().sort(function(a, b){ return b.p - a.p; }); return o.indexOf(meR) + 1; }
      function show(){
        var next = pads.filter(function(pd){ return pd.p > meR.p; })[0], nd = next ? Math.round((next.p - meR.p) * len) : 0, ord = ["1ST", "2ND", "3RD", "4TH", "5TH"];
        hud("GUTTER DASH<b>" + (fin.indexOf(meR) >= 0 ? ord[fin.indexOf(meR)] : ord[place() - 1]) + "</b><small>" + Math.round(meR.v * 3.6) + " KM/H · " + Math.round((1 - meR.p) * len) + " M TO THE CUPS" + (next ? " · PAD IN " + nd + " M" : "") + " · " + esc(nameOf(me).toUpperCase()) + "</small><div class='bar'><i style='width:" + Math.round(heat * 100) + "%;background:" + (heat > .8 ? "#f2668b" : "#f2bf27") + "'></i></div>");
      }
      return {
        enter: function(){ go("3", 700); setTimeout(function(){ go("2", 700); }, 1000); setTimeout(function(){ go("1", 700); }, 2000); setTimeout(function(){ go("GO", 700); S.beep(1040, .4); }, 3000); show(); },
        exit: function(){ racers.forEach(function(r){ drop(r.m); }); objs.forEach(function(o){ scene.remove(o); }); },
        key: function(e, down){
          if (e.code !== "Space" || !down || t < 0) return;
          var next = pads.filter(function(pd){ return !pd.hit && Math.abs(pd.p - meR.p) * len < 7; })[0];
          if (next) { next.hit = true; boost = 1.4; go("BOOST", 500); S.beep(1200, .15); next.m.material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide}); }
          else { meR.v *= .85; go("EARLY", 400); }
        },
        pointer: function(type){ S.keys._touch = type === "down" ? true : type === "up" ? false : S.keys._touch; },
        step: function(dt){
          t += dt; var k = S.keys;
          racers.forEach(function(r){
            if (t < 0) return; if (r.p >= 1) return;
            var target;
            if (r.me) {
              var tuck = k.KeyW || k.ArrowUp || k._touch || S.joy().y < -.4;
              if (wob > 0) { wob -= dt; target = 22; }
              else { target = tuck ? 50 : 35; heat = Math.max(0, Math.min(1, heat + (tuck ? .32 : -.22) * dt)); if (heat >= 1) { wob = 2.2; heat = .55; go("COOKED", 900); S.beep(120, .3, .08); } }
              if (boost > 0) { boost -= dt; target += 18; }
            } else {
              var lead = r.p - meR.p; target = r.base + 5 * Math.sin(t * .25 + r.ph) + (lead < -.02 ? 6 : lead > .03 ? -4 : 0);
            }
            r.v += (target - r.v) * Math.min(1, dt * 1.6);
            r.p = Math.min(1, r.p + r.v * dt / len); r.t = t;
            if (r.p >= 1 && fin.indexOf(r) < 0) { fin.push(r); if (r.me) { S.beep(fin.length === 1 ? 1320 : 520, .5); go(fin.length === 1 ? "YOU WIN" : ["", "", "2ND", "3RD", "4TH", "5TH"][fin.length], 1500); } }
          });
          racers.forEach(function(r){ var cups = S.cups(); if (r.p >= 1) { var k2 = fin.indexOf(r); if (cups[k2]) r.m.position.copy(cups[k2]); } else S.gutterPoint(r.p, r.m.position); r.m.rotation.x -= dt * r.v / .22; });
          if (!ended && fin.indexOf(meR) >= 0) { ended = true; var pl = fin.indexOf(meR), sc = Math.max(0, Math.round(200000 - meR.t * 1000)) + [20000, 12000, 6000, 2000, 0][pl];
            setTimeout(function(){ done(sc, "Finished " + ["first", "second", "third", "fourth", "fifth"][pl] + " in " + meR.t.toFixed(2) + " s, down " + Math.round(len) + " metres of gutter."); }, 2200); }
          // chase camera on your marble
          var at = meR.m.position, ahead = S.gutterPoint(Math.min(1, meR.p + .0006), camA).sub(at); if (ahead.lengthSq() < 1e-6) ahead.set(0, -1, 0); ahead.normalize();
          var inward = new THREE.Vector3(-at.x, 0, -at.z).normalize();
          camB.copy(at).addScaledVector(ahead, -1.3).addScaledVector(inward, .6); camB.y += .55;
          camera.position.copy(camB); camera.lookAt(at.x + ahead.x * 3, at.y + ahead.y * 3 + .1, at.z + ahead.z * 3);
          S.P.x = camB.x; S.P.z = camB.z; S.P.y = camB.y - 1.65;
          if ((msgT -= dt) < 0) { msgT = .1; show(); }
        }
      };
    }
  };

  // SKEE: the paddock's lane. Roll up the lip and into the rings.
  GAMES.skee = {
    title: '<em>SKEE</em>', kick: "The paddock · nine marbles",
    rules: "Aim with the mouse or A and D, hold the mouse button or SPACE and let go when the power is right. The marble rolls up the lane, jumps the lip and lands on the board: 10, 20, 30, 40, 50 from the bottom ring to the top, and 100 in the two little cups in the top corners. Nine marbles, Bryan's, starting with yours.",
    make: function(done){
      var PAD = S.PAD, X = PAD.x, Z0 = PAD.z + 8.5, LIP = PAD.z - .8, B0 = {y: .55, z: PAD.z - 1.3}, BA = Math.atan2(1.75, 3.2), BL = 3.65, objs = [];
      var wood = new THREE.MeshStandardMaterial({color: 0x6b4a2f, roughness: .55}), neon = new THREE.MeshBasicMaterial({color: 0xf2668b});
      var lane = new THREE.Mesh(new THREE.BoxGeometry(1.5, .1, Z0 - LIP + .5), wood); lane.position.set(X, .05, (Z0 + LIP) / 2); scene.add(lane); objs.push(lane);
      [-1, 1].forEach(function(sx){ var rail = new THREE.Mesh(new THREE.BoxGeometry(.06, .25, Z0 - LIP + 4.5), neon); rail.position.set(X + sx * .78, .2, (Z0 + LIP) / 2 - 2); scene.add(rail); objs.push(rail); });
      var lip = new THREE.Mesh(new THREE.BoxGeometry(1.5, .35, .5), wood); lip.position.set(X, .17, LIP); lip.rotation.x = .5; scene.add(lip); objs.push(lip);
      var holes = [{w: .8, u: 0, r: .34, pts: 10}, {w: 1.4, u: 0, r: .27, pts: 20}, {w: 2.0, u: 0, r: .23, pts: 30}, {w: 2.6, u: 0, r: .2, pts: 40}, {w: 3.15, u: 0, r: .17, pts: 50}, {w: 3.3, u: -.55, r: .13, pts: 100}, {w: 3.3, u: .55, r: .13, pts: 100}];
      var bc = S.canvasTex(512, 1024), x = bc.x; x.fillStyle = "#14141a"; x.fillRect(0, 0, 512, 1024);
      holes.forEach(function(h, i){ var cx = 256 + h.u / .75 * 256, cy = 1024 - h.w / BL * 1024; x.strokeStyle = S.LANE[S.LANES[i % 5]].css; x.lineWidth = 14; x.beginPath(); x.arc(cx, cy, h.r / 1.5 * 512, 0, TAU); x.stroke(); x.fillStyle = "#000"; x.beginPath(); x.arc(cx, cy, h.r / 1.5 * 512 - 10, 0, TAU); x.fill(); x.fillStyle = "#f0efea"; x.font = "700 40px 'Archivo Narrow'"; x.textAlign = "center"; x.fillText(String(h.pts), cx, cy + 14); });
      bc.t.needsUpdate = true;
      var board = new THREE.Mesh(new THREE.PlaneGeometry(1.5, BL), new THREE.MeshBasicMaterial({map: bc.t})); board.position.set(X, B0.y + Math.sin(BA) * BL / 2, B0.z - Math.cos(BA) * BL / 2); board.rotation.x = -(Math.PI / 2 - BA); scene.add(board); objs.push(board);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({color: 0x0d0d0d})); back.position.set(X, B0.y + Math.sin(BA) * BL + .6, B0.z - Math.cos(BA) * BL - .02); scene.add(back); objs.push(back);
      var signC = S.canvasTex(512, 128); signC.x.fillStyle = "#f2bf27"; signC.x.fillRect(0, 0, 512, 128); signC.x.fillStyle = "#0d0d0d"; signC.x.font = "700 80px 'Archivo Narrow'"; signC.x.textAlign = "center"; signC.x.fillText('"SKEE"', 256, 96); signC.t.needsUpdate = true;
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshBasicMaterial({map: signC.t})); sign.position.set(X, back.position.y + .85, back.position.z); scene.add(sign); objs.push(sign);
      var me = myId(), queue = [me].concat(S.recentChamps(12).filter(function(i){ return i !== me; })).slice(0, 9), shot = 0, score = 0, st = "aim", aimU = 0, power = 0, charge = 0, charging = false, ball = null, vel = new THREE.Vector3(), ballR = .12, rest = 0, cam = new THREE.Vector3(X, 1.7, Z0 + 2.6), result = [];
      function nextBall(){ if (ball) { if (result.length > 9) {} } ball = marbleOf(queue[shot], ballR); ball.position.set(X + aimU, ballR + .1, Z0); st = "aim"; power = 0; charge = 0; }
      function show(){ hud("SKEE<b>" + score + "</b><small>MARBLE " + Math.min(9, shot + 1) + " OF 9 · " + esc(nameOf(queue[Math.min(8, shot)]).toUpperCase()) + "</small>" + (st === "aim" ? '<div class="bar"><i style="width:' + Math.round(power * 100) + '%"></i></div>' : "")); }
      function release(){ if (st !== "aim") return; st = "roll"; vel.set(0, 0, -(2.8 + power * 4.6)); S.beep(260, .1); }
      function scored(pts){ score += pts; result.push(pts); go(pts ? "+" + pts : "GUTTER", 700); S.beep(pts >= 100 ? 1500 : pts ? 700 + pts * 6 : 160, .2); st = "rest"; rest = 1.1;
        if (++shot >= 9) setTimeout(function(){ done(score, "Nine marbles: " + result.join(", ") + "."); }, 1200); }
      return {
        enter: function(){ nextBall(); show(); S.toast("Aim, hold, let go.", 3000); },
        exit: function(){ objs.forEach(function(o){ scene.remove(o); }); scene.remove(ball); if (ball) S.undress(ball); },
        key: function(e, down){ if (e.code === "Space") { if (down && st === "aim") charging = true; else if (!down && charging) { charging = false; release(); } } },
        pointer: function(type, e){
          if (type === "move" && st === "aim") aimU = Math.max(-.55, Math.min(.55, (e.clientX / innerWidth - .5) * 1.4));
          if (type === "down" && st === "aim") charging = true; if (type === "up" && charging) { charging = false; release(); }
        },
        step: function(dt){
          var k = S.keys;
          if (st === "aim") { if (k.KeyA) aimU = Math.max(-.55, aimU - dt * .8); if (k.KeyD) aimU = Math.min(.55, aimU + dt * .8); if (charging) { charge += dt * 1.4; power = .5 - .5 * Math.cos(charge * Math.PI); } ball.position.x = X + aimU; }
          else if (st === "roll") {
            ball.position.addScaledVector(vel, dt); vel.z *= Math.pow(.92, dt); roll(ball, 0, vel.z * dt, ballR);
            if (ball.position.z <= LIP) { st = "up"; ball.userData.w = 0; ball.userData.s = -vel.z * .82; ball.userData.u = ball.position.x - X + rnd(-.05, .05); S.beep(420, .06); }
          } else if (st === "up") {
            // up the incline, slowing under gravity, and into whichever cup it stalls over
            var ud = ball.userData; ud.w += ud.s * dt; ud.s -= 9.8 * Math.sin(BA) * dt;
            if (ud.w > BL) { ud.w = BL; ud.s = -Math.abs(ud.s) * .3; go("OFF THE BACK", 500); }
            ball.position.set(X + ud.u, B0.y + ud.w * Math.sin(BA) + ballR, B0.z - ud.w * Math.cos(BA)); roll(ball, 0, -ud.s * dt, ballR);
            if (ud.s <= 0) { var hit = null; holes.forEach(function(h){ if (!hit && Math.hypot(ud.u - h.u, ud.w - h.w) < h.r) hit = h; });
              if (hit) { scored(hit.pts); ball.visible = false; } else { st = "back"; } }
          } else if (st === "back") { var w2 = ball.userData.w - dt * 2.8; ball.userData.w = w2; ball.position.set(ball.position.x, B0.y + Math.max(0, w2) * Math.sin(BA) + ballR, B0.z - Math.max(0, w2) * Math.cos(BA)); if (w2 <= 0) scored(0); }
          else if (st === "rest") { rest -= dt; if (rest <= 0 && shot < 9) { scene.remove(ball); S.undress(ball); nextBall(); } }
          camera.position.lerp(cam, Math.min(1, dt * 3)); camera.lookAt(X, .9, PAD.z - 2.2);
          S.P.x = X; S.P.z = Z0; S.P.y = 0; show();
        }
      };
    }
  };

  /* ---------- flow: intro, play, result ---------- */
  function open(id){
    var g = GAMES[id], me = myId();
    $("gmBody").innerHTML = '<div class="k">' + g.kick + '</div><h2>' + g.title + '</h2><p>' + g.rules + '</p>' +
      '<div class="me"><img alt="" src="' + thumb(me) + '"><div>Your marble: <b>' + esc(nameOf(me).toUpperCase()) + '</b> · #' + me + '<br><span style="opacity:.7">Best here: ' + best(id).toLocaleString() + '</span></div></div>' +
      '<div class="row"><button class="b eye" id="gmPlay" style="--c:#2962ff">PLAY</button><button class="b" id="gmMarble" style="--c:#f2bf27">CHANGE MARBLE</button></div>' +
      '<div class="k" style="margin-top:16px">Today on the board</div><table id="gmTop"><tr><td>...</td></tr></table>';
    $("gm").classList.add("on"); if (document.pointerLockElement) document.exitPointerLock();
    $("gmPlay").onclick = function(){ $("gm").classList.remove("on"); start(id); };
    $("gmMarble").onclick = function(){ pick(function(){ open(id); }); };
    board(id, $("gmTop"));
  }
  function start(id){
    CURID = id; S.leaveRide();
    CUR = GAMES[id].make(function(score, line){ finish(id, score, line); });
    S.setMode(CUR);
  }
  function quit(){ if (CUR) { S.setMode(null); CUR = null; S.goZone(CURID === "skee" ? "paddock" : CURID === "ringer" ? "cups" : "cups"); hud(""); } }
  function finish(id, score, line){
    S.setMode(null); CUR = null; S.goZone(id === "skee" ? "paddock" : "cups"); hud("");
    var b0 = best(id), nb = best(id, score), name = store("name") || "";
    $("gmBody").innerHTML = '<div class="k">' + GAMES[id].kick + '</div><h2>' + GAMES[id].title + '</h2><div class="big">' + score.toLocaleString() + '</div><p>' + esc(line || "") + (score > b0 ? " <b style='color:#48d9a4'>A new best.</b>" : " Your best: " + nb.toLocaleString() + ".") + '</p>' +
      (S.ON_SITE ? '<div class="row"><input id="gmName" maxlength="16" placeholder="your name" value="' + esc(name) + '"><button class="b" id="gmSend" style="--c:#48d9a4">PUT IT ON THE BOARD</button><span id="gmSaid" style="font-size:12px"></span></div>' : "") +
      '<div class="row"><button class="b eye" id="gmAgain" style="--c:#2962ff">AGAIN</button><button class="b" id="gmMarble2" style="--c:#f2bf27">CHANGE MARBLE</button><a class="b" style="--c:#23c7d9;text-decoration:none" target="_blank" rel="noopener" href="https://x.com/intent/post?text=' + encodeURIComponent(score.toLocaleString() + " in " + GAMES[id].title.replace(/<[^>]+>/g, "") + " at THE SPIRAL, with " + nameOf(myId()) + ", one of @bryanbrinkman's Marble Run marbles. A walkable SKELLY CUP by @degens") + '&url=' + encodeURIComponent("https://n3wyorkers.com/spiral") + '">POST IT</a></div>' +
      '<div class="k" style="margin-top:16px">Today on the board</div><table id="gmTop"><tr><td>...</td></tr></table>';
    $("gm").classList.add("on");
    $("gmAgain").onclick = function(){ $("gm").classList.remove("on"); start(id); };
    $("gmMarble2").onclick = function(){ pick(function(){ open(id); }); };
    if ($("gmSend")) $("gmSend").onclick = function(){ var n = $("gmName").value.trim(); if (!/^[A-Za-z0-9._]{2,16}$/.test(n)) { $("gmSaid").textContent = "2 to 16 letters, numbers, dot or underscore."; return; } store("name", n); $("gmSend").disabled = true; submit(id, score, n, $("gmSaid")); };
    board(id, $("gmTop"));
  }
  function menu(){
    var me = myId();
    $("gmBody").innerHTML = '<div class="k">The marble games</div><h2>Play with <em>' + esc(nameOf(me)) + '</em></h2><p>Four games, all played with real Marble Run marbles, Bryan Brinkman\'s own models. Each one has a stand in the building too.</p>' +
      '<div class="me"><img alt="" src="' + thumb(me) + '"><div><b>' + esc(nameOf(me).toUpperCase()) + '</b> · #' + me + '</div><button class="b" id="gmM" style="--c:#f2bf27">CHANGE</button></div>' +
      '<div class="row">' + Object.keys(GAMES).map(function(k){ return '<button class="b" data-g="' + k + '" style="--c:#f2668b">' + GAMES[k].title.replace(/<[^>]+>/g, "") + "</button>"; }).join("") + "</div>";
    $("gm").classList.add("on"); if (document.pointerLockElement) document.exitPointerLock();
    $("gmM").onclick = function(){ pick(menu); };
    document.querySelectorAll("#gm [data-g]").forEach(function(b){ b.onclick = function(){ open(b.dataset.g); }; });
  }
  return {open: open, menu: menu, quit: quit, pick: pick, active: function(){ return !!CUR; }, games: GAMES};
};
})();
