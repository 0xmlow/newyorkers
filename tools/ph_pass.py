# Lean Poly Haven pass for the Majorelle single file: join, decimate, base colour only, small JPEG textures, base at origin.
import bpy, os, sys
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:]
src, out, target, tex = a[0], a[1], int(a[2]), int(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
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
lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for v in ob.data.vertices: lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
off = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for v in ob.data.vertices: v.co -= off
# keep only base colour textures
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not bsdf: continue
    for inp in ("Normal", "Roughness", "Metallic"):
        for l in list(bsdf.inputs[inp].links): nt.links.remove(l)
    bsdf.inputs["Roughness"].default_value = 0.85; bsdf.inputs["Metallic"].default_value = 0.0
for img in list(bpy.data.images):
    if img.users == 0: continue
    if img.size[0] > tex or img.size[1] > tex:
        s = tex / max(img.size[0], img.size[1]); img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))
for o in list(bpy.context.scene.objects):
    if o != ob: bpy.data.objects.remove(o)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=80, use_selection=False)
print(f"PASS {os.path.basename(out)}: {tris} to {after} tris, {os.path.getsize(out)//1024} KB, size {hi-lo}")
