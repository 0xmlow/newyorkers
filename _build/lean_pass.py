"""lean_pass.py: the shipped models made light, in headless Blender, without touching the files they came from.
Each argument is <path to a .glb>[:max triangles]. A model over its budget is decimated (collapse, triangulated, UVs kept)
down to it; every model is then written Draco compressed with its textures as JPEG at 1024 or less. Writes
work/glb_lean/<name>.glb, which build.py ships in place of the original. Skinned models (the rig_ cast) are refused:
a collapse would tear their weights, and three's Draco path for joints is not worth the risk.
  /Applications/Blender.app/Contents/MacOS/Blender -b -P _build/lean_pass.py -- site/assets/glb/oy_frozen.glb:14000 ...
Why (2026-11-01): the fourteen Tripo cast came back at about 78,000 triangles each and Frozen Grand Central stands dozens
of them, 8.5 million triangles a frame; 78 of the 174 shipped models (46 MB) had never been Draco compressed."""
import bpy, os, sys, shutil, tempfile, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "work", "glb_lean"); os.makedirs(OUT, exist_ok=True)
MAN = os.path.join(OUT, "manifest.json"); man = json.load(open(MAN)) if os.path.exists(MAN) else {}
# build.py ships a lean copy only while the original it was made from is byte for byte the one it would ship
for arg in sys.argv[sys.argv.index("--") + 1:]:
    path, _, cap = arg.partition(":"); cap = int(cap) if cap else 0; name = os.path.basename(path)[:-4]
    src = tempfile.mktemp(suffix=".glb"); shutil.copy2(path, src)   # read a copy, so the output can never overwrite the source
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if any(o.find_armature() or o.vertex_groups for o in meshes): print(f"SKIP {name}: skinned"); continue
    def tris(): return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    before = tris()
    if cap and before > cap:
        r = cap / before
        for o in meshes:
            bpy.context.view_layer.objects.active = o
            m = o.modifiers.new("lean", "DECIMATE"); m.decimate_type = "COLLAPSE"; m.ratio = r; m.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier=m.name)
    for img in bpy.data.images:
        if img.size[0] > 1024 or img.size[1] > 1024: img.scale(min(1024, img.size[0]), min(1024, img.size[1]))
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=86,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
    os.remove(src); man[name] = hashlib.sha1(open(path, "rb").read()).hexdigest(); json.dump(man, open(MAN, "w"), indent=0, sort_keys=True)
    print(f"LEAN {name}: {before} to {tris()} triangles, {os.path.getsize(path) // 1024} to {os.path.getsize(out) // 1024} KB")
