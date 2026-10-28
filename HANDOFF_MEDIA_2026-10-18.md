# Handoff: MEDIA, the screening room at /media (2026-10-18)

MLow asked for THE PIGEONHOLE spot on the site and "a media section where we can just dump any great highlights into".
Nav: MORE, on the 1 line. Footer: The record column ("Media, the films").

## What it is

`media.html` is built by `_build/build_media.py` from `_build/media.json`: one entry per film, newest first. The first
entry is the lead (marquee screen with bulbs), the rest sit in a two column grid. Every film plays the way the gallery
pages play theirs: a silent 12 s teaser loops while the screen is in view, WATCH WITH SOUND swaps in the HLS master
(hls.js where the browser has no native HLS). Each card carries a door to the page the film belongs to and a `#slug`
deep link (`/media#the-pigeonhole`).

The encoded films live in `assets/film/<slug>/` (gitignored, shipped by build_deploy's folder list): `master.m3u8`,
`1080/`, `720/`, `poster.jpg`, `teaser.mp4`. Durations on the buttons are read from the 720 playlist, never typed.
`build_seo.py` writes a VideoObject per film on the page and puts them in the video sitemap, from the same manifest.

## To dump a new highlight in

1. Add an entry at the top of `_build/media.json`: slug, title, kick, label, blurb (no dates, no totals), `src`
   (the master MP4, relative to `NEW YORKERS BY MLOW/`), `poster_t` (seconds), `teaser` (four [start, end] cuts of
   about 3 s, or `[]`), `link` + `link_label` (the page it belongs to).
2. `cd _build && python3 add_media.py <slug>` (HLS 1080 + 720, poster, teaser; about two minutes for a 60 s film).
3. `python3 build_media.py && python3 build_seo.py && python3 preflight.py`, then `build_deploy.py`.
   Deploying is MLow's call, through `deploy.sh`.

`add_media.py` skips a slug that is already encoded; `--force` redoes it after a re-render. `encode_film.sh` still
works for the older films and writes the same layout, so both can coexist; new films should go through media.json.

## Films in the room on 2026-10-18

the-pigeonhole (the spot, new), break-glass, skate-the-sets, on-location, the-marks, hall-of-fame, mlow-international,
hall-new-york-lost, city-is-the-art, roll-call. The last two have no teaser (poster only until one is cut).

## Also

The pigeonhole gallery page (`pigeonhole.html`, build_galleries) shows the spot under the walk, the way movies.html
shows its trailer, from the same `assets/film/the-pigeonhole`.

## Not verified

- Checked headless at 1440 and 390; not played by a person in a real browser, and the HLS playback itself was not
  exercised headless (the player is the same code the gallery pages have shipped since ON LOCATION).
- Not deployed by this session.
