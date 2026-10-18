# THE PIGEONHOLE

**A museum inside a pigeon, inside a bodega, inside a dream you are having on the last train home.**
A walkable three.js exhibition for NEW YORKERS by MLow, built 2026-10-17. Twelve rooms at four scales. Each room is
inside something in the room before it, and the last room holds the first. 190 New Yorkers on the walls, 384 stickers
from the 301 to 2300 packs, 51 easter eggs, every illusion one that only works in a browser.

Open it: double click `Open THE PIGEONHOLE.command` (serves `site/` on localhost:4377). On n3wyorkers.com it is
`/pigeonhole` (`NEW YORKERS SITE/_build/build_galleries.py` copies `site/` into `assets/pigeonhole`).

## The line

| # | Room | Scale | The trick, and how it is made |
|---|---|---|---|
| 1 | Last Stop, 3:33 A.M. | I The dream | The end doors open onto this same car: a render target portal into its own room, rendered five levels deep, so the cars repeat to the vanishing point. Walk through and you are one car along (a seamless wrap); the third car opens its doors. The sky through the windows is a stencil pocket. |
| 2 | The Platform of Wrong Sizes | I The dream | A pigeon whose size follows your distance: pigeon sized from the train door, nine metres tall at its feet. The train's door is a live portal back into the car. |
| 3 | Pigeonhole Deli Grocery | II The bodega | The pigeon on the counter: her eye is a render target portal (k = 140) onto the nave inside her. Ride in and the cut cannot be seen. Five cooler doors are stencil pockets bigger on the inside. An Open Eye Flower cut into 256 scraps across the shop is one flower from the STAND HERE sticker. The CCTV monitor is a second camera, and in it you have a body. |
| 4 | The Cooler | II The bodega | Six glass doors down a 30 m frozen aisle, each a pocket into another place (Rockaway, the harbour, one huge eye, a mile of snow, an endless row of eggs, a bodega at one twelfth). A pigeon in a scarf you can never catch. |
| 5 | The Stockroom Stairs | II The bodega | Four flights that always go down and always come back to the first: a ground function plus a wrap at the seam, the stair instanced nine laps into the fog. The nest pigeon's eye is a second portal into the nave. |
| 6 | The Nave | III The pigeon | The neck as a cathedral: iridescent feather vault (view dependent colour) that breathes, coos on the out breath, a rose window eye that decides to let you through. |
| 7 | Lost and Found | III The pigeon | Everything the pigeon swallowed, curated: a car sized bagel, a pizza crust arch, Poly Haven props at 40 times. A reverse magnifier: through the lens, the gallery at its true pigeon scale, rebuilt around your eye every frame. |
| 8 | The Heart | III The pigeon | An opera house that has your pulse: stand still and it rests, run and it races, stare at the chandelier and it flushes red and doubles. |
| 9 | Hall of Flight | III The pigeon | The wing is a tube and gravity follows the wall: walk up the side, across the ceiling and round. |
| 10 | The Homing Dome | III The pigeon | A planetarium of the five boroughs; 40 New Yorkers lie flat at their neighbourhoods and pop up like a pop up book as you near them. A pin on the ceiling stays over you: YOU ARE HOME. |
| 11 | The Museum of Modern Pigeon | IV The museum | A vitrine holds the bodega at 1:12 and it is not a model: a portal into the real room with its roof clipped away, live, with a tiny you at the counter who turns when you turn. The big painting contains the room containing the painting (recursive portal, five deep). |
| 12 | The Gift Shop | IV The museum | Eleven snow globes, each a live portal into a room of the show. The big one on the counter holds the car: shake it, ride in, wake up on the N, loop N. |

## Making it

```
python3 tools/build.py            # everything: art, stickers, textures, plates and depth, models, bundle
python3 tools/build.py --js       # only the code and index.html
python3 tools/build.py --assets   # everything but the depth pass
python3 tools/shot.py work/shots a="room=bodega" b="room=museum&clean&cam=0,1.75,3,0,-0.55" --wait 12
python3 tools/package.py          # a portable zip with a checksum manifest, next to this folder
```

- `src/engine.js`: the engine (portals, pockets, anamorphosis, plates, hang, stickers, post pass, power policy).
- `src/rooms/*.js`: one file per room. `BUILDER_BRIEF.md` is the API and the house rules for anyone adding a room.
- `tools/prompts.json`: every generated image's prompt. They were made in Adobe Firefly (Nano Banana Pro, 2K) on
  2026-10-17 because Krea, the other image service and Codex ImageGen were all out of credits; `tools/firefly_jobs.js`
  is the queue that ran in the Firefly page. Masters are in `gen/raw` (not in git, not in the package).
- `tools/imagegen.py`: the same prompts through Codex ImageGen, for when its limit resets.
- Models: the ON LOCATION asset pack (Tripo cast, Draco compressed Poly Haven CC0 props). Stickers: the 301 to 2300
  packs. Depth: Depth Anything V2 Small, locally. Normal and roughness maps are derived from the colour (an approximation).

## Not verified

- Walked headless on this Mac's GPU only, never by a person end to end. Every room was shot from several angles and
  the rides (bodega eye, nest eye, gift shop globe) were run by script and land where they should.
- Not tried on a real phone. At 390 px the page fits and there is no sideways scroll. On a phone, decorative portals
  onto rooms you have not visited stay dark (by design, for memory). The gift shop is the heaviest room.
- Headless runs at a few frames a second, so time based effects (the heart's stare, the third car) were tested by
  forcing state, not by waiting.
