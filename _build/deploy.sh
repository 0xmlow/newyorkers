#!/bin/bash
# The one deploy command for n3wyorkers.com. Uploads GO LIVE PACKAGE/site to Cloudflare Pages.
#
#   ./deploy.sh            run from _build, after python3 build_deploy.py
#
# Holds the same GO LIVE PACKAGE lock as build_deploy.py (package_lock.py) for the whole run, so no
# build can rewrite the package while it is being checked or uploaded. Refuses to upload unless the
# package has every n/ piece page the source has and preflight.py says "no problems". On 2026-10-09
# 18:28 a build rmtree'd n/ under another session's upload and the package fell to 1 of 7,542 pages;
# a deploy from that state was only stopped because someone killed it by hand.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE_SRC="$(dirname "$HERE")"
PKG="/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE"

if [ -z "${NY_PACKAGE_LOCKED:-}" ]; then
  exec python3 "$HERE/package_lock.py" "deploy.sh" -- "$0" "$@"
fi

# n/ piece pages: the package must carry what the source has. Finder duplicates ("1004 (1).html")
# are swept from the package by build_deploy.py, so they are not counted on either side.
count_n() { find "$1" -maxdepth 1 -name '*.html' ! -name '* (*' 2>/dev/null | wc -l | tr -d ' '; }
EXPECT=$(count_n "$SITE_SRC/n")
HAVE=$(count_n "$PKG/site/n")
MIN=$(( EXPECT * 99 / 100 ))
echo "n/ piece pages: package $HAVE, source $EXPECT"
if [ "$EXPECT" -lt 1000 ] || [ "$HAVE" -lt "$MIN" ]; then
  echo "REFUSING TO DEPLOY: GO LIVE PACKAGE/site/n has $HAVE pages, expected about $EXPECT (floor $MIN)." >&2
  echo "The package is incomplete. Run python3 build_deploy.py again, then this." >&2
  exit 1
fi

echo "preflight..."
PF_LOG="$(mktemp -t ny_preflight)"
set +e
( cd "$HERE" && python3 preflight.py ) > "$PF_LOG" 2>&1
PF_RC=$?
set -e
# preflight prints "no problems" then its WARNINGS list, and exits non zero on any problem.
# Both must agree.
if [ "$PF_RC" -ne 0 ] || ! grep -qx "no problems" "$PF_LOG"; then
  cat "$PF_LOG" >&2
  echo "REFUSING TO DEPLOY: preflight.py did not say \"no problems\" (exit $PF_RC). Output above, log at $PF_LOG." >&2
  exit 1
fi
sed -n '/^no problems$/,$p' "$PF_LOG"
rm -f "$PF_LOG"

echo "package build: $(cat "$PKG/site/build.json" 2>/dev/null || echo missing)"
cd "$PKG"
npx wrangler pages deploy site --project-name new-yorkers --branch main --commit-dirty=true

echo
echo "live build.json:"
sleep 5
curl -fsS "https://n3wyorkers.com/build.json?nocache=$(date +%s)" || echo "(could not fetch https://n3wyorkers.com/build.json)"
echo
