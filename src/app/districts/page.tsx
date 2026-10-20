import Link from "next/link";
import {districts} from "@/lib/site-content";
import {pageMetadata} from "@/lib/seo";
import {projectImages} from "@/lib/project-images";
import {Breadcrumbs,EditorialHeader,EditorialShell,SelectionContact} from "@/components/Editorial";
export const metadata=pageMetadata("Районы и локации Москвы: новостройки и обзоры","Сравните Павелецкую, Даниловский, Южный порт, Кутузовский и исторический центр. Жилые проекты и критерии покупки в каждой локации.","/districts/");
export default function DistrictsPage(){return <EditorialShell><Breadcrumbs items={[{name:"Районы и локации",href:"/districts/"}]}/><EditorialHeader eyebrow="ГДЕ ПОКУПАТЬ" title="Район входит в стоимость квартиры." description="Смотрите на дом вместе с окружением. В каждом разборе есть проекты, вопросы к локации и условия, которые проверяем до покупки."/><div className="mh-topic-grid">{districts.map(d=><Link href={"/districts/"+d.slug+"/"} className="mh-topic-card" key={d.slug}><img src={projectImages[d.image].src} alt={projectImages[d.image].caption} width="1000" height="650" loading="lazy"/><span>{d.projects.length} проекта в обзоре</span><h2>{d.name}</h2><p>{d.description}</p><span className="mh-text-link">Изучить локацию ↗</span></Link>)}</div><SelectionContact context="выбор района Москвы"/></EditorialShell>;}
