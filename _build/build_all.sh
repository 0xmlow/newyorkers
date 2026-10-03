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
python3 brand_logos.py          # MLow's N3W YORKERS logos onto plates, garbled bylines cut (check brand/logos_contact.jpg)
python3 attach_motion_variants.py
python3 attach_glitch.py
python3 attach_likeness_swaps.py
python3 attach_piece_extras.py   # ChatGPT posters, memes and Keystone cards as p.fx, after the swaps
python3 drop_misfiled.py
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
python3 build_roll.py
python3 build_profile.py
python3 build_shop.py || echo "  shop build skipped (storefront unreachable); the last catalog stands"
python3 build_prints.py   # local: must not be skipped, the buy buttons read it
python3 keystone_shop.py  # local: KEYSTONE 111 store handles for the museum panel and keystone.html
python3 build_links.py
python3 sync_keystone_extras.py  # the wall's site only states follow piece_extras.json
python3 keystone_images.py   # sharp wall images and loops from the mint kit masters; skips what is current
python3 build_keystone.py
python3 build_bloomrun.py
python3 build_moshlab.py       # MOSH LAB from its own repo (MOSH LAB/moshlab/app) into assets/moshlab
# holders first: the honoraries pages link the honorees who collect (collectors/honor_links.json)
python3 collectors/fetch_chain.py || echo "  chain read skipped (nodes unreachable); the last holder snapshot stands"
python3 collectors/link_identities.py   # who each wallet is: X handle and honorary, from ENS, the CRM, OpenSea and homes.json
python3 build_collectors.py     # the collectors leaderboard and badges, from collectors/chain.json
python3 build_honor_cards.py
python3 build_honoraries.py
python3 build_posters.py        # posters, cards and memes wall; after the honor cards and piece extras
python3 build_tv.py             # tv.html, the living frame: a collector's New Yorkers full screen on a TV
python3 build_wall.py           # wall.html, see it on your wall: a collector's New Yorker framed, in AR on a phone
python3 build_my.py             # my.html: a collector's own page; reads api/c at runtime, so holders never need it rebuilt
python3 build_seo.py
python3 build_og.py             # share cards per page (og/cards.json); after every page builder, or og.jpg wins
python3 build_deploy.py | tail -4
python3 preflight.py
echo
echo "Ready. Deploy with:  cd \"$(dirname "$B")/../GO LIVE PACKAGE\" && ./deploy.sh"
