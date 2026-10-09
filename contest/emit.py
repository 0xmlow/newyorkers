"""plan.json -> batches of flora_create_generations items (hosted refs swapped in). Skips marbles in done.json."""
import json, sys, os
H = os.path.dirname(os.path.abspath(__file__))
p = json.load(open(os.path.join(H, 'plan.json'))); h = json.load(open(os.path.join(H, 'hosted.json')))
done = json.load(open(os.path.join(H, 'done.json'))) if os.path.exists(os.path.join(H, 'done.json')) else {}
todo = [x for x in p if str(x['marbleId']) not in done]
b = int(sys.argv[1]); chunk = todo[b * 20:(b + 1) * 20]
print(json.dumps([dict(workspace_id='ws_qd74cjtasft9ydr6yqneqjkqax822mhs', project_id='prj_ns765drs0xtf1d940e77ax6tq98fzkt3', type='image',
                       model='is2i-gengateway-seedream-5-pro-is2i', params=dict(image_urls=[h.get(u, u) for u in x['refs']], aspect_ratio='16:9', resolution='2k'),
                       prompt=x['prompt']) for x in chunk]))
print(len(todo), 'todo; this batch marbles', [x['marbleId'] for x in chunk], file=sys.stderr)
