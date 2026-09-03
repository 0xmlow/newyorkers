import http.server, socketserver, os
os.chdir("/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE/site")
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
with socketserver.TCPServer(("127.0.0.1",4174),H) as h: h.serve_forever()
