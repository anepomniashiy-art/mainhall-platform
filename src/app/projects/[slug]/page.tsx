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
 return {title,description:p.summary,alternates:{canonical:`/projects/${p.slug}`},
  openGraph:{title,description:p.summary,url:`/projects/${p.slug}`,type:"article"}};
}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const p=editorialProjects.find(x=>x.slug===slug);if(!p)notFound();
 return <div className="bg-[#F8F7F4] text-[#242D26]">
  <div className="mx-auto max-w-7xl px-5 pt-10"><Link href="/projects" className="text-xs uppercase tracking-widest text-[#667B69]">← Все проекты</Link></div>
  <header className="mx-auto max-w-7xl px-5 py-16 md:py-24"><p className="text-xs uppercase tracking-[.3em] text-[#6E806E]">{p.className} / {p.area}</p><h1 className="mt-5 font-serif text-6xl md:text-8xl">{p.name}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#657066]">{p.summary}</p></header>
  <div className="bg-[#D9DED6] mx-auto max-w-7xl min-h-[260px] md:min-h-[420px] flex items-center justify-center"><div className="text-center text-[#6E7C70]"><div className="font-serif text-4xl mb-3">{p.name}</div><p className="text-sm">Фотографии от девелопера — ожидаем подтверждения прав использования</p></div></div>
  <div className="mx-auto max-w-7xl px-5 py-16 grid gap-14 lg:grid-cols-[1.5fr_1fr]">
   <div><p className="text-xs uppercase tracking-[.25em] text-[#67806A]">Инвестиционный взгляд</p><h2 className="font-serif text-4xl mt-4">В чём потенциальная ценность</h2><p className="mt-6 text-lg leading-8 text-[#465349]">{p.thesis}</p><h3 className="font-serif text-3xl mt-14">Что необходимо проверить</h3><ul className="mt-7 space-y-4">{p.dueDiligence.map((x,i)=><li className="border-t border-[#CBD1C7] py-4 flex gap-5" key={x}><span className="text-[#738570] text-sm">{String(i+1).padStart(2,"0")}</span><span>{x}</span></li>)}</ul></div>
   <aside className="bg-white border border-[#DAE0D7] self-start p-8"><p className="text-xs tracking-widest uppercase text-[#758272]">Данные и подтверждения</p><dl className="mt-6 space-y-5 text-sm"><div><dt className="text-[#849185]">Девелопер</dt><dd className="font-medium mt-1">{p.developer}</dd></div><div><dt className="text-[#849185]">Цена за м²</dt><dd className="font-medium mt-1">Проверяется</dd></div><div><dt className="text-[#849185]">Свободные квартиры</dt><dd className="font-medium mt-1">Проверяется</dd></div><div><dt className="text-[#849185]">Доходность</dt><dd className="font-medium mt-1">Недостаточно данных для расчёта</dd></div></dl><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex text-sm font-medium border-b border-[#58715B] py-2">Официальный сайт девелопера ↗</a><p className="text-xs text-[#79877C] leading-5 mt-7">Информация носит справочный характер. Отсутствие цены не означает отсутствие предложения.</p></aside>
  </div>
  <div className="bg-[#19271F] text-[#E9EDE6] py-16"><div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row md:items-center justify-between gap-8"><div><p className="text-xs tracking-widest uppercase text-[#A9BAAA]">MAINHALL Advisory</p><h2 className="font-serif text-3xl mt-3">Запросить инвестиционный разбор</h2></div><Link href="/#contact" className="border border-[#C7D5C5] px-8 py-4 text-sm text-center hover:bg-white hover:text-[#19271F] transition-colors">Обсудить стратегию ↗</Link></div></div>
 </div>;
}