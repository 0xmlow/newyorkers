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

## v6 nature, 2026-11-21 (later)

MLow: v5 still looked bad; "next level", better textures, realistic assets, flowers. All CC0 from Poly Haven, no paid
generation. Code in `_build/v6_nature.js`, inlined by `build.py` at `/*__V6_NATURE__*/`.

- **Scanned surfaces** (`site/assets/ph/*_c|n|r.webp`): coast_sand_01 (beach), leafy_grass (lawn), weathered_planks
  (boardwalk, decks), concrete_floor_02, white_stucco (white and bone blocks), hexagonal_concrete_paving (the plaza ring
  and paths, which now get world UVs). Sand and lawn break their repeat with a rotated second read and a slow brightness
  field, and are remapped (sand paler, lawn greener). Cloud shadows drift across both when the weather is SCATTERED.
  The season tints were lightened because the scan carries its own colour.
- **Plants and rocks** (`site/assets/ph/ph_*.glb`, 14 files): gazania, periwinkle, ursinia, dandelion, fern, shrub,
  bermuda tufts, dune grass, ice plant, two island trees, boulders, beach rocks, coastal rocks, conch shells. Lineups
  were split into single plants and decimated in headless Blender (scratch scripts `ph_get.py`, `ph_pass.py`,
  `ph_split.py`, not kept in the repo; the recipe is: fetch the 1k glTF from api.polyhaven.com with a User-Agent, join,
  separate loose parts, cluster by plan overlap, decimate per plant, base at origin, export GLB with AUTO images).
  Plants are sized by a target height per species, not by their scan.
- **Placement** (`natScatter`): 120 flower drifts of one or two species, 1,500 tufts, ferns and shrubs, real shrubs at
  the old icosahedron spots, 26 trees in open lawn (with a collision post each), dune grass and ice plant on the beach,
  shells at the tide line, boulders and coastal rocks half in the sea around the shore. A cell is free when it is not
  on a pad, in a wall or post, or on a path. Its own seeded random, so the island's shared sequence does not move.
- **Instancing and culling:** one InstancedMesh per species, variant, part and 44 m cell, culled per frame by distance
  (per species range) and frustum. Phones get 40 percent of the scatter and no plant shadows.
- **Wind:** one shader sway for every plant, rising with height squared and with the rain.
- **Palms rebuilt:** ringed, tapered, curved trunks with the palm_bark scan; nine to eleven pinnate fronds per palm
  from a painted canvas, drooping, swaying; coconuts. Same spots and heights as before (the random calls are kept).
- **Butterflies:** forty, working the flower drifts in sun.
- **Removed:** the jacaranda (24 m, 8 MB after decimation); the dark rooibos bush (read as black blots).
- **Cost:** headless Chrome M5 Pro 1440x810 gm beach rail, about 14 to 15 ms a frame (v5 about 11). 20 MB of new assets,
  loaded after Enter for the plants, before Enter for the textures.
- **Not verified:** a real phone, Safari, a non Apple GPU. The aerial still shows horizontal stripes across the island
  that were there in v4 and v5 too; not diagnosed.

## v7 architecture, 2026-11-21 (later still)

MLow: "buildings next". All CC0 Poly Haven again. Code in `_build/v7_arch.js`, inlined at `/*__V7_ARCH__*/`.

- **Weathering on every building material** (white, bone, concrete, corrugated iron, brick, limestone, bunker, sandstone,
  caps, plinths): grime in the first 1.5 m above the ground, rain streaks under edges on vertical faces only, a slow dirt
  field. One shader chunk, chained onto any existing `onBeforeCompile`.
- **Caps and plinths on every wall:** any unrotated wall box at least 2.3 m tall and 2.4 m long gets a concrete coping
  and (if it reaches the ground) a 55 cm plinth, merged into two meshes (two draws for the whole island).
- **The Meme Factory:** corrugated iron cladding (MAT.red), clerestory windows with steel frames and mullions on three
  sides that glow at night, a half raised roller shutter and drum under the lintel, downpipes and gutters, a 19 m brick
  chimney with steel bands that smokes (points, drifting with the wind), and a yard of barrels, crates, a generator,
  bags, AC units, a duct and wall lamps.
- **SURVIVE:** board formed concrete (concrete_wall_004), tyres, barrels, utility boxes.
- **The bank:** fluted columns (24 flutes), capitals and bases, planters on the steps.
- **The crane:** a lattice mast and jib of instanced struts replace the orange boxes; a cab.
- **The bodega:** a striped canvas awning with a valance, crates, gas bottles, a cafe table, a bin, an AC unit, a meter box.
- **Streets:** 16 lamps round the plaza ring and lamps, bins and hydrants down the four avenues; their bulbs follow the
  island's lamp level. Picnic tables and benches in the lawn. Lifebuoys on the pier; buoys riding the swell in the harbour.
- **The Colossus plinth** in white sandstone blocks.
- **Dropped** from v6: the bermuda tufts (their alpha rendered black at a distance).
- **Cost:** about 15 ms a frame on the gm beach rail (v6 about 14). 28 MB in `site/assets/ph` all told.
- **Not verified:** a phone, Safari, a non Apple GPU; interiors were not reworked; the lighthouse, the toll booths, the
  ferry and the Summer.jpg house were left as they were.

## v8 landmarks and water (2026-11-21)
- The aerial stripes are fixed. The post chain's render targets had a 16 bit depth buffer (three r128's default without a stencil), which from 200 m up is metres coarse, so the sea drew through the island. The composer now gets a target with `stencilBuffer: true`, which allocates 24 bit depth. The sea also has no geometry under the island any more.
- `_build/v8_land.js` (inlined at `/*__V8_LAND__*/`): `v8Loft` builds hulls from cross sections. The Census Ferry is a double ended harbour boat with two decks, wrapped window bands that light at night, railings, two wheelhouses, an oval funnel, a spinning radar and a flag. The sailboats are lofted sloops with a main and jib that billow. The traffic is bevelled cars with glass, wheels and lamps.
- Toll plaza: canopy on four columns, light panels, glass booths, a striped arm with a counterweight, rumble strips, Poly Haven road barriers and a wet floor sign. The lighthouse has a gallery, railing, mullions, a vent ball, a rod and a red beacon. SUMMER.JPG has striped canvas umbrellas with ribs, plus chairs. The harbour has two lateral sea markers and a tall ship at anchor (ship_pinnace, 16k tris, 2 MB).
- Prop loading in v7 now starts a microtask later so v8 can add to `PROP_FILES`; `landBuild()` runs after `archBuildProps()`.
- About 16 ms a frame on the gm beach rail (v7: 15).

## v9 detail (2026-11-21)
- `_build/v9_detail.js` (inlined at `/*__V9_DETAIL__*/`).
- The Colossus stands on a real sea rock: a noise-displaced icosahedron with seaside_rock projected on three axes, darker and glossier at the waterline, and 26 boulders round it. The 2030 stepping stones are rough cut in rock_boulder_dry.
- The TAP basin is sandstone with a concrete coping. The brain, wagmi and lighthouse platforms are poured concrete instead of the old lumpy white stone (the Arsham plinths keep it on purpose).
- Every card has a framer's back: a black frame, a kraft paper dust cover, a label and a hanging wire (`MAT.frame`, set before `buildCards()`).
- The TAP runs water: a scrolling stream, a rippled pool, a splash of droplets and a foam ring.
- The factory has steel roof trusses, 15 Poly Haven hanging lamps and painted safety lines.
- three's polyhedra are non-indexed, so `v9Smooth` welds normals by position or the rock reads faceted.

## v10 the bodega (2026-11-21)
- `_build/v10_interiors.js` (inlined at `/*__V10_INTERIORS__*/`) turns the 6529 Bodega into a New York bodega:
  - a worn checker floor and a drop ceiling with six flickering fluorescent panels;
  - a lit three-door glass cooler with about 400 bottles;
  - a two-sided shelving aisle of boxes and cans;
  - a laminate counter with a register, the lotto ticket rack, a tip jar and candy, plus shelves behind it;
  - an ATM and a door mat.
- No new downloads: every texture is drawn on a canvas.
- Fix: the v8 ferry and sloop vertex colours are now converted to linear, so the ferry reads orange, not tan.

## v11 the N3W house type on every sign (2026-11-21)
- MLow's own type from `N3W CUSTOM LOGOS 2026-11-18`: titles in N3W REDACTED (Anton; the first and last letter of each word struck by the MLOW bar, the letters between slit at their own clean height from `best_y` in `n3w_type.py`, copied as the `N3W_Y` table; every O and @ is the blue evil eye). Second lines in Archivo Expanded (width 125), screens and numbers in JetBrains Mono, handwriting (gm, WELCOME, Cards on the Bridge) in Permanent Marker. NEW YORKERS is always written N3W YORKERS.
- `site/fonts/` gained Anton, Archivo Expanded, JetBrains Mono and Permanent Marker as subset woff2. `fonts.css` used to point at `fonts/fonts/...`, so before v11 none of the web fonts loaded and every sign fell back to Helvetica and Menlo.
- `window.__SIGNS` lists every sign texture (the sign contact sheet script uses it).

## v12 the island moves (2026-11-21), `_build/v12_life.js`
- Pigeons on the beach, the Census Walk and by the toll: they peck, scatter when you walk at them, circle and glide back. Gulls over the harbour. Five Con Ed steam stacks on the ring road. A jet with a contrail, a harbour helicopter, fireflies after dark, newspapers blowing round the ring road. The island's own FW fireworks now also go off now and then after dark, with a soft sprite.

## v13 things to play with (2026-11-21), `_build/v13_eggs.js`
- A yellow cab with an N3W YORKERS topper circles the ring road; type TAXI and it stops for you, E to ride a lap. PIZZA (the Pizza Rat), WHALE (a breach off the pier), DISCO (a mirror ball and beams over the Floor, with a kick drum), MOON, SHRINK, GROW, FIREWORKS, N3W, SNOW, SUS, BODEGA, 420.
- A sidewalk clock on the beach on New York time; it goes off at 4:20. A pay phone that rings and talks (speechSynthesis). A hot dog cart (N3W DOGS) that feeds the pigeons. Pet the bodega cat.
- `secret(key, fn, words)` registers a secret and counts the first find: SECRETS n OF 39, kept in localStorage.
- Player hooks: `window.__GRAV`, `__EYE`, `__SPD` (each mode resets only what it set).

## v14 secrets (2026-11-21), `_build/v14_secrets.js`
- The golden slice hunt: nine slices (top of the Floor, the bodega, the lighthouse roof, the 2030 pathway, under the wheel, Summer.jpg, BUIDL, behind the Great Wave, the toll). All nine set off the harbour and raise a SLICE KING plaque. SLICES gives a clue. Progress in localStorage.
- X marks the spot on GM Beach (stand on it 4.2 seconds). Three messages in bottles at the waterline. A banner plane towing N3W YORKERS · BY MLOW. The tall ship glows green at 3 a.m. New York time. HELP gives hints.

## v15 polish (2026-11-21)
- The sky dome no longer streaks overhead: the skirt now closes to a point and blurs the panorama sideways as it climbs (the night photograph's top rows were stretched stars), with procedural stars at night. The flat cap disc is off.
- The enter card mentions the slices, the cab, the phone and HELP.
