import Link from "next/link";
import {ratingBySlug,ratingMeta,criterionNames,ruDate,type ProjectRating,type RatingCriterion} from "@/lib/investment-rating";

const num=(value:number,digits=0)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
const plural=(n:number,one:string,few:string,many:string)=>{const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>1&&b<5?few:many;};
const quarter=(iso:string)=>{const [y,m]=iso.split("-").map(Number);return `${["I","II","III","IV"][Math.floor((m-1)/3)]} квартал ${y} года`;};
const order:RatingCriterion[]=["price","location","liquidity","timing","rent"];

function facts(key:RatingCriterion,r:ProjectRating):string[]{
 if(key==="price"&&r.price){const p=r.price,d=Math.abs(p.diffPercent);
  return [
   `${num(p.pricePerSqm/1000)} тыс. ₽/м²: медиана по зарегистрированным договорам за ${p.windowMonths===6?"шесть":"двенадцать"} месяцев (${num(p.deals)} ${plural(p.deals,"договор","договора","договоров")}).`,
   d<1?`Цена на уровне сопоставимых домов рядом (${p.comparables} ${plural(p.comparables,"проект","проекта","проектов")}).`:`Это на ${num(d)}% ${p.diffPercent<0?"ниже":"выше"} сопоставимых домов рядом: ${p.comparables} ${plural(p.comparables,"проект","проекта","проектов")} того же класса${p.radiusKm?` в радиусе ${p.radiusKm} км`:" в районе"}, квартиры той же площади${p.sameFinish===false?"":" и отделки"}.`,
   ...(p.finish?[`Отделка в договорах: ${p.finish.toLowerCase()}.`]:[]),
   ...(p.sameFinish===false?["У части сопоставимых домов другая отделка, поэтому разница в цене приблизительная."]:[]),
   ...(p.capped?["Балл ограничен: цена ниже соседей при медленных продажах или высокой доле опта."]:[]),
   ...(p.penalty>0?["Балл снижен за удалённость от метро или нехватку школ, садов и парка рядом."]:[]),
  ];}
 if(key==="location"&&r.location){const l=r.location;
  return [
   l.minutes===null?"Время до метро уточняем.":l.estimated?`Около ${num(l.minutes)} ${plural(Math.round(l.minutes),"минуты","минут","минут")} пешком до станции «${l.metro}» (расчёт по расстоянию).`:l.onFoot?`${num(l.minutes)} ${plural(Math.round(l.minutes),"минута","минуты","минут")} пешком до станции «${l.metro}».`:`До станции «${l.metro}» ${num(l.minutes)} ${plural(Math.round(l.minutes),"минута","минуты","минут")} на транспорте.`,
   `В радиусе километра: школ ${l.schools}, детских садов ${l.kindergartens}, поликлиник и медцентров ${l.clinics}. Магазинов в 800 метрах: ${l.shops}.`,
   ...(l.parkMeters===null?[]:[l.parkMeters<75?"Парк рядом с домом.":`Ближайший парк в ${num(Math.round(l.parkMeters/50)*50)} метрах.`]),
   ...(l.futureStation?[`Рядом строится станция «${l.futureStation.name}»${l.futureStation.year?`, срок по адресной программе города: ${l.futureStation.year} год`:""}.`]:[]),
  ];}
 if(key==="liquidity"&&r.liquidity){const q=r.liquidity;
  return [
   `В строящихся корпусах без договора ${num(q.stock)} ${plural(q.stock,"квартира","квартиры","квартир")}.`,
   `За шесть месяцев зарегистрировано ${num(q.dealsSixMonths)} ${plural(q.dealsSixMonths,"договор","договора","договоров")} с частными покупателями. При таком темпе остатка хватит на ${num(q.monthsOfStock)} ${plural(Math.round(q.monthsOfStock),"месяц","месяца","месяцев")}.`,
   ...(q.adjusted?["Продажи идут меньше года, поэтому темп скорректирован по соседним проектам того же класса."]:[]),
   ...(q.wholesalePercent>=1?[`Оптовые сделки: ${num(q.wholesalePercent)}% договоров.`]:[]),
   ...(q.exposureDays!==null?[`Квартира до сделки стоит в продаже ${num(q.exposureDays)} ${plural(Math.round(q.exposureDays),"день","дня","дней")} (медиана).`]:[]),
   ...(q.assignments>0?[`Переуступок за шесть месяцев: ${num(q.assignments)}.`]:[]),
  ];}
 if(key==="timing"&&r.timing){const t=r.timing;
  if(t.completed||!t.plannedDate)return ["Все корпуса проекта введены в эксплуатацию: срок сдачи уже не сдвинется."];
  const history=t.developerBuildings?`Девелопер с 2017 года сдал ${t.developerBuildings} ${plural(t.developerBuildings,"корпус","корпуса","корпусов")}: ${(t.developerMedianShift as number)<=0?((t.developerMedianShift as number)<=-0.5?`обычно на ${num(Math.abs(t.developerMedianShift as number),1)} мес. раньше первого заявленного срока`:"обычно в первый заявленный срок"):`медианный перенос срока ${num(t.developerMedianShift as number,1)} мес.`}, в срок или с переносом до трёх месяцев ${num(t.developerOnTimePercent as number)}%.`:"У девелопера пока нет сданных корпусов для сравнения сроков.";
  return [
   `Плановый ввод корпусов с непроданными квартирами: ${quarter(t.plannedDate)}.`,
   t.projectShiftMonths===null?"Историю сроков по проекту уточняем.":t.projectShiftMonths<1?"С начала продаж заявленный срок ввода не переносился.":`С начала продаж заявленный срок ввода перенесён на ${num(t.projectShiftMonths)} ${plural(Math.round(t.projectShiftMonths),"месяц","месяца","месяцев")}.`,
   history,
  ];}
 if(key==="rent"&&r.rent){const a=r.rent;
  return [
   `Аренда рядом: ${num(a.rentPerSqm)} ₽/м² в месяц (${a.rooms}, ${num(a.listings)} ${plural(a.listings,"объявление","объявления","объявлений")} в радиусе ${num(a.radiusKm,a.radiusKm%1?1:0)} км).`,
   `Валовая доходность к цене покупки: ${num(a.grossYield,1)}% годовых. После месяца простоя, расходов 5% и налога 13%: около ${num(a.netYield,1)}%.`,
  ];}
 return [];
}

export function InvestmentRating({slug}:{slug:string}){
 const r=ratingBySlug(slug); if(!r)return null;
 const ready=order.filter(k=>r[k]);
 if(!r.published&&ready.length===0)return null;
 const best=r.published?[...ready].sort((a,b)=>(r[b]!.score)-(r[a]!.score)):[];
 const split=r.missing.map(text=>{const at=text.indexOf(": ");return at>0&&at<10?{gap:`${text.slice(0,at)} (${text.slice(at+2)})`}:{note:text};});
 const gaps=split.flatMap(item=>item.gap?[item.gap]:[]),notes=split.flatMap(item=>item.note?[item.note]:[]);
 return <section className="mh-dossier-section" aria-labelledby="rating-title">
  <p className="mh-eyebrow">MAINHALL / ИНВЕСТИЦИОННАЯ ОЦЕНКА</p>
  <h2 id="rating-title">{r.published?`Оценка MAINHALL: ${num(r.score as number,1)} из 10`:"Оценка готовится"}</h2>
  {r.published
   ?<p>Сильная сторона: {criterionNames[best[0]].toLowerCase()} ({num(r[best[0]]!.score,1)}). Слабая: {criterionNames[best[best.length-1]].toLowerCase()} ({num(r[best[best.length-1]]!.score,1)}). Оценка относится к проекту в целом; конкретную квартиру сравниваем отдельно.</p>
   :<p>Собрано критериев: {ready.length} из 5. Балл опубликуем, когда будут все пять.{gaps.length>0?` Не хватает: ${gaps.join("; ")}.`:""}{notes.map(note=>` ${note.charAt(0).toUpperCase()}${note.slice(1)}.`).join("")}</p>}
  <div style={{display:"grid",gap:1,background:"#d7ddd5",border:"1px solid #d7ddd5",margin:"1.5rem 0"}}>
   {ready.map(key=><div key={key} style={{background:"#f1f2ec",padding:"1.1rem 1.2rem",display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:".4rem 1rem",alignItems:"baseline"}}>
    <h3 style={{margin:0,fontSize:"1.05rem"}}>{criterionNames[key]}</h3>
    <strong style={{fontSize:"1.35rem",whiteSpace:"nowrap"}}>{num(r[key]!.score,1)}<span style={{fontSize:".8rem",fontWeight:400,color:"#606b61"}}> из 10</span></strong>
    <div style={{gridColumn:"1 / -1",fontSize:".92rem",lineHeight:1.6,color:"#2f3a30"}}>{facts(key,r).map((text,i)=><p key={i} style={{margin:i?".3rem 0 0":0}}>{text}</p>)}</div>
   </div>)}
  </div>
  {r.flags.length>0&&<div style={{margin:"0 0 1.2rem"}}><p style={{margin:0,fontWeight:600}}>На что обратить внимание</p><ul style={{margin:".4rem 0 0",paddingLeft:"1.2rem",lineHeight:1.6,listStyle:"disc"}}>{r.flags.map(flag=><li key={flag}>{flag}</li>)}</ul></div>}
  <p className="mh-content-caption">Расчёт на {ruDate(ratingMeta.asOf)}. Договоры учтены по {ruDate(ratingMeta.dealsThrough)}.{r.published&&r.confidence?` Уверенность оценки: ${r.confidence==="high"?"высокая":r.confidence==="medium"?"средняя":"низкая"}.`:""} Оценка не является индивидуальной инвестиционной рекомендацией и не обещает доходность.</p>
  <Link className="mh-text-link" href="/investment-rating/">Как считается оценка ↗</Link>
 </section>;
}
