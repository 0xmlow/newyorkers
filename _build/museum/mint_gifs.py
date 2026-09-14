#!/usr/bin/env python3
"""Capture the animated previews for every museum room: a slow turn from the spawn and, for daylit rooms, a day.

  python3 mint_gifs.py --out "MUSEUM EXPORTS/2026-09-14 MINT/previews"            # all rooms
  python3 mint_gifs.py --rooms katz,bowery --workers 1                               # a subset

Per room it writes into <out>/<NNN-id>/:
  turn/000.jpg ... turn/071.jpg   a sine pan either side of the spawn view at the mint hour, UI hidden, square, loops
  day/HH.jpg                      the spawn view at each hour of the day cycle (daylit rooms only)
Assembly into GIF and MP4 is mint_network.py's job, so a recapture never forces a rebuild and back.

Needs the dev server on :4185. Each worker runs its own headless Chrome. The camera is turned with a synthetic
pointer drag because the engine rewrites the camera rotation from its own yaw every frame (0.0042 rad per px).
"""
import argparse, base64, json, math, os, subprocess, sys, tempfile, threading, time, urllib.request, queue
import websocket

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, "..", ".."))
ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--rooms", default="")
ap.add_argument("--day", default="2026-09-14")
ap.add_argument("--hour", default="14")
ap.add_argument("--hours", default="6,8,11,14,17,18,19,20,22")
ap.add_argument("--frames", type=int, default=96)
ap.add_argument("--pan", type=float, default=25, help="degrees either side of the spawn view")
ap.add_argument("--size", type=int, default=900)
ap.add_argument("--workers", type=int, default=3)
ap.add_argument("--site", default="http://127.0.0.1:4185")
ap.add_argument("--skip-done", action="store_true")
ap.add_argument("--art-view", action="store_true", help="stand at the viewing point of the mount with the most works in view instead of the spawn")
ap.add_argument("--port-base", type=int, default=9470)
A = ap.parse_args()
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOMS = json.load(open(os.path.join(SITE, "_build/rooms.json")))
ONLY = set(x for x in A.rooms.split(",") if x)
HIDE_UI = """(()=>{const c=document.querySelector('canvas');if(!c)return 'no canvas';const keep=new Set();for(let e=c;e;e=e.parentElement)keep.add(e);
document.querySelectorAll('body *').forEach(e=>{if(!keep.has(e)&&!c.contains(e))e.style.setProperty('visibility','hidden','important')});
keep.forEach(e=>e.style&&e.style.setProperty('visibility','visible','important'));c.style.setProperty('outline','none','important');c.blur();return 'hidden'})()"""
ART_VIEW = """(()=>{const m=window.__museum,ms=m.build.mounts;let best=null,bs=-1;const cone=Math.cos(35*Math.PI/180);
for(const a of ms){const st=a.target.clone(),d=a.position.clone().sub(st);if(d.length()<0.5)continue;d.normalize();let s=0;
for(const b of ms){const e=b.position.clone().sub(st);if(e.length()>30)continue;if(e.normalize().dot(d)>cone)s++}if(s>bs){bs=s;best=a}}
if(!best)return null;const st=best.target.clone(),d=best.position.clone().sub(st);m.camera.position.copy(st);
return JSON.stringify({yaw:Math.atan2(-d.x,-d.z),pitch:Math.max(-0.85,Math.min(0.85,Math.atan2(d.y,Math.hypot(d.x,d.z)))),cy:m.camera.rotation.y,cx:m.camera.rotation.x,score:bs})})()"""
READY = """new Promise(res=>{const t=setInterval(()=>{const m=window.__museum;if(m&&m.kit&&m.build&&m.ROOMS[m.state.room].id==%s){clearInterval(t);m.kit.settled().then(()=>res('ready'))}},150);setTimeout(()=>res('timeout'),45000)})"""


class Tab:
    def __init__(self, port):
        self.prof = tempfile.mkdtemp(prefix=f"gif-{port}-")
        self.proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}", f"--window-size={A.size},{A.size}", "--user-data-dir=" + self.prof, "--use-angle=metal", "--disable-extensions", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        host = f"http://127.0.0.1:{port}"
        for _ in range(80):
            try:
                urllib.request.urlopen(host + "/json/version"); break
            except Exception:
                time.sleep(0.25)
        r = json.load(urllib.request.urlopen(urllib.request.Request(host + "/json/new?about:blank", method="PUT")))
        self.ws = websocket.create_connection(r["webSocketDebuggerUrl"], max_size=None, suppress_origin=True)
        self.n = 0
        self.view = None
        self.send("Page.enable"); self.send("Runtime.enable")
        self.send("Emulation.setDeviceMetricsOverride", width=A.size, height=A.size, deviceScaleFactor=1, mobile=False)

    def send(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.n:
                return m.get("result", {})

    def js(self, expr, wait=False):
        return self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=wait).get("result", {}).get("value")

    def load(self, rid, hour):
        url = f"{A.site}/museum.html?auto=1&hour={hour}&day={A.day}&v={int(time.time()*1000)}#room={rid}"
        self.send("Page.navigate", url=url)
        time.sleep(0.8)
        st = self.js(READY % json.dumps(rid), wait=True)
        self.js(HIDE_UI)
        if A.art_view:
            v = self.js(ART_VIEW)
            if v:
                v = json.loads(v)
                dyaw = (v["cy"] - v["yaw"] + math.pi) % (2 * math.pi) - math.pi
                self.drag(dyaw / 0.0042, (v["cx"] - v["pitch"]) / 0.0032)
                self.view = v
        time.sleep(0.9)
        return st

    def shot(self, path):
        d = self.send("Page.captureScreenshot", format="jpeg", quality=92, fromSurface=True)
        open(path, "wb").write(base64.b64decode(d["data"]))

    def drag(self, dx, dy=0):
        """One look step: press, move dx pixels left or right, release. Left moves turn the view right."""
        x0, y = A.size / 2, A.size / 2
        self.send("Input.dispatchMouseEvent", type="mouseMoved", x=x0, y=y)
        self.send("Input.dispatchMouseEvent", type="mousePressed", x=x0, y=y, button="left", clickCount=1)
        steps = max(1, int(max(abs(dx), abs(dy)) // 12) + 1)
        for s in range(1, steps + 1):
            self.send("Input.dispatchMouseEvent", type="mouseMoved", x=x0 + dx * s / steps, y=y + dy * s / steps, button="left", buttons=1)
        self.send("Input.dispatchMouseEvent", type="mouseReleased", x=x0 + dx, y=y + dy, button="left", clickCount=1)

    def close(self):
        try:
            self.proc.terminate()
        except Exception:
            pass


def capture(tab, r):
    stem = f"{r['index']:03d}-{r['id']}"
    folder = os.path.join(A.out, stem)
    if A.skip_done and os.path.exists(os.path.join(folder, "done.json")):
        return "skip"
    os.makedirs(os.path.join(folder, "turn"), exist_ok=True)
    t0 = time.time()
    st = tab.load(r["id"], A.hour)
    y0 = tab.js("window.__museum.camera.rotation.y")
    # a sine pan around the composed spawn view: out to one side, across, back; the last frame meets the first
    amp = math.radians(A.pan)
    target = lambda k: amp * math.sin(2 * math.pi * k / A.frames)
    y1 = y0
    for k in range(A.frames):
        tab.shot(os.path.join(folder, "turn", f"{k:03d}.jpg"))
        if k == A.frames // 4:
            y1 = tab.js("window.__museum.camera.rotation.y")
        tab.drag((target(k) - target(k + 1)) / 0.0042)
        time.sleep(0.06)
    hours = []
    if r["daylit"]:
        os.makedirs(os.path.join(folder, "day"), exist_ok=True)
        for h in [int(x) for x in A.hours.split(",")]:
            tab.load(r["id"], h)
            tab.shot(os.path.join(folder, "day", f"{h:02d}.jpg"))
            hours.append(h)
    rec = {"id": r["id"], "index": r["index"], "ready": st, "yaw0": y0, "yaw1": y1, "frames": A.frames, "hours": hours, "day": A.day, "hour": A.hour, "view": tab.view if A.art_view else "spawn", "seconds": round(time.time() - t0, 1)}
    json.dump(rec, open(os.path.join(folder, "done.json"), "w"), indent=1)
    return rec


def worker(i, q, log):
    tab = Tab(A.port_base + i)
    try:
        while True:
            try:
                r = q.get_nowait()
            except queue.Empty:
                return
            for attempt in range(2):
                try:
                    rec = capture(tab, r)
                    log.append(rec)
                    print(f"[{i}] {r['index']:03d} {r['id']:<16} {rec if rec == 'skip' else str(rec['seconds']) + 's ' + rec['ready'] + ' pan ' + format(abs(rec['yaw1'] - rec['yaw0']) * 57.3, '.0f') + 'deg'}", flush=True)
                    break
                except Exception as e:
                    print(f"[{i}] {r['id']} attempt {attempt} failed: {e}", flush=True)
                    tab.close(); tab = Tab(A.port_base + i)
    finally:
        tab.close()


q = queue.Queue()
for r in ROOMS:
    if not ONLY or r["id"] in ONLY:
        q.put(r)
os.makedirs(A.out, exist_ok=True)
log = []
ths = [threading.Thread(target=worker, args=(i, q, log)) for i in range(min(A.workers, q.qsize()))]
[t.start() for t in ths]
[t.join() for t in ths]
print("captured", len(log))
