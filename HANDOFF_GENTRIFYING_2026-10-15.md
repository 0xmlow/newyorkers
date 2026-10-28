# Handoff: THE MUSEUM THAT IS GENTRIFYING ITSELF at /gentrifying (2026-10-15)

MLow's second ChatGPT gallery of the day ("Experimental Institutions 002"), built in the downstream copy
`~/.codex/.chatgpt-projects/g-p-6a6ac4d467dc8191a6b1f94b7eb3c2d0/sites/gentrifying-museum/` (v2, private chatgpt.site
page). ChatGPT was blocked from opening a browser, so it had never been looked at. MLow's note on v1 there: "this is
awful ... make this 100x better". Ported by Claude Code the same day and taken further. The tenth gallery in
`build_galleries.py`. Nav: MORE, line L (the Williamsburg and Bushwick train). Footer: The census column. GitHub branch
named in the entry: `gentrifying-museum` (pushed 2026-10-15 as a single commit snapshot without tools/patch*.py; update it with a new commit on top, never a force push).

## What it is

Plain three.js (vendored, no build step): `index.html`, `app.js` (rooms, hang, redevelopment, projector, tick),
`installations.js` (the six original optical studies), `materials.js` (Poly Haven CC0 PBR with parallax relief and
the whitewash), `atmosphere.js` (SSAO, bloom, vignette). Four rooms that share one origin and are shown one at a time:
the working floor (loft), the sales suite, the holdouts (basement), common ground (roof). Six tenant records unlock
the cooperative ending on the roof. Progress in localStorage (`mlow-tenants-v1`); buzz resets on reload.
`window.galleryDebug` has `go`, `setMode`, `look(room,pos,aim)`, `hype()`.

- Walk repo (source of truth): `../GENTRIFYING MUSEUM WALK 2026-10-15/` (`site/`, `tools/`, `checks/`). Edit there,
  commit, rerun `build_galleries.py`. Do not edit the ChatGPT copy.
- `tools/make_art.py`: the hang list by room (58 works), writes `site/assets/art.json` and `site/collection.html`
  from this repo's `assets/data.js`, clones the 1000 px thumbs. Change a room's works there.
- `tools/shots.py`: the eleven stills in `site/assets/shots/` and `site/assets/poster.jpg`, headless.

## What the port added

- The hang: loft two tier on back and left walls, sales suite back wall plus four gold easels with red dots
  (INCLUDED WITH PENTHOUSE), holdouts salon hang floor to pipes, roof street boards. Gold fillet, brass picture light,
  additive light pool, label with number and neighbourhood, modal links to `/n/<number>` in the top window.
- The redevelopment, animated from `shown` (chases `pressure`): whitewash uniform on the loft's own brick and floor
  materials (`pbr(..., {wash})`), sun warm to cold, NOW LEASING vinyl on the four bays, one long branded partition
  (`PART` in app.js) that rises at the discovery stage and squeezes the art corridor to 1.5 m at the residences stage,
  loft art slides into the corridor, asking rent on the meter. Reclaiming reverses all of it and hangs the
  cooperative banner.
- 07 The Rebrand: THE FORMER painted over the loft as one anamorphic image. `projector` in app.js: a camera at the
  viewing point renders a depth texture of the scene; every non transparent MeshStandardMaterial in the loft is
  patched to take the paint where the projector sees it, clipped to the loft's box. The depth map is redrawn only
  while something in the loft moves. Viewing point from Optical studies (it raises the buzz to 51 first).
- Fixes: brick tiles were 4 m by 2 m (now 0.78 m), conduits through the hang, spawns facing the scale model and the
  bench, the Bottomless Value and Double Promise viewing points stood inside a side table and behind the model, the
  wall sign clashed with the lenticular sign, sign text ignored sign height, basement shelves in front of art, no
  frame budget (now the POWER policy, see HANDOFF_POWER_2026-10-12.md), em dashes and arrows in the copy.

## Not verified

- Not walked end to end by a person in a live browser; every view above is a headless frame on this Mac's GPU.
- Not tried on a real phone. The page passes at 390 (no horizontal scroll, warp audit clean at 375, 768, 1440).
  The patched shaders and SSAO on mobile GPUs are untested; coarse pointers start without SSAO (ChatGPT's choice).
- ChatGPT's `checks/scene-smoke.mjs` was written for its v2 layout and was not rerun.
- `app.js` and friends are requested without a version, so after an update a returning visitor may keep old files
  for up to the cache floor.
- Deployed 2026-10-15 as build 20261015-162026, with /gentrifying in the sitemap and llms.txt. `build_all.sh` was not run.

## Free GLB swap: the roof water tank (2026-10-28)

From the 2026-10-28 audit. Walk repo commit 1491c5f.

- `site/assets/props/water_tower.glb` (426 KB, 4.8k tris, webp textures), the tank from THE LAST BODEGA's roof. Fitted to the
  old tank's 7.3 m at [0, 0, -6.5], shadows on, loaded on its own LoadingManager so it never holds the loading screen.
- The gallery had no GLTFLoader: `site/vendor/loaders/GLTFLoader.js` and `site/vendor/utils/` were copied from the bodega
  (both r185).
- The primitive tank is built unbatched and hidden only when the model loads; a failed load keeps it (checked by blocking
  the file in headless Chrome).
- Look: this tank is MLow's blue marble one with drips, not a plain cedar NYC tank. If he wants cedar, MARKS
  `work/glb_pass/tower.glb` is one, with a N3W YORKERS mural. The RECLAIM THE BUILDING sign stands about 0.3 m in front of it.
- Shots, before and after: `../UPGRADE ALL ROOMS 2026-10-28/shots/gentrifying/`.
- Not done: the Poly Haven swaps the audit lists (sofa, picnic table, chairs, folding table, planters), which need a
  download MLow has not approved in this batch.
- Not verified: a real phone, the projector or the ending with the model in place (the tank is on the roof, outside the
  projector's loft box). ChatGPT's `checks/scene-smoke.mjs` was not rerun.

Same day, later: the blue marble tank was swapped for the cedar one (walk repo b3e96a3). `site/assets/props/tower.glb`
(715 KB, 20k tris, from THE MARKS `work/glb_pass`, the tank EVICTION uses), 7.3 m at the same spot, turned -PI/2 so the
N3W YORKERS mural faces the stairs. `water_tower.glb` is gone from this repo. The fallback was checked again by blocking the
file. Shots: `tank-*-before.jpg` (primitive), `tank-*-marble.jpg` (the first swap), `tank-*-after.jpg` (cedar).

## Poly Haven CC0 props (2026-10-28, later)

Approved by MLow. Walk repo commit e69e0d6. Same recipe as the bodega's (1k glTF, prop_pass.py at PROP_TEX=1024, JPEGs at
quality 74, Poly Haven ids kept). `glb()` and `swapIn()` near the top of `app.js` load and fit them; the tank uses them too.

- `Sofa_01.glb` (416 KB), the loft couch, 1.1 m, facing the room. The three cushions `installations.js` lays on the old couch
  are now named `couch-cushion` and hidden with it. The sofa's materials get `projector.patch`, so the Rebrand paints it.
- `plastic_monobloc_chair_01.glb` (463 KB), the six basement chairs. `dining_table.glb` (446 KB), two end to end as the
  community table.
- `planter_box_01.glb` (618 KB), four per roof bed, soil boxes inside. `wooden_picnic_table.glb` (850 KB), the roof table;
  the seed envelope target moves to its top.
- Shots: `sofa`, `sofa-close`, `basement`, `chairs`, `roof-beds`, `picnic` (`-before`/`-after`) and `rebrand-after` in
  `../UPGRADE ALL ROOMS 2026-10-28/shots/gentrifying/`.
- Not verified: a phone, the Rebrand landing on the sofa from the viewing point (the sofa is outside that view), and
  ChatGPT's `checks/scene-smoke.mjs`.
