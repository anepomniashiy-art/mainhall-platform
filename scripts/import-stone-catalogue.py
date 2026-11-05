#!/usr/bin/env python3
"""Refresh explicitly priced apartments from STONE's public paginated catalogue.

Uses only the model rendered by the ordinary catalogue pages. Hidden prices,
nonresidential lots and unrelated projects are excluded. A partial collection
never replaces the current inventory. No credentials or CAPTCHA bypasses.
"""
import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
import math
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

spec=importlib.util.spec_from_file_location('official_adapters',Path(__file__).with_name('adapt-official-units.py'))
adapters=importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapters)
PROJECTS={'blik':'stone-blik','sokolniki':'stone-sokolniki'}
BASE='https://stone.ru/catalog/residential/'

def fetch(url):
    for attempt in range(3):
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 MAINHALL/1.0'})
            with urllib.request.urlopen(request,timeout=30) as response:
                raw=response.read(12_000_001)
                if len(raw)>12_000_000: raise ValueError('Catalogue page exceeds limit')
            parser=adapters.Scripts();parser.feed(raw.decode('utf8',errors='replace'))
            for prefix,model in adapters.next_flight_records(parser.blocks):
                for path,node in adapters.walk(model):
                    if isinstance(node.get('lots'),list) and isinstance(node.get('currentTotal'),int):
                        return {'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'statePath':prefix+path,'data':node}
            raise ValueError('Catalogue model was not rendered: '+url)
        except Exception:
            if attempt==2: raise
            time.sleep(1)

def normalize(unit,project,proof,collected_at):
    if unit.get('project',{}).get('strapi_slug')!=project:
        raise ValueError('Unexpected project in filtered catalogue')
    if unit.get('show_price_flg') is not True:
        return None
    price=adapters.rubles(unit.get('selling_price'))
    area=adapters.positive(unit.get('area'))
    if unit.get('type')!=10 or not price or not area or not unit.get('id'):
        return None
    slug=str(unit.get('slug',''))
    if not slug or not all(c.isalnum() or c=='-' for c in slug):
        raise ValueError('Unexpected apartment slug')
    source=BASE+project+'/'+slug
    return {'id':PROJECTS[project]+':'+str(unit['id']),'sourceId':str(unit['id']),
        'projectSlug':PROJECTS[project],'sourceType':'public_site','sourceUrl':source,
        'fetchedAt':collected_at,'salesStatus':'UNKNOWN','sourceLotUuid':unit.get('lot_uuid'),
        'unitNumber':unit.get('number'),'buildingName':unit.get('housing'),
        'floor':unit.get('floor'),'floorsTotal':unit.get('floors_number'),
        'rooms':unit.get('rooms_count'),'bedrooms':unit.get('bedrooms_count'),
        'unitType':'studio' if unit.get('bedrooms_count')==0 else 'apartment',
        'areaSqm':area,'finish':'без отделки' if unit.get('is_decoration') is False else None,
        'priceRub':price,'priceBeforeDiscountRub':adapters.rubles(unit.get('selling_price_before_discount')),
        'pricePerSqm':adapters.rubles(unit.get('selling_price_per_meter')),
        'priceBasis':'selling_price explicitly displayed in the public official catalogue; payment terms require confirmation',
        'availabilityRaw':unit.get('status'),'completionYear':unit.get('project',{}).get('building_year'),
        'address':unit.get('address'),'features':[x['val'] for x in unit.get('features',[]) if isinstance(x,dict) and x.get('val')],
        'ceilingHeightM':adapters.positive(unit.get('ceiling')),'planImageUrl':unit.get('interior_plan_img'),
        'floorPlanImageUrl':unit.get('floor_plan_img'),'sourceUpdatedAt':unit.get('updated_at'),
        'proof':{'catalogueUrl':proof['url'],'rawHtmlSha256':proof['sha256'],'statePath':proof['statePath']+'.lots',
                 'fields':{'priceRub':'selling_price','areaSqm':'area','rooms':'rooms_count','floor':'floor'}}}

def collect(project,collected_at):
    first=fetch(BASE+project)
    total=first['data']['currentTotal']
    if not 0<total<=5000: raise ValueError('Unexpected catalogue total')
    # The first catalogue page has 11 lots plus a promo; subsequent pages
    # use a one-based inclusive `from` cursor (12, 24, ...). Zero is invalid.
    urls=[BASE.rstrip('/')+'?project_slug='+project+'&from='+str(offset)+'&per_page=12' for offset in range(12,total+1,12)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pages=[first]+list(pool.map(fetch,urls))
    seen={}
    for page in pages:
        if page['data']['currentTotal']!=total: raise ValueError('Inventory changed while collecting; retry later')
        for row in page['data']['lots']:
            identity=str(row.get('id'))
            if identity in seen:
                if seen[identity]!=row:raise ValueError('Conflicting lot across catalogue pages')
                continue
            seen[identity]=row
    if len(seen)!=total: raise ValueError('Incomplete catalogue pagination')
    units=[normalize(row,project,page,collected_at) for page in pages for row in page['data']['lots']]
    units=[row for row in units if row is not None]
    report={'projectSlug':PROJECTS[project],'listedCount':total,'pricedResidentialCount':len(units),
            'pages':[{k:page[k] for k in ['url','sha256','statePath']} for page in pages]}
    return units,report

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('data/catalogue/public-units.json'))
    args=parser.parse_args()
    stamp=datetime.now(timezone.utc).isoformat()
    units=[];reports=[]
    for project in PROJECTS:
        rows,report=collect(project,stamp);units.extend(rows);reports.append(report)
    current=json.loads(args.output.read_text())
    previous={row['id']:row for row in current['units']}
    for unit in units:
        old=previous.get(unit['id'],{})
        if old.get('planImageUrl')==unit.get('planImageUrl') and old.get('planImageSrc'):
            unit['planImageSrc']=old['planImageSrc']
    current['units']=[row for row in current['units'] if row['projectSlug'] not in PROJECTS.values()]+units
    current['generatedAt']=stamp
    args.output.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
    report=Path('data/provenance/stone-latest-refresh.json')
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps({'checkedAt':stamp,'projects':reports,'availabilityMeaning':'Listed in the public catalogue at collection; availability is confirmed before booking.'},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'collectedAt':stamp,'unitCount':len(units),'projects':[{k:v for k,v in r.items() if k!='pages'} for r in reports]},ensure_ascii=False))

if __name__=='__main__':main()
