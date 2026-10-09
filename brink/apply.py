"""Recolour every SKELLY CUP painting in place from brink/originals (rerunnable: always starts from the originals).
Writes into the same inode so the wave 36 hard links in HONORARY PFPS follow."""
import sys, glob, os
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); RUN = os.path.dirname(H); sys.path.insert(0, H)
from recolor import recolor

def run(j):
    src, dst = j
    if os.path.getsize(src) == 0: return 0
    im = recolor(Image.open(src))
    with open(dst, "r+b") as fh:
        fh.truncate(0); im.save(fh, "JPEG", quality=94, subsampling=0)
    return 1

if __name__ == "__main__":
    jobs = [(f"{H}/originals/{d}/{os.path.basename(f)}", f) for d, g in [("contest", "contest/out/*.jpg"), ("races", "races/out/*.jpg"), ("portraits", "portraits/T*.jpg")]
            for f in glob.glob(f"{RUN}/{g}")]
    with ProcessPoolExecutor(6) as ex: print(sum(ex.map(run, jobs)), "of", len(jobs), "recoloured")
