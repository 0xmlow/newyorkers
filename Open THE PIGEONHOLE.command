#!/bin/bash
# Serves site/ on localhost and opens it. Close this window to stop.
cd "$(dirname "$0")/site" || exit 1
PORT=4377
( sleep 1; open "http://localhost:$PORT/" ) &
exec python3 -m http.server $PORT
