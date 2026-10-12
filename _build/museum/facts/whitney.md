# whitney: The Whitney Museum, 99 Gansevoort Street

## Sources
- The Building, Whitney Museum of American Art: https://www.whitney.org/about/our-building
- Whitney Museum of American Art, Wikipedia: https://en.wikipedia.org/wiki/Whitney_Museum_of_American_Art
- How the Whitney installed an invisible flood barrier after Hurricane Sandy, 6sqft: https://www.6sqft.com/how-the-whitney-installed-an-invisible-flood-barrier-after-hurricane-sandy/

## Real plan
Renzo Piano Building Workshop, opened May 1, 2015, at the southern end of the High Line in the Meatpacking District. A strongly asymmetrical stack faced in steel panels (60 and 30 ft), stepping back from the High Line to the east with terraces on levels five to eight (13,000 sq ft outdoors) joined by an outdoor steel staircase, and overlooking the Hudson to the west. Special exhibitions gallery on the fifth floor, about 18,000 sq ft, the largest column free museum gallery in the city. A cantilevered entrance on Gansevoort Street shelters an 8,500 sq ft plaza, the largo. A 15,500 lb flood door in the river facade.

## Room vs real
| Feature | Room | Real |
|---|---|---|
| Terraces | stepping down to the east, High Line side | east, facing the High Line: right |
| Outdoor stairs | steel stairs between terraces | linking floors five to eight: right |
| Big gallery | ground block, about 1,900 m2 | fifth floor, about 1,670 m2: size close, level wrong |
| River | west | west: right |
| High Line | arrives from the north to the east of the museum | ends at Gansevoort by the museum: right in kind |
| Entrance | gap in the south wall | cantilevered entrance over the largo: not modelled |
| Facade | alternating steel and glass blocks | steel panels with bands of glass: close |

## FIXED
- No geometry changes: nothing was clearly wrong and cheap.
- Six eggs: whitney-gallery, whitney-terraces, whitney-largo, whitney-flooddoor, whitney-elevators, whitney-breuer.

## LEFT
- The big gallery sits at ground level; really it is on the fifth floor. Moving it would move 14 mounts and the floorY logic.
- The cantilevered entrance and the largo under it, a canopy and plaza on the Gansevoort front.
- Building height not sourced (the museum's own page says nine stories, Wikipedia says eight), left as is.
- Audit: 6 backwards (rescued) terrace mounts, pre existing and unaffected by these edits (eggs do not move mounts).
