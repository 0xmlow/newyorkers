#!/bin/bash
# One still, headless Chrome on the GPU: tools/shot.sh <name> "<query>" [w] [h] [budget ms]
# e.g. tools/shot.sh block_0 "room=block&view=0"   (serve with npm run dev first, port 5190; or BASE=http://localhost:5191)
cd "$(dirname "$0")/.."; mkdir -p .shots
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE=${BASE:-http://localhost:5190}
"$CH" --headless=new --use-angle=metal --enable-gpu --hide-scrollbars --window-size=${3:-1600},${4:-900} \
  --virtual-time-budget=${5:-14000} --screenshot=".shots/$1.png" "$BASE/?${NOSHOT:+x}${NOSHOT:-shot}&$2" 2>/dev/null
sips -s format jpeg -s formatOptions 80 ".shots/$1.png" --out ".shots/$1.jpg" >/dev/null && rm ".shots/$1.png"
echo ".shots/$1.jpg"
