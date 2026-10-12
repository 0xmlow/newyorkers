# MLOW SPEAKS, the MLOWTAR booth (2026-10-12)

The fortune booth from ON LOCATION made into a page: `mlowtar.html`. A walk up three.js Zoltar: drop a token
in the coin slot (or press ASK, which drops one for you), the booth deals a New Yorker from the census as your
card, reads a fortune off it, speaks it out loud when sound is on, prints a one of a kind generative ticket out
of the card slot, names a room of the museum to go stand in, and talks back when the oracle is awake.

## Second pass, same day (MLow: "the top looks like AI slop", "MLOW SPEAKS", "print tickets")

- **The crown is rebuilt, and the words are geometry.** The baked "MLOWTAR SPEARS" plate is cut away in the
  fragment shader (model space `y > 0.862`, `discard`) and a real arched sign stands in its place: an extruded
  arch (`ARCH` in app.js) with a red enamel face (canvas: ground, inner panel, gold pinstripes, corner scrolls,
  the small FORTUNES · THE CENSUS · N3W YORKERS line), a gold bevel and brass cap, chase bulbs along the arch
  and the lip. MLOW SPEAKS itself is extruded brass lettering: `_build/mlowtar_sign.py` instances Fraunces
  (opsz 144, wght 900, from ON LOCATION's `site/fonts/Fraunces.ttf`) with fontTools, flattens the glyph
  outlines into `assets/mlowtar/sign.json`, and `buildWord()` in app.js turns each glyph into a THREE.Shape
  with holes and extrudes it with a bevel. A canvas texture was tried first and went soft and clipped; never
  go back to that. To change the words, add them to `WORDS` in mlowtar_sign.py (so the glyphs exist) and to
  `buildLetters()`.
- **The texture pass is in the shader, not a new GLB.** Unsharp against four neighbour texels, a touch of
  saturation, then hue classification: gold texels get metalness 0.9 and roughness 0.3 (the trims read as
  brass), red texels get roughness 0.5 (paint). A real glass pane (MeshPhysicalMaterial transmission) sits in
  the window. The floor is the site's glazed tile, the wall its brick, both from `assets/ui`.
- **Hotspots** by raycast against invisible boxes: coin slot (drops a token), card slot, the glass (a knock),
  the printed ticket (opens it big). The figure also follows the pointer (`uGaze`).
- **The ticket** is `assets/mlowtar/ticket.js`: a 1000 x 2300 canvas seeded by the reading. The art panel
  mixes three systems, as asked: ports of MLow's Memories renderers (bloom grid, identicon seal, torn edge,
  perforations, barcode, seeded noise contours; source: `~/Documents/Claude/Projects/MLOW CAREER & TALENT
  MANAGEMENT/memories/site/renderers/`), a one bit glyph set drawn in the Visualize Value idiom (bagel, slice,
  manhole, subway bullet, water tower, hydrant, token, MetroCard, anthora cup, pigeon, stoop, bridge, nazar,
  check, eye flower, star, heart), and MLow's ChatGPT object stickers in five arrangements (hero, fan,
  scatter, column, bomb). No Jack Butcher code exists on this Mac; the glyph system is original, written in his
  idiom, and the page copy says so. Six palettes from the site tokens. No date is printed.
- **The sticker drawer**: `_build/mlowtar_stickers.py` picks 49 New York sets (eight each) plus the brand
  marks from the two object packs (`NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300`,
  `NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300`), crops to the alpha, shrinks to 320 px,
  quantises, and writes `assets/mlowtar/stickers/<id>.png` plus `stickers.json` with the themes each set
  serves. 395 files, 12.6 MB, committed. Idempotent; run by `build_mlowtar.py`.
- **The ticket wears the site's transit kit** (second pass, after MLow asked for it to be as brandable as the
  site): the black enamel station sign with its white rule as the header, the tactile platform edge under it,
  the mosaic eye frieze (`assets/ui/mosaic-eye.webp`) under the art, the lucky strip as a MetroCard (gold,
  harbor stripe, N3W YORKERS), one of the usable N3W YORKERS lockups from `assets/brand/logos/logos.json`
  pressed on in multiply (a different lockup per seed), and the bodega awning stripe at the tear.
- **Save the ticket** renders at 2x (2000 x 4600 PNG) and downloads. The slip shows the ticket at 1x, the 3D
  scene shows it printing with a stutter and hovering beside the booth.
- **The voice**: Web Speech (`speechSynthesis`), a low slow read of the greeting, the omen and the room,
  tied to the sound toggle (SOUND AND VOICE ON). Off by default.
- **Third pass (MLow: blue, branded, perfect sign, better glass, better agent, keep the receipts).** The red
  paint texels are remapped to MLow blue in the fragment shader (luminance kept, so the shading survives); the
  crown enamel is blue; MLow's eye sits on the brass cap as a disc and a N3W YORKERS plaque (lockup 02) on the
  lower door. The sign is centred on its ink, not its advances, with tighter tracking and a narrower space.
  The glass is a clear pane (opacity 0.07, clearcoat) instead of a transmission pass, and the cabinet has
  its own lamp above the turban and a cool fill at the pane. The omens were rewritten with the
  jackbutchertweet skill (point first, under fifteen words, colon pivot, land on a noun, no closing period)
  and the Function carries the same compression rules, a `search_city_facts` tool over api/articles.json,
  effort medium, and a hard refusal to deal a card already dealt in the conversation. Tickets are kept on a
  shelf in localStorage (`ny_mlowtar_tickets`, last 24, the slim reading, re-rendered on demand) and sent to
  the collector profile as an `event` of kind `ticket` when one exists; `hit.js` also accepts `ticket`.
  og.jpg is a capture of the blue booth mid consult.
- Not done, by choice: Art Blocks style onchain randomness. The seed is `hash(question + minute)`, which is
  what a shared link replays; when MLow wants it onchain the ticket renderer is already deterministic from one
  integer.

## Files

| Path | What |
|---|---|
| `_build/build_mlowtar.py` | The builder. Writes `assets/mlowtar/deck.json` (the census as a deck, 7,542 rows of `[id, title, family, borough, neighborhood, era, thumbKey, hook]`), copies `og.jpg` from the ON LOCATION concept render, copies `match.js` into the Function's `_lib`, writes the page. In `build_all.sh` before the arcade. |
| `assets/mlowtar/app.js` | The scene (ES module, imports `three` from `assets/airport/vendor/three.module.js` through an import map, no GLTFLoader: the GLB is parsed by hand since it is one mesh and one jpeg). The procedural rig, the lights, the marquee bulbs, the dust, the fortune card, the synth sounds, the panel, the live or local switch. |
| `assets/mlowtar/oracle.js` | The booth's own voice: greetings, family and borough lines, fourteen theme omens, closers, room reasons. Deterministic from `(question, seed)` so a shared slip replays. |
| `assets/mlowtar/match.js` | The matcher both runtimes share: tokens, theme detection, room and card scoring. **Edit it here only**; the builder copies it to `_build/api/functions/api/_lib/mlowtar_match.js`. |
| `assets/mlowtar/app.css` | Stage left, slips right; tokens only. Phone: stage 62svh on top, slips under it. |
| `_build/api/functions/api/mlowtar.js` | `POST /api/mlowtar`. Claude plays MLOWTAR with three tools (`search_new_yorkers`, `search_rooms`, `deliver_fortune`), raw fetch (no SDK: Functions ship with no bundler). 503 without a key; the browser then answers alone. |

The booth model is `assets/movies/assets/glb/mlowtar.glb`, the one ON LOCATION already ships. MLow had three
copies (ON LOCATION work/glb_pass, the site, the package); all three were byte identical, so nothing was
duplicated. Tripo, 22,500 vertices, no bones.

## The rig

The GLB has no skeleton, so the rig lives in the vertex shader of the booth's material (`rigMaterial` in
app.js). The interior of the cabinet is the box `|x| < 0.135, |z| < 0.155, 0.30 < y < 0.86` in model
space; vertices inside it are the figure and the ball, everything outside is cabinet. Inside the box, weight
grows with height, so the figure breathes, leans to the glass while consulting (`uLean`), nods while the slip
types out (`uSpeak`), and the crystal (a sphere about `(0.085, 0.40, 0)`) swells and glows iridescent. The
sign plate (`y > 0.86, x > 0.06`) is lit from inside. The booth faces +x in the file; the group is turned
`-90deg` so it faces the camera.

If the model is ever replaced, re-measure those bounds: `python3` over the GLB's POSITION accessor, the way
it was done on 2026-10-12 (bands of y, counts inside the inner box, the +x face has the slot detail).

## Live mode: what MLow has to set

Cloudflare Pages project `new-yorkers`, Settings, Variables and Secrets:

- `ANTHROPIC_API_KEY` (secret, required). Without it `/api/mlowtar` returns 503 and the page quietly uses its
  own oracle; the mode pill says THE BOOTH instead of LIVE.
- `MLOWTAR_MODEL` (optional, default `claude-opus-5-5`). `claude-haiku-5-5` is about forty times cheaper per
  consult if the bill matters more than the prose.
- `MLOWTAR_EFFORT` (optional, default `low`).
- D1 binding `DB` is optional; when present the Function rate limits with the existing `hit_rate` table
  (12 consults a minute per ip hash, the hash never stored). `hit.js` accepts a new kind `oracle` for the
  per ask count.

Cost at the defaults: about 6 to 9k input tokens (system prompt cached after the first call) and 400 to 700
output tokens per consult, three to four API rounds. Roughly $0.02 to $0.04 a consult on Opus 5.5.

## Not verified

- Live mode was not exercised end to end: there is no key on this Mac and the Function cannot run locally
  without wrangler. The request shape follows the Messages API reference (tools, `strict`, `output_config`,
  `fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta). First live consult after the key is
  set should be watched in the Pages Functions log.
- Sound and the voice were not heard (headless). Web Audio and Web Speech, muted by default, remembered per
  browser. Voice quality depends on the visitor's OS voices.
- Phone touch orbit and the hotspot taps were checked at 390 wide in headless Chrome, not on a device.
- The glass pane's transmission pass was not profiled on a low end phone; if it stutters, drop
  `transmission` to 0 on `glass` and it becomes a plain clear coat.
