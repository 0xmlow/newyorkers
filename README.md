# MEME ISLAND

A walkable three.js (r128) island for The Memes by 6529 and NEW YORKERS by MLow.
Plain HTML, no build step to play, no CDN: three.js and its loaders are in `site/vendor/`.

## Play

Double-click **Open MEME ISLAND.command** (first time: right-click it, Open, to get past macOS).
It serves `site/` on this Mac and opens http://127.0.0.1:4207/index.html in your browser.

Or from Terminal:

    cd "MEME ISLAND 2026-10-07/site" && python3 -m http.server 4207

then open http://127.0.0.1:4207/index.html. A browser will not load the 3D textures from a
file:// page, so it needs a local server (any static host works: the whole `site/` folder is the site).

## Files

- `site/index.html` the island (all code inline, built from `_build/island.html` by `_build/build.py`)
- `site/assets/` card atlases, FLORA panoramas and materials, `sculpt/` 66 meme sculptures as glTF
- `site/vendor/` three.js r128, GLTFLoader, meshopt decoder
- `_build/harness_island.js` headless test: `node _build/harness_island.js site/index.html`
