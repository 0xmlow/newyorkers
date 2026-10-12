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
#   ./push_museum_branch.sh "commit title"
set -e
cd "$(dirname "$0")/.."
MSG="${1:-Museum branch refreshed from the site}"
git fetch -q github Museum
TMP=$(mktemp -d)
git ls-tree -r --name-only github/Museum > "$TMP/museum.txt"
git ls-files > "$TMP/head.txt"
sort -u "$TMP/museum.txt" "$TMP/head.txt" > "$TMP/union.txt"
python3 - "$TMP/union.txt" "$TMP/present.txt" <<'EOF'
import os, sys
src, dst = sys.argv[1], sys.argv[2]
paths = [l.rstrip('\n') for l in open(src) if l.strip()]
present = [p for p in paths if os.path.isfile(p)]
open(dst, 'w').write('\n'.join(present) + '\n')
print(f'{len(present)} files on disk of {len(paths)} listed; {len(paths) - len(present)} gone')
EOF
export GIT_INDEX_FILE="$TMP/index"
git read-tree --empty
git add -f --pathspec-from-file="$TMP/present.txt"
TREE=$(git write-tree)
COMMIT=$(git commit-tree "$TREE" -p github/Museum -m "$MSG

Snapshot of the site repository as it stands, on top of the previous Museum snapshot.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>")
unset GIT_INDEX_FILE
echo "commit $COMMIT, $(git diff --stat github/Museum $COMMIT | tail -1)"
git push github "${COMMIT}:refs/heads/Museum"   # braces: zsh reads $COMMIT:r as a modifier
rm -rf "$TMP"
git ls-remote --heads github Museum
