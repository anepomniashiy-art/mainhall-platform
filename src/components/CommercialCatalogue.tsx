'use client';
import '@/app/commercial/commercial.css';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import {categoryNames,rub,type SminexUnit} from '@/lib/sminex-catalogue-client';
type CardUnit=SminexUnit&{detailPath?:string;fetchedAt?:string;sourceLabel?:string;developer?:string;district?:string};
export function CommercialCatalogue({units,residential=false}:{units:CardUnit[];residential?:boolean}){
 const [category,setCategory]=useState(''),[project,setProject]=useState(''),[price,setPrice]=useState(''),[area,setArea]=useState('');
 const [rooms,setRooms]=useState(''),[developer,setDeveloper]=useState(''),[district,setDistrict]=useState(''),[limit,setLimit]=useState(24);
 const matching=useMemo(()=>units.filter(u=>(!category||u.category===category)&&(!project||u.projectSlug===project)&&(!price||(u.priceRub!==null&&u.priceRub<=Number(price)*1e6))&&(!area||(u.areaSqm!==null&&u.areaSqm>=Number(area)))&&(!developer||u.developer===developer)&&(!district||u.district===district)&&(!rooms||(rooms==='studio'?u.isStudio===true:u.isStudio!==true&&u.rooms===Number(rooms)))),[units,category,project,price,area,rooms,developer,district]);
 const developers=[...new Set(units.map(u=>u.developer).filter((x):x is string=>Boolean(x)))].sort();
 const districts=[...new Set(units.map(u=>u.district).filter((x):x is string=>Boolean(x)))].sort();
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
   <button className="mh-text-link" onClick={()=>{setCategory('');setProject('');setPrice('');setArea('');setRooms('');setDeveloper('');setDistrict('');setLimit(24);}}>Сбросить</button>
  </div>
  <p role="status">Найдено {matching.length} из {units.length} предложений.</p>
  <div className="mh-commercial-grid">{matching.slice(0,limit).map(u=><Link className="mh-commercial-card" key={u.id} href={u.detailPath||(residential?'/units/':'/commercial/')+u.sourceId+'/'}>
   <div className="mh-commercial-photo">{(u.planImageUrl||u.images[0]?.url)?<img src={u.planImageUrl||u.images[0].url} alt={'Планировка: '+(categoryNames[u.category]||'помещение')+' в '+u.projectName} width="700" height="500" loading="lazy"/>:<span>Изображение не предоставлено</span>}</div>
   <p className="mh-eyebrow">{residential?(u.isStudio?'Студия':u.rooms?u.rooms+'-комнатная квартира':categoryNames[u.category]||'Квартира'):categoryNames[u.category]||'Помещение'} · {u.projectName}</p>
   <h2>{u.areaSqm} м²</h2><strong>{rub(u.priceRub)}</strong>
   <p>{u.pricePerSqm!==null?rub(u.pricePerSqm)+'/м²':''}{u.floor!==null?' · Этаж '+u.floor:''}</p>
   {u.fetchedAt&&<p className="mh-content-caption">Проверено {new Date(u.fetchedAt).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})}</p>}
   <span className="mh-text-link">Планировка и условия ↗</span>
  </Link>)}</div>
  {!matching.length&&<p>По выбранным параметрам предложений нет. Измените фильтры или обратитесь в MAINHALL за подбором.</p>}
  {matching.length>limit&&<button className="mh-pill" onClick={()=>setLimit(limit+24)}>Показать ещё</button>}
 </>;
}
