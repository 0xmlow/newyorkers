import sys
from PIL import Image, ImageDraw
st=sys.argv[1]; ids=sys.argv[2:]
s=Image.new('RGB',(220+620,len(ids)*350),'white'); d=ImageDraw.Draw(s)
for i,m in enumerate(ids):
    p=Image.open(f'png/{m}.png').convert('RGB'); p.thumbnail((210,210)); s.paste(p,(0,i*350+20))
    q=Image.open(f'{st}/{m}.jpg'); q.thumbnail((620,350)); s.paste(q,(220,i*350))
    d.text((4,i*350+4),m,fill='black')
s.save(f'sheet_{st}_{ids[0]}.jpg',quality=85)
