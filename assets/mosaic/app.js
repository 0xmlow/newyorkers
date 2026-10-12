/* THE MOSAIC viewer. Shared by mosaic.html on the site and the single file NFT.
   window.MOSAIC (data.js) carries the grid, which image sits in each cell, which piece each image belongs to,
   the piece facts and a minted snapshot. MOSAIC_BASE is "" on the site and https://n3wyorkers.com/ in the NFT,
   where MOSAIC_TEX also carries the picture inline. The live layer (api/mosaic.json, api/daily.json) and the full
   size paintings are fetched from the site when it answers; when it does not, the snapshot stands. */
(function () {
  "use strict";
  var M = window.MOSAIC, BASE = window.MOSAIC_BASE || "", NFT = !!window.MOSAIC_NFT, TEX = window.MOSAIC_TEX || null;
  var GC = M.grid[0], GR = M.grid[1], TW = M.grid[2], TH = M.grid[3], W = GC * TW, H = GR * TH;
  var root = document.getElementById("mz"), cv = document.getElementById("mzc");
  var $ = function (id) { return document.getElementById(id); };
  var live = M.live, liveOn = false;

  /* piece -> the cells it appears in */
  var cellsOf = {};
  M.C.forEach(function (k, c) { var p = M.KP[k]; (cellsOf[p] = cellsOf[p] || []).push(c); });
  var byNum = {};
  M.P.forEach(function (p, i) { byNum[p[0]] = i; });

  /* ---------------- renderer ---------------- */
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0d);
  var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  var vw = 1, vh = 1, minZ = 0.1, maxZ = 10, dirty = true;
  var view = { cx: W / 2, cy: H / 2, z: 0.1 };
  var aniso = renderer.capabilities.getMaxAnisotropy();
  var loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  function quarter(a, b) {
    var url = TEX ? TEX["m" + a + b] : BASE + "assets/mosaic/m" + a + b + ".jpg?v=" + (M.v || "");
    var tex = loader.load(url, function () { dirty = true; });
    tex.anisotropy = aniso;
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(W / 2, H / 2), new THREE.MeshBasicMaterial({ map: tex }));
    mesh.position.set((b + 0.5) * W / 2, -(a + 0.5) * H / 2, 0);
    scene.add(mesh);
    return tex;
  }
  var quarters = [[quarter(0, 0), quarter(0, 1)], [quarter(1, 0), quarter(1, 1)]];

  /* minted layer: every cell not minted is dimmed */
  var mask = document.createElement("canvas"); mask.width = GC; mask.height = GR;
  var maskTex = new THREE.CanvasTexture(mask);
  maskTex.magFilter = THREE.NearestFilter; maskTex.minFilter = THREE.NearestFilter; maskTex.generateMipmaps = false;
  var maskMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: maskTex, transparent: true, depthTest: false }));
  maskMesh.position.set(W / 2, -H / 2, 0.2); maskMesh.visible = false; maskMesh.renderOrder = 2;
  scene.add(maskMesh);
  function isMinted(pi) { return !!(live && live.minted && live.minted[String(M.P[pi][0])]); }
  function drawMask() {
    var g = mask.getContext("2d"), n = 0;
    g.clearRect(0, 0, GC, GR);
    for (var c = 0; c < M.C.length; c++) {
      if (isMinted(M.KP[M.C[c]])) { n++; continue; }
      g.fillStyle = "rgba(13,13,13,0.82)"; g.fillRect(c % GC, Math.floor(c / GC), 1, 1);
    }
    maskTex.needsUpdate = true; dirty = true;
    return n;
  }

  /* outlines for hover and selection */
  function box(color, w) {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0], 3));
    var l = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: color, depthTest: false, transparent: true }));
    l.renderOrder = 5; l.visible = false; scene.add(l); return l;
  }
  var hoverBox = box(0x00e5ff), selBox = box(0xd7ff1f);
  function placeBox(l, c) {
    if (c == null) { l.visible = false; return; }
    var col = c % GC, row = Math.floor(c / GC);
    l.position.set(col * TW, -row * TH, 0.5); l.scale.set(TW, TH, 1); l.visible = true; dirty = true;
  }

  /* ---------------- deep zoom: the real painting over its tile ---------------- */
  var texCache = new Map(), overlays = new Map(), failed = new Set();
  function thumbUrl(k) { return BASE + "assets/t/" + M.K[k] + ".jpg"; }
  function overlayTex(k) {
    if (texCache.has(k)) { var t = texCache.get(k); texCache.delete(k); texCache.set(k, t); return t; }
    if (failed.has(k)) return null;
    var tex = loader.load(thumbUrl(k), function () { dirty = true; }, undefined, function () { failed.add(k); });
    tex.anisotropy = aniso;
    texCache.set(k, tex);
    if (texCache.size > 160) { var old = texCache.keys().next().value; var ot = texCache.get(old); texCache.delete(old); ot.dispose(); }
    return tex;
  }
  var ovGeo = new THREE.PlaneGeometry(TW, TH);
  function updateOverlays() {
    var px = view.z * TW, want = new Set();
    if (px > 110) {
      var x0 = Math.max(0, Math.floor((view.cx - vw / 2 / view.z) / TW)), x1 = Math.min(GC - 1, Math.floor((view.cx + vw / 2 / view.z) / TW));
      var y0 = Math.max(0, Math.floor((view.cy - vh / 2 / view.z) / TH)), y1 = Math.min(GR - 1, Math.floor((view.cy + vh / 2 / view.z) / TH));
      if ((x1 - x0 + 1) * (y1 - y0 + 1) <= 90) for (var r = y0; r <= y1; r++) for (var q = x0; q <= x1; q++) want.add(r * GC + q);
    }
    overlays.forEach(function (m, c) { if (!want.has(c)) { scene.remove(m); m.material.dispose(); overlays.delete(c); dirty = true; } });
    var fade = Math.min(1, (px - 110) / 90);
    want.forEach(function (c) {
      var m = overlays.get(c);
      if (!m) {
        var t = overlayTex(M.C[c]); if (!t) return;
        m = new THREE.Mesh(ovGeo, new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 }));
        m.position.set((c % GC + 0.5) * TW, -(Math.floor(c / GC) + 0.5) * TH, 0.1);
        scene.add(m); overlays.set(c, m);
      }
      var ready = m.material.map && m.material.map.image && m.material.map.image.complete !== false && m.material.map.image.width;
      var o = ready ? fade : 0;
      if (Math.abs(m.material.opacity - o) > 0.01) { m.material.opacity = o; dirty = true; }
    });
  }

  /* ---------------- view ---------------- */
  function resize() {
    var r = root.getBoundingClientRect();
    vw = Math.max(1, r.width); vh = Math.max(1, r.height);
    renderer.setSize(vw, vh, false);
    minZ = Math.min(vw / W, vh / H) * 0.94;
    maxZ = Math.min(vw, vh) * 0.75 / TW;
    view.z = clamp(view.z, minZ, maxZ); dirty = true;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clampView() {
    view.z = clamp(view.z, minZ, maxZ);
    var hw = vw / 2 / view.z, hh = vh / 2 / view.z;
    view.cx = hw * 2 >= W ? W / 2 : clamp(view.cx, hw, W - hw);
    view.cy = hh * 2 >= H ? H / 2 : clamp(view.cy, hh, H - hh);
  }
  function apply() {
    clampView();
    cam.left = view.cx - vw / 2 / view.z; cam.right = view.cx + vw / 2 / view.z;
    cam.top = -(view.cy - vh / 2 / view.z); cam.bottom = -(view.cy + vh / 2 / view.z);
    cam.updateProjectionMatrix();
  }
  function toWorld(sx, sy) { return [view.cx + (sx - vw / 2) / view.z, view.cy + (sy - vh / 2) / view.z]; }
  function cellAt(sx, sy) {
    var w = toWorld(sx, sy), q = Math.floor(w[0] / TW), r = Math.floor(w[1] / TH);
    return q < 0 || r < 0 || q >= GC || r >= GR ? null : r * GC + q;
  }
  function zoomAt(sx, sy, f) {
    var w = toWorld(sx, sy);
    view.z = clamp(view.z * f, minZ, maxZ);
    view.cx = w[0] - (sx - vw / 2) / view.z; view.cy = w[1] - (sy - vh / 2) / view.z;
    fly = null; dirty = true;
  }

  var fly = null;
  function flyTo(cx, cy, z, ms) {
    fly = { a: { cx: view.cx, cy: view.cy, z: view.z }, b: { cx: cx, cy: cy, z: clamp(z, minZ, maxZ) }, t0: performance.now(), ms: ms || 1100 };
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function stepFly(now) {
    if (!fly) return;
    var t = clamp((now - fly.t0) / fly.ms, 0, 1), e = ease(t);
    var lz = Math.log(fly.a.z) + (Math.log(fly.b.z) - Math.log(fly.a.z)) * e;
    view.z = Math.exp(lz);
    view.cx = fly.a.cx + (fly.b.cx - fly.a.cx) * e; view.cy = fly.a.cy + (fly.b.cy - fly.a.cy) * e;
    dirty = true;
    if (t >= 1) fly = null;
  }
  function flyToCell(c, zoomTiles) {
    var z = Math.min(vw, vh) / (TW * (zoomTiles || 3.2));
    var cx = (c % GC + 0.5) * TW, cy = (Math.floor(c / GC) + 0.5) * TH;
    if (!$("mzCard").hidden && vw > 760) cx += Math.min(400, vw * 0.4) / 2 / clamp(z, minZ, maxZ);   // keep the tile clear of the card
    flyTo(cx, cy, z, 1200);
  }
  function fit() { flyTo(W / 2, H / 2, minZ, 1100); }

  function frame(now) {
    stepFly(now);
    if (dirty) { apply(); updateOverlays(); renderer.render(scene, cam); dirty = false; }
    requestAnimationFrame(frame);
  }

  /* ---------------- input ---------------- */
  var pts = new Map(), down = null, pinch = null, hint = $("mzHint");
  if (window.matchMedia && matchMedia("(pointer:coarse)").matches) hint.textContent = "Pinch to zoom. Drag to move. Tap any tile.";
  function local(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function touched() { if (hint) { hint.classList.add("gone"); hint = null; } }
  cv.addEventListener("pointerdown", function (e) {
    cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, local(e)); fly = null; touched();
    if (pts.size === 1) down = { p: local(e), t: performance.now(), moved: 0 };
    if (pts.size === 2) { var a = Array.from(pts.values()); pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) }; down = null; }
  });
  cv.addEventListener("pointermove", function (e) {
    var p = local(e);
    if (!pts.has(e.pointerId)) { hover(p, e.pointerType); return; }
    var prev = pts.get(e.pointerId); pts.set(e.pointerId, p);
    if (pts.size === 1) {
      view.cx -= (p[0] - prev[0]) / view.z; view.cy -= (p[1] - prev[1]) / view.z; dirty = true;
      if (down) down.moved += Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]);
      if (down && down.moved > 6) cv.classList.add("drag");
      $("mzTip").hidden = true;
    } else if (pts.size === 2 && pinch) {
      var a = Array.from(pts.values()), d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
      zoomAt((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2, d / pinch.d); pinch.d = d;
    }
  });
  function up(e) {
    pts.delete(e.pointerId); cv.classList.remove("drag");
    if (pts.size < 2) pinch = null;
    if (down && pts.size === 0 && down.moved < 7 && performance.now() - down.t < 600) {
      var c = cellAt(down.p[0], down.p[1]); if (c != null) select(c, false);
    }
    if (pts.size === 0) down = null;
  }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("pointerleave", function () { placeBox(hoverBox, null); $("mzTip").hidden = true; });
  cv.addEventListener("wheel", function (e) {
    e.preventDefault(); touched();
    var p = local(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(p[0], p[1], Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)));
  }, { passive: false });

  var hovered = null;
  function hover(p, type) {
    if (type !== "mouse") return;
    var c = cellAt(p[0], p[1]);
    if (c === hovered) { moveTip(p); return; }
    hovered = c; placeBox(hoverBox, c);
    var tip = $("mzTip");
    if (c == null) { tip.hidden = true; return; }
    var pc = M.P[M.KP[M.C[c]]];
    tip.innerHTML = '<span class="n">NO. ' + pc[0] + "</span>" + esc(pc[1]);
    tip.hidden = false; moveTip(p);
  }
  function moveTip(p) { var t = $("mzTip"); t.style.left = p[0] + "px"; t.style.top = p[1] + "px"; }

  cv.addEventListener("keydown", function (e) {
    var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GC, ArrowDown: GC }[e.key];
    if (d != null) {
      e.preventDefault();
      var c = selected == null ? M.hero : selected + d;
      if (c >= 0 && c < GC * GR && !(Math.abs(d) === 1 && Math.floor(c / GC) !== Math.floor((selected == null ? c : selected) / GC))) select(c, true);
    } else if (e.key === "Escape") closeCard();
    else if (e.key === "+" || e.key === "=") zoomAt(vw / 2, vh / 2, 1.4);
    else if (e.key === "-") zoomAt(vw / 2, vh / 2, 1 / 1.4);
  });
  window.addEventListener("resize", function () { resize(); });

  /* ---------------- the card ---------------- */
  var selected = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function select(c, flyThere) {
    selected = c; placeBox(selBox, c);
    var k = M.C[c], pi = M.KP[k], p = M.P[pi], cells = cellsOf[pi], idx = cells.indexOf(c);
    var holders = live && live.minted ? live.minted[String(p[0])] : null;
    var tgt = NFT ? ' target="_blank" rel="noopener"' : "";
    var h = '<div class="img"><button class="x" aria-label="Close">×</button><img alt="" src="' + thumbUrl(k) + '"></div><div class="in">' +
      '<div class="k"><b>NO. ' + p[0] + "</b> · ERA " + esc(p[3]) + (p[2] ? " · " + esc(p[2]).toUpperCase() : "") + "</div>" +
      "<h3>" + esc(p[1]) + "</h3>" + (p[4] ? '<div class="pl">' + esc(p[4]) + "</div>" : "") +
      (p[5] ? "<p>" + esc(p[5]) + "</p>" : "") +
      '<div class="row"><span>This tile shows</span><b>' + esc(M.KS[k]) + "</b></div>" +
      '<div class="row"><span>Painted states</span><b>' + p[6] + (p[7] ? " + glitch edition" : "") + "</b></div>" +
      '<div class="row"><span>In the mosaic</span><b>' + cells.length + (cells.length === 1 ? " tile" : " tiles") + (cells.length > 1 ? ", this is " + (idx + 1) : "") + "</b></div>";
    if (holders && holders.length) {
      var t = holders[0];
      var who = t[2] ? '<a href="https://x.com/' + esc(t[2]) + '" target="_blank" rel="noopener">' + esc(t[1]) + "</a>" : esc(t[1]);
      h += '<div class="mint on"><span class="t">MINTED · THE CENSUS RELEASE</span>Token #' + t[0] + ", held by " + who +
        (holders.length > 1 ? " and " + (holders.length - 1) + " more" : "") + "</div>";
    } else {
      h += '<div class="mint">Not minted.</div>';
    }
    h += '<div class="acts"><a class="pri" href="' + BASE + "n/" + p[0] + '"' + tgt + ">OPEN THE RECORD</a>" +
      (holders && holders.length ? '<a href="https://opensea.io/assets/ethereum/' + live.contract + "/" + holders[0][0] + '" target="_blank" rel="noopener">OPENSEA</a>' : "") +
      (cells.length > 1 ? '<button data-next>NEXT TILE</button>' : "") + "</div></div>";
    var card = $("mzCard"); card.innerHTML = h; card.hidden = false; card.scrollTop = 0;
    card.querySelector(".x").onclick = closeCard;
    var img = card.querySelector("img");
    img.onerror = function () { img.replaceWith(cropTile(c)); };
    var nx = card.querySelector("[data-next]");
    if (nx) nx.onclick = function () { select(cells[(idx + 1) % cells.length], true); };
    if (flyThere) flyToCell(c);
  }
  function closeCard() { $("mzCard").hidden = true; selected = null; placeBox(selBox, null); }
  /* offline fallback for the card picture: the tile itself, cut out of the mosaic */
  function cropTile(c) {
    var a = Math.floor(c / GC) >= GR / 2 ? 1 : 0, b = c % GC >= GC / 2 ? 1 : 0, im = quarters[a][b].image;
    var cnv = document.createElement("canvas"); cnv.width = TW * 4; cnv.height = TH * 4;
    if (im) {
      var g = cnv.getContext("2d"); g.imageSmoothingQuality = "high";
      g.drawImage(im, (c % GC - b * GC / 2) * TW, (Math.floor(c / GC) - a * GR / 2) * TH, TW, TH, 0, 0, cnv.width, cnv.height);
    }
    return cnv;
  }

  /* ---------------- search ---------------- */
  var titles = M.P.map(function (p) { return p[1].toLowerCase(); });
  var q = $("mzq"), res = $("mzRes");
  q.addEventListener("input", function () {
    var s = q.value.trim().toLowerCase(); if (!s) { res.hidden = true; return; }
    var hits = [];
    if (/^\d+$/.test(s) && byNum[+s] != null) hits.push(byNum[+s]);
    for (var i = 0; i < titles.length && hits.length < 10; i++) if (titles[i].indexOf(s) >= 0 && hits.indexOf(i) < 0) hits.push(i);
    res.innerHTML = hits.length ? hits.map(function (i) {
      var p = M.P[i], k = M.C[cellsOf[i][0]];
      return '<button data-p="' + i + '"><img alt="" loading="lazy" src="' + thumbUrl(k) + '"><span class="n">' + p[0] + "</span><span>" + esc(p[1]) + "</span></button>";
    }).join("") : '<div class="none">Not in the mosaic. ' + (/^\d+$/.test(s) ? "That number has its own record on the site." : "Try another name.") + "</div>";
    res.hidden = false;
  });
  res.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-p]"); if (!b) return;
    res.hidden = true; q.blur(); touched(); select(cellsOf[+b.dataset.p][0], true);
  });
  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { var b = res.querySelector("button[data-p]"); if (b) b.click(); }
    if (e.key === "Escape") { res.hidden = true; q.blur(); }
  });
  document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".mz-find")) res.hidden = true; });

  /* ---------------- buttons ---------------- */
  $("mzFit").onclick = function () { touched(); closeCard(); fit(); };
  $("mzRand").onclick = function () { touched(); select(Math.floor(Math.random() * GC * GR), true); };
  var mintBtn = $("mzMint");
  mintBtn.onclick = function () {
    touched(); maskMesh.visible = !maskMesh.visible; mintBtn.setAttribute("aria-pressed", maskMesh.visible); dirty = true;
  };

  function stats() {
    var n = drawMask();
    var when = live && live.asOf ? live.asOf : M.built;
    $("mzStats").innerHTML = "<b>" + fmt(GC * GR) + "</b> TILES · <b>" + fmt(M.P.length) + "</b> NEW YORKERS · <b>" + fmt(n) + "</b> TILES MINTED<br>" +
      (liveOn ? '<span class="live">● LIVE</span> FROM THE CHAIN, ' : "SNAPSHOT, ") + esc(when).toUpperCase();
  }

  /* ---------------- the live layer ---------------- */
  function getJSON(u) { return fetch(BASE + u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); }
  getJSON("api/mosaic.json").then(function (d) { if (d && d.minted) { live = d; liveOn = true; stats(); if (selected != null) select(selected, false); } }).catch(function () {});
  getJSON("api/daily.json").then(function (d) {
    var t = new Date(), iso = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    var day = (d.days || []).filter(function (x) { return x.d === iso; })[0];
    if (!day || byNum[day.n] == null) return;
    var b = $("mzToday"); b.hidden = false; b.title = "Today's New Yorker: " + day.t;
    b.onclick = function () { touched(); select(cellsOf[byNum[day.n]][0], true); };
  }).catch(function () {});

  /* the site's mint bar is fixed to the bottom of the window: stand clear of it, and take the room back when it is closed */
  var barH = -1;
  function fitBar() {
    if (NFT) return;
    var b = document.getElementById("ny-mintbar"), h = 0;
    if (b && getComputedStyle(b).display !== "none" && b.getBoundingClientRect().top < window.innerHeight) h = Math.round(b.getBoundingClientRect().height);
    if (h !== barH) { barH = h; root.style.height = "calc(100svh - " + (root.getBoundingClientRect().top + window.scrollY + h) + "px)"; resize(); }
  }
  setInterval(fitBar, 700);

  /* ---------------- start: inside one painting, then the whole picture ---------------- */
  fitBar(); resize(); stats();
  var hc = M.hero;
  view.z = maxZ * 0.9; view.cx = (hc % GC + 0.5) * TW; view.cy = (Math.floor(hc / GC) + 0.5) * TH;
  requestAnimationFrame(frame);
  setTimeout(function () { if (!pts.size && !fly && selected == null) flyTo(W / 2, H / 2, minZ, 4200); }, 900);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
})();
