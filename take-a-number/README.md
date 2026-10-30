# TAKE A NUMBER

**A museum of New York lines.**

A walkable three.js gallery by MLow, built with NEW YORKERS (2026-10-30). Eight lines the city stands in, one trick in
each, twenty eight easter eggs, ninety six census New Yorkers on the walls. You take a ticket at the DMV in room one
(a real number, nine million something, against a board that is on 4) and carry it through every line until the
departures board at Grand Central calls it. Lose it at the deli and it costs fifty.

Props are Poly Haven (CC0) through the NEW YORKERS Blender lane, a few of the things on the shelves are MLow's M.Texture
wrapped objects (the carrot cake, the wine, the watch, the lighter, the tyre, the megaphone), the people in the lines
are the house extras and ON LOCATION's Tripo cast, every head an eye flower. The plates are the earlier worlds' depth
photographs (the endless office desaturated into the DMV, the market aisle, the disco, the deli, the boutique, Santa's
court, the bar, the concourse).

Open it: double click `Open TAKE A NUMBER.command`, or serve `site/`. `?room=club` starts at the rope.

| # | Line | The plate | The trick |
|---|---|---|---|
| 1 | Take a Number | the endless office | the ticket machine deals a real number for the whole museum; NOW SERVING counts up every eleven seconds, and sometimes down |
| 2 | The Line for the Line | the market aisle | a treadmill aisle: walk forward in the line and the shelves slide with you; walk backwards and it lets go |
| 3 | The Rope | the disco | the bouncer is an inverse weeping angel: the line (and you) only move while you are not looking at him; get in without a glance |
| 4 | Hold the Ticket | the deli | a ticket you can lose: the man by the pickles takes it when you pass; pay with it and it is 26.50, without it 50 |
| 5 | The Drop | the boutique | the line moves only while you stand still; stock drops every ten seconds; the resale table has the same shirt at ten times |
| 6 | The Maze | Santa's court | the loop door: the exit sends you back to the entrance twice, the third time it lets you through |
| 7 | The Bathroom Line | the bar | Schrodinger's stall: occupied while you look at it, vacant when you walk away; get in backwards |
| 8 | The Front of the Line | the concourse | the departures board lists every line in the museum; stand on the gold star under the clock with the ticket and your number flips up, with the paper |

## Build and check

```
python3 ../_shared/build.py take-a-number
python3 ../_shared/shot.py take-a-number work/shots club=room=club --wait 12
```

Same layout as THE WRAPPED WING: `_build/spec.json`, `_build/gallery.json`, `_build/shell.json`, the SEWERS engine
patched by `../_shared/patch_main.py`, the vault in `../_shared/vault`.
