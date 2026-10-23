# LIVE FROM THE SEWERS: home of the Pizza Rat

A walkable, photoreal three.js gallery by MLow, built with NEW YORKERS. You fall through a manhole on First Avenue and land
at rat scale, in the city the rats built out of everything New York drops, flushes and forgets. Twelve rooms, one trick in
each, three or more eggs in each, and twelve census New Yorkers on every wall, dealt from the block above (`HOODS` in
`_build/build.py`). Every room plays its own song, synthesised in the browser (`_build/src/music.js`). The only people
down here have an eye flower for a head; the residents are rats, one alligator, one goldfish and one bodega cat.

Open it: double click `Open LIVE FROM THE SEWERS.command`. Not on the site yet (see "Not done").

| # | Room | The fact under it | The trick |
|---|---|---|---|
| 1 | Arrivals | under a First Avenue manhole | you drop in from the ceiling; customs stamps (COUNTED, DENIED); walk the arch and your shadow is approved while you are denied; an arrivals board |
| 2 | The Slice | Pizza Rat, First Avenue L, September 2015 | push the slice toward his shrine and the stairs in the plate stretch away from you, five times |
| 3 | Flushed | the Upstate Farm for every goldfish | pull the chain: the room fills past your eyes, the screen goes underwater, goldfish swim round you |
| 4 | The Gator Room | the alligator pulled from a sewer on East 123rd Street, February 1935 | pull the clipping and he wakes and watches you; hold still by the channel and eyes surface |
| 5 | The Fatberg | a cathedral of grease | light six votives; the altar candle grows with every one |
| 6 | The Crumb Exchange | under a bakery, 4:59 am | a live price board; drop the sesame seed and the market crashes, the rats flee |
| 7 | Lost Through the Grate | lost property at the size it was lost at | ring the left earbud and every rat leaves; coins fall through the grate and pile up |
| 8 | Beach Pneumatic | Alfred Beach's one block air subway, 1870 | pump the bellows five times; the fan spins up, the board inflates, the train is cancelled |
| 9 | The Steam Baths | Con Edison steam, since 1882 | the aromatherapy dial: seven scents, bagel to lawsuit, each tints the room |
| 10 | City Hall Loop | City Hall station, 1904 to 1945 | vote; every motion passes and the agenda returns to item one |
| 11 | The Border | a bodega basement in Bushwick | the cat sees you only when you move; get seen too long and you are sent back |
| 12 | The Throne | the sewer king rents it by the minute | pull the plunger and ride up the shaft into daylight, one problem higher |

38 eggs, counted from the source at build time.

## How it was made, and what it cost ($7.02 of a $12 budget, FLORA Creative Partner workspace)

- **Art direction**: GPT-6 Astra on FLORA wrote the room brief and later ranked fixes from a contact sheet (`work/astra_brief.txt`). $0.17.
- **Plates**: 12 x Nano Banana Pro, 21:9 2K, the eye flower as reference, prompts in `tools/plates.tsv`. $2.16. Depth from
  `python3 _build/depth.py work/plates_raw/*.png` (Depth Anything V2 Small, local).
- **Walls**: 12 x Nano Banana 2.1, 16:9 2K, `tools/walls.tsv`, tiled by `_build/walls.py`. $0.92.
- **Cast**: 8 concepts on white (Nano Banana 2.1, $0.62) from Astra's list, then Tripo H3.1 image to 3D ($2.88). 44 MB of
  GLB went to 3.3 MB through `_build/cast_pass.py` (Blender: textures to 1024 JPEG, Draco). Run ids in `work/runs.json`.
- **Props**: Poly Haven CC0 and the house models already on disk (ON LOCATION's `work/glb_pass`, THE MARKS rat), shown at
  rat scale; the toilet, the slice, the earbuds, the stamp, the ring, the car, the bellows, the dial are drawn in code.
- **Engine**: CLOUDS AND DIRT V2's (itself ON RECORD's), forked whole: depth plates, lazy rooms, the power throttle, the
  phone guard, skate mode. New: `rooms.js`, `build.js` (the sewer kit and the twelve rooms), the music styles.
- **Build**: `python3 _build/build.py` (or `--js`). **Check**: `python3 _build/check_all.py work/check` (all twelve
  rendered headless, 0 errors on the last run).
- **WIP**: `python3 _build/wip_reel.py` writes `work/wip/sewers_wip_9x16.mp4` from the real outputs.

## Verified, and not

- Headless Chrome on this Mac: all twelve rooms render with no console errors. Every clicked trick was fired by script and
  laid its egg (stamped, purpose, stairs, saint, flushed, broker, clipping, tithe, crash, leftear, ring, atmosphere, lawsuit,
  agenda, upandout); the three position tricks were proved by placing the camera (shadow, eyes, border).
- Never walked by a person, never tried on a phone, the music never listened to.
- Brand check: plates and walls looked at as contact sheets, not every one at full size. The grate plate shows a yellow
  fare card printed "New York" and earbuds shaped like a famous pair, no logo; the gallery's own fare card says N3W.

## Not done

- Not registered on n3wyorkers.com, not deployed, no GitHub branch, nothing posted. The registration list is in
  `virtual-architect/references/film-sets-and-tricks.md` section 6.
