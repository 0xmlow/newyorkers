"""Convert MLow's meme sculptures to web glTF for MEME ISLAND.
20 classic memes (MEME MUSEUM catalog) + 46 sculptures from The Memes by 6529 (MEME MUSEUM v3 roster).
Each: gltf-transform optimize (weld, simplify ~60k tris, meshopt, webp 1024), then one .gltf.json with
every buffer and image inlined as data URIs, because artifacts do not serve .glb or .bin."""
import os, re, json, base64, subprocess, sys, ast, shutil
ARCH = os.path.expanduser('~/Documents/Claude/Projects/ARCHITECT')
CLI = '/Users/degens/.npm/_npx/425967af1abfabd4/node_modules/.bin/gltf-transform'
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets', 'sculpt'); os.makedirs(OUT, exist_ok=True)
TMP = '/private/tmp/claude-501/-Users-degens-Desktop-NEW-YORKERS-BY-MLOW/b4e94593-1287-4765-8ced-b372243b10d7/scratchpad/glb'; os.makedirs(TMP, exist_ok=True)

def dict_literal(path, name):
    s = open(path).read(); i = s.index(name + ' = {'); j = s.index('\n}', i) + 2
    return ast.literal_eval(s[i + len(name) + 3:j])
classic = dict_literal(f'{ARCH}/meme-museum/memes.py', 'CATALOG')
roster = dict_literal(f'{ARCH}/meme-museum-v3/memes6529.py', 'ROSTER')
items = []
for k, (fn, label, size, mode) in classic.items():
    items.append(dict(key=k, src=f'{ARCH}/Memes in 3D/{fn}', label=label, sub='MEME MUSEUM · CLASSIC', size=size, mode=mode, set='classic'))
acc = {u: i + 1 for i, u in enumerate(sorted(roster))}
for u, (card, title, sec, size) in sorted(roster.items()):
    items.append(dict(key=u[:8], src=f'{ARCH}/Memes in 3D/6529 memes in 3d/extracted/{u}.glb', label=f'"{title.upper()}"' if title else '"UNTITLED"',
                      sub=f'THE MEMES · CARD {card}' if card else f'ACC. 6529-{acc[u]:02d} · UNATTRIBUTED', card=card, size=size, mode='h', set='6529', sec=sec))

def inline(gltf_path):
    d = os.path.dirname(gltf_path); j = json.load(open(gltf_path))
    for b in j.get('buffers', []):
        if 'uri' in b: b['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(open(os.path.join(d, b['uri']), 'rb').read()).decode()
    for im in j.get('images', []):
        if 'uri' in im: mt = im.get('mimeType', 'image/webp'); im['uri'] = f'data:{mt};base64,' + base64.b64encode(open(os.path.join(d, im['uri']), 'rb').read()).decode()
    return j

import struct
def glb_to_json(path):
    # unpack the GLB container itself: keeps EXT_meshopt_compression and bufferView images intact
    b = open(path, 'rb').read(); assert b[:4] == b'glTF'
    jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); o = 20 + jl
    bl = struct.unpack('<I', b[o:o + 4])[0]; binc = b[o + 8:o + 8 + bl]
    for i, buf in enumerate(j['buffers']):
        if 'uri' not in buf and not (buf.get('extensions', {}).get('EXT_meshopt_compression', {}).get('fallback')):
            buf['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode(); break
    return j

manifest = []
for it in items:
    dst = os.path.join(OUT, it['key'] + '.gltf.json')
    if not os.path.exists(it['src']): print('MISSING', it['key'], it['src'][-50:]); continue
    if not os.path.exists(dst):
        w = os.path.join(TMP, it['key']); os.makedirs(w, exist_ok=True)
        r = subprocess.run([CLI, 'optimize', it['src'], f'{w}/o.glb', '--compress', 'meshopt', '--simplify', 'true', '--simplify-ratio', '0.12', '--simplify-error', '0.0008',
                            '--texture-compress', 'webp', '--texture-size', '1024', '--flatten', 'true', '--join', 'true'], capture_output=True, text=True)
        if r.returncode: print('FAIL optimize', it['key'], r.stderr[-300:]); shutil.rmtree(w, True); continue
        json.dump(glb_to_json(f'{w}/o.glb'), open(dst, 'w'), separators=(',', ':')); shutil.rmtree(w, True)
    m = {k: it.get(k) for k in ('key', 'label', 'sub', 'size', 'mode', 'set', 'card', 'sec')}; m['kb'] = os.path.getsize(dst) // 1024
    manifest.append(m); print('ok', it['key'], m['label'], m['kb'], 'KB', flush=True)
json.dump(manifest, open(os.path.join(OUT, '..', 'sculpts.json'), 'w'), indent=0)
print('DONE', len(manifest), 'sculptures', sum(m['kb'] for m in manifest) // 1024, 'MB')
