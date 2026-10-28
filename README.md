# SAME DIFFERENCE

A walkable three.js museum by MLow of New Yorkers who sound the same: PROFIT // PROPHET, BRAKE // BREAK, KNEW // NEW,
TAWK // TOCK. Every picture is a diptych of two New Yorkers painted in MLow's hand, and every room is a different way to
make the pair move: where you stand, what you click, the light, the New York clock, a whisper, a train. It's the sister
of THE EVICTION, ON RECORD and ON LOCATION and runs on the same engine.

Open it by double clicking `Open SAME DIFFERENCE.command`. `?room=whisper` starts in a room.

| # | Room | The frame | The trick |
|---|---|---|---|
| 1 | Coming // Going | Lenticular, a subway platform | Each ad is a wall of real prisms: one face of every prism carries a slice of word A, the other a slice of word B. Walk past from the west and it's PROFIT, from the east PROPHET. Stand dead centre and you get both in stripes (an egg). |
| 2 | Departures | Split flap, the main concourse | Each picture is nine flaps that turn over top to bottom with a clack, and the word above rolls letter by letter (MORNING to MOURNING). Each board runs on its own clock, a click flips it now, and on the real New York hour they all go. The big board lists every pair as a train. |
| 3 | Open // Closed | Two sided signs, a deli | The pictures hang on strings like the OPEN sign in a deli door, word A on the front, word B on the back. Walk past fast and your draft spins them; they wind and settle. The menu is spelled wrong on purpose (a bacon egg and cheese on a ROLE). |
| 4 | The Two Way Mirror | Light, a precinct interview room | A wall of one way glass. Your side lit: the glass is a mirror showing A. Their side lit: you see B sitting at the table behind. The switch by the door has OURS, HALF (Pepper's ghost, both at once) and THEIRS. Cup your hands to a pane and you see through it anyway. |
| 5 | The Whispering Gallery | Sound, the vaults by the Oyster Bar | Two Guastavino tile groin vaults. Whisper into a corner (click it): the browser says the word, a spark runs up the tile and down to the opposite corner, and it arrives as its New York twin. The accent pairs live here. |
| 6 | Manhattanhenge | New York time, 42nd Street | The sun sets down the middle of the street. As it goes, the shadow climbs the facades, and each picture is A in the sun and B in the shade, the line between them rising. After dark it's B everywhere and the lamps come on. The clock on the corner switches to the real New York sun (day or night right now, from sunrise and sunset by the day of the year). |
| 7 | The Tunnel Blink | Light and a train, the 6 | A subway car with the tunnel streaking past. When the lights stutter and go out, every picture in the car comes back as the other word. |
| 8 | Stand Clear of the Closing Doors | Physics, a mezzanine of subway doors | Twelve sets of car doors, word A on the left leaf, word B on the right. Open, the pair hides in the pockets and the line shows in the gap; at the chime the doors close and the two New Yorkers meet as one picture. Click a door as it closes and somebody holds it (that pair never meets). Batch 2: PAIR // PEAR, MADE // MAID, MAIL // MALE, IN // INN, BARE // BEAR, HAIR // HARE, PEAK // PEEK, RIGHT // WRITE, NOSE // KNOWS, BERRY // BURY, BLEW // BLUE, DEAR // DEER. |
| 9 | The Gift Shop | ONE // WON, the posters | The poster series on the walls, and a scratch off on the counter: click the silver to scratch it a patch at a time. One ticket in five is the losing kind, the same word twice. The exit says EXIT // EXIT. |

`DIPTYCHS.md` is the longer playbook: fifteen ways to make a homophone diptych move, three variants each, the driver
behind each one (position, action, New York time, physics, light, sound, the chain), which pairs suit it, and where it
lives (the gallery, a post on X, a dynamic token).

## v2, the rebuild (2026-10-21)

MLow's verdict on v1 (live for one night): it looked bad and did not follow the virtual-architect skill. He was right:
v1 skipped the recipe (a set = plate + walls + cast + props + one trick). Every room was a closed box of procedural
plaster with a trick in it. v2 keeps every trick and puts each room in a real New York place:
- **Plates**: the north side of every room opens onto a photograph of its place, turned into depth (`tools/plate.sh`,
  `tools/plates.tsv`, `_build/depth.py`): the platform down the tracks, the terminal concourse at golden hour, the
  bodega's aisle, the squad room behind the glass, the vaults by the oyster bar, 42nd Street at Manhattanhenge, a
  train standing with its doors open, Fifth Avenue through the shop window. The tricks moved to the south and side
  walls to keep the plates clear; the platform plate was refired with an empty foreground.
- **Walls**: one ImageGen wallpaper per room (`tools/walls.tsv`, `_build/walls.py`); the subway car wears its own.
- **Props and cast**: Poly Haven CC0 props and the ON LOCATION cast in every room through one table each (`dress()` in
  `pairs.js`); lit ceiling fixtures in every indoor room (`build.js`, `fixZ`).
- **The house voice**: signs in quotation marks ("UPTOWN" // "DOWNTOWN", "TICKETS" // "TICKS", "INTERVIEW" // "IN A
  VIEW", "THE GIFT SHOP" // "THE GIFT, SHOP"), one safety orange object a room (the bumper block, the ticket sign).
- Manhattanhenge turned to face the sun: you stand in the street, the facades are the side walls, the sun is the plate.

## The art

- **pairs.json** is the list: 53 pairs (41 in batch 1, 12 in batch 2), the room each hangs in, the two scenes and the line. The accent pairs are TAWK //
  TOCK, SAWCE // SAWCE (sauce, source), CAH // CAW and TOID // TOID (third, turd).
- **The diptychs**: one 3:2 picture per pair, two scenes split down a thin seam, eye flower New Yorkers in MLow's painted
  realism. 32 came from ChatGPT ImageGen through the Codex CLI (`tools/panel.sh`, `tools/run_panels.sh`), until it hit its usage
  limit on 2026-10-20. The other 9 were made in Adobe Firefly on GPT Image 2.5 Sunburst, Wide 3:2 (`work/panels_todo.json`).
  `python3 _build/panels.py` finds each seam and cuts the halves into `site/assets/pairs/<id>_a.jpg` and `_b.jpg`.
- **The posters** (`posters/`): twenty four one-sheets in two batches of twelve (batch 2 on 2026-10-20 evening, all panels and posters from Firefly) made in Adobe Firefly on GPT Image 2.5 Sunburst (Tall 2:3, High), each
  with its own split (vertical, top and bottom, diagonal, cross section, back to back, same place two times, one scene
  two readings, the ticket) and title type chosen for the joke. `posters.json` is the brief, `make_prompts.py` writes
  `todo.json` (the expanded new-yorkers-movie-posters harness), and `finish.py` composites MLow's exact logo PNG into
  the corner each prompt left empty and writes `final/` and `final/manifest.json` with every prompt. The gift shop hangs `final/`.
- **Cast and props**: ON LOCATION's Tripo GLBs and THE MARKS's cat, read from `../ON LOCATION 2026-10-10/work/glb_pass` like THE EVICTION.

## Build and check

`python3 _build/panels.py && python3 _build/build.py` (or `--js` for code only). `python3 _build/check_all.py work/check`
renders every room headless and prints console errors. Trick tests use `_build/shot.py --eval` with `window.__P` and
`__clickables` after setting `window.__POWER.blurred = false`.

## Not verified

- Never walked by a person. Every check was headless Chrome on this Mac. Seen working by script: the lenticular from both sides,
  the split flaps, the mirror switch, the scratch off, the vaults, the shadow line, the tunnel blink. Not seen: the deli spin
  from walking past (only clicks), the New York hour flip, the real sun mode at night.
- The speech in the Whispering Gallery is the browser's own voice reading the New York spelling. Not listened to.
- Phones: inherits the engine's lazy rooms and phone guard. Untried on a device.
- v2 (nine rooms, 24 posters) went LIVE at n3wyorkers.com/same in build 20261021-111550.

## Rigged cast (2026-10-28)

Twelve cast names load rigged twins from `site/assets/rig/` (`_build/src/rig.js`, the loader in `main.js`): clerk, felix,
folksinger, hustler, lensman, loretta, oscar, sally, susan, tough, workgirl, writer. The static GLB is the fallback and
`?rig=off` keeps it. Nearest 20 (8 phone) idle and turn the head toward you within 6 m; sally and lensman do not look.
Static, no rigged twin: butcher, broker, agent, dad, maria, tracksuit, dress, assistant, usher, pigeonlady, jeweler, sonny,
bluesteel, bookseller, flyer. Platform desktop: 110 draw calls, 418k tris, rig CPU 0.06 ms. Film:
`../UPGRADE ALL ROOMS 2026-10-28/shots/rig_rollout/same_oscar_headturn.mp4`. Not checked on a real phone.

## This branch

**Walk it:** [n3wyorkers.com/same](https://n3wyorkers.com/same)

A clean snapshot of the walk repo at 36f6824 (2026-10-28), the way THE EVICTION and ON RECORD are published. The cloned
assets (the art, textures, environment maps, GLBs, the Draco decoder, fonts, `data.js`, `gallery.js`) are rebuilt by
`_build/build.py` from the NEW YORKERS site repo and ON LOCATION and are not carried here; raw generations (`work/`) stay
out. Props are Poly Haven (CC0); the cast are MLow's own Tripo characters from ON LOCATION; the diptychs and posters are
MLow's, made with ChatGPT ImageGen and Adobe Firefly. Every sound is synthesised in the browser.
