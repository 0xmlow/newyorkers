"""Move finished NEW YORKERS folders off the Mac onto mlow2026, safely (MLow, 2026-11-22).

For each folder in ZIP: write one uncompressed zip on the drive, verify it (every entry's CRC re-read, names and sizes
match the Mac folder), and only then delete the Mac folder. For each folder in MERGE (a same-named copy already on the
drive): copy any missing or differently sized files into the drive copy (never deleting anything there), re-check
names and sizes, and only then delete the Mac folder. Nothing on the drive and nothing in Google Drive is ever deleted.
Folders the nightly site build reads (CENSUS RELEASE, KEYSTONE KIT, KUSAMA DAY, SEEDREAM5_*, MOSHED VARIANTS,
MUSEUM EXPORTS) are not in either list. Log: /Volumes/mlow2026/MAC ARCHIVE 2026-11-22/MOVE_LOG.txt
Run with --dry to only report.
"""
import os, sys, zipfile, shutil, time, subprocess
SRC = '/Users/degens/Desktop/NEW YORKERS BY MLOW'
DRV = '/Volumes/mlow2026'
OUT = os.path.join(DRV, 'MAC ARCHIVE 2026-11-22')
ZIP = ['NEW YORKERS 3D 2026-08-23', 'GO LIVE PACKAGE FULL 2026-09-06', 'HONORARY PFPS 2026-09-14', 'flora-archive',
       'NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300', 'MUSEUM MINT KIT 2026-09-06', 'MUSEUM MINT NETWORK 2026-09-14',
       'SUPERRARE RELEASE 2026-09-08', 'MUSEUM BRANCH PUSH 2026-09-29']
MERGE = ['STICKER_DITHER_4096_2026-08-23', 'NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300', 'STORYTELLING PLAN 2026-09-06',
         'HONORARIES 300 2026-09-25', 'CLOUDS AND DIRT HYPE FILM 2026-10-22', 'HYPE FILM EVERYTHING 2026-10-06']
DRY = '--dry' in sys.argv
SKIP = lambda n: n == '.DS_Store' or n.startswith('._')
os.makedirs(OUT, exist_ok=True)
LOG = open(os.path.join(OUT, 'MOVE_LOG.txt'), 'a')
def log(*a):
    s = time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

def walk(root):
    """relative path -> size for every regular file; symlinks listed separately and never followed"""
    files, links = {}, []
    for d, dirs, fs in os.walk(root):
        for x in list(dirs):
            if os.path.islink(os.path.join(d, x)): links.append(os.path.relpath(os.path.join(d, x), root))
        for f in fs:
            p = os.path.join(d, f); r = os.path.relpath(p, root)
            if SKIP(f): continue
            if os.path.islink(p): links.append(r); continue
            files[r] = os.path.getsize(p)
    return files, links

def free_gb(path): s = os.statvfs(path); return s.f_bavail * s.f_frsize / 1e9

def do_zip(name):
    src = os.path.join(SRC, name); dst = os.path.join(OUT, name + '.zip')
    if not os.path.isdir(src): log('SKIP not on Mac', name); return
    files, links = walk(src); total = sum(files.values()) / 1e9
    log(f'ZIP {name}: {len(files)} files, {total:.1f} GB, {len(links)} symlinks; drive free {free_gb(DRV):.0f} GB')
    if DRY: return
    if free_gb(DRV) < total + 5: log('STOP not enough room on the drive for', name); return
    if not os.path.exists(dst) or os.path.getsize(dst) < total * 1e9 * 0.98:
        tmp = dst + '.partial'
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_STORED, allowZip64=True) as z:
            for i, r in enumerate(sorted(files)):
                z.write(os.path.join(src, r), arcname=os.path.join(name, r))
                if i % 5000 == 0: log(f'  {name}: {i}/{len(files)}')
            if links: z.writestr(os.path.join(name, '_SYMLINKS_NOT_COPIED.txt'), '\n'.join(links))
        os.rename(tmp, dst)
    # verify: every entry's CRC, and names and sizes against the Mac
    with zipfile.ZipFile(dst) as z:
        bad = z.testzip()
        if bad: log('FAIL CRC', name, bad); return
        zs = {i.filename[len(name) + 1:]: i.file_size for i in z.infolist() if not i.is_dir() and not i.filename.endswith('_SYMLINKS_NOT_COPIED.txt')}
    miss = [r for r in files if zs.get(r) != files[r]]
    if miss: log('FAIL', name, len(miss), 'files missing or different, e.g.', miss[:3]); return
    log(f'VERIFIED {name}.zip ({os.path.getsize(dst) / 1e9:.1f} GB, {len(zs)} files, every CRC re-read)')
    shutil.rmtree(src); log('DELETED Mac copy', name, f'Mac free {free_gb("/"):.1f} GB')

def do_merge(name):
    src = os.path.join(SRC, name); dst = os.path.join(DRV, 'NEW YORKERS BY MLOW', name)
    if not os.path.isdir(src): log('SKIP not on Mac', name); return
    if not os.path.isdir(dst): log('SKIP no drive copy found for', name); return
    files, links = walk(src); have, _ = walk(dst)
    miss = [r for r in files if have.get(r) != files[r]]
    log(f'MERGE {name}: {len(files)} files on the Mac, {len(miss)} missing or different on the drive ({sum(files[r] for r in miss) / 1e9:.2f} GB)')
    if DRY: return
    for r in miss:
        t = os.path.join(dst, r)
        if os.path.exists(t):   # a different version already sits there: keep it, add the Mac one beside it
            b, e = os.path.splitext(t); t = b + ' (from Mac 2026-11-22)' + e
            if t != os.path.join(dst, r): pass
        os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copyfile(os.path.join(src, r), t)
    have, _ = walk(dst)
    still = [r for r in files if have.get(r) != files[r] and have.get(os.path.splitext(r)[0] + ' (from Mac 2026-11-22)' + os.path.splitext(r)[1]) != files[r]]
    if still: log('FAIL', name, len(still), 'still missing, e.g.', still[:3]); return
    import random, hashlib
    def h(p):
        m = hashlib.md5()
        with open(p, 'rb') as fh:
            for b in iter(lambda: fh.read(1 << 20), b''): m.update(b)
        return m.hexdigest()
    sample = random.sample(sorted(files), min(150, len(files)))
    badh = [r for r in sample if h(os.path.join(src, r)) != h(os.path.join(dst, r if have.get(r) == files[r] else os.path.splitext(r)[0] + ' (from Mac 2026-11-22)' + os.path.splitext(r)[1]))]
    if badh: log('FAIL content', name, len(badh), 'of', len(sample), 'sampled files differ, e.g.', badh[:3]); return
    log(f'VERIFIED {name} on the drive (names and sizes of all {len(files)}, content hash of {len(sample)} random files)'); shutil.rmtree(src); log('DELETED Mac copy', name, f'Mac free {free_gb("/"):.1f} GB')

log('=== start', 'DRY RUN' if DRY else 'LIVE', f'Mac free {free_gb("/"):.1f} GB, drive free {free_gb(DRV):.0f} GB')
for n in sorted(MERGE, key=lambda n: -sum(walk(os.path.join(SRC, n))[0].values()) if os.path.isdir(os.path.join(SRC, n)) else 0):
    try: do_merge(n)
    except Exception as e: log('ERROR', n, repr(e))
for n in ZIP:
    try: do_zip(n)
    except Exception as e: log('ERROR', n, repr(e))
log('=== done', f'Mac free {free_gb("/"):.1f} GB, drive free {free_gb(DRV):.0f} GB')
