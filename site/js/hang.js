/* MoMLOW hang: the census on the walls. One atlas tile per work for the far hang (UVs in the geometry, one shared
   material per sheet), the full painting streaming in near you; a rhythm along every wall; plaques; the curator's
   panel at each room's door; the posters as banners and the store wall; the loops on screens; THE COUNTED. */
(function (M) {
  "use strict";
  const { world, MAT, box, sign, signTex, img, world: W } = M;
  const works = M.works = [], pickables = M.pickables = [], atlasMats = M.atlasMats = [], screens = M.screens = [];
  let DATA = null, SHOWS = null, G = 12;
  const SIZE = { L: 2.7, M: 2.1, S: 1.55, XL: 3.6 };

  M.loadData = async function () {
    DATA = M.DATA = await (await fetch("assets/data.json")).json(); SHOWS = M.SHOWS = DATA.shows; G = DATA.grid; M.ERAS = DATA.eras;
    const sheets = Math.max(...Object.values(SHOWS).flatMap(s => s.works).map(w => w.a)) + 1;
    for (let k = 0; k < sheets; k++) {
      const t = M.texLoader.load(`assets/atlas/a${k}.jpg`); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(16, M.ANISO); t.minFilter = THREE.LinearMipmapLinearFilter;
      const m = new THREE.MeshBasicMaterial({ map: t }); atlasMats.push(m); M.artMats.push(m);
    }
    return DATA;
  };
  function tileUV(w) { const col = w.i % G, row = Math.floor(w.i / G); return [col / G, (col + 1) / G, 1 - (row + 1) / G, 1 - row / G]; }
  function plaqueTex(w) {
    return M.canvasTex((g, Wd, H) => {
      g.fillStyle = "#f3f1ea"; g.fillRect(0, 0, Wd, H); g.fillStyle = "#0d0d0d"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.font = "600 44px Fraunces, Georgia, serif"; let t = w.t; while (g.measureText(t).width > Wd - 48 && t.length > 4) t = t.slice(0, -2).trim() + "…"; g.fillText(t, 24, 62);
      g.font = "500 24px 'IBM Plex Mono', Menlo, monospace"; g.fillStyle = "#555"; const e = M.ERAS[w.e];
      g.fillText(`NO. ${String(w.n).padStart(4, "0")}   ERA ${e ? e.r : w.e}   ${(w.b || "").toUpperCase()}`, 24, 104);
      if (w.m) { g.fillStyle = "#b08d57"; g.beginPath(); g.arc(Wd - 36, 36, 10, 0, Math.PI * 2); g.fill(); }
    }, 640, 128);
  }
  /* one work on a wall: a frame, the art plane with the atlas tile, a plaque. */
  M.hang = function (show, idx, x, y, z, nx, nz, width, opt) {
    const s = SHOWS[show]; if (!s || idx >= s.works.length) return null;
    const w = s.works[idx]; opt = opt || {};
    const aw = width, ah = aw * 9 / 16;
    const pos = new THREE.Vector3(x, y, z), n = new THREE.Vector3(nx, 0, nz).normalize();
    const grp = new THREE.Group(); grp.position.copy(pos); grp.lookAt(pos.clone().add(n)); world.add(grp);
    const lip = opt.lip == null ? 0.07 : opt.lip;
    if (lip > 0) { const fr = new THREE.Mesh(new THREE.BoxGeometry(aw + lip * 2, ah + lip * 2, 0.06), opt.frame || MAT.frame); fr.position.z = 0.03; grp.add(fr); }
    const geo = new THREE.PlaneGeometry(aw, ah); const [u0, u1, v0, v1] = tileUV(w);
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
    const art = new THREE.Mesh(geo, atlasMats[w.a]); art.position.z = 0.065; grp.add(art);
    if (!opt.noPlaque) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.1), new THREE.MeshBasicMaterial({ map: plaqueTex(w) })); pl.position.set(0, -ah / 2 - 0.14, 0.01); grp.add(pl); }
    const rec = { w, show, art, grp, pos, n, aw, ah, full: null, fullMat: null, wanted: false, d: 99 };
    art.userData.work = rec; works.push(rec); pickables.push(art);
    return rec;
  };
  /* a run of works along one wall segment with a museum rhythm: big, medium, big; centred; nothing in the corners */
  M.hangSeg = function (show, seg, from, opt) {
    opt = opt || {}; const s = SHOWS[show]; if (!s) return from;
    const pattern = opt.pattern || (seg.len > 18 ? ["L", "M", "L", "M", "L"] : seg.len > 9 ? ["L", "M", "L"] : seg.len > 5 ? ["M", "M"] : ["M"]);
    const gap = opt.gap || 0.9, margin = opt.margin || 1.1, y = seg.y != null ? seg.y : (opt.y || 1.55);
    let widths = [];
    // fill the wall: repeat the pattern until the next piece would not fit
    for (let i = 0; ; i++) { const wdt = SIZE[pattern[i % pattern.length]] * (opt.scale || 1); const total = widths.reduce((a, b) => a + b, 0) + wdt + gap * widths.length; if (total > seg.len - margin * 2) break; widths.push(wdt); if (from + widths.length >= s.works.length) break; if (widths.length > 40) break; }
    if (!widths.length) return from;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    const dx = (seg.bx - seg.ax) / seg.len, dz = (seg.bz - seg.az) / seg.len;
    let at = (seg.len - total) / 2;
    for (const wdt of widths) {
      const cx = seg.ax + dx * (at + wdt / 2), cz = seg.az + dz * (at + wdt / 2);
      const off = seg.off != null ? seg.off : 0.2;
      const r = M.hang(show, from++, cx + seg.nx * off, y, cz + seg.nz * off, seg.nx, seg.nz, wdt, opt);
      if (r) r.room = opt.roomKey; at += wdt + gap;
    }
    return from;
  };
  /* a whole room: the show's works around its walls, the longest wall first so the strongest pieces lead; the curator's panel by the door */
  M.hangRoom = function (roomKey, show, opt) {
    const r = M.ROOMS[roomKey], s = SHOWS[show]; if (!r || !s) return 0; opt = opt || {};
    r.showKey = show; r.showName = s.name;
    const segs = r.walls.slice().sort((a, b) => b.len - a.len);
    let from = 0;
    for (const seg of segs) { if (from >= s.works.length) break; from = M.hangSeg(show, Object.assign({ y: r.y + 1.55 }, seg), from, Object.assign({ roomKey }, opt)); }
    // the name of the show on the wall at the door, and the curator's note under it
    const door = segs.find(sg => sg.side === "e" || sg.side === "w") || segs[0];
    if (door && !opt.noPanel) {
      const e = DATA.eras; const words = s.why;
      const tex = M.wallText([[s.name, "h"], [`Floor ${r.y > 1 ? M.FLOORS.indexOf(r.y) + 1 : 1} · ${s.works.length} works`, "k"], [words, "p"], ["The curator's note", "k"]], { w: 1200, h: 560, hs: 72 });
      const px = r.cx, pz = r.cz;
      // on the wall just inside the door: find the segment nearest the room's first door
      const seg = door; const t = 0.5; const cx = seg.ax + (seg.bx - seg.ax) * t, cz = seg.az + (seg.bz - seg.az) * t;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.12), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(cx + seg.nx * 0.2, r.y + 3.55, cz + seg.nz * 0.2); m.lookAt(cx + seg.nx, r.y + 3.55, cz + seg.nz); world.add(m);
    }
    return from;
  };

  /* THE COUNTED: everyone collected, in order, 48 across on the garden's north wall; one mesh per atlas sheet */
  M.buildCounted = function () {
    const list = SHOWS.counted.works, cols = 48, pitchX = 58 / cols, tw = pitchX * 0.92, th = tw * 9 / 16, pitchY = th * 1.1;
    const rows = Math.ceil(list.length / cols), y0 = 1.8 + (rows - 1) * pitchY;
    const groups = new Map();
    list.forEach((w, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      // the viewer faces +z here, so their left is +x: column 0 starts at x 39 and the tile's u0 edge sits on its +x side
      const cx = 39 - pitchX * (col + 0.5), cy = y0 - row * pitchY, [u0, u1, v0, v1] = tileUV(w), h2 = th / 2, w2 = tw / 2;
      const g = groups.get(w.a) || { pos: [], uv: [], idx: [] }; groups.set(w.a, g);
      for (const q of [[w2, h2, u0, v1], [w2, -h2, u0, v0], [-w2, -h2, u1, v0], [w2, h2, u0, v1], [-w2, -h2, u1, v0], [-w2, h2, u1, v1]]) { g.pos.push(cx + q[0], cy + q[1], 65.68); g.uv.push(q[2], q[3]); }
      g.idx.push(i);
    });
    for (const [a, g] of groups) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.uv, 2)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, atlasMats[a]); m.userData.tiles = g.idx; world.add(m); pickables.push(m);
    }
    const top = y0 + th / 2 + 1.0;
    sign(10, top + 0.1, 65.66, 12, 1.3, signTex("THE COUNTED", { w: 1800, h: 200, bg: "#111317", fg: "#f0efea", size: 120, sub: `${list.length} NEW YORKERS COLLECTED SO FAR, IN THE ORDER THEY WERE`, subfg: "#ecc981" }), 0);
    for (const x of [-12, -2, 8, 18, 28, 38]) { box(x, 13.6, 65.2, 0.3, 0.12, 0.8, MAT.charcoal, false, false); M.point(x, 12.8, 63.5, 1.1, 24, 0xfff0d8); }
    M.counted = list;
  };

  /* the posters: banners from the lobby ceiling and on the facade, the store wall, the hero at the entrance */
  M.buildPosters = function () {
    const B = DATA.posters.banners, S = DATA.posters.store, mat = (f) => new THREE.MeshStandardMaterial({ map: img("assets/posters/" + f), roughness: 0.8, envMapIntensity: 0.15 });
    const banner = (x, y, z, h, i, rotY) => {
      const w = h * 2 / 3, front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(B[i % B.length].f)), back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(B[(i + 1) % B.length].f));
      front.position.set(x, y, z); front.rotation.y = rotY; back.position.set(x, y, z); back.rotation.y = rotY + Math.PI; world.add(front); world.add(back);
      const bar = box(x, y + h / 2 + 0.06, z, rotY % Math.PI ? 0.06 : w + 0.2, 0.06, rotY % Math.PI ? w + 0.2 : 0.06, MAT.steel, false, false);
      front.userData.poster = B[i % B.length]; back.userData.poster = B[(i + 1) % B.length]; pickables.push(front, back);
      return front;
    };
    // six pairs from the lobby ceiling, facing the entrance
    let i = 0; for (const z of [13, 21, 29]) for (const x of [-7.5, 7.5]) { banner(x, 3.4, z, 3.6, i, Math.PI); i += 2; }
    // two big ones on the facade stone, and one in the Garden Lobby facing the garden
    for (const [x, rot] of [[-32, Math.PI], [32, Math.PI]]) { const h = 9; const m = new THREE.Mesh(new THREE.PlaneGeometry(h * 2 / 3, h), mat(B[i % B.length].f)); m.position.set(x, 16, -0.55); m.rotation.y = rot; world.add(m); m.userData.poster = B[i % B.length]; pickables.push(m); i++; }
    // the hero poster on the lobby's west wall by the entrance
    if (DATA.posters.hero) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.8), mat(DATA.posters.hero)); m.position.set(-13.78, 2.9, 3.3); m.rotation.y = Math.PI / 2; world.add(m); box(-13.9, 2.9, 3.3, 0.06, 4.96, 3.36, MAT.frame, false); }
    // the store: a wall of street posters, three rows, on the west wall; a rack on the north wall
    const r = M.ROOMS.store; let k = 0;
    for (let row = 0; row < 3; row++) for (let c = 0; c < 13; c++) { if (k >= S.length) break; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), mat(S[k])); m.position.set(-39.78, 4.6 - row * 1.65, 2.2 + c * 1.55); m.rotation.y = Math.PI / 2; world.add(m); m.userData.poster = { f: S[k], t: "Street poster " + (k + 1) }; pickables.push(m); k++; }
    for (let c = 0; c < 7; c++) { if (k >= S.length) break; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), mat(S[k])); m.position.set(-38.4 + c * 1.6, 1.9, 21.75); m.rotation.y = Math.PI; world.add(m); m.userData.poster = { f: S[k], t: "Street poster " + (k + 1) }; pickables.push(m); k++; }
    // tables of prints: stacks of small posters flat on the tables
    for (const [x, z] of [[-27, 7], [-27, 14], [-21, 11]]) { box(x, 0.45, z, 2.4, 0.9, 1.2, MAT.frameOak, true); for (let j = 0; j < 4; j++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), mat(S[(k + j) % S.length])); m.position.set(x - 0.75 + j * 0.5, 0.905 + j * 0.002, z); m.rotation.x = -Math.PI / 2; m.rotation.z = j * 0.08; world.add(m); } k += 4; }
    // stickers on the counter glass: the eye flower and the nazar
    for (const [f, x] of [["flower", -16.4], ["nazar", -17.4]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: img("assets/" + f + ".png"), transparent: true })); m.position.set(x, 1.3, 3.0); world.add(m); }
  };

  /* the loops: screens in the sixth floor north room, playing when you are near */
  M.buildScreens = function (roomKey) {
    const r = M.ROOMS[roomKey]; if (!r) return;
    r.showKey = "media"; r.showName = "The Moving Pictures";
    const L = DATA.loops; let i = 0;
    const segs = r.walls.slice().sort((a, b) => b.len - a.len);
    for (const seg of segs) {
      const n = Math.min(Math.floor((seg.len - 2) / 3.2), L.length - i); if (n <= 0) continue;
      const total = n * 2.6 + (n - 1) * 0.6, dx = (seg.bx - seg.ax) / seg.len, dz = (seg.bz - seg.az) / seg.len; let at = (seg.len - total) / 2;
      for (let j = 0; j < n; j++, i++) {
        const l = L[i], cx = seg.ax + dx * (at + 1.3), cz = seg.az + dz * (at + 1.3);
        const v = document.createElement("video"); v.src = "assets/loops/" + l.f; v.loop = true; v.muted = true; v.playsInline = true; v.preload = "none"; v.crossOrigin = "anonymous";
        const t = new THREE.VideoTexture(v); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter;
        const grp = new THREE.Group(); grp.position.set(cx + seg.nx * 0.2, r.y + 1.75, cz + seg.nz * 0.2); grp.lookAt(cx + seg.nx, r.y + 1.75, cz + seg.nz); world.add(grp);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(2.72, 1.6, 0.08), MAT.blackSteel); fr.position.z = 0.04; grp.add(fr);
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4625), new THREE.MeshBasicMaterial({ map: t, color: 0x111111 })); scr.position.z = 0.085; grp.add(scr);
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.1), new THREE.MeshBasicMaterial({ map: plaqueTex({ n: l.n, t: l.t, e: 0, b: l.k === "glitch" ? "GLITCH EDITION" : "MOTION LOOP" }) })); pl.position.set(0, -0.86, 0.02); grp.add(pl);
        scr.userData.loop = l; pickables.push(scr);
        screens.push({ v, t, scr, pos: grp.position.clone(), on: false, loop: l });
        at += 3.2;
      }
    }
    sign(r.cx, r.y + 4.2, r.z1 - 0.22, 4.4, 0.5, signTex("THE MOVING PICTURES", { w: 1300, h: 150 }), Math.PI);
  };
  M.tickScreens = function (P) {
    let playing = 0; const max = M.lo() ? 3 : 8;
    for (const s of screens) {
      const d = Math.hypot(s.pos.x - P.x, s.pos.z - P.z, (s.pos.y - P.y) * 0.6);
      const want = d < 20 && playing < max;
      if (want) playing++;
      if (want && !s.on) { s.on = true; s.v.play().then(() => { s.scr.material.color.setScalar(1); }).catch(() => {}); }
      else if (!want && s.on) { s.on = false; s.v.pause(); }
    }
  };

  /* the full size paintings for the works near you */
  const fullLoader = new THREE.TextureLoader(); fullLoader.crossOrigin = "anonymous";
  M.loadedFull = 0;
  M.stream = function (P) {
    const near = [], NEAR = M.lo() ? 11 : 16, FAR = NEAR + 7, budget = M.lo() ? 12 : 40;
    for (const r of works) { const d = Math.hypot(r.pos.x - P.x, r.pos.z - P.z, (r.pos.y - P.y) * 0.7); r.d = d; if (d < NEAR) near.push(r); else if (d > FAR && r.full) { r.art.material = atlasMats[r.w.a]; r.full.dispose(); r.fullMat.dispose(); r.full = r.fullMat = null; r.wanted = false; M.loadedFull--; } }
    near.sort((a, b) => a.d - b.d);
    let n = 0;
    for (const r of near) { if (n++ >= budget) break; if (r.full || r.wanted) continue; r.wanted = true;
      fullLoader.load(M.ART + r.w.f, t => { if (!r.wanted) { t.dispose(); return; } t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(16, M.ANISO); t.minFilter = THREE.LinearMipmapLinearFilter; r.full = t; r.fullMat = new THREE.MeshBasicMaterial({ map: t }); r.fullMat.color.setScalar(M.cur.art); r.art.material = r.fullMat; M.loadedFull++; }, undefined, () => { r.wanted = false; }); }
    for (const r of works) if (r.fullMat) r.fullMat.color.setScalar(M.cur.art);
  };
})(window.M);
