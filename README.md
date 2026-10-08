# YOUR MOM'S BASEMENT

A walkable three.js (r128) basement under a two family house in Queens, for NEW YORKERS by MLow.
Plain HTML, no build step to play, no CDN: three.js and its loaders are in `site/vendor/`.

Eight rooms in visitor order: the stairs (with the window well), the TV den (with the mirror onto the wrong room),
the card room (with the corkboard), boiler and laundry (the dryer ride, the Penrose steam staircase, the 1998 PC),
the infinite hallway (an Ames corridor), the everything bagel (12 m, in a cream cheese lake, with a bite to walk through),
the Rat King's court (twelve pizza rats, one bodega cat, mom's second freezer) and the cold room inside the freezer.

120 NEW YORKERS census paintings hang on the walls, 20 of MLow's meme sculptures sit on the shelves as trophies,
35 NEW YORKERS 3D props furnish the place. Mom is upstairs. She texts.

## Play

Double-click **Open YOUR MOMS BASEMENT.command** (first time: right-click it, Open, to get past macOS).
Or: `cd site && python3 -m http.server 4208`, then http://127.0.0.1:4208/index.html

WASD walk, SHIFT hurry, SPACE jump, drag or arrows to look, E use, click any painting, ENTER to type
(try gm, hodl at the dryer, cope at the card table, greentext at the TV, mom, touch grass, rent, bagel), C tour, P postcard,
H at the corkboard to pin a JPG (a posting permit is issued).

## Files

- `site/index.html` the basement (all code inline, built from `_build/{engine,world,systems}.js` by `_build/build.py`)
- `site/assets/` 12 FLORA Patina material sets, 3 Nano Banana Pro plates (window well, the wrong room, the stairs), the census atlas, `sculpt/` 20 meme sculptures, `props/` 35 NEW YORKERS 3D props
- `site/vendor/` three.js r128, GLTFLoader, meshopt decoder, the post chain
- `_build/harness.js` headless test: `node _build/harness.js site/index.html` (parse, runtime, every door walked, every painting viewable, eggs, rails, soak)
- `_build/shots.py`, `_build/film.py` headless stills and the film (needs headless Chrome on :9333 and the site on :4208; see `_build/cdp.py`)
- `_build/astra_brief.txt`, `_build/astra_critique.txt` the art direction, GPT-6 Astra on FLORA
- `DELIVERABLES/` stills, the film, the photoreal pass

Lighting after the Monaverse creator rules: one or two real lights (a spotlight that follows the nearest bulb, with the only
shadow map), everything else a practical or faked (gradient occlusion strips, contact shadows), one reflection probe per
area built from the wrong room's photograph, 1024 textures, instanced repeats, meshopt models under 1 MB each.
