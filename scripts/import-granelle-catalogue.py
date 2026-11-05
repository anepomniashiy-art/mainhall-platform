#!/usr/bin/env python3
"""Collect concrete Granelle apartment cards from its public project catalogues.

This adapter uses visible per-unit cards only, never turns project totals into
apartments, and labels quoted 'from' prices as conditional. The current page
coverage is recorded explicitly and is not claimed to be a full developer feed.
"""
import argparse
import hashlib
import json
import re
import urllib.request
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

PROJECTS={'mypriority-mnevniki':'mypriority-mnevniki','mypriority-dubrovka':'mypriority-dubrovka','triniti':'trinity'}
BASE='https://www.granelle.ru'

class Cards(HTMLParser):
    def __init__(self):
        super().__init__();self.current=None;self.cards=[];self.section=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and re.fullmatch(r'/flats/[a-z0-9-]+/\d+/?',attrs.get('href','')):
            self.current={'url':attrs['href'],'text':[],'title':[],'price':[],'oldPrice':[],'plan':None}
        if self.current is None:return
        if tag=='h2':self.section='title'
        if tag=='span' and any(c.startswith('priceLabel_') for c in attrs.get('class','').split()):self.section='price'
        if tag=='span' and any(c.startswith('oldPrice_') for c in attrs.get('class','').split()):self.section='oldPrice'
        if tag=='img' and self.current['plan'] is None and '/properties/property/plan/' in attrs.get('src',''):
            self.current['plan']=attrs['src']
    def handle_endtag(self,tag):
        if self.current is None:return
        if tag in {'h2','span'}:self.section=None
        if tag=='a':self.cards.append(self.current);self.current=None;self.section=None
    def handle_data(self,text):
        if self.current is not None:
            self.current['text'].append(text)
            if self.section:self.current[self.section].append(text)

def normalize(html,project,url,stamp):
    parser=Cards();parser.feed(html);rows=[];seen=set()
    digest=hashlib.sha256(html.encode()).hexdigest()
    for card in parser.cards:
        path=re.fullmatch(r'/flats/([a-z0-9-]+)/(\d+)/?',card['url'])
        if not path or path[1]!=project or path[2] in seen:continue
        title=' '.join(card['title']);text=' '.join(card['text'])
        area=re.search(r'([\d.,]+)\s*м',title)
        rooms=re.search(r'(\d+)-комн',title)
        studio='Студия' in title
        raw_price=''.join(card['price']);price=re.sub(r'\D','',raw_price)
        floor=re.search(r'этаж\s+(\d+)\s+из\s+(\d+)',text)
        if not area or not price or not floor or not card['plan'] or not (rooms or studio):continue
        area=float(area[1].replace(',','.'));price=int(price)
        if area<=0 or price<=0:continue
        sid=path[2];seen.add(sid)
        old=re.sub(r'\D','',''.join(card['oldPrice']))
        completion=re.search(r'(?:I{1,3}|IV)\s*кв\.\s*(20\d{2})',text)
        rows.append({'id':PROJECTS[project]+':'+sid,'sourceId':sid,'projectSlug':PROJECTS[project],
           'sourceType':'public_site','sourceUrl':urljoin(BASE,card['url']),'fetchedAt':stamp,
           'salesStatus':'UNKNOWN','unitNumber':None,'buildingName':None,'floor':int(floor[1]),'floorsTotal':int(floor[2]),
           'rooms':1 if studio else int(rooms[1]),'bedrooms':0 if studio else None,
           'unitType':'studio' if studio else 'apartment','type':'Квартира','areaSqm':area,
           'finish':'Без отделки' if 'Без отделки' in text else None,
           'priceRub':price,'priceIsFrom':True,'priceBeforeDiscountRub':int(old) if old else None,'pricePerSqm':round(price/area),
           'priceBasis':'Quoted from-price displayed for this apartment card; discount and payment eligibility require confirmation',
           'features':['Цена «от»: условия скидки и оплаты подтвердим при подборе']+(['Европланировка'] if 'евро' in title else []),'completionYear':int(completion[1]) if completion else None,
           'planImageUrl':card['plan'],'proof':{'catalogueUrl':url,'rawHtmlSha256':digest,
              'cardHref':card['url'],'visibleTitle':title.strip(),'visiblePrice':raw_price.strip()}})
    if not rows:raise ValueError('No concrete apartment cards found: '+url)
    return rows

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--output',type=Path,default=Path('data/catalogue/public-units.json'))
    ap.add_argument('--input-dir',type=Path,help='Saved granelle-<project>.html files')
    args=ap.parse_args();stamp=datetime.now(timezone.utc).isoformat();units=[];reports=[]
    for project in PROJECTS:
        url=BASE+'/flats/?project='+project
        if args.input_dir:html=(args.input_dir/('granelle-'+project+'.html')).read_text()
        else:
            request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 MAINHALL/1.0'})
            with urllib.request.urlopen(request,timeout=35) as response:raw=response.read(10_000_001)
            if len(raw)>10_000_000:raise ValueError('Catalogue page exceeds limit')
            html=raw.decode('utf8',errors='replace')
        rows=normalize(html,project,url,stamp);units.extend(rows)
        reports.append({'projectSlug':PROJECTS[project],'url':url,'verifiedCards':len(rows),'scope':'Concrete cards rendered on the first public catalogue page; partial project coverage.'})
    current=json.loads(args.output.read_text());target={p for p in PROJECTS.values()}
    current['units']=[u for u in current['units'] if u['projectSlug'] not in target]+units;current['generatedAt']=stamp
    args.output.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
    report=Path('data/provenance/granelle-latest-refresh.json');report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps({'checkedAt':stamp,'projects':reports},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'collectedAt':stamp,'unitCount':len(units),'projects':reports},ensure_ascii=False))

if __name__=='__main__':main()
