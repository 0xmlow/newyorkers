#!/bin/bash
# final_shots.sh <gallery>: one entrance shot per room, one room per run, into <gallery>/work/final
G=$1; mkdir -p $G/work/final
for id in $(grep -o "{ id: '[a-z]*'" $G/_build/src/rooms.js | cut -d"'" -f2); do
  python3 _shared/shot.py $G $G/work/final $id=room=$id --wait 20 2>&1 | grep -v "Clock\|^\s*at \|^    -\|^  log\|^  \]"
done
