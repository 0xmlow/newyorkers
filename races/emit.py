import json, sys, os
H = os.path.dirname(os.path.abspath(__file__))
p = json.load(open(os.path.join(H, 'plan.json')))
d = json.load(open(os.path.join(H, 'inflight.json'))) if os.path.exists(os.path.join(H, 'inflight.json')) else {}
todo = [x for x in p if x['key'] not in d][:20]
open(os.path.join(H, 'next_keys.txt'), 'w').write(','.join(x['key'] for x in todo))
print(json.dumps([dict(workspace_id='ws_qd74cjtasft9ydr6yqneqjkqax822mhs', project_id='prj_ns765drs0xtf1d940e77ax6tq98fzkt3', type='image',
      model='is2i-gengateway-seedream-5-0-lite-is2i', params=dict(image_urls=[x['ref']], aspect_ratio='16:9', resolution='2k'), prompt=x['prompt']) for x in todo]))
print(len([x for x in p if x['key'] not in d]), 'races left', file=sys.stderr)
