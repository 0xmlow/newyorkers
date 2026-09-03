# Location metadata, second pass: fill the map in

Every record here is a painted NEW YORKER that still has no place on the Atlas (or only a borough).
The artist wants the map filled in: **every piece gets a real, approximate location** chosen from what
is happening in the scene and where in New York it is supposed to take place. Read the title, the
family, the set, the two sentence story and the painting prompt, then decide the most plausible real
location. Null is not allowed in this pass.

## Output
A JSON object keyed by record `id` (string), every id present:
{"37": {"place": "nb:Midtown", "conf": "inferred", "why": "a crosswalk tide at rush hour reads as Midtown"}, ...}
- `place`: exactly one of the vocabulary forms: `key:<key>` (named place), `nb:<Neighbourhood>` (exact
  spelling from the list), or `boro:<Borough>` (last resort only).
- `conf`: `"stated"` when the text names or unmistakably describes the place, `"inferred"` when you chose
  the most plausible location from the scene.
- `why`: one short clause, under 20 words, no em or en dashes.

## How to infer, in priority order
1. Anything named or unmistakably described: use it (a key if one exists, else the neighbourhood that
   contains it, using your knowledge of the city).
2. The scene's institutions and trades: a halal cart at lunch is Midtown, a courthouse is Foley Square
   (key:foley_sq), Wall Street villains are the Financial District, a garment worker is the Garment
   District (key:garment), a fashion house is SoHo or Madison Avenue, a fish market is Hunts Point
   (key:hunts_point_market) or the Seaport, a ferry is the Staten Island Ferry, a container port is Red Hook
   or Port Newark side (use Red Hook), an airport worker is JFK or LaGuardia, a hospital night shift can be
   Bellevue's neighbourhood (nb:Murray Hill or key:bellevue if present), a stock ticker is Wall Street.
3. Cultural cues: hip hop origins are the Bronx (key:sedgwick or nb:Morrisania), punk is the East Village,
   Dominican life is Washington Heights, Chinese food and mahjong are Chinatown or Flushing, Russian
   scenes are Brighton Beach, Orthodox scenes are Borough Park or Williamsburg, Caribbean scenes are
   Flatbush or Crown Heights, Italian scenes are Arthur Avenue or Bensonhurst, Greek diners are Astoria,
   Polish is Greenpoint, Korean is Koreatown (32nd Street, nb:Midtown) or Flushing, Indian is Jackson
   Heights, Irish is Woodlawn or Bay Ridge, artists' lofts are Bushwick or Long Island City, the old art
   world is SoHo, galleries are Chelsea, brownstone stoops are Bed-Stuy, Park Slope, Harlem or Fort
   Greene, rooftops with water towers are Manhattan or Williamsburg, tenement fire escapes are the Lower
   East Side, projects are Queensbridge or the South Bronx, beach scenes are Coney Island or the
   Rockaways, boardwalk is Coney Island, fishing is Sheepshead Bay or City Island.
4. The subway with no line named is key:subway_system; with a line named use its key; a station or
   platform with a borough cue uses the neighbourhood.
5. When nothing at all points anywhere, pick a plausible neighbourhood for that kind of life and spread
   your choices across all five boroughs and many neighbourhoods rather than piling everything on Midtown.
   The map should look like the whole city. Vary: Sunset Park, Jackson Heights, Mott Haven, Ridgewood,
   Bay Ridge, Inwood, Canarsie, Corona, Tremont, St. George, Flushing, East New York, Kingsbridge,
   Jamaica, Bensonhurst, Astoria, Hell's Kitchen, Harlem, East Harlem, Washington Heights, Bushwick,
   Crown Heights, Flatbush, Woodside, Elmhurst, Soundview, Pelham Bay, Tottenville and the rest.
6. Sets and series (the Hours, the Months, the Moons, the Tarot, community boards, subway lines):
   place each member somewhere different and fitting so a series reads as a walk across the city.
7. Fictional places (the sixth borough, the boroughs of sleep) still get a real anchor: use the real
   place the fiction hangs off (a bridge from Queens is nb:Long Island City, a train into the boroughs of
   sleep is key:subway_system).

## Rules
- Never invent a key. Every key must exist in the vocabulary file exactly; neighbourhood names must match
  the list exactly.
- Prefer key: or nb: over boro:. Use boro: only when even a neighbourhood guess would be arbitrary AND
  the borough is stated.
- Records that already have current_boro must stay inside that borough.
- Mark conf honestly. Most of this pass will be "inferred" and that is expected.
