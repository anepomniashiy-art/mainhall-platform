"""Import a complete downloaded Nmarket feed. Never accepts credentials or filters prices.

The original XML is retained privately; public records contain property facts only.
All available image references resolve to verified local originals. Confirmed 404 responses require an explicit provenance record.
"""
import argparse
from collections import Counter
import gzip
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.hidden += 1
        if tag in ('p', 'br', 'li', 'div'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.hidden = max(0, self.hidden-1)
        if tag in ('p', 'li', 'div'): self.parts.append('\n')
    def handle_data(self, data):
        if not self.hidden: self.parts.append(data)

def plain(value):
    parser = PlainText(); parser.feed(html.unescape(value or ''))
    text = ''.join(parser.parts)
    text = re.sub(r'https?://\S+|www\.\S+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}', '', text)
    text = re.sub(r'(?<!\d)(?:\+7|8)[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)', '', text)
    return '\n'.join(re.sub(r'[ \t]+', ' ', line).strip() for line in text.splitlines() if line.strip()).strip()

def normalized(value):
    return re.sub(r'[^a-zа-я0-9]', '', value.casefold().replace('ё', 'е'))

def translit(value):
    letters = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya']))
    return re.sub(r'[^a-z0-9]+', '-', ''.join(letters.get(c,c) for c in value.lower())).strip('-')

def number(value):
    try: return float(value.replace(',', '.')) if value else None
    except ValueError: return None

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--xml', type=Path, required=True)
    args.add_argument('--manifest', type=Path, required=True)
    args.add_argument('--registry', type=Path, required=True)
    args.add_argument('--unavailable-manifest', type=Path)
    a = args.parse_args()
    manifest = json.loads(a.manifest.read_text())
    unavailable_rows=json.loads(a.unavailable_manifest.read_text()) if a.unavailable_manifest else []
    if any(row.get('httpStatus')!=404 for row in unavailable_rows): raise ValueError('Only explicitly confirmed missing resources may be excluded')
    unavailable={row['url']:row for row in unavailable_rows}
    if any(not row.get('src') and row['url'] not in unavailable for row in manifest): raise ValueError('Unresolved image downloads')
    media = {row['url']: row for row in manifest if row.get('src')}
    verified_manifest = [row for row in manifest if row.get('src')]
    registry = json.loads(a.registry.read_text())
    aliases = {}
    for p in registry:
        for name in [p['name'], *p['name'].split(' / ')]: aliases[normalized(name)] = p
    map_path = ROOT/'data/catalogue/nmarket-project-map.json'
    mapping = json.loads(map_path.read_text()) if map_path.exists() else {}
    overrides = {'78268':'very-botanicheskaya', '88619':'stone-sokolniki', '99417':'stone-blik', '90283':'evopark-izmaylovo'}
    existing = {p['slug']: p for p in registry}
    projects = {}; units = []; descriptions = []; text_ids = {}; image_refs = 0
    def text_ref(value):
        text = plain(value)
        if text not in text_ids:
            text_ids[text] = len(descriptions); descriptions.append(text)
        return text_ids[text]
    def get(el, path): return (el.findtext(path) or '').strip()
    generated = ''
    for _, el in ET.iterparse(a.xml, events=['end']):
        tag = el.tag.split('}')[-1]
        if tag == 'generation-date': generated = (el.text or '').strip()
        if tag != 'offer': continue
        for child in el.iter(): child.tag = child.tag.split('}')[-1]
        cid = get(el,'nmarket-complex-id'); name = get(el,'building-name')
        if cid not in projects:
            match = aliases.get(normalized(name))
            slug = overrides.get(cid) or mapping.get(cid,{}).get('slug') or (match and match['slug']) or translit(name)
            if any(p['slug']==slug for p in projects.values()): raise ValueError('Project slug collision: '+slug)
            old = existing.get(slug)
            developer = old['developer'] if old else ''
            if not developer:
                found = re.search(r'Застройщик:\s*([^\n]+)', get(el,'description'))
                developer = found.group(1).strip().rstrip('.') if found else 'Застройщик уточняется'
            p = {'sourceId':cid,'slug':slug,'name':name,'developer':developer,
                 'region':get(el,'location/region'),'locality':get(el,'location/locality-name'),
                 'district':get(el,'location/sub-locality-name'),'classRaw':get(el,'building-class'),
                 'addresses':[], 'descriptionRefs':[], 'buildings':{},'images':[], 'units':0}
            projects[cid] = p
            mapping[cid] = {'name':name,'slug':slug,'developer':developer}
        p = projects[cid]; p['units'] += 1
        address = ', '.join(dict.fromkeys(x for x in [p['region'],p['locality'],get(el,'location/address')] if x))
        if address not in p['addresses']: p['addresses'].append(address)
        ref = text_ref(get(el,'complex-description'))
        if ref not in p['descriptionRefs']: p['descriptionRefs'].append(ref)
        bid = get(el,'nmarket-building-id')
        if bid not in p['buildings']:
            p['buildings'][bid] = {'id':bid,'name':get(el,'building-section'),'phase':get(el,'building-phase'),
                 'address':address,'descriptionRef':text_ref(get(el,'building-description')),
                 'type':get(el,'building-type'),'state':get(el,'building-state'),
                 'floors':number(get(el,'floors-total')),'year':number(get(el,'built-year')),
                 'quarter':number(get(el,'ready-quarter')),'latitude':number(get(el,'location/latitude')),
                 'longitude':number(get(el,'location/longitude'))}
        images = []; unavailable_images=[]
        for image in el.findall('image'):
            image_refs += 1
            url = (image.text or '').strip().replace('http://','https://',1)
            if url not in media:
                if url in unavailable:
                    unavailable_images.append({'tag':image.get('tag') or 'project','httpStatus':404,'sourceUrl':url})
                    continue
                raise ValueError('Image missing from manifest: '+url)
            record = media[url]
            if not (ROOT/'public'/record['src'].lstrip('/')).is_file(): raise ValueError('Missing local original')
            tag = image.get('tag') or 'project'
            item = {'url':record['src'],'tag':tag}
            if item not in images: images.append(item)
            if tag not in ('plan','floorplan') and not any(i['src']==record['src'] for i in p['images']):
                p['images'].append({'src':record['src'],'tag':tag,'width':record.get('width',1200),'height':record.get('height',900)})
        area = number(get(el,'area/value')); price = number(get(el,'price/value'))
        sid = el.get('internal-id')
        # All original fields, including source-only metadata, remain in private XML.
        facts = {key:get(el,key) for key in ('mortgage','haggle','balcony','bathroom-unit','building-type','building-class','building-phase','lift','parking','new-flat')}
        facts.update({'address':address,'livingSpace':get(el,'living-space/value'),'kitchenSpace':get(el,'kitchen-space/value'),'createdAt':get(el,'creation-date'),'updatedAt':get(el,'last-update-date')})
        units.append({'id':'nmarket:'+sid,'sourceId':sid,'projectName':name,'projectSlug':p['slug'],
            'unitNumber':get(el,'location/apartment') or None,'category':'apartment','propertyType':'residential','areaSqm':area,'priceRub':price,
            'pricePerSqm':round(price/area,2) if area and price else None,'floor':number(get(el,'floor')),
            'floorsTotal':number(get(el,'floors-total')),
            'descriptionRef':text_ref(get(el,'description')),'images':images,'unavailableImages':unavailable_images,
            'planImageUrl':next((i['url'] for i in images if i['tag']=='plan'),None),
            'updatedAt':get(el,'last-update-date'),'createdAt':get(el,'creation-date'),'salesStatus':'В продаже',
            'rooms':number(get(el,'rooms')),'buildingName':get(el,'building-section'),'buildingId':bid,
            'finishRaw':get(el,'renovation'),'ceilingHeight':number(get(el,'ceiling-height')),
            'isStudio':get(el,'studio') in ('true','1'),'deliveryYear':number(get(el,'built-year')),
            'deliveryQuarter':number(get(el,'ready-quarter')),'buildingStateRaw':get(el,'building-state'),
            'facts':facts,'location':{**{c.tag:(c.text or '').strip() for c in el.findall('location/*') if not list(c)}, **{'metro/'+c.tag:(c.text or '').strip() for c in el.findall('location/metro/*')}}})
        el.clear()
    if len(units)!=len({u['id'] for u in units}): raise ValueError('Duplicate source offer ID')
    output=ROOT/'data/catalogue'
    def write(name,data):
        encoded=(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n').encode()
        if name in ('nmarket-projects.json','nmarket-units.json','nmarket-media.json'):
            (output/(name+'.gz')).write_bytes(gzip.compress(encoded,compresslevel=6,mtime=0))
            (output/name).unlink(missing_ok=True)
        else:(output/name).write_bytes(encoded)
    write('nmarket-project-map.json',mapping)
    write('nmarket-projects.json',{'generatedAt':generated,'projects':list(projects.values()),'descriptions':descriptions})
    write('nmarket-units.json',{'generatedAt':generated,'units':units})
    write('nmarket-media.json',{'images':verified_manifest,'unavailable':unavailable_rows,'references':image_refs})
    editorial=[]; dossiers={}; covers={}
    checks=['Корпус и срок передачи по договору','Наличие квартиры и цена при выбранном способе оплаты','Состав отделки и дополнительные расходы']
    classes={'Бизнес':'Бизнес','Элитный':'Элитная','Комфорт':'Комфорт','Премиум':'Премиум'}
    for p in projects.values():
        summary=descriptions[p['descriptionRefs'][0]]
        summary=summary.split('\n')[0]
        if len(summary)>500:summary=summary[:497].rsplit(' ',1)[0].rstrip(',;:')+'…'
        summary=summary or f"Жилой комплекс {p['name']}. {p['addresses'][0]}."
        area=p['district'] or p['locality'] or p['region']
        editorial.append({'slug':p['slug'],'name':p['name'],'developer':p['developer'],'area':area,
            'className':classes.get(p['classRaw'],'Не указан'),'sourceUrl':'','summary':summary,
            'thesis':'Для выбора квартиры сравним полную стоимость, планировку, отделку и срок передачи в выбранном корпусе.',
            'dueDiligence':checks,'propertyType':'residential'})
        dossiers[p['slug']]={'address':p['addresses'][0],'format':'О жилом комплексе '+p['name'],
            'features':[p['classRaw']+' класс'] if p['classRaw'] else [],'location':p['addresses'][0],
            'thesis':'','checks':checks,'source':'','checkedAt':generated[:10]}
        cover=next((i for i in p['images'] if i['tag']=='housemain'),None) or next((i for i in p['images'] if i['tag']=='project'),None)
        if cover:covers[p['slug']]={'src':cover['src'],'caption':p['name']+' · изображение проекта'}
    write('nmarket-editorial.json',editorial)
    write('nmarket-dossiers.json',dossiers)
    write('nmarket-covers.json',covers)
    captions={'housemain':'Главное изображение проекта','complexscheme':'Генеральный план','project':'Изображение проекта'}
    galleries={p['slug']:[{'src':i['src'],'caption':captions.get(i['tag'],'Изображение проекта'),'category':'Генеральный план' if i['tag']=='complexscheme' else 'Проект','width':i['width'],'height':i['height']} for i in p['images']] for p in projects.values()}
    write('nmarket-galleries.json',galleries)
    private = ROOT/'data/private'; private.mkdir(exist_ok=True)
    with a.xml.open('rb') as source, gzip.open(private/'nmarket-source.xml.gz','wb',compresslevel=6) as target:
        import shutil; shutil.copyfileobj(source,target)
    with a.xml.open('rb') as source:
        source_digest = hashlib.file_digest(source,'sha256').hexdigest()
    report={'offers':len(units),'projects':len(projects),'uniqueImages':len(media)+len(unavailable),'downloadedImages':len(media),'unavailableImages':len(unavailable),'omittedImages':0,'imageReferences':image_refs,
        'mediaBytes':sum(i['bytes'] for i in verified_manifest),'sourceSha256':source_digest,
        'generatedAt':generated,'unresolvedImages':0,'scope':'All offers; no price or geography filter','sourceOfferCount':len(units),'sourceProjectCount':len(projects)}
    write('nmarket-import-audit.json',report); print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__': main()
