#!/bin/bash
# move Firefly downloads (sd_*.png) from ~/Downloads into posters/raw or work/raw (panels) as they land; stop after $1 files or 40 min
cd "$(dirname "$0")/.."; want=${1:-10}; got=0
for i in $(seq 1 800); do
  for f in ~/Downloads/sd_*.png; do [ -f "$f" ] || continue; sleep 1
    b=$(basename "$f"); case $b in sd_panel_*) mv "$f" "work/raw/${b#sd_panel_}";; *) mv "$f" posters/raw/;; esac; got=$((got+1)); echo "$(date +%H:%M:%S) $b"; done
  [ $got -ge $want ] && break; sleep 3
done; echo "collected $got"
