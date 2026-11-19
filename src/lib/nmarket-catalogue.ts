import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import type {SminexUnit} from './sminex-catalogue';
type SourcePhoto={src:string;tag:string;width:number;height:number};
type Building={id:string;name:string;phase:string;address:string;descriptionRef:number;type:string;state:string;floors:number|null;year:number|null;quarter:number|null;latitude:number|null;longitude:number|null};
type SourceProject={sourceId:string;slug:string;name:string;developer:string;region:string;locality:string;district:string;classRaw:string;addresses:string[];descriptionRefs:number[];buildings:Record<string,Building>;images:SourcePhoto[];units:number};
const read=(file:string)=>{const full=path.join(process.cwd(),'data/catalogue',file);return JSON.parse(fs.existsSync(full)?fs.readFileSync(full,'utf8'):gunzipSync(fs.readFileSync(full+'.gz')).toString('utf8'));};
const source=read('nmarket-projects.json') as {generatedAt:string;projects:SourceProject[];descriptions:string[]};
export const nmarketProjects=source.projects;
export const nmarketProjectBySlug=Object.fromEntries(nmarketProjects.map(p=>[p.slug,p]));
export const nmarketGeneratedAt=source.generatedAt;
export const nmarketText=(id:number)=>source.descriptions[id]||'';
const captions:Record<string,string>={housemain:'Главное изображение проекта',complexscheme:'Генеральный план',floorplan:'План этажа',plan:'Планировка квартиры',project:'Изображение проекта'};
export const nmarketImageCaption=(tag?:string)=>captions[tag||'project']||'Изображение проекта';
export function nmarketGallery(slug:string){return (nmarketProjectBySlug[slug]?.images||[]).map(i=>({...i,caption:nmarketImageCaption(i.tag),category:i.tag==='complexscheme'?'Генеральный план':'Проект'}));}
export type NmarketUnit=SminexUnit & {floorsTotal?:number;facts?:Record<string,string>;location?:Record<string,string>;buildingId?:string};
const unitSource=read('nmarket-units.json') as {units:(Omit<NmarketUnit,'description'>&{descriptionRef:number})[]};
export const nmarketUnits:NmarketUnit[]=unitSource.units.map(u=>({...u,description:nmarketText(u.descriptionRef)}));
