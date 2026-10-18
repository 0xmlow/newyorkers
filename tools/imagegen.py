"""imagegen.py: fire tools/prompts.json through ImageGen in the Codex CLI bundled with ChatGPT.app.
Krea and the other image service had 0 credits on 2026-10-17. Writes gen/<name>.png, skips ones already there.
usage: python3 tools/imagegen.py [-j 4] [names...]"""
import json, os, subprocess, sys, time, concurrent.futures as cf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex"
SIZE = {"landscape": "landscape 3:2 (1536x1024)", "square": "square (1024x1024)", "portrait": "portrait 2:3 (1024x1536)"}
cfg = json.load(open(os.path.join(HERE, "tools/prompts.json")))
args = sys.argv[1:]; J = 4
if args[:1] == ["-j"]: J = int(args[1]); args = args[2:]
jobs = [j for j in cfg["jobs"] if (not args or j["name"] in args) and not os.path.exists(os.path.join(HERE, "gen", j["name"] + ".png"))]
os.makedirs(os.path.join(HERE, "gen/logs"), exist_ok=True)
def run(j):
    style = cfg["_style_" + j["style"]]
    p = j["prompt"] + " " + style
    t = time.time()
    msg = (f"Use your image generation tool to create ONE image, {SIZE[j['shape']]}, then copy the generated PNG into the current "
           f"directory as {j['name']}.png. Do nothing else. Image: {p}")
    with open(os.path.join(HERE, "gen/logs", j["name"] + ".log"), "w") as log:
        subprocess.run([C, "exec", "--skip-git-repo-check", "-s", "workspace-write", msg], cwd=os.path.join(HERE, "gen"), stdin=subprocess.DEVNULL, stdout=log, stderr=log, timeout=900)
    ok = os.path.exists(os.path.join(HERE, "gen", j["name"] + ".png"))
    return j["name"], ok, round(time.time() - t)
with cf.ThreadPoolExecutor(J) as ex:
    for n, ok, s in ex.map(run, jobs): print(("ok  " if ok else "FAIL"), n, s, "s", flush=True)
