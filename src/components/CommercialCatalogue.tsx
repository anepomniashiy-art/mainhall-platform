'use client';
import '@/app/commercial/commercial.css';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import {categoryNames,rub,type SminexUnit} from '@/lib/sminex-catalogue-client';
type CardUnit=SminexUnit&{detailPath?:string;fetchedAt?:string;sourceLabel?:string;developer?:string;district?:string};
type ProjectCard = {href:string;cover?:{src:string;caption:string}};

function ResidentialProjectResults({units,project}:{units:CardUnit[];project?:ProjectCard}){
 const [visible,setVisible]=useState(3);
 const first=units[0];
 const prices=units.flatMap(u=>u.priceRub===null?[]:[u.priceRub]);
 const district=first.district||first.developer;
 return <article className="mh-commercial-card mh-project-result">
  <div className="mh-commercial-photo mh-commercial-photo--project">
   {project?.cover?<Link href={project.href} aria-label={"О проекте "+first.projectName}><img src={project.cover.src} alt={project.cover.caption} width="700" height="500" loading="lazy"/></Link>:<span>{first.projectName}</span>}
  </div>
  <div className="mh-project-result-body">
  <strong className="mh-project-result-price">{prices.length>0?'от '+rub(Math.min(...prices)):'Цена по запросу'}</strong>
  <h2>{project?<Link href={project.href}>{first.projectName}</Link>:first.projectName}</h2>
  <p className="mh-project-result-location">{district}{first.developer&&first.developer!==district?" · "+first.developer:""}</p>
  <p className="mh-project-result-count">Подходящих предложений: {units.length}</p>
  <ul className="mh-unit-matches">
   {units.slice(0,visible).map(u=><li key={u.id}>
    <Link href={u.detailPath||'/units/'+u.sourceId+'/'}>
     <span>{u.isApartments?'Апартаменты':u.isStudio?'Студия':u.rooms?u.rooms+'-комн.':u.category==='house'?'Дом':'Квартира'} · {u.areaSqm} м²{u.floor!==null?' · этаж '+u.floor:''}</span>
     <strong>{u.priceIsFrom?'от ':''}{rub(u.priceRub)} <span aria-hidden="true">↗</span></strong>
    </Link>
   </li>)}
  </ul>
  <div className="mh-project-result-actions">
  {units.length>visible&&<button type="button" className="mh-text-link" onClick={()=>setVisible(visible+12)}>Ещё квартиры в этом ЖК</button>}
  {project&&<Link className="mh-text-link" href={project.href}>О жилом комплексе ↗</Link>}
  </div>
  </div>
 </article>;
}

export function CommercialCatalogue({units,residential=false,groupByProject=residential,projects={}}:{units:CardUnit[];residential?:boolean;groupByProject?:boolean;projects?:Record<string,ProjectCard>}){
 const [category,setCategory]=useState(''),[project,setProject]=useState(''),[price,setPrice]=useState(''),[area,setArea]=useState('');
 const [areaMax,setAreaMax]=useState(''),[sqmPrice,setSqmPrice]=useState(''),[finish,setFinish]=useState(''),[delivery,setDelivery]=useState(''),[sort,setSort]=useState('default'),[format,setFormat]=useState('');
 const [rooms,setRooms]=useState(''),[developer,setDeveloper]=useState(''),[district,setDistrict]=useState(''),[limit,setLimit]=useState(24);
 const matching=useMemo(()=>units.filter(u=>(!category||u.category===category)&&(!project||u.projectSlug===project)&&(!price||(u.priceRub!==null&&u.priceRub<=Number(price)*1e6))&&(!area||(u.areaSqm!==null&&u.areaSqm>=Number(area)))&&(!developer||u.developer===developer)&&(!district||u.district===district)&&(!rooms||(rooms==='studio'?u.isStudio===true:u.isStudio!==true&&u.rooms===Number(rooms)))&&(!areaMax||(u.areaSqm!==null&&u.areaSqm<=Number(areaMax)))&&(!sqmPrice||(u.pricePerSqm!==null&&u.pricePerSqm<=Number(sqmPrice)*1000))&&(!format||(format==='apartments'?u.isApartments===true:format==='house'?u.category==='house':u.isApartments!==true&&u.category!=='house'))&&(!finish||u.finishRaw===finish)&&(!delivery||(delivery==='built'?['built','hand-over'].includes(u.buildingStateRaw||''):u.deliveryYear===Number(delivery)))).sort((a,b)=>sort==='price'?(a.priceRub??Infinity)-(b.priceRub??Infinity):sort==='sqm'?(a.pricePerSqm??Infinity)-(b.pricePerSqm??Infinity):sort==='area'?(a.areaSqm??Infinity)-(b.areaSqm??Infinity):0),[units,category,project,price,area,rooms,developer,district,areaMax,sqmPrice,finish,delivery,sort,format]);
 const matchingProjects=useMemo(()=>{
  const groups=new Map<string,CardUnit[]>();
  if(groupByProject)for(const unit of matching){
   const group=groups.get(unit.projectSlug);
   if(group)group.push(unit);
   else groups.set(unit.projectSlug,[unit]);
  }
  for(const group of groups.values())group.sort((a,b)=>(a.priceRub??Infinity)-(b.priceRub??Infinity));
  return [...groups.entries()];
 },[matching,groupByProject]);
 const developers=[...new Set(units.map(u=>u.developer).filter((x):x is string=>Boolean(x)))].sort();
 const districts=[...new Set(units.map(u=>u.district).filter((x):x is string=>Boolean(x)))].sort();
 const finishes=[...new Set(units.map(u=>u.finishRaw).filter((x):x is string=>Boolean(x)))].sort();
 const years=[...new Set(units.map(u=>u.deliveryYear).filter((x):x is number=>Boolean(x)))].sort((a,b)=>a-b);
 const finishNames:Record<string,string>={'ТребуетРемонта':'Требует ремонта','БезОтделки':'Без отделки','Чистовая':'Чистовая отделка','ПодЧистовую':'Под чистовую отделку'};
 const roomCounts=[...new Set(units.filter(u=>!u.isStudio&&u.rooms!=null&&u.rooms>0).map(u=>u.rooms as number))].sort((a,b)=>a-b);
 return <>
  <div className="mh-commercial-filters">
   <label>Тип недвижимости<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(24);}}><option value="">Все типы</option>{[...new Set(units.map(u=>u.category))].map(x=><option key={x} value={x}>{categoryNames[x]||x}</option>)}</select></label>
   <label>Жилой комплекс<select value={project} onChange={e=>{setProject(e.target.value);setLimit(24);}}><option value="">Все проекты</option>{[...new Map(units.map(u=>[u.projectSlug,u.projectName])).entries()].map(([slug,name])=><option key={slug} value={slug}>{name}</option>)}</select></label>
   {residential&&developers.length>0&&<label>Застройщик<select value={developer} onChange={e=>{setDeveloper(e.target.value);setLimit(24);}}><option value="">Все застройщики</option>{developers.map(x=><option key={x}>{x}</option>)}</select></label>}
   {residential&&districts.length>0&&<label>Район<select value={district} onChange={e=>{setDistrict(e.target.value);setLimit(24);}}><option value="">Все районы</option>{districts.map(x=><option key={x}>{x}</option>)}</select></label>}
   {residential&&roomCounts.length>0&&<label>Комнат<select value={rooms} onChange={e=>{setRooms(e.target.value);setLimit(24);}}><option value="">Любая планировка</option>{units.some(u=>u.isStudio)&&<option value="studio">Студия</option>}{roomCounts.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
   <label>Цена до, млн ₽<input type="number" min="0" value={price} onChange={e=>{setPrice(e.target.value);setLimit(24);}} placeholder="Без ограничения"/></label>
   <label>Площадь от, м²<input type="number" min="0" value={area} onChange={e=>{setArea(e.target.value);setLimit(24);}} placeholder="Любая"/></label>
   <button className="mh-text-link" onClick={()=>{setCategory('');setProject('');setPrice('');setArea('');setRooms('');setDeveloper('');setDistrict('');setAreaMax('');setSqmPrice('');setFinish('');setDelivery('');setSort('default');setFormat('');setLimit(24);}}>Сбросить</button>
  </div>
  <details className="mh-catalogue-advanced"><summary>Дополнительные параметры</summary><div className="mh-commercial-filters">
   {residential&&<label>Формат<select value={format} onChange={e=>{setFormat(e.target.value);setLimit(24);}}><option value="">Любой формат</option><option value="flat">Квартиры</option><option value="apartments">Апартаменты</option><option value="house">Дома</option></select></label>}
   <label>Площадь до, м²<input type="number" min="0" value={areaMax} onChange={e=>{setAreaMax(e.target.value);setLimit(24);}} placeholder="Без ограничения"/></label>
   <label>Цена метра до, тыс. ₽<input type="number" min="0" value={sqmPrice} onChange={e=>{setSqmPrice(e.target.value);setLimit(24);}} placeholder="Без ограничения"/></label>
   {finishes.length>0&&<label>Отделка<select value={finish} onChange={e=>{setFinish(e.target.value);setLimit(24);}}><option value="">Любая отделка</option>{finishes.map(x=><option key={x} value={x}>{finishNames[x]||x}</option>)}</select></label>}
   {years.length>0&&<label>Срок сдачи<select value={delivery} onChange={e=>{setDelivery(e.target.value);setLimit(24);}}><option value="">Любой срок</option><option value="built">Построен / передача</option>{years.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
  </div></details>
  <label className="mh-catalogue-sort">Сортировка<select value={sort} onChange={e=>{setSort(e.target.value);setLimit(24);}}><option value="default">По проектам</option><option value="price">Сначала дешевле</option><option value="sqm">По цене метра</option><option value="area">По площади</option></select></label>
  <p role="status">{groupByProject?<>Найдено квартир: {matching.length} · ЖК: {matchingProjects.length}</>:<>Найдено {matching.length} из {units.length} предложений.</>}</p>
  <div className="mh-commercial-grid">{groupByProject?matchingProjects.slice(0,limit).map(([slug,group])=><ResidentialProjectResults key={slug} units={group} project={projects[slug]}/>):matching.slice(0,limit).map(u=><Link className="mh-commercial-card" data-market-unit={residential?u.id:undefined} key={u.id} href={u.detailPath||(residential?'/units/':'/commercial/')+u.sourceId+'/'}>
   {residential?<div className="mh-commercial-photo mh-commercial-photo--project">
    {projects[u.projectSlug]?.cover?<img src={projects[u.projectSlug].cover!.src} alt={projects[u.projectSlug].cover!.caption} width="700" height="500" loading="lazy"/>:<span>Фото готовится</span>}
   </div>:<div className="mh-commercial-photo">{(u.planImageUrl||u.images[0]?.url)?<img src={u.planImageUrl||u.images[0].url} alt={'Планировка: '+(categoryNames[u.category]||'помещение')+' в '+u.projectName} width="700" height="500" loading="lazy"/>:<span>Изображение не предоставлено</span>}</div>}
   <p className="mh-eyebrow">{u.isApartments?'Апартаменты':categoryNames[u.category]||'Помещение'} · {u.projectName}</p>
   <h2>{u.areaSqm} м²</h2><strong>{u.priceIsFrom?'от ':''}{rub(u.priceRub)}</strong>
   <p>{u.pricePerSqm!==null?rub(u.pricePerSqm)+'/м²':''}{u.floor!==null?' · Этаж '+u.floor:''}</p>
   {u.fetchedAt&&<p className="mh-content-caption">Проверено {new Date(u.fetchedAt).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})}</p>}
   <span className="mh-text-link">Планировка и условия ↗</span>
  </Link>)}</div>
  {!matching.length&&<p>По выбранным параметрам предложений нет. Измените фильтры или обратитесь в MAINHALL за подбором.</p>}
  {(groupByProject?matchingProjects.length:matching.length)>limit&&<button className="mh-pill" onClick={()=>setLimit(limit+24)}>Показать ещё</button>}
 </>;
}
