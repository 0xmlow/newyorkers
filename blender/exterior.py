"""exterior.py: the outside of THE GARDEN for Cycles, and Penn Station under it.
  import exterior; cams = exterior.build_exterior('qa')       # from build_garden.py or exterior_test.py
Everything lands in the collection 'exterior' (object and material names start with ext_). Returns {name: (loc, target, lens)}.

Plan in metres, same axes as build_garden.py: origin at the centre of the drum, +x east to Seventh Avenue, -y north to 33rd
Street, +y south to 31st Street, z up, the event floor z = 0, the Seventh Avenue sidewalk z = ZS = -13.72.
Street offsets are the art director's (astra_plan.md section B) with north turned to -y: Eighth Avenue x = -91, Seventh Avenue
x = +184, 33rd Street y = -83, 31st Street y = +83. Nothing is built inside r = 63.6 above z = -2 (the interior), except the
way in from Seventh Avenue: a glazed hall with four escalators from the street at x = 90 to the concourse at x = 68, |y| < 6.5.
The roof cap sits over the interior ceiling (z 35.2) from z = 36.5 up.
"""
import bpy, bmesh, math, os, random, glob
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, 'site', 'assets'); TEX = os.path.join(HERE, 'tex'); WK = os.path.join(HERE, 'work'); DL = os.path.join(HERE, 'dl')
ZS = -13.72                          # street
R_IN, R_OUT = 63.6, 64.8            # drum
Z_COP, Z_TOP = 34.6, 36.5           # coping band, top of the shell
X8, X7, Y33, Y31 = -91.0, 184.0, -83.0, 83.0
AVE_W, ST_W = 24.0, 18.0
SB = (X8 + AVE_W / 2, X7 - AVE_W / 2, Y33 + ST_W / 2, Y31 - ST_W / 2)     # the superblock's curb lines: -79, 172, -74, 74
RING_R0, RING_R1, RING_RC = 66.0, 71.0, 68.5                            # the walkway
HALL = dict(x1=89.0, w=21.0, top=4.3)                                    # the glazed hall between drum and Penn 2
P2 = dict(x0=89.0, x1=160.0, y=60.0, h=19.0, tx0=95.0, tx1=133.0, ty=56.0, th=125.0)   # Penn 2 base and tower
FONT_SANS = os.path.expanduser('~/Library/Fonts/Archivo.ttf')
FONT_HELV = '/System/Library/Fonts/Helvetica.ttc'
WALL_UPLIGHT_W = 1600.0     # Blender watts; see the report: Astra's 40 to 80 W read as nothing against this sky
STREET_AREA_W = 3500.0
EXPOSURE = 0.3              # the view exposure these values were tuned at (AgX Medium High Contrast)
K3000, K3500, K4000 = (1.0, 0.71, 0.42), (1.0, 0.78, 0.55), (1.0, 0.86, 0.70)

_C = {}
AVOID = []
RNG = random.Random(26)


def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ---------------------------------------------------------------- scene helpers
def coll(name, parent=None):
    if name in _C: return _C[name]
    c = bpy.data.collections.new(name); (parent or _C['root']).children.link(c); _C[name] = c; return c


def link(o, c):
    c.objects.link(o); return o


def mesh_obj(name, verts, faces, mat=None, c=None, uv=None, smooth=False, mats=None, mat_idx=None):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uv is not None:
        lay = me.uv_layers.new(name='UVMap'); lv = np.zeros(len(me.loops), int); me.loops.foreach_get('vertex_index', lv)
        lay.data.foreach_set('uv', np.asarray(uv, float)[lv].ravel())
    if smooth: me.shade_smooth()
    for m in (mats or ([mat] if mat else [])): me.materials.append(m)
    if mat_idx is not None: me.polygons.foreach_set('material_index', np.asarray(mat_idx, int))
    me.validate(); o = bpy.data.objects.new(name, me)
    return link(o, c or _C['root'])


def box(name, size, loc, mat, c, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    if mat: me.materials.append(mat)
    return link(o, c)


def boxx(name, x0, x1, y0, y1, z0, z1, mat, c):
    return box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat, c)


def cyl(name, r, h, loc, mat, c, rot=(0, 0, 0), verts=16, r2=None, smooth=True):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth: me.shade_smooth()
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    if mat: me.materials.append(mat)
    return link(o, c)


class Batch:
    """many boxes or cylinders in one mesh: cheap to build, cheap to render"""
    def __init__(s): s.v, s.f, s.mi = [], [], []

    def box(s, cx, cy, cz, sx, sy, sz, yaw=0.0, m=0, pitch=0.0):
        b = len(s.v); ca, sa = math.cos(yaw), math.sin(yaw); cp, sp = math.cos(pitch), math.sin(pitch)
        for dx, dy, dz in ((-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)):
            x, y, z = dx * sx / 2, dy * sy / 2, dz * sz / 2
            x, z = x * cp - z * sp, x * sp + z * cp                     # pitch about local y
            s.v.append((cx + x * ca - y * sa, cy + x * sa + y * ca, cz + z))
        s.f += [(b, b + 3, b + 2, b + 1), (b + 4, b + 5, b + 6, b + 7), (b, b + 1, b + 5, b + 4), (b + 1, b + 2, b + 6, b + 5), (b + 2, b + 3, b + 7, b + 6), (b + 3, b, b + 4, b + 7)]
        s.mi += [m] * 6

    def cyl(s, cx, cy, z0, z1, r, n=10, m=0, r1=None):
        b = len(s.v); r1 = r if r1 is None else r1
        for i in range(n):
            a = i / n * math.tau; s.v += [(cx + r * math.cos(a), cy + r * math.sin(a), z0), (cx + r1 * math.cos(a), cy + r1 * math.sin(a), z1)]
        for i in range(n):
            j = (i + 1) % n; s.f.append((b + 2 * i, b + 2 * j, b + 2 * j + 1, b + 2 * i + 1)); s.mi.append(m)
        s.f.append(tuple(b + 2 * i + 1 for i in range(n))); s.mi.append(m)

    def obj(s, name, mats, c, smooth=False):
        if not s.v: return None
        return mesh_obj(name, s.v, s.f, c=c, mats=mats, mat_idx=s.mi, smooth=smooth)


def rects_minus(x0, x1, y0, y1, holes):
    """the rectangle split into cells that avoid the holes (axis aligned)"""
    xs = sorted({x0, x1} | {h[i] for h in holes for i in (0, 1) if x0 < h[i] < x1}); ys = sorted({y0, y1} | {h[i] for h in holes for i in (2, 3) if y0 < h[i] < y1})
    out = []
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            cx, cy = (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2
            if any(h[0] < cx < h[1] and h[2] < cy < h[3] for h in holes): continue
            out.append((xs[i], xs[i + 1], ys[j], ys[j + 1]))
    return out


def slab(name, rects, z, mat, c, thick=0.0):
    v, f = [], []
    for (a, b, cc, d) in rects:
        k = len(v); v += [(a, cc, z), (b, cc, z), (b, d, z), (a, d, z)]; f.append((k, k + 1, k + 2, k + 3))
        if thick:
            k2 = len(v); v += [(a, cc, z - thick), (b, cc, z - thick), (b, d, z - thick), (a, d, z - thick)]
            for (p, q) in ((0, 1), (1, 2), (2, 3), (3, 0)): f.append((k + q, k + p, k2 + p, k2 + q))
    return mesh_obj(name, v, f, mat, c)


def text_obj(name, body, size, loc, rot, mat, c, font=None, align='CENTER', valign='CENTER', extrude=0.0, offset=0.0, spacing=1.0):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.align_x = align; cu.align_y = valign; cu.extrude = extrude; cu.offset = offset
    cu.space_character = spacing
    f = font or FONT_SANS
    if os.path.exists(f): cu.font = bpy.data.fonts.load(f, check_existing=True)
    o = bpy.data.objects.new(name, cu); o.location = loc; o.rotation_euler = rot
    if mat: cu.materials.append(mat)
    return link(o, c)


def face_rot(nx, ny):
    """Euler that stands a text or an image plane up facing (nx, ny)"""
    return (math.pi / 2, 0, math.atan2(nx, -ny))


def plane_img(name, w, h, loc, normal, mat, c):
    o = mesh_obj(name, [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)], [(0, 1, 2, 3)], mat, c, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    o.location = loc; o.rotation_euler = (0, 0, math.atan2(normal[1], normal[0]) + math.pi / 2)
    # the quad faces -y in local space; turn it so its front looks along normal
    o.rotation_euler = (0, 0, math.atan2(normal[1], normal[0]) - math.pi / 2 + math.pi)
    return o


# ---------------------------------------------------------------- node helpers
class NB:
    def __init__(s, name):
        s.m = bpy.data.materials.new('ext_' + name); s.m.use_nodes = True; s.nt = s.m.node_tree; s.N = s.nt.nodes
        s.b = s.N['Principled BSDF']; s.out = s.N['Material Output']

    def n(s, t, **kw):
        nd = s.N.new(t)
        for k, v in kw.items(): setattr(nd, k, v)
        return nd

    def feed(s, sock, v):
        if isinstance(v, bpy.types.NodeSocket): s.nt.links.new(v, sock)
        elif v is not None:
            if hasattr(sock, 'default_value'):
                dv = sock.default_value
                if isinstance(v, (int, float)) and hasattr(dv, '__len__'): sock.default_value = [v] * len(dv)
                elif isinstance(v, (tuple, list)) and hasattr(dv, '__len__') and len(dv) == 4 and len(v) == 3: sock.default_value = (*v, 1)
                else: sock.default_value = v

    def math(s, op, a, b=None, c=None, clamp=False):
        nd = s.n('ShaderNodeMath', operation=op, use_clamp=clamp)
        for i, v in enumerate((a, b, c)): s.feed(nd.inputs[i], v)
        return nd.outputs[0]

    def vmath(s, op, a, b=None, sc=None):
        nd = s.n('ShaderNodeVectorMath', operation=op); s.feed(nd.inputs[0], a); s.feed(nd.inputs[1], b)
        if sc is not None: s.feed(nd.inputs['Scale'], sc)
        return nd.outputs['Value'] if op in ('LENGTH', 'DOT_PRODUCT', 'DISTANCE') else nd.outputs['Vector']

    def mix(s, f, a, b, kind='RGBA'):
        nd = s.n('ShaderNodeMix', data_type=kind); t = {'RGBA': 'RGBA', 'FLOAT': 'VALUE', 'VECTOR': 'VECTOR'}[kind]
        s.feed(nd.inputs['Factor'], f)
        s.feed(next(x for x in nd.inputs if x.name == 'A' and x.type == t), a); s.feed(next(x for x in nd.inputs if x.name == 'B' and x.type == t), b)
        return next(x for x in nd.outputs if x.type == t)

    def sep(s, v):
        nd = s.n('ShaderNodeSeparateXYZ'); s.feed(nd.inputs[0], v); return nd.outputs

    def comb(s, x, y, z):
        nd = s.n('ShaderNodeCombineXYZ'); s.feed(nd.inputs[0], x); s.feed(nd.inputs[1], y); s.feed(nd.inputs[2], z); return nd.outputs[0]

    def geo(s, k='Position'): return s.n('ShaderNodeNewGeometry').outputs[k]

    def white(s, v, out='Value'):
        nd = s.n('ShaderNodeTexWhiteNoise', noise_dimensions='3D'); s.feed(nd.inputs['Vector'], v); return nd.outputs[out]

    def noise(s, v, scale, detail=3.0, rough=0.55, out='Fac'):
        nd = s.n('ShaderNodeTexNoise'); s.feed(nd.inputs['Vector'], v); nd.inputs['Scale'].default_value = scale; nd.inputs['Detail'].default_value = detail
        nd.inputs['Roughness'].default_value = rough; return nd.outputs[out]

    def ramp(s, f, stops, interp='LINEAR'):
        nd = s.n('ShaderNodeValToRGB'); s.feed(nd.inputs[0], f); cr = nd.color_ramp; cr.interpolation = interp
        while len(cr.elements) < len(stops): cr.elements.new(0.5)
        for e, (p, col) in zip(cr.elements, stops):
            e.position = p; e.color = (*col, 1) if len(col) == 3 else col
        return nd.outputs['Color']

    def img(s, path, vec=None, cs='sRGB', ext='REPEAT', interp='Linear'):
        nd = s.n('ShaderNodeTexImage'); nd.image = bpy.data.images.load(path, check_existing=True); nd.image.colorspace_settings.name = cs
        nd.extension = ext; nd.interpolation = interp
        if vec is not None: s.feed(nd.inputs['Vector'], vec)
        return nd

    def bump(s, h, strength=0.3, dist=0.01, normal=None):
        nd = s.n('ShaderNodeBump'); s.feed(nd.inputs['Height'], h); nd.inputs['Strength'].default_value = strength; nd.inputs['Distance'].default_value = dist
        if normal is not None: s.feed(nd.inputs['Normal'], normal)
        return nd.outputs['Normal']

    def set(s, **kw):
        names = {'base': 'Base Color', 'rough': 'Roughness', 'metal': 'Metallic', 'emit': 'Emission Color', 'estr': 'Emission Strength', 'normal': 'Normal',
                 'trans': 'Transmission Weight', 'ior': 'IOR', 'alpha': 'Alpha', 'coat': 'Coat Weight', 'spec': 'Specular IOR Level'}
        for k, v in kw.items(): s.feed(s.b.inputs[names[k]], v)
        return s


def pbr(name, base, rough=0.5, metal=0.0, **kw):
    nb = NB(name); nb.set(base=srgb(base) if isinstance(base, str) else base, rough=rough, metal=metal, **kw); return nb.m


def emit_mat(name, color, strength):
    nb = NB(name); nb.set(base=(0, 0, 0), rough=0.4, emit=color, estr=strength); return nb.m


def img_emit_mat(name, path, strength, alpha=False, base_dark=0.0):
    """an image shown as light: screens, the LED strip, the logo (alpha cut out)"""
    nb = NB(name); t = nb.img(path, ext='CLIP' if alpha else 'REPEAT')
    nb.set(base=(base_dark,) * 3, rough=0.25, emit=t.outputs['Color'], estr=strength)
    if alpha:
        nb.feed(nb.b.inputs['Alpha'], t.outputs['Alpha'])
    return nb.m


def damp_layer(nb, P, color, rough, amount=0.27, scale=0.06, seed=0.0):
    """darker and glossier where the paving holds water: 20 to 30% of it, in drifts and round low spots"""
    q = nb.vmath('ADD', P, (seed, seed * 0.7, 0.0))
    n1 = nb.noise(q, scale, 4.0, 0.6)
    n2 = nb.noise(q, scale * 7.0, 2.0, 0.5)
    f = nb.math('ADD', nb.math('MULTIPLY', n1, 0.8), nb.math('MULTIPLY', n2, 0.2))
    t = 0.5 + (0.27 - amount) * 0.6 + 0.04
    d = nb.ramp(f, [(t, (0, 0, 0)), (t + 0.05, (1, 1, 1))])
    d = nb.sep(d)[0]
    col = nb.mix(nb.math('MULTIPLY', d, 0.45), color, (0, 0, 0))
    r = nb.mix(d, rough, 0.12, 'FLOAT')
    return col, r, d


def paving_mat(name, mx, my, cols, joint=0.006, rough=0.78, polar=None, jcol='#3d3e3b', damp=0.27, seed=0.0, bumpy=True, var=0.05):
    """rectangular modules in running bond from world position; polar=(R) lays them round the drum"""
    nb = NB(name); P = nb.geo()
    x, y, z = nb.sep(P)
    if polar:
        u = nb.math('MULTIPLY', nb.math('ARCTAN2', y, x), polar); v = nb.vmath('LENGTH', nb.comb(x, y, 0.0))
    else: u, v = x, y
    uu, vv = nb.math('DIVIDE', u, mx), nb.math('DIVIDE', v, my)
    row = nb.math('FLOOR', vv); off = nb.math('MULTIPLY', nb.math('FRACT', nb.math('MULTIPLY', row, 0.5)), 1.0)
    u2 = nb.math('ADD', uu, off); col = nb.math('FLOOR', u2)
    fu, fv = nb.math('FRACT', u2), nb.math('FRACT', vv)
    du = nb.math('MULTIPLY', nb.math('MINIMUM', fu, nb.math('SUBTRACT', 1.0, fu)), mx)
    dv = nb.math('MULTIPLY', nb.math('MINIMUM', fv, nb.math('SUBTRACT', 1.0, fv)), my)
    dmin = nb.math('MINIMUM', du, dv)
    jm = nb.math('LESS_THAN', dmin, joint)
    cell = nb.white(nb.comb(col, row, seed))
    stops = [(i / len(cols), srgb(c)) for i, c in enumerate(cols)]
    base = nb.ramp(cell, stops, 'CONSTANT')
    grain = nb.noise(P, 9.0, 6.0, 0.7)
    vary = nb.math('ADD', 1.0 - var, nb.math('MULTIPLY', nb.white(nb.comb(row, col, seed + 3.0)), 2 * var))
    base = nb.mix(0.15, base, nb.math('MULTIPLY', grain, vary), 'RGBA'); base = nb.vmath('MULTIPLY', base, nb.comb(vary, vary, vary))
    base = nb.mix(jm, base, srgb(jcol))
    rgh = nb.mix(jm, rough, 0.95, 'FLOAT')
    if damp:
        base, rgh, d = damp_layer(nb, P, base, rgh, damp, seed=seed)
    h = nb.math('ADD', nb.math('MULTIPLY', nb.math('SUBTRACT', 1.0, jm), 1.0), nb.math('MULTIPLY', grain, 0.3))
    nb.set(base=base, rough=rgh, normal=nb.bump(h, 0.25 if bumpy else 0.1, 0.004))
    return nb.m


def asphalt_mat(name, scale=5.0, damp=0.3, base='#30343A'):
    """asphalt on a neutral #30343A base, the scanned texture only for grain; repaired patches over about 10% of the roadway
    (darker, smoother, crisp edges), wear in the wheel paths, damp in the low spots. All masks, no displacement."""
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    uv = nb.comb(nb.math('DIVIDE', x, scale), nb.math('DIVIDE', y, scale), 0.0)
    c = nb.img(os.path.join(ASSETS, 'tex', 'asphalt_c.jpg'), uv).outputs['Color']
    n = nb.img(os.path.join(ASSETS, 'tex', 'asphalt_n.jpg'), uv, 'Non-Color').outputs['Color']
    nm = nb.n('ShaderNodeNormalMap'); nb.feed(nm.inputs['Color'], n); nm.inputs['Strength'].default_value = 0.5
    lum = nb.n('ShaderNodeRGBToBW'); nb.feed(lum.inputs[0], c)
    k = nb.math('ADD', 0.55, nb.math('MULTIPLY', lum.outputs[0], 1.6))
    col = nb.vmath('MULTIPLY', srgb(base), nb.comb(k, k, k))
    # patches: rectangles on a jittered 7 x 4.5 m grid, about 10% of cells
    q = nb.vmath('ADD', P, nb.vmath('MULTIPLY', nb.noise(P, 0.4, 2.0, 0.5, 'Color'), (1.2, 1.2, 0.0)))
    qx, qy, _ = nb.sep(q)
    cx, cy = nb.math('FLOOR', nb.math('DIVIDE', qx, 7.0)), nb.math('FLOOR', nb.math('DIVIDE', qy, 4.5))
    fx, fy = nb.math('FRACT', nb.math('DIVIDE', qx, 7.0)), nb.math('FRACT', nb.math('DIVIDE', qy, 4.5))
    r = nb.white(nb.comb(cx, cy, 5.0)); r2 = nb.white(nb.comb(cy, cx, 9.0))
    inx = nb.math('LESS_THAN', nb.math('ABSOLUTE', nb.math('SUBTRACT', fx, 0.5)), nb.math('ADD', 0.2, nb.math('MULTIPLY', r2, 0.28)))
    iny = nb.math('LESS_THAN', nb.math('ABSOLUTE', nb.math('SUBTRACT', fy, 0.5)), nb.math('ADD', 0.22, nb.math('MULTIPLY', r, 0.25)))
    patch = nb.math('MULTIPLY', nb.math('MULTIPLY', inx, iny), nb.math('GREATER_THAN', r, 0.86))
    col = nb.mix(patch, col, nb.vmath('MULTIPLY', col, (0.62, 0.63, 0.66)))
    wear = nb.noise(P, 0.15, 3.0, 0.5)
    col = nb.mix(nb.math('MULTIPLY', wear, 0.2), col, nb.vmath('MULTIPLY', col, (1.25, 1.25, 1.22)))
    rr = nb.math('SUBTRACT', 0.88, nb.math('MULTIPLY', patch, 0.1))
    if damp: col, rr, d = damp_layer(nb, P, col, rr, damp, scale=0.045, seed=11.0)
    nb.set(base=col, rough=rr, normal=nb.bump(nb.math('ADD', nb.math('MULTIPLY', patch, -0.3), 0.0), 0.06, 0.002, nm.outputs['Normal'])); return nb.m


def tactile_mat(name):
    """the 0.6 m warning strip: yellow, truncated domes on a 60 mm grid"""
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    fx, fy = nb.math('FRACT', nb.math('DIVIDE', x, 0.06)), nb.math('FRACT', nb.math('DIVIDE', y, 0.06))
    d = nb.vmath('LENGTH', nb.comb(nb.math('SUBTRACT', fx, 0.5), nb.math('SUBTRACT', fy, 0.5), 0.0))
    dome = nb.math('LESS_THAN', d, 0.3)
    grime = nb.noise(P, 1.5, 4.0, 0.6)
    col = nb.mix(nb.math('MULTIPLY', grime, 0.35), srgb('#d4a20a'), (0.2, 0.17, 0.08))
    nb.set(base=col, rough=0.55, normal=nb.bump(nb.math('SUBTRACT', 0.3, d), 0.5, 0.004)); return nb.m


def grate_mat(name):
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    slot = nb.math('LESS_THAN', nb.math('FRACT', nb.math('DIVIDE', nb.math('ADD', x, y), 0.05)), 0.45)
    col = nb.mix(slot, (0.035, 0.033, 0.03), (0.002, 0.002, 0.002))
    nb.set(base=col, rough=0.5, metal=nb.math('SUBTRACT', 1.0, slot), normal=nb.bump(nb.math('SUBTRACT', 1.0, slot), 0.6, 0.01)); return nb.m


def cover_mat(name):
    """a 0.6 m utility cover: cast iron with a diamond tread"""
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    a = nb.math('FRACT', nb.math('DIVIDE', nb.math('ADD', x, y), 0.04)); b = nb.math('FRACT', nb.math('DIVIDE', nb.math('SUBTRACT', x, y), 0.04))
    tread = nb.math('MULTIPLY', nb.math('LESS_THAN', nb.math('ABSOLUTE', nb.math('SUBTRACT', a, 0.5)), 0.25), nb.math('LESS_THAN', nb.math('ABSOLUTE', nb.math('SUBTRACT', b, 0.5)), 0.25))
    rust = nb.noise(P, 6.0, 3.0, 0.6)
    col = nb.mix(nb.math('MULTIPLY', rust, 0.5), (0.03, 0.03, 0.03), (0.07, 0.035, 0.018))
    nb.set(base=col, rough=nb.math('SUBTRACT', 0.7, nb.math('MULTIPLY', tread, 0.3)), metal=0.6, normal=nb.bump(tread, 0.5, 0.004)); return nb.m


def facade_mat(name, bay=1.6, floor=3.6, wx=0.6, wz=0.55, lit=0.2, glass=(0.012, 0.014, 0.018), curtain=False, ground=4.8, estr=3.0,
               warm=0.65, wall_rough=0.85, spandrel=None, shops=True, zbase=ZS, recess=0.12, frame=0.06, cards=0.2, glass_rough=0.16):
    """walls with windows from world position, with depth: u runs along each wall, rows of floors.
    Each window is a reveal and a glass plane recessed `recess` m behind the wall face, with a 0.05 to 0.08 m metal frame and
    a centre mullion (parallax from the view ray, so oblique views show the jambs). `cards` of the windows show an interior card
    0.8 to 1.5 m behind the glass; `lit` of them are lit, brighter near the ceiling. The wall colour comes from the object colour."""
    nb = NB(name); P = nb.geo(); Nn = nb.geo('Normal'); I = nb.geo('Incoming'); x, y, z = nb.sep(P); nx, ny, nz = nb.sep(Nn)
    ix, iy, iz = nb.sep(I)
    oi = nb.n('ShaderNodeObjectInfo'); seed = nb.math('MULTIPLY', oi.outputs['Random'], 137.0)
    anx, any_ = nb.math('ABSOLUTE', nx), nb.math('ABSOLUTE', ny)
    u = nb.math('ADD', nb.math('MULTIPLY', x, any_), nb.math('MULTIPLY', y, anx))
    zr = nb.math('SUBTRACT', z, zbase)
    i_n = nb.math('MAXIMUM', nb.math('ADD', nb.math('MULTIPLY', ix, nx), nb.math('MULTIPLY', iy, ny)), 0.08)
    i_u = nb.math('ADD', nb.math('MULTIPLY', ix, any_), nb.math('MULTIPLY', iy, anx))
    su, sz = nb.math('DIVIDE', i_u, i_n), nb.math('DIVIDE', iz, i_n)          # shift per metre of depth
    vert = nb.math('LESS_THAN', nb.math('ABSOLUTE', nz), 0.5)
    # per row parameters: the ground floor of a masonry building is shopfront
    if shops:
        g = nb.math('LESS_THAN', zr, ground)
        B = nb.mix(g, bay, bay * 3, 'FLOAT'); F = nb.mix(g, floor, ground, 'FLOAT')
        WX = nb.mix(g, wx, 0.9, 'FLOAT'); WZ = nb.mix(g, wz, (ground - 1.0) / ground, 'FLOAT'); CZ = nb.mix(g, 0.52, (0.35 + (ground - 0.65)) / 2 / ground, 'FLOAT')
    else:
        g = 0.0; B, F, WX, WZ, CZ = bay, floor, wx, wz, 0.52

    def frac_c(uu, zz):
        fu = nb.math('FRACT', nb.math('DIVIDE', uu, B)); fz = nb.math('FRACT', nb.math('DIVIDE', zz, F))
        du = nb.math('MULTIPLY', nb.math('ABSOLUTE', nb.math('SUBTRACT', fu, 0.5)), B)                 # metres from the window's centre line
        dz = nb.math('MULTIPLY', nb.math('ABSOLUTE', nb.math('SUBTRACT', fz, CZ)), F)
        hu, hz = nb.math('MULTIPLY', WX, nb.math('MULTIPLY', B, 0.5)), nb.math('MULTIPLY', WZ, nb.math('MULTIPLY', F, 0.5))
        inside = nb.math('MULTIPLY', nb.math('LESS_THAN', du, hu), nb.math('LESS_THAN', dz, hz))
        edge = nb.math('MINIMUM', nb.math('SUBTRACT', hu, du), nb.math('SUBTRACT', hz, dz))
        return inside, edge, du, nb.math('SUBTRACT', fz, nb.math('SUBTRACT', CZ, nb.math('MULTIPLY', WZ, 0.5)))
    open_s, _, _, _ = frac_c(u, zr)
    ug, zg = nb.math('SUBTRACT', u, nb.math('MULTIPLY', su, recess)), nb.math('SUBTRACT', zr, nb.math('MULTIPLY', sz, recess))
    open_g, edge_g, du_g, _ = frac_c(ug, zg)
    open_s = nb.math('MULTIPLY', open_s, vert)
    reveal = nb.math('MULTIPLY', open_s, nb.math('SUBTRACT', 1.0, open_g))          # looking at the jamb
    fr = nb.math('MAXIMUM', nb.math('LESS_THAN', edge_g, frame), nb.math('LESS_THAN', du_g, frame * 0.5))
    fr = nb.math('MULTIPLY', nb.math('MULTIPLY', open_s, open_g), fr)
    gl = nb.math('MULTIPLY', nb.math('MULTIPLY', open_s, open_g), nb.math('SUBTRACT', 1.0, fr))
    # cells (from the surface position, so a window keeps one identity)
    cellu, cellz = nb.math('FLOOR', nb.math('DIVIDE', u, B)), nb.math('FLOOR', nb.math('DIVIDE', zr, F))
    rnd = nb.white(nb.comb(cellu, cellz, seed)); rnd2 = nb.white(nb.comb(cellu, cellz, nb.math('ADD', seed, 7.0))); rnd3 = nb.white(nb.comb(cellz, cellu, nb.math('ADD', seed, 3.0)))
    lit_m = nb.math('GREATER_THAN', rnd, 1.0 - lit)
    if shops: lit_m = nb.mix(g, lit_m, nb.math('GREATER_THAN', rnd2, 0.25), 'FLOAT')
    has_card = nb.math('LESS_THAN', rnd3, cards)
    depth = nb.math('ADD', 0.8, nb.math('MULTIPLY', rnd2, 0.7))
    uc, zc = nb.math('SUBTRACT', u, nb.math('MULTIPLY', su, depth)), nb.math('SUBTRACT', zr, nb.math('MULTIPLY', sz, depth))
    _, _, _, zfrac_c = frac_c(uc, zc)
    room = nb.noise(nb.comb(nb.math('MULTIPLY', uc, 1.4), nb.math('MULTIPLY', zc, 2.2), seed), 1.0, 2.0, 0.5)
    card = nb.sep(nb.ramp(room, [(0.38, (0.25, 0.25, 0.25)), (0.62, (1.0, 1.0, 1.0))]))[0]
    blind = nb.math('ADD', 0.55, nb.math('MULTIPLY', nb.math('GREATER_THAN', nb.math('FRACT', nb.math('MULTIPLY', zg, 9.0)), 0.25), 0.45))
    inter = nb.mix(has_card, nb.mix(nb.math('GREATER_THAN', rnd2, 0.6), 1.0, blind, 'FLOAT'), card, 'FLOAT')
    grad = nb.math('ADD', 0.25, nb.math('MULTIPLY', nb.math('POWER', nb.math('MINIMUM', nb.math('MAXIMUM', zfrac_c, 0.0), 1.2), 1.6), 1.4))
    tint = nb.mix(nb.math('GREATER_THAN', rnd2, warm), (1.0, 0.62, 0.32), (0.72, 0.82, 1.0))
    tint = nb.mix(nb.math('GREATER_THAN', rnd3, 0.88), tint, (1.0, 0.92, 0.8))
    e = nb.math('MULTIPLY', nb.math('MULTIPLY', gl, lit_m), nb.math('MULTIPLY', nb.math('MULTIPLY', nb.math('ADD', 0.45, rnd2), grad), inter))
    # unlit windows with a card show a dim room through the glass
    glass_col = nb.mix(nb.math('MULTIPLY', has_card, nb.math('MULTIPLY', card, 0.6)), glass, (0.035, 0.034, 0.032))
    wall = nb.vmath('MULTIPLY', oi.outputs['Color'], nb.math('ADD', 0.88, nb.math('MULTIPLY', nb.noise(P, 0.35, 3.0), 0.24)))
    if spandrel is not None: wall = nb.mix(0.0, wall, spandrel)
    grime = nb.noise(nb.vmath('MULTIPLY', P, (1.0, 1.0, 0.12)), 1.2, 4.0, 0.6)
    wall = nb.mix(nb.math('MULTIPLY', grime, 0.3), wall, (0.03, 0.03, 0.03))
    wall = nb.mix(nb.math('MULTIPLY', reveal, 0.45), wall, (0.0, 0.0, 0.0))
    base = nb.mix(fr, nb.mix(gl, wall, glass_col), (0.035, 0.037, 0.04))
    rough = nb.mix(fr, nb.mix(gl, wall_rough, glass_rough, 'FLOAT'), 0.38, 'FLOAT')
    metal = nb.mix(fr, 0.0, 0.8, 'FLOAT')
    h = nb.math('SUBTRACT', 1.0, nb.math('MAXIMUM', gl, nb.math('MULTIPLY', reveal, 0.5)))
    nb.set(base=base, rough=rough, metal=metal, emit=tint, estr=nb.math('MULTIPLY', e, estr), normal=nb.bump(h, 0.35, 0.05))
    return nb.m


def stone_mat(name, base='#C8C0B0', bx=1.5, bz=0.75, rough=0.8):
    nb = NB(name); P = nb.geo(); Nn = nb.geo('Normal'); x, y, z = nb.sep(P); nx, ny, nz = nb.sep(Nn)
    u = nb.math('ADD', nb.math('MULTIPLY', x, nb.math('ABSOLUTE', ny)), nb.math('MULTIPLY', y, nb.math('ABSOLUTE', nx)))
    br = nb.n('ShaderNodeTexBrick'); nb.feed(br.inputs['Vector'], nb.comb(nb.math('DIVIDE', u, bx), nb.math('DIVIDE', z, bz), 0.0))
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.012; br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0
    c = srgb(base); br.inputs['Color1'].default_value = (*c, 1); br.inputs['Color2'].default_value = (*(v * 0.9 for v in c), 1); br.inputs['Mortar'].default_value = (*(v * 0.55 for v in c), 1)
    grime = nb.noise(nb.vmath('MULTIPLY', P, (1.0, 1.0, 0.1)), 1.5, 5.0, 0.6)
    col = nb.mix(nb.math('MULTIPLY', grime, 0.3), br.outputs['Color'], (0.05, 0.045, 0.04))
    nb.set(base=col, rough=rough, normal=nb.bump(br.outputs['Fac'], 0.4, 0.01)); return nb.m


def precast_mat(name, base='#BAAE9C'):
    """the drum's precast: per panel colour drift (attribute pv), runoff below the coping and joints, aggregate grain, splash at the foot"""
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    at = nb.n('ShaderNodeAttribute', attribute_name='pv'); pv = at.outputs['Fact'] if 'Fact' in at.outputs else at.outputs['Fac']
    c = srgb(base); kv = nb.math('ADD', 1.0, nb.math('MULTIPLY', pv, 0.06)); kw = nb.math('MULTIPLY', pv, 0.025)
    col = nb.vmath('MULTIPLY', c, nb.comb(nb.math('ADD', kv, kw), kv, nb.math('SUBTRACT', kv, kw)))   # warm and cool drift between panels
    streak = nb.noise(nb.vmath('MULTIPLY', P, (2.2, 2.2, 0.05)), 1.0, 6.0, 0.65)
    streak = nb.math('MULTIPLY', nb.sep(nb.ramp(streak, [(0.5, (0, 0, 0)), (0.72, (1, 1, 1))]))[0], 1.0)
    top = nb.math('POWER', nb.math('SUBTRACT', 1.0, nb.math('DIVIDE', nb.math('SUBTRACT', Z_COP, z), 14.0), clamp=True), 1.5, clamp=True)
    panel = nb.math('POWER', nb.math('SUBTRACT', 1.0, nb.math('FRACT', nb.math('DIVIDE', nb.math('SUBTRACT', z, ZS + 0.6), 3.9))), 6.0)
    stain = nb.math('MULTIPLY', streak, nb.math('ADD', nb.math('MULTIPLY', top, 0.09), nb.math('ADD', 0.03, nb.math('MULTIPLY', panel, 0.05))))
    foot = nb.math('MULTIPLY', nb.math('SUBTRACT', 1.0, nb.math('DIVIDE', nb.math('SUBTRACT', z, ZS), 1.6), clamp=True), 0.22)
    dark = nb.math('MINIMUM', nb.math('ADD', stain, foot), 0.35)
    col = nb.mix(dark, col, (0.06, 0.06, 0.055))
    agg = nb.noise(P, 45.0, 2.0, 0.5); pits = nb.noise(P, 140.0, 0.0, 0.5)
    col = nb.vmath('MULTIPLY', col, nb.math('ADD', 0.94, nb.math('MULTIPLY', agg, 0.12)))
    nb.set(base=col, rough=nb.math('ADD', nb.math('ADD', 0.74, nb.math('MULTIPLY', pv, 0.04)), nb.math('MULTIPLY', stain, 0.1)), normal=nb.bump(nb.math('ADD', agg, nb.math('MULTIPLY', pits, 0.5)), 0.12, 0.003))
    return nb.m


def grime_mat(name, base, rough=0.85, amt=0.35, scale=1.0):
    """concrete that has lived: blotches, vertical runs, a little sparkle of aggregate"""
    nb = NB(name); P = nb.geo(); c = srgb(base)
    blot = nb.noise(P, 0.4 * scale, 4.0, 0.6); runs = nb.noise(nb.vmath('MULTIPLY', P, (1.5, 1.5, 0.08)), 1.0 * scale, 5.0, 0.6); fine = nb.noise(P, 30.0 * scale, 2.0, 0.5)
    f = nb.math('ADD', nb.math('MULTIPLY', blot, 0.6), nb.math('MULTIPLY', runs, 0.4))
    k = nb.math('ADD', 1.0 - amt * 0.5, nb.math('MULTIPLY', f, amt))
    k = nb.math('MULTIPLY', k, nb.math('ADD', 0.93, nb.math('MULTIPLY', fine, 0.14)))
    nb.set(base=nb.vmath('MULTIPLY', c, nb.comb(k, k, k)), rough=nb.math('ADD', rough - 0.1, nb.math('MULTIPLY', blot, 0.2)), normal=nb.bump(fine, 0.15, 0.004))
    return nb.m


_ART = {}


def art_mat(path, strength=1.4):
    if path not in _ART: _ART[path] = img_emit_mat('art_' + os.path.basename(path)[:10], path, strength)
    return _ART[path]


def wood_tower_mat(name):
    nb = NB(name); P = nb.geo(); x, y, z = nb.sep(P)
    a = nb.math('ARCTAN2', y, x)
    w = nb.n('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X'); nb.feed(w.inputs['Vector'], nb.comb(nb.math('MULTIPLY', a, 12.0), z, 0.0))
    w.inputs['Scale'].default_value = 0.4; w.inputs['Distortion'].default_value = 0.2
    col = nb.ramp(nb.math('ADD', nb.math('MULTIPLY', w.outputs['Fac'], 0.5), nb.math('MULTIPLY', nb.noise(P, 3.0, 5.0), 0.5)),
                  [(0.2, srgb('#3b2f26')), (0.6, srgb('#6a5847')), (0.9, srgb('#8b7a66'))])
    nb.set(base=col, rough=0.9, normal=nb.bump(w.outputs['Fac'], 0.3, 0.01)); return nb.m


# ---------------------------------------------------------------- materials
def materials():
    M = {}
    M['precast'] = precast_mat('precast')
    M['recess'] = pbr('recess', '#77766F', 0.82)
    M['metal'] = pbr('metal', '#343A40', 0.36, 0.85)
    M['metal_lt'] = pbr('metal_lt', '#8A9096', 0.3, 0.9)
    M['steel'] = pbr('steel', '#b8bcc0', 0.28, 1.0)
    M['black'] = pbr('black', '#0d0e10', 0.45, 0.3)
    M['granite'] = grime_mat('granite', '#2a2928', 0.6, 0.3)
    M['glass'] = pbr('glass', (0.92, 0.95, 0.97), 0.035, trans=1.0, ior=1.45)
    M['glass_dark'] = pbr('glass_dark', (0.02, 0.025, 0.03), 0.04, 0.0, spec=0.8)
    M['roof'] = grime_mat('roof', '#85847f', 0.85, 0.25)
    M['walk'] = paving_mat('walk', 1.2, 0.6, ['#858681', '#6E716F', '#A7A79F'], joint=0.002, polar=RING_RC, seed=1.0)
    M['plaza'] = paving_mat('plaza', 1.2, 0.6, ['#7f807b', '#757774', '#8f8f89'], joint=0.002, seed=2.0)
    M['sidewalk'] = paving_mat('sidewalk', 1.52, 1.52, ['#777C80', '#73787c', '#7c8084'], joint=0.002, jcol='#45484b', rough=0.78, seed=3.0, var=0.07)
    M['curb'] = grime_mat('curb', '#A9AAA6', 0.72, 0.25)
    M['cladding'] = pbr('cladding', '#A6ADB3', 0.42, 0.6)
    M['conc_floor'] = paving_mat('conc_floor', 0.6, 0.6, ['#8c877e', '#857f76', '#918b82'], joint=0.0015, jcol='#55524c', rough=0.3, damp=0, seed=9.0, var=0.04)
    M['tactile'] = tactile_mat('tactile')
    M['conduit'] = pbr('conduit', '#4a4d50', 0.5, 0.7)
    M['train_door'] = pbr('train_door', '#8d9297', 0.32, 0.9)
    M['grate'] = grate_mat('grate')
    M['cover'] = cover_mat('cover')
    M['asphalt'] = asphalt_mat('asphalt')
    M['paint_w'] = pbr('paint_w', (0.75, 0.75, 0.72), 0.55)
    M['paint_y'] = pbr('paint_y', (0.8, 0.55, 0.05), 0.55)
    M['blue'] = pbr('blue', '#2962FF', 0.3, emit=srgb('#2962FF'), estr=1.6)
    M['led_white'] = emit_mat('led_white', (1, 1, 1), 18.0)
    M['downlight'] = emit_mat('downlight', K3500, 40.0)
    M['tube'] = emit_mat('tube', K4000, 22.0)
    M['lamp3000'] = emit_mat('lamp3000', K3000, 60.0)
    M['lamp4000'] = emit_mat('lamp4000', K4000, 40.0)
    M['lobby_ceiling'] = emit_mat('lobby_ceiling', K3500, 1.6)
    M['shop'] = emit_mat('shop', (1.0, 0.74, 0.48), 0.3)
    M['tile'] = paving_mat('tile', 0.3, 0.15, ['#d9d6cc', '#cfcabf', '#dcd8cd'], joint=0.003, jcol='#8d8a83', rough=0.35, damp=0, bumpy=False, seed=4.0)
    M['terrazzo'] = paving_mat('terrazzo', 1.2, 1.2, ['#8f897e', '#857f74', '#968f84'], joint=0.004, jcol='#4f4b45', rough=0.22, damp=0, seed=5.0)
    M['conc'] = grime_mat('conc', '#77746d', 0.88, 0.35)
    M['conc_dark'] = grime_mat('conc_dark', '#34322f', 0.9, 0.45)
    M['ballast'] = grime_mat('ballast', '#24221f', 0.95, 0.5, scale=3.0)
    M['platform'] = paving_mat('platform', 2.4, 1.2, ['#8a877f', '#827f77', '#8e8b83'], joint=0.008, jcol='#4a4844', rough=0.7, damp=0, seed=8.0, var=0.1)
    M['rail'] = pbr('rail', '#55504a', 0.35, 1.0)
    M['tie'] = pbr('tie', '#2c2723', 0.9)
    M['yellow'] = pbr('yellow', '#d9a400', 0.6)
    M['ceiling_tile'] = pbr('ceiling_tile', '#b9b6ae', 0.85)
    M['column'] = pbr('column', '#5b6168', 0.5, 0.4)
    M['wall_bldg'] = facade_mat('bldg', estr=0.24)
    M['curtain'] = facade_mat('curtain', bay=1.52, floor=4.0, wx=0.92, wz=0.8, lit=0.2, glass=(0.03, 0.034, 0.038), curtain=True, estr=0.1, warm=0.35, wall_rough=0.42, shops=False, recess=0.06, frame=0.05)
    M['curtain_p2'] = facade_mat('curtain_p2', bay=1.52, floor=4.0, wx=0.9, wz=0.74, lit=0.22, glass=(0.03, 0.034, 0.038), curtain=True, estr=0.1, warm=0.45, wall_rough=0.42, shops=False, recess=0.06, frame=0.05)
    M['storefront'] = facade_mat('storefront', bay=4.5, floor=7.0, wx=0.86, wz=0.8, lit=0.7, glass=(0.02, 0.02, 0.02), estr=0.14, warm=0.8, shops=False, wall_rough=0.42, recess=0.15, frame=0.07)
    M['stone'] = stone_mat('stone')
    M['stone_win'] = facade_mat('stone_win', bay=5.3, floor=9.0, wx=0.45, wz=0.62, lit=0.8, estr=0.3, warm=0.9, shops=False)
    M['wood'] = wood_tower_mat('wood')
    M['tower_steel'] = pbr('tower_steel', '#2b2a28', 0.6, 0.6)
    M['sign_dark'] = pbr('sign_dark', '#121314', 0.4, 0.2)
    M['sign_white'] = emit_mat('sign_white', (1, 1, 1), 6.0)
    M['sign_txt'] = emit_mat('sign_txt', (1, 1, 1), 3.0)
    M['bullet_red'] = pbr('bullet_red', '#EE352E', 0.4, emit=srgb('#EE352E'), estr=1.2)
    M['bullet_blue'] = pbr('bullet_blue', '#0039A6', 0.4, emit=srgb('#0039A6'), estr=1.6)
    M['globe_green'] = emit_mat('globe_green', srgb('#2fb34a'), 25.0)
    M['amber'] = emit_mat('amber', (1.0, 0.55, 0.08), 8.0)
    M['board_txt'] = emit_mat('board_txt', (0.95, 0.95, 0.9), 6.0)
    M['red_lamp'] = emit_mat('red_lamp', (1.0, 0.05, 0.02), 40.0)
    M['green_lamp'] = emit_mat('green_lamp', (0.1, 1.0, 0.6), 30.0)
    M['tail'] = emit_mat('tail', (1.0, 0.04, 0.02), 25.0)
    M['head'] = emit_mat('head', (1.0, 0.95, 0.85), 60.0)
    M['bin'] = pbr('bin', '#1f3a2a', 0.55, 0.4)
    M['wood_bench'] = pbr('wood_bench', '#5a4130', 0.7)
    M['cart'] = pbr('cart', '#c9ccd0', 0.25, 1.0)
    M['umbrella'] = pbr('umbrella', '#1d4fa8', 0.7)
    M['bus'] = pbr('bus', '#d9dcdf', 0.3, 0.3, coat=0.6)
    M['bus_win'] = pbr('bus_win', (0.02, 0.02, 0.025), 0.05, emit=K4000, estr=0.8)
    M['train'] = pbr('train', '#a9adb2', 0.3, 0.9)
    M['train_win'] = pbr('train_win', (0.02, 0.02, 0.025), 0.05, emit=K4000, estr=0.18)
    return M


# ---------------------------------------------------------------- 1. the drum
OPENINGS = [   # (angle, half width m, z0, z1, kind)
    (0.0, 6.5, -0.6, 4.0, 'hall'),
    (math.pi, 4.2, ZS, ZS + 5.6, 'service'),
    (math.radians(-118), 3.0, ZS, ZS + 3.6, 'door'),
    (math.radians(118), 3.0, ZS, ZS + 3.6, 'door'),
    (math.radians(-152), 2.0, ZS, ZS + 3.4, 'service'),
    (math.radians(152), 3.0, ZS, ZS + 3.6, 'door'),
    (math.radians(-62), 2.0, ZS, ZS + 3.4, 'service'),
    (math.radians(62), 2.4, ZS, ZS + 3.4, 'door'),
]


def in_hall(a, r=R_OUT):
    return math.cos(a) > 0 and abs(math.sin(a) * r) < HALL['w'] + 0.3


def build_drum(M, c):
    # 320 modules of 1.27 m, one rib each; 0.025 m vertical joints, 0.018 m horizontal joints every 3.9 m
    N = 320; pitch = math.tau / N; jw = 0.025; jh = 0.018
    w = pitch * R_OUT - jw
    prof = [(-w / 2, 0.0), (-w / 2 + 0.03, 0.06), (-0.3, 0.08), (-0.21, 0.38), (0.21, 0.38), (0.3, 0.08), (w / 2 - 0.03, 0.06), (w / 2, 0.0)]
    tiers = np.arange(ZS + 0.6, Z_COP - 0.01, 3.9).tolist() + [Z_COP]
    v, f, pv = [], [], []
    rnd = random.Random(7)
    lintels = Batch()
    for i in range(N):
        a = (i + 0.5) * pitch; ca, sa = math.cos(a), math.sin(a)
        z_floor = ZS + 0.6
        for (ao, hw, z0, z1, kind) in OPENINGS:
            d = abs(math.atan2(math.sin(a - ao), math.cos(a - ao))) * R_OUT
            if d < hw + 0.3: z_floor = max(z_floor, z1 + 0.45)
        if in_hall(a): z_floor = max(z_floor, HALL['top'] + 0.5)
        for t in range(len(tiers) - 1):
            z0, z1 = tiers[t], tiers[t + 1] - jh
            if z1 <= z_floor: continue
            z0 = max(z0, z_floor)
            b = len(v); P = len(prof); val = rnd.uniform(-1, 1)
            for (tt, nn) in prof:
                rr = R_OUT + nn; px, py = rr * ca - tt * sa, rr * sa + tt * ca
                v += [(px, py, z0), (px, py, z1)]
            for k in range(P - 1):
                f.append((b + 2 * k, b + 2 * k + 2, b + 2 * k + 3, b + 2 * k + 1)); pv.append(val)
            f.append(tuple(b + 2 * k + 1 for k in range(P))); pv.append(val)
            f.append(tuple(b + 2 * k for k in reversed(range(P)))); pv.append(val)
    mods = mesh_obj('ext_drum_modules', v, f, M['precast'], c)
    at = mods.data.attributes.new('pv', 'FLOAT', 'FACE'); at.data.foreach_set('value', np.asarray(pv, float))
    # the backing wall (the recess colour shows in the joints), cut at the openings
    S = 720; zs = sorted({ZS, Z_TOP} | {z for o in OPENINGS for z in (o[2], o[3])} | {HALL['top'] + 0.5} | set(np.linspace(ZS, Z_TOP, 12).tolist()))
    v, f = [], []
    for j, z in enumerate(zs):
        for i in range(S): a = i / S * math.tau; v.append((R_OUT * math.cos(a), R_OUT * math.sin(a), z))
    for j in range(len(zs) - 1):
        zc = (zs[j] + zs[j + 1]) / 2
        for i in range(S):
            a = (i + 0.5) / S * math.tau; cut = False
            for (ao, hw, z0, z1, kind) in OPENINGS:
                d = abs(math.atan2(math.sin(a - ao), math.cos(a - ao))) * R_OUT
                if d < hw and z0 < zc < z1: cut = True
            if not cut: f.append((j * S + i, j * S + (i + 1) % S, (j + 1) * S + (i + 1) % S, (j + 1) * S + i))
    mesh_obj('ext_drum_wall', v, f, M['recess'], c)
    # plinth: dark granite at the foot, coping band, metal flashing, the shallow roof
    def ring(name, r0, r1, z0, z1, mat, skip=True, seg=512):
        v, f = [], []
        for i in range(seg + 1):
            a = i / seg * math.tau; ca, sa = math.cos(a), math.sin(a)
            v += [(r0 * ca, r0 * sa, z0), (r1 * ca, r1 * sa, z0), (r1 * ca, r1 * sa, z1), (r0 * ca, r0 * sa, z1)]
        for i in range(seg):
            a = (i + 0.5) / seg * math.tau
            if skip and (any(abs(math.atan2(math.sin(a - o[0]), math.cos(a - o[0]))) * R_OUT < o[1] + 0.3 and o[2] < z1 and o[3] > z0 for o in OPENINGS) or (in_hall(a) and z0 < HALL['top'])): continue
            b, n = 4 * i, 4 * i + 4
            f += [(b + 1, n + 1, n + 2, b + 2), (b + 2, n + 2, n + 3, b + 3), (b, b + 3, n + 3, n)]
        return mesh_obj(name, v, f, mat, c)
    ring('ext_plinth', R_OUT - 0.05, R_OUT + 0.34, ZS, ZS + 0.6, M['granite'])
    ring('ext_coping', R_OUT - 0.05, R_OUT + 0.4, Z_COP, Z_TOP - 0.35, M['precast'], skip=False)
    ring('ext_coping_recess', R_OUT - 0.05, R_OUT + 0.08, Z_COP - 0.5, Z_COP, M['recess'], skip=False)
    ring('ext_parapet_cap', R_OUT - 0.4, R_OUT + 0.52, Z_TOP - 0.35, Z_TOP, M['cladding'], skip=False)
    ring('ext_cap_drip', R_OUT + 0.44, R_OUT + 0.52, Z_TOP - 0.45, Z_TOP - 0.35, M['metal'], skip=False)
    ring('ext_string', R_OUT - 0.05, R_OUT + 0.3, ZS + 8.9, ZS + 9.3, M['precast'], skip=True)
    # roof cap: a shallow dish over the interior ceiling, membrane grey, from z 36.5 at the rim to 38.6 at the centre
    RS, MM = 24, 256; v, f = [(0, 0, Z_TOP + 2.1)], []
    for j in range(1, RS + 1):
        r = (R_OUT + 0.45) * j / RS
        for i in range(MM): a = i / MM * math.tau; v.append((r * math.cos(a), r * math.sin(a), Z_TOP + 2.1 * (1 - (r / (R_OUT + 0.45)) ** 2)))
    for i in range(MM): f.append((0, 1 + i, 1 + (i + 1) % MM))
    for j in range(RS - 1):
        for i in range(MM):
            a0 = 1 + j * MM; a1 = 1 + (j + 1) * MM
            f.append((a0 + i, a1 + i, a1 + (i + 1) % MM, a0 + (i + 1) % MM))
    mesh_obj('ext_roof', v, f, M['roof'], c)
    ru = Batch(); rr = random.Random(3)
    for k in range(14):
        a = rr.uniform(0, math.tau); r = rr.uniform(30, 56); zz = Z_TOP + 2.1 * (1 - (r / 65.25) ** 2)
        sx, sy = rr.uniform(3, 7), rr.uniform(2.5, 5); ru.box(r * math.cos(a), r * math.sin(a), zz + 1.1, sx, sy, 2.2, a)
    ru.obj('ext_roof_units', [M['metal_lt']], c)
    # openings: reveal frames, lintels, recesses behind (outside r 63.6 or below z -2 only)
    fr = Batch(); rec = Batch()
    for (ao, hw, z0, z1, kind) in OPENINGS:
        if kind == 'hall': continue
        ca, sa = math.cos(ao), math.sin(ao); yaw = ao
        for s in (-1, 1):
            px, py = (R_OUT + 0.15) * ca - s * (hw + 0.12) * sa, (R_OUT + 0.15) * sa + s * (hw + 0.12) * ca
            fr.box(px, py, (z0 + z1) / 2, 0.5, 0.24, z1 - z0, yaw)
        fr.box((R_OUT + 0.2) * ca, (R_OUT + 0.2) * sa, z1 + 0.22, 0.55, 2 * hw + 0.48, 0.44, yaw)
        # the recess: floor, back and sides 6 m deep, dark for service, lit for doors
        if kind == 'service':
            for zz in np.arange(z0 + (z1 - z0) * 0.45, z1, 0.18):
                fr.box((R_OUT - 0.25) * ca, (R_OUT - 0.25) * sa, zz, 0.06, 2 * hw, 0.16, yaw)
        rx = R_OUT - 3.0
        rec.box(rx * ca, rx * sa, z1 + 0.1, 6.2, 2 * hw + 0.2, 0.2, yaw)
        rec.box((R_OUT - 6.0) * ca, (R_OUT - 6.0) * sa, (z0 + z1) / 2, 0.2, 2 * hw, z1 - z0, yaw, m=1 if kind == 'door' else 0)
        for s in (-1, 1): rec.box(rx * ca - s * hw * sa, rx * sa + s * hw * ca, (z0 + z1) / 2, 6.0, 0.2, z1 - z0, yaw)
        if kind == 'door':
            g = Batch()
            for k in range(4):
                t = -hw + (k + 0.5) * 2 * hw / 4
                g.box((R_OUT - 0.4) * ca - t * sa, (R_OUT - 0.4) * sa + t * ca, z0 + 1.35, 0.03, 2 * hw / 4 - 0.12, 2.7, yaw)
            g.obj('ext_drum_doors', [M['glass']], c)
            lt = bpy.data.lights.new('ext_door_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 2 * hw, 3.0; lt.energy = 900; lt.color = K3500
            o = bpy.data.objects.new('ext_door_light', lt); o.location = ((R_OUT - 3.0) * ca, (R_OUT - 3.0) * sa, z1 - 0.15); link(o, c)
            # a small canopy over the door with a blue edge: MLow's route
            fr.box((R_OUT + 1.3) * ca, (R_OUT + 1.3) * sa, z1 + 0.6, 2.6, 2 * hw + 1.2, 0.25, yaw)
            fr.box((R_OUT + 2.62) * ca, (R_OUT + 2.62) * sa, z1 + 0.6, 0.05, 2 * hw + 1.2, 0.12, yaw, m=1)
    fr.obj('ext_reveals', [M['metal'], M['blue']], c)
    # grazing uplights at the foot of the drum, one every fourth module: the ribs read at night
    ul = Batch()
    for i in range(0, N, 5):
        a = (i + 0.5) * pitch
        if in_hall(a, R_OUT + 1) or any(abs(math.atan2(math.sin(a - o[0]), math.cos(a - o[0]))) * R_OUT < o[1] + 1.0 for o in OPENINGS): continue
        r = R_OUT + 0.75; x, y = r * math.cos(a), r * math.sin(a)
        ul.box(x, y, ZS + 0.66, 0.3, 0.5, 0.12, a)
        lt = bpy.data.lights.new('ext_uplight', 'SPOT'); lt.energy = WALL_UPLIGHT_W; lt.color = K3000; lt.spot_size = math.radians(30); lt.spot_blend = 0.5; lt.shadow_soft_size = 0.05
        o = bpy.data.objects.new('ext_uplight', lt); o.location = (x, y, ZS + 0.75)
        o.rotation_euler = Vector((-math.cos(a) * 0.12, -math.sin(a) * 0.12, 1.0)).to_track_quat('-Z', 'Y').to_euler(); link(o, c)
    ul.obj('ext_uplight_cans', [M['metal']], c)
    rec.obj('ext_recesses', [M['conc_dark'], M['lobby_ceiling']], c)


# ---------------------------------------------------------------- 2. ground: superblock, walkway, streets
def stair_holes():
    """station stairs (axis aligned footprints): (x0, x1, y0, y1, descend direction (dx, dy), kind, bullets)"""
    return [
        (-77.4, -73.4, -67.0, -58.0, (0, 1), 'open', 'ACE'),      # northwest, Eighth Avenue and 33rd
        (-77.4, -73.4, 58.0, 67.0, (0, -1), 'open', 'ACE'),       # southwest, Eighth Avenue and 31st
        (147.5, 156.5, -67.6, -63.6, (-1, 0), 'house', '123'),    # northeast headhouse, Seventh Avenue and 33rd
        (147.5, 156.5, 63.6, 67.6, (-1, 0), 'house', '123'),      # southeast headhouse
        (163.0, 167.0, 34.5, 43.5, (0, 1), 'house', '123'),       # Seventh Avenue at 32nd, beside the arena's doors
    ]


def build_ground(M, c):
    holes = [h[:4] for h in stair_holes()]
    x0, x1, y0, y1 = SB
    slab('ext_superblock', rects_minus(x0, x1, y0, y1, holes), ZS, M['plaza'], c)
    # the walkway: a ring of 0.6 x 1.2 modules laid round the drum, broken where the hall comes out
    a_gap = math.asin((HALL['w'] + 1.0) / RING_R0)
    S = 900; v, f = [], []
    for i in range(S + 1):
        a = a_gap + (math.tau - 2 * a_gap) * i / S
        for r in (RING_R0 - 1.0, RING_R1): v.append((r * math.cos(a), r * math.sin(a), ZS + 0.02))
    for i in range(S): f.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    mesh_obj('ext_walk_paving', v, f, M['walk'], c)
    # the blue inlay round the walkway, interrupted at crossings and doors
    bl = Batch(); n = 1400
    for i in range(n):
        a = a_gap + (math.tau - 2 * a_gap) * (i + 0.5) / n
        if any(abs(math.atan2(math.sin(a - o[0]), math.cos(a - o[0]))) * RING_RC < o[1] + 1.5 for o in OPENINGS if o[4] != 'hall'): continue
        if (i // 70) % 1 == 0 and i % 70 in (0, 1): continue
        L = (math.tau - 2 * a_gap) * RING_RC / n
        bl.box(RING_RC * math.cos(a), RING_RC * math.sin(a), ZS + 0.024, 0.06, L * 1.01, 0.008, a)
    bl.obj('ext_blue_inlay', [M['blue']], c)
    # drain slots across the walkway every 30 degrees, and its kerb against the street paving
    dr = Batch()
    for k in range(12):
        a = (k + 0.5) / 12 * math.tau
        if in_hall(a, RING_RC): continue
        dr.box(RING_RC * math.cos(a), RING_RC * math.sin(a), ZS + 0.022, 5.0, 0.025, 0.006, a)
    dr.obj('ext_drains', [M['black']], c)
    # roads: one asphalt sheet round the superblock; sidewalks on the far sides; curbs
    big = (-700, 900, -700, 700)
    road_rects = rects_minus(*big, [SB])
    slab('ext_roads', road_rects, ZS - 0.15, M['asphalt'], c)
    sw = Batch()
    curb = Batch()
    # superblock curb
    cx0, cx1, cy0, cy1 = SB
    for (a, b, cc, d) in ((cx0, cx1, cy0 - 0.3, cy0), (cx0, cx1, cy1, cy1 + 0.3), (cx0 - 0.3, cx0, cy0, cy1), (cx1, cx1 + 0.3, cy0, cy1)):
        curb.box((a + b) / 2, (cc + d) / 2, ZS - 0.075, b - a, d - cc, 0.15)
    # far sidewalks: north of 33rd, south of 31st, west of Eighth, east of Seventh (6 m), cut at the avenues
    far = [(-400, X8 - 12, Y33 - 9 - 6, Y33 - 9), (X8 + 12, X7 - 12, Y33 - 9 - 6, Y33 - 9), (X7 + 12, 800, Y33 - 9 - 6, Y33 - 9),
           (-400, X8 - 12, Y31 + 9, Y31 + 15), (X8 + 12, X7 - 12, Y31 + 9, Y31 + 15), (X7 + 12, 800, Y31 + 9, Y31 + 15),
           (X8 - 19, X8 - 12, -400, Y33 - 9), (X8 - 19, X8 - 12, Y33 + 9, Y31 - 9), (X8 - 19, X8 - 12, Y31 + 9, 400),
           (X8 + 12, X8 + 18, -400, Y33 - 9), (X8 + 12, X8 + 18, Y31 + 9, 400),
           (X7 + 12, X7 + 18, -400, Y33 - 9), (X7 + 12, X7 + 18, Y33 + 9, Y31 - 9), (X7 + 12, X7 + 18, Y31 + 9, 400),
           (X7 - 18, X7 - 12, -400, Y33 - 9), (X7 - 18, X7 - 12, Y31 + 9, 400)]
    slab('ext_sidewalks', far, ZS, M['sidewalk'], c, thick=0.15)
    curb.obj('ext_curbs', [M['curb']], c)
    # lane markings: Seventh Avenue runs south (+y), Eighth north; dashed whites, a bus lane line, stop lines, ladder crosswalks
    mk = Batch()
    for xc in (X7, X8):
        for k in range(-2, 3):
            lx = xc + k * 3.6 + 1.8 if k < 2 else None
            if lx is None: continue
            for yy in np.arange(-400, 400, 9.0):
                if abs(yy - Y33) < 14 or abs(yy - Y31) < 14: continue
                mk.box(lx, yy, ZS - 0.145, 0.12, 3.0, 0.01)
        bus = xc - 12 + 3.4 if xc == X7 else xc + 12 - 3.4
        mk.box(bus, 0, ZS - 0.145, 0.2, 2 * (Y31 - 14), 0.01)
    for (xa, xb, yc) in ((X8, X7, Y33), (X8, X7, Y31)):
        for yy in (yc - 2.0, yc + 2.0): pass
    # crosswalks: across both avenues at both streets, and across both streets at both avenues
    for xc in (X7, X8):
        for yc in (Y33, Y31):
            for s in (-1, 1):   # across the avenue, on each side of the street
                yy = yc + s * 6.5
                for k in range(int(AVE_W / 1.2)):
                    mk.box(xc - AVE_W / 2 + 0.6 + k * 1.2, yy, ZS - 0.145, 0.6, 3.0, 0.01)
                mk.box(xc, yc + s * 8.6, ZS - 0.145, AVE_W, 0.4, 0.01)     # stop line
            for s in (-1, 1):   # across the street, on each side of the avenue
                xx = xc + s * 15.5
                for k in range(int(ST_W / 1.2)):
                    mk.box(xx, yc - ST_W / 2 + 0.6 + k * 1.2, ZS - 0.145, 3.0, 0.6, 0.01)
    mk.obj('ext_markings', [M['paint_w']], c)
    return holes


# ---------------------------------------------------------------- 3. the way in from Seventh Avenue
def build_entrance(M, c):
    xe0 = math.sqrt(R_OUT ** 2 - HALL['w'] ** 2)
    # the glazed hall: arc against the drum, glass sides, a roof slab and mullions
    arc = [(R_OUT * math.cos(a), R_OUT * math.sin(a)) for a in np.linspace(-math.asin(HALL['w'] / R_OUT), math.asin(HALL['w'] / R_OUT), 24)]
    poly = arc + [(HALL['x1'], HALL['w']), (HALL['x1'], -HALL['w'])]
    zt = ZS + 18.0 if False else HALL['top']
    v = [(x, y, zt) for x, y in poly] + [(x, y, zt + 0.6) for x, y in poly]; n = len(poly)
    f = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    mesh_obj('ext_hall_roof', v, f, M['metal'], c)
    v2 = [(x, y, ZS + 0.01) for x, y in poly]; mesh_obj('ext_hall_floor', v2, [tuple(range(n))], M['terrazzo'], c)
    gl = Batch(); mu = Batch()
    H = zt - ZS
    for s in (-1, 1):
        y = s * HALL['w']
        gl.box((xe0 + HALL['x1']) / 2, y, ZS + H / 2, HALL['x1'] - xe0, 0.03, H)
        for x in np.arange(xe0 + 0.2, HALL['x1'], 1.5): mu.box(x, y + s * 0.06, ZS + H / 2, 0.08, 0.14, H)
        for z in np.arange(ZS + 3.0, zt, 3.0): mu.box((xe0 + HALL['x1']) / 2, y + s * 0.06, z, HALL['x1'] - xe0, 0.14, 0.1)
        # doors at street level into the hall from the walkway
        mu.box(xe0 + 7, y + s * 0.3, ZS + 3.1, 6.0, 0.6, 0.2)
    gl.obj('ext_hall_glass', [M['glass']], c); mu.obj('ext_hall_mullions', [M['metal']], c)
    # the landing at concourse level and the escalators: street x = 90, concourse x = 68
    boxx('ext_landing', R_IN, 68.6, -6.5, 6.5, -0.5, 0.0, M['terrazzo'], c)
    boxx('ext_landing_edge', 63.6, 68.6, -6.6, 6.6, -1.6, -0.5, M['metal'], c)
    es = Batch(); L = math.hypot(90 - 68, -ZS); pitch = math.atan2(-ZS, 90 - 68)
    for yy in (-4.8, -1.6, 1.6, 4.8):
        cx, cz = 79.0, ZS / 2
        es.box(cx, yy, cz - 0.55, L + 2.0, 1.6, 1.1, 0.0, m=0, pitch=-pitch)                    # truss
        es.box(cx, yy, cz + 0.02, L + 2.0, 1.0, 0.04, 0.0, m=1, pitch=-pitch)                   # steps
        for dy in (-0.62, 0.62):
            es.box(cx, yy + dy, cz + 0.55, L + 1.5, 0.03, 1.0, 0.0, m=2, pitch=-pitch)          # glass balustrade
            es.box(cx, yy + dy, cz + 1.07, L + 1.5, 0.09, 0.07, 0.0, m=3, pitch=-pitch)         # handrail
            es.box(cx, yy + dy, cz + 0.06, L + 1.5, 0.04, 0.05, 0.0, m=4, pitch=-pitch)         # blue skirt light
    es.obj('ext_escalators', [M['metal'], M['metal_lt'], M['glass'], M['black'], M['blue']], c)
    for yy in (-3.2, 0.0, 3.2):
        lt = bpy.data.lights.new('ext_hall_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 18, 3; lt.energy = 4000; lt.color = K3500
        o = bpy.data.objects.new('ext_hall_light', lt); o.location = (78, yy * 4, zt - 0.3); link(o, c)
    dl = Batch()
    for x in np.arange(xe0 + 2, HALL['x1'], 3.0):
        for y in np.arange(-HALL['w'] + 2, HALL['w'], 3.0):
            if math.hypot(x, y) > R_OUT + 0.5: dl.cyl(x, y, zt - 0.03, zt, 0.18, 10)
    dl.obj('ext_hall_downlights', [M['downlight']], c)

    # Penn 2: the base (ground floor shops and the way in), the tower on it
    p = P2; b0 = ZS
    boxx('ext_p2_base_upper', p['x0'], p['x1'], -p['y'], p['y'], ZS + 7.0, ZS + p['h'], M['curtain_p2'], c)
    boxx('ext_p2_base_cap', p['x0'] - 0.3, p['x1'] + 0.3, -p['y'] - 0.3, p['y'] + 0.3, ZS + p['h'], ZS + p['h'] + 0.6, M['metal'], c)
    for s in (-1, 1):
        o = boxx('ext_p2_shops', p['x0'], p['x1'], s * 15 if s > 0 else -p['y'], p['y'] if s > 0 else -15, ZS, ZS + 7.0, M['storefront'], c)
        boxx('ext_p2_fill', p['x0'], 154.0, 10 if s > 0 else -15, 15 if s > 0 else -10, ZS, ZS + 7.0, M['metal'], c)
    t = boxx('ext_p2_tower', p['tx0'], p['tx1'], -p['ty'], p['ty'], ZS + p['h'], ZS + p['th'], M['curtain_p2'], c)
    boxx('ext_p2_crown', p['tx0'] + 0.5, p['tx1'] - 0.5, -p['ty'] + 0.5, p['ty'] - 0.5, ZS + p['th'], ZS + p['th'] + 6, M['metal'], c)
    for o in bpy.data.objects:
        if o.name.startswith('ext_p2'): o.color = (*srgb('#2b2f35'), 1)
    # the passage through the base: terrazzo, a lit ceiling, art on the walls
    boxx('ext_lobby_floor', p['x0'], 160.0, -15, 15, ZS - 0.2, ZS + 0.01, M['terrazzo'], c)
    boxx('ext_lobby_ceiling', p['x0'], 154.0, -10, 10, ZS + 6.4, ZS + 6.5, M['lobby_ceiling'], c)
    boxx('ext_recess_soffit', 154.0, 160.0, -15, 15, ZS + 6.9, ZS + 7.0, M['metal'], c)
    for s in (-1, 1): boxx('ext_lobby_wall', p['x0'], 154.0, s * 10.05 - 0.05, s * 10.05 + 0.05, ZS, ZS + 6.4, M['ceiling_tile'], c)
    arts = sorted(glob.glob(os.path.join(ASSETS, 'art', '*.jpg')))
    for k, x in enumerate(np.arange(100, 150, 7.0)):
        for s in (-1, 1):
            img = arts[(k * 2 + (s > 0)) % len(arts)]
            plane_img('ext_lobby_art', 4.4, 2.48, (x, s * 9.98, ZS + 3.0), (0, -s), img_emit_mat('lobby_art', img, 1.6), c)
    for x in (100, 115, 130, 145):
        lt = bpy.data.lights.new('ext_lobby_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 12, 16; lt.energy = 2500; lt.color = K3500
        o = bpy.data.objects.new('ext_lobby_light', lt); o.location = (x, 0, ZS + 6.3); link(o, c)
    # the doors: a glass line set back under the canopy. At pedestrian scale: four banks of 1.1 m leaves in 0.035 m frames,
    # pull handles at 1.0 m, a transom at 2.6 m and fixed glass above in 2.2 m lights; mat wells at the thresholds
    dg = Batch(); dm = Batch(); xg = 154.0
    dg.box(xg, 0, ZS + 3.5, 0.03, 30.0, 7.0)
    banks = (-10.5, -3.5, 3.5, 10.5); LEAF = 1.1
    for y in np.arange(-15, 15.01, 2.2): dm.box(xg + 0.02, y, ZS + 4.85, 0.1, 0.06, 4.3)          # mullions above the transom
    dm.box(xg + 0.02, 0, ZS + 2.65, 0.12, 30, 0.1)                                                  # transom
    for yb in banks:
        for k in range(-2, 2):
            y0 = yb + k * LEAF; yc = y0 + LEAF / 2
            for yy in (y0, y0 + LEAF): dm.box(xg + 0.03, yy, ZS + 1.3, 0.06, 0.035, 2.6)                # stiles
            dm.box(xg + 0.03, yc, ZS + 0.06, 0.06, LEAF, 0.12); dm.box(xg + 0.03, yc, ZS + 2.58, 0.06, LEAF, 0.05)
            hy = y0 + (LEAF - 0.12 if k < 0 else 0.12)
            for sx in (-1, 1):
                dm.cyl(xg + sx * 0.11, hy, ZS + 0.82, ZS + 1.18, 0.016, 8, m=1)                          # pull handle, centred at 1.0 m
                dm.box(xg + sx * 0.07, hy, ZS + 0.84, 0.08, 0.02, 0.02, m=1); dm.box(xg + sx * 0.07, hy, ZS + 1.16, 0.08, 0.02, 0.02, m=1)
        dm.box(xg + 1.2, yb, ZS + 0.004, 2.2, 4 * LEAF, 0.008, m=2)                                       # entrance mat outside
        dm.box(xg - 1.2, yb, ZS + 0.014, 2.2, 4 * LEAF, 0.008, m=2)                                       # and inside
    for yy in (-14.0, -7.0, 0.0, 7.0, 14.0): dm.box(xg + 0.03, yy, ZS + 1.3, 0.12, 0.6 if abs(yy) < 14.5 else 0.3, 2.6)   # piers between banks
    dg.obj('ext_doors_glass', [M['glass']], c); dm.obj('ext_doors_frames', [M['metal'], M['steel'], M['black']], c)
    # the canopy: metal soffit with downlights, an LED band round the edge, THE GARDEN standing on it
    boxx('ext_canopy', 154.0, 171.0, -15.5, 15.5, ZS + 7.5, ZS + 8.3, M['metal'], c)
    led = img_emit_mat('canopy_led', os.path.join(TEX, 'ribbon.jpg'), 3.0)
    plane_img('ext_canopy_led', 31.0, 0.45, (171.03, 0, ZS + 7.9), (1, 0), led, c)
    for s in (-1, 1): plane_img('ext_canopy_led_side', 17.0, 0.45, (162.5, s * 15.53, ZS + 7.9), (0, s), led, c)
    cd = Batch()
    for x in np.arange(156, 171, 2.5):
        for y in np.arange(-13.5, 14, 3.0): cd.cyl(x, y, ZS + 7.47, ZS + 7.5, 0.16, 10)
    cd.obj('ext_canopy_downlights', [M['downlight']], c)
    # 3500 K canopy fixtures: a pool over each door bank and over the curb line
    for x, ys in ((156.5, banks), (163.5, (-12.0, -4.0, 4.0, 12.0)), (169.5, (-10.0, 0.0, 10.0))):
        for y in ys:
            lt = bpy.data.lights.new('ext_canopy_spot', 'SPOT'); lt.energy = 1400; lt.color = K3500; lt.spot_size = math.radians(90); lt.spot_blend = 0.5; lt.shadow_soft_size = 0.15
            o = bpy.data.objects.new('ext_canopy_spot', lt); o.location = (x, y, ZS + 7.42); link(o, c)
    letters = emit_mat('letters', (1.0, 0.98, 0.95), 7.0)
    # the lockup standing on the canopy: MLow's stacked skyline logo, then THE GARDEN
    text_obj('ext_the_garden', 'THE GARDEN', 2.5, (170.6, 2.3, ZS + 8.3), face_rot(1, 0), letters, c, valign='BOTTOM', extrude=0.06, offset=0.012, spacing=1.08)
    boxx('ext_logo_plate', 170.35, 170.55, -13.9, -9.5, ZS + 8.3, ZS + 12.7, M['black'], c)
    plane_img('ext_logo', 4.2, 4.2, (170.57, -11.7, ZS + 10.5), (1, 0), img_emit_mat('logo', os.path.join(TEX, 'logo_white.png'), 4.0, alpha=True), c)
    # four art screens on the base over the canopy, clear of the lockup seen from across the avenue
    picks = [a for a in arts][::max(1, len(arts) // 4)][:4]
    for k, yc in enumerate((-9.0, -3.0, 3.0, 9.0)):
        boxx('ext_screen_frame', 160.0, 160.3, yc - 2.65, yc + 2.65, ZS + 14.45, ZS + 17.75, M['black'], c)
        plane_img('ext_art_screen', 5.0, 3.0, (160.32, yc, ZS + 16.1), (1, 0), img_emit_mat('screen%d' % k, picks[k % len(picks)], 1.8), c)


# ---------------------------------------------------------------- 4. Penn Station: entrances, signs, concourses, platforms
def arrow_mesh(c, mat, loc, normal, ang_deg, size):
    """a flat wayfinding arrow on a sign face: ang 0 points to the viewer's right, 90 up, 180 left"""
    nx, ny = normal; tx, ty = -ny, nx; a = math.radians(ang_deg)
    pts2 = [(-0.5, -0.09), (0.05, -0.09), (0.05, -0.27), (0.5, 0.0), (0.05, 0.27), (0.05, 0.09), (-0.5, 0.09)]
    v = []
    for (px, pz) in pts2:
        rx, rz = (px * math.cos(a) - pz * math.sin(a)) * size, (px * math.sin(a) + pz * math.cos(a)) * size
        v.append((loc[0] + tx * rx + nx * 0.003, loc[1] + ty * rx + ny * 0.003, loc[2] + rz))
    return mesh_obj('ext_arrow', v, [(0, 1, 5, 6), (2, 3, 4), (1, 2, 4, 5)], mat, c)


def penn_sign(M, c, loc, normal, bullets, w=3.6, name='ext_penn_sign'):
    """white Helvetica on dark, with the subway bullets, like the real ones"""
    nx, ny = normal; yaw = math.atan2(ny, nx); tx, ty = -ny, nx
    o = box(name, (0.12, w, 0.95), loc, M['sign_dark'], c, rot=(0, 0, yaw))
    px, py, pz = loc
    text_obj(name + '_t', 'Penn Station', 0.36, (px + nx * 0.07 - tx * (w / 2 - 0.18), py + ny * 0.07 - ty * (w / 2 - 0.18), pz + 0.08), face_rot(nx, ny), M['sign_txt'], c, font=FONT_HELV, align='LEFT')
    text_obj(name + '_s', 'Amtrak  LIRR  NJ Transit', 0.17, (px + nx * 0.07 - tx * (w / 2 - 0.18), py + ny * 0.07 - ty * (w / 2 - 0.18), pz - 0.28), face_rot(nx, ny), M['sign_txt'], c, font=FONT_HELV, align='LEFT')
    for k, ch in enumerate(bullets):
        off = w / 2 - 0.3 - (len(bullets) - 1 - k) * 0.44
        bx, by = px + nx * 0.07 + tx * off, py + ny * 0.07 + ty * off
        cy_ = cyl(name + '_b', 0.19, 0.02, (bx, by, pz + 0.17), M['bullet_red'] if ch in '123' else M['bullet_blue'], c, rot=(math.pi / 2, 0, yaw + math.pi / 2), verts=24)
        text_obj(name + '_bt', ch, 0.26, (bx + nx * 0.02, by + ny * 0.02, pz + 0.17), face_rot(nx, ny), M['sign_txt'], c, font=FONT_HELV, valign='CENTER')


def stair_pit(M, c, x0, x1, y0, y1, d, kind, bullets):
    """a flight from the street down 5 m to a lit passage: steps, tiled walls, rails, a headhouse or open railings"""
    dx, dy = d; along_x = dx != 0
    L = (x1 - x0) if along_x else (y1 - y0); W = (y1 - y0) if along_x else (x1 - x0)
    drop = 5.0; nst = 30; tr = L / nst; ri = drop / nst
    st = Batch(); wl = Batch()
    start = (x0 if dx > 0 else x1) if along_x else (y0 if dy > 0 else y1)
    sgn = dx if along_x else dy
    for k in range(nst):
        a = start + sgn * (k + 0.5) * tr; ztop = ZS - (k + 1) * ri
        h = ztop - (ZS - drop - 0.3)
        if along_x: st.box(a, (y0 + y1) / 2, ztop - h / 2, tr + 0.01, W, h)
        else: st.box((x0 + x1) / 2, a, ztop - h / 2, W, tr + 0.01, h)
    st.obj('ext_pit_steps', [M['conc']], c)
    # walls: two long sides down to the passage, plus the passage beyond the foot of the stair
    ext = 6.0
    if along_x:
        xa, xb = (x0, x1 + ext) if dx > 0 else (x0 - ext, x1)
        for yy in (y0, y1): wl.box((xa + xb) / 2, yy + (0.1 if yy == y0 else -0.1) * -1, ZS - drop / 2 - 0.5, xb - xa, 0.2, drop + 1.0)
        wl.box(xb if dx > 0 else xa, (y0 + y1) / 2, ZS - drop / 2 - 0.5, 0.2, W, drop + 1.0)
        wl.box((x1 + ext / 2) if dx > 0 else (x0 - ext / 2), (y0 + y1) / 2, ZS - drop - 0.3, ext, W, 0.2, m=1)
        wl.box((x1 + ext / 2) if dx > 0 else (x0 - ext / 2), (y0 + y1) / 2, ZS - 0.25, ext, W + 0.4, 0.2, m=1)
        lp = ((x1 + ext / 2) if dx > 0 else (x0 - ext / 2), (y0 + y1) / 2)
    else:
        ya, yb = (y0, y1 + ext) if dy > 0 else (y0 - ext, y1)
        for xx in (x0, x1): wl.box(xx, (ya + yb) / 2, ZS - drop / 2 - 0.5, 0.2, yb - ya, drop + 1.0)
        wl.box((x0 + x1) / 2, yb if dy > 0 else ya, ZS - drop / 2 - 0.5, W, 0.2, drop + 1.0)
        wl.box((x0 + x1) / 2, (y1 + ext / 2) if dy > 0 else (y0 - ext / 2), ZS - drop - 0.3, W, ext, 0.2, m=1)
        wl.box((x0 + x1) / 2, (y1 + ext / 2) if dy > 0 else (y0 - ext / 2), ZS - 0.25, W + 0.4, ext, 0.2, m=1)
        lp = ((x0 + x1) / 2, (y1 + ext / 2) if dy > 0 else (y0 - ext / 2))
    wl.obj('ext_pit_walls', [M['tile'], M['conc_dark']], c)
    lt = bpy.data.lights.new('ext_pit_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 3.0, 1.0; lt.energy = 900; lt.color = K4000
    o = bpy.data.objects.new('ext_pit_light', lt); o.location = (lp[0], lp[1], ZS - drop + 2.9); link(o, c)
    tb = Batch(); tb.box(lp[0], lp[1], ZS - drop + 3.05, 2.4 if along_x else 0.15, 0.15 if along_x else 2.4, 0.05); tb.obj('ext_pit_tube', [M['tube']], c)
    # handrails down the middle and the sides
    rl = Batch(); ang = math.atan2(drop, L)
    if along_x:
        for yy in (y0 + 0.25, y1 - 0.25, (y0 + y1) / 2):
            rl.box((x0 + x1) / 2, yy, ZS - drop / 2 + 0.95, L / math.cos(ang), 0.05, 0.05, 0.0, pitch=ang * (-dx))
    else:
        for xx in (x0 + 0.25, x1 - 0.25, (x0 + x1) / 2):
            rl.box(xx, (y0 + y1) / 2, ZS - drop / 2 + 0.95, L / math.cos(ang), 0.05, 0.05, math.pi / 2, pitch=ang * (-dy))
    if kind == 'open':
        # railings round three sides with the green globes at the mouth, a sign on the rail
        g = 1.1
        mouth_y = y0 if dy > 0 else y1
        far_y = y1 if dy > 0 else y0
        for xx in (x0 - 0.05, x1 + 0.05):
            rl.box(xx, (y0 + y1) / 2, ZS + g, 0.06, y1 - y0, 0.06)
            for yy in np.linspace(y0, y1, 7): rl.box(xx, yy, ZS + g / 2, 0.05, 0.05, g)
            for yy in np.linspace(y0, y1, 30): rl.box(xx, yy, ZS + g / 2, 0.02, 0.02, g)
        rl.box((x0 + x1) / 2, far_y, ZS + g, W + 0.1, 0.06, 0.06)
        for xx in np.linspace(x0, x1, 14): rl.box(xx, far_y, ZS + g / 2, 0.02, 0.02, g)
        for xx in (x0 - 0.05, x1 + 0.05):
            cyl('ext_globe_post', 0.05, 2.4, (xx, mouth_y, ZS + 1.2), M['metal'], c, verts=10)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(xx, mouth_y, ZS + 2.55)); gsp = bpy.context.active_object
            for cc in list(gsp.users_collection): cc.objects.unlink(gsp)
            c.objects.link(gsp); gsp.name = 'ext_globe'; gsp.data.materials.append(M['globe_green'])
        penn_sign(M, c, ((x0 + x1) / 2, far_y, ZS + 1.75), (0, -dy), bullets, w=3.8)
    else:
        # a glazed headhouse over the stair: steel frame, glass, a flat roof with the sign on its fascia
        pad = 1.6
        hx0, hx1, hy0, hy1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
        H = 4.6; gl = Batch(); fr = Batch()
        for (a, b, cc, d_) in ((hx0, hx1, hy0, hy0), (hx0, hx1, hy1, hy1), (hx0, hx0, hy0, hy1), (hx1, hx1, hy0, hy1)):
            mouth = (along_x and ((dx < 0 and a == hx1 and b == hx1) or (dx > 0 and a == hx0 and b == hx0))) or ((not along_x) and ((dy > 0 and cc == hy0 and d_ == hy0) or (dy < 0 and cc == hy1 and d_ == hy1)))
            if mouth: continue
            gl.box((a + b) / 2, (cc + d_) / 2, ZS + H / 2, max(b - a, 0.03), max(d_ - cc, 0.03), H)
        for xx in np.arange(hx0, hx1 + 0.01, 1.5):
            for yy in (hy0, hy1): fr.box(xx, yy, ZS + H / 2, 0.08, 0.08, H)
        for yy in np.arange(hy0, hy1 + 0.01, 1.5):
            for xx in (hx0, hx1): fr.box(xx, yy, ZS + H / 2, 0.08, 0.08, H)
        fr.box((hx0 + hx1) / 2, (hy0 + hy1) / 2, ZS + H + 0.25, hx1 - hx0 + 0.6, hy1 - hy0 + 0.6, 0.5)
        gl.obj('ext_headhouse_glass', [M['glass']], c); fr.obj('ext_headhouse_frame', [M['metal']], c)
        lt = bpy.data.lights.new('ext_headhouse_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = hx1 - hx0 - 1, hy1 - hy0 - 1; lt.energy = 1600; lt.color = K3500
        o = bpy.data.objects.new('ext_headhouse_light', lt); o.location = ((hx0 + hx1) / 2, (hy0 + hy1) / 2, ZS + H - 0.1); link(o, c)
        # the sign over the mouth
        if along_x:
            mx_ = hx1 + 0.37 if dx < 0 else hx0 - 0.37; penn_sign(M, c, (mx_, (hy0 + hy1) / 2, ZS + H + 0.25), (1 if dx < 0 else -1, 0), bullets, w=min(hy1 - hy0, 4.2))
        else:
            my_ = hy0 - 0.37 if dy > 0 else hy1 + 0.37; penn_sign(M, c, ((hx0 + hx1) / 2, my_, ZS + H + 0.25), (0, -1 if dy > 0 else 1), bullets, w=min(hx1 - hx0, 4.6))
    rl.obj('ext_pit_rails', [M['steel']], c)


def build_station(M, c):
    for (x0, x1, y0, y1, d, kind, bul) in stair_holes(): stair_pit(M, c, x0, x1, y0, y1, d, kind, bul)
    # upper concourse: z = street - 5, an east west hall 12 m wide from x -70 to 165; 3.3 m ceilings, a 4.7 m hall at x 0..48.
    # Walls carry retail and ticket recesses 0.3 m deep, lightboxes with MLow's art between them, and on the south side a
    # junction at x 32..40 where a stair drops to the lower concourse and the tracks.
    zf = ZS - 5.0; Y = 6.0; X0, X1 = -70.0, 165.0
    boxx('ext_conc_floor', X0, X1, -Y, Y, zf - 0.3, zf, M['conc_floor'], c)
    hz = lambda x: 4.7 if 0 <= x <= 48 else 3.3
    RECESS = [(-50.0, -44.0, -1, 'shop', 'COFFEE'), (-22.0, -16.0, 1, 'shop', 'NEWS'), (84.0, 92.0, -1, 'tickets', 'TICKETS'),
              (108.0, 114.0, 1, 'shop', 'BAGELS'), (132.0, 138.0, -1, 'shop', 'PHARMACY')]
    JX0, JX1 = 32.0, 40.0
    gap = lambda x, s: any(r[0] <= x <= r[1] and r[2] == s for r in RECESS) or (s == 1 and JX0 <= x <= JX1)
    cl = Batch(); wl = Batch(); tb = Batch(); col = Batch(); shop = Batch()
    for x in np.arange(X0, X1, 1.0):
        h = hz(x + 0.5); cl.box(x + 0.5, 0, zf + h + 0.15, 1.0, 2 * Y + 0.6, 0.3)
        for s_ in (-1, 1):
            if gap(x + 0.5, s_):   # keep a header over the opening
                wl.box(x + 0.5, s_ * (Y + 0.15), zf + 3.0 + (h - 3.0) / 2 + 0.1, 1.0, 0.3, h - 2.8)
            else: wl.box(x + 0.5, s_ * (Y + 0.15), zf + 2.6, 1.0, 0.3, 5.2 if h > 4 else 3.6)
    for x in (X0, X1): wl.box(x, 0, zf + 2.4, 0.3, 2 * Y, 4.8)
    for x in np.arange(X0 + 2, X1 - 2, 2.4):
        for y in (-3.6, 0.0, 3.6): tb.box(x, y, zf + hz(x) - 0.02, 1.2, 0.12, 0.04)
    for x in np.arange(-64.0, X1, 8.0):
        for y in (-3.0, 3.0):
            if 2 < x < 46: continue
            col.box(x, y, zf + hz(x) / 2, 0.8, 0.8, hz(x))
    # the recesses: back wall, jambs, a glazed front with a warm room behind, a name band at 100 mm lettering
    for (a, b, s_, kind, label) in RECESS:
        xm, w = (a + b) / 2, b - a
        shop.box(xm, s_ * (Y + 0.36), zf + 1.5, w, 0.06, 3.0, m=0)                         # the lit room behind
        for xx in (a, b): shop.box(xx, s_ * (Y + 0.15), zf + 1.5, 0.12, 0.3, 3.0, m=1)       # jambs
        shop.box(xm, s_ * (Y + 0.15), zf + 0.02, w, 0.3, 0.04, m=1)                          # threshold
        if kind == 'shop':
            shop.box(xm, s_ * (Y + 0.28), zf + 2.6, w, 0.04, 0.035, m=1)
            for xx in np.arange(a + 1.0, b - 0.5, 1.0): shop.box(xx, s_ * (Y + 0.28), zf + 1.3, 0.035, 0.04, 2.6, m=1)
            shop.box(xm, s_ * (Y + 0.29), zf + 1.3, w, 0.01, 2.6, m=2)
        else:
            for k, xx in enumerate(np.arange(a + 1.0, b - 0.5, 1.5)):
                shop.box(xx, s_ * (Y + 0.25), zf + 1.05, 1.3, 0.12, 1.05, m=1)               # counter
                shop.box(xx, s_ * (Y + 0.3), zf + 1.85, 1.2, 0.02, 0.9, m=2)                 # window
                text_obj('ext_ticket_no', str(k + 1), 0.09, (xx, s_ * (Y + 0.18), zf + 2.45), face_rot(0, -s_), M['sign_txt'], c, font=FONT_HELV)
        shop.box(xm, s_ * (Y - 0.03), zf + 3.0, w + 0.2, 0.06, 0.36, m=1)
        text_obj('ext_shop_name', label, 0.14, (xm, s_ * (Y - 0.07), zf + 3.03), face_rot(0, -s_), M['sign_txt'], c, font=FONT_HELV)
        if kind == 'tickets':
            text_obj('ext_shop_sub', 'Amtrak   LIRR   NJ Transit', 0.07, (xm, s_ * (Y - 0.07), zf + 2.88), face_rot(0, -s_), M['sign_txt'], c, font=FONT_HELV)
    # lightboxes with MLow's art between the recesses
    arts = sorted(glob.glob(os.path.join(ASSETS, 'art', '*.jpg'))); ai = 0
    for x in np.arange(X0 + 6, X1 - 4, 8.0):
        for s_ in (-1, 1):
            if gap(x - 2, s_) or gap(x + 2, s_) or gap(x, s_): continue
            shop.box(x, s_ * (Y - 0.05), zf + 1.75, 2.9, 0.1, 1.75, m=1)
            plane_img('ext_conc_lightbox', 2.6, 1.46, (x, s_ * (Y - 0.11), zf + 1.75), (0, -s_), art_mat(arts[ai % len(arts)]), c); ai += 1
    # the junction: a stair 4 m down to the lower concourse, side walls, a lit ceiling
    jz = ZS - 9.0
    jst = Batch()
    for k in range(24):
        ztop = zf - (k + 1) * 4.0 / 24; jst.box((JX0 + JX1) / 2, Y + 0.3 + k * 0.3 + 0.15, (ztop + jz - 0.3) / 2, JX1 - JX0, 0.3, ztop - jz + 0.3)
    jst.obj('ext_junction_stair', [M['conc_floor']], c)
    for xx in (JX0, JX1): boxx('ext_junction_wall', xx - 0.15, xx + 0.15, Y, Y + 8.5, jz, zf + 3.3, M['tile'], c)
    boxx('ext_junction_ceiling', JX0, JX1, Y, Y + 8.5, zf + 3.3, zf + 3.6, M['ceiling_tile'], c)
    for xx in (JX0 + 0.4, (JX0 + JX1) / 2, JX1 - 0.4): cyl('ext_junction_rail', 0.025, 8.6, (xx, Y + 3.9, (zf + jz) / 2 + 0.95), M['steel'], c, rot=(math.atan2(4.0, 7.2) - math.pi / 2, 0, 0), verts=8)
    tb.box((JX0 + JX1) / 2, Y + 4.0, zf + 3.28, 0.15, 6.0, 0.04)
    # the sign system: dark panels, white lettering, destination 100 mm caps (size 0.14), secondary 50 mm (0.07), arrows
    signs = [  # x, y, facing, lines, arrow (angle of the arrow in the sign plane, degrees; 0 = to the viewer's right)
        (36.5, 3.9, (1, 0), ('Tracks 5  6  7  8', 'Lower Level   Amtrak   NJ Transit'), 0),
        (36.5, -3.9, (1, 0), ('Eighth Avenue   Subway A C E', 'Moynihan Train Hall   Exit'), 90),
        (-8.0, 0.0, (1, 0), ('Eighth Avenue   Subway A C E', 'Moynihan Train Hall   Exit'), 90),
        (78.0, 0.0, (-1, 0), ('Tracks 5  6  7  8', 'Lower Level   Departures Board'), 90),
        (78.0, 0.0, (1, 0), ('Seventh Avenue   Exit', 'THE GARDEN   Subway 1 2 3'), 90),
        (128.0, 0.0, (-1, 0), ('Tickets   Tracks 5  6  7  8', 'Lower Level'), 90),
    ]
    for (sx, sy, nrm, lines, arrow) in signs:
        hzs = zf + 2.75; nx_, ny_ = nrm; tx, ty = -ny_, nx_; w = 3.4
        box('ext_wayfind', (0.1, w, 0.44), (sx, sy, hzs), M['sign_dark'], c, rot=(0, 0, math.atan2(ny_, nx_)))
        for dy in (-1.2, 1.2): cyl('ext_wayfind_rod', 0.012, zf + hz(sx) - hzs - 0.22, (sx + tx * dy, sy + ty * dy, (hzs + 0.22 + zf + hz(sx)) / 2), M['steel'], c, verts=6)
        ox, oy = sx + nx_ * 0.055, sy + ny_ * 0.055
        lx, ly = ox - tx * (w / 2 - 0.55), oy - ty * (w / 2 - 0.55)
        text_obj('ext_wayfind_t', lines[0], 0.14, (lx, ly, hzs + 0.05), face_rot(nx_, ny_), M['sign_txt'], c, font=FONT_HELV, align='LEFT')
        text_obj('ext_wayfind_s', lines[1], 0.07, (lx, ly, hzs - 0.13), face_rot(nx_, ny_), M['sign_txt'], c, font=FONT_HELV, align='LEFT')
        arrow_mesh(c, M['sign_txt'], (ox - tx * (w / 2 - 0.26), oy - ty * (w / 2 - 0.26), hzs), (nx_, ny_), arrow, 0.3)
    cl.obj('ext_conc_ceiling', [M['ceiling_tile']], c); wl.obj('ext_conc_walls', [M['tile']], c); tb.obj('ext_conc_tubes', [M['tube']], c)
    col.obj('ext_conc_columns', [M['column']], c); shop.obj('ext_conc_shops', [M['shop'], M['sign_dark'], M['glass_dark']], c)
    for x in np.arange(X0 + 10, X1, 20.0):
        lt = bpy.data.lights.new('ext_conc_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 18, 9; lt.energy = 1300; lt.color = K4000
        o = bpy.data.objects.new('ext_conc_light', lt); o.location = (x, 0, zf + hz(x) - 0.05); link(o, c)
    # the departure board hung across the tall hall, facing east
    bx = 24.0; bz = zf + 3.35
    boxx('ext_board', bx - 0.15, bx + 0.15, -5.0, 5.0, bz - 1.15, bz + 1.15, M['black'], c)
    for y in (-4, 4): cyl('ext_board_hanger', 0.03, 0.3, (bx, y, bz + 1.3), M['steel'], c, verts=6)
    text_obj('ext_board_head', 'DEPARTURES', 0.24, (bx + 0.17, -4.7, bz + 0.88), face_rot(1, 0), M['board_txt'], c, font=FONT_HELV, align='LEFT')
    text_obj('ext_board_head2', 'TRACK', 0.2, (bx + 0.17, 4.7, bz + 0.88), face_rot(1, 0), M['board_txt'], c, font=FONT_HELV, align='RIGHT')
    rows = [('6:12', 'NORTHEAST REGIONAL    BOSTON', '7'), ('6:15', 'LIRR    PORT WASHINGTON', '18'), ('6:19', 'NJ TRANSIT    TRENTON', '3'),
            ('6:24', 'ACELA    WASHINGTON', '12'), ('6:31', 'LIRR    BABYLON', '20'), ('6:38', 'NJ TRANSIT    LONG BRANCH', '5'),
            ('6:42', 'N3W YORKERS EXPRESS    1,111 STOPS', '11'), ('6:47', 'KEYSTONE    HARRISBURG', '9')]
    for i, (t, dst, tk) in enumerate(rows):
        zz = bz + 0.52 - i * 0.215; mat = M['amber'] if i % 2 == 0 else M['board_txt']
        text_obj('ext_board_t', t, 0.15, (bx + 0.17, -4.7, zz), face_rot(1, 0), mat, c, font=FONT_HELV, align='LEFT')
        text_obj('ext_board_d', dst, 0.15, (bx + 0.17, -3.6, zz), face_rot(1, 0), mat, c, font=FONT_HELV, align='LEFT')
        text_obj('ext_board_k', tk, 0.15, (bx + 0.17, 4.7, zz), face_rot(1, 0), mat, c, font=FONT_HELV, align='RIGHT')
    for x in (100.0, -40.0):
        penn_sign(M, c, (x, 0, zf + 2.6), (1, 0), '123ACE', w=4.4, name='ext_conc_sign')

    # lower concourse: z = street - 9, x -40..60, y 10..20, stairs down to the tracks through glass enclosures
    zl = ZS - 9.0
    boxx('ext_lconc_floor', -40, 60, 7, 18, zl - 0.3, zl, M['conc_floor'], c)
    boxx('ext_lconc_ceiling', -40, 60, 7, 18, zl + 3.2, zl + 3.5, M['ceiling_tile'], c)
    for y in (6.85, 18.15): boxx('ext_lconc_wall', -40, 60, y - 0.15, y + 0.15, zl, zl + 3.2, M['tile'], c)
    tb = Batch()
    for x in np.arange(-38, 60, 2.4): tb.box(x, 12.5, zl + 3.18, 1.2, 0.12, 0.04)
    tb.obj('ext_lconc_tubes', [M['tube']], c)

    # the platforms: z = street - 13, 110 m, four tracks, two islands; fluorescent strips; columns on the 8 m grid
    zp = ZS - 13.0; PX0, PX1 = -50.0, 60.0
    TR = [22.0, 34.6, 39.4, 52.0]; PL = [(24.3, 32.3), (41.7, 49.7)]; zr = zp - 1.25
    boxx('ext_trackbed', PX0 - 30, PX1 + 30, 19.0, 55.0, zr - 0.5, zr - 0.25, M['ballast'], c)
    boxx('ext_plat_ceiling', PX0 - 30, PX1 + 30, 19.0, 55.0, zp + 4.6, zp + 5.0, M['conc_dark'], c)
    for y in (18.8, 55.2): boxx('ext_plat_wall', PX0 - 30, PX1 + 30, y - 0.2, y + 0.2, zr - 0.5, zp + 4.6, M['conc_dark'], c)
    for x in (PX0 - 30, PX1 + 30): boxx('ext_plat_end', x - 0.2, x + 0.2, 19, 55, zr - 0.5, zp + 4.6, M['black'], c)
    pl = Batch(); tk = Batch(); tb = Batch(); col = Batch()
    for (ya, yb) in PL:
        pl.box((PX0 + PX1) / 2, (ya + yb) / 2, (zp + zr - 0.25) / 2, PX1 - PX0, yb - ya, zp - zr + 0.25, m=0)
        for ye in (ya + 0.3, yb - 0.3): pl.box((PX0 + PX1) / 2, ye, zp + 0.005, PX1 - PX0, 0.6, 0.01, m=1)
        for x in np.arange(PX0 + 2, PX1 - 1, 2.0):
            for yy in (ya + 2.0, yb - 2.0): tb.box(x, yy, zp + 4.55, 1.5, 0.12, 0.05)
        for x in np.arange(-48.0, PX1, 8.0): col.box(x, (ya + yb) / 2, zp + 2.3, 0.45, 0.45, 4.6)
    for x in np.arange(-48.0, PX1, 8.0): col.box(x, (TR[1] + TR[2]) / 2, (zr + zp + 4.6) / 2, 0.35, 0.35, zp + 4.6 - zr)
    for y in TR:   # standard gauge 1.435 m between rail heads (65 mm wide), sleepers at 0.60 m, ballast shoulders
        for sgn in (-1, 1):
            rx_ = y + sgn * (1.435 / 2 + 0.0325)
            tk.box((PX0 + PX1) / 2, rx_, zr - 0.085, PX1 - PX0 + 60, 0.065, 0.17, m=0)
            tk.box((PX0 + PX1) / 2, rx_, zr - 0.16, PX1 - PX0 + 60, 0.14, 0.02, m=0)
        for x in np.arange(PX0 - 30, PX1 + 30, 0.6): tk.box(x, y, zr - 0.23, 0.25, 2.6, 0.14, m=1)
        tk.box((PX0 + PX1) / 2, y + 1.9, zr - 0.15, PX1 - PX0 + 60, 0.08, 0.12, m=2)       # contact rail cover
    pl.obj('ext_platforms', [M['platform'], M['tactile']], c); tk.obj('ext_tracks', [M['rail'], M['tie'], M['tie']], c)
    tb.obj('ext_plat_tubes', [M['tube']], c); col.obj('ext_plat_columns', [M['column']], c)
    for (ya, yb) in PL:
        for x in np.arange(PX0 + 6, PX1, 12.0):
            lt = bpy.data.lights.new('ext_plat_light', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = 11, 6; lt.energy = 1400; lt.color = K4000
            o = bpy.data.objects.new('ext_plat_light', lt); o.location = (x, (ya + yb) / 2, zp + 4.45); link(o, c)
        # stairs up from each platform into a lit opening
        for x in (-7.6, 32.4):
            boxx('ext_plat_stair_slot', x + 4.4, x + 7.4, (ya + yb) / 2 - 1.3, (ya + yb) / 2 + 1.3, zp + 4.56, zp + 4.59, M['lobby_ceiling'], c)
            st = Batch()
            for k in range(24): st.box(x + k * 0.3, (ya + yb) / 2, zp + (k + 1) * 0.1875 / 2, 0.3, 2.6, (k + 1) * 0.1875)
            st.obj('ext_plat_stair', [M['conc']], c)
            for s in (-1, 1): boxx('ext_plat_stair_wall', x - 0.2, x + 7.4, (ya + yb) / 2 + s * 1.4 - 0.08, (ya + yb) / 2 + s * 1.4 + 0.08, zp, zp + 4.6, M['tile'], c)
            text_obj('ext_track_sign', 'Tracks %d  %d' % (5 + PL.index((ya, yb)) * 2, 6 + PL.index((ya, yb)) * 2), 0.26, (x - 0.3, (ya + yb) / 2, zp + 3.6), face_rot(-1, 0), M['sign_txt'], c, font=FONT_HELV)
            boxx('ext_track_sign_bg', x - 0.28, x - 0.2, (ya + yb) / 2 - 1.2, (ya + yb) / 2 + 1.2, zp + 3.35, zp + 3.85, M['sign_dark'], c)
    # cable conduits and trays along both trackside walls, track numbers stencilled on the walls, platform numbers on columns
    cd = Batch()
    for yw, sgn in ((19.0, 1), (55.0, -1)):
        for k, zz in enumerate((zp + 0.6, zp + 0.85, zp + 1.1, zp + 3.9)):
            cd.box((PX0 + PX1) / 2, yw + sgn * (0.09 + 0.02 * k), zz, PX1 - PX0 + 60, 0.07 + (0.08 if k == 3 else 0), 0.07 if k < 3 else 0.06, m=0)
        for x in np.arange(PX0 - 30, PX1 + 30, 3.0): cd.box(x, yw + sgn * 0.12, zp + 0.85, 0.05, 0.22, 0.7, m=1)
        for x in np.arange(PX0, PX1, 20.0): cd.box(x, yw + sgn * 0.05, zp + 2.2, 1.2, 0.04, 1.6, m=1)
    cd.obj('ext_conduits', [M['conduit'], M['metal']], c)
    for (ya, yb), nums in zip(PL, ((5, 6), (7, 8))):
        for x in np.arange(-48.0, PX1, 16.0):
            for side, num in ((-1, nums[0]), (1, nums[1])):
                yy = (ya + yb) / 2 + side * 0.235
                boxx('ext_plat_no_bg', x - 0.2, x + 0.2, yy - 0.005 if side > 0 else yy - 0.015, yy + 0.015 if side > 0 else yy + 0.005, zp + 2.2, zp + 2.75, M['sign_dark'], c)
                text_obj('ext_plat_no', str(num), 0.42, (x, yy + side * 0.02, zp + 2.48), face_rot(0, side), M['sign_txt'], c, font=FONT_HELV)
    for yw, sgn, tno in ((19.0, 1, 5), (55.0, -1, 8)):
        for x in np.arange(PX0 + 4, PX1, 24.0):
            boxx('ext_track_plate', x - 0.6, x + 0.6, yw + sgn * 0.01 - 0.01, yw + sgn * 0.01 + 0.01, zp + 3.0, zp + 3.6, M['sign_dark'], c)
            text_obj('ext_track_plate_t', 'TRACK %d' % tno, 0.18, (x, yw + sgn * 0.03, zp + 3.3), face_rot(0, sgn), M['sign_txt'], c, font=FONT_HELV)
    # a partial train standing on track 6: two and a half silver cars, window bands and 1.25 m doors

    trn = Batch()
    for k in range(3):
        x0 = -12.0 + k * 25.9; L = 25.4 if k < 2 else 25.4
        trn.box(x0 + L / 2, TR[1], zr + 2.35, L, 3.1, 3.7, m=0)
        trn.box(x0 + L / 2, TR[1] - 1.552, zr + 3.95, L, 0.01, 0.06, m=2)
        for x in np.arange(x0 + 2.2, x0 + L - 1.5, 1.9):
            if abs(x - (x0 + 4.0)) < 1.2 or abs(x - (x0 + L - 4.0)) < 1.2: continue
            trn.box(x, TR[1] - 1.56, zr + 2.95, 1.3, 0.03, 0.85, m=1)
        for xd in (x0 + 4.0, x0 + L - 4.0):
            for sgn in (-1, 1): trn.box(xd + sgn * 0.3125, TR[1] - 1.565, zr + 2.15, 0.6, 0.03, 2.0, m=3)
            trn.box(xd, TR[1] - 1.57, zr + 2.15, 0.02, 0.035, 2.0, m=2)
            for sgn in (-1, 1): trn.box(xd + sgn * 0.3125, TR[1] - 1.58, zr + 2.65, 0.4, 0.01, 0.55, m=1)
    trn.box(-12.15, TR[1], zr + 2.35, 0.25, 3.0, 3.6, m=0)                     # the cab end, same skin
    trn.box(-12.3, TR[1], zr + 2.9, 0.04, 2.2, 0.9, m=1)
    trn.obj('ext_train', [M['train'], M['train_win'], M['metal'], M['train_door']], c)


# ---------------------------------------------------------------- 5. the city round it
def water_tower(M, c, x, y, z, rr):
    r = rr.uniform(2.0, 2.9); h = rr.uniform(3.6, 5.0); leg = rr.uniform(3.0, 5.0)
    cyl('ext_wt_tank', r, h, (x, y, z + leg + h / 2), M['wood'], c, verts=28)
    cyl('ext_wt_roof', r + 0.15, r * 0.7, (x, y, z + leg + h + r * 0.35), M['tower_steel'], c, verts=28, r2=0.05)
    b = Batch()
    for i in range(6):
        a = i / 6 * math.tau; b.cyl(x + math.cos(a) * r * 0.8, y + math.sin(a) * r * 0.8, z, z + leg + 0.2, 0.09, 6)
    for k in range(3):
        b.cyl(x, y, z + leg - 0.1 - k * 0.0, z + leg + 0.0, r * 0.95, 20)
    for zz in np.linspace(z + leg + 0.4, z + leg + h - 0.3, 5):
        b.cyl(x, y, zz, zz + 0.06, r + 0.03, 28)
    b.obj('ext_wt_steel', [M['tower_steel']], c)


def building(M, c, name, x0, x1, y0, y1, h, color, rr, mat=None, tower=True, cornice=True):
    o = boxx(name, x0, x1, y0, y1, ZS, ZS + h, mat or M['wall_bldg'], c); o.color = (*srgb(color), 1)
    if cornice: boxx(name + '_cornice', x0 - 0.35, x1 + 0.35, y0 - 0.35, y1 + 0.35, ZS + h - 0.1, ZS + h + 0.7, M['conc'] if mat is None else M['metal'], c)
    rb = Batch(); w, d = x1 - x0, y1 - y0
    rb.box(x0 + w * rr.uniform(0.25, 0.75), y0 + d * rr.uniform(0.25, 0.75), ZS + h + 1.6, min(w, 8) * 0.6, min(d, 8) * 0.6, 3.2)
    for _ in range(rr.randint(1, 4)): rb.box(x0 + w * rr.uniform(0.15, 0.85), y0 + d * rr.uniform(0.15, 0.85), ZS + h + 0.7, rr.uniform(1, 3), rr.uniform(1, 3), 1.4)
    rb.obj(name + '_roofstuff', [M['conc']], c)
    if tower and h < 90 and rr.random() < 0.7:
        water_tower(M, c, x0 + w * rr.uniform(0.25, 0.75), y0 + d * rr.uniform(0.25, 0.75), ZS + h, rr)
    return o


MASONRY = ['#7a4a3a', '#8b5a44', '#9c8a74', '#b5a58c', '#6e5b4e', '#a08c7a', '#5f4a40', '#c2b49c', '#84776a', '#704036']


def build_context(M, c):
    rr = random.Random(41)
    # Penn 1: a tall tower north east, across 33rd
    boxx('ext_p1_base', 4, 66, -159, -101, ZS, ZS + 30, M['curtain'], c).color = (*srgb('#30343a'), 1)
    boxx('ext_p1_tower', 12, 58, -152, -108, ZS + 30, ZS + 228, M['curtain'], c).color = (*srgb('#2a2e33'), 1)
    boxx('ext_p1_crown', 14, 56, -150, -110, ZS + 228, ZS + 234, M['metal'], c)
    # Moynihan Train Hall in the Farley building: stone, a stair and a colonnade on Eighth Avenue, the skylit roof set back
    fx0, fx1, fy = -264.0, -110.0, 68.0
    boxx('ext_farley', fx0, fx1 - 8.0, -fy, fy, ZS, ZS + 27, M['stone_win'], c).color = (*srgb('#c8c0b0'), 1)
    for s in (-1, 1): boxx('ext_farley_pav', fx1 - 8.0, fx1, s * 50 if s > 0 else -fy, fy if s > 0 else -50, ZS, ZS + 27.5, M['stone'], c)
    st = Batch()
    for k in range(12): st.box(fx1 - 0.25 - k * 0.3 - 0.15, 0, ZS + (k + 1) * 0.25 / 2, 0.3 + k * 0.6 if False else 0.32, 100.0, (k + 1) * 0.25)
    st.box(fx1 - 6.0, 0, ZS + 1.5, 4.4, 100.0, 3.0)
    st.obj('ext_farley_steps', [M['stone']], c)
    cb = Batch()
    for y in np.linspace(-47, 47, 20): cb.cyl(fx1 - 5.6, y, ZS + 3.0, ZS + 19.0, 0.85, 20, r1=0.72)
    cb.obj('ext_farley_columns', [M['stone']], c)
    boxx('ext_farley_entab', fx1 - 7.2, fx1 - 4.0, -50, 50, ZS + 19.0, ZS + 27.0, M['stone'], c)
    boxx('ext_farley_cornice', fx1 - 7.4, fx1 - 3.6, -68.5, 68.5, ZS + 26.6, ZS + 27.6, M['stone'], c)
    sky = facade_mat('skylight', bay=2.0, floor=1.6, wx=0.9, wz=0.85, lit=0.95, glass=(0.05, 0.06, 0.07), estr=1.2, warm=0.0, shops=False)
    boxx('ext_farley_skylight', -225, -150, -32, 32, ZS + 27, ZS + 34, sky, c).color = (*srgb('#40454b'), 1)
    # parcels north of 33rd (low in the aerial's sight line east of Penn 1), south of 31st, east of Seventh, west of Eighth
    def row(xs, y0, y1, hmin, hmax, prefix):
        x = xs[0]
        while x < xs[1] - 6:
            w = min(rr.uniform(14, 35), xs[1] - x); h = rr.uniform(hmin, hmax)
            building(M, c, prefix, x, x + w - 0.4, y0, y1, h, rr.choice(MASONRY), rr); x += w
    row((-85, 0), -140, -98, 22, 70, 'ext_bn')
    row((70, 170), -140, -98, 16, 30, 'ext_bne')
    row((-85, 172), 98, 140, 22, 65, 'ext_bs')
    row((-85, 172), 155, 200, 25, 90, 'ext_bs2')
    for (y0, y1) in ((-150, -100), (-80, -30), (-25, 25), (30, 80), (100, 150)):
        y = y0
        while y < y1 - 6:
            d = min(rr.uniform(20, 45), y1 - y); h = rr.uniform(35, 160) if rr.random() < 0.6 else rr.uniform(20, 40)
            building(M, c, 'ext_be', 202, 202 + rr.uniform(30, 55), y, y + d - 0.4, h, rr.choice(MASONRY), rr, mat=M['curtain'] if h > 100 else None, tower=h < 60); y += d
    # far city: blocks out to 800 m, taller to the north east (Midtown), Hudson Yards west, the Empire State Building
    for k in range(260):
        a = rr.uniform(0, math.tau); r = rr.uniform(260, 850); x, y = r * math.cos(a), r * math.sin(a)
        if -300 < x < 260 and -200 < y < 220: continue
        mid = max(0.0, (x - 100) / 700) * max(0.0, (-y + 100) / 600)
        h = rr.uniform(18, 70) + rr.random() ** 3 * 160 * (0.5 + mid * 3)
        w, d = rr.uniform(20, 60), rr.uniform(20, 60)
        building(M, c, 'ext_far', x - w / 2, x + w / 2, y - d / 2, y + d / 2, h, rr.choice(MASONRY), rr, mat=M['curtain'] if h > 120 else None, tower=h < 50, cornice=h < 100)
    for (x, y, w, h) in ((-620, -210, 60, 390), (-540, -150, 55, 300), (-690, -120, 50, 330), (-580, -290, 45, 260)):
        boxx('ext_hy', x - w / 2, x + w / 2, y - w / 2, y + w / 2, ZS, ZS + h, M['curtain'], c).color = (*srgb('#2a3038'), 1)
    ex, ey = 560.0, -170.0
    for (w, z0, z1) in ((57, 0, 25), (45, 25, 260), (38, 260, 300), (26, 300, 320), (14, 320, 345)):
        boxx('ext_esb', ex - w / 2, ex + w / 2, ey - w * 0.7, ey + w * 0.7, ZS + z0, ZS + z1, M['wall_bldg'], c).color = (*srgb('#a59a88'), 1)
    cyl('ext_esb_mast', 3.0, 60, (ex, ey, ZS + 375), emit_mat('esb_top', (0.9, 0.95, 1.0), 12.0), c, verts=12, r2=0.4)
    # the corner service volumes on 33rd and 31st west of the drum (truck bays), low
    for s in (-1, 1):
        boxx('ext_service', -62, -40, s * 60 if s > 0 else -74, 74 if s > 0 else -60, ZS, ZS + 8.0, M['storefront'], c).color = (*srgb('#5d5a55'), 1)


# ---------------------------------------------------------------- 6. street furniture, light, vehicles
STREETLIGHTS = [(173.0, y, 1) for y in (-60, -20, 20, 60)] + [(195.0, y, -1) for y in (-60, -20, 20, 60)] + \
               [(-80.0, y, -1) for y in (-60, -20, 20, 60)] + [(-102.0, y, 1) for y in (-60, -20, 20, 60)] + \
               [(x, -75.0, 'n') for x in (-30, 40, 110)] + [(x, 75.0, 's') for x in (-30, 40, 110)] + [(x, -91.5, 's') for x in (10,)] + [(x, 91.5, 'n') for x in (75,)]


def streetlight(M, c, x, y, d, b):
    """a New York street light: grey pole, an arm over the roadway and a flat LED head 8.5 m up; a 4000 K area light
    0.25 x 0.6 m in the head, the size of the real optic, pointing down"""
    if d == 'n': dx, dy = 0, -1
    elif d == 's': dx, dy = 0, 1
    else: dx, dy = d, 0
    H = 8.5
    b.cyl(x, y, ZS, ZS + H, 0.11, 10, r1=0.08)
    b.cyl(x, y, ZS, ZS + 0.6, 0.2, 10, r1=0.14)
    arm = 2.6
    b.box(x + dx * arm / 2, y + dy * arm / 2, ZS + H + 0.05, arm if dx else 0.08, arm if dy else 0.08, 0.08)
    hx, hy = x + dx * (arm + 0.3), y + dy * (arm + 0.3)
    b.box(hx, hy, ZS + H, 0.8 if dx else 0.36, 0.36 if dx else 0.8, 0.14)
    b.box(hx, hy, ZS + H - 0.075, 0.6 if dx else 0.25, 0.25 if dx else 0.6, 0.01, m=1)
    lt = bpy.data.lights.new('ext_streetlight', 'AREA'); lt.shape = 'RECTANGLE'; lt.size, lt.size_y = (0.6, 0.25) if dx else (0.25, 0.6)
    lt.energy = STREET_AREA_W; lt.color = K4000
    o = bpy.data.objects.new('ext_streetlight', lt); o.location = (hx, hy, ZS + H - 0.09); link(o, c)


def import_glb(path):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for cc in list(o.users_collection): cc.objects.unlink(o)
    return new


def build_street(M, c):
    b = Batch()
    for (x, y, d) in STREETLIGHTS: streetlight(M, c, x, y, d, b)
    b.obj('ext_streetlight_poles', [M['metal_lt'], M['lamp4000']], c)
    rr = random.Random(5)
    # bollards along the superblock curbs every 1.5 m, gaps at the crossings and the forecourt doors
    bo = Batch(); x0, x1, y0, y1 = SB
    # 0.18 m x 0.95 m bollards on 1.4 m centres: people pass between them
    pts = [(x, y0 + 0.7) for x in np.arange(x0 + 8, x1 - 8, 1.4)] + [(x, y1 - 0.7) for x in np.arange(x0 + 8, x1 - 8, 1.4)] + \
          [(x0 + 0.7, y) for y in np.arange(y0 + 8, y1 - 8, 1.4)] + [(x1 - 0.7, y) for y in np.arange(y0 + 8, y1 - 8, 1.4)]
    for (x, y) in pts:
        if any(h[0] - 1 < x < h[1] + 1 and h[2] - 1 < y < h[3] + 1 for h in stair_holes()): continue
        bo.cyl(x, y, ZS, ZS + 0.9, 0.09, 14); bo.cyl(x, y, ZS + 0.9, ZS + 0.95, 0.09, 14, r1=0.06)
    bo.obj('ext_bollards', [M['metal']], c)
    # street wear: drain grates at the curbs (3 per block face), 0.6 m utility covers on sidewalks and roads
    gr = Batch(); cv = Batch(); rw = random.Random(23)
    for xc in (X7, X8):
        for side in (-1, 1):
            xx = xc + side * (AVE_W / 2 - 0.35)
            for yy in (-50.0, 8.0, 55.0, -140.0, 130.0): gr.box(xx, yy + rw.uniform(-6, 6), ZS - 0.148, 0.5, 0.95, 0.006)
    for yc in (Y33, Y31):
        for side in (-1, 1):
            yy = yc + side * (ST_W / 2 - 0.35)
            for xx in (-50.0, 20.0, 95.0, 150.0): gr.box(xx + rw.uniform(-8, 8), yy, ZS - 0.148, 0.95, 0.5, 0.006)
    covers = [(rw.uniform(X7 - 10, X7 + 10), rw.uniform(-80, 80), ZS - 0.148) for _ in range(10)] + [(rw.uniform(X8 - 10, X8 + 10), rw.uniform(-80, 80), ZS - 0.148) for _ in range(8)]
    covers += [(rw.uniform(-60, 150), Y33 + rw.uniform(-6, 6), ZS - 0.148) for _ in range(6)] + [(rw.uniform(-60, 150), Y31 + rw.uniform(-6, 6), ZS - 0.148) for _ in range(6)]
    covers += [(rw.uniform(161, 171), rw.uniform(-70, 70), ZS + 0.002) for _ in range(5)] + [(rw.uniform(197, 201), rw.uniform(-70, 70), ZS + 0.002) for _ in range(4)]
    covers += [(rw.uniform(-78.5, -73), rw.uniform(-50, 50), ZS + 0.002) for _ in range(4)] + [(rw.uniform(-109, -104), rw.uniform(-60, 60), ZS + 0.002) for _ in range(3)]
    for (xx, yy, zz) in covers: cv.cyl(xx, yy, zz - 0.004, zz + 0.004, 0.3, 20)
    gr.obj('ext_drain_grates', [M['grate']], c); cv.obj('ext_utility_covers', [M['cover']], c)
    # benches and bins on the walkway, bins on the corners
    fu = Batch()
    for k in range(12):
        a = math.radians(30 + k * 25.5)
        if in_hall(a, RING_R1) or any(abs(math.atan2(math.sin(a - o[0]), math.cos(a - o[0]))) * RING_R1 < o[1] + 3 for o in OPENINGS): a += math.radians(6)
        r = RING_R1 - 0.6; x, y = r * math.cos(a), r * math.sin(a); yaw = a + math.pi / 2
        fu.box(x, y, ZS + 0.44, 1.9, 0.5, 0.06, yaw, m=1); fu.box(x + 0.22 * math.cos(a), y + 0.22 * math.sin(a), ZS + 0.75, 1.9, 0.05, 0.4, yaw, m=1)
        for s in (-0.8, 0.8): fu.box(x - s * math.sin(a), y + s * math.cos(a), ZS + 0.22, 0.06, 0.5, 0.44, yaw, m=0)
    bins = [(RING_R1 * math.cos(math.radians(a)) * 0.99, RING_R1 * math.sin(math.radians(a)) * 0.99) for a in range(42, 330, 32)]
    bins += [(x0 + 1.2, y0 + 1.2), (x0 + 1.2, y1 - 1.2), (x1 - 1.2, y0 + 1.2), (x1 - 1.2, y1 - 1.2), (X7 + 13, Y33 + 10), (X7 + 13, Y31 - 10), (X8 - 13, Y33 + 10), (X8 - 13, Y31 - 10), (169, -30)]
    for (x, y) in bins: fu.cyl(x, y, ZS, ZS + 0.95, 0.3, 14, m=2); fu.cyl(x, y, ZS + 0.95, ZS + 1.0, 0.32, 14, m=0)
    fu.obj('ext_furniture', [M['metal'], M['wood_bench'], M['bin']], c)
    # hydrants (MLow's baked hydrant model)
    hyd = import_glb(os.path.join(ASSETS, 'glb', 'hydrant.glb'))
    if hyd:
        hm = next(o for o in hyd if o.type == 'MESH')
        for k, (x, y) in enumerate([(171.0, -45), (171.0, 48), (-78.0, -30), (-78.0, 35), (40, -73.2), (-20, 73.2), (197.0, 10), (110, 92.6)]):
            o = bpy.data.objects.new('ext_hydrant', hm.data); o.location = (x, y, ZS); o.rotation_euler = (0, 0, rr.uniform(0, 6.28)); link(o, c)
        for o in hyd: bpy.data.objects.remove(o)
    # food carts: steel boxes with a lit window and an umbrella, a warm bulb
    ca = Batch()
    for (x, y, yaw) in [(169.0, -38, 0), (169.0, 50, 0), (-76.5, -12, math.pi), (-76.5, 22, math.pi), (25.0, -72.0, math.pi / 2), (-15.0, 72.0, -math.pi / 2)]:
        ca.box(x, y, ZS + 1.15, 1.6, 3.0, 1.7, yaw, m=0)
        ca.box(x + 0.81 * math.cos(yaw), y + 0.81 * math.sin(yaw), ZS + 1.45, 0.02, 2.2, 0.7, yaw, m=1)
        ca.cyl(x, y, ZS + 2.0, ZS + 2.9, 0.03, 6, m=0); ca.cyl(x, y, ZS + 2.6, ZS + 3.05, 1.5, 16, m=2, r1=0.05)
        for s in (-1, 1): ca.cyl(x + s * 1.1 * math.sin(yaw), y - s * 1.1 * math.cos(yaw), ZS + 0.0, ZS + 0.3, 0.28, 10, m=3)
        lt = bpy.data.lights.new('ext_cart_bulb', 'POINT'); lt.energy = 120; lt.color = K3000; lt.shadow_soft_size = 0.05
        o = bpy.data.objects.new('ext_cart_bulb', lt); o.location = (x + 1.0 * math.cos(yaw), y + 1.0 * math.sin(yaw), ZS + 2.45); link(o, c)
    ca.obj('ext_carts', [M['cart'], M['shop'], M['umbrella'], M['black']], c)
    # traffic signals at the four corners of each avenue crossing
    ts = Batch()
    for xc in (X7, X8):
        for yc in (Y33, Y31):
            for sx in (-1, 1):
                for sy in (-1, 1):
                    x, y = xc + sx * (AVE_W / 2 + 0.8), yc + sy * (ST_W / 2 + 0.8)
                    ts.cyl(x, y, ZS, ZS + 4.2, 0.08, 8)
                    ts.box(x, y, ZS + 3.6, 0.35, 0.35, 1.1)
                    green = (sy < 0) == (xc == X7)
                    ts.box(x - sx * 0.18, y, ZS + (3.95 if not green else 3.3), 0.02, 0.22, 0.22, m=1 if not green else 2)
    ts.obj('ext_signals', [M['black'], M['red_lamp'], M['green_lamp']], c)
    build_vehicles(M, c, rr)


def build_vehicles(M, c, rr):
    new = import_glb(os.path.join(ASSETS, 'glb', 'h_taxi.glb'))
    me = next((o.data for o in new if o.type == 'MESH'), None)
    if me is None: return
    for o in new: bpy.data.objects.remove(o)
    # repaints for private cars: hue and value shifted copies of the taxi's baked texture
    paints = [me]
    for k, (hue, sat, val) in enumerate([(0.0, 0.0, 0.25), (0.0, 0.0, 1.6), (0.55, 0.6, 0.5), (0.95, 0.9, 0.6), (0.0, 0.05, 0.9)]):
        m2 = me.copy(); paints.append(m2)
        mats = []
        for mt in m2.materials:
            mc = mt.copy(); nt = mc.node_tree
            tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None); bs = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if tex and bs:
                hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Hue'].default_value = (0.5 + hue) % 1.0; hs.inputs['Saturation'].default_value = sat; hs.inputs['Value'].default_value = val
                nt.links.new(tex.outputs['Color'], hs.inputs['Color']); nt.links.new(hs.outputs['Color'], bs.inputs['Base Color'])
            mats.append(mc)
        for i, mc in enumerate(mats): m2.materials[i] = mc
    lights = Batch()
    def car(x, y, heading, data, name):
        o = bpy.data.objects.new(name, data); o.location = (x, y, ZS - 0.15); o.scale = (3.7, 4.8, 3.8); o.rotation_euler = (0, 0, heading); link(o, c)
        hx, hy = -math.sin(heading), math.cos(heading)      # the model's +y is its length; front is +y after the turn (checked in renders)
        for s in (-0.6, 0.6):
            px, py = math.cos(heading) * s, math.sin(heading) * s
            lights.box(x + hx * 2.42 + px, y + hy * 2.42 + py, ZS + 0.55, 0.22, 0.05, 0.1, heading, m=0)
            lights.box(x - hx * 2.42 + px, y - hy * 2.42 + py, ZS + 0.65, 0.25, 0.05, 0.1, heading, m=1)
    # Seventh Avenue runs south (+y): heading pi turns the model's +y to -y... the model front is +y, so south is heading 0 with front +y
    k = 0
    for (x, y) in [(178.0, -40), (181.6, -12), (185.2, 22), (188.8, -55), (178.0, 30), (185.2, -28), (192.4, 8), (181.6, 60), (188.8, 45)]:
        car(x, y, 0.0, me if k % 2 == 0 else paints[1 + k % 5], 'ext_car'); k += 1
    for (x, y) in [(-95.0, 30), (-88.0, -10), (-84.4, 45), (-98.6, -40), (-91.8, 10), (-87.0, -50)]:
        car(x, y, math.pi, me if k % 3 == 0 else paints[1 + k % 5], 'ext_car'); k += 1
    for (x, y) in [(30.0, Y33 - 2.5), (-40.0, Y33 + 2.5), (100.0, Y31 + 2.5), (60.0, Y31 - 2.5)]:
        car(x, y, math.pi / 2, me if k % 2 else paints[1 + k % 5], 'ext_car'); k += 1
    lights.obj('ext_car_lights', [M['head'], M['tail']], c)
    # two buses in the Seventh Avenue bus lane
    bu = Batch()
    for y in (-30.0, 52.0):
        x = X7 - AVE_W / 2 + 1.8
        bu.box(x, y, ZS + 1.75, 2.55, 12.2, 2.9, m=0); bu.box(x, y, ZS + 2.15, 2.58, 11.4, 1.1, m=1)
        bu.box(x, y, ZS + 1.15, 2.58, 11.8, 0.18, m=2)
        bu.box(x, y + 6.11, ZS + 2.15, 2.2, 0.02, 1.3, m=1)
    bu.obj('ext_buses', [M['bus'], M['bus_win'], M['blue']], c)


# ---------------------------------------------------------------- 7. the cast on the streets
def load_cast():
    path = os.path.join(WK, 'cast_walk.blend')
    if not os.path.exists(path): return []
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n.startswith('extc_')]
    return [o for o in dst.objects if o is not None]


def place_cast(c, n_total=300):
    global AVOID
    AVOID = [v[0] for v in CAMERAS.values()]
    tpl = load_cast()
    if not tpl: print('exterior: no cast_walk.blend, run exterior_cast.py'); return 0
    walk = [o for o in tpl if o.get('walker')]; idle = [o for o in tpl if not o.get('walker') and not any(k in o.name for k in ('folksinger', 'sally'))]
    sit = [o for o in tpl if any(k in o.name for k in ('folksinger',)) and not o.get('walker')]
    rr = random.Random(1111); placed = []

    def put(pool, x, y, z, dx, dy, tag):
        for (cx_, cy_, cz_) in AVOID:
            if (cx_ - x) ** 2 + (cy_ - y) ** 2 < 16.0 and abs(cz_ - z) < 3: return False
        for p in placed:
            if (p[0] - x) ** 2 + (p[1] - y) ** 2 < 0.75 ** 2 and abs(p[2] - z) < 2: return False
        t = rr.choice(pool); o = bpy.data.objects.new('ext_nyer_' + tag, t.data)
        o.location = (x, y, z); o.rotation_euler = (0, 0, math.atan2(dx, -dy)); s = rr.uniform(0.94, 1.04); o.scale = (s, s, s); link(o, c)
        placed.append((x, y, z)); return True

    def walkers(n, gen, tag, idle_share=0.12):
        k = tries = 0
        while k < n and tries < n * 20:
            tries += 1; x, y, z, dx, dy = gen()
            if put(idle if rr.random() < idle_share else walk, x, y, z, dx, dy, tag): k += 1
    ag = math.asin((HALL['w'] + 1.5) / RING_RC)

    def ring():
        a = rr.uniform(ag, math.tau - ag); r = rr.uniform(RING_R0 + 0.3, RING_R1 - 1.2); d = rr.choice((-1, 1))
        return r * math.cos(a), r * math.sin(a), ZS + 0.02, -math.sin(a) * d, math.cos(a) * d
    walkers(int(n_total * 0.36), ring, 'walk')

    def sidewalks():
        k = rr.random()
        if k < 0.35: x, y, dx, dy = rr.uniform(161, 171), rr.uniform(-70, 70), 0, rr.choice((-1, 1))
        elif k < 0.5: x, y, dx, dy = rr.uniform(196.5, 201.5), rr.uniform(-75, 75), 0, rr.choice((-1, 1))
        elif k < 0.7: x, y, dx, dy = rr.uniform(-78.5, -72), rr.uniform(-55, 55), 0, rr.choice((-1, 1))
        elif k < 0.85: x, y, dx, dy = rr.uniform(-75, 150), rr.choice((rr.uniform(-73.5, -71.5), rr.uniform(71.5, 73.5))), rr.choice((-1, 1)), 0
        else: x, y, dx, dy = rr.uniform(-75, 170), rr.choice((rr.uniform(-97.5, -92.5), rr.uniform(92.5, 97.5))), rr.choice((-1, 1)), 0
        if any(h[0] - 0.6 < x < h[1] + 0.6 and h[2] - 0.6 < y < h[3] + 0.6 for h in stair_holes()): x += 9
        if -63 < x < -39 and abs(y) > 59: x += 26
        return x, y, ZS, dx + rr.uniform(-0.15, 0.15), dy + rr.uniform(-0.15, 0.15)
    walkers(int(n_total * 0.27), sidewalks, 'street')
    # the queue at the doors: one line per door bank, 0.65 to 0.85 m apart, facing the glass
    for y in (-10.5, -3.5, 3.5, 10.5):
        x = 155.3
        for k in range(8):
            put(idle, x, y + rr.uniform(-0.15, 0.15), ZS, -1, rr.uniform(-0.2, 0.2), 'queue'); x += rr.uniform(0.65, 0.85)
    # three arrival groups walking in from the sidewalk to a door bank: friends together, a metre apart
    for (gx, gy, tx, ty, n) in ((170.0, -21.0, 156.0, -10.5, 4), (171.0, 6.5, 157.0, 3.5, 3), (169.0, 24.0, 157.0, 11.0, 4)):
        dx, dy = tx - gx, ty - gy; L = math.hypot(dx, dy); dx, dy = dx / L, dy / L
        for k in range(n):
            ox, oy = (k // 2) * 1.0, ((k % 2) - 0.5) * 0.9
            put(walk, gx - dx * ox - dy * oy, gy - dy * ox + dx * oy, ZS, dx, dy, 'arrive')
    # the hall and the escalators: a few on the hall floor
    walkers(10, lambda: (rr.uniform(70, 88), rr.uniform(-18, 18) if rr.random() < 0.6 else rr.uniform(-6, 6), ZS + 0.01, rr.choice((-1, 1)), rr.uniform(-0.3, 0.3)), 'hall', 0.2)
    # the concourse and the platform
    zf = ZS - 5.0
    walkers(int(n_total * 0.15), lambda: (rr.uniform(-60, 160), rr.uniform(-5.2, 5.2), zf, rr.choice((-1, 1)), rr.uniform(-0.15, 0.15)), 'conc', 0.15)
    walkers(10, lambda: (rr.uniform(28, 40), rr.uniform(-4.5, 4.5), zf, -1, rr.uniform(-0.2, 0.2)), 'board', 1.0)
    zp = ZS - 13.0
    walkers(28, lambda: (rr.uniform(-46, 56), rr.choice((rr.uniform(25.2, 31.4), rr.uniform(42.6, 48.8))), zp, rr.choice((-1, 1)), rr.uniform(-0.3, 0.3)), 'plat', 0.6)
    if sit:
        for (x, y, a) in [(-60.0, 40.0, 0.4), (150.0, -40.0, math.pi)]:
            r_ = math.hypot(x, y); x, y = x / r_ * (RING_R1 - 0.9), y / r_ * (RING_R1 - 0.9)
            put(sit, x, y, ZS, -x, -y, 'busker')
    return len(placed)


# ---------------------------------------------------------------- light
def blue_hour(scene, kind='sky', strength=None, sun_elev=-4.5, sun_rot=None, hdri='highway_bridge_sunset_4k.hdr'):
    """the world for 15 to 25 minutes after sunset. kind 'sky': Blender's multiple scattering sky with the sun 4.5 degrees
    under the horizon, set in the west south west (late November sunset over the Hudson, about 61 degrees from grid west
    toward grid south). kind 'hdri': a Poly Haven CC0 dusk HDRI (blender/dl/hdri) cooled toward blue."""
    w = bpy.data.worlds.new('ext_blue_hour'); scene.world = w; w.use_nodes = True; nt = w.node_tree; bg = nt.nodes['Background']
    path = os.path.join(DL, 'hdri', hdri)
    if kind == 'sky':
        sk = nt.nodes.new('ShaderNodeTexSky'); sk.sky_type = 'MULTIPLE_SCATTERING'; sk.sun_elevation = math.radians(sun_elev)
        sk.sun_rotation = math.atan2(-0.48, 0.87) if sun_rot is None else sun_rot; sk.sun_disc = False; sk.altitude = 30.0; sk.air_density = 1.0; sk.aerosol_density = 1.6
        nt.links.new(sk.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 20.0 if strength is None else strength
    elif os.path.exists(path):
        tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
        en = nt.nodes.new('ShaderNodeTexEnvironment'); en.image = bpy.data.images.load(path, check_existing=True)
        nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], en.inputs['Vector'])
        cc = nt.nodes.new('ShaderNodeMix'); cc.data_type = 'RGBA'; cc.blend_type = 'MULTIPLY'; cc.inputs['Factor'].default_value = 1.0
        a = next(x for x in cc.inputs if x.name == 'A' and x.type == 'RGBA'); b = next(x for x in cc.inputs if x.name == 'B' and x.type == 'RGBA')
        b.default_value = (0.72, 0.82, 1.0, 1); nt.links.new(en.outputs['Color'], a); nt.links.new(next(x for x in cc.outputs if x.type == 'RGBA'), bg.inputs['Color'])
        bg.inputs['Strength'].default_value = 0.12 if strength is None else strength
    else:
        bg.inputs['Color'].default_value = (0.05, 0.08, 0.16, 1); bg.inputs['Strength'].default_value = 0.2
    return w


CAMERAS = {
    'ext_seventh':   ((200.0, -4.0, ZS + 1.65), (160.0, 3.0, ZS + 8.2), 28),
    'ext_aerial_ne': ((144.0, -139.0, ZS + 60.0), (0.0, 4.0, ZS + 8.0), 40),
    'ext_walkway':   ((-65.8, -24.0, ZS + 1.65), (-68.5, 17.0, ZS + 4.0), 28),
    'ext_eighth':    ((-106.5, 30.0, ZS + 1.65), (-40.0, -12.0, ZS + 13.0), 28),
    'ext_concourse': ((47.0, 2.4, ZS - 5.0 + 1.65), (20.0, -0.6, ZS - 5.0 + 2.9), 28),
    'ext_platform':  ((-44.0, 26.2, ZS - 13.0 + 1.65), (60.0, 30.5, ZS - 13.0 + 1.2), 28),
}


def build_exterior(mode='qa', cast=True, light=True, n_cast=300):
    sc = bpy.context.scene
    root = bpy.data.collections.new('exterior'); sc.collection.children.link(root); _C.clear(); _C['root'] = root
    M = materials()
    build_drum(M, coll('ext_drum'))
    build_ground(M, coll('ext_ground'))
    build_entrance(M, coll('ext_entrance'))
    build_station(M, coll('ext_station'))
    build_context(M, coll('ext_city'))
    build_street(M, coll('ext_street'))
    n = place_cast(coll('ext_people'), n_cast) if cast else 0
    if light: blue_hour(sc, **({} if light is True else light))
    print('exterior: built,', n, 'New Yorkers on the streets')
    return dict(CAMERAS)
