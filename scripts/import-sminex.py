#!/usr/bin/env python3
"""Normalize authorised Sminex Yandex Realty feed; CIAN enriches matching IDs only.
No external contact data is exported. IN_FEED means listed at collection, not reserved availability.
"""
import argparse, collections, datetime, hashlib, json, re, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
SOURCE='https://feeds.sminex.com/xml/All_Sminex_Full_YandexRealty.xml'
SLUGS={'Белый Град':'belyy-grad','Тишинский бульвар':'tishinskiy-bulvar','Life Time':'life-time','Фрунзенский':'frunzenskiy','Лаврушинский':'lavrushinsky','Палашёвский 11':'palashevskiy-11','Foriver':'foriver','Мануфактура XIX':'manufaktura-xix','Ильинка 3/8':'ilyinka-3-8','Фон Дессин':'fon-dessin','Обыденский №1':'obydenskiy-1','Новое Медведково':'novoe-medvedkovo','Достижение':'dostizhenie','Новое Пушкино':'novoe-pushkino','Twist':'twist','RiverSky':'riversky'}
def text(e,p):return (e.findtext(p) or '').strip() or None
def number(v,integer=False):
 try:
  n=float(v);return int(n) if integer and n.is_integer() else n
 except (TypeError,ValueError):return None
def classify(raw,prop):
 s=(raw or '').lower()
 if s in ('квартира','flat'):return 'apartment','residential'
 if s in ('дом','house'):return 'house','residential'
 if s in ('office','офис'):return 'office','commercial'
 if s in ('free purpose','помещение свободного назначения'):return 'free_purpose','commercial'
 if 'гараж' in s or 'parking' in s or 'машино' in s:return 'parking','ancillary'
 if 'кладов' in s or 'storage' in s:return 'storage','ancillary'
 if 'торгов' in s or 'retail' in s:return 'retail','commercial'
 raise ValueError('Unmapped property category: '+str((raw,prop)))
def normalize(raw,cian_raw=None,source_url=SOURCE,fetched_at=None):
 r=ET.fromstring(raw); fetched_at=fetched_at or datetime.datetime.now(datetime.timezone.utc).isoformat(); supplemental={}
 if cian_raw:
  for x in ET.fromstring(cian_raw).findall('object'):
   k=text(x,'ExternalId')
   if k in supplemental:raise ValueError('Duplicate CIAN ID '+str(k))
   supplemental[k]=x
 units=[];seen={}
 for x in r.findall('offer'):
  sid=x.get('internal-id');name=text(x,'building-name');slug=SLUGS.get(name)
  if not sid or not slug:raise ValueError('Missing ID or unknown project '+str(name))
  cat,typ=classify(text(x,'category'),text(x,'property-type'));price=number(text(x,'price/value'),True);area=number(text(x,'area/value'))
  if text(x,'price/currency') not in ('RUR','RUB'):raise ValueError('Unsupported currency')
  if price is not None and price<=0:price=None
  if area is not None and area<=0:area=None
  images=[]
  for im in x.findall('image'):
   url=(im.text or '').strip()
   if url.startswith('https://') and not any(z['url']==url for z in images):images.append({'url':url,'tag':im.get('tag') or 'image'})
  c=supplemental.get(sid); getc=lambda p:text(c,p) if c is not None else None
  u=dict(id='sminex:'+sid,sourceId=sid,projectName=name,projectSlug=slug,category=cat,propertyType=typ,categoryRaw=text(x,'category'),propertyTypeRaw=text(x,'property-type'),areaSqm=area,priceRub=price,pricePerSqm=round(price/area) if price and area else None,currency='RUB',floor=number(text(x,'floor'),True),unitNumber=text(x,'location/apartment'),rooms=number(text(x,'rooms'),True),bedrooms=number(getc('BedroomsCount'),True),buildingName=getc('JKSchema/House/Name'),buildingSection=text(x,'building-section'),description=('Офис' if cat=='office' else 'Помещение свободного назначения' if cat=='free_purpose' else 'Дом' if cat=='house' else 'Квартира')+' в проекте «'+name+'». '+('Площадь '+str(area).replace('.',',')+' м². ' if area else '')+('Этаж '+str(number(text(x,'floor'),True))+'. ' if number(text(x,'floor'),True) is not None else '')+'Цена и характеристики приведены по официальному фиду Sminex.',images=images,planImageUrl=next((z['url'] for z in images if z['tag']=='plan'),None),finishRaw=text(x,'renovation'),ceilingHeight=number(text(x,'ceiling-height')),isStudio=text(x,'studio')=='true',isApartments=text(x,'apartments')=='true',isPenthouse=getc('IsPenthouse')=='true',addressRaw=text(x,'location/address'),locality=text(x,'location/locality-name'),deliveryYear=number(text(x,'built-year'),True),deliveryQuarter=number(text(x,'ready-quarter'),True),buildingStateRaw=text(x,'building-state'),updatedAt=text(x,'last-update-date'),fetchedAt=fetched_at,salesStatus='IN_FEED',bookingStatusRaw=getc('Booking/Status'),sourceUrl=source_url)
  if sid in seen:
   if seen[sid]!=u:raise ValueError('Conflicting duplicate ID '+sid)
   continue
  seen[sid]=u;units.append(u)
 projects=[]
 for slug in sorted(set(u['projectSlug'] for u in units)):
  rows=[u for u in units if u['projectSlug']==slug];projects.append(dict(name=rows[0]['projectName'],slug=slug,unitCount=len(rows),residentialCount=sum(u['propertyType']=='residential' for u in rows),commercialCount=sum(u['propertyType']=='commercial' for u in rows),ancillaryCount=sum(u['propertyType']=='ancillary' for u in rows)))
 return dict(schemaVersion=1,developer='Sminex',sourceUrl=source_url,generatedAt=text(r,'generation-date'),sourceTimezone='not specified by feed',fetchedAt=fetched_at,sourceSha256=hashlib.sha256(raw).hexdigest(),availabilityNote='Предложение присутствовало в официальном фиде на дату проверки. Наличие и условия подтверждаются перед бронированием.',projects=projects,units=units,coverage=dict(unitCount=len(units),projectCount=len(projects),categories=dict(collections.Counter(u['category'] for u in units)),uniqueImages=len({im['url'] for u in units for im in u['images']}),unitsWithPlan=sum(bool(u['planImageUrl']) for u in units)))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input');ap.add_argument('--input-dir');ap.add_argument('--download',action='store_true');ap.add_argument('--cian');ap.add_argument('--output',default='data/catalogue/sminex-feed.json');a=ap.parse_args()
 directory=Path(a.input_dir or '/tmp/sminex-feeds');directory.mkdir(parents=True,exist_ok=True)
 if a.download:
  for scope,format_ in [('Full','YandexRealty'),('Full','CIAN'),('Full','Avito'),('Full','Domclick'),('Living','YandexRealty'),('Commercial','YandexRealty')]:
   name=scope+'_'+format_;url='https://feeds.sminex.com/xml/All_Sminex_'+name+'.xml';(directory/(name+'.xml')).write_bytes(urllib.request.urlopen(url,timeout=60).read())
 input_file=Path(a.input) if a.input else directory/'Full_YandexRealty.xml'
 raw=input_file.read_bytes();cian_file=Path(a.cian) if a.cian else directory/'Full_CIAN.xml'
 result=normalize(raw,cian_file.read_bytes() if cian_file.exists() else None)
 out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 texts={x.get('internal-id'):text(x,'description') for x in ET.fromstring(raw).findall('offer')}
 out.with_name('sminex-feed-source-texts.json').write_text(json.dumps(dict(sourceUrl=SOURCE,fetchedAt=result['fetchedAt'],sourceSha256=result['sourceSha256'],descriptions=texts),ensure_ascii=False,separators=(',',':'))+'\n')
 manifests=[]
 for file in sorted(directory.glob('*.xml')):
  b=file.read_bytes();r=ET.fromstring(b);tag='object' if r.tag=='feed' else 'Ad' if r.tag=='Ads' else 'offer';rows=r.findall(tag)
  manifests.append(dict(filename=file.name,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),offers=len(rows)))
 out.with_name('sminex-feed-manifest.json').write_text(json.dumps(dict(checkedAt=result['fetchedAt'],selectedSource=SOURCE,selectionReason='Same 2895 IDs across full formats. Yandex preserves residential/commercial classification; CIAN and Avito misclassify offices as apartments. CIAN enriches bedrooms, house name and booking status by exact source ID only.',sources=manifests,coverage=result['coverage']),ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result['coverage'],ensure_ascii=False))
if __name__=='__main__':main()
