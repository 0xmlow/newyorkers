"""penn_real.py: Penn Station made to feel real (MLow 2026-11-27: "looks really shitty ... make it feel real").
Called by exterior.build_station after the platforms are built. No CC0 train or subway car exists at a realistic level
(Sketchfab CC0 filter, Poly Haven, Poly Pizza checked 2026-11-27), so the cars are modelled here: a swept stainless
body with fluting, a window band with a liveried stripe, plug doors, two bogies with wheels, springs and brake gear,
underframe boxes, roof gear, diaphragms and a cab end; one train lit inside with seats you can see through the glass.
Surfaces and litter are CC0 from Poly Haven (textures and models, downloaded to work/ph_tex and work/ph_models).
Grime: dirt rises from every floor line, rust runs under the rails, puddles sit in the low spots."""
import bpy, bmesh, math, os, json, random, urllib.request
import numpy as np
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
PHT = os.path.join(ROOT, 'work', 'ph_tex'); PHM = os.path.join(ROOT, 'work', 'ph_models'); os.makedirs(PHT, exist_ok=True); os.makedirs(PHM, exist_ok=True)
UA = {'User-Agent': 'garden-build/1.0'}

def _get(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 1000: return dst
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(dst, 'wb') as f: f.write(r.read())
    return dst

def ph_tex(name, res='2k'):
    """Poly Haven texture set (CC0): colour, GL normal, roughness"""
    J = json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{name}', headers=UA), timeout=60)) if not os.path.exists(os.path.join(PHT, name + '_c.jpg')) else None
    out = {}
    for key, cands in (('c', ('Diffuse', 'diff_png', 'Color')), ('n', ('nor_gl',)), ('r', ('Rough', 'rough'))):
        dst = os.path.join(PHT, f'{name}_{key}.jpg')
        if not os.path.exists(dst):
            for k in cands:
                if J and k in J and res in J[k] and 'jpg' in J[k][res]: _get(J[k][res]['jpg']['url'], dst); break
        if os.path.exists(dst): out[key] = dst
    return out

def ph_model(name, res='1k'):
    """Poly Haven model (CC0) as glTF with its textures; imported, joined, returned at the origin"""
    d = os.path.join(PHM, name); os.makedirs(d, exist_ok=True); gl = os.path.join(d, name + '.gltf')
    if not os.path.exists(gl):
        J = json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{name}', headers=UA), timeout=60))
        g = J['gltf'][res]['gltf']; _get(g['url'], gl)
        for rel, inc in g.get('include', {}).items():
            p = os.path.join(d, rel); os.makedirs(os.path.dirname(p), exist_ok=True); _get(inc['url'], p)
    before = set(o.name for o in bpy.data.objects); bpy.ops.import_scene.gltf(filepath=gl); new = [o for o in bpy.data.objects if o.name not in before]
    meshes = [o for o in new if o.type == 'MESH']
    for o in new:
        if o.type != 'MESH': continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.parent = None
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    keep = o.name
    for x in list(bpy.data.objects):
        try:
            if x in new and x.name != keep: bpy.data.objects.remove(x)
        except ReferenceError: pass
    for cc in list(o.users_collection): cc.objects.unlink(o)
    o.name = 'ph_' + name; return o

# ---------------------------------------------------------------- materials
def _nodes(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; return m, nt, nt.nodes['Principled BSDF']

def box_tex_mat(name, tex, scale=1.0, tint=(1, 1, 1), rough_mul=1.0, grime=0.55, grime_h=0.9, wet=0.0, nstr=0.8, world=False):
    """a Poly Haven set box projected in metres, dirt rising from the floor line, AO in the corners, optional wet patches"""
    m, nt, b = _nodes(name); N = nt.nodes; L = nt.links
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / scale,) * 3
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    def img(path, col=True):
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path, check_existing=True); t.projection = 'BOX'; t.projection_blend = 0.25
        if not col: t.image.colorspace_settings.name = 'Non-Color'
        L.new(mp.outputs['Vector'], t.inputs['Vector']); return t
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], sep.inputs[0])
    col = img(tex['c']); tintn = N.new('ShaderNodeMix'); tintn.data_type = 'RGBA'; tintn.blend_type = 'MULTIPLY'; tintn.inputs[0].default_value = 1
    L.new(col.outputs['Color'], tintn.inputs[6]); tintn.inputs[7].default_value = (*tint, 1)
    # Astra 7: big stains and repairs, three scales: +-10% low frequency patches 0.3 to 1.2 m and 3 to 4 m
    vn = N.new('ShaderNodeTexNoise'); vn.inputs['Scale'].default_value = 0.35; vn.inputs['Detail'].default_value = 3; L.new(geo.outputs['Position'], vn.inputs['Vector'])
    vr = N.new('ShaderNodeMapRange'); L.new(vn.outputs['Fac'], vr.inputs['Value']); vr.inputs['To Min'].default_value = 0.84; vr.inputs['To Max'].default_value = 1.12
    vc = N.new('ShaderNodeCombineXYZ'); [L.new(vr.outputs['Result'], vc.inputs[k]) for k in range(3)]
    vm = N.new('ShaderNodeMix'); vm.data_type = 'RGBA'; vm.blend_type = 'MULTIPLY'; vm.inputs[0].default_value = 1; L.new(tintn.outputs[2], vm.inputs[6]); L.new(vc.outputs[0], vm.inputs[7])
    tintn = type('T', (), {'outputs': [None, None, vm.outputs[2]]})()
    # grime: a dark band from each floor (world z mod storey), broken by noise; plus AO
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; nz.inputs['Detail'].default_value = 6
    L.new(geo.outputs['Position'], nz.inputs['Vector'])
    ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.6
    zrel = N.new('ShaderNodeMath'); zrel.operation = 'WRAP'; zrel.inputs[1].default_value = 0.0; zrel.inputs[2].default_value = grime_h * 4
    fl = N.new('ShaderNodeMapRange'); L.new(nz.outputs['Fac'], fl.inputs['Value']); fl.inputs['From Min'].default_value = 0.35; fl.inputs['From Max'].default_value = 0.7
    g = N.new('ShaderNodeMix'); g.data_type = 'RGBA'; g.blend_type = 'MULTIPLY'
    gm = N.new('ShaderNodeMath'); gm.operation = 'MULTIPLY'; L.new(fl.outputs['Result'], gm.inputs[0]); gm.inputs[1].default_value = grime
    aoi = N.new('ShaderNodeMath'); aoi.operation = 'SUBTRACT'; aoi.inputs[0].default_value = 1.0; L.new(ao.outputs['AO'], aoi.inputs[1])
    gs = N.new('ShaderNodeMath'); gs.operation = 'ADD'; L.new(gm.outputs[0], gs.inputs[0]); L.new(aoi.outputs[0], gs.inputs[1])
    gc = N.new('ShaderNodeMath'); gc.operation = 'MINIMUM'; L.new(gs.outputs[0], gc.inputs[0]); gc.inputs[1].default_value = 0.85
    L.new(gc.outputs[0], g.inputs[0]); L.new(tintn.outputs[2], g.inputs[6]); g.inputs[7].default_value = (0.16, 0.13, 0.1, 1)
    L.new(g.outputs[2], b.inputs['Base Color'])
    if 'r' in tex:
        r = img(tex['r'], False); rm = N.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'; rm.inputs[1].default_value = rough_mul; L.new(r.outputs['Color'], rm.inputs[0])
        if wet > 0:   # puddles: low spots go glossy and dark
            wn = N.new('ShaderNodeTexNoise'); wn.inputs['Scale'].default_value = 0.9; wn.inputs['Detail'].default_value = 3; L.new(geo.outputs['Position'], wn.inputs['Vector'])
            wr = N.new('ShaderNodeMapRange'); L.new(wn.outputs['Fac'], wr.inputs['Value']); wr.inputs['From Min'].default_value = 0.70 - wet * 0.06; wr.inputs['From Max'].default_value = 0.72 - wet * 0.06
            wm = N.new('ShaderNodeMix'); wm.data_type = 'FLOAT'; L.new(wr.outputs['Result'], wm.inputs[0]); L.new(rm.outputs[0], wm.inputs[2]); wm.inputs[3].default_value = 0.06
            L.new(wm.outputs[0], b.inputs['Roughness'])
            dk = N.new('ShaderNodeMix'); dk.data_type = 'RGBA'; dk.blend_type = 'MULTIPLY'; L.new(wr.outputs['Result'], dk.inputs[0]); L.new(g.outputs[2], dk.inputs[6]); dk.inputs[7].default_value = (0.55, 0.55, 0.55, 1)
            L.new(dk.outputs[2], b.inputs['Base Color'])
        else: L.new(rm.outputs[0], b.inputs['Roughness'])
    if 'n' in tex:
        n = img(tex['n'], False); nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = nstr; L.new(n.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs[0], b.inputs['Normal'])
    return m

def steel_mat(name, base=(0.62, 0.63, 0.64), flute=0.012, dirt=0.5):
    """stainless car body: brushed, vertical fluting below the windows, brake dust rising from the rail"""
    m, nt, b = _nodes(name); N = nt.nodes; L = nt.links
    b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.32
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    wave = N.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'X'; wave.inputs['Scale'].default_value = 12.0; wave.wave_profile = 'SIN'
    L.new(tc.outputs['Object'], wave.inputs['Vector'])
    lowmask = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], lowmask.inputs['Value']); lowmask.inputs['From Min'].default_value = 0.05; lowmask.inputs['From Max'].default_value = 0.0
    bump = N.new('ShaderNodeBump'); bump.inputs['Distance'].default_value = flute; L.new(wave.outputs['Fac'], bump.inputs['Height'])
    bm2 = N.new('ShaderNodeMix'); bm2.data_type = 'FLOAT'; L.new(lowmask.outputs['Result'], bm2.inputs[0]); bm2.inputs[2].default_value = 0; bm2.inputs[3].default_value = 1
    L.new(bm2.outputs[0], bump.inputs['Strength'])
    brush = N.new('ShaderNodeTexNoise'); brush.inputs['Scale'].default_value = 60; brush.inputs['Detail'].default_value = 8
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.02, 1, 1); L.new(tc.outputs['Object'], mp.inputs['Vector']); L.new(mp.outputs['Vector'], brush.inputs['Vector'])
    rr = N.new('ShaderNodeMapRange'); L.new(brush.outputs['Fac'], rr.inputs['Value']); rr.inputs['To Min'].default_value = 0.22; rr.inputs['To Max'].default_value = 0.42
    # grime: brown from the bottom, streaks down from the roof
    geo = N.new('ShaderNodeNewGeometry'); s2 = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], s2.inputs[0])
    up = N.new('ShaderNodeMapRange'); L.new(s2.outputs['Z'], up.inputs['Value']); up.inputs['From Min'].default_value = -1.2; up.inputs['From Max'].default_value = -0.1
    up.inputs['To Min'].default_value = dirt; up.inputs['To Max'].default_value = 0.0
    st = N.new('ShaderNodeTexNoise'); mp2 = N.new('ShaderNodeMapping'); mp2.inputs['Scale'].default_value = (6, 6, 0.25); L.new(tc.outputs['Object'], mp2.inputs['Vector']); L.new(mp2.outputs['Vector'], st.inputs['Vector']); st.inputs['Detail'].default_value = 4
    sr = N.new('ShaderNodeMapRange'); L.new(st.outputs['Fac'], sr.inputs['Value']); sr.inputs['From Min'].default_value = 0.55; sr.inputs['From Max'].default_value = 0.75; sr.inputs['To Max'].default_value = 0.35
    ad = N.new('ShaderNodeMath'); ad.operation = 'ADD'; L.new(up.outputs['Result'], ad.inputs[0]); L.new(sr.outputs['Result'], ad.inputs[1])
    cm = N.new('ShaderNodeMix'); cm.data_type = 'RGBA'; L.new(ad.outputs[0], cm.inputs[0]); cm.inputs[6].default_value = (*base, 1); cm.inputs[7].default_value = (0.12, 0.08, 0.05, 1)
    L.new(cm.outputs[2], b.inputs['Base Color'])
    rm = N.new('ShaderNodeMix'); rm.data_type = 'FLOAT'; L.new(ad.outputs[0], rm.inputs[0]); L.new(rr.outputs['Result'], rm.inputs[2]); rm.inputs[3].default_value = 0.8; L.new(rm.outputs[0], b.inputs['Roughness'])
    mm = N.new('ShaderNodeMix'); mm.data_type = 'FLOAT'; L.new(ad.outputs[0], mm.inputs[0]); mm.inputs[2].default_value = 1.0; mm.inputs[3].default_value = 0.2; L.new(mm.outputs[0], b.inputs['Metallic'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

def flat(name, col, rough=0.5, metal=0.0, emit=None, estr=0.0, trans=0.0):
    m, nt, b = _nodes(name); b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if trans: b.inputs['Transmission Weight'].default_value = trans
    return m

# ---------------------------------------------------------------- geometry helpers
def mk(name, verts, faces, mat, c, smooth=False):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    if smooth: me.shade_smooth()
    o = bpy.data.objects.new(name, me); me.materials.append(mat); c.objects.link(o); return o

def cube(name, size, loc, mat, c, rot=(0, 0, 0), bevel=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel > 0: bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect='EDGES')
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    me.materials.append(mat); c.objects.link(o); return o

def tube(name, r, L, loc, mat, c, rot=(0, 0, 0), verts=16, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=L)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.shade_smooth(); o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    me.materials.append(mat); c.objects.link(o); return o

def join(objs, name):
    objs = [o for o in objs if o]
    if not objs: return None
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    objs[0].name = name; return objs[0]

# ---------------------------------------------------------------- the cars
def body_profile(W=3.05, H=3.55):
    """half section from the sill up and over the roof (y, z above the floor of the body), a slight tumblehome"""
    pts = [(W / 2 - 0.06, 0.0), (W / 2, 0.25), (W / 2, 1.7), (W / 2 - 0.03, 2.55), (W / 2 - 0.16, 3.05), (W / 2 - 0.45, 3.35), (W / 2 - 0.9, 3.5), (0.0, H)]
    return pts

def car(c, M, x0, L, yc, zrail, livery, lead=False, lit=False, open_doors=False, tag='a'):
    """one passenger car from x0 to x0 + L on the track at yc; the body floor at rail + 1.15"""
    zb = zrail + 0.95; objs = []; lights = []
    prof = body_profile(); full = [(y, z) for (y, z) in prof] + [(-y, z) for (y, z) in reversed(prof[:-1])]
    nx = 2; verts, faces = [], []
    xs = [x0 + 0.25, x0 + L - 0.25]
    ring = len(full)
    for x in xs:
        for (y, z) in full: verts.append((x, yc + y, zb + z))
    for k in range(ring - 1): faces.append((k, k + 1, ring + k + 1, ring + k))
    # the end walls, slightly set in, with the diaphragm frame
    faces.append(tuple(range(ring))[::-1]); faces.append(tuple(range(ring, 2 * ring)))
    body = mk(f'ext_car_body_{tag}', verts, faces, M['car_steel'], c); objs.append(body)
    bv = body.modifiers.new('bv', 'BEVEL'); bv.width = 0.05; bv.segments = 3; bv.limit_method = 'ANGLE'
    # window band: dark glass panes, rounded, black rubber, every 1.35 m between the doors
    zw0, zw1 = zb + 1.55, zb + 2.42
    doors = [x0 + 2.4, x0 + L - 2.4] if not lead else [x0 + L * 0.5 - 0.9, x0 + L - 2.4]
    for side in (-1, 1):
        ys = yc + side * (1.525 + 0.012)
        x = x0 + 1.2
        while x < x0 + L - 1.0:
            if all(abs(x - d) > 1.25 for d in doors) and not (lead and x < x0 + 3.2):
                objs.append(cube(f'ext_car_win_{tag}', (1.05, 0.03, zw1 - zw0), (x, ys, (zw0 + zw1) / 2), M['car_glass_lit' if lit else 'car_glass'], c, bevel=0.06))
                objs.append(cube(f'ext_car_gasket_{tag}', (1.13, 0.02, zw1 - zw0 + 0.08), (x, ys - side * 0.006, (zw0 + zw1) / 2), M['rubber'], c, bevel=0.07))
            x += 1.35
        # the livery stripe under the windows and a thin one above
        for zz, hh, mt in ((zb + 1.32, 0.16, livery[0]), (zb + 1.12, 0.07, livery[1]), (zb + 2.55, 0.05, livery[2])):
            objs.append(cube(f'ext_car_stripe_{tag}', (L - 0.7, 0.012, hh), (x0 + L / 2, yc + side * 1.531, zz), M[mt], c))
        # plug doors: a recess frame, two leaves with tall windows, a step, warning yellow edge
        for d in doors:
            gap = 0.55 if open_doors and side < 0 else 0.0
            objs.append(cube(f'ext_car_doorframe_{tag}', (1.42, 0.02, 2.05), (d, yc + side * 1.528, zb + 1.03), M['rubber'], c, bevel=0.02))
            for s in (-1, 1):
                lx = d + s * (0.32 + gap)
                objs.append(cube(f'ext_car_door_{tag}', (0.62, 0.035, 1.95), (lx, yc + side * (1.535 + (0.06 if gap else 0)), zb + 1.0), M['car_steel'], c, bevel=0.015))
                objs.append(cube(f'ext_car_doorwin_{tag}', (0.36, 0.02, 0.8), (lx, yc + side * (1.555 + (0.06 if gap else 0)), zb + 1.55), M['car_glass_lit' if lit else 'car_glass'], c, bevel=0.04))
            objs.append(cube(f'ext_car_step_{tag}', (1.3, 0.25, 0.05), (d, yc + side * 1.55, zb - 0.02), M['tread'], c))
            if gap: objs.append(cube(f'ext_car_doorlight_{tag}', (1.0, 0.02, 0.05), (d, yc + side * 1.52, zb + 2.08), M['car_interior_light'], c))
    # underframe: sills, equipment boxes, air tanks, skirts
    objs.append(cube(f'ext_car_sill_{tag}', (L - 0.6, 2.9, 0.22), (x0 + L / 2, yc, zb - 0.08), M['under'], c))
    rr = random.Random(hash(tag) & 0xffff)
    x = x0 + 4.4
    while x < x0 + L - 4.4:
        w = rr.uniform(0.8, 2.6); h = rr.uniform(0.35, 0.65); dy = rr.choice((-0.7, 0.0, 0.7))
        objs.append(cube(f'ext_car_box_{tag}', (w, rr.uniform(0.6, 1.2), h), (x + w / 2, yc + dy, zb - 0.2 - h / 2), M['under'], c, bevel=0.02)); x += w + rr.uniform(0.2, 0.9)
    for s in (-1, 1): objs.append(tube(f'ext_car_tank_{tag}', 0.16, 2.2, (x0 + L / 2 + s * 2.5, yc + 1.05, zb - 0.45), M['under'], c, rot=(0, math.pi / 2, 0)))
    # bogies at 2.6 m from the ends: frame, two axles, wheels with flanges, coil springs, brake discs, the bolster
    for bx in (x0 + 2.9, x0 + L - 2.9):
        objs.append(cube(f'ext_car_bogie_{tag}', (2.9, 2.1, 0.32), (bx, yc, zrail + 0.6), M['bogie'], c, bevel=0.03))
        objs.append(cube(f'ext_car_bolster_{tag}', (0.5, 2.6, 0.3), (bx, yc, zrail + 0.82), M['bogie'], c, bevel=0.03))
        for ax in (-1.3, 1.3):
            objs.append(tube(f'ext_car_axle_{tag}', 0.07, 1.6, (bx + ax, yc, zrail + 0.46), M['bogie'], c, rot=(math.pi / 2, 0, 0), verts=12))
            for s in (-1, 1):
                objs.append(tube(f'ext_car_wheel_{tag}', 0.46, 0.13, (bx + ax, yc + s * 0.75, zrail + 0.46), M['wheel'], c, rot=(math.pi / 2, 0, 0), verts=32))
                objs.append(tube(f'ext_car_flange_{tag}', 0.5, 0.03, (bx + ax, yc + s * 0.69, zrail + 0.46), M['wheel'], c, rot=(math.pi / 2, 0, 0), verts=32))
                objs.append(tube(f'ext_car_disc_{tag}', 0.33, 0.05, (bx + ax, yc + s * 0.45, zrail + 0.46), M['wheel'], c, rot=(math.pi / 2, 0, 0), verts=24))
                objs.append(tube(f'ext_car_spring_{tag}', 0.11, 0.3, (bx + ax * 0.55, yc + s * 1.02, zrail + 0.78), M['spring'], c, verts=10))
            objs.append(cube(f'ext_car_axlebox_{tag}', (0.3, 2.0, 0.24), (bx + ax, yc, zrail + 0.5), M['bogie'], c, bevel=0.02))
    # roof gear: HVAC housings, vents, an antenna
    for rx_ in (x0 + 4.0, x0 + L - 4.0):
        objs.append(cube(f'ext_car_hvac_{tag}', (3.0, 2.0, 0.28), (rx_, yc, zb + 3.55 + 0.1), M['car_steel_roof'], c, bevel=0.06))
        for k in range(5): objs.append(cube(f'ext_car_vent_{tag}', (0.4, 1.6, 0.03), (rx_ - 1.0 + k * 0.5, yc, zb + 3.72), M['under'], c))
    objs.append(tube(f'ext_car_antenna_{tag}', 0.02, 0.35, (x0 + L / 2, yc + 0.4, zb + 3.68), M['under'], c, verts=6))
    # ends: diaphragm (black rubber folds), coupler, end lights
    for ex, sgn in ((x0 + 0.25, -1), (x0 + L - 0.25, 1)):
        if lead and sgn < 0: continue
        for k in range(4): objs.append(cube(f'ext_car_diaphragm_{tag}', (0.06, 1.5 - k * 0.04, 2.3 - k * 0.04), (ex + sgn * (0.04 + k * 0.06), yc, zb + 1.3), M['rubber'], c, bevel=0.025))
        objs.append(cube(f'ext_car_coupler_{tag}', (0.45, 0.25, 0.25), (ex + sgn * 0.25, yc, zrail + 0.95), M['bogie'], c, bevel=0.03))
    if lead:   # the cab end: a sloped nose, two windscreens, headlights and ditch lights, a number box
        ex = x0 + 0.25
        objs.append(cube('ext_car_nose', (0.5, 2.9, 2.6), (ex - 0.2, yc, zb + 1.35), M['car_steel_smooth'], c, rot=(0, -0.12, 0), bevel=0.12))
        objs.append(cube('ext_car_nose_top', (0.7, 2.7, 0.9), (ex - 0.05, yc, zb + 3.0), M['car_steel_smooth'], c, rot=(0, 0.35, 0), bevel=0.15))
        objs.append(cube('ext_car_dest_bg', (0.05, 1.5, 0.28), (ex - 0.5, yc, zb + 2.86), M['rubber'], c, rot=(0, -0.12, 0)))
        objs.append(cube('ext_car_dest', (0.02, 1.38, 0.18), (ex - 0.53, yc, zb + 2.86), M['dest_led'], c, rot=(0, -0.12, 0)))
        objs.append(cube('ext_car_coupler_f', (0.6, 0.3, 0.3), (ex - 0.55, yc, zrail + 0.95), M['bogie'], c, bevel=0.03))
        for s_ in (-1, 1): objs.append(cube('ext_car_hose', (0.4, 0.06, 0.06), (ex - 0.5, yc + s_ * 0.35, zrail + 0.8), M['rubber'], c, rot=(0, 0.6, 0)))
        for s in (-1, 1):
            objs.append(cube('ext_car_screen_seal', (0.05, 1.13, 0.93), (ex - 0.445, yc + s * 0.62, zb + 2.25), M['rubber'], c, rot=(0, -0.12, 0), bevel=0.07))
            objs.append(cube('ext_car_screen', (0.04, 1.05, 0.85), (ex - 0.47, yc + s * 0.62, zb + 2.25), M['car_glass'], c, rot=(0, -0.12, 0), bevel=0.05))
            objs.append(cube('ext_car_lamphouse', (0.12, 0.34, 0.3), (ex - 0.44, yc + s * 0.95, zb + 0.55), M['rubber'], c, bevel=0.03))
            objs.append(tube('ext_car_head', 0.11, 0.06, (ex - 0.48, yc + s * 0.95, zb + 0.55), M['headlight'], c, rot=(0, math.pi / 2, 0), verts=20))
            objs.append(tube('ext_car_ditch', 0.07, 0.05, (ex - 0.48, yc + s * 1.2, zb - 0.1), M['headlight'], c, rot=(0, math.pi / 2, 0), verts=16))
            hl = bpy.data.lights.new('ext_headlight', 'SPOT'); hl.energy = 900; hl.spot_size = math.radians(30); hl.color = (1, 0.95, 0.85); hl.shadow_soft_size = 0.05
            ho = bpy.data.objects.new('ext_headlight', hl); ho.location = (ex - 0.6, yc + s * 0.95, zb + 0.55); ho.rotation_euler = Vector((-1, 0, -0.05)).to_track_quat('-Z', 'Y').to_euler(); c.objects.link(ho); lights.append(ho)
        objs.append(cube('ext_car_pilot', (0.3, 2.7, 0.5), (ex - 0.3, yc, zrail + 0.55), M['bogie'], c, rot=(0, 0.35, 0), bevel=0.03))
    if lit:   # inside: ceiling light strips, seat backs in pairs, grab poles, a warm interior light
        objs.append(cube(f'ext_car_ceil_{tag}', (L - 1.0, 2.7, 0.02), (x0 + L / 2, yc, zb + 2.95), M['car_interior'], c))
        for s in (-0.5, 0.5): objs.append(cube(f'ext_car_lamp_{tag}', (L - 1.4, 0.18, 0.03), (x0 + L / 2, yc + s, zb + 2.92), M['car_interior_light'], c))
        objs.append(cube(f'ext_car_floor_{tag}', (L - 1.0, 2.8, 0.04), (x0 + L / 2, yc, zb + 0.32), M['car_floor'], c))
        x = x0 + 3.6
        while x < x0 + L - 3.4:
            for s in (-1, 1):
                if all(abs(x - d) > 1.0 for d in doors):
                    objs.append(cube(f'ext_car_seat_{tag}', (0.12, 1.0, 0.75), (x, yc + s * 0.85, zb + 0.95), M['seat_fab'], c, bevel=0.04))
                    objs.append(cube(f'ext_car_cush_{tag}', (0.5, 1.0, 0.12), (x + 0.3, yc + s * 0.85, zb + 0.75), M['seat_fab'], c, bevel=0.04))
            x += 0.95
        for k in range(3):
            l = bpy.data.lights.new(f'ext_car_in_{tag}', 'AREA'); l.shape = 'RECTANGLE'; l.size = L / 3 - 0.5; l.size_y = 2.4; l.energy = 160; l.color = (1.0, 0.95, 0.86)
            lo = bpy.data.objects.new(f'ext_car_in_{tag}', l); lo.location = (x0 + L * (k + 0.5) / 3, yc, zb + 2.85); c.objects.link(lo); lights.append(lo)
    car_o = join(objs, f'ext_car_{tag}')
    for lo in lights: lo.parent = car_o   # the car sits at the origin, so the lights keep their place and ride with it
    return car_o

# ---------------------------------------------------------------- litter
def litter_kit(c, M):
    """procedural pieces: paper cups, coffee lids, crumpled paper, newspapers, wrappers, butts, gum"""
    K = {}
    cup = tube('lit_cup', 0.042, 0.12, (0, 0, 0), M['paper_white'], c, verts=18, r2=0.03); K['cup'] = cup
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.05)
    rng = random.Random(3)
    for v in bm.verts: v.co *= rng.uniform(0.6, 1.15)
    me = bpy.data.meshes.new('lit_paper'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('lit_paper', me); me.materials.append(M['paper_white']); c.objects.link(o); K['paper'] = o
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=8, y_segments=6, size=0.2)
    for v in bm.verts: v.co.z = 0.01 * math.sin(v.co.x * 30) + rng.uniform(0, 0.012); v.co.x *= 1.4
    me = bpy.data.meshes.new('lit_news'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('lit_news', me); me.materials.append(M['newsprint']); c.objects.link(o); K['news'] = o
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.04)
    for v in bm.verts: v.co.x *= 1.6; v.co.z *= 0.35; v.co *= rng.uniform(0.8, 1.2)
    me = bpy.data.meshes.new('lit_wrap'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('lit_wrap', me); me.materials.append(M['wrapper']); c.objects.link(o); K['wrap'] = o
    K['butt'] = tube('lit_butt', 0.004, 0.025, (0, 0, 0), M['butt'], c, verts=6, rot=(0, math.pi / 2, 0))
    K['gum'] = tube('lit_gum', 0.012, 0.002, (0, 0, 0), M['gum'], c, verts=10)
    for o in K.values(): o.hide_render = True; o.hide_viewport = True
    return K

def scatter(c, src, pts, name, rng, zjit=0.0, scale=(0.8, 1.2), tilt=0.0):
    """linked copies of src at pts (x, y, z), random yaw and scale"""
    out = []
    for (x, y, z) in pts:
        o = src.copy(); o.hide_render = False; o.hide_viewport = False; o.name = name; c.objects.link(o)
        s = rng.uniform(*scale); o.scale = (s, s, s); o.location = (x, y, z + rng.uniform(0, zjit)); o.rotation_euler = (rng.uniform(-tilt, tilt), rng.uniform(-tilt, tilt), rng.uniform(0, math.tau)); out.append(o)
    return out

def floor_drop(o):
    """sit an imported model on z = 0: put its lowest point at the origin"""
    zs = [v.co.z for v in o.data.vertices]; z0 = min(zs)
    o.data.transform(Matrix.Translation((0, 0, -z0))); return o

# ---------------------------------------------------------------- the pass
def realize(M, c, ZS, zp, zr, TR, PL, PX0, PX1, zl=None, upper=None):
    rng = random.Random(27)
    # 1. surfaces: CC0 Poly Haven sets, box projected, with floor-line grime and AO
    T = {k: ph_tex(k) for k in ('dirty_concrete', 'long_white_tiles', 'concrete_wall_008', 'gravel_floor_02', 'rusty_metal_02', 'worn_tile_floor', 'concrete_floor_worn_001', 'painted_concrete')}
    new = {
        'platform': box_tex_mat('pr_platform', T['dirty_concrete'], 1.6, (0.36, 0.345, 0.32), 1.0, grime=0.35, wet=0.5, nstr=1.2),
        'tile': box_tex_mat('pr_tile', T['long_white_tiles'], 1.2, (0.86, 0.84, 0.78), 0.9, grime=0.45),
        'conc_dark': box_tex_mat('pr_ceiling', T['concrete_wall_008'], 3.0, (0.42, 0.41, 0.4), 1.0, grime=0.5),
        'ballast': box_tex_mat('pr_ballast', T['gravel_floor_02'], 1.4, (0.42, 0.38, 0.34), 1.0, grime=0.4, nstr=1.4),
        'tie': box_tex_mat('pr_tie', T['dirty_concrete'], 1.0, (0.45, 0.43, 0.4), 1.0, grime=0.3),
        'rail': box_tex_mat('pr_rail', T['rusty_metal_02'], 0.6, (0.7, 0.55, 0.45), 0.8, grime=0.2),
        'column': box_tex_mat('pr_column', T['concrete_wall_008'], 1.5, (0.62, 0.61, 0.58), 1.0, grime=0.9),
        'conc_floor': box_tex_mat('pr_concourse', T['worn_tile_floor'], 1.6, (0.9, 0.88, 0.84), 0.9, grime=0.2),
    }
    for o in list(c.all_objects):
        if o.type != 'MESH': continue
        for i, m in enumerate(o.data.materials):
            for k, nm in new.items():
                if m is not None and k in M and m == M[k] and (o.name.startswith(('ext_plat', 'ext_track', 'ext_lconc', 'ext_conc', 'ext_upconc', 'ext_junction', 'ext_station')) or o.location.z < ZS - 2):
                    o.data.materials[i] = nm
    # 2. the trains: a lit commuter train standing on track 6 with doors open, an intercity train on track 7
    M.update({
        'car_steel': steel_mat('pr_car_steel'), 'car_steel_smooth': steel_mat('pr_car_smooth', flute=0.0), 'dest_led': flat('pr_dest', (0.1, 0.05, 0.0), 0.4, emit=(1.0, 0.55, 0.08), estr=6), 'rail_head': flat('pr_rail_head', (0.72, 0.73, 0.74), 0.18, 1.0), 'housing': flat('pr_housing', (0.18, 0.18, 0.19), 0.5, 0.6), 'diff_cool': flat('pr_diff_cool', (1, 1, 1), 0.3, emit=(0.88, 0.95, 1.0), estr=14), 'diff_warm': flat('pr_diff_warm', (1, 1, 1), 0.3, emit=(1.0, 0.86, 0.68), estr=11), 'diff_dead': flat('pr_diff_dead', (0.3, 0.3, 0.3), 0.4), 'conduit_g': flat('pr_conduit', (0.42, 0.43, 0.43), 0.4, 0.8), 'stain': flat('pr_stain', (0.03, 0.025, 0.02), 0.25), 'notice': flat('pr_notice', (0.75, 0.7, 0.1), 0.5), 'exit_red': flat('pr_exit', (0.3, 0.0, 0.0), 0.4, emit=(1.0, 0.08, 0.05), estr=5), 'joint': flat('pr_joint', (0.04, 0.04, 0.04), 0.9), 'car_steel_roof': steel_mat('pr_car_roof', (0.5, 0.5, 0.5), dirt=0.8),
        'car_glass': flat('pr_car_glass', (0.01, 0.012, 0.015), 0.04, 0.0), 'car_glass_lit': flat('pr_car_glass_lit', (0.05, 0.05, 0.05), 0.05, trans=0.6),
        'rubber': flat('pr_rubber', (0.012, 0.012, 0.013), 0.7), 'under': flat('pr_under', (0.03, 0.028, 0.026), 0.75, 0.3), 'bogie': flat('pr_bogie', (0.05, 0.04, 0.035), 0.7, 0.4),
        'wheel': flat('pr_wheel', (0.22, 0.18, 0.15), 0.45, 1.0), 'spring': flat('pr_spring', (0.6, 0.3, 0.05), 0.6, 0.3), 'tread': flat('pr_tread', (0.25, 0.25, 0.25), 0.6, 1.0),
        'red': flat('pr_red', (0.45, 0.02, 0.025), 0.35), 'blue': flat('pr_blue', (0.01, 0.04, 0.2), 0.35), 'white': flat('pr_white', (0.75, 0.75, 0.75), 0.35),
        'orange': flat('pr_orange', (0.8, 0.22, 0.01), 0.35), 'purple': flat('pr_purple', (0.12, 0.02, 0.2), 0.35),
        'headlight': flat('pr_head', (1, 1, 1), 0.1, emit=(1, 0.95, 0.85), estr=30), 'car_interior': flat('pr_car_in', (0.6, 0.6, 0.58), 0.6),
        'car_interior_light': flat('pr_car_inl', (1, 1, 1), 0.3, emit=(1, 0.96, 0.88), estr=12), 'car_floor': flat('pr_car_floor', (0.08, 0.08, 0.09), 0.7),
        'seat_fab': flat('pr_seat_fab', (0.06, 0.08, 0.16), 0.85),
        'paper_white': flat('pr_paper', (0.7, 0.68, 0.62), 0.8), 'newsprint': flat('pr_news', (0.42, 0.41, 0.38), 0.85), 'wrapper': flat('pr_wrap', (0.55, 0.06, 0.04), 0.3, 0.6),
        'butt': flat('pr_butt', (0.65, 0.5, 0.3), 0.8), 'gum': flat('pr_gum', (0.03, 0.03, 0.03), 0.4),
    })
    for k in range(3): car(c, M, -12.0 + k * 25.9, 25.4, TR[1], zr, ('orange', 'purple', 'orange'), lead=(k == 0), lit=True, open_doors=False, tag=f'c{k}')
    for k in range(3): car(c, M, 5.0 + k * 25.9, 25.4, TR[2], zr, ('red', 'white', 'blue'), lead=(k == 0), lit=(k == 1), tag=f'i{k}')
    # 3. Astra 7: the light. Real fixtures (housing, diffuser) every 2 m in two rows per island, mostly 4100 K, some 3000 K
    # replacements, a few dead; each a small downward area light so the track bed falls 1.5 to 2.5 stops darker
    for o in list(c.all_objects):
        if o.name.startswith(('ext_plat_light', 'ext_plat_tubes')): bpy.data.objects.remove(o)
    fx = {'housing': [], 'diff_cool': [], 'diff_warm': [], 'diff_dead': []}
    for (ya, yb) in PL:
        for yy in (ya + 2.0, yb - 2.0):
            for x in np.arange(PX0 + 2, PX1 - 1, 2.0):
                kind = rng.choices(('diff_cool', 'diff_warm', 'diff_dead'), (0.82, 0.12, 0.06))[0]
                fx['housing'].append(cube('pr_fix_h', (1.5, 0.26, 0.09), (x, yy, zp + 4.52), M['housing'], c))
                fx[kind].append(cube('pr_fix_d', (1.42, 0.16, 0.012), (x, yy, zp + 4.47), M[kind], c))
                if kind != 'diff_dead':
                    l = bpy.data.lights.new('pr_fix_l', 'AREA'); l.shape = 'RECTANGLE'; l.size, l.size_y = 1.4, 0.16; l.energy = rng.uniform(95, 130)
                    l.color = (0.9, 0.96, 1.0) if kind == 'diff_cool' else (1.0, 0.82, 0.62); l.spread = math.radians(120)
                    lo = bpy.data.objects.new('pr_fix_l', l); lo.location = (x, yy, zp + 4.45); c.objects.link(lo)
    for k, v in fx.items(): join(v, 'pr_fixtures_' + k)
    # 4. Astra 7: the infrastructure layer. Conduit runs with brackets every 1.5 m, a cable tray over each track, junction
    # boxes on the columns, the platform cast in 3 m sections with joints, the rail heads polished
    inf = []
    for (ya, yb) in PL:
        ym = (ya + yb) / 2
        for k, dy in enumerate((-0.9, -0.75, 0.6)):
            inf.append(tube('pr_conduit', 0.022 + 0.008 * k, PX1 - PX0 + 40, ((PX0 + PX1) / 2, ym + dy, zp + 4.38 - 0.04 * k), M['conduit_g'], c, rot=(0, math.pi / 2, 0), verts=10))
        for x in np.arange(PX0 - 18, PX1 + 18, 1.5): inf.append(cube('pr_bracket', (0.04, 1.8, 0.03), (x, ym - 0.15, zp + 4.42), M['housing'], c))
        for x in np.arange(PX0, PX1, 3.0): inf.append(cube('pr_joint', (0.012, yb - ya - 0.2, 0.004), (x, ym, zp + 0.001), M['joint'], c))
        for x in np.arange(-48.0, PX1, 8.0):
            if rng.random() < 0.5: inf.append(cube('pr_jbox', (0.22, 0.12, 0.3), (x + 0.28, ym + 0.1, zp + 1.6), M['housing'], c, bevel=0.01))
            inf.append(tube('pr_colpipe', 0.025, 4.2, (x - 0.26, ym + 0.12, zp + 2.3), M['conduit_g'], c, verts=8))
    for y in TR:
        inf.append(cube('pr_tray', (PX1 - PX0 + 60, 0.35, 0.08), ((PX0 + PX1) / 2, y, zp + 4.3), M['conduit_g'], c))
        for sgn in (-1, 1): inf.append(cube('pr_railhead', (PX1 - PX0 + 60, 0.068, 0.012), ((PX0 + PX1) / 2, y + sgn * (1.435 / 2 + 0.0325), zr + 0.002), M['rail_head'], c))
    join(inf, 'pr_infrastructure')
    # 5. Astra 7: signs. A hanging track sign every 12 m on each island, exits at the stairs, a safety notice at each stair foot
    try:
        import exterior as X
        for (ya, yb), nums in zip(PL, ((5, 6), (7, 8))):
            ym = (ya + yb) / 2
            for x in np.arange(PX0 + 6, PX1 - 4, 12.0):
                cube('pr_sign_bg', (0.06, 2.2, 0.42), (x, ym, zp + 3.75), M['sign_dark'], c)
                for side in (-1, 1):
                    X.text_obj('pr_sign_t', 'Track %d   %s   Track %d' % (nums[0], chr(0x2190) if side < 0 else chr(0x2192), nums[1]), 0.15, (x + side * 0.035, ym, zp + 3.75), X.face_rot(side, 0), M['sign_txt'], c, font=X.FONT_HELV)
                tube('pr_sign_rod', 0.012, 0.8, (x, ym - 0.9, zp + 4.2), M['housing'], c, verts=6); tube('pr_sign_rod', 0.012, 0.8, (x, ym + 0.9, zp + 4.2), M['housing'], c, verts=6)
            for x in (-7.6, 32.4):
                cube('pr_notice', (0.03, 0.6, 0.8), (x - 0.25, ym + 1.3, zp + 1.5), M['notice'], c)
                X.text_obj('pr_exit', 'EXIT', 0.2, (x - 0.31, ym, zp + 4.0), X.face_rot(-1, 0), M['exit_red'], c, font=X.FONT_HELV)
    except Exception as e: print('signs', e)
    # 6. litter where it collects (Astra 7): 70% at column bases, wall and stair junctions and the sheltered platform
    # backs; the walking line stays fairly clear. Per 20 m: 15 to 30 scraps, 3 to 5 cups, 2 to 4 bigger things
    K = litter_kit(c, M)
    PHS = {}
    for n in ('trashbag', 'metal_trash_can', 'can_rusted', 'cardboard_box_01', 'cigarette_pack', 'plastic_bottle_gallon', 'street_rat', 'WetFloorSign_01', 'security_camera_02', 'utility_box_01', 'modular_street_seating'):
        try: o = ph_model(n); floor_drop(o); c.objects.link(o); o.hide_render = True; o.hide_viewport = True; PHS[n] = o
        except Exception as e: print('ph model', n, e)
    L20 = (PX1 - PX0) / 20
    for (ya, yb) in PL:
        ym = (ya + yb) / 2; cols = list(np.arange(-48.0, PX1, 8.0))
        def spot(n):
            out = []
            for _ in range(n):
                r = rng.random()
                if r < 0.45:   # round a column base
                    x = rng.choice(cols); a = rng.uniform(0, math.tau); d = rng.uniform(0.28, 0.7); out.append((x + math.cos(a) * d, ym + math.sin(a) * d, zp + 0.002))
                elif r < 0.7:   # the feet of the stairs and the bench line
                    x = rng.choice((-7.6, 32.4)) + rng.uniform(-1.5, 0.3); out.append((x, ym + rng.uniform(-1.6, 1.6), zp + 0.002))
                else:   # anywhere, thin
                    out.append((rng.uniform(PX0 + 2, PX1 - 2), rng.uniform(ya + 0.9, yb - 0.9), zp + 0.002))
            return out
        scatter(c, K['cup'], [(x, y, z + 0.03) for (x, y, z) in spot(int(4 * L20))], 'lit_cup', rng, tilt=1.57)
        scatter(c, K['paper'], spot(int(12 * L20)), 'lit_paper', rng, scale=(0.5, 1.3))
        scatter(c, K['news'], spot(int(1.2 * L20)), 'lit_news', rng, scale=(0.7, 1.3))
        scatter(c, K['wrap'], spot(int(10 * L20)), 'lit_wrap', rng, scale=(0.6, 1.4))
        scatter(c, K['butt'], spot(int(25 * L20)), 'lit_butt', rng, scale=(0.8, 1.2))
        scatter(c, K['gum'], [(rng.uniform(PX0 + 2, PX1 - 2), rng.uniform(ya + 0.9, yb - 0.9), zp + 0.002) for _ in range(int(45 * L20))], 'lit_gum', rng, scale=(0.8, 1.4))
        # spill halos and heel marks: dark glossy discs 0.2 to 0.8 m
        for (x, y, z) in spot(int(1.5 * L20)):
            st = tube('pr_spill', 1.0, 0.001, (x, y, zp + 0.0015), M['stain'], c, verts=24); r_ = rng.uniform(0.1, 0.4); st.scale = (r_ * rng.uniform(0.7, 1.4), r_, 1)
        for x in cols[::2]:
            if 'metal_trash_can' in PHS: scatter(c, PHS['metal_trash_can'], [(x + 0.55, ym + 0.55, zp)], 'pr_trashcan', rng, scale=(1, 1))
            if 'trashbag' in PHS and rng.random() < 0.6: scatter(c, PHS['trashbag'], [(x + 0.6 + rng.uniform(0, 0.5), ym + 0.95, zp)], 'pr_trashbag', rng, scale=(0.8, 1.1))
        for x in cols[1::4]:
            if 'modular_street_seating' in PHS: scatter(c, PHS['modular_street_seating'], [(x + 4.0, ym, zp)], 'pr_bench', rng, scale=(1, 1))
        for n_, k_ in (('can_rusted', 6), ('cardboard_box_01', 1), ('cigarette_pack', 5), ('plastic_bottle_gallon', 1)):
            if n_ in PHS: scatter(c, PHS[n_], spot(k_), 'pr_' + n_, rng, scale=(0.9, 1.1), tilt=0.0 if n_ == 'cardboard_box_01' else 1.4)
        if 'WetFloorSign_01' in PHS: scatter(c, PHS['WetFloorSign_01'], [(rng.uniform(-30, 40), ym + rng.uniform(-1.5, 1.5), zp)], 'pr_wetfloor', rng, scale=(1, 1))
        if 'security_camera_02' in PHS:
            for x in np.arange(-40.0, PX1, 24.0): o = scatter(c, PHS['security_camera_02'], [(x, ym, zp + 4.3)], 'pr_cam', rng, scale=(1, 1))[0]; o.rotation_euler = (math.pi, 0, rng.uniform(0, math.tau))
    # down on the tracks: what people drop collects against the rails and the platform walls, and the rats
    for y in TR:
        def tp(n):
            out = []
            for _ in range(n):
                r = rng.random(); x = rng.uniform(PX0 - 25, PX1 + 25)
                yy = y + rng.choice((-1, 1)) * (0.77 + rng.uniform(0, 0.12)) if r < 0.5 else y + rng.uniform(-1.6, 1.6)
                out.append((x, yy, zr - 0.16))
            return out
        scatter(c, K['cup'], [(x, yy, z + 0.03) for (x, yy, z) in tp(14)], 'lit_cup', rng, tilt=1.57)
        scatter(c, K['paper'], tp(60), 'lit_paper', rng, scale=(0.5, 1.4))
        scatter(c, K['wrap'], tp(50), 'lit_wrap', rng, scale=(0.6, 1.4))
        scatter(c, K['news'], tp(10), 'lit_news', rng, scale=(0.7, 1.3), tilt=0.3)
        if 'can_rusted' in PHS: scatter(c, PHS['can_rusted'], tp(12), 'pr_can_track', rng, tilt=1.4)
        if 'plastic_bottle_gallon' in PHS: scatter(c, PHS['plastic_bottle_gallon'], tp(2), 'pr_bottle_track', rng, tilt=1.5)
        if 'street_rat' in PHS: scatter(c, PHS['street_rat'], tp(2 if y in (TR[0], TR[3]) else 1), 'pr_rat', rng, scale=(0.9, 1.1))
    if 'utility_box_01' in PHS:
        for x in np.arange(PX0 - 20, PX1 + 20, 13.0):
            for yw, s in ((19.0, 1), (55.0, -1)):
                o = scatter(c, PHS['utility_box_01'], [(x, yw + s * 0.25, zp + 0.9)], 'pr_ubox', rng, scale=(1, 1))[0]; o.rotation_euler = (0, 0, math.pi / 2 if s > 0 else -math.pi / 2)
    print('penn_real: trains, light, infrastructure, signs, litter', len(PHS), 'CC0 models')
