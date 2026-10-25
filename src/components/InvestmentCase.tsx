"use client";

import {useId, useState} from "react";
import "@/app/investment.css";

export type InvestmentProfile = {
 title: string;
 verdict: string;
 horizon: string;
 drivers: {title: string; mechanism: string; status: string; sourceUrl?: string}[];
 risks: string[];
 sources?: {name: string; url: string}[];
 historical?: {entry: number; area: number; ownCapital: number; debt: number; exit: number; downsideExit: number; exitCostPct: number; asOf: string; label: string};
};

const money = (value:number) => new Intl.NumberFormat("ru-RU", {maximumFractionDigits:2}).format(value);
const percent = (value:number) => `${value > 0 ? "+" : ""}${new Intl.NumberFormat("ru-RU", {maximumFractionDigits:1}).format(value)}%`;
const scenarios = [{name:"Снижение цены",growth:-10},{name:"Цена без изменений",growth:0},{name:"Умеренный рост",growth:10},{name:"Рост цены",growth:20}];

/** Amounts are in millions of RUB. This is sensitivity analysis, not a project forecast. */
export function calculateInvestmentScenario(entry:number, ownCapital:number, exitCostPct:number, years:number, otherCosts:number, growth:number) {
 const exit = entry * (1 + growth / 100);
 const saleCosts = exit * exitCostPct / 100;
 const debt = entry - ownCapital;
 const netSale = exit - saleCosts;
 const investedCapital = ownCapital + otherCosts;
 const profit = netSale - entry - otherCosts;
 return {exit, saleCosts, debt, profit, equityAfterExit:netSale-debt, investedCapital, roi:profit/investedCapital*100, annual:netSale-otherCosts>0?(Math.pow((netSale-otherCosts)/entry,1/years)-1)*100:null};
}

export function InvestmentCase({profile}:{profile:InvestmentProfile}) {
 const id=useId();
 const [entryText,setEntry]=useState("");
 const [capitalText,setCapital]=useState("");
 const [costText,setCost]=useState("4");
 const [yearsText,setYears]=useState("4");
 const [otherText,setOther]=useState("0");
 const parse=(v:string)=>Number(v.replace(",","."));
 const entry=parse(entryText), ownCapital=parse(capitalText), cost=parse(costText), years=parse(yearsText), other=parse(otherText);
 const started=entryText.trim()!=="" && capitalText.trim()!=="";
 const valid=started && [entry,ownCapital,cost,years,other].every(Number.isFinite) && entry>0 && ownCapital>0 && ownCapital<=entry && cost>=0 && cost<=100 && years>0 && other>=0 && costText.trim()!=="" && yearsText.trim()!=="" && otherText.trim()!=="";
 const hist=profile.historical;
 const historicalResults=hist?[hist.downsideExit,hist.exit].map(exit=>({exit,growth:(exit/hist.entry-1)*100,profit:exit*(1-hist.exitCostPct/100)-hist.entry,roi:(exit*(1-hist.exitCostPct/100)-hist.entry)/hist.ownCapital*100})):[];
 return <div className="mh-invest-case">
  <header className="mh-invest-heading"><p className="mh-invest-kicker">ИНВЕСТИЦИОННЫЙ РАЗБОР / MAINHALL</p><h2>{profile.title}</h2><p className="mh-invest-verdict">{profile.verdict}</p><p className="mh-invest-note">Редакция MAINHALL · 24 октября 2026. </p></header>
  <div className="mh-invest-metrics"><div><span>Горизонт анализа</span><strong>{profile.horizon}</strong></div><div><span>Основания для оценки</span><strong>{profile.drivers.length} {profile.drivers.length===1?"фактор":profile.drivers.length>1&&profile.drivers.length<5?"фактора":"факторов"}</strong></div><div><span>Формат расчёта</span><strong>{hist?"Есть архивный расчёт":"Сценарии покупки и продажи"}</strong></div></div>
  <div className="mh-invest-driver-heading"><h3>Что может повлиять на цену</h3><p>Оцениваем влияние транспорта, окружения и характеристик квартиры на спрос.</p></div>
  <div className="mh-invest-drivers">{profile.drivers.map((driver,index)=><article key={driver.title}><span className="mh-invest-driver-index">{String(index+1).padStart(2,"0")}</span><div><p className="mh-invest-status">{driver.status}</p><h4>{driver.title}</h4><p>{driver.mechanism}</p>{driver.sourceUrl&&<a className="mh-invest-source-link" href={driver.sourceUrl} target="_blank" rel="noopener noreferrer">Источник факта ↗</a>}</div></article>)}</div>
  <div className="mh-invest-risks"><h3>Что может изменить результат</h3><ul>{profile.risks.map(risk=><li key={risk}>{risk}</li>)}</ul></div>
  {hist&&<section className="mh-invest-archive" aria-labelledby={id+"-archive"}><p className="mh-invest-kicker">АРХИВНЫЙ СЦЕНАРИЙ</p><h3 id={id+"-archive"}>{hist.label}</h3><p>Условия исходного обзора: {hist.asOf}. Это историческая модель, цена и доступность квартиры сегодня не подтверждены.</p><dl className="mh-invest-archive-facts"><div><dt>Цена входа</dt><dd>{money(hist.entry)} млн ₽</dd></div><div><dt>Площадь</dt><dd>{money(hist.area)} м²</dd></div><div><dt>Собственный капитал</dt><dd>{money(hist.ownCapital)} млн ₽</dd></div><div><dt>Остаток платежей</dt><dd>{money(hist.debt)} млн ₽</dd></div></dl><div className="mh-invest-archive-scenarios">{historicalResults.map((result,index)=><article key={result.exit}><p>{index===0?"Пессимистичный сценарий отчёта":"Базовый сценарий отчёта"}</p><strong>{percent(result.growth)} <small>к цене входа</small></strong><dl><div><dt>Цена выхода</dt><dd>{money(result.exit)} млн ₽</dd></div><div><dt>Результат после расходов выхода</dt><dd>{money(result.profit)} млн ₽</dd></div><div><dt>Результат / собственный капитал</dt><dd>{percent(result.roi)}</dd></div></dl></article>)}</div><p className="mh-invest-note">В исходной модели расходы выхода составляют {money(hist.exitCostPct)}% цены продажи. Расчёт не учитывает неизвестные налоги, отделку, содержание и стоимость финансирования. Доходность на собственный капитал зависит от графика платежей; показанный процент не является годовой доходностью.</p></section>}
  <section className="mh-invest-calculator" aria-labelledby={id+"-calculator"}><div className="mh-invest-calculator-heading"><div><p className="mh-invest-kicker">ЧУВСТВИТЕЛЬНОСТЬ РЕЗУЛЬТАТА</p><h3 id={id+"-calculator"}>Сколько остаётся после продажи?</h3></div><p>Введите условия своего лота. Изменения цены ниже заданы для сравнения и не являются прогнозом MAINHALL для этого ЖК.</p></div>
   <div className="mh-invest-inputs">
    <label htmlFor={id+"-entry"}>Цена покупки, млн ₽<input id={id+"-entry"} type="text" inputMode="decimal" placeholder="Введите цену" value={entryText} onChange={e=>setEntry(e.target.value)}/></label>
    <label htmlFor={id+"-capital"}>Взнос в цену, млн ₽<input id={id+"-capital"} type="text" inputMode="decimal" placeholder="Сумма своих платежей за квартиру" value={capitalText} onChange={e=>setCapital(e.target.value)}/></label>
    <label htmlFor={id+"-years"}>Срок владения, лет<input id={id+"-years"} type="text" inputMode="decimal" value={yearsText} onChange={e=>setYears(e.target.value)}/></label>
    <label htmlFor={id+"-cost"}>Расходы продажи, %<input id={id+"-cost"} type="text" inputMode="decimal" value={costText} onChange={e=>setCost(e.target.value)}/></label>
    <label htmlFor={id+"-other"}>Прочие расходы, млн ₽<input id={id+"-other"} type="text" inputMode="decimal" value={otherText} onChange={e=>setOther(e.target.value)}/></label>
   </div>
   <p className="mh-invest-note">Начальные значения срока и расходов служат примером. Замените их своими условиями. В прочие расходы включите отделку, содержание, налоги и проценты. Считаем, что вы оплачиваете их своими деньгами сверх взноса в цену. Арендные поступления модель не учитывает.</p>
   {started&&!valid&&<p className="mh-invest-validation" role="alert">Проверьте числа: цена и капитал должны быть больше нуля, капитал не может превышать цену покупки. Расходы не могут быть отрицательными; расходы продажи допустимы от 0 до 100%, срок должен быть больше нуля.</p>}
   <div className="mh-invest-scenarios" aria-live="polite" aria-atomic="true">{scenarios.map(scenario=>{
    const result=valid?calculateInvestmentScenario(entry,ownCapital,cost,years,other,scenario.growth):null;
    return <article className={"mh-invest-scenario"+(result&&result.profit<0?" mh-invest-is-loss":"")} key={scenario.growth}><p>{scenario.name}</p><strong className="mh-invest-growth">{percent(scenario.growth)}</strong><span className="mh-invest-scenario-caption">Гипотеза изменения цены</span>{result?<><dl><div><dt>Цена продажи</dt><dd>{money(result.exit)} млн ₽</dd></div><div><dt>Остаток долга</dt><dd>{money(result.debt)} млн ₽</dd></div><div><dt>Выручка после продажи и погашения долга</dt><dd>{money(result.equityAfterExit)} млн ₽</dd></div><div className="mh-invest-result"><dt>Чистый результат</dt><dd>{money(result.profit)} млн ₽</dd></div><div><dt>Результат / все свои вложения</dt><dd>{percent(result.roi)}</dd></div><div><dt>В год на полную цену покупки*</dt><dd>{result.annual===null?"Не рассчитывается":percent(result.annual)}</dd></div></dl>{result.equityAfterExit<0&&<p className="mh-invest-loss-note">Суммы продажи не хватает для покрытия долга и расходов. Собственный капитал потерян полностью.</p>}</>:<p className="mh-invest-empty">Укажите цену покупки и собственный капитал, чтобы увидеть расчёт.</p>}</article>;
   })}</div>
   <details className="mh-invest-formula"><summary>Как устроен расчёт</summary><p>Цена продажи = цена покупки × (1 + изменение цены). Чистый результат = цена продажи − расходы продажи − прочие расходы − цена покупки. Результат на все свои вложения = чистый результат / (взнос в цену + прочие расходы).</p><p>Непогашенный остаток = цена покупки − собственный капитал. Капитал после выхода = цена продажи − расходы продажи − непогашенный остаток. Прочие расходы уже оплачены своими деньгами и включены в общий объём вложений. Если часть долга будет погашена раньше, включите эти платежи в свой капитал.</p><p>* Годовой темп на полную цену покупки = (выручка после всех указанных расходов / цена покупки) в степени 1 / срок владения, минус 1. Это расчёт для единого вложения в начале срока. График рассрочки здесь не задан, поэтому IRR и годовая доходность на собственный капитал не рассчитываются.</p></details>
  </section>
  {!!profile.sources?.length&&<div className="mh-invest-sources"><h3>Источники и основания</h3><ul>{profile.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></li>)}</ul></div>}
 <p className="mh-invest-note">Материал не является индивидуальной инвестиционной рекомендацией. Сценарии основаны на указанных допущениях и не гарантируют доходность.</p></div>;
}
