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

Approved by MLow through the swap coordinator, then corrected the same day: no superimposed heads. The 43 people (40
residents carrying their NEW YORKER on a pole and the 3 bank agents) were cylinders and a sphere from `person()` in
`_build/island.html`. Each is now a WHOLE character from our own Tripo cast, with its own sculpted eye flower head; the
sphere head is hidden with the cylinders (and the agents' box glasses with them).

- Source: the cast GLBs in `NEW YORKERS SITE/assets/movies/assets/glb` (read only), seven that stand on their own feet:
  writer, cabbie, workgirl, wiseguy, actress, annieh, editor. agent, tracksuit, broker, usher and rosemary are cut off at
  the thigh or knee and were left out. The bank agents are all wiseguy (dark suit).
- Decimated in Blender from about 30,000 to 3,000 tris each, texture 512 px JPEG, no Draco and no glTF extensions, so
  the r128 GLTFLoader reads them as they are: `site/assets/glb/cast_<name>.glb`, 150 to 175 KB each, 1.13 MB in all.
  The pass is a 40 line Blender script (join, decimate, shrink the texture, feet at the origin) that was run from the
  session scratchpad and not kept; prop_pass.py would do the same job.
- The cast face +X, so each body gets a quarter turn. 1.85 m tall with 3 percent jitter. Copies share their character's
  geometry and one material per character and shirt colour (25 percent tint). The old parts stay built and are hidden only
  once a body lands, so a failed load leaves the old people. The bodies do not swing their legs.
- Measured, headless Chrome (SwiftShader), main scene render at 1280x720, the same camera spot (28.28, -28.28, yaw -2.356)
  with the same people staged in the same places, old then new: close 392 draw calls, 378 new; wide 484, 414 new. The
  triangle totals (3.3M to 3.9M) are dominated by the meme sculptures and moved between runs as they streamed, so
  they say nothing here; the people themselves go from about 400 tris each to 3,000, about 129k for all 43.
- Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/island_{close,wide}_{old,new}.jpg`.
- **Not verified:** a real phone and a real GPU; the crowd was not watched walking in motion (the stills stage the people
  facing the camera).

## The crowd walks, 2026-10-28 (later; `?rig=off` for the static cast, `?crowd=old` for the cylinders)

MLow asked for the cast rigged, bodies and heads; `UPGRADE ALL ROOMS 2026-10-28/rig` made them (RIG_TRIAL.md). The
same seven characters are copied into `site/assets/glb/rig/` (3,000 tri and 800 tri `_lite` files, skinned, no Draco,
2.4 MB). `site/vendor/rigcrowd.js` clones them for r128 (no SkeletonUtils is vendored, so it carries the same parallel
traverse rebind) and ranks the 40 residents every 0.3 s: the nearest 8 (4 on a touch screen) get the full rig, the next
12 (4) the lite rig, the rest stay the static copies. A rigged resident walks at the speed its rig recorded (0.46 to
0.78 m/s, slower than the old 1.0 to 1.7, so the planted foot stays put), stands in idle when it pauses or sleeps (gn),
and inside six metres turns its head to you, its body only past 60 degrees. The shirt tint is kept. The three bank
agents stay static: they hurry at 1.6 m/s, twice the walk the rig was made for.

- Measured, headless Chrome on this Mac (Apple GPU), 40 residents staged around (-9.5, -33.2), 60 frames, static then
  rigged: desktop 767 to 748 draw calls, 6.49M to 6.28M tris, frame CPU 9.8 to 8.3 ms (noise), mixers 0.1 ms for 20;
  phone emulation (390 x 844, touch) 438 to 424 calls, 5.11M to 5.10M tris, 2.4 to 2.6 ms.
- Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/island_rig.mp4`.
- `_build/harness_island.js` stops at `c.strokeRect is not a function` (its canvas stub lacks strokeRect) on the
  committed page too, before and after this change, so it was not a check here. Not seen on a real phone.

## v5 the finish, 2026-11-21

A look pass, all in `_build/island.html` (search `v5`). No new assets beyond two vendored three.js r128 files.

- **The sea is a shader.** Gerstner swells on the GPU (three long ones move the geometry, three short ones light it per
  pixel), a second scrolling normal layer, turquoise shallows over the island's shelf, a breathing waterline and broken
  lines of white water rolling onto the beach, light through the crests toward the sun. Still a MeshStandardMaterial
  (`onBeforeCompile`), so sky reflection, shadows, fog, weather (`uChop` grows with rain) and time of day work through
  it. The geometry is a polar grid, 1.25 m rings at the shore, coarse far out. The old CPU wave loop and foam ring are gone.
- **Wet sand:** the last ten metres of beach darken and turn glossy. The sand is tinted warm (0xeadcc2): it rendered
  paper white in the sun.
- **Relief on the white blocks:** MAT.white and MAT.bone take the limestone normal map in world UVs, colour unchanged.
- **Ambient occlusion** (desktop, `?ao=0` to compare): half resolution depth pass, an alchemy style estimate, a depth
  aware blur, multiplied in by the grade. Additive light, the sky, skinned bodies, shader materials and anything with a
  missing attribute sit out of the depth pass; after three render errors it switches itself off.
- **Antialiasing** (desktop, `?aa=0` to compare): SMAA at the end of the chain (`site/vendor/SMAAPass.js`,
  `SMAAShader.js`, from three r128). The composer had been throwing the canvas's antialiasing away since v4. True 4x
  multisampling of the scene draw is behind `?msaa=1`: in headless Chrome on an M5 Pro it cost about eight ms a frame.
- **Grade:** cool shadows and warm highlights taken from the sky and sun of the minute, a soft S curve in gamma space,
  a trace of lens fringing at the corners, then the old vignette and grain.
- **Cost:** headless Chrome, M5 Pro, 1440x810, gm beach rail, mean of 20 frames: v4 10.9 and 11.9 ms, v5 11.1 and
  11.7 ms. The GPU waves pay for the occlusion. Phones get the sea, the sand and the grade; no AO, no SMAA.
- **Not verified:** a real phone, a non Apple GPU, Safari, and the photoreal film and hype cuts (not re-rendered).
- Harness mock gained `strokeRect` (it failed at HEAD without it).
