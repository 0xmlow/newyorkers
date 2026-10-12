#!/usr/bin/env python3
"""One lock for GO LIVE PACKAGE, shared by everything that writes or uploads it.

build_deploy.py deletes and rewrites GO LIVE PACKAGE/site, and wrangler uploads from it. Several
sessions run both. On 2026-10-09 18:28 one session's build rmtree'd n/ while another session's
wrangler was reading the package, and n/ fell to 1 of 7,542 pages; the deploy made from that state
was killed before it published. Nothing stopped the two from overlapping, so now both take this lock.

The lock is fcntl.flock on GO LIVE PACKAGE/.lock. The kernel drops it when the holder exits, crash
or kill -9 included, so there is never a stale lock to clean up. The file's text only says who holds
it, for the error message; it is never what decides. Never delete the file: a second process could
then lock a fresh inode while the first still holds the old one.

    from package_lock import acquire
    acquire("build_deploy.py")              # held until this process exits

    python3 package_lock.py <label> -- <command> [args...]   # run a command holding the lock
"""
import datetime, fcntl, os, socket, subprocess, sys

PKG = "/Users/degens/Desktop/NEW YORKERS BY MLOW/GO LIVE PACKAGE"
LOCK = os.path.join(PKG, ".lock")
_held = []   # keeps the file object alive, and the lock with it, for the life of the process


def _session_hint():
    for k in ("NY_SESSION", "CLAUDE_CODE_SESSION_ID", "CODEX_SESSION_ID", "TERM_SESSION_ID"):
        if os.environ.get(k):
            return "%s=%s" % (k, os.environ[k])
    return "tty=%s" % (os.ttyname(0) if os.isatty(0) else "none")


def acquire(label):
    """Take the package lock or exit with a message naming who holds it."""
    os.makedirs(PKG, exist_ok=True)
    fh = open(LOCK, "a+")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        fh.seek(0)
        holder = fh.read().strip() or "(holder did not write its details)"
        sys.exit("GO LIVE PACKAGE is locked by another build or deploy, refusing to start %s.\n"
                 "  holder: %s\n  lock:   %s\n"
                 "Wait for it to finish. Check it with: ps -p <pid>. The lock frees itself when that "
                 "process exits, so never delete the file." % (label, holder.replace("\n", "\n          "), LOCK))
    fh.seek(0); fh.truncate()
    fh.write("pid %d on %s\nwhat %s\nsession %s\nstarted %s\n" % (
        os.getpid(), socket.gethostname(), label, _session_hint(),
        datetime.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")))
    fh.flush()
    _held.append(fh)
    return fh


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 3 or a[1] != "--":
        sys.exit("usage: package_lock.py <label> -- <command> [args...]")
    acquire(a[0])
    # Python opens files non-inheritable, so the child never sees the lock fd: the lock is this
    # process's, held while it waits on the child and dropped the moment it exits.
    env = dict(os.environ, NY_PACKAGE_LOCKED="1")
    try:
        sys.exit(subprocess.call(a[2:], env=env))
    except KeyboardInterrupt:
        sys.exit(130)
