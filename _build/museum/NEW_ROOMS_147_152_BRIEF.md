# Brief: rooms 147 to 152

Six new walkable rooms for THE MUSEUM (museum.html on n3wyorkers.com), written
2026-09-24. Five famous New York places the museum had missed, and one gift room:
the Upstate Shredding / Weitsman Recycling yard in Owego, New York, rebuilt from
real photographs of the yard.

| # | id | const | file | place |
|---|---|---|---|---|
| 147 | `empirestate` | `empirestate` | `src/rooms/v4.ts` | Empire State Building, the 86th floor open air deck, with the Art Deco lobby below it if you want a second level |
| 148 | `stpatricks` | `stpatricks` | `src/rooms/v4.ts` | St. Patrick's Cathedral, the nave on Fifth Avenue |
| 149 | `dumbo` | `dumbo` | `src/rooms/v5.ts` | DUMBO, Washington Street: cobbles, warehouses, the Manhattan Bridge framing the Empire State Building, Jane's Carousel at the water |
| 150 | `bowbridge` | `bowbridge` | `src/rooms/v5.ts` | Bow Bridge over the Lake in Central Park, rowboats from the Loeb Boathouse, the San Remo and the Dakota over the trees |
| 151 | `unassembly` | `unassembly` | `src/rooms/v6.ts` | United Nations General Assembly Hall: the gold wall, the emblem, the dome, the delegate desks |
| 152 | `weitsmanyard` | `weitsmanyard` | `src/rooms/v6.ts` | Upstate Shredding, Weitsman Recycling, Owego NY (see section 5) |

All six are already registered with placeholder builds: `rooms/v0.ts` (LIVE_ROOMS),
curation in `src/data.ts`, the check scripts assert 152. **Replace the placeholder
in your own file only.** Do not edit v0.ts, index.ts, data.ts, main.ts, kit.ts or
another builder's file. If you need a kit change, write it as a local helper in
your file. Keep your file syntactically valid at all times: every builder's preview
bundle compiles every room file.

## 1. Read first, in this order, and nothing else

1. `NEW YORKERS SITE/AGENTS.md` (house rules; short).
2. `_build/museum/ROOM_UPGRADE_GUIDE_2026-09-23.md` (the standard; the faults).
3. `_build/museum/src/rooms/v3.ts` (the best current rooms: Arthur Ashe, the
   carousel, the aquarium, Astoria Pool, Rockefeller rink). Copy its idioms:
   instanced crowds, `k.ticks` motion, `k.egg` sourced facts, `k.censusWall`,
   `floorY` for levels, `k.keepOut`, `k.block`.
4. `_build/museum/src/kit.ts` only for signatures you need.

## 2. The standard

- Every room is a real place a New Yorker would recognise in one glance from the
  spawn point. Build the thing the place is famous for, at true scale, and put the
  visitor where the famous photograph is taken from.
- Something moves: people, boats, cars, cranes, flags, light. Moving rigs are
  one instanced mesh or one group on `k.ticks`; `frustumCulled = false` on moving
  instanced meshes; respect `ctx.reduced` (no motion, no crowds).
- **12 to 20 mounts** for the New Yorkers, each hung where art could plausibly
  hang in that place, facing the visitor, reachable, target inside bounds. Plus a
  `k.censusWall` somewhere sensible (pick a distinct `ctx.wallStart(from, count)`).
- **4 or 5 eggs** (`k.egg`) with facts you fetched and read yourself today from a
  real source (Wikipedia is fine), with `source: { name, url }`. Never invent a
  fact, a date or a number.
- Draw calls under ~350, triangles under ~600 k on the debug overlay.
- `description` two or three sentences, `signatures` one list sentence, `mood`
  short. Look at v3.ts for the voice.
- **No em dashes, no en dashes, no arrows** anywhere a human reads (names,
  descriptions, eggs, signs, comments too). Use commas, colons, full stops.
- The artist is MLow. Never write "product".
- The faults that keep repeating: mount normal on a circle is `-a - PI/2`; spawn
  y is floorY + eye; solid boxes swallow rooms (hollow them); a crowd of capsules
  is a million triangles (two boxes each); `%` of a negative number is negative;
  open cylinders need `side: T.DoubleSide`; `k.sign` text must fit 1024 px
  (size < 1024 / (0.6 * chars)); lit white surfaces near lamps bloom; `k.block`
  wants min/max; a slab under water hides the water; `k.water` in daylight needs
  metalness ~0.05 and envMapIntensity ~0.25.

## 3. Your loop

```bash
cd "NEW YORKERS SITE/_build/museum"
npx tsc --noEmit -p tsconfig.json
node audit_rooms.mjs --room=<id>          # 0 unreachable, 0 backwards, 0 stuck
node audit_rooms.mjs --json --room=<id>   # and check rescued is 0
node build_variant.mjs <yourtag>
python3 shot_room.py <id> /path/a.png --tag <yourtag> --port <yourport> --hour 14 --wait 12
python3 shot_room.py <id> /path/b.png --tag <yourtag> --port <yourport> --at=x,y,z --yaw=-30 --pitch=-6 --wait 12
```

The site server is already running on :4185. Use your own tag and port (given in
your prompt). Look at every screenshot yourself with the Read tool, and iterate
until the place is recognisable and good, not merely present. Shoot at least: the
spawn view, one reverse view, one close view of a mount, and a `--mobile` shot.

Put screenshots in your scratch folder, not the repo. When finished, delete your
variant files: `rm -f ../../museum.<tag>.html ../../assets/museum/museum.<tag>.js`.

Do **not** run `npm run build`, `build_all.sh`, exports, deploys or git commits.
The coordinator does all of that once.

## 4. Facts file

Write your rooms' facts to `_build/learn/room_facts_9_<yourtag>.json`, a list in
the same shape as `_build/learn/room_facts_8.json` (one object per room: id,
place, fact, year, source {name,url}, keywords, learn). Same sourcing rule.

## 5. The Weitsman yard (152 only)

Upstate Shredding, Weitsman Recycling, 17 acres in the Tioga County Industrial
Park, Owego, NY, opened 1997 by Adam Weitsman (a collector of MLow's work). This
room is a gift; the honoree is named in the room text, no likeness of him.

Real photographs of the yard are in
`/Users/degens/Desktop/NEW YORKERS BY MLOW/WEITSMAN YARD ROOM 2026-09-24/refs/`
(contact sheets at `../contact.jpg` and `../contact_vid.jpg`). **Study them before
modelling and match them.** What they show:

- A flat, sandy brown dirt yard in a valley, wooded green ridges on every side
  under a hard blue summer sky.
- The shredder plant in the middle: a tall steel infeed ramp and conveyors, blue
  steel frame, grey corrugated sheds, yellow handrails and stairs, a steam plume
  rising from the shredder.
- Radial stacker conveyors (blue steel lattice) pouring shredded frag into dark
  grey cone piles.
- "FERROUS DOWNSTREAM SYSTEM": blue framed building with grey cladding.
- A huge open canopy on blue steel columns with a long blue fascia banner reading
  EAST COAST'S LARGEST PRIVATELY HELD SCRAP METAL PROCESSOR, with a US flag on it,
  and a mountain of crushed cars and mixed scrap under and beside it.
- Yellow Liebherr / Sennebogen style material handlers with long booms and orange
  peel grapples feeding the plant; a yellow wheel loader with a raised bucket.
- Green Mack tractors pulling long dark tipping trailers printed UPSTATESHREDDING.COM,
  one tipped up on a hydraulic tipper; open top dump trailers.
- A white storage dome, rail gondola cars in a line along one edge, smaller blue
  office buildings.

Photo textures cut from those photos are served at
`assets/museum/photos/weitsman/`: `cars.jpg` (crushed car stack face),
`cans.jpg`, `briquettes.jpg`, `pile.jpg` (a band of the mixed scrap mountain),
`frag.jpg` (shredded frag), `ridge.jpg` (the wooded ridge). Use them via
`k.image(url, { opaque: true })` on the faces of scrap mountains, car stacks and
frag cones, and the ridge as a distant backdrop band if it reads right. The
grapples should move: slewing, lifting, dropping. The conveyors should run, the
steam should rise, a truck should come and go.

Where the art hangs: the yard has no walls, so build what a yard would honestly
carry art on: the faces of the canopy columns, the side of the scale house,
sheets of steel plate stood on end on a steel frame, the flanks of the parked
trailers. The New Yorkers are about the city; this room is the place the city's
metal goes.

## 6. Hand back

Report: what you built per room, what moves, mounts/eggs counts, draw calls and
triangles from the overlay, audit results, the screenshot paths, and plainly what
you did not verify.
