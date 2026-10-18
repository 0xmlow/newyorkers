#!/bin/zsh
# Every viewpoint of every room as a still, then one contact sheet per room in .shots/review_<room>.jpg
cd "$(dirname "$0")/.."
typeset -A N; N=(block 4 bodega 4 walkup 4 studio 3 laundromat 3 subway 3 rooftop 4)
for r in ${=${1:-block bodega walkup studio laundromat subway rooftop}}; do
  for ((i=0;i<${N[$r]};i++)); do ./tools/shot.sh "v_${r}_$i" "room=$r&view=$i" 1280 720 >/dev/null & done; wait
  python3 - "$r" "${N[$r]}" <<'PY'
import sys; from PIL import Image
r,n=sys.argv[1],int(sys.argv[2]); c=Image.new('RGB',(1280,360*((n+1)//2)))
for i in range(n): c.paste(Image.open(f'.shots/v_{r}_{i}.jpg').resize((640,360)),((i%2)*640,(i//2)*360))
c.save(f'.shots/review_{r}.jpg',quality=82)
PY
done
