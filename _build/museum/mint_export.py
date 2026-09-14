#!/usr/bin/env python3
"""Export every museum room for the mint in one headless run: GLB, poster PNG and the room record.

  python3 mint_export.py                                  # all rooms, hour 14, hang pinned to today
  python3 mint_export.py --day 2026-09-14 --hour 14 --from 0 --to 135 --out "MUSEUM EXPORTS/2026-09-14 MINT"

Needs the dev server on :4185 (python3 _build/serve.py 4185). Starts its own receiver (like export_server.py, but
writing to --out) and its own headless Chrome, then drives museum.html?export=all, which exports one room per
page load and reloads itself until done.txt lands. Indices are 0 based.
"""
import argparse, datetime, http.server, json, os, subprocess, tempfile, threading, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ap = argparse.ArgumentParser()
ap.add_argument("--day", default=datetime.date.today().isoformat())
ap.add_argument("--hour", default="14")
ap.add_argument("--from", dest="frm", type=int, default=0)
ap.add_argument("--to", type=int, default=-1)
ap.add_argument("--out", default="")
ap.add_argument("--recv", type=int, default=4191)
ap.add_argument("--port", type=int, default=9461)
ap.add_argument("--site", default="http://127.0.0.1:4185")
A = ap.parse_args()
OUT = A.out or os.path.join(ROOT, "MUSEUM EXPORTS", f"{A.day} MINT")
os.makedirs(OUT, exist_ok=True)


class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Name")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        name = os.path.basename(self.headers.get("X-Name", ""))
        if not name or ".." in name:
            self.send_response(400); self.end_headers(); return
        data = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        open(os.path.join(OUT, name), "wb").write(data)
        self.send_response(200); self._cors(); self.send_header("Content-Type", "application/json"); self.end_headers()
        self.wfile.write(b'{"ok":true}')
        print(f"saved {name} ({len(data)/1e6:.1f} MB)", flush=True)

    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", A.recv), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix="mintexp-")
chrome = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={A.port}", "--window-size=1600,900", "--user-data-dir=" + prof, "--use-angle=metal", "--disable-extensions", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
host = f"http://127.0.0.1:{A.port}"
for _ in range(80):
    try:
        urllib.request.urlopen(host + "/json/version"); break
    except Exception:
        time.sleep(0.25)
import websocket
tab = json.load(urllib.request.urlopen(urllib.request.Request(host + "/json/new?about:blank", method="PUT")))
ws = websocket.create_connection(tab["webSocketDebuggerUrl"], max_size=None, suppress_origin=True)
to = f"&to={A.to}" if A.to >= 0 else ""
url = f"{A.site}/museum.html?export=all&auto=1&from={A.frm}{to}&hour={A.hour}&day={A.day}&post=http://127.0.0.1:{A.recv}/&v={int(time.time())}"
ws.send(json.dumps({"id": 1, "method": "Page.navigate", "params": {"url": url}}))
print("driving", url, "->", OUT, flush=True)
t0 = time.time()
try:
    while True:
        done = [f for f in os.listdir(OUT) if f == "done.txt" or f.startswith("chunk-")]
        if done:
            print("finished", done, f"{time.time()-t0:.0f}s", flush=True); break
        if time.time() - t0 > 3 * 3600:
            print("gave up after 3 h", flush=True); break
        time.sleep(3)
finally:
    chrome.terminate(); srv.shutdown()
recs = sorted((json.load(open(os.path.join(OUT, f))) for f in os.listdir(OUT) if f.startswith("new-yorkers-museum-") and f.endswith(".json")), key=lambda r: r["index"])
json.dump({"day": A.day, "hour": A.hour, "rooms": recs}, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
fails = [f for f in os.listdir(OUT) if f.startswith("FAILED-")]
print(len(recs), "rooms exported", "failed:", fails)
