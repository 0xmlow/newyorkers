#!/usr/bin/env python3
"""reel.py: highlight reels of a simulated game, captured frame by frame from the walk in headless Chrome.

  python3 _build/reel.py --game sim/out/game_7.json                 # vertical + wide + square into reels/7/
  python3 _build/reel.py --game sim/out/game_7.json --only vertical --rank 2
  python3 _build/reel.py --game sim/out/game_7.json --stills 3155:main,3155:baseline   # check cameras, PNGs in reels/7/stills

The page is driven on our clock, not the browser's: for every frame we call __garden.step(t, dt), which sets game time,
advances the page by dt and renders once, then take a screenshot. Live and replay read the same timeline (replay at 0.4x).
Structure of the vertical (astra F): 0-1.5 s hook and score context, 1.5-6 live action, 6-8 landing and reaction,
8-14 one slow motion replay, 14-18 player and crowd response with a lower third, 18-20 result card.
Audio is synthesised here (crowd bed, swish, rim, horn) at 48 kHz; ffmpeg muxes it.
"""
import argparse, array, base64, json, math, os, random, shutil, struct, subprocess, sys, tempfile, time, urllib.request, wave

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); SITE = os.path.join(ROOT, "site")
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), "NEW YORKERS SITE", "_build", "museum"))
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FPS = 30
SHAPES = {"vertical": (1080, 1920), "wide": (1920, 1080), "square": (1080, 1080)}

# ---------------------------------------------------------------- the browser
class Page:
    def __init__(self, port=9361, http=4241):
        self.http = http
        self.srv = subprocess.Popen([sys.executable, "-m", "http.server", str(http), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.prof = tempfile.mkdtemp(prefix="garden-reel-")
        self.chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}", "--window-size=1920,1920", "--user-data-dir=" + self.prof,
                                        "--use-angle=metal", "--hide-scrollbars", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        host = f"http://127.0.0.1:{port}"
        for _ in range(80):
            try: urllib.request.urlopen(host + "/json/version"); break
            except Exception: time.sleep(0.25)
        r = json.load(urllib.request.urlopen(urllib.request.Request(f"{host}/json/new?about:blank", method="PUT")))
        self.ws = websocket.create_connection(r["webSocketDebuggerUrl"], max_size=None, suppress_origin=True)
        self.n = 0; self.logs = []
        self.send("Page.enable"); self.send("Runtime.enable")
    def send(self, method, **params):
        self.n += 1; self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("method") == "Runtime.exceptionThrown": self.logs.append("EXC " + str(m["params"]["exceptionDetails"].get("exception", {}).get("description", ""))[:300])
            if m.get("method") == "Runtime.consoleAPICalled" and m["params"]["type"] == "error": self.logs.append("error " + " ".join(str(x.get("value", x.get("description", "")))[:200] for x in m["params"]["args"]))
            if m.get("id") == self.n: return m.get("result", {})
    def js(self, expr):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in r: raise RuntimeError(json.dumps(r["exceptionDetails"])[:500])
        return r.get("result", {}).get("value")
    def open(self, game_url, w, h, t0):
        self.send("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1, mobile=False)
        self.send("Page.navigate", url=f"http://127.0.0.1:{self.http}/index.html?replay={game_url}&capture&noao&t={t0}&v={time.time()}")
        for _ in range(240):
            time.sleep(0.5)
            try:
                if self.js("!!(window.__garden && window.__garden.U && window.__garden.U.capReady && window.__garden.bc)"): break
            except Exception: pass
        else:
            raise RuntimeError("page never got ready: " + "; ".join(self.logs[-5:]))
        self.js("document.fonts.ready.then(() => 1)")
    def shot(self, path):
        d = self.send("Page.captureScreenshot", format="jpeg", quality=93)["data"]
        open(path, "wb").write(base64.b64decode(d))
    def close(self):
        try: self.chrome.kill(); self.srv.kill()
        finally: time.sleep(0.4); shutil.rmtree(self.prof, ignore_errors=True)

# ---------------------------------------------------------------- the edit
def fmt_clock(c): return f"{c:.1f}" if c < 60 else f"{int(c // 60)}:{int(c % 60):02d}"

class Edit:
    """Shot lists. A shot is (cam, game t0, speed, frames, gfx function of k in 0..1)."""
    def __init__(self, G):
        self.G = G; self.P = {p["id"]: {**p, "team": ti} for ti, t in enumerate(G["teams"]) for p in t["roster"]}
        self.T = G["teams"]; self.ev = {e["id"]: e for e in G["events"]}
    def stat(self, pid, upto):
        pts = tpm = reb = ast = blk = 0
        for e in self.G["events"]:
            if e["t"] > upto: break
            if e["type"] == "shot" and e["a"] == pid and e["made"]: pts += e["pts"]; tpm += e["three"]
            if e["type"] == "shot" and e.get("assist") == pid and e["made"]: ast += 1
            if e["type"] == "ft" and e["a"] == pid and e["made"]: pts += 1
            if e["type"] == "rebound" and e["a"] == pid: reb += 1
            if e["type"] == "block" and e["a"] == pid: blk += 1
        parts = [f"<b>{pts}</b> PTS"]
        if tpm: parts.append(f"<b>{tpm}</b> THREES")
        if blk: parts.append(f"<b>{blk}</b> BLK")
        elif reb: parts.append(f"<b>{reb}</b> REB")
        if ast and len(parts) < 3: parts.append(f"<b>{ast}</b> AST")
        return " &nbsp; ".join(parts)
    def lower(self, pid, upto):
        p = self.P[pid]; tm = self.T[p["team"]]
        return {"name": p["name"], "num": p["number"], "sub": f"{tm['name']} · {p['archetype']} · {p['height']:.2f} M", "stat": self.stat(pid, upto), "kit": tm["kit"]}
    def hook(self, h):
        e = self.ev[h["event"]]; team = h["team"]; s = list(e["score"])
        if e["type"] == "shot" and e["made"]: s[e["team"]] -= e["pts"]
        m = s[team] - s[1 - team]; name = self.T[team]["name"]
        ctx = "TIED" if m == 0 else f"DOWN {-m}" if m < 0 else f"UP {m}"
        if e["q"] >= 4 and e["clock"] < 90:
            left = f"{int(math.ceil(e['clock']))} SECONDS LEFT" if e["clock"] < 60 else f"{fmt_clock(e['clock'])} LEFT"
            if e["clock"] < 1.5: left = "LAST SHOT"
            return [f"{name} {ctx}", left]
        p = self.P[h["actor"]]
        what = {"dunk": "GOES UP", "block": "SAYS NO", "steal": "READS IT", "layup": "GETS TO THE RIM"}.get(h["kind"], "FROM DEEP" if (h.get("zone") or "").endswith("3") else "PULLS UP")
        return [f"{name} {ctx} IN THE {['1ST', '2ND', '3RD', '4TH'][min(e['q'], 4) - 1]}", f"{p['name']} {what}"]

    def vertical(self, h):
        t = h["t"]; a = h["actor"]; home = self.P[a]["team"] == 0
        rep = "baseline" if h["kind"] in ("dunk", "layup") else "tight"   # a jump shot reads best from over the glass, a rim play from the baseline
        L = self.lower(a, t + 2); hk = self.hook(h)
        S = []
        S.append(("main", t - 4.6, 1.0, 180, lambda k: {"hook": hk, "hookT": min(1, k * 6 / 1.5) if k * 6 < 1.5 else max(0, 1 - (k * 6 - 1.5) / 0.25) if k * 6 < 1.75 else 0, "replay": False}))
        S.append(("handheld", t + 1.4, 1.0, 60, lambda k: {"hook": None, "wipe": max(0, (k - 0.8) / 0.2) * 0.5}))
        S.append((rep, t - 1.35, 0.4, 180, lambda k: {"replay": True, "wipe": 0.5 + min(1, k * 180 / 7) * 0.5 if k * 180 < 7 else 0}))
        S.append(("crowd" if home else "iso", t + 1.0, 1.0, 60, lambda k: {"replay": False, "wipe": 0}))
        S.append(("iso", t + 1.6, 1.0, 60, lambda k: {"lower": L, "lowerT": min(1, 0.15 + k * 0.85)}))
        S.append(("bridge", t + 3.6, 1.0, 60, lambda k: {"lower": None, "end": min(1, k * 3)}))
        return S, {"iso": self.actor_slot(a, t)}
    def square(self, h):
        t = h["t"]; a = h["actor"]; L = self.lower(a, t + 2); hk = self.hook(h)
        S = [("main", t - 3.6, 1.0, 150, lambda k: {"hook": hk, "hookT": min(1, k * 5 / 1.4), "replay": False} if k * 5 < 1.4 else {"hook": hk, "hookT": max(0, 1 - (k * 5 - 1.4) / 0.25)}),
             ("baseline" if h["kind"] in ("dunk", "layup") else "tight", t - 1.0, 0.4, 150, lambda k: {"hook": None, "replay": True}),
             ("iso", t + 1.4, 1.0, 90, lambda k: {"replay": False, "lower": L, "lowerT": k}),
             ("bridge", t + 4.4, 1.0, 60, lambda k: {"lower": None, "end": min(1, k * 3)})]
        return S, {"iso": self.actor_slot(a, t)}
    def wide(self, hs):
        S = []; extra = {}
        for i, h in enumerate(sorted(hs, key=lambda h: h["t"])):
            t = h["t"]; a = h["actor"]; L = self.lower(a, t + 2); hk = self.hook(h)
            first = i == 0
            S.append(("main", t - 4.2, 1.0, 165, (lambda hk, first: lambda k: {"hook": hk, "hookT": min(1, k * 5.5 / 0.3) if k * 5.5 < 1.6 else max(0, 1 - (k * 5.5 - 1.6) / 0.3), "replay": False, "end": 0,
                                                                     "wipe": (0.5 + min(1, k * 165 / 7) * 0.5) if (not first and k * 165 < 7) else (max(0, (k - 0.93) / 0.07) * 0.5)})(hk, first)))
            S.append(("baseline" if h["kind"] in ("dunk", "layup") else "tight", t - 1.2, 0.4, 135, (lambda L: lambda k: {"hook": None, "replay": True, "lower": L, "lowerT": k,
                                                                     "wipe": 0.5 + min(1, k * 135 / 7) * 0.5 if k * 135 < 7 else max(0, (k - 0.95) / 0.05) * 0.5})(L)))
        last = sorted(hs, key=lambda h: h["t"])[-1]
        S.append(("bridge", last["t"] + 3.0, 1.0, 75, lambda k: {"replay": False, "lower": None, "wipe": 0.5 + min(1, k * 75 / 7) * 0.5 if k * 75 < 7 else 0, "end": min(1, max(0, k - 0.2) * 3)}))
        return S, {}
    def actor_slot(self, pid, t):
        L = [list(x) for x in self.G["lineups0"]]
        for e in self.G["events"]:
            if e["t"] > t: break
            if e["type"] == "sub": L[e["team"]][e["slot"]] = e["inn"]
        for ti in (0, 1):
            if pid in L[ti]: return ti * 5 + L[ti].index(pid)
        return 0

# ---------------------------------------------------------------- audio
def synth_audio(G, shots, path, sr=48000):
    """Crowd bed shaped by the game, swish on makes, rim on misses, the horn; slow motion sections go low and soft."""
    rng = random.Random(G["meta"]["seed"])
    total = sum(n for _, _, _, n, _ in shots) / FPS; N = int(total * sr)
    out = array.array("f", [0.0]) * N
    makes = [(e.get("tr", e["t"] + 1), e["team"], e.get("pts", 1)) for e in G["events"] if e["type"] in ("shot", "ft") and e.get("made")]
    misses = [e.get("tr", e["t"] + 1) for e in G["events"] if e["type"] in ("shot", "ft") and not e.get("made") and not e.get("blocked")]
    blocks = [e["t"] for e in G["events"] if e["type"] == "block"]
    horns = [e["t"] for e in G["events"] if e["type"] == "period_end"]
    def crowd_level(t):
        lv = 0.32
        for (tm, team, pts) in makes:
            if 0 <= t - tm < 4: lv += (0.9 if team == 0 else 0.25) * math.exp(-(t - tm) / 1.6) * (1.2 if pts == 3 else 1.0)
        for tb in blocks:
            if 0 <= t - tb < 3: lv += 0.6 * math.exp(-(t - tb) / 1.2)
        return min(1.6, lv)
    pos = 0
    b1 = b2 = 0.0
    for (cam, t0, sp, n, _) in shots:
        dur = n / FPS; m = int(dur * sr); slow = sp < 0.9
        for i in range(m):
            gt = t0 + i / sr * sp
            w = rng.uniform(-1, 1)
            b1 += (w - b1) * (0.05 if not slow else 0.015); b2 += (b1 - b2) * 0.2
            lv = crowd_level(gt) if i % 480 == 0 or i == 0 else lv
            out[pos + i] += b2 * 2.2 * lv * (0.45 if slow else 1.0)
        def hit(tev, fn):
            if t0 <= tev < t0 + dur * sp:
                fn(pos + int((tev - t0) / sp * sr), slow)
        def swish(at, slow):
            L = int(sr * (0.5 if slow else 0.28))
            for i in range(L):
                if at + i >= N: break
                e = math.exp(-i / (L * 0.35)); out[at + i] += rng.uniform(-1, 1) * 0.55 * e * (0.6 if slow else 1)
        def clank(at, slow):
            f1, f2 = (620, 910) if not slow else (360, 520)
            for i in range(int(sr * 0.35)):
                if at + i >= N: break
                tt = i / sr; out[at + i] += (math.sin(2 * math.pi * f1 * tt) * 0.25 + math.sin(2 * math.pi * f2 * tt) * 0.15) * math.exp(-tt * 14)
        def horn(at, slow):
            for i in range(int(sr * 1.1)):
                if at + i >= N: break
                tt = i / sr; v = (((233 * tt) % 1) - 0.5) + (((277 * tt) % 1) - 0.5)
                out[at + i] += v * 0.18 * min(1, (1.1 - tt) * 6)
        for (tm, team, pts) in makes: hit(tm, swish)
        for tm in misses: hit(tm, clank)
        for tm in horns: hit(tm, horn)
        pos += m
    # loudness: aim near -14 LUFS with a plain RMS proxy, peaks under -1 dBFS
    rms = math.sqrt(sum(x * x for x in out[::7]) / max(1, len(out[::7])))
    g = (10 ** (-16 / 20)) / max(1e-6, rms)
    peak = max(abs(x) for x in out) * g
    if peak > 0.89: g *= 0.89 / peak
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(array.array("h", (int(max(-32767, min(32767, x * g * 32767))) for x in out)).tobytes())

# ---------------------------------------------------------------- capture
def capture(page, game_url, shape, shots, extra, frames_dir, warm=75):
    w, h = SHAPES[shape]
    os.makedirs(frames_dir, exist_ok=True)
    for f in os.listdir(frames_dir): os.remove(os.path.join(frames_dir, f))
    page.open(game_url, w, h, shots[0][1])
    if "iso" in extra: page.js(f"__garden.bc.state.iso = {extra['iso']}")
    k = 0; t_start = time.time()
    for si, (cam, t0, sp, n, gfx) in enumerate(shots):
        page.js(f"__garden.bc.cam('{cam}')")
        # warm up: the lights settle and the gait phases run in before the first frame
        pre = warm if si == 0 else 20
        for j in range(pre):
            page.js(f"__garden.step({t0 - (pre - j) / FPS * sp:.4f}, {1 / FPS})")
        for i in range(n):
            g = gfx(i / max(1, n - 1)); tau = t0 + i / FPS * sp
            page.js(f"__garden.bc.set({json.dumps(g)}); __garden.bc.gfx.speed = {sp}; __garden.step({tau:.4f}, {1 / FPS})")
            page.shot(os.path.join(frames_dir, f"f{k:05d}.jpg")); k += 1
        print(f"  {shape} shot {si + 1}/{len(shots)} {cam:9s} t={t0:.2f} x{sp}  {n} frames  ({time.time() - t_start:.0f}s)", flush=True)
    return k

def encode(frames_dir, wav, out):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(frames_dir, "f%05d.jpg"), "-i", wav,
                    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", out], check=True)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--game", default="sim/out/game_7.json"); ap.add_argument("--only", default="vertical,wide,square")
    ap.add_argument("--rank", type=int, default=1, help="which selected highlight (by score) leads the vertical; the square takes the next")
    ap.add_argument("--stills", default=""); ap.add_argument("--out", default=""); ap.add_argument("--keep", action="store_true")
    a = ap.parse_args()
    gp = os.path.join(ROOT, a.game) if not os.path.isabs(a.game) else a.game
    G = json.load(open(gp)); seed = G["meta"]["seed"]
    name = os.path.splitext(os.path.basename(gp))[0]
    os.makedirs(os.path.join(SITE, "sim"), exist_ok=True)
    site_copy = os.path.join(SITE, "sim", name + ".json")
    if not os.path.exists(site_copy) or os.path.getmtime(site_copy) < os.path.getmtime(gp): shutil.copy2(gp, site_copy)
    game_url = f"sim/{name}.json"
    out = a.out or os.path.join(ROOT, "reels", str(seed)); os.makedirs(out, exist_ok=True)
    E = Edit(G)
    sel = sorted(G["highlights"]["selected"], key=lambda h: -h["score"])
    page = Page()
    try:
        if a.stills:
            sd = os.path.join(out, "stills"); os.makedirs(sd, exist_ok=True)
            for shape in a.only.split(","):
                w, h = SHAPES[shape]; items = [x.split(":") for x in a.stills.split(",")]
                page.open(game_url, w, h, float(items[0][0]))
                if sel: page.js(f"__garden.bc.state.iso = {E.actor_slot(sel[0]['actor'], sel[0]['t'])}")
                for t, cam in items:
                    page.js(f"__garden.bc.cam('{cam}')")
                    for j in range(40): page.js(f"__garden.step({float(t) - (40 - j) / FPS:.4f}, {1 / FPS})")
                    page.js(f"__garden.step({float(t):.4f}, {1 / FPS})")
                    p = os.path.join(sd, f"{shape}_{cam}_{t}.jpg"); page.shot(p); print("still", p)
            return
        made = []
        for shape in a.only.split(","):
            if shape == "vertical": h = sel[a.rank - 1]; shots, extra = E.vertical(h); tag = f"vertical_{h['event']}"
            elif shape == "square":
                lead = sel[a.rank - 1]; h = next((x for x in sel if x["kind"] == "block" and x is not lead), sel[a.rank % len(sel)])
                shots, extra = E.square(h); tag = f"square_{h['event']}"
            else: shots, extra = E.wide(sel[:3]); tag = "wide_top3"
            fd = os.path.join(out, "_frames_" + tag)
            n = capture(page, game_url, shape, shots, extra, fd)
            wav = os.path.join(out, "_" + tag + ".wav"); synth_audio(G, shots, wav)
            mp4 = os.path.join(out, f"garden_{seed}_{tag}.mp4"); encode(fd, wav, mp4)
            # a contact sheet so the edit can be read at a glance
            sheet = os.path.join(out, f"garden_{seed}_{tag}_contact.jpg")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-vf", f"fps=1,scale={360 if shape != 'wide' else 480}:-1,tile=6x{math.ceil(n / FPS / 6)}", "-frames:v", "1", sheet])
            if not a.keep: shutil.rmtree(fd, ignore_errors=True); os.remove(wav)
            made.append((mp4, n / FPS)); print(f"{mp4}  {n / FPS:.1f}s")
        for l in dict.fromkeys(page.logs): print(l)
    finally:
        page.close()

if __name__ == "__main__":
    main()
