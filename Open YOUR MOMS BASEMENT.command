#!/bin/bash
# Serves the basement on this Mac and opens it. A browser will not load the textures from a file:// page, so it needs a server.
cd "$(dirname "$0")/site" && (python3 -m http.server 4208 >/dev/null 2>&1 &) && sleep 1 && open "http://127.0.0.1:4208/index.html"
