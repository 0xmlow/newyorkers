"""fetch.py: download finished Krea jobs listed in work/jobs.json (plates -> work/plates_raw, concepts -> work/concepts, walls -> work/walls).
Krea serves a finished image at app-uploads.krea.ai/public/<job>-image.png; a 4xx means it is not done yet."""
import json, os, sys, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(HERE, "work/jobs.json")))
DIR = {"plates": "work/plates_raw", "concepts": "work/concepts", "walls": "work/walls"}
DONE = set(open(os.path.join(HERE, "work/plates_done.txt")).read().split()) if os.path.exists(os.path.join(HERE, "work/plates_done.txt")) else set()
for kind, jobs in J.items():
    if kind not in DIR: continue
    for name, job in jobs.items():
        if kind == "plates" and name in DONE: continue
        out = os.path.join(HERE, DIR[kind], name + ".png")
        if any(os.path.exists(out[:-4] + e) for e in (".png", ".jpg")) and not (len(sys.argv) > 1 and name in sys.argv[1:]): continue
        for ext in ("png", "jpeg", "jpg"):
            try:
                data = urllib.request.urlopen(f"https://app-uploads.krea.ai/public/{job}-image.{ext}").read()
                from PIL import Image; import io
                Image.open(io.BytesIO(data)).convert("RGB").save(out[:-4] + ".jpg", quality=90); print("got", kind, name); break
            except Exception as e: err = e
        else: print("wait", kind, name, err)
