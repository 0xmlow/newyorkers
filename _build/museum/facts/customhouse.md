# customhouse: The Custom House rotunda (room 96, src/rooms/t.ts)

## Sources
- Alexander Hamilton U.S. Custom House, Wikipedia: https://en.wikipedia.org/wiki/Alexander_Hamilton_U.S._Custom_House

## The real plan
1 Bowling Green, Cass Gilbert, Beaux Arts, 1902 to 1907, on the site of Fort Amsterdam. Main front faces north onto Bowling Green.
44 engaged Corinthian columns (12 on the north front), each capital with a head of Hermes. Daniel Chester French's Four Continents flank the steps, east to west Asia, America, Europe, Africa. Twelve seafaring nations, 11 ft each, stand on the cornice.
Elliptical rotunda 85 by 135 ft (26 by 41 m) to the third storey, Guastavino tile ceiling with a 140 ton oval skylight, Reginald Marsh murals of 1937. Home of the National Museum of the American Indian (Heye Center) since 1994.

| Feature | Room | Real |
|---|---|---|
| Front columns | 12 | 12 |
| Four Continents | 4 bronze figures | 4 marble groups |
| Cornice statues | none | 12 nations, 11 ft |
| Rotunda | 48 x 32 m ellipse | 41 x 26 m (135 x 85 ft) |
| Dome | tile, skylight | Guastavino tile, 140 ton oval skylight |
| Murals | 8 colour panels | Marsh murals: large shipping panels, small explorer panels |

## FIXED
- Rotunda ellipse resized to the real 41 by 26 m; walls, dome, murals, counters and mounts follow the radii. Room x bounds kept at +/-23 so the two facade mounts stay rescuable; audit identical to before (3 unreachable rescued, 0 stuck).
- Added the twelve cornice statues over the columns (bronze_figure props at 3.4 m; the real ones are marble).
- Six eggs: customhouse-four-continents, -germania, -hermes, -skylight, -marsh, -fort-amsterdam.

## LEFT
- The Four Continents are generic bronze figures, the real groups are marble with animals; needs real models.
- The 50 ton Maine granite lintel and the Columbia keystone are not modelled.
- The collector's office with Elmer Garnsey's ten port paintings is not in the room.
- Pre existing: the two facade mounts at x +/-35 are out of reach (rescued), and the lobby mount at x 11.7 is unreachable (rescued). Not touched.
