#!/usr/bin/env python3
"""Audit partner Yandex Realty XML; no publishing or database writes."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import xml.etree.ElementTree as ET

NS = '{http://webmaster.yandex.ru/schemas/feed/realty/2010-06}'
def t(name): return NS + name

def audit(path, target='Москва', max_age_days=7):
    regions, complexes = Counter(), Counter()
    generated = None
    total = priced = with_images = target_offers = 0
    for _, element in ET.iterparse(path, events=('end',)):
        if element.tag == t('generation-date'):
            generated = (element.text or '').strip()
            element.clear()
        elif element.tag == t('offer'):
            total += 1
            location = element.find(t('location'))
            region = location.findtext(t('region'), 'UNKNOWN') if location is not None else 'UNKNOWN'
            building = element.findtext(t('building-name'), 'UNKNOWN') or 'UNKNOWN'
            regions[region] += 1
            complexes[(region,building)] += 1
            if element.find(t('price')) is not None and element.find(t('price')).findtext(t('value')):
                priced += 1
            if element.find(t('image')) is not None:
                with_images += 1
            target_offers += (region == target)
            element.clear()
    try:
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(generated.replace('Z','+00:00'))).days
    except (ValueError, AttributeError):
        age = None
    return {
        'filename': Path(path).name, 'generated_at': generated,
        'age_days': age, 'fresh': age is not None and 0 <= age <= max_age_days,
        'target_region': target, 'total_offers': total,
        'target_offers': target_offers, 'offers_with_price': priced,
        'offers_with_image_reference': with_images,
        'complex_names': len(complexes), 'regions': dict(regions),
        'top_complexes': [{'region':r,'name':n,'offers':count} for (r,n),count in complexes.most_common(20)],
        'permission_confirmed_by_audit': False,
        'publishable_by_this_script': False,
        'warning': 'No import/publication. Real import needs licensed use, fresh prices and a verified matching region.'
    }
if __name__ == '__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('feed')
    ap.add_argument('--region', default='Москва')
    ap.add_argument('--max-age-days',type=int,default=7)
    args=ap.parse_args()
    print(json.dumps(audit(args.feed,args.region,args.max_age_days),ensure_ascii=False,indent=2))
