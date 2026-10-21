# THE CENSUS RELEASE, the live layer

The parts of n3wyorkers.com that track THE CENSUS RELEASE while it mints: 1,111 NEW YORKERS by MLow at
0.0042 ETH on OpenSea, open from Wednesday September 23, 2026 at 11:11 AM ET until Saturday November 7,
2026 at 11:11 AM ET. Snapshot of 2026-10-21, when 1,011 were minted to 166 holders.

| Path | What it does |
|---|---|
| `assets/mint.js` | The mint bar pinned to the bottom of every page: live count, price, countdown, then CLOSED. Self contained, one script tag |
| `_build/collectors/fetch_chain.py` | Reads every census and Keystone transfer from Blockscout (no range cap) into a local snapshot |
| `_build/build_mint.py` | Writes `api/mint.json`, the count the mint bar reads |
| `_build/build_collectors.py` | The collectors leaderboard, 21 badges, and BOROUGH WARS: first wallet to hold all five boroughs, first to hold every family, decided by replaying transfers in block order |
| `_build/collectors/badges.json` | Badge rules and points, and the wallets labelled Artist or Team, which rank but cannot win |
| `_build/api/functions/api/submit.js` | Cloudflare Pages Function: validates, rate limits, hashes the ip, stores one row in D1. Kind `list` is THE SUNDAY COUNT |
| `the-sunday-count/` | The home page email box and its styles, as they ship |
| `_build/build_faq.py`, `_build/releases.json` | The FAQ builder and the one file that says what each named release promises |

Not included: the collector identity files (wallet to person links) and the site's media. Art, not an
investment.

Art and code by MLow. Built with Claude.
