import {catalogueCards} from '@/lib/sminex-catalogue';
import {CommercialCatalogue} from '@/components/CommercialCatalogue';
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from '@/components/Editorial';
import {residentialUnits,residentialProjectCount} from '@/lib/residential-catalogue';
import {editorialProjects} from '@/lib/editorial-projects';
import {projectImages} from '@/lib/project-images';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('Квартиры в новостройках Москвы: цены и планировки','Каталог квартир MAINHALL: фильтры по жилому комплексу, цене и площади, планировки и характеристики выбранного лота.','/units/');
export default function UnitsPage(){
 const slugs=new Set(residentialUnits.map(u=>u.projectSlug));
 const projects=Object.fromEntries(editorialProjects.filter(p=>slugs.has(p.slug)).map(p=>[p.slug,{href:'/projects/'+p.slug+'/',cover:projectImages[p.slug]}]));
 const cards=catalogueCards(residentialUnits).map((u,i)=>({...u,detailPath:residentialUnits[i].detailPath,developer:residentialUnits[i].developer,district:residentialUnits[i].district,fetchedAt:residentialUnits[i].fetchedAt}));return <EditorialShell>
 <Breadcrumbs items={[{name:'Квартиры',href:'/units/'}]}/>
 <EditorialHeader eyebrow="КВАРТИРЫ И ПЛАНИРОВКИ" title="Выбирайте по своим параметрам." description="Укажите параметры квартиры и посмотрите жилые комплексы, в которых есть подходящие предложения."/>
 <p className="mh-content-caption">{new Intl.NumberFormat('ru-RU').format(residentialUnits.length)} предложения · {residentialProjectCount} жилых комплексов. Дата проверки указана у каждой квартиры. Каталог пополняется; наличие и условия покупки уточняем для выбранного варианта.</p>
 <CommercialCatalogue units={cards} projects={projects} residential/>
 <SelectionContact/>
 </EditorialShell>}
