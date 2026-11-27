"""export_web_cast.py: the Cycles crowd (MLow's NEW YORKERS cast, frozen poses from work/cast.blend) for the walk.
  Blender -b --factory-startup --python blender/export_web_cast.py
Writes site/assets/cast/crowd.bin + crowd.json + atlas.jpg: every crowd variant build_garden.py uses (the ten characters
who sit cleanly in their nine seated poses, all fifteen standing), at two levels (hi as baked, lo decimated), one 2048
atlas of the fifteen 512 textures. Axes are three.js: y up, the figure faces +z (Blender -y). Quantized: positions int16
over a 4 m box, normals int8, uvs uint16, indices uint16 per geometry."""
import bpy, os, sys, json, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); WK = os.path.join(HERE, 'work')
OUT = os.path.join(ROOT, 'site', 'assets', 'cast'); os.makedirs(OUT, exist_ok=True)
LO = float(os.environ.get('CAST_LO', '0.11'))
SEATED_OK = ('cabbie', 'discoking', 'hustler', 'killer', 'tough', 'wiseguy', 'workgirl', 'writer', 'susan', 'bartender')

bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(os.path.join(WK, 'cast.blend')) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('cast_')]
CAST = {o.name: o for o in dst.objects if o}
names = sorted(n for n in CAST if (n.split('_')[1] in SEATED_OK and '_sit' in n) or n.endswith('_stand'))
chars = sorted({n.split('_')[1] for n in CAST})
# the atlas: fifteen 512 textures on a 4 x 4 grid
A = np.zeros((2048, 2048, 4), np.float32); A[..., 3] = 1
slot = {}
for k, ch in enumerate(chars):
    o = CAST[next(n for n in CAST if n.split('_')[1] == ch)]
    img = next(n.image for n in o.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
    if tuple(img.size) != (512, 512): img.scale(512, 512)
    px = np.array(img.pixels[:], np.float32).reshape(512, 512, 4)   # bottom row first
    r, c = divmod(k, 4); A[r * 512:(r + 1) * 512, c * 512:(c + 1) * 512] = px; slot[ch] = (c, r)
at = bpy.data.images.new('atlas', 2048, 2048); at.pixels.foreach_set(A.ravel()); at.file_format = 'JPEG'
at.filepath_raw = os.path.join(OUT, 'atlas.jpg'); sc = bpy.context.scene; sc.render.image_settings.quality = 88; at.save_render(os.path.join(OUT, 'atlas.jpg'))

def arrays(o):
    """triangulated, per corner split by uv, in three.js axes"""
    me = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    me.calc_loop_triangles(); uvl = me.uv_layers.active.data
    tris = np.zeros(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get('loops', tris)
    lv = np.zeros(len(me.loops), np.int64); me.loops.foreach_get('vertex_index', lv)
    co = np.zeros(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    uv = np.zeros(len(me.loops) * 2, np.float32); uvl.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    nl = np.zeros(len(me.loops) * 3, np.float32)
    try: me.corner_normals.foreach_get('vector', nl)
    except AttributeError: me.loops.foreach_get('normal', nl)
    nl = nl.reshape(-1, 3)
    # weld corners that share a vertex and a uv
    key = np.round(np.c_[lv[tris], uv[tris] * 4096]).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    corners = tris[first]
    P = co[lv[corners]]; N = nl[corners]; U = uv[corners]
    o.to_mesh_clear()
    P = np.c_[P[:, 0], P[:, 2], -P[:, 1]]; N = np.c_[N[:, 0], N[:, 2], -N[:, 1]]
    return P, N, U, inv.reshape(-1).astype(np.int64)

geo, blobs, off = [], [], 0
S = 4.0 / 32767
for n in names:
    ch, pose = n.split('_')[1], n.split('_', 2)[2]
    for lvl in ('hi', 'lo'):
        o = CAST[n].copy(); o.data = CAST[n].data.copy(); bpy.context.scene.collection.objects.link(o)
        T = 0.92 if '_sit' in n else 0.92
        o.data.transform(__import__('mathutils').Matrix.Scale(T, 4))
        if '_stand' in n: o.data.transform(__import__('mathutils').Matrix.Translation((0, -0.16 * 0.92, 0)))
        if lvl == 'lo':
            m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = LO; m.use_collapse_triangulate = True
        P, N, U, I = arrays(o)
        bpy.data.objects.remove(o)
        c, r = slot[ch]; U = np.c_[(U[:, 0] % 1.0 + c) / 4, (U[:, 1] % 1.0 + r) / 4]
        U = np.c_[U[:, 0], 1 - U[:, 1]]   # three.js flipY=false on a raw texture: v from the top
        nn = np.linalg.norm(N, axis=1, keepdims=True); N = N / np.maximum(nn, 1e-6)
        assert len(P) < 65536, (n, len(P))
        b = [np.round(P / S).astype(np.int16).tobytes(), np.round(N * 127).astype(np.int8).tobytes(),
             np.round(np.clip(U, 0, 1) * 65535).astype(np.uint16).tobytes(), I.astype(np.uint16).tobytes()]
        lens = [len(x) for x in b]
        ofs = []
        for x in b:
            ofs.append(off); blobs.append(x); off += len(x)
            pad = (-off) % 4; blobs.append(b'\0' * pad); off += pad
        geo.append(dict(name=n, ch=ch, pose=pose, lvl=lvl, v=len(P), i=len(I), ofs=ofs, ymax=float(P[:, 1].max())))
    print(n, geo[-2]['i'] // 3, geo[-1]['i'] // 3, flush=True)
open(os.path.join(OUT, 'crowd.bin'), 'wb').write(b''.join(blobs))
json.dump(dict(scale=S, geo=geo, chars=chars), open(os.path.join(OUT, 'crowd.json'), 'w'))
print('WROTE', len(geo), 'geometries', off / 1e6, 'MB')
