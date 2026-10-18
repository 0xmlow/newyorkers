#!/bin/bash
# Stills for the site page and share card: the entrance and the four installations, 1600x900, headless Chrome on the GPU.
# Serve the built site on 5189 first (python3 -m http.server 5189 -d site), then: tools/shots.sh && npm run build
cd "$(dirname "$0")/.."; mkdir -p public/shots .shots
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
names=(entrance bagel studio circle commute)
for i in 0 1 2 3 4; do
  n=$((i-1))
  "$CH" --headless=new --use-angle=metal --enable-gpu --hide-scrollbars --window-size=1600,900 \
    --virtual-time-budget=9000 --screenshot=".shots/$i.png" "http://localhost:5189/?shot=$n" 2>/dev/null
  sips -s format jpeg -s formatOptions 84 ".shots/$i.png" --out "public/shots/${names[$i]}.jpg" >/dev/null
done
rm -rf .shots; ls -la public/shots
