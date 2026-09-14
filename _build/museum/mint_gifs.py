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
ap.add_argument("--art-view", action="store_true", help="walk to the hung work with the most other works in view (the engine focus) instead of the spawn")
ap.add_argument("--port-base", type=int, default=9470)
ap.add_argument("--reuse-day", action="store_true", help="keep day frames already on disk; recapture only the pan")
ap.add_argument("--exports", default="", help="export folder holding the room records (default: the parent of --out)")
A = ap.parse_args()
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOMS = json.load(open(os.path.join(SITE, "_build/rooms.json")))
ONLY = set(x for x in A.rooms.split(",") if x)
EXPORTS = A.exports or os.path.dirname(os.path.abspath(A.out))


def hung_count(rid):
    """Only the first len(hang) mounts carry a work; the rest stand empty, so an art view must choose among those."""
    r = next(x for x in ROOMS if x["id"] == rid)
    p = os.path.join(EXPORTS, f"new-yorkers-museum-{r['index']:02d}-{rid}.json")
    return len(json.load(open(p)).get("hang", [])) if os.path.exists(p) else 9999
HIDE_UI = """(()=>{const c=document.querySelector('canvas');if(!c)return 'no canvas';const keep=new Set();for(let e=c;e;e=e.parentElement)keep.add(e);
document.querySelectorAll('body *').forEach(e=>{if(!keep.has(e)&&!c.contains(e))e.style.setProperty('visibility','hidden','important')});
keep.forEach(e=>e.style&&e.style.setProperty('visibility','visible','important'));c.style.setProperty('outline','none','important');c.blur();return 'hidden'})()"""
ART_VIEW = """(H=>{const m=window.__museum,ms=m.build.mounts,n=Math.min(H,ms.length);let best=-1,bs=-1;const cone=Math.cos(35*Math.PI/180);
for(let i=0;i<n;i++){const a=ms[i],st=a.target.clone(),d=a.position.clone().sub(st);if(d.length()<0.5)continue;d.normalize();let s=0;
for(let j=0;j<n;j++){const e=ms[j].position.clone().sub(st);if(e.length()>30)continue;if(e.normalize().dot(d)>cone)s++}if(s>bs){bs=s;best=i}}
if(best<0)return null;m.focus(best);return JSON.stringify({mount:best,score:bs,hung:n})})(%d)"""
SETTLED = """new Promise(res=>{const c=window.__museum.camera;let last=c.position.clone(),q=c.quaternion.clone(),still=0;const t=setInterval(()=>{
const moved=c.position.distanceTo(last)+c.quaternion.angleTo(q);last.copy(c.position);q.copy(c.quaternion);still=moved<1e-3?still+1:0;
if(still>=4){clearInterval(t);res('settled')}},120);setTimeout(()=>{clearInterval(t);res('timeout')},12000)})"""
READY = """new Promise(res=>{const t=setInterval(()=>{try{const m=window.__museum;if(m&&m.kit&&m.build&&m.ROOMS[m.state.room].id==%s){clearInterval(t);m.kit.settled().then(()=>res('ready'),()=>res('ready'))}}catch(e){}},150);setTimeout(()=>{clearInterval(t);res('timeout')},45000)})"""


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
        # an empty answer means the page's context was swapped out under the evaluation, not that the room failed:
        # ask again in the new context before hiding the UI or choosing a view
        st = None
        for _ in range(4):
            st = self.js(READY % json.dumps(rid), wait=True)
            if st is not None:
                break
            time.sleep(1.0)
        self.js(HIDE_UI)
        if A.art_view:
            v = None
            for _ in range(3):
                v = self.js(ART_VIEW % hung_count(rid))
                if v:
                    break
                time.sleep(1.0)
            if v:
                self.view = json.loads(v)
                self.view["arrive"] = self.js(SETTLED, wait=True)
        time.sleep(0.9)
        self.js(HIDE_UI)  # again: HUD pieces that draw late would otherwise land on every frame
        return st

    def shot(self, path):
        d = self.send("Page.captureScreenshot", format="jpeg", quality=92, fromSurface=True)
        open(path, "wb").write(base64.b64decode(d["data"]))

    def drag(self, dx, dy=0, overshoot=24):
        """One look step: press, move dx pixels left or right, release. Left moves turn the view right.
        The engine reads a press that moves 3 px or less as a tap, and a tap on the floor walks the camera there
        (with a ring marker). Near the ends of the sine pan a step is under 3 px, so every drag first swings out
        by `overshoot` px and comes back: the net turn is unchanged and no release ever counts as a tap."""
        x0, y = A.size / 2, A.size / 2
        self.send("Input.dispatchMouseEvent", type="mouseMoved", x=x0, y=y)
        self.send("Input.dispatchMouseEvent", type="mousePressed", x=x0, y=y, button="left", clickCount=1)
        self.send("Input.dispatchMouseEvent", type="mouseMoved", x=x0 + overshoot, y=y, button="left", buttons=1)
        steps = max(1, int(max(abs(dx - overshoot), abs(dy)) // 12) + 1)
        for s in range(1, steps + 1):
            self.send("Input.dispatchMouseEvent", type="mouseMoved", x=x0 + overshoot + (dx - overshoot) * s / steps, y=y + dy * s / steps, button="left", buttons=1)
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
    p0 = json.loads(tab.js("JSON.stringify(window.__museum.camera.position.toArray())"))
    for k in range(A.frames):
        tab.shot(os.path.join(folder, "turn", f"{k:03d}.jpg"))
        if k == A.frames // 4:
            y1 = tab.js("window.__museum.camera.rotation.y")
        tab.drag((target(k) - target(k + 1)) / 0.0042)
        time.sleep(0.06)
    p1 = json.loads(tab.js("JSON.stringify(window.__museum.camera.position.toArray())"))
    drift = math.dist(p0, p1)  # the pan must turn the camera in place; any travel means a drag was read as a tap
    hours = []
    if r["daylit"]:
        os.makedirs(os.path.join(folder, "day"), exist_ok=True)
        for h in [int(x) for x in A.hours.split(",")]:
            if A.reuse_day and os.path.exists(os.path.join(folder, "day", f"{h:02d}.jpg")):
                hours.append(h)
                continue
            tab.load(r["id"], h)
            tab.shot(os.path.join(folder, "day", f"{h:02d}.jpg"))
            hours.append(h)
    rec = {"id": r["id"], "index": r["index"], "ready": st, "yaw0": y0, "yaw1": y1, "frames": A.frames, "hours": hours, "day": A.day, "hour": A.hour, "view": tab.view if A.art_view else "spawn", "drag": "overshoot", "drift_m": round(drift, 4), "seconds": round(time.time() - t0, 1)}
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
                    print(f"[{i}] {r['index']:03d} {r['id']:<16} {rec if rec == 'skip' else str(rec['seconds']) + 's ' + str(rec['ready']) + ' pan ' + format(abs(rec['yaw1'] - rec['yaw0']) * 57.3, '.0f') + 'deg drift ' + format(rec['drift_m'], '.3f') + 'm'}", flush=True)
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
