"""THE BIG UPGRADE (2026-11-24) assets: Poly Haven CC0 scans (1k, colour + GL normal + roughness, as WebP) into
site/assets/v3/tex/, Poly Haven CC0 models and our own GLBs (meshopt, WebP textures) into site/assets/v3/glb/.
Needs gltf-transform (npx -y @gltf-transform/cli@4) and PIL. Rerunnable: skips what exists."""
import os, json, shutil, subprocess, urllib.request, glob, sys
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(H, '..', 'site', 'assets', 'v3'); TX = os.path.join(A, 'tex'); GL = os.path.join(A, 'glb')
SITE = os.path.join(H, '..', '..', 'NEW YORKERS SITE', 'assets')
TMP = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'ymb_v3'); os.makedirs(TMP, exist_ok=True); os.makedirs(TX, exist_ok=True); os.makedirs(GL, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (asset fetch)'}
def get(url, path):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as u, open(path, 'wb') as f: shutil.copyfileobj(u, f)
TEX = ['concrete_floor_worn_001', 'worn_plaster_wall', 'red_brick_plaster_patch_02', 'old_linoleum_flooring_01', 'stair_planks', 'metal_plate', 'white_rough_plaster']
MODELS = ['pull_chain_light_socket', 'mounted_fluorescent_lights', 'wall_clock', 'fire_alarm', 'security_camera_01', 'mousetrap', 'plunger', 'hand_truck', 'cement_bag', 'caged_hanging_light', 'plastic_bottle_gallon']
OWN = {'poker_table': 'nyb_oddcouple_poker', 'rat_king': 'sw_king'}  # barney_bagel tried: it is a lox sandwich, not a ring
CLI = ['npx', '-y', '@gltf-transform/cli@4']
def opt(src, dst, size=1024):
    r = subprocess.run(CLI + ['optimize', src, dst, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', str(size), '--simplify', 'false'], capture_output=True, text=True)
    if r.returncode: print('FAIL', dst, r.stderr[-300:]); return False
    return True
man = []
for k in TEX:
    out = {s: os.path.join(TX, f'{k}_{s}.webp') for s in 'cnr'}
    if not all(os.path.exists(p) for p in out.values()):
        f = json.loads(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{k}', headers=UA), timeout=60).read())
        for s, key in (('c', 'Diffuse'), ('n', 'nor_gl'), ('r', 'Rough')):
            u = f[key]['1k']['jpg']['url']; t = os.path.join(TMP, os.path.basename(u)); get(u, t)
            im = Image.open(t); im = im.convert('RGB'); im.save(out[s], 'WEBP', quality=86 if s == 'c' else 90); os.remove(t)
    man.append({'file': f'tex/{k}_*.webp', 'source': f'https://polyhaven.com/a/{k}', 'license': 'CC0', 'kb': sum(os.path.getsize(p) for p in out.values()) // 1024}); print(man[-1], flush=True)
for k in MODELS:
    dst = os.path.join(GL, k + '.glb')
    if not os.path.exists(dst):
        f = json.loads(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{k}', headers=UA), timeout=60).read())
        g = f['gltf']['1k']['gltf']; d = os.path.join(TMP, k); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
        get(g['url'], os.path.join(d, os.path.basename(g['url'])))
        for rel, inc in (g.get('include') or {}).items(): os.makedirs(os.path.dirname(os.path.join(d, rel)), exist_ok=True); get(inc['url'], os.path.join(d, rel))
        opt(os.path.join(d, os.path.basename(g['url'])), dst, 512); shutil.rmtree(d, ignore_errors=True)
    if os.path.exists(dst): man.append({'file': f'glb/{k}.glb', 'source': f'https://polyhaven.com/a/{k}', 'license': 'CC0', 'kb': os.path.getsize(dst) // 1024}); print(man[-1], flush=True)
for k, n in OWN.items():
    dst = os.path.join(GL, k + '.glb')
    src = sorted(glob.glob(os.path.join(SITE, '**', n + '.glb'), recursive=True))[0]
    if not os.path.exists(dst): opt(src, dst, 1024)
    if os.path.exists(dst): man.append({'file': f'glb/{k}.glb', 'source': 'NEW YORKERS own asset ' + os.path.relpath(src, SITE), 'license': 'MLow own', 'kb': os.path.getsize(dst) // 1024}); print(man[-1], flush=True)
json.dump(man, open(os.path.join(A, 'v3_assets.json'), 'w'), indent=1); print('total', sum(m['kb'] for m in man) // 1024, 'MB')
