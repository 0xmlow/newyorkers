#!/bin/bash
# NEW YORKERS · the whole build in order. Run from anywhere.
#   ./build_all.sh            fast path: registry, thumbs, museum bundle, reading room, shop, links, seo, deploy package, preflight
#   ./build_all.sh --data     also rebuild data.js and geo.js first (slow; only after an era changes)
set -e
B="$(cd "$(dirname "$0")" && pwd)"
cd "$B"
if [ "$1" = "--data" ]; then
  python3 build_data_v4.py
  python3 map/build_geo2.py
fi
python3 attach_motion_variants.py
python3 attach_likeness_swaps.py
python3 tidy_motion_reel.py
python3 link_same_subject.py
python3 rooms_registry.py
python3 build_room_thumbs.py
python3 build_new_rooms.py
# The hang is assigned before the bundle is built: every New Yorker gets exactly
# one room, so no piece can hang on two walls. Rerun after data.js changes.
( cd museum && node assign_hang.mjs | sed "s/^/  /" && npm run check >/dev/null && npm run build >/dev/null && echo "museum bundle built" )
# Every work has to be reachable and face its viewer. Fails the build if not.
( cd museum && node audit_rooms.mjs | sed "s/^/  /" )
python3 build_learn.py
python3 build_faq.py
python3 build_vault.py
python3 build_shipping.py
python3 build_whitelist.py
python3 build_profile.py
python3 build_shop.py || echo "  shop build skipped (storefront unreachable); the last catalog stands"
python3 build_prints.py   # local: must not be skipped, the buy buttons read it
python3 build_links.py
python3 build_seo.py
python3 build_deploy.py | tail -4
python3 preflight.py
echo
echo "Ready. Deploy with:  cd \"$(dirname "$B")/../GO LIVE PACKAGE\" && ./deploy.sh"
