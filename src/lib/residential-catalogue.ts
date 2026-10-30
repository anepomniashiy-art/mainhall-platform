import publicData from '../../data/catalogue/public-units.json';
import {editorialProjects} from './editorial-projects';
import {sminexFeed,type SminexUnit} from './sminex-catalogue';

export type ResidentialUnit=SminexUnit & {
 routeId:string;detailPath:string;sourceType:'partner_feed'|'public_site';
 sourceLabel:string;sourceUrl:string;fetchedAt:string;developer:string;district:string;
 priceBeforeDiscountRub?:number;floorsTotal?:number;features?:string[];sourcePlanImageUrl?:string|null;
};
const project=(slug:string)=>editorialProjects.find(p=>p.slug===slug);
const official=sminexFeed.units.filter(u=>u.propertyType==='residential').map((u):ResidentialUnit=>({
 ...u,routeId:u.sourceId,detailPath:'/units/'+u.sourceId+'/',sourceType:'partner_feed',
 sourceLabel:'Официальный фид Sminex',sourceUrl:sminexFeed.sourceUrl,fetchedAt:sminexFeed.fetchedAt,
 developer:project(u.projectSlug)?.developer||'Sminex',district:project(u.projectSlug)?.area||''
}));
const publicUnits=publicData.units.map((u):ResidentialUnit=>{
 const p=project(u.projectSlug);const routeId='public-'+u.projectSlug+'-'+u.sourceId;
 const plan=u.planImageSrc||u.planImageUrl||null;
 return {
  id:u.id,sourceId:u.sourceId,routeId,detailPath:'/units/'+routeId+'/',
  projectName:p?.name||u.projectSlug,projectSlug:u.projectSlug,developer:p?.developer||'',district:p?.area||'',
  category:'apartment',propertyType:'residential',areaSqm:u.areaSqm,priceRub:u.priceRub,
  priceBeforeDiscountRub:u.priceBeforeDiscountRub,pricePerSqm:u.pricePerSqm??null,
  floor:u.floor??null,floorsTotal:'floorsTotal' in u?u.floorsTotal:undefined,
  unitNumber:u.unitNumber||null,description:'',images:plan?[{url:plan,tag:'plan'}]:[],
  planImageUrl:plan,sourcePlanImageUrl:u.planImageUrl||null,updatedAt:('sourceUpdatedAt' in u?u.sourceUpdatedAt:undefined)||u.fetchedAt,
  salesStatus:u.salesStatus,rooms:u.rooms,bedrooms:u.bedrooms,buildingName:u.buildingName,
  finishRaw:u.finish,ceilingHeight:'ceilingHeightM' in u?u.ceilingHeightM:undefined,
  isStudio:('unitType' in u&&u.unitType==='studio'),isPenthouse:u.type==='Пентхаус',
  deliveryYear:'completionYear' in u?u.completionYear:undefined,
  features:u.features,sourceType:'public_site',sourceLabel:'Официальный сайт '+(p?.developer||'проекта'),
  sourceUrl:u.sourceUrl,fetchedAt:u.fetchedAt
 };
});
// Interleave projects and developers so the first screen represents the catalogue.
// Source order within each project's apartments is preserved; this is not a ranking.
const byProject=new Map<string,ResidentialUnit[]>();
for(const u of [...official,...publicUnits])byProject.set(u.projectSlug,[...(byProject.get(u.projectSlug)||[]),u]);
const projectsByDeveloper=new Map<string,string[]>();
for(const [slug,units] of byProject){const name=units[0].developer;projectsByDeveloper.set(name,[...(projectsByDeveloper.get(name)||[]),slug]);}
const projectOrder:string[]=[];
const developerProjects=[...projectsByDeveloper.values()];
for(let i=0;developerProjects.some(group=>i<group.length);i++)for(const group of developerProjects)if(group[i])projectOrder.push(group[i]);
export const residentialUnits:ResidentialUnit[]=[];
for(let i=0;projectOrder.some(slug=>i<byProject.get(slug)!.length);i++)for(const slug of projectOrder){const unit=byProject.get(slug)![i];if(unit)residentialUnits.push(unit);}
export const residentialProjectCount=new Set(residentialUnits.map(u=>u.projectSlug)).size;
export const residentialUnitByRouteId=(id:string)=>residentialUnits.find(u=>u.routeId===id);
