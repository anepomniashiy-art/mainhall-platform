import {pageMetadata} from "@/lib/seo";
import {Breadcrumbs,EditorialShell,EditorialHeader,SelectionContact} from "@/components/Editorial";
import {CommercialCatalogue} from '@/components/CommercialCatalogue';
import {catalogueCards,sminexFeed,feedDate} from '@/lib/sminex-catalogue';
import '../../commercial/commercial.css';
import {UnitsCatalogue} from "@/components/UnitsCatalogue";
export const metadata=pageMetadata("Квартиры в новостройках Москвы: цены и планировки","Подбор квартир по бюджету, комнатности и жилому комплексу. Опубликованные цены, планировки, этажи и дата проверки предложения.","/units/");
export default function UnitsPage(){return <EditorialShell><Breadcrumbs items={[{name:"Квартиры",href:"/units/"}]}/><EditorialHeader eyebrow="КВАРТИРЫ И ПЛАНИРОВКИ" title="Выбирайте по своим параметрам." description="Здесь представлены квартиры из проверенных открытых прайсов. Это часть рынка, а не полный остаток застройщиков. Цена относится к указанной дате; наличие и условия оплаты подтверждаем перед покупкой."/><h2>Жилые предложения Sminex</h2><p>Данные официального фида от {feedDate(sminexFeed.fetchedAt)}. Наличие подтверждаем перед бронированием.</p><CommercialCatalogue units={catalogueCards(sminexFeed.units.filter(u=>u.propertyType==="residential"))} residential/><h2>Другие предложения с опубликованной ценой</h2><UnitsCatalogue/><SelectionContact/></EditorialShell>;}
