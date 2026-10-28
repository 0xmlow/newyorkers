# BREAK GLASS

A NEW YORKERS 1/1 by MLow. Made 2026-10-15. Not minted. On the site at n3wyorkers.com/breakglass (assets/breakglass, copied by build_galleries.py); code on GitHub branch `break-glass`.

A blue evil eye emergency cabinet on a white terrazzo plinth, roped off with blue velvet under one spotlight. The eyes on the enamel follow your cursor and blink. Hit the frosted glass three times with the hammer on the chain. The first hit sets a crack pattern, the second spreads it, the third breaks the glass along exactly those cracks: the pieces round the hit are driven into the case, the rest lose their support, drop, tip off the frame's lip and settle flat on the plinth or the felt, and a few stay stuck in the frame. Inside is one of the Keystone 111, pulled at random. A cyan beacon on top spins and a bell rings. The controls are on the stand, not on the screen: a console on the plinth has RE-ARM (every shard flies back into the frame and the glass seals for another pull), TURN (the back) and SOUND. The back is the MLow logo plate and an inspection tag (LAST CHECKED: NEVER).

## Files

- `site/index.html` is the whole piece in one self contained file, 17.6 MB. three.js, the MLow logo and every painting are inline. No network calls, so it works from IPFS or Arweave as an `animation_url`.
- `PREVIEW.png` is a 1600 x 1600 still for the token `image` field.
- `_build/` rebuilds it: `./build.sh`. `build_art.py` reads the Keystone 111 mint kit; `main.js` is the scene; `shell.html` is the page.

## What is inside

All 111 Keystone works, 163 painted stills (every still state in `KEYSTONE 111 MINT KIT 2026-09-17/tokens`). Each work has the same chance. Within a work, the state is weighted:

| Tier | Weight | Which states |
|---|---|---|
| KEYSTONE STATE | 6 | the pinned state |
| ALTERNATE STATE | 2 | alternates, originals, studies |
| CANAL STREET BOOTLEG | 1 | the bootleg states, the rarest pull |

The card shows the exact odds of the pull (for example 1 IN 111 for a single state work). A tally of how many of the 111 the viewer has met is kept in their own browser.

Images are webp, 960 px on the long edge, quality 58, to keep the file mintable. `python3 build_art.py 1280 72` makes a sharper 32 MB version.

`?seed=123` makes the pulls repeat in order (for a film or a demo). Keys: space or enter strikes, R re-arms, B turns it around, M mutes. `?auto` (or `?auto=4000`, in ms) breaks the glass by itself, for stills and films.

## Upgrade, 2026-10-28

A real emergency hammer (turned steel head, hardened point, flat face, evil eye badges, ferrule, enamel handle, ridged grip), stage flame projectors instead of boxes, and stanchions whose ropes clip on with snap hooks. All code, no new files. `mint/build_mint.py` makes the one file mint version (`mint/v2/index.html`, phone guard inlined); `mint/pin.py --piece mint/v2/index.html` would pin it. Token 51 is on the Keystone contract (ERC7160TL): a new version is added with `addTokenUris` and shown once pinned with `pinTokenUri`.

Token 51's next version, ready to pin (2026-10-28): `mint/token51_current.json` is version 0 as read on chain; `mint/build_meta_v2.py` writes `metadata_v2.template.json` from it, changing only the file fields; the GIF and still are remade at the original framing into `mint/v2_media/` (`BG_PIECE=mint/v2 BG_GIF_COLORS=144 python3 film/gif.py mint/v2_media/break_glass.gif`; the still is a 1600 square headless shot of the default view). `python3 mint/pin.py --v2 --dry` checks the set; `python3 mint/pin.py --v2` pins it.

## Not verified

- Not tested inside OpenSea, SuperRare or Foundation iframes. Sound needs a click first in every browser, which the first strike provides.
- Checked in the Claude browser pane at desktop and phone size, and in headless Chrome. Not on a real phone.

## Building from this branch

`site/index.html` runs as is: open it in a browser. To rebuild it you need three (`npm i three esbuild`, linked as
`_build/node_modules`) and the Keystone 111 masters that `build_art.py` reads from MLow's mint kit, which are not
in this branch. Part of NEW YORKERS by MLow, n3wyorkers.com. Built with Claude.
