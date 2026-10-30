#!/bin/bash
# THE WRAPPED WING: serve site/ on a free port and open it. Double click on a Mac.
cd "$(dirname "$0")/site" || exit 1
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])')
( sleep 0.8; open "http://127.0.0.1:$PORT/" 2>/dev/null || xdg-open "http://127.0.0.1:$PORT/" ) &
python3 -m http.server "$PORT"
