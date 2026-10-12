#!/bin/bash
# Serves THE SPIRAL on this Mac and opens it. Paintings load from n3wyorkers.com; the atlases, cards and film from site/assets.
cd "$(dirname "$0")/site" && (python3 -m http.server 4311 >/dev/null 2>&1 &) && sleep 1 && open "http://127.0.0.1:4311/index.html"
