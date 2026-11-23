import Link from "next/link";
import "@/app/project-experience.css";
import {ProjectsCatalogue} from "@/components/ProjectsCatalogue";
import {editorialProjects} from "@/lib/editorial-projects";
import {pageMetadata,SITE_URL} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,JsonLd} from "@/components/Editorial";
export const metadata=pageMetadata("Новостройки Москвы и области: каталог жилых комплексов",editorialProjects.length+" жилых проектов Москвы и области с фотографиями, расположением, характеристиками и разбором покупки. Сравните комплексы и запросите актуальные квартиры.","/projects/");
export default function ProjectsPage() {
 return <EditorialShell>
  <div className="mh-residential-index">
   <Breadcrumbs items={[{name:"Жилые комплексы",href:"/projects/"}]}/>
   <div className="mh-residential-lead mh-residential-lead--photo">
    <picture className="mh-residential-cover">
     <source media="(max-width: 600px)" srcSet="/atelier/assets/hero/city-level-portrait.webp" />
     <img src="/atelier/assets/hero/city-level-1920.webp" srcSet="/atelier/assets/hero/city-level-960.webp 960w, /atelier/assets/hero/city-level-1920.webp 1920w" sizes="100vw" alt="Башни Level Южнопортовая · визуализация Level Group" width="1920" height="1080" fetchPriority="high" />
    </picture>
    <div className="mh-residential-lead-copy">
     <EditorialHeader eyebrow="Каталог Mainhall" title="Жилые комплексы Москвы и области" description="Сравните архитектуру, расположение, сроки сдачи и доступные квартиры."/>
    </div>
   </div>
   <p className="mh-residential-credit">Level Южнопортовая · визуализация Level Group</p>
   <nav className="mh-inline-links" aria-label="Способы выбора проекта">
    <Link href="/districts/">По районам ↗</Link><Link href="/collections/">По сценарию жизни ↗</Link><Link href="/developers/">По застройщикам ↗</Link><Link href="/installments/">Рассрочка и расчёт ↗</Link>
   </nav>
   <ProjectsCatalogue/>
  </div>
  <JsonLd data={{"@type":"CollectionPage",name:"Жилые комплексы Москвы и области",url:SITE_URL+"/projects/",mainEntity:{"@type":"ItemList",itemListElement:editorialProjects.map((p,i)=>({"@type":"ListItem",position:i+1,name:p.name,url:SITE_URL+"/projects/"+p.slug+"/"}))}}}/>
 </EditorialShell>;
}
