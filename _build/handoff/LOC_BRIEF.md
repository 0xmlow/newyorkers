# Location metadata brief (NEW YORKERS Atlas)

Each input record is one painted character that the automatic geocoder could not pin to a place
(`current` is "citywide") or could only pin to a borough (`current` is "borough"). You have the
title, the family, the two sentence story, and the painting prompt that made the piece. Read all
three and decide where in New York City the scene takes place.

## Output
A JSON object keyed by the record `id` (string), every id in the chunk present:
{"2151": {"place": "key:subway_system", "why": "the ghost bus and the rat court ride the subway tunnels"}, ...}
- `place` is exactly one of the forms in the vocabulary file (`key:<key>`, `nb:<Neighbourhood>`, `boro:<Borough>`, or null).
- `why` is one short clause quoting the evidence, under 20 words, no em or en dashes.

## Rules
1. Most specific place the text actually supports, in this order: a named place from the vocabulary (landmark, venue, park, street, bridge, line, water), else a neighbourhood, else a borough, else null.
2. A real street, corner, station, school, church, market or building that is not in the vocabulary still counts: use your knowledge of the city to put it in the neighbourhood that contains it (`nb:`), for example "Greene and Prince" is nb:SoHo, "Atlantic and Flatbush" is nb:Downtown Brooklyn or key:atlantic_ave, "the 7 train over Roosevelt Avenue" is key:roosevelt_ave, "Arthur Avenue" is key:arthur_ave, "Fordham Road" is key:fordham_rd if present else nb:Fordham.
3. Borough words alone give `boro:` ("a Queens backyard", "a Bronx stoop"). "Uptown" alone is not enough; "Harlem" is nb:Harlem. "Downtown" alone is not enough.
4. The subway with no line, station or borough is key:subway_system if that key exists in the vocabulary, otherwise null. A named line ("the L", "the 7") uses its line key.
5. Water and harbour scenes: the harbour, the East River, the Hudson, Jamaica Bay, the Rockaways, Coney Island all have keys.
6. Do not guess from mood or family. A diner at 3am, a rooftop, a bodega, a stoop with no named block stays null. When the story and prompt disagree, the prompt wins because it made the picture.
7. Never invent a key. Every key must appear in the vocabulary file exactly. Neighbourhood names must match the list exactly (for example "Bedford-Stuyvesant", "Hell's Kitchen", "Prospect Lefferts Gardens", "St. George").
8. Expect roughly a third to a half of the records to be null. That is fine. Precision matters more than coverage.
