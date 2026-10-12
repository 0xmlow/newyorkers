#!/bin/bash
# Copy site/ into the scratchpad the headless server reads (a server cannot read the Desktop), then serve it on 4312
# and start headless Chrome on 9333 if they are not running. python3 _build/shots.py takes the contact sheet.
D=/private/tmp/claude-501/mm; mkdir -p "$D"
rsync -a --delete "$(dirname "$0")/../site/" "$D/site/"
curl -s -o /dev/null http://127.0.0.1:4312/ || (python3 -m http.server 4312 --directory "$D/site" > "$D/http.log" 2>&1 &)
curl -s -o /dev/null http://127.0.0.1:9333/json/version || (nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --user-data-dir="$D/chrome" --no-first-run --hide-scrollbars --mute-audio --window-size=1440,900 about:blank > "$D/chrome.log" 2>&1 &)
sleep 2
