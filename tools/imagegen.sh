#!/bin/bash
# ImageGen through the Codex CLI bundled with ChatGPT.app (Krea, FLORA and the other connector had no credits on 2026-10-17).
# usage: tools/imagegen.sh <out dir> <name> <aspect: landscape|square|portrait> <prompt>
C=/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
out="$1"; name="$2"; shape="$3"; prompt="$4"
case $shape in landscape) size="landscape 3:2 (1536x1024)";; square) size="square (1024x1024)";; portrait) size="portrait 2:3 (1024x1536)";; esac
cd "$out" && $C exec --skip-git-repo-check -s workspace-write \
 "Use your image generation tool to create ONE image, $size, then copy the generated PNG into the current directory as $name.png. Do nothing else. Image: $prompt" < /dev/null > "/tmp/imagegen_$name.log" 2>&1
ls -la "$name.png" 2>/dev/null || echo "FAILED $name"
