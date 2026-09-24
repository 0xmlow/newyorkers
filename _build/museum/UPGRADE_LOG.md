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

## Next, in the audit's order

snug (13), strivers (13), halloffame (12). Then the facade rooms, then
the ported corridors 1 to 21.
