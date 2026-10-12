"""The Blender pass every AI generated GLB takes before it enters a room.

Joins the meshes, decimates to a triangle target, shrinks every texture to one
1024 (or smaller) image, recentres the object on its base, and exports y up GLB
with JPEG textures so a 5 MB Tripo file lands at a few hundred KB.

  Blender -b -P prop_pass.py -- <src_dir> <out_dir> name:tris[:yaw][,name:tris[:yaw]...]

An optional third field turns the object about the vertical by that many degrees
before export, so a vehicle can be set nose to three.js +Z, the way k.rider and
lookAt point it. Textures may be given a size cap with PROP_TEX (default 1024).

Written for room 180 (the census hall) on 2026-10-01; yaw and PROP_TEX added
2026-10-09 for the hero props of rooms 165 to 178.
"""
import bpy, os, sys, math
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
jobs = [(j.split(":")[0], int(j.split(":")[1]), float(j.split(":")[2]) if len(j.split(":")) > 2 else 0.0) for j in args[2].split(",")]
TEX = int(os.environ.get("PROP_TEX", "1024"))
os.makedirs(OUT, exist_ok=True)

for name, target, yaw in jobs:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name, name + "_1k.gltf"))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if yaw:
        ob.data.transform(Matrix.Rotation(math.radians(yaw), 4, "Z"))
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
        if img.size[0] > TEX or img.size[1] > TEX:
            s = TEX / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
    for o in list(bpy.context.scene.objects):
        if o != ob: bpy.data.objects.remove(o)
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=82, use_selection=False)
    print(f"PASS {name}: {tris} to {after} tris, {os.path.getsize(out) // 1024} KB")
