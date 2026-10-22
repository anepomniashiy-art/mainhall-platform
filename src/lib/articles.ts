import fs from "node:fs";
import path from "node:path";
import {articles as legacyArticles,type Article} from "./site-content";
const directory=path.join(process.cwd(),"data/editorial/articles");
const generated:Article[]=fs.existsSync(directory)?fs.readdirSync(directory).filter(f=>f.endsWith(".json")).flatMap(file=>{const value=JSON.parse(fs.readFileSync(path.join(directory,file),"utf8"));return Array.isArray(value)?value:[value];}):[];
export const articles:Article[]=[...legacyArticles.map(a=>({...a,author:a.author||"Редакция MAINHALL",publishedAt:a.publishedAt||"2026-10-20",updatedAt:a.updatedAt||"2026-10-20"})),...generated].sort((a,b)=>(b.publishedAt||"").localeCompare(a.publishedAt||""));
const slugs=new Set<string>();
for(const a of articles){if(slugs.has(a.slug))throw new Error("Duplicate article slug: "+a.slug);slugs.add(a.slug);if(!a.author||!a.publishedAt||!a.updatedAt||!a.sections?.length)throw new Error("Incomplete article: "+a.slug);}
export function articleDate(value:string){return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Moscow"}).format(new Date(value.length===10?value+"T12:00:00Z":value));}
