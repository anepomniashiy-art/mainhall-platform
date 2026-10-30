import {catalogueCards} from '@/lib/sminex-catalogue';
import {CommercialCatalogue} from '@/components/CommercialCatalogue';
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from '@/components/Editorial';
import {residentialUnits,residentialProjectCount} from '@/lib/residential-catalogue';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('Квартиры в новостройках Москвы: цены и планировки','Каталог квартир MAINHALL: фильтры по жилому комплексу, цене и площади, планировки и характеристики выбранного лота.','/units/');
export default function UnitsPage(){const cards=catalogueCards(residentialUnits).map((u,i)=>({...u,detailPath:residentialUnits[i].detailPath,developer:residentialUnits[i].developer,district:residentialUnits[i].district,fetchedAt:residentialUnits[i].fetchedAt}));return <EditorialShell>
 <Breadcrumbs items={[{name:'Квартиры',href:'/units/'}]}/>
 <EditorialHeader eyebrow="КВАРТИРЫ И ПЛАНИРОВКИ" title="Выбирайте по своим параметрам." description="Сравните квартиры по проекту, площади и стоимости. Посмотрите планировку и обсудите выбранный вариант с MAINHALL."/>
 <p className="mh-content-caption">{new Intl.NumberFormat('ru-RU').format(residentialUnits.length)} предложения · {residentialProjectCount} жилых комплексов. Дата проверки указана у каждой квартиры. Каталог пополняется; наличие и условия покупки уточняем для выбранного варианта.</p>
 <CommercialCatalogue units={cards} residential/>
 <SelectionContact/>
 </EditorialShell>}
