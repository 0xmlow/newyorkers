#!/bin/bash
# Serves site/ on localhost and opens the gallery (browsers block GLB loading from file://).
cd "$(dirname "$0")/site" || exit 1
PORT=4231
python3 -m http.server $PORT >/dev/null 2>&1 &
sleep 1; open "http://localhost:$PORT/"
echo "ON LOCATION on http://localhost:$PORT  (close this window to stop)"; wait
