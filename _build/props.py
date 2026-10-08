"""NEW YORKERS 3D props -> web glTF for the basement. gltf-transform optimize (meshopt, webp 1024, simplify), then GLB unpacked to one .gltf.json."""
import os, json, base64, subprocess, struct, sys
CLI = '/Users/degens/.npm/_npx/425967af1abfabd4/node_modules/.bin/gltf-transform'
SRC = '/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS 3D 2026-08-23/2_COLLECTION/glb'
ST = '/Users/degens/Desktop/NEW YORKERS BY MLOW/NEW YORKERS 3D 2026-08-23/3_STICKER_PROPS/glb'
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'site', 'assets', 'props'); os.makedirs(OUT, exist_ok=True)
TMP = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'ymb_props'); os.makedirs(TMP, exist_ok=True)
# key, source glb (by NY3D id or sticker name), label
PROPS = [
  ('bagelbin', '0003', 'Bagel bin'), ('creamcheese', '0004', 'Cream cheese tub'), ('catbed', '0016', 'Bodega cat bed'), ('lotto', '0007', 'Lottery ticket rack'),
  ('fan', '0071', 'Bodega fan'), ('seltzer', '0085', 'Seltzer siphon'), ('rat', '0102', 'Rat on rail'), ('radiator', '0243', 'Radiator'), ('ceilingfan', '0250', 'Ceiling fan'),
  ('floorlamp', '0299', 'Floor lamp'), ('steampipe', '0313', 'Steam pipe'), ('fusebox', '0314', 'Fuse box'), ('windowfan', '0318', 'Window fan'), ('crystalrat', '0516', 'Crystal rat'),
  ('crystalroach', '0518', 'Crystal roach'), ('urn', '0001', 'Coffee urn'), ('beercase', '0035', 'Beer case'), ('cooler', '0031', 'Soda cooler'), ('milkcrate', '0030', 'Milk crate'),
  ('freezerdoor', '0066', 'Freezer door'), ('payphone', '0187', 'Payphone'), ('radio', '0156', 'Radio'), ('poolcue', '0868', 'Pool cue'), ('dart', '0871', 'Dart'), ('hotsauce', '0015', 'Hot sauce shelf'),
  ('newspapers', '0017', 'Newspaper stack'), ('headphone', '0825', 'Headphone'), ('mic', '0827', 'Microphone'), ('tablelamp', '0298', 'Table lamp'), ('steamvalve', '0245', 'Steam valve'),
  ('toaster', 'toaster', 'Toaster'), ('hourglass', 'hourglass', 'Hourglass'), ('mausoleum', 'mausoleum', 'Mausoleum'), ('potion', 'potion_bottle', 'Potion bottle'), ('eyekey', 'eye_key', 'Eye key'),
]
def glb_to_json(path):
    b = open(path, 'rb').read(); assert b[:4] == b'glTF'
    jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); o = 20 + jl
    bl = struct.unpack('<I', b[o:o + 4])[0]; binc = b[o + 8:o + 8 + bl]
    for buf in j['buffers']:
        if 'uri' not in buf and not (buf.get('extensions', {}).get('EXT_meshopt_compression', {}).get('fallback')):
            buf['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode(); break
    return j
man = []
for key, src, label in PROPS:
    if src.isdigit():
        fs = [f for f in os.listdir(SRC) if f.startswith(f'NY3D-{src}_') and f.endswith('_solid.glb')]
        if not fs: print('MISSING', key); continue
        path = os.path.join(SRC, fs[0])
    else:
        path = os.path.join(ST, src + '_solid.glb')
        if not os.path.exists(path): print('MISSING', key); continue
    dst = os.path.join(OUT, key + '.gltf.json')
    if not os.path.exists(dst):
        o = os.path.join(TMP, key + '.glb')
        r = subprocess.run([CLI, 'optimize', path, o, '--compress', 'meshopt', '--simplify', 'true', '--simplify-ratio', '0.35', '--simplify-error', '0.0005', '--texture-compress', 'webp', '--texture-size', '1024'], capture_output=True, text=True)
        if r.returncode: print('FAIL', key, r.stderr[-300:]); continue
        json.dump(glb_to_json(o), open(dst, 'w'), separators=(',', ':')); os.remove(o)
    man.append(dict(key=key, label=label, kb=os.path.getsize(dst) // 1024)); print(key, man[-1]['kb'], 'KB', flush=True)
json.dump(man, open(os.path.join(OUT, '..', 'props.json'), 'w'), indent=0)
print('total', sum(m['kb'] for m in man) // 1024, 'MB')
