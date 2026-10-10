# THE MARKS: One Night in the City

A walkable three.js gallery for THE MARKS (release one of NEW YORKERS by MLow). Seven rooms of one
New York night, in a row: the avenue at 3 a.m., the Uncounted Deli, Uncounted St station, the
Department of the Uncounted, an alley off Canal, the Uncounted Theatre, the roof.

Open it: double click `Open THE MARKS GALLERY.command`. On the site it is `night.html`
(`NEW YORKERS SITE/_build/build_galleries.py` copies `site/` into `assets/night`).

## How a room is made (the MONA pass)

1. A Nano Banana Pro plate on Krea, 21:9 at 2K, eye level, 24mm, one point perspective, with three
   Marks, the N3W YORKERS logo and the eye flower as references so every label is ours.
2. `python3 _build/depth.py <plate>`: Depth Anything V2 Small, local and free, writes
   `site/assets/plates/<room>.jpg` and `site/assets/depth/<room>.png`.
3. In the browser (`plate()` in `_build/src/main.js`) the depth becomes a mesh seen from a camera 8 m
   behind a 12 m portal: 1/z = a*d + b, calibrated so the bottom row lands on the floor at eye height
   and the far end at the room's `far`. Triangles across big depth breaks are dropped (`tear`).
4. A wall mural per room (`_build/walls.py`), the Marks hung by census number, then the jokes.

## Heroes

GPT Image 2.5 concept on white, MLow twist written in, then Tripo H3.1 on Krea, then the museum's
`blender/prop_pass.py` into `work/glb_pass`. Tripo faces models any which way: render
`_build/front_sheet.py` and set `YAW` in main.js so every model's front is three.js +Z.

## Build

```
python3 _build/build.py        # assets from the site repo, data.js, bundle, index.html
python3 _build/build.py --js   # code only
```

## Not verified

- Phones: the touch stick is written but was not tried on a device.
- Frame rate on a weak laptop; seven rooms of plates and 159 textures are all loaded at start.
- The sound was not listened to (headless).
- The 15 eggs were not all triggered end to end; the stage, the card and the wake loops were.
- From hard side angles the plates stretch; they are meant to be seen from the room.
- Spend: Krea does not report a price per job. Roughly 24 Nano Banana Pro images at $0.15,
  21 GPT Image 2.5 concepts, 3 Ideogram edits, 22 Tripo H3.1 runs (price unknown).
