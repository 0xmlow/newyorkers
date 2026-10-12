"""draco_pass.py: Draco-compress the CC0 props and their NEW YORKERS edits for the package, in Blender.
Reads work/glb_pass/<name>.glb, writes work/glb_draco/<name>.glb with the same textures (AUTO keeps each embedded
JPEG or PNG as it is) and compressed geometry. The geometry was 232 of 411 MB before this. main.js loads them
through DRACOLoader (decoder in assets/draco).
  Blender -b -P draco_pass.py -- name,name,...      (draco.py runs it over every stale model, a few at a time)"""
import bpy, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "work", "glb_pass"); OUT = os.path.join(ROOT, "work", "glb_draco"); os.makedirs(OUT, exist_ok=True)
for name in sys.argv[sys.argv.index("--") + 1].split(","):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="AUTO",
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
    print(f"DRACO {name}: {os.path.getsize(os.path.join(SRC, name + '.glb')) // 1024} to {os.path.getsize(out) // 1024} KB")
