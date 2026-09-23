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

Museum wide: 527 rescued works, now 482.

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

## Next, in the audit's order

littleisland (20 rescued), highline (20 unreachable), arthuravenue, library, apollo,
carnegie, mcny, dakota, snug, strivers, halloffame. Then the facade rooms, then the
ported corridors 1 to 21.
