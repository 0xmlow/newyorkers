# SKELLY CUP · NEW YORKERS on Bryan Brinkman's Marble Run

Live at [n3wyorkers.com/skelly](https://n3wyorkers.com/skelly).

Every race, course, seed and frame of physics is **Marble Run by Bryan Brinkman** ([marblerun.fun](https://marblerun.fun), [the free public API](https://marblerun.fun/api)). Bryan built the thing nobody can rig. We painted the riders and drew the chalk.

SKELLY CUP is a free game: no entry, no stake, no odds, nothing paid out. Points and portraits are for glory. Art, not an investment.

## What is in here

- `cast.json`, `_cast/`: a hundred NEW YORKERS census characters, one riding each marble, five lanes as the five boroughs.
- `ledger/`, `ledger.py`: every race since tournament 1, archived from the API.
- `portraits/`, `champion_queue.py`, `publish_portraits.py`: a Champion's Portrait for every tournament winner, T1 to T6 painted on FLORA, T7 onward on Krea.
- `krea_batch.py`: the books for painting owed champions and races on Krea (Seedream 5 Pro and Lite).
- `contest/`: one painting per BrinkWorks pass holder racing their own marble (pass #N holds marble #N), the scene picked from the seed of their best race. `make_wave36.py` turns them into honoraries (wave 36), `likeness/` is the pass that matched each painting to the holder's PFP or portrait, `rechain.sh` republishes after any change, `publish_skelly_art.py` puts them on the site's MetroCards.
- `races/`: one painting per race, the winner's rider taking it; place, hour and celebration chosen by the race seed. `races/all.json` catalogues every finished race.
- `design/`: the FLORA plates behind the page (a Brooklyn block at night).
- `brink/`: Bryan's palette. Every painting and plate recoloured lane by lane to his four, pink `#f2668b`, cyan `#23c7d9`, mint `#48d9a4` and yellow `#f2bf27`: reds to pink, blues to cyan, greens to mint, yellows to his yellow, with skin, brick and night held.
- `skelly-cup.html`: the first live prototype.

The site page itself is built by `_build/build_skelly.py` in the NEW YORKERS site repo.

By MLow ([@degens](https://x.com/degens)) with Bryan Brinkman ([@bryanbrinkman](https://x.com/bryanbrinkman)).
