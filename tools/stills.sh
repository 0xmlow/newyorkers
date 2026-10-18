#!/bin/zsh
# The stills the site page shows and the share card uses: public/shots/*.jpg at 1600 x 900, one Chrome at a time.
# Needs the dev server (npm run dev, port 5190). Then npm run build.
cd "$(dirname "$0")/.."; mkdir -p public/shots
for spec in block:block:0 hoarding:block:3 flower:block:1 bodega:bodega:0 walkup:walkup:0 studio:studio:0 dryers:laundromat:0 drum:laundromat:1 train:subway:1 fold:rooftop:0; do
  name=${spec%%:*}; rest=${spec#*:}; room=${rest%%:*}; view=${rest#*:}
  ./tools/shot.sh "st_$name" "room=$room&view=$view" 1600 900 >/dev/null
  mv ".shots/st_$name.jpg" "public/shots/$name.jpg"
done
ls -la public/shots
