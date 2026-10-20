#!/bin/bash
# One ON RECORD plate through ChatGPT ImageGen (the Codex CLI bundled with ChatGPT.app). Krea had 0 credits on 2026-10-20.
# usage: tools/plate.sh <name> "<scene>"
C=/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
HERE="$(cd "$(dirname "$0")/.." && pwd)"; out="$HERE/work/plates_raw"; name="$1"; scene="$2"
TAIL="Photoreal 35mm film photograph, rich and detailed, cinematic light. Camera at eye height 1.6 m, 24mm lens, one point perspective looking straight ahead, level horizon, the ground runs across the whole bottom edge, nothing close to the camera in the lower third. Every single person, including the main characters, has a giant surreal flower instead of a head exactly like the attached reference image: pink petals around one large human eye with a blue iris. No human faces anywhere. Any sign, awning or poster says NEW YORKERS, N3W, COUNTED or MLOW, or is blank. No real band names, no album titles, no real logos, no real brand names, no celebrities. No borders, no captions, no watermark."
cd "$out" && $C exec --skip-git-repo-check -s workspace-write --image="$HERE/work/flower.png" -- \
 "Use your image generation tool to create ONE image, landscape 3:2 (1536x1024), using the attached image as the reference for the flower heads, then copy the generated PNG into the current directory as $name.png. Do nothing else. Image: $scene $TAIL" < /dev/null > "$HERE/work/imagegen_$name.log" 2>&1
ls -la "$name.png" 2>/dev/null || { echo "FAILED $name"; tail -5 "$HERE/work/imagegen_$name.log"; }
