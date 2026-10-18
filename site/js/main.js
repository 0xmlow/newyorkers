/* MoMLOW main: the hang plan, the player, input, the HUD, the card, the curator's panel, settings, sound, the audit, the loop. */
(async function (M) {
  "use strict";
  const { $, clamp, rnd, FLOORS: F } = M;
  await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  window.__stage = "data"; const DATA = await M.loadData(); const SHOWS = M.SHOWS; window.__stage = "hang";
  M.setPreset(M.presetName, true);

  /* ---------- the hang plan: which show in which room ---------- */
  const plan = {
    2: { west: "f2_west", east: "f2_east", north: "f2_north" }, 3: { west: "f3_west", east: "f3_east", north: "f3_north" },
    4: { west: "f4_west", east: "f4_east", north: "f4_north" }, 5: { west: "f5_west", east: "f5_east", north: "f5_north" },
    6: { rooms: { W1_6: "theme_night", W2_6: "theme_transit", W3_6: "theme_food", E1_6: "theme_watchers", E2_6: "theme_hustle", E3_6: "theme_faces" } }
  };
  // a wing's three rooms share one show: the works run room to room in the curator's order
  function hangWing(keys, show) { let from = 0; for (const k of keys) { const r = M.ROOMS[k], s = SHOWS[show]; r.showKey = show; r.showName = s.name; const segs = r.walls.slice().sort((a, b) => b.len - a.len); for (const seg of segs) { if (from >= s.works.length) break; from = M.hangSeg(show, Object.assign({ y: r.y + 1.55 }, seg), from, { roomKey: k }); } } return from; }
  function panel(roomKey, show) { const r = M.ROOMS[roomKey], s = SHOWS[show]; const seg = r.walls.find(sg => sg.side === "s") || r.walls[0]; if (!seg) return; const cx = seg.ax + (seg.bx - seg.ax) * 0.12, cz = seg.az + (seg.bz - seg.az) * 0.12; const tex = M.wallText([[s.name, "h"], [`${s.works.length} works`, "k"], [s.why, "p"], ["The curator's note", "k"]], { w: 1200, h: 560, hs: 72 }); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.03), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(cx + seg.nx * 0.2, r.y + 3.7, cz + seg.nz * 0.2); m.lookAt(cx + seg.nx, r.y + 3.7, cz + seg.nz); M.world.add(m); }
  for (const f of [2, 3, 4, 5]) {
    const p = plan[f]; hangWing([`W1_${f}`, `W2_${f}`, `W3_${f}`], p.west); hangWing([`E1_${f}`, `E2_${f}`, `E3_${f}`], p.east); M.hangRoom(`N_${f}`, p.north, { noPanel: true });
    panel(`W1_${f}`, p.west); panel(`E1_${f}`, p.east); panel(`N_${f}`, p.north);
  }
  for (const k in plan[6].rooms) { M.hangRoom(k, plan[6].rooms[k], { noPanel: true }); panel(k, plan[6].rooms[k]); }
  M.buildScreens("N_6");
  // the lobby: the guard by the desk, the four anchors on the west wall past the hero poster, the boroughs on the atrium's walls
  M.hang("guard", 0, 13.78, 1.55, 1.4, -1, 0, 1.2);
  M.hangSeg("lobby", { ax: -14, az: 10, bx: -14, bz: 22, nx: 1, nz: 0, len: 12, y: 1.9 }, 0, { pattern: ["L", "L", "L", "L"], gap: 0.5, margin: 0.6 });
  M.hangSeg("boro_manhattan", { ax: 14, az: 10, bx: 14, bz: 22, nx: -1, nz: 0, len: 12, y: 1.55 }, 0, { pattern: ["M", "S", "M", "S"], gap: 0.5, margin: 0.6 });
  M.hangSeg("boro_brooklyn", { ax: 14, az: 22, bx: 14, bz: 34, nx: -1, nz: 0, len: 12, y: 1.55 }, 0, { pattern: ["M", "S", "M", "S"], gap: 0.5, margin: 0.6 });
  M.hangSeg("boro_queens", { ax: -14, az: 10, bx: -14, bz: 15, nx: 1, nz: 0, len: 5, y: F[1] + 1.55 }, 0, { pattern: ["M", "M"], gap: 0.5, margin: 0.5 });
  M.hangSeg("boro_queens", { ax: -14, az: 18.2, bx: -14, bz: 30, nx: 1, nz: 0, len: 11.8, y: F[1] + 1.55 }, 2, { pattern: ["M", "M", "M", "M"], gap: 0.6, margin: 0.5 });
  M.hangSeg("boro_bronx", { ax: 14, az: 10, bx: 14, bz: 15, nx: -1, nz: 0, len: 5, y: F[1] + 1.55 }, 0, { pattern: ["M", "M"], gap: 0.5, margin: 0.5 });
  M.hangSeg("boro_bronx", { ax: 14, az: 18.2, bx: 14, bz: 28, nx: -1, nz: 0, len: 9.8, y: F[1] + 1.55 }, 2, { pattern: ["M", "M", "M"], gap: 0.6, margin: 0.5 });
  M.hangSeg("boro_staten", { ax: -14, az: 33, bx: -2, bz: 33, nx: 0, nz: -1, len: 12, y: F[1] + 1.55 }, 0, { pattern: ["M", "M", "M", "M"], gap: 0.5, margin: 0.7 });
  for (const [x, rot, t] of [[-13.75, Math.PI / 2, "QUEENS"], [13.75, -Math.PI / 2, "THE BRONX"]]) M.sign(x, F[1] + 3.3, 24, 2.6, 0.4, M.signTex(t, { w: 900, h: 130 }), rot);
  M.sign(-8, F[1] + 3.3, 32.98, 3.2, 0.4, M.signTex("STATEN ISLAND", { w: 900, h: 130 }), Math.PI);
  M.sign(13.75, 3.3, 16, 2.6, 0.4, M.signTex("MANHATTAN", { w: 900, h: 130 }), -Math.PI / 2); M.sign(13.75, 3.3, 28, 2.6, 0.4, M.signTex("BROOKLYN", { w: 900, h: 130 }), -Math.PI / 2);
  // the families, up the escalators: the well's west wall on every floor
  { let from = M.hangSeg("f6_families", { ax: -28, az: 23, bx: -28, bz: 39, nx: 1, nz: 0, len: 16, y: 1.55 }, 0, { pattern: ["M", "S", "M", "S", "M"], gap: 0.6 });
    for (let k = 1; k < F.length; k++) { from = M.hangSeg("f6_families", { ax: -28, az: 24.4, bx: -28, bz: 30, nx: 1, nz: 0, len: 5.6, y: F[k] + 1.55 }, from, { pattern: ["M", "M"], gap: 0.5, margin: 0.6 }); from = M.hangSeg("f6_families", { ax: -28, az: 33.2, bx: -28, bz: 39.6, nx: 1, nz: 0, len: 6.4, y: F[k] + 1.55 }, from, { pattern: ["M", "M"], gap: 0.5, margin: 0.6 }); }
    M.sign(-27.75, 4.9, 31, 3.0, 0.4, M.signTex("THE FAMILIES", { w: 1000, h: 115 }), Math.PI / 2); }
  window.__stage = "counted"; M.buildCounted(); M.buildAnamorph(SHOWS.lobby.works[0]); window.__stage = "posters"; M.buildPosters(); window.__stage = "people"; M.buildPeople(); window.__stage = "ui";
  const hung = M.works.length;
  $("tickText").innerHTML = `<b>${hung + M.counted.length}</b> New Yorkers in the building &nbsp;·&nbsp; <b>${M.counted.length}</b> on THE COUNTED &nbsp;·&nbsp; six floors after MoMA, the atrium, the bridge, the garden &nbsp;·&nbsp; the curator learned from <b>${DATA.taste.positives}</b> of MLow's own picks and refused <b>${DATA.taste.refused}</b> soft ones &nbsp;·&nbsp; the census is <b>${DATA.counts.census.toLocaleString()}</b> deep &nbsp;·&nbsp; admission is free, it always was &nbsp;·&nbsp; the sun keeps New York time &nbsp;·&nbsp; n3wyorkers.com`;

  /* ---------- the player ---------- */
  const EYE = 1.65, RADIUS = 0.36;
  const P = M.P = { x: 0, y: EYE, z: -8, yaw: Math.PI, pitch: 0.02 };
  const keys = {}; let locked = false, running = false, riding = null;
  const feet = () => P.y - EYE;
  function groundY(px, pz) {
    let g = -50; const f = feet();
    for (const p of M.plates) if (px > p.minX && px < p.maxX && pz > p.minZ && pz < p.maxZ && p.y <= f + 0.7) g = Math.max(g, p.y);
    for (const r of M.ramps) if (px > r.minX && px < r.maxX && pz > r.minZ && pz < r.maxZ) { const a = r.axis === "x" ? px : pz; const t = clamp((a - r.a0) / (r.a1 - r.a0), 0, 1); const y = r.y0 + (r.y1 - r.y0) * t; if (y <= f + 0.7) g = Math.max(g, y); }
    if (g < -40) g = 0;
    return g;
  }
  function collide(p) {
    const fy = feet();
    for (const b of M.solids) {
      if (fy + 1.55 < b.yBase || fy + 0.25 > b.yTop) continue;
      const minX = b.minX - RADIUS, maxX = b.maxX + RADIUS, minZ = b.minZ - RADIUS, maxZ = b.maxZ + RADIUS;
      if (p.x > minX && p.x < maxX && p.z > minZ && p.z < maxZ) { const dl = p.x - minX, dr = maxX - p.x, db = p.z - minZ, df = maxZ - p.z, m = Math.min(dl, dr, db, df); if (m === dl) p.x = minX; else if (m === dr) p.x = maxX; else if (m === db) p.z = minZ; else p.z = maxZ; }
    }
    for (const k of M.keepOuts) {
      if (fy < k.yMin || fy > k.yMax) continue;
      if (p.x > k.minX - RADIUS && p.x < k.maxX + RADIUS && p.z > k.minZ - RADIUS && p.z < k.maxZ + RADIUS) { const dl = p.x - (k.minX - RADIUS), dr = (k.maxX + RADIUS) - p.x, db = p.z - (k.minZ - RADIUS), df = (k.maxZ + RADIUS) - p.z, m = Math.min(dl, dr, db, df); if (m === dl) p.x = k.minX - RADIUS; else if (m === dr) p.x = k.maxX + RADIUS; else if (m === db) p.z = k.minZ - RADIUS; else p.z = k.maxZ + RADIUS; }
    }
    p.x = clamp(p.x, -118, 118); p.z = clamp(p.z, -25.5, 91.5);
  }
  M.go = function (i) { const z = M.ZONES[i]; if (!z) return; riding = null; P.x = z.x; P.z = z.z; P.y = z.y + EYE; P.yaw = z.yaw; P.pitch = 0; toast(`<b>${z.name}</b> · ${z.sub}`); };
  // the lift: stand in the cab and press a floor; the cab and you ride together through the glass
  M.inLift = () => P.x > M.LIFT.x0 + 0.2 && P.x < M.LIFT.x1 - 0.2 && P.z > M.LIFT.z0 + 0.2 && P.z < M.LIFT.z1 - 0.2;
  M.liftY = 0;
  M.ride = function (floor) { const y1 = F[floor - 1]; if (y1 == null) return; riding = { y0: feet(), y1, t: 0, dur: 1.2 + Math.abs(y1 - feet()) * 0.18 }; toast(`Riding to <b>floor ${floor}</b>.`); sfx("click"); };

  /* ---------- input ---------- */
  let toastT = null; function toast(html, ms) { const el = $("toast"); el.innerHTML = html; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), ms || 2600); } M.toast = toast;
  addEventListener("keydown", e => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
    keys[e.code] = true;
    if (/^Digit[1-9]$/.test(e.code)) { const n = +e.code[5]; if (M.inLift() && n <= 6) M.ride(n); else M.go(n - 1); }
    if (e.code === "Digit0") M.go(9);
    if (e.code === "KeyE") interact(); if (e.code === "KeyT") cycleTime(); if (e.code === "KeyM") toggleSound(); if (e.code === "KeyC") openCurator(); if (e.code === "KeyQ") $("settings").classList.toggle("on");
    if (e.code === "Escape") closePanels(); typed(e.key);
  });
  addEventListener("keyup", e => { keys[e.code] = false; });
  const canvas = M.canvas; let dragging = false, dragMoved = 0, last = null;
  canvas.addEventListener("pointerdown", e => { if (M.MOBILE) return; dragging = true; dragMoved = 0; last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); $("help").classList.add("off"); });
  canvas.addEventListener("pointermove", e => { if (locked) { P.yaw -= e.movementX * 0.0022; P.pitch = clamp(P.pitch - e.movementY * 0.0022, -1.45, 1.45); return; } if (!dragging || !last) return; const dx = e.clientX - last.x, dy = e.clientY - last.y; dragMoved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.004; P.pitch = clamp(P.pitch - dy * 0.004, -1.45, 1.45); last = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointerup", e => { if (M.MOBILE) return; dragging = false; if (dragMoved < 5) { if (!interact(e) && M.LOCK && !locked) canvas.requestPointerLock && canvas.requestPointerLock(); } });
  document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === canvas; });
  const stick = $("stick"), knob = $("knob"); let stickVec = { x: 0, y: 0 }, stickId = null, stickC = null, lookId = null, lookLast = null, lookMoved = 0;
  stick.addEventListener("touchstart", e => { const t = e.changedTouches[0]; stickId = t.identifier; const r = stick.getBoundingClientRect(); stickC = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; e.preventDefault(); }, { passive: false });
  stick.addEventListener("touchmove", e => { for (const t of e.changedTouches) { if (t.identifier !== stickId) continue; let dx = t.clientX - stickC.x, dy = t.clientY - stickC.y; const m = Math.hypot(dx, dy), mx = 50; if (m > mx) { dx *= mx / m; dy *= mx / m; } knob.style.left = (36 + dx) + "px"; knob.style.top = (36 + dy) + "px"; stickVec = { x: dx / mx, y: dy / mx }; } e.preventDefault(); }, { passive: false });
  const endStick = e => { for (const t of e.changedTouches) { if (t.identifier !== stickId) continue; stickId = null; stickVec = { x: 0, y: 0 }; knob.style.left = "36px"; knob.style.top = "36px"; } };
  stick.addEventListener("touchend", endStick); stick.addEventListener("touchcancel", endStick);
  canvas.addEventListener("touchstart", e => { const t = e.changedTouches[0]; lookId = t.identifier; lookLast = { x: t.clientX, y: t.clientY }; lookMoved = 0; }, { passive: true });
  canvas.addEventListener("touchmove", e => { for (const t of e.changedTouches) { if (t.identifier !== lookId) continue; const dx = t.clientX - lookLast.x, dy = t.clientY - lookLast.y; lookMoved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.005; P.pitch = clamp(P.pitch - dy * 0.005, -1.45, 1.45); lookLast = { x: t.clientX, y: t.clientY }; } e.preventDefault(); }, { passive: false });
  canvas.addEventListener("touchend", e => { for (const t of e.changedTouches) { if (t.identifier !== lookId) continue; if (lookMoved < 12) interact({ clientX: t.clientX, clientY: t.clientY }); lookId = null; } });

  /* ---------- looking at things: aim, the card ---------- */
  const ray = new THREE.Raycaster(); ray.far = 16; let aimed = null;
  function hit(e) {
    const pt = (e && e.clientX != null && !locked) ? { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 } : { x: 0, y: 0 };
    ray.setFromCamera(pt, M.camera); const hits = ray.intersectObjects(M.pickables, false); if (!hits.length) return null; const h = hits[0], u = h.object.userData;
    if (u.work) return { kind: "work", w: u.work.w, show: u.work.show, d: h.distance };
    if (u.tiles) { const i = u.tiles[Math.floor(h.faceIndex / 2)]; return { kind: "work", w: M.counted[i], show: "counted", d: h.distance }; }
    if (u.poster) return { kind: "poster", p: u.poster, d: h.distance };
    if (u.loop) return { kind: "loop", l: u.loop, d: h.distance };
    return null;
  }
  function updateAim() {
    const h = hit(); aimed = h; $("cross").classList.toggle("hot", !!h); const pr = $("prompt");
    if (!h) { pr.classList.remove("on"); return; }
    const key = `<span class="key">${M.MOBILE ? "TAP" : "E"}</span>`;
    if (h.kind === "work") { const e = M.ERAS[h.w.e]; pr.innerHTML = `${key}<b>${h.w.t}</b> &nbsp;No. ${h.w.n} · Era ${e ? e.r : h.w.e}${h.w.m ? " · collected" : ""}`; }
    else if (h.kind === "poster") pr.innerHTML = `${key}<b>${h.p.t || "Poster"}</b> &nbsp;by MLow`;
    else pr.innerHTML = `${key}<b>${h.l.t}</b> &nbsp;${h.l.k === "glitch" ? "glitch edition" : "motion loop"}`;
    pr.classList.add("on");
  }
  function interact(e) { const h = e && e.clientX != null ? hit(e) : aimed; if (!h) return false; openCard(h); return true; }
  function openCard(h) {
    const img = $("lbImg"), vid = $("lbVid"); vid.pause(); vid.removeAttribute("src"); vid.style.display = "none"; img.style.display = "block";
    if (h.kind === "work") {
      const w = h.w, e = M.ERAS[w.e]; img.src = M.ART + w.f; img.alt = w.t;
      $("lbShow").textContent = (SHOWS[h.show] ? SHOWS[h.show].name : h.show).toUpperCase(); $("lbTitle").textContent = w.t;
      $("lbMeta").innerHTML = `No. <b>${String(w.n).padStart(4, "0")}</b> &nbsp;·&nbsp; Era ${e ? e.r + " · " + e.t : w.e}<br>${[w.b, w.h].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}${w.set ? "<br>" + w.set : ""}${w.fam ? "<br>" + w.fam : ""}${w.m ? `<br>Collected by <b>${w.m}</b>` : ""}${w.ts != null ? `<br>The curator's taste for it: <b>${w.ts > 0 ? "+" : ""}${w.ts}</b>` : ""}`;
      $("lbStory").textContent = w.s;
      $("lbLinks").innerHTML = `<a href="https://n3wyorkers.com/n/${w.n}" target="_blank" rel="noopener">The piece</a><a href="https://n3wyorkers.com/census#n=${w.n}" target="_blank" rel="noopener">Its record</a><a href="https://n3wyorkers.com/map#p=${w.n}" target="_blank" rel="noopener">On the atlas</a>`;
    } else if (h.kind === "poster") {
      img.src = "assets/posters/" + h.p.f; img.alt = h.p.t || "Poster"; $("lbShow").textContent = "A POSTER BY MLOW"; $("lbTitle").textContent = h.p.t || "Poster"; $("lbMeta").innerHTML = "NEW YORKERS, the posters"; $("lbStory").textContent = "The posters MLow makes for the city: on the facade, in the lobby, on the store wall."; $("lbLinks").innerHTML = `<a href="https://n3wyorkers.com/posters" target="_blank" rel="noopener">Posters, cards, memes</a>`;
    } else {
      img.style.display = "none"; vid.style.display = "block"; vid.src = "assets/loops/" + h.l.f; vid.muted = true; vid.loop = true; vid.play().catch(() => {});
      $("lbShow").textContent = h.l.k === "glitch" ? "A GLITCH EDITION" : "A MOTION LOOP"; $("lbTitle").textContent = h.l.t; $("lbMeta").innerHTML = `No. <b>${String(h.l.n).padStart(4, "0")}</b>${h.l.tag ? "<br>" + h.l.tag : ""}`; $("lbStory").textContent = h.l.k === "glitch" ? "One of the glitch editions: the painting pushed until the signal breaks, looping." : "The painting in motion, a loop MLow made for the piece.";
      $("lbLinks").innerHTML = `<a href="https://n3wyorkers.com/n/${h.l.n}" target="_blank" rel="noopener">The piece</a>`;
    }
    $("lb").classList.add("on"); if (locked && document.exitPointerLock) document.exitPointerLock(); sfx("click");
  }
  function closePanels() { for (const id of ["lb", "jump", "curator", "settings"]) $(id).classList.remove("on"); $("lbVid").pause(); }
  document.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", closePanels));
  document.querySelectorAll(".panel").forEach(p => p.addEventListener("click", e => { if (e.target === p) closePanels(); }));
  $("jumpGrid").innerHTML = M.ZONES.map((z, i) => `<button data-go="${i}">${z.name}<small>${i === 9 ? 0 : i + 1} · ${z.sub}</small></button>`).join("");
  $("jumpGrid").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (!b) return; M.go(+b.dataset.go); closePanels(); });
  $("bJump").addEventListener("click", () => $("jump").classList.add("on"));
  function cycleTime() { M.setPreset(M.ORDER[(M.ORDER.indexOf(M.presetName) + 1) % M.ORDER.length]); toast(`Time of day · <b>${M.presetName}</b>`); }
  $("bTime").addEventListener("click", cycleTime); $("bTime").textContent = "Time · " + M.presetName;
  // the curator's panel: the room you are in, what it learned, what it refused
  function openCurator() {
    const [a, b] = M.zoneOf(P, feet()); let room = null; for (const k in M.ROOMS) { const r = M.ROOMS[k]; if (Math.abs(r.y - F[F.reduce((best, y, i) => Math.abs(feet() - y) < Math.abs(feet() - F[best]) ? i : best, 0)]) < 0.1 && P.x >= r.x0 && P.x <= r.x1 && P.z >= r.z0 && P.z <= r.z1 && r.showKey) room = r; }
    const s = room && SHOWS[room.showKey];
    $("curRoom").innerHTML = s ? `<div class="plate">${a} · ${b}</div><h3>${s.name}</h3><p>${s.why}</p><p class="plate">${s.works.length} works · the collected ones lead</p>` : `<div class="plate">${a} · ${b}</div><h3>The curator</h3><p>Walk into a room and press C again for its note.</p>`;
    $("curTaste").innerHTML = `<p>The curator learned MLow's taste from <b>${DATA.taste.positives}</b> pieces he already chose: his own mints, the Keystone picks, the faces on the home page, the pieces he made posters and cards for. It refused <b>${DATA.taste.refused}</b> of ${DATA.counts.census.toLocaleString()} for being soft, flat or muddy.</p><p>Words it weighs most: <b>${DATA.taste.top.slice(0, 18).join(", ")}</b>.</p><p>Edit <span class="mono">_build/taste.json</span> and rebuild to argue with it.</p>`;
    $("curator").classList.add("on"); if (locked && document.exitPointerLock) document.exitPointerLock();
  }
  $("bCurator").addEventListener("click", openCurator);
  // settings
  $("bSettings").addEventListener("click", () => $("settings").classList.toggle("on"));
  $("qSel").value = M.quality; $("qSel").addEventListener("change", () => { try { localStorage.setItem("momlow.q", $("qSel").value); } catch (e) {} toast("Quality · <b>" + $("qSel").value + "</b>. Reloading."); setTimeout(() => location.reload(), 500); });
  $("tSel").value = M.presetName; $("tSel").addEventListener("change", () => { M.setPreset($("tSel").value); });
  $("pSel").addEventListener("change", () => { const on = $("pSel").value === "on"; for (const n of M.npcs) n.g.visible = on; });
  $("fovSel").addEventListener("input", () => { M.camera.fov = +$("fovSel").value; M.camera.updateProjectionMatrix(); });

  /* ---------- sound ---------- */
  let AC = null, soundOn = false, toneGain = null, stepT = 0;
  function toggleSound() { soundOn = !soundOn; if (soundOn && !AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; toneGain = AC.createGain(); toneGain.gain.value = 0; src.connect(f); f.connect(toneGain); toneGain.connect(AC.destination); src.start(); }
    if (AC) { AC.resume(); toneGain.gain.setTargetAtTime(soundOn ? 0.05 : 0, AC.currentTime, 0.4); } $("bSound").textContent = "Sound · " + (soundOn ? "on" : "off"); toast(soundOn ? "Room tone and footsteps on. <b>M</b> again to mute." : "Sound off."); }
  $("bSound").addEventListener("click", toggleSound);
  function sfx(kind) {
    if (!soundOn || !AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    if (kind === "step") { o.type = "triangle"; o.frequency.setValueAtTime(feet() > 1 ? 180 : 120, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.08); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.1); }
    else if (kind === "click") { o.type = "sine"; o.frequency.setValueAtTime(880, t); g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.12); }
    else if (kind === "honk") { o.type = "square"; o.frequency.setValueAtTime(330, t); o.frequency.setValueAtTime(262, t + 0.18); g.gain.setValueAtTime(0.06, t); g.gain.setValueAtTime(0.06, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45); }
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.5);
  }
  M.sfx = sfx;

  /* ---------- typed words ---------- */
  let typedBuf = "", glowT = 0;
  function typed(ch) {
    if (!ch || ch.length !== 1) return; typedBuf = (typedBuf + ch.toLowerCase()).slice(-12);
    const W = { gm: () => { M.setPreset("golden"); toast("gm. <b>Golden hour</b> over 53rd Street."); }, gn: () => { M.setPreset("night"); toast("gn. The windows across the street come on."); },
      count: () => toast(`<b>${hung + M.counted.length}</b> New Yorkers in the building, <b>${M.counted.length}</b> on THE COUNTED, out of a census <b>${DATA.counts.census.toLocaleString()}</b> deep.`, 4200),
      taxi: () => { sfx("honk"); for (const c of M.cabs) c.honk = 1.2; toast("Every cab on the block is off duty. They always were."); },
      pigeon: () => { M.flyT = 7; toast("Up they go."); }, mlow: () => { glowT = 4; toast("<b>MLow</b> made every one of them."); },
      moma: () => toast("After MoMA, with love. The Museum of Modern Art is on 53rd Street too, and it is worth the ticket."), free: () => toast("Admission is free. It always was."),
      bell: () => { sfx("click"); toast("The bell rings. Nobody looks up. This is New York."); }, whale: () => { M.go(4); P.x = 0; P.z = 31; P.pitch = 0.25; toast("Twelve metres. On loan from 79th Street, like the sauropod."); },
      liberty: () => { M.go(2); P.pitch = 0.9; toast("Fourteen metres. The torch is on floor 4."); }, curator: () => openCurator() };
    for (const k in W) if (typedBuf.endsWith(k)) { W[k](); typedBuf = ""; break; }
  }

  /* ---------- post: bloom, vignette and grain on medium and high ---------- */
  if (!M.lo() && !M.REDUCED && THREE.EffectComposer) {
    const composer = M.composer = new THREE.EffectComposer(M.renderer); composer.addPass(new THREE.RenderPass(M.scene, M.camera));
    if (M.hi()) composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.5, 0.9));
    const grain = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D tDiffuse; uniform float t; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + t) * 43758.5453); } void main(){ vec4 c = texture2D(tDiffuse, vUv); float v = smoothstep(1.25, 0.45, distance(vUv, vec2(0.5))); c.rgb *= 0.82 + 0.18 * v; c.rgb += (h(vUv) - 0.5) * 0.028; gl_FragColor = c; }" });
    M.grainPass = grain; composer.addPass(grain);
  }

  /* ---------- the audit ---------- */
  M.audit = function () {
    const out = { works: M.works.length, counted: M.counted.length, fails: [] };
    for (const r of M.works) {
      const sx = r.pos.x + r.n.x * 2.0, sz = r.pos.z + r.n.z * 2.0; const floorY = F.reduce((best, y) => (y <= r.pos.y - 1.0 && y > best) ? y : best, -1);
      const saved = { x: P.x, y: P.y, z: P.z }; P.x = sx; P.z = sz; P.y = floorY + EYE;
      const g = groundY(sx, sz); const q = { x: sx, z: sz }; collide(q); const moved = Math.hypot(q.x - sx, q.z - sz);
      if (Math.abs(g - floorY) > 0.4) out.fails.push({ n: r.w.n, show: r.show, why: "no floor at the stand point", g, floorY, at: [sx, sz] });
      else if (moved > 0.25) out.fails.push({ n: r.w.n, show: r.show, why: "stand point inside a solid", moved, at: [sx, sz] });
      P.x = saved.x; P.y = saved.y; P.z = saved.z;
    }
    for (let i = 0; i < M.works.length; i++) for (let j = i + 1; j < M.works.length; j++) { const a = M.works[i], b = M.works[j]; if (Math.abs(a.pos.y - b.pos.y) > 1.2 || a.n.dot(b.n) < 0.9) continue; const d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z); if (d < (a.aw + b.aw) / 2 + 0.05 && Math.abs(a.pos.y - b.pos.y) < (a.ah + b.ah) / 2) out.fails.push({ n: a.w.n, m: b.w.n, why: "overlap", d }); }
    return out;
  };

  /* ---------- power ----------
     at most 60 frames a second, 30 after twenty seconds untouched (a lift ride counts as touching), about six in a window
     that is not in front. Everything that moves runs on dt. See HANDOFF_POWER_2026-10-12.md in the site repo. */
  const POWER = { last: performance.now(), drawn: 0, frames: 0, blurred: !document.hasFocus() };
  const touched = () => { POWER.last = performance.now(); };
  for (const ev of ["keydown", "mousemove", "mousedown", "touchstart", "touchmove", "wheel"]) addEventListener(ev, touched, { passive: true });
  addEventListener("blur", () => { POWER.blurred = true; }); addEventListener("focus", () => { POWER.blurred = false; touched(); });
  function powerBudget() { if (POWER.blurred) return 160; if (riding || performance.now() - POWER.last < 20000) return 15.5; return 32; }
  window.__POWER = POWER; window.__powerBudget = powerBudget;

  /* ---------- the loop ---------- */
  const clock = new THREE.Clock(); let aimT = 0, streamT = 1, zoneT = 0, frames = 0;
  function animate() {
    requestAnimationFrame(animate);
    const nowMs = performance.now(); if (nowMs - POWER.drawn < powerBudget()) return; POWER.drawn = nowMs; POWER.frames++;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (M.fade < 1) { M.fade = Math.min(1, M.fade + dt / 2.2); M.applyPreset(M.target, 0.08); } else if (frames < 3) M.applyPreset(M.target, 1);
    let mx = 0, mz = 0;
    if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1; if (keys.KeyA) mx -= 1; if (keys.KeyD) mx += 1;
    if (keys.ArrowLeft) P.yaw += 1.8 * dt; if (keys.ArrowRight) P.yaw -= 1.8 * dt;
    mx += stickVec.x; mz -= stickVec.y;
    const mag = Math.hypot(mx, mz);
    if (riding) {
      riding.t += dt; const k = Math.min(1, riding.t / riding.dur), s = k * k * (3 - 2 * k); const y = M.lerp(riding.y0, riding.y1, s); P.y = y + EYE; M.liftY = y; if (k >= 1) riding = null;
    } else {
      if (mag > 0.01 && running) { mx /= Math.max(mag, 1); mz /= Math.max(mag, 1); const speed = (keys.ShiftLeft || keys.ShiftRight) ? 5.8 : 3.3; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); P.x += (fx * mz + rx * mx) * speed * dt; P.z += (fz * mz + rz * mx) * speed * dt; collide(P); stepT += dt * speed; if (stepT > 2.1) { stepT = 0; sfx("step"); } }
      const ty = EYE + groundY(P.x, P.z); P.y += (ty - P.y) * Math.min(1, dt * 10);
      if (M.inLift()) M.liftY = feet();
    }
    M.camera.position.set(P.x, P.y + Math.sin(t * 9) * (mag > 0.01 ? 0.012 : 0), P.z); M.camera.rotation.set(P.pitch, P.yaw, 0);
    M.tickPeople(dt, t, P); M.tickProps(dt, t, P); if (M.tickDress) M.tickDress(dt, t, P);
    if (glowT > 0) { glowT -= dt; const s = 1 + Math.max(0, Math.sin(glowT * 3)) * 0.35; for (const m of M.artMats) m.color.setScalar(M.cur.art * s); if (glowT <= 0) M.applyPreset(M.target, 1); }
    aimT += dt; if (aimT > 0.1) { aimT = 0; if (running) updateAim(); }
    streamT += dt; if (streamT > 0.45) { streamT = 0; M.stream(P); M.tickScreens(P); }
    zoneT += dt; if (zoneT > 0.5) { zoneT = 0; M.cullLights(P); const [a, b] = M.zoneOf(P, feet()); const z = $("zone"); if (z.firstChild.textContent !== a || z.lastChild.textContent !== b) { z.firstChild.textContent = a; z.lastChild.textContent = b; } const lp = $("liftPrompt"); lp.classList.toggle("on", M.inLift() && !riding); }
    if (M.grainPass) M.grainPass.uniforms.t.value = t;
    if (M.composer) M.composer.render(); else M.renderer.render(M.scene, M.camera);
    frames++;
  }
  M.applyPreset(M.target, 1); M.cullLights(P); window.__stage = "running"; animate();

  function enter() { $("enter").classList.add("off"); running = true; if (M.LOCK && !M.MOBILE) canvas.requestPointerLock && canvas.requestPointerLock(); toast(`<b>MoMLOW</b> · ${hung + M.counted.length} New Yorkers in the building. Walk in.`, 3600); }
  $("go").addEventListener("click", enter); if (M.Q.get("go") === "1") enter();
  (function progress() { const q = M.queued ? M.queued() : 0, b = $("go"); if (!running) b.textContent = q > 0 ? `Enter the museum · ${q} more things arriving` : "Enter the museum"; else { const t = $("tickText"); } if (q > 0) setTimeout(progress, 500); else b.textContent = "Enter the museum"; })();
  if (M.MOBILE) $("fine").textContent = "Left thumb walks · drag to look · tap a work";
  window.__game = { P, go: M.go, ride: M.ride, collide, groundY, works: M.works, counted: M.counted, shows: SHOWS, zones: M.ZONES, setPreset: M.setPreset, audit: M.audit, scene: M.scene, camera: M.camera, renderer: M.renderer, props: Promise.all(M.allProps), get loadedFull() { return M.loadedFull; }, npcs: M.npcs, solids: M.solids, plates: M.plates, rooms: M.ROOMS, M };
  if (M.AUDIT) { const r = M.audit(); window.__audit = r; console.log("AUDIT", JSON.stringify(r)); }
})(window.M);
