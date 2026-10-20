import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {projectImages} from "@/lib/project-images";
import {ProjectEnquiry} from "@/components/ProjectEnquiry";
import {projectDossiers} from "@/lib/project-dossiers";
import {editorialProjects} from "@/lib/editorial-projects";
export function generateStaticParams(){return editorialProjects.map(p=>({slug:p.slug}));}
// Metadata uses only editorial registry fields (name/developer/area/summary): no prices, inventory or images.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params; const p=editorialProjects.find(x=>x.slug===slug);
 if(!p)return {title:"Проект не найден",robots:{index:false,follow:true}};
 const title=`${p.name} — ${p.developer}, ${p.area}`;
 return {title,description:p.summary,alternates:{canonical:`/projects/${p.slug}/`},
  openGraph:{title,description:p.summary,url:`/projects/${p.slug}/`,type:"article"}};
}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const p=editorialProjects.find(x=>x.slug===slug);if(!p)notFound();
 const d=projectDossiers[slug];const photo=projectImages[slug];
 return <article className="mh-project-detail mh-pad">
  <Link href="/projects/" className="mh-eyebrow">← ПРОЕКТЫ</Link>
  <header className="pt-14"><p className="mh-eyebrow">{p.className} / {p.area}</p><h1>{p.name}</h1><p className="max-w-2xl text-base leading-7 text-[#666a60]">{p.summary}</p></header>
  {photo&&<figure style={{margin:0}}><img className="mh-dossier-photo" src={photo.src} alt={photo.caption} width="1600" height="1000" fetchPriority="high"/><figcaption className="mh-content-caption">{photo.caption}</figcaption></figure>}
  <nav className="mh-dossier-nav" aria-label="О проекте"><a href="#location">Расположение</a><a href="#product">Дом и среда</a><a href="#investment">Инвестиционный разбор</a><a href="#apartments">Квартиры</a><a href="#payment">Условия покупки</a></nav>
  <section id="location" className="mh-dossier-section"><p className="mh-eyebrow">01 / ЛОКАЦИЯ</p><h2>{d?.address || p.area+", Москва"}</h2><p>{d?.location || "При подборе в локации «"+p.area+"» рассматриваем фактический маршрут до транспорта, окружающую застройку и инфраструктуру. Отдельно проверяем, какие изменения района уже заложены в цену конкретной квартиры."}</p><iframe className="mh-location-map" title={"Карта локации: "+p.area} src={"https://maps.google.com/maps?q="+encodeURIComponent(d?.address || "Москва, "+p.area)+"&z=14&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><p className="mh-content-caption">Карта локации. Точный корпус и маршрут до него уточняем в подборке квартиры.</p><div className="mh-dossier-facts"><div><dt>Локация</dt><dd>{p.area}</dd></div><div><dt>Девелопер</dt><dd>{p.developer}</dd></div><div><dt>Класс проекта</dt><dd>{p.className}</dd></div></div><div className="mh-dossier-columns"><div><h3>Окружение сегодня</h3><p>Для решения нужны реальные маршруты и виды: удобен ли путь до транспорта, что расположено под окнами, как устроены въезд и доступ в дом.</p></div><div><h3>Перспектива локации</h3><p>{p.thesis}</p><p>Планы развития оцениваем по стадии реализации. Анонс, утверждённый проект и работающая инфраструктура по-разному влияют на покупку.</p></div></div></section>
  <section id="product" className="mh-dossier-section"><p className="mh-eyebrow">02 / ДОМ И СРЕДА</p><h2>{d?.format || "Характеристики, которые имеют значение"}</h2><p>{p.summary}</p><div className="mh-dossier-columns"><div><h3>{d?"Что выделяет проект":"Что сравниваем"}</h3><ul>{(d?.features || ["Архитектура и масштаб дома","Приватность двора и входных групп","Состав отделки и сервисы для жителей"]).map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>Качество конкретной квартиры</h3><p>Планировка, ориентация, этаж и окружение окон могут быть важнее общего позиционирования комплекса. Для подобранных квартир сравниваем эти характеристики отдельно.</p></div></div>{d&&<p className="mh-content-caption">Описание проекта проверено по официальным материалам {d.checkedAt}. Характеристики конкретного лота уточняются при подборе.</p>}</section>
  <section id="investment" className="mh-dossier-section"><p className="mh-eyebrow">03 / ВЗГЛЯД MAINHALL</p><h2>Почему этот проект стоит разбирать</h2><p>{d?.thesis || p.thesis}</p><div className="mh-dossier-columns"><div><h3>Что проверяем до решения</h3><ul>{(d?.checks || p.dueDiligence).map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>Считаем весь путь</h3><p>Цена входа → платежи до передачи → отделка и содержание → возможный срок аренды или продажи. В расчёте сравниваем сценарии с разной ценой выхода и сроком экспозиции.</p><p>Инвестиционный тезис — наша аналитическая оценка. Он не заменяет проверку цены и документов по выбранному лоту.</p></div></div></section>
  <section id="apartments" className="mh-dossier-section"><p className="mh-eyebrow">04 / КВАРТИРЫ И ПЛАНИРОВКИ</p><h2>Сравним конкретные варианты.</h2><p>Не просто метры: сравним планировку, вид, этаж, отделку и полную стоимость покупки. Получите актуальную подборку напрямую от MAINHALL.</p><ProjectEnquiry name={p.name}/></section>
  <section id="payment" className="mh-dossier-section"><p className="mh-eyebrow">05 / ПОКУПКА И ОПЛАТА</p><h2>Одна квартира.<br/>Разная экономика сделки.</h2><div className="mh-dossier-columns"><div><h3>Полная оплата и рассрочка</h3><p>Запрашиваем цену при каждом способе оплаты. Сравниваем первый взнос, регулярные платежи, финальный остаток и возможное удорожание — не только рекламируемый процент входа.</p></div><div><h3>Выход до полной оплаты</h3><p>Проверяем, допускает ли договор переуступку, на каких условиях и в какой момент нужно внести остаток. Для ипотеки рассматриваем доступные именно вам программы.</p></div></div><Link href="/#payments" className="mh-text-link">Посчитать нагрузку по рассрочке ↗</Link></section>
  <div className="mh-detail-contact"><h2>Рассмотрим ближе?</h2><Link href="/#contact" className="mh-text-link">Связаться с MAINHALL ↗</Link></div>
 </article>;
}
