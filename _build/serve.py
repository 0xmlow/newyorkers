import http.server, socketserver, os, sys
os.chdir("/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS SITE")
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4180
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        # the museum bundle is rebuilt constantly, and a cached museum.js silently
        # serves yesterday's rooms, so this dev server never lets anything cache
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", port), H) as h:
    print("serving NEW YORKERS SITE on", port, flush=True); h.serve_forever()
