#!/usr/bin/env python3
"""barney_mirror.py: put the appetizing case on the right wall of the front room and the shelves on the
partition, the way the real shop is laid out (dining room on the left as you enter, through a doorway
behind the bakery counter; the deli case on the opposite wall). MLow's Blender model had them swapped.

Reads assets/museum/props/barney_greengrass.glb, writes it back, keeps the untouched original beside the
collab kit as BARNEY GREENGRASS COLLAB 2026-09-03/model/barney_greengrass_2026-09-13.glb.

Three kinds of edit, all in model units (the room scales the prop by 1.5):
  bake    untextured boxes and merged meshes: vertices are taken to world space, mirrored about the front
          room's centre line (x = 2.225), normals flipped in x, triangle winding reversed, and the node
          transform reset to identity. Merged meshes (the five formica tables, the chairs) come along whole.
  turn    textured planes with words on them (chalkboards, framed pictures): moved to the mirrored x and
          turned 180 degrees about y so the picture still reads the right way round.
  move    a few nodes that would otherwise end up inside the new shelf wall: plain translation.
Run once. A second run is refused by the marker in the asset's extras.
"""
import json, os, shutil, struct, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..'))
GLB = os.path.join(SITE, 'assets', 'museum', 'props', 'barney_greengrass.glb')
KEEP = os.path.join(os.path.dirname(SITE), 'BARNEY GREENGRASS COLLAB 2026-09-03', 'model', 'barney_greengrass_2026-09-13.glb')
CX = 2.225  # centre line of the front room floor slab

raw = open(GLB, 'rb').read()
assert raw[:4] == b'glTF'
jlen = struct.unpack('<I', raw[12:16])[0]
j = json.loads(raw[20:20 + jlen])
blen = struct.unpack('<I', raw[20 + jlen:24 + jlen])[0]
assert raw[24 + jlen:28 + jlen] == b'BIN\0'
binb = bytearray(raw[28 + jlen:28 + jlen + blen])
if j.get('asset', {}).get('extras', {}).get('mirrored'):
    sys.exit('already mirrored, nothing to do')
os.makedirs(os.path.dirname(KEEP), exist_ok=True)
if not os.path.exists(KEEP): shutil.copy2(GLB, KEEP)

nodes = j['nodes']; byname = {n.get('name'): i for i, n in enumerate(nodes)}
extra: list[bytes] = []
CT = {'5126': np.float32, '5123': np.uint16, '5125': np.uint32, '5121': np.uint8}

def acc_view(ai):
    a = j['accessors'][ai]; bv = j['bufferViews'][a['bufferView']]
    comp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    dt = CT[str(a['componentType'])]; isz = np.dtype(dt).itemsize * comp
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride', isz)
    assert stride == isz, 'interleaved buffer, not handled'
    return np.frombuffer(binb, dtype=dt, count=a['count'] * comp, offset=off).reshape(a['count'], comp), a

def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]

def bake(name, dz=0.0, inside=False, dx_front=0.0):
    """inside: only vertices standing in the front room (x > -1.45, z < -0.3 in world) are mirrored; a merged mesh that also
    holds dining room or sidewalk parts keeps those where they are. dx_front: the front tables (z > -6) slide this far in x
    after the mirror, to stand before the case."""
    ni = byname[name]; n = nodes[ni]
    T = np.array(n.get('translation', [0, 0, 0])); R = quat_mat(n.get('rotation', [0, 0, 0, 1])); S = np.array(n.get('scale', [1, 1, 1]))
    M = R @ np.diag(S)
    seen = set()
    for prim in j['meshes'][n['mesh']]['primitives']:
        pa = prim['attributes']['POSITION']
        if pa in seen: continue
        seen.add(pa)
        P, a = acc_view(pa)
        W = (M @ P.T).T + T
        sel = (W[:, 0] > -1.45) & (W[:, 2] < -0.3) if inside else np.ones(len(W), bool)
        W[sel, 0] = 2 * CX - W[sel, 0]; W[sel, 2] += dz
        if dx_front:
            for c in range(0, len(W), 24):
                if sel[c:c + 24].all() and W[c:c + 24, 2].mean() > -6.0: W[c:c + 24, 0] += dx_front
        P[:] = W.astype(np.float32)
        a['min'] = [float(v) for v in W.min(0)]; a['max'] = [float(v) for v in W.max(0)]
        if 'NORMAL' in prim['attributes']:
            N, _ = acc_view(prim['attributes']['NORMAL'])
            NW = (np.linalg.inv(M).T @ N.T).T; NW[sel, 0] = -NW[sel, 0]
            NW /= np.linalg.norm(NW, axis=1, keepdims=True); N[:] = NW.astype(np.float32)
        if 'indices' in prim:
            # the model shares one index buffer between every box of the same shape, so the flip must go on a
            # private copy appended to the binary chunk, or it lands on every box that shares the buffer
            I, ia = acc_view(prim['indices']); I = I.copy(); tri = I.reshape(-1, 3); flip = sel[tri[:, 0]] & sel[tri[:, 1]] & sel[tri[:, 2]]
            tri[flip] = tri[flip][:, [0, 2, 1]]
            raw = I.tobytes(); raw += b'\0' * ((4 - len(raw) % 4) % 4)
            j['bufferViews'].append({'buffer': 0, 'byteOffset': len(binb) + sum(len(e) for e in extra), 'byteLength': len(I.tobytes()), 'target': 34963})
            extra.append(raw)   # appended at write time: numpy views of binb keep it from growing here
            na = dict(ia); na.pop('byteOffset', None); na['bufferView'] = len(j['bufferViews']) - 1
            j['accessors'].append(na); prim['indices'] = len(j['accessors']) - 1
    for k in ('translation', 'rotation', 'scale'): n.pop(k, None)

def turn(name, dz=0.0, y=None):
    n = nodes[byname[name]]; t = n.get('translation', [0, 0, 0])
    n['translation'] = [2 * CX - t[0], t[1] if y is None else y, t[2] + dz]
    n['rotation'] = qmul([0, 1, 0, 0], n.get('rotation', [0, 0, 0, 1]))

def move(name, t, rot=None):
    n = nodes[byname[name]]; n['translation'] = list(t)
    if rot is not None: n['rotation'] = rot

# the appetizing case and what is in and on it, kept where it is along the front wall
for nm in ['case_base', 'M_Counter_steel', 'M_Counter_glass', 'M_Counter_salmon', 'M_Counter_tag_w', 'M_Counter_whitefish', 'fish_2', 'M_Counter_jar_amber', 'M_Counter_jar_red', 'M_Counter_jar_grn', 'scale_head']:
    bake(nm)
for nm in ['chalk_0', 'chalk_1', 'chalk_2']: turn(nm)
# the shelf wall (merged with the chalkboard backing) and its goods go to the partition, pulled forward
# so they stop short of the doorway into the dining room (model z -6.6 to -9.4)
bake('M_Counter_wood_dark', dz=0)   # three boxes: the shelf wall and two chalk backings; shifted below per box
for nm in ['M_Counter_shelf_w', 'M_Counter_prod_0', 'M_Counter_prod_1', 'M_Counter_prod_2', 'M_Counter_prod_3', 'M_Counter_prod_4', 'M_Counter_prod_5', 'M_Counter_prod_6']:
    bake(nm, dz=5.3)
# the shelf wall box inside the merged mesh: find the box whose x is now near the partition and far from the chalkboards, shift it forward
ni = byname['M_Counter_wood_dark']; prim = j['meshes'][nodes[ni]['mesh']]['primitives'][0]
P, a = acc_view(prim['attributes']['POSITION'])
for c in range(0, len(P), 24):
    b = P[c:c + 24]
    if b[:, 2].min() < -11 and b[:, 2].max() - b[:, 2].min() > 5:  # the long one
        b[:, 2] += 5.3
a['min'] = [float(v) for v in P.min(0)]; a['max'] = [float(v) for v in P.max(0)]
# the formica tables (merged), the chairs (merged), the register, the plates of food (merged across every table in the
# model, sidewalk and dining room included, so only the front room parts move). The two front tables slide to the
# middle of the room, before the case, the way the real shop has a few small tables right in front of it.
for nm in ['M_Counter_formica', 'M_Counter_chair_grn', 'M_Counter_ink']:
    bake(nm, inside=True, dx_front=2.4)
for nm in ['M_Food_plate_w', 'M_Food_plate_grn', 'M_Food_bagel', 'M_Food_lox', 'M_Food_latke', 'M_Food_glass_cup', 'M_Food_oj']:
    bake(nm, inside=True)
# the food on the two front tables: the merged food meshes are not 24 vertex boxes, so they slide by position instead
for nm in ['M_Food_plate_w', 'M_Food_plate_grn', 'M_Food_bagel', 'M_Food_lox', 'M_Food_latke', 'M_Food_glass_cup', 'M_Food_oj']:
    for prim in j['meshes'][nodes[byname[nm]]['mesh']]['primitives']:
        P, a = acc_view(prim['attributes']['POSITION'])
        m = (P[:, 0] > -1.0) & (P[:, 0] < 1.0) & (P[:, 2] < -0.3) & (P[:, 2] > -6.0)
        P[m, 0] += 2.4; a['min'] = [float(v) for v in P.min(0)]; a['max'] = [float(v) for v in P.max(0)]
# the framed pictures that hung over the shelves: to the far end of the right wall, past the case and the merch
for nm, dz in [('hamptons', -7.5), ('barney', -7.5)]: turn(nm, dz)
bake('M_Counter_frame_dark', -7.5)
turn('blossom1', dz=-11.9, y=2.9); bake('blossom1_frm', -11.9)
nodes[byname['blossom1_frm']]  # its vertices were baked at y 2.2: lift them
P, a = acc_view(j['meshes'][nodes[byname['blossom1_frm']]['mesh']]['primitives'][0]['attributes']['POSITION']); P[:, 1] += 0.7; a['min'][1] += 0.7; a['max'][1] += 0.7
# the Abloh print was on the partition: now the right wall near the back, under the pictures
turn('abloh', dz=-2.4)
# the MLOW plaque on the partition would sit inside the new shelf wall: to the rear wall of the front room, right of the logo
move('mlow_plaque', [4.6, 2.0, -13.42], [0, 0.7071068, 0, 0.7071068])
move('mlow_logo', [4.6, 2.05, -13.38], qmul([0, 0.7071068, 0, 0.7071068], [0.5, -0.5, 0.5, 0.5]))
move('blossom3', [3.3, 2.0, -13.38], qmul([0, 0.7071068, 0, 0.7071068], [0.5, -0.5, 0.5, 0.5]))

binb = bytes(binb) + b''.join(extra)
j['buffers'][0]['byteLength'] = len(binb)
j.setdefault('asset', {}).setdefault('extras', {})['mirrored'] = 'front room mirrored 2026-10-12, barney_mirror.py'
js = json.dumps(j, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
out = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(binb)) + b'BIN\0' + binb
open(GLB, 'wb').write(out)
print('wrote', GLB, len(out), 'bytes; original kept at', KEEP)
