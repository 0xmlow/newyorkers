# ONLY IN NEW YORK: the museum of everything that could not have happened anywhere else

A walkable, photoreal three.js gallery by MLow, built with NEW YORKERS. Seventeen rooms of the most iconic, hilarious and
ridiculous things that ever happened in New York City, each one real, each one rebuilt at human scale so you can stand in
it, with one trick you can only get by being there, three or more eggs, its own synthesised song, and twelve census New
Yorkers on the walls from the block it happened on (`HOODS` in `_build/build.py`). Everybody has an eye flower for a head.

Open it: double click `Open ONLY IN NEW YORK.command`. On the site it is n3wyorkers.com/only (`only.html`), registered in
`NEW YORKERS SITE/_build/build_galleries.py` as slug `only`, which copies `site/` into `assets/only`.

| # | Room | The fact under it | The trick |
|---|---|---|---|
| 1 | Please Swipe Again | the MetroCard, 1994 to 2025 | the exit turnstile says PLEASE SWIPE AGAIN three times and opens on the fourth, without apology |
| 2 | Showtime | the subway pole dancers, in a real car | clap on the beat with the captain; eight in a row and the whole car joins, including the one asleep under a coat |
| 3 | No Pants | the No Pants Subway Ride, since 2002 | twenty four riders, one of them in trousers, half behind a shopping bag; find him |
| 4 | Frozen | Frozen Grand Central, January 2008, 207 people for five minutes | everyone is frozen; hold still and they move, and the coffee lands |
| 5 | Pizza Rat | First Avenue L stairs, September 2015 | yield the stairway and he hauls the slice to the top; block it and he waits |
| 6 | The Line | the cronut line, Spring Street, 2013 | look away and somebody joins in front of you; you were No. 11 |
| 7 | The Rent Is Too Damn High | the 2010 debate, a 300 sq ft studio, tub in the kitchen | a rent meter climbs while you stay and the walls slide in; the tub stays full size |
| 8 | Sixteen Ounces | the soda ban, proposed 2012, struck down 2014 | drink and grow until the room is a hat; the cup never changes |
| 9 | Fearless | Bowling Green, March 2017, the bull, the girl, the pug | the bronze pug moves only while you are not looking, and gets to your shoe |
| 10 | The Lookalike | Washington Square Park, October 2024 | everyone is the same model; the mirror shows someone who is not you, with a ribbon |
| 11 | Hot Duck | the Pond, October 2018, with the owl who got out in 2023 | the duck swims to wherever you look; the press corps turns a little late |
| 12 | The Pigeon | the 16 foot pigeon on the High Line, 2024 | four hundred instanced pigeons scatter from your feet; the big one turns to count witnesses |
| 13 | Santas | SantaCon, since 1998 | a conga of twelve Santas retraces your actual path, with small delays |
| 14 | The Characters | Times Square, the costumed characters, the cowboy, the review in questions | an in world camera films you onto the big screen, between invented ads |
| 15 | The Rat Czar | City Hall, April 2023; the bin press conference, 2024; the groundhog, 2014 | put out the bin and the rats flee; catch the plush groundhog in the air |
| 16 | Historic | the potentially historic blizzard, January 26, 2015 | the shelves empty whenever you look away; click the forecast and it climbs |
| 17 | Seventy Six | the Coney Island hot dog contest, the Fourth of July | eat on the beat; the counter climbs; fireworks at seventy six |

Eggs are counted from the source at build time (`EGG_N`).

## Round two (2026-11-01, MLow: "still not perfect, make it much much better")

- **The cast**: every primitive extra is now a whole cast character from ON LOCATION (`_build/src/crowd.js`, the nearest twenty rigged),
  and people walk through the turnstile hall, Times Square, Bowling Green, Spring Street, the High Line and the lookalike crowd.
  Five more Tripo characters: the pink bear and the Liberty costume (Times Square), the bird photographer (the press corps at
  the Pond), the tourist (Bowling Green, Times Square), the competitive eater (Coney Island). Pizza Rat is a real rat now.
- **The rooms**: generated ceilings at real heights (subway beams, Grand Central's vault, pressed tin, a bodega drop ceiling);
  a sky, an HDRI and a sun per room; gum, litter, leaves, puddles, confetti and droppings on the floors; Showtime is a real car
  3.6 m wide down the middle with platforms either side; Grand Central has its round brass booth and four faced clock; the studio
  is narrow and furnished; the duck is on water (the pond had been under the lawn); the contest, the deli counter and the girl
  were brought forward; the cronut line is a single file with stanchions; the press sit in rows at City Hall.
- **Critique**: two Astra passes on contact sheets; most fixes taken. Not taken: shrinking whole rooms (the engine's rooms are
  20 m by 16 m; the car and the studio are built inside them instead).

## How it was made, and what it cost (about $10.10 of a $12 budget, FLORA Creative Partner workspace)

- **Art direction**: GPT-6 Astra on FLORA wrote the room brief, kickers, egg lines and cast list (run ids in `work/runs.json`), then
  critiqued a contact sheet of the first build. $0.16.
- **Plates**: 17 x GPT Image 2.5 (ImageGen on FLORA), 21:9 2K, the eye flower as reference, prompts in `tools/plates.tsv`,
  two retakes (the Times Square plate grew a real cartoon mouse costume; the Pizza Rat plate put a flower on the rat). $2.32.
  Depth from `python3 _build/depth.py work/plates_raw/*.png` (Depth Anything V2 Small, local).
- **Walls**: 17 x GPT Image 2.5, 16:9, `tools/walls.tsv`, tiled by `_build/walls.py`. $1.09.
- **Cast**: 9 concepts on white (GPT Image 2.5, one moderated and reworded: the cowboy), then Tripo H3.1 image to 3D, 47 MB of
  GLB to 4.5 MB through `_build/cast_pass.py` (Blender: textures to 1024 JPEG, Draco). $0.69 + $3.24. Run ids in `work/runs.json`.
- **Free**: Pizza Rat is LIVE FROM THE SEWERS' model; the lookalikes, the elf, the weatherman, the gorilla suit, the rat czar,
  the pigeon lady and the bull are ON LOCATION's; the pigeon, the rat, the cat, the hydrant and the turnstile are THE MARKS';
  the props are Poly Haven CC0 already passed for ON LOCATION; the hot dogs, the tub, the turnstiles, the bin, the groundhog,
  the coffee cup and the four hundred pigeons are drawn in code.
- **Engine**: LIVE FROM THE SEWERS' (CLOUDS AND DIRT V2's, ON RECORD's), forked whole: depth plates, lazy rooms, the power
  throttle, the phone guard, skate mode, clip mode. New: `rooms.js`, `build.js` (the kit and the seventeen rooms), a sky dome
  for the outdoor rooms, three music styles.
- **Build**: `python3 _build/build.py` (or `--js`). **Check**: `python3 _build/check_all.py work/check` (all seventeen
  rendered headless, 0 errors on the last run).

## Verified, and not

- Headless Chrome on this Mac: all seventeen rooms render with no console errors (two `music.beat` calls fixed on the first run).
- Never walked by a person, never tried on a phone, the music never listened to, no trick fired by hand: the headless shots
  only prove the rooms build and draw. The rhythm tricks (Showtime, Seventy Six), the mirror swap, the live billboard and the
  conga are the ones most likely to need a tuning pass once somebody walks them.
- Brand check: every plate, wall and concept looked at as contact sheets, the Times Square and Bowling Green plates at full size.
  The bull is the house bull model, the cartoon mouse was refired away, no real names on any plate.

## Shipped

- LIVE on n3wyorkers.com/only as build 20261101-194353 (deployment 4f23f1a2), on MLow's word, 2026-11-01. Rendered from the
  live site in headless Chrome after the deploy.
- GitHub: branch `only-in-new-york` of 0xmlow/newyorkers, a clean snapshot, with a row in the main README. Nothing posted.

## Credits

Concept, art and the census New Yorkers on the walls: MLow (NEW YORKERS). Built with Claude. Plates, walls, ceilings and cast
concepts: GPT Image 2.5 on FLORA; 3D cast: Tripo H3.1 on FLORA; art direction critiques: GPT-6 Astra on FLORA; depth: Depth
Anything V2 Small; props: Poly Haven (CC0); the walking cast: the NEW YORKERS ON LOCATION characters, rigged in Blender.
