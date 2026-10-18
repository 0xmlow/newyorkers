# MoMLOW, The MLow Museum, after MoMA

A walkable museum for NEW YORKERS by MLow, after the Museum of Modern Art on 53rd Street. Three.js r128, self hosted,
no build step to play (`site/index.html` plus `site/js/*.js`). On the site it ships as `momlow.html` through
`NEW YORKERS SITE/_build/build_galleries.py` (copied whole into `assets/momlow/`).

It began in June 2026 as "The MLow Museum, after MoMA", a city block with empty frames you filled by upload. v2
(2026-10-12) is the real MoMA plan rebuilt for the census, hung by a curator that learned MLow's taste.

## The building (the real plan, transformed)
- **53rd Street**: the sidewalk, the crosswalk, cabs in both directions with the MLOW topper, three parked at the curb with a
  cabbie, lampposts, plane trees, a coffee cart, a hot dog cart, the newsstand, barriers, the orange cone, pigeons, a dog.
  The brownstones across the street light up at night. Midtown towers in the fog. The logo on the canopy, nothing else.
- **Ground floor**: the lobby runs through the block to the Garden Lobby, glass to the garden. The desk (admission is free,
  it always was), the guard beside his own portrait (No. 625), the hero poster, the four anchors, Manhattan and Brooklyn
  on the lobby walls, twelve of MLow's movie posters as banners from the ceiling. The store (the street posters on the
  wall, prints on the tables, MLOWTAR by the door). The Bodega, the cafe. The escalators, with the Families on the well's
  wall and a catwalk on every floor. The glass lift: stand in it and press a floor.
- **Floor 2, the atrium**: open to the skylight, 28 m. Liberty, 14 m, standing in it; a sauropod on loan from across the
  park; the Delacorte clock animals circling in the void; the subway car hanging and turning; the mobile under the glass.
  Queens, the Bronx and Staten Island on the atrium's walls. The contemporary floor: Eras XV to XIX.
- **Floors 3, 4, 5**: rings of galleries around the void. Places, Design and Builders, and the Sets on 3 (where MoMA keeps
  photography, architecture and design); Eras VI to XII on 4; the Originals and Eras II to V on 5 (where MoMA keeps
  its Starry Night). The glass bridge across the atrium on 4.
- **Floor 6**: the curator's rooms, one per theme (The Night Shift, Transit, The Counter, The City Is Watching, The
  Hustle, Faces), The Moving Pictures (sixteen loops on screens), and the terrace with the water tower.
- **The sculpture garden**: Vermont marble, two reflecting pools with slab bridges, koi, a swan, a sea lion, weeping
  willows for the beech, ginkgos; MLow's eye monument, three blossoms, the equestrian, the figure, the caryatid, the
  fountain, the armillary, the nutcracker, Noguchi's stones, the Checker cab excavated in bone and calcite; and THE
  COUNTED on the north wall, 14 m tall: every collected New Yorker, 48 across, in the order it happened. 54th Street beyond.

## The illusions and the dressing (`site/js/dress.js`)
Five illusions: a painting anamorphosed onto the atrium floor that only resolves from one eye flower on the floor 3 balcony;
a Penrose triangle on the terrace that closes from its mark; a hollow eye over the garden doors that follows you; a mirror at
the end of the escalator hall that makes them endless; and an illusion panel per floor on the north balcony (the same size,
the wall is straight, nothing is moving, there is no spiral, the lines are parallel), each with its plaque. Subway tile dado
and the site's mosaic frieze along every corridor and the lobby, the cafe wall illusion in real tile in the Bodega, the eye
flower wallpaper in the store, enamel station signs with line bullets at every lift door and landing. The Penn Station set
runs the lobby (the census desk, the taker, the stamp, the seal, the dispenser, the lamps, the luggage, the shoeshine, the
newsstand, the eagle), the Yellin lantern hangs over it, the bell by the garden doors. The ON LOCATION cast in bronze along
the atrium, the blue whale beside the sauropod, the IRT kiosk as Uncounted St on 53rd, stoops and fire escapes and water
towers across both streets, phone booths, the Central Park corner, the ferry and the tug in the pools, the Rat King's court
with the monte table, the harbour pieces, Barney Greengrass and the bartender in the Bodega, MLOWTAR and the cat in the store.

## The curator (`_build/curator.py`, `_build/taste.json`, `CURATOR.md`)
Learns what MLow likes from what he already chose (his own mints, the Keystone picks, the home page faces, the pieces he
made posters and cards for), as smoothed log odds over the words of every title and story, the family, set, borough,
neighbourhood and era, plus the hand weights in `taste.json`. Gates every piece on sharpness, contrast and mud before it
can hang (970 of 7,542 refused). Fills the theme rooms, orders every room best first with the collected pieces leading,
picks the loops. Its report is `CURATOR.md`; press C inside for the note of the room you are in. Edit `taste.json` and
rebuild to argue with it.

## Phones
`site/phone-gpu.js` loads first. On a phone it halves any image texture over 512 (1024 for the atlases and the full
works) as WebGL uploads it, so the museum asks for about 220 MB instead of 1.1 GB, which iOS Safari closed the tab
over. `?gpucap=0` turns it off. The canonical copy is the site's `assets/ui/phone-gpu.js`.

## Rebuild and check
```
python3 _build/build_data.py     # the curator, data.json, atlases, posters, loops, textures, skies, props (Draco through _build/draco.py), from the site repo
./_build/stage.sh                # stage into the scratchpad, serve on 4312, headless Chrome on 9333
python3 _build/shots.py          # the audit (every work reachable, nothing overlapping) and a 25 view contact sheet
python3 _build/shots.py phone 01 03 09
```
`?go=1` skips the door, `?lock=0` keeps the mouse free, `?audit=1` prints the audit, `?time=day|golden|night` pins the
hour, `?q=low|medium|high` pins the quality. `window.__game` exposes the player, `go(i)`, `ride(floor)`, the works,
the rooms and the audit.

## Living in it
WASD walk, Shift hurry, drag or arrows to look, E or click for the card (a work, a poster, a loop), 1 to 9 and 0 jump
(street, lobby, atrium, floors 3 to 6, garden, store, terrace), the same keys ride the lift when you stand in it, C the
curator, T time of day, Q settings (quality, time, visitors, field of view), M sound. Type `gm`, `gn`, `count`, `taxi`,
`pigeon`, `mlow`, `moma`, `free`, `liberty`, `curator`.

## Credits
CC0 photo surfaces and skies from the museum kit (Poly Haven). Props: MLow's Tripo heroes (the cabs, the clock animals,
the subway car, the carousel horse, the blossoms, the eye monument), the museum kit's CC0 props, ON LOCATION's NEW
YORKERS props (Poly Haven models edited in Blender), THE MARKS heroes (the newsstand, the cat, the rat). Fonts: Fraunces,
Space Grotesk, IBM Plex Mono (OFL).
