#!/bin/bash
# NEW YORKERS nightly: read the chain, redraw what changed, deploy. MLow 2026-10-27: "both, with the
# nightly deploy". The live board (functions/api/live) keeps ranks, badges and collections current all day;
# this is the part Cloudflare cannot do, because it is drawn here from the art on this Mac: the honorary
# cards with their IN THEIR COLLECTION row, the h/ pages, the museum's collector hangs, and a fresh snapshot
# for the live board to start from.
#
#   ./nightly.sh            from anywhere. Run each night by the Claude app's scheduled task
#                           "new-yorkers-nightly" (a launchd job cannot read ~/Desktop: macOS privacy)
#   ./nightly.sh --dry      everything but the commit and the deploy
#
# It will not deploy:
#   - when tracked files hold uncommitted changes before it starts: that is another session's work in
#     progress, and a deploy would ship it half done. It stops and names the files. (exit 3)
#   - when less than 3 GB is free (exit 4), or the build or preflight fails (exit 1)
#   - when the collectors, the honorary cards and the identity links all came out unchanged (exit 0, "nothing new")
# Logs: _build/logs/nightly-<stamp>.log, and one summary line per night in _build/logs/nightly.md.
set -uo pipefail
B="$(cd "$(dirname "$0")" && pwd)"; SITE="$(dirname "$B")"
DRY=""; [ "${1:-}" = "--dry" ] && DRY=1
export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
mkdir -p "$B/logs"
STAMP="$(date +%Y%m%d-%H%M)"; LOG="$B/logs/nightly-$STAMP.log"
exec > >(tee "$LOG") 2>&1
say() { echo "$(date '+%Y-%m-%d %H:%M') $*" | tee -a "$B/logs/nightly.md"; }
cd "$SITE"

FREE_GB=$(df -g "$SITE" | awk 'NR==2{print $4}')
if [ "$FREE_GB" -lt 3 ]; then say "STOPPED: only ${FREE_GB} GB free, the build needs about 3"; exit 4; fi

DIRTY=$(git status --porcelain --untracked-files=no)
if [ -n "$DIRTY" ]; then
  say "STOPPED: uncommitted work in the site repo, not deploying someone's half finished change: $(echo "$DIRTY" | awk '{print $2}' | head -8 | tr '\n' ' ')"
  exit 3
fi

# what tonight could change, minus the read time (which moves every run): the board, the cards, the links
fp() { python3 -c '
import json, hashlib, sys
h = hashlib.sha256()
try:
    b = json.load(open("api/collectors.json")); b["meta"].pop("asOf", None); b["meta"].pop("block", None)
    h.update(json.dumps(b, sort_keys=True).encode())
except Exception as e: h.update(repr(e).encode())
for f in ("_build/honoraries/cards.json", "_build/collectors/honor_links.json"):
    try: h.update(open(f, "rb").read())
    except OSError: pass
print(h.hexdigest())'; }
BEFORE=$(fp)

echo "== refresh: chain, identities, collectors, honorary cards, pages, package"
RUN="$(mktemp -t ny_nightly)"
{ echo 'set -e'; echo "cd \"$B\""; echo 'python3 build_keystone.py'; echo 'python3 build_my.py >/dev/null'
  sed -n '/^python3 collectors\/fetch_chain.py/,$p' "$B/build_all.sh"; } > "$RUN"
if ! bash "$RUN"; then rm -f "$RUN"; say "FAILED: the build stopped, see $LOG"; exit 1; fi
rm -f "$RUN"

SUMMARY=$(grep -m1 '^  mint: census' "$LOG" | sed 's/^  mint: //')
REVIEW=$(awk '/^## Hold 5 or more, no honorary yet/{f=1;next} /^## /{f=0} f && /^\| [0-9]/' "$B/collectors/IDENTITY_REVIEW.md" | wc -l | tr -d ' ')
CHANGED=0; [ "$(fp)" != "$BEFORE" ] && CHANGED=1
if [ -n "$DRY" ]; then say "DRY RUN: collectors changed=$CHANGED ($SUMMARY); not committed, not deployed"; exit 0; fi
# the tree was clean before the build, so everything changed now is build output: commit it every night,
# or tomorrow's run would find it and stop as if it were someone's work in progress
git add -u && git add _build/collectors _build/honoraries
if [ "$CHANGED" = "0" ]; then
  git diff --cached --quiet || git commit -q -m "Nightly build outputs, collectors unchanged: $SUMMARY

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  say "nothing new ($SUMMARY); no deploy"; exit 0
fi
git commit -q -m "Nightly refresh: $SUMMARY

Read off the chain and rebuilt by _build/nightly.sh, then deployed. $REVIEW wallets hold 5 or more with
no honorary yet (_build/collectors/IDENTITY_REVIEW.md); linking one is MLow's call in homes.json.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || { say "FAILED: commit"; exit 1; }

echo "== deploy"
if ! "$B/deploy.sh"; then say "FAILED: deploy.sh refused or failed after commit $(git rev-parse --short HEAD), see $LOG"; exit 1; fi
LIVE=$(curl -fsS "https://n3wyorkers.com/build.json?n=$(date +%s)" 2>/dev/null)
say "DEPLOYED $(git rev-parse --short HEAD), live $LIVE: $SUMMARY; $REVIEW big holders without an honorary"
