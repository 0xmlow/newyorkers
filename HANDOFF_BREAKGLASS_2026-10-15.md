# BREAK GLASS at /breakglass (2026-10-15)

A NEW YORKERS 1/1 by MLow, made to be minted. A blue evil eye emergency case: hit the glass three times, it
shatters, and one of the Keystone 111 is inside, pulled at random from their 163 painted states. Re-arm rewinds
the shards into the frame for another pull. The back is the MLow plate and an inspection tag.

## Where it lives

- Source: `../BREAK GLASS 1 OF 1 2026-10-15/` (its own git repo). `_build/build.sh` writes `site/index.html`,
  one self contained 17.6 MB file: three.js bundled by esbuild (through a symlink to the museum's node_modules),
  the art as webp data URIs read from `KEYSTONE 111 MINT KIT 2026-09-17/tokens`, the logo inline. The same file is
  the mint file. `PREVIEW.png` is the still, and the share card.
- Site: `build_galleries.py` entry `breakglass`, after THE GENTRIFYING MUSEUM, `need=("index.html",)` because the
  piece has no vendor folder. Nav: MORE, line A. Footer: The census column, after Keystone 111. Sitemap and llms.txt
  in `build_seo.py`. Deploy lists in `build_deploy.py`. `.gitignore` keeps only `assets/breakglass/poster.jpg`.
- GitHub: branch `break-glass`, a single commit snapshot of the source repo. Update it with a new commit on top.

## Second pass (same day)

The case stands on a white terrazzo plinth behind velvet ropes under one spotlight. RE-ARM, TURN and SOUND are
3D buttons on a console in the plinth (raycast against invisible larger hit cylinders), not DOM buttons; the
label card sits bottom left. The glass breaks along one crack pattern made at the first hit (`makePattern`),
drawn by levels, and the extruded shards are cut from the same polygons. `surfaceAt()` says what a falling shard
lands on (felt, frame lip, console, plinth tiers, floor) and it lands on its lowest corner. `?auto` breaks it
unattended; use it with real time headless Chrome over CDP (virtual time barely advances rAF).

## Third pass: fire, IPFS, the film (deployed 20261015-172319)

- Pyro units fire on open and on every break (`ignite(dur, pow)`, CPU particles, shader heat ramp).
- IPFS: `BREAK GLASS 1 OF 1 2026-10-15/mint/pin.py` (census pinlib, Pinata). tokenURI
  `ipfs://bafkreieivnnc3rcfiypyeikvvecri2ab6zktlhmj5ysvib32iqmlbychia`; media folder
  `bafybeig4swrcrlm64mvv2l3tfooy2axwercjlr6l26ubikl5s7zqmimbva` (index.html, break_glass.gif, preview.png,
  break_glass_film.mp4). The live site copy and the pinned file have the same sha256. Not minted.
- The film: `BREAK GLASS FILM 2026-10-15/` (rig.py virtual clock capture, film.js director, cues.py, score.py
  synthesised score, master.py, gif.py). On the page as HLS via `encode_film.sh breakglass`.

## Traps

- One shared CanvasTexture for the enamel, tiling in the UVs. A clone per face uploads the canvas once per clone
  on every eye repaint.
- The hammer's impact fires on `t >= 0.38`, not inside a window; at low frame rates a window gets skipped.
- The Claude browser pane throttles a hidden tab to a few fps. Measure frame cost (about 1 ms) before calling it slow.

- `Object3D.add()` returns the parent, so `g.add(mesh).position.y = x` moves the group. That put the beacon
  inside the case for the whole first version.

## Not verified

Not tested inside a marketplace iframe or on a real phone. Not minted.

## Upgrade pass, 2026-10-28

The "Not minted" lines above are out of date: MLow minted it as token 51 on the Keystone contract (an ERC7160TL clone,
so a token can carry several metadata versions) and listed it on SuperRare (commit 1fce6c85). The first audit left the
piece alone for that reason; MLow then said the contract lets us upgrade it, so the same day:

- Hammer (`_build/main.js`, the hammer block): a real emergency hammer now. A turned steel head with a hardened
  conical point and a polished flat face, a square eye block with an evil eye badge on each cheek, a chrome ferrule,
  a lathed enamel handle in the house blue, a ridged navy rubber grip, a lanyard eye where the chain clips. Steel has a
  brushed roughness map. Same local frame, so the swing, the impact and the chain are unchanged.
- Flame units: rounded powder coated chassis on rubber feet, louvred front panel (FLAME FX, a key switch), vented
  sides, carry handles, a bolted top plate under the same chrome nozzle, a power cable under the plinth.
- Stanchions: turned bases, a neck under the ball, a collar at rope height, and each rope ends in a chrome cap and a
  snap hook clipped into an eye on the collar.
- Trap: `LatheGeometry` with a profile running top down turns its faces inside out; the `lathe()` helper reverses it.
- No GLB and nothing paid: Poly Haven has no emergency hammer, flame unit or stanchion that fits (the owned
  `rope_stanchion.glb` is plainer than the code one), and the file must stay one self contained HTML.
- The site copy (`assets/breakglass/index.html`, git ignored) was refreshed from `site/index.html` with the phone
  guard tag rewritten the way `build_galleries.py` does it. Not deployed.
- Mint file: `mint/build_mint.py` writes `mint/v2/index.html`, the same build with `phone-gpu.js` inlined so the token
  is one file. `mint/pin.py --piece mint/v2/index.html` pins it to `dist_v2/` and `pins_v2.json` (never run yet). The
  token then needs a new version added (`addTokenUris`) and pinned (`pinTokenUri`) by the token's owner.
- `PREVIEW.png` and `mint/break_glass.gif` still show the old hammer and units (small in frame). Shots and films:
  `UPGRADE ALL ROOMS 2026-10-28/shots/round2/breakglass_*`.
- Ready to pin (BREAK GLASS repo, later the same day): token 51 holds two versions (the October HTML, the film),
  neither pinned, owner MLow's main SuperRare wallet. `mint/token51_current.json` is version 0 as read on chain;
  `metadata_v2.template.json` copies it and changes only the file fields. The GIF and PREVIEW.png are remade from
  v2 at the old framing (GIF 12.37 MB, under the old 12.51). `python3 mint/pin.py --v2` pins; the token then needs
  `addTokenUris([51], [tokenURI])` and `pinTokenURI(51, 2)` from the owner wallet. The site share card
  (`assets/breakglass/poster.jpg`) and the home tile (`assets/home/now-breakglass.jpg`) are cut from the new still.
