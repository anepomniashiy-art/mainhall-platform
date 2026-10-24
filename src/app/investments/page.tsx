import Link from "next/link";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact,JsonLd} from "@/components/Editorial";
import {pageMetadata,SITE_URL} from "@/lib/seo";
import {investmentSelection} from "@/lib/investment-selection";
import {editorialProjects} from "@/lib/editorial-projects";
import {projectImages} from "@/lib/project-images";
import "../investment.css";
export const metadata=pageMetadata("10 ЖК Москвы для инвестиционного сравнения: аргументы и расчёты","Десять проектов с разной инвестиционной логикой. Драйверы цены, риски, архивные расчёты и калькулятор сценариев покупки MAINHALL.","/investments/");
export default function InvestmentsPage(){return <EditorialShell>
 <Breadcrumbs items={[{name:"Инвестиционное сравнение",href:"/investments/"}]}/>
 <EditorialHeader eyebrow="ИНВЕСТИЦИОННАЯ РЕДАКЦИЯ" title="10 проектов. Проверяем, где есть смысл." description="Выбрали десять ЖК с разными основаниями для анализа: развитие территории, деловое окружение, вода, парк и редкий адрес. Сопоставляем цену входа с тем, за что готов платить следующий покупатель."/>
 <p className="mh-author">Редакция MAINHALL · <time dateTime="2026-10-24">24 октября 2026</time></p>
 <div className="mh-invest-selection-note"><h2>Важнее всего условия входа</h2><p>Порядок проектов не отражает ожидаемую доходность. Подборка помогает сравнить инвестиционные идеи. Итог по конкретной квартире может быть «покупать только дешевле» или «отказаться». Прогноз требует проверенной цены лота, графика платежей, расходов и срока выхода.</p><p>В карточках отдельно показаны факторы, архивные расчёты при их наличии и калькулятор чувствительности. Архивные цены не подтверждают сегодняшнее предложение. Гипотезы калькулятора не являются прогнозом роста ЖК.</p></div>
 <div className="mh-invest-selection-grid">{investmentSelection.map((item,i)=>{const p=editorialProjects.find(p=>p.slug===item.slug)!;const image=projectImages[p.slug];return <article key={p.slug} className="mh-invest-selection-card"><Link href={`/projects/${p.slug}/#investment`}><img src={image.src} alt={image.caption} width="1000" height="650" loading="lazy"/><div><p className="mh-eyebrow">{String(i+1).padStart(2,"0")} / {item.angle}</p><h2>{p.name}</h2><p>{item.question}</p><span className="mh-text-link">Факторы, риски и расчёт ↗</span></div></Link></article>})}</div>
 <SelectionContact/>
 <JsonLd data={{"@type":"ItemList",name:"10 проектов Москвы для инвестиционного сравнения",itemListOrder:"https://schema.org/ItemListUnordered",itemListElement:investmentSelection.map((p,i)=>({"@type":"ListItem",position:i+1,url:SITE_URL+`/projects/${p.slug}/`}))}}/>
 </EditorialShell>}
