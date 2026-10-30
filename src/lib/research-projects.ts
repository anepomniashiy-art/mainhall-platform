import archive from "../../data/catalogue/research-projects-2026-10-26.json";
import type {ProjectEntry} from "./editorial-projects";
import additional from "../../data/catalogue/research-additional-projects-2026-10-29.json";
export const researchProjects=[...archive.projects.map(p=>({...p,priceReference:"Прайс-листы на 26.10.2026",source:archive.source})),...additional];
export const researchSource=archive.source;
export const researchMethodology=archive.methodology;
export const researchBySlug=(slug:string)=>researchProjects.find(p=>p.slug===slug);
export const researchEditorialProjects:ProjectEntry[]=researchProjects.map(p=>({
 slug:p.slug,name:p.name,developer:p.developer,area:p.district,
 className:p.className==="Элитный"?"Элитная":p.className==="Бизнес-"?"Бизнес":p.className as ProjectEntry["className"],
 sourceUrl:p.source,
 summary:`${p.name}, ${p.developer}, район ${p.district}. Проект включён в исследование MAINHALL: ${p.priceReference.toLowerCase()}.`,
 thesis:`Для ${p.name} сопоставляем цену входа с предложениями района и переуступками. Динамика прайса и балл скрининга описывают исходные данные, а не будущую доходность квартиры.`,
 dueDiligence:["Актуальная цена конкретного лота и условия скидки","Сопоставимые переуступки и конкурирующие корпуса","Срок передачи по договору и полная стоимость покупки"],
 propertyType:"residential"
}));
