import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
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
 return <article className="mh-project-detail mh-pad">
  <Link href="/projects/" className="mh-eyebrow">← ПРОЕКТЫ</Link>
  <header className="pt-14"><p className="mh-eyebrow">{p.className} / {p.area}</p><h1>{p.name}</h1><p className="max-w-2xl text-base leading-7 text-[#666a60]">{p.summary}</p></header>
  <div className="mh-detail-layout"><section><p className="mh-eyebrow">01 / ПЕРСПЕКТИВА</p><h2 className="mt-6">В фокусе MAINHALL</h2><p>{p.thesis}</p><ul className="mt-10">{p.dueDiligence.map(x=><li key={x}>{x}</li>)}</ul></section><aside><p className="mh-eyebrow mb-6">О ПРОЕКТЕ</p><dl><div><dt>Девелопер</dt><dd>{p.developer}</dd></div><div><dt>Район</dt><dd>{p.area}</dd></div><div><dt>Класс</dt><dd>{p.className}</dd></div><div><dt>Цены и наличие</dt><dd>По запросу</dd></div></dl><Link href="/#contact" className="mh-text-link">Получить подборку квартир ↗</Link></aside></div>
  <div className="mh-detail-contact"><h2>Рассмотрим ближе?</h2><Link href="/#contact" className="mh-text-link">Связаться с MAINHALL ↗</Link></div>
 </article>;
}
