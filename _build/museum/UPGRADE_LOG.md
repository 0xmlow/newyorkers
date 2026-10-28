# Room upgrades: what has been rebuilt, and how

The brief is `ROOM_UPGRADE_GUIDE_2026-09-23.md`. This file is the running log.

**Nothing is overwritten.** A rebuilt room goes into a new file (`rooms/up1.ts`,
`up2.ts`, ...) under a new const name (`bleachers2`, `liberty2`), keeping its `id`.
`rooms/index.ts` imports the new version instead of the old one. The original stays
in its own file exactly as it was, so it can be read or restored by changing one
import line. Ids never change: they are URLs, tokens and thumbnails.

## Batch one, 2026-09-23 (`rooms/up1.ts`)

| room | was | now |
|---|---|---|
| 24 `bleachers` | 22 mounts, 20 rescued, 20 backwards, 10 obstructed | 16 mounts, 0 rescued |
| 45 `liberty` | 25 mounts, 25 rescued, 25 backwards | 24 mounts, 0 rescued |

Museum wide: 527 rescued works before this pass, 442 after batch two, 407 after batch three, 373 after batch four, 344 after batch five.

**bleachers.** The visitor now stands on the warning track in right centre with the
whole bowl in front of them. Built to a ball field's real geometry: home plate at
the origin, bases at 27.4 m, the mound at 18.4, a mown fan out to a wall that runs
78 m to centre and pulls in to 59 at the right field pole. Three decks all the way
round carry about 5,000 seats and 3,000 people who do the wave and stand up on the
hit; the frieze, four light towers, the scoreboard, Monument Park behind the black
batter's eye. Every sixteen seconds there is a pitch, a swing and a ball into the
seats, and the place goes up with flashbulbs. The works hang along the outfield wall
where the advertising would be.

**liberty.** The figure was a smooth cone with an arm on it. She is now built like a
person to her own proportions: 46 m from the heel on the pedestal to the flame, a
robe with folds, shoulders, neck, head, the seven rayed crown, the right arm raised
and the left holding the tablet, and the broken chains at her feet. The pedestal is
shorter so she dominates it, and hollow so the shaft inside is a real room. The crown
band has twenty five openings with a pier between each, so the crown is a place you
stand and look out of rather than a sealed copper ball. Ferries work the harbour,
gulls ring the island, and sixteen climbers are always on the stair ahead of you.

## Batch two, 2026-09-23 (`rooms/up2.ts`)

| room | was | now |
|---|---|---|
| 10 `highline` | 22 mounts, 20 rescued, 20 unreachable | 20 mounts, 0 rescued |
| 38 `littleisland` | 20 mounts, 20 rescued, 17 backwards, 3 unreachable | 22 mounts, 0 rescued |

**highline.** Every target was outside the room's own bounds: `corridorMounts` sent
the viewer to x = 6.45 on a deck that stops at 5.6, so nobody could ever stand where
the works were meant to be seen from. The line now runs its full length with Oudolf's
grasses moving in three grades, the rails still in the deck, peel up benches, the
sundeck chairs, traffic on the avenue below, a crowd strolling both ways, a hotel
straddling the line at the north end, and the Tenth Avenue Square cut down into the
deck with a window over the traffic, which is a floor the visitor actually walks down.

**littleisland.** The glass panels along the paths were rotated `ang + PI/2`, which
puts the picture's back to the path. Rebuilt with the geometry the place actually has:
132 pots seated under an elliptical lawn with a concrete edge beam, so from the water
you see what holds the park up; paths and bridges as strips that follow the ground
instead of stacks of boxes; the Amph with an audience on its tiers and somebody on the
stage; 1,200 bulbs, three grades of tree, gulls, a boat, and people on every path.

## Four faults worth carrying into every other room

1. **The mount normal on a circle is `-a - PI/2`, not `PI/2 - a`.** Both rooms had
   every work facing outward. Anything hung on a curve or in a rotunda is suspect.
2. **A wall whose radius changes fast cannot take flat panels laid square to the
   radius.** They shingle, and the neighbour stands in front of the art. Lay every
   panel and every mount along the true tangent: differentiate the radius, take the
   tangent, and use `atan2(-tz, tx)` for both.
3. **Masonry modelled as a solid box swallows the room inside it.** The pedestal was
   one 22 by 26 by 22 box with a stair up the middle of it. `hollowBox` in `up1.ts`
   builds the same thing as four slabs.
4. **A crowd of capsules is a million triangles.** The stadium was 1.44 M until the
   spectators became two boxes each (24 triangles); it is 323 k now and looks the
   same from anywhere a visitor can stand.

## Three more faults, from batch two

5. **A room's `spawn` y is the eye, not the floor.** `littleisland` spawned at y = 0.9
   with a floor at 1.1 and an eye height of 3, and the visitor arrived under the park
   looking up through the lawn. Write `spawn` as floorY + eye.
6. **A square plane clipped by dropping its outside vertices is a grass cliff.** Build
   a shape that is the shape: a polar grid over the ellipse, with a skirt for its edge.
7. **A path made of stacked boxes on a hill is a staircase.** Sample the line and lay a
   quad strip on the terrain (`terrainStrip` in `up2.ts`).

## Batch three, 2026-09-23 (`rooms/up3.ts`)

| room | was | now |
|---|---|---|
| 54 `arthuravenue` | 22 mounts, 17 rescued, 15 backwards, 7 unreachable | 24 mounts, 0 rescued |
| 15 `library` | 25 mounts, 18 rescued, 18 unreachable | 24 mounts, 0 rescued |

Museum wide: 442 rescued before this batch, 407 after. Deployed as build 20260924-025910.

**arthuravenue.** The boards over the stalls hung their pictures facing into the
board (the rotation signs were swapped), four targets stood inside the market's own
walls, and the three works on the avenue faced the shopfronts. The room also stopped
at the door. Now the avenue has awnings and a name on every fascia, fruit and bread
out on the sidewalk, parked cars at both curbs, traffic both ways, lamps, the corner
pole and the last pushcart parked outside. The hall is laid out as four islands and
two end stalls on five skylit aisles, each aisle under a raised glass lantern, with
salumeria, latticini, pescheria, panetteria and produce counters, swinging salami
and provolone, a slicer turning, a cigar roller by the door, a coffee bar, and a hand
truck of crates working the fourth aisle. Sixteen works hang on the stall spines
over the counters, four over the end stalls, four on the brick front to the street.
The Manhattan towers are gone; Belmont gets low rooftops. About 95 k triangles.

**library.** `corridorMounts` hung the works inside the bookcases and put every
viewing spot at x = 6.4, in the middle of the reading tables, which were blocked from
2.6 to 7.8. Rebuilt to the room's own numbers (78 by 297 feet, 52 high) as two halls
either side of the delivery desk, with tables pulled in so a five metre side aisle
runs clear along each wall; the works hang in twenty bays cut into the lower tier of
shelves plus four on the end walls. The ceiling has gilt beams, ochre coffers and a
painted sky over each hall with clouds drifting in it; the high west windows let the
afternoon in as shafts; six chandeliers; about 70 readers who lean over their books
and sit back to turn a page; a queue at the desk, a librarian with a book truck. The
east door opens through a marble hall to the Fifth Avenue front, its columns, the
terrace and Patience and Fortitude on the steps, with the avenue below. About 142 k
triangles after taking the chair legs, shade bevels and coffer rings down.

Eggs: six each, all new, from sources fetched and checked on 2026-09-23 (Historic
Districts Council, Turnstile Tours, Wikipedia for Arthur Avenue, Belmont and the
Schwarzman Building). `_build/learn/room_facts_6.json` replaces both rooms' entries
from `room_facts_1.json`, which pointed at site homepages. The market's opening date
is disputed (October 28, 1941 per the HDC, 1940 elsewhere); the egg and the fact say
so rather than pick one.

## Two more faults, from batch three

8. **`%` on a negative number is negative in JavaScript.** `books[(j + z0) % 3]` with
   z0 below zero reads `books[-1]`, which is undefined, and three.js draws the mesh in
   its default white material. Half the bookcases and half the market canopies came
   out as glowing white slabs. Use `((a % n) + n) % n` (`mod` in `up3.ts`).
9. **A figure standing inside a solid counter shows only its head**, lying on the top
   like a dropped ball. Staff behind a counter need a hollow counter or no figure.

Also: both GLBs came out at about 70 MB, not 40; the hall and the reading room are
dense with small boxes. Budget disk accordingly.

## Batch four, 2026-09-24 (`rooms/up4.ts`)

| room | was | now |
|---|---|---|
| 16 `apollo` | 19 mounts, 18 rescued, 18 unreachable | 21 mounts, 0 rescued |
| 63 `carnegie` | 20 mounts, 16 rescued, 16 unreachable | 18 mounts, 0 rescued |

Museum wide: 407 rescued before this batch, 373 after. Deployed as build 20260924-033138.

**apollo.** `corridorMounts` put every viewing spot at x = 9.2 and the seat blocks
ran wall to wall, so no one could stand where the works were meant to be seen. Now
the orchestra seats stop at 7.95 and a clear side aisle runs down each wall, with
six works a side between gilt pilasters. The room starts on 125th Street at night:
the marquee reading AMATEUR NIGHT with its bulbs chasing, the red APOLLO blade read
top to bottom, poster cases either side of the doors carrying two works, the Walk of
Fame plaques in the sidewalk, cabs both ways. The lobby has the Tree of Hope on its
plinth and the Wall of Fame. The house has two balconies over the orchestra and about
700 people who sway with the song; a singer works the front of the stage in a follow
spot that tracks her, with piano, drums and bass behind; three works hang on the back
wall of the stage. About 83 k triangles.

**carnegie.** The ten box front works aimed at a point inside the stage's keep out,
four more into the parquet, and the facade was one solid brick box 60 metres a side
with the hall inside it (fault 3 again), with 57th Street running into the building.
Now 57th Street runs across the front, the facade is a hollow wall of Roman brick and
terracotta with three door arches and the studio tower over it, a lobby in cream and
gold carries two census walls and four works, and the hall is a horseshoe of five
levels built from the circle: the parquet wall is 24 flat panels on the true tangent
with a door at the back, four tiers each with a gilt front, box partitions on the
first two, and about 1,300 people. Eight works hang round the parquet wall under the
first tier and four down the straight sides, all facing the centre with
`atan2(-cos a, -sin a)`, with a ring aisle kept clear to stand in; two more flank the
stage. On stage an orchestra of about 60 sits in five arcs round the conductor: the
bows move together and the baton beats four. About 100 k triangles.

Eggs: six each from Wikipedia (Apollo Theater, Carnegie Hall), fetched and checked
2026-09-24, in `_build/learn/room_facts_7.json`, which replaces both rooms' entries.

## One more fault, from batch four

10. **An open cylinder or ring is single sided.** A horseshoe's upper wall, a tier
    front, a dome seen from underneath: from the inside they cull away and you see
    straight through them, here to the facade's brick and the sky, and up through a
    tier into its audience. Give curved shells a `side: T.DoubleSide` material (k.pbr
    passes it through), and close any gap between a wall top and the ceiling over a
    stage.

## Batch five, 2026-09-24 (`rooms/up5.ts`)

| room | was | now |
|---|---|---|
| 101 `mcny` | 17 mounts, 15 rescued, 11 unreachable, 3 backwards | 18 mounts, 0 rescued |
| 72 `dakota` | 22 mounts, 14 rescued, 10 unreachable, 4 backwards | 22 mounts, 0 rescued |

Museum wide: 373 rescued before this batch, 344 after. Built, not deployed.

These two are repairs on the originals' own plans, not new plans: the room code was
copied into `up5.ts` and fixed there, so `u.ts` and `p.ts` are untouched. Said
plainly because it is a lighter kind of rebuild than batches one to four.

**mcny.** The whole building was one solid 34 by 16 by 40 brick box with the
rotunda inside it (fault 3), whose south face stood in front of the timeline
gallery's works; the portico was a solid block through the door; the rotunda had no
walls of its own, so its works hung on the inside of the box; their targets were
inside the mezzanine block; four works hung high over a mezzanine nobody can reach;
the park wall works faced the park; the street ran under the portico stairs. Now the
building is hollow, the rotunda has its own walls with an opening to the gallery, the
portico is two piers and a lintel, Hamilton and Clinton stand in niches either side
of it, the street is moved so the stairs land on the sidewalk, and the works hang
round the rotunda at floor level, down the gallery and beside the screens. The ten
screens, which the original laid directly over the census wall, are a band above it
now and change colour. A class in yellow follows a guide with a flag; traffic on
Fifth. About 29 k triangles.

**dakota.** The north wing was one solid box straight through the carriage arch and a
block ran across it, so the courtyard could not be walked into at all; there was no
72nd Street for the arch to open onto. The wing is now split round the arch with a
piece over it, the block is split, and 72nd Street runs along the north front with a
row of houses across it. The courtyard targets moved out of the fountain keep outs,
the park wall works turned round. The first snow falls, a doorman stands by the
sentry box, a busker plays at the mosaic with flowers left on it and a few people
round it, cabs run on Central Park West. The IMAGINE word stood upright: the original
rotated "the last mesh built", which was not the sign. About 53 k triangles. Not
improved: the roofline still reads as chimneys, not gables, from the avenue.

Eggs: five for mcny, six for dakota, from Wikipedia (Museum of the City of New York,
The Dakota, Strawberry Fields), fetched and checked 2026-09-24, in
`_build/learn/room_facts_8.json`.

## Batch six (2026-10-01): liberty3, the real figure, `rooms/up6.ts`

MLow: the statue "looks like shit". It did: liberty2 rebuilt the island and the climb
but the figure was still code, a lathed cone with an arm, and from the path it read as
a green traffic cone with a torch. She is now Gravity Jack's "Statue Of Liberty"
(Sketchfab, CC BY 4.0, ZBrush and Substance, 57 k triangles), downloaded by MLow, with
the six 2k textures cut to 1k (13 MB to 2 MB) and a stair hole cut in her plinth slab
in headless Blender: `assets/museum/props/liberty_statue.glb`. Credit plaque on the
walk up from the dock, as the licence asks.

She is 45.7 units heel to flame (the coded one was 45), so scale 1, rotY -PI/2 to face
the dock, torch in her right hand. The inside was measured height by height as the
widest circle inside the shell (the BODY table): about 3 to the shoulders, a pinch at
the neck, 1.66 in the head. liberty2's helix (4.4 down to 1) would have come through
her robe, so inside her the stair is now a radius 1.85 spiral round Eiffel's pylon,
following her measured axis, then a short neck stair to a platform in the head with
two small works. The pedestal half (stair, 22 works, lobby, wall) is liberty2's
exactly. Ribs refitted inside the shell; tablet, chains and crown eggs moved onto
her; torch glow and light on her real flame. 24 mounts, 0 unreachable.

Deployed at MLow's word WITHOUT a visual check: every headless screenshot attempt this
session lost the Desktop folder permission (Blender, Chrome and a local server each
tripped it). Unverified: that she sits flush on the pedestal, the stair stays inside
her, and the glow sits in the flame. Known loss: her crown windows are painted on the
texture, so the harbour is not visible from the crown.

## Batch seven (2026-10-01): liberty4, out of the crown, `rooms/up7.ts`

MLow on liberty3: let me see out of the crown; the art inside is too small and badly
hung. The crown windows are the model's own: its base colour paints 25 black slits,
so `props/liberty_crown_mask.png` (that texture thresholded, 3.7 KB) is the copper's
alphaMap with alphaTest and the slits are real openings. Behind the crown band the
sculpt has a second skin, the forehead, 0.27 behind it; 127 of its triangles behind
the band are zeroed in place in `props/liberty_statue_v2.glb` (same 2 MB). The climb
ends at eye 68.4, a step back from the band: six or seven windows, harbour and sky
through them (checked on a preview deploy). The crown lamp is a dim floor light: a
6 intensity lamp 1.3 from the copper flared the whole view white.

Art: 43 works (was 24). Pedestal 3.4 by 2.1 straight out from the step that sees it,
every sixty degrees; inside her 1.8 by 1.1, a quarter turn ahead of the step and
turned to face it (seen whole from about three metres, pylon out of the sightline),
every third of a turn, ribs pushed out to the copper behind them; two at 1.0 by 0.62
at the back of the head. The works are landscape: square frames halved them.

Debugging note: `__museum.camera.lookAt` is overridden by the controller next frame;
use the page's `at=x,y,z&yaw=deg&pitch=deg` params (yaw 180 looks along +z). A
Cloudflare preview branch (`wrangler pages deploy --branch liberty-preview`) viewed in
the app browser avoids the local screenshot tools, which drop the Desktop permission.

## Next, in the audit's order

snug (13), strivers (13), halloffame (12). Then the facade rooms, then
the ported corridors 1 to 21.

## Free GLB swaps, rooms in a.ts to l.ts (2026-10-28)

From the audit `UPGRADE ALL ROOMS 2026-10-28/audit/museum_a_l.md`. Every swap builds the old code
object first and hides it only when the GLB arrives (`rooms/heroes.ts`), so a failed load leaves the
room as it was. Nothing paid; nothing deployed.

- subway (a.ts): the 66 m box train is four hero cars tiled along it. `h_subway_car_lo.glb` (new,
  959 KB) is the 2026-10-09 `h_subway_car` cut from 40k to 12k triangles by `blender/prop_pass.py`,
  because four to seven copies of the 40k car tripled the overlay's triangles. The lit windows with
  the room's New Yorkers, their frames and the head lamps stay on top of the cars. The cars are lower
  than the old box roof (it reached 5.25), so the station signs on the far wall now show over them.
- queensboro (i.ts): the 7 (four cars) and the N (three) are the same `h_subway_car_lo`; the purple
  and yellow bands stay on top of each car so the lines still read.
- snug (g.ts): `koi.glb` for the eight squashed spheres, same circles. The pool top is at 0.75 at 0.9
  opacity and the old spheres swam at 0.6, so they barely showed; the koi now break the surface.
- brooklynbridge (j.ts): the three box boats are `h_ferry`, `h_tug`, `h_ferry`. gantry (l.ts): the
  box ferry is `h_ferry`. Both rooms left their boats at the origin (on the deck, in the park) with
  reduced motion, because `k.rider` is only called with motion on; they now park on their route.
- ferry and governors (b.ts `liberty()`, called at b.ts and e.ts, and by y1.ts Castle Clinton): the
  lathed figure is `liberty_statue_v2.glb` (Gravity Jack, CC BY 4.0) at 12 x s on the code pedestal,
  turned to face a `toward` point (new optional argument, default the origin), torch light and glow
  moved to her flame. No crown mask or double side: at that distance she is the shell. Credit:
  `LIBERTY_CREDIT` exported from b.ts, a plaque on the ferry's port rail by the Liberty egg and on a
  post at the west edge of the Governors Island path. y1.ts is not mine and has no plaque yet.
- flatiron (f.ts): 26 plaza chairs instanced. The audit's Poly Haven Green Chair 01 turned out to be
  a gothic upholstered armchair and read black in the plaza, so it is one folding cafe chair from
  Poly Haven's Outdoor Table Chair Set 01 (James Ray Cock, CC0) instead, painted the plaza green
  (`ph_folding_chair_01.glb`, 3,752 triangles, 561 KB).
- oysterbar (j.ts): 30 stools are Poly Haven's Bar Chair Round 01 (Dairon Sanchez, CC0), passed from
  14k to 2,500 triangles at 512 textures (`ph_bar_chair_round_01.glb`, 289 KB), instanced, no shadows.

Poly Haven is CC0 site wide (polyhaven.com/license, checked today). Overlay at spawn, headless, 1280
by 720, before then after: subway calls 1227 to 1010, tris 425k to 614k; flatiron calls 647 to 631,
tris 548k to 931k (the chairs cast sun shadows; phones run without shadows); queensboro platform view
calls 545 to 449, tris 225k to 488k; oysterbar calls 557 to 559, tris 108k to 249k. Audit: 183 rooms,
3702 mounts, unreachable 150, backwards 91, still stuck 0, identical to HEAD before the change.

Screenshot trap, and the fix: `at=` is clamped to the room's bounds and the controller overrides any
`camera.lookAt`, so objects outside the walkable area (boats on the river, Liberty across the water)
could not be framed. Patching `renderer.render` from `shot_room.py --eval` to set the camera pose
whenever it is called with the room camera pins any view (script in the session scratchpad,
`pin.js`). Also: the shared server on 4185 may serve another session's copy; serve the site yourself.

Not verified: phones, frame rate, the boats and Queensboro trains while moving (shot with motion
off), Liberty from y1.ts Castle Clinton, the night look of the folding chairs beyond one shot.

## Free GLB swaps, m.ts to z.ts and the x/y files (2026-10-28, batch two)

From `audit/museum_m_z.md` and `audit/museum_x_up.md`. Same pattern: code object first, hidden only
when the GLB loads. Shots in `UPGRADE ALL ROOMS 2026-10-28/shots/museum_m_up/` (swapal0_ before,
swapb1_ after, pinned cameras).

- boatgraveyard (m.ts): ten box tugs are `h_tug_lo` (new, h_tug cut to 9k triangles, 728 KB) and the
  flagship ferry `h_ferry`, every clone's material pulled to the wreck's rust tint, tilt and sink kept.
- intrepid (m.ts): the shuttle is NASA 3D Resources "Space Shuttle (D)" (public domain). The textures
  with the agency insignia, the flag and lettering (wing tops, fuselage sides, tail, arrows) are plain
  white; the model's axes were permuted in Blender (it shipped length on x, span on y); 512 textures,
  `h_shuttle_enterprise.glb` 762 KB, 19k triangles, 42 materials. Checked from above: no logos seen.
- moma (p.ts): the plinths carry the kit's bronze_figure, noguchi_stone_1/2/3 and equestrian. Not
  mine, seen while shooting: the sunken garden floor (Y = -0.85) sits under a road surface with a
  double yellow line, so the plinths are buried and the props stand on asphalt.
- cars: `kit.ts` swapCabs now also takes any car sized box a room tags `userData.car`, cab yellow or
  not; the non yellow ones become a Camry or Escape body (`h_car_camry_lo`, `h_car_escape_lo`, the cab
  bodies at 4k triangles, 512 textures) with no topper, repainted in a shader that recolours only the
  texture's yellow texels to the box colour (instance colour on fleets, a uniform on singles).
  `?cars=old` keeps the boxes. Tagged: z.ts traffic() (katz, barney), q.ts manhattanhenge, u.ts mad,
  n.ts sedgwick. Two kit fixes on the way: a single moving cab box now carries its taxi as a child
  with its own material made invisible (before, the taxi was frozen where the box was at swap time),
  and with reduced motion the swap runs on a timer (kit ticks never run then, so no room swapped).
- taxidispatch (x2.ts): the five parked cabs were boxes even with the swap on (merged into the static
  batch they are no longer cab sized; checked with and without `?cabs=old`). Each is now one of the
  five cab types via `hero()`, its four wheel instances collapsed, the roof light lifted to the roof.
  The stand in boxes are tagged `cab` so the kit does not swap them a second time.
- Liberty: `libertyFigure()` exported from b.ts for rooms with their own base: ellis (q.ts) and
  pioneerworks (w.ts) lathed cones swapped, castleclinton (y1.ts) calls liberty() and now faces the
  promenade. Credit plaques by each spawn.
- laundry (x2.ts) two five car 7 trains and armstronggarden (y3.ts) three cars: `h_subway_car_lo`.
  That file is now the 2026-10-09 car at 22k triangles (was 12k this morning): the 12k cut read as
  crumpled foil at close range on the el. The subway and Queensboro rooms use the same file.
- castleclinton (y1.ts): four Poly Haven Cannon 01 (CC0; its glTF crashes Blender's importer, so it
  came from the .blend with the 1k textures wired in by script, 10k triangles, 512 textures, 472 KB);
  the Staten Island ferry is `h_ferry` painted orange; the tug `h_tug_lo` pushing the same barge.
  With reduced motion the ferry used to sit inside the fort; it now parks on its route.
- manhattanhenge (q.ts:338): a bug, as suspected. 24 `k.lamp` calls at height 0, intensity 0, all at
  (+-13.5, 0): no light, a pile of stubs and bulbs on the pavement. Replaced by heads on the existing
  posts, lit by emission only.

Overlay, before then after (pinned views, 1280 by 720): boatgraveyard tugs view tris 165k to 882k
before the 9k tug (not remeasured after); intrepid 118k to 194k; taxidispatch 153k to 180k;
sedgwick spawn 208k to 422k with the 4k cars (962k with the 14k bodies); katz 979k to 1115k; mad
494k to 510k; manhattanhenge 999k to 1418k with all taxis and cars (before the 4k bodies). Calls
fell or held in every room. Audit: unchanged (150 unreachable, 91 backwards, 0 stuck).

Not verified: the tug's facing against its barge at Castle Clinton (the bow may point away), moving
traffic (shots are motion off), phones, the night look of the private cars.

## Free GLB swaps, v0 to v26 (2026-10-28, batch three)

From `audit/museum_v0_v26.md`; shots in `UPGRADE ALL ROOMS 2026-10-28/shots/museum_v/` (swapal0_
before, swapc1_ after). Same stand in pattern throughout.

- carousel (v3.ts, 57 horses) and dumbo Jane's Carousel (v5.ts, 48): the carved hero horse, instanced
  on the turning rig (one draw per part), as `h_carousel_horse_lo` (new, the 8k horse cut to 3k at 512
  textures, 215 KB) with shadows off; box horses, saddles and plain poles hidden, riders kept and set
  down onto the new saddle height.
- rockcenter tree: tried the kit's pine and reverted. At 25 m it reads as a sparse scrub pine, not a
  dense Norway spruce, and the 3,000 lights hang in its gaps. Needs a generated spruce.
- fultonfish (v1.ts): the three box forklifts are `h_forklift` (as v21.ts); load, driver, beacon kept.
- dumbo (v5.ts): the two eight car B D N Q trains are `h_subway_car_lo`, instanced inside each train,
  shadows off; the NYC Ferry is `h_ferry`.
- pigeons: new `followInstances()` in heroes.ts drives a hero from an instanced stand in's own
  matrices every frame (once with reduced motion). pigeon.glb in v9 brooklyncentral, v10 (three
  rooms), v12 (two rooms), v13 (two rooms). Dogs: dog.glb on the leads in v13 gramercy and v16
  unionsquare (as v19.ts). Palms: cp_palm.glb for the 14 procedural kentias in v8 palmcourt.
  Atlas: armillary.glb for the five tori, its post sunk into the figure (v7 stpatricks). Reading lamps:
  hf_lamp.glb on the four Safra tables (v14). Benches: museum_bench.glb for the four rotunda benches
  (v26 honoraries).
- private cars: the kit path from batch two covers it (`userData.car`, `?cars=old`).

Overlay numbers in these rooms move by hundreds of thousands of triangles from frame to frame in the
headless shots (shadow updates), so only the steady one is given: dumbo spawn 328k to 1424k with the
8k horses, before the 3k cut and shadows off (carousel view after the cut: 905k). Audit unchanged.

Not verified in a shot: the v10 and v12 pigeons, the Safra lamps, both dogs (they ride their walkers'
splines; `pinname` found no node named dog), the Dumbo trains and ferry. Phones not measured.

## The crowd is the cast (2026-10-28, batch four, k.crowd only)

MLow approved replacing the museum's primitive people with our own characters, the whole model with its
own sculpted eye flower head (never a sphere or sprite head on a cut body). This pass does `k.crowd`
(kit.ts, about 5,000 walkers in 314 calls). The 92 per room figure, figureGeo and seated capsule sites in
`CHARACTERS_INVENTORY.md` are not done yet.

- Cast: the twelve museum `npc_` characters already used in Barney Greengrass (actress, annieh, broker,
  cabbie, clerk, editor, felix, maitre, oscar, sonny, wiseguy, workgirl), each decimated from about 30k
  to 3,000 triangles at 512 textures (`cast_<name>.glb`, about 160 KB) and to 500 at 128
  (`cast_<name>_far.glb`, about 33 KB), front turned to +z with the yaws z.ts already uses. 2.3 MB.
- `k.crowd` still builds its capsules and heads (the fallback) and now records each walker's matrix;
  `batch()` calls `castLater()`, which loads only the characters the room casts and makes one
  InstancedMesh per character and band (near, far) for the whole room, then hides the capsules. Each
  frame the walkers are packed into their band by distance to the camera: 30 m on desktop, 9 m with a
  coarse pointer. Packing matters: a zero scaled instance still costs its vertices, and three counts its
  triangles. No shadow pass for the cast. `?crowd=old` keeps the capsules. With reduced motion the bands
  are redistributed on a timer for 20 s.
- Measured, headless, spawn view, `cabs=old` both sides, old then new: halloween (172 walkers) desktop
  1534 calls 1121k tris to 1544 and 1260k, phone (390 x 844 at 3x, touch) 348 and 215k to 356 and 268k;
  manhattanhenge (150) desktop 540 and 173k to 560 and 392k, phone 142 and 48k to 155 and 126k;
  easternparkway (130) desktop 1195 and 557k to 1211 and 770k, phone 101 and 170k to 110 and 227k.
  Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/crowd_rollout/museum_*.jpg`.
- Lost: the per walker shirt and skin colours (the characters wear their own). Not verified: walking
  (they glide with a 2 cm bob, unrigged, as in Barney), a real phone, every one of the 183 rooms.

## Batch five (2026-10-28): the rooms' own people, MoMA's garden, the shuttle, statues

- People: rooms tag their primitive people with `personTag()` (exported from kit.ts): every `figureGeo`
  and `seatedGeo` (as instanced crowds or meshes), every room `figure()` (body capsule plus head, the
  head tagged 'part'), `personGroup()`, v11's bodies (heads and hats 'part') and y2's seated sitters.
  27 room files. Before the static merge, `peopleCollect()` pulls the tagged objects out, reads each
  stand in's matrix every frame and hands it to the same instanced, distance packed cast as `k.crowd`:
  standing under 1.25 m tall becomes seated. Seated cast: `seat_robber` and `seat_folksinger`, whole
  models decimated to 3,000 and 400 triangles, front to +z. A near body budget (120, 40 on phones)
  shrinks the near radius in packed halls. `?crowd=old` keeps the capsules. Not tagged: one off
  capsules that are not people builders (herons, fish, legs, saint, bearers, magi, riders, forklift
  drivers, the DJ), the 24 triangle box stadium figures, Atlas and Prometheus (statues).
- Fix for batch four: six cast files faced backwards (actress, cabbie, editor, maitre, oscar,
  wiseguy). The yaws were taken from z.ts Barney's `face`; renders from +z showed all six with their
  backs turned, so every npc_ model needs -90. Rebaked. Barney's own +PI/2 walkers likely walk
  backwards too (z.ts, not touched).
- Statues of real people get the faceless `bronze_figure`, never a likeness: Greeley and Franklin
  (newsprint, x1.ts), Hamilton and Clinton in marble (mcny, up5.ts).
- MoMA (p.ts): 54th Street was laid with `street()`, which only runs along z, so a road and its double
  yellow line ran north to south through the sunken garden over the plinths. It now runs east to west
  north of the garden screen; the marble floor, pools, birches and sculptures read.
- Intrepid (m.ts): the shuttle's exported physical materials are replaced by matte standard ones,
  untextured panels a shade of grey; the tiles on the pods and tail read now.
- Castle Clinton tug: checked from renders, its bow (the end with the wheelhouse) is at +z, so it
  already faces and pushes its barge. No change.

Measured, spawn, `cabs=old`, before then after: unassembly 461k to 1150k tris, templeemanuel 392k to
605k, paley 861k to 1010k, columbuspark 886k to 1001k, chabad770 1152k to 1341k, cityhallloop 710k
to 730k; calls within 25 either way. Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/museum_b5/` (pairs
from the same camera, JPEG). Not verified: walking crowds in motion, phones, the 27 rooms beyond the
ten shot, whether chabad's hats all hid (dark shapes on the ground in one shot).

## Batch five, review fixes (2026-10-28, v2)

- MoMA garden (p.ts): the marble floor read as snow. Its tint goes from 0xd8d4cc to 0xa8a49c (about 0.65
  albedo on the photo marble), roughness 0.35 to 0.28; the slabs, joints and steps read. The two pools
  were opaque boxes that rendered white in the noon sun; they are now `k.water` surfaces, dark and
  reflective, inside their marble kerbs.
- Barney Greengrass (z.ts): measured each walker's front against its travel direction in the page:
  before, two of six read -1 (the wiseguy and the maitre d' walked backwards, faced +PI/2), after all six
  read +1. Walkers now use one `WALK_FACE` of -PI/2; the standing figures keep their authored facing.
- Intrepid shuttle (m.ts): the wing materials (wing tops and flap tops) are darker again (0.3 untextured,
  0.5 textured); the wings read grey with their edges in the noon sun.

Shots: `shots/museum_b5/*_v2.jpg`, before and after from the same pinned cameras. Audit unchanged.

## Cast feet and the MoMA trees (2026-10-28, v3)

- Front renders of the decimated `cast_broker` and `cast_sonny` confirm both stop at the thigh and stood
  sunk in the floor. They leave the crowd cast; `gown` and `loretta` (whole, full length, from
  assets/movies, 3,000 and 500 triangles, front to +z, checked from renders) take their places. The other
  ten cast members have feet.
- MoMA garden trees: a real miss, not a headless fallback. The birch grove was code (a white stick and
  four green spheres each). It is now the tree kit (no birch in the kit, so the fine leaved honey
  locust), same places, the old rnd() calls kept so the rest of the seeded room is unchanged.
- Rockefeller Center: the room has no trees besides the Christmas tree, which stays as it is (needs a
  generated spruce).
Shots: `shots/museum_b5/moma_trees_{before,after}_v3.jpg`, `crowd_fulllength_after_v3.jpg`.

## Code built trees routed through the tree kit (2026-10-28)

Swept every room file for trees made outside `k.tree` (sphere or icosahedron canopies on sticks, cone
pines, lollipops, local tree builders).
- Changed: met (b.ts), Central Park below the roof: 260 icosahedron blobs on sticks; now 87 kit trees (a
  third, larger), same seeded places. Before they did not show above the parapet; now the canopy reads.
  Spawn 514k to 854k triangles, 868 calls both (the full 260 cost 1607k, so they were thinned).
  bowbridge (v5.ts): six willows (lathe trunk, squashed icosahedron, 480 box strands) are the kit's willow;
  spawn 759k to 742k triangles, 695 to 691 calls. moma (p.ts): done in the previous commit.
- Left: weitsmanyard (v6.ts) 4,600 instanced icosahedron blobs as the wooded hills 112 to 580 m out, a
  landscape texture; as kit trees it would cost well over a million triangles. The Rockefeller Christmas
  tree. Hedges and planter shrubs of spheres (b.ts, c.ts, h.ts, v14, v22): shrubs, not trees. v21's wire
  light trees (a light sculpture). v17 lindens and v19 cherries already use the kit.
Shots: `shots/museum_trees/` (met, met_park, bowbridge, moma, before and after).

## The one off people (2026-10-28, people pass two)

Every remaining capsule or box person a room builds by hand is tagged with `personTag` so the kit casts it
(same instanced, distance packed cast; `?crowd=old` keeps the shapes), heads and caps tagged as parts:
Bow Bridge rowers (seated), Barney's cyclist and the handball cyclist (seated), the Fulton Fish forklift
drivers (seated) and porters, the Paradise Garage DJ, the San Gennaro bearers (the saint stays a statue),
the Eastern Parkway magi, the Rockaway surfers (seated on their boards), the Gramercy resident, the
v20 performers (standing or seated by pose), the Arthur Ashe players, the Palm Court pianist (seated), the
v6 speaker, the y2 usher and reader (seated), the MCNY guide, doorman and busker, the flower market hauler.
Left: the children (v3 carousel kids, Astoria pool kids: no child bodies in the cast), the swimmers and
sunbathers lying flat (v3, v10: no lying pose), the 24 triangle box stadium crowds and Delacorte's 1,800
box seats (no cheap near band added), statues (Atlas, Prometheus, bronzes), helmets and helicopters.
Before and after from the same pinned camera: `shots/museum_people2/` (bowbridge, barney, fultonfish,
sangennaro, paradisegarage); triangles change by under 50k in each, calls fall or hold.

## The rigged cast walks (2026-10-28)

From `UPGRADE ALL ROOMS 2026-10-28/rig/` (free Blender rigs, walk and idle clips, a bone named head). Copied
read only into `assets/museum/rig/rig_<name>.glb` (14 files, 3.3 MB): actress, gown, loretta, maitre, oscar,
annieh, editor, wiseguy, workgirl, cabbie (walk and idle, all good or acceptable), clerk and felix (idle
only), robber and folksinger (seated idle). No lite files: mid and far stay the static instanced bands.
- `kit.rigLayer()`: every cast person (k.crowd walkers and personTag people) is a candidate. The nearest
  within 16 m (8 on phones), up to 20 (8 on phones), become `SkeletonUtils.clone` skinned figures pooled per
  character; they leave past 1.25 times that radius (hysteresis) and their instanced body hides meanwhile.
  Speed is measured from each person's own matrix per frame; the walk clip's time scale is that speed over
  the clip's speed at the figure's scale, so the feet stay planted. A walker the clip cannot match without
  sliding (outside 0.5 to 2 times the clip cadence, e.g. a fast coat walker) stays a static body. Under
  0.2 m/s they idle, and within 10 m the head turns toward the visitor, clamped to 60 degrees, eased; the head
  is reset to the clip pose each frame so the look never accumulates. `?rig=off` keeps everything static,
  `?crowd=old` the capsules. `window.__rigStats` reports mixer ms, skinned and walking counts.
- Measured (spawn view, cabs=old, rig off then on; triangles unchanged, the skinned bodies replace near ones):
  halloween desktop 1540 to 1564 calls, mixer 0.10 ms, 14 skinned, 6 walking; phone 354 to 355, 0.035 ms, 3.
  manhattanhenge desktop 560 to 598, 0.15 ms, 20 (all standing); phone 155 to 160, 0.056 ms, 8.
  paley desktop 750 to 784, 0.08 ms, 20, 7 walking; phone 145 to 148, 0.06 ms, 8.
- Films: `shots/rig_rollout/museum_{halloween,manhattanhenge,paley}.mp4` (8 s, 1280x720, static pinned camera
  on a moving skinned walker). Headless Chrome renders at 8 to 10 fps and the kit clamps dt to 0.1, so the
  films play in slow motion; walk and travel use the same simulated time. Seen frame by frame: legs alternate,
  walkers face their direction of travel, no popping seen in the crops. Not verified at full frame rate, on a
  real phone, or for the head look in a film (manhattanhenge's skinned people all stand; its film is still).

## People pass two, review fixes (2026-10-28)

- Bow Bridge: the "post" was one of the two empty boats tied up at the dock. The room hides those boats' rowers,
  but the kit cast them anyway. Stand ins hidden by their room before the cast arrives (or under a hidden
  parent) now get no cast; the mooring post shows again. The same rule covers every tagged room.
- Paradise Garage: the DJ is named (`personTag(o, kind, hs, cast)`): the tough, at the decks facing the floor.
  The disco king's white suit flared under the booth lamp. tough and discoking added to the cast (static near
  and far, rigged), but crowds still draw from the first twelve only.
- San Gennaro: the bearers stand under the poles, feet on the street, shoulders at the pole, as the wiseguy,
  two cabbies and Oscar.
- Rig layer fixes found on the way: the head turn is now about world up taken into the head's frame (the head
  bone's rest is tilted, so its local Y was not up and the flower spun edge on); speed is a vector average, so a
  dancer's sway or the DJ's bob reads as standing, not as an unmatched walk.
Shots: `shots/museum_people2/*_v2.jpg`, same cameras before and after.

## Room 182 MLOW INTERNATIONAL: the travellers are the cast (2026-10-28)

The terminal GLB carries 107 primitive travellers (nodes `person_tmpl<k>[.nnn]`, body, head and legs as
primitives; the six bare templates parked under the ground). New `kit.castLate(srcs, hides)` takes people a
room only finds after its own async load and gives them their own cast set (instanced near and far bodies,
rig layer: the nearest stand and breathe and turn their heads to the visitor). v25.ts keeps those nodes out
of its static merge (with `?crowd=old` they merge as before). Spawn, headless: desktop 638 calls with rig off,
652 with the rig (9 skinned, mixer 0.10 ms); phone 271 both (2 skinned, 0.04 ms); `?crowd=old` 610 calls as
before. Shot: `shots/museum_people2/mlowintl_{before,after}.jpg`, spawn camera.

## The box crowds get a near band of cast (2026-10-28, round two)

The 24 triangle box crowds (bleachers' stadium, the Little Island amph, the Apollo and Carnegie houses) and
Delacorte's box seats are tagged with the new `boxCrowdTag(im, yaw)`: the nearest become seated cast (the
robber, the one seated pose that sits on a seat without bringing furniture; the folksinger brings a stool,
sally a table, lensman a wheelchair), the far keep their boxes. The kit hides a box instance only while the
cast draws it, and reads the room's own matrix back for it (`CastFig.box`), so a box crowd its room animates or
leaves static both work. Bands: full body within 8 m, the 500 triangle body to the near radius, boxes beyond;
hysteresis on both edges (in at r, out past 1.14 r). The budget counts six mid bodies as one full one, so a
packed house shrinks the radius. The nearest are rigged idle with the head look (the existing rig layer). Yaw
PI where the seat backs are at +z (up4's houses). `?crowd=old` keeps the boxes.
Measured, pinned camera at the crowd, renderer totals (scene plus shadow and fx passes), before then after:
bleachers desktop 446 to 488 calls, 1949k to 3116k tris (cast itself 315k static plus 22 rigged), phone 76 to
85, 287k to 476k; apollo desktop 566 to 610, 330k to 1525k, phone 50 to 59, 78k to 252k; carnegie desktop 557
to 589, 443k to 1502k, phone 61 to 70, 120k to 252k; delacorte desktop 636 to 654, 917k to 1829k, phone 48 to
54, 203k to 326k. littleisland (up2.ts) is tagged but its live room id is the rebuild, not seen in a shot.
Not done: variety. Every seated cast member in a box crowd is the robber.
Shots: `UPGRADE ALL ROOMS 2026-10-28/shots/round2/museum_*` (before and after, same pinned camera).

## Box crowds, review fixes (2026-10-28, round two v2)

- Variety: each seated cast member takes the shirt colour of the box it replaces through instanceColor,
  60 percent over the texture (the rigged ones too, on cloned materials), with a fixed per seat jitter of up to
  8 degrees of turn and 4 percent of size. Gaps stay where the room left empty seats. No second seated variant.
- Cost: the second pass was not the shadow map (the cast casts none) but the GTAO occlusion pass, which draws
  the scene again for its normals. The mid and far bodies are now marked noAO and skipped there (fx.ts
  hides them with the pass's own sprite rule); the full near bodies keep their occlusion.
- Fix found on the way: the bleachers' cast faced the back wall (turned PI now); Apollo and Delacorte faced
  the stage already.
Same pinned cameras, HEAD then this: bleachers desktop 488 to 479 calls, 3116k to 2768k tris, phone 40 and
399k both; apollo (from the stage) desktop 917 to 905, 992k to 829k, phone unchanged 146 and 209k; delacorte
(front) desktop 714 to 705, 2190k to 2181k, phone 51, 356k to 329k. Shots `shots/round2/museum_*_v2.jpg`.
