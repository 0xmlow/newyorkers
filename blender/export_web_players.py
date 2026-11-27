"""export_web_players.py: the people pass bodies for the walk's jointed game (players.js).
  Blender -b --factory-startup --python blender/export_web_players.py
From the baked rest shapes (work/pose_m_stand_jersey.npz, pose_m_stand_suit.npz: the sculpted Human Base Mesh, Multires 2,
and its cloth shell), cut per bone of players.js's rig, each limb turned straight down about its joint (the rig's rest),
decimated, split by colour key, in the bone's own space, three.js axes (y up, facing +z). Also the seven flower heads the
Cycles build puts on the players (cast donors, cut at the head bone), on the shared cast atlas (export_web_cast.py first).
Writes site/assets/cast/bodies.bin + bodies.json (rig joint offsets, parts per dress: bone, key, geometry)."""
import bpy, bmesh, os, sys, json, math
import numpy as np
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); WK = os.path.join(HERE, 'work'); sys.path.insert(0, HERE)
import people
OUT = os.path.join(ROOT, 'site', 'assets', 'cast')
RATIO = float(os.environ.get('BODY_RATIO', '0.06'))
S = 1.185   # the rig's players are tall: ankle to hip 0.93 m
j = people.J['male_realistic']
SH, EL, WR = map(np.array, (j['sh'], j['el'], j['wr'])); HP, KN, AN = map(np.array, (j['hip'], j['knee'], j['ankle']))
HIPS = np.array([0, HP[1], HP[2]]); CHEST = HIPS + [0, 0, 0.07]; NECK = np.array([0, -0.02, j['neck']])

def down(a, b):
    """rotation (3x3) taking the direction a to b onto straight down (-z)"""
    d = (b - a) / np.linalg.norm(b - a); t = np.array([0, 0, -1.0]); v = np.cross(d, t); c = float(d @ t)
    if np.linalg.norm(v) < 1e-8: return np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]]); return np.eye(3) + vx + vx @ vx / (1 + c)
# the straightened skeleton (left side; the right mirrors): joint and the rotation applied about it
R_UP = down(SH, EL); EL_S = SH + R_UP @ (EL - SH); R_FO = down(EL, WR); WR_S = EL_S + (WR - EL) @ R_FO.T
R_TH = down(HP, KN); KN_S = HP + R_TH @ (KN - HP); R_SH = down(KN, AN); AN_S = KN_S + (AN - KN) @ R_SH.T
b2t = lambda p: np.c_[p[..., 0], p[..., 2], -p[..., 1]] if p.ndim == 2 else np.array([p[0], p[2], -p[1]])
RIG = {   # parent-relative offsets, three.js axes, metres (players.js rig())
    'hips': b2t(HIPS * S).tolist(), 'chest': b2t((CHEST - HIPS) * S).tolist(), 'head': b2t((NECK - CHEST) * S).tolist(),
    'sh': b2t((SH - CHEST) * S).tolist(), 'el': b2t((EL_S - SH) * S).tolist(), 'hand': b2t((WR_S - EL_S) * S).tolist(),
    'hip': b2t((HP - HIPS) * S).tolist(), 'knee': b2t((KN_S - HP) * S).tolist(), 'ankle': b2t((AN_S - KN_S) * S).tolist(),
}

def bones_of(v):
    """bone name per vertex (rest space, Blender axes), plus the side (+1 left, -1 right)"""
    R = people.regions(v, j); x, z = v[:, 0], v[:, 2]; side = np.where(x >= 0, 1, -1); ax = np.abs(x)
    b = np.full(len(v), 'hips', object)
    b[z > CHEST[2]] = 'chest'; b[z > NECK[2] + 0.005] = 'head'
    arm = R['arm']; d = (WR - SH)[[0, 2]]; L = np.linalg.norm(d); d = d / L
    s_ = (np.stack([ax, z], 1) - SH[[0, 2]]) @ d
    b[arm & (R['te'] < 0)] = 'sh'; b[arm & (R['te'] >= 0)] = 'el'; b[arm & (s_ > L - 0.005)] = 'hand'
    leg = R['leg'] & (z < HP[2] - 0.02)
    b[leg & (z >= KN[2])] = 'hip'; b[leg & (z < KN[2]) & (z >= AN[2] + 0.015)] = 'knee'; b[leg & (z < AN[2] + 0.015)] = 'ankle'
    return b, side
PIV = {'hips': (HIPS, np.eye(3), HIPS), 'chest': (CHEST, np.eye(3), CHEST), 'head': (NECK, np.eye(3), NECK),
       'sh': (SH, R_UP, SH), 'el': (EL, R_FO, EL_S), 'hand': (WR, R_FO, WR_S), 'hip': (HP, R_TH, HP), 'knee': (KN, R_SH, KN_S), 'ankle': (AN, R_SH, AN_S)}
def to_bone(p, bone):
    """rest point (left side) to the bone's local space: turn about the original joint, then measure from the joint"""
    J0, Rm, Js = PIV[bone]; return b2t(((p - J0) @ Rm.T) * S)

BODY_KEY = {0: 'skin', 3: 'shoe', 9: 'shoe', 5: 'sock', 4: 'hair'}
SKIN_KEY = {'sh': 'arm', 'hip': 'shin', 'knee': 'shin', 'ankle': 'shin', 'el': 'skin', 'hand': 'skin', 'hips': 'skin', 'chest': 'skin', 'head': 'skin'}
CLOTH_KEY = {1: 'jersey', 2: 'shorts', 7: 'edge', 8: 'edge2'}

def faces_of(lens, flat):
    out, k = [], 0
    for n in lens: out.append(flat[k:k + n]); k += n
    return out

def pieces(path, dress):
    d = np.load(path); out = {}
    for layer in ('body', 'cloth'):
        v = d['rest'] if layer == 'body' else d['g_rest']; part = d['part'] if layer == 'body' else d['g_part']
        F = faces_of(d['lens'] if layer == 'body' else d['g_lens'], d['flat'] if layer == 'body' else d['g_flat'])
        bone, side = bones_of(v)
        for f in F:
            f = np.asarray(f)
            if layer == 'body' and np.all(np.isin(part[f], (1, 2, 7, 8))): continue   # under the cloth
            bs = bone[f]; vals, cnt = np.unique(bs, return_counts=True); bn = vals[cnt.argmax()]
            if bn == 'head': continue   # flower heads replace the head
            sd = side[f]; sdn = 1 if (sd >= 0).sum() * 2 >= len(sd) else -1
            if bn in ('sh', 'el', 'hand', 'hip', 'knee', 'ankle') and sdn < 0: continue   # the right limbs reuse the left
            pv = part[f]; pv_ = np.bincount(pv).argmax()
            key = CLOTH_KEY.get(int(pv_), 'jersey') if layer == 'cloth' else (SKIN_KEY[bn] if pv_ == 0 else BODY_KEY.get(int(pv_), 'skin'))
            out.setdefault((bn, key), []).append(f + (0 if layer == 'body' else 10 ** 7))
    V = {'body': d['rest'], 'cloth': d['g_rest']}
    return out, V

def build(name, faces, V, bone, ratio):
    allv = np.concatenate([V['body'], V['cloth']]); idx = np.unique(np.concatenate(faces)); remap = {}
    vb = np.where((idx >= 10 ** 7)[:, None], V['cloth'][np.clip(idx - 10 ** 7, 0, len(V['cloth']) - 1)], V['body'][np.clip(idx, 0, len(V['body']) - 1)])
    lut = {int(k): i for i, k in enumerate(idx)}
    me = bpy.data.meshes.new(name); bm = bmesh.new(); vs = [bm.verts.new(p) for p in vb]
    for f in faces:
        try: bm.faces.new([vs[lut[int(k)]] for k in f])
        except ValueError: pass
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if ratio < 1 and len(me.polygons) > 300:
        m = o.modifiers.new('d', 'DECIMATE'); m.ratio = max(ratio, 300 / len(me.polygons)); m.use_collapse_triangulate = True
    if name.endswith('cloth') or 'jersey' in name or 'shorts' in name or 'edge' in name:
        so = o.modifiers.new('t', 'SOLIDIFY'); so.thickness = 0.004; so.offset = 1; so.use_even_offset = False
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); m2 = ev.to_mesh(); m2.calc_loop_triangles()
    P = np.array([v.co[:] for v in m2.vertices], np.float32)
    N = np.array([v.normal[:] for v in m2.vertices], np.float32)
    I = np.array([t.vertices[:] for t in m2.loop_triangles], np.uint32).ravel()
    ev.to_mesh_clear(); bpy.data.objects.remove(o)
    J0, Rm, Js = PIV[bone]
    P = to_bone(P.astype(np.float64), bone).astype(np.float32); N = b2t((N @ Rm.T)).astype(np.float32)
    return P, N, I

bpy.ops.wm.read_factory_settings(use_empty=True)
J_ = dict(rig=RIG, scale=S, sets={}, heads=[])
blobs, off = [], [0]
def put(P, N, I, uv=None):
    q = 4.0 / 32767; rec = dict(v=len(P), i=len(I), ofs=[])
    arrs = [np.round(P / q).astype(np.int16), np.round(np.clip(N, -1, 1) * 127).astype(np.int8)]
    if uv is not None: arrs.append(np.round(np.clip(uv, 0, 1) * 65535).astype(np.uint16))
    arrs.append(I.astype(np.uint16 if len(P) < 65536 else np.uint32)); rec['i32'] = len(P) >= 65536
    for a in arrs:
        rec['ofs'].append(off[0]); b = a.tobytes(); blobs.append(b); off[0] += len(b); pad = (-off[0]) % 4; blobs.append(b'\0' * pad); off[0] += pad
    rec['q'] = q; return rec
for dress, f in (('jersey', 'pose_m_stand_jersey'), ('suit', 'pose_m_stand_suit')):
    pcs, V = pieces(os.path.join(WK, f + '.npz'), dress); lst = []
    for (bn, key), faces in sorted(pcs.items()):
        if len(faces) < 4: continue
        P, N, I = build(f'{dress}_{bn}_{key}', faces, V, bn, RATIO)
        lst.append(dict(bone=bn, key=key, **put(P, N, I))); print(dress, bn, key, len(I) // 3, flush=True)
    J_['sets'][dress] = lst

# flower heads from the cast, cut where build_garden.py cuts them, on the cast atlas
with bpy.data.libraries.load(os.path.join(WK, 'cast.blend')) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('cast_') and n.endswith('_stand')]
CAST = {o.name: o for o in dst.objects if o}
chars = json.load(open(os.path.join(OUT, 'crowd.json')))['chars']
for donor in ('cast_workgirl_stand', 'cast_cabbie_stand', 'cast_editor_stand', 'cast_rosemary_stand', 'cast_hustler_stand', 'cast_discoking_stand', 'cast_susan_stand'):
    if donor not in CAST: continue
    me = CAST[donor].data.copy(); bm_ = bmesh.new(); bm_.from_mesh(me); H = max(v.co.z for v in bm_.verts)
    cut = CAST[donor]['headpt'][2] + 0.01 if 'headpt' in CAST[donor] else H * 0.8
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if v.co.z < cut], context='VERTS')
    hp_ = CAST[donor].get('headpt', (0, 0, 0))
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if math.hypot(v.co.x - hp_[0], v.co.y - hp_[1]) > 0.32], context='VERTS')
    bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if not v.link_faces], context='VERTS')
    cx = sum(v.co.x for v in bm_.verts) / len(bm_.verts); cy = sum(v.co.y for v in bm_.verts) / len(bm_.verts)
    bmesh.ops.translate(bm_, vec=Vector((-cx, -cy, -cut)), verts=bm_.verts); bmesh.ops.triangulate(bm_, faces=bm_.faces)
    uvl = bm_.loops.layers.uv.active; ch = donor.split('_')[1]; k = chars.index(ch); c, r = k % 4, k // 4
    P, N, U, I, seen = [], [], [], [], {}
    for fc in bm_.faces:
        for lp in fc.loops:
            u = lp[uvl].uv; key_ = (lp.vert.index, round(u.x, 5), round(u.y, 5))
            if key_ not in seen:
                seen[key_] = len(P); P.append(lp.vert.co[:]); N.append(lp.vert.normal[:]); U.append(((u.x % 1 + c) / 4, 1 - (u.y % 1 + r) / 4))
            I.append(seen[key_])
    bm_.free()
    P = b2t(np.array(P)).astype(np.float32); N = b2t(np.array(N)).astype(np.float32)
    J_['heads'].append(dict(ch=ch, **put(P, N, np.array(I), np.array(U)))); print('head', ch, len(I) // 3)
open(os.path.join(OUT, 'bodies.bin'), 'wb').write(b''.join(blobs)); json.dump(J_, open(os.path.join(OUT, 'bodies.json'), 'w'))
print('WROTE', off[0] / 1e6, 'MB', {k: sum(p['i'] // 3 for p in v) for k, v in J_['sets'].items()})
