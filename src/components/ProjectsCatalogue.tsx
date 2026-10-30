"use client";
import Link from 'next/link';
import {useMemo,useState} from 'react';
import {editorialProjects} from '@/lib/editorial-projects';
import {projectImages} from '@/lib/project-images';
import {researchBySlug} from '@/lib/research-projects';
import '@/app/project-experience.css';
export function ProjectsCatalogue({slugs,investmentMode=false}:{slugs?:string[];investmentMode?:boolean}={}){
 const [query,setQuery]=useState(''),[area,setArea]=useState(''),[segment,setSegment]=useState('');
 const all=useMemo(()=>editorialProjects.filter(p=>!slugs||slugs.includes(p.slug)),[slugs]);
 const list=all.filter(p=>(p.name+' '+p.area+' '+p.developer).toLowerCase().includes(query.toLowerCase())&&(!area||p.area===area)&&(!segment||p.className===segment));
 return <section className="mh-visual-catalog"><div className="mh-visual-filters"><input aria-label="Поиск проектов" placeholder="Название, район или застройщик" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Район" value={area} onChange={e=>setArea(e.target.value)}><option value="">Все районы</option>{[...new Set(all.map(p=>p.area))].sort().map(x=><option key={x}>{x}</option>)}</select><select aria-label="Класс недвижимости" value={segment} onChange={e=>setSegment(e.target.value)}><option value="">Все классы</option>{[...new Set(all.map(p=>p.className))].map(x=><option key={x}>{x}</option>)}</select></div><p className="mh-visual-count" aria-live="polite">{list.length} проектов</p><div className="mh-visual-grid">{list.map(p=>{const photo=projectImages[p.slug],r=researchBySlug(p.slug);return <Link key={p.slug} href={'/projects/'+p.slug+'/'} className={'mh-visual-card'+(investmentMode?' mh-invest-selection-card':'')}><div className="mh-visual-cover">{photo&&<img src={photo.src} alt={photo.caption} width="1000" height="750" loading="lazy"/>}{r?.score!=null&&<span className="mh-rating-badge" title="Оценка MAINHALL по результатам анализа проекта">{(r.score/10).toLocaleString('ru-RU',{maximumFractionDigits:1})}<small>/10</small></span>}<span className="mh-class-chip">{p.className}</span></div><div className="mh-visual-copy"><p>{p.area} · {p.developer}</p><h2>{p.name}</h2><span>Посмотреть проект <b aria-hidden="true">↗</b></span></div></Link>})}</div>{!list.length&&<p>По выбранным условиям проектов не найдено.</p>}</section>;
}
