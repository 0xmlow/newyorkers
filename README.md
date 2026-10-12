# MLOW SPEAKS: the MLOWTAR booth

A fortune telling booth that only knows New York, by MLow. A Zoltar in three.js: drop a token in the slot,
ask it anything, and it deals one of the NEW YORKERS from the census as your card, reads your fortune off
the family, the borough and the block, prints you a ticket no one else will ever get, and sends you to a
room of the museum to go stand in. Talk back and it keeps the conversation.

Live at [n3wyorkers.com/mlowtar](https://n3wyorkers.com/mlowtar). Open `index.html` from a local server
(`python3 -m http.server`) and it runs from this checkout; the census thumbnails and the room pictures come
from the live site.

## What is in the booth

- **The booth** is the Tripo model MLow made as a prop for ON LOCATION (`assets/movies/assets/glb/mlowtar.glb`),
  one mesh, no bones. The rig is procedural, in the vertex shader: the interior of the cabinet is the
  figure and the crystal, so the oracle breathes, follows your pointer, leans to the glass when you ask,
  nods while it speaks, and the crystal swells and glows. The baked sign is cut away in the fragment
  shader and a real arched crown stands in its place: blue enamel, gold bevel, bulbs on the arch, and
  MLOW SPEAKS as extruded brass letters built from the Fraunces outlines (`_build/mlowtar_sign.py`
  flattens the variable font into `assets/mlowtar/sign.json`). The Tripo bake is sharpened in the shader
  and sorted by hue, so the trims are brass and the paint is MLow blue.
- **The machine**: the coin slot takes a token (ASK drops one for you), the glass knocks, the ticket
  prints out of the card slot with a stutter and hovers beside the booth, and the booth speaks the
  fortune with Web Speech when sound is on. Synth coin, hum and chime.
- **The oracle** (`assets/mlowtar/oracle.js` and `match.js`) runs entirely in the browser: the census is the
  deck (`deck.json`, every New Yorker as one row), the museum is the map (`api/rooms.json`), and the
  reading is deterministic from the question plus a seed, so a shared link replays. The omens are written
  the Jack Butcher way: the point first, under fifteen words, a colon as the pivot, land on a noun.
- **The agent** (`_build/api/functions/api/mlowtar.js`, a Cloudflare Pages Function) wakes when the site
  carries an Anthropic key: Claude plays MLOWTAR with tools that search the census, the rooms and the
  reading room, and hands the slip back through a `deliver_fortune` tool so the card and the room are
  always real. Without a key the booth answers alone, so it never goes dark.
- **The ticket** (`assets/mlowtar/ticket.js`) is a generative piece per fortune. The art panel mixes
  three systems: ports of MLow's Memories renderers (the bloom grid, the identicon seal, the torn edge, the
  perforations, the barcode, the seeded noise contours), a one bit glyph set drawn in the Visualize Value
  idiom (a bagel, a slice, a manhole, a subway bullet, a water tower, a hydrant, a token, a MetroCard, the
  anthora cup, a pigeon, a stoop, a bridge, the nazar, a check), and MLow's object stickers pressed on in
  five arrangements. The paper wears the site's transit kit: the enamel station sign, the platform edge,
  the mosaic eye frieze, a MetroCard for the lucky strip, one of the N3W YORKERS lockups, the bodega awning
  at the tear. Tickets are kept on a shelf in your browser and save as a 2x PNG. No date is printed.
- **The sticker drawer** (`assets/mlowtar/stickers/`, 395 files) is cut by `_build/mlowtar_stickers.py` from
  the two thousand object stickers MLow made for NEW YORKERS, chosen by what a fortune is about.

## The third pass (same day)

- No API: the booth writes its own slips from a five question file plus the question and the card; `_build/mlowtar_fortunes.mjs` pre generates ten thousand readings for review.
- Five screens on the wall behind the booth cycle New Yorkers from the census.
- RECORD films the next consult as a 1080 x 1920 clip, synth audio and captions included.
- Receipts in MLow's blues with the MLOW mark, a CC0 paper scan (ambientCG Paper001), a real QR code to the replay link, stickers folded into the generative system (grid, coin, dither), and a glitch loop you can save.

## Credits

- MLow: the census, the booth, the stickers, the Memories renderers, the direction.
- The glyph set is original work in the idiom of Jack Butcher's Visualize Value; no code of his is used.
- three.js (MIT). Fraunces, Space Grotesk and IBM Plex Mono (OFL).
- Built with Claude.

NEW YORKERS is art, not an investment.
