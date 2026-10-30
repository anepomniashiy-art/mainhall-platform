import Link from "next/link";
import {researchBySlug,researchMethodology} from "@/lib/research-projects";
const number=(value:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:1}).format(value);
const signed=(value:number)=>`${value>0?"+":""}${number(value)}%`;
export function ResearchProjectAnalysis({slug}:{slug:string}){
 const p=researchBySlug(slug);if(!p)return null;
 const metrics=[
  ["Ценовой ориентир",`${number(p.priceThousandPerSqm)} тыс. ₽/м²`],
  ["К цене района",signed(p.districtPriceDifferencePercent)],
  ...(p.score===null?[]:[["Оценка MAINHALL",`${number(p.score/10)} / 10`]]),
  ...(p.maximumAdvertisedDiscountPercent===null?[]:[["Скидка в срезе",`до ${number(p.maximumAdvertisedDiscountPercent)}%`]]),
 ];
 const conclusion=p.districtPriceDifferencePercent<0
  ? `Ценовой ориентир ${p.name} ниже районного на ${number(Math.abs(p.districtPriceDifferencePercent))}%. Для отбора квартиры сравниваем этот разрыв с разницей в сроках, отделке и условиях оплаты.`
  : p.districtPriceDifferencePercent===0
   ? `Ценовой ориентир ${p.name} соответствует районному. При выборе решают условия конкретной квартиры: планировка, вид, срок передачи и полная сумма покупки.`
   : `Ценовой ориентир ${p.name} выше районного на ${number(p.districtPriceDifferencePercent)}%. Проверяем, оправдывают ли доплату расположение квартиры, её характеристики и условия покупки.`;
 return <section className="mh-dossier-section" aria-labelledby="research-analysis-title">
  <p className="mh-eyebrow">MAINHALL / ЦЕНА И ОТБОР</p>
  <h2 id="research-analysis-title">Позиция проекта на рынке</h2>
  <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:1,background:"#d7ddd5",border:"1px solid #d7ddd5",margin:"1.5rem 0"}}>
   {metrics.map(([label,value])=><div key={label} style={{background:"#f1f2ec",padding:"1.2rem"}}><dt style={{fontSize:".8rem",color:"#606b61"}}>{label}</dt><dd style={{fontSize:"clamp(1.4rem,2.2vw,2rem)",lineHeight:1.25,margin:".6rem 0 0"}}>{value}</dd></div>)}
  </dl>
  <p>{conclusion}</p>
  <p className="mh-content-caption">{p.priceReference}. Актуальные условия уточняем для выбранной квартиры.</p>
  <details style={{margin:"1.4rem 0",borderTop:"1px solid #d7ddd5",borderBottom:"1px solid #d7ddd5",padding:"1rem 0"}}>
   <summary style={{cursor:"pointer",fontSize:".9rem"}}>Источники и состав оценки</summary>
   <div style={{paddingTop:"1rem",fontSize:".9rem",lineHeight:1.65}}>
    <p>{researchMethodology} Оценка по шкале 10 получена делением исходного балла на 10; она не является прогнозом доходности.</p>
    <dl style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.3fr)",gap:".7rem 1rem"}}>
     <dt>Дата и выборка</dt><dd style={{margin:0,textAlign:"right"}}>{p.priceReference}</dd>
     {p.listings!==null&&<><dt>Лотов в выборке</dt><dd style={{margin:0}}>{number(p.listings)}</dd></>}
     {p.equityContractsSixMonths!==null&&<><dt>ДДУ за шесть месяцев</dt><dd style={{margin:0}}>{number(p.equityContractsSixMonths)}</dd></>}
     {p.olderThan180DaysPercent!==null&&<><dt>Лотов в прайсе более 180 дней</dt><dd style={{margin:0}}>{number(p.olderThan180DaysPercent)}%</dd></>}
     {p.askingPriceChangeSinceListingPercent!==null&&<><dt>Изменение прайса с появления лота</dt><dd style={{margin:0}}>{signed(p.askingPriceChangeSinceListingPercent)}</dd></>}
    </dl>
    <p>Скидка может относиться к отдельному пулу и способу оплаты. Прайс не равен цене сделки; число лотов в выборке не подтверждает сегодняшнее наличие. История изменения цены не задаёт будущий рост.</p>
    <a href={p.source} target="_blank" rel="noopener noreferrer">Источник исследования ↗</a>
   </div>
  </details>
  <Link className="mh-text-link" href="/contacts/">Обсудить покупку с MAINHALL ↗</Link>
 </section>;
}
