#!/usr/bin/env python3
"""Receives GLB rooms and poster PNGs that the museum page exports in the browser.

  python3 export_server.py            # listens on 127.0.0.1:4181
  then open  museum.html?export=all   # or click EXPORT GLB inside any room

Files land in  NEW YORKERS BY MLOW/MUSEUM EXPORTS/<date>/  as <room>.glb, <room>.png,
<room>.json (renderer statistics and the hang that was on the walls).
"""
import http.server, json, os, sys, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "MUSEUM EXPORTS", datetime.date.today().isoformat())
os.makedirs(OUT, exist_ok=True)
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4181

class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Name")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        name = os.path.basename(self.headers.get("X-Name", "export.bin"))
        if not name or ".." in name: self.send_response(400); self.end_headers(); return
        n = int(self.headers.get("Content-Length", "0"))
        data = self.rfile.read(n)
        path = os.path.join(OUT, name)
        with open(path, "wb") as f: f.write(data)
        self.send_response(200); self._cors(); self.send_header("Content-Type", "application/json"); self.end_headers()
        self.wfile.write(json.dumps({"saved": os.path.relpath(path, ROOT), "bytes": n}).encode())
        print(f"saved {name} ({n/1e6:.1f} MB)", flush=True)
        if name.endswith('.json') and name != 'manifest.json': manifest()
    def log_message(self, *a): pass

def manifest():
    """Rebuild manifest.json from every room record in the folder, so a chained export needs no client side state."""
    rooms = []
    for f in sorted(os.listdir(OUT)):
        if f.startswith('new-yorkers-museum-') and f.endswith('.json'):
            try: rooms.append(json.load(open(os.path.join(OUT, f))))
            except Exception: pass
    rooms.sort(key=lambda r: r.get('index', 0))
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump({'day': rooms[0].get('day') if rooms else None, 'hour': rooms[0].get('hour') if rooms else None, 'rooms': rooms}, f, indent=1)

if __name__ == "__main__":
    print("export receiver on", PORT, "->", OUT, flush=True)
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
