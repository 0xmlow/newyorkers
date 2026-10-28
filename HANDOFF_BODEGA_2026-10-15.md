# Handoff: THE LAST BODEGA IN THE UNIVERSE at /bodega (2026-10-15)

Built in ChatGPT (Codex) on 2026-10-15 in its downstream copy,
`~/.codex/.chatgpt-projects/g-p-6a6ac4d467dc8191a6b1f94b7eb3c2d0/sites/last-bodega/`, and published there as a
private chatgpt.site page. Ported here by Claude Code the same morning and finished. The ninth gallery in
`build_galleries.py`, after MLOW GARDENS. Nav: MORE, line J. Footer: The census column. GitHub branch named in the
entry: `last-bodega` (pushed 2026-10-15 as a single commit snapshot; update it with a new commit on top, never a force push).

## What it is

A plain three.js (vendored, r17x module build) site with no build step: `index.html`, `app.js` (the shop and the
freezer archive), `expansion.js` (the laundromat at x -34, the Office of Lost Letters at x 34, the roof garden at z
38, each a group shown only while you are in it), `vendor/`, `assets/` (44 NEW YORKERS jpgs, `expanded-art.json`,
18 GLBs incl. Kenney Food Kit CC0, three ImageGen textures). 40 secrets; KEEP / A / LIGHT tokens open the
terrarium ending. Progress is in localStorage only. `window.__bodega` exposes `go(room)`, `discover(id)` for checks.

- Walk repo (source of truth now): `../LAST BODEGA WALK 2026-10-15/` (`site/`, `checks/`). Edit there, commit,
  rerun `build_galleries.py`. Do not edit the ChatGPT copy any more; it is downstream and older.
- Checks: `node checks/scene-smoke.mjs` and `python3 checks/assets-check.py` from the walk repo (written by ChatGPT
  against its own path layout; rerun them there or in the ChatGPT copy).

## Fixed in the port (it had never been opened in a browser)

Two line signs overlapped (font ignored sign height), the office tubes poked through the wall and over the sign,
the archive portal covered its title, YOU ARE HERE was unreadable over bright floors and showed on the title screen.

## Not verified

- Not walked through end to end by a person; rooms were visited from the Rooms menu and the ending was triggered
  by marking the three tokens found in script, then clicking the terrarium for real.
- Not tried on a real phone. The 390 wide page passes (no horizontal scroll, warp audit clean).
- `app.js` and `expansion.js` are requested without a version, so after an update a returning visitor may keep the
  old ones for up to the Cloudflare cache floor (4 h).
- Deployed 2026-10-15 as build 20261015-122559, with /bodega and /gardens added to the sitemap. `build_all.sh` was not run.

## Free GLB swaps (2026-10-28)

From the 2026-10-28 audit (`../UPGRADE ALL ROOMS 2026-10-28/audit/galleries_other.md`). Walk repo commit dd954b0.

- The immortal cat on the counter: `site/assets/props/cat.glb` (724 KB, 24k tris, the Tripo ginger cat with the evil eye
  on its collar, copied from UNLICENSED `public/assets/glb`). Loaded by `expansion.js` into the old `cat` group (passed in
  through the ctx from `app.js`), 0.62 m, turned -PI/2 to face the door; the breathing still runs.
- The pigeon postmaster in the Office of Lost Letters: `site/assets/props/pigeon.glb` (340 KB, 6k tris, same source), 0.93 m
  on the desk, turned PI.
- Both primitives are still built (the pigeon now unbatched) and hidden only when the model loads. A failed load leaves the
  room as it was; checked by blocking both files in headless Chrome.
- `checks/assets-check.py` now expects 20 GLBs. `checks/scene-smoke.mjs` passes when run against `site/` with a
  `document.hasFocus` shim (the harness predates the POWER policy and still looks for `dist/`; not changed in the repo).
- Shots, before and after: `../UPGRADE ALL ROOMS 2026-10-28/shots/bodega/`.
- Not done: the six washers (need a paid Tripo model), and the Poly Haven swaps the audit lists (register, trash bags, milk
  crates, payphone, planters), which need a download MLow has not approved in this batch.
- Not verified: a real phone, and a person walking it. The copy in `assets/bodega/` was refreshed with `build_galleries.py`
  (bodega only); `app.js` and `expansion.js` still have no version, so returning visitors may see the old cat for up to 4 h.

## Poly Haven CC0 props (2026-10-28, later)

Approved by MLow. Walk repo commit 6706ff0. Each Poly Haven model (CC0, checked on its polyhaven.com page) was taken as
the 1k glTF, run through `_build/museum/blender/prop_pass.py` with PROP_TEX=1024, then its JPEGs re-encoded at quality 74.
Files keep their Poly Haven ids in `site/assets/props/`.

- `CashRegister_01.glb` (865 KB) on the counter, 0.62 m. The `$ 1.00` panel is scaled to 0.42 and seated on its top as a
  price flag (walk repo 7b82081, after review found it floating). Shots: `register-v2-close-after.jpg`, `register-v2-wide-after.jpg`.
- `trashbag.glb` (415 KB), three by the door. `plastic_crate_02.glb` (556 KB), two stacks of two.
- `planter_box_02.glb` (733 KB), three per roof bed under the seedling rows, soil boxes just under the rim.
- Skipped: the payphone. `korean_public_payphone_01` carries the KT linkus operator logo and Korean text on every face.
- Same fallback as the cat: `swap()` in `expansion.js` hides a set's primitives only when all its models load. The
  primitives are passed from `app.js` through `ctx.swaps`. `assets-check.py` expects 24 GLBs.
- Shots: `register`, `trashbags`, `crates`, `planters`, `planters-close` (`-before`/`-after`) in
  `../UPGRADE ALL ROOMS 2026-10-28/shots/bodega/`. `trashbags-before` blocks only the bag file, so the new register shows in it.
- Not verified: a phone. The seedlings on the roof are still primitive stems (no free shrub model in this batch).
