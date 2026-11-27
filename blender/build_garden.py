"""build_garden.py: THE GARDEN in Cycles. The generator is the source of truth; never patch the .blend.
  Blender -b --factory-startup --python blender/build_garden.py -- qa|full [view ...]
Plan in metres from layout.js (plan y = three.js z; Blender z is up). The event floor is z = 0.
Writes blender/renders/<view>.png and blender/work/garden.blend."""
import bpy, bmesh, math, os, sys, random, glob
import numpy as np
from mathutils import Vector, Matrix, Euler
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
from bl_people import person_mesh
TEX = os.path.join(HERE, 'tex'); WK = os.path.join(HERE, 'work'); OUTR = os.path.join(HERE, 'renders'); os.makedirs(OUTR, exist_ok=True)
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['qa']
MODE = argv[0]; VIEWS = argv[1:]
random.seed(11); np.random.seed(11)

# ---------------- the plan (layout.js)
FL, FR = 16.0, 15.0
LOW = dict(d0=1.8, rows=18, depth=0.74, rise=0.42)
CLUB_D0 = LOW['d0'] + LOW['rows'] * LOW['depth']; CLUB_Y0 = LOW['rows'] * LOW['rise']; CLUB_D1 = CLUB_D0 + 1.6; CLUB_Y1 = CLUB_Y0 + 2.2
UP = dict(d0=CLUB_D1, rows=14, depth=0.74, rise=0.66, y0=CLUB_Y1)
BACK = UP['d0'] + UP['rows'] * UP['depth']; BACK_TOP = UP['y0'] + UP['rows'] * UP['rise'] + 1.2
DRUM_IN, ROOF_RIM, HUB_R = 63.6, 34.0, 4.2
def ceil_z(r): R = DRUM_IN - 0.5; return ROOF_RIM + 1.2 - (1 - min(r, R) / R) * 5.2
def stadium(s, d):
    """point on the stadium outline grown by d at perimeter fraction s, with its outward normal: (x, y, nx, ny)"""
    R = FR + d; L = 2 * FL; P = 2 * L + 2 * math.pi * R; u = (s % 1) * P; arc = math.pi * R
    if u < arc / 2: a = u / R; return FL + R * math.cos(a), -R * math.sin(a), math.cos(a), -math.sin(a)
    u -= arc / 2
    if u < L: return FL - u, -R, 0, -1
    u -= L
    if u < arc: a = math.pi / 2 + u / R; return -FL + R * math.cos(a), -R * math.sin(a), math.cos(a), -math.sin(a)
    u -= arc
    if u < L: return -FL + u, R, 0, 1
    u -= L; a = 1.5 * math.pi + u / R; return FL + R * math.cos(a), -R * math.sin(a), math.cos(a), -math.sin(a)
def perim(d): return 4 * FL + 2 * math.pi * (FR + d)

# ---------------- scene, helpers
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene; C = sc.collection
def coll(name, parent=None):
    c = bpy.data.collections.new(name); (parent or C).children.link(c); return c
def link(o, c=None): (c or C).objects.link(o); return o
def mesh_obj(name, verts, faces, mat=None, c=None, uv=None, smooth=False):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uv is not None:
        lay = me.uv_layers.new(name='UVMap'); arr = np.zeros(len(me.loops) * 2)
        loops_v = np.zeros(len(me.loops), int); me.loops.foreach_get('vertex_index', loops_v); arr = np.asarray(uv)[loops_v].ravel(); lay.data.foreach_set('uv', arr)
    if smooth: me.shade_smooth()
    o = bpy.data.objects.new(name, me)
    if mat: me.materials.append(mat)
    return link(o, c)
def node_mat(name, base=(0.5, 0.5, 0.5), rough=0.5, metal=0.0, emit=None, estr=0.0, img=None, img_emit=False, coat=0.0, alpha=None, trans=0.0, ior=1.45, repeat=None, normal_img=None, nstr=0.4, nrep=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*base, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat; b.inputs['Transmission Weight'].default_value = trans; b.inputs['IOR'].default_value = ior
    if img:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(img, check_existing=True)
        if repeat:
            tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (*repeat, 1)
            nt.links.new(tc.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if img_emit: nt.links.new(t.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = estr
    elif emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if normal_img:
        nt_ = nt.nodes.new('ShaderNodeTexImage'); nt_.image = bpy.data.images.load(normal_img, check_existing=True); nt_.image.colorspace_settings.name = 'Non-Color'
        if nrep:
            tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (*nrep, 1)
            nt.links.new(tc.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nt_.inputs['Vector'])
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = nstr; nt.links.new(nt_.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if alpha is not None: b.inputs['Alpha'].default_value = alpha
    return m
def box(name, size, loc, mat, c=None, rot=(0, 0, 0), bevel=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    if mat: me.materials.append(mat)
    if bevel: md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 3; md.limit_method = 'ANGLE'
    return link(o, c)
def cyl(name, r, h, loc, mat, c=None, rot=(0, 0, 0), verts=24, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.shade_smooth(); o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    if mat: me.materials.append(mat)
    return link(o, c)
def sweep(name, profile, mat, c=None, N=720, closed=False, u_scale=1.0, s0=0.0, s1=1.0):
    """sweep a 2D profile [(d, z), ...] round the stadium outline; UV u along the perimeter (metres * u_scale), v along the profile"""
    verts, uv, faces = [], [], []; P = len(profile)
    vacc = np.concatenate([[0], np.cumsum([math.hypot(profile[k + 1][0] - profile[k][0], profile[k + 1][1] - profile[k][1]) for k in range(P - 1)])])
    full = s0 == 0 and s1 == 1; M = N if full else N + 1
    for i in range(M):
        s = s0 + (s1 - s0) * i / N
        for k, (d, z) in enumerate(profile):
            x, y, nx, ny = stadium(s, d); verts.append((x, y, z)); uv.append((s * perim(d) * u_scale, vacc[k]))
    for i in range(N if full else N):
        a, b = i, (i + 1) % M
        for k in range(P - 1): faces.append((a * P + k, b * P + k, b * P + k + 1, a * P + k + 1))
    # wrap uv seam: duplicate not needed for tiling textures
    return mesh_obj(name, verts, faces, mat, c, uv=uv)

# ---------------- materials
TEXP = lambda n: os.path.join(TEX, n)
PH = os.path.join(ROOT, 'work', 'ph_tex')
M = {}
M['concrete'] = node_mat('concrete', (0.33, 0.34, 0.37), 0.85, img=os.path.join(ROOT, 'site', 'assets', 'tex', 'concrete_c.jpg'), repeat=(0.25, 0.25), normal_img=os.path.join(ROOT, 'site', 'assets', 'tex', 'concrete_n.jpg'), nrep=(0.25, 0.25))
M['riser'] = node_mat('riser', (0.035, 0.038, 0.048), 0.6)
M['dark'] = node_mat('dark', (0.02, 0.022, 0.028), 0.55)
M['wall'] = node_mat('wall', (0.012, 0.013, 0.017), 0.8)
M['steel'] = node_mat('steel', (0.55, 0.57, 0.6), 0.35, 1.0)
M['black_steel'] = node_mat('black_steel', (0.03, 0.03, 0.035), 0.4, 0.8)
M['glass'] = node_mat('glass', (0.9, 0.95, 1.0), 0.04, trans=1.0, ior=1.45)
M['rail_glass'] = node_mat('rail_glass', (0.85, 0.9, 0.95), 0.05, trans=0.92, ior=1.5)
M['seat'] = node_mat('seat', (0.022, 0.03, 0.06), 0.58, coat=0.12)
def _seat_tone(m):
    nt = m.node_tree; oi = nt.nodes.new('ShaderNodeObjectInfo'); mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs[6].default_value = (*srgb_('#152131'), 1); mx.inputs[7].default_value = (*srgb_('#1c293b'), 1); gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.5
    nt.links.new(oi.outputs['Random'], gt.inputs[0]); nt.links.new(gt.outputs[0], mx.inputs[0]); nt.links.new(mx.outputs[2], nt.nodes['Principled BSDF'].inputs['Base Color'])
def srgb_(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]; return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
_seat_tone(M['seat'])
M['seat_frame'] = node_mat('seat_frame', (0.05, 0.05, 0.055), 0.4, 0.8)
M['pad'] = node_mat('pad', (0.03, 0.06, 0.16), 0.55)
M['white'] = node_mat('white', (0.85, 0.86, 0.88), 0.35)
M['orange'] = node_mat('orange', (0.9, 0.22, 0.03), 0.35, 0.6)
M['net'] = node_mat('net', (0.92, 0.92, 0.92), 0.8)
M['court'] = node_mat('court', img=TEXP('court.jpg'), rough=0.33, coat=0.35, normal_img=os.path.join(PH, 'laminate_floor_02_n.jpg'), nstr=0.12, nrep=(72, 40))
def _court_rough(m):
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (180, 9, 1)
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.30; mr.inputs['To Max'].default_value = 0.36
    nt.links.new(tc.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nz.inputs['Vector']); nt.links.new(nz.outputs['Fac'], mr.inputs[0]); nt.links.new(mr.outputs[0], b.inputs['Roughness'])
_court_rough(M['court'])
M['court'].node_tree.nodes['Principled BSDF'].inputs['Coat Roughness'].default_value = 0.19; M['court'].node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value = 1.48
M['floorbase'] = node_mat('floorbase', (0.012, 0.014, 0.02), 0.75)
M['ribbon'] = node_mat('ribbon', img=TEXP('ribbon.jpg'), img_emit=True, estr=2.2, rough=0.3, repeat=(1, 1))
M['boards'] = node_mat('boards', img=TEXP('boards.jpg'), img_emit=True, estr=2.0, rough=0.3)
M['suite'] = node_mat('suite', (0.01, 0.01, 0.012), 0.08, emit=(1.0, 0.78, 0.52), estr=0.12)
M['ceiling'] = node_mat('ceiling', (0.028, 0.03, 0.036), 0.9)
M['fixture'] = node_mat('fixture', (1, 1, 1), 0.3, emit=(1.0, 0.97, 0.92), estr=60)
M['skin'] = None

# ---------------- the bowl: two stepped sweeps, the club with the ribbon, the back wall and the suites
G_BOWL = coll('bowl')
def stairs(d0, z0, rows, depth, rise):
    p = [(d0, z0)]
    for r in range(rows): d = d0 + r * depth; p += [(d, z0 + (r + 1) * rise), (d + depth, z0 + (r + 1) * rise)]
    return p
N = 960 if MODE == 'full' else 480
low = stairs(LOW['d0'], 0.0, LOW['rows'], LOW['depth'], LOW['rise'])
sweep('lower_bowl', [(LOW['d0'] - 0.0, 0.0)] + low[1:], M['concrete'], G_BOWL, N)
# the wall at the front of the lower bowl: padded, with the LED strip round the floor
sweep('front_wall', [(LOW['d0'] - 0.02, 0.0), (LOW['d0'] - 0.02, 1.0)], M['dark'], G_BOWL, N)
sweep('front_led', [(LOW['d0'] - 0.04, 0.32), (LOW['d0'] - 0.04, 0.88)], M['ribbon'], G_BOWL, N, u_scale=1 / 24)
sweep('club_floor', [(CLUB_D0, CLUB_Y0), (CLUB_D1, CLUB_Y0)], M['concrete'], G_BOWL, N)
sweep('club_rail', [(CLUB_D0 + 0.05, CLUB_Y0), (CLUB_D0 + 0.05, CLUB_Y0 + 1.0)], M['rail_glass'], G_BOWL, N)
sweep('suites', [(CLUB_D1 + 0.6, CLUB_Y0), (CLUB_D1 + 0.6, CLUB_Y0 + 1.15)], M['suite'], G_BOWL, N)
sweep('fascia_low', [(CLUB_D1 - 0.02, CLUB_Y0 + 1.15), (CLUB_D1 - 0.02, CLUB_Y0 + 1.3)], M['black_steel'], G_BOWL, N)
sweep('ribbon', [(CLUB_D1 - 0.03, CLUB_Y0 + 1.3), (CLUB_D1 - 0.03, CLUB_Y1 - 0.1)], M['ribbon'], G_BOWL, N, u_scale=1 / 30)
sweep('fascia_top', [(CLUB_D1 - 0.02, CLUB_Y1 - 0.1), (CLUB_D1 - 0.02, CLUB_Y1), (UP['d0'], UP['y0'])], M['black_steel'], G_BOWL, N)
up = stairs(UP['d0'], UP['y0'], UP['rows'], UP['depth'], UP['rise'])
sweep('upper_bowl', up, M['concrete'], G_BOWL, N)
sweep('upper_rail', [(UP['d0'] + 0.08, UP['y0']), (UP['d0'] + 0.08, UP['y0'] + 0.95)], M['rail_glass'], G_BOWL, N)
sweep('back_wall', [(BACK, BACK_TOP - 1.2), (BACK, BACK_TOP + 0.8)], M['wall'], G_BOWL, N)
sweep('skybox', [(BACK + 0.4, BACK_TOP + 0.8), (BACK + 0.4, BACK_TOP + 3.4)], M['suite'], G_BOWL, N)
sweep('skybox_rail', [(BACK + 0.02, BACK_TOP + 0.8), (BACK + 0.02, BACK_TOP + 1.8)], M['rail_glass'], G_BOWL, N)
sweep('drum_wall', [(BACK + 0.4, BACK_TOP + 3.4), (BACK + 0.4, BACK_TOP + 4.2), (BACK + 3.0, ceil_z(FL + FR + BACK) - 0.3)], M['wall'], G_BOWL, N)
# the risers are dark: a second, thin sweep of only the risers would double the faces; paint them by a material index instead
for o in (bpy.data.objects['lower_bowl'], bpy.data.objects['upper_bowl']):
    o.data.materials.append(M['riser']); P = len(low) if o.name == 'lower_bowl' else len(up)
    # faces go profile-major inside each sample: face index i*(P-1)+k; k odd (even in 0 based after the first) are risers
    mi = np.zeros(len(o.data.polygons), int); k = np.arange(len(o.data.polygons)) % (P - 1); mi[(k % 2) == 0] = 1; o.data.polygons.foreach_set('material_index', mi)
# the event floor: the court on a plane, a dark stadium shaped base round it
G_FLOOR = coll('floor')
fw, fd = 62, 30
cx0, cx1, cy0, cy1 = -17.4, 17.4, -10.2, 10.2; U_ = lambda x: (x + fw / 2) / fw; V_ = lambda y: (y + fd / 2) / fd
mesh_obj('court', [(cx0, cy0, 0.006), (cx1, cy0, 0.006), (cx1, cy1, 0.006), (cx0, cy1, 0.006)], [(0, 1, 2, 3)], M['court'], G_FLOOR, uv=[(U_(cx0), V_(cy0)), (U_(cx1), V_(cy0)), (U_(cx1), V_(cy1)), (U_(cx0), V_(cy1))])
mesh_obj('floor_base', [(-fw / 2 - 2, -fd / 2 - 2, 0.0), (fw / 2 + 2, -fd / 2 - 2, 0.0), (fw / 2 + 2, fd / 2 + 2, 0.0), (-fw / 2 - 2, fd / 2 + 2, 0.0)], [(0, 1, 2, 3)], M['floorbase'], G_FLOOR)
bpy.data.objects['court'].scale = (1, 1, 1)
# the court texture rows run +z down in the canvas (plan y = three z); flip v so the canvas reads from above
sweep('floor_edge', [(0.0, 0.002), (LOW['d0'], 0.002)], M['floorbase'], G_FLOOR, N)

# ---------------- aisles: half steps and a handrail every so often
def aisle_s(rows_d, n, offset=0.0): return [(i + 0.5 + offset) / n for i in range(n)]
AISLES = {'low': aisle_s(LOW['d0'], 22), 'up': aisle_s(UP['d0'], 30, 0.25)}
def aisle_geo():
    verts, faces = [], []
    def add_box(cx, cy, cz, sx, sy, sz, yaw):
        b = len(verts); ca, sa = math.cos(yaw), math.sin(yaw)
        for dx, dy, dz in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
            x, y = dx * sx / 2, dy * sy / 2; verts.append((cx + x * ca - y * sa, cy + x * sa + y * ca, cz + dz * sz / 2))
        faces.extend([(b, b + 1, b + 2, b + 3), (b + 4, b + 7, b + 6, b + 5), (b, b + 4, b + 5, b + 1), (b + 1, b + 5, b + 6, b + 2), (b + 2, b + 6, b + 7, b + 3), (b + 3, b + 7, b + 4, b)])
    rails = []
    for key, B, z0 in (('low', LOW, 0.0), ('up', UP, UP['y0'])):
        for s in AISLES[key]:
            pts = []
            for r in range(B['rows']):
                d = B['d0'] + r * B['depth']; x, y, nx, ny = stadium(s, d + B['depth'] * 0.25); yaw = math.atan2(ny, nx)
                add_box(x, y, z0 + r * B['rise'] + B['rise'] * 0.75, B['depth'] * 0.5, 1.15, B['rise'] * 0.5, yaw)
                x2, y2, _, _ = stadium(s, d + B['depth'] * 0.5); pts.append((x2, y2, z0 + (r + 1) * B['rise'] + 0.92))
            rails.append(pts)
    return verts, faces, rails
av, af, rails = aisle_geo(); mesh_obj('aisle_steps', av, af, M['concrete'], G_BOWL)
for i, pts in enumerate(rails):
    cu = bpy.data.curves.new(f'rail{i}', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.022; cu.bevel_resolution = 2
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for k, p in enumerate(pts): sp.points[k].co = (*p, 1)
    o = bpy.data.objects.new(f'rail{i}', cu); cu.materials.append(M['steel']); link(o, G_BOWL)

# ---------------- seats and the crowd, instanced with geometry nodes
G_SEAT = coll('seats'); G_HIDE = coll('templates'); G_HIDE.hide_render = True; G_HIDE.hide_viewport = True
def seat_template():
    bm = bmesh.new()
    def cube(sx, sy, sz, loc, rx=0.0):
        r = bmesh.ops.create_cube(bm, size=1.0); vs = r['verts']; bmesh.ops.scale(bm, vec=Vector((sx, sy, sz)), verts=vs)
        if rx: bmesh.ops.rotate(bm, verts=vs, cent=Vector((0, 0, 0)), matrix=Matrix.Rotation(rx, 3, 'X'))
        bmesh.ops.translate(bm, vec=Vector(loc), verts=vs)
    cube(0.46, 0.42, 0.07, (0, -0.02, 0.43)); cube(0.46, 0.05, 0.5, (0, 0.2, 0.7), -0.18)
    me = bpy.data.meshes.new('seat_shell'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('seat_shell', me); me.materials.append(M['seat'])
    md = o.modifiers.new('b', 'BEVEL'); md.width = 0.025; md.segments = 3; link(o, G_HIDE)
    bm = bmesh.new()
    for sx in (-0.25, 0.25):
        r = bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector((0.04, 0.4, 0.04)), verts=r['verts']); bmesh.ops.translate(bm, vec=Vector((sx, 0.02, 0.62)), verts=r['verts'])
        r = bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector((0.05, 0.05, 0.6)), verts=r['verts']); bmesh.ops.translate(bm, vec=Vector((sx, 0.12, 0.3)), verts=r['verts'])
    me = bpy.data.meshes.new('seat_frame'); bm.to_mesh(me); bm.free(); f = bpy.data.objects.new('seat_frame', me); me.materials.append(M['seat_frame']); link(f, G_HIDE)
    return o, f
seat_o, frame_o = seat_template()

def seat_points():
    pts = []
    for key, B, z0 in (('low', LOW, 0.0), ('up', UP, UP['y0'])):
        for r in range(B['rows']):
            d = B['d0'] + r * B['depth'] + 0.36; z = z0 + (r + 1) * B['rise']; L = perim(d); n = int(L / 0.52)
            for i in range(n):
                s = (i + 0.5) / n
                if any(abs(((s - a + 0.5) % 1) - 0.5) * L < 0.75 for a in AISLES[key]): continue
                x, y, nx, ny = stadium(s, d); pts.append((x, y, z, math.atan2(-nx, ny), key == 'low' and r < 3))
    return pts
SEATS = seat_points()
# the floor seats: for basketball the Garden fills the rink floor round the court with risers of chairs, rows on the
# long sides parallel to the touchline and rows behind each baseline facing up the court
def sd_(x, y): ax = max(abs(x) - FL, 0); return math.hypot(ax, y) - FR
FLOOR_ROWS = []
for s in (-1, 1):
    for r in range(8):
        y = s * (10.35 + r * 0.95); z = 0.12 + r * 0.17
        for x in np.arange(-16.5, 16.6, 0.55):
            if s < 0 and r == 0 and abs(x) < 5: continue
            if sd_(x, y) < 1.2: FLOOR_ROWS.append((x, y, z, 0.0 if s > 0 else math.pi, r))
    for r in range(11):
        x = s * (19.6 + r * 0.95); z = 0.12 + r * 0.17
        for y in np.arange(-13, 13.1, 0.55):
            if sd_(x, y) < 1.2: FLOOR_ROWS.append((x, y, z, -s * math.pi / 2, r))
SEATS += [(x, y, z, yaw, False) for (x, y, z, yaw, r) in FLOOR_ROWS]
# the risers under them
rv, rf = [], []
for (x, y, z, yaw, r) in FLOOR_ROWS:
    b_ = len(rv); hw, hd = 0.28, 0.5; ca, sa = math.cos(yaw), math.sin(yaw)
    for dx, dy, dz in [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        lx, ly = dx * hw, dy * hd; rv.append((x + lx * ca - ly * sa, y + lx * sa + ly * ca, dz * z))
    rf += [(b_ + 4, b_ + 5, b_ + 6, b_ + 7), (b_, b_ + 1, b_ + 5, b_ + 4), (b_ + 1, b_ + 2, b_ + 6, b_ + 5), (b_ + 2, b_ + 3, b_ + 7, b_ + 6), (b_ + 3, b_, b_ + 4, b_ + 7)]
print('seats', len(SEATS), 'floor', len(FLOOR_ROWS))

def points_obj(name, rows, c, extra=None):
    me = bpy.data.meshes.new(name); me.vertices.add(len(rows)); me.vertices.foreach_set('co', np.array([r[:3] for r in rows], np.float32).ravel())
    a = me.attributes.new('rot', 'FLOAT_VECTOR', 'POINT'); a.data.foreach_set('vector', np.array([(0, 0, r[3]) for r in rows], np.float32).ravel())
    for k, (dt, vals) in (extra or {}).items():
        a = me.attributes.new(k, dt, 'POINT'); a.data.foreach_set('value', np.asarray(vals))
    o = bpy.data.objects.new(name, me); return link(o, c)
def gn_instancer(o, inst, pick=False, scale_attr=None):
    ng = bpy.data.node_groups.new(o.name + '_gn', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry'); ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    n = ng.nodes; L = ng.links; gi = n.new('NodeGroupInput'); go = n.new('NodeGroupOutput')
    iop = n.new('GeometryNodeInstanceOnPoints')
    if pick:
        ci = n.new('GeometryNodeCollectionInfo'); ci.inputs['Collection'].default_value = inst; ci.inputs['Separate Children'].default_value = True; ci.inputs['Reset Children'].default_value = True
        L.new(ci.outputs[0], iop.inputs['Instance']); iop.inputs['Pick Instance'].default_value = True
        na = n.new('GeometryNodeInputNamedAttribute'); na.data_type = 'INT'; na.inputs['Name'].default_value = 'var'; L.new(na.outputs['Attribute'], iop.inputs['Instance Index'])
    else:
        oi = n.new('GeometryNodeObjectInfo'); oi.inputs['Object'].default_value = inst; oi.inputs['As Instance'].default_value = True; L.new(oi.outputs['Geometry'], iop.inputs['Instance'])
    rr = n.new('GeometryNodeInputNamedAttribute'); rr.data_type = 'FLOAT_VECTOR'; rr.inputs['Name'].default_value = 'rot'
    e2r = n.new('FunctionNodeEulerToRotation'); L.new(rr.outputs['Attribute'], e2r.inputs[0]); L.new(e2r.outputs[0], iop.inputs['Rotation'])
    if scale_attr:
        sa = n.new('GeometryNodeInputNamedAttribute'); sa.data_type = 'FLOAT'; sa.inputs['Name'].default_value = scale_attr; L.new(sa.outputs['Attribute'], iop.inputs['Scale'])
    L.new(gi.outputs[0], iop.inputs['Points']); L.new(iop.outputs[0], go.inputs[0])
    md = o.modifiers.new('inst', 'NODES'); md.node_group = ng
for t in (seat_o, frame_o): gn_instancer(points_obj('seats_' + t.name, SEATS, G_SEAT), t)
mesh_obj('floor_risers', rv, rf, M['riser'], G_SEAT)

# the crowd: the posed CC0 bodies, coloured per instance from their part attribute
def people_material(name, fixed=None):
    """fixed: dict of part colours for players; otherwise palettes picked by the instance's random number"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; N_ = nt.nodes; L = nt.links
    b.inputs['Roughness'].default_value = 0.62; b.inputs['Subsurface Weight'].default_value = 0.0
    at = N_.new('ShaderNodeAttribute'); at.attribute_name = 'part'
    oi = N_.new('ShaderNodeObjectInfo')
    def ramp(cols, salt):
        mm = N_.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = salt; L.new(oi.outputs['Random'], mm.inputs[0])
        fr = N_.new('ShaderNodeMath'); fr.operation = 'FRACT'; L.new(mm.outputs[0], fr.inputs[0])
        cr = N_.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'; el = cr.color_ramp.elements
        el[0].color = (*srgb(cols[0]), 1); el[1].position = (len(cols) - 1) / len(cols); el[1].color = (*srgb(cols[-1]), 1)
        for i in range(1, len(cols) - 1): e = el.new(i / len(cols)); e.color = (*srgb(cols[i]), 1)
        L.new(fr.outputs[0], cr.inputs[0]); return cr.outputs[0]
    def const(h): rgb = N_.new('ShaderNodeRGB'); rgb.outputs[0].default_value = (*srgb(h), 1); return rgb.outputs[0]
    if fixed:
        fx = dict(trim=fixed['top'], stripe=fixed['bottom'], sole='#ecebe7'); fx.update(fixed)
        cols = [const(fx[k]) for k in ('skin', 'top', 'bottom', 'shoe', 'hair', 'sock', 'top', 'trim', 'stripe', 'sole')]
    else:
        cols = [ramp(['#f1cfb5', '#e0b08f', '#c68b65', '#a46a46', '#86553a', '#5f3b26', '#f6dcc9', '#d1a07c'], 7.13),
                ramp(['#1d2230', '#262a33', '#2f3540', '#3c414c', '#14161c', '#4a4f5a', '#5b6170', '#28324a', '#1c2a4a', '#3a2f2a', '#5a4a3c', '#7d7f86', '#d8dadf', '#eceae4', '#8a2b2b', '#1d2230', '#1d5fc9', '#f58426', '#f2f4f8', '#0b2e6b', '#262a33', '#14161c'], 13.7),
                ramp(['#1a1c22', '#23262e', '#2c3442', '#3b4a63', '#4a4136', '#15171b', '#5a5e66'], 3.31),
                ramp(['#e8e8e8', '#141414', '#2a2a2a', '#c9c2b8'], 5.9),
                ramp(['#14110f', '#2a1d14', '#3d2a1c', '#5a4030', '#8a6a42', '#c9a870', '#b8b4ac', '#14110f', '#2a1d14', '#0f1a33', '#1a1512', '#3d2a1c'], 9.7),
                ramp(['#f2f4f8', '#141414'], 2.3)]
    col = cols[0]
    for p in range(1, len(cols)):
        cmp = N_.new('ShaderNodeMath'); cmp.operation = 'COMPARE'; cmp.inputs[1].default_value = p; cmp.inputs[2].default_value = 0.5; L.new(at.outputs['Fac'], cmp.inputs[0])
        mx = N_.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(cmp.outputs[0], mx.inputs[0]); L.new(col, mx.inputs[6]); L.new(cols[p], mx.inputs[7]); col = mx.outputs[2]
    if fixed and fixed.get('img'):
        # the jersey lettering: front and back projected from the rest pose (x across, z up; front is -y)
        ra = N_.new('ShaderNodeAttribute'); ra.attribute_name = 'rest'; sp = N_.new('ShaderNodeSeparateXYZ'); L.new(ra.outputs['Vector'], sp.inputs[0])
        def mth(op, a, b_):
            n = N_.new('ShaderNodeMath'); n.operation = op
            for k, v in enumerate((a, b_)):
                if isinstance(v, (int, float)): n.inputs[k].default_value = v
                else: L.new(v, n.inputs[k])
            return n.outputs[0]
        front = mth('LESS_THAN', sp.outputs['Y'], 0.0)
        uf = mth('ADD', mth('MULTIPLY', sp.outputs['X'], 0.8), 0.25); ub = mth('SUBTRACT', 0.75, mth('MULTIPLY', sp.outputs['X'], 0.8))
        u = mth('ADD', mth('MULTIPLY', uf, front), mth('MULTIPLY', ub, mth('SUBTRACT', 1.0, front)))
        v = mth('DIVIDE', mth('SUBTRACT', sp.outputs['Z'], 0.80), 0.70)
        cmb = N_.new('ShaderNodeCombineXYZ'); L.new(u, cmb.inputs[0]); L.new(v, cmb.inputs[1])
        tx = N_.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(fixed['img'], check_existing=True); tx.extension = 'CLIP'; L.new(cmb.outputs[0], tx.inputs['Vector'])
        is_top = N_.new('ShaderNodeMath'); is_top.operation = 'COMPARE'; is_top.inputs[1].default_value = 1; is_top.inputs[2].default_value = 0.5; L.new(at.outputs['Fac'], is_top.inputs[0])
        msk = mth('MULTIPLY', tx.outputs['Alpha'], is_top.outputs[0])
        mx = N_.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(msk, mx.inputs[0]); L.new(col, mx.inputs[6]); L.new(tx.outputs['Color'], mx.inputs[7]); col = mx.outputs[2]
        b.inputs['Sheen Weight'].default_value = 0.25
    L.new(col, b.inputs['Base Color'])
    # skin gets a touch of subsurface, cloth stays matte
    sk = N_.new('ShaderNodeMath'); sk.operation = 'COMPARE'; sk.inputs[1].default_value = 0; sk.inputs[2].default_value = 0.5; L.new(at.outputs['Fac'], sk.inputs[0])
    ss_ = N_.new('ShaderNodeMath'); ss_.operation = 'MULTIPLY'; ss_.inputs[1].default_value = 0.25; L.new(sk.outputs[0], ss_.inputs[0]); L.new(ss_.outputs[0], b.inputs['Subsurface Weight'])
    rg = N_.new('ShaderNodeMapRange'); L.new(sk.outputs[0], rg.inputs[0]); rg.inputs['To Min'].default_value = 0.75; rg.inputs['To Max'].default_value = 0.45; L.new(rg.outputs[0], b.inputs['Roughness'])
    return m
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]; return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
M['people'] = people_material('people')
G_CROWDV = coll('crowd_variants', G_HIDE)
# the crowd is MLow's NEW YORKERS cast (rigged in UPGRADE ALL ROOMS 2026-10-28, frozen by cast_bake.py), on their feet
with bpy.data.libraries.load(os.path.join(WK, 'cast.blend')) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('cast_')]
CAST = {o.name: o for o in dst.objects if o}
# seated: the figures whose clothes sit cleanly; coats and dresses tear when seated, so they stand (about 5%)
SEATED_OK = ('cabbie', 'discoking', 'hustler', 'killer', 'oscar', 'tough', 'wiseguy', 'workgirl', 'writer', 'annieh', 'susan')
crowd_files = sorted(n for n in CAST if (n.split('_')[1] in SEATED_OK and '_sit' in n) or n.endswith('_stand'))
for n in crowd_files:
    o = CAST[n].copy(); o.data = CAST[n].data.copy()
    T_ = Matrix.Scale(0.92, 4) if '_sit' in n else Matrix.Translation((0, -0.16, 0)) @ Matrix.Scale(0.92, 4)
    o.data.transform(T_); o.name = 'crowd_' + n; link(o, G_CROWDV)
crowd = []
for p in SEATS:
    if random.random() < 0.955:
        off = random.uniform(-0.045, 0.045); crowd.append((p[0] + math.cos(p[3]) * off, p[1] + math.sin(p[3]) * off, p[2], p[3] + random.uniform(-0.12, 0.12), p[4]))
def _w(n):
    t = n.split('_', 2)[2]
    return {'sit': 0.30, 'sitL': 0.08, 'sitR': 0.08, 'sit_clap': 0.12, 'sit_clapL': 0.04, 'sit_clapR': 0.04, 'sit_lean': 0.10, 'sit_leanL': 0.03, 'sit_leanR': 0.03, 'stand': 0.08}.get(t, 0.02)
WTS = np.array([_w(n) for n in crowd_files]); WTS /= WTS.sum()
co = points_obj('crowd', crowd, coll('crowd'), extra={'var': ('INT', np.random.choice(len(crowd_files), len(crowd), p=WTS).astype(np.int32)), 'sc': ('FLOAT', np.random.uniform(0.88, 1.06, len(crowd)).astype(np.float32))})
gn_instancer(co, G_CROWDV, pick=True, scale_attr='sc'); print('crowd', len(crowd), 'variants', len(crowd_files))

# ---------------- the court furniture: stanchions at NBA measure, the scorer's table, the baseline boards
G_COURT = coll('court_set')
def stanchion(s):
    g = []
    base = box('st_base', (2.2, 1.6, 1.15), (s * 15.65, 0, 0.58), M['pad'], G_COURT, bevel=0.08); g.append(base)
    box('st_stripe', (0.03, 1.62, 0.16), (s * 14.53, 0, 0.2), M['orange'], G_COURT)
    lg = node_mat('padlogo', img=TEXP('pad_logo.png')); lg.node_tree.links.new(lg.node_tree.nodes['Image Texture'].outputs['Alpha'], lg.node_tree.nodes['Principled BSDF'].inputs['Alpha'])
    for yy in (0,):
        pl = mesh_obj('pad_logo', [(0, -0.5, 0.1), (0, 0.5, 0.1), (0, 0.5, 1.1), (0, -0.5, 1.1)], [(0, 1, 2, 3)], lg, G_COURT, uv=[(1, 0), (0, 0), (0, 1), (1, 1)] if s > 0 else [(0, 0), (1, 0), (1, 1), (0, 1)])
        pl.location = (s * 14.5, 0, 0); pl.rotation_euler = (0, -0.0, 0)
    box('st_col', (0.45, 0.52, 2.9), (s * 16.25, 0, 2.55), M['pad'], G_COURT, bevel=0.06)
    A, B = Vector((s * 16.25, 0, 3.9)), Vector((s * 13.32, 0, 3.45)); mid = (A + B) / 2; L = (A - B).length
    box('st_boom', (L, 0.34, 0.34), mid, M['pad'], G_COURT, rot=(0, math.atan2(-(A.z - B.z), A.x - B.x), 0), bevel=0.06)
    box('st_board', (0.035, 1.83, 1.07), (s * 13.11, 0, 3.435), M['glass'], G_COURT)
    for (w, d, h, z, y) in [(0.045, 1.83, 0.05, 3.945, 0), (0.045, 1.83, 0.05, 2.925, 0), (0.045, 0.05, 1.07, 3.435, 0.89), (0.045, 0.05, 1.07, 3.435, -0.89),
                            (0.04, 0.59, 0.05, 3.5, 0), (0.04, 0.59, 0.05, 3.075, 0), (0.04, 0.05, 0.45, 3.275, 0.27), (0.04, 0.05, 0.45, 3.275, -0.27)]:
        box('st_frame', (w, d, h), (s * 13.105, y, z), M['white'], G_COURT)
    box('st_bpad', (0.14, 1.9, 0.12), (s * 13.13, 0, 2.86), M['pad'], G_COURT, bevel=0.04)
    box('st_clock', (0.3, 0.6, 0.32), (s * 13.16, 0, 4.15), M['dark'], G_COURT)
    box('st_mount', (0.2, 0.26, 0.12), (s * 12.99, 0, 3.0), M['orange'], G_COURT)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.2366, minor_radius=0.008, major_segments=64, minor_segments=10, location=(s * 12.755, 0, 3.05))
    rim = bpy.context.active_object; rim.name = 'rim'; rim.data.materials.append(M['orange']); [cc.objects.unlink(rim) for cc in rim.users_collection]; link(rim, G_COURT)
    # the net: twelve cords down and round, as thin tubes
    cu = bpy.data.curves.new('net', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.0014
    for i in range(12):
        for sgn in (1, -1):
            sp = cu.splines.new('POLY'); sp.points.add(6)
            for k in range(7):
                t = k / 6; r = 0.225 - 0.09 * t; a = (i + sgn * t * 1.5) / 12 * math.tau; sp.points[k].co = (s * 12.755 + r * math.cos(a), r * math.sin(a), 3.04 - 0.42 * t, 1)
    no = bpy.data.objects.new('net', cu); cu.materials.append(M['net']); link(no, G_COURT)
for s in (-1, 1): stanchion(s)
box('scorers_table', (12, 0.8, 0.75), (0, -9.6, 0.375), M['dark'], G_COURT, bevel=0.02)
t = box('scorers_led', (12, 0.02, 0.6), (0, -9.19, 0.38), M['boards'], G_COURT)
for k in range(8): box('monitor', (0.5, 0.05, 0.32), (-5.0 + k * 1.4, -9.72, 0.95), M['dark'], G_COURT, rot=(-0.25, 0, 0))
for s in (-1, 1):
    box('base_board', (0.4, 10, 0.9), (s * 18.2, 0, 0.45), M['dark'], G_COURT)
    o = box('base_led', (0.02, 10, 0.78), (s * 17.99, 0, 0.45), M['boards'], G_COURT)
# courtside chairs
def chair(x, y, yaw):   # yaw is the sitter's: the rest pose faces -y, so forward is (sin yaw, -cos yaw)
    box('cs_seat', (0.46, 0.44, 0.06), (x, y, 0.46), M['seat'], G_COURT, rot=(0, 0, yaw), bevel=0.015)
    box('cs_back', (0.46, 0.05, 0.42), (x - 0.23 * math.sin(yaw), y + 0.23 * math.cos(yaw), 0.74), M['seat'], G_COURT, rot=(0, 0, yaw), bevel=0.015)
    for dx in (-0.2, 0.2): box('cs_leg', (0.025, 0.025, 0.45), (x + dx * math.cos(yaw), y + dx * math.sin(yaw), 0.22), M['seat_frame'], G_COURT, rot=(0, 0, yaw))
CS = []
for s in (-1, 1):
    for i in range(26):
        x = -14 + i * 1.1
        if s < 0 and abs(x) < 5: continue
        CS.append((x, s * 9.15, math.pi if s < 0 else 0.0)); chair(x, s * 9.15, math.pi if s < 0 else 0.0)

# ---------------- the people on the floor: players mid play, the referees, the benches, the courtside row
G_FLOORP = coll('floor_people')
HOME = {'top': '#e8e5dc', 'bottom': '#e8e5dc', 'shoe': '#14161c', 'sock': '#e8e5dc', 'hair': '#141010', 'trim': '#2962ff', 'stripe': '#173b99', 'kit': 'home'}
ROAD = {'top': '#151d2c', 'bottom': '#151d2c', 'shoe': '#f0ede5', 'sock': '#151d2c', 'hair': '#141010', 'trim': '#2962ff', 'stripe': '#d8b574', 'kit': 'away'}
REF = {'top': '#8d929c', 'bottom': '#16171b', 'shoe': '#0c0c0c', 'sock': '#16171b', 'hair': '#2a1c12'}
SKINS = ['#6b4129', '#4a2c1b', '#8d5a3b', '#c48c66', '#5e3a24', '#d9a882', '#7a4a30', '#f0cfb4']
def place(fname, x, y, yaw, cols, z=0.0, scale=1.0, name='p'):
    f = os.path.join(WK, fname + '.npz')
    if not os.path.exists(f): print('missing', f); return None
    me = person_mesh(f); o = bpy.data.objects.new(name, me); me.materials.append(people_material(name + '_m', cols)); link(o, G_FLOORP)
    o.location = (x, y, z + (0.003 if z == 0 else 0)); o.rotation_euler = (0, 0, yaw); o.scale = (scale,) * 3
    md = o.modifiers.new('sub', 'SUBSURF'); md.levels = 0; md.render_levels = 1
    # a NEW YORKERS flower head on the neck, from the cast
    neck = Vector(np.load(f)['neck'].tolist()); hd = FLOWER_HEADS[hash(name) % len(FLOWER_HEADS)]
    h = bpy.data.objects.new(name + '_head', hd); link(h, G_FLOORP); h.parent = o; h.location = neck - Vector((0, 0, 0.03)); h.scale = (0.78,) * 3
    bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.035, major_segments=24, minor_segments=10, location=neck - Vector((0, 0, 0.005))); cx_ = bpy.context.active_object; cx_.name = name + '_calyx'
    [cc.objects.unlink(cx_) for cc in cx_.users_collection]; link(cx_, G_FLOORP); cx_.data.materials.append(CALYX); cx_.data.shade_smooth(); cx_.location = cx_.location; cx_.parent = o; cx_.matrix_parent_inverse = Matrix()
    return o
def flower_heads():
    out = []
    for donor in ('cast_oscar_stand', 'cast_workgirl_stand', 'cast_cabbie_stand', 'cast_editor_stand', 'cast_killer_stand', 'cast_rosemary_stand', 'cast_hustler_stand'):
        if donor not in CAST: continue
        me = CAST[donor].data.copy(); bm_ = bmesh.new(); bm_.from_mesh(me); H = max(v.co.z for v in bm_.verts)
        cut = H * 0.735; bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if v.co.z < cut], context='VERTS')
        if not bm_.verts: bm_.free(); continue
        zs = [v.co.z for v in bm_.verts]; low = min(zs); cxy = Vector((sum(v.co.x for v in bm_.verts) / len(zs), sum(v.co.y for v in bm_.verts) / len(zs), 0))
        # the stem: put the bottom of the flower's own neck at the origin
        neckz = cut + 0.0; bmesh.ops.translate(bm_, vec=Vector((-cxy.x, -cxy.y, -neckz)), verts=bm_.verts); bm_.to_mesh(me); bm_.free(); out.append(me)
    return out
CALYX = node_mat('calyx', (0.11, 0.16, 0.09), 0.5)
FLOWER_HEADS = flower_heads(); print('flower heads', len(FLOWER_HEADS))
def face(x, y, tx, ty): return math.atan2(-(tx - x), (ty - y)) + math.pi   # rest pose faces -y
# a home possession at the east basket: the shooter rises at the right wing, a hand in his face
RIM = (12.755, 0)
plays = [  # pose, x, y, team, look-at
    ('shoot', 6.6, 3.6, HOME, RIM, 0.42), ('contest', 7.25, 3.15, ROAD, (6.6, 3.6), 0.18), ('boxout', 11.0, -0.9, HOME, RIM, 0), ('boxout', 10.25, -1.2, ROAD, (14, -0.5), 0),
    ('ready', 4.8, -5.4, HOME, (6.6, 3.6), 0), ('closeout', 5.9, -4.4, ROAD, (4.8, -5.4), 0), ('cut', 12.0, 4.7, HOME, RIM, 0), ('ready', 11.6, 2.6, ROAD, (12.0, 4.7), 0),
    ('gather', 1.6, 1.4, HOME, (6.6, 3.6), 0), ('defend', 3.0, 1.0, ROAD, (1.6, 1.4), 0),
]
for i, (pz, x, y, cols, tgt, jump) in enumerate(plays):
    c = dict(cols, skin=SKINS[i % len(SKINS)], img=TEXP(f"jersey_{cols['kit']}_{i // 2}.png")); place(f'pose_m_{pz}_jersey', x, y, face(x, y, *tgt), c, z=jump, scale=1.13 + (i % 3) * 0.03, name=f'player{i}')
for i, (x, y) in enumerate([(15.2, -5.2), (4.0, -8.1), (8.5, 8.1)]):
    place('pose_m_stand_suit', x, y, face(x, y, 8, 1), dict(REF, skin=SKINS[(i + 3) % 8]), scale=1.02, name=f'ref{i}')
bench = [(x, -9.15) for x in [-12.9, -11.8, -10.7, -9.6, -8.5, -7.4, -6.3]] + [(x, -9.15) for x in [6.9, 8.0, 9.1, 10.2, 11.3, 12.4, 13.5]]
for i, (x, y) in enumerate(bench):
    cols = dict(HOME if x < 0 else ROAD, skin=SKINS[(i * 3) % 8]); cols['top'] = '#173b99' if x < 0 else '#0d121c'; cols['trim'] = '#2962ff'
    chair(x, y, math.pi) if False else None; place('pose_m_sit_jersey', x, y, math.pi, cols, z=-0.345, scale=1.08, name=f'bench{i}')
# the courtside row on the far side (the near side is the benches and the table)
for i, (x, y, yaw) in enumerate(CS):
    if y < 0 or random.random() < 0.12: continue
    n = random.choice([k for k in crowd_files if '_sit' in k]); o = bpy.data.objects.new(f'cs{i}', CAST[n].data); link(o, G_FLOORP)
    o.location = (x, y, -0.06); o.rotation_euler = (0, 0, yaw); o.scale = (0.92,) * 3
# courtside working clutter: towels and bottles at the benches, water coolers, broadcast cameras on tripods, photographers
towel = node_mat('towel', (0.85, 0.86, 0.88), 0.95); bottle = node_mat('bottle', (0.16, 0.38, 0.95), 0.2, trans=0.6); cooler = node_mat('cooler', (0.09, 0.23, 0.6), 0.4)
crng = random.Random(9)
for (x, y) in bench:
    if crng.random() < 0.7: box('towel', (0.42, 0.3, 0.03), (x + crng.uniform(-0.1, 0.1), y + 0.05, 0.5), towel, G_COURT, rot=(0, 0, crng.uniform(-0.4, 0.4)))
    for k in range(crng.randint(0, 2)): cyl('bottle', 0.035, 0.24, (x + crng.uniform(-0.25, 0.25), y - 0.35, 0.12), bottle, G_COURT, verts=10)
for x in (-14.2, -5.6, 5.6, 14.2):
    cyl('cooler', 0.2, 0.55, (x, -9.6, 0.28), cooler, G_COURT, verts=20); cyl('cooler_lid', 0.21, 0.06, (x, -9.6, 0.58), M['white'], G_COURT, verts=20)
def tvcam(x, y, yaw, h=1.55):
    for k in range(3):
        a_ = yaw + k * math.tau / 3; cyl('tripod', 0.02, 1.55, (x + 0.3 * math.cos(a_), y + 0.3 * math.sin(a_), 0.75), M['black_steel'], G_COURT, rot=(0.2 * math.sin(a_ - yaw), -0.2 * math.cos(a_ - yaw), 0), verts=6)
    box('tvcam_body', (0.24, 0.55, 0.3), (x, y, h), M['dark'], G_COURT, rot=(0, 0, yaw), bevel=0.02)
    cyl('tvcam_lens', 0.09, 0.45, (x - 0.45 * math.sin(yaw), y + 0.45 * math.cos(yaw), h), M['black_steel'], G_COURT, rot=(math.pi / 2, 0, yaw), verts=16)
for (x, y) in ((16.9, 7.0), (16.9, -7.0), (-16.9, 7.0), (-16.9, -7.0)): tvcam(x, y, math.atan2(-(0 - x), (0 - y)) + math.pi)
# photographers: cast figures sitting low on the baseline, a camera with a long lens at the face
for k, (x, y) in enumerate([(15.4, z_) for z_ in (-5.6, -4.2, -2.8, 2.8, 4.2, 5.6)] + [(-15.4, z_) for z_ in (-5.6, -4.2, -2.8, 2.8, 4.2, 5.6)]):
    n = crng.choice([q for q in crowd_files if q.endswith('_sit_lean')]); o = bpy.data.objects.new(f'photo{k}', CAST[n].data); link(o, G_FLOORP)
    yaw = math.atan2(-(0 - x), (0 - y)) + math.pi; o.location = (x, y, -0.36); o.rotation_euler = (0, 0, yaw); o.scale = (0.92,) * 3
    fx, fy = math.sin(yaw), -math.cos(yaw); cyl('photo_lens', 0.05, 0.32, (x + fx * 0.42, y + fy * 0.42, 0.95), M['black_steel'], G_COURT, rot=(math.pi / 2, 0, yaw), verts=12)
# the ball, at the top of the shot
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1195, segments=48, ring_count=24, location=(7.15, 3.35, 3.55)); ball = bpy.context.active_object; ball.name = 'ball'; ball.data.shade_smooth()
bm_ = node_mat('ball', (0.55, 0.16, 0.035), 0.62); nt = bm_.node_tree; tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
def _m(op, a, b_=None):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    for k, v in enumerate((a, b_)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[k].default_value = v
        else: nt.links.new(v, n.inputs[k])
    return n.outputs[0]
ln = _m('MINIMUM', _m('MINIMUM', _m('ABSOLUTE', sep.outputs['X']), _m('ABSOLUTE', sep.outputs['Y'])), _m('ABSOLUTE', _m('SUBTRACT', _m('ABSOLUTE', sep.outputs['Z']), _m('MULTIPLY', _m('ABSOLUTE', sep.outputs['X']), 0.9))))
mask = _m('LESS_THAN', ln, 0.004); mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; nt.links.new(mask, mx.inputs[0]); mx.inputs[6].default_value = (0.55, 0.16, 0.035, 1); mx.inputs[7].default_value = (0.02, 0.015, 0.012, 1)
nt.links.new(mx.outputs[2], nt.nodes['Principled BSDF'].inputs['Base Color'])
pz = nt.nodes.new('ShaderNodeTexVoronoi'); pz.inputs['Scale'].default_value = 900; bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.25; nt.links.new(pz.outputs['Distance'], bp.inputs['Height']); nt.links.new(bp.outputs[0], nt.nodes['Principled BSDF'].inputs['Normal'])
ball.data.materials.append(bm_); [cc.objects.unlink(ball) for cc in ball.users_collection]; link(ball, G_COURT)

# ---------------- the roof: the dish of dark panels, 48 ribs, two catwalks, sports lights, the scoreboard
G_ROOF = coll('roof')
def dish():
    R = DRUM_IN - 0.5; MM, RS = 192, 40; verts, faces, uv = [], [], []
    for j in range(RS + 1):
        r = HUB_R + (R - HUB_R) * j / RS
        for i in range(MM): a = i / MM * math.tau; verts.append((math.cos(a) * r, math.sin(a) * r, ceil_z(r))); uv.append((i / MM, j / RS))
    for j in range(RS):
        for i in range(MM): a = j * MM + i; b = j * MM + (i + 1) % MM; faces.append((a, a + MM, b + MM, b))
    return mesh_obj('ceiling', verts, faces, M['ceiling'], G_ROOF)
dish()
for i in range(48):
    a = i / 48 * math.tau; r0, r1 = HUB_R, DRUM_IN - 0.6; n = 24
    cu = bpy.data.curves.new(f'rib{i}', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.12; sp = cu.splines.new('POLY'); sp.points.add(n - 1)
    for k in range(n): r = r0 + (r1 - r0) * k / (n - 1); sp.points[k].co = (math.cos(a) * r, math.sin(a) * r, ceil_z(r) - 0.25, 1)
    o = bpy.data.objects.new(f'rib{i}', cu); cu.materials.append(node_mat('rib', (0.32, 0.34, 0.38), 0.6, 0.5) if i == 0 else bpy.data.materials['rib']); link(o, G_ROOF)
# 28 radial trusses, 1.5 m deep, chords and diagonals, three ring ties
tr = bpy.data.curves.new('trusses', 'CURVE'); tr.dimensions = '3D'; tr.bevel_depth = 0.075; tr.bevel_resolution = 1
def _poly(pts):
    sp = tr.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for k, p in enumerate(pts): sp.points[k].co = (*p, 1)
for i in range(28):
    a = (i + 0.5) / 28 * math.tau; ca, sa = math.cos(a), math.sin(a); rr = np.linspace(7, DRUM_IN - 2, 22)
    top = [(ca * r, sa * r, ceil_z(r) - 0.35) for r in rr]; bot = [(ca * r, sa * r, ceil_z(r) - 1.85) for r in rr]
    _poly(top); _poly(bot); _poly([top[k] if k % 2 == 0 else bot[k] for k in range(len(rr))])
for r in (14, 30, 48): _poly([(math.cos(t) * r, math.sin(t) * r, ceil_z(r) - 1.85) for t in np.linspace(0, math.tau, 97)])
ot = bpy.data.objects.new('trusses', tr); tr.materials.append(node_mat('truss', (0.016, 0.018, 0.022), 0.6, 0.4)); link(ot, G_ROOF)
FIX = []
for r, nfix in ((22, 64), (38, 80)):
    z = ceil_z(r) - 1.6
    for dz in (0, -0.9):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.07, major_segments=192, minor_segments=6, location=(0, 0, z + dz)); t = bpy.context.active_object; t.data.materials.append(M['black_steel']); [cc.objects.unlink(t) for cc in t.users_collection]; link(t, G_ROOF)
    for i in range(nfix):
        a = (i + 0.5) / nfix * math.tau; x, y = math.cos(a) * (r + 0.45), math.sin(a) * (r + 0.45)
        tilt = math.atan2(r, z) * 0.7
        o = box('fixture', (0.62, 0.5, 0.32), (x, y, z - 1.25), M['black_steel'], G_ROOF, rot=(0, 0, a))
        lens = box('lens', (0.52, 0.42, 0.02), (x, y, z - 1.42), M['fixture'], G_ROOF, rot=(0, 0, a))
# the scoreboard: four LED faces in black bezels, a ring above, a slanted ring below
G_SB = coll('scoreboard'); SBZ = 21.0; SW, SD, SH = 24.0, 16.0, 11.0   # twice the old board: the faces are 24 x 11 and 16 x 11 m
box('sb_body', (SW + 0.4, SD + 0.4, SH + 0.4), (0, 0, SBZ), M['dark'], G_SB)
def face_plane(name, w, h, loc, rot, img, strength=3.2):
    mat = node_mat(name + '_m', img=img, img_emit=True, estr=strength, rough=0.25)
    o = mesh_obj(name, [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)], [(0, 1, 2, 3)], mat, G_SB, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    o.location = loc; o.rotation_euler = rot; return o
face_plane('sb_long_s', SW, SH, (0, -SD / 2 - 0.22, SBZ), (0, 0, 0), TEXP('sb_long0.jpg'))
face_plane('sb_long_n', SW, SH, (0, SD / 2 + 0.22, SBZ), (0, 0, math.pi), TEXP('sb_long1.jpg'))
face_plane('sb_end_e', SD, SH, (SW / 2 + 0.22, 0, SBZ), (0, 0, math.pi / 2), TEXP('sb_end.jpg'))
face_plane('sb_end_w', SD, SH, (-SW / 2 - 0.22, 0, SBZ), (0, 0, -math.pi / 2), TEXP('sb_end.jpg'))
for sgn in (-1, 1):   # black bezels
    box('sb_bez', (SW + 0.6, 0.2, 0.25), (0, sgn * (SD / 2 + 0.25), SBZ + SH / 2 + 0.1), M['black_steel'], G_SB); box('sb_bez', (SW + 0.6, 0.2, 0.25), (0, sgn * (SD / 2 + 0.25), SBZ - SH / 2 - 0.1), M['black_steel'], G_SB)
def ring(name, r_top, r_bot, z_top, z_bot, mat, seg=160, rep=8):
    verts, faces, uv = [], [], []
    for i in range(seg + 1):
        a = i / seg * math.tau; verts += [(math.cos(a) * r_top, math.sin(a) * r_top, z_top), (math.cos(a) * r_bot, math.sin(a) * r_bot, z_bot)]; uv += [(i / seg * rep, 1), (i / seg * rep, 0)]
    for i in range(seg): faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    return mesh_obj(name, verts, faces, mat, G_SB, uv=uv)
ring('sb_top_ring', 15.2, 15.2, SBZ + 7.2, SBZ + 5.6, M['ribbon'], rep=round(2 * math.pi * 15.2 / (1.6 * 16)))
ring('sb_low_ring', 14.2, 10.8, SBZ - 6.0, SBZ - 8.6, M['ribbon'], rep=round(2 * math.pi * 12.5 / (3.2 * 16)))
# the belly: a round screen under the board, the logo looking down at centre court
belly = node_mat('belly', img=TEXP('sb_belly.jpg'), img_emit=True, estr=1.1, rough=0.45)
bv = [(0, 0, SBZ - 8.65)] + [(math.cos(i / 96 * math.tau) * 10.8, math.sin(i / 96 * math.tau) * 10.8, SBZ - 8.65) for i in range(96)]
buv = [(0.5, 0.5)] + [(0.5 - 0.5 * math.cos(i / 96 * math.tau), 0.5 + 0.5 * math.sin(i / 96 * math.tau)) for i in range(96)]
mesh_obj('sb_belly', bv, [(0, (i + 1) % 96 + 1, i + 1) for i in range(96)], belly, G_SB, uv=buv)
for x, y in ((-11, -7), (11, -7), (-11, 7), (11, 7), (0, -7.6), (0, 7.6), (-11.6, 0), (11.6, 0)):
    cyl('sb_cable', 0.05, ROOF_RIM - SBZ - 5.5, (x, y, (ROOF_RIM + SBZ + 5.5) / 2), M['steel'], G_SB, verts=8); box('sb_clevis', (0.35, 0.35, 0.4), (x, y, SBZ + SH / 2 + 0.4), M['black_steel'], G_SB)
seam = node_mat('seam', (0.012, 0.013, 0.016), 0.5)
for sgn in (-1, 1):
    for k in range(13): box('sb_seam', (0.02, 0.03, SH), (-SW / 2 + k * SW / 12, sgn * (SD / 2 + 0.235), SBZ), seam, G_SB)
    for k in range(1, 5): box('sb_seam', (SW, 0.03, 0.018), (0, sgn * (SD / 2 + 0.235), SBZ - SH / 2 + k * SH / 5), seam, G_SB)
    for k in range(9): box('sb_seam', (0.03, 0.02, SH), (sgn * (SW / 2 + 0.235), -SD / 2 + k * SD / 8, SBZ), seam, G_SB)
    box('sb_ledge', (SW + 1.0, 0.45, 0.12), (0, sgn * (SD / 2 + 0.5), SBZ + SH / 2 + 0.3), M['black_steel'], G_SB)
    box('sb_ledge_rail', (SW + 1.0, 0.03, 0.9), (0, sgn * (SD / 2 + 0.7), SBZ + SH / 2 + 0.8), M['steel'], G_SB)
# ---------------- the big wall screens: two over the long sides above the suites, two curved over the ends
G_WALL = coll('wall_screens'); WZ0, WZ1 = BACK_TOP + 4.6, BACK_TOP + 12.2
for sgn, img in ((-1, 'wall_side0.jpg'), (1, 'wall_side1.jpg')):
    yy = sgn * (FR + BACK + 0.35); w_ = 30.0
    mesh_obj('wall_side', [(-w_ / 2, yy, WZ0), (w_ / 2, yy, WZ0), (w_ / 2, yy, WZ1), (-w_ / 2, yy, WZ1)], [(0, 1, 2, 3)] if sgn > 0 else [(3, 2, 1, 0)], node_mat('wall_' + img, img=TEXP(img), img_emit=True, estr=2.4), G_WALL,
             uv=[(0, 0), (1, 0), (1, 1), (0, 1)] if sgn < 0 else [(1, 0), (0, 0), (0, 1), (1, 1)])
    box('wall_bez', (w_ + 0.8, 0.3, WZ1 - WZ0 + 0.8), (0, yy + sgn * 0.2, (WZ0 + WZ1) / 2), M['black_steel'], G_WALL)
P_end = perim(BACK + 0.3)
for c0 in (0.0, 0.5):
    sweep('wall_end', [(BACK + 0.3, WZ0), (BACK + 0.3, WZ1)], node_mat('wall_end_' + str(c0), img=TEXP('wall_end.jpg'), img_emit=True, estr=2.4), G_WALL, N=160, s0=c0 - 0.125, s1=c0 + 0.125, u_scale=1 / (0.25 * P_end))


# ---------------- the rafters: the retired banners over each end, cloth with a slight hang
G_BAN = coll('banners')
def banner(img, x, y, yaw, z):
    mat = node_mat('ban_' + os.path.basename(img), img=img, rough=0.85, normal_img=os.path.join(ROOT, 'site', 'assets', 'tex', 'fabric_n.jpg'), nstr=0.5, nrep=(3, 6))
    bm = bmesh.new(); W_, H_ = 2.5, 5.0; nx_, nz_ = 6, 16; vs = []
    for j in range(nz_ + 1):
        for i in range(nx_ + 1):
            u, v = i / nx_, j / nz_; sag = 0.06 * math.sin(u * math.pi) * (1 - v) + 0.03 * math.sin(v * 7 + x) * (1 - v)
            vs.append(bm.verts.new((u * W_ - W_ / 2, sag, v * H_ - H_ / 2)))
    uvl = bm.loops.layers.uv.new('UVMap')
    for j in range(nz_):
        for i in range(nx_):
            a = j * (nx_ + 1) + i; f = bm.faces.new((vs[a], vs[a + 1], vs[a + nx_ + 2], vs[a + nx_ + 1]))
            for lp, (uu, vv) in zip(f.loops, [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]): lp[uvl].uv = (uu / nx_, vv / nz_)
    me = bpy.data.meshes.new('banner'); bm.to_mesh(me); bm.free(); me.shade_smooth(); me.materials.append(mat)
    o = bpy.data.objects.new('banner', me); o.location = (x, y, z); o.rotation_euler = (0, 0, yaw); link(o, G_BAN)
    sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.01
    bar = cyl('ban_bar', 0.035, 2.7, (x, y, z + 2.56), M['black_steel'], G_BAN, rot=(0, math.pi / 2, yaw), verts=8)
    top = ceil_z(math.hypot(x, y)) - 1.7; L = top - (z + 2.56)
    for sgn in (-1, 1): cyl('ban_wire', 0.008, L, (x + sgn * 1.1 * math.cos(yaw), y + sgn * 1.1 * math.sin(yaw), z + 2.56 + L / 2), M['steel'], G_BAN, verts=4)
west = sorted(glob.glob(TEXP('banner_w*.jpg'))); east = sorted(glob.glob(TEXP('banner_e*.jpg')))
for i, f in enumerate(west):
    a = math.pi + (i - (len(west) - 1) / 2) * 0.112; x, y = -16 + math.cos(a) * 21.5, math.sin(a) * 21.5
    banner(f, x, y, a - math.pi / 2, 21.6 + abs(i - (len(west) - 1) / 2) * 0.06)
for i, f in enumerate(east):
    a = (i - (len(east) - 1) / 2) * 0.094; x, y = 16 + math.cos(a) * 22.5, math.sin(a) * 22.5
    banner(f, x, y, a - math.pi / 2, 21.6 + abs(i - (len(east) - 1) / 2) * 0.05)
# the Firefly banners over the long sides
for i in range(4):
    f = os.path.join(ROOT, 'site', 'assets', 'ff', f'banner_{i + 1}.webp')
    if os.path.exists(f):
        for s in (-1, 1): banner(f, (i - 1.5) * 7.5, s * 27, 0 if s > 0 else math.pi, ROOF_RIM - 8)

# ---------------- the bridges: two decks hung over the upper bowl on rods
G_BR = coll('bridges')
for s in (-1, 1):
    box('bridge_deck', (71, 3.35, 0.35), (0, s * 35, 24), M['dark'], G_BR)
    box('bridge_glass', (71, 0.03, 1.1), (0, s * 35 - s * 1.65, 24.7), M['rail_glass'], G_BR)
    box('bridge_glass2', (71, 0.03, 1.1), (0, s * 35 + s * 1.65, 24.7), M['rail_glass'], G_BR)
    box('bridge_led', (71, 0.02, 0.25), (0, s * 35 - s * 1.69, 23.95), M['ribbon'], G_BR)
    for x in np.linspace(-34, 34, 12):
        cyl('bridge_rod', 0.03, ceil_z(math.hypot(x, 35)) - 24.2, (x, s * 35 - s * 1.6, (ceil_z(math.hypot(x, 35)) + 24.2) / 2), M['steel'], G_BR, verts=6)

# ---------------- light: the house is a bright court under the LED fixtures and a dimmer bowl
G_L = coll('lights')
def area(name, size, loc, power, color=(1, 0.97, 0.92), rot=(0, 0, 0), spread=None):
    l = bpy.data.lights.new(name, 'AREA'); l.shape = 'RECTANGLE'; l.size, l.size_y = size; l.energy = power; l.color = color
    if spread: l.spread = spread
    o = bpy.data.objects.new(name, l); o.location = loc; o.rotation_euler = rot; link(o, G_L); return o
def spot(name, loc, tgt, power, cone, blend, color, radius=0.12):
    l = bpy.data.lights.new(name, 'SPOT'); l.energy = power; l.spot_size = math.radians(cone); l.spot_blend = blend; l.color = color; l.shadow_soft_size = radius
    o = bpy.data.objects.new(name, l); o.location = loc; o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); link(o, G_L); return o
K5000, K4200, K3700 = (1.0, 0.93, 0.86), (1.0, 0.86, 0.72), (1.0, 0.8, 0.62)
LP = float(os.environ.get('GARDEN_LIGHT', '1.0'))
rng_l = random.Random(5)
# 48 sideline sports lights in two banks, each aimed across at the far half of the court
for sy in (-1, 1):
    for xi in range(12):
        x = -23 + xi * (46 / 11)
        for h in (23, 25):
            tgt = (x * 0.55 + rng_l.uniform(-2, 2), -sy * rng_l.uniform(1.5, 6.5), 1.4)
            spot(f'side{sy}{xi}{h}', (x, sy * 15, h), tgt, 2600 * LP * (1.25 if sy < 0 else 0.85) * 1.2, 32, 0.45, K5000, 0.10)
# 16 end lights
for sx in (-1, 1):
    for y in (-9, -3, 3, 9):
        for h in (23, 25):
            spot(f'end{sx}{y}{h}', (sx * 23, y, h), (-sx * rng_l.uniform(2, 9), y * 0.5, 0), 1900 * LP, 45, 0.3, K5000)
# 48 bowl fixtures aimed into the seats, warmer and broad
for k in range(48):
    s_ = (k + 0.5) / 48; x, y, nx, ny = stadium(s_, 14); tx, ty, _, _ = stadium(s_, 22)
    spot(f'bowl{k}', (x * 0.75, y * 0.75, 27), (tx, ty, 9), 1125 * LP, 75, 0.5, K4200, 0.4)
# 32 service lights on stairs, bridges and structure
for k in range(32):
    s_ = (k + 0.25) / 32; x, y, _, _ = stadium(s_, 26); spot(f'svc{k}', (x * 0.9, y * 0.9, 30), (x, y, 18), 300 * LP, 70, 0.5, K3700, 0.3)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.012, 0.02, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.5

# ---------------- haze: the air in a full arena, thin enough to keep the far side, thick enough to show the light
vol = node_mat('haze'); nt = vol.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF']); pv = nt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = 0.00028
pv.inputs['Anisotropy'].default_value = 0.55; pv.inputs['Color'].default_value = (0.85, 0.88, 0.95, 1); nt.links.new(pv.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
hz = box('haze', (150, 110, 40), (0, 0, 19.5), vol); hz.visible_shadow = False
# ---------------- cameras
CAMS = {
    'upper':      ((-22, -38.5, 18.5), (5, 1, 1.0), 32),
    'courtside':  ((-1.0, -8.6, 1.2), (10, 3.0, 2.1), 40),
    'baseline':   ((17.6, -4.6, 1.05), (4, 2.5, 2.2), 28),
    'rafters':    ((-6, 4, 1.7), (-36, -2, 23), 20),
    'bridge':     ((-12, -33.0, 25.8), (4, -2, 0), 24),
    'scoreboard': ((-16, -9, 4), (0, 0, 20), 22),
    'crowdcheck': ((0, -10.5, 3.5), (0, -20, 5), 35),
    'east':       ((-47, -5, 12.5), (14, 0, 9), 26),
    'broadcast':  ((2, -24.5, 9.5), (7, 1, 1.4), 50),
    'baseline85': ((18.8, -4.2, 1.1), (7.0, 3.3, 2.0), 85),
    'rimcam':     ((13.6, -1.9, 4.3), (8.0, 2.6, 0.8), 20),
}
def add_cam(name, loc, tgt, lens):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_end = 900; o = bpy.data.objects.new(name, cd); o.location = loc
    d = Vector(tgt) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); link(o); return o
for k, (l, t, f) in CAMS.items(): add_cam('cam_' + k, l, t, f)
DOF = {'courtside': (6.6, 3.6, 2.4, 8.0), 'baseline': (7.0, 3.3, 2.4, 3.2), 'crowdcheck': (0, -14, 5, 4), 'baseline85': (6.6, 3.6, 2.3, 3.5), 'broadcast': (7, 1, 1.4, 8)}
for k, (x, y, z, f) in DOF.items():
    cam = bpy.data.objects['cam_' + k]; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (Vector((x, y, z)) - cam.location).length; cam.data.dof.aperture_fstop = f

# ---------------- render
sc.render.engine = 'CYCLES'; prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'; sc.cycles.samples = 256 if MODE == 'full' else 64; sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 8; sc.cycles.glossy_bounces = 4; sc.cycles.transmission_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = float(os.environ.get('GARDEN_EV', '0.15'))
sc.render.resolution_x, sc.render.resolution_y = (2560, 1440) if MODE == 'full' else (1280, 720)
sc.render.image_settings.file_format = 'PNG'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WK, 'garden.blend'))
for v in (VIEWS or list(CAMS)):
    sc.camera = bpy.data.objects['cam_' + v]; sc.render.filepath = os.path.join(OUTR, f'{v}_{MODE}.png'); bpy.ops.render.render(write_still=True); print('rendered', v)
