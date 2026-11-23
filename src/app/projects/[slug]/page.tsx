import {residentialUnitsByProject} from "@/lib/residential-catalogue";
import {nmarketProjectBySlug,nmarketText} from "@/lib/nmarket-catalogue";
import "@/app/project-experience.css";
import {ResearchProjectAnalysis} from "@/components/ResearchProjectAnalysis";
import {CommercialCatalogue} from "@/components/CommercialCatalogue";
import {catalogueCards,rub} from "@/lib/sminex-catalogue";
import {InvestmentCase} from "@/components/InvestmentCase";
import {getInvestmentProfile,hasInvestmentProfile} from "@/lib/investment-profiles";
import {InvestmentArchive} from "@/components/InvestmentArchive";
import {ProjectGallery} from "@/components/ProjectMarket";
import {developerSlug} from "@/lib/developers";
import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {projectImages} from "@/lib/project-images";
import {ProjectEnquiry} from "@/components/ProjectEnquiry";
import {projectDossiers} from "@/lib/project-dossiers";
import {Breadcrumbs,JsonLd,ProjectGrid,Questions} from "@/components/Editorial";
import {districtForProject,collections} from "@/lib/site-content";
import {SITE_URL} from "@/lib/seo";
import {editorialProjects} from "@/lib/editorial-projects";
export function generateStaticParams(){return editorialProjects.map(p=>({slug:p.slug}));}
// Metadata uses only editorial registry fields (name/developer/area/summary): no prices, inventory or images.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params; const p=editorialProjects.find(x=>x.slug===slug);
 if(!p)return {title:"Проект не найден",robots:{index:false,follow:true}};
 const title=`ЖК ${p.name}: расположение, квартиры и условия покупки`;
 return {title,description:`${p.name}, ${p.developer}, ${p.area}. Фото проекта, расположение, характеристики дома и разбор покупки. Актуальные квартиры и условия по запросу.`,alternates:{canonical:`/projects/${p.slug}/`},
  openGraph:{title,description:p.summary,url:`/projects/${p.slug}/`,type:"website",images:projectImages[p.slug]?[projectImages[p.slug].src]:[]}};
}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const p=editorialProjects.find(x=>x.slug===slug);if(!p)notFound();
 const feedUnits=residentialUnitsByProject.get(slug)||[];
 const prices=feedUnits.map(u=>u.priceRub).filter((x):x is number=>x!=null&&x>0);const areas=feedUnits.map(u=>u.areaSqm).filter((x):x is number=>x!=null&&x>0);
 const imported=nmarketProjectBySlug[slug];const d=projectDossiers[slug];const photo=projectImages[slug];const district=districtForProject(slug);const related=editorialProjects.filter(x=>x.slug!==slug&&(x.developer===p.developer||x.area===p.area||x.className===p.className)).slice(0,3);
 return <article className="mh-project-detail mh-editorial-page mh-pad">
  <Breadcrumbs items={[{name:"Жилые комплексы",href:"/projects/"},{name:p.name,href:"/projects/"+slug+"/"}]}/>
  <div className={"mh-residential-lead"+(photo?" mh-residential-lead--photo":"")}>
   {photo&&<figure className="mh-project-hero mh-residential-cover"><img src={photo.src} alt={photo.caption} width="1600" height="1000" fetchPriority="high"/></figure>}
   <header className="mh-project-page-header mh-residential-lead-copy">
    <p className="mh-eyebrow">{p.className} · {p.area} · {p.developer}</p>
    <h1>{p.name}</h1>
    <p>{p.summary}</p>
    <a href="#apartments" className="mh-residential-action">Подобрать квартиру</a>
   </header>
  </div>
  {photo&&<p className="mh-residential-credit">{photo.caption}</p>}
  <ProjectGallery slug={slug} name={p.name}/>
  <nav className="mh-dossier-nav" aria-label="О проекте"><a href="#product">О доме</a><a href="#investment">Критерии выбора</a><a href="#location">Расположение</a><a href="#apartments">Квартиры и цены</a></nav>
  <dl className="mh-project-overview"><div><dt>Расположение</dt><dd>{p.area}</dd></div><div><dt>Девелопер</dt><dd><Link href={"/developers/"+developerSlug(p.developer)+"/"}>{p.developer} ↗</Link></dd></div><div><dt>Класс</dt><dd>{p.className}</dd></div></dl>
  <section id="product" className="mh-project-section"><p className="mh-eyebrow">ДОМ И СРЕДА</p><h2>{d?.format || "О проекте"}</h2>{d?.features?.length>0&&<div className="mh-project-feature-grid">{d.features.map(x=><div key={x}>{x}</div>)}</div>}{imported&&<div className="mh-longread">{imported.descriptionRefs.map(ref=><div key={ref}>{nmarketText(ref).split('\n').map((text,i)=><p key={i}>{text}</p>)}</div>)}
  <h3>Корпуса и характеристики</h3>{Object.values(imported.buildings).map(building=><details key={building.id}><summary>{building.name||'Корпус'}{building.phase?' · '+building.phase:''}</summary><dl><div><dt>Адрес</dt><dd>{building.address}</dd></div>{building.type&&<div><dt>Конструкция</dt><dd>{building.type}</dd></div>}{building.floors&&<div><dt>Этажей</dt><dd>{building.floors}</dd></div>}{building.year&&<div><dt>Заявленный год сдачи</dt><dd>{building.quarter?building.quarter+' квартал ':''}{building.year}</dd></div>}{building.latitude&&building.longitude&&<div><dt>Координаты</dt><dd>{building.latitude}, {building.longitude}</dd></div>}</dl>{!imported.descriptionRefs.includes(building.descriptionRef)&&nmarketText(building.descriptionRef).split('\n').map((text,i)=><p key={i}>{text}</p>)}</details>)}</div>}</section>
  <section id="investment" className="mh-project-section"><p className="mh-eyebrow">ЭКСПЕРТНЫЙ ВЗГЛЯД</p><h2>Как выбрать квартиру в этом проекте</h2><p>{p.thesis}</p><ResearchProjectAnalysis slug={slug}/>{hasInvestmentProfile(slug)&&<details><summary>Инвестиционный разбор и расчёт покупки</summary><InvestmentCase profile={getInvestmentProfile(slug)}/></details>}<details><summary>Подробные материалы исследования</summary><InvestmentArchive slug={slug}/></details></section>
  <section id="location" className="mh-project-section"><p className="mh-eyebrow">РАСПОЛОЖЕНИЕ</p><h2>{d?.address || p.area+", Москва"}</h2>{d?.location&&<p>{d.location}</p>}<iframe className="mh-location-map" title={"Карта локации: "+p.area} src={"https://maps.google.com/maps?q="+encodeURIComponent(d?.address || "Москва, "+p.area)+"&z=14&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></section>
  <section id="apartments" className="mh-project-section"><p className="mh-eyebrow">КВАРТИРЫ И ПЛАНИРОВКИ</p><h2>Выберите свою квартиру</h2>{feedUnits.length>0&&<dl className="mh-project-overview"><div><dt>Квартир в каталоге</dt><dd>{feedUnits.length}</dd></div>{prices.length>0&&<div><dt>Цена от</dt><dd>{rub(Math.min(...prices))}</dd></div>}{areas.length>0&&<div><dt>Площадь</dt><dd>{Math.min(...areas)}–{Math.max(...areas)} м²</dd></div>}</dl>}<p>Подберём планировку, вид и этаж. Сравним полную стоимость и условия оплаты.</p>{feedUnits.length>0&&<CommercialCatalogue units={catalogueCards(feedUnits).map((u,i)=>({...u,detailPath:feedUnits[i].detailPath,fetchedAt:feedUnits[i].fetchedAt}))} projects={{[slug]:{name:p.name,developer:p.developer,district:p.area,href:"/projects/"+slug+"/",cover:photo}}} residential groupByProject={false}/>}<ProjectEnquiry name={p.name}/><details><summary>Как проходит покупка с Mainhall</summary><p>Согласуем задачи и бюджет, подготовим подборку квартир, организуем просмотр. Для выбранного варианта сопоставим полную оплату и рассрочку, проверим график платежей и условия договора.</p><Link href="/installments/" className="mh-text-link">Условия рассрочки ↗</Link></details></section>
  <nav className="mh-inline-links" aria-label="Продолжить изучение">{district&&<Link href={"/districts/"+district.slug+"/"}>Обзор локации: {district.name} ↗</Link>}{collections.filter(c=>c.projects.includes(slug)).map(c=><Link key={c.slug} href={"/collections/"+c.slug+"/"}>{c.name} ↗</Link>)}<Link href="/analytics/kak-sravnit-novostroyki/">Как сравнить квартиры ↗</Link></nav>
  <Questions items={[{q:"Где находится "+p.name+"?",a:d.address+". Подробности окружения и карта приведены в разделе о расположении."},{q:"Как узнать цену и доступные квартиры в "+p.name+"?",a:"Укажите комнаты, бюджет и способ оплаты в форме подбора. Запросим наличие и условия на текущую дату, сравним планировки, виды и этажи."},{q:"Что проверить до покупки?",a:d.checks.join("; ")+"."}]}/>
  <section className="mh-related"><h2>Сравните с другими проектами</h2><ProjectGrid slugs={related.map(x=>x.slug)}/></section>
  <JsonLd data={{"@type":"ApartmentComplex",name:p.name,url:SITE_URL+"/projects/"+slug+"/",description:p.summary,image:photo?(photo.src.startsWith("http")?photo.src:SITE_URL+photo.src):undefined,address:{"@type":"PostalAddress",addressLocality:imported?.locality|| (slug==="novoe-medvedkovo"?"Мытищи":slug==="belyy-grad"?"Челобитьево":"Москва"),addressRegion:imported?.region,addressCountry:"RU",streetAddress:d.address.replace(/^Москва,?\s*/,"")}}}/>
  <div className="mh-detail-contact"><h2>Рассмотрим ближе?</h2><Link href="/contacts/" className="mh-text-link">Связаться с Mainhall ↗</Link></div>
 </article>;
}
