# MoMLOW, The MLow Museum after MoMA (2026-10-12, v2 the same day)

MLow asked for his June 2026 "MLow MoMA" (`~/Downloads/mlow_museum.html`, a city block after MoMA with empty frames you
filled by upload) upgraded and filled with NEW YORKERS art, on the site and GitHub. v1 shipped at noon; he called it mid
and asked for the real MoMA, his posters as banners, the cabs, better hanging, lighting and settings, the GLB library,
animation, a curator with a taste model and quality control, and the skill improved. v2 is that.

## Where it lives
- The build: `NEW YORKERS BY MLOW/MOMLOW 2026-10-12/` (its own git repo). `site/index.html` is the shell, `site/js/*.js`
  the engine (core, building, hang, props, people, main), three.js r128 self hosted in `site/vendor` (with the RGBE,
  Draco and rect light libs), the site's fonts in `site/fonts`. `README.md` says what is where; `CURATOR.md` is the
  curator's report. `_build/build_data.py` makes `site/assets` (124 MB: ten atlases, 27 banners, 79 store posters, 16
  loops, 12 surface sets, three HDRIs, 100 GLBs, the topper screens) from this repo and the other galleries' props.
- On the site: `momlow.html` through `_build/build_galleries.py` (slug `momlow`; `need` lists js, data, atlas, glb;
  still `DELIVERABLES/cover.jpg`), copied whole into `assets/momlow/`. MORE nav and footer (`assets/site.js`), the
  museum's `GALLERIES` (`_build/museum/src/main.ts`, bundle rebuilt), the home walk card (`index.html`), sitemap and
  llms.txt (`_build/build_seo.py`), the package lists (`_build/build_deploy.py`). The copy is gitignored except its poster.
- GitHub: branch `momlow` (a clean snapshot, force pushed over v1's) and the row in the `main` README.
- The skill: `SKILL UPDATES 2026-10-05/virtual-architect/` v3.8, new `references/institution-remix.md` (the method and
  the traps), charter rows, repackaged `.skill` (the v3.7 zip kept as `.bak-2026-10-12`).

## The building
The real MoMA plan: 53rd Street with cabs in both directions (the five Tripo cabs with the MLOW topper, screens from the
museum's atlas), the lobby through the block to the Garden Lobby, the store (his street posters, prints, MLOWTAR), the
Bodega cafe, escalators with catwalks for the Families wall, a glass lift you ride (stand in it, press a floor). Floor 2
is the atrium open to the skylight (Liberty 14 m, a sauropod on loan from 79th Street, the clock animals circling, the
subway car hanging, the mobile) with the contemporary eras around it and the boroughs on its walls; floors 3 to 5 are rings
of galleries (places, design and builders, the sets; Eras VI to XII; the Originals and II to V, where MoMA keeps its
Starry Night); the glass bridge on 4; floor 6 the curator's six theme rooms, the Moving Pictures (loops on screens) and
the terrace with the water tower. The sculpture garden with two pools (koi, a swan, a sea lion), the eye monument,
blossoms, the excavated cab, and THE COUNTED on a 14 m wall. 54th Street beyond. Day, golden hour and night from the
museum kit's HDRIs on the New York clock.

## v2.1, the same evening: illusions, patterns, the heroes everywhere
MLow asked for optical illusions, patterns on the walls, more New York and more of the 3D assets. `site/js/dress.js`: an
anamorphic painting on the atrium floor for one spot on the floor 3 balcony (`M.buildAnamorph`, the curator's first lobby
pick projected from the eye through a 16:9 picture plane onto the floor), a Penrose triangle on the terrace (three beams
along a body diagonal turned horizontal, a mark 7.5 m away), a hollow eye over the garden doors (a BackSide hemisphere),
a Reflector mirror at the end of the escalator hall (high quality, visible within 32 m), an illusion panel per floor on
the north balcony wall (Ebbinghaus with the eye flower, cafe wall, rotating snakes, Fraser spiral, Zollner), subway tile
dado and the site's mosaic frieze (assets/ui tile.webp, mosaic.webp, mosaic-eye.webp) along the lobby and every corridor,
the cafe wall in tile in the Bodega, eye flower wallpaper in the store, enamel station signs with line bullets at every lift
door and landing. The Penn Station set runs the lobby, the ON LOCATION cast in bronze along the atrium, the blue whale,
the IRT kiosk on 53rd, stoops, fire escapes, water towers, phone booths, the Central Park corner, the ferry and tug in the
pools, the Rat King's court, the harbour pieces. Rooms take fifty works. 1,308 works, 521 hung plus THE COUNTED. Audit zero.
Copy is 191 MB in assets/momlow (v=c6e61db4ef).

## The curator
`_build/curator.py` with `_build/taste.json`. Positives: MLow's own census mints (56), the Keystone picks, the home page
faces, the poster and card pieces (96 in all). Tokens of title and story (words and bigrams), family, set, borough,
neighbourhood, era; smoothed log odds against the census, shrunk by how often a token appears in his picks, clamped; plus
hand weights. Quality gate: Laplacian sharpness (12th percentile), contrast, dark fraction: 970 of 7,542 refused. Themes
are word bags; every room is ordered best first with the collected pieces leading. Edit taste.json and rerun
build_data.py to change the museum; the report prints what it learned. Press C inside for the room's note.

## Checks that ran
`?audit=1`: 462 hung works, zero failures (every one has a floor 2 m in front, nothing in the way, no overlaps). Headless
contact sheets at 1440 (25 views) and 390 (5); the card for a work, a loop and the curator's panel; the lift ride and the
escalator through CDP (the headless frame rate is slow, so rides take longer there). `build_galleries.py`: no dashes, no
outside code, the inline script parses. Draw calls about 380 with eight lights live. `preflight.py`: no problems.

## Not verified
Real Safari, iOS and a real GPU (headless swiftshader only; phones get the low quality path: no shadows, no bloom, fewer
visitors, three loops). The live site: built and committed, not deployed. Deploy is MLow's, with `_build/deploy.sh`.
