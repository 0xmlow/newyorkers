# BIGGER ON THE INSIDE: handoff (2026-10-17)

## Concept
One New York block where every door is bigger on the inside. Every room is a New York lack of space answered by an
illusion that only works online. MLow Impermanent Vision is the material language: a contour field that crowds and
bends toward every threshold, physical paint drips, and a sovereign Eye Flower that watches the street and the roof.

Image first: `concepts/01..07` (ImageGen, prompts in `tools/concepts.py`) set the look before any code. Window
interiors are ImageGen plates (three made for it, six cropped from the one point perspective concepts), so every lit
window on the block shows another room of the gallery.

## Rooms, effects and their contracts

| Room | Visitor action | Mechanism (what is real geometry, what is shader) | Notes |
|---|---|---|---|
| The block | walk the street, through any door, off either end | Street ends: two live portals that map the far corner onto the near one (same room), ping pong targets so they recurse a level a frame. Windows: interior mapping shader, one instanced draw per facade. Street: Reflector mirror as an additive overlay in a noise puddle mask. Steam: sprites. | Desktop only mirror. Loop portals 15.9 x 24 m. |
| Infinity Deli | walk the aisle | Real 260 m aisle, instanced shelves and stock (boxes, cans), then a depth plate (ImageGen aisle + Depth Anything V2) | The plate reads right from inside the aisle only. |
| 5 Eldridge | climb | Seven repeated floor copies; climbing past 3 m moves you down 3 m (carry), the art reassigns so nothing jumps. Penrose by translation, not a shader. | Landing doors: 5A to the studio, 5B to the street, ROOF on the half landing. Portals live on the floor 0 copy. |
| Apartment 5A | stand at the peephole, then walk in | Ames room: a rectangle with every vertex pushed along its ray from the peephole, P' = E + (P - E)(1.15 - 0.15x). Two identical bronze figures in the far corners. Walking inverts the warp (`unwarp`). | Art is warped with its wall and reads true from the peephole only. |
| Suds & Space | look into the dryers, walk the drum | Dryer windows: view only round portals (256 px) into each room's `cam` frame. The drum: a shader that spins (spiral, rings) round a still bridge. | The last dryer looks into the laundromat itself. |
| Bigger on the Inside St | ride | The whole train (8 cars, riders, lights) rolls about its axis at 0.16 rad/s; the visitor stands on the axis (the haunted swing). Gangways are round hatches centred on the eye, so they stay doorways at any roll. Front window: a rushing tunnel shader. | Click a pole to stop the roll. |
| Tar beach | look up | ~2,000 instanced buildings on the inside of a 170 m cylinder, procedural window shader, glowing avenues, moving cabs; the depth plate of the street behind the back parapet. | Fog thinned so the fold reads overhead. |

Every portal: frame A in room A (+z into A), frame B in room B (+z into B), virtual camera B . Ry(pi) . A^-1 . camera,
`frameCorners` off axis projection, near plane on the far doorway. Crossing: segment from last to this frame through
the doorway rectangle, camera and yaw carried. Budget: the two nearest visible portals every frame, the rest every
sixth. The quad is pushed 45 cm behind its doorway while you pass through, so it never clips.

Reduced motion: no animation (time frozen: steam, drum, roll, cabs, flowers, flicker); flights become jumps.

## Assets (provenance in `public/manifest.json`)
- Art: 166 New Yorkers, 1000 px display copies from NEW YORKERS SITE/assets/t, picked per room by title keywords.
- Posters: 54 of MLow's NEW YORKERS posters (ALL-NEW-YORKERS-POSTERS), 768 px tall, uncropped.
- Stickers: 76 of MLow's stickers (ON LOCATION work/stickers), 256 px.
- GLB: 33 props from the museum pack (MLow's blue marble baked finish), unchanged.
- PBR: CC0 surfaces and the Poly Haven night HDRI via the museum.
- Plates: ImageGen (ChatGPT via the Codex CLI) and Depth Anything V2 Small (local).

## Validation (what was actually checked)
- `npm run check` and `npm run build` pass.
- Headless Chrome on this Mac's GPU: every viewpoint of every room as a still (`tools/review.sh`), plus the built site
  at 1440 and 390 wide with the interface.
- Scripted walks in a browser (`inside.advance`): street to bodega, walk-up, laundromat, subway; walk-up to studio
  and roof; roof to walk-up and laundromat; back out of each; both street loops; climbing the stair one floor (the
  counter and the paintings advance).
- Draw calls per frame across all passes after `batchStatic`: block 1,372, subway 656, walk-up 457, laundromat 317,
  studio 254, bodega 224, roof 155. CPU per frame in a hidden tab 1 to 6 ms. These are not GPU frame times.

## Not verified
- No person has walked it end to end. No real phone, no weak laptop, no measured GPU frame time.
- Mobile gets no AO, no bloom, no street mirror, one portal pass a frame; that path is only checked at 390 px.
- Sound: there is none.
- ImageGen hit ChatGPT's usage limit after ten images: the depth plate for the subway tunnel and six window
  interiors were cut from the concepts instead of made fresh (tools/concepts.py still lists them; rerun it).

## Next, in order
1. Real device pass: phone and laptop, frame time after warm up, then adaptive resolution from evidence.
2. Generate the missing plates when ImageGen is back (`python3 tools/concepts.py`), rerun `make_assets.py`.
3. Sound: the block at night, the bodega hum, the train.
4. More of the block: the far side of the hoarding, a fire escape you can climb to the roof.
