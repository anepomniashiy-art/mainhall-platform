import Link from "next/link";
import {collections} from "@/lib/site-content";
import {projectImages} from "@/lib/project-images";
import {pageMetadata} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from "@/components/Editorial";
export const metadata=pageMetadata("Подборки новостроек Москвы: у воды, клубные дома, высотные проекты","Проекты Москвы по сценарию жизни: набережные, камерный формат и видовые квартиры в высотных комплексах.","/collections/");
export default function CollectionsPage(){return <EditorialShell><Breadcrumbs items={[{name:"Подборки",href:"/collections/"}]}/><EditorialHeader eyebrow="ВАШ СЦЕНАРИЙ ЖИЗНИ" title="Выберите, что вам ближе." description="Набережная, клубный дом или высокая панорама. Собрали проекты по характеристикам, которые можно сравнить при выборе квартиры."/><div className="mh-topic-grid">{collections.map(c=><Link href={"/collections/"+c.slug+"/"} className="mh-topic-card" key={c.slug}><img src={projectImages[c.image].src} alt={projectImages[c.image].caption} width="1000" height="650"/><h2>{c.name}</h2><p>{c.description}</p><span className="mh-text-link">Смотреть подборку ↗</span></Link>)}</div><SelectionContact/></EditorialShell>;}
