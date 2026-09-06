"""THE MUSEUM institution kit: hero objects for the art museum rooms, built headless in Blender and exported as small GLBs.

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python build_institution_kit.py -- --out ../../../assets/museum/props [--only whale,capital]

Every asset is flat shaded principled materials, no textures, so files stay under a megabyte and load instantly in the museum.
Units are metres; kit.prop() rescales by height at placement, so the sizes here only need to be proportionate.
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix

C = bpy.context
D = bpy.data
PI = math.pi

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(args[args.index("--out") + 1]) if "--out" in args else os.path.join(os.path.dirname(os.path.abspath(__file__)), "_out")
ONLY = set(args[args.index("--only") + 1].split(",")) if "--only" in args else None
os.makedirs(OUT, exist_ok=True)

# ---------- palette (MLow + Blossom + museum materials) ----------
INK = (0.05, 0.05, 0.05)
CLOUD = (0.94, 0.957, 0.973)
EYE_BLUE = (0.16, 0.38, 1.0)
CYAN = (0.0, 0.9, 1.0)
PINK = (1.0, 0.18, 0.39)
BRONZE = (0.28, 0.21, 0.13)
BRONZE_GREEN = (0.37, 0.6, 0.55)
MARBLE = (0.88, 0.86, 0.82)
LIMESTONE = (0.78, 0.74, 0.66)
BASALT = (0.16, 0.16, 0.17)
BONE = (0.9, 0.87, 0.8)
WHALE = (0.34, 0.42, 0.5)
WHALE_BELLY = (0.78, 0.8, 0.82)
GOLD = (0.83, 0.66, 0.32)
GLASS = (0.8, 0.9, 0.95)
STEEL = (0.55, 0.58, 0.62)
LEAF = (0.22, 0.46, 0.24)
TERRA = (0.62, 0.36, 0.26)
VELVET = (0.55, 0.06, 0.12)


def mat(name, color, metal=0.0, rough=0.6, emit=None, emit_strength=1.0, alpha=None):
    m = D.materials.get(name)
    if m:
        return m
    m = D.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    if alpha is not None:
        bsdf.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def active():
    return C.active_object


def assign(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)
    return o


def apply_all(o):
    C.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.select_set(False)
    return o


def cube(sx, sy, sz, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = active(); o.scale = (sx, sy, sz)
    return assign(apply_all(o), m)


def cyl(r, h, loc, m, r2=None, seg=32, rot=(0, 0, 0)):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=seg, location=loc, rotation=rot)
    return assign(active(), m)


def sphere(r, loc, m, seg=32, rings=16, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings, location=loc)
    o = active(); o.scale = scale
    return assign(apply_all(o), m)


def torus(major, minor, loc, m, rot=(0, 0, 0), seg=48, rseg=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=seg, minor_segments=rseg, location=loc, rotation=rot)
    return assign(active(), m)


def cone(r, h, loc, m, seg=24, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0, depth=h, vertices=seg, location=loc, rotation=rot)
    return assign(active(), m)


def lathe(profile, m, seg=48, name="lathe"):
    """profile: list of (radius, z) from bottom to top; spun round Z."""
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * PI, steps=seg, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = D.meshes.new(name); bm.to_mesh(me); bm.free()
    o = D.objects.new(name, me); C.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    return assign(o, m)


def tube(points, radius, m, seg=12, name="tube"):
    cu = D.curves.new(name, "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = sp.bezier_points[i]; bp.co = p; bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.bevel_depth = radius; cu.bevel_resolution = max(2, seg // 4); cu.use_fill_caps = True
    o = D.objects.new(name, cu); C.collection.objects.link(o)
    C.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target="MESH"); o.select_set(False)
    return assign(o, m)


def taper(o, fn, axis=1):
    """Scale each vertex's cross section by fn(t), t from 0 (min) to 1 (max) along axis."""
    me = o.data
    lo = min(v.co[axis] for v in me.vertices); hi = max(v.co[axis] for v in me.vertices)
    for v in me.vertices:
        t = (v.co[axis] - lo) / max(1e-6, hi - lo)
        f = fn(t)
        for a in range(3):
            if a != axis:
                v.co[a] *= f
    me.update()
    return o


def offset(o, fn):
    """Move vertices by a function of their coordinates: fn(co) -> Vector delta."""
    for v in o.data.vertices:
        v.co += fn(v.co)
    o.data.update()
    return o


def smooth(o, on=True):
    for p in o.data.polygons:
        p.use_smooth = on
    return o


def subsurf(o, levels=1):
    md = o.modifiers.new("ss", "SUBSURF"); md.levels = levels; md.render_levels = levels
    C.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=md.name)
    return o


def bevel(o, width=0.02, segs=2):
    md = o.modifiers.new("bv", "BEVEL"); md.width = width; md.segments = segs; md.limit_method = "ANGLE"
    C.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=md.name)
    return o


def displace(o, strength=0.05, size=0.4, seed=1):
    tex = D.textures.new("n%d" % seed, "CLOUDS"); tex.noise_scale = size; tex.noise_depth = 2
    md = o.modifiers.new("dp", "DISPLACE"); md.texture = tex; md.strength = strength
    C.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=md.name)
    return o


def boolean(target, cutter, op="DIFFERENCE"):
    md = target.modifiers.new("bool", "BOOLEAN"); md.operation = op; md.object = cutter; md.solver = "EXACT"
    C.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=md.name)
    D.objects.remove(cutter, do_unlink=True)
    return target


def join(objs, name):
    for o in objs:
        o.select_set(True)
    C.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = active(); o.name = name
    o.select_set(False)
    return o


def move(o, x=0, y=0, z=0):
    o.location = (o.location.x + x, o.location.y + y, o.location.z + z)
    return o


def rot(o, x=0, y=0, z=0):
    o.rotation_euler = (o.rotation_euler.x + x, o.rotation_euler.y + y, o.rotation_euler.z + z)
    return o


def export(name):
    for o in C.scene.objects:
        o.select_set(True)
    path = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT", export_image_format="NONE", export_normals=True, export_texcoords=False, export_animations=False)
    size = os.path.getsize(path)
    tris = sum(len(p.vertices) - 2 for o in C.scene.objects if o.type == "MESH" for p in o.data.polygons)
    print(f"  {name:<22} {size/1e3:7.0f} KB  {tris:6d} tris")
    return size, tris


# ---------- the assets ----------
def blue_whale():
    m = mat("whale", WHALE, 0, 0.55); mb = mat("whaleBelly", WHALE_BELLY, 0, 0.6)
    body = sphere(1, (0, 0, 0), m, 48, 24, (1.6, 12.5, 1.5))
    taper(body, lambda t: 0.25 + 0.75 * math.sin(min(1, t * 1.15) * PI) ** 0.7 if t < 0.92 else 0.12 + 0.3 * (1 - t) * 3)
    offset(body, lambda c: Vector((0, 0, -0.35 * max(0, -c.y / 12.5) if c.z < 0 else 0)))
    belly = sphere(1, (0, 1.5, -0.55), mb, 32, 16, (1.25, 8.0, 0.85))
    taper(belly, lambda t: 0.3 + 0.7 * math.sin(t * PI) ** 0.8)
    for j in range(9):
        cube(2.2, 0.03, 0.05, (0, 2.6 - j * 0.9, -1.05 - j * 0.02), mb)
    for s in (-1, 1):
        fl = cube(0.45, 2.8, 0.14, (s * 1.7, 2.6, -0.5), m, (0, 0, s * 0.35)); taper(fl, lambda t: 0.4 + 0.6 * (1 - t))
    fluke = cube(4.6, 1.3, 0.14, (0, -12.2, 0.4), m); taper(fluke, lambda t: 0.3 + 0.7 * t, axis=0); offset(fluke, lambda c: Vector((0, -0.35 * abs(c.x), 0)))
    dorsal = cube(0.14, 0.9, 0.5, (0, -6.5, 1.45), m); taper(dorsal, lambda t: 0.2 + 0.8 * (1 - t), axis=2)
    eye = sphere(0.09, (1.05, 9.6, 0.15), mat("eyeDark", INK, 0, 0.3), 12, 8)
    for o in (body, belly, fluke, dorsal): smooth(o)
    o = join([body, belly, fluke, dorsal, eye] + [x for x in C.scene.objects if x not in (body, belly, fluke, dorsal, eye)], "blue_whale")
    return o


def trex_skeleton():
    b = mat("bone", BONE, 0, 0.7)
    parts = []
    spine = [Vector((0, -6.5 + i * 0.55, 3.0 + 1.6 * math.sin((i / 20) * PI) - (0.9 if i > 16 else 0) * ((i - 16) / 4) ** 2)) for i in range(21)]
    parts.append(tube(spine, 0.14, b, name="spine"))
    for i in range(3, 18):
        p = spine[i]; parts.append(sphere(0.22, p, b, 10, 8, (1, 0.7, 1.1)))
    for i in range(6, 13):
        p = spine[i]
        for s in (-1, 1):
            rib = tube([p + Vector((s * 0.15, 0, -0.1)), p + Vector((s * 0.9, 0, -0.9)), p + Vector((s * 0.7, 0, -2.0)), p + Vector((s * 0.25, 0, -2.6))], 0.05, b, name="rib"); parts.append(rib)
    skull = cube(0.9, 1.9, 0.9, (0, spine[-1].y + 1.0, spine[-1].z - 0.1), b); bevel(skull, 0.15, 3); parts.append(skull)
    jaw = cube(0.7, 1.6, 0.3, (0, spine[-1].y + 1.1, spine[-1].z - 0.75), b, (0.25, 0, 0)); parts.append(jaw)
    for s in (-1, 1):
        parts.append(sphere(0.18, (s * 0.35, spine[-1].y + 1.3, spine[-1].z + 0.2), mat("socket", INK, 0, 0.4), 10, 8))
        for k in range(7):
            parts.append(cone(0.05, 0.28, (s * 0.38, spine[-1].y + 0.4 + k * 0.22, spine[-1].z - 0.62), b, 6, (PI, 0, 0)))
    hip = spine[9]
    for s in (-1, 1):
        parts.append(tube([hip + Vector((s * 0.5, 0, -0.2)), hip + Vector((s * 0.7, 0.4, -1.6)), hip + Vector((s * 0.7, -0.3, -2.7)), hip + Vector((s * 0.75, 0.3, -3.0))], 0.12, b, name="leg"))
        for k in range(3):
            parts.append(tube([hip + Vector((s * (0.55 + k * 0.15), 0.3, -3.0)), hip + Vector((s * (0.45 + k * 0.25), 0.9, -3.05))], 0.05, b, name="toe"))
        arm = spine[15]
        parts.append(tube([arm + Vector((s * 0.4, 0, -0.3)), arm + Vector((s * 0.5, 0.35, -0.9)), arm + Vector((s * 0.4, 0.7, -0.8))], 0.05, b, name="arm"))
    base = cube(2.6, 9.4, 0.12, (0, -2.5, -0.06), mat("plinthDark", (0.12, 0.12, 0.13), 0, 0.5)); parts.append(base)
    for s in (-1, 1):
        parts.append(cyl(0.03, 3.0, (s * 0.75, hip.y + 0.3, 1.5), mat("armature", STEEL, 0.8, 0.3), seg=8))
    return join(parts, "trex_skeleton")


def noguchi_stone(idx):
    m = mat("basalt", BASALT, 0, 0.85); mp = mat("basaltCut", (0.42, 0.4, 0.4), 0.1, 0.25)
    random.seed(20 + idx)
    r = 0.55 + 0.2 * idx
    o = cyl(r, 2.4 + idx * 0.6, (0, 0, 1.2 + idx * 0.3), m, r2=r * (0.85 + 0.1 * idx), seg=7 + idx)
    displace(o, 0.12, 0.6, 30 + idx); smooth(o, False)
    cutter = cube(3, 3, 3, (0.9 + idx * 0.2, 0, 1.6 + idx * 0.5), mp, (0.2 * idx, 0.5 + 0.2 * idx, 0.1))
    boolean(o, cutter)
    face = cube(1.2, 1.2, 0.02, (0.6 + idx * 0.15, 0, 1.6 + idx * 0.5), mp, (0.2 * idx, 0.5 + 0.2 * idx + PI / 2, 0.1))
    return join([o, face], f"noguchi_stone_{idx + 1}")


def corinthian_capital():
    m = mat("limestone", LIMESTONE, 0, 0.75)
    bell = lathe([(0.5, 0), (0.52, 0.1), (0.6, 0.5), (0.75, 0.9), (0.9, 1.15), (0.86, 1.2)], m, 48, "bell")
    parts = [bell]
    for row, (z, n, h) in enumerate([(0.05, 8, 0.55), (0.45, 8, 0.6)]):
        for i in range(n):
            a = (i / n) * 2 * PI + row * PI / n
            leaf = cone(0.14, h, (math.cos(a) * (0.62 + row * 0.12), math.sin(a) * (0.62 + row * 0.12), z + h / 2), m, 8)
            leaf.rotation_euler = (0.35 * math.sin(a), -0.35 * math.cos(a), 0); parts.append(leaf)
            tip = sphere(0.1, (math.cos(a) * (0.86 + row * 0.12), math.sin(a) * (0.86 + row * 0.12), z + h), m, 10, 6); parts.append(tip)
    for i in range(4):
        a = (i / 4) * 2 * PI + PI / 4
        parts.append(torus(0.12, 0.04, (math.cos(a) * 0.86, math.sin(a) * 0.86, 1.02), m, (PI / 2, 0, a), 24, 8))
    abacus = cube(2.0, 2.0, 0.16, (0, 0, 1.28), m); bevel(abacus, 0.04, 2); parts.append(abacus)
    return join(parts, "corinthian_capital")


def ionic_capital():
    m = mat("limestone", LIMESTONE, 0, 0.75)
    parts = [lathe([(0.5, 0), (0.56, 0.18), (0.6, 0.3)], m, 40, "echinus")]
    for s in (-1, 1):
        pts = []
        for k in range(28):
            t = k / 27; ang = t * 2.4 * PI; rr = 0.42 * (1 - 0.82 * t)
            pts.append(Vector((s * (0.62 + rr * math.cos(ang)), 0, 0.45 + rr * math.sin(ang))))
        parts.append(tube(pts, 0.06, m, name="volute"))
        parts.append(sphere(0.09, pts[-1], m, 10, 8))
    parts.append(cube(1.7, 0.8, 0.28, (0, 0, 0.45), m))
    ab = cube(1.8, 1.0, 0.12, (0, 0, 0.72), m); bevel(ab, 0.03, 2); parts.append(ab)
    return join(parts, "ionic_capital")


def coffered_dome():
    m = mat("plasterDome", (0.9, 0.87, 0.8), 0, 0.85); mg = mat("giltRosette", GOLD, 0.8, 0.3)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=6, segments=24, ring_count=12)
    o = active(); assign(o, m)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 0.6], context="VERTS")
    faces = [f for f in bm.faces if f.calc_center_median().z < 5.4]
    res = bmesh.ops.inset_individual(bm, faces=faces, thickness=0.16, depth=0.0)
    inner = [f for f in bm.faces if f.calc_center_median().z < 5.4 and f not in res.get("faces", [])]
    bmesh.ops.inset_individual(bm, faces=inner, thickness=0.08, depth=0.28)
    for f in bm.faces: f.normal_flip()
    bm.to_mesh(o.data); bm.free()
    parts = [o]
    for ring, n, z, rr in [(0, 12, 1.6, 5.7), (1, 12, 3.2, 5.0)]:
        for i in range(n):
            a = (i / n) * 2 * PI + ring * PI / n
            parts.append(sphere(0.12, (math.cos(a) * rr, math.sin(a) * rr, z), mg, 8, 6))
    parts.append(torus(1.6, 0.12, (0, 0, 5.85), mg, seg=48, rseg=10))
    return join(parts, "coffered_dome")


def balustrade():
    m = mat("marble", MARBLE, 0, 0.4)
    parts = [cube(3.0, 0.32, 0.12, (0, 0, 0.06), m), cube(3.0, 0.3, 0.14, (0, 0, 1.0), m)]
    prof = [(0.06, 0.12), (0.12, 0.16), (0.07, 0.22), (0.07, 0.34), (0.13, 0.5), (0.11, 0.66), (0.07, 0.8), (0.1, 0.88), (0.06, 0.93)]
    for i in range(8):
        b = lathe(prof, m, 20, "baluster"); b.location = (-1.32 + i * 0.377, 0, 0); parts.append(b)
    for s in (-1, 1):
        p = cube(0.26, 0.34, 1.1, (s * 1.5, 0, 0.55), m); bevel(p, 0.02, 2); parts.append(p)
        parts.append(sphere(0.12, (s * 1.5, 0, 1.2), m, 12, 8))
    return join(parts, "balustrade")


def newel_urn():
    m = mat("marble", MARBLE, 0, 0.4)
    post = cube(0.44, 0.44, 1.1, (0, 0, 0.55), m); bevel(post, 0.02, 2)
    cap = cube(0.54, 0.54, 0.08, (0, 0, 1.14), m)
    urn = lathe([(0.1, 1.18), (0.26, 1.2), (0.16, 1.3), (0.14, 1.42), (0.36, 1.66), (0.34, 1.9), (0.22, 2.0), (0.28, 2.06), (0.14, 2.12), (0.0, 2.14)], m, 32, "urn")
    for i in range(12):
        a = (i / 12) * 2 * PI
        cone(0.05, 0.4, (math.cos(a) * 0.3, math.sin(a) * 0.3, 1.82), m, 6).rotation_euler = (0.5 * math.sin(a), -0.5 * math.cos(a), 0)
    return join([post, cap, urn] + [o for o in C.scene.objects if o not in (post, cap, urn)], "newel_urn")


def caryatid():
    m = mat("marble", MARBLE, 0, 0.45)
    body = lathe([(0.34, 0), (0.36, 0.1), (0.3, 0.4), (0.28, 1.2), (0.26, 1.8), (0.3, 2.1), (0.24, 2.4), (0.2, 2.62), (0.14, 2.7)], m, 32, "robe")
    offset(body, lambda c: Vector((0.02 * math.sin(c.z * 9 + math.atan2(c.y, c.x) * 3) * min(1, c.z), 0, 0)))
    head = sphere(0.17, (0, 0, 2.86), m, 20, 12, (0.95, 1, 1.15))
    hair = sphere(0.19, (0, -0.03, 2.9), m, 16, 10, (1, 1, 0.9))
    for s in (-1, 1):
        arm = tube([Vector((s * 0.24, 0, 2.5)), Vector((s * 0.36, 0.05, 2.9)), Vector((s * 0.2, 0.06, 3.15))], 0.06, m, name="arm")
    basket = lathe([(0.2, 3.06), (0.28, 3.12), (0.26, 3.22)], m, 24, "polos")
    ab = cube(0.9, 0.9, 0.1, (0, 0, 3.28), m)
    base = cube(0.9, 0.9, 0.12, (0, 0, 0.06), m)
    return join([o for o in C.scene.objects], "caryatid")


def vitrine():
    mg = mat("vitrineGlass", GLASS, 0, 0.05, alpha=0.22); mb = mat("vitrineBase", (0.16, 0.16, 0.18), 0.2, 0.5); mw = mat("vitrineWhite", CLOUD, 0, 0.6)
    base = cube(1.2, 0.8, 0.9, (0, 0, 0.45), mb); bevel(base, 0.01, 1)
    deck = cube(1.16, 0.76, 0.03, (0, 0, 0.915), mw)
    glass = cube(1.18, 0.78, 0.8, (0, 0, 1.33), mg)
    frame = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            frame.append(cube(0.02, 0.02, 0.82, (sx * 0.59, sy * 0.39, 1.33), mb))
    top = cube(1.2, 0.8, 0.02, (0, 0, 1.74), mb)
    return join([base, deck, glass, top] + frame, "vitrine")


def torchere():
    mg = mat("giltLamp", GOLD, 0.85, 0.3); me = mat("lampGlow", (1, 0.92, 0.75), 0, 0.5, emit=(1, 0.85, 0.6), emit_strength=6)
    foot = lathe([(0.3, 0), (0.32, 0.05), (0.14, 0.12), (0.06, 0.2), (0.05, 1.6), (0.08, 1.7), (0.05, 1.8), (0.06, 2.2), (0.18, 2.32), (0.3, 2.42), (0.34, 2.5), (0.3, 2.52)], mg, 32, "stem")
    bowl = lathe([(0.0, 2.44), (0.28, 2.46), (0.36, 2.64), (0.3, 2.8), (0.0, 2.82)], me, 32, "bowl")
    for i in range(3):
        a = (i / 3) * 2 * PI
        cube(0.06, 0.06, 0.4, (math.cos(a) * 0.12, math.sin(a) * 0.12, 1.2), mg)
    return join([o for o in C.scene.objects], "torchere")


def palm_urn():
    mt = mat("terracotta", TERRA, 0, 0.8); ml = mat("frond", LEAF, 0, 0.7); mb = mat("frondDark", (0.14, 0.32, 0.16), 0, 0.7)
    urn = lathe([(0.3, 0), (0.42, 0.04), (0.36, 0.2), (0.34, 0.5), (0.44, 0.7), (0.5, 0.8), (0.46, 0.84), (0.0, 0.86)], mt, 32, "urn")
    trunk = cyl(0.07, 0.9, (0, 0, 1.25), mb, seg=10)
    parts = [urn, trunk]
    random.seed(7)
    for i in range(14):
        a = (i / 14) * 2 * PI + random.random() * 0.3; tilt = 0.55 + random.random() * 0.8; ln = 1.4 + random.random() * 0.5
        f = cube(0.36, ln, 0.03, (0, 0, 0), ml if i % 2 else mb)
        offset(f, lambda c, ln=ln: Vector((0, ln / 2, 0)))
        taper(f, lambda t: 0.25 + 0.75 * math.sin(t * PI) ** 0.5, axis=1)
        offset(f, lambda c, ln=ln: Vector((0, 0, -0.35 * (c.y / ln) ** 2)))
        f.rotation_euler = (tilt, 0, a); f.location = (0, 0, 1.75)
        apply_all(f)
        parts.append(f)
    return join(parts, "palm_urn")


def sarcophagus():
    m = mat("sandstoneS", (0.76, 0.63, 0.44), 0, 0.85); mg = mat("giltLine", GOLD, 0.8, 0.35)
    box = cube(2.4, 0.9, 0.8, (0, 0, 0.5), m); bevel(box, 0.03, 2)
    base = cube(2.6, 1.1, 0.12, (0, 0, 0.06), m)
    lid = cube(2.44, 0.94, 0.3, (0, 0, 1.03), m); taper(lid, lambda t: 1 - 0.2 * t, axis=2)
    head = sphere(0.22, (0.85, 0, 1.24), m, 16, 10, (1, 0.9, 1.2))
    parts = [box, base, lid, head]
    for i in range(6):
        parts.append(cube(0.28, 0.02, 0.5, (-1.0 + i * 0.36, -0.46, 0.5), mg))
        parts.append(cube(0.28, 0.02, 0.5, (-1.0 + i * 0.36, 0.46, 0.5), mg))
    parts.append(cube(1.6, 0.26, 0.04, (-0.2, 0, 1.2), mg))
    return join(parts, "sarcophagus")


def armillary():
    mg = mat("bronzeA", BRONZE, 0.8, 0.4)
    parts = [torus(0.7, 0.03, (0, 0, 1.5), mg, (0, 0, 0)), torus(0.7, 0.03, (0, 0, 1.5), mg, (PI / 2, 0, 0)), torus(0.7, 0.03, (0, 0, 1.5), mg, (PI / 2, 0, PI / 2)), torus(0.5, 0.025, (0, 0, 1.5), mg, (0.4, 0.2, 0.3)), torus(0.3, 0.02, (0, 0, 1.5), mg, (1.2, 0.6, 0))]
    arrow = cyl(0.02, 2.0, (0, 0, 1.5), mg, seg=8, rot=(0.6, 0, 0.3)); parts.append(arrow)
    parts.append(cone(0.06, 0.2, (0.28, -0.5, 2.3), mg, 8, (0.6, 0, 0.3)))
    parts.append(lathe([(0.35, 0), (0.38, 0.04), (0.14, 0.1), (0.08, 0.3), (0.06, 0.7), (0.1, 0.78)], mg, 24, "stand"))
    return join(parts, "armillary")


def bronze_figure():
    m = mat("bronzeFig", BRONZE, 0.75, 0.45); mg = mat("bronzeFigGreen", BRONZE_GREEN, 0.5, 0.6)
    torso = tube([Vector((0, 0, 0.9)), Vector((0.02, 0, 1.4)), Vector((0, 0.02, 1.9)), Vector((0.03, 0, 2.3))], 0.11, m, name="torso"); displace(torso, 0.03, 0.2, 3)
    head = sphere(0.1, (0.03, 0, 2.48), m, 12, 8, (0.85, 0.9, 1.3)); displace(head, 0.02, 0.15, 4)
    parts = [torso, head]
    for s in (-1, 1):
        leg = tube([Vector((s * 0.09, 0, 0.9)), Vector((s * 0.13, 0.05, 0.5)), Vector((s * 0.15, -0.05 + s * 0.06, 0.05))], 0.06, m, name="leg"); displace(leg, 0.02, 0.2, 5 + s); parts.append(leg)
        arm = tube([Vector((s * 0.12, 0, 2.2)), Vector((s * 0.2, 0.05, 1.7)), Vector((s * 0.22, 0.1, 1.25))], 0.045, m, name="arm"); parts.append(arm)
        parts.append(cube(0.2, 0.4, 0.06, (s * 0.15, 0.1, 0.03), m))
    base = cube(0.9, 0.9, 0.12, (0, 0, -0.06), mg)
    parts.append(base)
    return join(parts, "bronze_figure")


def equestrian():
    m = mat("bronzeEq", BRONZE, 0.75, 0.45)
    body = sphere(1, (0, 0, 1.6), m, 24, 12, (0.55, 1.3, 0.62)); taper(body, lambda t: 0.7 + 0.5 * math.sin(t * PI) ** 0.5)
    neck = tube([Vector((0, 1.1, 1.8)), Vector((0, 1.6, 2.4)), Vector((0, 1.9, 2.75))], 0.22, m, name="neck")
    head = cube(0.3, 0.8, 0.34, (0, 2.25, 2.75), m, (0.6, 0, 0)); bevel(head, 0.06, 2)
    parts = [body, neck, head]
    for sx in (-1, 1):
        for sy, dz in ((-0.9, 0), (0.9, 0)):
            parts.append(tube([Vector((sx * 0.28, sy, 1.3)), Vector((sx * 0.3, sy + (0.25 if sy > 0 else -0.25), 0.7)), Vector((sx * 0.3, sy + (0.1 if sy > 0 else -0.35), 0.05))], 0.08, m, name="hleg"))
        parts.append(cone(0.05, 0.28, (sx * 0.16, 2.1, 3.05), m, 6, (0.3, 0, 0)))
    tail = tube([Vector((0, -1.3, 1.7)), Vector((0, -1.7, 1.2)), Vector((0, -1.75, 0.6))], 0.07, m, name="tail"); parts.append(tail)
    rider = tube([Vector((0, -0.1, 2.15)), Vector((0.02, -0.05, 2.7)), Vector((0, 0, 3.1))], 0.16, m, name="rider"); parts.append(rider)
    parts.append(sphere(0.14, (0, 0, 3.32), m, 12, 8))
    parts.append(tube([Vector((0.16, 0.1, 2.9)), Vector((0.3, 0.6, 3.2)), Vector((0.3, 0.9, 3.9))], 0.05, m, name="riderArm"))
    for s in (-1, 1):
        parts.append(tube([Vector((s * 0.35, -0.1, 2.1)), Vector((s * 0.6, 0.1, 1.5)), Vector((s * 0.62, 0.3, 1.05))], 0.06, m, name="riderLeg"))
    plinth = cube(1.6, 3.4, 0.5, (0, 0, -0.25), mat("plinthGranite", (0.42, 0.4, 0.38), 0, 0.6)); bevel(plinth, 0.03, 2); parts.append(plinth)
    return join(parts, "equestrian")


def mobile():
    mk = mat("mobileBlack", INK, 0.2, 0.5); mr = mat("mobileRed", (0.85, 0.12, 0.1), 0, 0.5); my = mat("mobileYellow", (0.95, 0.78, 0.15), 0, 0.5); mb = mat("mobileBlue", EYE_BLUE, 0, 0.5)
    parts = [cyl(0.008, 1.2, (0, 0, 4.4), mk, seg=6)]
    def arm(p0, p1, r=0.012):
        parts.append(tube([Vector(p0), Vector(((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + 0.08)), Vector(p1)], r, mk, name="arm"))
    def disc(p, r, m, tilt=0.3):
        o = cyl(r, 0.01, p, m, seg=24); o.rotation_euler = (tilt, 0.2, 0); parts.append(o)
    arm((0, 0, 3.8), (2.4, 0.3, 3.5)); arm((0, 0, 3.8), (-1.6, -0.4, 3.2))
    disc((2.4, 0.3, 3.0), 0.55, mr); parts.append(cyl(0.006, 0.5, (2.4, 0.3, 3.25), mk, seg=6))
    arm((-1.6, -0.4, 3.2), (-2.8, 0.6, 2.9)); arm((-1.6, -0.4, 3.2), (-0.6, -1.4, 2.7))
    disc((-2.8, 0.6, 2.5), 0.35, my); parts.append(cyl(0.006, 0.4, (-2.8, 0.6, 2.7), mk, seg=6))
    disc((-0.6, -1.4, 2.2), 0.28, mb); parts.append(cyl(0.006, 0.5, (-0.6, -1.4, 2.45), mk, seg=6))
    arm((-0.6, -1.4, 2.7), (0.9, -2.0, 2.4)); disc((0.9, -2.0, 1.9), 0.22, mk); parts.append(cyl(0.006, 0.5, (0.9, -2.0, 2.15), mk, seg=6))
    for i, (x, y) in enumerate([(1.2, 0.1), (0.4, 0.9), (-1.0, 1.2), (-2.0, -1.0)]):
        disc((x, y, 3.4 - i * 0.1), 0.12 + 0.04 * i, [mk, mr, my, mb][i], 0.5)
    return join(parts, "mobile")


def bust_plinth():
    mm = mat("marbleBust", MARBLE, 0, 0.4); mp = mat("plinthBlack", (0.1, 0.1, 0.11), 0.1, 0.4)
    plinth = cube(0.5, 0.5, 1.4, (0, 0, 0.7), mp); bevel(plinth, 0.01, 1)
    shoulders = lathe([(0.0, 1.4), (0.3, 1.42), (0.34, 1.5), (0.28, 1.7), (0.2, 1.82), (0.1, 1.9)], mm, 32, "shoulders")
    shoulders.scale = (1.4, 0.8, 1); apply_all(shoulders)
    neck = cyl(0.09, 0.2, (0, 0, 1.96), mm, seg=16)
    head = sphere(0.17, (0, 0, 2.2), mm, 24, 14, (0.9, 1, 1.15))
    nose = cone(0.03, 0.09, (0, -0.16, 2.17), mm, 8, (-PI / 2, 0, 0))
    hair = sphere(0.18, (0, 0.03, 2.25), mm, 16, 10, (1, 1, 0.85))
    return join([plinth, shoulders, neck, head, nose, hair], "bust_plinth")


def globe_stand():
    mg = mat("bronzeG", BRONZE, 0.8, 0.4); mo = mat("oceanG", (0.16, 0.34, 0.5), 0.1, 0.5); ml = mat("landG", (0.62, 0.55, 0.36), 0, 0.7)
    globe = sphere(0.7, (0, 0, 1.5), mo, 32, 16)
    parts = [globe]
    random.seed(3)
    for i in range(9):
        a = random.random() * 2 * PI; b = (random.random() - 0.5) * 2.2
        p = (math.cos(a) * math.cos(b) * 0.7, math.sin(a) * math.cos(b) * 0.7, 1.5 + math.sin(b) * 0.7)
        s = sphere(0.18 + random.random() * 0.22, p, ml, 12, 8, (1, 1, 0.25)); s.rotation_euler = (b, 0, a); parts.append(s)
    parts.append(torus(0.78, 0.025, (0, 0, 1.5), mg, (PI / 2, 0, 0.4)))
    parts.append(torus(0.82, 0.02, (0, 0, 1.5), mg, (0, 0, 0)))
    parts.append(lathe([(0.34, 0), (0.36, 0.04), (0.12, 0.1), (0.06, 0.4), (0.06, 0.7), (0.1, 0.76)], mg, 24, "gstand"))
    for i in range(3):
        a = (i / 3) * 2 * PI
        parts.append(tube([Vector((0, 0, 0.76)), Vector((math.cos(a) * 0.5, math.sin(a) * 0.5, 1.1)), Vector((math.cos(a) * 0.82, math.sin(a) * 0.82, 1.5))], 0.025, mg, name="gleg"))
    return join(parts, "globe_stand")


def mlow_eye_monument():
    """The MLow evil eye as a standing stone ring: deep blue disc, cloud ring, cyan iris, ink pupil, on a plinth. The brand's sovereign mark in three dimensions."""
    mb = mat("eyeBlueM", EYE_BLUE, 0.1, 0.35); mw = mat("eyeCloud", CLOUD, 0, 0.4); mc = mat("eyeCyan", CYAN, 0.2, 0.3, emit=CYAN, emit_strength=1.2); mi = mat("eyeInk", INK, 0.1, 0.3); mp = mat("eyePlinth", (0.12, 0.12, 0.14), 0.1, 0.5)
    disc = cyl(1.6, 0.36, (0, 0, 2.6), mb, seg=64, rot=(PI / 2, 0, 0)); bevel(disc, 0.06, 3)
    ring = cyl(1.05, 0.4, (0, 0, 2.6), mw, seg=64, rot=(PI / 2, 0, 0))
    iris = cyl(0.66, 0.44, (0, 0, 2.6), mc, seg=64, rot=(PI / 2, 0, 0))
    pupil = cyl(0.3, 0.48, (0, 0, 2.6), mi, seg=48, rot=(PI / 2, 0, 0))
    plinth = cube(1.2, 0.8, 1.0, (0, 0, 0.5), mp); bevel(plinth, 0.02, 2)
    stem = cube(0.5, 0.36, 0.3, (0, 0, 1.1), mp)
    return join([disc, ring, iris, pupil, plinth, stem], "mlow_eye_monument")


def mlow_wordmark_relief():
    """The ML wordmark plate from the Blossom shore handoff, extruded as a relief panel. Falls back to a plain plate if the SVG is missing."""
    mk = mat("plateInk", INK, 0.1, 0.45); mw = mat("plateCloud", CLOUD, 0, 0.5)
    plate = cube(3.0, 0.08, 1.0, (0, 0, 1.4), mk); bevel(plate, 0.01, 1)
    parts = [plate]
    svg = "/Users/degens/Desktop/blossom-shore-handoff-20260806/v2/svg/ml_wordmark_plate_2.svg"
    if os.path.exists(svg):
        try:
            before = set(C.scene.objects)
            bpy.ops.import_curve.svg(filepath=svg)
            curves = [o for o in C.scene.objects if o not in before]
            for c in curves:
                c.data.extrude = 0.02
                C.view_layer.objects.active = c; c.select_set(True); bpy.ops.object.convert(target="MESH"); c.select_set(False)
                assign(c, mw)
            if curves:
                g = join(curves, "wordmark")
                # centre and scale the glyphs onto the plate
                xs = [g.matrix_world @ Vector(b) for b in g.bound_box]
                w = max(p.x for p in xs) - min(p.x for p in xs); h = max(p.y for p in xs) - min(p.y for p in xs)
                s = 2.6 / max(w, 1e-6) if w > 0 else 1
                g.scale = (s, s, s); apply_all(g)
                xs = [g.matrix_world @ Vector(b) for b in g.bound_box]
                cx = (max(p.x for p in xs) + min(p.x for p in xs)) / 2; cy = (max(p.y for p in xs) + min(p.y for p in xs)) / 2
                g.rotation_euler = (PI / 2, 0, 0); g.location = (-cx, -0.05, 1.4 - cy)
                parts.append(g)
        except Exception as e:  # noqa: BLE001
            print("  wordmark svg import failed:", e)
    if len(parts) == 1:
        for i, w in enumerate([0.5, 0.7, 0.5, 0.9]):
            parts.append(cube(w, 0.03, 0.42, (-1.1 + i * 0.72, -0.05, 1.4), mw))
    return join(parts, "mlow_wordmark_relief")


def rope_stanchion():
    mg = mat("stanchionBrass", GOLD, 0.85, 0.3); mv = mat("ropeVelvet", VELVET, 0, 0.9)
    parts = []
    for x in (-0.9, 0.9):
        parts.append(lathe([(0.18, 0), (0.2, 0.03), (0.05, 0.06), (0.03, 0.9), (0.06, 0.94), (0.0, 0.98)], mg, 24, "post")); parts[-1].location = (x, 0, 0)
    parts.append(tube([Vector((-0.9, 0, 0.9)), Vector((0, 0, 0.62)), Vector((0.9, 0, 0.9))], 0.03, mv, name="rope"))
    return join(parts, "rope_stanchion")


def museum_bench():
    mm = mat("benchMarble", MARBLE, 0, 0.35); ml = mat("benchLeather", (0.2, 0.14, 0.1), 0, 0.7)
    slab = cube(2.4, 0.7, 0.14, (0, 0, 0.43), mm); bevel(slab, 0.02, 2)
    pad = cube(2.3, 0.62, 0.08, (0, 0, 0.54), ml); bevel(pad, 0.03, 2)
    legs = [cube(0.5, 0.6, 0.36, (x, 0, 0.18), mm) for x in (-0.9, 0.9)]
    return join([slab, pad] + legs, "museum_bench")


def track_light():
    mk = mat("trackBlack", INK, 0.3, 0.5); me = mat("lampFace", (1, 0.95, 0.85), 0, 0.4, emit=(1, 0.92, 0.75), emit_strength=4)
    parts = [cube(3.0, 0.05, 0.04, (0, 0, 0.02), mk)]
    for i in range(4):
        x = -1.1 + i * 0.73
        parts.append(cyl(0.02, 0.16, (x, 0, -0.08), mk, seg=8))
        c = cyl(0.07, 0.22, (x, 0.08, -0.26), mk, seg=16, rot=(0.9, 0, 0)); parts.append(c)
        f = cyl(0.06, 0.01, (x, 0.165, -0.34), me, seg=16, rot=(0.9, 0, 0)); parts.append(f)
    return join(parts, "track_light")


def dinosaur_long_neck():
    """A sauropod skeleton for the great hall: the other icon under the rotunda."""
    b = mat("bone", BONE, 0, 0.7)
    parts = []
    spine = [Vector((0, -9 + i * 0.6, 3.6 + 2.6 * math.sin(((i - 6) / 22) * PI) * (1 if i > 6 else 0.3) + (max(0, i - 24) * 0.55))) for i in range(30)]
    parts.append(tube(spine, 0.16, b, name="spine"))
    for i in range(2, 26, 1):
        parts.append(sphere(0.2, spine[i], b, 8, 6, (1, 0.6, 1.1)))
    for i in range(9, 20):
        p = spine[i]
        for s in (-1, 1):
            parts.append(tube([p + Vector((s * 0.2, 0, -0.1)), p + Vector((s * 1.4, 0, -1.2)), p + Vector((s * 1.1, 0, -2.8)), p + Vector((s * 0.4, 0, -3.5))], 0.06, b, name="rib"))
    for (i, h) in ((11, 3.8), (18, 3.6)):
        p = spine[i]
        for s in (-1, 1):
            parts.append(tube([p + Vector((s * 0.7, 0, -0.3)), p + Vector((s * 0.9, 0.2, -h / 2)), p + Vector((s * 0.9, -0.1, -h)), p + Vector((s * 0.95, 0.3, -h - 0.3))], 0.14, b, name="leg"))
    skull = cube(0.5, 1.1, 0.5, spine[-1] + Vector((0, 0.6, 0)), b); bevel(skull, 0.1, 2); parts.append(skull)
    base = cube(4, 20, 0.12, (0, 0, -0.06), mat("plinthDark", (0.12, 0.12, 0.13), 0, 0.5)); parts.append(base)
    return join(parts, "sauropod_skeleton")


ASSETS = {
    "blue_whale": blue_whale,
    "trex_skeleton": trex_skeleton,
    "sauropod_skeleton": dinosaur_long_neck,
    "noguchi_stone_1": lambda: noguchi_stone(0),
    "noguchi_stone_2": lambda: noguchi_stone(1),
    "noguchi_stone_3": lambda: noguchi_stone(2),
    "corinthian_capital": corinthian_capital,
    "ionic_capital": ionic_capital,
    "coffered_dome": coffered_dome,
    "balustrade": balustrade,
    "newel_urn": newel_urn,
    "caryatid": caryatid,
    "vitrine": vitrine,
    "torchere": torchere,
    "palm_urn": palm_urn,
    "sarcophagus": sarcophagus,
    "armillary": armillary,
    "bronze_figure": bronze_figure,
    "equestrian": equestrian,
    "mobile": mobile,
    "bust_plinth": bust_plinth,
    "globe_stand": globe_stand,
    "mlow_eye_monument": mlow_eye_monument,
    "mlow_wordmark_relief": mlow_wordmark_relief,
    "rope_stanchion": rope_stanchion,
    "museum_bench": museum_bench,
    "track_light": track_light,
}

if __name__ == "__main__":
    print("institution kit ->", OUT)
    ok, bad = [], []
    for name, fn in ASSETS.items():
        if ONLY and name not in ONLY:
            continue
        try:
            clear()
            fn()
            export(name)
            ok.append(name)
        except Exception as e:  # noqa: BLE001
            import traceback
            traceback.print_exc()
            bad.append((name, str(e)))
    print(f"built {len(ok)}; failed {len(bad)}", bad)
