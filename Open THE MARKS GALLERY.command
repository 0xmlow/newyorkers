#!/bin/bash
# Serves site/ on localhost and opens the gallery (browsers block video and GLB loading from file://).
cd "$(dirname "$0")/site" || exit 1
PORT=4216
python3 -m http.server $PORT >/dev/null 2>&1 &
sleep 1; open "http://localhost:$PORT/"
echo "THE MARKS gallery on http://localhost:$PORT  (close this window to stop)"; wait
