# Memory Charter: How This Practice Remembers

The skill is the practice's brain. Sessions end; the skill persists. Every session that designs, builds, or ships MUST write back to this file before closing. A session that doesn't log didn't happen.

## Session protocol

**On session start:** read this file top to bottom. The Series State table tells you where we are; the Taste Profile tells you how MLow decides; the Decisions Log tells you what's already settled (don't re-litigate).

**On session end (or after any ship/major decision):** append to the relevant sections below, then repackage and deliver the updated `.skill` so MLow can reinstall it. Keep entries terse: 1–3 lines each. This file compounds; bloat kills it. Prune superseded entries rather than stacking corrections.

---

## 1. Series State Tracker

Living status of every gallery. Update the moment status changes.

| Gallery | Typology | Status | Canonical file | Notes |
|---------|----------|--------|----------------|-------|
| Jardin Majorelle × MLOW | Garden | ✅ Shipped (pre-DNA) | `jardin-majorelle-mlow.html` (user's copy) | Needs Phase 1 retrofit: Abloh signage, Arsham fountain |
| The MLow Collection (MoMA 5F) | Urban / enfilade | ✅ Shipped (pre-DNA) | user's copy | Needs Phase 1 retrofit: Abloh signage layer, orange accents |
| Gallery Starter Template | Infrastructure | ✅ Shipped 2026-07-05 | `mlow-gallery-starter.html` (40KB) | All mandatory systems; harness green 4/4; every new gallery starts as a copy of this file: swap the [SHELL] section only |
| Tempio Maggiore (Florence) × MLOW | Domed sanctuary + matroneum | ✅ Shipped 2026-07-06 (v2) | `tempio-maggiore-mlow.html` (90KB) | To scale (47m/34m dome); walkable U-loop matroneum (N/E/rear/W galleries y=7) carrying museum vitrines, MLOW wing, memorial at loop's end; playable pipe organ (WebAudio, 24 raycast keys); kehillah figures (peyot, tallit, tefillin, black hats, davening sway); harness green 4/4 |
| "THE VOID" (Salk Institute) × The MLow Show | Void as monument / two wings | ✅ Shipped 2026-08-28 | `mlow-show/pc/site/gallery.html` (project folder) | Not a single file artifact: a page of the MLow Show website, three.js r128 vendored locally. 68 artist bays, 748 works in a salon hang streamed by distance (~50 draw calls). West wing aired, east wing never aired, plaza between them is the unposted 70%. Arsham monolith inscribed 2,448 unaired minutes. Harness green 4/4 via `pc/work/harness/harness_gallery.js` |
| Fallingwater | Landscape + structure | 📋 Queued (Phase 2, #1) |: | Reuses water engine, terrain, Jardin flora |
| Pantheon | Single volume | 📋 Queued (Phase 2, #2) |: | Oculus sun-beam hero mechanic |
| Heydar Aliyev Center | Continuous surface | 📋 Queued (Phase 2, #3) |: | Hadid shell pipeline debut |
| Guggenheim NY remix | Spiral / flagship | 📋 Queued (Phase 3) |: | The masterpiece slot |
| MLOW Hub World | Original campus | 💭 Concept (Phase 4) |: | Portals to all galleries |
| NEW YORKERS · THE MUSEUM | 111 walkable NYC rooms, TypeScript engine + Blender institution kit | ✅ v5 shipped 2026-09-06 (rooms 82–111, thirty art museums and institutions across the five boroughs, each carrying the MLow and Blossom brand layer and the Blender kit); v4 shipped 2026-09-06 (rooms 62–81, the cultural icons, all `fresh`: Studio 8H, Carnegie Hall, the Village Vanguard, Rucker Park, 1520 Sedgwick, balloon night, Christopher Street, San Gennaro, the Chelsea Hotel, the Strand, the Dakota, the Garden, Dendur, the sculpture garden, the Whitney, Ellis Island, the marathon start, the Halloween parade, Eastern Parkway carnival, Manhattanhenge); v3 shipped 2026-09-06 (rooms 42–61: Cyclone ride, Brooklyn Bridge walk, the Panorama, inside the Statue, Oyster Bar, the Morgan balconies, Radio City, Woolworth lobby, Wall Street, Lincoln Center, Belvedere, High Bridge, Arthur Avenue, Wave Hill, Gantry Plaza, Rockaway, Green-Wood, Domino, the boat graveyard by kayak, the Intrepid) | `NEW YORKERS SITE/museum.html` + `_build/museum/src` | Rooms 1–21 (v1, ported from the ChatGPT build) + 22–41 (v2: every interior with its street and skin: Chrysler, Flatiron, Bleachers, Deli, Washington Sq, Boathouse, Hall of Fame, TWA, Snug Harbor, Wollman, Doyers, Strivers' Row, Top of the Rock, Frick, Seaport, Vessel, Little Island, St John the Divine, Queensboro Plaza, Bushwick roof). Hung from data.js (7,541 pieces, eras I–XIX). NYC clock light + hang of the day. GLB export per room, mint kit per room. Cookbook: `references/new-yorkers-museum.md` |
| 50 States · The Field (Fondazione Aversano) | Client gallery: walkable map on the desert (Chinati reimagined) | ✅ v1 shipped 2026-10-02 | `~/Desktop/Fondazione Aversano_MLow/50 STATES GALLERY/` (site/ + _build/) | First client build. Forked the museum engine (kit, textures, fx) with a new main.ts and world.ts; 54 Judd concrete pavilions and Quonset sheds sited on the Foundation's own Albers map, Marfa arrival hall with 54 aluminum directory boxes, Hadid ribbon at the geographic centre, Arsham eroded unit, Marfa clock light, Marfa lights, UP freight. 200 works and 0 audit faults. Data lifted from fondazioneaversano.org/50-states (window.DATA). Hosting, GLB and mint are open |
| MLOW INTERNATIONAL v3 (AI-finished) | Airport / geometry-locked AI photoreal | ✅ Shipped 2026-10-04 | `mlow-airport-v3/renders/` (project folder) | v2's 9 Cycles stills finished by Seedream 5 Pro with Nano Banana Pro fallback on FLORA; art, logos and screens comped back from masks; tower eye re-stamped from the brand PNG. $2.82. First build through `ai-photoreal-pass.md` |
| MLOW INTERNATIONAL walk | Airport / Blender world → baked web walkthrough | ✅ Shipped 2026-10-04 | `mlow-airport-v3/web/` · artifact 8NWFyh6sipYt25KBph9vMD | 776 baked meshes in 4 Cycles lightmap atlases (int 256 spp, pods/ext 64, ground), OIDN denoise, 12 MB GLB (meshopt + GPU instancing), BVH collisions, 9 spots, walk/fly, art plaques, mobile pad |
| NEW YORKERS Census Site | Data-art viewer (not walkable) | ✅ v4 shipped 2026-09-03, data rebuilt 2026-09-06 for eras XVIII–XIX | `NEW YORKERS SITE/index.html` (project folder) | v3: 1,841 in field (cuts excluded from 3D), content-keyed thumbs + calibrated state dedup (raw RGB L1, verified vs flip sets), motion matched to characters by filename + content hash (twins merged), Loop Reel titled by vision agents, sticker pins, lineage visual; built by `_build/build_data_v3.py` |
| NEW YORKERS Census Site | Data-art viewer (not walkable) | ✅ v2 Shipped 2026-08-12 | `NEW YORKERS SITE/index.html` (project folder) | v3: 1,841 in field (cuts excluded from 3D), content-keyed thumbs + calibrated state dedup (raw RGB L1, verified vs flip sets), motion matched to characters by filename + content hash (twins merged), Loop Reel titled by vision agents, sticker pins, lineage visual; built by `_build/build_data_v3.py` |
| MoMLOW v2, after MoMA (2026-10-12, later) | The real MoMA plan: lobby through the block, atrium to the skylight, rings on 2 to 6, garden | ✅ Shipped 2026-10-12 | `MOMLOW 2026-10-12/site/` (js modules), n3wyorkers.com/momlow, branch `momlow` | 1,250 works hung by a curator that learned MLow's taste (96 of his picks, 970 refused for softness); his posters as banners; cabs with toppers in traffic; Liberty, a sauropod, the clock carousel, the subway car in the void; the glass bridge; the lift you ride; loops on screens; audit green. Method: `institution-remix.md` |
| MoMLOW, The MLow Museum, after MoMA (v2 of the MoMA block, 2026-10-12) | Urban block / atrium / enfilade | ✅ Shipped 2026-10-12 | `MOMLOW 2026-10-12/site/index.html`, n3wyorkers.com/momlow, branch `momlow` | The MoMA block rebuilt for NEW YORKERS and hung by the census: atrium open to the roof with an elliptical balcony (five boroughs), the annex as the hall of the twelve families, THE COUNTED (787 collected works) on the garden wall; Abloh quotes on every sign, the orange cone and strap, the Arsham cab; audit green |
| YOUR MOM'S BASEMENT (NEW YORKERS) | Absurd walkable Queens basement, standalone r128 lane | ✅ v2 shipped 2026-10-08 (v1 same day, judged slop) | `Desktop/NEW YORKERS BY MLOW/YOUR MOMS BASEMENT 2026-10-08/` (site/ + _build/) | Eight zones (stairs and window well, TV den and the wrong room mirror, card room and corkboard, boiler and laundry with the dryer ride, Penrose pipes and the 1998 PC relic, Ames hallway, 12 m everything bagel with a bite, Rat King's court, the cold room in mom's freezer). 120 census paintings, 20 classic meme sculptures as trophies, 35 NEW YORKERS 3D props. Astra brief and critique, 13 Patina sets, 3 Nano Banana Pro plates. Lighting the Monaverse way, exposure metered with ?ls= |
| MEME ISLAND (The Memes by 6529 × NEW YORKERS) | Absurd trolling island, standalone r128 lane | ✅ v2 shipped 2026-10-07 | `Desktop/NEW YORKERS BY MLOW/MEME ISLAND 2026-10-07/` · artifact EPwH3poDNpspXy1osMR22r (private) | All 527 Memes cards by pillar in 18 districts (floor price mountain, hardware wallet lighthouse + vault with the punk6529 honorary, BRAIN dome, WAGMI wheel, SURVIVE bunker, factory, bank, BUIDL, OM portal, freeway, voxel colossus) + 144 NEW YORKERS. FLORA plates + Patina, Astra brief and critique, $0.86 |

**Source-of-truth rule:** the shipped HTML files live on MLow's machine, not in this skill. At the start of any retrofit or patch session, ask MLow to upload the current file or connect the folder: never patch from memory of the code.

## 2. Build Retros

Three lines per shipped build: what to steal forward / what to never repeat / what surprised us. Newest first.

- **MoMLOW v2 (2026-10-12, later):** Steal: start from the real plan and give every real room a job before any art (the lobby through the block, the atrium, the chronology on the floors, the store, the cafe, the garden); a taste model learned from the artist's own picks with a quality gate, so the hang is argued from data and the curator's note hangs by every door; one point light per room culled by distance instead of a light per panel; a catwalk where a wall had no floor. Never repeat: a laylight per panel with a RectAreaLight each (140 lights, the tab froze while compiling); hanging on a wall's centre line instead of its face (every work vanished inside 36 cm of plaster); a hero's bounding box as its collision (the sauropod swallowed two floors). Surprise: MLow's taste read as his own mythology once the rare words were shrunk away (the First Eye Flower, the Royal Wedding, the Rat Queen, the Pigeon Queen led the list), and the real MoMA plan made the virtual one legible at once.
- **MoMLOW (2026-10-12):** Steal: hang a body of work from one atlas per 256 works (tile UVs in the geometry, one shared material per sheet) and stream the full painting only inside 11 m; curate in Python from the site's own JSON (minted first, then an even sample) so a room is never the first thirty numbers; an in page `?audit=1` that stands 2 m in front of every work and checks floor, solids and overlap caught the lobby overlap before any eye did. Never repeat: `texture.clone()` before the loader has the image (every clone stays empty and renders black; put the repeat into the mesh UVs instead); a DoubleSide sign (the back reads mirrored; use two planes); custom quads wound for the wrong side (face normals must point at the visitor, check with a raycast, and remember a precise aim can fall in a tile gap); the museum tree GLBs carry four variants side by side, keep one. Surprise: the whole block, 946 works and 26 visitors, came in at ~400 draw calls and 27 MB of assets, and the wall of the collected was the picture that made the build.
- **YOUR MOM'S BASEMENT V2 (2026-10-08, same day):** MLow's verdict on V1 was "AI slop": sparse, clean, a few props in empty boxes. Steal: ask Astra for the density schedule as data (objects with positions, sizes and sources per zone), the forty eggs with triggers, the photo panel prompts, the decals, the sound and the lighting per zone, in three runs so nothing truncates; photographic wall panels from Nano Banana Pro ($0.18) are the cheapest realism there is (a pegboard, a workbench, a bar back, a storage cage read as real at eye height); Poly Haven's API gives CC0 props as 1k glTF in one script; Trellis on FLORA turns a sticker into a GLB for $0.024; keep V1 in git and add density as a layer file, not a rewrite. Never repeat: a 2 GB disk margin is not optional for a film pass (Kling clips are 20 MB each, the cut needs intermediates; cut from the FLORA URLs instead and delete local clips); the Bash tool dies silently at zero bytes free and the patch in it is lost. Taste: he wants the code folder, never an artifact; density and eggs over polish; the room must be real so the jokes land.
- **YOUR MOM'S BASEMENT (2026-10-08):** Steal: meter the exposure (a `?ls=` light scale and a headless script printing mean luminance per room) instead of eyeballing a contact sheet, the den sat at 84/255 while the brick rooms were at 160; the Monaverse recipe as engine rules (one shadow casting spot that follows the nearest bulb, practicals halved, gradient occlusion strips and contact shadows as the bake, one PMREM probe from a photograph); walls with a `y0` sill so windows are openings; doorway floors must cover the wall thickness or two rooms never connect. Never repeat: `/json/new?url` unencoded (every query param after the first is dropped, so an `ls=` knob silently did nothing); a comment swallowing a statement appended to its line; clean clips at crf 19 with grain (68 MB for 9 s on a 300 MB disk); a Bash call that dies on a full disk takes its whole patch with it, check the build for the fix before judging the frame. Surprise: Patina drew whole bagels twice when asked for crust, and a bagel made of bagels is the better joke.
- **MEME ISLAND v3 (2026-10-07):** Steal: Marfa Light's sky model ports to any place in an hour (change LAT, LON, the DST rule); four i2i FLORA photographs of one view at four times crossfade cleanly by sun elevation because the model locks composition; artist sculptures go web via gltf-transform optimize then a raw GLB-to-JSON unpack (keeps meshopt, about 0.9 MB each at 60k tris). Never repeat: PMREM fromScene over a ShaderMaterial sky (NaN env, every lit surface black); env map plus the old hemi fill (washed out, cut hemi to 0.42 and matte envMapIntensity to 0.4). Surprise: the calendar (mint days, Spooky SZN, fireworks days) did more for 'alive' than any light tweak.
- **MEME ISLAND (2026-10-07):** Steal: 527 cards cost 5 draw calls as InstancedMesh planes over four 4096 atlases with a per-instance `uvr` attribute (onBeforeCompile on MeshBasic); a floor price mountain (cells sorted by distance, cards by floor) is walkable only if the height curve keeps neighbour steps under the 0.66 step reach; Astra critique of a 20 frame contact sheet gave twelve ranked, numeric fixes and five cheap viral delights. Never repeat: `const` state objects declared after the IIFE that writes them (three TDZ crashes, caught only by the harness); swapping `material.map` between canvas textures on a live material (rendered pure white, never uploaded; redraw one canvas instead); a BackSide pano cylinder whose winding faces inward (use DoubleSide); script downloads, which artifacts block (show the PNG in a modal to save by hand). Surprise: the jokes did more for the place than the architecture did; Astra wanted the evil eye sky gone and MLow's mark won.
- **50 States · The Field, Fondazione Aversano (2026-10-02):** Steal: the client's own site was the best data source by far (window.DATA held every token, chain record and 1200 px media, plus an Albers map with insets), so look there before the spreadsheet; a map can be the floor plan (state polygons become inlays, Cor-ten strips trace the lines, pavilions relax off their centroids with springs to avoid overlap); distance streaming (480 px, then 1200 px, then video within 17 m, labels within 13 m) and per-place visibility culling cut 1,260 draw calls to 54 overhead; a ?audit mode in the page itself checked reach, facing, sightline, crowding and doorway walks for every work in about a second. Never repeat: trusting the in-app pane for timing or screenshots (rAF stops when it is hidden; use the headless shot.py, or __fa.step() to drive frames); white plaques under bloom (keep sign whites under the threshold); a sign wall between the viewing pad and the view. Surprise: the Foundation's sienna is Wright's Cherokee red, so the client brand and the house DNA turned out to be one palette.
- **THE MUSEUM walkthrough film (2026-09-12):** Steal: film any gallery for free with headless Chrome plus a 60 line CDP client, MediaRecorder on the canvas posting to a local receiver; the M5 Pro renders 3360x1890 at 48 fps headless, so the footage is the real engine, not a render. Synthetic keydown must go to `document.body` (the museum's handler calls `closest` on the target) and look is a synthetic pointer drag. Never repeat: recording in the in app Browser pane (rAF stops whenever the pane is hidden, and viewing an image hides it) or spawn shots without checking where the spawn faces (rock looks at the sky, momaatrium and twa at a wall). Surprise: FLORA's "Astra" is a text model; the film's whole FLORA bill, narration written from a contact sheet, sixteen voice lines, a 110 s score and two dream shots, came to about $1.10, and video needed the partner workspace.
- **THE MUSEUM v5, rooms 82–111 (2026-09-06):** Steal: the headless Blender kit pattern (primitives, lathe, tube, taper, boolean, flat materials, one export function, a contact sheet renderer) gave 27 hero objects in one build; `k.image` plus a tiny `brand.ts` put the real MLow and Blossom marks in every room without touching the engine; museum light as a recipe (scrim, one warm point per bay, wash on frames, spot per print). Never repeat: walls with block gaps and no geometry gaps; whole rooms in Blender; spawning under the street trees the room just planted. Result: 607 hangs across the thirty rooms, 603 of them pieces no earlier room had shown (99% fresh); `used.ts` now lists 1,980 pieces. Surprise: the institutions were the easiest set to make gorgeous because the real buildings are already galleries; the hard part was restraint (few works, big walls, museum light) and the brand layer reads best where it is smallest (a medallion in the floor, a banner between columns).
- **THE MUSEUM v4, rooms 62–81 (2026-09-06):** Steal: the `fresh` flag (a generated `used.ts` from the export manifest pushes already hung pieces to the back) makes every new room show unshown New Yorkers for free; parades are crowds in lanes with a palette plus one hero on a rider; one letter `sign()` stacks make blade signs; 500 instanced confetti planes with a matrix tick is the particle recipe. Never repeat: a census wall or backing box anywhere near the spawn's look vector; centring a building box on the wrong side of its facade line; shipping a generated parser that only reads single quoted fields. Surprise: the icons wanted the least architecture and the most people; a marathon is seven lanes of sixty capsules and reads as fifty thousand; the composition bugs were again the only bugs.
- **THE MUSEUM v3, rooms 42–61 (2026-09-06):** Steal: three kit helpers (`spline`, `rider`, `crowd`) turned every room into a place with life for ~90 lines of engine; rides as `path` (coaster, helix inside the Statue, kayak loop); instanced monuments and towers (900 headstones, 4,000 model buildings) cost nothing; the 61 room tile list and the mint kit both regenerate from the registry regex so scale is free. Never repeat: `skyline` with an `x` offset near the room (spacing × scale sweeps the band through the site); two walkable levels over the same footprint with a stateless `floorY`; spawning within 4 m of a panel or post. Surprise: twenty rooms took one session because the recipe held; the bugs were all composition (what is in frame), never geometry or the hang.
- **THE MUSEUM v2, rooms 22–41 (2026-09-06):** Steal: encode invariants in the engine, not the rooms (`hang()` flips every frame toward its `target`; world-space UV densities; `kit.used` asset tracking that makes a per-room mint folder a copy job); the room recipe in `new-yorkers-museum.md` (sky → street and skin → structure → movement → hang → motion → curation → tile → look at it) produced twenty rooms in one session; procedural exteriors (`street`, `blockFront`, `skyline`) make any interior feel placed. Never repeat: screenshot-checking daylit rooms at 2 AM New York and calling them broken; burying windows, signs and census walls inside wall thickness; drawing `ExtrudeGeometry` plans with the far end at negative y (it grows toward the camera); trusting a mount's rotation sign (eight rooms faced their art into the wall). Surprise: the dynamic layer cost ~60 lines (NYC hour smoothsteps into sky, hemi, sun, glow, fog) and changed the whole product: the museum is now a clock, and a room pinned to a day is a natural NFT unit; GLTFExporter handled a 117k-triangle room with 270 draw calls and its file size is entirely textures (58 MB at 2048 px, a quarter at 1024).
- **"THE VOID" (2026-08-28):** Steal: distance-sorted lazy texture streaming (nearest first, load inside 34m, dispose past 58m, 12 concurrent) renders 748 artworks at ~50 draw calls with no atlas and no custom shader, so frustum culling plus dispose beats instancing when the art must stay individually clickable; a salon hang (4 rows, 1.42m pitch, artist plaque under each run) is how you fit hundreds of works in a walkable corridor instead of stretching it to 300m; when the gallery is a website page rather than an artifact, vendor three.js locally and reference real asset paths, which also kills the CDN dependency. Never repeat: assuming `yaw=Math.PI` faces -z. It does not. `camera.rotation.y=t` sends the view to `(-sin t, 0, -cos t)`, so PI faces +z and the visitor spawned looking out of the building; derive facing from that formula, and check it by counting draw calls toward a known wall rather than by eye. Also never reassign an array that `window.__game` exposes (`bays=data` orphaned the hook), mutate it in place. Surprise: the archive's own measured finding handed over the plan. 1,081 minutes posted against 3,529 recorded made Kahn's empty plaza the only correct landmark, and the void needed no decoration because it already meant something. Second surprise: rAF pauses when the pane is hidden, so "textures stopped loading" was the harness environment, not the streamer; always confirm by stepping the loop manually before debugging the code.

- **NEW YORKERS Census Site (2026-08-12):** Steal: InstancedMesh + MeshBasicMaterial.onBeforeCompile with per-instance atlas-UV + fade attributes renders 1,826 artworks in 5 draw calls (0.07ms/frame); texture atlases (32×32 grid of 128px tiles per 4096 JPEG) built offline with PIL; formation morphing = from/to pos+quat Float32Arrays with per-index stagger; `window.__game` hooks again made headless driving trivial (rAF pauses when the pane is hidden: hooks are the only way to test). Never repeat: assuming "holes" in a tile wall are bugs: they were runs of consecutive ink-black artworks (rosters batch color stories), verified via renderer.info triangle counts before touching code. Surprise: the collection's own mythology (the City Bloom Map "the city IS an eye") handed us the hero formation for free: concentric rings of portraits around a glowing seed; the story bible as data source beats inventing an information architecture.

- **Tempio Maggiore v2 retrofit (2026-07-06):** Steal: gallery loops belong ON the arcades like the real matroneum: a room box hung over the sanctuary volume reads as "half the building is walled off" (the v1 mistake); program the loop instead (vitrines on one arm, exhibition on another, memorial at the terminus = Wright release). Rails must stop short of every junction or the corners seal. Furniture collision y-ranges must contain eye height (floor+1.7 = 8.7 on the y=7 level; a y1 of 8.6 lets players wade through consoles). Diagonal walkers descend ramps sideways: route stair exits through the top corner before turning. Surprise: a playable instrument (raycast keys → 3-partial WebAudio voice, ~40 lines) does more for presence than any static detail; capping the apse collision ring at y 6.9 let one wall set serve ground blocking and gallery clearance simultaneously.
- **Tempio Maggiore (2026-07-06):** Steal: two-level floor resolver (highest candidate within 0.5m step reach: NOT nearest-candidate, which never engages ramps) + y-ranged collision walls; height-gated barriers (y1≈2.5) let climbers pass over what blocks ground walkers. Never repeat: tower/turret collision footprints swallowing interior rooms: project turrets forward of the facade like the real building and audit every exterior mass against interior program. Surprise: the movement sim caught four spatial bugs a visual pass would have missed (aisle widths, lamp-in-corridor, turret-vs-stairwell, full-height dividing wall slicing the museum floor); on sensitive programs (Shoah memorial) the right Abloh move is restraint: quotes for wayfinding only, zero irony and zero orange in the memorial and sanctuary.
- **Starter Template (2026-07-05):** Steal: `window.__game` test hooks made the harness trivial: keep them in every build. Never repeat: n/a, first-run green. Surprise: the whole template with both logos fits in 40KB: brand logos quantized to 48 colors are nearly free.
- **Jardin Majorelle (pre-charter, reconstructed):** Steal: golden-hour default, instanced flora engine, drag-and-drop hanging. Never repeat: v1's too-dark night (fix: 2× brightness + 20 practicals). Surprise: the day/night toggle doubled perceived depth for ~50 lines.
- **MoMA Fifth Floor (pre-charter, reconstructed):** Steal: zone teleports, patrol-and-pause agents, batch upload hanging. Never repeat: solid slab with hole texture as doorway; MAT ordering bug (define materials before use). Surprise: the weathered Lamborghini relic became canon: one strong Arsham object beats five weak ones.

## 3. Design Decisions Log

DNA rulings that are settled. Cite these instead of re-deciding.

- **2026-10 · Code, never an artifact:** a 3D build ships as a site folder with an Open command. The Artifact tool is not used for galleries unless MLow asks for a link. (MLow ruling, 2026-10-08.)
- **2026-10 · Density is designed, not improvised:** before building a room, get the object schedule (what, where in metres, how big, from which source) and the egg list from Astra as data; a room with fewer than twelve specific objects reads as a game level.
- **2026-10 · Exposure is metered:** a standalone build ships with a light scale knob and a metering script; the default is the value that puts the hearth room near 70/255 mean luminance, not the value that looked right in a hidden pane.
- **2026-10 · Photoreal finishing:** realism beyond the engine comes from a geometry-locked AI pass on our own renders (guides from `bl_guides.py`), never from regenerating a scene from a prompt. The generator stays the source of truth; the model may change surface, light and lens only; artworks and logos are protected by masks and comped back; outputs are labelled "AI-finished". Method: `mlow-blender-builds/references/ai-photoreal-pass.md`.
- **2026-10 · Client galleries:** a client build forks the museum engine into its own folder (kit, textures and fx copied; main.ts and world.ts new) rather than adding rooms to THE MUSEUM. The client's mark leads (the Fondazione crest on the fascia and the beam); MLow is credited small ("A VIRTUAL GALLERY BY MLOW"); the client's site palette becomes the HUD tokens.
- **2026-09 · Platform, two lanes:** standalone galleries stay single-file r128; the NEW YORKERS museum is a TypeScript + esbuild bundle on three 0.185 and never gets ported back. New rooms for the census go into the engine, not new files.
- **2026-09 · Exteriors:** every interior room ships with its building, its street and its skyline. The visitor can stand outside first. (MLow ruling: "if they are inside buildings i want the outside structure and surrounding built too".)
- **2026-09 · Dynamics:** rooms keep New York time. Light follows the hour, the hang reshuffles from the date seed. A room marked `daylit: false` keeps its fixed hour.
- **2026-09 · Blender lane:** Blender builds sculpture, ornament and brand objects as small flat material GLBs through a headless script; it never builds rooms. Review the kit on a contact sheet before placing.
- **2026-09 · Brand in the rooms:** MLow banners between the columns, the eye as a floor medallion, a donor wall crediting NEW YORKERS · MLOW · BLOSSOM, Blossom flags in solid ink, electric or cloud with the wordmark tracked wide, blossom gardens in the sculpture courts. Never a gradient, never a stretched blossom, never a corporate mark that is not ours.
- **2026-09 · Mint unit:** a room is the token: playable page locked to the room, the room as GLB, poster, record of the hang, pinned day. Contract-level dynamics (ERC 7160 / 4906) are optional on top.
- **2026-07 · Structure:** One master skill, no sub-skills. Depth goes into references, not fragmentation. (MLow ruling.)
- **2026-07 · Sequence:** Phase 1 retrofit before new galleries: starter template first. (MLow ruling.)
- **Standing · Voices:** One voice leads per zone; Wright owns circulation; Abloh owns all text; Arsham ≤2 moments per gallery; Hadid curves only where the camera sees the silhouette.
- **Standing · Brand:** Evil Eye Blue is reserved: frame, HUD, CTAs only, never general architecture. Logo is always the real PNG, never typed.
- **2026-07 · Faithful mode:** When MLow asks for a real landmark 'to scale with all details', lean faithful: DNA becomes a light frame (Wright circulation, Abloh wayfinding, ONE Arsham moment tied to real history: Tempio's 1966 flood-line column), MLOW insertion = one exhibition wing. Sacred/memorial zones get no irony, no orange.
- **2026-09 · Films:** a gallery film is real engine footage first; generative video is for one or two named dream shots, always captioned as such. Recipe and scripts in `NEW YORKERS BY MLOW/MUSEUM WALKTHROUGH 2026-09-12/_engine/`.
- **2026-08 · Delivery:** A gallery may ship as a page of a real website rather than a single file artifact when it belongs to a larger site. Then: vendor three.js locally, load media from asset paths, keep the harness. The single file rule stands for standalone builds.
- **2026-08 · Web performance:** Never let a site load full resolution masters. Ship 640px thumbs for grids and the 3D hang, 1400px views for lightboxes, and keep the masters out of the deploy package.
- **Standing · Naming:** Series working title "MLOW WORLDS": not final; confirm with MLow before any public-facing use.

## 4. Taste Profile: how MLow decides

Track what MLow approves, rejects, and gravitates toward. Update whenever a preference reveals itself. Draft toward this profile.

- Moves fast; prefers the recommended path when it's well-reasoned: bring a strong default, not an open question.
- Maximalist on memory/system-building: chose ALL four memory functions. Wants the practice to compound, not just produce.
- Thinks in ecosystems (Blossom, Soft Conspiracy, galleries interlink): always consider how a build feeds the wider MLow universe.
- Ambition is explicit: "best architect in the world." Calibrate proposals to that bar; don't sandbag scope.
- Communication: concise and direct. Cut preamble. Name the move, make it.
- Asks for scale jumps in one breath ("build the next 20 rooms", "make everything able to be exported as GLBs", "let's go crazy"); the right answer is to ship all of it in the session with a recipe that makes the next twenty cheaper, then log the recipe.
- Wants the outside built when there is an inside, and wants the work to become a product (mintable, exportable) not just a page.
- Brings client work into the practice (Fondazione Aversano hired us off the NEW YORKERS pipeline): treat a client build as a series entry with the same bar.
- (Append as observed: palettes gravitated to, features cut, briefs rejected…)
- Rejects the artifact as a final form when the work is a real product: asked explicitly for "a working website" and editable documents instead. Ship to a domain, not a preview.
- Wants the resource to serve a whole field, not just himself: framed the ask as useful "for all of crypto art and anyone willing to dive in".
- Moving off GoDaddy to self hosted. Recommendation given and recorded: `show.mlow.xyz`, one DNS record, because static and relative paths make the move a repoint.

## 5. Open Threads

Short-lived parking lot. Delete items when resolved.

- AI photoreal pass, next candidates: 5 West 86th interiors; MLOW INTERNATIONAL v3 promo video frames (the stills are done). Hi-res (2.5K) finals would need masks re-rendered at that size.
- The Field (Fondazione Aversano): hosting (Cloudflare like the museum?), GLB and mint per state pavilion, Justin's daily acquisition posts as in-world text (X needs a login; the site's descriptions are used for now), and his sign-off on the name "50 States · The Field".
- Phase 1 retrofit of the two shipped builds is blocked on getting their HTML files (upload or folder connect).
- Series title "MLOW WORLDS" needs final sign-off.
- Mint kit built 2026-09-06 (`MUSEUM MINT KIT 2026-09-06/`), no contract deployed, `fee_recipient` is a placeholder, folders not yet pinned.
- Rooms 82+ follow the recipe in `new-yorkers-museum.md` and the list in the handoff package's `04_NEXT_ROOMS.md`. Earlier open candidates: the Cloisters garden by night, Roosevelt Island smallpox ruin, the Whitney terraces, Ellis Island's registry room, the Village Vanguard, Grand Army Plaza, Astoria's Steinway floor, Citi Field, the Bronx Zoo sea lion court, Manhattanhenge on 42nd.
- ~~Hosting question (mlow.xyz)~~ RESOLVED 2026-08-28: `show.mlow.xyz` recommended, full guide in `mlow-show/DEPLOY.md` covering GoDaddy cPanel today and Cloudflare Pages / Caddy after the move. The site is static with relative paths, so the address is not a lock in.
- Logging gap: no charter entries between 2026-07-06 and 2026-08-02. If any sessions shipped or decided anything in that window, backfill retros/decisions from what MLow remembers, then delete this item.

## 2026-09-10: 5 West 86th reconstruction

- User correction: actual photographs and black-and-white plans take precedence over inaccurate older renders. Requested Hockney, Calder, Rauschenberg, Patrick Hughes, and Tom Wesselmann curation.
- Recovered original plan screenshot; retraced stepped core, corridors, and stair position. Reused furnishings remain approximations. Mesh-derived Gaussian surfels must never be described as a trained photographic scan.
- Carry forward: verify real wall/slab openings, rendered color pipeline, and browser asset revision. See photo-plan-reconstruction.md for the reusable workflow.

## 2026-09-10: 5 West 86th dynamic editions

- Shipped pattern: preserve one faithful source, then derive separate mint GLB, self-contained HTML, preview video, and MLow Bloom edition with explicit identities and reproducible generators.
- Never repeat: treating runtime decoration as if it were embedded in the GLB, or calling metadata preparation a completed mint. Scan standalone HTML for external asset paths and keep wallet/chain actions explicit.
- Taste: MLow wants dense, blue-chip art curation and a full-house branded retrofit as a parallel artwork, while retaining the historically grounded apartment as its own edition.

## 2026-10-04: Monaverse / MONA study

- Scraped monaverse.com (168 pages, 199 media) and the 12 MONA designer portfolios on *.mona.site into `ARCHITECT/monaverse/` (`scrape.py`, `scrape_portfolios.py`). Monaverse has left 3D worlds and is now MONA aOS, an AI operating system for interior design studios.
- Steal: their render engine's promise ("geometry follows the drawing set", "revision-safe": change only what you name, keep the rest pixel-still). We own exact geometry already, so the same method fits our builds: became `bl_guides.py` + the ai-photoreal-pass reference.
- Never repeat: syncing skills one way without diffing. The live and canonical virtual-architect had both moved on; a blind `install.sh` would have wiped THE MUSEUM v3–v3.4 notes, a blind `--pull` the 5 West 86th references. Diff both directions, union-merge, then install.

## 2026-10-04: MLOW INTERNATIONAL v3 (first AI-finished build)

- Shipped: 9 AI-finished frames + cover + before/after sheet in `mlow-airport-v3/renders/`, pilot write-up in `ai-pass/PILOT.md`. $2.82 total, quoted before each spend.
- Steal: give the edit model **our render** and score every output against the guide edges. Seedream for finish, Nano Banana Pro when Seedream reframes (2 of 5 did). Re-stamp owned decals from the source PNG.
- Never repeat: trusting depth-conditioned generation (Flux Depth invented a different airport), or comping 3D parts or alpha decals back from silhouette masks.
- Surprise: the AI pass fixed v2 faults no one had logged, like the hazy gate-hub glass and the washed-out tower eye. The finish doubles as QA on the base render.

## 2026-10-04: MLOW INTERNATIONAL walk (Blender world → baked web build)

- Shipped: walkable Three.js build with Cycles-baked lightmaps, published as a private Artifact (glTF-JSON variant, because artifacts don't serve .glb).
- Steal: bake irradiance (no colour) and draw it with MeshBasicMaterial at intensity = scale × π; merge baked meshes per material for draw calls; a BVH over the baked set for collisions.
- Never repeat: trusting a screenshot of a hidden pane (render on demand + snap_sink), `getComponent` on quantised data, default `prune` (strips lightmap UVs), starting a bake on a near-full disk (MLow's drive had 160 MB free; caches cleared with permission).
- Surprise: the bake exposed modelling faults the Cycles stills hid, namely the downward-facing plaza and mirrored wings.

## 2026-10-04: MLOW INTERNATIONAL into THE MUSEUM, mint GLB, hype cut

- Shipped: room 182 "The arrival" (era XII) in NEW YORKERS, committed locally (4289cff, 6851f2b) and ported to GitHub `Museum` (b6325b6), not deployed; self-contained mint GLB (37.7 MB, only KHR_mesh_quantization required) with poster and metadata in `mlow-airport-v3/mint/`; walkthrough v2 with the combined colour bake; 31 s hype cut in `promo/` with a placeholder synth bed.
- Steal: one combined bake feeds all three outputs (web lightmap on white, mint unlit, museum set).
- Never repeat: per-atlas auto exposure; default REPEAT samplers on baked atlases; trusting `kit.prop` placement on quantised files; whole-file JSON rewrites that reformat house files (places.json).
- Surprise: the hang put "The Green Card Morning" (No. 2304, two suitcases, Elmhurst) in the first concourse frame.


## 2026-10-05: THE HONORARIES, room 183 (live), its film and mint GLB

- Shipped: room 183 in NEW YORKERS, all 687 honorary portraits of 680 people in the Gould Library rotunda and the
  Hall of Fame colonnade, live on n3wyorkers.com (build 20261005-194208); name plates and X links the same day;
  a branded hype film cut to a Lyria score from engine captures; a mint GLB of the whole room. FLORA $3.14 for the
  room, $0.21 for the score.
- Steal: generated PBR (Patina) plus an Astra critique loop; one atlas per 112 works with the original fading in
  up close; layout sized from the collection's count so the room grows with it.
- Never repeat: geometry without normals under GTAO (black sky), a label behind its own backing box, a spawn whose
  banner point lands in a passage, kit trees and cutout people in a photoreal room.
- Surprise: the museum's landing page picked the new room as its first stop on the day it shipped.
- Taste: MLow wants the most photoreal room yet, every portrait named on the wall and linked to the person.


## 2026-10-10: ON LOCATION, New York at the movies (live, 25 sets)

- Shipped: a walkable gallery of NYC film scenes recast with eye flower headed New Yorkers, forked from THE MARKS
  engine; live at n3wyorkers.com/movies, branch `on-location`, a row in the main README. Ten sets, then five, then
  ten more, King Kong as the finale. 96 Poly Haven CC0 props, about 25 Tripo cast and vehicles, about 70 Nano Banana
  Pro plates, walls and concepts.
- Steal: CC0 first (Poly Haven at 512 px textures, one asset per Blender run); plate + walls + cast + props + one
  trick per set; casting without likeness; lazy loading per room; contact shadows; eggs counted from source.
- Never repeat: generating props that Poly Haven has free; leaving headless Chrome profiles behind (the disk hit
  zero and the shell could not start); batching Blender passes so one bad asset kills the rest; modern hybrid taxis
  in a 1969 street; a concept cropped at the tail.
- Surprise: the cheapest realism win was a radial gradient shadow under every model; the most loved tricks cost
  twenty lines (the anamorphic title, the mirror that runs late, the T. rex that moves when you look away).
- Taste: MLow wants it bizarre, dense, next level, every scene recognisable, "tons of easter eggs and props", and
  hates waste: check for free assets before spending his tokens.
- Decision: real films and places are fair game; actors' faces and studio logos are not. Every cast member has an
  eye flower for a head, famous lines get an MLow twist, song lyrics never.

- 2026-10-10 later: ON LOCATION at 35 sets (Cloverfield, The Day After Tomorrow, Dog Day Afternoon, Fame, Annie Hall,
  Men in Black, Coming to America, Rosemary's Baby, The Apartment, The French Connection), 87 eggs, live build
  20261010-083715. Never repeat: shipping a parody plate without looking for the real logo inside it.

- 2026-10-10 later still: ON LOCATION at 105 sets, 330 eggs, live build 20261010-230202 (branch on-location 140e6c2,
  main README 1448b03). Rounds seven to eleven: Fisher King to Ghostbusters II. Krea ran dry after round seven; rounds
  eight to eleven made their plates and walls in Adobe Firefly in the browser and recast from the existing Tripo GLBs.
  Steal: the stand-still trigger, the second camera into a render target, two facing Reflectors, a self counting intro
  card. Never repeat: choosing a film that is already in the gallery, egg ids reused across sets, a room resetting
  shared player state every frame, a story year in the film field, trusting a plate's leads to have flower heads.
  Surprise: the "including the main characters" line ended the face problem; the funniest sets (pigeons cleaning a
  flat, the penguin conga, Liberty walking down Fifth) were all crowds following a simple target.
  Taste: MLow wants every set dynamic, animated, funny and viral, with lots of props and eggs, and every line of site
  copy current.


## 2026-10-30: THE WRAPPED WING, N3W YORKERS SPACE PROGRAM, TAKE A NUMBER (three galleries, one session, cloud)

- Shipped: three walkable galleries on the LIVE FROM THE SEWERS engine, each eight rooms, one trick a room, 83 eggs in
  all, 288 census New Yorkers on the walls, in the `newyorkers` repo on branch `mclaude/funny-albattani-c6wzey`
  (`wrapped-wing/`, `space-program/`, `take-a-number/`, the shared build in `_shared/`). Not deployed.
- The wrap gun (press F, whatever you look at takes a census painting on its own UVs) is M.Texture live in the room;
  the lab runs it backwards. 100 of MLow's M.Texture wrapped GLBs pulled from the WRAPPED folder on his Drive through
  the connector (match blobs to names by byte size); 70 placed.
- Steal: the vault pattern (`fetch_vault.py` fills everything from the repo's own branches: 105 ON LOCATION depth
  plates and the five other worlds' sets, 6,218 located census thumbnails, the cast, 200 Poly Haven props); one
  `spec.json` per gallery that names each room's plate with a treatment (flip, sat, tint, bright) and its
  neighbourhoods; `patch_main.py` and `shell.py` so the engine fork is a JSON, not a copy; a four tilt contact sheet
  before placing any scan (Three D Scans are Z up); a reflection that sees a different layer than the eye (the temple
  pool shows the sphinxes plain).
- Never repeat: trusting a cloud sandbox for image generation (Krea, Magnific at zero, FLORA at ten cents, Adobe
  without text to image, Canva proven but its download host blocked by the proxy); `texture.clone()` before the image
  lands; enabling a layer on the main camera before the Reflector has cloned it; a prop on the arrival point (the
  bench, the counter, the lamp table, the seated extra, the young star all landed on the spawn once).
- Surprise: the archive carried the whole thing. With no generator at all, the 140 plates already made and the hundred
  wrapped objects were enough for three worlds that read as new, and the gift shop's price that climbs while you look
  is the cheapest joke in the practice.
- Taste: asked for "hilarious, absurd, extremely detailed, meme worthy, viral", with optical illusions, eggs, depth
  maps, and his new M.Texture and wrapped assets used; wants Adobe Firefly for assets (blocked here; note the lane).
