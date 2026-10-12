#!/bin/zsh
# Bundle the museum from the last commit, not the working tree, into assets/museum/museum.js and museum.html.
# Written 2026-10-09 so a deploy can ship while builder agents are still editing other room files: only what
# has been committed goes out. Run from anywhere; then python3 ../build_deploy.py as usual.
set -e
HERE=${0:A:h}
SITE=${HERE:h:h}
T=$(mktemp -d "${TMPDIR:-/tmp}/museum-bundle-XXXXXX")
cd "$SITE"
git archive HEAD _build/museum/src _build/museum/build.mjs _build/museum/package.json _build/museum/tsconfig.json museum.html assets/museum/museum.css | tar -x -C "$T"
mkdir -p "$T/assets/museum"
ln -s "$HERE/node_modules" "$T/_build/museum/node_modules"
(cd "$T/_build/museum" && ./node_modules/.bin/tsc --noEmit -p tsconfig.json && node build.mjs)
cp "$T/assets/museum/museum.js" "$SITE/assets/museum/museum.js"
cp "$T/museum.html" "$SITE/museum.html"
rm -rf "$T"
echo "bundled from $(git rev-parse --short HEAD)"
