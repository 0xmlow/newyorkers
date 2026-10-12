# THE SPIRAL, SKELLY CUP as a walkable marble run tower

Wright's Guggenheim reimagined as Bryan Brinkman's Marble Run. Three.js r128, one file (`site/index.html`), no build step to play.
On the site it ships as `spiral.html` through `NEW YORKERS SITE/_build/build_galleries.py` (copied whole into `assets/spiral/`).

## What hangs where
- **The ramp**: one turn per tournament, oldest at the street. Per turn: the turn sign, 20 heats, 4 semis, the final, the champion's bay
  (Champion's Portrait, ink and lane colour frame, glass marble on a plinth). The champion's heat, semi and final carry a lit square and a
  line along the wall to the bay. Races with no painting hang as "wet tape" tiles drawn from the ledger (winner, lane, time, seed);
  races the ledger slept through (T15, T16, T35 to T41) say NO TAPE.
- **The void**: champion pennants (they stack into one column, T1 at the bottom), the jumbotron (live), the 42 cards as a mobile, the cups.
- **The glass**: the landing at the top and a glass floor over the drop.
- **The paddock** (the oval next door): 100 stalls, census rider over the holder painting, plaque with lifetime stats, lamp lit while the
  marble is alive in the live tournament. Five marbles lap the chalk infield.
- **The street**: lobby (2.1 m, then 176 m), bodega with the commercial on its TV, brownstones, the hero billboard with Bryan's credit, taxis, pigeons.

## Bryan's marbles
Every marble you see racing, on a champion's plinth, on top of the dome, lapping the paddock or over the stall you look at is
Bryan's own GLB, the one his viewer races, read from `marblerun.fun/marbles/manifest.json` (IPFS). `data.json` carries a copy
for when his server is down. Loaded only near you, at most 18 at once (9 on a phone); our glass marble stands in until it lands.

## Live
`/api/state` and `/api/champions` at boot (the live tournament becomes the top turn), `wss://marblerun.fun/ws` after. On `race_start` five
marbles drop from the top and roll the parapet gutter; they bunch above the cups until `race_result`, then finish in Bryan's order.
The order is his; the roll is ours (said in the replay toast). R (or the Ride button) rides a marble on a camera locked to it, with its place and the run it is passing; click to switch marbles, R or ESC to get off. Single clicks never lock the mouse; double click does, so the buttons always work. Typing `blow` while a race is at the gate POSTs a client
seed to his API, as skelly.html does.

## Rebuild
```
python3 ../MARBLE\ RUN\ x\ NEW\ YORKERS\ 2026-10-08/ledger.py   # refresh the ledger (2 GETs)
python3 _build/build_data.py                                    # data.json, atlases, cards, film into site/assets
cd ../NEW\ YORKERS\ SITE/_build && python3 build_galleries.py && python3 preflight.py
```
Testing: `_build/stage.sh` copies site/ to the scratchpad, serve it on 4311, headless Chrome on 9333 with `--disk-cache-size=1`
(the default profile filled the disk once), then `_build/shots.py` or `_build/still.py`.

Eggs (12): gm, skelly, blow, brinkman, rekt, wagmi, seed, fuhgeddaboudit, the Konami code, the golden marble on T15, the pigeon at the top, standing on the glass.
