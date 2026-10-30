# THE WRAPPED WING

**The night the museum got M.Textured.**

A walkable three.js gallery by MLow, built with NEW YORKERS (2026-10-30). A wrap crew got into a great New York
museum after closing and wrapped every antiquity in the building in a painting from the census. You are holding the
gun. Press F at anything that stands, a statue, a prop, a guard, and it takes a painting. Eight rooms, one trick in
each, twenty five easter eggs, ninety six census New Yorkers on the walls, dealt from the blocks around the museums.

Every statue is one of MLow's own **M.Texture wrapped GLBs** (`~M.Texture~`, the app that wraps any GLB in his art):
Smithsonian and Three D Scans objects wrapped in his paintings, 59 of them in this wing, pulled from the WRAPPED folder
on his Drive. The props are Poly Haven (CC0) models passed through the NEW YORKERS Blender lane on the `on-location`
branch. The cast are ON LOCATION's Tripo New Yorkers with eye flowers for heads. Every room opens onto a photograph
rebuilt as geometry from its depth map (the MONA pass), reused from the earlier worlds' plate archive.

Open it: double click `Open THE WRAPPED WING.command`, or serve `site/` with any static server. `?room=court` starts
in a room; `?auto=1&nolock` skips the card for a headless check.

| # | Room | The plate | The trick |
|---|---|---|---|
| 1 | Gallery 823 | the paintings gallery | the M.TEXTURE gun (F) and two guards who only walk while you are not looking at them; reach you and you are escorted to the door |
| 2 | The Temple | the park through the glass | a reflecting pool that shows the sphinxes plain: the wrapped sphinxes are on a layer the reflection camera cannot see, marble twins on a layer only it can; three riddles |
| 3 | The Court | the concourse | every god wrapped; a census painting cut into thirty six tiles and thrown down the court along rays from one gold star, where it lines up |
| 4 | Arms and Armor | the grand ballroom | the audio guide that lies: pick it up and every object speaks (speech synthesis) a confident falsehood |
| 5 | The American Wing | the period staircase | DO NOT TOUCH: touch Washington and the alarm goes red, the guards walk; wrap the alarm box to silence it |
| 6 | The Gift Shop | the bookshop | gaze inflation: every price tag climbs while you look at it; the SAME DIFFERENCE posters on the rack; the bodega cat at the register |
| 7 | The Roof Garden | the roof over Times Square | the moon illusion: huge on the skyline, a coin overhead, driven by pitch; a wrapped Hubble as binoculars (Z) |
| 8 | The Conservation Lab | the vault | the gun runs backwards: unwrap ten originals down to the stone; the tenth will not come off (it was never wrapped) |

## The wrap

`wrappable(group)` arms every mesh of a loaded GLB with its shipped material. `fire()` raycasts from the camera centre
against every armed mesh within a room of the visitor and swaps the hit object's material for a `MeshStandardMaterial`
whose map is one of the room's census paintings, on the model's own UVs, which is exactly what M.Texture does offline.
`applyMarble()` is the unwrap. The HUD counts wraps; the lab's certificate reads the count back.

## Build and check

```
python3 ../_shared/build.py wrapped-wing          # art, plates, models, data.js, bundle, index.html
python3 ../_shared/build.py wrapped-wing --js     # code only
python3 ../_shared/shot.py wrapped-wing work/shots court=room=court --wait 12   # headless screenshots (Playwright Chromium)
```

`_build/spec.json` names each room's plate (`world/plate`, with a flip, a tint or a desaturation) and the neighbourhoods
its New Yorkers come from. `_build/gallery.json` and `_build/shell.json` carry the names, hooks, roster and copy that
`../_shared/patch_main.py` and `../_shared/shell.py` write into the engine and the page. The engine is LIVE FROM THE
SEWERS' (`_build/src/main.sewers.js` is the pristine copy; `main.js` is the patched one). The vault of sources
(`../_shared/vault`) is filled from the git branches: see `../_shared/README.md`.

## House rules kept

No em dashes in copy. Every sign in quotation marks (Abloh owns the text). One safety orange object per room. CC0
before generation. One trick per room, and a room only undoes what it did (the lab resets the gun on leaving). Code,
never an artifact.
