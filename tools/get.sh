#!/bin/bash
# usage: tools/get.sh <name> <url> <job>  saves work/v2/<name>.jpg (q92) and logs it in work/krea_runs.tsv
cd "$(dirname "$0")/.."; mkdir -p work/v2; curl -s -o "work/v2/$1.png" "$2" && python3 -c "from PIL import Image;import sys;Image.open('work/v2/$1.png').convert('RGB').save('work/v2/$1.jpg',quality=92)" && rm "work/v2/$1.png" && echo -e "v2\t$1\t$3\t$2" >> work/krea_runs.tsv && ls -la "work/v2/$1.jpg" | awk '{print $5, $9}'
