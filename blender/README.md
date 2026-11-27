# THE GARDEN in Cycles

The Blender build of the arena, for photoreal stills. The Python generator is the source of truth; never patch the .blend.

```
python3 blender/textures.py                       # court (8K), retired banners, scoreboard faces, ribbon -> blender/tex
Blender -b blender/dl/hbm/.../human_base_meshes_bundle.blend --factory-startup --python blender/export_bodies.py -- blender/work
python3 blender/people.py                         # pose and dress the bodies, heads off -> blender/work/pose_*.npz
Blender -b --factory-startup --python blender/cast_bake.py   # MLow's rigged cast frozen -> blender/work/cast.blend
Blender -b --factory-startup --python blender/build_garden.py -- qa|full [view ...]
```

Views: upper, courtside, baseline, rafters, bridge, scoreboard, east, crowdcheck. qa is 1280x720 at 64 samples; full is
2560x1440 at 256 samples (Metal, OIDN, AgX). Output in blender/renders.

Sources: Blender Human Base Meshes v1.4.1 (CC0, download.blender.org/demo/asset-bundles/human-base-meshes), Poly Haven
laminate_floor_02 and fabric_pattern_07 (CC0). No 3D model of the arena itself could be used: the only Sketchfab hit
("MSGS AJR") is a 6k face fan model; the plan here is the walk's layout.js at real size.
Art: MLow's NEW YORKERS on the scoreboard, the Firefly fascia on the ribbon, Firefly banners over the long sides, the
Firefly centre circle on the court, the N3W YORKERS 1,111 banner among the retired numbers (numbers only, no names or marks).

## Pass 2 (same day, after MLow: "people look very ai slop ... use my glb characters")

- The stands are MLow's NEW YORKERS cast (17 rigged figures from UPGRADE ALL ROOMS 2026-10-28/rig/out, two idle frames each,
  on their feet), 13,000 of them. The players, referees, benches and courtside row keep the posed bodies but wear the cast's
  flower heads (cut from oscar, workgirl, cabbie, editor, killer, rosemary, hustler).
- The stacked skyline logo (HONORARIES HYPE FILM 2026-09-26/_work/logos/10-stacked-skyline.png, MLow's pick) is 7.4 m over
  centre court, white in both keys, all round the apron, on the stanchion pads, the LED boards and the ribbon.
- The centre hung board is 24 x 16 x 11 m (twice the old one) with his New Yorkers on the long faces, the score and logo on
  the ends, a round belly screen with the logo, and wider rings. Two 30 x 7.5 m wall screens over the long sides and two
  curved screens over the ends show more New Yorkers and the logo.
- Light: a tighter court key, four broadcast lights from the catwalk corners, dimmer stands, thinner haze.
