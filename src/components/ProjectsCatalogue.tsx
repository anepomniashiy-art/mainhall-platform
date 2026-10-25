"use client";
import Link from "next/link";
import {useMemo,useRef,useState} from "react";
import {projectImages} from "@/lib/project-images";
import {editorialProjects} from "@/lib/editorial-projects";
import {comparisonMoney,getProjectComparison} from "@/lib/project-comparison";
import {ProjectComparison} from './ProjectComparison';
import '@/app/comparison.css';
export function ProjectsCatalogue({slugs,investmentMode=false}:{slugs?:string[];investmentMode?:boolean}={}){
 const [q,setQ]=useState(''),[segment,setSegment]=useState(''),[developer,setDeveloper]=useState(''),[area,setArea]=useState('');
 const [selected,setSelected]=useState<string[]>([]),[open,setOpen]=useState(false),[numbersOnly,setNumbersOnly]=useState(false),[message,setMessage]=useState('');
 const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);
 const all=useMemo(()=>editorialProjects.filter(p=>!slugs||slugs.includes(p.slug)),[slugs]);
 const projects=useMemo(()=>all.filter(p=>(p.name+' '+p.area+' '+p.developer).toLowerCase().includes(q.toLowerCase())&&(!segment||p.className===segment)&&(!developer||p.developer===developer)&&(!area||p.area===area)&&(!numbersOnly||getProjectComparison(p.slug).price!==null)),[q,segment,developer,area,numbersOnly,all]);
 function remove(slug:string){if(selected.length===1)setOpen(false);setSelected(s=>s.filter(x=>x!==slug));}
 function toggle(slug:string){if(selected.includes(slug)){remove(slug);setMessage('');return;}if(selected.length===4){setMessage('Можно сравнить до четырёх проектов. Уберите один из выбранных.');return;}setSelected(s=>[...s,slug]);setMessage('');}
 function show(){setOpen(true);requestAnimationFrame(()=>panel.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
 function close(){setOpen(false);trigger.current?.focus();}
 return <div className={'mh-catalog-results mh-comparison-catalog'+(investmentMode?' mh-investment-catalog':'')}>
  <p className="mh-comparison-intro">Цена, дата данных и вывод доступны в списке. Отметьте от двух до четырёх проектов, чтобы поставить показатели рядом.</p>
  <div className="mh-filters"><input aria-label="Поиск проектов" value={q} onChange={e=>setQ(e.target.value)} placeholder="Название, район, девелопер"/><select aria-label="Класс недвижимости" value={segment} onChange={e=>setSegment(e.target.value)}><option value="">Все классы</option>{[...new Set(all.map(p=>p.className))].map(s=><option key={s}>{s}</option>)}</select><select aria-label="Девелопер" value={developer} onChange={e=>setDeveloper(e.target.value)}><option value="">Все девелоперы</option>{[...new Set(all.map(p=>p.developer))].sort().map(d=><option key={d}>{d}</option>)}</select><select aria-label="Район" value={area} onChange={e=>setArea(e.target.value)}><option value="">Все локации</option>{[...new Set(all.map(p=>p.area))].sort().map(d=><option key={d}>{d}</option>)}</select><button type="button" className="mh-text-link" onClick={()=>{setQ('');setSegment('');setDeveloper('');setArea('');setNumbersOnly(false);}}>Сбросить фильтры</button><Link href="/units/" className="mh-text-link">Квартиры и планировки ↗</Link></div>
  <label className="mh-comparison-numbers"><input type="checkbox" checked={numbersOnly} onChange={e=>setNumbersOnly(e.target.checked)}/> Есть данные о цене (включая архив)</label>
  <p className="mh-count" aria-live="polite">{projects.length} / {all.length} проектов</p>
  <div ref={panel}>{open&&selected.length>0&&<ProjectComparison slugs={selected} onRemove={remove} onClose={close}/>}</div>
  <div className="mh-catalog-cards">{projects.map(p=>{const data=getProjectComparison(p.slug);const chosen=selected.includes(p.slug);return <article className={'mh-catalog-comparison-item'+(chosen?' is-selected':'')+(investmentMode?' mh-invest-selection-card':'')} key={p.slug}>
   <Link href={'/projects/'+p.slug+'/'} className="mh-catalog-card mh-project-row">{projectImages[p.slug]&&<img className="mh-featured-photo" src={projectImages[p.slug].src} alt={projectImages[p.slug].caption} width="800" height="600" loading="lazy"/>}<div className="mh-project-meta"><span>{p.area}</span><span>{p.className}</span></div><h2>{p.name}</h2><span className="mh-eyebrow">{p.developer}</span></Link>
   <div className="mh-catalog-key-data"><dl><div><dt>{data.priceLabel}</dt><dd>{data.price?comparisonMoney(data.price/1e6)+' млн ₽':'По запросу'}</dd><small>{data.priceDetail}{data.priceDate&&' · '+data.priceDate}</small></div><div><dt>Цена метра примера</dt><dd>{data.perM2?comparisonMoney(data.perM2)+' ₽/м²':'Не опубликована'}</dd></div><div><dt>Медиана предложений</dt><dd>{data.median?comparisonMoney(data.median)+' ₽/м²':'Нет выборки'}</dd>{data.medianDate&&<small>Архив {data.medianDate}</small>}</div></dl><p className="mh-catalog-data-status">{data.coverage}</p><p className="mh-catalog-growth"><strong>Рост цены:</strong> {data.growth}</p><details><summary>Вывод и проверка</summary><p>{data.verdict}</p><p><strong>Перед покупкой:</strong> {data.risk}</p></details><div className="mh-catalog-card-actions"><button type="button" data-compare-add={p.slug} aria-pressed={chosen} onClick={()=>toggle(p.slug)}>{chosen?'В сравнении ✓':'Сравнить +'}<span className="sr-only"> {p.name}</span></button><Link href={'/projects/'+p.slug+'/'}>Подробнее ↗</Link></div></div>
  </article>})}</div>
  {!projects.length&&<p className="py-16">Проекты не найдены. Попробуйте изменить фильтры.</p>}
  <p className="mh-comparison-disclaimer">Ценовые записи проверены по источникам в указанные даты. Наличие и условия оплаты требуют обновления. Медиана архивной выборки не является ценой конкретной квартиры.</p>
  {selected.length>0&&<aside className="mh-comparison-tray" aria-label="Выбранные проекты"><div className="mh-comparison-chips">{selected.map(slug=><button key={slug} type="button" onClick={()=>remove(slug)} aria-label={'Убрать '+getProjectComparison(slug).name+' из сравнения'}>{getProjectComparison(slug).name} ×</button>)}</div><div className="mh-comparison-tray-actions"><button ref={trigger} data-compare-open className="mh-comparison-primary" type="button" disabled={selected.length<2} onClick={show}>Сравнить ({selected.length}/4)</button><button type="button" onClick={()=>{setSelected([]);setOpen(false);setMessage('');}}>Очистить</button>{selected.length===1&&<span>Выберите ещё один проект</span>}</div><p role="status" className="mh-comparison-tray-message">{message}</p></aside>}

 </div>;
}
