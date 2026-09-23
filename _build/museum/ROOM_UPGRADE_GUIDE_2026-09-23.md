# Making the other 141 rooms as good as the last five

Written 2026-09-23 after building rooms 142 to 146 (`src/rooms/v3.ts`) and looking at
every room's poster on one contact sheet. This is the working brief for whoever
upgrades the earlier rooms: what the bar is now, which rooms miss it and why, the
recipe per room, and the gates a room has to pass before it ships.

Read `AGENTS.md` at the site root first (four copies of the site; only this one
deploys). Then the cookbook in the `virtual-architect` skill
(`references/new-yorkers-museum.md`, v6) for the kit API. This file assumes both.

## 1. The bar

Rooms 137 to 146 are the standard. Every one of them has:

1. **A real place, built to its plan**, not a box with a texture. The court is
   23.8 by 11 with its lines; the carousel has 57 horses because the real one does;
   the pool is 330 by 165 feet scaled. The `signatures` string names five or six
   things a New Yorker would recognise, and every one of them is in the scene.
2. **A hero that moves**, plus at least two more ticks. The rally, the turning
   platform, the sharks, the jumpers, the skaters. Motion is what makes a room
   feel inhabited; a still room reads as a render.
3. **People.** `k.crowd` on a route, instanced figures in seats, static
   `figure()` staff. Eight to sixty depending on the place.
4. **Inside and outside.** An interior gets its street or its park through the
   door; an exterior gets the buildings behind it and the skyline.
5. **Light as a recipe**, not a default: night rooms set `daylit: false` and
   light themselves; day rooms follow the clock and are checked at 14:00 and at
   the real hour.
6. **Sixteen to twenty four mounts with true targets** (the spot a person would
   actually stand), one census wall, `wash: true`, and `audit_rooms.mjs
   --room=<id>` reporting 0 rescued, 0 backwards, 0 unreachable.
7. **Five or six eggs**, each on a checked source, placed on the thing they are
   about.
8. **Four screenshots and a phone shot** before anyone calls it done.

## 2. What is wrong now, in three piles

The contact sheet (`assets/museum/rooms/*.jpg`, 146 thumbs) and the audit
(`node audit_rooms.mjs --json`) agree on where the problems are. 527 works in 81
rooms only reach a visitor because `viewpoint()` in `main.ts` moves the visitor
for them at runtime; the rooms underneath are wrong.

### Pile A. Facade rooms: a flat front on a street with two to four works

The institution set (82 to 111, files `r.ts` to `w.ts`) mostly stops at the door.
The visitor stands on asphalt looking at a box with a brand banner and a couple
of frames. The interiors are the point of these places and they are missing.

`momaatrium newmuseum breuer jewishmuseum rubin theshed armory customhouse mad
hispanicsociety studiomuseum elmuseo mcny nyhistorical diachelsea chelseablock
fotografiska ps1 pioneerworks bronxmuseum cooperhewitt brooklynmuseum socrates`
plus, from earlier sets, `morgan (k) arthuravenue (l) strand chelseahotel (o)
dakota (p) carnegie (n) sedgwick (n) balloons (o) garden (p) whitney (p)`.

Fix: build the signature interior and hang there; keep the facade as the way in.
Each of these has one room that everyone knows (the Breuer's stair and trapezoid
window, the Rubin spiral, the Armory's drill hall roof, the Custom House rotunda
and its Reginald Marsh murals, the Morgan's three tiers, the Carnegie horseshoe,
the Dakota courtyard). One interior each, twelve to twenty works inside, the rest
outside on the facade.

### Pile B. Empty plains: a hero object on a flat field with frames floating

`bleachers (f) wollman boathouse snug twa halloffame (g) rock frick seaport (h)
rockaway boatgraveyard intrepid (m) belvedere highbridge (l) panorama oysterbar
liberty (j) littleisland (i) highline (c) library apollo (d)`.

These are the rooms MLow means by "don't look so great". The subject is there
(a diving board, an ice sheet, a carrier deck, a ship) but nothing surrounds it
and nothing moves. `bleachers` and `liberty` are the worst in the audit: every
work in both is rescued at runtime. Fix with the v3 pattern: the crowd in the
seats and a game on the field for the bleachers; the helix path inside the statue
kept but with the harbour, ferries and the crown windows around it; skaters and
the towers for Wollman; the hangar deck, jets and a carrier island for the
Intrepid; the Lullwater with boats for the boathouse.

### Pile C. The ported corridors: rooms 1 to 21 (`a.ts` to `e.ts`)

Long galleries with a skin and frames on both walls. They work, they are just
the same room twenty one times. `subway`, `bowery`, `times`, `oculus`, `grand`
are fine; `met brooklyn ferry botanical penn highline coney bethesda guggenheim
library apollo unisphere tram cloisters navyyard governors` want their motion
and their people (a ferry that docks, a tram that rides the cable, a train in
Grand Central's tunnel, the Unisphere fountains, the botanical garden's
conservatory with plants that read as plants).

### The audit, ranked (rescued works out of mounts)

| room | mounts | rescued | unreachable | backwards | obstructed |
|---|---|---|---|---|---|
| bleachers | 22 | 20 | 0 | 20 | 10 |
| liberty | 25 | 25 | 0 | 25 | 0 |
| littleisland | 20 | 20 | 3 | 17 | 1 |
| highline | 22 | 20 | 20 | 0 | 0 |
| arthuravenue | 22 | 17 | 7 | 15 | 0 |
| library | 25 | 18 | 18 | 0 | 0 |
| apollo | 19 | 18 | 18 | 0 | 0 |
| carnegie | 20 | 16 | 16 | 0 | 0 |
| mcny | 17 | 15 | 11 | 3 | 2 |
| dakota | 22 | 14 | 10 | 4 | 0 |
| snug | 24 | 13 | 13 | 0 | 0 |
| strivers | 18 | 13 | 0 | 0 | 13 |
| halloffame | 24 | 12 | 0 | 12 | 0 |
| nyhistorical | 17 | 10 | 7 | 3 | 1 |
| meteuropean | 38 | 10 | 10 | 0 | 0 |
| noguchi | 15 | 9 | 4 | 0 | 7 |
| doyers | 20 | 9 | 7 | 0 | 2 |
| cyclone | 22 | 9 | 3 | 6 | 0 |
| boatgraveyard | 20 | 9 | 2 | 4 | 3 |
| mad | 25 | 9 | 7 | 0 | 0 |

The full list is `node audit_rooms.mjs --json`. "Unreachable" means the authored
viewing spot is inside a block, a keep out or outside bounds. "Backwards" means
the frame faces away from its own target. "Obstructed" means something stands
between the two. All three are authoring errors with one fix each: give the
mount the true `target`, and make sure nothing is blocked on the floor the work
faces.

Rooms with fewer than fourteen mounts: `metgreathall (13) diachelsea (12)`. Add
mounts; the hang assignment gives every room about 52 works and the page
paginates, but a room needs at least sixteen on the walls to feel hung.

## 3. The recipe for one room

Work one file per agent, never two agents in one file. Room ids never change
(they are URLs, tokens and thumbnails); the room's place in `ROOMS` never changes.

1. **Read the room.** `src/rooms/<file>.ts`, its `signatures` line, and
   `node audit_rooms.mjs --room=<id>`. Pull the poster
   (`assets/museum/rooms/<id>.jpg`) and look at it honestly.
2. **Decide the hero moment.** One sentence: "the ferry pulls in and the ramp
   drops", "the train pulls out of the tunnel", "the fountain ring under the
   Unisphere and the flags". If the sentence has no verb, the room will not get
   better.
3. **Build to the plan.** Look up the real dimensions and the two or three
   things everyone remembers, and build those first. Use the cheap primitives
   (`k.box`, `k.cyl`, `k.lathe`, `k.arch`, `k.curve`, `k.beam`) and world space
   PBR textures; `k.prop` only for the institution kit GLBs.
4. **Move it.** Copy the pattern that fits from `v1.ts` to `v3.ts`:
   - a rig that turns or rides: one Group, `k.rider` on a `k.spline`, or
     `group.rotation.y = t * w` on a tick;
   - many of one thing: `k.instances` with a Float32Array of base positions,
     rewrite matrices per frame, `frustumCulled = false`, no `vertexColors`;
   - people: `k.crowd` (walking), `figureGeo()` instances (seated or standing
     in numbers), `figure()` (a few staff);
   - weather and water: `vapour()` for steam, spray, bubbles; `k.water` with
     `metalness ≈ 0.05` in daylight; light rays and caustics as additive planes.
   Guard every tick with `if (!ctx.reduced)`; place everything once outside the
   guard so a reduced motion visitor still sees the scene.
5. **Hang it.** Sixteen to twenty four mounts, each with the true viewing spot
   as `target` three to four metres in front, on a floor that is not blocked.
   One `k.censusWall`. Take out any mount whose target lands outside `bounds`.
6. **Light it.** Night rooms: `daylit: false`, deep sky, `k.hemi` cool and low,
   points where a real light would be, spots only on heroes, nothing white
   within three metres of a lamp. Day rooms: the sky preset from a neighbouring
   room, `hemi` ground colour neutral (`0x8a8478`) not green, sun with shadows,
   lamps whose intensity reads `k.night`.
7. **Eggs.** Five or six, each on a checked source (Wikipedia is fine, the
   institution's own page is better), placed on the object they describe. Add
   the room to `_build/learn/room_facts_<n>.json` with the same source.
8. **Verify.** In this order, and do not skip one:
   ```
   npx tsc --noEmit -p tsconfig.json
   node audit_rooms.mjs --room=<id>          # 0 rescued 0 backwards 0 unreachable
   node build_variant.mjs <tag>
   python3 shot_room.py <id> a.png --tag <tag> --port 93xx --hour 14 --wait 12
   python3 shot_room.py <id> b.png --tag <tag> --port 93xx --hour 22 --wait 12
   python3 shot_room.py <id> c.png --tag <tag> --port 93xx --at=x,y,z --yaw d --wait 12   # the wall of works, close
   python3 shot_room.py <id> d.png --tag <tag> --port 93xx --at=x,y,z --pitch -28 --wait 12 # from above, for water and floors
   python3 shot_room.py <id> e.png --tag <tag> --port 93xx --mobile --wait 12
   ```
   Look at all five. Frames black means you shot too early, not that the hang
   failed. A white disc means a lit white surface is blooming. Water that looks
   like the deck means a slab is lying under it.
9. **Export and ship.** Delete your variant files, then:
   ```
   df -h /                                  # a room is 40 MB of GLB; check first
   python3 export_server.py 4181 &
   # scratch/run_export.py <from> <to>       (0 based indices into ROOMS; see cookbook)
   python3 ../build_room_thumbs.py
   cd .. && ./build_all.sh                  # registry, hang, bundle, audit, pages, package, preflight
   ```
   Commit one file per commit with the reasoning in the message. Deploy is
   `GO LIVE PACKAGE/deploy.sh`, and only when MLow says so.

## 4. Engine work that lifts every room at once

Do these before rebuilding rooms one by one; each one improves all 146.

- **Skies.** Half the day rooms have a washed white horizon (`fog` too high and
  a pale `horizon`). Put four named presets in `kit.ts` (clear noon, hazy summer,
  winter, dusk) and have rooms call them; stop hand tuning six numbers per room.
- **Ground colour in `k.hemi`.** Green ground light turns every ceiling and
  underside green. Default the ground to a warm grey and let park rooms opt in.
- **Trees.** The low poly icosahedron canopy is a style, but it needs a second
  and third species (a column poplar, a bare winter tree exists) and a leaf
  colour that varies per tree. Cheap, and it is in every exterior.
- **People everywhere.** `figureGeo()` in `v3.ts` (a merged capsule and head for
  instancing) should move into `kit.ts` as `k.seated(positions, colours)` and
  `k.standing(...)`, so a hundred people is one line.
- **Post.** `PHOTOREALISM_SCOPE_2026-09-08.md` wave 1 (ambient occlusion, a
  measured post pass) is still the biggest single step toward "realistic". It
  is engine work, not room work.
- **Bloom guard.** Clamp `emissiveIntensity` on facades at night in `k.pbr` and
  document 0.92 as the bloom threshold, so no room can blob again.
- **The audit as a gate.** `build_all.sh` fails on `stuck` only. Once the piles
  above are worked, fail on `rescued` too so rooms cannot regress.

## 5. Running it as a team

- One file per agent. The files are `a` to `e` (rooms 1 to 21), `f` to `w`
  (22 to 111), `x1 x2 y1 y2 y3 z` (112 to 136), `v1 v2 v3` (137 to 146). Agents
  never touch `index.ts`, `v0.ts`, `data.ts` or `main.ts`; those edits go
  through the lead.
- Each agent builds its own variant (`node build_variant.mjs <tag>`) and uses
  its own Chrome port (`--port 93xx`). The server on `:4185` is shared and read
  only.
- Facts: each agent appends its rooms to one new `room_facts_<n>.json`; the
  lead merges. Sources get checked by the lead before deploy.
- Order of work: the audit list above (bleachers, liberty, littleisland,
  highline, arthuravenue, library, apollo, carnegie, mcny, dakota, snug,
  strivers, halloffame) first, because those rooms are wrong, then pile A
  (facade rooms) because those are thin, then pile C (corridors) because those
  are merely plain.
- Budget per room: 150 to 350 draw calls on the desktop probe, under 150,000
  triangles in the check script, one GLB export around 40 MB. Bigger than that
  is a Blender prop, not a room.
- Definition of done, per room: the eight points in section 1, the five
  screenshots in section 3, and `audit --room` clean. A room that opens on a
  wall is not done, however good the rest is.

## 6. The traps this pass paid for (short form)

The long form is in the cookbook, seventh pass.

- `dealFirstRooms()` randomised the export chain: fixed, but check disk before
  any export.
- Bloom blobs are lit white surfaces near lights, not the lamps.
- `k.sign` clips text wider than 1024 px; keep `size` under
  `1024 / (0.6 * characters)`.
- `k.block` wants `min, max`; a reversed block is empty.
- `k.water` in daylight is a mirror until metalness comes down.
- A slab under a pool hides the pool; build decks and lawns as strips.
- Frames are black at 6 s; review shots need `--wait 12`.
- `vertexColors: true` blacks out instance colours; moving instanced rigs need
  `frustumCulled = false`.
- A wall box across a doorway blocks the visitor whatever `k.block` says.
