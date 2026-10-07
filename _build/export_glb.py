"""Export the whole island as one self-contained GLB, then compress it (Draco geometry, WebP textures).
    python3 export_glb.py   ->  DELIVERABLES/glb/meme_island.glb"""
import http.server, json, os, subprocess, threading, time
from cdp import Page
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'glb'); os.makedirs(OUT, exist_ok=True)
RAW = os.path.join(OUT, '_raw.glb'); FINAL = os.path.join(OUT, 'meme_island.glb')
CLI = '/Users/degens/.npm/_npx/425967af1abfabd4/node_modules/.bin/gltf-transform'
class Sink(http.server.BaseHTTPRequestHandler):
    def _cors(self): self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS'); self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        n = int(self.headers['Content-Length']); left = n
        with open(RAW, 'wb') as f:
            while left: b = self.rfile.read(min(left, 1 << 20)); f.write(b); left -= len(b)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8749), Sink); threading.Thread(target=srv.serve_forever, daemon=True).start()
p = Page.open('http://127.0.0.1:4207/index.html?glb=1', 1280, 720)
for _ in range(60):
    time.sleep(1)
    try:
        if p.eval('!!window.__game'): break
    except Exception: pass
p.eval(open(os.path.join(H, 'capture_lib.js')).read()); p.eval(open(os.path.join(H, 'export_lib.js')).read())
p.eval('__game.SCL.dir = "sculpt"'); print('boot', p.eval('__cap.boot(1280,720)')); print('sculptures', p.eval('__cap.loadAll()', timeout=900))
p.eval('__cap.set([2026,10,7,16,0], null, ""); __cap.settle(60)')
print('export', p.eval('__exportGLB("http://127.0.0.1:8749/glb")', timeout=1800)); p.close(); srv.shutdown()
print('raw', os.path.getsize(RAW) // 1048576, 'MB')
r = subprocess.run([CLI, 'optimize', RAW, FINAL, '--compress', 'draco', '--texture-compress', 'webp', '--texture-size', '2048', '--simplify', 'false', '--join', 'false', '--flatten', 'false', '--instance', 'false'], capture_output=True, text=True)
print(r.stdout[-600:], r.stderr[-600:]); (os.remove(RAW) if not os.environ.get('KEEP') else None)
print('final', os.path.getsize(FINAL) // 1048576, 'MB')
