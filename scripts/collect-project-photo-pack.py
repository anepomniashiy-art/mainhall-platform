"""Download and decode verified editorial image URLs; retain only valid images."""
import concurrent.futures,hashlib,io,json,urllib.request
from pathlib import Path
from PIL import Image,ImageOps
out=Path('photo-pack');(out/'images').mkdir(parents=True,exist_ok=True)
rows=[]
for name in ['project-photo-collection.json','additional-project-photo-collection.json']:
 rows+=json.loads((Path('data/provenance')/name).read_text())
rows=list({(p['slug'],p['src']):p for p in rows}.values())
def fetch(p):
 try:
  if not p['src'].startswith('https://'):raise ValueError('HTTPS required')
  req=urllib.request.Request(p['src'],headers={'User-Agent':'Mozilla/5.0','Referer':p['source']})
  with urllib.request.urlopen(req,timeout=25) as r: raw=r.read(25_000_001)
  if len(raw)>25_000_000:raise ValueError('image too large')
  im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw)));im.load()
  if min(im.size)<200:raise ValueError('thumbnail too small')
  im.thumbnail((2200,1600));im=im.convert('RGB')
  name=p['slug']+'-'+hashlib.sha256(p['src'].encode()).hexdigest()[:12]+'.webp'
  im.save(out/'images'/name,'WEBP',quality=86)
  return {**p,'localSrc':'/images/projects/collected/'+name,'width':im.width,'height':im.height,'status':'verified'}
 except Exception as e:return {**p,'status':'failed','error':type(e).__name__+': '+str(e)[:120]}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:result=list(pool.map(fetch,rows))
(out/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('Images verified:',sum(p['status']=='verified' for p in result),'of',len(result))
