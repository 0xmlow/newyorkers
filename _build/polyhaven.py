"""CC0 models from Poly Haven (api.polyhaven.com), 1k glTF, optimized to one .gltf.json each under site/assets/cc0/."""
import os, json, base64, struct, subprocess, urllib.request, shutil, sys
CLI = '/Users/degens/.npm/_npx/425967af1abfabd4/node_modules/.bin/gltf-transform'
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets', 'cc0'); os.makedirs(OUT, exist_ok=True)
TMP = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'ymb_ph'); os.makedirs(TMP, exist_ok=True)
IDS = ['sofa_02', 'television_02', 'boombox', 'cassette_player', 'dartboard', 'ceiling_fan', 'metal_trash_can', 'cardboard_box_01', 'plastic_crate_01', 'street_rat', 'concrete_cat_statue', 'vintage_microwave', 'korean_fire_extinguisher_01', 'ladder_sectioned_01', 'metal_toolbox', 'pipe_wrench', 'trashbag', 'barrel_03', 'hanging_industrial_lamp', 'plastic_monobloc_chair_01', 'portable_generator', 'power_box_01', 'spray_paint_bottles', 'metal_jerrycan', 'folding_wooden_stool', 'decorative_book_set_01', 'mid_century_lounge_chair']
def get(url, path):
    r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}); os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(r, timeout=120) as u, open(path, 'wb') as f: shutil.copyfileobj(u, f)
def glb_to_json(path):
    b = open(path, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', b[o:o + 4])[0]; binc = b[o + 8:o + 8 + bl]
    for buf in j['buffers']:
        if 'uri' not in buf and not (buf.get('extensions', {}).get('EXT_meshopt_compression', {}).get('fallback')): buf['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode(); break
    return j
man = json.load(open(os.path.join(OUT, '..', 'cc0.json'))) if os.path.exists(os.path.join(OUT, '..', 'cc0.json')) else []
done = {m['key'] for m in man}
for k in IDS:
    dst = os.path.join(OUT, k + '.gltf.json')
    if k in done and os.path.exists(dst): continue
    try:
        files = json.loads(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{k}', headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read())
        g = files['gltf']['1k']['gltf']; d = os.path.join(TMP, k); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
        get(g['url'], os.path.join(d, os.path.basename(g['url'])))
        for rel, inc in (g.get('include') or {}).items(): get(inc['url'], os.path.join(d, rel))
        src = os.path.join(d, os.path.basename(g['url'])); o = os.path.join(d, 'o.glb')
        r = subprocess.run([CLI, 'optimize', src, o, '--compress', 'meshopt', '--simplify', 'true', '--simplify-ratio', '0.5', '--simplify-error', '0.0005', '--texture-compress', 'webp', '--texture-size', '1024'], capture_output=True, text=True)
        if r.returncode: print('FAIL', k, r.stderr[-200:]); continue
        json.dump(glb_to_json(o), open(dst, 'w'), separators=(',', ':')); shutil.rmtree(d, ignore_errors=True)
        man.append({'key': k, 'kb': os.path.getsize(dst) // 1024, 'license': 'CC0 Poly Haven'}); json.dump(man, open(os.path.join(OUT, '..', 'cc0.json'), 'w'), indent=0); print(k, man[-1]['kb'], 'KB', flush=True)
    except Exception as e: print('ERR', k, str(e)[:120], flush=True)
print('total', sum(m['kb'] for m in man) // 1024, 'MB')
