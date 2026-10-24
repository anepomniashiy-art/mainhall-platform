import {InvestmentCase} from "@/components/InvestmentCase";
import {getInvestmentProfile} from "@/lib/investment-profiles";
import {InvestmentArchive} from "@/components/InvestmentArchive";
import {ProjectGallery,ProjectMarketUnits} from "@/components/ProjectMarket";
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
 const d=projectDossiers[slug];const photo=projectImages[slug];const district=districtForProject(slug);const related=editorialProjects.filter(x=>x.slug!==slug&&(x.developer===p.developer||x.area===p.area||x.className===p.className)).slice(0,3);
 return <article className="mh-project-detail mh-editorial-page mh-pad">
  <Breadcrumbs items={[{name:"Жилые комплексы",href:"/projects/"},{name:p.name,href:"/projects/"+slug+"/"}]}/>
  <header className="pt-14"><p className="mh-eyebrow">{p.className} / {p.area}</p><h1>{p.name}</h1><p className="max-w-2xl text-base leading-7 text-[#666a60]">{p.summary}</p></header>
  {photo&&<figure style={{margin:0}}><img className="mh-dossier-photo" src={photo.src} alt={photo.caption} width="1600" height="1000" fetchPriority="high"/><figcaption className="mh-content-caption">{photo.caption}</figcaption></figure>}
  <nav className="mh-dossier-nav" aria-label="О проекте"><a href="#location">Расположение</a><a href="#product">Дом и среда</a><a href="#investment">Инвестиционный разбор</a><a href="#apartments">Квартиры</a><a href="#payment">Условия покупки</a></nav>
  <section id="location" className="mh-dossier-section"><p className="mh-eyebrow">01 / ЛОКАЦИЯ</p><h2>{d?.address || p.area+", Москва"}</h2><p>{d?.location || "При подборе в локации «"+p.area+"» рассматриваем фактический маршрут до транспорта, окружающую застройку и инфраструктуру. Отдельно проверяем, какие изменения района уже заложены в цену конкретной квартиры."}</p><iframe className="mh-location-map" title={"Карта локации: "+p.area} src={"https://maps.google.com/maps?q="+encodeURIComponent(d?.address || "Москва, "+p.area)+"&z=14&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><p className="mh-content-caption">Карта локации. Точный корпус и маршрут до него уточняем в подборке квартиры.</p><div className="mh-dossier-facts"><div><dt>Локация</dt><dd>{p.area}</dd></div><div><dt>Девелопер</dt><dd><Link href={"/developers/"+developerSlug(p.developer)+"/"}>{p.developer} ↗</Link></dd></div><div><dt>Класс проекта</dt><dd>{p.className}</dd></div></div><div className="mh-dossier-columns"><div><h3>Окружение сегодня</h3><p>Для решения нужны реальные маршруты и виды: удобен ли путь до транспорта, что расположено под окнами, как устроены въезд и доступ в дом.</p></div><div><h3>Перспектива локации</h3><p>{p.thesis}</p><p>Планы развития оцениваем по стадии реализации. Анонс, утверждённый проект и работающая инфраструктура по-разному влияют на покупку.</p></div></div></section>
  <section id="product" className="mh-dossier-section"><p className="mh-eyebrow">02 / ДОМ И СРЕДА</p><h2>{d?.format || "Характеристики, которые имеют значение"}</h2><p>{p.summary}</p><div className="mh-dossier-columns"><div><h3>{d?"Что выделяет проект":"Что сравниваем"}</h3><ul>{(d?.features || ["Архитектура и масштаб дома","Приватность двора и входных групп","Состав отделки и сервисы для жителей"]).map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>Качество конкретной квартиры</h3><p>Планировка, ориентация, этаж и окружение окон могут быть важнее общего позиционирования комплекса. Для подобранных квартир сравниваем эти характеристики отдельно.</p></div></div><ProjectGallery slug={slug} name={p.name}/>{d&&<p className="mh-content-caption">Описание проекта проверено по официальным материалам {d.checkedAt}. Характеристики конкретного лота уточняются при подборе.</p>}</section>
  <section id="investment" className="mh-dossier-section"><InvestmentCase profile={getInvestmentProfile(slug)}/><InvestmentArchive slug={slug}/></section>
  <section id="apartments" className="mh-dossier-section"><p className="mh-eyebrow">04 / КВАРТИРЫ И ПЛАНИРОВКИ</p><h2>Сравним конкретные варианты.</h2><p>Сравним планировку, вид, этаж, отделку и полную стоимость покупки. Получите актуальную подборку квартир от MAINHALL.</p><ProjectMarketUnits slug={slug} name={p.name}/><ProjectEnquiry name={p.name}/></section>
  <section id="payment" className="mh-dossier-section"><p className="mh-eyebrow">05 / ПОКУПКА И ОПЛАТА</p><h2>Одна квартира.<br/>Разная экономика сделки.</h2><div className="mh-dossier-columns"><div><h3>Полная оплата и рассрочка</h3><p>Запрашиваем цену при каждом способе оплаты. Сравниваем первый взнос, регулярные платежи, финальный остаток и возможное удорожание. Процент первого взноса показывает лишь часть графика.</p></div><div><h3>Выход до полной оплаты</h3><p>Проверяем, допускает ли договор переуступку, на каких условиях и в какой момент нужно внести остаток. Для ипотеки рассматриваем доступные именно вам программы.</p></div></div><Link href="/installments/" className="mh-text-link">Посчитать нагрузку по рассрочке ↗</Link></section>
  <nav className="mh-inline-links" aria-label="Продолжить изучение">{district&&<Link href={"/districts/"+district.slug+"/"}>Обзор локации: {district.name} ↗</Link>}{collections.filter(c=>c.projects.includes(slug)).map(c=><Link key={c.slug} href={"/collections/"+c.slug+"/"}>{c.name} ↗</Link>)}<Link href="/analytics/kak-sravnit-novostroyki/">Как сравнить квартиры ↗</Link></nav>
  <Questions items={[{q:"Где находится "+p.name+"?",a:d.address+". Подробности окружения и карта приведены в разделе о расположении."},{q:"Как узнать цену и доступные квартиры в "+p.name+"?",a:"Укажите комнаты, бюджет и способ оплаты в форме подбора. Запросим наличие и условия на текущую дату, сравним планировки, виды и этажи."},{q:"Что проверить до покупки?",a:d.checks.join("; ")+"."}]}/>
  <section className="mh-related"><h2>Сравните с другими проектами</h2><ProjectGrid slugs={related.map(x=>x.slug)}/></section>
  <JsonLd data={{"@type":"ApartmentComplex",name:p.name,url:SITE_URL+"/projects/"+slug+"/",description:p.summary,image:photo?SITE_URL+photo.src:undefined,address:{"@type":"PostalAddress",addressLocality:"Москва",addressCountry:"RU",streetAddress:d.address.replace(/^Москва,?\s*/,"")}}}/>
  <div className="mh-detail-contact"><h2>Рассмотрим ближе?</h2><Link href="/contacts/" className="mh-text-link">Связаться с MAINHALL ↗</Link></div>
 </article>;
}
