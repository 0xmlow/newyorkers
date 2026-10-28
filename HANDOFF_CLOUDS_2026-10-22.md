# CLOUDS AND DIRT at /garyvee (2026-10-22): V2 with the wing; V1 at /garyvee-v1

MLow asked for the most detailed virtual space yet, for Gary Vaynerchuk: his quotes, his content, VaynerMedia and its office,
VeeFriends, and his honorary New Yorker portraits. CLOUDS AND DIRT is a tower of twelve floors on the ON RECORD engine, from the
stockroom of Shoppers Discount Liquors to the sky over Manhattan, with his portraits by MLow on the walls.

## V2, the same day

MLow's verdict on V1: "plain jane". V2 lives in its own walk repo `../CLOUDS AND DIRT V2 2026-10-22/` (V1 is never edited
again, by his rule). It keeps the twelve floors and adds THE VEEFRIENDS WING, thirteen rooms that can only exist online (the
doodle room, the Spectacular vault, the TCG arena, Burn Island, the VeeDome, the Gift Goat's room, the flip court, the Sunday
comics press, the toy aisle, the punk vault, the cellar, game day, the feed), thirteen 3D VeeFriends inspired figures built
headless in Blender (`_build/blender/veefriends_kit.py`), Poly Haven CC0 PBR textures (`_build/polyhaven_tex.py`), the fx
toolbox (`_build/src/fx.js`: the six Spectacular materials, code drawn and voxel punks, a halftone press, alcoves, columns,
mezzanines, coffers, neon, cards), clip mode (V, the vertical cut live), `VIRALITY.md` and `_build/RESEARCH.md`. The wing was
built by four parallel builders from `_build/BRIEF_WING.md`, one file each (`wing_a.js` to `wing_d.js`), merged in build.js.
LIVE 2026-10-22 as build 20261022-082508 (deployment 8c64b954). On the site: slug `garyvee` now points at V2 and slug `garyvee-v1` at V1 (both in build_galleries, deploy lists, sitemap,
gitignore). GitHub: `clouds-and-dirt` (V1) and `clouds-and-dirt-v2`.

## Where things are

- **Walk repo, the source of truth**: `../CLOUDS AND DIRT 2026-10-22/` (its own git). `README.md` there has the floor table,
  how it was made, the brand check and what was not verified. The engine is ON RECORD's, forked whole.
- **On this site**: `build_galleries.py` entry `slug="garyvee"` copies the walk repo's `site/` into `assets/garyvee/` and writes
  `garyvee.html` with twelve stills from `site/shots/`. Also: NAV, MORE line A and the footer in `assets/site.js`, the home
  WALKABLE GALLERIES card in `index.html` (picture `assets/home/now-garyvee.jpg`, written by build_galleries; the heading now says
  twelve places), `build_deploy.py` page and folder lists, `build_seo.py` sitemap and llms line, the gitignore pair.
- **GitHub branch**: `clouds-and-dirt`, see the walk repo's git log for the sha, with a row in the main README.
- **Not deployed.** build_galleries and preflight ran clean (no problems). Deploy only through `deploy.sh`, and only when MLow
  says. Run `build_seo.py` then `build_og.py` before `build_deploy.py`, or `deploy.sh` refuses for a missing share card.

## Rebuilding

From the walk repo: `python3 _build/build.py` (all) or `--js` (code only), then from this repo's `_build`:
`python3 build_galleries.py`, `python3 preflight.py`, `python3 build_seo.py`, `python3 build_og.py`, `python3 build_deploy.py`.

## Things that will bite

- The cast and props are read from `../ON LOCATION 2026-10-10/work/glb_pass` (and `glb_draco`), the cat, pigeon and rat from
  `../THE MARKS GALLERY 2026-10-09/work/glb_pass`. Move or prune those folders and the build loses its models.
- The plates and walls came from Adobe Firefly in the user's Chrome (Nano Banana Pro, 2K), run as a page side loop through the
  extension; the raw files live only in the walk repo's `work/` (not in git), the finished ones in `site/assets/plates`, `depth`
  and `walls` (in git). The prompts are in `tools/plates.tsv` and `tools/walls.tsv`.
- Three plates are flat (`flat:` in rooms.js: Park Avenue, the field, the sky). A depth mesh of a one point perspective avenue or
  a stadium smears into a band at the horizon, and a deep neighbouring plate shows over the low walls of an outdoor floor. A flat
  plate at 18 to 30 m stays inside its own room.
- The content machine on floor 25 renders a second camera into a render target every other frame while you are on that floor;
  the visitor's avatar is on layer 1 and only that camera sees it. The screens are hidden during that render or they feed back.
- Headless tests must set `window.__POWER.blurred = false`: an unfocused tab runs the tricks at a third of the speed.
- The disk: this session started at 146 MB free and twice fell under 300 MB mid build (Chrome's cache refills while Firefly
  runs). `~/.codex/generated_images` holds 3.9 GB, the Trash 2.19 GB of verified duplicates, Downloads 65 GB. Nothing of MLow's was
  deleted; only caches.

## Free GLB swaps (2026-10-28): none made

Every object the 2026-10-28 audit lists for V2 was checked against the models already on disk. None was swapped:
the thumb, helmet, claw machine, press, carousel canopy, computer, lift, sled and hoops need a paid generation or a
Sketchfab download by MLow. The three free candidates were rejected on sight: Poly Haven `metal_office_desk` is a grey steel
tanker desk, not Spector's long white benches on floor 25; `portable_searchlight` is a hand lamp and would lose the lit
floodlight faces nine metres up; `wooden_bucket_01` is the wrong object for a chrome wine spit bucket. Nothing in the walk
repo changed. The flower headed extra waits on the ON LOCATION trial.

## The crowd: whole characters from the cast (2026-10-28)

MLow approved the ON LOCATION crowd trial for every gallery, with whole characters: the flower headed extras in V2 (build.js and
the four wing files) become whole cast characters with their own sculpted flower heads, the sprite head hidden. Default on;
`?crowd=old` brings back the old figures. The VeeCon crowd stays instanced: eight whole characters at 380 triangles, one
InstancedMesh each. VeeCon filled to 7,000: 443k to 584k tris desktop, 223k to 286k on the phone path (+28 percent). The vf_
figures, the usher guards and the studio's see through ghost are untouched. Files come from `../ON LOCATION 2026-10-10/work/glb_pass`
(ON LOCATION's `crowd_pass.py`); see the walk repo README. Shots `../UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/garyvee_*`.
Not verified: by hand, on a real phone. Not deployed.
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

## V1 at /garyvee-v1, round two (2026-10-28)

MLow approved porting tonight's V2 work to V1: the whole character crowd, the rigged cast with the head turn fix, VeeCon as
instanced whole characters (300 triangles), the strategist and trader leads recast, and one free swap (the Dirt's folding
table is two Poly Haven steel desks). See `../CLOUDS AND DIRT 2026-10-22/README.md`. Not deployed.
