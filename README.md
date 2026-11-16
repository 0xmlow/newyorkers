# THE LIGHTINGS: the city that switches itself on

A walkable, photoreal three.js gallery by MLow, built with NEW YORKERS. Nine rooms in walking order, from Fifth Avenue across
from the plaza, through the Channel Gardens, the rink and the tree, seventy floors up, up Fifth to the menorah at 59th Street,
over the bridge to the other largest menorah, into a Brooklyn window, and out to Dyker Heights. Everybody has an eye flower
for a head. One shared night runs through every room: the tree you light downstairs is lit upstairs, and the night of
Chanukah is the real one by the New York calendar (sundown, 2025 to 2028), or the one you pick.

Open it: double click `Open THE LIGHTINGS.command`. It lives on the mlow2026 drive; the Desktop folder is a link to it.
Not on n3wyorkers.com yet: wiring it in (`build_galleries.py`, slug and page) and deploying are MLow's call.

| # | Room | The fact under it | The trick |
|---|---|---|---|
| 1 | The Show Across the Street | Fifth Avenue, the department store facade show most Decembers since 2004 | stand on the X; the whole facade becomes one eye flower, from there only |
| 2 | The Channel Gardens | the twelve herald angels, since 1954 | the angels light and lift their trumpets as you pass; the last one plays; an anamorphic eye flower stands up off the paving from one spot |
| 3 | The Rink | the sunken rink, opened Christmas Day 1936 | skate on reflective ice; your trail glows; close a loop and it turns gold until the resurfacer erases it |
| 4 | The Lighting | the workers' tree, 1931; first official lighting, 1933 | press the switch: the plaza goes dark, the crowd counts down, 22,000 lights spiral up, the 70 spike star ignites with a vertigo push and fireworks, and every storefront warms up with it |
| 5 | Seventy Floors Up | the deck, opened 1933, closed 1986, reopened 2005 | a model of the plaza under glass whose tree is lit only if you lit the real one; coin binoculars; a snow globe you can shake |
| 6 | Fifth and Fifty Ninth | Grand Army Plaza Manhattan, lit since 1977, 32 ft | ride the utility bucket up and light the lamps in order: shamash first, newest first |
| 7 | The Other Largest | Grand Army Plaza Brooklyn, since 1985 | a tape measure gets 32 ft for both and calls it a tie; a dreidel that lands; a sidewalk tree seller |
| 8 | The Answering Windows | a Brooklyn apartment, the street side | light the menorah on the sill and fourteen windows across the street answer, each in its own time, each with its own menorah and someone at the glass |
| 9 | Dyker Heights | the competition, traced to 1986 | throw the main: the block goes dark, puddles and all, relights house by house, and ends on one quiet porch bulb |

Across the walk: a holiday radio in five rooms with eight stations (Chanukah, Christmas, the Ukrainian Shchedryk, Las Posadas,
a Puerto Rican parranda, Kwanzaa, Yalda, Diwali), all synthesised; backlit ads for N3WYORKERS.COM, MLOW.NYC and MLOW.XYZ with
MLow's census art turning over on their other face; banners of the room's New Yorkers on every lamp; nine pieces of chocolate
gelt to find; 60 eggs in all.

## v3: the street is built, not pasted

Every street side is a modelled building (`_build/src/arch.part.js`): plinth, pilasters, recessed shop windows, lit fascia
signs, awnings and blade signs, a dentil cornice, two floors of windows with sills and lintels, fire escapes in Brooklyn,
porches in Dyker Heights, sidewalks and curbs. Every window ray traces a room behind its glass from a sixteen cell atlas of
generated shops and apartments (`tools/atlas.py`). MLow's Impermanent Vision runs as a projection on one building per room
(a projector switches Whisper, Bloom, Melt), breathes inside his shop displays, and covers the south walls as murals. The
answered windows are joined by cobalt threads and end in one eye over the building; the snow globe replays the model tree.

## How it is made

- **Art direction**: GPT 6 Astra through the Krea Agent, text only, on contact sheets of this gallery and ON LOCATION.
- **Plates, facades, upper storeys, ads, key art**: GPT Image 2.6 on Krea (`work/v2/`, prompts in `work/v2/prompts.json`,
  every job in `work/krea_runs.tsv`), depth by Depth Anything V2 Small, locally (`tools/install_v2.py`).
- **Cast and props**: Tripo H3.1 on Krea (angels, Zamboni, skaters, truck, lineman, Santa, snowman, reindeer), Poly Haven
  CC0 props from ON LOCATION, the ON LOCATION rigged crowd. The skater, the first timer and the lineman are rigged here
  (`_build/rig/rig_pass.py`, free headless Blender).
- **Engine**: ONLY IN NEW YORK's, three r185, bundled with the museum's esbuild. `_build/src/build.js` is assembled from
  `head.part.js`, `helpers.part.js`, `body.part.js` and `dress.part.js`: edit the parts.

## Rebuilding and checking

    python3 tools/install_v2.py          # new Krea images into site/assets (walls, ads, plates with depth)
    python3 _build/build.py              # everything (--js for code only; new walls need the full build)
    python3 _build/check_all.py work/check        # every room headless, console errors
    python3 _build/tricks.py work/tricks          # every room's trick played headless, what fired

## Not verified

Real phones (only headless Chrome at desktop size). Frame rate with the puddle reflections on a slower Mac. The radio
stations by ear (they are built and switch, but nobody has listened to all eight through). The snow globe's glass on
Safari. Walking every collider by hand.
