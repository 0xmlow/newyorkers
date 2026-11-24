#!/usr/bin/env python3
"""shot.py: headless frames of the gardens walk from fixed views, for before and after pairs.
  python3 tools/shot.py OUT_DIR [--suffix before] [--only gate,plaza] [--query look=0] [--mobile] [--wait 9]
Serves site/ on :4301 (or reuses a server already there), drives headless Chrome on :9401, writes
OUT_DIR/<view>-<suffix>.png and prints console errors and the renderer's draw calls and triangles per view.
Each view sets the walker in fly mode at an exact eye position, so the frame is the same before and after."""
import subprocess, time, os, sys, json, urllib.request, tempfile, base64, argparse, shutil, socket
import websocket

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(os.path.dirname(HERE), "site")
# name: (x, y_eye, z, yaw, pitch). yaw 0 looks down -Z (from the gate to the plaza).
VIEWS = {
    "gate-1":      (0.0, 1.75, 266.0, 0.0, 0.03),
    "gate-2":      (6.0, 1.75, 246.0, 0.35, 0.02),
    "gate-3":      (0.0, 1.65, 262.0, 0.0, 0.029),
    "boardwalk-1": (0.0, 1.75, 150.0, 0.0, 0.01),
    "boardwalk-2": (-6.5, 1.75, 205.0, -1.25, 0.02),
    "boardwalk-3": (0.0, 1.95, 172.0, 3.1416, 0.0),
    "plaza-1":     (14.0, 1.75, 24.2, 0.525, -0.02),
    "plaza-2":     (0.0, 1.75, 58.0, 0.0, -0.05),
    "plaza-3":     (8.0, 1.95, -1.0, 0.55, 0.06),
    "lunahall-1":  (-166.0, 1.75, -223.0, 0.0, 0.04),
    "lunahall-2":  (-125.0, 1.75, -225.0, 1.464, 0.06),
    "lunahall-3":  (-176.0, 2.05, -225.0, 1.5708, 0.05),
    "eyewheel-1":  (34.0, 1.75, -140.0, 0.6365, 0.40),
    "eyewheel-2":  (20.0, 1.75, -110.0, 0.30, 0.15),
    "eyewheel-3":  (0.0, 1.9, -138.0, 0.0, 0.12),
    "gp-1":        (382.0, 1.75, -68.0, 1.6278, 0.014),
    "gp-2":        (340.0, 1.75, -78.0, 1.5708, 0.02),
}
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--suffix", default="before")
ap.add_argument("--only", default=""); ap.add_argument("--query", default=""); ap.add_argument("--wait", type=float, default=9)
ap.add_argument("--load", type=float, default=40); ap.add_argument("--w", type=int, default=1600); ap.add_argument("--h", type=int, default=900)
ap.add_argument("--port", type=int, default=9401); ap.add_argument("--http", type=int, default=4301); ap.add_argument("--mobile", action="store_true")
ap.add_argument("--view", action="append", default=[], help="extra name=x,y,z,yaw,pitch")
ap.add_argument("--eval", default="", help="JS run once after load; its value is printed")
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
for v in a.view:
    n, s = v.split("="); VIEWS[n] = tuple(float(x) for x in s.split(","))
names = [n for n in VIEWS if not a.only or any(n.startswith(o) for o in a.only.split(","))]

def port_open(p):
    with socket.socket() as s: return s.connect_ex(("127.0.0.1", p)) == 0
srv = None
if not port_open(a.http):
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix="gardens-shot-")
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={a.w},{a.h}", "--user-data-dir=" + prof,
                           "--use-angle=metal", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
HOST = f"http://127.0.0.1:{a.port}"
for _ in range(80):
    try: urllib.request.urlopen(HOST + "/json/version"); break
    except Exception: time.sleep(0.25)
try:
    r = json.load(urllib.request.urlopen(urllib.request.Request(f"{HOST}/json/new?about:blank", method="PUT")))
    ws = websocket.create_connection(r["webSocketDebuggerUrl"], max_size=None, suppress_origin=True); n = [0]; logs = []
    def send(method, **params):
        n[0] += 1; ws.send(json.dumps({"id": n[0], "method": method, "params": params}))
        while True:
            m = json.loads(ws.recv())
            if m.get("method") == "Runtime.exceptionThrown": logs.append("EXC " + json.dumps(m["params"]["exceptionDetails"].get("exception", {}).get("description", m["params"]["exceptionDetails"].get("text")))[:400])
            if m.get("method") == "Runtime.consoleAPICalled" and m["params"]["type"] in ("error", "warning"): logs.append(m["params"]["type"] + " " + " ".join(str(x.get("value", x.get("description", "")))[:300] for x in m["params"]["args"]))
            if m.get("method") == "Log.entryAdded" and m["params"]["entry"]["level"] == "error": logs.append("LOG " + m["params"]["entry"]["text"][:300] + " " + m["params"]["entry"].get("url", ""))
            if m.get("id") == n[0]: return m.get("result", {})
    def ev(js): return send("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True).get("result", {}).get("value")
    send("Page.enable"); send("Runtime.enable"); send("Log.enable")
    send("Emulation.setDeviceMetricsOverride", width=(390 if a.mobile else a.w), height=(844 if a.mobile else a.h), deviceScaleFactor=(3 if a.mobile else 1), mobile=a.mobile)
    if a.mobile: send("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
    q = ("?" + a.query) if a.query else ""
    send("Page.navigate", url=f"http://127.0.0.1:{a.http}/index.html{q}")
    t0 = time.time()
    while time.time() - t0 < a.load * 3:
        if ev("!!(window.__walk)"): break
        time.sleep(0.5)
    print("loaded in %.1f s" % (time.time() - t0))
    ev("document.getElementById('start').style.display='none'; document.getElementById('loading').style.display='none'; window.__POWER.blurred=false; 1")
    time.sleep(3)
    if a.eval: print("eval:", json.dumps(ev(a.eval)))
    for name in names:
        x, y, z, yaw, pitch = VIEWS[name]
        ev(f"""(() => {{ const w = window.__walk; w.endRide(); w.P.fly = true; w.P.pos.set({x}, {y} - 1.65, {z}); w.P.yaw = {yaw}; w.P.pitch = {pitch};
              window.__POWER.blurred = false; window.__POWER.last = performance.now(); w.tick(1/60, 2); if (w.probe) w.probe(); return 1; }})()""")
        time.sleep(a.wait)
        ev("window.__POWER.blurred=false; window.__POWER.last=performance.now(); 1"); time.sleep(0.6)
        info = ev("(() => { const i = window.__walk.renderer.info.render; return [i.calls, i.triangles]; })()")
        png = send("Page.captureScreenshot", format="png")["data"]
        open(os.path.join(a.out, f"{name}-{a.suffix}.png"), "wb").write(base64.b64decode(png)); print("shot", name, "calls/tris", info)
    for l in dict.fromkeys(logs): print(l)
finally:
    chrome.kill()
    if srv: srv.kill()
    time.sleep(0.5); shutil.rmtree(prof, ignore_errors=True)
