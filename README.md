# MARK UP A NEW YORKER 👁️

Draw on any piece in MLow's NEW YORKERS census. Thirteen brushes, a mood for every hour of the city, the colours of the subway lines. Sign it with your handle and save it with the house marks on the strip under the art.

**Use it online:** [n3wyorkers.com/markup](https://n3wyorkers.com/markup). Every piece page on the site has a MARK IT UP button, and `n3wyorkers.com/markup#n=37` opens a piece directly.

## Run it

```bash
cd app
python3 -m http.server 8000
```

Then open `http://localhost:8000/#n=37`. No build step and no install: plain HTML, CSS and JavaScript. The paintings, the piece index and the room cards are read from n3wyorkers.com, which serves them with open CORS, so the copy here works anywhere and SAVE still exports.

## What it does

- **Any New Yorker as the canvas.** Type a number or take a random one. Keystone pieces load by their ids (`x000` and up).
- **Two layers.** The painting and your ink are kept apart, so CLEAR and UNDO (15 steps, Cmd Z) never touch the art.
- **Thirteen brushes**: Thin, Thick, Spray, Glow, Square, Diamond, Star, Ribbon, Splatter, Dash, Fur, Pixel, Calligraphy. Stamps are spaced along the stroke so a fast drag leaves no gaps, and a size slider scales them all.
- **Six moods**: The Count, Rush Hour, 3 AM Bodega, Snow Day, Hydrant Summer, Blackout '77. Each one recolours the field behind the frame and the Mood brush, and can wash the painting itself.
- **Subway line colours**: 1 2 3 red, 4 5 6 green, 7 purple, A C E blue, B D F M orange, G lime, J Z brown, L grey, N Q R W yellow, the S, plus taxi, white and ink.
- **Sign it.** An optional `@handle` field (X rules: letters, digits, underscore, 15 at most). It is remembered on the device and nowhere else.
- **SAVE** writes a PNG: the painting, your marks, and a strip with the N3W YORKERS wordmark, the piece number and title, MARKED UP BY @handle, and the MLOW mark. **POST ON X** links back to the piece. Phones that can share files get **SHARE**.
- **Six rooms, six facts.** Flip cards carry the museum's sourced line of city history for each room, fronted by the New Yorker who hangs there.

## Files

| Path | What it is |
|---|---|
| `app/index.html` | The page. Everything between the `MARKUP BODY` markers is lifted into n3wyorkers.com/markup by the site build |
| `app/markup.js` | The engine: moods, field, brushes, layers, undo, the strip, save and share, the cards |
| `app/markup.css` | Styles, on the NEW YORKERS tokens |
| `app/logos.js` | The MLOW and N3W YORKERS marks as data URIs, so a saved canvas is never blocked as cross origin |
| `tools/make_logos.py` | Rebuilds `logos.js` from the brand masters in the site folder |

Configure with `window.MK_CONFIG = { base, site, defaultId }` before `markup.js` loads. `base` is where `assets/t/`, `assets/markup/idx.js` and `assets/markup/cards.json` live.

## How it reaches the site

The site source builds the page with `_build/build_markup.py`, which copies `app/markup.js`, `markup.css` and `logos.js` into `assets/markup/` with a version on each reference, lifts the body out of `index.html`, and writes the piece index and room cards. Edit here, commit, then run the site build.

## Credits

The brushes, the mood blend and the flow field began as MLow's [moodroom](https://github.com/0xmlow/moodroom). Art, marks and the NEW YORKERS census by MLow.

Code is MIT. The marks and the paintings are not; see `LICENSE`.
