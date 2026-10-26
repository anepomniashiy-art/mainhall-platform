import feedSummary from '../../data/catalogue/sminex-price-summary.json';
import units from '../../data/catalogue/public-units.json';
import archive from '../../data/catalogue/investment-archive.json';
import {editorialProjects} from './editorial-projects';
import {projectDossiers} from './project-dossiers';
export type ProjectComparisonData={slug:string;name:string;developer:string;area:string;className:string;price:number|null;priceLabel:string;priceDate:string;priceDetail:string;perM2:number|null;median:number|null;medianDate:string;coverage:string;term:string;growth:string;verdict:string;risk:string};
const date=(s:string)=>s.slice(0,10).split('-').reverse().join('.');
export const comparisonMoney=(n:number)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
export function getProjectComparison(slug:string):ProjectComparisonData{
 const f=(feedSummary as Record<string,{price:number;area:number;perM2:number;number:string;date:string;count:number}>)[slug];
 const p=editorialProjects.find(p=>p.slug===slug)!;
 const rows=units.units.filter(u=>u.projectSlug===slug).sort((a,b)=>a.priceRub-b.priceRub);
 const a=archive.projects.find(a=>a.slug===(slug==='kvartal-serebryany-bor'?'serebryanyy-bor':slug));
 const model=a?.models.slice().sort((x,y)=>x.entryPriceMillion-y.entryPriceMillion)[0];
 const unit=rows[0];const dossier=projectDossiers[slug];
 return {slug,name:p.name,developer:p.developer,area:p.area,className:p.className,
  price:f?.price??unit?.priceRub??(model?model.entryPriceMillion*1e6:null),
  priceLabel:f?'Минимальная цена в фиде Sminex':unit?'Минимум в опубликованной выборке':model?'Цена лота из архивного разбора':'Цена не опубликована',
  priceDate:f?date(f.date):unit?date(unit.fetchedAt):model?date(model.date):'',
  priceDetail:f?`${comparisonMoney(f.area)} м² · лот № ${f.number}`:unit?`${comparisonMoney(unit.areaSqm)} м² · лот № ${unit.unitNumber}`:model?`${comparisonMoney(model.area)} м²${'lot' in model?' · лот '+model.lot:''}`:'Запросим цену выбранной квартиры',
  perM2:f?f.perM2:unit?(unit.pricePerSqm??unit.priceRub/unit.areaSqm):model?model.entryPriceMillion*1e6/model.area:null,
  median:a?.snapshot.medianPricePerM2??null,medianDate:a?date(a.snapshot.asOf):'',
  coverage:f?`${f.count} предложений в фиде; наличие уточняется`:unit?`${rows.length} ${rows.length===1?'ценовая запись':'ценовые записи'}; наличие не подтверждено`:a?`${a.snapshot.offers} предложений в архивной выборке`:'Нет опубликованной ценовой выборки',
  term:model&&'term' in model?model.term??'Срок по выбранному лоту не опубликован':'Срок по выбранному лоту не опубликован',
  growth:slug==='level-yuzhnoportovaya'?'5–6% в год: допущение разбора 17.10.2026, до расходов':slug==='kvartal-serebryany-bor'?'Индивидуальный сценарий по цене входа':'Расчёт по выбранной квартире',
  verdict:a?.conclusion??p.thesis,risk:dossier?.checks[0]??p.dueDiligence[0],
 };
}
