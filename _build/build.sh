#!/bin/bash
# Builds ../site/index.html, one self contained file (three.js, art, logo inline).
set -e; cd "$(dirname "$0")"
[ -f art.js ] || python3 build_art.py 960 58
./node_modules/.bin/esbuild main.js --bundle --minify --format=iife --loader:.png=dataurl --outfile=app.js --log-level=warning
python3 - <<'P'
import base64
s=open('shell.html').read()
logo='data:image/png;base64,'+base64.b64encode(open('logo_white.png','rb').read()).decode()
app=open('app.js').read().replace('</script','<\\/script')
out=s.replace('__LOGO__',logo).replace('__APP__',app).replace('__ART__',open('art.js').read())
open('../site/index.html','w').write(out)
for c in '—–': assert c not in out
print('site/index.html', round(len(out)/1e6,2),'MB')
P
