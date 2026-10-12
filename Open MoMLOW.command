#!/bin/bash
# Serves MoMLOW on this Mac and opens it. Paintings load from n3wyorkers.com; the atlases, textures and props from site/assets.
cd "$(dirname "$0")/site" && (python3 -m http.server 4313 >/dev/null 2>&1 &) && sleep 1 && open "http://127.0.0.1:4313/index.html"
