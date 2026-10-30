import {editorialProjects} from '@/lib/editorial-projects';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {EditorialShell,EditorialHeader,Breadcrumbs,SelectionContact,JsonLd} from '@/components/Editorial';
import {feedDate,unitFeatures,rub,categoryNames} from '@/lib/sminex-catalogue';
import {residentialUnits,residentialUnitByRouteId} from '@/lib/residential-catalogue';
import {pageMetadata,SITE_URL} from '@/lib/seo';
import '../../../commercial/commercial.css';
export function generateStaticParams(){return residentialUnits.map(u=>({id:u.routeId}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const u=residentialUnitByRouteId(id);
 return u?pageMetadata(`${u.projectName}: квартира ${u.unitNumber||u.sourceId}, ${u.areaSqm} м² · лот ${u.sourceId}`,`${u.projectName}: ${u.areaSqm} м², ${rub(u.priceRub)}. Лот ${u.sourceId}. Планировка, характеристики квартиры и подбор MAINHALL.`,u.detailPath):{robots:{index:false}};
}
export default async function ResidentialUnitPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const u=residentialUnitByRouteId(id);if(!u)notFound();
 const label=u.isStudio?'Студия':u.isPenthouse?'Пентхаус':categoryNames[u.category]||'Квартира';
 return <EditorialShell>
  <Breadcrumbs items={[{name:'Квартиры',href:'/units/'},{name:u.projectName+' · '+(u.unitNumber||u.sourceId),href:u.detailPath}]}/>
  <EditorialHeader eyebrow={u.projectName+(u.developer?' / '+u.developer:'')} title={label+' '+u.areaSqm+' м²'} description={'Квартира в проекте '+u.projectName+'. Посмотрите планировку и характеристики. MAINHALL сравнит условия покупки и подготовит расчёт под вашу задачу.'}/>
  <div className="mh-commercial-facts"><div><span>Цена</span><strong>{rub(u.priceRub)}</strong></div><div><span>Стоимость метра</span><strong>{rub(u.pricePerSqm)}</strong></div><div><span>Этаж</span><strong>{u.floor??'Не указан'}{u.floorsTotal?' из '+u.floorsTotal:''}</strong></div><div><span>Номер квартиры</span><strong>{u.unitNumber||u.sourceId}</strong></div></div>
  <p className="mh-content-caption">Проверено {feedDate(u.fetchedAt)} · {u.sourceLabel}. Наличие и условия оплаты уточняем для выбранной квартиры.</p>
  {u.planImageUrl&&<figure className="mh-commercial-plan"><img src={u.planImageUrl} alt={'Планировка квартиры '+(u.unitNumber||u.sourceId)+' в '+u.projectName} width="1200" height="900"/><figcaption>Планировка квартиры в проекте {u.projectName}.</figcaption></figure>}
  <section className="mh-commercial-characteristics"><h2>Характеристики квартиры</h2><dl>{unitFeatures(u).map(f=><div key={f.label}><dt>{f.label.replace(' по фиду','')}</dt><dd>{f.value}</dd></div>)}</dl>
   {u.features?.length?<ul>{u.features.map(f=><li key={f}>{f}</li>)}</ul>:null}
   {editorialProjects.some(p=>p.slug===u.projectSlug)&&<Link className="mh-text-link" href={'/projects/'+u.projectSlug+'/'}>Подробнее о проекте {u.projectName} ↗</Link>}
  </section>
  <section className="mh-longread"><h2>Условия покупки</h2><p>Сравним полную оплату и рассрочку, уточним состав отделки, срок передачи и дополнительные расходы. Для инвестиционной покупки подготовим расчёт по этой квартире.</p></section>
  <div className="mh-commercial-gallery">{u.images.filter(i=>i.url!==u.planImageUrl).map((i,n)=><img key={i.url} src={i.url} alt={u.projectName+' · изображение квартиры '+(n+1)} width="1000" height="700" loading="lazy"/>)}</div>
  <SelectionContact text="Обсудим эту квартиру" context={'квартиру '+(u.unitNumber||u.sourceId)+' в проекте '+u.projectName}/>
  <Link href="/units/" className="mh-text-link">Все квартиры ↗</Link>
  <JsonLd data={{'@type':'RealEstateListing',name:u.projectName+' · '+label+' '+u.areaSqm+' м²',url:SITE_URL+u.detailPath}}/>
 </EditorialShell>;
}
