#!/bin/bash
# fire every plate in plates.tsv that is not on disk yet, three at a time
cd "$(dirname "$0")/.."
while IFS=$'\t' read -r name scene; do
  [ -f "work/plates_raw/$name.png" ] && continue
  tools/plate.sh "$name" "$scene" &
  while [ "$(jobs -rp | wc -l)" -ge 3 ]; do sleep 3; done
done < tools/plates.tsv
wait; echo ALL DONE
