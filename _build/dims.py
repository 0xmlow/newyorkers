"""dims.py: print each GLB's bounding box (glTF axes: x, y up, z) so the rooms can seat them. Blender -b -P _build/dims.py -- a.glb b.glb"""
import bpy, sys, mathutils
for f in sys.argv[sys.argv.index("--") + 1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=f)
    lo = mathutils.Vector((1e9,) * 3); hi = -lo
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c); lo = mathutils.Vector(map(min, lo, w)); hi = mathutils.Vector(map(max, hi, w))
    s = hi - lo; print(f"DIM {f.split('/')[-1]}: x {s.x:.2f} y(up) {s.z:.2f} z {s.y:.2f}  tris {sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH')}")
