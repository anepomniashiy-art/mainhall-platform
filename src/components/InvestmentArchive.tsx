import archive from "../../data/catalogue/investment-archive.json";
import "@/app/investment.css";
const money=(v:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(v);
const growth=(rate:number,years:number)=>money(((1+rate)**years-1)*100);
/** Archive is evidence of the analysis performed, not an offer or a fresh price forecast. */
export function InvestmentArchive({slug}:{slug:string}){
 const p=archive.projects.find(p=>p.slug===(slug==="kvartal-serebryany-bor"?"serebryanyy-bor":slug));if(!p)return null;
 return <section className="mh-invest-case mh-invest-archive mh-invest-restored"><p className="mh-invest-kicker">ЦЕНЫ И СЦЕНАРИИ / MAINHALL</p><h3>Сравнение исходных условий</h3><p>{archive.notice}</p>
  <div className="mh-invest-metrics"><div><span>Срез цен предложений</span><strong>{p.snapshot.asOf.split("-").reverse().join(".")}</strong></div><div><span>Медиана архивной выборки</span><strong>{money(p.snapshot.medianPricePerM2)} ₽/м²</strong></div><div><span>Предложений в выборке</span><strong>{p.snapshot.offers}</strong></div></div>
  <p className="mh-invest-note">Медиана смешивает разные площади, корпуса и условия оплаты. Это описание выборки объявлений, а не оценка квартиры и не цена состоявшихся сделок.</p>
  <div className="mh-invest-archive-models">{p.models.map((model,index)=><article key={index}><p className="mh-invest-kicker">РАЗБОР {model.date.split("-").reverse().join(".")}</p><h4>{"lot" in model?`Лот ${model.lot}`:`Квартира ${money(model.area)} м²`}</h4><dl><div><dt>Площадь</dt><dd>{money(model.area)} м²</dd></div><div><dt>Цена в исходном разборе</dt><dd>{money(model.entryPriceMillion)} млн ₽</dd></div><div><dt>Цена метра</dt><dd>{money(model.entryPriceMillion*1e6/model.area)} ₽/м²</dd></div></dl><p>{model.conclusion}</p>
   {"assumptions" in model&&model.assumptions&&<><h5>Сценарий роста цены: 5–6% в год</h5><div className="mh-invest-horizon-bars">{[3,5,8].map(years=><div key={years}><span>{years} {years===3?"года":"лет"}</span><div className="mh-invest-bar-track"><div style={{width:`${Math.min(((1.06**years-1)*100)/.7,100)}%`}}/></div><strong>+{growth(.05,years)}…{growth(.06,years)}%</strong></div>)}</div><p className="mh-invest-note">Пересчёт допущения: (1 + годовой рост) ^ число лет − 1. Это изменение цены до расходов, не доходность инвестора. Цифры иллюстрируют архивную гипотезу 17 октября и не являются новым прогнозом на сегодня. В слабом сценарии прежнего разбора предполагалось 0–2% роста в год.</p></>}
  </article>)}</div>
  <details className="mh-invest-risks"><summary>Условия и вывод архивного разбора</summary><p>{p.conclusion}</p><ul>{p.conditions.map(condition=><li key={condition}>{condition}</li>)}</ul></details>
  <p className="mh-invest-note">Архив: аналитические разборы команды MAINHALL, 15–17 октября 2026. Сверка архива: 24 октября 2026. По каждому новому лоту обновляем цену и график платежей; проценты из старого разбора автоматически не переносим.</p>
 </section>;
}
