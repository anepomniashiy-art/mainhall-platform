#!/usr/bin/env python3
"""Extract specific HIGH LIFE and STONE units from saved official HTML.
Never executes website JS, never treats similar/recommended units as the main unit.
"""
import argparse
import hashlib
import json
import re
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urljoin


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current = None
        self.blocks = []
    def handle_starttag(self,tag,attrs):
        if tag=='script': self.current={'attrs':dict(attrs),'parts':[]}
    def handle_data(self,data):
        if self.current is not None: self.current['parts'].append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.current is not None:
            self.blocks.append((self.current['attrs'],''.join(self.current['parts'])))
            self.current=None


def walk(value,path='$'):
    if isinstance(value,dict):
        yield path,value
        for k,v in value.items(): yield from walk(v,path+'['+json.dumps(k)+']')
    elif isinstance(value,list):
        for i,v in enumerate(value): yield from walk(v,path+'['+str(i)+']')


def positive(value):
    if isinstance(value,bool) or not re.fullmatch(r'\d+(?:\.\d+)?',str(value)): return None
    number=float(value)
    return number if 0<number<=10**13 else None


def rubles(value):
    number=positive(value)
    return int(number) if number is not None and number.is_integer() else None


def next_flight_records(blocks):
    decoder=json.JSONDecoder()
    chunks=[]
    for _,text in blocks:
        for match in re.finditer(r'self\.__next_f\.push\(',text):
            try: data,_=decoder.raw_decode(text[match.end():])
            except ValueError: continue
            if isinstance(data,list) and len(data)>1 and data[0]==1 and isinstance(data[1],str): chunks.append(data[1])
    # Flight model records are JSON; I/HL/T records are not model JSON and are skipped.
    for line in ''.join(chunks).splitlines():
        match=re.match(r'([0-9a-f]+):([\[{].*)$',line)
        if match:
            try: value,_=decoder.raw_decode(match[2])
            except ValueError: continue
            yield 'self.__next_f['+match[1]+']',value


def common(project,source_id,row,source_url,collected_at,html,state_path,fields):
    return {'id':project+':'+str(source_id),'projectSlug':project,'sourceType':'public_site',
            'sourceId':str(source_id),'sourceUrl':source_url,'fetchedAt':collected_at,
            'salesStatus':'UNKNOWN','proof':{'rawHtmlSha256':hashlib.sha256(html.encode()).hexdigest(),
            'statePath':state_path,'fields':fields},**row}


def extract_highlife(html,url,collected_at):
    target=re.fullmatch(r'/flats/(\d+)/?',urlsplit(url).path)
    if not target or urlsplit(url).hostname not in {'highlife.ru','www.highlife.ru'}: return []
    scripts=Scripts();scripts.feed(html)
    for attrs,text in scripts.blocks:
        if attrs.get('id')!='__NEXT_DATA__': continue
        data=json.loads(text)
        queries=data.get('props',{}).get('pageProps',{}).get('initialState',{}).get('api',{}).get('queries',{})
        for key,query in queries.items():
            if query.get('endpointName')!='getFlatById' or str(query.get('originalArgs',{}).get('id'))!=target[1]: continue
            unit=query.get('data',{}).get('data',{})
            if str(unit.get('id'))!=target[1]: continue
            price=rubles(unit.get('price_discount')) or rubles(unit.get('price'))
            area=positive(unit.get('square'))
            if not price or not area: return []
            path='__NEXT_DATA__.props.pageProps.initialState.api.queries['+json.dumps(key)+'].data.data'
            plan=unit.get('plan_png') or unit.get('plan')
            row={'unitNumber':unit.get('num'),'buildingName':unit.get('corpus'),
                 'floor':unit.get('floor'),'rooms':unit.get('rooms'),'bedrooms':None,
                 'areaSqm':area,'finish':unit.get('finishing'),'type':unit.get('type'),
                 'priceRub':price,'priceBeforeDiscountRub':rubles(unit.get('price')),
                 'pricePerSqm':rubles(unit.get('price_m_discount')) or rubles(unit.get('price_m')),
                 'priceBasis':'discount price reported by official site' if rubles(unit.get('price_discount')) else 'list price reported by official site',
                 'availabilityRaw':unit.get('status'),'features':unit.get('options',[]),
                 'view':unit.get('view_raw') or unit.get('view') or [],
                 'planImageUrl':urljoin(url,plan) if plan else None}
            fields={'priceRub':'price_discount' if rubles(unit.get('price_discount')) else 'price','areaSqm':'square','rooms':'rooms','floor':'floor','unitNumber':'num','availabilityRaw':'status'}
            return [common('high-life',unit['id'],row,url,collected_at,html,path,fields)]
    return []


def extract_highlife_related(html,url,collected_at):
    primary=extract_highlife(html,url,collected_at)
    if not primary: return []
    target=urlsplit(url).path.rstrip('/').rsplit('/',1)[-1]
    scripts=Scripts();scripts.feed(html)
    result=[]
    seen={target}
    for attrs,text in scripts.blocks:
        if attrs.get('id')!='__NEXT_DATA__': continue
        data=json.loads(text)
        queries=data.get('props',{}).get('pageProps',{}).get('initialState',{}).get('api',{}).get('queries',{})
        for key,query in queries.items():
            if query.get('endpointName')!='getFlatById' or str(query.get('originalArgs',{}).get('id'))!=target: continue
            for index,unit in enumerate(query.get('data',{}).get('similar',[])):
                identifier=str(unit.get('id',''))
                area=positive(unit.get('square'))
                price=rubles(unit.get('price_discount')) or rubles(unit.get('price'))
                if not identifier.isdigit() or identifier in seen or not area or not price or not unit.get('num'): continue
                seen.add(identifier)
                path='__NEXT_DATA__.props.pageProps.initialState.api.queries['+json.dumps(key)+'].data.similar['+str(index)+']'
                row={'unitNumber':unit.get('num'),'buildingName':unit.get('corpus'),'floor':unit.get('floor'),
                     'rooms':unit.get('rooms'),'bedrooms':None,'areaSqm':area,'finish':unit.get('finishing'),
                     'type':unit.get('type'),'priceRub':price,'priceBeforeDiscountRub':rubles(unit.get('price')),
                     'pricePerSqm':rubles(unit.get('price_m_discount')) or rubles(unit.get('price_m')),
                     'availabilityRaw':unit.get('status'),'features':unit.get('options',[]),'view':unit.get('view') or [],
                     'planImageUrl':urljoin(url,unit['plan']) if unit.get('plan') else None,
                     'sourceRelation':'similar_unit_in_official_payload',
                     'detailUrl':'https://highlife.ru/flats/'+identifier,
                     'priceBasis':'price reported in similar units of official apartment page'}
                fields={'priceRub':'price_discount' if rubles(unit.get('price_discount')) else 'price','areaSqm':'square','rooms':'rooms','floor':'floor','unitNumber':'num','availabilityRaw':'status'}
                result.append(common('high-life',identifier,row,url,collected_at,html,path,fields))
    return result


def extract_stone(html,url,collected_at):
    target=re.fullmatch(r'/catalog/residential/(blik|sokolniki)/([a-z0-9-]+)/?',urlsplit(url).path)
    if not target or urlsplit(url).hostname not in {'stone.ru','www.stone.ru'}: return []
    project_name,slug=target.groups()
    scripts=Scripts();scripts.feed(html)
    candidates=[]
    for prefix,data in next_flight_records(scripts.blocks):
        for path,node in walk(data):
            # Require exact lot context: not recommendations, not generic catalog entries.
            if path.endswith('["value"]["lot"]') and node.get('slug')==slug and node.get('project',{}).get('strapiSlug')==project_name:
                candidates.append((prefix+path,node))
    if len(candidates)!=1: return []
    path,unit=candidates[0]
    price=rubles(unit.get('sellingPrice')) if unit.get('showPriceFlg') is True else None
    area=positive(unit.get('area'))
    if not price or not area or not unit.get('id'): return []
    project='stone-'+project_name
    row={'sourceLotUuid':unit.get('lotUuid'),'unitNumber':unit.get('number'),
         'buildingName':unit.get('housing'),'floor':unit.get('floor'),'floorsTotal':unit.get('floorsNumber'),
         'rooms':unit.get('roomsCount'),'bedrooms':unit.get('bedroomsCount'),'areaSqm':area,
         'unitType':'studio' if unit.get('roomsCount')==1 and unit.get('bedroomsCount')==0 else 'apartment',
         'finish':'без отделки' if unit.get('isDecoration') is False else None,
         'priceRub':price,'priceBeforeDiscountRub':rubles(unit.get('sellingPriceBeforeDiscount')),
         'pricePerSqm':rubles(unit.get('sellingPricePerMeter')),
         'priceBasis':'sellingPrice reported by official site; payment conditions require confirmation',
         'discountPercent':unit.get('discount'),'availabilityRaw':unit.get('status'),
         'completionYear':unit.get('buildingYear'),'address':unit.get('address'),
         'features':[f['val'] for f in unit.get('features',[]) if isinstance(f,dict) and f.get('val')],
         'view':unit.get('windowViews',[]),'ceilingHeightM':positive(unit.get('ceiling')),
         'planImageUrl':unit.get('interiorPlanImg'),'floorPlanImageUrl':unit.get('floorPlanImg'),
         'sourceUpdatedAt':unit.get('updatedAt')}
    fields={'priceRub':'sellingPrice','priceBeforeDiscountRub':'sellingPriceBeforeDiscount','areaSqm':'area','rooms':'roomsCount','bedrooms':'bedroomsCount','floor':'floor','unitNumber':'number','availabilityRaw':'status'}
    return [common(project,unit['id'],row,url,collected_at,html,path,fields)]


def extract(html,url,collected_at,include_related=False):
    units=extract_highlife(html,url,collected_at)+extract_stone(html,url,collected_at)
    if include_related: units.extend(extract_highlife_related(html,url,collected_at))
    return units


def plan_url(url):
    parsed=urlsplit(url)
    if parsed.scheme!='https' or parsed.hostname not in {'highlife.ru','storage.yandexcloud.net'} or parsed.username or parsed.password or parsed.port not in {None,443}:
        raise ValueError('Plan URL outside official media allowlist')
    return url


class PlanRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        plan_url(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)


def raster_extension(body,content_type):
    if content_type=='image/png' and body.startswith(b'\x89PNG\r\n\x1a\n') and b'IEND' in body[-12:]: return '.png'
    if content_type=='image/jpeg' and body.startswith(b'\xff\xd8') and body.endswith(b'\xff\xd9'): return '.jpg'
    if content_type=='image/webp' and body.startswith(b'RIFF') and body[8:12]==b'WEBP': return '.webp'
    raise ValueError('Unsupported or incomplete raster plan')


def download_plans(units,directory):
    directory.mkdir(parents=True,exist_ok=True)
    for unit in units:
        url=unit.get('planImageUrl')
        if not url: continue
        try:
            opener=urllib.request.build_opener(PlanRedirect())
            request=urllib.request.Request(plan_url(url),headers={'User-Agent':'MAINHALL-OfficialPlanCollector/1.0 (+https://main-hall.ru)'})
            with opener.open(request,timeout=20) as response:
                plan_url(response.geturl())
                limit=8*1024*1024
                if int(response.headers.get('Content-Length','0'))>limit: raise ValueError('Plan exceeds byte limit')
                body=response.read(limit+1)
                if len(body)>limit: raise ValueError('Plan exceeds byte limit')
                extension=raster_extension(body,response.headers.get_content_type())
            target=directory/(unit['projectSlug']+'-'+unit['sourceId']+extension)
            target.write_bytes(body)
            unit['localPlanPath']=target.as_posix()
            unit['planSha256']=hashlib.sha256(body).hexdigest()
        except Exception as error:
            unit['planDownloadError']=type(error).__name__+': '+str(error)[:300]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot_json',type=Path)
    parser.add_argument('--raw-dir',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--download-plans',type=Path,help='Download verified raster floor plans to this directory')
    parser.add_argument('--include-related',action='store_true',help='Include concrete units explicitly present in official similar-unit payloads; retain evidence URL')
    args=parser.parse_args()
    snapshots=json.loads(args.snapshot_json.read_text())['projects']
    units=[]
    for snapshot in snapshots:
        raw=args.raw_dir/(snapshot['slug']+'.html')
        if raw.exists() and snapshot.get('status')=='collected':
            raw_bytes=raw.read_bytes()
            source_units=extract(raw_bytes.decode('utf-8',errors='replace'),snapshot['sourceUrl'],snapshot['collectedAt'],args.include_related)
            for unit in source_units: unit['proof']['rawHtmlSha256']=hashlib.sha256(raw_bytes).hexdigest()
            units.extend(source_units)
    if args.download_plans: download_plans(units,args.download_plans)
    result={'schemaVersion':1,'sourcePriority':['nmarket','partner_feed','public_site'],
            'generatedAt':datetime.now(timezone.utc).isoformat(),'units':units}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print('Verified source units:',len(units))
    for unit in units: print(unit['projectSlug'],unit['unitNumber'],unit['areaSqm'],unit['priceRub'])


if __name__=='__main__': main()
