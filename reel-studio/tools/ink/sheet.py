# contact sheet from a folder of stills: python sheet.py <out.jpg> <label=file>...   (6 columns)
import sys
from PIL import Image, ImageDraw
items=[a.split('=',1) for a in sys.argv[2:]]; ims=[(Image.open(f).convert('RGB'),l) for l,f in items]
w,h=ims[0][0].size; w2,h2=w//2,h//2; cols=6; r=-(-len(ims)//cols)
S=Image.new('RGB',(cols*w2,r*(h2+16)),(18,18,24)); d=ImageDraw.Draw(S)
for i,(im,l) in enumerate(ims):
    x,y=(i%cols)*w2,(i//cols)*(h2+16); S.paste(im.resize((w2,h2)),(x,y+16)); d.text((x+3,y+2),l,fill=(255,220,120))
S.save(sys.argv[1],quality=86); print(len(ims),S.size)
