"""got_like.py run:uuid.ext ... : download likeness pass outputs into likeness/out/<marble>.jpg (errors per item)."""
import json, sys, os, urllib.request
H = os.path.dirname(os.path.abspath(__file__))
rmap = {v: k for k, v in json.load(open(f"{H}/runs.json")).items()}
os.makedirs(f"{H}/out", exist_ok=True); got = json.load(open(f"{H}/got.json")) if os.path.exists(f"{H}/got.json") else {}
for a in sys.argv[1:]:
    run, uid = a.split(":", 1); run = run if run.startswith("run_") else "run_" + run
    m = rmap.get(run)
    if not m: print("unknown", run); continue
    url = "https://media.flora.ai/node-inputs/2026/10/9/anonymous/" + uid
    try: data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
    except Exception as e: print("FAILED", m, e); continue
    open(f"{H}/out/{m}.jpg", "wb").write(data); got[m] = {"run": run, "url": url}
json.dump(got, open(f"{H}/got.json", "w"), indent=0); print(len(got), "likeness outputs saved")
