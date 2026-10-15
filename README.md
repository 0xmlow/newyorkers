# MLOW GARDENS walk

A walkable amusement park by MLow, built in code in Blender and walked in three.js. Shown on
n3wyorkers.com at /gardens (the site's `build_galleries.py` copies `site/` into `assets/gardens/`).

- `site/index.html`, `site/main.js`: the walk (forked from the MLOW INTERNATIONAL walk: controls,
  collision, power policy). Golden hour gradient sky, a sun shadow map that follows the walker, tileable
  PBR maps chosen by material name and projected in world space, art streamed by distance.
- `site/assets/gardens.glb`: the park (meshopt, WebP), with its animation baked.
- `site/assets/scene.json`: viewpoints, the 179 art slots, animated nodes, ride targets.
- `site/assets/art.json` + `site/assets/art/`: the NEW YORKERS hang. Coney Island along THE BOARDWALK in
  era order, the station posters and plaza totems; Prospect Park and Flushing Meadows in LUNA HALL.
- `site/assets/tex/`: the generated texture set.

Source of truth is the generator: `ARCHITECT/mlow-park-v5/` (`build_v5.py`, `v5_ny.py`), rebuilt with
`./web/build/build_web.sh`, which also rewrites `site/assets` here after a copy.
