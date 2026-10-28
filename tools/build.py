# build.py <out.html>: rebuild index.html (v2) from v1/index.html, upgrade.js and the GLBs.
# Paths are relative to this repo. The palm (museum tree kit), the r128 GLTFLoader and SkeletonUtils, and the rigged cast
# are read from MLow's NEW YORKERS folder: set NEW_YORKERS_ROOT if it is not at ~/Desktop/NEW YORKERS BY MLOW.
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
ROOT = os.environ.get('NEW_YORKERS_ROOT', os.path.expanduser('~/Desktop/NEW YORKERS BY MLOW'))
SRC = os.path.join(REPO, 'v1', 'index.html')
OUT = sys.argv[1]
h = open(SRC, encoding='utf-8').read()
def rep(old, new, count=1):
    global h
    n = h.count(old); assert n == count, (old[:60], n); h = h.replace(old, new)
# hooks: keep references to the primitives a GLB will replace
rep("scene.add(p); addCircle(p.position.x,p.position.z,0.45);",
    "scene.add(p); addCircle(p.position.x,p.position.z,0.45); (window.__palms=window.__palms||[]).push({g:p,h:p.userData.crownY});")
rep("g.position.set(sp[0],0,sp[1]); g.rotation.y=Math.random()*3; scene.add(g);",
    "g.position.set(sp[0],0,sp[1]); g.rotation.y=Math.random()*3; scene.add(g); (window.__euph=window.__euph||[]).push(g);")
rep("g.position.set(x,0,z); scene.add(g); addCircle(x,z,0.22);",
    "g.position.set(x,0,z); scene.add(g); addCircle(x,z,0.22); (window.__lamps=window.__lamps||[]).push(g);")
rep("g.position.set(x,0,z); scene.add(g); addCircle(x,z,0.55*s);",
    "g.position.set(x,0,z); scene.add(g); addCircle(x,z,0.55*s); (window.__pots=window.__pots||[]).push({g:g,s:s});")
rep("  scene.add(rocks);", "  scene.add(rocks); window.__rocks=rocks;")
# fountain rim: zellige band instead of a flat cobalt slab (texture quick win)
rep("const rimTop=shade(box(8.9,0.15,8.9,M.bleuDeep));",
    "const rimTop=shade(box(8.9,0.15,8.9,(function(){const zt=zelTex.clone();zt.needsUpdate=true;zt.repeat.set(6,6);return new THREE.MeshLambertMaterial({map:zt});})()));")
rep("npcs.forEach(function(n){npcStep(n,dt,t)});", "npcs.forEach(function(n){(n.rig?rigNpcStep:npcStep)(n,dt,t)});")
rep("  envStep(dt);\n", "  envStep(dt);\n  if(window.upgradeStep) upgradeStep(dt);\n")
# upgrade code before the first frame
up = open(os.path.join(HERE, 'upgrade.js'), encoding='utf-8').read()
i = h.rfind("animate();\n</script>"); assert i > 0
h = h[:i] + up + "\n" + h[i:]
# r128 GLTFLoader + SkeletonUtils, inline, right after three.min.js
cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
gl = open(ROOT + '/YOUR MOMS BASEMENT 2026-10-08/site/vendor/GLTFLoader.js', encoding='utf-8').read()
su = open(ROOT + '/NEW YORKERS SITE/assets/spiral/vendor/SkeletonUtils.js', encoding='utf-8').read()
rep(cdn, cdn + '\n<script>/* three.js r128 examples/js GLTFLoader, MIT */\n' + gl + '\n</script>\n<script>/* three.js examples/js SkeletonUtils, MIT */\n' + su + '\n</script>')
# assets
A = {}
def add(k, p): A[k] = base64.b64encode(open(p, 'rb').read()).decode()
add('palm', ROOT + '/NEW YORKERS SITE/assets/museum/trees/tree_palm.glb')
for k in ['quiver', 'boulder', 'lantern', 'bench']: add(k, os.path.join(HERE, 'glb', k + '.glb'))
for n in ['annieh', 'gown', 'workgirl', 'oscar', 'loretta', 'cabbie']: add('rig_' + n, ROOT + '/UPGRADE ALL ROOMS 2026-10-28/rig/out/' + n + '.glb')
blob = '<script type="application/json" id="jm-assets">' + json.dumps(A) + '</script>\n'
rep('<script src="https://cdnjs', blob + '<script src="https://cdnjs')
h = h.replace('<title>Jardin Majorelle × MLOW — A Playable Garden</title>', '<title>Jardin Majorelle × MLOW — A Playable Garden (v2)</title>')
open(OUT, 'w', encoding='utf-8').write(h)
print(OUT, os.path.getsize(OUT), {k: len(v) * 3 // 4 // 1024 for k, v in A.items()})
