import Link from "next/link";
import {articles} from "@/lib/site-content";
import {projectImages} from "@/lib/project-images";
import {pageMetadata} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from "@/components/Editorial";
export const metadata=pageMetadata("Аналитика недвижимости Москвы и разборы покупки","Материалы MAINHALL о выборе новостройки, рассрочках и квартире для аренды. Архив сравнений условий оплаты с датой исходных данных.","/analytics/");
export default function AnalyticsPage(){return <EditorialShell><Breadcrumbs items={[{name:"Аналитика",href:"/analytics/"}]}/><EditorialHeader eyebrow="РЕДАКЦИЯ MAINHALL" title="Аргументы перед покупкой." description="Разбираем вопросы, с которыми сталкивается покупатель: как сравнить квартиры, проверить график платежей и посчитать вложения до аренды."/><div className="mh-topic-grid">{articles.map(a=><Link href={"/analytics/"+a.slug+"/"} className="mh-topic-card" key={a.slug}><img src={projectImages[a.image].src} alt={projectImages[a.image].caption} width="1000" height="650" loading="lazy"/><span>{a.category}</span><h2>{a.title}</h2><p>{a.description}</p><span className="mh-text-link">Читать разбор ↗</span></Link>)}</div><SelectionContact/></EditorialShell>;}
