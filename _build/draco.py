"""draco.py [names...]: run draco_pass.py over every shipped prop whose compressed copy is missing or older than its source."""
import os, sys, subprocess, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
SRC = os.path.join(ROOT, "work", "glb_pass"); OUT = os.path.join(ROOT, "work", "glb_draco")
def stale(n):
    o = os.path.join(OUT, n + ".glb"); return not os.path.exists(o) or os.path.getmtime(o) < os.path.getmtime(os.path.join(SRC, n + ".glb"))
if len(sys.argv) > 1: todo = sys.argv[1:]
else:
    import importlib.util; spec = importlib.util.spec_from_file_location("b", os.path.join(HERE, "build.py"))
    sys.argv = ["build.py", "--js"]; b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
    todo = sorted(n for n in b.used_models() if n.startswith(("ph_", "nyb_")) and stale(n))
chunks = [todo[i:i + 12] for i in range(0, len(todo), 12)]
def run(ch):
    r = subprocess.run([BL, "-b", "-P", os.path.join(HERE, "draco_pass.py"), "--", ",".join(ch)], capture_output=True, text=True)
    return [l for l in r.stdout.splitlines() if l.startswith("DRACO")] or [f"FAIL {ch[0]}..: {(r.stderr.strip().splitlines() or ['?'])[-1][:160]}"]
with cf.ThreadPoolExecutor(4) as ex:
    for lines in ex.map(run, chunks): print("\n".join(lines), flush=True)
