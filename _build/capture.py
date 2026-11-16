"""capture.py <name> <room> <seconds> [--setup JS] [--w 1280 --h 720] [--hud]: film a moment of THE LIGHTINGS for socials.

Headless Chrome (ANGLE Metal, no shader disk cache, profile on the mlow2026 drive) streams frames with the DevTools
screencast as the page renders them; each frame keeps its timestamp, so the clip plays at the speed it happened. The page's
power saver is held off (__POWER.blurred), the HUD is hidden unless --hud, and the setup script (async, in the page) runs
first and its own timing starts the clip. Writes work/clips/<name>.mp4 (H.264, 30 fps, constant) and <name>.gif (640 wide,
15 fps, palette per clip)."""
import argparse, base64, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
import websocket
ap = argparse.ArgumentParser(); ap.add_argument("name"); ap.add_argument("room"); ap.add_argument("seconds", type=float)
ap.add_argument("--setup", default=""); ap.add_argument("--w", type=int, default=1280); ap.add_argument("--h", type=int, default=720)
ap.add_argument("--hud", action="store_true"); ap.add_argument("--gifw", type=int, default=480); ap.add_argument("--gs", type=float, default=0); ap.add_argument("--gl", type=float, default=7); ap.add_argument("--port", type=int, default=9395); ap.add_argument("--http", type=int, default=4285)
a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); SITE = os.path.join(ROOT, "site"); OUT = os.path.join(ROOT, "work", "clips"); os.makedirs(OUT, exist_ok=True)
FR = tempfile.mkdtemp(prefix="cap-", dir="/Volumes/mlow2026/.chrome_tmp"); prof = tempfile.mkdtemp(prefix="capprof-", dir=os.environ.get("SHOT_PROF") or ("/private/tmp/claude-501" if shutil.disk_usage("/").free > 6e8 else "/Volumes/mlow2026/.chrome_tmp"))
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.http), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
chrome = subprocess.Popen([CH, "--headless=new", f"--remote-debugging-port={a.port}", f"--window-size={a.w},{a.h}", "--user-data-dir=" + prof, "--use-angle=metal",
                           "--disable-gpu-shader-disk-cache", "--autoplay-policy=no-user-gesture-required", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
H = f"http://127.0.0.1:{a.port}"
for _ in range(80):
    try: urllib.request.urlopen(H + "/json/version"); break
    except Exception: time.sleep(0.25)
try:
    t = json.load(urllib.request.urlopen(urllib.request.Request(f"{H}/json/new?about:blank", method="PUT")))
    ws = websocket.create_connection(t["webSocketDebuggerUrl"], max_size=None, suppress_origin=True); n = [0]; frames = []
    def send(m, **p):
        n[0] += 1; ws.send(json.dumps({"id": n[0], "method": m, "params": p}))
        while True:
            x = json.loads(ws.recv())
            if x.get("method") == "Page.screencastFrame": keep(x["params"])
            if x.get("id") == n[0]: return x.get("result", {})
    rec = [False]
    def keep(p):
        if rec[0]: frames.append((p["metadata"]["timestamp"], p["data"]))
        ws.send(json.dumps({"id": 0, "method": "Page.screencastFrameAck", "params": {"sessionId": p["sessionId"]}}))
    send("Page.enable"); send("Runtime.enable"); send("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=1, mobile=False)
    send("Page.navigate", url=f"http://127.0.0.1:{a.http}/index.html?auto=1&nolock&noplate&room={a.room}&v={time.time()}"); time.sleep(14)
    for _ in range(80):
        v = send("Runtime.evaluate", expression=f"(()=>{{const r=(window.__ROOMS||[]).find(r=>r.id==='{a.room}'); return !r || r.noPlate || !!r.plateMesh}})()", returnByValue=True).get("result", {}).get("value")
        if v: break
        time.sleep(0.5)
    hide = "" if a.hud else "document.querySelectorAll('#hud,#top,#rooms,#hint,#peek,#eggbox,#skate,#cross,#rf,#rname,#rk,#toast,#bars').forEach((e)=>e.style.setProperty('opacity','0','important'));"
    send("Runtime.evaluate", expression=f"setInterval(()=>{{if(window.__POWER)__POWER.blurred=false;{hide}}},30);1", returnByValue=True)
    time.sleep(1.5)
    send("Page.startScreencast", format="jpeg", quality=88, maxWidth=a.w, maxHeight=a.h, everyNthFrame=1)
    js = "(async()=>{const sleep=(ms)=>new Promise(r=>setTimeout(r,ms)); const R=__ROOMS.find(r=>r.id==='%s'); const at=(x,z,yaw=0,pitch=0)=>{__P.x=R.x0+x;__P.z=z;__P.yaw=yaw;__P.pitch=pitch;}; const hint=(h)=>__clickables.find(m=>(m.userData.hint||'')===h); %s ; return 1})()" % (a.room, a.setup)
    rec[0] = True; t0 = time.time()
    n[0] += 1; ws.send(json.dumps({"id": n[0], "method": "Runtime.evaluate", "params": {"expression": js, "awaitPromise": True}}))
    while time.time() - t0 < a.seconds:
        ws.settimeout(0.5)
        try:
            x = json.loads(ws.recv())
            if x.get("method") == "Page.screencastFrame": keep(x["params"])
        except Exception: pass
    rec[0] = False; ws.settimeout(None)
finally:
    chrome.kill(); srv.kill()
# frames to a constant 30 fps by their timestamps
frames.sort(); print("frames", len(frames), "over", round(frames[-1][0] - frames[0][0], 2) if frames else 0, "s")
for i, (ts, d) in enumerate(frames): open(os.path.join(FR, f"f{i:05d}.jpg"), "wb").write(base64.b64decode(d))
with open(os.path.join(FR, "list.txt"), "w") as f:
    for i in range(len(frames)):
        dur = (frames[i + 1][0] - frames[i][0]) if i + 1 < len(frames) else 1 / 30
        f.write(f"file 'f{i:05d}.jpg'\nduration {max(0.001, dur):.4f}\n")
mp4 = os.path.join(OUT, a.name + ".mp4"); gif = os.path.join(OUT, a.name + ".gif")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(FR, "list.txt"), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "slow", mp4], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a.gs), "-t", str(a.gl), "-i", mp4, "-vf", f"fps=12,scale={a.gifw}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a", gif], check=True)
shutil.rmtree(FR, ignore_errors=True); shutil.rmtree(prof, ignore_errors=True)
print("wrote", mp4, os.path.getsize(mp4) // 1024, "KB;", gif, os.path.getsize(gif) // 1024, "KB")
