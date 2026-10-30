"""patch_main.py <gallery dir>: turn the LIVE FROM THE SEWERS main.js into this gallery's engine. The engine is the same
for the three 2026-10-30 galleries; only the names, the hooks, the rider roster and a few hooks for the rooms differ.
Reads <gallery>/_build/gallery.json and rewrites <gallery>/_build/src/main.js in place (idempotent: it starts from the
pristine copy kept in _build/src/main.sewers.js)."""
import json, os, re, sys
G = os.path.abspath(sys.argv[1]); SRC = os.path.join(G, "_build", "src"); cfg = json.load(open(os.path.join(G, "_build", "gallery.json")))
pristine = os.path.join(SRC, "main.sewers.js")
if not os.path.exists(pristine): os.rename(os.path.join(SRC, "main.js"), pristine)
s = open(pristine).read()
def sub(a, b, n=1):
    global s
    if a not in s: sys.exit("patch anchor missing: " + a[:70])
    s = s.replace(a, b, n)
# the model loader takes a tilt (the Three D Scans objects are Z up) and tells a wrapper when the meshes have landed
sub("function glb(name, { h, len, x = 0, y = 0, z = 0, ry = 0, parent = scene, onload, shadow = true } = {}) {", "function glb(name, { h, len, x = 0, y = 0, z = 0, ry = 0, rx = 0, parent = scene, onload, shadow = true } = {}) {")
sub("load(name, g, { h, len, y, onload, shadow, done: () => { if (rr) rr.loadingN--; } }); } });", "load(name, g, { h, len, y, rx, onload, shadow, done: () => { if (rr) rr.loadingN--; } }); } });")
sub("function load(name, g, { h, len, y, onload, shadow, done }) {", "function load(name, g, { h, len, y, rx = 0, onload, shadow, done }) {")
sub("pv.rotation.y = YAW[name] || 0; pv.updateMatrixWorld(true);", "pv.rotation.set(rx || 0, YAW[name] || 0, 0); pv.updateMatrixWorld(true);")
sub("g.add(sc); g.userData.ready = true; if (g.userData.click) clickable(g, g.userData.click, g.userData.hint); onload && onload(g, sc);", "g.add(sc); g.userData.ready = true; if (g.userData.click) clickable(g, g.userData.click, g.userData.hint); g.userData.onWrap && g.userData.onWrap(); onload && onload(g, sc);")
# the rooms can ask where the visitor is and read the room list
sub("const ctx = { avatar, keys: null,", "const ctx = { avatar, keys: null, ROOMS, cur: () => cur, go: (i) => go(i),")
# the extra yaws for this gallery's models
sub("const YAW = {", "const YAW = { " + ", ".join(f"{k}: {v}" for k, v in cfg.get("yaw", {}).items()) + (", " if cfg.get("yaw") else ""))
# names, keys, hooks, the roster
for a, b in [("'sew.skate.best'", f"'{cfg['key']}.skate.best'"), ("'sew.skate.goals'", f"'{cfg['key']}.skate.goals'"), ("'sew.skate.rider'", f"'{cfg['key']}.skate.rider'")]: s = s.replace(a, b)
s = re.sub(r"const CLIP = \{ on: false, t0: 0, hooks: \[.*?\] \};", "const CLIP = { on: false, t0: 0, hooks: " + json.dumps(cfg["hooks"]) + " };", s, flags=re.S)
s = re.sub(r"const ROSTER = \[.*?\n\]", "const ROSTER = " + json.dumps(cfg["roster"]), s, flags=re.S)
s = re.sub(r"localStorage\.getItem\('(\w+)\.skate\.rider'\) \|\| '\w+'", lambda m: f"localStorage.getItem('{cfg['key']}.skate.rider') || '{cfg['roster'][0][0]}'", s)
s = s.replace("return 'sw_pizzarat'; }", "return '" + cfg['roster'][0][0] + "'; }")
s = s.replace("if (!ROSTER.some((r) => r[0] === riderName)) riderName = 'hustler';", f"if (!ROSTER.some((r) => r[0] === riderName)) riderName = '{cfg['roster'][0][0]}';")
sub("' · LIVE FROM THE SEWERS'", f"' · {cfg['title']}'")
sub("'Every egg in the sewer found. The rats have counted you. You may go back up now. Nobody will believe you.'", json.dumps(cfg["eggline"]))
sub("$('#go').textContent = 'Drop in';", f"$('#go').textContent = {json.dumps(cfg['goText'])};")
sub("'WASD to walk. Shift to hurry. Click anything. 1 to 0 jumps sets. K to skate.'", json.dumps(cfg["toast"]))
sub("SKATE THE SEWER", cfg.get("skateTitle", "SKATE IT"))
# the opening card: these galleries have no release years in their film lines, so the range is the hours and the ticker is the rooms
sub("put('i-years', `${Math.min(...yrs)} TO ${Math.max(...yrs)}`);", "if (yrs.length) put('i-years', `${Math.min(...yrs)} TO ${Math.max(...yrs)}`);")
sub("put('i-films', sets.map((r) => r.film.replace(/, (\\d{4})$/, ' ($1)')).join('   ·   ')); }", "put('i-films', ROOMS.map((r) => r.name.toUpperCase() + ' · ' + r.film).join('   ·   ')); }")
s = s.replace("The customs officer", "")
# the crowd (crowd.js, CLOUDS AND DIRT V2): extras become the Tripo cast cut for crowds, the nearest twenty rigged
s = s.replace("import { Sound } from './sound.js';", "import { Sound } from './sound.js';\nimport { crowdInit, crowdTick, CROWD } from './crowd.js';", 1)
s = s.replace("gltf.setDRACOLoader(draco);", "gltf.setDRACOLoader(draco);\ncrowdInit({ THREE, loader: gltf, on: Q.get('crowd') !== 'old', clickable: (m, fn, hint) => clickable(m, fn, hint), rig: Q.get('rig') !== 'off', mobile: MOBILE }); window.__CROWD = CROWD;", 1)
s = s.replace("const tick = (f) => tickers.push(f);", "const tick = (f) => tickers.push(f);\ntick((t, dt) => crowdTick(dt, camera));", 1)
# a room's own spawn point counts at the start and on a ?room= link too, not only on the room buttons (the walk audit and the shots stand where the visitor stands)
s = s.replace("if (Q.get('room')) { const r = ROOMS.find((q) => q.id === Q.get('room')); if (r) P.x = r.x0 + W / 2; }", "if (Q.get('room')) { const r = ROOMS.find((q) => q.id === Q.get('room')); if (r) { P.x = r.x0 + (r.spawn ? r.spawn[0] : W / 2); P.z = r.spawn ? r.spawn[1] : D / 2 - 2.2; } } else if (ROOMS[0] && ROOMS[0].spawn) { P.x = ROOMS[0].x0 + ROOMS[0].spawn[0]; P.z = ROOMS[0].spawn[1]; }", 1)
assert "ROOMS[0].spawn[1]" in s
assert "crowdTick(dt, camera)" in s and "crowdInit({" in s
open(os.path.join(SRC, "main.js"), "w").write(s)
print("main.js patched for", cfg["title"])
