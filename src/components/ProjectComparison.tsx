'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {comparisonMoney,getProjectComparison} from '@/lib/project-comparison';
export function ProjectComparison({slugs,onRemove,onClose}:{slugs:string[];onRemove:(slug:string)=>void;onClose:()=>void}){
 const close=useRef<HTMLButtonElement>(null);useEffect(()=>{close.current?.focus()},[]);
 const projects=slugs.map(getProjectComparison);
 const rows:[string,(p:ReturnType<typeof getProjectComparison>)=>string][]=[
 ['Локация',p=>p.area],['Девелопер',p=>p.developer],['Класс',p=>p.className],
 ['Цена выбранного примера',p=>p.price?`${comparisonMoney(p.price/1e6)} млн ₽\n${p.priceLabel}\n${p.priceDetail}\nДанные: ${p.priceDate}`:p.priceDetail],
 ['Цена метра примера',p=>p.perM2?comparisonMoney(p.perM2)+' ₽/м²':'Не опубликована'],
 ['Медиана предложений',p=>p.median?`${comparisonMoney(p.median)} ₽/м²\nАрхив ${p.medianDate}`:'Нет сопоставимой выборки'],
 ['Объём данных',p=>p.coverage],['Срок',p=>p.term],['Рост цены',p=>p.growth],['Вывод MAINHALL',p=>p.verdict],['Проверить перед покупкой',p=>p.risk],
 ];
 return <section data-project-comparison className="mh-comparison" aria-label="Сравнение выбранных проектов" onKeyDown={e=>{if(e.key==='Escape')onClose()}}>
  <div className="mh-comparison-heading"><div><p className="mh-eyebrow">СРАВНЕНИЕ НА ОДНОМ ЭКРАНЕ</p><h2>Цифры и условия рядом</h2></div><button ref={close} type="button" onClick={onClose}>Закрыть сравнение</button></div>
  <p className="mh-comparison-disclaimer">Цены относятся к разным лотам и датам. Сравнивайте площадь и условия оплаты. Архивные предложения и ценовые записи не подтверждают наличие сегодня. Рост цены до расходов не равен доходности инвестора.</p>
  <div className="mh-comparison-scroll" role="region" aria-label="Таблица сравнения. На узком экране прокручивается горизонтально" tabIndex={0}>
   <table><thead><tr><th scope="col">Показатель</th>{projects.map(p=><th scope="col" key={p.slug}><Link href={'/projects/'+p.slug+'/'}>{p.name} ↗</Link><button type="button" onClick={()=>onRemove(p.slug)} aria-label={'Убрать '+p.name+' из сравнения'}>Убрать ×</button></th>)}</tr></thead><tbody>{rows.map(([label,value])=><tr key={label}><th scope="row">{label}</th>{projects.map(p=><td key={p.slug}>{value(p)}</td>)}</tr>)}</tbody></table>
  </div>
 </section>;
}
