import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {districts} from "@/lib/site-content";
import {projectDossiers} from "@/lib/project-dossiers";
import {pageMetadata} from "@/lib/seo";
import {projectImages} from "@/lib/project-images";
import {Breadcrumbs,EditorialHeader,EditorialShell,EditorialImage,ContentSections,ProjectGrid,Questions,SelectionContact} from "@/components/Editorial";
export function generateStaticParams(){return districts.map(d=>({slug:d.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const d=districts.find(d=>d.slug===slug);return d?pageMetadata(d.title,d.description,"/districts/"+slug+"/",projectImages[d.image].src):{title:"Локация не найдена",robots:{index:false}};}
export default async function DistrictPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=districts.find(d=>d.slug===slug);if(!d)notFound();return <EditorialShell><Breadcrumbs items={[{name:"Районы",href:"/districts/"},{name:d.name,href:"/districts/"+slug+"/"}]}/><EditorialHeader eyebrow="ЛОКАЦИИ МОСКВЫ" title={d.title} description={d.description}/><EditorialImage slug={d.image}/><div className="mh-content-layout"><ContentSections sections={d.sections}/><aside className="mh-reading-aside"><p className="mh-eyebrow">В ЭТОЙ ЛОКАЦИИ</p>{d.projects.map(p=><Link key={p} href={"/projects/"+p+"/"}>{projectDossiers[p]?.address} ↗</Link>)}<Link href="/installments/">Рассчитать график оплаты ↗</Link><p>Редакционный обзор MAINHALL. Данные о проектах проверены 20 октября 2026 года. Цены и наличие уточняем на дату запроса.</p></aside></div><section className="mh-related"><h2>Проекты в локации</h2><ProjectGrid slugs={d.projects}/></section><Questions items={d.questions}/><SelectionContact context={"подбор в локации "+d.name}/><Link href="/districts/" className="mh-text-link">Сравнить с другими локациями ↗</Link></EditorialShell>;}
