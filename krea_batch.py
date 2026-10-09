"""Paint the owed SKELLY CUP champions and races on Krea (MLow 2026-10-09: "paint everything, I have a larger cap on krea").

Same recipe as the FLORA runs: Seedream 5 Pro for champion portraits, Seedream 5 Lite for races, 2560x1440, one
reference (the rider's census painting) as a style image. Krea is driven over MCP, so this file only keeps the books:

  python3 krea_batch.py next 12            print the next inputs to submit (portraits first), as JSON
  python3 krea_batch.py record KEY JOB...  pairs of key and Krea job id, after submitting
  python3 krea_batch.py got KEY URL...     pairs of key and result URL, downloads into races/out or portraits/
  python3 krea_batch.py fly                in flight, key=job
  python3 krea_batch.py status             what is owed, in flight and done

Books: krea_jobs.json. Portraits land as portraits/T<n>_<marble>_k1.jpg and are recorded in portraits/portraits.json.
Then brink/apply.py recolours everything into Bryan's palette (it also picks up the new files).
"""
import json, os, re, sys, urllib.request

H = os.path.dirname(os.path.abspath(__file__))
BOOKS = os.path.join(H, "krea_jobs.json")
W, HT = 2560, 1440


def books():
    return json.load(open(BOOKS)) if os.path.exists(BOOKS) else {}


def owed():
    out = []
    for q in json.load(open(os.path.join(H, "portraits", "queue.json"))):
        slug = re.sub(r"[^a-z0-9]+", "_", q["marble"].lower()).strip("_")
        out.append(dict(key=f"T{q['tournamentId']}", model="bytedance/seedream-5-pro", dest=f"portraits/T{q['tournamentId']}_{slug}_k1.jpg",
                        title=q.get("title") or f"{q['marble']}, Champion of Tournament {q['tournamentId']}",
                        input=dict(prompt=q["prompt"], width=W, height=HT, style_images=[dict(url=q["reference"], strength=1)])))
    for r in json.load(open(os.path.join(H, "races", "plan.json"))):
        out.append(dict(key=r["key"], model="bytedance/seedream-5-lite", dest=f"races/out/{r['key'].replace(':', '_')}.jpg",
                        input=dict(prompt=r["prompt"], width=W, height=HT, style_images=[dict(url=r["ref"], strength=1)])))
    return out


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    b = books(); todo = owed()
    if cmd == "next":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        print(json.dumps([dict(key=t["key"], model=t["model"], input=t["input"]) for t in todo
                          if t["key"] not in b and not os.path.exists(os.path.join(H, t["dest"]))][:n]))
    elif cmd == "record":
        a = sys.argv[2:]
        for k, j in zip(a[::2], a[1::2]): b[k] = dict(job=j)
        json.dump(b, open(BOOKS, "w"), indent=0); print(len(b), "jobs in the books")
    elif cmd == "fly":
        print(" ".join(f"{k}={v['job']}" for k, v in b.items() if "done" not in v and "job" in v))
    elif cmd == "got":
        a = sys.argv[2:]; dest = {t["key"]: t for t in todo}; byjob = {v.get("job"): k for k, v in b.items()}
        for k, url in zip(a[::2], a[1::2]):
            k = byjob.get(k, k)  # a Krea job id works as well as a key
            t = dest[k]; path = os.path.join(H, t["dest"])
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=120).read()
            from io import BytesIO
            from PIL import Image
            Image.open(BytesIO(data)).convert("RGB").save(path, "JPEG", quality=94, subsampling=0)
            b.setdefault(k, {})["done"] = t["dest"]
            if k.startswith("T"):
                pj = os.path.join(H, "portraits", "portraits.json"); pp = json.load(open(pj)); tid = int(k[1:])
                pp = [p for p in pp if p["tournamentId"] != tid] + [dict(tournamentId=tid, file=os.path.basename(t["dest"]), title=t["title"])]
                json.dump(sorted(pp, key=lambda p: p["tournamentId"]), open(pj, "w"), indent=1)
            print("saved", t["dest"])
        json.dump(b, open(BOOKS, "w"), indent=0)
    else:
        left = [t for t in todo if not os.path.exists(os.path.join(H, t["dest"]))]
        fly = [t for t in left if t["key"] in b and "done" not in b[t["key"]]]
        print(f"{len(todo)} planned, {len(todo) - len(left)} saved, {len(fly)} in flight, {len(left) - len(fly)} not submitted")


if __name__ == "__main__":
    main()
