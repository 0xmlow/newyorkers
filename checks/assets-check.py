import json,struct,re
from pathlib import Path
root=Path(__file__).resolve().parents[1];dist=root/'dist' if (root/'dist').exists() else root/'site';report=[]
for f in (dist/'assets/props').glob('*.glb'):
 b=f.read_bytes();magic,version,length=struct.unpack_from('<III',b,0);assert (magic,version,length)==(0x46546c67,2,len(b)),f
 n,kind=struct.unpack_from('<II',b,12);j=json.loads(b[20:20+n]);assert kind==0x4e4f534a
 for image in j.get('images',[]):
  if 'uri' in image and not image['uri'].startswith('data:'):assert (f.parent/image['uri']).is_file(),(f,image)
  elif 'bufferView' in image:assert image['bufferView']<len(j['bufferViews'])
 report.append({'file':f.name,'meshes':len(j.get('meshes',[])),'images':len(j.get('images',[])),'bytes':len(b)})
for f in (dist/'vendor').rglob('*.js'):
 for ref in re.findall(r"from ['\"]([^'\"]+)['\"]",f.read_text()):
  if ref.startswith('.'):assert (f.parent/ref).exists(),(f,ref)
arts=json.loads((dist/'assets/art.json').read_text())+json.loads((dist/'assets/expanded-art.json').read_text());assert len({a['id'] for a in arts})==44
for a in arts:assert (dist/'assets'/a['file']).is_file(),a
assert len(report)==50
for t in ['subway_tile','concrete_worn','blue_plate','steel_plate','terrazzo','oak','parquet','dark_brick','red_brick','pavement','gravel','granite','shutter','old_brick']:
 for k in 'cnr':assert (dist/f'assets/tex/{t}_{k}.webp').is_file(),t
for f in ['ArchivoNarrow-700','PermanentMarker-400','JetBrainsMono']:assert (dist/f'assets/fonts/{f}.woff2').is_file(),f
assert (dist/'vendor/draco/draco_decoder.wasm').is_file() and (dist/'vendor/loaders/DRACOLoader.js').is_file()
(root/'checks/assets-report-v2.json').write_text(json.dumps({'models':report,'models_valid':50,'artworks_valid':44,'module_dependencies_valid':True,'note':'GLB containers, buffer/image references and local files checked. Image pixel decoding and GPU rendering not checked.'},indent=2))
print('50 GLB containers and their image references, 44 artwork files, and local module dependencies passed.')
