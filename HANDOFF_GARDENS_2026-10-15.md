# Handoff: MLOW GARDENS at /gardens (2026-10-15)

MLow's code generated amusement park (ARCHITECT/mlow-park, v5 now) became a walkable gallery, the eighth
in `build_galleries.py`, beside the airport. Nav: MORE, line N (the N runs to Coney Island). Footer: The
census column. Deployed 2026-10-15 (build 20261015-080503) and pushed to GitHub branch `mlow-gardens`.

## What it is

- Walk repo: `../MLOW GARDENS WALK 2026-10-15/` (`site/`), copied to `assets/gardens/` by the builder;
  only `assets/gardens/poster.jpg` is tracked, as with the airport. GitHub branch named `mlow-gardens` in
  the entry, pushed as an orphan snapshot (update it with a new commit on top, never a force push).
- Generator (source of truth): `ARCHITECT/mlow-park-v5/` (`build_v5.py`, `v5_ny.py`), rebuilt end to end
  by `web/build/build_web.sh` (Blender build, bake, gltf-transform, textures, the hang). Copy
  `web/site/` into the walk repo afterwards and commit there, then rerun `build_galleries.py`.
- The hang (`web/tools/make_art.py`, reads `assets/data.js`): all 103 Coney Island New Yorkers (the
  boardwalk front faces in era order from the gate, then the coaster station posters, plaza totems and
  boardwalk backs), Prospect Park and Flushing Meadows in LUNA HALL, Central Park to fill. 179 slots.
  Plaques open `/n/<id>` in the top window.

## Architecture added in v5

THE BOARDWALK replaces the old boulevard (timber deck, pergola colonnade, lamps, benches, two kiosk
courts); LUNA HALL, a 72 by 28 m ribbed glass vault gallery with an entrance tower and the Million
Lights; real stations for all ten coasters (plinth, stair, roof, poster totems); a ring of double sided
totems round the logo plaza; art boards on the circuit; the ring path is now a flat paved band (it was
a 3.2 m tube, a berm).

## Light and textures

Real time, not baked: a gradient golden hour dome whose horizon is the fog colour, a low sun whose
shadow map follows the walker (redrawn about five times a second), ACES. Generated tileable PBR maps
(turf with mow stripes, pavers, boardwalk planks, asphalt, terrazzo, concrete, metal, foliage, wood,
sand, mulch) are picked by material name and projected in world space. Power policy as
HANDOFF_POWER_2026-10-12.md.

## Numbers (headless, desktop)

About 1.0M triangles, about 630 draw calls, GLB 5.6 MB, the walk 32 MB with the art.

## Not verified

- Not walked by a person in a live browser; views are headless frames.
- Phones: the page passes at 390 (no horizontal scroll, warp audit clean at 375 and 768); the 3D on a
  real phone was not tried, and 1M triangles may be heavy there.
- `build_all.sh` and `build_seo.py` were not run, so the sitemap does not list /gardens yet.
- The baked animation clips were slowed in the page (GP cars, wheel, trains); the blimps loop out and
  back. The ride cameras were checked in one frame, not ridden through a whole lap.

## Shots and tagline (2026-10-15, later)

`build_galleries.py` takes two optional keys per gallery: `tagline` (a line under the h1) and `shots`, a list of
(file inside the walk repo's site/, caption) drawn as a captioned grid under the description, each opening the full
frame. Their CSS is added only to galleries that use them, so the other gallery pages stay byte identical. The nine
gardens shots are 1280 x 720 JPEGs in `site/assets/shots/` of the walk repo, also used by the GitHub README. The copy
follows the jackbutchertweet rules (point first, colon pivots, nouns at the end).

The rides were fixed at the same time: follow path offsets put car k ahead of car k-1, so `acar0` was the LAST car.
The rides now take `Shockwave_acar4`, `GardenRun_acar3`, `WildMouse_acar1` (scene.json `rides`); BLOSSOM GP stays in
car 0 at the back of the pack on purpose. `scene.json` is fetched without a version, so a returning visitor may keep
the old one for up to the browser cache floor.

## The rigged cast in the stands (2026-10-28)

Walk repo commit 02b3014. The 368 grandstand spectators (generator `crowd_template`, a box with a ball head) are now
rigged NEW YORKERS from `UPGRADE ALL ROOMS 2026-10-28/rig`, ten standing cast members at 0.88 of the 1.88 m rig on the
same steps, facing the track. `site/assets/rig/` holds `rigcast.js` (shared with the airport and THE SPIRAL) and 20
GLBs, 3.6 MB. Far: one InstancedMesh per character from the lite rig in rest pose. Near: the 20 closest (8 on a phone,
inside 40 m, 22 on a phone) are skinned clones on idle with a head turn to the visitor (60 degree clamp, body past
that), and cast shadows. The crowd meshes are merged on their own (`crowd|` keys) so they can be hidden; they hide
only after every file loads. `?rig=off` keeps them. The seated robber was tried one in five and dropped: from the
track only his flower showed over the step edge. Numbers (headless desktop, stands view): 85 draw calls against 62,
656k triangles against 314k, mixers 0.09 ms. Film: `UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/gardens_idle_headturn.mp4`.
Not verified: a real phone, the shadow cost of 20 skinned casters, the far tier at the swap distance on a slow GPU.

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
