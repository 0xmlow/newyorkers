#!/bin/bash
# tools/push_branch.sh: publish this repo's HEAD as a clean snapshot on the `the-lightings` branch of github.com/0xmlow/newyorkers,
# the way the other galleries' branches are made (one commit, authored MLow <0xmlow@users.noreply.github.com>, no local
# history, so no machine names or emails leave this Mac). Run from anywhere; the snapshot is built on the mlow2026 drive.
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"; SNAP=/Volumes/mlow2026/branch_the-lightings; BR=the-lightings
rm -rf "$SNAP"; mkdir -p "$SNAP"; (cd "$SRC" && git archive HEAD) | tar -x -C "$SNAP"
cd "$SNAP"; find . -name '._*' -delete; git init -q; git checkout -q -b "$BR"; git add -A
MSG="${1:-THE LIGHTINGS: nine walkable rooms of the city switching itself on, the tree and the menorahs}"
GIT_AUTHOR_NAME=MLow GIT_AUTHOR_EMAIL=0xmlow@users.noreply.github.com GIT_COMMITTER_NAME=MLow GIT_COMMITTER_EMAIL=0xmlow@users.noreply.github.com git commit -q -m "$MSG"
git remote add github https://github.com/0xmlow/newyorkers
git push -f github "$BR:$BR"
git log --oneline -1
