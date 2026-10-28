# Jardin Majorelle x MLOW

**A playable garden by MLow**

MLow's walkable Jardin Majorelle: the blue garden in Marrakech that Jacques Majorelle planted and Yves Saint Laurent and
Pierre Berge saved, at golden hour. Walk every path, climb to the upper terrace, meet the macaques, enter the villa
gallery and the YSL rotunda, find the eight lost YSL postcards, and hang your own work in the MLOW Pavilion by dropping
any image file onto the window.

A fan made tribute. Not affiliated with, endorsed by or connected to the Jardin Majorelle, the Fondation Jardin Majorelle,
Yves Saint Laurent or the Musee YSL Marrakech.

## Play it

Download `index.html` and open it in Chrome, Safari or Firefox. It is one file: every model is inside it, and the only
thing it fetches is three.js r128 from cdnjs.

| Key | Does |
|---|---|
| W A S D | walk |
| Shift | sprint |
| Mouse | look (click to lock the pointer; or drag; the arrow keys and Q also turn) |
| Space | jump |
| E or click | read a plaque, inspect a work |
| 1, 2, 3 | day, sunset, night |

On a phone: drag to look, the on screen buttons to walk. Drop an image anywhere to hang it in the Pavilion.
`?glb=off` brings back every original primitive, `?rig=off` the original tourists.

## What is in it

| Path | What it is |
|---|---|
| `index.html` | v2 (2026-10-28): the upgraded garden, one file, 4.3 MB |
| `v1/index.html` | the original (July 2026), code built, 158 KB |
| `tools/build.py` | rebuilds `index.html` from `v1/index.html`: patches it, adds `upgrade.js`, inlines the r128 GLTFLoader and SkeletonUtils, embeds the GLBs as base64 |
| `tools/upgrade.js` | the v2 upgrade: swaps, the rigged tourists, the fallbacks |
| `tools/glb/` | the processed Poly Haven models |
| `tools/ph_pass.py` | the Blender pass that made them: join, decimate, base colour only, small JPEG textures, base at the origin |
| `tools/shoot.mjs` | headless Chrome views, films and draw call numbers, before and after, with a seeded garden |

## v2, 2026-10-28

Every swap is built over the original: the primitive stays and hides only once its model has loaded, so a failed load
leaves the garden as it was.

- **Palms**: the 46 stacked cylinder palms are the NEW YORKERS museum tree kit's palm, two variants, instanced, alpha
  tested fronds with their own shadows; the crown height is kept, so the macaques still climb to it.
- **Euphorbia and the pots**: the tube bundles and the paper strip leaves are Poly Haven's quiver tree (an aloe tree),
  82k down to 2.4k triangles. The painted citron and cobalt pots stay: they are the true Majorelle pots.
- **Rocks**: 240 dodecahedrons become Poly Haven's Namaqualand boulder, 160 triangles, ochre.
- **Lamps**: the box lanterns become Poly Haven's pierced brass diya lantern, glowing with the day and night cycle.
- **Benches**: nine Poly Haven painted wooden benches along the bamboo alley, the pergola and the terrace, with colliders.
- **The square fountain**: the rim is tiled in the garden's zellige.
- **The tourists**: nine capsule people become MLow's own rigged NEW YORKERS cast (annieh, gown, workgirl, oscar, loretta,
  cabbie). They walk with planted feet, stop for a photo with the flash, and turn their heads to you within 7 m.
- Draw calls fall by about 40 percent (entrance, desktop: 3,276 to 1,859) because the palms, lamps, euphorbia and rocks
  are instanced.

Not checked: a real phone GPU and touch; pointer lock, walking and drag and drop by hand; the palm textures in Safari.

## Credits

- **three.js** r128 (MIT), with its GLTFLoader and SkeletonUtils (MIT).
- **Poly Haven** models, CC0 ([polyhaven.com/license](https://polyhaven.com/license)): `quiver_tree_02`,
  `namaqualand_boulder_02`, `brass_diya_lantern`, `painted_wooden_bench`.
- **The palm** is from the NEW YORKERS museum tree kit: Poly Haven bark (CC0) and a leaf card generated for the kit.
- **The tourists** are MLow's NEW YORKERS characters, rigged.
- No CC BY model is inside.

Art, code and the NEW YORKERS characters: MLow. Built with Claude.
