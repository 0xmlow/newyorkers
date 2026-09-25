# Brief: rooms 165 to 179, fifteen more places

Written 2026-09-25. MLow asked for fifteen more next level New York places the
museum had not built, dynamic, interactive and animated, ready for the site and
ready to mint as GLBs.

Read `NEW_ROOMS_147_152_BRIEF.md` first: sections 1 (what to read), 2 (the
standard), 3 (your loop) and 6 (hand back) apply unchanged. Then read
`src/rooms/v14.ts` end to end: it is the newest room and carries every helper you
will want (`holedWall`, `wallX`, `wallZ`, `hang`, `board`, `traffic`, `houses`,
`still`, `figureGeo`, `canvasTex`, `bulbsMesh`). Copy helpers into your own file;
nothing in v14 is exported. `src/rooms/v3.ts` has `vapour()` for steam, spray and
smoke, the seated crowd, the instanced rig that turns, and the rally.

Your facts file is `_build/learn/room_facts_12_<yourtag>.json`. The rules in
section 2 below come on top of the standard.

| # | id / const | file | tag / port | place |
|---|---|---|---|---|
| 165 | `cityhallloop` | `v15.ts` | n15 / 9415 | City Hall station, the 1904 loop under City Hall Park |
| 166 | `goldvault` | `v15.ts` | n15 / 9415 | The Federal Reserve Bank of New York and its gold vault, 33 Liberty Street |
| 167 | `unionsquare` | `v16.ts` | n16 / 9416 | Union Square: the Greenmarket, the steps, the Metronome |
| 168 | `bryantpark` | `v16.ts` | n16 / 9416 | Bryant Park, the lawn behind the library |
| 169 | `lighthouse` | `v17.ts` | n17 / 9417 | The Little Red Lighthouse under the George Washington Bridge |
| 170 | `fourfreedoms` | `v17.ts` | n17 / 9417 | Four Freedoms Park, the southern tip of Roosevelt Island |
| 171 | `sealions` | `v18.ts` | n18 / 9418 | Central Park Zoo: the sea lion pool and the Delacorte Musical Clock |
| 172 | `delacorte` | `v18.ts` | n18 / 9418 | The Delacorte Theater, Shakespeare in the Park, at night |
| 173 | `cherryesplanade` | `v19.ts` | n19 / 9419 | Brooklyn Botanic Garden: the Cherry Esplanade and the Japanese Hill and Pond Garden |
| 174 | `promenade` | `v19.ts` | n19 / 9419 | The Brooklyn Heights Promenade over the BQE |
| 175 | `astorplace` | `v20.ts` | n20 / 9420 | Astor Place: the cube, the kiosk, Cooper Union |
| 176 | `nightmarket` | `v20.ts` | n20 / 9420 | The Queens Night Market, Flushing Meadows, at night |
| 177 | `dykerheights` | `v21.ts` | n21 / 9421 | The Christmas lights of Dyker Heights, at night |
| 178 | `huntspoint` | `v21.ts` | n21 / 9421 | Hunts Point Produce Market at three in the morning |
| 179 | `columbuspark` | `v22.ts` | n22 / 9422 | Columbus Park, Chinatown, at seven in the morning |

All fifteen are registered with placeholder builds: `rooms/v0.ts` (LIVE_ROOMS),
curation in `src/data.ts`, the check scripts assert 179. **Replace the placeholder
in your own file only.** Do not edit v0.ts, index.ts, data.ts, main.ts, kit.ts,
textures.ts or another builder's file. Keep your file syntactically valid at all
times: every builder's preview bundle compiles every room file. Save early and
often. The const name must be exactly the id (lowercase letters and digits).

## 1. Census wall starts (use these, so rooms show different faces)

cityhallloop 250, goldvault 350, unionsquare 450, bryantpark 550, lighthouse 650,
fourfreedoms 750, sealions 850, delacorte 950, cherryesplanade 1050, promenade 1150,
astorplace 1250, nightmarket 1350, dykerheights 1450, huntspoint 1550,
columbuspark 1650.

## 2. Rules on top of the standard

1. **Dynamic means the room keeps New York time.** Every room has a hero that
   moves and at least two more ticks. Where the real place does something at a
   real hour, do it at that hour: the sea lions are fed at set times, the Delacorte
   clock's animals turn on the hour and half hour, the Metronome counts the real
   seconds since midnight, the Bryant Park screen only glows after dark, the
   vault door cycles. `data.ts` exports `HOUR` (fractional New York hour) and the
   kit has `k.night` and `k.dusk`; for minutes and seconds read the clock yourself
   with `Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', ... })` in a
   tick, never `Date.now()` raw.
2. **Interactive means the visitor can do something.** At least one thing per
   room answers the visitor: a thing that moves when walked into (the Astor Place
   cube spins when you push it: in a tick, if the camera is within 2.2 m give it an
   angular velocity that decays), a gate or door that opens as you approach, a
   crowd that turns to look, a feeding that starts when you reach the rail. The
   camera is not passed to `build`; read it from `(window as any).__museum.camera`
   inside the tick and guard for it being undefined during the audit and the
   check scripts (they run in node with no window).
3. **No likeness of any real person.** Statues of historical figures are plain
   bronze forms without a modelled face (Washington at Union Square, the FDR head
   at Four Freedoms). No performer, vendor, keeper or resident is a recognisable
   person.
4. **No lettered text beyond public signage.** Station names, park names, the
   bank's name on its front and street signs are fine, in English, under the
   `k.sign` width limit (`size < 1024 / (0.6 * characters)`). No inscriptions
   transcribed (the Four Freedoms text on the Room's wall stays a plain band). No
   Chinese characters, no Hebrew, no scripture. No brand names on tents, trucks,
   shops or buses. No stock tickers, no dollar figures anywhere.
5. **Never write "product", "investment" or "asset" about the art.** The gold
   vault room in particular: it is a room about the city's bedrock and a strange
   basement, not about money and the New Yorkers are not treasure. Keep the eggs
   factual about the building and the vault.
6. **Memorial tone where it is due.** Four Freedoms Park is a memorial: no
   jokes in the eggs, no comic motion, the Room at the tip stays empty of art.
7. **Where the art hangs.** Where the real place has walls, hang there. Where
   it has none (a park, a market, a promenade) build what the place would honestly
   carry art on: freestanding boards (`board()` in v14), fence panels facing the
   walk, the flanks of kiosks and tents, the sides of trailers, a pallet of framed
   works left on a dock. Sixteen to twenty four mounts, targets three to four
   metres out on a floor the visitor can stand on, plus one `k.censusWall`.
8. **Motion budget.** Everything that moves is one InstancedMesh whose matrices
   are rewritten in place, or one Group on `k.ticks`. `frustumCulled = false` on
   moving instanced meshes. Guard every tick with `if (!ctx.reduced)`; place
   everything once outside the guard.
9. **Eggs.** Five or six per room, each a fact you fetched and read today from a
   real page (Wikipedia is fine; the institution's own page is better), with
   `source: { name, url }`, placed on the thing it is about. Never invent a date,
   a count or a name. If you cannot verify a number, leave the number out.
10. **The four traps that cost the last batch a day**: a mount on a curve faces
    `-a - PI/2`; spawn y is floorY plus eye; an open cylinder or ring needs
    `side: T.DoubleSide`; a slab under water hides the water. And the seven in
    `HANDOFF_MUSEUM_UPGRADES_2026-09-23.md` section 5.

## 3. The rooms, one paragraph each

**165 cityhallloop.** The IRT's City Hall station of 1904, closed to passengers in
1945, still the loop the 6 train uses to turn round. Build the curved platform
under Guastavino tile vaults, the brass chandeliers, the three leaded glass
skylights, the tiled name plaques, the mezzanine and the stair down from the
park. `daylit: false`; light it with the chandeliers and a soft day glow through
the skylights. **Hero:** a six car train of silver cars with lit windows and a
headlight rides the loop on a `k.rider` spline, slowly, in and out of the tunnel
mouths; a tour group of about twenty stands on the platform. Block the track bed
so the visitor cannot step in front of it. Mounts on the curved platform wall
(remember the curve normal), in the mezzanine and the passage.

**166 goldvault.** The Federal Reserve Bank of New York on Liberty Street, a
Florentine palazzo of rusticated limestone and sandstone (York and Sawyer, 1924)
with wrought iron lanterns, and the vault on bedrock about eighty feet below the
street: the steel cylinder that turns to open the vault, the narrow passage into
the cages of stacked gold bars behind bars and mesh, the scale room, the elevator
that took you down. `daylit: false` below, but build the street front and lobby
with daylight through the arched windows. **Hero:** the cylinder rotates open on
a slow cycle, a hand cart of bars is rolled through by two figures, the elevator
descends when the visitor stands in it (floorY switches level, or a `path`).
Mounts in the lobby and the ironwork gallery, in the antechamber corridor, never
on the cages. Verify every number about the vault against Wikipedia's Federal
Reserve Bank of New York Building article before writing it in an egg.

**167 unionsquare.** Union Square Park with the Greenmarket on the north and
west plazas: rows of white canopy stalls with produce, flowers and honey, crowds;
the equestrian Washington (1856) at the south end as a plain bronze form; the
south steps with skaters, the subway kiosks, the 1932 pavilion, the lawn, the
London planes; on the south face across 14th Street, the Metronome (1999) with its
fifteen digit display. **Hero:** the digits show the real New York time as the
real one does (hours, minutes, seconds, tenths since midnight on the left and the
same to midnight on the right) using canvas textures updated in a tick; a puff of
steam from the wall at noon and midnight. Skaters on a spline, shoppers in the
market lanes, a dog walker. Mounts on the stalls' side panels, the pavilion, the
park's iron fence facing in, and boards by the steps.

**168 bryantpark.** Bryant Park behind the New York Public Library: the lawn, the
gravel promenades under London planes, the green folding chairs in their hundreds
(one InstancedMesh), the fountain at the west end, Le Carrousel at the south, the
library's rear terrace and arcade (build the library's back true to its rear
elevation, the stacks are under the lawn), the reading room and kiosks, ping pong,
the Grace Building's sloped face and the towers on the north as skyline. **Hero:**
the carousel turns, the fountain plays, and after dark (`k.night > 0.5`) a screen
at the west end lights with an abstract flicker and the crowd sits on the lawn
facing it. Mounts on the library's rear arcade, the kiosk flanks, the balustrades.

**169 lighthouse.** The Little Red Lighthouse (Jeffrey's Hook Light, 1880, moved
here 1921, 40 feet, red) on its rock under the George Washington Bridge in Fort
Washington Park, with the Hudson, the Palisades cliffs across, the greenway path,
the railroad behind the trees. The bridge is huge: build the near tower as steel
lattice rising out of the frame, the two decks crossing the sky with traffic, the
cables, and the far tower small. **Hero:** traffic on both decks (the `traffic`
helper, high up), the lamp turning at dusk and night, boats and a kayak group on
the river, gulls, joggers. Mounts on the seawall, a picnic shelter, the fence,
and two or three inside the lighthouse up its spiral stair (floorY).

**170 fourfreedoms.** Louis Kahn's Four Freedoms Park (designed 1974, opened
2012): the wide granite stair, the tapering lawn between two allées of 120
little leaf lindens, the Room at the tip of the island (thirty six granite blocks
with one inch gaps, open to the river), the bronze head of FDR in its niche as a
plain form with no modelled face, the Smallpox Hospital ruin (Renwick, 1856) to
the north, the East River on both sides, the United Nations and Midtown to the
west, Long Island City and the Pepsi sign east, the Queensboro Bridge to the
north. **Hero:** the lindens in wind (instanced canopies swaying), ferries and a
barge on the river, gulls, a slow visitor crowd walking to the tip. Memorial tone.
The Room stays empty of art; hang on freestanding granite panels behind the trees,
in the ruin as an exhibition in the shell, and along the entry stair walls.

**171 sealions.** The Central Park Zoo as rebuilt in 1988: the central garden
with the round sea lion pool and its rock island and glass rim, the brick pergola
with its piers all round, the Arsenal (1851) on the east side, the penguin house
(glass, cold blue light), the Delacorte Musical Clock (1965) on the archway to
the Children's Zoo with its bronze animals. **Hero:** four sea lions on a
submerged spline breaking the surface and hauling out on the rock; at the real
feeding hours (check the zoo's page) a keeper with a bucket at the rail and a
crowd gathers; the clock's animals turn round the clock on the hour and half hour
by the New York clock while two monkeys strike the bell (turn them for the first
sixty seconds of the hour and the half hour). Mounts on the pergola's piers facing
the pool, the Arsenal's front, the entrance walls.

**172 delacorte.** The Delacorte Theater in Central Park, open air, the free
Shakespeare in the Park stage of the Public Theater, at night: the semicircular
bowl of seats full (seated instanced figures), the stage with its set and lights,
Turtle Pond behind the stage and Belvedere Castle lit on Vista Rock above, the
moon, fireflies over the pond (instanced particles), the queue rail and the
lobby. `daylit: false`. **Hero:** five performers on the stage moving between
marks (no real play, no likeness), stage lights sweeping and changing colour, the
audience laughing in a wave now and then. Mounts on the theatre's outer walls,
the lobby, the exhibition boards along the queue. Nothing on the stage.

**173 cherryesplanade.** Brooklyn Botanic Garden in spring: the Cherry Esplanade
(double rows of Kanzan cherries in full pink bloom along a lawn) and the Japanese
Hill and Pond Garden (Takeo Shiota, 1915): the pond, the vermilion torii standing
in the water, the wooden viewing pavilion, the shrine on the hill, stone lanterns,
the waterfall, koi and turtles. **Hero:** petals falling everywhere (one
InstancedMesh of a few thousand quads drifting and settling), koi under the
surface on riders, wind in the branches, a Sakura Matsuri crowd on the lawn.
Mounts inside the Palm House or a conservatory pavilion (glass and iron, twelve to
sixteen), on the viewing pavilion, and on boards between the esplanade benches.
Water at `metalness 0.05`.

**174 promenade.** The Brooklyn Heights Promenade, cantilevered over the two decks
of the Brooklyn Queens Expressway, with Brooklyn Bridge Park and the harbour
below, Lower Manhattan straight across (One World Trade, the Brooklyn Bridge to
the north, Liberty and Governors Island to the south), the backs of the Heights
houses and their gardens behind the walk, the Montague Street entrance, benches,
hex block pavement, the iron railing, flower beds. **Hero:** traffic on both
expressway decks below, seen through the railing (two `traffic` lanes at two
levels), ferries on riders, the skyline's windows coming up with the clock, dogs
and strollers, kids on scooters. Mounts on the garden fences facing the walk, on
boards, on the entrance wall, on the north pergola.

**175 astorplace.** Astor Place: the Alamo, Tony Rosenthal's 1967 Cor Ten cube
balanced on a corner, the 1986 replica IRT kiosk in cast iron and glass, Cooper
Union's Foundation Building (1859, brownstone, round arched arcade) and 41
Cooper Square across the way (2009, perforated steel skin with its slot),
Lafayette Street and Fourth Avenue traffic, skaters, students. **Hero:** the cube
spins when the visitor pushes it (the interactive rule above), and slows; skaters
on a loop; the kiosk's lamp; buses. Mounts on the Foundation Building's arcade,
41 Cooper's plaza face, the theatre's poster cases (they are frames), boards.

**176 nightmarket.** The Queens Night Market in Flushing Meadows Corona Park at
night, on the lot beside the New York Hall of Science: about a hundred vendors
under white pop up tents with string lights, a stage with a band, thousands of
people in lanes, grills smoking, lanterns; the Hall of Science's undulating dark
blue Great Hall wall behind, the rockets of Rocket Park standing, the Unisphere lit
far off. `daylit: false`. **Hero:** string lights (one InstancedMesh, gently
swaying), smoke from the grills (`vapour`), the crowd in two lanes, the band
moving on the stage. Country flags on tents are fine; no business names. Mounts
on tent side panels, the Great Hall's wall, the stage's side boards.

**177 dykerheights.** A block of Dyker Heights in December at night, with snow:
detached brick and stone houses with lawns, fences and driveways, every one
dressed in lights (roof outlines, wrapped trees, columns), inflatable and
sculpted figures (snowmen, toy soldiers, nutcrackers, angels, reindeer as lathe
and box forms, no licensed characters), a motorised display, tour buses, crowds
on the sidewalk with cups. `daylit: false`. **Hero:** thousands of bulbs in one
InstancedMesh twinkling in per house patterns (copy the tree light pattern from
`rockcenter` in v3.ts), a nutcracker that turns, reindeer that rock, a bus that
stops and its crowd that spills out. Mounts as lit gilt frames on the lawn
displays and on garages and gates, facing the sidewalk.

**178 huntspoint.** Hunts Point Produce Market at three in the morning: the long
refrigerated warehouse rows with hundreds of numbered dock doors, tractor trailers
backed in, forklifts racing pallets under sodium lights, crates and cases stacked,
buyers with hand trucks, a coffee cart, breath in the cold, the Bronx night sky.
`daylit: false`. **Hero:** forklifts on loops carrying pallets, a trailer backing
in, dock doors rolling up, the crowd of buyers. Mounts on the dock walls between
doors, in the dispatcher's office, and on a pallet of framed works stacked on the
dock as if they came in with the produce.

**179 columbuspark.** Columbus Park in Chinatown at seven in the morning: the
plaza with tai chi groups moving in unison, the tables of Chinese chess with
crowds of elders standing round them, music under the restored 1897 pavilion at
the north end, the playground and courts, the tenements of Mulberry Street with
fire escapes, the Manhattan Detention Complex on the west, pigeons, delivery
bikes. The site was Mulberry Bend, cleared in the 1890s. **Hero:** tai chi in
unison (an instanced figure set with a slow synchronised arm and weight cycle),
the chess crowds shifting, pigeons taking off when the visitor walks into them.
Mounts on the pavilion's piers, along the park's iron fence facing in, on the
handball wall and the courts' fences.

## 4. Verify before you hand back

```bash
cd "NEW YORKERS SITE/_build/museum"
npx tsc --noEmit -p tsconfig.json
node audit_rooms.mjs --room=<id>            # 0 unreachable, 0 backwards, 0 stuck
node audit_rooms.mjs --json | python3 -c "import json,sys; d=json.load(sys.stdin); r=[x for x in d['rooms'] if x['id']=='<id>'][0]; print(r)"   # rescued must be 0
node build_variant.mjs <tag>
python3 shot_room.py <id> /path/a.png --tag <tag> --port <port> --hour 14 --wait 12
python3 shot_room.py <id> /path/b.png --tag <tag> --port <port> --hour 22 --wait 12
python3 shot_room.py <id> /path/c.png --tag <tag> --port <port> --at=x,y,z --yaw=d --wait 12   # the works, close
python3 shot_room.py <id> /path/e.png --tag <tag> --port <port> --mobile --wait 12
```

The site server is running on :4185. Look at every screenshot yourself and
iterate until the place is recognisable in one glance from the spawn. Delete your
variant files when finished: `rm -f ../../museum.<tag>.html
../../assets/museum/museum.<tag>.js`. Do not run `npm run build`,
`build_all.sh`, exports, deploys or git commits; the coordinator does those once.
