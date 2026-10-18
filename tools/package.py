"""package.py: a portable archive of THE PIGEONHOLE for another machine, Claude Code, or another builder.

  python3 tools/package.py      # writes ../THE PIGEONHOLE PACKAGE <date>.zip and a SHA256 next to it

Includes: the built site/ (runs anywhere with any static server), src/, tools/, the prompts, the style references,
the docs. Excludes: .git, work/, gen/raw (the 2K masters; 300 MB, regenerable from tools/prompts.json), caches.
Every file is listed with its SHA256 in MANIFEST.sha256 inside the archive.
"""
import hashlib, os, time, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(ROOT), f"THE PIGEONHOLE PACKAGE {time.strftime('%Y-%m-%d')}.zip")
SKIP_DIRS = {".git", "work", "raw", "logs", "__pycache__", "node_modules"}
files = []
for d, dirs, fs in os.walk(ROOT, followlinks=False):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
    for f in fs:
        if f == ".DS_Store": continue
        p = os.path.join(d, f)
        if os.path.islink(p): continue
        files.append(p)
man = []
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(files):
        rel = os.path.relpath(p, ROOT); h = hashlib.sha256(open(p, "rb").read()).hexdigest()
        man.append(f"{h}  {rel}"); z.write(p, os.path.join("THE PIGEONHOLE", rel))
    z.writestr("THE PIGEONHOLE/MANIFEST.sha256", "\n".join(man) + "\n")
h = hashlib.sha256(open(OUT, "rb").read()).hexdigest()
open(OUT + ".sha256", "w").write(f"{h}  {os.path.basename(OUT)}\n")
print(OUT, os.path.getsize(OUT) // 1048576, "MB,", len(files), "files, sha256", h[:16])
