# THE EVICTION: 4F

A walkable three.js world by MLow, built on two NEW YORKERS: **The Eviction** (No. 47, Villains, Brooklyn: the skeleton
in the cap, the stamp, the notices in the wind) and **The Landlord** (No. 39, Villains, Citywide: the ring of keys, the
towering figure). It is one Williamsburg tenement under the J at Broadway and Marcy Avenue, and the year that apartment
4F was emptied, October 2026 to October 2027. It's the sister of ON LOCATION and ON RECORD and runs on the same engine.

Open it by double clicking `Open THE EVICTION.command`. Links: `?chapter=0` to `?chapter=12` opens 4F at that month;
`?room=apartment` starts in a room.

| # | Room | The trick |
|---|---|---|
| 1 | Broadway under the J | The el overhead on riveted columns. A train goes over every half minute or so: the light through the ties strobes on the wet street, the street shakes, the paper in the gutter lifts. **The curb**: whatever has left 4F is piled on the sidewalk, chapter by chapter, under a FREE sign. |
| 2 | The Vestibule | Twenty brass mailboxes. They go VACANT one by one as the year runs. **The peephole of 1A**: put your eye to it and you see the hall from behind yourself, with The Eviction standing right behind you. |
| 3 | The Fourth Floor | The painting made walkable: eye flower murals, the fluorescent tube, the J on the bridge through the windows, notices blowing down the hall. **He only moves when you are not looking**, and when the light goes out. If he reaches you, you are served. |
| 4 | 4F | **The diorama**: a railroad flat (kitchen with the tub in it, parlour, bedroom, back room on the J) seen from the landing through its open front, like a shadowbox. It's built in forced perspective: every room is narrower, lower and smaller than the last, the floor rises, the wallpaper shrinks, so 9.6 m reads as about 20. Stand on the mark and the view narrows to the box; walk in and you are a giant by the back window. **The year**: tear the calendar and the movers carry the next thing out (it lands on the curb in room 1). One frame comes off the wall each month and leaves its pale rectangle. PIN THIS MONTH keeps the flat there; FOLLOW THE CALENDAR goes back to the live New York month. The music box waltz loses notes as the flat empties. |
| 5 | The Management Office | A wall of two thousand keys that jingle as you pass. **The towering figure**: The Landlord grows the closer you walk to his desk, up to about five metres, and shrinks as you back away. |
| 6 | Housing Court, 141 Livingston Street | **The treadmill**: north of the benches, every step toward the clerk's window is cancelled and the floor scrolls under you. Take a number at the door; when NOW SERVING reaches it, the floor stops. At the window: adjourned. |
| 7 | Tar Beach | The roof: a cedar water tower, a pigeon coop, string lights, the bridge. **Open the coop**: the flock flies out over the river, draws an eye flower in the air above the bridge, and comes home. |
| 8 | The Penthouse | By the "Dynamic NFTs with New Yorkers assets" session (`_build/src/r_penthouse.js`, `work/penthouse/README.md`): The Landlord at home over Central Park. Rent Day flips the painting over the fire; it gains a gilded thing for every thing 4F loses. |

## The dynamic token, as a room

4F is the pin demo from the Dynamic NFT outlines (idea 28, "The Eviction Diorama"), and it runs without any contract:
the state lives in `kit.js` `CH` (`live` from the New York calendar, `pinned` in localStorage `evict.pin`, or `?chapter=`,
`preview` from the calendar). It ports to an ERC-7160 contract unchanged: chapter n is the appended state, the pin is
the holder's pin. The census contract is plain ERC-721 and cannot pin. KEYSTONE on Transient Labs can, and so can a
new 7160 contract. That choice is MLow's.

## How it was made

- **Engine**: ON RECORD's, forked whole. New: `kit.js` (the shared kit, the year `CH`, the figure reliefs, the stamp,
  the paper, procedural tile, linoleum, tar and pressed tin, `liveTex`), one file per room `r_*.js`, `build.js` reduced to the shell
  (per room ceiling height `h`, `wallFrom`, `noPlate`, `noNorth`, hung frames recorded on `r.hung`). Skate mode is off.
- **Plates and walls**: Adobe Firefly (Gemini 3, Nano Banana Pro, 2K) through Chrome for the seven plates, three walls
  and the two figures. Four walls came from ChatGPT ImageGen through the Codex CLI before it hit its limit.
  `python3 _build/depth.py work/plates_raw/*.png`, `python3 _build/walls.py`. The roof plate is cropped to the far view
  and laid flat (its own water tower and coop tore under depth).
- **The figures**: Firefly made a clean full figure of each villain from MLow's painting (The Eviction from the
  corrected master `work/penthouse/eviction_fixed.png`, so the stamp reads EVICTION). `_build/figs.py` keys the white out by
  flood fill from the border, so the skull stays, and Depth Anything gives the relief. `kit.relief()` turns it to face you.
- **Living pictures**: Seedance 2.0 on Dreamina, first and last frame the same plate so each loop closes on itself:
  the street, the roof, and the 4F window (also used in the fourth floor windows). In `site/assets/video/`. They play only
  near their room.
- **Props**: ON LOCATION's Poly Haven CC0 models and branded `nyb_` edits; the cast are its Tripo GLBs. No new 3D.
  The tub, the fridge, the radiators, the water tower, the stoop, the el, the coop and the mailboxes are built in code.
- **Build**: `python3 _build/build.py` (or `--js`). **Check**: `python3 _build/check_all.py work/check` renders every
  room headless. Trick tests use `shot.py --eval` with `window.__P` (the player) and `__clickables`, after setting
  `window.__POWER.blurred = false`.

## Not verified

- Never walked by a person. Every check was headless Chrome on this Mac with scripted positions and clicks.
- Fired by script: the curb at chapter 12, the bare flat, the shadowbox view, The Landlord towering, the flock, the
  hallway serve, the peephole. Not fired by script: the movers' walk out of 4F (the animation), the court treadmill and
  the number being called, the J passing over the street, the J light in 4F.
- The music and sound were never listened to.
- Phones: inherits ON RECORD's lazy rooms and phone guard. Untried on a device. The video loops add decode load.
