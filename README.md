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

## v16 street life (2026-11-21), `_build/v16_street.js`
- A sax busker on the path to the toll (a slow blues in F that swells as you walk up; E tips him), a breakdance circle on GM Beach with a boombox, a crowd and a headspin (E cheers), a silver living statue north of the Floor that moves only when you look away. City sound under the island's mute: ring road traffic, horns, gulls.

## v17 neon night, `_build/v17_neon.js`
- Neon panels (canvas tubes, additive, untonemapped, so the bloom pass does it): N3W YORKERS on the island side of the toll canopy, gm on GM Beach, OPEN (flickers) and COLD JPGs on the bodega, MEME ISLAND at the pier end. Festoon lights across GM Beach, two searchlights behind the Floor. No scene lights added.

## v18 weather, `_build/v18_weather.js`
- Rain brings lightning (forked bolt, flash, thunder late by distance), puddles (placed by raycast on the paving) with drop rings, and umbrellas on the residents. A rainbow after rain in daylight. A snowman with an evil eye button when it snows. A foghorn in harbour fog. STORM, RAINBOW, SNOWMAN.

## v19 games, `_build/v19_games.js`
- The N3W COURT at (-66, 24), the emptiest clearing on the island: E picks up, E shoots, odds by distance, three in a row is on fire; grass and flowers are cleared off it once the nature layer loads. The N3W LINE subway entrance at (26, 26): PLEASE SWIPE AGAIN twice, then the train drops you somewhere. CATCH: thirty seconds of falling JPGs.

## v20 the finale, `_build/v20_finale.js`
- 5,200 sparks rise in four rockets and fly into N3W YORKERS in the house type over the Colossus, hold, shimmer and fall. Midnight New York time, the ninth golden slice, or FINALE / SHOW. Targets are sampled evenly from the drawn type (sampling the first N rows cut the bottom off the letters); x is negated because the viewer on the pier faces +z.
- About 15 ms a frame on the beach rail at 1440x810 (v15 was 10, v10 was 15 to 17).

## v21 the harbour, `_build/v21_harbour.js`
- A jet ski west of the pier you drive: E on, W throttle, S brake, A D or the mouse to steer, E to tie up. Spray, wake, swell, engine note; kept off the beach, the pier and the Colossus rock. Dolphins leap in the harbour and beside you when you ride. `window.__DRIVE` skips the walking step; `window.__FRAMES` is the frame hook from v21 on.

## v22 street food, `_build/v22_food.js`
- N3W HALAL (smoking grill) and N3W COFFEE (blue Greek key cup) parked on the ring road; an ice cream truck with its own jingle on the inner lane that pulls over on ICECREAM. Purchases are held in hand for a while.

## v23 the sky, `_build/v23_sky.js`
- N3W AIR TOURS helipad at (-72, -39): E for a 42 second flight round the island and the Colossus. Kites over GM Beach, two striped hot air balloons over the harbour.

## v24 animals, `_build/v24_animals.js`
- A fetch dog on GM Beach (E throws the stick), two loose dogs that chase pigeons, seven squirrels, and an orange stray on PSPSPS or KITTY.

## v25 the parade, `_build/v25_parade.js`
- All November (and on PARADE): a four storey parade balloon of an eye flower New Yorker in a blue suit and orange tie, waving, with an N3W YORKERS sash, held by eight handlers on ropes, circling the ring road. Confetti on PARADE, a toast on Thanksgiving.
- About 16 to 17 ms a frame on the beach rail at 1440x810.

## v26 to v35 (2026-11-22), `_build/v26.js` to `_build/v35.js` (build.py inlines any that exist)
- v26 THE N3W EL: a viaduct ringing the harbour at r 165, 12 m up, over the pier; a four car train with lit windows; E at the pier stair rides a lap.
- v27 N3W SQUARE at (81, 10): twelve screens cutting between cards (half of them the new fifty), two LED tickers with live island news, a ball that drops on NEWYEAR or at 23:59:50 on 31 December.
- v28 night sky: shooting stars (WISH), satellites, METEORS, STARS draws an evil eye constellation.
- v29 IMPERMANENT VISION (apply-mlow-impermanent-vision): a world space contour field chained into the concrete, sandstone, bunker, cap and plinth materials, crowding toward the thresholds (navy underneath, every fifth line hot pink; whisper by day, electric at night); physical paint drips; THE WITNESS, MLow's painted Open Eye Flower (from the skill's motif sheet, site/assets/iv_flower.webp) on a 40 m stem in the north harbour, watching and blinking (BLINK, and when the El passes); THE CUT at (-42, -69), a doorway onto a painted void that drops you on the lighthouse roof.
- v30 photoreal: grime and roughness breakup on the flat painted materials, 4096 sun shadows on desktops, aerial perspective by day (window.__FOGN / __FOGF), a calmer grade.
- v31 FRESH OFF THE PRESS: `fetch_new_memes.py` pulls The Memes minted after the 527 snapshot from the 6529 API (528 to 577 on 2026-11-22) into `memes4.jpg` (atlas slot 5) and `data.json` fresh. They hang on the factory front wall, a press reprints one every few seconds, a split flap ARRIVALS board over the pier, FRESH. Rerun the script and the build to take in later mints (the racks hold 25 a side; past 50 the layout needs a third rack).
- v32 airdropped crates from the blimp with a new card inside (collect all 50), new cards as ads on the El, type 528 to 577 to open a card.
- v33 N3W RADIO (M), a bucket drummer at the subway, PHOTO MODE (O, K saves a framed PNG). M, O, K and J act only when pressed alone, so typed words do not trigger them.
- v34 SECRETS.EXE (J, Start menu, BOOK): 75 secrets with hints and tallies; phone buttons TYPE, RADIO, PHOTO, BOOK.
- v35: the island says 577 cards, the help line lists the new keys, the site's island page describes it as it is.
- About 15 to 16 ms a frame on the beach rail at 1440x810.

## v36 to v45 (2026-11-22), `_build/v36.js` to `_build/v45.js`
- v36 Impermanent Vision pass two: paint pools on the paths, THE OBSERVER on the north rocks (0.5, -137.5), veins in the sky dome after dark.
- v37 god rays: a screen space pass after bloom, desktops only, strongest when the sun is low and you face it.
- v38 LIVE MINT: a vitrine by the factory (-3.4, -37.5) polls the 6529 API every 10 minutes; a new Meme shows there, on a N3W Square screen and on the ARRIVALS board without a rebuild.
- v39 Top of the Square: an elevator up the N3W Square tower (81, 10) to a deck with two coin op viewers.
- v40 chess tables at (74, -21) with hustlers and a pigeon lady.
- v41 the back room: knock on the middle cooler in the bodega and type fren; a speakeasy 9 m under the island with a jukebox (switches the radio to jazz), a bar and a private wall of the 15 newest cards. `window.__UNDER` lets floorAt stand you below the terrain.
- v42 the drone show: 600 drones fly the evil eye, N3W YORKERS, gm, a pizza slice and an Open Eye Flower over the harbour at the top of every hour after dark, or type drones.
- v43 sea life: crabs on GM Beach that dig in when you come close, fish that jump with a ring where they land, jellyfish round the pier that glow after dark, starfish.
- v44 smooth on every screen: a quality governor steps down sharpness, then AO and god rays, then live shadows when frames run late and back up when there is room. `?lite=1` and `?hq=1`, or type LITE and HQ. Reduced motion turns off the head bob and drone twinkle. The welcome counts secrets live.
- v45 the new tour: nine stops for everything since v26 (N3W Square, the top deck, chess, the Press, THE CUT, the Observer, the Witness, the El, the back room). A tour stop can carry `pre()`.

## v46 to v55 (2026-11-22), `_build/v46.js` to `_build/v55.js`
- v46 the murmuration: a pigeon flock (380 birds, 160 on phones, one InstancedMesh) wheels over the island at dawn and dusk; CLAP or FLOCK any time.
- v47 the handball wall at (-78, -21): E picks up a can, hold the mouse or a finger to spray where you look, R colour (cobalt, cyan, hot pink, bone, copper, ink), E done. Heavy paint drips. Saved in localStorage (`meme-island-wall`). Tags redraw on the `n3wfonts` event.
- v48 three card monte at (48, -9): an honest shuffle, look at a card and press E. Win five TDH; three in a row and the lookout calls FIVE OH and they leave for a minute.
- v49 the open hydrant at (75, 30): E or HYDRANT, a water fan, a puddle, kids, a small rainbow with the sun behind you, SOAKED.
- v50 the map and passport: N alone, MAP, the Start menu or the phone MAP button. One orthographic frame from above (sky dome hidden, fog off), click a place to go there, places you walk to get stamped (`meme-island-passport`).
- v51 THE WATCHERS at (-27, -66): nineteen Open Eye Flowers in a navy contour pool that follow you while you are not looking and shut when you do; turn fast and catch one (that also starts a short MELT).
- v52 MELT (MELT, BRAINMELT): a last screen pass, liquid warp, drips, colour split, navy darks, cyan and pink contour lines; disabled when not running.
- v53 harbour traffic: a container ship in the south channel (z 320) and a tug with a gravel barge in the west channel (x -300), running lights at night, horns as they pass; HORN.
- v54 SECRETS.EXE names and hints for everything since v36. v55 five tour stops (the wall, monte, the hydrant, the Watchers, the south channel).

## v56 to v65 (2026-11-22)
- v56 THE STEAM at (-20, 30): two striped N3W EDISON stacks pouring steam and two manholes that breathe; grey by day, lamp lit at night; walk through it (STEAM, CONEDISON).
- v57 N3W BIKE: a dock of six evil eye blue bikes beside the south path at (-5, 76). E rides (2.15x walking, bars and basket in view, B rings the bell), E at the dock returns it; BIKE finds one anywhere.
- v58 THE SKATE SPOT at (-74, 86): ledge, kicker, rail, three skaters throwing ollies, flips, shove its, boardslides and the odd bail; KICKFLIP calls a tre flip.
- v59 THE GRATE on the ring path at (30, -28): a train passes below about once a minute, light strobes up through the bars, litter flies, and standing on it lifts you (GRATE calls a train).
- v60 THE HOLE where the west path meets the ring: a chalk anamorphosis. The shaft is a small scene rendered from the painted footprints and projected back onto the paving, exact from there and a stain from anywhere else (Impermanent Vision: contour walls, drips, an Open Eye Flower and one small figure at the bottom).
- v61 THE DOG WALKER: six dogs on sagging leashes doing laps of the ring path; E and they pile round you.
- v62 HARBOUR FOG: on one morning in three a fog bank sits on the water until the sun is up, with a two tone foghorn from the lighthouse; FOG rolls it in.
- v63 THE BUBBLE MAN at (26, 50): giant thin film bubbles that wobble and drift; walk into or click them to pop, ten counts.
- v64 SECRETS.EXE names for the new secrets. v65 five tour stops (steam, skate spot, grate, the hole from the footprints then the side, bubbles).
- Fix: colour instanced meshes (the v53 container boxes) are left out of the ambient occlusion depth pass; r128 shared the override program between instanced meshes with and without colour and AO switched itself off.

## v66 to v85 (2026-11-22)
- v66 THE WATER TOWER at (-64, -72): a brick building with a cedar tank on legs; E climbs to the roof (WATERTOWER). Adds memeMesh(n, h) for cutting single Meme cards out of the atlas.
- v67 THE SIDEWALK SHED at (-8, -88): sixteen metres of scaffold shed, bulbs that never go off, a plywood fence pasted with Meme posters; E pastes another.
- v68 THE RINK at (-78, 35): ice with real momentum, boards, string lights, five skaters (ICESKATE).
- v69 THE MARKET at (52, 24): five glass kiosks (cider, eye baubles, N3W prints, knits, churros) under string lights.
- v70 SHOWTIME where the east path meets the ring: three dancers, a boombox beat, flips, a headspin; E tips (SHOWTIME).
- v71 THE GLOWING SEA: plankton in the surf line and the ship wakes after dark (PLANKTON).
- v72 THE FLOWER HUNT: twelve Open Eye Flowers painted on the ground round the island; FLOWERS points to the nearest.
- v73 THE N3W ORACLE at (-19, 9): a fortune cabinet with a flower that wakes for one TDH; thirty fortunes.
- v74 THE CANAL STREET TABLE at (-16, -28): bootlegs; haggle three times.
- v75 THE DELIVERY RIDERS: four e-bikes lapping the ring road, ringing as they pass.
- v76 THE STREET SWEEPER: after ten at night, brushes, mist and a wet stripe that dries (SWEEPER).
- v77 THE IMPERMANENT WALL at (58, -80): a mural that paints itself from six in the morning to nine at night from the date, whitewashed every morning.
- v78 THE MEME CONSTELLATIONS: THE EYE, THE SLICE, THE APPLE, THE PIGEON; look at one to draw it (STARGAZE).
- v79 NUTS 4 N3W at (86, -12): the candied nut cart, kettle steam through the v56 plume system.
- v80 THE LINE at (-62, 80): N3W DROP, a velvet rope and a queue; join it and it is sold out at the door.
- v81 THE CAR ALARM: two parked cars on the ring road shoulder; brush one.
- v82 ISLANDHENGE: the real sun sets due west down the west path around each equinox and the path fills with gold (HENGE jumps there).
- v83 THE GULLS: eight gulls on pier bollards that fly off and come back.
- v84 SECRETS.EXE names. v85 six tour stops.

## v86 to v105 (2026-11-23)
- v86 THE PIGEON COOP on the water tower roof; E lets twenty birds out (COOP).
- v87 THE BUS: the N3W crosstown laps the ring road and stops at two shelters; E rides it across (BUS).
- v88 THE DOORMAN: an awning, a carpet and a doorman at the water tower building who greets you by the hour.
- v89 THE TOURISTS: a guided group walks the ring path landmark to landmark with flashing cameras; get in the shot.
- v90 FALL: leaf piles and drifting leaves on the ring path from September to early December; run through a pile (LEAVES).
- v91 DOMINOES at (-48, 28): four men slamming tiles; E watches a hand.
- v92 THE WALK UP at (78, -56): a brick walk up with a stoop; sitting runs the day 200 times faster.
- v93 THE FIRE ESCAPE: three landings, a drop ladder and a gooseneck to the roof, E up and down.
- v94 THE ROOF AND THE SOPRANO: a rooftop party after dark and an opera neighbour in the third floor window, seven to eleven.
- v95 THE NEWSSTAND at (40, 32): Meme covers and scratch-offs (one jackpot).
- v96 THE LIVING STATUE at (-88, 0): silver, still, shifts when you look away, bows for a tip.
- v97 THE CROSSWALK where the south path meets the road: walk, countdown, hand; riders and the bus stop for it.
- v98 THE SANDCASTLE at (44, 122): six stages, gone by morning.
- v99 GONE FISHING: two fishermen on the pier end; cast your own line.
- v100 THE THRESHOLD across the south path at (0, 52): an Impermanent Vision doorway; walking through starts MELT.
- v101 SUNRISE YOGA at (-52, 120) from five to nine (YOGA).
- v102 THE BALLOON MAN at (-86, -24): eye balloons that follow you until you let go (LETGO).
- v103 THE OUTLINE at (-40, -78): an empty lot where a tenement comes back as glowing lines after dark.
- v104 SECRETS.EXE names. v105 six tour stops.
- Fix: v72's huntFrame shadowed v14's huntFrame (the slice hunt) since build 20261123-041455; renamed flowerHuntFrame.

## v106 to v125 (2026-11-23): real animals, real cars, a lighting rebake
- CC0 assets: assets/glb/cc0 holds Quaternius models (Public Domain, from poly.pizza, see LICENSE.txt there): shiba, husky, wolf, deer, stag, horse (Animated Animal Pack), pigeon, rat, taxi, car_b.
- v106 REAL ANIMALS: CC0.make / CC0.dress (RigCrowd.cloneSkinned, per clone mixer, walk/run/idle/eat chosen from speed). The fetch dog, the pigeon chasing dogs and the dog walker's six are rigged dogs now.
- v107 REAL PIGEONS: the nearest 18 (8 on phones) of v12's flock are rigged pigeons, the instanced ones are hidden where a rigged one stands in.
- v108 REAL RATS: the Pizza Rat is the rigged rat (with his slice); rats run the curb of the ring road at night.
- v109 REAL CARS: the N3W cab and the two parked cars are the CC0 taxi and car (wheels re-centred and spun on their axles); six cars of traffic on the ring road, keeping gaps, slowing behind the bus and the cab, stopping for the crosswalk.
- v110 HORSES: a carriage horse with a hansom cab laps the ring path (E for a ride); a mounted officer patrols GM BEACH.
- v111 SHARPER SHADOWS: the shadow box sits 20 m ahead of the view and is 84 m across at 4096 px on desktop; mid size meshes now cast.
- v112 LAMPLIGHT: light pools under the 36 street lamps and the new pieces at night, with halos.
- v113 THE LIGHT PROBE REBAKE: the sun is drawn into the environment probe and the probe rebakes as the sun moves; golden and blue hour grade tweaks (window.__GRADE hook in renderFrame).
- v114 CONTACT SHADOWS: soft instanced shadows under every person, animal and car within 60 m.
- v115 THE DOG RUN at (-86, 13). v116 THE COYOTE (after midnight) AND THE DEER (dawn, west beach). v117 CHRISTMAS TREES FOR SALE (Nov 20 to Dec 24) at (65, 63).
- v118 THE HOLIDAY WINDOWS (dancing rigged pigeons in the walk up's ground floor). v119 PROJECTION MAPPING on the walk up's south wall at night.
- v120 THE STATEN ISLAND FERRY. v121 TRAFFIC LIGHTS at the crosswalk. v122 EVERYBODY DANCE (DANCE). v123 WET STREETS (asphalt and paving go dark and glossy in rain, dry slowly).
- v124 SECRETS.EXE names. v125 six tour stops.
- Fixes: ROAD_R is 100 (the road ring is 96 to 104), so the bus, riders, crosswalk and shelters sit on the real road; the walk up moved from (78, -56), where it overlapped the road and the neon bus prop, to (-64, -54).
- Duplicates resolved (2026-11-23): v12's five Con Ed stacks (they stood in the ring road's outer lane) and its paper W gulls, and v16's beach breakdance circle and living statue, are retired in place (early returns, commented). v56 THE STEAM, v70 SHOWTIME and v96 THE LIVING STATUE stay; the statue moved to v16's spot (4.8, 30) and carries the 'statue' secret, Showtime carries 'cheer', and v83 gained twelve circling harbour gulls built from its own bird.

## v126 to v145 (2026-11-23): the neighbours
- v126 LADDER 420: a ladder truck laps the ring road every five minutes or so with siren (Doppler shifted) and lights; all traffic and the cab pull to the curb and stop. SIREN calls it.
- v127 NEW YORK'S STRONGEST: bag piles at the curb from 7 pm; the sanitation truck runs 5 to 8 am as a real car in TRAF (traffic queues behind it), crew sling the bags, the packer groans. GARBAGE sends it.
- v128 THE POND at (18.5, -1): mallards, a mother with five ducklings who follows you round the rim, a heron that strikes and flies off when you get close, lily pads, reeds, peas (E).
- v129 THE PIGEON MAN at (-52, -27): fourteen rigged pigeons eating his seed, lifting off together; stand still beside him and one lands on your shoulder.
- v130 THE MURMURATION: 1,800 starlings (600 on phones) over the south west harbour at sunset, October to March. MURMURATION calls them. (Bats were the first idea; they hibernate in November.)
- v131 SPIN CYCLE 420 at (-86, -4): laundromat with washers on their own cycles, the attendant, a cat on the dryers, strip light at night; E does a load.
- v132 SKYTYPING: seven planes type a dot matrix word in the sky on clear days ten to four. SKYWRITER orders one.
- v133 THE LIFEGUARD CHAIR at (43, 111): flags by weather, guard only in season (Memorial Day to Labor Day), buoy line, E climbs.
- v134 THE BUNKER RUN: fish boils off the beach with gulls plunging in, April to November. v135 THE KAYAKERS: four kayaks east of the pier on fair days.
- v136 PAPER PLANES: F throws a folded Meme card on a small flight model. v137 REAR WINDOW: lit walk up windows show eight lives at night.
- v138 THE CAROUSEL at (-36, 30): eight CC0 horses on poles, band organ, E to ride. v139 DOUBLE DUTCH at (-28, -55): step in and jump the ropes.
- v140 BREATH in the cold (people and you). v141 RAIN ON THE LENS (refracting drops, ?lens=0). v142 SUN SHAFTS: depth aware god rays from the AO depth pass; supersedes v37's brightness only rays, which stay as the fallback with ?ao=0.
- v143 THE BELL TOWER at (55, 33): Westminster quarters and the hour, synthesised bells, climbable belfry. BELLS rings it.
- v144 SECRETS.EXE for 16 new secrets. v145 six tour stops.
- Help line now ends "F paper plane". Note: v52 MELT fires when a camera catches a Watcher, so headless shots should hold __MELT off.

## v146 to v165 (2026-11-23): the beach and the block
- v146 LENS FLARE: starburst, streak and ghosts on the sun, occluded by the AO depth under the sun's disc (replaces v37's ghost). ?flare=0.
- v147 DUST IN THE LIGHT: motes around you that light up between you and a low sun. v163 THE GLITTER PATH: the sun's (and moon's) road of glints on the water, following your eye.
- v148 FOOTPRINTS in the sand (and in settled snow anywhere); the waterline wipes them. v149 SPLASH: your steps splash in the rain.
- v150 SANDERLINGS chase the swash east of the pier (Aug to May); shoreZ(x) in v150 is the shared waterline helper.
- v151 THE DETECTORIST on the west beach. v152 SEA GLASS: 24 pieces a day on the wet sand, one cobalt.
- v153 THE TELESCOPE at (-52, -64): E shows the moon at its real phase, Saturn when it is down, the sun through a filter by day.
- v154 MORNING TAI CHI at (-72, 24), 7 to 9:30, on the N3W COURT. v155 SHOE SHINE at (36, 54), weekdays. v156 BOCCE at (9, -84), afternoons, real rolling physics (a payphone was planned, but v13 already has one).
- v157 WASH DAY: clotheslines from the walk up's east wall to a pole, cloth that billows; a sock blows off now and then.
- v158 THE RACCOON at the garbage piles, 11 pm to 4 am. v159 THE MAIL CARRIER on the ring path, six blue boxes. v160 THE KETTLE: a sidewalk Santa by the tree sellers, Nov 20 to Dec 24.
- v161 THE GULL takes food out of your hand on the beach or pier. v162 POEMS WHILE YOU WAIT at (52, 16), 11 to 8: a typed poem about the moment.
- v164 SECRETS.EXE for 13 new secrets. v165 five tour stops.

## v166 to v169 (2026-11-23): THE LOOK, first pass
MLow asked for huge, premium upgrades rather than more features. Diagnosis from eight hero frames: flat light (the light probe painted from the bright panorama lit everything from below too), a milky peach haze, pool coloured water with white rings round the whole island, a night that looked like blue daytime.
- v166 LIGHT: probe ground half darkened, stronger sun and weaker fill, haze pushed far out and tinted by the sky, S curve grade with cool shadows and warm highlights, a real night. All numbers in window.__LOOK; ?look=0 turns the whole pass off.
- v167 THE HARBOUR: slate and bottle green water, white water only on the south beach, a clearer, more mirror like surface.
- v168 REFLECTIONS: screen space reflections on open water off the AO depth (water is the flat y=0 plane in that pass); ?ssr=0.
- v169 SKY DEPTH: 48 lit noise cumulus between 400 and 900 m in front of the painted panorama, coverage by weather; ?clouds=0.
- v140's own breath puff removed (a white smudge in first person).

## v170 to v171 (2026-11-23): THE LOOK, second pass
- v170 THE LAWN: up to 90,000 grass blades in a 46 m square that travels with the player (each blade fixed to its world spot), lit and shadowed by the scene's sun, leaning in the wind, fading at the edge. A top-down render of the island (grass white, everything else black, surface height in G and B) tells the blades where lawn is, so nothing grows through paths or props; it is retaken at 6, 25 and 70 seconds as props load. Desktop only, ?grass=0.
- v171 LAMPLIGHT ON THE GROUND: the walkable materials (grass, sand, paving, concrete, road, stone, lime, pier wood) compute the light of up to 48 lamps per pixel, so the ground's own texture lights up warm under each lamp; v112's flat discs dimmed to a faint glow.
- v146 flare: the two ring ghosts toned down (they read as a circle drawn on the screen).

## v172 (2026-11-23): THE LOOK, third pass (buildings and props)
- v172 WEATHERING: every material used on a mesh over 2 m (people and animals excluded, ground and metals skipped) gets world space mottling in colour and roughness, grime rising from the ground, rain streaks on tall walls and a faint sun bleach on tops; 479 materials. ?weather=0.
- Window glow by day: warm emissive on dark untextured surfaces (market stall fronts, windows) now follows the lamps (12% by day), so those faces take sunlight and shadow instead of glowing flat.
- Finding: the remaining cheapness on buildings is geometry (flat boxes, painted windows, no trim), which needs per building rebuilds, not a global pass.

## v173 (2026-11-23): THE LOOK, fourth pass (buildings rebuilt)
The buildings were boxes with dark rectangles on them. v173 builds them out of real pieces: every window in a deep
reveal with a stone lintel, a projecting sill and a meeting rail, some with a window AC unit; stone belt courses and a
water table plinth; a full cornice (frieze, dentils, brackets, crown) on the walk up, which also gets windows on its
sides and back and a black fire escape with stairs and a drop ladder; windows on every side of the water tower
building; cornices on the bodega, the laundromat and the N3W DROP shop; painted tongue and groove boards on the
market kiosk backs. About 1,270 pieces in a dozen instanced draw calls. ?facades=0 turns it off.

## v174 (2026-11-23): THE LOOK, fifth pass (the big three)
The bank gets a rusticated base, tall windows in moulded surrounds with hoods, keystones and bronze grids, a full
entablature with dentils and modillions, fluted columns, a raking cornice with the Open Eye in the pediment and a
bronze transom over the door. N3W SQUARE gets a glass curtain wall above the screens (offices lit at night), a
parapet, and a bronze storefront with a lit marquee at its foot. The factory gets a brick base with a coping, steel
I beam pilasters, a steel coping and a faded painted sign on its back wall. ?facades=0 turns it off with v173.

## v175 (2026-11-23): THE LOOK, sixth pass (pedestal, SURVIVE, bell tower)
The Colossus pedestal gets a stepped plinth, rustication, corner piers, pilasters, a loggia band and a cornice in
the manner of Liberty's (most of it sits behind the rock, so the gain is small). The SURVIVE walls get board form
concrete buttresses, a coping, scuppers with rust stains and form joints. The bell tower gets corner boards, a water
table, a belt course, louvred openings with pediments and a pedimented door. ?facades=0 turns it off.

## v176 (2026-11-23): THE LOOK, seventh pass (street structures)
The welcome billboard becomes a real New York billboard: steel frame, catwalk and railing, gooseneck lamps lit at
dusk, steel stringers on the back, steel jackets and kickers on the legs. The Open Wall gets a green sidewalk shed
(posts, beams, deck, fascia with a permit board, bulbs underneath) and stud framing with raking braces behind. The
lighthouse vault floor gets a bronze portal round the PORT door, steel bands, a stone plinth and steps. ?facades=0.

## v177 to v186 (2026-11-23): SMOOTH, then the street
v177 SMOOTH. Measured on an M5 Pro at retina size (2160 x 1350) the island drew 26 to 40 million triangles in
6,000 to 11,000 draw calls and ran 13 to 20 fps; the governor had to drop sharpness and ambient occlusion and still
only reached 47 to 49 fps. Now it holds 60 fps at full quality at the plaza, walk up, market, pier and bank. How:
only the 8 nearest of 36 lamp lights are live (always 8, no recompiles); objects still for two seconds stop
rebuilding their matrices and the scene graph updates once a frame; objects under 3 px are left out of every pass,
under 10 px out of shadows and depth; sculptures load their light model (59k triangles) and swap the full one in
within 30 m; still meshes sharing a material are merged per 40 m cell (1,892 meshes into 303 draws), released the
moment one moves or hides; shadows redraw every other frame only when frames run late. ?smooth=0, ?batch=0.
v178 grass wears to soil at every edge and blades thin there; paving collects grime along the grass (?edges=0).
v179 gum, stains, oil down the lanes and tyre polish (?wear=0). v180 granite kerbs on the ring road and edging on the
promenade (?kerbs=0). v181 cast iron manhole covers (?manholes=0). v182 cast iron lamp bases, collars and caps, and
green street blades on every third lamp (?lamps=0). v183 painted roll down gates on the laundromat and N3W DROP when
they close, an Open Eye Flower in a navy contour field (?gates=0). v184 curtains, blinds and window boxes on the
walk up (?livedin=0). v185 rooftop condensers, vents, a dish, tar patches and the bank skylight (?roofs=0).
v186 four tour stops. Also: v171 lamp light on the ground capped so it cannot burn to white.

## v187 to v196 (2026-11-23): street furniture and finishes
v187 the pier deck in boards with seams, nails and per board shade; cast iron bollards and three life rings (?pier=0).
v188 the promenade benches rebuilt as New York park benches, slats and cast iron ends (?benches=0). v189 the
promenade shrubs, twenty sided dice before, now lumpy mounds shaded inside and at the foot (?shrubs=0). v190 green
wire litter baskets by the benches and on the pier (?baskets=0). v191 N3W BIKE, a bike share dock at (9.5, 48.5):
six blue step through bikes, eight docks lit green at night, a kiosk (?bikes=0). v192 a second cedar water tank on the
walk up's roof. v193 the census ribbon gets a metal coping, a shadow gap at its foot and a warm line of light under
the coping at night (?ribbon=0). v194 the bodega's striped canvas awning on a steel frame with a lettered scalloped
valance (?awning=0). v195 two flagpoles at the bank, the Stars and Stripes and the N3W flag, waving with the wind
(?flags=0). v196 four tour stops. Still 60 fps at full quality on the M5 Pro at retina.
Known: in the afternoon the docked ferry shades the pier deck almost black.

## v197 to v206 (2026-11-23): the site, the sand, the street
v197 sky fill raised a fifth by day, golden hour and dawn (?fill=0; small visible change). v198 BUIDL rebuilt in
red oxide wide flange steel: columns, beams under every deck, X bracing, yellow guardrails, orange safety netting
(?buidl=0). v199 the tower crane as a lattice: four chord mast with lacing, triangular jib and counter jib, cab
(?crane=0). v200 wind ripples and damp sand on the beach (?ripples=0). v201 four N3W LINK kiosks on the promenade
cycling New York time and weather, GM, the Memes and IF YOU SEE SOMETHING MINT SOMETHING (?link=0). v202 pigeons on
the walk up, bank and water tower ledges, bobbing and turning (?ledges=0). v203 spray painted tags between the
SURVIVE buttresses and on the factory sides (?tags=0). v204 diamond plate cellar doors in front of the bodega and
laundromat (?cellar=0). v205 red fire alarm call boxes with globes lit at night, NO STANDING ANYTIME plates on the
ring road lamps (?callbox=0). v206 three tour stops. Also: the pier deck (v187) was nearly black at every hour; the
plank texture there is lifted to weathered grey brown wood.
