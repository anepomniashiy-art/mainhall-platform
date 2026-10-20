"use client";
import {useState} from "react";
import {COMPANY} from "@/lib/constants";
const money=(n:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(n)+" ₽";
export function InstallmentCalculator(){
 const [price,setPrice]=useState(30);const [down,setDown]=useState(20);const [months,setMonths]=useState(24);const [monthly,setMonthly]=useState(100);
 const total=price*1e6, first=total*down/100, paid=Math.min(total,first+monthly*1000*months), final=Math.max(0,total-paid);
return ( <section id="payments" className="mh-calculator mh-pad">
  <div><p className="mh-eyebrow">ПОСЧИТАЙТЕ СВОЙ ГРАФИК</p><h2>Сколько денег<br/><span>потребует покупка?</span></h2><p>Измените параметры и посмотрите, какой остаток придётся закрыть в конце. Это арифметическая модель равных платежей. Она не прогнозирует рост цены и доходность.</p></div>
  <div className="mh-calculator-controls">{[["Стоимость, млн ₽",price,setPrice,5,150,1],["Первый взнос, %",down,setDown,5,100,5],["Срок, месяцев",months,setMonths,6,48,1],["В месяц, тыс. ₽",monthly,setMonthly,0,500,10]].map(([label,value,set,min,max,step])=><label key={String(label)}><span>{String(label)}<strong>{String(value)}</strong></span><input type="range" aria-label={String(label)} min={Number(min)} max={Number(max)} step={Number(step)} value={Number(value)} onChange={e=>(set as (n:number)=>void)(Number(e.target.value))}/></label>)}<div className="mh-calculator-results" aria-live="polite"><div><span>Первый взнос</span><strong>{money(first)}</strong></div><div><span>Вложено за {months} мес.</span><strong>{money(paid)}</strong></div><div className="mh-calculator-final"><span>Остаток в конце</span><strong>{money(final)}</strong></div></div><a href={COMPANY.whatsapp+"?text="+encodeURIComponent("Хочу подобрать проект: бюджет "+price+" млн ₽, первый взнос "+down+"%, "+monthly+" тыс. ₽/мес. на "+months+" месяцев.")} target="_blank" rel="noopener noreferrer" className="mh-text-link">Найти проекты под этот график ↗</a></div>
 </section>);
}
