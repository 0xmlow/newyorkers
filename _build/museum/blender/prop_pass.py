"""The Blender pass every AI generated GLB takes before it enters a room.

Joins the meshes, decimates to a triangle target, shrinks every texture to one
1024 (or smaller) image, recentres the object on its base, and exports y up GLB
with JPEG textures so a 5 MB Tripo file lands at a few hundred KB.

  Blender -b -P prop_pass.py -- <src_dir> <out_dir> name:tris[,name:tris...]

Written for room 180 (the census hall) on 2026-10-01.
"""
import bpy, os, sys
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
jobs = [(j.split(":")[0], int(j.split(":")[1])) for j in args[2].split(",")]
os.makedirs(OUT, exist_ok=True)

for name, target in jobs:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tris > target:
        m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = target / tris
        bpy.ops.object.modifier_apply(modifier="dec")
    after = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    # base at the origin, centred in plan
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for v in ob.data.vertices: lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
    off = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    for v in ob.data.vertices: v.co -= off
    for img in bpy.data.images:
        if img.size[0] > 1024 or img.size[1] > 1024:
            s = 1024 / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=82, use_selection=False)
    print(f"PASS {name}: {tris} to {after} tris, {os.path.getsize(out) // 1024} KB")
