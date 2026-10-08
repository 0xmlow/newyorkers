"""MLow's stickers in 3D: download the Trellis GLBs (cache/sticker_glb.json: {key: url}), keep a master copy in
DELIVERABLES/stickers_3d/<key>.glb, optimize to site/assets/sticker/<key>.gltf.json, write site/assets/stickers.json."""
import os, json, subprocess, urllib.request, base64, struct, shutil
CLI = '/Users/degens/.npm/_npx/425967af1abfabd4/node_modules/.bin/gltf-transform'
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets', 'sticker'); MASTER = os.path.join(H, '..', 'DELIVERABLES', 'stickers_3d'); os.makedirs(OUT, exist_ok=True); os.makedirs(MASTER, exist_ok=True)
def glb_to_json(path):
    b = open(path, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', b[o:o + 4])[0]; binc = b[o + 8:o + 8 + bl]
    for buf in j['buffers']:
        if 'uri' not in buf and not (buf.get('extensions', {}).get('EXT_meshopt_compression', {}).get('fallback')): buf['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode(); break
    return j
urls = json.load(open(os.path.join(H, 'cache', 'sticker_glb.json'))); man = []
for key, url in urls.items():
    m = os.path.join(MASTER, key + '.glb'); dst = os.path.join(OUT, key + '.gltf.json')
    if not os.path.exists(m): urllib.request.urlretrieve(url, m)
    if not os.path.exists(dst):
        o = os.path.join(MASTER, key + '_web.glb')
        r = subprocess.run([CLI, 'optimize', m, o, '--compress', 'meshopt', '--simplify', 'true', '--simplify-ratio', '0.5', '--simplify-error', '0.0005', '--texture-compress', 'webp', '--texture-size', '1024'], capture_output=True, text=True)
        if r.returncode: print('FAIL', key, r.stderr[-200:]); continue
        json.dump(glb_to_json(o), open(dst, 'w'), separators=(',', ':')); os.remove(o)
    man.append({'key': key, 'kb': os.path.getsize(dst) // 1024, 'master_kb': os.path.getsize(m) // 1024}); print(key, man[-1], flush=True)
json.dump(man, open(os.path.join(OUT, '..', 'stickers.json'), 'w'), indent=0); print('stickers', len(man))
