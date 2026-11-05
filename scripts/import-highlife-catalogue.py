#!/usr/bin/env python3
"""Refresh HIGH LIFE apartments from the same public JSON used by its catalogue.

Only explicitly listed sale/free units with a concrete positive price are used.
Reserved entries are excluded. The public output contains property facts, not
sales-office contact details or third-party descriptions.
"""
import argparse
import collections
import hashlib
import json
import urllib.request
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin

SOURCE='https://highlife.ru/ajax/?page=flats'
ACTIVE={'Продажа','Свободно'}

def positive(value):
    return isinstance(value,(float,int)) and not isinstance(value,bool) and 0<value<10**13

def normalize(data,stamp,digest):
    if not isinstance(data.get('flats'),list) or not data['flats']:
        raise ValueError('Missing public apartment catalogue')
    rows=[];seen=set()
    for item in data['flats']:
        if item.get('id') in seen:raise ValueError('Duplicate source apartment ID')
        seen.add(item.get('id'))
        if item.get('status') not in ACTIVE:continue
        if item.get('type') not in {'Квартира','Пентхаус'}:continue
        price=item.get('price_discount') or item.get('price')
        if not positive(price) or not positive(item.get('square')):continue
        if not isinstance(item.get('id'),int) or item['id']<=0:raise ValueError('Invalid apartment ID')
        sid=str(item['id']);plan=urljoin('https://highlife.ru/',item.get('plan') or '')
        if not plan.startswith('https://highlife.ru/'):raise ValueError('Unexpected plan origin')
        rows.append({'id':'high-life:'+sid,'projectSlug':'high-life','sourceType':'public_site','sourceId':sid,
            'sourceUrl':'https://highlife.ru/flats/'+sid,'fetchedAt':stamp,'salesStatus':'UNKNOWN',
            'unitNumber':item.get('num'),'buildingName':item.get('corpus'),'floor':item.get('floor'),
            'rooms':item.get('rooms'),'bedrooms':None,'areaSqm':item['square'],'finish':item.get('finishing'),
            'type':item['type'],'unitType':'apartment','priceRub':price,'priceBeforeDiscountRub':item.get('price'),
            'pricePerSqm':item.get('price_m_discount') or item.get('price_m'),
            'priceBasis':'price_discount displayed in the official public catalogue; payment terms require confirmation',
            'availabilityRaw':item['status'],'features':item.get('options',[]),'view':item.get('view_raw',[]),
            'planImageUrl':plan if item.get('plan') else None,
            'proof':{'catalogueUrl':SOURCE,'rawJsonSha256':digest,'statePath':'flats[id='+sid+']',
              'fields':{'priceRub':'price_discount or price','areaSqm':'square','rooms':'rooms','floor':'floor','availabilityRaw':'status'}}})
    if not rows:raise ValueError('No concrete active apartments')
    return rows

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output',type=Path,default=Path('data/catalogue/public-units.json'))
    ap.add_argument('--input',type=Path,help='Use an already captured public response')
    args=ap.parse_args()
    stamp=datetime.now(timezone.utc).isoformat()
    if args.input:raw=args.input.read_bytes()
    else:
        req=urllib.request.Request(SOURCE,headers={'User-Agent':'Mozilla/5.0 MAINHALL/1.0'})
        with urllib.request.urlopen(req,timeout=45) as response:raw=response.read(15_000_001)
    if len(raw)>15_000_000:raise ValueError('Catalogue response exceeds limit')
    data=json.loads(raw);digest=hashlib.sha256(raw).hexdigest();rows=normalize(data,stamp,digest)
    current=json.loads(args.output.read_text());previous={u['id']:u for u in current['units']}
    for unit in rows:
        old=previous.get(unit['id'],{})
        # Retain a verified local raster plan for the same apartment where present.
        if old.get('planImageSrc'):unit['planImageSrc']=old['planImageSrc']
    current['units']=[u for u in current['units'] if u['projectSlug']!='high-life']+rows
    current['generatedAt']=stamp
    args.output.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
    report={'checkedAt':stamp,'sourceUrl':SOURCE,'rawJsonSha256':digest,'listedCount':len(data['flats']),
       'activePricedCount':len(rows),'statuses':dict(collections.Counter(u.get('status') for u in data['flats'])),
       'selection':'Include Продажа and Свободно only; exclude Резерв and Уст.бронь. Confirm availability before booking.'}
    target=Path('data/provenance/highlife-latest-refresh.json');target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
