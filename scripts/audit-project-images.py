#!/usr/bin/env python3
"""Rebuild the project-cover coverage audit from the public catalogue registries."""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def catalogue_projects() -> dict[str, str]:
    text=(ROOT/'src/lib/editorial-projects.ts').read_text(encoding='utf-8')
    projects={slug:name for slug,name in re.findall(r'\{slug:"([^"]+)",name:"([^"]+)"',text)}
    for path in ('data/catalogue/research-projects-2026-10-26.json','data/catalogue/research-additional-projects-2026-10-29.json'):
        data=load(path); rows=data.get('projects',data) if isinstance(data,dict) else data
        for p in rows: projects.setdefault(p['slug'],p['name'])
    portfolio=load('data/catalogue/sminex-portfolio.json')['projects']
    for p in portfolio:
        if p.get('propertyType')!='commercial':
            projects.setdefault(p['slug'],(p.get('editorial') or {}).get('name') or p['name'])
    for p in load('data/catalogue/sminex-feed-project-editorial.json')['projects']:
        projects.setdefault(p['slug'],p['name'])
    return projects

def covered_slugs() -> set[str]:
    text=(ROOT/'src/lib/project-images.ts').read_text(encoding='utf-8')
    quoted=re.findall(r'["\']([a-z0-9-]+)["\']\s*:\s*\{\s*["\']?src["\']?\s*:',text)
    bare=re.findall(r'(?m)^\s*([a-z][a-z0-9-]*)\s*:\s*\{\s*["\']?src["\']?\s*:',text)
    covered=set(quoted)|set(bare)
    covered.update(re.findall(r'projectImages\["([a-z0-9-]+)"\]',text))
    covered.update(load('data/catalogue/collected-project-images.json'))
    covered.update(p['slug'] for p in load('data/catalogue/sminex-portfolio.json')['projects'])
    return covered

def build_audit() -> dict:
    projects=catalogue_projects(); covered=covered_slugs(); missing=sorted(set(projects)-covered)
    return {
      'checkedAt':'2026-11-06T13:40:00Z',
      'basis':'Current editorial catalogue registries and projectImages cover registry',
      'catalogueCount':len(projects),
      'coverCount':len(set(projects)&covered),
      'missingCoverCount':len(missing),
      'projects':[{'slug':slug,'name':projects[slug]} for slug in missing],
    }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); args=ap.parse_args()
    path=ROOT/'data/provenance/project-photo-missing-audit.json'; audit=build_audit()
    if args.check:
        current=json.loads(path.read_text(encoding='utf-8'))
        if current != audit: raise SystemExit('project image audit is stale; run scripts/audit-project-images.py')
    else: path.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"catalogue={audit['catalogueCount']} covers={audit['coverCount']} missing={audit['missingCoverCount']}")
if __name__=='__main__': main()
