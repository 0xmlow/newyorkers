#!/bin/bash
cd "$(dirname "$0")/.."
while IFS=$'\t' read -r name wall; do
  [ -f "work/walls_raw/$name.png" ] && continue
  tools/wall.sh "$name" "$wall" &
  while [ "$(jobs -rp | wc -l)" -ge 3 ]; do sleep 3; done
done < tools/walls.tsv
wait; echo ALL DONE
