import {ProjectsCatalogue} from "@/components/ProjectsCatalogue";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact,JsonLd} from "@/components/Editorial";
import {pageMetadata,SITE_URL} from "@/lib/seo";
import {investmentSelection} from "@/lib/investment-selection";
import {editorialProjects} from "@/lib/editorial-projects";

import "../investment.css";
export const metadata=pageMetadata("10 ЖК Москвы для инвестиционного сравнения: аргументы и расчёты","Десять проектов с разной инвестиционной логикой. Драйверы цены, риски, архивные расчёты и калькулятор сценариев покупки MAINHALL.","/investments/");
export default function InvestmentsPage(){return <EditorialShell>
 <Breadcrumbs items={[{name:"Инвестиционное сравнение",href:"/investments/"}]}/>
 <EditorialHeader eyebrow="ИНВЕСТИЦИОННАЯ РЕДАКЦИЯ" title="Сравнение 10 жилых комплексов." description="Выберите проект по фотографиям и расположению. Внутри — характеристики дома, инвестиционные аргументы и расчёт покупки MAINHALL."/>
 <p className="mh-author">Редакция MAINHALL · <time dateTime="2026-10-24">24 октября 2026</time></p>
 <p className="mh-content-caption">Подборка не ранжирована по доходности. Архивные цены и допущения отмечены отдельно; наличие квартир подтверждаем перед подбором.</p>
 <ProjectsCatalogue slugs={investmentSelection.map(p=>p.slug)} investmentMode/>
 <SelectionContact/>
 <JsonLd data={{"@type":"ItemList",name:"10 проектов Москвы для инвестиционного сравнения",itemListOrder:"https://schema.org/ItemListUnordered",itemListElement:investmentSelection.map((p,i)=>({"@type":"ListItem",position:i+1,url:SITE_URL+`/projects/${p.slug}/`}))}}/>
 </EditorialShell>}
