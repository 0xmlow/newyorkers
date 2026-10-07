#!/bin/bash
# Double-click to play MEME ISLAND. Serves the site folder on this Mac and opens it in your browser.
# Browsers will not load 3D textures from a file:// page, so it needs this tiny local server.
cd "$(dirname "$0")/site" || exit 1
PORT=4207
if ! lsof -i :$PORT >/dev/null 2>&1; then python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 & fi
sleep 1
open "http://127.0.0.1:$PORT/index.html"
echo "MEME ISLAND is running at http://127.0.0.1:$PORT  (close this window to stop it)"
wait
