# ON RECORD at /records (2026-10-20)

MLow asked for the next epic gallery, built the way ON LOCATION (the movies) was built. ON RECORD is its sister:
eleven rooms where New York made its music, each opening onto a photograph turned into depth, recast with eye flower
New Yorkers, each with one trick and its own song.

## Where things are

- **Walk repo, the source of truth**: `../ON RECORD 2026-10-20/` (its own git). `README.md` there has the room table,
  how it was made and what was not verified. The engine is ON LOCATION's, forked whole.
- **On this site**: `build_galleries.py` entry `slug="records"` copies the walk repo's `site/` into `assets/records/`
  and writes `records.html` with eleven stills from `site/shots/`. Also: MORE line L and the census footer column in
  `assets/site.js`, the home WALKABLE GALLERIES card (`index.html`, picture `assets/home/now-records.jpg` written by
  build_galleries), `build_deploy.py` page and folder lists, `build_seo.py` sitemap and llms line, the gitignore pair.
- **GitHub branch**: `on-record`, pushed 2026-10-20 (1260ea0), with a row in the main README (e91bef8).
- **LIVE** 2026-10-20 as build 20261020-132739 (deployment 4b3e889f), checked on n3wyorkers.com/records with no console errors.

## Rebuilding

From the walk repo: `python3 _build/build.py` (all) or `--js` (code only), then from this repo's `_build`:
`python3 build_galleries.py`, `python3 preflight.py`, `python3 build_deploy.py`. Deploy only through `deploy.sh`,
and only when MLow says.

## Things that will bite

- The cast and props are read from `../ON LOCATION 2026-10-10/work/glb_pass` (and `glb_draco`). Move or prune that
  folder and ON RECORD's build loses its models. A model shows only if some quoted name in build.js or main.js names it.
- Plates and walls came from ChatGPT ImageGen through the Codex CLI bundled with ChatGPT.app (`tools/plate.sh`,
  `tools/wall.sh`), because Krea had 0 credits. stdin must be `< /dev/null`.
- Skate mode is kept, but its ramps only exist while skating (walking, the rooms are the rooms).
- The music (`_build/src/music.js`) is synthesised from scratch per room and was never listened to by a person.
- Headless tests must set `window.__POWER.blurred = false`: an unfocused tab runs the tricks at a third of the speed.

## Free GLB swaps (2026-10-28)

From `../UPGRADE ALL ROOMS 2026-10-28/audit/galleries_movies_records_garyvee_momlow.md`, models already on disk only. Walk repo
commits 01e07d7 and f926fce. Each model sits in ON LOCATION's `work/glb_pass`; build.py clones it into `site/assets/glb` because build.js
now names it. Every old primitive is kept and hidden only when its model loads.

| Room | Was | Now | File | Size |
|---|---|---|---|---|
| lobby | six record bins: wood slabs | Poly Haven `wooden_crate_01` with two `plastic_crate_02` on it, sleeves dropped into them and double sided | `ph_wooden_crate_01.glb`, `ph_plastic_crate_02.glb` | 139 KB, 603 KB |
| factory | screen test stool: a black slab | Poly Haven `metal_stool_01` | `ph_metal_stool_01.glb` | 135 KB |

Skipped: the giant tone arm (paid, by the brief), the turntables, speakers, sampler and Chelsea fireplace (no free model on
disk), the banana (`ph_bananas` is a bunch; one banana cut from it would be about 1,000 triangles on a 1k texture blown up to
1.8 m), the camera stand (no tripod on disk), the Harlem stoop (MoMLOW's `stoop.glb` would change the eight riser heights the
crowd stands on), the flower headed extra (its trial runs in ON LOCATION first).

Checked: `check_all.py` 11 sets, 0 with errors; before and after shots in
`../UPGRADE ALL ROOMS 2026-10-28/shots/records_clouds_momlow/rec_*`; preflight no problems. Not checked: phones, and
`audit_walk.py`, which cannot run on this gallery (it waits for a skate park per room and reports "never ready" on the
shipped copy too). Not deployed.

Reverted the same day (f926fce): the Tree of Hope was swapped for Poly Haven `tree_stump_01` and read as a rock on the
plinth, not the cut and polished elm section the real one is. The Poly Haven index has no log or stump with a flat sawn
top and rings (`tree_stump_01` and `_02` are root mounds, `dead_tree_trunk` a fallen log, `dead_quiver_trunk` a grey
branch), so the plank cylinder with its ringed top is back, unchanged. Shots `rec_apollo_v2_before.png` (the scan) and
`rec_apollo_v2_after.png` (the cylinder again). A sawn elm section is a job for paid generation or a Sketchfab download.

## The crowd: whole characters from the cast (2026-10-28)

MLow approved the ON LOCATION crowd trial for every gallery, with whole characters: each flower headed extra (Harlem's forty,
CBGB's pit, the Sedgwick dancers, the Vanguard listeners, the Jones Street companion) becomes a whole cast character with its
own sculpted flower head, and the sprite head hides. Default on; `?crowd=old` brings back the old figures. Code: the walk repo's
`_build/src/crowd.js` (a copy of ON LOCATION's) and `extra()` in `build.js`. Files: 40 Draco `crowd_*` (1.9 MB, loaded only when
cast) from `../ON LOCATION 2026-10-10/work/glb_pass`, made by ON LOCATION's `_build/crowd_pass.py` (its README has the cast and
the command). Harlem stays generic and unlabelled (a photograph of real musicians). Harlem old to new: 266 to 165 draw calls,
695k to 816k tris desktop; 384k to 501k on the phone path. Shots `../UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/records_*`.
Not verified: by hand, on a real phone, the crowd in motion. Not deployed.
Later the same day: the crowd uses full length models only (agent, auggie, broker, usher stop above the knee and read sunk);
bartender, felix, loretta, golfer, clerk replaced them. Shots `*_v3.jpg` in the same folder.
Featured leads with cut models were recast where flagged (see the walk repo README for which, and the cut leads still standing).

## The rigged crowd (2026-10-28, later)

The nearest 20 extras (8 on a phone) are rigged cast that walk at their path speed or idle, and head tricks turn the head bone
(up to 60 degrees about world up in the head's frame, the body the rest). `?rig=off` keeps them static. The rigs are `rig_<name>.glb`, built into the gallery from
`../ON LOCATION 2026-10-10/work/glb_pass`; see the walk repo README for the method, numbers and films. Not deployed.

## Hustler reweighted, Susan doll face forward (2026-10-28, later)

MLow settled the two open rig questions. The Hustler is re-rigged with his whole eye flower bound to the head
(`rig_pass.py` FLOWER), so a look turns it the full angle; his -90 face yaw stays. Susan is re-rigged facing +Z (doll
face, sweater front and toes; the flower behind), so her rig needs no gallery yaw and her look aims the doll face; her
static twins turn instead (Tripo `susan` YAW 90, `crowd_susan` and `crowd_susan_full` 180). The new files reuse the old
names, so a returning visitor may see the old GLB until the cache turns over. Stills: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing/`.
