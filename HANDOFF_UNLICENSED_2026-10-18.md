# Handoff: UNLICENSED NEW YORK at /unlicensed (2026-10-18)

MLow built this in ChatGPT on 2026-10-18 from his list of fifty concepts (the bureau of miracles, the pigeon court, the
infinite apartment, the baggage claim, the benches, the recursive museum, combined into one civic sequence) on the
pigeonhole portal engine, and handed the zip over with the note "Hand this to Claude Code". ChatGPT had run it in a
browser on this Mac through its own CDP harness, so unlike the Unreal Estate venue it arrived working. Claude Code opened
it, found one engine fault, ported it to a walk repo and registered it on the site. Nav: MORE, line G. Footer: the census
column. Branch named in the entry: `unlicensed-new-york`, pushed 2026-10-18 as a single snapshot commit (7d1da5e); update it with a commit on top, never a force push.

## What it is

Walk repo (source of truth): `../UNLICENSED NEW YORK 2026-10-18/` (git). Read its `START-HERE.md`, `CLAUDE.md`,
`docs/ROOMS.md` (the sixteen departments and what each one does) and `docs/VALIDATION.md` (what ChatGPT measured and
what it did not). Edit there, `npm run build` (Vite, into `site/`), commit, rerun `build_galleries.py`.
Do not edit the ChatGPT copy in `~/.codex/.chatgpt-projects/g-p-6a6ac4d4.../unlicensed-new-york/`; it is downstream now.

- `src/engine.js`: the pigeonhole engine (three.js 0.185) with ChatGPT's additions: a texture cache keyed by URL, a
  loaded GLB cache, static box batching for boxes with no click action, a 2D player radius collision solver against walls
  and chosen prop footprints, a reduced motion path, and the recursion render deepest first.
- `src/rooms.js`: the sixteen departments and their shared helpers. `src/catalog.js`: the deterministic pick of 160 New
  Yorkers by theme per room, no doubles. `src/sound.js`: synthesised sound, nothing external.
- `public/assets/generated/`: the four ImageGen plates (contour material, wheatpaste, the skyline vista and its
  inverse depth estimate), prompts in `docs/prompts.json`. Art, stickers, GLBs and textures are byte identical copies
  from the pigeonhole pack; `docs/asset-manifest.json` has the hashes and lineage.
- `public/shots/`: sixteen clean stills (`?auto&nolock&clean&room=<id>`, 1600 by 900) shot with `tools/shot.py`,
  which runs headless Chrome with the disk caches off. The page uses them under the description; the sky department is
  the poster and the home still.
- `checks/validate.mjs` (`npm run check`): builds all sixteen room factories on the CPU and checks geometry, the 160
  allocations, asset paths and the cyclic route. `collection.html` is the no WebGL route.

## What changed in the port

1. `resize()` in the engine floors the render target size at one pixel. In the app's browser pane the gallery drew 258
   frames into a zero size framebuffer while the pane was mid resize, then Chrome stopped reporting WebGL errors for the
   context, which would hide any real error later. The pigeonhole engine has the same line and the same exposure.
2. Vite builds into `site/` instead of `dist/` so the site's gallery builder finds it.
3. The poster was the pigeonhole diorama, inherited with the pack. Replaced with the sky department.

## Not verified

- Not walked end to end by a person. Every room was shot headless here and the intake hall was entered in the app's
  browser pane with no console errors after the fix. ChatGPT's own harness reports all 32 doorway transitions pass in
  both directions, and says plainly that is a threshold test, not a walk around every piece of furniture.
- Not tried on a real phone (390 px emulation only, by ChatGPT). Recursion drops to two levels there.
- The rooms share one shell (terrazzo or carpet, art on the long walls, the trick in the middle). MLow's standing
  note is that sparse rooms read as slop; this is denser than a plain room but thinner than the pigeonhole. Worth his eye.
- Deployed 2026-10-18 on MLow's word ("push it and deploy it"): build 20261018-050959, the live page checked in the app's browser pane with
  the gallery running inside the frame and no console errors. The first deploy attempt was refused by preflight: another session's page
  builder had put the generic share card back on every n/ page between build_og and build_deploy. Rerun build_og, then build_deploy, then deploy.

## Rigged cast (2026-10-28): nothing to change

No human figure here has a rigged twin: the intake clerk is the MLOWTAR booth (a prop), `bench` is two seated people in
one mesh (a group), pigeonlady is in the YAW table but no room places her. No primitive people. Untouched.
