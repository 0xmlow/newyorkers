# THE GARDEN in Cycles

The Blender build of the arena, for photoreal stills. The Python generator is the source of truth; never patch the .blend.

```
python3 blender/textures.py                       # court (8K), retired banners, scoreboard faces, ribbon -> blender/tex
Blender -b blender/dl/hbm/.../human_base_meshes_bundle.blend --factory-startup --python blender/export_bodies.py -- blender/work
python3 blender/people.py                         # pose and dress the bodies -> blender/work/pose_*.npz
Blender -b --factory-startup --python blender/build_garden.py -- qa|full [view ...]
```

Views: upper, courtside, baseline, rafters, bridge, scoreboard, east, crowdcheck. qa is 1280x720 at 64 samples; full is
2560x1440 at 256 samples (Metal, OIDN, AgX). Output in blender/renders.

Sources: Blender Human Base Meshes v1.4.1 (CC0, download.blender.org/demo/asset-bundles/human-base-meshes), Poly Haven
laminate_floor_02 and fabric_pattern_07 (CC0). No 3D model of the arena itself could be used: the only Sketchfab hit
("MSGS AJR") is a 6k face fan model; the plan here is the walk's layout.js at real size.
Art: MLow's NEW YORKERS on the scoreboard, the Firefly fascia on the ribbon, Firefly banners over the long sides, the
Firefly centre circle on the court, the N3W YORKERS 1,111 banner among the retired numbers (numbers only, no names or marks).
