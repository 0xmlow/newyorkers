"""tools/glb_fetch.py <name> <model_url> : download a finished Krea Tripo GLB into work/glb, then run cast_pass (Blender) and
lean_pass (16k triangles for props, more for heroes) so the gallery ships it light."""
import os, subprocess, sys, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); n, url = sys.argv[1], sys.argv[2]; tri = sys.argv[3] if len(sys.argv) > 3 else "16000"
dst = os.path.join(R, "work", "glb", n + ".glb"); urllib.request.urlretrieve(url, dst); print(n, os.path.getsize(dst) // 1024, "KB raw")
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
out = subprocess.run([BL, "-b", "--factory-startup", "--python", os.path.join(R, "_build", "cast_pass.py"), "--", n], capture_output=True, text=True).stdout
print([l for l in out.splitlines() if "PASS" in l])
site = os.path.join(R, "site", "assets", "glb", n + ".glb"); os.makedirs(os.path.dirname(site), exist_ok=True)
import shutil; shutil.copyfile(os.path.join(R, "work", "glb_pass", n + ".glb"), site)
out = subprocess.run([BL, "-b", "--factory-startup", "-P", os.path.join(R, "_build", "lean_pass.py"), "--", f"site/assets/glb/{n}.glb:{tri}"], capture_output=True, text=True, cwd=R).stdout
print([l for l in out.splitlines() if "LEAN" in l])
