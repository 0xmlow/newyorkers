# N3W YORKERS SPACE PROGRAM

**The only way out of a lease.**

A walkable three.js gallery by MLow, built with NEW YORKERS (2026-10-30). The city has a space program now, funded by
the fare hike and run out of a parking lot at Floyd Bennett Field. Eight stages from the countdown to splashdown, one
trick in each, thirty easter eggs, ninety six census New Yorkers on the walls dealt from the blocks each stage stands on.

Every spacecraft is one of MLow's **M.Texture wrapped GLBs**: NASA and Smithsonian models (the lunar module, Hubble,
Curiosity, InSight, MAVEN, the Mars orbiters, Magellan, MESSENGER, both Deep Space Network dishes, the Apollo 11 command
module, a dozen satellites, three asteroids, a supernova) wrapped in his paintings, from the WRAPPED folder on his
Drive. Props are Poly Haven (CC0) through the NEW YORKERS Blender lane, the cast are ON LOCATION's Tripo New Yorkers.
The plates are the earlier worlds' depth photographs, retinted: the pigeons in the snow desaturated into the Sea of
Tranquility, the red hydrant street multiplied into Mars.

Open it: double click `Open N3W YORKERS SPACE PROGRAM.command`, or serve `site/`. `?room=moon` starts on the moon.

| # | Stage | The plate | The trick |
|---|---|---|---|
| 1 | Mission Control | the trading floor | the watched countdown: T minus ten runs only while nobody in the room is looking at the board; five GO calls |
| 2 | The Launch Pad | the beach with Liberty in it | a dolly zoom on approach (the lens narrows, the engine pulls the camera back, the pad never gets closer); click the rocket and ride up the tower and out of the room |
| 3 | The Capsule | a subway car | zero G: SPACE pushes you off the floor, walking drifts with inertia, the command module and a duck tumble past, the airlock chimes |
| 4 | The Moon | the park in snow, desaturated | one sixth gravity (SPACE jumps 2.5 m), footprints that stay (an InstancedMesh), alternate side parking: move the lander before the sweeper writes a ticket |
| 5 | Mars, the Bodega | the red street | light delay: everything you click answers three seconds late; coffee a dollar |
| 6 | The Hubble Room | the courtyard | binoculars through a wrapped Hubble (Z) and twelve live windows on one canvas atlas at eight frames a second; one of them is wrong |
| 7 | The Asteroid Belt | the World's Fair | whisper into one dish and it arrives at the other, spoken; asteroids on arcs toward you, click to catch |
| 8 | Splashdown | the ferry | the parade you join: hold pace with the column for four seconds and the city throws five hundred pieces of paper |

## Build and check

```
python3 ../_shared/build.py space-program
python3 ../_shared/shot.py space-program work/shots moon=room=moon --wait 12
```

Same layout as THE WRAPPED WING: `_build/spec.json`, `_build/gallery.json`, `_build/shell.json`, the SEWERS engine
patched by `../_shared/patch_main.py`, the vault in `../_shared/vault`.
