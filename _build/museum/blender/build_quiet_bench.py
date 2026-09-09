"""Author a small, reusable gallery bench in Blender. Export only this collection.
Run through Blender MCP; leaves existing scenes and objects intact.
"""
import bpy, math, os, json
from pathlib import Path
out = Path(__file__).resolve().parents[3] / 'assets/museum/props'
out.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('NEW YORKERS - quiet gallery furniture')
bpy.context.window.scene = scene
collection = bpy.data.collections.new('Quiet bench - oak and bronze')
scene.collection.children.link(collection)
def material(name, color, metal, rough):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
oak=material('Warm oak',(.27,.13,.055),0,.42)
bronze=material('Satin bronze',(.13,.105,.07),.72,.34)
shadow=material('Recessed dark joinery',(.025,.028,.022),.1,.6)
def box(name,loc,size,mat,bevel):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for c in list(o.users_collection): c.objects.unlink(o)
    collection.objects.link(o);o.data.materials.append(mat)
    b=o.modifiers.new('Soft edges','BEVEL');b.width=bevel;b.segments=3
    bpy.ops.object.modifier_apply(modifier=b.name)
    o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o
# Slats have real open seams. Feet sit inside the silhouette to keep paths clear.
for i in range(5): box('Oak seat slat %02d'%i,(0,(i-2)*.13,.46),(2.35,.118,.095),oak,.022)
for x in [-.79,.79]:
    box('Bronze support',(x,0,.23),(.11,.56,.41),bronze,.023)
    box('Recessed foot',(x,0,.021),(.15,.59,.04),shadow,.012)
box('Underside spine',(0,0,.39),(1.75,.11,.11),bronze,.016)
# Export one material primitive per material, keeping web draw calls bounded.
for mat in [oak,bronze,shadow]:
    bpy.ops.object.select_all(action='DESELECT')
    objects=[o for o in collection.objects if o.type=='MESH' and o.data.materials[0]==mat]
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
bpy.ops.object.select_all(action='DESELECT')
for o in collection.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'quiet_bench.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,use_active_scene=True)
triangles=sum(len(p.vertices)-2 for o in collection.objects for p in o.data.polygons)
report={'asset':'quiet_bench.glb','objects':len(collection.objects),'triangles':triangles,'bytes':(out/'quiet_bench.glb').stat().st_size,'materials':3,'units':'metres','authoring':'Blender 5.1 through Blender MCP','provenance':'Original procedural museum furniture; no downloaded model'}
(out/'quiet_bench.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).with_name('quiet_bench.blend')))
print(json.dumps(report))
