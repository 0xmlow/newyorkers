"""Download the FLORA Patina sets and Nano Banana Pro plates, ship as WebP: colour 1024 q82, normal 1024 q90, roughness 512 q80, plates 2048."""
import os, json, urllib.request, io
from PIL import Image, ImageEnhance
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'assets'); C = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
B = 'https://media.flora.ai/node-inputs/2026/10/8/anonymous/'
MATS = {  # name: (basecolor, normal, roughness)
 'panel': ('22be6234-a8c7-4d9b-a029-2a6790030ff9', '70db6ee4-b153-4fe0-8f18-afb0528fe1e3', '6349bd6f-0e46-460e-93fd-d85dd6d2055e'),
 'shag': ('9e31447d-f293-4c6f-91b5-02753f955dbc', '6b23f081-3165-4521-8322-79083318f3a8', '1487450a-443d-4555-a978-17b5e99143f0'),
 'ceil': ('11be2e94-05be-4284-9fbb-aed0f3c96074', '63962f77-f616-412f-944c-ef3cb75d849e', '3157e9ba-6ef5-4f1f-ad3c-e34e7f06620f'),
 'cinder': ('9394fa78-7c07-4f50-a4c0-36ae24d8d23b', 'c6894f5e-d997-4f08-9453-b498731ccfcc', '3c1bbcbf-cc51-4f9f-b680-683a2018b0ba'),
 'vinyl': ('e6321cbe-f421-45c9-9e0c-b7920c956d48', '67836420-2bcc-4ddc-b0e2-6af7fcb70b05', '459a1773-7de5-421d-aa34-932de93c1a59'),
 'conc': ('ca34266f-ea68-4c35-aef5-111ccb109587', '34f2d9d0-3381-4d61-91cd-5f24079eadcd', '5f9d6f3e-8a63-4074-bc5b-6040dbec9988'),
 'plastic': ('991e7472-21f9-470b-8755-e7733b41e55b', '61e380c0-3284-4abc-82b9-fc58a0cff997', '50a35fd4-a86b-4b73-abdd-47ef9e50d35b'),
 'bagel': ('8ada856e-445c-4793-9a59-a1686169b7f4', 'c6af430c-eea8-4b93-b4b6-0b1589002f21', '70d59332-90cb-4fd7-b29a-592ac928dfd9'),
 'cream': ('209c01ee-fcc2-4d67-b5f7-b9cda6f6854d', '7cdb9f4a-d6f4-4ca4-a66b-7c3ae96dcb45', '4eac57d9-c62e-4aec-be59-614645a73e1b'),
 'peg': ('4a3d791c-0284-44ef-8d5f-335671c5385d', '2d0df0eb-5421-4460-bce8-7586d7d50a2a', 'fd06ae0a-26c0-4993-941f-a581fef03b79'),
 'brick': ('d425be5e-4da6-4e39-a02c-1beb436732d4', 'a154ea6e-8f31-4c04-ba5c-73a5db16a2c9', 'fce035e9-bc4b-4d33-ba1d-7aa4aff06f36'),
 'joist': ('b393a4ad-4c4b-4602-af6e-cbcbe7be363e', '907ce60b-2877-431b-88cc-321b5edfee56', 'c719567e-88a3-4ade-9e79-98976f3294fc'),
}
PL = 'https://media.flora.ai/node-inputs/2026/10/8/px7bcfcerpq8bb4nm64egxe9j980hy4k/'
PLATES = {'well': 'gen-m178t0q4hj717bgjg97xkce2pn8fwvk0-0', 'room': 'gen-m170ws05jwa9whd66647t1gt218fwkez-0', 'stairs': 'gen-m17f9srywkqsdccf7gc8v48yq98fwa7n-0'}
def get(url):
    r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}); return Image.open(io.BytesIO(urllib.request.urlopen(r, timeout=120).read()))
def ship(im, path, size, q):
    im = im.convert('RGB'); im.thumbnail((size, size), Image.LANCZOS); im.save(path, 'WEBP', quality=q, method=6); return os.path.getsize(path) // 1024
tot = 0
for n, (c, nm, r) in MATS.items():
    if os.path.exists(os.path.join(OUT, n + '_r.webp')): continue
    tot += ship(get(B + c + '.png'), os.path.join(OUT, n + '_c.webp'), 1024, 82); tot += ship(get(B + nm + '.png'), os.path.join(OUT, n + '_n.webp'), 1024, 90); tot += ship(get(B + r + '.png'), os.path.join(OUT, n + '_r.webp'), 512, 80); print(n, 'ok', flush=True)
for n, g in PLATES.items():
    p = os.path.join(OUT, 'plate_' + n + '.webp')
    if os.path.exists(p): continue
    im = get(PL + g + '.png'); im.convert('RGB').save(os.path.join(C, 'plate_' + n + '.png')); tot += ship(im, p, 2048, 84); print('plate', n, im.size, flush=True)
print('shipped KB', tot)
