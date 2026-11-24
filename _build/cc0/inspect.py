import bpy, sys, os, json
SRC='/Users/degens/Desktop/NEW YORKERS BY MLOW/ON LOCATION 2026-10-10/work/glb_pass'
names=sys.argv[sys.argv.index('--')+1].split(',')
out={}
for n in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,n+'.glb'))
    ms=[o for o in bpy.context.scene.objects if o.type=='MESH']
    import mathutils
    lo=[1e9]*3; hi=[-1e9]*3; tris=0; mats=set()
    for o in ms:
        for v in o.data.vertices:
            w=o.matrix_world@v.co
            for k in range(3): lo[k]=min(lo[k],w[k]); hi[k]=max(hi[k],w[k])
        tris+=sum(len(p.vertices)-2 for p in o.data.polygons)
        for s in o.material_slots:
            if s.material: mats.add(s.material.name)
    out[n]={'size':[round(hi[k]-lo[k],2) for k in range(3)],'tris':tris,'mats':sorted(mats)}
print('JSON'+json.dumps(out))
