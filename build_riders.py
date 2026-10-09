"""cast.json -> riders.js, and inlined into casting.html and skelly-cup.html so each page is one self-contained file."""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__))
cast = json.load(open(os.path.join(here, 'cast.json')))['cast']
keep = ('marbleId', 'marble', 'piece', 'title', 'borough', 'image', 'url', 'why', 'weak', 'minted', 'holder', 'holderX')
riders = {c['marbleId']: {k: c[k] for k in keep} for c in cast}
js = 'window.RIDERS = ' + json.dumps(riders, ensure_ascii=False).replace('</', '<\\/') + ';'
open(os.path.join(here, 'riders.js'), 'w').write(js + '\n')
block = '<!--RIDERS--><script>' + js + '</script><!--/RIDERS-->'
for page in ('casting.html', 'skelly-cup.html'):
    path = os.path.join(here, page); html = open(path).read()
    html, n = re.subn(r'<!--RIDERS-->.*?<!--/RIDERS-->|<script src="riders.js"></script>', lambda m: block, html, count=1, flags=re.S)
    assert n == 1, page + ' has no riders slot'
    open(path, 'w').write(html)
print(len(riders), 'riders written and inlined')
