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
M['glass'] = node_mat('glass', (0.9, 0.95, 1.0), 0.02, trans=1.0, ior=1.5)
M['rail_glass'] = node_mat('rail_glass', (0.85, 0.9, 0.95), 0.05, trans=0.92, ior=1.5)
M['seat'] = node_mat('seat', (0.022, 0.03, 0.06), 0.42, coat=0.2)
M['seat_frame'] = node_mat('seat_frame', (0.05, 0.05, 0.055), 0.4, 0.8)
M['pad'] = node_mat('pad', (0.03, 0.06, 0.16), 0.55)
M['white'] = node_mat('white', (0.85, 0.86, 0.88), 0.35)
M['orange'] = node_mat('orange', (0.9, 0.22, 0.03), 0.35, 0.6)
M['net'] = node_mat('net', (0.92, 0.92, 0.92), 0.8)
M['court'] = node_mat('court', img=TEXP('court.jpg'), rough=0.16, coat=0.55, normal_img=os.path.join(PH, 'laminate_floor_02_n.jpg'), nstr=0.12, nrep=(72, 40))
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
cx0, cx1, cy0, cy1 = -17.4, 17.4, -10.2, 10.2; U_ = lambda x: (x + fw / 2) / fw; V_ = lambda y: 1 - (y + fd / 2) / fd
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
    if fixed: cols = [const(fixed[k]) for k in ('skin', 'top', 'bottom', 'shoe', 'hair', 'sock')]
    else:
        cols = [ramp(['#f1cfb5', '#e0b08f', '#c68b65', '#a46a46', '#86553a', '#5f3b26', '#f6dcc9', '#d1a07c'], 7.13),
                ramp(['#1d2230', '#262a33', '#2f3540', '#3c414c', '#14161c', '#4a4f5a', '#5b6170', '#28324a', '#1c2a4a', '#3a2f2a', '#5a4a3c', '#7d7f86', '#d8dadf', '#eceae4', '#8a2b2b', '#1d2230', '#1d5fc9', '#f58426', '#f2f4f8', '#0b2e6b', '#262a33', '#14161c'], 13.7),
                ramp(['#1a1c22', '#23262e', '#2c3442', '#3b4a63', '#4a4136', '#15171b', '#5a5e66'], 3.31),
                ramp(['#e8e8e8', '#141414', '#2a2a2a', '#c9c2b8'], 5.9),
                ramp(['#14110f', '#2a1d14', '#3d2a1c', '#5a4030', '#8a6a42', '#c9a870', '#b8b4ac', '#14110f', '#2a1d14', '#0f1a33', '#1a1512', '#3d2a1c'], 9.7),
                ramp(['#f2f4f8', '#141414'], 2.3)]
    col = cols[0]
    for p in range(1, 6):
        cmp = N_.new('ShaderNodeMath'); cmp.operation = 'COMPARE'; cmp.inputs[1].default_value = p; cmp.inputs[2].default_value = 0.5; L.new(at.outputs['Fac'], cmp.inputs[0])
        mx = N_.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(cmp.outputs[0], mx.inputs[0]); L.new(col, mx.inputs[6]); L.new(cols[p], mx.inputs[7]); col = mx.outputs[2]
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
crowd_files = sorted(f for f in glob.glob(os.path.join(WK, 'pose_*_sit*.npz')) if 'jersey' not in f)
SIT_DROP = {'m': -0.345, 'f': -0.335}
for f in crowd_files:
    me = person_mesh(f); bm_ = bmesh.new(); bm_.from_mesh(me); g = os.path.basename(f).split('_')[1]
    bmesh.ops.translate(bm_, vec=Vector((0, 0.06, SIT_DROP[g])), verts=bm_.verts); bm_.to_mesh(me); bm_.free(); me.materials.append(M['people'])
    link(bpy.data.objects.new(os.path.basename(f)[:-4], me), G_CROWDV)
crowd = [p for p in SEATS if random.random() < (0.93 if p[4] else 0.88)]
if MODE == 'qa': crowd = crowd[::1]
WTS = np.array([0.25 if 'cheer' in f else 0.6 if 'lean' in f or 'phone' in f or 'suit' in f else 1.0 for f in crowd_files]); WTS /= WTS.sum()
co = points_obj('crowd', crowd, coll('crowd'), extra={'var': ('INT', np.random.choice(len(crowd_files), len(crowd), p=WTS).astype(np.int32)), 'sc': ('FLOAT', np.random.uniform(0.94, 1.08, len(crowd)).astype(np.float32))})
gn_instancer(co, G_CROWDV, pick=True, scale_attr='sc'); print('crowd', len(crowd), 'variants', len(crowd_files))

# ---------------- the court furniture: stanchions at NBA measure, the scorer's table, the baseline boards
G_COURT = coll('court_set')
def stanchion(s):
    g = []
    base = box('st_base', (2.2, 1.6, 1.15), (s * 15.65, 0, 0.58), M['pad'], G_COURT, bevel=0.08); g.append(base)
    box('st_stripe', (0.03, 1.62, 0.16), (s * 14.53, 0, 0.2), M['orange'], G_COURT)
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
    bpy.ops.mesh.primitive_torus_add(major_radius=0.2286, minor_radius=0.0095, major_segments=48, minor_segments=10, location=(s * 12.755, 0, 3.05))
    rim = bpy.context.active_object; rim.name = 'rim'; rim.data.materials.append(M['orange']); [cc.objects.unlink(rim) for cc in rim.users_collection]; link(rim, G_COURT)
    # the net: twelve cords down and round, as thin tubes
    cu = bpy.data.curves.new('net', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.004
    for i in range(12):
        for sgn in (1, -1):
            sp = cu.splines.new('POLY'); sp.points.add(6)
            for k in range(7):
                t = k / 6; r = 0.225 - 0.09 * t; a = (i + sgn * t * 1.5) / 12 * math.tau; sp.points[k].co = (s * 12.755 + r * math.cos(a), r * math.sin(a), 3.04 - 0.42 * t, 1)
    no = bpy.data.objects.new('net', cu); cu.materials.append(M['net']); link(no, G_COURT)
for s in (-1, 1): stanchion(s)
box('scorers_table', (9, 0.8, 0.78), (0, -9.6, 0.39), M['dark'], G_COURT, bevel=0.02)
t = box('scorers_led', (9, 0.02, 0.62), (0, -9.19, 0.4), M['boards'], G_COURT)
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
HOME = {'top': '#f2f4f8', 'bottom': '#dde1e8', 'shoe': '#1b1d24', 'sock': '#f2f4f8', 'hair': '#141010'}
ROAD = {'top': '#a3202b', 'bottom': '#86171f', 'shoe': '#efefef', 'sock': '#141414', 'hair': '#141010'}
REF = {'top': '#8d929c', 'bottom': '#16171b', 'shoe': '#0c0c0c', 'sock': '#16171b', 'hair': '#2a1c12'}
SKINS = ['#6b4129', '#4a2c1b', '#8d5a3b', '#c48c66', '#5e3a24', '#d9a882', '#7a4a30', '#f0cfb4']
def place(fname, x, y, yaw, cols, z=0.0, scale=1.0, name='p'):
    f = os.path.join(WK, fname + '.npz')
    if not os.path.exists(f): print('missing', f); return None
    me = person_mesh(f); o = bpy.data.objects.new(name, me); me.materials.append(people_material(name + '_m', cols)); link(o, G_FLOORP)
    o.location = (x, y, z); o.rotation_euler = (0, 0, yaw); o.scale = (scale,) * 3
    md = o.modifiers.new('sub', 'SUBSURF'); md.levels = 0; md.render_levels = 1; return o
def face(x, y, tx, ty): return math.atan2(-(tx - x), (ty - y)) + math.pi   # rest pose faces -y
# a home possession at the east basket: the shooter rises at the right wing, a hand in his face
RIM = (12.755, 0)
plays = [  # pose, x, y, team, look-at
    ('shoot', 6.6, 3.6, HOME, RIM, 0.42), ('defend', 7.3, 3.2, ROAD, (6.6, 3.6), 0), ('run', 10.6, -1.6, HOME, RIM, 0), ('defend', 11.4, -0.8, ROAD, (10.6, -1.6), 0),
    ('ready', 4.4, -5.6, HOME, (6.6, 3.6), 0), ('defend', 5.6, -4.6, ROAD, (4.4, -5.6), 0), ('run2', 12.2, 4.9, HOME, RIM, 0), ('ready', 11.8, 2.8, ROAD, RIM, 0),
    ('stand', 1.2, 1.2, HOME, (6.6, 3.6), 0), ('ready', 3.0, 1.0, ROAD, (6.6, 3.6), 0),
]
for i, (pz, x, y, cols, tgt, jump) in enumerate(plays):
    c = dict(cols, skin=SKINS[i % len(SKINS)]); place(f'pose_m_{pz}_jersey', x, y, face(x, y, *tgt), c, z=jump, scale=1.13 + (i % 3) * 0.03, name=f'player{i}')
for i, (x, y) in enumerate([(15.2, -5.2), (4.0, -8.1), (8.5, 8.1)]):
    place('pose_m_stand_suit', x, y, face(x, y, 8, 1), dict(REF, skin=SKINS[(i + 3) % 8]), scale=1.02, name=f'ref{i}')
bench = [(x, -9.15) for x in [-12.9, -11.8, -10.7, -9.6, -8.5, -7.4, -6.3]] + [(x, -9.15) for x in [6.9, 8.0, 9.1, 10.2, 11.3, 12.4, 13.5]]
for i, (x, y) in enumerate(bench):
    cols = dict(HOME if x < 0 else ROAD, skin=SKINS[(i * 3) % 8]); cols['top'] = '#1d428a' if x < 0 else '#7d1720'
    chair(x, y, math.pi) if False else None; place('pose_m_sit_jersey', x, y, math.pi, cols, z=-0.345, scale=1.08, name=f'bench{i}')
# the courtside row on the far side (the near side is the benches and the table)
for i, (x, y, yaw) in enumerate(CS):
    if y < 0 or random.random() < 0.12: continue
    g = random.choice('mf'); pz = random.choice(['sit_winter', 'sit_hands_winter', 'sit_phone_winter', 'sit_tee', 'sit_lean_winter', 'sit_suit'])
    o = place(f'pose_{g}_{pz}', x, y, yaw, {'skin': random.choice(SKINS), 'top': random.choice(['#1d2230', '#262a33', '#3c414c', '#14161c', '#d8dadf', '#1d428a', '#5a4a3c', '#7d7f86']), 'bottom': random.choice(['#1a1c22', '#23262e', '#3b4a63']), 'shoe': random.choice(['#e8e8e8', '#141414']), 'hair': random.choice(['#14110f', '#3d2a1c', '#8a6a42', '#b8b4ac']), 'sock': '#141414'}, z=-0.345, scale=1.0, name=f'cs{i}')
# the ball, at the top of the shot
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=32, ring_count=16, location=(7.0, 3.05, 3.25)); ball = bpy.context.active_object; ball.name = 'ball'; ball.data.shade_smooth()
ball.data.materials.append(node_mat('ball', (0.62, 0.17, 0.04), 0.55)); [cc.objects.unlink(ball) for cc in ball.users_collection]; link(ball, G_COURT)

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
G_SB = coll('scoreboard'); SBZ = 21.5
box('sb_body', (12.6, 8.6, 6.6), (0, 0, SBZ), M['dark'], G_SB)
def face_plane(name, w, h, loc, rot, img, strength=3.0):
    mat = node_mat(name + '_m', img=img, img_emit=True, estr=strength, rough=0.25)
    o = mesh_obj(name, [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)], [(0, 1, 2, 3)], mat, G_SB, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    o.location = loc; o.rotation_euler = rot; return o
face_plane('sb_long_s', 12, 6, (0, -4.32, SBZ), (0, 0, 0), TEXP('sb_long0.jpg'))
face_plane('sb_long_n', 12, 6, (0, 4.32, SBZ), (0, 0, math.pi), TEXP('sb_long1.jpg'))
face_plane('sb_end_e', 8, 6, (6.32, 0, SBZ), (0, 0, math.pi / 2), TEXP('sb_end.jpg'))
face_plane('sb_end_w', 8, 6, (-6.32, 0, SBZ), (0, 0, -math.pi / 2), TEXP('sb_end.jpg'))
def ring(name, r_top, r_bot, z_top, z_bot, mat, seg=128):
    verts, faces, uv = [], [], []
    for i in range(seg + 1):
        a = i / seg * math.tau; verts += [(math.cos(a) * r_top, math.sin(a) * r_top, z_top), (math.cos(a) * r_bot, math.sin(a) * r_bot, z_bot)]; uv += [(i / seg * 6, 1), (i / seg * 6, 0)]
    for i in range(seg): faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    return mesh_obj(name, verts, faces, mat, G_SB, uv=uv)
ring('sb_top_ring', 7.8, 7.8, SBZ + 4.2, SBZ + 3.3, M['ribbon'])
ring('sb_low_ring', 7.2, 5.4, SBZ - 3.6, SBZ - 5.2, M['ribbon'])
cyl('sb_cap', 5.4, 0.1, (0, 0, SBZ - 5.25), M['dark'], G_SB, verts=64)
for x, y in ((-4, -3), (4, -3), (-4, 3), (4, 3)): cyl('sb_cable', 0.05, ROOF_RIM - SBZ - 3, (x, y, (ROOF_RIM + SBZ + 3) / 2), M['steel'], G_SB, verts=8)

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
area('court_key', (40, 22), (0, 0, 27), 52000, spread=math.radians(60))
for a in range(8):
    an = (a + 0.5) / 8 * math.tau; area(f'bowl_fill{a}', (18, 8), (math.cos(an) * 30, math.sin(an) * 24, 29), 5000, color=(1, 0.93, 0.85), rot=(math.radians(-35) * 0, 0, 0))
area('upper_fill', (110, 80), (0, 0, 31.5), 9000, color=(0.95, 0.95, 1.0))
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.012, 0.02, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.5

# ---------------- haze: the air in a full arena, thin enough to keep the far side, thick enough to show the light
vol = node_mat('haze'); nt = vol.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF']); pv = nt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = 0.00045
pv.inputs['Anisotropy'].default_value = 0.55; pv.inputs['Color'].default_value = (0.85, 0.88, 0.95, 1); nt.links.new(pv.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
hz = box('haze', (150, 110, 40), (0, 0, 19.5), vol); hz.visible_shadow = False
# ---------------- cameras
CAMS = {
    'upper':      ((-20, -36.5, 17.5), (6, 1, 1.0), 26),
    'courtside':  ((-1.5, -8.6, 1.15), (10, 3.0, 2.2), 30),
    'baseline':   ((17.6, -4.6, 1.05), (4, 2.5, 2.2), 28),
    'rafters':    ((-6, 4, 1.7), (-36, -2, 23), 20),
    'bridge':     ((-12, -33.0, 25.8), (4, -2, 0), 24),
    'scoreboard': ((-16, -9, 4), (0, 0, 20), 22),
    'crowdcheck': ((0, -10.5, 3.5), (0, -20, 5), 35),
    'east':       ((-47, -5, 12.5), (14, 0, 9), 26),
}
def add_cam(name, loc, tgt, lens):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_end = 900; o = bpy.data.objects.new(name, cd); o.location = loc
    d = Vector(tgt) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); link(o); return o
for k, (l, t, f) in CAMS.items(): add_cam('cam_' + k, l, t, f)
DOF = {'courtside': (6.6, 3.6, 2.4, 2.8), 'baseline': (7.0, 3.3, 2.4, 3.2), 'crowdcheck': (0, -14, 5, 4)}
for k, (x, y, z, f) in DOF.items():
    cam = bpy.data.objects['cam_' + k]; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (Vector((x, y, z)) - cam.location).length; cam.data.dof.aperture_fstop = f

# ---------------- render
sc.render.engine = 'CYCLES'; prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'; sc.cycles.samples = 256 if MODE == 'full' else 64; sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 8; sc.cycles.glossy_bounces = 4; sc.cycles.transmission_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = 0.0
sc.render.resolution_x, sc.render.resolution_y = (2560, 1440) if MODE == 'full' else (1280, 720)
sc.render.image_settings.file_format = 'PNG'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WK, 'garden.blend'))
for v in (VIEWS or list(CAMS)):
    sc.camera = bpy.data.objects['cam_' + v]; sc.render.filepath = os.path.join(OUTR, f'{v}_{MODE}.png'); bpy.ops.render.render(write_still=True); print('rendered', v)
