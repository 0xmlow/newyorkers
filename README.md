# MOSH LAB 👁️

MLow's glitch instrument. A PhotoMosh style effect rack rebuilt from scratch as a native desktop app and a web page: 60 stackable WebGL effects, 48 presets, seeded randomness, loop perfect GIF export, MP4 and WebM capture, webcam and video input, and the full MLOW x Blossom identity baked in.

Every animation in the engine is periodic, so a GIF's last frame hands off to the first with no seam. Every random decision flows from the seed field, so any look is reproducible forever.

**Play with it online, no install:** [n3wyorkers.com/moshlab](https://n3wyorkers.com/moshlab)

## Run it

```bash
npm install
npm start
```

No build step. The app is plain HTML, CSS, and JavaScript inside `app/`; Electron just gives it a window, a menu, and a Dock icon. You can also open `app/index.html` directly in any Chromium browser and everything works.

## Build a distributable

```bash
npm run dist        # macOS dmg (Apple Silicon)
npm run dist:win    # Windows installer
npm run dist:linux  # Linux AppImage
```

Output lands in `dist/`. Unsigned by default; set the usual electron-builder signing env vars if you want notarization.

## The rack

60 effects in five stages. The chain runs top to bottom and every effect can be reordered, locked, and tuned.

- **Geometry**: kaleido, mirror, bulge/pinch, swirl, tile, wave warp, ripple scan, wobble, polar, Droste tunnel
- **Break**: pixelate, LED wall, slices, glitch blocks, datamosh, melt, JPEG crush, crystals, interlace, pixel sort, shatter, lenticular
- **Texture**: RGB shift, bad TV, VHS, noise, ghost trails, glow, blur, sharpen, oil paint, zoom blur, lens fringe, vortex trails
- **Color**: hue/levels, dither lab, posterize, halftone, edges, duotone, heatmap, prism, invert, solarize, deep fry, strobe, neon edges, risograph, channel swap, bit rot
- **Finish**: scanlines, CRT, vignette, code overlay, ASCII, emoji mosaic, emoji rain, petal storm, blossom stamp, cam HUD

### NEW YORKERS 👁️

The NEW YORKERS panel pulls any piece from the census at n3wyorkers.com: by number, by name, at random, your ❤️ faves, or every New Yorker in a wallet (paste a 0x address or a name.eth from the collector list). The paintings load at 1000px straight from the site, so the desktop app needs a connection for this panel; everything else works offline.

### THE MOSH MACHINE 🎰

SPIN (or S) opens the machine. Three reels: WHO (a New Yorker), WHAT (a preset), SEED. Lock any reel to keep it while the others spin; lock WHO on your own piece and pull until it hits. Every pull rolls a rarity, and the rarer the roll the harder it moshes:

| Rarity | Odds | What it does | Chips |
|---|---|---|---|
| COMMON | 55% | the preset as it is | 0 |
| RARE | 25% | the preset plus a mosh on top | +15 |
| EPIC | 13% | the preset plus a HYPER mosh | +40 |
| LEGENDARY | 6% | the preset plus HYPER, confetti | +120 |
| MYTHIC | 1% | THE SIGNATURE plus HYPER, unlocks the 317 preset | +1000 |

A 317 in the piece number or the seed, or a triple in the seed, is a JACKPOT and pays triple. Five rare or better in a row pays a house bonus. A pull costs 10 chips and the house refills you when you are broke: chips are play chips, free, worth nothing and never for sale. DEGEN MODE pulls every five seconds while the window is visible. The last 24 pulls sit in a strip under the reels; click one to bring that exact look back. Exports carry the rarity in the file name, as in `NY4439-The-Powder-Room-Portrait_EPIC_NY-89365.gif`.

### Dither Lab 🧮

Eight threshold algorithms (Bayer 2x2 / 4x4 / 8x8, interleaved gradient noise, white noise, halftone dot, diagonal lines, checker) crossed with seven palettes (gray levels, 1 bit, Game Boy, 8 bit RGB, Blossom brand, print CMY, original color). GIF export additionally runs Floyd Steinberg error diffusion over a median cut palette.

### Mosh buttons

- **MOSH 🎛️** picks 2 to 5 unlocked effects with art directed parameter ranges and orders them sanely.
- **HYPER 🌀** picks 4 to 8 and opens every parameter to its full range.
- **AUTO ♻️** re-rolls on its own every N loops. Point it at the webcam and let it run.
- **🔒** on any effect protects it from all three.
- **↩️** restores the chain from before the last roll.

### Export

- **GIF**: one perfect loop, custom encoder, global palette, dithered.
- **MP4 / WebM**: records N loops of live playback at 30 fps.
- **PNG**: current frame at export resolution.
- **Batch GIF**: the same chain across every loaded image, one file each.

Every export carries the white MLOW wordmark bottom right, with a soft dark halo so it reads on bright art. It is drawn only on the final pass while an export runs, so the live preview stays clean and feedback effects never see it.

### Presets

48 built in, from STILL WAITING and SUBWAY GHOST to TUNNEL VISION, TINY PLANET, PIXEL WATERFALL, WARHOL WALL, HYPERSPACE and THE FLOOD. One click loads the chain; MOSH from there to mutate it.

### Sources

Images (load a whole folder), video files, or the webcam. The chain does not care what it is fed.

### Settings

Everything autosaves as you work and comes back on launch. SAVE ALL exports a portable settings file; presets save individually and travel as JSON.

## Secrets 🤫

The eye is watching. A few things worth typing, clicking, or entering as a seed. One of them is a number that matters.

## Structure

```
moshlab/
  main.js              Electron shell
  app/
    index.html         layout and brand skin
    effects.js         the 60 GLSL effect definitions
    overlays.js        canvas drawn layers and the preset bank
    casino.js          the NEW YORKERS source and THE MOSH MACHINE
    app.js             engine, UI, export, persistence
    brand-assets.js    MLOW logo, eye, and the 7 Blossom icons as data URIs
  build/               app icons
```

Adding an effect is one entry in `effects.js`: an id, a stage, a param schema, and a fragment shader. The UI, randomizer, presets, and persistence pick it up automatically.

## Brand

Identity follows the MLow brand system: Ink Black ground, Evil Eye Blue and Shock Pink accents, Georgia display type over Consolas labels, the evil eye as the sovereign mark and the Blossom icons as the community mark.

Built by MLOW with Claude. MIT license.
