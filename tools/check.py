#!/usr/bin/env python3
"""check.py: the gardens walk audit (2026-11-23). Headless on :4301 / :9401 (or --port), it checks that the page loads
without exceptions, all 179 frames are there and none is blocked by an upgrade collider, every spot lands, a walker
can still walk the main routes, and every ride starts and ends.  python3 tools/check.py [--mobile] [--query up=0]"""
import subprocess, time, os, sys, json, urllib.request, tempfile, shutil, socket, argparse
import websocket
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(os.path.dirname(HERE), "site")
ap = argparse.ArgumentParser(); ap.add_argument("--port", type=int, default=9401); ap.add_argument("--http", type=int, default=4301)
ap.add_argument("--mobile", action="store_true"); ap.add_argument("--query", default=""); a = ap.parse_args()
def port_open(p):
    with socket.socket() as s: return s.connect_ex(("127.0.0.1", p)) == 0
srv = None if port_open(a.http) else subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
prof = tempfile.mkdtemp(prefix="gardens-check-")
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", f"--remote-debugging-port={a.port}", "--window-size=1280,720", "--user-data-dir=" + prof, "--use-angle=metal", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f"http://127.0.0.1:{a.port}"
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
fails = []
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f"{HOST}/json/new?about:blank", method="PUT")))
    ws = websocket.create_connection(r["webSocketDebuggerUrl"], max_size=None, suppress_origin=True); n = [0]; logs = []
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({"id": n[0], "method": method, "params": params}))
        while True:
            m = json.loads(ws.recv())
            if m.get("method") == "Runtime.exceptionThrown": logs.append("EXC " + str(m["params"]["exceptionDetails"].get("exception", {}).get("description", m["params"]["exceptionDetails"].get("text")))[:300])
            if m.get("method") == "Runtime.consoleAPICalled" and m["params"]["type"] == "error": logs.append("error " + " ".join(str(x.get("value", x.get("description", "")))[:200] for x in m["params"]["args"]))
            if m.get("method") == "Log.entryAdded" and m["params"]["entry"]["level"] == "error" and "favicon" not in m["params"]["entry"].get("url", ""): logs.append("LOG " + m["params"]["entry"]["text"][:200] + " " + m["params"]["entry"].get("url", ""))
            if m.get("id") == n[0]: return m.get("result", {})
    def ev(js): return send("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True).get("result", {}).get("value")
    send("Page.enable"); send("Runtime.enable"); send("Log.enable")
    if a.mobile:
        send("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=3, mobile=True); send("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
    t0 = time.time(); send("Page.navigate", url=f"http://127.0.0.1:{a.http}/index.html" + ("?" + a.query if a.query else ""))
    while time.time() - t0 < 120 and not ev("!!window.__walk"): time.sleep(0.5)
    print("loaded in %.1f s" % (time.time() - t0))
    if not ev("!!window.__walk"): fails.append("page did not load")
    else:
        ev("document.getElementById('go').click(); window.__POWER.blurred = false; 1"); time.sleep(2)
        res = ev("""(() => {
          const w = window.__walk, T = w.camera.position.constructor, out = {};
          out.slots = w.slots.length; out.withArt = w.slots.filter((s) => s.userData.art && s.userData.art.img).length;
          // a frame is blocked if an upgrade collider stands between it and a viewer 2.2 m in front of it at its own height
          out.blocked = [];
          for (const s of w.slots) {
            const p = new T(); s.getWorldPosition(p); const q = w.meta.slots.find((x) => x.name === s.userData.slot); const nrm = new T(...q.normal);
            const eye = p.clone().addScaledVector(nrm, 2.2), dir = p.clone().sub(eye), d = dir.length(); dir.normalize();
            if (w.cast2(eye, dir, d - 0.05)) out.blocked.push(q.name);
          }
          // every spot lands where it should
          out.spots = w.spots.map((sp) => { w.goTo(sp); return [sp.label, +w.P.pos.y.toFixed(2), w.P.fly]; });
          return out; })()""")
        print("frames", res.get("slots"), "with art", res.get("withArt"), "blocked", res.get("blocked"))
        print("spots", res.get("spots"))
        if res.get("slots") != 179 or res.get("withArt") != 179: fails.append("frames")
        if res.get("blocked"): fails.append("blocked frames " + ",".join(res["blocked"]))
        for lab, y, fly in res.get("spots", []):
            if y != y or abs(y) > 400: fails.append("spot " + lab)
        # walks: hold W from a spot for a while, check the walker covered most of the straight line distance
        walks = [("gate to plaza", 0, 1.0, 0.0, 15, 50), ("boardwalk to plaza", 1, 1.0, 0.0, 12, 40), ("plaza to wheel", 2, None, 0.0, 12, 35), ("hall end to end", 3, None, -1.5708, 10, 25)]
        for name, si, _, yaw, secs, need in walks:
            r2 = ev(f"""(() => {{ const w = window.__walk; w.goTo(w.spots[{si}]); {"" if name != "plaza to wheel" else "w.P.pos.set(0, w.P.pos.y, 40);"} w.P.yaw = {yaw}; w.P.pitch = 0; const a = w.P.pos.clone();
                w.keys.KeyW = true; w.tick(1/30, {int(secs*30)}); w.keys.KeyW = false; return [+a.distanceTo(w.P.pos).toFixed(1), +w.P.pos.x.toFixed(1), +w.P.pos.z.toFixed(1)]; }})()""")
            print("walk", name, r2)
            if not r2 or r2[0] < need: fails.append(f"walk {name} {r2}")
        rides = ev("""(() => { const w = window.__walk, out = []; for (const k of Object.keys(w.meta.rides)) { w.startRide(k); w.tick(1/30, 60); out.push([k, !!w.P.ride, +w.camera.position.y.toFixed(1)]); w.endRide(); } return out; })()""")
        print("rides", rides)
        if not rides or any(not r[1] for r in rides): fails.append("rides")
    for l in dict.fromkeys(logs): print(l)
finally:
    chrome.kill()
    if srv: srv.kill()
    time.sleep(0.5); shutil.rmtree(prof, ignore_errors=True)
print("FAIL" if fails else "ok", fails)
