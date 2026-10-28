# LIVE FROM THE SEWERS at /sewers (2026-10-23)

MLow asked for a wacky, photoreal gallery "live from the sewers, the home of the pizza rat", made in FLORA with Astra on a
$12 budget. Twelve rooms under New York at rat scale, on the CLOUDS AND DIRT V2 engine. Spend $6.75 (Astra brief and critique,
12 Nano Banana Pro plates, 12 Nano Banana 2.1 walls, 8 cast concepts, 8 Tripo H3.1 models), all in the FLORA Creative
Partner workspace, project "LIVE FROM THE SEWERS 2026-10-23".

## Where things are

- **Walk repo, the source of truth**: `../LIVE FROM THE SEWERS 2026-10-23/` (its own git). `README.md` there has the room
  table, the tricks, the costs and what was not verified.
- **On this site**: `build_galleries.py` entry `slug="sewers"` copies the walk repo's `site/` into `assets/sewers/` and writes
  `sewers.html` with twelve stills from `site/shots/`. Also: NAV, MORE, LINE (L, the First Avenue train) and the footer in
  `assets/site.js`, the home WALKABLE GALLERIES card in `index.html` (the heading now says thirteen places), `build_deploy.py`
  page and folder lists, `build_seo.py` sitemap and llms line, the gitignore pair.
- **GitHub branch**: `live-from-the-sewers`, the walk repo's history, with a row in the main README.

## Rebuilding

From the walk repo: `python3 _build/build.py` (all) or `--js` (code only), then from this repo's `_build`:
`python3 build_galleries.py`, `python3 preflight.py`, `python3 build_seo.py`, `python3 build_og.py`, `python3 build_deploy.py`.

## Things that will bite

- The props and rats are read from `../ON LOCATION 2026-10-10/work/glb_pass` and `../THE MARKS GALLERY 2026-10-09/work/glb_pass`;
  the cast GLBs from the walk repo's `work/glb_pass` (Tripo, passed by `_build/cast_pass.py`).
- Tripo models face +X: YAW in main.js turns them (Pizza Rat and the trader face away and get PI).
- The arrivals and throne ceilings have a square hole (`well` in rooms.js) with a shaft above; the throne's plunger ride goes up it.

## Rigged cast (2026-10-28): nothing to change

The residents are the sw_ clothed animals (left as they are) and the only people are 2D canvas figures on the boards.
`extra()` is never called. The skate rider roster stays static (a rider stands on a board; the walk and idle clips do
not fit a ride). Untouched.
