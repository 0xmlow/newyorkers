# THE WRAPPED WING, N3W YORKERS SPACE PROGRAM, TAKE A NUMBER at /wrapped, /space, /number (2026-10-30)

MLow asked for three new hilarious, absurd, extremely detailed walkable galleries in his style, with optical illusions,
easter eggs, depth maps, his M.Texture wrapped objects and the other GLBs. Built in one cloud session on the LIVE FROM
THE SEWERS engine; the first version was judged awful ("boxes with a wallpaper"), the second pass applied the CLOUDS
AND DIRT V2 and THE MARKS standards (a mural on every wall, crowd bodies for every extra, forty objects a room, a nook,
a hero, the branded library) with one builder per gallery and a walk audit. No image generation was possible in the
sandbox; every plate and mural came from the house archive.

## Where things are

- **Walk repo, the source of truth**: the `newyorkers` branch `mclaude/funny-albattani-c6wzey`, three galleries in one
  checkout: `wrapped-wing/`, `space-program/`, `take-a-number/`, each with `_build/` (src, spec.json, gallery.json,
  shell.json) and `site/`, plus `_shared/` (build.py, patch_main.py, shell.py, fetch_vault.py, shot.py, audit_walk.py,
  poster.py, final_shots.sh, BRIEF_100X.md, README.md, the session charter). Clone it beside this checkout as
  `THREE GALLERIES 2026-10-30/`; `build_galleries.py` reads `../THREE GALLERIES 2026-10-30/<gallery>/site`.
- **On this site**: three `build_galleries.py` entries (slugs `wrapped`, `space`, `number`), each copying the gallery's
  `site/` into `assets/<slug>/` and writing `<slug>.html` with eight stills from `site/shots/`. Also: NAV, MORE, LINE
  (6, A, 7) and the footer in `assets/site.js`, three WALKABLE GALLERIES cards in `index.html` (the heading now says
  sixteen places), `build_deploy.py` page and folder lists, `build_seo.py` sitemap and llms lines, the gitignore pairs.

## Rebuilding

From the walk repo: `python3 _shared/build.py <gallery>` (all) or `--js` (code only); `python3 _shared/audit_walk.py
<gallery>` before judging any room; `_shared/final_shots.sh <gallery>` for the eight entrance stills, then copy them to
`<gallery>/site/shots/`. From this repo's `_build`: `python3 build_galleries.py`, `python3 preflight.py`,
`python3 build_seo.py`, `python3 build_og.py`, `python3 build_deploy.py`, then `./deploy.sh`.

## Things that will bite

- The engine reads `r.spawn` at the start and on `?room=` only since this session (`patch_main.py`); the walk audit and
  the shots stand where the visitor stands.
- Surfaces are the shipped list only (ashlar, asphalt, boardwalk, brick, cobble, concrete, grass, marble, patina,
  pavers, planks, plaster, steel, terrazzo); another name is a 404 and a black slab (`fx.column` once defaulted to one).
- Egg ids are counted from the source (`c.egg('id'`, `egg: [...]`, `egg: 'id'`, and an `['id', 'line']` pair handed to
  a helper). The HUD total is that count.
- The headless shooter is software GL: about 90 s a room, two at once at most, `--wait 20` for the crowd bodies to land.
- `nyb_*` models are Y up; `tds_*`, `si_*` and some `nasa_*` are Z up and take `rx`.
- The wrap gun (F) in THE WRAPPED WING writes a census painting onto whatever is looked at, on its own UVs; the lab
  runs it backwards. Both read `r.onLeave` to undo only what they did.
