"""Upload a local file to FLORA through a signed-url descriptor (from flora_create_asset source="signed-url").
    python3 flora_upload.py descriptor.json file
descriptor.json holds {"upload": {"url":..., "form_fields": {...}, "file_field": "file"}} as the MCP tool returned it."""
import json, sys, mimetypes, urllib.request, uuid
d = json.load(open(sys.argv[1])); up = d.get('upload', d); path = sys.argv[2]
boundary = uuid.uuid4().hex; body = b''
fields = up.get('form_fields') or {}
items = fields.items() if isinstance(fields, dict) else [(f['name'], f['value']) for f in fields]
for k, v in items: body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
ct = mimetypes.guess_type(path)[0] or 'application/octet-stream'
body += f'--{boundary}\r\nContent-Disposition: form-data; name="{up.get("file_field", "file")}"; filename="{path.split("/")[-1]}"\r\nContent-Type: {ct}\r\n\r\n'.encode() + open(path, 'rb').read() + f'\r\n--{boundary}--\r\n'.encode()
r = urllib.request.Request(up['url'], data=body, method=up.get('method', 'POST'), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
try: resp = urllib.request.urlopen(r, timeout=300); print('status', resp.status)
except urllib.error.HTTPError as e: print('HTTP', e.code, e.read()[:300]); sys.exit(1)
