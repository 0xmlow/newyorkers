# THE EVICTION at /eviction (2026-10-20)

MLow asked for the Eviction Diorama (idea 28 of the Dynamic NFT outlines) built "super complex and detailed like our movies
set". It grew into a building: one Williamsburg tenement under the J at Broadway and Marcy Avenue, seven rooms, and the
year apartment 4F was emptied (October 2026 to October 2027). It's built on New Yorkers No. 47 The Eviction and No. 39 The Landlord.
Room 8, The Landlord's penthouse over Central Park, is the "Dynamic NFTs with New Yorkers assets" session's work.

## Where things are

- **Walk repo, the source of truth**: `../THE EVICTION 2026-10-20/` (its own git). Its `README.md` has the room table, the
  art and illusions list, how it was made, and what was not verified. The engine is ON RECORD's, forked whole, with a shared
  `kit.js` and one file per room (`_build/src/r_*.js`). `r_penthouse.js` belongs to the other session.
- **The year**: `kit.js` `CH`. It follows the New York calendar unpinned, `localStorage evict.pin` holds a pin, `?chapter=0..12` opens a month,
  and tearing the calendar previews. This is the pin demo of a dynamic token, run without a contract.
- **On this site**: the `build_galleries.py` entry `slug="eviction"` copies the walk repo's `site/` into `assets/eviction/` and writes
  `eviction.html` with nine stills. It's also in `assets/site.js` (NAV, MORE, LINE J, the census footer column), the home WALKABLE
  GALLERIES card (`index.html`, picture `assets/home/now-eviction.jpg`), the `build_deploy.py` page and folder lists, the
  `build_seo.py` sitemap and llms line, and the gitignore pair.
- **LIVE** 2026-10-20 as build 20261020-230750 (deployment 849d75b7), checked on n3wyorkers.com/eviction with no console errors.
- **GitHub branch**: `the-eviction`, pushed 2026-10-20 (walk repo history, MLow noreply), with a row in the main README (898534d).

## Rebuilding

From the walk repo: `python3 _build/build.py` (or `--js`), then from this repo's `_build`: `python3 build_galleries.py`,
`python3 preflight.py`, `python3 build_deploy.py`. Deploy only through `deploy.sh`, and only when MLow says.

## Things that will bite

- The cast and props are read from `../ON LOCATION 2026-10-10/work/glb_pass` (and `glb_draco`), like ON RECORD.
- `build.py` scans every `src/*.js` for model names and eggs (`SRCS`); a model only ships if a quoted name names it.
- The figures (`site/assets/figs`) are cutouts from Firefly passes on MLow's paintings. The Eviction is made from
  `work/penthouse/eviction_fixed.png`, MLow's painting with EVISTION corrected to EVICTION.
- `group.add(mesh).position...` moves the group, not the mesh (add returns the parent). This bit four props here.
- A ShaderMaterial `#include` must sit on its own line, or every room near it fails shader validation.
- The penthouse's 95 m view cylinder must hide outside its room, or it hangs over the roof (fixed in its file).

## Free GLB swaps (2026-10-28)

From the audit in `../UPGRADE ALL ROOMS 2026-10-28/audit/galleries_other.md`. Walk repo commit f6e8327. Every stand in is
still built and hidden only when its model lands (`kit.js` `swap()`; `glb()` takes `quiet` so a failed load adds no slab).

| room | was | now | file | size |
|---|---|---|---|---|
| landlord | box desk, 2.6 m | ON LOCATION `nyb_wolf_desk`, top at the 0.86 m the lamp, ledger and phone sit at (2.2 m wide) | `r_landlord.js` | 264 KB Draco |
| roof | cedar tank of boxes and tori | THE MARKS `tower.glb`, 8.6 m, eye flower facing the door; `build.py` clones it | `r_roof.js` | 715 KB |
| apartment | CRT box and two knobs | `nyb_crooklyn_tv` (the set on the curb in chapter 1), channel plane moved onto its glass | `r_apartment.js` | 271 KB Draco |
| court | twelve box pews | five Poly Haven `painted_wooden_bench` per pew, 60 in all (CC0, 630 tris each) | `r_court.js` | 95 KB Draco |

Skipped: the audit's "delete the box tub and move its egg to `nyb_treebrooklyn_tub`": that model is the wash bucket, and the
tub with the board across it is the kitchen's story. The fridge and the radiators need paid Tripo models.
Checked: `check_all.py` 8 sets, 0 errors; shots in `../UPGRADE ALL ROOMS 2026-10-28/shots/eviction/{before,after}`.
Not checked: phones (no mobile shot was taken), the penthouse (untouched), and `audit_walk.py`, which waits for a skate park
layout that never appears headless here and reports "never ready" for every set; the colliders were not changed.
Not deployed.

## Rigged cast (2026-10-28, walk repo 3b413d5)

- Twelve cast names load rigged twins from `site/assets/rig/` (2.9 MB, copied from `UPGRADE ALL ROOMS 2026-10-28/rig/out`):
  annieh, clerk, editor, felix, loretta, maitre, rosemary, sally, susan, tough, workgirl, writer. `main.js` `load()` takes the
  rig for a name in `rig.js` `RIG` and falls back to the static GLB; `glb()` has `rig = true` (pass `rig: false` to opt out);
  the skate rider calls `load()` directly and stays static; `?rig=off` keeps the old cast. The penthouse maitre is rigged
  through `kit.js cast()`, `r_penthouse.js` was not edited.
- `rigTick()` after the room tickers: nearest 20 (8 phone) play; walk when the group moves (clip scaled to the real speed),
  idle otherwise; head look within 6 m. Clerk and felix idle only, sally no look.
- The 4F movers (`r_apartment.js`) now carry at a steady 1.1 m/s along the path and face the way they walk (they ran up to
  2.7 m/s, backwards). Tough walks; tracksuit has no rig and glides as before.
- Left static (no rigged twin): broker, agent, tracksuit, pigeonlady, dad, maria, bookseller, auggie, butcher, jeweler.
- Court, desktop: 264 draw calls, 616k tris (751k with `?rig=off`), rig CPU 0.05 ms; phone emulation 86 calls, 238k tris,
  8 of 10 animate. Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/eviction_movers_lawyer.mp4`. All eight rooms load
  headless with no console errors. Not verified: a real phone, `check_all.py` (not run, its fixed ports collide with
  parallel sessions), foot slip on the movers measured (judged by eye only).

## Rig facing fix (2026-10-28)

Five rig files face 90 degrees off +Z (blindwoman, hustler -90; lensman, tough, sally +90). The yaw now goes on the
skinned clone inside the root here, and the static twin was checked against it. Stills and the lineup:
`UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing/`; method in `UPGRADE ALL ROOMS 2026-10-28/rig/HEAD_TURN_FIX.md`. Not deployed.

## Hustler reweighted, Susan doll face forward (2026-10-28, later)

MLow settled the two open rig questions. The Hustler is re-rigged with his whole eye flower bound to the head
(`rig_pass.py` FLOWER), so a look turns it the full angle; his -90 face yaw stays. Susan is re-rigged facing +Z (doll
face, sweater front and toes; the flower behind), so her rig needs no gallery yaw and her look aims the doll face; her
static twins turn instead (Tripo `susan` YAW 90, `crowd_susan` and `crowd_susan_full` 180). The new files reuse the old
names, so a returning visitor may see the old GLB until the cache turns over. Stills: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing/`.
