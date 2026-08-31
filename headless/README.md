# MOSH LAB headless

The same instrument, no window. Runs the exact app pipeline (effects.js shaders, overlays.js drawers, the in house loop perfect GIF encoder) inside a hidden Electron window and batch moshes whole folders of NEW YORKERS art into animated glitch variants.

## Run

```bash
cd "MOSH LAB/moshlab"

# 1. build a job file from image folders (filenames parsed as "<token> <Name>.jpg")
node headless/make-jobs.mjs --out /abs/OUT_DIR --job /abs/OUT_DIR/_jobs/wave.json --maxDim 720 /abs/folder1/images /abs/folder2/images

# 2. render it (resumable: already rendered tokens in manifest.jsonl are skipped)
npx electron headless/main-headless.js /abs/OUT_DIR/_jobs/wave.json

# 3. build ERC-7160 variant metadata + contract payload from the manifest
node headless/build-metadata.mjs --manifest /abs/OUT_DIR/manifest.jsonl --out /abs/OUT_DIR
```

## What each token gets

- One loop perfect GIF at 720px max (16.7fps, family length loop) in `gifs/`
- One PNG still captured mid loop in `stills/`
- One `manifest.jsonl` line recording seed, family, full effect chain and params
- One `metadata/<token>.json` variant metadata file after step 3

## Determinism

Seed is `MLOW-NY-<token>-GLITCH-V1`. The seed picks the glitch family (1 of 10 in `families.js`), jitters every tuned param by up to ±20%, and rolls a 30% chance of one bonus finisher effect. Rerunning a token reproduces the identical GIF. Bump the `-V1` suffix in headless.js to cut a fresh generation for every token.

## Families

MATRIX_RAIN, DATAMOSH_DRIFT, VHS_MIDNIGHT, CRT_WAKE, PRISM_DRIFT, MELTDOWN, LED_BODEGA, PETAL_STATIC, CRYSTAL_FREEZE, DEEP_SIGNAL. Tuning lives in `families.js`; every chain was auditioned to keep the character legible while the glitch escalates over the loop.

## Speed and size

About 1.6s per token on Apple Silicon. GIFs land 6 to 14MB each at 720px, so budget roughly 10GB per 1,000 tokens and check disk before big waves.
