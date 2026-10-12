# Finding the galleries (2026-10-12)

MLow: the museum door deals three random rooms and there was no way to see the whole list; the home page
had the walkable galleries scattered through NEW ON THE SITE.

What changed:

- **Museum entrance** (`museum.html`, `_build/museum/src/main.ts` in `boot()`, styles in `assets/museum/museum.css`
  under `#enterAll`): a SEE EVERY ROOM AND GALLERY button beside DEAL ME THREE MORE ROOMS opens a grid of every
  walkable gallery (WALK badge, poster thumbnail) and all 183 rooms (number, thumbnail, area) with a search box.
  A room walks you straight in; a gallery opens its page. `museum#all` opens the grid on arrival; the home page
  links there. The `GALLERIES` list in main.ts gained THE SPIRAL.
- **Home page** (`index.html`, hand edited, styles appended to `assets/home.css` under `.walks`): a new section
  THE WALKABLE GALLERIES after NEW ON THE SITE with one card per place (the museum, ON LOCATION, THE MARKS night,
  THE SPIRAL, the basement, MEME ISLAND, MLOW INTERNATIONAL), and the museum invite gained "Or see every room
  and gallery first". Card pictures are the existing `assets/home/now-*.jpg`.

Rebuild the museum with `cd _build/museum && npm run check && npm run build` (stamps museum.html). A new
gallery needs a card in both places and a row in `GALLERIES`.
