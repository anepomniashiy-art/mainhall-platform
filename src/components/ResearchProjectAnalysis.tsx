import Link from "next/link";
import {researchBySlug} from "@/lib/research-projects";
const number=(value:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:1}).format(value);
const signed=(value:number)=>`${value>0?"+":""}${number(value)}%`;
export function ResearchProjectAnalysis({slug}:{slug:string}){
 const p=researchBySlug(slug);if(!p)return null;
 const metrics=[
  ["Ценовой ориентир",`${number(p.priceThousandPerSqm)} тыс. ₽/м²`],
  ["К цене района",signed(p.districtPriceDifferencePercent)],
  ...(p.score===null?[]:[["Инвестрейтинг MAINHALL",`${number(p.score/10)} / 10`]]),
  ...(p.maximumAdvertisedDiscountPercent===null?[]:[["Размер скидки",`до ${number(p.maximumAdvertisedDiscountPercent)}%`]]),
 ];
 const conclusion=p.districtPriceDifferencePercent<0
  ? `Ценовой ориентир ${p.name} ниже районного на ${number(Math.abs(p.districtPriceDifferencePercent))}%. Для отбора квартиры сравниваем этот разрыв с разницей в сроках, отделке и условиях оплаты.`
  : p.districtPriceDifferencePercent===0
   ? `Ценовой ориентир ${p.name} соответствует районному. При выборе решают условия конкретной квартиры: планировка, вид, срок передачи и полная сумма покупки.`
   : `Ценовой ориентир ${p.name} выше районного на ${number(p.districtPriceDifferencePercent)}%. Проверяем, оправдывают ли доплату расположение квартиры, её характеристики и условия покупки.`;
 return <section className="mh-dossier-section" aria-labelledby="research-analysis-title">
  <p className="mh-eyebrow">MAINHALL / ЦЕНА И ОТБОР</p>
  <h2 id="research-analysis-title">Позиция проекта на рынке</h2><Link href="/investment-rating/" className="mh-text-link">Как устроен инвестиционный рейтинг ↗</Link>
  <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:1,background:"#d7ddd5",border:"1px solid #d7ddd5",margin:"1.5rem 0"}}>
   {metrics.map(([label,value])=><div key={label} style={{background:"#f1f2ec",padding:"1.2rem"}}><dt style={{fontSize:".8rem",color:"#606b61"}}>{label}</dt><dd style={{fontSize:"clamp(1.4rem,2.2vw,2rem)",lineHeight:1.25,margin:".6rem 0 0"}}>{value}</dd></div>)}
  </dl>
  <p>{conclusion}</p>
  <p className="mh-content-caption">Актуальные условия уточняем для выбранной квартиры.</p>
  <details style={{margin:"1.4rem 0",borderTop:"1px solid #d7ddd5",borderBottom:"1px solid #d7ddd5",padding:"1rem 0"}}>
   <summary style={{cursor:"pointer",fontSize:".9rem"}}>Из чего складывается оценка</summary>
   <div style={{paddingTop:"1rem",fontSize:".9rem",lineHeight:1.65}}>
    <p>Инвестиционный рейтинг MAINHALL показывает рыночную позицию проекта по шкале от 0 до 10. Мы учитываем цену метра относительно района, темп продаж, скидки, срок до ввода дома и динамику цены. <Link href="/investment-rating/" className="mh-text-link">Подробнее о методике ↗</Link></p>
    <dl style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.3fr)",gap:".7rem 1rem"}}>
     {p.listings!==null&&<><dt>Квартир в продаже</dt><dd style={{margin:0}}>{number(p.listings)}</dd></>}
     {p.equityContractsSixMonths!==null&&<><dt>Сделок за шесть месяцев</dt><dd style={{margin:0}}>{number(p.equityContractsSixMonths)}</dd></>}
     {p.olderThan180DaysPercent!==null&&<><dt>В продаже более 180 дней</dt><dd style={{margin:0}}>{number(p.olderThan180DaysPercent)}%</dd></>}
     {p.askingPriceChangeSinceListingPercent!==null&&<><dt>Изменение цены с начала продажи</dt><dd style={{margin:0}}>{signed(p.askingPriceChangeSinceListingPercent)}</dd></>}
    </dl>
    <p>Скидка может относиться к отдельному пулу и способу оплаты. Перед покупкой уточняем наличие квартиры, цену и условия скидки.</p>
   </div>
  </details>
  <Link className="mh-text-link" href="/contacts/">Обсудить покупку с MAINHALL ↗</Link>
 </section>;
}
