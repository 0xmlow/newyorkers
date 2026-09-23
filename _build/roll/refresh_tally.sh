#!/bin/bash
# Refresh THE TALLY from the live database and ship it. Run as often as you like while the roll is open.
# Exports the allowlist rows, writes api/tally.json (codes and handles only, never an address), rebuilds
# the package, deploys, and deletes the plaintext export. Pass --close on the day the roll closes.
set -e
B="$(cd "$(dirname "$0")/.." && pwd)"; PKG="$(cd "$B/../.." && pwd)/GO LIVE PACKAGE"
cd "$PKG"
npx --yes wrangler d1 execute new-yorkers --remote --json --command "SELECT wallet, kind, ref, payload, submitted_at FROM submissions WHERE kind='allowlist'" > "$B/roll/out.json"
cd "$B"
python3 roll/make_tally.py --from roll/out.json "$@"
rm -f roll/out.json
python3 build_deploy.py | tail -1
python3 preflight.py | grep -m1 -i "no problems\|PROBLEM"
cd "$PKG" && ./deploy.sh | grep -m1 "Deployment complete"
