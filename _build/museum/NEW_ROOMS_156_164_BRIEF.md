# Brief: rooms 156 to 164, and Eldridge Street rebuilt

Written 2026-09-24. MLow asked for eight of the city's great synagogues, the Ohel,
Gramercy Park with its fence and its key, and a new Eldridge Street.

Read `NEW_ROOMS_147_152_BRIEF.md` first: sections 1 (what to read), 2 (the
standard), 3 (your loop), 4 (facts) and 6 (hand back) apply unchanged. The only
differences: your facts file is `_build/learn/room_facts_11_<yourtag>.json`, and the
rules in section 2 below come on top of the standard.

| # | id / const | file | place |
|---|---|---|---|
| 156 | `templeemanuel` | `src/rooms/v10.ts` | Temple Emanu-El, Fifth Avenue at 65th Street. The Romanesque limestone front and great arched window on the avenue, the vast sanctuary (one of the largest synagogue halls in the world), mosaic arch round the ark, the Beth-El chapel, the Bernard Museum of Judaica galleries. Central Park across Fifth. |
| 157 | `kehilathjeshurun` | `src/rooms/v10.ts` | Kehilath Jeshurun, East 85th Street between Park and Lexington. The 1902 limestone front on a rowhouse street, the sanctuary with its gallery and stained glass, Ramaz school children on the street. |
| 158 | `jewishcenter` | `src/rooms/v10.ts` | The Jewish Center, West 86th Street. The "shul with a pool": a tall mid block building that is synagogue, school and community house in one, the sanctuary upstairs, the famous pool and gym. |
| 159 | `chabad770` | `src/rooms/v11.ts` | 770 Eastern Parkway, Crown Heights. The brick Gothic Revival house front everyone knows (copied round the world), Eastern Parkway with its malls and benches, the main study hall below with its long tables, benches and tiered stands, students learning in pairs, crowds and motion. |
| 160 | `ohel` | `src/rooms/v11.ts` | The Ohel, Montefiore Cemetery, Cambria Heights, Queens. The visitor center house on Francis Lewis Boulevard where visitors write notes and light candles, the path to the open roofed enclosure. Quiet, respectful, candle light. See the rules below. |
| 161 | `safra` | `src/rooms/v12.ts` | Safra Synagogue, East 63rd Street. The contemporary Sephardic sanctuary in stone and wood, the central reader's platform, the light. |
| 162 | `shearith` | `src/rooms/v12.ts` | Congregation Shearith Israel, the Spanish and Portuguese Synagogue, Central Park West at 70th. The Neoclassical front with its columns, the main sanctuary with the reader's desk facing the ark, sand, candles and brass, and the Little Synagogue with its colonial furnishings. Central Park across the avenue. |
| 163 | `parkeast` | `src/rooms/v12.ts` | Park East Synagogue, East 67th Street. The 1890 Moorish Revival front with its two unequal towers and striped arches, the sanctuary with its painted and gilded decoration and stained glass, the school next door. |
| 164 | `gramercy` | `src/rooms/v13.ts` | Gramercy Park. The locked cast iron fence, the gates, the gravel paths, the planting and the Edwin Booth statue in the middle, and the buildings round it: the National Arts Club, The Players, the Gramercy Park Hotel, 34 and 36 Gramercy Park East, the brownstones on the south and west. **The key:** see below. |
| 124 | `eldridge` (const `eldridge2`) | `src/rooms/v13.ts` | The Eldridge Street Synagogue and the Museum at Eldridge Street, rebuilt as a new version. The current y1.ts `eldridge` stays untouched; `v13.ts` exports `eldridge2 = { ...eldridge }` as a start and `y.ts` already loads it. Replace it with a full rebuild: the 1887 Moorish Revival front on Eldridge Street, the restored sanctuary with its painted stars, brass fixtures and galleries, the 2010 east window by Kiki Smith and Deborah Gans, and the museum's lower level. |

Placeholders are registered: `v0.ts` LIVE_ROOMS, curation in `src/data.ts`, the
check scripts assert 164, `y.ts` loads `eldridge2`. **Replace the placeholder in
your own file only.** Do not edit v0.ts, y.ts, y1.ts, index.ts, data.ts, main.ts,
kit.ts or another builder's file. Local helpers go in your file. Keep your file
syntactically valid at all times: every builder's preview bundle compiles every
room file. Save early and often: a builder that dies with nothing on disk costs
the whole run.

## 1. Census wall starts (use these, so rooms show different faces)

templeemanuel 1500, kehilathjeshurun 1900, jewishcenter 2100, chabad770 2700,
ohel 3100, safra 4300, shearith 4700, parkeast 6200, gramercy 6800, eldridge 7100.

## 2. Rules for houses of worship, on top of the standard

These are working congregations and, for the Ohel, a grave. Build them the way a
respectful visitor would photograph them.

1. **No likeness of any real person.** No portrait of the Rebbe anywhere, though
   real Chabad spaces are full of them: leave those frames out. No rabbis,
   cantors or donors as recognisable figures. Crowds are simple, anonymous forms.
2. **No sacred text.** Do not letter the Ten Commandments tablets, the ark
   curtain, Torah scrolls or any Hebrew scripture, and never the Divine Name.
   Tablets are blank or carry simple abstract marks. Building names in English on
   the street front are fine (they are public signage).
3. **Where the art hangs.** The New Yorkers are portraits of people. Do not hang
   them on the ark wall, beside the ark, or anywhere in a sanctuary facing the
   congregation. Hang them where a congregation honestly shows art and people:
   lobbies, vestibules, corridors, the museum galleries (Temple Emanu-El's Bernard
   Museum, the Museum at Eldridge Street's lower level), the social hall, the
   school corridor, the street front on freestanding boards or in the arcade. The
   sanctuary is the view you walk into, not a gallery wall. Census walls follow
   the same rule.
4. **The Ohel.** No art inside the enclosure or at the grave, no mounts facing it,
   no eggs on it, no playful motion near it. The mounts go in the visitor center
   (its rooms and the covered walk), and the enclosure is reached down the path
   as a quiet end point: candle light, notes, stone, open sky. The eggs are
   factual (the place, the visitor center, the practice of writing notes), never
   jokes. Motion is candle flicker and a few visitors, slow.
5. **Motion that belongs.** Congregants arriving, students learning in pairs,
   flickering memorial lights, a door swinging, traffic on the avenue, trees in
   the wind, pigeons. Nothing comic.
6. **The eternal light** (ner tamid) hangs in front of the ark in each sanctuary,
   lit. It is a good lit focal point for the spawn view.
7. Eggs stay factual and sourced as always. Architecture, founding, architects,
   restoration dates, the congregation's history. Nothing about individuals'
   private lives.

## 3. Gramercy Park and the key

The park is private and locked: only residents of the surrounding lots hold keys.
Build it that way.

- Spawn on the sidewalk outside the fence, on Gramercy Park North looking south
  over the fence into the park, with the art in view.
- The gates are locked: the fence and each gate are in `k.keepOut` (or blocks) so
  the visitor cannot walk in.
- **The key** is an egg (`k.egg`) with a sourced fact about the keys (Wikipedia's
  Gramercy Park article covers the locks and the key holders). Hang it somewhere a
  visitor would honestly find a key: the doorman's desk under an awning, or a hook
  inside the open door of one of the houses. Make it a visible brass key model
  with the glint.
- When that egg is found (`k.eggs[i].found` goes true; poll it in a `k.ticks`
  callback), unlock: remove the gate's keepOut entries from `k.keepOut` (main.ts
  reads the array live every frame) and swing the gate open over a second or two.
  Check that whatever you use to block the gate is actually removable at runtime;
  if it is a merged static block it will not be, so use keepOut circles.
- **The audit sees the park locked.** So every mount must be reachable from the
  sidewalk: hang the works on the fence (framed panels on the railings, facing
  out), under the awnings, on the fronts of the clubs. Inside the park put the
  statue, the paths, the planting, benches, birds, and maybe one egg. The park is
  the reward, not the gallery.
- Motion: cabs and cars round the square, a dog walker, leaves, pigeons, a
  resident unlocking a gate now and then.

## 4. Eldridge Street (the rebuild)

Read the existing y1.ts `eldridge` (from line 728) to see what it has, then build
it better: the street and its tenements, the facade true to the photographs, the
sanctuary as restored in 2007 (the painted stars on blue, the brass chandeliers,
the balcony on its columns, the bimah, the ark), and the east window of 2010,
stars on blue glass, as the lit focal point from the sanctuary floor. The New
Yorkers hang downstairs in the museum level and in the entry, not in the
sanctuary (rule 3). You may import helpers from y1.ts if they are exported, or
copy them into v13.ts; do not edit y1.ts.

## 5. Tags and ports

Each builder is given a tag and port in its prompt. Use only those. Clean up your
variant files when finished.
