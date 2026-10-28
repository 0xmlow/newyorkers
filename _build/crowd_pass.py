"""crowd_pass.py: light crowd copies of the cast we already generated (the Tripo NEW YORKERS of ON LOCATION).

Adapted 2026-10-28 from ON LOCATION's _build/crowd_pass.py (commit 45a283b), which cuts every body below its sculpted
head. Here the head can stay: every cast member already has an Open Eye Flower for a head modelled into the mesh, so a
visitor is the whole character. Three cuts, all turned so the front is three.js +Z, centred on the feet, base at 0:

  full    feet to the top of the flower: a whole New Yorker (MoMLOW visitors, THE PIGEONHOLE's still figures)
  body    feet to the neck: for a figure whose eye flower is drawn live in code (it blinks, looks at you)
  upper   hips to the top of the flower: a seated audience behind a parapet

  Blender -b -P crowd_pass.py -- <src_dir> <out_dir> name:part:tris[:tex[:yaw[:neck]]],...
  (tex in px, default 256; yaw in degrees, default -90: most of the cast faces +X, the Blind Woman 180;
   neck: the neck cut as a fraction of height, default 0.80; a seated figure needs it lower, the Robber 0.56)

Reads <src_dir>/<name>.glb (ON LOCATION work/glb_pass, read only), writes <out_dir>/crowd_<name>_<part>.glb.
"""
import bpy, bmesh, os, sys, math
from mathutils import Matrix, Vector

NECK, HIP = 0.80, 0.40          # fractions of full height: the neck cut, and where an upper body starts
CUT = {"full": (0.0, 1.01), "body": (0.0, NECK), "upper": (HIP, 1.01)}
args = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT, JOBS = args[0], args[1], args[2]
os.makedirs(OUT, exist_ok=True)

def load(name, yaw):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    ms = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in ms: o.select_set(True)
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.data.transform(Matrix.Rotation(math.radians(yaw), 4, "Z"))
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    return ob

for job in JOBS.split(","):
    f = job.split(":")
    name, part, target = f[0], f[1], int(f[2])
    tex = int(f[3]) if len(f) > 3 and f[3] else 256
    yaw = float(f[4]) if len(f) > 4 and f[4] else -90.0
    lo, hi = CUT[part]
    if part == "body" and len(f) > 5 and f[5]: hi = float(f[5])
    ob = load(name, yaw)
    zs = [v.co.z for v in ob.data.vertices]; z0, H = min(zs), max(zs) - min(zs)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    if hi < 1:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z0 + H * hi), plane_no=(0, 0, 1), clear_outer=True)
    if lo > 0:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z0 + H * lo), plane_no=(0, 0, -1), clear_outer=True)
    bm.to_mesh(ob.data); bm.free()
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tris > target:
        m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = target / tris
        bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier="dec")
    after = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    vs = [v.co for v in ob.data.vertices]
    off = Vector(((min(v.x for v in vs) + max(v.x for v in vs)) / 2, (min(v.y for v in vs) + max(v.y for v in vs)) / 2, min(v.z for v in vs)))
    for v in ob.data.vertices: v.co -= off
    for img in bpy.data.images:
        if img.size[0] > tex or img.size[1] > tex:
            s = tex / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
    out = os.path.join(OUT, f"crowd_{name}_{part}.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=82)
    print(f"CROWD {name} {part}: {tris} to {after} tris, {tex} px, {os.path.getsize(out) // 1024} KB")
