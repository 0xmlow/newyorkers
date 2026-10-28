#!/bin/bash
# fire every pair in pairs.json that has no raw diptych yet, three at a time
cd "$(dirname "$0")/.."
python3 -c "import json;[print(p['id']+'\t'+p['la']+'\t'+p['lb']) for p in json.load(open('pairs.json'))]" | while IFS=$'\t' read -r id la lb; do
  [ -f "work/raw/$id.png" ] && continue
  tools/panel.sh "$id" "$la" "$lb" &
  while [ "$(jobs -rp | wc -l)" -ge 3 ]; do sleep 3; done
done; wait; echo ALL DONE
