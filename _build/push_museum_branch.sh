#!/bin/zsh
# push_museum_branch.sh: refresh the public Museum branch on GitHub (0xmlow/newyorkers) as one commit on top of
# the branch's last snapshot, without a worktree and without copying 1.9 GB: a temporary index is filled from
# the working tree, so only changed and new files become objects.
#
# What goes in: every file the Museum branch already carries (including gitignored build outputs such as the
# atlases, which the snapshot has always shipped) plus every file tracked here, in each case the version on disk
# right now. Files that no longer exist on disk are dropped. Nothing is force pushed: the commit's parent is the
# branch's current tip, so the push is a fast forward.
#
# What never goes in: every path matched by _build/github_private.txt (the collectors identity files, secrets,
# tooling state). The repo is PUBLIC. Matches are dropped before the snapshot is built, and the script refuses
# to push if a match is still in the final tree. On 2026-10-28 the identity files were found in the public
# history from this script's earlier version and the branch was rewritten; this list is what keeps them out.
#
#   ./push_museum_branch.sh "commit title"
#   ./push_museum_branch.sh --dry      builds the snapshot and lists what would change, pushes nothing
set -e
cd "$(dirname "$0")/.."
DRY=""
if [ "$1" = "--dry" ]; then DRY=1; shift; fi
MSG="${1:-Museum branch refreshed from the site}"
PRIVATE="_build/github_private.txt"
[ -f "$PRIVATE" ] || { echo "REFUSING: $PRIVATE is missing" >&2; exit 1; }
git fetch -q github Museum
TMP=$(mktemp -d)
git ls-tree -r --name-only github/Museum > "$TMP/museum.txt"
git ls-files > "$TMP/head.txt"
sort -u "$TMP/museum.txt" "$TMP/head.txt" > "$TMP/union.txt"
python3 - "$TMP/union.txt" "$TMP/present.txt" "$PRIVATE" <<'EOF'
import os, sys, fnmatch
src, dst, priv = sys.argv[1], sys.argv[2], sys.argv[3]
pats = [l.strip() for l in open(priv) if l.strip() and not l.lstrip().startswith('#')]
paths = [l.rstrip('\n') for l in open(src) if l.strip()]
private = [p for p in paths if any(fnmatch.fnmatch(p, g) for g in pats)]
present = [p for p in paths if p not in set(private) and os.path.isfile(p)]
open(dst, 'w').write('\n'.join(present) + '\n')
print(f'{len(present)} files on disk of {len(paths)} listed; {len(private)} private dropped: {private}')
EOF
export GIT_INDEX_FILE="$TMP/index"
git read-tree --empty
git add -f --pathspec-from-file="$TMP/present.txt"
TREE=$(git write-tree)
unset GIT_INDEX_FILE
# Last guard: nothing private may be in the tree that would be pushed.
git ls-tree -r --name-only "$TREE" > "$TMP/tree.txt"
python3 - "$TMP/tree.txt" "$PRIVATE" <<'EOF'
import sys, fnmatch
pats = [l.strip() for l in open(sys.argv[2]) if l.strip() and not l.lstrip().startswith('#')]
bad = [p for p in (l.rstrip('\n') for l in open(sys.argv[1])) if any(fnmatch.fnmatch(p, g) for g in pats)]
if bad:
    sys.exit(f'REFUSING TO PUSH: private paths in the snapshot: {bad}')
EOF
if [ -n "$DRY" ]; then
  echo "dry run, tree $TREE, $(git diff --stat github/Museum $TREE | tail -1)"
  rm -rf "$TMP"; exit 0
fi
COMMIT=$(git commit-tree "$TREE" -p github/Museum -m "$MSG

Snapshot of the site repository as it stands, on top of the previous Museum snapshot.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>")
echo "commit $COMMIT, $(git diff --stat github/Museum $COMMIT | tail -1)"
git push github "${COMMIT}:refs/heads/Museum"   # braces: zsh reads $COMMIT:r as a modifier
rm -rf "$TMP"
git ls-remote --heads github Museum
