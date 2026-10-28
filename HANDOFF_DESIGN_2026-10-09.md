# Design pass, 2026-10-09: palette from the art, the transit kit

LIVE as build 20261009-030525 (Cloudflare deployment 2e664b2b), deployed at MLow's ask.

- Colours are measured from 600 census paintings, not picked: `_build/palette_from_art.py` (`--measure`
  to reprint them, no flags to rewrite any old electric colour that creeps back). Midnight navy grounds;
  streetlight gold, amber, coral, brick, sky teal and harbor blue accents.
- `assets/site.css` TRANSIT KIT: the nav is a black enamel station sign over the yellow tactile platform
  edge, SKELLY CUP in the main stops and eight more under MORE (a station directory board), so the bar
  holds one line. Buttons are MetroCards (`.btn`, home `.primary`/`.fly-btn`), riveted enamel signs
  (`.ghost`) and brass rimmed tokens (`.pink`/`.mint`); a pointer light, a swipe on press and painted eye
  flowers on click come from `assets/site.js`. Glazed tile and a mosaic frieze painted on FLORA, cut to an
  exact repeat, in `assets/ui/` (tile.webp, mosaic.webp, mosaic-eye.webp).
- SKELLY CUP's lane colours are on the art palette; the page keeps its own world (body class `skelly`).
- Skills that carry this forward: `premium-site-design` and `new-yorkers-site` (folders and .skill zips in
  NEW YORKERS BY MLOW/). GitHub branch `skelly-cup` holds the collab code as a clean snapshot.

Not verified: real Safari and iOS, the museum and 3D galleries beyond their first frame, the README on
GitHub main (not updated; the edit needs MLow's go ahead).

## THE TURNSTILE, 2026-10-23: the mint buttons made fun

MLow asked for more fun, more degen mint buttons, with $2 of FLORA. Everything is in `assets/mint.js`
(the bar on every page); the header comment there explains it.

- The census button is a MetroCard in a turnstile reader. Drag it through the slot inside 0.9 s and it
  beeps GO and mints (it calls the link's own click, so the tab and the `mint_click` hit work as before).
  Slower gets SWIPE AGAIN AT THIS TURNSTILE; after two misses it gives up and lets you through. A plain
  click mints at once and plays the swipe on the way out. No friction is ever added to a click.
- The dot matrix screen scrolls the latest mints from `api/mint.json` `recent` (n3wyorkers.eth is
  filtered out, the team is never shown as a collector) and how many are left. The name gets a coral
  sticker: N LEFT, ONLY N LEFT under 150 (wobbles), LAST N under 20. On a phone the meta reads
  "N LEFT · price"; the price is still never cut.
- Keystone's button carries a brass token (`assets/ui/token.png`) that spins on hover and drops on click.
- Assets from FLORA (partner workspace project "NEW YORKERS · Mint Turnstile 2026-10-23", about $0.57):
  `assets/ui/metrocard.webp` (GPT Image 2.5, then one edit to take a real MTA logo off it; keep it off),
  `assets/ui/turnstile-go.mp3` and `turnstile-again.mp3` (ElevenLabs SFX, trimmed). Sound is fetched
  when a pointer reaches the bar and only played inside the visitor's own click or drag.
- Home `#hmGo` and any `.btn` census OpenSea link play the turnstile sound on click.

Not verified: real Safari and iOS (popup rules for the drag path in particular), a real finger drag on
a phone (the phone layout is tap only by design), sound on iOS with the silent switch.

LIVE COUNT, 2026-10-26 (LIVE build 20261026-184743). The bar no longer waits for a rebuild: the Pages
Function `_build/api/functions/api/mint.js` (GET /api/mint) reads totalSupply for both contracts and the
latest census mints from Blockscout, cached 60 s at the edge; `assets/mint.js` polls it every minute while
the tab is visible and flashes JUST COUNTED when a mint lands during a visit. Team and Artist wallets (tag
on api/collectors.json) are filtered from the scroll, both there and in build_mint.py, which also writes
`api/census_tokmap.json` for the function. Not verified: behaviour when Blockscout rate limits (the count
still updates from the RPC; the scroll falls back to the static list).
