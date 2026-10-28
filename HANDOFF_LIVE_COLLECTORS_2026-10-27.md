# The collectors board updates itself (2026-10-27)

MLow asked for the collector updates to happen automatically, with a nightly deploy. Two halves.

## Live, on Cloudflare: `functions/api/live`

- `GET /api/live/collectors`, `/api/live/c/<wallet or ens>`, `/api/live/c/index`: the same shapes as
  `api/collectors.json`, `api/c/<wallet>.json` and `api/c/index.json`.
- Source: `_build/api/functions/api/live/[[path]].js`. It starts from the build's chain snapshot
  (`api/collectors_snap.json`) and every table the Python scores with (`api/collectors_kit.json`), both
  written by `build_collectors.py`. It reads only the transfers since the snapshot from Blockscout, at most
  every 15 minutes, in the background, and keeps them in D1 table `live_state`. A deploy brings a newer
  snapshot and the stored transfers are dropped.
- Scoring is `_build/api/functions/api/_lib/collectors_core.js`, a port of `build_collectors.py`.
  **Change the two together.** `_build/collectors/parity.mjs` replays the snapshot through the port and
  `build_all.sh` stops if any value on the board or in any wallet file differs.
- `collectors.html` and `my.html` read the live endpoint first and fall back to the static files.
- Not live: honorary links for new wallets (MLow's call, `homes.json`), Keystone thumbnails for tokens
  the build has not fetched, the honorary cards and the `h/` pages. The nightly build covers those.

## Nightly, on this Mac: `_build/nightly.sh`

- Run by the Claude app's scheduled task `new-yorkers-nightly` at 4:20 AM (the app offsets it a few
  minutes). Not launchd: a launchd job gets "Operation not permitted" reading ~/Desktop (macOS privacy).
  The task runs only while the Claude app is open; a missed night runs at next launch.
- Does: chain read, identities, collectors, honorary cards, pages, package, commit, `deploy.sh`.
- Refuses: uncommitted tracked changes before it starts (another session's work, exit 3), under 3 GB free
  (exit 4), a failed build or preflight (exit 1). Deploys only when the board, the card names or the
  honorary links changed; build outputs are committed every night either way, so the next run starts clean.
- Logs: `_build/logs/nightly-<stamp>.log`, one line a night in `_build/logs/nightly.md`.
- `./nightly.sh --dry` builds without committing or deploying.

## Escrow

`collectors/badges.json` "escrow" lists marketplace contracts that take custody of a listing (Transient's
auction house, TLAuctionHouse 0x6f66...8f8d). A piece there is booked to its lister until it sells. Without
it the auction house ranked second with MLow's 60 listed Keystones. Add any new custody market there.

## Not verified

Blockscout's free API allows 10 requests and then locks the IP for about 19 minutes. The Cloudflare
function reads from Cloudflare's IPs, not this Mac's, and asks at most 8 times a read.
