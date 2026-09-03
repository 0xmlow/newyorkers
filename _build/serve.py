import http.server, socketserver, os, sys
os.chdir("/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS SITE")
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4180
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", port), H) as h:
    print("serving NEW YORKERS SITE on", port, flush=True); h.serve_forever()
