# THE ATLAS — how the map is built

`map.html` at the site root is a self-contained interactive map of where every NEW YORKERS
piece takes place. It reads two files that already ship with the site plus one new one:

| file | role |
|---|---|
| `assets/data.js` | the census (1,841 pieces, titles, stories, families, eras, states, edges) |
| `assets/geo.js`  | **new** — the geocode + the NYC basemap, written by this folder |
| `assets/t/*.jpg` | the thumbnails, keyed by each piece's state hash |

No build step, no dependencies, no network at runtime. Open `map.html` directly or serve it.

## Rebuilding `assets/geo.js`

```bash
cd "_build/map" && python3 build_geo2.py
```

Inputs in this folder:

- `nta_raw.json` — NYC 2020 Neighborhood Tabulation Areas (NYC Open Data, dataset `9nt8-h7nd`)
- `boro_raw.json` — NYC borough boundaries
- `gazetteer.py` + `gazetteer_extra.py` — the hand-built place list
- `build_geo.py` — geometry helpers and the first-pass matcher (imported by `build_geo2.py`)
- `build_geo2.py` — the real build

Output is `window.NY_GEO` : borough outlines, 226 neighbourhood polygons, every matched place,
and one record per piece.

## How a piece gets placed

Each piece's **title**, **story** and **recorded borough field** are matched against a gazetteer of
542 New York places (964 name patterns): landmarks, venues, parks, bridges, streets and avenues,
subway lines, waterways, islands, and every 2020 neighbourhood with its common aliases
(`bed-stuy`, `LES`, `the village`, `k-town` …).

Scoring, highest wins:

- a hit in the recorded borough field counts ×4, in the title ×3, in the story ×1
- specificity is weighted — a landmark or venue outranks a neighbourhood, which outranks a
  subway line, which outranks a whole borough
- a place in the same borough the record already names gets a bonus; a place in a different
  borough is penalised
- longer patterns win ties, so *Brighton Beach* beats *Brighton*

Result, per piece:

| precision | count | meaning |
|---|---|---|
| `site` | 312 | a named address, landmark, bridge, street or corner |
| `area` | 265 | a neighbourhood, subway line or waterway |
| `borough` | 96 | only the borough is known — scattered inside its polygon |
| `citywide` | 1,168 | no fixed address — scattered across the five boroughs |

Pieces that share a place are fanned out on a golden-angle spiral (~up to 260 m) so the pile
reads as a count at low zoom and as individual pins once you are close enough.

## Honesty rules baked into the data

- The citywide scatter is **illustrative**, not a claim. It is seeded from each piece's id, so it
  is stable between builds, and every citywide piece says so in its panel.
- The heat map counts only pieces pinned to real ground (`hd:1`). Pieces pinned to a whole
  borough, a subway line, or "the subway" as a system are marked diffuse and excluded, so they
  cannot pile into whichever neighbourhood happens to hold their anchor.
- Diffuse places never fan out into individual pins on the map — they stay one dashed bubble.
- The borough filter uses the borough the record actually names. A citywide piece whose dot
  landed in Queens is not counted as a Queens piece.

## Scene

Every piece, located or not, is also classified into one of twelve scene types — Subway, Street,
Stoop, Rooftop, Bodega, Interior, Park, Water, Night, Work, Civic, Weather — by weighted keyword
counts over title and story, with the title double-weighted. Pieces that match nothing stay
`Citywide`. This is a soft read of the writing, not a fact in the record; it exists so the 1,168
placeless pieces stay filterable and legible.

## Adding places

Append to `EXTRA` in `gazetteer_extra.py`:

```python
("my_key","Display Name","landmark","Brooklyn", 40.1234, -73.1234, ["pattern one","pattern two"]),
```

`kind` drives specificity and diffuse-ness: `landmark venue institution` (10) · `park island bridge`
(9) · `corridor` (8) · `neighborhood` (7) · `line transit` (6, diffuse) · `water` (5) · `borough`
(2, diffuse). Then rerun the build.
