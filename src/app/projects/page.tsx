import Link from "next/link";
import {ProjectsCatalogue} from "@/components/ProjectsCatalogue";
import {editorialProjects} from "@/lib/editorial-projects";
import {pageMetadata,SITE_URL} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,JsonLd} from "@/components/Editorial";
export const metadata=pageMetadata("Новостройки Москвы и области: каталог жилых комплексов",editorialProjects.length+" жилых проектов Москвы и области с фотографиями, расположением, характеристиками и разбором покупки. Сравните комплексы и запросите актуальные квартиры.","/projects/");
export default function ProjectsPage(){return <EditorialShell><Breadcrumbs items={[{name:"Жилые комплексы",href:"/projects/"}]}/><EditorialHeader eyebrow="КАТАЛОГ MAINHALL" title="Жилые комплексы Москвы и области." description="Выберите свой дом: фотографии, расположение, и доступные квартиры."/><nav className="mh-inline-links" aria-label="Способы выбора проекта"><Link href="/districts/">По районам ↗</Link><Link href="/collections/">По сценарию жизни ↗</Link><Link href="/developers/">По застройщикам ↗</Link><Link href="/installments/">Рассрочка и расчёт ↗</Link></nav><ProjectsCatalogue/><JsonLd data={{"@type":"CollectionPage",name:"Жилые комплексы Москвы и области",url:SITE_URL+"/projects/",mainEntity:{"@type":"ItemList",itemListElement:editorialProjects.map((p,i)=>({"@type":"ListItem",position:i+1,name:p.name,url:SITE_URL+"/projects/"+p.slug+"/"}))}}}/></EditorialShell>;}

