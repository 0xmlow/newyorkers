#!/bin/bash
# One SAME DIFFERENCE wallpaper: a flat elevation whose left and right edges tile. usage: tools/wall.sh <name> "<wall>"
C=/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
HERE="$(cd "$(dirname "$0")/.." && pwd)"; out="$HERE/work/walls_raw"; name="$1"; wall="$2"
TAIL="A perfectly flat, straight on, orthographic elevation of one wall, photographed square to the wall with no perspective at all: no floor, no ceiling, no corners, no people standing in front of it. The wall fills the entire frame edge to edge, rich in detail, photoreal. The left and right edges tile seamlessly. Any face in a picture or poster is replaced by a giant surreal flower with one human eye at its centre, like the attached reference. Any sign or label says NEW YORKERS, N3W, COUNTED or MLOW, or is blank. No real logos, no celebrities."
cd "$out" && $C exec --skip-git-repo-check -s workspace-write --image="$HERE/work/flower.png" -- \
 "Use your image generation tool to create ONE image, landscape 3:2 (1536x1024), using the attached image only as the reference for any flower heads, then copy the generated PNG into the current directory as $name.png. Do nothing else. Image: $wall $TAIL" < /dev/null > "$HERE/work/imagegen_wall_$name.log" 2>&1
ls -la "$name.png" 2>/dev/null || { echo "FAILED $name"; tail -3 "$HERE/work/imagegen_wall_$name.log"; }
