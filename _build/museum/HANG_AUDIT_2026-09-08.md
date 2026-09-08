# The hang, audited across all 111 rooms

2026-09-08. Measured by walking every room in the browser and reading the built
geometry: each mount's position, its facing, its viewing target, and the room's
own collision model. Numbers are facts from that sweep, not estimates.

## What was wrong

**Repeats.** 2,335 mounts hang in the building and the census has 7,541 painted,
so nothing should ever hang twice. The export of 2026-09-06 hung 2,343 works
that were only 1,981 distinct pieces: 326 mountings were repeats and one piece
hung in six rooms. On top of that, the launch hang put the same twelve at the
front of all 111 rooms, so the first twelve works a visitor met were identical
wherever they went.

**Unviewable works.** 376 mounts pointed the visitor at a spot inside a
collision block, inside a keep out, or outside the room's own bounds.
`constrain()` shoves the camera out of all three, so those are positions a
visitor can never hold and those works could never be stood in front of.

**Backwards works.** 234 mounts faced away from the place the visitor was sent
to see them from.

591 of 2,335 mounts, in 82 of 111 rooms, were one or both.

## What is fixed

| Fix | Where |
|---|---|
| Every piece belongs to exactly one room, and hangs nowhere else | `assign_hang.mjs` writes `src/hang_owned.ts`; `placeHang()` reads it |
| The launch twelve lead only in the room each one belongs to | `hangList()` case `launch` |
| The Flatiron prow gallery is enterable, and its 14 works sit on the walls instead of two to three units inside the terracotta | `rooms/f.ts` |
| The Unisphere basin rim clears the globe. At radius 17.55 all eight works were inside the sculpture's own 18.2 keep out | `rooms/e.ts` |
| The Great Hall entrance stair climbs toward the building. Treads used to rise away from it while the walkable floor rose toward it, so you climbed an invisible ramp with the visible steps descending beside you | `rooms/r.ts` |
| Any mount whose target is unreachable or backwards now falls back to a standable spot in front of the work | `viewpoint()` in `main.ts` |

The fallback rescues 376 of the 593 broken mounts. It is a safety net, not a
substitute for fixing the room.

## What still needs a hand

These rooms have mounts the fallback cannot rescue, because nothing in front of
the work is standable. Columns are: mounts, unreachable targets, backwards
works, and how many are still stuck after the fallback.

```
room              mounts  unreach  away  stuck
navyyard              21       21     0     21
strivers              18        7    10     17
garden                23       12     0     12
easternparkway        20        8     8     10
radiocity             23       12     0      9
socrates              21        6     3      9
arthuravenue          22        7    15      8
manhattanhenge        22        8     0      8
bleachers             22        0    20      6
carnegie              20       16     0      6
cyclone               22        9     6      6
dakota                22       10     4      6
boatgraveyard         20        4     4      6
belvedere             20        0     6      6
balloons              20        0     6      6
```

Another 33 rooms have between one and five stuck mounts. `navyyard` is the worst
in the building: all 21 of its works are inside a block, which is the same fault
the Flatiron had, and the same shape of fix.

Rooms where every broken mount is rescued by the fallback and the geometry is
still wrong underneath, worth fixing when there is time: `liberty` (all 25 face
away), `highline` (20 targets outside bounds), `library` (18 blocked),
`halloffame` (12 face away), `apollo` (18 blocked).

## How to re-run the audit

Open the museum, then in the console step every room and compare each mount's
target against `kit.blocks`, `kit.keepOut` and `build.bounds`, and its facing
against the direction to its target. A mount is sound when its target is
standable and the dot product of its normal with the direction to the target is
positive.
