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

## GLB swap, 2026-10-28 (free swaps only)

From the audit in `UPGRADE ALL ROOMS 2026-10-28/audit/galleries_other.md`.

- **Swapped:** the bodega cat (zone 10, `_build/island.html`, three spheres and two cones) is now `site/assets/glb/cat.glb`
  (723 KB, the Tripo cat from THE MARKS `work/glb_pass`, the same file UNLICENSED uses; one mesh, one JPEG texture, no
  glTF extensions, so the r128 GLTFLoader reads it as is). It faces +X natively, so it gets a quarter turn, and is fitted
  to the stand in's 0.7 m height on the counter. It loads in the frame loop when the visitor is within 90 m; the sphere
  cat is built first and is hidden only when the GLB lands, so a failed load leaves the old cat. Petting and breathing
  are unchanged (they act on the same group).
- **Left alone, as the brief says:** the Census Ferry and the calcified bear (paid, Tripo).
- **Checked:** `node _build/harness_island.js site/index.html` passes everything (soak 900 frames, 0 errors) with one
  local fix to the harness mock, which lacks `strokeRect` and fails at HEAD before this change; the fix was not committed.
  Headless Chrome stills before and after in `UPGRADE ALL ROOMS 2026-10-28/shots/island/`.
- **Not verified:** a real phone, and a real GPU (the stills are SwiftShader).

## The crowd, 2026-10-28 (on by default, `?crowd=old` for the cylinders)

Approved by MLow through the swap coordinator. The 43 people (40 residents carrying their NEW YORKER on a pole and the
3 bank agents) were cylinders and a sphere from `person()` in `_build/island.html`. Each now keeps its sphere head and
gets a body from our own Tripo cast, the method of ON LOCATION's crowd trial (`ON LOCATION 2026-10-10/_build/crowd_pass.py`
and `src/crowd.js`, commit 45a283b; read only there). Eight bodies (agent, tracksuit, writer, cabbie, workgirl, wiseguy,
actress, annieh) copied from that commit into `site/assets/glb/crowd_*_body.glb`: 1,800 tris, 256 px JPEG texture, about
90 KB each, 732 KB in all, no Draco and no glTF extensions, so the r128 GLTFLoader reads them as they are.

- Copies share their character's geometry and one material per character and shirt colour (30 percent tint). The neck
  meets the underside of the head (1.58 m), with plus or minus 3 percent jitter. They face +Z, as the walkers do.
- The cylinders stay built and are hidden only when a body lands, so a failed load leaves the old people. The bodies do
  not swing their legs (the hidden cylinders still do, harmlessly); the walkers glide, as in ON LOCATION.
- Measured, headless Chrome (SwiftShader), the main scene render at 1280x720 on the ring, old then new: close view
  530 draw calls and 2.83M tris, then 446 and 2.77M; wide view 553 and 3.14M, then 466 and 3.34M. The people are
  not on the same spot in the two runs, so the triangle numbers move with what is in view; draw calls fall by about 85.
- Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/island_{close,wide}_{old,new}.jpg`.
- **Not verified:** a real phone and a real GPU; the bodies were not watched walking in motion; some characters keep a
  few pale petal drips at the neck from the 45a283b cut (ON LOCATION has an uncommitted cleaner cut in progress, not
  taken; recopy the eight files once it is committed).
