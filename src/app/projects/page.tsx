"use client";
import Link from "next/link";
import {useMemo, useState} from "react";
import {editorialProjects} from "@/lib/editorial-projects";
const types = ["Все классы","Бизнес+","Премиум","Элитная"];
export default function ProjectsPage() {
 const [q,setQ]=useState(""); const [segment,setSegment]=useState("Все классы"); const [sort,setSort]=useState("name");
 const filtered=useMemo(()=>editorialProjects.filter(p=>(p.name+" "+p.developer+" "+p.area).toLowerCase().includes(q.toLowerCase()) && (segment==="Все классы" || p.className===segment)).sort((a,b)=>sort==="area"?a.area.localeCompare(b.area,"ru"):a.name.localeCompare(b.name,"ru")),[q,segment,sort]);
 return <div className="min-h-screen bg-[#F8F7F4]">
  <header className="bg-[#171915] text-[#F4F3ED]"><div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
   <div className="text-[11px] uppercase tracking-[.35em] text-[#B1BAA7]">MAINHALL / Исследование рынка</div>
   <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-[1.08] md:text-7xl">Выбираем актив.<br/><span className="italic text-[#BAC6B2]">Не просто адрес.</span></h1>
   <p className="mt-7 max-w-2xl text-[#C9CEC5] leading-7">Подбор жилых комплексов бизнес+ и выше. Исследуем сценарии роста, ликвидность, аренду, затраты и риски. Описания проектов не являются подтверждением наличия квартир.</p>
  </div></header>
  <section className="mx-auto max-w-7xl px-5 py-12">
   <div className="flex flex-wrap items-end gap-4 border-b border-[#D5D7D1] pb-7">
    <label className="flex-1 min-w-[230px]"><span className="block text-xs uppercase tracking-widest mb-2 text-[#616961]">Название, район, девелопер</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по проектам" className="w-full rounded-none border border-[#CACFC6] bg-white p-3 text-sm outline-offset-2"/></label>
    <label className="min-w-[170px]"><span className="block text-xs uppercase tracking-widest mb-2 text-[#616961]">Сегмент</span><select value={segment} onChange={e=>setSegment(e.target.value)} className="w-full border border-[#CACFC6] bg-white p-3 text-sm">{types.map(t=><option key={t}>{t}</option>)}</select></label>
    <label className="min-w-[170px]"><span className="block text-xs uppercase tracking-widest mb-2 text-[#616961]">Сортировка</span><select value={sort} onChange={e=>setSort(e.target.value)} className="w-full border border-[#CACFC6] bg-white p-3 text-sm"><option value="name">По названию</option><option value="area">По району</option></select></label>
   </div>
   <div className="flex flex-col sm:flex-row justify-between gap-3 py-7 text-sm text-[#555E54]"><p>Редакционный реестр: {filtered.length} проектов</p><p>Фильтр инвестпредложений: от 600 000 ₽/м² — после подключения проверенных прайсов</p></div>
   <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    {filtered.map((p,i)=><Link href={"/projects/"+p.slug} key={p.slug} className="group flex flex-col border border-[#DFE1DA] bg-white hover:border-[#879586] transition-colors">
      <div className="relative flex aspect-[1.45] items-end overflow-hidden bg-[#DBDFD8] p-6"><div className="absolute inset-0 opacity-40" style={{background:"linear-gradient(125deg, transparent 34%, #88988a 35%,transparent 36%, transparent 63%, #a3b0a1 64%, transparent 65%)"}}/><div className="relative z-10"><span className="text-xs uppercase tracking-[.25em] text-[#405345]">MAINHALL / {String(i+1).padStart(2,"0")}</span><h2 className="mt-2 font-serif text-3xl text-[#283B2E]">{p.name}</h2></div><span className="absolute right-5 top-5 text-[10px] uppercase tracking-wide text-[#405345]">Фото уточняется</span></div>
      <div className="flex flex-1 flex-col p-6"><p className="text-xs uppercase tracking-widest text-[#71806F]">{p.className} · {p.area}</p><p className="mt-3 text-sm text-[#4D544E]">{p.summary}</p><div className="mt-auto pt-8 flex items-end justify-between"><div><p className="text-xs text-[#80877E]">Девелопер</p><p className="text-sm font-medium">{p.developer}</p></div><span className="text-sm text-[#48604E] group-hover:translate-x-1 transition-transform">Подробнее ↗</span></div></div>
    </Link>)}
   </div>
   {!filtered.length && <p className="py-20 text-center text-[#677266]">По этому запросу проекты не найдены.</p>}
   <div className="mt-12 border-t border-[#D5D7D1] pt-7 text-sm leading-6 text-[#6C756B]">Цены, доступность и доходность публикуются только с указанием проверенного источника и даты. Раздел не является публичной офертой. Изображения проектов появятся после получения прав на использование.</div>
  </section>
 </div>;
}