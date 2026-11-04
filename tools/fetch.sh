#!/bin/bash
# usage: tools/fetch.sh <dir> <name> <url> [<name> <url> ...]   downloads FLORA outputs (media.flora.ai is public) as <dir>/<name>.png
d="$1"; shift; mkdir -p "$d"
while [ $# -gt 1 ]; do [ -s "$d/$1.png" ] || curl -sf -o "$d/$1.png" "$2" || echo "FAILED $1"; shift 2; done
ls "$d" | wc -l
