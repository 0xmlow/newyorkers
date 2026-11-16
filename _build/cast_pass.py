"""cast_pass.py: the FLORA Tripo cast (work/glb/sw_*.glb) made light enough for a phone, in Blender.
Textures down to 1024 and JPEG, geometry Draco compressed. Writes work/glb_pass/<name>.glb.
  /Applications/Blender.app/Contents/MacOS/Blender -b -P _build/cast_pass.py -- sw_pizzarat,sw_gator,..."""
import bpy, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "work", "glb"); OUT = os.path.join(ROOT, "work", "glb_pass"); os.makedirs(OUT, exist_ok=True)
for name in sys.argv[sys.argv.index("--") + 1].split(","):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name + ".glb"))
    for img in bpy.data.images:
        if img.size[0] > 1024: img.scale(1024, 1024)
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_image_format="JPEG", export_jpeg_quality=86,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
    print(f"PASS {name}: {os.path.getsize(os.path.join(SRC, name + '.glb')) // 1024} to {os.path.getsize(out) // 1024} KB")
