import Link from "next/link";
import {editorialProjects} from "@/lib/editorial-projects";
import {pageMetadata} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from "@/components/Editorial";
export const metadata=pageMetadata("Застройщики Москвы и их проекты в каталоге MAINHALL","PIONEER, MR Group, Hutton, Vesper, Capital Group, STONE и другие девелоперы. Жилые комплексы с описанием расположения и условий покупки.","/developers/");
export default function DevelopersPage(){const names=[...new Set(editorialProjects.map(p=>p.developer))];return <EditorialShell><Breadcrumbs items={[{name:"Застройщики",href:"/developers/"}]}/><EditorialHeader eyebrow="ПРОЕКТЫ ПО ДЕВЕЛОПЕРАМ" title="Сравнивайте конкретные дома." description="Имя застройщика помогает найти проект. Решение о покупке принимаем по квартире, документам, сроку и полной цене выбранного лота."/><div className="mh-developer-directory">{names.map(name=><section key={name}><h2>{name}</h2>{editorialProjects.filter(p=>p.developer===name).map(p=><Link key={p.slug} href={"/projects/"+p.slug+"/"}>{p.name}<span>{p.area} ↗</span></Link>)}</section>)}</div><SelectionContact/></EditorialShell>;}
