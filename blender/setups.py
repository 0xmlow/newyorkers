"""setups.py: the other nights at THE GARDEN for build_garden.py. GARDEN_SETUP=hockey|concert|boxing|circus
(basketball is the generator's own). build_garden calls floor_rows(setup) for extra floor seating, then build(setup, globals())
after the house is up: it clears the basketball floor, lays the setup's floor, furniture, people and light, and returns
(cams, dof). Layouts follow the walk (_build/src/world.js) so the stills and the walk agree:
  hockey   200 x 85 ft rink (H 30.5, W 13, corners 8.5), boards 1.07 m, glass, nets on the goal lines at +-27.13
  concert  deck 14 x 20 m at x = -23, 1.8 m up, LED wall 26 x 14.6 at x = -29.8, a runway to x = -0.5, GA floor
  boxing   20 ft ring inside the ropes on a 1.22 m platform at centre, floor seats in rows round it
  circus   a 42 ft ring of sawdust at centre, the curb, a high wire and two platforms, a net"""
import math, random, os, zlib
import numpy as np

def _hands(fname):
    """the two hands of a posed CC0 body, in its local space: the skin vertices furthest out along x in the rest pose"""
    d = np.load(fname); v, rest, part = d['v'], d['rest'], d['part']; sk = part == 0
    out = []
    for sgn in (1, -1):
        xs = rest[:, 0] * sgn; m = sk & (xs > 0.85 * xs[sk].max()); out.append(v[m].mean(0) if m.any() else v[sk].mean(0))
    return out

def _pt(fname, rest_pt, r=0.06, part=None):
    """where a point of the rest body went in the pose: the mean posed position of rest vertices within r of it"""
    d = np.load(fname); v, rest, pt = d['v'], d['rest'], d['part']; m = np.linalg.norm(rest - np.array(rest_pt), axis=1) < r
    if part is not None: m &= np.isin(pt, part)
    return v[m].mean(0) if m.any() else None
def _feet(fname):
    """the two soles of a posed body: the shoe vertices per side, their lowest mean and their heel to toe direction"""
    d = np.load(fname); v, rest, pt = d['v'], d['rest'], d['part']; out = []
    for sgn in (1, -1):
        m = (pt >= 3) & (pt != 4) & (pt != 5) & (pt != 7) & (pt != 8) & (rest[:, 2] < 0.1) & (np.sign(rest[:, 0]) == sgn)
        if not m.any(): continue
        w = v[m]; toe = w[np.argmin(w[:, 1])]; heel = w[np.argmax(w[:, 1])]; out.append((w.mean(0), w[:, 2].min(), toe, heel))
    return out
def _ellipsoid(name, loc, size, mat, G, rot=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=20, ring_count=12, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    if rot is not None: o.rotation_euler = rot
    o.data.materials.append(mat); o.data.shade_smooth(); [c.objects.unlink(o) for c in o.users_collection]; link(o, G); return o
def _along(a, b):
    """rotation that turns +Z onto the direction a to b"""
    return (Vector(b) - Vector(a)).to_track_quat('Z', 'Y').to_euler()
SH_L, SH_R, EL_L, EL_R = (0.19, 0.0, 1.405), (-0.19, 0.0, 1.405), (0.322, -0.02, 1.05), (-0.322, -0.02, 1.05)

def _beam(G, a, b, col, half=math.radians(2.4), L=26.0):
    """a light beam in haze as geometry: an open cone, emission over transparent, soft at the edges by facing"""
    d = (b - a).normalized(); r = math.tan(half) * L
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=r, radius2=0.06, depth=L, end_fill_type='NOTHING', location=a + d * (L / 2))
    o = bpy.context.active_object; o.rotation_euler = (-d).to_track_quat('Z', 'Y').to_euler(); [c.objects.unlink(o) for c in o.users_collection]; link(o, G)
    key = 'beam_%d%d%d' % tuple(int(c * 9) for c in col); m = bpy.data.materials.get(key)
    if not m:
        m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*col, 1)
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
        inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; nt.links.new(lw.outputs['Facing'], inv.inputs[1])
        sq = nt.nodes.new('ShaderNodeMath'); sq.operation = 'POWER'; sq.inputs[1].default_value = 2.0; nt.links.new(inv.outputs[0], sq.inputs[0])
        tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sp.inputs[0])
        fz = nt.nodes.new('ShaderNodeMath'); fz.operation = 'POWER'; fz.inputs[1].default_value = 1.4; nt.links.new(sp.outputs['Z'], fz.inputs[0])
        m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; nt.links.new(sq.outputs[0], m1.inputs[0]); nt.links.new(fz.outputs[0], m1.inputs[1])
        st = nt.nodes.new('ShaderNodeMath'); st.operation = 'MULTIPLY'; st.inputs[1].default_value = 0.5; nt.links.new(m1.outputs[0], st.inputs[0]); nt.links.new(st.outputs[0], em.inputs['Strength'])
        ad = nt.nodes.new('ShaderNodeAddShader'); nt.links.new(tr.outputs[0], ad.inputs[0]); nt.links.new(em.outputs[0], ad.inputs[1]); nt.links.new(ad.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    o.data.materials.append(m); o.visible_shadow = False; o.visible_diffuse = False; o.visible_glossy = False
    return o

def floor_rows(setup):
    """extra floor seating as (x, y, z, yaw, row): boxing fills the floor round the ring"""
    rows = []
    if setup == 'boxing':
        for r in range(12):
            for s in (-1, 1):   # the long sides
                y = s * (5.6 + r * 0.95)
                for x in np.arange(-8.5 - r * 0.6, 8.6 + r * 0.6, 0.55):
                    if abs(x) < 1.3: continue   # the aisles to the corners stay open
                    if _inside(x, y): rows.append((float(x), y, 0.0, 0.0 if s > 0 else math.pi, r))
            for s in (-1, 1):   # the ends, behind the blue aisle
                x = s * (5.8 + r * 0.95)
                for y in np.arange(-4.6 - r * 0.3, 4.7 + r * 0.3, 0.55):
                    if abs(y) < 1.4: continue
                    if _inside(x, y): rows.append((x, float(y), 0.0, -s * math.pi / 2, r))
    return rows
def _inside(x, y, FL=16.0, FR=15.0, margin=1.3):
    ax = max(abs(x) - FL, 0); return math.hypot(ax, y) - FR < -margin

def build(setup, g):
    globals().update(g)
    rng = random.Random(77)
    # ---- clear the basketball night
    for cn in ('court_set', 'floor_people'):
        c = bpy.data.collections.get(cn)
        if c:
            for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    for n in ('court',):
        if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    G = coll('setup_' + setup)
    tex = {'hockey': 'ice_full.jpg', 'concert': 'stage_full.jpg', 'boxing': 'ring_full.jpg', 'circus': 'circus_full.jpg'}[setup]
    fm = node_mat('floor_' + setup, img=TEXP(tex), rough={'hockey': 0.08, 'concert': 0.6, 'boxing': 0.85, 'circus': 0.95}[setup], coat={'hockey': 1.0, 'concert': 0.15, 'boxing': 0, 'circus': 0}[setup])
    if setup == 'hockey':   # the ice: a thin clear layer over the paint, a little scatter
        b = fm.node_tree.nodes['Principled BSDF']; b.inputs['Coat Roughness'].default_value = 0.1; b.inputs['Coat Weight'].default_value = 0.35; b.inputs['Roughness'].default_value = 0.25; b.inputs['Coat IOR'].default_value = 1.31; b.inputs['Subsurface Weight'].default_value = 0.08
    fw, fd = 62, 30
    mesh_obj('floor_full', [(-fw / 2, -fd / 2, 0.006), (fw / 2, -fd / 2, 0.006), (fw / 2, fd / 2, 0.006), (-fw / 2, fd / 2, 0.006)], [(0, 1, 2, 3)], fm, G, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    # lights: scale the sports rig per night, then add the night's own
    def scale_lights(prefixes, k):
        for o in bpy.data.objects:
            if o.type == 'LIGHT' and any(o.name.startswith(p) for p in prefixes): o.data.energy *= k
    # the board's end faces carry tonight's score or feed
    for mn in ('sb_end_e_m', 'sb_end_w_m'):
        mt = bpy.data.materials.get(mn)
        if mt:
            for nd in mt.node_tree.nodes:
                if nd.type == 'TEX_IMAGE': nd.image = bpy.data.images.load(TEXP(f'sb_end_{setup}.jpg'), check_existing=True)
    cams, dof = {}, {}
    if setup == 'hockey': cams, dof = hockey(G, rng, scale_lights)
    elif setup == 'concert': cams, dof = concert(G, rng, scale_lights)
    elif setup == 'boxing': cams, dof = boxing(G, rng, scale_lights)
    elif setup == 'circus': cams, dof = circus(G, rng, scale_lights)
    return cams, dof

def _ground(o, fname, base_z, scale):
    me = o.data; zmin = min(v.co.z for v in me.vertices); o.location.z = base_z + 0.002 - zmin * scale

def _rink_outline(H, W, R, n=48):
    pts = []
    for cx, cy, a0 in ((H - R, W - R, 0), (-(H - R), W - R, math.pi / 2), (-(H - R), -(W - R), math.pi), (H - R, -(W - R), 1.5 * math.pi)):
        for i in range(n + 1): a = a0 + i / n * math.pi / 2; pts.append((cx + R * math.cos(a), cy + R * math.sin(a)))
    return pts

def _band(name, pts, z0, z1, mat, G, u_scale=1.0, closed=True):
    verts, faces, uv = [], [], []; acc = 0.0
    P = pts + ([pts[0]] if closed else [])
    for i, (x, y) in enumerate(P):
        if i: acc += math.hypot(x - P[i - 1][0], y - P[i - 1][1])
        verts += [(x, y, z0), (x, y, z1)]; uv += [(acc * u_scale, 0), (acc * u_scale, 1)]
    for i in range(len(P) - 1): faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    return mesh_obj(name, verts, faces, mat, G, uv=uv)

# ------------------------------------------------------------------ hockey
def hockey(G, rng, scale_lights):
    H, W, R = 30.5, 13.0, 8.5
    out = _rink_outline(H, W, R); out_o = _rink_outline(H + 0.12, W + 0.12, R + 0.12)
    white = node_mat('boards_white', (0.86, 0.87, 0.88), 0.35, coat=0.3)
    kick = node_mat('kick_yellow', (0.85, 0.62, 0.05), 0.5)
    adm = node_mat('dasher_ads', img=TEXP('boards.jpg'), rough=0.3, coat=0.3)
    _band('kick', out, 0.0, 0.22, kick, G); _band('dasher', out, 0.22, 0.98, adm, G, u_scale=1 / 12.0); _band('board_cap_in', out, 0.98, 1.07, white, G)
    _band('board_back', out_o, 0.0, 1.07, white, G)
    cap = node_mat('board_cap', (0.03, 0.2, 0.62), 0.4)
    # the cap: a flat strip between the two outlines
    verts, faces = [], []
    for i in range(len(out)): verts += [(*out[i], 1.07), (*out_o[i], 1.07)]
    for i in range(len(out)): j = (i + 1) % len(out); faces.append((2 * i, 2 * j, 2 * j + 1, 2 * i + 1))
    mesh_obj('board_cap', verts, faces, cap, G)
    # the glass: 2.4 m round the ends and corners, 1.5 m along the sides, posts every 1.5 m
    gl = node_mat('rink_glass', (0.92, 0.95, 0.97), 0.02, trans=1.0, ior=1.5)
    gv, gf = [], []
    for i, (x, y) in enumerate(out + [out[0]]):
        h = 2.4 if abs(x) > H - R - 0.5 else 1.55; gv += [(x * 1.002, y * 1.004, 1.07), (x * 1.002, y * 1.004, 1.07 + h)]
    for i in range(len(out)): gf.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    mesh_obj('glass', gv, gf, gl, G); acc = 0
    for i in range(1, len(out)):
        acc += math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1])
        if acc > 1.5:
            acc = 0; x, y = out[i]; h = 2.4 if abs(x) > H - R - 0.5 else 1.55; box('glass_post', (0.05, 0.05, h), (x, y, 1.07 + h / 2), M['steel'], G)
    # benches and penalty boxes behind the near side boards
    for x0, x1 in ((-12, -3), (3, 12)):
        box('bench_floor', (x1 - x0, 1.8, 0.2), ((x0 + x1) / 2, -14.0, 0.1), M['dark'], G); box('bench_seat', (x1 - x0, 0.45, 0.45), ((x0 + x1) / 2, -14.6, 0.42), M['pad'], G)
    for x in (-1.6, 1.6): box('penalty_box', (2.6, 1.6, 1.07), (x, 14.0, 0.53), M['dark'], G)
    # the nets: red posts and crossbar, a white mesh, on the goal lines
    red = node_mat('goal_red', (0.6, 0.04, 0.05), 0.35, 0.3); netm = node_mat('goal_net', (0.95, 0.95, 0.95), 0.8, alpha=0.55)
    for s in (-1, 1):
        gx = s * 27.13
        for yy in (-0.915, 0.915): cyl('post', 0.03, 1.22, (gx, yy, 0.61), red, G, verts=12)
        cyl('bar', 0.03, 1.83, (gx, 0, 1.22), red, G, rot=(math.pi / 2, 0, 0), verts=12)
        cu = bpy.data.curves.new('netc', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.003
        for k in range(13):
            sp = cu.splines.new('POLY'); sp.points.add(3); yy = -0.915 + k * 1.83 / 12
            for j, (dx, z) in enumerate(((0, 1.22), (s * 0.5, 1.15), (s * 1.0, 0.4), (s * 1.0, 0.0))): sp.points[j].co = (gx + dx, yy, z, 1)
        for z in np.linspace(0.1, 1.15, 8):
            sp = cu.splines.new('POLY'); sp.points.add(1); dx = s * (0.5 + (1.15 - z) / 1.15 * 0.5)
            sp.points[0].co = (gx + dx, -0.915, z, 1); sp.points[1].co = (gx + dx, 0.915, z, 1)
        no = bpy.data.objects.new('net', cu); cu.materials.append(netm); link(no, G)
    # the players: one five on five attack on the east net (Astra round 4): the carrier on the right circle, a man at the crease,
    # two on the points, one weak side; the defence between them and the goal. Gloves, shoulder shells, skates with runners.
    HOMEH = {'top': '#173b99', 'bottom': '#14161c', 'shoe': '#0c0c0c', 'sock': '#173b99', 'hair': '#141010', 'trim': '#e8e5dc', 'stripe': '#e8e5dc', 'skin': '#173b99'}
    AWAYH = {'top': '#e8e5dc', 'bottom': '#14161c', 'shoe': '#0c0c0c', 'sock': '#e8e5dc', 'hair': '#141010', 'trim': '#151d2c', 'stripe': '#2962ff', 'skin': '#e8e5dc'}
    stickm = node_mat('stick', (0.06, 0.06, 0.07), 0.5); tape = node_mat('tape', (0.9, 0.9, 0.88), 0.9); steel_r = node_mat('runner', (0.8, 0.82, 0.85), 0.2, 1.0)
    gear = {id(HOMEH): node_mat('gear_home', (0.07, 0.18, 0.55), 0.55), id(AWAYH): node_mat('gear_away', (0.86, 0.85, 0.82), 0.55)}
    NET = (27.13, 0.0)
    # Astra round 5: one readable contest 2.5 m off the crease, the carrier and a defender blade to blade, lanes 2 m apart
    plays = [('skate', 21.2, 1.9, HOMEH, None), ('hready', 24.9, -2.6, HOMEH, NET), ('hready', 16.4, 8.4, HOMEH, None), ('hready', 16.6, -8.2, HOMEH, None), ('skate2', 20.6, -6.4, HOMEH, None),
             ('hready', 0, 0, AWAYH, 'CONTEST'), ('hready', 23.9, -4.4, AWAYH, None), ('skate2', 18.6, -4.6, AWAYH, None), ('hready', 18.2, 6.4, AWAYH, None), ('skate', 19.0, 3.8, AWAYH, None)]
    puck = None
    for i, (pz, x, y, cols, look) in enumerate(plays):
        f = os.path.join(WK, f'pose_m_{pz}_hockey.npz'); nm = f'hk{i}'
        if look == 'CONTEST':   # between the puck and the net, 1.15 m off the puck, facing it
            dn = (Vector((*NET, 0)) - Vector((*puck, 0))).normalized(); x, y = puck[0] + dn.x * 1.15, puck[1] + dn.y * 1.15 - 0.3; look = puck
        tgt = look or (puck[:2] if puck else (NET[0] - 2, 1.0))
        if i == 0: yaw = face(x, y, NET[0] - 1.0, NET[1] + 0.6)
        else: yaw = face(x, y, *tgt)
        o = place(f'pose_m_{pz}_hockey', x, y, yaw, dict(cols), z=0, scale=1.12, name=nm)
        if not o: continue
        [c.objects.unlink(o) for c in o.users_collection]; link(o, G); _ground(o, None, 0.0, 1.12); bpy.context.view_layer.update(); W_ = o.matrix_world
        hR, hL = [W_ @ Vector(h) for h in _hands(f)]
        fwd = Vector((math.sin(o.rotation_euler.z), -math.cos(o.rotation_euler.z), 0)); side = Vector((fwd.y, -fwd.x, 0))
        hand = hR if hR.z < hL.z else hL
        blade = Vector((hand.x, hand.y, 0.03)) + fwd * 0.95 + side * 0.25
        d = blade - hand; st = cyl('stick', 0.014, d.length, (hand + blade) / 2, stickm, G, verts=8); st.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        box('blade', (0.32, 0.02, 0.07), blade + Vector((0, 0, 0.005)), tape, G, rot=(0, 0, math.atan2(fwd.y, fwd.x)))
        if i == 0: puck = (blade.x + fwd.x * 0.28, blade.y + fwd.y * 0.28)
        gm = gear[id(cols)]
        for h in (hR, hL): _ellipsoid('glove', h, (0.16, 0.12, 0.11), gm, G, rot=(0, 0, o.rotation_euler.z))
        # people pass: the shoulder pads live under the sweater now (people.py hockey ease), no blobs stuck on top
        for (c_, zmin, toe, heel) in _feet(f):
            a_, b_ = W_ @ Vector(toe.tolist()), W_ @ Vector(heel.tolist()); mid = (a_ + b_) / 2; L = max(0.28, (a_ - b_).length * 1.05)
            box('runner', (0.006, L, 0.04), (mid.x, mid.y, 0.02), steel_r, G, rot=(0, 0, math.atan2(-(a_ - b_).x, (a_ - b_).y)))
    for s in (-1, 1):   # the goalies, set low in the crease, pads, blocker and catcher
        x = s * 26.4; f = os.path.join(WK, 'pose_m_hready_hockey.npz'); cols = HOMEH if s < 0 else AWAYH
        o = place('pose_m_hready_hockey', x, 0.0, face(x, 0.0, 20 * s, 2.0 * s), dict(cols), z=0, scale=1.15, name=f'gk{s}')
        if o:
            [c.objects.unlink(o) for c in o.users_collection]; link(o, G); _ground(o, None, 0.0, 1.15); bpy.context.view_layer.update()
            padm = bpy.data.materials.get('pad_w') or node_mat('pad_w', (0.9, 0.9, 0.9), 0.5)
            fx_ = -s
            # people pass (Astra): leg pads shaped like pads, on the goalie's own feet: tapered, rounded, knee rolls and straps
            strap = bpy.data.materials.get('pad_strap') or node_mat('pad_strap', (0.03, 0.03, 0.035), 0.6)
            yaw_ = o.rotation_euler.z; W_ = o.matrix_world
            for (c_, zmin, toe, heel) in _feet(f):
                fw = W_ @ Vector(c_.tolist()); fw.z = 0
                bm_ = bmesh.new()
                for (zz, w, d) in ((0.02, 0.24, 0.17), (0.3, 0.27, 0.2), (0.62, 0.29, 0.21), (0.86, 0.27, 0.16)):
                    for (px, py) in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)): bm_.verts.new((px, py - 0.05, zz))
                bm_.verts.ensure_lookup_table()
                for r in range(3):
                    for k in range(4): bm_.faces.new([bm_.verts[r * 4 + k], bm_.verts[r * 4 + (k + 1) % 4], bm_.verts[r * 4 + 4 + (k + 1) % 4], bm_.verts[r * 4 + 4 + k]])
                bm_.faces.new([bm_.verts[k] for k in (3, 2, 1, 0)]); bm_.faces.new([bm_.verts[12 + k] for k in range(4)])
                me_ = bpy.data.meshes.new('gk_pad'); bm_.to_mesh(me_); bm_.free(); pad = bpy.data.objects.new('gk_pad', me_); link(pad, G); me_.materials.append(padm)
                pad.location = fw; pad.rotation_euler = (0, 0, yaw_)
                sb = pad.modifiers.new('round', 'SUBSURF'); sb.levels = sb.render_levels = 2; me_.shade_smooth()
                for zz in (0.3, 0.6):   # the knee rolls
                    r_ = cyl('gk_roll', 0.035, 0.27, fw + Matrix.Rotation(yaw_, 3, 'Z') @ Vector((0, -0.16, zz)), padm, G, verts=16); r_.rotation_euler = (0, math.pi / 2, yaw_)
                for zz in (0.12, 0.45, 0.75):   # straps round the back of the leg
                    box('gk_strap', (0.3, 0.025, 0.03), fw + Matrix.Rotation(yaw_, 3, 'Z') @ Vector((0, 0.06, zz)), strap, G, rot=(0, 0, yaw_))
            for h in _hands(f): _ellipsoid('gk_glove', o.matrix_world @ Vector(h), (0.3, 0.12, 0.3), padm, G)
    for i, (x, y) in enumerate([(15.5, 11.2), (28.6, -10.2), (8.0, -11.0)]):
        o = place('pose_m_stand_suit', x, y, face(x, y, 21, 2), dict(REF, top='#e6e6e6', skin=SKINS[(i + 2) % 8]), z=0, scale=1.02, name=f'hkref{i}')
        if o: o.parent = None; [c.objects.unlink(o) for c in o.users_collection]; link(o, G)
    puck = puck or (21.5, 4.8); pk = cyl('puck', 0.038, 0.025, (puck[0], puck[1], 0.0185), node_mat('puck', (0.01, 0.01, 0.01), 0.4), G, verts=24)
    pk.keyframe_insert('location', frame=1); pk.location.x += 30 / 24; pk.keyframe_insert('location', frame=2); bpy.context.scene.frame_set(1)
    # ice is twice as bright as maple: the rig comes down, the key too
    scale_lights(('side', 'end'), 1.0); scale_lights(('court_key',), 0.5)
    cams = {'wide': ((8.3, -8.0, 6.0), (22.6, 1.6, 0.8), 38), 'glass': ((14.8, -12.4, 1.2), (21.5, 2.0, 0.9), 35), 'net': ((27.75, 1.25, 0.45), (20.5, 3.6, 0.85), 26), 'upper': ((-22, -38.5, 18.5), (5, 1, 1.0), 32)}
    dof = {'glass': (21, 2.5, 1.0, 5.6), 'net': (21.0, 2.2, 0.8, 5.6), 'wide': (22.6, 1.6, 0.8, 8.0)}
    return cams, dof

# ------------------------------------------------------------------ concert
def concert(G, rng, scale_lights):
    deckm = node_mat('deck', (0.02, 0.022, 0.03), 0.45, 0.1)
    box('deck', (14, 20, 1.8), (-23, 0, 0.9), deckm, G, bevel=0.02); box('runway', (16, 3, 1.2), (-8.5, 0, 0.6), deckm, G, bevel=0.02)
    box('deck_skirt', (0.03, 20, 1.6), (-15.98, 0, 0.8), node_mat('skirt', (0.01, 0.01, 0.012), 0.9), G)
    # the LED wall: his art at 6 mm pitch, two portrait IMAG screens either side
    art = os.path.join(ROOT, 'site', 'assets', 'ff', 'stage_led.webp')
    wall = led(node_mat('stage_wall', img=art if os.path.exists(art) else TEXP('sb_long0.jpg'), img_emit=True, estr=1.5), 0.006)
    mesh_obj('stage_led', [(-29.8, 13, 1.9), (-29.8, -13, 1.9), (-29.8, -13, 16.5), (-29.8, 13, 16.5)], [(0, 1, 2, 3)], wall, G, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    arts = sorted(os.listdir(os.path.join(ROOT, 'site', 'assets', 'art')))
    for s in (-1, 1):
        im = os.path.join(ROOT, 'site', 'assets', 'art', arts[3 if s < 0 else 17])
        mesh_obj('imag', [(-27, s * 15.2, 6), (-24, s * 17.6, 6), (-24, s * 17.6, 14), (-27, s * 15.2, 14)], [(0, 1, 2, 3)] if s > 0 else [(3, 2, 1, 0)], led(node_mat('imag' + str(s), img=im, img_emit=True, estr=1.4), 0.006), G,
                 uv=[(0, 0), (1, 0), (1, 1), (0, 1)] if s > 0 else [(1, 1), (0, 1), (0, 0), (1, 0)])
    # truss: three spans over the deck, a box truss of four chords and lacing
    tm = node_mat('truss_alu', (0.6, 0.62, 0.65), 0.35, 1.0)
    for x in (-27, -21, -15.5):
        for dy, dz in ((-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)): cyl('chord', 0.025, 26, (x + dy, 0, 15 + dz), tm, G, rot=(math.pi / 2, 0, 0), verts=8)
        for y in np.arange(-13, 13, 0.8): cyl('lace', 0.012, 0.57, (x, y, 15), tm, G, rot=(0.8, 0, 0), verts=6)
        for sgn in (-1, 1): cyl('motor_chain', 0.015, ceil_z(abs(x)) - 15.4, (x, sgn * 10, (ceil_z(abs(x)) + 15.2) / 2), M['steel'], G, verts=6)
    # moving heads on the truss: beams in the haze, colours the house uses (blue, pink, white, cyan)
    cols = [(0.16, 0.38, 1.0), (1.0, 0.31, 0.64), (1.0, 0.97, 0.92), (0.13, 0.83, 0.93)]
    for i, x in enumerate((-27, -21, -15.5)):
        for k, y in enumerate(np.linspace(-12, 12, 9)):
            box('mover', (0.35, 0.35, 0.45), (x, y, 14.6), M['black_steel'], G)
            tgt = (rng.uniform(-10, 25), rng.uniform(-30, 30), rng.uniform(-2, 30)) if (k + i) % 2 else (rng.uniform(-28, -17), rng.uniform(-8, 8), 1.8)
            narrow = (k + i) % 2
            if narrow: _beam(G, Vector((x, y, 14.3)), Vector(tgt), cols[(k + i * 2) % 4])
            spot(f'mover{i}{k}', (x, y, 14.3), tgt, (160000 if narrow else 22000) * LP, 4.5 if narrow else 22, 0.15, cols[(k + i * 2) % 4], 0.05)
    for y in (-6, 6): spot(f'front{y}', (-6, y, 15), (-19.5, y * 0.55, 3.0), 4200 * LP, 26, 0.4, (1.0, 0.92, 0.85), 0.2)
    spot('key_vox', (-4, -2, 13), (-17.4, 0, 3.3), 10400 * LP, 9, 0.35, (1.0, 0.93, 0.86), 0.12)
    # the band (Astra round 4): vocalist downstage centre, guitar and bass either side, drums upstage on a riser, keys upstage left,
    # each with the instrument in front of them; six wedges, three mic stands, stairs, line arrays and subs
    stand_names = [n for n in crowd_files if n.endswith('_stand')]
    inst = node_mat('inst_body', (0.55, 0.06, 0.08), 0.25, coat=0.8); inst2 = node_mat('inst_body2', (0.92, 0.9, 0.84), 0.25, coat=0.8); chrome = node_mat('chrome', (0.9, 0.9, 0.92), 0.12, 1.0)
    drumshell = node_mat('drum_shell', (0.05, 0.12, 0.45), 0.3, coat=0.7); head_ = node_mat('drum_head', (0.92, 0.92, 0.88), 0.5); brass = node_mat('cymbal', (0.78, 0.6, 0.25), 0.25, 1.0)
    band = [('vox', -17.4, 0.0, 1.8), ('gtr', -17.9, -3.1, 1.8), ('bass', -17.9, 3.1, 1.8), ('drums', -20.7, 0.0, 2.4), ('keys', -20.2, -5.4, 1.8)]
    for k, (role, x, y, z) in enumerate(band):
        n = stand_names[(k * 5 + 2) % len(stand_names)]; o = bpy.data.objects.new(f'band_{role}', CAST[n].data); link(o, G)
        yaw = face(x, y, 10, y * 0.3) if role != 'drums' else face(x, y, 10, 0)
        o.location = (x, y, z); o.rotation_euler = (0, 0, yaw); o.scale = (1.05,) * 3
        fwd = Vector((math.sin(yaw), -math.cos(yaw), 0)); side = Vector((fwd.y, -fwd.x, 0))
        if role in ('gtr', 'bass'):
            body = Vector((x, y, z)) + fwd * 0.28 + Vector((0, 0, 1.0))
            box(role + '_body', (0.42 if role == 'gtr' else 0.46, 0.07, 0.34), body, inst if role == 'gtr' else inst2, G, rot=(0, 0.5, yaw), bevel=0.03)
            nk = cyl(role + '_neck', 0.022, 0.75 if role == 'gtr' else 0.95, body + side * 0.45 + Vector((0, 0, 0.22)), M['black_steel'], G, verts=8); nk.rotation_euler = _along(body, body + side * 0.9 + Vector((0, 0, 0.45)))
            cyl(role + '_strap', 0.012, 0.6, body + Vector((0, 0, 0.3)), M['black_steel'], G, rot=(0, 0.6, yaw), verts=6)
            box(role + '_amp', (0.7, 0.4, 0.6), (x - 1.6, y + (0.9 if y > 0 else -0.9), z + 0.3), M['black_steel'], G, bevel=0.01)
        if role == 'keys':
            box('keys', (1.3, 0.38, 0.1), Vector((x, y, z + 0.95)) + fwd * 0.45, M['black_steel'], G, rot=(0, 0, yaw)); box('keys_white', (1.2, 0.16, 0.012), Vector((x, y, z + 1.006)) + fwd * 0.42, inst2, G, rot=(0, 0, yaw))
            for dx in (-0.5, 0.5): cyl('keys_leg', 0.02, 0.9, Vector((x, y, z + 0.45)) + fwd * 0.45 + side * dx, chrome, G, verts=6)
        if role == 'drums':
            c0 = Vector((x, y, z)) + fwd * 0.8
            cyl('kick', 0.28, 0.45, c0 + Vector((0, 0, 0.28)), drumshell, G, rot=(math.pi / 2, 0, yaw), verts=32)
            for dx, h, r_ in ((-0.45, 0.62, 0.2), (0.45, 0.62, 0.2), (0.75, 0.5, 0.23), (-0.25, 0.75, 0.16), (0.2, 0.75, 0.16)):
                p_ = c0 + side * dx + fwd * (-0.15); cyl('tom', r_, 0.22, p_ + Vector((0, 0, h)), drumshell, G, verts=24); cyl('tom_head', r_ * 0.98, 0.005, p_ + Vector((0, 0, h + 0.112)), head_, G, verts=24)
            for dx, h, r_ in ((-0.8, 1.05, 0.25), (0.9, 1.15, 0.28), (0.2, 1.25, 0.22), (-0.55, 0.9, 0.18)):
                p_ = c0 + side * dx; cyl('cymbal', r_, 0.004, p_ + Vector((0, 0, h)), brass, G, rot=(0.12, 0.05, 0), verts=32); cyl('cym_stand', 0.01, h, p_ + Vector((0, 0, h / 2)), chrome, G, verts=6)
    box('drum_riser', (3, 4, 0.6), (-21.2, 0, 2.1), deckm, G, bevel=0.01)
    for (x, y) in ((-17.0, 0.0), (-17.5, -2.6), (-17.5, 2.6)):
        cyl('mic_stand', 0.012, 1.55, (x, y, 2.58), M['black_steel'], G, verts=8); cyl('mic', 0.022, 0.18, (x + 0.05, y, 3.38), M['black_steel'], G, rot=(0, -1.2, 0), verts=10); cyl('mic_base', 0.15, 0.02, (x, y, 1.81), M['black_steel'], G, verts=16)
    for (x, y) in ((-16.4, -1.1), (-16.4, 1.1), (-16.6, -3.6), (-16.6, 3.6), (-19.4, -6.4), (-19.2, 2.4)):
        box('wedge', (0.4, 0.6, 0.3), (x, y, 1.95), M['black_steel'], G, rot=(0, -0.45, 0), bevel=0.02)
    for s_ in (-1, 1):
        for k in range(5): box('stair', (0.35, 1.4, 0.36 * (k + 1)), (-16.9 + (4 - k) * 0.35 - 2.6, s_ * 10.7, 0.18 * (k + 1)), deckm, G)
    rng_c = random.Random(4)
    for k in range(10):   # cable runs on the deck
        a_ = Vector((rng_c.uniform(-28, -17), rng_c.uniform(-9, 9), 1.805)); pts_ = [a_ + Vector((t * rng_c.uniform(1.5, 3), math.sin(t * 2 + k) * 0.6, 0)) for t in np.linspace(0, 1, 8)]
        cu = bpy.data.curves.new('cable', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.01; sp = cu.splines.new('POLY'); sp.points.add(len(pts_) - 1)
        for j, q in enumerate(pts_): sp.points[j].co = (*q, 1)
        o = bpy.data.objects.new('cable', cu); cu.materials.append(M['black_steel']); link(o, G)
    # line arrays: two hangs of twelve cabinets, curved toward the floor; subs in two clusters under the deck lip
    cab = node_mat('cabinet', (0.008, 0.009, 0.011), 0.65)
    for s_ in (-1, 1):
        top = Vector((-15.8, s_ * 11.0, 13.2)); tilt = 0.0
        box('array_frame', (0.9, 1.3, 0.1), top + Vector((0, 0, 0.12)), M['black_steel'], G)
        cyl('array_chain', 0.015, ceil_z(16) - 13.4, top + Vector((0, 0, (ceil_z(16) - 13.2) / 2)), M['steel'], G, verts=6)
        p_ = top.copy()
        for k in range(12):
            tilt += 0.0 if k < 6 else 0.045 * (k - 5)
            box('array_cab', (0.55, 1.2, 0.3), p_ + Vector((0, 0, -0.15)), cab, G, rot=(0, -tilt, 0), bevel=0.01)
            p_ += Vector((math.sin(tilt) * 0.3, 0, -math.cos(tilt) * 0.3))
        for k in range(5): box('sub', (0.75, 1.1, 0.6), (-15.55, s_ * (5.0 + k * 1.15), 0.3), cab, G, bevel=0.01)
    # the barricade and the GA floor: about 1,800 of the cast standing, denser at the front
    bar = node_mat('barricade', (0.55, 0.57, 0.6), 0.35, 1.0)
    box('barricade', (0.08, 26, 1.15), (-14.4, 0, 0.58), bar, G); box('barricade_r', (13, 0.08, 1.15), (-8.5, 2.4, 0.58), bar, G); box('barricade_l', (13, 0.08, 1.15), (-8.5, -2.4, 0.58), bar, G)
    box('foh', (4, 5, 0.6), (12, 0, 0.3), deckm, G); box('foh_desk', (3, 1.2, 0.9), (12, 0, 1.05), M['dark'], G)
    S = sorted(stand_names); Gs = coll('ga_variants', bpy.data.collections['templates'])
    for n in S:
        o = bpy.data.objects.new('ga_' + n, CAST[n].data); link(o, Gs)
    pts = []; vv = []
    for k in range(4200):
        x = -13.9 + rng.random() ** 1.6 * 31; y = rng.uniform(-13.5, 13.5)
        if abs(y) < 2.6 and x < -2: continue
        if 10.2 < x < 13.8 and abs(y) < 2.8: continue
        if not _inside(x, y, margin=0.9): continue
        if any((x - px) ** 2 + (y - py) ** 2 < 0.36 for (px, py, _, _, _) in pts[-60:]): continue
        yaw = math.atan2(-(-23 - x), (0 - y)) + math.pi + rng.uniform(-0.35, 0.35)
        pts.append((x, y, 0.0, yaw, 0)); vv.append(rng.randrange(len(S)))
    co = points_obj('ga', pts, G, extra={'var': ('INT', np.array(vv, np.int32)), 'sc': ('FLOAT', np.array([rng.uniform(0.92, 1.06) for _ in pts], np.float32))})
    gn_instancer(co, Gs, pick=True, scale_attr='sc'); print('ga', len(pts))
    # phones up in the bowl: a small cold light in about one hand in thirty
    ph = cyl('phone_t', 0.035, 0.005, (0, 0, 0), node_mat('phone', (1, 1, 1), 0.3, emit=(0.85, 0.9, 1.0), estr=12), bpy.data.collections['templates'], rot=(math.pi / 2, 0, 0), verts=6)
    cp = [p for p in bpy.data.objects['crowd'].data.vertices]
    sel = [(v.co.x, v.co.y, v.co.z + 1.35, 0) for v in cp if rng.random() < 0.033]
    po = points_obj('phones', [(x, y, z, 0, 0) for (x, y, z, _) in sel], G); gn_instancer(po, ph)
    # house lights down, the haze up for the beams
    scale_lights(('side', 'end', 'court_key'), 0.0); scale_lights(('bowl',), 0.06); scale_lights(('svc',), 0.4)
    hz = bpy.data.materials['haze'].node_tree.nodes['Principled Volume']; hz.inputs['Density'].default_value = 0.0011
    cams = {'floor': ((10.6, 2.0, 2.8), (-17.4, 0, 3.4), 45), 'wide': ((18, -30, 16), (-20, 0, 5), 24), 'stage': ((-15.2, -9.5, 2.6), (-22, 0, 3.4), 32), 'bowl': ((38, -27, 17), (-22, 0, 5), 26)}
    dof = {'stage': (-17.4, 0, 3.2, 4.0), 'floor': (-17.4, 0, 3.4, 4.0)}
    return cams, dof

# ------------------------------------------------------------------ boxing
def boxing(G, rng, scale_lights):
    P, Hh = 7.3, 1.22   # platform square and height; ropes enclose 6.1 m
    canvas = node_mat('canvas', img=TEXP('canvas.jpg'), rough=0.8); _cv = canvas.node_tree; _mx = _cv.nodes.new('ShaderNodeMix'); _mx.data_type = 'RGBA'; _mx.blend_type = 'MULTIPLY'; _mx.inputs[0].default_value = 1; _mx.inputs[7].default_value = (0.5, 0.5, 0.52, 1); _cv.links.new(next(n for n in _cv.nodes if n.type == 'TEX_IMAGE').outputs['Color'], _mx.inputs[6]); _cv.links.new(_mx.outputs[2], _cv.nodes['Principled BSDF'].inputs['Base Color']); skirt = node_mat('ring_skirt', img=TEXP('boards.jpg'), rough=0.7)
    box('platform', (P, P, Hh - 0.06), (0, 0, (Hh - 0.06) / 2), M['dark'], G)
    mesh_obj('canvas', [(-P / 2, -P / 2, Hh), (P / 2, -P / 2, Hh), (P / 2, P / 2, Hh), (-P / 2, P / 2, Hh)], [(0, 1, 2, 3)], canvas, G, uv=[(0, 0), (1, 0), (1, 1), (0, 1)])
    for k in range(4):
        a = k * math.pi / 2; c_, s_ = math.cos(a), math.sin(a)
        o = mesh_obj('skirt', [(-P / 2, -P / 2 - 0.01, 0.05), (P / 2, -P / 2 - 0.01, 0.05), (P / 2, -P / 2 - 0.01, Hh - 0.02), (-P / 2, -P / 2 - 0.01, Hh - 0.02)], [(0, 1, 2, 3)], skirt, G, uv=[(0, 0), (2, 0), (2, 1), (0, 1)])
        o.rotation_euler = (0, 0, a)
    q = 3.05 + 0.15   # posts just outside the 20 ft square
    corner_cols = [(0.7, 0.05, 0.06), (0.95, 0.95, 0.95), (0.08, 0.25, 0.85), (0.95, 0.95, 0.95)]
    ropes = [node_mat('rope_r', (0.7, 0.05, 0.06), 0.45), node_mat('rope_w', (0.92, 0.92, 0.92), 0.45), node_mat('rope_b', (0.08, 0.25, 0.85), 0.45), node_mat('rope_w2', (0.92, 0.92, 0.92), 0.45)]
    posts = [(q, q), (-q, q), (-q, -q), (q, -q)]
    for k, (x, y) in enumerate(posts):
        cyl('post', 0.05, 1.75, (x, y, Hh + 0.85), M['steel'], G, verts=12)
        box('turnbuckle_pad', (0.2, 0.2, 1.15), (x * 0.985, y * 0.985, Hh + 0.95), node_mat(f'tpad{k}', corner_cols[k], 0.55), G, bevel=0.04)
    for j, h in enumerate((0.46, 0.76, 1.07, 1.37)):
        for k in range(4):
            a, b_ = Vector((*posts[k], Hh + h)), Vector((*posts[(k + 1) % 4], Hh + h)); mid = (a + b_) / 2 + Vector((0, 0, -0.03)); d = b_ - a
            r_ = cyl('rope', 0.019, d.length - 0.2, mid + Vector((0, 0, 0.01)), ropes[j], G, verts=12); r_.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    strap = node_mat('rope_strap', (0.9, 0.9, 0.9), 0.6)
    for k in range(4):   # two vertical spacers a side, tying the four ropes
        a_, b_ = Vector(posts[k]), Vector(posts[(k + 1) % 4])
        for t in (1 / 3, 2 / 3): qq = a_.lerp(b_, t); box('spacer', (0.05, 0.05, 0.95), (qq.x, qq.y, Hh + 0.93), strap, G)
    for k in range(3): box('steps', (0.9, 0.35, 0.3 * (k + 1)), (q + 0.6 + (2 - k) * 0.35, -q - 0.3, 0.15 * (k + 1)), M['dark'], G)
    # the fighters: a jab and a slip, red and blue gloves; the referee
    gr = node_mat('glove_r', (0.55, 0.03, 0.04), 0.35, coat=0.6); gb = node_mat('glove_b', (0.05, 0.16, 0.6), 0.35, coat=0.6); cuff = node_mat('glove_cuff', (0.92, 0.92, 0.9), 0.5)
    for i, (pz, x, y, trunks, gm) in enumerate([('jab', -0.12, -0.575, '#173b99', gb), ('guard', 0.12, 0.575, '#14161c', gr)]):
        skin = SKINS[(i * 3 + 1) % 8]; boot = '#f0ede5' if i == 0 else '#0c0c0c'
        cols = dict(top=skin, bottom=trunks, shoe=boot, sock=boot, hair='#141010', trim=skin, stripe='#ffffff' if i == 0 else '#d8b574', skin=skin)
        f = os.path.join(WK, f'pose_m_{pz}_trunks.npz'); other = (0.12, 0.575) if i == 0 else (-0.12, -0.575)
        o = place(f'pose_m_{pz}_trunks', x, y, face(x, y, *other), cols, z=Hh, scale=1.1, name=f'boxer{i}')
        if not o: continue
        [c.objects.unlink(o) for c in o.users_collection]; link(o, G); _ground(o, None, Hh, 1.1); bpy.context.view_layer.update(); W_ = o.matrix_world
        hands = _hands(f)
        for h, el in zip(hands, (EL_L, EL_R)):
            e = _pt(f, el, 0.06); hw = W_ @ Vector(h.tolist())
            ew = W_ @ Vector(e.tolist()) if e is not None else hw - Vector((0, 0, 0.25))
            dirv = (hw - ew).normalized(); gc = hw + dirv * 0.06
            _ellipsoid('glove', gc, (0.15, 0.14, 0.24), gm, G, rot=_along(ew, hw)); cy_ = cyl('cuff', 0.062, 0.1, hw - dirv * 0.07, cuff, G, verts=16); cy_.rotation_euler = _along(ew, hw)
    # the referee: off the attack line, a step back, watching
    o = place('pose_m_stand_suit', -2.3, -1.85, face(-2.3, -1.85, 0, 0), dict(REF, top='#eeeeee', skin=SKINS[5]), z=Hh, scale=1.02, name='boxref')
    if o: [c.objects.unlink(o) for c in o.users_collection]; link(o, G); _ground(o, None, Hh, 1.02)
    # judges on three sides, the timekeeper, photographers under the apron
    for k, (x, y, yaw) in enumerate([(0.0, -4.9, 0.0), (4.9, 0.0, math.pi / 2), (-4.9, 0.0, -math.pi / 2), (2.2, -4.9, 0.0)]):
        box('judge_table', (1.0 if k < 3 else 1.6, 0.5, 0.75), (x, y, 0.375), M['dark'], G, rot=(0, 0, yaw), bevel=0.01)
        n = [q for q in crowd_files if q.endswith('_sit')][k % 3]; jo = bpy.data.objects.new(f'judge{k}', CAST[n].data); link(jo, G)
        off = Vector((math.sin(yaw), -math.cos(yaw), 0)) * -0.55
        jo.location = (x + off.x, y + off.y, -0.06); jo.rotation_euler = (0, 0, yaw + math.pi); jo.scale = (0.92,) * 3
    lean = [q for q in crowd_files if q.endswith('_sit_lean')]
    for k, (x, y) in enumerate([(-2.4, 4.0), (-1.0, 4.0), (1.0, 4.0), (2.4, 4.0), (-4.0, 2.0), (4.0, -2.2), (-2.6, -4.1)]):
        po = bpy.data.objects.new(f'ringphoto{k}', CAST[lean[k % len(lean)]].data); link(po, G); yaw = face(x, y, 0, 0)
        po.location = (x, y, -0.36); po.rotation_euler = (0, 0, yaw); po.scale = (0.92,) * 3
        fx, fy = math.sin(yaw), -math.cos(yaw); cyl('photo_lens', 0.05, 0.32, (x + fx * 0.42, y + fy * 0.42, 0.95), M['black_steel'], G, rot=(math.pi / 2, 0, yaw), verts=12)
    # ringside: press tables on two sides, the bell, the corners' stools and buckets
    box('press', (6, 0.7, 0.75), (0, 4.85, 0.375), M['dark'], G, bevel=0.01)
    for k in range(6): box('laptop', (0.34, 0.24, 0.02), (-2.5 + k, 4.8, 0.76), M['black_steel'], G)
    cyl('bell', 0.14, 0.05, (-1.2, -4.5, 0.85), node_mat('brass', (0.85, 0.62, 0.25), 0.25, 1.0), G, rot=(math.pi / 2, 0, 0))
    for k in (0, 2): cyl('stool', 0.2, 0.55, (posts[k][0] * 1.15, posts[k][1] * 1.15, 0.28), M['dark'], G, verts=16)
    # light: a square truss over the ring, sixteen hard downlights on the canvas; the rig and the bowl drop
    tm = node_mat('truss_alu', (0.6, 0.62, 0.65), 0.35, 1.0) if 'truss_alu' not in bpy.data.materials else bpy.data.materials['truss_alu']
    for k in range(4):
        a, b_ = Vector((*[(5, 5), (-5, 5), (-5, -5), (5, -5)][k], 9.5)), Vector((*[(5, 5), (-5, 5), (-5, -5), (5, -5)][(k + 1) % 4], 9.5))
        c_ = cyl('ring_truss', 0.15, 10.3, (a + b_) / 2, tm, G, verts=8); c_.rotation_euler = (b_ - a).to_track_quat('Z', 'Y').to_euler()
    for k in range(16):
        t = k / 16 * math.tau; x, y = 5 * math.cos(t) / max(abs(math.cos(t)), abs(math.sin(t))), 5 * math.sin(t) / max(abs(math.cos(t)), abs(math.sin(t)))
        spot(f'ringlight{k}', (x, y, 9.3), (x * 0.08, y * 0.08, Hh), 1340 * LP, 34, 0.25, (1.0, 0.95, 0.9), 0.12)
    scale_lights(('side', 'end'), 0.12); scale_lights(('court_key',), 0.0); scale_lights(('bowl',), 0.18)
    cams = {'ringside': ((0.9, -4.4, 1.83), (0.0, 0.0, 2.35), 50), 'wide': ((2, -24.5, 9.5), (0, 0, 1.6), 32), 'overhead': ((0.01, 0.0, 11.2), (0, 0, 0), 28), 'corner': ((4.5, 3.5, 3.52), (0.0, 0.0, 2.6), 45)}
    dof = {'ringside': (0, 0, 2.5, 5.0), 'corner': (0.12, 0.575, 2.95, 5.6)}
    return cams, dof

# ------------------------------------------------------------------ circus
def circus(G, rng, scale_lights):
    # the curb (Astra round 4): 13 m ring, low and narrow, 0.22 x 0.36 m, his blue and white
    n = 64; r = 6.6; cb, cw_ = node_mat('curb_b', (0.06, 0.22, 0.85), 0.5), node_mat('curb_w', (0.92, 0.9, 0.86), 0.5)
    for k in range(n):
        a = (k + 0.5) / n * math.tau; box('curb', (0.36, 2 * math.pi * r / n * 1.01, 0.22), (r * math.cos(a), r * math.sin(a), 0.11), cb if k % 2 == 0 else cw_, G, rot=(0, 0, a), bevel=0.04)
    # the high wire: platforms at 8.5 m, 16 m apart, a 28 mm cable with 0.1 m sag, guys to the floor
    WZ = 8.5; HX = 8.0
    for s in (-1, 1):
        for dy in (-0.5, 0.5): cyl('pole', 0.07, WZ + 1.4, (s * (HX + 0.4), dy, (WZ + 1.4) / 2), M['steel'], G, verts=12)
        box('platform', (1.2, 1.2, 0.08), (s * (HX + 0.4), 0, WZ - 0.04), M['steel'], G); box('platform_rail', (0.04, 1.2, 1.0), (s * (HX + 1.0), 0, WZ + 0.5), M['steel'], G)
        for k in range(3):
            a_ = Vector((s * (HX + 0.4), 0, WZ + 1.3)); b_ = Vector((s * (HX + 6.5), (k - 1) * 4.5, 0)); g_ = cyl('guy', 0.008, (b_ - a_).length, (a_ + b_) / 2, M['steel'], G, verts=4); g_.rotation_euler = _along(a_, b_)
            box('anchor', (0.3, 0.3, 0.15), b_ + Vector((0, 0, 0.07)), M['black_steel'], G)
    cu = bpy.data.curves.new('wire', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.014; sp = cu.splines.new('POLY'); sp.points.add(20)
    for k in range(21): t = k / 20; sp.points[k].co = (-HX + 2 * HX * t, 0, WZ + 0.02 - 0.1 * (1 - (2 * t - 1) ** 2), 1)
    wo = bpy.data.objects.new('wire', cu); cu.materials.append(M['steel']); link(wo, G)
    # the walker: on the cable, lead foot on it, a 4.6 m balancing pole across the body
    stand_names = [n_ for n_ in crowd_files if n_.endswith('_stand')]
    wx = -1.6; wz = WZ - 0.1 * (1 - (wx / HX) ** 2)
    o = bpy.data.objects.new('walker', CAST[stand_names[4 % len(stand_names)]].data); link(o, G); o.location = (wx, 0, wz + 0.02); o.rotation_euler = (0, 0, math.pi / 2 - math.radians(20)); o.scale = (0.95,) * 3
    pole_ = cyl('balance_pole', 0.018, 4.6, (wx + 0.18, 0, wz + 1.05), node_mat('pole_w', (0.85, 0.85, 0.82), 0.4), G, rot=(math.pi / 2 + math.radians(8), 0, 0), verts=10)
    for dy in (-2.3, 2.3): cyl('pole_tip', 0.04, 0.12, (wx + 0.18, dy, wz + 1.05 - abs(dy) * 0.04), M['black_steel'], G, rot=(math.pi / 2, 0, 0), verts=10)
    # the net: 4 m under the wire, 20 x 7 m, 0.15 m mesh, a perimeter rope, sag 0.6 m, on four uprights
    NZ = WZ - 4.0
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=132, y_subdivisions=46, size=1, location=(0, 0, NZ)); nt_ = bpy.context.active_object; nt_.scale = (20, 7, 1)
    bpy.ops.object.transform_apply(scale=True); [c.objects.unlink(nt_) for c in nt_.users_collection]; link(nt_, G)
    for v_ in nt_.data.vertices: v_.co.z -= 0.6 * (1 - (2 * v_.co.x / 20) ** 2) * (1 - (2 * v_.co.y / 7) ** 2)
    wf = nt_.modifiers.new('w', 'WIREFRAME'); wf.thickness = 0.006; nt_.data.materials.append(node_mat('circus_net', (0.82, 0.82, 0.8), 0.8))
    rc = bpy.data.curves.new('net_rope', 'CURVE'); rc.dimensions = '3D'; rc.bevel_depth = 0.02; sp = rc.splines.new('POLY'); pts_ = [(-10, -3.5), (10, -3.5), (10, 3.5), (-10, 3.5), (-10, -3.5)]; sp.points.add(len(pts_) - 1)
    for k, (x, y) in enumerate(pts_): sp.points[k].co = (x, y, NZ, 1)
    ro = bpy.data.objects.new('net_rope', rc); rc.materials.append(node_mat('rope_net', (0.75, 0.7, 0.6), 0.7)); link(ro, G)
    for (x, y) in pts_[:4]: cyl('net_post', 0.05, NZ, (x * 1.02, y * 1.06, NZ / 2), M['steel'], G, verts=10)
    # the ring acts: a performer on a rolling globe, one on a pedestal with a hoop, one on a rola bola
    acts = node_mat('act_red', (0.75, 0.08, 0.35), 0.35, coat=0.6); gold = node_mat('act_gold', (0.85, 0.65, 0.25), 0.25, 1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, segments=48, ring_count=24, location=(-2.5, -1.0, 0.38)); gl = bpy.context.active_object; gl.data.shade_smooth(); gl.data.materials.append(acts); [c.objects.unlink(gl) for c in gl.users_collection]; link(gl, G)
    cyl('pedestal', 0.5, 1.2, (0.0, 1.5, 0.6), acts, G, verts=40); cyl('ped_top', 0.52, 0.04, (0.0, 1.5, 1.21), gold, G, verts=40)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.45, minor_radius=0.02, location=(0.0, 1.5, 2.6)); hp = bpy.context.active_object; hp.rotation_euler = (math.pi / 2, 0, math.atan2(6, 12) + math.radians(20)); hp.data.materials.append(gold); [c.objects.unlink(hp) for c in hp.users_collection]; link(hp, G)
    cyl('rola_roller', 0.12, 0.6, (2.5, -0.5, 0.12), gold, G, rot=(math.pi / 2, 0, 0.3), verts=24); box('rola_board', (0.7, 0.25, 0.03), (2.5, -0.5, 0.255), acts, G, rot=(0.0, 0.08, 0.3))
    for k, (x, y, z) in enumerate([(-2.5, -1.0, 0.76), (0.0, 1.5, 1.23), (2.5, -0.5, 0.27)]):
        o = bpy.data.objects.new(f'perf{k}', CAST[stand_names[(k * 7 + 1) % len(stand_names)]].data); link(o, G); o.location = (x, y, z); o.rotation_euler = (0, 0, face(x, y, 6, -12) + (0.2 * (k - 1)))
    # light: warm follow spots on the ring and the wire, the rig and bowl down
    for k in range(4):   # four warm ring spots at 11 m, 40 deg
        a = (k + 0.5) / 4 * math.tau; spot(f'circ{k}', (9 * math.cos(a), 9 * math.sin(a), 11), (0, 0, 0.4), 2600 * LP, 30, 0.4, (1.0, 0.88, 0.72), 0.25)
    for k in range(6):   # follow spots from the bowl on the three acts
        a = k / 6 * math.tau; t = [(-2.5, -1.0), (0.0, 1.5), (2.5, -0.5)][k % 3]; spot(f'circf{k}', (22 * math.cos(a), 15 * math.sin(a), 22), (t[0], t[1], 1.4), (26000 if k % 3 == 1 else 16000) * LP, 4, 0.4, (1.0, 0.92, 0.82), 0.1)
    spot('wire_key', (-6, -12, 7.5), (-1.6, 0, 9.4), 4400 * LP, 14, 0.3, (1.0, 0.95, 0.9), 0.1); spot('wire_rim', (3, 10, 12), (-1.6, 0, 9.4), 900 * LP, 14, 0.3, (0.85, 0.9, 1.0), 0.1)
    scale_lights(('side', 'end', 'court_key'), 0.05); scale_lights(('bowl',), 0.15)
    cams = {'ring': ((6.0, -12.0, 1.6), (0.0, 0.0, 1.15), 40), 'wire': ((4.5, -9.5, 7.4), (-2.6, 0, 9.0), 55), 'wide': ((2, -30, 14), (0, 0, 3), 26)}
    dof = {'wire': (-1.6, 0, 9.4, 5.6), 'ring': (0.0, 1.5, 2.0, 5.6)}
    return cams, dof
